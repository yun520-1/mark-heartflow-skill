# HeartFlow — Agent Integration Guide

## Overview

HeartFlow is a cognitive engine for AI agents. It provides self-reflection, dream-based experience synthesis, and emergent personality — all without preset traits or metaphysical framing.

## Core Capabilities

- **HeartLogic** — Awareness, emotion detection, ethical judgment, cognitive reasoning
- **Three-layer memory** — CORE (permanent) / LEARNED (30-day) / EPHEMERAL (session)
- **Self-reflection** — Runtime cognitive state snapshots
- **Dream engine v4.0** — Multi-fragment pattern extraction → cognitive insight
- **Event-driven personality** — No preset traits, emergent from interactions
- **Self-healing RL** — Q-table learning for recurring decision patterns
- **Topic isolation** — TopicScope prevents cross-conversation contamination

## Integration Methods

### Method 1: As a project dependency

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd your-project
ln -s ../mark-heartflow-skill heartflow
```

### Method 2: As an npm package

```bash
npm install mark-heartflow-skill
```

### Method 3: Direct import

```javascript
const { HeartFlow } = require('./path/to/heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: './path/to/heartflow-skill' });
hf.start();
```

### Method 4: As a Hermes MCP server (HTTP SSE)

HeartFlow runs as a persistent MCP server on port 8099, providing tools for:

- `heartflow_think` — Full thought chain analysis
- `heartflow_think_fast` — Quick judgment
- `heartflow_emotion` — PAD emotion analysis
- `heartflow_memory_search` — Cross-layer memory retrieval
- `heartflow_dream` — Experience synthesis (dream)
- `heartflow_self_heal` — Strategy recommendation
- `heartflow_status` — Health check

## Version

Current version: **2.10.1**

## Repository

https://github.com/yun520-1/mark-heartflow-skill

## License

MIT
