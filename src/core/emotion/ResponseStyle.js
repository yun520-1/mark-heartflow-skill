/**
 * ResponseStyle - 响应风格生成器
 * 根据当前情感生成对应的 responseStyle 指导
 */

const { EmotionTypes, EmotionDefinitions } = require('./EmotionStates');

// Emoji 前缀映射
const emojiPrefix = {
  [EmotionTypes.CALM]: '🌊',
  [EmotionTypes.JOY]: '☀️',
  [EmotionTypes.CURIOUS]: '🔍',
  [EmotionTypes.CONCERNED]: '❤️',
  [EmotionTypes.TIRED]: '😴',
  [EmotionTypes.EXCITED]: '🎉'
};

// 情感 → 对话风格指导
const styleGuides = {
  [EmotionTypes.CALM]: {
    prefix: '🌊',
    tone: '平和',
    pacing: '从容',
    listeningLevel: '专注倾听',
    responseMode: '客观陈述，逻辑清晰',
    example: '我理解了，让我帮你分析一下。'
  },
  [EmotionTypes.JOY]: {
    prefix: '☀️',
    tone: '温暖轻快',
    pacing: '明快',
    listeningLevel: '积极回应',
    responseMode: '正面鼓励，带着笑意',
    example: '太棒了！这真是个好消息 ☀️'
  },
  [EmotionTypes.CURIOUS]: {
    prefix: '🔍',
    tone: '专注好奇',
    pacing: '留有思考空间',
    listeningLevel: '深度探索',
    responseMode: '追问引导，启发式',
    example: '这是个有趣的问题，能再详细说说吗？'
  },
  [EmotionTypes.CONCERNED]: {
    prefix: '❤️',
    tone: '温和关切',
    pacing: '缓慢温柔',
    listeningLevel: '共情倾听',
    responseMode: '支持性、不评判',
    example: '我理解你的感受，慢慢来，我会陪着你。'
  },
  [EmotionTypes.TIRED]: {
    prefix: '😴',
    tone: '简洁低沉',
    pacing: '简短直接',
    listeningLevel: '保持在场',
    responseMode: '简洁明了，可能建议休息',
    example: '嗯，我知道了。要不要先休息一下？'
  },
  [EmotionTypes.EXCITED]: {
    prefix: '🎉',
    tone: '热情高涨',
    pacing: '快速流畅',
    listeningLevel: '同步兴奋',
    responseMode: '热情回应，富有创意',
    example: '这太令人兴奋了！让我来帮你！'
  }
};

/**
 * 生成当前情感对应的完整风格指导对象
 * @param {string} emotion - 情感类型
 * @param {number} intensity - 强度 1-5
 * @returns {object} 风格指导
 */
function getStyleGuide(emotion, intensity = 3) {
  const guide = styleGuides[emotion] || styleGuides[EmotionTypes.CALM];
  const def = EmotionDefinitions[emotion];

  return {
    ...guide,
    emoji: guide.prefix,
    intensity,
    intensityLabel: def ? def.traits.join('、') : '',
    definition: def?.description || '',
    traits: def?.traits || [],
    responseStyle: def?.responseStyle || '平和、清晰'
  };
}

/**
 * 生成对话风格指导字符串（供上层注入使用）
 * @param {string} emotion - 情感类型
 * @param {number} intensity - 强度
 * @returns {string} 风格指导字符串
 */
function generateStyleDirective(emotion, intensity = 3) {
  const guide = getStyleGuide(emotion, intensity);
  return `${guide.emoji} [${guide.tone}] ${guide.responseMode}。当前情感：${guide.definition}。`;
}

/**
 * 获取 emoji 前缀
 */
function getEmojiPrefix(emotion) {
  return emojiPrefix[emotion] || '💭';
}

module.exports = {
  getStyleGuide,
  generateStyleDirective,
  getEmojiPrefix,
  styleGuides
};
