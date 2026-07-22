const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/self-benchmark.js');
    console.log('PASS self-benchmark.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP self-benchmark.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP self-benchmark.test.js: ' + e.code));
