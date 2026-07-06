# NVIDIA SkillSpector Audit Fix — Round 2 (2026-06-24)

**Source**: `/Users/apple/Pictures/mark.txt` (NVIDIA SkillSpector audit report, 26 findings)
**Scope**: Description-Behavior Mismatch + Context-Inappropriate Capability fixes across 6 files

## Findings Fixed

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 1 | **Synthetic log generation** (evaluation gaming) | `scripts/generate-thinkcheck-log.js` | **Deleted** entire file — not disabled, not marked, removed from codebase |
| 2 | **Scoring manipulation documentation** | `references/thinkcheck-optimization-plan.md` | **Deleted** entire file — plan described how to inflate ThinkCheck A-values |
| 3 | **Synthetic log output files** | `references/hf-tc-combined.txt`, `references/heartflow-structured-log-v2.txt` | **Deleted** — pre-generated fake CoT traces |
| 4 | **Memory injection auto-enabled** (prompt injection risk) | `plugins/heartflow-memory-inject.py` | Changed to **opt-in** — requires `heartflow_memory_inject: true` in config or user saying "注入记忆" |
| 5 | **SKILL.md declares 34 non-existent module paths** | `SKILL.md` | **Rewritten** — module paths table removed, replaced with actual directory structure. Honest capability boundary declaration |
| 6 | **SKILL.md duplicate in openclaw-imports** | `openclaw-imports/heartflow/SKILL.md` | **Rewritten** — short redirect to actual code location |
| 7 | **MCP tools with inflated descriptions** (translate, agent_think, bridge_status, code_quality) | `mcp/mcp-server-http.js` | **Removed 4 tools** from TOOLS array + deleted handler functions + removed from HANDLERS map |
| 8 | **Unauthenticated remote model download** | `scripts/download-model.py` | **Deleted** — downloaded models without integrity verification |
| 9 | **Synthetic CoT trace code in thinkcheck-logger.js** | `src/shield/thinkcheck-logger.js` | Kept (logger itself is legitimate — it was the standalone generator script that was the problem) |

## Key Lessons

1. **Synthetic log generators must be deleted, not disabled** — disabling can be reversed
2. **MCP tool descriptions are a contract** — if they claim capabilities beyond the SKILL.md scope, remove the tool entirely, don't just edit the description
3. **Patch is fragile on large JS files** — `git checkout` recovery is the right pattern. Keep each patch to 5-15 lines
4. **Two SKILL.md locations** — both must be kept in sync or the openclaw-imports version should be a short redirect
5. **Patch + large file = risk of structural corruption** — after each patch, run `node --check`
