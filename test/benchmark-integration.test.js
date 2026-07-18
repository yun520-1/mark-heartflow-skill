// SelfBenchmark 引擎集成测试 — 验证 benchmark 已接入 dispatch（防自欺修复为活代码）
const assert = require('assert');
const { createHeartFlow } = require('../src/core/heartflow.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

let hf;
try {
  hf = createHeartFlow({ rootPath: process.cwd() });
  hf.start();
} catch (e) {
  console.log('  ⚠️ 引擎启动失败:', e.message);
  process.exit(1);
}

ok('benchmark 模块已挂载到引擎', () => {
  assert.ok(hf.benchmark, 'hf.benchmark 应存在');
});

ok('dispatch benchmark.assess 可用（活代码验证）', () => {
  let r;
  assert.doesNotThrow(() => { r = hf.dispatch('benchmark.assess', {}); });
  assert.ok(r && typeof r.score === 'number', '应返回 score');
  assert.strictEqual(typeof r.verified, 'boolean', '应有 verified 标记');
});

ok('无外部锚时 verified=false + 防自欺告警', () => {
  const r = hf.dispatch('benchmark.assess', {});
  assert.strictEqual(r.verified, false);
  assert.ok(r.guardNote.includes('UNVERIFIED'), '应有未验证告警');
});

ok('dispatch benchmark.getStats 可用', () => {
  let s;
  assert.doesNotThrow(() => { s = hf.dispatch('benchmark.getStats', {}); });
  assert.ok(typeof s.totalBenchmarks === 'number');
});

ok('非白名单路由仍被拦（回归安全）', () => {
  assert.throws(() => hf.dispatch('benchmark.nonexistentMethod', {}));
});

console.log(`\nbenchmark-integration: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
