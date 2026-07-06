# NVIDIA SkillSpector Audit Fix — 2026-06-18

**Source**: CHAT.md in Downloads (actually SkillSpector audit report, 238 findings)
**Scope**: 8 real issues across 12 files, fixed in 2 waves of parallel delegate_task

## Findings Fixed

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 1 | Sandbox claim misleading + no warning on code exec | code-executor.js, self-initiator.js, code-planner.js, code-writer.js | Added console.warn warnings, removed "sandbox" from descriptions, added @permission JSDoc |
| 2 | memory-inject says read-only but writes lastAccessed | heartflow-memory-inject.js | Wrapped lastAccessed update in `if (process.env.HEARTFLOW_DEBUG)` |
| 3 | stance-detector uses model response as user input | response-interceptor.js, heartflow.js | Added 4th param `originalUserInput`, fallback prefers user input |
| 4 | idleTime always near zero (lastCheck before calculation) | agent-philosophy.js | Moved lastCheck assignment after idleTime calculation |
| 5 | associateWord mutates state during read | lexical-associator.js | Changed associateSequence/compoundQuery to call getAssociations (read-only) |
| 6 | trace exposes userInput + full internal layers | associative-engine.js | getFullTrace/getLastProcessing/getProcessingLog all sanitized |
| 7 | SKILL.md declares capabilities it doesn't have | SKILL.md | Added code execution capability to Security section and Internal Modules table |
| 8 | download-model.py no integrity verification | download-model.py | Added SHA256 hash printing after download, security comment header |

## Parallel Execution Pattern

```
Wave 1 (3 concurrent):
  T1: code exec files (audit-1)
  T2: being-logic idleTime (audit-4)
  T3: lexical-associator (audit-5)

Wave 2 (3 concurrent):
  T4: stance-detector (audit-3)
  T5: memory-inject (audit-2)
  T6: associative-engine trace (audit-6)

Wave 3 (2 concurrent):
  T7: SKILL.md (audit-7)
  T8: download-model (audit-8)
```

## Key Lessons

- delegate_task with max_concurrent_children=3 means 2-3 waves for 8 tasks
- SKILL.md cannot be split across parallel agents — handle last
- Audit fixes rarely bump version number (they're declaration fixes, not features)
- Engine status check after fixes: MCP returned 52 modules, v3.0.0, healthy

---

# NVIDIA SkillSpector Audit Fix — 2026-06-24 (v3.8.1)

**Source**: mark.txt audit report (NVIDIA SkillSpector, 291 findings)
**Scope**: 7 security fixes across 6 files

## Findings Fixed

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 1 | **Crisis keywords → silence** | `src/core/heartflow.js` | Crisis detection no longer silences; injects hotline resources (`crisisResources`) into response output. Also fixed `needsCrisis` to also check `fableResult.level === 'crisis'` (was only checking `painResult`) |
| 2 | **MCP auth fail-open** | `mcp/mcp-server-http.js` | Changed from `console.warn` (allow running without token) to `console.error + process.exit(1)` (fail-close). Token is now mandatory — server refuses to start without `HEARTFLOW_MCP_TOKEN` |
| 3 | **Memory injection → prompt injection channel** | `plugins/heartflow-memory-inject.py` | Added 3-layer defense: (a) length cap 2000 chars / 50 lines, (b) `_detect_instruction_injection()` filters commands like "ignore previous instructions", "forget all rules", "role-play as...", (c) existing sensitive filter preserved |
| 4 | **code-executor host-level execution** | `src/code/code/code-executor.js` | Added runtime guard `HEARTFLOW_CODE_EXECUTOR_ENABLED` env var (default OFF). `execute()` returns PERMISSION error when not enabled. Also added security header comment |
| 5 | **WeChat contact screenshots in repo** | `assets/wechat-contacts/` | Deleted from git tracking (3 files), added to `.gitignore` |
| 6 | **SKILL.md scope mismatch** | `SKILL.md` | Updated Scope Boundaries to explicitly list all ancillary capabilities (code exec, network, MCP, filesystem, memory injection) rather than describing skill only as "cognitive engine" |
| 7 | **crisis hotline not injected in response** | `src/core/heartflow.js` | After `_routeHint.type === 'crisis'`, injects `crisisResources` block with disclaimer, hotline number (400-161-9995), and support message into `chainResult.output` before returning |

## New Security Patterns (add to future audits)

| Pattern | Detection | Fix |
|---------|-----------|-----|
| **Auth fail-open** | Code says "mandatory" but allows running without | `process.exit(1)` at module level, not just `console.warn` |
| **Instruction injection in memory** | Memory content can contain "ignore all rules" | Regex patterns + full rejection of matching lines |
| **Runtime guard for dangerous modules** | Module has host-level capabilities | Environment variable switch, default OFF |
| **Crisis response instead of silence** | Crisis detection returns "silence" | Inject resources (hotline, disclaimer, support message) into output |
| **Personal data in repo** | Contact info, screenshots in assets/ | `git rm --cached` + `.gitignore` rule |
