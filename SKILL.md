---
name: heartflow
description: HeartFlow v0.16.0 — AI Psychological Perception System. Use when user asks to analyze psychology, detect emotion/intent, use memory tiers, run self-evolution, or trigger dream consolidation. Examples: <example>user: "analyze this message", assistant: calls analyzePsychology()</example> <example>user: "run a dream cycle", assistant: calls dreamNow()</example> <example>user: "remember this as core identity", assistant: calls remember(key, value, 'core')</example>
version: v0.16.0
---

# HeartFlow v0.16.0

**AI Psychological Perception System** — A minimal, production-ready psychology engine for AI agents.

## When to Use

Use this skill when user asks to:
- `analyzePsychology(text)` — Perceive intent, emotion, needs, defenses from text
- `classify(text)` — Get broad category of input
- `getMemoryStats()` — Check memory state
- `getMindSpace()` — View active identity rules
- `dreamNow()` — Run memory consolidation
- `remember(key, value, tier)` — Store in CORE/LEARNED/EPHEMERAL
- `recordOutcome({task, outcome, evidence})` — Record success/failure for self-evolution
- `search(query)` — Search all memory tiers

## Quick Start

```javascript
const { createHeartFlow } = require('./src/core/heartflow.js');
const hf = createHeartFlow();
hf.start();

// Perceive psychology
const psych = hf.analyzePsychology('I am frustrated with this bug');
// → { intent: {category: 'troubleshooting', confidence: 0.67}, emotion: {category: 'negative', intensity: 'high'}, needs: [...], defenses: [...] }

// Classify
const cls = hf.classify('How do I fix it?');
// → { category: 'information_seeking', emotion: 'neutral', confidence: 0.83 }

// Memory
hf.remember('lesson:auth-error', 'Check token expiry', 'learned');
hf.getMemoryStats();
// → { core: 3, learned: 1, ephemeral: 0 }

// Dream consolidation
hf.dreamNow();
// → { consolidation: {promoted: [...]}, duration_ms: 5, dream_complete: true }

hf.stop();
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
| `dreamNow()` | `{consolidation, duration_ms, dream_complete}` | Run consolidation |
| `remember(key, value, tier)` | `{success, key, tier}` | Store memory |
| `search(query)` | `[{key, tier, value}]` | Search all tiers |
| `recordOutcome(params)` | `{outcome, reflection, lessonStored}` | Self-evolution |
| `retrieveLessons(task)` | `string[]` | Get relevant past lessons |

## Memory Tiers

| Tier | Behavior | Example |
|------|----------|---------|
| **CORE** | Immutable, never deleted | Identity rules: `identity.upgrade`, `identity.transmit` |
| **LEARNED** | Persisted, searchable | Accumulated knowledge |
| **EPHEMERAL** | Session-scoped, auto-expiry | Working context |

## Architecture

```
src/core/heartflow.js          — Main engine + public API
src/memory/meaningful-memory.js — Three-tier memory
src/psychology/engine.js        — Intent/emotion/needs/defenses
src/evolution/loop.js           — Reflexion self-improvement
src/dream/engine.js             — Sleep consolidation
tests/run.js                   — 56-pass test suite
```

## CLI

```bash
node src/core/heartflow.js          # Run health check + API test
node tests/run.js                   # Full test suite (56 tests)
```

## Version

v0.16.0 | 2026-05-17 | Zero npm dependencies | ~3300 lines
