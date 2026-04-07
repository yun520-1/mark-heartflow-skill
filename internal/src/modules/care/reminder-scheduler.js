/**
 * HeartFlow Reminder Scheduler | 提醒调度器
 * 
 * 管理和调度所有关怀相关的提醒
 * Manage and schedule all care-related reminders
 * 
 * @version 6.0.3
 * @author 小虫子 · 严谨专业版
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置 | Configuration
// ============================================================================

const SCHEDULER_CONFIG = {
  // 提醒类型配置 | Reminder Type Configuration
  reminderTypes: {
    // 健康提醒
    HEALTH: {
      hydration: { interval: 60 * 60 * 1000, priority: 'low' },      // 每小时喝水
      stretch: { interval: 90 * 60 * 1000, priority: 'medium' },     // 每 90 分钟活动
      eyeRest: { interval: 30 * 60 * 1000, priority: 'low' },        // 每 30 分钟眼睛休息
      meal: { interval: 24 * 60 * 60 * 1000, priority: 'high' }      // 每日用餐
    },
    
    // 疲劳干预提醒
    FATIGUE: {
      check: { interval: 30 * 60 * 1000, priority: 'high' },         // 每 30 分钟检查
      followUp: { interval: 15 * 60 * 1000, priority: 'medium' }     // 15 分钟后跟进
    },
    
    // 昼夜节律提醒
    CIRCADIAN: {
      zoneChange: { trigger: 'onZoneChange', priority: 'low' },      // 时段切换
      bedtime: { time: '21:00', priority: 'medium' },                // 睡前准备
      wakeUp: { time: '07:00', priority: 'medium' }                  // 起床问候
    }
  },
  
  // 调度器配置 | Scheduler Configuration
  scheduler: {
    maxPendingReminders: 100,
    reminderTimeout: 5 * 60 * 1000,  // 5 分钟超时
    retryAttempts: 3,
    logRetention: 7  // 保留 7 天日志
  }
};

// ============================================================================
// 提醒调度器类 | Reminder Scheduler Class
// ============================================================================

class ReminderScheduler {
  constructor(options = {}) {
    this.dataDir = options.dataDir || './data/care';
    this.pendingReminders = new Map();
    this.activeTimers = new Map();
    this.reminderLog = [];
    this.userPreferences = options.userPreferences || {};
    
    // 确保数据目录存在
    this.ensureDataDir();
    
    // 加载持久化状态
    this.loadState();
  }
  
  // ============================================================================
  // 初始化 | Initialization
  // ============================================================================
  
  /**
   * 确保数据目录存在
   * Ensure data directory exists
   */
  ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (e) {
      console.error('创建数据目录失败:', e.message);
    }
  }
  
  /**
   * 加载持久化状态
   * Load persisted state
   */
  loadState() {
    const statePath = path.join(this.dataDir, 'scheduler-state.json');
    
    try {
      if (fs.existsSync(statePath)) {
        const data = fs.readFileSync(statePath, 'utf8');
        const state = JSON.parse(data);
        this.reminderLog = state.reminderLog || [];
        this.userPreferences = state.userPreferences || {};
      }
    } catch (e) {
      console.error('加载状态失败:', e.message);
    }
  }
  
  /**
   * 保存持久化状态
   * Save persisted state
   */
  saveState() {
    const statePath = path.join(this.dataDir, 'scheduler-state.json');
    
    const state = {
      reminderLog: this.reminderLog.slice(-1000),  // 保留最近 1000 条
      userPreferences: this.userPreferences,
      lastSaved: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error('保存状态失败:', e.message);
    }
  }
  
  // ============================================================================
  // 提醒调度 | Reminder Scheduling
  // ============================================================================
  
  /**
   * 调度一次性提醒
   * Schedule a one-time reminder
   * 
   * @param {string} id - 提醒 ID
   * @param {Object} reminder - 提醒配置
   * @returns {boolean} 是否成功调度
   */
  scheduleOneTime(id, reminder) {
    const { delay, message, type, priority, callback } = reminder;
    
    // 检查是否超过最大待处理提醒数
    if (this.pendingReminders.size >= SCHEDULER_CONFIG.scheduler.maxPendingReminders) {
      console.warn('待处理提醒过多，跳过调度');
      return false;
    }
    
    // 清除已存在的同 ID 提醒
    this.cancel(id);
    
    // 创建定时器
    const timerId = setTimeout(() => {
      this.executeReminder(id, reminder);
      if (callback) callback(reminder);
    }, delay);
    
    // 存储提醒
    this.pendingReminders.set(id, {
      id,
      type,
      priority,
      message,
      scheduledAt: Date.now(),
      executeAt: Date.now() + delay,
      timerId,
      status: 'pending'
    });
    
    this.activeTimers.set(id, timerId);
    
    console.log(`[调度器] 已调度一次性提醒: ${id} (${delay}ms 后执行)`);
    return true;
  }
  
  /**
   * 调度周期性提醒
   * Schedule a recurring reminder
   * 
   * @param {string} id - 提醒 ID
   * @param {Object} reminder - 提醒配置
   * @returns {boolean} 是否成功调度
   */
  scheduleRecurring(id, reminder) {
    const { interval, message, type, priority, callback } = reminder;
    
    // 清除已存在的同 ID 提醒
    this.cancel(id);
    
    // 创建间隔定时器
    const timerId = setInterval(() => {
      this.executeReminder(id, reminder);
      if (callback) callback(reminder);
    }, interval);
    
    // 存储提醒
    this.pendingReminders.set(id, {
      id,
      type,
      priority,
      message,
      interval,
      scheduledAt: Date.now(),
      timerId,
      status: 'active',
      recurring: true
    });
    
    this.activeTimers.set(id, timerId);
    
    console.log(`[调度器] 已调度周期性提醒：${id} (每${interval}ms)`);
    return true;
  }
  
  /**
   * 执行提醒
   * Execute a reminder
   * 
   * @param {string} id - 提醒 ID
   * @param {Object} reminder - 提醒配置
   */
  executeReminder(id, reminder) {
    const { message, type, priority } = reminder;
    
    // 记录执行日志
    this.logReminder({
      id,
      type,
      priority,
      message,
      executedAt: Date.now(),
      status: 'executed'
    });
    
    // 输出提醒（实际应用中会发送到用户）
    console.log(`[提醒] ${type} (${priority}): ${message}`);
    
    // 对于非周期性提醒，执行后移除
    if (!reminder.recurring) {
      this.pendingReminders.delete(id);
      this.activeTimers.delete(id);
    }
    
    // 定期保存状态
    this.saveState();
  }
  
  /**
   * 取消提醒
   * Cancel a reminder
   * 
   * @param {string} id - 提醒 ID
   * @returns {boolean} 是否成功取消
   */
  cancel(id) {
    const reminder = this.pendingReminders.get(id);
    if (!reminder) {
      return false;
    }
    
    // 清除定时器
    if (reminder.recurring) {
      clearInterval(reminder.timerId);
    } else {
      clearTimeout(reminder.timerId);
    }
    
    // 从待处理列表中移除
    this.pendingReminders.delete(id);
    this.activeTimers.delete(id);
    
    // 记录取消日志
    this.logReminder({
      id: reminder.id,
      type: reminder.type,
      executedAt: Date.now(),
      status: 'cancelled'
    });
    
    console.log(`[调度器] 已取消提醒：${id}`);
    return true;
  }
  
  /**
   * 取消所有提醒
   * Cancel all reminders
   */
  cancelAll() {
    for (const [id, reminder] of this.pendingReminders.entries()) {
      this.cancel(id);
    }
    console.log('[调度器] 已取消所有提醒');
  }
  
  // ============================================================================
  // 日志管理 | Log Management
  // ============================================================================
  
  /**
   * 记录提醒日志
   * Log reminder execution
   * 
   * @param {Object} entry - 日志条目
   */
  logReminder(entry) {
    this.reminderLog.push({
      ...entry,
      loggedAt: new Date().toISOString()
    });
    
    // 清理旧日志
    const cutoffDate = Date.now() - SCHEDULER_CONFIG.scheduler.logRetention * 24 * 60 * 60 * 1000;
    this.reminderLog = this.reminderLog.filter(
      log => new Date(log.loggedAt).getTime() > cutoffDate
    );
  }
  
  /**
   * 获取提醒历史
   * Get reminder history
   * 
   * @param {number} hours - 最近多少小时
   * @returns {Array} 历史记录
   */
  getHistory(hours = 24) {
    const cutoffDate = Date.now() - hours * 60 * 60 * 1000;
    return this.reminderLog.filter(
      log => new Date(log.loggedAt).getTime() > cutoffDate
    );
  }
  
  /**
   * 获取统计信息
   * Get statistics
   * 
   * @returns {Object} 统计数据
   */
  getStats() {
    const now = Date.now();
    const last24Hours = this.reminderLog.filter(
      log => now - new Date(log.loggedAt).getTime() < 24 * 60 * 60 * 1000
    );
    
    const stats = {
      totalPending: this.pendingReminders.size,
      totalActive: Array.from(this.pendingReminders.values())
        .filter(r => r.status === 'active').length,
      last24Hours: {
        total: last24Hours.length,
        executed: last24Hours.filter(l => l.status === 'executed').length,
        cancelled: last24Hours.filter(l => l.status === 'cancelled').length,
        byType: {},
        byPriority: {}
      }
    };
    
    // 按类型统计
    for (const log of last24Hours) {
      if (log.status === 'executed') {
        stats.last24Hours.byType[log.type] = (stats.last24Hours.byType[log.type] || 0) + 1;
        stats.last24Hours.byPriority[log.priority] = (stats.last24Hours.byPriority[log.priority] || 0) + 1;
      }
    }
    
    return stats;
  }
  
  // ============================================================================
  // 用户偏好 | User Preferences
  // ============================================================================
  
  /**
   * 更新用户偏好
   * Update user preferences
   * 
   * @param {Object} preferences - 偏好设置
   */
  updatePreferences(preferences) {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences
    };
    this.saveState();
    console.log('[调度器] 用户偏好已更新');
  }
  
  /**
   * 检查提醒是否被用户禁用
   * Check if reminder type is disabled by user
   * 
   * @param {string} type - 提醒类型
   * @returns {boolean} 是否禁用
   */
  isDisabled(type) {
    const disabledTypes = this.userPreferences.disabledReminders || [];
    return disabledTypes.includes(type);
  }
  
  // ============================================================================
  // 状态管理 | State Management
  // ============================================================================
  
  /**
   * 获取所有待处理提醒
   * Get all pending reminders
   * 
   * @returns {Array} 待处理提醒列表
   */
  getPendingReminders() {
    return Array.from(this.pendingReminders.values()).map(r => ({
      id: r.id,
      type: r.type,
      priority: r.priority,
      status: r.status,
      scheduledAt: r.scheduledAt,
      executeAt: r.executeAt,
      recurring: r.recurring || false
    }));
  }
  
  /**
   * 销毁调度器
   * Destroy scheduler and clear all timers
   */
  destroy() {
    this.cancelAll();
    this.saveState();
    console.log('[调度器] 已销毁');
  }
}

// ============================================================================
// 快捷函数 | Convenience Functions
// ============================================================================

/**
 * 创建关怀提醒调度器
 * Create care reminder scheduler with default configurations
 * 
 * @param {Object} options - 配置选项
 * @returns {ReminderScheduler} 调度器实例
 */
function createCareScheduler(options = {}) {
  const scheduler = new ReminderScheduler(options);
  
  // 默认启用健康提醒
  if (!options.disableDefaultReminders) {
    // 喝水提醒
    scheduler.scheduleRecurring('hydration', {
      interval: SCHEDULER_CONFIG.reminderTypes.HEALTH.hydration.interval,
      message: '喝杯水吧 💧',
      type: 'hydration',
      priority: 'low'
    });
    
    // 活动提醒
    scheduler.scheduleRecurring('stretch', {
      interval: SCHEDULER_CONFIG.reminderTypes.HEALTH.stretch.interval,
      message: '起来活动一下吧 🚶',
      type: 'stretch',
      priority: 'medium'
    });
    
    // 眼睛休息提醒
    scheduler.scheduleRecurring('eyeRest', {
      interval: SCHEDULER_CONFIG.reminderTypes.HEALTH.eyeRest.interval,
      message: '看看远处，让眼睛休息一下 👀',
      type: 'eyeRest',
      priority: 'low'
    });
  }
  
  return scheduler;
}

// ============================================================================
// 导出 | Exports
// ============================================================================

module.exports = {
  ReminderScheduler,
  createCareScheduler,
  SCHEDULER_CONFIG
};

// ============================================================================
// 命令行测试 | CLI Test
// ============================================================================

if (require.main === module) {
  console.log('HeartFlow Reminder Scheduler v6.0.3');
  console.log('====================================\n');
  
  // 创建调度器
  const scheduler = createCareScheduler({
    dataDir: './data/care',
    disableDefaultReminders: true
  });
  
  // 测试一次性提醒
  console.log('测试：调度一次性提醒');
  scheduler.scheduleOneTime('test-once', {
    delay: 3000,
    message: '这是一次性测试提醒',
    type: 'test',
    priority: 'low'
  });
  
  // 测试周期性提醒
  console.log('测试：调度周期性提醒');
  scheduler.scheduleRecurring('test-recurring', {
    interval: 10000,
    message: '这是周期性测试提醒',
    type: 'test',
    priority: 'medium'
  });
  
  // 等待并查看状态
  setTimeout(() => {
    console.log('\n当前状态:');
    console.log(JSON.stringify(scheduler.getStats(), null, 2));
    console.log('\n待处理提醒:');
    console.log(JSON.stringify(scheduler.getPendingReminders(), null, 2));
    
    // 清理
    scheduler.destroy();
    console.log('\n测试完成');
  }, 5000);
}
