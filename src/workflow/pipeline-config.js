// [v6.0.71] 从 pipeline.js 提取常量 + 纯函数（零副作用）
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



  // ── Stage 2.5: 情绪动力学（依赖 psychology + heartLogic） ────

  {

    id: 'emotionDynamics',

    depends: ['psychology', 'heartLogic'],

    description: '情绪动力学引擎：PAD状态 + 耶克斯-多德森唤醒-绩效分析',

    run: async (ctx, hf) => {

      try {

        let healthCheck = null;

        let yerkesDodson = null;

        if (hf.emotionDynamics) {

          healthCheck = hf.emotionDynamics.healthCheck();

          const psych = ctx.psychology?.psych || {};

          const arousal = psych.emotion?.arousal ?? healthCheck?.currentPAD?.arousal ?? 0.5;

          // 根据输入复杂度确定任务复杂度级别

          const taskComplexity = ctx.input && ctx.input.length > 200 ? 'complex' :

                                 ctx.input && ctx.input.length > 50 ? 'moderate' : 'simple';

          try {

            yerkesDodson = hf.emotionDynamics.yerkesDodsonAnalysis(taskComplexity);

          } catch (e) { /* non-fatal */ }

        }

        return { healthCheck, yerkesDodson };

      } catch (e) {

        return { healthCheck: null, yerkesDodson: null, error: e.message };

      }

    },

  },



  // ── Stage 2.6: 认知负载 V2（依赖 memory） ────

  {

    id: 'cognitiveLoad',

    depends: ['memory'],

    description: '认知负载引擎V2：负载评估 + 临界性检测 + 心流状态',

    run: async (ctx, hf) => {

      try {

        let loadEstimate = null;

        let trend = null;

        if (hf.cognitiveLoadV2) {

          loadEstimate = hf.cognitiveLoadV2.estimate(ctx.input);

          trend = hf.cognitiveLoadV2.analyzeTrend();

        }

        return { loadEstimate, trend };

      } catch (e) {

        return { loadEstimate: null, trend: null, error: e.message };

      }

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



  // ── Stage 3.8: 认知充实（依赖 deepCognition + logicReasoning） ──

  // v5.16.0: 提取到 src/workflow/cognitive-enrichment.js

  {

    id: 'cognitiveEnrichment',

    depends: ['deepCognition', 'logicReasoning'],

    description: '20个认知模块状态快照（场追踪/负载/元认知/漂移/聚类/世界模型/自愈/现象学/GWS/漫游/校准/欲望/三毒/推理/反馈/验证/爱情/地面/辩论/梦境）',

    run: require('./cognitive-enrichment.js').cognitiveEnrichmentRun,

  },



  // ── Stage 4: 判断引擎 ────

  {

    id: 'judgment',

    depends: ['psychology', 'deepCognition', 'intent', 'memory', 'cognitiveEnrichment'],

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

    depends: ['judgment', 'decision', 'deepCognition', 'memory', 'cognitiveEnrichment'],

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

        // v5.11.0 新增：情绪动力学 + 认知负载 V2

        emotionDynamics: ctx.emotionDynamics || null,

        cognitiveLoad: ctx.cognitiveLoad || null,

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

        // v5.12.0: 认知充实信号

        enrichment: ctx.cognitiveEnrichment || null,

        // v5.14.2: 认知充实 — 新增10个模块

        confidenceCalibrator: ctx.cognitiveEnrichment?.confidenceCalibrator || null,

        desireCognitionHealth: ctx.cognitiveEnrichment?.desireCognitionHealth || null,

        threePoisonsHealth: ctx.cognitiveEnrichment?.threePoisonsHealth || null,

        logicReasoningMetrics: ctx.cognitiveEnrichment?.logicReasoningMetrics || null,

        decisionFeedback: ctx.cognitiveEnrichment?.decisionFeedback || null,

        decisionVerifier: ctx.cognitiveEnrichment?.decisionVerifier || null,

        loveCognition: ctx.cognitiveEnrichment?.loveCognition || null,

        cognitionGround: ctx.cognitiveEnrichment?.cognitionGround || null,

        debateConductor: ctx.cognitiveEnrichment?.debateConductor || null,

        dreamEngineV2: ctx.cognitiveEnrichment?.dreamEngineV2 || null,

        // [P2-T2-WF] 认知充实 + 反馈状态融合：把 cognitiveEnrichment 的模块健康度汇总到 cognition

        enrichmentSummary: (() => {

          try {

            const enr = ctx.cognitiveEnrichment;

            if (!enr || typeof enr !== 'object') return null;

            const modules = Object.entries(enr)

              .filter(([, v]) => v && typeof v === 'object' && !v.error)

              .map(([k, v]) => ({ module: k, health: v.health || v.status || 'ok' }));

            const unhealthy = modules.filter(m => m.health && m.health !== 'ok');

            return {

              total: modules.length,

              healthy: modules.length - unhealthy.length,

              unhealthyCount: unhealthy.length,

              unhealthyModules: unhealthy.map(m => m.module),

              degraded: unhealthy.length > 0,

            };

          } catch (e) {

            return null;

          }

        })(),

        // [P2-T2-WF] feedbackState 融合：将引擎闭环反馈状态暴露到 cognition

        feedbackState: (() => {

          try {

            const fb = hf?._feedbackState;

            if (!fb || typeof fb !== 'object') return null;

            return {

              complexityBias: fb.complexityBias || 0,

              confidenceModifier: fb.confidenceModifier || 0,

              decisionBias: fb.decisionBias || 'neutral',

            };

          } catch (e) {

            return null;

          }

        })(),

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

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      if (hf.memory && typeof hf.memory.addCore === 'function' && hf._memoryCoreSeeded !== true) {

        try {

          hf.memory.addCore('identity.engine_role', '引擎是底层认知分析系统，不做陪伴、不讨好、不解释自己', ['identity', 'core', 'rule']);

          hf.memory.addCore('identity.decision_principle', '决策基于结构化数据而非默认值，不满足匹配条件时不输出决策', ['identity', 'core', 'rule']);

          hf.memory.addCore('identity.confidence_principle', '置信度必须有区分度，不同输入产生不同置信度值', ['identity', 'core', 'rule']);

          hf._memoryCoreSeeded = true;

        } catch (e) { /* non-fatal */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      if (hf.lesson && typeof hf.lesson.selfCorrect === 'function' && conclusion) {

        try {

          const outputCheck = hf.lesson.checkOutput(conclusion, { input: ctx.input });

          if (outputCheck.score < 0.6) {

            const correction = hf.lesson.selfCorrect(ctx.input, conclusion, 'output_quality_check_failed');

            ctx._selfCorrection = correction;

          }

        } catch (e) { /* non-fatal */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

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

        // v5.11.0 新增：情绪动力学 + 认知负载 V2（快速管道通过主引擎 pre-think 快照获取）

        emotionDynamics: ctx.emotionDynamics || null,

        cognitiveLoad: ctx.cognitiveLoad || null,

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

        // v5.14.2: 认知充实 — 新增10个模块（快速模式 ctx.cognitiveEnrichment 未定义时为 null）

        confidenceCalibrator: ctx.cognitiveEnrichment?.confidenceCalibrator || null,

        desireCognitionHealth: ctx.cognitiveEnrichment?.desireCognitionHealth || null,

        threePoisonsHealth: ctx.cognitiveEnrichment?.threePoisonsHealth || null,

        logicReasoningMetrics: ctx.cognitiveEnrichment?.logicReasoningMetrics || null,

        decisionFeedback: ctx.cognitiveEnrichment?.decisionFeedback || null,

        decisionVerifier: ctx.cognitiveEnrichment?.decisionVerifier || null,

        loveCognition: ctx.cognitiveEnrichment?.loveCognition || null,

        cognitionGround: ctx.cognitiveEnrichment?.cognitionGround || null,

        debateConductor: ctx.cognitiveEnrichment?.debateConductor || null,

        dreamEngineV2: ctx.cognitiveEnrichment?.dreamEngineV2 || null,

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

  // v5.12.0: 阈值从200→80，中文100字已属中长输入，应有机会触发深层分析

  const LENGTH_THRESHOLD = 80;

  const LENGTH_MAX = 500;

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




module.exports = {
  VERSION,
  COMPLEXITY_SIGNALS,
  DEFAULT_PIPELINE,
  FAST_PIPELINE,
  estimateComplexity,
  selectMode,
};
