# Temporal Planner 升级模式

## 概述

Temporal Planner 类负责**多时间尺度的分层规划**，协调反应层（1分钟内）、战术层（1小时-1天）和战略层（1周-1月）的行动。典型特征：

- 核心方法：`handleReactive()` / `handleTactical()` / `handleStrategic()` / `harmonizePlans()`
- 有一个 Graph-of-Thoughts `planGoT()` 方法声明
- 有文件持久化（strategicFile / tacticalFile / stateFile）
- 但各层逻辑往往只有骨架，缺少真实的判断/决策/协调能力

## 典型功能缺失清单

### 1. 反应层：单条件 → 多信号融合
**问题**：`handleReactive()` 只检查 1-2 个简单条件（负面情绪/长输入），缺少真实反应系统应有的多信号融合能力。

**升级方案**：
- 定义 **REACTIVE_SIGNAL 枚举**：NEGATIVE_EMOTION / LONG_INPUT / REPEATED_INPUT / RAPID_CONTEXT_SWITCH / IDLE_TIMEOUT / HIGH_FREQUENCY / UNCERTAINTY / NORMAL
- 记录交互时间戳（`_recordInteraction()`），仅保留最近 5 分钟
- 高频检测：同一用户 N 条/分钟（默认 5）
- 快速上下文切换检测：连续 3 次主题变化
- 空闲超时检测：超过 N 秒无交互（默认 120s）
- 不确定性检测：输入 < 10 字符且无情绪
- **信号融合**：按优先级排序，取前 N 个（默认 3），生成 fused_reactive 决策

```javascript
// 信号融合核心逻辑
handleReactive(context) {
  const signals = [];
  // 独立检测每个信号...
  signals.sort((a, b) => b.priority - a.priority);
  const fused = signals.slice(0, this.config.reactive.maxReactiveActions);
  if (fused.length === 0) return { type: REACTIVE_SIGNAL.NORMAL, ... };
  return {
    type: 'fused_reactive',
    priority: fused[0].priority,
    signals: fused,
    signalCount: fused.length,
    action: fused[0].action
  };
}
```

### 2. 战术层：无过期/饱和度管理
**问题**：`handleTactical()` 直接返回活跃计划，不过期、不检查优先级饱和度。

**升级方案**：
- **过期清除**：`_pruneStaleTacticalPlans()` — 超过 N 小时（默认 24）无更新的计划标记为 `stale`
- **停滞检测**：`_detectStalledPlans()` — 连续 3 次进度更新无变化（阈值 < 0.1）
- **饱和度检测**：`_checkSaturation()` — 高优先级（>= 7）占比 > 80% 且活跃计划 >= 3 时触发
- **降级**：`_degradeNonCriticalPlans()` — 饱和度下非关键计划优先级 × 0.5
- 计划保留上限 20 条，保留已完成的历史

### 3. 战略层：无衰减/无重平衡
**问题**：`handleStrategic()` 只做简单过滤，目标进度不会随时间衰减，不会自动重平衡。

**升级方案**：
- **进度衰减模型**：`_applyDecay()` — 每日衰减 5%（`daysSinceUpdate × decayRate`），模拟"目标被自然侵蚀"
- **重平衡检测**：`_rebalanceIfNeeded()` — 进度低于阈值（默认 30%）时标记 `rebalanceSuggested`
- **进度历史**：`progressHistory` 数组（最多 10 条），每次更新自动追加

### 4. 三层协调：单冲突 → 4 类冲突检测
**问题**：`harmonizePlans()` 只有方向对齐一种冲突类型，缺少资源/优先级/时序冲突。

**升级方案**：
定义 **CONFLICT_TYPE 枚举**：
- `MISALIGNMENT` — 战术计划未对齐任何活跃战略目标
- `RESOURCE` — 同一战略目标下活跃计划超过上限（默认 5）
- `PRIORITY` — 两个计划优先级相同且指向同一战略目标
- `TIMING_OVERLAP` — 两个计划时间范围相同
- `DUPLICATE_GOAL` — 重复目标

每种冲突有自动 resolution 策略（tactical_adjusted / defer_low_priority / adjust_one_priority_down / sequential_execution）。

### 5. Graph-of-Thoughts：静态模板 → 真实图遍历
**问题**：`planGoT()` 声明了 START/THOUGHT/REFLECTION/BACKTRACK/MERGE/END 六种节点类型，但实际只生成 START → THOUGHT → (END)，REFLECTION/BACKTRACK/MERGE 从未被使用。

**升级方案**：
定义 **GOT_NODE_TYPE 枚举**：START / THOUGHT / REFLECTION / BACKTRACK / MERGE / END

**第一层**：从 START 出发生成 3-5 条思考路径，使用模板：
- `分解`：分解目标为子步骤（`_decomposeGoal()`）
- `类比`：寻找类似场景的解决方案
- `回溯`：回顾历史失败原因
- `假设`：如果资源无限的最大方案，然后缩减
- `逆向`：从目标反向推导关键里程碑

**第二层**：每条路径生成子步骤（`getSubSteps()`），每 2 步后插入 **REFLECTION 节点**：
```javascript
if (d % 2 === 1) {
  // 插入 REFLECTION 节点
}
```

**第三层**：路径末端判断是否需要 **BACKTRACK**（子步骤 >= 4 且 40% 概率触发），生成备选分支。

**第四层**：检查 **MERGE 机会** — 相同深度且标签前缀相同的两个节点自动合并。

**第五层**：所有叶节点连接到 **END 节点**。

```javascript
// GoT 五层遍历
planGoT(goal, options) {
  const nodes = [{ id: 'start', type: 'START', ... }];
  const edges = [];
  // 1) 从 START 生成路径
  // 2) 每条路径生成子步骤 + REFLECTION
  // 3) 检查 BACKTRACK
  // 4) 检查 MERGE 候选
  // 5) 叶节点 → END
  return { nodes, edges, nodeCount, edgeCount, pathCount, 
           hasBacktrack, hasMerge, hasReflection, graphviz };
}
```

### 6. 配置系统
新增 `updateConfig(overrides)` 方法，使用深度合并覆盖默认配置。

**可配置参数**：
```javascript
DEFAULT_CONFIG = {
  reactive: {
    longInputThreshold: 200,
    highFrequencyThreshold: 5,
    rapidSwitchThreshold: 3,
    idleTimeout: 120000,
    maxReactiveActions: 3
  },
  tactical: {
    maxActivePlans: 5,
    stalenessHours: 24,
    progressStallThreshold: 0.1
  },
  strategic: {
    maxActiveGoals: 3,
    decayRate: 0.05,
    progressRebalanceThreshold: 0.3
  },
  got: {
    maxPaths: 5, maxDepth: 7, maxNodes: 30,
    backtrackPenalty: 0.3, mergeSimilarity: 0.7
  },
  saturation: {
    priorityThreshold: 7, saturationRatio: 0.8,
    degradationFactor: 0.5
  }
}
```

### 7. 简报增强
`getStrategicBriefing()` 输出新增字段：
- `longTermDecayed` — 长期目标是否被衰减
- `longTermRebalanceSuggested` — 是否建议重平衡
- `stalledPlanCount` / `degradedPlanCount` — 停滞/降级计划数
- `isSaturated` / `saturationWarning` — 饱和度警告

## 关键陷阱

### 构造函数防御
`loadPlans()` 可能因文件不存在导致 `this.strategic` 为 undefined。所有使用 `this.strategic.goals` 的方法（包括 `handleStrategic()`、`_applyDecay()`、`_rebalanceIfNeeded()`、`updateStrategicProgress()`）必须加守卫：

```javascript
if (!this.strategic || !this.strategic.goals) return;
```

同样，`this.tactical.plans` 也需要守卫。

### 模块级导出
除了主类，还应导出所有枚举供外部使用：

```javascript
module.exports = { TemporalPlanner, TIME_SCALE, CONFLICT_TYPE, GOT_NODE_TYPE, REACTIVE_SIGNAL };
```

### GoT 节点上限
`maxNodes` 默认 30，防止无限增长。当节点数接近上限时，跳过 BACKTRACK 和 MERGE 的额外节点生成。

### 相似度合并
`_findMergeCandidates()` 使用简单分组（相同深度 + 相同标签前缀），不适合复杂场景。真实场景下可升级为 Jaccard 相似度或嵌入向量相似度。
