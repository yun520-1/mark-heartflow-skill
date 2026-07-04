/**
 * KVCachePersistor — KV Cache持久化引擎 v1.0.0
 *
 * 基于 "Agent Memory Below the Prompt" (arXiv:2603.04428)：
 * 将LLM的KV cache持久化到磁盘，支持4-bit量化存储，
 * 直接重载到注意力层，消除冗余的O(n) prefill计算。
 *
 * 心虫适配：
 *   - 不直接操作模型权重（心虫无模型访问权）
 *   - 而是持久化推理中间状态（注意力模式、推理路径、置信度序列）
 *   - 类似KV cache的思路：跳过重复计算，直接恢复状态
 *
 * 集成:
 *   hf.kvCache.save(sessionId, key, tensor)
 *   hf.kvCache.load(sessionId, key)
 *   hf.kvCache.has(sessionId, key)
 *   hf.kvCache.getStats()
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = '1.0.0';
const CACHE_DIR = path.join(require('os').tmpdir(), 'heartflow-kv-cache');

/**
 * 4-bit量化：将float值映射到0-15
 * @param {number} value - 输入值（通常0-1范围）
 * @returns {number} 0-15整数
 */
function quantize4bit(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(clamped * 15);
}

/**
 * 4-bit反量化
 * @param {number} q - 0-15整数
 * @returns {number} 0-1浮点
 */
function dequantize4bit(q) {
  return q / 15;
}

/**
 * 量化数组
 */
function quantizeArray(arr) {
  return arr.map(v => quantize4bit(v));
}

/**
 * 反量化数组
 */
function dequantizeArray(arr) {
  return arr.map(v => dequantize4bit(v));
}

class KVCachePersistor {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      cacheDir: options.cacheDir || CACHE_DIR,
      maxCacheSize: options.maxCacheSize || 100,    // 最大缓存条目数
      maxEntrySize: options.maxEntrySize || 1024,   // 单条最大tensor长度
      quantize: options.quantize !== false,         // 默认启用4-bit量化
      ttlMs: options.ttlMs || 24 * 60 * 60 * 1000, // 默认24小时TTL
    };

    this._index = new Map();  // sessionId → { keys: Set, timestamps: Map }
    this._stats = { saves: 0, loads: 0, hits: 0, misses: 0, evictions: 0 };

    this._ensureDir();
    this._loadIndex();
  }

  // ─── 核心 API ─────────────────────────────────────────────────────────────

  /**
   * 保存KV对到持久化缓存
   * @param {string} sessionId - 会话ID
   * @param {string} key - 缓存键
   * @param {Array|Object} tensor - 要缓存的数据（向量或对象）
   * @returns {boolean} 是否成功
   */
  save(sessionId, key, tensor) {
    try {
      const sessionDir = path.join(this.config.cacheDir, sessionId);
      fs.mkdirSync(sessionDir, { recursive: true });

      // 序列化
      let data;
      if (Array.isArray(tensor)) {
        const processed = this.config.quantize
          ? { q: quantizeArray(tensor.slice(0, this.config.maxEntrySize)), shape: [tensor.length] }
          : { v: tensor.slice(0, this.config.maxEntrySize) };
        data = Buffer.from(JSON.stringify(processed), 'utf-8');
      } else {
        data = Buffer.from(JSON.stringify(tensor), 'utf-8');
      }

      // 写入文件
      const filePath = path.join(sessionDir, `${key}.kv`);
      fs.writeFileSync(filePath, data);

      // 更新索引
      if (!this._index.has(sessionId)) {
        this._index.set(sessionId, { keys: new Set(), timestamps: new Map() });
      }
      const si = this._index.get(sessionId);
      si.keys.add(key);
      si.timestamps.set(key, Date.now());

      this._stats.saves++;
      this._checkEviction(sessionId);
      this._saveIndex();

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 从持久化缓存加载KV对
   * @param {string} sessionId - 会话ID
   * @param {string} key - 缓存键
   * @returns {Array|Object|null} 缓存的数据，不存在返回null
   */
  load(sessionId, key) {
    try {
      const filePath = path.join(this.config.cacheDir, sessionId, `${key}.kv`);
      if (!fs.existsSync(filePath)) {
        this._stats.misses++;
        return null;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // 反量化
      if (data.q) {
        this._stats.hits++;
        return dequantizeArray(data.q);
      }
      if (data.v) {
        this._stats.hits++;
        return data.v;
      }

      this._stats.hits++;
      return data;
    } catch (e) {
      this._stats.misses++;
      return null;
    }
  }

  /**
   * 检查键是否存在
   */
  has(sessionId, key) {
    return fs.existsSync(path.join(this.config.cacheDir, sessionId, `${key}.kv`));
  }

  /**
   * 删除缓存条目
   */
  delete(sessionId, key) {
    try {
      const filePath = path.join(this.config.cacheDir, sessionId, `${key}.kv`);
      fs.unlinkSync(filePath);

      const si = this._index.get(sessionId);
      if (si) {
        si.keys.delete(key);
        si.timestamps.delete(key);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 清理过期缓存
   */
  prune() {
    const now = Date.now();
    let pruned = 0;

    for (const [sessionId, si] of this._index) {
      for (const [key, ts] of si.timestamps) {
        if (now - ts > this.config.ttlMs) {
          this.delete(sessionId, key);
          pruned++;
        }
      }
    }

    return { pruned };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────────

  getStats() {
    let totalEntries = 0;
    let totalBytes = 0;

    for (const [sessionId, si] of this._index) {
      totalEntries += si.keys.size;
      const sessionDir = path.join(this.config.cacheDir, sessionId);
      if (fs.existsSync(sessionDir)) {
        for (const f of fs.readdirSync(sessionDir)) {
          try { totalBytes += fs.statSync(path.join(sessionDir, f)).size; } catch (e) { /* skip */ }
        }
      }
    }

    return {
      version: this.version,
      sessions: this._index.size,
      totalEntries,
      totalBytes,
      hitRate: this._stats.saves > 0 ? (this._stats.hits / Math.max(1, this._stats.loads)).toFixed(2) : 0,
      ...this._stats,
    };
  }

  // ─── 内部方法 ──────────────────────────────────────────────────────────────

  _checkEviction(sessionId) {
    const si = this._index.get(sessionId);
    if (!si || si.keys.size <= this.config.maxCacheSize) return;

    // LRU eviction
    const sorted = [...si.timestamps.entries()].sort((a, b) => a[1] - b[1]);
    const toEvict = sorted.slice(0, sorted.length - this.config.maxCacheSize);
    for (const [key] of toEvict) {
      this.delete(sessionId, key);
      this._stats.evictions++;
    }
  }

  _ensureDir() {
    try { fs.mkdirSync(this.config.cacheDir, { recursive: true }); } catch (e) { /* non-fatal */ }
  }

  _loadIndex() {
    const indexFile = path.join(this.config.cacheDir, '.index.json');
    if (!fs.existsSync(indexFile)) return;
    try {
      const data = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      for (const [sid, si] of Object.entries(data.sessions || {})) {
        this._index.set(sid, {
          keys: new Set(si.keys || []),
          timestamps: new Map(si.timestamps || []),
        });
      }
    } catch (e) { /* non-fatal */ }
  }

  _saveIndex() {
    try {
      const sessions = {};
      for (const [sid, si] of this._index) {
        sessions[sid] = {
          keys: [...si.keys],
          timestamps: [...si.timestamps],
        };
      }
      fs.writeFileSync(path.join(this.config.cacheDir, '.index.json'), JSON.stringify({ sessions }));
    } catch (e) { /* non-fatal */ }
  }
}

module.exports = { KVCachePersistor };
