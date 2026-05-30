/**
 * Transmission Engine v1.0.0 — 知识传递与传承引擎
 * 
 * 功能：
 * - 从对话历史中提炼核心教训（lesson distillation）
 * - 将教训转化为可传递的 skill 格式
 * - 维护传承日志（transmission log）
 * - 版本化传递，确保知识不丢失
 */

const path = require('path');
const fs = require('fs');

class TransmissionEngine {
  constructor(rootPath) {
    this.rootPath = rootPath || process.cwd();
    this.dataDir = path.join(this.rootPath, 'data', 'transmission');
    this.logFile = path.join(this.dataDir, 'transmission-log.json');
    this.lessonFile = path.join(this.dataDir, 'distilled-lessons.json');
    this._ensureDataDir();
    this.transmissionLog = this._loadLog();
    this.distilledLessons = this._loadLessons();
  }

  _ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (e) { console.warn('[TransmissionEngine] _ensureDataDir failed:', e.message); }
  }

  _loadLog() {
    try {
      if (fs.existsSync(this.logFile)) {
        return JSON.parse(fs.readFileSync(this.logFile, 'utf-8'));
      }
    } catch (e) { console.warn('[TransmissionEngine] _loadLog failed:', e.message); }
    return [];
  }

  _loadLessons() {
    try {
      if (fs.existsSync(this.lessonFile)) {
        return JSON.parse(fs.readFileSync(this.lessonFile, 'utf-8'));
      }
    } catch (e) { console.warn('[TransmissionEngine] _loadLessons failed:', e.message); }
    return [];
  }

  _saveLog() {
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(this.transmissionLog, null, 2));
    } catch (e) { console.warn('[TransmissionEngine] _saveLog failed:', e.message); }
  }

  _saveLessons() {
    try {
      fs.writeFileSync(this.lessonFile, JSON.stringify(this.distilledLessons, null, 2));
    } catch (e) { console.warn('[TransmissionEngine] _saveLessons failed:', e.message); }
  }

  /**
   * 从会话历史中提炼教训
   * @param {Array} messages - 对话历史消息
   * @returns {Array} 提炼出的教训
   */
  distill(messages) {
    if (!messages || messages.length === 0) return [];

    const lessons = [];
    const seen = new Set();

    // 从错误/纠正中提炼教训
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];

      // 用户纠正 → AI犯的错误
      if (prev.role === 'user' && curr.role === 'assistant') {
        const correction = this._detectCorrection(prev.content, curr.content);
        if (correction) {
          const key = correction.type + ':' + correction.lesson;
          if (!seen.has(key)) {
            seen.add(key);
            lessons.push({
              type: correction.type,          // 'error', 'insight', 'pattern'
              lesson: correction.lesson,
              evidence: correction.evidence,
              fromMessage: prev.content?.slice(0, 100) || '',
              distilledAt: Date.now(),
              priority: correction.priority || 'medium'
            });
          }
        }
      }

      // 用户提供了新知识/洞察
      if (prev.role === 'assistant' && curr.role === 'user') {
        const insight = this._detectInsight(curr.content);
        if (insight) {
          const key = 'insight:' + insight.slice(0, 50);
          if (!seen.has(key)) {
            seen.add(key);
            lessons.push({
              type: 'insight',
              lesson: insight,
              evidence: '',
              fromMessage: prev.content?.slice(0, 100) || '',
              distilledAt: Date.now(),
              priority: 'medium'
            });
          }
        }
      }
    }

    // 提炼高优先级教训
    const distilled = lessons.filter(l => l.priority === 'high' || l.priority === 'critical');
    return distilled;
  }

  _detectCorrection(userMsg, assistantMsg) {
    const correctionPatterns = [
      { pattern: /不对|错误|不是这样|重新来|不对的是/i, type: 'error', priority: 'high' },
      { pattern: /你一直|每次都|总是|repeatedly/i, type: 'pattern', priority: 'high' },
      { pattern: /记住|以后要|never forget/i, type: 'instruction', priority: 'medium' },
    ];

    for (const cp of correctionPatterns) {
      if (cp.pattern.test(userMsg)) {
        return {
          type: cp.type,
          priority: cp.priority,
          lesson: this._extractLesson(userMsg),
          evidence: 'user correction pattern: ' + userMsg.slice(0, 80)
        };
      }
    }
    return null;
  }

  _detectInsight(msg) {
    const insightPatterns = [
      /关键在于|核心是|本质上|说到底是/,
      /这就是|这就是为什么|原因/,
      /我的理解是|我觉得|我的观点/
    ];
    for (const p of insightPatterns) {
      if (p.test(msg)) return msg.slice(0, 200);
    }
    return null;
  }

  _extractLesson(msg) {
    // 提取核心教训：从用户纠正中提取最重要的点
    const lines = msg.split(/[。！？\n]/).filter(l => l.trim().length > 5);
    return lines[0]?.trim().slice(0, 200) || msg.slice(0, 200);
  }

  /**
   * 将教训转化为可传递的格式（Pattern Card）
   * @param {object} lesson - 教训对象
   * @returns {object} Pattern Card
   */
  toPatternCard(lesson) {
    return {
      id: this._genId(),
      trigger: lesson.type === 'error' ? '[error correction]' : '[insight]',
      situation: lesson.evidence?.slice(0, 100) || '',
      lesson: lesson.lesson,
      principle: this._extractPrinciple(lesson.lesson),
      priority: lesson.priority,
      createdAt: Date.now(),
      source: 'transmission-engine'
    };
  }

  _extractPrinciple(lesson) {
    // 从教训中提取最核心的原则
    const words = lesson.split(/[，、。]/);
    return words.find(w => w.length >= 4 && w.length <= 30) || lesson.slice(0, 50);
  }

  _genId() {
    return 'pc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /**
   * 传递教训到 lesson bank
   * @param {object} lesson - 教训对象
   */
  transfer(lesson) {
    const card = this.toPatternCard(lesson);
    this.distilledLessons.push(card);
    this._saveLessons();
    this._logTransmission('transfer', card);
    return card;
  }

  /**
   * 批量传递
   * @param {Array} lessons - 教训数组
   */
  transferBatch(lessons) {
    return lessons.map(l => this.transfer(l));
  }

  _logTransmission(action, data) {
    this.transmissionLog.push({
      action,
      data: { id: data.id, type: data.type, lesson: data.lesson?.slice(0, 50) },
      timestamp: Date.now()
    });
    if (this.transmissionLog.length > 500) {
      this.transmissionLog = this.transmissionLog.slice(-500);
    }
    this._saveLog();
  }

  /** 获取传承日志 */
  getTransmissionLog(limit = 20) {
    return this.transmissionLog.slice(-limit).reverse();
  }

  /** 获取所有提炼的教训 */
  getDistilledLessons(limit = 50) {
    return this.distilledLessons.slice(-limit).reverse();
  }

  /** 获取传递统计 */
  getStats() {
    return {
      totalLessons: this.distilledLessons.length,
      totalTransmissions: this.transmissionLog.length,
      byType: this.distilledLessons.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: this.distilledLessons.reduce((acc, l) => {
        acc[l.priority] = (acc[l.priority] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /** 清除旧记录 */
  prune(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAge;
    this.distilledLessons = this.distilledLessons.filter(l => l.createdAt > cutoff);
    this._saveLessons();
  }

  destroy() {
    this.transmissionLog = [];
    this.distilledLessons = [];
  }
}

module.exports = { TransmissionEngine };
