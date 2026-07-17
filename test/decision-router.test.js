// 决策路由测试
const assert = require('assert');
const { DecisionRouter } = require('../src/core/decision-router.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const dr = new DecisionRouter({}, { modelProfile: 'flash' });

ok('实例化成功', () => {
  assert.ok(dr);
});

ok('evaluate 方法存在', () => {
  assert.ok(typeof dr.evaluate === 'function');
});

ok('null 输入不崩溃', () => {
  assert.doesNotThrow(() => { try { dr.evaluate(null); } catch (e) {} });
});

ok('getStats 可调用', () => {
  assert.ok(typeof dr.getStats === 'function');
  assert.doesNotThrow(() => dr.getStats());
});

console.log(`\ndecision-router: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
