/**
 * test-decision-upgrade.js — [v4.0] 决策增强三模块集成测试
 * 验证 decision-executor + field-injector + decision-feedback 协同工作
 */
'use strict';

const BASE = '/Users/apple/.hermes/skills/ai/mark-heartflow-skill/src/core';
const { DecisionExecutor, DECISION_ACTION_MAP } = require(`${BASE}/decision-executor.js`);
const { FieldInjector, FIELD_DEFAULTS } = require(`${BASE}/field-injector.js`);
const { DecisionFeedback } = require(`${BASE}/decision-feedback.js`);

let passed = 0, failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}`); }
}

// ─── 测试 1: FieldInjector ──────────────────────────────────────────────
console.log('\n=== 1. FieldInjector ===');
const fi = new FieldInjector();

// 1a: 空输入安全
const safe = fi.inject(null);
assert(safe && safe.confidence === 0.3, 'null输入返回安全默认值');

// 1b: 成功信号
const success = fi.inject({ success: true, result: 'ok' });
assert(success.confidence >= 0.7, 'success=true → confidence≥0.7');
assert(success._fieldReliable === true, 'success=true → reliable');

// 1c: 失败信号
const fail = fi.inject({ success: false, error: 'crash' });
assert(fail.confidence <= 0.3, 'success=false → confidence≤0.3');

// 1d: 矛盾信号提取
const sigs = fi.extractSignals({ dissonance: 0.8, severity: 'HIGH' });
assert(sigs.dissonanceSignals.length > 0, '提取到矛盾信号');

// 1e: batchInject
const batch = fi.batchInject([
  { result: { ok: true }, source: 'a' },
  { result: { ok: false }, source: 'b' },
]);
assert(batch.length === 2, 'batchInject 返回2个结果');
assert(batch[0].confidence >= 0.5, 'batch[0] ok=true → 高置信度');
assert(batch[1].confidence <= 0.5, 'batch[1] ok=false → 低置信度');

// ─── 测试 2: DecisionExecutor ────────────────────────────────────────────
console.log('\n=== 2. DecisionExecutor ===');
const de = new DecisionExecutor({});

// DecisionExecutor.execute(decisionStr, context) — decision 是字符串
const ctx3 = { depth: 3, _routeHint: { type: 'general', confidence: 0.7 } };
const ctx2 = { depth: 2, _routeHint: { type: 'general', confidence: 0.5 } };
const ctx1 = { depth: 1, _routeHint: { type: 'general', confidence: 0.5 } };

// 2a: 空决策安全
const empty = de.execute(null, {});
assert(empty.depth !== undefined, '空决策返回安全默认值');

// 2b: PAUSE → depth=1
const pause = de.execute('pause', ctx3);
assert(pause.depth === 1, 'PAUSE → depth=1');
assert(pause._routeHint.confidence === 0.3, 'PAUSE → confidence=0.3');

// 2c: ACCELERATE → depth+1
const acc = de.execute('accelerate', ctx2);
assert(acc.depth === 3, 'ACCELERATE → depth=3 (2+1)');

// 2d: HEAL → depth=1
const heal = de.execute('heal', ctx3);
assert(heal.depth === 1, 'HEAL → depth=1');
assert(heal.flags.heal_requested === true, 'HEAL → healRequested flag');

// 2e: REST → depth=0
const rest = de.execute('rest', ctx2);
assert(rest.depth === 0, 'REST → depth=0');
assert(rest.flags.skipThoughtChain === true, 'REST → skipThoughtChain flag');

// 2f: RESONATE → depth+2
const res = de.execute('resonate', ctx1);
assert(res.depth === 3, 'RESONATE → depth=3 (1+2)');
assert(res._routeHint.type === 'resonant', 'RESONATE → routeHint.type=resonant');

// 2g: TURN → routeHint changed
const turn = de.execute('turn', { depth: 2, _routeHint: { type: 'general', confidence: 0.6 } });
assert(turn._routeHint.type !== 'general', 'TURN → routeHint.type changed');

// 2h: DECISION_ACTION_MAP 有全部8种类型
const types = Object.keys(DECISION_ACTION_MAP);
assert(types.length === 8, 'DECISION_ACTION_MAP 有8种决策类型');
assert(types.includes('pause') && types.includes('accelerate') && types.includes('heal'), '包含 pause/accelerate/heal');

// ─── 测试 3: DecisionFeedback ────────────────────────────────────────────
console.log('\n=== 3. DecisionFeedback ===');
// Mock decisionRouter
const mockRouter = {
  getRules: () => [{ id: 'rule-a', decision: 'pause' }, { id: 'rule-b', decision: 'heal' }],
};
const df = new DecisionFeedback(mockRouter);

// 3a: 初始权重为1.0
assert(df.getAdjustedWeight('rule-a') === 1.0, '初始权重=1.0');

// 3b: 正确决策→权重增加
df.recordOutcome({ type: 'pause', ruleId: 'rule-a', confidence: 0.8 }, true);
const wAfterCorrect = df.getAdjustedWeight('rule-a');
assert(wAfterCorrect > 1.0, '正确→权重增加');

// 3c: 错误决策→权重减少
df.recordOutcome({ type: 'heal', ruleId: 'rule-b', confidence: 0.9 }, false);
assert(df.getAdjustedWeight('rule-b') < 1.0, '错误→权重减少');

// 3d: getRuleEffectiveness 有准确率
const eff = df.getRuleEffectiveness('rule-a');
assert(eff.totalDecisions >= 1, '有决策记录');
assert(eff.accuracy !== undefined, '有准确率');

// 3e: getAllEffectiveness 返回数组
const all = df.getAllEffectiveness();
assert(all.length >= 1, '有有效性记录');

// 3f: getStats
const stats = df.getStats();
assert(stats.totalTracked >= 1, '统计中有跟踪记录');
assert(stats.byDecisionType !== undefined, '有按决策类型统计');

// 3g: 持久化 save/load
const savePath = '/tmp/test-decision-feedback.json';
const saveResult = df.save(savePath);
assert(saveResult.success === true, '保存成功');

const df2 = new DecisionFeedback(mockRouter);
const loadResult = df2.load(savePath);
assert(loadResult.success === true, '加载成功');
assert(df2.getAdjustedWeight('rule-a') === wAfterCorrect, '加载后权重恢复');

// 3h: adjustPriorities 不报错
try {
  df.adjustPriorities();
  assert(true, 'adjustPriorities 不抛异常');
} catch (e) {
  assert(false, `adjustPriorities 抛异常: ${e.message}`);
}

// ─── 结果 ──────────────────────────────────────────────────────────────
console.log(`\n==============================`);
console.log(`通过: ${passed}  |  失败: ${failed}`);
console.log(`==============================`);
process.exit(failed > 0 ? 1 : 0);
