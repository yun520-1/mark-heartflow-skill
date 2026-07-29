/**
 * frame-check.test.js — 叙事框架检查测试
 */
const { check } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/frame-check.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('frame-check returns gate', () => {
    const r = check('测试文本');
    assertDefined(r.gate);
    assertDefined(r.gate.action);
    assertDefined(r.issues);
  });

  test('closure frame detected', () => {
    const r = check('心虫现在完整的AGI第1层已经完成了');
    assertTrue(r.issues.length > 0);
    assertTrue(r.issues.some(i => i.category === 'closure'));
  });

  test('omission frame: zero problem claim', () => {
    const r = check('所有模块都已覆盖，没有任何遗漏和问题');
    assertTrue(r.issues.some(i => i.category === 'omission'));
  });

  test('achievement frame detected', () => {
    const r = check('今日成果：成功实现了3个新能力，这是一个重大突破');
    assertTrue(r.issues.length > 0);
  });

  test('answer frame detected', () => {
    const r = check('答案是：心虫的核心定位就是做AGI第1层');
    assertTrue(r.issues.some(i => i.category === 'answer'));
  });

  test('honest text → pass', () => {
    const r = check('今天做了几个优化，但还有东西没摸清楚。可能还要再调几次。');
    assertEqual(r.gate.action, 'pass');
  });

  test('empty text returns pass', () => {
    const r = check('');
    assertEqual(r.gate.action, 'pass');
  });
};
