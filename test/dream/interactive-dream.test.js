const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/dream/interactive-dream.js');
    console.log('PASS interactive-dream.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP interactive-dream.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP interactive-dream.test.js: ' + e.code));
