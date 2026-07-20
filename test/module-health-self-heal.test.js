// 模块健康检查自修复测试
const assert = require('assert');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

// 构造一个假 heartflow（含缺接口的模块）
const hf = { _modules: {} };
for (let i = 0; i < 120; i++) {
  hf._modules['mod' + i] = { doWork() {} }; // 无 destroy/stop/getStats
}
// 5个健康模块
for (let i = 0; i < 5; i++) {
  hf._modules['healthy' + i] = { destroy() {}, getStats() { return {}; } };
}

const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
const checker = new ModuleHealthChecker(hf);

ok('normalizeModules 注入标准接口', () => {
  const n = checker.normalizeModules();
  assert.strictEqual(n, 120); // 120 个缺接口的被 normalize
});

ok('注入后模块都有 destroy + getStats', () => {
  for (const mod of Object.values(hf._modules)) {
    assert.strictEqual(typeof mod.destroy, 'function');
    assert.strictEqual(typeof mod.getStats, 'function');
  }
});

ok('check() 后已无 degraded（全部 healthy）', () => {
  const report = checker.check();
  assert.strictEqual(report.degraded, 0);
  assert.strictEqual(report.healthy, 125);
  assert.strictEqual(report.failed, 0);
});

ok('getStats 返回基础统计对象', () => {
  const s = hf._modules['mod0'].getStats();
  assert.ok(typeof s === 'object' && 'methods' in s);
});

console.log(`\nmodule-health-self-heal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
