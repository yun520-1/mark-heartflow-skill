const { EngineReasoner } = require('../src/core/engine-reasoner.js');
describe('EngineReasoner', () => {
  let reasoner;
  beforeEach(() => { reasoner = new EngineReasoner({}); });
  test('instance created', () => {
    expect(reasoner).toBeDefined();
  });
});
