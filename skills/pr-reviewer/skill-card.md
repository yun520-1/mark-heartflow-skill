## Description: <br>
Automated GitHub PR code review with diff analysis, lint integration, and structured reports. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[briancolinger](https://clawhub.ai/user/briancolinger) <br>

### License/Terms of Use: <br>


## Use Case: <br>
Developers and engineering teams use this skill to review GitHub pull requests for security findings, error-handling gaps, style issues, test coverage, and optional lint results before merge. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: Reviewing an untrusted pull request could allow attacker-controlled filenames to influence local command execution. <br>
Mitigation: Review or patch filename handling before use, and avoid running the skill on untrusted pull requests until filenames are passed through stdin, JSON, or arguments instead of interpolated into Python source. <br>
Risk: The skill can post generated review content to GitHub pull requests. <br>
Mitigation: Review generated markdown reports before using the post command, and run with least-privilege GitHub credentials. <br>
Risk: The skill writes state and markdown reports to local paths. <br>
Mitigation: Set PR_REVIEW_STATE and PR_REVIEW_OUTDIR to workspace-contained paths before running the skill. <br>


## Reference(s): <br>
- [ClawHub skill page](https://clawhub.ai/briancolinger/pr-reviewer) <br>


## Skill Output: <br>
**Output Type(s):** [analysis, markdown, shell commands, guidance] <br>
**Output Format:** [Markdown reports, GitHub PR comments, and command-line status summaries] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [Writes review state to PR_REVIEW_STATE and markdown reports to PR_REVIEW_OUTDIR when run.] <br>

## Skill Version(s): <br>
1.0.1 (source: frontmatter and server release evidence) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
