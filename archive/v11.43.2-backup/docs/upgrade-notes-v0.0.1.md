# HeartFlow Upgrade Notes v0.0.1

## Verified sources in repo
- `src/core/decision-verifier.js`
- `src/core/dream-loop.js`
- `src/core/heartflow-engine.js`

## Incoming upgrade ideas
1. Decision records should always carry evidence, alternatives, risks, confidence, userGoal, and expectedOutcome.
2. High-risk actions should require fallback or manual confirmation.
3. Dream loop should sort memory fragments by contradiction + novelty to surface upgrade candidates.
4. Psychology analysis should keep four layers: surface, emotional, deepNeed, defense.

## Proposed next step
Wire decision verification into the main reply / workflow path so risky replies are re-scored before execution.
