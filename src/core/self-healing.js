/**
 * HeartFlow Self-Healing v11.6.0
 * 
 * Recovery loop with RL-based repair strategy learning.
 * - detect repeated failures
 * - classify recovery path
 * - emit concrete repair hints
 * - learn from repair outcomes (Q-learning)
 * - error severity classification with scoring
 * - oscillation/anomaly detection for repetitive failure loops
 * - circuit breaker with automatic halt after N consecutive same-type failures
 * - self-diagnosis to check internal health of the healing system
 * - adaptive tuning of retry/backoff parameters based on failure patterns
 * 
 * Paper: Reflexion (2023), CRITIC (2024)
 */

const { HealingMemoryRL } = require('./self-healing-rl.js');
const EventEmitter = require('events');

// ============================================================================
// 错误严重性分类体系
// ============================================================================

/**
 * 错误严重性等级枚举
 * @enum {string}
 */
const ErrorSeverity = {
  CRITICAL: 'critical',   // 系统级崩溃，需要人工干预
  HIGH: 'high',           // 核心功能故障，自动修复高风险
  MEDIUM: 'medium',       // 局部功能异常，标准自动修复
  LOW: 'low',             // 轻微问题，可忽略或延迟处理
  INFO: 'info'            // 仅记录，无需修复
};

/**
 * 错误分类枚举
 * @enum {string}
 */
const ErrorCategory = {
  NETWORK: 'network',         // 网络/连接类错误
  TIMEOUT: 'timeout',         // 超时类错误
  RATE_LIMIT: 'rate_limit',   // 限流类错误
  AUTH: 'auth',               // 认证/权限类错误
  VALIDATION: 'validation',   // 参数验证类错误
  RESOURCE: 'resource',       // 资源不足类错误
  SYNTAX: 'syntax',           // 语法/解析类错误
  DEPENDENCY: 'dependency',   // 依赖/模块类错误
  STATE: 'state',             // 状态/逻辑类错误
  UNKNOWN: 'unknown'          // 未知/无法分类
};

/**
 * 错误分类规则表
 * pattern -> { category, severity, description }
 */
const ERROR_CLASSIFICATION_RULES = [
  { pattern: /timeout|econnreset|eagain|econnrefused|econnaborted/i, category: ErrorCategory.TIMEOUT, severity: ErrorSeverity.MEDIUM, description: '连接或操作超时' },
  { pattern: /rate\s*limit|429|throttle|too\s*many\s*requests/i, category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.LOW, description: '请求频率受限' },
  { pattern: /unauthorized|unauth|401|403|permission\s*denied|access\s*denied|invalid\s*key|api\s*key/i, category: ErrorCategory.AUTH, severity: ErrorSeverity.HIGH, description: '认证或权限不足' },
  { pattern: /syntax\s*error|parse\s*error|unexpected\s*token|malformed|invalid\s*syntax/i, category: ErrorCategory.SYNTAX, severity: ErrorSeverity.HIGH, description: '语法解析错误' },
  { pattern: /not\s*found|cannot\s*find|module\s*not\s*found|enoent|eexist/i, category: ErrorCategory.DEPENDENCY, severity: ErrorSeverity.HIGH, description: '依赖或文件缺失' },
  { pattern: /out\s*of\s*memory|oom|emfile|enospc|disk\s*full|no\s*space/i, category: ErrorCategory.RESOURCE, severity: ErrorSeverity.CRITICAL, description: '系统资源耗尽' },
  { pattern: /validation|invalid|bad\s*request|400|422/i, category: ErrorCategory.VALIDATION, severity: ErrorSeverity.MEDIUM, description: '参数或请求校验失败' },
  { pattern: /network|ehost|enotfound|enonet|socket|econn/i, category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, description: '网络通信异常' },
  { pattern: /500|502|503|504|internal\s*server|service\s*unavailable|bad\s*gateway/i, category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, description: '服务端故障' },
  { pattern: /state|consistency|conflict|409|lock|deadlock/i, category: ErrorCategory.STATE, severity: ErrorSeverity.HIGH, description: '状态一致性冲突' },
];

/**
 * 计算错误严重性分数 (0-100, 越高越严重)
 * @param {Object} classified - 分类结果 { category, severity, ... }
 * @param {Object} normalized - 归一化错误 { message, code, transient }
 * @returns {number} 严重性分数
 */
function calculateSeverityScore(classified, normalized) {
  const severityBase = {
    [ErrorSeverity.CRITICAL]: 90,
    [ErrorSeverity.HIGH]: 65,
    [ErrorSeverity.MEDIUM]: 40,
    [ErrorSeverity.LOW]: 20,
    [ErrorSeverity.INFO]: 5
  };
  let score = severityBase[classified.severity] || 40;
  
  // 修正因子
  if (normalized.transient) score -= 15;  // 暂时性错误降级
  if (classified.category === ErrorCategory.AUTH) score += 10;  // 认证错误升级
  if (classified.category === ErrorCategory.RESOURCE) score += 5;  // 资源错误升级
  
  return Math.max(0, Math.min(100, score));
}

/**
 * 分类错误
 * @param {Object} normalized - 归一化错误 { message, code, transient }
 * @returns {Object} { category, severity, severityScore, description }
 */
function classifyError(normalized) {
  for (const rule of ERROR_CLASSIFICATION_RULES) {
    if (rule.pattern.test(normalized.message) || 
        (normalized.code && rule.pattern.test(String(normalized.code)))) {
      const severityScore = calculateSeverityScore(rule, normalized);
      return {
        category: rule.category,
        severity: rule.severity,
        severityScore,
        description: rule.description
      };
    }
  }
  return {
    category: ErrorCategory.UNKNOWN,
    severity: normalized.transient ? ErrorSeverity.LOW : ErrorSeverity.MEDIUM,
    severityScore: normalized.transient ? 15 : 35,
    description: '无法分类的错误'
  };
}

// ============================================================================
// SelfHealing 主类
// ============================================================================

class SelfHealing extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries ?? 2;
    this.backoffMs = options.backoffMs ?? 150;
    this.failureWindow = [];
    this.rl = new HealingMemoryRL(options.maxMemory ?? 100);
    this.learnedMemory = new Map(); // pattern -> { strategy, qValue }
    this._pendingCtx = new Map(); // pending repair attempts for RL update

    // === 震荡检测 ===
    this._oscillationCounter = new Map(); // pattern -> { count, firstTs, lastTs }
    this._oscillationThreshold = options.oscillationThreshold ?? 5; // 同类型连续失败N次触发
    this._oscillationWindowMs = options.oscillationWindowMs ?? 60000; // 1分钟内检测窗口
    this._circuitBreaker = {
      tripped: false,
      trippedAt: null,
      cooldownMs: options.circuitBreakerCooldownMs ?? 30000, // 30秒冷却
      pattern: null,
    };

    // === 自适应调参 ===
    this._adaptationLog = []; // 调参历史
    this._maxRetriesBase = this.maxRetries;
    this._backoffMsBase = this.backoffMs;
  }

  /**
   * 归一化错误对象
   * @param {Object|string} errorLike
   * @returns {Object} { message, code, transient, category, severity, severityScore }
   */
  normalizeError(errorLike = {}) {
    if (!errorLike) return { message: '', code: null, transient: false, category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.INFO, severityScore: 0 };
    if (typeof errorLike === 'string') {
      return this.normalizeError({ message: errorLike });
    }

    const message = String(
      errorLike.message || errorLike.error || errorLike.summary || ''
    );
    const code = errorLike.code || errorLike.statusCode || errorLike.status || null;
    const transient = /timeout|econnreset|eagain|temporar|busy|rate limit|429|throttle/i.test(message)
      || [408, 423, 425, 429, 500, 502, 503, 504].includes(Number(code));

    const normalized = { message, code, transient };
    const classified = classifyError(normalized);

    return {
      ...normalized,
      category: classified.category,
      severity: classified.severity,
      severityScore: classified.severityScore,
      description: classified.description
    };
  }

  /**
   * 检测震荡/异常循环
   * 如果同类型错误在短时间内重复出现，标记为震荡
   * @param {Object} normalized - 归一化错误
   * @returns {Object} { oscillating, count, sinceMs }
   */
  detectOscillation(normalized) {
    const key = `${normalized.category}:${normalized.message.slice(0, 80)}`;
    const now = Date.now();
    
    let entry = this._oscillationCounter.get(key);
    if (!entry) {
      entry = { count: 0, firstTs: now, lastTs: now };
      this._oscillationCounter.set(key, entry);
    }

    // 如果距离上次记录超过窗口期，重置计数
    if (now - entry.lastTs > this._oscillationWindowMs) {
      entry.count = 0;
      entry.firstTs = now;
    }

    entry.count++;
    entry.lastTs = now;

    const oscillating = entry.count >= this._oscillationThreshold;
    const sinceMs = now - entry.firstTs;

    // 震荡时发出事件
    if (oscillating && entry.count === this._oscillationThreshold) {
      this.emit('oscillation_detected', {
        pattern: key,
        count: entry.count,
        windowMs: sinceMs,
        severity: normalized.severity,
        category: normalized.category
      });
    }

    return { oscillating, count: entry.count, sinceMs };
  }

  /**
   * 检查电路断路器状态
   * 如果断路器已跳闸且在冷却期内，阻止进一步重试
   * @returns {Object} { blocked, reason, remainingMs }
   */
  checkCircuitBreaker() {
    const cb = this._circuitBreaker;
    if (!cb.tripped) return { blocked: false, reason: null, remainingMs: 0 };

    const elapsed = Date.now() - cb.trippedAt;
    const remaining = cb.cooldownMs - elapsed;

    if (remaining <= 0) {
      // 冷却结束，自动复位
      cb.tripped = false;
      cb.trippedAt = null;
      cb.pattern = null;
      this.emit('circuit_breaker_reset', { cooldownMs: cb.cooldownMs });
      return { blocked: false, reason: null, remainingMs: 0 };
    }

    return { blocked: true, reason: cb.pattern, remainingMs: remaining };
  }

  /**
   * 触发电路断路器
   * @param {string} pattern - 触发跳闸的错误模式
   */
  tripCircuitBreaker(pattern) {
    this._circuitBreaker.tripped = true;
    this._circuitBreaker.trippedAt = Date.now();
    this._circuitBreaker.pattern = pattern;
    this.emit('circuit_breaker_tripped', {
      pattern,
      cooldownMs: this._circuitBreaker.cooldownMs
    });
  }

  /**
   * 自适应调参
   * 根据失败模式动态调整 maxRetries 和 backoffMs
   * @param {Object} oscillationInfo - 震荡检测结果
   * @param {Object} classified - 错误分类结果
   */
  adaptParameters(oscillationInfo, classified) {
    const before = { maxRetries: this.maxRetries, backoffMs: this.backoffMs };
    
    // 震荡时增加重试次数但降低频率（更长backoff）
    if (oscillationInfo.oscillating) {
      this.maxRetries = Math.min(this._maxRetriesBase + 2, 5);
      this.backoffMs = Math.min(this._backoffMsBase * 3, 5000);
    } else {
      // 平稳时回归基础值
      this.maxRetries = this._maxRetriesBase;
      this.backoffMs = this._backoffMsBase;
    }

    // 高严重性错误降低重试耐心
    if (classified.severityScore >= 65) {
      this.maxRetries = Math.max(0, this.maxRetries - 1);
    }

    // 网络类错误增加backoff
    if (classified.category === ErrorCategory.NETWORK || classified.category === ErrorCategory.TIMEOUT) {
      this.backoffMs = Math.min(this.backoffMs * 2, 10000);
    }

    const after = { maxRetries: this.maxRetries, backoffMs: this.backoffMs };

    if (before.maxRetries !== after.maxRetries || before.backoffMs !== after.backoffMs) {
      this._adaptationLog.push({
        ts: Date.now(),
        before,
        after,
        reason: {
          oscillating: oscillationInfo.oscillating,
          category: classified.category,
          severityScore: classified.severityScore
        }
      });
      // 仅保留最近50条
      if (this._adaptationLog.length > 50) this._adaptationLog.shift();
    }
  }

  record(event = {}, repairOutcome = null) {
    const normalized = this.normalizeError(event);
    const oscillation = this.detectOscillation(normalized);
    
    // 自适应调参
    this.adaptParameters(oscillation, normalized);

    // 震荡时触发电路断路器
    if (oscillation.oscillating) {
      this.tripCircuitBreaker(`${normalized.category}:${normalized.message.slice(0, 60)}`);
    }

    const item = {
      type: String(event.type || 'unknown'),
      message: normalized.message,
      code: normalized.code,
      transient: normalized.transient,
      category: normalized.category,
      severity: normalized.severity,
      severityScore: normalized.severityScore,
      oscillating: oscillation.oscillating,
      oscillationCount: oscillation.count,
      ts: Date.now(),
    };
    this.failureWindow.push(item);
    if (this.failureWindow.length > 20) this.failureWindow.shift();

    // RL: 关闭修复闭环
    if (repairOutcome !== null) {
      const pending = this._pendingCtx.get(normalized.message);
      if (pending) {
        this.rl.updateFromRepair(normalized.message, pending.strategy, repairOutcome);
        this.rl.record(normalized.message, pending.strategy, repairOutcome);
        this._pendingCtx.delete(normalized.message);
      }
    }

    // 发出事件
    this.emit('failure_recorded', {
      type: item.type,
      category: normalized.category,
      severity: normalized.severity,
      severityScore: normalized.severityScore,
      oscillating: oscillation.oscillating
    });

    return item;
  }

  summarize() {
    const counts = this.failureWindow.reduce((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + 1;
      return acc;
    }, {});

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const x of this.failureWindow) {
      if (severityCounts[x.severity] !== undefined) severityCounts[x.severity]++;
    }

    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const cb = this.checkCircuitBreaker();

    return {
      total: this.failureWindow.length,
      counts,
      severityDistribution: severityCounts,
      circuitBreaker: cb.blocked ? { tripped: true, remainingMs: cb.remainingMs } : { tripped: false },
      summary: top ? `${top[0]} x${top[1]}` : 'no failures',
    };
  }

  shouldRetry(result = {}) {
    // 先检查电路断路器
    const cb = this.checkCircuitBreaker();
    if (cb.blocked) return false;

    const normalized = this.normalizeError(result);
    return normalized.transient && (result.attempt || 0) < this.maxRetries;
  }

  repairHints(result = {}) {
    const normalized = this.normalizeError(result);
    const message = normalized.message;
    const hints = [];
    
    if (/timeout/i.test(message)) hints.push('use smaller scope or longer timeout');
    if (/rate limit|429|throttle/i.test(message)) hints.push('pause and retry with exponential backoff');
    if (/syntax|parse|unexpected token/i.test(message)) hints.push('re-read the target file and patch smaller');
    if (/module not found|cannot find/i.test(message)) hints.push('verify imports and relative paths');
    if (/unknown option|invalid option/i.test(message)) hints.push('remove unsupported CLI flags');
    if (/execution_failed|invalid_structure/i.test(message)) hints.push('force structured result output before retrying');
    
    // 基于分类的额外建议
    if (normalized.category === ErrorCategory.AUTH) hints.push('check API key validity and permissions');
    if (normalized.category === ErrorCategory.RESOURCE) hints.push('free up system resources and retry');
    if (normalized.category === ErrorCategory.NETWORK) hints.push('verify network connectivity and endpoint availability');
    if (normalized.category === ErrorCategory.STATE) hints.push('reset application state or restart the operation');

    // 震荡时添加更保守的建议
    if (normalized.oscillating) {
      hints.push('oscillation detected — consider pausing all retries and escalating to manual review');
    }

    if (hints.length === 0) hints.push('reduce the failure surface and retry once');
    return [...new Set(hints)];
  }

  createRetryPlan(result = {}) {
    const attempt = Number(result.attempt || 0) + 1;
    const canRetry = this.shouldRetry({ ...result, attempt });
    const delay = this.backoffMs * Math.max(1, 2 ** (attempt - 1));
    
    // 严重性影响重试策略
    const normalized = this.normalizeError(result);
    const strategy = canRetry 
      ? (normalized.severityScore >= 65 ? 'cautious_retry' : 'exponential_backoff')
      : 'manual_repair';
    
    return {
      attempt,
      canRetry,
      delay,
      strategy,
      circuitBreakerBlocked: this.checkCircuitBreaker().blocked,
    };
  }

  recover(result = {}) {
    const retry = this.createRetryPlan(result);
    const snapshot = this.summarize();
    const normalized = this.normalizeError(result);
    const message = normalized.message;
    const hints = this.repairHints({ ...result, oscillating: normalized.oscillating });
    const pattern = message;

    // RL: 用 Q-learning 排序策略
    const ranked = this.rl.getRankedStrategies(pattern);
    const rankedStrats = ranked.map(r => r.strategy);
    const seen = new Set(rankedStrats);
    for (const h of hints) {
      if (!seen.has(h)) seen.add(h);
    }
    const available = [...seen];

    // RL: 记录待验证的修复策略
    if (available.length > 0) {
      const chosen = available[0];
      this._pendingCtx.set(message, { context: pattern, strategy: chosen, ts: Date.now() });
    }

    return {
      ok: !!result.ok,
      attempt: retry.attempt,
      canRetry: retry.canRetry,
      backoffMs: retry.delay,
      strategy: retry.strategy,
      hints: available.slice(0, 5),
      summary: snapshot.summary,
      details: snapshot,
      next_step: retry.canRetry ? 'retry' : 'repair',
      rlStats: this.rl.stats(),
      // 新增诊断信息
      classification: {
        category: normalized.category,
        severity: normalized.severity,
        severityScore: normalized.severityScore,
        description: normalized.description
      },
      oscillation: normalized.oscillating ? {
        detected: true,
        count: normalized.oscillationCount
      } : { detected: false },
      circuitBreaker: this.checkCircuitBreaker(),
      adaptation: {
        maxRetries: this.maxRetries,
        backoffMs: this.backoffMs
      }
    };
  }

  /**
   * 自我诊断：检查自愈系统的内部健康状态
   * @returns {Object} 诊断报告
   */
  diagnose() {
    const cb = this.checkCircuitBreaker();
    const snapshot = this.summarize();
    
    // 评估RL健康度
    const rlStats = this.rl.stats();
    const rlHealthy = rlStats.qTableSize > 0 || rlStats.historySize > 0;

    // 评估震荡风险
    const oscillatingEntries = [...this._oscillationCounter.entries()]
      .filter(([, entry]) => entry.count >= this._oscillationThreshold);
    
    // 评估失败窗口健康度
    const failureWindowHealthy = this.failureWindow.length <= 15; // 不超过窗口容量75%
    const highSeverityRatio = snapshot.severityDistribution.high + snapshot.severityDistribution.critical;

    return {
      status: cb.blocked ? 'degraded' : (highSeverityRatio > 5 ? 'warning' : 'healthy'),
      circuitBreaker: cb.blocked ? { tripped: true, pattern: cb.reason, remainingMs: cb.remainingMs } : { tripped: false },
      failureWindow: {
        size: this.failureWindow.length,
        capacity: 20,
        utilizationPercent: Math.round(this.failureWindow.length / 20 * 100),
        healthy: failureWindowHealthy
      },
      oscillation: {
        activePatterns: oscillatingEntries.length,
        details: oscillatingEntries.slice(0, 3).map(([key, entry]) => ({
          pattern: key.slice(0, 50),
          count: entry.count,
          sinceMs: Date.now() - entry.firstTs
        }))
      },
      rl: {
        healthy: rlHealthy,
        qTableSize: rlStats.qTableSize,
        historySize: rlStats.historySize
      },
      adaptation: {
        currentMaxRetries: this.maxRetries,
        currentBackoffMs: this.backoffMs,
        baseMaxRetries: this._maxRetriesBase,
        baseBackoffMs: this._backoffMsBase,
        totalAdaptations: this._adaptationLog.length,
        recentAdaptations: this._adaptationLog.slice(-3).map(a => ({
          ts: a.ts,
          before: a.before,
          after: a.after,
          reason: a.reason.category
        }))
      },
      severity: {
        distribution: snapshot.severityDistribution,
        highSeverityCount: highSeverityRatio,
        healthy: highSeverityRatio <= 5
      },
      recommendations: this._generateRecommendations(snapshot, cb)
    };
  }

  /**
   * 根据诊断结果生成建议
   * @private
   */
  _generateRecommendations(snapshot, cb) {
    const recs = [];
    if (cb.blocked) {
      recs.push('电路断路器已跳闸 — 等待冷却后自动恢复，或手动复位');
    }
    if (snapshot.severityDistribution.critical > 0) {
      recs.push(`发现${snapshot.severityDistribution.critical}个严重错误 — 建议人工审查日志`);
    }
    if (this.rl.stats().qTableSize === 0 && this.failureWindow.length > 5) {
      recs.push('Q-table为空但已有多次失败记录 — RL学习尚未生效');
    }
    if (this._adaptationLog.length > 20) {
      recs.push(`调参次数过多(${this._adaptationLog.length}次) — 参数可能不稳定`);
    }
    if (recs.length === 0) {
      recs.push('系统状态正常 — 无需要关注的异常');
    }
    return recs;
  }

  /**
   * 手动复位电路断路器
   * @returns {boolean} 是否成功复位
   */
  resetCircuitBreaker() {
    if (!this._circuitBreaker.tripped) return false;
    this._circuitBreaker.tripped = false;
    this._circuitBreaker.trippedAt = null;
    this._circuitBreaker.pattern = null;
    this.emit('circuit_breaker_reset', { source: 'manual' });
    return true;
  }

  /**
   * 清除震荡计数器（用于复位后重新开始计数）
   * @param {string} [pattern] - 可选，清除特定模式的计数
   */
  clearOscillationCounters(pattern) {
    if (pattern) {
      this._oscillationCounter.delete(pattern);
    } else {
      this._oscillationCounter.clear();
    }
  }

  /**
   * 获取调参历史
   * @param {number} [limit=10] - 返回最近N条记录
   * @returns {Object[]} 调参历史
   */
  getAdaptationHistory(limit = 10) {
    return this._adaptationLog.slice(-limit).map(a => ({
      at: new Date(a.ts).toISOString(),
      before: a.before,
      after: a.after,
      reason: a.reason
    }));
  }
}

module.exports = { SelfHealing, ErrorSeverity, ErrorCategory, classifyError };
