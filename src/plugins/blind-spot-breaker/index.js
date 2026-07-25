/**
 * blind-spot-breaker plugin - detects blind spots in reasoning chains
 *
 * Plugin format for PluginLoader v1:
 *   { name, version, hooks: [{event, priority}], init(hf, ctx) }
 *
 * New capabilities = new plugin dir, zero changes to heartflow.js
 */

let _bsb = null;
function _getBSB() {
  if (!_bsb) _bsb = require('../../cortex/blind-spot-breaker.js');
  return _bsb;
}

const plugin = {
  name: 'blind-spot-breaker',
  version: '1.0.0',
  description: 'Detects blind spots in reasoning chains after think()',

  hooks: [
    { event: 'postprocess.think', priority: 100 },
  ],

  init(hf, ctx) {
    const hookBus = ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus available' };

    const config = ctx.config || {};
    const priority = config.priority || 100;
    const timeout = config.timeout || 300;

    hookBus.on('postprocess.think', async (ctx) => {
      const { input, result, engine } = ctx;
      if (!input || !result) return;

      const BlindSpotBreaker = _getBSB();
      if (!engine._blindSpotBreaker) {
        engine._blindSpotBreaker = new BlindSpotBreaker();
      }
      const blindSpot = engine._blindSpotBreaker.process(input, { result });
      if (blindSpot && typeof blindSpot === 'object') {
        result.blindSpotAnalysis = blindSpot;
      }
    }, { id: 'blind-spot-breaker', priority, timeout });

    return { ok: true };
  },
};

module.exports = plugin;
