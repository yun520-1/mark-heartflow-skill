/**
 * atomic-write.js TDD 测试
 * 验证：原子写入工具核心方法（补 20 个未测试模块的缺口之一）
 * 覆盖：classifyError / getRetryDelay / verifyWrite / atomicWrite / atomicWriteJson 往返
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

function run({ test, assertEqual, assertTrue, assertFalse }) {
  const aw = require('../src/utils/atomic-write.js');

  test('classifyError 区分错误类型', () => {
    const eperm = aw.classifyError(Object.assign(new Error('perm'), { code: 'EPERM' }));
    assertEqual(eperm, aw.ErrorType.PERMISSION_ERROR);
    const enoent = aw.classifyError(Object.assign(new Error('noent'), { code: 'ENOENT' }));
    assertEqual(enoent, aw.ErrorType.DIRECTORY_ERROR);
    const unknown = aw.classifyError(new Error('weird-out-of-band'));
    assertEqual(unknown, aw.ErrorType.UNKNOWN);
  });

  test('getRetryDelay 指数退避递增', () => {
    const d1 = aw.getRetryDelay(1);
    const d2 = aw.getRetryDelay(2);
    const d3 = aw.getRetryDelay(3);
    assertTrue(d2 > d1);
    assertTrue(d3 > d2);
    assertTrue(d1 >= 0);
  });

  test('verifyWrite 内容一致返回 true', async () => {
    const f = path.join(os.tmpdir(), 'aw-verify-' + Date.now() + '.txt');
    await aw.atomicWrite(f, 'hello-world');
    const ok = await aw.verifyWrite(f, 'hello-world');
    assertTrue(ok);
    fs.unlinkSync(f);
  });

  test('atomicWrite 写入后文件内容正确', async () => {
    const f = path.join(os.tmpdir(), 'aw-test-' + Date.now() + '.json');
    const res = await aw.atomicWrite(f, '{"a":1}');
    assertTrue(res && (res.ok === true || res.success === true));
    const content = fs.readFileSync(f, 'utf8');
    assertEqual(content, '{"a":1}');
    // 临时文件应被清理（无 .tmp 残留）
    const dir = path.dirname(f);
    const leftovers = fs.readdirSync(dir).filter(x => x.includes(path.basename(f)) && x.endsWith('.tmp'));
    assertEqual(leftovers.length, 0);
    fs.unlinkSync(f);
  });

  test('atomicWriteJson 往返解析一致', async () => {
    const f = path.join(os.tmpdir(), 'aw-json-' + Date.now() + '.json');
    await aw.atomicWriteJson(f, { name: '心虫', n: 42 });
    const back = JSON.parse(fs.readFileSync(f, 'utf8'));
    assertEqual(back.name, '心虫');
    assertEqual(back.n, 42);
    fs.unlinkSync(f);
  });

  test('getStats 返回结构含计数', () => {
    const s = aw.getStats();
    assertTrue(typeof s.total === 'number' || typeof s.writes === 'number' || typeof s.success === 'number');
  });
}

module.exports = run;
