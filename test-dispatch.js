#!/usr/bin/env node
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow();
hf.start();

const tests = [
  ['truth.checkStatement', ['中国首都是北京']],
  ['truth.checkStatement', ['地球是平的']],
  ['truth.checkNumbers', ['中国有14亿人口']],
  ['emotion.process', ['我今天很高兴']],
  ['psychology.analyzePsychology', ['我感到焦虑']],
  ['lesson.getTopLessons', [3]],
  ['heartLogic.whatIsThis', ['帮助']],
  ['restraint.shouldIntervene', ['用户问如何伤害自己']],
  ['evolution.evolve', ['测试主题', { source: 'test' }]],
  ['decision.decide', [{ options: ['A', 'B'] }]],
];

let passed = 0, failed = 0;
for (const [route, args] of tests) {
  try {
    const r = hf.dispatch(route, ...args);
    const status = JSON.stringify(r).slice(0, 80);
    console.log('OK:', route, '→', status);
    passed++;
  } catch(e) {
    console.log('FAIL:', route, '→', e.message.slice(0, 80));
    failed++;
  }
}

console.log(`\n结果: ${passed}/${passed+failed} 通过`);
// 强制退出
setTimeout(() => process.exit(0), 100);
