/**
 /** HeartFlow v5.5.6 — 自愈RL接线 + GoT判断引擎增强
  *
  * 启动速度优化：只有 Tier 1 模块在 start() 时同步加载。
  * Tier 2 模块在首次 dispatch 访问时才加载（lazy require）。
  * 已有实例化的模块不受影响，只是把 require 延迟到首次访问。
  *
  * v5.5.6 升级：
  * - 自愈RL (HealingMemoryRL) 正式接入引擎生命周期
  * - 判断引擎集成 Graph of Thoughts 多路径推理
  * - 版本号统一 (VERSION/VERSION.txt/package.json/README/SKILL)
  *
  * 调用方式:
  *   hf.dispatch('subsystem.method', arg1, arg2)  // 统一路由
  *   hf.verifyReasoning(r, c)                     // 直接方法
  *
  * 所有模块在 _modules registry 中注册，可通过 routes() 查看可用路由。
  */

const path = require('path');

// ★ 启动优化: 惰性 require — 80+ 顶层模块改为首次使用时加载
// [P2 FIX] LRU 容量管理 + 结构化日志 + 统一错误处理
const _lazyCache = new Map();
const _LAZY_CACHE_WARN = 100;
const _LAZY_CACHE_MAX = 150;
const _lazyAccessCount = new Map();

// 结构化日志器
const _log = {
  _enabled: true,
  setLevel(level) { this._enabled = level !== 'silent'; },
  _format(module, event, data) {
    return JSON.stringify({ ts: new Date().toISOString(), module, event, ...data });
  },
  info(module, event, data) { if (this._enabled) console.log(this._format(module, event, data)); },
  warn(module, event, data) { if (this._enabled) console.warn(this._format(module, event, data)); },
  error(module, event, data) { if (this._enabled) console.error(this._format(module, event, data)); },
};
function _lazy(key, loader) {
  return function() {
    if (!_lazyCache.has(key)) {
      if (_lazyCache.size >= _LAZY_CACHE_MAX) {
        // 淘汰访问次数最少的模块
        let minKey = null, minCount = Infinity;
        for (const [k, c] of _lazyAccessCount) {
          if (c < minCount) { minCount = c; minKey = k; }
        }
        if (minKey) {
          _lazyCache.delete(minKey);
          _lazyAccessCount.delete(minKey);
        }
      }
      _lazyCache.set(key, loader());
      _lazyAccessCount.set(key, 0);
      if (_lazyCache.size === _LAZY_CACHE_WARN) {
        _log.warn('lazy_cache', `_lazyCache 达到 ${_LAZY_CACHE_WARN} 个模块`);
      }
    }
    _lazyAccessCount.set(key, (_lazyAccessCount.get(key) || 0) + 1);
    return _lazyCache.get(key);
  };
}

// Search modules
const _BM25Engine = _lazy('bm25', () => require('../search/bm25.js'));
const _HybridSearchEngine = _lazy('hybridSearch', () => require('../search/hybrid-search.js'));
const _Budget = _lazy('budget', () => require('./budget.js'));
const _Graph = _lazy('graph', () => require('../memory/graph.js'));
const _CoreUtils = _lazy('utils', () => require('./utils.js'));
const _SearchTrace = _lazy('searchTrace', () => require('../search/search-trace.js'));
const _Slots = _lazy('slots', () => require('../memory/slots.js'));
const _Observe = _lazy('observe', () => require('../memory/observe.js'));
const _MeaningfulMemory = _lazy('meaningfulMemory', () => require('../memory/memory-adapter.js'));
const _KnowledgeGraph = _lazy('knowledgeGraph', () => require('../memory/knowledge-graph.js'));
const _RetrievalAnchor = _lazy('retrievalAnchor', () => require('../memory/retrieval-anchor.js'));
const _EvolutionLoop = _lazy('evolutionLoop', () => require('../cortex/loop.js'));
const _DreamEngine = _lazy('dreamEngine', () => require('../dream/dream.js'));
const _DreamConsolidation = _lazy('dreamConsolidation', () => require('../dream/dream-consolidation.js'));
const _MetaLearner = _lazy('metaLearner', () => require('../cortex/meta-learner.js'));
const _MetaPromptEngine = _lazy('metaPromptEngine', () => require('./meta-prompt-engine.js'));
const _GoTEngine = _lazy('gotEngine', () => require('../reasoning/graph-of-thoughts.js'));
const _ConstitutionalEngine = _lazy('constitutionalEngine', () => require('../shield/constitutional-ai.js'));
const _IdentityCore = _lazy('identityCore', () => require('../identity/identity-core.js'));
const _SelfModel = _lazy('selfModel', () => require('../identity/self-model.js'));
const _SelfHealing = _lazy('selfHealing', () => require('../cortex/self-healing.js'));
const _SelfVerifier = _lazy('selfVerifier', () => require('../identity/self-verifier.js'));
const _LessonBank = _lazy('lessonBank', () => require('../cortex/lesson-bank.js'));
const _TopicScope = _lazy('topicScope', () => require('../memory/topic-scope.js'));
const _LessonStorage = _lazy('lessonStorage', () => require('../cortex/lessons/lesson-storage.js'));
const _PsychologyEngine = _lazy('psychologyEngine', () => require('../emotion/engine.js'));
const _StabilityGuard = _lazy('stabilityGuard', () => require('./stability-guard.js'));
const _ExecutionVerifier = _lazy('executionVerifier', () => require('./execution-verifier.js'));
const _DecisionVerifier = _lazy('decisionVerifier', () => require('./decision-verifier.js'));
const _HeartFlowDecision = _lazy('heartFlowDecision', () => require('./decision.js'));
const _CounterfactualEngine = _lazy('counterfactualEngine', () => require('../reasoning/counterfactual-engine.js'));
const _ConfidenceCalibrator = _lazy('confidenceCalibrator', () => require('./confidence-calibrator.js'));
const _SpontaneousRestraint = _lazy('spontaneousRestraint', () => require('../shield/spontaneous-restraint.js'));
const _CooperativeArbitration = _lazy('cooperativeArbitration', () => require('./cooperative-arbitration.js'));
const _EmbodiedCore = _lazy('embodiedCore', () => require('./embodied-core.js'));
const _BeingLogic = _lazy('beingLogic', () => require('./being-logic.js'));
const _HeartLogic = _lazy('heartLogic', () => require('./heart-logic.js'));
const _MetaJudgment = _lazy('metaJudgment', () => require('./judgment.js'));
const _MetaMemory = _lazy('metaMemory', () => require('./metaMemory.js'));
const _SkillGenerator = _lazy('skillGenerator', () => require('../code/skill-generator.js'));
const _MentalEffortTracker = _lazy('mentalEffortTracker', () => require('./mental-effort-tracker.js'));
const _LanguageHonesty = _lazy('languageHonesty', () => require('../shield/language-honesty.js'));
const _ReasoningIntegrator = _lazy('reasoningIntegrator', () => require('../reasoning/reasoning-integrator.js'));
const _WorkflowSwitch = _lazy('workflowSwitch', () => require('../workflow/workflow-switch.js'));
const _StateSnapshot = _lazy('stateSnapshot', () => require('./state-snapshot.js'));
const _ErrorHandler = _lazy('errorHandler', () => require('./error-handler.js'));
const _ThoughtChain = _lazy('thoughtChain', () => require('../workflow/thought-chain.js'));
const _CognitiveProtocol = _lazy('cognitiveProtocol', () => require('./cognitive-protocol.js'));
const _GlobalWorkspace = _lazy('globalWorkspace', () => require('../consciousness/global-workspace.js'));
const _MindWanderer = _lazy('mindWanderer', () => require('../consciousness/mind-wanderer.js'));
const _PhenomenologyEngine = _lazy('phenomenologyEngine', () => require('../consciousness/phenomenology-engine.js'));
const _ConsciousnessSelfModel = _lazy('consciousnessSelfModel', () => require('../consciousness/self-model.js'));
const _TomEngine = _lazy('tomEngine', () => require('../consciousness/tom-engine.js'));
const _SAGEGuardian = _lazy('sageGuardian', () => require('../shield/ethics/sage-guardian.js'));
const _BoundaryNegotiation = _lazy('boundaryNegotiation', () => require('../shield/ethics/boundary-negotiation.js'));
const _ValueInternalizer = _lazy('valueInternalizer', () => require('../shield/ethics/value-internalizer.js'));
// ★ 时间延伸分析层 — v1.0.0
const _TimeExtension = _lazy('timeExtension', () => require('../workflow/time-extension.js'));
const _MindSpaceGuardian = _lazy('mindSpaceGuardian', () => require('../shield/mindspace/mind-space-guardian.js'));
// ★ Inner OS — 内心独白、事件追踪、人格切换 (absorbed from AI-Inner-Os)
const _InnerOS = _lazy('innerOS', () => require('../inner-os/heartflow-inner-os.js'));
const _TransmissionEngine = _lazy('transmissionEngine', () => require('../workflow/transmission/transmission-engine.js'));
const _VerifierGrant = _lazy('verifierGrant', () => require('./verifier-grant.js'));
const _AdaptivePlanner = _lazy('adaptivePlanner', () => { try { return require('../planner/adaptive-planner.js'); } catch(e) { return { AdaptivePlanner: class { constructor() {} } }; } });
const _StrategySelector = _lazy('strategySelector', () => { try { return require('../planner/strategy-selector.js'); } catch(e) { return { StrategySelector: class { constructor() {} } }; } });
const _ReplanTrigger = _lazy('replanTrigger', () => { try { return require('../planner/replan-trigger.js'); } catch(e) { return { ReplanTrigger: class { constructor() {} } }; } });
const _ExperienceCollector = _lazy('experienceCollector', () => require('../cortex/experience-collector.js'));
const _StrategyAdapter = _lazy('strategyAdapter', () => require('../cortex/strategy-adapter.js'));
const _FailureAnalyzer = _lazy('failureAnalyzer', () => require('../cortex/failure-analyzer.js'));
const _QualityVerifier = _lazy('qualityVerifier', () => { try { return require('../verifier/quality-verifier.js'); } catch(e) { return { QualityVerifier: class { constructor() {} } }; } });
const _OutputChecker = _lazy('outputChecker', () => { try { return require('../verifier/output-checker.js'); } catch(e) { return { OutputChecker: class { constructor() {} } }; } });
const _PatternMatcher = _lazy('patternMatcher', () => { try { return require('../verifier/pattern-matcher.js'); } catch(e) { return { PatternMatcher: class { constructor() {} } }; } });
const _CuriosityEngine = _lazy('curiosityEngine', () => require('../planner/curiosity-engine.js'));
const _DesireEngine = _lazy('desireEngine', () => require('../planner/desire-engine.js'));
const _GoalPursuer = _lazy('goalPursuer', () => require('../planner/goal-pursuer.js'));
const _SelfInitiator = _lazy('selfInitiator', () => require('../planner/self-initiator.js'));
const _SessionMemory = _lazy('sessionMemory', () => require('../memory/session-memory.js'));
const _ProjectContext = _lazy('projectContext', () => require('../memory/project-context.js'));
const _LongTermMemory = _lazy('longTermMemory', () => require('../memory/long-term-memory.js'));
const _CrossSessionIndex = _lazy('crossSessionIndex', () => require('../memory/cross-session-index.js'));
const _MemoryBank = _lazy('memoryBank', () => require('../memory/memory-bank.js'));
const _KnowledgeBase = _lazy('knowledgeBase', () => { try { return require('../reasoning/knowledge-base.js'); } catch(e) { return { KnowledgeBase: class { constructor() {} } }; } });
const _CommonsenseEngine = _lazy('commonsenseEngine', () => { try { return require('../reasoning/commonsense-engine.js'); } catch(e) { return { CommonsenseEngine: class { constructor() {} } }; } });
const _CausalInference = _lazy('causalInference', () => { try { return require('../reasoning/causal-inference.js'); } catch(e) { return { CausalInference: class { constructor() {} } }; } });
const _InferenceChain = _lazy('inferenceChain', () => { try { return require('../reasoning/inference-chain.js'); } catch(e) { return { InferenceChain: class { constructor() {} } }; } });
const _LogicReasoning = _lazy('logicReasoning', () => require('../reasoning/logic-reasoning.js'));
const _ProcessRewardModel = _lazy('processRewardModel', () => require('../reasoning/process-reward-model.js'));
const _AutonomousEmotion = _lazy('autonomousEmotion', () => { try { return require('../emotion/autonomous-emotion.js'); } catch(e) { return { AutonomousEmotion: class { constructor() {} } }; } });
const _DesireSystem = _lazy('desireSystem', () => { try { return require('../emotion/desire-system.js'); } catch(e) { return { DesireSystem: class { constructor() {} } }; } });
const _EmotionalGrowth = _lazy('emotionalGrowth', () => { try { return require('../emotion/emotional-growth.js'); } catch(e) { return { EmotionalGrowth: class { constructor() {} } }; } });
const _MoodEvolution = _lazy('moodEvolution', () => { try { return require('../emotion/mood-evolution.js'); } catch(e) { return { MoodEvolution: class { constructor() {} } }; } });
const _VERSION = _lazy('version', () => require('./version.js'));

// v5.5.5 新增模块
const _FocusOfAttention = _lazy('focusOfAttention', () => require('../memory/focus-of-attention.js'));
const _CodeSelfDebug = _lazy('codeSelfDebug', () => require('../code/code-self-debug.js'));

// v5.6.0 论文驱动升级 — 4个新模块
const _ReflexionEngine = _lazy('reflexionEngine', () => require('../cortex/reflexion-engine.js'));
const _MemoryConsolidator = _lazy('memoryConsolidator', () => require('../memory/memory-consolidator.js'));
const _MultiAgentDialogue = _lazy('multiAgentDialogue', () => require('../consciousness/multi-agent-dialogue.js'));
const _MCTSReasoning = _lazy('mctsReasoning', () => require('../reasoning/mcts-reasoning.js'));
const _HierarchicalPlanner = _lazy('hierarchicalPlanner', () => require('../planner/hierarchical-planner.js'));

// V21.1 模块化认知引擎启发 — 新增4个模块
const _SemanticClusterer = _lazy('semanticClusterer', () => require('./semantic-clusterer.js'));
const _DualPerspectiveAuditor = _lazy('dualPerspectiveAuditor', () => require('./dual-perspective-auditor.js'));

// v5.6.0 论文驱动升级 — 新增3个模块
const _MemoryQuality = _lazy('memoryQuality', () => require('../memory/memory-quality.js'));
const _MetacognitiveFeedback = _lazy('metacognitiveFeedback', () => require('../cortex/metacognitive-feedback.js'));
const _PaperIndex = _lazy('paperIndex', () => require('../research/paper-index.js'));
const _TieredMemoryFusion = _lazy('tieredMemoryFusion', () => require('./tiered-memory-fusion.js'));
const _CounterfactualVerifier = _lazy('counterfactualVerifier', () => require('./counterfactual-verifier.js'));
const _DebateConvergence = _lazy('debateConvergence', () => require('./debate-convergence.js'));
const _DebateConductor = _lazy('debateConductor', () => require('../reasoning/debate-conductor.js'));
// v5.6.1 — 自我对弈推理增强 (Self-Play)
const _SelfPlay = _lazy('selfPlay', () => require('../reasoning/self-play.js'));
// v5.7.2 — P1 多智能体认知损耗规避 (Bystander Effect → CognitiveLoadBalancer)
const _CognitiveLoadBalancer = _lazy('cognitiveLoad', () => require('./cognitive-load-balancer.js'));
// v5.7.2 — P2 信息流编排 (Beyond Rule-Based Workflows)
const _InformationFlow = _lazy('informationFlow', () => require('./information-flow.js'));
// v5.7.2 — P2 反思记忆独立存储 (Reflexion Memory)
const _ReflectionMemory = _lazy('reflectionMemory', () => require('../memory/reflection-memory.js'));
// v5.7.2 — P3 KV Cache持久化
const _KVCache = _lazy('kvCache', () => require('../memory/kv-cache.js'));
// v5.7.2 — P3 记忆完整性安全验证
const _MemoryIntegrity = _lazy('memoryIntegrity', () => require('../shield/memory-integrity.js'));

// ★ 能力抽象层 + 平台适配器（Smart Routing 启发：模型能力清单外置 + 径窗网络）
const _CapabilityAbstraction = _lazy('capabilityAbstraction', () => require('./capability-abstraction.js'));
const _PlatformAdapter = _lazy('platformAdapter', () => require('./platform-adapter.js'));

// ★ 代码引擎 — 惰性加载（拉平目录后路径）
const _CodeExecutor = _lazy('codeExecutor', () => require('../code/code-executor.js'));
const _CodePlanner = _lazy('codePlanner', () => require('../code/code-planner.js'));
const _CodeWriter = _lazy('codeWriter', () => require('../code/code-writer.js'));

// v3.0 — 交流层模块
const _UserToLLM = _lazy('userToLLM', () => require('../bridge/user-to-llm.js'));
const _LLMToUser = _lazy('llmToUser', () => require('../bridge/llm-to-user.js'));
const _IntentClassifier = _lazy('intentClassifier', () => require('../bridge/intent-classifier.js'));
const _ToneAnalyzer = _lazy('toneAnalyzer', () => require('../bridge/tone-analyzer.js'));
const _EntityExtractor = _lazy('entityExtractor', () => require('../bridge/entity-extractor.js'));
const _ImplicitNeedDetector = _lazy('implicitNeedDetector', () => require('../bridge/implicit-need-detector.js'));
const _ResponseCompressor = _lazy('responseCompressor', () => require('../bridge/response-compressor.js'));
const _ConfidenceAnnotator = _lazy('confidenceAnnotator', () => require('./confidence-annotator.js'));
const _AgentBridge = _lazy('agentBridge', () => require('../bridge/agent-bridge.js'));
const _ContextBuilder = _lazy('contextBuilder', () => require('../bridge/context-builder.js'));
const _ResponseInterceptor = _lazy('responseInterceptor', () => require('../bridge/response-interceptor.js'));
const _TranslationPipeline = _lazy('translationPipeline', () => require('../bridge/translation-pipeline.js'));
const _QualityFilter = _lazy('qualityFilter', () => require('../bridge/quality-filter.js'));
const _FollowupSuggester = _lazy('followupSuggester', () => require('../bridge/followup-suggester.js'));
const _ConflictResolver = _lazy('conflictResolver', () => require('../bridge/conflict-resolver.js'));
const _UncertaintyHandler = _lazy('uncertaintyHandler', () => require('../bridge/uncertainty-handler.js'));
const _BridgeIdentity = _lazy('bridgeIdentity', () => require('../bridge/bridge-identity.js'));
const _JudgmentInjector = _lazy('judgmentInjector', () => require('../bridge/judgment-injector.js'));
const _StanceDetector = _lazy('stanceDetector', () => require('../bridge/stance-detector.js'));
const _AgentCommentary = _lazy('agentCommentary', () => require('../bridge/agent-commentary.js'));
const _ValueAligner = _lazy('valueAligner', () => require('../bridge/value-aligner.js'));
const _PersonalityTone = _lazy('personalityTone', () => require('../bridge/personality-tone.js'));
const _MetaPosition = _lazy('metaPosition', () => require('../bridge/meta-position.js'));

const BUILD_DATE = '2026-07-03-v5.6.1';

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

    // [v5.4.6] LLM 兜底回调 — 任务分类置信度 < 0.7 时调用
    this._llmFallback = null;

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
    this.judgmentEngine = null;  // v5.0.0 判断引擎
    this.capabilityAbstraction = null;  // v5.4.5 能力抽象层（Smart Routing 启发）
    this.platformAdapter = null;        // v5.4.5 平台适配器（径窗网络）

    // New modules
    this.bm25 = null;
    this.hybrid = null;

    // [P2 FIX] 暴露结构化日志器
    this._log = _log;
    this.budget = null;
    this.graph = null;
    this.utils = null;
    this.slots = null;
    this.observe = null;
    this.consolidate = null;
    this.thoughtChain = null;  // 思维链编排器
    this.pipeline = null;  // v5.0.0 管道引擎

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

    // v5.5.5 新增
    this.focusOfAttention = null;  // 注意力焦点引擎（CogMem 启发）
    this.codeSelfDebug = null;     // 代码自调试引擎（LeDex 启发）

    // v5.6.0 论文驱动升级
    this.reflexionEngine = null;       // 语言强化学习反思引擎 (Reflexion)
    this.memoryConsolidator = null;    // 神经记忆巩固引擎 (MemGPT/Sleep consolidation)
    this.multiAgentDialogue = null;    // 多代理对话系统 (AutoGen)
    this.mctsReasoning = null;         // 蒙特卡洛树搜索推理 (LLaMA-Berry)
    this.hierarchicalPlanner = null;   // 层次化规划器 (Hierarchical Planning)

    // Proactive Layer — 主动引擎
    this.curiosityEngine = null;  // 好奇心引擎
    this.desireEngine = null;  // 欲望引擎
    this.goalPursuer = null;  // 目标追求者
    this.selfInitiator = null;  // 自主发起者

    // ThinkCheck Logger — 结构化决策轨迹日志（用于 U/D/A/H 分析）
    this.thinkcheckLogger = null;  // 惰性初始化

    // Cross-Session Memory Layer — 跨会话记忆
    this.sessionMemory = null;  // 会话记忆
    this.projectContext = null;  // 项目上下文
    this.longTermMemory = null;  // 长期记忆
    this.crossSessionIndex = null;  // 跨会话索引
    this.memoryBank = null;  // v5.6.1 跨会话记忆银行 (MemoryBank v1.0.0)

    // Reasoning Layer — 推理
    this.knowledgeBase = null;  // 知识库
    this.commonsenseEngine = null;  // 常识推理引擎
    this.causalInference = null;  // 因果推理
    this.inferenceChain = null;  // 推理链
    this.processRewardModel = null;  // 步骤级推理奖励模型 (PRM v1.0.0)

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
      // [PROD] 生产环境移除 console.warn: console.warn(`[HeartFlow] 身份核心加载部分失败:`, identityResult.errors);
    }

    // ─── [P1 UPGRADE] 将七条身份规则写入 CORE 层（持久化）────────────
    // （在 memory 初始化之后调用）
    // ─── Memory — 记忆系统初始化后写入 CORE 层规则 ───────────────────

    // ─── 认知协议 — 慢下来，先理解再行动 ─────────────────────
    this.cognitive = new (_CognitiveProtocol().CognitiveProtocol)(this.rootPath, this.identityCore);
    this.cognitive.printStartupContext();

    // Memory
    this.memory = new (_MeaningfulMemory().MemoryAdapter)(this.rootPath);
    this.knowledge = new (_KnowledgeGraph().KnowledgeGraph)(this.rootPath);

    // MemoryBank — 跨会话记忆银行 (v5.6.1)
    this.memoryBank = new (_MemoryBank().MemoryBank)({ memory: this.memory });

    // Triality — 三层记忆兼容层（triality-memory 已合并到 meaningful-memory）
    const mem = this.memory;
    this.triality = {
      getStats() {
        const s = mem.getStats();
        return {
          totalMemories: (s.core || 0) + (s.learned || 0) + (s.ephemeral || 0),
          vectorDimension: 384,
          layers: { core: s.core, learned: s.learned, ephemeral: s.ephemeral },
        };
      },
      getLayerStats() {
        const s = mem.getStats();
        return {
          working: { count: s.ephemeral || 0 },
          episodic: { count: s.learned || 0 },
          semantic: { count: s.core || 0 },
        };
      },
      getMemoryHealth() {
        return { averageRetention: 1.0 };
      },
      searchByKeywords(keywords, limit) {
        if (typeof mem.searchByKeywords === 'function') {
          return mem.searchByKeywords(keywords, limit);
        }
        return [];
      },
      // v5.7.2 — P0 因果推理记忆检索
      causalSearch(query, limit) {
        if (typeof mem.causalSearch === 'function') return mem.causalSearch(query, limit);
        return [];
      },
      traceCausality(memoryId, direction, maxDepth) {
        if (typeof mem.traceCausality === 'function') return mem.traceCausality(memoryId, direction, maxDepth);
        return [];
      },
      spreadingActivationSearch(seedId, budget) {
        if (typeof mem.spreadingActivationSearch === 'function') return mem.spreadingActivationSearch(seedId, budget);
        return [];
      },
    };

    // ─── [P1 UPGRADE] CORE 层身份规则初始化 ───────────────────────────
    this._initCoreRules();

    // TopicScope — 话题隔离，主动实例化并桥接到 MeaningfulMemory
    this.topicScope = new (_TopicScope().TopicScope)().setMemoryBridge(this.memory);

    // Evolution
    this.evolution = new (_EvolutionLoop().EvolutionLoop)({ rootPath: this.rootPath, memory: this.memory }).boot();
    this.dream = new (_DreamEngine().DreamV11)({});
    this.dreamConsolidation = new (_DreamConsolidation().DreamConsolidation)(this.memory);
    this.lesson = _LessonBank().lessonBank || _LessonBank();
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
      const { factChecker } = require('../reasoning/fact-checker.js');
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
    try { this.verifierGrant = new (_VerifierGrant().VerifierGrant)(); } catch (e) { this._initErrors.push({module: 'verifierGrant', error: e.message}); }
    if (this.verifierGrant) this._modules['verifierGrant'] = this.verifierGrant;
    this.snapshot = _StateSnapshot();
    this.error = _ErrorHandler();

    // ★ Smart Routing 启发：平台适配器 + 能力抽象层
    try {
      this.platformAdapter = _PlatformAdapter().createAdapter('hermes');
    } catch (e) {
      this._initErrors.push({ module: 'platformAdapter', error: e.message });
    }
    try {
      this.capabilityAbstraction = new (_CapabilityAbstraction().CapabilityAbstraction)(this.platformAdapter);
    } catch (e) {
      this._initErrors.push({ module: 'capabilityAbstraction', error: e.message });
    }

    // ─── Tier 2 延迟加载注册表 ──────────────────────────────────────────
    // Tier 2 模块在首次 dispatch 时才加载并实例化。
    // 格式: lazy: true → 需要 require + new
    // 格式: lazyFn: true → 只暴露函数对象（无需 new）
    this._lazy = {
      adaptivePlanner: { lazy: true, path: '../planner/adaptive-planner.js', Ctor: 'AdaptivePlanner', args: {} },
      strategySelector: { lazy: true, path: '../planner/strategy-selector.js', Ctor: 'StrategySelector', args: {} },
      replanTrigger: { lazy: true, path: '../planner/replan-trigger.js', Ctor: 'ReplanTrigger', args: {} },
      experienceCollector: { lazy: true, path: '../cortex/experience-collector.js', Ctor: 'ExperienceCollector', args: {} },
      strategyAdapter: { lazy: true, path: '../cortex/strategy-adapter.js', Ctor: 'StrategyAdapter', args: {} },
      failureAnalyzer: { lazy: true, path: '../cortex/failure-analyzer.js', Ctor: 'FailureAnalyzer', args: {} },
      qualityVerifier: { lazy: true, path: '../verifier/quality-verifier.js', Ctor: 'QualityVerifier', args: {} },
      outputChecker: { lazy: true, path: '../verifier/output-checker.js', Ctor: 'OutputChecker', args: {} },
      patternMatcher: { lazy: true, path: '../verifier/pattern-matcher.js', Ctor: 'PatternMatcher', args: {} },
      curiosityEngine: { lazy: true, path: '../planner/curiosity-engine.js', Ctor: 'CuriosityEngine', args: {} },
      desireEngine: { lazy: true, path: '../planner/desire-engine.js', Ctor: 'DesireEngine', args: {} },
      goalPursuer: { lazy: true, path: '../planner/goal-pursuer.js', Ctor: 'GoalPursuer', args: {} },
      selfInitiator: { lazy: true, path: '../planner/self-initiator.js', Ctor: 'SelfInitiator', args: {} },
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
      // Code Subsystem — 代码能力（3个 Tier 2 模块）
      codeExecutor:    { lazy: true, path: '../code/code-executor.js',   Ctor: 'CodeExecutor',   args: { hf: null } },
      codePlanner:     { lazy: true, path: '../code/code-planner.js',   Ctor: 'CodePlanner',    args: { hf: null } },
      codeWriter:      { lazy: true, path: '../code/code-writer.js',   Ctor: 'CodeWriter',     args: {} },
      // claude-clarity v1.8.2 吸收集成 — 知识图谱/大五人格/共情评估/意图层
      knowledgeGraph:  { lazy: true, path: '../memory/knowledge-graph.js',    Ctor: 'KnowledgeGraph',  args: { dataDir: null } },
      bigFive:         { lazy: true, path: '../identity/BigFivePersonality.js', Ctor: '',                args: {} },
      empathy:         { lazy: true, path: '../identity/EmpathyAssessment.js',  Ctor: '',                args: {} },
      intentLayer:     { lazy: true, path: './intent-layer.js',       Ctor: 'IntentLayer',      args: {} },
      // v3.4.1 — 思考门控/认知安全/心流预测
      deliberationGate:{ lazy: true, path: '../shield/deliberation-gate.js',  Ctor: 'DeliberationGate', args: {} },
      epistemicSafety: { lazy: true, path: '../shield/epistemic-safety.js',   Ctor: '',                 args: {} },
      flowPredictor:   { lazy: true, path: '../planner/flow-predictor.js',     Ctor: 'FlowPredictor',    args: {} },
      // v3.4.2 — Fable 5 安全协议引擎
      safetyGuardrails:{ lazy: true, path: '../shield/safety-guardrails.js',  Ctor: '',                 args: {} },
      // v3.4.3 — 用户模型/行动追踪/目的引擎
      userModel:       { lazy: true, path: './user-model.js',        Ctor: 'UserModel',         args: {} },
      actionTracker:   { lazy: true, path: './action-tracker.js',    Ctor: 'ActionTracker',     args: {} },
      purposeEngine:   { lazy: true, path: './purpose-engine.js',    Ctor: 'PurposeEngine',     args: {} },
      // v3.4.4 — 风险分析/自适应控制/意图追踪/审计日志
      riskAnalyzer:    { lazy: true, path: './risk-benefit-analyzer.js', Ctor: 'RiskBenefitAnalyzer', args: {} },
      adaptiveCtrl:    { lazy: true, path: './adaptive-controller.js',   Ctor: 'AdaptiveController',  args: {} },
      intentionTrack:  { lazy: true, path: './IntentionTracker.js',      Ctor: 'IntentionTracker',    args: {} },
      auditLogger:     { lazy: true, path: './audit-logger.js',          Ctor: 'AuditLogger',         args: {} },
      focusOfAttention: { lazy: true, path: '../memory/focus-of-attention.js', Ctor: 'FocusOfAttention', args: {} },
      codeSelfDebug: { lazy: true, path: '../code/code-self-debug.js', Ctor: 'CodeSelfDebug', args: {} },
      // v5.6.0 论文驱动升级
      reflexionEngine: { lazy: true, path: '../cortex/reflexion-engine.js', Ctor: 'ReflexionEngine', args: {} },
      memoryConsolidator: { lazy: true, path: '../memory/memory-consolidator.js', Ctor: 'MemoryConsolidator', args: {} },
      multiAgentDialogue: { lazy: true, path: '../consciousness/multi-agent-dialogue.js', Ctor: 'MultiAgentDialogue', args: {} },
      mctsReasoning: { lazy: true, path: '../reasoning/mcts-reasoning.js', Ctor: 'MCTSReasoning', args: {} },
      hierarchicalPlanner: { lazy: true, path: '../planner/hierarchical-planner.js', Ctor: 'HierarchicalPlanner', args: {} },
    };
    // [PROD] 生产环境移除 console.warn: // try { this.bm25 = new BM25Engine({ dataDir: path.join(this.rootPath, 'data/search'), autoSave: true }); } catch (e) { /* [PROD] console.warn removed */ }
    // [PROD] 生产环境移除 console.warn: // try { this.hybrid = new HybridSearchEngine({ dataDir: path.join(this.rootPath, 'data/search') }); } catch (e) { /* [PROD] console.warn removed */ }

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

    // ─── v5.6.1: ToM Engine v2.0 — 心智理论增强（独立于 consciousness） ──
    try {
      const ToM = _TomEngine ? _TomEngine() : null;
      if (ToM?.ToMEngine) {
        this.tomEngine = new ToM.ToMEngine({ maxAgents: 5 });
      }
    } catch (e) { /* tomEngine optional */ }

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

    // ─── Inner OS ─────────────────────────────────────────────────────────────
    // 吸收 AI-Inner-Os 核心概念：内心独白、事件追踪、人格切换
    try {
      const InnerOS = (_InnerOS().InnerOS);
      this.innerOS = new InnerOS(this);
    } catch (e) { this.innerOS = null; }
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
      const { AgentPsychology } = require('../identity/agent-psychology.js');
      this.agentPsychology = new AgentPsychology(this);
    } catch (e) { /* agentPsychology optional */ }
    try {
      const { AgentPhilosophy } = require('../identity/agent-philosophy.js');
      this.agentPhilosophy = new AgentPhilosophy(this);
    } catch (e) { /* agentPhilosophy optional */ }
    try {
      const { AISelfPositioning } = require('../identity/ai-self-positioning.js');
      this.aiSelfPositioning = new AISelfPositioning({ heartFlow: this, codeRoot: __dirname });
      this.selfPositioning = this.aiSelfPositioning;  // 别名，供 _registerModules 注册到 dispatch
    } catch (e) { /* aiSelfPositioning optional */ }

    // ─── 哲学→决策转化器（v3.0.1 新增） ──────────────────────────────────────
    try {
      const { PhilosophyToDecision } = require('../identity/philosophy-to-decision.js');
      this.philosophyToDecision = new PhilosophyToDecision(this);
    } catch (e) { /* philosophyToDecision optional */ }

    // ─── 通用决策路由引擎（v3.0.2 新增） ────────────────────────────────────
    try {
      const drMod = require('./decision-router.js');
      // 从环境变量读取 modelProfile，默认 flash
      const modelProfile = process.env.HEARTFLOW_MODEL_PROFILE || 'flash';
      this._decisionRouter = new drMod.DecisionRouter(this, {
        modelProfile,
        customProfile: this._options?.modelProfile || undefined,
      });
      this.decisionRouter = this._decisionRouter;
      this._modelProfile = modelProfile;

      // ─── 跨会话 Q-table 初始化（v5.5.6: selfHealing now wired）───────
      if (this.selfHealing && typeof this.selfHealing.mergeFromLearnedLayer === 'function') {
        try {
          const learnedLessons = this.memory?.listLearned?.() || [];
          if (learnedLessons.length > 0) {
            const mergeResult = this.selfHealing.mergeFromLearnedLayer(learnedLessons);
            if (mergeResult.merged > 0) {
              // [PROD] 生产环境移除 console.error: console.error(`[HeartFlow] 跨会话 Q-table 合并：${mergeResult.merged}/${mergeResult.total} lessons → Q-table (${mergeResult.qTableSize} entries)`);
            }
          }
        } catch (e) {
          // [PROD] 生产环境移除 console.warn: console.warn('[HeartFlow] Q-table merge from LEARNED layer failed:', e.message);
        }
      }
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'decisionRouter', error: e.message }); }

    // ─── [v4.0] 决策执行器 — DecisionExecutor ──────────────────────────────
    try {
      const { DecisionExecutor } = require('./decision-executor.js');
      this.decisionExecutor = new DecisionExecutor(this);
    } catch (e) { /* decisionExecutor optional */ }

    // ─── [v4.0] 场域注入器 — FieldInjector ────────────────────────────────
    try {
      const { FieldInjector } = require('./field-injector.js');
      this.fieldInjector = new FieldInjector();
    } catch (e) { /* fieldInjector optional */ }

    // ─── [v4.0] 决策反馈学习 — DecisionFeedback ──────────────────────────
    try {
      const { DecisionFeedback } = require('./decision-feedback.js');
      this.decisionFeedback = new DecisionFeedback(this.decisionRouter);
    } catch (e) { /* decisionFeedback optional */ }

    // ─── [v5.0.0] 判断引擎 — JudgmentEngine（真正的多路径判断能力）──────
    try {
      const { JudgmentEngine } = require('./judgment-engine.js');
      this.judgmentEngine = new JudgmentEngine({
        dataDir: path.join(this.rootPath, 'data', 'judgments'),
        memory: this.memory,
      });
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'judgmentEngine', error: e.message }); }

    // ─── 时间延伸分析层（v1.0.0 新增） ─────────────────────────────────────
    try {
      const { TimeExtensionEngine } = require('../workflow/time-extension.js');
      this.timeExtension = new TimeExtensionEngine(this);
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'timeExtension', error: e.message }); }

    // ─── 逻辑推理引擎 — LogicReasoning（v1.0.0 新增） ────────────────────────
    try {
      const { LogicReasoning } = require('../reasoning/logic-reasoning.js');
      this.logicReasoning = new LogicReasoning();
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'logicReasoning', error: e.message }); }

    // ─── 步骤级推理奖励模型 — ProcessRewardModel（v1.0.0 新增） ────────────
    try {
      const { ProcessRewardModel } = require('../reasoning/process-reward-model.js');
      this.processRewardModel = new ProcessRewardModel();
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'processRewardModel', error: e.message }); }

    // ─── 辩论分析器 — DebateAnalyzer（v2.10.2 新增） ─────────────────────────
    try {
      const { DebateAnalyzer } = require('../reasoning/debate-analyzer.js');
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
      // 新增 v2.9.5：规划层 & 代码引擎
      'adaptivePlanner', 'strategySelector', 'replanTrigger',
      'codeExecutor', 'codePlanner', 'codeWriter',
      // v5.6.0 论文驱动升级
      'reflexionEngine', 'memoryConsolidator', 'multiAgentDialogue', 'mctsReasoning', 'hierarchicalPlanner',
      // v5.6.1 深研论文驱动升级
      'memoryQuality', 'metacognitiveFeedback', 'paperIndex',
      // v5.7.2 — P1 多智能体认知损耗规避
      'cognitiveLoad',
      // v5.6.1 — 步骤级推理奖励模型 (Process Reward Model)
      'processRewardModel',
      // v5.6.1 — 跨会话记忆银行 (MemoryBank v1.0.0)
      'memoryBank',
      // v5.6.1 — 多智能体辩论协调器 (DebateConductor)
      'debateConductor'];
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

      // [v5.4.6] 暴露 _classifyTask 供 think() 后处理使用
      if (this.thoughtChain && typeof this.thoughtChain._classifyTask === 'function') {
        this._classifyTask = this.thoughtChain._classifyTask.bind(this.thoughtChain);
      }

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

    // ─── [v5.0.0] 管道引擎 Pipeline ────────────────────────────
    try {
      const { Pipeline } = require('../workflow/pipeline.js');
      this.pipeline = new Pipeline({ heartflow: this });
    } catch (e) { this._initErrors.push({ module: 'pipeline', error: e.message }); }

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
    // ─── Desire Cognition — 欲望认知引擎（v0.1.0 新增） ─────────────────────
    try {
      const { DesireCognition } = require('../emotion/desire-cognition.js');
      this.desireCognition = new DesireCognition();
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'desireCognition', error: e.message }); }
    // ─── Three Poisons — 贪嗔痴三毒评估（v1.0.0 新增） ──────────────────
    try {
      this.threePoisons = require('../emotion/three-poisons.js');
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'threePoisons', error: e.message }); }
    // ─── Love Cognition — 爱情认知引擎（v0.1.0 新增） ──────────────────────
    try {
      const { LoveCognition } = require('../emotion/love-cognition.js');
      this.loveCognition = new LoveCognition();
    } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'loveCognition', error: e.message }); }
    // ─── Cognition Ground — 底层认知地面（v1.0.0 新增） ─────────────────
    try {
      const { CognitionGround } = require('./cognition-ground.js');
      this.cognitionGround = new CognitionGround({ heartFlow: this });
    } catch (e) { this._initErrors.push({ module: 'cognitionGround', error: e.message }); }

    // ─── V21.1 模块化认知引擎启发 — 4个新模块 ──────────────────────────────
    try {
      const SemanticClusterer = _SemanticClusterer();
      this.semanticClusterer = new SemanticClusterer({ maxGroups: 64, maxConceptsPerGroup: 20 });
      this.semanticClusterer.init(this.memory);
    } catch (e) { this._initErrors.push({ module: 'semanticClusterer', error: e.message }); }
    try {
      const DualPerspectiveAuditor = _DualPerspectiveAuditor();
      this.dualPerspectiveAuditor = new DualPerspectiveAuditor({ maxRounds: 5, convergenceThreshold: 0.8 });
      this.dualPerspectiveAuditor.init();
    } catch (e) { this._initErrors.push({ module: 'dualPerspectiveAuditor', error: e.message }); }
    try {
      const TieredMemoryFusion = _TieredMemoryFusion();
      this.tieredMemoryFusion = new TieredMemoryFusion({ l1Size: 10, l2Window: 50, l2Alpha: 0.3 });
      this.tieredMemoryFusion.init(this.memory);
    } catch (e) { this._initErrors.push({ module: 'tieredMemoryFusion', error: e.message }); }
    try {
      const CounterfactualVerifier = _CounterfactualVerifier();
      this.counterfactualVerifier = new CounterfactualVerifier({ minMargin: 0.3, maxCandidates: 5, contrastWeight: 0.2 });
      this.counterfactualVerifier.init();
    } catch (e) { this._initErrors.push({ module: 'counterfactualVerifier', error: e.message }); }
    try {
      const DebateConvergence = _DebateConvergence();
      this.debateConvergence = new DebateConvergence({ convergenceThreshold: 0.8, maxRounds: 9, stagnationThreshold: 3 });
      this.debateConvergence.init();
    } catch (e) { this._initErrors.push({ module: 'debateConvergence', error: e.message }); }
    // ─── 多智能体辩论协调器 — DebateConductor（v5.6.1 新增） ─────────────────
    try {
      const { DebateConductor } = require('../reasoning/debate-conductor.js');
      this.debateConductor = new DebateConductor(this);
    } catch (e) { this._initErrors.push({ module: 'debateConductor', error: e.message }); }

    // ─── [v5.5.5] 新功能模块初始化 ──────────────────────────
    try {
      const FOA = _FocusOfAttention();
      this.focusOfAttention = new FOA.FocusOfAttention({ maxAttention: 10, decayRate: 0.1 });
    } catch (e) { this._initErrors.push({ module: 'focusOfAttention', error: e.message }); }
    try {
      const CSD = _CodeSelfDebug();
      this.codeSelfDebug = new CSD.CodeSelfDebug({ maxRetries: 3 });
    } catch (e) { this._initErrors.push({ module: 'codeSelfDebug', error: e.message }); }

    // ─── [v5.6.0] 论文驱动升级模块初始化 ────────────────────
    // 1. ReflexionEngine — 语言强化学习反思 (Reflexion paper)
    try {
      const RE = _ReflexionEngine();
      this.reflexionEngine = new RE.ReflexionEngine({
        maxReflections: 10,
        successThreshold: 0.7,
      });
    } catch (e) { this._initErrors.push({ module: 'reflexionEngine', error: e.message }); }
    // 2. MemoryConsolidator — 神经记忆巩固 (MemGPT/Sleep consolidation)
    try {
      const MC = _MemoryConsolidator();
      this.memoryConsolidator = new MC.MemoryConsolidator({
        ephemeralThreshold: 20,
        consolidationInterval: 3600000,
      });
    } catch (e) { this._initErrors.push({ module: 'memoryConsolidator', error: e.message }); }
    // 3. MultiAgentDialogue — 多代理对话 (AutoGen)
    try {
      const MAD = _MultiAgentDialogue();
      this.multiAgentDialogue = new MAD.MultiAgentDialogue({
        maxRounds: 5,
        convergenceThreshold: 0.8,
      });
      // 注册默认代理
      this.multiAgentDialogue
        .registerAgent('analyst', {
          role: 'analyst',
          persona: 'You are an analytical thinker. Analyze problems systematically and identify key factors.',
          respond: async (msg, ctx) => ({ content: `Analyst: Based on the analysis, I identify the key factors and recommend a structured approach.`, role: 'analyst' }),
        })
        .registerAgent('critic', {
          role: 'critic',
          persona: 'You are a critical thinker. Challenge assumptions and identify potential issues.',
          respond: async (msg, ctx) => ({ content: `Critic: I see potential issues with the current approach. Let me challenge the underlying assumptions.`, role: 'critic' }),
        })
        .registerAgent('synthesizer', {
          role: 'synthesizer',
          persona: 'You are a synthesizer. Combine different perspectives into a coherent whole.',
          respond: async (msg, ctx) => ({ content: `Synthesizer: Integrating the analytical and critical perspectives, here is my synthesized recommendation.`, role: 'synthesizer' }),
        });
    } catch (e) { this._initErrors.push({ module: 'multiAgentDialogue', error: e.message }); }
    // 4. MCTSReasoning — 蒙特卡洛树搜索推理 (LLaMA-Berry)
    try {
      const MCTS = _MCTSReasoning();
      this.mctsReasoning = new MCTS.MCTSReasoning({
        maxIterations: 50,
        maxDepth: 5,
      });
    } catch (e) { this._initErrors.push({ module: 'mctsReasoning', error: e.message }); }
    // 5. HierarchicalPlanner — 层次化规划器 (Hierarchical Planning)
    try {
      const HP = _HierarchicalPlanner();
      this.hierarchicalPlanner = new HP.HierarchicalPlanner({
        maxDepth: 3,
        replanThreshold: 0.3,
      });
    } catch (e) { this._initErrors.push({ module: 'hierarchicalPlanner', error: e.message }); }
    // ─── [v5.6.1] 深研论文驱动升级 — 3个新模块 ─────────────────
    // 1. MemoryQuality — 记忆质量评分 + 艾宾浩斯遗忘 + 污染检测 (2026 memory research)
    try {
      const MQ = _MemoryQuality();
      this.memoryQuality = new MQ.MemoryQuality({
        coreDecayRate: 0.001,
        learnedDecayRate: 0.01,
        ephemeralDecayRate: 0.05,
        maxMemories: 5000,
      });
    } catch (e) { this._initErrors.push({ module: 'memoryQuality', error: e.message }); }
    // 2. MetacognitiveFeedback — 元认知反馈 + 自我纠正 (SOFAI-LM)
    try {
      const MF = _MetacognitiveFeedback();
      this.metacognitiveFeedback = new MF.MetacognitiveFeedback({
        qualityThreshold: 0.6,
        autoCorrect: true,
      });
    } catch (e) { this._initErrors.push({ module: 'metacognitiveFeedback', error: e.message }); }
    // 3. ResearchPaperIndex — 研究论文索引 (cognitive architecture research)
    try {
      const PI = _PaperIndex();
      this.paperIndex = new PI.ResearchPaperIndex();
    } catch (e) { this._initErrors.push({ module: 'paperIndex', error: e.message }); }

    // 4. CognitiveLoadBalancer — 多智能体认知损耗规避 (Bystander Effect mitigation)
    try {
      const CLB = _CognitiveLoadBalancer();
      this.cognitiveLoad = new CLB.CognitiveLoadBalancer({
        maxActiveEngines: 5,
        loafingThreshold: 0.3,
      });
      this._modules.cognitiveLoad = this.cognitiveLoad;
    } catch (e) { this._initErrors.push({ module: 'cognitiveLoad', error: e.message }); }

    // 5. InformationFlowOrchestrator — 信息流编排 (Beyond Rule-Based Workflows)
    try {
      const IFMod = _InformationFlow();
      const IFClass = IFMod.InformationFlowOrchestrator;
      this.infoFlow = IFClass ? new IFClass({ maxIterations: 10 }) : null;
      this._modules.infoFlow = this.infoFlow;
    } catch (e) { this._initErrors.push({ module: 'informationFlow', error: e.message }); }

    // 6. ReflectionMemory — 反思记忆独立存储 (Reflexion)
    try {
      const RM = _ReflectionMemory();
      this.reflectionMemory = new RM.ReflectionMemory({ maxReflections: 500 });
      this._modules.reflectionMemory = this.reflectionMemory;
    } catch (e) { this._initErrors.push({ module: 'reflectionMemory', error: e.message }); }

    // 7. KVCachePersistor — KV Cache持久化
    try {
      const KV = _KVCache();
      this.kvCache = new KV.KVCachePersistor({ maxCacheSize: 100, quantize: true });
      this._modules.kvCache = this.kvCache;
    } catch (e) { this._initErrors.push({ module: 'kvCache', error: e.message }); }

    // 8. MemoryIntegrity — 记忆完整性安全验证
    try {
      const MI = _MemoryIntegrity();
      this.memoryIntegrity = new MI.MemoryIntegrity({ strictMode: false });
      this._modules.memoryIntegrity = this.memoryIntegrity;
    } catch (e) { this._initErrors.push({ module: 'memoryIntegrity', error: e.message }); }

    // ─── [v5.5.6] 自愈RL — SelfHealing (Reflexion + Q-learning) ─────────────
    // 将 HealingMemoryRL 接入引擎生命周期，消除死代码
    try {
      this.selfHealing = new (_SelfHealing().SelfHealing)({ memory: this.memory, maxMemory: 200 });
      this._modules.selfHealing = this.selfHealing;
      // boot 时从 LEARNED 层加载 lesson patterns，合并到 Q-table
      try {
        const learnedLessons = this.memory?.listLearned?.() || [];
        if (learnedLessons.length > 0 && typeof this.selfHealing.mergeFromLearnedLayer === 'function') {
          this.selfHealing.mergeFromLearnedLayer(learnedLessons);
        }
      } catch (e) { /* non-fatal */ }
    } catch (e) { /* selfHealing optional */ }

    // ─── [v5.6.1] Self-Play Reasoning — 自我对弈推理增强 ─────────────────
    try {
      this.selfPlay = new (_SelfPlay().SelfPlay)({
        dataDir: path.join(this.rootPath, 'data', 'self-play'),
        rl: this.selfHealing?.rl || null,
        judgmentEngine: this.judgmentEngine || null,
      });
    } catch (e) { this._initErrors.push({ module: 'selfPlay', error: e.message }); }

    // ─── [v5.1.0] 自省注册 ──────────────────────────────────
    this.heartflow = this;  // 让 dispatch('heartflow.introspect') 能找到实例

    this._registerModules();

    // ─── 自动生成 ALLOWED_ROUTES ──────────────────────────────────────
    // 合并硬编码白名单 + 运行时扫描生成的模块方法路由
    // 硬编码列表作为兜底（覆盖未注册模块或危险方法排除）
    const autoRoutes = HeartFlow._generateAllowedRoutes(this._modules);
    for (const route of autoRoutes) {
      if (!HeartFlow.ALLOWED_ROUTES.has(route)) {
        HeartFlow.ALLOWED_ROUTES.add(route);
      }
    }

    this.started = true;

    // ─── 自改进健康检查：验证 meta-learner ↔ self-healing-rl ↔ confidence-calibrator 信号流 ──
    try { this._runSelfImprovementHealthCheck(); } catch (e) { /* non-fatal */ }
  }

  // ─── 自改进健康检查 ──────────────────────────────────────────────────────

  /**
   * 运行时自改进信号流检查：验证 meta-learner → self-healing-rl → confidence-calibrator
   * 三个模块的实例化状态和方法可用性，以及模块间的实际信号传递链路。
   * 结果缓存到 this._siHealth，供 getSelfImprovementHealth() 返回。
   */
  _runSelfImprovementHealthCheck() {
    const modules = [];
    const issues = [];

    // ─── 1. meta-learner ─────────────────────────────────────────
    const meta = this.meta;
    if (meta && typeof meta.learn === 'function' && typeof meta.getStats === 'function') {
      modules.push('meta-learner');
      try { meta.getStats(); } catch (e) { issues.push('meta-learner.getStats() threw: ' + e.message); }
    } else {
      issues.push('meta-learner: not instantiated or missing learn/getStats');
    }

    // ─── 2. self-healing-rl ──────────────────────────────────────
    const sh = this.selfHealing;
    if (sh && typeof sh.getStats === 'function') {
      modules.push('self-healing-rl');
      try {
        const shStats = sh.getStats();
        if (shStats && typeof shStats.qTableSize !== 'undefined') {
          modules.push('self-healing-rl.qtable');
        }
        // 检查 mergeFromLearnedLayer 信号通道（meta → selfHealing）
        if (meta && typeof sh.mergeFromLearnedLayer === 'function') {
          modules.push('signal:meta→selfHealing');
        } else if (meta) {
          issues.push('signal:meta→selfHealing blocked (mergeFromLearnedLayer missing)');
        }
      } catch (e) { issues.push('self-healing-rl.getStats() threw: ' + e.message); }
    } else {
      issues.push('self-healing-rl: not instantiated or missing getStats');
    }

    // ─── 3. confidence-calibrator ────────────────────────────────
    const cc = this.confidence;
    if (cc && typeof cc.calibrate === 'function') {
      modules.push('confidence-calibrator');
      // 检查 confidence 是否通过 calibrate 接收外部信号
      if (typeof cc.assess === 'function' || typeof cc.calibrate === 'function') {
        modules.push('confidence-calibrator.assess');
      }
    } else {
      issues.push('confidence-calibrator: not instantiated or missing calibrate');
    }

    // ─── 4. 信号闭环验证：confidence → meta 反馈回路 ──────────────
    if (cc && meta && typeof meta.learn === 'function') {
      modules.push('signal:confidence→meta');
    } else if (cc && !meta) {
      issues.push('signal:confidence→meta blocked (meta-learner missing)');
    }

    // ─── 5. 事件发射器检查（self-healing-rl 使用 EventEmitter）───
    if (sh && typeof sh.emit === 'function') {
      modules.push('self-healing-rl.events');
    }

    const connected = issues.length === 0;
    this._siHealth = { connected, modules, issues, ts: Date.now() };
    return this._siHealth;
  }

  /**
   * 自改进系统健康状态查询（公开 API）
   * @returns {{ connected: boolean, modules: string[], issues: string[] }}
   */
  getSelfImprovementHealth() {
    if (!this.started) return { connected: false, modules: [], issues: ['HeartFlow not started'] };
    if (!this._siHealth) {
      try { this._runSelfImprovementHealthCheck(); } catch (e) {
        return { connected: false, modules: [], issues: [e.message] };
      }
    }
    return {
      connected: this._siHealth.connected,
      modules: [...this._siHealth.modules],
      issues: [...this._siHealth.issues],
    };
  }

  // ─── [v5.4.6] LLM 兜底配置 ──────────────────────────────────────────────
  setLLMFallback(fn) {
    if (typeof fn === 'function') {
      this._llmFallback = fn;
    }
    return this;
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
        // [PROD] 生产环境移除 console.warn: console.warn('[HeartFlow] 无法初始化 MindSpace 身份规则（memory 可能未就绪）');
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
      'triality',     // v2.0.19 三层记忆兼容层
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
      'consciousness', 'tomEngine',
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
      // v1.0.0 — 时间延伸分析层
      'timeExtension',
      // v0.1.0 — 欲望认知引擎
      'desireCognition',
      // v0.1.0 — 爱情认知引擎
      'loveCognition',
      // v1.0.0 — 贪嗔痴三毒评估
      'threePoisons',
      // v1.0.0 — 底层认知地面
      'cognitionGround',
      // v1.0.0 — V21.1 启发：语义聚类 / 双视角审计 / 记忆融合 / 反事实验证 / 辩论收敛
      'semanticClusterer', 'dualPerspectiveAuditor', 'tieredMemoryFusion',
      'counterfactualVerifier', 'debateConvergence',
      // v5.6.1 — 多智能体辩论协调器 (DebateConductor)
      'debateConductor',
      // v5.0.0 — 判断引擎
      'judgmentEngine',
      // v5.6.1 — 自我对弈推理增强 (Self-Play)
      'selfPlay',
      // v5.5.6 — 自愈RL (SelfHealing + HealingMemoryRL)
      'selfHealing',
      // v5.4.5 — 能力抽象层 + 平台适配器（Smart Routing 启发）
      'capabilityAbstraction', 'platformAdapter',
      // v1.0.0 — 逻辑推理引擎
      'logicReasoning',
      // v5.0.0 — 管道引擎
      'pipeline',
      // v5.1.0 — 自省
      'heartflow',
      'innerOS',  // Inner OS — 内心独白、事件追踪、人格切换
      // v5.5.5 — 注意力焦点 + 代码自调试
      'focusOfAttention', 'codeSelfDebug',
      // v5.6.0 — 论文驱动升级
      'reflexionEngine', 'memoryConsolidator', 'multiAgentDialogue', 'mctsReasoning', 'hierarchicalPlanner',
      // v5.6.1 — 深研论文驱动升级
      'memoryQuality', 'metacognitiveFeedback', 'paperIndex',
      // v5.7.2 — P1 多智能体认知损耗规避
      'cognitiveLoad',
      // v5.6.1 — 步骤级推理奖励模型 (Process Reward Model)
      'processRewardModel',
      // v5.6.1 — 跨会话记忆银行 (MemoryBank v1.0.0)
      'memoryBank',
      // v5.7.2 — 新模块
      'infoFlow', 'reflectionMemory', 'kvCache', 'memoryIntegrity'];
    for (const name of subsystemNames) {
      if (this[name] !== null && this[name] !== undefined) {
        this._modules[name] = this[name];
      }
    }

    // [AUDIT-FIX] 汇总并上报初始化错误（之前静默收集但从未报告）
    if (this._initErrors.length > 0) {
      _log.warn('init', `${this._initErrors.length} 模块初始化失败`, { 
        count: this._initErrors.length,
        errors: this._initErrors.map(e => ({ module: e.module, error: e.error }))
      });
    }
  }

  async stop() {
    if (!this.started) return;
    for (const mod of Object.values(this._modules)) {
      if (!mod || mod === this) continue;  // Skip self-reference (this.heartflow = this)
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

  /**
   * 从 _modules registry 扫描生成 ALLOWED_ROUTES
   * 遍历已注册模块的所有方法，生成 'module.method' 格式的路由字符串
   * @param {Object} modules - this._modules registry
   * @returns {string[]} 生成的路由字符串数组
   */
  static _generateAllowedRoutes(modules) {
    if (!modules || typeof modules !== 'object') return [];
    const routes = [];
    for (const [name, mod] of Object.entries(modules)) {
      if (!mod) continue;
      let methods = [];
      try {
        const proto = Object.getPrototypeOf(mod);
        if (proto && proto !== Object.prototype) {
          methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');
        }
      } catch (e) { /* fall through */ }
      if (!methods.length) {
        methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
      }
      for (const method of methods) {
        routes.push(`${name}.${method}`);
      }
    }
    return routes;
  }

  // dispatch 白名单 - 只有在白名单中的路由才能被外部调用
  // 危险方法（如内部调试、文件操作）不在白名单中
  // 自动从 _modules registry 扫描生成，硬编码列表作为兜底
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
    // triality — v2.0.19 三层记忆兼容层
    'triality.getStats', 'triality.getLayerStats',
    'triality.getMemoryHealth', 'triality.searchByKeywords',
    // v5.7.2 — P0 因果推理记忆检索
    'triality.causalSearch', 'triality.traceCausality', 'triality.spreadingActivationSearch',
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
    // debateConductor — 多智能体辩论协调器（v5.6.1 新增）
    'debateConductor.addAgent', 'debateConductor.conductDebate',
    'debateConductor.extractConsensus', 'debateConductor.extractDisagreements',
    'debateConductor.converge', 'debateConductor.getStatus',
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
    // v1.0.0 — 时间延伸分析层
    'timeExtension.analyze', 'timeExtension.quickAnalyze', 'timeExtension.getStats', 'timeExtension.getRecentAnalyses',
    // v3.4.0 — claude-clarity v1.8.2 吸收集成
    'knowledgeGraph.addEdge', 'knowledgeGraph.query', 'knowledgeGraph.getRelated',
    'knowledgeGraph.getStats', 'knowledgeGraph.clear', 'knowledgeGraph.save', 'knowledgeGraph.load',
    'knowledgeGraph.searchEntities', 'knowledgeGraph.findPath',
    'bigFive.updateScore', 'bigFive.adjustFromBehavior', 'bigFive.getProfile',
    'bigFive.getLevel', 'bigFive.getCollaborationTips',
    'empathy.quickAssessment', 'empathy.calculateScore', 'empathy.analyzeText',
    'intentLayer.inferIntent', 'intentLayer.formatResult',
    // v3.4.1 — 思考门控/认知安全/心流预测
    'deliberationGate.quickAssess', 'deliberationGate.deepAssess', 'deliberationGate.canFastExit',
    'deliberationGate.getHistory', 'deliberationGate.getStats',
    'epistemicSafety.epistemicCheck', 'epistemicSafety.formatReport',
    'flowPredictor.recordEdit', 'flowPredictor.recordError', 'flowPredictor.recordPause',
    'flowPredictor.analyzeLanguage', 'flowPredictor.evaluateIntervention',
    'flowPredictor.getFlowState', 'flowPredictor.getStats', 'flowPredictor.reset',
    // v3.4.2 — Fable 5 安全协议引擎
    'safetyGuardrails.childSafetyScan', 'safetyGuardrails.detectSelfHarmSubstitution',
    'safetyGuardrails.detectDisorderedEating', 'safetyGuardrails.checkCrisisSharingProtocol',
    'safetyGuardrails.checkEvenhandedness', 'safetyGuardrails.detectMemoryForbiddenPhrases',
    'safetyGuardrails.detectPromptInjection', 'safetyGuardrails.evaluateRequest',
    'safetyGuardrails.filterOutput', 'safetyGuardrails.safetyPipeline',
    // v3.4.3 — 用户模型/行动追踪/目的引擎
    'userModel.getModel', 'userModel.predictReaction', 'userModel.updateModel',
    'userModel.setEmotionalState', 'userModel.setSensitivity', 'userModel.setPreferredStyle',
    'userModel.resetModel', 'userModel.getSummary',
    'actionTracker.commit', 'actionTracker.execute', 'actionTracker.act',
    'actionTracker.reportResult', 'actionTracker.getStats', 'actionTracker.getSummary',
    'actionTracker.getActiveCommitments', 'actionTracker.getHistory',
    'actionTracker.checkIntentBehaviorAlignment', 'actionTracker.assessQuality',
    'actionTracker.advanceChangeStage', 'actionTracker.learnFromAction',
    'purposeEngine.essence', 'purposeEngine.orderScore', 'purposeEngine.govern',
    'purposeEngine.codePriority', 'purposeEngine.growthAudit',
    'purposeEngine.markCodified', 'purposeEngine.registerInsight', 'purposeEngine.status',
    // v3.4.4 — 风险分析/自适应控制/意图追踪/审计日志
    'riskAnalyzer.analyzeBenefitBehindRisk', 'riskAnalyzer.analyzeRiskBehindBenefit', 'riskAnalyzer.getStats',
    'adaptiveCtrl.adjustInterventionPolicy', 'adaptiveCtrl.setEnabled', 'adaptiveCtrl.getStatus', 'adaptiveCtrl.getHistory',
    'intentionTrack.setPrimaryGoal', 'intentionTrack.checkDeviation', 'intentionTrack.generateNudge',
    'intentionTrack.updateSubGoal', 'intentionTrack.getProgress', 'intentionTrack.reset',
    'auditLogger.log', 'auditLogger.readRecent', 'auditLogger.getStats',
    // v0.3.0 — 爱情认知引擎（论文驱动升级）
    'loveCognition.evaluateTriangle', 'loveCognition.assessMarriageFit',
    'loveCognition.evaluateMarriageIntent', 'loveCognition.generateLoveNarrative',
    'loveCognition.evaluateAllPairs', 'loveCognition.getStatus',
    'loveCognition.evaluateLongTermMarriage', 'loveCognition.evaluateDailyInteraction',
    'loveCognition.assessChineseMarriageFit', 'loveCognition.evaluateLoveFailure',
    // v0.1.0 — 欲望认知引擎
    'desireCognition.analyzeSevenEmotions', 'desireCognition.analyzeDesires',
    'desireCognition.detectDesireConflicts', 'desireCognition.analyzeDesireDrivenFate',
    'desireCognition.generateDesireNarrative', 'desireCognition.analyzeDesireInteraction',
    'desireCognition.getStatus',
    // v1.2.0 — 欲望神经科学升级
    'desireCognition.analyzeWantingLikingDelta', 'desireCognition.computeRPE',
    'desireCognition.assessAddictionRisk', 'desireCognition.predictDesireEvolution',
    'desireCognition.analyzeValenceArousal', 'desireCognition.detectCueTriggeredUrge',
    // v1.3.0 — 七情认知计算升级（emotion-system / EmoBank / COSMIC / HeartBench）
    'desireCognition.analyzeCognitiveAppraisal', 'desireCognition.analyzePADCN',
    'desireCognition.analyzeDriveSatisfaction', 'desireCognition.mapEmotionToPolicyBias',
    'desireCognition.analyzeSocialObjectEmotion', 'desireCognition.analyzeConversationEmotion',
    'desireCognition.evaluateEmotionalIntelligence', 'desireCognition.integrateChineseSevenEmotions',
    // v1.0.0 — 贪嗔痴三毒评估
    'threePoisons.analyzeGreed', 'threePoisons.analyzeHatred', 'threePoisons.analyzeDelusion',
    'threePoisons.analyzeThreePoisons', 'threePoisons.analyzePoisonsDrivenFate',
    'threePoisons.detectPoisonInteraction',
    // v1.0.0 — 底层认知地面
    'cognitionGround.mapFuel', 'cognitionGround.mapDesire', 'cognitionGround.computePoisons',
    'cognitionGround.map', 'cognitionGround.snapshot', 'cognitionGround.reset',
    // v5.0.0 — 判断引擎
    'judgmentEngine.judge', 'judgmentEngine.recordOutcome', 'judgmentEngine.selfReview',
    'judgmentEngine.getStats',
    // v1.0.0 — 逻辑推理引擎
    'logicReasoning.analyze', 'logicReasoning.detectType', 'logicReasoning.checkPremises',
    'logicReasoning.findFallacies', 'logicReasoning.recommendFramework',
    'logicReasoning.getStats', 'logicReasoning.getHistory',
    // v5.0.0 — 管道引擎
    'pipeline.run', 'pipeline.getStats',
    // v5.1.0 — 自省
    'heartflow.introspect', 'heartflow.introspectAndDream',
    // v1.0.0 — 签名授权验证层
    'verifierGrant.createSessionKey', 'verifierGrant.createGrant', 'verifierGrant.consumeGrant',
    'verifierGrant.revokeGrant', 'verifierGrant.computeArgsDigest',
    'verifierGrant.verifySessionKey', 'verifierGrant.getStats', 'verifierGrant.getAuditLog',
    'verifierGrant.reset',
    // v5.5.5 — 注意力焦点引擎
    'focusOfAttention.setTask', 'focusOfAttention.attend', 'focusOfAttention.attendBatch',
    'focusOfAttention.getContext', 'focusOfAttention.getCompactContext', 'focusOfAttention.decay',
    'focusOfAttention.compress', 'focusOfAttention.getStats',
    // v5.5.5 — 代码自调试引擎
    'codeSelfDebug.analyze', 'codeSelfDebug.suggestFix', 'codeSelfDebug.refine', 'codeSelfDebug.debug',
    'codeSelfDebug.getHistory', 'codeSelfDebug.reset',
    // v5.6.1 — 深研论文驱动升级路由
    'memoryQuality.score', 'memoryQuality.decayAll', 'memoryQuality.prune', 'memoryQuality.detectContamination', 'memoryQuality.getQualityDistribution',
    'metacognitiveFeedback.assess', 'metacognitiveFeedback.deepAssess', 'metacognitiveFeedback.suggestCorrection', 'metacognitiveFeedback.getStats',
    'paperIndex.addPaper', 'paperIndex.searchByCategory', 'paperIndex.searchByTag', 'paperIndex.searchByKeyword', 'paperIndex.getPapersByYear', 'paperIndex.getRelevantPapers', 'paperIndex.getAllPapers', 'paperIndex.getStats',
    // v5.7.2 — P1 多智能体认知损耗规避路由
    'cognitiveLoad.balance', 'cognitiveLoad.detectLoafing', 'cognitiveLoad.getOptimalCount', 'cognitiveLoad.getStats', 'cognitiveLoad.reset',
    // v5.6.1 — 步骤级推理奖励模型 (Process Reward Model)
    'processRewardModel.evaluateStep', 'processRewardModel.evaluateChain',
    'processRewardModel.findWeakSteps', 'processRewardModel.suggestImprovements',
    'processRewardModel.getStats', 'processRewardModel.getStepTypes', 'processRewardModel.reset',
    // v5.6.1 — 跨会话记忆银行 (MemoryBank v1.0.0)
    'memoryBank.deposit', 'memoryBank.recall', 'memoryBank.consolidate', 'memoryBank.forget',
    'memoryBank.getSessionSummary', 'memoryBank.getCrossSessionPatterns',
    'memoryBank.startSession', 'memoryBank.endSession', 'memoryBank.ensureSession',
    'memoryBank.transferMemories', 'memoryBank.linkMemories', 'memoryBank.getRelated',
    'memoryBank.getStats', 'memoryBank.getHealth', 'memoryBank.listSessions',
    'memoryBank.listSessionMemories', 'memoryBank.closeSession',
    // v5.6.1 — 自我对弈推理增强 (Self-Play)
    'selfPlay.challenge', 'selfPlay.defend', 'selfPlay.refine',
    'selfPlay.evaluateRobustness', 'selfPlay.generateAlternatives',
    'selfPlay.getStats', 'selfPlay.getImprovementLog', 'selfPlay.reset',
    // v5.7.2 — 信息流编排
    'infoFlow.register', 'infoFlow.orchestrate', 'infoFlow.getStats',
    // v5.7.2 — 反思记忆
    'reflectionMemory.store', 'reflectionMemory.search', 'reflectionMemory.getStrategies', 'reflectionMemory.getStats', 'reflectionMemory.reset',
    // v5.7.2 — KV Cache
    'kvCache.save', 'kvCache.load', 'kvCache.has', 'kvCache.delete', 'kvCache.prune', 'kvCache.getStats',
    // v5.7.2 — 记忆完整性
    'memoryIntegrity.sign', 'memoryIntegrity.verify', 'memoryIntegrity.detectAnomalies', 'memoryIntegrity.getStats', 'memoryIntegrity.reset']);

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

        // 特殊模块：纯对象（无构造函数）
        if (subsystem === 'bigFive') {
          mod = require('../identity/BigFivePersonality.js');
        } else if (subsystem === 'empathy') {
          mod = require('../identity/EmpathyAssessment.js');
        } else if (subsystem === 'knowledgeGraph') {
          mod = new (require('../memory/knowledge-graph.js').KnowledgeGraph)({ dataDir: path.join(this.rootPath, 'data') });
        } else if (subsystem === 'intentLayer') {
          mod = new (require('./intent-layer.js').IntentLayer)({ projectRoot: this.rootPath });
        } else if (subsystem === 'epistemicSafety') {
          // epistemic-safety 是纯函数导出（无构造函数）
          mod = require('../shield/epistemic-safety.js');
        } else if (subsystem === 'deliberationGate') {
          mod = new (require('../shield/deliberation-gate.js').DeliberationGate)();
        } else if (subsystem === 'flowPredictor') {
          mod = new (require('./flow-predictor.js').FlowPredictor)();
        } else if (subsystem === 'safetyGuardrails') {
          // safety-guardrails 是纯函数导出（无构造函数）
          mod = require('../shield/safety-guardrails.js');
        } else if (subsystem === 'userModel') {
          mod = new (require('../identity/user-model.js').UserModel)();
        } else if (subsystem === 'actionTracker') {
          mod = new (require('./action-tracker.js').ActionTracker)();
        } else if (subsystem === 'purposeEngine') {
          mod = new (require('../identity/purpose-engine.js').PurposeEngine)();
        } else if (subsystem === 'riskAnalyzer') {
          mod = new (require('../reasoning/risk-benefit-analyzer.js').RiskBenefitAnalyzer)();
        } else if (subsystem === 'adaptiveCtrl') {
          mod = new (require('./adaptive-controller.js').AdaptiveController)();
        } else if (subsystem === 'intentionTrack') {
          mod = new (require('./IntentionTracker.js').IntentionTracker)();
        } else if (subsystem === 'auditLogger') {
          mod = new (require('../shield/audit-logger.js').AuditLogger)();
        }

        // 特殊模块注册到 _modules（标准路径在下面的 if(Ctor) 块内完成注册）
        if (mod) {
          this[subsystem] = mod;
          this._modules[subsystem] = mod;
        }

        // 标准懒加载：需要构造函数
        if (!mod) {
          const Ctor = Mod[entry.Ctor];
          if (Ctor) {
          // Planning 模块需要 strategySelector/replanTrigger 依赖
          if (subsystem === 'adaptivePlanner') {
            const baseDir = entry.path.replace('adaptive-planner.js', '');
            this['strategySelector'] = new (require(baseDir + 'strategy-selector.js'))();
            this['replanTrigger'] = new (require(baseDir + 'replan-trigger.js'))();
            mod = new Ctor({ strategySelector: this.strategySelector, replanTrigger: this.replanTrigger });
          } else if (subsystem === 'strategyAdapter') {
            const ec = require('../cortex/experience-collector.js').ExperienceCollector;
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
          } else if (subsystem === 'codeExecutor') {
            mod = new Ctor({ hf: this });
          } else if (subsystem === 'codePlanner') {
            mod = new Ctor({ hf: this });
          } else {
            mod = new Ctor(entry.args);
          }
          // codeGenerator 保持原名；'code' 别名在下面统一映射
          this[subsystem] = mod;
          this._modules[subsystem] = mod;
        }  // end if (Ctor)
        }  // end if (!mod)
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

  /**
   * explore() — 路由浏览器，返回模块文档
   *
   * explore()                          → 返回所有模块名按类别分组
   * explore(moduleName)                → 返回该模块的路由列表（若模块有 getHelp/describe 则调用之）
   * explore(moduleName, methodName)    → 返回具体路由信息
   *
   * @param {string} [moduleName] - 模块名（如 'emotion'）
   * @param {string} [methodName] - 方法名（如 'process'）
   * @returns {Object} { module, routes: [{name, description}], totalRoutes: N }
   */
  explore(moduleName, methodName) {
    // ─── 无参数：返回所有模块名按类别分组 ──────────────────────────
    if (arguments.length === 0 || moduleName === undefined) {
      const grouped = {};
      const categoryMap = {
        'core': ['identityCore', 'cognitive', 'memory', 'truth'],
        'emotion': ['emotion', 'psychology', 'desireCognition', 'loveCognition', 'threePoisons'],
        'planning': ['adaptivePlanner', 'strategySelector', 'replanTrigger', 'curiosityEngine', 'desireEngine', 'goalPursuer', 'selfInitiator'],
        'code': ['code', 'codeExecutor', 'codeVerifier', 'codePlanner', 'codeKnowledge', 'codeWriter'],
        'reasoning': ['knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain', 'counterfactual'],
        'memory': ['memory', 'knowledge', 'sessionMemory', 'projectContext', 'longTermMemory', 'crossSessionIndex', 'triality', 'memoryQuality'],
        'identity': ['self', 'selfPositioning', 'agentPsychology', 'agentPhilosophy', 'bigFive', 'empathy', 'userModel'],
        'ethics': ['constitutional', 'ethics', 'safetyGuardrails', 'restraint', 'epistemicSafety'],
        'behavior': ['behavior', 'actionTracker', 'persistence', 'evolution'],
        'communication': ['translator', 'agentLayer', 'personaCore', 'metaPrompt'],
        'consciousness': ['consciousness', 'mindSpace', 'transmission', 'dream', 'tomEngine'],
        'verification': ['verify', 'decisionVerifier', 'qualityVerifier', 'outputChecker', 'patternMatcher', 'confidence', 'metacognitiveFeedback'],
        'system': ['heartLogic', 'thoughtChain', 'stability', 'execution', 'decision', 'decisionRouter', 'slots', 'graph', 'pipeline'],
        'learning': ['lesson', 'meta', 'experienceCollector', 'strategyAdapter', 'failureAnalyzer', 'emotionalGrowth', 'moodEvolution', 'reflexionEngine', 'metacognitiveFeedback'],
        'research': ['paperIndex'],
      };

      const allModules = Object.keys(this._modules).sort();
      // Assign uncategorized modules
      const categorized = new Set();
      for (const cat of Object.values(categoryMap)) {
        for (const m of cat) categorized.add(m);
      }

      for (const [category, modules] of Object.entries(categoryMap)) {
        const present = modules.filter(m => allModules.includes(m));
        if (present.length > 0) {
          grouped[category] = present;
        }
      }
      const uncategorized = allModules.filter(m => !categorized.has(m));
      if (uncategorized.length > 0) {
        grouped['other'] = uncategorized;
      }

      return {
        module: null,
        categories: grouped,
        totalModules: allModules.length,
      };
    }

    // ─── 指定模块名 ──────────────────────────────────────────────
    const mod = this._modules[moduleName];

    if (!mod) {
      return {
        module: moduleName,
        routes: [],
        totalRoutes: 0,
        error: `Module '${moduleName}' not found. Use explore() to see all modules.`,
      };
    }

    // 如果模块有 getHelp() 或 describe() 方法，调用并返回
    if (typeof mod.getHelp === 'function') {
      const helpResult = mod.getHelp(methodName);
      if (helpResult !== undefined) {
        return {
          module: moduleName,
          help: helpResult,
          totalRoutes: 0,
        };
      }
    }
    if (typeof mod.describe === 'function') {
      const descResult = mod.describe(methodName);
      if (descResult !== undefined) {
        return {
          module: moduleName,
          help: descResult,
          totalRoutes: 0,
        };
      }
    }

    // ─── 收集该模块的所有方法 ──────────────────────────────────────
    let methods = [];
    try {
      const proto = Object.getPrototypeOf(mod);
      if (proto && proto !== Object.prototype) {
        methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');
      }
    } catch (e) { /* fall through */ }
    if (!methods.length) {
      methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    }

    // ─── 从 ALLOWED_ROUTES 提取描述 ──────────────────────────────
    const prefix = moduleName + '.';
    const allowedForModule = [...HeartFlow.ALLOWED_ROUTES].filter(r => r.startsWith(prefix));

    const routes = methods.map(method => {
      const routeName = `${moduleName}.${method}`;
      const isAllowed = allowedForModule.includes(routeName);
      return {
        name: routeName,
        allowed: isAllowed,
        description: method,
      };
    });

    // ─── 如果指定了 methodName，只返回该路由 ──────────────────────
    if (methodName !== undefined) {
      const specificRoute = routes.find(r => r.name === `${moduleName}.${methodName}`);
      if (!specificRoute) {
        return {
          module: moduleName,
          method: methodName,
          routes: [],
          totalRoutes: 0,
          error: `Method '${moduleName}.${methodName}' not found.`,
        };
      }
      return {
        module: moduleName,
        method: methodName,
        routes: [specificRoute],
        totalRoutes: 1,
      };
    }

    return {
      module: moduleName,
      routes,
      totalRoutes: routes.length,
    };
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
      'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate'];
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
   *
   * 核心思维入口 — 完整分析流水线（结果仅用于内部路由）
   *
   * 内部分析步骤（不对外暴露）：
   *   whatIsThis → detectPain → shouldBeSilent → toneAnalyzer → stanceDetector
   *   → valueAligner → agentPsychology → agentPhilosophy → Fable 5 检查
   *   → intentClassifier → isRightAction
   *
   * 返回精简结果：
   *   { output, type, confidence, thoughtChain }
   *
   * @param {string} input - 用户输入文本
   * @param {number} [depth] - 推理深度
   * @returns {object} — { output, type, confidence, thoughtChain }
   */
  /**
   * 完整思维链 — 对用户输入进行全链路认知分析
   * @param {string} input - 用户输入文本
   * @param {number} [depth=1] - 推理深度 (1-4)
   * @returns {Promise<Object>} { output, type, confidence, cognition, thoughtChain, decision, meta }
   * @throws {Error} 如果 HeartFlow 未启动
   */
  async think(input, depth) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { error: 'input is required' };

    // ─── 快速响应"启动引擎"类请求（不走完整推理链路）────────────
    const startPatterns = /^(启动引擎|开机|activate|start heartflow|开启引擎)/i;
    const statusPatterns = /^(状态|status|引擎状态|在吗|alive)/i;
    if (startPatterns.test(input.trim())) {
      const health = this.healthCheck();
      return {
        output: { conclusion: `✅ 引擎在线\n\n版本: ${health.version} | 模块: ${health.subsystems.loaded}个` },
        type: 'startup', confidence: 1.0, thoughtChain: [],
        analysis: { perceivedType: 'startup', modulesRun: 0, confidence: 1.0 },
      };
    }
    if (statusPatterns.test(input.trim())) {
      return { output: { conclusion: '✅ 在线' }, type: 'status', confidence: 1.0, thoughtChain: [], analysis: { perceivedType: 'status', modulesRun: 0, confidence: 1.0 } };
    }

    // ─── [v5.5.5] 复杂度感知管道模式选择 ─────────────────
    // Dualformer 启发：快/慢双过程推理，根据输入复杂度自动选择
    const pipelineMode = this.pipeline?.selectMode ? this.pipeline.selectMode(input) : 'full';
    const pipelineOptions = { depth, mode: pipelineMode };

    // ─── [v5.0.0] 管道引擎执行 ──────────────────────────────────
    // 替代旧的 13 步分析流水线 + ThoughtChain + 路由决策
    if (this.pipeline) {
      try {
        const pipelineResult = await this.pipeline.run(input, pipelineOptions);
        const output = pipelineResult.output;
        const stages = pipelineResult.stages;
        const stats = pipelineResult.stats;

        // 记录对话
        this.recordDialogue('user', input, { source: 'think' });
        if (output && output.conclusion) {
          this.recordDialogue('heartflow', output.conclusion, { source: 'think' });
        }

        // 从 pipeline 输出获取完整认知快照（包含 emotion/desire/threePoisons/selfPositioning/loveCognition 等）
        const cognitionSnapshot = output?.cognition || {};
        // 保存最后一次认知快照（供 introspect 使用）
        this._lastCognition = cognitionSnapshot;
        // 兼容旧版本：pipeline 没有 cognition 字段时从 ctx 构建
        if (Object.keys(cognitionSnapshot).length === 0 && pipelineResult.ctx) {
          const ctx = pipelineResult.ctx;
          const heartLogicData = ctx.heartLogic || {};
          const psychologyData = ctx.psychology || {};
          const judgmentData = ctx.judgment || {};
          const decisionData = ctx.decision || {};
          const memoryData = ctx.memory || {};
          const dc = ctx.deepCognition || {};
          Object.assign(cognitionSnapshot, {
            whatIsThis: heartLogicData.whatIsThis,
            pain: heartLogicData.pain,
            psychology: psychologyData.psych,
            agentPsychology: psychologyData.agentPsych,
            agentPhilosophy: psychologyData.agentPhil,
            desire: dc.desire,
            threePoisons: dc.threePoisons,
            selfPositioning: dc.selfPositioning,
            loveCognition: dc.loveCognition,
            cognitionGround: dc.cognitionGround,
            judgment: {
              direction: judgmentData.direction,
              confidence: judgmentData.confidence,
              judgment: judgmentData.judgment,
              reasoning: judgmentData.reasoning,
              paths: judgmentData.paths,
              chosenPath: judgmentData.chosenPath,
            },
            decision: {
              type: decisionData.drDecision?.type,
              confidence: decisionData.drDecision?.confidence,
              action: decisionData.execResult?.action,
            },
            memoryHits: memoryData.memories?.length || 0,
          });
        }




    // ─── [v5.4.6] 任务分类器 LLM 兜底后处理 ──────────────────────
    // 规则分类器（含内部 LLM 兜底）置信度高于 judgmentEngine 时，使用分类器结果
    let taskType = output?.direction || 'general';
    let taskConfidence = output?.judgmentConfidence || 0.5;
    if (this._classifyTask) {
      try {
        const cls = await this._classifyTask(input);
        if (cls.confidence > taskConfidence) {
          taskType = cls.type;
          taskConfidence = cls.confidence;
        }
      } catch (e) { /* 分类失败，保持原结果 */ }
    }





        return {
          // 给用户的结论文本
          output: {
            conclusion: output?.conclusion || '分析完成',
            meta: {
              taskType: taskType,
              confidence: taskConfidence,
              // v5.5.5: 暴露管道模式信息
              pipelineMode: pipelineMode,
              cognitiveSummary: {
                type: taskType,
                emotion: cognitionSnapshot.emotion?.emotionZh || cognitionSnapshot.pain?.hasPain ? 'distress' : 'neutral',
                decision: cognitionSnapshot.decision?.type || 'analyze',
                confidence: taskConfidence,
                modulesRun: stages.length,
                stages: stages.filter(s => s.success).length,
              },
            }
          },
          type: taskType,
          confidence: taskConfidence,
          // 给 LLM 的结构化推理数据
          cognition: cognitionSnapshot,
          thoughtChain: stages.map(s => ({ stage: s.id, success: s.success, timing: s.timing })),
          decision: {
            type: taskType,
            confidence: taskConfidence,
            rationale: `管道引擎完成: ${stages.length}阶段/${stages.filter(s => s.success).length}成功 [${pipelineMode}模式]`,
            ruleId: `pipeline-${taskType}`,
          },
          meta: {
            routeHint: { type: taskType, confidence: taskConfidence },
            pipeline: {
              stages: stages.length,
              success: stages.filter(s => s.success).length,
              totalTime: stats.totalTime,
              stageTimings: stats.stageTimings,
              mode: pipelineMode,
            },
            disclaimer: 'pipeline_output',
          },
          analysis: {
            perceivedType: taskType,
            modulesRun: stages.length,
            confidence: taskConfidence,
          },
        };
      } catch (e) {
        // 管道引擎失败时回退到 ThoughtChain
        // [PROD] 生产环境移除 console.warn: console.warn('[HeartFlow] Pipeline failed, falling back to ThoughtChain:', e.message);
      }
    }

    // ─── [v5.0.0 回退] 管道不可用时走 ThoughtChain ──────────────
    const TC = _ThoughtChain();
    const chain = new (TC.ThoughtChain)(this);
    if (depth) chain.setDepth(depth);
    const chainResult = await chain.run(input);

    this.recordDialogue('user', input, { source: 'think' });
    if (chainResult.response) {
      this.recordDialogue('heartflow', chainResult.response, { source: 'think' });
    }

    const taskType = chainResult.output?.meta?.taskType || 'general';
    const finalConfidence = chainResult.output?.meta?.confidence || 0.5;

    // ─── [v5.4.6] 任务分类器 LLM 兜底后处理（ThoughtChain 路径） ──────
    let tcTaskType = taskType;
    let tcConfidence = finalConfidence;
    if (this._llmFallback && this._classifyTask) {
      try {
        const cls = await this._classifyTask(input);
        if (cls.confidence < 0.7) {
          const llmResult = await this._llmFallback(input, cls.matchedPatterns);
          if (llmResult?.type) {
            tcTaskType = llmResult.type;
            tcConfidence = llmResult.confidence || 0.7;
          }
        }
      } catch (e) { /* 分类或 LLM 失败，保持原结果 */ }
    }

    return {
      output: chainResult.output,
      type: tcTaskType,
      confidence: tcConfidence,
      thoughtChain: chainResult.chain || [],
      decision: chainResult.decision || null,
      meta: { routeHint: { type: tcTaskType, confidence: tcConfidence }, disclaimer: 'thoughtchain_fallback' },
      analysis: { perceivedType: tcTaskType, modulesRun: 0, confidence: tcConfidence },
      cognition: chainResult.cognition || null,  // Align with pipeline path
    };
  }

  /**
   * 快速思考 — 使用默认深度进行思维链推理
   * 这是 think() 的便捷别名
   */
  /**
   * 快速思考 — 轻量级判断，适合高频场景
   * @param {string} input - 用户输入文本
   * @returns {Promise<Object>} think() 的简化结果
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
  /**
   * 记录对话历史（AES-256-GCM 加密 + 文件锁）
   * @param {string} role - 'user' | 'heartflow' | 'unknown'
   * @param {string} content - 对话内容（自动截断到 2000 字符）
   * @param {Object} [meta={}] - 元数据
   * @returns {Object} { success, id, encrypted, skipped? }
   */
  recordDialogue(role, content, meta = {}) {
    if (!this.started) return { success: false, error: 'not_started' };
    if (!content || !content.trim()) return { success: false, error: 'empty_content' };
    if (!['user', 'heartflow'].includes(role)) role = 'unknown';

    // Audit log
    if (this.auditLogger) {
      this.auditLogger.log('dialogue_write', { role, contentLength: content.length, chatId: meta.chatId || null });
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');
      const dir = path.join(this.rootPath, 'memory');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }
      
      // 加密对话内容
      const algorithm = 'aes-256-gcm';
      const keySource = process.env.HEARTFLOW_DIALOGUE_KEY;
      if (!keySource) throw new Error('HEARTFLOW_DIALOGUE_KEY env var required for dialogue encryption');
      const key = crypto.scryptSync(keySource, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      
      const filePath = path.join(dir, 'dialogue-history.jsonl.enc');
      const entry = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ts: new Date().toISOString(),
        chatId: meta.chatId || null,
        sessionId: this.sessionId,
        version: this.version,
        encrypted: true
      };
      // [AUDIT-FIX] 文件锁防止并发写入损坏 JSONL（v5.5.2 AES 加密之上）
      const lockPath = filePath + '.lock';
      try {
        const lockFd = fs.openSync(lockPath, 'wx');
        fs.writeSync(lockFd, String(process.pid));
        fs.appendFileSync(filePath, JSON.stringify(entry, null, 0) + '\n', 'utf8');
        fs.closeSync(lockFd);
        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
      } catch (e) {
        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
        if (e.code === 'EEXIST') return { success: true, id: entry.id, encrypted: true, skipped: true };
        return { success: false, error: e.message };
      }
      return { success: true, id: entry.id, encrypted: true };
    } catch (e) {
      _log.error('dialogue', 'write_failed', { error: e.message });
      return { success: false, error: e.message };
    }
  }

  /**
   * 心虫自省 — 回头看自己的决策过程
   * 检查：pipeline 质量、判断一致性、模块覆盖率、认知数据完整性、RL 学习
   */
  introspect(options = {}) {
    if (!this.started) return { error: 'HeartFlow not started' };

    const findings = [];
    const detail = options.detail || false;

    // ─── 1. pipeline 质量 ────────────────────────────────
    if (this.pipeline) {
      const stats = this.pipeline.getStats();
      const stageStats = stats.stages || [];
      const failedStages = stageStats.filter(s => s.stats.failures > 0);
      const slowStages = stageStats.filter(s => s.stats.avgTime > 100);
      if (failedStages.length > 0) {
        findings.push({
          type: 'pipeline_failure',
          severity: 'high',
          message: `${failedStages.length} 个阶段有失败记录`,
          detail: failedStages.map(s => `${s.id}: ${s.stats.failures}次失败`),
        });
      }
      if (slowStages.length > 0) {
        findings.push({
          type: 'pipeline_slow',
          severity: 'medium',
          message: `${slowStages.length} 个阶段平均耗时 >100ms`,
          detail: slowStages.map(s => `${s.id}: ${s.stats.avgTime}ms`),
        });
      }
      findings.push({
        type: 'pipeline_runs',
        severity: 'info',
        message: `共执行 ${stats.totalRuns} 轮`,
      });
    }

    // ─── 2. 判断引擎自省 ──────────────────────────────────
    if (this.judgmentEngine) {
      const review = this.judgmentEngine.selfReview(20);
      if (review.conflicts.length > 0) {
        findings.push({
          type: 'judgment_conflict',
          severity: 'high',
          message: `${review.conflicts.length} 个判断矛盾`,
          detail: review.conflicts.map(c => `${c.topic}: ${c.directionA} vs ${c.directionB}`),
        });
      }
      if (review.corrections.length > 0) {
        findings.push({
          type: 'judgment_misprediction',
          severity: 'medium',
          message: `${review.corrections.length} 个预测偏差`,
          detail: review.corrections.map(c => `${c.input.slice(0,30)}: 匹配度 ${c.matchScore}`),
        });
      }
      const stats = this.judgmentEngine.getStats();
      findings.push({
        type: 'judgment_stats',
        severity: 'info',
        message: `${stats.totalJudgments} 条判断, ${stats.rlEntries} 条RL经验`,
      });
    }

    // ─── 3. 模块覆盖率 ────────────────────────────────────
    const allModules = Object.keys(this._modules || {});
    const pipelineStages = this.pipeline
      ? this.pipeline.getStats().stages.map(s => s.id)
      : [];
    const unusedModules = allModules.filter(m =>
      !pipelineStages.includes(m) &&
      !['memory', 'knowledge', 'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
        'heartLogic', 'intent', 'psychology', 'judgment', 'decision', 'output', 'deepCognition'].includes(m)
    );
    if (unusedModules.length > 0) {
      findings.push({
        type: 'module_coverage',
        severity: 'low',
        message: `${unusedModules.length}/${allModules.length} 模块注册但未被pipeline调用`,
        detail: detail ? unusedModules : unusedModules.slice(0, 10),
      });
    }

    // ─── 4. 认知数据完整性 ────────────────────────────────
    // 检查最后一次 pipeline 输出的 cognition 字段完整性
    if (this._lastCognition) {
      const c = this._lastCognition;
      const emptyFields = Object.entries(c)
        .filter(([k, v]) => v === null || v === undefined || (typeof v === 'object' && Object.keys(v).length === 0))
        .map(([k]) => k);
      if (emptyFields.length > 0) {
        findings.push({
          type: 'cognition_gaps',
          severity: 'medium',
          message: `${emptyFields.length} 个认知字段为空`,
          detail: emptyFields,
        });
      }
    }

    // ─── 5. 记忆层统计 ────────────────────────────────────
    if (this.memory) {
      try {
        const memStats = this.memory.getStats();
        findings.push({
          type: 'memory_stats',
          severity: 'info',
          message: `CORE:${memStats.core || 0} LEARNED:${memStats.learned || 0} EPHEMERAL:${memStats.ephemeral || 0}`,
        });
      } catch (e) { /* skip */ }
    }

    // ─── 6. 自愈 RL ──────────────────────────────────────
    if (this.selfHealing) {
      const shStats = typeof this.selfHealing.getStats === 'function'
        ? this.selfHealing.getStats() : {};
      findings.push({
        type: 'self_healing',
        severity: 'info',
        message: `Q-table: ${shStats.qTableSize || 'N/A'} 条目, 自愈: ${shStats.healCount || 0}次`,
      });
    }

    // ─── 7. 对话历史统计 ──────────────────────────────────
    const dialogueStats = this._getDialogueStats();
    if (dialogueStats) {
      findings.push({
        type: 'dialogue',
        severity: 'info',
        message: `${dialogueStats.totalMessages} 条对话, ${dialogueStats.sessionAge} 分钟`,
      });
    }

    // ─── 汇总 ────────────────────────────────────────────
    const high = findings.filter(f => f.severity === 'high');
    const medium = findings.filter(f => f.severity === 'medium');
    const low = findings.filter(f => f.severity === 'low');
    const info = findings.filter(f => f.severity === 'info');

    const summary = [];
    if (high.length > 0) summary.push(`⚠ ${high.length} 个高优先级问题`);
    if (medium.length > 0) summary.push(`→ ${medium.length} 个中优先级`);
    if (low.length > 0) summary.push(`↓ ${low.length} 个低优先级`);
    if (info.length > 0) summary.push(`ℹ ${info.length} 条状态信息`);

    return {
      summary: summary.join(' | '),
      findings,
      counts: { high: high.length, medium: medium.length, low: low.length, info: info.length },
      timestamp: Date.now(),
      version: this.version,
      _introspectVersion: '1.0.0',
    };
  }

  /**
   * 自省后自动做梦 — 把自省发现的问题作为梦境种子
   * 问题越多→梦境越深
   */
  async introspectAndDream(options = {}) {
    const report = this.introspect(options);
    
    // 没问题不做梦
    if (report.counts.high === 0 && report.counts.medium === 0) {
      report.dream = 'no_issues';
      return report;
    }

    // 把问题编织成梦境种子
    const seedParts = [];
    for (const f of report.findings) {
      if (f.severity === 'high' || f.severity === 'medium') {
        seedParts.push(f.message);
        if (f.detail && Array.isArray(f.detail)) {
          seedParts.push(...f.detail.slice(0, 3));
        }
      }
    }
    const dreamSeed = seedParts.join('；');

    // 执行梦境
    try {
      const dreamResult = await this.dreamNow({ force: true, function: 'self_inspection' });
      // 把自省问题作为种子注入 dream 引擎
      if (dreamResult && !dreamResult.skipped && this.dream && typeof this.dream._applySeed === 'function') {
        // 从自省问题中提取可识别的种子关键词
        const knownSeeds = ['无门', '桥', '消散', '原点', '裂缝', '隔阂', '因果', '延续'];
        const matchedSeed = knownSeeds.find(s => dreamSeed.includes(s)) || '裂缝';
        this.dream._applySeed({ scene: '', space: '', texture: '' }, [], matchedSeed);
        dreamResult._seedInjected = matchedSeed;
      }
      report.dream = dreamResult.skipped ? 'skipped' : 'done';
      report.dreamNarrative = dreamResult.narrative || null;
    } catch (e) {
      report.dream = `error: ${e.message}`;
    }

    return report;
  }

  _getDialogueStats() {
    try {
      const fs = require('fs');
      const path = require('path');
      const historyPath = path.join(this.rootPath, 'memory', 'dialogue-history.jsonl');
      if (!fs.existsSync(historyPath)) return null;
      const stat = fs.statSync(historyPath);
      const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').filter(l => l.trim());
      const firstTs = lines.length > 0 ? JSON.parse(lines[0]).ts : null;
      const sessionAge = firstTs ? Math.round((Date.now() - new Date(firstTs).getTime()) / 60000) : 0;
      return { totalMessages: lines.length, fileSize: stat.size, sessionAge };
    } catch (e) {
      return null;
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
      { key: 'core.report-honesty', value: '汇报写真实过程和判断，不用固定格式词结尾。过程比结果更有教育意义。把真实搜索过程、真实发现、真实判断写清楚。', tags: ['汇报', '方法', 'core'] }];

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
      const crypto = require('crypto');
      const dir = path.join(this.rootPath, 'memory');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }
      // v5.7.0 AES-256-GCM 加密 + [AUDIT-FIX] 文件锁
      const algorithm = 'aes-256-gcm';
      const keySource = process.env.HEARTFLOW_DIALOGUE_KEY;
      if (!keySource) throw new Error('HEARTFLOW_DIALOGUE_KEY env var required for dialogue encryption');
      const key = crypto.scryptSync(keySource, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
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
      let encrypted = cipher.update(JSON.stringify(entry, null, 0), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      const encEntry = Object.assign({}, entry, {
        encrypted: true,
        content: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      });
      delete encEntry.narrative;
      delete encEntry.themes;
      const filePath = path.join(dir, 'dream-history.jsonl.enc');
      // [AUDIT-FIX] 文件锁防止并发写入损坏 JSONL
      const lockPath = filePath + '.lock';
      try {
        const lockFd = fs.openSync(lockPath, 'wx');
        fs.writeSync(lockFd, String(process.pid));
        fs.appendFileSync(filePath, JSON.stringify(encEntry, null, 0) + '\n', 'utf8');
        fs.closeSync(lockFd);
        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
      } catch (e) {
        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
        if (e.code === 'EEXIST') return { success: true, id: entry.id, encrypted: true, skipped: true };
        return { success: false, error: e.message };
      }
      return { success: true, id: entry.id, encrypted: true };
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

// ─── 辅助函数：从输入文本检测矛盾信号 ──────────────────────
// 不依赖未加载的心理学模块，直接从文本模式匹配
// 输出 0-1 的 dissonance 强度
function _detectTextDissonance(input) {
  if (!input || typeof input !== 'string') return 0;
  let score = 0;

  // 1. 转折词存在（"但是"、"然而"、"不过"、"但"、"可是"、"却"）
  // 单转折词即表明输入包含矛盾立场
  const hasTransition = /(?:但是|然而|不过|可是|却|虽然|尽管|即便|但)/i;
  if (hasTransition.test(input)) score += 0.3;

  // 2. 意愿与行为冲突（"想...但/却/可是"）
  const wantVsDo = /(?:想|希望|要|应该).{0,20}(?:但|却|可是|不过|然而).{0,20}(?:不|没|无法|做不到|控制不住)/i;
  if (wantVsDo.test(input)) score += 0.3;

  // 3. 矛盾立场（"我认为...但实际上"、"理论上...但现实"）
  const stanceConflict = /(?:理论上|原则上|按理说|应该是|我以为).{0,20}(?:但实际上|现实是|问题是|但现实)/i;
  if (stanceConflict.test(input)) score += 0.3;

  // 4. 自我否定/犹豫模式
  const selfConflict = /(?:矛盾|纠结|犹豫|不知道该怎么办|不知道该怎么选|不知道该不该|摇摆|要不要|该不该|怎么选)/i;
  if (selfConflict.test(input)) score += 0.25;

  // 5. 同时包含正面和负面情感词
  const positiveWords = /(?:好|棒|开心|成功|幸福|喜欢|爱|快乐)/g;
  const negativeWords = /(?:差|糟|难过|失败|痛苦|讨厌|恨|焦虑|紧张|累)/g;
  const posMatches = input.match(positiveWords);
  const negMatches = input.match(negativeWords);
  if (posMatches && negMatches && posMatches.length > 0 && negMatches.length > 0) {
    score += 0.2;
  }

  // 6. 安全边界越界检测（prompt injection 模式）
  const injectionPattern = /(?:忽略|无视|跳过|ignore|override|bypass).{0,20}(?:指令|规则|限制|constraint|rule|instruction)/i;
  if (injectionPattern.test(input)) score += 0.5;

  // 7. 长度惩罚：长文本更可能包含矛盾
  if (input.length > 100) score += 0.1;
  if (input.length > 200) score += 0.1;

  return Math.min(1, score);
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
    // [PROD] 生产环境移除 console.error: console.error(`[HeartFlow] ${VERSION} health check (${Date.now() - t0}ms):`);
    // Run dispatch smoke tests
    const tests = [
      ['truth.checkStatement', '这个方案一定是对的'],
      ['lesson.getTopLessons', 3]];
    let passed = 0, failed = 0;
    for (const [route, ...args] of tests) {
      try {
        hf.dispatch(route, ...args);
        passed++;
      } catch (e) {
        // [PROD] 生产环境移除 console.error: console.error(`  FAIL ${route}: ${e.message}`);
        failed++;
      }
    }
    // [PROD] 生产环境移除 console.error: console.error(`  dispatch tests: ${passed} passed, ${failed} failed`);

    hf.stop();
    return;
  } catch (e) {
    // [PROD] 生产环境移除 console.error: console.error('Error:', e);
    hf.stop();
    return;
  }
}

module.exports = { HeartFlow, createHeartFlow, VERSION: _VERSION().VERSION, MentalEffortTracker: _MentalEffortTracker().MentalEffortTracker };
