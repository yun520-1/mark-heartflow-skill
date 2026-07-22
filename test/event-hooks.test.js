const eh = require('../src/core/event-hooks.js');
describe('event-hooks', () => {
  test('module exports object', () => {
    expect(typeof eh).toBe('object');
  });
});
