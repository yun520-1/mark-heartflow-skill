/**
 * 心虫教训持久化存储
 * 每个教训存储为单独的 JSON 文件，便于追踪和管理
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
    } catch (e) {}
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
   * 记录一条教训
   * @param {object} lesson - 教训内容 { type, content, context, trigger, importance }
   * @returns {object} - { success, id, lesson }
   */
  record(lesson) {
    try {
      const id = this._uuid();
      const timestamp = new Date().toISOString();
      
      const lessonRecord = {
        id,
        type: lesson.type || 'insight',
        content: lesson.content || '',
        context: lesson.context || '',
        trigger: lesson.trigger || 'unknown',
        importance: lesson.importance || 3,
        frequency: 1,
        createdAt: timestamp,
        lastSeen: timestamp,
        sessionId: lesson.sessionId || null
      };

      // 保存单个教训文件
      const filePath = path.join(LESSONS_DIR, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(lessonRecord, null, 2));

      // 更新索引
      const index = this._loadIndex();
      index.lessons.push({
        id,
        type: lessonRecord.type,
        contentPreview: lessonRecord.content.slice(0, 100),
        trigger: lessonRecord.trigger,
        importance: lessonRecord.importance,
        createdAt: timestamp
      });
      this._saveIndex(index);

      return { success: true, id, lesson: lessonRecord };
    } catch (e) {
      return { success: false, error: e.message };
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
    } catch (e) {}
    return null;
  }

  /**
   * 获取所有教训
   * @returns {array}
   */
  getAll() {
    const index = this._loadIndex();
    return index.lessons.map(entry => this.get(entry.id)).filter(Boolean);
  }

  /**
   * 获取教训统计
   * @returns {object}
   */
  stats() {
    const index = this._loadIndex();
    const byType = {};
    for (const l of index.lessons) {
      byType[l.type] = (byType[l.type] || 0) + 1;
    }
    return {
      total: index.lessons.length,
      byType,
      lastUpdated: index.lastUpdated
    };
  }
}

// 单例导出
const lessonStorage = new LessonStorage();
module.exports = { LessonStorage, lessonStorage };
