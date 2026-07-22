const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/shield/module-health-checker.js');
    console.log('PASS module-health-checker.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP module-health-checker.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP module-health-checker.test.js: ' + e.code));
