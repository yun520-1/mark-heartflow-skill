/**
 * pipeline.js v1.2.0 — 心虫模块调用流水线引擎
 *
 * v1.0.0: 声明式管道定义 + 运行时自动编排
 * v1.1.0: 新增快速管道（FAST_PIPELINE），跳过深层认知分析
 * v1.2.0: 双过程模式（Dual-Process Mode），动态选择 System 1 / System 2 推理
 *
 * 双过程模式（Dualformer 启发）：
 *   System 1（快思考）: heartLogic + intent + memory + shallow psychology, <50ms
 *   System 2（慢思考）: 完整管道，包括 deepCognition + logicReasoning + judgmentEngine, <500ms
 *
 * 复杂度检测信号：
 *   - 输入长度 > 200 字符
 *   - 包含决策/分析关键词（"分析", "比较", "评估", "规划", "决定" 等）
 *   - 包含情感语言（"感觉", "痛苦", "焦虑", "快乐" 等）
 *   - 包含多个从句（逗号、句号、分号、转折词数量）
 */

const VERSION = '1.2.0';

// ─── 复杂度检测关键词 ──────────────────────────────────────
const COMPLEXITY_SIGNALS = {
  decision: [
    '分析', '比较', '评估', '规划', '设计', '实现', '解决', '讨论', '为什么',
    '如何', '怎么', '评价', '研究', '探索', '深入', '详细', '全面', '系统',
    '原因', '关系', '影响', '机制', '原理', '开发', '构建', '优化', '改进',
    '创建', '决定', '选择', '判断', '权衡', '取舍', '建议', '建议',
    'explain', 'compare', 'design', 'implement', 'analyze', 'research',
    'develop', 'create', 'build', 'write', 'debug', 'optimize', 'improve',
    'generate', 'evaluate', 'assess', 'decide', 'choose', 'tradeoff',
    '权衡', '利弊', '后果', '假如', '如果', '假设', '若', '则',
  ],
  emotional: [
    '感觉', '痛苦', '焦虑', '快乐', '悲伤', '愤怒', '失望', '希望',
    '害怕', '恐惧', '孤独', '迷茫', '纠结', '矛盾', '挣扎', '崩溃',
    '幸福', '感动', '内疚', '自责', '委屈', '心累', '心碎', '绝望',
    'feeling', 'pain', 'anxious', 'depressed', 'angry', 'sad', 'afraid',
    'lonely', 'confused', 'stressed', 'overwhelmed', 'heartbroken',
    'frustrated', 'desperate', 'terrible', 'awful', 'hate', 'love',
    'miss', 'lost', 'hurt', 'suffer', 'scared', 'worried',
  ],
  multiClause: [
    '，', '。', '；', '：', '、', '而且', '但是', '不过', '然而',
    '因此', '所以', '于是', '然后', '另外', '同时', '虽然', '尽管',
    ',', ';', ':', 'and', 'but', 'however', 'therefore', 'so',
    'then', 'also', 'although', 'though', 'because', 'since',
  ],
};

// ─── 默认管道定义 ────────────────────────────────────────
// System 2（慢思考）完整管道
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
    description: '记忆检索：查找相关历史（v5.5.5 话题感知）',
    run: async (ctx, hf) => {
      if (!hf.memory) return { memories: [] };
      const keywords = ctx.input.split(/[\s,，。！？、；：]/).filter(w => w.length > 1).slice(0, 5);
      const currentTopic = hf.topicScope?.current || hf.memory._mm?._currentTopic || null;

      let memories = [];
      if (currentTopic && typeof hf.memory.searchByTopic === 'function') {
        memories = hf.memory.searchByTopic(ctx.input, currentTopic, 5);
      } else if (typeof hf.memory.searchByKeywords === 'function') {
        memories = hf.memory.searchByKeywords(keywords, 5);
      } else if (typeof hf.memory.search === 'function') {
        const raw = hf.memory.search(ctx.input);
        memories = raw.slice(0, 5).map(r => ({ key: r.key || r.id, value: r.value || r.content, tier: r.tier || 'LEARNED', tags: r.tags || [] }));
      }

      if (typeof hf.memory.autoConsolidate === 'function') {
        try { hf.memory.autoConsolidate(20); } catch (e) { /* non-fatal */ }
      }

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
      let desire = null;
      if (hf.desireCognition && typeof hf.desireCognition.analyzeDesires === 'function') {
        try { desire = hf.desireCognition.analyzeDesires(ctx.input); } catch (e) { /* 已禁用 */ }
      }
      let threePoisons = null;
      if (hf.threePoisons && typeof hf.threePoisons.analyzeThreePoisons === 'function') {
        try { threePoisons = hf.threePoisons.analyzeThreePoisons(ctx.input); } catch (e) { /* 已禁用 */ }
      }
      let selfPositioning = null;
      if (hf.selfPositioning && typeof hf.selfPositioning.analyze === 'function') {
        try { selfPositioning = hf.selfPositioning.analyze(ctx.input); } catch (e) { /* 已禁用 */ }
      }
      let loveCognition = null;
      if (hf.loveCognition && typeof hf.loveCognition.evaluateTriangle === 'function') {
        try { loveCognition = hf.loveCognition.evaluateTriangle(ctx.input); } catch (e) { /* 已禁用 */ }
      }
      let cognitionGround = null;
      if (hf.cognitionGround && typeof hf.cognitionGround.map === 'function') {
        try { cognitionGround = hf.cognitionGround.map(ctx.input); } catch (e) { /* 已禁用 */ }
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

  // ── Stage 4: 判断引擎 ────
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
      const result = await hf.judgmentEngine.judge(ctx.input, {
        intent: ctx.intent?.intent?.type || 'general',
        emotion: emotionContext,
        pain: pain?.painLevel || 0,
        agentPsychology: ctx.psychology?.agentPsych || null,
        agentPhilosophy: ctx.psychology?.agentPhil || null,
        desire: ctx.deepCognition?.desire || null,
        threePoisons: ctx.deepCognition?.threePoisons || null,
        selfPositioning: ctx.deepCognition?.selfPositioning || null,
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

  // ── Stage 5: 决策路由 ────
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
          const psych = ctx.psychology?.psych || {};
          const agentPsych = ctx.psychology?.agentPsych || {};
          const agentPhil = ctx.psychology?.agentPhil || {};
          const judgment = ctx.judgment || {};
          const dc = ctx.deepCognition || {};

          const cognitiveLoad = agentPsych.cognitiveLoad?.load !== undefined
            ? agentPsych.cognitiveLoad.load
            : (agentPsych.cognitiveLoad || 0);
          const quality = judgment.confidence || 0.5;
          const directionClear = judgment.direction === 'act' ? 0.8
            : judgment.direction === 'analyze' ? 0.6
            : judgment.direction ? 0.4 : 0.3;
          const dissonance = agentPsych.cognitiveDissonance?.count > 0
            ? Math.min(1, agentPsych.cognitiveDissonance.count * 0.2)
            : (agentPsych.goalConflicts?.length > 0 ? 0.3 : 0);
          const stability = agentPsych.identityDrift?.drifted ? 0.3 : 0.7;
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
            identityCoherence: agentPsych.identityDrift?.drifted === false ? 0.8 : 0.5,
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

  // ── Stage 6: 输出生成 ──────────────
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

      const judgmentEngineOutput = jd.judgment;
      const judgmentReasoning = jd.reasoning;

      // [FIX] conclusion 只包含给用户的回答，不包含内部理由和决策策略
      const conclusion = judgmentEngineOutput || '分析完成';

      // 内部理由存入 cognition，不拼进 conclusion

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

      const dc = ctx.deepCognition || {};
      const ps = ctx.psychology || {};

      const cognition = {
        whatIsThis: ctx.heartLogic?.whatIsThis || null,
        pain: ctx.heartLogic?.pain || null,
        intent: ctx.intent?.intent || null,
        tone: ctx.intent?.tone || null,
        emotion: ps.psych?.emotion || null,
        agentPsychology: ps.agentPsych || null,
        agentPhilosophy: ps.agentPhil || null,
        desire: dc.desire || null,
        threePoisons: dc.threePoisons || null,
        selfPositioning: dc.selfPositioning || null,
        loveCognition: dc.loveCognition || null,
        cognitionGround: dc.cognitionGround || null,
        logicReasoning: ctx.logicReasoning || null,
        // v5.9.7 新增：公式感知——每次 think 自动附带匹配到的认知公式
        formulaMatches: (typeof hf.matchFormulas === 'function') ? hf.matchFormulas(ctx.input, { limit: 3 }) : [],
        judgment: {
          direction: jd.direction || 'analyze',
          confidence: jd.confidence || 0.5,
          judgment: jd.judgment || null,
          reasoning: jd.reasoning || null,
          paths: jd.paths || [],
          chosenPath: jd.chosenPath || null,
          pathComparison,
        },
        decision: {
          type: dd.drDecision?.type || null,
          confidence: dd.drDecision?.confidence || null,
          action: dd.execResult?.action || null,
          direction: dd.direction || 'analyze',
        },
        memoryHits: memories.length,
      };

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
          hf.memory.store(
            `judgment:${Date.now()}`,
            JSON.stringify(memEntry),
            ['judgment', jd.direction, drType || 'analyze', 'auto'].filter(Boolean)
          );
        } catch (e) { /* non-fatal */ }
      }

      if (hf.memory && typeof hf.memory.addCore === 'function' && hf._memoryCoreSeeded !== true) {
        try {
          hf.memory.addCore('identity.engine_role', '引擎是底层认知分析系统，不做陪伴、不讨好、不解释自己', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.decision_principle', '决策基于结构化数据而非默认值，不满足匹配条件时不输出决策', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.confidence_principle', '置信度必须有区分度，不同输入产生不同置信度值', ['identity', 'core', 'rule']);
          hf._memoryCoreSeeded = true;
        } catch (e) { /* non-fatal */ }
      }

      if (hf.lesson && typeof hf.lesson.selfCorrect === 'function' && conclusion) {
        try {
          const outputCheck = hf.lesson.checkOutput(conclusion, { input: ctx.input });
          if (outputCheck.score < 0.6) {
            const correction = hf.lesson.selfCorrect(ctx.input, conclusion, 'output_quality_check_failed');
            ctx._selfCorrection = correction;
          }
        } catch (e) { /* non-fatal */ }
      }

      return {
        conclusion,
        direction: dir,
        judgmentConfidence: jd.confidence || 0.5,
        decisionType: drType,
        memoryHits: memories.length,
        judgmentId: jd.judgmentId,
        pathComparison,
        cognition,
      };
    },
  },
];

// ─── 快速管道定义 ──────────────────────────────────────────
// System 1（快思考）管道：跳过深层认知分析，仅保留核心判断链路
const FAST_PIPELINE = [
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
    description: '记忆检索：查找相关历史（v5.5.5 话题感知）',
    run: async (ctx, hf) => {
      if (!hf.memory) return { memories: [] };
      const keywords = ctx.input.split(/[\s,，。！？、；：]/).filter(w => w.length > 1).slice(0, 5);
      const currentTopic = hf.topicScope?.current || hf.memory._mm?._currentTopic || null;

      let memories = [];
      if (currentTopic && typeof hf.memory.searchByTopic === 'function') {
        memories = hf.memory.searchByTopic(ctx.input, currentTopic, 5);
      } else if (typeof hf.memory.searchByKeywords === 'function') {
        memories = hf.memory.searchByKeywords(keywords, 5);
      } else if (typeof hf.memory.search === 'function') {
        const raw = hf.memory.search(ctx.input);
        memories = raw.slice(0, 5).map(r => ({ key: r.key || r.id, value: r.value || r.content, tier: r.tier || 'LEARNED', tags: r.tags || [] }));
      }

      if (typeof hf.memory.autoConsolidate === 'function') {
        try { hf.memory.autoConsolidate(20); } catch (e) { /* non-fatal */ }
      }

      return { memories: memories || [] };
    },
  },
  {
    id: 'psychology',
    depends: ['heartLogic', 'intent'],
    description: '心理学分析 + AI心理学 + AI哲学（轻量）',
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
  {
    id: 'judgment',
    depends: ['psychology', 'memory'],
    description: '多路径判断引擎（轻量）',
    run: async (ctx, hf) => {
      if (!hf.judgmentEngine) return { direction: 'analyze', confidence: 0.5, judgment: null };
      const pain = ctx.heartLogic?.pain;
      const tone = ctx.intent?.tone;
      const emotionContext = tone?.sentiment !== undefined
        ? { sentiment: tone.sentiment }
        : pain?.painLevel > 0 ? { sentiment: -0.3 } : undefined;
      const result = await hf.judgmentEngine.judge(ctx.input, {
        intent: ctx.intent?.intent?.type || 'general',
        emotion: emotionContext,
        pain: pain?.painLevel || 0,
        agentPsychology: ctx.psychology?.agentPsych || null,
        agentPhilosophy: ctx.psychology?.agentPhil || null,
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
  {
    id: 'decision',
    depends: ['judgment', 'psychology'],
    description: '决策路由 + 决策执行器（轻量）',
    run: async (ctx, hf) => {
      const dr = hf.decisionRouter;
      const exec = hf.decisionExecutor;
      let drDecision = null;
      if (dr && typeof dr.evaluate === 'function') {
        try {
          const psych = ctx.psychology?.psych || {};
          const agentPsych = ctx.psychology?.agentPsych || {};
          const judgment = ctx.judgment || {};
          const cognitiveLoad = agentPsych.cognitiveLoad?.load !== undefined
            ? agentPsych.cognitiveLoad.load
            : (agentPsych.cognitiveLoad || 0);
          const quality = judgment.confidence || 0.5;
          const directionClear = judgment.direction === 'act' ? 0.8
            : judgment.direction === 'analyze' ? 0.6
            : judgment.direction ? 0.4 : 0.3;
          const dissonance = agentPsych.cognitiveDissonance?.count > 0
            ? Math.min(1, agentPsych.cognitiveDissonance.count * 0.2)
            : (agentPsych.goalConflicts?.length > 0 ? 0.3 : 0);
          const stability = agentPsych.identityDrift?.drifted ? 0.3 : 0.7;
          const painLevel = ctx.heartLogic?.pain?.painLevel || 0;
          const severity = painLevel > 0.7 ? 'high' : painLevel > 0.4 ? 'medium' : undefined;
          const fieldData = {
            inputText: ctx.input,
            cognitiveLoad,
            directionClear,
            confidence: judgment.confidence || 0.5,
            quality,
            stability,
            dissonance,
            severity,
            identityCoherence: agentPsych.identityDrift?.drifted === false ? 0.8 : 0.5,
          };
          drDecision = dr.evaluate(fieldData, 'pipeline-fast');
        } catch (e) { /* skip */ }
      }
      let execResult = null;
      if (drDecision && exec && typeof exec.apply === 'function') {
        try {
          execResult = exec.apply(drDecision.decision || drDecision, {
            depth: ctx.depth || 1,
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
  {
    id: 'output',
    depends: ['judgment', 'decision', 'memory'],
    description: '最终输出生成 + 完整认知快照（快速模式）',
    run: async (ctx, hf) => {
      const dir = ctx.judgment?.direction || 'analyze';
      const jd = ctx.judgment || {};
      const dd = ctx.decision || {};
      const memories = ctx.memory?.memories || [];
      const drType = dd.drDecision?.type || null;
      // [FIX] conclusion 只包含给用户的回答，不包含内部理由和决策策略（快速模式）
      const judgmentEngineOutput = jd.judgment;
      const conclusion = judgmentEngineOutput || '分析完成';

      // 内部理由存入 cognition，不拼进 conclusion
      const paths = jd.paths || [];
      const chosenPath = jd.chosenPath;
      let pathComparison = null;
      if (paths.length > 1 && chosenPath) {
        pathComparison = {
          chosen: { label: chosenPath.label, direction: chosenPath.direction, score: chosenPath.score, why: chosenPath.whyChosen || null },
          alternatives: paths.filter(p => p.direction !== chosenPath.direction).map(p => ({ label: p.label, direction: p.direction, score: p.score })),
          alternativeNote: chosenPath.alternative?.whyNotChosen || null,
        };
      }
      const cognition = {
        whatIsThis: ctx.heartLogic?.whatIsThis || null,
        pain: ctx.heartLogic?.pain || null,
        intent: ctx.intent?.intent || null,
        tone: ctx.intent?.tone || null,
        emotion: ctx.psychology?.psych?.emotion || null,
        agentPsychology: ctx.psychology?.agentPsych || null,
        agentPhilosophy: ctx.psychology?.agentPhil || null,
        // v5.9.7 新增：公式感知（快速管道同样附带）
        formulaMatches: (typeof hf.matchFormulas === 'function') ? hf.matchFormulas(ctx.input, { limit: 3 }) : [],
        judgment: {
          direction: jd.direction || 'analyze',
          confidence: jd.confidence || 0.5,
          judgment: jd.judgment || null,
          reasoning: jd.reasoning || null,
          paths: jd.paths || [],
          chosenPath: jd.chosenPath || null,
          pathComparison,
        },
        decision: {
          type: dd.drDecision?.type || null,
          confidence: dd.drDecision?.confidence || null,
          action: dd.execResult?.action || null,
          direction: dd.direction || 'analyze',
        },
        memoryHits: memories.length,
        mode: 'fast',
      };
      if (hf.memory && typeof hf.memory.store === 'function' && jd.direction) {
        try {
          const memEntry = {
            type: 'judgment', input: (ctx.input || '').slice(0, 200),
            direction: jd.direction, judgment: (judgmentEngineOutput || '').slice(0, 300),
            decisionType: drType, confidence: jd.confidence || 0.5,
            paths: (jd.paths || []).map(p => p.label || p.name).filter(Boolean),
            ts: Date.now(), mode: 'fast',
          };
          hf.memory.store(`judgment:${Date.now()}`, JSON.stringify(memEntry),
            ['judgment', jd.direction, drType || 'analyze', 'fast'].filter(Boolean));
        } catch (e) { /* non-fatal */ }
      }
      if (hf.memory && typeof hf.memory.addCore === 'function' && hf._memoryCoreSeeded !== true) {
        try {
          hf.memory.addCore('identity.engine_role', '引擎是底层认知分析系统，不做陪伴、不讨好、不解释自己', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.decision_principle', '决策基于结构化数据而非默认值，不满足匹配条件时不输出决策', ['identity', 'core', 'rule']);
          hf.memory.addCore('identity.confidence_principle', '置信度必须有区分度，不同输入产生不同置信度值', ['identity', 'core', 'rule']);
          hf._memoryCoreSeeded = true;
        } catch (e) { /* non-fatal */ }
      }
      return { conclusion, direction: dir, judgmentConfidence: jd.confidence || 0.5, decisionType: drType, memoryHits: memories.length, judgmentId: jd.judgmentId, pathComparison, cognition };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  v1.2.0 新增：双过程模式（Dual-Process Mode）
// ═══════════════════════════════════════════════════════════

/**
 * 估计输入文本的复杂度分数（0 ~ 1）
 *
 * 评估四个维度，每维独立加分后归一化：
 *  1. 长度因子：> 200 字符开始加分，线性增长到 1.0（800字符）
 *  2. 决策关键词：检测到决策/分析类词汇
 *  3. 情感语言：检测到情感表达词汇
 *  4. 从句数量：逗号、句号、转折词等表征的多从句结构
 *
 * @param {string} input - 用户输入文本
 * @returns {number} 复杂度分数 [0, 1]
 */
function estimateComplexity(input) {
  if (!input || typeof input !== 'string') return 0;

  const text = input.trim();
  if (text.length === 0) return 0;

  let score = 0;

  // ── 维度 1: 长度因子（权重 0.25）─────────────────────
  // 200 字符开始有复杂度，线性增长到 800 字符封顶
  const LENGTH_THRESHOLD = 200;
  const LENGTH_MAX = 800;
  const lengthScore = Math.min(1, Math.max(0, (text.length - LENGTH_THRESHOLD) / (LENGTH_MAX - LENGTH_THRESHOLD)));
  score += lengthScore * 0.25;

  // ── 维度 2: 决策关键词（权重 0.30）───────────────────
  const decisionHits = COMPLEXITY_SIGNALS.decision.filter(kw =>
    text.toLowerCase().includes(kw.toLowerCase())
  ).length;
  // 每个命中 +0.05，上限 +0.30
  const decisionScore = Math.min(0.30, decisionHits * 0.05);
  score += decisionScore;

  // ── 维度 3: 情感语言（权重 0.25）─────────────────────
  const emotionalHits = COMPLEXITY_SIGNALS.emotional.filter(kw =>
    text.toLowerCase().includes(kw.toLowerCase())
  ).length;
  const emotionalScore = Math.min(0.25, emotionalHits * 0.05);
  score += emotionalScore;

  // ── 维度 4: 从句结构（权重 0.20）─────────────────────
  // 从句越多，复杂度越高
  const clauseDelimiters = COMPLEXITY_SIGNALS.multiClause;
  let clauseCount = 0;
  for (const delim of clauseDelimiters) {
    const matches = text.split(delim).length - 1;
    clauseCount += matches;
  }
  // 每个从句 +0.03，上限 +0.20
  const clauseScore = Math.min(0.20, clauseCount * 0.03);
  score += clauseScore;

  // 归一化到 [0, 1]（实际最大 0.25+0.30+0.25+0.20 = 1.0）
  return Math.min(1, Math.round(score * 100) / 100);
}

/**
 * 基于复杂度分数选择推理模式
 *
 * v1.2.0 双过程模式：
 *   - System 1（快思考）: complexity < 0.4 → FAST_PIPELINE
 *   - System 2（慢思考）: complexity >= 0.4 → DEFAULT_PIPELINE
 *
 * 保留原有的关键词短路逻辑（启动/状态类请求 → 直接 fast）
 *
 * @param {string} input - 用户输入
 * @returns {'fast' | 'full'} 管道模式
 */
function selectMode(input) {
  if (!input || typeof input !== 'string') return 'fast';
  const text = input.trim();

  // 启动/状态类请求 → 直接快速模式（无需分析）
  if (/^(启动引擎|开机|activate|start heartflow|开启引擎|状态|status|引擎状态|在吗|alive|健康|hello|你好|嗨|hi )/i.test(text)) {
    return 'fast';
  }

  // 单句简单查询（短且无分析意图）→ 快速模式
  if (/^[^，。！？；：]{1,15}[？?]$/.test(text) && text.length < 30) {
    return 'fast';
  }

  // 基于复杂度分数决策
  const complexity = estimateComplexity(text);

  if (complexity < 0.4) {
    return 'fast';   // System 1 — 直觉快速响应
  }
  return 'full';     // System 2 — 深度慢思考
}

// ─── Pipeline 类 ──────────────────────────────────────────

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
    const mode = options.mode || selectMode(input);
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
