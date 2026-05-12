# HeartFlow 引擎自检方法论 v1.0

> 来源：2026-05-10 系统化引擎审查

## 核心原则

**自己对自己代码跑模拟运行，不是读代码**。实际调用 + 观察返回值，暴露测试/文档没写的 API 错配。

## 标准流程（三阶验证）

### 第一阶：模块加载测试
```javascript
// 每个模块独立加载，捕获加载失败
node -e "const m = require('./module.js'); console.log('OK')"
```
目标：确认无语法错误、依赖完整。

### 第二阶：导出方法探测
```javascript
// 不查文档，直接问运行时
node -e "
const M = require('./module.js');
const instance = new M.ClassName();
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(m => !m.startsWith('_')).join(', '))
"
```
输出真实 API 列表，对比测试代码使用的方法名。

### 第三阶：跨模块调用链验证
```javascript
// 模拟真实调用上下文
const result = module.method({ real: 'context' });
console.log(Object.keys(result)); // 确认返回结构
console.log('decision:', result.decision ?? result.finalDecision?.decision);
```
注意：多层嵌套对象（`guardianDecision.decision` vs `finalDecision.decision`）必须验证实际路径。

## 常见错误模式

### API 签名错配
| 模块 | 错误假设 | 正确签名 |
|---|---|---|
| `MemoryManager` | `store({object})` | `store(string, metadata)` |
| `SelfHealing` | `sh.run()` | `sh.recover()` |
| `EmotionEngine` | `e.detectEmotion()` | `e.detectEmotionFromText()` |
| `MeaningfulMemory` | `mm.store()` | `mm.remember()` |

### 返回值路径错配
- `GuardianSystem.decide()` → 返回嵌套对象，`decision` 在 `finalDecision.decision`，不是顶层
- `CostAwareDecision.evaluate()` → `decision: 'EXECUTE'/'NO_ACTION'`，`action` 可能为 `undefined`（已修复防御）

## 本次验证结果

| 模块 | 状态 | 关键 API |
|---|---|---|
| heartflow-engine | ✅ | 主入口，all sub-modules |
| GuardianSystem | ✅ | `decide()` → `finalDecision.decision` |
| CostAwareDecision | ✅ | `evaluate(action, context)` → `decision` |
| EmotionEngine | ✅ | `detectEmotionFromText(text)` |
| SelfHealing | ✅ | `recover({error, context})` |
| MeaningfulMemory | ✅ | `remember(obj)` + `recall(query)` |
| MemoryManager | ✅ | `store(str, meta)` + `recall(str)` |
| DreamLoop | ✅ | `generateDream(opts)` → Promise |
| DecisionExecutionLoop | ✅ | `execute({decision, context})` |
| CognitiveEngine | ✅ | 已加载 |
| BioSignalAdapter | ✅ | 已加载 |
| ContinuousLearner | ✅ | 已加载 |
| ContextMemoryBridge | ✅ | 已加载 |

## 关键修复记录

**CostAwareDecision `action=undefined` 崩溃**（2026-05-10 已修复）
- 位置：`cost-aware-decision.js:79`
- 根因：`evaluate()` 无 action 时直接传 cost 函数，`action.toLowerCase()` 抛 TypeError
- 修复：`evaluate()` 加 guard；三个 cost 函数入口加 `if (!action) return`
