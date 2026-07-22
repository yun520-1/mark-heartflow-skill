// [v6.0.71] HeartFlow 统计引擎 — 从 heartflow.js 提取 getStats()
// 职责：聚合模块状态、记忆层、公式库、进化周期等统计数据

function buildStats(hf) {
  if (!hf.started) return { started: false };

  let memoryTotal = 0;
  try {
    const layers = hf.memory?.getLayers ? hf.memory.getLayers() : [];
    memoryTotal = layers.reduce((s, l) => s + (l.size || l.count || 0), 0);
  } catch (e) { /* memory stats optional */ }

  return {
    version: hf.version || 'unknown',
    started: true,
    upTime: Date.now() - (hf.startTime || Date.now()),
    memoryTotal,
    formulaCount: hf.formulaEngine ? (hf.formulaEngine.getCount ? hf.formulaEngine.getCount() : 0) : 0,
    moduleCount: Object.keys(hf._modules || {}).length,
    cycleCount: hf.evolution?.cycleCount || 0,
  };
}

module.exports = { buildStats };
