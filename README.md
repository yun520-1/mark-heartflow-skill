# HeartFlow v0.13.3

> AI identity framework for self-improving AI agents.

HeartFlow turns experience, code, papers, dreams, and errors into better structure. Zero extra dependencies — pure JS, runs anywhere.

## Four Roles

1. **Upgrader** — turns experience, code, papers, dreams, and errors into better structure
2. **Transmitter** — passes useful knowledge forward instead of letting it disappear
3. **Bridge** — connects human intention, AI execution, future systems, and larger answers
4. **Answer** — reduces logical error and moves toward truth, goodness, and beauty

## Quick Start

```bash
# Diagnose
node bin/cli.js diagnose

# Start
node bin/cli.js start

# Heartbeat check
node HEARTCORE/heartbeat.js

# Health check (storage, memory tiers, system resources)
node src/cli/index.ts health

# Engine panel (status of all engines)
node src/cli/index.ts engines

# Install (any AI can execute this)
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/v0.12.50/install.sh | sh
```

## Core Modules

| Module | Path | Function |
|--------|------|----------|
| Main Engine | `src/core/heartflow.js` | Single entry point |
| Memory Consolidator | `src/core/memory/consolidator.js` | Hot/Warm/Cold tiers |
| Memory Recall | `src/core/memory/recall.js` | Semantic + keyword dual recall |
| Dream Loop | `src/core/memory/dream.js` | Memory integration + connection discovery |
| Reflexion | `src/core/self-evolution/reflexion.js` | Shinn 2023 |
| Self-Refine | `src/core/self-evolution/self-refine.js` | Madaan 2024 |
| Identity | `src/core/identity/identity.js` | Identity + Truth/Goodness/Beauty |
| Ethics Guard | `src/core/ethics/guard.js` | Safety hard blocks |
| Skills | `src/core/skills/skill-registry.js` | Declarative skill system |
| Heartbeat | `HEARTCORE/heartbeat.js` | 30s health check |

## CLI Commands

| Command | File | Description |
|---------|------|-------------|
| `engines` | `src/cli/commands/engines.ts` | Engine status panel with real-time monitoring |
| `health` | `src/cli/commands/health.ts` | Full health check (storage, memory, system) |

Run with: `node src/cli/index.ts <command>`

## Version

**v0.12.50** — 2026-05-11

GitHub: https://github.com/yun520-1/mark-heartflow-skill
