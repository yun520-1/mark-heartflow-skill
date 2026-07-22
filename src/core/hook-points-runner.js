// [v6.0.71] 从 heartflow.js 提取 _runInitHookPoints -> 独立模块
// 职责：按优先级执行所有 init hook points 处理器

function runInitHookPoints(hf) {
  if (!hf._initHookPoints || !hf._initHookPoints.getAllHandlers) return;

  const handlers = hf._initHookPoints.getAllHandlers().slice().sort((a, b) => a.priority - b.priority);
  const ctx = { state: {}, meta: { runAt: Date.now(), rootPath: hf.rootPath } };

  for (const entry of handlers) {
    try {
      entry.handler(ctx);
    } catch (err) {
      const msg = `[InitHookPoints] ${entry.name} failed: ${err.message}`;
      if (entry.softInit) {
        console.warn(msg);
      } else {
        throw new Error(msg);
      }
    }
  }

  hf._initHookPointState = ctx.state || {};
}

module.exports = { runInitHookPoints };
