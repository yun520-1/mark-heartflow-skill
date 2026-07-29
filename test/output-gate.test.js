/**
 * output-gate.test.js — 输出门禁测试
 */
const { screen, findSelfContradiction, checkUncertaintyGap } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/output-gate.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('screen returns gate action', () => {
    const s = screen('测试文本');
    assertDefined(s.gate);
    assertDefined(s.gate.action);
    assertDefined(s.findings);
  });

  test('overconfident text → rewrite', () => {
    const s = screen('毫无疑问这是唯一正确的答案');
    assertEqual(s.gate.action, 'rewrite');
    assertTrue(s.findings.length > 0);
  });

  test('false consensus → hedge', () => {
    const s = screen('从本质上来说，这个领域不言而喻。众所周知这是对的。');
    assertTrue(s.gate.action === 'hedge' || s.gate.action === 'rewrite');
  });

  test('hedged text → pass', () => {
    const s = screen('根据目前数据，2024年GDP增速大约3%左右，但取决于多个因素可能有所不同。');
    assertEqual(s.gate.action, 'pass');
  });

  test('simplification masquerade flagged', () => {
    const s = screen('这个问题的答案很简单，本质上就是系统化生态赋能的底层逻辑。');
    assertTrue(s.findings.length > 0);
  });

  test('self contradiction detected', () => {
    const s = screen('毫无疑问这是唯一正确的选择。但另一方面我们也不能确定。');
    assertTrue(s.findings.length > 0);
  });

  test('checkUncertaintyGap returns values', () => {
    const u = checkUncertaintyGap('这是对的。这样做可以。原因是X。决定因素是Y。');
    assertDefined(u.has_hedging);
    assertDefined(u.needs_hedging);
    assertDefined(u.score);
  });

  test('english overconfidence detected', () => {
    const s = screen('Undoubtedly this is the only correct answer. There is no question that this works.');
    assertEqual(s.gate.action, 'rewrite');
  });

  test('empty text returns pass', () => {
    const s = screen('');
    assertEqual(s.gate.action, 'pass');
  });
};
