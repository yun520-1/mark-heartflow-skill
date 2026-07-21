/**
 * MindWanderer 测试 — 补齐 consciousness 层无测试覆盖（心虫自检 untestedModules）
 * 该模块体现心虫"知道自身状态"（4 身份之一）的昼夜认知调制能力。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { MindWanderer } = require('../src/consciousness/mind-wanderer.js');
  console.log('  🧠 MindWanderer (mind-wanderer.js)');

  test('构造不抛', () => {
    const m = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
    assertTrue(m instanceof MindWanderer);
  });

  test('_computeTimeModulation 凌晨高创造力低实用性', () => {
    const m = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
    const mod = m._computeTimeModulation(3); // 3 点
    assertDefined(mod);
    assertTrue(mod.creativity >= 0.8);
    assertTrue(mod.practicality <= 0.4);
  });

  test('_computeTimeModulation 白天偏实用', () => {
    const m = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
    const mod = m._computeTimeModulation(14); // 14 点
    assertDefined(mod);
    assertTrue(mod.practicality >= 0.5);
  });

  test('调制结果字段完整', () => {
    const m = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
    const mod = m._computeTimeModulation(10);
    assertDefined(mod.creativity);
    assertDefined(mod.practicality);
    assertDefined(mod.abstraction);
    assertDefined(mod.social);
  });

  test('loadWildIdeas 不抛且返回结构化', () => {
    const m = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
    const ideas = m.loadWildIdeas();
    assertDefined(ideas);
    assertTrue(typeof ideas === 'object');
  });
};
