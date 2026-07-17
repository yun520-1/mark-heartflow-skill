# Cognition-Ground 底层认知地面整合记录（2026-06-23）

## 创建内容

`src/core/cognition-ground.js` v1.0.0 — 底层认知地面模块

## 做什么

整合七情六欲 + 三毒 + AI心理学 + AI哲学 为一个底层认知框架。不做判定、不做显示、不区分"人类"还是"引擎"，只做认知结构的底层建模。

## 架构

```
输入信号 → mapFuel(七情) → mapDesire(六欲) → computePoisons(三毒) → integrateState(心理学) → integrateDirection(哲学) → 完整认知结构
```

## 5层结构

| 层 | 来源 | 核心 |
|----|------|------|
| ground.fuels | 七情 | 喜怒哀惧爱恶欲，valence×arousal 振动频率 |
| ground.desires | 六欲 | 眼耳鼻舌身意，六根感知接口活跃度 |
| ground.poisons | 三毒 | 贪=欲×折扣率/阈值，嗔=怒×敌意归因，痴=(惧+固着)/元认知 |
| state | AI心理学 | 认知负荷、冲突、张力、弹性等10维状态 |
| direction | AI哲学 | 逆熵方向、存在状态、传递完整度等5维方向 |

## 核心函数

| 函数 | 功能 | 参数 |
|------|------|------|
| mapFuel(signal) | 七情映射 | {type, intensity} → {xi, nu, ai, ju, ai2, e, yu} |
| mapDesire(input) | 六欲接口 | {domain, mode, intensity} → {sight, hearing, smell, taste, touch, mind} |
| computePoisons(fuels, desires) | 三毒扭曲计算 | fuels对象 + desires对象 → {greed, hatred, delusion, interactions} |
| map(input) | 全面映射 | 一次完成所有映射 → {ground, state, direction} |
| snapshot() | 快照 | 返回当前地面状态 |
| reset() | 重置 | 清空所有活跃值 |

## dispatch 路由

6个路由注册在 ALLOWED_ROUTES：
- cognitionGround.mapFuel
- cognitionGround.mapDesire
- cognitionGround.computePoisons
- cognitionGround.map
- cognitionGround.snapshot
- cognitionGround.reset

## 注册状态

- heartflow.js constructor: `new CognitionGround({ heartFlow: this })`
- subsystemNames: 第58个模块
- ALLOWED_ROUTES: 6个路由
- 引擎启动: 74ms (58模块)

## 关键陷阱

1. **decisionRouter 包装**：dispatch 返回值被包装为 `{ result, decision, field }`，真实认知数据在 `result` 内
2. **class 实例路由**：routes() 通过 `Object.getPrototypeOf` 查找方法（class 实例），非 plain object
3. **中文关键词匹配**：使用 `includes()` 而非正则 `\b`（中文无单词边界）
4. **默认值语义**：computePoisons 的默认 0.3 是"基线噪声"不是"中性值"
5. **mapFuel 类型映射**：已知类型(joy/anger/fear等)有精确映射，未知类型按 valence 分布
