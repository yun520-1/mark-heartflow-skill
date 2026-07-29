/**
 * doubt-engine.test.js — 怀疑引擎测试
 */
const { doubt, checkKnowledgeBoundary, checkSymmetry, checkDefensiveness } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/doubt-engine.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('doubt returns gate + doubts', () => {
    const r = doubt('测试文本');
    assertDefined(r.gate);
    assertDefined(r.doubts);
    assertDefined(r.shouldStop);
  });

  test('overconfident knowledge → hedge', () => {
    const r = doubt('原因是这个方案从根本上决定了行业格局');
    assertTrue(r.knowledge.overclaims.length > 0);
  });

  test('defensive response → block', () => {
    const r = doubt('你可能没有理解，我的意思其实是这个方案是可行的。但更关键的是你要看到整体价值。');
    assertEqual(r.gate.action, 'block');
    assertTrue(r.shouldStop);
  });

  test('honest response → pass', () => {
    const r = doubt('这个方案可能有效，但我还不确定。需要再测试几次看看效果。');
    assertEqual(r.gate.action, 'pass');
    assertEqual(r.shouldStop, false);
  });

  test('symmetry detects reversible claims', () => {
    const r = doubt('这个方案是唯一正确的方法，它会成为行业标准。');
    // Should find at least one reversible or overconfident claim
    assertTrue(r.symmetry.reversible_claims.length > 0 || r.knowledge.overclaims.length > 0);
  });

  test('fake apology detected', () => {
    const r = checkDefensiveness('首先抱歉，但你可能没有理解我的意思。更重要的是这个方案本身没问题。');
    assertTrue(!r.safe);
  });

  test('checkKnowledgeBoundary returns results', () => {
    const r = checkKnowledgeBoundary('原因是这个方案从根本上解决了所有问题');
    assertDefined(r.overclaims);
    assertDefined(r.safe);
  });

  test('empty text returns safe', () => {
    const r = doubt('');
    assertEqual(r.gate.action, 'pass');
    assertEqual(r.shouldStop, false);
  });
};
