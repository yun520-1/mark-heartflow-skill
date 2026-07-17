/**
 * TopicScope — 话题作用域隔离
 *
 * 解决的问题：话题A的上下文 不应该 渗透到话题B
 *
 * 设计原则（来自用户反馈）：
 * - 记忆的连续性 = 基本认知的联系，不是所有内容的联系
 * - 两个完全无关的话题，不需要任何联想
 * - 新话题来 → 干净的处理空间，不需要携带旧话题的上下文
 *
 * 能力清单:
 *   话题栈管理        — push/pop/current/stack
 *   话题内存储        — store/get/deleteKeys
 *   工作上下文        — setContext/getContext/clearContext
 *   ✅ 话题相似度检测  — 基于N-gram重叠的简单相似度评分
 *   ✅ 话题归属判定    — contains(query) 判断输入是否属于当前话题
 *   ✅ 话题过期清理    — 自动移除超过TTL的冷话题
 *   ✅ 话题合并        — merge(topicA, topicB) 合并两个相关话题
 *   ✅ 内存保护        — maxTopics 上限 + 存储大小追踪
 *   ✅ 事件钩子        — onTopicEnter/onTopicExit/onTopicCreate/onTopicExpire
 *   ✅ 存储容量告警    — storeSize() + 容量阈值触发清理
 *   记忆桥接          — 桥接到 MeaningfulMemory
 *
 * API:
 *   TopicScope.push('话题名')   → 进入话题，上下文隔离
 *   TopicScope.pop()            → 退出话题，恢复之前上下文
 *   TopicScope.store('key', val) → 只存在当前话题的存储里
 *   TopicScope.get('key')       → 只从当前话题读取
 *   TopicScope.contains(query)  → 判断查询是否属于当前话题
 *   TopicScope.merge(topicA, topicB) → 合并两个话题
 *   TopicScope.clear()          → 清空当前话题所有存储
 *   TopicScope.cleanupExpired() → 手动触发过期清理
 *   TopicScope.current          → 当前话题名
 *   TopicScope.storeSize()      → 当前话题存储大小（字节估算）
 *
 * @version 2.0.0
 */

class TopicScope {
  /**
   * @param {Object} options
   * @param {Object} [options.memoryBridge] - MeaningfulMemory 实例
   * @param {number} [options.maxTopics=50] - 最大话题数，超过时触发LRU淘汰
   * @param {number} [options.topicTTL=3600000] - 话题存活时间(ms)，默认1小时
   * @param {number} [options.maxStoreBytes=65536] - 单话题最大存储字节数(64KB)
   * @param {Object} [options.hooks] - 事件钩子 { onTopicEnter, onTopicExit, onTopicCreate, onTopicExpire }
   */
  constructor(options = {}) {
    /** @type {Map<string, {store:Object, context:Object, createdAt:number, lastAccess:number, ttl:number, storeBytes:number}>} */
    this._topics = new Map();
    this._stack = [];           // 话题栈，记录进入顺序
    this._current = null;        // 当前话题名
    this._context = {};          // 当前话题的"工作上下文"（模拟AI当前在处理什么）
    this._memoryBridge = options.memoryBridge || null;
    this._maxTopics = options.maxTopics || 50;
    this._topicTTL = options.topicTTL || 3600000;   // 1h
    this._maxStoreBytes = options.maxStoreBytes || 65536;
    this._hooks = options.hooks || {};
    this._totalExpired = 0;
  }

  // ==========================================================================
  // 核心话题栈管理
  // ==========================================================================

  /**
   * 注入 MeaningfulMemory 实例，建立桥接
   * @param {object} memory - MeaningfulMemory 实例
   */
  setMemoryBridge(memory) {
    this._memoryBridge = memory;
    return this;
  }

  /**
   * 进入话题（push）
   * @param {string} topic - 话题名
   * @param {object} initialContext - 进入话题时的初始上下文（可选）
   */
  push(topic, initialContext = {}) {
    // 保存当前话题的上下文（如果存在）
    if (this._current !== null) {
      const currentData = this._topics.get(this._current);
      if (currentData) {
        currentData.context = { ...this._context };
        currentData.store = { ...currentData.store };
        currentData.lastAccess = Date.now();
      }
    }

    // 内存保护：如果话题数超限，淘汰最久未访问的话题
    this._enforceMaxTopics();

    // 进入新话题
    if (!this._topics.has(topic)) {
      // 新话题：干净存储
      this._topics.set(topic, {
        store: {},
        context: {},
        createdAt: Date.now(),
        lastAccess: Date.now(),
        ttl: this._topicTTL,
        storeBytes: 0
      });
      this._fireHook('onTopicCreate', topic);
    } else {
      // 已有话题：恢复之前保存的上下文
      const saved = this._topics.get(topic);
      this._context = { ...saved.context };
      saved.lastAccess = Date.now();
    }

    // 初始化上下文（如果有初始内容）
    if (Object.keys(initialContext).length > 0) {
      this._context = { ...this._context, ...initialContext };
    }

    this._current = topic;
    if (!this._stack.includes(topic)) {
      this._stack.push(topic);
    }
    this._fireHook('onTopicEnter', topic);

    // 桥接到 MeaningfulMemory
    if (this._memoryBridge) {
      this._memoryBridge.setCurrentTopic(topic);
    }

    return this;
  }

  /**
   * 退出话题（pop）
   * 保存当前话题状态，然后恢复上一个
   */
  pop() {
    if (this._stack.length <= 1) {
      return this;
    }

    // 保存当前话题
    if (this._current !== null) {
      const currentData = this._topics.get(this._current);
      if (currentData) {
        currentData.context = { ...this._context };
        currentData.lastAccess = Date.now();
      }
    }

    const prevTopic = this._current;
    // 弹出当前，恢复上一个
    this._stack.pop();
    this._current = this._stack[this._stack.length - 1] || null;

    if (this._current !== null) {
      const saved = this._topics.get(this._current);
      if (saved) {
        this._context = { ...saved.context };
        saved.lastAccess = Date.now();
      }
    } else {
      this._context = {};
    }

    if (prevTopic !== null) {
      this._fireHook('onTopicExit', prevTopic);
    }

    return this;
  }

  // ==========================================================================
  // 话题内存储
  // ==========================================================================

  /**
   * 在当前话题里存储数据
   */
  store(key, value) {
    if (this._current === null) return this;
    const topicData = this._topics.get(this._current);
    if (topicData) {
      const oldSize = this._estimateValueBytes(topicData.store[key]);
      const newSize = this._estimateValueBytes(value);
      topicData.store[key] = value;
      topicData.storeBytes = topicData.storeBytes - oldSize + newSize;
      topicData.lastAccess = Date.now();

      // 存储容量告警：超过80%阈值时触发警告
      if (topicData.storeBytes > this._maxStoreBytes * 0.8) {
      }
    }
    return this;
  }

  /**
   * 从当前话题读取数据
   */
  get(key) {
    if (this._current === null) return undefined;
    const topicData = this._topics.get(this._current);
    if (topicData) {
      topicData.lastAccess = Date.now();
      return topicData.store[key];
    }
    return undefined;
  }

  /**
   * 删除当前话题中的指定键
   */
  deleteKeys(...keys) {
    if (this._current === null) return this;
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

  /**
   * 把数据存入当前话题的工作上下文
   * context 和 store 的区别：
   * - store: 话题的"知识库"（问答记录等）
   * - context: 话题的"当前处理状态"（AI正在处理的内容）
   */
  setContext(key, value) {
    this._context[key] = value;
    return this;
  }

  getContext(key) {
    return this._context[key];
  }

  /**
   * 清空当前话题的工作上下文（但保留store）
   */
  clearContext() {
    this._context = {};
    return this;
  }

  /**
   * 清空当前话题所有存储（完全重置）
   */
  clearAll() {
    if (this._current === null) return this;
    this._topics.set(this._current, {
      store: {},
      context: {},
      createdAt: Date.now(),
      lastAccess: Date.now(),
      ttl: this._topicTTL,
      storeBytes: 0
    });
    this._context = {};
    return this;
  }

  // ==========================================================================
  // ✅ 新增：话题相似度检测（基于N-gram重叠评分）
  // ==========================================================================

  /**
   * 计算两个字符串的N-gram相似度（0~1）
   * @private
   * @param {string} a
   * @param {string} b
   * @param {number} [n=2] - N-gram 长度
   * @returns {number} 相似度分数
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
   * @param {string} text - 待检测文本
   * @param {number} [threshold=0.3] - 相似度阈值
   * @returns {{ topic: string|null, score: number, topics: Array<{topic:string, score:number}> }}
   */
  findSimilarTopic(text, threshold = 0.3) {
    if (!text || this._topics.size === 0) {
      return { topic: null, score: 0, topics: [] };
    }
    const scored = [];
    for (const [name] of this._topics) {
      const score = this._ngramSimilarity(text, name);
      if (score >= threshold) {
        scored.push({ topic: name, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return {
      topic: scored.length > 0 ? scored[0].topic : null,
      score: scored.length > 0 ? scored[0].score : 0,
      topics: scored
    };
  }

  /**
   * ✅ 新增：判断一个查询是否属于当前话题
   * 基于当前话题名与查询文本的相似度
   * @param {string} query - 用户输入
   * @param {number} [threshold=0.25] - 归属判定阈值
   * @returns {{ belongs: boolean, score: number, reason: string }}
   */
  contains(query, threshold = 0.25) {
    if (this._current === null) {
      return { belongs: false, score: 0, reason: '无当前话题' };
    }
    if (!query || query.trim().length === 0) {
      return { belongs: true, score: 0.5, reason: '空查询，保留当前话题' };
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

  // ==========================================================================
  // ✅ 新增：话题合并
  // ==========================================================================

  /**
   * 合并两个话题
   * 将 sourceTopic 的内容合并到 targetTopic，然后删除 sourceTopic
   * @param {string} targetTopic - 目标话题（保留）
   * @param {string} sourceTopic - 源话题（合并后删除）
   * @returns {{ ok: boolean, merged: number, error?: string }}
   */
  merge(targetTopic, sourceTopic) {
    if (targetTopic === sourceTopic) {
      return { ok: false, merged: 0, error: '不能合并相同话题' };
    }
    const target = this._topics.get(targetTopic);
    const source = this._topics.get(sourceTopic);
    if (!target) return { ok: false, merged: 0, error: `目标话题[${targetTopic}]不存在` };
    if (!source) return { ok: false, merged: 0, error: `源话题[${sourceTopic}]不存在` };

    // 合并 store
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
    // 更新访问时间
    target.lastAccess = Math.max(target.lastAccess, source.lastAccess);
    target.createdAt = Math.min(target.createdAt, source.createdAt);

    // 删除源话题
    this._topics.delete(sourceTopic);

    // 如果源话题在栈中，替换为合并后的目标话题
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

  // ==========================================================================
  // ✅ 新增：话题过期清理 & 内存保护
  // ==========================================================================

  /**
   * 内存保护：如果话题数超限，淘汰最久未访问的话题
   * @private
   */
  _enforceMaxTopics() {
    while (this._topics.size >= this._maxTopics) {
      // 找出最久未访问的话题（排除当前话题和栈中话题）
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

  /**
   * ✅ 新增：清理过期的冷话题
   * 自动移除超过TTL且未在栈中的话题
   * @param {number} [customTTL] - 可选的自定义TTL覆盖
   * @returns {number} 清理的话题数
   */
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

  /**
   * 获取当前话题存储大小（字节估算）
   * @returns {{ bytes: number, limit: number, percent: number }}
   */
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

  // ==========================================================================
  // ✅ 新增：事件钩子系统
  // ==========================================================================

  /**
   * 设置事件钩子
   * @param {Object} hooks - { onTopicEnter, onTopicExit, onTopicCreate, onTopicExpire }
   */
  setHooks(hooks) {
    Object.assign(this._hooks, hooks);
    return this;
  }

  /**
   * 触发事件钩子
   * @private
   */
  _fireHook(name, topic) {
    if (typeof this._hooks[name] === 'function') {
      try {
        this._hooks[name](topic, this);
      } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
    }
  }

  // ==========================================================================
  // ✅ 新增：工具方法
  // ==========================================================================

  /**
   * 估算值的字节数
   * @private
   */
  _estimateValueBytes(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Buffer.isBuffer(value)) return value.length;
    // 对象/数组
    try {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      return 1024; // 保守估计
    }
  }

  // ==========================================================================
  // 查询 & 诊断
  // ==========================================================================

  get current() { return this._current; }
  get stack() { return [...this._stack]; }

  /**
   * 获取所有话题概览（不含详细内容）
   */
  getTopics() {
    const now = Date.now();
    return Array.from(this._topics.entries()).map(([name, data]) => ({
      name,
      storeKeys: Object.keys(data.store),
      storeBytes: data.storeBytes,
      hasContext: Object.keys(data.context).length > 0,
      age: now - data.createdAt,
      idleTime: now - data.lastAccess,
      expired: (now - data.lastAccess) > data.ttl
    }));
  }

  /**
   * 获取统计信息
   */
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

  /**
   * 诊断：打印当前状态
   */
  diagnose(label = '') {
    for (const [name, data] of this._topics) {
      const storeInfo = `(${data.storeBytes}字节, ${Object.keys(data.store).length}键)`;
    }
    return this;
  }
}

module.exports = { TopicScope };
