# 检索增强/锚点类升级模式 (Retrieval Anchor)

## 模块特征

检索增强/锚点类负责存储和检索与查询相关的文档/记忆片段，核心操作是 `addAnchor(content)` + `query(query)`。典型大小：2-5KB。

**识别特征**：
- 核心方法：`addAnchor()`、`query()`、`selectAnchor()`
- 有一个 `Map` 或数组存储锚点
- `_computeRelevance()` 使用简单的关键字包含检测（`content.includes(word)`）
- 无时效衰减、无容量限制、无去重

## 标准升级清单

### 1. 复合评分系统

将简单的关键字匹配替换为多维度加权评分：

```javascript
_computeCompositeScore(query, anchor, idfWeights) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 0.5;

  const contentLower = anchor.content.toLowerCase();

  // 1) 关键字重叠（IDF加权）
  let weightedSum = 0;
  let weightTotal = 0;
  for (const word of queryWords) {
    const weight = idfWeights[word] || 1.0;
    weightTotal += weight;
    if (contentLower.includes(word)) weightedSum += weight;
  }
  const keywordScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // 2) Jaccard 相似度（捕获部分匹配）
  const jaccard = _jaccardSimilarity(query, anchor.content);

  // 3) 时效性指数衰减
  const ageMs = Date.now() - anchor.createdAt;
  const recencyBoost = Math.exp(-Math.LN2 * ageMs / this._decayHalfLife);

  // 4) 可靠性因子
  const reliabilityFactor = anchor.reliability || 0.8;

  // 加权组合：关键字50% + Jaccard 20% + 时效 20% + 可靠性 10%
  return keywordScore * 0.50 + jaccard * 0.20 + recencyBoost * 0.20 + reliabilityFactor * 0.10;
}
```

### 2. IDF 权重预计算

基于锚点语料库的逆文档频率，让稀有词获得更高权重：

```javascript
function _computeIDFWeights(anchorTexts, queryWords) {
  const n = anchorTexts.length;
  if (n === 0) return {};
  const weights = {};
  for (const word of queryWords) {
    let docCount = 0;
    for (const text of anchorTexts) {
      if (text.toLowerCase().includes(word)) docCount++;
    }
    weights[word] = Math.log((n + 1) / (docCount + 1)) + 1;
  }
  return weights;
}
```

### 3. 内容去重

两层去重策略：快速指纹 + Jaccard 近重复检测：

```javascript
// 指纹（快速哈希，O(1)查找）
function _contentFingerprint(content) {
  const cleaned = content.toLowerCase().replace(/\s+/g, ' ').trim();
  const head = cleaned.slice(0, 32);
  return crypto.createHash('md5')
    .update(head + '|' + cleaned.length)
    .digest('hex').slice(0, 8);
}

// Jaccard 相似度（词级，捕获近重复）
function _jaccardSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;
  let intersection = 0;
  for (const w of wordsA) { if (wordsB.has(w)) intersection++; }
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0.0;
}
```

在 `addAnchor` 中集成：
```javascript
addAnchor(content, source, relevance) {
  // 1) 指纹去重
  const fingerprint = _contentFingerprint(content);
  if (this._fingerprintIndex.has(fingerprint)) {
    const existing = this.anchors.get(this._fingerprintIndex.get(fingerprint));
    // 合并：更新时效 + 提升可靠性
    existing.createdAt = Date.now();
    existing.relevance = Math.max(existing.relevance, relevance);
    existing.reliability = Math.min(1.0, existing.reliability + 0.05);
    existing.mergeCount = (existing.mergeCount || 1) + 1;
    return existing;
  }
  // 2) Jaccard 近重复检测（捕获哈希不同但内容相似）
  for (const [id, existing] of this.anchors) {
    if (_jaccardSimilarity(content, existing.content) >= 0.85) {
      existing.createdAt = Date.now();
      existing.relevance = Math.max(existing.relevance, relevance);
      existing.reliability = Math.min(1.0, existing.reliability + 0.03);
      existing.mergeCount = (existing.mergeCount || 1) + 1;
      this._fingerprintIndex.set(fingerprint, id);
      return existing;
    }
  }
  // 3) 新增锚点
  ...
}
```

### 4. 自适应淘汰（LRU + 年龄组合）

```javascript
_evictOne() {
  let worstId = null;
  let worstScore = -Infinity;
  for (const [id, anchor] of this.anchors) {
    const ageScore = Date.now() - anchor.createdAt;
    const accessScore = (anchor.accessCount || 0) + 1;
    const evictionScore = ageScore / accessScore;  // 越大越应淘汰
    if (evictionScore > worstScore) {
      worstScore = evictionScore;
      worstId = id;
    }
  }
  if (worstId) {
    // 清理指纹索引
    const removed = this.anchors.get(worstId);
    const fp = _contentFingerprint(removed.content);
    if (this._fingerprintIndex.get(fp) === worstId) this._fingerprintIndex.delete(fp);
    this.anchors.delete(worstId);
  }
}
```

### 5. 批量过期淘汰

```javascript
evictStale(maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  const toRemove = [];
  for (const [id, anchor] of this.anchors) {
    if (anchor.createdAt < cutoff && (anchor.accessCount || 0) < 2) {
      toRemove.push(id);
    }
  }
  for (const id of toRemove) {
    const anchor = this.anchors.get(id);
    const fp = _contentFingerprint(anchor.content);
    if (this._fingerprintIndex.get(fp) === id) this._fingerprintIndex.delete(fp);
    this.anchors.delete(id);
  }
  return toRemove.length;
}
```

### 6. 检索置信度

```javascript
query(query, options = {}) {
  const {
    maxAnchors = 5, minRelevance = 0.3,
    preferRecent = false, confidenceThreshold = 0,
  } = options;

  const allTexts = Array.from(this.anchors.values()).map(a => a.content);
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const idfWeights = _computeIDFWeights(allTexts, queryWords);

  const results = [];
  for (const anchor of this.anchors.values()) {
    const score = this._computeCompositeScore(query, anchor, idfWeights);
    if (score >= minRelevance) {
      let matchedTerms = 0;
      for (const w of queryWords) {
        if (anchor.content.toLowerCase().includes(w)) matchedTerms++;
      }
      const confidence = queryWords.length > 0
        ? Math.min(matchedTerms / queryWords.length + 0.2, 1.0) : 0.5;

      if (confidence >= confidenceThreshold) {
        results.push({ ...anchor, relevance: score, confidence: Math.round(confidence * 100) / 100 });
      }
    }
  }

  // 排序 + 访问统计更新
  results.sort((a, b) => {
    const diff = b.relevance - a.relevance;
    if (preferRecent && Math.abs(diff) < 0.1) return b.createdAt - a.createdAt;
    return diff;
  });
  const top = results.slice(0, maxAnchors);
  for (const r of top) {
    const anchor = this.anchors.get(r.id);
    if (anchor) { anchor.accessCount = (anchor.accessCount || 0) + 1; anchor.lastAccessedAt = Date.now(); }
  }
  return top;
}
```

### 7. 增强统计

```javascript
getStats() {
  let used = 0, unused = 0, totalAccessCount = 0, totalMerges = 0;
  let oldestTs = Infinity, newestTs = 0;
  for (const anchor of this.anchors.values()) {
    if (anchor.usedInReasoning) used++; else unused++;
    totalAccessCount += anchor.accessCount || 0;
    totalMerges += (anchor.mergeCount || 1) - 1;
    if (anchor.createdAt < oldestTs) oldestTs = anchor.createdAt;
    if (anchor.createdAt > newestTs) newestTs = anchor.createdAt;
  }
  return {
    total: this.anchors.size,
    used, unused, capacity: this._capacity,
    utilizationRate: this.anchors.size > 0 ? Math.round((used / this.anchors.size) * 100) / 100 : 0,
    totalAccessCount, totalMerges,
    ageRangeMs: oldestTs < Infinity ? newestTs - oldestTs : 0,
  };
}
```

## 关键陷阱

### 1. 指纹索引同步
删除锚点时必须同时删除 `_fingerprintIndex` 中的条目，否则后续添加会被错误地认为是重复。

### 2. Jaccard 阈值平衡
- 阈值太高(>0.95)：几乎不命中，去重失效
- 阈值太低(<0.7)：过于激进，把不同内容视为重复
- 推荐：`0.85`，配合 `mergeCount` 追踪合并次数

### 3. 构造函数参数化
容量和半衰期应通过构造函数传入，而非硬编码：
```javascript
constructor(options = {}) {
  this._capacity = options.capacity || 1000;
  this._decayHalfLife = options.decayHalfLifeMs || 30 * 60 * 1000;
}
```

### 4. 时效衰减与休眠场景
长时间休眠后所有锚点衰减到接近0是正常的。如果应用场景不需要时间敏感度（如长期知识库），可以设置 `decayHalfLifeMs` 为 `Infinity` 或增加 `preferRecent=false` 模式。

### 5. `forEach` 遍历 Map 中的值
```javascript
// 正确
for (const anchor of this.anchors.values()) { ... }
// 或
this.anchors.forEach((anchor) => { ... });

// 错误 — Map 没有 .entries() 的裸 for-of 在旧版 Node 中可能有兼容问题
```
