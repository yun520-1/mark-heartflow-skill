# Meta-Cognitive Engine 升级模式

## 适用场景

升级**元认知引擎类**模块——实现"评估→规划→执行→观察→调整"循环，但 `execute()` 方法为空壳/桩代码（stub）。

## 典型特征

- 有一个 `evaluate()` / `plan()` / `execute()` / `observe()` 循环
- `cycle()` 方法串联完整流程
- `execute(plan, context)` 返回硬编码 `{ success: true }` 或空结果
- 有默认策略注册表（从 JSON 文件或硬编码加载）
- 各策略之间无真正的执行差异——所有策略返回相同的结果
- 无输入验证、无参数校验、无错误分类、无振荡检测

## 标准升级清单

### 1. 状态枚举 + 错误分类

```javascript
const ExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RECOVERABLE: 'RECOVERABLE',   // 可恢复的失败（可重试）
  UNRECOVERABLE: 'UNRECOVERABLE', // 不可恢复的失败
  DEGRADED: 'DEGRADED',         // 部分成功
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
};

const ExecutionErrorCode = {
  STRATEGY_NOT_FOUND: 'STRATEGY_NOT_FOUND',
  STRATEGY_DISABLED: 'STRATEGY_DISABLED',
  PARAMETER_INVALID: 'PARAMETER_INVALID',
  PARAMETER_MISSING: 'PARAMETER_MISSING',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  DEPENDENCY_FAILURE: 'DEPENDENCY_FAILURE',
  TIMEOUT_EXCEEDED: 'TIMEOUT_EXCEEDED',
  EXECUTION_ABORTED: 'EXECUTION_ABORTED',
  OSCILLATION_DETECTED: 'OSCILLATION_DETECTED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN: 'UNKNOWN',
};
```

### 2. 错误分类函数 + 恢复建议

`classifyError(code)` 返回 `{ recoverable, severity, suggestion }`。

可恢复错误（自动重试）：
- RESOURCE_UNAVAILABLE → 等待资源可用后重试
- DEPENDENCY_FAILURE → 检查依赖模块
- TIMEOUT_EXCEEDED → 增加超时或拆分任务
- INTERNAL_ERROR → 检查上下文完整性

不可恢复错误（立即返回）：
- STRATEGY_NOT_FOUND / STRATEGY_DISABLED → 检查注册表
- PARAMETER_INVALID / PARAMETER_MISSING → 验证参数
- OSCILLATION_DETECTED → 切换到备用策略

### 3. 参数验证系统

定义策略参数模式表：

```javascript
const STRATEGY_PARAMETER_SCHEMAS = {
  flow_引导: {
    challenge_level: { type: 'number', required: true, min: 0, max: 1 },
    autonomy_support: { type: 'number', required: true, min: 0, max: 1 },
    feedback_timing: { type: 'number', required: true, min: 100, max: 30000 },
    interruption_threshold: { type: 'number', required: true, min: 0, max: 1 },
  },
};
```

`validateParameters(params, schema)` 检查：
- 必需性（required）
- 类型（type: number/string/boolean）
- 数值范围（min/max）
- 枚举值（enum）
- 返回 `{ valid, errors[] }`

### 4. 指数退避重试

```javascript
function calculateRetryDelay(attempt, config = {}) {
  const { baseDelayMs = 500, maxDelayMs = 10000, jitterFactor = 0.2, backoffFactor = 2 } = config;
  const exponential = Math.min(baseDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
  const jitter = exponential * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(1, Math.round(exponential + jitter));
}
```

### 5. 策略专用执行器

为每个策略类型创建独立的 `_executeXxx(params, context, attempt)` 方法：

- `_executeFlowGuide()` — 心流引导：基于 challenge_level 选择模式（challenge/balance/ease），边界钳位所有参数
- `_executeEmotionRegulation()` — 情绪调节：基于 empathy_level 选择深度/中度模式
- `_executeTaskDecomposition()` — 任务分解：估算复杂度、计算 chunk 数量、检查上下文有效性
- `_executeInterruptHandling()` — 中断处理：上下文保留率、优雅退出模式

**关键点**：每个执行器必须有：
- 参数边界钳位（`Math.max(min, Math.min(max, value))`）
- 资源/上下文可用性检查
- 有意义的结构化输出（不是空对象）
- 对 context 缺失时的优雅降级

### 6. 振荡检测

```javascript
class OscillationDetector {
  constructor(options = {}) {
    this._windowSize = options.windowSize || 10;
    this._threshold = options.threshold || 0.7;
    this._history = [];
  }

  record(entry) {
    // 记录并检测 success/failure 翻转率
    // 返回 { oscillating, flipRate, dominantOutcome, maxConsecutiveFailure, details }
  }
}
```

在 execute() 主循环中：
1. 每次执行后调用 `_oscillationDetector.record({ outcome, errorCode, duration })`
2. 如果检测到振荡且 `maxConsecutiveFailure >= 3`，自动查找备用策略
3. 振荡结果标记为 RECOVERABLE + OSCILLATION_DETECTED

### 7. 备用策略查找

```javascript
_findFallbackStrategy(currentKey) {
  const fallbackMap = {
    flow_引导: 'emotion_regulation',
    emotion_regulation: 'task_decomposition',
    task_decomposition: 'flow_引导',
    interrupt_handling: 'flow_引导',
  };
  // 优先映射表 → 兜底找任意其他已启用策略
}
```

### 8. 结构化执行结果

```javascript
_buildExecutionResult({ status, errorCode, reason, startTime, strategy, details = {} }) {
  const elapsed = Date.now() - startTime;
  const errorClassification = errorCode ? classifyError(errorCode) : null;
  return {
    status, strategy, reason, errorCode,
    elapsed_ms: elapsed,
    timestamp: new Date().toISOString(),
    errorClassification,  // 可恢复性 + 严重等级 + 建议
    details,
  };
}
```

## 关键陷阱

### 1. 构造函数参数传递
execute(plan, context) 被 cycle() 调用时传入的是 `plan` 对象。确保 execute 能接受 `{ strategy, parameters, reason }` 和自由格式 context。

### 2. 重试循环退出条件
当可恢复错误重试耗尽后，必须明确标记 `retryExhausted: true`。不要静默返回 SUCCESS。

### 3. 振荡检测的阈值选择
- 窗口过小（<4）：数据不足无法检测
- 阈值过高（>0.8）：只有极端振荡才触发
- 窗口过大（>20）：历史包袱重，检测延迟高
推荐：windowSize=10, threshold=0.7

### 4. 参数 schema 未定义时的行为
如果某策略没有对应的 schema，跳过参数验证而非报错：
```javascript
if (!schema) return { valid: true, errors: [] };
```

### 5. 备用策略映射必须是安全闭包
确保 `_findFallbackStrategy()` 只返回已启用（enabled: true）的策略，否则备用策略也会失败。

## 实战案例

- **meta-engine.js** (11KB → 36KB): 从空壳 execute() 升级为完整执行引擎，含 4 个策略专用执行器 + 参数验证 + 振荡检测 + 重试 + 备用策略
- 版本: v2.2.0 升级
- 新增导出: MetaEngine + ExecutionStatus + ExecutionErrorCode + OscillationDetector + validateParameters + calculateRetryDelay + classifyError
