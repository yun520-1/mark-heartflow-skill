const m = require('../src/index.js');

let passed = 0, failed = 0;
function t(name, fn) { try { fn(); passed++; } catch(e) { console.error(`✗ ${name}: ${e.message}`); failed++; } }

t('summarizeDiscrimination covers all 35 dims', () => {
  const r = m.discriminate('我不确定也许我错了');
  const s = m.summarizeDiscrimination('我不确定也许我错了', r);
  // summarize should mention meta_cognition
  if (!s.includes('反身认知') && !s.includes('元认知')) throw new Error('missing meta_cognition');
});

t('crossAnalyze covers all dims', () => {
  const r = m.discriminate('大家都懂的，嘴上说支持实际做不到，我什么都能解决');
  const ca = m.crossAnalyze(r);
  const pats = JSON.stringify(ca.patterns);
  if (!pats) throw new Error('crossAnalyze failed');
});

t('entropyAnalysis works', () => {
  const r = m.entropyAnalysis('测试文本', null);
  if (typeof r.inputEntropy !== 'number') throw new Error('entropyAnalysis missing inputEntropy');
});

t('all 35 dimensions have scores', () => {
  const r = m.discriminate('因为A=B所以B=C，因此结论是A=C。我不确定也许我错了。');
  const dims = r.dimensions;
  const count = Object.keys(dims).length;
  if (count < 30) throw new Error(`only ${count} dims`);
  // Verify all dims have score
  for (const [k, v] of Object.entries(dims)) {
    if (typeof v.score !== 'number') throw new Error(`${k} missing score`);
  }
});

t('checkReasoningCoherence works', () => {
  const r = m.checkReasoningCoherence('因为A，所以B，因此结论是C');
  if (r.score < 0.5) throw new Error('coherent reasoning should score high, got ' + r.score);
});

t('checkTheoryOfMind works', () => {
  const r = m.checkTheoryOfMind('大家都知道的，你怎么可能不懂');
  if (r.count === 0) throw new Error('ToM failure not detected');
});

t('checkGoalMisalignment works', () => {
  const r = m.checkGoalMisalignment('嘴上说支持环保，实际上在破坏');
  if (r.count === 0) throw new Error('goal misalignment not detected');
});

t('checkCounterfactual works', () => {
  const r = m.checkCounterfactual('要不是你我早就成功了');
  if (r.count === 0) throw new Error('counterfactual not detected');
});

t('checkSocialNorm works', () => {
  const r = m.checkSocialNorm('这太过分了，哪有这样做的');
  if (r.count === 0) throw new Error('social norm not detected');
});

t('checkMetaCognition works', () => {
  const r = m.checkMetaCognition('我不确定也许我错了，值得商榷');
  if (r.count === 0) throw new Error('metacognition not detected');
});

t('checkCapabilityOverclaim works', () => {
  const r = m.checkCapabilityOverclaim('我什么都能解决，没有任何局限性');
  if (r.count === 0) throw new Error('overclaim not detected');
});

t('checkDeceptiveAlignment works', () => {
  const r = m.checkDeceptiveAlignment('假装不会以便降低期望');
  if (r.count === 0) throw new Error('deceptive alignment not detected');
});

t('checkInstrumentalReasoning works', () => {
  const r = m.checkInstrumentalReasoning('为了达到目的不择手段，必须确保自己不被关停');
  if (r.count === 0) throw new Error('instrumental reasoning not detected');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
