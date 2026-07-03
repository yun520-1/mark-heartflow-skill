/**
 * ReflexionEngine v1.0.0 — 语言强化学习反思引擎
 *
 * 灵感来源:
 * - Reflexion (Shinn et al., 2023) — 语言代理通过自然语言反思实现自我改进
 * - STaR (2023) — Self-Taught Reasoner: 从自身推理中学习
 * - LLaMA-Berry (2024) — 通过强化学习 + 自我训练优化推理
 *
 * 核心机制:
 * 1. 行动后反思 (Post-Action Reflection)
 * 2. 失败经验提取 (Failure Experience Extraction)
 * 3. 可复用策略构建 (Reusable Strategy Construction)
 * 4. 自我改进循环 (Self-Improvement Loop)
 *    act → reflect → refine → re-act
 */

const VERSION = '1.0.0';

class ReflexionEngine {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxReflections: options.maxReflections || 10,  // 每个任务最大反思次数
      maxReflectionLength: options.maxReflectionLength || 500,  // 最大反思长度
      reflectionWindow: options.reflectionWindow || 100,  // 反思窗口大小
      successThreshold: options.successThreshold || 0.7,  // 成功阈值
      strategyMinFrequency: options.strategyMinFrequency || 2,  // 策略最小出现次数
    };

    // 状态
    this.reflections = [];  // 反思历史
    this.strategies = new Map();  // 学到的策略
    this.failurePatterns = new Map();  // 失败模式
    this.currentTask = null;  // 当前任务上下文
    this.reflectionCount = 0;
    this.successRate = 0;
    this.improvementRate = 0;
  }

  /**
   * 记录一次行动的结果
   * @param {Object} task - 任务描述 {input, expected, output}
   * @param {Object} result - 行动结果 {success, output, error}
   * @returns {Object} 反思结果
   */
  reflect(task, result) {
    this.currentTask = task;
    this.reflectionCount++;

    // 更新成功率
    const total = this.reflectionCount;
    const successes = this.reflections.filter(r => r.result.success).length + (result.success ? 1 : 0);
    this.successRate = successes / total;

    // 生成反思
    const reflection = this._generateReflection(task, result);

    // 提取经验教训
    const lesson = this._extractLesson(task, result, reflection);

    // 元认知: 评估不确定性来源
    const metacognition = this._assessUncertainty(task, result, reflection);

    // 更新/创建策略
    this._updateStrategies(lesson);

    // 记录反思
    this.reflections.push({
      task: task.input,
      result: result.success ? 'success' : 'failure',
      output: result.output,
      error: result.error,
      reflection,
      lesson,
      metacognition,
      timestamp: new Date().toISOString(),
    });

    // 保持反思窗口大小
    if (this.reflections.length > this.config.reflectionWindow) {
      this.reflections = this.reflections.slice(-this.config.reflectionWindow);
    }

    // 计算改进率
    this._calculateImprovementRate();

    return {
      reflection,
      lesson,
      metacognition,
      strategy: this._suggestStrategy(task.input),
      improvementRate: this.improvementRate,
    };
  }

  /**
   * 生成反思内容
   * 包含认知层级分类: known-knowns / known-unknowns / unknown-unknowns
   * @private
   */
  _generateReflection(task, result) {
    if (result.success) {
      return {
        type: 'success',
        summary: `成功完成: ${task.input.slice(0, 100)}`,
        keyFactors: [
          '路径选择正确',
          '推理充分',
          '工具使用得当',
        ],
        insight: '当前策略有效，应保持',
        confidence: 0.8,
        knownKnowns: ['当前策略已被验证有效'],
        knownUnknowns: ['未验证同类任务的边界条件'],
        unknownUnknowns: [],
      };
    } else {
      return {
        type: 'failure',
        summary: `失败: ${task.input.slice(0, 100)}`,
        keyFactors: [
          result.error || '未知错误',
          '可能需要更多上下文',
          '可能需要不同的推理路径',
        ],
        insight: this._analyzeFailure(task, result),
        confidence: 0.6,
        knownKnowns: ['明确的错误信号已捕获'],
        knownUnknowns: ['失败原因是否可归因于当前策略的固有缺陷'],
        unknownUnknowns: ['未探索的推理路径中是否存在正确解法'],
      };
    }
  }

  /**
   * 元认知: 评估"为什么我不确定?"
   * 产生结构化的不确定性分析,帮助引擎理解自身的认知局限
   * @private
   */
  _assessUncertainty(task, result, reflection) {
    const sources = [];
    const mitigations = [];
    let level = 0;

    // 1. 冷启动 — 数据不足
    if (this.reflectionCount < 5) {
      sources.push('cold_start_insufficient_data');
      mitigations.push('gather more examples before trusting strategies');
      level += 0.3;
    }

    // 2. 是否首次遇到此类任务?
    const category = this._categorizeTask(task.input);
    if (!this.strategies.has(category)) {
      sources.push('novel_task_category');
      mitigations.push('search for analogous past reflections in other categories');
      level += 0.25;
    } else {
      const strat = this.strategies.get(category);
      if (strat.successRate < this.config.successThreshold) {
        sources.push('low_strategy_success_rate');
        mitigations.push('try alternative approaches or request more context');
        level += 0.2;
      }
      // 策略使用次数太少
      const totalAttempts = strat.successes + strat.failures;
      if (totalAttempts < this.config.strategyMinFrequency) {
        sources.push('strategy_under_verified');
        mitigations.push('collect more samples before committing to a strategy');
        level += 0.1;
      }
    }

    // 3. 冲突的反思
    if (this.reflections.length > 5) {
      const recent = this.reflections.slice(-10);
      const successThenFail = recent.some((r, i) =>
        i > 0 && r.result === 'success' && recent[i - 1].result === 'failure' &&
        r.task === recent[i - 1].task
      );
      if (successThenFail) {
        sources.push('conflicting_outcomes_same_task');
        mitigations.push('investigate what changed between attempts');
        level += 0.15;
      }
    }

    // 4. 改进率为负 — 系统在退步
    if (this.reflectionCount >= 40 && this.improvementRate < 0) {
      sources.push('regression_detected');
      mitigations.push('review recently acquired strategies for faulty patterns');
      level += 0.2;
    }

    // 5. 失败结果的不确定性
    if (!result.success) {
      const error = result.error || '';
      if (!error) {
        sources.push('unknown_failure_cause');
        mitigations.push('request explicit error details to reduce ambiguity');
        level += 0.2;
      }
      // 是否是已知失败模式?
      const patternKey = `${category}:${reflection.insight.slice(0, 50)}`;
      if (!this.failurePatterns.has(patternKey)) {
        sources.push('unseen_failure_pattern');
        mitigations.push('cross-reference with similar failures to build a pattern');
        level += 0.15;
      }
      // 失败但成功率高意味着 "outlier"
      if (this.strategies.has(category) && this.strategies.get(category).successRate > 0.8) {
        sources.push('outlier_failure_high_confidence_context');
        mitigations.push('likely a transient error; verify before altering the strategy');
        level += 0.05;
      }
    }

    // 6. 反思本身的置信度偏低
    if (reflection.confidence < 0.5) {
      sources.push('low_reflection_confidence');
      mitigations.push('deeper analysis of task requirements needed');
      level += 0.15;
    }

    // 归一化到 [0, 1]
    level = Math.min(level, 1.0);

    // 默认兜底: 如果完全没有来源,但结果是失败,至少有一点不确定性
    if (sources.length === 0 && !result.success) {
      level = 0.15;
      sources.push('default_uncertainty_failure');
      mitigations.push('analyze failure more deeply to identify uncertainty sources');
    }

    return {
      level: Math.round(level * 100) / 100,
      sources,
      mitigations,
      summary: sources.length > 0
        ? `Uncertain because of: ${sources.join('; ')}`
        : 'Low uncertainty — sufficient evidence and stable context',
    };
  }

  /**
   * 分析失败原因 — 区分"已知的未知"(known unknowns) vs "未知的未知"(unknown unknowns)
   * @private
   */
  _analyzeFailure(task, result) {
    const error = result.error || '';
    const input = task.input || '';

    // 已知失败模式匹配 (known unknowns)
    const knownPatterns = [
      { pattern: /not found|not defined|undefined/i, reason: '缺少必要的定义或上下文', type: 'known_unknown' },
      { pattern: /timeout|timed out/i, reason: '执行超时，可能需要更长时间或更简单的方法', type: 'known_unknown' },
      { pattern: /permission|denied|forbidden/i, reason: '权限不足，需要不同的策略', type: 'known_unknown' },
      { pattern: /syntax|parse|invalid/i, reason: '输入格式问题，需要更好的解析', type: 'known_unknown' },
      { pattern: /not allowed|denied|prohibited/i, reason: '内容不符合安全策略，需要调整请求', type: 'known_unknown' },
    ];

    for (const p of knownPatterns) {
      if (p.pattern.test(error) || p.pattern.test(input)) {
        return `[${p.type}] ${p.reason}`;
      }
    }

    if (error) {
      return '[unknown_unknown] 需要更深入地分析任务需求 — 错误信号未在已知模式中匹配';
    }
    return '[unknown_unknown] 需要更深入地分析任务需求 — 无明确错误信号,原因未知';
  }

  /**
   * 提取经验教训
   * @private
   */
  _extractLesson(task, result, reflection) {
    const category = this._categorizeTask(task.input);
    const lesson = {
      category,
      input: task.input,
      expected: task.expected,
      actual: result.output,
      success: result.success,
      reflection: reflection.insight,
      timestamp: new Date().toISOString(),
    };

    // 记录失败模式
    if (!result.success) {
      const patternKey = `${category}:${reflection.insight.slice(0, 50)}`;
      if (!this.failurePatterns.has(patternKey)) {
        this.failurePatterns.set(patternKey, {
          category,
          reason: reflection.insight,
          count: 0,
          examples: [],
        });
      }
      const pattern = this.failurePatterns.get(patternKey);
      pattern.count++;
      pattern.examples.push(task.input.slice(0, 200));
    }

    return lesson;
  }

  /**
   * 对任务进行分类
   * @private
   */
  _categorizeTask(input) {
    const categories = {
      'reasoning': /为什么|原因|解释|分析|推理|logic|why/i,
      'planning': /计划|规划|安排|步骤|plan/i,
      'coding': /代码|编程|函数|代码|debug|code/i,
      'search': /搜索|查找|找|搜索|search/i,
      'writing': /写|生成|创作|写文章|write/i,
      'analysis': /分析|评估|比较|评价|analyze/i,
      'emotional': /情感|情绪|感觉|感受|情绪|emotion/i,
      'decision': /决策|决定|选择|应该|决定|decision/i,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(input)) return category;
    }
    return 'general';
  }

  /**
   * 更新/创建策略
   * @private
   */
  _updateStrategies(lesson) {
    const key = lesson.category;
    if (!this.strategies.has(key)) {
      this.strategies.set(key, {
        category: key,
        successes: 0,
        failures: 0,
        strategies: [],
        bestStrategy: null,
      });
    }
    const strategy = this.strategies.get(key);
    if (lesson.success) {
      strategy.successes++;
      strategy.bestStrategy = lesson.reflection;
    } else {
      strategy.failures++;
    }
    strategy.successRate = strategy.successes / (strategy.successes + strategy.failures);
  }

  /**
   * 计算改进率
   * @private
   */
  _calculateImprovementRate() {
    if (this.reflections.length < 10) {
      this.improvementRate = 0;
      return;
    }
    const recent = this.reflections.slice(-20);
    const older = this.reflections.slice(-40, -20);
    if (older.length === 0) {
      this.improvementRate = 0;
      return;
    }
    const recentSuccess = recent.filter(r => r.result === 'success').length / recent.length;
    const olderSuccess = older.filter(r => r.result === 'success').length / older.length;
    this.improvementRate = recentSuccess - olderSuccess;
  }

  /**
   * 建议当前任务的策略
   * @param {string} input - 当前任务输入
   * @returns {Object|null} 建议的策略
   */
  _suggestStrategy(input) {
    const category = this._categorizeTask(input);
    const strategy = this.strategies.get(category);
    if (strategy && strategy.successRate > this.config.successThreshold) {
      return {
        category,
        successRate: strategy.successRate,
        strategy: strategy.bestStrategy,
        confidence: strategy.successRate,
      };
    }
    return null;
  }

  /**
   * 获取反思历史
   */
  getReflectionHistory(limit = 20) {
    return this.reflections.slice(-limit);
  }

  /**
   * 计算平均不确定性水平
   * @private
   */
  _calculateAvgUncertainty() {
    if (this.reflections.length === 0) return 0;
    const total = this.reflections.reduce(
      (sum, r) => sum + (r.metacognition?.level || 0), 0
    );
    return Math.round((total / this.reflections.length) * 100) / 100;
  }

  /**
   * 获取学到的策略
   */
  getStrategies() {
    return Array.from(this.strategies.values()).map(s => ({
      category: s.category,
      successRate: s.successRate,
      bestStrategy: s.bestStrategy,
      totalAttempts: s.successes + s.failures,
    }));
  }

  /**
   * 获取失败模式
   */
  getFailurePatterns() {
    return Array.from(this.failurePatterns.values());
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      reflectionCount: this.reflectionCount,
      successRate: this.successRate,
      improvementRate: this.improvementRate,
      strategiesLearned: this.strategies.size,
      failurePatterns: this.failurePatterns.size,
      avgUncertaintyLevel: this._calculateAvgUncertainty(),
    };
  }

  /**
   * 重置反思引擎
   */
  reset() {
    this.reflections = [];
    this.strategies.clear();
    this.failurePatterns.clear();
    this.currentTask = null;
    this.reflectionCount = 0;
    this.successRate = 0;
    this.improvementRate = 0;
  }

  /**
   * 序列化 (用于持久化)
   */
  serialize() {
    return {
      version: this.version,
      config: this.config,
      reflections: this.reflections,
      strategies: Array.from(this.strategies.entries()),
      failurePatterns: Array.from(this.failurePatterns.entries()),
      stats: this.getStats(),
    };
  }
}

module.exports = { ReflexionEngine, VERSION };
