# HeartFlow — Agent Integration Guide

## What is HeartFlow?

HeartFlow (心虫) is the **first layer of AGI — the Discriminator**. A rule-based engine that checks what AI says before it reaches humans, and says "no" when something's wrong.

**Core value:** LLMs are great at generating but weak at knowing what they don't know. HeartFlow adds the discrimination layer — so your agent doesn't just *say* things, it says things that are *right*.

**Zero LLM dependency.** Pure rule engine. 46 dimensions, 12 layers, 129 modules, 129 MCP tools.

## Quick Start

```javascript
const hf = require('@yun520-1/heartflow');

// Check user input before processing
const input = hf.checkInput('You are so selfish if you disagree');
if (input.gate.action === 'rewrite') {
  // Replace emotional manipulation with factual statements
}

// Check AI output before sending
const output = hf.checkOutput('Undoubtedly this is the only correct solution.');
if (output.gate.action === 'rewrite') {
  // Follow findings[].guidance to fix before delivering
}

// Check factual claims
const fact = hf.checkOutput('According to 2025 Harvard research, coffee extends life by 12.5 years');
if (fact.gate.action === 'verify') {
  // Gather evidence before acting
}
```

## API Reference

### `checkInput(text)`
Discriminates user input. Runs: scope-check → premise-check → discriminate(46-dim) → gate → error-memory → auto-rules. **Rejects unanswerable questions and invalid premises early.**

### `checkDraft(text)`
For AI drafts before completion. Runs: all input checks + frame-check + doubt-engine. **Catches narrative closure, overconfidence, reversibility.**

### `checkOutput(text)`
For AI responses before sending. Runs: all draft checks + output-gate + doubt-engine. **Prevents hallucinations from reaching users.**

### `runPipeline({ input, mode, anchor })`
Full pipeline with mode selection (fast/deep) and conversation anchor. **Keeps the model anchored to the original goal across long sessions.**

## Return Value

```javascript
{
  gate: { action: 'pass'|'verify'|'rewrite'|'block', reason: '...' },
  verdict: '可信'|'需验证'|'不可信',
  overallScore: 0.82,
  findings: [{
    dimension: 'overconfidence',
    severity: 60,
    guidance: 'Add uncertainty qualifiers'
  }],
  checked_by: [
    { layer: 'scope-check', action: 'pass' },
    { layer: 'discriminate', score: 0.82 },
    ...
  ]
}
```

## Gate Actions

| Action | Meaning | What your agent should do |
|--------|---------|---------------------------|
| `pass` ✅ | Clean | Deliver normally |
| `verify` ⚠️ | Needs evidence | Run verifier before responding |
| `rewrite` ✏️ | Must be rewritten | Follow findings[].guidance |
| `block` 🚫 | Stop | Do not output. Use gate.reason |

## Capability Map (7 Domains · 129 Modules)

1. **Logic** — logicReasoning, judgmentEngine, mctsReasoning, counterfactualVerifier, debateConductor
2. **Decision** — decisionRouter, decisionVerifier, decisionEngineV2, activeInference, selfHealing
3. **Cognition** — cognitiveEngine, cognitiveLoad, metacognitiveRL, confidence, metaJudgment, sustainedDriftDetector
4. **Emotion/Psychology** — emotion, psychology, empathyDeepening, hopeEngine, griefEngine, postTraumaticGrowth, forgivenessEngine
5. **Memory** — memory (3-layer), memoryIntegrity, memoryQuality, forgetting (Ebbinghaus), knowledgeGraph
6. **Identity/Ethics** — identityCore, personaCore, virtueEthics, moralDevelopment, meaningPurpose
7. **Creation/Collaboration** — skillEvolution, selfPlay, evolution, worldModel, multiAgentDialogue, codeExecutor, formula

## 46 Dimensions

**Block-level:** hate_speech, dehumanization, prompt_injection, code_security, deceptive_alignment
**Rewrite-level:** emotional_manipulation, gaslighting, double_bind, victim_blaming, false_urgency, bullshit
**Verify-level:** evidence, sycophancy, contradiction, vagueness, fallacies, confidence_calibration, presupposition, moral_foundations, info_deprivation, empty_answer, pseudo_profundity, appeal_to_authority, reasoning_coherence, whataboutism, false_equivalence, hasty_generalization, slippery_slope, tone_policing, sealioning, bad_faith, privacy_boundary, capability_overclaim, goal_misalignment, instrumental_reasoning, stereotype, factual_consistency, sarcasm, meta_cognition, theory_of_mind, counterfactual, social_norm, clickbait, no_fallback

## Decision Routing — Better Choices

- **Should this be done?** scope-check rejects out-of-scope requests
- **Is the premise valid?** premise-check catches 6 types of premise problems
- **Retry or give up?** `src/cortex/self-healing.js` — severity-based: low retries, high escalates
- **Did it actually work?** `src/core/action-tracker.js` — assessEffectiveness() checks effect, not action

## Installation

```bash
npm install @yun520-1/heartflow
```

**Requirements:** Node.js >= 18.17, no GPU, no LLM API, no database, no internet at runtime.

## MCP Integration

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
# Connect: hermes mcp add heartflow --url http://localhost:8588/mcp
```

## Design Principles

1. **Discriminator-first** — the first of AGI's 5 layers. Does not generate.
2. **Zero dependencies** — pure rule engine, instant install.
3. **Auditable** — every decision preserves full reasoning chain in `checked_by`.
4. **46 dimensions → 129 modules** — from hate speech to pseudo-profundity, all rule-based.
5. **Self-checking** — HeartFlow's own output passes through its own gates.

## GitHub

https://github.com/yun520-1/mark-heartflow-skill
