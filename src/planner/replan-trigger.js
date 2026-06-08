/**
 * 重规划触发器 (Replan Trigger) v2.0.0
 *
 * 决定何时需要重新规划，带状态机、震荡检测和冷却期机制
 */

// 重规划状态枚举
const REPLAN_STATE = {
  IDLE: 'idle',
  EVALUATING: 'evaluating',
  COOLDOWN: 'cooldown',
  REPLANNING: 'replanning',
  COMPLETED: 'completed',
  OSCILLATING: 'oscillating',
  STALLED: 'stalled',
  FAILED: 'failed'
};

// 状态转换映射（key=fromState, value=allowedToStates）
const STATE_TRANSITIONS = {
  [REPLAN_STATE.IDLE]: [REPLAN_STATE.EVALUATING, REPLAN_STATE.COOLDOWN],
  [REPLAN_STATE.EVALUATING]: [REPLAN_STATE.REPLANNING, REPLAN_STATE.COOLDOWN, REPLAN_STATE.COMPLETED, REPLAN_STATE.OSCILLATING],
  [REPLAN_STATE.COOLDOWN]: [REPLAN_STATE.IDLE, REPLAN_STATE.EVALUATING],
  [REPLAN_STATE.REPLANNING]: [REPLAN_STATE.COMPLETED, REPLAN_STATE.COOLDOWN, REPLAN_STATE.FAILED, REPLAN_STATE.STALLED],
  [REPLAN_STATE.COMPLETED]: [REPLAN_STATE.IDLE, REPLAN_STATE.EVALUATING],
  [REPLAN_STATE.OSCILLATING]: [REPLAN_STATE.COOLDOWN, REPLAN_STATE.IDLE],
  [REPLAN_STATE.STALLED]: [REPLAN_STATE.COOLDOWN, REPLAN_STATE.IDLE],
  [REPLAN_STATE.FAILED]: [REPLAN_STATE.COOLDOWN, REPLAN_STATE.IDLE]
};

// 重规划类型枚举
const REPLAN_TYPE = {
  FAILURE: 'failure',
  PERFORMANCE: 'performance',
  STALL: 'stall',
  OSCILLATION: 'oscillation',
  CONFIDENCE: 'confidence',
  TIMEOUT: 'timeout',
  CRITICAL: 'critical',
  DEPENDENCY: 'dependency',
  COOLDOWN_EXPIRED: 'cooldown_expired',
  EXTERNAL: 'external'
};

// 紧迫度枚举
const REPLAN_URGENCY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// 紧迫度数值映射
const URGENCY_WEIGHT = {
  [REPLAN_URGENCY.CRITICAL]: 100,
  [REPLAN_URGENCY.HIGH]: 70,
  [REPLAN_URGENCY.MEDIUM]: 40,
  [REPLAN_URGENCY.LOW]: 10
};

// 默认配置
const DEFAULT_CONFIG = {
  maxRetries: 3,
  maxErrors: 5,
  errorRateThreshold: 0.3,
  timeLimit: 300000, // 5分钟
  confidenceThreshold: 0.5,
  baseCooldownMs: 60000, // 基础冷却期 1 分钟
  maxCooldownMs: 3600000, // 最大冷却期 1 小时
  oscillationWindow: 10, // 震荡检测窗口
  oscillationThreshold: 0.5, // 震荡阈值（翻转率）
  stallWindowMs: 300000, // 停滞检测窗口 5 分钟
  maxStallCount: 3, // 最大连续停滞
  maxHistorySize: 100, // 历史记录上限
  autoAdjustThresholds: true, // 是否自动调整阈值
  adjustRate: 0.1 // 阈值调整率
};

class ReplanTrigger {
  constructor(options = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options
    };

    // 钳位参数边界
    this.config.baseCooldownMs = Math.max(5000, Math.min(86400000, this.config.baseCooldownMs));
    this.config.maxCooldownMs = Math.max(this.config.baseCooldownMs, this.config.maxCooldownMs);
    this.config.oscillationWindow = Math.max(3, Math.min(50, this.config.oscillationWindow));
    this.config.maxHistorySize = Math.max(10, Math.min(500, this.config.maxHistorySize));

    // 状态
    this.state = REPLAN_STATE.IDLE;
    this.thresholds = {
      maxRetries: this.config.maxRetries,
      maxErrors: this.config.maxErrors,
      errorRateThreshold: this.config.errorRateThreshold,
      timeLimit: this.config.timeLimit,
      confidenceThreshold: this.config.confidenceThreshold
    };

    // 计数器
    this.counters = new Map();

    // 历史记录
    this.history = [];
    this.replanHistory = []; // 重规划历史
    this.oscillationEvents = []; // 震荡事件

    // 冷却期
    this.cooldownUntil = 0;
    this.currentCooldownMs = this.config.baseCooldownMs;

    // 停滞计数
    this.consecutiveStalls = 0;

    // 统计
    this.stats = {
      totalEvaluations: 0,
      totalReplans: 0,
      totalNoReplans: 0,
      totalOscillations: 0,
      totalStalls: 0,
      totalErrors: 0,
      byType: {},
      byUrgency: {},
      lastReplanTime: 0
    };

    // 初始化类型和紧迫度统计
    Object.values(REPLAN_TYPE).forEach(t => { this.stats.byType[t] = 0; });
    Object.values(REPLAN_URGENCY).forEach(u => { this.stats.byUrgency[u] = 0; });
  }

  /**
   * 状态转换
   */
  _transitionTo(newState) {
    if (this.state === newState) return; // 同状态不转换
    const allowed = STATE_TRANSITIONS[this.state];
    if (!allowed || !allowed.includes(newState)) {
      throw new Error(`非法状态转换: ${this.state} → ${newState}`);
    }
    this.state = newState;
  }

  /**
   * 判断是否需要重规划
   * @param {Object} executionResult - 执行结果
   * @param {Object} currentPlan - 当前计划
   * @param {Object} [context={}] - 上下文
   * @returns {boolean} - 是否需要重规划
   */
  shouldReplan(executionResult, currentPlan, context = {}) {
    this.stats.totalEvaluations++;

    // 检查冷却期
    if (this._inCooldown()) {
      return false;
    }

    // 检查停滞
    if (this._isStalled(context)) {
      this._recordReplan(REPLAN_TYPE.STALL, REPLAN_URGENCY.HIGH);
      return true;
    }

    // 检查震荡
    if (this._detectOscillation()) {
      this.stats.totalOscillations++;
      this._enterCooldown('oscillation');
      this._recordReplan(REPLAN_TYPE.OSCILLATION, REPLAN_URGENCY.MEDIUM);
      return true;
    }

    this._transitionTo(REPLAN_STATE.EVALUATING);

    // 任务完全失败
    if (executionResult.success === false) {
      this._recordReplan(REPLAN_TYPE.FAILURE, REPLAN_URGENCY.CRITICAL);
      return true;
    }

    // 严重错误
    if (this._hasCriticalErrors(executionResult)) {
      this._recordReplan(REPLAN_TYPE.CRITICAL, REPLAN_URGENCY.CRITICAL);
      return true;
    }

    // 依赖问题
    if (this._hasDependencyIssues(executionResult, currentPlan)) {
      this._recordReplan(REPLAN_TYPE.DEPENDENCY, REPLAN_URGENCY.HIGH);
      return true;
    }

    // 错误数超过阈值
    const errorCount = executionResult.errors?.length || 0;
    if (errorCount >= this.thresholds.maxErrors) {
      this._recordReplan(REPLAN_TYPE.FAILURE, REPLAN_URGENCY.HIGH);
      return true;
    }

    // 执行超时
    if (executionResult.duration && executionResult.duration > this.thresholds.timeLimit) {
      this._recordReplan(REPLAN_TYPE.TIMEOUT, REPLAN_URGENCY.MEDIUM);
      return true;
    }

    // 步骤失败数超过阈值
    const failedSteps = executionResult.stepResults
      ? Object.values(executionResult.stepResults).filter(r => r.status === 'failed').length
      : 0;

    if (failedSteps >= this.thresholds.maxRetries) {
      this._recordReplan(REPLAN_TYPE.PERFORMANCE, REPLAN_URGENCY.HIGH);
      return true;
    }

    // 错误率过高
    const totalSteps = currentPlan.steps?.length || 1;
    const errorRate = (errorCount + failedSteps) / totalSteps;
    if (errorRate > this.thresholds.errorRateThreshold) {
      this._recordReplan(REPLAN_TYPE.PERFORMANCE, REPLAN_URGENCY.MEDIUM);
      return true;
    }

    // 置信度过低
    if (executionResult.confidence && executionResult.confidence < this.thresholds.confidenceThreshold) {
      this._recordReplan(REPLAN_TYPE.CONFIDENCE, REPLAN_URGENCY.MEDIUM);
      return true;
    }

    this._transitionTo(REPLAN_STATE.COMPLETED);
    this.stats.totalNoReplans++;
    return false;
  }

  /**
   * 获取重规划原因（详细版）
   * @param {Object} executionResult - 执行结果
   * @param {Object} currentPlan - 当前计划
   * @param {Object} [context={}] - 上下文
   * @returns {Array} - 原因列表
   */
  getReplanReasons(executionResult, currentPlan, context = {}) {
    const reasons = [];

    if (this._inCooldown()) {
      reasons.push(`冷却期中（剩余 ${Math.ceil((this.cooldownUntil - Date.now()) / 1000)} 秒）`);
      return reasons;
    }

    if (executionResult.success === false) {
      reasons.push('任务执行完全失败');
    }

    const errorCount = executionResult.errors?.length || 0;
    if (errorCount >= this.thresholds.maxErrors) {
      reasons.push(`错误数 (${errorCount}) 超过阈值 (${this.thresholds.maxErrors})`);
    }

    const failedSteps = executionResult.stepResults
      ? Object.values(executionResult.stepResults).filter(r => r.status === 'failed').length
      : 0;

    if (failedSteps >= this.thresholds.maxRetries) {
      reasons.push(`失败步骤数 (${failedSteps}) 超过阈值 (${this.thresholds.maxRetries})`);
    }

    const totalSteps = currentPlan.steps?.length || 1;
    const errorRate = (errorCount + failedSteps) / totalSteps;
    if (errorRate > this.thresholds.errorRateThreshold) {
      reasons.push(`错误率 (${(errorRate * 100).toFixed(1)}%) 超过阈值 (${(this.thresholds.errorRateThreshold * 100).toFixed(1)}%)`);
    }

    if (executionResult.duration && executionResult.duration > this.thresholds.timeLimit) {
      reasons.push(`执行时间 (${executionResult.duration}ms) 超过限制 (${this.thresholds.timeLimit}ms)`);
    }

    if (this._hasCriticalErrors(executionResult)) {
      reasons.push('存在严重错误');
    }

    if (this._hasDependencyIssues(executionResult, currentPlan)) {
      reasons.push('存在依赖问题');
    }

    if (this._isStalled(context)) {
      reasons.push(`执行停滞（连续 ${this.consecutiveStalls} 次无进展）`);
    }

    if (this._detectOscillation()) {
      reasons.push('检测到重规划震荡模式');
    }

    return reasons;
  }

  /**
   * 获取重规划报告（完整版）
   * @param {Object} executionResult - 执行结果
   * @param {Object} currentPlan - 当前计划
   * @param {Object} [context={}] - 上下文
   * @returns {Object} - 重规划报告
   */
  getReplanReport(executionResult, currentPlan, context = {}) {
    const shouldReplan = this.shouldReplan(executionResult, currentPlan, context);
    const reasons = this.getReplanReasons(executionResult, currentPlan, context);
    const lastReplan = this.replanHistory[this.replanHistory.length - 1];

    return {
      shouldReplan,
      reasons,
      type: lastReplan ? lastReplan.type : null,
      urgency: lastReplan ? lastReplan.urgency : null,
      state: this.state,
      inCooldown: this._inCooldown(),
      cooldownRemainingMs: Math.max(0, this.cooldownUntil - Date.now()),
      oscillationDetected: this._detectOscillation(),
      isStalled: this._isStalled(context),
      consecutiveStalls: this.consecutiveStalls,
      stats: this._getBasicStats(),
      thresholds: { ...this.thresholds }
    };
  }

  /**
   * 是否在冷却期
   */
  _inCooldown() {
    if (Date.now() < this.cooldownUntil) {
      return true;
    }
    // 冷却期结束，自动回到 IDLE
    if (this.state === REPLAN_STATE.COOLDOWN) {
      this._transitionTo(REPLAN_STATE.IDLE);
    }
    return false;
  }

  /**
   * 进入冷却期
   * @param {string} [reason='default'] - 冷却原因
   */
  _enterCooldown(reason = 'default') {
    // 如果已在冷却期且新原因更严重，延长冷却期
    if (reason === 'oscillation') {
      this.currentCooldownMs = Math.min(
        this.config.maxCooldownMs,
        this.currentCooldownMs * 2 // 震荡时加倍
      );
    }

    this.cooldownUntil = Date.now() + this.currentCooldownMs;
    this._transitionTo(REPLAN_STATE.COOLDOWN);
  }

  /**
   * 记录一次重规划事件
   */
  _recordReplan(type, urgency) {
    this.stats.totalReplans++;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    this.stats.byUrgency[urgency] = (this.stats.byUrgency[urgency] || 0) + 1;
    this.stats.lastReplanTime = Date.now();

    const event = {
      type,
      urgency,
      timestamp: Date.now(),
      state: this.state
    };

    this.replanHistory.push(event);

    // 更新计数器
    this.counters.set('totalReplans', (this.counters.get('totalReplans') || 0) + 1);
    this.counters.set(`replan:${type}`, (this.counters.get(`replan:${type}`) || 0) + 1);

    // 根据紧迫度决定是否进入冷却期
    if (URGENCY_WEIGHT[urgency] >= URGENCY_WEIGHT[REPLAN_URGENCY.HIGH]) {
      this._enterCooldown(type);
    }

    // 自适应调整阈值
    if (this.config.autoAdjustThresholds) {
      this._adjustThresholds(type);
    }

    // 裁剪历史
    if (this.replanHistory.length > this.config.maxHistorySize) {
      this.replanHistory = this.replanHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * 检测重规划震荡模式
   * 在滑动窗口中，如果重规划频率异常高，标记为震荡
   */
  _detectOscillation() {
    const window = this.config.oscillationWindow;
    if (this.replanHistory.length < window) return false;

    const recent = this.replanHistory.slice(-window);
    const interval = recent[recent.length - 1].timestamp - recent[0].timestamp;

    // 如果窗口内重规划很密集（平均间隔 < 基础冷却期的 1/3）
    const avgInterval = interval / (window - 1);
    if (avgInterval < this.config.baseCooldownMs / 3 && avgInterval > 0) {
      // 记录震荡事件
      this.oscillationEvents.push({
        timestamp: Date.now(),
        window,
        avgInterval,
        types: recent.map(r => r.type).filter((v, i, a) => a.indexOf(v) === i)
      });

      // 裁剪震荡历史
      if (this.oscillationEvents.length > 20) {
        this.oscillationEvents = this.oscillationEvents.slice(-20);
      }

      this._transitionTo(REPLAN_STATE.OSCILLATING);
      return true;
    }

    return false;
  }

  /**
   * 检测停滞
   */
  _isStalled(context) {
    const stallSignal = context.stallSignal || context.noProgress;
    if (stallSignal) {
      this.consecutiveStalls++;
      if (this.consecutiveStalls >= this.config.maxStallCount) {
        this._transitionTo(REPLAN_STATE.STALLED);
        this.stats.totalStalls++;
        return true;
      }
    } else {
      // 有进展时重置停滞计数
      if (this.consecutiveStalls > 0) {
        this.consecutiveStalls = Math.max(0, this.consecutiveStalls - 1);
      }
    }
    return false;
  }

  /**
   * 自适应调整阈值
   */
  _adjustThresholds(type) {
    const adjust = this.config.adjustRate;

    switch (type) {
      case REPLAN_TYPE.FAILURE:
        // 频繁失败 → 降低重试阈值（更容易触发重规划）
        this.thresholds.maxRetries = Math.max(1, this.thresholds.maxRetries - 1);
        this.thresholds.maxErrors = Math.max(2, this.thresholds.maxErrors - 1);
        break;

      case REPLAN_TYPE.TIMEOUT:
        // 频繁超时 → 缩短超时阈值
        this.thresholds.timeLimit = Math.max(
          30000,
          Math.floor(this.thresholds.timeLimit * (1 - adjust))
        );
        break;

      case REPLAN_TYPE.PERFORMANCE:
        // 性能问题 → 降低错误率阈值
        this.thresholds.errorRateThreshold = Math.max(
          0.1,
          this.thresholds.errorRateThreshold - 0.05
        );
        break;

      case REPLAN_TYPE.CONFIDENCE:
        // 置信度问题 → 提高置信度阈值
        this.thresholds.confidenceThreshold = Math.min(
          0.9,
          this.thresholds.confidenceThreshold + 0.05
        );
        break;

      case REPLAN_TYPE.OSCILLATION:
        // 震荡 → 扩大冷却期 + 提高震荡阈值
        this.currentCooldownMs = Math.min(
          this.config.maxCooldownMs,
          this.currentCooldownMs * 1.5
        );
        break;
    }
  }

  /**
   * 是否有严重错误
   */
  _hasCriticalErrors(executionResult) {
    const errors = executionResult.errors || [];
    const criticalPatterns = [
      /FATAL|CRITICAL|panic/i,
      /segmentation fault|segfault/i,
      /out of memory|oom/i,
      /stack overflow/i,
      /deadlock/i
    ];

    return errors.some(error =>
      criticalPatterns.some(pattern => pattern.test(error))
    );
  }

  /**
   * 是否有依赖问题
   */
  _hasDependencyIssues(executionResult, currentPlan) {
    const errors = executionResult.errors || [];

    const dependencyErrors = errors.filter(e =>
      /cannot find module|import error|dependency.*not found/i.test(e)
    );

    if (dependencyErrors.length > 0) {
      return true;
    }

    if (executionResult.stepResults) {
      for (const [, result] of Object.entries(executionResult.stepResults)) {
        if (result.status === 'failed' && result.dependencyFailed) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 获取基本统计
   */
  _getBasicStats() {
    const total = this.stats.totalReplans + this.stats.totalNoReplans;
    const replanRate = total > 0 ? (this.stats.totalReplans / total) : 0;

    // 计算各类型占比
    const typeDistribution = {};
    Object.entries(this.stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        typeDistribution[type] = {
          count,
          percentage: this.stats.totalReplans > 0
            ? ((count / this.stats.totalReplans) * 100).toFixed(1) + '%'
            : '0%'
        };
      }
    });

    return {
      totalEvaluations: this.stats.totalEvaluations,
      totalReplans: this.stats.totalReplans,
      replanRate: (replanRate * 100).toFixed(1) + '%',
      totalOscillations: this.stats.totalOscillations,
      totalStalls: this.stats.totalStalls,
      typeDistribution,
      lastReplanAgo: this.stats.lastReplanTime
        ? Math.floor((Date.now() - this.stats.lastReplanTime) / 1000) + 's'
        : 'never',
      cooldownMs: this.currentCooldownMs
    };
  }

  /**
   * 获取完整统计
   * @returns {Object} - 统计报告
   */
  getStats() {
    return {
      ...this._getBasicStats(),
      state: this.state,
      thresholds: { ...this.thresholds },
      historySize: this.replanHistory.length,
      oscillationEvents: this.oscillationEvents.length,
      consecutiveStalls: this.consecutiveStalls,
      cooldownActive: this._inCooldown(),
      cooldownRemainingMs: Math.max(0, this.cooldownUntil - Date.now()),
      counters: Object.fromEntries(this.counters)
    };
  }

  /**
   * 获取健康检查报告
   */
  healthCheck() {
    const issues = [];
    const warnings = [];

    // 检查重规划率
    const total = this.stats.totalReplans + this.stats.totalNoReplans;
    const replanRate = total > 0 ? (this.stats.totalReplans / total) : 0;
    if (replanRate > 0.8) {
      warnings.push(`重规划率过高 (${(replanRate * 100).toFixed(0)}%)`);
    }

    // 检查震荡
    if (this.oscillationEvents.length > 3) {
      const recentOsc = this.oscillationEvents.slice(-3);
      const avgGap = recentOsc.length > 1
        ? (recentOsc[recentOsc.length - 1].timestamp - recentOsc[0].timestamp) / (recentOsc.length - 1)
        : Infinity;
      if (avgGap < 300000) { // 5分钟
        issues.push(`震荡事件频繁（最近 ${recentOsc.length} 次平均间隔 ${Math.floor(avgGap / 1000)} 秒）`);
      }
    }

    // 检查冷却期
    if (this.currentCooldownMs > this.config.baseCooldownMs * 4) {
      warnings.push(`冷却期已膨胀到 ${Math.floor(this.currentCooldownMs / 1000)} 秒`);
    }

    return {
      healthy: issues.length === 0,
      state: this.state,
      issues,
      warnings,
      replanRate: (replanRate * 100).toFixed(0) + '%',
      totalEvaluations: this.stats.totalEvaluations
    };
  }

  /**
   * 获取历史查询接口
   * @param {Object} [options={}] - 过滤选项
   * @param {string} [options.type] - 按类型过滤
   * @param {string} [options.urgency] - 按紧迫度过滤
   * @param {number} [options.limit=10] - 返回数量
   * @returns {Array} - 历史记录
   */
  getReplanHistory(options = {}) {
    let filtered = [...this.replanHistory];

    if (options.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }
    if (options.urgency) {
      filtered = filtered.filter(e => e.urgency === options.urgency);
    }

    const limit = Math.max(1, Math.min(100, options.limit || 10));
    return filtered.slice(-limit);
  }

  /**
   * 更新计数器
   */
  incrementCounter(key) {
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    return current + 1;
  }

  /**
   * 重置计数器
   */
  resetCounter(key) {
    this.counters.delete(key);
  }

  /**
   * 重置所有计数器
   */
  resetAllCounters() {
    this.counters.clear();
  }

  /**
   * 获取计数器值
   */
  getCounter(key) {
    return this.counters.get(key) || 0;
  }

  /**
   * 更新阈值
   */
  updateThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
  }

  /**
   * 重置整个触发器
   * @param {boolean} [keepThresholds=false] - 是否保留阈值
   */
  reset(keepThresholds = false) {
    this.state = REPLAN_STATE.IDLE;
    this.cooldownUntil = 0;
    this.currentCooldownMs = this.config.baseCooldownMs;
    this.consecutiveStalls = 0;
    this.replanHistory = [];
    this.oscillationEvents = [];
    this.counters.clear();

    if (!keepThresholds) {
      this.thresholds = {
        maxRetries: this.config.maxRetries,
        maxErrors: this.config.maxErrors,
        errorRateThreshold: this.config.errorRateThreshold,
        timeLimit: this.config.timeLimit,
        confidenceThreshold: this.config.confidenceThreshold
      };
    }

    this.stats = {
      totalEvaluations: 0,
      totalReplans: 0,
      totalNoReplans: 0,
      totalOscillations: 0,
      totalStalls: 0,
      totalErrors: 0,
      byType: {},
      byUrgency: {},
      lastReplanTime: 0
    };

    Object.values(REPLAN_TYPE).forEach(t => { this.stats.byType[t] = 0; });
    Object.values(REPLAN_URGENCY).forEach(u => { this.stats.byUrgency[u] = 0; });
  }
}

module.exports = {
  ReplanTrigger,
  REPLAN_STATE,
  REPLAN_TYPE,
  REPLAN_URGENCY,
  STATE_TRANSITIONS,
  URGENCY_WEIGHT,
  DEFAULT_CONFIG
};
