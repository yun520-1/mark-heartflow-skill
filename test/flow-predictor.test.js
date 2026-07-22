const fp = require('../src/core/flow-predictor.js');
describe('flow-predictor', () => {
  test('module exports functions', () => {
    expect(typeof fp).toBe('object');
  });
  test('predict or estimate exists', () => {
    const fn = Object.values(fp).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
