const fs = require('../src/core/fetch-safe.js');
describe('fetch-safe', () => {
  test('module exports functions', () => {
    expect(typeof fs).toBe('object');
  });
  test('sanitize or check exists', () => {
    const fn = Object.values(fs).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
