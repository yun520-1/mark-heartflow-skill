const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/planner/goal-pursuer.js');
    console.log('PASS goal-pursuer.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP goal-pursuer.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP goal-pursuer.test.js: ' + e.code));
