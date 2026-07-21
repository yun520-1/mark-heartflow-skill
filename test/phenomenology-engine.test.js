/**
 * 心虫自主升级补的 TDD (phenomenology-engine, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { PhenomenologyEngine } = require('../src/consciousness/phenomenology-engine.js');
  test('PhenomenologyEngine 可实例化且含 analyze 系列', () => {
    const p = new PhenomenologyEngine();
    assertDefined(p, '实例应存在');
    assertTrue(typeof p.analyzeIntentionality === 'function', 'analyzeIntentionality 应为函数');
    assertTrue(typeof p.quickAnalyze === 'function', 'quickAnalyze 应为函数');
  });
  test('PhenomenologyEngine.quickAnalyze 返回对象', () => {
    const p = new PhenomenologyEngine();
    const r = p.quickAnalyze('我感知到自己在思考');
    assertTrue(typeof r === 'object', '应返回对象');
  });
};
