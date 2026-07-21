/**
 * 心虫自主升级补的 TDD (action-tracker, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { ActionTracker } = require('../src/core/action-tracker.js');
  test('ActionTracker 可实例化且含 commit/trackAction', () => {
    const at = new ActionTracker();
    assertDefined(at, '实例应存在');
    assertTrue(typeof at.commit === 'function', 'commit 应为函数');
    assertTrue(typeof at.trackAction === 'function', 'trackAction 应为函数');
  });
};
