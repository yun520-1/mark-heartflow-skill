# Semantic Anchor / 语义锚点引擎升级模式

## 适用模块特征

语义锚点/歧义检测引擎类负责**识别输入中的歧义词汇，并基于上下文生成明确的语义定义**。核心流程是 `detectAmbiguity() → generateAnchor() → processMessage()`。

**典型特征**：
- 核心方法 `detectAmbiguity(message, context)` 返回歧义发现列表
- `generateAnchor(term, context)` 基于历史消息提取锚点定义
- 内置歧义模式表（代词/模糊形容词/抽象概念等硬编码关键词列表）
- 基于简单关键词包含（`includes()`）做模式匹配
- 无参数验证/边界检查
- 无震荡检测（同一模糊词反复出现不被感知）
- 无错误统计或降级策略
- 无重试机制（锚定失败直接返回默认值）

**典型升级目标**（案例：semantic-anchor.js v1.0.0 → v2.0.0, 8507B → 21937B）：

---

## 标准升级清单

### 1. 参数验证与边界检查

统一输入验证入口，所有公开方法增加 null/undefined/类型检查。

```javascript
// 参数边界检查工具函数
_clampParam(value, min, max, defaultValue) {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}
```

**需验证的场景**：
- 消息为空/null/undefined → 返回 `{ hasAmbiguity: false, error: '消息为空或无效', errorType: 'invalid_input' }`
- 消息过长（>10000字符）→ 自动截断并记录 `boundaryViolations`
- context 不是对象或 null → 回退为 `{}`
- previousMessages 不是数组 → 回退为 `[]`
- pattern 配置为空字符串/非字符串 → 跳过不处理
- substring 边界检查：确保 start/end 在合法范围内

### 2. 震荡检测

检测同一模糊词在时间窗口内重复出现。这表示用户可能在使用一个不够明确的词，需要更精确的沟通。

```javascript
_detectOscillation(term) {
  const now = Date.now();
  if (!this._oscillationTracker.has(term)) {
    this._oscillationTracker.set(term, {
      count: 1, lastSeen: now, timestamps: [now]
    });
    return { detected: false, count: 1, frequency: 0 };
  }
  const record = this._oscillationTracker.get(term);
  // 清除窗口外旧记录
  record.timestamps = record.timestamps.filter(t => (now - t) < windowMs);
  record.timestamps.push(now);
  record.count = record.timestamps.length;
  // 计算频率（次/分钟）
  const elapsed = Math.max(1, now - record.timestamps[0]);
  const frequency = (record.count / elapsed) * 60000;
  const detected = record.count >= threshold;
  return { detected, count: record.count, frequency };
}
```

**关键配置**：
- `oscillationWindowMs`：时间窗口（默认 60000ms = 1分钟）
- `oscillationThreshold`：触发阈值（默认 3次）
- 时间戳列表长度限制（默认 100），防止内存泄漏

**输出集成**：
- `detectAmbiguity()` 的 findings 中增加 `oscillationDetected/oscillationCount/oscillationFrequency`
- 震荡结果标记 `needsAnchoring = true`（即使置信度高）
- `processMessage()` 的 `needsClarification` 受震荡影响

### 3. 降级策略与重试机制

当锚定完全失败时，使用备选方案而非返回空结果。

**重试机制**：
- 最多重试 `maxRetriesPerAnchor` 次（默认 3）
- 指数退避：100ms, 200ms, 400ms
- 成功则跳出重试循环

**三级回退策略**：
```javascript
this._fallbackStrategies = [
  'exact_text_repeat',       // "用户使用了'X'，无法从上下文中找到明确的对应关系"
  'ask_clarification',       // 需要更多上下文
  'use_default_definition'   // 通用默认定义
];
```

**输出标记**：
- anchor 结果中增加 `retriesUsed` 和 `fallbackUsed` 字段
- 降级时置信度降至 0.15（而非 0.3）

### 4. 错误分类与统计

```javascript
this._errorStats = {
  totalAnchorsAttempted: 0,  // 总锚定尝试数
  totalAnchorsFailed: 0,     // 总失败数
  totalRetries: 0,           // 总重试次数
  oscillationDetections: 0,  // 震荡检测数
  fallbackUsed: 0,           // 降级使用数
  boundaryViolations: 0      // 边界违规数
};
```

**对外接口**：`getErrorStats()` 返回深拷贝副本

### 5. 异常恢复

- `processMessage()` 顶层 try-catch 确保即使异常也返回安全结果
- 单个锚定失败不中断整体流程（继续处理其他模糊词）
- 构造函数后执行 `_validateInitialState()` 验证全部字段完整性
- `generateClarificationQuestion()` 增加震荡感知：震荡中的词自动生成包含频率信息的澄清问题

### 6. 增强的置信度计算

```javascript
calculateConfidence(term, context) {
  if (typeof term !== 'string') return this.minConfidenceThreshold;
  const previousMessages = context?.previousMessages;
  if (!Array.isArray(previousMessages) || previousMessages.length === 0) {
    return this.minConfidenceThreshold; // 默认 0.3
  }
  const recent = previousMessages.slice(-3);
  let matches = 0;
  for (const msg of recent) {
    if (typeof msg === 'string' && msg.toLowerCase().includes(term)) {
      matches++;
    }
  }
  if (matches === 0) return 0.4;
  const ratio = matches / recent.length;
  if (ratio >= 0.66) return 0.85;
  if (ratio >= 0.33) return 0.7;
  return 0.5;
}
```

**关键参数**：
- `minConfidenceThreshold`：无上下文基线（默认 0.3）
- `mediumConfidenceThreshold`（默认 0.6）
- `highConfidenceThreshold`（默认 0.8）
- 所有阈值受 `_clampParam()` 边界保护

### 7. 增强的格式化输出

```javascript
formatInternalNote(anchors) {
  // 空值保护：检查数组和每个元素
  if (!Array.isArray(anchors) || anchors.length === 0) return null;
  const lines = [];
  for (const a of anchors) {
    if (!a || !a.finding || !a.anchor) continue;
    const term = a.finding.term || '?';
    const def = a.anchor.definition || '?';
    const confidence = a.anchor.confidence !== undefined
      ? ` (置信度:${Math.round(a.anchor.confidence * 100)}%)`
      : '';
    lines.push(`模糊词: ${term}, 我理解为: ${def}${confidence}`);
  }
  if (lines.length === 0) return null;
  return `[语义锚定] ${lines.join('; ')}`;
}
```

### 8. 构造函数参数化

所有配置参数应通过 options 对象传入，并有边界保护：
- `maxHistorySize`（默认 100）
- `maxUnresolvedPerMessage`（默认 5）
- `maxRetriesPerAnchor`（默认 3）
- `oscillationWindowMs`（默认 60000）
- `oscillationThreshold`（默认 3）

### 9. 模块级导出

```javascript
module.exports = { SemanticAnchor };
```

## 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| v2.0.0 | 2026-06 | 增加参数验证、边界检查、震荡检测、降级策略、重试机制、错误分类与统计、异常恢复 |

## 关键陷阱

### 1. 震荡检测的时间戳管理
震荡检测依赖时间戳数组，必须：
- 每次检测前清除窗口外的旧时间戳
- 限制数组长度（默认 100），防止长期运行导致内存泄漏
- 频率计算用 `(count / elapsed) * 60000`，注意 elapsed 最小值为 1ms

### 2. 降级策略顺序
回退策略列表顺序 = 优先级顺序。最具体的策略在前（exact_text_repeat），最通用的在后（use_default_definition）。按需选择第一个策略即可。

### 3. processMessage 的异常保护
`processMessage()` 是整个模块的公共入口，必须做 try-catch 保护。即使内部所有逻辑都崩溃，也要返回安全的结果对象，包含 `error` 和 `errorType` 字段。

### 4. 向后兼容
原有接口签名必须保持：
- `detectAmbiguity(message, context)` 返回值中 `hasAmbiguity/findings/needsAnchoring` 字段必须存在
- `generateAnchor(term, context)` 返回值中 `term/definition/source/alternatives/confidence/timestamp` 字段必须存在
- `processMessage()` 返回值中 `needsAnchor/message/internalNote` 字段必须存在
- 新增字段（`oscillationDetected/retriesUsed/fallbackUsed/error/errorType`）只能作为可选附加

### 5. generateAnchor 的重试循环
重试循环必须用 `while (retries <= maxRetriesPerAnchor && anchors.length === 0)`。在同步 JavaScript 中，重试的 busy-wait 可以通过 `Date.now()` 循环实现（虽然不理想，但在无异步 API 的场景下是必要折衷）。

### 6. 震荡澄清问题
当检测到震荡时，`generateClarificationQuestion()` 应返回包含频率信息的更有针对性问题，而非通用问题。例如：
```
"我注意到您多次提到'这个'（5次），为了更准确地理解您，能具体说明一下您想表达的意思吗？"
```

### 7. 空值保护的层次
- 顶层（processMessage）：检查输入有效性
- 中层（detectAmbiguity）：检查 context 结构完整性
- 底层（generateAnchor）：检查单个 term 有效性
- 所有层必须独立处理，不能假设上层已检查过
