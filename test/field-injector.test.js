const fi = require('../src/core/field-injector.js');
describe('field-injector', () => {
  test('module exports functions', () => {
    expect(typeof fi).toBe('object');
  });
  test('inject or set exists', () => {
    const fn = Object.values(fi).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
