const { atomicwrite } = require('../utils/atomic-write.js');

describe('atomic-write', () => {
  test('module loads without error', () => {
    expect(typeof atomicwrite).toBe('function');
  });
});
