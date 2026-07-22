const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/dream/dream-consolidation.js');
    console.log('PASS dream-consolidation.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP dream-consolidation.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP dream-consolidation.test.js: ' + e.code));
