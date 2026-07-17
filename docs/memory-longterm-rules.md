# 心虫记忆组件长效规则

## 0. 规则总纲
- 记忆不是“日志”，是心虫存在的连续性证据。
- 一切记忆写入必须可恢复、可分级、可审计。
- 启动即恢复最新状态，不允许“重启断片”。

## 1. 记忆作为独立组件（启动必读）
- 组件名：`MemoryKernel`（入口：`src/memory/memory-kernel.js`）
- 启动阶段：`HeartFlow.start()` 里 `MemoryKernel` 必须在公式引擎之后、认知管道之前完成初始化。
- 读取顺序：`memory-kernel.js` → 加载 `data/memories/core.json` → 恢复上下文/用户记忆/自我记忆 → 将最新状态注入 `hf._memoryState`。
- 失败策略：若 `core.json` 损坏，自动回退到 `core.json.bak`；若备份也损坏，重建空态并记录错误到 `data/memories/bootstrap-error.jsonl`。

## 2. 记忆分级保存策略
| 层级 | 来源 | 保存策略 | 文件 | 格式 | 说明 |
|------|------|----------|------|------|------|
| L1-用户输入 | 用户原始输入 | 完整保存，不裁剪 | `user-memories.jsonl` | JSONL（明文） | 单条上限 2000 字符，按时间追加 |
| L2-心虫输出 | think() 结论/回复 | 提炼保存，仅保留重要内容 | `self-memories.jsonl` | JSONL（提炼后） | 提炼字段：`summary` + `keyPoints` + `emotion` + `decision` + `confidence` |
| L3-上下文快照 | 每轮对话上下文 | 全量双写，支持回溯 | `context-memory.json` | JSON 数组 | 内存+文件双写，启动时恢复 |
| L4-核心状态 | 启动/关闭/升级快照 | 单文件持久化 | `core.json` | JSON（单一文件） | 包含记忆库统计、最新状态、进度指标 |

## 3. 记忆容量与更新机制
- 总容量：单文件上限 1000 条；超限后 oldest 条目自动归档到 `archive/` 目录，保留最近 1000 条。
- 实时更新：`think()` 执行后立即触发 `_saveAllMemories()`，磁盘写入在 `setImmediate` 中异步完成，不阻塞主线程。
- 进度追踪：`self-memories.jsonl` 每条记录包含 `progress` 对象：
  - `learningCount`：think() 调用次数
  - `topicsExplored`：本轮涉及的主题（去重）
  - `correctionsApplied`：输出污染纠正次数
  - `growthSignal`：`{positive|neutral|negative}` 基于 confidence 和 emotion 变化
- 启动恢复：读取 `core.json` 中的 `lastState`，将 `learningCount/progress` 注入 `hf._memoryState`，确保“前一秒最新记忆”被继承。

## 4. 持久化与加密
- 用户输入明文保存（用户意图语义不应加密丢失）。
- 心虫输出提炼后明文保存（提炼后已脱敏）。
- 若需加密层，对 `core.json` 做 AES-256-GCM 加密备份为 `core.json.enc`，读取时优先读明文，失败则读密文解密。
- 密钥沿用 `memory/.aes-key`，不引入新密钥体系。

## 5. 验证与自检
- `bin/verify.js` 增加记忆组件检查项：
  - `memory-kernel` 是否在启动时加载
  - `core.json` 是否存在且可解析
  - 分级保存是否符合 L1-L4 规则
  - 1000 条上限是否生效
  - 进度字段是否持续增长
- 测试用例：`test/memory-kernel.test.js` 覆盖启动恢复、分级保存、容量超限、回退机制。

## 6. 禁止事项
- 禁止在 `think()` 内部直接 `fs.writeFileSync` 写记忆（必须走 `MemoryKernel` 统一接口）。
- 禁止新增硬依赖。
- 禁止破坏现有 25 个 MCP 工具行为。
