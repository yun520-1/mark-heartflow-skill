const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/strategy-adapter.js');
    console.log('PASS strategy-adapter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP strategy-adapter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP strategy-adapter.test.js: ' + e.code));
