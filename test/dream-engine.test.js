/**
 * test/dream-engine.test.js — Dream 升华引擎回归测试
 *
 * v6.3.48 曾将 src/dream/ 误判为死模块删除，导致 MCP heartflow_dream
 * 工具引用不存在的 engine.js。2026-08-01 从 git 历史恢复并重建入口。
 * 本测试保护：dream 引擎能出真实梦境，不是空壳。
 */
module.exports = function ({ test }) {
  const { DreamEngine } = require('../src/dream/engine.js');

  test('dream engine boots and healthChecks', async () => {
    const e = new DreamEngine(null, null);
    e.boot();
    const h = e.healthCheck();
    if (!h.ok) throw new Error('healthCheck failed: ' + JSON.stringify(h));
  });

  test('dream produces narrative fragments', async () => {
    const e = new DreamEngine(null, null);
    e.boot();
    const r = await e.dream('test dream seed');
    if (!r.dreamComplete) throw new Error('dream incomplete: ' + JSON.stringify(r));
    if (!r.narrative || r.narrative.length < 20) {
      throw new Error('narrative too short: ' + JSON.stringify(r));
    }
    if (!Array.isArray(r.fragments) || r.fragments.length === 0) {
      throw new Error('no fragments: ' + JSON.stringify(r));
    }
  });

  test('dream respects theme and returns stable structure', async () => {
    const e = new DreamEngine(null, null);
    e.boot();
    const theme = '世界高波动，恐惧驱动对抗，AI需要说不得节点';
    const r = await e.dream(theme);
    if (r.theme !== theme) throw new Error('theme not echoed');
    const expected = ['narrative', 'fragments', 'functionType', 'dreamComplete'];
    for (const k of expected) {
      if (!(k in r)) throw new Error('missing key: ' + k);
    }
  });
};
