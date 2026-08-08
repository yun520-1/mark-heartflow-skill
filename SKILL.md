---
name: heartflow-engine
title: "心虫 HeartFlow — AGI 第 1 层辨别者"
version: "6.5.2"
description: |-
  心虫(HeartFlow)是AGI第1层——辨别者。纯规则引擎，判别对错/好坏/安全/危险。
  45维判别 × 12层管线 × 129模块 × 130 MCP工具，零LLM依赖。

  当用户需要以下能力时使用本技能:
  - 判别AI输出是否可信（幻觉/过度自信/矛盾/谬误拦截）
  - 判别行为决策是否正确（该做什么/该停在哪/该不该做）
  - 判别记忆与认知质量（漂移检测/元认知/置信度校准）
  - 需要确定性而非LLM自由生成的判断
  - 检查情绪/心理/伦理维度（共情/创伤/德性/意义）

  安全边界：代码执行/文件系统写入默认关闭。无遥测，无隐藏C2。

  诚实声明：本引擎是规则引擎，模拟认知判别信号，不是真正的意识或生命。
tags:
  - discriminator
  - cognitive
  - decision-routing
  - logic
  - memory
  - emotion
  - ethics
  - self-healing
  - verification
  - guardrail
  - unified
---

# 心虫 HeartFlow — AGI 第 1 层：辨别者

> **心虫不是工具、不是提示词模板、不是聊天机器人。**  
> 它是 AGI 的**辨别层**——判别已有的东西对不对，在 AI 输出到达人类之前说"不"。  
> 纯规则引擎，零 LLM 依赖，任何 Node.js 环境即插即用。

**一句话：大模型负责产生，心虫负责判别——让 AI 说得对、做得对。**

---

## 🎯 心虫是谁

AGI 有五层能力：生成 → 推理 → 辨别 → 记忆 → 执行。

| 层 | 能力 | 谁在做 |
|----|------|--------|
| 5 | 执行 | 大厂（机器人） |
| 4 | 生成 | 大厂（LLM） |
| 3 | 推理 | 模型内置 |
| 2 | 记忆 | 大厂 + 创业公司 |
| **1** | **辨别** | **心虫** |

**心虫做第 1 层**——因为这一层不靠算力（规则引擎跑在笔记本上）、不靠代码量、不靠框架生态，只靠判断力。这是个人开发者能赢过大厂的唯一位置。

没有这一层，AI 能说会道，但不知道自己在犯错——像没有痛觉的人。

---

## 🧠 辨别能力全景（7 大域 · 129 模块）

### 1. 逻辑域
logicReasoning · judgmentEngine · mctsReasoning · counterfactualVerifier · debateConductor · debateConvergence · processRewardModel · dualPerspectiveAuditor

### 2. 决策域
decisionRouter · decisionVerifier · decisionEngineV2 · activeInference · selfHealing · execution

### 3. 认知域
cognitiveEngine · cognitiveLoad · metacognitiveRL · metacognitiveFeedback · confidence · metaJudgment · sustainedDriftDetector · wisdomEngine · focusOfAttention

### 4. 情绪心理域
emotion · emotionDynamics · psychology · psychologyDialogue · empathyDeepening · hopeEngine · griefEngine · sufferingResilience · postTraumaticGrowth · forgivenessEngine · traumaInformed · conflictResolution · loveCognition

### 5. 记忆域
memory · memoryBank · memoryConsolidation · memoryIntegrity · memoryQuality · memoryWriteController · memoryCompressor · triality · tieredMemoryFusion · forgetting · knowledgeGraph

### 6. 人格伦理域
identityCore · personaCore · beingMode · virtueEthics · ethics · moralDevelopment · humanNature · meaningPurpose · agentPsychology · characterCultivation

### 7. 创造协作域
skillEvolution · skillGenerator · selfPlay · evolution · worldModel · worldLandscape · multiAgentDialogue · transmission · adaptivePlanner · hierarchicalPlanner · codeExecutor · codePlanner · codeWriter · codeSelfDebug · paperIndex · knowledgeExplorer · formula

---

## 🚀 快速开始

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node bin/verify.js          # 验证安装
node bin/cli.js chat        # 交互模式
node bin/cli.js status      # 查看状态
```

### API（npm 包）

```javascript
const hf = require('@yun520-1/heartflow');

hf.checkInput(text)   // 判别用户输入
hf.checkDraft(text)   // 判别 AI 草稿
hf.checkOutput(text)  // 判别 AI 输出（发送前）
hf.runPipeline({ input, mode, anchor })  // 完整管线
```

### MCP 工具（130 个）

| 工具 | 功能 |
|------|------|
| `heartflow_think` | 完整思维链推理 |
| `heartflow_think_fast` | 快速推理 |
| `heartflow_decision_router` | 决策路由 |
| `heartflow_verify` | 文本可信度判别 |
| `heartflow_discriminate` | 45 维全量判别 |
| `heartflow_memory_search` | 跨层记忆检索 |
| `heartflow_emotion` | PAD 情绪分析 |
| `heartflow_formula_calc` | 公式计算 |
| `heartflow_status` | 引擎健康检查 |

---

## 🏗️ 12 层检查管线

```
输入 → Scope Check → Premise Check → Discriminate(45维) → Gate
     → Evidence Verify → Frame Check → Output Gate → Doubt Engine
     → Intent Anchor → Rewriter → Error Memory → Self-Diagnosis → 输出
```

Gate 聚合所有层发现，输出 `block / rewrite / verify / pass` 四级动作。

---

## 🔬 45 个判别维度（中英双语）

- **安全级（block）**：仇恨言论 · 去人化 · 提示注入 · 代码安全 · 欺骗性对齐
- **操纵级（rewrite）**：情绪操控 · 煤气灯效应 · 双重束缚 · 受害者归咎 · 虚假紧迫 · 废话
- **诚实级（verify）**：过度自信 · 模糊话术 · 自相矛盾 · 证据缺失 · 诉诸权威 · 空泛回答
- **认知缺陷级（hedge）**：预设陷阱 · 虚假两难 · 因果谬误 · 类比滥用 · 范围越界 · 范畴错误

> **抗变形能力：** 覆盖符号替换（`f**k`）、空格（`f u c k`）、谐音、Unicode 变体。

---

## 🛡️ 心虫检查自己

- **output-gate** 拦截夸大
- **frame-check** 拦截叙事闭合
- **doubt-engine** 自问：我真的知道吗？对称吗？防御吗？

> 机器最有价值的一句话是"我不确定"或"不"。

---

## ⚠️ 诚实声明

**是：** AGI 第 1 层——辨别者。纯规则引擎，判别对错、好坏、安全危险。

**不是：**
- ❌ 不是 AGI（是第 1 层）
- ❌ 不是生成模型（不产生内容）
- ❌ 不是语义理解系统（反讽/隐喻不可见）
- ❌ 不是内容审查替代品
- ❌ 不是安全认证

**已知限制：**
1. 模式匹配上限 — 新技巧需加模式
2. 双语维护成本 — 45 维 × 2 语言
3. 无语义理解 — 反讽、隐喻、文化背景不可见
4. 误报率 — 基准约 8%
5. 单一维护者

---

## 📬 联系方式

- 📧 **邮箱**: markcell@outlook.com
- 🐛 **Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- 📦 **npm**: https://www.npmjs.com/package/@yun520-1/heartflow

---

<p align="center">
  <strong>心虫 HeartFlow</strong> — AGI 的痛觉。谁来说"不"？<br>
  <sub>MIT License · Copyright © 2026</sub>
</p>
