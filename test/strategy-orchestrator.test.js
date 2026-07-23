// strategy-orchestrator 反自欺增强测试 [v6.1.3]
// 验证：全利好信号 → 标 optimism_bias 盲区；含脆弱面 → 不标
const assert = require('assert');
const { StrategyOrchestrator } = require('../src/cortex/self-evolution/strategy-orchestrator.js');

module.exports = function ({ test }) {
  const so = new StrategyOrchestrator({ projectRoot: process.cwd() });

  test('反自欺: 全利好信号触发 optimism_bias 盲区', () => {
    const r = so.orchestrate([
      { source: 'industry_trend', text: '中国造船业新接订单增长173% 三大指标创新高 外贸稳规模优结构' },
    ]);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.blindSpot, 'optimism_bias_no_downside_signal');
    assert.ok(r.blindSpotNote && r.blindSpotNote.includes('反向脆弱面'));
  });

  test('反自欺: 含下行词汇则无盲区', () => {
    const r = so.orchestrate([
      { source: 'industry_trend', text: '外贸增长但关税战风险加剧 产业空心化压力上升 中东冲突威胁能源' },
    ]);
    assert.strictEqual(r.blindSpot, null);
    assert.strictEqual(r.blindSpotNote, null);
  });

  test('反自欺: 中英文下行词均识别 (英文 risk/decline)', () => {
    const r = so.orchestrate([
      { source: 'industry_trend', text: 'global growth decline, recession risk, supply chain fragile' },
    ]);
    assert.strictEqual(r.blindSpot, null);
  });

  test('反自欺: 空信号仍返回 no_signals', () => {
    const r = so.orchestrate([]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'no_signals');
  });

  test('反自欺: 非法 source 返回 invalid_sources', () => {
    const r = so.orchestrate([{ source: 'bad', text: '测试' }]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'invalid_sources');
  });

  test('反自欺: 原有打分逻辑不受影响 (self_scan 仍映射)', () => {
    const r = so.orchestrate([
      { source: 'self_scan', text: 'engine scan', weaknesses: { todoCount: 40, silentCatches: 2, livenessProbes: [{ alive: false }] } },
    ]);
    assert.strictEqual(r.ok, true);
    assert.ok(r.scores.maintainability > 0);
    assert.ok(r.scores.liveness > 0);
  });
};
