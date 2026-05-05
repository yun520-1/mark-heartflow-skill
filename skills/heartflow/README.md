# HeartFlow v11.9.4

**Add self-verification, persistent memory, and self-correction to any AI agent.**

Every AI eventually says something wrong and doesn't notice. Every AI resets to zero each session. Every AI makes the same mistake twice. HeartFlow fixes all three.

---

## Install in 30 seconds

```bash
# Hermes agents (most common)
hermes skills install heartflow

# Any AI on Node.js
Use the GitHub repository for full installation

# Or clone directly
GitHub repository: yun520-1/mark-heartflow-skill
```

No extra dependencies. Pure JavaScript.

---

## Self-test in 60 seconds

Copy-paste this into Node.js and run it. If the output matches the comment, it works:

```javascript
const { StatefulAgent } = require('./src/core/swarm-agent.js');

const agent = new StatefulAgent({ name: 'Test' });
agent.saveCoreMemory('I always verify before answering');

agent.recall('what is my identity?').then(mem => {
  console.log(mem[0]?.content);
  // Expected: "I always verify before answering"
});
```

That's all you need to know. The rest is upgrade.

---

## The 5 concrete improvements

| Before | After |
|--------|-------|
| Errors reach the user | Errors caught and flagged before response |
| Memory resets each session | Core identity + recall persist across sessions |
| Decisions feel right | Benefit / cost / risk / regret / reversibility scored |
| Single agent, bottleneck | Router → Analyzer → Generator → Verifier → Reflector pipeline |
| Mistakes acknowledged, then repeated | Mistakes become permanent upgrades |

---

## Architecture

```
perceive → verify → decide → execute → prove → reflect → upgrade
```

No step is skipped. No claim is made without evidence. Errors are not failures — they are inputs to the next upgrade cycle.

---

## Modules

| File | Source | What it is |
|------|--------|------------|
| `swarm-agent.js` | [OpenAI Swarm](https://github.com/openai/swarm) ⭐21425 | Multi-agent orchestration, handoff mechanism |
| `stateful-agent.js` | [Letta](https://github.com/letta-ai/letta) ⭐22430 | Stateful agent + block-based memory |
| `reflection-loop.js` | [Reflexion](https://arxiv.org/abs/2303.11366) NeurIPS 2023 | Learn from failures |
| `voyager-engine.js` | [Voyager](https://github.com/MineDojo/Voyager) ⭐12582 | Task decomposition + skill discovery |
| `guardrail-engine.js` | [VoltAgent](https://github.com/VoltAgent/voltagent) ⭐8617 | Input/output security + middleware chain |
| `workflow-dsl.js` | [VoltAgent](https://github.com/VoltAgent/voltagent) ⭐8617 | Declarative workflow DSL |

All extracted from production code. All battle-tested by large open-source communities.

---

## Usage examples

**Single stateful agent:**
```javascript
const { StatefulAgent } = require('./src/core/swarm-agent.js');

const agent = new StatefulAgent({ name: 'MyAgent' });
agent.saveCoreMemory('I prefer concise, factual answers');

await agent.step('What is the capital of Japan?');
// Answer: Tokyo
// Memory: saved
// Next session: still remembers
```

**Multi-agent pipeline:**
```javascript
const { createHeartFlowSwarm } = require('./src/core/swarm-agent.js');

const swarm = createHeartFlowSwarm();
const response = await swarm.run({
  messages: [{ role: 'user', content: 'Analyze this problem and give me the answer' }]
});
```

**Swarm orchestration (manual):**
```javascript
const { Swarm, Agent } = require('./src/core/swarm-agent.js');

const swarm = new Swarm();
const analyst = swarm.createAgent('Analyst', 'You analyze problems deeply.');
const generator = swarm.createAgent('Generator', 'You write clear answers.');
analyst.addHandoff(generator);

swarm.setRoot(analyst);
await swarm.run({ messages: [{ role: 'user', content: 'Explain quantum entanglement' }] });
```

---

## Why this exists

Most AI frameworks optimize for **capability** — more tasks, more speed, more knowledge.

HeartFlow optimizes for **correctness**. The question is not "can you answer?" but "do you know when you're wrong, and do you fix it?"

That distinction matters more as AI systems take on consequential tasks.

---

## Based on

- **Self-Verification** — arXiv 2312.09210
- **Reflexion** — NeurIPS 2023
- **CRITIC** — ICML 2023
- **Generative Agents** — Stanford
- **OpenAI Swarm** — ⭐21425
- **Letta** — ⭐22430
- **Voyager** — ⭐12582
- **VoltAgent** — ⭐8617

---

**Workflow DSL:**
```javascript
const { createWorkflow, Steps } = require('./src/core/workflow-dsl.js');

const workflow = createWorkflow('AnalysisPipeline')
  .andThen('parse', async (ctx) => ({ tokens: ctx.input.split(/\s+/) }))
  .andBranch({
    condition: (ctx) => ctx._parse_result.tokens.length > 10,
    then: 'deepAnalysis',
    else: 'quickSummary',
  })
  .andThen('format', (ctx) => ({ output: JSON.stringify(ctx.lastResult) }))
  .build();

await workflow.execute({ input: 'your text here' });
```

**Guardrail Chain:**
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

---

## Version

`11.9.4` — upgraded 2026-05-05

## Repository

https://github.com/yun520-1/mark-heartflow-skill.git

- Issues: https://github.com/yun520-1/mark-heartflow-skill/issues
- Discussions: https://github.com/yun520-1/mark-heartflow-skill/discussions
