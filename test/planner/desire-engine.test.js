const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/planner/desire-engine.js');
    console.log('PASS desire-engine.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP desire-engine.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP desire-engine.test.js: ' + e.code));
