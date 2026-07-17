# Plain Object → Class 升级模式 — Plain Object to Class Migration Patterns

**适用场景**：升级使用 `const X = { method1() {}, method2() {} }; module.exports = X;` 模式的旧模块。

## 问题描述

心虫早期模块使用 plain object 模式（非 class），通过 `module.exports = X` 导出单例。升级为 class 时面临两个矛盾需求：

1. **新功能需要 class** — 状态管理（`this._history`）、配置系统（`this._config`）、多实例支持
2. **旧调用者依赖单例** — `require('./BigFivePersonality.js')` 期望返回可直接调用的对象，而非需要 `new` 的类

## 解决方案：Proxy 包装 + 双重导出

### 核心架构

```
模块导出（module.exports）= Proxy 包装的单例对象
  ├── 所有 class 方法直接可调用（obj.method()）
  ├── 支持 new X.BigFivePersonalityClass() 创建独立实例
  └── 支持 const { BigFivePersonalityClass } = require(...)
```

### 代码模板

```javascript
// ====== 真正的 class ======
class BigFivePersonalityClass {
  constructor(config = {}) {
    // 状态在 this 上管理
    this._config = { ...DEFAULTS, ...config };
    this._history = { O: [], C: [], E: [], A: [], N: [] };
    this._stats = { totalUpdates: 0, totalAdjustments: 0, ... };
    // 维度定义（不可变）
    this.dimensions = { ... };
  }
  
  updateScore(dim, score) { /* 使用 this */ }
  getProfile() { /* 使用 this */ }
  // ... 所有新方法
}

// ====== 默认单例（向后兼容） ======
const defaultInstance = new BigFivePersonalityClass();

// Proxy 包装：对旧调用者暴露实例方法
// 同时对 require 解构暴露类本身
const BigFivePersonality = new Proxy(defaultInstance, {
  get(target, prop) {
    // 返回实例的方法/属性（旧调用者直接调用）
    if (prop in target) return target[prop];
    // 返回构造函数本身（用于 new BigFivePersonalityClass()）
    if (prop === 'BigFivePersonalityClass') return BigFivePersonalityClass;
    return undefined;
  }
});

module.exports = BigFivePersonality;
module.exports.BigFivePersonalityClass = BigFivePersonalityClass;
```

### 关键设计决策

| 决策 | 原因 |
|------|------|
| Proxy 而非 Object.assign | Proxy 能拦截 `prop in target` 检查，新方法自动暴露；Object.assign 会在加载时复制所有方法，后续动态添加不生效 |
| 导出 class 为具名属性 | 支持 `const { BigFivePersonalityClass } = require('./X.js')` 解构，这是 Node.js 的标准模式 |
| 单例在模块作用域创建 | 保证所有 `require('./X.js')` 调用者共享同一实例，行为与旧模块一致 |

## 验证清单

升级后必须验证：

1. **旧调用者不崩溃**：
```javascript
const X = require('./X.js');
X.updateScore('O', 7);  // 必须能直接调用，不需要 new
X.getProfile();          // 必须工作
```

2. **新调用者可创建独立实例**：
```javascript
const { BigFivePersonalityClass } = require('./X.js');
const instance1 = new BigFivePersonalityClass({ decayRate: 0.1 });
const instance2 = new BigFivePersonalityClass({ decayRate: 0.01 });
// 两个实例状态互不干扰
```

3. **默认单例状态共享**（如果多个旧调用者引用同一模块）：
```javascript
const A = require('./X.js');
const B = require('./X.js');
A.updateScore('O', 8);
console.log(B.getProfile().O.score);  // 必须也是 8（共享同一实例）
```

## 对比：class 直接导出

**不推荐的做法**（会破坏所有旧调用者）：
```javascript
// ❌ 破坏性变更：旧调用者期望直接调用方法
module.exports = class BigFivePersonalityClass { ... };
// 旧代码 X.updateScore('O', 7) → TypeError: X.updateScore is not a function
```

**正确做法**：保留旧导出格式，通过 Proxy 实现无缝过渡。

## 实战案例：BigFivePersonality.js (5313B → 24421B)

**升级前**：plain object，6 个方法，无状态管理
**升级后**：class + Proxy 单例，17 个方法，完整状态/配置/序列化系统
**旧调用者兼容**：`heartflow-engine.js` 中使用 `BigFivePersonality.updateScore()`、`BigFivePersonality.getProfile()`、`BigFivePersonality.generateReport()` — 全部正常工作，无需任何修改

**升级后引用方式**：
- `const BFP = require('./BigFivePersonality.js')` → 默认单例（旧调用者）
- `const { BigFivePersonalityClass } = require('./BigFivePersonality.js')` → 类本身（新调用者）
- `new BigFivePersonalityClass(config)` → 独立实例（需要隔离状态时使用）
