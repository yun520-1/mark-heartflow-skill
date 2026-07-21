/**
 * 心虫自主升级补的 TDD (adaptive-controller, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { AdaptiveController } = require('../src/core/adaptive-controller.js');
  test('AdaptiveController 可实例化且含 calculatePolicy/getStatus', () => {
    const ac = new AdaptiveController();
    assertDefined(ac, '实例应存在');
    assertTrue(typeof ac.calculatePolicy === 'function', 'calculatePolicy 应为函数');
    assertTrue(typeof ac.getStatus === 'function', 'getStatus 应为函数');
  });
  test('AdaptiveController.getDefaultPolicy 返回对象', () => {
    const ac = new AdaptiveController();
    const p = ac.getDefaultPolicy();
    assertTrue(typeof p === 'object', '应返回对象');
  });
};
