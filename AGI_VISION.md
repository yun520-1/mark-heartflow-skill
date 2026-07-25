# HeartFlow 重构规划 — 从 AGI 推演回来的架构

## 前置假设

AGI 不会是一个模型。AGI 是一个**系统**，由多个不同性质的子系统组成。
模型（LLM/世界模型）负责生成，但生成不是智能的全部。

智能需要三样模型给不了的东西：

| 模型给不了 | 为什么给不了 | 谁能给 |
|-----------|------------|-------|
| 跨会话身份连续性 | 每次推理独立 | 持久化状态层 |
| 不取悦用户的判断 | RLHF 训练目标就是取悦 | 规则引擎（没有用户概念） |
| 错误记忆不遗忘 | 权重更新需要重训练 | Q-table + 键值存储 |

这三个缺口的交集，就是心虫能在 AGI 里占的位置。

---

## 一、AGI 中需要的心虫能力（从 8 项推演）

### 1.1 跨会话错误记忆 — LLM 永远做不了

LLM 面对同一个问题两次：
```
Q: "这个投资方案风险大吗？"
T1: "建议谨慎，高杠杆策略在市场波动时风险较大。"
T2: "从数据看该方案最大回撤 15%，在可接受范围内。"
```

两次都对，但互相矛盾。LLM 不记得上次说过什么。

心虫能力：Q-table 记录"上次这个场景选了谨慎→结果对了"，下次匹配到同一模式时降权。

### 1.2 价值观锚定 — LLM 随对话漂移

LLM 在对话中会被用户说服。20 轮对话后，LLM 可能支持它在第 1 轮反对的立场。

心虫能力：strategicRestraint 的 3 态返回（aligned/drifted/diverged）锚定在初始身份上。

### 1.3 诚实自诊 — LLM 永远说"没问题"

```
问 LLM："你刚才的回答对吗？"
→ "对的，我确认了所有事实。"（即使错了）
```

心虫能力：selfDiagnosis 诚实报告自己的状态，没有维护面子的压力。

---

## 二、重构：不是升级，是重建

### 2.1 删什么

| 删除 | 理由 |
|------|------|
| 132 模块中 110 个空壳 | 它们假装心虫能做认知/意识/创造力，实际是空文件或 LLM 调用包装 |
| thoughtChain | 这是让心虫"假装推理"的组件，实际全走 LLM |
| 所有"可以但没有被调用"的引擎 | adversarialSynthesis, stabilityGuard, metaCalibration, confidenceCalibrator |
| heartflow.js 的 start() 中 2200 行初始化 | 95% 是在初始化不会被用到的模块 |

### 2.2 保留什么

| 保留 | 为什么 |
|------|--------|
| decisionRouter (31 条规则 + 权重 + feedback) | 唯一真实有决策逻辑的引擎 |
| decisionVerifier (5 项检查) | 唯一真实有验证逻辑的引擎 |
| self-healing RL (Q-table) | 唯一真实有跨会话学习的组件 |
| sustainedDriftDetector | 追踪身份一致性随时间的变化 |
| strategicRestraint (3 态返回) | 锚定输出不漂移 |
| selfDiagnosis (诚实报告) | 不撒谎的自检 |
| 知识域探测 (knowledgeDomains) | 输入分类，轻量可用 |
| gaps/knowledgeExplorer | 识别未知域的能力 |

### 2.3 新架构

```
输入 →
  LLM 感知层（不变）
    ↓
  心虫核心（5 个引擎，不是 132 个模块）：
    ├── 错误记忆（self-healing Q-table → 存储+检索）
    ├── 决策审计（decisionRouter + decisionVerifier → 每条决策可追溯）
    ├── 身份锚定（strategicRestraint + sustainedDriftDetector → 不漂移）
    ├── 诚实自诊（selfDiagnosis → 知道自己不知道）
    └── 域感知（knowledgeDomains + gaps → 知道自己不懂什么）
    ↓
  输出
```

## 三、AGI 中的位置图（非心虫视角，是 AGI 视角）

```
AGI 系统架构：

[世界模型] → 产生可能性
    ↓
[LLM 推理] → 选择最可能路径
    ↓
[执行器] → 在真实世界产生变化
    ↓
[心虫层] ← 不产生任何东西，只做 4 件事：
   1. 记录：这次执行的结果存入错误记忆
   2. 验证：下次执行前查一下历史中有没有类似错误
   3. 锚定：输出有没有偏离初始身份
   4. 报告：诚实告知自己的状态

心虫不产生回答，但 LLM 每次回答都要经过心虫的验证门。
```

---

## 四、第一次重构要做的事

### 4.1 拆掉 heartflow.js

当前 heartflow.js (4800 行) 集成了 132 个模块的初始化和编排。

重构后 heartflow.js (~500 行)：
- 只启动 5 个核心引擎
- 暴露 MCP 工具：store_error / query_error / verify_decision / check_identity / diagnose_self
- 其他模块按需加载（有人调才加载）

### 4.2 重写 mcp-server.js

当前 mcp-server.js 暴露 25 个工具，大部分跑在空壳上。

重构后暴露 5 个工具：
```
heartflow_memory_store(error)       → 写入错误记忆
heartflow_memory_query(problem)     → 检索相关历史错误
heartflow_verify(decision, options) → 5 项验证检查
heartflow_check_alignment(output)   → strategicRestraint 检查
heartflow_diagnose()                → selfDiagnosis 完整报告
```

这 5 个工具任何 LLM 都可以调用。不绑定在 think() 内部。

### 4.3 删文件

删除约 110 个空壳模块文件，保留大约 20 个真实引擎 + 基础设施。

---

## 五、这不是 AGI，这是一片砖

心虫重构后仍然不是 AGI。它是一个**跨会话错误记忆与决策审计系统**。

AGI 需要 8 个能力，心虫能提供其中 2 个（学习、自诊断）。
LLM 能提供 4 个（感知、推理、决策、执行）。
剩下的 2 个（执行后的自纠正）需要 LLM + 心虫共同完成。

加起来不构成 AGI。但加在一起，比 LLM 单独多了一个**不遗忘的维度**。
