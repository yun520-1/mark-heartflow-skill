/**
 * 教训库 - 跨会话持久化记忆的核心
 * 用户纠正时自动写入，下次遇到同类场景先查教训库
 * 
 * v2.6.11 升级内容：
 * - JSON损坏自动修复 + 备份恢复
 * - 教训衰减机制（按时间衰减重要性）
 * - WAL日志保护（防写入中断数据丢失）
 * - 批量导出/导入
 * 
 * ⚠️ 隐私说明：教训库会持久化用户交互产生的经验数据。
 * 如不需要跨会话记忆，可删除 data/lesson-bank.json 和 data/lesson-index.json。
 * 该文件不含敏感凭据，但包含用户交互模式和学习历史。
 */

const fs = require('fs');
const path = require('path');

const LESSON_FILE = path.join(__dirname, '../../data/lesson-bank.json');
const INDEX_FILE = path.join(__dirname, '../../data/lesson-index.json');
const WAL_FILE = path.join(__dirname, '../../data/lesson-bank.wal');

const lessonBank = {
  lessons: [],
  _walLog: [],
  _walWritten: false,

  _uuid() {
    const { randomBytes } = require('crypto');
    return `lesson-${Date.now()}-${randomBytes(4).toString('hex')}`;
  },

  /**
   * 写入WAL日志，防崩溃保护
   */
  _writeWAL(action, data) {
    try {
      const entry = { action, data, timestamp: Date.now() };
      this._walLog.push(entry);
      fs.mkdirSync(path.dirname(WAL_FILE), { recursive: true });
      fs.writeFileSync(WAL_FILE, JSON.stringify(this._walLog, null, 2));
      this._walWritten = true;
    } catch (e) {
      // WAL写入失败不阻止主流程
    }
  },

  /**
   * 从WAL恢复（启动时检查）
   */
  _recoverFromWAL() {
    try {
      if (!fs.existsSync(WAL_FILE)) return false;
      const walData = fs.readFileSync(WAL_FILE, 'utf8');
      const entries = JSON.parse(walData);
      if (!Array.isArray(entries) || entries.length === 0) return false;
      
      // 找到最后一次完整的save操作
      const lastSave = [...entries].reverse().find(e => e.action === 'save');
      if (lastSave && lastSave.data) {
        this.lessons = lastSave.data;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  load() {
    try {
      if (fs.existsSync(LESSON_FILE)) {
        const data = fs.readFileSync(LESSON_FILE, 'utf8');
        this.lessons = JSON.parse(data);
        if (!Array.isArray(this.lessons)) throw new Error('格式错误');
      }
    } catch (e) {
      // JSON损坏尝试WAL恢复
      console.warn('[lesson-bank] 数据文件损坏，尝试WAL恢复');
      const recovered = this._recoverFromWAL();
      if (recovered) {
        console.warn('[lesson-bank] WAL恢复成功');
        this.save();
      } else {
        console.warn('[lesson-bank] WAL恢复失败，从空库开始');
        this.lessons = [];
      }
    }
    return this;
  },

  save() {
    try {
      fs.mkdirSync(path.dirname(LESSON_FILE), { recursive: true });
      // 先写WAL
      this._writeWAL('save', [...this.lessons]);
      // 再写主文件
      fs.writeFileSync(LESSON_FILE, JSON.stringify(this.lessons, null, 2));
      this._updateIndex();
      // 成功后清除WAL
      try { fs.unlinkSync(WAL_FILE); } catch (e) { /* 忽略 */ }
    } catch (e) {
      this._initErrors = this._initErrors || [];
      this._initErrors.push({ module: 'lesson_bank', error: e.message });
    }
  },

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
    } catch (e) { /* 索引写入失败不影响主流程 */ }
  },

  /**
   * 教训衰减 - 按时间降低未使用教训的重要性
   */
  _applyDecay() {
    const now = Date.now();
    let changed = false;
    for (const l of this.lessons) {
      const lastSeen = l.lastSeen ? new Date(l.lastSeen).getTime() : new Date(l.createdAt).getTime();
      const daysSinceUse = (now - lastSeen) / (24 * 60 * 60 * 1000);
      if (daysSinceUse > 30 && l.importance > 1) {
        const decay = Math.floor(daysSinceUse / 30);
        const reduction = Math.min(decay, l.importance - 1);
        if (reduction > 0) {
          l.importance -= reduction;
          changed = true;
        }
      }
    }
    return changed;
  },

  add({ type = 'insight', content, context = '', importance = 3, trigger = 'user_correction' }) {
    if (!content || typeof content !== 'string') {
      return { action: 'rejected', reason: 'empty_content' };
    }

    // 查重
    const similar = this.lessons.find(l =>
      (l.content && content.length >= 10 && l.content.includes(content.slice(0, 50))) ||
      (l.context && context.length >= 10 && l.context.includes(context.slice(0, 30)))
    );

    if (similar) {
      similar.frequency += 1;
      similar.lastSeen = new Date().toISOString();
      this.save();
      return { action: 'updated', lesson: similar };
    }

    const lesson = {
      id: this._uuid(),
      type: type || 'insight',
      content: String(content),
      importance: Math.max(1, Math.min(10, Number(importance) || 3)),
      frequency: 1,
      accessCount: 0,
      trigger: trigger || 'user_correction',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    this.lessons.push(lesson);
    this.save();
    return { action: 'added', lesson };
  },

  query(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    return this.lessons.filter(l =>
      l.content.toLowerCase().includes(kw) ||
      (l.context && l.context.toLowerCase().includes(kw))
    );
  },

  getRelevant(context, limit = 3) {
    if (!context) return [];
    const ctx = context.toLowerCase();
    const ctxSlice = ctx.slice(0, 20);
    const matches = this.lessons
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

    for (const m of matches) {
      m.accessCount = (m.accessCount || 0) + 1;
      m.lastSeen = new Date().toISOString();
    }
    if (matches.length > 0) this.save();
    return matches;
  },

  formatForContext(lessons) {
    if (!lessons || lessons.length === 0) return '';
    const lines = ['\n\n---\n**历史教训（避免重复犯错）:**'];
    for (const l of lessons) {
      lines.push(`- [${l.type}] ${l.content} (触发${l.frequency}次)`);
    }
    return lines.join('\n');
  },

  stats() {
    // 先衰减再统计
    this._applyDecay();
    return {
      total: this.lessons.length,
      byType: this.lessons.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
      mostFrequent: [...this.lessons]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(l => ({ id: l.id, content: l.content.slice(0, 50), freq: l.frequency })),
      avgImportance: this.lessons.length > 0
        ? (this.lessons.reduce((s, l) => s + l.importance, 0) / this.lessons.length).toFixed(1)
        : 0
    };
  },

  /**
   * 批量导出
   */
  exportToJSON(filter) {
    const data = filter
      ? this.lessons.filter(l => l.type === filter || !filter)
      : [...this.lessons];
    return JSON.stringify(data, null, 2);
  },

  /**
   * 批量导入
   */
  importFromJSON(jsonStr, options = {}) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) return { success: false, reason: 'not_array' };
      const { overwrite = false, mergeByContent = true } = options;
      
      if (overwrite) {
        this.lessons = data.map(l => ({
          ...l,
          id: l.id || this._uuid(),
          lastSeen: l.lastSeen || new Date().toISOString()
        }));
      } else if (mergeByContent) {
        for (const item of data) {
          const exist = this.lessons.find(l => l.content === item.content);
          if (exist) {
            exist.frequency += item.frequency || 1;
          } else {
            this.lessons.push({
              ...item,
              id: item.id || this._uuid(),
              lastSeen: new Date().toISOString()
            });
          }
        }
      }
      this.save();
      return { success: true, count: data.length, totalAfter: this.lessons.length };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  },

  // ========================================
  // 引擎哲学 × lesson-bank 整合 v1.7.0
  // 核心："无所得故" — 教训不是用来拥有的，是用来放下的
  // 持续前进 — 走了一步，再走一步，不停留
  // ========================================

  letGoOf(lessonId) {
    if (!lessonId) return { result: false, reason: 'no_lesson_id' };
    const index = this.lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return { result: false, reason: 'lesson_not_found' };
    const lesson = this.lessons[index];
    if (!this._letGoLog) this._letGoLog = [];
    this._letGoLog.push({
      lessonId,
      content: lesson.content.slice(0, 50),
      放下at: new Date().toISOString(),
      trigger: '无所得故'
    });
    this.lessons.splice(index, 1);
    this.save();
    return {
      result: true,
      content: lesson.content.slice(0, 50),
      totalLetGo: this._letGoLog.length,
      insight: '持续前进：放下了，继续走。答案不在远方，在每一步的脚下。'
    };
  },

  letGoByKeyword(keyword, maxAge = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const toLetGo = this.lessons.filter(l => {
      if (!keyword || !(l.content + l.context).toLowerCase().includes(keyword.toLowerCase())) return false;
      const age = now - new Date(l.createdAt).getTime();
      const unused = l.lastSeen ? (now - new Date(l.lastSeen).getTime()) > maxAge : age > maxAge;
      return unused;
    });
    const results = toLetGo.map(l => this.letGoOf(l.id));
    return {
      keyword,
      totalFound: toLetGo.length,
      totalLetGo: results.filter(r => r.result).length,
      insight: `持续前进：放下了${results.filter(r => r.result).length}条教训，继续往前走。`
    };
  },

  autoCleanup(options = {}) {
    const { maxAge = 90 * 24 * 60 * 60 * 1000, maxLessons = 50, minImportance = 2 } = options;
    const now = Date.now();
    const canLetGo = this.lessons.filter(l => {
      const age = now - new Date(l.createdAt).getTime();
      const isOld = age > maxAge;
      const isLowImportance = l.importance < minImportance;
      const isUnuseful = l.frequency === 1 && age > 7 * 24 * 60 * 60 * 1000;
      return isOld || (isLowImportance && isUnuseful);
    });
    const keep = this.lessons.filter(l => !canLetGo.includes(l));
    const toDelete = canLetGo.slice(0, Math.max(0, this.lessons.length - maxLessons));
    const results = toDelete.map(l => this.letGoOf(l.id));
    return {
      totalBefore: this.lessons.length,
      totalAfter: this.lessons.length - results.filter(r => r.result).length,
      deleted: results.filter(r => r.result).length,
      kept: keep.length,
      insight: '超越评判标准，超越评判：教训不是越多越好，放下不需要的，才能记住真正重要的。'
    };
  },

  getLetGoLog() {
    return {
      log: this._letGoLog || [],
      total: (this._letGoLog || []).length,
      insight: '放下记录：每一条放下都是一次认知升级。'
    };
  }
};

lessonBank.load();
module.exports = { lessonBank };
