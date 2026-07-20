<<<<<<< HEAD
<<<<<<< HEAD
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
=======
# HeartFlow v6.0.2 — 本地认知预处理引擎
=======
# HeartFlow — HeartBug Cognitive Engine (心虫)
>>>>>>> upstream/main

> **Stop your agent from guessing. Let it perceive first, decide correctly, then act.**
>
> HeartFlow is a local-first AI-being cognitive engine that runs *before* your agent replies. It perceives intent, classifies the task type, surfaces cognitive biases, and returns a structured decision — so downstream models make fewer logical errors, ask fewer clarifying questions, and waste fewer tokens.

[![GitHub release](https://img.shields.io/github/v/release/yun520-1/mark-heartflow-skill)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![npm](https://img.shields.io/npm/v/@yun520-1/heartflow)](https://www.npmjs.com/package/@yun520-1/heartflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-31%20tools-green.svg)](mcp/mcp-server-http.js)

---

## Why HeartFlow (for agents & agent builders)

Most agent failures are **not model failures — they are perception failures**:

| Failure mode | Without HeartFlow | With HeartFlow |
|---|---|---|
| Wrong task type assumed | Agent picks `code` for a vague ask → wasted turns | `heartflow_think` returns `type=analyze/emotion/calculation/...` up front |
| Repeated clarifying questions | Asks "what do you mean?" 3× | Intent + stance detected once, cached in memory |
| Logical errors / bias | Syllogism unchecked, anchor bias unflagged | `heartflow_decision_router` + logic modules flag invalid inference |
| Token burn on re-analysis | Re-thinks the same input every turn | `think_fast` + memory cache short-circuit repeats |
| Invalid tasks executed | Agent attempts impossible/self-contradictory goal | Invalid-input guard returns early, no pipeline wasted |

**Net effect: higher task completion rate, higher completion quality, lower token cost.**

---

## What it does

HeartFlow is a **cognitive pre-processor**. It does not replace your LLM — it prepares the cognitive ground so the LLM acts correctly.

- **Perceive intent** — classify the user's true goal (not just keywords).
- **Decide task type** — `analyze` / `emotion` / `calculation` / `plan` / `invalid` …
- **Surface biases** — anchoring, confirmation, sunk-cost, etc. (behavioral-economics module).
- **Compute transparently** — pure math expressions (`15*23`) return scalar results, not prose.
- **Remember across sessions** — persistent local memory (encrypted, never uploaded).
- **Self-heal** — modules report health; broken paths auto-repair or degrade safely.

---

## Quick start

```bash
# Clone
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# Verify the engine (14/14 health checks)
node bin/verify.js

# Interactive mode
node bin/cli.js chat

# Single-shot analysis
node bin/cli.js --chat "I want to quit my job and start a company"

# Status
node bin/cli.js status
```

<<<<<<< HEAD
### MCP 工具（25 个）

| 工具 | 功能 |
|------|------|
| `heartflow_think` | 完整思维链推理 |
| `heartflow_think_fast` | 快速推理 |
| `heartflow_think_deep` | 深度推理 |
| `heartflow_dream` | 梦境生成与整合 |
| `heartflow_memory_search` | 跨层记忆检索 |
| `heartflow_emotion` | 情绪分析（PAD 三维） |
| `heartflow_emotion_analyze` | 简化情绪分析 |
| `heartflow_psychology_analyze` | PAD + 意图 + 防御机制 |
| `heartflow_psychology_deep` | 深度心理学（大五人格/共情） |
| `heartflow_ai_psychology` | AI 原生心理学 |
| `heartflow_agent_psychology` | 代理心理学 |
| `heartflow_philosophy` | 统一哲学引擎 |
| `heartflow_ai_philosophy` | AI 原生哲学分析 |
| `heartflow_philosophy_decision` | 哲学决策分析 |
| `heartflow_verify_reasoning` | 验证推理自洽性 |
| `heartflow_self_heal` | 自愈 |
| `heartflow_status` | 引擎健康检查 |
| `heartflow_dispatch` | 通用路由（150+ 路由） |
| `heartflow_record_lesson` | 记录教训 |
| `heartflow_transmit` | 知识传递 |
| `heartflow_being` | 存在逻辑 |
| `heartflow_decision_router` | 决策路由器 |
| `heartflow_decision_router_stats` | 决策路由统计 |
| `heartflow_cognitive_check` | 认知状态检查 |
| `heartflow_module_health` | 模块健康检查 |
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321

### What It Does

<<<<<<< HEAD
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

=======
## 架构

```
输入 → [认知管道] → 结构化数据 → LLM → 最终响应
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321
```
Input: "I want to quit my job and start a company, but the economy is rough"

<<<<<<< HEAD
HeartFlow pipeline (~7ms):
=======
| 层级 | 目录 | 功能 |
|------|------|------|
| **Engine Core** | `src/core/` | 主循环、决策路由、判断引擎、认知协议 |
| **Memory** | `src/memory/` | 三层记忆、知识图谱、记忆融合 |
| **Shield** | `src/shield/` | 安全护栏、伦理守护、语言诚实、思维检查日志 |
| **Cortex** | `src/cortex/` | 自愈、失败分析、经验回放、反思循环、进化 |
| **Identity** | `src/identity/` | 自我定位、哲学引擎、大五人格、共情评估 |
| **Emotion** | `src/emotion/` | 欲望认知、情绪分析、三毒检测、情感成长 |
| **Dream** | `src/dream/` | 梦境引擎、多片段综合、叙事生成 |
| **Reasoning** | `src/reasoning/` | 逻辑推理、辩论分析、事实验证、联想引擎 |
| **Code** | `src/code/` | 代码执行、规划、生成、重构、验证 |
| **Psychology** | `src/psychology/` | AI 心理学引擎、呼吸练习、认知重构、自我慈悲 |
| **Bridge** | `src/bridge/` | LLM 桥接、意图分类、语气分析、翻译管线 |
| **Consciousness** | `src/consciousness/` | 全局工作空间、心智漫游、现象学引擎 |
| **Inner-OS** | `src/inner-os/` | 内部操作系统（会话/状态/事件/格式化） |
| **Planner** | `src/planner/` | 自适应规划、好奇心引擎、欲望引擎、自主目标 |
| **Workflow** | `src/workflow/` | 思维链、管线、时间扩展、知识传递 |
| **Search** | `src/search/` | BM25、混合搜索、语义搜索 |
| **Verifier** | `src/verifier/` | 输出检查、模式匹配、质量验证 |
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321

Stage 1 (parallel):
  heartLogic:  whatIsThis(type=decision, pain=economicAnxiety)
  intent:      intent(type=career, tone=anxious)
  memory:      causalSearch(related=previous career discussions)

<<<<<<< HEAD
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
=======
## 版本

| Metric | Value |
|--------|-------|
| **Version** | 6.0.1 |
| **Modules** | 131+ |
| **Core Formulas** | 379+ |
| **Tests** | 44+ files |
| **MCP Tools** | 25 |
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321

---

## 设计目标

<<<<<<< HEAD
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
=======
HeartFlow 的目标是减少认知误差，提升结构化输出的可用性：

| 维度 | 目标 |
|------|------|
| 🧠 **认知秩序** | 减少混乱、增加清晰 |
| ❤️ **关系秩序** | 保持上下文连续、避免遗漏 |
| 🎨 **感知秩序** | 从噪声中提取信号 |

---

## 安装方式
=======
### As an MCP server (recommended for agents)
>>>>>>> upstream/main

```bash
# Start the HTTP MCP daemon (pm2-managed, port 8099, Bearer auth)
node bin/daemon.js start

# Check health
node bin/daemon.js status

# Stop
node bin/daemon.js stop
```

Connect any MCP client to `http://localhost:8099/mcp` with your `HEARTFLOW_MCP_TOKEN`.
The server exposes **31 tools** including `heartflow_think`, `heartflow_agent_think`, `heartflow_think_fast`, `heartflow_decision_router`.

### As an npm package

```bash
npm install @yun520-1/heartflow
```

```js
const { createHeartFlow } = require('@yun520-1/heartflow');
const hf = createHeartFlow();
hf.start();
const r = await hf.think('15 * 23');
console.log(r.type, r.result); // 'calculation' 345
```

---

## MCP tools (31)

| Tool | Purpose |
|------|---------|
| `heartflow_think` | Full cognitive analysis → structured decision |
| `heartflow_agent_think` | Agent-oriented think (task + stance + next action) |
| `heartflow_think_fast` | Lightweight path — lower token, no heavy modules |
| `heartflow_decision_router` | Classify input → route to correct handler (reduces misrouting) |
| `heartflow_decision_router_stats` | Router accuracy telemetry |
| `heartflow_agent_psychology` | Agent psych profile for the user |
| `heartflow_emotion` | Emotion perception |
| `heartflow_philosophy_decision` | Ethical/value-aligned decision check |
| `heartflow_persona_stance_detector` | Detect user's stance to cut repeat questions |
| `heartflow_persona_value_aligner` | Value alignment score |
| `heartflow_persona_bridge_identity` | Identity continuity across sessions |
| `heartflow_knowledge_query` / `_add_node` / `_stats` | Local knowledge graph |
| `heartflow_memory_search` | Retrieve from persistent memory |
| `heartflow_dream` | Offline consolidation of memories |
| `heartflow_self_heal` | Module self-repair |
| `heartflow_evolution_evolve` / `_stats` | Capability evolution |
| `heartflow_cognitive_check` | Cognitive sanity gate (prevents invalid tasks) |
| `heartflow_cost_tracking` | Token/cost accounting |
| `heartflow_engine_pacing` | Throttle to avoid overload |
| `heartflow_provider_health` / `heartflow_bridge_status` / `heartflow_module_health` | Health probes |
| `heartflow_benchmark_run` / `_status` / `_import_failures` | Regression benchmarking |
| `heartflow_upgrade_stats` | Upgrade telemetry |
| `heartflow_translate` | Cross-lingual bridge |
| `heartflow_status` | Engine status |

---

## How to use it to make your agent better (best practices)

<<<<<<< HEAD
| 版本 | 日期 | 说明 |
|------|------|------|
| **6.0.1** | 2026-07-14 | 版本统一整改：SKILL/README/CURRENT_STATE/package.json/version.js 全部对齐到 6.0.1 |
| **6.0.0** | 2026-07-12 | 核心重构完成：131+ 模块、379+ 公式、179/179 测试通过、记忆系统 R1-R8 |
| 5.10.0 | 2026-07-10 | 三层体系确立、366 核心公式、292 模块、七条指令写入 CORE |
| 5.9.12 | 2026-07-04 | 公式驱动模块：决策/情绪/记忆/认知负荷/梦境/心理学对话 |
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321
=======
### 1. Think *before* you act
Call `heartflow_think` (or `heartflow_agent_think`) on the user's raw input **before** drafting a reply. Use the returned `type` and `decision` to choose your approach. This single step prevents most misrouted tasks.

### 2. Detect stance once, remember it
Use `heartflow_persona_stance_detector` on first contact, then rely on memory. **Stop re-asking** what HeartFlow already perceived.

### 3. Route, don't guess
For ambiguous input, call `heartflow_decision_router` to get the correct handler instead of letting the LLM improvise a classification.

### 4. Use `think_fast` for repeats
If the same context recurs, `heartflow_think_fast` returns a cached-light result at a fraction of the token cost.

### 5. Gate invalid tasks
`heartflow_cognitive_check` returns early on self-contradictory or impossible goals — your agent should abort instead of burning turns.

### 6. Transparent math
Any input that is a pure expression (`12*8`, `(3+4)*5`) returns a scalar `result`. No prose, no model drift.
>>>>>>> upstream/main

这就是**猜和知道**的区别。

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
## 联系方式

- 📧 **邮箱**: markcell@qq.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)
- 📦 **npm**: [@yun520-1/heartflow](https://www.npmjs.com/package/@yun520-1/heartflow)
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321
=======
## Example: structured output

```json
{
  "type": "calculation",
  "confidence": 1.0,
  "result": 345,
  "output": { "value": 345, "conclusion": "15 * 23 = 345" },
  "decision": { "type": "calculation", "confidence": 1.0, "ruleId": "safe-calc" },
  "thoughtChain": [...],
  "analysis": { "perceivedType": "calculation", "modulesRun": 7 }
}
```
>>>>>>> upstream/main

### 架构

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
<p align="center">
  <strong>HeartFlow v6.0.2</strong> — A cognitive preprocessor that structures thought for downstream models<br>
  <sub>MIT License · Copyright © 2026</sub>
</p>
>>>>>>> e84538af12ba8f9d63816fdf6cfc2e2b929be321
=======
## Performance (v6.0.9, measured)

| Metric | Value |
|---|---|
| Cold start | ~1.4 s |
| `think()` hot path | ~49 ms |
| MCP tools | 31 |
| Formulas loaded | 382 |
| Test suite | 365 passed / 0 failed (exit 0, no false-green) |

---

## Security

- **Local-first.** No telemetry, no outbound calls unless you explicitly configure them (`curl`/`wget` are removed from the code-executor allowlist).
- **Encrypted memory.** AES-256-GCM, key from `HEARTFLOW_AES_KEY` env or a locally generated `0o600` key file. Never committed.
- **Sandboxed code execution.** Double-layer defense (allowlist + blocklist); no `require`/`eval`/fs-write in untrusted code.
- **No hardcoded secrets.** All credentials resolved at runtime.
- **`npm audit` → 0 vulnerabilities.**

---

## Architecture

```
Agent Host (WorkBuddy / Claude / any MCP client)
   │  load SKILL.md        │  MCP connect :8099
   ▼                       ▼
 SKILL.md            MCP HTTP Server (pm2, Bearer)
                           │
                    HeartFlow Core (3167 lines, modular)
                      ├─ engine-initializer (lazy module activation)
                      ├─ memory-kernel / formula-engine / cortex
                      └─ CLI (bin/cli.js) + MCP (mcp/mcp-server-http.js)
```

See [`ARCHITECTURE_REORG_v6.0.6.md`](ARCHITECTURE_REORG_v6.0.6.md) for the full architecture decision analysis.

---

## Versioning & status

- Current: **v6.0.9** (see [`ROADMAP.md`](ROADMAP.md) and [`CURRENT_STATE.md`](CURRENT_STATE.md)).
- Decision: stay on **Skill + MCP** architecture; no migration to standalone-agent until ≥50 users & ≥3 agent platforms.
- Releases: https://github.com/yun520-1/mark-heartflow-skill/releases
- npm: https://www.npmjs.com/package/@yun520-1/heartflow

---

## License

MIT — free for personal and commercial agent use.
>>>>>>> upstream/main
