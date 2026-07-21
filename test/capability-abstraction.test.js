/**
 * capability-abstraction.test.js — 心虫自主升级补的 TDD
 * 来源: SelfScanner 扫出 src/core/capability-abstraction.js 未测试 (untestedModules)
 * 原则: 测平台无关的逻辑验证入口, 不侵入业务代码
 * 格式: 兼容 test/run-all.js — module.exports = fn(ctx), ctx 由 runner 注入
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { CapabilityAbstraction, createAdapter } = require('../src/core/capability-abstraction.js');

  test('CapabilityAbstraction._logicVerify: 合法对象返回 verified:true', () => {
    const ca = new CapabilityAbstraction();
    const r = ca._logicVerify({ statement: 'x', evidence: 'y' });
    assertTrue(typeof r === 'object', '应返回对象');
    assertEqual(r.verified, true, '合法输入 verified 应为 true');
    assertTrue(typeof r.confidence === 'number', 'confidence 应为数字');
  });

  test('CapabilityAbstraction._logicVerify: 非对象输入返回 verified:false', () => {
    const ca = new CapabilityAbstraction();
    const r = ca._logicVerify(null);
    assertEqual(r.verified, false, '非对象 verified 应为 false');
    const hasIssue = r.issues.some(i => i.type === 'invalid_input');
    assertTrue(hasIssue, '应报 invalid_input');
  });

  test('CapabilityAbstraction._logicVerify: 有陈述无证据返回 missing_evidence', () => {
    const ca = new CapabilityAbstraction();
    const r = ca._logicVerify({ statement: '某结论' });
    const hasIssue = r.issues.some(i => i.type === 'missing_evidence');
    assertTrue(hasIssue, '应报 missing_evidence');
  });

  test('createAdapter: 返回实现接口的适配器', () => {
    const a = createAdapter('hermes');
    assertDefined(a, '适配器应存在');
    // 适配器实际接口: sendMessage/readFile/writeFile/executeCode/receiveInput
    assertDefined(a.sendMessage, '适配器应有 sendMessage 方法');
    assertTrue(typeof a.sendMessage === 'function', 'sendMessage 应为函数');
  });
};
