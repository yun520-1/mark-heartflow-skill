const { DecisionVerifier } = require('../src/core/decision-verifier.js');

describe('DecisionVerifier', () => {
  let verifier;
  beforeEach(() => { verifier = new DecisionVerifier(); });

  const baseInput = (overrides) => ({
    decision: '',
    reason: '',
    evidence: [],
    risks: [],
    contradictions: [],
    alternatives: [],
    confidence: 0.5,
    expectedOutcome: '',
    userGoal: '',
    constraints: [],
    ...overrides
  });

  test('verify: returns score/issues/checks', () => {
    const result = verifier.verify(baseInput({ confidence: 0.9, evidence: ['f1'] }));
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('issues');
    expect(typeof result.score).toBe('number');
  });

  test('verify: empty input produces issues', () => {
    const result = verifier.verify(baseInput({}));
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.5);
  });

  test('normalize: copies fields', () => {
    const n = verifier.normalize(baseInput({ confidence: 0.8, evidence: ['a'] }));
    expect(n.confidence).toBe(0.8);
    expect(n.evidence).toEqual(['a']);
  });

  test('checkEvidence: missing evidence = issue', () => {
    const r = verifier.checkEvidence(baseInput({}));
    expect(r.ok).toBe(false);
  });

  test('checkEvidence: has evidence passes', () => {
    const r = verifier.checkEvidence(baseInput({ evidence: ['f1', 'f2'] }));
    expect(r.ok).toBe(true);
  });

  test('checkRisk: detects high-risk terms', () => {
    const r = verifier.checkRisk(baseInput({ decision: '执行 rm -rf /data' }));
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.issues[0].type).toBe('high_risk_without_fallback');
  });

  test('checkRisk: safe terms pass', () => {
    const r = verifier.checkRisk(baseInput({ decision: '正常业务处理' }));
    expect(r.ok).toBe(true);
  });

  test('checkContradictions: contradiction pairs detected', () => {
    const r = verifier.checkContradictions(baseInput({ decision: '立即执行', reason: '稍后评估' }));
    expect(r.ok).toBe(false);
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.issues[0].type).toBe('contradiction');
  });

  test('computeScore: higher confidence = higher score', () => {
    const checks = { evidence: { ok: true }, contradiction: { ok: true }, risk: { ok: true }, completeness: { ok: true } };
    const high = verifier.computeScore(baseInput({ confidence: 0.9 }), checks);
    const low = verifier.computeScore(baseInput({ confidence: 0.3, evidence: [] }), { ...checks, evidence: { ok: false } });
    expect(high).toBeGreaterThan(low);
  });

  test('generateRepairHints: missing_evidence adds hint', () => {
    const hints = verifier.generateRepairHints([{ type: 'missing_evidence' }], {});
    expect(hints.some(h => h.includes('依据'))).toBe(true);
  });
});
