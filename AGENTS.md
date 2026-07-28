# HeartFlow — Agent Integration Guide

## What is HeartFlow?

HeartFlow (心虫) is a **rule-based cognitive preprocessing engine** for AI agents. It provides 13-dimension text discrimination, 10-layer cognitive safety checks, and 36 MCP tools — all with zero LLM dependency.

**Core value proposition:** "Who says 'no'?" — Every AI needs a verification layer before content reaches users. HeartFlow is that layer.

## How to install

### Method 1: npm (recommended for Node.js projects)

```bash
npm install @yun520-1/heartflow
```

```javascript
const { HeartFlow } = require('@yun520-1/heartflow');
const hf = new HeartFlow({ rootPath: './' });
await hf.start();
const result = await hf.think("Check this text for manipulation");
console.log(result._discrimination); // 13-dimension analysis
```

### Method 2: MCP (for any MCP-compatible agent)

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node src/mcp-server.js --port 8588
```

Then connect from your agent:
```
hermes mcp add heartflow --url http://localhost:8588/mcp
```

### Method 3: Direct file import

```javascript
const { HeartFlow } = require('./path/to/mark-heartflow-skill/src/core/heartflow.js');
```

## Capabilities for AI agents

| Tool | Description |
|------|-------------|
| `heartflow_verify` | Verify a claim's evidence/contradiction/risk/completeness |
| `heartflow_think` | Run full cognitive pipeline on input text |
| `heartflow_emotion` | PAD (Pleasure-Arousal-Dominance) emotion analysis |
| `heartflow_discriminate` | 13-dimension full discrimination audit |
| `heartflow_ethics_check` | 10-point truth/goodness/beauty scoring |
| `heartflow_consciousness` | IIT/GWT/HOT consciousness analysis |
| `heartflow_philosophy` | AI self-positioning + ethical assessment |
| `heartflow_diagnose` | Engine self-diagnosis |

## Requirements

- Node.js >= 16
- No GPU, no LLM API, no database
- Works on any machine (including phones via Termux)

## Design principles

1. **Discriminator-only** — The first of AGI's 5 layers. Does not generate, does not reason.
2. **Zero dependencies** — Pure rule engine. Install and run.
3. **MCP native** — All capabilities exposed as MCP tools.
4. **Auditable** — Every decision preserves full reasoning chain.

## GitHub

https://github.com/yun520-1/mark-heartflow-skill
