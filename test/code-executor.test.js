// 代码执行器 (code-executor.js) 安全纯函数测试 — 审计覆盖率补充
const assert = require('assert');
const CE = require('../src/code/code-executor.js');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

// ─── detectLanguage ───────────────────────────────────────────────
ok('detectLanguage: 空输入回退 javascript', () => {
  assert.strictEqual(CE.detectLanguage(''), 'javascript');
  assert.strictEqual(CE.detectLanguage(null), 'javascript');
  assert.strictEqual(CE.detectLanguage(undefined), 'javascript');
});

ok('detectLanguage: Python shebang (env & bin)', () => {
  assert.strictEqual(CE.detectLanguage('#!/usr/bin/env python\nprint(1)'), 'python');
  assert.strictEqual(CE.detectLanguage('#!/usr/bin/python\nprint(1)'), 'python');
});

ok('detectLanguage: Python 关键字', () => {
  assert.strictEqual(CE.detectLanguage('import os\ndef main(): pass'), 'python');
});

ok('detectLanguage: Shell 命令', () => {
  assert.strictEqual(CE.detectLanguage('echo hello'), 'shell');
  assert.strictEqual(CE.detectLanguage('ls -la'), 'shell');
});

ok('detectLanguage: 默认 javascript', () => {
  assert.strictEqual(CE.detectLanguage('const x = 1;'), 'javascript');
});

// ─── checkDangerousCommand ────────────────────────────────────────
ok('checkDangerousCommand: 安全命令通过', () => {
  const r = CE.checkDangerousCommand('ls -la');
  assert.strictEqual(r.dangerous, false);
  assert.strictEqual(r.reason, null);
});

ok('checkDangerousCommand: 危险命令被拦', () => {
  const r = CE.checkDangerousCommand('rm -rf /');
  assert.strictEqual(r.dangerous, true);
  assert.ok(typeof r.reason === 'string');
});

ok('checkDangerousCommand: 非字符串不崩溃', () => {
  assert.doesNotThrow(() => CE.checkDangerousCommand(null));
});

// ─── checkSandboxRestrictions ─────────────────────────────────────
ok('checkSandboxRestrictions: 普通代码不拦截', () => {
  const r = CE.checkSandboxRestrictions('console.log(1)');
  assert.strictEqual(r.blocked, false);
});

ok('checkSandboxRestrictions: 非字符串不崩溃', () => {
  assert.doesNotThrow(() => CE.checkSandboxRestrictions(undefined));
});

// ─── truncateOutput ───────────────────────────────────────────────
ok('truncateOutput: 短字符串原样返回', () => {
  assert.strictEqual(CE.truncateOutput('hello'), 'hello');
});

ok('truncateOutput: 长字符串截断', () => {
  const long = 'x'.repeat(20000);
  const r = CE.truncateOutput(long);
  assert.ok(r.length < 20000);
  assert.ok(r.includes('输出截断'));
});

ok('truncateOutput: 非字符串转字符串', () => {
  assert.doesNotThrow(() => CE.truncateOutput(12345));
});

// ─── validateArg ──────────────────────────────────────────────────
ok('validateArg: 合法值通过', () => {
  assert.doesNotThrow(() => CE.validateArg('test', 'name', 'string'));
});

ok('validateArg: 必填缺失抛错', () => {
  assert.throws(() => CE.validateArg(undefined, 'name', 'string', true));
});

// ─── validateShellCommand ─────────────────────────────────────────
ok('validateShellCommand: 空输入返回错误', () => {
  const r = CE.validateShellCommand('');
  assert.ok(r && typeof r === 'object');
});

ok('validateShellCommand: 非字符串不崩溃', () => {
  assert.doesNotThrow(() => CE.validateShellCommand(null));
});

console.log(`\ncode-executor: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
