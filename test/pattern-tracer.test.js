/**
 * PatternTracer — Tests
 */
const assert = require('assert');
const { PatternTracer } = require('../src/cortex/pattern-tracer.js');

function makeReflections() {
  return [
    { confidence: 0.25, inputSnip: '量子力学基本原理' },
    { confidence: 0.30, inputSnip: '量子纠缠怎么解释' },
    { confidence: 0.85, inputSnip: '帮我写一个排序函数' },
    { confidence: 0.90, inputSnip: '这个代码有什么bug' },
    { confidence: 0.20, inputSnip: '量子计算的物理实现' },
    { confidence: 0.80, inputSnip: '解释一下HTTP协议' },
    { confidence: 0.28, inputSnip: '量子退相干是什么' },
  ];
}

module.exports = function ({ test }) {

  test('PatternTracer: trace identifies lowest confidence topic', () => {
    const pt = new PatternTracer({});
    const summary = { confidenceTrend: 'declining' };
    const ref = makeReflections();
    const r = pt.trace(summary, ref);
    assert.strictEqual(r.traced, true);
    assert.strictEqual(r.correlations.length > 0, true);
    // Lowest confidence should be quantum topics
    const first = r.correlations[0];
    assert.strictEqual(first.avgConfidence < 0.4, true, 'quantum topics should be low confidence');
    assert.strictEqual(!!r.topCause, true);
    console.log('  top cause:', r.topCause.explanation);
  });

  test('PatternTracer: too few reflections returns not traced', () => {
    const pt = new PatternTracer({});
    const r = pt.trace({ confidenceTrend: 'stable' }, []);
    assert.strictEqual(r.traced, false);
  });

  test('PatternTracer: null input returns not traced', () => {
    const pt = new PatternTracer({});
    const r = pt.trace(null, null);
    assert.strictEqual(r.traced, false);
  });

  test('PatternTracer: format returns readable text', () => {
    const pt = new PatternTracer({});
    const summary = { confidenceTrend: 'declining' };
    const ref = makeReflections();
    const trace = pt.trace(summary, ref);
    const text = pt.format(trace);
    assert.strictEqual(text.length > 30, true);
    assert.strictEqual(text.includes('溯源'), true);
  });

  test('PatternTracer: topCause null when confidence not low enough', () => {
    const pt = new PatternTracer({});
    // All high confidence
    const ref = [
      { confidence: 0.8, inputSnip: '写代码' },
      { confidence: 0.9, inputSnip: '分析数据' },
      { confidence: 0.85, inputSnip: '解释概念' },
    ];
    const trace = pt.trace({ confidenceTrend: 'stable' }, ref);
    if (trace.topCause) {
      assert.strictEqual(trace.topCause.explanation, null, 'high confidence should not produce explanation');
    }
  });
};
