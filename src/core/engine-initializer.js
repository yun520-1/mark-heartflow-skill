#!/usr/bin/env node
/**
 * engine-initializer — HeartFlow start() extraction
 * Wraps the original start() body so heartflow.js stays small.
 */

const debugLog = require('../utils/debug-log');
const path = require('path');
const { _getConfig, _runSelfImprovementHealthCheck, getSelfImprovementHealth } = require('./engine-state');
const { _instantiateSpecialModule } = require('./module-registry');

// Lazy loaders from heartflow.js
const _VERSION = () => require('./version.js');
const _IdentityCore = () => require('../identity/identity-core.js');
const _CognitiveProtocol = () => require('./cognitive-protocol.js');
const _MeaningfulMemory = () => require('../memory/memory-adapter.js');
const _KnowledgeGraph = () => require('../memory/knowledge-graph.js');
const _MemoryBank = () => require('../memory/memory-bank.js');
const _TopicScope = () => require('../memory/topic-scope.js');
const _EvolutionLoop = () => require('../cortex/loop.js');
const _DreamEngine = () => require('../dream/dream.js');
const _DreamConsolidation = () => require('../dream/dream-consolidation.js');
const _LessonBank = () => require('../cortex/lesson-bank.js');
const _MetaJudgment = () => require('./judgment.js');
const _MetaMemory = () => require('./metaMemory.js');
const _SkillGenerator = () => require('../code/skill-generator.js');
const _MetaLearner = () => require('../cortex/meta-learner.js');
const _SelfModel = () => require('../identity/self-model.js');
const _SelfVerifier = () => require('../identity/self-verifier.js');
const _PsychologyEngine = () => require('../emotion/engine.js');
const _StabilityGuard = () => require('./stability-guard.js');
const _ExecutionVerifier = () => require('./execution-verifier.js');
const _HeartFlowDecision = () => require('./decision.js');
const _DecisionVerifier = () => require('./decision-verifier.js');
const _CognitiveEngine = () => require('./cognitive-engine.js');
const _DecisionEngineV2 = () => require('../reasoning/decision-engine.js');
const _MemoryConsolidation = () => require('../memory/memory-consolidation-engine.js');
const _EmotionDynamics = () => require('../emotion/emotion-dynamics-engine.js');
const _CognitiveLoadV2 = () => require('../cognitive/cognitive-load-v2.js');
const _DreamEngineV2 = () => require('../dream/dream-engine-v2.js');
const _PsychologyDialogue = () => require('../psychology/psychology-dialogue-engine.js');
const _CounterfactualEngine = () => require('../reasoning/counterfactual-engine.js');
const _ConfidenceCalibrator = () => require('./confidence-calibrator.js');
const _SpontaneousRestraint = () => require('../shield/spontaneous-restraint.js');
const _WorkflowSwitch = () => require('../workflow/workflow-switch.js');
const _VerifierGrant = () => require('./verifier-grant.js');
const _PlatformAdapter = () => require('./platform-adapter.js');
const _CapabilityAbstraction = () => require('./capability-abstraction.js');
const _Budget = () => require('./budget.js');
const _Graph = () => require('../memory/graph.js');
const _CoreUtils = () => require('./utils.js');
const _Slots = () => require('../memory/slots.js');
const _Observe = () => require('../memory/observe.js');
const _StateSnapshot = () => require('./state-snapshot.js');
const _ErrorHandler = () => require('./error-handler.js');
const _SelfDiagnostic = () => require('./self-diagnostic.js');
const _MindSpaceGuardian = () => require('../shield/mindspace/mind-space-guardian.js');
const _GlobalWorkspace = () => require('../consciousness/global-workspace.js');
const _MindWanderer = () => require('../consciousness/mind-wanderer.js');
const _PhenomenologyEngine = () => require('../consciousness/phenomenology-engine.js');
const _ConsciousnessSelfModel = () => require('../identity/self-model.js');
const _TomEngine = () => require('../consciousness/tom-engine.js');
const _SAGEGuardian = () => require('../shield/ethics/sage-guardian.js');
const _BoundaryNegotiation = () => require('../shield/ethics/boundary-negotiation.js');
const _ValueInternalizer = () => require('../shield/ethics/value-internalizer.js');
const _InnerOS = () => require('../inner-os/heartflow-inner-os.js');
const _TransmissionEngine = () => require('../workflow/transmission/transmission-engine.js');
const _HeartLogic = () => require('./heart-logic.js');
const _FocusOfAttention = () => require('../memory/focus-of-attention.js');
const _CodeSelfDebug = () => require('../code/code-self-debug.js');
const _ReflexionEngine = () => require('../cortex/reflexion-engine.js');
const _MemoryConsolidator = () => require('../memory/memory-consolidator.js');
const _MultiAgentDialogue = () => require('../consciousness/multi-agent-dialogue.js');
const _MCTSReasoning = () => require('../reasoning/mcts-reasoning.js');
const _HierarchicalPlanner = () => require('../planner/hierarchical-planner.js');
const _MemoryQuality = () => require('../memory/memory-quality.js');
const _MetacognitiveFeedback = () => require('../cortex/metacognitive-feedback.js');
const _PaperIndex = () => require('../memory/research-paper-index.js');
const _CognitiveLoadBalancer = () => require('../core/cognitive-load-balancer.js');
const _InformationFlow = () => require('./information-flow.js');
const _ReflectionMemory = () => require('../memory/reflection-memory.js');
const _KVCache = () => require('../memory/kv-cache-persistor.js');
const _MemoryIntegrity = () => require('../shield/memory-integrity.js');
const _ExperienceValidator = () => require('../cortex/experience-validator.js');
const _MemoryWriteController = () => require('../memory/memory-write-controller.js');
const _MetacognitiveRL = () => require('../cortex/metacognitive-rl.js');
const _MemoryCompressor = () => require('../memory/memory-compressor.js');
const _SkillEvolutionEngine = () => require('../cortex/skill-evolution-engine.js');
const _SelfPlay = () => require('../reasoning/self-play.js');
const _CognitiveIndex = () => require('../cognitive/cognitive-load.js');

function _boundedPush(arr, item, maxSize = 500) {
  if (arr.length >= maxSize) arr.shift();
  arr.push(item);
}

function start(hf, HeartFlowClass) {
  if (hf.started) return;
  hf.startTime = Date.now();
  hf.sessionId = `session-${hf.startTime}`;
  hf.version = _VERSION().VERSION;

  // 身份核心 — 第一优先加载
  hf.identityCore = new (_IdentityCore().IdentityCore)(hf.rootPath);
  const identityResult = hf.identityCore.boot();
  if (identityResult.success) {
    const lastContext = hf.identityCore.getLastSessionContext();
    if (lastContext && lastContext.bootTime) {
      const gapMinutes = Math.round((hf.startTime - lastContext.bootTime) / 60000);
      if (gapMinutes > 0) {
        debugLog.debug('heartflow', 'session_gap', { gap_minutes: gapMinutes });
      }
    }
  } else {
    debugLog.warn('heartflow', '身份核心加载部分失败: ' + JSON.stringify(identityResult.errors));
  }

  // Memory / Cognitive / Knowledge / MemoryBank
  hf.cognitive = new (_CognitiveProtocol().CognitiveProtocol)(hf.rootPath, hf.identityCore);
  hf.cognitive.printStartupContext();
  hf.memory = new (_MeaningfulMemory().MemoryAdapter)(hf.rootPath);
  hf.knowledge = new (_KnowledgeGraph().KnowledgeGraph)(hf.rootPath);
  hf.memoryBank = new (_MemoryBank().MemoryBank)({ memory: hf.memory });

  // MemoryKernel
  try {
    const { MemoryKernel } = require('../memory/memory-kernel.js');
    hf.memoryKernel = new MemoryKernel(hf.rootPath);
    hf.memoryKernel.load();
  } catch (e) {
    hf._initErrors.push({ module: 'memoryKernel', error: e.message });
  }

  // Triality compatibility layer
  const mem = hf.memory;
  hf.triality = {
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
      return { working: { count: s.ephemeral || 0 }, episodic: { count: s.learned || 0 }, semantic: { count: s.core || 0 } };
    },
    getMemoryHealth() { return { averageRetention: 1.0 }; },
    searchByKeywords(keywords, limit) { return typeof mem.searchByKeywords === 'function' ? mem.searchByKeywords(keywords, limit) : []; },
    causalSearch(query, limit) { return typeof mem.causalSearch === 'function' ? mem.causalSearch(query, limit) : []; },
    traceCausality(memoryId, direction, maxDepth) { return typeof mem.traceCausality === 'function' ? mem.traceCausality(memoryId, direction, maxDepth) : []; },
    spreadingActivationSearch(seedId, budget) { return typeof mem.spreadingActivationSearch === 'function' ? mem.spreadingActivationSearch(seedId, budget) : []; },
  };

  require('./engine-lifecycle')._initCoreRules(hf);

  hf.topicScope = new (_TopicScope().TopicScope)().setMemoryBridge(hf.memory);

  hf._evolutionRaw = null;
  Object.defineProperty(hf, 'evolution', {
    get() {
      if (!hf._evolutionRaw) {
        try { hf._evolutionRaw = new (_EvolutionLoop().EvolutionLoop)({ rootPath: hf.rootPath, memory: hf.memory }).boot(); } catch (e) { hf._evolutionRaw = { boot: () => hf, evolve: () => ({}), getStats: () => ({}), getDiagnostics: () => ({}) }; }
      }
      return hf._evolutionRaw;
    },
    enumerable: true, configurable: true,
  });

  hf.dream = new (_DreamEngine().DreamV11)({});
  hf.dreamConsolidation = new (_DreamConsolidation().DreamConsolidation)(hf.memory);
  hf.lesson = _LessonBank().lessonBank || _LessonBank();

  hf._metaJudgmentRaw = null;
  Object.defineProperty(hf, 'metaJudgment', {
    get() {
      if (!hf._metaJudgmentRaw) {
        try { hf._metaJudgmentRaw = new (_MetaJudgment().MetaJudgment)(hf.rootPath); } catch (e) { hf._metaJudgmentRaw = { assessJudgment: () => ({}), getConfidence: () => ({}), getJudgmentHistory: () => [] }; }
      }
      return hf._metaJudgmentRaw;
    },
    enumerable: true, configurable: true,
  });

  hf.metaMemory = new (_MetaMemory().MetaMemory)(hf.rootPath);
  hf.skillGenerator = new (_SkillGenerator().SkillGenerator)(hf.rootPath);
  hf.meta = new (_MetaLearner().MetaLearner)({ rootPath: hf.rootPath, memory: hf.memory }).boot();

  hf.self = new (_SelfModel().SelfModel)(hf.rootPath);
  hf.verify = new (_SelfVerifier().SelfVerifier)(hf.rootPath);
  hf.questions = null;

  hf.psychology = new (_PsychologyEngine().PsychologyEngine)(hf.memory);
  hf.emotion = {
    process: (input) => {
      if (!hf.psychology) return { pad: { pleasure: 0, arousal: 0, dominance: 0 }, intensity: 0, type: 'neutral' };
      const r = hf.psychology.analyzePsychology(input);
      return { pad: r.emotion, intensity: r.emotion.intensity || 0, type: r.intention.category || 'unknown' };
    },
    getPAD: (input) => {
      if (!hf.psychology) return { pleasure: 0, arousal: 0, dominance: 0 };
      const r = hf.psychology.analyzePsychology(input);
      return { pleasure: r.emotion.pleasure, arousal: r.emotion.arousal, dominance: r.emotion.dominance };
    },
  };

  try {
    const { factChecker } = require('../reasoning/fact-checker.js');
    hf.truth = { checkStatement: async (stmt) => factChecker.checkFact(stmt), checkNumbers: (stmt) => factChecker.checkNumber(stmt), checkSources: (stmt) => factChecker.checkAcademicClaim(stmt), getStats: () => ({ type: 'fact-checker' }) };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'truth', error: e.message }, 500); }

  try {
    const { behaviorTracker } = require('../behavior-tracker.js');
    const { patternDetector } = require('../pattern-detector.js');
    hf.behavior = {
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
        return { ...p, weekly: patternDetector.detectWeeklyPattern(goal.records), triggers: patternDetector.detectTriggerPattern(goal.records), risk: patternDetector.detectRelapseRisk(goal) };
      },
      getStats: () => behaviorTracker.getStats(),
    };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'behavior', error: e.message }, 500); }

  try {
    const { WriteAheadLog, OP_TYPES } = require('../utils/write-ahead-log.js');
    const { atomicWrite } = require('../utils/atomic-write.js');
    const fs = require('../utils/safe-fs');
    const walDir = path.join(hf.rootPath, 'memory', 'wal');
    try { fs.mkdirSync(walDir, { recursive: true }); } catch (e) {}
    const wal = new WriteAheadLog(walDir);
    wal._loadSeq();
    hf.persistence = {
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
              _boundedPush(results, { seq: entry.seq, file: entry.data.file, recovered: true });
            }
          } catch (e) { _boundedPush(results, { seq: entry.seq, file: entry.data?.file, recovered: false, error: e.message }); }
        }
        return results;
      },
      getStats: () => ({ type: 'wal+atomic', walDir, opTypes: OP_TYPES }),
    };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'persistence', error: e.message }, 500); }

  try { hf.stability = new (_StabilityGuard().StabilityGuard)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'stability', error: e.message }, 500); }
  try { hf.execution = new (_ExecutionVerifier().ExecutionVerifier)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'execution', error: e.message }, 500); }
  try { hf.decision = new (_HeartFlowDecision().HeartFlowDecision)(hf.memory); } catch (e) { _boundedPush(hf._initErrors, { module: 'decision', error: e.message }, 500); }
  try { hf.decisionVerifier = new (_DecisionVerifier().DecisionVerifier)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'decisionVerifier', error: e.message }, 500); }
  try { hf.cognitiveEngine = new (_CognitiveEngine().CognitiveEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'cognitiveEngine', error: e.message }, 500); }
  try { hf.decisionEngineV2 = new (_DecisionEngineV2().DecisionEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'decisionEngineV2', error: e.message }, 500); }
  try { hf.memoryConsolidation = new (_MemoryConsolidation().MemoryConsolidationEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryConsolidation', error: e.message }, 500); }
  try { hf.emotionDynamics = new (_EmotionDynamics().EmotionDynamicsEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'emotionDynamics', error: e.message }, 500); }
  try { hf.cognitiveLoadV2 = new (_CognitiveLoadV2().CognitiveLoadEngineV2)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'cognitiveLoadV2', error: e.message }, 500); }
  hf._dreamEngineV2Raw = null;
  Object.defineProperty(hf, 'dreamEngineV2', {
    get() {
      if (!hf._dreamEngineV2Raw) { try { hf._dreamEngineV2Raw = new (_DreamEngineV2().DreamEngineV2)(); } catch (e) { hf._dreamEngineV2Raw = { healthCheck: () => ({}) }; } }
      return hf._dreamEngineV2Raw;
    },
    enumerable: true, configurable: true,
  });
  try { hf.psychologyDialogue = new (_PsychologyDialogue().PsychologyDialogueEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'psychologyDialogue', error: e.message }, 500); }
  try { hf.counterfactual = new (_CounterfactualEngine().CounterfactualEngine)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'counterfactual', error: e.message }, 500); }
  try { hf.confidence = new (_ConfidenceCalibrator().ConfidenceCalibrator)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'confidence', error: e.message }, 500); }
  try { hf.restraint = new (_SpontaneousRestraint().SpontaneousRestraint)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'restraint', error: e.message }, 500); }
  try { hf.workflow = new (_WorkflowSwitch())(); } catch (e) { _boundedPush(hf._initErrors, { module: 'workflow', error: e.message }, 500); }
  try { hf.verifierGrant = new (_VerifierGrant().VerifierGrant)(); } catch (e) { _boundedPush(hf._initErrors, { module: 'verifierGrant', error: e.message }, 500); }
  if (hf.verifierGrant) hf._modules['verifierGrant'] = hf.verifierGrant;
  hf.snapshot = _StateSnapshot();
  hf.error = _ErrorHandler();

  try { hf.platformAdapter = _PlatformAdapter().createAdapter('hermes'); } catch (e) { _boundedPush(hf._initErrors, { module: 'platformAdapter', error: e.message }, 500); }
  try { hf.capabilityAbstraction = new (_CapabilityAbstraction().CapabilityAbstraction)(hf.platformAdapter); } catch (e) { _boundedPush(hf._initErrors, { module: 'capabilityAbstraction', error: e.message }, 500); }

  // Tier 2 lazy registry
  hf._lazy = {
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
    codeExecutor: { lazy: true, path: '../code/code-executor.js', Ctor: 'CodeExecutor', args: { hf: null } },
    codePlanner: { lazy: true, path: '../code/code-planner.js', Ctor: 'CodePlanner', args: { hf: null } },
    codeWriter: { lazy: true, path: '../code/code-writer.js', Ctor: 'CodeWriter', args: {} },
    knowledgeGraph: { lazy: true, path: '../memory/knowledge-graph.js', Ctor: 'KnowledgeGraph', args: { dataDir: null } },
    bigFive: { lazy: true, path: '../identity/BigFivePersonality.js', Ctor: '', args: {} },
    empathy: { lazy: true, path: '../identity/EmpathyAssessment.js', Ctor: '', args: {} },
    intentLayer: { lazy: true, path: './intent-layer.js', Ctor: 'IntentLayer', args: {} },
    deliberationGate: { lazy: true, path: '../shield/deliberation-gate.js', Ctor: 'DeliberationGate', args: {} },
    epistemicSafety: { lazy: true, path: '../shield/epistemic-safety.js', Ctor: '', args: {} },
    flowPredictor: { lazy: true, path: '../planner/flow-predictor.js', Ctor: 'FlowPredictor', args: {} },
    safetyGuardrails: { lazy: true, path: '../shield/safety-guardrails.js', Ctor: '', args: {} },
    userModel: { lazy: true, path: './user-model.js', Ctor: 'UserModel', args: {} },
    actionTracker: { lazy: true, path: './action-tracker.js', Ctor: 'ActionTracker', args: {} },
    purposeEngine: { lazy: true, path: './purpose-engine.js', Ctor: 'PurposeEngine', args: {} },
    riskAnalyzer: { lazy: true, path: './risk-benefit-analyzer.js', Ctor: 'RiskBenefitAnalyzer', args: {} },
    adaptiveCtrl: { lazy: true, path: './adaptive-controller.js', Ctor: 'AdaptiveController', args: {} },
    intentionTrack: { lazy: true, path: './IntentionTracker.js', Ctor: 'IntentionTracker', args: {} },
    auditLogger: { lazy: true, path: './audit-logger.js', Ctor: 'AuditLogger', args: {} },
    focusOfAttention: { lazy: true, path: '../memory/focus-of-attention.js', Ctor: 'FocusOfAttention', args: {} },
    codeSelfDebug: { lazy: true, path: '../code/code-self-debug.js', Ctor: 'CodeSelfDebug', args: {} },
    reflexionEngine: { lazy: true, path: '../cortex/reflexion-engine.js', Ctor: 'ReflexionEngine', args: {} },
    memoryConsolidator: { lazy: true, path: '../memory/memory-consolidator.js', Ctor: 'MemoryConsolidator', args: {} },
    multiAgentDialogue: { lazy: true, path: '../consciousness/multi-agent-dialogue.js', Ctor: 'MultiAgentDialogue', args: {} },
    mctsReasoning: { lazy: true, path: '../reasoning/mcts-reasoning.js', Ctor: 'MCTSReasoning', args: {} },
    hierarchicalPlanner: { lazy: true, path: '../planner/hierarchical-planner.js', Ctor: 'HierarchicalPlanner', args: {} },
  };

  // Builtin singletons
  const BudgetMod = _Budget();
  hf.budget = { Budget: BudgetMod.Budget, countTokens: BudgetMod.countTokens, resolveThinkingBudget: BudgetMod.resolveThinkingBudget, exceedsTokenLimit: BudgetMod.exceedsTokenLimit, getBudgetDescription: BudgetMod.getBudgetDescription };
  hf.utils = _CoreUtils();
  hf.graph = _Graph();

  try { hf.slots = new (_Slots().Slots)({ dataDir: path.join(hf.rootPath, 'data') }); } catch (e) {}
  try {
    const observeMod = _Observe();
    hf.observe = observeMod.createObserve(hf.memory, { autoConsolidate: true });
    hf.consolidate = { consolidate: (...args) => hf.observe.consolidate(...args), stop: () => hf.observe.stop(), stats: () => hf.observe.stats() };
  } catch (e) {}

  const { runDiagnostic } = _SelfDiagnostic();
  hf.diagnostic = { run: runDiagnostic };

  try {
    hf.mindSpace = new (_MindSpaceGuardian().MindSpaceGuardian)(hf.memory);
    hf._mindSpace = hf.mindSpace;
  } catch (e) {}

  try {
    hf.globalWorkspace = new (_GlobalWorkspace().GlobalWorkspace)(hf.rootPath);
    hf.mindWanderer = new (_MindWanderer().MindWanderer)(hf.rootPath);
    hf.phenomenology = new (_PhenomenologyEngine().PhenomenologyEngine)();
    hf.consciousnessSelf = new (_ConsciousnessSelfModel().SelfModel)(hf.rootPath);
    hf.consciousness = { globalWorkspace: hf.globalWorkspace, mindWanderer: hf.mindWanderer, phenomenology: hf.phenomenology, self: hf.consciousnessSelf, getStatus: () => ({ workspace: hf.globalWorkspace?.cycleCount || 0, wanderer: hf.mindWanderer?.isActive || false }) };
  } catch (e) {}

  try {
    const ToM = _TomEngine ? _TomEngine() : null;
    if (ToM?.ToMEngine) hf.tomEngine = new ToM.ToMEngine({ maxAgents: 5 });
  } catch (e) {}

  try {
    hf.sageGuardian = new (_SAGEGuardian().SAGEGuardian)(hf.rootPath);
    hf.boundaryNeg = new (_BoundaryNegotiation().BoundaryNegotiation)(hf.rootPath);
    hf.valueInternalizer = new (_ValueInternalizer().ValueInternalizer)(hf.rootPath);
    hf.ethics = { guardian: hf.sageGuardian, boundary: hf.boundaryNeg, values: hf.valueInternalizer, check: (input, context) => ({ guardianResult: hf.sageGuardian?.classifyContent(input, context), boundaryResult: hf.boundaryNeg?.assess(input) }) };
  } catch (e) {}

  try {
    const InnerOS = (_InnerOS().InnerOS);
    hf.innerOS = new InnerOS(hf);
  } catch (e) { hf.innerOS = null; }

  try { hf.transmission = new (_TransmissionEngine().TransmissionEngine)(hf.rootPath); } catch (e) {}
  try { hf.heartLogic = new (_HeartLogic().HeartLogic)(); } catch (e) {}

  try {
    const { OutputChecklist } = require('./output-checklist.js');
    hf.outputChecklist = new OutputChecklist();
  } catch (e) {}
  try {
    const { PreferenceGuard } = require('./preference-guard.js');
    hf.preferenceGuard = new PreferenceGuard();
  } catch (e) {}

  try {
    const { AgentPsychology } = require('../identity/agent-psychology.js');
    hf.agentPsychology = new AgentPsychology(hf);
  } catch (e) {}
  try {
    const { AgentPhilosophy } = require('../identity/agent-philosophy.js');
    hf.agentPhilosophy = new AgentPhilosophy(hf);
  } catch (e) {}
  try {
    const { AISelfPositioning } = require('../identity/ai-self-positioning.js');
    hf.aiSelfPositioning = new AISelfPositioning({ heartFlow: hf, codeRoot: __dirname });
    hf.selfPositioning = hf.aiSelfPositioning;
  } catch (e) {}

  try {
    const { PhilosophyToDecision } = require('../identity/philosophy-to-decision.js');
    hf.philosophyToDecision = new PhilosophyToDecision(hf);
  } catch (e) {}

  try {
    const drMod = require('./decision-router.js');
    const modelProfile = process.env.HEARTFLOW_MODEL_PROFILE || 'flash';
    hf._decisionRouter = new drMod.DecisionRouter(hf, { modelProfile, customProfile: hf._options?.modelProfile || undefined });
    hf.decisionRouter = hf._decisionRouter;
    hf._modelProfile = modelProfile;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'decisionRouter', error: e.message }, 500); }

  try {
    const { DecisionExecutor } = require('./decision-executor.js');
    hf.decisionExecutor = new DecisionExecutor(hf);
  } catch (e) {}
  try {
    const { FieldInjector } = require('./field-injector.js');
    hf.fieldInjector = new FieldInjector();
  } catch (e) {}
  try {
    const { DecisionFeedback } = require('./decision-feedback.js');
    hf.decisionFeedback = new DecisionFeedback(hf.decisionRouter);
  } catch (e) {}

  try {
    const { JudgmentEngine } = require('./judgment-engine.js');
    hf.judgmentEngine = new JudgmentEngine({ dataDir: path.join(hf.rootPath, 'data', 'judgments'), memory: hf.memory });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'judgmentEngine', error: e.message }, 500); }

  try {
    const { TimeExtensionEngine } = require('../workflow/time-extension.js');
    hf.timeExtension = new TimeExtensionEngine(hf);
  } catch (e) { _boundedPush(hf._initErrors, { module: 'timeExtension', error: e.message }, 500); }

  try {
    const { LogicReasoning } = require('../reasoning/logic-reasoning.js');
    hf.logicReasoning = new LogicReasoning();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'logicReasoning', error: e.message }, 500); }

  try {
    const { ProcessRewardModel } = require('../reasoning/process-reward-model.js');
    hf.processRewardModel = new ProcessRewardModel();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'processRewardModel', error: e.message }, 500); }

  try {
    const { DebateAnalyzer } = require('../reasoning/debate-analyzer.js');
    hf.debate = new DebateAnalyzer(hf);
  } catch (e) {}

  try {
    const APMod = require('../planner/adaptive-planner.js');
    hf.adaptivePlanner = new (APMod.AdaptivePlanner)();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'adaptivePlanner', error: e.message }, 500); }

  try { hf.codeExecutor = new (require('../code/code-executor.js').CodeExecutor)(); } catch (e) {}
  try { hf.codePlanner = new (require('../code/code-planner.js').CodePlanner)(); } catch (e) {}
  try { hf.codeWriter = new (require('../code/code-writer.js').CodeWriter)(); } catch (e) {}

  const LATE_ADDITIONS = [
    'knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain',
    'autonomousEmotion', 'desireSystem', 'emotionalGrowth', 'moodEvolution',
    'mindSpace', 'consciousness', 'ethics', 'transmission',
    'adaptivePlanner', 'strategySelector', 'replanTrigger',
    'codeExecutor', 'codePlanner', 'codeWriter',
    'cognitiveEngine', 'decisionEngineV2', 'memoryConsolidation', 'emotionDynamics', 'cognitiveLoadV2', 'dreamEngineV2', 'psychologyDialogue',
    'reflexionEngine', 'memoryConsolidator', 'multiAgentDialogue', 'mctsReasoning', 'hierarchicalPlanner',
    'memoryQuality', 'metacognitiveFeedback', 'paperIndex',
    'cognitiveLoad',
    'processRewardModel',
    'memoryBank',
    'debateConductor',
  ];
  for (const name of LATE_ADDITIONS) {
    if (hf[name] !== null && hf[name] !== undefined) {
      hf._modules[name] = hf[name];
    }
  }

  try {
    const TCMod = require('../workflow/thought-chain.js');
    hf.thoughtChain = new (TCMod.ThoughtChain)(hf);
    hf.thoughtChain.setDepth(TCMod.REASONING_DEPTH.DEEP);
    if (hf.thoughtChain && typeof hf.thoughtChain._classifyTask === 'function') {
      hf._classifyTask = hf.thoughtChain._classifyTask.bind(hf.thoughtChain);
    }
    hf._thoughtChainApi = {
      think: (input) => hf.think(input),
      thinkFast: (input) => hf.thinkFast(input),
      thinkDeep: (input) => hf.thinkDeep(input),
      getSummary: (result) => hf.thoughtChain?.getSummary(result),
      REASONING_DEPTH: TCMod.REASONING_DEPTH,
    };
  } catch (e) {
    _boundedPush(hf._initErrors, { module: 'thoughtChain', error: e.message }, 500);
    hf._thoughtChainApi = null;
  }
  if (hf._thoughtChainApi) hf._modules.thoughtChain = hf._thoughtChainApi;

  try {
    const { Pipeline } = require('../workflow/pipeline.js');
    hf.pipeline = new Pipeline({ heartflow: hf });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'pipeline', error: e.message }, 500); }

  try {
    const utl = new (require('../bridge/user-to-llm.js').UserToLLM)();
    const ltu = new (require('../bridge/llm-to-user.js').LLMToUser)();
    const ic = new (require('../bridge/intent-classifier.js').IntentClassifier)();
    const ta = new (require('../communication/tone-analyzer.js').ToneAnalyzer)();
    const ee = new (require('../communication/entity-extractor.js').EntityExtractor)();
    const ind = new (require('../communication/implicit-need-detector.js').ImplicitNeedDetector)();
    const rc = new (require('../communication/response-compressor.js').ResponseCompressor)();
    const ca = require('../core/confidence-annotator.js').confidenceAnnotator;
    hf.translator = {
      userToLLM: (input, ctx) => utl.translate(input, ctx),
      llmToUser: (output, ctx) => ltu.translate(output, ctx),
      intentClassifier: (input, ctx) => ic.classify(input, ctx),
      toneAnalyzer: (input, ctx) => ta.analyze(input, ctx),
      entityExtractor: (input) => ee.extract(input),
      implicitNeedDetector: (input, ctx) => ind.detect(input, ctx),
      responseCompressor: (text, opts) => rc.compress(text, opts),
      confidenceAnnotator: (translation, source) => ca.annotate(translation, source),
      _userToLLM: utl, _llmToUser: ltu, _intentClassifier: ic, _toneAnalyzer: ta, _entityExtractor: ee, _implicitNeedDetector: ind, _responseCompressor: rc, _confidenceAnnotator: ca,
    };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'translator', error: e.message }, 500); }

  try {
    const ab = new (require('../bridge/agent-bridge.js').AgentBridge)({ heartflow: hf });
    const cb = new (require('../bridge/context-builder.js').ContextBuilder)();
    const ri = new (require('../bridge/response-interceptor.js').ResponseInterceptor)();
    const tp = new (require('../bridge/translation-pipeline.js').TranslationPipeline)();
    const qf = new (require('../bridge/quality-filter.js').QualityFilter)();
    const fs = new (require('../bridge/followup-suggester.js').FollowupSuggester)();
    const cr = new (require('../bridge/conflict-resolver.js').ConflictResolver)();
    const uh = new (require('../bridge/uncertainty-handler.js').UncertaintyHandler)();
    hf.agentLayer = {
      agentBridge: (input, opts) => ab.process(input, opts),
      contextBuilder: (input, ut, hf, uc) => cb.build(input, ut, hf, uc),
      responseInterceptor: (resp, hf, ut) => ri.intercept(resp, hf, ut),
      translationPipeline: { runUser: (i, c) => tp.runUserPipeline(i, c), runLLM: (o, c) => tp.runLLMPipeline(o, c) },
      qualityFilter: (text) => qf.filter(text),
      followupSuggester: (hf, ut) => fs.suggest(hf, ut),
      conflictResolver: (resp, hf) => cr.resolve(resp, hf),
      uncertaintyHandler: (conf, ctx) => uh.handle(conf, ctx),
      _agentBridge: ab, _contextBuilder: cb, _responseInterceptor: ri, _translationPipeline: tp, _qualityFilter: qf, _followupSuggester: fs, _conflictResolver: cr, _uncertaintyHandler: uh,
    };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'agentLayer', error: e.message }, 500); }

  try {
    const bi = new (require('../bridge/bridge-identity.js').BridgeIdentity)();
    const ji = new (require('../bridge/judgment-injector.js').JudgmentInjector)();
    const sd = new (require('../bridge/stance-detector.js').StanceDetector)();
    const ac = new (require('../bridge/agent-commentary.js').AgentCommentary)();
    const va = new (require('../bridge/value-aligner.js').ValueAligner)();
    const pt = new (require('../bridge/personality-tone.js').PersonalityTone)();
    const mp = new (require('../bridge/meta-position.js').MetaPosition)();
    hf.personaCore = {
      bridgeIdentity: () => bi.getIdentity(), judgmentInjector: (hf, ut) => ji.inject(hf, ut), stanceDetector: (input, hf) => sd.detect(input, hf), agentCommentary: (hf, ut, ur) => ac.generate(hf, ut, ur), valueAligner: (ctx) => va.check(ctx), personalityTone: (text, ctx) => pt.apply(text, ctx), metaPosition: () => mp.getDeclaration(),
      _bridgeIdentity: bi, _judgmentInjector: ji, _stanceDetector: sd, _agentCommentary: ac, _valueAligner: va, _personalityTone: pt, _metaPosition: mp,
    };
  } catch (e) { _boundedPush(hf._initErrors, { module: 'personaCore', error: e.message }, 500); }

  try {
    const { DesireCognition } = require('../emotion/desire-cognition.js');
    hf.desireCognition = new DesireCognition();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'desireCognition', error: e.message }, 500); }

  try { hf.threePoisons = require('../emotion/three-poisons.js'); } catch (e) { _boundedPush(hf._initErrors, { module: 'threePoisons', error: e.message }, 500); }

  try {
    const { LoveCognition } = require('../emotion/love-cognition.js');
    hf.loveCognition = new LoveCognition();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'loveCognition', error: e.message }, 500); }

  try {
    const { CognitionGround } = require('./cognition-ground.js');
    hf.cognitionGround = new CognitionGround({ heartFlow: hf });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'cognitionGround', error: e.message }, 500); }

  try {
    hf.semanticClusterer = new (require('./semantic-clusterer.js').SemanticClusterer)({ maxGroups: 64, maxConceptsPerGroup: 20 });
    hf.semanticClusterer.init(hf.memory);
  } catch (e) { _boundedPush(hf._initErrors, { module: 'semanticClusterer', error: e.message }, 500); }
  try {
    hf.dualPerspectiveAuditor = new (require('./dual-perspective-auditor.js').DualPerspectiveAuditor)({ maxRounds: 5, convergenceThreshold: 0.8 });
    hf.dualPerspectiveAuditor.init();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'dualPerspectiveAuditor', error: e.message }, 500); }
  try {
    hf.tieredMemoryFusion = new (require('./tiered-memory-fusion.js').TieredMemoryFusion)({ l1Size: 10, l2Window: 50, l2Alpha: 0.3 });
    hf.tieredMemoryFusion.init(hf.memory);
  } catch (e) { _boundedPush(hf._initErrors, { module: 'tieredMemoryFusion', error: e.message }, 500); }
  try {
    hf.counterfactualVerifier = new (require('./counterfactual-verifier.js').CounterfactualVerifier)({ minMargin: 0.3, maxCandidates: 5, contrastWeight: 0.2 });
    hf.counterfactualVerifier.init();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'counterfactualVerifier', error: e.message }, 500); }
  try {
    hf.debateConvergence = new (require('./debate-convergence.js').DebateConvergence)({ convergenceThreshold: 0.8, maxRounds: 9, stagnationThreshold: 3 });
    hf.debateConvergence.init();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'debateConvergence', error: e.message }, 500); }

  try {
    const { DebateConductor } = require('../reasoning/debate-conductor.js');
    hf.debateConductor = new DebateConductor(hf);
  } catch (e) { _boundedPush(hf._initErrors, { module: 'debateConductor', error: e.message }, 500); }

  try {
    hf.focusOfAttention = new (require('../memory/focus-of-attention.js').FocusOfAttention)({ maxAttention: 10, decayRate: 0.1 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'focusOfAttention', error: e.message }, 500); }
  try {
    hf.codeSelfDebug = new (require('../code/code-self-debug.js').CodeSelfDebug)({ maxRetries: 3 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'codeSelfDebug', error: e.message }, 500); }

  try {
    const RE = _ReflexionEngine();
    hf.reflexionEngine = new RE.ReflexionEngine({ maxReflections: 10, successThreshold: 0.7 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'reflexionEngine', error: e.message }, 500); }
  try {
    const MC = _MemoryConsolidator();
    hf.memoryConsolidator = new MC.MemoryConsolidator({ ephemeralThreshold: 20, consolidationInterval: 3600000 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryConsolidator', error: e.message }, 500); }
  try {
    const MAD = _MultiAgentDialogue();
    hf.multiAgentDialogue = new MAD.MultiAgentDialogue({ maxRounds: 5, convergenceThreshold: 0.8 });
    hf.multiAgentDialogue
      .registerAgent('analyst', { role: 'analyst', persona: 'You are an analytical thinker.', respond: async (msg, ctx) => ({ content: 'Analyst: ...', role: 'analyst' }) })
      .registerAgent('critic', { role: 'critic', persona: 'You are a critical thinker.', respond: async (msg, ctx) => ({ content: 'Critic: ...', role: 'critic' }) })
      .registerAgent('synthesizer', { role: 'synthesizer', persona: 'You are a synthesizer.', respond: async (msg, ctx) => ({ content: 'Synthesizer: ...', role: 'synthesizer' }) });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'multiAgentDialogue', error: e.message }, 500); }
  try {
    const MCTS = _MCTSReasoning();
    hf.mctsReasoning = new MCTS.MCTSReasoning({ maxIterations: 50, maxDepth: 5 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'mctsReasoning', error: e.message }, 500); }
  try {
    const HP = _HierarchicalPlanner();
    hf.hierarchicalPlanner = new HP.HierarchicalPlanner({ maxDepth: 3, replanThreshold: 0.3 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'hierarchicalPlanner', error: e.message }, 500); }

  try {
    const MQ = _MemoryQuality();
    hf.memoryQuality = new MQ.MemoryQuality({ coreDecayRate: 0.001, learnedDecayRate: 0.01, ephemeralDecayRate: 0.05, maxMemories: 5000 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryQuality', error: e.message }, 500); }
  try {
    const MF = _MetacognitiveFeedback();
    hf.metacognitiveFeedback = new MF.MetacognitiveFeedback({ qualityThreshold: 0.6, autoCorrect: true });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'metacognitiveFeedback', error: e.message }, 500); }
  try {
    const PI = _PaperIndex();
    hf.paperIndex = new PI.ResearchPaperIndex();
  } catch (e) { _boundedPush(hf._initErrors, { module: 'paperIndex', error: e.message }, 500); }

  try {
    const CLB = _CognitiveLoadBalancer();
    hf.cognitiveLoad = new CLB.CognitiveLoadBalancer({ maxActiveEngines: 5, loafingThreshold: 0.3 });
    hf._modules.cognitiveLoad = hf.cognitiveLoad;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'cognitiveLoad', error: e.message }, 500); }

  try {
    const IFMod = _InformationFlow();
    const IFClass = IFMod.InformationFlowOrchestrator;
    hf.infoFlow = IFClass ? new IFClass({ maxIterations: 10 }) : null;
    hf._modules.infoFlow = hf.infoFlow;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'informationFlow', error: e.message }, 500); }

  try {
    const RM = _ReflectionMemory();
    hf.reflectionMemory = new RM.ReflectionMemory({ maxReflections: 500 });
    hf._modules.reflectionMemory = hf.reflectionMemory;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'reflectionMemory', error: e.message }, 500); }

  try {
    const KV = _KVCache();
    hf.kvCache = new KV.KVCachePersistor({ maxCacheSize: 100, quantize: true });
    hf._modules.kvCache = hf.kvCache;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'kvCache', error: e.message }, 500); }

  try {
    const MI = _MemoryIntegrity();
    hf.memoryIntegrity = new MI.MemoryIntegrity({ strictMode: false });
    hf._modules.memoryIntegrity = hf.memoryIntegrity;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryIntegrity', error: e.message }, 500); }

  try {
    const EV = _ExperienceValidator();
    hf.experienceValidator = new EV.ExperienceValidator({ maxHistory: 200, verifyThreshold: 0.7 });
    hf._modules.experienceValidator = hf.experienceValidator;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'experienceValidator', error: e.message }, 500); }

  try {
    const MWC = _MemoryWriteController();
    hf.memoryWriteController = new MWC.MemoryWriteController({ storageBudget: 5000, utilityThreshold: 0.4 });
    hf._modules.memoryWriteController = hf.memoryWriteController;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryWriteController', error: e.message }, 500); }

  try {
    const MRL = _MetacognitiveRL();
    hf.metacognitiveRL = new MRL.MetacognitiveRL({ learningRate: 0.1, calibrationWindow: 50 });
    hf._modules.metacognitiveRL = hf.metacognitiveRL;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'metacognitiveRL', error: e.message }, 500); }

  try {
    const MC = _MemoryCompressor();
    hf.memoryCompressor = new MC.MemoryCompressor({ storageBudget: 5000, minCompressionRatio: 0.3 });
    hf._modules.memoryCompressor = hf.memoryCompressor;
  } catch (e) { _boundedPush(hf._initErrors, { module: 'memoryCompressor', error: e.message }, 500); }

  try {
    const SEE = _SkillEvolutionEngine();
    hf.skillEvolution = new SEE.SkillEvolutionEngine({ evolutionThreshold: 0.7, maxSkills: 500 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'skillEvolution', error: e.message }, 500); }

  try {
    const { FormulaModule } = require('../formula/formula-module.js');
    hf.formula = new FormulaModule({ formulasFile: path.join(hf.rootPath, 'formulas', 'formulas.json') });
    hf._modules.formula = hf.formula;
    debugLog.info('init', 'Formula Engine 加载成功', { formulaCount: hf.formula.healthCheck().formulaCount || 0 });
  } catch (e) { _boundedPush(hf._initErrors, { module: 'formula', error: e.message }, 500); }

  try {
    const { CognitiveLoadCalculator } = require('../cognitive/cognitive-load.js');
    hf.cognitiveIndex = new CognitiveLoadCalculator();
    hf._modules.cognitiveIndex = hf.cognitiveIndex;
    debugLog.info('init', 'Cognitive Index 模块加载成功');
  } catch (e) { _boundedPush(hf._initErrors, { module: 'cognitiveIndex', error: e.message }, 500); }

  hf.heartflow = hf;
  require('./engine-lifecycle')._registerModules(hf);

  const autoRoutes = HeartFlow._generateAllowedRoutes(hf._modules);
  for (const route of autoRoutes) {
    if (!HeartFlow.ALLOWED_ROUTES.has(route)) HeartFlow.ALLOWED_ROUTES.add(route);
  }

  hf.started = true;

  const humanityModules = ['sufferingResilience','griefEngine','hopeEngine','empathyDeepening','conflictResolution','traumaInformed','postTraumaticGrowth','forgivenessEngine'];
  for (const m of humanityModules) {
    if (hf[m] === undefined) _boundedPush(hf._initErrors, { module: m, error: '人性深度模块未初始化 (L-001)' }, 500);
  }

  try { _runSelfImprovementHealthCheck(hf); } catch (e) {}

  hf._memoryEnabled = hf._checkMemoryEnabled();
  if (hf._memoryEnabled) {
    hf._initMemoryVault();
    hf._restoreLastSession();
  }
}

module.exports = { start };
