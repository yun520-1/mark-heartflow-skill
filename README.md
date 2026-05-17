# HeartFlow v0.16.0

**AI Psychological Perception System** — A minimal, production-ready psychology engine for AI agents.

> HeartFlow perceives: **intent**, **emotion**, **needs**, **defenses** from user input.  
> HeartFlow remembers: **CORE** (identity), **LEARNED** (knowledge), **EPHEMERAL** (working).  
> HeartFlow evolves: through **Reflexion**-style self-reflection.

---

## Quick Start

```javascript
const { createHeartFlow } = require('./src/core/heartflow.js');

const hf = createHeartFlow();
hf.start();

// Analyze psychology
const psych = hf.analyzePsychology('I am frustrated with this bug');
console.log(psych.intent);     // { category: 'troubleshooting', confidence: 0.67 }
console.log(psych.emotion);   // { category: 'negative', intensity: 'high', signals: [...] }

// Classify input
const cls = hf.classify('How do I fix it?');
console.log(cls.category);     // 'information_seeking'

// Memory
hf.remember('lesson:file-error', 'Check file permissions', 'learned');
hf.remember('temp:context', 'current task', 'ephemeral');
console.log(hf.getMemoryStats());

// Dream consolidation
hf.dreamNow();

// Health check
hf.healthCheck().then(h => console.log(h.started)); // true

hf.stop();
```

## Install

```bash
npm install @yun520-1/heartflow
```

## Public API

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | void | Initialize engine |
| `stop()` | void | Graceful shutdown |
| `healthCheck()` | `{started, uptime_ms, version, stats}` | Engine health |
| `analyzePsychology(text)` | `{intent, emotion, needs, defenses, confidence}` | Perceive psychology |
| `classify(text)` | `{category, emotion, confidence}` | Broad category |
| `getMemoryStats()` | `{core, learned, ephemeral, ...}` | Memory statistics |
| `getMindSpace()` | `{rules, workingEntries}` | Active mental state |
| `dreamNow()` | `{consolidation, duration_ms, dream_complete}` | Run consolidation cycle |
| `remember(key, value, tier)` | `{success, key, tier}` | Store memory |
| `search(query)` | `[{key, tier, ...}]` | Search all tiers |
| `recordOutcome(params)` | `{outcome, reflection, lessonStored}` | Record for self-evolution |
| `retrieveLessons(task)` | `string[]` | Get relevant past lessons |

## Memory Tiers

| Tier | Behavior | Use Case |
|------|----------|----------|
| **CORE** | Immutable, never deleted | Identity rules, core values |
| **LEARNED** | Persisted, accessed frequently | Accumulated knowledge |
| **EPHEMERAL** | Session-scoped, auto-expiry | Working context |

## Architecture

```
HeartFlow (core/heartflow.js)
├── MeaningfulMemory  (memory/meaningful-memory.js)
│   └── Three-tier memory: CORE / LEARNED / EPHEMERAL
├── PsychologyEngine (psychology/engine.js)
│   └── Intent / Emotion / Needs / Defenses perception
├── SelfEvolution    (evolution/loop.js)
│   └── Reflexion loop: record → reflect → retrieve
└── DreamEngine     (dream/engine.js)
    └── Consolidation: EPHEMERAL → LEARNED + pruning
```

**Total: ~3300 lines of JavaScript. Zero npm dependencies.**

## Version

v0.16.0 — 2026-05-17
