/**
 * ContinuousLearner — Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ContinuousLearner } = require('../src/cortex/continuous-learner.js');

const TEST_LOG = path.join(__dirname, '../data/test-continuous-learner-log.json');

function makeCL(opts) {
  const cl = new ContinuousLearner({ reflectInterval: 3, lowConfidenceThreshold: 0.4, ...opts });
  // Isolate data file
  cl._getLogPath = () => TEST_LOG;
  const origLoad = cl.load.bind(cl);
  const origSave = cl._save.bind(cl);
  cl.load = () => {
    if (cl._loaded) return;
    try {
      if (fs.existsSync(TEST_LOG)) {
        const d = JSON.parse(fs.readFileSync(TEST_LOG, 'utf8'));
        cl._log.thinkCount = d.thinkCount || 0;
        cl._log.totalReflections = d.totalReflections || 0;
        cl._log.lowConfidenceHits = d.lowConfidenceHits || 0;
        cl._log.autoLessonsGenerated = d.autoLessonsGenerated || 0;
      }
    } catch (e) { /* ignore */ }
    cl._loaded = true;
  };
  cl._save = () => {
    try {
      const dir = path.dirname(TEST_LOG);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TEST_LOG, JSON.stringify({
        thinkCount: cl._log.thinkCount,
        totalReflections: cl._log.totalReflections,
        lowConfidenceHits: cl._log.lowConfidenceHits,
        autoLessonsGenerated: cl._log.autoLessonsGenerated,
      }));
    } catch (e) { /* ignore */ }
  };
  cl.load();
  return cl;
}

function cleanup() {
  try { fs.unlinkSync(TEST_LOG); } catch (_) {}
}

// Fake lessonBank for testing
function makeFakeLessonBank() {
  const lessons = [];
  return {
    add: (l) => { lessons.push(l); return { action: 'added' }; },
    getLessons: () => lessons,
  };
}

module.exports = function ({ test }) {

  test('ContinuousLearner: detects low confidence', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    const r = cl.reflect(
      { type: 'analytical', confidence: 0.3, analysis: { perceivedType: 'analytical' } },
      'what is this',
      lb
    );
    assert.strictEqual(r.reflected, true, 'should reflect on low confidence');
    assert.strictEqual(r.insights.includes('confidence_gap'), true);
    cleanup();
  });

  test('ContinuousLearner: ignores normal confidence', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    const r = cl.reflect(
      { type: 'analytical', confidence: 0.8, analysis: { perceivedType: 'analytical' } },
      'explain this to me',
      lb
    );
    assert.strictEqual(r.reflected, false, 'high confidence should not reflect');
    cleanup();
  });

  test('ContinuousLearner: detects invalid classification', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    const r = cl.reflect(
      { type: 'invalid', confidence: 0.5, analysis: { perceivedType: 'invalid' } },
      'x',
      lb
    );
    assert.strictEqual(r.reflected, true, 'should reflect on invalid');
    assert.strictEqual(r.insights.includes('misclassification'), true);
    cleanup();
  });

  test('ContinuousLearner: cumulative summary on interval', () => {
    cleanup();
    const cl = makeCL({ reflectInterval: 3, lowConfidenceThreshold: 0.4 });
    const lb = makeFakeLessonBank();
    // 3 calls with low confidence to trigger summary
    cl.reflect({ type: 'analytical', confidence: 0.3, analysis: {} }, 'test', lb);
    cl.reflect({ type: 'analytical', confidence: 0.3, analysis: {} }, 'test', lb);
    const r3 = cl.reflect({ type: 'analytical', confidence: 0.3, analysis: {} }, 'test', lb);
    assert.strictEqual(r3.summary !== null, true, '3rd call should trigger cumulative summary');
    cleanup();
  });

  test('ContinuousLearner: counts persist across calls', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    cl.reflect({ type: 'analytical', confidence: 0.3, analysis: {} }, 'low', lb);
    cl.reflect({ type: 'analytical', confidence: 0.8, analysis: {} }, 'high', lb);
    cl.reflect({ type: 'invalid', confidence: 0.5, analysis: {} }, 'bad', lb);
    const stats = cl.getStats();
    assert.strictEqual(stats.thinkCount, 3);
    assert.strictEqual(stats.lowConfidenceHits, 1);
    cleanup();
  });

  test('ContinuousLearner: writes to lessonBank', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    cl.reflect({ type: 'analytical', confidence: 0.3, analysis: {} }, 'low confidence input', lb);
    assert.strictEqual(lb.getLessons().length, 1, 'should have written one lesson');
    cleanup();
  });

  test('ContinuousLearner: fast track loop detection', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    // Simulate 3 short inputs in a row
    cl.reflect({ type: 'analytical', confidence: 0.7, analysis: {} }, 'hi', lb);
    cl.reflect({ type: 'analytical', confidence: 0.7, analysis: {} }, 'ok', lb);
    const r3 = cl.reflect({ type: 'analytical', confidence: 0.7, analysis: {} }, 'no', lb);
    // The 3rd rapid-analyze short input triggers fastTrackLoop
    assert.strictEqual(r3.insights.includes('spinning_detected'), true, 'should detect fast track loop on 3rd short input');
    cleanup();
  });

  test('ContinuousLearner: can be disabled', () => {
    cleanup();
    const cl = new ContinuousLearner({ enabled: false });
    const r = cl.reflect({ type: 'invalid', confidence: 0.1, analysis: {} }, 'x', null);
    assert.strictEqual(r.reflected, false, 'disabled should not reflect');
    cleanup();
  });

  test('ContinuousLearner: statistic consistency', () => {
    cleanup();
    const cl = makeCL();
    const lb = makeFakeLessonBank();
    for (let i = 0; i < 7; i++) {
      cl.reflect({ type: 'analytical', confidence: i % 3 === 0 ? 0.3 : 0.8, analysis: {} }, 'test', lb);
    }
    const stats = cl.getStats();
    assert.strictEqual(stats.thinkCount, 7);
    assert.strictEqual(stats.totalReflections > 0, true, 'should have some reflections');
    cleanup();
  });
};
