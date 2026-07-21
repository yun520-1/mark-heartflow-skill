/**
 * 心虫自主升级补的 TDD (counterfactual-verifier, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const CounterfactualVerifier = require('../src/core/counterfactual-verifier.js');
  test('CounterfactualVerifier 是构造函数且含 verify/getStats', () => {
    assertTrue(typeof CounterfactualVerifier === 'function', '应为构造函数');
    const c = new CounterfactualVerifier();
    assertTrue(typeof c.verify === 'function', 'verify 应为函数');
    assertTrue(typeof c.getStats === 'function', 'getStats 应为函数');
  });
};
