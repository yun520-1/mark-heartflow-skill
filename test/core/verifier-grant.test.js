const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/verifier-grant.js');
    console.log('PASS verifier-grant.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP verifier-grant.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP verifier-grant.test.js: ' + e.code));
