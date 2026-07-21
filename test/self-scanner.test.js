/**
 * SelfScanner 测试 — 验证弱点扫描维度完整（心虫自检能力的回归保护）
 * 重点：bypassCount 维度(v6.0.57 新增)必须存在且能正确计数裸 fetch 旁路。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {

  const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
  const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

  console.log('  🔍 SelfScanner (self-scanner.js)');

  test('scan 返回结构化弱点对象', () => {
    const s = new SelfScanner(ROOT);
    const r = s.scan();
    assertDefined(r.todoCount);
    assertDefined(r.untestedModules);
    assertDefined(r.bypassCount);      // [v6.0.57] 必须存在
    assertDefined(r.bypassFiles);
  });

  test('bypassCount 为非负整数', () => {
    const s = new SelfScanner(ROOT);
    const r = s.scan();
    assertTrue(typeof r.bypassCount === 'number' && r.bypassCount >= 0);
  });

  test('当前全库裸 fetch 已清零(bypassCount===0)', () => {
    const s = new SelfScanner(ROOT);
    const r = s.scan();
    // 本轮已把所有出网请求收口 safeFetch，裸 fetch 旁路应为 0
    assertEqual(r.bypassCount, 0);
  });

  test('todoCount 为数字', () => {
    const s = new SelfScanner(ROOT);
    const r = s.scan();
    assertTrue(typeof r.todoCount === 'number');
  });

};
