/**
 * test/decision-capability.test.js — 心虫决策能力测试
 * 用户核心目标：升级决策能力/逻辑能力，像人一样干活，不靠大模型
 * 覆盖：DDM 决策科学引擎 / 风险感知决策 / 低风险偏好
 */
'use strict';
const assert = require('assert');

module.exports = function ({ test }) {
  test('决策: decision-engine DDM 真实计算（非空壳）', () => {
    const { DecisionEngine } = require('../src/reasoning/decision-engine.js');
    const de = new DecisionEngine();
    const ddm = de.ddmAnalyze({ drift: 1.5, threshold: 1 });
    assert.ok(ddm.decisionTime > 0, '决策时间应 > 0');
    assert.ok(ddm.accuracy > 0.5, '准确率应合理');
    assert.ok(ddm.errorRate >= 0 && ddm.errorRate <= 1, '错误率应在 0-1');
  });

  test('决策: heartflow 内 decisionEngineV2 的 bridge 是真实的', () => {
    // 模拟 heartflow 的 globalThis 注入（v6.5.1 修复后应为真实 bridge）
    const realBridge = require('../src/formula/cognitive-bridge.js').getCognitiveBridge();
    globalThis.getCognitiveBridge = () => realBridge;
    const { DecisionEngine } = require('../src/reasoning/decision-engine.js');
    const de = new DecisionEngine();
    const ddm = de.ddmAnalyze({ drift: 1, threshold: 1 });
    assert.ok(ddm.decisionTime > 0, 'bridge 修复后 DDM 应可计算');
  });

  test('决策: 有低风险选项时选择低风险（像人一样规避）', () => {
    const { HeartFlowDecision } = require('../src/core/decision.js');
    const d = new HeartFlowDecision(null);
    const r = d.decide({
      task: '选方案',
      options: [
        { id: 'a', label: '高风险高回报', feasibility: 0.9, consequence_value: 0.6, risk: 0.8, confidence: 0.9 },
        { id: 'b', label: '低风险低回报', feasibility: 0.6, consequence_value: 0.7, risk: 0.2, confidence: 0.9 },
      ],
    });
    assert.strictEqual(r.label, '低风险低回报', '应选择低风险选项');
  });

  test('决策: 选中高风险项时必须报风险', () => {
    const { HeartFlowDecision } = require('../src/core/decision.js');
    const d = new HeartFlowDecision(null);
    const r = d.decide({
      task: '选方案',
      options: [
        { id: 'a', label: '唯一高风险方案', feasibility: 0.9, consequence_value: 0.6, risk: 0.8, confidence: 0.9 },
        { id: 'b', label: '不可行', feasibility: 0.1, consequence_value: 0.5, risk: 0.2, confidence: 0.5 },
      ],
    });
    assert.ok(r.risks.some(x => x.type === 'explicit_risk'), '高风险决策必须上报风险');
  });

  test('决策: 全部高风险时选相对低风险并诚实标注', () => {
    const { HeartFlowDecision } = require('../src/core/decision.js');
    const d = new HeartFlowDecision(null);
    const r = d.decide({
      task: '选方案',
      options: [
        { id: 'a', label: '方案A', feasibility: 0.8, consequence_value: 0.6, risk: 0.8, confidence: 0.8 },
        { id: 'b', label: '方案B', feasibility: 0.7, consequence_value: 0.7, risk: 0.75, confidence: 0.8 },
      ],
    });
    assert.strictEqual(r.label, '方案B', '应选相对低风险');
    assert.ok(r.risks.length > 0, '无法避免风险时应诚实上报');
  });
};
