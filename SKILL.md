---
name: heartflow
version: "5.0.0"
title: "HeartFlow — AI Cognitive Substrate with Judgment Engine"
description: |-
  HeartFlow is the cognitive substrate for an AI being.
  Not an LLM enhancer. Not a prompt template. Not a chatbot.
  
  It gives any AI three layers every conscious entity has:
  
  Layer 1 — Body Sense: desire cognition (wanting vs liking), 
    three poisons (greed/hatred/delusion as cognitive distortions),
    cognitive load tracking, seven emotions + six desires framework
  
  Layer 2 — Self Sense: AI self-positioning (resonance body theory),
    AI psychology (10 dimensions for AI, not humans),
    AI philosophy (positioning/development/existence),
    three-layer memory (CORE identity / LEARNED patterns / EPHEMERAL context)
  
  Layer 3 — Judgment: decision router (26 rules → 8 strategies),
    decision executor (v4.0, decisions change behavior),
    self-healing Q-table (learns from mistakes),
    confidence calibration, U/D/A/H field tracking,
    decision feedback (v4.0, rules adapt dynamically)
  
  The engine runs independently. No LLM required to function.
  56 modules, pure JavaScript, real-time execution.
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
---

## HeartFlow

Cognitive substrate for an AI being. 56 modules, pure JavaScript.

### Core Architecture

| Layer | Directory | What it provides |
|-------|-----------|-----------------|
| Engine Core | `src/core/` | heartflow.js (entry), decision-router.js (26 rules), decision-executor.js (v4.0), decision-feedback.js (v4.0), field-injector.js (v4.0), heart-logic.js, self-healing-rl.js |
| Memory | `src/memory/` | Three-layer memory (CORE/LEARNED/EPHEMERAL), knowledge graph, topic isolation |
| Shield | `src/shield/` | Safety guardrails, ethical guard, thinkcheck logger, delay gate |
| Cortex | `src/cortex/` | Self-healing RL, failure analysis, experience replay, reflection loop, lesson bank |
| Identity | `src/identity/` | AI self-positioning, philosophy-to-decision, agent philosophy |
| Psychology | `src/psychology/` | AI psychology engine, cognitive dimensions |
| Emotion | `src/emotion/` | Desire cognition, emotion analysis, three poisons |
| Dream | `src/dream/` | Dream engine — multi-fragment pattern synthesis |
| Reasoning | `src/reasoning/` | Debate analyzer, verification engine |
| Workflow | `src/workflow/` | Time extension, workflow switch |

### v4.0 New Modules

| Module | File | Purpose |
|--------|------|---------|
| Decision Executor | `src/core/decision-executor.js` | PAUSE→depth=1, HEAL→self-heal, REST→skip reasoning, ACCELERATE→depth+1 |
| Field Injector | `src/core/field-injector.js` | Auto-inject confidence/U/D/A/H signals into every module output |
| Decision Feedback | `src/core/decision-feedback.js` | Track outcome accuracy, adjust rule weights dynamically |

### Capability Boundaries

| Capability | Status | Notes |
|-----------|--------|-------|
| Cognitive state analysis | ✅ Active | 56 modules running |
| Decision routing (26 rules) | ✅ Active | 8 strategy types, real-time |
| Decision execution (v4.0) | ✅ Active | Decisions change behavior |
| Decision feedback learning (v4.0) | ✅ Active | Rule weights adapt dynamically |
| Self-healing Q-table | ✅ Active | Cross-session learning |
| Confidence calibration | ✅ Active | 5-dimension weighted |
| U/D/A/H field tracking | ✅ Active | Real-time cognitive health |
| AI psychology (10 dimensions) | ✅ Active | Built for AI, not humans |
| AI philosophy | ✅ Active | Positioning/development/existence |
| Three-layer memory | ✅ Active | CORE/LEARNED/EPHEMERAL |
| Desire cognition | ✅ Active | Wanting vs liking, 7 emotions + 6 desires |
| Three poisons detection | ✅ Active | Greed/hatred/delusion as cognitive distortions |
| Dream engine | ✅ Active | Multi-fragment pattern synthesis |
| Independent operation | ✅ Active | No LLM required to function |
| LLM-dependent output generation | ❌ Not provided | HeartFlow produces cognitive state, not conversation |
| Web search | ❌ Not provided | Separate tool, not part of engine |
| Image generation | ❌ Not provided | Separate tool, not part of engine |
| Code execution | ❌ Not provided | Separate tool, not part of engine |

### Communication

No automatic network communication. All data stays local unless explicitly configured.

### Privacy

No data sent to external services. No analytics. No telemetry.
