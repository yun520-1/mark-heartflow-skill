/**
 * Experience Distiller — Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ExperienceDistiller } = require('../src/cortex/experience-distiller.js');

// Use an isolated temp file for testing so we never pollute real data
const TEST_DATA_FILE = path.join(__dirname, '../data/test-experience-abstractions.json');

function makeDistiller(opts = {}) {
  // Override DATA_FILE via path trick: patches the module's private DATA_FILE 
  // by constructing a subclass that uses a different data dir
  const d = new ExperienceDistiller({ decayDays: 1, ...opts });
  // Force isolated file — read/write to test file instead of production
  d._getDataFile = () => TEST_DATA_FILE;
  // Override _save and load
  const origLoad = d.load.bind(d);
  const origSave = d._save.bind(d);
  d.load = () => {
    d._loaded = false;
    d._dataFile = TEST_DATA_FILE;
    // Direct read
    try {
      if (fs.existsSync(TEST_DATA_FILE)) {
        d._abstractions = JSON.parse(fs.readFileSync(TEST_DATA_FILE, 'utf8'));
      } else {
        d._abstractions = [];
      }
    } catch(_) { d._abstractions = []; }
    d._loaded = true;
  };
  d._save = () => {
    try {
      const dir = path.dirname(TEST_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(d._abstractions, null, 2), 'utf8');
    } catch(_) {}
  };
  d.load();
  return d;
}

function cleanup() {
  try { fs.unlinkSync(TEST_DATA_FILE); } catch (_) {}
}

module.exports = function({ test }) {

  test('distill: creates abstraction from valid tcResult', () => {
    cleanup();
    const d = makeDistiller();
    const tcResult = {
      type: 'analytical',
      confidence: 0.82,
      decision: { type: 'analyze', rationale: '用户提出了分析性问题，需要深入推理' },
      analysis: { perceivedType: 'analytical', modulesRun: 4 },
    };
    const added = d.distill(tcResult, 'explain why this happens');
    assert.strictEqual(added.length > 0, true, 'should distill at least one abstraction');
    // route_pattern should be first (added before module_composition)
    const routeAbs = added.find(a => a.type === 'route_pattern');
    assert.strictEqual(!!routeAbs, true, 'should include route_pattern abstraction');
    assert.strictEqual(routeAbs.trigger.typePattern, 'analytical');
    cleanup();
  });

  test('distill: skips low confidence results', () => {
    cleanup();
    const d = makeDistiller({ minConfidence: 0.4 });
    const tcResult = {
      type: 'analytical',
      confidence: 0.15,
      decision: { type: 'unknown' },
      analysis: { modulesRun: 1 },
    };
    const added = d.distill(tcResult, 'hi');
    assert.strictEqual(added.length, 0, 'low confidence should not generate abstraction');
    cleanup();
  });

  test('distill: skips invalid/unknown types', () => {
    cleanup();
    const d = makeDistiller();
    assert.strictEqual(d.distill({ type: 'invalid', confidence: 0.9, decision: {} }, 'x').length, 0);
    assert.strictEqual(d.distill({ type: 'unknown', confidence: 0.9, decision: {} }, 'x').length, 0);
    cleanup();
  });

  test('recall: finds relevant abstraction', () => {
    cleanup();
    const d = makeDistiller();
    d._abstractions = [
      {
        id: 'test-abs-1',
        type: 'route_pattern',
        trigger: { typePattern: 'analytical', features: ['causal_question', 'explanatory'] },
        insight: '当输入分类为 analytical 时，走 analyze 路由',
        decisionLabel: 'analyze',
        confidence: 0.8,
        born: Date.now() - 1000,
        lastUsed: Date.now() - 1000,
        useCount: 0,
        hitCount: 0,
      },
      {
        id: 'test-abs-2',
        type: 'route_pattern',
        trigger: { typePattern: 'emotional', features: ['emotional'] },
        insight: '当输入分类为 emotional 时，用心理引擎处理',
        decisionLabel: 'resonate',
        confidence: 0.7,
        born: Date.now() - 1000,
        lastUsed: Date.now() - 1000,
        useCount: 0,
        hitCount: 0,
      },
    ];
    d._save(); // persist so load() picks them up
    const d2 = makeDistiller(); // fresh instance that loads from file
    const results = d2.recall('explain why this happens analytically');
    assert.strictEqual(results.length > 0, true, 'should find matching abstraction');
    assert.strictEqual(results[0].id, 'test-abs-1', 'first should be analytical match');
    cleanup();
  });

  test('persistence: saves and reloads', () => {
    cleanup();
    const d1 = makeDistiller();
    d1._abstractions = [{ id: 'test-persist-1', type: 'route_pattern', trigger: { typePattern: 'test' }, insight: 'test', confidence: 0.5, born: Date.now(), lastUsed: Date.now(), useCount: 1, hitCount: 0 }];
    d1._save();
    const d2 = makeDistiller();
    d2.load();
    assert.strictEqual(d2.getAbstractions().length, 1, 'should reload saved abstractions');
    assert.strictEqual(d2.getAbstractions()[0].id, 'test-persist-1');
    cleanup();
  });

  test('recall with decay: old unused abstractions get lower score', () => {
    cleanup();
    const d = makeDistiller({ decayDays: 1 });
    d._abstractions = [
      {
        id: 'test-decay-1',
        type: 'route_pattern',
        trigger: { typePattern: 'analytical' },
        insight: 'old unused insight',
        decisionLabel: 'analyze',
        confidence: 0.9,
        born: Date.now() - (40 * 86400000), // 40 days ago
        lastUsed: Date.now() - (35 * 86400000), // 35 days since last use
        useCount: 0,
        hitCount: 0,
      },
    ];
    const results = d.recall('analytical question');
    if (results.length > 0) {
      assert.strictEqual(results[0].relevanceScore < 0.3, true, 'decayed abstraction should have very low score');
    }
    cleanup();
  });

  test('scenario: multi-round distillation builds useful library', () => {
    cleanup();
    const d = makeDistiller({ decayDays: 30, minConfidence: 0.3 });
    const rounds = [
      { input: 'explain why the sky is blue', type: 'analytical', confidence: 0.85, decision: 'analyze', modules: 4 },
      { input: 'I feel sad today', type: 'emotional', confidence: 0.78, decision: 'resonate', modules: 3 },
      { input: 'should I take this job', type: 'prescriptive', confidence: 0.72, decision: 'judge', modules: 5 },
      { input: 'how to build a table', type: 'procedural', confidence: 0.80, decision: 'guide', modules: 3 },
      { input: 'what will happen if AI advances', type: 'speculative', confidence: 0.65, decision: 'reflect', modules: 4 },
    ];
    let totalAdded = 0;
    for (const r of rounds) {
      totalAdded += d.distill({
        type: r.type,
        confidence: r.confidence,
        decision: { type: r.decision, rationale: r.decision + ' rationale' },
        analysis: { modulesRun: r.modules },
      }, r.input).length;
    }
    assert.strictEqual(totalAdded > 0, true, 'should accumulate abstractions');
    assert.strictEqual(d.getStats().totalStored > 0, true, 'should have stored abstractions');
    d._save();
    // Recall should find the emotional one for emotional input
    const d3 = makeDistiller({ decayDays: 30, minConfidence: 0.3 }); // fresh load from disk
    const results = d3.recall('I feel very sad and lonely');
    assert.strictEqual(results.length > 0, true, 'emotional recall should find match');
    cleanup();
  });
};
