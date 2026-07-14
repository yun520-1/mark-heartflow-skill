/**
 * 教训库适配器 - LessonBank Adapter
 * 扩展 LEARNED 层检索/容量，复用 cortex/lesson-bank.js
 * 
 * v1.0.0
 * - 在 lesson-bank 之上增加容量管理、检索增强、统计聚合
 * - 保持向后兼容，所有写操作仍经原 lessonBank
 */

const crypto = require('crypto');
const { encryptJSON, decryptJSON } = require('../memory/memory-encrypt.js');
const fs = require('fs');
const path = require('path');

const ADAPTER_FILE = path.join(__dirname, '../../data/lesson-bank-adapter.json');
const MAX_LESSONS = 2000;

let _adapterCache = null;

function _loadAdapter() {
  if (_adapterCache) return _adapterCache;
  try {
    if (fs.existsSync(ADAPTER_FILE)) {
      const raw = fs.readFileSync(ADAPTER_FILE, 'utf8');
      const data = decryptJSON(raw);
      _adapterCache = Array.isArray(data) ? data : [];
    } else {
      _adapterCache = [];
    }
  } catch (e) {
    _adapterCache = [];
  }
  return _adapterCache;
}

function _saveAdapter(data) {
  try {
    fs.mkdirSync(path.dirname(ADAPTER_FILE), { recursive: true });
    fs.writeFileSync(ADAPTER_FILE, encryptJSON(data));
    _adapterCache = data;
  } catch (e) {
    // silent
  }
}

class LessonBankAdapter {
  constructor(lessonBankInstance = null) {
    this.lessonBank = lessonBankInstance;
    this._enrichedIndex = _loadAdapter();
    this._capacityWarned = false;
  }

  _uuid() {
    return `lba-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  _now() {
    return new Date().toISOString();
  }

  /**
   * 增强检索：结合 lesson-bank.query + 本地索引 + 语义相似度
   */
  search(query, opts = {}) {
    const limit = opts.limit || 10;
    const minConfidence = opts.minConfidence || 0.1;
    const results = [];

    // 1. 原生检索
    if (this.lessonBank && typeof this.lessonBank.query === 'function') {
      try {
        const native = this.lessonBank.query(query);
        for (const item of native) {
          results.push({
            ...item,
            _source: 'native',
            _score: this._scoreRelevance(item, query),
          });
        }
      } catch (e) {
        // continue
      }
    }

    // 2. 增强索引检索
    const kw = String(query || '').toLowerCase();
    for (const item of this._enrichedIndex) {
      const text = `${item.content || ''} ${item.context || ''} ${item.tags ? item.tags.join(' ') : ''}`.toLowerCase();
      if (text.includes(kw)) {
        results.push({
          ...item,
          _source: 'enriched',
          _score: this._scoreRelevance(item, query),
        });
      }
    }

    // 3. 排序 + 去重 + 截断
    const seen = new Set();
    const unique = [];
    results.sort((a, b) => (b._score || 0) - (a._score || 0));

    for (const item of results) {
      const key = (item.id || item.content || '').slice(0, 100);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({
        id: item.id,
        content: item.content,
        context: item.context,
        type: item.type,
        importance: item.importance,
        frequency: item.frequency,
        trigger: item.trigger,
        source: item._source,
        score: Math.round((item._score || 0) * 100) / 100,
        createdAt: item.createdAt,
        lastSeen: item.lastSeen,
      });
      if (unique.length >= limit) break;
    }

    return unique;
  }

  _scoreRelevance(item, query) {
    const text = `${item.content || ''} ${item.context || ''}`.toLowerCase();
    const q = String(query || '').toLowerCase();
    if (!q) return 0;

    let score = 0;
    if (text.includes(q)) score += 0.5;
    const words = q.split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (text.includes(w)) score += 0.2;
    }

    const freq = Number(item.frequency || 1);
    const imp = Number(item.importance || 1);
    score += Math.min(freq * 0.05, 0.3);
    score += Math.min(imp * 0.02, 0.2);

    return Math.min(score, 1);
  }

  /**
   * 容量扩展写 - 突破 lesson-bank 容量，写入增强索引
   */
  addEnriched(entry) {
    if (!entry || !entry.content) return { action: 'rejected', reason: 'empty_content' };

    // 同步到原生 lessonBank
    if (this.lessonBank && typeof this.lessonBank.add === 'function') {
      try {
        const nativeResult = this.lessonBank.add({
          type: entry.type || 'insight',
          content: entry.content,
          context: entry.context || '',
          importance: entry.importance || 3,
          trigger: entry.trigger || 'adapter',
        });
        if (nativeResult && nativeResult.action === 'updated') {
          return { action: 'synced', lesson: nativeResult.lesson };
        }
      } catch (e) {
        // continue to enriched write
      }
    }

    // 写入增强索引
    const item = {
      id: entry.id || this._uuid(),
      content: String(entry.content).slice(0, 2000),
      context: String(entry.context || '').slice(0, 2000),
      type: entry.type || 'insight',
      importance: Math.max(1, Math.min(10, Number(entry.importance) || 3)),
      trigger: entry.trigger || 'adapter',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      frequency: 1,
      accessCount: 0,
      createdAt: this._now(),
      lastSeen: this._now(),
    };

    // 容量管理
    if (this._enrichedIndex.length >= MAX_LESSONS) {
      this._enrichedIndex.sort((a, b) => {
        const sa = (a.importance || 1) * (a.frequency || 1) * (a.accessCount || 1);
        const sb = (b.importance || 1) * (b.frequency || 1) * (b.accessCount || 1);
        return sa - sb;
      });
      const removed = this._enrichedIndex.splice(0, Math.floor(MAX_LESSONS * 0.1));
      this._enrichedIndex.push(item);
    } else {
      this._enrichedIndex.push(item);
    }

    _saveAdapter(this._enrichedIndex);
    return { action: 'added', lesson: item };
  }

  /**
   * 获取统计
   */
  getStats() {
    const nativeStats = this.lessonBank && typeof this.lessonBank.stats === 'function'
      ? this.lessonBank.stats()
      : { total: 0, byType: {}, avgImportance: 0 };

    const enrichedCount = this._enrichedIndex.length;
    const byType = {};
    for (const item of this._enrichedIndex) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    return {
      native: nativeStats,
      enriched: {
        total: enrichedCount,
        byType,
        capacity: MAX_LESSONS,
        utilization: Math.round((enrichedCount / MAX_LESSONS) * 100),
      },
      combined: {
        total: (nativeStats.total || 0) + enrichedCount,
        byType: {
          ...(nativeStats.byType || {}),
          ...byType,
        },
      },
    };
  }

  /**
   * 过程性教训代理 - 复用 lessonBank.matchAndApply
   */
  matchProcedural(condition, limit = 5) {
    if (this.lessonBank && typeof this.lessonBank.matchAndApply === 'function') {
      return this.lessonBank.matchAndApply(condition, limit);
    }
    return [];
  }

  /**
   * 导入增强教训批量数据
   */
  importEnriched(items) {
    const results = [];
    for (const item of Array.isArray(items) ? items : [items]) {
      const r = this.addEnriched(item);
      results.push(r);
    }
    return { success: true, count: results.length };
  }

  /**
   * 重置
   */
  reset() {
    this._enrichedIndex = [];
    _saveAdapter([]);
  }
}

module.exports = { LessonBankAdapter };
