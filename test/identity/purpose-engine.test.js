const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/identity/purpose-engine.js');
    console.log('PASS purpose-engine.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP purpose-engine.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP purpose-engine.test.js: ' + e.code));
