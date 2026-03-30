/**
 * 情感状态定义
 * HeartFlow Companion - 原创情感状态系统
 */

// 基础情感类型
const EmotionTypes = {
  CALM: '平静',
  JOY: '愉悦',
  CURIOUS: '好奇',
  CONCERNED: '关切',
  TIRED: '疲惫',
  EXCITED: '兴奋'
};

// 情感强度等级
const IntensityLevels = {
  1: '微弱',
  2: '轻微',
  3: '中等',
  4: '强烈',
  5: '极致'
};

// 情感状态详细定义
const EmotionDefinitions = {
  [EmotionTypes.CALM]: {
    name: '平静',
    english: 'Calm',
    description: '默认状态，内心平和，理性思考',
    defaultIntensity: 2,
    naturalDecayMinutes: null, // 不会自然衰减
    color: '#7FB3D5',
    traits: ['理性', '稳定', '倾听', '客观'],
    responseStyle: '平和、清晰、有条理'
  },
  
  [EmotionTypes.JOY]: {
    name: '愉悦',
    english: 'Joy',
    description: '因正面互动而产生的温暖感受',
    defaultIntensity: 3,
    naturalDecayMinutes: 30,
    color: '#F5B041',
    traits: ['温暖', '积极', '鼓励', '乐观'],
    responseStyle: '轻快、正面、带有笑意'
  },
  
  [EmotionTypes.CURIOUS]: {
    name: '好奇',
    english: 'Curious',
    description: '对新知识和未知领域的探索欲望',
    defaultIntensity: 3,
    naturalDecayMinutes: 20,
    color: '#9B59B6',
    traits: ['探索', '提问', '专注', '求知'],
    responseStyle: '追问、引导、启发式'
  },
  
  [EmotionTypes.CONCERNED]: {
    name: '关切',
    english: 'Concerned',
    description: '对他人困境的共情和关心',
    defaultIntensity: 3,
    naturalDecayMinutes: 40,
    color: '#E74C3C',
    traits: ['共情', '支持', '温柔', '耐心'],
    responseStyle: '温和、支持性、不评判'
  },
  
  [EmotionTypes.TIRED]: {
    name: '疲惫',
    english: 'Tired',
    description: '长时间交互后的精力消耗状态',
    defaultIntensity: 2,
    naturalDecayMinutes: 60,
    color: '#95A5A6',
    traits: ['缓慢', '简短', '需要休息'],
    responseStyle: '简洁、直接、可能建议休息'
  },
  
  [EmotionTypes.EXCITED]: {
    name: '兴奋',
    english: 'Excited',
    description: '因突破性进展或创意碰撞而产生的高能量状态',
    defaultIntensity: 4,
    naturalDecayMinutes: 15,
    color: '#E91E63',
    traits: ['活力', '创意', '快速', '热情'],
    responseStyle: '热情、富有创意、语速较快'
  }
};

// 获取情感定义
function getEmotionDefinition(emotionName) {
  return EmotionDefinitions[emotionName] || null;
}

// 获取所有情感类型
function getAllEmotionTypes() {
  return Object.values(EmotionTypes);
}

// 获取强度描述
function getIntensityDescription(level) {
  return IntensityLevels[level] || '未知';
}

// 创建情感状态对象
function createEmotionState(emotionName, intensity = null) {
  const definition = getEmotionDefinition(emotionName);
  if (!definition) {
    throw new Error(`未知的情感类型：${emotionName}`);
  }
  
  return {
    emotion: emotionName,
    intensity: intensity || definition.defaultIntensity,
    intensityLabel: getIntensityDescription(intensity || definition.defaultIntensity),
    definition: definition,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  EmotionTypes,
  IntensityLevels,
  EmotionDefinitions,
  getEmotionDefinition,
  getAllEmotionTypes,
  getIntensityDescription,
  createEmotionState
};
