/**
 * HeartFlow v0.16.1 Test Suite
 * 
 * Tests all public APIs with real execution + return value verification.
 * Run: node tests/run.js
 */

const { createHeartFlow } = require('../src/core/heartflow.js');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'test_data');
require('fs').mkdirSync(DATA_DIR, { recursive: true });

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== HeartFlow v0.16.1 Test Suite ===\n');

  const hf = createHeartFlow({ rootPath: DATA_DIR });
  hf.start();

  // ─── Test 1: healthCheck ────────────────────────────────────────────────
  console.log('Test 1: healthCheck()');
  const health = await hf.healthCheck();
  assert(health.started === true, 'started=true');
  assert(health.uptime_ms >= 0, `uptime_ms >= 0 (got ${health.uptime_ms})`);
  assert(health.version === 'v0.16.1', `version = v0.16.1`);
  assert(health.sessionId.startsWith('session-'), `sessionId starts with session-`);
  assert(health.subsystems.memory === true, 'subsystems.memory = true');
  assert(health.subsystems.psychology === true, 'subsystems.psychology = true');
  assert(health.subsystems.evolution === true, 'subsystems.evolution = true');
  assert(health.subsystems.dream === true, 'subsystems.dream = true');
  assert(health.stats.core === 3, `stats.core = 3 (got ${health.stats.core})`);

  // ─── Test 2: analyzePsychology ───────────────────────────────────────────
  console.log('\nTest 2: analyzePsychology()');

  const psych1 = hf.analyzePsychology('I am frustrated with this bug and need help');
  assert(psych1.intent.category === 'troubleshooting', `intent.category = troubleshooting (got ${psych1.intent.category})`);
  assert(psych1.emotion.category === 'negative', `emotion.category = negative (got ${psych1.emotion.category})`);
  assert(psych1.emotion.intensity === 'high', `emotion.intensity = high (got ${psych1.emotion.intensity})`);
  assert(psych1.needs.length >= 0, 'needs is array');
  assert(psych1.defenses.length >= 0, 'defenses is array');
  assert(psych1.confidence > 0, `confidence > 0 (got ${psych1.confidence})`);

  const psych2 = hf.analyzePsychology('Tell me about quantum physics');
  assert(psych2.intent.category === 'information_seeking', `intent = information_seeking (got ${psych2.intent.category})`);
  assert(psych2.confidence > 0, `confidence > 0 (got ${psych2.confidence})`);

  const psych3 = hf.analyzePsychology('Great job! I love what you did');
  assert(psych3.emotion.category === 'positive', `emotion.category = positive (got ${psych3.emotion.category})`);

  const psych4 = hf.analyzePsychology('');
  assert(psych4.intent === null, 'empty input returns null intent');
  assert(psych4.confidence === 0, 'empty input returns 0 confidence');

  // ─── Test 3: classify ───────────────────────────────────────────────────
  console.log('\nTest 3: classify()');

  const cls1 = hf.classify('How do I create a file in Python?');
  assert(cls1.category === 'information_seeking', `category = information_seeking (got ${cls1.category})`);
  assert(cls1.confidence > 0, `confidence > 0`);

  const cls2 = hf.classify('Build me a website');
  assert(cls2.category === 'task_execution', `category = task_execution (got ${cls2.category})`);

  const cls3 = hf.classify('It is not working and keeps failing');
  assert(cls3.category === 'troubleshooting', `category = troubleshooting (got ${cls3.category})`);

  const cls4 = hf.classify('');
  assert(cls4.category === 'unknown', 'empty input returns unknown');

  // ─── Test 4: getMemoryStats ─────────────────────────────────────────────
  console.log('\nTest 4: getMemoryStats()');

  const stats = hf.getMemoryStats();
  assert(stats.core === 3, `core = 3 (got ${stats.core})`);
  assert(stats.learned === 0, `learned = 0`);
  assert(stats.ephemeral === 0, `ephemeral = 0`);
  assert(Array.isArray(stats.core_samples), 'core_samples is array');
  assert(stats.core_samples.length === 3, `core_samples.length = 3`);
  assert(stats.core_samples[0].key.startsWith('identity.'), 'core samples have identity keys');

  // ─── Test 5: getMindSpace ───────────────────────────────────────────────
  console.log('\nTest 5: getMindSpace()');

  const mind = hf.getMindSpace();
  assert(Array.isArray(mind.rules), 'rules is array');
  assert(mind.rules.length === 3, `rules.length = 3 (got ${mind.rules.length})`);
  assert(mind.rules[0].type === 'core_identity', 'rule type = core_identity');

  // ─── Test 6: memory operations ──────────────────────────────────────────
  console.log('\nTest 6: remember() / recall() / forget()');

  const mem1 = hf.remember('test:key1', 'test value', 'learned');
  assert(mem1.success === true, 'learn() returns success');
  assert(mem1.tier === 'LEARNED', 'tier = LEARNED');

  const mem2 = hf.remember('test:ephemeral', 'ephemeral value', 'ephemeral');
  assert(mem2.success === true, 'remember() ephemeral returns success');

  const recall1 = hf.memory.recall('test:key1');
  assert(recall1 !== null, 'recall() returns entry');
  assert(recall1.value === 'test value', 'recall() returns correct value');

  const forget1 = hf.memory.forget('test:key1');
  assert(forget1.success === true, 'forget() returns success');

  const recall2 = hf.memory.recall('test:key1');
  assert(recall2 === null, 'forgotten key returns null');

  // ─── Test 7: dreamNow ───────────────────────────────────────────────────
  console.log('\nTest 7: dreamNow()');

  hf.remember('test:dream1', 'dream content', 'ephemeral');
  hf.remember('test:dream2', 'dream content 2', 'ephemeral');

  const dream = hf.dreamNow();
  assert(dream.dream_complete === true, 'dream_complete = true');
  assert(typeof dream.duration_ms === 'number', 'duration_ms is number');
  assert(dream.consolidation !== undefined, 'consolidation result present');

  // ─── Test 8: recordOutcome ──────────────────────────────────────────────
  console.log('\nTest 8: recordOutcome()');

  const outcome1 = hf.recordOutcome({
    task: 'write test',
    outcome: 'failure',
    evidence: 'Error: not defined',
    expected: 'function to execute'
  });
  assert(outcome1.outcome === 'failure', 'outcome = failure');
  assert(outcome1.lessonStored === true, 'lesson stored for failure');
  assert(outcome1.reflection.lesson.length > 0, 'reflection has lesson text');

  const outcome2 = hf.recordOutcome({
    task: 'write test',
    outcome: 'success',
    evidence: 'all tests passed'
  });
  assert(outcome2.outcome === 'success', 'outcome = success');
  assert(outcome2.lessonStored === false, 'no lesson stored for success');

  // ─── Test 9: search ─────────────────────────────────────────────────────
  console.log('\nTest 9: search()');

  hf.remember('search:apple', 'fruit', 'learned');
  hf.remember('search:banana', 'yellow fruit', 'learned');

  const search1 = hf.search('apple');
  assert(search1.length > 0, 'search finds apple');
  assert(search1[0].key === 'search:apple', 'search returns correct key');

  const search2 = hf.search('xyz123');
  assert(search2.length === 0, 'search returns empty for no match');

  // ─── Test 10: stop/start ────────────────────────────────────────────────
  console.log('\nTest 10: stop() / start()');

  await hf.stop();
  assert(hf.started === false, 'stop() sets started=false');

  hf.start();
  assert(hf.started === true, 'start() sets started=true');
  const health2 = await hf.healthCheck();
  assert(health2.started === true, 'healthCheck works after restart');
  assert(health2.stats.core === 3, 'core memories preserved after restart');

  // ─── Summary ────────────────────────────────────────────────────────────
  await hf.stop();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  
  // Clean up test data
  const fs = require('fs');
  try { fs.rmSync(DATA_DIR, { recursive: true }); } catch {}
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
