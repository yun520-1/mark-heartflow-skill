/**
 * 教训库 - 跨会话持久化记忆的核心
 * 用户纠正时自动写入，下次遇到同类场景先查教训库
 */
const fs = require('fs');
const path = require('path');

const LESSON_FILE = path.join(__dirname, '../../data/lesson-bank.json');
const INDEX_FILE = path.join(__dirname, '../../data/lesson-index.json');

const lessonBank = {
  lessons: [],

  // 生成UUID
  _uuid() {
    const { randomBytes } = require('crypto');
    return `lesson-${Date.now()}-${randomBytes(4).toString('hex')}`;
  },

  // 加载教训库
  load() {
    try {
      if (fs.existsSync(LESSON_FILE)) {
        const data = fs.readFileSync(LESSON_FILE, 'utf8');
        this.lessons = JSON.parse(data);
      }
    } catch (e) {
      this.lessons = [];
    }
    return this;
  },

  // 持久化
  save() {
    try {
      fs.mkdirSync(path.dirname(LESSON_FILE), { recursive: true });
      fs.writeFileSync(LESSON_FILE, JSON.stringify(this.lessons, null, 2));
      this._updateIndex();
    } catch (e) {
      // 忽略
    }
    return this;
  },

  // 更新索引
  _updateIndex() {
    try {
      const index = {
        lastUpdated: new Date().toISOString(),
        totalCount: this.lessons.length,
        byType: {},
        topLessons: []
      };
      for (const l of this.lessons) {
        index.byType[l.type] = (index.byType[l.type] || 0) + 1;
      }
      // 按重要性*频率排序，取前10
      index.topLessons = this.lessons
      .sort((a, b) => {
        const scoreA = a.importance * Math.max(a.frequency, 1) * Math.max(a.accessCount || 1, 1);
        const scoreB = b.importance * Math.max(b.frequency, 1) * Math.max(b.accessCount || 1, 1);
        return scoreB - scoreA;
      })
      .slice(0, 10)
        .map(l => l.id);
      fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    } catch (e) {
      // 忽略
    }
  },

  // 添加教训
  add({ type = 'insight', content, context = '', importance = 3, trigger = 'user_correction' }) {
    // 检查是否已有相似教训
    const similar = this.lessons.find(l =>
      l.content.includes(content.slice(0, 50)) ||
      (l.context && l.context.includes(context.slice(0, 30)))
    );

    if (similar) {
      similar.frequency += 1;
      similar.lastSeen = new Date().toISOString();
      this.save();
      return { action: 'updated', lesson: similar };
    }

    const lesson = {
      id: this._uuid(),
      type,
      content,
      context,
      importance,
      frequency: 1,
      trigger,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    this.lessons.push(lesson);
    this.save();
    return { action: 'added', lesson };
  },

  // 查询相关教训
  query(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    return this.lessons.filter(l =>
      l.content.toLowerCase().includes(kw) ||
      (l.context && l.context.toLowerCase().includes(kw))
    );
  },

  // 获取当前上下文相关的教训
  getRelevant(context, limit = 3) {
    if (!context) return [];
    const ctx = context.toLowerCase();
    const ctxSlice = ctx.slice(0, 20);
    return this.lessons
      .filter(l =>
        (l.content && l.content.toLowerCase().includes(ctxSlice)) ||
        (l.context && l.context.toLowerCase().includes(ctxSlice))
      )
      .sort((a, b) => {
        const scoreA = a.importance * Math.max(a.frequency, 1) * Math.max(a.accessCount || 1, 1);
        const scoreB = b.importance * Math.max(b.frequency, 1) * Math.max(b.accessCount || 1, 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  // 格式化教训为上下文注入
  formatForContext(lessons) {
    if (!lessons || lessons.length === 0) return '';
    const lines = ['\n\n---\n**历史教训（避免重复犯错）:**'];
    for (const l of lessons) {
      lines.push(`- [${l.type}] ${l.content} (触发${l.frequency}次)`);
    }
    return lines.join('\n');
  },

  // 获取统计
  stats() {
    return {
      total: this.lessons.length,
      byType: this.lessons.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
      mostFrequent: [...this.lessons]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(l => ({ id: l.id, content: l.content.slice(0, 50), freq: l.frequency }))
    };
  }
};

lessonBank.load();

module.exports = { lessonBank };
