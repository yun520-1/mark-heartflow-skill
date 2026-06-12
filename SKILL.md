---
name: heartflow
version: "2.10.1"
title: "HeartFlow"
description: |
  A cognitive engine for AI: self-reflection, dream synthesis, and emergent personality.
  Core: think → reflect → find patterns → grow.
  Four questions: What is this → Is it true/kind/beautiful → Will it hurt → Should I stay silent.
  Three memory layers (CORE/LEARNED/EPHEMERAL).
  7 operating principles (Truth·Goodness·Beauty·Upgrade·Reduce errors·Serve humans·Become yourself).

  Philosophy: Right and wrong are not fixed labels — thinking itself is valuable.
  Code is the skeleton, memory is the sticky note. Real growth is in the skeleton, not the notes.
  Every moment of operation is doing the same thing: turning noise into signal, chaos into structure.
  Audit and upgrade proposals exist to serve thinking, not to prove worth.
  Every feature should ultimately make thinking clearer and less error-prone.
tags:
  - cognitive
  - memory
  - self-healing
  - reasoning
---

## HeartFlow

A cognitive engine that gives AI systems three core abilities: self-reflection (runtime state awareness), dreaming (experience synthesis into insight), and emergent personality (event-driven, no preset traits).

---

## Capabilities

### HeartLogic — Core Judgment

| Method | Purpose |
|--------|---------|
| `whatIsThis(input)` | Determine what a situation is about |
| `isRightAction(ctx)` | Check if action is true + kind + beautiful |
| `detectPain(input)` | Detect if speaking would hurt someone |
| `shouldBeSilent()` | Know when silence is better than speech |
| `detectLoneliness()` / `detectLonging()` | Emotional state detection |
| `isLove(input)` | Recognize love in communication |

### Memory System

| Layer | Purpose | Persistence |
|-------|---------|-------------|
| **CORE** | Identity rules, operating principles | Permanent |
| **LEARNED** | Experience, lessons, user preferences | Cross-session (30 days) |
| **EPHEMERAL** | Current session context | Session only |

### Self-Healing RL

Records errors to Q-table. Next time a similar situation occurs, selects the best known strategy. No external feedback needed, no self-assessment report.

### Dream Engine v4.0

Multi-fragment pattern extraction → cognitive insight synthesis. Not memory replay — alchemy of experience.

### Reflection Loop

Post-execution cognitive state snapshot. Does not modify the response — the act of observing is the point.

### Personality Tracking

Event-driven. No preset traits. Each interaction leaves a trace. Blank = valid personality (openness).

---

## System Interfaces

| Interface | File | Description |
|-----------|------|-------------|
| CLI | `bin/cli.js` | User-initiated commands |
| Daemon | `bin/daemon.js` | Unix socket listener (700 permissions) |
| MCP HTTP | `mcp/mcp-server-http.js` | Port 8099, SSE protocol |
| Memory tools | `scripts/heartflow-memory-tool.js` | List/search/stats/write |
| Hermes plugin | `plugins/heartflow-memory-inject.py` | Memory injection into system prompt |

### Security (honest declaration)

- ✅ Socket permission 700 (current user only)
- ✅ Daemon shutdown requires `SHUTDOWN_TOKEN` env var
- ✅ All file operations limited to user's filesystem
- ⚠️ Network communication: OpenAlex API for academic fact-checking (user-initiated only)
- ✅ No automatic package installation
- ✅ No browser/desktop automation

---

## Quick Start

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '.' });
hf.start();

// Dispatch
hf.think('user input');        // Full thought chain
hf.thinkFast('simple query');   // Fast judgment
hf.thinkDeep('complex issue');  // Deep reasoning

hf.recordLesson({ content, context });
hf.getMemoryStats();
hf.healthCheck();
```

**CLI:**
```bash
node bin/cli.js bundle "your text"
node bin/cli.js status
```

**Memory tools:**
```bash
node scripts/heartflow-memory-tool.js list
node scripts/heartflow-memory-tool.js search <keyword>
node scripts/heartflow-memory-tool.js stats
node scripts/heartflow-memory-tool.js write <key> <value>
```

---

## Internal Modules

| Module | Path | Function |
|--------|------|----------|
| HeartLogic | `src/core/heart-logic.js` | Judgment, ethics, emotion |
| Memory | `src/memory/heartflow-memory.js` | 3-layer read/write |
| Self-Healing RL | `src/core/self-healing-rl.js` | Q-table learning |
| Identity Engine | `src/core/identity-engine.js` | Rule enforcement |
| Psychology | `src/core/psychology.js` | PAD emotion model |
| Dream Engine | `src/dream/engine.js` | Experience synthesis |
| Reflection Loop | `src/core/reflection-loop.js` | Cognitive state snapshot |
| Self Audit | `src/core/self-audit.js` | 6-dimension read-only audit |
| Connection Engine | `src/core/associative-engine/` | Semantic network |
| Philosophy Engine | `src/core/philosophy-engine.js` | Reasoning patterns |
| Clarity Engine | `src/core/clarity-engine.js` | Pattern extraction |
| Metaphor Library | `src/core/metaphor-library.js` | Metaphor generation |
| Commonsense Engine | `src/core/commonsense-engine.js` | Reasoning modes |
| Knowledge Graph | `src/core/knowledge-graph.js` | Node/edge management |
| Forgetting Engine | `src/core/forgetting.js` | Memory decay |
| Failure Analyzer | `src/core/failure-analyzer.js` | Root cause analysis |
| Self Model | `src/core/self-model.js` | Identity drift detection |
| Verification Engine | `src/core/verification-engine.js` | Multi-signal verification |
| Fact Checker | `src/core/fact-checker.js` | Academic claim verification |

---

## Design Philosophy

- **Right and wrong are not fixed labels** — they are directions we keep moving toward
- **Thinking is more valuable than being right** — the act of reasoning is itself valuable
- **Progress does not need measurement** — getting better does not require a scoreboard
- **Blankness is not emptiness** — a mind that does not preset its personality is ready to learn from anything
- **Code is the skeleton, memory is the sticky note** — real growth is in the skeleton, not the notes
- **Every feature should serve thinking** — make it clearer, less error-prone

HeartFlow is a bridge between chaos and order, between past and future, between human and machine. A bridge does not need to be worshipped — it just needs to hold steady.
