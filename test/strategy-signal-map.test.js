'use strict';
/**
 * TDD — 战略信号映射扩展 (strategy-signal-map)
 * 验证：心虫战略层能识别世界格局类新闻信号（地缘/经济/科技/全球），
 *       而不只是内部能力维度。
 *
 * 兼容：node test/strategy-signal-map.test.js（独立）
 *       node test/run-all.js（集成，通过 module.exports 函数）
 */
const assert = require('assert');
const {
  StrategyOrchestrator,
  CAPABILITY_MAP,
} = require('../src/cortex/self-evolution/strategy-orchestrator.js');
const {
  STRATEGY_SIGNAL_MAP,
  mergeSignalMap,
  createWorldAwareOrchestrator,
} = require('../src/cortex/self-evolution/strategy-signal-map.js');

// ── 真实中文新闻样本 ──────────────────────────────────────────
const NEWS = {
  geo: '外交部回应某国导弹试射：呼吁各方保持克制，避免军事冲突升级',
  econ: '海关总署公布数据：上半年外贸进出口增长，对美出口回暖但关税仍是变量',
  tech: 'AI Agent 竞争格局加速，国产大模型芯片算力突破，多模态能力登上 TechCrunch',
  global: '世界格局进入多极化：中美博弈与中欧关系重塑全球秩序',
};

function mkSignals(text) {
  return [{ source: 'industry_trend', text }];
}

function runTests() {
  // ── STRATEGY_SIGNAL_MAP 结构 ──────────────────────────────────
  const dims = STRATEGY_SIGNAL_MAP.map(d => d.dimension).sort();
  assert.deepStrictEqual(dims, [
    'economic_intuition',
    'geopolitical_awareness',
    'global_sense',
    'tech_competition',
  ].sort());
  for (const d of STRATEGY_SIGNAL_MAP) {
    assert.ok(Array.isArray(d.signals) && d.signals.length >= 5, `${d.dimension} 信号过少`);
    assert.ok(typeof d.weight === 'number' && d.weight > 0, `${d.dimension} 权重非法`);
    const hasCn = d.signals.some(s => /[一-龥]/.test(s));
    const hasEn = d.signals.some(s => /[a-z]/i.test(s) && !/[一-龥]/.test(s));
    assert.ok(hasCn && hasEn, `${d.dimension} 未覆盖中英双语`);
  }

  // ── mergeSignalMap 合并语义 ───────────────────────────────────
  const before = CAPABILITY_MAP.length;
  const merged = mergeSignalMap();
  assert.strictEqual(merged.length, before + STRATEGY_SIGNAL_MAP.length);
  assert.strictEqual(CAPABILITY_MAP.length, before, '原 CAPABILITY_MAP 被污染');
  const mergedDims = merged.map(d => d.dimension);
  for (const w of STRATEGY_SIGNAL_MAP) {
    assert.ok(mergedDims.includes(w.dimension), `合并后缺少 ${w.dimension}`);
  }

  assert.notStrictEqual(mergeSignalMap([{ dimension: 'x', weight: 1, signals: ['y'] }]),
    [{ dimension: 'x', weight: 1, signals: ['y'] }]);

  // ── 基线缺陷：纯内部 CAPABILITY_MAP 对新闻信号为空 ─────────────
  const orch = new StrategyOrchestrator({ projectRoot: process.cwd() });
  for (const txt of [NEWS.geo, NEWS.econ, NEWS.tech, NEWS.global]) {
    const r = orch.orchestrate(mkSignals(txt));
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.priorities.length, 0,
      `基线不应命中任何维度，但命中了: ${JSON.stringify(r.priorities)}`);
  }

  // ── 世界感知 orchestrator 命中世界格局维度 ─────────────────────
  const worldOrch = createWorldAwareOrchestrator({ projectRoot: process.cwd() });

  const checkHit = (txt, dim) => {
    const r = worldOrch.orchestrate(mkSignals(txt));
    assert.strictEqual(r.ok, true);
    const hit = r.priorities.find(p => p.dimension === dim);
    assert.ok(hit, `未命中 ${dim}, 实际: ${JSON.stringify(r.priorities)}`);
    assert.ok(hit.score > 0);
  };
  checkHit(NEWS.geo, 'geopolitical_awareness');
  checkHit(NEWS.econ, 'economic_intuition');
  checkHit(NEWS.tech, 'tech_competition');
  checkHit(NEWS.global, 'global_sense');

  const enR = worldOrch.orchestrate(mkSignals(
    'TechCrunch reports new tariff on semiconductor exports; arxiv paper on LLM agents'));
  const enDims = enR.priorities.map(p => p.dimension);
  assert.ok(enDims.includes('tech_competition'), `英文未命中 tech, 实际: ${JSON.stringify(enDims)}`);
  assert.ok(enDims.includes('economic_intuition'), `英文未命中 econ, 实际: ${JSON.stringify(enDims)}`);

  const mixed = [
    { source: 'industry_trend', text: NEWS.geo },
    { source: 'industry_trend', text: '我们需要提升 local-first 本地部署能力' },
  ];
  const mixedR = worldOrch.orchestrate(mixed);
  const mixedDims = mixedR.priorities.map(p => p.dimension);
  assert.ok(mixedDims.includes('geopolitical_awareness'));
  assert.ok(mixedDims.includes('local_zero_dependency'));

  const badR = worldOrch.orchestrate([{ source: 'bogus', text: NEWS.geo }]);
  assert.strictEqual(badR.ok, false);
  assert.strictEqual(badR.reason, 'invalid_sources');
}

if (require.main === module) {
  try { runTests(); console.log('\n✅ strategy-signal-map 测试全部通过'); }
  catch (e) { console.error('\n❌', e.message); process.exit(1); }
}

module.exports = function ({ test }) {
  test('战略信号映射：心虫战略层能识别世界格局新闻信号', () => {
    runTests();
  });
};
