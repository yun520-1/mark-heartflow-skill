# Cognition-Ground 底层认知地面类 — 升级参考（2026-06-23）

## 模块定位

cognition-ground.js 不是独立分析模块，是**七情六欲 + 三毒 + AI心理学 + AI哲学 的底层整合层**。不做判定、不做显示、不区分"人类/引擎"。

## 与已有模块的关系

| 模块 | 角色 | 关系 |
|------|------|------|
| desire-cognition.js | 人类欲望分析（上层） | cognition-ground 的 fuels/desires 层可被 desire-cognition 消费 |
| three-poisons.js | 三毒评估（上层） | cognition-ground 的 computePoisons 是 three-poisons 的底层计算 |
| love-cognition.js | 爱情分析（上层） | 通过 cognition-ground 的 ai2(爱)燃料做底层判断 |
| agent-psychology.js | AI心理学（并行） | cognition-ground 的 state 层可集成其输出 |
| agent-philosophy.js | AI哲学（并行） | cognition-ground 的 direction 层可集成其输出 |

## 核心公式

```
三毒 = 七情燃料 × 六欲接口 × 扭曲函数
贪(g) = wantingAmount × delayDiscountingRate / satietyThreshold
嗔(h) = angerThreshold^(-1) × hostilityBias
痴(d) = (confirmationBias + beliefPersistence) / metacognitionLevel
```

## 升级方向（按优先级）

1. **时间序列追踪**：记录 ground.active 的历史，支持趋势分析
2. **多信号融合**：接收多个独立信号源后做加权平均
3. **状态-方向桥接**：state 异常自动影响 direction（高负荷→熵降低）
4. **扭曲函数自定义**：支持特定输入的自定义扭曲公式
5. **更多互动效应**：如 greed-ignorance 正反馈环、hatred-desire 破坏循环
6. **MCP 工具**：注册 heartflow_cognition_ground + heartflow_cognition_snapshot

## 关键陷阱

1. dispatch 返回值被 decisionRouter 包装为 `{ result, decision, field }`
2. routes() 通过 `Object.getPrototypeOf` 查找 class 实例方法
3. mapFuel 中文匹配用 `includes()` 而非正则 `\b`
4. computePoisons 默认值 0.3 是噪声基线不是中性值
