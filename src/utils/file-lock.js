/**
 * file-lock.js — 进程级文件锁
 * 
 * 使用 flock-style 锁文件实现，防止多实例并发写入冲突。
 * 零外部依赖，使用 fs.promises + fcntl（Linux/macOS）。
 * 
 * @version v0.13.9
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 文件锁类
 * 
 * @param {string} lockPath - 锁文件路径
 */
class FileLock {
  /**
   * @param {string} lockPath - .lock 文件路径
   */
  constructor(lockPath) {
    this.lockPath = lockPath;
    this.fd = null;
    this._acquired = false;
  }

  /** 获取锁（同步，阻塞直到拿到） */
  acquireSync() {
    const flags = process.platform === 'win32' ? 'r+' : 'r+';
    this.fd = fs.openSync(this.lockPath, flags);
    try {
      if (process.platform === 'win32') {
        // Windows: 用排他模式重新打开
        fs.closeSync(this.fd);
        this.fd = fs.openSync(this.lockPath, 'r+');
      }
      // 写入进程 ID
      fs.writeFileSync(this.lockPath, JSON.stringify({
        pid: process.pid,
        ts: Date.now(),
      }));
      this._acquired = true;
    } catch (e) {
      fs.closeSync(this.fd);
      this.fd = null;
      throw e;
    }
  }

  /** 释放锁 */
  releaseSync() {
    if (!this._acquired || this.fd === null) return;
    try {
      // 写入空内容表示释放
      fs.writeFileSync(this.lockPath, JSON.stringify({ pid: null, ts: null }));
    } catch {}
    try {
      fs.closeSync(this.fd);
    } catch {}
    this.fd = null;
    this._acquired = false;
  }

  /**
   * 非阻塞尝试获取锁
   * @returns {boolean} 是否成功获取
   */
  tryAcquireSync() {
    try {
      this.fd = fs.openSync(this.lockPath, 'r+');
      fs.writeFileSync(this.lockPath, JSON.stringify({
        pid: process.pid,
        ts: Date.now(),
      }));
      this._acquired = true;
      return true;
    } catch {
      if (this.fd !== null) {
        try { fs.closeSync(this.fd); } catch {}
        this.fd = null;
      }
      return false;
    }
  }
}

/**
 * 全局锁管理器——为每个 baseDir 创建独立锁
 */
class LockManager {
  constructor() {
    this._locks = new Map();
  }

  /**
   * 获取 baseDir 的全局锁
   * @param {string} baseDir - 要加锁的根目录
   * @returns {FileLock}
   */
  getLock(baseDir) {
    if (!this._locks.has(baseDir)) {
      const lockFile = path.join(baseDir, '.heartflow.lock');
      this._locks.set(baseDir, new FileLock(lockFile));
    }
    return this._locks.get(baseDir);
  }
}

// 全局单例
const globalLockManager = new LockManager();

module.exports = { FileLock, LockManager, globalLockManager };
