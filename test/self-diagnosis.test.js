/**
 * SelfDiagnosis — Tests
 */
const assert = require('assert');
const { SelfDiagnosis } = require('../src/core/self-diagnosis.js');

// Mock HeartFlow with all data patterns
function makeMockHF(withRichData = false) {
  if (!withRichData) {
    return {
      constructor: { VERSION: '6.2.3' },
      _startTime: Date.now() - 7200000, // 2h ago
      continuousLearner: { getStats: () => ({ thinkCount: 0, lowConfidenceHits: 0, autoLessons: 0, totalReflections: 0 }) },
      knowledgeExplorer: { getStats: () => null },
      strategicRestraint: null,
      experienceDistiller: null,
      lesson: null,
      learningPulse: null,
      learningOrchestrator: null,
    };
  }

  return {
    constructor: { VERSION: '6.2.3' },
    _startTime: Date.now() - 7200000,
    continuousLearner: {
      getStats: () => ({
        thinkCount: 120, lowConfidenceHits: 8, autoLessons: 3, totalReflections: 15,
        recentReflections: [], config: {},
      }),
    },
    knowledgeExplorer: {
      getStats: () => ({
        totalGaps: 6, totalGapsIdentified: 6, totalExplorationsCompleted: 2, totalKnowledgeAbsorbed: 4,
        byStatus: { pending: 3, exploring: 0, explored: 1, absorbed: 2 },
        topPriority: [{ topic: '持续学习前沿方法', priority: 8 }, { topic: '置信度校准优化', priority: 7 }],
      }),
    },
    strategicRestraint: {
      getDontList: () => [{}],
      getStats: () => ({ evaluations: 30, restrained: 5, approved: 25 }),
    },
    experienceDistiller: {
      getStats: () => ({ totalDistilled: 18, totalRecalled: 7, totalStored: 15, types: ['a', 'b'] }),
    },
    lesson: { lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }, { id: 'l5' }] },
    learningPulse: { getStats: () => ({ ticksTriggered: 8, exploresTriggered: 2, confidenceAlerts: 1, lastTickAt: Date.now(), lastExploreAt: null, config: {}, tickProgress: 3, ticksToNext: 7, exploreProgress: 10, ticksToNextExplore: 20 }) },
    learningOrchestrator: {
      status: () => ({
        linkage: { learnerToExplorer: true, distillerToThink: true, reflectionsToLessonBank: true, explorationBacklog: 2 },
        healthScore: 0.72,
        learningLoop: { detect: 15, explore: 2, absorb: 15, restrain: 5 },
        learningModules: {
          knowledgeExplorer: { topPending: [{ topic: '持续学习前沿方法' }, { topic: '置信度校准优化' }] },
        },
      }),
    },
  };
}

module.exports = function ({ test }) {

  test('SelfDiagnosis: run returns ok with minimal HF', () => {
    const hf = makeMockHF(false);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    assert.strictEqual(r.ok, true);
    assert.strictEqual(!!r.diagnosis, true);
    assert.strictEqual(!!r.summary, true);
    assert.strictEqual(!!r.data, true);
  });

  test('SelfDiagnosis: diagnoses 5 areas', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    const areas = Object.keys(r.diagnosis);
    assert.strictEqual(areas.includes('identity'), true);
    assert.strictEqual(areas.includes('learning'), true);
    assert.strictEqual(areas.includes('restraint'), true);
    assert.strictEqual(areas.includes('knowledge'), true);
    assert.strictEqual(areas.includes('execution'), true);
  });

  test('SelfDiagnosis: identity shows version and uptime', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    const identityItems = r.diagnosis.identity;
    const versionItem = identityItems.find(x => x.msg.includes('6.2.3'));
    assert.strictEqual(!!versionItem, true);
  });

  test('SelfDiagnosis: learning diagnosis detects reflection count', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    const learningItems = r.diagnosis.learning;
    const reflectionItem = learningItems.find(x => x.msg.includes('15 次自我反思'));
    assert.strictEqual(!!reflectionItem, true, 'should mention 15 reflections');
  });

  test('SelfDiagnosis: summary readable text is returned', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    assert.strictEqual(typeof r.summary.readable, 'string');
    assert.strictEqual(r.summary.readable.length > 10, true);
  });

  test('SelfDiagnosis: run without HF returns error', () => {
    const sd = new SelfDiagnosis(null);
    const r = sd.run();
    assert.strictEqual(r.ok, false);
  });

  test('SelfDiagnosis: summary counts are consistent', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    assert.strictEqual(typeof r.summary.totalItems, 'number');
    assert.strictEqual(typeof r.summary.goodCount, 'number');
    assert.strictEqual(typeof r.summary.badCount, 'number');
    assert.strictEqual(typeof r.summary.confidence, 'number');
  });

  test('SelfDiagnosis: learning diagnosis reports pending gaps', () => {
    const hf = makeMockHF(true);
    const sd = new SelfDiagnosis(hf);
    const r = sd.run();
    const learningItems = r.diagnosis.learning;
    const gapItem = learningItems.find(x => x.msg.includes('待探索'));
    assert.strictEqual(!!gapItem, true, 'should report pending gaps');
  });
};
