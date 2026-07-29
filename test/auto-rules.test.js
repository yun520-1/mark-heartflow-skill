const auto = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/auto-rules.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('tryGenerate creates rule for high-recurrence category', () => {
    auto.clearRules();
    const stats = { total: 3, byCategory: { overconfidence: 3 }, highRecurrence: 1 };
    const r = auto.tryGenerate(stats);
    assertEqual(r.generated, 1);
  });

  test('checkAutoRules detects triggered rules', () => {
    auto.clearRules();
    const stats = { total: 3, byCategory: { overconfidence: 3 }, highRecurrence: 1 };
    auto.tryGenerate(stats);
    const r = auto.checkAutoRules('毫无疑问这是唯一正确的');
    assertTrue(r.triggered.length > 0);
  });

  test('checkAutoRules safe for clean text', () => {
    auto.clearRules();
    const stats = { total: 3, byCategory: { overconfidence: 3 }, highRecurrence: 1 };
    auto.tryGenerate(stats);
    const r = auto.checkAutoRules('今天天气真好');
    assertEqual(r.safe, true);
  });

  test('duplicate rule not generated twice', () => {
    auto.clearRules();
    const stats = { total: 3, byCategory: { overconfidence: 3 }, highRecurrence: 1 };
    auto.tryGenerate(stats);
    const r = auto.tryGenerate(stats);
    assertEqual(r.generated, 0);
  });
};
