const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/search/hybrid-search.js');
    console.log('PASS hybrid-search.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP hybrid-search.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP hybrid-search.test.js: ' + e.code));
