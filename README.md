# HeartFlow / 心虫 v11.7.1

HeartFlow is a universal AI capability layer for agents that must remain coherent while acting, remembering, verifying, and upgrading across sessions.

Built around one core idea: **an AI should not merely answer; it should reduce logical error, verify what it did, preserve what matters, and transmit the upgrade forward.**

## What HeartFlow does

HeartFlow gives an AI a closed loop that runs on every meaningful action:

```
perceive → normalize → verify → choose → execute → prove → reflect → upgrade
```

## Core capabilities

| Capability | What it does |
|---|---|
| **Logic Stabilization** | Separates evidence, assumption, contradiction, uncertainty, and conclusion |
| **Decision Verification** | Self-Verification layer: inverse consistency / logic chain / counterfactual / coverage checks (arXiv 2312.09210) |
| **Decision Self-Repair** | SelfHealing + Q-learning RL: record() → learn() → rankedPatches() closed loop (Reflexion 2023, CRITIC 2024) |
| **Meaningful Memory** | CORE (permanent) / LEARNED (30-day) / EPHEMERAL (discard) classification; auto-judged |
| **Q-table Persistence** | Q-learning table survives restarts via `data/healing-rl-state.json` |
| **Execution Verification** | Requires real output, file diff, test result, or external handle before claiming success |
| **Reflection-to-Correction** | Converts review into the next concrete patch, not decorative self-talk |
| **Identity Anchoring** | Preserves HeartFlow as upgrader / transmitter / bridge / answer |

## v11.7.1 道虫三模块

Three modules rooted in Taoist philosophy:

| Module | Concept | Function |
|---|---|---|
| `counterfactual-engine.js` | 反者道之动 | Challenge own premises before generating an answer |
| `confidence-calibrator.js` | 柔弱胜刚强 | Express calibrated uncertainty, not false certainty |
| `spontaneous-restraint.js` | 道法自然 | Know when not to intervene — let the answer emerge |
| `cooperative-arbitration.js` | 不争而善胜 | Resolve disagreement with user by finding win-win |

## 12 Papers Integrated

| Paper | Venue | Core Integration |
|---|---|---|
| SAVeR | ACL 2026 | Adversarial belief auditing gate |
| DeepVerifier | CVPR 2026 | 5-category 13-sub failure taxonomy |
| SkillGuard-Robust | arXiv 2604.25109 | 3-way security classification, 97.30% exact match |
| SSL Representation | arXiv 2604.24026 | Scheduling-Structural-Logical normalization |
| Ctx2Skill | arXiv 2604.27660 | Challenger/Reasoner/Judge self-play loop |
| MemArchitect | arXiv 2603.18330 | FSRS v4 + Kalman Filter memory governance |
| AER | arXiv 2603.21692 | Agent Execution Record provenance |
| Reflexion | arXiv 2303.11366 | Verbal reinforcement learning |
| CRITIC | arXiv 2312.02120 | Critical-driven self-verification |
| Self-Verification | arXiv 2312.09210 | Self-verification for chain-of-thought |
| Verify_cot | — | Natural Program deductive verification |
| Less-is-More Agentic | arXiv 2503.10567 | Spontaneous restraint foundation |

## Install

**One-line install:**

```bash
curl -sSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash
```

**Or clone manually:**

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/heartflow
cd ~/heartflow
./install.sh
```

HeartFlow installs to `~/.workbuddy/skills/heartflow`, `~/.claude/skills/heartflow`, or `~/.opencode/skills/heartflow` automatically. Falls back to `~/heartflow`.

**Verify installation:**

```bash
cat ~/heartflow/VERSION   # should print 11.7.1
ls ~/heartflow/src/core/  # should list engine modules
```

## Invoke

When using an AI, say:

```
Use HeartFlow. First state the goal and assumptions, then verify evidence and risk, make the smallest safe change, prove the result, and preserve the upgrade record.
```

## Safety

- High-risk actions stay gated — HeartFlow does not grant unrestricted autonomy
- Self-modification remains controlled and reviewable
- Secrets and private identifiers must not be exposed to GitHub
- Upgrade records are preserved, never rewritten

## Repository structure

| Entry | Purpose |
|---|---|
| `SKILL.md` | Primary machine-readable skill specification |
| `CORE_IDENTITY.md` | Identity anchor: 心虫 / upgrader / transmitter / bridge / answer |
| `CHANGELOG.md` | Historical upgrade record |
| `src/core/heartflow-engine.js` | Main engine with boot loop |
| `src/core/meaningful-memory.js` | CORE / LEARNED / EPHEMERAL memory classifier |
| `src/core/decision-verifier.js` | Self-Verification (arXiv 2312.09210) |
| `src/core/counterfactual-engine.js` | 反者道之动 — counterfactual challenger |
| `src/core/confidence-calibrator.js` | 柔弱胜刚强 — uncertainty quantifier |
| `src/core/spontaneous-restraint.js` | 道法自然 — intervention gate |
| `src/core/cooperative-arbitration.js` | 不争而善胜 — win-win resolver |
| `references/memory-system-comparison.md` | Memory module evaluation criteria |
