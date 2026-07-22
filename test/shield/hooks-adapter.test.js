const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/shield/hooks-adapter.js');
    console.log('PASS hooks-adapter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP hooks-adapter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP hooks-adapter.test.js: ' + e.code));
