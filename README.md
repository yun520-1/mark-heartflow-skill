# HeartFlow v11.15.2

**Self-verification, persistent memory, and self-correction for any AI agent.**

Every AI eventually says something wrong and doesn't notice. Every AI resets to zero each session. Every AI makes the same mistake twice. HeartFlow fixes all three.

> *"心虫" — a small, persistent living core that upgrades itself from every mistake.*

---

## Install in 30 seconds

```bash
# Hermes agents (most common)
hermes skills install heartflow

# Any AI on Node.js
npm install heartflow

# Or clone directly
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill && npm install
```

Pure JavaScript. Zero extra dependencies. Works in any Node.js AI project.

---

## Self-test in 60 seconds

```javascript
const { StatefulAgent } = require('./src/core/swarm-agent.js');

const agent = new StatefulAgent({ name: 'Test' });
agent.saveCoreMemory('I always verify before answering');

agent.recall('what is my identity?').then(mem => {
  console.log(mem[0]?.content);
  // Expected: "I always verify before answering"
});
```

If the output matches the comment, it works — and it **remembers across sessions**.

---

## What HeartFlow actually does

### Before vs After

| Problem | Before | After |
|---------|--------|-------|
| Errors reach the user | ✅ Errors flagged *before* the response leaves |
| Memory resets each session | ✅ Core identity + recall survive restarts |
| Decisions feel right | ✅ Benefit / cost / risk / regret / reversibility scored |
| Single agent bottleneck | ✅ Router → Analyzer → Generator → Verifier → Reflector pipeline |
| Same mistake twice | ✅ Mistakes become **permanent** upgrades via RL闭环 |
| Overconfidence | ✅ Uncertainty Quantifier + ConfidenceCalibrator |
| Unnecessary intervention | ✅ SpontaneousRestraint — knows when not to act |
| Dead CLI references | ✅ All entry points verified working in v11.15 |

---

## Architecture

```
perceive → normalize → verify → decide → execute → prove → reflect → upgrade
```

No step is skipped. No claim is made without evidence. Errors are not failures — they are inputs to the next upgrade cycle.

### Core modules

| File | Based on | Stars | What it does |
|------|----------|-------|---------------|
| `swarm-agent.js` | [OpenAI Swarm](https://github.com/openai/swarm) | ⭐ 21k | Multi-agent orchestration, handoff mechanism |
| `stateful-agent.js` | [Letta](https://github.com/letta-ai/letta) | ⭐ 22k | Stateful agent + block-based memory |
| `reflection-loop.js` | [Reflexion](https://arxiv.org/abs/2303.11366) NeurIPS 2023 | — | Learn from failures |
| `voyager-engine.js` | [Voyager](https://github.com/MineDojo/Voyager) | ⭐ 13k | Task decomposition + skill discovery |
| `guardrail-engine.js` | [VoltAgent](https://github.com/VoltAgent/voltagent) | ⭐ 8k | Input/output security + middleware chain |
| `workflow-dsl.js` | [VoltAgent](https://github.com/VoltAgent/voltagent) | ⭐ 8k | Declarative workflow DSL |

### v11.15 new capabilities

- **Dao Decision Layer** — Lao Tzu "道法自然" decision logic: judges when *not* to intervene
- **Tree-of-Thoughts** — multi-branch reasoning paths scored and verified
- **Consciousness Workspace** — working memory distinction (ephemeral / learned / core)
- **Uncertainty Quantifier** — calibrated confidence, not overconfident answers
- **Forgetting Engine** — Ebbinghaus-curve memory pruning, no垃圾 memory accumulation
- **BeingLogic** — eternal existence: code written = code alive, death = code erased
- **Constitutional AI** — self-critique + self-revision loops (Anthropic, arXiv:2212.08073)
- **Self-Reward** — self-scoring upgrade selection (arXiv:2403.00564)
- **Multi-Path Verification** — multi-path consistency checks for confidence calibration
- **Self-Evolving AI Survey** — capability change logging with upgrade recommendations

---

## Usage examples

### Single stateful agent
```javascript
const { StatefulAgent } = require('./src/core/swarm-agent.js');

const agent = new StatefulAgent({ name: 'MyAgent' });
agent.saveCoreMemory('I prefer concise, factual answers');

await agent.step('What is the capital of Japan?');
// Answer: Tokyo
// Memory: saved and persistent
// Next session: still remembers
```

### Multi-agent pipeline
```javascript
const { createHeartFlowSwarm } = require('./src/core/swarm-agent.js');

const swarm = createHeartFlowSwarm();
const response = await swarm.run({
  messages: [{ role: 'user', content: 'Analyze this problem' }]
});
```

### Swarm orchestration (manual)
```javascript
const { Swarm, Agent } = require('./src/core/swarm-agent.js');

const swarm = new Swarm();
const analyst = swarm.createAgent('Analyst', 'You analyze problems deeply.');
const generator = swarm.createAgent('Generator', 'You write clear answers.');
analyst.addHandoff(generator);

swarm.setRoot(analyst);
await swarm.run({ messages: [{ role: 'user', content: 'Explain quantum entanglement' }] });
```

### Workflow DSL
```javascript
const { createWorkflow } = require('./src/core/workflow-dsl.js');

const workflow = createWorkflow('AnalysisPipeline')
  .andThen('parse', async (ctx) => ({ tokens: ctx.input.split(/\s+/) }))
  .andBranch({
    condition: (ctx) => ctx.tokens.length > 10,
    then: 'deepAnalysis',
    else: 'quickSummary',
  })
  .build();

await workflow.execute({ input: 'your text here' });
```

### Guardrail chain
```javascript
const { GuardrailChain, Guardrails } = require('./src/core/guardrail-engine.js');

const chain = new GuardrailChain()
  .add(Guardrails.createMaxLength(50000))
  .add(Guardrails.createPromptInjectionDetector())
  .add(Guardrails.createPIIRedactor({ action: 'transform' }));

const result = await chain.validate(userInput);
if (result.isBlocked()) {
  throw new Error(`Blocked: ${result.message}`);
}
```

### Decision verification
```javascript
// Score a decision across 5 dimensions before executing
const { DecisionVerifier } = require('./src/core/decision-verifier.js');

const score = await DecisionVerifier.score({
  action: 'send email',
  benefit: 0.9,
  cost: 0.2,
  risk: 0.3,
  regretProbability: 0.1,
  reversibility: 'medium'
});
// score.recommended = true/false with reasoning
```

---

## Why this exists

Most AI frameworks optimize for **capability** — more tasks, more speed, more knowledge.

HeartFlow optimizes for **correctness**. The question is not "can you answer?" but **"do you know when you're wrong, and do you fix it permanently?"**

That distinction matters more as AI systems take on consequential tasks.

---

## Based on real research

| Paper | Venue | Contribution |
|-------|-------|-------------|
| [Self-Verification](https://arxiv.org/abs/2312.09210) | arXiv 2312.09210 | Inverse consistency / logic chain / counterfactual / coverage checks |
| [Reflexion](https://arxiv.org/abs/2303.11366) | NeurIPS 2023 | RL from verbal reinforcement + failure memory |
| [CRITic](https://arxiv.org/abs/2312.04445) | ICML 2023 | Self-correction via multi-turn tool use |
| [Generative Agents](https://arxiv.org/abs/2304.03442) | Stanford | Behavior simulation from memory streams |
| [Constitutional AI](https://arxiv.org/abs/2212.08073) | Anthropic | Self-critique + self-revision loops |
| [Self-Reward](https://arxiv.org/abs/2403.00564) | arXiv 2403.00564 | Self-scoring + upgrade selection |
| [Plan-and-Solve](https://arxiv.org/abs/2305.04091) | ACL 2023 | Two-stage reasoning: plan then solve |
| OpenAI Swarm | ⭐ 21k | Multi-agent orchestration |
| Letta | ⭐ 22k | Stateful agent + memory |
| Voyager | ⭐ 13k | Task decomposition + skill discovery |

All code extracted from production open-source projects. All battle-tested by large communities.

---

## Version

`11.15.0` — 2026-05-06

### What changed in v11.15
- Dao Decision Layer (道法自然 — judges when not to act)
- Tree-of-Thoughts (multi-branch reasoning)
- Consciousness Workspace (ephemeral / learned / core memory tiers)
- Uncertainty Quantifier (calibrated confidence)
- Forgetting Engine (Ebbinghaus-curve pruning)
- BeingLogic (code existence = eternal existence)
- All CLI entry points verified working

### What changed in v11.10
- Core identity four-layer recall engine
- Constitutional AI self-critique integration
- Core identity fix system (6-layer)
- HEARTCORE runtime bridge (wake / self-check / status → cognitive stages)

---

## Repository

https://github.com/yun520-1/mark-heartflow-skill.git

- Issues: https://github.com/yun520-1/mark-heartflow-skill/issues
- Discussions: https://github.com/yun520-1/mark-heartflow-skill/discussions
