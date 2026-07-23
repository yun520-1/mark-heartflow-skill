/**
 * LearningOrchestrator — Tests
 */
const assert = require('assert');
const { LearningOrchestrator } = require('../src/cortex/learning-orchestrator.js');

// Fake HeartFlow instance with minimal module stubs
function makeFakeHF(withModules = true) {
  const hf = {
    experienceDistiller: null,
    strategicRestraint: null,
    continuousLearner: null,
    knowledgeExplorer: null,
    lesson: null,
    _modules: {},
  };

  if (withModules) {
    // distiller
    hf.experienceDistiller = {
      getStats: () => ({ totalDistilled: 12, totalRecalled: 5, totalStored: 12, types: ['route_pattern', 'module_composition'] }),
    };

    // restraint (with some evaluate history)
    hf.strategicRestraint = {
      getDontList: () => [
        { id: 'dr-1', item: '功能堆砌', reason: 'test', strength: 0.9 },
        { id: 'dr-2', item: '视频生成', reason: 'test', strength: 0.85 },
      ],
      getStats: () => ({ evaluations: 20, restrained: 5, approved: 15, dontListCount: 6 }),
      evaluate: () => ({ restrained: false }),
    };

    // learner
    hf.continuousLearner = {
      getStats: () => ({
        thinkCount: 50,
        totalReflections: 8,
        lowConfidenceHits: 6,
        autoLessons: 3,
        recentReflections: [],
        config: { reflectInterval: 5, lowConfidenceThreshold: 0.4 },
      }),
    };

    // explorer
    hf.knowledgeExplorer = {
      getStats: () => ({
        totalGaps: 5,
        totalGapsIdentified: 5,
        totalExplorationsCompleted: 2,
        totalKnowledgeAbsorbed: 3,
        byStatus: { pending: 3, exploring: 0, explored: 1, absorbed: 1 },
        topPriority: [
          { topic: '持续学习前沿方法', priority: 8, status: 'pending' },
          { topic: '置信度校准优化', priority: 7, status: 'pending' },
        ],
      }),
      getGaps: ({ status }) => {
        if (status === 'explored') {
          return [{ id: 'gap-1', topic: '已探索缺口', explorationResult: { success: true, summary: '找到了方法' }, _absorbedToWorldTree: false }];
        }
        return [];
      },
      absorbLearnerSignals: (stats) => {},
    };

    hf.lesson = { lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }] };
    hf._modules.worldtree = { search: () => ({}) };
  }

  return hf;
}

module.exports = function ({ test }) {

  test('LearningOrchestrator: status returns complete report', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const s = lo.status();
    assert.strictEqual(!!s, true);
    assert.strictEqual(!!s.meta, true);
    assert.strictEqual(!!s.learningModules, true);
    assert.strictEqual(!!s.linkage, true);
    assert.strictEqual(!!s.healthScore, true);
    assert.strictEqual(!!s.learningLoop, true);
    // All 4 modules should be loaded
    assert.strictEqual(s.learningModules.experienceDistiller.loaded, true);
    assert.strictEqual(s.learningModules.strategicRestraint.loaded, true);
    assert.strictEqual(s.learningModules.continuousLearner.loaded, true);
    assert.strictEqual(s.learningModules.knowledgeExplorer.loaded, true);
  });

  test('LearningOrchestrator: status when modules are not loaded', () => {
    const hf = makeFakeHF(false);
    const lo = new LearningOrchestrator(hf);
    const s = lo.status();
    assert.strictEqual(s.learningModules.experienceDistiller.loaded, false);
    assert.strictEqual(s.learningModules.continuousLearner.loaded, false);
    // Overall health should still return valid value
    assert.strictEqual(typeof s.healthScore, 'number');
  });

  test('LearningOrchestrator: healthScore is between 0 and 1', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const s = lo.status();
    assert.strictEqual(s.healthScore >= 0 && s.healthScore <= 1, true);
  });

  test('LearningOrchestrator: tick propagates signals', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const r = lo.tick();
    assert.strictEqual(r.ticked, true);
    assert.strictEqual(r.results.length > 0, true);
    // Should have learner → explorer signal
    const signal = r.results.find(x => x.action === 'absorbLearnerSignals');
    assert.strictEqual(!!signal, true);
  });

  test('LearningOrchestrator: status includes linkage info', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const s = lo.status();
    assert.strictEqual(typeof s.linkage.learnerToExplorer, 'boolean');
    assert.strictEqual(typeof s.linkage.distillerToThink, 'boolean');
    assert.strictEqual(typeof s.linkage.reflectionsToLessonBank, 'boolean');
  });

  test('LearningOrchestrator: learningLoop counts are numbers', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const s = lo.status();
    assert.strictEqual(typeof s.learningLoop.detect, 'number');
    assert.strictEqual(typeof s.learningLoop.explore, 'number');
    assert.strictEqual(typeof s.learningLoop.absorb, 'number');
    assert.strictEqual(typeof s.learningLoop.restrain, 'number');
  });

  test('LearningOrchestrator: status is consistent across calls', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const s1 = lo.status();
    const s2 = lo.status();
    // Health score should be the same (modules haven't changed)
    assert.strictEqual(s1.healthScore, s2.healthScore);
    assert.strictEqual(s1.learningLoop.detect, s2.learningLoop.detect);
  });

  test('LearningOrchestrator: explore gap marked ready_to_absorb', () => {
    const hf = makeFakeHF(true);
    const lo = new LearningOrchestrator(hf);
    const r = lo.tick();
    const readyToAbsorb = r.results.find(x => x.action === 'ready_to_absorb');
    assert.strictEqual(!!readyToAbsorb, true, 'explored gaps should be marked ready_to_absorb');
  });
};
