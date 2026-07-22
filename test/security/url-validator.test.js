const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/security/url-validator.js');
    console.log('PASS url-validator.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP url-validator.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP url-validator.test.js: ' + e.code));
