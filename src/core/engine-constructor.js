#!/usr/bin/env node
/**
 * engine-constructor — HeartFlow constructor extraction
 * Extracts constructor logic into smaller methods (v6.0.1)
 */

const path = require('path');
const debugLog = require('../utils/debug-log');
const { _getConfig } = require('./engine-state');

// Lazy loaders from heartflow.js
const _Budget = () => require('./budget.js');
const _Graph = () => require('../memory/graph.js');
const _CoreUtils = () => require('./utils.js');
const _Slots = () => require('../memory/slots.js');
const _Observe = () => require('../memory/observe.js');
const _StateSnapshot = () => require('./state-snapshot.js');
const _ErrorHandler = () => require('./error-handler.js');
const _SelfDiagnostic = () => require('./self-diagnostic.js');

function initializeSubsystemSlots(hf) {
  hf.identityCore = null;
  hf.cognitive = null;
  hf.memory = null;
  hf.knowledge = null;
  hf.anchor = null;
  hf.reasoning = null;
  hf.counterfactual = null;
  hf.verify = null;
  hf.execution = null;
  hf.decision = null;
  hf.decisionVerifier = null;
  hf.evolution = null;
  hf.dream = null;
  hf.dreamConsolidation = null;
  hf.lesson = null;
  hf.meta = null;
  hf.metaJudgment = null;
  hf.metaMemory = null;
  hf.skillGenerator = null;
  hf.self = null;
  hf.being = null;
  hf.psychology = null;
  hf.emotion = null;
  hf.truth = null;
  hf.security = null;
  hf.language = null;
  hf.stability = null;
  hf.confidence = null;
  hf.restraint = null;
  hf.arbitration = null;
  hf.snapshot = null;
  hf.error = null;
  hf.embodied = null;
  hf.workflow = null;
  hf.mentalEffort = null;
  hf.behavior = null;
  hf.persistence = null;
  hf.judgmentEngine = null;
  hf.capabilityAbstraction = null;
  hf.platformAdapter = null;
  hf.bm25 = null;
  hf.hybrid = null;
  hf.budget = null;
  hf.graph = null;
  hf.utils = null;
  hf.slots = null;
  hf.observe = null;
  hf.consolidate = null;
  hf.thoughtChain = null;
  hf.pipeline = null;
  hf.adaptivePlanner = null;
  hf.strategySelector = null;
  hf.replanTrigger = null;
  hf.experienceCollector = null;
  hf.strategyAdapter = null;
  hf.failureAnalyzer = null;
  hf.qualityVerifier = null;
  hf.outputChecker = null;
  hf.patternMatcher = null;
  hf.focusOfAttention = null;
  hf.codeSelfDebug = null;
  hf.reflexionEngine = null;
  hf.memoryConsolidator = null;
  hf.multiAgentDialogue = null;
  hf.mctsReasoning = null;
  hf.hierarchicalPlanner = null;
  hf.curiosityEngine = null;
  hf.desireEngine = null;
  hf.goalPursuer = null;
  hf.selfInitiator = null;
  hf.sessionMemory = null;
  hf.projectContext = null;
  hf.longTermMemory = null;
  hf.crossSessionIndex = null;
  hf.memoryBank = null;
  hf.knowledgeBase = null;
  hf.commonsenseEngine = null;
  hf.causalInference = null;
  hf.inferenceChain = null;
  hf.processRewardModel = null;
  hf.autonomousEmotion = null;
  hf.desireSystem = null;
  hf.emotionalGrowth = null;
  hf.moodEvolution = null;
  hf.thinkcheckLogger = null;
  hf.sessionMemory = null;
  hf.projectContext = null;
  hf.longTermMemory = null;
  hf.crossSessionIndex = null;
  hf.consciousness = null;
  hf.ethics = null;
  hf.transmission = null;
}

function initializeConfig(hf, config) {
  const projectRoot = config.rootPath || path.join(__dirname, '..', '..');
  const cfg = _getConfig(projectRoot);
  hf._configSystem = cfg;

  if (Object.keys(config).length > 0) {
    for (const [k, v] of Object.entries(config)) {
      cfg.set(k, v);
    }
  }

  hf.config = cfg.toEngineConfig();
  hf.config.rootPath = projectRoot;
  hf.startTime = null;
  hf.sessionId = cfg.get('sessionId') || null;
  hf.started = false;
  hf.rootPath = projectRoot;
  hf._initErrors = [];
  hf._llmFallback = null;
}

function initializeLazyRegistry(hf) {
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
}

function registerBuiltinSingletons(hf) {
  const BudgetMod = _Budget();
  hf.budget = {
    Budget: BudgetMod.Budget,
    countTokens: BudgetMod.countTokens,
    resolveThinkingBudget: BudgetMod.resolveThinkingBudget,
    exceedsTokenLimit: BudgetMod.exceedsTokenLimit,
    getBudgetDescription: BudgetMod.getBudgetDescription,
  };
  hf.utils = _CoreUtils();
  hf.graph = _Graph();

  try {
    hf.slots = new (_Slots().Slots)({ dataDir: path.join(hf.rootPath, 'data') });
  } catch (e) { /* slots optional */ }
  try {
    const observeMod = _Observe();
    hf.observe = observeMod.createObserve(hf.memory, { autoConsolidate: true });
    hf.consolidate = {
      consolidate: (...args) => hf.observe.consolidate(...args),
      stop: () => hf.observe.stop(),
      stats: () => hf.observe.stats(),
    };
  } catch (e) { /* observe optional */ }

  const { runDiagnostic } = _SelfDiagnostic();
  hf.diagnostic = { run: runDiagnostic };

  hf.snapshot = _StateSnapshot();
  hf.error = _ErrorHandler();
}

module.exports = {
  initializeSubsystemSlots,
  initializeConfig,
  initializeLazyRegistry,
  registerBuiltinSingletons,
};
