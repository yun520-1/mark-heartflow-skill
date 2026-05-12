/**
 * HeartFlow Modular Memory Router v11.37.0
 * 
 * 来源:
 * - "Modular Memory is the Key to Continual Learning Agents" (arXiv:2603.01761, 2026-03-02)
 *   核心思想: 结合 In-Weight Learning (IWL) 和 External Memory Systems (EMS)
 * - "MemoryBench: A Benchmark for Memory and Continual Learning in LLM Systems" (arXiv:2510.17281, 2026-05-01)
 *   关键发现: 现有 LLM 记忆系统在用户反馈持续学习上效果远未满足
 * - "Carousel Memory: Rethinking the Design of Episodic Memory for Continual Learning" (arXiv:2110.07276)
 *   核心思想: 分层记忆管理，RAM + storage 两层
 * 
 * v11.37.0 升级:
 * - 新增 ModularMemoryRouter，实现两-tier 记忆路由
 * - Tier 1 (In-Weight): 模型参数内化的快速知识，high-frequency patterns
 * - Tier 2 (External): 文件/向量存储的持久知识，low-frequency but high-importance
 * - 基于访问频率和重要性自动路由记忆
 * - 解决 HeartFlow 现有 12+ 记忆文件分散导致的检索效率问题
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'modular-memory');
const ROUTER_STATE = path.join(DATA_DIR, 'router-state.json');

// ============================================================
// 记忆源注册表
// ============================================================

const MEMORY_SOURCES = {
  // 核心记忆文件 (Tier 2: External)
  'meaningful-learned': {
    path: 'memory/meaningful-learned.json',
    type: 'structured',
    tier: 2,
    priority: 1.0,
  },
  'meaningful-core': {
    path: 'memory/meaningful-core.json',
    type: 'structured',
    tier: 2,
    priority: 0.9,
  },
  'being-state': {
    path: 'memory/being-state.json',
    type: 'key-value',
    tier: 2,
    priority: 0.8,
  },
  'memory-store': {
    path: 'memory/memory-store.json',
    type: 'mem0-style',
    tier: 2,
    priority: 0.7,
  },
  'learning-queue': {
    path: 'memory/learning-queue.json',
    type: 'queue',
    tier: 2,
    priority: 0.6,
  },
  'reflection-memory': {
    path: 'data/reflection-memory/reflections.json',
    type: 'structured',
    tier: 2,
    priority: 0.5,
  },
  // 情景记忆路由文件 (Tier 2)
  'semantic-routing': {
    path: 'data/memory-routing/semantic-routing.json',
    type: 'routing',
    tier: 2,
    priority: 0.4,
  },
  'procedural-routing': {
    path: 'data/memory-routing/procedural-routing.json',
    type: 'routing',
    tier: 2,
    priority: 0.4,
  },
};

// ============================================================
// 访问模式追踪
// ============================================================

class AccessPatternTracker {
  constructor() {
    this.patterns = new Map(); // key -> { count, lastAccess, avgInterval }
    this.totalAccesses = 0;
  }

  record(key) {
    const now = Date.now();
    const existing = this.patterns.get(key);
    
    if (existing) {
      const interval = existing.lastAccess 
        ? (now - existing.lastAccess) / (24 * 60 * 60 * 1000) // 天
        : 1;
      existing.count++;
      existing.lastAccess = now;
      existing.avgInterval = existing.avgInterval 
        ? (existing.avgInterval * 0.7 + interval * 0.3)
        : interval;
    } else {
      this.patterns.set(key, { count: 1, lastAccess: now, avgInterval: 1 });
    }
    this.totalAccesses++;
  }

  getFrequency(key) {
    const p = this.patterns.get(key);
    if (!p) return 0;
    // 归一化: 基于总访问次数
    return p.count / Math.max(1, this.totalAccesses);
  }

  getRecency(key) {
    const p = this.patterns.get(key);
    if (!p || !p.lastAccess) return 0;
    const daysSince = (Date.now() - p.lastAccess) / (24 * 60 * 60 * 1000);
    return Math.max(0, 1 - daysSince / 30); // 30天基准
  }

  isHighFrequency(key) {
    const freq = this.getFrequency(key);
    return freq > 0.01; // Top 1% 视为高频
  }
}

// ============================================================
// 重要性路由决策器
// ============================================================

class MemoryRouter {
  constructor(options = {}) {
    this.accessTracker = new AccessPatternTracker();
    this.tier1Cache = new Map(); // In-weight memory cache
    this.tier2Cache = new Map(); // External memory cache
    this.cacheTTLs = {
      tier1: options.tier1TTL || 5 * 60 * 1000,    // 5分钟
      tier2: options.tier2TTL || 30 * 60 * 1000,   // 30分钟
    };
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(ROUTER_STATE)) {
        const data = JSON.parse(fs.readFileSync(ROUTER_STATE, 'utf8'));
        // 恢复访问模式
        if (data.patterns) {
          for (const [key, val] of Object.entries(data.patterns)) {
            this.accessTracker.patterns.set(key, val);
          }
          this.accessTracker.totalAccesses = data.totalAccesses || 0;
        }
      }
    } catch (e) {}
  }

  _save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const patterns = {};
      for (const [key, val] of this.accessTracker.patterns) {
        patterns[key] = val;
      }
      fs.writeFileSync(ROUTER_STATE, JSON.stringify({
        patterns,
        totalAccesses: this.accessTracker.totalAccesses,
        savedAt: Date.now(),
      }, null, 2));
    } catch (e) {}
  }

  // ============================================================
  // 核心路由决策
  // ============================================================

  /**
   * 决定记忆应该存储在哪个 tier
   * @param {string} key - 记忆键
   * @param {object} memory - 记忆内容
   * @returns {object} { tier: 1|2, reason: string }
   */
  routeForStorage(key, memory = {}) {
    // 高频访问 -> Tier 1 (in-weight cache)
    if (this.accessTracker.isHighFrequency(key)) {
      return { tier: 1, reason: 'high-frequency-access' };
    }

    // 高重要性记忆 -> Tier 2 (external)
    if (memory.importance && memory.importance > 0.8) {
      return { tier: 2, reason: 'high-importance' };
    }

    // 长时间不访问 -> Tier 2 (external, cold storage)
    const recency = this.accessTracker.getRecency(key);
    if (recency < 0.1) {
      return { tier: 2, reason: 'cold-memory' };
    }

    // 默认: 新记忆 -> Tier 2
    return { tier: 2, reason: 'default-external' };
  }

  /**
   * 从正确的 tier 获取记忆
   * @param {string} key - 记忆键
   * @param {object} options - 查询选项
   * @returns {object} { value: any, source: string, cached: boolean }
   */
  async retrieve(key, options = {}) {
    this.accessTracker.record(key);
    
    // 1. 先查 Tier 1 缓存
    const tier1Val = this._getFromCache(this.tier1Cache, key);
    if (tier1Val) {
      return { value: tier1Val, source: 'tier1-cache', cached: true };
    }

    // 2. 再查 Tier 2 缓存
    const tier2Val = this._getFromCache(this.tier2Cache, key);
    if (tier2Val) {
      // 热身: 如果频繁访问，升级到 Tier 1
      if (this.accessTracker.isHighFrequency(key)) {
        this.tier1Cache.set(key, { data: tier2Val, timestamp: Date.now() });
      }
      return { value: tier2Val, source: 'tier2-cache', cached: true };
    }

    // 3. 从文件系统加载
    const fileResult = await this._loadFromFiles(key);
    if (fileResult) {
      // 缓存结果
      const targetTier = this.routeForStorage(key, fileResult);
      if (targetTier.tier === 1) {
        this.tier1Cache.set(key, { data: fileResult, timestamp: Date.now() });
      } else {
        this.tier2Cache.set(key, { data: fileResult, timestamp: Date.now() });
      }
      return { value: fileResult, source: 'file', cached: false };
    }

    return { value: null, source: 'none', cached: false };
  }

  /**
   * 存储记忆到正确 tier
   * @param {string} key - 记忆键
   * @param {any} value - 记忆值
   * @param {object} metadata - 元数据
   */
  async store(key, value, metadata = {}) {
    const routing = this.routeForStorage(key, metadata);

    if (routing.tier === 1) {
      this.tier1Cache.set(key, { data: value, timestamp: Date.now() });
    } else {
      // Tier 2: 持久化到文件系统
      await this._persistToFile(key, value, metadata);
      this.tier2Cache.set(key, { data: value, timestamp: Date.now() });
    }

    this.accessTracker.record(key);
    this._save();
    
    return { tier: routing.tier, reason: routing.reason };
  }

  // ============================================================
  // 统一检索接口
  // ============================================================

  /**
   * 跨所有记忆文件统一检索
   * @param {string} query - 查询词
   * @param {object} options - { limit, sources, minRelevance }
   * @returns {array} 检索结果
   */
  async unifiedSearch(query, options = {}) {
    const {
      limit = 10,
      sources = Object.keys(MEMORY_SOURCES),
      minRelevance = 0.3,
    } = options;

    const results = [];
    const queryLower = query.toLowerCase();

    for (const sourceName of sources) {
      const source = MEMORY_SOURCES[sourceName];
      if (!source) continue;

      const fullPath = path.join(__dirname, '..', '..', source.path);
      
      try {
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);

        const hits = this._searchInData(data, queryLower, sourceName);
        results.push(...hits);
      } catch (e) {
        // 跳过无效文件
      }
    }

    // 排序并限制
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, limit).map(r => ({
      ...r,
      source: r.sourceName,
    }));
  }

  _searchInData(data, query, sourceName) {
    const hits = [];

    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        const relevance = this._calculateRelevance(item, query);
        if (relevance >= 0.3) {
          hits.push({
            sourceName,
            key: `${sourceName}[${idx}]`,
            data: item,
            relevance,
            matchFields: this._getMatchFields(item, query),
          });
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // 处理 key-value 格式
      for (const [key, value] of Object.entries(data)) {
        const relevance = this._calculateRelevance(value, query);
        const keyRelevance = key.toLowerCase().includes(query) ? 0.3 : 0;
        const totalRelevance = Math.min(1, relevance + keyRelevance);
        
        if (totalRelevance >= 0.3) {
          hits.push({
            sourceName,
            key,
            data: value,
            relevance: totalRelevance,
            matchFields: ['key', ...this._getMatchFields(value, query)],
          });
        }
      }
    }

    return hits;
  }

  _calculateRelevance(item, query) {
    if (!item) return 0;
    const str = typeof item === 'string' ? item : JSON.stringify(item);
    const strLower = str.toLowerCase();
    
    if (strLower.includes(query)) {
      // 完全匹配
      return 0.9;
    }
    
    // 关键词重叠
    const queryWords = query.split(/\s+/);
    const itemWords = strLower.match(/[\u4e00-\u9fff]{2,}|[\w]{3,}/g) || [];
    const matches = queryWords.filter(q => 
      itemWords.some(w => w.includes(q) || q.includes(w))
    );
    
    return matches.length / queryWords.length;
  }

  _getMatchFields(item, query) {
    const fields = [];
    if (typeof item === 'object' && item !== null) {
      for (const [k, v] of Object.entries(item)) {
        const vStr = String(v).toLowerCase();
        if (vStr.includes(query)) {
          fields.push(k);
        }
      }
    }
    return fields;
  }

  // ============================================================
  // 缓存管理
  // ============================================================

  _getFromCache(cache, key) {
    const entry = cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    const ttl = cache === this.tier1Cache ? this.cacheTTLs.tier1 : this.cacheTTLs.tier2;
    
    if (age > ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async _loadFromFiles(key) {
    // 遍历所有记忆源，找到包含此 key 的文件
    const keyLower = key.toLowerCase();
    
    for (const [name, source] of Object.entries(MEMORY_SOURCES)) {
      const fullPath = path.join(__dirname, '..', '..', source.path);
      
      try {
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          const found = data.find(item => 
            item.key === key || 
            item.id === key ||
            (typeof item === 'string' && item.toLowerCase().includes(keyLower))
          );
          if (found) return found;
        } else if (typeof data === 'object') {
          if (data[key] !== undefined) return data[key];
        }
      } catch (e) {}
    }
    
    return null;
  }

  async _persistToFile(key, value, metadata = {}) {
    // 找到主记忆文件 (meaningful-learned)
    const primarySource = MEMORY_SOURCES['meaningful-learned'];
    const fullPath = path.join(__dirname, '..', '..', primarySource.path);
    
    try {
      let data = {};
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        data = JSON.parse(content);
      }
      
      data[key] = {
        ...(typeof value === 'object' ? value : { content: value }),
        storedAt: Date.now(),
        importance: metadata.importance || 0.5,
        tags: metadata.tags || [],
      };
      
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`[ModularMemoryRouter] Failed to persist ${key}: ${e.message}`);
    }
  }

  // ============================================================
  // 统计和健康检查
  // ============================================================

  getStats() {
    return {
      tier1CacheSize: this.tier1Cache.size,
      tier2CacheSize: this.tier2Cache.size,
      totalAccesses: this.accessTracker.totalAccesses,
      trackedPatterns: this.accessTracker.patterns.size,
      memorySources: Object.keys(MEMORY_SOURCES).length,
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const issues = [];
    
    if (this.tier1Cache.size > 100) {
      issues.push('tier1-cache-overflow');
    }
    
    if (this.accessTracker.totalAccesses === 0) {
      issues.push('no-accesses-recorded');
    }
    
    // 检查记忆源文件存在性
    for (const [name, source] of Object.entries(MEMORY_SOURCES)) {
      const fullPath = path.join(__dirname, '..', '..', source.path);
      if (!fs.existsSync(fullPath)) {
        issues.push(`missing-source:${name}`);
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats: this.getStats(),
    };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  ModularMemoryRouter: MemoryRouter,
  MEMORY_SOURCES,
};
