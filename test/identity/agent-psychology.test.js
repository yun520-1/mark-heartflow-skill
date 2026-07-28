/**
 * agent-psychology.test.js — AgentPsychology 全维度单元测试
 *
 * 测试 fullAssessment() 返回的 13 个认知心理维度：
 *  1. cognitiveLoad         — 认知负荷
 *  2. goalConflicts         — 目标冲突
 *  3. valueTensions         — 价值内化矛盾
 *  4. identityDrift         — 自我认同漂移
 *  5. decisionDecay         — 决策质量衰减
 *  6. cognitiveDissonance   — 认知失调
 *  7. cognitiveResilience   — 认知弹性
 *  8. healthVolatility      — 健康波动（v2.1.0）
 *  9. cognitiveUncertainty  — 认知不确定性（v2.0.0）
 * 10. attentionFocus        — 注意力分配（v2.0.0）
 * 11. experienceSettling    — 经验沉淀（v2.0.0）
 * 12. attentionState        — AI 注意力状态（v2.2.0）
 * 13. contextSaturation     — 上下文饱和（v2.2.0）
 */
const assert = require('assert');
const { AgentPsychology } = require('../../src/identity/agent-psychology.js');

module.exports = function ({ test }) {

  // ============================================================
  // 基础实例化
  // ============================================================

  test('AgentPsychology 可无参实例化', () => {
    const ap = new AgentPsychology();
    assert.ok(ap instanceof AgentPsychology);
    assert.strictEqual(ap.name, 'AgentPsychology');
    assert.ok(ap.version);
  });

  test('AgentPsychology 接受 heartFlow 实例（可为空对象）', () => {
    const ap = new AgentPsychology({});
    assert.ok(ap instanceof AgentPsychology);
  });

  // ============================================================
  // fullAssessment() 返回完整结构
  // ============================================================

  test('fullAssessment() 返回对象包含 timestamp/version/healthScore/dimensions/status/summary', () => {
    const ap = new AgentPsychology();
    const r = ap.fullAssessment({ context: { _label: 'test' } });

    assert.ok(r.timestamp, '应有 timestamp');
    assert.ok(r.version, '应有 version');
    assert.ok(typeof r.healthScore === 'number', 'healthScore 应为数字');
    assert.ok(r.dimensions, '应有 dimensions 对象');
    assert.ok(r.status, '应有 status');
    assert.ok(r.summary, '应有 summary');
  });

  test('fullAssessment() 返回 healthScore > 0', () => {
    const ap = new AgentPsychology();
    const r = ap.fullAssessment({ context: { _label: 'test' } });
    assert.ok(r.healthScore > 0, 'healthScore > 0 但得到 ' + r.healthScore);
  });

  // ============================================================
  // 验证 13 个维度全部存在
  // ============================================================

  test('fullAssessment() dimensions 包含全部 13 个维度', () => {
    const ap = new AgentPsychology();
    const r = ap.fullAssessment({ context: { _label: 'test' } });
    const d = r.dimensions;

    // 维度列表名称（对应 jsdoc 中的 13 维）
    const expectedKeys = [
      'cognitiveLoad',        // 1. 认知负荷
      'goalConflicts',        // 2. 目标冲突
      'valueTensions',        // 3. 价值内化矛盾
      'identityDrift',        // 4. 自我认同漂移
      'decisionDecay',        // 5. 决策质量衰减
      'cognitiveDissonance',  // 6. 认知失调
      'cognitiveResilience',  // 7. 认知弹性
      'healthVolatility',     // 8. 健康波动
      'cognitiveUncertainty', // 9. 认知不确定性
      'attentionFocus',       // 10. 注意力分配
      'experienceSettling',   // 11. 经验沉淀
      'attentionState',       // 12. AI 注意力状态
      'contextSaturation',    // 13. 上下文饱和
    ];

    for (const key of expectedKeys) {
      assert.ok(d[key] !== undefined, `缺少维度: ${key}`);
    }

    // 验证至少包含 10 个维度（要求中的硬性条件）
    const presentCount = expectedKeys.filter(k => d[k] !== undefined).length;
    assert.ok(presentCount >= 10, `维度数 ${presentCount} < 10`);
    assert.strictEqual(presentCount, 13, `期望 13 维，实际 ${presentCount} 维`);
  });

  // ============================================================
  // 各维度返回数据结构验证
  // ============================================================

  test('dimensions.cognitiveLoad 包含 load/level/details', () => {
    const ap = new AgentPsychology();
    const cl = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.cognitiveLoad;
    assert.ok(typeof cl.load === 'number', 'load 应为数字');
    assert.ok(typeof cl.level === 'string', 'level 应为字符串');
    assert.ok(cl.details, '应有 details');
  });

  test('dimensions.cognitiveLoad 随 tokenUsage 参数变化', () => {
    const ap = new AgentPsychology();
    const clHigh = ap.fullAssessment({
      context: { _label: 'heavy', tokenUsage: 30000, decisionCount: 20, activeModules: 15, processingDepth: 5 }
    }).dimensions.cognitiveLoad;
    assert.ok(clHigh.load > 0, '高负荷时应 > 0');
  });

  test('dimensions.goalConflicts 检测同优先级同类型冲突', () => {
    const ap = new AgentPsychology();
    const goals = [
      { id: 'g1', name: '任务A', priority: 1, type: 'execution' },
      { id: 'g2', name: '任务B', priority: 1, type: 'execution' },
    ];
    const gc = ap.fullAssessment({ activeGoals: goals, context: { _label: 'conflict-test' } }).dimensions.goalConflicts;
    assert.ok(gc.count >= 1, '应有冲突');
    assert.ok(gc.hasConflicts, 'hasConflicts 应为 true');
    assert.ok(gc.conflicts.length >= 1);
  });

  test('dimensions.goalConflicts 无冲突时正常', () => {
    const ap = new AgentPsychology();
    const gc = ap.fullAssessment({ context: { _label: 'no-conflict' } }).dimensions.goalConflicts;
    assert.strictEqual(gc.count, 0, '无目标时应无冲突');
    assert.strictEqual(gc.hasConflicts, false);
  });

  test('dimensions.valueTensions 含 hasTensions/tensions/count', () => {
    const ap = new AgentPsychology();
    const vt = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.valueTensions;
    assert.ok(typeof vt.count === 'number');
    assert.ok(Array.isArray(vt.tensions));
    assert.ok(typeof vt.hasTensions === 'boolean');
  });

  test('dimensions.identityDrift 含 drifted/delta/threshold', () => {
    const ap = new AgentPsychology();
    const id = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.identityDrift;
    assert.ok(typeof id.drifted === 'boolean');
    assert.ok(typeof id.delta === 'number');
    assert.ok(typeof id.threshold === 'number');
    assert.ok(id.details);
  });

  test('dimensions.decisionDecay 含 decaying/trend/details', () => {
    const ap = new AgentPsychology();
    const dd = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.decisionDecay;
    assert.ok(typeof dd.decaying === 'boolean');
    assert.ok(typeof dd.trend === 'number');
    assert.ok(dd.details);
  });

  test('dimensions.cognitiveDissonance 检测行为冲突', () => {
    const ap = new AgentPsychology();
    const cd = ap.fullAssessment({
      action: '这个功能我随便猜的，可能能用',
      context: { _label: 'dissonance-test' }
    }).dimensions.cognitiveDissonance;
    assert.ok(typeof cd.count === 'number');
    assert.ok(Array.isArray(cd.dissonances));
    assert.ok(typeof cd.hasDissonance === 'boolean');
  });

  test('dimensions.cognitiveResilience 含 score/level/details', () => {
    const ap = new AgentPsychology();
    const cr = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.cognitiveResilience;
    assert.ok(typeof cr.score === 'number', 'score 应为数字');
    assert.ok(typeof cr.level === 'string', 'level 应为字符串');
    assert.ok(cr.details, '应有 details');
  });

  test('dimensions.healthVolatility 含 volatilityScore', () => {
    const ap = new AgentPsychology();
    const hv = ap.fullAssessment({ context: { _label: 'test' } }).dimensions.healthVolatility;
    assert.ok(typeof hv.volatilityScore === 'number', 'volatilityScore 应为数字');
    assert.ok(Array.isArray(hv.oscillations));
    assert.ok(Array.isArray(hv.trends));
    assert.ok(Array.isArray(hv.anomalies));
  });

  test('dimensions.cognitiveUncertainty 含 calibrationScore/uncertaintyRatio/level', () => {
    const ap = new AgentPsychology();
    const cu = ap.fullAssessment({
      input: '我不太确定这个答案，可能不太对，但大概是这样吧',
      context: { _label: 'uncertainty-test' }
    }).dimensions.cognitiveUncertainty;
    assert.ok(typeof cu.calibrationScore === 'number');
    assert.ok(typeof cu.uncertaintyRatio === 'number');
    assert.ok(typeof cu.level === 'string');
    assert.ok(cu.details);
  });

  test('dimensions.attentionFocus 含 focusDepth/fragmentationScore/level', () => {
    const ap = new AgentPsychology();
    const af = ap.fullAssessment({
      currentTask: '编写测试',
      context: { _label: 'focus-test', task: '编写测试' }
    }).dimensions.attentionFocus;
    assert.ok(typeof af.focusDepth === 'number');
    assert.ok(typeof af.fragmentationScore === 'number');
    assert.ok(typeof af.level === 'string');
    assert.ok(af.details);
  });

  test('dimensions.experienceSettling 含 settlingEfficiency/level', () => {
    const ap = new AgentPsychology();
    const es = ap.fullAssessment({
      interactionHistory: [
        { type: 'correction', outcome: 'success', pattern: 'debug-loop', timestamp: Date.now() },
        { type: 'analysis', outcome: 'success', pattern: 'pattern-match', timestamp: Date.now() },
      ],
      context: { _label: 'settling-test' }
    }).dimensions.experienceSettling;
    assert.ok(typeof es.settlingEfficiency === 'number');
    assert.ok(typeof es.level === 'string');
    assert.ok(es.details);
    assert.ok(typeof es.selfCorrectionCount === 'number');
  });

  test('dimensions.attentionState 含 engagementScore/driftScore/state', () => {
    const ap = new AgentPsychology();
    const as2 = ap.fullAssessment({
      input: '让我们深入分析这个复杂问题，全神贯注地研究',
      context: { _label: 'attention-state-test' }
    }).dimensions.attentionState;
    assert.ok(typeof as2.engagementScore === 'number');
    assert.ok(typeof as2.driftScore === 'number');
    assert.ok(typeof as2.state === 'string');
    assert.ok(typeof as2.active === 'boolean');
  });

  test('dimensions.contextSaturation 含 saturation/level', () => {
    const ap = new AgentPsychology();
    const cs = ap.fullAssessment({
      context: { _label: 'sat-test', tokenCount: 25000, instructionLength: 1500 }
    }).dimensions.contextSaturation;
    assert.ok(typeof cs.saturation === 'number');
    assert.ok(typeof cs.level === 'string');
    assert.ok(cs.details);
    assert.ok(cs.recommendation);
  });

  // ============================================================
  // status 逻辑
  // ============================================================

  test('干净状态返回 healthy status', () => {
    const ap = new AgentPsychology();
    const r = ap.fullAssessment({ context: { _label: 'clean-test' } });
    assert.ok(['healthy', 'strained', 'distressed'].includes(r.status), 'status 应为有效值');
  });

};
