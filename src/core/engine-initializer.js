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
const _TopicScope = () => require('../memory/topic-scope.js');
const _EvolutionLoop = () => require('../cortex/loop.js');
const _MetaJudgment = () => require('./judgment.js');
const _MetaMemory = () => require('./metaMemory.js');
const _StabilityGuard = () => require('./stability-guard.js');
const _ExecutionVerifier = () => require('./execution-verifier.js');
const _HeartFlowDecision = () => require('./decision.js');
const _DecisionVerifier = () => require('./decision-verifier.js');
const _CognitiveEngine = () => require('./cognitive-engine.js');
const _ConfidenceCalibrator = () => require('./confidence-calibrator.js');
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
const _ConsciousnessSelfModel = () => require('../identity/self-model.js');


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
  _initDecisionAndRouting(hf);

  hf.started = true;
  return hf;
}


module.exports = { start };
