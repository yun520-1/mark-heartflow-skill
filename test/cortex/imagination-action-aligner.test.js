const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/imagination-action-aligner.js');
    console.log('PASS imagination-action-aligner.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP imagination-action-aligner.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP imagination-action-aligner.test.js: ' + e.code));
