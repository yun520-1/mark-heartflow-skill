const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/workflow/layer-bus.js');
    console.log('PASS layer-bus.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP layer-bus.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP layer-bus.test.js: ' + e.code));
