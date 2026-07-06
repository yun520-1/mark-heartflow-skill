# Convergence / Aggregation Engine 升级模式

## 适用模块类型

收敛/聚合引擎类模块，核心操作为：**从多个信号源（联想、习语、叙事框架）提取激活节点，加权聚合生成统一的思想向量**。典型文件：`associative-engine/semantic-converger.js`。

## 典型特征

- 有一个 `converge(associations, chunks, narrative)` 主方法，接收多个信号源
- `extractActivatedConcepts()` / `extractActivatedIdioms()` 从各信号源提取激活节点
- `computeThoughtVector()` 加权聚合生成多维思想向量 + 情感维度（pleasure/arousal/dominance）
- `inferUserIntent()` 基于情感向量做简单意图推断
- 内置小型情感映射表（关键词 → PAD 情感值）
- 保留最近 N 次收敛的历史记录

## 标准升级清单

### 1. 输入验证系统

```javascript
_validateInputs(associations, chunks, narrative) {
  const errors = [];
  let valid = true;

  // associations: 应为对象或 null
  if (associations != null) {
    if (typeof associations !== 'object' || Array.isArray(associations)) {
      errors.push('associations 必须是对象类型');
      valid = false;
    } else if (associations.allAssociations != null && !Array.isArray(associations.allAssociations)) {
      errors.push('associations.allAssociations 必须是数组');
      valid = false;
    }
  }

  // chunks: 应为对象或 null
  if (chunks != null) {
    if (typeof chunks !== 'object' || Array.isArray(chunks)) {
      errors.push('chunks 必须是对象类型');
      valid = false;
    } else if (chunks.chunks != null && !Array.isArray(chunks.chunks)) {
      errors.push('chunks.chunks 必须是数组');
      valid = false;
    }
  }

  // narrative: 可选对象或 null
  if (narrative != null && (typeof narrative !== 'object' || Array.isArray(narrative))) {
    errors.push('narrative 必须是对象类型或 null');
    valid = false;
  }

  return { valid, errors };
}
```

### 2. 收敛质量评估

从多个维度评估收敛结果的质量：

```javascript
_assessConvergenceQuality(convergenceResult) {
  const issues = [];
  const { thoughtVector, activatedConcepts, activatedIdioms } = convergenceResult;

  // 1. 概念数量检查
  if (activatedConcepts.length === 0) issues.push('无激活概念');
  else if (activatedConcepts.length < 3) issues.push('概念数量过少');

  // 2. 情感强度检查
  const e = thoughtVector.emotion;
  const emotionMagnitude = Math.sqrt(e.pleasure**2 + e.arousal**2 + e.dominance**2);
  if (emotionMagnitude < 0.5) issues.push('情感信号微弱');

  // 3. 置信度检查
  if (thoughtVector.confidence < 0.2) issues.push('置信度过低');

  // 4. 维度稀疏度
  const dims = Object.keys(thoughtVector.dimensions);
  if (dims.length > 0) {
    const avgStrength = dims.reduce((s, d) => s + thoughtVector.dimensions[d], 0) / dims.length;
    if (avgStrength < 0.15) issues.push('概念强度分布过于分散');
  }

  // 5. 源贡献失衡
  const total = contrib.associations + contrib.idioms + contrib.narrative;
  if (total > 0) {
    const maxContrib = Math.max(contrib.associations, contrib.idioms, contrib.narrative);
    if (maxContrib / total > 0.9) issues.push('信息源过于单一');
  }

  const quality = Math.max(0, 1 - (issues.length * 0.2));
  return { quality, issues, isDegenerate: quality < 0.4 };
}
```

### 3. 振荡/漂移检测

基于 Jaccard 相似度比较前后收敛的概念集重叠率：

```javascript
_detectOscillation(currentResult) {
  if (this.convergenceHistory.length === 0) return { oscillation: false, drift: 0, previousTopConcepts: [] };

  const previous = this.convergenceHistory[this.convergenceHistory.length - 1];
  const prevConcepts = (previous.activatedConcepts || []).map(c => c.concept);
  const currConcepts = (currentResult.activatedConcepts || []).map(c => c.concept);

  // Jaccard 相似度
  const prevSet = new Set(prevConcepts);
  const currSet = new Set(currConcepts);
  const intersection = [...prevSet].filter(c => currSet.has(c));
  const union = new Set([...prevSet, ...currSet]);
  const jaccard = union.size > 0 ? intersection.length / union.size : 0;
  const drift = 1 - jaccard;

  // 连续 2 次发散收敛才触发振荡（避免单次随机漂移的误报）
  if (drift > this.driftThreshold) {
    this.oscillationCount++;
    result.oscillation = this.oscillationCount >= 2;
  } else {
    this.oscillationCount = Math.max(0, this.oscillationCount - 1);
  }
}
```

### 4. 置信度感知降级

当概念过少或输入质量低时，自动切换简化策略：

```javascript
const useSimplifiedStrategy = activatedConcepts.length < 2 && !narrativeFramework;

const thoughtVector = useSimplifiedStrategy
  ? this._computeSimplifiedThoughtVector(concepts, idioms, narrative, associations)
  : this.computeThoughtVector(concepts, idioms, narrative, associations);
```

简化策略只保留核心情感维度，不尝试多源融合：

```javascript
_computeSimplifiedThoughtVector(concepts, idioms, narrative, associations) {
  const vector = this._emptyThoughtVector();
  for (const concept of concepts) {
    vector.dimensions[concept.concept] = concept.strength;
    vector.sourceContributions.associations += concept.strength * 0.6;
  }
  if (idioms.length > 0) vector.sourceContributions.idioms += 0.3;
  if (narrative) vector.sourceContributions.narrative += 0.4;
  vector.confidence = Math.min(0.4, (concepts.length * 0.05) + (idioms.length * 0.1) + (narrative ? 0.15 : 0));
  return vector;
}
```

### 5. 多信号意图融合

替代简单的 if-else 链，使用加权信号融合：

```javascript
inferUserIntent(thoughtVector, chunks, concepts, idioms) {
  const signals = [];

  // 信号1: 情感极性
  if (emotion.pleasure > 3) signals.push({ type: 'positive_emotion', weight: 0.25 });
  if (emotion.pleasure < -3) signals.push({ type: 'negative_emotion', weight: 0.25 });
  if (emotion.arousal > 4) signals.push({ type: 'high_arousal', weight: 0.2 });

  // 信号2: 概念关键词
  if (topConcepts.some(c => /^(什么|为什么|怎么|如何)/.test(c)))
    signals.push({ type: 'question_keyword', weight: 0.3 });

  // 信号3: chunks 中的直接意图
  if (chunks && chunks.chunks) {
    const fullText = chunks.chunks.map(c => c.text || '').join(' ');
    if (/^(为什么|怎么|如何|是否|什么)/.test(fullText.trim()))
      signals.push({ type: 'direct_question', weight: 0.35 });
    if (/^(请|帮|能|可以)/.test(fullText.trim()))
      signals.push({ type: 'request', weight: 0.3 });
  }

  // 加权投票选择意图
  let intentScore = { explore: 0.2 }; // 默认基线
  // ... 根据 signals 更新分数
  const topIntent = Object.entries(intentScore).sort((a, b) => b[1] - a[1])[0][0];
}
```

### 6. 错误处理

try/catch 包裹主流程，所有异常路径返回含 `error` 字段的退化结果：

```javascript
converge(associations, chunks, narrative) {
  const validation = this._validateInputs(associations, chunks, narrative);
  if (!validation.valid) {
    return this._degradedResult('输入验证失败: ' + validation.errors.join('; '));
  }

  try {
    // ... 主逻辑
  } catch (err) {
    return this._degradedResult('收敛过程异常: ' + err.message);
  }
}

_degradedResult(error) {
  return {
    thoughtVector: this._emptyThoughtVector(),
    activatedConcepts: [],
    activatedIdioms: [],
    matchedNarrative: null,
    understoodIntent: { intent: 'unknown', confidence: 0, emotionalBasis: { pleasure: 0, arousal: 0, dominance: 0 } },
    timestamp: new Date().toISOString(),
    quality: { quality: 0, issues: [error], isDegenerate: true },
    oscillation: { oscillation: false, drift: 0, previousTopConcepts: [] },
    error
  };
}
```

### 7. 情感映射扩展

从少量硬编码条目扩展到更全面的映射表 + 语义组回退：

```javascript
getConceptEmotion(concept) {
  // 1. 精确匹配（30+ 条目）
  const emotionMap = {
    '心流': { pleasure: 5, arousal: 4, dominance: 3 },
    '专注': { pleasure: 3, arousal: 5, dominance: 4 },
    '愉悦': { pleasure: 6, arousal: 3, dominance: 2 },
    // ... 扩展到 30+ 条目
  };
  for (const [key, emotion] of Object.entries(emotionMap)) {
    if (concept.includes(key)) return emotion;
  }

  // 2. 语义组匹配
  const semanticGroups = [
    { keywords: ['积极', '正面', '快乐', '幸福'], emotion: { pleasure: 5, arousal: 3, dominance: 2 } },
    { keywords: ['消极', '负面', '痛苦', '绝望'], emotion: { pleasure: -5, arousal: 2, dominance: -3 } },
    { keywords: ['学习', '知识', '理解', '学会'], emotion: { pleasure: 4, arousal: 3, dominance: 3 } },
    // ...
  ];
  for (const group of semanticGroups) {
    for (const kw of group.keywords) {
      if (concept.includes(kw)) return group.emotion;
    }
  }

  // 3. 中性回退
  return { pleasure: 0, arousal: 0, dominance: 0 };
}
```

## 模块级导出

```javascript
module.exports = {
  SemanticConverger,  // 主类
};
```

## 向后兼容注意事项

- 原有接口（`constructor`、`converge()`、`extractActivatedConcepts()`、`extractActivatedIdioms()`、`computeThoughtVector()`、`getConceptEmotion()`、`getIdiomEmotion()`、`getNarrativeEmotion()`、`inferUserIntent()`、`generateThoughtLog()`、`getLastConvergence()`、`getThoughtLog()`）保持签名不变
- `converge()` 返回结果增加 `quality`、`oscillation`、`fallbackApplied`、`error` 字段，不影响旧调用者读取已有字段
- `inferUserIntent()` 的签名从 1 个参数扩展到 4 个参数（加 `concepts` 和 `idioms`），但旧调用者可传 undefined 兼容
- 新增 `reset()` 方法，不影响已有功能

## 关键陷阱

### 1. 振荡检测的误报避免

连续 2 次发散收敛才触发振荡标记（`oscillationCount >= 2`），避免单次随机漂移的误报。当概念集收敛后，振荡计数应递减而非重置到 0，使系统对短期波动有记忆。

### 2. 降级后仍保留有意义的回退

退化收敛（概念太少/置信度过低）不应返回空结果。使用简化策略生成有情感维度的思想向量，而非 `{ dimensions: {} }`。

### 3. 情感映射的相似度 vs 包含

使用 `concept.includes(key)` 而非 `===` 可以匹配复合词（如"心流状态"匹配"心流"），但也可能导致误匹配（如"注意力"匹配"力"）。语义组匹配应使用较长的关键词优先。

### 4. 收敛历史的上限

`convergenceHistory` 必须有上限（建议 10 条），防止长时间运行后内存泄漏。同时，历史用于振荡检测时，只比较最近一次收敛，不需要保留全部历史。

### 5. extractActivatedConcepts 的容错

输入数组中的每个关联项可能缺失 `word`、`strength`、`relation` 字段，必须逐个检查：

```javascript
for (const assoc of associations.allAssociations) {
  if (!assoc || typeof assoc !== 'object') continue;  // 跳过无效项
  if (typeof assoc.strength !== 'number' || assoc.strength <= 0.2) continue;
  if (!assoc.word || typeof assoc.word !== 'string') continue;
  // ... 正常处理
}
```

### 6. `generateThoughtLog()` 的防御性访问

收敛结果中的 `understoodIntent`、`thoughtVector`、`quality`、`oscillation` 字段可能在退化收敛中为 undefined。必须用可选链或条件访问：

```javascript
generateThoughtLog(convergenceResult) {
  if (!convergenceResult) return { error: '无收敛结果' };
  return {
    understoodIntent: convergenceResult.understoodIntent?.intent || 'unknown',
    emotionVector: convergenceResult.thoughtVector?.emotion || { pleasure: 0, arousal: 0, dominance: 0 },
    quality: convergenceResult.quality?.quality || 0,
    oscillation: convergenceResult.oscillation?.oscillation || false,
  };
}
```
