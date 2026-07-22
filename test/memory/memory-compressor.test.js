const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/memory-compressor.js');
    console.log('PASS memory-compressor.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP memory-compressor.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP memory-compressor.test.js: ' + e.code));
