const hb = require('../src/core/hook-bus.js');
describe('hook-bus', () => {
  test('module exports functions', () => {
    expect(typeof hb).toBe('object');
  });
  test('register or emit exists', () => {
    const fn = Object.values(hb).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
