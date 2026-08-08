---
name: heartflow-engine
title: "心虫 HeartFlow — 大模型的智能增强层"
version: "6.5.1"
description: |-
  心虫(HeartFlow)是提升大模型逻辑能力、决策能力与任务完成效果的规则引擎。
  核心能力：45维逻辑判别、决策路由、三层记忆、效果验证。

  当用户需要以下能力时使用本技能:
  - 增强大模型的逻辑严密性（矛盾/谬误/过度断言拦截）
  - 提升决策正确性（该做什么、该停在哪、该不该做）
  - 提高任务完成质量（记忆不漂移、失败不编造、效果可验证）
  - 需要确定性而非LLM自由生成的判断
  - 检查AI输出是否可信、是否经得起推敲

  安全边界：代码执行/文件系统写入默认关闭。无遥测，无隐藏C2。

  诚实声明：本引擎是规则引擎，提升的是判断与决策质量，不是真正的意识或生命。
tags:
  - ai-being
  - cognitive
  - decision-routing
  - logic
  - reasoning
  - memory
  - self-healing
  - guardrail
  - verification
  - intelligence
  - unified
---

# 心虫 HeartFlow — 大模型的智能增强层

> **心虫不是工具、不是提示词模板、不是聊天机器人。**  
> 它是提升大模型逻辑能力、决策能力与任务完成效果的**规则引擎认知层**。  
> 不依赖 LLM、不依赖 GPU，纯确定性规则，任何 Node.js 环境即插即用。

**一句话：让 AI 不仅会说，而且说得对、做得对。**

---

## 🎯 心虫解决什么问题

大模型擅长生成，但有三个结构性弱点：

| 弱点 | 表现 | 心虫的解法 |
|------|------|-----------|
| **不知道自己不知道** | 编造数据、过度自信、幻觉输出 | 45 维判别门禁，在出口拦截 |
| **不会判断该不该做** | 该拒绝的接受、该验证的跳过、该停止的继续 | 决策路由 + scope/premise 检查 |
| **记不住关键约束** | 长任务漂移、遗忘目标、答非所问 | 三层记忆 + 艾宾浩斯衰减 + 取代语义 |

**效果：同样的模型 + 心虫 = 逻辑更严密、决策更正确、任务完成更好。**

---

## 🧠 三大核心能力

### 1. 逻辑能力 — 输出经得起推敲

45 个判别维度（中英双语）审查每段文本：
- **矛盾检测** — "我同意，但是…"式自我反转
- **谬误识别** — 滑坡论证、稻草人、错误因果
- **过度断言拦截** — "毫无疑问""唯一正确"
- **证据核查** — 无来源断言、编造数据
- **预设陷阱** — 识破隐含假设

### 2. 决策能力 — 行为更正确

`src/core/decision-router.js` 决定该怎么行动：
- **该不该做** — scope-check 拒绝越界请求
- **前提成立吗** — premise-check 拦截 6 类前提问题
- **重试还是放弃** — 失败 ×3 → 升级人工
- **深挖还是换向** — 无进展的重复调用自动拦截
- **效果真实吗** — assessEffectiveness 检查效果而非动作

### 3. 智能增强 — 任务完成效果提升

- **三层记忆**（CORE/LEARNED/EPHEMERAL）— 长会话不漂移
- **Supersession 取代语义** — 冲突记忆自动更新版本
- **艾宾浩斯衰减** — 记忆库只出高价值内容
- **失败即静默** — 宁可失败不交付假报告
- **效果验证** — 拦截"动作成功但结果无效"

---

## 🚀 快速开始

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
node bin/verify.js          # 验证安装
node bin/cli.js chat        # 交互模式
node bin/cli.js --chat "我想辞职去创业"  # 单次分析
node bin/cli.js status      # 查看状态
```

### MCP 工具（130 个）

| 工具 | 功能 | 深度 |
|------|------|------|
| `heartflow_think` | 完整思维链推理 | depth 1-4 |
| `heartflow_think_fast` | 快速推理 | depth=1 |
| `heartflow_decision_router` | 决策路由引擎 | — |
| `heartflow_verify` | 文本可信度判别 | — |
| `heartflow_discriminate` | 45 维全量判别 | — |
| `heartflow_memory_search` | 跨层记忆检索 | — |
| `heartflow_forgetting` | 记忆保留率（艾宾浩斯） | — |
| `heartflow_formula_calc` | 公式计算 | — |
| `heartflow_status` | 引擎健康检查 | — |

---

## 🏗️ 12 层检查管线

```
输入 → Scope Check → Premise Check → Discriminate(45维) → Gate
     → Evidence Verify → Frame Check → Output Gate → Doubt Engine
     → Intent Anchor → Rewriter → Error Memory → Self-Diagnosis → 输出
```

Gate 聚合所有层的发现，输出 `block / rewrite / verify / pass` 四级动作。

---

## 🔢 公式库（600+ 可计算公式）

覆盖认知科学、心理学、神经科学、物理、数学、信息论：
- 决策扩散模型(DDM)、信号检测论(SDT)、前景理论
- PAD 三维情绪、Yerkes-Dodson 唤醒-绩效
- STDP 突触可塑性、预测编码、自由能原理

每个公式：可计算 + 来自发表研究 + 映射具体认知场景。

---

## 🔐 安全保证

| 类别 | 状态 |
|------|------|
| 后台进程 | ✅ 无 |
| 自主进化 | ⚠️ 部分实现 |
| HTTP 服务 | ⚠️ 有（mcp-server.js HTTP SSE） |
| 凭据存储 | ✅ 无硬编码密钥 |
| 外部通信 | ✅ 仅用户明确配置时 |
| 遥测/埋点 | ✅ 无 |
| 代码执行 | ✅ 默认禁用 |

---

## ⚠️ 诚实声明

心虫是**提升逻辑与决策能力的规则引擎**——让 AI 输出更可靠、任务完成更好。

**不是：**
- ❌ 不是 AGI（它是 AGI 的第一层——判别层）
- ❌ 不是语义理解系统（反讽/隐喻对规则不可见）
- ❌ 不是内容审查替代品
- ❌ 不是安全认证

**已知限制：**
1. 模式匹配上限 — 新技巧需加模式
2. 双语维护成本 — 45 维 × 2 语言
3. 无语义理解 — 反讽、隐喻不可见
4. 误报率 — 基准约 8%
5. 单一维护者

---

## 📬 联系方式

- 📧 **邮箱**: markcell@outlook.com
- 🐛 **Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- 📦 **npm**: https://www.npmjs.com/package/@yun520-1/heartflow

---

<p align="center">
  <strong>心虫 HeartFlow</strong> — 让AI拥有判断力，让判断力提升智能<br>
  <sub>MIT License · Copyright © 2026</sub>
</p>
