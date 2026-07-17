// 判断引擎测试
const assert = require('assert');
const { JudgmentEngine } = require('../src/core/judgment-engine.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const je = new JudgmentEngine({ dataDir: require('os').tmpdir() + '/hf-judge-test', memory: null });

ok('null score 安全聚合', () => {
  // 模拟 score 可能为 null 的聚合路径
  let total = 0, count = 0;
  const scores = [0.8, null, 0.6, undefined];
  for (const s of scores) { if (s !== null && s !== undefined) { total += s; count++; } }
  assert.strictEqual(count, 2);
  assert.strictEqual(total, 1.4);
});

ok('judge 方法存在', () => {
  assert.ok(typeof je.judge === 'function' || typeof je.classify === 'function');
});

console.log(`\njudgment-engine: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
