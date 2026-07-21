/**
 * RuleGrowth 测试 — 验证心虫判断生长能力（v6.0.59 新增核心能力）
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { RuleGrowth, MIN_OCCURRENCE } = require('../src/cortex/rule-growth.js');
  const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
  // 用临时规则文件避免污染真实数据
  const fs = require('fs');
  const tmpFile = ROOT + '/data/learned-rules.test.json';
  const mod = require('../src/cortex/rule-growth.js');
  // 通过覆写 rulesFile 路径测试（直接构造后手动指向临时文件）
  function makeTmp() {
    const rg = new mod.RuleGrowth(ROOT);
    rg.rulesFile = tmpFile;
    rg.rules = [];
    rg._pending = {};
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return rg;
  }

  console.log('  🌱 RuleGrowth (rule-growth.js)');

  test('构造不抛且加载空规则', () => {
    const rg = makeTmp();
    assertTrue(rg instanceof RuleGrowth);
    assertEqual(rg.rules.length, 0);
  });

  test('observe 低于阈值不固化', () => {
    const rg = makeTmp();
    rg.observe('总结', 'SUMMARIZE', '用户要摘要');
    assertEqual(rg.rules.length, 0);
    assertTrue(rg._pending['SUMMARIZE::总结'].count >= 1);
  });

  test('observe 达到阈值(MIN_OCCURRENCE)固化为规则', () => {
    const rg = makeTmp();
    for (let i = 0; i < MIN_OCCURRENCE; i++) rg.observe('总结', 'SUMMARIZE', '用户要摘要');
    assertEqual(rg.rules.length, 1);
    assertEqual(rg.rules[0].decision, 'SUMMARIZE');
  });

  test('evaluate 匹配已学规则返回决策', () => {
    const rg = makeTmp();
    for (let i = 0; i < MIN_OCCURRENCE; i++) rg.observe('总结新闻', 'SUMMARIZE', 'r');
    const hit = rg.evaluate('帮我总结新闻');
    assertDefined(hit);
    assertEqual(hit.decision, 'SUMMARIZE');
    assertTrue(hit.learned === true);
  });

  test('evaluate 无匹配返回 null', () => {
    const rg = makeTmp();
    assertEqual(rg.evaluate('今天天气怎么样'), null);
  });

  test('toDecisionRouterRules 返回兼容格式', () => {
    const rg = makeTmp();
    for (let i = 0; i < MIN_OCCURRENCE; i++) rg.observe('分析', 'ANALYZE', 'r');
    const dr = rg.toDecisionRouterRules();
    assertEqual(dr.length, 1);
    assertTrue(typeof dr[0].match === 'function');
    assertEqual(dr[0].decision, 'ANALYZE');
  });

  test('getStats 返回学习统计', () => {
    const rg = makeTmp();
    for (let i = 0; i < MIN_OCCURRENCE; i++) rg.observe('对比', 'COMPARE', 'r');
    const s = rg.getStats();
    assertEqual(s.learnedRules, 1);
  });

  // 清理
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
};
