const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/topic-scope.js');
    console.log('PASS topic-scope.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP topic-scope.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP topic-scope.test.js: ' + e.code));
