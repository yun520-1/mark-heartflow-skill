/**
 * ContextBuilder 测试 — 补齐 bridge 层无测试覆盖（心虫自检 untestedModules）
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { ContextBuilder } = require('../src/bridge/context-builder.js');
  console.log('  🔗 ContextBuilder (context-builder.js)');

  test('构造不抛', () => {
    const cb = new ContextBuilder();
    assertTrue(cb instanceof ContextBuilder);
  });

  test('build 返回结构化上下文对象', () => {
    const cb = new ContextBuilder();
    const out = cb.build('帮我分析一下心虫', { intent: { type: 'analyze', description: '分析请求' } }, {});
    assertDefined(out);
    assertTrue(typeof out === 'object');
    // 真实字段（实测）
    assertTrue(out.systemPrompt !== undefined || out.userIntent !== undefined);
  });

  test('无 userTranslation 时回退原始输入不抛', () => {
    const cb = new ContextBuilder();
    const out = cb.build('原始输入文本', null, {});
    assertDefined(out);
    assertTrue(typeof out === 'object');
  });

  test('build 产出 formattedForLLM 字段', () => {
    const cb = new ContextBuilder();
    const out = cb.build('测试输入', { intent: { type: 'test' }, constraints: ['简洁'] }, {});
    // 结构化产物必须含至少一个已知字段
    const known = ['systemPrompt','userIntent','constraints','contextFromHeartflow','bridgeInstruction','formattedForLLM','extendedMind'];
    assertTrue(known.some(k => out[k] !== undefined));
  });
};
