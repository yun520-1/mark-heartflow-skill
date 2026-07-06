# 文本生成器类升级模式

## 适用场景

模块负责**逐词/逐步生成文本响应**，核心是 `generateResponse()` 或 `process()` 循环方法，每次迭代选择下一个输出单元。与管道类不同，生成器类不是协调多个子模块，而是**在一个生成循环中反复决策「下一个输出是什么」**。

## 示例：word-by-word-generator.js (6,932B → 20,805B)

**原模块**：`src/core/associative-engine/word-by-word-generator.js`
- 224行，1个类，核心方法 `generateResponse(thoughtVector, userModel, maxLength)`
- `predictNextWord()` 基于简单随机概率选择
- 无输入验证 — null thoughtVector 直接崩溃
- 无震荡检测 — 可无限重复相同词
- 无漂移检测 — 不检查生成内容是否偏离主题
- userModel 参数接收但不使用
- `pickFrom()` 在空数组时返回 undefined

## 可添加的子系统

### 1. 输入验证系统

```javascript
_validateThoughtVector(thoughtVector) {
  if (!thoughtVector) {
    return { valid: false, error: 'thoughtVector 为 null/undefined', category: 'invalid_input' };
  }
  if (typeof thoughtVector !== 'object' || Array.isArray(thoughtVector)) {
    return { valid: false, error: 'thoughtVector 类型错误', category: 'invalid_input' };
  }
  if (!thoughtVector.dimensions || typeof thoughtVector.dimensions !== 'object') {
    return { valid: false, error: 'thoughtVector.dimensions 缺失或无效', category: 'invalid_input' };
  }
  if (!thoughtVector.emotion || typeof thoughtVector.emotion !== 'object') {
    return { valid: false, error: 'thoughtVector.emotion 缺失或无效', category: 'invalid_input' };
  }
  return { valid: true };
}
```

**关键设计**：
- 三层检查：null → 类型 → 结构字段存在性
- 每层有具体错误消息和分类
- 调用方根据分类决定重试/回退/终止

### 2. 震荡检测（文本生成特化版）

```javascript
_detectOscillation(words) {
  if (words.length < 8) return { oscillating: false, repeatCount: 0 };

  const recent = words.slice(-8);
  const previous = words.slice(-16, -8);

  // 精确序列匹配
  const exactMatch = recent.every((w, i) => w === previous[i]);
  if (exactMatch) return { oscillating: true, pattern: recent.join(''), repeatCount: 2 };

  // 近似重复检测：70%+ 词重叠
  const overlapCount = recent.filter(w => previous.includes(w)).length;
  if (overlapCount / 8 > 0.7) return { oscillating: true, pattern: '...', repeatCount: Math.round(overlapCount/8 * 10) / 10 };

  // 单词高频检测：同一词出现 >40%
  const wordFreq = {};
  for (const w of words) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const maxFreq = Math.max(...Object.values(wordFreq));
  if (maxFreq > words.length * 0.4 && words.length > 10) {
    return { oscillating: true, pattern: `重复词"${Object.keys(wordFreq).find(k => wordFreq[k] === maxFreq)}"`, repeatCount: maxFreq };
  }

  return { oscillating: false, repeatCount: 0 };
}
```

**关键设计**：
- 三种检测策略互补（精确循环/近似重叠/高频词）
- 窗口8次，支持提前退出（短序列不检测）
- 返回值含 pattern 描述和 repeatCount 量化指标

### 3. 漂移检测（主题偏离检测）

```javascript
_detectDrift(words, thoughtDims) {
  const concepts = Object.keys(thoughtDims);
  if (concepts.length === 0 || words.length < 5) return { drifted: false, score: 0 };

  const relevantWords = words.filter(w => concepts.includes(w));
  const relevanceRatio = relevantWords.length / words.length;

  if (relevanceRatio < 0.4) {
    return { drifted: true, score: 1 - relevanceRatio, reason: `相关词比例 ${(relevanceRatio*100).toFixed(0)}% 低于阈值 40%` };
  }
  return { drifted: false, score: 1 - relevanceRatio };
}
```

**关键设计**：
- 对比已生成词与 thoughtVector 概念的相关性
- 阈值 0.4 可配置
- 检测到漂移时强制回归最高权重概念

### 4. 自愈回退选择函数

```javascript
_safePick(array) {
  if (!array || array.length === 0) {
    this.lastErrors.push({ type: 'vocabulary_empty', time: Date.now() });
    return '。'; // 安全回退
  }
  return array[Math.floor(Math.random() * array.length)];
}
```

**关键设计**：
- 空数组返回安全回退值而非 undefined
- 记录错误历史用于诊断
- 所有选择方法统一走 _safePick，不重复防御

### 5. userModel 集成

```javascript
// predictNextWord 中集成 userModel
if (state.userModelActive && state.userModel) {
  const um = state.userModel;
  if (um.languageStyle === 'formal' && Math.random() < 0.2) {
    return _safePick(['因此', '然而', '此外', '鉴于']);
  }
  if (um.languageStyle === 'simple' && Math.random() < 0.2) {
    return _safePick(['所以', '但是', '还有', '因为']);
  }
  if (um.emotionalState === 'sad' && Math.random() < 0.15) {
    return _safePick(emotionalVocab);
  }
}
```

**关键设计**：
- 先验证 userModel 是否可用（`_validateUserModel()`）
- 低概率触发（15-20%），不强制改变整体风格
- 提供 formal/simple 两种风格 + 情绪感知

### 6. 循环保护系统

```javascript
// 硬限制：最大迭代次数
if (this.iterationCount > this.maxIterations) {
  responseState.completed = true;
  responseState.error = `超过最大迭代次数 (${this.maxIterations})`;
  break;
}

// 恢复尝试上限
if (this.recoveryAttempts > this.maxRecoveryAttempts) {
  responseState.completed = true;
  responseState.error = '连续词选择失败，放弃生成';
  break;
}
```

**关键设计**：
- 双重保护：maxIterations（硬限制）+ maxRecoveryAttempts（软限制）
- 失败后记录具体错误到响应结果
- 不影响正常生成路径

### 7. 状态枚举 + 错误分类

```javascript
const GenerationState = {
  INIT: 'init',
  SELECTING_FIRST: 'selecting_first',
  PREDICTING: 'predicting',
  COMPLETED: 'completed',
  ERROR: 'error',
  MAX_ITERATIONS: 'max_iterations',
  OSCILLATION_DETECTED: 'oscillation_detected',
  DRIFT_DETECTED: 'drift_detected'
};

const ErrorCategory = {
  INVALID_INPUT: 'invalid_input',
  VOCABULARY_EMPTY: 'vocabulary_empty',
  WORD_SELECTION_FAILED: 'word_selection_failed',
  STATE_CORRUPT: 'state_corrupt',
  MAX_ITERATIONS_EXCEEDED: 'max_iterations_exceeded',
  OSCILLATION: 'oscillation',
  DRIFT: 'drift',
  UNKNOWN: 'unknown'
};

const RetryStrategy = {
  RETRY_SAME: 'retry_same',
  FALLBACK_DEFAULT: 'fallback_default',
  RESET_STATE: 'reset_state',
  ABORT: 'abort'
};
```

**关键设计**：
- 8 种生成状态覆盖完整生命周期
- 8 种错误分类，每种对应可操作的重试策略
- 模块级导出，供外部诊断

### 8. 增强的格式化追踪

```javascript
getFormattedTrace() {
  return this.currentTrace.map(t => {
    if (t.step === 'oscillation_break') {
      return `[逐词生成] 震荡检测 - 打断循环模式 "${t.data.pattern}"，插入 "${t.data.breakWord}"`;
    }
    if (t.step === 'drift_correction') {
      return `[逐词生成] 漂移纠正 - 漂移分数 ${t.data.driftScore}，强制回归 "${t.data.correction}"`;
    }
    if (t.step === 'recovery_fallback') {
      return `[逐词生成] 自愈回退 #${t.data.attempt} - 使用 "${t.data.fallback}"`;
    }
    // ... 原有步骤 ...
  }).filter(Boolean).join('\n');
}
```

**关键设计**：
- 为新增的自愈步骤（oscillation_break/drift_correction/recovery_fallback）添加可读格式化输出
- 所有 trace 步骤都能被 getFormattedTrace 渲染

## 标准升级清单

- [ ] **GenerationState 枚举**：8 种状态（init/selecting_first/predicting/completed/error/max_iterations/oscillation_detected/drift_detected）
- [ ] **ErrorCategory 枚举**：8 种错误（invalid_input/vocabulary_empty/word_selection_failed/state_corrupt/max_iterations_exceeded/oscillation/drift/unknown）
- [ ] **RetryStrategy 枚举**：4 种策略（retry_same/fallback_default/reset_state/abort）
- [ ] **输入验证**：`_validateThoughtVector()` 三层防御（null→类型→结构）
- [ ] **userModel 验证**：`_validateUserModel()` 检查 preferences/personality/emotionalState/languageStyle
- [ ] **震荡检测**：`_detectOscillation()` 三重策略（精确序列/近似重叠/高频词）
- [ ] **漂移检测**：`_detectDrift()` 概念相关性分析，阈值可配
- [ ] **安全选择**：`_safePick()` 空数组回退 + 错误记录
- [ ] **循环保护**：maxIterations 硬限制 + maxRecoveryAttempts 软限制
- [ ] **userModel 集成**：formal/simple 语言风格 + 情绪感知选词
- [ ] **防御性 selectFirstWord/predictNextWord**：所有访问 emotion.pleasure 和 dimensions 之前空值检查
- [ ] **增强的 trace 格式化**：覆盖所有自愈步骤
- [ ] **getState() + getErrorSummary()**：运行状态和错误统计查询接口
- [ ] **模块级导出**：主类 + 所有枚举
