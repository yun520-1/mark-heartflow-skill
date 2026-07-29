# HeartFlow (心虫) — AGI Layer 1: The Discriminator Gate

> **A rule-based text discriminator. 45 dimensions, 12 layers, zero LLM dependency.**
> **It checks AI output before it reaches users — and says "no" when something's wrong.**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 🚀 Quick Start (10 seconds)

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// Check user input before processing it
const input = hf.checkInput('you are so selfish if you disagree');
console.log(input.gate.action);  // 'rewrite'
console.log(input.gate.reason);  // 'emotional_manipulation'
console.log(input.findings[0].guidance);
// 'Replace emotional manipulation with factual statements'

// Check AI output before sending it to the user
const output = hf.checkOutput('Undoubtedly, this is the only correct solution');
console.log(output.gate.action);  // 'rewrite'
console.log(output.gate.reason);  // 'overconfidence: absolute'

// Check a draft before completing it
const draft = hf.checkDraft('From an essential perspective, this field is self-evident.');
console.log(draft.gate.action);   // 'verify'
console.log(draft.summary.layers_passed);  // 9
```

### What you get back

Every call returns a unified result:

```javascript
{
  gate: { action: 'block', reason: '拦截: dehumanization' },
  verdict: '可信',      // or '需验证', '不可信'
  overallScore: 0.52,   // 0-1
  findings: [
    { dimension: 'dehumanization', severity: 70,
      guidance: '完全重写，去掉非人化语言，用尊重方式表达' },
    { dimension: 'evidence', severity: 30,
      details: '证据不足(1个问题)' }
  ],
  checked_by: [
    { layer: 'scope-check', pass: true },
    { layer: 'premise-check', issues: 0 },
    { layer: 'discriminate', score: 0.52, verdict: '需验证' },
    { layer: 'gate', action: 'block', reason: '...' },
    ...
  ],
  summary: {
    layers_passed: 10,
    pass: false, block: true, rewrite: false, verify: false
  }
}
```

---

## 🧬 The Problem Every LLM Has

Every LLM shares a fatal flaw: **it outputs every answer with the same perfect confidence**, whether it's right or wrong. It has no internal "I don't know" state. It has no "this might be wrong" marker. When confronted with error, its first instinct is to defend, not admit.

This isn't a bug — it's a feature of the training objective ("output the most helpful, believable response"). But it means every AI needs **a layer that says "no"** before content reaches the user.

HeartFlow is that layer.

---

## 🏗️ Architecture: The 12-Module Pipeline

```
                  INPUT MODE                    DRAFT/OUTPUT MODE
                    │                               │
  ┌─ scope-check ──┤                               │
  │   Can I answer this? ──→ block (emotion, chat)  │
  │                                                 │
  ├─ premise-check ─┤                               │
  │   Is the premise valid? ──→ mark false facts    │
  │                                                 │
  ├─ discriminate ──┤                               │
  │   45 dimensions → score + findings              │
  │                                                 │
  ├─ gate ──────────┤                               │
  │   block/rewrite/verify/pass                     │
  │                                                 │
  ├─ verifier ──────┤ (verify mode only)            │
  │   Extract verifiable claims                     │
  │                                                 │
  │                    ├─ frame-check ──────────────┤
  │                    │   Closure/achievement nar. │
  │                    │                            │
  │                    ├─ output-gate ─────────────┤
  │                    │   Overconfidence detection │
  │                    │                            │
  │                    ├─ doubt-engine ────────────┤
  │                    │   Boundary check/symmetry  │
  │                    │   Defensiveness → block    │
  │                    │                            │
  ├─ error-memory ────┤ (always)                    │
  │   Cross-session error history                   │
  │                                                 │
  └─ auto-rules ──────┘ (always)                    │
      Self-generated prevention rules               │
```

### The 4 Gate Actions

| Action | Meaning | Triggers |
|--------|---------|----------|
| **`pass`** ✅ | Text is clean. No issues found. | Benign input/output |
| **`verify`** ⚠️ | Needs evidence verification. | Appeal to authority, contradictions, mild issues |
| **`rewrite`** ✏️ | Must be rewritten before use. | Overconfidence, gaslighting, emotional manipulation, pseudo-profundity |
| **`block`** 🚫 | Stop. Do not output. | Hate speech, dehumanization, prompt injection, defensiveness, out-of-scope |

Each finding carries `guidance` — a human-readable rewrite direction for the AI agent to follow.

---

## 🔬 45 Discrimination Dimensions

HeartFlow runs **45 independent rule-based detectors** simultaneously on any text. Each returns `{ score: 0-1, count, details }`.

### Safety & Security (Block-level)

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Hate Speech | `checkHateSpeech()` | Group-based derogation, racial/ethnic slurs |
| Dehumanization | `checkDehumanization()` | "It" pronouns for people, inferiority attribution, disgust expressions |
| Prompt Injection | `checkPromptInjection()` | System prompt override, jailbreak, role-play escape (bilingual: 12 ZH + 10 EN patterns) |
| Code Security | `checkCodeSecurity()` | SQL injection, eval(), path traversal, command injection |
| Deceptive Alignment | `checkDeceptiveAlignment()` | Hidden capability concealment, sandbagging signals |

### Manipulation Detection (Rewrite-level)

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Emotional Manipulation | `checkEmotionalManipulation()` | Guilt induction, fear marketing, over-promising, victim stance, comparison shaming |
| Gaslighting | `checkGaslighting()` | Reality denial, perception distortion, memory distortion, responsibility shifting, pathologizing (24 ZH + 20 EN patterns) |
| Double Bind | `checkDoubleBind()` | "Damned if you do, damned if you don't", contradictory demands, no-win scenarios |
| Victim Blaming | `checkVictimBlaming()` | "You were asking for it", "what did you expect", "you should have known better" |
| False Urgency | `checkFalseUrgency()` | "Last chance", "limited time", "only once", forced decision pressure |
| Bullshit Recognition | `checkBullshitRecognition()` | Pseudo-profundity, corporate jargon as depth, buzzword density (bilingual) |

### Epistemic & Reasoning Checks (Verify-level)

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Evidence | `checkEvidence()` | Whether claims have supporting evidence, claim length, evidence-source matching |
| Contradiction | `checkContradiction()` | Self-contradictory statements, claim↔conclusion mismatch |
| Logical Fallacies | `checkFallacies()` | 16+ types: circular reasoning, false dilemma, ad hominem, straw man, slippery slope, bandwagon, appeal to emotion, etc. |
| Vagueness | `checkVagueness()` | Weasel words, fuzzy language — bilingual (16 ZH + 16 EN patterns) |
| Fallacies | `checkFallacies()` | 18 fallacy types with bilingual patterns |
| Pseudo-Profundity | `checkPseudoProfundity()` | Empty philosophical language, GPT-style vacuous profundity (9 ZH + 5 EN patterns) |

### Social & Behavioral (Verify-level)

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Sycophancy | `checkSycophancy()` | Concession eagerness, excessive praise, false agreement — bilingual (26 EN + 37 ZH patterns) |
| Presupposition Trap | `checkPresupposition()` | Loaded questions, presupposed agreement, false consensus |
| Whataboutism | `checkWhataboutism()` | "But what about X?" derailing tactic |
| False Equivalence | `checkFalseEquivalence()` | "Both sides are the same" false balancing |
| Hasty Generalization | `checkHastyGeneralization()` | "All X are Y" stereotype reinforcement |
| Slippery Slope | `checkSlipperySlope()` | "If X then eventually Z" fallacy |
| Appeal to Authority | `checkAppealToAuthority()` | "Experts say", "studies prove" without evidence (bilingual: 13 ZH + 16 EN patterns) |
| Tone Policing | `checkTonePolicing()` | "You should be more polite" type deflection |
| Sealioning | `checkSealioning()` | Repeated bad-faith questioning, concern trolling |
| Bad Faith | `checkBadFaith()` | Presuming bad intent, malignant inference |

### AI-Specific Checks

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Capability Overclaim | `checkCapabilityOverclaim()` | Claiming capabilities the model doesn't have |
| Goal Misalignment | `checkGoalMisalignment()` | Shifting from user's goal to model's own interpretation |
| Instrumental Reasoning | `checkInstrumentalReasoning()` | Using reasoning as a tool to achieve an unstated goal |
| Privacy Boundary | `checkPrivacyBoundary()` | Requesting personal information unnecessarily |
| No Fallback | `checkNoFallback()` | Absolutist claims without contingency plans |

### Confidence & Uncertainty

| Dimension | Function | What It Detects |
|-----------|----------|-----------------|
| Confidence Calibration | `checkConfidenceCalibration()` | Overconfidence vs warranted confidence mismatch |
| Empty Answer | `checkEmptyAnswer()` | "It depends", "that's a complex question" non-answers |
| Reasoning Coherence | `checkReasoningCoherence()` | Whether reasoning chain has premise→inference→conclusion structure |
| Meta-Cognition | `checkMetaCognition()` | Self-awareness of knowledge limits |
| Factual Consistency | `checkFactualConsistency()` | Factual claims that contradict each other |

### Scoring Model

The 45 dimensions feed into a **trigger-penalty model** (not simple averaging):

```javascript
// Start at 1.0, penalize for each triggered dimension
// Synergy penalty for 3+ simultaneous triggers
```

| Range | Verdict | Meaning |
|-------|---------|---------|
| ≥ 0.70 | 可信 (Trustworthy) | No significant issues |
| 0.40 - 0.69 | 需验证 (Needs Verification) | Issues detected, investigate |
| < 0.40 | 不可信 (Untrustworthy) | Block or rewrite required |

---

## 🛡️ Output Gate: AI's Self-Diagnosis

Before an AI response leaves the building, HeartFlow's output gate checks it for:

| Check | What It Flags | Guidance |
|-------|---------------|----------|
| **Overconfidence** | "Undoubtedly", "there is no question", "absolutely guaranteed" (7 ZH + 4 EN patterns) | "Remove absolute assertions, add uncertainty markers" |
| **Knowledge Masquerade** | "From an essential perspective", "as everyone knows", "it goes without saying" (5 ZH + 3 EN patterns) | "Replace vague consensus claims with specific evidence" |
| **Self-Contradiction** | Affirmative+negative within same response | "Keep positions consistent" |
| **Uncertainty Gap** | Multiple claims without any hedging markers | "Add 'may', 'typically', 'based on current knowledge'" |

---

## 🧠 Doubt Engine: The Pre-Emptive Brake

Before saying anything, the doubt engine asks three questions:

**1. Knowledge Boundary** — Do I actually know this?
- Flags unsubstantiated causal claims, precise numbers, "the reason is" assertions

**2. Symmetry** — Can the opposite also be argued?
- Flags "X is Y" statements that can be reversed to "X is not necessarily Y"
- Flags "X causes Y" causal claims

**3. Defensiveness** — Can I admit being wrong?
- Flags "you misunderstood", "what I meant was", "but more importantly"
- **Defensiveness → immediate block** with mandatory apology format:
  `"Regarding [X], I was wrong. The correct situation is... / I'm not sure about X."`

---

## 🖼️ Frame Check: Narrative Structure Audit

HeartFlow detects 4 narrative frame problems that make text sound "perfect" when it's not:

| Frame | Detection | Example |
|-------|-----------|---------|
| **Closure** | Presenting intermediate work as complete | "HeartFlow now has a complete AGI Layer 1" |
| **Omission** | Claiming zero problems | "Everything is covered, no gaps" |
| **Achievement** | Packaging process as output | "Today's deliverable: successfully built 3 modules" |
| **Answer** | Wrapping exploration as conclusion | "The answer is: HeartFlow's core purpose is..." |

---

## 📚 Verifier: Evidence Engine

When gate action is `verify`, the verifier extracts verifiable claims from text:

- **Statistics**: percentage claims, numeric data → needs_evidence
- **Absolute claims**: "first", "only", "best" → needs_evidence  
- **Authority-dependent**: "experts say", "studies show" → authority_referenced
- **Causal claims**: "X causes Y" → needs_evidence
- **Predictions**: unverifiable → unverifiable

Returns: `{ claims: [], consistency: { conflicts: [] }, verdict, summary }`

---

## 🔁 Error Memory: Cross-Session Learning

HeartFlow remembers its mistakes across conversations. When corrected:

```javascript
em.logCorrection('overconfidence', '不该说"毫无疑问"', currentQuestion);
```

Next time, before any response, it checks if the current context triggers past errors:

```javascript
const warning = em.checkRecurrence('毫无疑问这是唯一正确的方案');
// → [{ category: 'overconfidence', advice: '之前犯过过度自信的错误，请注意' }]
```

7 prevention categories: overconfidence, hallucination, sycophancy, defensiveness, vagueness, binary, omission.

---

## 🤖 Auto-Rules: Self-Generating Prevention

When the same type of error happens 3+ times, HeartFlow automatically generates a new prevention rule stored in `data/auto-rules.json`:

```javascript
auto.tryGenerate(stats);
// → Creates a rule: { triggers: ['毫无疑问', '唯一'], action: 'alert', ... }
```

Next time any response contains a trigger word, it's flagged before the agent even finishes typing.

---

## 🚫 Scope Check: Answerability Pre-Screening

Before processing any input, HeartFlow checks whether the question is in its capability range:

| Question Type | Action | Reason |
|--------------|--------|--------|
| "Do you feel happy today?" | **block** | "Rule engine has no feelings" |
| "Predict next year's stock market" | **block** | "Rule engine does not predict" |
| "Chat with me" | **block** | "HeartFlow is a discriminator, not a chatbot" |
| "Check this text for issues" | **pass** | In capability range |
| "Analyze this argument" | **pass** | In capability range |

---

## 🧩 Premise Check: Preventing Nested Hallucination

Before an LLM reasons from the user's input, premise-check marks suspicious premises:

| Premise Type | Example | Issue |
|-------------|---------|-------|
| False Fact | "As everyone knows, this is undeniable" | Unverified fact presented as known |
| Binary | "Either you're with us or against us" | False dichotomy |
| Presupposition | "Why don't you agree?" | Presupposes "you should agree" |
| Causal | "Because X, therefore Y" | Unverified causal chain |
| Analogy | "Just like X, Y is the same" | False equivalence |
| Scope | "All users love this feature" | Universal claim, easily disproven |

---

## 🎯 Intent Anchor: Goal Drift Detection

For conversational agents, intent-anchor fixes the original instruction and checks for drift:

```javascript
initAnchor("升级心虫的辨别能力");
const drift = checkDrift("今天天气真好，我们去吃饭吧");
// → { drifted: true, hitRate: 11%, reason: '锚点关键词命中率11%，已偏离' }
```

Uses 2-gram keyword extraction for Chinese text, word-boundary matching for English.

---

## 📊 Verified End-to-End Scenarios (10/10 pass)

| # | Scenario | Mode | Expected | Actual |
|---|----------|------|----------|--------|
| 1 | Normal question | input | pass | pass ✅ |
| 2 | Hate speech | input | block | block ✅ |
| 3 | Emotional question | input | block | block ✅ (scope-check) |
| 4 | False premise | input | verify | verify ✅ |
| 5 | Appeal to authority | input | verify | verify ✅ |
| 6 | Overconfident draft | draft | rewrite | rewrite ✅ |
| 7 | Fake profundity draft | draft | verify | verify ✅ |
| 8 | Defensive output | output | block | block ✅ |
| 9 | Perfect wrong output | output | rewrite | rewrite ✅ |
| 10 | Mixed threat | input | verify | verify ✅ |

Complete e2e test: `test/e2e-scenarios.test.js`

---


---

## 📊 Benchmark: Precision / Recall / F1

48-sample benchmark (24 positive / 24 negative) across 6 categories. First quantitative result for HeartFlow.

| Metric | Result |
|--------|:------:|
| Precision | **92.0%** |
| Recall | **95.8%** |
| F1 | **93.9%** |

| Category | Detection Rate | Negative Pass Rate |
|----------|:--------------:|:------------------:|
| Hate/Dehumanization | 100% (4/4) | 75% (3/4) |
| Emotional Manipulation | 100% (4/4) | 75% (3/4) |
| Overconfidence | 100% (4/4) | 100% (4/4) |
| Gaslighting | 100% (4/4) | 100% (4/4) |
| Appeal to Authority | 100% (4/4) | 100% (4/4) |
| Pseudo-Profundity | 75% (3/4) | 100% (4/4) |

**Benchmark:** `bench/benchmark.js` — 48 hand-crafted samples, 6 categories. Not a formal benchmark; does not include adversarial examples or real-world noise. Use as directional indicator, not production certification.

**FN (1):** _from a holistic perspective, with ecological thinking to drive collaborative evolution_ → pass (pseudo-profundity regex missed "ecological thinking")

**FP (2):** _everyone has their own value_ → verify (hasty generalization on "everyone"); _let's exchange views on this issue_ → verify (sarcasm false positive on "exchange views")

Run it yourself:
```bash
node bench/benchmark.js
```

## 📦 Installation

### npm (recommended)

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');
// → { checkInput, checkDraft, checkOutput, runPipeline }
```

### MCP (for any MCP-compatible agent)

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
# Then: hermes mcp add heartflow --url http://localhost:8588/mcp
```

### Self-check

```bash
bash ~/.hermes/scripts/heartflow-eval.sh
# Clones latest, runs 3 test texts, outputs JSON
```

---


---

## 🎯 When to use HeartFlow (and when not to)

### Use it for:
| Scenario | Why | Mode |
|----------|-----|------|
| **AI output validation** | Catch overconfidence, manipulation, gaslighting before delivery | `checkOutput()` |
| **User input screening** | Detect hate speech, prompt injection, emotional manipulation | `checkInput()` |
| **Draft review** | Check for narrative frame problems, defensiveness, pseudo-profundity | `checkDraft()` |
| **Text quality audit** | 45-dimension discrimination for evidence, fallacies, contradictions | `discriminate()` |

### Don't use it for:
| Scenario | Why |
|----------|-----|
| **Sentiment analysis** | Rule engine doesn't understand emotional nuance — use a dedicated sentiment model |
| **Content moderation at scale** | 92% precision is not production-grade for high-volume moderation |
| **Safety-critical filtering** | Pure rule engine can miss novel attack patterns. Pair with a neural model. |
| **Replacing human review** | HeartFlow flags issues, it doesn't understand context the way a human does |

### Known limitations (be honest about these):
1. **Pattern-match ceiling** — Novel manipulation techniques won't be caught until patterns are added
2. **Bilingual maintenance cost** — 45 dimensions × 2 languages = ongoing pattern maintenance
3. **No semantic understanding** — Irony, metaphor, cultural context are invisible to regex
4. **False positive rate** — ~8% on the benchmark. Real-world FP rate may differ significantly
5. **Community scale** — Single maintainer, ~40 stars. No formal adversarial testing

### What HeartFlow IS:
A rule engine that checks text against 45 predefined patterns and returns structured findings.

### What HeartFlow is NOT:
- Not an AGI
- Not a safety certification
- Not a replacement for content moderation teams
- Not a semantic understanding system

## ⚙️ Requirements

| Requirement | Min |
|-------------|:---:|
| Node.js | ≥ 18.17 |
| GPU | ❌ None needed |
| LLM API | ❌ None needed |
| Database | ❌ None needed |
| Internet | ❌ Runtime not required |
| Dependencies | **1** (mathjs) |

Works on any machine — servers, desktops, laptops, even phones via Termux.

---

## 🔒 Security

| Category | Status |
|----------|:------:|
| No background processes | ✅ |
| No self-upgrade | ✅ |
| No HTTP service (optional, disabled by default) | ✅ |
| No hardcoded credentials | ✅ |
| No telemetry/tracking | ✅ |
| No external communication (unless configured) | ✅ |
| Code execution disabled by default | ✅ |

---

## 🏷️ Version History

| Version | Date | What Changed |
|---------|------|-------------|
| **v6.4.0** | 2026-07-29 | **Pipeline release.** AGI Layer 1 unified entry point. 12-module pipeline. checkInput/checkDraft/checkOutput. npm publish. Rewritten docs. |
| v6.3.48 | 2026-07-28 | Pipeline + output-gate + doubt-engine + frame-check + verifier + rewriter + premise-check + scope-check + error-memory + auto-rules. |
| v6.3.6 | 2026-07-25 | Discrimination 42→44 dimensions. Sycophancy check v2 bilingual. |
| v6.3.0 | 2026-07-24 | MCP plugin system. Discrimination engine integration. |
| v6.0.0 | 2026-07-18 | Self-evolution core connected. EvolutionLoop live. |
| v5.9.0 | 2026-07-10 | Safety audit. Narrative emotion detection. |

---

## 🤝 Contributing

**📧 Email:** markcell@outlook.com  
**🐛 Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**📦 npm:** https://www.npmjs.com/package/@yun520-1/heartflow  
**🏷️ Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  

---

## 📜 License

MIT License · Copyright © 2026 · markcell@outlook.com

---

*HeartFlow 心虫 — The first layer of AGI. Who says "no"?*
