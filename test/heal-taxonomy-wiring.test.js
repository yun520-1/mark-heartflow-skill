/**
 * test/heal-taxonomy-wiring.test.js — error-taxonomy 接线到 self-healing 主链路的回归测试
 */
'use strict';
const assert = require('assert');

module.exports = function ({ test }) {
  test('heal-taxonomy: _matchErrorPattern 识别 429 → rate_limit', () => {
    const { SelfEvolutionCore } = require('../src/cortex/self-evolution/self-evolution-core.js');
    const core = new SelfEvolutionCore(require('path').join(__dirname, '..'));
    const type = core._matchErrorPattern('HTTP 429 Too Many Requests: arXiv rate limit');
    assert.strictEqual(type, 'rate_limit');
  });

  test('heal-taxonomy: _matchErrorPattern 识别 auth 错误', () => {
    const { SelfEvolutionCore } = require('../src/cortex/self-evolution/self-evolution-core.js');
    const core = new SelfEvolutionCore(require('path').join(__dirname, '..'));
    const type = core._matchErrorPattern('Invalid API key provided');
    assert.strictEqual(type, 'auth');
  });

  test('heal-taxonomy: heal(429) 生成退避策略 hints', () => {
    const { SelfEvolutionCore } = require('../src/cortex/self-evolution/self-evolution-core.js');
    const core = new SelfEvolutionCore(require('path').join(__dirname, '..'));
    const r = core.heal(new Error('429 Too Many Requests'));
    assert.strictEqual(r.errorType, 'rate_limit');
    assert.ok(r.hints.some(h => h.includes('退避')), 'hints 应包含退避策略');
  });

  test('heal-taxonomy: heal(超时) 分类正确', () => {
    const { SelfEvolutionCore } = require('../src/cortex/self-evolution/self-evolution-core.js');
    const core = new SelfEvolutionCore(require('path').join(__dirname, '..'));
    const r = core.heal(new Error('ETIMEDOUT after 10000ms'));
    assert.strictEqual(r.errorType, 'timeout');
  });
};
