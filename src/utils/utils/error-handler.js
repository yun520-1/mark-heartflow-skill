/**
 * Error Handler - 全局错误边界与异常处理
 * 安全修复：添加敏感信息过滤，防止信息泄露
 *
 * v2.1.0 新增:
 *   - ErrorClassification — 错误分类法（域/类别/严重度/可恢复性）
 *   - ErrorStormDetector — 错误风暴检测（相同错误在时间窗口内高频触发）
 *   - CircuitBreaker — 熔断器模式（重复失败后自动切断操作）
 *   - RecoveryStrategy — 上下文感知恢复策略建议
 *   - FrequencyAnalyzer — 时间窗口频率分析
 */

const fs = require('fs');
const path = require('path');

const ERROR_CONFIG = {
  maxRetries: 3,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED'],
  logFile: '.opencode/logs/error.log',
  gracefulMessage: '我遇到了一些内部波动，让我们重新聚焦当前任务，你刚才说到哪里了？',
  // 错误风暴检测配置
  stormWindowMs: 60000,        // 1分钟时间窗口
  stormThreshold: 5,           // 窗口内触发5次即判定为风暴
  stormCooldownMs: 300000,     // 风暴后冷却5分钟
  // 熔断器配置
  circuitBreakerThreshold: 4,  // 连续失败4次触发熔断
  circuitBreakerResetMs: 120000, // 熔断后2分钟自动半开
  circuitBreakerHalfOpenMax: 2,  // 半开状态下最多允许2次试探
  // 频率分析配置
  frequencyWindowMs: 300000,   // 5分钟分析窗口
  frequencyAlertThreshold: 10  // 窗口内10次以上触发告警
};

// 敏感信息过滤规则
const SENSITIVE_PATTERNS = [
  { pattern: /(sk-|pk-|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}/gi, replacement: '[API_KEY]' },
  { pattern: /(PASSWORD|SECRET|TOKEN|AUTH)[=:]\s*[^\s]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { pattern: /\/[a-zA-Z0-9_\-./]+(?:\/|[a-zA-Z0-9_\-.-])|[A-Z]:\\[^\s]+/g, replacement: '[PATH]' }
];

// ============================================================================
// ErrorClassification — 错误分类法
// ============================================================================

/**
 * 错误域枚举 — 错误发生的功能领域
 */
const ErrorDomain = {
  NETWORK: 'network',       // 网络通信错误
  STORAGE: 'storage',       // 文件/存储错误
  MEMORY: 'memory',         // 记忆系统错误
  ENGINE: 'engine',         // 核心引擎错误
  INPUT: 'input',           // 输入验证错误
  EXTERNAL: 'external',     // 外部API/服务错误
  INTERNAL: 'internal',     // 内部逻辑错误
  UNKNOWN: 'unknown'        // 未分类错误
};

/**
 * 错误严重度枚举
 */
const ErrorSeverity = {
  CRITICAL: 'critical',     // 系统不可用，需立即干预
  HIGH: 'high',             // 功能严重受损，自动恢复可能失败
  MEDIUM: 'medium',         // 功能部分受损，可自动恢复
  LOW: 'low',               // 非关键错误，不影响核心功能
  INFO: 'info'              // 仅记录，无需处理
};

/**
 * 错误类别枚举
 */
const ErrorCategory = {
  TRANSIENT: 'transient',           // 瞬时错误（可重试）
  CONFIG: 'configuration',          // 配置错误（需人工修正）
  RESOURCE: 'resource_exhaustion',  // 资源耗尽
  VALIDATION: 'validation',         // 输入验证错误
  TIMEOUT: 'timeout',               // 超时错误
  AUTH: 'authentication',           // 认证/授权错误
  DEPENDENCY: 'dependency',         // 依赖服务错误
  LOGIC: 'logic',                   // 内部逻辑错误
  STATE: 'state_inconsistency',     // 状态不一致
  UNKNOWN: 'unknown'                // 未分类
};

/**
 * 错误恢复策略枚举
 */
const RecoveryStrategy = {
  RETRY: 'retry',                     // 重试（指数退避）
  CIRCUIT_BREAK: 'circuit_break',     // 熔断等待
  FALLBACK: 'fallback',               // 降级到备用方案
  RESET_STATE: 'reset_state',         // 重置状态
  RELOAD_CONFIG: 'reload_config',     // 重新加载配置
  CLEAR_CACHE: 'clear_cache',         // 清除缓存
  ESCALATE: 'escalate',               // 升级给人工处理
  IGNORE: 'ignore'                    // 忽略（非关键错误）
};

/**
 * 错误分类规则表 — 将错误代码/消息映射到分类
 * 每条规则包含: 匹配模式、域、类别、严重度、恢复策略、描述
 */
const CLASSIFICATION_RULES = [
  // === 网络错误 ===
  { match: /ECONNRESET|ETIMEDOUT|ENOTFOUND|ENETUNREACH|ECONNREFUSED|EAI_AGAIN/i,
    domain: ErrorDomain.NETWORK, category: ErrorCategory.TRANSIENT,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.RETRY,
    description: '网络连接瞬时失败，可重试恢复' },
  { match: /socket|hangup|broken pipe|connection.*close|request.*abort/i,
    domain: ErrorDomain.NETWORK, category: ErrorCategory.TRANSIENT,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.RETRY,
    description: 'Socket连接异常中断' },
  { match: /ENOTFOUND/i,
    domain: ErrorDomain.NETWORK, category: ErrorCategory.CONFIG,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.RELOAD_CONFIG,
    description: 'DNS解析失败，可能配置变更或网络断开' },

  // === 超时错误 ===
  { match: /timeout/i,
    domain: ErrorDomain.NETWORK, category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.LOW, strategy: RecoveryStrategy.RETRY,
    description: '操作超时，建议增加超时时间或重试' },

  // === 存储/文件错误 ===
  { match: /ENOENT|EACCES|EPERM|EISDIR|ENOTDIR|EEXIST/i,
    domain: ErrorDomain.STORAGE, category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.FALLBACK,
    description: '文件系统错误：文件不存在/权限不足/路径错误' },
  { match: /ENOSPC|EFBIG|EDQUOT/i,
    domain: ErrorDomain.STORAGE, category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.CRITICAL, strategy: RecoveryStrategy.ESCALATE,
    description: '磁盘空间不足或配额超限' },
  { match: /write.*fail|read.*fail|file.*not.*found|cannot.*open/i,
    domain: ErrorDomain.STORAGE, category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.FALLBACK,
    description: '文件读写操作失败' },

  // === 认证/授权错误 ===
  { match: /401|403|unauthorized|forbidden|invalid.*key|api.*key.*invalid/i,
    domain: ErrorDomain.EXTERNAL, category: ErrorCategory.AUTH,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.RELOAD_CONFIG,
    description: '认证失败：API密钥无效或权限不足' },
  { match: /429|too many requests|rate limit/i,
    domain: ErrorDomain.EXTERNAL, category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.RETRY,
    description: '请求频率限制，需等待后重试' },

  // === 外部服务错误 ===
  { match: /50[0-9]|service.*unavailable|bad gateway|internal server error/i,
    domain: ErrorDomain.EXTERNAL, category: ErrorCategory.DEPENDENCY,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.RETRY,
    description: '外部服务返回服务端错误' },
  { match: /40[0-4]|bad request|not found|method not allowed/i,
    domain: ErrorDomain.EXTERNAL, category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM, strategy: RecoveryStrategy.FALLBACK,
    description: '请求参数错误，需修正请求' },

  // === 内存/记忆系统错误 ===
  { match: /memory|triality|memory.*fail|slot.*exceed/i,
    domain: ErrorDomain.MEMORY, category: ErrorCategory.STATE,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.RESET_STATE,
    description: '记忆系统状态异常，需重置' },
  { match: /heap|allocation|OOM|out of memory/i,
    domain: ErrorDomain.MEMORY, category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.CRITICAL, strategy: RecoveryStrategy.ESCALATE,
    description: '内存耗尽，需立即干预' },

  // === 内部逻辑错误 ===
  { match: /TypeError|ReferenceError|SyntaxError|RangeError/i,
    domain: ErrorDomain.INTERNAL, category: ErrorCategory.LOGIC,
    severity: ErrorSeverity.HIGH, strategy: RecoveryStrategy.RESET_STATE,
    description: '内部代码逻辑错误' },
  { match: /assert.*fail|invariant.*violat/i,
    domain: ErrorDomain.INTERNAL, category: ErrorCategory.STATE,
    severity: ErrorSeverity.CRITICAL, strategy: RecoveryStrategy.ESCALATE,
    description: '断言失败：系统状态严重不一致' },

  // === 输入验证错误 ===
  { match: /invalid.*input|validation.*fail|malformed|parse.*error/i,
    domain: ErrorDomain.INPUT, category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW, strategy: RecoveryStrategy.IGNORE,
    description: '输入数据格式错误' }
];

/**
 * 将错误分类为结构化分类信息
 * @param {Error} error - 原始错误对象
 * @returns {Object} 分类结果 { domain, category, severity, strategy, description, confidence }
 */
function classifyError(error) {
  const code = error.code || '';
  const name = error.name || '';
  const message = error.message || '';
  const combined = `${code} ${name} ${message}`;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.match.test(combined)) {
      return {
        domain: rule.domain,
        category: rule.category,
        severity: rule.severity,
        strategy: rule.strategy,
        description: rule.description,
        confidence: 0.85  // 规则匹配的置信度
      };
    }
  }

  // 兜底分类
  return {
    domain: ErrorDomain.UNKNOWN,
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    strategy: RecoveryStrategy.RETRY,
    description: '未分类错误，采用默认重试策略',
    confidence: 0.3
  };
}

// ============================================================================
// ErrorStormDetector — 错误风暴检测
// ============================================================================

/**
 * 检测同一操作/同一错误类型在短时间窗口内高频触发
 * 用于防止错误日志爆炸和资源耗尽
 */
class ErrorStormDetector {
  constructor() {
    /** @type {Map<string, number[]>} key -> [timestamp, ...] */
    this.stormTracker = new Map();
    /** @type {Map<string, number>} key -> cooldown_until_timestamp */
    this.cooldownTracker = new Map();
    this.stormsDetected = 0;
  }

  /**
   * 记录一次错误并检测是否构成风暴
   * @param {string} stormKey - 风暴检测键（通常为 operation + errorCode）
   * @returns {{ isStorm: boolean, count: number, cooldownActive: boolean }}
   */
  record(stormKey) {
    const now = Date.now();

    // 检查冷却期
    const cooldownUntil = this.cooldownTracker.get(stormKey) || 0;
    if (now < cooldownUntil) {
      return { isStorm: false, count: 0, cooldownActive: true };
    }

    // 获取该键的时间戳窗口
    let timestamps = this.stormTracker.get(stormKey) || [];

    // 清理超出窗口的旧记录
    const windowStart = now - ERROR_CONFIG.stormWindowMs;
    timestamps = timestamps.filter(ts => ts >= windowStart);

    // 添加当前时间戳
    timestamps.push(now);
    this.stormTracker.set(stormKey, timestamps);

    const count = timestamps.length;
    const isStorm = count >= ERROR_CONFIG.stormThreshold;

    if (isStorm) {
      this.stormsDetected++;
      // 进入冷却期
      this.cooldownTracker.set(stormKey, now + ERROR_CONFIG.stormCooldownMs);
      // 风暴后清理该键的时间戳，防止累积
      this.stormTracker.delete(stormKey);
    }

    return { isStorm, count, cooldownActive: false };
  }

  /**
   * 获取风暴检测统计
   */
  getStats() {
    return {
      totalStormsDetected: this.stormsDetected,
      activeTrackedKeys: this.stormTracker.size,
      activeCooldowns: this.cooldownTracker.size
    };
  }

  /**
   * 重置所有风暴检测状态
   */
  reset() {
    this.stormTracker.clear();
    this.cooldownTracker.clear();
    this.stormsDetected = 0;
  }
}

// ============================================================================
// CircuitBreaker — 熔断器
// ============================================================================

/**
 * 熔断器三种状态
 */
const CircuitState = {
  CLOSED: 'closed',       // 正常，请求通过
  OPEN: 'open',           // 熔断，请求直接失败
  HALF_OPEN: 'half_open'  // 半开，允许试探请求
};

/**
 * 熔断器 — 防止级联失败和资源耗尽
 * 当同一操作连续失败达到阈值时，自动切断请求通道
 */
class CircuitBreaker {
  constructor() {
    /** @type {Map<string, { state: string, failCount: number, lastFailTime: number, halfOpenAttempts: number }>} */
    this.circuits = new Map();
  }

  /**
   * 检查熔断器状态，决定是否允许请求通过
   * @param {string} operation - 操作标识
   * @returns {{ allowed: boolean, state: string, reason: string }}
   */
  checkState(operation) {
    const circuit = this.circuits.get(operation);

    if (!circuit) {
      return { allowed: true, state: CircuitState.CLOSED, reason: '首次请求' };
    }

    const now = Date.now();

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return { allowed: true, state: CircuitState.CLOSED, reason: '正常状态' };

      case CircuitState.OPEN:
        // 检查是否达到重置时间
        if (now - circuit.lastFailTime >= ERROR_CONFIG.circuitBreakerResetMs) {
          // 自动转为半开状态
          circuit.state = CircuitState.HALF_OPEN;
          circuit.halfOpenAttempts = 0;
          return { allowed: true, state: CircuitState.HALF_OPEN, reason: '冷却期满，允许试探' };
        }
        return {
          allowed: false,
          state: CircuitState.OPEN,
          reason: `熔断中，剩余 ${Math.ceil((ERROR_CONFIG.circuitBreakerResetMs - (now - circuit.lastFailTime)) / 1000)}s`
        };

      case CircuitState.HALF_OPEN:
        if (circuit.halfOpenAttempts < ERROR_CONFIG.circuitBreakerHalfOpenMax) {
          circuit.halfOpenAttempts++;
          return { allowed: true, state: CircuitState.HALF_OPEN, reason: `试探请求 (${circuit.halfOpenAttempts}/${ERROR_CONFIG.circuitBreakerHalfOpenMax})` };
        }
        return {
          allowed: false,
          state: CircuitState.HALF_OPEN,
          reason: '试探次数已达上限，等待下一次半开周期'
        };

      default:
        return { allowed: true, state: CircuitState.CLOSED, reason: '未知状态，默认放行' };
    }
  }

  /**
   * 记录一次成功 — 关闭熔断器
   * @param {string} operation
   */
  recordSuccess(operation) {
    const circuit = this.circuits.get(operation);
    if (circuit) {
      if (circuit.state === CircuitState.HALF_OPEN) {
        // 半开状态下成功 = 恢复
        this.circuits.delete(operation);
      } else {
        // 关闭状态下成功 = 重置失败计数
        circuit.failCount = 0;
      }
    }
  }

  /**
   * 记录一次失败 — 可能触发熔断
   * @param {string} operation
   * @returns {{ tripped: boolean, failCount: number }}
   */
  recordFailure(operation) {
    let circuit = this.circuits.get(operation);

    if (!circuit) {
      circuit = { state: CircuitState.CLOSED, failCount: 0, lastFailTime: 0, halfOpenAttempts: 0 };
      this.circuits.set(operation, circuit);
    }

    circuit.failCount++;
    circuit.lastFailTime = Date.now();

    const tripped = circuit.failCount >= ERROR_CONFIG.circuitBreakerThreshold;

    if (tripped && circuit.state !== CircuitState.OPEN) {
      circuit.state = CircuitState.OPEN;
    }

    return { tripped, failCount: circuit.failCount };
  }

  /**
   * 获取所有熔断器状态
   */
  getAllStates() {
    const states = {};
    for (const [operation, circuit] of this.circuits.entries()) {
      states[operation] = {
        state: circuit.state,
        failCount: circuit.failCount,
        lastFailTime: new Date(circuit.lastFailTime).toISOString()
      };
    }
    return states;
  }

  /**
   * 手动重置指定操作的熔断器
   * @param {string} operation
   */
  reset(operation) {
    this.circuits.delete(operation);
  }

  /**
   * 重置所有熔断器
   */
  resetAll() {
    this.circuits.clear();
  }
}

// ============================================================================
// FrequencyAnalyzer — 错误频率分析
// ============================================================================

/**
 * 分析错误在时间窗口内的频率，提供趋势和告警
 */
class FrequencyAnalyzer {
  constructor() {
    /** @type {Map<string, number[]>} errorType -> [timestamp, ...] */
    this.frequencyMap = new Map();
    this.totalRecords = 0;
  }

  /**
   * 记录一次错误
   * @param {string} errorType - 错误类型标识
   * @param {string} severity - 错误严重度
   */
  record(errorType, severity) {
    const now = Date.now();
    let timestamps = this.frequencyMap.get(errorType) || [];

    // 清理超出窗口的旧记录
    const windowStart = now - ERROR_CONFIG.frequencyWindowMs;
    timestamps = timestamps.filter(ts => ts >= windowStart);

    timestamps.push(now);
    this.frequencyMap.set(errorType, timestamps);
    this.totalRecords++;
  }

  /**
   * 分析指定错误类型的频率
   * @param {string} errorType
   * @returns {{ count: number, frequency: string, isAlerting: boolean, trend: string }}
   */
  analyze(errorType) {
    const timestamps = this.frequencyMap.get(errorType) || [];
    const count = timestamps.length;
    const windowMs = ERROR_CONFIG.frequencyWindowMs;
    const perMinute = (count / windowMs) * 60000;

    let trend = 'stable';
    if (timestamps.length >= 2) {
      const half = Math.floor(timestamps.length / 2);
      const firstHalf = timestamps.slice(0, half);
      const secondHalf = timestamps.slice(half);
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstRate = firstHalf.length / (firstHalf[firstHalf.length - 1] - firstHalf[0] + 1);
        const secondRate = secondHalf.length / (secondHalf[secondHalf.length - 1] - secondHalf[0] + 1);
        if (secondRate > firstRate * 1.5) trend = 'increasing';
        else if (secondRate < firstRate * 0.5) trend = 'decreasing';
      }
    }

    return {
      count,
      frequency: `${perMinute.toFixed(1)}/min`,
      isAlerting: count >= ERROR_CONFIG.frequencyAlertThreshold,
      trend,
      windowMs
    };
  }

  /**
   * 获取所有错误类型的频率报告
   */
  getReport() {
    const report = {};
    for (const [errorType] of this.frequencyMap.entries()) {
      report[errorType] = this.analyze(errorType);
    }
    return {
      errors: report,
      totalRecent: this.totalRecords,
      windowMs: ERROR_CONFIG.frequencyWindowMs
    };
  }

  /**
   * 清除所有频率数据
   */
  clear() {
    this.frequencyMap.clear();
    this.totalRecords = 0;
  }
}

/**
 * 过滤敏感信息
 */
function filterSensitiveInfo(text) {
  if (!text || typeof text !== 'string') return text;
  
  let filtered = text;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, replacement);
  }
  return filtered;
}

/**
 * 过滤对象中的敏感信息
 */
function filterSensitiveInObject(obj, depth = 0) {
  if (depth > 3) return obj; // 防止无限递归
  
  if (typeof obj === 'string') {
    return filterSensitiveInfo(obj);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const filtered = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        filtered[key] = filterSensitiveInfo(value);
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = filterSensitiveInObject(value, depth + 1);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }
  
  return obj;
}

class ErrorHandler {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logFile = path.join(projectRoot, ERROR_CONFIG.logFile);
    this.retryCounts = new Map();
    this.errorHistory = [];
    this.isProduction = process.env.NODE_ENV === 'production';

    // v2.1.0 新增子系统
    this.stormDetector = new ErrorStormDetector();
    this.circuitBreaker = new CircuitBreaker();
    this.frequencyAnalyzer = new FrequencyAnalyzer();
  }

  /**
   * 错误处理主函数
   * 安全修复：过滤敏感信息
   * v2.1.0: 集成错误分类、风暴检测、熔断器、频率分析
   */
  handleError(error, context = {}) {
    const errorInfo = this.formatError(error, context);

    // === 1. 错误分类 ===
    const classification = classifyError(error);
    errorInfo.classification = classification;

    // === 2. 频率分析 ===
    const errorType = classification.domain + ':' + (error.code || error.name || 'unknown');
    this.frequencyAnalyzer.record(errorType, classification.severity);

    // === 3. 错误风暴检测 ===
    const operation = context.operation || 'default';
    const stormKey = operation + ':' + errorType;
    const stormResult = this.stormDetector.record(stormKey);
    errorInfo.stormDetected = stormResult.isStorm;
    errorInfo.stormCount = stormResult.count;
    errorInfo.stormCooldownActive = stormResult.cooldownActive;

    // 风暴期间跳过重试，直接进入优雅降级
    if (stormResult.isStorm) {
      console.warn(`[ErrorHandler] ⚡ 错误风暴检测: ${stormKey} (${stormResult.count}次/${ERROR_CONFIG.stormWindowMs}ms)`);
    }

    // === 4. 熔断器检查 ===
    const breakerState = this.circuitBreaker.checkState(operation);
    errorInfo.circuitState = breakerState.state;

    if (!breakerState.allowed) {
      // 熔断器打开，不重试，记录日志后返回降级
      this.logError(errorInfo);
      this.errorHistory.push(errorInfo);
      if (this.errorHistory.length > 50) {
        this.errorHistory.shift();
      }
      return {
        action: 'circuit_broken',
        circuitState: breakerState.state,
        reason: breakerState.reason,
        userMessage: '系统正在自动保护，请稍后再试',
        internalMessage: this.isProduction ? '[ERROR_DETAILS_REDACTED]' : filterSensitiveInfo(error.message),
        recoverable: true,
        retryAfter: ERROR_CONFIG.circuitBreakerResetMs
      };
    }

    // === 5. 日志记录 ===
    this.logError(errorInfo);

    this.errorHistory.push(errorInfo);
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    // === 6. 根据分类策略决定是否重试 ===
    const shouldRetry = this.shouldRetry(error, context) &&
                        classification.strategy === RecoveryStrategy.RETRY &&
                        !stormResult.isStorm &&
                        !stormResult.cooldownActive;

    if (shouldRetry) {
      const retryCount = this.getRetryCount(operation);

      if (retryCount < ERROR_CONFIG.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        return {
          action: 'retry',
          delay,
          retryCount: retryCount + 1,
          operation,
          message: `将在 ${delay}ms 后重试 (${retryCount + 1}/${ERROR_CONFIG.maxRetries})`,
          classification,
          circuitState: breakerState.state
        };
      }

      // 超过最大重试次数 -> 熔断器记录失败
      this.circuitBreaker.recordFailure(operation);
    }

    // === 7. 根据分类生成恢复建议 ===
    const recoverySuggestion = this.generateRecoverySuggestion(classification);

    return {
      action: 'graceful_degradation',
      userMessage: ERROR_CONFIG.gracefulMessage,
      internalMessage: this.isProduction ? '[ERROR_DETAILS_REDACTED]' : filterSensitiveInfo(error.message),
      recoverable: classification.severity !== ErrorSeverity.CRITICAL,
      classification,
      circuitState: breakerState.state,
      stormDetected: stormResult.isStorm,
      recoverySuggestion
    };
  }

  /**
   * 根据错误分类生成上下文感知的恢复建议
   * @param {Object} classification - 错误分类结果
   * @returns {Object} 恢复建议
   */
  generateRecoverySuggestion(classification) {
    const suggestions = {
      [RecoveryStrategy.RETRY]: {
        action: '自动重试',
        detail: '系统将在指数退避后自动重试此操作'
      },
      [RecoveryStrategy.CIRCUIT_BREAK]: {
        action: '等待熔断恢复',
        detail: `等待 ${Math.round(ERROR_CONFIG.circuitBreakerResetMs / 1000)} 秒后自动恢复`
      },
      [RecoveryStrategy.FALLBACK]: {
        action: '降级到备用方案',
        detail: '尝试使用备用服务或缓存数据'
      },
      [RecoveryStrategy.RESET_STATE]: {
        action: '重置模块状态',
        detail: '重新初始化相关模块的状态'
      },
      [RecoveryStrategy.RELOAD_CONFIG]: {
        action: '重新加载配置',
        detail: '重新读取并应用最新配置'
      },
      [RecoveryStrategy.CLEAR_CACHE]: {
        action: '清除缓存',
        detail: '清除相关缓存数据后重试'
      },
      [RecoveryStrategy.ESCALATE]: {
        action: '需要人工干预',
        detail: '此错误无法自动恢复，需要人工排查'
      },
      [RecoveryStrategy.IGNORE]: {
        action: '忽略（非关键）',
        detail: '此错误不影响核心功能，可继续运行'
      }
    };

    const suggestion = suggestions[classification.strategy] || suggestions[RecoveryStrategy.RETRY];

    return {
      strategy: classification.strategy,
      action: suggestion.action,
      detail: suggestion.detail,
      domain: classification.domain,
      severity: classification.severity,
      description: classification.description
    };
  }

  formatError(error, context) {
    return {
      timestamp: new Date().toISOString(),
      name: filterSensitiveInfo(error.name),
      message: filterSensitiveInfo(error.message || String(error)),
      // 生产环境不记录堆栈
      stack: this.isProduction ? null : filterSensitiveInfo(error.stack || ''),
      context: filterSensitiveInObject(context),
      operation: context.operation || 'unknown'
    };
  }

  logError(errorInfo) {
    try {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const safeMessage = filterSensitiveInfo(errorInfo.message);
      const safeStack = errorInfo.stack ? filterSensitiveInfo(errorInfo.stack) : '';
      const safeContext = filterSensitiveInObject(errorInfo.context);

      const logEntry = `[${errorInfo.timestamp}] ${safeMessage}\n` +
        `  Operation: ${errorInfo.operation}\n` +
        `  Context: ${JSON.stringify(safeContext)}\n` +
        (safeStack ? `  Stack: ${safeStack}\n` : '') +
        '---\n';

      fs.appendFileSync(this.logFile, logEntry);
    } catch (e) {
      console.error('[ErrorHandler] Failed to write log:', e.message);
    }
  }

  shouldRetry(error, context) {
    if (context.noRetry) return false;
    if (context.retriesRemaining !== undefined && context.retriesRemaining <= 0) return false;

    const errorCode = error.code || error.name;
    if (ERROR_CONFIG.retryableErrors.includes(errorCode)) {
      return true;
    }

    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONN/i,
      /ETIMEDOUT/i,
      /fetch/i
    ];

    const errorMessage = error.message || '';
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  getRetryCount(operation) {
    const current = this.retryCounts.get(operation) || 0;
    return current;
  }

  incrementRetryCount(operation) {
    const current = this.retryCounts.get(operation) || 0;
    this.retryCounts.set(operation, current + 1);
  }

  resetRetryCount(operation) {
    this.retryCounts.delete(operation);
  }

  calculateBackoff(retryCount) {
    const baseDelay = 1000;
    const backoffFactor = 2;
    const delay = baseDelay * Math.pow(backoffFactor, retryCount);
    return Math.min(delay, 10000);
  }

  /**
   * 执行带重试的操作
   * v2.1.0: 集成熔断器状态跟踪
   */
  async executeWithRetry(operationFn, context = {}) {
    const operation = context.operation || 'operation';
    let lastError = null;

    // 先检查熔断器状态
    const breakerState = this.circuitBreaker.checkState(operation);
    if (!breakerState.allowed) {
      return {
        success: false,
        error: {
          action: 'circuit_broken',
          circuitState: breakerState.state,
          reason: breakerState.reason
        },
        message: '熔断器已打开，操作被拒绝',
        recoverable: true,
        retryAfter: ERROR_CONFIG.circuitBreakerResetMs
      };
    }

    for (let attempt = 0; attempt < ERROR_CONFIG.maxRetries; attempt++) {
      try {
        this.resetRetryCount(operation);
        const result = await operationFn();
        // 成功：通知熔断器
        this.circuitBreaker.recordSuccess(operation);
        return { success: true, result };
      } catch (error) {
        lastError = error;

        const handleResult = this.handleError(error, {
          ...context,
          operation
        });

        if (handleResult.action === 'retry') {
          this.incrementRetryCount(operation);
          await this.sleep(handleResult.delay);
          continue;
        }

        // 熔断或降级
        if (handleResult.action === 'circuit_broken') {
          this.circuitBreaker.recordFailure(operation);
        }

        return {
          success: false,
          error: handleResult,
          message: handleResult.userMessage,
          recoverable: handleResult.recoverable !== false,
          classification: handleResult.classification,
          circuitState: handleResult.circuitState
        };
      }
    }

    // 所有重试均失败 -> 熔断器记录
    this.circuitBreaker.recordFailure(operation);

    return {
      success: false,
      error: lastError,
      message: ERROR_CONFIG.gracefulMessage,
      recoverable: true,
      classification: classifyError(lastError)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * 获取统计信息
   * v2.1.0: 集成风暴检测、熔断器、频率分析统计
   */
  getStats() {
    const errorTypes = {};
    for (const e of this.errorHistory) {
      errorTypes[e.name] = (errorTypes[e.name] || 0) + 1;
    }

    const severityDistribution = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const e of this.errorHistory) {
      const sev = e.classification?.severity || 'unknown';
      severityDistribution[sev] = (severityDistribution[sev] || 0) + 1;
    }

    return {
      totalErrors: this.errorHistory.length,
      errorTypes,
      severityDistribution,
      stormsDetected: this.stormDetector.getStats().totalStormsDetected,
      circuitBreakers: this.circuitBreaker.getAllStates(),
      frequencyReport: this.frequencyAnalyzer.getReport(),
      recentErrors: this.errorHistory.slice(-5).map(e => ({
        timestamp: e.timestamp,
        name: e.name,
        operation: e.operation,
        severity: e.classification?.severity || 'unknown',
        stormDetected: e.stormDetected || false
      }))
    };
  }

  /**
   * 获取全面诊断报告
   * v2.1.0: 新增
   */
  getDiagnosticReport() {
    return {
      handler: {
        totalErrors: this.errorHistory.length,
        retryCounts: Object.fromEntries(this.retryCounts)
      },
      stormDetector: this.stormDetector.getStats(),
      circuitBreaker: {
        states: this.circuitBreaker.getAllStates(),
        config: {
          threshold: ERROR_CONFIG.circuitBreakerThreshold,
          resetMs: ERROR_CONFIG.circuitBreakerResetMs,
          halfOpenMax: ERROR_CONFIG.circuitBreakerHalfOpenMax
        }
      },
      frequencyAnalyzer: this.frequencyAnalyzer.getReport(),
      production: this.isProduction
    };
  }

  /**
   * 重置所有错误追踪状态
   * v2.1.0: 新增
   */
  resetAll() {
    this.errorHistory = [];
    this.retryCounts.clear();
    this.stormDetector.reset();
    this.circuitBreaker.resetAll();
    this.frequencyAnalyzer.clear();
  }

  /**
   * 清理旧日志
   */
  cleanOldLogs(maxAgeDays = 7) {
    try {
      if (!fs.existsSync(this.logFile)) return;

      const stats = fs.statSync(this.logFile);
      const ageMs = Date.now() - stats.mtimeMs;
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

      if (ageMs > maxAgeMs) {
        const backupFile = this.logFile + '.old';
        fs.renameSync(this.logFile, backupFile);
        console.error(`[ErrorHandler] Rotated old log to ${backupFile}`);
      }
    } catch (e) {
      console.error('[ErrorHandler] Failed to clean logs:', e.message);
    }
  }
}

module.exports = {
  ErrorHandler,
  ErrorStormDetector,
  CircuitBreaker,
  CircuitState,
  FrequencyAnalyzer,
  ErrorDomain,
  ErrorSeverity,
  ErrorCategory,
  RecoveryStrategy,
  classifyError,
  ERROR_CONFIG
};
