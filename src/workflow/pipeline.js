// [v6.0.71] 常量 + 纯函数已提取到 pipeline-config.js
const { VERSION, COMPLEXITY_SIGNALS, DEFAULT_PIPELINE, FAST_PIPELINE, estimateComplexity, selectMode } = require('./pipeline-config.js');

class Pipeline {

  constructor(options = {}) {

    this.version = VERSION;

    this.stages = options.stages || DEFAULT_PIPELINE;

    this.heartflow = options.heartflow || null;

    this._stats = {

      runs: 0,

      fastRuns: 0,

      fullRuns: 0,

      dualProcessRuns: 0,

      stageStats: {},

      complexityHistory: [],

    };



    // v1.2.0 双过程模式配置

    this.complexityThreshold = options.complexityThreshold || 0.4;

    this._complexityHistoryMaxSize = options.complexityHistoryMaxSize || 100;

  }



  /**

   * 估计输入复杂度（v1.2.0 新增）

   * @param {string} input - 用户输入

   * @returns {number} 复杂度分数 [0, 1]

   */

  estimateComplexity(input) {

    return estimateComplexity(input);

  }



  /**

   * 选择管道模式（v1.2.0 重写：双过程模式）

   *

   * 基于复杂度分数动态选择：

   *   - fast  → System 1（快思考）：heartLogic + intent + memory + shallow psychology

   *   - full  → System 2（慢思考）：完整管道，包括 deepCognition + logicReasoning + judgmentEngine

   *

   * @param {string} input - 用户输入

   * @returns {'fast' | 'full'} 管道模式

   */

  selectMode(input) {

    return selectMode(input);

  }



  /**

   * 运行管道（自动模式选择 + 复杂度评分输出）

   *

   * @param {string} input - 用户输入

   * @param {object} options - { depth, context, mode }

   * @returns {object} 包含 output, complexity, mode, stages, stats

   */

  async run(input, options = {}) {

    // 复杂度评分（无论选择什么模式都计算）

    const complexityScore = estimateComplexity(input);

    const complexityDetails = this._analyzeComplexityDetails(input);



    // 模式选择

    // [v5.13.0] 认知闭环：反馈状态调整复杂度阈值

    let effectiveThreshold = this.complexityThreshold;

    if (this.heartflow?._feedbackState?.complexityBias) {

      effectiveThreshold = Math.max(0.2, this.complexityThreshold - this.heartflow._feedbackState.complexityBias);

    }

    let mode = options.mode || selectMode(input);

    // 反馈驱动的模式覆写：临界/超临界状态下，即使selectMode判定fast也走deep

    if (mode === 'fast' && this.heartflow?._feedbackState?.decisionBias === 'conservative') {

      mode = 'full';

    }

    const stages = mode === 'fast' ? FAST_PIPELINE : DEFAULT_PIPELINE;

    const result = await this._runStages(input, stages, options);



    // 注入复杂度元数据

    result.complexity = {

      score: complexityScore,

      threshold: this.complexityThreshold,

      mode: mode,

      reasoning: complexityDetails.reasoning,

      signals: complexityDetails.signals,

      // v1.2.0: 双过程标签

      system: mode === 'fast' ? 'System 1 (快思考)' : 'System 2 (慢思考)',

      expectedLatency: mode === 'fast' ? '<50ms' : '<500ms',

    };



    result.mode = mode;



    // 统计

    this._stats.runs++;

    if (mode === 'fast') this._stats.fastRuns++;

    else this._stats.fullRuns++;

    this._stats.dualProcessRuns++;



    // 记录复杂度历史（用于自适应阈值调整）

    this._recordComplexity(complexityScore, mode, input.length);



    return result;

  }



  /**

   * 分析复杂度评分详情（v1.2.0 新增）

   * @param {string} input - 用户输入

   * @returns {{ reasoning: string, signals: object }}

   * @private

   */

  _analyzeComplexityDetails(input) {

    if (!input || typeof input !== 'string') {

      return { reasoning: '空输入，默认快速模式', signals: {} };

    }



    const text = input.trim();

    const signals = {};

    const reasons = [];



    // 长度信号

    if (text.length > 800) {

      signals.length = 'very_long';

      reasons.push('输入极长（>800字符）');

    } else if (text.length > 200) {

      signals.length = 'long';

      reasons.push('输入较长（>200字符）');

    } else {

      signals.length = 'short';

    }



    // 决策关键词

    const decisionHits = COMPLEXITY_SIGNALS.decision.filter(kw =>

      text.toLowerCase().includes(kw.toLowerCase())

    );

    if (decisionHits.length > 0) {

      signals.decisionKeywords = decisionHits.slice(0, 5);

      reasons.push(`检测到${decisionHits.length}个决策/分析关键词`);

    } else {

      signals.decisionKeywords = [];

    }



    // 情感语言

    const emotionalHits = COMPLEXITY_SIGNALS.emotional.filter(kw =>

      text.toLowerCase().includes(kw.toLowerCase())

    );

    if (emotionalHits.length > 0) {

      signals.emotionalLanguage = emotionalHits.slice(0, 5);

      reasons.push(`检测到${emotionalHits.length}个情感表达词`);

    } else {

      signals.emotionalLanguage = [];

    }



    // 从句结构

    let clauseCount = 0;

    for (const delim of COMPLEXITY_SIGNALS.multiClause) {

      clauseCount += (text.split(delim).length - 1);

    }

    signals.clauseCount = clauseCount;

    if (clauseCount >= 5) {

      reasons.push(`多从句结构（${clauseCount}个分隔符）`);

    }



    // 构建推理说明

    const reasoning = reasons.length > 0

      ? reasons.join('；')

      : '输入简洁，无需深度分析';



    return { reasoning, signals };

  }



  /**

   * 记录复杂度历史（v1.2.0 新增）

   * @param {number} score - 复杂度分数

   * @param {string} mode - 选择的模式

   * @param {number} inputLength - 输入长度

   * @private

   */

  _recordComplexity(score, mode, inputLength) {

    this._stats.complexityHistory.push({

      score,

      mode,

      inputLength,

      timestamp: Date.now(),

    });

    // 限制历史记录大小

    if (this._stats.complexityHistory.length > this._complexityHistoryMaxSize) {

      this._stats.complexityHistory = this._stats.complexityHistory.slice(-this._complexityHistoryMaxSize);

    }

  }



  /**

   * 运行完整管道（System 2 慢思考，显式模式）

   */

  async runFull(input, options = {}) {

    const result = await this._runStages(input, DEFAULT_PIPELINE, options);

    result.mode = 'full';

    result.complexity = {

      score: estimateComplexity(input),

      threshold: this.complexityThreshold,

      mode: 'full',

      system: 'System 2 (慢思考)',

      expectedLatency: '<500ms',

    };

    this._stats.runs++;

    this._stats.fullRuns++;

    this._stats.dualProcessRuns++;

    this._recordComplexity(estimateComplexity(input), 'full', input?.length || 0);

    return result;

  }



  /**

   * 运行快速管道（System 1 快思考，显式模式）

   */

  async runFast(input, options = {}) {

    const result = await this._runStages(input, FAST_PIPELINE, options);

    result.mode = 'fast';

    result.complexity = {

      score: estimateComplexity(input),

      threshold: this.complexityThreshold,

      mode: 'fast',

      system: 'System 1 (快思考)',

      expectedLatency: '<50ms',

    };

    this._stats.runs++;

    this._stats.fastRuns++;

    this._stats.dualProcessRuns++;

    this._recordComplexity(estimateComplexity(input), 'fast', input?.length || 0);

    return result;

  }



  /**

   * 内部方法：执行指定管道定义

   */

  async _runStages(input, stages, options = {}) {

    const ctx = {

      input,

      depth: options.depth || 2,

      _startTime: Date.now(),

    };



    const results = {};

    const stageTimings = {};

    let output = null;



    const executed = new Set();

    const stagesToRun = [...stages];



    while (stagesToRun.length > 0) {

      const batch = [];

      const remaining = [];



      for (const stage of stagesToRun) {

        const depsMet = stage.depends.every(d => executed.has(d));

        if (depsMet) {

          batch.push(stage);

        } else {

          remaining.push(stage);

        }

      }



      if (batch.length === 0 && remaining.length > 0) {

        const unmetDeps = remaining.map(s => `${s.id}(${s.depends.filter(d => !executed.has(d)).join(',')})`);

        throw new Error(`Pipeline deadlock: stages ${unmetDeps.join(', ')} have unmet dependencies`);

      }



      const batchResults = await Promise.all(batch.map(async (stage) => {

        const start = Date.now();

        try {

          const result = await stage.run(ctx, this.heartflow);

          results[stage.id] = result;

          ctx[stage.id] = result;

          executed.add(stage.id);

          stageTimings[stage.id] = Date.now() - start;

          this._recordStage(stage.id, true, Date.now() - start);

          return { id: stage.id, success: true, timing: Date.now() - start };

        } catch (e) {

          results[stage.id] = { error: e.message };

          executed.add(stage.id);

          stageTimings[stage.id] = Date.now() - start;

          this._recordStage(stage.id, false, Date.now() - start);

          return { id: stage.id, success: false, error: e.message, timing: Date.now() - start };

        }

      }));



      const outputStage = batch.find(s => s.id === 'output');

      if (outputStage) {

        output = results['output'];

      }



      stagesToRun.length = 0;

      stagesToRun.push(...remaining);

    }



    this._stats.runs++;



    return {

      stages: Object.entries(results).map(([id, result]) => ({

        id,

        success: !result.error,

        timing: stageTimings[id] || 0,

        outputKeys: Object.keys(result).filter(k => k !== 'error'),

        error: result.error || null,

      })),

      output,

      ctx,

      stats: {

        totalTime: Date.now() - ctx._startTime,

        stagesRun: executed.size,

        stagesSuccess: Object.values(results).filter(r => !r.error).length,

        stagesFailed: Object.values(results).filter(r => r.error).length,

        stageTimings,

      },

    };

  }



  /**

   * 获取管道统计（v1.2.0 包含双过程模式统计）

   */

  getStats() {

    const recent = this._stats.complexityHistory;

    const avgComplexity = recent.length > 0

      ? Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length * 100) / 100

      : 0;



    const fastModeSamples = recent.filter(r => r.mode === 'fast');

    const fullModeSamples = recent.filter(r => r.mode === 'full');

    const avgInputLengthFast = fastModeSamples.length > 0

      ? Math.round(fastModeSamples.reduce((s, r) => s + r.inputLength, 0) / fastModeSamples.length)

      : 0;

    const avgInputLengthFull = fullModeSamples.length > 0

      ? Math.round(fullModeSamples.reduce((s, r) => s + r.inputLength, 0) / fullModeSamples.length)

      : 0;



    return {

      version: this.version,

      totalRuns: this._stats.runs,

      fastRuns: this._stats.fastRuns,

      fullRuns: this._stats.fullRuns,

      modeSplit: this._stats.runs > 0

        ? `${Math.round(this._stats.fastRuns / this._stats.runs * 100)}% fast / ${Math.round(this._stats.fullRuns / this._stats.runs * 100)}% full`

        : 'N/A',

      dualProcess: {

        complexityThreshold: this.complexityThreshold,

        avgComplexityScore: avgComplexity,

        avgInputLengthFast,

        avgInputLengthFull,

        complexityHistorySize: recent.length,

      },

      stages: this.stages.map(s => ({

        id: s.id,

        depends: s.depends,

        description: s.description,

        stats: this._stats.stageStats[s.id] || { calls: 0, successes: 0, failures: 0, avgTime: 0 },

      })),

    };

  }



  /**

   * 获取复杂度历史记录（v1.2.0 新增）

   * @returns {Array} 最近 N 条复杂度评估记录

   */

  getComplexityHistory() {

    return [...this._stats.complexityHistory];

  }



  _recordStage(stageId, success, timing) {

    if (!this._stats.stageStats[stageId]) {

      this._stats.stageStats[stageId] = { calls: 0, successes: 0, failures: 0, totalTime: 0, avgTime: 0 };

    }

    const s = this._stats.stageStats[stageId];

    s.calls++;

    if (success) s.successes++; else s.failures++;

    s.totalTime += timing;

    s.avgTime = Math.round(s.totalTime / s.calls);

  }

}



// ─── 导出 ──────────────────────────────────────────────────



module.exports = {

  Pipeline,

  VERSION,

  DEFAULT_PIPELINE,

  FAST_PIPELINE,

  // v1.2.0 导出工具函数，供外部直接使用

  selectMode,

  estimateComplexity,

};
