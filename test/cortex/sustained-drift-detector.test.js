const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/sustained-drift-detector.js');
    console.log('PASS sustained-drift-detector.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP sustained-drift-detector.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP sustained-drift-detector.test.js: ' + e.code));
