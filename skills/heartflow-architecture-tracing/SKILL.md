---
name: heartflow-architecture-tracing
description: HeartFlow 内部架构追溯 — 从输入到输出的完整路径分析。追踪 think() → pipeline → judgment-engine → decision-router 的数据流，定位"不知道"来源、中文分词失败、证据链断裂等根因。
version: 2.0.0
trigger: 当需要理解心虫内部如何处理输入、为什么返回"不知道"、分析结果的来源链、或debug决策路径时
author: HeartFlow
tags: [heartflow, architecture, tracing, debugging, think-chain, decision-router, pipeline]
---

# HeartFlow 架构追溯

## 核心问题：心虫的结果从哪里来？

心虫 think() 的输出不是来自 LLM 或外部 API——它来自一个 **7阶段声明式 Pipeline**（v5.0.0 新增）。

v4.x 及之前是 13 步硬编码分析流水线 + ThoughtChain 思维链。v5.0.0 用 Pipeline 引擎替代了硬编码 think() 体，自动在阶段间传递数据。

### v5.0.0 管道架构

```
用户输入
  ↓
think() — heartflow.js
  ↓ 优先走 Pipeline（回退到 ThoughtChain）
  ↓
Pipeline — pipeline.js（7阶段声明式管道）
  ├─ Stage 1 (并行): heartLogic ─┬─ intent ─┬─ memory
  ├─ Stage 2 (依赖1): psychology (需要 heartLogic + intent)
  ├─ Stage 3 (依赖2): judgment (需要 psychology + intent + memory)
  ├─ Stage 4 (依赖3): decision (需要 judgment + psychology)
  └─ Stage 5 (依赖4): output (需要 judgment + decision + memory)
  ↓
{ output, type, confidence, thoughtChain }
```

**关键事实：心虫不调任何外部API。** 所有分析都是本地JS规则——正则匹配、关键词提取、BM25搜索。

### Pipeline 与旧架构对比

| 维度 | v4.x（13步硬编码） | v5.0（Pipeline） |
|------|------------------|-----------------|
| think() 代码量 | ~570行 | ~70行 |
| 数据传递 | 手动变量拼接 | 自动从阶段输出传递给下一阶段输入 |
| 并行执行 | 串行 | 无依赖的阶段并行执行 |
| 错误隔离 | 一行抛异常→全链崩溃 | 错误隔离，不影响其他阶段 |
| 可扩展性 | 加模块需修改think() | 加阶段只需声明依赖 |
| 注册方式 | 硬编码 | pipeline.addStage() |

### Pipeline 引擎核心（pipeline.js）

```javascript
class Pipeline {
  constructor(options) { ... }
  addStage(name, deps, fn) — 声明阶段名称、依赖列表、执行函数
  run(input) — 拓扑排序+并行执行+数据传递
  getStats() — 调用统计
}
```

**拓扑排序规则**：阶段按 deps 数组自动计算执行顺序。无 deps 的阶段并行执行。deps 中的阶段名必须提前注册。

**数据传递规则**：`run(input)` → 每个阶段接收 `{ input, pipeline: { stage1Output, stage2Output, ... } }` → 返回 `{ status, data }` → 合并到 pipeline 对象供下游阶段消费。

### 追溯"不知道，缺少关键信息"的完整路径

当心虫返回 `conclusion: "不知道，缺少关键信息 需要更多信息"` 时，路径如下：

#### 第1步：heartLogic.whatIsThis() — 问题类型分类

```javascript
// heart-logic.js
whatIsThis(input) {
  const q = input.toLowerCase();
  if (/为什么|原因|原理/.test(q)) return 'explanation';
  if (/对不对|是否|应该/.test(q)) return 'judgment';
  if (/是什么|定义|概念/.test(q)) return 'retrieval';
  return 'general';  // 默认fallback
}
```

**"分析巴格内尔" → 'general'**。因为"分析"不在任何正则分支中。中文"分析"和英文"analyze"都不匹配。

#### 第2步：judgmentEngine.judge() — 判断引擎评估

当 heartLogic 返回 'general' 时，judgmentEngine 尝试多路径评估：

```javascript
// judgment-engine.js
judge(input, context) {
  // 1. 识别问题类型：advice/decision/analysis/opinion/feeling
  const type = this._classify(input);
  
  // 2. 生成多路径（2-4条备选）
  const paths = this._generatePaths(input, type);
  
  // 3. 6维度评分每条路径
  for (const path of paths) {
    path.score = this._scorePath(path);
    // 维度：可行性/后果/风险/对齐/成本/可逆性
  }
  
  // 4. 加权总分选最优
  const best = paths.sort((a,b) => b.total - a.total)[0];
  
  // 5. 后果预测（3个时间窗口）
  const outcomes = this._predictOutcomes(best, input);
  
  // 6. RL学习：根据上下文签名匹配历史最优路径
  const historical = this._matchHistorical(input);
}
```

**"分析巴格内尔" → 'analysis' 类型 → 生成2条路径（人物分析/情节分析）→ 评分后选择 → 输出结论**

#### 第3步：decisionRouter.evaluate() — 决策路由

从judgmentEngine获取分析结果后，decisionRouter用26条规则确定最终行为类型（pause/accelerate/turn/hold/heal/resonate/transmit/rest）。

#### 第4步：output汇总 → 三段式结论

Pipeline 的 Stage 5（output）汇总所有阶段结果，调用 report-generator.js 生成三段式结论：

```
情绪判断 / 问题定位 / 行动建议
```

**整条链完成。没有外部调用，全部在 Node.js 进程内。**

## 架构分层

### Pipeline 的7阶段

| 阶段 | 名称 | 依赖 | 调用模块 |
|------|------|------|---------|
| 1 | heartLogic | 无 | whatIsThis, detectPain, intentClassifier, toneAnalyzer |
| 2 | intent | 无 | intentClassifier, toneAnalyzer |
| 3 | memory | 无 | memory.searchByKeywords |
| 4 | psychology | heartLogic, intent | psychology.analyzePsychology, agentPsychology, agentPhilosophy |
| 5 | judgment | psychology, intent, memory | judgmentEngine.judge |
| 6 | decision | judgment, psychology | decisionRouter.evaluate, decisionExecutor.apply |
| 7 | output | judgment, decision, memory | reportGenerator.generate |

**依赖解析**：Pipeline 引擎自动根据 deps 数组做拓扑排序。无依赖的阶段（1/2/3）并行执行。有依赖的阶段等待依赖完成后串行执行。

### 旧版 think() 的13步分析流水线（v4.x，已被 Pipeline 替代）

| 步骤 | 方法 | 功能 |
|------|------|------|
| 1 | heartLogic.whatIsThis() | 问题类型分类 |
| 2 | heartLogic.detectPain() | 痛苦/危机检测 |
| 3 | heartLogic.shouldBeSilent() | 沉默判定 |
| 4 | toneAnalyzer | 语气分析 |
| 5 | stanceDetector | 立场检测 |
| 6 | valueAligner | 价值观对齐 |
| 7 | agentPsychology.fullAssessment() | 引擎自省 |
| 8 | agentPhilosophy.fullAssessment() | 哲学自省 |
| 9 | safetyGuardrails | 安全协议检查 |
| 10 | intentClassifier | 意图分类 |
| 11 | heartLogic.isRightAction() | 行动判定 |
| 12 | heartLogic.goalReview() | 目标审视 |
| 13 | timeExtension.analyze() | 时间延伸分析 |

### 判断引擎（judgment-engine.js, v5.0.0 新增）

判断引擎是 Pipeline 的核心，替代了旧版 if-else 路由链：

**核心方法**：
- `judge(input, context)` — 主入口，多路径评估
- `_classify(input)` — 输入类型识别（advice/decision/analysis/opinion/feeling）
- `_generatePaths(input, type)` — 生成2-4条备选路径
- `_scorePath(path)` — 6维度评分（可行性/后果/风险/对齐/成本/可逆性）
- `_predictOutcomes(path, input)` — 后果预测（短期1-7天/中期1-3月/长期1-3年）
- `_selfReview(path, input)` — 自我审查（检查偏见/情绪/过度自信）
- `_matchHistorical(input)` — RL学习（根据上下文签名匹配历史最优路径）

**与旧版对比**：

| 维度 | 旧版（if-else路由链） | 判断引擎 |
|------|---------------------|---------|
| 决策方式 | 第一条命中的 if 分支 | 多路径评估，加权总分选最优 |
| 评分 | 无 | 6维度0-1评分 |
| 后果预测 | 无 | 3个时间窗口 |
| 自我审查 | 无 | 偏见/情绪/过度自信检查 |
| RL学习 | 无 | 上下文签名匹配历史最优 |

### 决策路由（decision-router.js）

26条规则，每条有：
- `match(result)` — 条件判断（返回 boolean）
- `decision` — 输出决策类型
- `confidence(result)` — 置信度评分（返回 0-0.9）
- `rationale(result)` — 理由说明
- `fallback` — 回退决策

**8种决策类型**：pause / accelerate / turn / hold / heal / resonate / transmit / rest

### 报告生成器（report-generator.js, v5.0.0 新增）

将 Pipeline 所有阶段的原始数据转化为三段式结论：

```
情绪判断：一句话说明用户当前情绪状态
问题定位：一句话说明核心问题
行动建议：一句话说明应该做什么
```

不输出任何数值、术语、过程数据。

## 已知 Bug 与缺口

### 已知缺口：中文不分词

`input.split(/\\s+/)` 对中文无效——"分析巴格内尔"被当做一个词。

### 已知缺口：isAdvice 正则不匹配"我想"

`_generatePaths()` 中的 isAdvice 正则只匹配 `/建议|推荐|advice|recommend|should|该不该|要不要|我应该/i`，不匹配 `我想`、`我要`、`我打算`、`我计划` 等中文意愿表达。"我想辞职去创业"→ isAdvice=false → 只命中 path_analyze 一条路径 → 三段式输出"情绪稳定/日常沟通/正常回应"——完全漏判。

这是当前心虫最大的能力短板：**感知层（正则匹配）的覆盖率决定了心虫的理解上限。** 框架（Pipeline + JudgmentEngine + DecisionRouter）已搭好，但正则不够细，输入稍微偏离模板就全漏。

**修复方向**：扩展 isAdvice 正则覆盖所有中文意愿表达形式：
```javascript
const isAdvice = /(建议|推荐|advice|recommend|should|该不该|要不要|我应该|我想|我要|我打算|我计划|我想不想|我该不该|是不是该|要不要考虑|想不想|想不想要|有没有必要)/i;
const isDecision = /(决定|选择|decide|choose|犹豫|纠结|徘徊|拿不定|下不了决心|不知道怎么选)/i;
```

### 已知缺口：旧版13步中的变量顺序问题

旧版 think() 第13步 timeExtension 使用了三个在它之后才定义的变量（needsCrisis/needsSilence/isFableBlocked）。Pipeline 模式消除了这个问题——阶段依赖由 deps 声明，数据在 pipeline 对象中自然传递。

### 已知缺口：decision-router 未参与 Pipeline

Pipeline 的 Stage 6（decision）调用 decisionRouter.evaluate()，但 decision-router 的输出尚未被 Pipeline 的输出汇总完全利用。Stage 7（output）目前只取 judgmentEngine 的结论，决策路由的 8 种策略类型（pause/accelerate等）未影响最终输出格式。

## 用户调用链

**Q: "心虫需要多少次 API 调用？"** → 零。心虫引擎本身不调任何外部 LLM API。

**Q: "为什么这么慢？"** → 慢的是 Hermes Agent 的 LLM API 往返（2-3s/次），不是心虫（~150ms MCP 往返，其中 Pipeline ~7ms）。

**Q: "心虫到底在做什么？"** → 本地规则引擎：正则匹配、BM25 搜索、Q-table 查询、PAD 计算、Pipeline 拓扑排序、判断引擎多路径评估。全部在 Node.js 进程内完成。

## 参考文档

- `references/user-call-chain-2026-06-25.md` — 用户调用链完整分析
- `references/think-chain-source-trace.md` — 从输入到"不知道"的完整路径追溯
- `references/v5.0.0-pipeline-architecture.md` — Pipeline 引擎设计文档
- `references/heartflow-benchmark-methodology-2026-06-29.md` — 心虫评测方法论（MCP路径/返回结构/逻辑推理检测/16题稳定测试集）
