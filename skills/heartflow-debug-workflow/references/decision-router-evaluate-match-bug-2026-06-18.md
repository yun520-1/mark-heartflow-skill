# Decision Router `evaluate()` match-before-confidence Bug

**发现日期**：2026-06-18
**版本**：v3.0.2
**模块**：`src/core/decision-router.js`

## Bug 描述

`evaluate()` 方法在遍历决策规则时，只调用了 `rule.confidence(result)` 来检查置信度是否 > 0，**没有先调用 `rule.match(result)` 判断是否匹配**。这导致所有 `confidence` 返回非零值的规则都进入了匹配列表，即使 `match` 返回 `false`。

## 触发路径

```
evaluate({ cycleCount: 1, enabled: true, healthScore: 100, ... }, 'evolution.getStats')
  → 遍历 19 条规则
  → error-severity 规则: confidence = 0.95 (硬编码) ✓
  → belief-broken 规则: confidence = 0.85 ✓
  → execution-failure 规则: confidence = 0.8 ✓
  → 5 条规则全部入选
  → 返回 { matched: true, decision: { type: 'heal', ... } }
```

实际这些规则应该全部不匹配——`evolution.getStats()` 没有 `severity`、`ok`、`success` 等字段。

## 根因代码

```javascript
// 错误：只检查 confidence，跳过 match
for (const rule of this._rules) {
  try {
    const confidence = rule.confidence(result);
    if (confidence <= 0) continue;
    // ... 直接加入 matches
  } catch (e) { /* skip */ }
}
```

## 修复

```javascript
for (const rule of this._rules) {
  try {
    // 先检查 match，再计算 confidence
    if (!rule.match(result)) continue;
    const confidence = rule.confidence(result);
    if (confidence <= 0) continue;
    // ... 加入 matches
  } catch (e) { /* skip */ }
}
```

## 影响范围

- 所有通过 dispatch 路由的模块返回值都可能被错误注入 `{ result, decision }` 包裹
- 特别影响 `MCP status` 中的 `qtable` 字段（原 `evolution.getStats` 返回值）
- `wrapDispatchResult()` 在 dispatch 中调用时也受影响

## 关联问题：dispatch 决策路由自引用

dispatch() 中的决策路由注入代码会检测返回值并尝试匹配规则。`decisionRouter.evaluate()` 返回 `{ decision, matched, rules }` — 其中 `matched: true` 会匹配 `belief-stable` 规则（条件是 `r.ok !== undefined && r.ok === true`，但 `matched: true` 不满足 `ok` 条件——实际上 matched: true/false 本身被 `in` 检查为属性存在，但在 match 函数中 `r.ok !== undefined` 不成立所以不会匹配）。实际触发的是 `error-severity`（因为 `confidence` 不检查 `match`），被修复后不再触发。

## 关联问题：ALLOWED_ROUTES 缺失

`decisionRouter.*` 和 `philosophyToDecision.*` 路由不在 `ALLOWED_ROUTES` 白名单中。MCP handler 通过 `safeDispatch()` 调用时被权限系统拦截，返回 `"Route not allowed"`。

修复：在 `ALLOWED_ROUTES` Set 末尾添加：
```javascript
'philosophyToDecision.decide', 'philosophyToDecision.getStats', 'philosophyToDecision.getCurrentAdvice',
'decisionRouter.evaluate', 'decisionRouter.getStats', 'decisionRouter.getHistory', 'decisionRouter.getRules',
```
