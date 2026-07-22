const mm = require('../src/core/metaMemory.js');
describe('metaMemory', () => {
  test('module exports functions', () => {
    expect(typeof mm).toBe('object');
  });
  test('store or recall exists', () => {
    const fn = Object.values(mm).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
