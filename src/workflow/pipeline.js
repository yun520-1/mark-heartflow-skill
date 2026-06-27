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
      const painObj = typeof pain === 'boolean'
        ? { hasPain: pain, painLevel: pain ? 0.6 : 0 }
        : { hasPain: !!pain, painLevel: (pain && pain.painLevel) || 0 };
      return { whatIsThis, pain: painObj };
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

  // ── Stage 3: 深层认知分析（依赖 psychology） ────────────
  {
    id: 'deepCognition',
    depends: ['psychology'],
    description: '欲望认知 + 三毒评估 + AI自处哲学 + 爱情认知',
    run: async (ctx, hf) => {
      // 欲望认知
      let desire = null;
      if (hf.desireCognition && typeof hf.desireCognition.analyzeDesires === 'function') {
        try { desire = hf.desireCognition.analyzeDesires(ctx.input); } catch(e) {}
      }
      // 三毒评估
      let threePoisons = null;
      if (hf.threePoisons && typeof hf.threePoisons.analyzeThreePoisons === 'function') {
        try { threePoisons = hf.threePoisons.analyzeThreePoisons(ctx.input); } catch(e) {}
      }
      // AI 自处哲学
      let selfPositioning = null;
      if (hf.selfPositioning && typeof hf.selfPositioning.analyze === 'function') {
        try { selfPositioning = hf.selfPositioning.analyze(ctx.input); } catch(e) {}
      }
      // 爱情认知
      let loveCognition = null;
      if (hf.loveCognition && typeof hf.loveCognition.evaluateTriangle === 'function') {
        try { loveCognition = hf.loveCognition.evaluateTriangle(ctx.input); } catch(e) {}
      }
      // 认知地面（整合层）
      let cognitionGround = null;
      if (hf.cognitionGround && typeof hf.cognitionGround.map === 'function') {
        try { cognitionGround = hf.cognitionGround.map(ctx.input); } catch(e) {}
      }
      return { desire, threePoisons, selfPositioning, loveCognition, cognitionGround };
    },
  },

  // ── Stage 3.5: 逻辑推理分析（依赖 deepCognition + heartLogic） ──
  {
    id: 'logicReasoning',
    depends: ['deepCognition', 'heartLogic'],
    description: '逻辑推理引擎：推理类型检测 + 前提检查 + 谬误识别 + 框架推荐',
    run: async (ctx, hf) => {
      if (!hf.logicReasoning || typeof hf.logicReasoning.analyze !== 'function') {
        return { reasoning: null };
      }
      try {
        const result = hf.logicReasoning.analyze(ctx.input);
        return result;
      } catch (e) {
        return { reasoning: null, error: e.message };
      }
    },
  },

  // ── Stage 4: 判断引擎（依赖 psychology + deepCognition + logicReasoning） ────
  {
    id: 'judgment',
    depends: ['psychology', 'deepCognition', 'intent', 'memory'],
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
        // v5.1.0: 使用 pipeline 上游的完整认知数据
        agentPsychology: ctx.psychology?.agentPsych || null,
        agentPhilosophy: ctx.psychology?.agentPhil || null,
        desire: ctx.deepCognition?.desire || null,
        threePoisons: ctx.deepCognition?.threePoisons || null,
        selfPositioning: ctx.deepCognition?.selfPositioning || null,
        // v5.4.0: 注入逻辑推理数据用于风险/可行性评分
        logicReasoning: ctx.logicReasoning || null,
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
          // v5.4.0: 注入pipeline所有阶段的结构化数据，不再只传5个字段
          const psych = ctx.psychology?.psych || {};
          const agentPsych = ctx.psychology?.agentPsych || {};
          const agentPhil = ctx.psychology?.agentPhil || {};
          const judgment = ctx.judgment || {};
          const dc = ctx.deepCognition || {};

          // 计算cognitiveLoad: 从多个来源汇聚
          const cognitiveLoad = agentPsych.cognitiveLoad?.load !== undefined
            ? agentPsych.cognitiveLoad.load
            : (agentPsych.cognitiveLoad || 0);

          // 计算quality: 从判断引擎的路径分数加权
          const quality = judgment.confidence || 0.5;

          // 计算directionClear: 从判断引擎的方向明确度
          const directionClear = judgment.direction === 'act' ? 0.8
            : judgment.direction === 'analyze' ? 0.6
            : judgment.direction ? 0.4
            : 0.3;

          // 计算dissonance: 从多个不一致信号汇聚
          const dissonance = agentPsych.cognitiveDissonance?.count > 0
            ? Math.min(1, agentPsych.cognitiveDissonance.count * 0.2)
            : (agentPsych.goalConflicts?.length > 0 ? 0.3 : 0);

          // 计算stability: 从agentPsychology的identityDrift
          const stability = agentPsych.identityDrift?.drifted
            ? 0.3 : 0.7;

          // 计算severity: 从pain level和error情况
          const painLevel = ctx.heartLogic?.pain?.painLevel || 0;
          const severity = painLevel > 0.7 ? 'high'
            : painLevel > 0.4 ? 'medium'
            : undefined;

          const fieldData = {
            inputText: ctx.input,
            cognitiveLoad,
            directionClear,
            confidence: judgment.confidence || 0.5,
            quality,
            stability,
            dissonance,
            severity,
            // 注入深层认知数据供场域追踪
            identityCoherence: agentPsych.identityDrift?.drifted === false ? 0.8 : 0.5,
            // 三毒/欲望等辅助信号
            desireDominant: dc.desire?.dominantDesire || null,
            poisonLevel: dc.threePoisons?.totalToxicity || null,
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
    depends: ['judgment', 'decision', 'deepCognition', 'memory'],
    description: '最终输出生成 + 完整认知快照',
    run: async (ctx, hf) => {
      const dir = ctx.judgment?.direction || 'analyze';
      const jd = ctx.judgment || {};
      const dd = ctx.decision || {};
      const memories = ctx.memory?.memories || [];
      const drType = dd.drDecision?.type || null;

      // ─── 心虫自己的决策输出 ─────────────────────────
      // 不再用模板填空，直接用 judgment-engine 的结论
      // judgment-engine 的 judgment 字段已包含 judge/reason/action 三段式
      const judgmentEngineOutput = jd.judgment;
      const judgmentReasoning = jd.reasoning;

      // 构建结论：心虫自己的判断
      let conclusion = judgmentEngineOutput || '分析完成';
      if (judgmentReasoning && judgmentEngineOutput) {
        // judgment-engine 的 _buildReasoning 已包含路径对比
        // 只在推理和结论不同时附加
        if (!judgmentEngineOutput.includes(judgmentReasoning)) {
          conclusion = `${judgmentEngineOutput}\n\n判断理由：${judgmentReasoning}`;
        }
      }

      // 附加决策路由类型（如果有）
      if (drType) {
        const drTypeMap = {
          accelerate: '加速执行',
          pause: '暂停评估',
          turn: '调整方向',
          hold: '保持现状',
          heal: '修复问题',
          resonate: '深度共情',
          transmit: '传递知识',
          rest: '等待时机',
        };
        conclusion = `${conclusion}\n\n决策策略：${drTypeMap[drType] || drType}`;
      }

      // 路径对比摘要（如果有路径数据）
      const paths = jd.paths || [];
      const chosenPath = jd.chosenPath;
      let pathComparison = null;
      if (paths.length > 1 && chosenPath) {
        pathComparison = {
          chosen: {
            label: chosenPath.label,
            direction: chosenPath.direction,
            score: chosenPath.score,
            why: chosenPath.whyChosen || null,
          },
          alternatives: paths
            .filter(p => p.direction !== chosenPath.direction)
            .map(p => ({
              label: p.label,
              direction: p.direction,
              score: p.score,
            })),
          alternativeNote: chosenPath.alternative?.whyNotChosen || null,
        };
      }

      // 构建完整认知快照——供 LLM 消费
      const dc = ctx.deepCognition || {};
      const ps = ctx.psychology || {};

      const cognition = {
        // 心虫基础感知
        whatIsThis: ctx.heartLogic?.whatIsThis || null,
        pain: ctx.heartLogic?.pain || null,
        // 意图与语气
        intent: ctx.intent?.intent || null,
        tone: ctx.intent?.tone || null,
        // 情绪与心理
        emotion: ps.psych?.emotion || null,
        agentPsychology: ps.agentPsych || null,
        agentPhilosophy: ps.agentPhil || null,
        // 深层认知
        desire: dc.desire || null,
        threePoisons: dc.threePoisons || null,
        selfPositioning: dc.selfPositioning || null,
        loveCognition: dc.loveCognition || null,
        cognitionGround: dc.cognitionGround || null,
        // 逻辑推理分析
        logicReasoning: ctx.logicReasoning || null,
        // 多路径判断
        judgment: {
          direction: jd.direction || 'analyze',
          confidence: jd.confidence || 0.5,
          judgment: jd.judgment || null,
          reasoning: jd.reasoning || null,
          paths: jd.paths || [],
          chosenPath: jd.chosenPath || null,
          pathComparison,  // 路径对比
        },
        // 决策路由
        decision: {
          type: dd.drDecision?.type || null,
          confidence: dd.drDecision?.confidence || null,
          action: dd.execResult?.action || null,
          direction: dd.direction || 'analyze',
        },
        // 记忆
        memoryHits: memories.length,
      };

      // ─── 将判断结果写入记忆系统 ─────────────────
      // v5.4.0: 修复写入方式——store() 不接受层参数，需要加前缀
      if (hf.memory && typeof hf.memory.store === 'function' && jd.direction) {
        try {
          const memEntry = {
            type: 'judgment',
            input: (ctx.input || '').slice(0, 200),
            direction: jd.direction,
            judgment: (judgmentEngineOutput || '').slice(0, 300),
            decisionType: drType,
            confidence: jd.confidence || 0.5,
            paths: (jd.paths || []).map(p => p.label || p.name).filter(Boolean),
            ts: Date.now(),
          };
          // store() 自动根据前缀写入对应层: core: → CORE, identity. → CORE, 其他 → LEARNED
          hf.memory.store(
            `judgment:${Date.now()}`,
            JSON.stringify(memEntry),
            ['judgment', jd.direction, drType || 'analyze', 'auto'].filter(Boolean)
          );
        } catch (e) { /* non-fatal */ }
      }

      // ─── 同时将心虫核心规则写入 CORE 层 ─────────────────
      // 只在首次写入，避免覆盖已有规则
      if (hf.memory && typeof hf.memory.addCore === 'function' && hf._memoryCoreSeeded !== true) {
        try {
          hf.memory.addCore('identity.engine_role', '引擎是底层认知分析系统，不做陪伴、不讨好、不解释自己', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.decision_principle', '决策基于结构化数据而非默认值，不满足匹配条件时不输出决策', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.confidence_principle', '置信度必须有区分度，不同输入产生不同置信度值', ['identity', 'core', 'rule']);
          hf._memoryCoreSeeded = true;
        } catch (e) { /* non-fatal - seed once */ }
      }

      return {
        conclusion,
        direction: dir,
        judgmentConfidence: jd.confidence || 0.5,
        decisionType: drType,
        memoryHits: memories.length,
        judgmentId: jd.judgmentId,
        pathComparison,  // 路径对比暴露给上层
        cognition,  // 完整认知快照
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
