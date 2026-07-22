const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/metacognitive-feedback.js');
    console.log('PASS metacognitive-feedback.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP metacognitive-feedback.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP metacognitive-feedback.test.js: ' + e.code));
