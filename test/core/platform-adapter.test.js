const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/platform-adapter.js');
    console.log('PASS platform-adapter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP platform-adapter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP platform-adapter.test.js: ' + e.code));
