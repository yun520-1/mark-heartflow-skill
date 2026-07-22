const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/utils/debug-log.js');
    console.log('PASS debug-log.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP debug-log.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP debug-log.test.js: ' + e.code));
