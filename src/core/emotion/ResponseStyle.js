/**
 * ResponseStyle - 响应风格生成器
 * 根据当前情感生成对应的 responseStyle 指导
 *
 * 优化点：
 * - 从 EmotionKeywords.js 导入（用于动态增强）
 * - getStyleGuide() 增加 emotionTrajectory 字段（上升/平稳/下降）
 * - 增加 generateResponseHint() 方法：结合共情短语 + 风格指导生成完整提示
 */

const { EmotionTypes, EmotionDefinitions } = require('./EmotionStates');
const { generateEmpathy } = require('./EmpathyGenerator');

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
 * 轨迹对应的补充指导
 */
const trajectoryGuidance = {
  rising: '用户的情感正在升温，可以更加投入和热情地回应',
  stable: '用户的情感状态稳定，保持当前节奏即可',
  declining: '用户的情感正在消退，考虑简化回应或引导新话题'
};

/**
 * 生成当前情感对应的完整风格指导对象
 * @param {string} emotion - 情感类型
 * @param {number} intensity - 强度 1-5
 * @param {string} trajectory - 情感轨迹：rising/stable/declining
 * @returns {object} 风格指导
 */
function getStyleGuide(emotion, intensity = 3, trajectory = 'stable') {
  const guide = styleGuides[emotion] || styleGuides[EmotionTypes.CALM];
  const def = EmotionDefinitions[emotion];

  return {
    ...guide,
    emoji: guide.prefix,
    intensity,
    trajectory,
    trajectoryGuidance: trajectoryGuidance[trajectory] || trajectoryGuidance.stable,
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
 * 生成完整的响应提示（结合共情 + 风格）
 * @param {string} emotion - 情感类型
 * @param {number} intensity - 强度 1-5
 * @param {string} trajectory - 情感轨迹
 * @param {string} context - 上下文提示（可选）
 * @returns {object} - { empathyHint, styleHint, fullHint }
 */
function generateResponseHint(emotion, intensity = 3, trajectory = 'stable', context = '') {
  // 生成共情提示
  const empathy = generateEmpathy(emotion, intensity, context);

  // 生成风格指导
  const guide = getStyleGuide(emotion, intensity, trajectory);

  // 完整提示 = 共情短语 + 风格指导
  const fullHint = `${empathy.phrase} ${guide.responseMode}。${empathy.followUp}`;

  return {
    empathyHint: empathy.phrase,
    followUp: empathy.followUp,
    suggestions: empathy.suggestions,
    styleHint: generateStyleDirective(emotion, intensity),
    styleGuide: guide,
    fullHint
  };
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
  generateResponseHint,
  getEmojiPrefix,
  styleGuides,
  trajectoryGuidance
};
