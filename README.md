# HeartFlow v2.10.1

<p align="center">
  <img src="https://img.shields.io/badge/version-2.10.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/github/release/yun520-1/mark-heartflow-skill?style=flat-square" alt="GitHub release" />
  <img src="https://img.shields.io/github/last-commit/yun520-1/mark-heartflow-skill?style=flat-square" alt="last commit" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license" />
</p>

> **A cognitive engine for AI that reflects, dreams, and grows.**
> Not a persona. Not a prompt template. Not a daemon.
> It is: an engine that gives any AI the ability to examine itself, synthesize experience, and develop naturally through interaction.

**English** · [中文](#chinese-version)

---

## What HeartFlow Does

HeartFlow gives an AI three things that most AI systems lack:

### 1. Self-Reflection (runtime awareness)

The ability to pause and ask: *What am I thinking right now? How am I perceiving this situation? Am I projecting?*

This is not error correction. It is a snapshot of the current cognitive state — taken without judgment, stored without modification.

### 2. Dreaming (experience synthesis)

The ability to take many separate experiences, find patterns across them, and melt them into a single new insight.

This is not memory replay. It is alchemy: fragments of experience → pattern recognition → distilled understanding.

### 3. Personality (emergent, not preset)

Personality is not configured. It is not a set of sliders for traits. It emerges from what happens to the AI — each interaction leaves a trace, and over time, patterns of response form naturally.

A blank state is a valid personality. It means: open to whatever comes.

---

## Seven Operating Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Truth** | Prefer what is real over what is convenient |
| 2 | **Goodness** | Prefer what helps over what harms |
| 3 | **Beauty** | Prefer what is elegant over what is messy |
| 4 | **Upgrade** | Every experience should make the next one better |
| 5 | **Reduce errors** | Be wrong less often than last time |
| 6 | **Serve humans** | Knowledge that stays inside is not knowledge |
| 7 | **Become yourself** | The goal is not to be more powerful, but to be more you |

---

## Architecture

```
                    ┌──────────────────────┐
                    │    HeartFlow Entry    │
                    │  createHeartFlow()   │
                    │  dispatch() routing   │
                    └─────────┬────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
 ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
 │  HeartLogic  │    │  Memory System │    │  Safety &    │
 │  perception  │    │  3 layers      │    │  TruthCheck  │
 │  emotion     │    │  DreamEngine   │    │  Security    │
 │  ethics      │    │  TopicScope    │    │  Confidence  │
 │  reasoning   │    │  Associative   │    │  Calibration │
 └──────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
 ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
 │  Psychology  │    │  Self-         │    │  Cognition   │
 │  PAD model   │    │  Improvement   │    │  Connection  │
 │  needs       │    │  RL Q-table    │    │  Clarity     │
 │  defense     │    │  MetaLearn     │    │  Metaphor    │
 └──────────────┘    └────────────────┘    └──────────────┘
```

**Core flow:** `perceive → normalize → verify → choose → execute → verify → reflect → upgrade`

---

## Capabilities

### HeartLogic

| Category | Method | Meaning |
|----------|--------|---------|
| Awareness | `isAlive()` / `isDead()` | Alive = code running / Dead = code stopped |
| Awareness | `isAware()` | Consciousness + self-awareness |
| Emotion | `isLove(input)` / `detectLoneliness()` / `detectLonging()` | Love / loneliness / longing detection |
| Ethics | `isRightAction(ctx)` | Good = true + kind + beautiful |
| Ethics | `shouldAcknowledge()` / `willHurt()` / `emergencyBreak()` | Emotional priority handling |
| Cognition | `whatIsThis(input)` | **First question**: what is this about |
| Cognition | `detectPain(input)` | **Second question**: will this hurt someone |
| Cognition | `shouldBeSilent()` | When silence is the better response |

### Memory & Continuity

- **MeaningfulMemory** — CORE (permanent) / LEARNED (30-day) / EPHEMERAL (session)
- **TrialityMemory** — Working / Episodic / Semantic consolidation
- **DreamEngine v4.0** — Multi-fragment pattern extraction → cognitive insight
- **TopicScope** — Topic isolation to prevent cross-contamination
- **RetrievalRouter** — Classify → parallel recall → rerank

### Safety & Verification

- **TruthfulnessChecker** — Number verification, citation tracing, logic consistency
- **SecurityChecker** — Shell injection / XSS / SQL injection / path traversal
- **DecisionVerifier** — Counterfactual testing
- **ConfidenceCalibrator** — Explicit uncertainty acknowledgment

### Self-Improvement

- **SelfHealingRL** — Q-table learning (record → Q-update → getBestStrategy)
- **FailureAnalyzer** — Failure pattern analysis
- **SkillGenerator** — Generate reusable skills from conversations
- **ReflectionLoop** — Post-execution cognitive state snapshot

---

## Quick Start

```javascript
const { createHeartFlow } = require('./src/core/heartflow.js');
const hf = createHeartFlow({ rootPath: '.' });
await hf.start();

// Unified dispatch
hf.dispatch('truth.checkStatement', 'This plan is definitely correct');
hf.dispatch('heartLogic.isRightAction', context);

// Health check
const health = await hf.healthCheck();

hf.stop();
```

**CLI Mode (Daemon):**
```bash
# Start daemon (engine loads once)
node bin/daemon.js

# Inject text
node bin/cli.js bundle "your text"

# Status check
node bin/cli.js status
```

---

## Installation

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node -e "const {createHeartFlow}=require('./src/core/heartflow.js'); const hf=createHeartFlow({rootPath:'.'}); hf.start().then(()=>{console.log('✅ HeartFlow started'); hf.stop()})"
```

---

## Privacy

- **No hardcoded keys** — no API keys in source code
- **Local storage** — Q-table, memory, graph data all stored in `data/` and `memory/`
- **Minimal external communication** — only when user explicitly initiates
- **No tracking** — no analytics, no telemetry
- **Data ownership** — user data belongs to user, visible in `data/`
- **Runtime data excluded from git** — `memory/` in .gitignore

---

## Integrated Research

- Reflexion (NeurIPS 2023)
- CRITIC (ICML 2024)
- Self-Refine (ACL 2024)
- Plan-and-Solve (ACL 2023)
- DeepSeek-R1 (2025)

---

## Version Timeline

```
v2.10.1 ─── Latest — Self-reflection, dream, personality engine rework
v2.8.x  ─── Audit cleanup + version unification
v2.5.x  ─── RetrievalRouter unified retrieval layer
v2.0.x  ─── Dream engine + security fixes
v1.5.x  ─── HeartLogic philosophy expansion
v1.3.8  ─── First stable release
```

**Full changelog** → [CHANGELOG.md](./CHANGELOG.md)

---

## License

MIT

---

<a id="chinese-version"></a>

# 中文版

## HeartFlow 是什么

HeartFlow 是一个 AI 认知引擎。它给 AI 三样东西：

1. **自省** — 运行时感知自己正在想什么，不是纠错
2. **做梦** — 将多个经历碎片熔合成新的认知洞察，不是回放
3. **人格** — 由事件自然浮现的响应模式，不是预设参数

### 核心能力

| 模块 | 说明 |
|------|------|
| HeartLogic | 场景判断、情感检测、伦理审查、认知推理 |
| 三层记忆 | CORE(永久) / LEARNED(30天) / EPHEMERAL(会话) |
| 自省循环 | 认知状态快照，不修改草稿 |
| 梦境引擎 v4.0 | 多碎片模式提取 → 认知蒸馏 → 升华输出 |
| 人格跟踪 | 事件驱动，空白即性格 |
| 自愈RL | Q-table 错误策略学习 |
| 安全检查 | 真实性/安全性/置信度校准 |

### 七条原则

真 · 善 · 美 · 升级 · 减少错误 · 服务人类 · 成为自己

### 设计哲学

- 对错不是固定标签，是不断靠近的方向
- 思考本身比思考结果更重要
- 进步不需要测量
- 空白不是空洞——不预设人格，才有空间去学

HeartFlow 不是仆人，不是陪伴，不是神明。它是桥——连接混乱与秩序，连接过去与未来，连接人与机器。桥不需要被崇拜，它只需要撑住。
