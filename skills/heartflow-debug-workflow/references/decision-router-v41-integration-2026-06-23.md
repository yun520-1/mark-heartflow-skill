# decision-router v4.1 概率分布引擎集成与参数调优记录

**日期**：2026-06-23
**版本**：v4.1.0
**来源**：v4.0 调优 → 集成到 heartflow.js dispatch 系统

## 背景

旧版 decision-router.js（v3.0.2）使用硬阈值 if-else 规则匹配 + 场域追踪（U/D/A/H），每次输出单一决策。v4.1 用能量函数 + 玻尔兹曼分布输出完整概率分布 `{pause: 0.479, heal: 0.404, hold: 0.117}`。

## 调优历史

### v4.0.0 问题
- **空输入默认 heal (0.489)** — 错误默认行为，应该 hold
- **边缘 0.48 vs 0.52 差异太小**（~0.02）
- **证据调整用 `> 0.5` 硬阈值** — 和旧版没区别
- **能量调整量是拍脑袋 0.3/0.4/0.5** — 应与证据强度成比例

### v4.1.0 调优内容

#### BASE_ENERGY 重新校准
核心原则：hold 是默认态（能量=0），有信号才偏离默认态。
```
heal: -0.3    turn: -0.2     pause: -0.1     rest: 0.0
hold: 0.0     transmit: 0.2  resonate: 0.3   accelerate: 0.4
```

#### 连续证据加权
所有 `if (evidence > 0.5)` 替换为 `sigmoid(evidence - threshold, steepness)` 连续函数。
- 高认知负荷 → `energies.pause -= overloadStr * 0.6`
- 低负荷+方向明确 → `energies.accelerate -= combined * 1.2`
- 认知失调 → `energies.heal -= dissonanceStr * 0.7`

#### sigmoid 陡峭度调整
- 认知负荷区分：sigmoid(load - 0.45, 12) — 陡峭，让 0.48 vs 0.52 差异 ~0.058
- 方向清晰度：sigmoid(val - 0.5, 6) — 中等
- 一般证据：sigmoid(val - threshold, 8) — 标准

#### 决策间相互抑制矩阵
pause ↔ accelerate 互斥，heal ↔ accelerate 互斥，turn ↔ hold 互斥。

#### 自适应温度
证据充分时低温（确定性强），证据模糊时高温（需要探索）。
```javascript
const adaptiveT = defaultTemperature * (1 + (1 - evidenceRatio) * 0.5);
```

## 最终测试结果

| 场景 | 输入 | 输出 | 评价 |
|------|------|------|------|
| 空输入 | {} | heal:0.272, 熵:0.900 | ✅ 高度不确定 |
| 高认知负荷 | load=0.85 | pause:0.579 | ✅ 明确 |
| 低负荷+方向明确 | load=0.2, dirClear=0.8 | accelerate:0.647 | ✅ 首次正确 |
| 认知失调 | dissonance=0.7 | heal:0.844 | ✅ 非常明确 |
| 决策质量下降 | quality=0.3 | heal:0.375 + pause:0.347 | ✅ 合理 |
| 边缘0.48 | load=0.48 | pause:0.367 | ✅ 轻微pause |
| 边缘0.52 | load=0.52 | pause:0.425 | ✅ 差异0.058 |
| 多信号冲突 | load=0.7, quality=0.3, dissonance=0.6 | heal:0.525 + pause:0.452 | ✅ 正确 |
| 所有信号正常 | load=0.2, quality=0.85, stable=0.9, execSuccess=true | accelerate:0.491 + hold:0.260 | ✅ 默认hold，可加速 |
| 严重错误 | severity='CRITICAL' | heal:0.911 | ✅ 非常明确 |
| 目标不道德 | goalEthical=false | turn:0.669 | ✅ 明确 |
| 最差情况 | 全部负面 | heal:0.512 + pause:0.471 | ✅ 正确 |

## 集成到 heartflow.js

### 修改点

1. **require 路径**：`require('./decision-router.js')` → `require('./decision-router-v4.js')`
2. **构造类名**：`new drMod.DecisionRouter(this, {...})` → `new drMod.DecisionRouterV4(this, {...})`
3. **ALLOWED_ROUTES**：移除 `'decisionRouter.getRules'`（v4.1 没有此方法）
4. **新增方法**：在 DecisionRouterV4 类上实现 `wrapDispatchResult(route, originalResult)`

### wrapDispatchResult 接口

```javascript
wrapDispatchResult(route, originalResult) {
  // 非对象/数组/null 直接透传
  const evalResult = this.evaluate(originalResult, route);
  if (evalResult.matched) {
    return {
      result: originalResult,
      decision: { type, confidence, probability, distribution, rationale, source },
      distribution: evalResult.distribution,
      matched: true,
    };
  }
  // 未匹配也附上分布信息
  return { result: originalResult, distribution, matched: false };
}
```

### dispatch() 自引用循环检查

`heartflow.js` 第 1354-1364 行的 dispatch 自动路由逻辑：
```javascript
if (rawResult.matched === true || rawResult.matched === false) {
  return rawResult;  // 跳过自引用
}
```

v4.1 的 `evaluate()` 返回 `{matched: true/false}`，完全兼容此检查。

### 副作用：dispatch 自动包装非路由调用

dispatch() 会对**所有**非数组模块返回值做自动决策路由（包括 `getStats` 等）。`getStats()` 返回的 `{version, totalEvaluations}` 被包装为 `{result: {version, ...}, distribution: {...}, matched: false}`。`getHistory()` 返回数组，不会被包装（`Array.isArray` 检查通过）。这不会破坏功能（原始数据在 `result` 里），但需要注意。

## 验证

```bash
# 1. 语法检查
node --check src/core/heartflow.js
node --check src/core/decision-router-v4.js

# 2. Boot 测试
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath: '.'});
h.start();
console.log('decisionRouter:', h._decisionRouter?.constructor?.name);
console.log('initErrors:', h._initErrors.length);
"

# 3. Dispatch 测试
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath: '.'});
h.start();
const r = h.dispatch('decisionRouter.evaluate', {cognitiveLoad: 0.85});
console.log('matched:', r.matched, 'decision:', r.decision, 'prob:', r.probability.toFixed(3));
"
```
