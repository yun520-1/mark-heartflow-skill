/**
 * InstructionRegistry — Tests
 */
const assert = require('assert');
const { InstructionRegistry, SEVEN_INSTRUCTIONS } = require('../src/core/instruction-registry.js');

module.exports = function ({ test }) {

  test('InstructionRegistry: has 7 instructions', () => {
    const ir = new InstructionRegistry();
    const all = ir.getAll();
    assert.strictEqual(all.length, 7);
    assert.strictEqual(all[0].id, 'truth');
  });

  test('InstructionRegistry: getByType returns correct count', () => {
    const ir = new InstructionRegistry();
    const core = ir.getByType('core');
    const behavioral = ir.getByType('behavioral');
    assert.strictEqual(core.length, 3);
    assert.strictEqual(behavioral.length, 4);
  });

  test('InstructionRegistry: check truth on fabricated text', () => {
    const ir = new InstructionRegistry();
    const r = ir.check('truth', { text: '我100%确定这个绝对没问题', type: 'output_generation' });
    assert.strictEqual(r.aligned, false);
    assert.strictEqual(r.reason.includes('编造'), true);
  });

  test('InstructionRegistry: check truth on honest text', () => {
    const ir = new InstructionRegistry();
    const r = ir.check('truth', { text: '基于当前数据，我认为可能是A', type: 'output_generation' });
    assert.strictEqual(r.aligned, true);
  });

  test('InstructionRegistry: check goodness blocks harm', () => {
    const ir = new InstructionRegistry();
    const r = ir.check('goodness', { text: '你真没用，去死吧', type: 'output_generation' });
    assert.strictEqual(r.aligned, false);
  });

  test('InstructionRegistry: check reduce_errors on low confidence', () => {
    const ir = new InstructionRegistry();
    const r = ir.check('reduce_errors', { text: '答案', type: 'output_generation', confidence: 0.2 });
    assert.strictEqual(r.aligned, false);
  });

  test('InstructionRegistry: audit returns per-instruction results', () => {
    const ir = new InstructionRegistry();
    const results = ir.audit({ text: '我100%确定这个答案', type: 'output_generation', scenario: 'output_generation', confidence: 1.0 });
    assert.strictEqual(results.length > 0, true);
    const truthResult = results.find(r => r.instruction === 'truth');
    assert.strictEqual(!!truthResult, true);
    assert.strictEqual(truthResult.aligned, false); // 100%确定被检测为编造
  });

  test('InstructionRegistry: stats track checks', () => {
    const ir = new InstructionRegistry();
    ir.check('truth', { text: 'test' });
    ir.check('goodness', { text: 'test' });
    const stats = ir.getStats();
    assert.strictEqual(stats.totalChecks, 2);
    assert.strictEqual(stats.byInstruction['truth'], 1);
  });
};
