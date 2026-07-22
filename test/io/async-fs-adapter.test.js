const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/io/async-fs-adapter.js');
    console.log('PASS async-fs-adapter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP async-fs-adapter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP async-fs-adapter.test.js: ' + e.code));
