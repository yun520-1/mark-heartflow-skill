/**
 * DataEraser - 心虫显式数据擦除模块
 *
 * 背景：GitHub Issue #7 中 harshita713lab 问到 "Data Erasure"——
 * 心虫当时只有隐式遗忘（forgetting.js 的指数衰减），没有用户主动擦除的 API。
 * 本模块补上"主动遗忘"能力，契合心虫"纠正自己"的核心。
 *
 * 能力：
 *  - eraseEphemeral(scope): 擦除指定 scope 的临时记忆（EPHEMERAL 层）
 *  - eraseByTag(tag): 从 LEARNED 层删除带某 tag 的记忆
 *  - eraseSession(sessionId): 删除某会话全部临时状态
 *  - stats(): 返回擦除前后计数
 *
 * 设计原则：
 *  - 不删 CORE 层（身份/规则不可擦除，防止自我毁灭）
 *  - 操作幂等、可审计（写入 data/erasure-log.json）
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class DataEraser {
  constructor(rootPath) {
    this.rootPath = rootPath || process.cwd();
    this.dataDir = path.join(this.rootPath, 'data');
    this.logPath = path.join(this.dataDir, 'erasure-log.json');
    // 各记忆层文件路径（与 memory-bank.js 约定一致）
    this.layerPaths = {
      ephemeral: path.join(this.dataDir, 'memory', 'ephemeral.json'),
      learned: path.join(this.dataDir, 'memory', 'learned.json'),
      core: path.join(this.dataDir, 'memory', 'core.json')
    };
  }

  // 读取某层（不存在返回空结构）
  _readLayer(name) {
    const p = this.layerPaths[name];
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { /* 损坏则视为空 */ }
    return name === 'ephemeral' ? [] : (name === 'learned' ? [] : {});
  }

  _writeLayer(name, data) {
    const p = this.layerPaths[name];
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(data, null, 2));
      return true;
    } catch (e) { return false; }
  }

  _log(entry) {
    let log = [];
    try { if (fs.existsSync(this.logPath)) log = JSON.parse(fs.readFileSync(this.logPath, 'utf8')); }
    catch (e) { console.warn(`[DataEraser] 读取旧审计日志失败(将新建): ${e.message}`); }
    log.push({ ...entry, timestamp: Date.now() });
    if (log.length > 200) log = log.slice(-200);
    try { fs.writeFileSync(this.logPath, JSON.stringify(log, null, 2)); }
    catch (e) { console.warn(`[DataEraser] 审计日志写入失败，擦除追溯链断裂: ${e.message}`); }
  }

  /**
   * 擦除某 scope 的临时记忆（EPHEMERAL 层）
   * @param {string} scope - 如 'user:ou_xxx' 或 'session:abc' 或 '*'（全部）
   * @returns {object} { erased, scope, before, after }
   */
  eraseEphemeral(scope = '*') {
    const layer = this._readLayer('ephemeral');
    const before = Array.isArray(layer) ? layer.length : 0;
    let after = before;
    if (scope === '*') {
      after = 0;
      this._writeLayer('ephemeral', []);
    } else {
      const filtered = layer.filter(m => {
        const s = m.scope || m.session || '';
        return s !== scope;
      });
      after = filtered.length;
      this._writeLayer('ephemeral', filtered);
    }
    const erased = before - after;
    this._log({ action: 'eraseEphemeral', scope, erased });
    return { erased, scope, before, after };
  }

  /**
   * 按 tag 擦除 LEARNED 层记忆
   * @param {string} tag
   * @returns {object} { erased, tag, before, after }
   */
  eraseByTag(tag) {
    const layer = this._readLayer('learned');
    const before = Array.isArray(layer) ? layer.length : 0;
    const filtered = layer.filter(m => {
      const tags = m.tags || (m.tag ? [m.tag] : []);
      return !tags.includes(tag);
    });
    const after = filtered.length;
    this._writeLayer('learned', filtered);
    const erased = before - after;
    this._log({ action: 'eraseByTag', tag, erased });
    return { erased, tag, before, after };
  }

  /**
   * 擦除整个会话的临时状态
   */
  eraseSession(sessionId) {
    return this.eraseEphemeral(`session:${sessionId}`);
  }

  /**
   * 返回擦除统计（不删任何东西）
   */
  stats() {
    const ep = this._readLayer('ephemeral');
    const ln = this._readLayer('learned');
    return {
      ephemeralCount: Array.isArray(ep) ? ep.length : 0,
      learnedCount: Array.isArray(ln) ? ln.length : 0,
      coreProtected: true,
      note: 'CORE 层不可擦除（身份/规则保护）'
    };
  }
}

module.exports = { DataEraser };
