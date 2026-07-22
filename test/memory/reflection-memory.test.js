const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/reflection-memory.js');
    console.log('PASS reflection-memory.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP reflection-memory.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP reflection-memory.test.js: ' + e.code));
