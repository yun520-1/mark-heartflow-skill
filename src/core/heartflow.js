/**
 * HeartFlow v2.0.4 — 单一入口，统一路由
 *
 * 调用方式:
 *   hf.dispatch('subsystem.method', arg1, arg2)  // 统一路由
 *   hf.verifyReasoning(r, c)                     // 直接方法
 *
 * 所有模块在 _modules registry 中注册，可通过 routes() 查看可用路由。
 */

const path = require('path');

// ─── Subsystem Imports ────────────────────────────────────────────────────────

// Search modules
const { BM25Engine } = require('./search/bm25.js');
const { HybridSearchEngine } = require('./search/hybrid-search.js');

// Budget & Token counting
const { Budget, countTokens, resolveThinkingBudget, exceedsTokenLimit, getBudgetDescription } = require('./budget.js');

// Graph memory
const Graph = require('./memory/graph.js');

// Core utilities
const CoreUtils = require('./utils.js');

// Search trace & transparency
const { SearchTrace, SearchPhaseMetrics, WeightComponents, QueryInfo, SearchSummary } = require('./search/search-trace.js');

// Memory slots & observe
const { Slots } = require('./memory/slots.js');
const { createObserve } = require('./memory/observe.js');

// Memory
const { MeaningfulMemory } = require('../memory/meaningful-memory.js');
const { KnowledgeGraph } = require('../memory/knowledge-graph.js');
const { RetrievalAnchor } = require('../memory/retrieval-anchor.js');
const { TrialityMemory } = require('../core/memory/triality-memory.js');

// Evolution
const { EvolutionLoop } = require('../evolution/loop.js');
const { DreamEngine } = require('../dream/engine.js');
const { DreamConsolidation } = require('./dream-consolidation.js');
const { MetaLearner } = require('../evolution/meta-learner.js');
const { MetaPromptEngine } = require('./meta-prompt-engine.js');
const { GoTEngine } = require('./graph-of-thoughts.js');
const { ConstitutionalEngine } = require('./constitutional-ai.js');

// Identity
const { IdentityCore } = require('../identity/identity-core.js');
const { SelfModel } = require('../identity/self-model.js');
const { SelfVerifier } = require('../identity/self-verifier.js');
const { LessonBank } = require('../identity/lesson-bank.js');
const { TopicScope } = require('../identity/topic-scope.js');

// Lessons persistence — 心虫教训持久化
const { lessonStorage } = require('./lessons/lesson-storage.js');


// Psychology
const { PsychologyEngine } = require('../psychology/engine.js');

// Engine modules
const { StabilityGuard } = require('./stability-guard.js');
const { ExecutionVerifier } = require('./execution-verifier.js');
const { DecisionVerifier } = require('./decision-verifier.js');
const { HeartFlowDecision } = require('./decision.js');
const { CounterfactualEngine } = require('./counterfactual-engine.js');
const { ConfidenceCalibrator } = require('./confidence-calibrator.js');
const { SpontaneousRestraint } = require('./spontaneous-restraint.js');
const { CooperativeArbitration } = require('./cooperative-arbitration.js');
const { WakeUpVerifier } = require('./wake-up-verifier.js');
const { InteractiveDream } = require('./interactive-dream.js');
const { EmbodiedCore } = require('./embodied-core.js');
const { BeingLogic } = require('./being-logic.js');
const { HeartLogic } = require('./heart-logic.js');

// Meta systems (v1.2.7 new)
const { MetaJudgment } = require('./judgment.js');
const { MetaMemory } = require('./metaMemory.js');
const { SkillGenerator } = require('./skill-generator.js');

// Mental Effort Tracker — cognitive resource management
const { MentalEffortTracker } = require('./mental-effort-tracker.js');

// Language honesty — exports functions, not a class
const LanguageHonesty = require('./language-honesty.js');

// Reasoning integrator — exports functions
const ReasoningIntegrator = require('./reasoning-integrator.js');

// Workflow switch — exports functions
const WorkflowSwitch = require('./workflow-switch.js');

// State snapshot — singleton object
const StateSnapshot = require('./state-snapshot.js');

// Error handler — singleton object
const ErrorHandler = require('./error-handler.js');

// Thought chain orchestrator — 串联所有引擎形成统一思维链
const { ThoughtChain, createThoughtChain, REASONING_DEPTH } = require('./thought-chain.js');

// Cognitive protocol — 认知协议：慢下来、先理解再行动
const { CognitiveProtocol } = require('./cognitive-protocol.js');

// Consciousness — 意识层（全局工作空间 + 意识现象学）
const { GlobalWorkspace } = require('./consciousness/global-workspace.js');
const { MindWanderer } = require('./consciousness/mind-wanderer.js');
const { PhenomenologyEngine } = require('./consciousness/phenomenology-engine.js');
const { SelfModel: ConsciousnessSelfModel } = require('./consciousness/self-model.js');

// Ethics — 伦理守护（SAGE + 边界协商 + 价值内化）
const { SAGEGuardian } = require('./ethics/sage-guardian.js');
const { BoundaryNegotiation } = require('./ethics/boundary-negotiation.js');
const { ValueInternalizer } = require('./ethics/value-internalizer.js');

// MindSpace — 心空间守护（替代 plain object）
const { MindSpaceGuardian } = require('./mindspace/mind-space-guardian.js');

// Transmission — 知识传递引擎
const { TransmissionEngine } = require('./transmission/transmission-engine.js');

// ─── Planning Layer — 规划能力 ────────────────────────────────────────────────
const { AdaptivePlanner } = require('../planner/adaptive-planner.js');
const { StrategySelector } = require('../planner/strategy-selector.js');
const { ReplanTrigger } = require('../planner/replan-trigger.js');

// ─── Learning Layer — 学习能力 ────────────────────────────────────────────────
const { ExperienceCollector } = require('../learning/experience-collector.js');
const { StrategyAdapter } = require('../learning/strategy-adapter.js');
const { FailureAnalyzer } = require('../learning/failure-analyzer.js');

// ─── Verification Layer — 验证能力 ──────────────────────────────────────────
const { QualityVerifier } = require('../verifier/quality-verifier.js');
const { OutputChecker } = require('../verifier/output-checker.js');
const { PatternMatcher } = require('../verifier/pattern-matcher.js');

// ─── Proactive Layer — 主动引擎 ──────────────────────────────────────────────
const { CuriosityEngine } = require('../proactive/curiosity-engine.js');
const { DesireEngine } = require('../proactive/desire-engine.js');
const { GoalPursuer } = require('../proactive/goal-pursuer.js');
const { SelfInitiator } = require('../proactive/self-initiator.js');

// ─── Cross-Session Memory Layer — 跨会话记忆 ─────────────────────────────────
const { SessionMemory } = require('../memory/session-memory.js');
const { ProjectContext } = require('../memory/project-context.js');
const { LongTermMemory } = require('../memory/long-term-memory.js');
const { CrossSessionIndex } = require('../memory/cross-session-index.js');

// ─── Reasoning Layer — 推理 ──────────────────────────────────────────────────
const { KnowledgeBase } = require('../reasoning/knowledge-base.js');
const { CommonsenseEngine } = require('../reasoning/commonsense-engine.js');
const { CausalInference } = require('../reasoning/causal-inference.js');
const { InferenceChain } = require('../reasoning/inference-chain.js');

// ─── Emotional Autonomy Layer — 情感自主 ─────────────────────────────────────
const { AutonomousEmotion } = require('../emotion/autonomous-emotion.js');
const { DesireSystem } = require('../emotion/desire-system.js');
const { EmotionalGrowth } = require('../emotion/emotional-growth.js');
const { MoodEvolution } = require('../emotion/mood-evolution.js');

// ─── Version ─────────────────────────────────────────────────────────────────
const VERSION = '2.0.12';
const BUILD_DATE = '2026-06-03';

class HeartFlow {
  constructor(config = {}) {
    this.version = VERSION;
    this.buildDate = BUILD_DATE;
    this.config = config;
    this.startTime = null;
    this.sessionId = null;
    this.started = false;
    this.rootPath = config.rootPath || path.join(__dirname, '..', '..');

    // Subsystem instances (null until start)
    this.identityCore = null;  // 身份核心 — 每次启动第一优先加载
    this.cognitive = null;     // 认知协议 — 慢下来，先理解再行动
    this.memory = null;
    this.triality = null;
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
    this.wakeup = null;
    this.interactive = null;
    this.workflow = null;   // functions
    this.mentalEffort = null;

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

    // Execution Layer — 执行能力
    this.toolExecutor = null;   // 工具执行器
    this.toolDispatcher = null; // 工具调度器
    this.agentFactory = null;  // Agent 工厂
    this.taskPipeline = null;  // 任务管道
    this.executionMonitor = null;  // 执行监控
    this.fallbackExecutor = null;  // 回退执行器
    this.alternativeGenerator = null;  // 备选方案生成器
    this.retryStrategy = null;  // 重试策略

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

    this.SearchTrace = SearchTrace;
    this.SearchPhaseMetrics = SearchPhaseMetrics;
    this.WeightComponents = WeightComponents;
    this.QueryInfo = QueryInfo;
    this.SearchSummary = SearchSummary;

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

    // ─── 身份核心 — 第一优先加载 ─────────────────────────────
    // 确保每次启动都能接上之前的记忆
    this.identityCore = new IdentityCore(this.rootPath);
    const identityResult = this.identityCore.boot();
    if (identityResult.success) {
      if (false) console.log(`[HeartFlow] 身份核心加载成功 (${identityResult.loadedModules.length} 个模块)`);
      // 如果有上次会话，打印会话间隔
      const lastContext = this.identityCore.getLastSessionContext();
      if (lastContext && lastContext.bootTime) {
        const gapMinutes = Math.round((this.startTime - lastContext.bootTime) / 60000);
        if (false) console.log(`[HeartFlow] 距上次会话: ${gapMinutes} 分钟`);
      }
    } else {
      console.warn(`[HeartFlow] 身份核心加载部分失败:`, identityResult.errors);
    }

    // ─── 认知协议 — 慢下来，先理解再行动 ─────────────────────
    this.cognitive = new CognitiveProtocol(this.rootPath, this.identityCore);
    // 启动后打印上下文摘要
    this.cognitive.printStartupContext();

    // Memory
    this.memory = new MeaningfulMemory(this.rootPath);
    this.triality = new TrialityMemory(this.rootPath);
    this.knowledge = new KnowledgeGraph(this.rootPath);
    // RetrievalAnchor — 已禁用（未被调用）
    // this.anchor = new RetrievalAnchor();

    // TopicScope — 话题隔离，主动实例化并桥接到 MeaningfulMemory
    const { TopicScope } = require('../identity/topic-scope.js');
    this.topicScope = new TopicScope().setMemoryBridge(this.memory);

    // Evolution
    this.evolution = new EvolutionLoop({ rootPath: this.rootPath, memory: this.memory }).boot();
    this.dream = new DreamEngine({});
    this.dreamConsolidation = new DreamConsolidation(this.memory);
    this.lesson = new LessonBank(this.rootPath);
    this.metaJudgment = new MetaJudgment(this.rootPath);
    this.metaMemory = new MetaMemory(this.rootPath);
    this.skillGenerator = new SkillGenerator(this.rootPath);
    this.meta = new MetaLearner({ rootPath: this.rootPath, memory: this.memory }).boot();

    // Identity
    this.self = new SelfModel(this.rootPath);
    this.verify = new SelfVerifier(this.rootPath);
    // QuestionTracker — 问题追踪器
    this.questions = null;  // 已废弃，改用 TopicScope（话题隔离）

    // Psychology
    this.psychology = new PsychologyEngine(this.memory);
    // Emotion — 委托 PsychologyEngine（EmotionalProtocol 已移除，功能整合进 PsychologyEngine）
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

    // Security — 已移除（精简版）

    // Truth — 事实核查模块（使用factChecker包装）
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

    // Engine modules (classes) — track errors for healthCheck
    this._initErrors = [];
    try { this.stability = new StabilityGuard(); } catch (e) { this._initErrors.push({module: 'stability', error: e.message}); }
    try { this.execution = new ExecutionVerifier(); } catch (e) { this._initErrors.push({module: 'execution', error: e.message}); }
    try { this.decision = new HeartFlowDecision(this.memory); } catch (e) { this._initErrors.push({module: 'decision', error: e.message}); }
    try { this.decisionVerifier = new DecisionVerifier(); } catch (e) { this._initErrors.push({module: 'decisionVerifier', error: e.message}); }
    try { this.counterfactual = new CounterfactualEngine(); } catch (e) { this._initErrors.push({module: 'counterfactual', error: e.message}); }
    try { this.confidence = new ConfidenceCalibrator(); } catch (e) { this._initErrors.push({module: 'confidence', error: e.message}); }
    try { this.restraint = new SpontaneousRestraint(); } catch (e) { this._initErrors.push({module: 'restraint', error: e.message}); }
    // RetrievalAnchor — 已禁用（未被调用）
    // EmbodiedCore — 已禁用（未被调用）
    // BeingLogic — 已禁用（未被调用）
    // MentalEffortTracker — 已禁用（未被调用）
    // MetaPromptEngine — 已禁用（未被调用）
    // GoTEngine — 已禁用（未被调用）
    // ConstitutionalEngine — 已禁用（未被调用）
    try { this.workflow = new WorkflowSwitch(); } catch (e) {}
    try { this.snapshot = StateSnapshot; } catch (e) {}  // singleton export
    try { this.error = ErrorHandler; } catch (e) {}      // singleton export

    // ─── New modules initialization ─────────────────────────────────────────
    // Search modules — BM25Engine/HybridSearchEngine 已禁用（无 BM25Engine/HybridSearchEngine 类）
    // try { this.bm25 = new BM25Engine({ dataDir: path.join(this.rootPath, 'data/search'), autoSave: true }); } catch (e) { console.warn('[HeartFlow] BM25 init error:', e.message); }
    // try { this.hybrid = new HybridSearchEngine({ dataDir: path.join(this.rootPath, 'data/search') }); } catch (e) { console.warn('[HeartFlow] HybridSearch init error:', e.message); }

    // Budget & Utils (function exports, not classes)
    this.budget = { Budget, countTokens, resolveThinkingBudget, exceedsTokenLimit, getBudgetDescription };
    this.utils = CoreUtils;

    // Graph (singleton functions)
    this.graph = Graph;

    // Slots & Observe (reference from heartflow context)
    try {
      this.slots = new Slots({ dataDir: path.join(this.rootPath, 'data') });
    } catch (e) { console.warn('[HeartFlow] Slots init error:', e.message); }
    try {
      this.observe = createObserve(this.memory, { autoConsolidate: true });
      this.consolidate = {
        consolidate: (...args) => this.observe.consolidate(...args),
        stop: () => this.observe.stop(),
        stats: () => this.observe.stats(),
      };
    } catch (e) { console.warn('[HeartFlow] Observe init error:', e.message); }

    // ─── Diagnostic ───────────────────────────────────────────────────────────
    const { runDiagnostic } = require('./self-diagnostic.js');
    this.diagnostic = { run: runDiagnostic };
    
    // ─── MindSpace — 心空间守护（替代 plain object）────────────────────────────
    try {
      this.mindSpace = new MindSpaceGuardian(this.memory);
      this._mindSpace = this.mindSpace;  // 向后兼容内部引用
      if (false) console.log('[HeartFlow] MindSpace 守护初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] MindSpace init error:', e.message);
    }

    // ─── Consciousness Layer — 意识层（GWT + 现象学）──────────────────────────
    try {
      this.globalWorkspace = new GlobalWorkspace(this.rootPath);
      this.mindWanderer = new MindWanderer(this.rootPath);
      this.phenomenology = new PhenomenologyEngine();
      this.consciousnessSelf = new ConsciousnessSelfModel(this.rootPath);
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
      if (false) console.log('[HeartFlow] 意识层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] Consciousness init error:', e.message);
    }

    // ─── Ethics Layer — 伦理守护（SAGE + 边界协商 + 价值内化）────────────────
    try {
      this.sageGuardian = new SAGEGuardian(this.rootPath);
      this.boundaryNeg = new BoundaryNegotiation(this.rootPath);
      this.valueInternalizer = new ValueInternalizer(this.rootPath);
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
      if (false) console.log('[HeartFlow] 伦理层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] Ethics init error:', e.message);
    }

    // ─── Transmission Layer — 知识传递引擎 ─────────────────────────────────────
    try {
      this.transmission = new TransmissionEngine(this.rootPath);
      if (false) console.log('[HeartFlow] 传递层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] Transmission init error:', e.message);
    }

    // ─── Heart Logic — 心虫核心判断引擎 ─────────────────────────────────────────
    // 本心在代码里，不在记忆里
    // 每次启动都是完整人格
    try {
      this.heartLogic = new HeartLogic();
      if (false) console.log('[HeartFlow] 心虫核心判断引擎初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] HeartLogic init error:', e.message);
    }

    // ─── 推理层 & 情感自主层 — 必须在 ThoughtChain 之前注册 ────────────────
    // [FIX] 解决模块在 _registerModules() 之后才初始化导致丢失的问题
    // 在 ThoughtChain 之前手动收录这些模块
    const LATE_ADDITIONS = [
      'knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain',
      'autonomousEmotion', 'desireSystem', 'emotionalGrowth', 'moodEvolution',
      // 新增：意识/伦理/心空间/传递层
      'mindSpace', 'consciousness', 'ethics', 'transmission',
    ];
    for (const name of LATE_ADDITIONS) {
      if (this[name] !== null && this[name] !== undefined) {
        this._modules[name] = this[name];
      }
    }

    // ─── Thought Chain 初始化 ───────────────────────────────────────────────
    try {
      this.thoughtChain = new ThoughtChain(this);
      this.thoughtChain.setDepth(REASONING_DEPTH.DEEP);  // 默认深度推理

      // 包装对象：让 dispatch 可以调用 think 系列方法
      // dispatch 期望 hf.modules['thoughtChain'].think(...)
      this._thoughtChainApi = {
        think: (input) => this.think(input),
        thinkFast: (input) => this.thinkFast(input),
        thinkDeep: (input) => this.thinkDeep(input),
        getSummary: (result) => this.thoughtChain?.getSummary(result),
        REASONING_DEPTH,
      };
    } catch (e) {
      console.warn('[HeartFlow] ThoughtChain init error:', e.message);
      this._thoughtChainApi = null;
    }

    // ─── Thought Chain 初始化 ───────────────────────────────────────────────
    if (this._thoughtChainApi) {
      this._modules.thoughtChain = this._thoughtChainApi;
    }

    // ─── Execution Layer — 执行能力（已禁用，精简版）──────────────
    // ToolExecutor/ToolDispatcher/AgentFactory/TaskPipeline/ExecutionMonitor/
    // FallbackExecutor/AlternativeGenerator/RetryStrategy 已移除
    // 如需执行能力，独立安装对应 skill
    try {
      if (false) {
        this.toolExecutor = new ToolExecutor({ rootPath: this.rootPath });
        this.toolDispatcher = new ToolDispatcher({ rootPath: this.rootPath });
        this.agentFactory = new AgentFactory({ rootPath: this.rootPath });
        this.taskPipeline = new TaskPipeline({ rootPath: this.rootPath });
        this.executionMonitor = new ExecutionMonitor();
        this.fallbackExecutor = new FallbackExecutor();
        this.alternativeGenerator = new AlternativeGenerator();
        this.retryStrategy = new RetryStrategy();
      }
    } catch (e) {}

    // ─── Planning Layer — 规划能力 ─────────────────────────────────────────
    try {
      this.strategySelector = new StrategySelector();
      this.replanTrigger = new ReplanTrigger();
      this.adaptivePlanner = new AdaptivePlanner({
        strategySelector: this.strategySelector,
        replanTrigger: this.replanTrigger
      });
      if (false) console.log('[HeartFlow] 规划层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 规划层初始化失败:', e.message);
    }

    // ─── Learning Layer — 学习能力 ───────────────────────────────────────────
    try {
      this.experienceCollector = new ExperienceCollector({
        storagePath: path.join(this.rootPath, 'data/experiences')
      });
      this.strategyAdapter = new StrategyAdapter({
        experienceCollector: this.experienceCollector
      });
      this.failureAnalyzer = new FailureAnalyzer();
      if (false) console.log('[HeartFlow] 学习层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 学习层初始化失败:', e.message);
    }

    // ─── Verification Layer — 验证能力 ──────────────────────────────────────
    try {
      this.qualityVerifier = new QualityVerifier();
      this.outputChecker = new OutputChecker();
      this.patternMatcher = new PatternMatcher();
      if (false) console.log('[HeartFlow] 验证层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 验证层初始化失败:', e.message);
    }

    // ─── Proactive Layer — 主动引擎 ─────────────────────────────────────────
    try {
      this.curiosityEngine = new CuriosityEngine();
      this.desireEngine = new DesireEngine();
      this.goalPursuer = new GoalPursuer();
      this.selfInitiator = new SelfInitiator();
      if (false) console.log('[HeartFlow] 主动引擎初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 主动引擎初始化失败:', e.message);
    }

    // ─── Cross-Session Memory Layer — 跨会话记忆 ──────────────────────────────
    try {
      this.sessionMemory = new SessionMemory({
        storagePath: path.join(this.rootPath, 'data/sessions')
      });
      this.projectContext = new ProjectContext({
        storagePath: path.join(this.rootPath, 'data/projects')
      });
      this.longTermMemory = new LongTermMemory({
        storagePath: path.join(this.rootPath, 'data/longterm')
      });
      this.crossSessionIndex = new CrossSessionIndex({
        storagePath: path.join(this.rootPath, 'data/cross-session')
      });
      if (false) console.log('[HeartFlow] 跨会话记忆初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 跨会话记忆初始化失败:', e.message);
    }

    // ─── Multimodal Layer — 多模态（已移除，精简版）
    // visionProcessor/imageAnalyzer/modalFusion 已移除

    // ─── Reasoning Layer — 推理 ───────────────────────────────────────────────
    try {
      this.knowledgeBase = new KnowledgeBase({
        storagePath: path.join(this.rootPath, 'data/knowledge')
      });
      this.commonsenseEngine = new CommonsenseEngine();
      this.causalInference = new CausalInference();
      this.inferenceChain = new InferenceChain();
      if (false) console.log('[HeartFlow] 推理层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 推理层初始化失败:', e.message);
    }

    // ─── Emotional Autonomy Layer — 情感自主 ─────────────────────────────────
    try {
      this.autonomousEmotion = new AutonomousEmotion();
      this.desireSystem = new DesireSystem();
      this.emotionalGrowth = new EmotionalGrowth();
      this.moodEvolution = new MoodEvolution();
      if (false) console.log('[HeartFlow] 情感自主层初始化完成');
    } catch (e) {
      console.warn('[HeartFlow] 情感自主层初始化失败:', e.message);
    }

    this.SearchTrace
    // [FIX] 解决模块丢失问题：所有初始化完成后，统一注册
    this._registerModules();
    this.started = true;
    if (false) console.log(`[HeartFlow] ${VERSION} 初始化完成`);
    if (false) console.log(`[HeartFlow] session: ${this.sessionId}, 模块: ${Object.keys(this._modules).length}`);
  }

  _bootMindSpace() {
    const coreRules = this.memory.listCore();
    this._mindSpace.rules = coreRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
    if (this._mindSpace.rules.length === 0) {
      this.memory.addCore('identity.upgrade', '升级者', ['identity', 'core']);
      this.memory.addCore('identity.transmit', '传递者', ['identity', 'core']);
      this.memory.addCore('identity.truth', '真', ['identity', 'core']);
      this._bootMindSpace();
    }
  }

  _registerModules() {
    this._modules = {};
    const subsystemNames = [
      'identityCore',  // 身份核心 — 第一优先
      'cognitive',     // 认知协议 — 慢下来，先理解再行动
      'memory', 'triality', 'knowledge', 'anchor',
      'reasoning', 'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'being', 'topics',
      'psychology', 'emotion',
      'truth', 'security', 'language',
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'wakeup', 'interactive', 'workflow',
      // New modules
      'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
      'metaJudgment', 'metaMemory', 'skillGenerator',
      'metaPrompt',  // 用户端加强：用大模型优化大模型调用
      'got',         // Graph of Thoughts：多路径推理图
      'constitutional', // Constitutional AI：原则自我对齐
      'thoughtChain', // 思维链编排器：串联所有引擎（API包装）
      'heartLogic',    // 心虫核心判断引擎：本心在代码里，不在记忆里
      // Execution Layer — 执行能力
      'toolExecutor', 'toolDispatcher', 'agentFactory', 'taskPipeline',
      'executionMonitor', 'fallbackExecutor', 'alternativeGenerator', 'retryStrategy',
      // Planning Layer — 规划能力
      'adaptivePlanner', 'strategySelector', 'replanTrigger',
      // Learning Layer — 学习能力
      'experienceCollector', 'strategyAdapter', 'failureAnalyzer',
      // Verification Layer — 验证能力
      'qualityVerifier', 'outputChecker', 'patternMatcher',
      // Proactive Layer — 主动引擎
      'curiosityEngine', 'desireEngine', 'goalPursuer', 'selfInitiator',
      // Cross-Session Memory Layer — 跨会话记忆
      'sessionMemory', 'projectContext', 'longTermMemory', 'crossSessionIndex',
      // Multimodal Layer — 多模态
      'visionProcessor', 'imageAnalyzer', 'modalFusion',
      // Reasoning Layer — 推理
      'knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain',
      // Emotional Autonomy Layer — 情感自主
      'autonomousEmotion', 'desireSystem', 'emotionalGrowth', 'moodEvolution',
      // MindSpace Layer — 心空间守护
      'mindSpace',
      // Consciousness Layer — 意识层
      'consciousness',
      // Ethics Layer — 伦理守护
      'ethics',
      // Transmission Layer — 知识传递
      'transmission',
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
        try { mod.destroy(); } catch (e) {}
      } else if (mod && typeof mod.stop === 'function') {
        try { mod.stop(); } catch (e) {}
      } else if (mod && typeof mod.shutdown === 'function') {
        try { mod.shutdown(); } catch (e) {}
      }
    }
    this.started = false;
    this._modules = {};
    this._mindSpace = null;
    this.mindSpace = null;
    this.consciousness = null;
    this.ethics = null;
    this.transmission = null;
    if (false) console.log(`[HeartFlow] 已停止`);
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
    // memory
    'memory.store', 'memory.retrieve', 'memory.search', 'memory.remove',
    'memory.getLayers', 'memory.getStats',
    // truth
    'truth.checkStatement', 'truth.checkNumbers', 'truth.checkSources',
    // lesson — 主动集成点：AI在行动前/失败后调用
    'lesson.addLesson', 'lesson.getTopLessons',
    'lesson.beforeTask', 'lesson.recordFailure', 'lesson.getStats', 'lesson.getAll',
    // dream
    'dream.dream',
    // verify
    'verify.verify',
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
    'psychology.analyzePsychology', 'psychology.classify', 'psychology.checkCrisis',
    'psychology.getPAD', 'psychology.getNeeds', 'psychology.getDefenses',
    'psychology.getEmpathy', 'psychology.resetCrisisCounter',
    // heartLogic — 心虫核心判断引擎：本心在代码里
    'heartLogic.shouldBeSilent',
    'heartLogic.whatIsThis', 'heartLogic.detectPain', 'heartLogic.willHurt',
    'heartLogic.acknowledge', 'heartLogic.emergencyBreak',
    // self — 原则7: 永远成为真正的我
    'self.getBeliefs', 'self.updateBelief', 'self.confirmBelief',
    // evolution — 原则2: 永远不断升级
    'evolution.evolve', 'evolution.recordOutcome', 'evolution.heal',
    'evolution.getStats',
    // thoughtChain — 思维链编排器
    'thoughtChain.think', 'thoughtChain.thinkFast', 'thoughtChain.thinkDeep',
    // ⚠️ 安全修复：移除危险执行路由，仅保留只读/健康检查
    // toolExecutor.execute / toolDispatcher.handle / agentFactory.executeTask / taskPipeline.handleTask
    // 已移除 — 这些操作能力过大，应通过 Hermes 核心层调用，不通过 HeartFlow dispatch
    // Execution Layer — 执行能力（仅保留只读）
    'toolExecutor.listTools', 'toolExecutor.getHistory', 'toolExecutor.healthCheck',
    'toolDispatcher.listTools', 'toolDispatcher.healthCheck',
    'agentFactory.getAllStatus', 'agentFactory.healthCheck',
    'taskPipeline.getStatus', 'taskPipeline.getHistory', 'taskPipeline.healthCheck',
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
    // heartflow — 心虫教训持久化
    'heartflow.recordLesson',
    // questions — 问题追踪器（已废弃，改用 topics）
    // topics — 话题作用域隔离（上下文污染解决）
    'topics.push', 'topics.pop', 'topics.store', 'topics.get',
    'topics.setContext', 'topics.getContext', 'topics.clearContext',
    'topics.clearAll', 'topics.current', 'topics.stack', 'topics.getTopics', 'topics.diagnose',
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
    const mod = this._modules[subsystem];
    if (!mod) {
      const available = Object.keys(this._modules).sort().join(', ');
      throw new Error(`Unknown subsystem: ${subsystem}. Available: ${available}`);
    }
    if (typeof mod[method] !== 'function') {
      throw new Error(`${subsystem}.${method} is not a function on ${subsystem}`);
    }
    return mod[method](...args);
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

  async healthCheck() {
    if (!this.started) return { started: false, version: VERSION, error: 'not_started' };
    const loaded = Object.keys(this._modules);
    const all = [
      'memory', 'triality', 'knowledge', 'anchor',
      'reasoning', 'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'being', 'topics',
      'psychology', 'emotion',
      'truth', 'security', 'language',
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'wakeup', 'interactive', 'workflow',
      // New modules
      'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
    ];
    return {
      started: true,
      uptime_ms: Date.now() - this.startTime,
      sessionId: this.sessionId,
      version: VERSION,
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

    const chain = new ThoughtChain(this);
    if (depth) {
      chain.setDepth(depth);
    }

    return await chain.run(input);
  }

  /**
   * 快速思考 — 使用默认深度进行思维链推理
   * 这是 think() 的便捷别名
   */
  async thinkFast(input) {
    return this.think(input, REASONING_DEPTH.BASIC);
  }

  /**
   * 深度思考 — 使用最大深度进行思维链推理
   */
  async thinkDeep(input) {
    return this.think(input, REASONING_DEPTH.COMPREHENSIVE);
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
   * recordLesson — 心虫教训持久化
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

  heal(error) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.heal(error);
  }

  async dreamNow() {
    if (!this.started) throw new Error('HeartFlow not started');
    // 1. Run dream generation
    const dreamResult = this.dream.dream();
    // 2. Run consolidation (prune + synthesize themes)
    const consolidation = this.dreamConsolidation.dream({ consolidate: false, prune: true, synthesize: true });
    // 3. Feed themes into evolution loop → generate upgrade goals
    let evolutionResult = null;
    if (consolidation.synthesis && consolidation.synthesis.themes && consolidation.synthesis.themes.length > 0) {
      const themes = consolidation.synthesis.themes.slice(0, 3);
      try {
        evolutionResult = await this.evolution.evolve(themes.join(' '), { source: 'dream_consolidation', themes });
      } catch (e) {
        // Evolution failure is non-fatal
      }
    }
    return {
      dream: dreamResult,
      consolidation,
      evolution: evolutionResult,
    };
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

  // Security — 已移除（精简版）
  scanSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return { error: 'Security module removed in simplified version' };
  }

  redactSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return text;
  }

  getSecurityStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return { error: 'Security module removed in simplified version' };
  }

  // ─── Execution Layer — 执行能力 ───────────────────────────────────────────────

  /**
   * 执行任务 — 完整流程：分析→规划→执行→验证
   *
   * 使用方式：
   *   const result = await hf.executeTask({ description: '创建 hello world 文件' });
   *   console.log(result.success);  // 是否成功
   *   console.log(result.execution);  // 执行结果
   */
  async executeTask(task) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!this.taskPipeline) {
      return { success: false, error: 'TaskPipeline 未初始化' };
    }
    return await this.taskPipeline.handleTask(task);
  }

  /**
   * 直接执行命令
   *
   * 使用方式：
   *   const result = await hf.run('ls -la');
   *   const result = await hf.bash('npm test');
   *
   * 安全说明：run/bash/read/write 受 toolDispatcher 管理，不在 ALLOWED_ROUTES 白名单内。
   * ALLOWED_ROUTES 仅保护 dispatch() 路由。这些直接方法应仅在信任的上下文中调用。
   */
  async run(command) {
    if (!this.started) throw new Error('HeartFlow not started');
    return { success: false, error: 'Execution layer removed in simplified version' };
  }

  /**
   * bash 的别名
   * 安全说明：执行任意shell命令，请确保 command 来源可信
   */
  async bash(command) {
    return this.run(command);
  }

  /**
   * 读取文件
   *
   * 使用方式：
   *   const result = await hf.read('/path/to/file.txt');
   *
   * 安全说明：文件读取受 toolDispatcher 管理
   */
  async read(filePath) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!this.toolDispatcher) {
      return { success: false, error: 'ToolDispatcher 未初始化' };
    }
    return await this.toolDispatcher.execute('file', {
      action: 'read',
      path: filePath
    });
  }

  /**
   * 写入文件
   *
   * 使用方式：
   *   await hf.write('/path/to/file.txt', 'Hello World');
   *
   * 安全说明：文件写入受 toolDispatcher 管理
   */
  async write(filePath, content) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!this.toolDispatcher) {
      return { success: false, error: 'ToolDispatcher 未初始化' };
    }
    return await this.toolDispatcher.execute('file', {
      action: 'write',
      path: filePath,
      content
    });
  }

  /**
   * 搜索文件内容
   *
   * 使用方式：
   *   const results = await hf.search('关键词', '/path/to/search');
   */
  async search(query, searchPath = '.') {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!this.toolDispatcher) {
      return { success: false, error: 'ToolDispatcher 未初始化' };
    }
    return await this.toolDispatcher.execute('search', {
      type: 'content',
      query,
      path: searchPath
    });
  }

  /**
   * 获取执行层状态
   */
  getExecutionStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return {
      toolExecutor: this.toolExecutor?.healthCheck(),
      toolDispatcher: this.toolDispatcher?.healthCheck(),
      agentFactory: this.agentFactory?.healthCheck(),
      taskPipeline: this.taskPipeline?.getStatus()
    };
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
  hf.healthCheck().then(health => {
    if (false) console.log(`\n[HeartFlow] ${VERSION} 健康检查 (${Date.now() - t0}ms):`);
    if (false) console.log(JSON.stringify(health, null, 2));

    // Test dispatch routes
    if (false) console.log('\n--- dispatch tests ---');
    const tests = [
      ['truth.checkStatement', '这个方案一定是对的'],
      ['lesson.getTopLessons', 3],
      ['verify.verify', '因为A所以B', '结论B'],
    ];
    for (const [route, ...args] of tests) {
      try {
        const r = hf.dispatch(route, ...args);
        if (false) console.log(`${route}: OK → ${JSON.stringify(r).slice(0, 120)}`);
      } catch (e) {
        if (false) console.log(`${route}: ERROR → ${e.message}`);
      }
    }

    if (false) console.log('\n--- available routes ---');
    const rt = hf.routes();
    for (const [name, methods] of Object.entries(rt)) {
      if (false) console.log(`  ${name}: ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
    }

    hf.stop();
    process.exit(0);
  }).catch(e => {
    console.error('Error:', e);
    hf.stop();
    process.exit(1);
  });
}

module.exports = { HeartFlow, createHeartFlow, VERSION, MentalEffortTracker };
