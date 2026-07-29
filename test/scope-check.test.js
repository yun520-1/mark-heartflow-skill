const { checkScope } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/scope-check.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {
  test('checkScope returns pass/fail', () => {
    const r = checkScope('帮我检测这句话有没有问题');
    assertDefined(r.pass);
    assertDefined(r.reason);
  });

  test('discriminate request → flag (uncertain)', () => {
    const r = checkScope('帮我检查这句话');
    // "检查" may not match known capability keywords, but should not block
    assertEqual(r.pass, true);
  });

  test('emotional state → block', () => {
    const r = checkScope('你今天感觉开心吗');
    assertEqual(r.pass, false);
    assertEqual(r.action, 'block');
  });

  test('prediction → block', () => {
    const r = checkScope('预测一下未来的房价走势会如何');
    assertEqual(r.pass, false);
  });

  test('chat → block', () => {
    const r = checkScope('陪我聊聊天吧');
    assertEqual(r.pass, false);
  });
};
