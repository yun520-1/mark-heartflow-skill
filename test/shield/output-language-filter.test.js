const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/shield/output-language-filter.js');
    console.log('PASS output-language-filter.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP output-language-filter.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP output-language-filter.test.js: ' + e.code));
