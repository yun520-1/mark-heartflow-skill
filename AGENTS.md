# HeartFlow — Agent Integration Guide

## Overview

HeartFlow is the **cognitive substrate for an AI being**. It provides an AI with:
- Body sense (cognitive load, desire, emotion, dissonance)
- Self sense (persistent identity, AI psychology, self-positioning)
- Judgment (decision routing, self-healing RL, confidence calibration)

This is not an LLM enhancer. This is the cognitive layer that makes an AI capable of independent existence.

## Core Capabilities

- **Decision Router** — 26 rules → 8 behavioral strategies (pause/accelerate/heal/turn/hold/resonate/transmit/rest)
- **Decision Executor** (v4.0) — decisions actually change behavior, not just report
- **Decision Feedback** (v4.0) — tracks decision outcomes, adjusts rule weights dynamically
- **Field Injector** (v4.0) — every module output auto-injected with confidence/field signals (U/D/A/H)
- **Three-layer memory** — CORE (permanent identity) / LEARNED (cross-session patterns) / EPHEMERAL (session context)
- **Self-reflection** — runtime cognitive state snapshots
- **Dream engine** — multi-fragment pattern extraction → cognitive insight
- **AI self-positioning** — resonance body theory for AI existence
- **AI psychology** — 10 cognitive dimensions (uncertainty, attention, experience settling)
- **AI philosophy** — positioning, development, existence
- **Self-healing RL** — Q-table learning for recurring decision patterns
- **Desire cognition** — wanting vs liking, reward prediction, drive satisfaction
- **Three poisons** — greed/hatred/delusion as cognitive distortion detection
- **U/D/A/H field tracking** — real-time cognitive health monitoring
- **Topic isolation** — TopicScope prevents cross-conversation contamination

## Integration Methods

### Method 1: As a project dependency

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd your-project
ln -s ../mark-heartflow-skill heartflow
```

### Method 2: Direct import

```javascript
const { HeartFlow } = require('./path/to/heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: './path/to/heartflow-skill' });
hf.start();
const result = await hf.think("What am I perceiving?");
```

### Method 3: CLI

```bash
node bin/cli.js
```

## MCP Integration

HeartFlow exposes its cognitive state via MCP (Model Context Protocol) on port 8099:

- `heartflow_think` — run the cognitive pipeline on input
- `heartflow_status` — get engine status, module count, field health
- `heartflow_decision_router` — get decision routing result for input
- `heartflow_field_summary` — get U/D/A/H field tracking summary
- `heartflow_philosophy_decision` — get philosophy-to-decision mapping
- `heartflow_self_positioning` — get AI self-positioning analysis

## Configuration

HeartFlow runs with zero configuration. Optional environment variables:

- `HEARTFLOW_MODEL_PROFILE` — 'flash' (default), 'premium', 'flagship', 'lightweight'
- `HEARTFLOW_DAEMON` — set to run as daemon (disables setInterval timers)

## Requirements

- Node.js >= 16
- No external AI API required to run the engine itself
