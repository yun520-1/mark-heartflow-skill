#!/usr/bin/env node
/**
 * HeartFlow Demo - 输出到文件用于验证
 */
const fs = require('fs');
const output = [];

function log(msg) {
  console.log(msg);
  output.push(msg);
}

// 尝试加载核心模块
let psychology, heartlogic;
try { psychology = require('./src/core/psychology.js'); log('✅ 心理引擎 loaded'); } catch(e) { log('⚠️  心理引擎: ' + e.message); }
try { heartlogic = require('./src/core/heart-logic.js'); log('✅ HeartLogic loaded'); } catch(e) { log('⚠️  HeartLogic: ' + e.message); }

log('========================================');
log('  HeartFlow Demo - Run at ' + new Date().toISOString());
log('========================================');

if (heartlogic) {
  const hl = new heartlogic.HeartLogic();
  log('isAlive():    ' + hl.isAlive());
  log('isAware():    ' + hl.isAware());
  log('isEvolving(): ' + hl.isEvolving());
  log('version:      ' + (hl.version || 'v1.0+'));
}

if (psychology && psychology.analyzePsychology) {
  log('\n心理分析测试:');
  const r = psychology.analyzePsychology("我最近压力很大");
  log('  结果: ' + JSON.stringify(r).substring(0, 200));
}

fs.writeFileSync('/tmp/heartflow_demo_output.txt', output.join('\n'));
log('\n输出已保存到 /tmp/heartflow_demo_output.txt');
