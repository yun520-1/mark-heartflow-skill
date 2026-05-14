/**
 * EmotionTrigger - 表层情感触发器
 * 检测是否需要情感响应，返回建议情感
 *
 * 优化点：
 * - 从 EmotionKeywords.js 统一导入关键词
 * - detectEmotionNeed() 增加 textAnalysis：检测感叹号数量、问号数量、文本长度
 */

const { EmotionTypes } = require('./EmotionStates');
const { detectKeywordsWithWeight, gratefulWords, exclamationWords } = require('./EmotionKeywords');
const { padToEmotion } = require('./EmotionTransition');

/**
 * 情感分类映射
 */
const categoryEmotionMap = {
  positive: EmotionTypes.JOY,
  negative: EmotionTypes.CONCERNED,
  stress: EmotionTypes.CONCERNED,
  tired: EmotionTypes.TIRED,
  excited: EmotionTypes.EXCITED,
  grateful: EmotionTypes.JOY,
  question: EmotionTypes.CURIOUS,
  calm: EmotionTypes.CALM
};

/**
 * 基于关键词分类推断目标情感
 * @param {object} detected - detectKeywordsWithWeight 的结果
 * @returns {{ emotion: string|null, reason: string }}
 */
function categorizeToEmotion(detected) {
  // 感谢优先
  if (detected.grateful) {
    return { emotion: EmotionTypes.JOY, reason: '感谢回应' };
  }

  // 兴奋词检测（优先级高）
  if (detected.excited) {
    return { emotion: EmotionTypes.EXCITED, reason: `兴奋词: ${detected.excited.matchedWords.join(', ')}` };
  }

  // 感叹词（无其他情感词时）
  if (detected.exclamation && !detected.positive && !detected.negative && !detected.stress && !detected.tired) {
    return { emotion: EmotionTypes.EXCITED, reason: '感叹表达' };
  }

  // 正面情绪词
  if (detected.positive) {
    return { emotion: EmotionTypes.JOY, reason: `正面情绪词: ${detected.positive.matchedWords.join(', ')}` };
  }

  // 负面情绪词
  if (detected.negative) {
    return { emotion: EmotionTypes.CONCERNED, reason: `负面情绪词: ${detected.negative.matchedWords.join(', ')}` };
  }

  // 压力词
  if (detected.stress) {
    return { emotion: EmotionTypes.CONCERNED, reason: `压力词: ${detected.stress.matchedWords.join(', ')}` };
  }

  // 疲惫词
  if (detected.tired) {
    return { emotion: EmotionTypes.TIRED, reason: `疲惫词: ${detected.tired.matchedWords.join(', ')}` };
  }

  // 疑问词
  if (detected.question) {
    return { emotion: EmotionTypes.CURIOUS, reason: '疑问句' };
  }

  // 平静词
  if (detected.calm) {
    return { emotion: EmotionTypes.CALM, reason: '平静表达' };
  }

  return null;
}

/**
 * 文本分析：提取文本特征
 * @param {string} text - 用户输入
 * @returns {{ exclamationCount, questionCount, length, hasPunctuation, sentimentScore }}
 */
function analyzeText(text) {
  // 统计感叹号数量（中文！和英文 !）
  const exclamationCount = (text.match(/[!！]/g) || []).length;

  // 统计问号数量（中文？和英文 ?）
  const questionCount = (text.match(/[?？]/g) || []).length;

  // 文本长度
  const length = text.length;

  // 是否包含标点
  const hasPunctuation = /[,，.。!！?？;；]/.test(text);

  // 简单情感得分（基于标点推断）
  let sentimentScore = 0;
  if (exclamationCount > 0) sentimentScore += exclamationCount * 0.15;
  if (questionCount > 0) sentimentScore -= questionCount * 0.1;

  return {
    exclamationCount,
    questionCount,
    length,
    hasPunctuation,
    sentimentScore: Math.round(sentimentScore * 100) / 100
  };
}

/**
 * 检测是否需要情感响应
 * @param {string} text - 用户输入
 * @param {object} padState - DeepEmotion PAD 状态（可选）
 * @returns {{ needsEmotion: boolean, matchedKeywords: string[], suggestedEmotion: string|null, reason: string|null, textAnalysis: object }}
 */
function detectEmotionNeed(text, padState = null) {
  const detected = detectKeywordsWithWeight(text);
  const textAnalysis = analyzeText(text);
  const categorized = categorizeToEmotion(detected);

  // 收集所有匹配的关键词
  const allKeywords = [];
  for (const [category, data] of Object.entries(detected)) {
    if (!data?.matchedWords) continue;
    allKeywords.push(...data.matchedWords);
  }

  // 判断是否需要情感响应
  const needsEmotion = !!(
    categorized ||
    textAnalysis.exclamationCount > 0 ||
    textAnalysis.questionCount > 0 ||
    textAnalysis.length > 100 ||
    allKeywords.length > 0
  );

  // 如果没有明确分类但有 PAD 状态，尝试用 PAD 推断
  let suggestedEmotion = categorized?.emotion || null;
  let reason = categorized?.reason || null;

  if (!suggestedEmotion && padState) {
    const padResult = padToEmotion(padState);
    if (padResult.confidence > 0.4) {
      suggestedEmotion = padResult.emotion;
      reason = `PAD 推断 (置信度: ${padResult.confidence})`;
    }
  }

  return {
    needsEmotion,
    matchedKeywords: [...new Set(allKeywords)],
    suggestedEmotion,
    reason,
    textAnalysis
  };
}

/**
 * 简化版：检测情感关键词
 * @param {string} text - 用户输入
 * @returns {object} - 关键词分类结果
 */
function matchWordCategories(text) {
  const detected = detectKeywordsWithWeight(text);
  const result = { emotion: [], question: false, thanks: false, exclamation: false };

  for (const [category, data] of Object.entries(detected)) {
    result.emotion.push(...data.matchedWords);
  }

  result.question = !!(detected.question);
  result.thanks = !!(detected.grateful);
  result.exclamation = !!(detected.exclamation);

  return result;
}

module.exports = { detectEmotionNeed, matchWordCategories, categorizeToEmotion, analyzeText };
