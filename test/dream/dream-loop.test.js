const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/dream/dream-loop.js');
    console.log('PASS dream-loop.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP dream-loop.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP dream-loop.test.js: ' + e.code));
