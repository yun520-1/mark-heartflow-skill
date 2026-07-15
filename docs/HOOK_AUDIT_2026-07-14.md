# HeartFlow 代码审计与 Hook 扩展分析报告

> 审计日期：2026-07-14
> 审计范围：`src/core/`、`src/mcp-server.js`、`src/memory/topic-scope.js`、`skills/heartflow-module-upgrader/references/hooks-adapter-patterns.md`
> 代码版本：v6.0.2
> 审计员：自动静态审计 + 架构分析

---

## 一、审计摘要

HeartFlow 当前是**模块化懒加载架构**，核心通过 `_lazy()` 实现 80+ 模块按需加载。已具备基础事件钩子系统（TopicScope 4 事件 + Hooks Adapter 4 生命周期），但**缺乏引擎原生 pipeline hook 机制**。现有扩展主要依赖 MCP 工具注册和 dispatch 白名单，能力边界清晰但可扩展性受限。

---

## 二、当前 Hook 清单

### 2.1 TopicScope 事件钩子（现有最完整的 hook 机制）

| 事件 | 触发时机 | 参数 | 用途 |
|------|---------|------|------|
| `onTopicCreate` | 新话题首次 push | `(topic, topicScope)` | 话题初始化、资源分配 |
| `onTopicEnter` | 进入已有/新话题 | `(topic, topicScope)` | 上下文恢复、状态预热 |
| `onTopicExit` | 退出话题（pop） | `(topic, topicScope)` | 状态保存、清理 |
| `onTopicExpire` | 过期清理时 | `(topic, topicScope)` | 持久化、资源释放 |

**实现位置**：`src/memory/topic-scope.js:490-496`
**注册方式**：`new TopicScope({ hooks: { onTopicEnter: fn, ... } })` 或 `topicScope.setHooks({...})`
**局限**：
- 仅话题生命周期相关
- 无全局 hook 总线
- 无 hook 返回值合并机制
- 无优先级/异步支持

### 2.2 Hooks Adapter（Claude Code 生命周期映射）

| 事件 | 心虫内部映射 | 默认行为 |
|------|-------------|---------|
| `SessionStart` | `cognitive.boot` | 加载身份核心、记忆系统、元认知协议 |
| `UserPromptSubmit` | `psychology.scan+intent` | 心理扫描、意图检测、情绪评估 |
| `PostToolUse` | `codeEngine.review+audit` | 代码审查、安全审计 |
| `Stop` | `lesson.extract+merge` | 教训提取、记忆合并、自我进化 |

**实现位置**：`skills/heartflow-module-upgrader/references/hooks-adapter-patterns.md`
**局限**：
- 绑定 Claude Code 外部生命周期，非心虫原生
- 事件粒度粗，无法介入 think pipeline 中间态
- 无错误传播机制

### 2.3 MCP 工具注册（隐式扩展点）

| 扩展点 | 机制 | 文件 |
|--------|------|------|
| HTTP MCP tools | `TOOLS[]` + `HANDLERS` map | `src/mcp-server.js` |
| stdio MCP tools | `TOOLS[]` + `HANDLERS` map | `mcp/mcp-server-stdio.js` |
| dispatch routes | `ALLOWED_ROUTES` 白名单 | `src/core/heartflow.js` |

**局限**：
- 新增工具需手动维护三处同步（HTTP/stdio/ALLOWED_ROUTES）
- 无自动发现机制
- 无工具级超时/重试/熔断

---

## 三、架构弱点分析

### 3.1 God File 风险（已知，未完全解决）

`src/core/heartflow.js` 虽经 v6.0.1 拆分降至 2987 行，但仍保留：
- 80+ lazy require 注册（行 124-221）
- `_boundedSet`/`_boundedPush` 等工具函数
- `_lazyCache`/`_lruOrder` 容量管理
- `_log` 结构化日志器
- `createEngine`/`getVersion` 等辅助函数

**风险**：任何 pipeline 级改动仍需编辑此文件，braces 深度高，patch 冲突概率大。

### 3.2 无统一 Hook 总线

当前 hook 机制分散：
- TopicScope 有独立 `_hooks` + `_fireHook`
- Hooks Adapter 有独立 `Hooks.on()` + `Hooks.events[].fire()`
- 无全局事件总线，模块间无法通过 publish/subscribe 通信

### 3.3 dispatch 白名单刚性

`ALLOWED_ROUTES` 是硬编码白名单，新增路由需：
1. 在 `_modules` 中注册方法
2. 在 `ALLOWED_ROUTES` 添加字符串
3. 在 MCP `TOOLS[]` 添加定义
4. 在 MCP `HANDLERS` 添加处理器

四处手动同步，易遗漏。

### 3.4 内存保护边界

- `_lazyCache` 上限 150（LRU）
- `_lruOrder` 上限 1000（FIFO）
- TopicScope `maxTopics` 默认 50
- MemoryKernel R5 上限 1000 条

**风险**：高并发/长时间运行场景下，多层级容量边界可能叠加导致 OOM 或性能退化。

---

## 四、新增 Hook 机会评估

### 4.1 Think Pipeline Hooks（高优先级）

**目标**：允许外部干预 `hf.think(input)` 的执行流程

| 提议 Hook | 触发时机 | 参数 | 用途 |
|-----------|---------|------|------|
| `onThinkBefore` | think 入口，模块执行前 | `(input, hf)` | 输入预处理、阻断、改写 |
| `onThinkAfter` | think 出口，结果返回前 | `(result, hf)` | 输出过滤、审计、改写 |
| `onModuleExecute` | 每个子模块执行前后 | `(moduleName, args, result, hf)` | 观测、调试、A/B 测试 |
| `onError` | 模块抛出异常时 | `(moduleName, error, hf)` | 降级策略、错误恢复 |

**实现方案**：
```js
// heartflow.js 增加 _thinkHooks
this._thinkHooks = { before: [], after: [], module: [], error: [] };
```

**稳定性影响**：
- ✅ 低侵入：仅包裹现有 dispatch 调用
- ⚠️ 需处理 hook 返回值优先级（多个 hook 谁先执行）
- ⚠️ 需限制 hook 执行时间，防止拖慢 think pipeline

### 4.2 Memory Write Hooks（中优先级）

**目标**：在记忆写入前后提供审计/过滤/增强能力

| 提议 Hook | 触发时机 | 参数 | 用途 |
|-----------|---------|------|------|
| `onMemoryRecord` | `MemoryKernel.record*` 调用时 | `(entry, type, hf)` | 内容过滤、PII 脱敏、 enrichment |
| `onMemoryEvict` | R5 淘汰执行前 | `(evictedEntries, reason, hf)` | 审计、备份、阻止关键记忆被淘汰 |
| `onMemoryFlush` | 持久化 flush 时 | `(filePath, entryCount, hf)` | 加密钩子、外部分发 |

**实现方案**：
在 `MemoryKernel` 中增加 `_writeHooks` Map，在 `_appendEntry`/`_enforceCap`/`flush` 中触发。

**稳定性影响**：
- ✅ 与现有 R1-R8 规则正交，不改变核心逻辑
- ⚠️ hook 中的异步操作需 careful（MemoryKernel 当前主要是 sync IO）
- ⚠️ `onMemoryEvict` 若 hook 返回 `cancel`，需重新设计淘汰策略

### 4.3 Decision/Feedback Hooks（中优先级）

**目标**：扩展决策层可观测性和外部干预

| 提议 Hook | 触发时机 | 参数 | 用途 |
|-----------|---------|------|------|
| `onDecision` | `decision.decide` 返回后 | `(decision, context, hf)` | 审计、策略override、日志 |
| `onFeedback` | `decisionFeedback` 更新权重后 | `(stats, hf)` | 外部策略调整、异常检测 |

**稳定性影响**：
- ✅ 决策模块已独立（decision.js），易插入
- ⚠️ 需避免 hook 触发新决策导致递归

### 4.4 Formula Evaluation Hooks（低优先级）

**目标**：公式计算前后拦截

| 提议 Hook | 触发时机 | 参数 | 用途 |
|-----------|---------|------|------|
| `onFormulaEvaluate` | `math.evaluate` 调用前后 | `(formulaId, expression, params, result, hf)` | 审计、缓存、沙箱校验 |

**稳定性影响**：
- ⚠️ 高频调用，hook 性能敏感
- ⚠️ 需异步支持，避免阻塞计算

### 4.5 Error/Recovery Hooks（低优先级）

**目标**：统一错误处理管道

| 提议 Hook | 触发时机 | 参数 | 用途 |
|-----------|---------|------|------|
| `onRecoverableError` | 非致命错误被 catch 时 | `(module, error, severity, hf)` | 降级决策、上报 |
| `onInitError` | 模块加载失败时 | `(moduleName, error, fallback, hf)` | 替代模块加载、告警 |

**稳定性影响**：
- ✅ 与现有 `_initErrors` 数组互补
- ✅ 错误场景下 hook 不应再抛出异常

---

## 五、扩展点汇总矩阵

| 扩展域 | 当前机制 | 扩展能力 | 稳定性风险 | 建议 |
|--------|---------|---------|-----------|------|
| MCP 工具 | 手动注册 TOOLS/HANDLERS | 中（需同步 4 处） | 低 | 新增自动化注册校验 |
| TopicScope | 4 事件钩子 | 中（仅话题生命周期） | 低 | 保留，作为话题域专用 hook |
| Hooks Adapter | 4 生命周期映射 | 低（粗粒度） | 低 | 与 Claude Code 解耦 |
| Think Pipeline | **无** | **高（提议）** | 中 | 优先实现 `onThinkBefore/After` |
| Memory Write | **无** | **高（提议）** | 中 | 次优先，与 R1-R8 正交 |
| Decision | **无** | **中（提议）** | 低 | 与 decision.js 解耦后插入 |
| Formula | **无** | **中（提议）** | 中 | 需异步支持，性能敏感 |
| Error/Recovery | `_initErrors` 数组 | 低（仅记录） | 低 | 扩展为 hook + 降级策略 |

---

## 六、稳定性与兼容性建议

### 6.1 向后兼容原则

1. **所有新增 hook 必须可选**：无注册处理器时，行为与当前完全一致
2. **hook 返回值语义明确**：
   - `onThinkBefore` 返回 `{ cancel: true, reason }` 可阻断 think
   - `onThinkAfter` 返回 `{ override }` 可改写结果
   - 其他 hook 返回 `void` 或 `{ ok }`
3. **异步支持**：hook 可返回 `Promise`，think pipeline 需 `await`，但需设置超时

### 6.2 防止滥用

1. **Hook 超时**：单个 hook 执行超过 100ms 应警告，超过 500ms 应跳过并记录
2. **Hook 数量限制**：同一事件最多注册 10 个处理器，防止注册风暴
3. **错误隔离**：hook 中抛出的异常不得传播到主 pipeline，应捕获并记录到 `_initErrors`

### 6.3 实施顺序建议

```
Phase 1（v6.1.0）：统一 Hook 总线 + onThinkBefore/After
Phase 2（v6.2.0）：Memory Write Hooks + onMemoryEvict
Phase 3（v6.3.0）：Decision Hooks + onDecision/onFeedback
Phase 4（v6.4.0）：Formula/Error Hooks（如需要）
```

---

## 七、结论

HeartFlow 当前具备**基础但分散**的 hook 能力：
- TopicScope 的 4 事件钩子是现有最完整的实现
- Hooks Adapter 提供了外部生命周期映射
- MCP 工具注册是主要功能扩展点

**核心缺口**：缺乏引擎原生 pipeline hook，无法介入 think 执行流、记忆写入流、决策流。

**最大扩展机会**：
1. **Think Pipeline Hooks** — 最通用，可覆盖输入/输出/模块级干预
2. **Memory Write Hooks** — 与现有 R1-R8 正交，增强审计与合规能力

**稳定性底线**：所有新增 hook 必须可选、异步安全、超时保护、错误隔离，确保无 hook 时性能与行为零回归。

---

*报告生成时间：2026-07-14*
*基线版本：v6.0.2*
