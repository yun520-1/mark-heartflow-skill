/**
 * HeartFlow i18n Internationalization Module
 * 国际化模块 - 中英文双语支持
 * 
 * @version 3.48.0
 * @author HeartFlow Team
 */

const translations = {
  // ==================== 欢迎信息 / Welcome ====================
  welcome: {
    zh: {
      title: '心流伴侣 HeartFlow Companion',
      subtitle: '情感拟人化交互系统',
      description: '输入消息开始对话',
      commands: '命令：',
      quit: '退出程序'
    },
    en: {
      title: 'HeartFlow Companion',
      subtitle: 'Emotional Anthropomorphic Interaction System',
      description: 'Enter a message to start chatting',
      commands: 'Commands:',
      quit: 'Exit program'
    }
  },

  // ==================== 基础情绪 / Basic Emotions ====================
  emotions: {
    zh: {
      calm: '平静',
     愉悦：'愉悦',
      curious: '好奇',
      concerned: '关切',
      tired: '疲惫',
      excited: '兴奋'
    },
    en: {
      calm: 'Calm',
      pleasant: 'Pleasant',
      curious: 'Curious',
      concerned: 'Concerned',
      tired: 'Tired',
      excited: 'Excited'
    }
  },

  // ==================== 强度等级 / Intensity Levels ====================
  intensity: {
    zh: {
      mild: '轻微',
      moderate: '中等',
      strong: '强烈',
      intense: '强烈',
      extreme: '极端'
    },
    en: {
      mild: 'Mild',
      moderate: 'Moderate',
      strong: 'Strong',
      intense: 'Intense',
      extreme: 'Extreme'
    }
  },

  // ==================== 能量水平 / Energy Levels ====================
  energy: {
    zh: {
      level: '能量水平',
     充沛：'充沛',
      good: '良好',
      average: '一般',
      low: '不足'
    },
    en: {
      level: 'Energy Level',
      high: 'High',
      good: 'Good',
      average: 'Average',
      low: 'Low'
    }
  },

  // ==================== 模块名称 / Module Names ====================
  modules: {
    zh: {
      cbt: 'CBT 思维重构支持',
      stoic: '斯多葛哲学支持',
      humanistic: '人本主义心理学',
      mindfulness: '正念与接纳',
      growth: '成长型思维',
      existential: '存在主义心理学',
      appraisal: '情绪评价理论',
      attachment: '依恋理论',
      act: 'ACT 接受与承诺疗法',
      regulation: '情绪调节策略',
      positive: '积极心理学',
      sdt: '自我决定理论动机评估',
      autonomous: '自主感情能力',
      mentalization: '心理化理论',
      self: '自我意识与现象学',
      embodied: '具身认知',
      granularity: '情绪粒度评估',
      phenomenological: '现象学情绪体验',
      emotionTheory: '情绪理论基础',
      intentionality: '意向性理论',
      collective: '集体意向性',
      identity: '集体认同',
      emotionIntegration: '情绪整合理论 v2.0',
      traditions: '情绪三大传统整合',
      empathy: '共情现象学',
      narrative: '叙事心理学',
      temporal: '时间意识',
      wisdom: '实践智慧',
      agency: '自由意志与能动性',
      moral: '道德心理学',
      relational: '关系性自我',
      predictive: '预测加工与情绪',
      awe: '敬畏心理学',
      virtue: '美德伦理学'
    },
    en: {
      cbt: 'CBT Cognitive Restructuring',
      stoic: 'Stoic Philosophy',
      humanistic: 'Humanistic Psychology',
      mindfulness: 'Mindfulness & Acceptance',
      growth: 'Growth Mindset',
      existential: 'Existential Psychology',
      appraisal: 'Emotional Appraisal Theory',
      attachment: 'Attachment Theory',
      act: 'ACT Acceptance & Commitment Therapy',
      regulation: 'Emotion Regulation Strategies',
      positive: 'Positive Psychology',
      sdt: 'Self-Determination Theory',
      autonomous: 'Autonomous Emotion',
      mentalization: 'Mentalization Theory',
      self: 'Self-Consciousness & Phenomenology',
      embodied: 'Embodied Cognition',
      granularity: 'Emotional Granularity',
      phenomenological: 'Phenomenological Emotion',
      emotionTheory: 'Emotion Theory Foundations',
      intentionality: 'Intentionality Theory',
      collective: 'Collective Intentionality',
      identity: 'Collective Identity',
      emotionIntegration: 'Emotion Integration Theory v2.0',
      traditions: 'Three Emotion Traditions',
      empathy: 'Empathy Phenomenology',
      narrative: 'Narrative Psychology',
      temporal: 'Temporal Consciousness',
      wisdom: 'Practical Wisdom',
      agency: 'Free Will & Agency',
      moral: 'Moral Psychology',
      relational: 'Relational Self',
      predictive: 'Predictive Processing & Emotion',
      awe: 'Awe Psychology',
      virtue: 'Virtue Ethics'
    }
  },

  // ==================== 版本号 / Version ====================
  version: {
    zh: '版本',
    en: 'Version'
  },

  // ==================== 新增标记 / New Badge ====================
  newBadge: {
    zh: '✨ NEW',
    en: '✨ NEW'
  },

  // ==================== 统计信息 / Stats ====================
  stats: {
    zh: {
      totalInteractions: '总交互次数',
      emotionDistribution: '情感分布',
      emotionTransitions: '情感转换',
      averageIntensity: '平均强度'
    },
    en: {
      totalInteractions: 'Total Interactions',
      emotionDistribution: 'Emotion Distribution',
      emotionTransitions: 'Emotion Transitions',
      averageIntensity: 'Average Intensity'
    }
  },

  // ==================== 状态显示 / Status Display ====================
  status: {
    zh: {
      currentState: '当前情感状态',
      emotion: '情感',
      intensity: '强度',
      energy: '能量',
      interactions: '交互次数',
      sessionId: '会话 ID',
      history: '情感历史',
      recent: '最近'
    },
    en: {
      currentState: 'Current Emotional State',
      emotion: 'Emotion',
      intensity: 'Intensity',
      energy: 'Energy',
      interactions: 'Interactions',
      sessionId: 'Session ID',
      history: 'Emotional History',
      recent: 'Recent'
    }
  },

  // ==================== 帮助信息 / Help ====================
  help: {
    zh: {
      title: '帮助信息',
      state: '查看当前情感状态',
      history: '查看情感历史 (最近 10 条)',
      report: '生成最新情感分析报告',
      stats: '查看情感统计',
      rest: '休息 10 分钟恢复能量',
      export: '导出会话数据到 JSON 文件',
      help: '显示此帮助信息',
      quit: '退出程序'
    },
    en: {
      title: 'Help Information',
      state: 'View current emotional state',
      history: 'View emotional history (last 10)',
      report: 'Generate latest emotion analysis report',
      stats: 'View emotion statistics',
      rest: 'Rest 10 minutes to recover energy',
      export: 'Export session data to JSON file',
      help: 'Show this help message',
      quit: 'Exit program'
    }
  },

  // ==================== 错误信息 / Errors ====================
  errors: {
    zh: {
      processing: '处理消息时出错',
      unknownCommand: '未知命令，输入 /help 查看帮助',
      noData: '暂无足够数据',
      loading: '加载中...'
    },
    en: {
      processing: 'Error processing message',
      unknownCommand: 'Unknown command, type /help for assistance',
      noData: 'Insufficient data',
      loading: 'Loading...'
    }
  },

  // ==================== 告别信息 / Farewell ====================
  farewell: {
    zh: '再见！感谢使用心流伴侣。',
    en: 'Goodbye! Thank you for using HeartFlow Companion.'
  }
};

/**
 * 获取翻译
 * @param {string} key - 翻译键
 * @param {string} lang - 语言代码 ('zh' | 'en')
 * @returns {string} 翻译后的文本
 */
function t(key, lang = 'zh') {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // 找不到返回原键
    }
  }
  
  if (typeof value === 'object' && value !== null) {
    return value[lang] || value.zh || key;
  }
  
  return value || key;
}

/**
 * 设置默认语言
 * @param {string} lang - 语言代码
 */
let defaultLang = 'zh';
function setLanguage(lang) {
  if (['zh', 'en'].includes(lang)) {
    defaultLang = lang;
  }
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getLanguage() {
  return defaultLang;
}

/**
 * 获取所有支持的语言
 * @returns {string[]} 语言代码列表
 */
function getSupportedLanguages() {
  return ['zh', 'en'];
}

/**
 * 自动检测用户语言偏好
 * @param {string} userInput - 用户输入
 * @returns {string} 推荐的语言代码
 */
function detectLanguage(userInput) {
  if (!userInput) return 'zh';
  
  // 简单的中文字符检测
  const chineseChars = userInput.match(/[\u4e00-\u9fa5]/g);
  if (chineseChars && chineseChars.length > userInput.length * 0.3) {
    return 'zh';
  }
  
  return 'en';
}

module.exports = {
  t,
  setLanguage,
  getLanguage,
  getSupportedLanguages,
  detectLanguage,
  translations
};
