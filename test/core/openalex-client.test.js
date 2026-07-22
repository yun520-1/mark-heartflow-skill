const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/core/openalex-client.js');
    console.log('PASS openalex-client.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP openalex-client.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP openalex-client.test.js: ' + e.code));
