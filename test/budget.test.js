/**
 * 心虫自主升级补的 TDD (budget, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const b = require('../src/core/budget.js');
  test('budget 导出纯函数集且含 countTokens/resolveThinkingBudget', () => {
    assertDefined(b.countTokens, 'countTokens 应存在');
    assertDefined(b.resolveThinkingBudget, 'resolveThinkingBudget 应存在');
    assertTrue(typeof b.countTokens === 'function', 'countTokens 应为函数');
  });
  test('budget.countTokens 返回非负整数', () => {
    const n = b.countTokens('hello world');
    assertTrue(typeof n === 'number' && n >= 0, 'countTokens 应返回非负数字');
  });
  test('budget.resolveThinkingBudget 按级别名解析为 token 数', () => {
    const r = b.resolveThinkingBudget('HIGH');
    assertTrue(typeof r === 'number' && r > 0, 'HIGH 级别应解析为正整数 token 数');
  });
};
