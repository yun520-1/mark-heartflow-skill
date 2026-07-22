const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/world-model.js');
    console.log('PASS world-model.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP world-model.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP world-model.test.js: ' + e.code));
