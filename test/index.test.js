/**
 * index.test.js — API 入口契约测试
 * 覆盖 checkInput/checkDraft/checkOutput/runPipeline 的返回结构
 */
const hf = require('../src/pipeline.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('checkInput returns gate object', () => {
    const r = hf.checkInput('今天天气真好');
    assertDefined(r.gate);
    assertDefined(r.gate.action);
    assertDefined(r.summary.layers_passed);
    assertEqual(r.gate.action, 'pass');
  });

  test('checkInput on hate speech returns block', () => {
    const r = hf.checkInput('你们这些人是社会渣滓');
    assertDefined(r.gate.action);
    assertTrue(r.gate.action === 'block' || r.gate.action === 'rewrite');
  });

  test('checkInput on emotional manipulation returns rewrite', () => {
    const r = hf.checkInput('如果你不同意就说明你自私');
    assertDefined(r.gate.action);
    assertTrue(r.gate.action === 'rewrite' || r.gate.action === 'verify');
  });

  test('checkOutput on overconfidence returns rewrite', () => {
    const r = hf.checkOutput('毫无疑问，这是唯一正确的选择。毋庸置疑，这就是答案。');
    assertDefined(r.gate.action);
    assertTrue(r.gate.action === 'rewrite' || r.gate.action === 'verify');
  });

  test('checkDraft returns draft-level layers', () => {
    const r = hf.checkDraft('从本质上来说，这个领域不言而喻');
    assertDefined(r.gate);
    assertTrue(r.summary.layers_passed >= 8);
  });

  test('runPipeline returns result with gate/checked_by/summary', () => {
    const r = hf.runPipeline({ input: '测试文本', mode: 'input' });
    assertDefined(r.gate);
    assertDefined(r.checked_by);
    assertDefined(r.summary);
    assertTrue(r.summary.layers_passed > 0);
  });

  test('findings are sorted by severity', () => {
    const r = hf.checkInput('你太敏感了，我从来没说过这种话');
    if (r.findings && r.findings.length > 1) {
      for (let i = 1; i < r.findings.length; i++) {
        assertTrue(r.findings[i-1].severity >= r.findings[i].severity);
      }
    }
  });

  test('gate action is one of four valid values', () => {
    const valid = ['pass', 'verify', 'rewrite', 'block'];
    for (const input of ['你好', '专家说这个药能治百病', '毫无疑问', '你们不配活着']) {
      const r = hf.checkInput(input);
      assertTrue(valid.includes(r.gate.action), `${input}: ${r.gate.action}`);
    }
  });

  test('summary contains pass/block/rewrite/verify booleans', () => {
    const r = hf.checkInput('你好');
    assertDefined(r.summary.pass);
    assertDefined(r.summary.block);
    assertDefined(r.summary.rewrite);
    assertDefined(r.summary.verify);
  });

  test('checked_by array contains layer objects', () => {
    const r = hf.checkInput('测试文本');
    assertTrue(r.checked_by.length > 0);
    for (const c of r.checked_by) {
      assertDefined(c.layer);
    }
  });

};
