const { heartflow } = require('../src/core/heartflow.js');

describe('heartflow', () => {
  test('module loads without error', () => {
    expect(typeof heartflow).toBe('function');
  });
});
