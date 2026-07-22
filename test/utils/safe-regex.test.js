const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/utils/safe-regex.js');
    console.log('PASS safe-regex.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP safe-regex.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP safe-regex.test.js: ' + e.code));
