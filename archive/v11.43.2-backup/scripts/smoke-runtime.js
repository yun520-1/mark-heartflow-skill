const { HeartFlowEngine } = require('../src/core/heartflow-engine.js');
const engine = new HeartFlowEngine({ selfHealing: {}, stabilityGuard: {} });
console.log('loaded:', !!engine);
