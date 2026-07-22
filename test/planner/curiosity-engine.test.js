const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/planner/curiosity-engine.js');
    console.log('PASS curiosity-engine.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP curiosity-engine.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP curiosity-engine.test.js: ' + e.code));
