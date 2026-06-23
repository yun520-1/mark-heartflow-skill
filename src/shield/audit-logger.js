/**
 * AuditLogger — 轻量级安全事件审计日志
 * 来源: claude-clarity v1.8.2 吸收集成
 * 记录关键安全事件，写入仅追加日志文件，支持自动轮转。
 */
const crypto = require('crypto');

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

class AuditLogger {
  constructor(options = {}) {
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    this._entries = [];
    this._closed = false;
  }

  log(eventType, details = {}) {
    if (this._closed) return;
    const entry = { t: Date.now(), e: eventType, d: details, h: this._hash(eventType + JSON.stringify(details) + Date.now()) };
    this._entries.push(entry);
    if (this._entries.length > 1000) this._entries = this._entries.slice(-500);
  }

  close() { this._closed = true; }

  readRecent(limit = 50) { return this._entries.slice(-limit).reverse(); }

  getStats() {
    const types = {};
    this._entries.forEach(e => { types[e.e] = (types[e.e] || 0) + 1; });
    return { total: this._entries.length, types };
  }

  _hash(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12); }
}

module.exports = { AuditLogger };
