/**
 * blind-spot-breaker-hook.js — HookBus handler for BlindSpotBreaker
 *
 * 从 heartflow.js think() 提取的第一个 HookBus handler。
 * 目标：验证 HookBus 路线可行，每迁移一段减少一次 heartflow.js 修改。
 */

// 惰性加载 BlindSpotBreaker（只加载一次）
let _bsb = null;
function _getBSB() {
  if (!_bsb) {
    _bsb = require('../../cortex/blind-spot-breaker.js');
  }
  return _bsb;
}

/**
 * BlindSpotBreaker hook handler
 * 在 think() 主推理完成后，检测推理链中的盲点。
 */
async function blindSpotBreakerHandler(ctx) {
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
}

/**
 * 注册 BlindSpotBreaker hook 到 HookBus
 * @param {HookBus} hookBus
 */
function register(hookBus) {
  hookBus.on('postprocess.think', blindSpotBreakerHandler, {
    id: 'blindSpotBreaker',
    priority: 100,  // 高优先级——最早运行
    timeout: 300,   // 盲点检测最多给 300ms
  });
}

module.exports = { register, handler: blindSpotBreakerHandler };
