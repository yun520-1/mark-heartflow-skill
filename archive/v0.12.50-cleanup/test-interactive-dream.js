
const { runInteractiveDream } = require('./heartflow-engine.js');
const memory = [
  { text: 'startup self-check before acting' },
  { text: 'dream should reorganize memory fragments into candidate upgrades' },
  { text: 'do not confuse historical version with current version' },
  { text: 'runtime logic errors must be reduced' }
];
const result = runInteractiveDream(memory, [
  '减少逻辑错误',
  '历史版本混淆太多',
  '先接入用户反馈'
]);
console.log(JSON.stringify(result, null, 2));
