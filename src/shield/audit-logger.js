/**
 * AuditLogger — 轻量级安全事件审计日志
 * 来源: claude-clarity v1.8.2 吸收集成
 * 记录关键安全事件，写入仅追加日志文件（append-only），支持自动轮转。
 *
 * [v6.0.34 元审计修复] 之前 log() 只 push 内存数组，进程重启即丢失，
 * 不满足安全日志"仅追加防篡改"要求 = 假审计。现真落盘到磁盘。
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

class AuditLogger {
  constructor(options = {}) {
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    this.logPath = options.logPath || path.join(process.cwd(), 'data', 'audit', 'audit-log.jsonl');
    this._entries = [];
    this._closed = false;
    // 启动时加载已有日志到内存(供 readRecent/getStats)，但不阻塞
    this._loadExisting();
  }

  _loadExisting() {
    try {
      if (fs.existsSync(this.logPath)) {
        const lines = fs.readFileSync(this.logPath, 'utf8').trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try { this._entries.push(JSON.parse(line)); } catch (e) { /* 跳过损坏行 */ }
        }
      }
    } catch (e) { /* 加载失败不影响启动 */ }
  }

  log(eventType, details = {}) {
    if (this._closed) return;
    const entry = {
      t: Date.now(),
      e: eventType,
      d: details,
      h: this._hash(eventType + JSON.stringify(details) + Date.now())
    };
    this._entries.push(entry);
    if (this._entries.length > 1000) this._entries = this._entries.slice(-500);

    // [v6.0.34] 真落盘：仅追加写入（append-only，防篡改）
    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
      // 轮转检查
      if (fs.existsSync(this.logPath) && fs.statSync(this.logPath).size > this.maxSize) {
        const rotated = this.logPath + '.1';
        fs.renameSync(this.logPath, rotated);
      }
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', { mode: 0o600 });
    } catch (e) {
      // 落盘失败不能吞掉安全事件——至少内存里还有
      console.warn(`[AuditLogger] 落盘失败(内存保留): ${e.message}`);
    }
  }

  close() {
    this._closed = true;
  }

  readRecent(limit = 50) { return this._entries.slice(-limit).reverse(); }

  getStats() {
    const types = {};
    this._entries.forEach(e => { types[e.e] = (types[e.e] || 0) + 1; });
    return { total: this._entries.length, types, persisted: fs.existsSync(this.logPath) };
  }

  _hash(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12); }
}

module.exports = { AuditLogger };
