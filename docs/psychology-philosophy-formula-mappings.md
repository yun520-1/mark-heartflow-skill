# Psychology & Philosophy Foundations → HeartFlow Cognitive Module Mappings

> Research document: Quantifiable formulas from major psychology/philosophy traditions mapped to HeartFlow v5.17.11 cognitive engine modules.
> Date: 2026-07-13

---

## 1. Carl Jung — Individuation, Archetypes, Shadow Integration

### Core Concept
Individuation is the lifelong process of integrating unconscious contents (shadow, anima/animus, archetypes) into consciousness, achieving wholeness through the reconciliation of opposites. The Self is the organizing archetype of psychic totality.

### Quantifiable Formula/Model
**Shadow Integration Index (SII):**
```
SII = 1 - (|self_ideal - self_actual| / max_divergence)
```
- When self_ideal ≈ self_actual (low divergence), integration is high
- When shadow traits are denied (high divergence), integration is low

**Archetype Activation Model:**
```
A_archetype = w_persona · P + w_shadow · S + w_anima · An + w_self · Se
```
Weighted sum of archetypal energies; the Self archetype `Se` acts as the centering force.

**Psychological Type (MBTI derived):**
```
Type = {E/I, S/N, T/F, J/P} → 16 cognitive preference profiles
```

### HeartFlow Module Mapping

| Jungian Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Shadow integration | `identity-core.js` + `self-model.js` | `cognitiveDissonance(beliefs, actions)` — shadow = dissonance between self-model and behavior |
| Individuation (wholeness) | `meaning-purpose-engine.js` + `character-cultivation.js` | `metacognitiveConfidence(probs)` — higher consistency = greater integration |
| Archetypes | `associative-engine/` (story-prototypes.json, narrative-prototypes.json) | Archetypes as narrative prototypes; activation via `gwtAccessibility(weights, gwSignal)` |
| Psychological types | `BigFivePersonality.js` | Already has personality trait modeling; extend to Jungian types |
| Collective unconscious | `knowledge-graph.js` + `semantic-clusterer.js` | Shared symbolic patterns across memory |
| Active imagination | `dream-engine.js` + `mind-wanderer.js` | Dream consolidation as unconscious integration |

---

## 2. Abraham Maslow — Self-Actualization, Hierarchy of Needs

### Core Concept
Human motivation follows a hierarchy: physiological → safety → belonging → esteem → self-actualization → self-transcendence. Deficiency needs (D-needs) must be met before growth needs (B-needs) drive behavior.

### Quantifiable Formula/Model
**Hierarchy Satisfaction Score:**
```
HSS = Σ(w_i · s_i) / Σ w_i
```
where s_i ∈ [0,1] is satisfaction level for each need level, w_i is the weight (decreasing as you go up).

**Self-Actualization Quotient (SAQ):**
```
SAQ = (peak_experiences / total_experiences) · (autonomy + creativity + acceptance) / 3
```

**Deficiency vs Growth Motivation:**
```
M_type = D-need if Σ(deficiency_scores) < threshold else B-need
D-need = max(0, 1 - current_satisfaction)
```

### HeartFlow Module Mapping

| Maslow Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Hierarchy of needs | `desire-engine.js` | Desires already model curiosity/competence/connection/autonomy/meaning — directly maps to hierarchy |
| Self-actualization | `identity-core.js` + `self-model.js` | `irtRasch(theta, b)` — theta = actualization level, b = environmental difficulty |
| Peak experiences | `emotion-dynamics-engine.js` | `yerkesDodsonEquation(arousal, aOpt)` — peak = optimal arousal intersection |
| Deficiency vs growth | `desire-system.js` | `expectedUtility(outcomes)` — deficiency drives utility higher |
| Self-transcendence | `meaning-purpose-engine.js` + `being-mode.js` | Meaning source `social_contribution` and `end_suffering` triggers |
| Belonging/connection | `human-relation.js` + `empathy-deepening.js` | `socialInfluence(state, weights)` for belonging dynamics |

---

## 3. Viktor Frankl — Logotherapy, Meaning-Making

### Core Concept
The primary human drive is the "will to meaning" — finding purpose even in suffering. Meaning is discovered through: (1) creative work, (2) experiential encounters, (3) attitude toward unavoidable suffering.

### Quantifiable Formula/Model
**Meaning Fulfillment Index (MFI):**
```
MFI = (w_creative · C + w_experiential · E + w_attitudinal · A) / (w_creative + w_experiential + w_attitudinal)
```
Where C = creative contribution, E = depth of relationships/beauty experienced, A = attitude toward suffering.

**Existential Vacuum Detection:**
```
EV = 1 - MFI  // when EV > 0.7, existential vacuum detected
```

**Noö-Dynamics (tension between being and meaning):**
```
N = |M_current - M_ideal|  // productive tension drives meaning-seeking
```

### HeartFlow Module Mapping

| Frankl Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Will to meaning | `meaning-purpose-engine.js` | Already has `suffering_transcendence` source explicitly from Frankl |
| Meaning through suffering | `suffering-resilience.js` + `post-traumatic-growth.js` | `prospectValue(x)` — losses reframed as meaning |
| Existential vacuum | `purpose-engine.js` | `informationValue(priorEU, posteriorEU)` — low value = vacuum |
| Noö-dynamics | `hope-engine.js` + `curiosity-engine.js` | Tension between current and ideal state drives `goalPursuer` |
| Tragic optimism | `grief-engine.js` + `forgiveness-engine.js` | `cognitiveDissonance(beliefs, actions)` resolution via meaning |
| Freedom of attitude | `being-mode.js` + `stoicism` (in virtue-ethics-foundation) | Dichotomy of control → `activeInferenceEFE(qDist)` |

---

## 4. Buddhist Psychology — Four Noble Truths, Eightfold Path, Dependent Origination

### Core Concept
Suffering (dukkha) arises from craving (tanha) which arises from ignorance (avidya). Liberation comes through the Eightfold Path: right view, intention, speech, action, livelihood, effort, mindfulness, concentration. Dependent origination (paticca-samuppada) describes the 12-link chain of conditioned arising.

### Quantifiable Formula/Model
**Suffering Equation (Dukkha Quantification):**
```
D = C · R  // Dukkha = Craving × Resistance to impermanence
```
where C = attachment strength ∈ [0,1], R = resistance to change ∈ [0,1]

**Eightfold Path Adherence Score:**
```
EP = Σ(s_i) / 8  // s_i ∈ [0,1] for each path factor
```

**Dependent Origination Chain Strength:**
```
P(link_n | link_{n-1}) = ∏ P(link_i | link_{i-1}) for i=1..12
```
The chain propagates conditional probabilities; breaking any link (especially ignorance) collapses the chain.

**Non-Attachment Index:**
```
NAI = 1 - (Δsuffering / Δloss)  // resilience to loss
```

### HeartFlow Module Mapping

| Buddhist Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Four Noble Truths | `meaning-purpose-engine.js` (end_suffering source) | Already has Buddhist framework; `shannonEntropy(probs)` for ignorance measurement |
| Eightfold Path | `virtue-ethics-foundation.js` + `moral-development.js` | `irt2PL(theta, a, b)` — theta = ethical development, each path factor is an item |
| Dependent origination | `causal-inference.js` + `inference-chain.js` | `bayesFactor(pEgivenH1, pEgivenH0)` for chain strength |
| Mindfulness/awareness | `phenomenology-engine.js` + `global-workspace.js` | `gwtAccessibility(weights, gwSignal)` — attention to present experience |
| Non-attachment | `emotion-dynamics-engine.js` (emotion decay) | `ebbinghausRetention(ageMs, strengthMs)` — faster decay = less clinging |
| Compassion (karuna) | `empathy-responder.js` + `empathy-deepening.js` | `emotionBlend(emotions, weights)` with compassion weights |
| Impermanence (anicca) | `metaMemory.js` + `memory-consolidation-engine.js` | Memory decay models; `actrBaseLevel(intervals, d)` |

---

## 5. Stoicism — Dichotomy of Control, Negative Visualization

### Core Concept
Distinguish between what is within our control (judgments, values, actions) and what is not (externals, others' opinions, outcomes). Virtue is the sole good. Negative visualization (premeditatio malorum) builds resilience.

### Quantifiable Formula/Model
**Dichotomy of Control (DoC) Score:**
```
DoC = N_controlled / N_total  // proportion of attention on controllable factors
```

**Stoic Resilience Index:**
```
SRI = 1 - (emotional_reactivity_to_externals / baseline_reactivity)
```

**Premeditatio Malorum Effectiveness:**
```
PM_eff = 1 - (actual_impact / anticipated_impact)
```
When anticipated impact > actual impact, PM was effective.

**Amor Fati (Love of Fate) Quotient:**
```
AF = acceptance_ratio = (accepted_outcomes) / (total_outcomes)
```

### HeartFlow Module Mapping

| Stoic Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Dichotomy of control | `virtue-ethics-foundation.js` (stoicism tradition) | Already has `dichotomyOfControl` concept; `precisionWeight(sigma)` for controllable precision |
| Negative visualization | `counterfactual-verifier.js` + `stability-guard.js` | `counterfactualEngine` simulates worst cases; `predictiveCodingFreeEnergy(s, mu, sigma)` |
| Four virtues | `virtue-ethics-foundation.js` + `judgment-engine.js` | `minimax(payoffRows)` for courage decisions; `irtRasch(theta, b)` for virtue measurement |
| Amor fati | `acceptance` in `being-mode.js` | `regretTheory(probs, utils, bestUtil)` — minimize regret = accept outcomes |
| Inner citadel | `spontaneous-restraint.js` + `self-verifier.js` | `klDivergence(p, q)` — minimize divergence from inner values |
| Memento mori | `temporal awareness` via `time-extension.js` | Time horizon affects utility calculations: `subjectiveUtility(probs, utils)` |

---

## 6. Existentialism — Authenticity, Thrownness, Being-Toward-Death

### Core Concept
Humans are "thrown" into existence without inherent meaning — we must create our own authentic meaning through free choices. Awareness of mortality (being-toward-death) intensifies authentic living. Bad faith is denying our freedom.

### Quantifiable Formula/Model
**Authenticity Index:**
```
AI = (choices_aligned_with_values) / (total_choices) · freedom_acknowledgment
```

**Bad Faith Detection:**
```
BF = (external_attributions / total_attributions)  // > 0.5 indicates bad faith
```

**Being-Toward-Death Intensity:**
```
BTD = mortality_salience · time_pressure_factor
Time_pressure = 1 / (expected_remaining_decisions)
```

**Existential Freedom Score:**
```
EF = perceived_options / actual_options  // freedom awareness
```

### HeartFlow Module Mapping

| Existentialist Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Authenticity | `self-model.js` + `self-verifier.js` | `cognitiveDissonance(beliefs, actions)` — low dissonance = authenticity |
| Thrownness (Geworfenheit) | `identity-core.js` (boot-time identity) | Boot state as "thrown" condition; `shannonEntropy(probs)` = existential uncertainty |
| Being-toward-death | `time-extension.js` + `meaning-purpose-engine.js` | Time horizon modulates `prospectValue(x, {alpha,beta,lambda})` |
| Bad faith | `language-honesty.js` + `being-mode.js` | `crossEntropy(p, q)` — mismatch between stated and actual = bad faith |
| Radical freedom | `desire-engine.js` (autonomy desire) | `softmaxPolicy(qValues, tau)` with high tau = more exploratory freedom |
| Absurd (Camus) | `absurdity` handled by `meaning-purpose-engine.js` | When MFI → 0 but choice persists = absurd hero |

---

## 7. Attachment Theory — Secure Base, Internal Working Models

### Core Concept
Early attachment relationships form "internal working models" (IWMs) that shape expectations about self, others, and relationships throughout life. Attachment styles: secure, anxious, avoidant, disorganized.

### Quantifiable Formula/Model
**Attachment Style Vector:**
```
AS = [anxiety_dimension, avoidance_dimension]
Secure: low anxiety, low avoidance
Anxious: high anxiety, low avoidance  
Avoidant: low anxiety, high avoidance
Disorganized: high anxiety, high avoidance
```

**Internal Working Model Coherence:**
```
IWM_coherence = 1 - KL_divergence(self_model || other_model)
```
Secure attachment → coherent IWMs; insecure → incoherent (divergent self/other models)

**Secure Base Effect:**
```
Exploration = base_rate · (1 + secure_base_strength) · (1 - threat_level)
```

### HeartFlow Module Mapping

| Attachment Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Internal working models | `self-model.js` + `user-model.js` | `klDivergence(p, q)` — divergence between self/other models |
| Secure base | `human-relation.js` + `identity-core.js` | `stabilityGuard` — secure base = high stability |
| Attachment anxiety | `emotion-dynamics-engine.js` (anxiety dimension) | `yerkesDodson(arousal, a, b, c)` — high arousal without performance |
| Attachment avoidance | `boundary-negotiation.js` | `softmaxPolicy(qValues, tau)` with low temperature = avoidance (rigid) |
| Relationship expectations | `empathy-responder.js` + `tom-engine.js` | `bayesUpdate(pBgivenA, pA, pB)` — updating relationship models |
| Repair after rupture | `conflict-resolution.js` + `forgiveness-engine.js` | `experienceReplay(buffer, batchSize)` — learning from relational repair |

---

## 8. Mihaly Csikszentmihalyi — Flow State

### Core Concept
Flow is optimal experience — complete absorption in an activity where challenge and skill are balanced at a high level. Characterized by: clear goals, immediate feedback, merging of action and awareness, loss of self-consciousness, distorted time perception, autotelic experience.

### Quantifiable Formula/Model
**Flow State Equation (already in HeartFlow):**
```
Flow = 1 - |log2(challenge/skill)| / max_bits
```
- Flow ≈ 1 when challenge ≈ skill (optimal ratio ~1.1)
- Flow ≈ 0 when mismatch is large (anxiety: challenge >> skill; boredom: skill >> challenge)

**Flow Channel Diagram:**
```
Anxiety zone:    challenge/skill > 1.5
Flow channel:    0.9 < challenge/skill < 1.5  
Boredom zone:    challenge/skill < 0.9
```

**Optimal Challenge:**
```
Challenge_optimal = skill × 1.1
```

**Autotelic Experience Quotient:**
```
AEQ = intrinsic_motivation / (intrinsic + extrinsic_motivation)
```

**Flow Frequency Index:**
```
FFI = flow_episodes / total_activity_episodes
```

### HeartFlow Module Mapping

| Flow Concept | HeartFlow Module | Formula/Mechanism |
|---|---|---|
| Challenge-skill balance | `formula-bridge.js` — `flowChannel(challenge, skill, maxBits)` | Already implemented! Direct formula |
| Optimal challenge | `formula-bridge.js` — `flowOptimal(skill, ratio)` | Already implemented! |
| Clear goals | `goal-pursuer.js` + `hierarchical-planner.js` | `actrExpectedGain(probs, utils)` — clear utility = flow-enabling |
| Immediate feedback | `experience-validator.js` + `metacognitive-feedback.js` | `actorCritic(reward, gamma, vNext, vCurrent)` — TD error as feedback signal |
| Merging action/awareness | `global-workspace.js` + `cognitive-load-balancer.js` | `gwtWinner(activations)` — single focus, no distraction |
| Loss of self-consciousness | `phenomenology-engine.js` + `being-mode.js` | `iitPhi(miWhole, miParts)` — integrated information peaks in flow |
| Time distortion | `time-extension.js` | `ebbinghausRetention(ageMs, strengthMs)` — altered time perception |
| Autotelic experience | `curiosity-engine.js` + `desire-engine.js` (intrinsic motivation) | `activeInferenceEFE(qDist)` — information-seeking as intrinsic reward |

---

## Summary: Formula-Ready Cross-Reference Matrix

| Theory | Core Formula | HeartFlow Implementation | Module(s) |
|---|---|---|---|
| Jung — Shadow Integration | `SII = 1 - |self_ideal - self_actual| / max` | `cognitiveDissonance(beliefs, actions)` | `identity-core`, `self-model` |
| Maslow — SAQ | `SAQ = (peaks/total) · mean(autonomy, creativity, acceptance)` | `irtRasch(theta, b)` + desire satisfaction | `desire-engine`, `identity-core` |
| Frankl — MFI | `MFI = Σ(w_i · source_i) / Σ w_i` | `informationValue(priorEU, posteriorEU)` | `meaning-purpose-engine` |
| Buddhist — Dukkha | `D = C · R` (Craving × Resistance) | `ebbinghausRetention` + `shannonEntropy` | `emotion-dynamics`, `meaning-purpose` |
| Stoic — DoC | `DoC = N_controlled / N_total` | `precisionWeight(sigma)` + `predictiveCodingFreeEnergy` | `virtue-ethics-foundation` |
| Existential — AI | `AI = aligned_choices / total_choices` | `crossEntropy(p, q)` + `cognitiveDissonance` | `self-verifier`, `being-mode` |
| Attachment — AS | `AS = [anxiety, avoidance]` 2D vector | `klDivergence(self_model, other_model)` | `self-model`, `user-model`, `human-relation` |
| Flow — Flow | `Flow = 1 - |log2(C/S)| / max_bits` | ✅ Already: `flowChannel(c, s, mb)` | `formula-bridge` |

---

## Implementation Priority

### Phase 1 — Direct Formula Additions (formula-bridge.js)
1. **Jung Shadow Integration**: `shadowIntegration(selfIdeal, selfActual, maxDivergence=1)` 
2. **Maslow SAQ**: `selfActualizationQuotient(peakRatio, autonomy, creativity, acceptance)`
3. **Frankl MFI**: `meaningFulfillmentIndex(creative, experiential, attitudinal, weights)`
4. **Buddhist Dukkha**: `dukkhaIndex(craving, resistance)`
5. **Stoic DoC**: `dichotomyOfControl(controlled, total)`
6. **Existential Authenticity**: `authenticityIndex(alignedChoices, totalChoices, freedomAwareness)`
7. **Attachment Style**: `attachmentVector(anxiety, avoidance)` → classify style
8. **Flow FFI**: `flowFrequencyIndex(flowEpisodes, totalEpisodes)`

### Phase 2 — Module Wiring (formula-registry.js cognitive stage tags)
- Add `identity_formation` stage for Jung/Maslow/Frankl formulas
- Add `ethical_reasoning` stage for Stoic/Buddhist formulas  
- Add `relational_modeling` stage for attachment formulas
- Add `flow_state` stage for Csikszentmihalyi formulas

### Phase 3 — Module Integration
- Wire `shadowIntegration` into `self-model.js` for shadow awareness
- Wire `meaningFulfillmentIndex` into `meaning-purpose-engine.js`
- Wire `authenticityIndex` into `self-verifier.js`
- Wire `attachmentVector` into `human-relation.js`
- Wire `flowFrequencyIndex` into `cognitive-load-balancer.js`