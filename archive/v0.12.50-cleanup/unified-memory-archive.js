/**
 * HeartFlow UnifiedMemoryArchive v11.30.0
 * 
 * 根本问题：
 * 每次升级后，记忆散落在 12+ 个文件中，新模块只查部分文件
 * 导致"旧记忆丢失"的假象
 * 
 * 解决方案：
 * 1. 统一检索所有记忆文件（跨文件语义搜索）
 * 2. 将分散记忆迁移到 meaningful-learned.json（统一存储）
 * 3. 统一索引文件，记录每条记忆的原始位置
 */

const fs = require('fs');
const path = require('path');

const MEMORY_ROOT = path.join(__dirname, '..', '..');

// 记忆文件映射
const MEMORY_FILES = {
  // 核心记忆文件
  'meaningful-learned': path.join(MEMORY_ROOT, 'memory/meaningful-learned.json'),
  'meaningful-core': path.join(MEMORY_ROOT, 'memory/meaningful-core.json'),
  
  // 存在状态
  'being-state': path.join(MEMORY_ROOT, 'memory/being-state.json'),
  
  // 学习队列
  'learning-queue': path.join(MEMORY_ROOT, 'memory/learning-queue.json'),
  
  // 记忆商店
  'memory-store': path.join(MEMORY_ROOT, 'memory/memory-store.json'),
  
  // 逻辑核心
  'logic-core': path.join(MEMORY_ROOT, 'memory/logic-core-state.json'),
  
  // 核心结果
  'core-result': path.join(MEMORY_ROOT, 'memory/core-result-state.json'),
  
  // data/ 目录
  'reflection': path.join(MEMORY_ROOT, 'data/reflection-memory/reflections.json'),
  'store-core': path.join(MEMORY_ROOT, 'data/memory-routing/store_core.json'),
  'store-semantic': path.join(MEMORY_ROOT, 'data/memory-routing/store_semantic.json'),
  'store-episodic': path.join(MEMORY_ROOT, 'data/memory-routing/store_episodic.json'),
  'store-procedural': path.join(MEMORY_ROOT, 'data/memory-routing/store_procedural.json'),
  'triality-export': path.join(MEMORY_ROOT, 'data/triality-memory-export.json'),
  
  // 旧版本备份
  'meaningful-v11.5.10': path.join(MEMORY_ROOT, 'data/meaningful-memory-v11.5.10.json'),
};

// 统一索引文件
const INDEX_FILE = path.join(MEMORY_ROOT, 'memory/unified-index.json');

class UnifiedMemoryArchive {
  constructor() {
    this.stats = {
      totalMemories: 0,
      filesScanned: 0,
      duplicates: 0,
    };
  }

  // ============================================================
  // 统一检索
  // ============================================================

  /**
   * 跨所有记忆文件搜索
   * @param {string} query - 搜索词
   * @param {Object} options - { topK, includeSources }
   * @returns {Array} 搜索结果
   */
  search(query, options = {}) {
    const { topK = 20, includeSources = true } = options;
    const queryLower = query.toLowerCase();
    const results = [];

    for (const [source, filePath] of Object.entries(MEMORY_FILES)) {
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entries = this._parseFile(content, source);
        
        for (const entry of entries) {
          const text = this._getSearchableText(entry);
          if (text.includes(queryLower)) {
            const score = this._calculateRelevance(text, queryLower);
            results.push({
              ...entry,
              score,
              source,
              matched: this._getMatchContext(text, queryLower),
            });
          }
        }
      } catch (e) {
        // 跳过解析失败的文件
      }
    }

    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    this.stats.totalMemories = results.length;
    
    return results.slice(0, topK);
  }

  /**
   * 获取所有记忆（不分来源）
   */
  getAll(options = {}) {
    const { limit = 100 } = options;
    const all = [];

    for (const [source, filePath] of Object.entries(MEMORY_FILES)) {
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entries = this._parseFile(content, source);
        for (const entry of entries) {
          all.push({ ...entry, source });
        }
      } catch (e) {}
    }

    // 按时间排序（最新的在前）
    all.sort((a, b) => ((b.timestamp || 0) - (a.timestamp || 0)));
    
    return all.slice(0, limit);
  }

  // ============================================================
  // 迁移功能
  // ============================================================

  /**
   * 将分散的记忆迁移到 meaningful-learned.json
   * 解决每次升级后记忆丢失的问题
   */
  migrateToCentral() {
    console.log('=== 开始记忆迁移 ===\n');
    
    const allEntries = this.getAll({ limit: 1000 });
    console.log('扫描到总记忆:', allEntries.length, '条\n');
    
    // 去重
    const seen = new Set();
    const uniqueEntries = [];
    const duplicates = [];
    
    for (const entry of allEntries) {
      const key = this._generateKey(entry);
      if (seen.has(key)) {
        duplicates.push(entry);
      } else {
        seen.add(key);
        uniqueEntries.push(entry);
      }
    }
    
    console.log('去重后唯一记忆:', uniqueEntries.length, '条');
    console.log('重复记忆:', duplicates.length, '条\n');

    // 读取现有 meaningful-learned
    const learnedPath = MEMORY_FILES['meaningful-learned'];
    let existing = {};
    if (fs.existsSync(learnedPath)) {
      existing = JSON.parse(fs.readFileSync(learnedPath, 'utf-8'));
    }
    console.log('现有 permanent memory:', Object.keys(existing).length, '条\n');

    // 合并
    let added = 0;
    for (const entry of uniqueEntries) {
      const key = entry.key || this._generateKey(entry);
      if (!existing[key]) {
        existing[key] = {
          key,
          value: entry.content || entry.text || entry.value || '',
          type: entry.type || 'migrated',
          reason: `从 ${entry.source} 迁移`,
          timestamp: entry.timestamp || Date.now(),
          source: entry.source,
          level: 'learned',
          migrated: true,
        };
        added++;
      }
    }

    console.log('新增记忆:', added, '条');
    console.log('合并后总计:', Object.keys(existing).length, '条\n');

    // 写入
    fs.writeFileSync(learnedPath, JSON.stringify(existing, null, 2));
    console.log('已写入:', learnedPath);

    // 更新索引
    this._updateIndex(existing);

    return {
      total: allEntries.length,
      unique: uniqueEntries.length,
      duplicates: duplicates.length,
      existing: Object.keys(existing).length,
      added,
    };
  }

  // ============================================================
  // 索引
  // ============================================================

  /**
   * 生成统一索引
   */
  buildIndex() {
    const allEntries = this.getAll({ limit: 1000 });
    
    const index = {
      generated: Date.now(),
      totalEntries: allEntries.length,
      bySource: {},
      byDate: {},
      byType: {},
    };

    for (const entry of allEntries) {
      // bySource
      if (!index.bySource[entry.source]) {
        index.bySource[entry.source] = [];
      }
      index.bySource[entry.source].push(entry.key || this._generateKey(entry));

      // byDate
      if (entry.timestamp) {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        if (!index.byDate[date]) {
          index.byDate[date] = [];
        }
        index.byDate[date].push(entry.key || this._generateKey(entry));
      }

      // byType
      if (entry.type) {
        if (!index.byType[entry.type]) {
          index.byType[entry.type] = [];
        }
        index.byType[entry.type].push(entry.key || this._generateKey(entry));
      }
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    console.log('索引已更新:', INDEX_FILE);
    
    return index;
  }

  _updateIndex(existing) {
    const entries = Object.entries(existing).map(([key, v]) => ({
      key,
      ...v,
    }));

    const index = {
      generated: Date.now(),
      totalEntries: entries.length,
      entries: entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  }

  // ============================================================
  // 解析辅助
  // ============================================================

  _parseFile(content, source) {
    if (!content || content.trim().length === 0) return [];
    
    try {
      const data = JSON.parse(content);
      return this._extractEntries(data, source);
    } catch (e) {
      return [];
    }
  }

  _extractEntries(data, source) {
    const entries = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        const entry = this._normalizeEntry(item, source);
        if (entry) entries.push(entry);
      }
    } else if (typeof data === 'object' && data !== null) {
      // being-state.json
      if (data.existence?.uniqueMoments) {
        for (const m of data.existence.uniqueMoments) {
          entries.push({
            content: m.thought || m.reflection || JSON.stringify(m),
            timestamp: m.time || m.timestamp,
            source,
            type: 'uniqueMoment',
          });
        }
      }
      
      // memory-store.json
      if (data.memories) {
        for (const m of data.memories) {
          entries.push({
            content: m.content,
            timestamp: m.createdAt || m.timestamp,
            source,
            type: m.layer || 'memory',
          });
        }
      }
      
      // learning-queue.json
      if (Array.isArray(data)) {
        for (const item of data) {
          const entry = this._normalizeEntry(item, source);
          if (entry) entries.push(entry);
        }
      }
      
      // 通用对象
      for (const [key, value] of Object.entries(data)) {
        if (key === 'memories' || key === 'sessions' || key === 'uniqueMoments') continue;
        const entry = this._normalizeEntry(value, source);
        if (entry) entries.push({ ...entry, key });
      }
    }

    return entries;
  }

  _normalizeEntry(item, source) {
    if (!item) return null;
    
    const content = item.content || item.text || item.value || item.thought || item.reflection;
    if (!content) return null;
    
    return {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      timestamp: item.timestamp || item.createdAt || item.time,
      source,
      type: item.type || item.layer || 'unknown',
      key: item.key || item.id || null,
    };
  }

  _getSearchableText(entry) {
    return [
      entry.content,
      entry.text,
      entry.value,
      entry.reason,
      entry.key,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  _calculateRelevance(text, query) {
    const queryWords = query.split(/\s+/);
    let score = 0;
    
    for (const word of queryWords) {
      if (text.includes(word)) {
        score += 1;
        // 关键词匹配位置越靠前得分越高
        const idx = text.indexOf(word);
        score += Math.max(0, 1 - idx / text.length);
      }
    }
    
    return score;
  }

  _getMatchContext(text, query) {
    const idx = text.indexOf(query);
    if (idx === -1) return '';
    
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + query.length + 30);
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  }

  _generateKey(entry) {
    const text = entry.content || entry.text || '';
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 50); i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return 'migrated_' + Math.abs(hash).toString(36).substring(0, 8);
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = { UnifiedMemoryArchive };
