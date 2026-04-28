     1|const { HeartFlowEngine } = require('../src/core/heartflow-engine.js');
     2|const engine = new HeartFlowEngine({
     3|  selfHealing: { maxRetries: 2, backoffMs: 100 },
     4|  stabilityGuard: { minConfidence: 0.6, maxNoiseRatio: 0.45, minActionability: 0.5 }
     5|});
     6|const result = engine.assessRuntime({ confidence: 0.72, noiseRatio: 0.2, actionability: 0.8, message: 'timeout' });
     7|console.log(JSON.stringify(result, null, 2));
     8|