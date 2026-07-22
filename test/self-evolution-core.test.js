const assert = require('assert');

async function run() {
  const { SelfEvolutionCore } = require('../src/cortex/self-evolution/self-evolution-core.js');
  const core = new SelfEvolutionCore(process.cwd());

  // Test 1: learn() returns structure
  const learning = await core.learn('self-upgrade test');
  assert.ok(typeof learning.summary === 'string', 'summary should be string');
  assert.ok(learning.weaknesses !== undefined, 'weaknesses should exist');

  // Test 2: weaknesses contains todoCount and untestedCount
  assert.ok(typeof learning.weaknesses.todoCount === 'number', 'todoCount should be number');
  assert.ok(Array.isArray(learning.weaknesses.untestedModules), 'untestedModules should be array');

  // Test 3: arxivGaps behavior (null or skipped when disabled)
  assert.ok(learning.arxivGaps === null || learning.arxivGaps.skipped, 'arxivGaps should be null or skipped');

  console.log('PASS self-evolution-core.test.js (3 cases)');
}
run().catch(e => { console.error('FAIL:', e); process.exit(1); });
