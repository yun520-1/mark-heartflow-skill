/**
 * HeartFlow Memory Slots Module
 * 
 * 记忆槽(Slot)系统
 * 
 * 功能：
 * 1. 命名记忆槽 - 如"当前任务"、"用户偏好"、"工作上下文"
 * 2. setSlot(name, value, ttl?) - 设置槽值
 * 3. getSlot(name) - 获取槽值
 * 4. clearSlot(name) - 清除槽
 * 5. listSlots() - 列出所有槽
 * 6. 自动过期(TTL)
 * 7. 槽持久化到 data/slots.json
 */

const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('../../utils/atomic-write');
const crypto = require('crypto');

// ============================================================
// 配置
// ============================================================

const SLOTS_CONFIG = {
  dataDir: 'data',           // 数据目录
  slotsFile: 'slots.json',   // 槽数据文件
  autoSave: true,            // 自动保存
  saveDelay: 1000,           // 保存延迟(ms)
  defaultTTL: 0,            // 默认TTL (0=永不过期)
  cleanupInterval: 60000,    // 清理过期槽间隔(ms)
};

// 预定义槽名称
const PRESET_SLOTS = {
  CURRENT_TASK: '当前任务',
  USER_PREFERENCES: '用户偏好',
  WORK_CONTEXT: '工作上下文',
  SESSION_CONTEXT: '会话上下文',
  RECENT_OPERATIONS: '最近操作',
  ERROR_HISTORY: '错误历史',
  CUSTOM_PREFIX: 'custom_',
};

// ============================================================
// Slots 类
// ============================================================

class Slots {
  constructor(options = {}) {
    this.dataDir = options.dataDir || SLOTS_CONFIG.dataDir;
    this.slotsFile = options.slotsFile || SLOTS_CONFIG.slotsFile;
    this.autoSave = options.autoSave !== undefined ? options.autoSave : SLOTS_CONFIG.autoSave;
    this.saveDelay = options.saveDelay || SLOTS_CONFIG.saveDelay;
    this.defaultTTL = options.defaultTTL !== undefined ? options.defaultTTL : SLOTS_CONFIG.defaultTTL;
    this.cleanupInterval = options.cleanupInterval || SLOTS_CONFIG.cleanupInterval;

    // 内存中的槽存储
    this._slots = new Map();

    // 定时器
    this._saveTimer = null;
    this._cleanupTimer = null;
    this._dirty = false; // 是否需要保存

    // 初始化
    this._init();
  }

  // ============================================================
  // 初始化
  // ============================================================

  _init() {
    // 确保数据目录存在
    this._ensureDataDir();

    // 加载持久化的槽
    this._load();

    // 启动清理定时器（仅在 daemon 模式下）
    if (process.env.HEARTFLOW_DAEMON && this.cleanupInterval > 0) {
      this._startCleanupTimer();
    }
  }

  _ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[Slots] Failed to create data directory: ${err.message}`);
    }
  }

  _getFilePath() {
    return path.join(this.dataDir, this.slotsFile);
  }

  // ============================================================
  // 槽操作 API
  // ============================================================

  /**
   * 设置槽值
   * @param {string} name - 槽名称
   * @param {*} value - 槽值（任意类型）
   * @param {number} ttl - 过期时间(ms)，0或不传表示永不过期
   * @returns {object} 设置结果
   */
  setSlot(name, value, ttl = null) {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Invalid slot name' };
    }

    const now = Date.now();
    const expiresAt = ttl !== null && ttl > 0 ? now + ttl : 0;

    const slotData = {
      name,
      value,
      createdAt: this._slots.has(name) ? this._slots.get(name).createdAt : now,
      updatedAt: now,
      expiresAt,
      version: this._slots.has(name) ? this._slots.get(name).version + 1 : 1,
    };

    this._slots.set(name, slotData);
    this._markDirty();

    return {
      success: true,
      name,
      value,
      expiresAt: expiresAt || null,
      ttl: ttl,
    };
  }

  /**
   * 获取槽值
   * @param {string} name - 槽名称
   * @param {boolean} includeExpired - 是否返回已过期的槽（用于调试）
   * @returns {*} 槽值，如果不存在或已过期则返回 null
   */
  getSlot(name, includeExpired = false) {
    if (!name || !this._slots.has(name)) {
      return null;
    }

    const slot = this._slots.get(name);

    // 检查是否过期
    if (!includeExpired && slot.expiresAt > 0 && Date.now() > slot.expiresAt) {
      return null;
    }

    return slot.value;
  }

  /**
   * 获取槽的完整信息
   * @param {string} name - 槽名称
   * @returns {object|null} 槽信息对象
   */
  getSlotInfo(name) {
    if (!name || !this._slots.has(name)) {
      return null;
    }

    const slot = this._slots.get(name);
    const now = Date.now();
    const isExpired = slot.expiresAt > 0 && now > slot.expiresAt;
    const remainingTTL = slot.expiresAt > 0 ? Math.max(0, slot.expiresAt - now) : null;

    return {
      name: slot.name,
      value: slot.value,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      expiresAt: slot.expiresAt || null,
      ttl: remainingTTL,
      isExpired,
      version: slot.version,
    };
  }

  /**
   * 清除槽
   * @param {string} name - 槽名称
   * @returns {boolean} 是否成功清除
   */
  clearSlot(name) {
    if (!name || !this._slots.has(name)) {
      return false;
    }

    this._slots.delete(name);
    this._markDirty();
    return true;
  }

  /**
   * 清除所有槽
   * @returns {number} 清除的槽数量
   */
  clearAllSlots() {
    const count = this._slots.size;
    this._slots.clear();
    this._markDirty();
    return count;
  }

  /**
   * 列出所有槽
   * @param {object} options - 列表选项
   * @param {boolean} options.includeExpired - 是否包含已过期的槽
   * @param {boolean} options.includeValue - 是否包含槽值
   * @param {string} options.prefix - 只返回以此前缀开头的槽
   * @returns {Array} 槽列表
   */
  listSlots(options = {}) {
    const {
      includeExpired = false,
      includeValue = false,
      prefix = null,
    } = options;

    const now = Date.now();
    const result = [];

    for (const [name, slot] of this._slots) {
      // 按前缀过滤
      if (prefix && !name.startsWith(prefix)) {
        continue;
      }

      // 检查过期
      const isExpired = slot.expiresAt > 0 && now > slot.expiresAt;
      if (!includeExpired && isExpired) {
        continue;
      }

      const slotInfo = {
        name,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        expiresAt: slot.expiresAt || null,
        isExpired,
        ttl: slot.expiresAt > 0 ? Math.max(0, slot.expiresAt - now) : null,
        version: slot.version,
      };

      if (includeValue) {
        slotInfo.value = slot.value;
      }

      result.push(slotInfo);
    }

    // 按更新时间排序（最新的在前）
    result.sort((a, b) => b.updatedAt - a.updatedAt);

    return result;
  }

  /**
   * 检查槽是否存在（且未过期）
   * @param {string} name - 槽名称
   * @returns {boolean}
   */
  hasSlot(name) {
    return this.getSlot(name) !== null;
  }

  /**
   * 获取槽的数量
   * @param {boolean} includeExpired - 是否包含已过期的槽
   * @returns {number}
   */
  getSlotCount(includeExpired = false) {
    if (includeExpired) {
      return this._slots.size;
    }
    return this.listSlots({ includeExpired: false }).length;
  }

  // ============================================================
  // 快捷预设槽操作
  // ============================================================

  /**
   * 设置当前任务
   */
  setCurrentTask(task) {
    return this.setSlot(PRESET_SLOTS.CURRENT_TASK, task);
  }

  /**
   * 获取当前任务
   */
  getCurrentTask() {
    return this.getSlot(PRESET_SLOTS.CURRENT_TASK);
  }

  /**
   * 设置用户偏好
   */
  setUserPreferences(prefs) {
    return this.setSlot(PRESET_SLOTS.USER_PREFERENCES, prefs);
  }

  /**
   * 获取用户偏好
   */
  getUserPreferences() {
    return this.getSlot(PRESET_SLOTS.USER_PREFERENCES);
  }

  /**
   * 设置工作上下文
   */
  setWorkContext(context) {
    return this.setSlot(PRESET_SLOTS.WORK_CONTEXT, context);
  }

  /**
   * 获取工作上下文
   */
  getWorkContext() {
    return this.getSlot(PRESET_SLOTS.WORK_CONTEXT);
  }

  // ============================================================
  // 批量操作
  // ============================================================

  /**
   * 批量设置槽
   * @param {object} slots - { slotName: value, ... }
   * @param {number} ttl - 统一TTL
   * @returns {Array} 设置结果列表
   */
  setSlots(slots, ttl = null) {
    const results = [];
    for (const [name, value] of Object.entries(slots)) {
      results.push(this.setSlot(name, value, ttl));
    }
    return results;
  }

  /**
   * 批量获取槽
   * @param {Array<string>} names - 槽名称数组
   * @returns {object} { name: value, ... }
   */
  getSlots(names) {
    const result = {};
    for (const name of names) {
      result[name] = this.getSlot(name);
    }
    return result;
  }

  /**
   * 批量清除槽
   * @param {Array<string>} names - 槽名称数组
   * @returns {number} 实际清除的数量
   */
  clearSlots(names) {
    let count = 0;
    for (const name of names) {
      if (this.clearSlot(name)) count++;
    }
    return count;
  }

  // ============================================================
  // 过期清理
  // ============================================================

  /**
   * 清理所有过期的槽
   * @returns {number} 清理的槽数量
   */
  cleanupExpired() {
    const now = Date.now();
    let count = 0;

    for (const [name, slot] of this._slots) {
      if (slot.expiresAt > 0 && now > slot.expiresAt) {
        this._slots.delete(name);
        count++;
      }
    }

    if (count > 0) {
      this._markDirty();
    }

    return count;
  }

  /**
   * 获取已过期但尚未清理的槽
   * @returns {Array}
   */
  getExpiredSlots() {
    return this.listSlots({ includeExpired: true }).filter(s => s.isExpired);
  }

  _startCleanupTimer() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
    }
    this._cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.cleanupInterval);
  }

  // ============================================================
  // 持久化
  // ============================================================

  /**
   * 保存槽到文件
   * @returns {boolean} 是否成功
   */
  async save() {
    if (!this._dirty && this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }

    try {
      const data = {
        version: 1,
        savedAt: Date.now(),
        slots: Array.from(this._slots.entries()),
      };

      const filePath = this._getFilePath();
      await atomicWrite(filePath, JSON.stringify(data, null, 2));
      
      this._dirty = false;
      return true;
    } catch (err) {
      console.error(`[Slots] Failed to save: ${err.message}`);
      return false;
    }
  }

  /**
   * 从文件加载槽
   * @returns {boolean} 是否成功
   */
  _load() {
    try {
      const filePath = this._getFilePath();
      
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (!data.slots || !Array.isArray(data.slots)) {
        return false;
      }

      // 恢复槽数据
      for (const [name, slot] of data.slots) {
        this._slots.set(name, slot);
      }

      // 清理过期槽
      this.cleanupExpired();

      return true;
    } catch (err) {
      console.error(`[Slots] Failed to load: ${err.message}`);
      return false;
    }
  }

  /**
   * 标记为需要保存
   */
  _markDirty() {
    this._dirty = true;

    if (this.autoSave && this.saveDelay > 0) {
      if (this._saveTimer) {
        clearTimeout(this._saveTimer);
      }
      this._saveTimer = setTimeout(() => {
        this.save();
      }, this.saveDelay);
    }
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 生成唯一ID
   */
  _generateId() {
    return `slot_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * 导出所有槽数据（JSON格式）
   */
  exportData() {
    return {
      version: 1,
      exportedAt: Date.now(),
      slots: this.listSlots({ includeExpired: true, includeValue: true }),
    };
  }

  /**
   * 导入槽数据
   * @param {object} data - 导出的数据
   * @returns {number} 导入的槽数量
   */
  importData(data) {
    if (!data || !data.slots || !Array.isArray(data.slots)) {
      return 0;
    }

    let count = 0;
    for (const slot of data.slots) {
      if (slot.name && slot.value !== undefined) {
        this.setSlot(slot.name, slot.value, slot.expiresAt ? slot.expiresAt - Date.now() : null);
        count++;
      }
    }

    return count;
  }

  /**
   * 销毁实例（清理定时器）
   */
  destroy() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    // 保存最后状态
    if (this._dirty) {
      this.save();
    }
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  Slots,
  PRESET_SLOTS,
  SLOTS_CONFIG,
};

// 静态快捷方法（基于单例）
let _defaultInstance = null;

function getDefaultInstance() {
  if (!_defaultInstance) {
    _defaultInstance = new Slots();
  }
  return _defaultInstance;
}

module.exports.setSlot = (...args) => getDefaultInstance().setSlot(...args);
module.exports.getSlot = (...args) => getDefaultInstance().getSlot(...args);
module.exports.clearSlot = (...args) => getDefaultInstance().clearSlot(...args);
module.exports.listSlots = (...args) => getDefaultInstance().listSlots(...args);
module.exports.hasSlot = (...args) => getDefaultInstance().hasSlot(...args);
module.exports.clearAllSlots = (...args) => getDefaultInstance().clearAllSlots(...args);
module.exports.save = (...args) => getDefaultInstance().save(...args);
module.exports.cleanupExpired = (...args) => getDefaultInstance().cleanupExpired(...args);
