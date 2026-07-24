# HeartFlow — Rule Engine Cognitive Preprocessor (心虫)

> **Stop your agent from guessing. Let it classify first, route correctly, then act.**
>
> HeartFlow is a local-first rule engine that runs *before* your agent replies. It classifies intent, categorizes task types, and returns a structured decision — all through deterministic rules, not LLM inference.

[![GitHub release](https://img.shields.io/github/v/release/yun520-1/mark-heartflow-skill)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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

HeartFlow is a **rule engine cognitive preprocessor**. It does not replace your LLM — it classifies input and routes to the right subsystem before the LLM acts.

- **Classify intent** — categorize the user's goal (analyze / emotion / calculation / plan …).
- **Detect patterns** — anchoring, confirmation, sunk-cost bias flags (rule-based).
- **Compute transparently** — pure math expressions (`15*23`) return scalar results, not prose.
- **Remember across sessions** — persistent local memory (encrypted, never uploaded).
- **Self-health-check** — modules report health status; degraded modules are flagged but not auto-repaired.
- **Cognitive gate** — invalid / self-contradictory inputs get blocked early.

---

## Quick start

```bash
# Clone
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# Verify the engine
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
# Start the HTTP MCP daemon (pm2-managed, port 8288, Bearer auth)
node bin/daemon.js start

# Check health
node bin/daemon.js status

# Stop
node bin/daemon.js stop
```

Connect any MCP client to the configured MCP endpoint with your `HEARTFLOW_MCP_TOKEN`.
The server exposes ~20 tools including `heartflow_think`, `heartflow_agent_think`, `heartflow_think_fast`, `heartflow_decision_router`, `heartflow_status`.

### As a node library

```js
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ dataDir: './data', silent: true });
hf.start();
const r = await hf.think('15 * 23');
console.log(r.output); // structured reasoning chain
```

---

## MCP tools (current)

| Tool | Purpose |
|------|---------|
| `heartflow_think` | Full cognitive analysis → structured decision |
| `heartflow_think_fast` | Lightweight path — lower token, no heavy modules |
| `heartflow_dream` | Offline consolidation of memories |
| `heartflow_memory_search` | Retrieve from persistent memory |
| `heartflow_emotion` | Emotion perception (PAD) |
| `heartflow_self_heal` | Module self-repair |
| `heartflow_provider_health` | LLM provider health probe |
| `heartflow_cost_tracking` | Token/cost accounting |
| `heartflow_status` | Engine status |
| `heartflow_agent_psychology` | Agent psych profile |
| `heartflow_engine_pacing` | Throttle to avoid overload |
| `heartflow_cognitive_check` | Cognitive sanity gate |
| `heartflow_philosophy_decision` | Ethical/value-aligned decision check |
| `heartflow_decision_router` | Classify input → route to correct handler |
| `heartflow_decision_router_stats` | Router accuracy telemetry |
| `heartflow_module_health` | Module health probe |
| `heartflow_upgrade_stats` | Upgrade telemetry |
| `heartflow_benchmark_run` | Regression benchmarking |
| `heartflow_benchmark_import_failures` | Import failure cases to RL |
| `heartflow_benchmark_status` | Benchmark data status |

---

## How to use it to make your agent better (best practices)

### 1. Think *before* you act
Call `heartflow_think` on the user's raw input **before** drafting a reply. Use the returned `type` and `decision` to choose your approach.

### 2. Detect stance once, remember it
Use `heartflow_memory_search` on first contact, then rely on memory. **Stop re-asking** what HeartFlow already perceived.

### 3. Route, don't guess
For ambiguous input, `heartflow_decision_router` returns the correct handler instead of letting the LLM improvise a classification.

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
  "input": "15 * 23",
  "output": { "value": 345, "conclusion": "15 * 23 = 345" },
  "chain": [ "...reasoning steps..." ],
  "decision": { "type": "calculation", "confidence": 1.0 },
  "parse": { "recognized": true, "kind": "math" }
}
```

---

## Performance (v6.0.65, measured)

| Metric | Value |
|---|---|
| Cold start | ~1.4 s |
| `think()` hot path | ~49 ms |
| Loaded modules | 128 |
| MCP tools | ~20 |
| Formulas loaded | 382 |
| Test suite | 119 passed / 0 failed (341 test files, no false-green) |

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
Agent Host (Claude / Feishu / WeChat / any MCP client)
   │  load SKILL.md        │  MCP connect
   ▼                       ▼
 SKILL.md            MCP HTTP Server (pm2 / background, Bearer)
                           │
                    HeartFlow Core (modular, ~4300-line coordinator + 120+ subsystem modules)
                      ├─ engine-lifecycle / engine-memory / engine-initializer (lazy activation)
                      ├─ memory-kernel / formula-engine / cortex (self-evolution, self-scanner)
                      ├─ reasoning / workflow / emotion / decision subsystems
                      └─ CLI (bin/cli.js) + MCP (mcp/mcp-server-http.js)
```

The monolith `heartflow.js` was progressively decomposed (v6.0.65–v6.0.71 refactor wave):
`logic-reasoning` → `logic-patterns`, `pipeline` → `pipeline-config`, `decision-router` → `decision-router-config`, `desire-cognition` → `desire-cognition-config`, `thought-chain` → `thought-chain-config`, startup logic → `engine-lifecycle` / `engine-memory` / `hook-points-runner` / `stats-engine`.

---

## Versioning & status

- Current: **v6.0.65** (see [`ROADMAP.md`](ROADMAP.md) and [`CURRENT_STATE.md`](CURRENT_STATE.md)).
- Decision: stay on **Skill + MCP** architecture; no migration to standalone-agent until ≥50 users & ≥3 agent platforms.
- Releases: https://github.com/yun520-1/mark-heartflow-skill/releases

---

## License

MIT — free for personal and commercial agent use.
