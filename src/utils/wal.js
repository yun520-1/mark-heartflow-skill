/**
 * wal.js — 预写日志（Write-Ahead Log）
 * 
 * 用于保证多文件操作的事务性：先记录操作到 WAL，全部成功后再清除。
 * 崩溃重启时自动重放未完成的操作。
 * 
 * @version v0.13.10
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * WAL 条目结构
 * @typedef {{ id: string, action: 'store'|'update'|'delete', file: string, data?: any, timestamp: number }} WALEntry
 */

class WAL {
  /**
   * @param {string} walPath - WAL 文件路径
   */
  constructor(walPath) {
    this.walPath = walPath;
  }

  /** 追加一条 WAL 记录（先写临时文件再 rename） */
  async write(entry) {
    const entries = await this._readAll().catch(() => []);
    entries.push({ ...entry, timestamp: Date.now() });
    await this._atomicWrite(entries);
  }

  /** 读取所有 WAL 条目（带 JSON 损坏保护） */
  async _readAll() {
    try {
      const raw = await fs.promises.readFile(this.walPath, 'utf8');
      const entries = JSON.parse(raw);
      // Schema 验证：确保是数组
      if (!Array.isArray(entries)) {
        throw new Error(`WAL schema invalid: expected array, got ${typeof entries}`);
      }
      return entries;
    } catch (e) {
      if (e instanceof SyntaxError) {
        // JSON 损坏，备份坏文件，初始化为空 WAL
        const bak = this.walPath + '.corrupted.' + Date.now();
        try {
          await fs.promises.rename(this.walPath, bak);
          console.error(`[WAL] JSON corrupted, backed up to ${bak}`);
        } catch {}
        return [];
      }
      throw e;
    }
  }

  /** 原子写入完整 WAL 文件 */
  async _atomicWrite(entries) {
    const dir = path.dirname(this.walPath);
    const base = path.basename(this.walPath);
    const tmp = path.join(dir, `.${base}.${Date.now()}.${process.pid}.tmp`);
    await fs.promises.writeFile(tmp, JSON.stringify(entries, null, 2), 'utf8');
    await fs.promises.rename(tmp, this.walPath);
  }

  /**
   * 重放 WAL 并执行 executor（带 Schema 验证）
   * @param {Function} executor - (entry) => Promise<void>
   */
  async replay(executor) {
    const entries = await this._readAll().catch(() => []);
    const validActions = ['store', 'update', 'delete'];
    for (const entry of entries) {
      try {
        // Schema 验证：必须有 id、action、file
        if (!entry.id || !entry.action || !entry.file) {
          console.error(`[WAL] Skipping malformed entry: ${JSON.stringify(entry).slice(0, 100)}`);
          continue;
        }
        if (!validActions.includes(entry.action)) {
          console.error(`[WAL] Skipping invalid action "${entry.action}" in entry ${entry.id}`);
          continue;
        }
        await executor(entry);
      } catch (e) {
        console.error(`[WAL] Replay failed for entry ${entry.id}: ${e.message}`);
        // 单条失败继续其他（不中断）
      }
    }
  }

  /** 提交（清空 WAL） */
  async commit() {
    try {
      await fs.promises.unlink(this.walPath);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }

  /** 检查是否有未完成的 WAL */
  async hasPending() {
    try {
      await fs.promises.access(this.walPath);
      const entries = await this._readAll();
      return entries.length > 0;
    } catch {
      return false;
    }
  }
}

module.exports = { WAL };
