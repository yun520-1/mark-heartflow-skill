# retry-util.js 升级记录 v2.0.45

## 升级背景

**日期**: 2026-06-04
**升级者**: Hermes Agent (HeartFlow 自主升级 Cron)
**源版本**: 2.0.44
**目标版本**: 2.0.45
**模块**: `src/core/utils/retry-util.js`

**选择理由**: retry-util.js (2636B) 是 src/core/ 下最小的功能不完整模块。

## 原模块功能

- 基本指数退避重试
- `isRetryable()` 检查错误码/模式
- `calculateDelay()` 简单指数退避
- 无 jitter / 无熔断器 / 无超时控制 / 无回退 / 无统计

## 升级内容（8项）

### 1. Full Jitter 防惊群（3种策略）
- `full`: delay = random(0, baseDelay) — 最佳分散效果
- `equal`: delay = baseDelay/2 + random(0, baseDelay/2) — 折中
- `decorrelated`: delay = min(maxDelay, random(baseDelay, baseDelay*3)) — 适合长退避
- 配置项: `jitterType` (默认 'full')

### 2. Circuit Breaker 熔断器
- 3状态: CLOSED → OPEN → HALF_OPEN
- 连续失败达阈值自动 OPEN，拒绝所有请求
- 超时后 HALF_OPEN 允许单个测试请求
- 配置: `circuitBreakerThreshold` (默认5), `circuitBreakerResetMs` (默认30000)

### 3. 双重超时控制
- `attemptTimeoutMs`: 单次重试超时 (默认15000ms)
- `totalTimeoutMs`: 所有重试总耗时上限 (默认60000ms)
- 实现: `_executeWithTimeout()` 用 Promise.race + setTimeout

### 4. Fallback 回退函数
- `context.fallback`: 不可重试错误时自动尝试
- 回退成功 → `FALLBACK_SUCCESS` / 失败 → `FALLBACK_FAILED`
- `_tryFallback()` 内部包装

### 5. RetryStats 统计追踪
- 环形缓冲区记录最近1000次调用
- 聚合统计: 成功率/平均延迟/熔断次数/回退使用率
- `getSummary()` 返回结构化统计

### 6. RetryStatus 状态枚举
8种状态: SUCCESS, FAILED, CIRCUIT_OPEN, TIMEOUT, TOTAL_TIMEOUT, NON_RETRYABLE, FALLBACK_SUCCESS, FALLBACK_FAILED

### 7. 增强错误匹配
新增模式: too many requests, service unavailable, temporary failure, socket hang up, read ECONNRESET, write EPIPE
支持 error.status / error.statusCode

### 8. 便捷方法
- `createWithConfig(config)` — 工厂方法
- `withFallback(fn, fallbackFn, config)` — 静态组合
- `quickRetry(fn, maxRetries)` — 默认配置快速重试
- `getCircuitStatus()` / `resetCircuitBreaker()`
- `getStats()` / `resetStats()`

## 升级后模块结构

```
RetryUtility (主类)
├── constructor(config)
├── executeWithRetry(fn, context)  — 主入口，含 circuit breaker + timeout + jitter + fallback
├── _executeWithTimeout(fn, timeoutMs)  — 单次超时包装
├── _tryFallback(fallbackFn, originalError, attempts, totalDelay, startTime)
├── _recordCall(result, attempts, totalDelay)
├── _applyJitter(baseDelay, attempt)  — 3种 jitter 策略
├── isRetryable(error)
├── calculateDelay(attempt, initialDelay, backoffFactor, maxDelay)
├── sleep(ms)
├── retryablePromise(promiseFn, config)
├── getCircuitStatus()
├── resetCircuitBreaker()
├── getStats()
├── resetStats()
├── createWithConfig(config)  (static)
├── withFallback(fn, fallbackFn, config)  (static)
└── quickRetry(fn, maxRetries)  (static)

CircuitBreaker (独立类)
├── constructor(config)
├── recordSuccess()
├── recordFailure()
├── allowRequest()
└── getStatus()

RetryStats (独立类)
├── constructor(maxEntries)
├── recordCall(callRecord)
├── getSummary()
└── _rebuildAggregates()
```

## 验证

```
node --check src/core/utils/retry-util.js  →  通过
```

## 向后兼容性

- `executeWithRetry(fn, context)` 返回值扩展了 `status` / `totalDelay` / `totalTime` 字段，原字段 `success` / `error` / `attempts` / `message` 不变
- `RETRY_CONFIG` 导出常量不变，新增字段有默认值
- 所有原有方法签名不变
