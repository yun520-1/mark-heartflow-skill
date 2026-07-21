/**
 * 心虫自主升级补的 TDD (decision-executor, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { DecisionExecutor } = require('../src/core/decision-executor.js');
  test('DecisionExecutor 可实例化且含 execute/apply', () => {
    const de = new DecisionExecutor();
    assertDefined(de, '实例应存在');
    assertTrue(typeof de.execute === 'function', 'execute 应为函数');
    assertTrue(typeof de.apply === 'function', 'apply 应为函数');
  });
};
