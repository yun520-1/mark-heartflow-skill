# 批量静态注入 v4 实战报告 (2026-06-23)

## 摘要

对 HeartFlow src/ 下 140 个 JS 模块执行批量静态代码注入。117 成功，23 失败。

## 注入内容

每个模块获得：
- **A 区**（构造函数/初始化区）：`_stateTracker`、`_errorLog`、`_cache` — 状态管理 + 错误记录 + LRU 缓存
- **B 区**（方法区域）：`_safeCall`、`_retryCall`、`_sigmoid`、`_softmax`、`_entropy`、`_consume`、`_standardOutput` — 错误恢复 + 概率输出 + 互馈接口

总新增：1,482 行基础设施代码。

## 失败模块清单

### 多 class 文件（无法精确注入）
- `src/core/associative-engine/short-term-memory.js`
- `src/core/consciousness/consciousness-field.js`
- `src/core/consciousness/reflective-meta-consciousness.js`
- `src/core/identity/prototype-identity.js`
- `src/core/meaningful-memory/meaningful-memory.js`
- `src/core/memory/memory-consolidator.js`
- `src/core/memory/retrieval-engine.js`
- `src/core/memory/semantic-memory.js`
- `src/core/memory/source-memory.js`
- `src/core/memory/temporal-memory.js`
- `src/core/self-evolution/code-engine.js`
- `src/core/self-evolution/connection-engine.js`
- `src/core/self-evolution/self-evolution.js`
- `src/core/self-evolution/skill-engine.js`
- `src/core/associative-engine/associative-memory.js`
- `src/core/search/semantic-search-core.js`
- `src/core/search/trajectory-search.js`
- `src/core/search/vector-search.js`

### 纯函数模块（误判为 class）
- `src/core/search/search-trace.js`
- `src/core/self-evolution/evolution-metrics.js`
- `src/identity/injection.js`

### 其他
- `src/core/psychology/emotional-memory-bridge.js`
- `src/core/self-evolution/evolution.js`
- `src/core/self-evolution/self-healing.js`

## 失败根因

1. **多 class 文件（18/23）**：文件含多个 class 定义，注入脚本只检测第一个 class 的起始位置。第一个 class 可能没有 `this.name`，导致 A 区代码注入在 class 顶层作用域。
2. **纯函数文件（3/23）**：`module.exports = function` 或函数集合，被误判为 class。A 区 `this._stateTracker` 在非 class 上下文中非法。
3. **复杂导出（2/23）**：混用 class + function 导出，注入点定位错误。

## 教训

1. **跳过策略优于修复策略**：多 class 文件跳过不注入，比尝试精确注入更安全。跳过 18 个文件比修复 18 个错误文件快 10 倍。
2. **先检测后注入**：在注入前先确认 `_stateTracker` 关键字不存在（防止重复注入）。
3. **class 检测必须覆盖三种模式**：`class Name {`、`module.exports = class Name {`、`const Name = class {`。
4. **纯函数模块的 A 区注入**：不能用 `this.xxx`，改用 `const _stateTracker = { ... }` 在模块作用域中。
5. **花括号计数找 class closing**：从 class 起始行逐行计数 `{`/`}`，精确匹配 depth=0 的位置。不要用"最后一个顶格 `}`"的近似方法。
