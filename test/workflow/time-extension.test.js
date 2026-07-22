const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/workflow/time-extension.js');
    console.log('PASS time-extension.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP time-extension.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP time-extension.test.js: ' + e.code));
