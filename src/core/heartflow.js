/**
 /** HeartFlow v2.0.5 — 快速启动 + 两层懒加载
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
// VERSION 从 ./version.js 单一来源读取；禁止在此文件硬编码版本号。
// 运行时永远等于 package.json 的 version 字段；如需升级版本，调用 bumpVersion()
const { VERSION } = require('./version.js');
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
    this.workflow = null;   // functions
    this.mentalEffort = null;
    this.behavior = null;  // v2.0.19 行为模式系统
    this.persistence = null;  // v2.0.19 持久化层

    // [v2.0.19 FIX] _initErrors 必须在所有 try/catch 之前初始化
    // 之前在 line 418 才初始化，导致 truth 段 (line 377) push 失败时会崩
    this._initErrors = [];

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
      // 如果有上次会话，打印会话间隔
      const lastContext = this.identityCore.getLastSessionContext();
      if (lastContext && lastContext.bootTime) {
        const gapMinutes = Math.round((this.startTime - lastContext.bootTime) / 60000);
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

    // Behavior — 行为模式系统（v2.0.19 接入）
    // 集成孤儿模块 behavior-tracker.js + pattern-detector.js
    // 暴露 dispatch: behavior.* — 以前没接入主循环
    // 路径：src/core/heartflow.js → src/behavior-tracker.js (一级 ../)
    try {
      const { behaviorTracker } = require('../behavior-tracker.js');
      const { patternDetector } = require('../pattern-detector.js');
      this.behavior = {
        // Goal 生命周期
        createGoal: (args) => behaviorTracker.createGoal(args),
        record: (goalId, args) => behaviorTracker.record(goalId, args),
        getProgress: (goalId) => behaviorTracker.getProgress(goalId),
        formatProgress: (goalId) => behaviorTracker.formatProgress(goalId),
        getAllGoals: () => behaviorTracker.data.goals,
        // Pattern 分析（pattern-detector）
        detectWeeklyPattern: (records) => patternDetector.detectWeeklyPattern(records),
        detectTriggerPattern: (records) => patternDetector.detectTriggerPattern(records),
        detectRelapseRisk: (goal) => patternDetector.detectRelapseRisk(goal),
        // 综合报告
        getReport: (goalId) => {
          const p = behaviorTracker.getProgress(goalId);
          if (!p) return null;
          const goal = behaviorTracker.data.goals.find(g => g.id === goalId);
          const weekly = patternDetector.detectWeeklyPattern(goal.records);
          const triggers = patternDetector.detectTriggerPattern(goal.records);
          const risk = patternDetector.detectRelapseRisk(goal);
          return { ...p, weekly, triggers, risk };
        },
        getStats: () => ({
          goals: behaviorTracker.data.goals.length,
          totalRecords: behaviorTracker.data.goals.reduce((n, g) => n + g.records.length, 0),
          type: 'behavior-tracker+pattern-detector',
        }),
      };
    } catch (e) {
      this._initErrors.push({ module: 'behavior', error: e.message });
    }

    // Persistence — 持久化层（v2.0.19 接入）
    // 集成孤儿模块 write-ahead-log.js + atomic-write.js
    // 暴露 dispatch: persistence.* — 崩溃安全写入
    try {
      const { WriteAheadLog, OP_TYPES } = require('../utils/write-ahead-log.js');
      const { atomicWrite } = require('../utils/atomic-write.js');
      const fs = require('fs');
      // WAL 目录：memory/wal/
      const walDir = require('path').join(this.rootPath, 'memory', 'wal');
      try { fs.mkdirSync(walDir, { recursive: true }); } catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'wal_dir', error: e.message }); }
      const wal = new WriteAheadLog(walDir);
      wal._loadSeq();  // 异步加载 seq，先不等
      this.persistence = {
        // WAL 原始 API
        append: (opType, data) => wal.append(opType, data),
        commit: (seq) => wal.commit(seq),
        replay: () => wal.replay(),
        flush: () => wal.flush(),
        // 原子写
        atomicWrite: (filePath, content, options) => atomicWrite(filePath, content, options),
        // 组合：safeWrite = WAL 记录 + 原子写
        // 用途：lesson 写入、meaningful-memory 更新等关键路径
        safeWrite: async (filePath, content) => {
          const seq = await wal.append('write', { file: filePath, content: content.toString().slice(0, 50000) });
          await atomicWrite(filePath, content);
          await wal.commit(seq);
          return { ok: true, seq, file: filePath };
        },
        // 崩溃恢复：扫描 WAL，提交未完成的事务
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
        getStats: () => ({
          type: 'wal+atomic',
          walDir,
          opTypes: OP_TYPES,
        }),
      };
    } catch (e) {
      this._initErrors.push({ module: 'persistence', error: e.message });
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
    // 已禁用的模块 — 不再初始化，减少启动时间
    // this.embodied — 直接跳过
    try { this.workflow = new WorkflowSwitch(); } catch (e) {}
    this.snapshot = StateSnapshot;   // singleton export
    this.error = ErrorHandler;       // singleton export

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
    };

    // ─── Search modules — BM25Engine/HybridSearchEngine 已禁用（无 BM25Engine/HybridSearchEngine 类）
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
    } catch (e) {
      console.warn('[HeartFlow] Ethics init error:', e.message);
    }

    // ─── Transmission Layer — 知识传递引擎 ─────────────────────────────────────
    try {
      this.transmission = new TransmissionEngine(this.rootPath);
    } catch (e) {
      console.warn('[HeartFlow] Transmission init error:', e.message);
    }

    // ─── Heart Logic — 心虫核心判断引擎 ─────────────────────────────────────────
    // 本心在代码里，不在记忆里
    // 每次启动都是完整人格
    try {
      this.heartLogic = new HeartLogic();
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

    // Tier 2 模块：延迟加载，不在 start() 里初始化 ──────────────
    // adaptivePlanner / strategySelector / replanTrigger
    // experienceCollector / strategyAdapter / failureAnalyzer
    // qualityVerifier / outputChecker / patternMatcher
    // curiosityEngine / desireEngine / goalPursuer / selfInitiator
    // sessionMemory / projectContext / longTermMemory / crossSessionIndex
    // knowledgeBase / commonsenseEngine / causalInference / inferenceChain
    // autonomousEmotion / desireSystem / emotionalGrowth / moodEvolution
    // 见 this._lazy 注册表 + dispatch() 懒加载逻辑

    // [FIX] 解决模块丢失问题：所有初始化完成后，统一注册
    // Tier 2 模块（Planning/Learning/Verification/Proactive/CrossSession/Reasoning/Emotion）延迟到 dispatch
    this._registerModules();
    this.started = true;
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
      'heartLogic',    // 心虫核心判断引擎：本心在代码里，不在记忆里
      // Planning Layer — 规划能力（延迟加载，Tier 2）
      // 'adaptivePlanner', 'strategySelector', 'replanTrigger',
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
    // memory
    'memory.store', 'memory.retrieve', 'memory.search', 'memory.remove',
    'memory.getLayers', 'memory.getStats',
    // truth
    'truth.checkStatement', 'truth.checkNumbers', 'truth.checkSources',
    // behavior — v2.0.19 行为模式系统
    'behavior.createGoal', 'behavior.record', 'behavior.getProgress',
    'behavior.formatProgress', 'behavior.getAllGoals',
    'behavior.detectWeeklyPattern', 'behavior.detectTriggerPattern', 'behavior.detectRelapseRisk',
    'behavior.getReport', 'behavior.getStats',
    // persistence — v2.0.19 持久化层
    'persistence.append', 'persistence.commit', 'persistence.replay', 'persistence.flush',
    'persistence.atomicWrite', 'persistence.safeWrite', 'persistence.recover', 'persistence.getStats',
    // triality — 三层记忆（v2.0.19 暴露完整能力）
    'triality.store', 'triality.getLayerStats', 'triality.getStats',
    'triality.semanticSearch', 'triality.narrativeQuery', 'triality.getRecentNarrative',
    'triality.queryByTimeRange', 'triality.queryByRelationType',
    'triality.searchBySemantic', 'triality.searchByKeywords', 'triality.searchByTimeRange',
    'triality.searchByEmotion', 'triality.searchByAssociation', 'triality.multiChannelSearch',
    'triality.addRelationship', 'triality.addToLayer', 'triality.consolidateMemories',
    'triality.applyForgettingCurve', 'triality.getMemoryHealth',
    'triality.cleanup', 'triality.exportToFile', 'triality.importFromFile',
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
    // transmission — 知识传递引擎
    'transmission.distill', 'transmission.transfer', 'transmission.transferBatch',
    'transmission.getTransmissionLog', 'transmission.getDistilledLessons',
    'transmission.getStats', 'transmission.prune',
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
            this[strategySelector] = new (require(entry.path.replace('adaptive-planner', 'strategy-selector'))[entry.Ctor])();
            this[replanTrigger] = new (require(entry.path.replace('adaptive-planner', 'replan-trigger'))[entry.Ctor])();
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
          } else {
            mod = new Ctor(entry.args);
          }
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
      'behavior',  // v2.0.19 行为模式系统
      'persistence',  // v2.0.19 持久化层
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'workflow',
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
  }).catch(e => {
    console.error('Error:', e);
    hf.stop();
    process.exit(1);
  });
}

module.exports = { HeartFlow, createHeartFlow, VERSION, MentalEffortTracker };
