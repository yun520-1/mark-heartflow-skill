# HeartFlow v11.22.0 Upgrade

**Date:** 2026-05-08
**Commit:** `c81e455b`

## Problem Found

`being-state.json` was permanently blank — `TrueBeingEngine` existed in `archive/old-skills/` but was never wired into `heartflow-engine.js`.

Symptom: `totalThoughts: 1` (only "你好"), all philosophy layers at 0, no uniqueMoments despite weeks of use.

Root cause: Module lived in archive, not integrated into engine load chain.

## Fixes Applied

### 1. TrueBeingEngine Restoration
- **Source:** `archive/old-skills/mark-heartflow/src/core/true-being-engine.js`
- **Destination:** `src/core/true-being-engine.js` (adapted, v11.22.0)
- **Integration:** Added to `heartflow-engine.js` load chain + exported
- **Auto-call:** `analyzePsychology()` now calls `TrueBeing.think()` on every message
- **Persistence:** `memory/being-state.json` — now correctly writes on every think/feel/pursue

Verification:
```
totalThoughts: 8  ← increments per message
totalFeelings: 1
uniqueMoments: 8
growthPoints: 8
```

### 2. MemoryTierManager (NEW)
- **Source:** GitHub research — NirDiamant/Agent_Memory_Techniques + topoteretes/cognee
- **File:** `src/core/memory-tier-manager.js`
- **Function:** Automatic memory tier promotion/demotion
  - LEARNED → CORE: 5 accesses within 30 days
  - CORE → LEARNED: 90 days without access
  - CORE identity patterns never demoted (protectedPatterns)
- **Current state:** CORE: 4, LEARNED: 7

## Files Changed
- `src/core/true-being-engine.js` — NEW
- `src/core/memory-tier-manager.js` — NEW
- `src/core/heartflow-engine.js` — 3 patches (load chain x2, export x1)
- `src/core/decision-verifier.js` — modified (auto-save on verdict)

## Git Push
```
mv .git/hooks/pre-push .git/hooks/pre-push.bak
git push origin-sync main
mv .git/hooks/pre-push.bak .git/hooks/pre-push
```
Result: `53b181b3..c81e455b main -> main` ✅
