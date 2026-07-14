#!/usr/bin/env node
/** test/reflection-loop.test.js */
const { ReflectionLoop, ReflectionHealth } = require('../src/cortex/reflection-loop.js');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== ReflectionLoop 单元测试 ===\n');

const root = '/tmp/hf-test-reflection';
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(path.join(root, '.opencode', 'memory'), { recursive: true });

const loop = new ReflectionLoop(root);
assert(loop, 'ReflectionLoop 实例化');
assert(loop.reflectionLog && Array.isArray(loop.reflectionLog), 'reflectionLog 初始化');

const before = loop.reflectBeforeSpeaking('你好，今天过得怎么样？', { intent: 'recognition' });
Promise.resolve(before).then(b => {
  assert(b && Array.isArray(b.insights), 'reflectBeforeSpeaking 返回 insights');
  assert(b.wasModified === false, '自省不修改草稿: wasModified=false');

  const after = loop.monitorAfterSpeaking('谢谢你的关心', { userEmotion: 'happy' });
  Promise.resolve(after).then(a => {
    assert(a && a.effectiveness, 'monitorAfterSpeaking 返回 effectiveness');

    const health = loop.getHealthReport();
    assert(health && health.health === ReflectionHealth.HEALTHY, '健康状态初始 healthy');

    loop.clearLog();
    assert(loop.reflectionLog.length === 0, 'clearLog 清空日志');

    console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    process.exit(failed > 0 ? 1 : 0);
  }).catch(e => {
    console.error('FAIL: monitorAfterSpeaking promise failed:', e.message);
    console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
    process.exit(1);
  });
}).catch(e => {
  console.error('FAIL: reflectBeforeSpeaking promise failed:', e.message);
  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  process.exit(1);
});
