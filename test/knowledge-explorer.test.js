/**
 * KnowledgeExplorer — Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { KnowledgeExplorer } = require('../src/cortex/knowledge-explorer.js');

const TEST_GAP = path.join(__dirname, '../data/test-knowledge-gaps.json');

function makeKE() {
  const ke = new KnowledgeExplorer();
  ke._getGapPath = () => TEST_GAP;
  ke.load = () => {
    if (ke._loaded) return;
    try {
      if (fs.existsSync(TEST_GAP)) {
        const d = JSON.parse(fs.readFileSync(TEST_GAP, 'utf8'));
        ke._gaps = Array.isArray(d.gaps) ? d.gaps : [];
        ke._stats = d.stats || { totalGapsIdentified: 0, totalExplorationsCompleted: 0, totalKnowledgeAbsorbed: 0 };
      } else { ke._gaps = []; }
    } catch (e) { ke._gaps = []; }
    ke._loaded = true;
  };
  ke._save = () => {
    try {
      const dir = path.dirname(TEST_GAP);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TEST_GAP, JSON.stringify({ gaps: ke._gaps, stats: ke._stats }));
    } catch (e) { /* ignore */ }
  };
  ke.load();
  return ke;
}

function cleanup() { try { fs.unlinkSync(TEST_GAP); } catch (_) {} }

module.exports = function ({ test }) {

  test('KnowledgeExplorer: starts with 3 innate gaps', () => {
    const ke = new KnowledgeExplorer();
    ke.load();
    const stats = ke.getStats();
    assert.strictEqual(stats.totalGaps >= 3, true, 'should have 3+ innate gaps');
  });

  test('KnowledgeExplorer: registerGap adds new gap', () => {
    cleanup();
    const ke = makeKE();
    const r = ke.registerGap({ topic: 'AI安全对齐', question: '如何保证AI对齐人类价值？', source: '心虫自驱', priority: 7 });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.action, 'added');
    cleanup();
  });

  test('KnowledgeExplorer: dedup same topic gap', () => {
    cleanup();
    const ke = makeKE();
    ke.registerGap({ topic: '持续学习前沿方法', question: 'LLM持续学习SOTA？', source: 'test', priority: 6 });
    const r2 = ke.registerGap({ topic: '持续学习前沿方法', question: '更新的方法？', source: 'new', priority: 8 });
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r2.action, 'updated');
    cleanup();
  });

  test('KnowledgeExplorer: nextToExplore returns highest priority pending gap', () => {
    cleanup();
    const ke = makeKE();
    ke.registerGap({ topic: '低优先级', question: 'test', source: 't', priority: 2 });
    ke.registerGap({ topic: '高优先级', question: 'test high', source: 't', priority: 9 });
    const r = ke.nextToExplore();
    assert.strictEqual(r !== null, true);
    assert.strictEqual(r.gap.topic, '高优先级');
    cleanup();
  });

  test('KnowledgeExplorer: recordExploration marks gap as explored', () => {
    cleanup();
    const ke = makeKE();
    ke.registerGap({ topic: '测试探索', question: 'test', source: 't', priority: 5 });
    const next = ke.nextToExplore();
    const recordR = ke.recordExploration(next.gap.id, {
      success: true,
      summary: '找到了相关的论文和方法',
      findings: ['方法A: X', '方法B: Y'],
      sources: ['arxiv:2301.001', 'arxiv:2301.002'],
    });
    assert.strictEqual(recordR.success, true);
    assert.strictEqual(recordR.status, 'explored');
    const gap = ke.getGaps({ status: 'explored' });
    assert.strictEqual(gap.length, 1);
    cleanup();
  });

  test('KnowledgeExplorer: absorbLearnerSignals creates gap when rate high', () => {
    cleanup();
    const ke = makeKE();
    ke._gaps = []; // clear innate
    ke.absorbLearnerSignals({ thinkCount: 10, lowConfidenceHits: 3 });
    const gaps = ke.getGaps();
    assert.strictEqual(gaps.length > 0, true, 'high confidence gap rate should create gap');
    cleanup();
  });

  test('KnowledgeExplorer: nextToExplore respects skip interval', () => {
    cleanup();
    const ke = makeKE();
    ke.config = { minExplorationInterval: 3600000 }; // 1h
    ke._gaps = [
      { id: 'skip-test', topic: 'skip', question: 'q', priority: 5, status: 'explored', lastExploredAt: Date.now() - 60000, suggestedSource: 'arxiv' },
    ];
    // Should be skipped because recently explored
    const r = ke.nextToExplore();
    assert.strictEqual(r, null, 'recently explored gap should be skipped');
    cleanup();
  });

  test('KnowledgeExplorer: stats show status breakdown', () => {
    cleanup();
    const ke = makeKE();
    ke._gaps = [];
    ke.registerGap({ topic: '待探索', question: 'q1', source: 't', priority: 6 });
    ke.registerGap({ topic: '已完成', question: 'q2', source: 't', priority: 7 });
    // Manually set one as explored
    const all = ke.getGaps();
    const exploredGap = all.find(g => g.topic === '已完成');
    if (exploredGap) {
      const g = ke._gaps.find(x => x.id === exploredGap.id);
      if (g) g.status = 'absorbed';
    }
    const stats = ke.getStats();
    assert.strictEqual(stats.byStatus.pending >= 1, true);
    assert.strictEqual(stats.byStatus.absorbed >= 1, true);
    cleanup();
  });

  test('KnowledgeExplorer: clear removes all gaps', () => {
    cleanup();
    const ke = makeKE();
    ke.registerGap({ topic: '临时', question: 't', source: 't', priority: 5 });
    assert.strictEqual(ke.getGaps().length >= 1, true);
    ke.clear();
    assert.strictEqual(ke.getGaps().length, 0);
    cleanup();
  });
};
