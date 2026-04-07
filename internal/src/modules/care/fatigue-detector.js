/**
 * HeartFlow Fatigue Detector | 疲劳检测器
 * 
 * 基于多因素加权算法评估用户疲劳状态
 * Based on multi-factor weighted algorithm for fatigue assessment
 * 
 * @version 6.0.3
 * @author 小虫子 · 严谨专业版
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置 | Configuration
// ============================================================================

const FATIGUE_CONFIG = {
  // 权重配置 | Weight Configuration
  weights: {
    timeScore: 0.30,      // 时间上下文权重
    frequencyScore: 0.25, // 交互频率权重
    languageScore: 0.25,  // 语言模式权重
    durationScore: 0.20   // 会话时长权重
  },
  
  // 阈值配置 | Threshold Configuration
  thresholds: {
    CRITICAL: 80,  // 强制休息
    HIGH: 60,      // 强烈建议休息
    MEDIUM: 40,    // 温和提醒
    LOW: 20        // 无需干预
  },
  
  // 时间分区 | Time Zones (24 小时制)
  timeZones: {
    NIGHT_CRITICAL: { start: 23, end: 6, score: 100 },   // 深夜强制休息
    EVENING_HIGH: { start: 21, end: 23, score: 70 },     // 傍晚高疲劳
    AFTERNOON_MEDIUM: { start: 14, end: 18, score: 30 }, // 下午中等疲劳
    MORNING_LOW: { start: 9, end: 12, score: 10 },       // 上午低疲劳
    DEFAULT: { score: 50 }                               // 默认
  },
  
  // 疲惫词汇 | Fatigue Keywords (中文)
  fatigueKeywords: [
    '累', '困', '倦', '疲', '乏', '辛苦', '疲惫', '疲倦',
    '熬夜', '通宵', '失眠', '睡不好', '休息不够',
    '头疼', '头晕', '眼花', '腰酸', '背痛',
    '撑不住', '坚持', '硬撑', '勉强'
  ],
  
  // 负面词汇 | Negative Keywords
  negativeKeywords: [
    '烦', '躁', '焦虑', '压力', '崩溃', '受不了',
    '难', '复杂', '搞不定', '不会', '不懂'
  ]
};

// ============================================================================
// 核心算法 | Core Algorithms
// ============================================================================

/**
 * 计算时间上下文评分
 * Calculate time context score based on current hour
 * 
 * @param {number} hour - 当前小时 (0-23)
 * @returns {number} 时间评分 (0-100)
 */
function calculateTimeScore(hour) {
  const { timeZones } = FATIGUE_CONFIG;
  
  // 深夜强制休息时段 (23:00 - 06:00)
  if (hour >= timeZones.NIGHT_CRITICAL.start || hour <= timeZones.NIGHT_CRITICAL.end) {
    return timeZones.NIGHT_CRITICAL.score;
  }
  
  // 傍晚高疲劳时段 (21:00 - 23:00)
  if (hour >= timeZones.EVENING_HIGH.start && hour < timeZones.EVENING_HIGH.end) {
    return timeZones.EVENING_HIGH.score;
  }
  
  // 下午中等疲劳时段 (14:00 - 18:00)
  if (hour >= timeZones.AFTERNOON_MEDIUM.start && hour < timeZones.AFTERNOON_MEDIUM.end) {
    return timeZones.AFTERNOON_MEDIUM.score;
  }
  
  // 上午低疲劳时段 (09:00 - 12:00)
  if (hour >= timeZones.MORNING_LOW.start && hour < timeZones.MORNING_LOW.end) {
    return timeZones.MORNING_LOW.score;
  }
  
  // 默认评分
  return timeZones.DEFAULT.score;
}

/**
 * 计算交互频率评分
 * Calculate interaction frequency score
 * 
 * @param {Array} interactionHistory - 交互历史记录
 * @returns {number} 频率评分 (0-100)
 */
function calculateFrequencyScore(interactionHistory = []) {
  if (!interactionHistory || interactionHistory.length === 0) {
    return 0;
  }
  
  // 计算最近 1 小时内的交互次数
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentInteractions = interactionHistory.filter(
    msg => msg.timestamp > oneHourAgo
  );
  
  const count = recentInteractions.length;
  
  // 高频 (>10 次/小时): 80
  if (count > 10) return 80;
  // 中频 (5-10 次/小时): 50
  if (count >= 5) return 50;
  // 低频 (<5 次/小时): 20
  return 20;
}

/**
 * 分析语言模式评分
 * Analyze language patterns for fatigue indicators
 * 
 * @param {Array} messages - 消息历史
 * @returns {number} 语言评分 (0-100)
 */
function analyzeLanguagePatterns(messages = []) {
  if (!messages || messages.length === 0) {
    return 0;
  }
  
  let score = 0;
  const recentMessages = messages.slice(-10); // 分析最近 10 条消息
  
  for (const msg of recentMessages) {
    const text = msg.content || msg.text || '';
    const lowerText = text.toLowerCase();
    
    // 检测疲惫词汇 (+30)
    for (const keyword of FATIGUE_CONFIG.fatigueKeywords) {
      if (lowerText.includes(keyword)) {
        score += 30;
        break;
      }
    }
    
    // 检测负面词汇 (+20)
    for (const keyword of FATIGUE_CONFIG.negativeKeywords) {
      if (lowerText.includes(keyword)) {
        score += 20;
        break;
      }
    }
    
    // 检测短句/错误 (+15)
    if (text.length < 10 || hasTypos(text)) {
      score += 15;
    }
  }
  
  // 归一化到 0-100
  return Math.min(100, score);
}

/**
 * 检测文本中的拼写错误
 * Detect typos in text (simplified version)
 * 
 * @param {string} text - 待检测文本
 * @returns {boolean} 是否有错误
 */
function hasTypos(text) {
  // 简单检测：连续重复字符、异常标点等
  const typoPatterns = [
    /(.)\1{3,}/,        // 连续重复字符 (如 "啊啊啊啊")
    /[?!]{2,}/,         // 连续标点 (如 "??", "!!")
    /\s{3,}/,           // 连续空格
    /^\.{3,}$/,         // 只有省略号
    /^(嗯|呃|啊|哦)\.{0,3}$/  // 只有语气词
  ];
  
  return typoPatterns.some(pattern => pattern.test(text));
}

/**
 * 计算会话时长评分
 * Calculate session duration score
 * 
 * @param {number} sessionStart - 会话开始时间戳
 * @returns {number} 时长评分 (0-100)
 */
function calculateDurationScore(sessionStart) {
  if (!sessionStart) {
    return 0;
  }
  
  const now = Date.now();
  const durationHours = (now - sessionStart) / (1000 * 60 * 60);
  
  // >4 小时：100
  if (durationHours > 4) return 100;
  // 2-4 小时：60
  if (durationHours > 2) return 60;
  // 1-2 小时：30
  if (durationHours > 1) return 30;
  // <1 小时：10
  return 10;
}

/**
 * 计算疲劳指数
 * Calculate comprehensive fatigue index
 * 
 * @param {Object} context - 用户交互上下文
 * @returns {Object} { index: 0-100, type: string, confidence: 0-1, timestamp: number }
 */
function calculateFatigueIndex(context = {}) {
  const { weights } = FATIGUE_CONFIG;
  
  // 1. 时间上下文评分
  const hour = new Date(context.timestamp || Date.now()).getHours();
  const timeScore = calculateTimeScore(hour);
  
  // 2. 交互频率评分
  const freqScore = calculateFrequencyScore(context.interactionHistory);
  
  // 3. 语言模式评分
  const langScore = analyzeLanguagePatterns(context.messages);
  
  // 4. 会话时长评分
  const durationScore = calculateDurationScore(context.sessionStart);
  
  // 加权平均
  const fatigueIndex = (
    timeScore * weights.timeScore +
    freqScore * weights.frequencyScore +
    langScore * weights.languageScore +
    durationScore * weights.durationScore
  );
  
  // 计算置信度
  const confidence = calculateConfidence(context);
  
  return {
    index: Math.round(fatigueIndex),
    type: classifyFatigueType(fatigueIndex, context),
    confidence: Math.round(confidence * 100) / 100,
    timestamp: Date.now(),
    breakdown: {
      timeScore,
      freqScore,
      langScore,
      durationScore
    }
  };
}

/**
 * 计算置信度
 * Calculate confidence based on data availability
 * 
 * @param {Object} context - 上下文
 * @returns {number} 置信度 (0-1)
 */
function calculateConfidence(context) {
  let confidence = 0;
  
  // 有时间数据 +0.3
  if (context.timestamp) confidence += 0.3;
  
  // 有交互历史 +0.25
  if (context.interactionHistory && context.interactionHistory.length > 0) {
    confidence += 0.25;
  }
  
  // 有消息历史 +0.25
  if (context.messages && context.messages.length > 0) {
    confidence += 0.25;
  }
  
  // 有会话开始时间 +0.2
  if (context.sessionStart) confidence += 0.2;
  
  return confidence;
}

/**
 * 分类疲劳类型
 * Classify fatigue type based on index and context
 * 
 * @param {number} fatigueIndex - 疲劳指数
 * @param {Object} context - 上下文
 * @returns {string} 疲劳类型
 */
function classifyFatigueType(fatigueIndex, context) {
  const { thresholds } = FATIGUE_CONFIG;
  const hour = new Date(context.timestamp || Date.now()).getHours();
  
  // 深夜强制干预 (23:00-06:00)
  if (hour >= 23 || hour <= 6) {
    return 'NIGHT_CRITICAL';
  }
  
  // 根据指数分级
  if (fatigueIndex >= thresholds.CRITICAL) return 'CRITICAL';
  if (fatigueIndex >= thresholds.HIGH) return 'HIGH';
  if (fatigueIndex >= thresholds.MEDIUM) return 'MEDIUM';
  if (fatigueIndex >= thresholds.LOW) return 'LOW';
  
  return 'NONE';
}

// ============================================================================
// 干预策略选择 | Intervention Strategy Selection
// ============================================================================

/**
 * 根据疲劳指数和上下文选择干预策略
 * Select intervention strategy based on fatigue index and context
 * 
 * @param {number} fatigueIndex - 疲劳指数 (0-100)
 * @param {Object} context - 上下文
 * @returns {Object} 干预策略 { type, urgency, message, action }
 */
function selectIntervention(fatigueIndex, context = {}) {
  const hour = new Date(context.timestamp || Date.now()).getHours();
  
  // 深夜强制干预 (23:00-06:00)
  if (hour >= 23 || hour <= 6) {
    return {
      type: 'FORCED_REST',
      urgency: 'CRITICAL',
      message: generateForcedRestMessage(context, hour),
      action: 'STOP_WORK_AND_SLEEP',
      timestamp: Date.now()
    };
  }
  
  const { thresholds } = FATIGUE_CONFIG;
  
  // 疲劳指数分级干预
  if (fatigueIndex >= thresholds.CRITICAL) {
    return {
      type: 'MANDATORY_BREAK',
      urgency: 'HIGH',
      message: '你非常疲惫，建议立即休息 30 分钟。健康比工作更重要。',
      action: 'TAKE_30MIN_BREAK',
      timestamp: Date.now()
    };
  }
  
  if (fatigueIndex >= thresholds.HIGH) {
    return {
      type: 'STRONG_SUGGESTION',
      urgency: 'MEDIUM',
      message: '听起来你很累，休息 15 分钟会更好。要不要喝杯水，活动一下？',
      action: 'TAKE_15MIN_BREAK',
      timestamp: Date.now()
    };
  }
  
  if (fatigueIndex >= thresholds.MEDIUM) {
    return {
      type: 'GENTLE_REMINDER',
      urgency: 'LOW',
      message: '工作一段时间了，要不要喝杯水？记得起来活动活动。',
      action: 'HYDRATE_AND_STRETCH',
      timestamp: Date.now()
    };
  }
  
  // 无需干预
  return {
    type: 'NONE',
    urgency: 'NONE',
    message: null,
    action: 'CONTINUE',
    timestamp: Date.now()
  };
}

/**
 * 生成强制休息消息
 * Generate forced rest message for late night
 * 
 * @param {Object} context - 上下文
 * @param {number} hour - 当前小时
 * @returns {string} 关怀消息
 */
function generateForcedRestMessage(context, hour) {
  const timeLabel = hour >= 23 ? `${hour}:00` : `0${hour}:00`;
  
  const messages = [
    `现在是 ${timeLabel}，你已经工作很晚了。`,
    '请立即停止工作，准备休息。',
    '健康比工作更重要，明天再继续吧。',
    '晚安，好梦。🌙'
  ];
  
  return messages.join('\n');
}

// ============================================================================
// 数据持久化 | Data Persistence
// ============================================================================

/**
 * 保存疲劳检测结果到历史
 * Save fatigue detection result to history
 * 
 * @param {Object} result - 检测结果
 * @param {string} dataDir - 数据目录
 */
function saveToInterventionHistory(result, dataDir) {
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
    ...result,
    savedAt: new Date().toISOString()
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

// ============================================================================
// 导出 | Exports
// ============================================================================

module.exports = {
  // 核心函数 | Core Functions
  calculateFatigueIndex,
  calculateTimeScore,
  calculateFrequencyScore,
  analyzeLanguagePatterns,
  calculateDurationScore,
  classifyFatigueType,
  
  // 干预策略 | Intervention
  selectIntervention,
  generateForcedRestMessage,
  
  // 数据持久化 | Persistence
  saveToInterventionHistory,
  
  // 配置 | Configuration
  FATIGUE_CONFIG
};

// ============================================================================
// 命令行测试 | CLI Test
// ============================================================================

if (require.main === module) {
  // 测试模式 | Test Mode
  console.log('HeartFlow Fatigue Detector v6.0.3');
  console.log('=================================\n');
  
  // 模拟上下文 | Simulate Context
  const testContext = {
    timestamp: Date.now(),
    sessionStart: Date.now() - 3 * 60 * 60 * 1000, // 3 小时前
    interactionHistory: Array(15).fill({ timestamp: Date.now() }),
    messages: [
      { content: '好累啊，这个项目太难了' },
      { content: '有点撑不住了' },
      { content: '再坚持一下...' }
    ]
  };
  
  const result = calculateFatigueIndex(testContext);
  console.log('疲劳检测结果 | Fatigue Detection Result:');
  console.log(JSON.stringify(result, null, 2));
  
  const intervention = selectIntervention(result.index, testContext);
  console.log('\n干预策略 | Intervention Strategy:');
  console.log(JSON.stringify(intervention, null, 2));
}
