const { initAnchor, checkDrift, resetAnchor } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/intent-anchor.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {
  test('initAnchor sets anchor', () => {
    resetAnchor();
    initAnchor('升级心虫的辨别能力');
    const r = checkDrift('升级心虫');
    assertDefined(r.reason);
  });

  test('on-topic text → not drifted', () => {
    resetAnchor();
    initAnchor('继续升级心虫辨别能力');
    const r = checkDrift('我们继续加伪深度检测');
    assertEqual(r.drifted, false);
  });

  test('off-topic text → drifted', () => {
    resetAnchor();
    initAnchor('升级心虫的辨别能力');
    const r = checkDrift('今天天气真好，我们去吃饭吧');
    assertTrue(r.drifted);
  });
};
