/**
 * TTLPreferences - 心虫可调 TTL 临时偏好模块
 *
 * 背景：GitHub Issue #7 harshita713lab 问到 "Temporary Preferences"——
 * 心虫的 EPHEMERAL 层是 session 级、不可设时长，无法表达"这个偏好保留 2 小时"。
 *
 * 本模块补上"带过期时间的临时偏好"，独立存储（不动底层 MeaningfulMemory 结构，零风险）：
 *  - set(key, value, ttlMs): 设置偏好 + 存活时长
 *  - get(key): 读取（过期自动返回 null 并清理）
 *  - all(): 列出所有未过期偏好
 *  - remove(key) / clear(): 删除
 *  - sweep(): 主动清理所有过期项
 *
 * 设计原则：
 *  - lazy expiry: 读取时判断过期（无需后台定时器）
 *  - 独立文件 data/ttl-preferences.json（不污染核心记忆层）
 *  - ttlMs=0 或不传 → 永不过期（等价普通临时偏好）
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class TTLPreferences {
  constructor(rootPath) {
    this.rootPath = rootPath || process.cwd();
    this.storePath = path.join(this.rootPath, 'data', 'ttl-preferences.json');
    this._store = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.storePath)) return JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
    } catch (e) { /* 损坏则重置 */ }
    return {};
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this.storePath), { recursive: true });
      fs.writeFileSync(this.storePath, JSON.stringify(this._store, null, 2));
      return true;
    } catch (e) { return false; }
  }

  _isExpired(entry, now = Date.now()) {
    return entry.expiresAt !== null && entry.expiresAt <= now;
  }

  /**
   * 设置临时偏好
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs - 存活毫秒数；0 或不传 = 永不过期
   */
  set(key, value, ttlMs = 0) {
    const now = Date.now();
    this._store[key] = {
      value,
      setAt: now,
      expiresAt: ttlMs > 0 ? now + ttlMs : null
    };
    this._save();
    return { key, expiresAt: this._store[key].expiresAt };
  }

  /**
   * 读取偏好（过期自动清理并返回 null）
   */
  get(key) {
    const entry = this._store[key];
    if (!entry) return null;
    if (this._isExpired(entry)) {
      delete this._store[key];
      this._save();
      return null;
    }
    return entry.value;
  }

  /**
   * 列出所有未过期偏好
   */
  all() {
    const now = Date.now();
    const result = {};
    let changed = false;
    for (const [k, entry] of Object.entries(this._store)) {
      if (this._isExpired(entry, now)) {
        delete this._store[k];
        changed = true;
      } else {
        result[k] = {
          value: entry.value,
          expiresInMs: entry.expiresAt === null ? null : entry.expiresAt - now
        };
      }
    }
    if (changed) this._save();
    return result;
  }

  remove(key) {
    const existed = key in this._store;
    delete this._store[key];
    if (existed) this._save();
    return existed;
  }

  clear() {
    const n = Object.keys(this._store).length;
    this._store = {};
    this._save();
    return n;
  }

  /**
   * 主动清理所有过期项，返回清理数量
   */
  sweep() {
    const now = Date.now();
    let swept = 0;
    for (const [k, entry] of Object.entries(this._store)) {
      if (this._isExpired(entry, now)) {
        delete this._store[k];
        swept++;
      }
    }
    if (swept > 0) this._save();
    return swept;
  }
}

module.exports = { TTLPreferences };
