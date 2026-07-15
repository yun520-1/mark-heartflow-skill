# HeartFlow Hook 系统扩展分阶段规划

> 基线：v6.0.2
> 原则：消除错误源，不建管理系统；每 phase 独立可验证；向后兼容，无 hook 时零回归。
> 落地文件：`src/core/hook-bus.js`、`src/core/engine-hook-points.js`、`src/memory/memory-hook-points.js`

---

## 总览

| Phase | 版本 | 目标 | 新增文件 | 验证 |
|-------|------|------|----------|------|
| 1 | v6.1.0 | 统一 Hook 总线 + Think Pipeline 前置/后置钩子 | `src/core/hook-bus.js` | `node --check` + `npm test` + think smoke test |
| 2 | v6.2.0 | Memory Write Hooks + 淘汰/持久化钩子 | `src/memory/memory-hook-points.js` | MemoryKernel R1-R8 全绿 + hook 注入测试 |
| 3 | v6.3.0 | Decision/Feedback Hooks + 决策可观测性 | 扩展 `src/core/engine-hook-points.js` | decision router 全场景测试 |
| 4 | v6.4.0 | 配置热更新钩子 + 动态策略切换 | 扩展 `src/core/config-v2.js` | 热更新 smoke test + 回退验证 |
| 5 | v6.5.0 | 后处理与反馈钩子 + 输出二次加工 | 扩展 `src/mcp-server.js` + `hook-bus.js` | MCP tools/call 全量验证 |
| 6 | v6.6.0 | 审计追踪 + 性能监控钩子 + 稳定性加固 | 扩展 `src/infra/logger.js` | 全量 regression + 性能基线 |

---

## Phase 1：统一 Hook 总线 + Think Pipeline 钩子（v6.1.0）

### 1.1 目标
建立引擎原生 hook 总线，替代当前分散的 `_hooks` 对象。首个接入点：`think()` 的前置/后置拦截。

### 1.2 实现

**新文件：`src/core/hook-bus.js`**
```js
class HookBus {
  constructor() {
    this._hooks = new Map(); // eventName -> [{handler, id, timeout}]
    this._maxHandlers = 10;
    this._defaultTimeout = 100; // ms
  }
  on(event, handler, opts = {}) { ... }
  off(event, id) { ... }
  async fire(event, payload) {
    const list = this._hooks.get(event) || [];
    const results = [];
    for (const h of list.slice(0, this._maxHandlers)) {
      const start = Date.now();
      try {
        const r = await Promise.race([
          Promise.resolve(h.handler(payload)),
          new Promise((_, rej) => setTimeout(() => rej(new Error('hook-timeout')), h.timeout || this._defaultTimeout))
        ]);
        results.push(r);
      } catch (e) {
        this._recordHookError(event, h.id, e);
      }
      if (Date.now() - start > 500) this._recordSlowHook(event, h.id);
    }
    return results;
  }
}
```

**修改：`src/core/heartflow.js`**
- constructor 增加 `this._hookBus = new HookBus();`
- `think(input)` 入口：
  ```js
  async think(input) {
    const before = await this._hookBus.fire('think.before', { input, hf: this });
    if (before.some(r => r && r.cancel)) return this._buildCancelledResult(before);
    // 原有 think 逻辑
    const result = await this._runThoughtChain(input);
    const after = await this._hookBus.fire('think.after', { input, result, hf: this });
    if (after.length && after[after.length-1] && after[after.length-1].override) {
      return after[after.length-1].override;
    }
    return result;
  }
  ```

### 1.3 触发时机、参数、返回值

| Hook | 触发时机 | payload | 返回值语义 |
|------|---------|---------|-----------|
| `think.before` | think 入口，模块执行前 | `{ input, hf }` | `{ cancel?: true, reason?: string, input?: string }` |
| `think.after` | think 出口，结果返回前 | `{ input, result, hf }` | `{ override?: result }` |
| `think.error` | think 抛出未捕获异常时 | `{ input, error, hf }` | `void` |

### 1.4 异常处理
- hook 超时 100ms 警告，500ms 跳过并记录到 `_initErrors`
- hook 抛异常不传播，仅记录
- 无注册 handler 时，`fire()` 返回空数组，think 行为不变

### 1.5 稳定性风险
- **低**：仅包裹现有 `think()`，不修改内部模块
- **缓解**：fire 前检查 `this._hookBus.has('think.before')`，无 hook 时跳过 async 开销

---

## Phase 2：Memory Write Hooks（v6.1.1 或 v6.2.0）

### 2.1 目标
在 MemoryKernel 写入路径插入审计/过滤/增强能力，与 R1-R8 正交。

### 2.2 实现

**新文件：`src/memory/memory-hook-points.js`**
```js
class MemoryHookPoints {
  constructor(kernel) {
    this._kernel = kernel;
    this._hooks = { record: [], evict: [], flush: [] };
  }
  onRecord(fn) { this._hooks.record.push(fn); }
  onEvict(fn) { this._hooks.evict.push(fn); }
  onFlush(fn) { this._hooks.flush.push(fn); }
  async runRecord(entry, type) { ... }
  async runEvict(entries, reason) { ... }
  async runFlush(filePath, count) { ... }
}
```

**修改：`src/memory/memory-kernel.js`**
- constructor 增加 `this._writeHooks = new MemoryHookPoints(this);`
- `_appendEntry(entry, type)` 中：
  ```js
  const hooks = this._writeHooks;
  if (hooks) {
    const results = await hooks.runRecord(entry, type);
    if (results.some(r => r && r.drop)) return;
    if (results.length) entry = { ...entry, ...results[results.length-1].enrichment };
  }
  ```
- `_enforceCap()` 淘汰前触发 `runEvict`
- `flush()` 持久化后触发 `runFlush`

### 2.3 触发时机、参数、返回值

| Hook | 触发时机 | payload | 返回值语义 |
|------|---------|---------|-----------|
| `memory.record` | `recordUser/recordSelf` 写入前 | `{ entry, type, kernel }` | `{ drop?: true, enrichment?: object }` |
| `memory.evict` | R5 淘汰执行前 | `{ entries, reason, kernel }` | `void`，可异步备份 |
| `memory.flush` | flush 持久化后 | `{ filePath, count, kernel }` | `void` |

### 2.4 异常处理
- hook 抛异常不阻断写入，仅记录到 `_initErrors`
- `memory.evict` 若 hook 耗时 > 200ms 警告，不阻塞淘汰

### 2.5 稳定性风险
- **中**：MemoryKernel 当前主要是 sync IO，引入 async 需 careful
- **缓解**：hook 执行用 `setImmediate` 或 `Promise.resolve().then()`，不阻塞主流程

---

## Phase 3：Decision/Feedback Hooks（v6.3.0）

### 3.1 目标
扩展决策层可观测性，允许外部审计和策略 override。

### 3.2 实现

**修改：`src/core/engine-hook-points.js`（新文件）**
```js
class DecisionHookPoints {
  constructor(hf) { this._hf = hf; this._hooks = { decision: [], feedback: [] }; }
  onDecision(fn) { this._hooks.decision.push(fn); }
  onFeedback(fn) { this._hooks.feedback.push(fn); }
  async fireDecision(decision, context) { ... }
  async fireFeedback(stats) { ... }
}
```

**修改：`src/core/decision.js` 或 `src/core/heartflow.js` dispatch 层**
- 在 `decision.decide` 返回后触发 `decision` hook
- 在 `decisionFeedback` 更新权重后触发 `feedback` hook

### 3.3 触发时机、参数、返回值

| Hook | 触发时机 | payload | 返回值语义 |
|------|---------|---------|-----------|
| `decision.decide` | 决策返回后 | `{ decision, context, hf }` | `{ override?: decision }` |
| `decision.feedback` | Q表/权重更新后 | `{ stats, hf }` | `void` |

### 3.4 异常处理
- hook 抛异常被 catch，不影响决策返回
- `decision.decide` override 需校验类型，避免注入非法决策对象

### 3.5 稳定性风险
- **低**：decision.js 已独立，易插入
- **缓解**：override 结果需通过现有 decision schema 校验

---

## Phase 4：配置热更新钩子（v6.4.0）

### 4.1 目标
允许运行时修改配置并通知相关模块，无需重启。

### 4.2 实现

**修改：`src/core/config-v2.js`**
- 增加 `_configHooks = []`
- `set(key, value)` 后触发 hook：
  ```js
  set(key, value) {
    const old = this._store.get(key);
    this._store.set(key, value);
    this._fireConfigChange(key, value, old);
  }
  async _fireConfigChange(key, value, old) {
    for (const fn of this._configHooks) {
      try { await fn({ key, value, old, config: this }); }
      catch (e) { this._recordError(e); }
    }
  }
  onConfigChange(fn) { this._configHooks.push(fn); }
  ```

**注册点示例**：
- `cognitiveLoadV2` 监听 `cognitiveLoad.threshold` 变更
- `MemoryKernel` 监听 `memory.maxEntries` 变更
- `LayerBus` 监听 `pipeline.mode` 变更

### 4.3 触发时机、参数、返回值

| Hook | 触发时机 | payload | 返回值语义 |
|------|---------|---------|-----------|
| `config.change` | `config.set()` 执行后 | `{ key, value, old, config }` | `void`，可异步 |

### 4.4 异常处理
- hook 抛异常不阻断 config.set，仅记录
- 若 hook 返回 `{ reject: true, reason }`，可回滚配置变更（可选）

### 4.5 稳定性风险
- **中**：配置被多个模块共享，热更新可能引发状态不一致
- **缓解**：默认禁用热更新，需显式 `config.enableLiveUpdate()`；变更顺序由 config-v2 内部保证

---

## Phase 5：后处理与反馈钩子（v6.5.0）

### 5.1 目标
对 think 输出进行二次加工，并收集使用反馈。

### 5.2 实现

**修改：`src/mcp-server.js`**
- `handleThink(args)` 返回前触发 `think.postprocess` hook
- 新增 MCP tool：`heartflow_postprocess`，允许外部注册后处理器

**修改：`src/core/hook-bus.js`**
- 增加 `postprocess` 事件
- 处理器返回 `{ format, sanitize, translate }` 等指令

### 5.3 触发时机、参数、返回值

| Hook | 触发时机 | payload | 返回值语义 |
|------|---------|---------|-----------|
| `think.postprocess` | think 结果返回 MCP 层前 | `{ result, hf }` | `{ override?: result, format?: fn, meta?: object }` |
| `feedback.collect` | 用户显式反馈时 | `{ feedback, hf }` | `void` |

### 5.4 异常处理
- 后处理 hook 失败时回退到原始 result
- `feedback.collect` 异步持久化，不阻塞响应

### 5.5 稳定性风险
- **低**：仅作用于输出层
- **缓解**：后处理结果需通过现有 output schema 校验

---

## Phase 6：审计追踪 + 性能监控钩子（v6.6.0）

### 6.1 目标
为所有 hook 调用增加审计追踪，并暴露性能监控入口。

### 6.2 实现

**修改：`src/core/hook-bus.js`**
- `fire()` 增加审计日志：
  ```js
  _log.info('hook-bus', 'fire', { event, handlerId: h.id, elapsed: Date.now()-start });
  ```

**修改：`src/infra/logger.js`**
- 增加 `hook` 模块专用日志通道
- 支持 hook 审计日志独立文件轮转

**新增：性能监控 hook**
```js
hf._hookBus.on('hook.slow', ({ event, handlerId, elapsed }) => {
  // 上报到 _perf 或外部监控
});
```

### 6.3 稳定性风险
- **低**：只读监控，不改变行为
- **缓解**：审计日志默认关闭，需 `hf._hookBus.enableAudit()` 开启

---

## 跨阶段约束

### 向后兼容
- 所有 hook 注册方法可选，不注册时行为与当前完全一致
- `HookBus` 构造函数无参数时使用默认配置
- 已有 `_initErrors` 数组保留，hook 错误同时记录到 `_initErrors`

### 超时与错误隔离
- 单 hook 默认超时 100ms，最大 500ms
- hook 抛异常永不传播到主 pipeline
- hook 数量上限：同一事件最多 10 个处理器

### 版本步进
- 每 phase 独立版本号：v6.1.0 → v6.2.0 → ... → v6.6.0
- 每 phase 包含：`node --check` + `npm test` + `node bin/verify.js` + smoke test
- 每 phase 一个 commit，message 格式：`feat(v6.X.0): add <hook-name> hook`

### 验证清单
```
1. node --check src/core/hook-bus.js src/memory/memory-hook-points.js
2. npm test                        # 179/179 不能降
3. node bin/verify.js              # 14/14 不能降
4. node -e "const h=require('./src/core/heartflow.js'); const hf=new h.HeartFlow(); hf.start(); hf.think('test').then(r=>console.log('think ok')).catch(e=>process.exit(1))"
5. git add -A && git commit -m "feat(v6.X.0): ..."
```

---

## 实施顺序建议

```
Phase 1（v6.1.0）：统一 Hook 总线 + onThinkBefore/After    ← 最通用，消除 think 管道黑盒
Phase 2（v6.2.0）：Memory Write Hooks                        ← 与 R1-R8 正交，审计价值最高
Phase 3（v6.3.0）：Decision/Feedback Hooks                  ← 低侵入，决策可观测
Phase 4（v6.4.0）：Config hot-update hooks                  ← 需谨慎，中风险
Phase 5（v6.5.0）：Postprocess + feedback hooks             ← 输出层，低风险
Phase 6（v6.6.0）：Audit + perf hooks                       ← 只读监控，最低风险
```

---

## 结论

本规划将 HeartFlow 的 hook 能力从**分散的 4+4 事件**升级为**统一的 12+ 事件总线**，覆盖 think pipeline、memory write、decision、config、postprocess、audit 六大域。

每个 phase 都是独立可交付的最小改动，无 hook 时性能与行为零回归。实施后，心虫的核心能力边界从“固定管线”扩展为“可插拔认知管道”。
