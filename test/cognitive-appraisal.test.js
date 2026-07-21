/**
 * 心虫自主升级补的 TDD (cognitive-appraisal, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const ca = require('../src/core/cognitive-appraisal.js');
  test('cognitive-appraisal 导出常量维度', () => {
    assertDefined(ca.APPRAISAL_DIMENSIONS, 'APPRAISAL_DIMENSIONS 应存在');
    assertTrue(Array.isArray(ca.APPRAISAL_DIMENSIONS) || typeof ca.APPRAISAL_DIMENSIONS === 'object', '应为维度集合');
  });
  test('cognitive-appraisal 含 primaryAppraisal 函数', () => {
    assertTrue(typeof ca.primaryAppraisal === 'function', 'primaryAppraisal 应为函数');
  });
};
