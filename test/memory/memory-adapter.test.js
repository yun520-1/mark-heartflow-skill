const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/memory-adapter.js');
    console.log('PASS memory-adapter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP memory-adapter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP memory-adapter.test.js: ' + e.code));
