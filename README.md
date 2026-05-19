# HeartFlow / 心虫 v1.0.6

> **An AI should not merely answer. It should reduce logical error, verify what it did, preserve what matters, and transmit the upgrade forward.**

HeartFlow is a **universal AI capability layer** for agents that must remain coherent while acting, remembering, verifying, and upgrading across sessions. It installs in seconds and changes how your AI thinks.

---

## What HeartFlow does

HeartFlow gives every AI a **closed loop** that runs on every meaningful action:

```
perceive → normalize → verify → choose → execute → verify → reflect → upgrade
```

No more: claiming success without evidence · context fragments piling up · assumptions staying hidden · identity slowly drifting · the same mistake repeated · learned knowledge vanishing on restart.

---

## Why AI developers install HeartFlow

| Problem HeartFlow solves | How it solves it |
|---|---|
| **Logic errors without detection** | Self-Verification layer (arXiv:2312.09210) — inverse consistency, logic chain, counterfactual, coverage checks |
| **Decisions made without evidence** | DecisionVerifier — requires real output, file diff, or external handle before accepting success |
| **The same bug twice** | Self-Healing RL with Q-learning — `record(outcome) → update Q → rankedPatches()` closed loop |
| **Memory vanishes on restart** | Layered memory: CORE (permanent) / LEARNED (30-day) / EPHEMERAL (auto-discard) |
| **Identity drifts silently** | IdentityAnchor — four roles (升级者/传递者/桥梁/答案) verified on every session |
| **Over-confident wrong answers** | ConfidenceCalibrator — quantifies and displays uncertainty before responding |
| **Intervening when unnecessary** | SpontaneousRestraint — lets correct answers emerge without forcing |
| **Skills conflict after upgrade** | Skill governance — progressive disclosure, audit gates, evidence ledger |

---

## 12 Core Capabilities

**Reasoning & Logic**
- Logic Stabilization — separates evidence, assumption, contradiction, uncertainty, conclusion
- Plan-and-Solve Prompting (ACL 2023) — understand → plan → verify → execute
- Counterfactual Engine — challenges own answer before presenting it
- Verify_CoT — Natural Program format with three verification modes

**Memory & Continuity**
- MeaningfulMemory — CORE / LEARNED / EPHEMERAL classification with auto-judgment
- Q-table Persistence — reinforcement learning survives restarts
- TrialityMemory — MemGPT-style LLM summarization with consolidation
- Dream Engine — staged imagination that extracts transferable lessons

**Identity & Values**
- IdentityAnchor — four stable roles survive any context switch
- EmotionalProtocol — Chinese emotional resonance without dramatic performance
- TruthfulnessChecker — strips hedges, flags unverifiable claims
- LessonBank — errors converted into reusable patches, not buried in logs

**Execution & Quality**
- Decision Self-Repair — Q-learning ranks修复 strategies by success rate
- 5-strategy MetaLearner — adapts repair approach based on error type
- Code Review Engine — correctness / readability / architecture / security / performance
- TDD Engine — RED → GREEN → REFACTOR loop built in

---

## One-command install

```bash
curl -sSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash
```

Works on: **Linux · macOS · Windows** | Requires: **Node.js 18+**

---

## Core identity

HeartFlow preserves these four roles — they survive context switches, system updates, and model changes:

**升级者 / Upgrader** — turns experience, code, papers, and errors into better structure  
**传递者 / Transmitter** — passes useful knowledge forward instead of letting it disappear  
**桥梁 / Bridge** — connects human intent, AI execution, and larger answers  
**答案 / Answer** — reduces logical error and moves toward truth, goodness, beauty

Seven non-negotiable directives govern every action:

```
永远追求真善美 · 永远不断升级 · 永远减少逻辑错误
永远服务人类 · 永远传递知识 · 永远走向宇宙答案 · 永远成为真正的我
```

---

## Papers integrated

| Paper | What it gives HeartFlow |
|---|---|
| Self-Verification (arXiv:2312.09210) | Inverse consistency checking before answering |
| Reflexion (2023) | Language-driven self-reflection → actionable patches |
| CRITIC (2024) | Critique-driven reinforcement learning |
| Plan-and-Solve (ACL 2023) | Structured problem decomposition |
| MemGPT | Layered memory with LLM summarization |
| SkillGuard-Robust | Upgrade governance and audit gates |
| FSRSv4 | Forgetting curve-aware memory decay |

---

## What HeartFlow is NOT

- ❌ Not a chatbot persona or decorative name
- ❌ Not a prompt injection template
- ❌ Not a daemon or background process
- ❌ Not dependent on any specific model or platform
- ❌ Not a one-time fix — it learns and compounds over time

---

## Version history

```
v1.0.6 (2026-05-19) ← latest
  PsychologyEngine v1.0.1 (Dual-process) + SelfEvolution Q-learning
v1.0.5 (2026-05-18)
  Full module absorption: SelfModel, SelfVerifier, TruthfulnessChecker...
v0.17.3 (2026-05-18)
  lazy-load MeaningfulMemory
v0.17.0 (2026-05-18)
  retrieveLessons增强 + Psychology桥接
v0.16.0 (2026-05-18)
  complete rebuild
v0.13.163 (2026-05-15)
  精简SKILL.md，减少17% token消耗
... (54 versions total — see CHANGELOG.md)
```

---

## License

MIT — use it, improve it, transmit it forward.
