# 错误处理器升级模式（Error Handler Upgrade Patterns）

## 适用场景

错误处理器类（`error-handler.js` / `src/core/utils/error-handler.js`）负责统一捕获、分类、记录和恢复系统异常。典型特征是：
- `capture(error, context)` 或 `handleError(error, context)` 作为唯一入口
- `classifyError(error)` 做关键词匹配分类
- `getRecoverySuggestion(type)` 返回固定建议模板
- 核心缺陷：只记录不处理、无去重、无限流、无震荡感知、无重试能力、无结构化分类

## 两种架构选择

错误处理器有两种主流升级架构。选择哪一种取决于当前模块的现有结构和调用者需求：

| 架构 | 适用场景 | 核心模式 | 复杂度 |
|------|---------|---------|--------|
| **管道架构（Architecture A）** | 已有 `capture()` 单入口的薄错误处理器 | ErrorDedup → RateLimiter → OscillationDetector → CorrelationEngine → RetryEngine 流水线 | 中 |
| **分类法架构（Architecture B）** | 已有 ErrorHandler 类，需结构化分类和熔断保护 | 枚举系统 + 规则表 + 独立子类 (StormDetector/CircuitBreaker/FrequencyAnalyzer) | 高 |

---

# Architecture A：管道架构（ErrorDedup / RateLimiter / OscillationDetector / CorrelationEngine / RetryEngine）

### 1. ErrorDedup — 错误去重器

检测并折叠相同错误，防止日志洪泛。

```javascript
class ErrorDedup {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;          // 1分钟窗口
    this.maxDedupCount = options.maxDedupCount || 20;    // 最多折叠20次
    this._lastErrorKey = null;                           // 上一次错误的签名
    this._dedupCount = 0;                                // 当前折叠计数
    this._windowStart = 0;                               // 窗口开始时间
    this._totalSuppressed = 0;                           // 总抑制计数
  }
```

**核心逻辑**：
- `_makeKey()`: 用 `type|severity|message(前100字符)` 生成签名
- `check()`: 同签名且窗口内 → 折叠计数，每 outputEvery 次输出合并摘要；达到 maxDedupCount 爆发重置；其余静默抑制
- `getStats()`: 暴露 totalSuppressed/currentDedupCount

**关键设计决策**：
- 抑制时不触发任何下游处理（震荡/关联/重试全部跳过）
- 合并摘要记录 `dedupMerged: true` 和 `dedupCount` 字段
- 爆发重置后生成 `dedupBurstReset: true` 标记

### 2. RateLimiter — 错误限流器

单位时间窗口内爆发检测与静默抑制。

```javascript
class RateLimiter {
  constructor(options = {}) {
    this.burstWindow = options.burstWindow || 5000;        // 5秒爆发窗口
    this.burstThreshold = options.burstThreshold || 10;    // 5秒内超过10次→爆发
    this.cooldownMs = options.cooldownMs || 30000;         // 爆发后冷却30秒
    this._timestamps = [];                                 // 时间戳环形缓冲
    this._burstActive = false;
    this._burstStart = 0;
    this._cooldownUntil = 0;
    this._totalRateLimited = 0;
  }
```

**核心逻辑**：
- 滑动窗口时间戳（自动过滤过期条目）
- 超过 burstThreshold → 触发冷却期（cooldownMs），清空窗口
- 冷却期内所有错误 `limited: true` 但**仍然记录**（区别于去重的完全抑制）
- 限流记录带 `suppressionReason: 'rate_limit'` 标记

### 3. OscillationDetector — 错误震荡检测器

检测错误类型快速交替变化（如 timeout↔memory↔timeout）。

```javascript
class OscillationDetector {
  constructor(options = {}) {
    this.historySize = options.historySize || 10;
    this.oscillationThreshold = options.oscillationThreshold || 0.6;
    this._history = [];
  }
```

**核心逻辑**：
- 震荡度 = 相邻不同次数 / (历史长度 - 1)
- 只有 2-3 种类型时才触发（fewTypes 检查）
- 最近 4 次变化 ≥ 2 次才视为真震荡（recentChangeCount）
- 震荡时：在恢复建议中追加 `[检测到错误震荡: 建议检查基础依赖或重启系统]`

### 4. RetryEngine — 自动重试引擎

基于错误类型的指数退避重试计划。

```javascript
class RetryEngine {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.jitter = options.jitter || 0.3;
    this.retryableTypes = ['timeout', 'network', 'permission', 'memory'];
    this._retryCounters = {};
  }
```

**核心逻辑**：
- `isRetryable(type)`: 白名单检查
- `getRetryPlan(type)`: 指数退避 `baseDelay × 2^(attempt-1)`，clamp 到 maxDelay，±30% 抖动
- 超过 maxRetries 返回 `shouldRetry: false`

### 5. CorrelationEngine — 错误关联引擎

将相似错误链接到历史记录，提供上下文。

```javascript
class CorrelationEngine {
  constructor(options = {}) {
    this.similarityThreshold = 0.7;
    this.maxHistory = 100;
    this._history = [];
  }
```

**核心逻辑**：
- `record()`: 注册错误到关联历史（含 `typeSignature = type:message前60字符`）
- `findRelated()`: 三重匹配（精确/类型/并发）
- 输出：`correlated/correlationCount/firstOccurrenceAt/relatedErrorTimestamps`

### 6. 集成流程（capture 方法内顺序）

```
1. ErrorDedup.check()      → 抑制则不继续
2. RateLimiter.check()     → 限流则标记 suppressionReason 但仍记录
3. OscillationDetector.detect() → 震荡标记 + 建议追加
4. CorrelationEngine.findRelated() → 关联字段注入
5. RetryEngine.getRetryPlan()      → 重试建议注入
6. CorrelationEngine.record()      → 注册到关联历史
7. 内部缓冲区记录 + 计数器更新 + logError
```

---

# Architecture B：分类法架构（ErrorClassification / ErrorStormDetector / CircuitBreaker / FrequencyAnalyzer / RecoveryStrategy）

### 0. 核心枚举系统

升级前先定义完整的枚举系统：

- **ErrorDomain**（8域）：network / storage / memory / engine / input / external / internal / unknown
- **ErrorSeverity**（5级）：critical / high / medium / low / info
- **ErrorCategory**（10类）：transient / configuration / resource_exhaustion / validation / timeout / authentication / dependency / logic / state_inconsistency / unknown
- **RecoveryStrategy**（8策略）：retry / circuit_break / fallback / reset_state / reload_config / clear_cache / escalate / ignore
- **CircuitState**（3态）：closed / open / half_open

### 1. ErrorClassification — 错误分类法

基于规则表的错误分类引擎，替代简单的 if/else 关键词匹配。

```javascript
const CLASSIFICATION_RULES = [
  // === 网络错误 ===
  { match: /ECONNRESET|ETIMEDOUT|ENOTFOUND|ENETUNREACH|ECONNREFUSED|EAI_AGAIN/i,
    domain: ErrorDomain.NETWORK, category: ErrorCategory.TRANSIENT,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.RETRY,
    description: '网络连接瞬时失败，可重试恢复' },
  // ... 更多规则
];

function classifyError(error) {
  const combined = `${error.code || ''} ${error.name || ''} ${error.message || ''}`;
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.match.test(combined)) {
      return { domain: rule.domain, category: rule.category, severity: rule.severity,
               strategy: rule.strategy, description: rule.description, confidence: 0.85 };
    }
  }
  // 兜底
  return { domain: 'unknown', category: 'unknown', severity: 'medium',
           strategy: 'retry', description: '未分类错误', confidence: 0.3 };
}
```

**关键设计决策**：
- 规则按特异性排序（最具体在前），匹配即返回
- 每条规则有固定的置信度（0.85），兜底规则 0.3
- 分类结果直接注入 `errorInfo.classification` 供下游使用

**规则表建议覆盖的类别**（最少15条）：

| 匹配模式 | 域 | 类别 | 严重度 | 策略 |
|---------|----|------|-------|------|
| ECONNRESET / ETIMEDOUT | network | transient | medium | retry |
| socket / broken pipe | network | transient | medium | retry |
| ENOTFOUND | network | configuration | high | reload_config |
| timeout | network | timeout | low | retry |
| ENOENT / EACCES | storage | resource | high | fallback |
| ENOSPC / EFBIG | storage | resource | critical | escalate |
| 401 / 403 / unauthorized | external | auth | high | reload_config |
| 429 / rate limit | external | resource | medium | retry |
| 5xx / service unavailable | external | dependency | medium | retry |
| 4xx / bad request | external | validation | medium | fallback |
| memory / triality | memory | state | high | reset_state |
| OOM / out of memory | memory | resource | critical | escalate |
| TypeError / ReferenceError | internal | logic | high | reset_state |
| assert / invariant | internal | state | critical | escalate |
| invalid input / parse error | input | validation | low | ignore |

### 2. ErrorStormDetector — 错误风暴检测

检测同一操作+同一错误类型在短时间窗口内高频触发，防止日志爆炸。

```javascript
class ErrorStormDetector {
  constructor() {
    this.stormTracker = new Map();    // key -> [timestamp, ...]
    this.cooldownTracker = new Map(); // key -> cooldown_until
    this.stormsDetected = 0;
  }

  record(stormKey) {
    // 1. 检查冷却期 → 返回 cooldownActive: true
    // 2. 清理过期时间戳（超出 windowMs）
    // 3. 添加当前时间戳
    // 4. count >= threshold → 进入冷却期，返回 isStorm: true
    // 5. 否则返回 isStorm: false
  }
}
```

**可配置参数**：
- `stormWindowMs`: 默认 60000（1分钟）
- `stormThreshold`: 默认 5（窗口内5次即风暴）
- `stormCooldownMs`: 默认 300000（5分钟冷却）

**关键设计决策**：
- 风暴触发后进入冷却期，冷却期内该 key 的所有错误返回 `cooldownActive: true`
- 风暴后清理时间戳，防止累积
- 风暴期间跳过重试，直接进入优雅降级

### 3. CircuitBreaker — 熔断器

防止级联失败和资源耗尽。三态：closed → open → half_open。

```javascript
class CircuitBreaker {
  constructor() {
    this.circuits = new Map(); // operation -> { state, failCount, lastFailTime, halfOpenAttempts }
  }

  checkState(operation) {
    // closed → allowed: true
    // open → 检查是否达到 resetMs → 自动半开，否则 rejected
    // half_open → 允许试探（最多 halfOpenMax 次）
  }

  recordSuccess(operation) {
    // half_open 下成功 → 恢复（删除circuit）
    // closed 下成功 → 重置 failCount = 0
  }

  recordFailure(operation) {
    // failCount++ → >= threshold → 状态设为 open
  }
}
```

**可配置参数**：
- `circuitBreakerThreshold`: 默认 4（连续失败4次熔断）
- `circuitBreakerResetMs`: 默认 120000（2分钟冷却后自动半开）
- `circuitBreakerHalfOpenMax`: 默认 2（半开状态下最多2次试探）

**关键设计决策**：
- handleError 中先检查熔断器状态，熔断时返回 `action: 'circuit_broken'`，不重试
- executeWithRetry 开始时先检查熔断器，拒绝时直接返回
- 超过 maxRetries 后自动 `circuitBreaker.recordFailure()`

### 4. FrequencyAnalyzer — 错误频率分析

分析错误在时间窗口内的频率，提供趋势和告警。

```javascript
class FrequencyAnalyzer {
  constructor() {
    this.frequencyMap = new Map(); // errorType -> [timestamp, ...]
    this.totalRecords = 0;
  }

  analyze(errorType) {
    // count: 窗口内总次数
    // frequency: 次/分钟
    // isAlerting: count >= alertThreshold
    // trend: increasing / stable / decreasing（半窗比较）
  }
}
```

**可配置参数**：
- `frequencyWindowMs`: 默认 300000（5分钟）
- `frequencyAlertThreshold`: 默认 10（窗口内10次告警）

**趋势算法**：将时间戳列表二等分，比较前后半段的平均频率。
- 后半段 > 前半段 × 1.5 → `increasing`
- 后半段 < 前半段 × 0.5 → `decreasing`
- 否则 → `stable`

### 5. RecoveryStrategy — 上下文感知恢复建议

根据错误分类自动生成恢复策略建议。

```javascript
generateRecoverySuggestion(classification) {
  const strategies = {
    retry:     { action: '自动重试', detail: '系统将在指数退避后自动重试此操作' },
    circuit_break: { action: '等待熔断恢复', detail: '等待N秒后自动恢复' },
    fallback:  { action: '降级到备用方案', detail: '尝试使用备用服务或缓存数据' },
    reset_state: { action: '重置模块状态', detail: '重新初始化相关模块的状态' },
    reload_config: { action: '重新加载配置', detail: '重新读取并应用最新配置' },
    clear_cache: { action: '清除缓存', detail: '清除相关缓存数据后重试' },
    escalate:  { action: '需要人工干预', detail: '此错误无法自动恢复，需要人工排查' },
    ignore:    { action: '忽略（非关键）', detail: '此错误不影响核心功能，可继续运行' },
  };
  return { strategy: classification.strategy, ...strategies[classification.strategy] };
}
```

### 6. 集成流程（handleError 方法内顺序）

```
1. classifyError(error)             → 分类注入 errorInfo
2. FrequencyAnalyzer.record()        → 频率追踪
3. ErrorStormDetector.record()       → 风暴检测，风暴时不重试
4. CircuitBreaker.checkState()       → 熔断检查，熔断时直接返回降级
5. logError() + errorHistory.push()
6. shouldRetry 决策（结合分类策略 + 风暴状态 + 熔断状态）
7. 超过 maxRetries → CircuitBreaker.recordFailure()
8. generateRecoverySuggestion()       → 恢复建议注入
```

### 7. 增强的 getStats()

```javascript
getStats() {
  return {
    totalErrors,
    errorTypes,
    severityDistribution,    // { critical: N, high: N, ... }
    stormsDetected,          // stormDetector.getStats().totalStormsDetected
    circuitBreakers,         // circuitBreaker.getAllStates()
    frequencyReport,         // frequencyAnalyzer.getReport()
    recentErrors,            // 含 severity + stormDetected
  };
}
```

### 8. 完整的 getDiagnosticReport()

```javascript
getDiagnosticReport() {
  return {
    handler: { totalErrors, retryCounts },
    stormDetector: { totalStormsDetected, activeTrackedKeys, activeCooldowns },
    circuitBreaker: { states: {...}, config: { threshold, resetMs, halfOpenMax } },
    frequencyAnalyzer: { errors: {...}, totalRecent, windowMs },
    production: this.isProduction
  };
}
```

---

## 两种架构对比

| 维度 | Architecture A（管道） | Architecture B（分类法） |
|------|-----------------------|------------------------|
| 核心思想 | 处理流水线，每个步骤只做一件事 | 结构化分类 + 独立子系统 |
| 去重 | ✅ ErrorDedup | ❌ 无（依赖分类系统间接去重） |
| 限流 | ✅ RateLimiter | ✅ 通过 FrequencyAnalyzer 间接 |
| 震荡检测 | ✅ 类型切换震荡 | ✅ 频率风暴 |
| 熔断 | ❌ | ✅ CircuitBreaker 三态 |
| 错误关联 | ✅ CorrelationEngine | ❌ |
| 分类系统 | ❌ 仅 type 字符串 | ✅ ErrorDomain/Severity/Category 枚举 |
| 恢复建议 | 固定模板 | ✅ 基于分类动态生成 |
| 重试计划 | ✅ RetryEngine 独立 | 集成到 handleError + CircuitBreaker |
| 导出 | 单例 ErrorHandler | 全枚举 + 主类 + 子类 |

## 常见陷阱

### 陷阱1：去重抑制后的下游短路
`capture()` 中去重返回 `suppressed: true` 时必须 `return` 不继续执行限流/震荡/关联/重试。否则抑制后的计数仍然增加，导致限流误触发。

### 陷阱2：限流与去重的区别
- **去重**：相同错误在时间窗口内折叠，完全跳过下游处理
- **限流**：爆发检测后**仍记录**但标记 suppressed，主要用于不同错误同时大量出现时的保护
- 两者是正交的：去重在前，限流在后

### 陷阱3：retryableTypes 白名单
只有明确可重试的类型才应该进入重试计划。`syntax`/`json`/`module`/`file_not_found`/`unknown` 不应重试。

### 陷阱4：日志文件递归写入
`logError()` 中的 `fs.appendFileSync` 必须 try/catch，否则写入失败时会递归触发 capture → logError 的死循环。

### 陷阱5：熔断器状态恢复
熔断器 open → half_open 的自动转换在 `checkState()` 中实现，不是由定时器触发。每次调用 `checkState()` 时检查是否已过冷却期。

### 陷阱6：风暴冷却期后时间戳清零
风暴触发后必须删除 `stormTracker` 中的旧时间戳，否则冷却期结束后旧时间戳仍在窗口内，立即再次触发风暴。

### 陷阱7：getStats() 展平
`getStats()` 应该返回可序列化的纯对象，不要返回 Map 或 Set。用 `Object.fromEntries(map)` 或 `.reduce()` 转换。

## 参考实现

完整实现路径：
- `src/core/utils/error-handler.js` v2.1.0+ — Architecture B 实现（ErrorClassification / ErrorStormDetector / CircuitBreaker / FrequencyAnalyzer / RecoveryStrategy）
- `src/core/error-handler.js` v2.0.27 — Architecture A 实现（ErrorDedup / RateLimiter / OscillationDetector / RetryEngine / CorrelationEngine）

两个实现分别在 `src/core/`（旧路径）和 `src/core/utils/`（新路径），升级时确认调用者引用的是哪个路径。
