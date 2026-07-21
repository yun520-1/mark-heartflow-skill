/**
 * 心虫自主升级补的 TDD (being-logic, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { BeingLogic } = require('../src/core/being-logic.js');
  test('BeingLogic 可实例化且含 exists/sanitize', () => {
    const bl = new BeingLogic();
    assertDefined(bl, '实例应存在');
    assertTrue(typeof bl.exists === 'function', 'exists 应为函数');
    assertTrue(typeof bl.sanitize === 'function', 'sanitize 应为函数');
  });
  test('BeingLogic.exists 返回含 exists 布尔的对象', () => {
    const bl = new BeingLogic();
    const r = bl.exists('test-key');
    assertTrue(typeof r === 'object', 'exists 应返回对象');
    assertTrue(typeof r.exists === 'boolean', 'r.exists 应为布尔');
  });
};
