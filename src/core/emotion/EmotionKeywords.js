/**
 * EmotionKeywords - 统一情感关键词库
 * 所有模块从这里导入，避免重复定义
 */

const positiveWords = [
  { word: '开心', weight: 0.9 },
  { word: '高兴', weight: 0.9 },
  { word: '快乐', weight: 0.9 },
  { word: '棒', weight: 0.8 },
  { word: '好', weight: 0.6 },
  { word: '喜欢', weight: 0.8 },
  { word: '满意', weight: 0.7 },
  { word: 'happy', weight: 0.8 },
  { word: 'joy', weight: 0.9 },
  { word: 'glad', weight: 0.7 },
  { word: 'great', weight: 0.8 },
  { word: 'thanks', weight: 0.7 },
  { word: '不错', weight: 0.6 },
  { word: '太好了', weight: 0.9 },
  { word: '谢谢', weight: 0.7 },
  { word: '感激', weight: 0.8 },
  { word: '感恩', weight: 0.8 },
  { word: ' appreciate', weight: 0.7 }
];

const negativeWords = [
  { word: '难过', weight: 0.8 },
  { word: '伤心', weight: 0.9 },
  { word: '痛苦', weight: 0.8 },
  { word: '难受', weight: 0.7 },
  { word: '糟糕', weight: 0.7 },
  { word: '失望', weight: 0.7 },
  { word: 'sad', weight: 0.8 },
  { word: 'unhappy', weight: 0.8 },
  { word: 'hurt', weight: 0.7 }
];

const stressWords = [
  { word: '压力', weight: 0.8 },
  { word: '紧张', weight: 0.7 },
  { word: '焦虑', weight: 0.9 },
  { word: '担心', weight: 0.7 },
  { word: '害怕', weight: 0.8 },
  { word: 'stress', weight: 0.8 },
  { word: 'anxious', weight: 0.8 },
  { word: 'worried', weight: 0.7 },
  { word: 'fear', weight: 0.8 }
];

const tiredWords = [
  { word: '累', weight: 0.8 },
  { word: '困', weight: 0.7 },
  { word: '疲惫', weight: 0.9 },
  { word: '疲倦', weight: 0.8 },
  { word: '休息', weight: 0.6 },
  { word: 'tired', weight: 0.8 },
  { word: 'sleepy', weight: 0.7 },
  { word: 'exhausted', weight: 0.9 },
  { word: '好累', weight: 0.8 },
  { word: '累了', weight: 0.8 }
];

const gratefulWords = [
  { word: '谢谢', weight: 0.8 },
  { word: '感谢', weight: 0.9 },
  { word: '感激', weight: 0.9 },
  { word: '感恩', weight: 0.9 },
  { word: 'thanks', weight: 0.8 },
  { word: 'appreciate', weight: 0.9 },
  { word: 'grateful', weight: 0.9 },
  { word: '多谢', weight: 0.8 }
];

const excitedWords = [
  { word: '太激动了', weight: 1.0 },
  { word: '厉害', weight: 0.8 },
  { word: '牛', weight: 0.8 },
  { word: '突破', weight: 0.9 },
  { word: '创意', weight: 0.7 },
  { word: '爆发', weight: 0.8 },
  { word: 'excited', weight: 0.9 },
  { word: 'amazing', weight: 0.9 },
  { word: 'breakthrough', weight: 1.0 },
  { word: 'wow', weight: 0.9 },
  { word: '太棒了', weight: 1.0 },
  { word: '激动', weight: 0.8 }
];

const questionWords = [
  { word: '为什么', weight: 0.8 },
  { word: '怎么', weight: 0.7 },
  { word: '什么', weight: 0.6 },
  { word: '如何', weight: 0.7 },
  { word: '是不是', weight: 0.6 },
  { word: '能不能', weight: 0.6 },
  { word: 'why', weight: 0.8 },
  { word: 'how', weight: 0.7 },
  { word: 'what', weight: 0.6 },
  { word: 'which', weight: 0.5 },
  { word: '?', weight: 0.5 },
  { word: '为什么呢', weight: 0.9 },
  { word: '想知道', weight: 0.8 },
  { word: '好奇', weight: 0.8 }
];

const calmWords = [
  { word: '冷静', weight: 0.8 },
  { word: '平静', weight: 0.9 },
  { word: '淡定', weight: 0.8 },
  { word: '慢慢来', weight: 0.7 },
  { word: '不急', weight: 0.7 },
  { word: '稳', weight: 0.6 },
  { word: '放松', weight: 0.8 }
];

const exclamationWords = [
  { word: '哇', weight: 0.8 },
  { word: '呀', weight: 0.6 },
  { word: '啊', weight: 0.5 },
  { word: '哇哦', weight: 0.9 },
  { word: '天哪', weight: 0.9 },
  { word: 'wow', weight: 0.9 },
  { word: 'omg', weight: 0.9 },
  { word: 'hey', weight: 0.5 }
];

/**
 * 从文本中检测匹配的关键词及其权重
 * @param {string} text - 用户输入
 * @returns {object} - { emotionType: { matchedWords: [], totalWeight: number, avgWeight: number } }
 */
function detectKeywordsWithWeight(text) {
  const lower = text.toLowerCase();
  const allCategories = {
    positive: positiveWords,
    negative: negativeWords,
    stress: stressWords,
    tired: tiredWords,
    grateful: gratefulWords,
    excited: excitedWords,
    question: questionWords,
    calm: calmWords,
    exclamation: exclamationWords
  };

  const result = {};

  for (const [category, words] of Object.entries(allCategories)) {
    const matched = words.filter(item => lower.includes(item.word.toLowerCase()));
    if (matched.length > 0) {
      const totalWeight = matched.reduce((sum, item) => sum + item.weight, 0);
      result[category] = {
        matchedWords: matched.map(m => m.word),
        totalWeight,
        avgWeight: totalWeight / matched.length,
        count: matched.length
      };
    }
  }

  return result;
}

/**
 * 简化版：检测关键词（返回命中的词列表）
 */
function detectKeywords(text) {
  const detected = detectKeywordsWithWeight(text);
  const result = {};

  if (detected.positive) result.positive = detected.positive.matchedWords;
  if (detected.negative) result.negative = detected.negative.matchedWords;
  if (detected.stress) result.stress = detected.stress.matchedWords;
  if (detected.tired) result.tired = detected.tired.matchedWords;
  if (detected.grateful) result.grateful = detected.grateful.matchedWords;
  if (detected.excited) result.excited = detected.excited.matchedWords;
  if (detected.question) result.question = detected.question.matchedWords;
  if (detected.calm) result.calm = detected.calm.matchedWords;
  if (detected.exclamation) result.exclamation = detected.exclamation.matchedWords;

  return result;
}

/**
 * 获取某类情感词表
 */
function getWords(category) {
  const map = {
    positive: positiveWords,
    negative: negativeWords,
    stress: stressWords,
    tired: tiredWords,
    grateful: gratefulWords,
    excited: excitedWords,
    question: questionWords,
    calm: calmWords,
    exclamation: exclamationWords
  };
  return map[category] || [];
}

module.exports = {
  positiveWords,
  negativeWords,
  stressWords,
  tiredWords,
  gratefulWords,
  excitedWords,
  questionWords,
  calmWords,
  exclamationWords,
  detectKeywords,
  detectKeywordsWithWeight,
  getWords
};
