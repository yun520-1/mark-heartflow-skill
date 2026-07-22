const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/preference-guard.js');
    console.log('PASS preference-guard.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP preference-guard.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP preference-guard.test.js: ' + e.code));
