#!/usr/bin/env node
/**
 * test/world-knowledge.test.js
 * 世界知识库模块 TDD 测试（无外部依赖，node 直接运行 / run-all 集成均可）
 *
 * 验证 WorldKnowledge 能对真实中文新闻文本正确命中：
 *   1. '外交部回应中导试射'     → west_pacific
 *   2. '外贸进出口增长'         → economic_multipolar + 外贸指标(foreign_trade)
 *   3. 'AI Agent 竞争'          → tech_axes (AI 大模型 / Agent 工程化)
 */
const { WorldKnowledge } = require('../src/knowledge/world-knowledge.js');

function assert(cond, msg) {
  if (!cond) throw new Error('断言失败: ' + msg);
  console.log('  ✓ ' + msg);
}

function runTests() {
  const wk = new WorldKnowledge();

  // ---- 基础结构 ----
  assert(wk, 'WorldKnowledge 实例化');
  assert(typeof wk.GEOPOLITICAL_FRAMES === 'object', 'GEOPOLITICAL_FRAMES 是对象');
  assert(typeof wk.ECONOMIC_INDICATORS === 'object', 'ECONOMIC_INDICATORS 是对象');
  assert(Array.isArray(wk.TECH_AXES), 'TECH_AXES 是数组');

  // ---- getFramework ----
  const wp = wk.getFramework('west_pacific');
  assert(wp && wp.name === '西太平洋安全格局', 'getFramework(west_pacific) 命中');
  assert(Array.isArray(wp.actors) && wp.actors.includes('中国'), 'west_pacific 含 actors');
  assert(wk.getFramework('西太平洋安全格局') !== null, 'getFramework 支持中文名查询');
  assert(wk.getFramework('nonexistent') === null, 'getFramework 未知返回 null');

  // ---- analyzeSignals: 西太平洋 ----
  const t1 = '外交部回应西太平洋中导试射，称有关演训不针对任何特定国家。';
  const r1 = wk.analyzeSignals(t1);
  const r1Keys = r1.frames.map((f) => f.key);
  assert(r1Keys.includes('west_pacific'), '案例1 命中 west_pacific: ' + JSON.stringify(r1Keys));
  assert(r1.totalHits > 0, '案例1 totalHits > 0: ' + r1.totalHits);

  // ---- analyzeSignals: 外贸 / 多极化经济 ----
  const t2 = '最新海关数据显示，外贸进出口增长，我国对东盟和金砖国家出口保持贸易顺差。';
  const r2 = wk.analyzeSignals(t2);
  const r2Frames = r2.frames.map((f) => f.key);
  const r2Inds = r2.indicators.map((i) => i.key);
  assert(r2Frames.includes('economic_multipolar'), '案例2 命中 economic_multipolar: ' + JSON.stringify(r2Frames));
  assert(r2Inds.includes('foreign_trade'), '案例2 命中经济指标 foreign_trade: ' + JSON.stringify(r2Inds));

  // ---- analyzeSignals: 科技轴线 ----
  const t3 = 'AI Agent 竞争白热化，大模型与智能体工程化成为科技公司的核心战场。';
  const r3 = wk.analyzeSignals(t3);
  const r3Axes = r3.techAxes.map((a) => a.axis);
  assert(r3.techAxes.length > 0, '案例3 命中 tech_axes: ' + JSON.stringify(r3Axes));
  assert(r3Axes.some((a) => a.includes('AI 大模型')), '案例3 含「AI 大模型」轴');
  assert(r3Axes.some((a) => a.includes('Agent 工程化')), '案例3 含「Agent 工程化」轴');

  // ---- 边界：空输入降级 ----
  const rEmpty = wk.analyzeSignals('');
  assert(rEmpty && rEmpty.frames.length === 0 && rEmpty.totalHits === 0, '空字符串返回空结果不报错');
  const rNull = wk.analyzeSignals(null);
  assert(rNull && rNull.totalHits === 0, 'null 输入安全降级');
  assert(wk.getIndicator('foreign_trade') !== null, 'getIndicator 可查外贸指标');
  assert(wk.listFrameworks().includes('tech_decoupling'), 'listFrameworks 含 tech_decoupling');
}

if (require.main === module) {
  try { runTests(); console.log('\n✅ WorldKnowledge 测试全部通过'); }
  catch (e) { console.error('\n❌', e.message); process.exit(1); }
}

module.exports = function ({ test }) {
  test('世界知识库：对真实中文新闻正确命中地缘/经济/科技框架', () => {
    runTests();
  });
};
