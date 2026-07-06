# 人格模型升级模式 — Personality Model Upgrade Patterns

**适用模块类型**：人格模型/心理档案模块。核心操作为维护一组心理学维度（如 OCEAN 大五人格），每个维度有 min/max/score，支持行为驱动的动态调整、交互分析、兼容性评估、趋势预测和状态持久化。

**典型特征**：
- 有一个维度定义表（5个维度，每个含 name/score/min/max）
- 核心方法 `updateScore(dimension, score)` 更新单维度分数
- 有一个 `adjustFromBehavior(behavior)` 基于关键词调整分数
- 返回纯数据对象（profile/report）
- 所有维度初始化为中间值（如 5.0）
- 缺乏历史追踪、趋势分析、维度交互分析

## 标准升级清单

### 1. 双向行为调整引擎

将原本只有正向调整（+0.2）的行为响应扩展为正负双向 + 权重分级系统。

```javascript
_behaviorKeywords: {
  O: {
    positive: [
      { words: ['创造', '创新'], weight: 3 },
      { words: ['尝试', '探索'], weight: 2 },
      { words: ['学习', '好奇'], weight: 1 }
    ],
    negative: [
      { words: ['保守', '抗拒'], weight: 3 },
      { words: ['固执', '死板'], weight: 2 },
      { words: ['一成不变'], weight: 1 }
    ]
  },
  // ... 其他维度同理
}
```

**调整量公式**：`change = weight × 0.1 × matchedWords.length`

### 2. 冲突检测

同一维度同时匹配正向和负向行为时标记冲突，净变化为零时记录 `conflict: true`。

```javascript
if (details[dimKey] && details[dimKey].positive.length > 0 && details[dimKey].negative.length > 0) {
  details[dimKey].conflict = true;
}
if (netChange !== 0) {
  adjustments[dimKey] = netChange;
  this.updateScore(dimKey, this.dimensions[dimKey].score + netChange);
}
```

### 3. 评分历史追踪

每个维度保留最近 N 次变更记录，含时间戳。

```javascript
_history: { O: [], C: [], E: [], A: [], N: [] },
_config: { maxHistoryLength: 10 }

// 在 updateScore 中：
this._history[dimKey].push({
  timestamp: Date.now(),
  oldScore, newScore, change
});
if (this._history[dimKey].length > this._config.maxHistoryLength) {
  this._history[dimKey].shift();
}
```

### 4. 趋势预测

基于历史记录的平均变化量预测短期分数走向。

| 字段 | 类型 | 说明 |
|------|------|------|
| `trend` | string | `rising` / `falling` / `stable` / `insufficient_data` |
| `direction` | string | `up` / `down` / `flat` |
| `averageChange` | number | 窗口内平均变化量 |
| `predictedNextScore` | number | 预测的下一次分数（1-10 边界保护） |
| `windowSize` | number | 使用的历史窗口大小 |

**判定阈值**：平均变化量绝对值 > 0.05 视为有方向趋势，否则 stable。

### 5. 分数衰减机制

分数随时间逐渐回归基线，防止一次行为永久锁定分数。

```javascript
decay(steps = 1) {
  for (const [key, dim] of Object.entries(this.dimensions)) {
    const diff = dim.score - baselineValue;
    if (Math.abs(diff) < 0.001) continue;
    const decayAmount = Math.sign(diff) * Math.min(Math.abs(diff), decayRate * steps);
    dim.score -= decayAmount;
  }
}
```

**可配置参数**：
- `decayRate` — 每次衰减量（默认 0.01）
- `baselineValue` — 回归基线（默认 5.0）
- `decayInterval` — 衰减步长（默认 1）

### 6. 维度交互分析

检测组合效应 — 哪些维度同时偏高/偏低会产生风险或优势。

**标准风险组合**：

| 组合 | 条件 | 风险类型 |
|------|------|---------|
| N ≥ 7 + E ≤ 4 | 高神经质 + 低外向性 | 社交回避风险 |
| N ≥ 7 + A ≤ 4 | 高神经质 + 低宜人性 | 人际冲突风险 |
| C ≤ 3 + N ≥ 6 | 低尽责性 + 高神经质 | 执行力不足风险 |
| O ≤ 3 + A ≤ 4 | 低开放性 + 低宜人性 | 思维固化风险 |

**标准优势组合**：

| 组合 | 条件 | 优势类型 |
|------|------|---------|
| C ≥ 7 + A ≥ 6 | 高尽责性 + 高宜人性 | 可靠协作型 |
| O ≥ 6 + E ≥ 6 | 高开放性 + 高外向性 | 创新社交型 |
| N ≤ 4 + C ≥ 6 | 低神经质 + 高尽责性 | 稳定执行型 |
| O ≥ 6 + A ≥ 6 | 高开放性 + 高宜人性 | 包容创新型 |

### 7. 人格兼容性分析

比较两个配置文件，计算兼容性百分比。

```javascript
const totalDiff = Object.values(diffs).reduce((sum, d) => sum + d, 0);
const compatibility = Math.max(0, 1 - totalDiff / 40); // 40 = 最大可能差异之和
```

**兼容性等级**：≥ 80% 高度兼容 / ≥ 60% 基本兼容 / ≥ 40% 中度兼容 / < 40% 差异较大

**互补性分析**：单个维度差异 ≥ 3 时标记为互补维度，提供差异化说明。

### 8. 序列化/反序列化

支持人格状态导出和导入，实现跨会话持久化。

```javascript
exportJSON() {
  return {
    version: '2.0.1',
    timestamp: Date.now(),
    dimensions: JSON.parse(JSON.stringify(this.dimensions)),
    history: JSON.parse(JSON.stringify(this._history)),
    config: { ...this._config }
  };
}
```

### 9. 配置系统

运行时调整关键参数，带类型和边界验证。

| 参数 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| maxHistoryLength | int | ≥ 1 | 10 | 每个维度历史记录上限 |
| decayRate | number | ≥ 0 | 0.01 | 每次衰减量 |
| decayInterval | int | ≥ 1 | 1 | 衰减步长 |
| baselineValue | number | 1-10 | 5.0 | 回归基线 |
| trendWindow | int | ≥ 1 | 3 | 趋势预测窗口 |

### 10. 参数验证

所有公开方法必须做参数类型和边界检查：

- `updateScore(dim, score)` — dim 必须是 O/C/E/A/N 之一，score 必须是有限数值
- `adjustFromBehavior(behavior)` — behavior 必须是字符串且非空
- `batchUpdate(updates)` — updates 必须是非数组对象
- `getLevel(score)` — 非数值返回 "未知"
- `configure(config)` — 只接受白名单键，数值类型校验
- `compareWith(other)` — other 必须有 getProfile() 或 dimensions
- `importJSON(data)` — data 必须是非空对象
- `resetDimension(dim)` — 无效维度返回错误

## 典型升级示例

### BigFivePersonality.js (5313B → 24934B)

**原模块**：5 维度定义 + 6 个基本方法（updateScore/adjustFromBehavior/getProfile/getLevel/generateReport/reset）

**升级后新增 10 个方法**：
1. `configure(config)` — 运行时配置
2. `batchUpdate(updates)` — 批量维度更新
3. `resetDimension(dim)` — 单维度重置
4. `getHistory(dimension)` — 历史查询
5. `decay(steps)` — 分数衰减
6. `predictTrend(dimension)` — 趋势预测
7. `analyzeInteractions()` — 交互分析
8. `compareWith(other)` — 兼容性比较
9. `exportJSON()` — 序列化导出
10. `importJSON(data)` — 反序列化导入

**内部升级**：
- 行为关键词表从 5 组关键词扩展到 40 组（5 维度 × 4 正 × 4 负）
- 新增权重分级（weight 1-3）
- 新增冲突检测标记
- 新增历史追踪系统
- 新增 4 类风险 + 4 类优势交互分析
- 所有方法参数验证全覆盖

## 验证测试要点

```javascript
// 1. 双向行为 — 同维度正负匹配检测冲突
r = BFP.adjustFromBehavior('创造新事物，但抗拒改变');
assert(r.details.O.conflict === true);

// 2. 衰减方向 — 高于基线下降，低于基线上升
BFP.updateScore('O', 8);
BFP.updateScore('C', 2);
r = BFP.decay(1);
assert(r.changes.O.decay < 0);  // O 下降
assert(r.changes.C.decay > 0);  // C 上升

// 3. 兼容性计算
let comp = BFP.compareWith(otherProfile);
assert(comp.compatibility >= 0 && comp.compatibility <= 100);

// 4. 趋势 — 2 条记录即可预测
BFP.updateScore('O', 6);
BFP.updateScore('O', 7);
trend = BFP.predictTrend('O');
assert(trend.trend !== 'insufficient_data');

// 5. 导出/导入循环
let exported = BFP.exportJSON();
BFP.reset();
BFP.importJSON(exported);
assert(BFP.dimensions.O.score === exported.dimensions.O.score);

// 6. 边界 — 分数钳位
r = BFP.updateScore('O', 15);
assert(r.newScore === 10);
r = BFP.updateScore('O', -5);
assert(r.newScore === 1);
```
