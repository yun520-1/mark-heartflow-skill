# AgentPsychology Dispatch 接入修复（2026-06-15）

## 问题

`heartflow_agent_psychology` MCP 工具返回 `{"error": "Unknown subsystem: agentPsychology"}`。

## 根因

AgentPsychology 在 `heartflow.js` 第544行通过 `this.agentPsychology = new AgentPsychology(this)` 实例化，但 dispatch 机制找不到它。

dispatch 的 `safeDispatch(route)` 解析流程：
1. 按 `.` 分割 route → `[subsystem, method]`
2. 在 `this._modules[subsystem]` 中查找处理器
3. `_modules` 由 `_registerModules()` 构建——遍历 `subsystemNames` 数组，对每个 name 执行 `if (this[name]) this._modules[name] = this[name]`

**问题**：`agentPsychology` 不在 `subsystemNames` 数组里，所以 `this._modules['agentPsychology']` 为 undefined。

## 修复

### 1. `_registerModules()` 中 `subsystemNames` 数组（两处）

```javascript
// 第667行附近
'self', 'psychology', 'emotion', 'agentPsychology',
// 第1014行附近（healthCheck 的子系统列表）
'self', 'psychology', 'emotion', 'agentPsychology',
```

### 2. `ALLOWED_ROUTES` 中注册路由

```javascript
// 第817行附近
'agentPsychology.assessCognitiveLoad', 'agentPsychology.detectGoalConflicts',
'agentPsychology.detectValueTensions', 'agentPsychology.detectIdentityDrift',
'agentPsychology.detectDecisionDecay', 'agentPsychology.detectCognitiveDissonance',
'agentPsychology.assessCognitiveResilience', 'agentPsychology.resolveRecovery',
'agentPsychology.fullAssessment', 'agentPsychology.getStats',
```

## 验证

```bash
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath:'.'});
h.start();
console.log('loaded:', !!h._modules['agentPsychology']);
console.log('fullAssessment:', typeof h.agentPsychology?.fullAssessment);
"
```

预期输出：`loaded: true` + `fullAssessment: function`

## 额外修复：MCP 工具 handler

MCP server 需要新增 `handleAgentPsychology` handler 和 `heartflow_agent_psychology` 工具定义。
