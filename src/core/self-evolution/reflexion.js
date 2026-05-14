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
    let patterns;
    try {
      patterns = JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    } catch {
      patterns = [];
    }
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
    const tmp = this.patternsPath + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(patterns, null, 2));
      fs.renameSync(tmp, this.patternsPath);
    } catch {
      try { fs.unlinkSync(tmp); } catch {}
    }
    return entry;
  }

  getFailurePatterns(limit = 20) {
    let patterns;
    try {
      patterns = JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    } catch {
      patterns = [];
    }
    return patterns.filter(p => p.selfVerdict === 'failure').slice(-limit);
  }

  getAllPatterns() {
    try {
      return JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    } catch {
      return [];
    }
  }
}

module.exports = { Reflexion };
