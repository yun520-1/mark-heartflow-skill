"""
RAG-based debugger for code analysis with multi-model LLM comparison.

This module combines:
1. RAG search to retrieve relevant code context from VectorDB
2. User logs and error traces
3. Multi-model LLM querying to get diverse debugging insights
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from memov.core.git import GitManager
from memov.core.manager import MemovManager
from memov.debugging.llm_client import LLMClient

logger = logging.getLogger(__name__)


@dataclass
class DebugContext:
    """Context information for debugging."""
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    user_logs: Optional[str] = None
    relevant_commits: List[Dict[str, Any]] = None
    code_snippets: List[Dict[str, Any]] = None


@dataclass
class DebugResult:
    """Result from multi-model debugging analysis."""
    query: str
    context: DebugContext
    llm_responses: List[Dict[str, Any]]
    consensus: Optional[str] = None
    recommendations: List[str] = None


class RAGDebugger:
    """RAG-based debugger with multi-model LLM comparison."""

    def __init__(
        self,
        memov_manager: MemovManager,
        llm_client: Optional[LLMClient] = None,
    ):
        """
        Initialize the RAG debugger.

        Args:
            memov_manager: MemovManager instance for accessing VectorDB
            llm_client: LLMClient instance (optional, will create default if None)
        """
        self.manager = memov_manager
        self.vectordb = memov_manager.vectordb
        self.bare_repo_path = memov_manager.bare_repo_path
        self.project_path = memov_manager.project_path

        # Initialize LLM client
        if llm_client:
            self.llm_client = llm_client
        else:
            try:
                self.llm_client = LLMClient()
            except ImportError:
                logger.warning("LiteLLM not available. Multi-model querying disabled.")
                self.llm_client = None

        logger.info("RAGDebugger initialized")

    def search_relevant_code(
        self,
        query: str,
        n_results: int = 5,
        content_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant code using RAG.

        Args:
            query: Search query (e.g., error message, feature description)
            n_results: Number of results to return
            content_types: Filter by content types (prompt, response, agent_plan)

        Returns:
            List of relevant documents from VectorDB
        """
        try:
            if content_types:
                # Search across multiple content types
                all_results = []
                for content_type in content_types:
                    results = self.vectordb.search_by_content_type(
                        query_text=query,
                        content_type=content_type,
                        n_results=n_results,
                    )
                    all_results.extend(results)

                # Sort by distance and take top n_results
                all_results.sort(key=lambda x: x.get("distance", float("inf")))
                return all_results[:n_results]
            else:
                # Default: search all content
                return self.vectordb.search(query_text=query, n_results=n_results)

        except Exception as e:
            logger.error(f"Error searching relevant code: {e}")
            return []

    def get_commit_details(self, commit_hash: str) -> Dict[str, Any]:
        """
        Get detailed information about a commit.

        Args:
            commit_hash: Commit hash to retrieve

        Returns:
            Dictionary with commit details
        """
        try:
            # Get commit message
            commit_msg = GitManager.get_commit_message(self.bare_repo_path, commit_hash)

            # Get files changed
            files, _ = GitManager.get_files_by_commit(self.bare_repo_path, commit_hash)

            # Parse commit message for metadata
            prompt = response = agent_plan = None
            for line in commit_msg.splitlines():
                if line.startswith("Prompt:"):
                    prompt = line[len("Prompt:"):].strip()
                elif line.startswith("Response:"):
                    response = line[len("Response:"):].strip()
                elif line.startswith("Agent Plan:"):
                    agent_plan = line[len("Agent Plan:"):].strip()

            # Check git notes
            note_content = GitManager.get_commit_note(self.bare_repo_path, commit_hash)
            if note_content:
                for line in note_content.splitlines():
                    if line.startswith("Prompt:"):
                        prompt = line[len("Prompt:"):].strip()
                    elif line.startswith("Response:"):
                        response = line[len("Response:"):].strip()

            return {
                "commit_hash": commit_hash,
                "message": commit_msg,
                "files": files,
                "prompt": prompt,
                "response": response,
                "agent_plan": agent_plan,
            }

        except Exception as e:
            logger.error(f"Error getting commit details: {e}")
            return {"commit_hash": commit_hash, "error": str(e)}

    def build_debug_context(
        self,
        query: str,
        error_message: Optional[str] = None,
        stack_trace: Optional[str] = None,
        user_logs: Optional[str] = None,
        n_results: int = 5,
    ) -> DebugContext:
        """
        Build comprehensive debugging context using RAG.

        Args:
            query: Main debug query
            error_message: Error message if available
            stack_trace: Stack trace if available
            user_logs: User logs if available
            n_results: Number of relevant commits to retrieve

        Returns:
            DebugContext with all gathered information
        """
        # Combine query components for search
        search_query_parts = [query]
        if error_message:
            search_query_parts.append(error_message)
        if stack_trace:
            # Extract key parts from stack trace
            stack_lines = stack_trace.splitlines()[:5]  # First 5 lines
            search_query_parts.extend(stack_lines)

        search_query = "\n".join(search_query_parts)

        # Search for relevant code
        search_results = self.search_relevant_code(
            query=search_query,
            n_results=n_results,
            content_types=["prompt", "response", "agent_plan"],
        )

        # Get commit details for top results
        relevant_commits = []
        seen_commits = set()

        for result in search_results:
            commit_hash = result.get("metadata", {}).get("commit_hash")
            if commit_hash and commit_hash not in seen_commits:
                commit_details = self.get_commit_details(commit_hash)
                commit_details["relevance_score"] = 1.0 - result.get("distance", 1.0)
                relevant_commits.append(commit_details)
                seen_commits.add(commit_hash)

        return DebugContext(
            error_message=error_message,
            stack_trace=stack_trace,
            user_logs=user_logs,
            relevant_commits=relevant_commits,
            code_snippets=search_results,
        )

    def format_context_for_llm(self, context: DebugContext) -> str:
        """
        Format debug context into a prompt for LLMs.

        Args:
            context: DebugContext to format

        Returns:
            Formatted context string
        """
        lines = []

        # Error information
        if context.error_message:
            lines.append("## Error Message")
            lines.append(context.error_message)
            lines.append("")

        if context.stack_trace:
            lines.append("## Stack Trace")
            lines.append("```")
            lines.append(context.stack_trace)
            lines.append("```")
            lines.append("")

        if context.user_logs:
            lines.append("## User Logs")
            lines.append("```")
            lines.append(context.user_logs)
            lines.append("```")
            lines.append("")

        # Relevant code context from RAG
        if context.relevant_commits:
            lines.append("## Relevant Code Changes (from history)")
            lines.append("")

            for i, commit in enumerate(context.relevant_commits[:3], 1):
                lines.append(f"### [{i}] Commit {commit.get('commit_hash', 'unknown')[:8]}")
                lines.append(f"**Relevance:** {commit.get('relevance_score', 0):.2f}")
                lines.append("")

                if commit.get("prompt"):
                    lines.append(f"**Original Prompt:** {commit['prompt'][:200]}")
                    lines.append("")

                if commit.get("agent_plan"):
                    lines.append(f"**Changes Made:** {commit['agent_plan'][:300]}")
                    lines.append("")

                if commit.get("files"):
                    lines.append(f"**Files Modified:** {', '.join(commit['files'][:5])}")
                    lines.append("")

        return "\n".join(lines)

    def debug_with_llm(
        self,
        query: str,
        context: DebugContext,
        models: Optional[List[str]] = None,
        use_async: bool = True,
    ) -> DebugResult:
        """
        Analyze debug issue using multiple LLMs.

        Args:
            query: Debug query
            context: Debug context
            models: List of models to query (optional)
            use_async: Whether to use async parallel querying

        Returns:
            DebugResult with responses from all models
        """
        if not self.llm_client:
            logger.error("LLM client not available")
            return DebugResult(
                query=query,
                context=context,
                llm_responses=[],
                recommendations=["LiteLLM not installed. Install with: pip install litellm"],
            )

        # Format context
        context_str = self.format_context_for_llm(context)

        # Build prompt
        system_prompt = """You are an expert software debugger and code analyst.
Your task is to analyze the provided error information, code context, and history to:
1. Identify the root cause of the issue
2. Suggest specific fixes
3. Recommend preventive measures

Be concise, specific, and actionable in your response."""

        full_prompt = f"""Debug Query: {query}

{context_str}

Please provide:
1. Root cause analysis
2. Specific fix recommendations with code examples if relevant
3. Preventive measures to avoid similar issues
"""

        # Query models
        try:
            if use_async:
                import asyncio
                responses = asyncio.run(
                    self.llm_client.query_multiple_async(
                        prompt=full_prompt,
                        system_prompt=system_prompt,
                        models=models,
                    )
                )
            else:
                responses = self.llm_client.query_multiple(
                    prompt=full_prompt,
                    system_prompt=system_prompt,
                    models=models,
                )

            # Extract recommendations
            recommendations = self._extract_recommendations(responses)

            # Generate consensus if multiple models
            consensus = self._generate_consensus(responses) if len(responses) > 1 else None

            return DebugResult(
                query=query,
                context=context,
                llm_responses=responses,
                consensus=consensus,
                recommendations=recommendations,
            )

        except Exception as e:
            logger.error(f"Error querying LLMs: {e}")
            return DebugResult(
                query=query,
                context=context,
                llm_responses=[],
                recommendations=[f"Error: {str(e)}"],
            )

    def _extract_recommendations(
        self, responses: List[Dict[str, Any]]
    ) -> List[str]:
        """Extract actionable recommendations from LLM responses."""
        recommendations = []

        for resp in responses:
            content = resp.get("content")
            if not content:
                continue

            # Look for numbered lists or bullet points
            lines = content.splitlines()
            for line in lines:
                line = line.strip()
                # Match patterns like "1.", "2.", "-", "*"
                if line and (
                    line[0].isdigit() and ". " in line[:5]
                    or line.startswith("- ")
                    or line.startswith("* ")
                ):
                    recommendations.append(line)

        return recommendations[:10]  # Top 10 recommendations

    def _generate_consensus(
        self, responses: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Generate consensus summary from multiple model responses."""
        valid_responses = [r for r in responses if r.get("content")]

        if len(valid_responses) < 2:
            return None

        # Simple consensus: identify common themes
        # In a production system, you might use another LLM call to synthesize
        consensus_parts = [
            f"Analyzed by {len(valid_responses)} models:",
        ]

        for i, resp in enumerate(valid_responses, 1):
            model = resp.get("model", "Unknown")
            content = resp.get("content", "")
            # First 150 chars
            preview = content[:150] + "..." if len(content) > 150 else content
            consensus_parts.append(f"\n[{model}]: {preview}")

        return "\n".join(consensus_parts)

    def format_debug_result(
        self, result: DebugResult, include_full_responses: bool = True
    ) -> str:
        """
        Format debug result for display.

        Args:
            result: DebugResult to format
            include_full_responses: Whether to include full LLM responses

        Returns:
            Formatted string
        """
        lines = []
        lines.append("=" * 80)
        lines.append("🔍 VIBE DEBUGGING REPORT")
        lines.append("=" * 80)
        lines.append("")

        lines.append(f"Query: {result.query}")
        lines.append("")

        # Context summary
        lines.append("## Context")
        if result.context.error_message:
            lines.append(f"Error: {result.context.error_message[:100]}")
        lines.append(f"Relevant commits found: {len(result.context.relevant_commits or [])}")
        lines.append("")

        # Consensus
        if result.consensus:
            lines.append("## Consensus Summary")
            lines.append(result.consensus)
            lines.append("")

        # Key Recommendations
        if result.recommendations:
            lines.append("## Key Recommendations")
            for i, rec in enumerate(result.recommendations[:5], 1):
                lines.append(f"{i}. {rec}")
            lines.append("")

        # Full responses
        if include_full_responses and result.llm_responses:
            lines.append("## Detailed Analysis by Model")
            lines.append("")

            for resp in result.llm_responses:
                model = resp.get("model", "Unknown")
                content = resp.get("content")
                error = resp.get("error")

                lines.append(f"### {model}")
                lines.append("-" * 80)

                if error:
                    lines.append(f"❌ Error: {error}")
                elif content:
                    lines.append(content)
                else:
                    lines.append("⚠️ No response")

                lines.append("")

        lines.append("=" * 80)

        return "\n".join(lines)
