/**
 * 心虫自主升级补的 TDD (config-hooks, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { ConfigHooks } = require('../src/core/config-hooks.js');
  const { HeartFlowConfig, getInstance } = require('../src/core/config.js');
  test('ConfigHooks 可实例化(传 HeartFlowConfig 实例)且含钩子方法', () => {
    const cfg = getInstance();
    const ch = new ConfigHooks(cfg);
    assertDefined(ch, '实例应存在');
    assertTrue(typeof ch.on === 'function' || typeof ch.off === 'function' || typeof ch.setEnabled === 'function', '应含钩子方法');
  });
};
