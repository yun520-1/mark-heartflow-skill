/**
 * 心虫自主升级补的 TDD (IntentionTracker, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { IntentionTracker } = require('../src/core/IntentionTracker.js');
  test('IntentionTracker 可实例化且含 setPrimaryGoal/checkDeviation', () => {
    const it = new IntentionTracker();
    assertDefined(it, '实例应存在');
    assertTrue(typeof it.setPrimaryGoal === 'function', 'setPrimaryGoal 应为函数');
    assertTrue(typeof it.checkDeviation === 'function', 'checkDeviation 应为函数');
  });
  test('IntentionTracker.setPrimaryGoal + getProgress 不抛', () => {
    const it = new IntentionTracker();
    it.setPrimaryGoal('完成X');
    const p = it.getProgress();
    assertTrue(typeof p === 'object', 'getProgress 应返回对象');
  });
};
