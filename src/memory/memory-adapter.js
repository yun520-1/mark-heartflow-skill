/**
 * MemoryAdapter — 兼容层适配器
 * 
 * 将新版 src/core/meaningful-memory.js 的 API 包装成
 * 旧版 src/memory/meaningful-memory.js 的接口，实现无缝替换。
 * 
 * 数据模型映射：
 *   旧版：{ key: { value, tags, createdAt, updatedAt, accessCount } } (object)
 *   新版：[{ id, timestamp, layer, content, summary, embedding, metadata, importance, ... }] (array)
 * 
 * 适配策略：
 *   - 在新版 MeaningfulMemory 实例上操作 layers 数组
 *   - 将 key-value 操作翻译为数组的 find/push/filter
 *   - 保持旧版 getStats() 返回 { core, learned, ephemeral } 格式
 *   - 提供 this.core / this.learned / this.ephemeral 兼容属性（getter）
 */

const { MeaningfulMemory } = require('./meaningful-memory.js');

class MemoryAdapter {
  /**
   * @param {string} rootPath — 项目根路径（旧版构造参数，用于兼容）
   */
  constructor(rootPath) {
    this.rootPath = rootPath;
    this._mm = new MeaningfulMemory({ rootPath });

    // 兼容属性 — 将数组转换为旧版 key-value 对象格式
    // 使用 getter 确保每次访问时从 _mm.layers 同步
    Object.defineProperty(this, 'core', {
      get: () => this._arrayToObject(this._mm.layers.core),
      enumerable: true,
    });
    Object.defineProperty(this, 'learned', {
      get: () => this._arrayToObject(this._mm.layers.learned),
      enumerable: true,
    });
    Object.defineProperty(this, 'ephemeral', {
      get: () => this._arrayToObject(this._mm.layers.ephemeral),
      enumerable: true,
    });
  }

  // ─── 内部转换工具 ──────────────────────────────────────────────────────

  /**
   * 新版数组 → 旧版 key-value 对象
   * [{ id: 'k1', content: 'v1', metadata: { tags: [...] } }, ...]
   * → { k1: { value: 'v1', tags: [...], createdAt, updatedAt, accessCount } }
   */
  _arrayToObject(arr) {
    const obj = {};
    for (const mem of arr) {
      const key = mem.metadata?.key || mem.id;
      obj[key] = {
        value: mem.content,
        tags: mem.metadata?.tags || [],
        createdAt: mem.createdAt || mem.timestamp,
        updatedAt: mem.updatedAt || mem.timestamp,
        accessCount: mem.accessCount || 0,
        importance: mem.importance,
        summary: mem.summary,
      };
    }
    return obj;
  }

  /**
   * 在指定 layer 中按 metadata.key 查找条目
   */
  _findByKey(layer, key) {
    return this._mm.layers[layer]?.find(m => (m.metadata?.key || m.id) === key) || null;
  }

  /**
   * 从指定 layer 中按 metadata.key 删除条目
   */
  _deleteByKey(layer, key) {
    const arr = this._mm.layers[layer];
    if (!arr) return false;
    const idx = arr.findIndex(m => (m.metadata?.key || m.id) === key);
    if (idx === -1) return false;
    const removed = arr[idx];
    arr.splice(idx, 1);
    this._mm.vectors.delete(removed.id);
    return true;
  }

  /**
   * 向指定 layer 添加一条 key-value 记录
   */
  _addToLayer(layer, key, value, tags = [], importance = 10) {
    const existing = this._findByKey(layer, key);
    const now = Date.now();

    if (existing) {
      existing.content = value;
      existing.summary = String(value).slice(0, 120);
      existing.metadata.tags = [...new Set([...(existing.metadata.tags || []), ...tags])];
      existing.updatedAt = now;
      return { success: true, key, tier: layer.toUpperCase(), updated: true };
    }

    const id = this._mm.generateId();
    const record = {
      id,
      timestamp: now,
      layer,
      content: value,
      summary: String(value).slice(0, 120),
      embedding: this._mm.generateMockEmbedding(String(value)),
      metadata: { key, tags, topic: this._mm._currentTopic || null },
      importance,
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this._mm.layers[layer].push(record);
    this._mm.vectors.set(id, record.embedding);
    this._mm.stats.totalMemories = this._mm.layers.core.length + this._mm.layers.learned.length + this._mm.layers.ephemeral.length;
    this._mm._autoSave();
    return { success: true, key, tier: layer.toUpperCase(), updated: false };
  }

  // ─── CORE — Identity Rules ────────────────────────────────────────────

  addCore(key, value, tags = []) {
    return this._addToLayer('core', key, value, tags, 20);
  }

  getCore(key) {
    const mem = this._findByKey('core', key);
    if (!mem) return null;
    return {
      value: mem.content,
      tags: mem.metadata?.tags || [],
      createdAt: mem.createdAt,
      updatedAt: mem.updatedAt,
    };
  }

  listCore() {
    return this._mm.layers.core.map(mem => ({
      key: mem.metadata?.key || mem.id,
      value: mem.content,
      tags: mem.metadata?.tags || [],
      createdAt: mem.createdAt,
      updatedAt: mem.updatedAt,
    }));
  }

  countCore() {
    return this._mm.layers.core.length;
  }

  // ─── LEARNED — Accumulated Knowledge ──────────────────────────────────

  learn(key, value, tags = [], spacedRepetition = null) {
    // 如果 key 已存在于 CORE，拒绝写入 LEARNED
    if (this._findByKey('core', key)) {
      return { success: false, reason: 'key_in_core', key };
    }
    const extraTags = [...tags];
    if (spacedRepetition) extraTags.push('spaced-repetition');
    return this._addToLayer('learned', key, value, extraTags, 12);
  }

  recall(key) {
    const mem = this._findByKey('learned', key);
    if (!mem) return null;
    mem.accessCount = (mem.accessCount || 0) + 1;
    mem.updatedAt = Date.now();
    this._mm._autoSave();
    return {
      value: mem.content,
      tags: mem.metadata?.tags || [],
      accessCount: mem.accessCount,
      lastAccessed: mem.updatedAt,
      createdAt: mem.createdAt,
    };
  }

  forget(key) {
    if (this._deleteByKey('learned', key)) {
      this._mm.stats.totalMemories = this._mm.layers.core.length + this._mm.layers.learned.length + this._mm.layers.ephemeral.length;
      this._mm._autoSave();
      return { success: true, key };
    }
    return { success: false, reason: 'key_not_found' };
  }

  listLearned(query = null) {
    let entries = this._mm.layers.learned.map(mem => ({
      key: mem.metadata?.key || mem.id,
      value: mem.content,
      tags: mem.metadata?.tags || [],
      accessCount: mem.accessCount || 0,
      lastAccessed: mem.updatedAt || mem.timestamp,
      createdAt: mem.createdAt,
    }));
    if (query) {
      const q = query.toLowerCase();
      entries = entries.filter(e =>
        e.key.toLowerCase().includes(q) ||
        (e.value && e.value.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return entries;
  }

  countLearned() {
    return this._mm.layers.learned.length;
  }

  // ─── EPHEMERAL — Working Memory ───────────────────────────────────────

  remember(key, value, ttlMs = 3600000) {
    const MAX_KEY_LEN = 256;
    const MAX_VALUE_LEN = 102400;
    if (typeof key !== 'string' || key.length > MAX_KEY_LEN) {
      return { success: false, reason: 'key_too_long', limit: MAX_KEY_LEN };
    }
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (serialized.length > MAX_VALUE_LEN) {
      return { success: false, reason: 'value_too_large', limit: MAX_VALUE_LEN };
    }

    const existing = this._findByKey('ephemeral', key);
    if (existing) {
      existing.content = serialized;
      existing.metadata.ttl = ttlMs;
      existing.updatedAt = Date.now();
      this._mm._autoSave();
      return { success: true, key, tier: 'EPHEMERAL' };
    }

    const now = Date.now();
    const id = this._mm.generateId();
    const record = {
      id,
      timestamp: now,
      layer: 'ephemeral',
      content: serialized,
      summary: String(serialized).slice(0, 120),
      embedding: this._mm.generateMockEmbedding(serialized),
      metadata: { key, tags: [], ttl: ttlMs, topic: this._mm._currentTopic || null },
      importance: 5,
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this._mm.layers.ephemeral.push(record);
    this._mm.vectors.set(id, record.embedding);
    this._mm.stats.totalMemories = this._mm.layers.core.length + this._mm.layers.learned.length + this._mm.layers.ephemeral.length;
    this._mm._autoSave();
    return { success: true, key, tier: 'EPHEMERAL' };
  }

  getWorking(key) {
    const mem = this._findByKey('ephemeral', key);
    if (!mem) return null;
    const ttl = mem.metadata?.ttl || 3600000;
    if (Date.now() - mem.createdAt > ttl) {
      this._deleteByKey('ephemeral', key);
      this._mm._autoSave();
      return null;
    }
    mem.accessCount = (mem.accessCount || 0) + 1;
    return { value: mem.content, ttl, createdAt: mem.createdAt, _accessCount: mem.accessCount };
  }

  forgetWorking(key) {
    if (this._deleteByKey('ephemeral', key)) {
      this._mm._autoSave();
      return { success: true };
    }
    return { success: false };
  }

  countEphemeral() {
    return this._mm.layers.ephemeral.length;
  }

  // ─── Consolidation ────────────────────────────────────────────────────

  consolidate() {
    const promoted = [];
    const now = Date.now();
    const ephemeral = this._mm.layers.ephemeral;

    for (let i = ephemeral.length - 1; i >= 0; i--) {
      const mem = ephemeral[i];
      const age = now - mem.createdAt;
      const accessCount = mem.accessCount || 0;
      const heatScore = accessCount + ((mem.metadata?.key || '').startsWith('signal:') ? 1 : 0);

      if (heatScore >= 3 || age > 1800000) {
        const key = mem.metadata?.key || mem.id;
        const tags = [...(mem.metadata?.tags || []), 'consolidated'];
        if (key.startsWith('signal:')) tags.push('emotion_signal');

        // 移到 learned 层
        this._addToLayer('learned', key, mem.content, tags, mem.importance || 12);
        ephemeral.splice(i, 1);
        promoted.push(key);
      }
    }

    if (promoted.length > 0) {
      this._mm.stats.totalMemories = this._mm.layers.core.length + this._mm.layers.learned.length + this._mm.layers.ephemeral.length;
      this._mm._autoSave();
    }

    return { promoted, learnedCount: this._mm.layers.learned.length };
  }

  // ─── Stats ────────────────────────────────────────────────────────────

  getStats() {
    return {
      core: this._mm.layers.core.length,
      learned: this._mm.layers.learned.length,
      ephemeral: this._mm.layers.ephemeral.length,
    };
  }

  getMemoryStats() {
    const stats = this.getStats();
    const core = this.listCore();
    const learned = this.listLearned();
    return {
      ...stats,
      core_samples: core.slice(0, 3),
      learned_samples: learned.slice(0, 5),
    };
  }

  // ─── Search ───────────────────────────────────────────────────────────

  search(query) {
    const q = query.toLowerCase();
    const results = [];

    for (const layer of ['core', 'learned', 'ephemeral']) {
      for (const mem of this._mm.layers[layer]) {
        const key = mem.metadata?.key || mem.id;
        const val = String(mem.content || '');
        if (key.toLowerCase().includes(q) || val.toLowerCase().includes(q)) {
          results.push({
            key,
            tier: layer.toUpperCase(),
            value: mem.content,
            tags: mem.metadata?.tags || [],
            accessCount: mem.accessCount || 0,
          });
        }
      }
    }

    return results;
  }

  searchByKeywords(keywords, limit = 10) {
    return this._mm.searchByKeywords(keywords, limit).map(r => ({
      key: r.metadata?.key || r.id,
      tier: (r.layer || 'learned').toUpperCase(),
      value: r.content,
      tags: r.metadata?.tags || [],
      score: r.score,
    }));
  }

  searchBySemantic(query, limit = 10) {
    // 降级为关键词模糊匹配 learned 层
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const results = [];

    for (const mem of this._mm.layers.learned) {
      const key = mem.metadata?.key || mem.id;
      let matchCount = 0;
      for (const w of words) {
        if (key.toLowerCase().includes(w)) { matchCount += 1; continue; }
        if ((mem.content || '').toLowerCase().includes(w)) { matchCount += 1; continue; }
        if ((mem.metadata?.tags || []).some(t => t.toLowerCase().includes(w))) { matchCount += 0.5; continue; }
      }
      if (matchCount > 0) {
        results.push({
          key,
          tier: 'LEARNED',
          value: mem.content,
          tags: mem.metadata?.tags || [],
          accessCount: mem.accessCount || 0,
          score: matchCount / words.length,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  searchByTimeRange(startTime, limit = 10) {
    const start = typeof startTime === 'string' ? Date.now() - 3600000 : (startTime || 0);
    const results = [];

    for (const mem of this._mm.layers.ephemeral) {
      if (mem.createdAt >= start) {
        results.push({
          key: mem.metadata?.key || mem.id,
          tier: 'EPHEMERAL',
          value: mem.content,
          createdAt: mem.createdAt,
        });
      }
    }

    results.sort((a, b) => b.createdAt - a.createdAt);
    return results.slice(0, limit);
  }

  retrieve(query, layer = 'all', limit = 10) {
    if (layer === 'core') {
      return this.searchByKeywords(query, limit).filter(r => r.tier === 'CORE');
    } else if (layer === 'learned') {
      return this.searchBySemantic(query, limit);
    } else if (layer === 'ephemeral') {
      return this.searchByTimeRange(Date.now() - 86400000, limit);
    }
    return this.search(query);
  }

  // ─── Store (统一写入) ─────────────────────────────────────────────────

  store(key, value, tags = []) {
    if (key.startsWith('core:') || key.startsWith('identity.')) {
      return this.addCore(key, value, tags);
    }
    return this.learn(key, value, tags);
  }

  // ─── Auto-Record ──────────────────────────────────────────────────────

  autoRecord(event = {}) {
    if (!this._shouldAutoRecord(event)) {
      return { success: false, reason: 'below_threshold', recorded: false };
    }

    const type = event.type || 'general';
    const key = `auto:${type}:${Date.now()}`;
    const value = event.content || JSON.stringify(event);
    const tags = ['auto-recorded', type];

    if (event.emotion?.intensity === 'high') tags.push('emotion_signal');
    if (event.correction) tags.push('correction');
    if (event.outcome === 'failed') tags.push('failure');
    if (event.outcome === 'success') tags.push('success');
    if (event.decision) tags.push('decision');

    const result = this.learn(key, value, tags);
    return { ...result, recorded: result.success };
  }

  _shouldAutoRecord(event = {}) {
    const type = event.type || '';
    if (type === 'emotion') {
      const intensity = event.emotion?.intensity;
      const hasContent = (event.content || '').length > 10;
      const hasTopic = event.emotion?.topic && event.emotion.topic !== 'general';
      return (intensity === 'high' || intensity === 'medium') && hasContent && hasTopic;
    }
    if (type === 'correction') {
      return (event.AI_said || '').length > 5 && (event.correction || '').length > 3;
    }
    if (type === 'failure') {
      return (event.error || event.content || '').length > 10;
    }
    if (type === 'decision') {
      return (event.choice || '').length > 2 && (event.alternatives || '').length > 5;
    }
    if (event.important) return true;
    return false;
  }

  // ─── Shortcut Methods ─────────────────────────────────────────────────

  recordLesson(key, value, tags = []) {
    const fullKey = key.startsWith('lesson:') ? key : `lesson:${key}`;
    return this.learn(fullKey, value, ['lesson', ...tags]);
  }

  recordSignal(topic, data = {}, ttlMs = 1800000) {
    const key = `signal:${topic}:${Date.now()}`;
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    return this.remember(key, { topic, data: typeof data === 'string' ? null : data, raw: value }, ttlMs);
  }

  getRecentSignals(limit = 5) {
    return this._mm.layers.ephemeral
      .filter(mem => (mem.metadata?.key || '').startsWith('signal:'))
      .map(mem => {
        let parsed = {};
        try { parsed = JSON.parse(mem.content); } catch { parsed = { raw: mem.content }; }
        return {
          key: mem.metadata?.key || mem.id,
          topic: parsed.topic || mem.metadata?.key,
          data: parsed.data || parsed,
          ts: mem.createdAt || mem.timestamp || 0,
        };
      })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  }

  // ─── TopicScope Bridge ────────────────────────────────────────────────

  setCurrentTopic(topic) {
    this._mm.setCurrentTopic(topic);
  }

  getCurrentTopic() {
    return this._mm.getCurrentTopic();
  }

  // ─── Identity Rules (for decision.js) ─────────────────────────────────

  getIdentityRules() {
    return this.listCore().map(entry => ({
      key: entry.key,
      value: entry.value,
      tags: entry.tags,
    }));
  }

  // ─── get(key) — for dream-consolidation ───────────────────────────────

  get(key) {
    // 先查 learned，再查 core，最后查 ephemeral
    for (const layer of ['learned', 'core', 'ephemeral']) {
      const mem = this._findByKey(layer, key);
      if (mem) {
        return {
          key: mem.metadata?.key || mem.id,
          value: mem.content,
          tags: mem.metadata?.tags || [],
          accessCount: mem.accessCount || 0,
          layer,
          createdAt: mem.createdAt,
        };
      }
    }
    return null;
  }

  // ─── v5.5.5 新增：话题感知记忆检索 ─────────────────────────────
  // Membox 启发：基于话题连续性的记忆检索

  /**
   * 话题相似度计算（Bigram 重叠）
   * @param {string} topicA
   * @param {string} topicB
   * @returns {number} 0-1 相似度
   */
  _topicSimilarity(topicA, topicB) {
    if (!topicA || !topicB) return 0;
    const a = topicA.toLowerCase();
    const b = topicB.toLowerCase();
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.7;
    const bigram = (s) => { const grams = []; for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2)); return grams; };
    const gramsA = bigram(a); const gramsB = bigram(b);
    if (gramsA.length === 0 || gramsB.length === 0) return 0;
    const setB = new Set(gramsB);
    let overlap = 0;
    for (const g of gramsA) { if (setB.has(g)) overlap++; }
    return overlap / Math.max(gramsA.length, gramsB.length);
  }

  /**
   * 话题感知搜索：查找与当前话题相关的记忆
   * @param {string} query - 搜索关键词
   * @param {string} currentTopic - 当前话题名
   * @param {number} [limit=10] - 返回数量
   * @returns {Array} 按话题相关性排序的记忆
   */
  searchByTopic(query, currentTopic, limit = 10) {
    const results = this.searchBySemantic(query, limit * 3);
    if (!currentTopic || results.length === 0) return results.slice(0, limit);
    const scored = results.map(r => {
      const memTopic = r.tags?.find(t => t !== 'consolidated' && t !== 'emotion_signal') || '';
      const topicScore = this._topicSimilarity(currentTopic, memTopic);
      const finalScore = (r.score || 0) * 0.7 + topicScore * 0.3;
      return { ...r, topicScore, finalScore };
    });
    scored.sort((a, b) => b.finalScore - a.finalScore);
    return scored.slice(0, limit).map(r => { const { topicScore, finalScore, ...rest } = r; return rest; });
  }

  // ─── v5.5.5 新增：记忆自动整合 ──────────────────────────────
  // CogMem 启发：ephemeral → learned 自动整合

  /**
   * 自动整合：检查 ephemeral 层大小，触发整合
   * @param {number} [threshold=20] - 触发阈值
   * @returns {object} 整合结果
   */
  autoConsolidate(threshold = 20) {
    const ephemeralCount = this._mm.layers.ephemeral.length;
    if (ephemeralCount < threshold) {
      return { triggered: false, reason: 'below_threshold', ephemeralCount };
    }
    return this.consolidate();
  }

  // ─── v5.5.5 新增：记忆访问频率统计 ──────────────────────────
  /**
   * 获取最常访问的记忆
   * @param {string} [layer='learned'] - 'core'|'learned'|'ephemeral'
   * @param {number} [limit=5] - 返回数量
   * @returns {Array} 按访问次数排序的记忆
   */
  getTopAccessed(layer = 'learned', limit = 5) {
    const arr = this._mm.layers[layer] || [];
    return arr
      .filter(m => (m.accessCount || 0) > 0)
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, limit)
      .map(m => ({
        key: m.metadata?.key || m.id,
        value: m.content?.slice(0, 100),
        accessCount: m.accessCount || 0,
        tags: m.metadata?.tags || [],
      }));
  }

  // ─── destroy ──────────────────────────────────────────────────────────

  destroy() {
    if (this._mm._saveTimer) {
      clearTimeout(this._mm._saveTimer);
      this._mm._saveTimer = null;
    }
  }
}

module.exports = { MemoryAdapter };
