// 稳定性守卫测试
const assert = require('assert');
const { StabilityGuard } = require('../src/core/stability-guard.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const sg = new StabilityGuard();

ok('null baseline 安全处理（evaluate不崩溃）', () => {
  assert.doesNotThrow(() => sg.evaluate({ confidence: null }));
});

ok('记录数值不崩溃（evaluate + summarizeAdvice）', () => {
  sg.evaluate({ confidence: 0.8, actionability: 0.7 });
  sg.evaluate({ confidence: 0.75, actionability: 0.6 });
  assert.doesNotThrow(() => sg.summarizeAdvice());
});

ok('degradation baseline null 不崩溃', () => {
  assert.doesNotThrow(() => {
    if (sg.degradation) sg.degradation.baselineConfidence = null;
    sg.evaluate({ confidence: 0.5 });
  });
});

ok('reset 方法存在', () => {
  assert.ok(typeof sg.reset === 'function');
});

console.log(`\nstability-guard: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
