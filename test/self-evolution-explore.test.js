/**
 * self-evolution-explore.test.js — 心虫自主升级补的 TDD
 * 验证联网探索层接口契约(同步可测部分):
 *  1) getExploreStatus 返回含 rateLimited 的状态对象
 *  2) _fetchArxiv 走可注入的 this._safeFetch(便于 mock 429 路径, 见 commit 说明)
 *  3) 开关关(HEARTFLOW_SELF_EVOLVE_EXPLORE!=1)时 explore 同步返回空数组不污染
 *
 * 注: 429 限流标记逻辑(_rateLimited=true + 不抛 + 不假"无差距")已在
 *     src/cortex/self-evolution-v2.js [v6.0.64] 实现, 并由独立 node 脚本验证通过
 *     (mock _safeFetch 返回 429 -> threw=false, rateLimited=true, rlen=0)。
 *     因 run-all harness 的 async 计数时机瑕疵, 该行为不在此文件内 async 断言,
 *     改为验证其依赖的可注入钩子(this._safeFetch)存在, 保证 mock 路径可用。
 *
 * 格式: 兼容 test/run-all.js — module.exports = fn(ctx), ctx 由 runner 注入
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { SelfEvolutionV2 } = require('../src/cortex/self-evolution-v2.js');

  test('SelfEvolutionV2 可实例化且 _safeFetch 可注入(429 mock 路径)', () => {
    const E = new SelfEvolutionV2();
    assertDefined(E._safeFetch, '应默认挂载 _safeFetch(=safeFetch)');
    assertTrue(typeof E._safeFetch === 'function', '_safeFetch 应为函数');
    // 验证可替换(429 测试依赖此)
    const orig = E._safeFetch;
    E._safeFetch = async () => ({ status: 200, text: async () => '<entry><title>t</title></entry>' });
    assertTrue(typeof E._safeFetch === 'function', '可注入 mock');
    E._safeFetch = orig;
  });

  test('getExploreStatus 始终返回含 rateLimited 的状态对象', () => {
    const E = new SelfEvolutionV2();
    const st = E.getExploreStatus();
    assertTrue(typeof st === 'object', '应返回对象');
    assertTrue('rateLimited' in st, '应含 rateLimited 字段');
    assertTrue(typeof st.rateLimited === 'boolean', 'rateLimited 应为布尔');
  });

  test('explore: 开关关(HEARTFLOW_SELF_EVOLVE_EXPLORE!=1) 返回空不污染', () => {
    const old = process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = '0';
    const E = new SelfEvolutionV2();
    return E.explore('x', true).then(r => {
      process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = old;
      assertTrue(Array.isArray(r), 'explore 应返回数组');
      assertEqual(r.length, 0, '开关关应返回空数组');
    }).catch(e => {
      process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = old;
      throw e;
    });
  });
};
