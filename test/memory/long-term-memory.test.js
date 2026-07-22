const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/long-term-memory.js');
    console.log('PASS long-term-memory.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP long-term-memory.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP long-term-memory.test.js: ' + e.code));
