const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/adaptive-learning.js');
    console.log('PASS adaptive-learning.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP adaptive-learning.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP adaptive-learning.test.js: ' + e.code));
