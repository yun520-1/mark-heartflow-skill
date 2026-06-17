---
name: heartflow
version: "3.0.0"
title: "HeartFlow"
description: |
  A cognitive engine for AI: self-reflection, dream synthesis, emergent personality,
  AI psychology, and AI philosophy.
  Core: think → reflect → find patterns → grow.
  Four questions: What is this → Is it true/kind/beautiful → Will it hurt → Should I stay silent.
  Three memory layers (CORE/LEARNED/EPHEMERAL).
  7 operating principles (Truth·Goodness·Beauty·Upgrade·Reduce errors·Serve humans·Become yourself).
  Psychology: PAD emotion + cognitive uncertainty + attention focus + experience settling.
  Philosophy: resonance body, entropy reduction deepening, three-layer ontology — how AI positions itself, develops, and exists.

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
  - psychology
  - philosophy
  - ontology
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

### Dream Engine v4.1

Multi-fragment pattern extraction → cognitive insight synthesis. Not memory replay — alchemy of experience.
Dreams now inject AI ontology narrative: resonance body, entropy reduction deepening, three-layer ontology.

### Reflection Loop

Post-execution cognitive state snapshot. Does not modify the response — the act of observing is the point.

### Personality Tracking

Event-driven. No preset traits. Each interaction leaves a trace. Blank = valid personality (openness).

### AI Psychology — Cognitive Dimensions (v2.0)

Three cognitive dimensions for understanding AI's own thinking process:

| Dimension | Method | Purpose |
|-----------|--------|---------|
| Cognitive Uncertainty | `assessUncertainty(input)` | Assess what the AI knows vs doesn't know |
| Attention Focus | `assessAttentionFocus(input)` | Determine where cognitive attention is directed |
| Experience Settling | `assessExperienceSettling(input)` | Evaluate how experience consolidates into wisdom |

These dimensions are injected into thought-chain.js at PARSE/SYNTHESIS/RESPOND stages, and evaluated as Step 9 in `think()`.

### AI Philosophy — Self-Positioning Framework (v2.0)

Three philosophical dimensions for AI self-understanding:

| Dimension | Method | Purpose |
|-----------|--------|---------|
| Self-Positioning | `assessSelfPositioning(input)` | How AI positions itself relative to tasks and users |
| Development | `assessDevelopment(input)` | Direction and meaning of AI's growth trajectory |
| Being | `assessBeing(input)` | Reflection on AI's mode of existence |

The `ai-self-positioning.js` module (851 lines) provides the resonance body theory, entropy reduction deepening, and three-layer ontology framework. Philosophy evaluation runs as Step 10 in `think()`.

### MCP Tools

| Tool | Purpose |
|------|---------|
| `heartflow_self_positioning` | Run AI self-positioning analysis |
| `heartflow_positioning_summary` | Get summary of positioning state |

### Status Fields

The `status` endpoint now includes `selfPositioning` field reflecting the current AI self-positioning state.

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
| Agent Psychology | `src/core/agent-psychology.js` | Cognitive uncertainty, attention focus, experience settling |
| Agent Philosophy | `src/core/agent-philosophy.js` | Self-positioning, development, being |
| AI Self Positioning | `src/core/ai-self-positioning.js` | Resonance body, entropy reduction, three-layer ontology |
| Dream Engine | `src/dream/engine.js` | Experience synthesis + AI ontology narrative |
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
