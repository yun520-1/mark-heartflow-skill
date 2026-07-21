/**
 * 心虫自主升级补的 TDD (multi-agent-dialogue, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { MultiAgentDialogue } = require('../src/consciousness/multi-agent-dialogue.js');
  test('MultiAgentDialogue 可实例化且含 dialogue/getStats', () => {
    const d = new MultiAgentDialogue();
    assertDefined(d, '实例应存在');
    assertTrue(typeof d.dialogue === 'function', 'dialogue 应为函数');
    assertTrue(typeof d.getStats === 'function', 'getStats 应为函数');
  });
  test('MultiAgentDialogue.registerAgent + getStats 不抛', () => {
    const d = new MultiAgentDialogue();
    d.registerAgent('a1', { role: 'tester' });
    const s = d.getStats();
    assertTrue(typeof s === 'object', 'getStats 应返回对象');
  });
};
