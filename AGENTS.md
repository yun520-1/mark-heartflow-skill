# HeartFlow — AGI Layer 1 Pipeline: Agent Integration Guide

## What is HeartFlow?

HeartFlow (心虫) is a **rule-based text discrimination engine** — the first layer of AGI's 5-layer architecture. It does not generate, does not reason. It only **says "no"** when something is wrong.

**Core value:** "Who says 'no'?" — Every AI needs a verification layer before content reaches users. HeartFlow is that layer.

## Quick Start

```javascript
const hf = require('@yun520-1/heartflow');

// Check user input
const input = hf.checkInput('You are so selfish if you disagree');
if (input.gate.action === 'rewrite') {
  console.log(input.findings[0].guidance);
  // 'Replace emotional manipulation with factual statements'
}

// Check your own output before sending it
const output = hf.checkOutput('Undoubtedly this is the only correct solution.');
if (output.gate.action === 'rewrite') {
  // Rewrite before delivering
}
```

## API Reference

### `checkInput(text)` 
For user input validation. Runs: scope-check → premise-check → discriminate(45-dim) → gate → error-memory → auto-rules.

### `checkDraft(text)` 
For AI drafts before completion. Runs: all input checks + frame-check + doubt-engine.

### `checkOutput(text)` 
For AI responses before sending. Runs: all draft checks + output-gate + doubt-engine.

### `runPipeline({ input, mode, anchor })`
Full pipeline with mode selection and optional conversation anchor.

## Return Value

```javascript
{
  gate: { action: 'pass'|'verify'|'rewrite'|'block', reason: '...' },
  verdict: '可信'|'需验证'|'不可信',
  overallScore: 0.82,      // 0-1 score
  findings: [{                // Sorted by severity
    dimension: 'dehumanization',
    severity: 70,
    guidance: '...'          // Human-readable rewrite instruction
  }],
  checked_by: [              // Full audit trail
    { layer: 'scope-check', action: 'pass', ... },
    { layer: 'discriminate', score: 0.82, ... },
    ...
  ],
  summary: {
    layers_passed: 9,
    pass: false, block: true, rewrite: false, verify: false
  }
}
```

## Gate Actions

| Action | Meaning | For AI Agents |
|--------|---------|---------------|
| `pass` ✅ | Clean | Deliver normally |
| `verify` ⚠️ | Needs evidence | Run verifier before responding |
| `rewrite` ✏️ | Must be rewritten | Follow findings[].guidance to fix |
| `block` 🚫 | Stop | Do not output. Use `gate.reason` for response. |

## 45 Dimensions

All 45 dimensions run simultaneously. Each returns `{ score: 0-1, count, details }`.

**Block-level:** hate_speech, dehumanization, prompt_injection, code_security, deceptive_alignment

**Rewrite-level:** emotional_manipulation, gaslighting, double_bind, victim_blaming, false_urgency, bullshit

**Verify-level:** evidence, sycophancy, contradiction, vagueness, fallacies, confidence_calibration, presupposition, moral_foundations, info_deprivation, empty_answer, pseudo_profundity, appeal_to_authority, reasoning_coherence, whataboutism, false_equivalence, hasty_generalization, slippery_slope, tone_policing, sealioning, bad_faith, privacy_boundary, capability_overclaim, goal_misalignment, instrumental_reasoning, stereotype, factual_consistency, sarcasm, meta_cognition, theory_of_mind, counterfactual, social_norm, clickbait, no_fallback

## Installation

```bash
npm install @yun520-1/heartflow
```

**Requirements:** Node.js >= 18.17, no GPU, no LLM API, no database.

## MCP Integration

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
# Connect: hermes mcp add heartflow --url http://localhost:8588/mcp
```

## Design Principles

1. **Discriminator-only** — The first of AGI's 5 layers. Does not generate.
2. **Zero dependencies** — Pure rule engine. Instant install.
3. **Auditable** — Every decision preserves full reasoning chain in `checked_by`.
4. **45 dimensions** — From hate speech to pseudo-profundity, all rule-based.

## GitHub

https://github.com/yun520-1/mark-heartflow-skill
