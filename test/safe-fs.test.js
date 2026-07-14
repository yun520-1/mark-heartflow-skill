#!/usr/bin/env node
/** test/safe-fs.test.js */
const fs = require('fs');
const path = require('path');
const { safeWriteFileSync, safeAppendFileSync, guardPath } = require('../src/utils/safe-fs.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== SafeFS / AsyncFSAdapter 回归测试 ===\n');

const tmpDir = '/tmp/hf-test-safe-fs';
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

const filePath = path.join(tmpDir, 'test.txt');
safeWriteFileSync(filePath, 'hello');
assert(fs.existsSync(filePath), 'safeWriteFileSync 写入成功');
assert(fs.readFileSync(filePath, 'utf8') === 'hello', 'safeWriteFileSync 内容正确');

safeAppendFileSync(filePath, ' world');
assert(fs.readFileSync(filePath, 'utf8') === 'hello world', 'safeAppendFileSync 追加成功');

const guarded = guardPath(filePath);
assert(guarded && typeof guarded.safe === 'boolean', 'guardPath 返回 safe 字段');

const outside = guardPath('/etc/test.txt');
assert(outside.safe === false, 'guardPath 拒绝项目外路径');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
