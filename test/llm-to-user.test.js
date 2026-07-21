/**
 * LLMToUser 测试 — 补齐 bridge 层无测试覆盖（心虫自检 untestedModules）
 * 验证 LLM 输出→用户语言的转换。translate 返回 {text, compression, removedSections, preserved}。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { LLMToUser } = require('../src/bridge/llm-to-user.js');
  console.log('  🔗 LLMToUser (llm-to-user.js)');

  test('构造不抛', () => {
    const t = new LLMToUser();
    assertTrue(t instanceof LLMToUser);
  });

  test('空输出返回结构化结果不抛', () => {
    const t = new LLMToUser();
    const out = t.translate('', {});
    assertTrue(typeof out === 'object');
    assertEqual(out.text, '');
  });

  test('自我介绍被检测并移除(removedSections 含 self_intro)', () => {
    const t = new LLMToUser();
    const out = t.translate('我是AI助手，很高兴为您服务。以下是答案。', {});
    assertTrue(typeof out === 'object');
    const hasSelfIntro = (out.removedSections || []).some(s => s.type === 'self_intro');
    assertTrue(hasSelfIntro);
    assertFalse(out.text.includes('我是AI助手'));
  });

  test('正常内容保留核心且 preserved=true', () => {
    const t = new LLMToUser();
    const out = t.translate('心虫是一个认知引擎，具备自我纠错能力。', {});
    assertTrue(out.text.length > 0);
    assertTrue(out.text.includes('心虫'));
    assertTrue(out.preserved === true);
  });

  test('返回 compression 为 0~1 数值', () => {
    const t = new LLMToUser();
    const out = t.translate('一段普通回复文本', {});
    assertTrue(typeof out.compression === 'number' && out.compression >= 0 && out.compression <= 1);
  });
};
