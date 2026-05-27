---
name: heartflow
description: HeartFlow v0.16.2 — AI Psychological Perception System. Use when user asks to analyze psychology, detect emotion/intent, use memory tiers, run self-evolution, or trigger dream consolidation. Examples: <example>user: "analyze this message", assistant: calls analyzePsychology()</example> <example>user: "run a dream cycle", assistant: calls dreamNow()</example> <example>user: "remember this as core identity", assistant: calls remember(key, value, 'core')</example>
version: v0.16.2
---

# HeartFlow v0.16.2

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

## Pitfalls

### Known Issues & Limitations

1. **Emotion detection is keyword-based only** — No transformer models; relies on `emotionMap` keyword matching. Cannot detect subtle or nuanced emotions.

2. **Intent inference is pattern-matching** — Uses simple substring matching against `intentPatterns`. May misclassify ambiguous inputs.

3. **No crisis detection** — Does not have guardrails for mental health crisis detection. Do not use for psychological assessment in clinical contexts.

4. **Memory consolidation is naive** — Ephemeral→Learned promotion only checks access count and age (30 min). No quality-based ranking.

5. **Self-evolution lessons are ephemeral** — Failed task lessons are stored with 24hr TTL in ephemeral memory and may be lost on restart.

6. **No Q-table persistence** — The SelfEvolution loop does not persist lessons to disk. On restart, past lessons are lost.

7. **File path safety** — `rootPath` validation allows paths containing "heartflow" substring, which could be bypassed.

### Bug Fixes in v0.16.2 (this upgrade)

1. **FIXED: _accessCount never incremented** (meaningful-memory.js:188-189) — Consolidation relied on `_accessCount >= 2` but the counter was never incremented. Now `getWorking()` increments access count.

2. **FIXED: TTL had no validation** (meaningful-memory.js:145) — Zero or negative TTL accepted. Now clamped to minimum 1ms.

3. **FIXED: Key validation missing** (meaningful-memory.js:145) — Empty/invalid keys accepted. Now returns error for invalid keys.

4. **FIXED: search() crashed on null** (meaningful-memory.js:233) — `query.toLowerCase()` called without null check. Now returns empty array for invalid query.

5. **FIXED: recordOutcome() no validation** (evolution/loop.js:188-190) — Missing required params would throw unclear TypeError. Now validates task and outcome parameters.

6. **FIXED: Version comment mismatch** (heartflow.js:2) — Doc comment said v0.16.1 but code was v0.16.2. Now synchronized to v0.16.2.

### Future Improvements

- Add proper crisis detection with referral protocol
- Implement transformer-based emotion classification
- Persist lessons to JSON file (Q-table persistence)
- Add cultural/contextual bias detection
- Implement LIWC-style linguistic feature extraction
- Add Buddhist "慈悲是体、爱是用" philosophy framework

## References

### Psychology Assessment AI Best Practices
- **BERT/RoBERTa fine-tuning** for mental health text classification
- **Crisis detection guardrails** with immediate escalation protocol
- **Clinical scale mapping** (PHQ-9, GAD-7 equivalents)
- **Multi-modal approaches** (speech prosody + text) for richer emotional analysis
- Source: Web research on psychology assessment AI best practices (2024)

### Cognitive Bias Detection
- Pattern-based bias identification
- Self-reflection loops for bias correction
- Confidence calibration for reasoning tasks

### Related Skills
- `heartflow-audit-workflow` — Third-party audit for HeartFlow
- `heartflow-auto-upgrade-cron` — Automated upgrade pipeline
- `heartflow-truthfulness` — Memory truthfulness verification

## Version

v0.16.2 | 2026-05-28 | Zero npm dependencies | ~1030 lines

## Changelog

See CHANGELOG.md for full history.
