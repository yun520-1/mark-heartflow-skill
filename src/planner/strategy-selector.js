/**
 * 策略选择器 (Strategy Selector) v1.1.0
 *
 * 根据任务特征选择最合适的规划策略。
 * 升级：输入验证 + 停用词过滤 + 震荡检测 + 质量评估 + 策略评分 + 统计追踪
 */

// ── 状态/枚举 ─────────────────────────────────────────────

const STRATEGY_STATE = Object.freeze({
  IDLE: 'idle',
  SELECTING: 'selecting',
  EXECUTING: 'executing',
  EVALUATING: 'evaluating',
  COMPLETED: 'completed',
  FAILED: 'failed'
});

const STRATEGY_ERROR = Object.freeze({
  EMPTY_INPUT: 'empty_input_error',
  INVALID_INPUT: 'invalid_input_error',
  STRATEGY_FAILED: 'strategy_execution_failed',
  EVALUATION_FAILED: 'evaluation_failed'
});

// ── 停用词表 ─────────────────────────────────────────────

const STOP_WORDS = new Set([
  // 中文停用词
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
  '什么', '怎么', '为什么', '如何', '哪个', '多少', '吗', '吧', '呢',
  '啊', '哦', '嗯', '然后', '因为', '所以', '但是', '如果', '虽然',
  '而且', '或者', '可以', '应该', '能够', '需要', '可能', '已经',
  '这个', '那个', '这些', '那些', '这里', '那里', '这样', '那样',
  '让', '被', '把', '从', '以', '为', '与', '对', '比', '向',
  '又', '再', '还', '才', '就', '都', '只', '但', '可', '便',
  // 英文停用词
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'and', 'but', 'or', 'nor', 'not',
  'so', 'yet', 'for', 'with', 'without', 'at', 'from', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'about', 'up', 'down', 'in', 'on',
  'of', 'to', 'by', 'as', 'if', 'which', 'who', 'whom', 'what'
]);

// ── 主类 ─────────────────────────────────────────────────

class StrategySelector {
  constructor(options = {}) {
    this.strategies = this._registerDefaultStrategies();
    this.learningPatterns = [];       // 历史模式追踪
    this.oscillationWindow = options.oscillationWindow || 10;
    this.maxPatterns = options.maxPatterns || 100;
    this.config = {
      strictTransitions: options.strictTransitions !== false,
      ...options
    };
    this._state = STRATEGY_STATE.IDLE;
    this._stats = {
      totalSelections: 0,
      totalFailures: 0,
      oscillationWarnings: 0,
      strategyCounts: {}
    };
  }

  // ── 输入验证层 ────────────────────────────────────────

  _safeInput(input) {
    if (input == null) return '';
    if (typeof input !== 'string') {
      try { return String(input); } catch (_) { return ''; }
    }
    return input;
  }

  _extractMeaningfulWords(text) {
    const safe = this._safeInput(text);
    if (!safe) return [];
    // 中英文分词：按空格和标点拆分
    const words = safe.split(/[\s,，。；;：:！!？?、()（）【】\[\]{}""''"'\\n\\r\\t]+/)
      .filter(w => w.length > 1)           // 过滤单字
      .filter(w => !STOP_WORDS.has(w.toLowerCase())) // 过滤停用词
      .filter(w => !/^[\d\s]+$/.test(w));  // 过滤纯数字
    return [...new Set(words)];
  }

  // ── 状态管理 ──────────────────────────────────────────

  _transitionTo(newState) {
    this._state = newState;
  }

  getState() {
    return this._state;
  }

  // ── 默认策略注册 ─────────────────────────────────────

  _registerDefaultStrategies() {
    return {
      sequential: {
        name: 'sequential',
        description: '顺序执行策略',
        score: 0.5,
        total: 0,
        success: 0
      },
      parallel: {
        name: 'parallel',
        description: '并行执行策略',
        score: 0.5,
        total: 0,
        success: 0
      },
      exploratory: {
        name: 'exploratory',
        description: '探索式执行策略',
        score: 0.5,
        total: 0,
        success: 0
      },
      conservative: {
        name: 'conservative',
        description: '保守执行策略',
        score: 0.5,
        total: 0,
        success: 0
      },
      aggressive: {
        name: 'aggressive',
        description: '激进执行策略',
        score: 0.5,
        total: 0,
        success: 0
      }
    };
  }

  // ── 震荡检测 ──────────────────────────────────────────

  detectOscillation(strategy) {
    // 双通道检测：learningPatterns（selectStrategy记录）+ 策略内部统计
    const recent = this.learningPatterns.slice(-this.oscillationWindow);
    const strategyUses = recent.filter(p => p.strategy === strategy);

    let failRate = 0;
    if (strategyUses.length >= 3) {
      const failures = strategyUses.filter(p => !p.success).length;
      failRate = failures / strategyUses.length;
    }

    // 补充：策略内部统计
    const s = this.strategies[strategy];
    if (s && s.total >= 3 && failRate === 0) {
      const internalFailRate = (s.total - s.success) / s.total;
      if (internalFailRate > 0.6) {
        failRate = internalFailRate;
      }
    }

    if (failRate > 0.6) {
      return Math.min(0.4, failRate * 0.5);  // 0.1 ~ 0.4 惩罚
    }
    return 0;
  }

  // ── 策略选择 ──────────────────────────────────────────

  selectStrategy(task, context = {}, options = {}) {
    this._transitionTo(STRATEGY_STATE.SELECTING);
    this._stats.totalSelections++;

    // 输入验证
    const safe = this._safeInput(typeof task === 'string' ? task : (task && task.description) || '');
    if (!safe) {
      this._transitionTo(STRATEGY_STATE.COMPLETED);
      return this._buildResult('sequential', 'empty_input', safe);
    }

    const environment = (context && context.environment) || 'development';
    const hasFailures = options && options.failureAnalysis != null;

    let strategyName;

    if (hasFailures) {
      strategyName = this._selectBasedOnFailure(options.failureAnalysis, options.previousStrategy);
    } else {
      strategyName = this._selectBasedOnTask(safe, environment, context);
    }

    // 震荡惩罚
    const oscillationPenalty = this.detectOscillation(strategyName);
    const baseScore = this.strategies[strategyName] ? this.strategies[strategyName].score : 0.5;
    const adjustedConfidence = Math.max(0.1, Math.min(0.95, baseScore - oscillationPenalty));

    this._transitionTo(STRATEGY_STATE.COMPLETED);

    // 记录使用
    if (this.strategies[strategyName]) {
      this.strategies[strategyName].total++;
    }
    this._stats.strategyCounts[strategyName] = (this._stats.strategyCounts[strategyName] || 0) + 1;

    // 记录学习模式
    this.learningPatterns.push({
      strategy: strategyName,
      success: true,
      timestamp: Date.now(),
      input: safe.substring(0, 100)
    });
    if (this.learningPatterns.length > this.maxPatterns) {
      this.learningPatterns = this.learningPatterns.slice(-this.maxPatterns);
    }

    return this._buildResult(strategyName, 'matched', safe, adjustedConfidence, environment);
  }

  _buildResult(strategyName, reason, inputText, confidence, environment) {
    const base = this.strategies[strategyName];
    const conf = confidence != null ? confidence : (base ? base.score : 0.5);

    // 生成分析结果
    const meaningfulWords = this._extractMeaningfulWords(inputText || '');

    return {
      name: strategyName,
      description: base ? base.description : '默认策略',
      confidence: conf,
      taskType: this._classifyTask(inputText || ''),
      environment: environment || 'development',
      analysis: {
        reason,
        meaningfulWords: meaningfulWords.slice(0, 8),
        oscillationPenalty: confidence != null ? Math.max(0, base.score - conf) : 0
      }
    };
  }

  // ── 基于任务特征选择 ──────────────────────────────────

  _selectBasedOnTask(taskText, environment, context) {
    // 危险操作使用保守策略
    if (this._isDangerousOperation(taskText, context)) {
      return 'conservative';
    }

    // 生产环境使用保守策略
    if (environment === 'production') {
      return 'conservative';
    }

    const taskType = this._classifyTask(taskText);

    // 调查任务使用探索式
    if (taskType === 'investigation' || taskType === 'debugging') {
      return 'exploratory';
    }

    // 并行任务
    if (context && context.parallelizable) {
      return 'parallel';
    }

    // 简单任务
    if (taskType === 'simple') {
      return 'sequential';
    }

    // 默认根据任务类型
    const typeToStrategy = {
      implementation: 'aggressive',
      investigation: 'exploratory',
      refactoring: 'conservative',
      debugging: 'exploratory',
      generic: 'sequential'
    };

    return typeToStrategy[taskType] || 'sequential';
  }

  // ── 基于失败选择 ──────────────────────────────────────

  _selectBasedOnFailure(failureAnalysis, previousStrategy) {
    if (!failureAnalysis) {
      return previousStrategy || 'sequential';
    }

    const { primaryError, errorPatterns } = failureAnalysis;
    const patterns = errorPatterns || {};

    // 语法错误 - 保守策略
    if (patterns.syntax) return 'conservative';
    // 超时错误 - 保守策略
    if (patterns.timeout) return 'conservative';
    // 依赖错误 - 保守策略
    if (patterns.dependency) return 'conservative';
    // 权限错误 - 保守策略
    if (patterns.permission) return 'conservative';

    // 如果之前是激进策略，改为保守
    if (previousStrategy === 'aggressive') return 'conservative';
    // 如果之前是探索策略，保持或改为顺序
    if (previousStrategy === 'exploratory') return 'sequential';

    // 默认保持当前策略但降低信心
    return previousStrategy || 'sequential';
  }

  // ── 分类任务 ──────────────────────────────────────────

  _classifyTask(task) {
    const taskStr = this._safeInput(typeof task === 'string' ? task : (task && task.description) || '');

    if (!taskStr) return 'generic';

    // 简单任务特征
    if (/^(ls|cd|pwd|echo|date|whoami)$/i.test(taskStr.trim())) {
      return 'simple';
    }

    // 复杂任务特征
    if (/实现|创建|开发|添加.*功能|构建|implement|create|build|add/i.test(taskStr)) return 'implementation';
    if (/调查|分析|研究|检查|查找|搜索|investigate|analyze|research|search/i.test(taskStr)) return 'investigation';
    if (/重构|重写|优化|整理|清理|refactor|rewrite|optimize/i.test(taskStr)) return 'refactoring';
    if (/调试|修复|解决|排查|错误|bug|debug|fix|resolve/i.test(taskStr)) return 'debugging';

    return 'generic';
  }

  // ── 判断是否危险操作 ──────────────────────────────────

  _isDangerousOperation(task, context = {}) {
    const taskStr = this._safeInput(typeof task === 'string' ? task : (task && task.description) || '');
    const dangerousPatterns = [
      /rm\s+-rf|rm\s+-r\s+\/|del\s+\/s\/q/i,  // 删除系统文件
      /DROP\s+TABLE|DELETE\s+FROM.*WHERE/i,    // 数据库删除
      /format\s+|mkfs/i,                        // 格式化
      /chmod\s+777|chmod\s+-R\s+777/i,         // 过度权限
      /shutdown|reboot|init\s+0/i,              // 系统关机
      /\|\s*sh|\|\s*bash|eval\s+/i,            // 管道到shell
      /curl.*\|.*sh|wget.*\|.*sh/i              // 下载并执行
    ];

    return dangerousPatterns.some(p => p.test(taskStr));
  }

  // ── 更新策略评分 ──────────────────────────────────────

  updateStrategyScore(strategyName, success) {
    const s = this.strategies[strategyName];
    if (s) {
      s.total++;
      if (success) s.success++;
      s.score = s.success / s.total;
    }
  }

  // ── 质量评估 ──────────────────────────────────────────

  assessQuality(strategyName, input, output) {
    if (!output) return 'poor';
    const meaningfulWords = this._extractMeaningfulWords(input);
    const inputWordCount = meaningfulWords.length;
    if (inputWordCount === 0) return 'poor';

    let coverage = 0;
    let specificity = 0;

    switch (strategyName) {
      case 'sequential': {
        const steps = output.steps || [];
        coverage = Math.min(1, steps.length / Math.max(1, inputWordCount));
        specificity = steps.some(s => s.length > 5) ? 1 : 0;
        break;
      }
      case 'exploratory': {
        const findings = output.findings || [];
        coverage = Math.min(1, findings.length / 3);
        specificity = findings.some(f => f.length > 5) ? 1 : 0;
        break;
      }
      case 'parallel': {
        const tasks = output.tasks || [];
        coverage = Math.min(1, tasks.length / 2);
        specificity = tasks.some(t => t.length > 5) ? 1 : 0;
        break;
      }
      case 'conservative':
      case 'aggressive': {
        coverage = output.safeguards ? 0.8 : 0.3;
        specificity = output.estimatedTime ? 0.7 : 0.3;
        break;
      }
      default:
        coverage = 0.5;
        specificity = 0.5;
    }

    const qualityScore = coverage * 0.6 + specificity * 0.4;
    if (qualityScore >= 0.6) return 'good';
    if (qualityScore >= 0.3) return 'fair';
    return 'poor';
  }

  // ── 注册自定义策略 ────────────────────────────────────

  registerStrategy(name, strategy) {
    this.strategies[name] = {
      name,
      score: strategy.score || 0.5,
      total: strategy.total || 0,
      success: strategy.success || 0,
      ...strategy
    };
  }

  // ── 获取所有策略 ──────────────────────────────────────

  getStrategies() {
    return Object.keys(this.strategies).map(k => ({
      name: k,
      score: this.strategies[k].score.toFixed(2),
      uses: this.strategies[k].total
    }));
  }

  // ── 统计与诊断 ────────────────────────────────────────

  getStats() {
    const bestEntry = Object.entries(this.strategies)
      .sort((a, b) => b[1].score - a[1].score)[0];
    const oscillationDetected = Object.keys(this.strategies)
      .some(s => this.detectOscillation(s) > 0);

    return {
      strategies: this.getStrategies(),
      patterns: this.learningPatterns.length,
      bestStrategy: bestEntry ? bestEntry[0] : 'sequential',
      oscillationDetected,
      oscillationWarnings: this._stats.oscillationWarnings,
      totalSelections: this._stats.totalSelections,
      strategyCounts: { ...this._stats.strategyCounts }
    };
  }

  // ── 重置统计 ──────────────────────────────────────────

  resetStats() {
    this._stats = {
      totalSelections: 0,
      totalFailures: 0,
      oscillationWarnings: 0,
      strategyCounts: {}
    };
    this.learningPatterns = [];
  }

  // ── 配置更新 ──────────────────────────────────────────

  configure(config) {
    if (config.oscillationWindow != null) {
      this.oscillationWindow = Math.max(3, Math.min(50, config.oscillationWindow));
    }
    if (config.maxPatterns != null) {
      this.maxPatterns = Math.max(10, Math.min(500, config.maxPatterns));
    }
    if (config.strictTransitions != null) {
      this.config.strictTransitions = config.strictTransitions;
    }
  }
}

module.exports = { StrategySelector, STRATEGY_STATE, STRATEGY_ERROR, STOP_WORDS };
