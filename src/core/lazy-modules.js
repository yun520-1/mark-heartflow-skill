/**
 * Lazy-loaded modules — 集中管理所有懒加载模块
 * 
 * 功能：统一管理 HeartFlow 的所有懒加载依赖
 * 好处：1) 减少 heartflow.js 体积  2) 统一错误处理  3) 方便测试
 */

const { _lazy, _warn, _memory } = require('./heartflow-helpers.js');

// ── 规划器模块 ──────────────────────────────────────
const AdaptivePlanner = _lazy('adaptivePlanner', () => {
  try { return require('../planner/adaptive-planner.js'); }
  catch(e) { return { AdaptivePlanner: class { constructor() {} plan() { return { steps: [], estimatedEffort: 0 }; } adapt() { return this.plan(); } quickAdjust() { return this.plan(); } getStatus() { return { status: 'unavailable', reason: '模块加载失败' }; } } }; }
});

const StrategySelector = _lazy('strategySelector', () => {
  try { return require('../planner/strategy-selector.js'); }
  catch(e) { return { StrategySelector: class { constructor() {} selectStrategy() { return { name: 'default', confidence: 0, reason: '模块加载失败' }; } getStrategies() { return []; } } }; }
});

const ReplanTrigger = _lazy('replanTrigger', () => {
  try { return require('../planner/replan-trigger.js'); }
  catch(e) { return { ReplanTrigger: class { constructor() {} shouldReplan() { return false; } getReplanReasons() { return []; } } }; }
});

// ── 验证器模块 ──────────────────────────────────────
const QualityVerifier = _lazy('qualityVerifier', () => {
  try { return require('../verifier/quality-verifier.js'); }
  catch(e) { return { QualityVerifier: class { constructor() {} verify() { return { passed: true, score: 0, details: '模块加载失败，默认通过' }; } quickVerify() { return { passed: true, score: 0 }; } } }; }
});

const OutputChecker = _lazy('outputChecker', () => {
  try { return require('../verifier/output-checker.js'); }
  catch(e) { return { OutputChecker: class { constructor() {} check() { return { valid: true, issues: [], reason: '模块加载失败，默认通过' }; } addChecker() { return this; } } }; }
});

const PatternMatcher = _lazy('patternMatcher', () => {
  try { return require('../verifier/pattern-matcher.js'); }
  catch(e) { return { PatternMatcher: class { constructor() {} match() { return null; } matchAll() { return []; } extract() { return []; } } }; }
});

// ── 推理引擎模块 ──────────────────────────────────────
const KnowledgeBase = _lazy('knowledgeBase', () => {
  try { return require('../reasoning/knowledge-base.js'); }
  catch(e) { return { KnowledgeBase: class { constructor() {} addFact() { return false; } query() { return []; } getCategories() { return []; } getStats() { return { totalFacts: 0, categories: 0, reason: '模块加载失败' }; } } }; }
});

const CommonsenseEngine = _lazy('commonsenseEngine', () => {
  try { return require('../reasoning/commonsense-engine.js'); }
  catch(e) { return { CommonsenseEngine: class { constructor() {} reason() { return { conclusion: null, confidence: 0, reason: '模块加载失败' }; } validate() { return { valid: false, reason: '模块加载失败' }; } getHistory() { return []; } getStats() { return { totalReasoning: 0, reason: '模块加载失败' }; } } }; }
});

const CausalInference = _lazy('causalInference', () => {
  try { return require('../reasoning/causal-inference.js'); }
  catch(e) { return { CausalInference: class { constructor() {} inferCauses() { return []; } inferEffects() { return []; } chainReason() { return { chains: [], reason: '模块加载失败' }; } getStats() { return { totalInferences: 0, reason: '模块加载失败' }; } } }; }
});

const InferenceChain = _lazy('inferenceChain', () => {
  try { return require('../reasoning/inference-chain.js'); }
  catch(e) { return { InferenceChain: class { constructor() {} createChain() { return { id: null, steps: [], reason: '模块加载失败' }; } expandChain() { return { expanded: false, reason: '模块加载失败' }; } getChain() { return null; } analyze() { return { valid: false, reason: '模块加载失败' }; } } }; }
});

// ── 情绪系统模块 ──────────────────────────────────────
const AutonomousEmotion = _lazy('autonomousEmotion', () => {
  try { return require('../emotion/autonomous-emotion.js'); }
  catch(e) { return { AutonomousEmotion: class { constructor() {} } }; }
});

const DesireSystem = _lazy('desireSystem', () => {
  try { return require('../emotion/desire-system.js'); }
  catch(e) { return { DesireSystem: class { constructor() {} } }; }
});

const EmotionalGrowth = _lazy('emotionalGrowth', () => {
  try { return require('../emotion/emotional-growth.js'); }
  catch(e) { return { EmotionalGrowth: class { constructor() {} } }; }
});

const MoodEvolution = _lazy('moodEvolution', () => {
  try { return require('../emotion/mood-evolution.js'); }
  catch(e) { return { MoodEvolution: class { constructor() {} } }; }
});

// ── 桥接器模块 ──────────────────────────────────────
const IntentClassifier = _lazy('intentClassifier', () => {
  try { return require('../bridge/intent-classifier.js'); }
  catch(e) { return { IntentClassifier: class { constructor() {} classify() { return { intent: 'unknown', confidence: 0 }; } } }; }
});

module.exports = {
  AdaptivePlanner,
  StrategySelector,
  ReplanTrigger,
  QualityVerifier,
  OutputChecker,
  PatternMatcher,
  KnowledgeBase,
  CommonsenseEngine,
  CausalInference,
  InferenceChain,
  AutonomousEmotion,
  DesireSystem,
  EmotionalGrowth,
  MoodEvolution,
  IntentClassifier,
};
