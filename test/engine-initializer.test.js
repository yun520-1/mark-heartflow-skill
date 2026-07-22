const ei = require('../src/core/engine-initializer.js');
describe('engine-initializer', () => {
  test('start is function', () => {
    expect(typeof ei.start).toBe('function');
  });
});
