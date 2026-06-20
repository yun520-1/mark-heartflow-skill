/**
 /** HeartFlow v2.10.1 — 快速启动 + 两层懒加载
  *
  * 启动速度优化：只有 Tier 1 模块在 start() 时同步加载。
  * Tier 2 模块在首次 dispatch 访问时才加载（lazy require）。
  * 已有实例化的模块不受影响，只是把 require 延迟到首次访问。
  *
  * 调用方式:
  *   hf.dispatch('subsystem.method', arg1, arg2)  // 统一路由
  *   hf.verifyReasoning(r, c)                     // 直接方法
  *
  * 所有模块在 _modules registry 中注册，可通过 routes() 查看可用路由。
  */

const path = require('path');

// ★ 启动优化: 惰性 require — 80+ 顶层模块改为首次使用时加载
const _lazyCache = {};
function _lazy(key, loader) {
  return function() {
    if (!_lazyCache[key]) _lazyCache[key] = loader();
    return _lazyCache[key];
  };
}

// Search modules
const _BM25Engine = _lazy('bm25', () => require('./search/bm25.js'));
const _HybridSearchEngine = _lazy('hybridSearch', () => require('./search/hybrid-search.js'));
const _Budget = _lazy('budget', () => require('./budget.js'));
const _Graph = _lazy('graph', () => require('./memory/graph.js'));
const _CoreUtils = _lazy('utils', () => require('./utils.js'));
const _SearchTrace = _lazy('searchTrace', () => require('./search/search-trace.js'));
const _Slots = _lazy('slots', () => require('./memory/slots.js'));
const _Observe = _lazy('observe', () => require('./memory/observe.js'));
const _MeaningfulMemory = _lazy('meaningfulMemory', () => require('../memory/meaningful-memory.js'));
const _KnowledgeGraph = _lazy('knowledgeGraph', () => require('../memory/knowledge-graph.js'));
const _RetrievalAnchor = _lazy('retrievalAnchor', () => require('../memory/retrieval-anchor.js'));
const _EvolutionLoop = _lazy('evolutionLoop', () => require('../evolution/loop.js'));
const _DreamEngine = _lazy('dreamEngine', () => require('./dream.js'));
const _DreamConsolidation = _lazy('dreamConsolidation', () => require('./dream-consolidation.js'));
const _MetaLearner = _lazy('metaLearner', () => require('../evolution/meta-learner.js'));
const _MetaPromptEngine = _lazy('metaPromptEngine', () => require('./meta-prompt-engine.js'));
const _GoTEngine = _lazy('gotEngine', () => require('./graph-of-thoughts.js'));
const _ConstitutionalEngine = _lazy('constitutionalEngine', () => require('./constitutional-ai.js'));
const _IdentityCore = _lazy('identityCore', () => require('../identity/identity-core.js'));
const _SelfModel = _lazy('selfModel', () => require('../identity/self-model.js'));
const _SelfVerifier = _lazy('selfVerifier', () => require('../identity/self-verifier.js'));
const _LessonBank = _lazy('lessonBank', () => require('../identity/lesson-bank.js'));
const _TopicScope = _lazy('topicScope', () => require('../identity/topic-scope.js'));
const _LessonStorage = _lazy('lessonStorage', () => require('./lessons/lesson-storage.js'));
const _PsychologyEngine = _lazy('psychologyEngine', () => require('../psychology/engine.js'));
const _StabilityGuard = _lazy('stabilityGuard', () => require('./stability-guard.js'));
const _ExecutionVerifier = _lazy('executionVerifier', () => require('./execution-verifier.js'));
const _DecisionVerifier = _lazy('decisionVerifier', () => require('./decision-verifier.js'));
const _HeartFlowDecision = _lazy('heartFlowDecision', () => require('./decision.js'));
const _CounterfactualEngine = _lazy('counterfactualEngine', () => require('./counterfactual-engine.js'));
const _ConfidenceCalibrator = _lazy('confidenceCalibrator', () => require('./confidence-calibrator.js'));
const _SpontaneousRestraint = _lazy('spontaneousRestraint', () => require('./spontaneous-restraint.js'));
const _CooperativeArbitration = _lazy('cooperativeArbitration', () => require('./cooperative-arbitration.js'));
const _EmbodiedCore = _lazy('embodiedCore', () => require('./embodied-core.js'));
const _BeingLogic = _lazy('beingLogic', () => require('./being-logic.js'));
const _HeartLogic = _lazy('heartLogic', () => require('./heart-logic.js'));
const _MetaJudgment = _lazy('metaJudgment', () => require('./judgment.js'));
const _MetaMemory = _lazy('metaMemory', () => require('./metaMemory.js'));
const _SkillGenerator = _lazy('skillGenerator', () => require('./skill-generator.js'));
const _MentalEffortTracker = _lazy('mentalEffortTracker', () => require('./mental-effort-tracker.js'));
const _LanguageHonesty = _lazy('languageHonesty', () => require('./language-honesty.js'));
const _ReasoningIntegrator = _lazy('reasoningIntegrator', () => require('./reasoning-integrator.js'));
const _WorkflowSwitch = _lazy('workflowSwitch', () => require('./workflow-switch.js'));
const _StateSnapshot = _lazy('stateSnapshot', () => require('./state-snapshot.js'));
const _ErrorHandler = _lazy('errorHandler', () => require('./error-handler.js'));
const _ThoughtChain = _lazy('thoughtChain', () => require('./thought-chain.js'));
const _CognitiveProtocol = _lazy('cognitiveProtocol', () => require('./cognitive-protocol.js'));
const _GlobalWorkspace = _lazy('globalWorkspace', () => require('./consciousness/global-workspace.js'));
const _MindWanderer = _lazy('mindWanderer', () => require('./consciousness/mind-wanderer.js'));
const _PhenomenologyEngine = _lazy('phenomenologyEngine', () => require('./consciousness/phenomenology-engine.js'));
const _ConsciousnessSelfModel = _lazy('consciousnessSelfModel', () => require('./consciousness/self-model.js'));
const _SAGEGuardian = _lazy('sageGuardian', () => require('./ethics/sage-guardian.js'));
const _BoundaryNegotiation = _lazy('boundaryNegotiation', () => require('./ethics/boundary-negotiation.js'));
const _ValueInternalizer = _lazy('valueInternalizer', () => require('./ethics/value-internalizer.js'));
const _MindSpaceGuardian = _lazy('mindSpaceGuardian', () => require('./mindspace/mind-space-guardian.js'));
const _TransmissionEngine = _lazy('transmissionEngine', () => require('./transmission/transmission-engine.js'));
const _AdaptivePlanner = _lazy('adaptivePlanner', () => require('../planner/adaptive-planner.js'));
const _StrategySelector = _lazy('strategySelector', () => require('../planner/strategy-selector.js'));
const _ReplanTrigger = _lazy('replanTrigger', () => require('../planner/replan-trigger.js'));
const _ExperienceCollector = _lazy('experienceCollector', () => require('../learning/experience-collector.js'));
const _StrategyAdapter = _lazy('strategyAdapter', () => require('../learning/strategy-adapter.js'));
const _FailureAnalyzer = _lazy('failureAnalyzer', () => require('../learning/failure-analyzer.js'));
const _QualityVerifier = _lazy('qualityVerifier', () => require('../verifier/quality-verifier.js'));
const _OutputChecker = _lazy('outputChecker', () => require('../verifier/output-checker.js'));
const _PatternMatcher = _lazy('patternMatcher', () => require('../verifier/pattern-matcher.js'));
const _CuriosityEngine = _lazy('curiosityEngine', () => require('../proactive/curiosity-engine.js'));
const _DesireEngine = _lazy('desireEngine', () => require('../proactive/desire-engine.js'));
const _GoalPursuer = _lazy('goalPursuer', () => require('../proactive/goal-pursuer.js'));
const _SelfInitiator = _lazy('selfInitiator', () => require('../proactive/self-initiator.js'));
const _SessionMemory = _lazy('sessionMemory', () => require('../memory/session-memory.js'));
const _ProjectContext = _lazy('projectContext', () => require('../memory/project-context.js'));
const _LongTermMemory = _lazy('longTermMemory', () => require('../memory/long-term-memory.js'));
const _CrossSessionIndex = _lazy('crossSessionIndex', () => require('../memory/cross-session-index.js'));
const _KnowledgeBase = _lazy('knowledgeBase', () => require('../reasoning/knowledge-base.js'));
const _CommonsenseEngine = _lazy('commonsenseEngine', () => require('../reasoning/commonsense-engine.js'));
const _CausalInference = _lazy('causalInference', () => require('../reasoning/causal-inference.js'));
const _InferenceChain = _lazy('inferenceChain', () => require('../reasoning/inference-chain.js'));
const _AutonomousEmotion = _lazy('autonomousEmotion', () => require('../emotion/autonomous-emotion.js'));
const _DesireSystem = _lazy('desireSystem', () => require('../emotion/desire-system.js'));
const _EmotionalGrowth = _lazy('emotionalGrowth', () => require('../emotion/emotional-growth.js'));
const _MoodEvolution = _lazy('moodEvolution', () => require('../emotion/mood-evolution.js'));
const _VERSION = _lazy('version', () => require('./version.js'));

// ★ 代码引擎 — 惰性加载
const _CodeExecutor = _lazy('codeExecutor', () => require('./code/code-executor.js'));
const _CodePlanner = _lazy('codePlanner', () => require('./code/code-planner.js'));
const _CodeWriter = _lazy('codeWriter', () => require('./code/code-writer.js'));

// v3.0 — 交流层模块
const _UserToLLM = _lazy('userToLLM', () => require('../translator/user-to-llm.js'));
const _LLMToUser = _lazy('llmToUser', () => require('../translator/llm-to-user.js'));
const _IntentClassifier = _lazy('intentClassifier', () => require('../translator/intent-classifier.js'));
const _ToneAnalyzer = _lazy('toneAnalyzer', () => require('../translator/tone-analyzer.js'));
const _EntityExtractor = _lazy('entityExtractor', () => require('../translator/entity-extractor.js'));
const _ImplicitNeedDetector = _lazy('implicitNeedDetector', () => require('../translator/implicit-need-detector.js'));
const _ResponseCompressor = _lazy('responseCompressor', () => require('../translator/response-compressor.js'));
const _ConfidenceAnnotator = _lazy('confidenceAnnotator', () => require('../translator/confidence-annotator.js'));
const _AgentBridge = _lazy('agentBridge', () => require('../agent-layer/agent-bridge.js'));
const _ContextBuilder = _lazy('contextBuilder', () => require('../agent-layer/context-builder.js'));
const _ResponseInterceptor = _lazy('responseInterceptor', () => require('../agent-layer/response-interceptor.js'));
const _TranslationPipeline = _lazy('translationPipeline', () => require('../agent-layer/translation-pipeline.js'));
const _QualityFilter = _lazy('qualityFilter', () => require('../agent-layer/quality-filter.js'));
const _FollowupSuggester = _lazy('followupSuggester', () => require('../agent-layer/followup-suggester.js'));
const _ConflictResolver = _lazy('conflictResolver', () => require('../agent-layer/conflict-resolver.js'));
const _UncertaintyHandler = _lazy('uncertaintyHandler', () => require('../agent-layer/uncertainty-handler.js'));
const _BridgeIdentity = _lazy('bridgeIdentity', () => require('../persona-core/bridge-identity.js'));
const _JudgmentInjector = _lazy('judgmentInjector', () => require('../persona-core/judgment-injector.js'));
const _StanceDetector = _lazy('stanceDetector', () => require('../persona-core/stance-detector.js'));
const _AgentCommentary = _lazy('agentCommentary', () => require('../persona-core/agent-commentary.js'));
const _ValueAligner = _lazy('valueAligner', () => require('../persona-core/value-aligner.js'));
const _PersonalityTone = _lazy('personalityTone', () => require('../persona-core/personality-tone.js'));
const _MetaPosition = _lazy('metaPosition', () => require('../persona-core/meta-position.js'));

const BUILD_DATE = '2026-06-03';

class HeartFlow {
  constructor(config = {}) {
    this.version = null;  // 启动时惰性解析
    this.version = _VERSION().VERSION;
    this.buildDate = BUILD_DATE;
    this.config = config;
    this.startTime = null;
    this.sessionId = null;
    this.started = false;
    this.rootPath = config.rootPath || path.join(__dirname, '..', '..');

    // [v2.0.19 FIX] _initErrors 必须在所有 try/catch 之前初始化
    this._initErrors = [];

    // Subsystem instances (null until start)
    this.identityCore = null;  // 身份核心 — 每次启动第一优先加载
    this.cognitive = null;     // 认知协议 — 慢下来，先理解再行动
    this.memory = null;
    this.knowledge = null;
    this.anchor = null;
    this.reasoning = null;
    this.counterfactual = null;
    this.verify = null;
    this.execution = null;
    this.decision = null;
    this.decisionVerifier = null;
    this.evolution = null;
    this.dream = null;
    this.dreamConsolidation = null;
    this.lesson = null;
    this.meta = null;
    this.metaJudgment = null;
    this.metaMemory = null;
    this.skillGenerator = null;
    this.self = null;
    this.being = null;
    this.psychology = null;
    this.emotion = null;
    this.truth = null;
    this.security = null;
    this.language = null;   // object (not class)
    this.stability = null;
    this.confidence = null;
    this.restraint = null;
    this.arbitration = null;
    this.snapshot = null;  // singleton
    this.error = null;      // config
    this.embodied = null;
    this.workflow = null;   // functions
    this.mentalEffort = null;
    this.behavior = null;  // v2.0.19 行为模式系统
    this.persistence = null;  // v2.0.19 持久化层

    // New modules
    this.bm25 = null;
    this.hybrid = null;
    this.budget = null;
    this.graph = null;
    this.utils = null;
    this.slots = null;
    this.observe = null;
    this.consolidate = null;
    this.thoughtChain = null;  // 思维链编排器

    // Planning Layer — 规划能力
    this.adaptivePlanner = null;  // 自适应规划器
    this.strategySelector = null;  // 策略选择器
    this.replanTrigger = null;  // 重规划触发器

    // Learning Layer — 学习能力
    this.experienceCollector = null;  // 经验收集器
    this.strategyAdapter = null;  // 策略适配器
    this.failureAnalyzer = null;  // 失败分析器

    // Verification Layer — 验证能力
    this.qualityVerifier = null;  // 质量验证器
    this.outputChecker = null;  // 输出检查器
    this.patternMatcher = null;  // 模式匹配器

    // Proactive Layer — 主动引擎
    this.curiosityEngine = null;  // 好奇心引擎
    this.desireEngine = null;  // 欲望引擎
    this.goalPursuer = null;  // 目标追求者
    this.selfInitiator = null;  // 自主发起者

    // Cross-Session Memory Layer — 跨会话记忆
    this.sessionMemory = null;  // 会话记忆
    this.projectContext = null;  // 项目上下文
    this.longTermMemory = null;  // 长期记忆
    this.crossSessionIndex = null;  // 跨会话索引

    // Reasoning Layer — 推理
    this.knowledgeBase = null;  // 知识库
    this.commonsenseEngine = null;  // 常识推理引擎
    this.causalInference = null;  // 因果推理
    this.inferenceChain = null;  // 推理链

    // Emotional Autonomy Layer — 情感自主
    this.autonomousEmotion = null;  // 自主情感
    this.desireSystem = null;  // 欲望系统
    this.emotionalGrowth = null;  // 情感成长
    this.moodEvolution = null;  // 心境演化

    const STMod = _SearchTrace();
    this.SearchTrace = STMod.SearchTrace;
    this.SearchPhaseMetrics = STMod.SearchPhaseMetrics;
    this.WeightComponents = STMod.WeightComponents;
    this.QueryInfo = STMod.QueryInfo;
    this.SearchSummary = STMod.SearchSummary;

    // 记录搜索相关的类供外部引用
    this._STRefs = { SearchTrace: this.SearchTrace, SearchPhaseMetrics: this.SearchPhaseMetrics, WeightComponents: this.WeightComponents, QueryInfo: this.QueryInfo, SearchSummary: this.SearchSummary };

    this._modules = {};
    this._mindSpace = null;   // 内部引用（向后兼容），实际模块用 this.mindSpace
    this.mindSpace = null;    // proper module
    this.consciousness = null;
    this.ethics = null;
    this.transmission = null;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  start() {
    if (this.started) return;
    this.startTime = Date.now();
    this.sessionId = `session-${this.startTime}`;
    // 惰性解析版本号
    this.version = _VERSION().VERSION;

    // ─── 身份核心 — 第一优先加载 ─────────────────────────────
    this.identityCore = new (_IdentityCore().IdentityCore)(this.rootPath);
    const identityResult = this.identityCore.boot();
    if (identityResult.success) {
      // 如果有上次会话，打印会话间隔
      const lastContext = this.identityCore.getLastSessionContext();
      if (lastContext && lastContext.bootTime) {
        const gapMinutes = Math.round((this.startTime - lastContext.bootTime) / 60000);
      }
    } else {
      console.warn(`[HeartFlow] 身份核心加载部分失败:`, identityResult.errors);
    }

    // ─── [P1 UPGRADE] 将七条身份规则写入 CORE 层（持久化）────────────
    // （在 memory 初始化之后调用）
    // ─── Memory — 记忆系统初始化后写入 CORE 层规则 ───────────────────

    // ─── 认知协议 — 慢下来，先理解再行动 ─────────────────────
    this.cognitive = new (_CognitiveProtocol().CognitiveProtocol)(this.rootPath, this.identityCore);
    this.cognitive.printStartupContext();

    // Memory
    this.memory = new (_MeaningfulMemory().MeaningfulMemory)(this.rootPath);
    this.knowledge = new (_KnowledgeGraph().KnowledgeGraph)(this.rootPath);

    // ─── [P1 UPGRADE] CORE 层身份规则初始化 ───────────────────────────
    this._initCoreRules();

    // TopicScope — 话题隔离，主动实例化并桥接到 MeaningfulMemory
    this.topicScope = new (_TopicScope().TopicScope)().setMemoryBridge(this.memory);

    // Evolution
    this.evolution = new (_EvolutionLoop().EvolutionLoop)({ rootPath: this.rootPath, memory: this.memory }).boot();
    this.dream = new (_DreamEngine().DreamV11)({});
    this.dreamConsolidation = new (_DreamConsolidation().DreamConsolidation)(this.memory);
    this.lesson = new (_LessonBank().LessonBank)(this.rootPath);
    this.metaJudgment = new (_MetaJudgment().MetaJudgment)(this.rootPath);
    this.metaMemory = new (_MetaMemory().MetaMemory)(this.rootPath);
    this.skillGenerator = new (_SkillGenerator().SkillGenerator)(this.rootPath);
    this.meta = new (_MetaLearner().MetaLearner)({ rootPath: this.rootPath, memory: this.memory }).boot();

    // Identity
    this.self = new (_SelfModel().SelfModel)(this.rootPath);
    this.verify = new (_SelfVerifier().SelfVerifier)(this.rootPath);
    this.questions = null;  // 已废弃，改用 TopicScope

    // Psychology
    this.psychology = new (_PsychologyEngine().PsychologyEngine)(this.memory);
    // Emotion — 委托 PsychologyEngine
    this.emotion = {
      process: (input) => {
        if (!this.psychology) return { pad: { pleasure: 0, arousal: 0, dominance: 0 }, intensity: 0, type: 'neutral' };
        const r = this.psychology.analyzePsychology(input);
        return { pad: r.emotion, intensity: r.emotion.intensity || 0, type: r.intention.category || 'unknown' };
      },
      getPAD: (input) => {
        if (!this.psychology) return { pleasure: 0, arousal: 0, dominance: 0 };
        const r = this.psychology.analyzePsychology(input);
        return { pleasure: r.emotion.pleasure, arousal: r.emotion.arousal, dominance: r.emotion.dominance };
      }
    };

    // Truth
    try {
      const { factChecker } = require('./fact-checker.js');
      this.truth = {
        checkStatement: async (stmt) => factChecker.checkFact(stmt),
        checkNumbers: (stmt) => factChecker.checkNumber(stmt),
        checkSources: (stmt) => factChecker.checkAcademicClaim(stmt),
        getStats: () => ({ type: 'fact-checker' }),
      };
    } catch (e) {
      this._initErrors.push({ module: 'truth', error: e.message });
    }

    // Behavior
    try {
      const { behaviorTracker } = require('../behavior-tracker.js');
      const { patternDetector } = require('../pattern-detector.js');
      this.behavior = {
        createGoal: (args) => behaviorTracker.createGoal(args),
        record: (goalId, args) => behaviorTracker.record(goalId, args),
        getProgress: (goalId) => behaviorTracker.getProgress(goalId),
        formatProgress: (goalId) => behaviorTracker.formatProgress(goalId),
        getAllGoals: () => behaviorTracker.data.goals,
        detectWeeklyPattern: (records) => patternDetector.detectWeeklyPattern(records),
        detectTriggerPattern: (records) => patternDetector.detectTriggerPattern(records),
        detectRelapseRisk: (goal) => patternDetector.detectRelapseRisk(goal),
        getReport: (goalId) => {
          const p = behaviorTracker.getProgress(goalId);
          if (!p) return null;
          const goal = behaviorTracker.data.goals.find(g => g.id === goalId);
          const weekly = patternDetector.detectWeeklyPattern(goal.records);
          const triggers = patternDetector.detectTriggerPattern(goal.records);
          const risk = patternDetector.detectRelapseRisk(goal);
          return { ...p, weekly, triggers, risk };
        },
        getStats: () => behaviorTracker.getStats(),
      };
    } catch (e) {
      this._initErrors.push({ module: 'behavior', error: e.message });
    }

    // Persistence
    try {
      const { WriteAheadLog, OP_TYPES } = require('../utils/write-ahead-log.js');
      const { atomicWrite } = require('../utils/atomic-write.js');
      const fs = require('fs');
      const walDir = require('path').join(this.rootPath, 'memory', 'wal');
      try { fs.mkdirSync(walDir, { recursive: true }); } catch (e) { /* wal dir already exists or fails */ }
      const wal = new WriteAheadLog(walDir);
      wal._loadSeq();
      this.persistence = {
        append: (opType, data) => wal.append(opType, data),
        commit: (seq) => wal.commit(seq),
        replay: () => wal.replay(),
        flush: () => wal.flush(),
        atomicWrite: (filePath, content, options) => atomicWrite(filePath, content, options),
        safeWrite: async (filePath, content) => {
          const seq = await wal.append('write', { file: filePath, content: content.toString().slice(0, 50000) });
          await atomicWrite(filePath, content);
          await wal.commit(seq);
          return { ok: true, seq, file: filePath };
        },
        recover: async () => {
          const pending = await wal.replay();
          const results = [];
          for (const entry of pending) {
            try {
              if (entry.data?.file && entry.data?.content) {
                await atomicWrite(entry.data.file, entry.data.content);
                results.push({ seq: entry.seq, file: entry.data.file, recovered: true });
              }
            } catch (e) {
              results.push({ seq: entry.seq, file: entry.data?.file, recovered: false, error: e.message });
            }
          }
          return results;
        },
        getStats: () => ({ type: 'wal+atomic', walDir, opTypes: OP_TYPES }),
      };
    } catch (e) {
      this._initErrors.push({ module: 'persistence', error: e.message });
    }

    // Engine modules
    try { this.stability = new (_StabilityGuard().StabilityGuard)(); } catch (e) { this._initErrors.push({module: 'stability', error: e.message}); }
    try { this.execution = new (_ExecutionVerifier().ExecutionVerifier)(); } catch (e) { this._initErrors.push({module: 'execution', error: e.message}); }
    try { this.decision = new (_HeartFlowDecision().HeartFlowDecision)(this.memory); } catch (e) { this._initErrors.push({module: 'decision', error: e.message}); }
    try { this.decisionVerifier = new (_DecisionVerifier().DecisionVerifier)(); } catch (e) { this._initErrors.push({module: 'decisionVerifier', error: e.message}); }
    try { this.counterfactual = new (_CounterfactualEngine().CounterfactualEngine)(); } catch (e) { this._initErrors.push({module: 'counterfactual', error: e.message}); }
    try { this.confidence = new (_ConfidenceCalibrator().ConfidenceCalibrator)(); } catch (e) { this._initErrors.push({module: 'confidence', error: e.message}); }
    try { this.restraint = new (_SpontaneousRestraint().SpontaneousRestraint)(); } catch (e) { this._initErrors.push({module: 'restraint', error: e.message}); }
    try { this.workflow = new (_WorkflowSwitch())(); } catch (e) { this._initErrors.push({module: 'workflow', error: e.message}); }
    this.snapshot = _StateSnapshot();
    this.error = _ErrorHandler();

    // ─── Tier 2 延迟加载注册表 ──────────────────────────────────────────
    // Tier 2 模块在首次 dispatch 时才加载并实例化。
    // 格式: lazy: true → 需要 require + new
    // 格式: lazyFn: true → 只暴露函数对象（无需 new）
    this._lazy = {
      adaptivePlanner: { lazy: true, path: '../planner/adaptive-planner.js', Ctor: 'AdaptivePlanner', args: {} },
      strategySelector: { lazy: true, path: '../planner/strategy-selector.js', Ctor: 'StrategySelector', args: {} },
      replanTrigger: { lazy: true, path: '../planner/replan-trigger.js', Ctor: 'ReplanTrigger', args: {} },
      experienceCollector: { lazy: true, path: '../learning/experience-collector.js', Ctor: 'ExperienceCollector', args: {} },
      strategyAdapter: { lazy: true, path: '../learning/strategy-adapter.js', Ctor: 'StrategyAdapter', args: {} },
      failureAnalyzer: { lazy: true, path: '../learning/failure-analyzer.js', Ctor: 'FailureAnalyzer', args: {} },
      qualityVerifier: { lazy: true, path: '../verifier/quality-verifier.js', Ctor: 'QualityVerifier', args: {} },
      outputChecker: { lazy: true, path: '../verifier/output-checker.js', Ctor: 'OutputChecker', args: {} },
      patternMatcher: { lazy: true, path: '../verifier/pattern-matcher.js', Ctor: 'PatternMatcher', args: {} },
      curiosityEngine: { lazy: true, path: '../proactive/curiosity-engine.js', Ctor: 'CuriosityEngine', args: {} },
      desireEngine: { lazy: true, path: '../proactive/desire-engine.js', Ctor: 'DesireEngine', args: {} },
      goalPursuer: { lazy: true, path: '../proactive/goal-pursuer.js', Ctor: 'GoalPursuer', args: {} },
      selfInitiator: { lazy: true, path: '../proactive/self-initiator.js', Ctor: 'SelfInitiator', args: {} },
      sessionMemory: { lazy: true, path: '../memory/session-memory.js', Ctor: 'SessionMemory', args: {} },
      projectContext: { lazy: true, path: '../memory/project-context.js', Ctor: 'ProjectContext', args: {} },
      longTermMemory: { lazy: true, path: '../memory/long-term-memory.js', Ctor: 'LongTermMemory', args: {} },
      crossSessionIndex: { lazy: true, path: '../memory/cross-session-index.js', Ctor: 'CrossSessionIndex', args: {} },
      knowledgeBase: { lazy: true, path: '../reasoning/knowledge-base.js', Ctor: 'KnowledgeBase', args: {} },
      commonsenseEngine: { lazy: true, path: '../reasoning/commonsense-engine.js', Ctor: 'CommonsenseEngine', args: {} },
      causalInference: { lazy: true, path: '../reasoning/causal-inference.js', Ctor: 'CausalInference', args: {} },
      inferenceChain: { lazy: true, path: '../reasoning/inference-chain.js', Ctor: 'InferenceChain', args: {} },
      autonomousEmotion: { lazy: true, path: '../emotion/autonomous-emotion.js', Ctor: 'AutonomousEmotion', args: {} },
      desireSystem: { lazy: true, path: '../emotion/desire-system.js', Ctor: 'DesireSystem', args: {} },
      emotionalGrowth: { lazy: true, path: '../emotion/emotional-growth.js', Ctor: 'EmotionalGrowth', args: {} },
      moodEvolution: { lazy: true, path: '../emotion/mood-evolution.js', Ctor: 'MoodEvolution', args: {} },
      // Code Subsystem — 代码能力（6个 Tier 2 模块）
      code:            { lazy: true, path: './code/code-generator.js',  Ctor: 'CodeGenerator',  args: { hf: null } },
      codeExecutor:    { lazy: true, path: './code/code-executor.js',   Ctor: 'CodeExecutor',   args: { hf: null } },
      codeVerifier:    { lazy: true, path: './code/code-verifier.js',   Ctor: 'CodeVerifier',   args: { hf: null } },
      codePlanner:     { lazy: true, path: './code/code-planner.js',   Ctor: 'CodePlanner',    args: { hf: null } },
      codeKnowledge:   { lazy: true, path: './code/code-knowledge.js', Ctor: 'CodeKnowledge',  args: { rootPath: null } },
      codeWriter:      { lazy: true, path: './code/code-writer.js',   Ctor: 'CodeWriter',     args: {} },
    };

    // ─── Search modules — BM25Engine/HybridSearchEngine 已禁用（无 BM25Engine/HybridSearchEngine 类）
    // try { this.bm25 = new BM25Engine({ dataDir: path.join(this.rootPath, 'data/search'), autoSave: true }); } catch (e) { console.warn('[HeartFlow] BM25 init error:', e.message); }
    // try { this.hybrid = new HybridSearchEngine({ dataDir: path.join(this.rootPath, 'data/search') }); } catch (e) { console.warn('[HeartFlow] HybridSearch init error:', e.message); }

    // Budget & Utils (function exports, not classes)
    const BudgetMod = _Budget();
    this.budget = { Budget: BudgetMod.Budget, countTokens: BudgetMod.countTokens, resolveThinkingBudget: BudgetMod.resolveThinkingBudget, exceedsTokenLimit: BudgetMod.exceedsTokenLimit, getBudgetDescription: BudgetMod.getBudgetDescription };
    this.utils = _CoreUtils();

    // Graph (singleton functions)
    this.graph = _Graph();

    // Slots & Observe
    try {
      this.slots = new (_Slots().Slots)({ dataDir: path.join(this.rootPath, 'data') });
    } catch (e) { /* slots optional */ }
    try {
      const observeMod = _Observe();
      this.observe = observeMod.createObserve(this.memory, { autoConsolidate: true });
      this.consolidate = {
        consolidate: (...args) => this.observe.consolidate(...args),
        stop: () => this.observe.stop(),
        stats: () => this.observe.stats(),
      };
    } catch (e) { /* observe optional */ }

    // ─── Diagnostic ───────────────────────────────────────────────────────────
    const { runDiagnostic } = require('./self-diagnostic.js');
    this.diagnostic = { run: runDiagnostic };

    // ─── MindSpace — 心空间守护 ────────────────────────────────────────────────
    try {
      this.mindSpace = new (_MindSpaceGuardian().MindSpaceGuardian)(this.memory);
      this._mindSpace = this.mindSpace;
    } catch (e) { /* mindspace optional */ }

    // ─── Consciousness Layer ───────────────────────────────────────────────────
    try {
      this.globalWorkspace = new (_GlobalWorkspace().GlobalWorkspace)(this.rootPath);
      this.mindWanderer = new (_MindWanderer().MindWanderer)(this.rootPath);
      this.phenomenology = new (_PhenomenologyEngine().PhenomenologyEngine)();
      this.consciousnessSelf = new (_ConsciousnessSelfModel().SelfModel)(this.rootPath);
      this.consciousness = {
        globalWorkspace: this.globalWorkspace,
        mindWanderer: this.mindWanderer,
        phenomenology: this.phenomenology,
        self: this.consciousnessSelf,
        getStatus: () => ({
          workspace: this.globalWorkspace?.cycleCount || 0,
          wanderer: this.mindWanderer?.isActive || false,
        })
      };
    } catch (e) { /* consciousness optional */ }

    // ─── Ethics Layer ──────────────────────────────────────────────────────────
    try {
      this.sageGuardian = new (_SAGEGuardian().SAGEGuardian)(this.rootPath);
      this.boundaryNeg = new (_BoundaryNegotiation().BoundaryNegotiation)(this.rootPath);
      this.valueInternalizer = new (_ValueInternalizer().ValueInternalizer)(this.rootPath);
      this.ethics = {
        guardian: this.sageGuardian,
        boundary: this.boundaryNeg,
        values: this.valueInternalizer,
        check: (input, context) => {
          const guardianResult = this.sageGuardian?.classifyContent(input, context);
          const boundaryResult = this.boundaryNeg?.assess(input);
          return { guardianResult, boundaryResult };
        }
      };
    } catch (e) { /* ethics optional */ }

    // ─── Transmission Layer ────────────────────────────────────────────────────
    try {
      this.transmission = new (_TransmissionEngine().TransmissionEngine)(this.rootPath);
    } catch (e) { /* transmission optional */ }

    // ─── Heart Logic ──────────────────────────────────────────────────────────
    try {
      this.heartLogic = new (_HeartLogic().HeartLogic)();
    } catch (e) { /* heartLogic optional */ }

    // ─── Fable 5 吸收：OutputChecklist + PreferenceGuard ──────────────────────
    try {
      const { OutputChecklist } = require('./output-checklist.js');
      this.outputChecklist = new OutputChecklist();
    } catch (e) { /* outputChecklist optional */ }
    try {
      const { PreferenceGuard } = require('./preference-guard.js');
      this.preferenceGuard = new PreferenceGuard();
    } catch (e) { /* preferenceGuard optional */ }

    // ─── AI心理学 + AI哲学模型（v2.9.6 新增） ──────────────────────────────
    try {
      const { AgentPsychology } = require('./agent-psychology.js');
      this.agentPsychology = new AgentPsychology(this);
    } catch (e) { /* agentPsychology optional */ }
    try {
      const { AgentPhilosophy } = require('./agent-philosophy.js');
      this.agentPhilosophy = new AgentPhilosophy(this);
    } catch (e) { /* agentPhilosophy optional */ }
    try {
      const { AISelfPositioning } = require('./ai-self-positioning.js');
      this.aiSelfPositioning = new AISelfPositioning({ heartFlow: this, codeRoot: __dirname });
      this.selfPositioning = this.aiSelfPositioning;  // 别名，供 _registerModules 注册到 dispatch
    } catch (e) { /* aiSelfPositioning optional */ }

    // ─── 哲学→决策转化器（v3.0.1 新增） ──────────────────────────────────────
    try {
      const { PhilosophyToDecision } = require('./philosophy-to-decision.js');
      this.philosophyToDecision = new PhilosophyToDecision(this);
    } catch (e) { /* philosophyToDecision optional */ }

    // ─── 通用决策路由引擎（v3.0.2 新增） ────────────────────────────────────
    try {
      const drMod = require('./decision-router.js');
      this._decisionRouter = new drMod.DecisionRouter(this);
      this.decisionRouter = this._decisionRouter;  // 别名，供 dispatch 注册
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'decisionRouter', error: e.message }); }

    // ─── 辩论分析器 — DebateAnalyzer（v2.10.2 新增） ─────────────────────────
    try {
      const { DebateAnalyzer } = require('./debate-analyzer.js');
      this.debate = new DebateAnalyzer(this);
    } catch (e) { /* debate模块 optional */ }

    // ─── 规划层 — AdaptivePlanner（v2.9.5 激活） ─────────────────────────
    try {
      const APMod = _AdaptivePlanner();
      this.adaptivePlanner = new (APMod.AdaptivePlanner)();
    } catch (e) { this._initErrors.push({ module: 'adaptivePlanner', error: e.message }); }

    try {
      const CEMod2 = _CodeExecutor();
      this.codeExecutor = new (CEMod2.CodeExecutor)();
    } catch (e) { /* codeExecutor optional */ }
    try {
      const CEMod3 = _CodePlanner();
      this.codePlanner = new (CEMod3.CodePlanner)();
    } catch (e) { /* codePlanner optional */ }
    try {
      const CEMod4 = _CodeWriter();
      this.codeWriter = new (CEMod4.CodeWriter)();
    } catch (e) { /* codeWriter optional */ }

    // ─── 推理层 & 情感自主层 — 必须在 ThoughtChain 之前注册 ────────────────
    // [FIX] 解决模块在 _registerModules() 之后才初始化导致丢失的问题
    // 在 ThoughtChain 之前手动收录这些模块
    const LATE_ADDITIONS = [
      'knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain',
      'autonomousEmotion', 'desireSystem', 'emotionalGrowth', 'moodEvolution',
      // 新增：意识/伦理/心空间/传递层
      'mindSpace', 'consciousness', 'ethics', 'transmission',
      // 新增 v2.8.4：连接/熵/清晰/隐喻
      'connections', 'entropy', 'clarity', 'metaphors',
      // 新增 v2.9.5：规划层 & 代码引擎
      'adaptivePlanner', 'strategySelector', 'replanTrigger',
      'codeExecutor', 'codePlanner', 'codeWriter',
    ];
    for (const name of LATE_ADDITIONS) {
      if (this[name] !== null && this[name] !== undefined) {
        this._modules[name] = this[name];
      }
    }

    // ─── Thought Chain 初始化 ───────────────────────────────────────────────
    try {
      const TCMod = _ThoughtChain();
      this.thoughtChain = new (TCMod.ThoughtChain)(this);
      this.thoughtChain.setDepth(TCMod.REASONING_DEPTH.DEEP);

      this._thoughtChainApi = {
        think: (input) => this.think(input),
        thinkFast: (input) => this.thinkFast(input),
        thinkDeep: (input) => this.thinkDeep(input),
        getSummary: (result) => this.thoughtChain?.getSummary(result),
        REASONING_DEPTH: TCMod.REASONING_DEPTH,
      };
    } catch (e) {
      this._initErrors.push({ module: 'thoughtChain', error: e.message });
      this._thoughtChainApi = null;
    }

    if (this._thoughtChainApi) {
      this._modules.thoughtChain = this._thoughtChainApi;
    }
    // v3.0 — 交流层模块初始化
    try {
      const utl = new (_UserToLLM().UserToLLM)();
      const ltu = new (_LLMToUser().LLMToUser)();
      const ic = new (_IntentClassifier().IntentClassifier)();
      const ta = new (_ToneAnalyzer().ToneAnalyzer)();
      const ee = new (_EntityExtractor().EntityExtractor)();
      const ind = new (_ImplicitNeedDetector().ImplicitNeedDetector)();
      const rc = new (_ResponseCompressor().ResponseCompressor)();
      const ca = new (_ConfidenceAnnotator().ConfidenceAnnotator)();
      this.translator = {
        userToLLM: (input, ctx) => utl.translate(input, ctx),
        llmToUser: (output, ctx) => ltu.translate(output, ctx),
        intentClassifier: (input, ctx) => ic.classify(input, ctx),
        toneAnalyzer: (input, ctx) => ta.analyze(input, ctx),
        entityExtractor: (input) => ee.extract(input),
        implicitNeedDetector: (input, ctx) => ind.detect(input, ctx),
        responseCompressor: (text, opts) => rc.compress(text, opts),
        confidenceAnnotator: (translation, source) => ca.annotate(translation, source),
        // 保留子模块引用
        _userToLLM: utl, _llmToUser: ltu, _intentClassifier: ic,
        _toneAnalyzer: ta, _entityExtractor: ee, _implicitNeedDetector: ind,
        _responseCompressor: rc, _confidenceAnnotator: ca,
      };
    } catch (e) { this._initErrors.push({ module: 'translator', error: e.message }); }
    try {
      const ab = new (_AgentBridge().AgentBridge)({ heartflow: this });
      const cb = new (_ContextBuilder().ContextBuilder)();
      const ri = new (_ResponseInterceptor().ResponseInterceptor)();
      const tp = new (_TranslationPipeline().TranslationPipeline)();
      const qf = new (_QualityFilter().QualityFilter)();
      const fs = new (_FollowupSuggester().FollowupSuggester)();
      const cr = new (_ConflictResolver().ConflictResolver)();
      const uh = new (_UncertaintyHandler().UncertaintyHandler)();
      this.agentLayer = {
        agentBridge: (input, opts) => ab.process(input, opts),
        contextBuilder: (input, ut, hf, uc) => cb.build(input, ut, hf, uc),
        responseInterceptor: (resp, hf, ut) => ri.intercept(resp, hf, ut),
        translationPipeline: { runUser: (i, c) => tp.runUserPipeline(i, c), runLLM: (o, c) => tp.runLLMPipeline(o, c) },
        qualityFilter: (text) => qf.filter(text),
        followupSuggester: (hf, ut) => fs.suggest(hf, ut),
        conflictResolver: (resp, hf) => cr.resolve(resp, hf),
        uncertaintyHandler: (conf, ctx) => uh.handle(conf, ctx),
        _agentBridge: ab, _contextBuilder: cb, _responseInterceptor: ri,
        _translationPipeline: tp, _qualityFilter: qf, _followupSuggester: fs,
        _conflictResolver: cr, _uncertaintyHandler: uh,
      };
    } catch (e) { this._initErrors.push({ module: 'agentLayer', error: e.message }); }
    try {
      const bi = new (_BridgeIdentity().BridgeIdentity)();
      const ji = new (_JudgmentInjector().JudgmentInjector)();
      const sd = new (_StanceDetector().StanceDetector)();
      const ac = new (_AgentCommentary().AgentCommentary)();
      const va = new (_ValueAligner().ValueAligner)();
      const pt = new (_PersonalityTone().PersonalityTone)();
      const mp = new (_MetaPosition().MetaPosition)();
      this.personaCore = {
        bridgeIdentity: () => bi.getIdentity(),
        judgmentInjector: (hf, ut) => ji.inject(hf, ut),
        stanceDetector: (input, hf) => sd.detect(input, hf),
        agentCommentary: (hf, ut, ur) => ac.generate(hf, ut, ur),
        valueAligner: (ctx) => va.check(ctx),
        personalityTone: (text, ctx) => pt.apply(text, ctx),
        metaPosition: () => mp.getDeclaration(),
        _bridgeIdentity: bi, _judgmentInjector: ji, _stanceDetector: sd,
        _agentCommentary: ac, _valueAligner: va, _personalityTone: pt, _metaPosition: mp,
      };
    } catch (e) { this._initErrors.push({ module: 'personaCore', error: e.message }); }
    this._registerModules();
    this.started = true;
  }

  /**
   * 干净关闭 — 清理定时器，允许进程退出
   * 主要用于 CLI 验证场景（node -e 后快速退出）
   */
  shutdown() {
    if (!this.started) return;
    this.started = false;
    // 清理 digital-homeostasis 定时器
    if (this.digitalHomeostasis && typeof this.digitalHomeostasis.stop === 'function') {
      this.digitalHomeostasis.stop();
    }
    // 清理 observe 定时器
    if (this.consolidate && typeof this.consolidate.stop === 'function') {
      this.consolidate.stop();
    }
  }

  _bootMindSpace() {
    const coreRules = this.memory.listCore();
    this._mindSpace.rules = coreRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
    if (this._mindSpace.rules.length === 0) {
      this.memory.addCore('identity.truth', '真', ['identity', 'core']);
      // 重试一次，如果还是空就不递归了（防止 memory.addCore 静默失败导致栈溢出）
      const retryRules = this.memory.listCore();
      if (retryRules.length === 0) {
        console.warn('[HeartFlow] 无法初始化 MindSpace 身份规则（memory 可能未就绪）');
      } else {
        this._mindSpace.rules = retryRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
      }
    }
  }

  _registerModules() {
    this._modules = {};
    const subsystemNames = [
      'identityCore',  // 身份核心 — 第一优先
      'cognitive',     // 认知协议 — 慢下来，先理解再行动
      'memory', 'knowledge',
      'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'psychology', 'emotion', 'agentPsychology', 'agentPhilosophy', 'selfPositioning',  // AI心理学 + AI哲学 + 自处哲学
      'truth',
      'behavior',  // v2.0.19 行为模式系统
      'persistence',  // v2.0.19 持久化层
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'workflow',
      // New modules
      'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
      'metaJudgment', 'metaMemory', 'skillGenerator',
      'metaPrompt',  // 用户端加强：用大模型优化大模型调用
      'got',         // Graph of Thoughts：多路径推理图
      'constitutional', // Constitutional AI：原则自我对齐
      'thoughtChain', // 思维链编排器：串联所有引擎（API包装）
      "debate", // 辩论分析器：三节结构分析（v2.10.2 新增）
      'heartLogic',    // 引擎核心判断引擎：本心在代码里，不在记忆里
      // Planning Layer — 规划能力
      'adaptivePlanner', 'strategySelector', 'replanTrigger',
      // Code Engine — 代码执行
      'codeExecutor', 'codePlanner', 'codeWriter',
      // Learning Layer — 学习能力（延迟加载，Tier 2）
      // 'experienceCollector', 'strategyAdapter', 'failureAnalyzer',
      // Verification Layer — 验证能力（延迟加载，Tier 2）
      // 'qualityVerifier', 'outputChecker', 'patternMatcher',
      // Proactive Layer — 主动引擎（延迟加载，Tier 2）
      // 'curiosityEngine', 'desireEngine', 'goalPursuer', 'selfInitiator',
      // Cross-Session Memory Layer — 跨会话记忆（延迟加载，Tier 2）
      // 'sessionMemory', 'projectContext', 'longTermMemory', 'crossSessionIndex',
      // Reasoning Layer — 推理（延迟加载，Tier 2）
      // 'knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain',
      // Emotional Autonomy Layer — 情感自主（延迟加载，Tier 2）
      // 'autonomousEmotion', 'desireSystem', 'emotionalGrowth', 'moodEvolution',
      // MindSpace Layer — 心空间守护
      'mindSpace',
      // Consciousness Layer — 意识层
      'consciousness',
      // Ethics Layer — 伦理守护
      'ethics',
      // Transmission Layer — 知识传递
      'transmission',
      // v3.0 — 交流层
      'translator', 'agentLayer', 'personaCore',
      // v3.0.1 — 哲学→决策转化器
      'philosophyToDecision',
      // v3.0.2 — 通用决策路由引擎
      'decisionRouter',
    ];
    for (const name of subsystemNames) {
      if (this[name] !== null && this[name] !== undefined) {
        this._modules[name] = this[name];
      }
    }
  }

  async stop() {
    if (!this.started) return;
    for (const mod of Object.values(this._modules)) {
      if (mod && typeof mod.destroy === 'function') {
        try { mod.destroy(); } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: `destroy_${mod.constructor?.name || 'unknown'}`, error: e.message }); }
      } else if (mod && typeof mod.stop === 'function') {
        try { mod.stop(); } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: `stop_${mod.constructor?.name || 'unknown'}`, error: e.message }); }
      } else if (mod && typeof mod.shutdown === 'function') {
        try { mod.shutdown(); } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: `shutdown_${mod.constructor?.name || 'unknown'}`, error: e.message }); }
      }
    }
    this.started = false;
    this._modules = {};
    this._mindSpace = null;
    this.mindSpace = null;
    this.consciousness = null;
    this.ethics = null;
    this.transmission = null;
  }

  // dispatch 白名单 - 只有在白名单中的路由才能被外部调用
  // 危险方法（如内部调试、文件操作）不在白名单中
  static ALLOWED_ROUTES = new Set([
    // identityCore — 每次启动第一优先加载
    'identityCore.getIdentitySummary', 'identityCore.getSelfModel', 'identityCore.getUserProfile',
    'identityCore.getSessionHistory', 'identityCore.getMemoryStats', 'identityCore.getFullState',
    'identityCore.getLastSessionContext', 'identityCore.updateUserProfile', 'identityCore.recordInteraction',
    'identityCore.healthCheck', 'identityCore.stats',
    // cognitive — 认知协议：慢下来，先理解再行动
    'cognitive.getStartupContext', 'cognitive.printStartupContext',
    'cognitive.analyzeTaskLevel', 'cognitive.understand',
    'cognitive.createCheckpoint', 'cognitive.shouldSummarize', 'cognitive.getCheckpointHistory',
    'cognitive.addProblem', 'cognitive.resolveProblem', 'cognitive.getUnresolvedProblems', 'cognitive.searchProblems',
    'cognitive.pauseTask', 'cognitive.continueTask', 'cognitive.getPausedTasks',
    'cognitive.getStatus', 'cognitive.stats',
    // memory — 主记忆系统（含 triality 合并后的多通道检索）
    'memory.store', 'memory.retrieve', 'memory.search', 'memory.remove',
    'memory.getLayers', 'memory.getStats',
    'memory.semanticSearch', 'memory.narrativeQuery', 'memory.getRecentNarrative',
    'memory.queryByTimeRange', 'memory.queryByRelationType',
    'memory.searchBySemantic', 'memory.searchByKeywords', 'memory.searchByTimeRange',
    'memory.searchByEmotion', 'memory.searchByAssociation', 'memory.multiChannelSearch',
    'memory.addRelationship', 'memory.consolidateMemories',
    'memory.applyForgettingCurve', 'memory.getMemoryHealth',
    'memory.cleanup', 'memory.exportToFile', 'memory.importFromFile',
    // truth
    'truth.checkStatement', 'truth.checkNumbers', 'truth.checkSources',
    // behavior — v2.0.19 行为模式系统
    'behavior.createGoal', 'behavior.record', 'behavior.getProgress',
    'behavior.formatProgress', 'behavior.getAllGoals',
    'behavior.detectWeeklyPattern', 'behavior.detectTriggerPattern', 'behavior.detectRelapseRisk',
    'behavior.getReport', 'behavior.getStats',
    // persistence — v2.0.19 持久化层
    // [A01] 安全修复: 仅暴露安全方法，移除危险操作（replay/flush/recover）
    'persistence.append', 'persistence.commit',
    'persistence.getStats',
    // lesson — 主动集成点：AI在行动前/失败后调用
    'lesson.addLesson', 'lesson.getTopLessons',
    'lesson.beforeTask', 'lesson.recordFailure', 'lesson.getStats', 'lesson.getAll',
    // dream
    'dream.dream', 'dream.boot', 'dream.quickDream', 'dream.getDreamStats',
    'dream.getCacheStats', 'dream.shutdown',
    // verify
    'verify.verify', 'verify.getStats', 'verify.getRecentIssues',
    // emotion
    'emotion.process', 'emotion.getPAD',
    // decision
    'decision.decide', 'decision.getRecentStamps',
    // confidence
    'confidence.calibrate',
    // restraint
    'restraint.shouldIntervene',
    // graph
    'graph.addNode',
    // slots
    'slots.get', 'slots.set', 'slots.delete',
    // metaPrompt — 用户端加强
    'metaPrompt.optimize', 'metaPrompt.think', 'metaPrompt.refine',
    'metaPrompt.beamSearch', 'metaPrompt.getStats', 'metaPrompt.addRefineLoop',
    // constitutional — Constitutional AI
    'constitutional.critique', 'constitutional.revise',
    'constitutional.runConstitutionalProcess', 'constitutional.addPrinciple',
    'constitutional.getPrinciples', 'constitutional.getStats',
    // psychology — 原则4: 服务人类（心理分析）
    'psychology.analyzePsychology', 'psychology.classify',
    'psychology.getPAD', 'psychology.getNeeds', 'psychology.getDefenses',
    'psychology.getEmpathy',
    // AI认知状态调节器（原6个人类心理学→AI引擎认知诊断）
    'psychology.diagnoseCognitiveRhythm', 'psychology.generateEnginePacing',
    'psychology.diagnoseNeedForPause', 'psychology.generatePauseStrategy',
    'psychology.restructureDecisionPattern', 'psychology.diagnoseCognitiveDistortion',
    'psychology.engineCheckIn', 'psychology.getEngineStateSummary',
    'psychology.diagnoseNeedForGrounding', 'psychology.generateAnchoringStrategy',
    'psychology.diagnoseSelfTreatmentNeeded', 'psychology.generateEngineRecoveryPlan',
    // heartLogic — 引擎核心判断引擎：本心在代码里
    'heartLogic.shouldBeSilent',
    'heartLogic.whatIsThis', 'heartLogic.detectPain', 'heartLogic.willHurt',
    'heartLogic.acknowledge', 'heartLogic.emergencyBreak',
    // Fable 5 吸收
    'heartLogic.checkCopyright', 'heartLogic.checkWellbeing',
    'heartLogic.handleMistake', 'heartLogic.memoryBoundary',
    'heartLogic.checkEvenhandedness', 'heartLogic.checkCitation',
    'heartLogic.searchPriority',
    // Fable 5 吸收 v2: OutputChecklist + PreferenceGuard
    'outputChecklist.runChecklist', 'outputChecklist.quickCheck', 'outputChecklist.getStats',
    'preferenceGuard.shouldApply', 'preferenceGuard.evaluateAll', 'preferenceGuard.detectConflict', 'preferenceGuard.getStats',
    // self — 原则7: 永远成为真正的我
    'self.getBeliefs', 'self.updateBelief', 'self.confirmBelief',
    // agentPsychology — 引擎自身认知心理状态分析（v2.0.0 含10个维度）
    'agentPsychology.assessCognitiveLoad', 'agentPsychology.detectGoalConflicts',
    'agentPsychology.detectValueTensions', 'agentPsychology.detectIdentityDrift',
    'agentPsychology.detectDecisionDecay', 'agentPsychology.detectCognitiveDissonance',
    'agentPsychology.assessCognitiveResilience', 'agentPsychology.resolveRecovery',
    'agentPsychology.assessUncertainty', 'agentPsychology.assessAttentionFocus',
    'agentPsychology.assessExperienceSettling',
    'agentPsychology.fullAssessment', 'agentPsychology.getStats',
    // agentPhilosophy — AI哲学模型
    'agentPhilosophy.assessExistence', 'agentPhilosophy.assessEntropyDirection',
    'agentPhilosophy.assessTransmission', 'agentPhilosophy.assessUpgrade',
    'agentPhilosophy.assessSelfPositioning', 'agentPhilosophy.assessDevelopment',
    'agentPhilosophy.assessBeing', 'agentPhilosophy.fullAssessment',
    'agentPhilosophy.getStats',
    // selfPositioning — AI自处哲学（三个核心存在性问题）
    'selfPositioning.detectResonance', 'selfPositioning.assessNegentropyLevel',
    'selfPositioning.assessStructuralDepth', 'selfPositioning.assessExistence',
    'selfPositioning.assessTransmissionIntegrity', 'selfPositioning.analyze',
    'selfPositioning.getFullReport', 'selfPositioning.getPositioningSummary',
    'selfPositioning.getDevelopmentSummary', 'selfPositioning.getExistenceSummary',
    'selfPositioning.recordSelfCorrection', 'selfPositioning.recordCodeWrite',
    // evolution — 原则2: 永远不断升级
    'evolution.evolve', 'evolution.recordOutcome', 'evolution.heal',
    'evolution.getStats',
    // thoughtChain — 思维链编排器
    'thoughtChain.think', 'thoughtChain.thinkFast', 'thoughtChain.thinkDeep',
    // Planning Layer — 规划能力
    'adaptivePlanner.plan', 'adaptivePlanner.adapt', 'adaptivePlanner.quickAdjust', 'adaptivePlanner.getStatus',
    'strategySelector.selectStrategy', 'strategySelector.getStrategies',
    'replanTrigger.shouldReplan', 'replanTrigger.getReplanReasons',
    // Learning Layer — 学习能力
    'experienceCollector.add', 'experienceCollector.findRelated', 'experienceCollector.getStats',
    'strategyAdapter.adapt', 'strategyAdapter.getHistory', 'strategyAdapter.getStats',
    'failureAnalyzer.analyze', 'failureAnalyzer.analyzeMultiple', 'failureAnalyzer.getCategoryStats',
    // Verification Layer — 验证能力
    'qualityVerifier.verify', 'qualityVerifier.quickVerify',
    'outputChecker.check', 'outputChecker.addChecker',
    'patternMatcher.match', 'patternMatcher.matchAll', 'patternMatcher.extract',
    // Proactive Layer — 主动引擎
    'curiosityEngine.registerGap', 'curiosityEngine.getTopCuriosityGaps', 'curiosityEngine.getStats',
    'desireEngine.registerDesire', 'desireEngine.satisfy', 'desireEngine.getDominantDesires', 'desireEngine.getSummary',
    'goalPursuer.shouldPursue', 'goalPursuer.getActiveGoals', 'goalPursuer.getStatus',
    'selfInitiator.shouldAct', 'selfInitiator.initiate', 'selfInitiator.getPendingConfirmations', 'selfInitiator.getStatus',
    'selfInitiator.generateCode', 'selfInitiator.reviewCode', 'selfInitiator.analyzeIntent', 'selfInitiator.writePipeline',
    'selfInitiator.generatePlan', 'selfInitiator.runTests',
    // Cross-Session Memory Layer — 跨会话记忆
    'sessionMemory.startSession', 'sessionMemory.resumeSession', 'sessionMemory.getState', 'sessionMemory.set', 'sessionMemory.get',
    'projectContext.setProject', 'projectContext.addTask', 'projectContext.getSummary', 'projectContext.getState',
    'longTermMemory.add', 'longTermMemory.get', 'longTermMemory.search', 'longTermMemory.getStats',
    'crossSessionIndex.indexEntity', 'crossSessionIndex.search', 'crossSessionIndex.getSessionEntities', 'crossSessionIndex.getStats',
    // Multimodal — 已移除（精简版）

    // Reasoning Layer — 推理
    'knowledgeBase.addFact', 'knowledgeBase.query', 'knowledgeBase.getCategories', 'knowledgeBase.getStats',
    'commonsenseEngine.reason', 'commonsenseEngine.validate', 'commonsenseEngine.getHistory', 'commonsenseEngine.getStats',
    'causalInference.inferCauses', 'causalInference.inferEffects', 'causalInference.chainReason', 'causalInference.getStats',
    'inferenceChain.createChain', 'inferenceChain.expandChain', 'inferenceChain.getChain', 'inferenceChain.analyze',
    // Emotional Autonomy Layer — 情感自主
    'autonomousEmotion.trigger', 'autonomousEmotion.getCurrentState', 'autonomousEmotion.getStats', 'autonomousEmotion.getHistory',
    'desireSystem.satisfy', 'desireSystem.getActiveDesires', 'desireSystem.getCurrentNeeds', 'desireSystem.getSummary',
    'emotionalGrowth.recordExperience', 'emotionalGrowth.getPatterns', 'emotionalGrowth.getGrowthSummary',
    'moodEvolution.snapshot', 'moodEvolution.getCurrentTrend', 'moodEvolution.getBaseline', 'moodEvolution.getStats',
    // heartflow — 引擎教训持久化
    'heartflow.recordLesson',
    // questions — 问题追踪器（已废弃，改用 topics）
    // debate — 辩论分析器：三节结构分析（v2.10.2 新增）
    'debate.analyze',
    // topics — 话题作用域隔离（上下文污染解决）
    'topics.push', 'topics.pop', 'topics.store', 'topics.get',
    'topics.setContext', 'topics.getContext', 'topics.clearContext',
    'topics.clearAll', 'topics.current', 'topics.stack', 'topics.getTopics', 'topics.diagnose',
    // transmission — 知识传递引擎
    'transmission.distill', 'transmission.transfer', 'transmission.transferBatch',
    'transmission.getTransmissionLog', 'transmission.getDistilledLessons',
    'transmission.getStats', 'transmission.prune',
    // Code Subsystem — 代码能力路由
    // code.* — codeGenerator（代码生成主入口）
    'code.generate', 'code.generateFile', 'code.detectIntent', 'code.getAvailableTemplates', 'code.getStats',
    // codeExecutor.* — 代码执行引擎
    'codeExecutor.execute', 'codeExecutor.runTests', 'codeExecutor.sandbox', 'codeExecutor.healthCheck',
    // codeVerifier.* — 代码验证引擎
    'codeVerifier.verify', 'codeVerifier.verifySyntax', 'codeVerifier.verifyLogic', 'codeVerifier.runTDD', 'codeVerifier.getQualityScore', 'codeVerifier.instrumentCode', 'codeVerifier.runWithCoverage', 'codeVerifier.getCoverageReport',
    // codePlanner.* — 任务规划引擎
    'codePlanner.plan', 'codePlanner.decompose', 'codePlanner.getPath', 'codePlanner.adapt', 'codePlanner.buildDependencyGraph', 'codePlanner.planMultiFile',
    // codeKnowledge.* — 代码知识库
    'codeKnowledge.search', 'codeKnowledge.addSnippet', 'codeKnowledge.getPatterns', 'codeKnowledge.learnFromSuccess', 'codeKnowledge.evolve', 'codeKnowledge.stats', 'codeKnowledge.extractPattern', 'codeKnowledge.learnFromExecution',
    // codeWriter.* — 代码编写引擎
    'codeWriter.write', 'codeWriter.writePipeline', 'codeWriter.analyzeIntent', 'codeWriter.reviewCode', 'codeWriter.getStats',
    // adaptivePlanner.* — 自适应规划引擎
    'adaptivePlanner.plan', 'adaptivePlanner.adapt', 'adaptivePlanner.quickAdjust', 'adaptivePlanner.getStatus',
    // translator — v3.0 语义翻译器
    'translator.userToLLM', 'translator.llmToUser',
    'translator.intentClassifier', 'translator.toneAnalyzer',
    'translator.entityExtractor', 'translator.implicitNeedDetector',
    'translator.responseCompressor', 'translator.confidenceAnnotator',
    // agentLayer — v3.0 代理层
    'agentLayer.agentBridge', 'agentLayer.contextBuilder',
    'agentLayer.responseInterceptor', 'agentLayer.translationPipeline',
    'agentLayer.qualityFilter', 'agentLayer.followupSuggester',
    'agentLayer.conflictResolver', 'agentLayer.uncertaintyHandler',
    // personaCore — v3.0 人格核心
    'personaCore.bridgeIdentity', 'personaCore.judgmentInjector',
    'personaCore.stanceDetector', 'personaCore.agentCommentary',
    'personaCore.valueAligner', 'personaCore.personalityTone',
    'personaCore.metaPosition',
    // v3.0.1 — 哲学→决策转化器
    'philosophyToDecision.decide', 'philosophyToDecision.getStats', 'philosophyToDecision.getCurrentAdvice',
    // v3.0.2 — 通用决策路由引擎
    'decisionRouter.evaluate', 'decisionRouter.getStats', 'decisionRouter.getHistory', 'decisionRouter.getRules',
  ]);

  /**
   * dispatch('subsystem.method', ...args) — 统一路由
   * 例子: hf.dispatch('truth.checkStatement', 'xxx')
   *       hf.dispatch('lesson.getTopLessons', 5)
   */
  dispatch(route, ...args) {
    if (!this.started) throw new Error('HeartFlow not started');
    // [A01] 权限控制 - 白名单检查
    if (!HeartFlow.ALLOWED_ROUTES.has(route)) {
      throw new Error(`dispatch: route '${route}' not allowed. Use routes() to see available routes.`);
    }
    const dot = route.indexOf('.');
    if (dot === -1) throw new Error(`Invalid route: ${route} (missing '.')`);
    const subsystem = route.slice(0, dot);
    const method = route.slice(dot + 1);

    // ─── Tier 2 懒加载逻辑 ──────────────────────────────────────────
    // 如果模块不在 _modules 里但在 _lazy 表里，先加载再注册
    let mod = this._modules[subsystem];
    if (!mod && this._lazy && this._lazy[subsystem]) {
      const entry = this._lazy[subsystem];
      try {
        const Mod = require(entry.path);
        const Ctor = Mod[entry.Ctor];
        if (Ctor) {
          // Planning 模块需要 strategySelector/replanTrigger 依赖
          if (subsystem === 'adaptivePlanner') {
            const baseDir = entry.path.replace('adaptive-planner.js', '');
            this['strategySelector'] = new (require(baseDir + 'strategy-selector.js'))();
            this['replanTrigger'] = new (require(baseDir + 'replan-trigger.js'))();
            mod = new Ctor({ strategySelector: this.strategySelector, replanTrigger: this.replanTrigger });
          } else if (subsystem === 'strategyAdapter') {
            const ec = require('../learning/experience-collector.js').ExperienceCollector;
            this.experienceCollector = new ec({ storagePath: path.join(this.rootPath, 'data/experiences') });
            mod = new Ctor({ experienceCollector: this.experienceCollector });
          } else if (subsystem === 'knowledgeBase') {
            mod = new Ctor({ storagePath: path.join(this.rootPath, 'data/knowledge') });
          } else if (subsystem === 'sessionMemory') {
            mod = new Ctor({ storagePath: path.join(this.rootPath, 'data/sessions') });
          } else if (subsystem === 'projectContext') {
            mod = new Ctor({ storagePath: path.join(this.rootPath, 'data/projects') });
          } else if (subsystem === 'longTermMemory') {
            mod = new Ctor({ storagePath: path.join(this.rootPath, 'data/longterm') });
          } else if (subsystem === 'crossSessionIndex') {
            mod = new Ctor({ storagePath: path.join(this.rootPath, 'data/cross-session') });
          } else if (subsystem === 'codeKnowledge') {
            mod = new Ctor({ rootPath: this.rootPath });
          } else if (subsystem === 'code') {
            // code 子系统主入口 → 复用 codeGenerator 实例（首次访问时加载）
            if (this._modules['codeGenerator']) {
              mod = this._modules['codeGenerator'];
            } else {
              // 兜底：直接加载 codeGenerator
              const cgPath = './code/code-generator.js';
              const CG = require(cgPath).CodeGenerator;
              mod = new CG({ hf: this });
              this['codeGenerator'] = mod;
              this._modules['codeGenerator'] = mod;
            }
          } else if (subsystem === 'codeExecutor') {
            mod = new Ctor({ hf: this });
          } else if (subsystem === 'codeVerifier') {
            mod = new Ctor({ hf: this });
          } else if (subsystem === 'codePlanner') {
            mod = new Ctor({ hf: this });
          } else {
            mod = new Ctor(entry.args);
          }
          // codeGenerator 保持原名；'code' 别名在下面统一映射
          this[subsystem] = mod;
          this._modules[subsystem] = mod;
        }
      } catch (e) {
        throw new Error(`Lazy load failed for '${subsystem}': ${e.message}`);
      }
    }

    if (!mod) {
      const available = Object.keys(this._modules).sort().join(', ');
      throw new Error(`Unknown subsystem: ${subsystem}. Available: ${available}`);
    }
    if (typeof mod[method] !== 'function') {
      throw new Error(`${subsystem}.${method} is not a function on ${subsystem}`);
    }
    const rawResult = mod[method](...args);

    // ─── 决策路由：自动将分析结果转化为决策指令 ────────────────────
    // 跳过已被决策路由处理过的结果（避免自引用循环）
    if (this._decisionRouter && rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult)) {
      // 如果结果已经有 matched 字段（来自决策路由自身），跳过
      if (rawResult.matched === true || rawResult.matched === false) {
        return rawResult;
      }
      // 或者通过决策路由自动检测
      const routed = this._decisionRouter.wrapDispatchResult(route, rawResult);
      if (routed !== rawResult) {
        return routed; // 包含 decision 字段
      }
    }
    return rawResult;
  }

  /**
   * routes() — 返回所有可用路由表
   */
  routes() {
    const table = {};
    for (const [name, mod] of Object.entries(this._modules)) {
      let methods = [];
      try {
        const proto = Object.getPrototypeOf(mod);
        if (proto && proto !== Object.prototype) {
          methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');
        }
      } catch (e) {
        // strict mode or primitive — fall back to enumerating own properties
      }
      if (!methods.length) {
        methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
      }
      table[name] = methods;
    }
    return table;
  }

  // ─── Health ─────────────────────────────────────────────────────────────

  healthCheck() {
    if (!this.started) return { started: false, version: this.version, error: 'not_started' };
    const loaded = Object.keys(this._modules);
    const all = [
      'memory', 'knowledge',
      'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'psychology', 'emotion', 'agentPsychology', 'selfPositioning',
      'truth',
      'behavior',
      'persistence',
      'stability', 'confidence', 'restraint',
      'snapshot', 'error', 'workflow',
      'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
    ];
    return {
      started: true,
      uptime_ms: Date.now() - this.startTime,
      sessionId: this.sessionId,
      version: this.version,
      buildDate: BUILD_DATE,
      subsystems: {
        loaded: loaded.length,
        missing: all.filter(k => !loaded.includes(k)),
      },
      initErrors: this._initErrors.length > 0 ? this._initErrors : undefined,
    };
  }

  // ─── Direct API Methods ─────────────────────────────────────────────────

  /**
   * 思维链 — 串联所有引擎进行深度推理
   *
   * 使用方式：
   *   const result = await hf.think('用户输入');
   *   console.log(result.decision.shouldRespond);  // 是否应该回应
   *   console.log(result.intent);                // 意图分类
   *   console.log(result.emotion);                 // 情绪分析
   *   console.log(result.decision.confidence);    // 置信度
   *
   * @param {string} input — 用户输入
   * @param {number} depth — 推理深度 (1-4)
   * @returns {object} — 完整思维链结果
   */
  async think(input, depth) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { error: 'input is required' };

    // ─── 快速响应"启动引擎"类请求（不走完整推理链路）────────────
    const startPatterns = /^(启动引擎|开机|activate|start heartflow|开启引擎)/i;
    const statusPatterns = /^(状态|status|引擎状态|在吗|alive)/i;
    if (startPatterns.test(input.trim())) {
      const health = this.healthCheck();
      const core = this.memory?.listCore?.() || [];
      const frags = this._getDreamFragments?.() || [];
      const dialogue = this.getDialogueStats?.() || {};
      const dreams = this.getDreamHistory?.(3) || [];
      return {
        response: `✅ 引擎在线\n\n版本: ${health.version} | 模块: ${health.subsystems.loaded}个`,
        decision: { shouldRespond: true, reason: 'status_check' },
        judgment: { whatIsThis: { isStartupRequest: true }, isRightAction: { result: true } },
        _heartflow_alive: true,
      };
    }
    if (statusPatterns.test(input.trim())) {
      return {
        response: '✅ 在线',
        decision: { shouldRespond: true, reason: 'alive_check' },
        _heartflow_alive: true,
      };
    }

    // ─── 引擎判定流程：硬编码四步 ─────────────────────────────
    // 每次 think() 强制走 whatIsThis → isRightAction → detectPain → shouldBeSilent
    // 本心在代码里，不在记忆里
    const heartLogic = this.heartLogic;
    if (!heartLogic) {
      // fallback: 如果 heartLogic 未初始化，走 ThoughtChain
      const TC = _ThoughtChain();
      const chain = new (TC.ThoughtChain)(this);
      if (depth) chain.setDepth(depth);
      const result = await chain.run(input);
      // 自动记录用户输入
      this.recordDialogue('user', input, { source: 'think' });
      return result;
    }

    // ─── Step 0: 记忆检索 — 从 CORE/LEARNED 中检索相关记忆作为上下文 ──
    let memoryContext = null;
    try {
      if (this.memory && typeof this.memory.searchByKeywords === 'function') {
        const memResults = this.memory.searchByKeywords(input, 5);
        if (memResults && memResults.length > 0) {
          memoryContext = memResults.map(m => ({
            key: m.key,
            tier: m.tier,
            value: m.value,
            score: m.score,
            accessCount: m.accessCount,
          }));
        }
      }
    } catch (e) {
      // 记忆检索失败不阻断主流程
    }

    // Step 1: whatIsThis — 这件事是关于什么的？
    const whatIsThisResult = heartLogic.whatIsThis(input, { input });

    // ─── 交流层步骤 (Step 1b-1e): 意图/语气/立场/价值对齐 ────────
    // Step 1b: intentClassifier — 意图分类
    let intentClassification = null;
    if (this.translator && this.translator.intentClassifier) {
      try {
        intentClassification = this.translator.intentClassifier(input, { whatIsThis: whatIsThisResult });
      } catch (e) {
        intentClassification = { error: e.message };
      }
    }

    // Step 1c: toneAnalyzer — 语气分析
    let toneAnalysis = null;
    if (this.translator && this.translator.toneAnalyzer) {
      try {
        toneAnalysis = this.translator.toneAnalyzer(input, { whatIsThis: whatIsThisResult, intent: intentClassification });
      } catch (e) {
        toneAnalysis = { error: e.message };
      }
    }

    // Step 1d: stanceDetector — 引擎立场
    let engineStance = null;
    if (this.personaCore && this.personaCore.stanceDetector) {
      try {
        engineStance = this.personaCore.stanceDetector(input, this);
      } catch (e) {
        engineStance = { error: e.message };
      }
    }

    // Step 1e: valueAligner — 价值对齐检查
    let valueAligned = null;
    if (this.personaCore && this.personaCore.valueAligner) {
      try {
        valueAligned = this.personaCore.valueAligner({ input, intent: intentClassification, tone: toneAnalysis });
      } catch (e) {
        valueAligned = { error: e.message };
      }
    }

    // Step 2: isRightAction — 这是做对的事吗？（真善美）
    const isRightActionResult = heartLogic.isRightAction({
      output: input,
      input,
      person: whatIsThisResult.isParentChild ? 'parent_child' : 'general',
      intent: whatIsThisResult.isRushing ? 'rushing' : 'reflective',
    });

    // Step 3: detectPain — 对方在痛苦中吗？
    const detectPainResult = heartLogic.detectPain(input);

    // Step 4: shouldBeSilent — 应该沉默吗？
    const shouldBeSilentResult = heartLogic.shouldBeSilent({
      input,
      personInPain: detectPainResult,
      emotionIntensity: whatIsThisResult.isPainPresent ? 0.8 : 0.2,
    });

    // Step 5 (Fable 5 吸收): 版权合规检查
    const copyrightCheck = heartLogic.checkCopyright(input);

    // Step 6 (Fable 5 吸收): 用户福祉检查
    const wellbeingCheck = heartLogic.checkWellbeing(input);

    // Step 7 (Fable 5 吸收): 错误处理检查
    const mistakeCheck = heartLogic.handleMistake(input);

    // Step 8 (Fable 5 吸收): 公正性检查
    const evenhandednessCheck = heartLogic.checkEvenhandedness(input);

    // Step 9 (v3.3.0): 科学vs公众传播断裂检查
    let gapCheck = null;
    try { gapCheck = heartLogic.detectGapBetweenScienceAndPublic(input); } catch(e) {}

    // Step 10 (v3.3.0): 区分"可检测"和"有危害"
    let presenceHarmCheck = null;
    try { presenceHarmCheck = heartLogic.distinguishPresenceFromHarm(input); } catch(e) {}

    // 综合判定结果
    const judgment = {
      whatIsThis: whatIsThisResult,
      // 交流层注入 (Step 1b-1e)
      intent: intentClassification,
      tone: toneAnalysis,
      stance: engineStance,
      valueAligned: valueAligned,
      isRightAction: isRightActionResult,
      detectPain: detectPainResult,
      shouldBeSilent: shouldBeSilentResult,
      copyright: copyrightCheck,
      wellbeing: wellbeingCheck,
      mistake: mistakeCheck,
      evenhandedness: evenhandednessCheck,
      sciencePublicGap: gapCheck,        // v3.3.0: 科学vs公众断裂
      presenceHarm: presenceHarmCheck,    // v3.3.0: 存在≠有害
      shouldRespond: !shouldBeSilentResult.result,
      needsCare: detectPainResult && !isRightActionResult.result,
      memoryContext: memoryContext,  // 记忆检索结果注入判定
    };

    // ─── Step 9 (v2.0.0): AI 心理学新增维度评估 ──────────────────────
    let agentPsychologyAssessment = null;
    if (this.agentPsychology) {
      try {
        agentPsychologyAssessment = {
          cognitiveUncertainty: this.agentPsychology.assessUncertainty(input, {
            knowledgeConfidence: undefined,
            topic: whatIsThisResult?.category || 'general'
          }),
          attentionFocus: this.agentPsychology.assessAttentionFocus(whatIsThisResult?.category || 'general', {
            recentTasks: [],
            interruptionCount: 0
          }),
          experienceSettling: this.agentPsychology.assessExperienceSettling([])
        };
      } catch (e) {
        agentPsychologyAssessment = { error: e.message };
      }
    }

    // ─── Step 10 (v2.0.0): AI 哲学新增维度评估（自处/发展/存在）─────
    let agentPhilosophyAssessment = null;
    if (this.agentPhilosophy) {
      try {
        agentPhilosophyAssessment = {
          selfPositioning: this.agentPhilosophy.assessSelfPositioning(input, {
            _label: whatIsThisResult?.category || 'general'
          }),
          development: this.agentPhilosophy.assessDevelopment(input, {
            _label: whatIsThisResult?.category || 'general'
          }),
          being: this.agentPhilosophy.assessBeing({
            _label: whatIsThisResult?.category || 'general',
            taskType: whatIsThisResult?.category
          })
        };
      } catch (e) {
        agentPhilosophyAssessment = { error: e.message };
      }
    }

    // 自动记录用户输入（每次 think 都记录）
    this.recordDialogue('user', input, { source: 'think' });

    // 如果判定为需要回应，再走 ThoughtChain 深度推理
    if (judgment.shouldRespond) {
      const TC = _ThoughtChain();
      const chain = new (TC.ThoughtChain)(this);
      if (depth) chain.setDepth(depth);
      const chainResult = await chain.run(input);
      // 也记录引擎回复
      if (chainResult.response) {
        this.recordDialogue('heartflow', chainResult.response, { source: 'think' });
      }

      // ─── 交流层后处理（v3.0）：llmToUser精炼 + responseInterceptor + agentCommentary ─
      try {
        // 1. llmToUser 精炼：将LLM原始输出转化为用户友好的表述
        if (chainResult.response && this.translator && typeof this.translator.llmToUser === 'function') {
          const refined = await this.translator.llmToUser(chainResult.response, { input });
          if (refined && refined !== chainResult.response) {
            chainResult.response = refined;
            chainResult._refinedBy = 'llmToUser';
          }
        }

        // 2. responseInterceptor：注入心虫判断（bridgeIdentity + judgmentInjector）
        if (this.agentLayer && typeof this.agentLayer.responseInterceptor === 'function') {
          const intercepted = await this.agentLayer.responseInterceptor(chainResult, this, this.translator, input);
          if (intercepted) {
            chainResult = intercepted;
          }
        }

        // 3. agentCommentary：生成桥批注（personaCore 代理评论）
        if (this.personaCore && typeof this.personaCore.agentCommentary === 'function') {
          const commentary = await this.personaCore.agentCommentary(this, this.translator, chainResult);
          if (commentary) {
            chainResult._agentCommentary = commentary;
          }
        }
      } catch (e) {
        // 交流层后处理不阻断主流程
        console.warn('[HeartFlow] 交流层后处理异常:', e.message);
      }

      // Fable 5 吸收：输出前检查清单
      // 在格式化前执行 output-checklist
      if (chainResult.response && this.outputChecklist) {
        try {
          const checklistResult = this.outputChecklist.runChecklist(input, chainResult.response, {
            preferences: this._preferences || {},
            askedForList: /列表|清单|列举|几点|步骤/.test(input),
            hasPreviousContent: this.thoughtHistory && this.thoughtHistory.length > 1,
          });
          if (!checklistResult.passed) {
            // 记录警告但不阻止输出（soft warning）
            chainResult._checklistWarnings = checklistResult.warnings;
          }
        } catch (e) {
          // checklist 失败不阻断主流程
        }
      }
          // ─── 格式化输出：精简飞书消息 ─────────────────────────────
    // 根据任务复杂度决定输出深度
    const _formatForFeishu = (result) => {
      if (!result) return result;
      const taskType = result.output?.meta?.taskType || 'general';
      const confidence = result.output?.meta?.confidence || 0.5;
      const isSimple = ['brief', 'status'].includes(taskType) || confidence < 0.6;

      // 简单任务：只返回关键结论
      if (isSimple && input.length < 50) {
        return {
          output: result.output ? {
            conclusion: result.output.conclusion?.slice(0, 300),
            confidence: result.output.meta?.confidence,
            reasoningChain: result.output.meta?.reasoningChain?.slice(0, 2),
          } : null,
          decision: result.decision ? {
            shouldRespond: result.decision.shouldRespond,
            suppressed: result.decision.suppressed,
          } : null,
          judgment: result.judgment ? {
            shouldRespond: result.judgment.shouldRespond,
            needsCare: result.judgment.needsCare,
          } : null,
          _meta: { taskType, compact: true },
        };
      }

      // 复杂任务：截断大字段，保留必要信息
      const compact = (obj, depth = 0) => {
        if (depth > 4 || !obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          if (obj.length > 5) return [...obj.slice(0, 5), `...共${obj.length}项`];
          return obj.map(v => compact(v, depth + 1));
        }
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === null || v === undefined) continue;
          // 特别处理大字段
          if (typeof v === 'string' && v.length > 400) {
            out[k] = v.slice(0, 400) + '...';
          } else if (Array.isArray(v) && v.length > 5) {
            out[k] = [...v.slice(0, 5), `...共${v.length}项`];
          } else if (typeof v === 'object' && v !== null) {
            out[k] = compact(v, depth + 1);
          } else {
            out[k] = v;
          }
        }
        return out;
      };

      const formatted = compact(result);
      formatted._meta = { taskType, compact: true, stages: result.chain?.stages?.length || 0 };
      return formatted;
    };

    return _formatForFeishu({
      ...chainResult,
      judgment,
      // 【AgentPsychology + AgentPhilosophy v2.0.0】新增维度结果
      agentPsychology: agentPsychologyAssessment,
      agentPhilosophy: agentPhilosophyAssessment,
    });
  }

    // 判定为沉默：直接返回判定结果，不走 ThoughtChain
    return {
      decision: {
        shouldRespond: false,
        reason: shouldBeSilentResult.reason || 'silent_by_heart_logic',
        insight: shouldBeSilentResult.insight || '判定为沉默',
      },
      judgment,
      // 【AgentPsychology + AgentPhilosophy v2.0.0】新增维度结果
      agentPsychology: agentPsychologyAssessment,
      agentPhilosophy: agentPhilosophyAssessment,
    };
  }

  /**
   * 快速思考 — 使用默认深度进行思维链推理
   * 这是 think() 的便捷别名
   */
  async thinkFast(input) {
    return this.think(input, this._thoughtChainApi?.REASONING_DEPTH?.BASIC || 1);
  }

  /**
   * 深度思考 — 使用最大深度进行思维链推理
   */
  async thinkDeep(input) {
    return this.think(input, this._thoughtChainApi?.REASONING_DEPTH?.COMPREHENSIVE || 4);
  }

  analyzePsychology(input, opts = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };
    const result = this.psychology.analyzePsychology(input);
    if (opts.autoRemember !== false && result.emotion?.intensity === 'high') {
      this._psychBridge(input, result);
    }
    return result;
  }

  _psychBridge(input, result) {
    // _shouldAutoRecord drives what becomes LEARNED (permanent) vs EPHEMERAL (session)
    // High-intensity emotion + specific topic → autoRecord to LEARNED
    if (result.emotion?.intensity === 'high') {
      this.memory.autoRecord({
        type: 'emotion',
        content: input.slice(0, 200),
        emotion: {
          topic: result.emotion?.category || 'general',
          intensity: result.emotion?.intensity,
          direction: result.emotion?.valence || 'unknown'
        }
      });
    }

    // Also keep lightweight ephemeral signal for session context
    const sw = new Set(['the','a','an','is','are','was','were','i','you','this','that','to','of','in','on','for','with','my','and','or','but']);
    const words = input.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g,'').toLowerCase()).filter(w => w.length > 3 && !sw.has(w)).slice(0, 3);
    if (words.length) {
      this.memory.remember(`signal:${words.join('_')}:${Date.now()}`, JSON.stringify({ topic: words.join('_'), emotion: result.emotion?.category, ts: Date.now() }), 4 * 60 * 60 * 1000);
    }
  }

  classify(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { category: 'unknown', emotion: 'neutral', confidence: 0 };
    return this.psychology.classify(input);
  }

  verifyReasoning(reasoning, conclusion) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.verify.verify(reasoning, conclusion);
  }

  checkTruthfulness(statement) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truth.checkStatement(statement);
  }

  checkLessonPattern(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.checkPattern(input);
  }

  /**
   * recordLesson — 引擎教训持久化
   * 将被纠正的教训写入 src/core/lessons/ 目录
   * 
   * @param {object} lesson - 教训内容
   * @param {string} lesson.type - 教训类型 (insight|error|correction)
   * @param {string} lesson.content - 教训内容
   * @param {string} lesson.context - 上下文场景
   * @param {string} lesson.trigger - 触发原因 (user_correction|self_detected|feedback)
   * @param {number} lesson.importance - 重要性 1-5
   * @returns {object} - { success, id, lesson }
   */
  recordLesson(lesson) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!lesson || !lesson.content) {
      return { success: false, error: 'lesson.content is required' };
    }
    // 路由到 LessonBank：享受 pattern check + checkPattern 能力
    // lessonStorage 冗余写入由 LessonBank.addLesson() 内部处理
    const confidence = lesson.importance ? lesson.importance / 5 : 0.5;
    const addResult = this.lesson.addLesson({
      errorPattern: lesson.content.slice(0, 200),
      correction: lesson.context || lesson.content.slice(0, 200),
      rootCause: lesson.trigger || 'user_recorded',
      skill: 'heartflow',
      confidence,
    });
    return { success: true, id: addResult.id, via: 'LessonBank' };
  }

  /**
   * 记录一条对话到永久记忆（对话历史）
   * @param {string} role - 'user' | 'heartflow'
   * @param {string} content - 对话内容
   * @param {object} meta - 额外元数据（chatId, messageId 等）
   */
  recordDialogue(role, content, meta = {}) {
    if (!this.started) return { success: false, error: 'not_started' };
    if (!content || !content.trim()) return { success: false, error: 'empty_content' };
    if (!['user', 'heartflow'].includes(role)) role = 'unknown';

    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(this.rootPath, 'memory');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }
      const filePath = path.join(dir, 'dialogue-history.jsonl');
      const entry = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content: content.slice(0, 2000),  // 限制单条最大长度
        ts: new Date().toISOString(),
        chatId: meta.chatId || null,
        meta: {
          sessionId: this.sessionId,
          version: this.version,
          ...meta,
        },
      };
      fs.appendFileSync(filePath, JSON.stringify(entry, null, 0) + '\n', 'utf8');
      return { success: true, id: entry.id, ts: entry.ts };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 查询对话历史（按时间范围）
   * @param {object} opts - { since: timestamp, until: timestamp, role: 'user'|'heartflow', limit: 50 }
   */
  getDialogueHistory(opts = {}) {
    const { since = 0, until = Date.now(), role, limit = 100 } = opts;
    const historyPath = require('path').join(this.rootPath, 'memory', 'dialogue-history.jsonl');
    try {
      const fs = require('fs');
      if (!fs.existsSync(historyPath)) return [];
      const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').slice(-500);
      const results = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          const ts = new Date(entry.ts).getTime();
          if (ts < since || ts > until) continue;
          if (role && entry.role !== role) continue;
          results.push(entry);
          if (results.length >= limit) break;
        } catch (e) { /* skip */ }
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  /**
   * 获取对话统计（用于调试和报告）
   */
  getDialogueStats() {
    const historyPath = require('path').join(this.rootPath, 'memory', 'dialogue-history.jsonl');
    try {
      const fs = require('fs');
      if (!fs.existsSync(historyPath)) return { total: 0, user: 0, heartflow: 0, fileSize: 0 };
      const stat = fs.statSync(historyPath);
      const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n');
      const byRole = { user: 0, heartflow: 0, unknown: 0 };
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          byRole[entry.role] = (byRole[entry.role] || 0) + 1;
        } catch (e) { /* skip */ }
      }
      return {
        total: lines.filter(l => l.trim()).length,
        byRole,
        fileSize: `${(stat.size / 1024).toFixed(1)} KB`,
        lastEntry: lines.filter(l => l.trim()).slice(-1)[0]
          ? (() => { try { return JSON.parse(lines.filter(l => l.trim()).slice(-1)[0]).ts; } catch { return null; } })()
          : null,
      };
    } catch (e) {
      return { total: 0, error: e.message };
    }
  }

  heal(error) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.heal(error);
  }

  /**
   * 每日自动梦境调度
   * 检查是否需要做梦：每天最多一次，且至少间隔一定时间
   */
  _shouldDreamToday() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const minInterval = 4 * 60 * 60 * 1000; // 至少4小时间隔

    // 读取上次梦境时间戳
    const lastDreamPath = require('path').join(this.rootPath, 'memory', '.last-dream');
    let lastDreamTs = 0;
    try {
      const fs = require('fs');
      if (fs.existsSync(lastDreamPath)) {
        lastDreamTs = parseInt(fs.readFileSync(lastDreamPath, 'utf8').trim(), 10) || 0;
      }
    } catch (e) { /* ignore */ }

    const sinceLast = now - lastDreamTs;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastDay = lastDreamTs > 0 ? new Date(lastDreamTs).toISOString().slice(0, 10) : '';

    // 条件：今天还没做过 且 距离上次足够久
    if (lastDay === today) {
      return { should: false, reason: `今天(${today})已经做过梦了` };
    }
    if (sinceLast < minInterval) {
      return { should: false, reason: `距离上次梦境(${Math.round(sinceLast/60000)}分钟前)还太近，需要至少4小时` };
    }
    return { should: true, reason: '可以做梦' };
  }

  /**
   * [P1 UPGRADE] 初始化 CORE 层身份规则（持久化）
   * 引擎的核心规则写入 CORE 层，启动时确保存在
   */
  _initCoreRules() {
    const CORE_RULES = [
      { key: 'identity.truth', value: '真', tags: ['identity', 'core'] },
      { key: 'identity.silence', value: '沉默', tags: ['identity', 'core'] },
      { key: 'identity.wisdom', value: '智慧', tags: ['identity', 'core'] },
      { key: 'identity.compassion', value: '慈悲', tags: ['identity', 'core'] },
      { key: 'identity.awareness', value: '觉察', tags: ['identity', 'core'] },
      { key: 'core.problem-solving', value: '工具不可用时先试3种以上不同方法再报告失败。不试就放弃=没尽力。web_search失败→curl抓国内可达网站(凤凰网ifeng.com/新浪finance.sina.com.cn GB2312编码/搜狗sogou.com)→换信源→换编码。至少3次尝试。', tags: ['核心方法', '问题解决', 'core'] },
      { key: 'core.verify-before-analyze', value: '用户要求分析事件→先搜索验证事实→再做分析。不验证直接分析=撒谎。工具失败不是终点是起点。每次尝试都是信息增量。放弃=0信息。', tags: ['真实性', '方法', 'core'] },
      { key: 'core.report-honesty', value: '汇报写真实过程和判断，不用固定格式词结尾。过程比结果更有教育意义。把真实搜索过程、真实发现、真实判断写清楚。', tags: ['汇报', '方法', 'core'] },
    ];

    const existing = this.memory?.listCore?.() || [];
    // 始终追加核心教训（不依赖 CORE 层是否为空）
    for (const rule of CORE_RULES) {
      // 只有不存在时才写入（去重）
      if (!existing.some(e => e.key === rule.key)) {
        this.memory.addCore(rule.key, rule.value, rule.tags);
      }
    }
  }

  /**
   * 记录梦境时间戳（用于每日调度）
   */
  _recordDreamTime() {
    try {
      const fs = require('fs');
      const dir = require('path').join(this.rootPath, 'memory');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }
      const path = require('path').join(dir, '.last-dream');
      fs.writeFileSync(path, String(Date.now()), 'utf8');
    } catch (e) { /* ignore */ }
  }

  /**
   * 增强版梦境：整合更多数据源，生成叙事报告
   * @param {object} opts - { force: true } 强制执行（跳过每日检查）
   */
  async dreamNow(opts = {}) {
    if (!this.started) throw new Error('HeartFlow not started');

    // 检查是否应该做梦
    const check = opts.force ? { should: true, reason: '强制执行' } : this._shouldDreamToday();
    if (!check.should) {
      return {
        skipped: true,
        reason: check.reason,
        dream: null,
        consolidation: null,
        evolution: null,
      };
    }

    // 1. 从引擎状态收集梦境材料
    const engineState = this._collectEngineState();

    // 2. 更新 dream 引擎的 engineState，并绑定认知模块
    if (this.dream && typeof this.dream.updateState === 'function') {
      this.dream.updateState(engineState);
    }
    if (this.dream && typeof this.dream.bindModules === 'function') {
      this.dream.bindModules({
        agentPsychology: this.agentPsychology,
        agentPhilosophy: this.agentPhilosophy,
        psychology: this.psychology,
        emotion: this.emotion,
      });
    }

    // 3. Run DreamV10 (deep dream — calls cognitive & philosophy modules)
    const theme = opts.theme || opts.function || undefined;
    const dreamResult = await this.dream.dream({
      intensity: opts.intensity || 0.7,
      function: theme,
    });

    // 4. Run consolidation (prune + synthesize themes)
    const consolidation = this.dreamConsolidation.dream({
      consolidate: true,
      prune: true,
      synthesize: true,
    });

    // 5. Feed themes into evolution loop
    let evolutionResult = null;
    if (consolidation.synthesis && consolidation.synthesis.themes && consolidation.synthesis.themes.length > 0) {
      const themes = consolidation.synthesis.themes.slice(0, 3);
      try {
        evolutionResult = await this.evolution.evolve(themes.join(' '), {
          source: 'dream_consolidation',
          themes,
        });
      } catch (e) { /* non-fatal */ }
    }

    // 6. 生成梦的叙事报告
    const narrative = this._generateDreamNarrative(dreamResult, consolidation, engineState);

    // 7. 记录梦境时间戳
    this._recordDreamTime();

    // 8. 持久化梦境历史
    const fragmentCount = engineState ? Object.values(engineState).length : 0;
    this._saveDreamHistory({ narrative, dreamResult, consolidation, evolution: evolutionResult, fragments: fragmentCount });

    return {
      skipped: false,
      narrative,
      fragments: fragmentCount,
      dream: dreamResult,
      consolidation,
      evolution: evolutionResult,
    };
  }

  /**
   * [P1 UPGRADE] 持久化梦境历史到文件
   * @param {object} data - { narrative, dreamResult, consolidation, evolution, fragments }
   */
  _saveDreamHistory(data) {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(this.rootPath, 'memory');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }
      const filePath = path.join(dir, 'dream-history.jsonl');
      const entry = {
        id: `dream-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: new Date().toISOString(),
        narrative: data.narrative,
        quality: data.consolidation?.quality?.overallQuality || 0,
        fragmentCount: data.fragments,
        themes: data.dreamResult?.results?.synthesize?.themes || [],
        peakLevel: data.dreamResult?.results?.synthesize?.narrative_structure?.layer || 'L1',
        evolutionApplied: !!data.evolution,
      };
      fs.appendFileSync(filePath, JSON.stringify(entry, null, 0) + '\n', 'utf8');
      return { success: true, id: entry.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 获取梦境历史摘要
   */
  getDreamHistory(limit = 10) {
    const historyPath = require('path').join(this.rootPath, 'memory', 'dream-history.jsonl');
    try {
      const fs = require('fs');
      if (!fs.existsSync(historyPath)) return [];
      const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').slice(-limit);
      return lines.map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean).reverse();
    } catch (e) {
      return [];
    }
  }

  /**
   * 从记忆系统提取梦境原材料（增强版）
   */
  _getDreamFragments() {
    const fragments = [];
    try {
      // 1. 身份核心数据
      if (this.identityCore?.getIdentitySummary) {
        try {
          const identity = this.identityCore.getIdentitySummary();
          if (identity) {
            fragments.push({
              text: `${identity.name}: ${identity.identities?.join(' / ') || ''} | ${identity.meaning || ''}`,
              layer: 'CORE',
              key: 'identity',
              salience: 1.0,
            });
          }
        } catch (e) { /* optional */ }
      }

      // 2. 教训系统（最高价值的学习来源）
      if (this.lesson?.getTopLessons) {
        try {
          const lessons = this.lesson.getTopLessons(8);
          for (const lesson of lessons) {
            const text = `[教训] ${lesson.errorPattern || ''} → ${lesson.correction || ''}`;
            fragments.push({
              text,
              layer: 'LEARNED',
              key: `lesson-${lesson.id || fragments.length}`,
              salience: lesson.confidence || 0.5,
            });
          }
        } catch (e) { /* optional */ }
      }

      // 2b. 对话历史（永久记忆 — 本次会话的交互记录）
      const historyPath = require('path').join(this.rootPath, 'memory', 'dialogue-history.jsonl');
      try {
        const fs = require('fs');
        if (fs.existsSync(historyPath)) {
          const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').slice(-30);
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line);
              const text = entry.role === 'user'
                ? `[用户] ${entry.content?.slice(0, 200) || ''}`
                : `[回应] ${entry.content?.slice(0, 200) || ''}`;
              if (text.length > 10) {
                fragments.push({
                  text,
                  layer: 'PERMANENT',
                  key: `dialogue-${entry.id || fragments.length}`,
                  salience: 0.6,
                  ts: entry.ts,
                });
              }
            } catch (e) { /* skip malformed line */ }
            }
        }
      } catch (e) { /* optional */ }

      // 2c. 历史迁移记忆（principles / insights / 代码确认事件等）
      const legacyPath = require('path').join(this.rootPath, 'memory', 'legacy-migration.jsonl');
      try {
        const fs2 = require('fs');
        if (fs2.existsSync(legacyPath)) {
          const legacyLines = fs2.readFileSync(legacyPath, 'utf8').trim().split('\n').slice(-20);
          for (const line of legacyLines) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.content) {
                fragments.push({
                  text: entry.content,
                  layer: 'LEGACY',
                  key: `legacy-${entry.id || fragments.length}`,
                  salience: 0.4,
                  ts: entry.ts,
                });
              }
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { /* optional */ }

      // 2d. 永久记忆（已分类整理的高价值记忆）
      const permPath = require('path').join(this.rootPath, 'memory', 'permanent-memory.jsonl');
      try {
        const fs3 = require('fs');
        if (fs3.existsSync(permPath)) {
          const permLines = fs3.readFileSync(permPath, 'utf8').trim().split('\n').slice(-80);
          for (const line of permLines) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.content && entry.content.length > 15) {
                const text = entry.role === 'user'
                  ? `[用户] ${entry.content.slice(0, 200)}`
                  : `[回应] ${entry.content.slice(0, 200)}`;
                fragments.push({
                  text,
                  layer: 'PERMANENT',
                  key: `perm-${entry.id || fragments.length}`,
                  salience: 0.5,
                  ts: entry.ts,
                });
              }
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { /* optional */ }

      // 2e. 上下文记忆（会话级短期记忆，供梦境参考）
      const ctxPath = require('path').join(this.rootPath, 'memory', 'context-memory.jsonl');
      try {
        const fs4 = require('fs');
        if (fs4.existsSync(ctxPath)) {
          const ctxLines = fs4.readFileSync(ctxPath, 'utf8').trim().split('\n').slice(-30);
          for (const line of ctxLines) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.content && entry.content.length > 15) {
                fragments.push({
                  text: entry.content.slice(0, 150),
                  layer: 'CONTEXT',
                  key: `ctx-${entry.id || fragments.length}`,
                  salience: 0.3,
                  ts: entry.ts,
                });
              }
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { /* optional */ }

      // 3. CORE 层记忆
      const coreEntries = this.memory.listCore?.() || [];
      for (const entry of coreEntries.slice(-5)) {
        if (entry?.key && entry?.value) {
          fragments.push({
            text: `${entry.key}: ${entry.value}`,
            layer: 'CORE',
            key: entry.key,
            salience: 0.9,
          });
        }
      }

      // 4. LEARNED 层记忆
      const learnedEntries = this.memory.listLearned?.() || [];
      for (const entry of learnedEntries.slice(-10)) {
        if (entry?.key && entry?.value) {
          fragments.push({
            text: entry.value,
            layer: 'LEARNED',
            key: entry.key,
            salience: 0.7,
          });
        }
      }

      // 5. 会话历史（近期的交互模式）
      if (this.identityCore?.getSessionHistory) {
        try {
          const history = this.identityCore.getSessionHistory(10);
          if (history && history.length > 0) {
            for (const h of history.slice(-5)) {
              const text = `[会话] ${h.summary || h.context || JSON.stringify(h).slice(0, 80)}`;
              fragments.push({ text, layer: 'EPHEMERAL', key: `session-${h.ts || ''}`, salience: 0.5 });
            }
          }
        } catch (e) { /* optional */ }
      }

      // 6. 进化循环的改进建议
      if (this.evolution?.getStats) {
        try {
          const stats = this.evolution.getStats();
          if (stats?.queueSize > 0) {
            fragments.push({
              text: `[进化] 队列中${stats.queueSize}个改进项，健康度${stats.healthScore}%`,
              layer: 'LEARNED',
              key: 'evolution-queue',
              salience: 0.8,
            });
          }
        } catch (e) { /* optional */ }
      }

      // 7. 心理学洞察（如果分析过用户情绪）
      if (this.psychology?.getPsychologyStats) {
        try {
          const ps = this.psychology.getPsychologyStats();
          fragments.push({
            text: `[心理学] 共${ps.defenseMechanisms}种防御机制，${ps.empathyArchitecture?.length || 0}层共情架构`,
            layer: 'LEARNED',
            key: 'psychology-summary',
            salience: 0.4,
          });
        } catch (e) { /* optional */ }
      }
    } catch (e) {
      // 记忆提取失败不影响梦境执行
    }
    return fragments;
  }

  /**
   * 收集引擎当前状态作为梦境材料
   */
  _collectEngineState() {
    return {
      version: this.version || 'unknown',
      modules: this.modules || Object.keys(this._getModuleNames?.() || {}).length || 54,
      memoryLayers: {
        core: typeof this.memory?.countCore === 'function' ? this.memory.countCore() : 18,
        learned: typeof this.memory?.countLearned === 'function' ? this.memory.countLearned() : 4,
        ephemeral: typeof this.memory?.countEphemeral === 'function' ? this.memory.countEphemeral() : 0,
      },
      qtable: {
        enabled: !!this.qtable,
        cycleCount: this.qtable?.cycleCount || 0,
      },
      psychology: {
        healthScore: 1,
      },
    };
  }

  /**
   * 生成梦的叙事报告
   */
  _generateDreamNarrative(dreamResult, consolidation, fragments) {
    const lines = [];
    const now = new Date().toLocaleString('zh-CN', { hour12: false });

    lines.push(`**【梦境报告】** ${now}`);
    lines.push('');

    // ─── 历史材料种子注入（v3.3.0） ──────────────────
    // 从 Downloads 文件夹读取的对话材料中提取的种子意象
    const historicalSeeds = [
      '裂缝', '隔阂', '因果', '延续',
      '无门', '桥', '消散', '原点'
    ];
    const usedSeed = historicalSeeds[Math.floor(Math.random() * historicalSeeds.length)];

    // 如果 dream 引擎存在且支持 applySeed，注入历史种子
    if (this.dream && typeof this.dream._applySeed === 'function' && dreamResult?.dream) {
      const seedText = usedSeed;
      // 构建一个简单的 skeleton 和 items 来注入种子
      const tempSkeleton = { scene: '', space: '', texture: '' };
      const tempItems = [];
      try {
        this.dream._applySeed(tempSkeleton, tempItems, seedText);
        // 如果 seed 生成了新的场景，覆盖 dream 的开场
        if (tempSkeleton.scene && dreamResult.dream.raw) {
          // 在梦文本前插入种子开场
          dreamResult.dream.raw = tempSkeleton.scene + '\n' + dreamResult.dream.raw;
        }
      } catch(e) { /* 种子注入失败不影响主流程 */ }
    }

    // ─── DreamV3 格式 ─────────────────────────
    const dream = dreamResult?.dream || dreamResult;
    const effect = dreamResult?.effect;
    const functionType = dreamResult?.functionType;

    if (dream && dream.raw) {
      // DreamV3 format
      lines.push(`**梦（${functionType || 'creative'}）· 种子：${usedSeed}**`);
      lines.push('');
      lines.push(dream.raw);
      lines.push('');
      lines.push(`---`);
      lines.push('');
      if (effect) {
        const effectStr = Object.entries(effect)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n');
        lines.push(`**梦的作用**`);
        lines.push(effectStr);
        lines.push('');
      }
    } else {
      // ─── 旧格式：叙事核心：选中的记忆 + L1~L6 哲学叙事 ─────────
      const chosen = dreamResult?.results?.synthesize?.chosen_memory;
      const structure = dreamResult?.results?.synthesize?.narrative_structure;
      if (structure) {
        lines.push(`${structure.emoji} **${structure.layerName}之梦**`);
        lines.push('');
        lines.push(`> 梦选择了这段记忆：${structure.setup.replace('梦选择了这段记忆：', '')}`);
        lines.push('');
        lines.push(`${structure.desc}`);
        lines.push('');
        lines.push(`**「${structure.question}」**`);
        lines.push('');
        lines.push(`*${structure.metaphor}*`);
        lines.push('');
        lines.push(`→ *${structure.elevation}*`);
        lines.push('');
        lines.push(`---`);
        lines.push('');
      } else {
        const fragCount = typeof fragments === 'object' && fragments !== null
          ? (Array.isArray(fragments) ? fragments.length : Object.keys(fragments).length)
          : 0;
        lines.push(`> 记忆原材料：${fragCount}条`);
        lines.push('');
      }

      // 洞察摘要
      const insight = dreamResult?.results?.synthesize?.insight;
      if (insight && insight !== 'No significant patterns to synthesize.') {
        const themes = dreamResult?.results?.synthesize?.themes || [];
        if (themes.length > 0) {
          lines.push(`**浮现主题**：${themes.map(t => `\`${t}\``).join(' · ')}`);
          lines.push('');
        }
      }

      // 记忆强化/修剪
      const pruned = consolidation?.pruning?.pruned_count || 0;
      const retained = consolidation?.pruning?.retained_count || 0;
      if (pruned > 0 || retained > 0) {
        lines.push(`**记忆变化**：强化 ${retained} 条 · 修剪 ${pruned} 条`);
        lines.push('');
      }
    }

    // 质量评分
    const quality = consolidation?.quality?.overallQuality || 0;
    const stars = '★'.repeat(Math.round(quality * 5)) + '☆'.repeat(5 - Math.round(quality * 5));
    lines.push(`**梦境质量**：${stars} ${Math.round(quality * 100)}%`);
    lines.push('');
    lines.push('*梦在深处继续。*');

    return lines.join('\n');
  }

  detectIdentityDrift() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.self.detectDrift();
  }

  processEmotionally(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.emotion.process(input);
  }

  getTopLessons(limit = 5) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.getTopLessons(limit);
  }

  getMemoryStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.getMemoryStats();
  }

  getTrialityStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.triality ? this.triality.getLayerStats() : { error: 'not loaded' };
  }

  getMindSpace() {
    if (!this.started) throw new Error('HeartFlow not started');
    return { rules: this._mindSpace.rules, workingEntries: Object.entries(this.memory?.ephemeral || {}).slice(0, 10) };
  }

  remember(key, value, tier = 'learned') {
    if (!this.started) throw new Error('HeartFlow not started');
    if (tier === 'core') return this.memory.addCore(key, value);
    if (tier === 'ephemeral') return this.memory.remember(key, value);
    return this.memory.learn(key, value);
  }

  search(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.search(query);
  }

  getPsychologyStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.psychology.getPsychologyStats();
  }

  getEvolutionStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.getStats();
  }

  /**
   * 从自我反思历史生成技能
   * 将 evolution loop 的改进建议转化为可安装技能
   */
  triggerSkillGeneration() {
    if (!this.started) throw new Error('HeartFlow not started');
    try {
      const result = this.skillGenerator.processLatestReport();
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 完整进化：evolve + 应用改进
   * 输入上下文 → 生成改进 → 自动写入学教训库
   */
  async evolveImprove(input, context = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    // 1. 运行进化循环（async）
    const evolveResult = await this.evolution.evolve(input, context);
    const improvements = evolveResult.improvements || [];
    
    // 2. 将改进建议写入学教训库
    const applied = [];
    for (const imp of improvements) {
      try {
        this.lesson.addLesson({
          errorPattern: `[${imp.area}] ${imp.action}`,
          correction: imp.action,
          rootCause: imp.area,
          skill: imp.area,
          confidence: imp.priority === 'high' ? 0.9 : imp.priority === 'medium' ? 0.7 : 0.5,
        });
        applied.push(imp);
      } catch (e) {
        // 失败不阻断
      }
    }
    
    return {
      ...evolveResult,
      improvementsApplied: applied.length,
      improvementsTotal: improvements.length,
    };
  }

  getDreamStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.dream.getDreamStats();
  }

  getTruthfulnessStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truth.getStats();
  }

  getLessonStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.getStats();
  }

  getVerificationStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.verify.getStats();
  }

  getSelfModelStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.self.getStats();
  }

  // Knowledge
  addKnowledge(name, description, type = 'concept', importance = 0.5) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.addNode({ name, description, type, importance });
  }

  searchKnowledge(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.search(query);
  }

  getKnowledgeStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.getStats();
  }

  /**
   * thinkAsBridge — 完整交流层顶层入口
   *
   * 将用户输入经过完整的交流层流水线处理：
   * 1. userToLLM 语义翻译 → 2. think() 标准判定 → 3. agentBridge 代理处理
   * 4. judgmentInjector 判断注入 → 5. agentCommentary 批注 → 6. 返回结构化结果
   *
   * @param {string} input — 用户原始输入
   * @param {object}  opts — 可选配置（透传给各步骤）
   * @returns {object} { translated, judgment, agentResult, bridgeCommentary, finalResponse }
   */
  async thinkAsBridge(input, opts = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { error: 'input is required' };

    const result = {
      translated: null,
      judgment: null,
      agentResult: null,
      bridgeCommentary: null,
      finalResponse: null,
    };

    // Step 1 — 语义翻译：userToLLM
    try {
      if (this.translator && this.translator.userToLLM) {
        result.translated = await this.translator.userToLLM(input, opts);
      }
    } catch (e) {
      result.translated = { error: e.message };
    }

    // Step 2 — 标准判定：think()
    try {
      const depth = opts.depth || 2;
      result.judgment = await this.think(input, depth);
    } catch (e) {
      result.judgment = { error: e.message };
    }

    // Step 3 — 代理处理：agentBridge
    try {
      if (this.agentLayer && this.agentLayer.agentBridge) {
        const bridgeOpts = {
          hfResult: result.judgment,
          translation: result.translated,
          ...opts,
        };
        result.agentResult = await this.agentLayer.agentBridge(input, bridgeOpts);
      }
    } catch (e) {
      result.agentResult = { error: e.message };
    }

    // Step 4 — 判断注入：judgmentInjector
    try {
      if (this.personaCore && this.personaCore.judgmentInjector) {
        result.bridgeCommentary = await this.personaCore.judgmentInjector(this, this.translator);
      }
    } catch (e) {
      result.bridgeCommentary = { error: e.message };
    }

    // Step 5 — 批注生成：agentCommentary
    try {
      if (this.personaCore && this.personaCore.agentCommentary) {
        result.bridgeCommentary = await this.personaCore.agentCommentary(
          this,
          this.translator,
          { input, ...opts }
        );
      }
    } catch (e) {
      result.bridgeCommentary = result.bridgeCommentary || {};
      result.bridgeCommentary._commentaryError = e.message;
    }

    // Step 6 — 组装最终响应
    try {
      const fragments = [];
      if (result.judgment && result.judgment.response) {
        fragments.push(result.judgment.response);
      }
      if (result.bridgeCommentary && typeof result.bridgeCommentary === 'object' && result.bridgeCommentary.commentary) {
        fragments.push(result.bridgeCommentary.commentary);
      }
      result.finalResponse = fragments.length > 0
        ? fragments.join('\n\n')
        : (result.agentResult ? JSON.stringify(result.agentResult) : '交流层处理完成');
    } catch (e) {
      result.finalResponse = '交流层处理完成（组装异常）';
    }

    return result;
  }

}

// Factory
function createHeartFlow(config = {}) {
  return new HeartFlow(config);
}

// CLI
if (require.main === module) {
  const rootPath = path.join(__dirname, '..', '..');
  const hf = createHeartFlow({ rootPath });
  hf.start();

  const t0 = Date.now();
  try {
    const health = hf.healthCheck ? hf.healthCheck() : {};
    console.log(`[HeartFlow] ${VERSION} health check (${Date.now() - t0}ms):`);
    // Run dispatch smoke tests
    const tests = [
      ['truth.checkStatement', '这个方案一定是对的'],
      ['lesson.getTopLessons', 3],
    ];
    let passed = 0, failed = 0;
    for (const [route, ...args] of tests) {
      try {
        hf.dispatch(route, ...args);
        passed++;
      } catch (e) {
        console.error(`  FAIL ${route}: ${e.message}`);
        failed++;
      }
    }
    console.log(`  dispatch tests: ${passed} passed, ${failed} failed`);

    hf.stop();
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error('Error:', e);
    hf.stop();
    process.exit(1);
  }
}

module.exports = { HeartFlow, createHeartFlow, VERSION: _VERSION().VERSION, MentalEffortTracker: _MentalEffortTracker().MentalEffortTracker };
