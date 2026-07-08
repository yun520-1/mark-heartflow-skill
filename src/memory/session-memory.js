/**
 * 会话记忆 (Session Memory) v1.0.0
 *
 * 跨会话持久化状态
 */

const fs = require('fs');
const path = require('path');

class SessionMemory {
  constructor(options = {}) {
    // 路径安全校验
    const inputPath = options.storagePath || path.join(__dirname, '../../data/sessions');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[SessionMemory] Invalid storage path');
    }
    this.storagePath = resolvedPath;
    this.currentSessionId = null;
    this.sessionState = {};
    this.autoSave = options.autoSave !== false;
    this._ensureStoragePath();
  }

  /**
   * 确保存储目录存在
   */
  _ensureStoragePath() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 开始新会话
   */
  startSession(sessionId, initialState = {}) {
    this.currentSessionId = sessionId;
    this.sessionState = {
      sessionId,
      startTime: Date.now(),
      lastActive: Date.now(),
      ...initialState
    };
    return this.sessionState;
  }

  /**
   * 恢复会话
   */
  resumeSession(sessionId) {
    const filePath = this._getSessionFile(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.currentSessionId = sessionId;
      this.sessionState = data;
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取会话文件路径
   */
  _getSessionFile(sessionId) {
    // [AUDIT-FIX] 消毒 sessionId，防止路径遍历（../ 等）
    const safeId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  /**
   * 保存当前会话
   */
  save() {
    if (!this.currentSessionId) return false;

    this.sessionState.lastActive = Date.now();
    const filePath = this._getSessionFile(this.currentSessionId);

    try {
      fs.writeFileSync(filePath, JSON.stringify(this.sessionState, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 设置值
   */
  set(key, value) {
    this.sessionState[key] = value;
    this.sessionState.lastActive = Date.now();
    if (this.autoSave) this.save();
  }

  /**
   * 获取值
   */
  get(key, defaultValue = null) {
    return this.sessionState[key] ?? defaultValue;
  }

  /**
   * 删除值
   */
  delete(key) {
    delete this.sessionState[key];
    if (this.autoSave) this.save();
  }

  /**
   * 获取完整状态
   */
  getState() {
    return { ...this.sessionState };
  }

  /**
   * 更新状态
   */
  updateState(updates) {
    this.sessionState = {
      ...this.sessionState,
      ...updates,
      lastActive: Date.now()
    };
    if (this.autoSave) this.save();
  }

  /**
   * 获取所有会话摘要
   */
  getAllSessions() {
    const sessions = [];

    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const sessionId = file.replace('.json', '');
        const filePath = path.join(this.storagePath, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          sessions.push({
            sessionId: data.sessionId,
            startTime: data.startTime,
            lastActive: data.lastActive,
            summary: data.summary || ''
          });
        } catch (e) {
          // 跳过无效文件
        }
      }
    } catch (error) {
      // 目录不存在
    }

    return sessions.sort((a, b) => b.lastActive - a.lastActive);
  }

  /**
   * 获取最近的会话
   */
  getRecentSessions(limit = 10) {
    return this.getAllSessions().slice(0, limit);
  }

  /**
   * 删除旧会话
   */
  deleteOldSessions(maxAgeDays = 30) {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(this.storagePath, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (data.lastActive < cutoff) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        } catch (e) {
          // 跳过无效文件
        }
      }
    } catch (error) {
      // 目录不存在
    }

    return deleted;
  }

  /**
   * 结束当前会话
   */
  endSession() {
    if (this.currentSessionId) {
      this.sessionState.endTime = Date.now();
      this.save();
    }
    this.currentSessionId = null;
    this.sessionState = {};
  }
}

module.exports = { SessionMemory };
