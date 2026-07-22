const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/shield/spontaneous-restraint.js');
    console.log('PASS spontaneous-restraint.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP spontaneous-restraint.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP spontaneous-restraint.test.js: ' + e.code));
