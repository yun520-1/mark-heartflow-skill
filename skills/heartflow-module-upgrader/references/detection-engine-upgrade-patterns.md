# 检测/识别引擎类升级模式

## 适用模块
检测/识别引擎类负责从输入中识别特定模式（行为模式、触发词、风险信号等）。典型特征：
- 核心方法返回检测结果（pattern/risk/signal）
- 基于简单计数或关键词包含做判断
- 无输入验证、无置信度评分、无趋势分析、无震荡检测

## 实战案例：pattern-detector.js (1307B → 28537B)

### 原始状态
- `detectWeeklyPattern(records)` — 简单按星期几分组计数，无置信度
- `detectTriggerPattern(records)` — 简单词频统计，无排序/比率
- `detectRelapseRisk(goal)` — 简单失败计数，3段阈值

### 升级清单

1. **ErrorCode 枚举** — 8种错误码，每类带 ERROR_SUGGESTIONS 友好建议
2. **TrendDirection 枚举** — 5种趋势方向（rising/falling/stable/oscillating/insufficient）
3. **ConfidenceLevel 枚举** — 4级置信度，基于数据充足度的 logistic 式评分
4. **输入验证系统** — `_validateRecords()` 和 `_validateGoal()` 统一入口
5. **多因素评估** — 从简单计数改为多因素加权评分
6. **趋势分析** — 半窗比较趋势方向判断
7. **震荡检测** — 序列翻转率分析，双态/多态分类
8. **综合报告** — `generateReport()` 一站式输出
9. **统计追踪** — 7维指标（totalAnalyses/validationErrors/oscillationWarnings等）
10. **健康检查** — 异常检测与告警
11. **可配置系统** — 运行时调参，带边界保护
12. **防御性编程** — `_safeText()`/`_safeNumber()`/`_clamp()` 安全工具
13. **Proxy 包装** — plain object→class 向后兼容

### 标准模板结构

```javascript
// 枚举定义
const ErrorCode = { INPUT_NULL, INPUT_EMPTY, INVALID_TYPE, ... };

// 工具函数
function _safeText(text) { ... }
function _safeNumber(n, fallback) { ... }
function _clamp(value, min, max) { ... }

// 主类
class DetectionEngine {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this._stats = { totalDetections: 0, validationErrors: 0, ... };
    this._history = [];
  }

  // 输入验证
  _validateInput(input) { ... }

  // 核心检测方法（签名不变）
  detectPattern(input, options) {
    // 1. 输入验证
    // 2. 多因素评分
    // 3. 置信度计算
    // 4. 趋势/震荡检测
    // 5. 统计追踪
    // 6. 返回结构化结果
  }

  // 统计查询
  getStats() { return { ...this._stats }; }

  // 健康检查
  healthCheck() { ... }
}

// Proxy 包装（plain object→class 迁移时）
const defaultInstance = new DetectionEngine();
const detector = new Proxy(defaultInstance, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (prop === 'DetectionEngine') return DetectionEngine;
    if (prop === 'ErrorCode') return ErrorCode;
    return undefined;
  }
});

module.exports = { detector, DetectionEngine, ErrorCode, ... };
```

### 关键陷阱
- **Proxy 包装必须**：旧调用者 `detector.method()` 依赖 plain object，class 实例必须用 Proxy
- **配置参数边界保护**：oscillationWindow/oscillationThreshold 必须 _clamp 在合理范围
- **历史大小限制**：_history 数组必须有上限防止内存泄漏
- **stats 不能共享**：每次 new DetectionEngine() 创建独立的 _stats 对象
- **旧方法返回扩展字段**：旧调用者访问 `result.day`/`result.count` 仍然有效，新增字段不破坏兼容
