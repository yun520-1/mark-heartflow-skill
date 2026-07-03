/**
 * 长期记忆 (Long-Term Memory) v1.0.0
 *
 * 持久化存储重要记忆
 */

const fs = require('fs');
const path = require('path');

class LongTermMemory {
  constructor(options = {}) {
    // 路径安全校验
    const inputPath = options.storagePath || path.join(__dirname, '../../data/longterm');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[LongTermMemory] Invalid storage path');
    }
    this.storagePath = resolvedPath;
    this.indexFile = path.join(this.storagePath, 'index.json');
    this.maxMemories = options.maxMemories || 10000;
    this.autoSave = options.autoSave !== false;
    this._ensureStoragePath();
    this._loadIndex();
  }

  /**
   * 确保存储目录存在
   */
  _ensureStoragePath() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 加载索引
   */
  _loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        this.index = JSON.parse(fs.readFileSync(this.indexFile, 'utf-8'));
      } else {
        this.index = { memories: [], tags: {} };
      }
    } catch (error) {
      this.index = { memories: [], tags: {} };
    }
  }

  /**
   * 保存索引
   */
  _saveIndex() {
    if (!this.autoSave) return;

    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 添加记忆
   */
  add(memory) {
    const id = memory.id || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const record = {
      id,
      type: memory.type || 'general',
      content: memory.content,
      importance: memory.importance || 0.5,
      tags: memory.tags || [],
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0,
      metadata: memory.metadata || {}
    };

    // 添加到索引
    this.index.memories.push({
      id,
      type: record.type,
      importance: record.importance,
      createdAt: record.createdAt,
      tags: record.tags
    });

    // 更新标签索引
    for (const tag of record.tags) {
      if (!this.index.tags[tag]) {
        this.index.tags[tag] = [];
      }
      this.index.tags[tag].push(id);
    }

    // 保存记忆内容
    this._saveMemoryRecord(record);

    // 清理旧记忆
    this._cleanup();

    this._saveIndex();

    return id;
  }

  /**
   * 保存记忆记录
   */
  _saveMemoryRecord(record) {
    const filePath = path.join(this.storagePath, `${record.id}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 获取记忆
   */
  get(id) {
    const filePath = path.join(this.storagePath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const record = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      record.accessCount++;
      record.accessedAt = Date.now();
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
      return record;
    } catch (error) {
      return null;
    }
  }

  /**
   * 搜索记忆
   */
  search(query, options = {}) {
    const { maxResults = 10, tags = [], type = null } = options;
    const results = [];

    for (const memMeta of this.index.memories) {
      // 过滤标签
      if (tags.length > 0) {
        const hasAllTags = tags.every(t => memMeta.tags.includes(t));
        if (!hasAllTags) continue;
      }

      // 过滤类型
      if (type && memMeta.type !== type) continue;

      // 文本搜索（简单匹配）
      const record = this.get(memMeta.id);
      if (!record) continue;

      if (query) {
        const content = record.content.toLowerCase();
        const queryLower = query.toLowerCase();
        if (!content.includes(queryLower)) continue;
      }

      results.push({
        ...memMeta,
        content: record.content,
        relevance: this._calculateRelevance(record, query)
      });
    }

    // 按相关性排序
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  /**
   * 计算相关性
   */
  _calculateRelevance(record, query) {
    let score = record.importance;
    score += record.accessCount * 0.01;

    // 近期记忆加分
    const ageHours = (Date.now() - record.createdAt) / (1000 * 60 * 60);
    if (ageHours < 24) score += 0.2;
    else if (ageHours < 168) score += 0.1; // 一周内

    // 查询匹配
    if (query && record.content.toLowerCase().includes(query.toLowerCase())) {
      score += 0.3;
    }

    return score;
  }

  /**
   * 按标签获取记忆
   */
  getByTag(tag, maxResults = 20) {
    const ids = this.index.tags[tag] || [];
    const results = [];

    for (const id of ids.slice(0, maxResults)) {
      const record = this.get(id);
      if (record) results.push(record);
    }

    return results;
  }

  /**
   * 删除记忆
   */
  delete(id) {
    const index = this.index.memories.findIndex(m => m.id === id);
    if (index === -1) return false;

    const memory = this.index.memories[index];

    // 从标签索引中移除
    for (const tag of memory.tags) {
      this.index.tags[tag] = this.index.tags[tag].filter(tid => tid !== id);
    }

    // 从索引中移除
    this.index.memories.splice(index, 1);

    // 删除文件
    const filePath = path.join(this.storagePath, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    this._saveIndex();
    return true;
  }

  /**
   * 更新记忆重要性
   */
  updateImportance(id, importance) {
    const record = this.get(id);
    if (!record) return null;

    record.importance = Math.min(1, Math.max(0, importance));
    this._saveMemoryRecord(record);

    // 更新索引
    const index = this.index.memories.findIndex(m => m.id === id);
    if (index !== -1) {
      this.index.memories[index].importance = record.importance;
      this._saveIndex();
    }

    return record;
  }

  /**
   * 清理旧记忆
   */
  _cleanup() {
    if (this.index.memories.length <= this.maxMemories) return;

    // 按重要性和访问时间排序
    const sorted = [...this.index.memories].sort((a, b) => {
      const scoreA = a.importance - (a.createdAt / 10000000);
      const scoreB = b.importance - (b.createdAt / 10000000);
      return scoreA - scoreB;
    });

    // 删除最不重要的记忆
    const toDelete = sorted.slice(0, this.index.memories.length - this.maxMemories);
    for (const mem of toDelete) {
      this.delete(mem.id);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalMemories: this.index.memories.length,
      maxMemories: this.maxMemories,
      byType: this._countByType(),
      byTag: { ...this.index.tags },
      averageImportance: this._getAverageImportance()
    };
  }

  /**
   * 按类型计数
   */
  _countByType() {
    const counts = {};
    for (const mem of this.index.memories) {
      counts[mem.type] = (counts[mem.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * 获取平均重要性
   */
  _getAverageImportance() {
    if (this.index.memories.length === 0) return 0;
    const sum = this.index.memories.reduce((acc, m) => acc + m.importance, 0);
    return sum / this.index.memories.length;
  }

  /**
   * 获取所有记忆ID
   */
  getAllIds() {
    return this.index.memories.map(m => m.id);
  }
}

module.exports = { LongTermMemory };
