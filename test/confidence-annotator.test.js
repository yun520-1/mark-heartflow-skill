// 置信度标注器测试
const assert = require('assert');
const { confidenceAnnotator: ca } = require('../src/core/confidence-annotator.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

ok('null/undefined claim 安全处理', () => {
  assert.doesNotThrow(() => { ca.annotateClaim(null); ca.annotateClaim(undefined); });
});

ok('annotateText 返回字符串', () => {
  const r = ca.annotateText('太阳从东边升起', 'high');
  assert.ok(typeof r === 'string' && r.length > 0);
});

ok('aggregateConfidence 处理 null 值', () => {
  const scores = [0.8, null, 0.6, undefined];
  // 验证 null/undefined 被安全跳过（不抛出）
  assert.doesNotThrow(() => ca.aggregateConfidence(scores));
});

ok('evaluate 方法存在且可调用', () => {
  assert.ok(typeof ca.evaluate === 'function');
  assert.doesNotThrow(() => ca.evaluate('某结论', { level: 'medium' }));
});

console.log(`\nconfidence-annotator: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
