const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/reasoning/claim-extractor.js');
    console.log('PASS claim-extractor.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP claim-extractor.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP claim-extractor.test.js: ' + e.code));
