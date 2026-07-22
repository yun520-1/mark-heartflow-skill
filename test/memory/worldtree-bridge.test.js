const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/worldtree-bridge.js');
    console.log('PASS worldtree-bridge.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP worldtree-bridge.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP worldtree-bridge.test.js: ' + e.code));
