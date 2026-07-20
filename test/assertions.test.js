/**
 * assertions.js TDD 测试
 * 验证：HeartFlow 断言库核心方法（补 20 个未测试模块的缺口之一）
 */
function run({ test, assertEqual, assertTrue, assertFalse }) {
  const { assert } = require('../src/core/assertions.js');

  test('isEqual 相等返回 ok', () => {
    const r = assert.deepEqual(1, 1);
    assertTrue(r.ok);
  });

  test('isEqual 不等返回失败', () => {
    const r = assert.deepEqual(1, 2);
    assertFalse(r.ok);
    assertTrue(typeof r.error === 'string');
  });

  test('isString 类型判断', () => {
    assertTrue(assert.isString('x').ok);
    assertFalse(assert.isString(1).ok);
  });

  test('isNumber 类型判断', () => {
    assertTrue(assert.isNumber(42).ok);
    assertFalse(assert.isNumber('42').ok);
  });

  test('throws 捕获异常', () => {
    const r = assert.throws(() => { throw new Error('x'); });
    assertTrue(r.ok);
  });

  test('throws 无异常则失败', () => {
    const r = assert.throws(() => { /* 不抛 */ });
    assertFalse(r.ok);
  });

  test('expect().toBe() 链式', () => {
    assertTrue(assert.expect(1).toBe(1).ok);
    assertFalse(assert.expect(1).toBe(2).ok);
  });

  test('getReport 统计计数', () => {
    assert.resetCounts();
    assert.deepEqual(1, 1);
    assert.deepEqual(1, 2);
    const report = assert.getReport();
    assertEqual(report.total, 2);
    assertEqual(report.passed, 1);
    assertEqual(report.failed, 1);
  });

  test('resetCounts 清零', () => {
    assert.deepEqual(1, 1);
    assert.resetCounts();
    const report = assert.getReport();
    assertEqual(report.total, 0);
  });
}

module.exports = run;
