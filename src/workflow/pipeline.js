/**
 * pipeline.js v1.0.0 — 心虫模块调用流水线引擎
 *
 * 问题：60个模块各自为政，think()只调了9个，ThoughtChain只调了3个dispatch。
 * 模块之间有依赖关系（judgmentEngine需要psychology的输出，decisionRouter需要judgmentEngine的输出），
 * 但没人负责"把A的输出传给B"。
 *
 * 解决方案：声明式管道定义 + 运行时自动编排。
 * 每步声明"需要什么输入"、"调用哪个模块"、"输出什么字段"。
 * 管道引擎自动处理数据传递、错误隔离、可选模块降级。
 *
 * 核心设计：
 *   1. 管道定义（声明式）：每个阶段指定 source module + method + input mapping + output mapping
 *   2. 自动数据流：前一步的输出自动注入到后一步的输入
 *   3. 并行阶段：无依赖的阶段同时执行
 *   4. 错误隔离：某个模块崩溃不影响其他模块
 *   5. 调用统计：记录每个模块被调用的次数、耗时、成功率
 */

const VERSION = '1.0.0';

// ─── 默认管道定义 ────────────────────────────────────────
// 每个阶段：{ id, depends, run, input, output }
// - id: 唯一阶段名
// - depends: 依赖哪些阶段完成（空数组=无依赖，可并行）
// - run: (ctx, hf) => 执行逻辑，返回结果
// - input: 从ctx中提取哪些字段传给run
// - output: 将结果写入ctx的哪个字段
const DEFAULT_PIPELINE = [
  // ── Stage 1: 认知分析（无依赖，可并行） ──────────────
  {
    id: 'heartLogic',
    depends: [],
    description: '心虫核心判断引擎：whatIsThis + detectPain',
    run: async (ctx, hf) => {
      if (!hf.heartLogic) return { whatIsThis: { type: 'general' }, pain: { hasPain: false, painLevel: 0 } };
      const whatIsThis = hf.heartLogic.whatIsThis(ctx.input, {});
      const pain = hf.heartLogic.detectPain(ctx.input);
      return { whatIsThis, pain };
    },
  },
  {
    id: 'intent',
    depends: [],
    description: '意图分类 + 语气分析',
    run: async (ctx, hf) => {
      const intent = hf.translator?.intentClassifier
        ? hf.translator.intentClassifier(ctx.input, {})
        : { type: 'general', confidence: 0.5 };
      const tone = hf.translator?.toneAnalyzer
        ? hf.translator.toneAnalyzer(ctx.input, {})
        : { tone: 'neutral', sentiment: 0 };
      return { intent, tone };
    },
  },
  {
    id: 'memory',
    depends: [],
    description: '记忆检索：查找相关历史',
    run: async (ctx, hf) => {
      if (!hf.memory || typeof hf.memory.searchByKeywords !== 'function') return { memories: [] };
      const keywords = ctx.input.split(/[\s,，。！？、；：]/).filter(w => w.length > 1).slice(0, 5);
      const memories = hf.memory.searchByKeywords(keywords, 5);
      return { memories: memories || [] };
    },
  },

  // ── Stage 2: 心理分析（依赖 intent + heartLogic） ────
  {
    id: 'psychology',
    depends: ['heartLogic', 'intent'],
    description: '心理学分析 + AI心理学 + AI哲学',
    run: async (ctx, hf) => {
      const psych = hf.psychology?.analyzePsychology
        ? hf.psychology.analyzePsychology(ctx.input)
        : { emotion: { pleasure: 0, arousal: 0, dominance: 0 }, intention: { category: 'unknown' } };
      const agentPsych = hf.agentPsychology?.fullAssessment
        ? hf.agentPsychology.fullAssessment()
        : { cognitiveLoad: 0, goalConflicts: [] };
      const agentPhil = hf.agentPhilosophy?.fullAssessment
        ? hf.agentPhilosophy.fullAssessment()
        : { existence: 'active', entropyDirection: 'neutral' };
      return { psych, agentPsych, agentPhil };
    },
  },

  // ── Stage 3: 判断引擎（依赖 psychology + intent） ────
  {
    id: 'judgment',
    depends: ['psychology', 'intent', 'memory'],
    description: '多路径判断引擎',
    run: async (ctx, hf) => {
      if (!hf.judgmentEngine) return { direction: 'analyze', confidence: 0.5, judgment: null };
      const pain = ctx.heartLogic?.pain;
      const tone = ctx.intent?.tone;
      const emotionContext = tone?.sentiment !== undefined
        ? { sentiment: tone.sentiment }
        : pain?.painLevel > 0 ? { sentiment: -0.3 } : undefined;
      const result = hf.judgmentEngine.judge(ctx.input, {
        intent: ctx.intent?.intent?.type || 'general',
        emotion: emotionContext,
        pain: pain?.painLevel || 0,
      });
      return {
        direction: result.direction || 'analyze',
        confidence: result.confidence || 0.5,
        judgment: result.judgment,
        reasoning: result.reasoning,
        judgmentId: result.id,
        paths: result.paths,
        chosenPath: result.chosenPath,
      };
    },
  },

  // ── Stage 4: 决策路由（依赖 judgment + psychology） ──
  {
    id: 'decision',
    depends: ['judgment', 'psychology'],
    description: '决策路由 + 决策执行器',
    run: async (ctx, hf) => {
      const dr = hf.decisionRouter;
      const exec = hf.decisionExecutor;
      let drDecision = null;
      if (dr && typeof dr.evaluate === 'function') {
        try {
          const fieldData = {
            inputText: ctx.input,
            cognitiveLoad: ctx.psychology?.agentPsych?.cognitiveLoad || 0,
            directionClear: ctx.judgment?.direction === 'act' ? 0.8 : 0.3,
            confidence: ctx.judgment?.confidence || 0.5,
            dissonance: ctx.psychology?.agentPsych?.goalConflicts?.length > 0 ? 0.3 : undefined,
          };
          drDecision = dr.evaluate(fieldData, 'pipeline');
        } catch (e) { /* skip */ }
      }
      let execResult = null;
      if (drDecision && exec && typeof exec.apply === 'function') {
        try {
          execResult = exec.apply(drDecision.decision || drDecision, {
            depth: ctx.depth || 2,
            input: ctx.input,
          });
        } catch (e) { /* skip */ }
      }
      return {
        drDecision: drDecision?.decision || drDecision || null,
        execResult,
        direction: ctx.judgment?.direction || 'analyze',
      };
    },
  },

  // ── Stage 5: 输出生成（依赖所有上游） ──────────────
  {
    id: 'output',
    depends: ['judgment', 'decision', 'memory'],
    description: '最终输出生成',
    run: async (ctx, hf) => {
      const dir = ctx.judgment?.direction || 'analyze';
      const judgmentText = ctx.judgment?.judgment || '分析中';
      const reasoning = ctx.judgment?.reasoning || '';
      const drType = ctx.decision?.drDecision?.type || null;
      const memories = ctx.memory?.memories || [];

      // 三段式输出：判断/理由/行动
      const parts = [judgmentText];
      if (reasoning) parts.push(reasoning);

      // 根据方向附加行动建议
      const actionMap = {
        analyze: '建议先收集更多信息再做判断',
        act: '判断明确，按此方向执行',
        empathize: '情绪优先，等情绪稳定后再做判断',
        reflect: '这个问题需要你自己想清楚',
      };
      parts.push(actionMap[dir] || '按判断方向行动');

      return {
        conclusion: parts.join('。'),
        direction: dir,
        judgmentConfidence: ctx.judgment?.confidence || 0.5,
        decisionType: drType,
        memoryHits: memories.length,
        judgmentId: ctx.judgment?.judgmentId,
      };
    },
  },
];

class Pipeline {
  constructor(options = {}) {
    this.version = VERSION;
    this.stages = options.stages || DEFAULT_PIPELINE;
    this.heartflow = options.heartflow || null;
    this._stats = { runs: 0, stageStats: {} };
  }

  /**
   * 运行完整管道
   * @param {string} input - 用户输入
   * @param {object} options - { depth, context }
   * @returns {object} { stages: [...], output: {...}, stats: {...} }
   */
  async run(input, options = {}) {
    const ctx = {
      input,
      depth: options.depth || 2,
      _startTime: Date.now(),
    };

    // 执行结果
    const results = {};
    const stageTimings = {};
    let output = null;

    // 按依赖拓扑执行
    const executed = new Set();
    const stagesToRun = [...this.stages];

    while (stagesToRun.length > 0) {
      const batch = [];
      const remaining = [];

      for (const stage of stagesToRun) {
        // 检查依赖是否全部执行完成
        const depsMet = stage.depends.every(d => executed.has(d));
        if (depsMet) {
          batch.push(stage);
        } else {
          remaining.push(stage);
        }
      }

      if (batch.length === 0 && remaining.length > 0) {
        // 死锁检测
        const unmetDeps = remaining.map(s => `${s.id}(${s.depends.filter(d => !executed.has(d)).join(',')})`);
        throw new Error(`Pipeline deadlock: stages ${unmetDeps.join(', ')} have unmet dependencies`);
      }

      // 执行当前批次（并行执行无依赖的阶段）
      const batchResults = await Promise.all(batch.map(async (stage) => {
        const start = Date.now();
        try {
          const result = await stage.run(ctx, this.heartflow);
          results[stage.id] = result;
          ctx[stage.id] = result;  // 写回 ctx，供后续阶段和调用者使用
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

      // 如果是 output 阶段，提取输出
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
      ctx,  // 返回上下文，包含各阶段原始数据
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
   * 获取管道统计
   */
  getStats() {
    return {
      version: this.version,
      totalRuns: this._stats.runs,
      stages: this.stages.map(s => ({
        id: s.id,
        depends: s.depends,
        description: s.description,
        stats: this._stats.stageStats[s.id] || { calls: 0, successes: 0, failures: 0, avgTime: 0 },
      })),
    };
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

module.exports = { Pipeline, VERSION, DEFAULT_PIPELINE };
