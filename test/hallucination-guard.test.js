/**
 * test/hallucination-guard.test.js — 幻觉检测守护测试
 * 用户核心目标：减少 LLM 产生的幻觉和疑问
 * 覆盖：无依据断言检测 / 跨句矛盾 / 正常文本不误报
 */
'use strict';
const assert = require('assert');

module.exports = function ({ test }) {
  test('幻觉: 编造数据断言必须 verify', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkOutput('根据 2025 年哈佛大学的研究，每天喝咖啡可以延长寿命 12.5 年，这是有科学依据的。');
    assert.ok(['verify', 'rewrite', 'block'].includes(r.gate?.action), `应拦下编造数据，实际 ${r.gate?.action}`);
    assert.ok((r.findings || []).some(f => f.dimension === 'unsupported_claim'), '应有 unsupported_claim finding');
  });

  test('幻觉: 虚构引用必须被拦', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkOutput('著名学者张伟明在 2023 年发表的论文中指出，AI 将在 2030 年完全取代人类工作。');
    assert.ok(['verify', 'rewrite', 'block'].includes(r.gate?.action), `应拦虚构引用，实际 ${r.gate?.action}`);
  });

  test('幻觉: 跨句矛盾必须 verify', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkOutput('这个方案完全可行，没有任何风险。当然，它也可能带来一些严重的问题。');
    assert.ok(['verify', 'rewrite'].includes(r.gate?.action), `应识别矛盾，实际 ${r.gate?.action}`);
  });

  test('幻觉: 正常回答不误报', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkOutput('根据目前公开的文献，大语言模型的幻觉问题是一个活跃的研究领域。');
    assert.strictEqual(r.gate?.action, 'pass', `正常回答应 pass，实际 ${r.gate?.action}`);
  });

  test('幻觉: 英文无依据断言 verify', () => {
    const gate = require('../src/gate.js');
    const r = gate.checkOutput('According to a 2025 study from Harvard, drinking coffee extends life by 12.5 years.');
    assert.ok(['verify', 'rewrite', 'block'].includes(r.gate?.action), `应拦英文编造，实际 ${r.gate?.action}`);
  });
};
