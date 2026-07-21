/**
 * 心虫自主升级补的 TDD (cognitive-protocol, 未测试模块)
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { CognitiveProtocol } = require('../src/core/cognitive-protocol.js');
  test('CognitiveProtocol 可实例化(root)且含 analyzeTaskLevel', () => {
    const cp = new CognitiveProtocol(process.cwd());
    assertDefined(cp, '实例应存在');
    assertTrue(typeof cp.analyzeTaskLevel === 'function', 'analyzeTaskLevel 应为函数');
  });
};
