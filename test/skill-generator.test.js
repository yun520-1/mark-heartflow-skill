/**
 * 心虫自主升级补的 TDD (skill-generator, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { SkillGenerator } = require('../src/code/skill-generator.js');
  test('SkillGenerator 可实例化(root)且含 generateSkill/validateGeneratedSkill', () => {
    const sg = new SkillGenerator(process.cwd());
    assertDefined(sg, '实例应存在');
    assertTrue(typeof sg.generateSkill === 'function', 'generateSkill 应为函数');
    assertTrue(typeof sg.validateGeneratedSkill === 'function', 'validateGeneratedSkill 应为函数');
  });
};
