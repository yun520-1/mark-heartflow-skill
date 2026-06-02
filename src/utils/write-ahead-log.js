/**
 * WriteAheadLog — 轻量级 WAL（预写日志）
 *
 * 所有写操作先记录到日志，崩溃后重启时重放未完成的操作。
 * 零外部依赖，只用 Node.js 内置模块。
 *
 * 使用方式:
 *   const wal = new WriteAheadLog('/path/to/wal-dir');
 *   await wal.append('write', { file: '/path/to/data.json', content: '...' });
 *   // 应用层执行实际写入
 *   await wal.commit(lastSeq);
 *   // 崩溃恢复
 *   const pending = await wal.replay();
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const OP_TYPES = { WRITE: 'write', DELETE: 'delete', COMMIT: 'commit' };

class WriteAheadLog {
  constructor(logDir) {
    this.logDir = logDir;
    this._logPath = path.join(logDir, 'wal.log');
    this._seq = 0;
    this._pending = [];
  }

  async _loadSeq() {
    try {
      const content = await fs.readFile(this._logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length > 0) {
        const last = JSON.parse(lines[lines.length - 1]);
        this._seq = last.seq || 0;
      }
    } catch {
      this._seq = 0;
    }
  }

  _hashEntry(seq, type, data, ts) {
    return crypto.createHash('sha256')
      .update(JSON.stringify({ seq, type, data, ts }))
      .digest('hex').slice(0, 16);
  }

  async append(opType, data) {
    this._seq++;
    const ts = Date.now();
    const entry = {
      seq: this._seq,
      type: opType,
      data,
      ts,
      hash: this._hashEntry(this._seq, opType, data, ts),
    };

    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this._logPath, line);
    this._pending.push(entry);
    return entry.seq;
  }

  async commit(lastSeq) {
    await this.append(OP_TYPES.COMMIT, { committedThrough: lastSeq });
  }

  async replay() {
    await this._loadSeq();
    try {
      const content = await fs.readFile(this._logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const pending = [];

      for (const line of lines) {
        const entry = JSON.parse(line);
        const expectedHash = this._hashEntry(entry.seq, entry.type, entry.data, entry.ts);
        if (entry.hash !== expectedHash) continue;

        if (entry.type === OP_TYPES.COMMIT) {
          break;
        }
        if (entry.type === OP_TYPES.WRITE) {
          pending.push(entry);
        }
      }
      return pending;
    } catch {
      return [];
    }
  }

  async flush() {
    await this._loadSeq();
    try {
      const content = await fs.readFile(this._logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const committed = new Set();
      for (const line of lines) {
        const entry = JSON.parse(line);
        if (entry.type === OP_TYPES.COMMIT) {
          for (const p of this._pending) {
            if (p.seq <= entry.data.committedThrough) committed.add(p.seq);
          }
        }
      }
      const uncommitted = this._pending.filter(p => !committed.has(p.seq));
      const newLines = uncommitted.map(p => {
        const h = this._hashEntry(p.seq, p.type, p.data, p.ts);
        return JSON.stringify({ seq: p.seq, type: p.type, data: p.data, ts: p.ts, hash: h });
      });
      await fs.writeFile(this._logPath, newLines.join('\n') + '\n');
    } catch { /* WAL 文件为空或损坏，合理降级：已提交数据不受影响 */ }
  }
}

module.exports = { WriteAheadLog, OP_TYPES };
