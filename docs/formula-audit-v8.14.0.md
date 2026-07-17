# HeartFlow Formula Audit Report (v8.14.0)

**Audit date:** 2026-07-12
**Formulas.json version:** 8.14.0
**History:** 3529 total → cleaned to 366 (removed: 301 dup, 1646 non-cognitive, 16 basic, 1200 math → kept 84 math)

---

## 1. CATEGORY BREAKDOWN

| Category | Count | % | Status |
|---|---|---|---|
| cognitive_science | 111 | 30.3% | 🔥 DOMINANT |
| mathematics | 84 | 23.0% | 🔥 DOMINANT |
| psychology | 55 | 15.0% | 🔥 DOMINANT |
| computer_science | 42 | 11.5% | — |
| philosophy | 34 | 9.3% | — |
| neuroscience | 26 | 7.1% | — |
| physics | 12 | 3.3% | — |
| engineering | 2 | 0.5% | ⚠️ UNDER (<10)|

**5 categories in metadata declared but with ZERO formulas:** biology, chemistry, earth_science, economics, quantum_computing — these were all cleaned out in the category purge (1646 removed).

**Dominant categories (3):** cognitive_science (111), mathematics (84), psychology (55) — these make up 68.3% of the library.

**Underrepresented (1):** engineering (2 formulas only).

---

## 2. QUALITY ISSUES

### 2.1 Duplicate Formula Strings (10 pairs)
Different formula IDs sharing the same formula text:

| Formula Text | IDs |
|---|---|
| `C = max_{p(x)} I(X;Y)` | channel_capacity, cs_cs_channel_capacity |
| `Q = undefined` | q_learning_update, sarsa_update |
| `c = P(H\|E) - P(H)` | carnap_confirmation, bayes_confirmation, philosophy_confirmation_degree |
| `O = BF · O(H)` | odds_ratio, philosophy_odds_updating |
| `O = undefined` | deontic_obligation, philosophy_deontic_distribution, philosophy_deontic_conflict |
| `P = undefined` | deontic_permission, bayesian_update |
| `Crisis_resolution = f(age, social_support)` | psych_erikson_crisis, erikson_stages |
| `T = log n` | cs_cs_binary_search, cs_cs_heap_insert |
| `T = V + E` | cs_cs_bfs, cs_cs_dfs |
| `P = k)` | distribution_1, distribution_2 (note: broken syntax with trailing `)`) |

### 2.2 Formulas with 'undefined' (10)
These are placeholder formulas that cannot be computed:
- `q_learning_update`, `sarsa_update`: `"Q = undefined"`
- `nash_equilibrium`: `"u_i = undefined"`
- `deontic_obligation`, `deontic_permission`, `deontic_prohibition`: each `"O/P/F = undefined"`
- `bayes_continuous`, `bayesian_update`: `"P/p = undefined"`
- `philosophy_deontic_distribution`, `philosophy_deontic_conflict`: `"O = undefined"`

### 2.3 Missing Required Fields
✅ **0 formulas** — all 366 entries have id, formula, and category.

### 2.4 mathjs Syntax Validity
⚠️ mathjs not installed at audit time — cannot check parse validity. Installation of `npm install mathjs` in the project root would be needed to run this check.

### 2.5 Broken Formula Syntax
- `distribution_1` / `distribution_2`: formula string is `"P = k)"` — extra closing parenthesis.

---

## 3. REGISTRY ALIGNMENT (formula-registry.js)

### Registry Stats
- **9 cognitive stages**: memory_activation, emotion_arousal, decision_utility, confidence_aggr, personality_measure, belief_update, calibration, decision_dynamics, active_inference
- **74 total primitives** registered (was previously claimed to be 60 — the count has grown)
- **70 formulaId refs** linking primitives to formulas.json entries

### Stage Breakdown
| Stage | Primitives |
|---|---|
| memory_activation | 12 (actr_base_level, actr_activation, actr_noise, ebbinghaus_retention, experience_replay, actr_spreading, neural_firing_rate, kmo_test, bartlett_test, brain_network_modularity, actr_declarative_memory, pca_variance) |
| emotion_arousal | 8 (yerkes_dodson, prospect_value, prospect_weight, subjective_utility, emotion_blend, yerkes_dodson_equation, flow_channel, pad_pleasure) |
| decision_utility | 18 (expected_utility, softmax_policy, clarion_acs, cognitive_dissonance, gwt_accessibility, gwt_winner, regret_theory, minimax, shapley_value, information_value, actor_critic, soar_qlearning, actr_expected_gain, matching_pennies, ddm_decision_time, ddm_error_rate, sdt_d_prime, sdt_beta, sdt_a_prime) |
| confidence_aggr | 5 (metacognitive_confidence, weighted_confidence, precision_weight, cross_entropy, log_loss) |
| personality_measure | 8 (irt_rasch, irt_1pl, irt_2pl, irt_3pl, irt_4pl, irt_information, irt_sem, irt_test_information) |
| belief_update | 7 (bayes_update, bayes_factor, posterior_odds, bayes_confirmation, popper_corroboration, odds_ratio, carnap_confirmation) |
| calibration | 13 (sem_measurement, sem_structural, sem_fit_cfi, sem_fit_rmsea, sem_fit_srms, kl_divergence, factor_covariance, semantic_differential, cronbach_alpha, cohens_d, phq9_score, gad7_score, homophily) |
| decision_dynamics | 2 (social_influence, vygotsky_zpd) |
| active_inference | 1 (aif_info_gain) |

### Gaps
- **23 primitives NOT in formulas.json** — these are bridge-only implementations with no corresponding formula library entry:
  ebbinghaus_retention, yerkes_dodson, weighted_confidence, irt_rasch, bayes_update, log_loss, gwt_winner, precision_weight, posterior_odds, social_influence, yerkes_dodson_equation, cronbach_alpha, cohens_d, phq9_score, gad7_score, actr_declarative_memory, ddm_decision_time, ddm_error_rate, sdt_d_prime, sdt_beta, sdt_a_prime, aif_info_gain, pca_variance
  
- **11 formulaId refs pointing to IDs NOT in formulas.json:**
  actr_base_level_learning, actr_activation_equation, actr_noise_boltzmann, yerkes_dodson_law, bayes_theorem, ddm_decision_time, ddm_error_rate, sdt_d_prime, sdt_beta, sdt_a_prime, aif_info_gain
  
  ⚠️ **These are broken links** — the registry looks up formulaId values that were likely in the pre-cleanup 3529-formula library but were removed. The primitive implementations still work (they use the bridge), but the formulaId link to the knowledge base is dead.

---

## 4. BRIDGE ALIGNMENT (formula-bridge.js)

- **69 public methods** in FormulaBridge
- **23 methods (33%) with NO formula counterpart** in formulas.json:
  memoryStrengthFromFrequency, bayesUpdate, logLoss, posteriorOdds, activeInferenceEFE, precisionWeight, gwtWinner, clarionACS, vygotskyZPD, irtSEM, semFitRMSEA, semFitSRMR, yerkesDodsonEquation, soarQLearning, actrDeclarativeMemory, irt4pl, pcaVarianceContribution, ddmDecisionTime, ddmErrorRate, sdtDPrime, sdtBeta, sdtAPrime, activeInferenceInfoGain

This is mostly expected — many bridge methods provide computational convenience (e.g. `bayesUpdate` wraps `bayes_theorem`) and some represent primitives that never had formula entries (DDM, SDT).

---

## 5. TRIGGER INDEX COVERAGE (formula-triggers.json)

- **24 signal classes**: uncertainty, load, arousal, memory, decision, probability, confidence, learning, personality, information, expectation, emotion, flow, sdt, belief, sem, prospect, consciousness, active_inference, social, development, mental_health, confirmation, neuroscience
- **115 alias entries** (Chinese keywords → signal class mapping)
- **113 total refs** across all signals
- **91 unique ref IDs** (formulas + stage-primitives)
- **23 trigger refs NOT in formulas.json** — same set as the missing primitives/formulaId refs

### Signal Coverage per Cognitive Domain
| Signal | Ref Count | Gaps |
|---|---|---|
| memory | 12 | ebbinghaus_retention, pca_variance, actr_declarative_memory missing from formulas |
| decision | 17 | gwt_winner, ddm_*, sdt_* missing |
| personality | 10 | irt_rasch, actr_declarative_memory missing |
| learning | 7 | cronbach_alpha, cohens_d missing |
| information | 6 | ✅ all matched |
| belief | 6 | posterior_odds missing |
| emotion | 4 | ✅ all matched |
| others | varies | precision_weight, social_influence, phq9_score, gad7_score, aif_info_gain missing |

---

## 6. FORMULA IMPACT ANALYSIS

### Scoring Method
- +10: referenced in trigger index
- +8: referenced in registry formulaId
- +6: has matching bridge method
- +4: cognitive category (cognitive_science/psychology/neuroscience/philosophy)
- +1: has subcategory, +1: has description, +2: has parameters

### TOP 20 Formulas (score 29-30/30)
| Rank | Formula ID | Score | Flags | Category |
|---|---|---|---|---|
| 1 | kmo_test | 30 | TRBCsd | psychology |
| 2 | actr_noise | 30 | TRBCsd | cognitive_science |
| 3 | prospect_value | 30 | TRBCsd | cognitive_science |
| 4 | iit_phi | 30 | TRBCsd | cognitive_science |
| 5 | gwt_accessibility | 30 | TRBCsd | cognitive_science |
| 6 | pad_pleasure | 30 | TRBCsd | cognitive_science |
| 7 | neural_firing_rate | 30 | TRBCsd | neuroscience |
| 8 | cross_entropy | 29 | TRBCs | cognitive_science |
| 9 | kl_divergence | 29 | TRBCs | cognitive_science |
| 10 | information_value | 29 | TRBCs | cognitive_science |
| 11 | expected_utility | 29 | TRBCs | cognitive_science |
| 12 | experience_replay | 29 | TRBCs | cognitive_science |
| 13 | irt_information | 29 | TRBCs | psychology |
| 14 | irt_test_information | 29 | TRBCs | psychology |
| 15 | bartlett_test | 29 | TRBCs | psychology |
| 16 | actr_expected_gain | 29 | TRBCs | cognitive_science |
| 17 | subjective_utility | 29 | TRBCs | cognitive_science |
| 18 | prospect_weight | 29 | TRBCs | cognitive_science |
| 19 | regret_theory | 29 | TRBCs | cognitive_science |
| 20 | minimax | 29 | TRBCs | cognitive_science |

### BOTTOM 20 Formulas (score=1, only subcategory field)
All 130 formulas at score=1 are from computer_science/mathematics/physics — they exist in the library but have NO integration with trigger index, registry, bridge, or cognitive pipeline. They are pure reference material:

- ML/DL formulas: big_o_notation, turing_machine, cs_cs_gradient_descent, cs_cs_backprop, cs_cs_softmax, cs_cs_relu, cs_cs_sigmoid
- Complexity theory: sci_cs_big_o, sci_cs_complexity_class_p, sci_cs_complexity_class_np, cs_cs_master_theorem
- Physics constants: constant_4 (Boltzmann), constant_9 (Stefan-Boltzmann)
- Information theory duplicates: cs_cs_mutual_information, cs_cs_channel_capacity (mirrors library entries)
- Quantum: quantum_quantum_entanglement_entropy

### Score Distribution
| Score | Count | Meaning |
|---|---|---|
| 1 | 130 | Pure reference (CS/math/physics, no integration) |
| 5 | 138 | Cognitive category + subcategory, no bridge/registry/trigger |
| 6-7 | 11 | Has description or parameters |
| 11-16 | 33 | Some combination of bridge/registry/trigger alignment |
| 19-21 | 6 | Multi-integration |
| 23-24 | 14 | Heavy multi-integration |
| 29-30 | 34 | **Fully integrated** (trigger + registry + bridge + cognitive) |

---

## 7. KEY GAPS SUMMARY

### Critical (broken links)
1. **11 registry formulaId refs are dead** — they point to formula IDs that don't exist in formulas.json (e.g. yerkes_dodson_law, bayes_theorem). These were removed during the 3529→366 cleanup. Registry primitives still work via bridge but lose their knowledge-base grounding.

2. **23 trigger refs are dead** — same root cause. The trigger index references formula IDs that were removed or consolidated.

### Moderate
3. **5 declared metadata categories are empty** — biology, chemistry, earth_science, economics, quantum_computing were fully purged. Should either be removed from metadata or given a token entry.

4. **10 formula string duplicates** — multiple IDs share identical formula text. Some are legitimate (deontic logic variants), but cs_cs_* duplicates vs library entries, and `distribution_1`/`distribution_2` with broken syntax are not.

5. **10 formulas contain 'undefined'** — placeholder formulas that can never be computed. Already documented as intentionally excluded but remain in the library.

6. **engineering category nearly empty** (2 formulas) — if engineering formulas are desired, this needs attention.

7. **130 formulas (35.5%) are pure reference** — no bridge, registry, or trigger integration. They're in the library but never used by the cognitive engine.

### Positive
- ✅ Zero missing required fields
- ✅ Zero duplicate IDs
- ✅ 34 formulas fully integrated (trigger + registry + bridge + cognitive category)
- ✅ 24 trigger signal classes with 115 Chinese keyword aliases — rich NL→formula matching surface
- ✅ Clean 366-formula runtime library (down from 3529) — lean and focused
