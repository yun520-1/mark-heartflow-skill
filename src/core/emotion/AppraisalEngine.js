/**
 * AppraisalEngine - 基于 Scherer 的情感评估理论
 *
 * 参考：Scherer (2001) "Appraisal Considered as a Process of Sequential Check"
 * 情感评估维度：
 * 1. Novelty (新奇性) - 刺激是新的/熟悉的/预期的？
 * 2. Intrinsic Pleasantness (内在愉悦) - 刺激本身是愉快还是痛苦？
 * 3. Goal Relevance (目标关联) - 刺激对当前目标重要吗？
 * 4. Outcome Probability (结果概率) - 期望的结果发生的可能性？
 * 5. Coping Potential (应对潜力) - 有能力处理这个情况吗？
 * 6. Accountability (责任归因) - 谁对这个结果负责？
 */

const EMOTION_APPRAISAL_PROFILES = {
  // 新奇性高 + 内在不愉快 + 低应对 → 恐惧
  fear: {
    novelty: { min: 0.6, max: 1.0 },
    pleasantness: { min: -1.0, max: -0.3 },
    goalRelevance: { min: 0.5, max: 1.0 },
    copingPotential: { min: -1.0, max: 0.2 },
    accountability: null
  },
  // 新奇性高 + 内在愉快 + 高应对 → 喜悦/兴奋
  joy: {
    novelty: { min: 0.3, max: 1.0 },
    pleasantness: { min: 0.4, max: 1.0 },
    goalRelevance: { min: 0.3, max: 1.0 },
    copingPotential: { min: 0.3, max: 1.0 },
    accountability: null
  },
  // 新奇性中 + 内在不愉快 + 低目标关联 → 悲伤
  sadness: {
    novelty: { min: 0.0, max: 0.6 },
    pleasantness: { min: -1.0, max: -0.4 },
    goalRelevance: { min: 0.5, max: 1.0 },
    copingPotential: { min: -1.0, max: 0.1 },
    accountability: null
  },
  // 新奇性高 + 低应对 + 高责任外归因 → 愤怒
  anger: {
    novelty: { min: 0.4, max: 1.0 },
    pleasantness: { min: -1.0, max: -0.2 },
    goalRelevance: { min: 0.6, max: 1.0 },
    copingPotential: { min: 0.3, max: 1.0 }, // 高应对潜力（想要对抗）
    accountability: { target: 'other', weight: 0.8 }
  },
  // 新奇性高 + 内在中性/愉快 + 低目标关联 → 好奇
  curiosity: {
    novelty: { min: 0.6, max: 1.0 },
    pleasantness: { min: -0.2, max: 1.0 },
    goalRelevance: { min: 0.0, max: 0.5 },
    copingPotential: { min: 0.2, max: 1.0 },
    accountability: null
  },
  // 新奇性低 + 内在愉快 + 高目标关联 + 高应对 → 希望
  hope: {
    novelty: { min: 0.0, max: 0.4 },
    pleasantness: { min: 0.3, max: 1.0 },
    goalRelevance: { min: 0.6, max: 1.0 },
    outcomeProbability: { min: 0.3, max: 0.7 },
    copingPotential: { min: 0.4, max: 1.0 },
    accountability: null
  },
  // 高目标关联 + 低应对 + 内在不愉快 → 焦虑/担忧
  anxiety: {
    novelty: { min: 0.3, max: 0.8 },
    pleasantness: { min: -1.0, max: -0.2 },
    goalRelevance: { min: 0.7, max: 1.0 },
    outcomeProbability: { min: 0.0, max: 0.4 },
    copingPotential: { min: -1.0, max: 0.3 },
    accountability: null
  },
  // 新奇性高 + 低目标关联 + 高内在愉快 → 惊喜/惊讶
  surprise: {
    novelty: { min: 0.8, max: 1.0 },
    pleasantness: { min: -0.5, max: 0.5 },
    goalRelevance: { min: 0.0, max: 1.0 },
    accountability: null
  },
  // 高内在愉快 + 高目标关联 + 高应对 + 外归因 → 自豪
  pride: {
    novelty: { min: 0.0, max: 0.5 },
    pleasantness: { min: 0.5, max: 1.0 },
    goalRelevance: { min: 0.7, max: 1.0 },
    copingPotential: { min: 0.6, max: 1.0 },
    accountability: { target: 'self', weight: 0.9 }
  },
  // 低内在愉快 + 低目标关联 + 低应对 + 外归因 → 羞耻
  shame: {
    novelty: { min: 0.0, max: 0.4 },
    pleasantness: { min: -1.0, max: -0.3 },
    goalRelevance: { min: 0.4, max: 1.0 },
    copingPotential: { min: -1.0, max: 0.2 },
    accountability: { target: 'self', weight: 0.8 }
  }
};

/**
 * 关键词 → 评估维度映射
 */
const WORD_APPRAISAL_PATTERNS = {
  // 新奇性
  novelty: {
    high: ['新', '第一次', '首次', '陌生', '突然', '意外', 'new', 'first', 'sudden', 'unexpected', 'surprise'],
    low: ['熟悉', '习惯', '一直', '总是', 'known', 'familiar', 'always', 'habit']
  },
  // 内在愉悦
  pleasantness: {
    positive: ['开心', '快乐', '棒', '好', '喜欢', '满意', 'happy', 'joy', 'good', 'great', 'love', 'like'],
    negative: ['难过', '痛苦', '糟糕', '讨厌', '伤心', '累', '疲惫', '困', 'sad', 'pain', 'hate', 'bad', 'terrible', 'tired', 'exhausted', 'exhausting']
  },
  // 目标关联
  goalRelevance: {
    high: ['重要', '关键', '必须', '一定', '需要', 'important', 'must', 'need', 'critical'],
    low: ['无所谓', '随便', '不重要', '无所谓', 'unimportant', 'whatever', 'dontcare']
  },
  // 应对潜力
  copingPotential: {
    high: ['能', '可以', '会', '解决', 'handle', 'can', 'able', 'solve', 'fix'],
    low: ['不会', '不能', '没办法', '难', 'cant', 'cannot', 'unable', 'difficult']
  },
  // 责任归因
  accountability: {
    self: ['我', '我的', '都怪我', '是我的错', 'i', 'my', 'me', 'myself'],
    other: ['你', '他', '他们', '都怪他', 'you', 'he', 'they', 'them']
  }
};

/**
 * 分析文本，计算 appraisal 维度分数
 * @param {string} text - 用户输入
 * @param {object} context - 上下文 { userGoal?, previousOutcome? }
 * @returns {object} - 六个 appraisal 维度分数
 */
function appraise(text, context = {}) {
  const lower = text.toLowerCase();

  const novelty = calcNovelty(lower);
  const pleasantness = calcIntrinsicPleasantness(lower);
  const goalRelevance = calcGoalRelevance(lower, context);
  const outcomeProbability = calcOutcomeProbability(lower, context);
  const copingPotential = calcCopingPotential(lower, context);
  const accountability = calcAccountability(lower);

  return {
    novelty: round(novelty),
    pleasantness: round(pleasantness),
    goalRelevance: round(goalRelevance),
    outcomeProbability: round(outcomeProbability),
    copingPotential: round(copingPotential),
    accountability
  };
}

function calcNovelty(text) {
  const patterns = WORD_APPRAISAL_PATTERNS.novelty;
  const hits = patterns.high.filter(w => text.includes(w.toLowerCase())).length;
  const antiHits = patterns.low.filter(w => text.includes(w.toLowerCase())).length;
  return clamp(0.5 + (hits - antiHits) * 0.15, 0, 1);
}

function calcIntrinsicPleasantness(text) {
  const patterns = WORD_APPRAISAL_PATTERNS.pleasantness;
  const posHits = patterns.positive.filter(w => text.includes(w.toLowerCase())).length;
  const negHits = patterns.negative.filter(w => text.includes(w.toLowerCase())).length;
  return clamp((posHits - negHits) * 0.25, -1, 1);
}

function calcGoalRelevance(text, context = {}) {
  if (context.userGoal && text.includes(context.userGoal.toLowerCase())) {
    return 0.8;
  }
  const patterns = WORD_APPRAISAL_PATTERNS.goalRelevance;
  const high = patterns.high.filter(w => text.includes(w.toLowerCase())).length;
  const low = patterns.low.filter(w => text.includes(w.toLowerCase())).length;
  return clamp(0.5 + (high - low) * 0.2, 0, 1);
}

function calcOutcomeProbability(text, context = {}) {
  // 检测期望词
  if (/希望|期待|应该|会|expect|hope|should|will/.test(text)) return 0.6;
  if (/担心|怕|不确定|doubt|worry|uncertain/.test(text)) return 0.3;
  return 0.5;
}

function calcCopingPotential(text, context = {}) {
  const patterns = WORD_APPRAISAL_PATTERNS.copingPotential;
  const high = patterns.high.filter(w => text.includes(w.toLowerCase())).length;
  const low = patterns.low.filter(w => text.includes(w.toLowerCase())).length;
  // 问句通常暗示低应对（因为在寻求帮助）
  if (/\?$|吗|呢|怎么/.test(text)) {
    return clamp(0.4 + (high - low) * 0.15, 0, 1);
  }
  return clamp(0.5 + (high - low) * 0.2, 0, 1);
}

function calcAccountability(text) {
  const patterns = WORD_APPRAISAL_PATTERNS.accountability;
  const selfHits = patterns.self.filter(w => text.includes(w.toLowerCase())).length;
  const otherHits = patterns.other.filter(w => text.includes(w.toLowerCase())).length;
  if (selfHits > otherHits) return 'self';
  if (otherHits > selfHits) return 'other';
  return 'unknown';
}

/**
 * 基于 appraisal 结果推断情感
 * @param {object} appraisal - appraise() 返回的六个维度
 * @returns {Array} - [{ emotion, score }] 按匹配度排序
 */
function inferEmotionFromAppraisal(appraisal) {
  const scores = {};

  for (const [emotion, profile] of Object.entries(EMOTION_APPRAISAL_PROFILES)) {
    let score = 0;
    let matchCount = 0;

    for (const [dim, profileRange] of Object.entries(profile)) {
      if (profileRange === null) continue;

      const actualValue = appraisal[dim];
      if (actualValue === undefined) continue;

      let dimScore = 0;
      if (dim === 'accountability') {
        // 责任归因特殊处理
        if (profileRange.target === actualValue) {
          dimScore = profileRange.weight || 0.5;
        }
      } else {
        // 数值维度：检查是否在范围内
        const [min, max] = [profileRange.min, profileRange.max];
        if (actualValue >= min && actualValue <= max) {
          // 在范围内，边缘越接近中心得分越高
          const center = (min + max) / 2;
          const dist = Math.abs(actualValue - center) / Math.max(max - min, 0.1);
          dimScore = Math.max(0, 1 - dist);
        }
      }

      score += dimScore;
      matchCount++;
    }

    scores[emotion] = matchCount > 0 ? score / matchCount : 0;
  }

  // 排序返回
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([emotion, score]) => ({ emotion, score: round(score) }))
    .filter(r => r.score > 0.1);
}

/**
 * 简单封装：文本 → 情感推断
 */
function evaluate(text, context = {}) {
  const appraisal = appraise(text, context);
  const emotions = inferEmotionFromAppraisal(appraisal);
  return {
    appraisal,
    emotions,
    primary: emotions[0] || { emotion: 'curiosity', score: 0.5 }
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round(v) {
  return Math.round(v * 100) / 100;
}

module.exports = { appraise, inferEmotionFromAppraisal, evaluate, WORD_APPRAISAL_PATTERNS };
