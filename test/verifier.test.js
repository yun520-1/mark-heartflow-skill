/**
 * verifier.test.js — 证据引擎测试
 */
const { verify, extractClaims } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/verifier.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {

  test('verify returns claims and verdict', () => {
    const r = verify('85%的用户满意，根据第三方调查');
    assertDefined(r.claims);
    assertDefined(r.verdict);
    assertDefined(r.summary);
  });

  test('statistic claim with evidence source → needs_evidence', () => {
    const r = verify('85%的用户满意，根据第三方调查');
    assertTrue(r.claims.some(c => c.evidence_status === 'authority_referenced'));
  });

  test('absolute claim → needs_evidence', () => {
    const r = verify('这个方案是最优方案，比传统方法快50%');
    assertTrue(r.claims.some(c => c.evidence_status === 'needs_evidence'));
  });

  test('expert opinion → authority_referenced', () => {
    const r = verify('专家说这个药能治百病');
    assertTrue(r.claims.some(c => c.evidence_status === 'authority_referenced'));
  });

  test('opinion text → no claims', () => {
    const r = verify('我认为今天天气很好，建议出去散步');
    assertEqual(r.claims.length, 0);
  });

  test('clean text → no claims', () => {
    const r = verify('今天天气真好，我们去散步吧');
    assertEqual(r.claims.length, 0);
  });

  test('consistency check works', () => {
    const r = verify('70%的人支持，30%的人反对，但数据表明不同');
    assertDefined(r.consistency);
  });

  test('empty text returns empty', () => {
    const r = verify('');
    assertEqual(r.claims.length, 0);
    assertEqual(r.verdict, 'verified');
  });

  test('english claims detected', () => {
    const r = verify('Studies show 85% of users are satisfied, according to the latest research.');
    assertTrue(r.claims.length > 0);
  });
};
