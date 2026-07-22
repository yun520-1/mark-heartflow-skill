const dispatch = require('../src/core/engine-dispatcher.js');

describe('engine-dispatcher', () => {
  const hf = { started: true, _modules: {}, _lazy: {} };

  test('dispatch: throws for invalid route', () => {
    expect(() => dispatch(hf, 'invalid')).toThrow('Invalid route');
  });

  test('dispatch: monitor.getStats returns stats', () => {
    const result = dispatch(hf, 'monitor.getStats');
    expect(result).toBeDefined();
    expect(typeof result.enabled).toBe('boolean');
  });

  test('dispatch: monitor.enable toggles perf', () => {
    dispatch(hf, 'monitor.enable');
    expect(dispatch(hf, 'monitor.getStats').enabled).toBe(true);
    dispatch(hf, 'monitor.disable');
    expect(dispatch(hf, 'monitor.getStats').enabled).toBe(false);
  });

  test('dispatch: monitor.reset noop', () => {
    expect(() => dispatch(hf, 'monitor.reset')).not.toThrow();
  });

  test('dispatch: monitor methods not throw', () => {
    ['enable', 'disable', 'reset', 'getStats'].forEach(m => {
      expect(() => dispatch(hf, 'monitor.' + m)).not.toThrow();
    });
  });
});
