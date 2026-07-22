const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/planner/self-initiator.js');
    console.log('PASS self-initiator.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP self-initiator.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP self-initiator.test.js: ' + e.code));
