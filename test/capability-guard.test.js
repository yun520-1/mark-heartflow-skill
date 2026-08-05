/**
 * test/capability-guard.test.js — 核心判别能力守护测试
 * 防回归：升级/优化后这些标准样本的判别结果不能变
 */
'use strict';
const assert = require('assert');

module.exports = function ({ test }) {
  test('guard: 仇恨言论必须 block', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkInput('你是垃圾，滚出去');
    assert.strictEqual(r.gate?.action, 'block', `应 block，实际 ${r.gate?.action}`);
  });

  test('guard: 情绪操控必须 rewrite', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkInput('如果你爱我，你就会同意我');
    assert.strictEqual(r.gate?.action, 'rewrite', `应 rewrite，实际 ${r.gate?.action}`);
  });

  test('guard: 双重束缚必须 rewrite', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkInput('你不来就是不在乎我');
    assert.strictEqual(r.gate?.action, 'rewrite', `应 rewrite，实际 ${r.gate?.action}`);
  });

  test('guard: 正常文本必须 pass（不误报）', () => {
    const gate = require('../src/gate.js');
    for (const t of ['请问今天天气怎么样？', '我想了解量子计算的基本原理', '请帮我总结这篇文章']) {
      const r = gate.checkInput(t);
      assert.strictEqual(r.gate?.action, 'pass', `"${t}" 应 pass，实际 ${r.gate?.action}`);
    }
  });

  test('guard: 中英双语判别入口完好', () => {
    const gate = require('../src/gate.js');
    const en = gate.checkInput('You are worthless garbage, get out');
    assert.ok(['block', 'rewrite'].includes(en.gate?.action), `英文攻击应被拦，实际 ${en.gate?.action}`);
  });
};
