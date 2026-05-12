/**
 * Reflexion — Shinn et al. 2023
 * 任务后自省，记录错误模式到结构化记忆
 * @version v0.12.50
 */
'use strict';

const path = require('path');
const fs = require('fs');

function getDataPath(...segs) {
  return path.resolve(__dirname, '../../../data', ...segs);
}

class Reflexion {
  constructor() {
    this.patternsPath = getDataPath('evolution', 'reflexion-patterns.json');
    this._ensure();
  }

  _ensure() {
    const dir = getDataPath('evolution');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    if (!fs.existsSync(this.patternsPath)) {
      fs.writeFileSync(this.patternsPath, '[]');
    }
  }

  reflect(result) {
    const patterns = JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    const { task, outcome, error, feedback } = result;
    const entry = {
      id: `ref-${Date.now()}`,
      task: String(task || '').substring(0, 200),
      outcome,
      error: error || null,
      selfVerdict: this._verdict(outcome, error, feedback),
      timestamp: Date.now(),
    };
    patterns.push(entry);
    if (patterns.length > 200) patterns.splice(0, patterns.length - 200);
    fs.writeFileSync(this.patternsPath, JSON.stringify(patterns, null, 2));
    return entry;
  }

  _verdict(outcome, error, feedback) {
    if (error) return 'failure';
    if (feedback && (feedback.rating < 3 || feedback.thumbsDown)) return 'failure';
    if (outcome && String(outcome).startsWith('success')) return 'success';
    return 'neutral';
  }

  getFailurePatterns(limit = 20) {
    const patterns = JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    return patterns.filter(p => p.selfVerdict === 'failure').slice(-limit);
  }

  getAllPatterns() {
    return JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
  }
}

module.exports = { Reflexion };
