/**
 * 引擎教训持久化存储
 * 每个教训存储为单独的 JSON 文件，便于追踪和管理
 * 
 * v2.0.55 新增功能：
 * - 教训去重：相同内容的教训自动合并，递增频次
 * - 重要性过滤查询：按最低重要性阈值获取教训
 * - 相似内容模糊去重：基于内容片段的Jaccard相似度匹配
 * - 自动修剪：根据重要性、时效性和频次自动清理低价值教训
 * - 按类型/触发器搜索：支持 type 和 trigger 过滤
 * - 关键词搜索：全文搜索教训内容
 */
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const LESSONS_DIR = path.join(__dirname);
const INDEX_FILE = path.join(LESSONS_DIR, 'index.json');

class LessonStorage {
  constructor() {
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(LESSONS_DIR)) {
      fs.mkdirSync(LESSONS_DIR, { recursive: true });
    }
  }

  _uuid() {
    return `lesson-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }

  _loadIndex() {
    try {
      if (fs.existsSync(INDEX_FILE)) {
        return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      }
    } catch (e) { /* 合理的降级：索引文件损坏时返回空数据 */ }
    return { lessons: [], lastUpdated: null };
  }

  _saveIndex(index) {
    try {
      index.lastUpdated = new Date().toISOString();
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    } catch (e) {
      // 忽略写入错误
    }
  }

  /**
   * 计算两个字符串的Jaccard相似度（基于单词集合）
   * @param {string} a - 第一个字符串
   * @param {string} b - 第二个字符串
   * @returns {number} - 0~1 的相似度分数
   */
  _jaccardSimilarity(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    const union = wordsA.size + wordsB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * 查找内容相似的已有教训
   * @param {string} content - 教训内容
   * @param {number} threshold - 相似度阈值（默认0.4）
   * @returns {object|null} - 匹配到的已有教训记录
   */
  _findSimilar(content, threshold = 0.4) {
    const index = this._loadIndex();
    for (const entry of index.lessons) {
      const full = this.get(entry.id);
      if (!full) continue;
      const similarity = this._jaccardSimilarity(content, full.content);
      if (similarity >= threshold) return full;
    }
    return null;
  }

  /**
   * 合并两条教训内容（保留更详细的版本，合并标签和上下文）
   * @param {object} existing - 已有教训
   * @param {object} incoming - 新教训
   * @returns {object} - 合并后的教训
   */
  _mergeLessons(existing, incoming) {
    // 保留更长的内容版本
    const mergedContent = incoming.content.length > existing.content.length
      ? incoming.content : existing.content;

    // 合并上下文：如果不同则拼接
    let mergedContext = existing.context;
    if (incoming.context && incoming.context !== existing.context) {
      mergedContext = existing.context + ' | ' + incoming.context;
    }

    // 合并触发器
    const triggers = new Set([existing.trigger, incoming.trigger].filter(Boolean));
    const mergedTrigger = Array.from(triggers).join(', ');

    // 取更高的重要性
    const mergedImportance = Math.max(existing.importance, incoming.importance || 3);

    return {
      ...existing,
      content: mergedContent,
      context: mergedContext,
      trigger: mergedTrigger,
      importance: mergedImportance,
      frequency: (existing.frequency || 1) + 1,
      lastSeen: new Date().toISOString()
    };
  }

  /**
   * 计算教训的保留价值分数（用于修剪决策）
   * @param {object} lessonRecord - 完整的教训记录
   * @returns {number} - 价值分数（越高越值得保留）
   */
  _computeRetentionScore(lessonRecord) {
    const importance = lessonRecord.importance || 3;
    const frequency = lessonRecord.frequency || 1;
    const ageMs = Date.now() - new Date(lessonRecord.lastSeen || lessonRecord.createdAt).getTime();
    const ageDays = ageMs / 86400000;

    // 基础分：重要性 * 频次
    let score = importance * Math.log2(frequency + 1);

    // 时效性衰减：超过30天开始衰减，90天后严重衰减
    if (ageDays > 30) {
      const decayFactor = Math.max(0.1, 1 - (ageDays - 30) / 60);
      score *= decayFactor;
    }

    // 内容长度加分：更详细的教训更有价值
    const contentLength = (lessonRecord.content || '').length;
    if (contentLength > 200) score *= 1.2;
    else if (contentLength > 100) score *= 1.1;

    return Math.round(score * 100) / 100;
  }

  /**
   * 记录一条教训（含去重）
   * 如果内容相似度超过阈值，则合并到已有教训而非新建
   * @param {object} lesson - 教训内容 { type, content, context, trigger, importance }
   * @returns {object} - { success, id, lesson, merged }
   */
  record(lesson) {
    try {
      const content = lesson.content || '';
      const type = lesson.type || 'insight';

      // 第一步：精确内容去重（完全相同的内容）
      const index = this._loadIndex();
      const exactMatch = index.lessons.find(e => {
        const full = this.get(e.id);
        return full && full.content === content;
      });

      if (exactMatch) {
        // 合并到已有教训
        const existing = this.get(exactMatch.id);
        const merged = this._mergeLessons(existing, lesson);
        this._saveLessonFile(merged);
        this._updateIndexEntry(index, merged);
        this._saveIndex(index);
        return { success: true, id: merged.id, lesson: merged, merged: true };
      }

      // 第二步：模糊相似去重
      const similar = this._findSimilar(content, 0.4);
      if (similar) {
        const merged = this._mergeLessons(similar, lesson);
        this._saveLessonFile(merged);
        this._updateIndexEntry(index, merged);
        this._saveIndex(index);
        return { success: true, id: merged.id, lesson: merged, merged: true };
      }

      // 第三步：新建教训
      const id = this._uuid();
      const timestamp = new Date().toISOString();

      const lessonRecord = {
        id,
        type,
        content,
        context: lesson.context || '',
        trigger: lesson.trigger || 'unknown',
        importance: lesson.importance || 3,
        frequency: 1,
        createdAt: timestamp,
        lastSeen: timestamp,
        sessionId: lesson.sessionId || null,
        retentionScore: null
      };

      // 计算保留价值
      lessonRecord.retentionScore = this._computeRetentionScore(lessonRecord);

      this._saveLessonFile(lessonRecord);

      index.lessons.push({
        id,
        type: lessonRecord.type,
        contentPreview: lessonRecord.content.slice(0, 100),
        trigger: lessonRecord.trigger,
        importance: lessonRecord.importance,
        frequency: 1,
        createdAt: timestamp,
        lastSeen: timestamp,
        retentionScore: lessonRecord.retentionScore
      });
      this._saveIndex(index);

      return { success: true, id, lesson: lessonRecord, merged: false };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 保存单个教训文件
   */
  _saveLessonFile(lessonRecord) {
    const filePath = path.join(LESSONS_DIR, `${lessonRecord.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lessonRecord, null, 2));
  }

  /**
   * 更新索引中的条目
   */
  _updateIndexEntry(index, merged) {
    const idx = index.lessons.findIndex(e => e.id === merged.id);
    if (idx !== -1) {
      index.lessons[idx] = {
        id: merged.id,
        type: merged.type,
        contentPreview: merged.content.slice(0, 100),
        trigger: merged.trigger,
        importance: merged.importance,
        frequency: merged.frequency,
        createdAt: merged.createdAt,
        lastSeen: merged.lastSeen,
        retentionScore: merged.retentionScore
      };
    }
  }

  /**
   * 读取指定教训
   * @param {string} id - 教训ID
   * @returns {object|null}
   */
  get(id) {
    try {
      const filePath = path.join(LESSONS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) { /* 合理的降级：教训文件损坏时返回 null */ }
    return null;
  }

  /**
   * 获取所有教训，支持过滤
   * @param {object} filters - 过滤条件
   * @param {number} filters.minImportance - 最低重要性
   * @param {string} filters.type - 按类型过滤
   * @param {string} filters.trigger - 按触发器过滤
   * @param {string} filters.search - 全文关键词搜索
   * @param {number} filters.limit - 返回数量上限
   * @param {string} filters.sortBy - 排序字段 (importance|frequency|createdAt|lastSeen|retentionScore)
   * @param {string} filters.sortOrder - 排序方向 (asc|desc)
   * @returns {array}
   */
  getAll(filters = {}) {
    const index = this._loadIndex();
    let lessons = index.lessons.map(entry => this.get(entry.id)).filter(Boolean);

    // 按重要性过滤
    if (filters.minImportance !== undefined) {
      lessons = lessons.filter(l => l.importance >= filters.minImportance);
    }

    // 按类型过滤
    if (filters.type) {
      lessons = lessons.filter(l => l.type === filters.type);
    }

    // 按触发器过滤
    if (filters.trigger) {
      lessons = lessons.filter(l => l.trigger && l.trigger.includes(filters.trigger));
    }

    // 全文关键词搜索
    if (filters.search) {
      const query = filters.search.toLowerCase();
      lessons = lessons.filter(l => {
        const content = (l.content || '').toLowerCase();
        const context = (l.context || '').toLowerCase();
        const type = (l.type || '').toLowerCase();
        const trigger = (l.trigger || '').toLowerCase();
        return content.includes(query) || context.includes(query) ||
               type.includes(query) || trigger.includes(query);
      });
    }

    // 排序
    if (filters.sortBy) {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      lessons.sort((a, b) => {
        const aVal = a[filters.sortBy] || 0;
        const bVal = b[filters.sortBy] || 0;
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        return (aVal - bVal) * order;
      });
    }

    // 限制数量
    if (filters.limit && filters.limit > 0) {
      lessons = lessons.slice(0, filters.limit);
    }

    return lessons;
  }

  /**
   * 按重要性获取重要教训
   * @param {number} minImportance - 最低重要性 (1-5)
   * @param {number} limit - 返回数量上限
   * @returns {array}
   */
  getImportant(minImportance = 4, limit = 10) {
    return this.getAll({ minImportance, sortBy: 'importance', sortOrder: 'desc', limit });
  }

  /**
   * 按类型获取教训
   * @param {string} type - 教训类型
   * @returns {array}
   */
  getByType(type) {
    return this.getAll({ type, sortBy: 'lastSeen', sortOrder: 'desc' });
  }

  /**
   * 搜索教训内容
   * @param {string} query - 搜索关键词
   * @param {number} limit - 返回数量上限
   * @returns {array}
   */
  search(query, limit = 20) {
    return this.getAll({ search: query, sortBy: 'importance', sortOrder: 'desc', limit });
  }

  /**
   * 获取最新教训
   * @param {number} count - 返回数量
   * @returns {array}
   */
  getRecent(count = 10) {
    return this.getAll({ sortBy: 'lastSeen', sortOrder: 'desc', limit: count });
  }

  /**
   * 获取最常出现的教训
   * @param {number} count - 返回数量
   * @returns {array}
   */
  getMostFrequent(count = 10) {
    return this.getAll({ sortBy: 'frequency', sortOrder: 'desc', limit: count });
  }

  /**
   * 修剪低价值教训
   * 根据保留价值分数，自动删除低于阈值的教训
   * @param {number} threshold - 保留分数阈值（默认2.0）
   * @returns {object} - { removed: number, kept: number, details: array }
   */
  prune(threshold = 2.0) {
    const index = this._loadIndex();
    const kept = [];
    const removed = [];

    for (const entry of index.lessons) {
      const full = this.get(entry.id);
      if (!full) {
        removed.push({ id: entry.id, reason: 'file_missing' });
        continue;
      }

      // 更新保留分数
      full.retentionScore = this._computeRetentionScore(full);
      this._saveLessonFile(full);

      if (full.retentionScore < threshold) {
        // 删除低价值教训
        try {
          fs.unlinkSync(path.join(LESSONS_DIR, `${full.id}.json`));
        } catch (e) { /* 文件可能已不存在 */ }
        removed.push({
          id: full.id,
          type: full.type,
          importance: full.importance,
          frequency: full.frequency,
          retentionScore: full.retentionScore,
          reason: 'low_value'
        });
      } else {
        kept.push(full.id);
      }
    }

    // 重建索引
    index.lessons = index.lessons.filter(e => kept.includes(e.id));
    this._saveIndex(index);

    return {
      removed: removed.length,
      kept: kept.length,
      details: removed
    };
  }

  /**
   * 获取教训统计（增强版）
   * @returns {object}
   */
  stats() {
    const lessons = this.getAll();
    const byType = {};
    const byImportance = {};
    let totalFrequency = 0;
    let highValueCount = 0;

    for (const l of lessons) {
      byType[l.type] = (byType[l.type] || 0) + 1;
      const imp = l.importance || 3;
      byImportance[imp] = (byImportance[imp] || 0) + 1;
      totalFrequency += l.frequency || 1;
      if (imp >= 4) highValueCount++;
    }

    // 计算平均保留分数
    const scores = lessons.map(l => this._computeRetentionScore(l));
    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0;

    // 按重要性分布
    const index = this._loadIndex();

    return {
      total: lessons.length,
      byType,
      byImportance,
      totalFrequency,
      highValueCount,
      averageRetentionScore: avgScore,
      lastUpdated: index.lastUpdated,
      types: Object.keys(byType).length,
      prunableCount: scores.filter(s => s < 2.0).length
    };
  }

  /**
   * 删除指定教训
   * @param {string} id - 教训ID
   * @returns {object} - { success: boolean, error?: string }
   */
  remove(id) {
    try {
      const filePath = path.join(LESSONS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const index = this._loadIndex();
      index.lessons = index.lessons.filter(e => e.id !== id);
      this._saveIndex(index);

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 更新教训的重要性（用于反馈修正）
   * @param {string} id - 教训ID
   * @param {number} newImportance - 新的重要性值 (1-5)
   * @returns {object}
   */
  setImportance(id, newImportance) {
    const lesson = this.get(id);
    if (!lesson) return { success: false, error: 'lesson_not_found' };

    lesson.importance = Math.max(1, Math.min(5, newImportance));
    lesson.retentionScore = this._computeRetentionScore(lesson);
    lesson.lastSeen = new Date().toISOString();
    this._saveLessonFile(lesson);
    this._updateIndexEntry(this._loadIndex(), lesson);
    this._saveIndex(this._loadIndex());

    return { success: true, lesson };
  }

  /**
   * 批量导入教训
   * @param {array} lessons - 教训数组
   * @returns {object} - { imported: number, merged: number, errors: number }
   */
  importMany(lessons) {
    let imported = 0;
    let merged = 0;
    let errors = 0;

    for (const lesson of lessons) {
      const result = this.record(lesson);
      if (result.success) {
        if (result.merged) merged++;
        else imported++;
      } else {
        errors++;
      }
    }

    return { imported, merged, errors };
  }
}

// 单例导出
const lessonStorage = new LessonStorage();
module.exports = { LessonStorage, lessonStorage };
