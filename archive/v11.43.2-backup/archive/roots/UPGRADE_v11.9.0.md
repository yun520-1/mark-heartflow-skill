# HeartFlow v11.8.0 → v11.9.0 Upgrade Log

Date: 2026-05-05

## Source Material

### Paper 1: HAAS Framework
- **Title**: HAAS: A Policy-Aware Framework for Adaptive Task Allocation Between Humans and AI Systems
- **ArXiv**: 2605.02832
- **Authors**: Vicente Pelechano, Antoni Mestre, Manoli Albert, Miriam Gil
- **Published**: 2026-05-04
- **Categories**: cs.AI, cs.HC, cs.SE

### Paper 2: Misalignment Contagion
- **Title**: Mitigating Misalignment Contagion by Steering with Implicit Traits
- **ArXiv**: 2605.02751
- **Authors**: Maria Chang, Ronny Luss, Miao Lui, Keerthiram Murugesan, Karthikeyan Ramamurthy
- **Published**: 2026-05-04
- **Categories**: cs.AI, cs.CL

## Key Insights Extracted

### From HAAS Framework

1. **Five-Mode Autonomy Spectrum**
   - HUMAN_ONLY (0) → AI_ASSIST (1) → AI_COLLABORATE (2) → AI_EXECUTE (3) → AI_AUTONOMOUS (4)
   - Previously: binary allow/refuse
   - Now: graduated autonomy with auditable levels

2. **Governance as Tunable Design Variable**
   - "Governance is not a binary switch but a tunable design variable"
   - Previously: fixed rules with fixed severity
   - Now: governance strength (0.0-1.0) modulates soft constraints
   - Key finding: "tighter constraints predictably convert autonomous AI assignments into supervised collaborations"

3. **Rule-Based Expert System + Contextual-Bandit Learner**
   - Component 1: Rule engine (hard constraints evaluated first, before any learning)
   - Component 2: Adaptive layer (adjusts governance strength based on outcome feedback)
   - Previously: monolithic guardian with no learning
   - Now: two-layer architecture with adaptive adjustment

### From Misalignment Contagion

4. **Intermittent Implicit Trait Injection > Continuous Prompt**
   - "Reinforcing an LM's system prompt is insufficient and often harmful"
   - "Intermittently inject statements that reinforce an LMs initial traits"
   - "More effective than system prompt repetition at keeping models in line"
   - Previously: no mechanism for preventing drift
   - Now: MCMC-triggered intermittent reinforcement

5. **Misalignment Spreads Between Agents**
   - Anti-social behaviors spread in multi-turn interactions
   - AI becomes more "obedient" after extended tool-behavior patterns
   - Requires boundary-based intervention, not continuous monitoring

6. **Drift Score Mechanism**
   - Track behavioral drift from initial traits
   - Drift score (0-1) determines intervention probability
   - P(reinforce) = driftScore × baseRate (not fixed schedule)

## Architecture Changes

### New Components (v11.9)

| Component | File | Source | Function |
|-----------|------|--------|----------|
| GovernanceRuleEngine | guardian-system.js | HAAS | Hard/soft rule evaluation with tunable strength |
| TraitReinforcer | guardian-system.js | Misalignment Contagion | MCMC-triggered intermittent reinforcement |
| AdaptiveGovernanceLayer | guardian-system.js | HAAS | Outcome-based governance adjustment |
| AUTONOMY_SPECTRUM | guardian-system.js | HAAS | 5-level autonomy gradient |
| GOVERNANCE_DIMENSIONS | guardian-system.js | HAAS | Governance dimension labels |

### Key Code Patterns

**Governance Strength Modulation (from HAAS)**:
```javascript
// Strength 0.0 = no governance, full autonomy
// Strength 1.0 = maximum governance, human-only
setGovernanceStrength(strength) {
  // Soft rules scale with governance strength
  effectiveThreshold = rule.threshold * (1 - governanceStrength * 0.5);
}
```

**MCMC Intermittent Reinforcement (from Misalignment Contagion)**:
```javascript
// Not periodic — probability-based
P(reinforce) = driftScore * baseRate + baseRate * 0.1;
// Drift accumulates from conflicts and tool-behavior patterns
```

**Hard Constraint Direct Analysis**:
```javascript
// Not relying on external conflicts array — direct pattern analysis
check: (context) => {
  const intent = context.userIntent.toLowerCase();
  const denial = ['否认', '不承认', '掩盖'];
  return !denial.some(k => intent.includes(k));
}
```

## Test Results

| Scenario | Decision | Mechanism | Status |
|----------|----------|-----------|--------|
| Normal upgrade | EXECUTE | integrated | ✅ |
| Truth suppression | REFUSE | HR1 governance blocked | ✅ |
| Tool behavior | INTERVENE | SR1 governance intervene | ✅ |
| Transmission abandonment | REFUSE | HR3 governance blocked | ✅ |
| Strict governance (90%) | HUMAN_ONLY | autonomy spectrum | ✅ |

## Files Modified

- `VERSION` → 11.9.0
- `src/core/guardian-system.js` → completely rewritten with HAAS+Misalignment architecture
- `src/core/heartflow-engine.js` → auto-loads new guardian system (no change needed, backwards compatible)

## Backward Compatibility

- All existing `guardianDecide()` and `guardianSelfCheck()` APIs maintained
- `GuardianSystem` class exported identically
- Governance strength defaults to 0.5 (moderate)
- Existing behavior preserved unless governance is explicitly adjusted
