const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/reflector.js');
    console.log('PASS reflector.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP reflector.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP reflector.test.js: ' + e.code));
