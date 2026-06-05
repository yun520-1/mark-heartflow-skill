/**
 * 任务管道 (Task Pipeline) v1.1.0 — 增强版
 *
 * 心虫的认知核心：接收任务 → 分析 → 规划 → 认知验证
 * 已移除执行层（agents/executor），专注认知处理
 *
 * 升级内容 (v1.0.0 → v1.1.0):
 *   - 增加 TaskComplexity 枚举（TRIVIAL/SIMPLE/MODERATE/COMPLEX/CRITICAL）
 *   - 增加 TaskDomain 枚举（CODE/SEARCH/WRITING/ANALYSIS/PLANNING/SYSTEM/UNKNOWN）
 *   - 增加 PipelineError 错误分类（VALIDATION/TIMEOUT/INVALID_STATE/DEPENDENCY/RESOURCE）
 *   - 增加 _estimateComplexity(): 根据文本特征估算任务复杂度
 *   - 增加 _detectDomain(): 细粒度域检测（技术/学术/创意/数据/系统/通用）
 *   - 增加 _estimateEffort(): 基于文本长度和复杂度估算工作量
 *   - 增加 _estimateUrgency(): 检测紧急关键词估算紧迫度
 *   - 增加 _generateSteps(): 根据域和复杂度生成具体规划步骤
 *   - 增加 _semanticVerify(): 认知语义验证（一致性/完整性/可行性）
 *   - 增加 _validateStateTransition(): 状态机合法性检查
 *   - 增加 _validatePipelineState(): 状态枚举校验
 *   - 增加 timeout 机制：任务超时自动失败
 *   - 增加 _retryTask(): 可配置重试逻辑
 *   - 增加 pipelineMetrics: 吞吐量/平均耗时/失败率追踪
 *   - 增加 cancelTask(): 取消正在运行的任务
 *   - 增加状态枚举 STATE: IDLE/ANALYZING/PLANNING/VERIFYING/COMPLETED/FAILED/CANCELLED
 */

'use strict';

const { IdentityCore } = require('../identity/identity-core');

// ============================================================================
// 枚举与常量
// ============================================================================

/**
 * 任务复杂度枚举
 * @enum {string}
 */
const TaskComplexity = Object.freeze({
  TRIVIAL: 'trivial',     // 简单查询/单步操作
  SIMPLE: 'simple',       // 明确指令，少量分支
  MODERATE: 'moderate',   // 多步骤，需规划
  COMPLEX: 'complex',     // 多域交叉，大量分支
  CRITICAL: 'critical'    // 高影响，需严格验证
});

/**
 * 任务域枚举
 * @enum {string}
 */
const TaskDomain = Object.freeze({
  CODE: 'code',
  SEARCH: 'search',
  WRITING: 'writing',
  ANALYSIS: 'analysis',
  PLANNING: 'planning',
  SYSTEM: 'system',
  CREATIVE: 'creative',
  DATA: 'data',
  ACADEMIC: 'academic',
  UNKNOWN: 'unknown'
});

/**
 * 管道错误类型枚举
 * @enum {string}
 */
const PipelineError = Object.freeze({
  VALIDATION: 'validation_error',
  TIMEOUT: 'timeout_error',
  INVALID_STATE: 'invalid_state_transition',
  DEPENDENCY: 'dependency_error',
  RESOURCE: 'resource_exhausted',
  INTERNAL: 'internal_error',
  CANCELLED: 'task_cancelled'
});

/**
 * 管道状态枚举
 * @enum {string}
 */
const STATE = Object.freeze({
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  PLANNING: 'planning',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

/**
 * 合法状态转换映射
 * @type {Object<string, string[]>}
 */
const VALID_TRANSITIONS = Object.freeze({
  [STATE.IDLE]: [STATE.ANALYZING],
  [STATE.ANALYZING]: [STATE.PLANNING, STATE.FAILED, STATE.CANCELLED],
  [STATE.PLANNING]: [STATE.VERIFYING, STATE.FAILED, STATE.CANCELLED],
  [STATE.VERIFYING]: [STATE.COMPLETED, STATE.FAILED, STATE.CANCELLED],
  [STATE.COMPLETED]: [STATE.IDLE],
  [STATE.FAILED]: [STATE.IDLE],
  [STATE.CANCELLED]: [STATE.IDLE]
});

/**
 * 复杂度到工作量的映射（秒）
 * @type {Object<string, number>}
 */
const COMPLEXITY_TIMEOUT_MAP = Object.freeze({
  [TaskComplexity.TRIVIAL]: 5000,
  [TaskComplexity.SIMPLE]: 15000,
  [TaskComplexity.MODERATE]: 30000,
  [TaskComplexity.COMPLEX]: 60000,
  [TaskComplexity.CRITICAL]: 120000
});

/**
 * 复杂度到重试次数的映射
 * @type {Object<string, number>}
 */
const COMPLEXITY_RETRY_MAP = Object.freeze({
  [TaskComplexity.TRIVIAL]: 0,
  [TaskComplexity.SIMPLE]: 1,
  [TaskComplexity.MODERATE]: 2,
  [TaskComplexity.COMPLEX]: 2,
  [TaskComplexity.CRITICAL]: 3
});

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建带时间戳的管道错误
 * @param {string} type - PipelineError 枚举值
 * @param {string} message - 错误描述
 * @param {Object} [context] - 额外上下文
 * @returns {Object} 结构化错误对象
 */
function _createPipelineError(type, message, context = {}) {
  return {
    type,
    message,
    timestamp: new Date().toISOString(),
    context
  };
}

/**
 * 安全获取对象属性（防御性）
 * @param {Object} obj - 目标对象
 * @param {string} path - 点分隔的路径
 * @param {*} defaultVal - 默认值
 * @returns {*} 属性值或默认值
 */
function _safeGet(obj, path, defaultVal = undefined) {
  if (!obj || typeof obj !== 'object') return defaultVal;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return defaultVal;
    current = current[key];
  }
  return current !== undefined ? current : defaultVal;
}

// ============================================================================
// TaskPipeline 类
// ============================================================================

class TaskPipeline {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();

    // 身份核心
    this.identityCore = new IdentityCore(this.rootPath);

    // 当前任务状态
    this.currentTask = null;
    this.pipelineState = STATE.IDLE;

    // 执行历史
    this.history = [];
    this.maxHistory = options.maxHistory || 50;

    // 管道指标
    this.pipelineMetrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      totalDurationMs: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
      minDurationMs: Infinity,
      lastResetAt: new Date().toISOString()
    };

    // 默认配置
    this.config = {
      defaultTimeout: options.defaultTimeout || 30000,
      maxRetries: options.maxRetries !== undefined ? options.maxRetries : 2,
      retryDelayMs: options.retryDelayMs || 500,
      strictTransitions: options.strictTransitions !== undefined ? options.strictTransitions : true
    };

    // 任务取消令牌
    this._cancellationToken = false;
  }

  // ========================================================================
  // 生命周期
  // ========================================================================

  /**
   * 初始化
   */
  async initialize() {
    this.identityCore.boot();
    console.log('[TaskPipeline] 初始化完成');
    console.log('[TaskPipeline] 身份:', this.identityCore.getIdentitySummary());
    console.log('[TaskPipeline] 配置:', JSON.stringify(this.config));
  }

  // ========================================================================
  // 状态管理
  // ========================================================================

  /**
   * 验证状态转换合法性
   * @param {string} from - 当前状态
   * @param {string} to - 目标状态
   * @returns {boolean} 是否合法
   */
  _validateStateTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  /**
   * 安全切换状态
   * @param {string} newState - 目标状态
   * @throws {Error} 非法状态转换时抛出
   */
  _transitionTo(newState) {
    if (!Object.values(STATE).includes(newState)) {
      throw new Error(`未知状态: ${newState}`);
    }

    const from = this.pipelineState;

    if (this.config.strictTransitions && !this._validateStateTransition(from, newState)) {
      const err = _createPipelineError(
        PipelineError.INVALID_STATE,
        `非法状态转换: ${from} → ${newState}`,
        { from, to: newState, validTargets: VALID_TRANSITIONS[from] || [] }
      );
      console.error('[TaskPipeline]', JSON.stringify(err));
      throw new Error(err.message);
    }

    this.pipelineState = newState;
    if (this.currentTask) {
      this.currentTask.state = newState;
    }
  }

  /**
   * 获取当前管道状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      pipelineState: this.pipelineState,
      currentTask: this.currentTask ? {
        id: this.currentTask.id,
        state: this.currentTask.state,
        input: typeof this.currentTask.input === 'string'
          ? this.currentTask.input.substring(0, 100) + (this.currentTask.input.length > 100 ? '...' : '')
          : '(非文本)',
        complexity: this.currentTask.complexity,
        domain: this.currentTask.domain,
        effort: this.currentTask.effort,
        urgency: this.currentTask.urgency,
        startTime: this.currentTask.startTime,
        elapsedMs: this.currentTask.startTime ? Date.now() - this.currentTask.startTime : 0
      } : null,
      historyCount: this.history.length,
      metrics: this._sanitizeMetrics()
    };
  }

  // ========================================================================
  // 任务处理
  // ========================================================================

  /**
   * 处理用户任务
   * @param {string|Object} taskInput - 任务输入
   * @returns {Promise<Object>} 处理结果
   */
  async handleTask(taskInput) {
    if (this.pipelineState !== STATE.IDLE && this.pipelineState !== STATE.COMPLETED && this.pipelineState !== STATE.FAILED && this.pipelineState !== STATE.CANCELLED) {
      return {
        success: false,
        error: `管道忙: 当前状态 ${this.pipelineState}`,
        errorType: PipelineError.RESOURCE
      };
    }

    // 自动重置到 IDLE
    if (this.pipelineState !== STATE.IDLE) {
      this.pipelineState = STATE.IDLE;
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const startTime = Date.now();
    this._cancellationToken = false;

    // 初步分析复杂度以确定超时
    const text = typeof taskInput === 'string' ? taskInput : (taskInput.text || taskInput.description || JSON.stringify(taskInput));
    const complexity = this._estimateComplexity(text);
    const domain = this._detectDomain(text);
    const effort = this._estimateEffort(text, complexity);
    const urgency = this._estimateUrgency(text);
    const timeout = COMPLEXITY_TIMEOUT_MAP[complexity] || this.config.defaultTimeout;
    const maxRetries = COMPLEXITY_RETRY_MAP[complexity] || this.config.maxRetries;

    this.currentTask = {
      id: taskId,
      input: taskInput,
      state: STATE.ANALYZING,
      complexity,
      domain,
      effort,
      urgency,
      timeout,
      startTime,
      maxRetries,
      retryCount: 0,
      analysis: null,
      plan: null,
      verification: null,
      error: null
    };

    this._transitionTo(STATE.ANALYZING);
    this.pipelineMetrics.totalTasks++;

    this._recordToHistory({
      type: 'start',
      taskId,
      input: text.substring(0, 200),
      complexity,
      domain,
      effort,
      urgency,
      timestamp: new Date().toISOString()
    });

    try {
      // 带超时的任务执行
      const result = await this._executeWithTimeout(async () => {
        return await this._executePipeline(taskInput, text, maxRetries);
      }, timeout);

      // 检查是否被取消
      if (this._cancellationToken) {
        this._transitionTo(STATE.CANCELLED);
        this._finalizeTask('cancelled', taskId, startTime);
        return {
          success: false,
          taskId,
          error: '任务已取消',
          errorType: PipelineError.CANCELLED
        };
      }

      this._transitionTo(STATE.COMPLETED);
      this._finalizeTask('completed', taskId, startTime);

      return {
        success: true,
        taskId,
        complexity,
        domain,
        effort,
        urgency,
        analysis: result.analysis,
        plan: result.plan,
        verification: result.verification,
        durationMs: Date.now() - startTime
      };

    } catch (error) {
      this._transitionTo(STATE.FAILED);
      this.currentTask.error = error.message;

      const errorType = error.type || PipelineError.INTERNAL;
      this._finalizeTask('failed', taskId, startTime);

      this._recordToHistory({
        type: 'failed',
        taskId,
        error: error.message,
        errorType,
        complexity,
        domain,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        taskId,
        error: error.message,
        errorType
      };
    }
  }

  /**
   * 取消当前任务
   * @returns {boolean} 是否成功取消
   */
  cancelTask() {
    if (this.pipelineState === STATE.IDLE || this.pipelineState === STATE.COMPLETED ||
        this.pipelineState === STATE.FAILED || this.pipelineState === STATE.CANCELLED) {
      return false;
    }
    this._cancellationToken = true;
    console.log('[TaskPipeline] 任务取消已请求');
    return true;
  }

  /**
   * 内部管道执行（含重试）
   * @private
   */
  async _executePipeline(taskInput, text, maxRetries) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`[TaskPipeline] 重试第 ${attempt}/${maxRetries} 次`);
        await this._delay(this.config.retryDelayMs * attempt);
      }

      try {
        // 阶段 1: 分析（只在状态变化时切换）
        if (this.pipelineState !== STATE.ANALYZING) {
          this._transitionTo(STATE.ANALYZING);
        }
        const analysis = await this._analyzeTask(taskInput, text);
        this.currentTask.analysis = analysis;
        if (this._cancellationToken) return null;

        // 阶段 2: 规划
        this._transitionTo(STATE.PLANNING);
        const plan = await this._planTask(taskInput, analysis);
        this.currentTask.plan = plan;
        if (this._cancellationToken) return null;

        // 阶段 3: 验证
        this._transitionTo(STATE.VERIFYING);
        const verification = await this._verifyResult({ analysis, plan });
        this.currentTask.verification = verification;
        if (this._cancellationToken) return null;

        // 验证失败时重试
        if (!verification.verified && attempt < maxRetries) {
          lastError = new Error('验证未通过');
          lastError.type = PipelineError.VALIDATION;
          console.log('[TaskPipeline] 验证未通过，将重试');
          continue;
        }

        return { analysis, plan, verification };

      } catch (err) {
        lastError = err;
        if (attempt >= maxRetries) throw err;
        console.log(`[TaskPipeline] 阶段失败: ${err.message}`);
      }
    }

    throw lastError || new Error('管道执行失败');
  }

  /**
   * 带超时的执行包装
   * @private
   */
  _executeWithTimeout(fn, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`任务超时 (${timeoutMs}ms)`);
        err.type = PipelineError.TIMEOUT;
        reject(err);
      }, timeoutMs);

      fn().then(result => {
        clearTimeout(timer);
        resolve(result);
      }).catch(err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /**
   * 最终确定任务状态并更新指标
   * @private
   */
  _finalizeTask(status, taskId, startTime) {
    const duration = Date.now() - startTime;
    const metrics = this.pipelineMetrics;

    if (status === 'completed') {
      metrics.completedTasks++;
    } else if (status === 'failed') {
      metrics.failedTasks++;
    } else if (status === 'cancelled') {
      metrics.cancelledTasks++;
    }

    metrics.totalDurationMs += duration;
    metrics.avgDurationMs = Math.round(metrics.totalDurationMs / metrics.totalTasks);
    metrics.maxDurationMs = Math.max(metrics.maxDurationMs, duration);
    metrics.minDurationMs = Math.min(metrics.minDurationMs, duration);

    this._recordToHistory({
      type: status,
      taskId,
      timestamp: new Date().toISOString(),
      duration,
      complexity: this.currentTask ? this.currentTask.complexity : undefined,
      domain: this.currentTask ? this.currentTask.domain : undefined
    });

    console.log(`[TaskPipeline] 任务 ${taskId} ${status} (${duration}ms)`);
  }

  // ========================================================================
  // 阶段 1: 分析
  // ========================================================================

  /**
   * 分析任务
   * @private
   */
  async _analyzeTask(taskInput, text) {
    console.log('[TaskPipeline] 阶段 1: 分析任务');

    return {
      text: text.substring(0, 1000),
      type: this._classifyTaskType(text),
      complexity: this._estimateComplexity(text),
      domain: this._detectDomain(text),
      effort: this._estimateEffort(text, this._estimateComplexity(text)),
      urgency: this._estimateUrgency(text),
      keywords: this._extractKeywords(text),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 任务类型分类（基础版）
   * @private
   */
  _classifyTaskType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('代码') || lower.includes('code') || lower.includes('编程') ||
        lower.includes('debug') || lower.includes('bug') || lower.includes('函数')) return 'coding';
    if (lower.includes('搜索') || lower.includes('search') || lower.includes('查询') ||
        lower.includes('查找') || lower.includes('find')) return 'search';
    if (lower.includes('写作') || lower.includes('write') || lower.includes('创作') ||
        lower.includes('文章') || lower.includes('文案')) return 'writing';
    if (lower.includes('分析') || lower.includes('analyze') || lower.includes('比较') ||
        lower.includes('评估') || lower.includes('evaluate')) return 'analysis';
    if (lower.includes('计划') || lower.includes('plan') || lower.includes('规划') ||
        lower.includes('方案') || lower.includes('strategy')) return 'planning';
    if (lower.includes('系统') || lower.includes('system') || lower.includes('配置') ||
        lower.includes('安装') || lower.includes('部署')) return 'system';
    if (lower.includes('创意') || lower.includes('设计') || lower.includes('创造') ||
        lower.includes('idea') || lower.includes('灵感')) return 'creative';
    if (lower.includes('数据') || lower.includes('data') || lower.includes('统计') ||
        lower.includes('dataset') || lower.includes('表格')) return 'data';
    if (lower.includes('论文') || lower.includes('研究') || lower.includes('学术') ||
        lower.includes('paper') || lower.includes('research')) return 'academic';
    return 'general';
  }

  /**
   * 估算任务复杂度
   * @private
   * @param {string} text - 任务文本
   * @returns {string} TaskComplexity 枚举值
   */
  _estimateComplexity(text) {
    if (!text || typeof text !== 'string') return TaskComplexity.TRIVIAL;

    const lower = text.toLowerCase();
    let score = 0;

    // 长度因素
    if (text.length > 500) score += 4;
    else if (text.length > 200) score += 2;
    else if (text.length > 50) score += 1;

    // 多步骤/条件关键词
    const complexityKeywords = [
      '并且', '同时', '然后', '首先', '其次', '最后',
      'if', 'then', 'else', 'when', 'while',
      '步骤', 'step', 'phase', 'stage',
      '多个', 'multiple', 'several',
      '依赖', 'depend', 'prerequisite',
      '集成', 'integrate', 'combine', 'merge'
    ];
    for (const kw of complexityKeywords) {
      if (lower.includes(kw)) score += 1;
    }

    // 多域交叉
    const domains = ['代码', 'code', '搜索', 'search', '数据', 'data', '分析', 'analyze',
                     '写作', 'write', '系统', 'system', '设计', 'design'];
    const matchedDomains = new Set();
    for (const d of domains) {
      if (lower.includes(d)) matchedDomains.add(d);
    }
    if (matchedDomains.size >= 3) score += 3;
    else if (matchedDomains.size >= 2) score += 1;

    // 紧急/关键性关键词
    const criticalKeywords = ['紧急', 'urgent', 'critical', '关键', '重要', 'immediately',
                              '安全', 'security', '生产', 'production', '上线'];
    for (const kw of criticalKeywords) {
      if (lower.includes(kw)) score += 2;
    }

    // 复杂度判定
    if (score >= 10) return TaskComplexity.CRITICAL;
    if (score >= 7) return TaskComplexity.COMPLEX;
    if (score >= 4) return TaskComplexity.MODERATE;
    if (score >= 2) return TaskComplexity.SIMPLE;
    return TaskComplexity.TRIVIAL;
  }

  /**
   * 检测任务域
   * @private
   * @param {string} text - 任务文本
   * @returns {string} TaskDomain 枚举值
   */
  _detectDomain(text) {
    if (!text) return TaskDomain.UNKNOWN;
    const lower = text.toLowerCase();

    // 多域评分
    const scores = {};

    // 技术/代码域
    scores[TaskDomain.CODE] = 0;
    if (/函数|class|function|import|require|module|api|sdk|git|repo|代码|编程|debug|bug|重构/.test(lower)) scores[TaskDomain.CODE] += 3;
    if (/javascript|python|java|typescript|node|npm|yarn|docker|json|yaml/.test(lower)) scores[TaskDomain.CODE] += 2;
    if (/compile|build|deploy|test|lint|format|error|exception/.test(lower)) scores[TaskDomain.CODE] += 1;

    // 搜索域
    scores[TaskDomain.SEARCH] = 0;
    if (/搜索|search|查询|find|lookup|查找|谷歌|百度|bing/.test(lower)) scores[TaskDomain.SEARCH] += 3;
    if (/信息|information|news|新闻|最新|结果|result/.test(lower)) scores[TaskDomain.SEARCH] += 1;

    // 写作/创意域
    scores[TaskDomain.WRITING] = 0;
    if (/写作|write|文章|article|文案|content|内容|博客|blog/.test(lower)) scores[TaskDomain.WRITING] += 3;
    if (/编辑|edit|rewrite|重写|翻译|translate/.test(lower)) scores[TaskDomain.WRITING] += 2;

    // 创意域
    scores[TaskDomain.CREATIVE] = 0;
    if (/创意|创造|create|design|设计|灵感|idea|novel|故事|story/.test(lower)) scores[TaskDomain.CREATIVE] += 3;
    if (/艺术|art|音乐|music|图像|image|video|视频/.test(lower)) scores[TaskDomain.CREATIVE] += 2;

    // 分析域
    scores[TaskDomain.ANALYSIS] = 0;
    if (/分析|analyze|评估|evaluate|比较|compare|对比|研究|study/.test(lower)) scores[TaskDomain.ANALYSIS] += 3;
    if (/趋势|trend|统计|statistics|报告|report|总结|summary/.test(lower)) scores[TaskDomain.ANALYSIS] += 2;

    // 规划域
    scores[TaskDomain.PLANNING] = 0;
    if (/计划|plan|规划|strategy|策略|路线图|roadmap|schedule/.test(lower)) scores[TaskDomain.PLANNING] += 3;
    if (/目标|goal|objective|里程碑|milestone|timeline/.test(lower)) scores[TaskDomain.PLANNING] += 2;

    // 系统域
    scores[TaskDomain.SYSTEM] = 0;
    if (/系统|system|配置|config|安装|install|部署|deploy|运维|ops/.test(lower)) scores[TaskDomain.SYSTEM] += 3;
    if (/服务器|server|网络|network|数据库|database|备份|backup|故障|故障排查|修复|fix|恢复|restore/.test(lower)) scores[TaskDomain.SYSTEM] += 2;

    // 数据域
    scores[TaskDomain.DATA] = 0;
    if (/数据|data|dataset|csv|json|数据库|database|sql|table|表格/.test(lower)) scores[TaskDomain.DATA] += 3;
    if (/导入|export|import|导出|清洗|clean|transform|转换/.test(lower)) scores[TaskDomain.DATA] += 2;

    // 学术域
    scores[TaskDomain.ACADEMIC] = 0;
    if (/论文|paper|学术|academic|研究|research|引用|citation|文献|reference/.test(lower)) scores[TaskDomain.ACADEMIC] += 3;
    if (/期刊|journal|会议|conference|实验|experiment|假设|hypothesis/.test(lower)) scores[TaskDomain.ACADEMIC] += 2;

    // 选择最高分域
    let bestDomain = TaskDomain.UNKNOWN;
    let bestScore = 0;
    for (const [domain, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    return bestDomain;
  }

  /**
   * 估算任务工作量（0-100）
   * @private
   * @param {string} text - 任务文本
   * @param {string} complexity - 复杂度
   * @returns {number} 工作量评分
   */
  _estimateEffort(text, complexity) {
    if (!text) return 0;

    let baseEffort = 0;

    // 基于复杂度的基准工作量
    switch (complexity) {
      case TaskComplexity.TRIVIAL: baseEffort = 5; break;
      case TaskComplexity.SIMPLE: baseEffort = 15; break;
      case TaskComplexity.MODERATE: baseEffort = 35; break;
      case TaskComplexity.COMPLEX: baseEffort = 60; break;
      case TaskComplexity.CRITICAL: baseEffort = 85; break;
      default: baseEffort = 10;
    }

    // 文本长度调整
    const lengthFactor = Math.min(text.length / 1000, 1.5);

    // 领域特定调整
    const lower = text.toLowerCase();
    let domainFactor = 1.0;
    if (lower.includes('集成') || lower.includes('integrate') || lower.includes('迁移') || lower.includes('migrate')) {
      domainFactor = 1.5;
    } else if (lower.includes('优化') || lower.includes('optimize') || lower.includes('重构') || lower.includes('refactor')) {
      domainFactor = 1.3;
    }

    const effort = Math.min(Math.round(baseEffort * lengthFactor * domainFactor), 100);
    return effort;
  }

  /**
   * 估算任务紧迫度（0-100）
   * @private
   * @param {string} text - 任务文本
   * @returns {number} 紧迫度评分
   */
  _estimateUrgency(text) {
    if (!text) return 0;
    const lower = text.toLowerCase();

    let score = 0;

    // 强紧急信号
    const strongUrgency = ['紧急', 'urgent', 'asap', 'immediately', '立刻', '马上',
                           'critical', 'critical', '生产故障', 'production down',
                           '安全漏洞', 'security breach', '数据丢失', 'data loss'];
    for (const kw of strongUrgency) {
      if (lower.includes(kw)) score += 25;
    }

    // 中等紧急信号
    const mediumUrgency = ['尽快', 'soon', '今天', 'today', '今天内', '今天完成',
                           'deadline', '截止', '限期', 'priority', '优先'];
    for (const kw of mediumUrgency) {
      if (lower.includes(kw)) score += 10;
    }

    // 弱紧急信号
    const weakUrgency = ['请尽快', '有时间', 'when possible', '稍后', 'later',
                         '不着急', '不急', 'no rush'];
    for (const kw of weakUrgency) {
      if (lower.includes(kw)) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 提取关键词
   * @private
   * @param {string} text - 任务文本
   * @returns {string[]} 关键词列表
   */
  _extractKeywords(text) {
    if (!text) return [];
    // 使用更精确的分词：按空白和中英文标点分割
    const tokens = text.split(/[\s,，。.！？、；;:：""''【】《》（）()\[\]{}【】《》「」『』…—～·]+/);
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '有', '为',
      '对', '从', '到', '被', '把', '让', '给', '向', '以', '于',
      '就', '这', '那', '也', '还', '都', '而', '但', '可', '所',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'this', 'that', 'it', 'its', 'and', 'or', 'but', 'not',
      '我', '你', '他', '她', '它', '我们', '你们', '他们', '它们',
      '可以', '能够', '应该', '需要', '可能', '已经', '正在']);
    const keywords = tokens
      .filter(t => t.length >= 2 && !stopWords.has(t.toLowerCase()) && /[\u4e00-\u9fff\w]/.test(t))
      // 去重时保持顺序
      .filter((t, i, arr) => arr.indexOf(t) === i);
    return keywords.slice(0, 15);
  }

  // ========================================================================
  // 阶段 2: 规划
  // ========================================================================

  /**
   * 规划任务
   * @private
   */
  async _planTask(taskInput, analysis) {
    console.log('[TaskPipeline] 阶段 2: 规划任务');

    const complexity = analysis.complexity || TaskComplexity.TRIVIAL;
    const domain = analysis.domain || TaskDomain.UNKNOWN;
    const steps = this._generateSteps(analysis.type || 'general', complexity, domain, analysis.keywords || []);

    return {
      complexity,
      domain,
      plan: {
        type: analysis.type || 'general',
        approach: this._selectApproach(domain, complexity),
        steps,
        estimatedSteps: steps.length,
        parallelizable: steps.some(s => s.canParallel)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 选择处理策略
   * @private
   * @param {string} domain - 任务域
   * @param {string} complexity - 复杂度
   * @returns {string} 策略名称
   */
  _selectApproach(domain, complexity) {
    if (complexity === TaskComplexity.CRITICAL) return 'strict_verification';
    if (complexity === TaskComplexity.COMPLEX) return 'decompose_and_conquer';
    if (domain === TaskDomain.CODE) return 'incremental_review';
    if (domain === TaskDomain.ACADEMIC) return 'evidence_first';
    if (domain === TaskDomain.CREATIVE) return 'exploratory';
    if (domain === TaskDomain.SEARCH) return 'breadth_first';
    return 'cognitive';
  }

  /**
   * 根据域和复杂度生成具体规划步骤
   * @private
   * @param {string} type - 任务类型
   * @param {string} complexity - 复杂度
   * @param {string} domain - 任务域
   * @param {string[]} keywords - 关键词
   * @returns {Object[]} 步骤列表
   */
  _generateSteps(type, complexity, domain, keywords) {
    const steps = [];
    const stepId = () => `step-${steps.length + 1}`;

    // 通用初始步骤
    steps.push({
      id: stepId(),
      name: '理解任务需求',
      description: '解析输入，明确目标和约束',
      canParallel: false,
      estimatedComplexity: 'low'
    });

    // 域特定步骤
    switch (domain) {
      case TaskDomain.CODE:
        steps.push({
          id: stepId(),
          name: '代码审查',
          description: '审查相关代码，理解现有逻辑',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        steps.push({
          id: stepId(),
          name: '实现方案设计',
          description: '设计实现方案，考虑边界情况',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        if (complexity !== TaskComplexity.TRIVIAL) {
          steps.push({
            id: stepId(),
            name: '测试与验证',
            description: '编写测试用例，验证正确性',
            canParallel: true,
            estimatedComplexity: 'medium'
          });
        }
        break;

      case TaskDomain.SEARCH:
        steps.push({
          id: stepId(),
          name: '确定搜索范围',
          description: '明确搜索关键词和来源',
          canParallel: false,
          estimatedComplexity: 'low'
        });
        steps.push({
          id: stepId(),
          name: '多源检索',
          description: '从多个来源获取信息',
          canParallel: true,
          estimatedComplexity: 'low'
        });
        steps.push({
          id: stepId(),
          name: '信息整合',
          description: '汇总并筛选最相关信息',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        break;

      case TaskDomain.WRITING:
      case TaskDomain.CREATIVE:
        steps.push({
          id: stepId(),
          name: '大纲构建',
          description: '建立内容框架和结构',
          canParallel: false,
          estimatedComplexity: 'low'
        });
        steps.push({
          id: stepId(),
          name: '内容创作',
          description: '撰写主体内容',
          canParallel: false,
          estimatedComplexity: 'high'
        });
        steps.push({
          id: stepId(),
          name: '审校优化',
          description: '检查逻辑、语言和风格',
          canParallel: true,
          estimatedComplexity: 'medium'
        });
        break;

      case TaskDomain.ANALYSIS:
      case TaskDomain.ACADEMIC:
        steps.push({
          id: stepId(),
          name: '数据/信息收集',
          description: '获取待分析的材料',
          canParallel: true,
          estimatedComplexity: 'low'
        });
        steps.push({
          id: stepId(),
          name: '结构化分析',
          description: '按框架进行分析',
          canParallel: false,
          estimatedComplexity: 'high'
        });
        steps.push({
          id: stepId(),
          name: '结论提炼',
          description: '提取关键发现和建议',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        break;

      case TaskDomain.DATA:
        steps.push({
          id: stepId(),
          name: '数据探查',
          description: '了解数据结构、质量和格式',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        steps.push({
          id: stepId(),
          name: '数据处理',
          description: '清洗、转换、结构化',
          canParallel: true,
          estimatedComplexity: 'high'
        });
        steps.push({
          id: stepId(),
          name: '结果呈现',
          description: '输出结构化结果或可视化',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        break;

      case TaskDomain.SYSTEM:
        steps.push({
          id: stepId(),
          name: '环境评估',
          description: '检查当前系统状态和环境',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        steps.push({
          id: stepId(),
          name: '方案制定',
          description: '制定操作步骤和回退方案',
          canParallel: false,
          estimatedComplexity: 'high'
        });
        steps.push({
          id: stepId(),
          name: '执行与验证',
          description: '按方案执行并验证结果',
          canParallel: false,
          estimatedComplexity: 'high'
        });
        break;

      default:
        steps.push({
          id: stepId(),
          name: '信息收集',
          description: '收集任务相关信息',
          canParallel: true,
          estimatedComplexity: 'low'
        });
        steps.push({
          id: stepId(),
          name: '处理执行',
          description: '执行核心处理逻辑',
          canParallel: false,
          estimatedComplexity: 'medium'
        });
        steps.push({
          id: stepId(),
          name: '结果输出',
          description: '整理并输出最终结果',
          canParallel: false,
          estimatedComplexity: 'low'
        });
    }

    // 高复杂度任务增加验证步骤
    if (complexity === TaskComplexity.COMPLEX || complexity === TaskComplexity.CRITICAL) {
      steps.push({
        id: stepId(),
        name: '全面验证',
        description: '验证结果完整性、正确性和一致性',
        canParallel: false,
        estimatedComplexity: 'high'
      });
    }

    return steps;
  }

  // ========================================================================
  // 阶段 3: 验证
  // ========================================================================

  /**
   * 验证结果（认知层面）
   * @private
   */
  async _verifyResult({ analysis, plan }) {
    console.log('[TaskPipeline] 阶段 3: 认知验证');

    // 基本存在性检查
    const analysisValid = !!(analysis && analysis.text);
    const planValid = !!(plan && plan.plan && plan.plan.steps);
    const identityConsistent = !!(this.identityCore);

    // 语义检查
    const semanticCheck = this._semanticVerify(analysis, plan);

    const verified = analysisValid && planValid && identityConsistent && semanticCheck.overall;

    const verification = {
      success: verified,
      verified,
      timestamp: new Date().toISOString(),
      checks: {
        analysisValid,
        planValid,
        identityConsistent,
        ...semanticCheck.details
      },
      recommendations: this._generateRecommendations(semanticCheck.issues)
    };

    return verification;
  }

  /**
   * 语义验证
   * @private
   * @param {Object} analysis - 分析结果
   * @param {Object} plan - 规划结果
   * @returns {Object} 验证详情
   */
  _semanticVerify(analysis, plan) {
    const issues = [];
    const details = {};

    // 1. 一致性检查：分析类型 vs 规划类型
    if (analysis && plan && plan.plan) {
      const analysisType = analysis.type || 'unknown';
      const planType = plan.plan.type || 'unknown';
      details.typeConsistent = analysisType === planType || planType === 'general';
      if (!details.typeConsistent) {
        issues.push(`类型不一致: 分析=${analysisType}, 规划=${planType}`);
      }
    } else {
      details.typeConsistent = false;
      issues.push('分析或规划结果为空');
    }

    // 2. 完整性检查：规划步骤是否非空
    if (plan && plan.plan && plan.plan.steps) {
      details.hasSteps = plan.plan.steps.length > 0;
      if (!details.hasSteps) {
        issues.push('规划步骤为空');
      }
    } else {
      details.hasSteps = false;
      issues.push('缺少规划步骤');
    }

    // 3. 可行性检查：高复杂度任务应有更多步骤
    if (analysis && plan && plan.plan && plan.plan.steps) {
      const complexity = analysis.complexity || TaskComplexity.TRIVIAL;
      const stepCount = plan.plan.steps.length;
      let feasible = true;
      if (complexity === TaskComplexity.COMPLEX && stepCount < 3) {
        feasible = false;
        issues.push('复杂任务步骤不足 (需要≥3)');
      }
      if (complexity === TaskComplexity.CRITICAL && stepCount < 4) {
        feasible = false;
        issues.push('关键任务步骤不足 (需要≥4)');
      }
      details.feasible = feasible;
    } else {
      details.feasible = false;
    }

    // 4. 时间合理性检查
    if (plan && plan.timestamp && analysis && analysis.timestamp) {
      const planTime = new Date(plan.timestamp).getTime();
      const analysisTime = new Date(analysis.timestamp).getTime();
      details.timeOrdered = planTime >= analysisTime;
      if (!details.timeOrdered) {
        issues.push('时间戳异常: 规划早于分析');
      }
    } else {
      details.timeOrdered = true; // 无法检查时假定正确
    }

    // 整体判定
    const checks = [details.typeConsistent, details.hasSteps, details.feasible, details.timeOrdered];
    const passed = checks.filter(Boolean).length;
    const overall = passed >= 3;

    return { overall, details, issues };
  }

  /**
   * 生成验证建议
   * @private
   * @param {string[]} issues - 发现的问题列表
   * @returns {Object[]} 建议列表
   */
  _generateRecommendations(issues) {
    if (!issues || issues.length === 0) {
      return [{ priority: 'none', message: '未发现问题' }];
    }

    return issues.map(issue => {
      let priority = 'low';
      let suggestion = '';

      if (issue.includes('步骤为空')) {
        priority = 'high';
        suggestion = '请重新生成包含具体步骤的规划';
      } else if (issue.includes('步骤不足')) {
        priority = 'high';
        suggestion = '增加更多细化的子步骤';
      } else if (issue.includes('类型不一致')) {
        priority = 'medium';
        suggestion = '检查分析结果与规划目标是否对齐';
      } else if (issue.includes('为空')) {
        priority = 'critical';
        suggestion = '请检查输入是否完整';
      } else {
        suggestion = '建议重新评估';
      }

      return { priority, issue, suggestion };
    });
  }

  // ========================================================================
  // 历史管理
  // ========================================================================

  /**
   * 记录历史
   * @private
   */
  _recordToHistory(record) {
    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * 获取历史记录
   * @param {Object} [filter] - 过滤条件
   * @returns {Object[]} 历史记录
   */
  getHistory(filter) {
    let history = this.history;
    if (filter) {
      if (filter.type) {
        history = history.filter(h => h.type === filter.type);
      }
      if (filter.since) {
        history = history.filter(h => new Date(h.timestamp) >= new Date(filter.since));
      }
      if (filter.taskId) {
        history = history.filter(h => h.taskId === filter.taskId);
      }
    }
    return history;
  }

  /**
   * 清理历史记录
   * @param {number} [olderThanDays=7] - 删除早于此天数的记录
   * @returns {number} 删除的记录数
   */
  pruneHistory(olderThanDays = 7) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const before = this.history.length;
    this.history = this.history.filter(h => new Date(h.timestamp).getTime() >= cutoff);
    return before - this.history.length;
  }

  // ========================================================================
  // 指标管理
  // ========================================================================

  /**
   * 获取管道指标
   * @returns {Object} 指标摘要
   */
  getMetrics() {
    return this._sanitizeMetrics();
  }

  /**
   * 安全输出指标（处理 Infinity）
   * @private
   */
  _sanitizeMetrics() {
    const m = { ...this.pipelineMetrics };
    if (!Number.isFinite(m.minDurationMs)) m.minDurationMs = 0;
    if (m.totalTasks === 0) {
      m.avgDurationMs = 0;
      m.maxDurationMs = 0;
      m.minDurationMs = 0;
    }
    return m;
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    this.pipelineMetrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      totalDurationMs: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
      minDurationMs: Infinity,
      lastResetAt: new Date().toISOString()
    };
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 延迟工具
   * @private
   * @param {number} ms - 毫秒
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 健康检查
   * @returns {Object} 健康状态
   */
  healthCheck() {
    return {
      pipeline: 'healthy',
      state: this.pipelineState,
      identityCore: this.identityCore ? this.identityCore.healthCheck() : { status: 'no_identity' },
      metrics: this._sanitizeMetrics(),
      config: { ...this.config },
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  TaskPipeline,
  STATE,
  TaskComplexity,
  TaskDomain,
  PipelineError,
  VALID_TRANSITIONS
};
