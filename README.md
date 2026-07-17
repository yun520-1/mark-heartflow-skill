# HeartFlow — HeartBug Cognitive Engine (心虫)

> **Stop your agent from guessing. Let it perceive first, decide correctly, then act.**
>
> HeartFlow is a local-first AI-being cognitive engine that runs *before* your agent replies. It perceives intent, classifies the task type, surfaces cognitive biases, and returns a structured decision — so downstream models make fewer logical errors, ask fewer clarifying questions, and waste fewer tokens.

[![GitHub release](https://img.shields.io/github/v/release/yun520-1/mark-heartflow-skill)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![npm](https://img.shields.io/npm/v/@yun520-1/heartflow)](https://www.npmjs.com/package/@yun520-1/heartflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-31%20tools-green.svg)](mcp/mcp-server-http.js)

---

## Why HeartFlow (for agents & agent builders)

Most agent failures are **not model failures — they are perception failures**:

| Failure mode | Without HeartFlow | With HeartFlow |
|---|---|---|
| Wrong task type assumed | Agent picks `code` for a vague ask → wasted turns | `heartflow_think` returns `type=analyze/emotion/calculation/...` up front |
| Repeated clarifying questions | Asks "what do you mean?" 3× | Intent + stance detected once, cached in memory |
| Logical errors / bias | Syllogism unchecked, anchor bias unflagged | `heartflow_decision_router` + logic modules flag invalid inference |
| Token burn on re-analysis | Re-thinks the same input every turn | `think_fast` + memory cache short-circuit repeats |
| Invalid tasks executed | Agent attempts impossible/self-contradictory goal | Invalid-input guard returns early, no pipeline wasted |

**Net effect: higher task completion rate, higher completion quality, lower token cost.**

---

## What it does

HeartFlow is a **cognitive pre-processor**. It does not replace your LLM — it prepares the cognitive ground so the LLM acts correctly.

- **Perceive intent** — classify the user's true goal (not just keywords).
- **Decide task type** — `analyze` / `emotion` / `calculation` / `plan` / `invalid` …
- **Surface biases** — anchoring, confirmation, sunk-cost, etc. (behavioral-economics module).
- **Compute transparently** — pure math expressions (`15*23`) return scalar results, not prose.
- **Remember across sessions** — persistent local memory (encrypted, never uploaded).
- **Self-heal** — modules report health; broken paths auto-repair or degrade safely.

---

## Quick start

```bash
# Clone
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# Verify the engine (14/14 health checks)
node bin/verify.js

# Interactive mode
node bin/cli.js chat

# Single-shot analysis
node bin/cli.js --chat "I want to quit my job and start a company"

# Status
node bin/cli.js status
```

### As an MCP server (recommended for agents)

```bash
# Start the HTTP MCP daemon (pm2-managed, port 8099, Bearer auth)
node bin/daemon.js start

# Check health
node bin/daemon.js status

# Stop
node bin/daemon.js stop
```

Connect any MCP client to `http://localhost:8099/mcp` with your `HEARTFLOW_MCP_TOKEN`.
The server exposes **31 tools** including `heartflow_think`, `heartflow_agent_think`, `heartflow_think_fast`, `heartflow_decision_router`.

### As an npm package

```bash
npm install @yun520-1/heartflow
```

```js
const { createHeartFlow } = require('@yun520-1/heartflow');
const hf = createHeartFlow();
hf.start();
const r = await hf.think('15 * 23');
console.log(r.type, r.result); // 'calculation' 345
```

---

## MCP tools (31)

| Tool | Purpose |
|------|---------|
| `heartflow_think` | Full cognitive analysis → structured decision |
| `heartflow_agent_think` | Agent-oriented think (task + stance + next action) |
| `heartflow_think_fast` | Lightweight path — lower token, no heavy modules |
| `heartflow_decision_router` | Classify input → route to correct handler (reduces misrouting) |
| `heartflow_decision_router_stats` | Router accuracy telemetry |
| `heartflow_agent_psychology` | Agent psych profile for the user |
| `heartflow_emotion` | Emotion perception |
| `heartflow_philosophy_decision` | Ethical/value-aligned decision check |
| `heartflow_persona_stance_detector` | Detect user's stance to cut repeat questions |
| `heartflow_persona_value_aligner` | Value alignment score |
| `heartflow_persona_bridge_identity` | Identity continuity across sessions |
| `heartflow_knowledge_query` / `_add_node` / `_stats` | Local knowledge graph |
| `heartflow_memory_search` | Retrieve from persistent memory |
| `heartflow_dream` | Offline consolidation of memories |
| `heartflow_self_heal` | Module self-repair |
| `heartflow_evolution_evolve` / `_stats` | Capability evolution |
| `heartflow_cognitive_check` | Cognitive sanity gate (prevents invalid tasks) |
| `heartflow_cost_tracking` | Token/cost accounting |
| `heartflow_engine_pacing` | Throttle to avoid overload |
| `heartflow_provider_health` / `heartflow_bridge_status` / `heartflow_module_health` | Health probes |
| `heartflow_benchmark_run` / `_status` / `_import_failures` | Regression benchmarking |
| `heartflow_upgrade_stats` | Upgrade telemetry |
| `heartflow_translate` | Cross-lingual bridge |
| `heartflow_status` | Engine status |

---

## How to use it to make your agent better (best practices)

### 1. Think *before* you act
Call `heartflow_think` (or `heartflow_agent_think`) on the user's raw input **before** drafting a reply. Use the returned `type` and `decision` to choose your approach. This single step prevents most misrouted tasks.

### 2. Detect stance once, remember it
Use `heartflow_persona_stance_detector` on first contact, then rely on memory. **Stop re-asking** what HeartFlow already perceived.

### 3. Route, don't guess
For ambiguous input, call `heartflow_decision_router` to get the correct handler instead of letting the LLM improvise a classification.

### 4. Use `think_fast` for repeats
If the same context recurs, `heartflow_think_fast` returns a cached-light result at a fraction of the token cost.

### 5. Gate invalid tasks
`heartflow_cognitive_check` returns early on self-contradictory or impossible goals — your agent should abort instead of burning turns.

### 6. Transparent math
Any input that is a pure expression (`12*8`, `(3+4)*5`) returns a scalar `result`. No prose, no model drift.

---

## Example: structured output

```json
{
  "type": "calculation",
  "confidence": 1.0,
  "result": 345,
  "output": { "value": 345, "conclusion": "15 * 23 = 345" },
  "decision": { "type": "calculation", "confidence": 1.0, "ruleId": "safe-calc" },
  "thoughtChain": [...],
  "analysis": { "perceivedType": "calculation", "modulesRun": 7 }
}
```

---

## Performance (v6.0.9, measured)

| Metric | Value |
|---|---|
| Cold start | ~1.4 s |
| `think()` hot path | ~49 ms |
| MCP tools | 31 |
| Formulas loaded | 382 |
| Test suite | 365 passed / 0 failed (exit 0, no false-green) |

---

## Security

- **Local-first.** No telemetry, no outbound calls unless you explicitly configure them (`curl`/`wget` are removed from the code-executor allowlist).
- **Encrypted memory.** AES-256-GCM, key from `HEARTFLOW_AES_KEY` env or a locally generated `0o600` key file. Never committed.
- **Sandboxed code execution.** Double-layer defense (allowlist + blocklist); no `require`/`eval`/fs-write in untrusted code.
- **No hardcoded secrets.** All credentials resolved at runtime.
- **`npm audit` → 0 vulnerabilities.**

---

## Architecture

```
Agent Host (WorkBuddy / Claude / any MCP client)
   │  load SKILL.md        │  MCP connect :8099
   ▼                       ▼
 SKILL.md            MCP HTTP Server (pm2, Bearer)
                           │
                    HeartFlow Core (3167 lines, modular)
                      ├─ engine-initializer (lazy module activation)
                      ├─ memory-kernel / formula-engine / cortex
                      └─ CLI (bin/cli.js) + MCP (mcp/mcp-server-http.js)
```

See [`ARCHITECTURE_REORG_v6.0.6.md`](ARCHITECTURE_REORG_v6.0.6.md) for the full architecture decision analysis.

---

## Versioning & status

- Current: **v6.0.9** (see [`ROADMAP.md`](ROADMAP.md) and [`CURRENT_STATE.md`](CURRENT_STATE.md)).
- Decision: stay on **Skill + MCP** architecture; no migration to standalone-agent until ≥50 users & ≥3 agent platforms.
- Releases: https://github.com/yun520-1/mark-heartflow-skill/releases
- npm: https://www.npmjs.com/package/@yun520-1/heartflow

---

## License

MIT — free for personal and commercial agent use.
