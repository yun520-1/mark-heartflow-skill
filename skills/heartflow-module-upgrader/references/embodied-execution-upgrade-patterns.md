# Embodied Execution Engine 升级模式

## 适用模块特征

这类模块负责**将认知计划映射为实际动作执行**，是「思考」到「行动」的桥梁。典型特征：

- 有一个 `executionMapping(plan, context)` 方法
- 内部有 `simulateExecution()` 或类似模拟方法返回硬编码 mock 数据
- 协调多个执行器（agent/executor），但实际只返回预设结果
- 无真实错误处理/重试/超时机制
- 常见名称：`embodied-core`、`action-executor`、`behavior-executor`

## 典型功能缺失清单

### 1. 状态枚举

```javascript
const ExecutionStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled'
};
```

### 2. 错误分类系统

```javascript
const ErrorCategory = {
  INPUT_ERROR: 'input_error',
  EXECUTION_ERROR: 'execution_error',
  TIMEOUT_ERROR: 'timeout_error',
  DEPENDENCY_ERROR: 'dependency_error',
  RESOURCE_ERROR: 'resource_error',
  LOGIC_ERROR: 'logic_error',
  UNKNOWN_ERROR: 'unknown_error'
};
```

**classifyError() 实现要点**：
- 使用 `error.constructor.name`（如 SyntaxError/TypeError/ReferenceError）优先于消息匹配
- 中文关键词也要覆盖（超时、不存在、依赖、无效、参数）
- 系统错误码（EACCES/EADDRINUSE/ENOSPC）映射到 resource_error
- recoverable 标记决定是否重试

### 3. 重试策略选择

```javascript
const RetryStrategy = {
  NONE: 'none',           // 不重试
  IMMEDIATE: 'immediate',  // 立即重试
  BACKOFF: 'backoff',      // 指数退避重试
  ALTERNATE: 'alternate'   // 换执行器重试
};
```

| 错误类别 | 策略 | 重试次数 | 说明 |
|---------|------|---------|------|
| timeout_error | backoff | 2 | 500ms→1000ms 退避 |
| dependency_error | backoff | 3 | 1000ms→2000ms→4000ms |
| input_error | immediate | 1 | 立即重试1次 |
| execution_error | alternate | 2 | 换执行器重试 |
| resource_error | none | 0 | 不可恢复 |
| logic_error | none | 0 | 不可恢复 |

### 4. 真实执行引擎（替换 simulateExecution）

核心方法链：
```
_executeStepWithRetry(step, context, attempt)
  → _executeSingleStep(step, context, startTime, timeout)
    → _executeAgent(action, context)
      → _defaultExecute(action, context)  // 当执行器未实现 execute 时
```

**默认执行逻辑**（各步骤类型的独立实现）：

- **observe**: 从 `context.sensors` 收集实际数据 + 工作记忆摘要
- **analyze**: 分析先前执行结果，计算置信度，生成建议
- **plan**: 基于目标和上下文生成计划
- **decide**: 基于数据或保守默认值做决策
- **execute**: 执行具体任务
- **reflect**: 反思执行历史，检测失败步骤/震荡，生成改进建议
- **adapt**: 生成自适应调整

### 5. 依赖检查

```javascript
_checkDependencies(step, execution) {
  for (const depIndex of step.dependsOn) {
    const depStep = execution.steps.find(s => s.stepIndex === depIndex);
    if (!depStep || depStep.status 为 失败/超时/跳过) return false;
  }
  return true;
}
```

### 6. 震荡检测

两种模式：
- **连续失败**：最近 N 步中失败数 ≥ 阈值（默认 2/3）
- **结果回退**：交替成功/失败模式（1→0→1）

检测到震荡后：
1. 记录震荡日志（带时间戳和计划ID）
2. 清理超过窗口期（60秒）的旧记录
3. 超过最大震荡次数（3次）触发 `oscillationCritical` 标记

### 7. 适应计划生成

```javascript
adaptPlan(plan, failedStep) {
  // 根据错误类型选择适应策略
  if (超时错误) → 延长预估时间（最多2倍上限2min）
  if (资源错误) → 跳过该步骤
  else → 插入 adapt 步骤后重试
}
```

### 8. 整体执行状态计算

```javascript
_computeOverallStatus(execution):
  all_success      → 全部成功
  partial_skip     → 部分跳过
  partial_success  → 成功多于失败
  mostly_failed    → 失败多于成功
  empty            → 无步骤
```

### 9. 可配置参数

```javascript
this.config = {
  maxRetries: 3,
  defaultTimeout: 30000,
  maxOscillationCount: 3,
  oscillationWindowMs: 60000
};
```

## 升级示例（embodied-core.js）

原始文件（~9KB）：所有 `_executeStepWithRetry` → `simulateExecution` 返回硬编码 mock 数据

升级后（~29KB）：
- `ExecutionStatus` 枚举（7种状态）
- `ErrorCategory` 枚举（7种错误）+ `classifyError()` 错误分类引擎
- `RetryStrategy` 枚举（4种策略）+ `selectRetryStrategy()` 策略选择器
- `_executeStepWithRetry()` 带重试的递归执行器
- `_executeSingleStep()` 超时监控+执行器调度
- `_executeAgent()` 代理调用（支持注册执行器）
- `_defaultExecute()` 7种步骤类型的独立实现
- `_checkDependencies()` 依赖检查
- `_detectOscillation()` 震荡检测
- `adaptPlan()` 适应计划生成（3种错误模式）
- `_computeOverallStatus()` 执行状态汇总
- `getExecutionSummary()` 执行历史查询

## 关键陷阱

### 构造函数初始化顺序
```javascript
// ❌ 错误：_executeAgent 在构造函数中被调用时 this._xxx 尚未定义
constructor() {
  this._initializeExecutors(); // 内部使用 this.executors
  this.executors = {};         // 在初始化方法之后定义！
}

// ✅ 正确
constructor() {
  this.executors = {};         // 先定义
  this._initializeExecutors(); // 再调用
}
```

### success 字段重复
`_defaultExecute()` 的 `case 'execute'` 分支容易不小心包含两个 `success: true` 属性。JavaScript 会取最后一个，但这是冗余代码。

### 超时同步等待（Node.js 事件循环）
在同步代码中实现指数退避时，使用 `while (Date.now() < waitUntil)` busy-wait 是故意为之（保持同步执行）。如果模块需要异步重试，应改为 `setTimeout` + async/await。

### 低置信度触发不必要的适应
observe 步骤在没有传感器时返回 confidence: 0.4，会触发 `_checkAdaptationNeed`。这是有意行为——它告诉调用者观察质量不足。但如果每次执行都触发，可以调整 observe 的默认置信度或降低 adaptation 阈值。
