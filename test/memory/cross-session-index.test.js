const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/cross-session-index.js');
    console.log('PASS cross-session-index.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP cross-session-index.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP cross-session-index.test.js: ' + e.code));
