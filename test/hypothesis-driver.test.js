/**
 * HypothesisDriver — Tests
 */
const assert = require('assert');
const { HypothesisDriver } = require('../src/cortex/hypothesis-driver.js');

function makeMockHF() {
  return {
    continuousLearner: {
      getStats: () => ({
        recentReflections: [
          { confidence: 0.3, inputSnip: '量子计算基本原理是什么' },
          { confidence: 0.25, inputSnip: '量子纠错怎么做' },
          { confidence: 0.35, inputSnip: '量子叠加态' },
        ],
        thinkCount: 30,
        totalReflections: 6,
        lowConfidenceHits: 9,
      }),
    },
    knowledgeExplorer: {
      registerGap: (entry) => ({ success: true, action: 'added' }),
      getStats: () => ({}),
    },
  };
}

module.exports = function ({ test }) {

  test('HypothesisDriver: generate from declining trend', () => {
    const hf = makeMockHF();
    const hd = new HypothesisDriver(hf);
    const summary = {
      confidenceTrend: 'declining',
      recurringPatterns: [
        { type: 'confidence_gap', count: 5, rate: 0.3, severity: 'high' },
      ],
      recurringTopics: [
        { topic: '量子计算', count: 3 },
      ],
    };
    const h = hd.generate(summary);
    assert.strictEqual(h.length > 0, true, 'should generate at least one hypothesis');
    assert.strictEqual(h.some(x => x.statement.includes('量子')), true, 'should mention quantum topic');
    assert.strictEqual(hd.getStats().hypothesesGenerated > 0, true);
  });

  test('HypothesisDriver: empty summary returns nothing', () => {
    const hf = makeMockHF();
    const hd = new HypothesisDriver(hf);
    const h = hd.generate(null);
    assert.strictEqual(h.length, 0);
  });

  test('HypothesisDriver: stable trend generates nothing', () => {
    const hf = makeMockHF();
    const hd = new HypothesisDriver(hf);
    const summary = {
      confidenceTrend: 'stable',
      recurringPatterns: [],
      recurringTopics: [],
    };
    const h = hd.generate(summary);
    assert.strictEqual(h.length, 0);
  });

  test('HypothesisDriver: verify removes from active', () => {
    const hf = makeMockHF();
    const hd = new HypothesisDriver(hf);
    const summary = {
      confidenceTrend: 'declining',
      recurringPatterns: [{ type: 'confidence_gap', count: 3, rate: 0.2 }],
      recurringTopics: [{ topic: '测试话题', count: 2 }],
    };
    hd.generate(summary);
    const before = hd.getStats().activeCount;
    assert.strictEqual(before > 0, true);
    // Verify the first one
    hd.verify(hd._stats.activeHypotheses[0], true);
    assert.strictEqual(hd.getStats().activeCount, before - 1);
    assert.strictEqual(hd.getStats().hypothesesVerified, 1);
    assert.strictEqual(hd.getStats().hypothesesProvenRight, 1);
  });

  test('HypothesisDriver: registers gaps to KnowledgeExplorer', () => {
    let registered = false;
    const hf = { ...makeMockHF(), knowledgeExplorer: { registerGap: () => { registered = true; return { success: true }; } } };
    const hd = new HypothesisDriver(hf);
    hd.generate({
      confidenceTrend: 'declining',
      recurringPatterns: [{ type: 'confidence_gap', count: 3, rate: 0.2 }],
      recurringTopics: [{ topic: '测试话题', count: 2 }],
    });
    assert.strictEqual(registered, true, 'should register gap');
  });
};
