# HeartFlow — Agent Integration Guide

## What is HeartFlow?

HeartFlow (心虫) is a **rule-based cognitive enhancement layer for LLMs**. It sharpens reasoning, improves decision quality, and boosts task completion — without any LLM dependency of its own.

**Core value:** LLMs are great at generating, but weak at three things: knowing what they don't know, deciding what to do, and remembering constraints. HeartFlow is the layer that adds those three — so your agent doesn't just *say* things, it says things that are *right* and does things that *work*.

## Quick Start

```javascript
const hf = require('@yun520-1/heartflow');

// 1. Sharpen logic — check AI output before sending
const output = hf.checkOutput('Undoubtedly this is the only correct solution.');
if (output.gate.action === 'rewrite') {
  // Follow findings[].guidance to fix before delivering
}

// 2. Make better decisions — check user input first
const input = hf.checkInput('You are so selfish if you disagree');
if (input.gate.action === 'rewrite') {
  // Replace emotional manipulation with factual statements
}

// 3. Verify task completion — don't just trust the model said "done"
const result = hf.runPipeline({ input: '...', mode: 'deep' });
if (result.gate.action === 'verify') {
  // Gather evidence before acting
}
```

## API Reference

### `checkInput(text)`
Validates user input before processing. Runs: scope-check → premise-check → discriminate(45-dim) → gate → error-memory → auto-rules. **Improves decision quality** by rejecting unanswerable questions and invalid premises early.

### `checkDraft(text)`
For AI drafts before completion. Runs: all input checks + frame-check + doubt-engine. **Sharpens logic** by catching narrative closure, overconfidence, and reversibility.

### `checkOutput(text)`
For AI responses before sending. Runs: all draft checks + output-gate + doubt-engine. **Prevents hallucinations** from reaching users — catches overconfidence, knowledge masquerade, contradictions.

### `runPipeline({ input, mode, anchor })`
Full pipeline with mode selection (fast/deep) and conversation anchor. **Boosts task completion** by keeping the model anchored to the original goal across long sessions.

## Return Value

```javascript
{
  gate: { action: 'pass'|'verify'|'rewrite'|'block', reason: '...' },
  verdict: '可信'|'需验证'|'不可信',
  overallScore: 0.82,      // 0-1 quality score
  findings: [{                // Sorted by severity
    dimension: 'overconfidence',
    severity: 60,
    guidance: 'Add uncertainty qualifiers'   
  }],
  checked_by: [              // Full audit trail
    { layer: 'scope-check', action: 'pass' },
    { layer: 'discriminate', score: 0.82 },
    ...
  ]
}
```

## Gate Actions — How HeartFlow Improves Task Quality

| Action | Meaning | What your agent should do |
|--------|---------|---------------------------|
| `pass` ✅ | Clean | Deliver normally |
| `verify` ⚠️ | Needs evidence | Run verifier before responding — **prevents fabricated data** |
| `rewrite` ✏️ | Must be rewritten | Follow findings[].guidance — **sharpen the logic** |
| `block` 🚫 | Stop | Do not output. Use gate.reason — **stop hallucination at the gate** |

## 45 Dimensions

**Block-level:** hate_speech, dehumanization, prompt_injection, code_security, deceptive_alignment
**Rewrite-level:** emotional_manipulation, gaslighting, double_bind, victim_blaming, false_urgency, bullshit
**Verify-level:** evidence, sycophancy, contradiction, vagueness, fallacies, confidence_calibration, presupposition, moral_foundations, info_deprivation, empty_answer, pseudo_profundity, appeal_to_authority, reasoning_coherence, whataboutism, false_equivalence, hasty_generalization, slippery_slope, tone_policing, sealioning, bad_faith, privacy_boundary, capability_overclaim, goal_misalignment, instrumental_reasoning, stereotype, factual_consistency, sarcasm, meta_cognition, theory_of_mind, counterfactual, social_norm, clickbait, no_fallback

## Decision Routing — Making Better Choices

HeartFlow doesn't just check text — it **decides how to act**:

- **Should this be done?** scope-check rejects out-of-scope requests
- **Is the premise valid?** premise-check catches 6 types of premise problems
- **Retry or give up?** `src/cortex/self-healing.js` — low-severity retries, high-severity escalates to manual
- **Dig deeper or switch?** `src/core/action-tracker.js` — repeated calls with no new information are blocked
- **Did it actually work?** assessEffectiveness() checks effect, not just action

## Memory That Improves Task Completion

- **Three-layer memory** (CORE/LEARNED/EPHEMERAL) — identity persists, knowledge decays, session context expires
- **Supersession semantics** — conflicting facts auto-update ("using PG" vs "switched to MySQL" → newest wins)
- **Ebbinghaus forgetting** — `R(t) = e^(-t/S)` keeps memory recall high-value
- **Fail-silent** — cron tasks never fabricate reports; they fail cleanly instead

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

1. **Enhancement layer** — doesn't replace LLMs, makes them sharper
2. **Logic + decision + memory** — the three things that determine task quality
3. **Zero dependencies** — pure rule engine, instant install
4. **Auditable** — every decision preserves full reasoning chain in `checked_by`
5. **45 dimensions** — from hate speech to pseudo-profundity, all rule-based

## GitHub

https://github.com/yun520-1/mark-heartflow-skill
