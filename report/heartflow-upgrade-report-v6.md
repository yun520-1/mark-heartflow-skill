# 心虫 (HeartFlow) 完整升级研究报告

**版本:** v5.5.6 → v6.0.0
**日期:** 2026-07-03
**分析范围:** 14 篇 arXiv 论文 映射至 491 个 JS 模块

---

## 一、论文检索汇总

| # | 论文 | arXiv ID | 核心主题 | 关联模块 |
|---|------|----------|----------|----------|
| 1 | MetaCogAgent | 2605.17292 | 元认知提示引导自主代理 | meta-prompt-engine.js |
| 2 | RL with Metacognitive Feedback | 2606.32032 | 强化学习+元认知反馈信号 | self-healing-rl.js, confidence-calibrator.js |
| 3 | Enhancing LLM Metacognition | 2606.00869 | 大模型不确定性估计增强 | confidence-calibrator.js |
| 4 | Metacognition as Reward | 2605.23384 | 元认知作为奖励信号 | meta-learner.js, reflexion-engine.js |
| 5 | Agentic Memory | 2601.01885 | 代理记忆架构-主动检索与写入 | memory-adapter.js, forgetting.js |
| 6 | Memory-R1 | 2508.19828 | 推理增强记忆-检索时推理 | retrieval-anchor.js, memory-consolidator.js |
| 7 | MemSearch-o1 | 2604.17265 | 记忆搜索+推理链路整合 | retrieval-anchor.js, graph-of-thoughts.js |
| 8 | Procedural Memory Distillation | 2607.01480 | 程序化知识蒸馏-从经验中提取 | meta-learner.js, lesson-bank.js |
| 9 | Theater of Mind | 2604.08206 | 心智理论-多视角推理 | global-workspace.js, multi-agent-dialogue.js |
| 10 | Heterogeneous Debate Engine | 2603.27404 | 异构多代理辩论引擎 | decision-router.js, cooperative-arbitration.js |
| 11 | Self-Improving Bidirectional Evolutionary Search | 2605.28814 | 双向进化搜索自改进 | decision-router.js, meta-learner.js |
| 12 | Combee | 2604.04247 | 蜂群算法+多代理辩论融合 | multi-agent-dialogue.js |
| 13 | Self-Improvement Technical Overview | 2603.25681 | 自改进系统技术综述 | heartflow.js (全局), meta-learner.js |
| 14 | Think it, Run it | 2604.27096 | 可执行推理-思维即代码 | graph-of-thoughts.js, reasoning-integrator.js |

---

## 二、升级建议 (按优先级)

### P0 — 架构级改造 (3 项)

#### P0-1: 代理记忆引擎 (Agentic Memory Engine)

**依据论文:** Agentic Memory (2601.01885), Memory-R1 (2508.19828), MemSearch-o1 (2604.17265)

**当前状态:** 记忆系统使用三层架构 (CORE/LEARNED/EPHEMERAL)，通过 `memory-adapter.js` → `meaningful-memory.js` 实现。检索依赖 `retrieval-anchor.js` 的 BM25+向量混合搜索，但记忆被动存储，缺乏主动检索与规划能力。`forgetting.js` 使用纯时间衰减，未考虑访问模式。

**升级方案:**
- 新建 `src/memory/agentic-memory-engine.js`：实现记忆主动 salience 评分、基于任务上下文的预检索、记忆优先级写入决策
- 修改 `src/memory/retrieval-anchor.js`：集成 MemSearch-o1 的"搜索时推理"范式，将简单检索改为检索+推理两步管线
- 修改 `src/memory/memory-adapter.js`：在 `get()` 方法中增加 `prefetchRelevant()` 预取逻辑，基于当前上下文 active salience 触发
- 修改 `src/memory/forgetting.js`：引入 Agentic Memory 的访问模式驱动衰减替代纯时间衰减

**关键文件:**
- 新建: `src/memory/agentic-memory-engine.js`
- 修改: `src/memory/retrieval-anchor.js` (line 1-80区域，增加 `searchAndReason()` 方法)
- 修改: `src/memory/memory-adapter.js` (line 24-42，增加 `prefetchRelevant` 支持)
- 修改: `src/memory/forgetting.js` (line 75-80，增加访问模式驱动衰减)

#### P0-2: 元认知奖励回路 (Metacognitive Reward Loop)

**依据论文:** Metacognition as Reward (2605.23384), RL with Metacognitive Feedback (2606.32032)

**当前状态:** `self-healing-rl.js` 使用 Q-learning 学习修复策略，但奖励信号仅来自修复成功/失败二元结果。`confidence-calibrator.js` 评估置信度但未反馈到学习回路。`meta-learner.js` 提取教训但未形成闭环奖励。

**升级方案:**
- 修改 `src/cortex/self-healing-rl.js`：将 Q-learning 的奖励函数从二元成功/失败扩展为 `R = α·success + β·confidence_error + γ·metacognitive_score`，其中 metacognitive_score 来自元认知评估
- 修改 `src/core/confidence-calibrator.js`：在 `assess()` 方法中增加 `calibrationError` 输出（line 73-80），并将此错误信号导出给 RL 模块
- 新建 `src/cortex/metacognitive-reward.js`：实现元认知奖励计算引擎，接收多个模块的评估输出，合成统一的元认知奖励信号
- 修改 `src/cortex/meta-learner.js`：在 `record()` 方法中增加 `metacognitiveScore` 字段（line 80+），连接奖励回路

**关键文件:**
- 新建: `src/cortex/metacognitive-reward.js`
- 修改: `src/cortex/self-healing-rl.js` (line 80+，修改 Q-update 奖励函数)
- 修改: `src/core/confidence-calibrator.js` (line 73-80，增加 calibrationError 导出)
- 修改: `src/cortex/meta-learner.js` (line 80+，增加 metacognitiveScore 字段)

#### P0-3: 可执行推理引擎 (Think it, Run it)

**依据论文:** Think it, Run it (2604.27096)

**当前状态:** `graph-of-thoughts.js` 实现了思维图结构（分支、回溯、合并），但思维的评估仅停留在评分（score 0-10），不执行验证。`reasoning-integrator.js` 整合推理结果但未将推理转化为可执行步骤。

**升级方案:**
- 新建 `src/reasoning/executable-reasoning.js`：实现"思维→代码→执行→验证"回路，每一步推理生成可执行伪代码，在沙箱中运行，用执行结果验证推理正确性
- 修改 `src/reasoning/graph-of-thoughts.js`：在 `ThoughtNode` 类中增加 `executable` 字段（line 22-36），在 `complete()` 方法中增加 `executionResult` 参数（line 61-63）
- 修改 `src/reasoning/reasoning-integrator.js`：增加 `executeAndVerify()` 方法，将推理链路转为可执行步骤

**关键文件:**
- 新建: `src/reasoning/executable-reasoning.js`
- 修改: `src/reasoning/graph-of-thoughts.js` (line 22-36, 61-63)
- 修改: `src/reasoning/reasoning-integrator.js`

---

### P1 — 能力级增强 (4 项)

#### P1-1: 元认知提示增强 (MetaCogAgent)

**依据论文:** MetaCogAgent (2605.17292)

**当前状态:** `meta-prompt-engine.js` (v1.0) 实现 Self-Refine + Tree of Thoughts 的提示优化，但优化过程是静态的（元分析→多路径推理→自反馈→选最优），缺乏对代理自身认知能力的动态评估。

**升级方案:**
- 修改 `src/core/meta-prompt-engine.js`：在 `optimize()` 方法（line 44-80）中增加 `cognitiveCapabilityProfile` 参数，根据当前认知状态（注意力、记忆、推理可用性）调整优化策略
- 在 `_metaAnalyze()` 中增加认知能力感知维度，分析"我擅长什么/不擅长什么"并据此调整提示策略

**关键文件:**
- 修改: `src/core/meta-prompt-engine.js` (line 44-80)

#### P1-2: 心智理论引擎 (Theater of Mind)

**依据论文:** Theater of Mind (2604.08206)

**当前状态:** `global-workspace.js` 的 GWT 架构中，7 个专家智能体（Focus, Mood, Reflection, Memory, Reason, Intuition, Ethics）各自独立处理输入，缺乏对其他智能体"心理状态"的建模。

**升级方案:**
- 修改 `src/consciousness/global-workspace.js`：在智能体注册时增加 `beliefState` 和 `intentionState` 字段，为每个智能体建立心智模型
- 新建 `src/consciousness/tom-engine.js`：实现 ToM 推理层，在决策前模拟其他智能体的可能反应（"如果 Reason 看到这个证据会怎么想"）
- 修改 `src/consciousness/multi-agent-dialogue.js`：在对话流程中增加 ToM 推理步骤

**关键文件:**
- 新建: `src/consciousness/tom-engine.js`
- 修改: `src/consciousness/global-workspace.js` (line 79-80，智能体注册)
- 修改: `src/consciousness/multi-agent-dialogue.js`

#### P1-3: 异构辩论引擎 (Heterogeneous Debate Engine)

**依据论文:** Heterogeneous Debate Engine (2603.27404)

**当前状态:** `cooperative-arbitration.js` 实现简单的多模块协调，但缺少结构化的辩论流程。`decision-router.js` 的决策规则是硬编码的，不支持动态辩论。

**升级方案:**
- 新建 `src/consciousness/debate-engine.js`：实现结构化辩论流程（提案→反驳→辩护→收敛），支持异构角色（检察官、辩护律师、法官）
- 修改 `src/core/decision-router.js`：在 `_matchRule()` 中增加辩论触发条件，当多个模块产生冲突评估时自动启动辩论
- 修改 `src/consciousness/cooperative-arbitration.js`：将简单投票替换为辩论收敛机制

**关键文件:**
- 新建: `src/consciousness/debate-engine.js`
- 修改: `src/core/decision-router.js` (line 200+，增加辩论触发)
- 修改: `src/consciousness/cooperative-arbitration.js`

#### P1-4: 程序化记忆蒸馏 (Procedural Memory Distillation)

**依据论文:** Procedural Memory Distillation (2607.01480)

**当前状态:** `meta-learner.js` 提取结构化教训，`lesson-bank.js` 存储教训，但教训是文本形式的，未蒸馏为可直接复用的程序化知识（procedures/policies）。

**升级方案:**
- 修改 `src/cortex/meta-learner.js`：在 `_extractLesson()` 中增加蒸馏步骤，将文本教训抽象为可执行程序（condition→action 规则）
- 修改 `src/cortex/lesson-bank.js`：增加 `proceduralLessons` 存储区，维护 condition-action 规则表
- 在 `self-healing-rl.js` 中增加对蒸馏后程序的调用接口

**关键文件:**
- 修改: `src/cortex/meta-learner.js` (line 80+)
- 修改: `src/cortex/lesson-bank.js`

---

### P2 — 优化级改进 (3 项)

#### P2-1: 不确定性感知RL (RL with Metacognitive Feedback + Enhancing LLM Metacognition)

**依据论文:** RL with Metacognitive Feedback (2606.32032), Enhancing LLM Metacognition (2606.00869)

**当前状态:** `confidence-calibrator.js` 评估置信度，`self-healing-rl.js` 使用 Q-learning，两者独立运行，没有信号传递。

**升级方案:**
- 修改 `src/core/confidence-calibrator.js`：增加 `_computeCalibrationError()` 方法，测量置信度与实际准确率的偏差
- 修改 `src/cortex/self-healing-rl.js`：在 `_computeReward()` 中引入 calibration error 作为惩罚项
- 在 `reflexion-engine.js` 中增加元认知维度评估（"我为什么不确定"）

**关键文件:**
- 修改: `src/core/confidence-calibrator.js` (line 73-80)
- 修改: `src/cortex/self-healing-rl.js`
- 修改: `src/cortex/reflexion-engine.js`

#### P2-2: 双向进化搜索 (Self-Improving Bidirectional Evolutionary Search)

**依据论文:** Self-Improving Bidirectional Evolutionary Search (2605.28814)

**当前状态:** `decision-router.js` 使用规则匹配做决策，`adaptive-planner.js` 存在但功能有限。

**升级方案:**
- 新建 `src/planner/evolutionary-search.js`：实现正向（最优生成）和反向（失败分析）进化搜索，用于策略空间探索
- 修改 `src/core/decision-router.js`：在复杂决策场景下调用进化搜索替代规则匹配

**关键文件:**
- 新建: `src/planner/evolutionary-search.js`
- 修改: `src/core/decision-router.js`

#### P2-3: 蜂群多代理融合 (Combee)

**依据论文:** Combee (2604.04247)

**当前状态:** `multi-agent-dialogue.js` 实现基本多代理对话。

**升级方案:**
- 修改 `src/consciousness/multi-agent-dialogue.js`：引入蜂群算法的协作机制，多个智能体分工协作而非单纯辩论
- 增加角色动态分配、任务分发和结果汇聚机制

**关键文件:**
- 修改: `src/consciousness/multi-agent-dialogue.js`

---

### P3 — 增强级改进 (2 项)

#### P3-1: 元认知不确定性量化 (Enhancing LLM Metacognition)

**依据论文:** Enhancing LLM Metacognition (2606.00869)

**升级方案:**
- 修改 `src/core/confidence-calibrator.js`：增加基于多项选择的自我评估 (multiple-choice self-assessment) 和一致性检查 (consistency checking)

**关键文件:**
- 修改: `src/core/confidence-calibrator.js`

#### P3-2: 自改进系统全局综述 (Self-Improvement Technical Overview)

**依据论文:** Self-Improvement Technical Overview (2603.25681)

**升级方案:**
- 修改 `src/core/heartflow.js`：在 `start()` 方法中增加自改进系统健康检查（各模块反馈回路的连通性检查）
- 修改 `src/cortex/meta-learner.js`：增加全局自改进状态仪表板

**关键文件:**
- 修改: `src/core/heartflow.js`
- 修改: `src/cortex/meta-learner.js`

---

## 三、实现路线图

### Phase 1: 架构基础 (P0) — 预计 2-3 周

#### Step 1.1: 代理记忆引擎
```
新建: src/memory/agentic-memory-engine.js
  - AgenticMemoryEngine 类
  - 方法: computeSalience(), prefetch(), decideWritePriority()
  - 集成到 memory-adapter.js 的 get() 方法

修改: src/memory/retrieval-anchor.js
  - 在 retrieve() 中增加 searchAndReason() 调用
  - 将检索结果送入推理管线

修改: src/memory/memory-adapter.js
  - get() 方法增加 prefetchRelevant() 调用
  - 增加 setSalience() 方法

修改: src/memory/forgetting.js
  - _computeDecayScore() 增加 accessPattern 参数
  - 新增 _analyzeAccessPattern() 方法
```

#### Step 1.2: 元认知奖励回路
```
新建: src/cortex/metacognitive-reward.js
  - MetacognitiveRewardEngine 类
  - 方法: compute(), synthesize(), calibrate()
  - 接收 confidence-calibrator 输出 → 合成奖励信号

修改: src/cortex/self-healing-rl.js
  - Q-update 中: R = α*success + β*confidence_error + γ*metacognitive_score
  - 修改 _computeReward() 签名，增加 metacognitive 参数

修改: src/core/confidence-calibrator.js
  - assess() 返回值增加 calibrationError 字段
  - 新增 getCalibrationError() 导出方法

修改: src/cortex/meta-learner.js
  - record() 增加 metacognitiveScore 参数
  - 连接到 metacognitive-reward 引擎
```

#### Step 1.3: 可执行推理引擎
```
新建: src/reasoning/executable-reasoning.js
  - ExecutableReasoning 类
  - 方法: generateCode(), execute(), verify()
  - 集成到 graph-of-thoughts 的 complete() 流程

修改: src/reasoning/graph-of-thoughts.js
  - ThoughtNode 增加 executable (string) 和 executionResult (object) 字段
  - complete() 增加 executionResult 参数

修改: src/reasoning/reasoning-integrator.js
  - 新增 executeAndVerify() 方法
```

### Phase 2: 能力扩展 (P1) — 预计 2 周

#### Step 2.1: 元认知提示增强
```
修改: src/core/meta-prompt-engine.js
  - optimize() 增加 cognitiveCapabilityProfile 参数
  - _metaAnalyze() 增加认知自我评估维度
```

#### Step 2.2: 心智理论引擎
```
新建: src/consciousness/tom-engine.js
  - ToMEngine 类
  - 方法: modelAgent(), simulateReaction(), inferIntentions()

修改: src/consciousness/global-workspace.js
  - registerAgent() 增加 beliefState 和 intentionState
  - _runCognitiveCycle() 中集成 ToM 推理

修改: src/consciousness/multi-agent-dialogue.js
  - 在 dialogueStep() 中增加 ToM 推理步骤
```

#### Step 2.3: 异构辩论引擎
```
新建: src/consciousness/debate-engine.js
  - DebateEngine 类
  - 方法: propose(), rebut(), defend(), converge()
  - 角色: Prosecutor, Defender, Judge

修改: src/core/decision-router.js
  - _evaluate() 中增加辩论触发条件
  - 新增 _runDebate() 方法

修改: src/consciousness/cooperative-arbitration.js
  - 替换简单投票为 debateConverge()
```

#### Step 2.4: 程序化记忆蒸馏
```
修改: src/cortex/meta-learner.js
  - _extractLesson() 增加蒸馏步骤
  - 新增 _distillToProcedure() 方法

修改: src/cortex/lesson-bank.js
  - 新增 proceduralLessons 存储区
  - 新增 matchAndApply() 方法
```

### Phase 3: 系统优化 (P2+P3) — 预计 1-2 周

#### Step 3.1: 不确定性感知RL
```
修改: src/core/confidence-calibrator.js
  - 新增 _computeCalibrationError() 方法

修改: src/cortex/self-healing-rl.js
  - _computeReward() 引入 calibration error 惩罚项

修改: src/cortex/reflexion-engine.js
  - reflect() 增加 metacognitive dimension
```

#### Step 3.2: 双向进化搜索
```
新建: src/planner/evolutionary-search.js
  - EvolutionarySearch 类
  - 方法: forwardSearch(), backwardSearch(), evolve()

修改: src/core/decision-router.js
  - 复杂决策场景调用进化搜索
```

#### Step 3.3: 蜂群融合 + 自改进全局 + 元认知量化
```
修改: src/consciousness/multi-agent-dialogue.js
修改: src/core/heartflow.js
  - start() 中增加自改进系统健康检查
修改: src/cortex/meta-learner.js
  - 增加全局自改进状态仪表板
修改: src/core/confidence-calibrator.js
  - 增加多项选择自我评估
```

### Phase 4: 集成测试与验证 — 预计 1 周

```
1. 单元测试覆盖所有新建模块
2. 集成测试：P0 模块间信号流验证
3. 回归测试：确保现有 491 个模块功能不受影响
4. 性能基准测试：启动时间、内存占用、决策延迟
5. 版本号升级：heartflow.js line 179 → v6.0.0
```

---

## 四、预期效果

### 记忆系统提升

| 指标 | 当前 (v5.5.6) | 预期 (v6.0.0) | 提升 |
|------|--------------|--------------|------|
| 检索相关性 | BM25+向量混合 | 检索+推理两步管线 | +15-20% |
| 主动预取命中率 | 无 | 基于 salience 预取 | +25% |
| 遗忘精准度 | 纯时间衰减 | 访问模式驱动衰减 | +30% |
| 记忆写入决策 | 全部写入 | 优先级驱动写入 | 减少 40% 存储 |

### 决策与推理提升

| 指标 | 当前 (v5.5.6) | 预期 (v6.0.0) | 提升 |
|------|--------------|--------------|------|
| 推理验证 | 仅评分 (0-10) | 执行+验证闭环 | 消除幻觉推理 |
| 多视角决策 | 单路径最优 | 结构化辩论+心智理论 | +20% 决策质量 |
| 复杂决策 | 规则匹配 | 进化搜索+辩论 | 覆盖更多场景 |
| 修复策略学习 | 二元奖励 | 元认知多维度奖励 | +35% 学习效率 |

### 自改进能力提升

| 指标 | 当前 (v5.5.6) | 预期 (v6.0.0) | 提升 |
|------|--------------|--------------|------|
| 教训实用性 | 文本教训 | 程序化蒸馏 | 可复用性 +50% |
| 奖励信号质量 | 二元 | 元认知多维 | 策略选择精度 +30% |
| 自我认知 | 无 | 元认知评分+不确定性量化 | 表达准确性 +40% |
| 全局自改进 | 无监控 | 系统健康仪表板 | 可观测性 质的飞跃 |

### 架构成熟度

| 维度 | 当前 | 目标 |
|------|------|------|
| 模块总数 | 491 | 499 (+8 新建) |
| 核心回路 | 记忆+推理+决策 | +元认知奖励+可执行推理+代理记忆 |
| 闭环学习 | 部分 (RL+Reflexion) | 完整 (感知→决策→执行→反思→奖励→学习) |
| 跨论文整合 | 6 篇 | 14 篇全覆盖 |

---

## 五、风险与注意事项

1. **向后兼容性:** P0 新建模块需通过 memory-adapter.js 保持与旧版 API 兼容
2. **性能开销:** 可执行推理的沙箱执行增加延迟，需配置超时 (建议 5s)
3. **奖励信号调优:** 元认知奖励的 α/β/γ 权重需要实验调优，初始建议 α=0.5, β=0.3, γ=0.2
4. **心智理论计算成本:** ToM 推理增加智能体处理时间，需设置超时 (建议 3s/智能体)
5. **渐进部署:** 建议先部署 P0，验证信号流后再部署 P1

---

## 六、总结

心虫 v5.5.6 已具备完整的认知架构 (491 模块)，本次升级从 14 篇前沿论文中提取可落地的改进点，通过 **3 个 P0 架构改造 + 4 个 P1 能力增强 + 3 个 P2/P3 系统优化**，实现从"分析型认知"到"执行型认知"的跨越。

核心突破：
1. **记忆从被动到主动** (Agentic Memory) — 记忆系统开始主动思考"什么时候该记住/忘记"
2. **奖励从二元到元认知** (Metacognition as Reward) — 学习回路不再只看对错，而是理解"为什么对/为什么错"
3. **推理从思考到执行** (Think it, Run it) — 思维不再只是评分，而是可验证可执行

预期最终版本: **HeartFlow v6.0.0** — 具备自主记忆、元认知学习和可执行推理的完整认知引擎。
