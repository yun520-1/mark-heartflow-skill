const ec = require('../src/core/engine-constructor.js');
describe('engine-constructor', () => {
  test('initializeSubsystemSlots is function', () => {
    expect(typeof ec.initializeSubsystemSlots).toBe('function');
  });
  test('initializeConfig is function', () => {
    expect(typeof ec.initializeConfig).toBe('function');
  });
  test('registerBuiltinSingletons is function', () => {
    expect(typeof ec.registerBuiltinSingletons).toBe('function');
  });
  test('initializeLazyRegistry is function', () => {
    expect(typeof ec.initializeLazyRegistry).toBe('function');
  });
});
