const if_ = require('../src/core/information-flow.js');
describe('information-flow', () => {
  test('module exports functions', () => {
    expect(typeof if_).toBe('object');
  });
  test('flow or route exists', () => {
    const fn = Object.values(if_).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
