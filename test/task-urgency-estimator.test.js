/**
 * TaskUrgencyEstimator — Tests
 */
const assert = require('assert');
const { TaskUrgencyEstimator } = require('../src/cortex/task-urgency-estimator.js');

module.exports = function ({ test }) {

  test('TaskUrgencyEstimator: high urgency on error', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('系统崩溃了，报错信息：TypeError: Cannot read property');
    assert.strictEqual(r.urgency, 'high');
    assert.strictEqual(r.suggestedDepth, 3);
  });

  test('TaskUrgencyEstimator: low urgency on greeting', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('你好');
    assert.strictEqual(r.urgency, 'low');
    assert.strictEqual(r.suggestedDepth, 1);
  });

  test('TaskUrgencyEstimator: medium on analysis (no urgent keywords)', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('请问这个方案的优缺点是什么');
    assert.strictEqual(r.urgency, 'medium');
    assert.strictEqual(r.suggestedDepth, 2);
  });

  test('TaskUrgencyEstimator: high on security', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('发现安全漏洞，需要紧急修复');
    assert.strictEqual(r.urgency, 'high');
  });

  test('TaskUrgencyEstimator: short text lowers urgency', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('ok');
    assert.strictEqual(r.urgency, 'low');
  });

  test('TaskUrgencyEstimator: code increases urgency', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate('帮我写一个函数实现快速排序');
    // '写' + '函数' not in urgency patterns but '写' is in medium patterns
    // Also has medium weight pattern for '写' / '设计'
    assert.strictEqual(r.urgency === 'medium' || r.urgency === 'high', true);
  });

  test('TaskUrgencyEstimator: null input returns unknown', () => {
    const tue = new TaskUrgencyEstimator();
    const r = tue.estimate(null);
    assert.strictEqual(r.urgency, 'unknown');
    assert.strictEqual(r.suggestedDepth, 1);
  });

  test('TaskUrgencyEstimator: previous context elevates urgency', () => {
    const tue = new TaskUrgencyEstimator();
    // Medium is elevated to high because prev was high urgency
    const r = tue.estimate('分析当前情况', { previousUrgency: 'high' });
    assert.strictEqual(r.urgency, 'high', 'should be elevated from medium to high');
  });

  test('TaskUrgencyEstimator: stats accumulate', () => {
    const tue = new TaskUrgencyEstimator();
    tue.estimate('你好');
    tue.estimate('系统崩溃了');
    tue.estimate('分析这个');
    const stats = tue.getStats();
    assert.strictEqual(stats.totalEstimated, 3);
    assert.strictEqual(stats.highUrgency >= 1, true);
    assert.strictEqual(stats.lowUrgency >= 1, true);
  });

  test('TaskUrgencyEstimator: features are extracted', () => {
    const tue = new TaskUrgencyEstimator();
    // Access internal _extractFeatures
    const feat = tue._extractFeatures('分析这个算法的时间复杂度');
    assert.strictEqual(typeof feat.length, 'number');
    assert.strictEqual(typeof feat.technicalDepth, 'number');
    assert.strictEqual(feat.technicalDepth > 0, true, '算法复杂度应该是技术深度 > 0');
  });
};
