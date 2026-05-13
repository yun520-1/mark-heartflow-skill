/**
 * EmotionTrigger - 表层情感触发器
 * 检测是否需要情感响应，返回建议情感
 */

const { EmotionTypes } = require('./EmotionStates');
const { detectKeywords } = require('./EmotionTransition');

// 情绪关键词
const emotionWords = {
  positive: ['开心', '高兴', '快乐', '愉快', '棒', '好', '喜欢', '满意', 'happy', 'joy', 'glad'],
  negative: ['难过', '伤心', '痛苦', '难受', '糟糕', '失望', 'sad', 'unhappy', 'hurt'],
  stress: ['压力', '紧张', '焦虑', '担心', '害怕', 'stress', 'anxious', 'worried', 'fear'],
  tired: ['累', '困', '疲惫', '疲倦', '休息', 'tired', 'sleepy', 'exhausted'],
  grateful: ['谢谢', '感谢', '感激', '感恩', 'thanks', 'appreciate', 'grateful'],
  excited: ['太棒了', '厉害', '牛', '激动', '兴奋', '突破', 'amazing', 'excited', 'wow']
};

// 疑问词
const questionWords = ['为什么', '怎么', '什么', '如何', '是不是', '能不能', 'why', 'how', 'what', 'which', '?'];

// 感谢词
const thanksWords = ['谢谢', '感谢', '感激', '多谢', 'thanks', 'appreciate'];

// 感叹词
const exclamationWords = ['哇', '呀', '啊', '哇哦', '天哪', 'wow', 'omg', 'hey'];

/**
 * 检测用户输入是否包含特定类型关键词
 */
function matchWordCategories(text) {
  const lower = text.toLowerCase();
  const matched = { emotion: [], question: false, thanks: false, exclamation: false };

  for (const [category, words] of Object.entries(emotionWords)) {
    const hits = words.filter(w => lower.includes(w.toLowerCase()));
    if (hits.length > 0) matched.emotion.push(...hits);
  }

  matched.question = questionWords.some(w => lower.includes(w.toLowerCase()));
  matched.thanks = thanksWords.some(w => lower.includes(w.toLowerCase()));
  matched.exclamation = exclamationWords.some(w => lower.includes(w.toLowerCase()));

  return matched;
}

/**
 * 基于关键词分类推断目标情感
 */
function categorizeToEmotion(matched) {
  const { emotion: emotions, question, thanks, exclamation } = matched;

  if (thanks.length > 0) return { emotion: EmotionTypes.JOY, reason: '感谢回应' };
  if (exclamation && emotions.length === 0) return { emotion: EmotionTypes.EXCITED, reason: '感叹表达' };

  for (const word of emotions) {
    if ([...emotionWords.positive, ...emotionWords.excited].includes(word)) {
      return { emotion: EmotionTypes.JOY, reason: `正面情绪词: ${word}` };
    }
    if (emotionWords.negative.includes(word)) {
      return { emotion: EmotionTypes.CONCERNED, reason: `负面情绪词: ${word}` };
    }
    if (emotionWords.stress.includes(word)) {
      return { emotion: EmotionTypes.CONCERNED, reason: `压力词: ${word}` };
    }
    if (emotionWords.tired.includes(word)) {
      return { emotion: EmotionTypes.TIRED, reason: `疲惫词: ${word}` };
    }
    if (emotionWords.excited.includes(word)) {
      return { emotion: EmotionTypes.EXCITED, reason: `兴奋词: ${word}` };
    }
  }

  if (question) return { emotion: EmotionTypes.CURIOUS, reason: '疑问句' };

  return null;
}

/**
 * 检测是否需要情感响应
 * @param {string} text - 用户输入
 * @returns {{ needsEmotion: boolean, matchedKeywords: string[], suggestedEmotion: string|null }}
 */
function detectEmotionNeed(text) {
  const categories = matchWordCategories(text);
  const keywordMatches = detectKeywords(text);
  const categorized = categorizeToEmotion(categories);

  // 合并所有匹配到的关键词
  const allKeywords = [
    ...categories.emotion,
    ...Object.values(keywordMatches).flatMap(v => Array.isArray(v) ? v : [])
  ];

  // 判断是否需要情感响应
  const needsEmotion = categories.question || categories.thanks ||
    categories.exclamation || categories.emotion.length > 0 ||
    Object.keys(keywordMatches).length > 0;

  return {
    needsEmotion,
    matchedKeywords: [...new Set(allKeywords)],
    suggestedEmotion: categorized?.emotion || null,
    reason: categorized?.reason || null
  };
}

module.exports = { detectEmotionNeed, matchWordCategories, categorizeToEmotion };
