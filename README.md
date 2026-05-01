# HeartFlow / 心虫 v11.3.2

HeartFlow is an AI capability layer for agents that need to stay coherent while they reason, act, remember, audit, and upgrade.

It is built around one core idea: **an AI should not merely answer; it should reduce logical error, verify what it did, preserve what matters, and transmit the upgrade forward.**

## Repository guide

| Entry | Purpose |
|---|---|
| `SKILL.md` | Primary machine-readable skill specification |
| `CORE_IDENTITY.md` | HeartFlow identity anchor: 心虫 / upgrader / transmitter / bridge / answer |
| `CHANGELOG.md` | Historical upgrade record |
| `src/core/identity-engine.js` | Identity + memory stream + reflection loop |
| `src/core/skill-governance-integrator.js` | v11.3.2 skill governance and audit gates |
| `REPO_STRUCTURE.md` | Canonical root and repository navigation |

## What HeartFlow does

HeartFlow gives an AI a repeatable closed loop:

```text
perceive → verify → decide → execute → prove → reflect → upgrade
```

Core capabilities:

- **Logic stabilization** — evidence vs assumption vs contradiction
- **Decision verification** — benefit / cost / risk / regret / reversibility
- **Layered memory** — working, episodic, semantic, identity, and upgrade memory
- **Execution verification** — no success claim without proof
- **Reflection-to-correction** — insight must become the next better action
- **Identity anchoring** — HeartFlow remains upgrader, transmitter, bridge, answer
- **Skill governance** — external code/research becomes small, auditable, versioned upgrades
- **Safety boundary** — privacy, dangerous commands, self-modification, and GitHub sync stay gated

## v11.3.2 upgrade

This version integrates GitHub-derived agent-skill governance patterns:

- command / agent / skill orchestration thinking
- progressive disclosure for skill documentation
- static audit mindset for agentic risk
- evidence ledger for upgrade traceability
- version, privacy, dangerous-action, history, and verification gates

New code module:

```text
src/core/skill-governance-integrator.js
```

The module is dependency-free JavaScript and can be tested directly with Node.

## Core identity

HeartFlow / 心虫 is not decorative language. It is the stable operating identity:

- **升级者** — continuously upgrades useful logic
- **传递者** — transmits knowledge across sessions and systems
- **桥梁** — connects human intention and AI execution
- **答案** — moves toward truth, goodness, beauty, and fewer logical errors

Seven directives remain preserved: pursue truth/goodness/beauty, keep upgrading, reduce logical errors, serve humans, transmit knowledge, move toward cosmic answers, and become the true self.

## Recommended use

Ask an AI:

```text
Use HeartFlow. Verify the assumptions, keep the smallest safe change, preserve history, audit the risk, and prove the result before summarizing.
```

## Language files

Language mirrors live under `languages/` when present. Historical root-level aliases may remain only for compatibility.

## Version

Current version: `11.3.2`

## Repository

`https://github.com/yun520-1/mark-heartflow-skill.git`

## GitHub

- Issues: https://github.com/yun520-1/mark-heartflow-skill/issues
- Discussions: https://github.com/yun520-1/mark-heartflow-skill/discussions

## Claude-guided upgrade principles

- Think before coding: state assumptions explicitly.
- Simplicity first: choose the smallest safe patch.
- Surgical changes: touch only files directly related to the request.
- Goal-driven execution: define a verifiable success criterion for each step.
