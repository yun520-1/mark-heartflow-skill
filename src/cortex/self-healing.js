/**
 * HeartFlow Self-Healing v11.5.7
 * 
 * Recovery loop with RL-based repair strategy learning.
 * - detect repeated failures
 * - classify recovery path
 * - emit concrete repair hints
 * - learn from repair outcomes (Q-learning)
 * - failure severity classification & oscillation detection
 * - recovery quality scoring & adaptive epsilon feedback
 * 
 * Paper: Reflexion (2023), CRITIC (2024)
 */

const { HealingMemoryRL } = require('./self-healing-rl.js');
const EventEmitter = require('events');

// ============================================================================
// 故障严重性分类枚举
// ============================================================================
const FailureSeverity = {
  CRITICAL:  { level: 'critical',  score: 5, autoRetry: false, description: '系统级故障，需人工介入' },
  HIGH:      { level: 'high',      score: 4, autoRetry: false, description: '核心功能故障，需人工或备用方案' },
  MEDIUM:    { level: 'medium',    score: 3, autoRetry: true,  description: '非核心功能故障，可自动修复' },
  LOW:       { level: 'low',       score: 2, autoRetry: true,  description: '轻微故障，自动重试即可' },
  TRANSIENT: { level: 'transient', score: 1, autoRetry: true,  description: '临时故障，重试大概率成功' }
};

// 错误模式 → 严重性映射表
const SEVERITY_MAP = [
  { pattern: /fatal|crash|panic|segfault|oom|out of memory/i, severity: FailureSeverity.CRITICAL },
  { pattern: /auth|permission|denied|forbidden|401|403/i,      severity: FailureSeverity.HIGH },
  { pattern: /corrupt|invalid.*format|schema|validation/i,     severity: FailureSeverity.HIGH },
  { pattern: /syntax|parse|unexpected token|referenceerror/i,  severity: FailureSeverity.MEDIUM },
  { pattern: /not found|cannot find|enoent|module not found/i, severity: FailureSeverity.MEDIUM },
  { pattern: /econnreset|econnrefused|eaddrinuse|eai_again/i,  severity: FailureSeverity.MEDIUM },
  { pattern: /timeout|timed out|eagain/i,                      severity: FailureSeverity.TRANSIENT },
  { pattern: /rate limit|429|throttle|too many requests/i,     severity: FailureSeverity.TRANSIENT },
  { pattern: /busy|temporar|unavailable|503|502|504/i,         severity: FailureSeverity.TRANSIENT }
];

// 修复策略效果等级
const RepairEffectiveness = {
  EXCELLENT:  { label: 'excellent',  score: 5, description: '一次修复，后续无复发' },
  GOOD:       { label: 'good',       score: 4, description: '修复成功但有轻微复发' },
  MODERATE:   { label: 'moderate',   score: 3, description: '部分缓解但未根除' },
  POOR:       { label: 'poor',       score: 2, description: '修复后很快复发' },
  FAILED:     { label: 'failed',     score: 1, description: '修复完全无效' }
};

class SelfHealing extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries ?? 2;
    this.backoffMs = options.backoffMs ?? 150;
    this.failureWindow = [];
    this.rl = new HealingMemoryRL(options.maxMemory ?? 100);
    this.learnedMemory = new Map(); // pattern -> { strategy, qValue }
    this._pendingCtx = new Map(); // pending repair attempts for RL update

    // ===== v11.5.7 新增：振荡检测与恢复质量追踪 =====
    /** @type {Map<string, {timestamps: number[], count: number, lastRecovery: number|null}>} */
    this._oscillationTracker = new Map(); // pattern -> oscillation stats
    /** 振荡阈值：同一模式在N秒内出现M次以上视为振荡 */
    this.oscillationWindowMs = options.oscillationWindowMs ?? 60000; // 60秒
    this.oscillationThreshold = options.oscillationThreshold ?? 3;   // 3次
    /** 恢复质量滚动窗口 */
    this._recoveryQualityWindow = []; // {ts, pattern, strategy, success, severity}
    this.maxQualitySamples = options.maxQualitySamples ?? 50;
    /** 自适应epsilon反馈：最近恢复率低时自动提高探索率 */
    this._adaptiveEpsilonEnabled = options.adaptiveEpsilon ?? true;

    // ===== Lightweight Policy Cache (qingkong66 #1446 反馈：Q-table RL → No lightweight learning) =====
    /** @type {Map<string, {policy: object, ts: number}>} */
    this._lightweightPolicyCache = new Map();
    this._policyCacheTtlMs = options.policyCacheTtlMs ?? 300000; // 5 分钟
  }

  /** 从缓存获取相似场景策略 */
  getCachedPolicy(ctx = {}) {
    const key = this._getPolicyCacheKey(ctx);
    const entry = this._lightweightPolicyCache.get(key);
    if (entry && Date.now() - entry.ts < this._policyCacheTtlMs) {
      return entry.policy;
    }
    return null;
  }

  /** 写入策略缓存 */
  setCachedPolicy(ctx = {}, policy = {}) {
    const key = this._getPolicyCacheKey(ctx);
    this._lightweightPolicyCache.set(key, { policy, ts: Date.now() });
  }

  /** 简化签名：errorType + module + severity band */
  _getPolicyCacheKey(ctx = {}) {
    const e = String(ctx.errorType || ctx.error || 'unknown').slice(0, 30);
    const m = String(ctx.module || 'unknown').slice(0, 20);
    const s = Math.floor((Number(ctx.severity) || 0) * 10);
    return `${e}|${m}|${s}`;
  }

  // ===== Provider Health Check (qingkong66 #1446 反馈：Provider 健康检查) =====
  /** @type {Map<string, {healthy: boolean, lastCheck: number, latency: number, errors: number}>} */
  _providerHealth = new Map();
  _providerHealthTtlMs = 60000; // 1 分钟缓存

  /**
   * 记录 provider 调用结果
   * @param {string} providerName
   * @param {object} result - { success: boolean, latency: number, error?: string }
   */
  recordProviderCall(providerName = 'default', result = {}) {
    const entry = this._providerHealth.get(providerName) || {
      healthy: true, lastCheck: 0, latency: 0, errors: 0, total: 0
    };
    entry.total = (entry.total || 0) + 1;
    entry.lastCheck = Date.now();
    entry.latency = result.latency || 0;
    if (result.success === false) {
      entry.errors = (entry.errors || 0) + 1;
      entry.healthy = entry.errors < 3; // 连续3次失败标记为不健康
    } else {
      entry.errors = 0;
      entry.healthy = true;
    }
    this._providerHealth.set(providerName, entry);
  }

  /**
   * 获取 provider 健康状态
   * @param {string} providerName
   * @returns {object} { healthy, latency, errorRate, recommendation }
   */
  getProviderHealth(providerName = 'default') {
    const entry = this._providerHealth.get(providerName);
    if (!entry || Date.now() - entry.lastCheck > this._providerHealthTtlMs) {
      return { healthy: true, latency: 0, errorRate: 0, recommendation: 'no-data' };
    }
    const errorRate = entry.total > 0 ? entry.errors / entry.total : 0;
    let recommendation = 'use';
    if (!entry.healthy) recommendation = 'failover';
    else if (errorRate > 0.3) recommendation = 'degraded';
    else if (entry.latency > 5000) recommendation = 'slow';
    return { healthy: entry.healthy, latency: entry.latency, errorRate, recommendation };
  }

  // ===== Cost Tracking (Smart Routing 反馈：成本追踪闭环) =====
  /** @type {Array<{ts: number, provider: string, tokensIn: number, tokensOut: number, cost: number, taskType: string}>} */
  _costLog = [];
  _costWindowSize = 100;

  /**
   * 记录单次 LLM 调用成本
   * @param {object} metrics - { provider, tokensIn, tokensOut, cost, taskType }
   */
  recordCost(metrics = {}) {
    const entry = {
      ts: Date.now(),
      provider: metrics.provider || 'unknown',
      tokensIn: Number(metrics.tokensIn || 0),
      tokensOut: Number(metrics.tokensOut || 0),
      cost: Number(metrics.cost || 0),
      taskType: metrics.taskType || 'unknown',
    };
    this._costLog.push(entry);
    if (this._costLog.length > this._costWindowSize) {
      this._costLog = this._costLog.slice(-this._costWindowSize);
    }
  }

  /**
   * 获取成本统计
   * @param {string} window - 'hour' | 'day' | 'all'
   * @returns {object} { totalCost, totalTokens, callCount, avgCostPerCall, byProvider }
   */
  getCostStats(window = 'all') {
    const now = Date.now();
    const windowMs = window === 'hour' ? 3600000 : window === 'day' ? 86400000 : 0;
    const entries = windowMs > 0
      ? this._costLog.filter(e => now - e.ts < windowMs)
      : this._costLog;

    const stats = {
      totalCost: 0, totalTokens: 0, callCount: entries.length,
      avgCostPerCall: 0, byProvider: {}
    };
    for (const e of entries) {
      stats.totalCost += e.cost;
      stats.totalTokens += e.tokensIn + e.tokensOut;
      const p = stats.byProvider[e.provider] || { calls: 0, cost: 0, tokens: 0 };
      p.calls += 1; p.cost += e.cost; p.tokens += e.tokensIn + e.tokensOut;
      stats.byProvider[e.provider] = p;
    }
    stats.avgCostPerCall = stats.callCount > 0 ? stats.totalCost / stats.callCount : 0;
    return stats;
  }


  /**
   * 分类故障严重性
   * @param {Error|string|Object} errorLike
   * @returns {object} { severity: FailureSeverity, reason: string }
   */
  classifyFailure(errorLike = {}) {
    const normalized = this.normalizeError(errorLike);
    const message = normalized.message;
    const code = normalized.code;

    // 检查错误码映射
    if (code) {
      const codeNum = Number(code);
      if ([500, 502, 503, 504].includes(codeNum)) {
        return { severity: FailureSeverity.TRANSIENT, reason: `HTTP ${code} 服务端临时故障` };
      }
      if ([401, 403].includes(codeNum)) {
        return { severity: FailureSeverity.HIGH, reason: `HTTP ${code} 认证/授权失败` };
      }
      if ([408, 429].includes(codeNum)) {
        return { severity: FailureSeverity.TRANSIENT, reason: `HTTP ${code} 请求超时/限流` };
      }
      if (codeNum >= 400 && codeNum < 500) {
        return { severity: FailureSeverity.MEDIUM, reason: `HTTP ${code} 客户端错误` };
      }
    }

    // 按模式匹配
    for (const entry of SEVERITY_MAP) {
      if (entry.pattern.test(message)) {
        return { severity: entry.severity, reason: `${entry.severity.description}: ${entry.pattern.source.slice(0, 40)}` };
      }
    }

    // 默认回退：transient 判断
    if (normalized.transient) {
      return { severity: FailureSeverity.TRANSIENT, reason: '检测为临时性故障' };
    }

    return { severity: FailureSeverity.LOW, reason: '未分类故障，默认轻微' };
  }

  /**
   * 振荡检测：同一错误模式在时间窗口内反复出现
   * @param {string} pattern - 归一化后的错误消息
   * @returns {object} { oscillating: boolean, count: number, severity: string }
   */
  detectOscillation(pattern) {
    if (!pattern) return { oscillating: false, count: 0, severity: 'none' };

    const now = Date.now();
    let stats = this._oscillationTracker.get(pattern);
    if (!stats) {
      stats = { timestamps: [], count: 0, lastRecovery: null };
      this._oscillationTracker.set(pattern, stats);
    }

    // 清除窗口外的时间戳
    stats.timestamps = stats.timestamps.filter(t => now - t < this.oscillationWindowMs);
    stats.timestamps.push(now);
    stats.count = stats.timestamps.length;

    const oscillating = stats.count >= this.oscillationThreshold;

    // 振荡严重性判断
    let severity = 'none';
    if (oscillating) {
      if (stats.count >= this.oscillationThreshold * 3) {
        severity = 'severe';  // 严重振荡：阈值3倍以上
      } else if (stats.count >= this.oscillationThreshold * 2) {
        severity = 'moderate'; // 中度振荡：阈值2倍
      } else {
        severity = 'mild';    // 轻度振荡：刚达阈值
      }
    }

    return { oscillating, count: stats.count, severity };
  }

  /**
   * 记录振荡事件到失败窗口
   * @param {object} oscillation - 振荡检测结果
   * @param {string} pattern - 错误模式
   */
  _recordOscillationEvent(oscillation, pattern) {
    if (!oscillation.oscillating) return;

    const event = {
      type: 'oscillation',
      pattern: pattern.slice(0, 80),
      count: oscillation.count,
      severity: oscillation.severity,
      ts: Date.now(),
      suggestion: oscillation.severity === 'severe'
        ? '严重振荡：建议切换备用策略或人工介入'
        : `振荡检测：同一错误在${Math.round(this.oscillationWindowMs/1000)}秒内出现${oscillation.count}次`
    };
    this.failureWindow.push(event);
    if (this.failureWindow.length > 20) this.failureWindow.shift();

    this.emit('oscillation', event);
  }

  /**
   * 计算恢复质量评分 (0-1)
   * 基于最近N次恢复尝试的成功率
   * @returns {object} { score: number, successRate: number, samples: number, trend: string }
   */
  calculateRecoveryQuality() {
    const window = this._recoveryQualityWindow;
    if (window.length === 0) {
      return { score: 0.5, successRate: 0, samples: 0, trend: 'unknown' };
    }

    const successes = window.filter(w => w.success).length;
    const successRate = successes / window.length;

    // 加权：最近的恢复更重要
    const weightedSum = window.reduce((sum, w, idx) => {
      const weight = (idx + 1) / window.length; // 越近权重越高
      return sum + (w.success ? weight : 0);
    }, 0);
    const weightedRate = weightedSum / (window.length * 0.5 + 0.5);

    // 趋势判断：将窗口分成前后两半
    const mid = Math.floor(window.length / 2);
    const recent = window.slice(mid);
    const older = window.slice(0, mid);
    const recentRate = recent.length > 0 ? recent.filter(w => w.success).length / recent.length : 0;
    const olderRate = older.length > 0 ? older.filter(w => w.success).length / older.length : 0;

    let trend = 'stable';
    if (recentRate > olderRate + 0.15) trend = 'improving';
    else if (recentRate < olderRate - 0.15) trend = 'degrading';

    return {
      score: parseFloat(weightedRate.toFixed(3)),
      successRate: parseFloat(successRate.toFixed(3)),
      samples: window.length,
      trend,
      recentRate: parseFloat(recentRate.toFixed(3)),
      olderRate: parseFloat(olderRate.toFixed(3))
    };
  }

  /**
   * 计算修复策略有效性排名（独立于RL Q-table）
   * @returns {object[]} 按效果排名的策略列表
   */
  rankRepairStrategies() {
    const strategyStats = new Map(); // strategy -> { attempts, successes, totalRecoveryGap }

    for (const record of this._recoveryQualityWindow) {
      const strategy = record.strategy || 'default';
      if (!strategyStats.has(strategy)) {
        strategyStats.set(strategy, { attempts: 0, successes: 0, recentOutcomes: [] });
      }
      const stats = strategyStats.get(strategy);
      stats.attempts++;
      if (record.success) stats.successes++;
      stats.recentOutcomes.push({ success: record.success, ts: record.ts });
      // 只保留最近10次
      if (stats.recentOutcomes.length > 10) stats.recentOutcomes.shift();
    }

    const ranked = [];
    for (const [strategy, stats] of strategyStats.entries()) {
      const successRate = stats.attempts > 0 ? stats.successes / stats.attempts : 0;
      // 加权：最近5次比整体成功率更重要
      const recentSuccesses = stats.recentOutcomes.filter(o => o.success).length;
      const recentRate = stats.recentOutcomes.length > 0
        ? recentSuccesses / stats.recentOutcomes.length
        : 0;
      // 综合评分：60%最近表现 + 40%整体表现
      const compositeScore = stats.recentOutcomes.length > 0
        ? recentRate * 0.6 + successRate * 0.4
        : successRate;
      ranked.push({
        strategy,
        attempts: stats.attempts,
        successRate: parseFloat(successRate.toFixed(3)),
        recentRate: parseFloat(recentRate.toFixed(3)),
        compositeScore: parseFloat(compositeScore.toFixed(3))
      });
    }

    return ranked.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * 获取自适应epsilon建议
   * 恢复质量差 → 提高探索率
   * 恢复质量好 → 保持/降低探索率
   * @returns {object} epsilon建议
   */
  getAdaptiveEpsilonSuggestion() {
    if (!this._adaptiveEpsilonEnabled) {
      return { suggested: null, reason: '自适应epsilon已禁用' };
    }

    const quality = this.calculateRecoveryQuality();
    const currentEpsilon = this.rl.epsilon;
    let suggested = currentEpsilon;
    let reason = '';

    if (quality.samples < 5) {
      return { suggested: currentEpsilon, reason: '样本不足( < 5)，保持当前探索率' };
    }

    if (quality.trend === 'degrading') {
      // 恢复质量下降 → 提高探索率尝试新策略
      suggested = Math.min(0.5, currentEpsilon * 1.5);
      reason = `恢复质量下降(${quality.recentRate} < ${quality.olderRate})，提高探索率至${(suggested*100).toFixed(0)}%`;
    } else if (quality.trend === 'improving') {
      // 恢复质量提升 → 保持或略微降低探索率
      suggested = Math.max(0.01, currentEpsilon * 0.9);
      reason = `恢复质量提升(${quality.recentRate} > ${quality.olderRate})，降低探索率至${(suggested*100).toFixed(0)}%`;
    } else {
      reason = `恢复质量稳定(${(quality.successRate*100).toFixed(0)}%)，保持探索率${(currentEpsilon*100).toFixed(0)}%`;
    }

    return {
      suggested: parseFloat(suggested.toFixed(3)),
      current: currentEpsilon,
      reason,
      quality
    };
  }

  /**
   * 根据严重性获取重试策略建议
   * @param {object} severity - FailureSeverity
   * @returns {object} 重试策略建议
   */
  getRetryStrategy(severity) {
    switch (severity.level) {
      case 'critical':
        return { action: 'halt', suggestion: '停止操作，记录完整现场，等待人工介入' };
      case 'high':
        return { action: 'fallback', suggestion: '尝试备用方案/降级模式，记录错误详情' };
      case 'medium':
        return { action: 'retry_with_repair', suggestion: '先执行修复策略，再重试' };
      case 'low':
        return { action: 'retry', suggestion: '直接重试，默认指数退避' };
      case 'transient':
        return { action: 'retry', suggestion: '指数退避重试，大概率成功' };
      default:
        return { action: 'retry', suggestion: '未知严重性，安全重试' };
    }
  }

  normalizeError(errorLike = {}) {
    if (!errorLike) return { message: '', code: null, transient: false };
    if (typeof errorLike === 'string') {
      return this.normalizeError({ message: errorLike });
    }

    const message = String(
      errorLike.message || errorLike.error || errorLike.summary || ''
    );
    const code = errorLike.code || errorLike.statusCode || errorLike.status || null;
    const transient = /timeout|econnreset|eagain|temporar|busy|rate limit|429|throttle/i.test(message)
      || [408, 423, 425, 429, 500, 502, 503, 504].includes(Number(code));

    return { message, code, transient };
  }

  record(event = {}, repairOutcome = null) {
    const normalized = this.normalizeError(event);
    const severity = this.classifyFailure(event);
    const item = {
      type: String(event.type || 'unknown'),
      message: normalized.message,
      code: normalized.code,
      transient: normalized.transient,
      severity: severity.severity.level,
      severityScore: severity.severity.score,
      ts: Date.now(),
    };
    this.failureWindow.push(item);
    if (this.failureWindow.length > 20) this.failureWindow.shift();

    // v11.5.7: 振荡检测
    if (normalized.message) {
      const oscillation = this.detectOscillation(normalized.message);
      this._recordOscillationEvent(oscillation, normalized.message);
      item.oscillation = oscillation;
    }

    // RL: 关闭修复闭环
    if (repairOutcome !== null) {
      const pending = this._pendingCtx.get(normalized.message);
      if (pending) {
        this.rl.updateFromRepair(normalized.message, pending.strategy, repairOutcome);
        this.rl.record(normalized.message, pending.strategy, repairOutcome);
        this._pendingCtx.delete(normalized.message);

        // 记录恢复质量
        this._recoveryQualityWindow.push({
          ts: Date.now(),
          pattern: normalized.message.slice(0, 80),
          strategy: pending.strategy,
          success: !!repairOutcome,
          severity: severity.severity.level
        });
        if (this._recoveryQualityWindow.length > this.maxQualitySamples) {
          this._recoveryQualityWindow.shift();
        }
      }
    }
    return item;
  }

  summarize() {
    const counts = this.failureWindow.reduce((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + 1;
      return acc;
    }, {});

    // 严重性分布统计
    const severityDist = { critical: 0, high: 0, medium: 0, low: 0, transient: 0 };
    for (const item of this.failureWindow) {
      const sev = item.severity || 'low';
      if (severityDist[sev] !== undefined) severityDist[sev]++;
    }

    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: this.failureWindow.length,
      counts,
      severityDistribution: severityDist,
      summary: top ? `${top[0]} x${top[1]}` : 'no failures',
      oscillationEvents: this.failureWindow.filter(f => f.type === 'oscillation').length,
      recoveryQuality: this.calculateRecoveryQuality(),
      strategyRanking: this.rankRepairStrategies().slice(0, 3)
    };
  }

  shouldRetry(result = {}) {
    const normalized = this.normalizeError(result);
    return normalized.transient && (result.attempt || 0) < this.maxRetries;
  }

  repairHints(result = {}) {
    const message = this.normalizeError(result).message;
    const severity = this.classifyFailure(result);
    const hints = [];

    // 根据严重性添加首要建议
    if (severity.severity.level === 'critical' || severity.severity.level === 'high') {
      hints.push('record full error context before any retry');
    }

    if (/timeout/i.test(message)) hints.push('use smaller scope or longer timeout');
    if (/rate limit|429|throttle/i.test(message)) hints.push('pause and retry with exponential backoff');
    if (/syntax|parse|unexpected token/i.test(message)) hints.push('re-read the target file and patch smaller');
    if (/module not found|cannot find/i.test(message)) hints.push('verify imports and relative paths');
    if (/unknown option|invalid option/i.test(message)) hints.push('remove unsupported CLI flags');
    if (/execution_failed|invalid_structure/i.test(message)) hints.push('force structured result output before retrying');

    // v11.5.7: 振荡检测增强提示
    const oscillation = this.detectOscillation(message);
    if (oscillation.oscillating) {
      hints.push(`oscillation detected (x${oscillation.count}): switch to alternative strategy`);
      if (oscillation.severity === 'severe') {
        hints.push('severe oscillation: consider different approach entirely');
      }
    }

    if (hints.length === 0) hints.push('reduce the failure surface and retry once');
    return [...new Set(hints)];
  }

  createRetryPlan(result = {}) {
    const attempt = Number(result.attempt || 0) + 1;
    const canRetry = this.shouldRetry({ ...result, attempt });
    const delay = this.backoffMs * Math.max(1, 2 ** (attempt - 1));
    const severity = this.classifyFailure(result);
    const retryStrategy = this.getRetryStrategy(severity.severity);

    return {
      attempt,
      canRetry: retryStrategy.action !== 'halt' && canRetry,
      delay,
      strategy: retryStrategy.action === 'halt' ? 'manual_repair' : retryStrategy.action,
      severityAction: retryStrategy.action,
      severitySuggestion: retryStrategy.suggestion,
    };
  }

  recover(result = {}) {
    const retry = this.createRetryPlan(result);
    const snapshot = this.summarize();
    const message = this.normalizeError(result).message;
    const hints = this.repairHints(result);
    const severity = this.classifyFailure(result);
    // pattern = normalized.message，贯穿 record/learn/selectAction
    const pattern = message;

    // RL: 用 Q-learning 排序策略（context-aware Q-key）
    const ranked = this.rl.getRankedStrategies(pattern);
    const rankedStrats = ranked.map(r => r.strategy);
    // Deduplicate: RL strategies first, then hints that aren't already in Q-table
    const seen = new Set(rankedStrats);
    for (const h of hints) {
      if (!seen.has(h)) seen.add(h);
    }
    const available = [...seen];

    // RL: 记录待验证的修复策略（key = message，精确匹配）
    if (available.length > 0) {
      const chosen = available[0];
      this._pendingCtx.set(message, { context: pattern, strategy: chosen, ts: Date.now() });
    }

    // 自适应epsilon建议
    const epsilonSuggestion = this.getAdaptiveEpsilonSuggestion();

    return {
      ok: !!result.ok,
      attempt: retry.attempt,
      canRetry: retry.canRetry,
      backoffMs: retry.delay,
      strategy: retry.strategy,
      severity: severity.severity.level,
      severityScore: severity.severity.score,
      severityAction: retry.severityAction,
      hints: available.slice(0, 5),
      summary: snapshot.summary,
      details: snapshot,
      next_step: retry.canRetry ? 'retry' : 'repair',
      rlStats: this.rl.stats(),
      recoveryQuality: snapshot.recoveryQuality,
      epsilonSuggestion,
      strategyRanking: snapshot.strategyRanking,
    };
  }

  /**
   * 获取振荡追踪统计
   */
  getOscillationStats() {
    const oscillating = [];
    for (const [pattern, stats] of this._oscillationTracker.entries()) {
      if (stats.count > 0) {
        oscillating.push({
          pattern: pattern.slice(0, 60),
          count: stats.count,
          lastRecovery: stats.lastRecovery ? new Date(stats.lastRecovery).toISOString() : null
        });
      }
    }
    return oscillating.sort((a, b) => b.count - a.count);
  }

  /**
   * 获取完整的恢复质量报告
   */
  getRecoveryReport() {
    return {
      quality: this.calculateRecoveryQuality(),
      strategyRanking: this.rankRepairStrategies(),
      oscillationStats: this.getOscillationStats().slice(0, 10),
      epsilonSuggestion: this.getAdaptiveEpsilonSuggestion(),
      totalRecorded: this._recoveryQualityWindow.length
    };
  }

  /**
   * 获取自愈引擎统计信息
   * v5.5.6 新增：供 introspect 使用
   */
  getStats() {
    return {
      version: '11.5.7',
      qTableSize: this.rl?.qTable?.size || 0,
      healCount: this.failureWindow.length,
      failureWindow: this.failureWindow.length,
      rlStats: this.rl?.getStats?.() || this.rl?.stats?.() || {},
      recoveryQuality: this.calculateRecoveryQuality(),
      oscillationCount: this._oscillationTracker.size,
      cachedPolicies: this._lightweightPolicyCache.size,
      providerHealth: Object.fromEntries(
        Array.from(this._providerHealth.entries()).map(([k, v]) => [k, { healthy: v.healthy, errorRate: v.errors / Math.max(1, v.total) }])
      ),
    };
  }
}

module.exports = { SelfHealing, FailureSeverity, RepairEffectiveness };
