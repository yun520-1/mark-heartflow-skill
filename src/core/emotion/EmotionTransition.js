/**
 * EmotionTransition - 表层情感转换引擎
 * 基于关键词规则 + DeepEmotion PAD 状态驱动情感转换
 */

const { EmotionTypes, EmotionDefinitions, createEmotionState } = require('./EmotionStates');

// 情感触发关键词映射
const emotionKeywords = {
  [EmotionTypes.CALM]: {
    keywords: ['冷静', '平静', '淡定', '慢慢来', '不急', '稳', '放松'],
    padBoost: { valence: +0.2, arousal: -0.1, dominance: +0.1 }
  },
  [EmotionTypes.JOY]: {
    keywords: ['开心', '高兴', '好棒', '太棒了', '喜欢', '谢谢', '太好了', '不错', 'happy', 'great', 'thanks'],
    padBoost: { valence: +0.5, arousal: +0.2, dominance: +0.1 }
  },
  [EmotionTypes.CURIOUS]: {
    keywords: ['为什么', '怎么', '什么', '如何', '为什么呢', '好奇', '想知道', 'why', 'how', 'what', '?'],
    padBoost: { valence: +0.1, arousal: +0.3, dominance: 0 }
  },
  [EmotionTypes.CONCERNED]: {
    keywords: ['难过', '伤心', '担心', '害怕', '怎么办', '焦虑', '压力大', '累', 'sad', 'worried', 'afraid'],
    padBoost: { valence: -0.3, arousal: +0.2, dominance: -0.2 }
  },
  [EmotionTypes.TIRED]: {
    keywords: ['累了', '困了', '休息', '睡觉', '好累', '疲惫', 'tired', 'sleepy', 'rest'],
    padBoost: { valence: -0.1, arousal: -0.4, dominance: -0.3 }
  },
  [EmotionTypes.EXCITED]: {
    keywords: ['太激动了', '厉害', '牛', '突破', '创意', '爆发', 'excited', 'amazing', 'breakthrough', 'wow'],
    padBoost: { valence: +0.6, arousal: +0.6, dominance: +0.3 }
  }
};

/**
 * 从文本中检测匹配的关键词
 */
function detectKeywords(text) {
  const lower = text.toLowerCase();
  const matched = {};
  for (const [emotion, config] of Object.entries(emotionKeywords)) {
    const hits = config.keywords.filter(kw => lower.includes(kw.toLowerCase()));
    if (hits.length > 0) {
      matched[emotion] = hits;
    }
  }
  return matched;
}

/**
 * 从 DeepEmotion PAD 状态推断情感倾向
 */
function padToEmotion(pad) {
  const { valence = 0, arousal = 0, dominance = 0 } = pad;
  const v = valence > 0 ? 1 : -1;
  const a = arousal > 0 ? 1 : -1;
  const d = dominance > 0 ? 1 : -1;

  // 高唤醒 + 高效价 → 兴奋
  if (arousal > 0.5 && valence > 0.3) return EmotionTypes.EXCITED;
  // 高效价 + 低唤醒 → 愉悦
  if (valence > 0.3 && arousal < 0.3) return EmotionTypes.JOY;
  // 低效价 + 低支配 → 疲惫/关切
  if (valence < -0.2 && dominance < 0) return EmotionTypes.CONCERNED;
  // 低唤醒 + 低效价 → 疲惫
  if (arousal < -0.2 && valence < 0) return EmotionTypes.TIRED;
  // 高唤醒 + 疑问词 → 好奇
  if (arousal > 0.3) return EmotionTypes.CURIOUS;
  // 默认平静
  return EmotionTypes.CALM;
}

/**
 * 核心转换函数
 * @param {string} userInput - 用户输入
 * @param {object} currentPadState - DeepEmotion 的 PAD 状态 { valence, arousal, dominance }
 * @param {object} currentSurfaceEmotion - 当前表层情感状态 { emotion, intensity, timestamp }
 * @returns {{ from, to, intensity, triggers, decayMinutes }}
 */
function transition(userInput, currentPadState = {}, currentSurfaceEmotion = null) {
  const keywordMatched = detectKeywords(userInput);
  const padInferredEmotion = padToEmotion(currentPadState);

  // 关键词命中优先级最高
  let targetEmotion = padInferredEmotion;
  let intensity = 3;
  const triggers = [];

  if (Object.keys(keywordMatched).length > 0) {
    // 取关键词匹配数量最多的情感
    const sorted = Object.entries(keywordMatched)
      .sort((a, b) => b[1].length - a[1].length);
    targetEmotion = sorted[0][0];
    triggers.push(...sorted[0][1]);
    intensity = Math.min(5, 2 + sorted[0][1].length);
  }

  // 计算自然衰减
  const def = EmotionDefinitions[targetEmotion];
  const decayMinutes = def?.naturalDecayMinutes ?? null;

  // 如果有新输入，即使情感相同也重置强度
  if (currentSurfaceEmotion && currentSurfaceEmotion.emotion === targetEmotion) {
    intensity = Math.max(currentSurfaceEmotion.intensity, intensity);
  }

  return {
    from: currentSurfaceEmotion?.emotion || null,
    to: targetEmotion,
    intensity,
    triggers,
    decayMinutes
  };
}

module.exports = { transition, detectKeywords, padToEmotion };
