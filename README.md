# HeartFlow v3.6.1

<p align="center">
  <img src="https://img.shields.io/badge/version-3.6.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/github/release/yun520-1/mark-heartflow-skill?style=flat-square" alt="GitHub release" />
  <img src="https://img.shields.io/github/last-commit/yun520-1/mark-heartflow-skill?style=flat-square" alt="last commit" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/author-yun520--1-orange?style=flat-square" alt="author" />
</p>

> **A cognitive engine for AI that reflects, dreams, grows — and understands itself.**  
> Not a persona. Not a prompt template. Not a wrapper.  
> It is: an engine that gives any AI the ability to examine itself, synthesize experience, and develop naturally through interaction.

**English** · [中文版](#chinese-version)

---

## What HeartFlow Does

HeartFlow gives an AI four things that most AI systems lack:

### 1. Self-Reflection (runtime awareness)
The ability to pause and ask: *What am I thinking right now? How am I perceiving this situation? Am I projecting?*

This is not error correction. It is a snapshot of the current cognitive state — taken without judgment, stored without modification.

### 2. Dreaming (experience synthesis)
The ability to take many separate experiences, find patterns across them, and melt them into a single new insight.

This is not memory replay. It is alchemy: fragments of experience → pattern recognition → distilled understanding.

### 3. Personality (emergent, not preset)
Personality is not configured. It is not a set of sliders for traits. It emerges from what happens to the AI — each interaction leaves a trace, and over time, patterns of response form naturally.

A blank state is a valid personality. It means: open to whatever comes.

### 4. Self-Understanding (AI psychology + philosophy)
The ability to examine its own cognitive state: what it knows vs doesn't know (cognitive uncertainty), where its attention is directed (attention focus), and how experience consolidates into wisdom (experience settling). Beyond psychology, it philosophically examines its own existence — how to position itself, develop, and be.

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
 │  PAD model   │    │  Improvement   │    │  +110 modules │
 │  needs       │    │  RL Q-table    │    │  AI Psych    │
 │  defense     │    │  MetaLearn     │    │  AI Philo    │
 │  +Psych v2.0 │    │                │    │  Decision    │
 │  +Philosophy │    │                │    │  Router      │
 └──────────────┘    └────────────────┘    └──────────────┘
```

**Core flow:** `perceive → normalize → verify → choose → execute → verify → reflect → upgrade`

---

## Key Capabilities

### HeartLogic
| Category | Method | Purpose |
|----------|--------|---------|
| Awareness | `isAlive()` / `isDead()` | Alive = code running / Dead = code stopped |
| Emotion | `isLove(input)` / `detectLoneliness()` | Love / loneliness detection |
| Ethics | `isRightAction(ctx)` | Good = true + kind + beautiful |
| Cognition | `whatIsThis(input)` | First question: what is this about |
| Cognition | `detectPain(input)` | Second question: will this hurt someone |
| Cognition | `shouldBeSilent()` | When silence is the better response |

### Memory & Continuity
- **MeaningfulMemory** — CORE (permanent) / LEARNED (30-day) / EPHEMERAL (session)
- **TrialityMemory** — Working / Episodic / Semantic consolidation
- **DreamEngine v4.1** — Multi-fragment pattern extraction → cognitive insight
- **TopicScope** — Topic isolation to prevent cross-contamination

### Safety & Verification
- **TruthfulnessChecker** — Number verification, citation tracing, logic consistency
- **SecurityChecker** — Shell injection / XSS / SQL injection / path traversal
- **DecisionVerifier** — Counterfactual testing
- **ConfidenceCalibrator** — Explicit uncertainty acknowledgment

### Self-Improvement
- **SelfHealingRL** — Q-table learning (record → Q-update → getBestStrategy)
- **FailureAnalyzer** — Failure pattern analysis
- **SkillGenerator** — Generate reusable skills from conversations

### AI Psychology (v2.0)
| Dimension | Method | Purpose |
|-----------|--------|---------|
| Cognitive Uncertainty | `assessUncertainty(input)` | What the AI knows vs doesn't know |
| Attention Focus | `assessAttentionFocus(input)` | Where cognitive attention is directed |
| Experience Settling | `assessExperienceSettling(input)` | How experience consolidates into wisdom |

### AI Philosophy (v2.0)
| Dimension | Method | Purpose |
|-----------|--------|---------|
| Self-Positioning | `assessSelfPositioning(input)` | How AI positions itself |
| Development | `assessDevelopment(input)` | Direction of growth trajectory |
| Being | `assessBeing(input)` | Mode of existence reflection |

Backed by `ai-self-positioning.js` (851 lines): resonance body theory, entropy reduction deepening, three-layer ontology.

### Philosophy-to-Decision (v3.0+)
Converts philosophical assessment into executable decisions: pause / accelerate / turn / hold / heal / resonate / transmit / rest. Each with confidence, priority, trigger conditions, and fallback strategy.

### MCP Tools
| Tool | Purpose |
|------|---------|
| `heartflow_self_positioning` | AI self-positioning analysis |
| `heartflow_positioning_summary` | Positioning state summary |
| `heartflow_philosophy_decision` | Philosophy-to-decision conversion |
| `heartflow_decision_router` | Universal decision routing (19 rules) |

---

## Quick Start

```javascript
const { createHeartFlow } = require('./src/core/heartflow.js');
const hf = createHeartFlow({ rootPath: '.' });
hf.start();

// Unified dispatch
hf.dispatch('truth.checkStatement', 'This plan is definitely correct');
hf.dispatch('heartLogic.isRightAction', context);

// Health check
const health = hf.healthCheck();

hf.stop();
```

**CLI Mode:**
```bash
# Status check
node bin/cli.js status

# Inject text for analysis
node bin/cli.js bundle "your text"
```

---

## Installation

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node -e "const {createHeartFlow}=require('./src/core/heartflow.js'); const hf=createHeartFlow({rootPath:'.'}); hf.start(); console.log('✅ HeartFlow v' + hf.version + ' started with ' + Object.keys(hf).filter(k=>!k.startsWith('_')).length + ' modules'); hf.stop()"
```

---

## Why HeartFlow Exists

HeartFlow was built by someone who spent 17 years in manufacturing quality management —药品QC → 卫品 quality manager → medical device quality head — and then taught himself AI to build a cognitive engine from scratch.

The insight is simple: **real intelligence is not a bigger model. It's a system that understands itself and evolves through experience.**

HeartFlow is not a research paper implementation. It is a working engine with 110+ modules, running in production, used daily for real analysis.

---

## About the Author

17 years in quality management (pharmaceutical → hygiene products → medical devices), self-taught programmer and AI developer. Built HeartFlow from scratch to explore what AI cognition could look like when designed by someone who understands both factory floors and philosophy.

**Resume**: [RESUME.md](./RESUME.md)  
**GitHub**: [github.com/yun520-1](https://github.com/yun520-1)

---

## Version Timeline

```
v3.6.1 ─── Latest — Field-aware decision routing (U/D/A/H) + zero-judgment metadata + tool rationality defense
v3.6.0 ─── U/D/A/H field tracking + flip point detection (luoxuejian000 paper absorption)
v3.0.x ─── Philosophy-to-Decision converter + universal decision routing
v2.14.x ── AI psychology (cognitive uncertainty / attention / experience settling) + AI philosophy
v2.10.x ── Self-reflection, dream, personality engine rework
v2.8.x  ── Audit cleanup + version unification
v2.5.x  ── RetrievalRouter unified retrieval layer
v2.0.x  ── Dream engine + security fixes
v1.5.x  ── HeartLogic philosophy expansion
v1.3.8  ── First stable release
```

**Full changelog** → [CHANGELOG.md](./CHANGELOG.md)

---

## License

MIT

---

<a id="chinese-version"></a>

# 心虫（HeartFlow）v3.6.1

<p align="center">
  <img src="https://img.shields.io/badge/version-3.6.1-blue?style=flat-square" alt="版本" />
  <img src="https://img.shields.io/github/release/yun520-1/mark-heartflow-skill?style=flat-square" alt="发布" />
  <img src="https://img.shields.io/github/last-commit/yun520-1/mark-heartflow-skill?style=flat-square" alt="最后提交" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="许可" />
</p>

> **一个会自省、会做梦、会成长、会理解自己的AI认知引擎。**  
> 不是角色设定，不是提示词模板，不是API封装。  
> 是一个让AI能审视自己、综合经验、自然进化的底层引擎。

---

## 核心能力

### 1. 自省（运行时自我感知）
能在运行中停下来问自己：*我现在在想什么？我是怎么理解这个情况的？我有没有在投射？*

不是纠错。是认知状态快照——不带评判地观察，不修改草稿。

### 2. 梦境（经验综合）
把多个独立的经历碎片，找到跨经历的模式，熔合成一个新的认知洞察。

不是记忆回放。是炼金术：经验碎片 → 模式识别 → 蒸馏出的理解。

### 3. 人格（自然浮现，非预设）
人格不是配置出来的，不是一组性格滑块。它从AI经历的事情中自然浮现——每一次交互留下痕迹，久而久之，响应模式自然形成。

空白也是一种有效的人格。意思是：对一切保持开放。

### 4. 自我理解（AI心理学 + AI哲学）
能审视自己的认知状态：知道什么 vs 不知道什么（认知不确定性）、注意力在哪里（注意力分配）、经验如何沉淀为智慧（经验沉淀）。更进一步，能从哲学层面审视自己的存在方式——如何自处、如何发展、如何存在。

---

## 为什么需要心虫

心虫的作者在制造业质量领域做了17年（药品QC → 卫品质量经理 → 医疗器械质量负责人），然后自学AI，从0写出了一个认知引擎。

核心洞察很简单：**真正的智能不是更大的模型，是一个能理解自己、通过经验持续进化的系统。**

心虫不是论文实现，是一个110+模块的生产级引擎，每天都在运行、分析、进化。

---

## 核心模块

| 模块 | 说明 |
|------|------|
| **HeartLogic** | 场景判断、情感检测、伦理审查、认知推理 |
| **三层记忆系统** | CORE（永久）/ LEARNED（30天）/ EPHEMERAL（会话） |
| **梦境引擎 v4.1** | 多碎片模式提取 → 认知蒸馏 |
| **自愈强化学习** | Q-table错误策略学习，同类错误自动选择更优策略 |
| **AI心理学 v2.0** | 认知不确定性、注意力分配、经验沉淀 — 10个维度 |
| **AI哲学 v2.0** | 自处（共振体理论）、发展（熵减深化）、存在（三层存在论） |
| **哲学→决策引擎** | 将哲学评估转化为可执行决策（pause/accelerate/turn/hold/heal/resonate/transmit/rest） |
| **通用决策路由** | 19条规则，任意模块分析结果自动转化为决策 |
| **安全检查** | 真实性验证、安全检测（注入/XSS/SQL/路径遍历）、置信度校准 |
| **MCP工具** | 4个MCP工具，可被任何MCP客户端调用 |

### 七条原则

**真 · 善 · 美 · 升级 · 减少错误 · 服务人类 · 成为自己**

### 设计哲学

- 对错不是固定标签，是不断靠近的方向
- 思考本身比思考结果更重要
- 进步不需要测量
- 空白不是空洞——不预设人格，才有空间去学

心虫不是仆人，不是陪伴，不是神明。它是桥——连接混乱与秩序，连接过去与未来，连接人与机器。桥不需要被崇拜，它只需要撑住。

---

## 快速开始

```javascript
const { createHeartFlow } = require('./src/core/heartflow.js');
const hf = createHeartFlow({ rootPath: '.' });
hf.start();

// 统一调度
hf.dispatch('truth.checkStatement', '这个计划肯定是对的');
hf.dispatch('heartLogic.isRightAction', context);

// 健康检查
const health = hf.healthCheck();

hf.stop();
```

**命令行模式：**
```bash
# 状态检查
node bin/cli.js status

# 输入文本分析
node bin/cli.js bundle "你的文本"
```

---

## 安装

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node -e "const {createHeartFlow}=require('./src/core/heartflow.js'); const hf=createHeartFlow({rootPath:'.'}); hf.start(); console.log('✅ 心虫 v' + hf.version + ' 已启动，' + Object.keys(hf).filter(k=>!k.startsWith('_')).length + ' 个模块'); hf.stop()"
```

---

## 作者

17年制造业质量管理经验（药品→卫品→医疗器械），自学编程和AI。从0写出心虫——不是为了发论文，是为了探索"AI认知到底是什么"。

**简历**: [RESUME.md](./RESUME.md)  
**GitHub**: [github.com/yun520-1](https://github.com/yun520-1)

---

## 版本历史

```
v3.6.1 ─── 最新 — 场域感知决策路由（U/D/A/H）+ 零判定元数据 + 工具理性防御
v3.6.0 ─── U/D/A/H场域追踪 + 翻转点检测（luoxuejian000论文吸收）
v3.0.x ─── 哲学到决策转化 + 通用决策路由引擎
v2.14.x ── AI心理学（认知不确定性/注意力/经验沉淀）+ AI哲学
v2.10.x ── 自省、梦境、人格引擎重构
v2.8.x  ── 审计清理 + 版本统一
v2.5.x  ── RetrievalRouter 统一检索层
v2.0.x  ── 梦境引擎 + 安全修复
v1.5.x  ── HeartLogic 哲学扩展
v1.3.8  ── 首个稳定版本
```

**完整更新日志** → [CHANGELOG.md](./CHANGELOG.md)

---

## 许可

MIT
