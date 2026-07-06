# Narrative Matching Engine 升级模式

## 适用场景

叙事匹配/检索类模块（如 `narrative-retriever.js`、`narrative-generator.js`），负责从原型库/模板库中匹配与输入语义最相似的故事框架，并返回结构化叙事上下文。

## 典型特征

- 核心方法：`matchNarrative(semanticVector)` → 返回匹配的原型和置信度
- 内置原型/模板数据库（从 JSON 文件加载或硬编码）
- 使用关键词重叠/集合匹配计算相似度
- 缺少输入验证、状态分类、震荡检测、原型健康管理
- 原型文件损坏或不存在时无恢复策略

## 标准升级清单

### 1. MatchStatus 枚举

```javascript
const MatchStatus = {
  FULL_MATCH:     'full_match',       // 置信度 >= 0.6
  PARTIAL_MATCH:  'partial_match',    // 置信度 0.3-0.6
  WEAK_MATCH:     'weak_match',       // 置信度 0.1-0.3
  NO_MATCH:       'no_match',         // 置信度 < 0.1
  FALLBACK:       'fallback',         // 使用默认原型回退
  OSCILLATION:    'oscillation_detected',  // 震荡中
  ERROR:          'error'             // 输入无效
};
```

### 2. MatchErrorType 枚举

```javascript
const MatchErrorType = {
  INVALID_INPUT:       'invalid_input',
  PROTOTYPE_CORRUPTION:'prototype_corruption',
  PROTOTYPE_EMPTY:     'prototype_empty',
  FILE_IO_ERROR:       'file_io_error',
  UNKNOWN:             'unknown'
};
```

### 3. 输入验证层

```javascript
_validateMatchInput(semanticVector, activatedChunks) {
  if (semanticVector === null || semanticVector === undefined) {
    return { valid: false, errorType: 'invalid_input', errorMessage: 'semanticVector 不能为 null 或 undefined' };
  }
  if (typeof semanticVector !== 'object' || Array.isArray(semanticVector)) {
    return { valid: false, errorType: 'invalid_input', errorMessage: `类型错误: ${typeof semanticVector}` };
  }
  if (activatedChunks !== undefined && !Array.isArray(activatedChunks)) {
    return { valid: false, errorType: 'invalid_input', errorMessage: 'activatedChunks 必须为数组' };
  }
  return { valid: true };
}
```

每个公开方法（`matchNarrative`、`getNarrativeContext`、`getAlternativeMatches`）都必须调用验证。

### 4. 默认原型自动注入（原型健康管理）

当原型文件损坏、不存在或为空时，自动注入一组通用默认原型：

```javascript
const DEFAULT_PROTOTYPES = [
  { id: 'default_hero_journey', name: '英雄之旅', keywords: ['成长','挑战','转变','冒险','克服','学习'] },
  { id: 'default_overcoming_monster', name: '战胜怪物', keywords: ['对抗','冲突','敌人','威胁','危险','战斗'] },
  { id: 'default_quest', name: '追寻之旅', keywords: ['寻找','探索','发现','目标','方向','旅途'] },
  { id: 'default_rags_to_riches', name: '从平凡到卓越', keywords: ['努力','奋斗','成长','成功','改变','机遇'] },
  { id: 'default_rebirth', name: '重生', keywords: ['重生','新生','改变','觉悟','放下','重新开始'] },
];
```

在 `loadPrototypes()` 中实现多层降级：

| 情况 | 行为 | fallbackUsed |
|------|------|-------------|
| 文件正常、原型非空 | 正常加载 | false |
| 文件正常、原型为空 | 注入默认原型 | true |
| 文件正常、JSON 无效 | 注入默认原型，corruptionCount++ | true |
| 文件为空 | 注入默认原型 | true |
| 文件不存在 | 注入默认原型 | true |

### 5. 震荡检测

防止匹配结果在多个原型间反复跳动：

```javascript
_detectOscillation(currentMatch) {
  if (!currentMatch) return { isOscillating: false, detail: null };

  // 记录当前匹配
  this._matchHistory.push({
    id: currentMatch.id,
    name: currentMatch.name,
    timestamp: Date.now()
  });

  // 限制历史大小
  if (this._matchHistory.length > this._maxHistorySize) {
    this._matchHistory.shift();
  }

  // 需要至少 4 次匹配才能检测震荡
  if (this._matchHistory.length < 4) {
    return { isOscillating: false, detail: null };
  }

  const recentWindow = this._matchHistory.slice(-this._maxHistorySize);
  const uniqueIds = new Set(recentWindow.map(m => m.id));
  const switchCount = uniqueIds.size - 1;

  if (switchCount >= this._oscillationThreshold) {
    // 计算频率
    const freqMap = {};
    for (const m of recentWindow) { freqMap[m.id] = (freqMap[m.id] || 0) + 1; }
    const mostFrequent = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0][0];

    return {
      isOscillating: true,
      detail: { windowSize: recentWindow.length, uniquePrototypes: uniqueIds.size, switchCount, mostFrequentId: mostFrequent }
    };
  }
  return { isOscillating: false, detail: null };
}
```

**关键参数**：
- `_maxHistorySize`: 震荡检测窗口（推荐 10）
- `_oscillationThreshold`: 触发震荡的切换次数（推荐 4）

**震荡时的稳定策略** — 选择历史上频率最高的候选：

```javascript
_findStableAlternative(allScores) {
  const sortedByFreq = Object.entries(this._matchFrequency).sort((a, b) => b[1] - a[1]);
  if (sortedByFreq.length > 0) {
    const mostFrequentId = sortedByFreq[0][0];
    const freqScore = allScores.find(s => s.id === mostFrequentId);
    if (freqScore && freqScore.score > 0.1) {
      const proto = this.prototypes.prototypes[mostFrequentId];
      if (proto) return { match: { id: mostFrequentId, name: proto.name, score: freqScore.score }, score: freqScore.score };
    }
  }
  return null;
}
```

### 6. 相似度归一化与置信度校准

```javascript
_normalizeScore(rawScore, allScores) {
  if (allScores.length === 0) return 0;

  // 当第一和第二个候选分数接近时降低置信度
  const sorted = allScores.sort((a, b) => b.score - a.score);
  if (sorted.length >= 2) {
    const top = sorted[0].score;
    const second = sorted[1].score;
    if (top - second < 0.05 && top < 0.5) {
      return top * 0.8; // 不确定性惩罚
    }
  }

  if (rawScore > 0.5) return rawScore;

  // 低分时根据候选密度加权
  const densityFactor = Math.min(allScores.filter(s => s.score > 0.1).length / 5, 1);
  return Math.min(rawScore * (1 + densityFactor * 0.3), 0.7);
}
```

### 7. 匹配频率统计与输入缓存

```javascript
// 在构造函数中初始化
this._matchFrequency = {};      // prototypeId → 匹配次数
this._totalMatches = 0;
this._previousMatches = new Map(); // 输入哈希 → 结果缓存

// 每次匹配后更新
this._matchFrequency[bestMatch.id] = (this._matchFrequency[bestMatch.id] || 0) + 1;
this._totalMatches++;

// 输入缓存（避免重复计算）
const inputHash = quickHash(allKeywords.join('|'));
this._previousMatches.set(inputHash, { matchedPrototype: bestMatch, confidence: normalizedScore });
if (this._previousMatches.size > 100) {
  const oldestKey = this._previousMatches.keys().next().value;
  this._previousMatches.delete(oldestKey);
}
```

### 8. 原型管理增强

```javascript
removePrototype(id) {
  if (!id || typeof id !== 'string') return false; // 验证
  if (!this.prototypes.prototypes[id]) return false; // 存在性检查
  delete this.prototypes.prototypes[id];
  this.prototypes.metadata.count = Object.keys(this.prototypes.prototypes).length;
  this.prototypes.metadata.lastUpdate = new Date().toISOString();
  this.savePrototypes();
  return true;
}

addPrototype(id, name, keywords, framework, emotionalTone, stages) {
  if (!id || typeof id !== 'string') return false;
  if (!Array.isArray(keywords) || keywords.length === 0) return false;
  this.prototypes.prototypes[id] = {
    name: name || id,
    keywords: keywords.map(k => String(k)),
    framework: framework || 'custom',
    emotionalTone: emotionalTone || 'neutral',
    stages: Array.isArray(stages) ? stages : ['start', 'middle', 'end']
  };
  this.prototypes.metadata.count = Object.keys(this.prototypes.prototypes).length;
  this.prototypes.metadata.lastUpdate = new Date().toISOString();
  this.savePrototypes();
  return true;
}

resetMatchState() {
  this._matchHistory = [];
  this._previousMatches.clear();
  this._matchFrequency = {};
  this._totalMatches = 0;
  this.lastMatch = null;
}
```

### 9. 构造顺序陷阱（重要）

**致命错误**：在 `loadPrototypes()` 中使用 `this._prototypeHealth` 但它在构造函数中定义在 `loadPrototypes()` **之后**。

```javascript
// ❌ 致命错误
constructor(projectRoot) {
  this.prototypes = this.loadPrototypes();  // loadPrototypes 中使用了 this._prototypeHealth
  // ...
  this._prototypeHealth = { lastLoadSuccess: true, ... }; // ❌ 此时尚未定义！
}

// ✅ 正确
constructor(projectRoot) {
  this._prototypeHealth = { lastLoadSuccess: true, ... };  // 先定义
  // ...
  this.prototypes = this.loadPrototypes();  // 再使用
}
```

**规则**：构造函数中任何被早期方法（如 `loadPrototypes()`、`_init()`）使用的内部状态，必须在该方法调用**之前**初始化。

### 10. 匹配状态判定

```javascript
_determineMatchStatus(score, isOscillating) {
  if (isOscillating) return MatchStatus.OSCILLATION;
  if (score >= 0.6) return MatchStatus.FULL_MATCH;
  if (score >= 0.3) return MatchStatus.PARTIAL_MATCH;
  if (score >= 0.1) return MatchStatus.WEAK_MATCH;
  return MatchStatus.NO_MATCH;
}
```

### 11. 健康报告

```javascript
getPrototypeStats() {
  return {
    totalPrototypes: Object.keys(this.prototypes.prototypes).length,
    usingDefaults: this.prototypes.metadata.isDefault === true,
    health: { ...this._prototypeHealth },
    matchFrequency: { ...this._matchFrequency },
    totalMatches: this._totalMatches,
    cacheSize: this._previousMatches.size,
    oscillationHistorySize: this._matchHistory.length,
    isOscillating: this._matchHistory.length >= 4 &&
      new Set(this._matchHistory.slice(-this._maxHistorySize).map(m => m.id)).size >= this._oscillationThreshold
  };
}
```

## 升级验证清单

- [ ] `node --check <module-path>` 语法通过
- [ ] `require()` 加载成功，导出主类 + MatchStatus + MatchErrorType
- [ ] `new Class(projectRoot)` 实例化成功
- [ ] `new Class(null)` 抛出预期错误
- [ ] `matchNarrative(null)` 返回 `{ status: 'error', errorType: 'invalid_input' }`
- [ ] `matchNarrative({})` 返回 `{ status: 'no_match' }`
- [ ] 有效输入返回正确的 status + confidence
- [ ] 原型文件损坏时自动注入默认原型（prototypes.metadata.isDefault = true）
- [ ] 震荡检测正确识别 5+ 个原型间的快速切换
- [ ] 震荡时 status = 'oscillation_detected' 且 oscillationDetected = true
- [ ] `removePrototype('')` 返回 false 不崩溃
- [ ] `removePrototype('nonexistent')` 返回 false
- [ ] `calculateSimilarity([], [])` 返回 0
- [ ] `calculateSimilarity(null, undefined)` 返回 0（不崩溃）
- [ ] `getPrototypeStats()` 返回完整统计对象
- [ ] `resetMatchState()` 后所有计数器归零

## 实际案例：narrative-retriever.js v2.2.7 → v2.2.8

**源文件大小**：6238 字节
**升级后大小**：28973 字节

**升级内容**：
1. MatchStatus 枚举（7 种状态）
2. MatchErrorType 枚举（5 种错误类型）
3. `_validateMatchInput()` 统一验证入口
4. 5 个 DEFAULT_PROTOTYPES 默认原型
5. `_createDefaultPrototypeStore()` 自动注入
6. 原型健康管理（corruptionCount、fallbackUsed）
7. `_detectOscillation()` 震荡检测（窗口10次，阈值4次）
8. `_findStableAlternative()` 震荡时稳定策略
9. `_normalizeScore()` 置信度校准
10. `_determineMatchStatus()` 状态判定
11. 匹配频率统计 + LRU 输入缓存（100条上限）
12. `removePrototype()` + `addPrototype()` 参数验证
13. `resetMatchState()` 状态重置
14. `getPrototypeStats()` 完整报告
15. 所有公开方法增加防御性编程（null/undefined/类型检查）
16. 构造顺序修复（`_prototypeHealth` 先于 `loadPrototypes` 初始化）
17. 模块级导出：`{ NarrativeRetriever, MatchStatus, MatchErrorType }`

**向后兼容**：所有原公开方法签名不变，新增字段为附加。
