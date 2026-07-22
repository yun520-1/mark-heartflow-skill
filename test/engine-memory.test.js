const em = require('../src/core/engine-memory.js');
describe('engine-memory', () => {
  test('module exports functions', () => {
    expect(typeof em).toBe('object');
    const fn = Object.values(em).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
  test('_checkMemoryEnabled exists', () => {
    expect(typeof em._checkMemoryEnabled).toBe('function');
  });
  test('_getMemoryDir exists', () => {
    expect(typeof em._getMemoryDir).toBe('function');
  });
});
