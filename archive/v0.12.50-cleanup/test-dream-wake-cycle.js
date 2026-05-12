
const { runDreamCycle, runWakeUpVerification } = require('./heartflow-engine.js');
const memories = [
  { text: 'do not confuse historical version with current version' },
  { text: 'dream should reorganize memory fragments into candidate upgrades' },
  { text: 'runtime logic errors must be reduced' },
  { text: 'old bug patterns should be corrected after waking' },
  { text: 'use startup self-check before acting' }
];
const dream = runDreamCycle(memories, { limit: 5 });
const wake = runWakeUpVerification(dream.dream || dream);
console.log(JSON.stringify({ dream, wake }, null, 2));
