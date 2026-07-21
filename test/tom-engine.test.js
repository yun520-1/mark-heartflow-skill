/**
 * 心虫自主升级补的 TDD (tom-engine, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { ToMEngine } = require('../src/consciousness/tom-engine.js');
  test('ToMEngine 可实例化且含 modelAgent/inferIntentions', () => {
    const t = new ToMEngine();
    assertDefined(t, '实例应存在');
    assertTrue(typeof t.modelAgent === 'function', 'modelAgent 应为函数');
    assertTrue(typeof t.inferIntentions === 'function', 'inferIntentions 应为函数');
  });
  test('ToMEngine.modelAgent 不抛且返回对象', () => {
    const t = new ToMEngine();
    const a = t.modelAgent('agent-1', { goal: 'test' });
    assertTrue(typeof a === 'object', '应返回对象');
  });
};
