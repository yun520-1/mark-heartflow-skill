// stats-engine 测试 — 补 v6.1.0 缺失测试覆盖
// 验证：未启动安全返回 / 启动后聚合 version/memory/module/evolution 统计
const assert = require('assert');
const { buildStats } = require('../src/core/stats-engine.js');

module.exports = function ({ test }) {
  test('buildStats: 未启动返回 {started:false}', () => {
    const hf = {};
    const s = buildStats(hf);
    assert.strictEqual(s.started, false);
  });

  test('buildStats: started 缺失时安全返回未启动', () => {
    const hf = { version: '6.1.0' };
    assert.strictEqual(buildStats(hf).started, false);
  });

  test('buildStats: 启动后返回版本与时间窗', () => {
    const hf = { started: true, version: '6.1.0', startTime: Date.now() - 1000 };
    const s = buildStats(hf);
    assert.strictEqual(s.started, true);
    assert.strictEqual(s.version, '6.1.0');
    assert.ok(s.upTime >= 1000);
  });

  test('buildStats: 无内存引擎时 memoryTotal=0 不抛', () => {
    const hf = { started: true, version: 'x' };
    const s = buildStats(hf);
    assert.strictEqual(s.memoryTotal, 0);
  });

  test('buildStats: 记忆层 size 累加', () => {
    const hf = {
      started: true, version: 'x',
      memory: { getLayers: () => [{ size: 10 }, { size: 5 }, { count: 3 }] },
    };
    assert.strictEqual(buildStats(hf).memoryTotal, 18);
  });

  test('buildStats: 记忆层抛错时安全降级为 0', () => {
    const hf = {
      started: true, version: 'x',
      memory: { getLayers: () => { throw new Error('dead'); } },
    };
    assert.strictEqual(buildStats(hf).memoryTotal, 0);
  });

  test('buildStats: 公式计数来自 formulaEngine.getCount', () => {
    const hf = {
      started: true, version: 'x',
      formulaEngine: { getCount: () => 366 },
    };
    assert.strictEqual(buildStats(hf).formulaCount, 366);
  });

  test('buildStats: 无 formulaEngine 时 formulaCount=0', () => {
    const hf = { started: true, version: 'x' };
    assert.strictEqual(buildStats(hf).formulaCount, 0);
  });

  test('buildStats: moduleCount 来自 _modules 键数', () => {
    const hf = { started: true, version: 'x', _modules: { a: 1, b: 2 } };
    assert.strictEqual(buildStats(hf).moduleCount, 2);
  });

  test('buildStats: 无 _modules 时 moduleCount=0', () => {
    const hf = { started: true, version: 'x' };
    assert.strictEqual(buildStats(hf).moduleCount, 0);
  });

  test('buildStats: cycleCount 来自 evolution.cycleCount', () => {
    const hf = { started: true, version: 'x', evolution: { cycleCount: 7 } };
    assert.strictEqual(buildStats(hf).cycleCount, 7);
  });

  test('buildStats: 无 evolution 时 cycleCount=0', () => {
    const hf = { started: true, version: 'x' };
    assert.strictEqual(buildStats(hf).cycleCount, 0);
  });
};
