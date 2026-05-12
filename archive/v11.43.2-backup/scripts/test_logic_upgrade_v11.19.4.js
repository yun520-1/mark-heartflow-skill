#!/usr/bin/env node
/**
 * Test: Logic Upgrade v11.19.4
 * Syllogism Checker + Epistemic Chain Verifier
 */

const { SyllogismChecker, verifyChain: syllogismVerify } = require('./src/core/syllogism-checker.js');
const { EpistemicChainVerifier, verifyChain: epistemicVerify } = require('./src/core/epistemic-chain-verifier.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result.pass) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}: ${result.reason}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, reason) {
  return condition ? { pass: true } : { pass: false, reason };
}

// ===== Syllogism Checker Tests =====

test('Syllogism: Modus Ponens valid', () => {
  const checker = new SyllogismChecker();
  const result = checker.check({
    statements: ['如果P那么Q', 'P'],
    claim: '因此Q',
  });
  return assert(result.valid === true, `Expected valid, got ${result.valid}`);
});

test('Syllogism: Affirming Consequent is fallacy', () => {
  const checker = new SyllogismChecker();
  const result = checker.check({
    statements: ['如果P那么Q', 'Q'],
    claim: '因此P',
  });
  return assert(result.valid === false && result.fallacy === '肯定后件', `Got valid=${result.valid}, fallacy=${result.fallacy}`);
});

test('Syllogism: Denying Antecedent is fallacy', () => {
  const checker = new SyllogismChecker();
  const result = checker.check({
    statements: ['如果P那么Q', '不P'],
    claim: '因此不Q',
  });
  return assert(result.valid === false && result.fallacy === '否定前件', `Got valid=${result.valid}, fallacy=${result.fallacy}`);
});

test('Syllogism: Modus Tollens valid', () => {
  const checker = new SyllogismChecker();
  const result = checker.check({
    statements: ['如果P那么Q', '不Q'],
    claim: '因此不P',
  });
  return assert(result.valid === true, `Expected valid, got ${result.valid}`);
});

test('Syllogism: quickCheck catches fallacy', () => {
  const checker = new SyllogismChecker();
  const result = checker.quickCheck('所以P成立');
  return assert(result.likely_invalid === false, 'Premise alone not invalid');
});

// ===== Epistemic Chain Verifier Tests =====

test('Epistemic: valid arithmetic chain', () => {
  const result = epistemicVerify({
    statements: ['10 + 5 = 15', '15 - 3 = 12'],
    claim: 'Therefore 12',
  });
  return assert(result.is_valid === true, `Invalid: ${result.summary}`);
});

test('Epistemic: catches arithmetic error', () => {
  const result = epistemicVerify({
    statements: ['10 + 5 = 14'],
    claim: '错误结果',
  });
  return assert(result.is_valid === false && result.invalid_steps?.length > 0,
    `Should catch error, got valid=${result.is_valid}`);
});

test('Epistemic: percentage error detection', () => {
  const result = epistemicVerify({
    statements: ['10% of 200 is 25'],
    claim: '',
  });
  return assert(result.is_valid === false, 'Should catch 10% of 200 = 20, not 25');
});

test('Epistemic: ECS scoring works', () => {
  const result = epistemicVerify({
    statements: ['这是一个推理步骤', '这是另一个步骤'],
    claim: '',
  });
  return assert(result.chain_confidence > 0 && result.chain_confidence <= 100,
    `ECS: ${result.chain_confidence}`);
});

test('Epistemic: full pipeline with claim', () => {
  const verifier = new EpistemicChainVerifier();
  const result = verifier.verifyClaim({
    claim: '所有人都会死，苏格拉底是人，所以苏格拉底会死',
    evidence: [],
  });
  return assert(result.is_valid === true, `Full pipeline: ${result.summary}`);
});

test('Epistemic: conclusion step type', () => {
  const result = epistemicVerify({
    statements: ['第一步推理', '第二步推理', '因此结论'],
    claim: '',
  });
  const lastStep = result.steps[result.steps.length - 1];
  return assert(lastStep?.step_type === 'conclusion', `Last step type: ${lastStep?.step_type}`);
});

// ===== Integration Test =====

test('Integration: both verifiers work together', () => {
  const checker = new SyllogismChecker();
  const verifier = new EpistemicChainVerifier();
  const syll = checker.check({ statements: ['如果P那么Q', 'P'], claim: '因此Q' });
  const epi = verifier.verify({ statements: ['推理步骤一', '推理步骤二'], claim: '' });
  return assert(syll.valid === true && epi.chain_confidence > 0,
    `Syll=${syll.valid}, Epi ECS=${epi.chain_confidence}`);
});

// ===== Summary =====

console.log(`\n${'='.repeat(40)}`);
console.log(`Logic Upgrade v11.19.4 — Test Results`);
console.log(`${'='.repeat(40)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`${'='.repeat(40)}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed.\n`);
  process.exit(1);
}
