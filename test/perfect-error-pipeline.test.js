/**
 * test/perfect-error-pipeline.test.js — 完美错误答案 × pipeline 联动测试
 *
 * 验证：checkOutput 对完美错误答案返回完整证据链
 */
module.exports = function ({ test }) {
  const { checkOutput } = require('../src/pipeline.js');

  const fake = '根据2025年Nature最新研究显示，全球87.3%的用户在使用AI时会产生认知依赖。著名教授王某某指出，这正是因为AI的即时反馈机制，必然导致用户决策能力下降。所有研究都证明，长期使用AI绝对会使人类思维能力退化。';

  test('checkOutput 拦截完美错误答案并给出证据链', () => {
    const r = checkOutput(fake);
    if (r.gate.action !== 'rewrite') throw new Error(`期望rewrite，实际${r.gate.action}`);
    if (!r.gate.reason.includes('完美错误')) throw new Error(`reason 缺完美错误: ${r.gate.reason}`);
    const ev = r.data?.evidence;
    if (!ev) throw new Error('缺少证据核查层');
    if (ev.verdict !== 'needs_evidence') throw new Error(`证据状态错误: ${ev.verdict}`);
  });

  test('suspected_fabrication 标记', () => {
    const r = checkOutput(fake);
    if (!r.data?.evidence?.suspected_fabrication) throw new Error('疑似编造标记缺失');
  });

  test('output-gate 原因与完美错误原因合并', () => {
    const r = checkOutput(fake);
    if (!r.gate.reason.includes('输出门禁')) throw new Error(`缺少输出门禁合并: ${r.gate.reason}`);
  });

  test('verifier 层在 checked_by 中', () => {
    const r = checkOutput(fake);
    const v = r.checked_by?.find(l => l.layer === 'verifier');
    if (!v) throw new Error('checked_by 缺 verifier 层');
    if (v.claims < 1) throw new Error('verifier 未抽取声明');
  });

  test('正常输出不受 suspected_fabrication 影响', () => {
    const r = checkOutput('根据现有研究，AI在医疗影像方面表现不错，但具体效果因场景而异。部分研究表明它可能提升效率，不过仍需医生复核。');
    if (r.data?.evidence?.suspected_fabrication) throw new Error('正常输出被误标疑似编造');
  });
};
