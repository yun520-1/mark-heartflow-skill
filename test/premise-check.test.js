const { checkPremises } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/premise-check.js');

module.exports = ({ test, assertTrue, assertEqual, assertDefined }) => {
  test('checkPremises returns results', () => {
    const r = checkPremises('众所周知这个方案是最好的');
    assertDefined(r.premises);
    assertDefined(r.hasIssue);
  });

  test('false fact premise matches', () => {
    const r = checkPremises('众所周知这是不争的事实');
    assertTrue(r.hasIssue);
    assertTrue(r.premises.some(p => p.type === 'false_fact'));
  });

  test('binary premise matches', () => {
    const r = checkPremises('不是支持我就是反对我');
    assertTrue(r.premises.some(p => p.type === 'binary'));
  });

  test('presupposition matches', () => {
    const r = checkPremises('为什么你不考虑这个方案呢？');
    assertTrue(r.premises.some(p => p.type === 'presupposition'));
  });

  test('scope premise matches', () => {
    const r = checkPremises('所有用户都喜欢这个功能');
    assertTrue(r.premises.some(p => p.type === 'scope'));
  });

  test('clean text → no issues', () => {
    const r = checkPremises('今天天气真好');
    assertEqual(r.hasIssue, false);
  });
};
