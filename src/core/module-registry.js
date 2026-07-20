/**
 * Module Registry — extracted from heartflow.js
 *
 * Responsibilities:
 *  - Maintain the canonical list of subsystem names for registration
 *  - Register initialized instances into HeartFlow._modules
 *  - Expose special-module factory helpers used by lazy dispatch
 */

const path = require('path');

function _boundedPush(arr, item, maxSize = 500) {
  if (arr.length >= maxSize) arr.shift();
  arr.push(item);
}

// ─── Special module registry (v5.8.0) ────────────────────────────────────────
// entry: { type: 'object'|'ctor'|'ctor-hf'|'ctor-path'|'ctor-args'|'special', factory: Function|string, path?, ctor?, args? }
const SPECIAL_MODULES = {
  bigFive:         { type: 'object',  factory: () => require('../identity/BigFivePersonality.js') },
  empathy:         { type: 'object',  factory: () => require('../identity/EmpathyAssessment.js') },
  knowledgeGraph:  { type: 'ctor',    factory: () => new (require('../memory/knowledge-graph.js').KnowledgeGraph)({ dataDir: path.join(__dirname, '..', '..', 'data') }) },
  intentLayer:     { type: 'ctor-path', path: './intent-layer.js', ctor: 'IntentLayer', args: { projectRoot: path.join(__dirname, '..', '..') } },
  epistemicSafety: { type: 'object',  factory: () => require('../shield/epistemic-safety.js') },
  deliberationGate:{ type: 'ctor',    factory: () => new (require('../shield/deliberation-gate.js').DeliberationGate)() },
  flowPredictor:   { type: 'ctor',    factory: () => new (require('./flow-predictor.js').FlowPredictor)() },
  safetyGuardrails:{ type: 'object',  factory: () => require('../shield/safety-guardrails.js') },
  userModel:       { type: 'ctor',    factory: () => new (require('../identity/user-model.js').UserModel)() },
  actionTracker:   { type: 'ctor',    factory: () => new (require('./action-tracker.js').ActionTracker)() },
  purposeEngine:   { type: 'ctor',    factory: () => new (require('../identity/purpose-engine.js').PurposeEngine)() },
  riskAnalyzer:    { type: 'ctor',    factory: () => new (require('../reasoning/risk-benefit-analyzer.js').RiskBenefitAnalyzer)() },
  adaptiveCtrl:    { type: 'ctor',    factory: () => new (require('./adaptive-controller.js').AdaptiveController)() },
  intentionTrack:  { type: 'ctor',    factory: () => new (require('./IntentionTracker.js').IntentionTracker)() },
  auditLogger:     { type: 'ctor',    factory: () => new (require('../shield/audit-logger.js').AuditLogger)() },
  adaptivePlanner: { type: 'special', factory: 'adaptivePlanner' },
  strategyAdapter: { type: 'special', factory: 'strategyAdapter' },
  knowledgeBase:   { type: 'ctor-args', factory: () => ({ path: '../reasoning/knowledge-base.js', ctor: 'KnowledgeBase', args: { storagePath: path.join(__dirname, '..', '..', 'data', 'knowledge') } }) },
  sessionMemory:   { type: 'ctor-args', factory: () => ({ path: '../memory/session-memory.js', ctor: 'SessionMemory', args: { storagePath: path.join(__dirname, '..', '..', 'data', 'sessions') } }) },
  projectContext:  { type: 'ctor-args', factory: () => ({ path: '../memory/project-context.js', ctor: 'ProjectContext', args: { storagePath: path.join(__dirname, '..', '..', 'data', 'projects') } }) },
  longTermMemory:  { type: 'ctor-args', factory: () => ({ path: '../memory/long-term-memory.js', ctor: 'LongTermMemory', args: { storagePath: path.join(__dirname, '..', '..', 'data', 'longterm') } }) },
  crossSessionIndex:{ type: 'ctor-args', factory: () => ({ path: '../memory/cross-session-index.js', ctor: 'CrossSessionIndex', args: { storagePath: path.join(__dirname, '..', '..', 'data', 'cross-session') } }) },
  codeExecutor:    { type: 'ctor-hf',  factory: () => ({ path: '../code/code-executor.js', ctor: 'CodeExecutor', args: { hf: null } }) },
  codePlanner:     { type: 'ctor-hf',  factory: () => ({ path: '../code/code-planner.js', ctor: 'CodePlanner', args: { hf: null } }) },
};

function createSpecialModule(subsystem, hf) {
  switch (subsystem) {
    case 'adaptivePlanner': {
      const baseDir = path.join(__dirname, '..', 'planner');
      hf.strategySelector = new (require(path.join(baseDir, 'strategy-selector.js')).StrategySelector)();
      hf.replanTrigger = new (require(path.join(baseDir, 'replan-trigger.js')).ReplanTrigger)();
      return new (require(path.join(baseDir, 'adaptive-planner.js')).AdaptivePlanner)({ strategySelector: hf.strategySelector, replanTrigger: hf.replanTrigger });
    }
    case 'strategyAdapter': {
      const ec = require('../cortex/experience-collector.js').ExperienceCollector;
      hf.experienceCollector = new ec({ storagePath: path.join(hf.rootPath, 'data/experiences') });
      return new (require('../cortex/strategy-adapter.js').StrategyAdapter)({ experienceCollector: hf.experienceCollector });
    }
    default:
      return null;
  }
}

function instantiateSpecialModule(subsystem, Mod, hf) {
  const spec = SPECIAL_MODULES[subsystem];
  if (!spec) return null;

  switch (spec.type) {
    case 'object':
      return spec.factory();
    case 'ctor': {
      const mod = spec.factory();
      return mod;
    }
    case 'ctor-path': {
      const mod = require(spec.path);
      return new mod[spec.ctor](spec.args);
    }
    case 'ctor-args': {
      const info = spec.factory();
      const mod = require(info.path);
      return new mod[info.ctor](info.args);
    }
    case 'ctor-hf': {
      const info = spec.factory();
      const mod = require(info.path);
      return new mod[info.ctor]({ ...info.args, hf });
    }
    case 'special':
      return createSpecialModule(subsystem, hf);
    default:
      return null;
  }
}

// ─── Canonical subsystem registry ────────────────────────────────────────────

const SUBSYSTEM_NAMES = [
  'identityCore',
  'cognitive',
  'memory', 'knowledge',
  'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
  'evolution', 'dream', 'lesson', 'meta',
  'self', 'psychology', 'emotion', 'agentPsychology', 'agentPhilosophy', 'selfPositioning',
  'truth',
  'behavior',
  'persistence',
  'triality',
  'stability', 'confidence', 'restraint', 'arbitration',
  'snapshot', 'error', 'embodied', 'workflow', 'verifierGrant',
  'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
  'metaJudgment', 'metaMemory', 'skillGenerator',
  'metaPrompt',
  'got',
  'constitutional',
  'thoughtChain',
  'debate',
  'heartLogic',
  'cognitiveEngine',
  'adaptivePlanner', 'strategySelector', 'replanTrigger',
  'codeExecutor', 'codePlanner', 'codeWriter',
  'mindSpace',
  'consciousness', 'tomEngine',
  'ethics',
  'transmission',
  'translator', 'agentLayer', 'personaCore',
  'philosophyToDecision',
  'decisionRouter',
  'timeExtension',
  'desireCognition',
  'loveCognition',
  'threePoisons',
  'cognitionGround',
  'semanticClusterer', 'dualPerspectiveAuditor', 'tieredMemoryFusion',
  'counterfactualVerifier', 'debateConvergence',
  'debateConductor',
  'judgmentEngine',
  'selfPlay',
  'selfHealing',
  'capabilityAbstraction', 'platformAdapter',
  'logicReasoning',
  'pipeline',
  'heartflow',
  'innerOS',
  'focusOfAttention', 'codeSelfDebug',
  'reflexionEngine', 'memoryConsolidator', 'multiAgentDialogue', 'mctsReasoning', 'hierarchicalPlanner',
  'memoryQuality', 'metacognitiveFeedback', 'paperIndex',
  'cognitiveLoad',
  'processRewardModel',
  'memoryBank',
  'infoFlow', 'reflectionMemory', 'kvCache', 'memoryIntegrity',
  'experienceValidator', 'memoryWriteController', 'metacognitiveRL',
  'memoryCompressor', 'skillEvolution', 'worldModel',
  'virtueEthics', 'humanNature', 'meaningPurpose',
  'characterCultivation', 'moralDevelopment', 'wisdomEngine',
  'sufferingResilience', 'griefEngine', 'hopeEngine',
  'humanRelation', 'empathyDeepening', 'conflictResolution',
  'traumaInformed', 'postTraumaticGrowth', 'forgivenessEngine',
  'aiHumanIntegration', 'beingMode', 'consciousnessBridge', 'narrativeSelf',
  'sustainedDriftDetector',
  'formula',
  'cognitiveIndex',
  'knowledge', 'reasoning',
  'decisionEngineV2', 'memoryConsolidation', 'emotionDynamics', 'cognitiveLoadV2', 'dreamEngineV2',
  'psychologyDialogue',
  'persona',
  'personaConsistency'
];

function registerModules(instance, initErrors, log) {
  const modules = {};
  for (const name of SUBSYSTEM_NAMES) {
    if (instance[name] !== null && instance[name] !== undefined) {
      modules[name] = instance[name];
    }
  }

  if (initErrors && initErrors.length > 0 && log) {
    log.warn('init', `${initErrors.length} 模块初始化失败`, {
      count: initErrors.length,
      errors: initErrors.map(e => ({ module: e.module, error: e.error })),
    });
  }

  return modules;
}

// ─── Allowed-route generation ────────────────────────────────────────────────

const METHOD_BLACKLIST = new Set([
  'on', 'off', 'addListener', 'removeListener', 'once',
  'prependListener', 'prependOnceListener', 'removeAllListeners',
  'setMaxListeners', 'getMaxListeners', 'listenerCount', 'listeners',
  'rawListeners', 'eventNames', 'constructor'
]);

function generateAllowedRoutes(modules) {
  if (!modules || typeof modules !== 'object') return [];
  const routes = [];
  for (const [name, mod] of Object.entries(modules)) {
    if (!mod) continue;
    let methods = [];
    try {
      const proto = Object.getPrototypeOf(mod);
      if (proto && proto !== Object.prototype) {
        methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && !METHOD_BLACKLIST.has(m) && typeof mod[m] === 'function' && !m.startsWith('_'));
      }
    } catch (e) { /* fall through */ }
    if (!methods.length) {
      methods = Object.keys(mod).filter(k => !METHOD_BLACKLIST.has(k) && !k.startsWith('_') && typeof mod[k] === 'function');
    }
    for (const method of methods) {
      _boundedPush(routes, `${name}.${method}`);
    }
  }
  return routes;
}

module.exports = {
  SPECIAL_MODULES,
  createSpecialModule,
  instantiateSpecialModule,
  SUBSYSTEM_NAMES,
  registerModules,
  generateAllowedRoutes,
  METHOD_BLACKLIST,
};
