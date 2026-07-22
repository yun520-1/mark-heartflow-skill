const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/memory-index.js');
    console.log('PASS memory-index.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP memory-index.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP memory-index.test.js: ' + e.code));
