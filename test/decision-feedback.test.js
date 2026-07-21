/**
 * 心虫自主升级补的 TDD (decision-feedback, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { DecisionFeedback } = require('../src/core/decision-feedback.js');
  test('DecisionFeedback 可实例化且含 recordOutcome/getStats', () => {
    const df = new DecisionFeedback();
    assertDefined(df, '实例应存在');
    assertTrue(typeof df.recordOutcome === 'function', 'recordOutcome 应为函数');
    assertTrue(typeof df.getStats === 'function', 'getStats 应为函数');
  });
};
