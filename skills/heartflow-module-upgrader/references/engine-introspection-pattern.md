# 引擎自省模式 (Engine Introspection Pattern)

## 概述

引擎自省 = 心虫回头看自己的决策过程。不是用户反馈驱动的修复，是引擎自己检查 pipeline 质量、判断一致性、模块覆盖率、认知数据完整性、RL 学习效果。

## 核心问题

心虫跑完 pipeline 8 阶段后，它不会回头问自己：
- "我刚才的判断对不对？"
- "哪个模块没跑出数据？"
- "哪条路径评分太低？"
- "RL 表里有没有同类错误的经验？"

## 自省维度（7 个）

### 1. Pipeline 质量
检查：哪些阶段失败/慢
```javascript
const stats = pipeline.getStats();
const failedStages = stats.stages.filter(s => s.stats.failures > 0);
const slowStages = stats.stages.filter(s => s.stats.avgTime > 100);
```

### 2. 判断一致性
检查：同一 topic 前后判断是否矛盾（复用 judgment-engine 的 selfReview）
```javascript
const review = judgmentEngine.selfReview(20);
// conflicts: 同一话题方向相反的判断
// corrections: 后果预测与实际不匹配的记录
```

### 3. 模块覆盖率
检查：注册的模块中哪些从未被 pipeline 调用
```javascript
const allModules = Object.keys(this._modules || {});
const pipelineStages = pipeline.getStats().stages.map(s => s.id);
const unusedModules = allModules.filter(m => !pipelineStages.includes(m));
```

### 4. 认知数据完整性
检查：14 个认知字段哪些为空
```javascript
const emptyFields = Object.entries(cognition)
  .filter(([k, v]) => v === null || v === undefined || 
    (typeof v === 'object' && Object.keys(v).length === 0))
  .map(([k]) => k);
```

### 5. 记忆层统计
检查：CORE/LEARNED/EPHEMERAL 分布

### 6. RL 自愈学习
检查：Q-table 条目数、自愈次数

### 7. 对话历史
检查：总消息数、会话时长

## 集成方式

### 方法定义（在 heartflow.js 中）

```javascript
introspect(options = {}) {
  const findings = [];
  // ... 7 个维度的检查
  return { summary, findings, counts, timestamp, version };
}
```

### dispatch 路由注册

1. 设置 `this.heartflow = this` 让 dispatch 能找到实例
2. 在 `subsystemNames` 中加入 `'heartflow'`
3. 在 `ALLOWED_ROUTES` 中加入 `'heartflow.introspect'`

### decision-router 自动响应

dispatch 返回的结果会被 decision-router 包装为 `{ result, decision, field }`。自省发现的问题会触发相应的决策：
- 模块覆盖率不足 → `heal` 决策
- 认知字段为空 → `heal` 或 `pause` 决策
- 场域慢性失谐（H 值低）→ `heal` 决策

## 自省触发时机

| 时机 | 方式 | 说明 |
|------|------|------|
| 每次 think() 后 | 自动 | 记录 `_lastCognition` 快照 |
| 用户要求 | `hf.introspect()` | 完整自省 |
| 通过 dispatch | `hf.dispatch('heartflow.introspect')` | LLM 可调用 |
| cron 定时 | 定时任务 | 周期性自省检查 |

## 常见发现

| 发现 | 严重度 | 含义 | 修复方向 |
|------|--------|------|---------|
| pipeline 阶段失败 | high | 某个阶段崩溃 | 检查该阶段的 run() 实现 |
| 判断矛盾 | high | 同一 topic 前后方向相反 | 检查 context 提取是否准确 |
| 认知字段为空 | medium | 上游模块没跑出数据 | 检查模块的 run() 是否被正确调用 |
| 模块未调用 | low | 注册了但 pipeline 没用 | 将模块加入 pipeline 定义 |
| LEARNED 层为空 | info | 判断结果没写入记忆 | 在 output 阶段调用 memory.addLearned() |

## 关键陷阱

1. **`_lastCognition` 必须每次 think() 后更新**：在 pipeline 结果返回后立即 `this._lastCognition = cognitionSnapshot`。兼容旧版本：pipeline 没有 cognition 字段时从 ctx 构建。

2. **dispatch 返回包装**：`hf.dispatch('heartflow.introspect')` 返回 `{ result: {...}, decision: {...}, field: {...} }`，真实数据在 `result` 里。因为 decision-router 会自动评估每个 dispatch 调用的场域状态并附加决策。

3. **agentPsychology 不随输入变化**：`fullAssessment()` 返回引擎自身状态，不是对用户输入的分析。三条不同输入会得到相同的认知负荷——这是正确的，不是 bug。

4. **selfReview 依赖 outcome 记录**：judgment-engine 的 `selfReview()` 检查矛盾需要同一 topic 的判断历史，检查预测偏差需要 `recordOutcome()` 被调用过。刚启动时 `selfReview()` 返回空数组是正常的。

5. **模块覆盖率过滤**：不是所有注册的模块都需要被 pipeline 调用。记忆/搜索/工具类模块（memory, knowledge, bm25, budget, graph 等）是基础设施，不属于 pipeline 阶段。过滤时要排除这些。

## 代码结构参考

```javascript
// heartflow.js 中的完整 introspect() 实现框架
introspect(options = {}) {
  if (!this.started) return { error: 'HeartFlow not started' };
  const findings = [];
  
  // 1. pipeline 质量
  if (this.pipeline) { ... }
  
  // 2. 判断引擎自省
  if (this.judgmentEngine) {
    const review = this.judgmentEngine.selfReview(20);
    const stats = this.judgmentEngine.getStats();
  }
  
  // 3. 模块覆盖率
  const unusedModules = allModules.filter(m => !pipelineStages.includes(m) && !isInfraModule(m));
  
  // 4. 认知完整性
  if (this._lastCognition) {
    const emptyFields = Object.entries(c).filter(...);
  }
  
  // 5-7. 记忆/RL/对话统计
  
  return { summary, findings, counts, timestamp, version, _introspectVersion: '1.0.0' };
}
```
