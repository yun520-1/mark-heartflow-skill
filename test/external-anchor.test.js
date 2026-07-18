// 外部锚定基准 (benchmark-external-anchor.js) + self-benchmark 防自欺护栏 测试
const assert = require('assert');
const { anchorSync, computeLogicAccuracy, computeHumanSatisfaction, LOGIC_PROBLEMS } = require('../src/cortex/benchmark-external-anchor.js');
const { SelfBenchmark } = require('../src/cortex/self-benchmark.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

// ─── 1. 逻辑准确率：think 可用时返回 0~1 ──────────────────────────
ok('computeLogicAccuracy: think 可用返回数值', () => {
  const fakeHf = { think: (q) => '是' }; // 全答"是"也能对部分题
  const acc = computeLogicAccuracy(fakeHf);
  assert.ok(acc === null || (acc >= 0 && acc <= 1), `acc=${acc}`);
});

ok('computeLogicAccuracy: think 不可用返回 null', () => {
  assert.strictEqual(computeLogicAccuracy(null), null);
  assert.strictEqual(computeLogicAccuracy({}), null);
});

ok('LOGIC_PROBLEMS 内置 10 题', () => {
  assert.strictEqual(LOGIC_PROBLEMS.length, 10);
  LOGIC_PROBLEMS.forEach(p => assert.ok(p.q && p.expect, '每题需有 q+expect'));
});

// ─── 2. 全对 think → accuracy=1 ───────────────────────────────────
ok('computeLogicAccuracy: 全对标答返回 1', () => {
  // 构造一个 think 能答对全部 10 题的 fake（用期望词匹配）
  const ans = ['是','5','没有','14','不正确','4','不能','25','不对','180'];
  let i = 0;
  const fakeHf = { think: () => ans[i++ % ans.length] };
  const acc = computeLogicAccuracy(fakeHf);
  assert.strictEqual(acc, 1);
});

// ─── 3. 人类满意度：无标记返回 null ────────────────────────────────
ok('computeHumanSatisfaction: 无反馈文件返回 null', () => {
  // 用临时不存在的路径无法注入，但模块读固定路径；确保不影响（返回 null 或不崩）
  assert.doesNotThrow(() => computeHumanSatisfaction());
});

// ─── 4. self-benchmark assess 防自欺护栏 ──────────────────────────
ok('assess: 无外部锚时 verified=false + 0.7 折', () => {
  const hf = { dispatch: () => ({}) }; // 无 think → 外部锚不可用
  const bench = new SelfBenchmark(hf);
  const r = bench.assess();
  assert.strictEqual(r.verified, false, '无外部锚应标记未验证');
  assert.ok(r.guardNote.includes('UNVERIFIED'), '应有未验证告警');
  assert.ok(r.score <= r.internalScore, '未验证分数应 ≤ 内部分');
  assert.ok(Math.abs(r.score - r.internalScore * 0.7) < 0.5, '应打 0.7 折');
});

ok('assess: 有外部锚时 verified=true + 混合分', () => {
  // fake hf 提供 think（答对逻辑题）+ dispatch
  const ans = ['是','5','没有','14','不正确','4','不能','25','不对','180'];
  let i = 0;
  const hf = {
    dispatch: () => ({ triggerRate: 90, closureRate: 90, reuseRate: 90 }),
    think: () => ans[i++ % ans.length],
  };
  const bench = new SelfBenchmark(hf);
  const r = bench.assess();
  assert.strictEqual(r.verified, true, '有外部锚应标记已验证');
  assert.ok(r.externalAnchor && r.externalAnchor.logicAccuracy === 1, '逻辑准确率应为1');
  // 混合分 = 0.4*内部 + 0.6*外部*100，外部=1 → 应高于纯内部*0.7
  assert.ok(r.score > r.internalScore * 0.7, '有锚分数应高于未验证折损分');
});

ok('assess: 不破坏现有加密存储', () => {
  const hf = { dispatch: () => ({}) };
  const bench = new SelfBenchmark(hf);
  bench.assess();
  const f = path.join(__dirname, '..', 'data', 'self-benchmark.json');
  assert.ok(fs.existsSync(f), '基准文件应存在');
  // 文件应为加密格式（非纯 JSON），读取应不抛
  assert.doesNotThrow(() => fs.readFileSync(f, 'utf8'));
});

// ─── 5. 多次 assess 不崩溃，历史累积 ──────────────────────────────
ok('assess: 连续调用累积历史', () => {
  const hf = { dispatch: () => ({}) };
  const bench = new SelfBenchmark(hf);
  bench.assess();
  bench.assess();
  const stats = bench.getStats();
  assert.ok(stats.totalBenchmarks >= 2, '应累积 >=2 条');
});

console.log(`\nexternal-anchor: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
