// logic-patterns 测试 — 补 v6.1.0 缺失测试覆盖
// 验证：纯函数 _matchKeywords / _matchAnyRegex + 常量结构完整
const assert = require('assert');
const LP = require('../src/reasoning/logic-patterns.js');

module.exports = function ({ test }) {
  test('_matchKeywords: 命中计数与匹配词', () => {
    const r = LP._matchKeywords('如果下雨那么地湿', ['如果', '那么', '则']);
    assert.strictEqual(r.hits, 2);
    assert.deepStrictEqual(r.matched.sort(), ['如果', '那么']);
  });

  test('_matchKeywords: 空输入不抛、hits=0', () => {
    const r = LP._matchKeywords('', ['x']);
    assert.strictEqual(r.hits, 0);
    assert.strictEqual(r.ratio, 0);
  });

  test('_matchKeywords: null/undefined 输入安全', () => {
    assert.doesNotThrow(() => LP._matchKeywords(null, ['x']));
    assert.doesNotThrow(() => LP._matchKeywords(undefined, ['x']));
  });

  test('_matchKeywords: 空关键词列表 ratio=0 不除零', () => {
    const r = LP._matchKeywords('abc', []);
    assert.strictEqual(r.ratio, 0);
  });

  test('_matchAnyRegex: 命中返回 true', () => {
    assert.strictEqual(LP._matchAnyRegex('所有猫都爱吃鱼', [/所有.+都/i]), true);
  });

  test('_matchAnyRegex: 不命中返回 false', () => {
    assert.strictEqual(LP._matchAnyRegex('今天天气不错', [/所有.+都/i, /必然/i]), false);
  });

  test('_matchAnyRegex: 空 patterns 返回 false', () => {
    assert.strictEqual(LP._matchAnyRegex('任意文本', []), false);
  });

  test('REASONING_PATTERNS: 含演绎/归纳等核心推理类型', () => {
    const ids = LP.REASONING_PATTERNS.map(p => p.id);
    assert.ok(ids.includes('deductive'));
    assert.ok(ids.includes('inductive'));
  });

  test('FALLACY_PATTERNS: 存在（稻草人/滑坡等谬误库）', () => {
    assert.ok(Array.isArray(LP.FALLACY_PATTERNS));
    assert.ok(LP.FALLACY_PATTERNS.length > 0);
  });

  test('PROBLEM_PATTERNS / FRAMEWORKS: 存在且非空对象', () => {
    assert.ok(LP.PROBLEM_PATTERNS && typeof LP.PROBLEM_PATTERNS === 'object');
    assert.ok(LP.FRAMEWORKS && typeof LP.FRAMEWORKS === 'object');
    assert.ok(Object.keys(LP.PROBLEM_PATTERNS).length > 0);
  });
};
