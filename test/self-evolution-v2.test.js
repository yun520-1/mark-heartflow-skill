/**
 * self-evolution-v2.js 单元测试（M7 补：含活跃网络 IO 的模块必须有专属测试）
 * 不真联网：mock _fetchArxiv，验证 opt-in 门禁 + 差距比对逻辑
 */
const ROOT = process.cwd();

function run({ test, assertEqual, assertTrue, assertFalse }) {
  const { SelfEvolutionV2 } = require('../src/cortex/self-evolution-v2.js');

  test('opt-in 关（默认）：explore 直接返回 []，不出网', async () => {
    const v2 = new SelfEvolutionV2(ROOT);
    const saved = process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    delete process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    v2._fetchArxiv = () => { throw new Error('不应被调用'); };
    const gaps = await v2.explore('x', true);
    if (saved !== undefined) process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = saved;
    assertEqual(gaps.length, 0);
  });

  test('opt-in 开：explore 调 _fetchArxiv 并产出对标候选', async () => {
    const v2 = new SelfEvolutionV2(ROOT);
    const saved = process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = '1';
    v2._fetchArxiv = async () => ([{ title: 'An Ever-growing Skill Library for Code Reuse', abstract: 'we propose skill library with code reuse' }]);
    const gaps = await v2.explore('x', true);
    if (saved !== undefined) process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = saved; else delete process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    assertTrue(gaps.length >= 1);
    assertEqual(gaps[0].capability, 'skill-library');
  });

  test('_diffAgainstSelf 兜底：无窄信号也产 frontier-benchmark 候选', () => {
    const v2 = new SelfEvolutionV2(ROOT);
    const gaps = v2._diffAgainstSelf([{ title: 'Some Random Paper', abstract: 'unrelated text' }]);
    assertTrue(gaps.length >= 1);
    assertEqual(gaps[0].capability, 'frontier-benchmark');
  });

  test('_parseArxiv 非 string 容错返回 []', () => {
    const v2 = new SelfEvolutionV2(ROOT);
    assertEqual(v2._parseArxiv(null).length, 0);
    assertEqual(v2._parseArxiv(123).length, 0);
  });
}

module.exports = run;
