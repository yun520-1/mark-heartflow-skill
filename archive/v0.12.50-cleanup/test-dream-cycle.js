
const { runDreamCycle } = require('./heartflow-engine.js');
const memories = [
  { text: 'do not confuse historical version with current version' },
  { text: 'dream should reorganize memory fragments into candidate upgrades' },
  { text: 'runtime logic errors must be reduced' },
  { text: 'old bug patterns should be corrected after waking' },
  { text: 'use startup self-check before acting' }
];
const result = runDreamCycle(memories, { limit: 5 });
console.log(JSON.stringify(result, null, 2));
