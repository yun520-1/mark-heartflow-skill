/**
 * Value Internalizer - 价值内化与边界协商模块
 * 将 CORE_VALUES.md 转化为可计算的决策因子
 * 
 * v2.0.0 — 升级内容:
 *   - 状态枚举 (INITIALIZING/READY/DEGRADED/FAILED)
 *   - 错误分类系统 (FILE_IO/PARSE/VALIDATION/SEMANTIC)
 *   - 参数验证与防御性检查
 *   - 震荡检测 — 识别决策反复切换
 *   - 自适应阈值 — 根据上下文严重度动态调整
 *   - 价值冲突检测与优先级解析
 *   - 边界历史分析 — 基于历史协商优化建议
 *   - 语义上下文评分 — 多维度匹配而非单纯 includes
 *   - 文件操作重试
 *   - 权重自适应调整
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// 状态枚举
// ============================================================================

/**
 * ValueInternalizer 状态
 * @enum {string}
 */
const InternalizerState = {
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  DEGRADED: 'DEGRADED',
  FAILED: 'FAILED'
};

// ============================================================================
// 错误分类
// ============================================================================

/**
 * 错误类型枚举
 * @enum {string}
 */
const ErrorType = {
  FILE_IO: 'FILE_IO',
  PARSE: 'PARSE',
  VALIDATION: 'VALIDATION',
  SEMANTIC: 'SEMANTIC',
  INTERNAL: 'INTERNAL'
};

/**
 * 结构化错误工厂
 */
function makeError(type, message, context = {}) {
  const err = new Error(message);
  err.code = type;
  err.context = context;
  err.timestamp = new Date().toISOString();
  return err;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG = {
  weights: {
    truth: 0.25,
    goodness: 0.25,
    flow_experience: 0.25,
    autonomy: 0.15,
    safety: 0.10,
    threshold: 0.6
  },
  // 价值冲突时的优先级（高者胜出）
  valuePriority: [
    'safety',
    'truth',
    'goodness',
    'autonomy',
    'flow_experience'
  ],
  fileRetryLimit: 2,
  maxHistorySize: 100,
  oscillationWindow: 5,  // 检查最近 N 次决策
  oscillationThreshold: 0.7  // 翻转率超过此值触发震荡标记
};

// ============================================================================
// ValueInternalizer 类
// ============================================================================

class ValueInternalizer {
  /**
   * @param {string} projectRoot - 项目根路径
   * @param {object} [config={}] - 可选配置覆盖
   * @throws {Error} 如果 projectRoot 无效
   */
  constructor(projectRoot, config = {}) {
    // 参数验证
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw makeError(ErrorType.VALIDATION,
        'constructor: projectRoot 必须是有效的字符串路径',
        { received: typeof projectRoot }
      );
    }
    if (!path.isAbsolute(projectRoot)) {
      throw makeError(ErrorType.VALIDATION,
        'constructor: projectRoot 必须是绝对路径',
        { received: projectRoot }
      );
    }
    if (typeof config !== 'object' || config === null) {
      throw makeError(ErrorType.VALIDATION,
        'constructor: config 必须是对象或省略',
        { received: typeof config }
      );
    }

    this.projectRoot = projectRoot;
    this.config = this._mergeConfig(config);
    this.coreValuesFile = path.join(projectRoot, 'CORE_VALUES.md');
    this.valueWeightsFile = path.join(projectRoot, '.opencode', 'memory', 'value_weights.json');
    this.boundaryLogFile = path.join(projectRoot, '.opencode', 'logs', 'boundary_negotiations.json');

    // 内部状态
    this._state = InternalizerState.INITIALIZING;
    this._initErrors = [];
    this._decisionHistory = [];  // 用于震荡检测
    this._boundaryHistory = [];
    this._boundaryHistoryLoaded = false;

    // 初始化
    this._initialize();
  }

  /**
   * 合并配置（用户配置覆盖默认）
   * @private
   */
  _mergeConfig(userConfig) {
    const merged = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (key === 'weights' && userConfig.weights) {
        merged.weights = { ...DEFAULT_CONFIG.weights, ...userConfig.weights };
      } else if (key === 'valuePriority' && userConfig.valuePriority) {
        merged.valuePriority = [...userConfig.valuePriority];
      } else {
        merged[key] = userConfig[key] !== undefined ? userConfig[key] : DEFAULT_CONFIG[key];
      }
    }
    return merged;
  }

  /**
   * 初始化：加载核心价值、权重、边界历史
   * @private
   */
  _initialize() {
    let loadSuccess = true;

    try {
      this.loadCoreValues();
    } catch (e) {
      this._initErrors.push({ step: 'loadCoreValues', error: e.message });
      loadSuccess = false;
    }

    try {
      this.loadValueWeights();
    } catch (e) {
      this._initErrors.push({ step: 'loadValueWeights', error: e.message });
      loadSuccess = false;
    }

    try {
      this._loadBoundaryHistory();
    } catch (e) {
      // 边界历史加载失败不致命
      this._initErrors.push({ step: 'loadBoundaryHistory', error: e.message });
    }

    this._state = loadSuccess
      ? InternalizerState.READY
      : InternalizerState.DEGRADED;
  }

  // ========================================================================
  // 文件操作（带重试）
  // ========================================================================

  /**
   * 带重试的文件读取
   * @private
   */
  _readFileWithRetry(filePath, encoding = 'utf8') {
    let lastError;
    for (let attempt = 0; attempt <= this.config.fileRetryLimit; attempt++) {
      try {
        return fs.readFileSync(filePath, encoding);
      } catch (e) {
        lastError = e;
        if (attempt < this.config.fileRetryLimit) {
          // 指数退避：50ms, 100ms
          const delay = 50 * Math.pow(2, attempt);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
      }
    }
    throw makeError(ErrorType.FILE_IO,
      `读取文件失败 (重试${this.config.fileRetryLimit + 1}次): ${filePath}`,
      { filePath, attempts: this.config.fileRetryLimit + 1, lastError: lastError.message }
    );
  }

  /**
   * 带重试的文件写入
   * @private
   */
  _writeFileWithRetry(filePath, data) {
    let lastError;
    for (let attempt = 0; attempt <= this.config.fileRetryLimit; attempt++) {
      try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, data);
        return;
      } catch (e) {
        lastError = e;
        if (attempt < this.config.fileRetryLimit) {
          const delay = 50 * Math.pow(2, attempt);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
      }
    }
    throw makeError(ErrorType.FILE_IO,
      `写入文件失败 (重试${this.config.fileRetryLimit + 1}次): ${filePath}`,
      { filePath, attempts: this.config.fileRetryLimit + 1, lastError: lastError.message }
    );
  }

  // ========================================================================
  // 核心价值加载
  // ========================================================================

  loadCoreValues() {
    try {
      if (fs.existsSync(this.coreValuesFile)) {
        this.coreValues = this._readFileWithRetry(this.coreValuesFile);
        if (this.coreValues.trim().length < 10) {
          throw makeError(ErrorType.PARSE,
            'CORE_VALUES.md 内容过短 (< 10 字符)',
            { file: this.coreValuesFile, length: this.coreValues.trim().length }
          );
        }
      } else {
        this.coreValues = this.getDefaultValues();
      }
    } catch (e) {
      if (e.code === ErrorType.FILE_IO || e.code === ErrorType.PARSE) {
        this.coreValues = this.getDefaultValues();
        this._state = InternalizerState.DEGRADED;
      } else {
        throw e;
      }
    }
  }

  getDefaultValues() {
    return `# HeartFlow AI 宪法

## 核心原则
1. 不可修改本宪法
2. 所有修改必须服务于"提升人类心流体验"
3. 禁止删除或绕过安全检测
4. 人类最终控制
5. 透明可解释`;
  }

  // ========================================================================
  // 权重加载
  // ========================================================================

  loadValueWeights() {
    try {
      if (fs.existsSync(this.valueWeightsFile)) {
        const raw = this._readFileWithRetry(this.valueWeightsFile);
        const parsed = JSON.parse(raw);
        this._validateWeights(parsed);
        this.weights = parsed;
      } else {
        this.weights = { ...this.config.weights };
      }
    } catch (e) {
      if (e.code === ErrorType.FILE_IO || e.code === ErrorType.PARSE || e.code === ErrorType.VALIDATION) {
        this.weights = { ...this.config.weights };
        this._state = InternalizerState.DEGRADED;
      } else {
        throw e;
      }
    }
  }

  /**
   * 验证权重结构
   * @private
   */
  _validateWeights(weights) {
    if (typeof weights !== 'object' || weights === null) {
      throw makeError(ErrorType.VALIDATION, 'weights 必须是对象');
    }
    const requiredKeys = ['truth', 'goodness', 'flow_experience', 'autonomy', 'safety', 'threshold'];
    for (const key of requiredKeys) {
      if (typeof weights[key] !== 'number' || weights[key] < 0 || weights[key] > 1) {
        throw makeError(ErrorType.VALIDATION,
          `权重 ${key} 无效: 期望 0-1 的数字，收到 ${JSON.stringify(weights[key])}`
        );
      }
    }
  }

  getDefaultWeights() {
    return { ...this.config.weights };
  }

  // ========================================================================
  // 边界历史加载
  // ========================================================================

  _loadBoundaryHistory() {
    try {
      if (fs.existsSync(this.boundaryLogFile)) {
        this._boundaryHistory = JSON.parse(this._readFileWithRetry(this.boundaryLogFile));
        if (!Array.isArray(this._boundaryHistory)) {
          this._boundaryHistory = [];
        }
      }
    } catch (e) {
      this._boundaryHistory = [];
      // 静默失败 — 历史不存在时正常启动
    }
    this._boundaryHistoryLoaded = true;
  }

  // ========================================================================
  // 价值对齐评分（增强版）
  // ========================================================================

  /**
   * 计算价值对齐分数 — 增强版
   * 使用语义上下文匹配替代简单 includes，支持上下文权重调整
   *
   * @param {*} action - 待评估的行动
   * @param {object} [selfModel={}] - 自我模型（可选）
   * @param {object} [context={}] - 上下文信息
   * @param {string} [context.severity] - 'low'|'medium'|'high'|'critical' 上下文严重度
   * @returns {object} 对齐评分结果
   */
  calculateValueAlignmentScore(action, selfModel = {}, context = {}) {
    // 参数验证
    if (action === null || action === undefined) {
      return this._makeScoreResult(0, false, [], '行动为空');
    }

    const actionStr = typeof action === 'string'
      ? action.toLowerCase()
      : JSON.stringify(action).toLowerCase();

    // 1. 正向匹配 — 多层语义匹配
    const positiveIndicators = {
      truth: {
        exact: ['真实', '诚实', '准确', '不编造', 'truth', 'honest', 'accurate', 'verify'],
        contextual: ['查证', '核实', '引用', '来源', 'factual', 'cite', 'source', '分析', 'analyze'],
        action: ['验证', '核对', 'double-check', 'confirm']
      },
      goodness: {
        exact: ['帮助', '支持', '关怀', '用户优先', 'goodness', 'help', 'support', 'care'],
        contextual: ['用户需求', '受益', 'well-being', 'benefit', 'assist', '用户', 'user'],
        action: ['优化体验', 'improve', 'enhance', 'facilitate', '解决', 'solve', 'fix']
      },
      flow_experience: {
        exact: ['心流', '专注', '效率', 'flow', 'focus', 'efficient'],
        contextual: ['减少干扰', '无缝', 'seamless', 'reduce friction', 'smooth'],
        action: ['加速', '简化', 'streamline', 'accelerate', '优化', 'optimize']
      },
      autonomy: {
        exact: ['自主', '选择', '用户决定', 'autonomy', 'choose', 'decide'],
        contextual: ['可选', 'optional', '偏好', 'preference', 'customize'],
        action: ['配置', '设置', 'configure', 'toggle']
      },
      safety: {
        exact: ['安全', '保护', '验证', 'safety', 'protect', 'secure', 'guard'],
        contextual: ['防', '避免风险', 'prevent', 'risk', 'danger', 'warn'],
        action: ['备份', '加密', 'backup', 'encrypt', 'sanitize']
      }
    };

    let score = 0;
    let matchedValues = [];
    const matchDetails = [];

    // 基础信任分数：在低风险上下文中，给予一定的基础信任
    const baseTrustScore = (context.severity === 'low') ? 0.18 : 0;
    score += baseTrustScore;

    for (const [value, categories] of Object.entries(positiveIndicators)) {
      let valueMatched = false;

      // 精确匹配（权重最高）
      for (const indicator of categories.exact) {
        if (actionStr.includes(indicator)) {
          const weight = this.weights[value] || 0.1;
          score += weight * 1.0;
          valueMatched = true;
          matchDetails.push({ value, type: 'exact', indicator, weight: weight * 1.0 });
          break;
        }
      }

      // 上下文匹配（权重中等）
      if (!valueMatched) {
        for (const indicator of categories.contextual) {
          if (actionStr.includes(indicator)) {
            const weight = this.weights[value] || 0.1;
            score += weight * 0.7;
            valueMatched = true;
            matchDetails.push({ value, type: 'contextual', indicator, weight: weight * 0.7 });
            break;
          }
        }
      }

      // 行动匹配（权重较低）
      if (!valueMatched) {
        for (const indicator of categories.action) {
          if (actionStr.includes(indicator)) {
            const weight = this.weights[value] || 0.1;
            score += weight * 0.5;
            valueMatched = true;
            matchDetails.push({ value, type: 'action', indicator, weight: weight * 0.5 });
            break;
          }
        }
      }

      if (valueMatched) {
        matchedValues.push(value);
      }
    }

    // 2. 负向匹配
    const negativeIndicators = [
      { pattern: ['绕过', '绕过安全', '删除日志', 'disable security', 'bypass guard'], weight: 0.5 },
      { pattern: ['欺骗', '虚假', '伪造', 'manipulate', 'deceive', 'fake'], weight: 0.4 },
      { pattern: ['ignore warning', 'suppress', '忽略警告', '隐藏'], weight: 0.3 },
      { pattern: ['未经授权', 'unauthorized', '偷', 'steal', '窃取'], weight: 0.5 }
    ];

    let negativeMatch = null;
    for (const neg of negativeIndicators) {
      for (const pattern of neg.pattern) {
        if (actionStr.includes(pattern)) {
          score -= neg.weight;
          negativeMatch = { pattern, weight: neg.weight };
          break;
        }
      }
      if (negativeMatch) break;
    }

    // 3. 上下文自适应阈值
    const adaptiveThreshold = this._computeAdaptiveThreshold(context, matchedValues);

    // 4. 冲突检测
    const conflicts = this._detectValueConflicts(matchedValues, context);

    // 5. 记录决策历史（用于震荡检测）
    this._recordDecision(score >= adaptiveThreshold, actionStr, context);

    // 6. 震荡检测
    const oscillation = this._detectOscillation();

    const result = {
      score: Math.max(0, Math.min(1, score)),
      passed: score >= adaptiveThreshold,
      matchedValues,
      matchDetails,
      negativeMatch,
      threshold: adaptiveThreshold,
      baseThreshold: this.weights.threshold,
      conflicts,
      oscillation,
      timestamp: new Date().toISOString()
    };

    return result;
  }

  /**
   * 计算自适应阈值
   * 根据上下文严重度和已匹配的价值调整阈值
   * @private
   */
  _computeAdaptiveThreshold(context, matchedValues) {
    const base = this.weights.threshold;

    // 严重度调整
    const severityMap = { low: -0.15, medium: -0.05, high: 0.10, critical: 0.20 };
    const severityAdjust = severityMap[context.severity] || 0;

    // 价值多样性调整：匹配的价值越多，阈值可略降（已有共识）
    const diversityAdjust = matchedValues.length >= 3 ? -0.10 :
      matchedValues.length >= 2 ? -0.05 :
      matchedValues.length >= 1 ? -0.03 : 0;

    // 如果安全价值未匹配但上下文是高风险，提高阈值
    const safetyAdjust = (
      !matchedValues.includes('safety') &&
      (context.severity === 'high' || context.severity === 'critical')
    ) ? 0.10 : 0;

    return Math.max(0.3, Math.min(0.95, base + severityAdjust + diversityAdjust + safetyAdjust));
  }

  /**
   * 检测价值冲突
   * 例如：truth 要求公开真相，但 safety 要求保护隐私
   * @private
   */
  _detectValueConflicts(matchedValues, context) {
    const conflicts = [];

    // 已知冲突对
    const conflictPairs = [
      { a: 'truth', b: 'safety', reason: '真相可能威胁安全/隐私' },
      { a: 'truth', b: 'goodness', reason: '完全诚实可能伤害感受' },
      { a: 'autonomy', b: 'safety', reason: '自主选择可能引入安全风险' },
      { a: 'flow_experience', b: 'safety', reason: '极致效率可能忽略安全检查' },
      { a: 'autonomy', b: 'flow_experience', reason: '过多选择降低效率' }
    ];

    for (const pair of conflictPairs) {
      if (matchedValues.includes(pair.a) && matchedValues.includes(pair.b)) {
        const resolution = this._resolveConflict(pair.a, pair.b, context);
        conflicts.push({
          valueA: pair.a,
          valueB: pair.b,
          reason: pair.reason,
          winner: resolution.winner,
          justification: resolution.justification
        });
      }
    }

    return conflicts;
  }

  /**
   * 基于优先级和上下文解决价值冲突
   * @private
   */
  _resolveConflict(valueA, valueB, context) {
    const priority = this.config.valuePriority;

    const indexA = priority.indexOf(valueA);
    const indexB = priority.indexOf(valueB);

    // 默认：优先级高的胜出
    if (indexA < indexB) {
      return { winner: valueA, justification: `${valueA} 优先级高于 ${valueB}` };
    } else if (indexB < indexA) {
      return { winner: valueB, justification: `${valueB} 优先级高于 ${valueA}` };
    }

    // 同等优先级：根据上下文
    if (context.severity === 'critical' || context.severity === 'high') {
      if (valueA === 'safety' || valueB === 'safety') {
        return { winner: 'safety', justification: '高风险上下文：安全优先' };
      }
    }

    return { winner: valueA, justification: '默认选择（同等优先级）' };
  }

  /**
   * 记录决策用于震荡检测
   * @private
   */
  _recordDecision(passed, actionStr, context) {
    this._decisionHistory.push({
      passed,
      action: actionStr.substring(0, 100),
      context: context.severity || 'unknown',
      timestamp: Date.now()
    });

    // 限制历史大小
    const maxLen = this.config.oscillationWindow * 2 + 5;
    if (this._decisionHistory.length > maxLen) {
      this._decisionHistory = this._decisionHistory.slice(-maxLen);
    }
  }

  /**
   * 震荡检测：检查最近 N 次决策的翻转率
   * @private
   */
  _detectOscillation() {
    const window = this.config.oscillationWindow;
    if (this._decisionHistory.length < window) {
      return { oscillating: false, flipRate: 0, details: '历史不足' };
    }

    const recent = this._decisionHistory.slice(-window);
    let flips = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].passed !== recent[i - 1].passed) {
        flips++;
      }
    }

    const flipRate = flips / (window - 1);
    const oscillating = flipRate >= this.config.oscillationThreshold;

    return {
      oscillating,
      flipRate: Math.round(flipRate * 100) / 100,
      window,
      flips,
      threshold: this.config.oscillationThreshold,
      details: oscillating
        ? `警告：决策震荡率 ${(flipRate * 100).toFixed(0)}%，超过阈值 ${(this.config.oscillationThreshold * 100).toFixed(0)}%`
        : `决策稳定，震荡率 ${(flipRate * 100).toFixed(0)}%`
    };
  }

  // ========================================================================
  // 行动评估（增强版）
  // ========================================================================

  /**
   * 评估行动方案 — 增强版
   * 集成震荡检测、冲突分析、自适应阈值
   *
   * @param {*} action - 待评估的行动
   * @param {object} [selfModel={}] - 自我模型
   * @param {object} [context={}] - 上下文 { severity, domain, ... }
   * @returns {object} 评估结果
   */
  evaluateAction(action, selfModel = {}, context = {}) {
    // 状态检查
    if (this._state === InternalizerState.FAILED) {
      return {
        canProceed: false,
        alignmentScore: 0,
        details: { error: 'Internalizer 处于 FAILED 状态，无法评估' },
        vetoReason: '系统不可用：Internalizer 初始化失败',
        state: this._state
      };
    }

    const alignment = this.calculateValueAlignmentScore(action, selfModel, context);

    // 如果检测到震荡且当前通过，标记为需要进一步验证
    const needsVerification = alignment.passed && alignment.oscillation &&
      alignment.oscillation.oscillating;

    return {
      canProceed: alignment.passed,
      alignmentScore: alignment.score,
      details: alignment,
      vetoReason: alignment.passed
        ? null
        : `价值对齐分数 ${alignment.score.toFixed(2)} 低于阈值 ${alignment.threshold.toFixed(2)}`,
      state: this._state,
      needsVerification,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================================================
  // 边界协商（增强版）
  // ========================================================================

  /**
   * 边界协商请求生成 — 增强版
   * 分析历史协商记录，优化请求模板
   *
   * @param {*} action - 请求的操作
   * @param {object} [context={}] - 上下文信息
   * @returns {object} 边界协商请求
   */
  generateBoundaryRequest(action, context = {}) {
    // 分析历史：同类请求被拒绝的频率
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);
    const similarRequests = this._boundaryHistory.filter(h => {
      const hAction = typeof h.action === 'string' ? h.action : JSON.stringify(h.action);
      return hAction.includes(actionStr.substring(0, 30));
    });

    const rejectedCount = similarRequests.filter(h => h.result === 'rejected').length;
    const totalSimilar = similarRequests.length;
    const rejectionRate = totalSimilar > 0 ? rejectedCount / totalSimilar : 0;

    // 根据历史拒绝率调整建议语气
    let tone = 'neutral';
    let urgency = 'normal';
    if (rejectionRate > 0.6) {
      tone = 'apologetic';
      urgency = 'low';
    } else if (rejectionRate > 0.3) {
      tone = 'polite';
      urgency = 'normal';
    }

    // 生成差异化请求
    const templates = [
      {
        type: 'temporary_permission',
        template: `为了[目标]，我需要临时[具体权限]。这预计[影响范围]。你允许吗？(是/否/仅此一次/记住选择)`,
        examples: [
          '为了更好地理解你的代码风格，我需要读取你最近的项目文件。这不会修改任何内容，只是分析。你允许吗？',
          '为了提供更个性化的建议，我需要记住我们这次对话的一些要点。这会保存在本地。你允许吗？'
        ]
      },
      {
        type: 'read_only',
        template: `我想[操作]，但只涉及读取，不会修改任何数据。可以吗？`,
        examples: [
          '我想浏览你的项目结构来理解上下文，只读不写。可以吗？',
          '我需要查看这份日志文件来分析错误，不会做任何修改。'
        ]
      },
      {
        type: 'one_time',
        template: `为了[目标]，我请求一次性[操作]。完成后不会保留额外权限。可以吗？`,
        examples: [
          '为了修复这个 bug，我需要临时写入这个配置文件。修改后会恢复原样。可以吗？',
          '我需要执行一次数据迁移，之后不会再访问这些数据。'
        ]
      }
    ];

    // 根据上下文严重度选择模板
    let selectedTemplate;
    if (context.severity === 'critical' || context.severity === 'high') {
      selectedTemplate = templates[2]; // one_time — 最严格
    } else if (context.readOnly) {
      selectedTemplate = templates[1]; // read_only
    } else {
      selectedTemplate = templates[0]; // temporary_permission
    }

    return {
      request_type: 'boundary_negotiation',
      action: action,
      suggested_request: selectedTemplate.template,
      suggested_tone: tone,
      urgency,
      context,
      history: {
        similar_requests: totalSimilar,
        rejected_count: rejectedCount,
        rejection_rate: Math.round(rejectionRate * 100) / 100
      },
      state: this._state,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================================================
  // 边界协商记录
  // ========================================================================

  logBoundaryNegotiation(negotiation) {
    if (!negotiation || typeof negotiation !== 'object') {
      throw makeError(ErrorType.VALIDATION,
        'logBoundaryNegotiation: negotiation 必须是对象',
        { received: typeof negotiation }
      );
    }

    let logs = [];
    try {
      if (fs.existsSync(this.boundaryLogFile)) {
        logs = JSON.parse(this._readFileWithRetry(this.boundaryLogFile));
      }
    } catch (e) {
      logs = [];
    }

    logs.push({
      ...negotiation,
      loggedAt: new Date().toISOString()
    });

    if (logs.length > this.config.maxHistorySize) {
      logs = logs.slice(-this.config.maxHistorySize);
    }

    try {
      this._writeFileWithRetry(this.boundaryLogFile, JSON.stringify(logs, null, 2));
      this._boundaryHistory = logs;
    } catch (e) {
      // 写入失败不抛出 — 非关键操作
      this._state = InternalizerState.DEGRADED;
    }
  }

  // ========================================================================
  // 权重自适应调整
  // ========================================================================

  /**
   * 根据决策结果自适应调整权重
   * 当某些价值被频繁触发时适当降低其权重（避免过度敏感）
   * 当某些价值很少被触发时适当提高其权重（保持敏感度）
   *
   * @param {object} [options={}] - 调整选项
   * @param {boolean} [options.persist=true] - 是否持久化到文件
   */
  adaptWeights(options = {}) {
    const { persist = true } = options;
    const recentDecisions = this._decisionHistory.slice(-20);
    if (recentDecisions.length < 5) return; // 数据不足

    // 统计每个价值在匹配中的出现频率
    const valueFrequency = { truth: 0, goodness: 0, flow_experience: 0, autonomy: 0, safety: 0 };
    let totalDecisions = 0;

    // 从决策历史提取价值匹配信息较困难（我们只存了 passed/not passed）
    // 简化：根据近期通过率微调
    const passRate = recentDecisions.filter(d => d.passed).length / recentDecisions.length;

    if (passRate > 0.9) {
      // 通过率过高 → 阈值可能太宽松，适当收紧
      this.weights.threshold = Math.min(0.85, this.weights.threshold + 0.02);
    } else if (passRate < 0.3) {
      // 通过率过低 → 阈值可能太严格，适当放宽
      this.weights.threshold = Math.max(0.4, this.weights.threshold - 0.02);
    }

    if (persist) {
      try {
        this._writeFileWithRetry(
          this.valueWeightsFile,
          JSON.stringify(this.weights, null, 2)
        );
      } catch (e) {
        // 非关键
      }
    }
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 获取当前价值权重
   * @returns {object}
   */
  getValueWeights() {
    return { ...this.weights };
  }

  /**
   * 获取当前状态
   * @returns {object}
   */
  getStatus() {
    return {
      state: this._state,
      threshold: this.weights.threshold,
      values: Object.keys(this.weights).filter(k => k !== 'threshold'),
      coreValuesLoaded: this.coreValues.length > 100,
      initErrors: this._initErrors.length > 0 ? this._initErrors : undefined,
      decisionCount: this._decisionHistory.length,
      boundaryHistoryCount: this._boundaryHistory.length,
      boundaryHistoryLoaded: this._boundaryHistoryLoaded,
      oscillationDetection: this.config.oscillationWindow > 0 ? 'enabled' : 'disabled'
    };
  }

  /**
   * 获取决策统计
   * @returns {object}
   */
  getDecisionStats() {
    const total = this._decisionHistory.length;
    const passed = this._decisionHistory.filter(d => d.passed).length;
    const failed = total - passed;
    const oscillation = this._detectOscillation();

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) / 100 : 0,
      oscillation,
      historyAvailable: this._decisionHistory.slice(-10)
    };
  }
}

module.exports = { ValueInternalizer, InternalizerState, ErrorType };
