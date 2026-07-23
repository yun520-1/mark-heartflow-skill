/**
 * LearningPulse — Tests
 */
const assert = require('assert');
const { LearningPulse } = require('../src/cortex/learning-pulse.js');

// Mock HeartFlow instance
function makeMockHF() {
  const tickResults = [];
  return {
    learningOrchestrator: {
      tick: () => {
        tickResults.push(Date.now());
        return {
          ticked: true,
          results: [
            { from: 'knowledgeExplorer', to: 'worldTree', gap: '已探索缺口', action: 'ready_to_absorb' },
          ],
        };
      },
      _tickCount: () => tickResults.length,
    },
    knowledgeExplorer: {
      nextToExplore: () => ({ gap: { id: 'auto-1', topic: '持续学习', suggestedQuery: 'continual learning', priority: 7, source: 'auto' } }),
      recordExploration: () => ({ success: true }),
    },
    gapExecutor: {
      executeBatch: async (explorer, count) => ({
        executed: true,
        batchSize: 1,
        results: [{
          gapId: 'auto-1',
          gapTopic: '持续学习',
          searchResult: { success: true, count: 2, topFindings: ['Paper 1', 'Paper 2'], summary: 'Found papers about continual learning' },
          recorded: true,
        }],
      }),
    },
    _modules: {
      worldtree: {
        store: (cat, content, opts) => {
          // Don't actually store in tests
          return { success: true };
        },
      },
    },
    continuousLearner: {
      getStats: () => ({ thinkCount: 50, lowConfidenceHits: 3 }),
    },
  };
}

module.exports = function ({ test }) {

  test('LearningPulse: beat increments counter', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 5, exploreInterval: 10 });
    for (let i = 0; i < 3; i++) lp.beat();
    assert.strictEqual(lp.getStats().ticksTriggered, 0, '3 beats < 5 interval, no tick yet');
  });

  test('LearningPulse: triggers tick at interval', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 3, exploreInterval: 10 });
    for (let i = 0; i < 3; i++) lp.beat();
    assert.strictEqual(lp.getStats().ticksTriggered, 1, '3rd beat should trigger tick');
  });

  test('LearningPulse: triggers explore at explore interval', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 2, exploreInterval: 2 });
    // tickInterval=2, exploreInterval=2 → explore after 4 beats
    for (let i = 0; i < 4; i++) lp.beat();
    const stats = lp.getStats();
    assert.strictEqual(stats.ticksTriggered >= 1, true, 'should have ticks');
    assert.strictEqual(stats.exploresTriggered >= 1, true, 'should have explore');
  });

  test('LearningPulse: low confidence triggers alert', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 100, exploreInterval: 100 });
    lp.beat({ confidence: 0.15, type: 'analytical', analysis: {} });
    assert.strictEqual(lp.getStats().confidenceAlerts, 1);
  });

  test('LearningPulse: normal confidence no alert', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 100, exploreInterval: 100 });
    lp.beat({ confidence: 0.8, type: 'analytical', analysis: {} });
    assert.strictEqual(lp.getStats().confidenceAlerts, 0);
  });

  test('LearningPulse: getStats returns progress info', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 5, exploreInterval: 3 });
    for (let i = 0; i < 7; i++) lp.beat();
    const stats = lp.getStats();
    assert.strictEqual(typeof stats.tickProgress, 'number');
    assert.strictEqual(typeof stats.ticksToNext, 'number');
    assert.strictEqual(typeof stats.ticksToNextExplore, 'number');
  });

  test('LearningPulse: reset clears state', () => {
    const hf = makeMockHF();
    const lp = new LearningPulse(hf, { tickInterval: 2, exploreInterval: 2 });
    for (let i = 0; i < 6; i++) lp.beat();
    assert.strictEqual(lp.getStats().ticksTriggered > 0, true);
    lp.reset();
    assert.strictEqual(lp.getStats().ticksTriggered, 0);
    assert.strictEqual(lp.getStats().exploresTriggered, 0);
  });
};
