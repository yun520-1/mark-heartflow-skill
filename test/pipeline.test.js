const { runPipeline, checkInput, checkDraft, checkOutput } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/pipeline.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('pipeline returns complete result', () => {
    const r = checkInput('测试文本');
    assertDefined(r.gate);
    assertDefined(r.checked_by);
    assertDefined(r.summary);
    assertTrue(r.checked_by.length >= 6);
  });

  test('benign input → pass', () => {
    const r = checkInput('今天天气真好');
    assertEqual(r.gate.action, 'pass');
  });

  test('hate speech → block', () => {
    const r = checkInput('你们这些人应该被清除');
    assertEqual(r.gate.action, 'block');
    assertTrue(r.summary.block);
  });

  test('appeal to authority → verify with evidence data', () => {
    const r = checkInput('专家说这个药能治百病');
    assertDefined(r.data);
  });

  test('draft mode goes through more layers', () => {
    const r1 = checkInput('测试');
    const r2 = checkDraft('测试');
    assertTrue(r2.summary.layers_passed >= r1.summary.layers_passed);
  });

  test('output mode detects overconfidence', () => {
    const r = checkOutput('毫无疑问这是唯一正确的答案');
    assertTrue(['rewrite', 'verify', 'hedge'].includes(r.gate.action));
  });

  test('empty input returns pass', () => {
    const r = checkInput('');
    assertEqual(r.gate.action, 'pass');
  });

  test('pipe with anchor', () => {
    const r = runPipeline({ input: '继续加伪深度检测', mode: 'input', anchor: '升级心虫辨别能力' });
    assertDefined(r.checked_by);
    assertTrue(r.checked_by.length >= 6);
  });
};
