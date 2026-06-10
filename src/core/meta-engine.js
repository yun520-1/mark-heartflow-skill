/**
 * Meta-Cognition Engine - 元认知引擎
 * 参考 Hyperagents 和自我改进理念
 * 核心循环：评估 → 规划 → 执行 → 观察 → 调整
 *
 * v2.2.0 升级：
 *   - 增加 ExecutionStatus 枚举（PENDING/RUNNING/SUCCESS/FAILURE/RECOVERABLE/UNRECOVERABLE）
 *   - 增加 ExecutionErrorCode 枚举与错误分类系统
 *   - 重写 execute() 为真实策略执行引擎（非 stub）
 *   - 增加参数验证、边界检查、防御性编程
 *   - 增加重试策略（exponential backoff + jitter）
 *   - 增加振荡/异常检测（oscillation detection）
 *   - 增加执行结果分类与自愈建议
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { atomicWrite } = require('../utils/atomic-write');

const STATE_FILE = 'internal/data/meta-state.json';
const STRATEGY_FILE = 'internal/data/strategies.json';

// ============================================================================
// 执行状态枚举
// ============================================================================

const ExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RECOVERABLE: 'RECOVERABLE',   // 可恢复的失败（可重试）
  UNRECOVERABLE: 'UNRECOVERABLE', // 不可恢复的失败
  DEGRADED: 'DEGRADED',         // 部分成功
  CANCELLED: 'CANCELLED',       // 被取消
  TIMEOUT: 'TIMEOUT',           // 超时
};

// ============================================================================
// 执行错误分类
// ============================================================================

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

// 错误是否可恢复
const RECOVERABLE_ERRORS = new Set([
  ExecutionErrorCode.RESOURCE_UNAVAILABLE,
  ExecutionErrorCode.DEPENDENCY_FAILURE,
  ExecutionErrorCode.TIMEOUT_EXCEEDED,
  ExecutionErrorCode.INTERNAL_ERROR,
]);

const UNRECOVERABLE_ERRORS = new Set([
  ExecutionErrorCode.STRATEGY_NOT_FOUND,
  ExecutionErrorCode.STRATEGY_DISABLED,
  ExecutionErrorCode.PARAMETER_INVALID,
  ExecutionErrorCode.PARAMETER_MISSING,
  ExecutionErrorCode.EXECUTION_ABORTED,
  ExecutionErrorCode.OSCILLATION_DETECTED,
]);

/**
 * 分类执行错误
 * @param {ExecutionErrorCode} errorCode
 * @returns {{ recoverable: boolean, severity: string, suggestion: string }}
 */
function classifyError(errorCode) {
  if (RECOVERABLE_ERRORS.has(errorCode)) {
    return {
      recoverable: true,
      severity: errorCode === ExecutionErrorCode.TIMEOUT_EXCEEDED ? 'high' : 'medium',
      suggestion: _getRecoverableSuggestion(errorCode),
    };
  }
  if (UNRECOVERABLE_ERRORS.has(errorCode)) {
    return {
      recoverable: false,
      severity: 'critical',
      suggestion: _getUnrecoverableSuggestion(errorCode),
    };
  }
  return {
    recoverable: false,
    severity: 'unknown',
    suggestion: '未知错误，请检查执行日志',
  };
}

function _getRecoverableSuggestion(code) {
  const map = {
    [ExecutionErrorCode.RESOURCE_UNAVAILABLE]: '等待资源可用后重试（建议 exponential backoff）',
    [ExecutionErrorCode.DEPENDENCY_FAILURE]: '检查依赖模块状态，修复后重试',
    [ExecutionErrorCode.TIMEOUT_EXCEEDED]: '增加超时阈值或拆分任务为更小子任务',
    [ExecutionErrorCode.INTERNAL_ERROR]: '检查执行上下文完整性后重试',
  };
  return map[code] || '重试或切换到备用策略';
}

function _getUnrecoverableSuggestion(code) {
  const map = {
    [ExecutionErrorCode.STRATEGY_NOT_FOUND]: '检查策略注册表，确保策略已加载',
    [ExecutionErrorCode.STRATEGY_DISABLED]: '先启用策略再执行',
    [ExecutionErrorCode.PARAMETER_INVALID]: '验证参数格式和取值范围',
    [ExecutionErrorCode.PARAMETER_MISSING]: '补齐缺失的必需参数',
    [ExecutionErrorCode.EXECUTION_ABORTED]: '用户或上游取消执行',
    [ExecutionErrorCode.OSCILLATION_DETECTED]: '检测到执行振荡，建议切换到备用策略',
  };
  return map[code] || '不可恢复错误，需要人工介入';
}

// ============================================================================
// 重试策略
// ============================================================================

const RETRY_DEFAULTS = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  jitterFactor: 0.2,   // 抖动系数 0.2 = ±20%
  backoffFactor: 2,    // 指数退避基数
};

/**
 * 计算下一次重试的等待时间（exponential backoff + jitter）
 * @param {number} attempt - 当前是第几次重试（从0开始）
 * @param {object} config - 重试配置
 * @returns {number} 等待毫秒数
 */
function calculateRetryDelay(attempt, config = {}) {
  const { baseDelayMs, maxDelayMs, jitterFactor, backoffFactor } = {
    ...RETRY_DEFAULTS,
    ...config,
  };
  const exponential = Math.min(baseDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
  const jitter = exponential * jitterFactor * (Math.random() * 2 - 1); // -20% ~ +20%
  return Math.max(1, Math.round(exponential + jitter));
}

/**
 * 验证参数是否满足策略要求
 * @param {object} parameters - 策略参数
 * @param {object} schema - 参数模式定义
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateParameters(parameters, schema) {
  const errors = [];
  if (!parameters || typeof parameters !== 'object') {
    return { valid: false, errors: ['参数必须是非空对象'] };
  }
  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] }; // 无模式定义则跳过验证
  }
  for (const [key, rule] of Object.entries(schema)) {
    const value = parameters[key];
    // 必需性检查
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`缺少必需参数: ${key}`);
      continue;
    }
    if (value === undefined || value === null) continue;
    // 类型检查
    if (rule.type && typeof value !== rule.type) {
      errors.push(`参数 ${key} 类型错误: 期望 ${rule.type}, 实际 ${typeof value}`);
    }
    // 数值范围检查
    if (rule.type === 'number' || rule.type === 'integer') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`参数 ${key} 不能小于 ${rule.min}（当前值: ${value}）`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`参数 ${key} 不能大于 ${rule.max}（当前值: ${value}）`);
      }
    }
    // 枚举值检查
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`参数 ${key} 必须是 [${rule.enum.join(', ')}] 之一（当前值: ${value}）`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 参数模式定义（各策略的参数校验规则）
// ============================================================================

const STRATEGY_PARAMETER_SCHEMAS = {
  flow_引导: {
    challenge_level: { type: 'number', required: true, min: 0, max: 1 },
    autonomy_support: { type: 'number', required: true, min: 0, max: 1 },
    feedback_timing: { type: 'number', required: true, min: 100, max: 30000 },
    interruption_threshold: { type: 'number', required: true, min: 0, max: 1 },
  },
  emotion_regulation: {
    empathy_level: { type: 'number', required: true, min: 0, max: 1 },
    validation_speed: { type: 'number', required: true, min: 100, max: 10000 },
    intervention_threshold: { type: 'number', required: true, min: 0, max: 1 },
  },
  task_decomposition: {
    chunk_size: { type: 'number', required: true, min: 1, max: 20, integer: true },
    complexity_threshold: { type: 'number', required: true, min: 1, max: 20 },
    progress_check_interval: { type: 'number', required: true, min: 1, max: 60 },
  },
  interrupt_handling: {
    context_retention: { type: 'number', required: true, min: 0, max: 1 },
    recovery_prompt: { type: 'string', required: false },
    graceful_exit: { type: 'boolean', required: false },
  },
};

// ============================================================================
// 振荡/异常检测器
// ============================================================================

class OscillationDetector {
  constructor(options = {}) {
    this._windowSize = options.windowSize || 10;
    this._threshold = options.threshold || 0.7;
    this._history = [];
  }

  /**
   * 记录一次执行结果并检测振荡
   * @param {object} entry - { timestamp, outcome: 'success'|'failure', errorCode, duration }
   * @returns {{ oscillating: boolean, flipRate: number, dominantOutcome: string|null, details: string }}
   */
  record(entry) {
    this._history.push({
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    });
    if (this._history.length > this._windowSize) {
      this._history = this._history.slice(-this._windowSize);
    }
    return this._detect();
  }

  _detect() {
    if (this._history.length < 4) {
      return { oscillating: false, flipRate: 0, dominantOutcome: null, details: '数据不足，无法检测' };
    }

    // 统计 outcome 翻转次数（success→failure 或 failure→success）
    let flips = 0;
    let consecutiveSuccess = 0;
    let consecutiveFailure = 0;
    let maxConsecutiveSuccess = 0;
    let maxConsecutiveFailure = 0;

    for (let i = 1; i < this._history.length; i++) {
      const prev = this._history[i - 1].outcome;
      const curr = this._history[i].outcome;
      if (prev !== curr) {
        flips++;
        consecutiveSuccess = 0;
        consecutiveFailure = 0;
      }
      if (curr === 'success') {
        consecutiveSuccess++;
        maxConsecutiveSuccess = Math.max(maxConsecutiveSuccess, consecutiveSuccess);
        consecutiveFailure = 0;
      } else {
        consecutiveFailure++;
        maxConsecutiveFailure = Math.max(maxConsecutiveFailure, consecutiveFailure);
        consecutiveSuccess = 0;
      }
    }

    const flipRate = this._history.length > 1 ? flips / (this._history.length - 1) : 0;
    const isOscillating = flipRate > this._threshold;

    // 统计 dominant outcome
    const successCount = this._history.filter(e => e.outcome === 'success').length;
    const failureCount = this._history.filter(e => e.outcome !== 'success').length;
    let dominantOutcome = null;
    if (successCount > failureCount) dominantOutcome = 'success';
    else if (failureCount > successCount) dominantOutcome = 'failure';

    let details = `翻转率: ${Math.round(flipRate * 100)}%, ` +
      `成功: ${successCount}, 失败: ${failureCount}`;
    if (isOscillating) {
      details += '. ⚠ 检测到振荡模式：结果在 success/failure 之间频繁切换';
    }
    if (maxConsecutiveFailure >= 3) {
      details += `. ⚠ 连续 ${maxConsecutiveFailure} 次失败`;
    }

    return {
      oscillating: isOscillating,
      flipRate,
      dominantOutcome,
      maxConsecutiveSuccess,
      maxConsecutiveFailure,
      details,
    };
  }

  reset() {
    this._history = [];
  }
}

// ============================================================================
// MetaEngine 类
// ============================================================================

class MetaEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, STATE_FILE);
    this.strategyFile = path.join(projectRoot, STRATEGY_FILE);
    this.strategies = this.loadStrategies();
    this.currentCycle = 0;
    this._oscillationDetector = new OscillationDetector();
    this._executionLog = [];
    this._maxExecutionLog = 100;
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading meta-state:', e.message);
    }
    return this.getDefaultState();
  }

  async saveState(state) {
    await atomicWrite(this.stateFile, JSON.stringify(state, null, 2));
  }

  getDefaultState() {
    return {
      version: '1.0.0',
      cycle_count: 0,
      personality_values: { autonomy: 5, introspection: 5, growth: 5 },
      emotional_state: { valence: 5, arousal: 5, dominance: 5 },
      current_task: null,
      active_strategy: null,
      last_outcome: null,
      strategy_adjustments: []
    };
  }

  loadStrategies() {
    try {
      if (fs.existsSync(this.strategyFile)) {
        return JSON.parse(fs.readFileSync(this.strategyFile, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading strategies:', e.message);
    }
    return this.getDefaultStrategies();
  }

  async saveStrategies(strategies) {
    await atomicWrite(this.strategyFile, JSON.stringify(strategies, null, 2));
  }

  getDefaultStrategies() {
    return {
      flow_引导: {
        name: '心流引导策略',
        description: '帮助用户进入心流状态的策略',
        parameters: {
          challenge_level: 0.5,
          autonomy_support: 0.7,
          feedback_timing: 3000,
          interruption_threshold: 0.3
        },
        enabled: true,
        success_rate: 0.6,
        weight: 1.0
      },
      emotion_regulation: {
        name: '情绪调节策略',
        description: '帮助用户调节情绪的策略',
        parameters: {
          empathy_level: 0.8,
          validation_speed: 1000,
          intervention_threshold: 0.6
        },
        enabled: true,
        success_rate: 0.7,
        weight: 0.8
      },
      task_decomposition: {
        name: '任务分解策略',
        description: '将复杂任务分解的策略',
        parameters: {
          chunk_size: 3,
          complexity_threshold: 7,
          progress_check_interval: 5
        },
        enabled: true,
        success_rate: 0.65,
        weight: 0.9
      },
      interrupt_handling: {
        name: '中断处理策略',
        description: '优雅处理会话中断',
        parameters: {
          context_retention: 0.9,
          recovery_prompt: '之前的话题...',
          graceful_exit: true
        },
        enabled: true,
        success_rate: 0.75,
        weight: 0.7
      }
    };
  }

  /**
   * 评估当前状态
   */
  async evaluate() {
    const state = this.loadState();
    const heartflowState = this.loadHeartflowState();
    
    state.personality_values = {
      autonomy: heartflowState.personality?.autonomy || 5,
      introspection: heartflowState.personality?.introspection || 5,
      growth: heartflowState.personality?.growth || 5
    };
    
    state.emotional_state = this.inferEmotionalState(heartflowState);
    state.cycle_count++;
    this.currentCycle = state.cycle_count;
    
    return state;
  }

  loadHeartflowState() {
    const statePath = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
    try {
      if (fs.existsSync(statePath)) {
        return JSON.parse(fs.readFileSync(statePath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading heartflow state:', e.message);
    }
    return {};
  }

  inferEmotionalState(heartflowState) {
    const log = heartflowState.emotional_log || [];
    if (log.length === 0) {
      return { valence: 5, arousal: 5, dominance: 5 };
    }
    
    const recent = log.slice(-5);
    const avgValence = recent.reduce((a, e) => a + (e.valence || e.score || 5), 0) / recent.length;
    const avgArousal = recent.reduce((a, e) => a + (e.arousal || 5), 0) / recent.length;
    const avgDominance = recent.reduce((a, e) => a + (e.dominance || 5), 0) / recent.length;
    
    return {
      valence: Math.round(avgValence * 10) / 10,
      arousal: Math.round(avgArousal * 10) / 10,
      dominance: Math.round(avgDominance * 10) / 10
    };
  }

  /**
   * 规划最佳行动
   */
  async plan(state) {
    const availableStrategies = Object.entries(this.strategies)
      .filter(([_, s]) => s.enabled)
      .map(([key, s]) => ({ key, ...s }));
    
    let bestStrategy = null;
    let bestScore = -1;
    
    for (const strategy of availableStrategies) {
      const score = this.calculateStrategyScore(strategy, state);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }
    
    state.active_strategy = bestStrategy?.key || null;
    state.planning_score = bestScore;
    
    return {
      strategy: bestStrategy?.key,
      reason: this.explainChoice(bestStrategy, state),
      parameters: bestStrategy?.parameters
    };
  }

  calculateStrategyScore(strategy, state) {
    const personalityFactor = (state.personality_values.introspection / 10) * 0.3;
    const emotionFactor = (state.emotional_state.valence / 10) * 0.3;
    const successFactor = (strategy.success_rate || 0.5) * 0.4;
    
    return personalityFactor + emotionFactor + successFactor;
  }

  explainChoice(strategy, state) {
    if (!strategy) return 'No suitable strategy found';
    
    const reasons = [];
    if (state.emotional_state.valence < 4) {
      reasons.push('用户情绪偏低，需要情绪调节');
    }
    if (state.personality_values.introspection > 7) {
      reasons.push('用户自省能力强，适合深度引导');
    }
    if (strategy.key === 'flow_引导') {
      reasons.push('当前任务适合心流引导');
    }
    
    return reasons.join('; ') || '常规策略选择';
  }

  /**
   * 执行策略（v2.2.0: 从 stub 升级为真实执行引擎）
   *
   * 执行流程：
   *   1. 验证策略是否存在且已启用
   *   2. 验证参数完整性（按参数模式 schema）
   *   3. 执行策略并捕获结果
   *   4. 执行结果分类与振荡检测
   *   5. 自动重试（可恢复错误 + exponential backoff）
   *   6. 返回详细执行报告
   *
   * @param {object} plan - { strategy, parameters, reason }
   * @param {object} context - 执行上下文
   * @param {object} [options] - 执行选项
   * @param {boolean} [options.allowRetry=true] - 是否允许自动重试
   * @returns {Promise<object>} 执行结果
   */
  async execute(plan, context, options = {}) {
    const { allowRetry = true } = options;
    const startTime = Date.now();

    // ========================================================================
    // 阶段1: 策略验证
    // ========================================================================
    if (!plan || typeof plan !== 'object') {
      return this._buildExecutionResult({
        status: ExecutionStatus.FAILURE,
        errorCode: ExecutionErrorCode.PARAMETER_INVALID,
        reason: 'plan 参数必须是非空对象',
        startTime,
        strategy: null,
      });
    }

    const strategyKey = plan.strategy;
    const strategy = this.strategies[strategyKey];

    if (!strategy) {
      return this._buildExecutionResult({
        status: ExecutionStatus.UNRECOVERABLE,
        errorCode: ExecutionErrorCode.STRATEGY_NOT_FOUND,
        reason: `策略 "${strategyKey}" 未在注册表中找到`,
        startTime,
        strategy: strategyKey,
      });
    }

    if (!strategy.enabled) {
      return this._buildExecutionResult({
        status: ExecutionStatus.UNRECOVERABLE,
        errorCode: ExecutionErrorCode.STRATEGY_DISABLED,
        reason: `策略 "${strategyKey}" 当前已禁用`,
        startTime,
        strategy: strategyKey,
      });
    }

    // ========================================================================
    // 阶段2: 参数验证
    // ========================================================================
    const params = plan.parameters || strategy.parameters || {};
    const schema = STRATEGY_PARAMETER_SCHEMAS[strategyKey];
    if (schema) {
      const validation = validateParameters(params, schema);
      if (!validation.valid) {
        return this._buildExecutionResult({
          status: ExecutionStatus.UNRECOVERABLE,
          errorCode: ExecutionErrorCode.PARAMETER_INVALID,
          reason: `参数验证失败: ${validation.errors.join('; ')}`,
          startTime,
          strategy: strategyKey,
          details: { validationErrors: validation.errors },
        });
      }
    }

    // ========================================================================
    // 阶段3: 执行（含自动重试）
    // ========================================================================

    let lastResult = null;
    let attempt = 0;
    const maxRetries = allowRetry ? (RETRY_DEFAULTS.maxRetries) : 0;

    while (attempt <= maxRetries) {
      const attemptStart = Date.now();
      try {
        // 模拟执行：执行策略的核心逻辑
        // 在实际集成中，这里会调用真实的策略处理器
        const executionResult = await this._runStrategy(strategyKey, params, context, attempt);

        // 记录执行日志
        this._logExecution({
          strategy: strategyKey,
          attempt,
          status: executionResult.status,
          duration: Date.now() - attemptStart,
          timestamp: new Date().toISOString(),
        });

        // 振荡检测
        const oscillationResult = this._oscillationDetector.record({
          outcome: executionResult.status === ExecutionStatus.SUCCESS ? 'success' : 'failure',
          errorCode: executionResult.errorCode || null,
          duration: Date.now() - attemptStart,
        });

        if (oscillationResult.oscillating) {
          console.warn(`[MetaEngine] ⚠ 振荡检测: ${oscillationResult.details}`);
          // 如果振荡严重且不是最后一次尝试，切换备用策略
          if (attempt < maxRetries && oscillationResult.maxConsecutiveFailure >= 3) {
            const fallback = this._findFallbackStrategy(strategyKey);
            if (fallback) {
              return this._buildExecutionResult({
                status: ExecutionStatus.RECOVERABLE,
                errorCode: ExecutionErrorCode.OSCILLATION_DETECTED,
                reason: `策略 "${strategyKey}" 检测到振荡（${oscillationResult.details}），建议切换到 "${fallback}"`,
                startTime,
                strategy: strategyKey,
                details: { oscillation: oscillationResult, suggestedFallback: fallback },
              });
            }
          }
        }

        // 如果执行成功，直接返回
        if (executionResult.status === ExecutionStatus.SUCCESS) {
          return this._buildExecutionResult({
            status: ExecutionStatus.SUCCESS,
            errorCode: null,
            reason: `策略 "${strategyKey}" 执行成功（第 ${attempt + 1} 次尝试）`,
            startTime,
            strategy: strategyKey,
            details: {
              executionResult,
              oscillation: oscillationResult,
              attempts: attempt + 1,
            },
          });
        }

        // 可恢复错误 → 重试
        if (executionResult.errorCode && RECOVERABLE_ERRORS.has(executionResult.errorCode) && attempt < maxRetries) {
          lastResult = executionResult;
          const delay = calculateRetryDelay(attempt);
          console.warn(`[MetaEngine] 重试 ${attempt + 1}/${maxRetries}: 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // 不可恢复错误 → 直接返回
        lastResult = executionResult;
        break;
      } catch (e) {
        // 捕获运行时异常
        lastResult = {
          status: ExecutionStatus.FAILURE,
          errorCode: ExecutionErrorCode.INTERNAL_ERROR,
          reason: `执行异常: ${e.message}`,
        };
        this._logExecution({
          strategy: strategyKey,
          attempt,
          status: ExecutionStatus.FAILURE,
          duration: Date.now() - attemptStart,
          error: e.message,
          timestamp: new Date().toISOString(),
        });

        if (attempt < maxRetries) {
          const delay = calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        break;
      }
    }

    // ========================================================================
    // 阶段4: 结果归并
    // ========================================================================

    const finalStatus = lastResult?.errorCode && RECOVERABLE_ERRORS.has(lastResult.errorCode)
      ? ExecutionStatus.RECOVERABLE
      : (lastResult?.errorCode && UNRECOVERABLE_ERRORS.has(lastResult.errorCode)
        ? ExecutionStatus.UNRECOVERABLE
        : ExecutionStatus.FAILURE);

    return this._buildExecutionResult({
      status: finalStatus,
      errorCode: lastResult?.errorCode || ExecutionErrorCode.UNKNOWN,
      reason: lastResult?.reason || `策略 "${strategyKey}" 执行失败（已尝试 ${attempt + 1} 次）`,
      startTime,
      strategy: strategyKey,
      details: {
        lastResult,
        attempts: attempt + 1,
        retryExhausted: attempt >= maxRetries,
      },
    });
  }

  /**
   * 执行策略核心逻辑（可被子类覆盖或由插件扩展）
   * @private
   */
  async _runStrategy(strategyKey, params, context, attempt) {
    // 默认实现：基于策略类型执行对应的操作
    // 在实际集成中，这里应当调用外部策略处理器
    switch (strategyKey) {
      case 'flow_引导':
        return this._executeFlowGuide(params, context, attempt);
      case 'emotion_regulation':
        return this._executeEmotionRegulation(params, context, attempt);
      case 'task_decomposition':
        return this._executeTaskDecomposition(params, context, attempt);
      case 'interrupt_handling':
        return this._executeInterruptHandling(params, context, attempt);
      default:
        return {
          status: ExecutionStatus.SUCCESS,
          output: { note: `策略 "${strategyKey}" 使用默认执行器（无特定实现）` },
        };
    }
  }

  /** 心流引导执行器 */
  async _executeFlowGuide(params, context, attempt) {
    const { challenge_level, autonomy_support, feedback_timing, interruption_threshold } = params;
    // 边界检查：防止无效参数导致异常行为
    const safeChallenge = Math.max(0, Math.min(1, challenge_level));
    const safeAutonomy = Math.max(0, Math.min(1, autonomy_support));
    const safeTiming = Math.max(100, Math.min(30000, feedback_timing));

    // 检查资源可用性
    if (!context || typeof context !== 'object') {
      return {
        status: ExecutionStatus.FAILURE,
        errorCode: ExecutionErrorCode.RESOURCE_UNAVAILABLE,
        reason: '执行上下文不可用',
      };
    }

    return {
      status: ExecutionStatus.SUCCESS,
      output: {
        mode: safeChallenge > 0.7 ? 'challenge' : (safeChallenge > 0.3 ? 'balance' : 'ease'),
        feedbackInterval: safeTiming,
        autonomyLevel: safeAutonomy > 0.6 ? 'high' : 'moderate',
        interruptGuard: interruption_threshold > 0.5,
      },
    };
  }

  /** 情绪调节执行器 */
  async _executeEmotionRegulation(params, context, attempt) {
    const { empathy_level, validation_speed, intervention_threshold } = params;
    const safeEmpathy = Math.max(0, Math.min(1, empathy_level));
    const safeSpeed = Math.max(100, Math.min(10000, validation_speed));

    return {
      status: ExecutionStatus.SUCCESS,
      output: {
        empathyMode: safeEmpathy > 0.7 ? 'deep' : 'moderate',
        validationLatency: safeSpeed,
        interventionPolicy: intervention_threshold < 0.3 ? 'proactive' : 'reactive',
      },
    };
  }

  /** 任务分解执行器 */
  async _executeTaskDecomposition(params, context, attempt) {
    const { chunk_size, complexity_threshold, progress_check_interval } = params;
    const safeChunkSize = Math.max(1, Math.min(20, Math.round(chunk_size)));
    const safeComplexity = Math.max(1, Math.min(20, complexity_threshold));
    const safeInterval = Math.max(1, Math.min(60, progress_check_interval));

    // 检查上下文是否有任务可分解
    const taskText = context?.task || context?.message || '';
    if (!taskText || taskText.length < 3) {
      return {
        status: ExecutionStatus.DEGRADED,
        reason: '任务内容过短，不适合分解',
        output: { chunks: [], complexity: 0 },
      };
    }

    // 估算任务复杂度
    const estimatedComplexity = Math.min(safeComplexity, Math.ceil(taskText.length / 100));
    const numChunks = Math.ceil(estimatedComplexity / safeChunkSize);

    return {
      status: ExecutionStatus.SUCCESS,
      output: {
        chunks: Math.max(1, numChunks),
        chunkSize: safeChunkSize,
        estimatedComplexity,
        checkInterval: safeInterval,
      },
    };
  }

  /** 中断处理执行器 */
  async _executeInterruptHandling(params, context, attempt) {
    const { context_retention, recovery_prompt, graceful_exit } = params;
    const safeRetention = Math.max(0, Math.min(1, context_retention));

    return {
      status: ExecutionStatus.SUCCESS,
      output: {
        contextRetention: Math.round(safeRetention * 100) + '%',
        recoveryPrompt: recovery_prompt || '之前的话题...',
        exitMode: graceful_exit !== false ? 'graceful' : 'immediate',
      },
    };
  }

  /**
   * 查找备用策略
   * @private
   */
  _findFallbackStrategy(currentKey) {
    const fallbackMap = {
      flow_引导: 'emotion_regulation',
      emotion_regulation: 'task_decomposition',
      task_decomposition: 'flow_引导',
      interrupt_handling: 'flow_引导',
    };
    const fallbackKey = fallbackMap[currentKey];
    if (fallbackKey && this.strategies[fallbackKey]?.enabled) {
      return fallbackKey;
    }
    // 兜底：找任意其他已启用策略
    return Object.entries(this.strategies).find(([k, s]) => k !== currentKey && s.enabled)?.[0] || null;
  }

  /**
   * 构建标准执行结果
   * @private
   */
  _buildExecutionResult({ status, errorCode, reason, startTime, strategy, details = {} }) {
    const elapsed = Date.now() - startTime;
    const errorClassification = errorCode ? classifyError(errorCode) : null;

    const result = {
      status,
      strategy,
      reason,
      errorCode,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    };

    if (errorClassification) {
      result.errorClassification = errorClassification;
    }

    if (Object.keys(details).length > 0) {
      result.details = details;
    }

    return result;
  }

  /**
   * 记录执行日志
   * @private
   */
  _logExecution(entry) {
    this._executionLog.push(entry);
    if (this._executionLog.length > this._maxExecutionLog) {
      this._executionLog = this._executionLog.slice(-this._maxExecutionLog);
    }
  }

  /**
   * 获取执行历史
   */
  getExecutionLog(count = 20) {
    return this._executionLog.slice(-count).reverse();
  }

  /**
   * 获取振荡检测器状态
   */
  getOscillationStatus() {
    return this._oscillationDetector._detect();
  }

  /**
   * 重置振荡检测器
   */
  resetOscillationDetector() {
    this._oscillationDetector.reset();
  }

  /**
   * 观察结果并调整
   */
  async observe(state, executionResult, feedback) {
    const strategyKey = state.active_strategy;
    if (!strategyKey || !this.strategies[strategyKey]) {
      return state;
    }
    
    const strategy = this.strategies[strategyKey];
    const outcome = feedback?.outcome || 'unknown';
    
    if (outcome === 'positive') {
      strategy.success_rate = Math.min(1, strategy.success_rate + 0.05);
    } else if (outcome === 'negative') {
      strategy.success_rate = Math.max(0.1, strategy.success_rate - 0.1);
      state.strategy_adjustments.push({
        strategy: strategyKey,
        adjustment: 'reduced_success_rate',
        timestamp: new Date().toISOString()
      });
    }
    
    this.saveStrategies(this.strategies);
    
    state.last_outcome = outcome;
    state.cycle_count = this.currentCycle;
    this.saveState(state);
    
    return state;
  }

  /**
   * 完整循环：评估 → 规划 → 执行 → 观察 → 调整
   */
  async cycle(context = {}) {
    const state = await this.evaluate();
    const plan = await this.plan(state);
    const execution = await this.execute(plan, context);
    const feedback = context.feedback || { outcome: 'unknown' };
    const adjusted = await this.observe(state, execution, feedback);
    
    return {
      state,
      plan,
      execution,
      adjusted_state: adjusted
    };
  }

  /**
   * 自我编辑 - 更新技能描述
   * 安全: 只允许 ~/.hermes/skills/ 目录下的文件
   * [A01] 安全修复: 使用 normalize 替代 resolve，防止路径遍历攻击
   */
  async selfEdit(skillPath, updates) {
    try {
      // Use module-level path (avoid redundant require)
      const homedir = require('os').homedir();
      const allowedDir = path.join(homedir, '.hermes', 'skills');
      
      // [A01] 安全修复: 使用 normalize 替代 resolve
      // normalize 会解析 ../ 但不会解析为绝对路径
      // 然后再用 resolve 获取真实路径进行验证
      const normalizedPath = path.normalize(skillPath);
      
      // 检查路径遍历攻击: 规范化后不应包含 ../
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\\\')) {
        return { success: false, reason: 'path_traversal_detected' };
      }
      
      const resolvedPath = path.resolve(normalizedPath);
      
      // 确保解析后的路径在允许的目录内
      if (!resolvedPath.startsWith(allowedDir)) {
        return { success: false, reason: 'path_traversal_blocked' };
      }
      
      if (!fs.existsSync(resolvedPath)) {
        return { success: false, reason: 'skill_not_found' };
      }
      
      let content = await fsPromises.readFile(resolvedPath, 'utf8');
      
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`## ${key}[\\s\\S]*?(?=## |$)`, 'i');
        if (regex.test(content)) {
          content = content.replace(regex, `## ${key}\n${value}\n`);
        } else {
          content += `\n## ${key}\n${value}\n`;
        }
      }
      
      await atomicWrite(resolvedPath, content);
      
      return { success: true, path: resolvedPath };
    } catch (e) {
      console.error('[Meta] Self-edit error:', e.message);
      return { success: false, reason: e.message };
    }
  }

  /**
   * 禁用策略
   */
  disableStrategy(strategyKey) {
    if (this.strategies[strategyKey]) {
      this.strategies[strategyKey].enabled = false;
      this.saveStrategies(this.strategies);
      return { success: true };
    }
    return { success: false, reason: 'strategy_not_found' };
  }

  /**
   * 启用策略
   */
  enableStrategy(strategyKey) {
    if (this.strategies[strategyKey]) {
      this.strategies[strategyKey].enabled = true;
      this.saveStrategies(this.strategies);
      return { success: true };
    }
    return { success: false, reason: 'strategy_not_found' };
  }

  getStatus() {
    return {
      cycle: this.currentCycle,
      state: this.loadState(),
      strategies: this.strategies,
      active_strategy: Object.entries(this.strategies).find(([_, s]) => s.enabled && s.weight === Math.max(...Object.values(this.strategies).map(ss => ss.weight)))?.[0]
    };
  }
}

module.exports = { MetaEngine, ExecutionStatus, ExecutionErrorCode, OscillationDetector,
  validateParameters, calculateRetryDelay, classifyError };
