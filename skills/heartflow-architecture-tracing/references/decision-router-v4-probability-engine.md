# 决策路由 v4：概率分布 + 能量函数

> 2026-06-23 session 产物。从硬阈值规则引擎升级为概率分布决策引擎。

## 为什么需要 v4

旧版 decision-router（v3）的 26 条规则使用硬阈值：
```javascript
match: (r) => r.cognitiveLoad > 0.7  // 确定性边界
confidence: (r) => load > 0.9 ? 0.9 : 0.6  // 拍脑袋
```

问题：
1. 输入 0.69 → 不匹配 → 完全不处理
2. 输入 0.71 → 匹配 → confidence=0.6
3. 0.69 和 0.71 几乎一样，但行为完全不同
4. 多条规则同时命中时，只有第一条有效
5. 优先级排序是手写的，不是从数据中学习的

## v4 核心设计

### 1. sigmoid 平滑阈值

```javascript
function sigmoid(x, k = 10) {
  return 1 / (1 + Math.exp(-k * x));
}
// k=10 让过渡区集中在阈值附近
// 输入 0.48 → P(命中)=0.45
// 输入 0.52 → P(命中)=0.55
// 输入 0.70 → P(命中)=0.88
```

不再是 "命中了/没命中" 的二元状态，而是 0-1 的连续概率。

### 2. 能量函数替代优先级排序

```javascript
const BASE_ENERGY = {
  heal: -0.8,    // 自愈最高优先级（能量最低）
  turn: -0.6,
  pause: -0.4,
  rest: -0.2,
  transmit: 0.0,
  resonate: 0.2,
  accelerate: 0.4,
  hold: 0.6,     // 坚守最低优先级（能量最高）
};

// 每条命中的规则降低对应决策的能量
energies.pause -= evidence['cognitive-overload'] * 0.5;
energies.heal -= evidence['cognitive-dissonance'] * 0.5;
```

证据越强，能量降低越多，该决策的优先级越高。

### 3. 玻尔兹曼分布

```javascript
function boltzmannProb(energies, T = 0.5) {
  // P(i) = exp(-E_i / T) / Σ exp(-E_j / T)
  // T 控制"随机性"：
  //   T→0: 完全确定性（等价旧版）
  //   T=0.5: 适度概率（推荐）
  //   T→∞: 完全随机（探索模式）
}
```

### 4. 所有规则同时贡献

旧版：按优先级顺序检查，第一条命中即止
v4：所有 26 条规则同时评估，各自贡献能量调整

## 对比测试结果

| 场景 | 旧版输出 | 新版概率分布 |
|------|----------|-------------|
| 高认知负荷(0.85) | pause | pause=0.417, heal=0.329, turn=0.169 |
| 认知失调(0.75) | heal | heal=0.790（高度确定） |
| 多信号冲突 | 只显示第一个命中的 | pause=0.479, heal=0.404（两条路都开了） |
| 边缘(0.48 vs 0.52) | 一个匹配一个不匹配 | 渐变：0.48→pause=0.268, 0.52→pause=0.268（几乎一样） |

## 与 API 推理引擎的关系

v4 是**本地概率引擎**，不调 API。它和 API 推理引擎是**双轨验证**的关系：

```
本地概率引擎 (v4)
  ↓ 输出概率分布 { pause: 0.4, heal: 0.3, ... }
API 推理引擎 (o1/Claude/...)
  ↓ 输出结构化分析
心虫调度层
  ↓ 对比两个结果
  一致 → 高置信度直接输出
  冲突 → 触发深度校验
```

## 文件位置

- 源码：`src/core/decision-router-v4.js`
- 旧版：`src/core/decision-router.js`（保留不动）
- 测试：`tests/compare-decision-router.js`

## 已知问题

1. 温度参数 T=0.3 还不够敏感——sigmoid 的 k 值需要根据实际数据调优
2. BASE_ENERGY 的值是拍脑袋的，应该从历史数据中学习
3. 证据权重（如 `evidence['cognitive-overload'] * 0.5` 中的 0.5）也是手写的
4. 空输入时默认输出 heal=0.489——应该输出一个均匀分布或 error
