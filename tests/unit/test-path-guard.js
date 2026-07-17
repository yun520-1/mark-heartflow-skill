// test/core/path-guard.test.js — 路径穿越防护测试
const { guardPath, safeWriteSync, safeReadSync } = require('../../src/core/path-guard.js');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('path-guard tests...');

// 1. 合法路径
const r1 = guardPath('/tmp/test.txt', ['/tmp']);
assert.strictEqual(r1.safe, true, '合法路径应通过');
assert.ok(r1.resolved.startsWith('/tmp'), '合法路径应解析到/tmp');

// 2. 越界路径
const r2 = guardPath('/etc/passwd');
assert.strictEqual(r2.safe, false, '/etc/passwd应被拒绝');
assert.ok(r2.reason.includes('outside allowed roots'), '应提示越界');

// 3. 路径遍历
const r3 = guardPath('../../../etc/shadow');
assert.strictEqual(r3.safe, false, '路径遍历应被拒绝');

// 4. 空输入
const r4 = guardPath('');
assert.strictEqual(r4.safe, false, '空路径应被拒绝');

// 5. safeWriteSync 写入+读取
const tmpFile = '/tmp/heartflow_test_' + Date.now() + '.txt';
safeWriteSync(tmpFile, 'test content', 'utf8', ['/tmp']);
const content = safeReadSync(tmpFile, 'utf8', ['/tmp']);
assert.strictEqual(content, 'test content', '写入和读取应一致');
fs.unlinkSync(tmpFile);

// 6. safeWriteSync 拒绝越界写入
let caught = false;
try {
  safeWriteSync('/etc/should_fail.txt', 'x');
} catch (e) {
  caught = true;
}
assert.strictEqual(caught, true, '越界写入应抛异常');

console.log('path-guard: ALL PASSED ✅');
