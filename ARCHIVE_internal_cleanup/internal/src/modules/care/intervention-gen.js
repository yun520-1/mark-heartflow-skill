/**
 * HeartFlow Intervention Generator | 干预策略生成器
 * 
 * 根据疲劳指数、昼夜节律和用户上下文生成个性化干预策略
 * Generate personalized intervention strategies
 * 
 * @version 6.0.3
 * @author 小虫子 · 严谨专业版
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 干预模板库 | Intervention Template Library
// ============================================================================

const INTERVENTION_TEMPLATES = {
  // ============================================================================
  // 强制休息干预 | Forced Rest Interventions
  // ============================================================================
  
  FORCED_REST: {
    urgency: 'CRITICAL',
    action: 'STOP_WORK_AND_SLEEP',
    templates: [
      {
        condition: 'hour >= 23 || hour <= 6',
        message: `现在是 {time}，你已经工作很晚了。
请立即停止工作，准备休息。
健康比工作更重要，明天再继续吧。
晚安，好梦。🌙`,
        followUp: '确认用户是否准备休息'
      }
    ]
  },
  
  // ============================================================================
  // 强制休息干预 | Mandatory Break Interventions
  // ============================================================================
  
  MANDATORY_BREAK: {
    urgency: 'HIGH',
    action: 'TAKE_30MIN_BREAK',
    templates: [
      {
        condition: 'fatigueIndex >= 80',
        message: `你非常疲惫，建议立即休息 30 分钟。
连续工作会显著降低效率，休息后你会做得更好。
站起来走走，喝杯水，让大脑放松一下。💪`,
        followUp: '30 分钟后询问状态'
      }
    ]
  },
  
  // ============================================================================
  // 强烈建议干预 | Strong Suggestion Interventions
  // ============================================================================
  
  STRONG_SUGGESTION: {
    urgency: 'MEDIUM',
    action: 'TAKE_15MIN_BREAK',
    templates: [
      {
        condition: 'fatigueIndex >= 60',
        message: `听起来你很累，休息 15 分钟会更好。
要不要喝杯水，活动一下？
短暂的休息能让你重新集中注意力。☕`,
        followUp: '15 分钟后温和提醒'
      }
    ]
  },
  
  // ============================================================================
  // 温和提醒干预 | Gentle Reminder Interventions
  // ============================================================================
  
  GENTLE_REMINDER: {
    urgency: 'LOW',
    action: 'HYDRATE_AND_STRETCH',
    templates: [
      {
        condition: 'fatigueIndex >= 40',
        message: `工作一段时间了，要不要喝杯水？
记得起来活动活动，伸个懒腰。
照顾好自己的身体。💧`,
        followUp: '记录提醒，无需跟进'
      }
    ]
  },
  
  // ============================================================================
  // 健康提醒干预 | Health Reminder Interventions
  // ============================================================================
  
  HEALTH_REMINDER: {
    urgency: 'LOW',
    action: 'HEALTH_CHECK',
    templates: [
      {
        condition: 'mealTime',
        message: `该吃饭了。
再忙也要按时吃饭，身体是革命的本钱。
今天吃了什么好吃的？🍜`,
        followUp: '无'
      },
      {
        condition: 'eyeRest',
        message: `看看远处，让眼睛休息一下。
20-20-20 规则：每 20 分钟，看 20 英尺外的物体 20 秒。
保护视力很重要。👀`,
        followUp: '无'
      }
    ]
  },
  
  // ============================================================================
  // 情绪支持干预 | Emotional Support Interventions
  // ============================================================================
  
  EMOTIONAL_SUPPORT: {
    urgency: 'MEDIUM',
    action: 'EMOTIONAL_CHECK',
    templates: [
      {
        condition: 'negativeLanguage',
        message: `听起来你现在压力很大。
遇到困难是正常的，不要对自己太苛刻。
需要我帮你分析一下问题吗？或者只是想聊聊？💙`,
        followUp: '倾听用户回应'
      },
      {
        condition: 'frustration',
        message: `我能理解你的感受。
有时候事情不会按计划进行，这没关系。
你已经做得很好了，休息一下再回来会更有思路。🌟`,
        followUp: '提供具体帮助'
      }
    ]
  },
  
  // ============================================================================
  // 积极强化干预 | Positive Reinforcement Interventions
  // ============================================================================
  
  POSITIVE_REINFORCEMENT: {
    urgency: 'LOW',
    action: 'ENCOURAGEMENT',
    templates: [
      {
        condition: 'taskCompletion',
        message: `太棒了！你又完成了一个任务。
继续保持这个节奏，你正在取得很好的进展。
为自己感到骄傲吧！🎉`,
        followUp: '询问下一步计划'
      },
      {
        condition: 'goodProgress',
        message: `你的工作效率很高。
按照这个节奏，今天一定能完成目标。
加油！💪`,
        followUp: '无'
      }
    ]
  }
};

// ============================================================================
// 核心算法 | Core Algorithms
// ============================================================================

/**
 * 生成干预策略
 * Generate intervention strategy based on context
 * 
 * @param {Object} context - 完整上下文
 * @returns {Object} 干预策略
 */
function generateIntervention(context = {}) {
  const {
    fatigueIndex = 0,
    fatigueType = 'NONE',
    circadianZone = null,
   情绪 State = 'neutral',
    recentMessages = [],
    hour = new Date().getHours()
  } = context;
  
  // 1. 确定干预类型
  const interventionType = determineInterventionType({
    fatigueIndex,
    fatigueType,
    hour,
    情绪 State,
    recentMessages
  });
  
  // 2. 获取模板
  const template = selectTemplate(interventionType, context);
  
  // 3. 生成消息
  const message = renderMessage(template, context);
  
  // 4. 确定后续行动
  const followUp = determineFollowUp(interventionType, context);
  
  return {
    type: interventionType,
    urgency: INTERVENTION_TEMPLATES[interventionType]?.urgency || 'NONE',
    action: INTERVENTION_TEMPLATES[interventionType]?.action || 'NONE',
    message,
    followUp,
    timestamp: Date.now(),
    metadata: {
      fatigueIndex,
      circadianZone,
      hour
    }
  };
}

/**
 * 确定干预类型
 * Determine intervention type based on multiple factors
 * 
 * @param {Object} factors - 影响因素
 * @returns {string} 干预类型
 */
function determineInterventionType(factors) {
  const { fatigueIndex, fatigueType, hour, 情绪 State, recentMessages } = factors;
  
  // 优先级 1: 深夜强制休息
  if (hour >= 23 || hour <= 6) {
    return 'FORCED_REST';
  }
  
  // 优先级 2: 严重疲劳
  if (fatigueType === 'CRITICAL' || fatigueIndex >= 80) {
    return 'MANDATORY_BREAK';
  }
  
  // 优先级 3: 高度疲劳
  if (fatigueType === 'HIGH' || fatigueIndex >= 60) {
    return 'STRONG_SUGGESTION';
  }
  
  // 优先级 4: 负面情绪检测
  if (detectNegativeEmotion(recentMessages)) {
    return 'EMOTIONAL_SUPPORT';
  }
  
  // 优先级 5: 中度疲劳
  if (fatigueType === 'MEDIUM' || fatigueIndex >= 40) {
    return 'GENTLE_REMINDER';
  }
  
  // 优先级 6: 健康提醒（用餐时间等）
  if (isMealTime(hour)) {
    return 'HEALTH_REMINDER';
  }
  
  // 优先级 7: 积极强化（任务完成）
  if (detectTaskCompletion(recentMessages)) {
    return 'POSITIVE_REINFORCEMENT';
  }
  
  // 默认：无需干预
  return 'NONE';
}

/**
 * 检测负面情绪
 * Detect negative emotions from messages
 * 
 * @param {Array} messages - 消息历史
 * @returns {boolean} 是否检测到负面情绪
 */
function detectNegativeEmotion(messages = []) {
  const negativePatterns = [
    /烦 | 烦躁 | 烦躁/i,
    /焦虑 | 担心 | 不安/i,
    /压力 | 压力大/i,
    /崩溃 | 受不了/i,
    /难过 | 伤心 | 失落/i,
    /生气 | 愤怒 | 气愤/i,
    /绝望 | 没希望/i
  ];
  
  for (const msg of messages.slice(-5)) {
    const text = msg.content || msg.text || '';
    for (const pattern of negativePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 检测任务完成
 * Detect task completion from messages
 * 
 * @param {Array} messages - 消息历史
 * @returns {boolean} 是否检测到任务完成
 */
function detectTaskCompletion(messages = []) {
  const completionPatterns = [
    /完成 | 做完了 | 搞定了/i,
    /好了 | 好了吗/i,
    /成功 | 成功了/i,
    /搞定 | 弄好了/i
  ];
  
  for (const msg of messages.slice(-3)) {
    const text = msg.content || msg.text || '';
    for (const pattern of completionPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 检查是否是用餐时间
 * Check if it's meal time
 * 
 * @param {number} hour - 当前小时
 * @returns {boolean} 是否是用餐时间
 */
function isMealTime(hour) {
  return (hour >= 7 && hour <= 9) ||  // 早餐
         (hour >= 12 && hour <= 13) || // 午餐
         (hour >= 18 && hour <= 19);   // 晚餐
}

/**
 * 选择模板
 * Select appropriate template for intervention type
 * 
 * @param {string} interventionType - 干预类型
 * @param {Object} context - 上下文
 * @returns {Object} 选中的模板
 */
function selectTemplate(interventionType, context) {
  const intervention = INTERVENTION_TEMPLATES[interventionType];
  if (!intervention || !intervention.templates) {
    return null;
  }
  
  // 简单选择第一个模板（可扩展为基于条件选择）
  return intervention.templates[0];
}

/**
 * 渲染消息
 * Render message from template
 * 
 * @param {Object} template - 模板
 * @param {Object} context - 上下文
 * @returns {string} 渲染后的消息
 */
function renderMessage(template, context) {
  if (!template) {
    return '请合理安排工作和休息时间。';
  }
  
  let message = template.message;
  
  // 替换变量
  const hour = context.hour || new Date().getHours();
  const timeLabel = hour >= 23 ? `${hour}:00` : `0${hour}:00`;
  
  message = message.replace('{time}', timeLabel);
  message = message.replace('{fatigueIndex}', context.fatigueIndex || 0);
  
  return message;
}

/**
 * 确定后续行动
 * Determine follow-up action
 * 
 * @param {string} interventionType - 干预类型
 * @param {Object} context - 上下文
 * @returns {Object} 后续行动配置
 */
function determineFollowUp(interventionType, context) {
  const followUpMap = {
    FORCED_REST: {
      type: 'check_sleep',
      delay: 30 * 60 * 1000, // 30 分钟后
      message: '你准备休息了吗？'
    },
    MANDATORY_BREAK: {
      type: 'check_break',
      delay: 30 * 60 * 1000,
      message: '休息得怎么样？准备好继续了吗？'
    },
    STRONG_SUGGESTION: {
      type: 'gentle_reminder',
      delay: 15 * 60 * 1000,
      message: '休息 15 分钟到了，感觉好些了吗？'
    },
    GENTLE_REMINDER: {
      type: 'log_only',
      delay: 0,
      message: null
    },
    EMOTIONAL_SUPPORT: {
      type: 'listen',
      delay: 0,
      message: '我在这里，随时听你说'
    },
    NONE: {
      type: 'none',
      delay: 0,
      message: null
    }
  };
  
  return followUpMap[interventionType] || followUpMap.NONE;
}

// ============================================================================
// 干预历史记录 | Intervention History
// ============================================================================

/**
 * 记录干预历史
 * Record intervention to history
 * 
 * @param {Object} intervention - 干预策略
 * @param {string} dataDir - 数据目录
 */
function recordIntervention(intervention, dataDir) {
  const historyPath = path.join(dataDir, 'intervention-history.json');
  
  let history = [];
  try {
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      history = JSON.parse(data);
    }
  } catch (e) {
    console.error('读取历史记录失败:', e.message);
  }
  
  // 添加新记录
  history.push({
    ...intervention,
    recordedAt: new Date().toISOString()
  });
  
  // 保留最近 1000 条记录
  if (history.length > 1000) {
    history = history.slice(-1000);
  }
  
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
  } catch (e) {
    console.error('保存历史记录失败:', e.message);
  }
}

/**
 * 获取干预统计
 * Get intervention statistics
 * 
 * @param {string} dataDir - 数据目录
 * @param {number} days - 统计天数
 * @returns {Object} 统计数据
 */
function getInterventionStats(dataDir, days = 7) {
  const historyPath = path.join(dataDir, 'intervention-history.json');
  
  try {
    if (!fs.existsSync(historyPath)) {
      return { total: 0, byType: {}, avgFatigueIndex: 0 };
    }
    
    const data = fs.readFileSync(historyPath, 'utf8');
    const history = JSON.parse(data);
    
    // 过滤指定天数的数据
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(
      record => new Date(record.recordedAt).getTime() > cutoffDate
    );
    
    // 统计
    const stats = {
      total: recentHistory.length,
      byType: {},
      avgFatigueIndex: 0,
      byUrgency: {},
      byHour: {}
    };
    
    let fatigueSum = 0;
    for (const record of recentHistory) {
      // 按类型统计
      stats.byType[record.type] = (stats.byType[record.type] || 0) + 1;
      
      // 按紧急程度统计
      stats.byUrgency[record.urgency] = (stats.byUrgency[record.urgency] || 0) + 1;
      
      // 按小时统计
      const hour = new Date(record.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      
      // 疲劳指数总和
      if (record.metadata?.fatigueIndex) {
        fatigueSum += record.metadata.fatigueIndex;
      }
    }
    
    stats.avgFatigueIndex = recentHistory.length > 0 
      ? Math.round(fatigueSum / recentHistory.length) 
      : 0;
    
    return stats;
  } catch (e) {
    console.error('获取统计失败:', e.message);
    return { total: 0, byType: {}, avgFatigueIndex: 0 };
  }
}

// ============================================================================
// 导出 | Exports
// ============================================================================

module.exports = {
  // 核心函数 | Core Functions
  generateIntervention,
  determineInterventionType,
  selectTemplate,
  renderMessage,
  determineFollowUp,
  
  // 检测函数 | Detection Functions
  detectNegativeEmotion,
  detectTaskCompletion,
  isMealTime,
  
  // 数据持久化 | Persistence
  recordIntervention,
  getInterventionStats,
  
  // 模板库 | Template Library
  INTERVENTION_TEMPLATES
};

// ============================================================================
// 命令行测试 | CLI Test
// ============================================================================

if (require.main === module) {
  console.log('HeartFlow Intervention Generator v6.0.3');
  console.log('=======================================\n');
  
  // 测试场景 1: 深夜工作
  console.log('场景 1: 深夜工作 (02:00)');
  const context1 = {
    hour: 2,
    fatigueIndex: 85,
    fatigueType: 'NIGHT_CRITICAL',
    情绪 State: 'tired'
  };
  const intervention1 = generateIntervention(context1);
  console.log(JSON.stringify(intervention1, null, 2));
  
  console.log('\n---\n');
  
  // 测试场景 2: 高度疲劳
  console.log('场景 2: 高度疲劳 (下午 15:00)');
  const context2 = {
    hour: 15,
    fatigueIndex: 75,
    fatigueType: 'HIGH',
    情绪 State: 'stressed'
  };
  const intervention2 = generateIntervention(context2);
  console.log(JSON.stringify(intervention2, null, 2));
  
  console.log('\n---\n');
  
  // 测试场景 3: 负面情绪
  console.log('场景 3: 负面情绪');
  const context3 = {
    hour: 14,
    fatigueIndex: 35,
    fatigueType: 'LOW',
    情绪 State: 'frustrated',
    recentMessages: [
      { content: '这个项目太难了，我好焦虑' }
    ]
  };
  const intervention3 = generateIntervention(context3);
  console.log(JSON.stringify(intervention3, null, 2));
}
