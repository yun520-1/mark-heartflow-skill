const mpe = require('../src/core/meta-prompt-engine.js');
describe('meta-prompt-engine', () => {
  test('module exports functions', () => {
    expect(typeof mpe).toBe('object');
  });
  test('generate or build exists', () => {
    const fn = Object.values(mpe).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
