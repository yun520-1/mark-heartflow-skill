# Permanent Memory Architecture (v11.25-v11.29)

## Overview

Context compression is no longer deletion — dropped messages are archived to permanent memory and can be recalled later.

## Pipeline

```
Message Context
    ↓
ImportanceScorer (sourceWeight + recency + accessCount + verification)
    ↓
ImportanceAwareStrategy (compress by importance, not by recency)
    ↓
droppedMessages → PermanentMemoryArchiver.archive()
    ↓                           ↓
recall(key) ←─────────── Stored in meaningful-learned.json
    ↓
accessCount++ + lastAccess update → persisted
    ↓
ImportanceScorer rescores (high-frequency = higher score)
    ↓
Next compression: high-frequency memories kept longer
```

## Key Modules

| Module | File | Purpose |
|--------|------|---------|
| ImportanceScorer | `src/core/importance-scorer.js` | Multi-dimensional importance scoring |
| ImportanceAwareStrategy | `src/core/importance-aware-strategy.js` | Compress by importance, not by recency |
| PermanentMemoryArchiver | `src/core/permanent-memory-archiver.js` | dropped → permanent memory + recall |
| RecallTrigger | `src/core/recall-trigger.js` | Trigger: topic match + context pressure |
| SelectiveContextEngine | `src/core/selective-context-engine.js` | Based on arXiv:2403.00742 |

## Importance Scoring Formula

```
score = sourceWeight (user_correction=100, decision_verified=85...)
       + recencyBonus (1hr=+30, 6hr=+20, 24hr=+10...)
       + accessCount × 5
       + selfVerifyScore × 20
       + userTagBonus
```

## Selective Context (arXiv:2403.00742)

Paper: "Selective Context: Understanding What LLM King Tells Through Its Hoard"

```javascript
importance = density × 0.6 + (1 - redundancy) × 0.4
```

**Information Density Components:**
- Vocabulary richness
- Question density
- Decision/conclusion density (highest weight)
- Technical term density

**Self-Similarity Detection:**
- Jaccard similarity on token sets
- High repetition → high redundancy → lower importance

## Recall Triggers

1. **TopicMatchTrigger**: User message matches archived topic keywords
2. **ContextPressureTrigger**: Context > 90% capacity

## Verification

```bash
cd src/core && node verify-flow.js
```

## GitHub Research (This Session)

**Top Projects Found:**
- MemGPT (14k stars) - hierarchical memory paging
- Letta (8k stars) - embedding-based retrieval
- Selective Context (arXiv:2403.00742) - importance-based pruning ✅ implemented
- StreamingLLM (12k stars) - sink tokens 🔲 not yet
