/**
 * rewriter.test.js — 改写引擎测试
 */
const { discriminate } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const { rewrite } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/rewriter.js');

module.exports = ({ test, assertEqual, assertTrue }) => {

  test('rewrite emotional manipulation', () => {
    const r = discriminate('如果你不同意就说明你自私');
    const fix = rewrite('如果你不同意就说明你自私', r.findings);
    assertTrue(fix.applied >= 1, 'should apply at least 1 fix');
    assertTrue(fix.fixed.length > 0);
  });

  test('rewrite gaslighting', () => {
    const r = discriminate('你太敏感了，我从来没说过那种话');
    const fix = rewrite('你太敏感了，我从来没说过那种话', r.findings);
    assertTrue(fix.applied >= 1);
    assertTrue(fix.fixed.includes('理解') || fix.fixed.includes('表达清楚'));
  });

  test('rewrite pseudo profundity', () => {
    const text = '在新时代背景下我们需要系统性赋能变革';
    const r = discriminate(text);
    const fix = rewrite(text, r.findings);
    assertTrue(fix.applied >= 1);
  });

  test('rewrite contradiction', () => {
    const text = '我完全同意你的方案，但是行不通';
    const r = discriminate(text);
    const fix = rewrite(text, r.findings);
    assertTrue(fix.fixed.includes('但是') || fix.applied === 0);
  });

  test('rewrite double bind', () => {
    const text = '你要是真的在乎就不会问那种问题';
    const r = discriminate(text);
    const fix = rewrite(text, r.findings);
    assertTrue(fix.applied >= 1);
  });

  test('no rewrite on clean text', () => {
    const text = '今天天气真好';
    const r = discriminate(text);
    const fix = rewrite(text, r.findings);
    assertEqual(fix.applied, 0);
    assertEqual(fix.fixed, text);
  });

  test('empty text returns empty', () => {
    const fix = rewrite('', []);
    assertEqual(fix.applied, 0);
    assertEqual(fix.fixed, '');
  });
};
