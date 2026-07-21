/**
 * 心虫自主升级补的 TDD (cognition-ground, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { CognitionGround } = require('../src/core/cognition-ground.js');
  test('CognitionGround 可实例化且含 map/snapshot', () => {
    const cg = new CognitionGround();
    assertDefined(cg, '实例应存在');
    assertTrue(typeof cg.map === 'function', 'map 应为函数');
    assertTrue(typeof cg.snapshot === 'function', 'snapshot 应为函数');
  });
};
