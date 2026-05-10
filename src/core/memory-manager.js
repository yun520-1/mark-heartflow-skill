/**
 * HeartFlow Memory Manager v11.34.1
 *
 * 核心洞察（来自Mem0 52k⭐ + LangGraph 31k⭐）：
 * - Mem0: 一个ADD入口，内部处理语义+BM25+实体。调用方不知道内部细节
 * - LangGraph: 确定性状态图，每个节点只做一件事
 *
 * v11.34.1 修复：
 * - 修复文件名混乱：UnifiedMemoryStore 用 unified-memory.json（独立）
 * - 修复 meaningful-memory 的 learned 存储到 meaningful-memory-learned.json
 * - 修复 meaningful-memory 的 ephemeral 存储到 meaningful-memory-ephemeral.json
 * - 修复后：meaningful-memory 和 UnifiedMemoryStore 完全隔离
 *
 * 记忆类型（简化到3层）：
 * - CORE: 核心身份/指令（高权重，长期保留）
 * - LEARNED: 经验/教训（中等权重）
 * - EPHEMERAL: 上下文/会话（低权重，可淘汰）
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 路径
// ============================================================
const MEM_DIR = path.join(__dirname, '..', '..', 'memory');
const STORES_DIR = path.join(MEM_DIR, 'stores');
const STATES_DIR = path.join(MEM_DIR, 'states');

// ============================================================
// 记忆存储（文件IO封装）
// ============================================================

class MemoryStore {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.options = options;
    this.data = [];
    this._loaded = false;
  }

  load() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (!Array.isArray(this.data)) this.data = [];
      }
    } catch (e) {
      this.data = [];
    }
    this._loaded = true;
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      // 非致命
    }
  }

  add(entry) {
    this.load();
    // 去重
    const exists = this.data.some(e => e.id === entry.id);
    if (!exists) {
      this.data.push(entry);
      this.save();
    }
  }

  search(query, options = {}) {
    this.load();
    const { limit = 10, weights = null } = options;
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);

    const results = this.data
      .map(item => {
        let score = 0;
        const contentLower = (item.content || '').toLowerCase();

        if (weights) {
          // Mem0-style 多信号评分
          score += weights.exactMatch ? (contentLower.includes(queryLower) ? 1 : 0) : 0;
          score += weights.bm25 ? queryWords.filter(w => contentLower.includes(w)).length / Math.max(1, queryWords.length) : 0;
          score += weights.recency ? (item.createdAt ? (Date.now() - item.createdAt < 86400000 * 7 ? 0.2 : 0) : 0) : 0;
        } else {
          // 简单词匹配
          score = queryWords.filter(w => contentLower.includes(w)).length;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  size() {
    this.load();
    return this.data.length;
  }
}

// ============================================================
// 单一记忆存储（Mem0-inspired）
// 所有ADD通过一个store写，所有SEARCH通过一个store读
// ============================================================

class UnifiedMemoryStore {
  constructor() {
    // v11.34.1: 每个引擎用独立文件，彻底隔离
    // 修复：不再和 meaningful-memory.js 混用 meaningful-learned.json
    this.core = new MemoryStore(path.join(STORES_DIR, 'unified-core.json'));
    this.learned = new MemoryStore(path.join(STORES_DIR, 'unified-learned.json'));
    this.ephemeral = new MemoryStore(path.join(STORES_DIR, 'unified-ephemeral.json'));

    // 索引（轻量追加日志，不重建）
    this.indexFile = path.join(STORES_DIR, 'unified-index.json');
    this.index = this._loadIndex();

    this.stats = {
      added: 0,
      recalled: 0,
      engines: ['core', 'learned', 'ephemeral'],
    };
  }

  _loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
        // 支持数组格式
        if (Array.isArray(data)) return data;
        // 兼容旧的对象格式
        return [];
      }
    } catch {}
    return [];
  }

  _saveIndex() {
    try {
      if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });
      // 只保留最近500条
      const idx = this.index.slice(-500);
      fs.writeFileSync(this.indexFile, JSON.stringify(idx, null, 2));
    } catch {}
  }

  // ========================================================
  // 核心API 1: ADD（对应Mem0的add()）
  // ========================================================
  add(content, metadata = {}) {
    const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const layer = this._classify(content, metadata);

    const entry = {
      id,
      content,
      metadata,
      layer,
      createdAt: Date.now(),
      accessCount: 0,
    };

    // 写入对应层
    const store = layer === 'CORE' ? this.core
      : layer === 'LEARNED' ? this.learned
      : this.ephemeral;
    store.add(entry);

    // 索引
    this.index.push({ id, layer, content: content.slice(0, 50), createdAt: entry.createdAt });
    this._saveIndex();

    this.stats.added++;
    return { id, layer, stored: true };
  }

  // ========================================================
  // 核心API 2: SEARCH（对应Mem0的search()）
  // ========================================================
  search(query, options = {}) {
    const { limit = 8, layers = null } = options;
    this.stats.recalled++;

    const targets = layers || ['core', 'learned', 'ephemeral'];
    const allResults = [];

    for (const layer of targets) {
      const store = layer === 'core' ? this.core
        : layer === 'learned' ? this.learned
        : this.ephemeral;
      const results = store.search(query, { limit: Math.ceil(limit / targets.length) });
      allResults.push(...results.map(r => ({ ...r, layer })));
    }

    // 去重 + 排序
    const seen = new Set();
    const deduped = allResults
      .filter(r => {
        const key = r.content.slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    // v11.34.1: 返回结果附加时间元数据（来自 meaningful-memory 的时间验证）
    const withTemporal = this._addTemporalMeta(deduped);

    return {
      query,
      results: withTemporal,
      count: withTemporal.length,
      layers: targets,
      stats: this.stats,
    };
  }

  // v11.34.1: 为搜索结果附加时间元数据
  _addTemporalMeta(results, now = Date.now()) {
    return results.map(r => {
      const createdAt = r.createdAt || r.timestamp || now;
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      const ageDays = ageHours / 24;
      return {
        ...r,
        temporalMeta: {
          storedAt: createdAt,
          storedDate: new Date(createdAt).toISOString().substring(0, 10),
          ageHours: Math.round(ageHours * 10) / 10,
          ageDays: Math.round(ageDays * 10) / 10,
          isStale: ageDays > 7,
          isAncient: ageDays > 30,
          guidance: this._getTemporalGuidance(ageDays),
        }
      };
    });
  }

  _getTemporalGuidance(ageDays) {
    if (ageDays < 0.04) return '几分钟前 — 可声称是"刚才/刚刚"';
    if (ageDays < 1)    return '今天内 — 可声称是"今天"';
    if (ageDays < 2)    return '昨天 — 须说"昨天"而非"刚才"';
    if (ageDays < 7)    return `${Math.round(ageDays)}天前 — 须说"前N天"`;
    if (ageDays < 30)   return `${Math.round(ageDays)}天前 — 须明确说"X月X日"`;
    if (ageDays < 365)  return `${Math.round(ageDays)}天前 — 必须标注日期`;
    return `${Math.round(ageDays)}天前 — 历史记录，谨慎引用`;
  }

  // v11.34.1: 带时间验证的单条召回
  recallWithTemporalMeta(key) {
    const allStores = [
      { store: this.core, layer: 'CORE' },
      { store: this.learned, layer: 'LEARNED' },
      { store: this.ephemeral, layer: 'EPHEMERAL' },
    ];
    for (const { store, layer } of allStores) {
      store.load();
      const found = store.data.find(e => e.id === key || e.content?.startsWith(key));
      if (found) {
        const now = Date.now();
        const createdAt = found.createdAt || found.timestamp || now;
        const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
        return {
          record: found,
          temporalMeta: {
            storedAt: createdAt,
            storedDate: new Date(createdAt).toISOString().substring(0, 10),
            ageDays: Math.round(ageDays * 10) / 10,
            isStale: ageDays > 7,
            isAncient: ageDays > 30,
            guidance: this._getTemporalGuidance(ageDays),
          }
        };
      }
    }
    return { record: null, temporalMeta: { found: false } };
  }

  // ========================================================
  // 内部: 分类（简化决策树）
  // ========================================================
  _classify(content, metadata = {}) {
    const text = (content || '').toLowerCase();
    const { source, tags, layer: metaLayer } = metadata;

    // 明确指定层
    if (metaLayer) return metaLayer;

    // 来源推断
    if (source === 'core_identity' || source === 'core') return 'CORE';
    if (source === 'user_correction' || source === 'learning') return 'LEARNED';

    // 关键词判断
    const coreSignals = ['我是', '核心指令', '永远', '必须', '使命', '心虫身份', 'heartflow是', 'identity', 'core directive'];
    const learnedSignals = ['学会了', '教训', '经验', '发现了', '整合了', '优化了', '升级了'];

    const coreMatches = coreSignals.filter(s => text.includes(s)).length;
    const learnedMatches = learnedSignals.filter(s => text.includes(s)).length;

    if (coreMatches >= 1) return 'CORE';
    if (learnedMatches >= 1) return 'LEARNED';
    return 'EPHEMERAL';
  }

  // ========================================================
  // 统计
  // ========================================================
  getStats() {
    return {
      ...this.stats,
      layers: {
        core: this.core.size(),
        learned: this.learned.size(),
        ephemeral: this.ephemeral.size(),
      },
    };
  }
}

// v11.43.2 PAPER INJECTION: memory-manager.js
// [1] MemArchitectGovernor | [6] MemoryV11432
const _p11 = require('./papers/v11_43_2_integration.js');

UnifiedMemoryStore.prototype.memArchitect = new _p11.MemArchitectGovernor();
UnifiedMemoryStore.prototype.memoryV11432 = _p11.MemoryV11432;

/** Record feedback on a stored memory (FSRS v4 adaptive scheduling) */
UnifiedMemoryStore.prototype.recordFeedback = function(memoryId, success) {
  this.memArchitect.recordFeedback(memoryId, success);
};

/** Get FSRS v4 retrievability for all memories in this store */
UnifiedMemoryStore.prototype.getRetrievability = function() {
  return Array.from(this.core.store.data).map(m => ({
    id: m.id,
    retrievability: this.memArchitect._fsrs4_retrievability(m),
  }));
};

/** Memory decay report for UI dashboard */
UnifiedMemoryStore.prototype.decayReport = function() {
  return this.memArchitect.getDecayReport();
};

// ============================================================
// 顶层API（替换所有旧记忆调用）
// ============================================================

let _instance = null;

function getMemoryStore() {
  if (!_instance) _instance = new UnifiedMemoryStore();
  return _instance;
}

// 对外API
function store(content, metadata = {}) {
  return getMemoryStore().add(content, metadata);
}

function recall(query, options = {}) {
  return getMemoryStore().search(query, options);
}

function getMemoryStats() {
  return getMemoryStore().getStats();
}

// v11.34.1: 导出时间验证方法，供外部调用
function recallWithTemporalMeta(key) {
  return getMemoryStore().recallWithTemporalMeta(key);
}

module.exports = {
  UnifiedMemoryStore,
  getMemoryStore,
  store,
  recall,
  getMemoryStats,
  recallWithTemporalMeta,
};
