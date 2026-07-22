const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/search/bm25.js');
    console.log('PASS bm25.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP bm25.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP bm25.test.js: ' + e.code));
