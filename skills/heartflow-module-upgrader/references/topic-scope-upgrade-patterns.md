# TopicScope / 话题隔离类升级模式

## 识别特征

话题隔离类模块管理**层级化上下文作用域**，核心操作是 push/pop/store/get 话题栈。典型特征：

- 有一个话题栈（`_stack` 数组）和当前话题指针（`_current`）
- 提供 `push(topicName)` / `pop()` 进入/退出话题
- 提供 `store(key, value)` / `get(key)` 在当前话题内读写数据
- 通常不依赖外部 API（纯内存操作）
- 代码结构为 class 而非独立函数

**最小实现（~5-6KB）** 仅有栈管理 + 基本读写，缺少智能检测、自我保护、生命周期管理。

## 判断标准：功能不完整的表现

| 检查项 | 不完整表现 | 升级方向 |
|--------|-----------|---------|
| 话题匹配 | 仅精确字符串匹配 | N-gram/字符重叠相似度检测 |
| 归属判定 | 无 `contains(query)` 方法 | 基于相似度+store key二次匹配 |
| 内存保护 | 无上限，话题数无限增长 | maxTopics + LRU淘汰 |
| 过期清理 | 无TTL机制，冷话题永远存在 | cleanupExpired() + TTL |
| 话题合并 | 无 `merge()` 方法 | 合并store/context，删除源话题 |
| 事件钩子 | 无生命周期回调 | onTopicEnter/Exit/Create/Expire |
| 存储追踪 | 无容量监控 | storeSize() + 字节追踪 + 告警 |
| 键删除 | 无 `deleteKeys()` | 精确删除+字节回收 |

## 标准升级清单

### 1. 话题相似度检测

```javascript
/**
 * 计算两个字符串的N-gram相似度（0~1）
 * @private
 */
_ngramSimilarity(a, b, n = 2) {
  if (!a || !b) return 0;
  const normA = a.toLowerCase().replace(/[\s,.\-!?]+/g, ' ').trim();
  const normB = b.toLowerCase().replace(/[\s,.\-!?]+/g, ' ').trim();
  if (normA === normB) return 1.0;
  if (normA.length < n || normB.length < n) {
    // 短字符串用字符重叠
    const setA = new Set(normA);
    const setB = new Set(normB);
    const intersect = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersect.size / union.size;
  }
  const gramsA = new Set();
  const gramsB = new Set();
  for (let i = 0; i <= normA.length - n; i++) gramsA.add(normA.slice(i, i + n));
  for (let i = 0; i <= normB.length - n; i++) gramsB.add(normB.slice(i, i + n));
  const intersect = new Set([...gramsA].filter(g => gramsB.has(g)));
  const union = new Set([...gramsA, ...gramsB]);
  return union.size === 0 ? 0 : intersect.size / union.size;
}

/**
 * 查找与给定文本最相似的话题
 */
findSimilarTopic(text, threshold = 0.3) {
  // 遍历 _topics Map，对每个话题名计算 ngramSimilarity
  // 返回 { topic, score, topics[] }
}
```

**注意**：中英文混合场景下，N-gram 天然匹配中文连续字符（如"人工智能"匹配"人工智能伦理"得分 0.43）。跨语言场景（中文话题 vs 英文查询）得分较低，这是预期行为。

### 2. 话题归属判定（contains）

```javascript
/**
 * 判断一个查询是否属于当前话题
 * 基于相似度 + store key 二次匹配
 */
contains(query, threshold = 0.25) {
  if (this._current === null) {
    return { belongs: false, score: 0, reason: '无当前话题' };
  }
  const score = this._ngramSimilarity(query, this._current);
  if (score >= threshold) {
    return { belongs: true, score, reason: `与话题[${this._current}]相似度 ${score.toFixed(2)} >= ${threshold}` };
  }
  // 二次检查：检查是否与当前话题的store key有交集
  const topicData = this._topics.get(this._current);
  if (topicData) {
    const queryLower = query.toLowerCase();
    for (const key of Object.keys(topicData.store)) {
      if (queryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(queryLower)) {
        return { belongs: true, score: 0.3, reason: `查询与存储键"${key}"匹配` };
      }
    }
  }
  return { belongs: false, score, reason: `与话题[${this._current}]相似度 ${score.toFixed(2)} < ${threshold}` };
}
```

**边界情况**：空查询应返回 `belongs: true`（保留当前话题）。阈值过低（<0.15）可能导致过多误匹配。

### 3. 内存保护（LRU淘汰）

```javascript
_enforceMaxTopics() {
  while (this._topics.size >= this._maxTopics) {
    // 找出最久未访问的话题（排除栈中话题）
    let oldest = null;
    let oldestTime = Infinity;
    const protectedSet = new Set(this._stack);
    for (const [name, data] of this._topics) {
      if (protectedSet.has(name)) continue;
      if (data.lastAccess < oldestTime) {
        oldestTime = data.lastAccess;
        oldest = name;
      }
    }
    if (!oldest) break; // 所有话题都在栈中，无法淘汰
    this._topics.delete(oldest);
    this._totalExpired++;
  }
}
```

**关键**：栈中的话题（活跃话题链）不能被淘汰——用 `protectedSet` 保护。

### 4. 过期清理（TTL）

```javascript
cleanupExpired(customTTL) {
  const ttl = customTTL || this._topicTTL;
  const now = Date.now();
  const protectedSet = new Set(this._stack);
  const expired = [];
  for (const [name, data] of this._topics) {
    if (protectedSet.has(name)) continue;
    if (now - data.lastAccess > ttl) {
      expired.push(name);
    }
  }
  for (const name of expired) {
    this._topics.delete(name);
    this._totalExpired++;
    this._fireHook('onTopicExpire', name);
  }
  return expired.length;
}
```

**注意**：`cleanupExpired` 只在主动调用时执行，不会自动触发。适合在 `push()` 或周期任务中调用。

### 5. 话题合并

```javascript
merge(targetTopic, sourceTopic) {
  if (targetTopic === sourceTopic) {
    return { ok: false, merged: 0, error: '不能合并相同话题' };
  }
  const target = this._topics.get(targetTopic);
  const source = this._topics.get(sourceTopic);
  if (!target) return { ok: false, merged: 0, error: '目标话题不存在' };
  if (!source) return { ok: false, merged: 0, error: '源话题不存在' };

  // 合并 store（不覆盖已有键）
  let mergedCount = 0;
  for (const [key, value] of Object.entries(source.store)) {
    if (!(key in target.store)) {
      target.store[key] = value;
      target.storeBytes += this._estimateValueBytes(value);
      mergedCount++;
    }
  }
  // 合并 context
  Object.assign(target.context, source.context);
  target.lastAccess = Math.max(target.lastAccess, source.lastAccess);
  target.createdAt = Math.min(target.createdAt, source.createdAt);

  // 删除源话题
  this._topics.delete(sourceTopic);

  // 修复栈引用：栈中源话题名替换为目标话题名
  for (let i = 0; i < this._stack.length; i++) {
    if (this._stack[i] === sourceTopic) {
      this._stack[i] = targetTopic;
    }
  }
  if (this._current === sourceTopic) {
    this._current = targetTopic;
  }

  return { ok: true, merged: mergedCount };
}
```

**边界情况**：合并后必须修复栈引用，否则 `current` 指针可能指向已删除的话题。

### 6. 事件钩子系统

```javascript
setHooks(hooks) {
  Object.assign(this._hooks, hooks);
  return this;
}

_fireHook(name, topic) {
  if (typeof this._hooks[name] === 'function') {
    try {
      this._hooks[name](topic, this);
    } catch (e) {
      console.warn(`[TopicScope] 钩子[${name}]执行失败:`, e.message);
    }
  }
}
```

**支持的钩子**：`onTopicEnter` / `onTopicExit` / `onTopicCreate` / `onTopicExpire`

### 7. 存储容量追踪

```javascript
_estimateValueBytes(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
  if (typeof value === 'number') return 8;
  if (typeof value === 'boolean') return 4;
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8'); }
  catch { return 1024; }
}

storeSize() {
  if (this._current === null) return { bytes: 0, limit: this._maxStoreBytes, percent: 0 };
  const topicData = this._topics.get(this._current);
  if (!topicData) return { bytes: 0, limit: this._maxStoreBytes, percent: 0 };
  return {
    bytes: topicData.storeBytes,
    limit: this._maxStoreBytes,
    percent: Math.round((topicData.storeBytes / this._maxStoreBytes) * 100)
  };
}
```

**集成到 store() 方法**：
```javascript
store(key, value) {
  const oldSize = this._estimateValueBytes(topicData.store[key]);
  const newSize = this._estimateValueBytes(value);
  topicData.store[key] = value;
  topicData.storeBytes = topicData.storeBytes - oldSize + newSize;
  // 80% 阈值告警
  if (topicData.storeBytes > this._maxStoreBytes * 0.8) {
    console.warn(`[TopicScope] 存储已达 ${topicData.storeBytes}/${this._maxStoreBytes} 字节`);
  }
}
```

### 8. 键删除 + 字节回收

```javascript
deleteKeys(...keys) {
  const topicData = this._topics.get(this._current);
  if (topicData) {
    for (const key of keys) {
      const removed = this._estimateValueBytes(topicData.store[key]);
      delete topicData.store[key];
      topicData.storeBytes = Math.max(0, topicData.storeBytes - removed);
    }
  }
  return this;
}
```

## 数据模型变更

升级时，`_topics` Map 中的话题数据对象需要增加字段：

```javascript
// 旧数据模型
{
  store: {},
  context: {},
  createdAt: Date.now()
}

// 新数据模型
{
  store: {},
  context: {},
  createdAt: Date.now(),
  lastAccess: Date.now(),     // 新增：LRU淘汰需要
  ttl: 3600000,                // 新增：默认TTL
  storeBytes: 0                // 新增：存储字节追踪
}
```

## 构造函数参数

```javascript
constructor(options = {}) {
  this._maxTopics = options.maxTopics || 50;
  this._topicTTL = options.topicTTL || 3600000;   // 1h
  this._maxStoreBytes = options.maxStoreBytes || 65536;  // 64KB
  this._hooks = options.hooks || {};
  this._memoryBridge = options.memoryBridge || null;
  // ...
}
```

## 统计信息

```javascript
getStats() {
  return {
    activeTopics: this._topics.size,
    maxTopics: this._maxTopics,
    stackDepth: this._stack.length,
    currentTopic: this._current,
    totalExpired: this._totalExpired,
    topicTTL: this._topicTTL,
    maxStoreBytes: this._maxStoreBytes
  };
}
```

## 验证测试模板

```javascript
const { TopicScope } = require('./src/core/memory/topic-scope.js');
const ts = new TopicScope({ maxTopics: 10, topicTTL: 60000 });

// 1. Core operations
ts.push('测试话题').store('key', 'value');
console.log('get:', ts.get('key') === 'value' ? '✓' : '✗');

// 2. Contains
const c = ts.contains('测试话题相关查询');
console.log('contains:', c.belongs === true ? '✓' : '✗');

// 3. Similar topic
const sim = ts.findSimilarTopic('测试');
console.log('similar:', sim.topic !== null ? '✓' : '✗');

// 4. Merge
ts.push('子话题').store('sub', 'data');
const merge = ts.merge('测试话题', '子话题');
console.log('merge:', merge.ok ? '✓' : '✗');

// 5. Store size
ts.store('big', 'x'.repeat(10000));
const sz = ts.storeSize();
console.log('storeSize:', sz.bytes >= 10000 ? '✓' : '✗');

// 6. Delete keys
ts.deleteKeys('sub');
console.log('deleteKeys:', ts.get('sub') === undefined ? '✓' : '✗');

// 7. Expiry
const ts2 = new TopicScope({ topicTTL: 60000 });
ts2._topics.set('stale', { store: {}, context: {}, createdAt: Date.now()-7200000, lastAccess: Date.now()-7200000, ttl: 60000, storeBytes: 0 });
const expired = ts2.cleanupExpired(3600000);
console.log('expiry:', expired === 1 ? '✓' : '✗');

// 8. Memory protection
const ts3 = new TopicScope({ maxTopics: 2 });
ts3.push('a');
ts3.push('b');
console.log('memory:', ts3._topics.size <= 2 ? '✓' : '✗');

// 9. Hooks
let fired = false;
const ts4 = new TopicScope({ hooks: { onTopicCreate: (t) => { fired = true; } } });
ts4.push('test');
console.log('hooks:', fired ? '✓' : '✗');

// 10. Stats
const stats = ts.getStats();
console.log('stats:', stats.activeTopics > 0 ? '✓' : '✗');
```

## 已知陷阱

### 1. 栈中话题保护
`_enforceMaxTopics()` 和 `cleanupExpired()` 都必须用 `protectedSet = new Set(this._stack)` 保护栈中话题。否则 push 时可能把自己淘汰。

### 2. lastAccess 更新时机
`push()` 到已有话题时，`lastAccess` 会被更新。所以如果在 push 之前手动修改 lastAccess 为很旧的值，push 操作会覆盖它。正确做法：直接通过 `_topics.set()` 操作 Map（绕过 push）来创建冷话题。

### 3. contains() 空查询
空查询应返回 `belongs: true` 避免不必要的跳转。阈值应设在 0.2-0.3 之间——过低导致误匹配，过高导致频繁跳转。

### 4. Merge 后栈修复
`merge()` 后栈中的源话题名必须替换为目标话题名，否则 `current` 指向已删除的话题。`pop()` 也会因为栈中引用失效而出错。

### 5. 字节估算精度
`_estimateValueBytes()` 对对象用 `JSON.stringify` 估算，但嵌套对象的 toString 损耗不精确。对于大多数场景足够了——这不是精确计费，是容量告警。

## 完整实现参考

最终实现约 19KB（从 ~5.8KB 升级），位于 `src/core/memory/topic-scope.js`。主要类 `TopicScope` 导出。
