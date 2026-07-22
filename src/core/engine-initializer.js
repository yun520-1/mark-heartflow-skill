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











// [REFACTOR] 拆分超长 start() 函数 (678行 -> 协调器+6子函数)
function start(hf, HeartFlowClass) {
  if (hf.started) return;
  hf.startTime = Date.now();
  hf.sessionId = `session-${hf.startTime}`;
  hf.version = _VERSION().VERSION;

  // 身份核心 — 第一优先加载
  try {
    hf.identityCore = new (require('../identity/identity-core.js').IdentityCore)(hf.rootPath);
    const identityResult = hf.identityCore.boot();
    if (identityResult.success) {
      const lastContext = hf.identityCore.getLastSessionContext();
      if (lastContext && lastContext.bootTime) {
        const gapMinutes = Math.round((hf.startTime - lastContext.bootTime) / 60000);
        if (gapMinutes > 0) console.log(`[HeartFlow] 上次会话距现在 ${gapMinutes} 分钟`);
      }
    }
    hf.identityCore.updateUserProfile({ lastLogin: new Date().toISOString() });
  } catch (e) { hf._initErrors.push({ module: 'identityCore', error: e.message }); }

  _initIdentityAndMemory(hf);
  _initBehaviorAndTracking(hf);
  _initConsciousness(hf);
  _initDecisionAndRouting(hf);
  _initEthicsAndIdentity(hf);

  hf.started = true;
  return hf;
}


module.exports = { start };
