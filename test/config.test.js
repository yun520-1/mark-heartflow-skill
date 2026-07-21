/**
 * 心虫自主升级补的 TDD (config, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { HeartFlowConfig } = require('../src/core/config.js');
  test('HeartFlowConfig 可实例化且含 get/set', () => {
    const c = new HeartFlowConfig();
    assertDefined(c, '实例应存在');
    assertTrue(typeof c.get === 'function', 'get 应为函数');
    assertTrue(typeof c.set === 'function', 'set 应为函数');
  });
};
