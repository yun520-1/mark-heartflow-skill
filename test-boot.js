#!/usr/bin/env node
// 心虫启动诊断脚本
const { HeartFlow } = require('./src/core/heartflow.js');

const t = Date.now();
const log = (...args) => console.log(`${Date.now()-t}ms:`, ...args);

log('=== 心虫诊断开始 ===');

try {
  log('1. new HeartFlow()');
  const hf = new HeartFlow();
  log('   OK - started:', hf.started);

  log('2. hf.start() 调用');
  // 不等待，直接检查
  const startResult = hf.start();
  log('   start() returned:', startResult);
  log('   started after return:', hf.started);
  log('   _modules count:', Object.keys(hf._modules || {}).length);
  log('   sessionId:', hf.sessionId);

  log('3. routes()');
  try {
    const routes = hf.routes();
    log('   routes count:', Object.keys(routes).length);
  } catch(e) {
    log('   routes ERROR:', e.message);
  }

  log('=== 诊断结束 ===');
} catch(e) {
  log('FATAL:', e.message);
  log(e.stack);
}
