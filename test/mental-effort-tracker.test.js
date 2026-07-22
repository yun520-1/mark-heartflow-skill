const met = require('../src/core/mental-effort-tracker.js');
describe('mental-effort-tracker', () => {
  test('module exports functions', () => {
    expect(typeof met).toBe('object');
  });
  test('track or measure exists', () => {
    const fn = Object.values(met).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
