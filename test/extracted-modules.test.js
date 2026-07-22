// [v6.0.65] 自我升级：为重构提取的 3 个模块补 TDD 冒烟测试
// 覆盖 hook-points-runner / stats-engine / logic-patterns
// 兼容 run-all.js 动态接入风格：导出函数，不自行 process.exit
module.exports = function run({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const assert = require('assert');

  // ─── hook-points-runner ──────────────────────────────
  const { runInitHookPoints } = require('../src/core/hook-points-runner.js');

  test('hook-points-runner: runInitHookPoints 是函数', () => {
    assert.strictEqual(typeof runInitHookPoints, 'function');
  });

  test('hook-points-runner: 无 _initHookPoints 时安全返回（降级）', () => {
    assert.doesNotThrow(() => runInitHookPoints({}));
  });

  test('hook-points-runner: 按优先级执行 handlers 并写入 state', () => {
    const order = [];
    const hf = {
      rootPath: '/tmp',
      _initHookPoints: {
        getAllHandlers: () => [
          { name: 'b', priority: 2, handler: () => order.push('b') },
          { name: 'a', priority: 1, handler: () => order.push('a') },
        ],
      },
    };
    runInitHookPoints(hf);
    assert.deepStrictEqual(order, ['a', 'b']);
    assert.ok(hf._initHookPointState);
  });

  test('hook-points-runner: softInit handler 抛错不中断（warn 降级）', () => {
    const hf = {
      _initHookPoints: {
        getAllHandlers: () => [
          { name: 'soft', priority: 1, softInit: true, handler: () => { throw new Error('boom'); } },
        ],
      },
    };
    assert.doesNotThrow(() => runInitHookPoints(hf));
  });

  test('hook-points-runner: 非 softInit handler 抛错向上抛', () => {
    const hf = {
      _initHookPoints: {
        getAllHandlers: () => [
          { name: 'hard', priority: 1, handler: () => { throw new Error('boom'); } },
        ],
      },
    };
    assert.throws(() => runInitHookPoints(hf), /hard failed/);
  });

  // ─── stats-engine ────────────────────────────────────
  const { buildStats } = require('../src/core/stats-engine.js');

  test('stats-engine: buildStats 是函数', () => {
    assert.strictEqual(typeof buildStats, 'function');
  });

  test('stats-engine: 未启动返回 { started: false }', () => {
    assert.deepStrictEqual(buildStats({ started: false }), { started: false });
  });

  test('stats-engine: 已启动返回完整统计字段', () => {
    const hf = {
      started: true,
      version: '6.0.65',
      startTime: Date.now() - 1000,
      _modules: { a: {}, b: {} },
      memory: { getLayers: () => [{ size: 3 }, { count: 5 }] },
      formulaEngine: { getCount: () => 382 },
      evolution: { cycleCount: 7 },
    };
    const s = buildStats(hf);
    assert.strictEqual(s.started, true);
    assert.strictEqual(s.version, '6.0.65');
    assert.strictEqual(s.moduleCount, 2);
    assert.strictEqual(s.memoryTotal, 8);
    assert.strictEqual(s.formulaCount, 382);
    assert.strictEqual(s.cycleCount, 7);
    assert.ok(s.upTime >= 0);
  });

  test('stats-engine: memory.getLayers 抛错时降级 memoryTotal=0', () => {
    const hf = {
      started: true, _modules: {},
      memory: { getLayers: () => { throw new Error('db down'); } },
    };
    const s = buildStats(hf);
    assert.strictEqual(s.memoryTotal, 0);
  });

  // ─── logic-patterns ──────────────────────────────────
  const lp = require('../src/reasoning/logic-patterns.js');

  test('logic-patterns: 导出全部常量 + 纯函数', () => {
    ['_matchKeywords', '_matchAnyRegex', 'REASONING_PATTERNS', 'FALLACY_PATTERNS', 'FRAMEWORKS', 'PROBLEM_PATTERNS', 'PROBLEM_FRAMEWORK_MAP']
      .forEach(k => assert.ok(lp[k] !== undefined, `缺 ${k}`));
  });

  test('logic-patterns: _matchKeywords 命中计数正确', () => {
    const r = lp._matchKeywords('如果A那么B', ['如果', '那么', '所以']);
    assert.strictEqual(r.hits, 2);
    assert.ok(r.matched.includes('如果'));
    assert.strictEqual(r.ratio, 2 / 3);
  });

  test('logic-patterns: _matchKeywords 空关键词 ratio=0 不崩', () => {
    const r = lp._matchKeywords('任意文本', []);
    assert.strictEqual(r.hits, 0);
    assert.strictEqual(r.ratio, 0);
  });

  test('logic-patterns: _matchAnyRegex 任一命中返回 true', () => {
    assert.strictEqual(lp._matchAnyRegex('计算总和', [/计算/, /xyz/]), true);
    assert.strictEqual(lp._matchAnyRegex('无关文本', [/xyz/, /abc/]), false);
  });

  test('logic-patterns: REASONING_PATTERNS 结构完整', () => {
    assert.ok(Array.isArray(lp.REASONING_PATTERNS));
    const ids = lp.REASONING_PATTERNS.map(p => p.id);
    assert.ok(ids.includes('deductive'));
    assert.ok(ids.includes('inductive'));
  });
};
