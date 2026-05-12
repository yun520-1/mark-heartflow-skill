/**
 * HeartFlow Memory Lifecycle Manager v11.23.1
 * 
 * 遗忘机制自动触发器
 * 
 * 核心功能：
 * 1. 每日遗忘检查（基于时间）
 * 2. 访问计数晋升（基于频率）
 * 3. TTL 自动清理
 * 4. 记忆强度动态更新
 * 
 * 自动触发规则：
 * - 每次 process() → recordAccess + TTL检查
 * - 每24小时 → runForgettingCycle
 * - 每晋升/降级 → 更新存储层
 */

const fs = require('fs');
const path = require('path');
const { ForgettingEngine } = require('./forgetting-engine');
const { MemoryTierManager } = require('./memory-tier-manager');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const LIFECYCLE_META = path.join(MEMORY_DIR, 'lifecycle-meta.json');
const MEMORY_STORE = path.join(MEMORY_DIR, 'memory-store.json');

// TTL 配置（毫秒）
const TTL_CONFIG = {
  core: Infinity,        // 永不过期
  procedural: 365 * 24 * 60 * 60 * 1000,  // 1年
  semantic: 180 * 24 * 60 * 60 * 1000,    // 6个月
  episodic: 30 * 24 * 60 * 60 * 1000,      // 30天
  ephemeral: 7 * 24 * 60 * 60 * 1000,      // 7天
};

class MemoryLifecycleManager {
  constructor() {
    this.forgettingEngine = new ForgettingEngine();
    this.tierManager = new MemoryTierManager();
    this.lastForgettingCycle = null;
    this._loadMeta();
    this._initStore();
  }

  _loadMeta() {
    try {
      if (fs.existsSync(LIFECYCLE_META)) {
        const data = JSON.parse(fs.readFileSync(LIFECYCLE_META, 'utf8'));
        this.lastForgettingCycle = data.lastForgettingCycle;
      }
    } catch (e) {}
  }

  _saveMeta() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(LIFECYCLE_META, JSON.stringify({
        lastForgettingCycle: this.lastForgettingCycle,
      }, null, 2));
    } catch (e) {}
  }

  _initStore() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      if (!fs.existsSync(MEMORY_STORE)) {
        fs.writeFileSync(MEMORY_STORE, JSON.stringify({ memories: [] }, null, 2));
      }
    } catch (e) {}
  }

  _readStore() {
    try {
      return JSON.parse(fs.readFileSync(MEMORY_STORE, 'utf8'));
    } catch (e) {
      return { memories: [] };
    }
  }

  _writeStore(data) {
    try {
      fs.writeFileSync(MEMORY_STORE, JSON.stringify(data, null, 2));
    } catch (e) {}
  }

  // ============================================================
  // 核心 API
  // ============================================================

  /**
   * 写入一条记忆（入口）
   * @param {string} content - 记忆内容
   * @param {string} layer - 'core'|'procedural'|'semantic'|'episodic'|'ephemeral'
   * @param {object} metadata - { importance, tags, source }
   * @returns {object} 写入结果
   */
  write(content, layer = 'ephemeral', metadata = {}) {
    const store = this._readStore();
    const now = Date.now();
    const id = `mem_${now}_${Math.random().toString(36).substr(2, 6)}`;
    
    const memory = {
      id,
      content,
      layer,
      metadata,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      reinforcementCount: 0,
      ttl: TTL_CONFIG[layer] || TTL_CONFIG.ephemeral,
    };

    store.memories.push(memory);
    this._writeStore(store);

    // 触发 tier manager 晋升检查
    this.tierManager.recordAccess(id, layer.toUpperCase(), content, now);

    return { id, layer, memory };
  }

  /**
   * 读取记忆（自动 TTL 检查 + 自动强化）
   * @param {string} memoryId - 记忆ID
   * @returns {object|null} 记忆内容或null（已过期）
   */
  read(memoryId) {
    const store = this._readStore();
    const memory = store.memories.find(m => m.id === memoryId);
    
    if (!memory) return null;

    // TTL 检查
    const age = Date.now() - memory.createdAt;
    if (age > memory.ttl && memory.ttl !== Infinity) {
      this._markExpired(memoryId);
      return null;
    }

    // 更新访问统计
    memory.accessCount++;
    memory.lastAccessed = Date.now();

    // 自动强化：高重要性或高频访问的记忆
    const importance = memory.metadata?.importance || 0.5;
    if (importance >= 0.7 || memory.accessCount >= 3) {
      memory.reinforcementCount++;
    }

    this._writeStore(store);

    // 触发晋升检查
    this.tierManager.recordAccess(memoryId, memory.layer.toUpperCase(), memory.content);

    return memory;
  }

  /**
   * 强化记忆（agent 确认）
   * @param {string} memoryId - 记忆ID
   */
  reinforce(memoryId) {
    const store = this._readStore();
    const memory = store.memories.find(m => m.id === memoryId);
    if (memory) {
      memory.reinforcementCount++;
      this._writeStore(store);
    }
  }

  /**
   * 确认并晋升（agent fact）
   * @param {string} memoryId - 记忆ID
   */
  confirmAndPromote(memoryId) {
    const store = this._readStore();
    const memory = store.memories.find(m => m.id === memoryId);
    if (!memory) return null;

    memory.reinforcementCount++;
    
    // 检查晋升条件
    const threshold = this._getPromotionThreshold(memory.layer);
    if (memory.reinforcementCount >= threshold) {
      const oldLayer = memory.layer;
      memory.layer = this._getNextLayer(memory.layer);
      memory.ttl = TTL_CONFIG[memory.layer] || TTL_CONFIG.ephemeral;
      this._writeStore(store);
      return { promoted: true, from: oldLayer, to: memory.layer };
    }

    this._writeStore(store);
    return { promoted: false };
  }

  // ============================================================
  // 遗忘周期（每日自动）
  // ============================================================

  /**
   * 运行遗忘周期
   * @returns {object} 遗忘结果
   */
  runForgettingCycle() {
    const store = this._readStore();
    const now = Date.now();
    const results = {
      expired: [],      // TTL 过期
      decayed: [],      // 强度衰减
      consolidated: [],  // 整合
      forgotten: [],     // 建议遗忘
      protected: [],    // 保护
    };

    // Step 1: TTL 过期检查
    const ttlExpired = store.memories.filter(m => {
      if (m.ttl === Infinity) return false;
      return (now - m.createdAt) > m.ttl;
    });

    for (const mem of ttlExpired) {
      results.expired.push(mem.id);
    }

    // Step 2: 遗忘引擎分析
    const activeMemories = store.memories.filter(m => !results.expired.includes(m.id));
    const analysis = this.forgettingEngine.runDecayCycle(activeMemories);

    results.decayed = analysis.decisions.decay.map(d => d.memory?.id).filter(Boolean);
    results.forgotten = analysis.decisions.forget.map(d => d.memory?.id).filter(Boolean);
    results.protected = analysis.decisions.protect.map(d => d.memory?.id).filter(Boolean);

    // Step 3: 移除过期和遗忘的记忆
    const toRemove = new Set([...results.expired, ...results.forgotten]);
    store.memories = store.memories.filter(m => !toRemove.has(m.id));

    // Step 4: 更新衰减状态的记忆
    for (const decision of analysis.decisions.decay) {
      if (decision.memory) {
        const mem = store.memories.find(m => m.id === decision.memory.id);
        if (mem) {
          // 降低优先级（标记为待复习）
          mem.metadata = { ...mem.metadata, decaying: true };
        }
      }
    }

    this._writeStore(store);
    this.lastForgettingCycle = now;
    this._saveMeta();

    return {
      ...results,
      stats: {
        total: store.memories.length,
        expired: results.expired.length,
        forgotten: results.forgotten.length,
        protected: results.protected.length,
      },
      summary: analysis.summary,
    };
  }

  /**
   * 检查是否需要运行遗忘周期（24小时一次）
   */
  shouldRunForgettingCycle() {
    if (!this.lastForgettingCycle) return true;
    const elapsed = Date.now() - this.lastForgettingCycle;
    return elapsed > 24 * 60 * 60 * 1000; // 24小时
  }

  // ============================================================
  // 辅助
  // ============================================================

  _markExpired(memoryId) {
    const store = this._readStore();
    store.memories = store.memories.filter(m => m.id !== memoryId);
    this._writeStore(store);
  }

  _getPromotionThreshold(layer) {
    const thresholds = { ephemeral: 3, episodic: 5, semantic: 10, procedural: 20, core: Infinity };
    return thresholds[layer] || 10;
  }

  _getNextLayer(layer) {
    const order = ['ephemeral', 'episodic', 'semantic', 'procedural', 'core'];
    const idx = order.indexOf(layer);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : layer;
  }

  // ============================================================
  // BM25 语义搜索
  // ============================================================

  /**
   * BM25 搜索记忆
   * @param {string} query - 搜索query
   * @param {number} topK - 返回数量
   * @returns {Array} 搜索结果
   */
  search(query, topK = 5) {
    const store = this._readStore();
    const ql = query.toLowerCase();
    const queryTokens = ql.split(/\s+/);

    // 评分：BM25 简化版
    const scored = store.memories.map(m => {
      const text = m.content.toLowerCase();
      let score = 0;

      // 精确词匹配
      for (const token of queryTokens) {
        if (text.includes(token)) score += 1;
      }

      // 完整 query 匹配
      if (text.includes(ql)) score += 3;

      // 层级加成
      const layerBonus = { core: 3, procedural: 2, semantic: 1, episodic: 0.5, ephemeral: 0 };
      score += layerBonus[m.layer] || 0;

      // 强化次数加成
      score += (m.reinforcementCount || 0) * 0.3;

      // 访问频率加成
      score += Math.min((m.accessCount || 0) * 0.1, 2);

      return { ...m, _score: score };
    });

    return scored
      .filter(m => m._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, topK)
      .map(m => ({
        source: 'lifecycle',
        id: m.id,
        content: m.content,
        score: m._score,
        layer: m.layer,
        reinforcementCount: m.reinforcementCount,
        accessCount: m.accessCount,
        createdAt: m.createdAt,
      }));
  }

  /**
   * 获取记忆统计
   */
  getStats() {
    const store = this._readStore();
    const byLayer = {};
    for (const m of store.memories) {
      byLayer[m.layer] = (byLayer[m.layer] || 0) + 1;
    }
    return {
      total: store.memories.length,
      byLayer,
      lastForgettingCycle: this.lastForgettingCycle,
      forgettingEngine: this.forgettingEngine.getStats(),
      tierManager: this.tierManager.stats,
    };
  }
}

module.exports = { MemoryLifecycleManager };
