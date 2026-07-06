# Self-Audit 死代码与版本分析 (2026-06-07)

## 版本不一致

| 源文件 | 版本号 |
|--------|--------|
| `VERSION` 文件 | 2.7.0 |
| `package.json` | 2.7.0 |
| `SKILL.md` (frontmatter) | 2.7.0 |
| `SKILL.md` (title) | 2.7.0 |
| `src/core/version.js` (doc注释) | **2.2.11** ⚠️ |
| `src/core/heartflow.js` (doc注释) | **2.2.5** ⚠️ |

修复：更新 `version.js` 和 `heartflow.js` 顶部的文档注释版本号。

## 死代码分析结果

`extractExports()` 的 regex 只匹配基础导出模式，漏检了 `module.exports = { ... }` 对象字面量导出。实际只找到 9 个文件有导出。

### 可疑导出（零外部引用）

| 文件 | 导出 | 引用数 |
|------|------|--------|
| `BigFivePersonality.js` | `BigFivePersonality` | 0 |
| `EmpathyAssessment.js` | `EmpathyAssessment` | 0 |
| `blind-spot-breaker.js` | `BlindSpotBreaker` | 0 |
| `heartflow-engine.js` | FLOW_STATES, calculateFlowState, detectEmotionFromText, generateStateReminder, FLOW_STATE, transitionToState, getStatePrompt, resetStateMachine, loadStateMachine, saveStateMachine, getAgentManager, handleAgentRequest, startFlowSession, endFlowSession, getAgentStatus, setPrimaryGoal, checkAndNudge | 0 (全部16个) |
| `self-audit.js` | `yyy` (误报) | 0 |
| `code-engine.js` | `${name` (regex误报) | 0 |

### 需人工确认的模块

1. **`heartflow-engine.js`** — 16个导出全部零引用。可能是废弃的 flow state machine 模块，也可能通过动态 `require()` 或 `eval()` 加载。需检查 `heartflow.js` 和所有 `require('./heartflow-engine')` 调用。

2. **`BigFivePersonality.js`** — 整个文件零引用。可能是废弃的大五人格模型模块。

3. **`EmpathyAssessment.js`** — 整个文件零引用。可能是废弃的共情评估模块。

4. **`blind-spot-breaker.js`** — 整个文件零引用。可能是废弃的认知盲点突破模块。

## extractExports 的 regex 局限性

当前 regex 覆盖的模式：
- `module.exports = xxx`
- `module.exports.xxx = ...`
- `exports.xxx = ...`
- `export function xxx / export const xxx`
- `export { xxx, yyy }`
- `export default xxx`

**未覆盖的模式**（导致漏检）：
- `module.exports = { xxx, yyy, ... }` — 对象字面量导出（最常用的 CommonJS 模式）
- `export * from '...'` — 重导出
- `export { default as xxx }` — 带别名的重导出
- `Object.assign(module.exports, { ... })` — 动态导出
