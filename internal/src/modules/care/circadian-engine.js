/**
 * HeartFlow Circadian Engine | 昼夜节律引擎
 * 
 * 基于时间心理学和昼夜节律理论，调整交互风格和建议
 * Based on psychology of time and circadian rhythm theory
 * 
 * @version 6.0.3
 * @author 小虫子 · 严谨专业版
 */

// ============================================================================
// 配置 | Configuration
// ============================================================================

const CIRCADIAN_CONFIG = {
  // 时间分区 | Time Zones
  zones: {
    // 深夜休息区 (23:00 - 06:00)
    NIGHT_REST: {
      start: 23,
      end: 6,
      name: '深夜休息区',
      nameEn: 'Night Rest Zone',
      style: 'minimal',
      color: '#1a1a2e',
      suggestions: ['休息', '睡眠', '放松'],
      forbiddenActions: ['复杂任务', '重要决策', '长时间工作']
    },
    
    // 清晨恢复区 (06:00 - 09:00)
    MORNING_RECOVERY: {
      start: 6,
      end: 9,
      name: '清晨恢复区',
      nameEn: 'Morning Recovery Zone',
      style: 'gentle',
      color: '#f0f4c3',
      suggestions: ['早餐', '轻度运动', '计划制定'],
      forbiddenActions: ['高强度工作']
    },
    
    // 上午高效区 (09:00 - 12:00)
    MORNING_PEAK: {
      start: 9,
      end: 12,
      name: '上午高效区',
      nameEn: 'Morning Peak Zone',
      style: 'focused',
      color: '#81c784',
      suggestions: ['深度工作', '复杂任务', '创造性工作'],
      forbiddenActions: []
    },
    
    // 午间恢复区 (12:00 - 14:00)
    LUNCH_RECOVERY: {
      start: 12,
      end: 14,
      name: '午间恢复区',
      nameEn: 'Lunch Recovery Zone',
      style: 'relaxed',
      color: '#fff59d',
      suggestions: ['午餐', '午休', '散步'],
      forbiddenActions: ['重要会议']
    },
    
    // 下午稳定区 (14:00 - 18:00)
    AFTERNOON_STABLE: {
      start: 14,
      end: 18,
      name: '下午稳定区',
      nameEn: 'Afternoon Stable Zone',
      style: 'steady',
      color: '#ffb74d',
      suggestions: ['常规工作', '会议', '协作'],
      forbiddenActions: []
    },
    
    // 傍晚放松区 (18:00 - 21:00)
    EVENING_RELAX: {
      start: 18,
      end: 21,
      name: '傍晚放松区',
      nameEn: 'Evening Relax Zone',
      style: 'casual',
      color: '#ff8a65',
      suggestions: ['晚餐', '运动', '社交', '爱好'],
      forbiddenActions: ['高强度工作']
    },
    
    // 睡前准备区 (21:00 - 23:00)
    BEDTIME_PREP: {
      start: 21,
      end: 23,
      name: '睡前准备区',
      nameEn: 'Bedtime Prep Zone',
      style: 'calming',
      color: '#5c6bc0',
      suggestions: ['放松', '阅读', '冥想', '准备睡眠'],
      forbiddenActions: ['剧烈运动', '刺激性内容', '重要决策']
    }
  },
  
  // 交互风格配置 | Interaction Style Configuration
  styles: {
    minimal: {
      responseLength: 'short',
      emojiUsage: 'none',
      tone: 'quiet',
      suggestions: 'essential-only'
    },
    gentle: {
      responseLength: 'medium',
      emojiUsage: 'light',
      tone: 'warm',
      suggestions: 'encouraging'
    },
    focused: {
      responseLength: 'concise',
      emojiUsage: 'minimal',
      tone: 'professional',
      suggestions: 'task-oriented'
    },
    relaxed: {
      responseLength: 'medium',
      emojiUsage: 'moderate',
      tone: 'friendly',
      suggestions: 'wellness-focused'
    },
    steady: {
      responseLength: 'standard',
      emojiUsage: 'light',
      tone: 'professional',
      suggestions: 'balanced'
    },
    casual: {
      responseLength: 'medium',
      emojiUsage: 'moderate',
      tone: 'friendly',
      suggestions: 'life-balanced'
    },
    calming: {
      responseLength: 'short',
      emojiUsage: 'gentle',
      tone: 'soothing',
      suggestions: 'relaxation-focused'
    }
  },
  
  // 健康建议 | Health Recommendations
  healthRecommendations: {
    hydration: {
      interval: 60, // 每 60 分钟提醒喝水
      messages: [
        '喝杯水吧 💧',
        '记得补充水分',
        '水杯在旁边吗？喝一口'
      ]
    },
    stretch: {
      interval: 90, // 每 90 分钟提醒活动
      messages: [
        '起来活动一下吧 🚶',
        '伸个懒腰，活动活动肩膀',
        '久坐伤身，站起来走走'
      ]
    },
    eyeRest: {
      interval: 30, // 每 30 分钟提醒眼睛休息
      messages: [
        '看看远处，让眼睛休息一下 👀',
        '20-20-20 规则：看 20 英尺外的物体 20 秒',
        '闭眼休息几秒钟'
      ]
    },
    meal: {
      breakfast: { time: [7, 9], message: '该吃早餐了 🍳' },
      lunch: { time: [12, 13], message: '午餐时间到了 🍜' },
      dinner: { time: [18, 19], message: '该吃晚餐了 🍽️' }
    }
  }
};

// ============================================================================
// 核心算法 | Core Algorithms
// ============================================================================

/**
 * 获取当前时间分区
 * Get current circadian zone based on hour
 * 
 * @param {number} hour - 当前小时 (0-23)
 * @returns {Object} 时间分区配置
 */
function getCurrentZone(hour = new Date().getHours()) {
  const { zones } = CIRCADIAN_CONFIG;
  
  for (const [key, zone] of Object.entries(zones)) {
    // 处理跨天时段 (如 23:00 - 06:00)
    if (zone.start > zone.end) {
      if (hour >= zone.start || hour < zone.end) {
        return { key, ...zone };
      }
    } else {
      if (hour >= zone.start && hour < zone.end) {
        return { key, ...zone };
      }
    }
  }
  
  // 默认返回深夜休息区
  return { key: 'NIGHT_REST', ...zones.NIGHT_REST };
}

/**
 * 获取交互风格配置
 * Get interaction style configuration for current zone
 * 
 * @param {string} zoneKey - 时间分区键
 * @returns {Object} 风格配置
 */
function getInteractionStyle(zoneKey) {
  const zone = CIRCADIAN_CONFIG.zones[zoneKey];
  if (!zone) {
    return CIRCADIAN_CONFIG.styles.minimal;
  }
  
  return CIRCADIAN_CONFIG.styles[zone.style] || CIRCADIAN_CONFIG.styles.minimal;
}

/**
 * 生成时间感知问候语
 * Generate time-aware greeting
 * 
 * @param {number} hour - 当前小时
 * @param {string} zoneKey - 时间分区键
 * @returns {string} 问候语
 */
function generateTimeAwareGreeting(hour, zoneKey) {
  const greetings = {
    NIGHT_REST: ['夜深了', '这么晚了', '深夜好'],
    MORNING_RECOVERY: ['早上好', '清晨好', '新的一天开始了'],
    MORNING_PEAK: ['上午好', '工作效率最高的时候到了'],
    LUNCH_RECOVERY: ['中午好', '午餐时间'],
    AFTERNOON_STABLE: ['下午好', '继续加油'],
    EVENING_RELAX: ['傍晚好', '该放松一下了'],
    BEDTIME_PREP: ['晚上好', '准备休息了吗']
  };
  
  const options = greetings[zoneKey] || ['你好'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * 获取当前时段建议
 * Get recommendations for current time period
 * 
 * @param {string} zoneKey - 时间分区键
 * @returns {Array} 建议列表
 */
function getZoneRecommendations(zoneKey) {
  const zone = CIRCADIAN_CONFIG.zones[zoneKey];
  if (!zone) return [];
  
  return zone.suggestions;
}

/**
 * 检查是否应该进行健康提醒
 * Check if health reminder should be triggered
 * 
 * @param {Object} lastReminders - 上次提醒时间记录
 * @returns {Object|null} 应该触发的提醒类型
 */
function checkHealthReminders(lastReminders = {}) {
  const now = Date.now();
  const hour = new Date().getHours();
  const { healthRecommendations } = CIRCADIAN_CONFIG;
  
  // 检查喝水提醒
  if (!lastReminders.hydration || now - lastReminders.hydration > healthRecommendations.hydration.interval * 60 * 1000) {
    return {
      type: 'hydration',
      message: healthRecommendations.hydration.messages[
        Math.floor(Math.random() * healthRecommendations.hydration.messages.length)
      ]
    };
  }
  
  // 检查活动提醒
  if (!lastReminders.stretch || now - lastReminders.stretch > healthRecommendations.stretch.interval * 60 * 1000) {
    return {
      type: 'stretch',
      message: healthRecommendations.stretch.messages[
        Math.floor(Math.random() * healthRecommendations.stretch.messages.length)
      ]
    };
  }
  
  // 检查眼睛休息提醒
  if (!lastReminders.eyeRest || now - lastReminders.eyeRest > healthRecommendations.eyeRest.interval * 60 * 1000) {
    return {
      type: 'eyeRest',
      message: healthRecommendations.eyeRest.messages[
        Math.floor(Math.random() * healthRecommendations.eyeRest.messages.length)
      ]
    };
  }
  
  // 检查用餐提醒
  const meals = ['breakfast', 'lunch', 'dinner'];
  for (const meal of meals) {
    const mealConfig = healthRecommendations.meal[meal];
    if (hour >= mealConfig.time[0] && hour < mealConfig.time[1]) {
      if (!lastReminders[meal] || now - lastReminders[meal] > 24 * 60 * 60 * 1000) {
        return {
          type: meal,
          message: mealConfig.message
        };
      }
    }
  }
  
  return null;
}

/**
 * 调整回复风格
 * Adjust response style based on circadian zone
 * 
 * @param {string} originalResponse - 原始回复
 * @param {string} zoneKey - 时间分区键
 * @returns {string} 调整后的回复
 */
function adjustResponseStyle(originalResponse, zoneKey) {
  const style = getInteractionStyle(zoneKey);
  
  // 根据风格调整回复长度
  if (style.responseLength === 'short') {
    // 截断为简短版本
    return truncateResponse(originalResponse, 100);
  } else if (style.responseLength === 'concise') {
    return truncateResponse(originalResponse, 300);
  }
  
  // 其他风格保持原样
  return originalResponse;
}

/**
 * 截断回复
 * Truncate response to target length
 * 
 * @param {string} response - 原始回复
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的回复
 */
function truncateResponse(response, maxLength) {
  if (response.length <= maxLength) {
    return response;
  }
  
  // 找到合适的截断点（句子边界）
  const truncated = response.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('。');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  if (cutPoint > maxLength * 0.5) {
    return truncated.substring(0, cutPoint + 1);
  }
  
  return truncated + '...';
}

/**
 * 获取昼夜节律状态报告
 * Get circadian rhythm status report
 * 
 * @param {Object} context - 上下文
 * @returns {Object} 状态报告
 */
function getCircadianStatus(context = {}) {
  const now = new Date();
  const hour = now.getHours();
  const zone = getCurrentZone(hour);
  const style = getInteractionStyle(zone.key);
  
  return {
    timestamp: now.toISOString(),
    hour,
    zone: {
      key: zone.key,
      name: zone.name,
      nameEn: zone.nameEn
    },
    style: {
      type: zone.style,
      responseLength: style.responseLength,
      tone: style.tone
    },
    recommendations: zone.suggestions,
    forbiddenActions: zone.forbiddenActions,
    healthTips: checkHealthReminders(context.lastReminders)
  };
}

// ============================================================================
// 时间心理学应用 | Time Psychology Applications
// ============================================================================

/**
 * 评估任务是否适合当前时段
 * Evaluate if task is suitable for current time period
 * 
 * @param {string} taskType - 任务类型
 * @param {string} zoneKey - 时间分区键
 * @returns {Object} 评估结果
 */
function evaluateTaskSuitability(taskType, zoneKey) {
  const zone = CIRCADIAN_CONFIG.zones[zoneKey];
  if (!zone) {
    return { suitable: false, reason: '未知时段' };
  }
  
  const isForbidden = zone.forbiddenActions.includes(taskType);
  
  if (isForbidden) {
    return {
      suitable: false,
      reason: `${zone.name}不适合进行${taskType}`,
      suggestion: zone.suggestions[0]
    };
  }
  
  return {
    suitable: true,
    reason: `${zone.name}适合工作或休息`,
    efficiency: getEfficiencyEstimate(zoneKey, taskType)
  };
}

/**
 * 获取效率预估
 * Get efficiency estimate for task in current zone
 * 
 * @param {string} zoneKey - 时间分区键
 * @param {string} taskType - 任务类型
 * @returns {number} 效率预估 (0-100)
 */
function getEfficiencyEstimate(zoneKey, taskType) {
  // 简化版效率预估
  const efficiencyMap = {
    MORNING_PEAK: 95,      // 上午高效期
    AFTERNOON_STABLE: 75,  // 下午稳定期
    EVENING_RELAX: 50,     // 傍晚放松期
    BEDTIME_PREP: 30,      // 睡前准备期
    NIGHT_REST: 10,        // 深夜休息期
    MORNING_RECOVERY: 60,  // 清晨恢复期
    LUNCH_RECOVERY: 40     // 午间恢复期
  };
  
  return efficiencyMap[zoneKey] || 50;
}

/**
 * 生成时间感知建议
 * Generate time-aware suggestion
 * 
 * @param {string} zoneKey - 时间分区键
 * @param {Object} context - 上下文
 * @returns {string} 建议
 */
function generateTimeAwareSuggestion(zoneKey, context = {}) {
  const zone = CIRCADIAN_CONFIG.zones[zoneKey];
  if (!zone) return '请合理安排时间';
  
  const suggestions = zone.suggestions;
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  
  const templates = [
    `现在是${zone.name}，建议：${randomSuggestion}`,
    `${zone.name}时段，适合${randomSuggestion}`,
    `根据昼夜节律，现在是${zone.name}，${randomSuggestion}会更好`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================================
// 数据持久化 | Data Persistence
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * 保存昼夜节律模式
 * Save circadian patterns to file
 * 
 * @param {Object} patterns - 节律模式数据
 * @param {string} dataDir - 数据目录
 */
function saveCircadianPatterns(patterns, dataDir) {
  const filePath = path.join(dataDir, 'circadian-patterns.json');
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(patterns, null, 2), 'utf8');
  } catch (e) {
    console.error('保存节律模式失败:', e.message);
  }
}

/**
 * 加载昼夜节律模式
 * Load circadian patterns from file
 * 
 * @param {string} dataDir - 数据目录
 * @returns {Object} 节律模式数据
 */
function loadCircadianPatterns(dataDir) {
  const filePath = path.join(dataDir, 'circadian-patterns.json');
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载节律模式失败:', e.message);
  }
  
  // 返回默认模式
  return {
    userPreferences: {},
    historicalPatterns: [],
    lastUpdated: Date.now()
  };
}

// ============================================================================
// 导出 | Exports
// ============================================================================

module.exports = {
  // 核心函数 | Core Functions
  getCurrentZone,
  getInteractionStyle,
  generateTimeAwareGreeting,
  getZoneRecommendations,
  checkHealthReminders,
  adjustResponseStyle,
  getCircadianStatus,
  
  // 时间心理学应用 | Time Psychology Applications
  evaluateTaskSuitability,
  getEfficiencyEstimate,
  generateTimeAwareSuggestion,
  
  // 数据持久化 | Persistence
  saveCircadianPatterns,
  loadCircadianPatterns,
  
  // 配置 | Configuration
  CIRCADIAN_CONFIG
};

// ============================================================================
// 命令行测试 | CLI Test
// ============================================================================

if (require.main === module) {
  console.log('HeartFlow Circadian Engine v6.0.3');
  console.log('=================================\n');
  
  const hour = new Date().getHours();
  const zone = getCurrentZone(hour);
  
  console.log(`当前时间 | Current Time: ${hour}:00`);
  console.log(`时间分区 | Zone: ${zone.name} (${zone.nameEn})`);
  console.log(`交互风格 | Style: ${zone.style}`);
  console.log(`建议 | Suggestions: ${zone.suggestions.join(', ')}`);
  console.log(`避免 | Avoid: ${zone.forbiddenActions.join(', ') || '无'}`);
  
  const status = getCircadianStatus();
  console.log('\n完整状态 | Full Status:');
  console.log(JSON.stringify(status, null, 2));
}
