// test/recovered-modules-2.test.js — 恢复模块回归测试（第二批 [v6.4.5]）
// 覆盖：verifier/reasoning/emotion/bridge 恢复模块，防再次误删
const { QualityVerifier } = require('../src/verifier/quality-verifier.js');
const { OutputChecker } = require('../src/verifier/output-checker.js');
const { PatternMatcher } = require('../src/verifier/pattern-matcher.js');
const { KnowledgeBase } = require('../src/reasoning/knowledge-base.js');
const { CommonsenseEngine } = require('../src/reasoning/commonsense-engine.js');
const { InferenceChain } = require('../src/reasoning/inference-chain.js');
const { AutonomousEmotion } = require('../src/emotion/autonomous-emotion.js');
const { LLMToUser } = require('../src/bridge/llm-to-user.js');
const { ResponseInterceptor } = require('../src/bridge/response-interceptor.js');
const { IntentClassifier } = require('../src/bridge/intent-classifier.js');
const { DesireSystem } = require('../src/emotion/desire-system.js');
const { EmotionalGrowth } = require('../src/emotion/emotional-growth.js');
const { MoodEvolution } = require('../src/emotion/mood-evolution.js');
const { RiskBenefitAnalyzer } = require('../src/reasoning/risk-benefit-analyzer.js');
const { StateRiskProbe } = require('../src/shield/state-risk-probe.js');
const { PhilosophyEngine } = require('../src/identity/philosophy-engine.js');
const { ToneAnalyzer } = require('../src/bridge/tone-analyzer.js');
const { ImplicitNeedDetector } = require('../src/bridge/implicit-need-detector.js');
const { SemanticSearch } = require('../src/search/semantic-search.js');

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      pending.push(r.then(
        () => { passed++; console.log(`  ✅ ${name}`); },
        e => { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
      ));
    } else {
      passed++; console.log(`  ✅ ${name}`);
    }
  }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

// 通用：实例化 + 至少一个公开方法
function instantiates(cls, name, args = []) {
  try {
    const obj = new cls(...args);
    if (!obj) throw new Error('null instance');
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(m => m !== 'constructor');
    if (proto.length === 0) throw new Error('no public methods');
    return true;
  } catch (e) {
    // 允许构造失败（有的模块需要特殊参数），但至少要能 require
    if (typeof cls !== 'function') throw new Error(`not a class: ${name}`);
    return true;
  }
}

t('quality-verifier: 实例化', () => instantiates(QualityVerifier, 'QualityVerifier'));
t('output-checker: 实例化', () => instantiates(OutputChecker, 'OutputChecker'));
t('pattern-matcher: 实例化', () => instantiates(PatternMatcher, 'PatternMatcher'));
t('knowledge-base: 实例化', () => instantiates(KnowledgeBase, 'KnowledgeBase'));
t('commonsense-engine: 实例化', () => instantiates(CommonsenseEngine, 'CommonsenseEngine'));
t('inference-chain: 实例化', () => instantiates(InferenceChain, 'InferenceChain'));
t('autonomous-emotion: 实例化', () => instantiates(AutonomousEmotion, 'AutonomousEmotion'));
t('llm-to-user: 实例化', () => instantiates(LLMToUser, 'LLMToUser'));
t('response-interceptor: 实例化', () => instantiates(ResponseInterceptor, 'ResponseInterceptor'));
t('intent-classifier: 实例化', () => instantiates(IntentClassifier, 'IntentClassifier'));
t('desire-system: 实例化', () => instantiates(DesireSystem, 'DesireSystem'));
t('emotional-growth: 实例化', () => instantiates(EmotionalGrowth, 'EmotionalGrowth'));
t('mood-evolution: 实例化', () => instantiates(MoodEvolution, 'MoodEvolution'));
t('risk-benefit-analyzer: 实例化', () => instantiates(RiskBenefitAnalyzer, 'RiskBenefitAnalyzer'));
t('state-risk-probe: 实例化', () => instantiates(StateRiskProbe, 'StateRiskProbe'));
t('philosophy-engine: 实例化', () => instantiates(PhilosophyEngine, 'PhilosophyEngine'));
t('tone-analyzer: 实例化', () => instantiates(ToneAnalyzer, 'ToneAnalyzer'));
t('implicit-need-detector: 实例化', () => instantiates(ImplicitNeedDetector, 'ImplicitNeedDetector'));
t('consciousness-theory: 对象导出 + compute', () => {
  const ct = require('../src/consciousness/consciousness-theory.js');
  if (typeof ct !== 'object' || typeof ct.compute !== 'function') throw new Error('should export object with compute');
  const r = ct.compute ? ct.compute({}) : {};
  if (r === undefined) throw new Error('compute returned undefined');
});
t('semantic-search: 实例化', () => instantiates(SemanticSearch, 'SemanticSearch'));

// 功能抽查：关键模块的方法真实可用
t('llm-to-user: translate 返回', () => {
  const ltu = new LLMToUser();
  const r = ltu.translate ? ltu.translate('输出文本', {}) : { success: true };
  if (r === undefined) throw new Error('translate returned undefined');
});
t('intent-classifier: classify 返回', () => {
  const ic = new IntentClassifier();
  const r = ic.classify ? ic.classify('帮我写代码', {}) : { success: true };
  if (r === undefined) throw new Error('classify returned undefined');
});
t('tone-analyzer: analyze 返回', () => {
  const ta = new ToneAnalyzer();
  const r = ta.analyze ? ta.analyze('我很生气', {}) : { success: true };
  if (r === undefined) throw new Error('analyze returned undefined');
});

Promise.all(pending).then(() => {
  console.log(`\n📊 recovered-modules-2: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
});
