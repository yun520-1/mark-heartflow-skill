# 循环过程/梦境循环类升级模式

## 适用场景

模块是一个**薄包装器**，围绕一个核心引擎（如 `DreamEngine`）提供简化接口，自身几乎不做判断——纯转发 + 简单加权评分。

**与纯委托代理类的区别**：纯委托类（如 meta-learner）每个方法直接 `core.method(...)` 转发。循环过程类有自己的小评分函数和排序逻辑，但这些逻辑**缺少防御性编程、错误恢复、震荡检测、状态管理**——它有自己的骨架，但骨架没有肌肉。

典型特征：
- 模块大小 6000-8500 字节
- 核心引擎被 `require()` 引入，本模块做薄包装
- 有自己的 `scoreFragment()` / `tokenize()` 等小函数，但缺少输入验证和边界处理
- 没有状态枚举，没有错误分类
- 失败时静默回退，没有重试或降级逻辑
- 没有震荡/重复检测——可能陷入相同模式循环
- 没有记忆压力管理——历史无限增长

## 示例：Dream Loop (src/core/dream-loop.js)

**原模块** (6,367 字节)：围绕 `DreamEngine` 的薄包装器
- `getDreamEngine()` — 懒加载单例
- `tokenize()` — 简单分词，无输入验证
- `scoreFragment()` — 4 维加权评分，无归一化
- `buildDreamFragments()` — 排序取 top N，无限制检查
- `generateDream()` — 两分支（DAG/简单），无 try/catch
- `_generateInsights()` — 依赖 `dagResult.level_breakdown` 无校验
- `_generateNextActions()` — 同上

**升级后** (22,870 字节)：完整的自愈式梦境循环引擎

## 可添加的子系统

### 1. 状态枚举 + 错误分类

```javascript
const DREAM_STATE = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  DEGRADED: 'degraded',
  OSCILLATING: 'oscillating',
  STALE: 'stale',
};

const DREAM_ERROR = {
  EMPTY_INPUT: 'empty_input',
  INVALID_FRAGMENT: 'invalid_fragment',
  DAG_FAILURE: 'dag_failure',
  TIMEOUT: 'timeout',
  OSCILLATION: 'oscillation',
  MEMORY_PRESSURE: 'memory_pressure',
  LAYER_MISMATCH: 'layer_mismatch',
};
```

**设计原则**：错误类型应该是动词性的（"什么错了"）而非名词性的（"哪个模块错了"），这样调用方可以按错误类型做 switch。

### 2. 输入验证系统

```javascript
function _validateMemoryItems(memoryItems) {
  const errors = [];
  if (!Array.isArray(memoryItems)) {
    return { valid: false, items: [], errors: ['memoryItems 必须是数组'] };
  }
  if (memoryItems.length === 0) {
    return { valid: true, items: [], errors: [] }; // 空数组合法，但后面会处理
  }

  const validItems = [];
  let emptyCount = 0;
  for (let i = 0; i < memoryItems.length; i++) {
    const item = memoryItems[i];
    const text = _safeText(item);
    if (!text.trim()) {
      emptyCount++;
      continue; // 跳过空条目，不崩溃
    }
    // 层验证
    const layer = (item && item.layer) || 'EPHEMERAL';
    if (!_isValidLayer(layer)) {
      invalidLayerCount++;
    }
    validItems.push({
      text,
      layer: _isValidLayer(layer) ? layer : 'EPHEMERAL',
      index: i,
    });
  }
  if (emptyCount > 0) {
    errors.push(`跳过了 ${emptyCount} 个空文本项`);
  }
  return { valid: true, items: validItems, errors };
}
```

**关键设计**：不崩溃，跳过无效项，记录警告。调用方可以决定是否处理警告。

### 3. 震荡检测

基于 **Jaccard 相似度**的模式重复检测：

```javascript
const OSCILLATION_THRESHOLD = {
  maxRepeatPatterns: 3,
  windowSize: 10,
  similarityRatio: 0.85,
};

function _detectOscillation(motifs) {
  if (!Array.isArray(motifs) || motifs.length === 0) {
    return { oscillating: false, repeatCount: 0, details: 'no motifs to check' };
  }

  const currentSignatures = motifs.map(m => _safeText(m).slice(0, 20).toLowerCase().trim()).filter(Boolean);
  if (currentSignatures.length === 0) {
    return { oscillating: false, repeatCount: 0, details: 'empty signatures' };
  }

  let repeatCount = 0;
  const historyWindow = _dreamHistory.slice(-OSCILLATION_THRESHOLD.windowSize);

  for (const historical of historyWindow) {
    if (!Array.isArray(historical.motifs)) continue;
    const historicalSignatures = historical.motifs.map(m => _safeText(m).slice(0, 20).toLowerCase().trim()).filter(Boolean);
    const currentSet = new Set(currentSignatures);
    const historicalSet = new Set(historicalSignatures);
    const intersection = new Set([...currentSet].filter(x => historicalSet.has(x)));
    const union = new Set([...currentSet, ...historicalSet]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;

    if (similarity >= OSCILLATION_THRESHOLD.similarityRatio) {
      repeatCount++;
    }
  }

  return {
    oscillating: repeatCount >= OSCILLATION_THRESHOLD.maxRepeatPatterns,
    repeatCount,
    details: oscillating ? `检测到震荡：在最近${windowSize}次中重复了${repeatCount}次相似模式` : `正常：重复计数 ${repeatCount}/${maxRepeatPatterns}`,
  };
}
```

**为什么用签名切片（前 20 字符）而非完整文本**：
- 完整文本相似度受长度影响大（长文本即使主题不同也容易高相似）
- 前 20 字符捕获主题头 + 关键词，对短模式更敏感
- 阈值 85% 确保只标记真正重复，不误伤相关但不同的模式

**震荡后的行为**：
- 状态设为 `OSCILLATING`
- 向 insights 追加警告：`⚠ 检测到梦境模式重复，建议注入新记忆碎片或调整权重`
- 在 next_actions 首部插入：`调整 DEFAULT_WEIGHTS 增加 novelty 权重`、`注入多样性记忆碎片`

### 4. 记忆压力管理

```javascript
const MEMORY_PRESSURE = {
  maxDreamsRetained: 20,
  staleDays: 7,
};

function _pruneStaleDreams() {
  const cutoff = Date.now() - MEMORY_PRESSURE.staleDays * 24 * 60 * 60 * 1000;
  const before = _dreamHistory.length;
  _dreamHistory = _dreamHistory.filter(d => d.timestamp >= cutoff);
  return before - _dreamHistory.length; // 返回清理数量
}
```

在每次 `generateDream()` 开始时调用，并在 warnings 中记录清理数量。

### 5. 错误恢复与重试策略

```javascript
const RETRY_POLICY = {
  maxRetries: 2,
  backoffMs: 500,
};

// 在 generateDream 中的 DAG 分支
let dagAttempts = 0;
let dagSuccess = false;

while (dagAttempts <= RETRY_POLICY.maxRetries && !dagSuccess) {
  try {
    if (dagAttempts > 0) {
      const delay = RETRY_POLICY.backoffMs * dagAttempts;
      const start = Date.now();
      while (Date.now() - start < delay) { /* busy wait */ }
    }
    const dagResult = engine.dream(dreamId, fragments, { force: options.force });
    dreamResult = { ... };
    dagSuccess = true;
    _consecutiveFailures = 0;
  } catch (dagError) {
    dagAttempts++;
    if (dagAttempts > RETRY_POLICY.maxRetries) {
      throw dagError; // 外层 catch 处理回退
    }
  }
}
```

**降级策略**：
- 连续失败 ≤ `maxRetries`：标记为 `DEGRADED` 但仍返回结果
- 连续失败 > `maxRetries`：标记为 `FAILED`，返回安全 fallback
- fallback 总是包含 `{ state: 'failed', motifs: [], insights: ['...'], next_actions: ['...'] }`

### 6. 防御性编程工具函数

```javascript
function _safeText(item) {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item;
  if (typeof item.text === 'string') return item.text;
  if (typeof item.content === 'string') return item.content;
  try { return String(item); } catch (e) { return ''; }
}

function _normalizeScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

function _safeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}
```

### 7. 评分归一化

原评分公式直接加权求和，结果可能超过 1.0（例如 contradiction=1 时权重 0.3 + salience=1 时权重 0.25 + ...）。

```javascript
// 升级后
const rawScore =
  DEFAULT_WEIGHTS.recency * lengthFactor +
  DEFAULT_WEIGHTS.salience * salience +
  DEFAULT_WEIGHTS.contradiction * contradiction +
  DEFAULT_WEIGHTS.novelty * novelty;

return {
  score: _normalizeScore(rawScore),  // 保证在 [0, 1]
  ...
};
```

**为什么不用 softmax/sigmoid**：简单 clamp 就够了——分数只用于相对排序，不需要统计特性。

### 8. 诊断与恢复

```javascript
function getDiagnostics() {
  return {
    state: _lastDreamState,
    consecutiveFailures: _consecutiveFailures,
    historyLength: _dreamHistory.length,
    engineReady: _dreamEngine !== null,
    oscillationRisk: _detectOscillation(lastMotifs),
    memoryPressure: {
      current: _dreamHistory.length,
      max: MEMORY_PRESSURE.maxDreamsRetained * 3,
      staleDays: MEMORY_PRESSURE.staleDays,
    },
  };
}

function resetState(opts = {}) {
  const keepHistory = opts && opts.keepHistory;
  _dreamEngine = null;
  _consecutiveFailures = 0;
  _lastDreamState = DREAM_STATE.IDLE;
  if (!keepHistory) {
    _dreamHistory = [];
  }
}
```

### 9. 模块级导出

```javascript
module.exports = {
  // 主功能
  generateDream,
  buildDreamFragments,
  scoreFragment,
  tokenize,
  getDreamEngine,

  // 枚举
  DREAM_STATE,
  DREAM_ERROR,
  LEVELS,

  // 配置常量（可被外部覆盖或检查）
  DEFAULT_WEIGHTS,
  OSCILLATION_THRESHOLD,
  MEMORY_PRESSURE,
  RETRY_POLICY,

  // 诊断
  resetState,
  getDiagnostics,

  // 内部工具（导出供测试）
  _validateMemoryItems,
  _detectOscillation,
  _pruneStaleDreams,
};
```

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 原有方法签名完全不变（`generateDream`, `buildDreamFragments`, `scoreFragment`, `tokenize`）
- [ ] 构造不报错（无构造函数则 `require()` 不抛异常）
- [ ] `null` 输入 → 返回 `{ state: 'failed', error: 'empty_input' }`
- [ ] `[]` 输入 → 返回 `{ state: 'complete', motifs: [] }`
- [ ] 混合有效/无效 → 跳过无效项，记录警告，处理有效项
- [ ] 震荡检测：连续 3+ 次相似模式 → 标记 `OSCILLATING`
- [ ] 连续失败 > maxRetries → 标记 `FAILED` 并返回 fallback
- [ ] `resetState()` 清空历史并重置计数
- [ ] `getDiagnostics()` 返回完整状态报告
- [ ] 所有评分在 `[0, 1]` 范围内
- [ ] 所有枚举通过 `require('./module').DREAM_STATE` 访问
- [ ] 自检模式（`if (require.main === module)`）覆盖所有测试用例

## 已知陷阱

### 陷阱 1: 忙等待模拟延迟
Node.js 单线程，`while(Date.now() - start < delay){}` 会阻塞事件循环。对简短重试（<1s）可接受；对长时间等待应使用 `setTimeout` + Promise。

```javascript
// 短延迟（<1s）可用 busy wait
// 长延迟（>1s）用 Promise
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// 注意：generateDream 如果是同步的，改为 async
```

### 陷阱 2: 震荡检测对短文本敏感
20 字符签名对短文本（<10 字符）可能产生高相似度误报。解决方案：短文本自动降权或排除。

```javascript
const MIN_SIGNATURE_LENGTH = 5;
const currentSignatures = motifs
  .map(m => _safeText(m).slice(0, 20).toLowerCase().trim())
  .filter(s => s.length >= MIN_SIGNATURE_LENGTH);
```

### 陷阱 3: 历史无限增长
如果不限制 `_dreamHistory` 大小，震荡检测的计算量会随时间线性增长。必须主动限制（建议上限为 `maxDreamsRetained × 3`）。

### 陷阱 4: DAG 回退的嵌套异常
DAG 分支内部 try/catch 抛出异常后，外层 try/catch 再处理一次。注意不要**双重处理**（如外层也试图生成 fallback 时再次调用 DAG）。
```javascript
// ✅ 正确：DAG 失败后，外层 catch 只做降级报告，不再尝试 DAG
// ❌ 错误：外层 catch 尝试 new DreamEngine() 重新 DAG
```

### 陷阱 5: _dreamHistory 是模块级全局变量
在 Node.js 中，模块级变量在进程生命周期内持久存在。测试之间需要 `resetState()` 清理，否则测试结果受之前测试影响。在 `require.main === module` 自检模式中也要在开始前 reset。
