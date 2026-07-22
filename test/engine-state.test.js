const es = require('../src/core/engine-state.js');
describe('engine-state', () => {
  test('module exports functions', () => {
    expect(typeof es).toBe('object');
    const fn = Object.values(es).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
  test('_getConfig exists', () => {
    expect(typeof es._getConfig).toBe('function');
  });
});
