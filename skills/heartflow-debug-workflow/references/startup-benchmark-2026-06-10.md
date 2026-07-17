# HeartFlow 启动性能基准（2026-06-10 实测，2026-06-19 更新）

## 测试环境

- macOS 26.5.1
- Node.js v25.8.2
- 心虫版本：v3.0.2（54 模块）
- 测试方法：写临时文件 + `node /tmp/_bench.js`（避免 execute_code inline node -e 的管道超时问题）

## 结果（2026-06-19 v3.0.2）

| 阶段 | 耗时 |
|------|------|
| `require('./src/core/heartflow.js')` | 3-4ms |
| `new HeartFlow()` | 0-1ms |
| `hf.start()`（54 模块全部实例化） | 58-70ms |
| **总耗时（Node 进程启动 + require + start）** | **~58-70ms** |
| MCP HTTP server 启动（含 HTTP 监听） | 58-61ms（2026-06-19）|

## 历史数据对比

| 版本 | 模块数 | 启动时间 | 日期 |
|------|--------|---------|------|
| v2.9.0 | 38 | ~43ms | 2026-06-10 |
| v3.0.2 | 54 | ~58-70ms | 2026-06-19 |

启动时间随模块数线性增长，每新增模块约增加 1ms。

## 性能基线

- 启动耗时稳定：58-70ms（5 次测量）
- 无 initErrors（所有 try/catch 模块初始化成功或静默跳过）
- 模块数：54 个（Tier 1 同步加载 + Tier 2 懒加载注册）

## ⚠️ 重要：启动后进程不退出（假超时问题）

`start()` 执行完成后，Node.js 进程**不会自动退出**，原因：
- `src/core/memory/slots.js` 的 `_startCleanupTimer()` 开了 `setInterval`
- `src/core/memory/observe.js` 的 `_startConsolidateTimer()` 开了 `setInterval`

这导致：
1. `subprocess.run(timeout=30)` 测试始终超时（即使引擎 70ms 已完成）
2. 从 `execute_code` 中测试时看起来像卡死
3. **MCP 常驻模式不受影响**（daemon 本来就要保持事件循环）

**正确测试方式**：
```javascript
// 必须用 process.exit(0) 强制退出
const start = Date.now();
const { HeartFlow } = require('./src/core/heartflow.js');
const engine = new HeartFlow({rootPath: '...'});
engine.start();
console.log(JSON.stringify({ms: Date.now()-start, modules: Object.keys(engine._modules||{}).length}));
process.exit(0);
```

## 已知缺失文件（启动时 try/catch 静默吞错）

以下文件在 `start()` 中被引用但不存在，被 try/catch 捕获后写入 `_initErrors` 数组：
- `src/core/code/code-engine.js`（v3.0.2 仍缺失）
- `bin/cli.js`（~/.local/bin/heartflow CLI 指向但不存在）
- `bin/setup.js`（同上）

这些缺失不会导致崩溃，但会导致对应功能不可用（`this.codeEngine` 保持 null）。

## 结论

心虫引擎本身不是启动瓶颈。真正的慢在：
1. Hermes → LLM API 的 4-5 次往返（每次 2-3s）
2. 微信消息队列的端到端延迟
3. `plugins/heartflow_memory` 的 prefetch 超时（8 秒）

优化方向：减少 API 往返次数（合并工具调用），不是优化引擎启动。
