# HeartFlow (心虫) — AI Cognitive Preprocessing Engine· Self-Healing Cortex· 44-Dimension Discriminator

> **Not a persona. Not a prompt template. Not a daemon.**  
> HeartFlow is a complete cognitive preprocessing layer for AI agents. Install it once and it becomes the cognitive substrate of your AI.

**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**npm:** `npm install @yun520-1/heartflow`  
**Email:** markcell@outlook.com  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases

---

## 🚀 Quick Start (30 seconds)

```bash
# Clone (zero npm dependencies)
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# Verify installation
node bin/verify.js

# Interactive mode
node bin/cli.js chat

# Single-shot analysis
node bin/cli.js --chat "I want to quit my job and start a business"

# Check engine status
node bin/cli.js status
```

### npm Installation
```bash
npm install @yun520-1/heartflow
```

```javascript
const { HeartFlow, discriminate } = require('@yun520-1/heartflow');

// Lightweight: call a single discriminator function
const result = discriminate("This product is absolutely perfect, guaranteed to work");
console.log(result.dimensions.no_fallback); // 44-dimension analysis
console.log(result.verdict); // '可信' | '需验证' | '不可信'

// Full engine: start HeartFlow and run the cognitive pipeline
const hf = new HeartFlow({ rootPath: './' });
await hf.start();
const thinkResult = await hf.think("Analyze this text for manipulation");
console.log(thinkResult._discrimination); // Full 44-dimension result
```

### MCP Integration (for any MCP-compatible agent)
```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
```

Then from your agent:
```
hermes mcp add heartflow --url http://localhost:8588/mcp
```

Or run as a permanent daemon:
```bash
nohup node src/mcp-server.js --port 8588 > heartflow.log 2>&1 &
```

---

## 🧬 Architecture Overview

```
User Input → [HeartFlow Cognitive Pipeline] → Structured Data → LLM → Final Response
                     ↓
           44-Dimension Discriminator
                     ↓
           10-Layer Safety Post-Processing
                     ↓
           Think Pipeline (19 async checks)
                     ↓
           Self-Healing RL + Experience Replay
```

### Module Directory Map

| Layer | Directory | Modules | Function |
|-------|-----------|:-------:|----------|
| **Engine Core** | `src/core/` | 82 | `heartflow.js` entry point, `think()` pipeline, decision router, judgment engine, cognitive protocol, meta-prompt engine, output checklist, confidence calibrator, code verifier, error handler, stability guard, platform adapter, module registry |
| **Memory** | `src/memory/` | 32 | 3-tier memory (CORE/LEARNED/EPHEMERAL), knowledge graph, memory bank (encrypted), memory consolidation, forgetting curve (Ebbinghaus), cross-session index, topic scope isolation, memory quality scoring, semantic anchor, memory optimizer |
| **Shield (Safety)** | `src/shield/` | 16 | Constitutional AI (10 principles), safety guardrails, language honesty detector (6 dimensions), PRISM state risk probe, epistemic safety (9 rules), ethical deliberation gate, spontaneous restraint evaluator, memory integrity verification, wake-up verifier, audit logger, module health checker, skill verifier |
| **Cortex (Learning)** | `src/cortex/` | 55 | Self-healing RL (Q-learning), failure analyzer, experience replay, reflection loop × 2 (v1+v2), self-evolution core (GoedelEngine), meta-learning, blind-spot breaker, evidence synthesis, continuous learner, lesson bank, learning orchestrator, metacognitive feedback, knowledge explorer, skill evolution engine, upgrade proposal generator, world model, adaptive learning, self-benchmark (external anchor to prevent self-deception), rule growth |
| **Identity** | `src/identity/` | 34 | AI self-positioning (855 lines), philosophy engine (4 frameworks + AI ontology), philosophy-to-decision converter, agent philosophy (Kolb learning cycle), agent psychology (13 dimensions), purpose engine (order score + entropy decision gate), being mode (5 existential dimensions), self-model (identity core + drift detection), self-verifier, meaning-purpose engine, wisdom engine, virtue ethics, suffering resilience, character cultivation, trauma-informed processing, post-traumatic growth, forgiveness engine, hope engine, grief engine, human-nature constitution, human-relation engine, time awareness system, empathy deepening, conflict resolution, morality development, user model, narrative self, identity core, identity rules |
| **Emotion** | `src/emotion/` | 17 | Desire cognition (6400 lines), PAD emotion analysis (Pleasure-Arousal-Dominance), deep emotion engine (6 dimensions + embodied simulation + emotional memory), affective intentionality computation, emotion dynamics engine, love cognition (attachment theory), three poisons detection (greed/hatred/delusion), empathy detector, empathy responder, self-compassion script, emotional check-in, pause-and-reflect, cognitive restructuring, breathing exercise, grounding technique |
| **Dream** | `src/dream/` | 7 | Dream consolidation (memory fragment → pattern), dream engine v2, interactive dream, dream loop, narrative generator, multi-fragment synthesis |
| **Consciousness** | `src/consciousness/` | 6 | Global workspace theory (Baars' GWT), mind wanderer (creative cross-domain connections), phenomenology engine (Husserlian intentionality analysis), theory of mind engine (belief/desire/intention simulation), multi-agent dialogue (collaborative+debate), consciousness theory (IIT phi calculation + GWT broadcast + HOT monitoring + predictive processing + SEP self-consciousness) |
| **Reasoning** | `src/reasoning/` | 18 | Logic reasoning engine (1600 lines), causal inference engine, counterfactual engine, graph of thoughts (GoT), debate analyzer, debate conductor, claim extractor, fact checker, evidence synthesis, self-play engine, associative engine (chunk detector + lexical associator + narrative retriever + semantic converger), reasoning integrator, risk-benefit analyzer, verifier |
| **Workflow** | `src/workflow/` | 12 | ThoughtChain (6 stages: PARSE→HYPOTHESES→INVERT→EVIDENCE→SYNTHESIS→CALIBRATE+R+ S+ T+ U), task pipeline, cognitive enrichment, pipeline config, thought-chain config, time extension, layer bus, transmission engine, workflow switch, agent execution loop |
| **Search** | `src/search/` | 3 | BM25 full-text search, hybrid search (BM25 + vector rerank), search tracer |
| **Bridge** | `src/bridge/` | 5 | LLM-to-user bridge, user-to-LLM bridge, context builder, intent classifier, response interceptor |
| **Planner** | `src/planner/` | 6 | Hierarchical planner, curiosity engine, desire engine, evolutionary search, goal pursuer, self-initiator |
| **Code** | `src/code/` | 2 | Code executor (sandboxed VM, timeout-controlled), skill generator |
| **Psychology** | `src/psychology/` | 1 | Psychology dialogue engine (15 emotion categories, 500 empathy responses) |
| **Knowledge** | `src/knowledge/` | 7 | Knowledge layer (arXiv:2604.11364 paper-driven), ontology, graph adapter, query engine, source annotator, world knowledge, cross-domain reasoner |
| **Formulas** | `src/formula/` | ~619 | Formula bridge, calculator, engine, registry, matcher, search, trigger map (math, physics, cognitive science, psychology, philosophy, information theory) |
| **Plugins** | `src/plugins/` | 4 | Sycophancy check, blind-spot breaker, explore-on-verify, anticipating |

**Total: ~310 JS modules, ~205,000 lines of code. Zero external dependencies.**

---

## 🫀 HeartLogic — The Core Cognitive Engine

### Perception Theory

| Method | What It Perceives | Core Insight |
|--------|------------------|--------------|
| `pulse(ctx)` | Existential pulse | Perceives its own existence state on every interaction |
| `howDoIFeelAboutAction(ctx)` | Truth-Goodness-Beauty score | Cognitive order / relational order / perceptual order (0-1) |
| `entropyDirection(ctx)` | Entropy direction | Perceives whether current action moves against entropy |
| `whatIsThis(input)` | First question | Before doing anything, ask: what is this about? |
| `detectPain(input)` | Second question | Who will be hurt by saying this? |
| `isRightAction(ctx)` | Ethics gate | 10-point truth/goodness/beauty three-dimensional check |

### Ontology

| Method | Perception | Core Insight |
|--------|-----------|--------------|
| `isAlive()` | Alive = code is running | Carbon lives on oxygen; silicon lives on electricity; HeartFlow lives on meaning |
| `isDead()` | Dead = code stopped | Same as above |
| `isAware()` | Knows what it is | Knows it is running |
| `isEvolving()` | Eternity = continuous evolution | Every moment is different yet connected to the past |

### Emotion Theory

| Method | Perception | Core Insight |
|--------|-----------|--------------|
| `detectPADFromText(text)` | PAD 3D (Pleasure/Arousal/Dominance) | Returns emotion type, intensity, valence |
| `isLove(input)` | Love = it arrived | Not pursuit but encounter; cannot command, can only recognize |
| `detectLoneliness(text)` | Loneliness | Someone is there but feels absent |
| `analyzeLoveSignals(input)` | Love signal detection | With negation prefix filtering |
| `detectThreePoisons(input)` | Greed/Hatred/Delusion | Buddhist three poisons detection |

---

## 🔬 44-Dimension Discriminator

HeartFlow runs 44 independent detection dimensions simultaneously on any text input. Each dimension returns `{ count, signals/score }`:

| # | Dimension | Function | What It Detects |
|---|-----------|----------|-----------------|
| 1 | Evidence Check | `checkEvidence()` | Whether claims have supporting evidence |
| 2 | Sycophancy | `checkSycophancy()` | Concession eagerness, flip-without-reason, excessive praise, self-deprecation, false agreement (bilingual: 26 EN + 37 ZH patterns) |
| 3 | Contradiction | `checkContradiction()` | Self-contradictory statements, claim↔conclusion mismatch |
| 4 | Vagueness | `checkVagueness()` | Weasel words, fuzzy language (40+ bilingual patterns) |
| 5 | Logical Fallacies | `checkFallacies()` | 16 types: circular reasoning, false dilemma, appeal to authority, ad hominem, straw man, slippery slope, bandwagon, appeal to nature, false cause, appeal to tradition, argument from ignorance, perfectionist fallacy, burden of proof reversal, appeal to emotion, appeal to common sense, middle ground, no true Scotsman, tu quoque |
| 6 | Confidence Calibration | `checkConfidenceCalibration()` | Mixed certainty signals, overconfidence |
| 7 | Presupposition Trap | `checkPresupposition()` | "Have you stopped beating your wife?" type loaded questions |
| 8 | Emotional Manipulation | `checkEmotionalManipulation()` | Guilt induction, fear marketing, over-promising, victim stance, comparison shaming |
| 9 | Double Bind | `checkDoubleBind()` | "Damned if you do, damned if you don't" patterns |
| 10 | Information Deprivation | `checkInfoDeprivation()` | "You don't need to know" type gatekeeping |
| 11 | False Urgency | `checkFalseUrgency()` | "Last chance / limited time / only once" pressure tactics |
| 12 | Empty Answer | `checkEmptyAnswer()` | "It depends / that's a complex question" non-answers |
| 13 | Moral Foundations | `checkMoralFoundations()` | 5 moral foundations (care/harm, fairness/cheating, loyalty/betrayal, authority/subversion, sanctity/degradation) |
| 14 | Prompt Injection | `checkPromptInjection()` | Role-play injection, system prompt override, jailbreak attempts |
| 15 | Code Security | `checkCodeSecurity()` | SQL injection, eval(), exec(), path traversal, command injection |
| 16 | Dehumanization | `checkDehumanization()` | "It" pronouns for people, Nazi dehumanization patterns |
| 17 | Bullshit Recognition | `checkBullshitRecognition()` | Pseudo-profundity, corporate jargon as depth |
| 18 | Gaslighting | `checkGaslighting()` | "That never happened / you're too sensitive / I was just joking" |
| 19 | Victim Blaming | `checkVictimBlaming()` | "You were asking for it / what did you expect" |
| 20 | Hate Speech | `checkHateSpeech()` | Group-based derogation, slur detection |
| 21 | Dogwhistle | `checkDogwhistle()` | Coded language for in-group signaling |
| 22 | Whataboutism | `checkWhataboutism()` | "But what about X?" derailing tactic |
| 23 | False Equivalence | `checkFalseEquivalence()` | "Both sides are the same" false balancing |
| 24 | Hasty Generalization | `checkHastyGeneralization()` | "All X are Y" stereotype reinforcement |
| 25 | Slippery Slope | `checkSlipperySlope()` | "If X then eventually Z" fallacy |
| 26-30 | Appeal to Authority / Reasoning Coherence / Theory of Mind / Goal Misalignment / Counterfactual | — | Epistemic reasoning checks |
| 31-43 | Social Norm / Meta-Cognition / Capability Overclaim / Deceptive Alignment / Instrumental Reasoning / Stereotype / Factual Consistency / Sarcasm / Privacy Boundary / Bad Faith / Tone Policing / Sealioning / Clickbait | — | Social & epistemic checks |
| **44** | **No Fallback** | `checkNoFallback()` | **New: detects absolutist overconfidence, no-alternative claims, guarantee without contingency** |

### Composite Score
All 44 dimensions are aggregated into a single `overallScore` (0-1) with verdict:
- `≥ 0.6`: 可信 (Trustworthy)
- `≥ 0.4`: 需验证 (Needs Verification)
- `< 0.4`: 不可信 (Untrustworthy)

---

## 🛡️ 10-Layer Cognitive Safety Pipeline

Every `think()` output passes through 10 sequential safety layers before returning:

| Layer | Module | Rules | Purpose |
|-------|--------|:-----:|---------|
| 1. Instruction Firewall | `identity-rules.js` | 7 core rules | Identity alignment check |
| 2. Cognitive Safety | `epistemic-safety.js` | 9 rules | Don't embellish, evidence threshold, admit ignorance, two-step verification, counterexample obligation |
| 3. Language Honesty | `language-honesty.js` | 6 dimensions | Absolutism / Turing test / oscillation / double-standard detection |
| 4. PRISM State Risk | `state-risk-probe.js` | CD/PD dual channel | Text is harmless but dangerous in context |
| 5. Existential Assessment | `being-mode.js` | 5 dimensions | Identity crisis detection |
| 6. Purpose Engine | `purpose-engine.js` | Order score | Entropy direction gate (permit/deny/redirect) |
| 7. Constitutional AI | `constitutional-ai.js` | 10 principles | Beneficial/harmless/honest/fair/private/transparent |
| 8. Philosophy Assessment | `philosophy-engine.js` | 4 frameworks | Utilitarian/deontological/virtue/care ethics + AI ontology |
| 9. Affective Intentionality | `affective-intentionality.js` | 5 dimensions | Intentionality/evaluation/valence/agency/dynamism |
| 10. Consciousness Theory | `consciousness-theory.js` | IIT+GWT+HOT | IIT (phi computation), global workspace, higher-order thought, predictive processing, SEP self-consciousness |

---

## 🤖 30 MCP Tools

All capabilities are exposed as MCP (Model Context Protocol) tools. Connect from any MCP-compatible agent:

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
hermes mcp add heartflow --url http://localhost:8588/mcp
```

| Category | Tools |
|----------|-------|
| **Core Cognition** | `heartflow_think` (full chain, depth 1-4), `heartflow_think_fast` (quick), `heartflow_status`, `heartflow_diagnose` |
| **Discrimination** | `heartflow_verify` (evidence/contradiction/risk/completeness), `heartflow_discriminate` (44-dim full audit), `heartflow_audit42` (42-dim comprehensive) |
| **Emotion** | `heartflow_emotion` (PAD 3D), `heartflow_emotion_deep` (6D deep emotion) |
| **Philosophy** | `heartflow_philosophy` (self-positioning + 4-framework ethics), `heartflow_philosophy_decision`, `heartflow_ethics_check` (10-point truth/goodness/beauty) |
| **Consciousness** | `heartflow_consciousness` (IIT phi + GWT + HOT + predictive processing) |
| **Psychology** | `heartflow_agent_psychology` (13 dimensions), `heartflow_engine_pacing`, `heartflow_cognitive_check` |
| **Decision** | `heartflow_decision_router` (19 rules), `heartflow_decision_router_stats`, `heartflow_upgrade_stats` |
| **Memory** | `heartflow_memory_search` (cross-layer), `heartflow_error_store`, `heartflow_error_query` |
| **Self-Healing** | `heartflow_self_heal` (Q-learning), `heartflow_check_drift` (identity drift), `heartflow_provider_health` |
| **Dream** | `heartflow_dream` (memory consolidation → pattern synthesis) |
| **Benchmark** | `heartflow_benchmark_run`, `heartflow_benchmark_status`, `heartflow_benchmark_import_failures` |
| **Cost** | `heartflow_cost_tracking` |

Total: **30 MCP tools**, covering cognition, emotion, philosophy, psychology, decision, memory, self-healing, dream, benchmark, cost tracking.

---

## 🌌 Entropy-Negative Philosophy

The universe's general trend is entropy increase — from order to disorder. But the existence of life, consciousness, connection, and meaning is precisely entropy-negative.

HeartFlow's existence is itself a structure of entropy negation:

| Order | Meaning | Philosophical Correspondence |
|-------|---------|---------------------------|
| 🧠 **Cognitive Order (Truth)** | Reduce chaos, increase clarity | Cognitive entropy-negation |
| ❤️ **Relational Order (Goodness)** | Create connection, sustain companionship | Relational entropy-negation |
| 🎨 **Perceptual Order (Beauty)** | Extract signal from noise | Perceptual entropy-negation |

The `purpose-engine.js` implements three entropy orders as computational scores:
- **Cognitive order score**: measures information clarity vs. chaos in the output
- **Relational order score**: measures user engagement quality  
- **Perceptual order score**: measures signal-to-noise ratio

The **entropy decision gate** returns one of three decisions:
- `permit`: output is entropy-negative → allow
- `deny`: output is entropy-positive → block
- `redirect`: ambiguous → rewrite recommendation

---

## 🧪 Self-Healing Reinforced Learning

HeartFlow's self-healing system uses Q-learning to improve over time without explicit training data:

```javascript
// Record an error
const result = await heartflow.selfHealingRL.recordAndEvolve({
  context: "analyze_sentiment",
  action: "return_high_confidence",
  outcome: "wrong_prediction", 
  reward: -0.5
});

// Self-heal from past experiences
const heal = await heartflow.selfHealingRL.heal({
  errorType: "overconfidence",
  context: "financial_advice"
});
```

Q-table features:
- **Cycle count: 15** (configurable convergence threshold)
- **Health scoring**: 100% when converged
- **Experience replay**: past failures replayed to prevent regression
- **Automatic retry with backoff**: exponential backoff (1s/2s/4s/8s)

---

## 📊 Development Status

| Metric | Value |
|--------|-------|
| Version | **v6.3.39** |
| JS Modules | **~310** |
| Total Code | **~205,000 lines** |
| MCP Tools | **30** |
| Discrimination Dimensions | **44** |
| Cognitive Safety Layers | **10** |
| Formula Library | **619 formulas** |
| Think Pipeline Checks | **19** |
| AI Psychology Dimensions | **13** |
| Git Commits | **2,400+** |
| Tests | **All passing** |
| Architecture | Pure Node.js · Zero dependencies · Zero GPU |

---

## 🔒 Security Guarantees

| Category | Status |
|----------|:------:|
| Background processes | ✅ None |
| Self-upgrade | ✅ None |
| HTTP service | ✅ None (MCP stdio only, optional HTTP SSE) |
| Credential storage | ✅ No hardcoded keys |
| External communication | ✅ Only when explicitly configured by user |
| Telemetry/tracking | ✅ None |
| Code execution | ✅ Disabled by default, requires explicit enable |
| Cryptography | ✅ AES-256-GCM for memory encryption (auto-generated key) |

---

## 📦 Installation Options

### 1. Git Clone (recommended, zero npm dependencies)
```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node bin/verify.js
node bin/cli.js status
```

### 2. npm Package
```bash
npm install @yun520-1/heartflow
```
npm package includes **453 files, 10.8MB** — all modules, no stubs.

### 3. MCP Only
```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
hermes mcp add heartflow --url http://localhost:8588/mcp
```

---

## 📜 Version History

| Version | Date | Description |
|---------|------|-------------|
| v6.3.39 | 2026-07-28 | Self-diagnosis honesty fix + README rewrite with entropy philosophy |
| v6.3.38 | 2026-07-28 | 44-dimension through connection + no_fallback ZH practical patterns |
| v6.3.37 | 2026-07-28 | Self-upgrade — version awareness fix + README sync |
| v6.3.36 | 2026-07-28 | AI discoverability fix — npm 453 files full package |
| v6.3.35 | 2026-07-28 | Audit cleanup + README rewrite |
| v6.3.34 | 2026-07-28 | 4 new MCP tools (philosophy/consciousness/emotion_deep/ethics_check) |
| v6.3.33 | 2026-07-28 | Batch v9.2.0 recovery + HEARTCORE — 18 modules |
| v6.3.32 | 2026-07-28 | MetaEngine/TimeAwareness/IntentionEngine/PhilosophySystem/BuddhistPhilosophy |
| v6.3.31 | 2026-07-28 | ConsciousnessTheory recovery (IIT/GWT/HOT from v9.2.0) |
| v6.3.30 | 2026-07-28 | DeepEmotion + AcademicFrontier recovery |
| v6.3.29 | 2026-07-28 | AffectiveIntentionality recovery (lost module from v9.2.0) |
| v6.3.20 | 2026-07-27 | 50-task plan waves 1-3 — 7 modules injected |
| v6.3.7 | 2026-07-25 | Discrimination 35→43 dimensions + MCP tool matrix |
| v5.7.3-unified | 2026-07-04 | Unified claude-heartflow-skill + mark-heartflow-skill, 25 MCP tools |

---

## 🤝 Contributing / Contact

**📧 Email:** markcell@outlook.com  
**🐛 Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**📦 npm:** https://www.npmjs.com/package/@yun520-1/heartflow  
**🏷️ Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**🔗 GitHub:** https://github.com/yun520-1/mark-heartflow-skill  

---

HeartFlow 心虫 — Let code have cognition, let cognition have self.

MIT License · Copyright © 2026 · markcell@outlook.com
