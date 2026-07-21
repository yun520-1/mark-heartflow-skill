/**
 * 心虫自主升级补的 TDD (config-v2, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const cv = require('../src/core/config-v2.js');
  test('config-v2 导出 get/getBool/isProd 函数', () => {
    assertTrue(typeof cv.get === 'function', 'get 应为函数');
    assertTrue(typeof cv.getBool === 'function', 'getBool 应为函数');
    assertTrue(typeof cv.isProd === 'function', 'isProd 应为函数');
  });
  test('config-v2.isProd 返回布尔', () => {
    const r = cv.isProd();
    assertTrue(typeof r === 'boolean', 'isProd 应返回布尔');
  });
};
