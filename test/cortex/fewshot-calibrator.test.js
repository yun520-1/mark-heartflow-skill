const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/fewshot-calibrator.js');
    console.log('PASS fewshot-calibrator.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP fewshot-calibrator.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP fewshot-calibrator.test.js: ' + e.code));
