/**
 * HeartFlow 错误处理器 v2.0.27
 * 统一捕获和处理系统异常
 * 增强：错误类型细分 + 严重等级 + 恢复建议 + 去重/限流/震荡检测/自动重试
 *
 * v2.0.27 新增:
 *   - ErrorDedup: 相同错误连续出现时自动折叠去重（含时间窗口合并）
 *   - RateLimiter: 单位时间窗口内的错误爆发检测与静默抑制
 *   - OscillationDetector: 交替错误类型震荡检测（如 timeout↔memory↔timeout）
 *   - RetryEngine: 自动重试执行器，支持指数退避 + 最大重试次数
 *   - CorrelationEngine: 关联分析，将相似历史错误链接到新记录
 */

const fs = require('fs');
const path = require('path');

const ERROR_LOG = path.join(__dirname, 'error-handler.log');

// 敏感信息过滤规则
const SENSITIVE_PATTERNS = [
  { pattern: /\/[a-zA-Z0-9_\-./]+(\/|[a-zA-Z0-9_\-.\/])/g, replacement: '[PATH]' },
  { pattern: /(sk-|pk-|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}/gi, replacement: '[API_KEY]' },
  { pattern: /(PASSWORD|SECRET|TOKEN|AUTH)[=:]\s*[^\s]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' }
];

/**
 * 错误去重器 — 检测并折叠相同错误
 */
class ErrorDedup {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;          // 1分钟窗口
    this.maxDedupCount = options.maxDedupCount || 20;    // 最多折叠20次
    this._lastErrorKey = null;                           // 上一次错误的签名
    this._dedupCount = 0;                                // 当前折叠计数
    this._windowStart = 0;                               // 窗口开始时间
    this._totalSuppressed = 0;                           // 总抑制计数
  }

  /**
   * 生成错误签名（用于去重比较）
   */
  _makeKey(errorRecord) {
    // 使用 type + severity + message 前 100 字符作为签名
    const msg = (errorRecord.message || '').slice(0, 100);
    return `${errorRecord.type}|${errorRecord.severity}|${msg}`;
  }

  /**
   * 检查是否应抑制此错误（去重）
   * @returns {{ suppressed: boolean, count: number, record: object|null }}
   *   suppressed=true 时返回折叠统计的 record
   */
  check(errorRecord) {
    const key = this._makeKey(errorRecord);
    const now = Date.now();

    // 新错误或窗口过期 → 重置
    if (key !== this._lastErrorKey || (now - this._windowStart) > this.windowMs) {
      this._lastErrorKey = key;
      this._dedupCount = 1;
      this._windowStart = now;
      return { suppressed: false, count: 1, record: errorRecord };
    }

    // 同一错误，窗口内
    this._dedupCount++;
    this._totalSuppressed++;

    // 达到最大折叠数 → 作为新记录触发（重置计数）
    if (this._dedupCount > this.maxDedupCount) {
      const newRecord = {
        ...errorRecord,
        dedupBurstReset: true,
        dedupCount: this._dedupCount,
        message: `${errorRecord.message} [去重爆发: 已折叠 ${this._dedupCount} 次]`
      };
      this._dedupCount = 1;
      this._windowStart = now;
      return { suppressed: false, count: this._dedupCount, record: newRecord };
    }

    // 折叠次数超过阈值但未达爆发 → 定期输出合并摘要
    const outputEvery = Math.min(5, this.maxDedupCount);
    if (this._dedupCount === 2 || this._dedupCount % outputEvery === 0) {
      const mergedRecord = {
        ...errorRecord,
        dedupMerged: true,
        dedupCount: this._dedupCount,
        message: `${errorRecord.message} [+${this._dedupCount} 次相同错误]`
      };
      return { suppressed: false, count: this._dedupCount, record: mergedRecord };
    }

    return { suppressed: true, count: this._dedupCount, record: null };
  }

  /** 重置去重状态 */
  reset() {
    this._lastErrorKey = null;
    this._dedupCount = 0;
    this._windowStart = 0;
  }

  /** 获取统计 */
  getStats() {
    return { totalSuppressed: this._totalSuppressed, currentDedupCount: this._dedupCount };
  }
}

/**
 * 错误限流器 — 爆发检测与静默抑制
 */
class RateLimiter {
  constructor(options = {}) {
    this.burstWindow = options.burstWindow || 5000;        // 5秒爆发窗口
    this.burstThreshold = options.burstThreshold || 10;    // 5秒内超过10次→爆发
    this.cooldownMs = options.cooldownMs || 30000;         // 爆发后冷却30秒
    this._timestamps = [];                                 // 时间戳环形缓冲
    this._burstActive = false;                             // 是否处于爆发模式
    this._burstStart = 0;                                  // 爆发开始时间
    this._cooldownUntil = 0;                               // 冷却截止时间
    this._totalRateLimited = 0;                            // 总限流计数
  }

  /**
   * 检查是否应限流此错误
   * @returns {{ limited: boolean, burst: boolean, cooldown: boolean }}
   */
  check() {
    const now = Date.now();

    // 冷却中 → 限流
    if (this._cooldownUntil > now) {
      this._totalRateLimited++;
      return { limited: true, burst: true, cooldown: true };
    }

    // 维护滑动窗口时间戳
    this._timestamps = this._timestamps.filter(t => (now - t) < this.burstWindow);
    this._timestamps.push(now);

    // 检测爆发
    if (this._timestamps.length >= this.burstThreshold) {
      this._burstActive = true;
      this._burstStart = now;
      this._cooldownUntil = now + this.cooldownMs;
      this._timestamps = [];  // 清空窗口
      this._totalRateLimited++;
      return { limited: true, burst: true, cooldown: false };
    }

    this._burstActive = false;
    return { limited: false, burst: false, cooldown: false };
  }

  /** 重置限流状态 */
  reset() {
    this._timestamps = [];
    this._burstActive = false;
    this._burstStart = 0;
    this._cooldownUntil = 0;
  }

  /** 获取统计 */
  getStats() {
    return {
      totalRateLimited: this._totalRateLimited,
      burstActive: this._burstActive,
      cooldownRemaining: Math.max(0, this._cooldownUntil - Date.now())
    };
  }
}

/**
 * 错误震荡检测器 — 检测交替变化的错误模式
 */
class OscillationDetector {
  constructor(options = {}) {
    this.historySize = options.historySize || 10;          // 最近N条错误
    this.oscillationThreshold = options.oscillationThreshold || 0.6; // 震荡度阈值
    this._history = [];                                    // 错误类型环形缓冲
  }

  /**
   * 检测最近错误是否在震荡（类型快速交替变化）
   * @param {string} errorType - 当前错误类型
   * @returns {{ oscillating: boolean, oscillationScore: number, pattern: string[] }}
   */
  detect(errorType) {
    this._history.push(errorType);
    if (this._history.length > this.historySize) {
      this._history.shift();
    }

    if (this._history.length < 4) {
      return { oscillating: false, oscillationScore: 0, pattern: [...this._history] };
    }

    // 计算震荡度: 相邻不同/总相邻数
    let changes = 0;
    for (let i = 1; i < this._history.length; i++) {
      if (this._history[i] !== this._history[i - 1]) changes++;
    }
    const oscillationScore = changes / (this._history.length - 1);

    // 检测是否只有2-3种类型在快速交替
    const uniqueTypes = new Set(this._history);
    const fewTypes = uniqueTypes.size >= 2 && uniqueTypes.size <= 3;

    // 检测短时间内高变化率
    const recentChanges = this._history.slice(-4);
    let recentChangeCount = 0;
    for (let i = 1; i < recentChanges.length; i++) {
      if (recentChanges[i] !== recentChanges[i - 1]) recentChangeCount++;
    }

    const oscillating = oscillationScore >= this.oscillationThreshold && fewTypes && recentChangeCount >= 2;

    return {
      oscillating,
      oscillationScore: Math.round(oscillationScore * 100) / 100,
      pattern: [...this._history]
    };
  }

  /** 重置 */
  reset() {
    this._history = [];
  }

  /** 获取统计 */
  getStats() {
    return {
      historySize: this._history.length,
      uniqueTypes: new Set(this._history).size,
      pattern: [...this._history]
    };
  }
}

/**
 * 自动重试引擎 — 基于错误类型的指数退避重试
 */
class RetryEngine {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;            // 基础延迟1秒
    this.maxDelay = options.maxDelay || 30000;             // 最大延迟30秒
    this.jitter = options.jitter || 0.3;                   // 抖动系数 ±30%
    this.retryableTypes = options.retryableTypes || [
      'timeout', 'network', 'permission', 'memory'
    ];
    this._retryCounters = {};                              // type → { attempts, lastAttempt }
  }

  /**
   * 判断错误类型是否可重试
   */
  isRetryable(type) {
    return this.retryableTypes.includes(type);
  }

  /**
   * 计算下次重试延迟（指数退避 + 抖动）
   * @param {string} type - 错误类型
   * @returns {{ shouldRetry: boolean, delayMs: number, attempt: number }}
   */
  getRetryPlan(type) {
    if (!this.isRetryable(type)) {
      return { shouldRetry: false, delayMs: 0, attempt: 0 };
    }

    const counter = this._retryCounters[type] || { attempts: 0, lastAttempt: 0 };
    counter.attempts++;

    if (counter.attempts > this.maxRetries) {
      return { shouldRetry: false, delayMs: 0, attempt: counter.attempts - 1 };
    }

    // 指数退避: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.baseDelay * Math.pow(2, counter.attempts - 1);
    const clampedDelay = Math.min(exponentialDelay, this.maxDelay);

    // 添加抖动
    const jitterAmount = clampedDelay * this.jitter;
    const jitteredDelay = Math.round(clampedDelay + (Math.random() * 2 - 1) * jitterAmount);

    counter.lastAttempt = Date.now();
    this._retryCounters[type] = counter;

    return {
      shouldRetry: true,
      delayMs: Math.max(100, jitteredDelay),  // 至少100ms
      attempt: counter.attempts
    };
  }

  /**
   * 重置指定类型的重试计数
   */
  reset(type) {
    if (type) {
      delete this._retryCounters[type];
    } else {
      this._retryCounters = {};
    }
  }

  /**
   * 获取重试统计
   */
  getStats() {
    const total = Object.values(this._retryCounters).reduce((s, c) => s + c.attempts, 0);
    return { totalRetries: total, byType: { ...this._retryCounters } };
  }
}

/**
 * 错误关联引擎 — 将相似错误链接到历史记录
 */
class CorrelationEngine {
  constructor(options = {}) {
    this.similarityThreshold = options.similarityThreshold || 0.7;  // 相似度阈值
    this.maxHistory = options.maxHistory || 100;
    this._history = [];   // [{ type, message, timestamp, typeSignature }]
  }

  /**
   * 注册一条错误到关联历史
   */
  record(errorRecord) {
    this._history.push({
      type: errorRecord.type,
      severity: errorRecord.severity,
      message: errorRecord.message,
      timestamp: errorRecord.timestamp || Date.now(),
      typeSignature: `${errorRecord.type}:${(errorRecord.message || '').slice(0, 60)}`
    });
    if (this._history.length > this.maxHistory) {
      this._history.shift();
    }
  }

  /**
   * 查找与当前错误相关的历史记录
   * @returns {{ correlated: boolean, related: object[], matchCount: number }}
   */
  findRelated(errorRecord) {
    const typeSignature = `${errorRecord.type}:${(errorRecord.message || '').slice(0, 60)}`;

    // 查找相同 typeSignature 的历史记录
    const exactMatches = this._history.filter(
      h => h.typeSignature === typeSignature && h.timestamp < (errorRecord.timestamp || Date.now())
    );

    // 查找同类型的历史记录
    const typeMatches = this._history.filter(
      h => h.type === errorRecord.type && h.timestamp < (errorRecord.timestamp || Date.now())
    );

    // 查找最近30秒内的同类型错误（并发相关）
    const now = errorRecord.timestamp || Date.now();
    const recentMatches = this._history.filter(
      h => h.type === errorRecord.type && (now - h.timestamp) < 30000
    );

    const related = [];
    const seen = new Set();

    for (const item of [...exactMatches, ...typeMatches, ...recentMatches]) {
      const key = `${item.typeSignature}|${item.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        related.push(item);
      }
    }

    return {
      correlated: related.length > 0,
      related: related.slice(0, 5),  // 最多返回5条
      matchCount: related.length,
      recentConcurrentCount: recentMatches.length,
      firstOccurrence: related.length > 0 ? related[related.length - 1] : null
    };
  }

  /**
   * 获取关联统计
   */
  getStats() {
    // 按类型统计
    const byType = {};
    for (const h of this._history) {
      byType[h.type] = (byType[h.type] || 0) + 1;
    }
    return { totalRecords: this._history.length, byType };
  }
}

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxHistory = 100;
    this._counters = {
      totalCaptured: 0,
      byType: {},
      bySeverity: { critical: 0, warning: 0, info: 0 }
    };
    
    // v2.0.27: 子引擎
    this._dedup = new ErrorDedup();
    this._rateLimiter = new RateLimiter();
    this._oscillation = new OscillationDetector();
    this._retry = new RetryEngine();
    this._correlation = new CorrelationEngine();

    // 判断是否生产环境
    this.isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.HEARTFLOW_ENV === 'production';
  }

  /**
   * 过滤敏感信息
   * @private
   */
  _filterSensitiveInfo(text) {
    if (!text || typeof text !== 'string') return text;
    
    let filtered = text;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      filtered = filtered.replace(pattern, replacement);
    }
    return filtered;
  }

  /**
   * 严重等级：critical > warning > info
   */
  _getSeverity(error) {
    const msg = (error.message || '').toLowerCase();
    const criticalPatterns = [
      'out of memory', 'oom', 'heap', 'fatal', 'crash',
      'econnrefused', 'eaddrnotavail', 'ENOENT', 'EBADF'
    ];
    const warningPatterns = [
      'timeout', 'eagain', 'eagain', 'permission', 'access denied',
      'network', 'connection refused', 'ECONNRESET', 'ETIMEDOUT'
    ];
    for (const p of criticalPatterns) {
      if (msg.includes(p)) return 'critical';
    }
    for (const p of warningPatterns) {
      if (msg.includes(p)) return 'warning';
    }
    return 'info';
  }

  /**
   * 捕获并记录错误
   * v2.0.27: 集成去重 → 限流 → 震荡检测 → 关联分析 → 重试计划
   */
  capture(error, context = {}) {
    const type = this.classifyError(error);
    const severity = this._getSeverity(error);

    const safeMessage = this._filterSensitiveInfo(error.message || String(error));
    const safeStack = this.isProduction ? null : this._filterSensitiveInfo(error.stack);
    const safeContext = this._filterSensitiveInfoInContext(context);

    const errorRecord = {
      timestamp: Date.now(),
      message: safeMessage,
      stack: safeStack,
      context: safeContext,
      type,
      severity,
      recovery: this.getRecoverySuggestion(type, error)
    };

    // === 步骤1: 去重检测 ===
    const dedupResult = this._dedup.check(errorRecord);
    if (dedupResult.suppressed) {
      // 去重折叠：不记录、不触发震荡/关联/重试
      return {
        suppressed: true,
        reason: 'dedup',
        dedupCount: dedupResult.count,
        originalType: type
      };
    }
    // 使用去重后的 record（可能包含合并摘要）
    const actualRecord = dedupResult.record || errorRecord;

    // === 步骤2: 限流检测 ===
    const rateLimitResult = this._rateLimiter.check();
    if (rateLimitResult.limited) {
      const suppressedRecord = {
        ...actualRecord,
        suppressed: true,
        suppressionReason: 'rate_limit',
        burstActive: rateLimitResult.burst,
        cooldownActive: rateLimitResult.cooldown,
        message: `${actualRecord.message} [错误爆发抑制中]`
      };
      this._counters.totalCaptured++;
      this._counters.byType[type] = (this._counters.byType[type] || 0) + 1;
      this._counters.bySeverity[severity]++;
      this.errors.push(suppressedRecord);
      if (this.errors.length > this.maxHistory) this.errors.shift();
      this.logError(suppressedRecord);
      return suppressedRecord;
    }

    // === 步骤3: 震荡检测 ===
    const oscResult = this._oscillation.detect(type);
    if (oscResult.oscillating) {
      actualRecord.oscillationDetected = true;
      actualRecord.oscillationScore = oscResult.oscillationScore;
      actualRecord.oscillationPattern = oscResult.pattern;
      // 震荡模式下附加恢复建议
      actualRecord.recovery += ' [检测到错误震荡: 建议检查基础依赖或重启系统]';
    }

    // === 步骤4: 关联分析 ===
    const correlationResult = this._correlation.findRelated(actualRecord);
    if (correlationResult.correlated) {
      actualRecord.correlated = true;
      actualRecord.correlationCount = correlationResult.matchCount;
      actualRecord.relatedErrorTimestamps = correlationResult.related.map(r => r.timestamp);
      if (correlationResult.firstOccurrence) {
        actualRecord.firstOccurrenceAt = correlationResult.firstOccurrence.timestamp;
      }
    }

    // === 步骤5: 重试计划 ===
    const retryPlan = this._retry.getRetryPlan(type);
    if (retryPlan.shouldRetry) {
      actualRecord.retrySuggested = true;
      actualRecord.retryAttempt = retryPlan.attempt;
      actualRecord.retryDelayMs = retryPlan.delayMs;
      actualRecord.retryAfter = Date.now() + retryPlan.delayMs;
    }

    // 注册到关联历史
    this._correlation.record(actualRecord);

    // 记录到内部缓冲区
    this.errors.push(actualRecord);
    if (this.errors.length > this.maxHistory) {
      this.errors.shift();
    }

    this._counters.totalCaptured++;
    this._counters.byType[type] = (this._counters.byType[type] || 0) + 1;
    this._counters.bySeverity[severity]++;

    this.logError(actualRecord);
    return actualRecord;
  }

  /**
   * 过滤上下文中的敏感信息
   * @private
   */
  _filterSensitiveInfoInContext(context) {
    if (!context || typeof context !== 'object') return context;
    
    const filtered = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        filtered[key] = this._filterSensitiveInfo(value);
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = this._filterSensitiveInfoInContext(value);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * 根据错误类型给出恢复建议
   */
  getRecoverySuggestion(type, error) {
    const msg = (error.message || '').toLowerCase();
    const suggestions = {
      timeout: '检查网络连接或增加超时阈值；如持续出现考虑服务降级',
      memory: '触发GC或重启进程；长期方案：优化数据结构或增加内存限制',
      permission: '检查文件/目录权限；Unix系统运行 chmod/chown；Windows检查ACL',
      network: '检查网络连通性、端口是否开放、防火墙规则',
      syntax: `检查代码语法错误：${msg.includes('unexpected') ? '发现意外的令牌' : 'JSON/JS语法问题'}`,
      json: 'JSON.parse 失败——检查JSON格式（引号、逗号、括号配对）',
      module: '模块未找到——确认模块已安装且路径正确',
      file_not_found: '文件不存在——检查路径是否正确，是否有读写权限',
      unknown: '未知错误——查看 stack trace 定位问题'
    };
    return suggestions[type] || suggestions.unknown;
  }

  /**
   * 分类错误
   */
  classifyError(error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    if (msg.includes('out of memory') || msg.includes('heap')) return 'memory';
    if (msg.includes('permission') || msg.includes('eacces') || msg.includes('access denied')) return 'permission';
    if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('connection refused') || msg.includes('connection reset') || msg.includes('etimedout') || msg.includes('connection timed out')) return 'network';
    if (msg.includes('syntax')) return 'syntax';
    if (msg.includes('json') || msg.includes('unexpected token') || msg.includes('parse error')) return 'json';
    if (msg.includes('cannot find module') || msg.includes('module not found')) return 'module';
    if (msg.includes('enoent') || msg.includes('no such file')) return 'file_not_found';
    return 'unknown';
  }

  /**
   * 记录错误到文件
   */
  logError(record) {
    const safeMessage = this._filterSensitiveInfo(record.message);
    const safeRecovery = this._filterSensitiveInfo(record.recovery);
    
    // v2.0.27: 附加状态标签
    const tags = [];
    if (record.suppressed) tags.push('SUPPRESSED');
    if (record.dedupMerged) tags.push(`DEDUPx${record.dedupCount}`);
    if (record.oscillationDetected) tags.push('OSCILLATION');
    if (record.correlated) tags.push(`CORRELATEDx${record.correlationCount}`);
    if (record.retrySuggested) tags.push(`RETRY#${record.retryAttempt}`);
    const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

    const entry = `[${new Date(record.timestamp).toISOString()}] [${record.severity.toUpperCase()}] ${record.type}: ${safeMessage}${tagStr}\n  recovery: ${safeRecovery}\n`;
    
    try {
      fs.appendFileSync(ERROR_LOG, entry);
    } catch (e) {
      // [PROD] 生产环境移除 console.error: console.error('[ErrorHandler] 无法写入日志:', e.message);
    }
  }

  /**
   * 获取错误历史
   */
  getHistory(count = 10) {
    const history = this.errors.slice(-count);
    return history.map(record => ({
      ...record,
      message: this._filterSensitiveInfo(record.message),
      stack: this.isProduction ? '[REDACTED_IN_PRODUCTION]' : record.stack
    }));
  }

  /**
   * 获取错误统计
   * v2.0.27: 包含子引擎统计
   */
  getStats() {
    const stats = {};
    for (const e of this.errors) {
      stats[e.type] = (stats[e.type] || 0) + 1;
    }
    return {
      ...stats,
      counters: this._counters,
      dedup: this._dedup.getStats(),
      rateLimiter: this._rateLimiter.getStats(),
      oscillation: this._oscillation.getStats(),
      retry: this._retry.getStats(),
      correlation: this._correlation.getStats()
    };
  }

  /**
   * v2.0.27: 获取详细的错误健康报告
   * 整合所有子引擎的分析结果
   */
  getHealthReport() {
    const dedupStats = this._dedup.getStats();
    const rateStats = this._rateLimiter.getStats();
    const oscStats = this._oscillation.getStats();
    const retryStats = this._retry.getStats();
    const corrStats = this._correlation.getStats();

    const total = this._counters.totalCaptured;
    const suppressed = dedupStats.totalSuppressed + rateStats.totalRateLimited;
    const errorRate = total > 0 ? Math.round((suppressed / total) * 100) : 0;

    // 生成健康状态
    let status = 'healthy';
    let issues = [];

    if (rateStats.burstActive) {
      status = 'degraded';
      issues.push('错误爆发模式激活，系统可能不稳定');
    }
    if (oscStats.uniqueTypes >= 2 && oscStats.historySize >= 4) {
      status = status === 'degraded' ? 'critical' : 'degraded';
      issues.push('检测到多种错误类型交替出现，可能有系统性故障');
    }
    if (suppressed > 100) {
      status = 'degraded';
      issues.push(`已抑制 ${suppressed} 条重复/爆发错误，日志噪音高`);
    }
    if (retryStats.totalRetries > 10) {
      status = 'degraded';
      issues.push(`自动重试 ${retryStats.totalRetries} 次，部分操作可能不稳定`);
    }

    return {
      status,
      totalErrors: total,
      suppressedErrors: suppressed,
      errorSuppressionRate: `${errorRate}%`,
      issues: issues.length > 0 ? issues : ['无异常'],
      dedup: dedupStats,
      rateLimiter: rateStats,
      oscillation: {
        uniqueTypes: oscStats.uniqueTypes,
        recentPattern: oscStats.pattern.slice(-5)
      },
      retry: retryStats,
      correlation: {
        totalRecords: corrStats.totalRecords,
        topTypes: Object.entries(corrStats.byType)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      }
    };
  }

  /**
   * v2.0.27: 清除所有子引擎的状态
   */
  resetAll() {
    this.errors = [];
    this._counters = { totalCaptured: 0, byType: {}, bySeverity: { critical: 0, warning: 0, info: 0 } };
    this._dedup.reset();
    this._rateLimiter.reset();
    this._oscillation.reset();
    this._retry.reset();
    return { reset: true, timestamp: Date.now() };
  }
}

module.exports = new ErrorHandler();
