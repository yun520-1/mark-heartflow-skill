/**
 * HeartFlow Memory Manager v11.33.3
 *
 * 统一记忆系统 — 整合所有记忆引擎为一个干净API
 *
 * 架构：
 * ┌─────────────────────────────────────────────┐
 * │         MemoryManager (唯一入口)              │
 * │                                             │
 * │  ┌─────────┐  ┌─────────────────────────┐  │
 * │  │ Router  │→│ recall(query) / store()  │  │
 * │  └─────────┘  └─────────────────────────┘  │
 * │         ↓                                   │
 * │  ┌─────────────────────────────────────┐  │
 * │  │         7 引擎并行 / 串行             │  │
 * │  │                                     │  │
 * │  │  Mem0MultiSignal (语义+BM25+实体)   │  │
 * │  │  MeaningfulMemory  (三层语义)        │  │
 * │  │  TrialityMemory  (working+archive)   │  │
 * │  │  LifecycleEngine  (遗忘+晋升)         │  │
 * │  │  DialecticRecall (L1/L2/L3召回)     │  │
 * │  │  ReflectionMemory (success/failure)  │  │
 * │  │  BeingState     (存在状态)           │  │
 * │  └─────────────────────────────────────┘  │
 * └─────────────────────────────────────────────┘
 *
 * 数据目录：
 *   memory/states/   — 系统状态（being/tier/logic-core等）
 *   memory/stores/   — 可重建数据（meaningful-learned等）
 *   memory/texts/    — 文本记忆
 *   memory/sessions/ — 会话存档
 *
 * 原则：
 * - 所有引擎独立加载，任意一个失败不影响整体
 * - 召回结果统一结构：{ source, content, score, metadata }
 * - 不删除任何历史数据，只做路由和索引
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 路径常量
// ============================================================
const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const STATES_DIR = path.join(MEMORY_DIR, 'states');
const STORES_DIR = path.join(MEMORY_DIR, 'stores');
const TEXTS_DIR = path.join(MEMORY_DIR, 'texts');
const SESSIONS_DIR = path.join(MEMORY_DIR, 'sessions');

// ============================================================
// 引擎懒加载
// ============================================================
let _engines = {};
let _initialized = false;

function _lazy(name, requirePath) {
  if (_engines[name]) return _engines[name];
  try {
    const mod = require(requirePath);
    _engines[name] = mod.default || mod;
    return _engines[name];
  } catch (e) {
    _engines[name] = null;
    return null;
  }
}

function _initEngines() {
  if (_initialized) return;
  _initialized = true;

  // 尝试加载各引擎（失败不崩溃）
  _lazy('mem0',          './mem0-memory.js');
  _lazy('meaningful',     './meaningful-memory.js');
  _lazy('triality',      './memory/triality-memory.js');
  _lazy('lifecycle',     './memory-lifecycle-manager.js');
  _lazy('dialectic',     './dialectic-recall.js');
  _lazy('forgetting',    './forgetting-engine.js');
  _lazy('reflection',    './self-reflection-memory.js');

  // 状态文件直接读取
  _loadStates();

  // 加载 stores 元数据
  _loadStores();
}

function _loadStates() {
  const files = [
    'being-state.json',
    'logic-core-state.json',
    'tier-meta.json',
    'lifecycle-meta.json',
    'core-result-state.json',
  ];
  _engines.states = {};
  for (const f of files) {
    try {
      const fp = path.join(STATES_DIR, f);
      if (fs.existsSync(fp)) {
        _engines.states[f] = JSON.parse(fs.readFileSync(fp, 'utf8'));
      }
    } catch {}
  }
}

function _loadStores() {
  const files = [
    'meaningful-learned.json',
    'meaningful-core.json',
    'memory-store.json',
  ];
  _engines.stores = {};
  for (const f of files) {
    try {
      const fp = path.join(STORES_DIR, f);
      if (fs.existsSync(fp)) {
        _engines.stores[f] = JSON.parse(fs.readFileSync(fp, 'utf8'));
      }
    } catch {}
  }
}

// ============================================================
// 主API
// ============================================================

class MemoryManager {
  constructor() {
    _initEngines();
    this.stats = this._loadStats();
  }

  // ------------------------------------------------------
  // 统一召回 — 核心API
  // query        : 检索文本
  // options      : { topK, sources, taskType }
  // returns      : { results[], engine, totalMs }
  // ------------------------------------------------------
  recall(query, options = {}) {
    const { topK = 8, sources = null, taskType = null } = options;
    const start = Date.now();
    _initEngines();

    // 1. 路由：决定查哪些引擎
    const targets = this._routeQuery(query, taskType);

    // 2. 并行召回（限制 topK/引擎数）
    const perEngine = Math.ceil(topK / targets.length);
    const results = [];

    for (const engine of targets) {
      try {
        const found = this._recallFrom(engine, query, perEngine);
        results.push(...found);
      } catch (e) {
        // 单引擎失败不影响其他
      }
    }

    // 3. 排序 + 去重 + 截断
    const deduped = this._deduplicate(results);
    deduped.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      query,
      results: deduped.slice(0, topK),
      engines: targets.map(e => e.name),
      totalMs: Date.now() - start,
    };
  }

  // ------------------------------------------------------
  // 统一存储 — 写入记忆
  // content     : 记忆文本
  // metadata    : { source, type, tags }
  // ------------------------------------------------------
  store(content, metadata = {}) {
    _initEngines();
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry = {
      id,
      content,
      metadata,
      createdAt: Date.now(),
      accessCount: 0,
    };

    // 1. 路由决定目标引擎
    const type = this._classifyContent(content, metadata);
    const targets = this._routeWrite(type, metadata);

    // 2. 写入各引擎（不阻塞）
    for (const engine of targets) {
      try {
        this._writeTo(engine, entry);
      } catch (e) {}
    }

    // 3. 更新索引
    this._updateIndex(entry, type);

    return { id, type, targets: targets.map(t => t.name) };
  }

  // ------------------------------------------------------
  // 状态读取
  // ------------------------------------------------------
  getState(key = null) {
    _initEngines();
    if (!key) return _engines.states;
    return _engines.states[key + '.json'] || null;
  }

  // ------------------------------------------------------
  // 统计信息
  // ------------------------------------------------------
  getStats() {
    return { ...this.stats, engines: Object.keys(_engines).filter(k => _engines[k] !== null) };
  }

  // ====================================================
  // 内部方法
  // ====================================================

  _routeQuery(query, taskType) {
    // 根据任务类型 + 关键词决定查哪些引擎
    const targets = [];

    // 永远查：dialectic（轻量、快速、所有查询都用）
    if (_engines.dialectic) targets.push({ name: 'dialectic', weight: 1.0 });

    // 语义查询 → meaningful + mem0
    if (!taskType || taskType === 'reasoning' || taskType === 'general') {
      if (_engines.meaningful) targets.push({ name: 'meaningful', weight: 1.0 });
      if (_engines.mem0) targets.push({ name: 'mem0', weight: 0.8 });
    }

    // 决策/执行 → lifecycle + reflection
    if (taskType === 'decision' || taskType === 'execution') {
      if (_engines.lifecycle) targets.push({ name: 'lifecycle', weight: 1.0 });
      if (_engines.reflection) targets.push({ name: 'reflection', weight: 0.9 });
    }

    // 技能/代码 → meaningful（procedural层）
    if (taskType === 'skill' || taskType === 'code') {
      if (_engines.meaningful) targets.push({ name: 'meaningful', weight: 1.2 });
    }

    return targets.length > 0 ? targets : [{ name: 'dialectic', weight: 1.0 }];
  }

  _routeWrite(type, metadata) {
    const targets = [];
    const typeMap = {
      CORE: ['meaningful', 'lifecycle'],
      LEARNED: ['meaningful', 'lifecycle'],
      EPHEMERAL: ['dialectic'],
    };
    const types = typeMap[type] || ['meaningful'];
    for (const t of types) {
      if (_engines[t]) targets.push(t);
    }
    return targets;
  }

  _classifyContent(content, metadata) {
    // 简单规则分类
    const text = content.toLowerCase();
    if (text.includes('永远') || text.includes('必须') || text.includes('核心指令')) return 'CORE';
    if (text.includes('学会了') || text.includes('教训') || text.includes('经验')) return 'LEARNED';
    return 'EPHEMERAL';
  }

  _recallFrom(engineName, query, topK) {
    const eng = _engines[engineName];
    if (!eng) return [];

    // dialectic
    if (engineName === 'dialectic') {
      const fn = typeof eng.dialecticRecall === 'function' ? eng.dialecticRecall : null;
      if (!fn) return [];
      try {
        const r = fn(query, { topK, includeMeta: false });
        return (r.results || []).map(item => ({
          source: 'dialectic',
          content: item.content || item.firstMessage || '',
          score: item._score || item._finalScore || 0.5,
          metadata: { layer: item._layer },
        }));
      } catch { return []; }
    }

    // meaningful / mem0 / lifecycle / reflection
    if (typeof eng.search === 'function') {
      try {
        const r = eng.search(query, { limit: topK });
        return (r.results || []).map(item => ({
          source: engineName,
          content: item.content || item.text || '',
          score: item.reinforcementCount ? item.reinforcementCount / 10 : (item.score || 0.5),
          metadata: item.metadata || {},
        }));
      } catch { return []; }
    }

    return [];
  }

  _writeTo(engineName, entry) {
    const eng = _engines[engineName];
    if (!eng) return;

    switch (engineName) {
      case 'meaningful':
      case 'lifecycle': {
        if (eng.write) eng.write(entry.content, entry.metadata);
        break;
      }
      default:
        break;
    }
  }

  _deduplicate(results) {
    const seen = new Set();
    return results.filter(r => {
      const key = r.content.substring(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _updateIndex(entry, type) {
    // 追加到 unified-index.json（轻量追加日志）
    try {
      const idxFile = path.join(STORES_DIR, 'unified-index.json');
      let idx = [];
      if (fs.existsSync(idxFile)) {
        idx = JSON.parse(fs.readFileSync(idxFile, 'utf8'));
      }
      idx.push({ id: entry.id, type, createdAt: entry.createdAt });
      // 只保留最近500条
      if (idx.length > 500) idx = idx.slice(-500);
      fs.writeFileSync(idxFile, JSON.stringify(idx, null, 2));
    } catch {}
  }

  _loadStats() {
    const stats = { states: 0, stores: 0 };
    try { stats.states = fs.readdirSync(STATES_DIR).length; } catch {}
    try { stats.stores = fs.readdirSync(STORES_DIR).length; } catch {}
    try { stats.texts = fs.readdirSync(TEXTS_DIR).length; } catch {}
    try { stats.sessions = fs.readdirSync(SESSIONS_DIR).length; } catch {}
    return stats;
  }
}

// ============================================================
// 单例导出
// ============================================================
let _instance = null;

function getMemoryManager() {
  if (!_instance) _instance = new MemoryManager();
  return _instance;
}

// 快捷API
function recall(query, options) {
  return getMemoryManager().recall(query, options);
}

function store(content, metadata) {
  return getMemoryManager().store(content, metadata);
}

function getMemoryStats() {
  return getMemoryManager().getStats();
}

module.exports = {
  MemoryManager,
  getMemoryManager,
  recall,
  store,
  getMemoryStats,
};
