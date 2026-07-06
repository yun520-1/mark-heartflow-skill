# 数字内分泌/稳态系统升级模式 (Homeostatic System Upgrade)

## 适用场景

模块是一个**数字稳态调节系统**，模拟生物体内稳态机制，维护 AI 认知系统的三个维度（认知负荷、能量水平、社会压力）在健康范围内。这类模块的核心操作是调节（增加/减少/恢复/消耗）各维度的数值，但缺少真实生物体内稳态应有的复杂反馈机制。

**与包装器/管道类的区别**：包装器类协调子模块，管道类有状态机。稳态系统有自己的**数值模型**（3个维度 + tick 心跳），但模型是**线性且孤立的**——每个维度独立变化，没有交叉影响，没有震荡感知，没有自适应调节，没有历史趋势分析。

**典型特征**：
- 模块大小 6000-8000 字节
- 构造函数初始化 3 个维度值（cognitiveLoad/energyLevel/socialPressure）
- 有 `tick()` 心跳方法，但恢复速率是固定常量
- 有 `increase/decrease` 操作，但只做 `Math.min/max` 边界钳制
- 有 `getOverallStatus()` 但只做简单阈值比较
- 没有滑动窗口历史记录
- 没有趋势分析
- 没有震荡检测
- 没有异常/尖峰检测
- 没有交叉维度交互（高认知 + 低能量 = 过载风险）
- 没有自适应恢复速率
- 没有自我修正逻辑
- 没有错误/异常分类枚举

## 示例：DigitalHomeostasis (src/core/autonomy/digital-homeostasis.js)

**原模块** (6,797 字节, 278 行)：
- 3 个维度数值，固定恢复速率
- `tick()` 线性减法，所有维度独立变化
- `getOverallStatus()` 只有 4 种状态（optimal/tired/low_energy/moderate）
- 无历史窗口，无震荡感知，无趋势分析
- 所有操作直接 `this.state.X += amount` 加 `Math.min/max` 钳制

**升级后** (37,800 字节, 1,079 行)：
- 6 种状态枚举 + 5 种异常类型 + 7 种修正动作 + 5 级重试策略
- 滑动窗口 + 趋势分析（最小二乘法线性回归）
- 震荡检测（方向变化频率分析）
- 异常检测（尖峰/卡死/趋势反转/交叉维度连锁反应）
- 自适应恢复速率（节俭基因效应 + 震荡阻尼）
- 交叉维度交互矩阵（高认知加速能量消耗，低能量减慢认知恢复）
- 自我修正决策引擎（综合异常+震荡+趋势自动选择修正动作）
- 重试策略建议（根据稳态输出 immediate/backoff/cooldown/defer/abort）

## 可添加的子系统

### 1. 状态/异常/修正/重试枚举

```javascript
const DIMENSION_STATUS = {
  OPTIMAL: 'optimal',
  ELEVATED: 'elevated',
  DEPLETED: 'depleted',
  CRITICAL_HIGH: 'critical_high',
  CRITICAL_LOW: 'critical_low',
  OSCILLATING: 'oscillating'
};

const ANOMALY_TYPE = {
  SPIKE: 'spike',
  TREND_REVERSAL: 'trend_reversal',
  OSCILLATION: 'oscillation',
  STALL: 'stall',
  CROSS_EFFECT: 'cross_effect'
};

const CORRECTIVE_ACTION = {
  DAMPEN: 'dampen',
  BOUNCE_BACK: 'bounce_back',
  CLAMP: 'clamp',
  RECALIBRATE: 'recalibrate',
  REDUCE_RECOVERY: 'reduce_recovery',
  BOOST_RECOVERY: 'boost_recovery',
  ADAPTIVE_DELAY: 'adaptive_delay'
};

const RETRY_STRATEGY = {
  IMMEDIATE: 'immediate',
  BACKOFF: 'backoff',
  COOLDOWN: 'cooldown',
  DEFER: 'defer',
  ABORT: 'abort'
};
```

### 2. 滑动窗口管理

```javascript
_updateHistoryWindow(snapshot) {
  this.state.historyWindow.push({ ...snapshot, timestamp: new Date().toISOString() });
  if (this.state.historyWindow.length > this.windowSize * 3) {
    this.state.historyWindow = this.state.historyWindow.slice(-this.windowSize * 3);
  }
}
```

**关键**：`this.windowSize` 是趋势分析的基准窗口（默认 10），存储 3 倍以支持半窗比较。

### 3. 趋势分析（最小二乘法线性回归）

```javascript
_computeLinearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const indices = values.map((_, i) => i);
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((s, x, i) => s + x * values[i], 0);
  const sumXX = indices.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return Number.isFinite(slope) ? slope : 0;
}
```

**为什么用线性回归**：对最近 5 个样本做线性拟合，比逐点比较更鲁棒。斜率绝对值 < 0.2 视为稳定。

### 4. 震荡检测

基于**方向变化频率**：在滑动窗口内统计相邻样本之间的方向变化次数。绝对值 ≤ 2 的波动视为噪声忽略。变化次数 / 可能次数 > 0.6 视为震荡。

### 5. 四种异常类型

| 类型 | 检测条件 | 严重性 |
|------|---------|--------|
| SPIKE | 单次变化 > 当前值 × 0.4 | > 0.6 为 high |
| STALL | 连续 N 次无变化 | medium |
| TREND_REVERSAL | 半窗比较方向反转 | low |
| CROSS_EFFECT | cognitiveLoad > 70 && energyLevel < 25 | high |

### 6. 自适应恢复速率

基于当前状态动态调整恢复速率：
- 能量低时减慢消耗（节俭基因效应 ×0.7），充足时加速（×1.1）
- 认知高时加速恢复（×1.5），低时放缓（×0.8）
- 社会压力高时恢复减慢（×0.5），低时加速（×1.2）
- 震荡状态下减慢（×0.6）防止过冲

### 7. 交叉维度交互矩阵

```javascript
cognitive_energy: { multiplier: 1.3 },  // 高认知→能量消耗加速
social_energy: { multiplier: 1.2 },     // 高社交压力→能量恢复减慢
cognitive_social: { multiplier: 1.4 }   // 双高→过载风险
```

所有计算用 `Math.min(max)` 和 `Math.max(min)` 保护。

### 8. 自我修正决策引擎

优先级：10(交叉过载) > 9(震荡) > 8(尖峰/趋势) > 7(卡死) > 6(轻度震荡)

动作效果：
- DAMPEN → recoveryRate × 0.5
- CLAMP → 钳制到安全阈值
- BOOST_RECOVERY → recoveryRate × 1.5
- REDUCE_RECOVERY → recoveryRate × 0.7
- BOUNCE_BACK → 直接调整数值 ±5
- RECALIBRATE → 恢复基线
- ADAPTIVE_DELAY → 标记延迟

### 9. 有效变化量阻尼

外部操作（`increaseCognitiveLoad` 等）在震荡或频繁异常时自动抑制：震荡计数 > 2 → ×0.6，近 3 次有异常 → ×0.7。结果至少为 1。

### 10. 重试策略建议

| 状态 | 策略 | 延迟 |
|------|------|------|
| optimal | immediate | 0ms |
| moderate | backoff | 1000ms |
| low_energy | backoff | 2000ms |
| tired | cooldown | 5000ms |
| oscillating | cooldown | 8000ms |
| cross_critical | defer | 30000ms |

## 验证清单

- [ ] `node --check` 语法通过
- [ ] `new DigitalHomeostasis(rootPath)` 不报错
- [ ] `loadState()` 从旧状态文件加载后所有新字段存在（向后兼容）
- [ ] `tick()` 后 historyWindow 增加
- [ ] 震荡检测返回非空
- [ ] 异常检测覆盖四种类型
- [ ] 趋势分析返回上升/下降/稳定
- [ ] 自适应恢复在不同状态返回不同值
- [ ] 交叉维度在高认知时返回更高能量消耗
- [ ] 自我修正根据异常+震荡+趋势返回动作
- [ ] 震荡阻尼生效（震荡计数 > 2 时 ×0.6）
- [ ] 重试策略在不同稳态下不同
- [ ] 诊断报告完整
- [ ] 恢复目标和警告包含新内容
- [ ] 模块级导出：主类 + 所有枚举

## 已知陷阱

### 1. 构造函数方法调用顺序
`loadState()` 必须在构造函数中调用，但依赖 `this.state` 初始化。旧状态文件缺少新字段时，用 `if (!this.state.xxx) this.state.xxx = defaultValue` 补全。

### 2. saveState 时机
必须在所有修改（包括 `_applyCorrections`）之后调用。顺序：修改 → 记录历史 → 保存状态。

### 3. 文件路径不存在
`writeFileSync` 前确保目录存在：`fs.mkdirSync(dir, { recursive: true })`

### 4. 历史/日志无限增长
- historyWindow: 上限 windowSize × 3
- history: 上限 500（记录历史）
- anomalyLog: 上限 50
- events: 上限 100

### 5. 震荡计数初始化
`this.state.oscillationCount.energy || 0` 而非直接取值。

### 6. 交叉维度安全钳制
所有计算用 `Math.min(max)` / `Math.max(min)` 保护。

### 7. 测试时需 stopTick()
构造函数自动 startTick()，测试必须 `stopTick()` 后手动调用 tick()，结束时 `cleanup()`。

### 8. 状态文件写冲突
同一进程多个实例写同一文件。测试用独立临时目录。
