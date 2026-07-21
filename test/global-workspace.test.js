/**
 * GlobalWorkspace 测试 — 补齐 consciousness 层无测试覆盖（心虫自检 untestedModules）
 * 该模块是心虫的"全局工作空间"（意识中枢），负责 agent 注册与注意力仲裁。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { GlobalWorkspace } = require('../src/consciousness/global-workspace.js');
  console.log('  🧠 GlobalWorkspace (global-workspace.js)');

  test('构造不抛', () => {
    const ws = new GlobalWorkspace('/root/.hermes/skills/ai/mark-heartflow-skill');
    assertTrue(ws instanceof GlobalWorkspace);
  });

  test('注册合法 agent 成功', () => {
    const ws = new GlobalWorkspace('/root/.hermes/skills/ai/mark-heartflow-skill');
    const agent = {
      name: 'testAgent',
      process: () => {},
      getAttentionPriority: () => 0.5,
    };
    const r = ws.registerAgent(agent);
    assertTrue(r === true);
  });

  test('注册缺少 process 的 agent 被拒', () => {
    const ws = new GlobalWorkspace('/root/.hermes/skills/ai/mark-heartflow-skill');
    const agent = { name: 'badAgent', getAttentionPriority: () => 0.5 };
    const r = ws.registerAgent(agent);
    assertTrue(r === false);
  });

  test('注册无 name 的 agent 被拒', () => {
    const ws = new GlobalWorkspace('/root/.hermes/skills/ai/mark-heartflow-skill');
    const agent = { process: () => {}, getAttentionPriority: () => 0.5 };
    const r = ws.registerAgent(agent);
    assertTrue(r === false);
  });

  test('重复注册同名 agent 被拒', () => {
    const ws = new GlobalWorkspace('/root/.hermes/skills/ai/mark-heartflow-skill');
    const a = { name: 'dup', process: () => {}, getAttentionPriority: () => 0.5 };
    ws.registerAgent(a);
    const r = ws.registerAgent(a);
    assertTrue(r === false);
  });
};
