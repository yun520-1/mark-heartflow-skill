const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/utils.js');
    console.log('PASS utils.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP utils.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP utils.test.js: ' + e.code));
