/**
 * 心虫自主升级补的 TDD (debate-convergence, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const DebateConvergence = require('../src/core/debate-convergence.js');
  test('DebateConvergence 是构造函数且含 conductDebate/getStats', () => {
    assertTrue(typeof DebateConvergence === 'function', '应为构造函数');
    const d = new DebateConvergence();
    assertTrue(typeof d.conductDebate === 'function', 'conductDebate 应为函数');
    assertTrue(typeof d.getStats === 'function', 'getStats 应为函数');
  });
};
