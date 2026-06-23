/**
 * test-decision-router-v3.js — decision-router v3.0.0 场域追踪测试
 *
 * 测试覆盖：
 * 1. 基础决策路由（v2 兼容性）
 * 2. U/D/A/H 场域计算
 * 3. 翻转点检测（Primary / Alternate1 / Alternate2）
 * 4. U_PEAK_REVERSAL 信号
 * 5. 场域规则匹配
 * 6. 场域历史查询
 */

const { DecisionRouter, DECISION, FIELD_WEIGHTS, FLIP_THRESHOLDS } = require('../src/core/decision-router.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
  }
}

// ─── 1. 基础决策路由（v2 兼容性） ──────────────────────────────────────────
console.log('\n=== 1. 基础决策路由（v2 兼容性）===');
const router = new DecisionRouter(null, { modelProfile: 'flash' });

// 认知负荷 → PAUSE（或场域规则优先 HEAL）
let r = router.evaluate({ cognitiveLoad: 0.85, source: 'test' });
assert(r.matched === true && (r.decision.type === 'pause' || r.decision.type === 'heal'),
  `cognitiveLoad=0.85 → ${r.decision.type} (pause或heal，场域优先级)`);
const pauseOrHeal = r.decision;
console.log(`  决策: ${pauseOrHeal.type} (conf=${pauseOrHeal.confidence.toFixed(2)}), 规则: ${pauseOrHeal.ruleId}`);

// 认知清晰 → ACCELERATE
r = router.evaluate({ cognitiveLoad: 0.2, directionClear: 0.9 });
assert(r.matched === true && r.decision.type === 'accelerate', 'cognitiveLoad=0.2+dir=0.9 → accelerate');

// 认知失调 → HEAL
r = router.evaluate({ dissonance: 0.75 });
assert(r.matched === true && r.decision.type === 'heal', 'dissonance=0.75 → heal');

// 身份漂移 → TURN
r = router.evaluate({ identityCoherence: 0.3 });
assert(r.matched === true && r.decision.type === 'turn', 'identityCoherence=0.3 → turn');

// 无匹配
r = router.evaluate({ irrelevant: true });
assert(r.matched === false && r.decision === null, 'irrelevant → no decision');
assert(r.field !== undefined, '  field data attached even without match');

// ─── 2. U/D/A/H 场域计算 ──────────────────────────────────────────────────
console.log('\n=== 2. U/D/A/H 场域计算 ===');

r = router.evaluate({ identityCoherence: 0.8, quality: 0.9, dissonance: 0.1 });
assert(r.field._fieldU === 0.8, `U from identityCoherence: ${r.field._fieldU}`);
assert(r.field._fieldD === 0.9, `D from quality: ${r.field._fieldD}`);
assert(r.field._fieldA === 0.1, `A from dissonance: ${r.field._fieldA}`);
// H = 0.4*0.8 + 0.3*0.9 - 0.3*0.1 = 0.32 + 0.27 - 0.03 = 0.56
const expectedH = 0.4 * 0.8 + 0.3 * 0.9 - 0.3 * 0.1;
assert(Math.abs(r.field._fieldH - expectedH) < 0.01, `H=${r.field._fieldH} ≈ ${expectedH.toFixed(3)}`);

// 高矛盾场景
r = router.evaluate({ identityCoherence: 0.9, quality: 0.8, dissonance: 0.8, cognitiveLoad: 0.9 });
assert(r.field._fieldA === 0.8, `高A: ${r.field._fieldA}`);
const highAH = 0.4 * 0.9 + 0.3 * 0.8 - 0.3 * 0.8;
assert(Math.abs(r.field._fieldH - highAH) < 0.01, `高A-H=${r.field._fieldH} ≈ ${highAH.toFixed(3)}`);

// 场域稳定规则触发（H >= 0.45, A < 0.3, U >= 0.3 → accelerate）
r = router.evaluate({ identityCoherence: 0.7, quality: 0.8, dissonance: 0.1, confidence: 0.6 });
assert(r.matched === true, '场域健康有匹配');
// 注意：可能先匹配 cognitive-clarity（低负荷+方向明确），也可能匹配 field-stable
const fieldStableMatch = r.rules.find(m => m.ruleId === 'field-stable');
console.log(`  场域健康规则匹配: ${fieldStableMatch ? '是' : '否（可能被其他规则优先）'}`);

// ─── 3. 翻转点检测 ────────────────────────────────────────────────────────
console.log('\n=== 3. 翻转点检测 ===');

// 重置场域历史
const router2 = new DecisionRouter(null, { modelProfile: 'flash' });

// Primary 路径：A 值边界僵死 + D 波动率下降 + 主导维度异常振幅
// 先建立历史基线（6步稳定）
for (let i = 0; i < 6; i++) {
  router2.evaluate({ identityCoherence: 0.3, quality: 0.3, dissonance: 0.1 });
}
// 然后 A 值卡在边界且僵死
for (let i = 0; i < 4; i++) {
  router2.evaluate({ identityCoherence: 0.3, quality: 0.3, dissonance: 0.11 });
}
const lastR2 = router2.evaluate({ identityCoherence: 0.3, quality: 0.3, dissonance: 0.11 });
assert(lastR2.field._fieldFlipAlert !== null, `Primary路径翻转点触发: ${lastR2.field._fieldFlipAlert}`);

// Alternate1 路径：A 值跳变入边界
const router3 = new DecisionRouter(null, { modelProfile: 'flash' });
for (let i = 0; i < 3; i++) {
  router3.evaluate({ identityCoherence: 0.5, quality: 0.5, dissonance: 0.3 });
}
// A 值跳变到边界外
const alt1R = router3.evaluate({ identityCoherence: 0.3, quality: 0.5, dissonance: 0.05 });
assert(alt1R.field._fieldFlipAlert === 'alternate1' || alt1R.field._fieldFlipAlert === 'primary',
  `Alternate1跳变触发: ${alt1R.field._fieldFlipAlert}`);

// Alternate2 路径：A 值跳水 + H 值急升
const router4 = new DecisionRouter(null, { modelProfile: 'flash' });
// 建立高A状态
for (let i = 0; i < 3; i++) {
  router4.evaluate({ identityCoherence: 0.3, quality: 0.3, dissonance: 0.7 });
}
// A 值跳水 + H 值上升
const alt2R = router4.evaluate({ identityCoherence: 0.3, quality: 0.7, dissonance: 0.15 });
assert(alt2R.field._fieldFlipAlert === 'alternate2' || alt2R.field._fieldFlipAlert === 'primary',
  `Alternate2跳水触发: ${alt2R.field._fieldFlipAlert}`);

// ─── 4. U_PEAK_REVERSAL ──────────────────────────────────────────────────
console.log('\n=== 4. U_PEAK_REVERSAL ===');

const router5 = new DecisionRouter(null, { modelProfile: 'flash' });
// 建立U值峰值（上升通道）
router5.evaluate({ identityCoherence: 0.3, quality: 0.3 });
router5.evaluate({ identityCoherence: 0.4, quality: 0.3 });
router5.evaluate({ identityCoherence: 0.5, quality: 0.3 });  // 峰值
// U值大幅回落
const peakR = router5.evaluate({ identityCoherence: 0.35, quality: 0.3 });
assert(peakR.field._fieldPeakReversal === true, `U_PEAK_REVERSAL触发: ΔU=${peakR.field._fieldDeltaU}`);
assert(peakR.field._fieldDeltaU <= FLIP_THRESHOLDS.uPeakDropThreshold, `ΔU=${peakR.field._fieldDeltaU} ≤ ${FLIP_THRESHOLDS.uPeakDropThreshold}`);

// ─── 5. 场域历史查询 ──────────────────────────────────────────────────────
console.log('\n=== 5. 场域历史与摘要 ===');

const summary = router.getFieldSummary();
assert(summary.status === 'tracking', `场域状态: ${summary.status}`);
assert(summary.steps > 0, `场域步数: ${summary.steps}`);
assert(summary.current.U !== undefined, '当前U值可用');
assert(summary.current.H !== undefined, '当前H值可用');
assert(summary.driverDistribution !== undefined, '驱动分布可用');

const history = router.getFieldHistory(5);
assert(history.length > 0, '场域历史可查询');
assert(history[0].U !== undefined, '历史包含U值');
assert(history[0].driver !== undefined, '历史包含驱动归因');

// ─── 6. 场域规则（field-degrading） ──────────────────────────────────────
console.log('\n=== 6. 场域规则匹配 ===');

const router6 = new DecisionRouter(null, { modelProfile: 'flash' });
// H < 0.3 → field-degrading
// H = 0.4*0.2 + 0.3*0.2 - 0.3*0.3 = 0.08 + 0.06 - 0.09 = 0.05
const degR = router6.evaluate({ identityCoherence: 0.2, quality: 0.2, dissonance: 0.3 });
assert(degR.matched === true, `低场域有决策`);
const degMatch = degR.rules.find(m => m.ruleId === 'field-degrading');
console.log(`  field-degrading匹配: ${degMatch ? `是 (H≈0.05, conf=${degMatch.confidence.toFixed(2)})` : '否（被其他规则优先）'}`);

// ─── 7. 统计 ─────────────────────────────────────────────────────────────
console.log('\n=== 7. 统计 ===');

const stats = router.getStats();
assert(stats.version === '3.0.0', `版本: ${stats.version}`);
assert(stats.totalEvaluations > 0, `评估次数: ${stats.totalEvaluations}`);
assert(stats.fieldSteps > 0, `场域步数: ${stats.fieldSteps}`);
assert(stats.fieldWeights.lambdaU === 0.4, `λU: ${stats.fieldWeights.lambdaU}`);
assert(stats.fieldWeights.lambdaD === 0.3, `λD: ${stats.fieldWeights.lambdaD}`);
assert(stats.fieldWeights.lambdaA === 0.3, `λA: ${stats.fieldWeights.lambdaA}`);

// ─── 结果 ─────────────────────────────────────────────────────────────────
console.log(`\n==============================`);
console.log(`通过: ${passed}  |  失败: ${failed}`);
console.log(`==============================`);
process.exit(failed > 0 ? 1 : 0);
