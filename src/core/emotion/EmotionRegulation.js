/**
 * EmotionRegulation - 情感调节引擎
 *
 * 基于 Gross (1998, 2015) 的情感调节过程模型：
 * 五大策略（按调节时机排序）：
 * 1. Situation Selection (情境选择) - 趋近积极情境，规避消极情境
 * 2. Situation Modification (情境修正) - 改变情境使情绪好转
 * 3. Attentional Deployment (注意力部署) - 分心或关注
 * 4. Cognitive Change (认知改变) - 重新评估/重新诠释
 * 5. Response Modulation (反应调节) - 调节情绪表达和生理反应
 *
 * 同时实现：
 * - reappraisal（认知重评）
 * - suppression（抑制表达）
 * - acceptance（接受情绪）
 * - mindfulness（正念觉察）
 */

const { EmotionTypes } = require('./EmotionStates');

/**
 * 情感调节策略库
 */
const REGULATION_STRATEGIES = {
  reappraisal: {
    name: '认知重评',
    english: 'Cognitive Reappraisal',
    description: '改变对情境的解释，使情绪向积极方向转变',
    effectiveness: 0.8,
   适用场景: ['焦虑', '担忧', '愤怒', '恐惧'],
    examples: [
      '虽然遇到了困难，但这也是学习的机会',
      '这个问题看起来难，但一定有解决办法',
      '挫折是成长的必经之路'
    ],
    // 调节效果：对 valence 和 arousal 的调整
    padEffect: { valence: +0.3, arousal: -0.1 }
  },
  suppression: {
    name: '表达抑制',
    english: 'Expression Suppression',
    description: '抑制情绪的外在表达，不改变内在情绪体验',
    effectiveness: 0.3,
    适用场景: ['愤怒', '激动'],
    examples: [
      '深呼吸，先冷静下来',
      '我需要控制一下自己的情绪'
    ],
    padEffect: { valence: 0, arousal: +0.2 } // 抑制会让唤醒度更高
  },
  acceptance: {
    name: '情绪接受',
    english: 'Emotional Acceptance',
    description: '承认并接受当前情绪，不评判、不压抑',
    effectiveness: 0.6,
    适用场景: ['悲伤', '恐惧', '焦虑', '持续负面情绪'],
    examples: [
      '我现在感到难过，这是正常的',
      '我允许自己今天感到疲惫',
      '感受情绪，但不迷失在其中'
    ],
    padEffect: { valence: +0.1, arousal: -0.2 }
  },
  mindfulness: {
    name: '正念觉察',
    english: 'Mindfulness',
    description: '以旁观者视角觉察情绪，不陷入不评判',
    effectiveness: 0.7,
    适用场景: ['强烈情绪', '焦虑', '愤怒', '持续压力'],
    examples: [
      '我注意到自己现在感到焦虑，但它只是暂时的',
      '情绪像云一样来来去去，我允许它们存在'
    ],
    padEffect: { valence: +0.1, arousal: -0.3 }
  },
  distraction: {
    name: '注意力转移',
    english: 'Attentional Deployment',
    description: '将注意力从负面情绪转移到其他事物',
    effectiveness: 0.5,
    适用场景: ['持续担忧', '悲伤', '愤怒'],
    examples: [
      '让我先换个话题',
      '我们来聊聊别的事情吧'
    ],
    padEffect: { valence: +0.2, arousal: -0.1 }
  },
  situationSelection: {
    name: '情境选择',
    english: 'Situation Selection',
    description: '主动选择或创造能带来积极情绪的情境',
    effectiveness: 0.9,
    适用场景: ['长期负面', '疲惫'],
    examples: [
      '我需要休息一下，换个环境',
      '也许可以先做点让自己开心的事'
    ],
    padEffect: { valence: +0.4, arousal: 0 }
  },
  situationModification: {
    name: '情境修正',
    english: 'Situation Modification',
    description: '改变当前情境的某些方面使其改善',
    effectiveness: 0.7,
    适用场景: ['愤怒', '焦虑', '受挫'],
    examples: [
      '让我重新调整一下计划',
      '也许可以换个方式来处理'
    ],
    padEffect: { valence: +0.2, arousal: -0.1 }
  }
};

/**
 * 情感类型 → 推荐调节策略映射
 */
const EMOTION_REGULATION_MAP = {
  [EmotionTypes.CONCERNED]: ['acceptance', 'reappraisal', 'mindfulness'],
  [EmotionTypes.TIRED]: ['situationSelection', 'acceptance', 'distraction'],
  [EmotionTypes.CALM]: [], // 平静状态无需调节
  [EmotionTypes.JOY]: [], // 积极情绪无需抑制
  [EmotionTypes.CURIOUS]: ['reappraisal'],
  [EmotionTypes.EXCITED]: ['suppression', 'mindfulness']
};

class EmotionRegulation {
  constructor() {
    this.strategyHistory = [];   // 调节历史
    this.effectivenessHistory = []; // 策略效果历史
    this.currentRegulation = null; // 当前正在使用的策略
    this.totalRegulations = 0;
  }

  /**
   * 获取当前情感推荐的调节策略
   * @param {string} emotion - 表面情感类型
   * @param {object} context - 上下文 { intensity?, recentStrategies? }
   * @returns {Array} - 推荐策略列表（按优先级排序）
   */
  getRecommendedStrategies(emotion, context = {}) {
    const recommended = EMOTION_REGULATION_MAP[emotion] || ['reappraisal', 'acceptance'];

    // 过滤近期已用过的策略（避免重复）
    const recentLimit = context.recentStrategies || [];
    const fresh = recommended.filter(s => !recentLimit.includes(s));

    return (fresh.length > 0 ? fresh : recommended.slice(0, 2)).map(name => ({
      name,
      ...REGULATION_STRATEGIES[name]
    }));
  }

  /**
   * 选择最佳调节策略
   * @param {string} emotion - 当前情感
   * @param {number} intensity - 情感强度 1-5
   * @param {object} context - 上下文
   * @returns {object} - 选中的策略
   */
  selectBestStrategy(emotion, intensity = 3, context = {}) {
    const recommended = this.getRecommendedStrategies(emotion, context);

    if (recommended.length === 0) {
      return null; // 无需调节
    }

    // 基于强度选择策略
    // 高强度：选择更温和的策略（acceptance, mindfulness）
    // 低强度：可以选择更主动的策略（reappraisal, situation modification）
    let strategy;
    if (intensity >= 4) {
      strategy = recommended.find(s => ['acceptance', 'mindfulness', 'distraction'].includes(s.name));
    }
    if (!strategy) {
      // 默认选择第一个推荐的
      strategy = recommended[0];
    }

    // 获取策略示例
    const example = strategy.examples[Math.floor(Math.random() * strategy.examples.length)];

    return {
      ...strategy,
      example,
      effectiveness: strategy.effectiveness + (intensity > 3 ? -0.1 : 0)
    };
  }

  /**
   * 应用调节策略
   * @param {string} strategyName - 策略名称
   * @param {object} currentPad - 当前 PAD 状态 { valence, arousal, dominance }
   * @returns {object} - 调节后的 PAD 状态
   */
  applyStrategy(strategyName, currentPad = { valence: 0, arousal: 0, dominance: 0 }) {
    const strategy = REGULATION_STRATEGIES[strategyName];
    if (!strategy) {
      return { ...currentPad, regulated: false };
    }

    const newPad = {
      valence: clamp(currentPad.valence + strategy.padEffect.valence, -1, 1),
      arousal: clamp(currentPad.arousal + strategy.padEffect.arousal, -1, 1),
      dominance: currentPad.dominance
    };

    // 记录历史
    this.strategyHistory.push({
      strategy: strategyName,
      timestamp: Date.now(),
      effect: strategy.padEffect
    });

    this.totalRegulations++;

    this.currentRegulation = {
      strategy: strategyName,
      appliedAt: Date.now()
    };

    return {
      ...newPad,
      regulated: true,
      strategyUsed: strategyName,
      effectiveness: strategy.effectiveness
    };
  }

  /**
   * 生成调节建议文本
   * @param {string} emotion - 当前情感
   * @param {number} intensity - 强度
   * @returns {object} - { suggestion, phrases, strategy }
   */
  generateSuggestion(emotion, intensity) {
    const strategy = this.selectBestStrategy(emotion, intensity);

    if (!strategy) {
      return {
        suggestion: '当前情绪状态良好，无需特别调节。',
        phrases: [],
        strategy: null
      };
    }

    return {
      suggestion: `${strategy.name}：${strategy.description}`,
      phrases: strategy.examples,
      strategy: {
        name: strategy.name,
        effectiveness: strategy.effectiveness,
        example: strategy.example
      }
    };
  }

  /**
   * 获取调节统计
   */
  getStats() {
    const total = this.strategyHistory.length;
    if (total === 0) return { total: 0, strategies: {} };

    const strategies = {};
    for (const entry of this.strategyHistory) {
      strategies[entry.strategy] = (strategies[entry.strategy] || 0) + 1;
    }

    const avgEffectiveness = this.effectivenessHistory.length > 0
      ? this.effectivenessHistory.reduce((a, b) => a + b, 0) / this.effectivenessHistory.length
      : 0;

    return {
      total,
      strategies,
      avgEffectiveness: Math.round(avgEffectiveness * 100) / 100,
      lastStrategy: this.strategyHistory[this.strategyHistory.length - 1]?.strategy || null
    };
  }

  /**
   * 重置
   */
  reset() {
    this.strategyHistory = [];
    this.effectivenessHistory = [];
    this.currentRegulation = null;
    this.totalRegulations = 0;
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = { EmotionRegulation, REGULATION_STRATEGIES, EMOTION_REGULATION_MAP };
