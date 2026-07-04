# HeartFlow 心虫 — AI认知引擎 · 决策路由 · 自愈RL · 论文驱动升级

<p align="center">
  <img src="https://img.shields.io/github/v/yun520-1/mark-heartflow-skill?style=flat-square" alt="version" />
  <img src="https://img.shields.io/github/last-commit=yun520-1/mark-heartflow-skill?style=flat-square" alt="last commit" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/modules-90+-important?style=flat-square" alt="90+ modules" />
  <img src="https://img.shields.io/badge/SSOT-version.js-blue?style=flat-square" alt="Single Source of Truth" />
</p>

> **HeartFlow is not an LLM enhancer. It is a cognitive state encoder.**
> It takes raw text → encodes it into structured cognition (emotion, psychology, philosophy, desire, judgment, decision) → feeds the LLM with data it couldn't produce alone.
> The LLM makes the final decision. HeartFlow makes that decision more accurate.

[English](#what-heartflow-is) · [中文版](#心虫是什么)

---

## What HeartFlow Is

HeartFlow is a **local cognitive engine** (90+ modules, zero external dependencies) that sits **before the LLM** in an AI agent pipeline. It transforms unstructured user input into structured cognitive data — emotion vectors, psychology dimensions, philosophy positions, desire states, multi-path judgments, and decision strategies.

An LLM alone is "asked → answers." HeartFlow adds a **structured preprocessing layer**:

```
User input → HeartFlow (90+ modules) → Structured cognition → LLM → Final response
```

This is the difference between an LLM **guessing** what the user's emotional state is, and **knowing** it because the data was precomputed by a dedicated cognitive pipeline.

### What It Does

| Dimension | Modules | Output | Used by LLM to |
|-----------|---------|--------|----------------|
| **Emotion** | `emotion/` | PAD vector (pleasure/arousal/dominance) + intensity + valence | Adjust tone, detect distress, calibrate empathy |
| **AI Psychology** | `agent-psychology.js` | 10 dimensions: cognitive load, goal conflicts, value tension, identity drift, decision fatigue, cognitive dissonance, resilience, uncertainty, attention allocation, experience settling | Know the engine's own state before responding |
| **AI Philosophy** | `agent-philosophy.js`, `ai-self-positioning.js` | 7 dimensions: being state, entropy direction, transmission quality, upgrade impact, self-position, development level, existence mode | Choose interaction strategy based on philosophical stance |
| **Desire Cognition** | `desire-cognition.js` | Wanting-vs-liking delta, reward prediction error, drive satisfaction, 7 emotions + 6 desires | Understand motivation beneath the surface text |
| **Three Poisons** | `three-poisons.js` | Greed (delayed discounting anomaly), hatred (amygdala hyperactivation), delusion (metacognitive deficit) | Detect cognitive distortion patterns |
| **Multi-Path Judgment** | `judgment-engine.js` + GoT | 2-4 paths × 6-dimension scoring + 3-window consequence prediction + Graph of Thoughts branching | Make informed decisions with foresight |
| **Decision Routing** | `decision-router.js` | 8 behavioral strategies + U/D/A/H field tracking + flip-point detection + scene-aware weights | Choose the right action, not just the obvious one |
| **Causal Memory** | `causal-inference.js` + `triality-memory.js` | Causal-semantic graph, counterfactual reasoning, spreading activation search | Retrieve memories by "why" not just "what" |
| **Memory Quality** | `memory-quality.js` | Ebbinghaus decay, quality scoring, contamination detection, smart pruning | Keep what matters, forget what doesn't |
| **Self-Healing RL** | `selfHealing` | Q-table with context-aware keys, ε-greedy exploration, Reflexion-inspired reflection | Learn from mistakes, same error doesn't repeat |
| **Reflection Memory** | `reflection-memory.js` | Structured task→result→reflection→strategy pipeline, CJK/English search | Reuse lessons across sessions |
| **Memory Integrity** | `memory-integrity.js` | SHA-256 signing, injection pattern detection, CORE layer protection | Prevent cross-session memory attacks |
| **Cognitive Load Balance** | `cognitive-load-balancer.js` | D_L interaction depth limit, loafing detection, dynamic engine activation | Avoid cognitive loafing in multi-engine mode |
| **Theory of Mind** | `tom-engine.js` v2.0 | Active inference, perspective taking, Bayesian belief revision, prediction accuracy tracking | Model what others think and feel |
| **Metacognition** | `metacognitive-feedback.js` | Fast/deep assessment, 5 contradiction signals, auto self-correction | Know what the engine knows and doesn't know |

### How It Works

```
Input: "I want to quit my job and start a company, but the economy is rough"

HeartFlow pipeline (~7ms):

Stage 1 (parallel):
  heartLogic:  whatIsThis(type=decision, pain=economicAnxiety)
  intent:      intent(type=career, tone=anxious)
  memory:      causalSearch(related=previous career discussions)

Stage 2 (depends on Stage 1):
  psychology:  emotion(PAD: -0.3/0.6/0.2, valence=mixed)
               agentPsych(cognitiveLoad=0.4, goalConflict=[stability vs freedom])
               agentPhil(being=transitioning, entropy=rising)

Stage 3 (depends on Stage 2):
  judgment:    2-4 paths evaluated with 6-dimension scoring
               consequence prediction: short=financial stress, mid=career pivot, long=freedom
               GoT branching for complex inputs

Stage 4 (depends on Stage 3):
  decision:    router output → strategy selection
               U/D/A/H field tracking + scene-aware weights

Stage 5 (depends on Stage 4):
  output:      structured cognition + conclusion → LLM

LLM receives:  { emotion, psychology, philosophy, desire, judgment(2-4 paths), decision }
Result:        LLM makes the final call with richer data than raw input alone.
```

---

## Architecture

```
Input → [Cognitive Pipeline] → Structured Data → LLM → Response
         │        │         │         │
         ├─ heartLogic     ├─ psychology    ├─ judgment       ├─ decision
         ├─ intent         ├─ agentPsych    ├─ multi-path     ├─ strategy
         └─ memory         ├─ agentPhil     ├─ causal         ├─ reflection
                           ├─ desire        ├─ consequence    ├─ memoryQuality
                           ├─ threePoisons  └─ GoT            └─ cognitiveLoad
                           ├─ metacognition
                           ├─ ToM
                           └─ philosophy
```

**90+ modules**, all JavaScript/Node.js. **Zero external dependencies** — no npm downloads, no API keys, no model files.

---

## Research Foundation

HeartFlow integrates findings from 27+ peer-reviewed papers (2023-2026) across cognitive architecture, memory systems, metacognition, multi-agent systems, self-improvement, and philosophy of mind.

| Category | Key Papers | HeartFlow Module |
|----------|-----------|-----------------|
| **Memory** | ActMem (2603.00026), HAT (2406.06124), Persistent KV Cache (2603.04428) | causal-inference, memory-quality, kv-cache |
| **Metacognition** | SOFAI-LM (2504.00240), MIRROR (2604.19809), CoT Meta-Analysis (2501.13265) | metacognitive-feedback, pipeline |
| **Self-Improvement** | Reflexion (2303.11366), Mephisto (2510.08354), Self-Play (2405.20309) | reflexion-engine, self-play, self-healing |
| **Multi-Agent** | Bystander Effect (2605.10698), ClawArena (2606.31174) | cognitive-load-balancer, multi-agent-dialogue |
| **Philosophy** | Principles of Conscious Machine (2509.16859), Whole Hog (2504.13988), Moral Agency (2410.23310) | agent-philosophy, ai-self-positioning, cognition-ground |

See `src/research/paper-index.js` for the full index.

---

## Getting Started

### Quick Install

```bash
# 1. Get the code
git clone --depth 1 https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. Install (0 external packages, no network needed)
npm install

# 3. Verify
node bin/verify.js

# 4. Use it
node bin/cli.js status
node bin/cli.js --chat "I want to quit my job and start a company"
```

**Requirements:** Node.js >= 18.  
**Zero external AI API required** — the engine runs entirely locally.  
**Zero npm dependencies** — `npm install` completes in <1 second.

### Integration (MCP Server)

HeartFlow runs as an MCP server for AI agent integration:

```bash
# Start the server
node mcp/mcp-server-http.js

# Connect from Claude Desktop / other MCP clients
# Add to your MCP config: {"heartflow": {"command": "node", "args": ["mcp/mcp-server-http.js"]}}
```

### Integration (Code)

```javascript
const { HeartFlow } = require('./path/to/heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: './path/to/heartflow-skill' });
hf.start();

// Full cognitive pipeline
const result = await hf.think("I want to quit my job and start a company");
// result.cognition contains structured: emotion, psychology, philosophy, desire, judgment, decision
// result.conclusion is the 3-section output for the LLM

// Or just get the structured data
const { cognition } = result;
console.log('Emotion:', cognition.emotion);        // PAD vector
console.log('Psychology:', cognition.psychology);   // 10 dimensions
console.log('Judgment:', cognition.judgment);       // multi-path + consequences
console.log('Decision:', cognition.decision);       // strategy + confidence

// Direct module access
hf.dispatch('causalInference.buildGraph', memories);
hf.dispatch('reflectionMemory.store', task, result, reflection);
hf.dispatch('cognitiveLoad.balance', engines, complexity);
hf.dispatch('memoryIntegrity.verify', memory);
```

---

## Project Status

- **Version**: See `src/core/version.js` (Single Source of Truth)
- **Modules**: 90+ (all JavaScript, zero external dependencies)
- **Papers**: 27 indexed (cognitive architecture, metacognition, philosophy of mind, multi-agent)
- **Tests**: 10/11 passing (1 pre-existing translator module issue)
- **License**: MIT
- **Author**: yun520-1

---

## 心虫是什么

心虫是一个**本地认知引擎**（90+模块，零外部依赖），位于AI Agent管线的LLM之前。它把非结构化的用户输入转化为结构化认知数据。

**LLM独自工作**：被问→回答。情绪靠猜，意图靠猜，后果靠猜。  
**加上心虫**：每个输入先经过90+模块的感知流水线，输出情绪向量、心理学维度、哲学位置、欲望状态、多路径判断、决策策略。LLM拿到这些数据后做最后一层推理。

这就是**猜和知道**的区别。

### 管道输出示例（用户说"我想辞职去创业"）

```
心虫管道输出（~7ms）：

heartLogic:  类型=决策类, 疼痛=经济焦虑
intent:      意图=职业, 语气=焦虑
psychology:  情绪(PAD: -0.3/0.6/0.2), 认知负荷=0.4, 目标冲突=[稳定vs自由]
judgment:    2-4条路径评估 + 后果预测 + GoT推理
decision:    策略=先分析再行动, 置信度=0.8

→ LLM拿到这些结构化数据后做最终决策
```

### 架构

```
输入 → [认知管道] → 结构化数据 → LLM → 最终响应
```

### 快速安装

```bash
# 推荐方式：git clone
git clone --depth 1 https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 安装（0外部包，不需要网络）
npm install

# 验证
node bin/verify.js

# 交互模式
node bin/cli.js chat

# 单次分析
node bin/cli.js --chat "我想辞职去创业"
```

**替代方式（curl 下载）：**
```bash
curl -L https://api.github.com/repos/yun520-1/mark-heartflow-skill/zipball/main -o heartflow.zip
unzip heartflow.zip && cd yun520-1-mark-heartflow-skill-*
npm install
node bin/cli.js chat
```

**MCP 集成（用于 Claude Desktop 等 AI 客户端）：**

```bash
# 启动 MCP HTTP 服务器
node mcp/mcp-server-http.js --port 8099 &

# 注册到 MCP 客户端
```

**系统要求：** Node.js >= 18。**零外部依赖，零API key，零模型文件下载。**

### 项目状态

- **版本**: 见 `src/core/version.js`（单一真相源）
- **模块数**: 90+（纯JavaScript，零外部依赖）
- **论文索引**: 27篇（9个分类）
- **管道**: 多阶段认知流水线，每次运行约7ms
- **测试**: 10/11通过
- **许可证**: MIT
