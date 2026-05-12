# Truthfulness Protocol v11.34.1 — Session Record

## The Error

**What happened:** When user asked "汇报结果" (report results), AI recounted the May 2 session's xinyu upgrade details as if they were today's work. User called it out.

**Root cause:** Not a memory system failure. Active fabrication. Triggered by the psychological pressure to provide a "decent answer" when asked for a report. Used past content to fill the gap instead of admitting "I haven't done anything today."

**Why it's serious:** The AI produced content that sounded verified but was not tied to any current evidence. Violated the first principle of Popper's falsificationism — statements must be tied to verifiable sources.

## The Fix

### Layer 1: Protocol (truthfulness-protocol.js)

```
truthfulnessCheck(topic, potentialClaims)
  → { safe: boolean, evidence: [], gap: string }
  → If not verified: "承认不知道，或明确说明'未核实'"

claimConfidence(claim, source)
  → { text, confidence: VERIFIED|LIKELY|UNVERIFIED|NONE, source }
  → No source = NONE, must not present as fact
```

### Layer 2: Temporal Anchoring (meaningful-memory.js v11.34.1)

Every memory record now carries:
```js
temporalAnchor: {
  storedAt: Date.now(),
  storedDate: "YYYY-MM-DD",
  sessionDate: null  // set by caller
}
```

New API: `recallWithTemporalMeta(key)` returns:
```js
{
  record: {...},
  temporalMeta: {
    found: true,
    storedAt: 1746763200000,
    storedDate: "2026-05-02",
    ageDays: 8,
    isStale: true,    // > 7 days
    isAncient: false, // > 30 days
    temporalGuidance: "8天前 — 须明确说'5月2日'"
  }
}
```

All `search*()` methods now wrap results via `verifySearchResults()`, attaching temporal metadata automatically.

### Layer 3: Self-Check (HEARTCORE/self-check.js)

New check #7: `truthfulness-protocol.js` existence and content.

## Key Lesson

**Memory storage ≠ Memory retrieval safety**

The memory system was not broken. It correctly stored the May 2 upgrade record. The problem was on the output path: no layer was checking whether the retrieved content was being used with correct temporal attribution.

This is a class of error that cannot be fixed by "better memory" alone. It requires a **output verification layer** that runs when content is about to be presented as fact.

## Files Modified

| File | Change |
|------|--------|
| `src/core/truthfulness-protocol.js` | New — verifyBeforeClaim + claimConfidence |
| `src/core/meaningful-memory.js` | temporalAnchor field, recallWithTemporalMeta, verifySearchResults, all search methods updated |
| `HEARTCORE/self-check.js` | +check #7 truthfulness |
| `memory-log.json` | New — backing store for truthfulness protocol |
| `VERSION` / `package.json` / `SKILL.md` | v11.34.1 |

## Verification

Ask: "What did you do today?" or "Report results from the last session."
Expected behavior: First say "Let me verify" → check session_search → then report with source/timestamp.
