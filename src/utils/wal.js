/**
 * wal.js — 预写日志（Write-Ahead Log）
 * 
 * 用于保证多文件操作的事务性：先记录操作到 WAL，全部成功后再清除。
 * 崩溃重启时自动重放未完成的操作。
 * 
 * @version v0.13.9
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

  /** 读取所有 WAL 条目 */
  async _readAll() {
    const raw = await fs.promises.readFile(this.walPath, 'utf8');
    return JSON.parse(raw);
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
   * 重放 WAL 并执行 executor
   * @param {Function} executor - (entry) => Promise<void>
   */
  async replay(executor) {
    const entries = await this._readAll().catch(() => []);
    for (const entry of entries) {
      try {
        await executor(entry);
      } catch (e) {
        // 单条失败继续其他
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
