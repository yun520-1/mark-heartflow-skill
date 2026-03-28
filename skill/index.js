/**
 * HeartFlow 情感伴侣 Skill - OpenClaw 集成入口
 * 
 * 提供标准化的 Skill 接口，支持 OpenClaw 调用
 */

const path = require('path');

// 导入核心模块
const ChatManager = require('../src/chat/manager');
const { EmotionTypes } = require('../src/emotion/states');

// 单例模式 - 确保全局只有一个情感引擎实例
let instance = null;

/**
 * 初始化 Skill
 */
async function init(options = {}) {
  if (instance) {
    return instance;
  }
  
  const dataDir = options.dataDir || path.join(__dirname, '../data');
  
  instance = {
    chatManager: new ChatManager({ 
      dataDir,
      userId: options.userId || 'default_user',
      learningOptions: options.learningOptions
    }),
    options,
    initialized: true,
    createdAt: new Date().toISOString()
  };
  
  return instance;
}

/**
 * 处理对话消息
 * @param {string} userInput - 用户输入
 * @returns {Promise<Object>} - 对话结果
 */
async function chat(userInput) {
  if (!instance) {
    await init();
  }
  
  const result = await instance.chatManager.processMessage(userInput);
  
  return {
    // 用户可见的响应
    response: result.response.text,
    
    // 情感状态
    emotion: {
      name: result.response.emotion,
      intensity: result.response.intensity,
      energy: result.internalState.energyLevel
    },
    
    // V2 新增：用户画像
    userProfile: result.userProfile,
    
    // V2 新增：内部状态（包含学习效果）
    internalState: result.internalState,
    
    // 完整报告
    report: result.report,
    
    // 记忆 ID
    memoryId: result.memoryId,
    
    // 时间戳
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取当前情感状态
 * @returns {Object} - 情感状态
 */
function getState() {
  if (!instance) {
    return {
      emotion: EmotionTypes.CALM,
      intensity: '轻微',
      energy: 100,
      initialized: false
    };
  }
  
  const state = instance.chatManager.getCurrentState();
  
  return {
    emotion: state.emotion,
    intensity: state.intensityLabel,
    energy: state.energyLevel,
    totalInteractions: state.totalInteractions,
    sessionId: state.sessionId,
    continuousInteractionMinutes: state.continuousInteractionMinutes,
    initialized: true
  };
}

/**
 * 获取情感历史
 * @param {number} limit - 返回数量限制
 * @returns {Array} - 历史记录
 */
function getHistory(limit = 10) {
  if (!instance) {
    return [];
  }
  
  return instance.chatManager.getHistory(limit).map(h => ({
    interactionId: h.interactionId,
    timestamp: h.timestamp,
    before: { emotion: h.before.emotion, intensity: h.before.intensityLabel },
    after: { emotion: h.after.emotion, intensity: h.after.intensityLabel },
    userInput: h.userInput,
    triggers: h.triggerAnalysis.triggers
  }));
}

/**
 * 获取情感统计
 * @returns {Object} - 统计数据
 */
function getStats() {
  if (!instance) {
    return { totalInteractions: 0 };
  }
  
  const chatStats = instance.chatManager.getStats();
  const learnerStats = instance.chatManager.emotionEngine.learner.getStats();
  const profileSummary = instance.chatManager.userProfile.getSummary();
  
  return {
    ...chatStats,
    learningStats: learnerStats,
    userProfile: profileSummary
  };
}

/**
 * 生成情感分析报告
 * @param {number} interactionIndex - 交互索引（-1 表示最新）
 * @returns {Object} - 分析报告
 */
function getReport(interactionIndex = -1) {
  if (!instance) {
    return null;
  }
  
  const history = instance.chatManager.getHistory(20);
  if (history.length === 0) {
    return null;
  }
  
  const target = history[interactionIndex < 0 ? history.length + interactionIndex : interactionIndex];
  if (!target) {
    return null;
  }
  
  return {
    interactionId: target.interactionId,
    timestamp: target.timestamp,
    before: {
      emotion: target.before.emotion,
      intensity: target.before.intensity,
      intensityLabel: target.before.intensityLabel
    },
    after: {
      emotion: target.after.emotion,
      intensity: target.after.intensity,
      intensityLabel: target.after.intensityLabel
    },
    trigger: {
      userInput: target.userInput,
      triggers: target.triggerAnalysis.triggers,
      keywords: target.triggerAnalysis.foundKeywords.map(k => k.keyword)
    },
    transition: target.transition,
    energyLevel: target.energyLevel
  };
}

/**
 * 休息恢复能量
 * @param {number} minutes - 休息时长（分钟）
 * @returns {Object} - 休息结果
 */
function rest(minutes = 10) {
  if (!instance) {
    return { rested: false, error: '未初始化' };
  }
  
  return instance.chatManager.rest(minutes);
}

/**
 * 重置情感状态
 * @returns {Object} - 重置结果
 */
function reset() {
  if (!instance) {
    return { reset: false, error: '未初始化' };
  }
  
  instance.chatManager.reset();
  return {
    reset: true,
    newSessionId: instance.chatManager.sessionInfo.id,
    timestamp: new Date().toISOString()
  };
}

/**
 * 导出会话数据
 * @returns {Object} - 完整会话数据
 */
function exportSession() {
  if (!instance) {
    return null;
  }
  
  return instance.chatManager.exportSession();
}

/**
 * 结束当前会话
 * @returns {Object} - 结束结果
 */
function endSession() {
  if (!instance) {
    return { ended: false, error: '未初始化' };
  }
  
  instance.chatManager.endSession();
  return {
    ended: true,
    sessionId: instance.chatManager.sessionInfo.id,
    endTime: new Date().toISOString()
  };
}

// 导出标准接口
module.exports = {
  // 初始化
  init,
  
  // 核心功能
  chat,
  getState,
  getHistory,
  getStats,
  getReport,
  
  // 状态管理
  rest,
  reset,
  endSession,
  
  // 数据导出
  exportSession,
  
  // 情感类型常量
  EmotionTypes,
  
  // 版本信息
  version: '1.0.0',
  name: 'heartflow-skill'
};
