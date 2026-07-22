/**
 * WorldLandscape 回归测试 [v6.1.0]
 * 验证心虫世界格局分析引擎能基于真实新闻信号做结构化研判
 */
const assert = require('assert');
const { WorldLandscape, ROUTES } = require('../src/research/world-landscape.js');

function main() {
  // 真实新闻信号 (2026-07-22, tencent-news + xinwen)
  const signals = [
    { source: 'tencent-news', text: '外交部回应澳大利亚批评中方导弹试射：系中国军队例行军事训练，事先已通报包括澳大利亚在内的国家，不针对任何特定目标' },
    { source: 'tencent-news', text: '上半年外贸稳规模优结构，货物贸易进出口增长强劲；财政部：上半年证券交易印花税1549亿元同比增97.3%' },
    { source: 'xinwen', text: 'GitHub Trending 25+ 项目、TechCrunch 20条、AI newsletters 30条聚焦 AI Agent 与多模态模型竞争' },
  ];

  const wl = new WorldLandscape({ projectRoot: process.cwd() });
  const r = wl.analyze(signals);

  assert.strictEqual(r.ok, true, 'analyze 应返回 ok=true');
  assert.ok(r.frames.length >= 2, '应命中至少2个格局框架，实际 ' + r.frames.length);
  assert.ok(r.summary && r.summary.headline, '应产出结构化研判摘要');

  // 验证西太平洋框架被命中
  const westPacific = r.frames.find(f => f.key === 'west_pacific');
  assert.ok(westPacific, '应命中 west_pacific 框架');
  assert.ok(westPacific.matchedKeywords.includes('导弹') || westPacific.matchedKeywords.includes('试射'), '应命中导弹/试射关键词');

  // 验证 AI 竞争框架
  const aiRace = r.frames.find(f => f.key === 'ai_race');
  assert.ok(aiRace, '应命中 ai_race 框架');

  // 验证 dispatch 路由可用
  const routeResult = ROUTES['worldLandscape.analyze'](signals);
  assert.strictEqual(routeResult.ok, true, 'dispatch 路由应可用');

  // 空信号应优雅返回
  const empty = wl.analyze([]);
  assert.strictEqual(empty.ok, false, '空信号应返回 ok=false');

  console.log('  ✓ 世界格局分析引擎：命中框架数=' + r.frames.length + '，主轴=' + (r.summary && r.summary.headline));
  console.log('  ✓ 命中框架: ' + r.frames.map(f => f.name).join(' / '));
}

if (require.main === module) {
  try { main(); console.log('PASS'); } catch (e) { console.error('FAIL', e.message); process.exit(1); }
}
module.exports = function ({ test }) {
  test('世界格局分析引擎：基于真实新闻信号做结构化研判', () => {
    main();
  });
};
