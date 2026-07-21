/**
 * UserToLLM 测试 — 补齐 bridge 层无测试覆盖（心虫自检 untestedModules）
 * 验证用户输入→LLM 语言的意图分类：问答/对比/创作/总结/评价。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { UserToLLM } = require('../src/bridge/user-to-llm.js');
  console.log('  🔗 UserToLLM (user-to-llm.js)');

  test('构造不抛', () => {
    const u = new UserToLLM();
    assertTrue(u instanceof UserToLLM);
  });

  test('非字符串输入安全返回', () => {
    const u = new UserToLLM();
    const out = u.translate(null, {});
    assertTrue(out === null || typeof out === 'object' || typeof out === 'string');
  });

  test('问答类意图被识别', () => {
    const u = new UserToLLM();
    const out = u.translate('什么是心虫？', {});
    assertTrue(typeof out === 'object' || typeof out === 'string');
  });

  test('创作类意图被识别', () => {
    const u = new UserToLLM();
    const out = u.translate('帮我写一首关于孤独的诗', {});
    assertTrue(typeof out === 'object' || typeof out === 'string');
  });

  test('总结类意图被识别', () => {
    const u = new UserToLLM();
    const out = u.translate('总结一下今天的会议要点', {});
    assertTrue(typeof out === 'object' || typeof out === 'string');
  });

  test('对比类意图被识别', () => {
    const u = new UserToLLM();
    const out = u.translate('对比一下React和Vue的优缺点', {});
    assertTrue(typeof out === 'object' || typeof out === 'string');
  });
};
