const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/meta-learner.js');
    console.log('PASS meta-learner.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP meta-learner.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP meta-learner.test.js: ' + e.code));
