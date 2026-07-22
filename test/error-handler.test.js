const eh = require('../src/core/error-handler.js');
describe('error-handler', () => {
  test('exports errors array and maxHistory', () => {
    expect(Array.isArray(eh.errors)).toBe(true);
    expect(typeof eh.maxHistory).toBe('number');
  });
  test('exports internal state objects', () => {
    expect(typeof eh._counters).toBe('object');
    expect(typeof eh._dedup).toBe('object');
  });
  test('exports isProduction flag', () => {
    expect(typeof eh.isProduction).toBe('boolean');
  });
});
