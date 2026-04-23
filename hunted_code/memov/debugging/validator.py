"""
Validator for reviewing and aligning prompts with code changes.

This module provides functionality to:
1. Extract actual code changes from commits
2. Compare intended changes (from prompts) with actual changes
3. Identify alignment issues and potential context drift
4. Generate review reports for debugging
"""

import logging
import re
from dataclasses import dataclass
from typing import Any, Optional

from memov.core.git import GitManager
from memov.core.manager import MemovManager

LOGGER = logging.getLogger(__name__)


@dataclass
class FileChange:
    """Represents a change to a single file."""

    file_path: str
    change_type: str  # "added", "modified", "deleted"
    additions: int
    deletions: int
    diff: str


@dataclass
class ValidationResult:
    """Result of validating a commit against its prompt."""

    commit_hash: str
    is_aligned: bool
    alignment_score: float  # 0.0 to 1.0
    prompt: Optional[str]
    response: Optional[str]
    agent_plan: Optional[str]
    actual_changes: list[FileChange]
    expected_files: list[str]
    unexpected_files: list[str]
    missing_files: list[str]
    issues: list[str]
    recommendations: list[str]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "commit_hash": self.commit_hash,
            "is_aligned": self.is_aligned,
            "alignment_score": self.alignment_score,
            "prompt": self.prompt,
            "response": self.response,
            "agent_plan": self.agent_plan,
            "actual_changes": [
                {
                    "file_path": fc.file_path,
                    "change_type": fc.change_type,
                    "additions": fc.additions,
                    "deletions": fc.deletions,
                    "diff_lines": len(fc.diff.splitlines()),
                }
                for fc in self.actual_changes
            ],
            "expected_files": self.expected_files,
            "unexpected_files": self.unexpected_files,
            "missing_files": self.missing_files,
            "issues": self.issues,
            "recommendations": self.recommendations,
        }


class DebugValidator:
    """Validator for debugging MCP operations."""

    def __init__(self, memov_manager: MemovManager):
        """Initialize the validator with a MemovManager instance."""
        self.manager = memov_manager
        self.bare_repo_path = memov_manager.bare_repo_path
        self.project_path = memov_manager.project_path

    def validate_commit(self, commit_hash: str) -> ValidationResult:
        """
        Validate a commit by comparing prompt/response with actual changes.

        Args:
            commit_hash: The commit hash to validate

        Returns:
            ValidationResult with alignment analysis
        """
        try:
            # Get commit message and extract metadata
            commit_msg = GitManager.get_commit_message(self.bare_repo_path, commit_hash)
            prompt, response, agent_plan = self._extract_metadata(commit_msg, commit_hash)

            # Get actual file changes
            actual_changes = self._get_actual_changes(commit_hash)

            # Extract expected files from prompt and agent_plan
            expected_files = self._extract_expected_files(prompt, response, agent_plan)

            # Compare expected vs actual
            actual_file_paths = {fc.file_path for fc in actual_changes}
            unexpected_files = list(actual_file_paths - set(expected_files))
            missing_files = list(set(expected_files) - actual_file_paths)

            # Analyze alignment
            issues = []
            recommendations = []
            alignment_score = self._calculate_alignment_score(
                expected_files, actual_file_paths, actual_changes, prompt, agent_plan
            )

            # Generate issues and recommendations
            if unexpected_files:
                issues.append(
                    f"Unexpected files modified: {', '.join(unexpected_files[:3])}"
                    + (f" and {len(unexpected_files) - 3} more" if len(unexpected_files) > 3 else "")
                )
                recommendations.append(
                    "Review if these unexpected changes were intentional or indicate context drift"
                )

            if missing_files:
                issues.append(
                    f"Expected files not modified: {', '.join(missing_files[:3])}"
                    + (f" and {len(missing_files) - 3} more" if len(missing_files) > 3 else "")
                )
                recommendations.append(
                    "Verify if these files were actually intended to be changed"
                )

            # Check if prompt/response are too vague
            if prompt and len(prompt.split()) < 5:
                issues.append("Prompt is very short and may lack context")
                recommendations.append("Provide more detailed prompts for better tracking")

            # Check for large changes
            total_changes = sum(fc.additions + fc.deletions for fc in actual_changes)
            if total_changes > 500:
                issues.append(f"Large change detected: {total_changes} lines modified")
                recommendations.append("Consider breaking large changes into smaller commits")

            is_aligned = alignment_score >= 0.7 and len(issues) <= 2

            return ValidationResult(
                commit_hash=commit_hash,
                is_aligned=is_aligned,
                alignment_score=alignment_score,
                prompt=prompt,
                response=response,
                agent_plan=agent_plan,
                actual_changes=actual_changes,
                expected_files=expected_files,
                unexpected_files=unexpected_files,
                missing_files=missing_files,
                issues=issues,
                recommendations=recommendations,
            )

        except Exception as e:
            LOGGER.error(f"Error validating commit {commit_hash}: {e}")
            return ValidationResult(
                commit_hash=commit_hash,
                is_aligned=False,
                alignment_score=0.0,
                prompt=None,
                response=None,
                agent_plan=None,
                actual_changes=[],
                expected_files=[],
                unexpected_files=[],
                missing_files=[],
                issues=[f"Validation error: {str(e)}"],
                recommendations=["Check if commit exists and is accessible"],
            )

    def validate_recent_commits(self, n: int = 5) -> list[ValidationResult]:
        """
        Validate the most recent n commits.

        Args:
            n: Number of recent commits to validate

        Returns:
            List of ValidationResults
        """
        try:
            head_commit = GitManager.get_commit_id_by_ref(
                self.bare_repo_path, "refs/memov/HEAD", verbose=False
            )
            if not head_commit:
                LOGGER.warning("No HEAD commit found")
                return []

            commit_history = GitManager.get_commit_history(self.bare_repo_path, head_commit)
            recent_commits = commit_history[:n]

            results = []
            for commit_hash in recent_commits:
                result = self.validate_commit(commit_hash)
                results.append(result)

            return results

        except Exception as e:
            LOGGER.error(f"Error validating recent commits: {e}")
            return []

    def generate_report(self, validation_results: list[ValidationResult]) -> str:
        """
        Generate a human-readable report from validation results.

        Args:
            validation_results: List of ValidationResults

        Returns:
            Formatted report string
        """
        lines = []
        lines.append("=" * 80)
        lines.append("MEMOV VALIDATION REPORT")
        lines.append("=" * 80)
        lines.append("")

        if not validation_results:
            lines.append("No validation results to display.")
            return "\n".join(lines)

        # Summary
        total = len(validation_results)
        aligned = sum(1 for r in validation_results if r.is_aligned)
        avg_score = sum(r.alignment_score for r in validation_results) / total

        lines.append(f"Total Commits Validated: {total}")
        lines.append(f"Aligned Commits: {aligned} ({aligned/total*100:.1f}%)")
        lines.append(f"Average Alignment Score: {avg_score:.2f}")
        lines.append("")
        lines.append("-" * 80)
        lines.append("")

        # Individual results
        for i, result in enumerate(validation_results, 1):
            lines.append(f"[{i}] Commit: {result.commit_hash[:8]}")
            lines.append(f"    Aligned: {'✓ Yes' if result.is_aligned else '✗ No'}")
            lines.append(f"    Score: {result.alignment_score:.2f}")

            if result.prompt:
                prompt_preview = (
                    result.prompt[:80] + "..." if len(result.prompt) > 80 else result.prompt
                )
                lines.append(f"    Prompt: {prompt_preview}")

            lines.append(f"    Files Changed: {len(result.actual_changes)}")

            if result.unexpected_files:
                lines.append(
                    f"    Unexpected: {', '.join(result.unexpected_files[:3])}"
                    + (
                        f" (+{len(result.unexpected_files)-3} more)"
                        if len(result.unexpected_files) > 3
                        else ""
                    )
                )

            if result.missing_files:
                lines.append(
                    f"    Missing: {', '.join(result.missing_files[:3])}"
                    + (
                        f" (+{len(result.missing_files)-3} more)"
                        if len(result.missing_files) > 3
                        else ""
                    )
                )

            if result.issues:
                lines.append(f"    Issues ({len(result.issues)}):")
                for issue in result.issues[:3]:
                    lines.append(f"      • {issue}")
                if len(result.issues) > 3:
                    lines.append(f"      ... and {len(result.issues) - 3} more")

            if result.recommendations:
                lines.append(f"    Recommendations ({len(result.recommendations)}):")
                for rec in result.recommendations[:2]:
                    lines.append(f"      → {rec}")
                if len(result.recommendations) > 2:
                    lines.append(f"      ... and {len(result.recommendations) - 2} more")

            lines.append("")

        lines.append("=" * 80)

        return "\n".join(lines)

    def _extract_metadata(
        self, commit_msg: str, commit_hash: str
    ) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """Extract prompt, response, and agent_plan from commit message or git notes."""
        prompt = None
        response = None
        agent_plan = None

        # Try commit message first
        for line in commit_msg.splitlines():
            if line.startswith("Prompt:"):
                prompt = line[len("Prompt:") :].strip()
            elif line.startswith("Response:"):
                response = line[len("Response:") :].strip()
            elif line.startswith("Agent Plan:") or line.startswith("Plan:"):
                agent_plan = line.split(":", 1)[1].strip()

        # Check git notes (higher priority)
        note_content = GitManager.get_commit_note(self.bare_repo_path, commit_hash)
        if note_content:
            for line in note_content.splitlines():
                if line.startswith("Prompt:"):
                    prompt = line[len("Prompt:") :].strip()
                elif line.startswith("Response:"):
                    response = line[len("Response:") :].strip()
                elif line.startswith("Agent Plan:") or line.startswith("Plan:"):
                    agent_plan = line.split(":", 1)[1].strip()

        return prompt, response, agent_plan

    def _get_actual_changes(self, commit_hash: str) -> list[FileChange]:
        """Get actual file changes in a commit."""
        changes = []

        try:
            # Get files in this commit
            tracked_files, _ = GitManager.get_files_by_commit(self.bare_repo_path, commit_hash)

            # Get parent commit
            commit_history = GitManager.get_commit_history(self.bare_repo_path, commit_hash)
            parent_hash = commit_history[1] if len(commit_history) > 1 else None

            if parent_hash:
                parent_files, _ = GitManager.get_files_by_commit(self.bare_repo_path, parent_hash)
            else:
                parent_files = []

            # Determine change types
            tracked_set = set(tracked_files)
            parent_set = set(parent_files)

            added_files = tracked_set - parent_set
            deleted_files = parent_set - tracked_set
            modified_files = tracked_set & parent_set

            # Create FileChange objects
            for file_path in added_files:
                changes.append(
                    FileChange(
                        file_path=file_path,
                        change_type="added",
                        additions=0,  # Could be computed from blob
                        deletions=0,
                        diff="[New file]",
                    )
                )

            for file_path in deleted_files:
                changes.append(
                    FileChange(
                        file_path=file_path,
                        change_type="deleted",
                        additions=0,
                        deletions=0,
                        diff="[Deleted file]",
                    )
                )

            for file_path in modified_files:
                # For now, we mark as modified without computing detailed diff
                # In the future, could use git diff to get exact line changes
                changes.append(
                    FileChange(
                        file_path=file_path,
                        change_type="modified",
                        additions=0,
                        deletions=0,
                        diff="[Modified]",
                    )
                )

        except Exception as e:
            LOGGER.warning(f"Error getting actual changes for {commit_hash}: {e}")

        return changes

    def _extract_expected_files(
        self, prompt: Optional[str], response: Optional[str], agent_plan: Optional[str]
    ) -> list[str]:
        """Extract expected file paths from prompt, response, and agent_plan."""
        expected_files = set()

        # Common file path patterns
        # Match common extensions and path structures
        file_pattern = re.compile(
            r"(?:^|[\s,\(\)\[\]`'\"])"  # Start or whitespace/punctuation
            r"([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)"  # filename.ext
            r"(?:$|[\s,\(\)\[\]`'\"])",  # End or whitespace/punctuation
            re.MULTILINE,
        )

        # Also match explicit file references
        explicit_pattern = re.compile(
            r"(?:file|files|in|modify|update|change|create|add|edit)[\s:]+([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)",
            re.IGNORECASE,
        )

        texts = []
        if prompt:
            texts.append(prompt)
        if response:
            texts.append(response)
        if agent_plan:
            texts.append(agent_plan)

        for text in texts:
            # Find file patterns
            for match in file_pattern.finditer(text):
                file_path = match.group(1)
                # Filter out common false positives
                if not any(
                    file_path.startswith(prefix)
                    for prefix in ["http://", "https://", "file://", "ftp://"]
                ):
                    expected_files.add(file_path)

            # Find explicit references
            for match in explicit_pattern.finditer(text):
                file_path = match.group(1)
                expected_files.add(file_path)

        return list(expected_files)

    def _calculate_alignment_score(
        self,
        expected_files: list[str],
        actual_files: set[str],
        actual_changes: list[FileChange],
        prompt: Optional[str],
        agent_plan: Optional[str],
    ) -> float:
        """
        Calculate alignment score (0.0 to 1.0) based on multiple factors.

        Factors:
        - File overlap (expected vs actual)
        - Prompt clarity (length and specificity)
        - Agent plan presence
        - Change size reasonableness
        """
        score = 0.0
        weights = []

        # Factor 1: File overlap (40% weight)
        if expected_files:
            expected_set = set(expected_files)
            overlap = len(expected_set & actual_files)
            file_score = overlap / max(len(expected_set), len(actual_files))
            score += file_score * 0.4
            weights.append(0.4)
        else:
            # No expected files extracted - neutral
            score += 0.3 * 0.4
            weights.append(0.4)

        # Factor 2: Prompt quality (30% weight)
        if prompt:
            prompt_words = len(prompt.split())
            if prompt_words >= 10:
                prompt_score = 1.0
            elif prompt_words >= 5:
                prompt_score = 0.7
            else:
                prompt_score = 0.4
            score += prompt_score * 0.3
            weights.append(0.3)

        # Factor 3: Agent plan presence (15% weight)
        if agent_plan and len(agent_plan.strip()) > 0:
            score += 1.0 * 0.15
        weights.append(0.15)

        # Factor 4: Change size reasonableness (15% weight)
        total_files = len(actual_changes)
        if 1 <= total_files <= 5:
            size_score = 1.0
        elif 5 < total_files <= 10:
            size_score = 0.8
        elif total_files == 0:
            size_score = 0.5
        else:
            size_score = 0.6
        score += size_score * 0.15
        weights.append(0.15)

        # Normalize score
        total_weight = sum(weights)
        if total_weight > 0:
            score = score / total_weight

        return min(1.0, max(0.0, score))
