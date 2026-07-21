/**
 * confidence-calibrator.test.js — 心虫自主升级补的 TDD
 * 来源: SelfScanner 扫出 src/core/confidence-calibrator.js 未测试 (untestedModules)
 * 原则: 测 ConfidenceCalibrator 实例的纯评估入口, 不侵入业务代码
 * 格式: 兼容 test/run-all.js — module.exports = fn(ctx), ctx 由 runner 注入
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { ConfidenceCalibrator } = require('../src/core/confidence-calibrator.js');

  test('ConfidenceCalibrator.assess: 返回含 level/raw/calibrated 的评估结构', () => {
    const cc = new ConfidenceCalibrator();
    const r = cc.assess('根据实验数据, 该假设成立的概率为 0.85', { hasEvidence: true });
    assertTrue(typeof r === 'object', '应返回对象');
    assertDefined(r.raw, 'raw 应存在');
    assertTrue(typeof r.raw === 'number', 'raw 应为数字');
    assertDefined(r.level, 'level 应存在');
    assertTrue(typeof r.calibrated === 'number', 'calibrated 应为数字');
  });

  test('ConfidenceCalibrator.assess: 无证据文本应有更低置信度', () => {
    const cc = new ConfidenceCalibrator();
    const withEv = cc.assess('根据引用[1]的实验, 结论成立', { hasEvidence: true }).raw;
    const noEv = cc.assess('我觉得应该是对的').raw;
    assertTrue(withEv >= noEv, '有证据的置信度不应低于无证据');
  });

  test('ConfidenceCalibrator.generateDistribution: 返回概率分布结构', () => {
    const cc = new ConfidenceCalibrator();
    const dist = cc.generateDistribution(0.7);
    assertTrue(typeof dist === 'object', '应返回对象');
    assertTrue(typeof dist.mostLikely === 'string', 'mostLikely 应为概率描述字符串');
    assertTrue(Array.isArray(dist.alternatives) && dist.alternatives.length > 0, 'alternatives 应为非空数组');
  });

  test('ConfidenceCalibrator.recordFeedback: 记录有效反馈', () => {
    const cc = new ConfidenceCalibrator();
    const before = cc.records.length;
    cc.recordFeedback('某结论', true);
    assertTrue(cc.records.length === before + 1, '应新增一条记录');
  });
};
