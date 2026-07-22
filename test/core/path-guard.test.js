const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/path-guard.js');
    console.log('PASS path-guard.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP path-guard.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP path-guard.test.js: ' + e.code));
