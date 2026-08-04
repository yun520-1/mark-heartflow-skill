/**
 * self-correction-loop.js — 自我纠错循环 (v1.0.0)
 *
 * 记录用户纠错，形成学习经验，供验证引擎复用。
 * 接口（被 verification-engine.js 调用）:
 *   onUserCorrection(type, original, corrected) → 记录纠错
 *   getLessons() → 已学纠错经验
 */

class SelfCorrectionLoop {
  constructor(options = {}) {
    this.options = options;
    this._lessons = [];
    this._maxLessons = options.maxLessons || 100;
    this._loaded = false;
    this._load();
  }

  _load() {
    if (this._loaded) return;
    this._loaded = true;
    // 可扩展：从磁盘加载历史纠错
    try {
      if (this.options.loadPath) {
        const fs = require('fs');
        if (fs.existsSync(this.options.loadPath)) {
          const data = JSON.parse(fs.readFileSync(this.options.loadPath, 'utf-8'));
          if (Array.isArray(data)) this._lessons = data.slice(-this._maxLessons);
        }
      }
    } catch (e) { /* 加载失败用空列表 */ }
  }

  /**
   * 记录一次用户纠错
   * @param {string} type - 纠错类型 (factual/logic/style/other)
   * @param {string} original - 原始输出
   * @param {string} corrected - 纠正后的输出
   */
  onUserCorrection(type, original, corrected) {
    const lesson = {
      id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: type || 'other',
      original: String(original || '').slice(0, 500),
      corrected: String(corrected || '').slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    this._lessons.push(lesson);
    if (this._lessons.length > this._maxLessons) {
      this._lessons.splice(0, this._lessons.length - this._maxLessons);
    }
    // 持久化（可选）
    this._save();
    return lesson;
  }

  _save() {
    try {
      if (this.options.savePath) {
        const fs = require('fs');
        fs.writeFileSync(this.options.savePath, JSON.stringify(this._lessons, null, 2), 'utf-8');
      }
    } catch (e) { /* 保存失败不影响运行 */ }
  }

  /**
   * 获取已学纠错经验
   * @param {number} limit
   * @returns {Array}
   */
  getLessons(limit = 10) {
    return this._lessons.slice(-limit);
  }

  /**
   * 统计
   */
  getStats() {
    const byType = {};
    for (const l of this._lessons) byType[l.type] = (byType[l.type] || 0) + 1;
    return { total: this._lessons.length, byType };
  }
}

module.exports = { SelfCorrectionLoop };
