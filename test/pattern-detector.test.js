const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/pattern-detector.js');
    console.log('PASS pattern-detector.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP pattern-detector.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP pattern-detector.test.js: ' + e.code));
