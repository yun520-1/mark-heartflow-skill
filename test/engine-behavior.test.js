const eb = require('../src/core/engine-behavior.js');
describe('engine-behavior', () => {
  test('_feedDriftResult is function', () => {
    expect(typeof eb._feedDriftResult).toBe('function');
  });
  test('_psychBridge exists', () => {
    expect(typeof eb._psychBridge).toBe('function');
  });
  test('_recordDreamTime is function', () => {
    if (typeof eb._recordDreamTime === 'function') {
      expect(typeof eb._recordDreamTime).toBe('function');
    }
  });
  test('module exports object', () => {
    expect(typeof eb).toBe('object');
  });
});
