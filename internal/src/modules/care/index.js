/**
 * HeartFlow Care Module | 关怀模块
 * 
 * 主动用户关怀系统 - 疲劳检测、昼夜节律、干预策略、提醒调度
 * Proactive User Care System - Fatigue Detection, Circadian Rhythm, Intervention, Reminders
 * 
 * @version 6.0.3
 * @author 小虫子 · 严谨专业版
 * @module care
 */

// ============================================================================
// 模块导入 | Module Imports
// ============================================================================

const fatigueDetector = require('./fatigue-detector');
const circadianEngine = require('./circadian-engine');
const interventionGen = require('./intervention-gen');
const reminderScheduler = require('./reminder-scheduler');

// ============================================================================
// 关怀模块主类 | Care Module Main Class
// ============================================================================

class CareModule {
  constructor(options = {}) {
    this.options = {
      dataDir: options.dataDir || './data/care',
      enabled: options.enabled !== false,
      autoStart: options.autoStart !== false,
      ...options
    };
    
    // 初始化子模块
    this.fatigueDetector = fatigueDetector;
    this.circadianEngine = circadianEngine;
    this.interventionGen = interventionGen;
    this.scheduler = null;
    
    // 状态
    this.lastCheck = null;
    this.lastIntervention = null;
    this.sessionStart = Date.now();
    
    // 如果自动启动，初始化调度器
    if (this.options.autoStart) {
      this.start();
    }
  }
  
  // ============================================================================
  // 生命周期 | Lifecycle
  // ============================================================================
  
  /**
   * 启动关怀模块
   * Start care module
   */
  start() {
    if (!this.options.enabled) {
      console.log('[关怀模块] 已禁用，跳过启动');
      return;
    }
    
    // 创建提醒调度器
    this.scheduler = reminderScheduler.createCareScheduler({
      dataDir: this.options.dataDir,
      disableDefaultReminders: false
    });
    
    // 启动疲劳检查定时任务
    this.scheduler.scheduleRecurring('fatigue-check', {
      interval: 30 * 60 * 1000,  // 每 30 分钟
      message: '关怀检查：评估用户疲劳状态',
      type: 'fatigue-check',
      priority: 'high',
      callback: () => this.performFatigueCheck()
    });
    
    console.log('[关怀模块] 已启动');
  }
  
  /**
   * 停止关怀模块
   * Stop care module
   */
  stop() {
    if (this.scheduler) {
      this.scheduler.destroy();
      this.scheduler = null;
    }
    console.log('[关怀模块] 已停止');
  }
  
  // ============================================================================
  // 核心功能 | Core Functions
  // ============================================================================
  
  /**
   * 执行疲劳检查
   * Perform fatigue check
   * 
   * @param {Object} context - 用户上下文
   * @returns {Object} 检查结果和干预建议
   */
  performFatigueCheck(context = {}) {
    const now = Date.now();
    this.lastCheck = now;
    
    // 1. 获取当前时间分区
    const hour = new Date().getHours();
    const circadianZone = this.circadianEngine.getCurrentZone(hour);
    
    // 2. 计算疲劳指数
    const fatigueResult = this.fatigueDetector.calculateFatigueIndex({
      ...context,
      timestamp: now,
      sessionStart: this.sessionStart
    });
    
    // 3. 生成干预策略
    const intervention = this.interventionGen.generateIntervention({
      ...context,
      fatigueIndex: fatigueResult.index,
      fatigueType: fatigueResult.type,
      circadianZone: circadianZone.key,
      hour
    });
    
    // 4. 如果需要干预，执行
    if (intervention.type !== 'NONE') {
      this.lastIntervention = {
        ...intervention,
        executedAt: now
      };
      
      // 记录到历史
      this.interventionGen.recordIntervention(intervention, this.options.dataDir);
      
      // 调度后续行动
      if (intervention.followUp && intervention.followUp.delay > 0) {
        this.scheduler.scheduleOneTime(`followup-${now}`, {
          delay: intervention.followUp.delay,
          message: intervention.followUp.message,
          type: 'followup',
          priority: intervention.urgency.toLowerCase()
        });
      }
    }
    
    return {
      timestamp: now,
      fatigue: fatigueResult,
      circadianZone,
      intervention,
      requiresAction: intervention.type !== 'NONE'
    };
  }
  
  /**
   * 获取关怀状态报告
   * Get care status report
   * 
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    const hour = new Date().getHours();
    const circadianZone = this.circadianEngine.getCurrentZone(hour);
    const stats = this.scheduler ? this.scheduler.getStats() : {};
    
    return {
      enabled: this.options.enabled,
      sessionStart: this.sessionStart,
      sessionDuration: Date.now() - this.sessionStart,
      lastCheck: this.lastCheck,
      lastIntervention: this.lastIntervention,
      circadianZone: {
        key: circadianZone.key,
        name: circadianZone.name,
        style: circadianZone.style
      },
      scheduler: {
        pendingReminders: stats.totalPending || 0,
        activeReminders: stats.totalActive || 0,
        last24Hours: stats.last24Hours || {}
      }
    };
  }
  
  /**
   * 评估任务适合性
   * Evaluate task suitability for current time
   * 
   * @param {string} taskType - 任务类型
   * @returns {Object} 评估结果
   */
  evaluateTaskSuitability(taskType) {
    const hour = new Date().getHours();
    const circadianZone = this.circadianEngine.getCurrentZone(hour);
    
    return this.circadianEngine.evaluateTaskSuitability(taskType, circadianZone.key);
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
    if (this.scheduler) {
      this.scheduler.updatePreferences(preferences);
    }
    console.log('[关怀模块] 用户偏好已更新');
  }
  
  /**
   * 禁用特定提醒类型
   * Disable specific reminder type
   * 
   * @param {string} type - 提醒类型
   */
  disableReminder(type) {
    const prefs = this.scheduler?.userPreferences || {};
    const disabled = prefs.disabledReminders || [];
    if (!disabled.includes(type)) {
      disabled.push(type);
      this.updatePreferences({ disabledReminders: disabled });
    }
  }
  
  /**
   * 启用特定提醒类型
   * Enable specific reminder type
   * 
   * @param {string} type - 提醒类型
   */
  enableReminder(type) {
    const prefs = this.scheduler?.userPreferences || {};
    const disabled = prefs.disabledReminders || [];
    const index = disabled.indexOf(type);
    if (index > -1) {
      disabled.splice(index, 1);
      this.updatePreferences({ disabledReminders: disabled });
    }
  }
}

// ============================================================================
// 快捷函数 | Convenience Functions
// ============================================================================

/**
 * 快速评估当前疲劳状态
 * Quick evaluate current fatigue state
 * 
 * @param {Object} context - 上下文
 * @returns {Object} 评估结果
 */
function quickFatigueCheck(context = {}) {
  const module = new CareModule({ autoStart: false });
  return module.performFatigueCheck(context);
}

/**
 * 获取当前时间分区建议
 * Get current zone recommendations
 * 
 * @returns {Object} 建议
 */
function getCurrentRecommendations() {
  const hour = new Date().getHours();
  const zone = circadianEngine.getCurrentZone(hour);
  const style = circadianEngine.getInteractionStyle(zone.key);
  
  return {
    zone: zone.name,
    suggestions: zone.suggestions,
    avoid: zone.forbiddenActions,
    style: {
      responseLength: style.responseLength,
      tone: style.tone
    },
    efficiency: circadianEngine.getEfficiencyEstimate(zone.key, 'work')
  };
}

/**
 * 生成关怀消息
 * Generate care message for current state
 * 
 * @param {Object} context - 上下文
 * @returns {string} 关怀消息
 */
function generateCareMessage(context = {}) {
  const module = new CareModule({ autoStart: false });
  const result = module.performFatigueCheck(context);
  
  if (result.requiresAction) {
    return result.intervention.message;
  }
  
  // 无需干预时，返回时间感知问候
  const hour = new Date().getHours();
  return circadianEngine.generateTimeAwareGreeting(hour, result.circadianZone.key);
}

// ============================================================================
// 导出 | Exports
// ============================================================================

module.exports = {
  // 主类 | Main Class
  CareModule,
  
  // 子模块 | Sub-modules
  fatigueDetector,
  circadianEngine,
  interventionGen,
  reminderScheduler,
  
  // 快捷函数 | Convenience Functions
  quickFatigueCheck,
  getCurrentRecommendations,
  generateCareMessage,
  
  // 配置 | Configuration
  CONFIG: {
    fatigue: fatigueDetector.FATIGUE_CONFIG,
    circadian: circadianEngine.CIRCADIAN_CONFIG,
    scheduler: reminderScheduler.SCHEDULER_CONFIG,
    interventions: interventionGen.INTERVENTION_TEMPLATES
  },
  
  // 版本 | Version
  VERSION: '6.0.3'
};

// ============================================================================
// 命令行测试 | CLI Test
// ============================================================================

if (require.main === module) {
  console.log('HeartFlow Care Module v6.0.3');
  console.log('=============================\n');
  
  // 测试快速疲劳检查
  console.log('测试：快速疲劳检查');
  const fatigueResult = quickFatigueCheck({
    sessionStart: Date.now() - 3 * 60 * 60 * 1000,
    messages: [
      { content: '有点累了' }
    ]
  });
  console.log(JSON.stringify(fatigueResult, null, 2));
  
  console.log('\n---\n');
  
  // 测试当前建议
  console.log('测试：当前时间分区建议');
  const recommendations = getCurrentRecommendations();
  console.log(JSON.stringify(recommendations, null, 2));
  
  console.log('\n---\n');
  
  // 测试关怀消息生成
  console.log('测试：关怀消息生成');
  const message = generateCareMessage({
    sessionStart: Date.now() - 4 * 60 * 60 * 1000
  });
  console.log(message);
}
