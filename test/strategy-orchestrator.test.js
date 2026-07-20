'use strict';
const assert = require('assert');
const { StrategyOrchestrator, CAPABILITY_MAP, SIGNAL_SOURCES } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/cortex/self-evolution/strategy-orchestrator.js');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✓', name); }
  catch (e) { failed++; console.log('  ✗', name, '\n    ', e.message); }
}

(async () => {
  console.log('StrategyOrchestrator TDD');

  await test('空信号返回 no_signals', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'no_signals');
  });

  await test('非法 source 被过滤', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([{ source: 'bogus', text: 'trend 趋势' }]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'invalid_sources');
  });

  await test('行业趋势信号能映射到 strategy_inference 维度', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([
      { source: 'industry_trend', text: 'AI行业产品垂直化、研究成熟化、社区反噬化三大趋势' },
    ]);
    assert.strictEqual(r.ok, true);
    assert.ok(r.priorities.length > 0, '应有优先级');
    const strat = r.priorities.find(p => p.dimension === 'strategy_inference');
    assert.ok(strat, 'strategy_inference 应被命中');
    assert.ok(strat.score > 0);
  });

  await test('社区反噬信号命中 auditable_transparency', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([
      { source: 'community_sentiment', text: '用户厌倦 AI slop，要求透明可控、本地 AI' },
    ]);
    assert.ok(r.priorities.find(p => p.dimension === 'auditable_transparency'));
    assert.ok(r.priorities.find(p => p.dimension === 'local_zero_dependency'));
  });

  await test('topPriority 为最高分维度', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([
      { source: 'industry_trend', text: '趋势 战略 方向 self-improving capability gap' },
      { source: 'arxiv', text: 'self-improving agent roadmap' },
    ]);
    assert.strictEqual(r.topPriority, r.priorities[0].dimension);
    const sorted = [...r.priorities].sort((a,b)=>b.score-a.score);
    assert.strictEqual(r.priorities[0].dimension, sorted[0].dimension);
  });

  await test('接入 SelfScanner 时合并内部弱点', () => {
    const fakeScanner = { scan: () => ({ todoCount: 62, silentCatch: 41, superMonolithKB: 180 }) };
    const o = new StrategyOrchestrator({ projectRoot: '/tmp', selfScanner: fakeScanner });
    const r = o.orchestrate([{ source: 'self_scan', text: 'TODO 沉默catch 超级单体' }]);
    assert.ok(r.internalWeaknessScan);
    assert.strictEqual(r.internalWeaknessScan.todoCount, 62);
  });

  await test('推演结果明确标注未做真实改动(防 Phantom Guardrails)', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([{ source: 'industry_trend', text: '趋势 战略' }]);
    assert.strictEqual(r.verified, false);
    assert.ok(/不自行修改代码/.test(r.note));
  });

  await test('getLastDecision 返回最近一次推演', () => {
    const o = new StrategyOrchestrator({ projectRoot: '/tmp' });
    const r = o.orchestrate([{ source: 'industry_trend', text: '趋势' }]);
    assert.strictEqual(o.getLastDecision(), r);
  });

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();
