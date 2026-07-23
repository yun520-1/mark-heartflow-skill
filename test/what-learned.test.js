/**
 * WhatLearned — Tests
 */
const assert = require('assert');
const { WhatLearned } = require('../src/core/what-learned.js');

function makeMockHF() {
  return {
    lesson: {
      lessons: [
        { type: 'correction', content: '执行明确指令时直接做，不反复确认', importance: 10, frequency: 2 },
        { type: 'wisdom', content: '克制比进取更重要', importance: 8, frequency: 1 },
        { type: 'insight', content: 'AGI下一个瓶颈是持续学习', importance: 7, frequency: 1 },
      ],
    },
    selfDiagnosis: {
      run: () => ({
        ok: true,
        summary: { goodCount: 3, okCount: 1, badCount: 0, issues: [], honesty: '各项指标正常', confidence: 0.85 },
      }),
    },
    knowledgeExplorer: {
      getStats: () => ({
        totalGaps: 5, totalGapsIdentified: 5, totalExplorationsCompleted: 2, totalKnowledgeAbsorbed: 3,
        byStatus: { pending: 3, explored: 1, absorbed: 1 },
        topPriority: [{ topic: '持续学习前沿方法', priority: 8 }, { topic: '置信度校准', priority: 7 }],
      }),
    },
    learningOrchestrator: {
      status: () => ({
        healthScore: 0.72,
        learningLoop: { detect: 12, explore: 2, absorb: 15, restrain: 5 },
        linkage: { learnerToExplorer: true, distillerToThink: true },
      }),
    },
  };
}

module.exports = function ({ test }) {

  test('WhatLearned: report returns ok with full HF', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const r = wl.report(true);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(!!r.report, true);
    assert.strictEqual(!!r.report.readable, true);
    assert.strictEqual(r.report.readable.length > 20, true);
  });

  test('WhatLearned: report contains verdict', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const r = wl.report(true);
    const verdict = r.report.parts.find(p => p.type === 'verdict');
    assert.strictEqual(!!verdict, true);
  });

  test('WhatLearned: report contains lessons', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const r = wl.report(true);
    const lessonPart = r.report.parts.find(p => p.type === 'lesson');
    assert.strictEqual(!!lessonPart, true);
    assert.strictEqual(lessonPart.items.length, 3);
  });

  test('WhatLearned: report contains explore section', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const r = wl.report(true);
    const explorePart = r.report.parts.find(p => p.type === 'explore');
    assert.strictEqual(!!explorePart, true);
  });

  test('WhatLearned: brief returns short text', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const b = wl.brief();
    assert.strictEqual(typeof b, 'string');
    assert.strictEqual(b.length > 10, true);
  });

  test('WhatLearned: report without HF returns error', () => {
    const wl = new WhatLearned(null);
    const r = wl.report();
    assert.strictEqual(r.ok, false);
  });

  test('WhatLearned: report caches within 5 min', () => {
    const hf = makeMockHF();
    const wl = new WhatLearned(hf);
    const r1 = wl.report(true);
    const r2 = wl.report(false);
    assert.strictEqual(r2.cached, true, 'second call should be cached');
  });

  test('WhatLearned: report with empty lesson bank', () => {
    const hf = makeMockHF();
    hf.lesson.lessons = [];
    const wl = new WhatLearned(hf);
    const r = wl.report(true);
    const lessonPart = r.report.parts.find(p => p.type === 'lesson');
    assert.strictEqual(lessonPart.items[0], '尚无积累');
  });
};
