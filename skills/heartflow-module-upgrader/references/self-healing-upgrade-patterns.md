# 自愈引擎升级模式 (self-healing.js)

## 适用场景

模块是自愈/恢复引擎，负责错误记录、重试决策和修复策略学习。典型特征：
- 已具备 normalizeError/record/recover 等基本方法
- 仅区分 transient vs non-transient（二元判断）
- 无错误分类体系、无震荡检测、无熔断保护、无自诊断、参数固定

## 可添加的子系统

### 1. 错误严重性分类体系 (ErrorClassification)

```javascript
const ErrorSeverity = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', INFO: 'info' };
const ErrorCategory = { NETWORK: 'network', TIMEOUT: 'timeout', RATE_LIMIT: 'rate_limit', AUTH: 'auth', VALIDATION: 'validation', RESOURCE: 'resource', SYNTAX: 'syntax', DEPENDENCY: 'dependency', STATE: 'state', UNKNOWN: 'unknown' };
```

规则表：pattern → { category, severity, description }
- 每条规则含正则 + 严重性 + 中文描述
- 严重性打分：critical=90, high=65, medium=40, low=20, info=5
- 修正因子：transient -15, auth +10, resource +5

### 2. 震荡检测 (Oscillation Detection)

```javascript
this._oscillationCounter = new Map(); // pattern -> { count, firstTs, lastTs }
this._oscillationThreshold = 5;       // 连续N次触发
this._oscillationWindowMs = 60000;    // 1分钟窗口
```

- 同类型错误在窗口内连续出现 N 次 → 标记震荡
- 发出 `oscillation_detected` 事件
- 窗口超时自动重置计数

### 3. 电路断路器 (Circuit Breaker)

```javascript
this._circuitBreaker = { tripped: false, trippedAt: null, cooldownMs: 30000, pattern: null };
```

- 震荡自动跳闸，阻止后续重试
- 冷却期后自动复位（或手动 resetCircuitBreaker()）
- 发出 `circuit_breaker_tripped/reset` 事件
- shouldRetry() 先查断路器

### 4. 自我诊断 (Self-Diagnosis)

```javascript
diagnose() {
  return {
    status: 'healthy' | 'warning' | 'degraded',
    circuitBreaker: { tripped, pattern, remainingMs },
    failureWindow: { size, capacity, utilizationPercent, healthy },
    oscillation: { activePatterns, details },
    rl: { healthy, qTableSize, historySize },
    adaptation: { currentMaxRetries, currentBackoffMs, totalAdaptations },
    severity: { distribution, highSeverityCount, healthy },
    recommendations: [...]
  };
}
```

### 5. 自适应调参 (Adaptive Tuning)

- 震荡时：maxRetries +2, backoffMs ×3
- 高严重性错误（score≥65）：maxRetries -1
- 网络/超时类错误：backoffMs ×2
- 保留调参历史（最近50条）
- getAdaptationHistory(limit) 查看

## 关键实现细节

### 保持向后兼容
- normalizeError() 返回值新增 category/severity/severityScore/description 字段
- record() 返回值新增 category/severity/severityScore/oscillating/oscillationCount
- recover() 返回值新增 classification/oscillation/circuitBreaker/adaptation
- summarize() 返回值新增 severityDistribution/circuitBreaker

### 分类规则匹配
```javascript
for (const rule of ERROR_CLASSIFICATION_RULES) {
  if (rule.pattern.test(normalized.message) || 
      (normalized.code && rule.pattern.test(String(normalized.code)))) {
    return { category: rule.category, severity: rule.severity, ... };
  }
}
```
- 同时匹配 message 和 code
- 无匹配时回退：transient→LOW(15分), 否则→MEDIUM(35分)

### 导出策略
导出主类 + 所有枚举 + 分类函数，供其他模块独立使用：
```javascript
module.exports = { SelfHealing, ErrorSeverity, ErrorCategory, classifyError };
```

## 验证清单
- [ ] node --check 语法通过
- [ ] 分类函数测试：timeout→medium/25分, OOM→critical/95分
- [ ] 震荡检测测试：N次同类型错误后标记震荡
- [ ] 断路器测试：震荡后 shouldRetry=false
- [ ] 自适应调参测试：maxRetries/backoffMs 动态变化
- [ ] 诊断报告测试：status/oscillation/recommendations 完整
- [ ] 导入兼容性：依赖模块 require 不报错
