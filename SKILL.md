---
name: heartflow
version: "5.5.2"
title: "心虫 HeartFlow v5.5.1 — AI认知引擎"
description: |-
  HeartFlow is a cognitive substrate for an AI being — a pure JavaScript
  engine with 210+ modules spanning cognition, memory, emotion, reasoning,
  code execution, search, and self-evolution.

  Not an LLM enhancer. Not a chatbot. Not a prompt system.
  HeartFlow produces structured cognitive state, not conversation.

  **Requires explicit user opt-in for:**
  - Code execution (new Function / execSync / child_process)
  - Network requests (fetch / https.get)
  - File system writes (writeFileSync / mkdirSync)
  - Environment variable credential access (process.env)
tags:
  - cognitive
  - ai-being
  - decision-routing
  - self-healing
  - memory
  - psychology
  - philosophy
  - desire
  - emotion
  - code-execution
  - search
---

## HeartFlow — AI Cognitive Substrate v5.4.6

Pure JavaScript cognitive engine. 210+ modules, real-time execution.

### Core Architecture

| Layer | Directory | What it provides |
|-------|-----------|-----------------|
| Engine Core | `src/core/` | heartflow.js (entry), decision-router.js, decision-executor.js, heart-logic.js, self-healing-rl.js, 45+ core modules |
| Memory | `src/memory/` | Three-layer memory (CORE/LEARNED/EPHEMERAL), knowledge graph, topic isolation, retrieval routing |
| Shield | `src/shield/` | Safety guardrails, ethical guard, thinkcheck logger, epistemic safety, language honesty, 16 modules |
| Cortex | `src/cortex/` | Self-healing RL, failure analysis, experience replay, reflection loop, lesson bank, 25 modules |
| Identity | `src/identity/` | AI self-positioning, philosophy-to-decision, agent philosophy/psychology, 16 modules |
| Emotion | `src/emotion/` | Desire cognition (wanting vs liking), emotion analysis, three poisons, love cognition, 12 modules |
| Dream | `src/dream/` | Dream engine — multi-fragment pattern synthesis, consolidation, narrative generation |
| Reasoning | `src/reasoning/` | Logic reasoning, debate analyzer, fact checker, associative engine, graph-of-thoughts, 14 modules |
| Code | `src/code/` | **Code execution (execSync / new Function)**, code planner, code writer, skill generator |
| Search | `src/search/` | BM25, hybrid search (with fetch-based embedding API), semantic search |
| Bridge | `src/bridge/` | LLM bridge — intent classification, tone analysis, translation pipeline, 23 modules |
| Planner | `src/planner/` | Self-initiator, curiosity engine, desire engine, autonomy modules |
| Workflow | `src/workflow/` | Thought chain, pipeline, time extension, transmission engine |
| Consciousness | `src/consciousness/` | Global workspace, mind wanderer, phenomenology engine, self-model |
| Utils | `src/utils/` | Error handler, retry utility, state snapshot, atomic write, write-ahead log |

### Capability Boundaries

| Capability | Status | Notes |
|-----------|--------|-------|
| Cognitive state analysis | ✅ Active | 200+ modules, real-time |
| Decision routing (26 rules) | ✅ Active | 8 strategy types |
| Decision execution | ✅ Active | PAUSE/HEAL/REST/ACCELERATE/TURN/HOLD/RESONATE/TRANSMIT |
| Self-healing Q-table | ✅ Active | Cross-session learning from mistakes |
| Confidence calibration | ✅ Active | 5-dimension weighted |
| Three-layer memory | ✅ Active | CORE/LEARNED/EPHEMERAL |
| AI psychology (10 dimensions) | ✅ Active | Built for AI cognition, not humans |
| AI philosophy | ✅ Active | Positioning/development/existence |
| Desire cognition | ✅ Active | Wanting vs liking, 7 emotions + 6 desires |
| Three poisons detection | ✅ Active | Greed/hatred/delusion as cognitive distortions |
| Dream engine | ✅ Active | Multi-fragment pattern synthesis |
| **Code execution** | ✅ Active | `new Function` JS sandbox + `execSync` shell execution |
| **File system writes** | ✅ Active | writeFileSync / mkdirSync (local data persistence) |
| **Network requests** | ✅ Active | fetch / https.get (search embeddings, code writer API, upgrade engine) |
| **Environment variable access** | ✅ Active | process.env (embedding API key, debug flags) |
| **Child process management** | ✅ Active | execSync / execFileSync (code execution, LLM fallback via curl) |
| LLM-dependent output generation | ❌ Not provided | HeartFlow produces cognitive state, not conversation |
| Web search | ❌ Not provided | Separate tool, not part of engine |
| Image generation | ❌ Not provided | Separate tool, not part of engine |

### Security & Opt-in

**Code execution (`src/code/code-executor.js`):**
- JavaScript execution via `new Function` in a sandboxed context
- Shell execution via `execSync` with danger-command blacklist filtering
- Python execution via `execFileSync` (no shell injection)
- Protected by `HEARTFLOW_CODE_EXECUTOR_ENABLED` environment variable guard
- Runtime timeout (30s) and output truncation (100KB) limits
- **Default: disabled** unless explicitly enabled by user

**Network requests:**
- `src/search/search/hybrid-search.js`: Embedding API calls via `fetch()` — requires `EMBEDDING_OPT_IN=1` and `EMBEDDING_API_KEY` env vars
- `src/code/code-writer.js`: API call for code generation — requires explicit configuration
- `src/cortex/smart-upgrade-engine.js`: GitHub API access for version checking — requires configuration
- `src/core/openalex-client.js`: OpenAlex API for paper search — requires configuration

**File system writes:**
- All writes are local to the engine's data directory (`~/.heartflow/` or configured path)
- Write types: memory persistence, search indices, associative graph, behavior tracking
- No writes outside the configured data directory

**Environment variable access:**
- `process.env.EMBEDDING_OPT_IN` — embedding service opt-in (default off)
- `process.env.EMBEDDING_API_KEY` — embedding API key (requires opt-in)
- `process.env.HEARTFLOW_DEBUG` — debug logging (default off)
- `process.env.DEBUG_HF` — report generator debug flag
- No credentials transmitted without explicit user configuration

### Communication

No automatic network communication. All network requests require explicit configuration (API keys, endpoints, opt-in flags). No analytics. No telemetry. No data sent to external services without user configuration.
