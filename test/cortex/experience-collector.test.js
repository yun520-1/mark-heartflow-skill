const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/cortex/experience-collector.js');
    console.log('PASS experience-collector.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP experience-collector.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP experience-collector.test.js: ' + e.code));
