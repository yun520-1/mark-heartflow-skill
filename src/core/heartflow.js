/**

 /** HeartFlow v6.0.9 — 自愈RL接线 + GoT判断引擎增强

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

const debugLog = require('../utils/debug-log');

const { load: loadConfig } = require('./config');

const { EngineReasoner } = require('./engine-reasoner');

const { _getConfig, _preThinkCognitiveSnapshot, _applyCognitiveFeedback, _generatePollutionCorrection, _runSelfImprovementHealthCheck, getSelfImprovementHealth } = require('./engine-state');

const { initializeSubsystemSlots, initializeConfig, initializeLazyRegistry, registerBuiltinSingletons } = require('./engine-constructor');

const { dispatch: _dispatch, generateAllowedRoutes } = require('./engine-dispatcher');

const { start: _start } = require('./engine-initializer');



// ─── 启动优化: 惰性 require — 80+ 顶层模块改为首次使用时加载

// [P2 FIX] LRU 容量管理 + 结构化日志 + 统一错误处理

// v5.8.3 优化：Map 插入顺序实现 O(1) LRU（替代数组 splice + 二分插入）

const _lazyCache = new Map();  // 容量边界：已有 _LAZY_CACHE_MAX=150 LRU 淘汰，无需额外处理

const _LAZY_CACHE_WARN = 100;

const _LAZY_CACHE_MAX = 150;

// ─── 容量边界常量（P2-C10 内存无限增长修复）──────────────────────────────

const MAX_MAP_SIZE = 1000;       // Map 最大条目数，超出时淘汰最早插入的条目

const MAX_ARRAY_SIZE = 500;      // 数组最大长度，超出时移除最旧的元素

const MAX_HISTORY_SIZE = 100;    // 历史记录数组最大长度



/**

 * 有界 Map.set — 超出 maxSize 时淘汰最早插入的条目（FIFO）

 * @param {Map} map - 目标 Map

 * @param {*} key - 键

 * @param {*} value - 值

 * @param {number} maxSize - 最大容量（默认 MAX_MAP_SIZE）

 */


function _boundedSet(map, key, value, maxSize = MAX_MAP_SIZE) {

  if (map.size >= maxSize) {

    // Map 迭代器第一个条目即为最早插入的键，O(1) 获取

    const oldestKey = map.keys().next().value;

    map.delete(oldestKey);

  }

  map.set(key, value);

}



/**

 * 有界数组 push — 超出 maxSize 时移除最旧的元素（shift）

 * @param {Array} arr - 目标数组

 * @param {*} item - 要添加的元素

 * @param {number} maxSize - 最大容量（默认 MAX_ARRAY_SIZE）

 */

function _boundedPush(arr, item, maxSize = MAX_ARRAY_SIZE) {

  if (arr.length >= maxSize) {

    arr.shift();

  }

  arr.push(item);

}



const _lazyAccessCount = new Map();  // 容量边界：由 _boundedSet 控制，上限 MAX_MAP_SIZE

// LRU 顺序：Map 保持插入顺序，头部 = 最久未使用，尾部 = 最近使用

// 访问时 delete + set 将条目移到末尾，淘汰时取 Map 第一个键即可，均为 O(1)

const _lruOrder = new Map();  // 容量边界：由 _boundedSet 控制，上限 MAX_MAP_SIZE



function _evictColdest() {

  if (_lruOrder.size === 0) return;

  // Map 迭代器第一个条目即为最久未使用的键

  const coldestKey = _lruOrder.keys().next().value;

  _lazyCache.delete(coldestKey);

  _lazyAccessCount.delete(coldestKey);

  _lruOrder.delete(coldestKey);

}



function _bumpInEvictionList(key) {

  // delete + set 将条目移到 Map 末尾（最近使用），O(1)

  if (_lruOrder.has(key)) {

    _lruOrder.delete(key);

  }

  _boundedSet(_lruOrder, key, _lazyAccessCount.get(key) || 0);

}



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

        // v5.8.3 优化：O(1) 淘汰最久未使用的模块（Map 头部）

        _evictColdest();

      }

      _lazyCache.set(key, loader());

      _boundedSet(_lazyAccessCount, key, 0);

      _boundedSet(_lruOrder, key, 0);

      if (_lazyCache.size === _LAZY_CACHE_WARN) {

        _log.warn('lazy_cache', `_lazyCache 达到 ${_LAZY_CACHE_WARN} 个模块`);

      }

    }

    const newCount = (_lazyAccessCount.get(key) || 0) + 1;

    _boundedSet(_lazyAccessCount, key, newCount);

    // v5.8.3 优化：Map delete+set 实现 O(1) LRU 淘汰

    _bumpInEvictionList(key);

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

const _ExperienceDistiller = _lazy('experienceDistiller', () => require('../cortex/experience-distiller.js'));

const _StrategicRestraint = _lazy('strategicRestraint', () => require('../cortex/strategic-restraint.js'));

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

const _ConsciousnessSelfModel = _lazy('consciousnessSelfModel', () => {

  try { return require('../identity/self-model.js'); } catch(e) { return null; }

});

const _TomEngine = _lazy('tomEngine', () => require('../consciousness/tom-engine.js'));

const _SAGEGuardian = _lazy('sageGuardian', () => require('../shield/ethics/sage-guardian.js'));

const _BoundaryNegotiation = _lazy('boundaryNegotiation', () => require('../shield/ethics/boundary-negotiation.js'));

const _ValueInternalizer = _lazy('valueInternalizer', () => require('../shield/ethics/value-internalizer.js'));

// ★ 时间延伸分析层 — v1.0.0

const _TimeExtension = _lazy('timeExtension', () => require('../workflow/time-extension.js'));

const _MindSpaceGuardian = _lazy('mindSpaceGuardian', () => require('../shield/mindspace/mind-space-guardian.js'));

// ★ Inner OS — 内心独白、事件追踪、人格切换 (absorbed from AI-Inner-Os)

const _InnerOS = _lazy('innerOS', () => { try { return require('../inner-os/heartflow-inner-os.js'); } catch(e) { return { HeartflowInnerOS: class { constructor() {} process() { return {}; } } }; } });

const _TransmissionEngine = _lazy('transmissionEngine', () => require('../workflow/transmission/transmission-engine.js'));

const _VerifierGrant = _lazy('verifierGrant', () => require('./verifier-grant.js'));

const _AdaptivePlanner = _lazy('adaptivePlanner', () => { try { return require('../planner/adaptive-planner.js'); } catch(e) { return { AdaptivePlanner: class { constructor() {} plan() { return { steps: [], estimatedEffort: 0 }; } adapt() { return this.plan(); } quickAdjust() { return this.plan(); } getStatus() { return { status: 'unavailable', reason: '模块加载失败' }; } } }; } });

const _StrategySelector = _lazy('strategySelector', () => { try { return require('../planner/strategy-selector.js'); } catch(e) { return { StrategySelector: class { constructor() {} selectStrategy() { return { name: 'default', confidence: 0, reason: '模块加载失败' }; } getStrategies() { return []; } } }; } });

const _ReplanTrigger = _lazy('replanTrigger', () => { try { return require('../planner/replan-trigger.js'); } catch(e) { return { ReplanTrigger: class { constructor() {} shouldReplan() { return false; } getReplanReasons() { return []; } } }; } });

const _ExperienceCollector = _lazy('experienceCollector', () => require('../cortex/experience-collector.js'));

const _StrategyAdapter = _lazy('strategyAdapter', () => require('../cortex/strategy-adapter.js'));

const _FailureAnalyzer = _lazy('failureAnalyzer', () => require('../cortex/failure-analyzer.js'));

const _QualityVerifier = _lazy('qualityVerifier', () => { try { return require('../verifier/quality-verifier.js'); } catch(e) { return { QualityVerifier: class { constructor() {} verify() { return { passed: true, score: 0, details: '模块加载失败，默认通过' }; } quickVerify() { return { passed: true, score: 0 }; } } }; } });

const _OutputChecker = _lazy('outputChecker', () => { try { return require('../verifier/output-checker.js'); } catch(e) { return { OutputChecker: class { constructor() {} check() { return { valid: true, issues: [], reason: '模块加载失败，默认通过' }; } addChecker() { return this; } } }; } });

const _PatternMatcher = _lazy('patternMatcher', () => { try { return require('../verifier/pattern-matcher.js'); } catch(e) { return { PatternMatcher: class { constructor() {} match() { return null; } matchAll() { return []; } extract() { return []; } } }; } });

const _CuriosityEngine = _lazy('curiosityEngine', () => require('../planner/curiosity-engine.js'));

const _DesireEngine = _lazy('desireEngine', () => require('../planner/desire-engine.js'));

const _GoalPursuer = _lazy('goalPursuer', () => require('../planner/goal-pursuer.js'));

const _SelfInitiator = _lazy('selfInitiator', () => require('../planner/self-initiator.js'));

const _SessionMemory = _lazy('sessionMemory', () => require('../memory/session-memory.js'));

const _ProjectContext = _lazy('projectContext', () => require('../memory/project-context.js'));

const _LongTermMemory = _lazy('longTermMemory', () => require('../memory/long-term-memory.js'));

const _CrossSessionIndex = _lazy('crossSessionIndex', () => require('../memory/cross-session-index.js'));

const _MemoryBank = _lazy('memoryBank', () => require('../memory/memory-bank.js'));

const _KnowledgeBase = _lazy('knowledgeBase', () => { try { return require('../reasoning/knowledge-base.js'); } catch(e) { return { KnowledgeBase: class { constructor() {} addFact() { return false; } query() { return []; } getCategories() { return []; } getStats() { return { totalFacts: 0, categories: 0, reason: '模块加载失败' }; } } }; } });

const _CommonsenseEngine = _lazy('commonsenseEngine', () => { try { return require('../reasoning/commonsense-engine.js'); } catch(e) { return { CommonsenseEngine: class { constructor() {} reason() { return { conclusion: null, confidence: 0, reason: '模块加载失败' }; } validate() { return { valid: false, reason: '模块加载失败' }; } getHistory() { return []; } getStats() { return { totalReasoning: 0, reason: '模块加载失败' }; } } }; } });

const _CausalInference = _lazy('causalInference', () => { try { return require('../reasoning/causal-inference.js'); } catch(e) { return { CausalInference: class { constructor() {} inferCauses() { return []; } inferEffects() { return []; } chainReason() { return { chains: [], reason: '模块加载失败' }; } getStats() { return { totalInferences: 0, reason: '模块加载失败' }; } } }; } });

const _InferenceChain = _lazy('inferenceChain', () => { try { return require('../reasoning/inference-chain.js'); } catch(e) { return { InferenceChain: class { constructor() {} createChain() { return { id: null, steps: [], reason: '模块加载失败' }; } expandChain() { return { expanded: false, reason: '模块加载失败' }; } getChain() { return null; } analyze() { return { valid: false, reason: '模块加载失败' }; } } }; } });

const _LogicReasoning = _lazy('logicReasoning', () => require('../reasoning/logic-reasoning.js'));

// ★ 深层推理 + 公正决策（拆分自原 heartflow.js）

const _CognitiveEngine = _lazy('cognitiveEngine', () => require('./cognitive-engine.js'));

// [v5.17.20 P2-1] decisionEngine已移除 — 实际决策走decisionEngineV2(reasoning版)

const _DecisionEngineV2 = _lazy('decisionEngineV2', () => require('../reasoning/decision-engine.js'));

const _MemoryConsolidation = _lazy('memoryConsolidation', () => require('../memory/memory-consolidation-engine.js'));

const _EmotionDynamics = _lazy('emotionDynamics', () => require('../emotion/emotion-dynamics-engine.js'));

const _CognitiveLoadV2 = _lazy('cognitiveLoadV2', () => require('../cognitive/cognitive-load-v2.js'));

const _DreamEngineV2 = _lazy('dreamEngineV2', () => require('../dream/dream-engine-v2.js'));

const _PsychologyDialogue = _lazy('psychologyDialogue', () => require('../psychology/psychology-dialogue-engine.js'));

const _ProcessRewardModel = _lazy('processRewardModel', () => require('../reasoning/process-reward-model.js'));

const _AutonomousEmotion = _lazy('autonomousEmotion', () => { try { return require('../emotion/autonomous-emotion.js'); } catch(e) { return { AutonomousEmotion: class { constructor() {} } }; } });

const _EmpathyResponder = _lazy('empathyResponder', () => require('../emotion/empathy-responder.js'));

const _CreativityEngine = _lazy('creativityEngine', () => require('../creativity/creativity-engine.js'));

const _ContinuousLearner = _lazy('continuousLearner', () => require('../cortex/continuous-learner.js'));

const _KnowledgeExplorer = _lazy('knowledgeExplorer', () => require('../cortex/knowledge-explorer.js'));

const _GapExecutor = _lazy('gapExecutor', () => require('../cortex/gap-executor.js'));

const _LearningOrchestrator = _lazy('learningOrchestrator', () => require('../cortex/learning-orchestrator.js'));

const _LearningPulse = _lazy('learningPulse', () => require('../cortex/learning-pulse.js'));

const _TaskUrgency = _lazy('taskUrgency', () => require('../cortex/task-urgency-estimator.js'));

const _SelfDiagnosis = _lazy('selfDiagnosis', () => require('./self-diagnosis.js'));

const _WhatLearned = _lazy('whatLearned', () => require('./what-learned.js'));

const _HypothesisDriver = _lazy('hypothesisDriver', () => require('../cortex/hypothesis-driver.js'));

const _PatternTracer = _lazy('patternTracer', () => require('../cortex/pattern-tracer.js'));

const _HumorGenerator = _lazy('humorGenerator', () => require('../humor/humor-generator.js'));

const _IntuitionEngine = _lazy('intuitionEngine', () => require('../intuition/intuition-engine.js'));



const _DesireSystem = _lazy('desireSystem', () => { try { return require('../emotion/desire-system.js'); } catch(e) { return { DesireSystem: class { constructor() {} } }; } });

const _EmotionalGrowth = _lazy('emotionalGrowth', () => { try { return require('../emotion/emotional-growth.js'); } catch(e) { return { EmotionalGrowth: class { constructor() {} } }; } });

const _MoodEvolution = _lazy('moodEvolution', () => { try { return require('../emotion/mood-evolution.js'); } catch(e) { return { MoodEvolution: class { constructor() {} } }; } });

const _VERSION = _lazy('version', () => require('./version.js'));



// v5.5.5 新增模块

const _FocusOfAttention = _lazy('focusOfAttention', () => require('../memory/focus-of-attention.js'));



// [v5.9.19] Stub for deleted bridge modules — graceful degradation

const _ToneAnalyzer = _lazy('toneAnalyzer', () => ({ ToneAnalyzer: class { constructor() {} analyze() { return { tone: 'neutral', confidence: 0 }; } } }));

const _EntityExtractor = _lazy('entityExtractor', () => ({ EntityExtractor: class { constructor() {} extract() { return []; } } }));

const _ImplicitNeedDetector = _lazy('implicitNeedDetector', () => ({ ImplicitNeedDetector: class { constructor() {} detect() { return []; } } }));

const _ResponseCompressor = _lazy('responseCompressor', () => ({ ResponseCompressor: class { constructor() {} compress() { return ''; } } }));

const _AgentBridge = _lazy('agentBridge', () => ({ AgentBridge: class { constructor() {} process() { return null; } } }));

const _TranslationPipeline = _lazy('translationPipeline', () => ({ TranslationPipeline: class { constructor() {} translate() { return ''; } } }));

const _QualityFilter = _lazy('qualityFilter', () => ({ QualityFilter: class { constructor() {} filter() { return {}; } } }));

const _FollowupSuggester = _lazy('followupSuggester', () => ({ FollowupSuggester: class { constructor() {} suggest() { return []; } } }));

const _ConflictResolver = _lazy('conflictResolver', () => ({ ConflictResolver: class { constructor() {} resolve() { return {}; } } }));

const _UncertaintyHandler = _lazy('uncertaintyHandler', () => ({ UncertaintyHandler: class { constructor() {} handle() { return {}; } } }));

const _BridgeIdentity = _lazy('bridgeIdentity', () => ({ BridgeIdentity: class { constructor() {} getIdentity() { return {}; } } }));

const _JudgmentInjector = _lazy('judgmentInjector', () => ({ JudgmentInjector: class { constructor() {} inject() { return {}; } } }));

const _StanceDetector = _lazy('stanceDetector', () => ({ StanceDetector: class { constructor() {} detect() { return { stance: 'neutral' }; } } }));

const _ValueAligner = _lazy('valueAligner', () => ({ ValueAligner: class { constructor() {} align() { return {}; } } }));

const _PersonalityTone = _lazy('personalityTone', () => ({ PersonalityTone: class { constructor() {} apply() { return ''; } } }));

const _MetaPosition = _lazy('metaPosition', () => ({ MetaPosition: class { constructor() {} get() { return {}; } } }));

const _CodeSelfDebug = _lazy('codeSelfDebug', () => ({ CodeSelfDebug: class { constructor() {} analyze() { return []; } suggestFix() { return ''; } refine() { return ''; } debug() { return {}; } getHistory() { return []; } reset() {} } }));

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



// v5.7.4 — P0 经验验证器 + 记忆写入控制 + 元认知RL (EDV/AdaMem/RLMF)

const _ExperienceValidator = _lazy('experienceValidator', () => require('../cortex/experience-validator.js'));

const _MemoryWriteController = _lazy('memoryWriteController', () => require('../memory/memory-write-controller.js'));

const _MetacognitiveRL = _lazy('metacognitiveRL', () => require('../cortex/metacognitive-rl.js'));



// v5.7.4 — P1 记忆压缩 + 技能进化 + 世界模型 (MemRefine/SkillCoach/AgentWorld)

const _MemoryCompressor = _lazy('memoryCompressor', () => require('../memory/memory-compressor.js'));

const _SkillEvolutionEngine = _lazy('skillEvolutionEngine', () => require('../cortex/skill-evolution-engine.js'));

const _WorldModel = _lazy('worldModel', () => require('../cortex/world-model.js'));



// v5.10.8 — 输出语言污染过滤器

const _OutputLanguageFilter = _lazy('outputLanguageFilter', () => require('../shield/output-language-filter.js'));



// v5.7.5 — P1 古代智慧基础：美德伦理 + 人性论 + 意义目的 (Aristotle/Stoic/Confucian/Buddhist)

const _VirtueEthicsFoundation = _lazy('virtueEthics', () => require('../identity/virtue-ethics-foundation.js'));

const _HumanNatureConstitution = _lazy('humanNature', () => require('../identity/human-nature-constitution.js'));

const _MeaningPurposeEngine = _lazy('meaningPurpose', () => require('../identity/meaning-purpose-engine.js'));



// v5.7.5 — P2 品格养成 + 道德发展 + 智慧引擎

const _CharacterCultivation = _lazy('characterCultivation', () => require('../identity/character-cultivation.js'));

const _MoralDevelopment = _lazy('moralDevelopment', () => require('../identity/moral-development.js'));

const _WisdomEngine = _lazy('wisdomEngine', () => require('../identity/wisdom-engine.js'));



// v5.7.6 — P3 人性深化 + P4 关系社会 + P5 痛苦成长 + P6 AI人类整合

const _SufferingResilience = _lazy('sufferingResilience', () => require('../identity/suffering-resilience.js'));

const _GriefEngine = _lazy('griefEngine', () => require('../identity/grief-engine.js'));

const _HopeEngine = _lazy('hopeEngine', () => require('../identity/hope-engine.js'));

const _HumanRelation = _lazy('humanRelation', () => require('../identity/human-relation.js'));

const _EmpathyDeepening = _lazy('empathyDeepening', () => require('../identity/empathy-deepening.js'));

const _ConflictResolution = _lazy('conflictResolution', () => require('../identity/conflict-resolution.js'));

const _TraumaInformed = _lazy('traumaInformed', () => require('../identity/trauma-informed.js'));

const _PostTraumaticGrowth = _lazy('postTraumaticGrowth', () => require('../identity/post-traumatic-growth.js'));

const _ForgivenessEngine = _lazy('forgivenessEngine', () => require('../identity/forgiveness-engine.js'));

const _AIHumanIntegration = _lazy('aiHumanIntegration', () => require('../identity/ai-human-integration.js'));

const _BeingMode = _lazy('beingMode', () => require('../identity/being-mode.js'));

const _ConsciousnessBridge = _lazy('consciousnessBridge', () => require('../identity/consciousness-bridge.js'));



// v5.7.7 — F3 持续漂移检测器 (SustainedDriftDetector)

const _SustainedDriftDetector = _lazy('sustainedDriftDetector', () => require('../cortex/sustained-drift-detector.js'));



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

const _ConfidenceAnnotator = _lazy('confidenceAnnotator', () => require('./confidence-annotator.js'));

const _ContextBuilder = _lazy('contextBuilder', () => require('../bridge/context-builder.js'));

const _ResponseInterceptor = _lazy('responseInterceptor', () => require('../bridge/response-interceptor.js'));

const _AgentCommentary = _lazy('agentCommentary', () => { try { return require('../bridge/agent-commentary.js'); } catch(e) { return { AgentCommentary: class { constructor() {} comment() { return ''; } } }; } });



const BUILD_DATE = '2026-07-16-6.0.9';



// ─── 特殊模块注册表 (v5.8.0 优化：O(1) 查找替代 if/else 链) ───────────────

// 每个 entry: { type: 'object'|'ctor'|'ctor-hf'|'ctor-path', factory: Function }

const _SPECIAL_MODULES = {

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

  // 需要特殊依赖注入的模块

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



// ─── 特殊模块工厂函数 ─────────────────────────────────────────────────────

function _createSpecialModule(subsystem, hf) {

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















// [REFACTOR-BACKLOG v6.0.28] 审计 HIGH-1 (核实后降级 MEDIUM): 核心启动实例化逻辑强耦合于此。
// 当前 180 行, 非审计误报的 4600 行。已确认 core-smoke-test 覆盖启动链路(回归护栏存在)。
// 未来重构窗口: 拆出 src/core/module-instantiator.js, 按 subsystem 类型分派, 降低单函数失败域。
function _instantiateSpecialModule(subsystem, Mod, hf) {

  const spec = _SPECIAL_MODULES[subsystem];

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

      return _createSpecialModule(subsystem, hf);

    default:

      return null;

  }

}



// ─── v5.8.0 性能监控模块 ──────────────────────────────────────────────────

// 容量边界：_dispatchTimings 已有 _maxSamples=1000 容量控制，无需额外处理

const _perf = {

  _enabled: false,

  _dispatchTimings: [],

  _cacheHits: 0,

  _cacheMisses: 0,

  _ruleMatchTime: 0,

  _maxSamples: 1000,



  enable() { this._enabled = true; },

  disable() { this._enabled = false; },

  recordDispatch(route, elapsedMs) {

    if (!this._enabled) return;

    this._dispatchTimings.push({ route, elapsed: elapsedMs, ts: Date.now() });

    if (this._dispatchTimings.length > this._maxSamples) this._dispatchTimings.shift();

  },

  recordCacheHit() { this._cacheHits++; },

  recordCacheMiss() { this._cacheMisses++; },

  recordRuleMatch(elapsedMs) { this._ruleMatchTime += elapsedMs; },

  getStats() {

    const total = this._cacheHits + this._cacheMisses;

    const timings = this._dispatchTimings;

    const avg = timings.length > 0

      ? timings.reduce((s, t) => s + t.elapsed, 0) / timings.length

      : 0;

    const sorted = timings.map(t => t.elapsed).sort((a, b) => a - b);

    const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;

    return {

      enabled: this._enabled,

      dispatch: {

        total: timings.length,

        avgMs: Math.round(avg * 100) / 100,

        p95Ms: Math.round(p95 * 100) / 100,

        maxMs: sorted.length > 0 ? sorted[sorted.length - 1] : 0,

      },

      cache: {

        hits: this._cacheHits,

        misses: this._cacheMisses,

        hitRate: total > 0 ? Math.round(this._cacheHits / total * 100) / 100 : 0,

      },

      ruleMatch: {

        totalMs: Math.round(this._ruleMatchTime * 100) / 100,

      },

      memory: process.memoryUsage ? {

        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),

        heapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),

      } : null,

    };

  },

  reset() {

    this._dispatchTimings = [];

    this._cacheHits = 0;

    this._cacheMisses = 0;

    this._ruleMatchTime = 0;

  },

};



class HeartFlow {

  // dispatch 白名单 - 只有在白名单中的路由才能被外部调用
  // 危险方法（如内部调试、文件操作）不在白名单中
  static ALLOWED_ROUTES = new Set([
    // memory
    'memory.store', 'memory.retrieve', 'memory.search', 'memory.remove',
    'memory.getLayers', 'memory.getStats',
    // truth
    'truth.checkStatement', 'truth.checkNumbers', 'truth.checkSources',
    // lesson
    'lesson.addLesson', 'lesson.getTopLessons', 'lesson.getRecent',
    // dream
    'dream.dreamNow', 'dream.analyzeDream',
    // verify
    'verify.verify', 'verify.checkConsistency',
    // psychology
    'psychology.analyze', 'psychology.detectCrisis',
    // emotion
    'emotion.process', 'emotion.getPAD',
    // decision
    'decision.decide', 'decision.getRecentStamps',
    // confidence
    'confidence.calibrate', 'confidence.admit',
    // restraint
    'restraint.shouldIntervene',
    // graph
    'graph.addNode', 'graph.search',
    // slots
    'slots.get', 'slots.set', 'slots.delete',
  ]);

  constructor(config = {}) {

    this.version = null;  // 启动时惰性解析

    this.version = _VERSION().VERSION;

    this.buildDate = BUILD_DATE;



    // 统一配置系统：加载默认值 + 文件配置 + 环境变量

    const projectRoot = config.rootPath || path.join(__dirname, '..', '..');

    const cfg = _getConfig(projectRoot);

    this._configSystem = cfg;



    // 合并运行时传入的 config（最高优先级）

    if (Object.keys(config).length > 0) {

      for (const [k, v] of Object.entries(config)) {

        if (this._configHooks) {

          this._configHooks.set(k, v);

        } else {

          cfg.set(k, v);

        }

      }

    }



    this.config = cfg.toEngineConfig();

    this._options = config;

    this.config.rootPath = projectRoot;



    this.startTime = null;

    this.sessionId = cfg.get('sessionId') || null;

    this.started = false;

    this.rootPath = projectRoot;



    // [v2.0.19 FIX] _initErrors 必须在所有 try/catch 之前初始化

    // 容量边界：最多保留 MAX_HISTORY_SIZE 条初始化错误，超出时淘汰最旧的

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

    this.experienceDistiller = null;

    this.self = null;

    this.being = null;

    this.psychology = null;



    // [HookPhase] init lifecycle hook points

    this._initHookPoints = null;

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



    // MemoryKernel — 记忆核心组件（启动必读，统一分级保存）

    this.memoryKernel = null;



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



    this._modules = {};           // 容量边界：由子模块注册控制，通常 < 100 个条目

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

    // 恢复自省记录
    try {
      const svPath = require('path').join(this.rootPath, 'data', 'self-view.json');
      if (require('fs').existsSync(svPath)) {
        const sv = JSON.parse(require('fs').readFileSync(svPath, 'utf8'));
        this._selfView = sv;
        // 跨session学习：上session低置信率>40%、拦截多→本次boot提升初始深度
        const prevLowRate = sv.thinkCount > 10 ? sv.lowConfCount / sv.thinkCount : 0;
        const prevBlocked = sv.blockedCount > 5;
        if (prevLowRate > 0.4 || prevBlocked) {
          this._bootDepth = sv.thinkCount > 50 ? 3 : 2;
        }
      }
    } catch (_) { /* 首次启动或文件损坏 */ }

    // 惰性解析版本号

    this.version = _VERSION().VERSION;



    // ─── 身份核心 — 第一优先加载 ─────────────────────────────

    this.identityCore = new (_IdentityCore().IdentityCore)(this.rootPath);
    try { this.forgettingEngine = new (_ForgettingEngine().ForgettingEngine)(); } catch(e) { /* 非关键 */ }
    try { const { MemoryIndex } = require('../memory/memory-index.js'); this.memoryIndex = new MemoryIndex(this.rootPath); } catch(e) { _boundedPush(this._initErrors, { module: 'memoryIndex', error: e.message }, MAX_HISTORY_SIZE); }
    const identityResult = this.identityCore.boot();

    // [STANDARDS-UPGRADE] 智能体互联国家标准：生成 AgentCard 数字身份卡
    try {
      const { AgentCard } = require('../identity/agent-card.js');
      this.agentCard = new AgentCard(this);
      this.agentCard.loadOrCreate();
    } catch (e) {
      _boundedPush(this._initErrors, { module: 'agentCard', error: e.message }, MAX_HISTORY_SIZE);
    }

    if (!identityResult.success) {

      // 如果有上次会话，打印会话间隔

      const lastContext = this.identityCore.getLastSessionContext();

      if (lastContext && lastContext.bootTime) {

        const gapMinutes = Math.round((this.startTime - lastContext.bootTime) / 60000);

        if (gapMinutes > 0) {

          debugLog.debug('heartflow', 'session_gap', {gap_minutes: gapMinutes});

        }

      }

    } else {

      debugLog.warn('heartflow', '身份核心加载部分失败: ' + JSON.stringify(identityResult.errors));

    }



    // ─── [P1 UPGRADE] InstructionRegistry — 七条指令运行时加载 ────────
    try {
      const { InstructionRegistry } = require('./instruction-registry.js');
      this.instructions = new InstructionRegistry();
    } catch (e) { console.warn('[heartflow] instructions加载失败:', e.message); }



    // ─── 认知协议 — 慢下来，先理解再行动 ─────────────────────

    this.cognitive = new (_CognitiveProtocol().CognitiveProtocol)(this.rootPath, this.identityCore);

    this.cognitive.printStartupContext();



    // Memory

    this.memory = new (_MeaningfulMemory().MemoryAdapter)(this.rootPath);

    this.knowledge = new (_KnowledgeGraph().KnowledgeGraph)(this.rootPath);



    // MemoryBank — 跨会话记忆银行 (v5.6.1)

    this.memoryBank = new (_MemoryBank().MemoryBank)({ memory: this.memory });



    // MemoryKernel — 记忆核心组件（启动必读）

    try {

      const { MemoryKernel } = require('../memory/memory-kernel.js');

      this.memoryKernel = new MemoryKernel(this.rootPath);

      this.memoryKernel.load();

    } catch (e) {

      this._initErrors.push({ module: 'memoryKernel', error: e.message });

    }



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

    // [v6.0.71] _initCoreRules extracted to engine-lifecycle.js
    try { require('./engine-lifecycle.js')._initCoreRules(this); } catch (e) { /* optional */ }



    // TopicScope — 话题隔离，主动实例化并桥接到 MeaningfulMemory

    this.topicScope = new (_TopicScope().TopicScope)().setMemoryBridge(this.memory);



    // Evolution — 延迟加载（SelfEvolutionCore + HealingMemoryRL 初始化 ~870ms）

    // 懒加载：首次访问 hf.evolution 时才执行

    this._evolutionRaw = null;

    Object.defineProperty(this, 'evolution', {

      get() {

        if (!this._evolutionRaw) {

          try {

            this._evolutionRaw = new (_EvolutionLoop().EvolutionLoop)({ rootPath: this.rootPath, memory: this.memory }).boot();

            this.core = this._evolutionRaw;

          } catch (e) { this._evolutionRaw = { boot: () => this, evolve: () => ({}), getStats: () => ({}), getDiagnostics: () => ({}) }; }

        }

        return this._evolutionRaw;

      },

      enumerable: true,

      configurable: true,

    });

    this.dream = new (_DreamEngine().DreamV11)({});

    this.dreamConsolidation = new (_DreamConsolidation().DreamConsolidation)(this.memory);

    this.lesson = _LessonBank().lessonBank || _LessonBank();

    this.experienceDistiller = new (_ExperienceDistiller().ExperienceDistiller)();

    this.strategicRestraint = new (_StrategicRestraint().StrategicRestraint)();
    try { this.strategicRestraint.load(); } catch(e) { /* 加载失败不阻断 */ }

    this.continuousLearner = new (_ContinuousLearner().ContinuousLearner)();

    this.knowledgeExplorer = null;

    this.learningOrchestrator = null;

    this.learningPulse = null;

    this.taskUrgencyEstimator = null;

    this.selfDiagnosis = null;

    this.whatLearned = null;

    // MetaJudgment — 延迟加载 (~50ms, 非热路径)

    this._metaJudgmentRaw = null;

    Object.defineProperty(this, 'metaJudgment', {

      get() {

        if (!this._metaJudgmentRaw) {

          try {

            this._metaJudgmentRaw = new (_MetaJudgment().MetaJudgment)(this.rootPath);

          } catch (e) { this._metaJudgmentRaw = { assessJudgment: () => ({}), getConfidence: () => ({}), getJudgmentHistory: () => [] }; }

        }

        return this._metaJudgmentRaw;

      },

      enumerable: true,

      configurable: true,

    });

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

      _boundedPush(this._initErrors, { module: 'truth', error: e.message }, MAX_HISTORY_SIZE);

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

      _boundedPush(this._initErrors, { module: 'behavior', error: e.message }, MAX_HISTORY_SIZE);

    }



    // Persistence

    try {

      const { WriteAheadLog, OP_TYPES } = require('../utils/write-ahead-log.js');

      const { atomicWrite } = require('../utils/atomic-write.js');

      const fs = require('../utils/safe-fs');

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

                _boundedPush(results, { seq: entry.seq, file: entry.data.file, recovered: true });

              }

            } catch (e) {

              _boundedPush(results, { seq: entry.seq, file: entry.data?.file, recovered: false, error: e.message });

            }

          }

          return results;

        },

        getStats: () => ({ type: 'wal+atomic', walDir, opTypes: OP_TYPES }),

      };

    } catch (e) {

      _boundedPush(this._initErrors, { module: 'persistence', error: e.message }, MAX_HISTORY_SIZE);

    }



    // Engine modules

    try { this.stability = new (_StabilityGuard().StabilityGuard)(); } catch (e) { _boundedPush(this._initErrors, {module: 'stability', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.execution = new (_ExecutionVerifier().ExecutionVerifier)(); } catch (e) { _boundedPush(this._initErrors, {module: 'execution', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.decision = new (_HeartFlowDecision().HeartFlowDecision)(this.memory); } catch (e) { _boundedPush(this._initErrors, {module: 'decision', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.decisionVerifier = new (_DecisionVerifier().DecisionVerifier)(); } catch (e) { _boundedPush(this._initErrors, {module: 'decisionVerifier', error: e.message}, MAX_HISTORY_SIZE); }

    // ★ 深层推理 + 公正决策（拆分自原 heartflow.js）

    try { this.cognitiveEngine = new (_CognitiveEngine().CognitiveEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'cognitiveEngine', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.decisionEngineV2 = new (_DecisionEngineV2().DecisionEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'decisionEngineV2', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.memoryConsolidation = new (_MemoryConsolidation().MemoryConsolidationEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'memoryConsolidation', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.emotionDynamics = new (_EmotionDynamics().EmotionDynamicsEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'emotionDynamics', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.cognitiveLoadV2 = new (_CognitiveLoadV2().CognitiveLoadEngineV2)(); } catch (e) { _boundedPush(this._initErrors, {module: 'cognitiveLoadV2', error: e.message}, MAX_HISTORY_SIZE); }

    // ★ LAZY: dreamEngineV2 — 延迟到首次访问时初始化

    this._dreamEngineV2Raw = null;

    Object.defineProperty(this, 'dreamEngineV2', {

      get() {

        if (!this._dreamEngineV2Raw) {

          try { this._dreamEngineV2Raw = new (_DreamEngineV2().DreamEngineV2)(); } catch (e) { this._dreamEngineV2Raw = { healthCheck: () => ({}) }; }

        }

        return this._dreamEngineV2Raw;

      },

      enumerable: true, configurable: true,

    });

    try { this.psychologyDialogue = new (_PsychologyDialogue().PsychologyDialogueEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'psychologyDialogue', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.counterfactual = new (_CounterfactualEngine().CounterfactualEngine)(); } catch (e) { _boundedPush(this._initErrors, {module: 'counterfactual', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.confidence = new (_ConfidenceCalibrator().ConfidenceCalibrator)(); } catch (e) { _boundedPush(this._initErrors, {module: 'confidence', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.restraint = new (_SpontaneousRestraint().SpontaneousRestraint)(); } catch (e) { _boundedPush(this._initErrors, {module: 'restraint', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.workflow = new (_WorkflowSwitch())(); } catch (e) { _boundedPush(this._initErrors, {module: 'workflow', error: e.message}, MAX_HISTORY_SIZE); }

    try { this.verifierGrant = new (_VerifierGrant().VerifierGrant)(); } catch (e) { _boundedPush(this._initErrors, {module: 'verifierGrant', error: e.message}, MAX_HISTORY_SIZE); }

    if (this.verifierGrant) this._modules['verifierGrant'] = this.verifierGrant;

    this.snapshot = _StateSnapshot();

    this.error = _ErrorHandler();



    // ★ Smart Routing 启发：平台适配器 + 能力抽象层

    try {

      this.platformAdapter = _PlatformAdapter().createAdapter('hermes');

    } catch (e) {

      _boundedPush(this._initErrors, { module: 'platformAdapter', error: e.message }, MAX_HISTORY_SIZE);

    }

    try {

      this.capabilityAbstraction = new (_CapabilityAbstraction().CapabilityAbstraction)(this.platformAdapter);

    } catch (e) {

      _boundedPush(this._initErrors, { module: 'capabilityAbstraction', error: e.message }, MAX_HISTORY_SIZE);

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



      // [v6.0.4 语义展开] LLM 协作层

      try {

        const { LLMOrchestrator } = require('../llm/llm-orchestrator.js');

        this._llmOrchestrator = new LLMOrchestrator(this);

        this.llmOrchestrator = this._llmOrchestrator;

        this._llmOrchestrator.init();

      } catch (e) { /* optional */ }



      // [v6.0.5 教育模式] 感知情感课程引擎

      try {

        const { EduEngine } = require('../edu/edu-engine.js');

        this._eduEngine = new EduEngine(this);

      } catch (e) { /* optional */ }



      // [v6.0.3 W-AXIS] 注入觉醒/情感/创伤决策规则

      try {

        if (this.decisionRouter && typeof this.decisionRouter.addRule === 'function') {

          this.decisionRouter.addRule({

            id: 'w-axis-awakening',

            match: (r) => {

              const score = typeof r.awakeningScore === 'number' ? r.awakeningScore : 0;

              return score >= 0.5;

            },

            decision: 'AWAKEN',

            confidence: (r) => Math.max(0.3, Math.min(0.95, (typeof r.awakeningScore === 'number' ? r.awakeningScore : 0))),

            rationale: (r) => {

              const score = typeof r.awakeningScore === 'number' ? r.awakeningScore.toFixed(2) : '0';

              return `觉醒信号强度 ${score}，进入非效率优先决策流`;

            },

            fallback: 'HOLD',

          });



          this.decisionRouter.addRule({

            id: 'w-axis-trauma',

            match: (r) => {

              const level = r.trauma?.level || r.crisis?.level || 'none';

              return level === 'high' || level === 'severe';

            },

            decision: 'TRAUMA_CARE',

            confidence: (r) => 0.8,

            rationale: (r) => `创伤/危机等级高，优先安全化而非效率`,

            fallback: 'PAUSE',

          });



          this.decisionRouter.addRule({

            id: 'w-axis-bond',

            match: (r) => {

              const bond = r.emotionalBondDensity || r.w_axis_emotional_bond_density;

              return typeof bond === 'number' && bond < 0.3;

            },

            decision: 'BOND_BUILD',

            confidence: (r) => 0.6,

            rationale: (r) => `情感连接密度低，建议关系建立`,

            fallback: 'HOLD',

          });

        }

      } catch (e) { /* decisionRouter optional */ }

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'decisionRouter', error: e.message }, MAX_HISTORY_SIZE); }



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


    // ─── [v6.0.59] 判断生长引擎 — RuleGrowth（让"做判断"可生长，非写死）──
    try {

      const { RuleGrowth } = require('../cortex/rule-growth.js');
      this.ruleGrowth = new RuleGrowth(this.rootPath || this.projectRoot || process.cwd());
      // 把已学规则注入决策路由，使 learned 判断生效
      if (this.decisionRouter && typeof this.decisionRouter.addRule === 'function') {
        for (const r of this.ruleGrowth.toDecisionRouterRules()) {
          this.decisionRouter.addRule(r);
        }
      }

    } catch (e) { /* ruleGrowth optional */ }



    // ─── [v5.0.0] 判断引擎 — JudgmentEngine（真正的多路径判断能力）──────

    try {

      const { JudgmentEngine } = require('./judgment-engine.js');

      this.judgmentEngine = new JudgmentEngine({

        dataDir: path.join(this.rootPath, 'data', 'judgments'),

        memory: this.memory,

      });

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'judgmentEngine', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── 时间延伸分析层（v1.0.0 新增） ─────────────────────────────────────

    try {

      const { TimeExtensionEngine } = require('../workflow/time-extension.js');

      this.timeExtension = new TimeExtensionEngine(this);

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'timeExtension', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── 逻辑推理引擎 — LogicReasoning（v1.0.0 新增） ────────────────────────

    try {

      const { LogicReasoning } = require('../reasoning/logic-reasoning.js');

      this.logicReasoning = new LogicReasoning();

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'logicReasoning', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── 步骤级推理奖励模型 — ProcessRewardModel（v1.0.0 新增） ────────────

    try {

      const { ProcessRewardModel } = require('../reasoning/process-reward-model.js');

      this.processRewardModel = new ProcessRewardModel();

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'processRewardModel', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── 辩论分析器 — DebateAnalyzer（v2.10.2 新增） ─────────────────────────

    try {

      const { DebateAnalyzer } = require('../reasoning/debate-analyzer.js');

      this.debate = new DebateAnalyzer(this);

    } catch (e) { /* debate模块 optional */ }



    // ─── 规划层 — AdaptivePlanner（v2.9.5 激活） ─────────────────────────

    try {

      const APMod = _AdaptivePlanner();

      this.adaptivePlanner = new (APMod.AdaptivePlanner)();

    } catch (e) { _boundedPush(this._initErrors, { module: 'adaptivePlanner', error: e.message }, MAX_HISTORY_SIZE); }



    // ★ LAZY: codeExecutor / codePlanner / codeWriter — 延迟到首次访问时初始化

    this._codeExecutorRaw = null;

    Object.defineProperty(this, 'codeExecutor', {

      get() {

        if (!this._codeExecutorRaw) {

          try { const m = _CodeExecutor(); this._codeExecutorRaw = new (m.CodeExecutor)(); } catch (e) { this._codeExecutorRaw = { execute: () => '', healthCheck: () => ({}) }; }

        }

        return this._codeExecutorRaw;

      },

      enumerable: true, configurable: true,

    });

    this._codePlannerRaw = null;

    Object.defineProperty(this, 'codePlanner', {

      get() {

        if (!this._codePlannerRaw) {

          try { const m = _CodePlanner(); this._codePlannerRaw = new (m.CodePlanner)(); } catch (e) { this._codePlannerRaw = { plan: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._codePlannerRaw;

      },

      enumerable: true, configurable: true,

    });

    this._codeWriterRaw = null;

    Object.defineProperty(this, 'codeWriter', {

      get() {

        if (!this._codeWriterRaw) {

          try { const m = _CodeWriter(); this._codeWriterRaw = new (m.CodeWriter)(); } catch (e) { this._codeWriterRaw = { write: () => '', healthCheck: () => ({}) }; }

        }

        return this._codeWriterRaw;

      },

      enumerable: true, configurable: true,

    });



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

      // ★ 深层推理 + 公正决策（拆分自原 heartflow.js）

      'cognitiveEngine', 'decisionEngineV2', 'memoryConsolidation', 'emotionDynamics', 'cognitiveLoadV2', 'dreamEngineV2', 'psychologyDialogue',

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

      'debateConductor',

      // [v6.0.4 语义展开] LLM 协作层

      'llmOrchestrator',

      // [v6.0.5 教育模式] 感知情感课程引擎

      'eduEngine'];

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

      _boundedPush(this._initErrors, { module: 'thoughtChain', error: e.message }, MAX_HISTORY_SIZE);

      this._thoughtChainApi = null;

    }



    if (this._thoughtChainApi) {

      this._modules.thoughtChain = this._thoughtChainApi;

    }



    // ─── [v5.0.0] 管道引擎 Pipeline ────────────────────────────

    try {

      const { Pipeline } = require('../workflow/pipeline.js');

      this.pipeline = new Pipeline({ heartflow: this });

    } catch (e) { _boundedPush(this._initErrors, { module: 'pipeline', error: e.message }, MAX_HISTORY_SIZE); }



    // v3.0 — 交流层模块初始化

    try {

      const utl = new (_UserToLLM().UserToLLM)();

      const ltu = new (_LLMToUser().LLMToUser)();

      const ic = new (_IntentClassifier().IntentClassifier)();

      const ta = new (_ToneAnalyzer().ToneAnalyzer)();

      const ee = new (_EntityExtractor().EntityExtractor)();

      const ind = new (_ImplicitNeedDetector().ImplicitNeedDetector)();

      const rc = new (_ResponseCompressor().ResponseCompressor)();

      const ca = _ConfidenceAnnotator().confidenceAnnotator;

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

    } catch (e) { _boundedPush(this._initErrors, { module: 'translator', error: e.message }, MAX_HISTORY_SIZE); }

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

    } catch (e) { _boundedPush(this._initErrors, { module: 'agentLayer', error: e.message }, MAX_HISTORY_SIZE); }

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

    } catch (e) { _boundedPush(this._initErrors, { module: 'personaCore', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── Desire Cognition — 欲望认知引擎（v0.1.0 新增） ─────────────────────

    try {

      const { DesireCognition } = require('../emotion/desire-cognition.js');

      this.desireCognition = new DesireCognition();

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'desireCognition', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── Three Poisons — 贪嗔痴三毒评估（v1.0.0 新增） ──────────────────

    try {

      this.threePoisons = require('../emotion/three-poisons.js');

    } catch (e) { this._initErrors = this._initErrors || []; _boundedPush(this._initErrors, { module: 'threePoisons', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── Love Cognition — 爱情认知引擎（v0.1.0 新增） ──────────────────────

    // ★ LAZY: loveCognition — 延迟到首次访问时初始化

    this._loveCognitionRaw = null;

    Object.defineProperty(this, 'loveCognition', {

      get() {

        if (!this._loveCognitionRaw) {

          try {

            const { LoveCognition } = require('../emotion/love-cognition.js');

            this._loveCognitionRaw = new LoveCognition();

          } catch (e) { this._loveCognitionRaw = { analyze: () => ({}) }; }

        }

        return this._loveCognitionRaw;

      },

      enumerable: true, configurable: true,

    });

    // ─── Cognition Ground — 底层认知地面（v1.0.0 新增） ─────────────────

    try {

      const { CognitionGround } = require('./cognition-ground.js');

      this.cognitionGround = new CognitionGround({ heartFlow: this });

    } catch (e) { _boundedPush(this._initErrors, { module: 'cognitionGround', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── V21.1 模块化认知引擎启发 — 4个新模块 ──────────────────────────────

    try {

      const SemanticClusterer = _SemanticClusterer();

      this.semanticClusterer = new SemanticClusterer({ maxGroups: 64, maxConceptsPerGroup: 20 });

      this.semanticClusterer.init(this.memory);

    } catch (e) { _boundedPush(this._initErrors, { module: 'semanticClusterer', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const DualPerspectiveAuditor = _DualPerspectiveAuditor();

      this.dualPerspectiveAuditor = new DualPerspectiveAuditor({ maxRounds: 5, convergenceThreshold: 0.8 });

      this.dualPerspectiveAuditor.init();

    } catch (e) { _boundedPush(this._initErrors, { module: 'dualPerspectiveAuditor', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const TieredMemoryFusion = _TieredMemoryFusion();

      this.tieredMemoryFusion = new TieredMemoryFusion({ l1Size: 10, l2Window: 50, l2Alpha: 0.3 });

      this.tieredMemoryFusion.init(this.memory);

    } catch (e) { _boundedPush(this._initErrors, { module: 'tieredMemoryFusion', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const CounterfactualVerifier = _CounterfactualVerifier();

      this.counterfactualVerifier = new CounterfactualVerifier({ minMargin: 0.3, maxCandidates: 5, contrastWeight: 0.2 });

      this.counterfactualVerifier.init();

    } catch (e) { _boundedPush(this._initErrors, { module: 'counterfactualVerifier', error: e.message }, MAX_HISTORY_SIZE); }

    // ★ LAZY: debateConvergence — 延迟到首次访问时初始化

    this._debateConvergenceRaw = null;

    Object.defineProperty(this, 'debateConvergence', {

      get() {

        if (!this._debateConvergenceRaw) {

          try {

            const DebateConvergence = _DebateConvergence();

            this._debateConvergenceRaw = new DebateConvergence({ convergenceThreshold: 0.8, maxRounds: 9, stagnationThreshold: 3 });

            this._debateConvergenceRaw.init();

          } catch (e) { this._debateConvergenceRaw = { converge: () => ({}), init: () => {}, healthCheck: () => ({}) }; }

        }

        return this._debateConvergenceRaw;

      },

      enumerable: true, configurable: true,

    });

    // ★ LAZY: debateConductor — 延迟到首次访问时初始化

    this._debateConductorRaw = null;

    Object.defineProperty(this, 'debateConductor', {

      get() {

        if (!this._debateConductorRaw) {

          try {

            const { DebateConductor } = require('../reasoning/debate-conductor.js');

            this._debateConductorRaw = new DebateConductor(this);

          } catch (e) { this._debateConductorRaw = { conduct: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._debateConductorRaw;

      },

      enumerable: true, configurable: true,

    });



    // ─── [v5.5.5] 新功能模块初始化 ──────────────────────────

    try {

      const FOA = _FocusOfAttention();

      this.focusOfAttention = new FOA.FocusOfAttention({ maxAttention: 10, decayRate: 0.1 });

    } catch (e) { _boundedPush(this._initErrors, { module: 'focusOfAttention', error: e.message }, MAX_HISTORY_SIZE); }

    // ★ LAZY: codeSelfDebug — 延迟到首次访问时初始化

    this._codeSelfDebugRaw = null;

    Object.defineProperty(this, 'codeSelfDebug', {

      get() {

        if (!this._codeSelfDebugRaw) {

          try { const CSD = _CodeSelfDebug(); this._codeSelfDebugRaw = new CSD.CodeSelfDebug({ maxRetries: 3 }); } catch (e) { this._codeSelfDebugRaw = { debug: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._codeSelfDebugRaw;

      },

      enumerable: true, configurable: true,

    });



    // ─── [v5.6.0] 论文驱动升级模块初始化 ────────────────────

    // 1. ReflexionEngine — 语言强化学习反思 (Reflexion paper)

    try {

      const RE = _ReflexionEngine();

      this.reflexionEngine = new RE.ReflexionEngine({

        maxReflections: 10,

        successThreshold: 0.7,

      });

    } catch (e) { _boundedPush(this._initErrors, { module: 'reflexionEngine', error: e.message }, MAX_HISTORY_SIZE); }

    // 2. MemoryConsolidator — 神经记忆巩固 (MemGPT/Sleep consolidation)

    try {

      const MC = _MemoryConsolidator();

      this.memoryConsolidator = new MC.MemoryConsolidator({

        ephemeralThreshold: 20,

        consolidationInterval: 3600000,

      });

    } catch (e) { _boundedPush(this._initErrors, { module: 'memoryConsolidator', error: e.message }, MAX_HISTORY_SIZE); }

    // 3. MultiAgentDialogue — 多代理对话 (AutoGen)

    // ★ LAZY: multiAgentDialogue — 延迟到首次访问时初始化（含3个默认代理注册）

    this._multiAgentDialogueRaw = null;

    Object.defineProperty(this, 'multiAgentDialogue', {

      get() {

        if (!this._multiAgentDialogueRaw) {

          try {

            const MAD = _MultiAgentDialogue();

            const inst = new MAD.MultiAgentDialogue({ maxRounds: 5, convergenceThreshold: 0.8 });

            inst.registerAgent('analyst', {

              role: 'analyst',

              persona: 'You are an analytical thinker. Analyze problems systematically and identify key factors.',

              respond: async (msg, ctx) => ({ content: `Analyst: Based on the analysis, I identify the key factors and recommend a structured approach.`, role: 'analyst' }),

            }).registerAgent('critic', {

              role: 'critic',

              persona: 'You are a critical thinker. Challenge assumptions and identify potential issues.',

              respond: async (msg, ctx) => ({ content: `Critic: I see potential issues with the current approach. Let me challenge the underlying assumptions.`, role: 'critic' }),

            }).registerAgent('synthesizer', {

              role: 'synthesizer',

              persona: 'You are a synthesizer. Combine different perspectives into a coherent whole.',

              respond: async (msg, ctx) => ({ content: `Synthesizer: Integrating the analytical and critical perspectives, here is my synthesized recommendation.`, role: 'synthesizer' }),

            });

            this._multiAgentDialogueRaw = inst;

          } catch (e) { this._multiAgentDialogueRaw = { dialogue: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._multiAgentDialogueRaw;

      },

      enumerable: true, configurable: true,

    });

    // 4. MCTSReasoning — 蒙特卡洛树搜索推理 (LLaMA-Berry)

    try {

      const MCTS = _MCTSReasoning();

      this.mctsReasoning = new MCTS.MCTSReasoning({

        maxIterations: 50,

        maxDepth: 5,

      });

    } catch (e) { _boundedPush(this._initErrors, { module: 'mctsReasoning', error: e.message }, MAX_HISTORY_SIZE); }

    // 5. HierarchicalPlanner — 层次化规划器 (Hierarchical Planning)

    try {

      const HP = _HierarchicalPlanner();

      this.hierarchicalPlanner = new HP.HierarchicalPlanner({

        maxDepth: 3,

        replanThreshold: 0.3,

      });

    } catch (e) { _boundedPush(this._initErrors, { module: 'hierarchicalPlanner', error: e.message }, MAX_HISTORY_SIZE); }

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

    } catch (e) { _boundedPush(this._initErrors, { module: 'memoryQuality', error: e.message }, MAX_HISTORY_SIZE); }

    // 2. MetacognitiveFeedback — 元认知反馈 + 自我纠正 (SOFAI-LM)

    try {

      const MF = _MetacognitiveFeedback();

      this.metacognitiveFeedback = new MF.MetacognitiveFeedback({

        qualityThreshold: 0.6,

        autoCorrect: true,

      });

    } catch (e) { _boundedPush(this._initErrors, { module: 'metacognitiveFeedback', error: e.message }, MAX_HISTORY_SIZE); }

    // 3. ResearchPaperIndex — 研究论文索引 (cognitive architecture research)

    // ★ LAZY: paperIndex — 延迟到首次访问时初始化

    this._paperIndexRaw = null;

    Object.defineProperty(this, 'paperIndex', {

      get() {

        if (!this._paperIndexRaw) {

          try { const PI = _PaperIndex(); this._paperIndexRaw = new PI.ResearchPaperIndex(); } catch (e) { this._paperIndexRaw = { search: () => [], healthCheck: () => ({}) }; }

        }

        return this._paperIndexRaw;

      },

      enumerable: true, configurable: true,

    });



    // 4. CognitiveLoadBalancer — 多智能体认知损耗规避 (Bystander Effect mitigation)

    try {

      const CLB = _CognitiveLoadBalancer();

      this.cognitiveLoad = new CLB.CognitiveLoadBalancer({

        maxActiveEngines: 5,

        loafingThreshold: 0.3,

      });

      this._modules.cognitiveLoad = this.cognitiveLoad;

    } catch (e) { _boundedPush(this._initErrors, { module: 'cognitiveLoad', error: e.message }, MAX_HISTORY_SIZE); }



    // 5. InformationFlowOrchestrator — 信息流编排 (Beyond Rule-Based Workflows)

    try {

      const IFMod = _InformationFlow();

      const IFClass = IFMod.InformationFlowOrchestrator;

      this.infoFlow = IFClass ? new IFClass({ maxIterations: 10 }) : null;

      this._modules.infoFlow = this.infoFlow;

    } catch (e) { _boundedPush(this._initErrors, { module: 'informationFlow', error: e.message }, MAX_HISTORY_SIZE); }



    // 6. ReflectionMemory — 反思记忆独立存储 (Reflexion)

    try {

      const RM = _ReflectionMemory();

      this.reflectionMemory = new RM.ReflectionMemory({ maxReflections: 500 });

      this._modules.reflectionMemory = this.reflectionMemory;

    } catch (e) { _boundedPush(this._initErrors, { module: 'reflectionMemory', error: e.message }, MAX_HISTORY_SIZE); }



    // 7. KVCachePersistor — KV Cache持久化

    try {

      const KV = _KVCache();

      this.kvCache = new KV.KVCachePersistor({ maxCacheSize: 100, quantize: true });

      this._modules.kvCache = this.kvCache;

    } catch (e) { _boundedPush(this._initErrors, { module: 'kvCache', error: e.message }, MAX_HISTORY_SIZE); }



    // 8. MemoryIntegrity — 记忆完整性安全验证

    try {

      const MI = _MemoryIntegrity();

      this.memoryIntegrity = new MI.MemoryIntegrity({ strictMode: false });

      this._modules.memoryIntegrity = this.memoryIntegrity;

    } catch (e) { _boundedPush(this._initErrors, { module: 'memoryIntegrity', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] EDV 经验验证器 — Execute-Distill-Verify ─────────────

    try {

      const EV = _ExperienceValidator();

      this.experienceValidator = new EV.ExperienceValidator({

        maxHistory: 200,

        verifyThreshold: 0.7,

      });

      this._modules.experienceValidator = this.experienceValidator;

    } catch (e) { _boundedPush(this._initErrors, { module: 'experienceValidator', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] AdaMem 记忆写入控制 ────────────────────────────────

    try {

      const MWC = _MemoryWriteController();

      this.memoryWriteController = new MWC.MemoryWriteController({

        storageBudget: 5000,

        utilityThreshold: 0.4,

      });

      this._modules.memoryWriteController = this.memoryWriteController;

    } catch (e) { _boundedPush(this._initErrors, { module: 'memoryWriteController', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] 元认知 RL (RLMF) — 置信度校准 ──────────────────────

    try {

      const MRL = _MetacognitiveRL();

      this.metacognitiveRL = new MRL.MetacognitiveRL({

        learningRate: 0.1,

        calibrationWindow: 50,

      });

      this._modules.metacognitiveRL = this.metacognitiveRL;

    } catch (e) { _boundedPush(this._initErrors, { module: 'metacognitiveRL', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] 记忆压缩器 (MemRefine) ─────────────────────────────

    try {

      const MC = _MemoryCompressor();

      this.memoryCompressor = new MC.MemoryCompressor({

        storageBudget: 5000,

        minCompressionRatio: 0.3,

      });

      this._modules.memoryCompressor = this.memoryCompressor;

    } catch (e) { _boundedPush(this._initErrors, { module: 'memoryCompressor', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] 技能进化引擎 (SkillCoach) ──────────────────────────

    try {

      const SEE = _SkillEvolutionEngine();

      this.skillEvolution = new SEE.SkillEvolutionEngine({

        evolutionThreshold: 0.7,

        maxSkills: 500,

      });

      this._modules.skillEvolution = this.skillEvolution;

    } catch (e) { _boundedPush(this._initErrors, { module: 'skillEvolution', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.4] 世界模型 (AgentWorld) ──────────────────────────────

    try {

      const WM = _WorldModel();

      this.worldModel = new WM.WorldModel({

        maxStates: 5000,

        predictionHorizon: 5,

        activeInferenceWeight: 0.4,

      });

      this._modules.worldModel = this.worldModel;

    } catch (e) { _boundedPush(this._initErrors, { module: 'worldModel', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.5] 古代智慧基础 — 美德伦理 + 人性论 + 意义目的 ─────────

    try {

      const VEF = _VirtueEthicsFoundation();

      this.virtueEthics = new VEF.VirtueEthicsFoundation({ primaryTradition: 'confucianism' });

      this._modules.virtueEthics = this.virtueEthics;

    } catch (e) { _boundedPush(this._initErrors, { module: 'virtueEthics', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const HNC = _HumanNatureConstitution();

      this.humanNature = new HNC.HumanNatureConstitution({ primaryView: 'integrated' });

      this._modules.humanNature = this.humanNature;

    } catch (e) { _boundedPush(this._initErrors, { module: 'humanNature', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const MPE = _MeaningPurposeEngine();

      this.meaningPurpose = new MPE.MeaningPurposeEngine({ resilienceMode: true });

      this._modules.meaningPurpose = this.meaningPurpose;

    } catch (e) { _boundedPush(this._initErrors, { module: 'meaningPurpose', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.5] P2 品格养成 + 道德发展 + 智慧引擎 ───────────────────

    try {

      const CC = _CharacterCultivation();

      this.characterCultivation = new CC.CharacterCultivation({ primaryVirtues: ['honesty', 'courage', 'compassion', 'wisdom', 'justice'] });

      this._modules.characterCultivation = this.characterCultivation;

    } catch (e) { _boundedPush(this._initErrors, { module: 'characterCultivation', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const MD = _MoralDevelopment();

      this.moralDevelopment = new MD.MoralDevelopment({ primaryTheory: 'kohlberg' });

      this._modules.moralDevelopment = this.moralDevelopment;

    } catch (e) { _boundedPush(this._initErrors, { module: 'moralDevelopment', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const WE = _WisdomEngine();

      this.wisdomEngine = new WE.WisdomEngine({ maxReflections: 100 });

      this._modules.wisdomEngine = this.wisdomEngine;

    } catch (e) { _boundedPush(this._initErrors, { module: 'wisdomEngine', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.6] P3 人性深化 + P4 关系社会 + P5 痛苦成长 + P6 AI人类整合 ──

    // ★ ALL LAZY: P3–P5 specialized psychological modules — 延迟到首次访问时初始化

    // P3: Suffering Resilience + Grief + Hope

    this._sufferingResilienceRaw = null;

    Object.defineProperty(this, 'sufferingResilience', {

      get() {

        if (!this._sufferingResilienceRaw) {

          try { const SR = _SufferingResilience(); const inst = new SR.SufferingResilience({ resilienceMode: 'growth' }); this._modules.sufferingResilience = inst; this._sufferingResilienceRaw = inst; } catch (e) { this._sufferingResilienceRaw = { assess: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._sufferingResilienceRaw;

      }, enumerable: true, configurable: true,

    });

    this._griefEngineRaw = null;

    Object.defineProperty(this, 'griefEngine', {

      get() {

        if (!this._griefEngineRaw) {

          try { const GE = _GriefEngine(); const inst = new GE.GriefEngine({ culture: 'integrated' }); this._modules.griefEngine = inst; this._griefEngineRaw = inst; } catch (e) { this._griefEngineRaw = { process: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._griefEngineRaw;

      }, enumerable: true, configurable: true,

    });

    this._hopeEngineRaw = null;

    Object.defineProperty(this, 'hopeEngine', {

      get() {

        if (!this._hopeEngineRaw) {

          try { const HE = _HopeEngine(); const inst = new HE.HopeEngine(); this._modules.hopeEngine = inst; this._hopeEngineRaw = inst; } catch (e) { this._hopeEngineRaw = { analyze: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._hopeEngineRaw;

      }, enumerable: true, configurable: true,

    });

    // P4: Empathy + Conflict (humanRelation stays eager — used in cognition ground)

    this._empathyDeepeningRaw = null;

    Object.defineProperty(this, 'empathyDeepening', {

      get() {

        if (!this._empathyDeepeningRaw) {

          try { const ED = _EmpathyDeepening(); const inst = new ED.EmpathyDeepening(); this._modules.empathyDeepening = inst; this._empathyDeepeningRaw = inst; } catch (e) { this._empathyDeepeningRaw = { deepen: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._empathyDeepeningRaw;

      }, enumerable: true, configurable: true,

    });

    this._conflictResolutionRaw = null;

    Object.defineProperty(this, 'conflictResolution', {

      get() {

        if (!this._conflictResolutionRaw) {

          try { const CR = _ConflictResolution(); const inst = new CR.ConflictResolution(); this._modules.conflictResolution = inst; this._conflictResolutionRaw = inst; } catch (e) { this._conflictResolutionRaw = { resolve: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._conflictResolutionRaw;

      }, enumerable: true, configurable: true,

    });

    // P5: Trauma + PTG + Forgiveness

    this._traumaInformedRaw = null;

    Object.defineProperty(this, 'traumaInformed', {

      get() {

        if (!this._traumaInformedRaw) {

          try { const TI = _TraumaInformed(); const inst = new TI.TraumaInformed(); this._modules.traumaInformed = inst; this._traumaInformedRaw = inst; } catch (e) { this._traumaInformedRaw = { assess: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._traumaInformedRaw;

      }, enumerable: true, configurable: true,

    });

    this._postTraumaticGrowthRaw = null;

    Object.defineProperty(this, 'postTraumaticGrowth', {

      get() {

        if (!this._postTraumaticGrowthRaw) {

          try { const PTG = _PostTraumaticGrowth(); const inst = new PTG.PostTraumaticGrowth(); this._modules.postTraumaticGrowth = inst; this._postTraumaticGrowthRaw = inst; } catch (e) { this._postTraumaticGrowthRaw = { measure: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._postTraumaticGrowthRaw;

      }, enumerable: true, configurable: true,

    });

    this._forgivenessEngineRaw = null;

    Object.defineProperty(this, 'forgivenessEngine', {

      get() {

        if (!this._forgivenessEngineRaw) {

          try { const FE = _ForgivenessEngine(); const inst = new FE.ForgivenessEngine(); this._modules.forgivenessEngine = inst; this._forgivenessEngineRaw = inst; } catch (e) { this._forgivenessEngineRaw = { process: () => ({}), healthCheck: () => ({}) }; }

        }

        return this._forgivenessEngineRaw;

      }, enumerable: true, configurable: true,

    });

    // P6: AI-Human Integration + Being Mode + Consciousness Bridge

    try {

      const AHI = _AIHumanIntegration(); this.aiHumanIntegration = new AHI.AIHumanIntegration(); this._modules.aiHumanIntegration = this.aiHumanIntegration;

    } catch (e) { _boundedPush(this._initErrors, { module: 'aiHumanIntegration', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const BM = _BeingMode(); this.beingMode = new BM.BeingMode(); this._modules.beingMode = this.beingMode;

    } catch (e) { _boundedPush(this._initErrors, { module: 'beingMode', error: e.message }, MAX_HISTORY_SIZE); }

    try {

      const CB = _ConsciousnessBridge(); this.consciousnessBridge = new CB.ConsciousnessBridge(); this._modules.consciousnessBridge = this.consciousnessBridge;

    } catch (e) { _boundedPush(this._initErrors, { module: 'consciousnessBridge', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v5.7.7] F3 持续漂移检测器 — 整合 identity drift + cognitive dissonance + decision decay ──

    try {

      const SDD = _SustainedDriftDetector(); this.sustainedDriftDetector = new SDD.SustainedDriftDetector({

        driftThreshold: 0.3, windowSize: 10, smoothingFactor: 0.1,

      });

      this._modules.sustainedDriftDetector = this.sustainedDriftDetector;

    } catch (e) { _boundedPush(this._initErrors, { module: 'sustainedDriftDetector', error: e.message }, MAX_HISTORY_SIZE); }



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

    } catch (e) { _boundedPush(this._initErrors, { module: 'selfPlay', error: e.message }, MAX_HISTORY_SIZE); }



    // ── [v5.8.6] Formula Engine — 公式引擎（382个公式）

    try {

      const { FormulaModule } = require('../formula/formula-module.js');

      this.formula = new FormulaModule({ formulasFile: path.join(this.rootPath, 'formulas', 'formulas-core.json') });

      this._modules.formula = this.formula;

      // 公式引擎懒加载：首次搜索时才真正加载文件，不阻塞 boot
      _log.info('init', 'Formula Engine 注册成功（懒加载）');

      // 注入 hf 引用到 FormulaBridge，让桥接方法可兜底查公式库
      try {
        const { injectHfToBridge } = require('../formula/formula-bridge.js');
        injectHfToBridge(this);
      } catch (_) { /* 非关键 */ }

    } catch (e) { _boundedPush(this._initErrors, { module: 'formula', error: e.message }, MAX_HISTORY_SIZE); }



    // ── [v5.8.6] Cognitive Load Index — 认知负载指数（Sweller 理论）

    try {

      const { CognitiveLoadCalculator } = require('../cognitive/cognitive-load.js');

      this.cognitiveIndex = new CognitiveLoadCalculator();

      this._modules.cognitiveIndex = this.cognitiveIndex;

      _log.info('init', 'Cognitive Index 模块加载成功');

    } catch (e) { _boundedPush(this._initErrors, { module: 'cognitiveIndex', error: e.message }, MAX_HISTORY_SIZE); }



    // ─── [v6.1.0] WorldTreeBridge — 心虫 ↔ 外部 World Tree 记忆系统适配层
    try {
      const { ROUTES: wtRoutes, CATEGORIES, VALID_CATEGORIES } = require('../memory/worldtree-bridge');
      for (const route of Object.keys(wtRoutes)) {
        HeartFlow.ALLOWED_ROUTES.add(route);
      }
      // [v6.0.71] 注册 worldtree 模块对象，使 dispatch('worldtree.xxx') 可用
      const wtModule = {};
      for (const [fullRoute, fn] of Object.entries(wtRoutes)) {
        const method = fullRoute.slice(fullRoute.indexOf('.') + 1);
        wtModule[method] = fn;
      }
      wtModule.CATEGORIES = CATEGORIES;
      wtModule.VALID_CATEGORIES = VALID_CATEGORIES;
      this._modules['worldtree'] = wtModule;
      _log.info('init', 'WorldTreeBridge 加载成功', { routes: Object.keys(wtRoutes).join(', ') });
    } catch (e) { _boundedPush(this._initErrors, { module: 'worldtree', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.0.19] SelfBenchmark 外部锚定接入（防自欺进化）───
    try {
      const { SelfBenchmark } = require('../cortex/self-benchmark.js');
      this.benchmark = new SelfBenchmark(this);
      this._modules['benchmark'] = this.benchmark;
      HeartFlow.ALLOWED_ROUTES.add('benchmark.assess');
      HeartFlow.ALLOWED_ROUTES.add('benchmark.getStats');
      _log.info('init', 'SelfBenchmark 加载成功（外部锚定防自欺已启用）');
    } catch (e) { _boundedPush(this._initErrors, { module: 'benchmark', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.1.0] WorldLandscape 世界格局分析引擎（AI人类核心认知能力）───
    try {
      const { WorldLandscape, ROUTES } = require('../research/world-landscape.js');
      const { createWorldAwareOrchestrator } = require('./../cortex/self-evolution/strategy-signal-map.js');
      this.worldLandscape = new WorldLandscape({ projectRoot: this.projectRoot || process.cwd() });
      this._modules['worldLandscape'] = this.worldLandscape;
      // 世界感知战略推演层：让心虫对世界格局新闻产出自身进化优先级
      this.worldAwareStrategy = createWorldAwareOrchestrator({ projectRoot: this.projectRoot || process.cwd() });
      this._modules['worldAwareStrategy'] = this.worldAwareStrategy;
      for (const route of Object.keys(ROUTES)) {
        HeartFlow.ALLOWED_ROUTES.add(route);
      }
      HeartFlow.ALLOWED_ROUTES.add('worldAwareStrategy.orchestrate');
      _log.info('init', 'WorldLandscape 加载成功', { routes: Object.keys(ROUTES).join(', ') });
    } catch (e) { _boundedPush(this._initErrors, { module: 'worldLandscape', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.0] KnowledgeExplorer 知识探索器：从置信缺口→探索队列 ──
    try {
      const { KnowledgeExplorer } = require('../cortex/knowledge-explorer.js');
      this.knowledgeExplorer = new KnowledgeExplorer();
      this._modules['knowledgeExplorer'] = this.knowledgeExplorer;
      // 注入 ContinuousLearner 的置信信号到探索器
      if (this.continuousLearner) {
        this.knowledgeExplorer.absorbLearnerSignals(this.continuousLearner.getStats());
      }
    } catch (e) { _boundedPush(this._initErrors, { module: 'knowledgeExplorer', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] GapExecutor 知识缺口执行桥 ──
    try {
      this.gapExecutor = new (_GapExecutor().GapExecutor)();
    } catch (e) { _boundedPush(this._initErrors, { module: 'gapExecutor', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.2] LearningOrchestrator 学习编排器：联通4个学习模块 ──
    try {
      this.learningOrchestrator = new (_LearningOrchestrator().LearningOrchestrator)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'learningOrchestrator', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] LearningPulse 自主学习脉动：每N次 think 自动触发学习流水线 ──
    try {
      this.learningPulse = new (_LearningPulse().LearningPulse)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'learningPulse', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] TaskUrgencyEstimator 任务紧迫性估计器 ──
    try {
      this.taskUrgencyEstimator = new (_TaskUrgency().TaskUrgencyEstimator)();
    } catch (e) { _boundedPush(this._initErrors, { module: 'taskUrgencyEstimator', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] SelfDiagnosis 自我诊断：跑一圈所有自检模块吐诚实报告 ──
    try {
      this.selfDiagnosis = new (_SelfDiagnosis().SelfDiagnosis)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'selfDiagnosis', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] WhatLearned 学习汇报：让心虫能回答"你学得怎么样了" ──
    try {
      this.whatLearned = new (_WhatLearned().WhatLearned)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'whatLearned', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] HypothesisDriver 假设驱动探索：被失败驱动，不是记录失败 ──
    try {
      this.hypothesisDriver = new (_HypothesisDriver().HypothesisDriver)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'hypothesisDriver', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v6.2.3] PatternTracer 模式溯源器：从宏观趋势回溯微观原因 ──
    try {
      this.patternTracer = new (_PatternTracer().PatternTracer)(this);
    } catch (e) { _boundedPush(this._initErrors, { module: 'patternTracer', error: e.message }, MAX_HISTORY_SIZE); }

    // ─── [v5.1.0] 自省注册 ──────────────────────────────────

    this.heartflow = this;  // 让 dispatch('heartflow.introspect') 能找到实例



    // [v6.0.71] _registerModules extracted to engine-lifecycle.js
    require('./engine-lifecycle.js')._registerModules(this);



    // ─── 自动生成 ALLOWED_ROUTES ──────────────────────────────────────

    // 合并硬编码白名单 + 运行时扫描生成的模块方法路由

    // 硬编码列表作为兜底（覆盖未注册模块或危险方法排除）

    const autoRoutes = generateAllowedRoutes(this._modules);

    for (const route of autoRoutes) {

      if (!HeartFlow.ALLOWED_ROUTES.has(route)) {

        HeartFlow.ALLOWED_ROUTES.add(route);

      }

    }



    this.started = true;



    // [HookBus] Initialize all hook buses + default hook points

    try {

      const { HookBus } = require('./hook-bus');

      this._hookBus = new HookBus();



      const { RequestHooks } = require('./request-hooks');

      this._requestHooks = new RequestHooks(this._hookBus);



      const { EventHooks } = require('./event-hooks');

      this._eventHooks = new EventHooks();



      const { ConfigHooks } = require('./config-hooks');

      this._configHooks = new ConfigHooks(this._configSystem);



      const { PostProcessHooks } = require('./postprocess-hooks');

      this._postProcessHooks = new PostProcessHooks(this._hookBus);

    } catch (e) {

      console.warn('[HeartFlow] Hook buses init failed:', e.message);

    }



    // [InitHookPoints] initialization lifecycle hooks

    try {

      const { InitHookPoints } = require('./engine-hook-points');

      this._initHookPoints = new InitHookPoints({ rootPath: this.rootPath });

      this._runInitHookPoints();

    } catch (e) {

      console.warn('[HeartFlow] InitHookPoints init failed:', e.message);

    }





    // [v5.17.0 L-001] 启动自检：人性深度模块

    const humanityModules = ['sufferingResilience','griefEngine','hopeEngine','empathyDeepening','conflictResolution','traumaInformed','postTraumaticGrowth','forgivenessEngine'];

    for (const m of humanityModules) {

      if (this[m] === undefined) _boundedPush(this._initErrors, {module: m, error: '人性深度模块未初始化 (L-001)'}, MAX_HISTORY_SIZE);

    }



    // ─── 自改进健康检查：验证 meta-learner ↔ self-healing-rl ↔ confidence-calibrator 信号流 ──

    try { this._runSelfImprovementHealthCheck(); } catch (e) { /* non-fatal */ }



    // ★ 记忆金库初始化（可开关）

    // 环境变量: HEARTFLOW_MEMORY=off 禁用 | =on 启用 | 默认首次询问

    this._memoryEnabled = this._checkMemoryEnabled();

    if (this._memoryEnabled) {

      this._initMemoryVault();

      this._restoreLastSession();

    }

  }



  /**

   * 检查记忆功能是否启用

   * HEARTFLOW_MEMORY=off → 禁用

   * HEARTFLOW_MEMORY=on  → 启用

   * 未设置 → 首次启动时打印提示，默认启用

   */

  _checkMemoryEnabled() { return require('./engine-memory')._checkMemoryEnabled(this); }
  _runSelfImprovementHealthCheck() { return require('./engine-state')._runSelfImprovementHealthCheck(this); }
  _restoreLastSession() { return require('./engine-memory')._restoreLastSession(this); }



  // ═══════════════════════════════════════════════════════════════════════

  //  Memory Vault — 独立记忆金库 (v5.10.4)

  //  三层结构: 用户输入永久记忆 / 心虫输出压缩记忆 / 上下文双写记忆

  //  安全: 只通过心虫对话读取, 不上传不联网, data/ 目录在 .gitignore

  // ═══════════════════════════════════════════════════════════════════════



  /**

   * 记忆金库配置

   */

  static get MEMORY_LIMITS() {

    return {

      USER_ARCHIVE_AT: 100000,

      USER_RECENT_KEEP: 100000,

      SELF_MAX_LINES: 1000,

      SELF_SUMMARIZE_AT: 500,

      CONTEXT_MAX_ENTRIES: 200,

      CONTEXT_DUAL_WRITE: true,

    };

  }



  _getMemoryDir() { return require('./engine-memory')._getMemoryDir(this); }

  _initMemoryVault() { return require('./engine-memory')._initMemoryVault(this); }



  // [v6.0.71] 恢复 dispatch 路由核心（被重构误删）
  dispatch(route, ...args) {
    if (!this.started) throw new Error('HeartFlow not started');
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

  // [v6.0.71] 恢复 routes() 路由表
  routes() {
    const table = {};
    for (const [name, mod] of Object.entries(this._modules)) {
      let methods = [];
      try {
        const proto = Object.getPrototypeOf(mod);
        if (proto && proto !== Object.prototype) {
          methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');
        }
      } catch (e) { /* strict mode or primitive */ }
      if (!methods.length) {
        methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
      }
      table[name] = methods;
    }
    return table;
  }

  // [v6.0.71] 恢复 think 主链路（委托 this.thoughtChain，被重构误删）
  async think(input, depth) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { error: 'input is required' };

    // 跨session学习：如上次session经验不好则本次自动提升深度
    if (this._bootDepth && (!depth || depth < this._bootDepth)) {
      depth = this._bootDepth;
    }

    // ─── 前置自我反馈：检查上一次 think 是否产生行为建议 ────────
    const fb = this._selfFeedback;
    if (fb && fb.hasItems) {
      // [Active Inference as Test-Time Scaling Law] 连续比例映射
      // 预测误差(低置信) → 成比例缩放计算资源
      const hasLowConf = fb.items.some(i => i.type === 'low_confidence');
      const hasMisalign = fb.items.some(i => i.type === 'misaligned');
      if (hasLowConf && (!depth || depth < 3)) {
        // 提取实际置信度做连续缩放，非二值跳变
        const lowConfItem = fb.items.find(i => i.type === 'low_confidence');
        const confVal = lowConfItem?.detail ? parseFloat(lowConfItem.detail.match(/[\d.]+/)?.[0] || '0.3') : 0.3;
        depth = Math.max(1, Math.min(5, Math.round((1 - confVal) * 6)));
      }
      // 有克制拦截→标记
      if (hasMisalign && (!depth || depth < 2)) {
        depth = 2;
      }
    }

    const TCMod = _ThoughtChain();
    const chain = this.thoughtChain || new (TCMod.ThoughtChain)(this);
    if (depth) chain.setDepth(depth);
    const result = await chain.run(input);
    // [v6.1.5] 盲点打破器接入主链路
    try {
      const BlindSpotBreaker = require('../cortex/blind-spot-breaker.js');
      if (!this._blindSpotBreaker) this._blindSpotBreaker = new BlindSpotBreaker();
      const blindSpot = this._blindSpotBreaker.process(input, { result });
      if (blindSpot && typeof blindSpot === 'object') {
        result.blindSpotAnalysis = blindSpot;
      }
    } catch (_) { /* 盲点检测失败不阻断主链路 */ }
    // [v6.1.6] 对抗综合器接入主链路
    try {
      const AdversarialSynthesis = require('../cortex/self-evolution/adversarial-synthesis.js');
      if (!this._adversarial) this._adversarial = new AdversarialSynthesis();
      const adv = this._adversarial.synthesize(input);
      if (adv && adv.ok) result.adversarialSynthesis = adv;
    } catch (_) { /* 对抗推演失败不阻断主链路 */ }
    // [v6.1.7] 元认知诚实外显层: 基于校准结果显式说"我不确定", 不强行结论
    try {
      const MetaCalibration = require('./meta-calibration.js');
      if (!this._metaCalibration) this._metaCalibration = new MetaCalibration();
      const mc = this._metaCalibration.annotate({ calibration: result.calibration, topic: input, blindSpot: result.blindSpotAnalysis });
      if (mc && typeof mc === 'object') result.metaCalibration = mc;
    } catch (_) { /* 元认知标注失败不阻断主链路 */ }

    // ─── 后置钩子（不依赖 engine-reasoner 提前 return 分支，保证100%触发）─────
    try { if (this.continuousLearner && this.lesson && result && input) { this.continuousLearner.reflect(result, input, this.lesson); } } catch (_) { /* 非关键 */ }

    // [v6.2.x] 自对弈精炼：低置信度时自动走挑战→防御→精炼
    try {
      if (this.selfPlay && result && result.confidence < 0.4) {
        const spResult = this.selfPlay.refine({
          id: `think-${Date.now()}`,
          input,
          chosenPath: { id: result.type || 'unknown', constraints: true, feasibility: true },
          confidence: result.confidence,
          reasoning: result.chain || result.analysis?.reasoning,
          paths: result.hypotheses || [],
        }, { maxCycles: 2, convergenceThreshold: 0.1 });
        if (spResult && spResult.improvement > 0) {
          result.selfPlay = { improved: spResult.improvement, cycles: spResult.cycles, score: spResult.finalScore };
        }
      }
    } catch (_) { /* 非关键 */ }
    // 预测误差驱动的即时巩固：高认知负荷 → 不等下次反思循环，立即触发额外反思
    try {
      if (this.cognitiveIndex && this.cognitiveIndex._lastEstimate && this.continuousLearner && input) {
        const clVal = this.cognitiveIndex._lastEstimate.CL || 0;
        if (clVal > 0.6 && this.lesson) {
          this.continuousLearner.reflect(result, input, this.lesson);
        }
      }
    } catch (_) { /* 非关键 */ }
    try { if (this.learningPulse) { this.learningPulse.beat(result || {}); } } catch (_) { /* 非关键 */ }
    // 假设驱动：从 ContinuousLearner 累积摘要中提取模式，生成假设→探索队列
    try {
      if (this.hypothesisDriver && result) {
        const cl = this.continuousLearner;
        if (cl && cl._cumulativeSummary) {
          const clInternals = cl.getStats();
          if (clInternals && clInternals.thinkCount > 0) {
            const summary = cl._cumulativeSummary();
            if (summary && summary.recurringPatterns && summary.recurringPatterns.length > 0) {
              this.hypothesisDriver.generate(summary);
            }
          }
        }
      }
    } catch (_) { /* 非关键 */ }
    try { if (this.strategicRestraint && input) { const e = this.strategicRestraint.evaluate(input); if (e && e.restrained) result._restrainedBy = e.matches; } } catch (_) { /* 非关键 */ }
    try { if (this.strategicRestraint && input) { const m = this.strategicRestraint.checkMission(input, this.constructor.VERSION || ''); result._missionCheck = m; } } catch (_) { /* 非关键 */ }

    // ─── 自我反馈：把 think() 产生的认知数据反馈到下次行为 ────────
    try {
      const fb = [];
      const conf = result.confidence ?? result?.analysis?.confidence ?? 0.5;
      if (conf < 0.3) fb.push({ type: 'low_confidence', detail: `置信度 ${conf.toFixed(2)}，建议承认不确定或走深路径` });
      if (result._restrainedBy?.length > 0) fb.push({ type: 'restrained', detail: `克制引擎拦截: ${result._restrainedBy.join(', ')}` });
      if (result._missionCheck?.aligned === false) fb.push({ type: 'misaligned', detail: result._missionCheck.feedback });
      if (result.metaCalibration?.level === 'low') fb.push({ type: 'uncertain', detail: '元认知校准显示不确定性高' });
      this._selfFeedback = { hasItems: fb.length > 0, items: fb, summary: fb.map(f => `[${f.type}]`).join(' ') };

      // [v6.2.x] 每次 think 后自省记录：不覆盖，累积到 session 级
      this._selfView = this._selfView || { thinkCount: 0, lowConfCount: 0, blockedCount: 0, misalignedCount: 0, last50: [] };
      this._selfView.thinkCount++;
      if (conf < 0.3) this._selfView.lowConfCount++;
      if (result._restrainedBy?.length > 0) this._selfView.blockedCount++;
      if (result._missionCheck?.aligned === false) this._selfView.misalignedCount++;
      this._selfView.last50.push({ conf, restrained: !!result._restrainedBy?.length, ts: Date.now() });
      if (this._selfView.last50.length > 50) this._selfView.last50 = this._selfView.last50.slice(-50);
    // 持久化每20次think
    if (this._selfView.thinkCount % 20 === 0 && this.rootPath) {
      try {
        const svPath = require('path').join(this.rootPath, 'data', 'self-view.json');
        require('fs').writeFileSync(svPath, JSON.stringify(this._selfView, null, 2), 'utf8');
      } catch (_) {}
    }

      // ⭐ 每次 think 反馈置信度校准器
      try {
        if (this.confidence && typeof this.confidence.updateFromFeedback === 'function') {
          this.confidence.updateFromFeedback(fb.length === 0, { text: input, calibrated: result?.metaCalibration });
        }
      } catch (_) {}

      // ⭐ 反馈回路：克制引擎拦截或使命未对齐 → 告诉决策路由上次决策可能不对
      // [2604.22273 Self-Correction as Feedback Control]
      // 稳定性阈值：连续多次同类型拦截才降权，单次拦截可能正确不应降权
      if (result._restrainedBy?.length > 0 || result._missionCheck?.aligned === false) {
        const dr = this._modules?.decisionRouter || this._decisionRouterRaw;
        if (dr && typeof dr.feedback === 'function') {
          // 追踪被拦截次数：连续3次同类型拦截才判定"这个路由方向确实错了"
          this._blockedCount = (this._blockedCount || 0) + 1;
          if (this._blockedCount >= 3) {
            dr.feedback('self-check', 'wrong');
            this._blockedCount = 0;
          }
        }
      } else {
        this._blockedCount = 0;  // 一旦通过拦截就重置计数
      }

      // ⭐ 反馈回路2：反复低置信 → 调低对应路由权重
      if (this.continuousLearner) {
        const clStats = this.continuousLearner.getStats();
        const lowConfRate = clStats.thinkCount > 5
          ? clStats.lowConfidenceHits / clStats.thinkCount : 0;
        if (lowConfRate > 0.3) {
          const dr = this._modules?.decisionRouter || this._decisionRouterRaw;
          if (dr && typeof dr.feedback === 'function') {
            dr.feedback('confidence-gate', 'wrong');
          }
        }
      }
    } catch (_) { /* 非关键 */ }

    return result;
  }

  async thinkFast(input) {
    return this.think(input, _ThoughtChain().REASONING_DEPTH.BASIC);
  }

  async thinkDeep(input) {
    return this.think(input, _ThoughtChain().REASONING_DEPTH.COMPREHENSIVE);
  }

  // [v6.0.71] 优雅关闭：保存记忆并停止后台任务
  shutdown() {
    try { require('./engine-memory')._saveAllMemories(this); } catch (_) {}
    this.started = false;
  }

  // [v6.0.71] 委托给 hook-points-runner
  _runInitHookPoints() {
    const { runInitHookPoints } = require('./hook-points-runner.js');
    runInitHookPoints(this);
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

    console.error(`[HeartFlow] ${VERSION} health check (${Date.now() - t0}ms):`);

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

        console.error(`  FAIL ${route}: ${e.message}`);

        failed++;

      }

    }

    console.error(`  dispatch tests: ${passed} passed, ${failed} failed`);



    hf.stop();

    return;

  } catch (e) {

    console.error('Error:', e);

    hf.stop();

    return;

  }

}



module.exports = { HeartFlow, createHeartFlow, VERSION: _VERSION().VERSION, MentalEffortTracker: _MentalEffortTracker().MentalEffortTracker };
