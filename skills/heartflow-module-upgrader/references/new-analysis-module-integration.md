# 新增分析模块集成模式 — TimeExtensionEngine 实战案例

## 概述

本文件记录新增一个「分析层模块」到 HeartFlow 的完整模式。以 `time-extension.js`（时间延伸分析层 v1.0.0）为实战案例。

## 模块的类级别归属

| 维度 | 描述 |
|------|------|
| 模块类型 | **分析引擎类** — 消费已有输入产生结构化分析报告，不修改外部状态 |
| 不修改任何已有模块 | 所有分析逻辑自包含 |
| 输出格式 | 结构化数据，可被 philosophy-to-decision 和 decision-router 消费 |
| 生命周期 | 在 `think()` 内部流水线中被调用，结果注入路由提示 |

## 新增分析模块的 5 步集成模式

### 1. 创建模块文件

`src/core/time-extension.js`

**导出模式**：与 HeartFlow 其他模块一致：

```javascript
module.exports = {
  TimeExtensionEngine,
  TimeExtensionReport,
  TimeDimensionAnalysis,
  TIME_DIMENSIONS,
  DOMAIN_TEMPLATES,
  VERSION,
};
```

**构造函数签名**：接收 `heartFlow` 主实例引用（可选，用于获取其他模块数据）：

```javascript
constructor(heartFlow) {
  this.name = 'TimeExtensionEngine';
  this.version = VERSION;
  this.hf = heartFlow;
}
```

### 2. Lazy import（heartflow.js 顶部）

```javascript
// ★ 时间延伸分析层 — v1.0.0
const _TimeExtension = _lazy('timeExtension', () => require('./time-extension.js'));
```

注意：`_lazy` 的 key 必须与 `start()` 中的 `this.xxx` 属性名一致，因为 `_registerModules()` 通过 `this[name]` 查找。

### 3. 初始化（start() 方法中）

```javascript
// ─── 时间延伸分析层（v1.0.0 新增） ─────────────────────────────────────
try {
  const { TimeExtensionEngine } = require('./time-extension.js');
  this.timeExtension = new TimeExtensionEngine(this);
} catch (e) { this._initErrors = this._initErrors || []; this._initErrors.push({ module: 'timeExtension', error: e.message }); }
```

**放置位置**：在 `decisionRouter` 初始化之后、`debate` 初始化之前。遵循"分析类模块放决策路由后、具体功能前"的顺序。

### 4. 注册子系统（_registerModules 中）

```javascript
// v1.0.0 — 时间延伸分析层
'timeExtension',
```

放在 `decisionRouter` 之后。顺序决定了 `dispatch('timeExtension.xxx')` 和 `routes()` 输出的顺序。

### 5. 注册路由（ALLOWED_ROUTES 中）

```javascript
// v1.0.0 — 时间延伸分析层
'timeExtension.analyze', 'timeExtension.quickAnalyze', 'timeExtension.getStats', 'timeExtension.getRecentAnalyses',
```

**注册原则**：只注册公开方法（不注册 `_` 开头的内部方法），且必须保证方法签名安全（不接收原始文件路径、不执行危险操作）。

## think() 中的调用模式

分析层模块通常在 `think()` 的**内部分析流水线**中被调用。调用位置：在 Step 11 (isRightAction) 之后、内部路由决策之前。

### 调用模式模板

```javascript
// Step N: moduleName — 模块描述（在给出任何'怎么做'建议前）
let moduleResult = null;
if (this.moduleName && typeof this.moduleName.methodName === 'function') {
  try {
    // 只在非紧急、非沉默、非技术类问题上触发
    const shouldActivate = !needsCrisis && !needsSilence && !isFableBlocked
      && whatIsThisResult && !whatIsThisResult.isCode;
    if (shouldActivate) {
      // 关键词触发检测（避免对所有输入都做深度分析）
      const triggerKeywords = /(关键词1|关键词2|模式)/i;
      if (triggerKeywords.test(input)) {
        moduleResult = this.moduleName.methodName(input, {
          psychologyResult: psychResult,
          philosophyResult: philResult,
        });
        // 将结果注入路由提示
        if (moduleResult && moduleResult.riskFlags && moduleResult.riskFlags.length > 0) {
          // 根据结果类型调整路由
          if (hasTrap) {
            _routeHint.confidence = Math.min(_routeHint.confidence, 0.4);
          }
          if (hasGrowth) {
            _routeHint._timeExtGrowth = true;
          }
        }
      }
    }
  } catch (e) { /* moduleName analysis non-blocking */ }
}
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 关键词触发 | `if (triggerKeywords.test(input))` | 避免对所有输入做深度分析，节省 token |
| 紧急场景跳过 | `!needsCrisis` | 危机场景不需要时间延伸，需要即时响应 |
| 非阻断 | `try/catch` 静默捕获 | 分析失败不阻塞主流程 |
| 结果注入 | 修改 `_routeHint` | 影响后续路由决策，但不修改用户可见的输出 |

## 模块输出格式设计

分析模块必须支持**两种输出格式**，供下游决策系统消费：

### 主输出（分析报告）

```javascript
{
  subject: '分析对象描述',
  version: '1.0.0',
  timestamp: Date.now(),
  dimensions: { /* 各维度分析 */ },
  overallScore: -1 ~ 1,     // 综合评分
  confidence: 0 ~ 1,        // 综合置信度
  summary: '一句话总结',
  riskFlags: [],             // 风险信号数组
  opportunityFlags: [],      // 机会信号数组
}
```

### 转 philosophy-to-decision 格式

```javascript
report.toDecisionRationale() → {
  module: 'timeExtension',
  version: '1.0.0',
  overallScore: -0.525,
  confidence: 0.34,
  summary: '...',
  risks: [{ dimension, type, severity, description, trend }],
  opportunities: [{ dimension, type, strength, description }],
  signals: {
    urgentNegative: [],    // 短期负面信号
    trendAccelerating: [], // 加速恶化信号
    terminalRisk: [],      // 长期致命风险
    alternativeUpside: [], // 替代方案优势
  },
}
```

### 转 decision-router 格式

```javascript
report.toRouterInput() → {
  source: 'timeExtension',
  type: 'timeExtensionAnalysis',
  score: -0.525,
  confidence: 0.34,
  dimensions: { shortTerm, midTerm, longTerm, alternative },
  metadata: { summary, riskCount, opportunityCount },
}
```

## 跨维度信号检测模式

分析模块常需要检测**跨维度的矛盾信号**，这些是最有价值的路由提示：

| 信号类型 | 检测条件 | 含义 | 路由影响 |
|----------|----------|------|----------|
| 陷阱 (trap) | shortTerm > 0.3 && longTerm < -0.3 | 短期愉悦但长期有害 | 降低置信度至 ≤0.4 |
| 成长 (growth) | shortTerm < -0.3 && longTerm > 0.3 | 短期痛苦但长期有益 | 标记 _timeExtGrowth |

## 版本号管理

新增模块使用 `VERSION` 常量（与 HeartFlow 主版本独立）：

```javascript
const VERSION = '1.0.0';
```

每次重大功能更新 +0.x.0，每次缺陷修复 +0.0.x。主模块版本独立更新，不与 heartflow.js 版本同步。
