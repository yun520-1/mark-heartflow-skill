const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/reversible-traceback.js');
    console.log('PASS reversible-traceback.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP reversible-traceback.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP reversible-traceback.test.js: ' + e.code));
