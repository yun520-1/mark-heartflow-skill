/**
 * boot-check.test.js — 心虫自主升级补的 TDD
 * 来源: SelfScanner 扫出 src/core/boot-check.js 未测试 (untestedModules)
 *        evolve() 决策 testing:high (为未测试模块补 TDD 覆盖核心决策路径)
 * 原则: 先写最小断言验证核心契约, 不侵入业务代码
 * 格式: 兼容 test/run-all.js — module.exports = fn(ctx), ctx 由 runner 注入
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { bootCheck, getFixSuggestions, checkVersionConsistency } =
    require('../src/core/boot-check.js');

  test('bootCheck() 返回健康报告且含 0-100 评分', () => {
    const report = bootCheck(true);
    assertTrue(typeof report === 'object', 'report 应为对象');
    assertDefined(report.health, 'report.health 应存在');
    assertTrue(typeof report.health.score === 'number', 'health.score 应为数字');
    assertTrue(report.health.score >= 0 && report.health.score <= 100, 'score 应在 0-100 区间');
  });

  test('bootCheck() 报告含 files/modules 结构', () => {
    const report = bootCheck(true);
    assertDefined(report.files, 'files 应存在');
    assertTrue(typeof report.files.total === 'number', 'files.total 应为数字');
    assertDefined(report.modules, 'modules 应存在');
    assertTrue(typeof report.modules.total === 'number', 'modules.total 应为数字');
  });

  test('bootCheck(true) 静默模式不抛异常', () => {
    let threw = false;
    try { bootCheck(true); } catch (e) { threw = true; }
    assertFalse(threw, '静默模式不应抛异常');
  });

  test('getFixSuggestions() 返回数组', () => {
    const s = getFixSuggestions(true);
    assertTrue(Array.isArray(s), '应返回数组');
  });

  test('checkVersionConsistency() 返回含 consistent 布尔的对象', () => {
    const v = checkVersionConsistency();
    assertTrue(typeof v === 'object', '应返回对象');
    assertTrue(typeof v.consistent === 'boolean', 'consistent 应为布尔');
  });
};
