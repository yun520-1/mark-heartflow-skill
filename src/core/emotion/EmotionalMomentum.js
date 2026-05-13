/**
 * EmotionalMomentum - 情感惯性引擎
 *
 * 基于情感累积效应理论：
 * - 情绪不会瞬间消失，而是逐渐衰减
 * - 同向情绪会叠加（momentum）
 * - 反向情绪会抵消
 * - 情感记忆越近，惯性越大
 *
 * 同时实现 Plutchik 情感轮混合：
 * - joy + trust → love
 * - joy + surprise → delight
 * - anger + disgust → contempt
 * - fear + surprise → alarm
 * - sadness + disgust → remorse
 * - sadness + surprise → disappointment
 * - joy + anticipation → optimism
 * - anticipation + surprise → distraction
 * - fear + anger → panic
 */

const { EmotionTypes } = require('./EmotionStates');

/**
 * Plutchik 情感轮混合规则
 * 每对情感按权重比例混合成新情感
 */
const PLUTCHIK_BLEND_RULES = [
  { primary: 'joy', secondary: 'trust', result: 'love', ratio: 0.6 },
  { primary: 'joy', secondary: 'surprise', result: 'delight', ratio: 0.5 },
  { primary: 'anger', secondary: 'disgust', result: 'contempt', ratio: 0.6 },
  { primary: 'fear', secondary: 'surprise', result: 'alarm', ratio: 0.5 },
  { primary: 'sadness', secondary: 'disgust', result: 'remorse', ratio: 0.5 },
  { primary: 'sadness', secondary: 'surprise', result: 'disappointment', ratio: 0.5 },
  { primary: 'joy', secondary: 'anticipation', result: 'optimism', ratio: 0.5 },
  { primary: 'anticipation', secondary: 'surprise', result: 'distraction', ratio: 0.5 },
  { primary: 'fear', secondary: 'anger', result: 'panic', ratio: 0.5 },
  // 额外映射（与表面6情感对应）
  { primary: 'joy', secondary: 'curiosity', result: 'excitement', ratio: 0.4 },
  { primary: 'sadness', secondary: 'fear', result: 'despair', ratio: 0.5 },
  { primary: 'anger', secondary: 'fear', result: 'hostility', ratio: 0.5 }
];

/**
 * DeepEmotion 情绪 → SurfaceEmotion 映射
 */
const DEEP_TO_SURFACE = {
  joy: EmotionTypes.JOY,
  sadness: EmotionTypes.CONCERNED,
  anger: EmotionTypes.CONCERNED,
  fear: EmotionTypes.CONCERNED,
  surprise: EmotionTypes.CURIOUS,
  disgust: EmotionTypes.TIRED,
  trust: EmotionTypes.JOY,
  anticipation: EmotionTypes.CURIOUS,
  love: EmotionTypes.JOY,
  hope: EmotionTypes.EXCITED,
  pride: EmotionTypes.EXCITED,
  shame: EmotionTypes.CONCERNED,
  gratitude: EmotionTypes.JOY,
  compassion: EmotionTypes.CONCERNED,
  curiosity: EmotionTypes.CURIOUS,
  wonder: EmotionTypes.CURIOUS,
  delight: EmotionTypes.EXCITED,
  contempt: EmotionTypes.CONCERNED,
  alarm: EmotionTypes.CONCERNED,
  remorse: EmotionTypes.CONCERNED,
  disappointment: EmotionTypes.CONCERNED,
  optimism: EmotionTypes.JOY,
  distraction: EmotionTypes.CURIOUS,
  panic: EmotionTypes.CONCERNED,
  excitement: EmotionTypes.EXCITED,
  despair: EmotionTypes.CONCERNED,
  hostility: EmotionTypes.CONCERNED
};

/**
 * 情感惯性配置
 */
const MOMENTUM_CONFIG = {
  // 同向情感叠加系数
  sameDirectionBoost: 0.15,
  // 反向情感抵消系数
  oppositeDirectionCancel: 0.25,
  // 最大惯性值
  maxMomentum: 1.0,
  // 惯性衰减率（每分钟）
  decayPerMinute: 0.02,
  // 情感方向分组
  emotionGroups: {
    positive: [EmotionTypes.JOY, EmotionTypes.EXCITED],
    negative: [EmotionTypes.CONCERNED, EmotionTypes.TIRED],
    neutral: [EmotionTypes.CALM, EmotionTypes.CURIOUS]
  }
};

class EmotionalMomentum {
  constructor() {
    this.momentum = 0;           // 当前惯性值 [-1, 1]
    this.recentEmotions = [];     // 最近情感历史 [{ emotion, intensity, timestamp, deepEmotion }]
    this.blendedEmotion = null;   // 当前混合情感
    this.blendIntensity = 0;      // 混合强度
    this.lastUpdateTime = Date.now();
    this.direction = 'neutral';   // 'positive' | 'negative' | 'neutral'
  }

  /**
   * 获取情感方向组
   */
  getEmotionGroup(emotion) {
    for (const [group, emotions] of Object.entries(MOMENTUM_CONFIG.emotionGroups)) {
      if (emotions.includes(emotion)) return group;
    }
    return 'neutral';
  }

  /**
   * 判断两个情感是否同向
   */
  isSameDirection(e1, e2) {
    return this.getEmotionGroup(e1) === this.getEmotionGroup(e2);
  }

  /**
   * 判断两个情感是否反向
   */
  isOppositeDirection(e1, e2) {
    const g1 = this.getEmotionGroup(e1);
    const g2 = this.getEmotionGroup(e2);
    return g1 !== 'neutral' && g1 !== g2;
  }

  /**
   * 更新情感惯性
   * @param {string} surfaceEmotion - 表面情感类型
   * @param {number} intensity - 强度 1-5
   * @param {string} deepEmotion - DeepEmotion 原始情绪
   * @param {number} deepIntensity - DeepEmotion 原始强度 0-1
   */
  update(surfaceEmotion, intensity, deepEmotion = null, deepIntensity = 0.5) {
    // 先应用时间衰减
    this._applyTimeDecay();

    // 归一化强度
    const normIntensity = (intensity - 1) / 4; // 1-5 → 0-1

    // 获取当前情感方向组
    const currentGroup = this.getEmotionGroup(surfaceEmotion);

    // 检查上一个情感
    if (this.recentEmotions.length > 0) {
      const last = this.recentEmotions[this.recentEmotions.length - 1];

      if (this.isSameDirection(last.emotion, surfaceEmotion)) {
        // 同向叠加
        this.momentum = Math.min(MOMENTUM_CONFIG.maxMomentum,
          this.momentum + MOMENTUM_CONFIG.sameDirectionBoost * normIntensity);
      } else if (this.isOppositeDirection(last.emotion, surfaceEmotion)) {
        // 反向抵消
        const cancelAmount = MOMENTUM_CONFIG.oppositeDirectionCancel * (last.intensity / 4);
        this.momentum = Math.max(-MOMENTUM_CONFIG.maxMomentum, this.momentum - cancelAmount);
        // 反向时，方向切换
        this.direction = currentGroup;
      }
    }

    // 检查是否触发情感混合
    const blend = this._checkBlend(surfaceEmotion, deepEmotion, deepIntensity);
    if (blend) {
      this.blendedEmotion = blend.emotion;
      this.blendIntensity = blend.intensity;
    } else {
      this.blendedEmotion = surfaceEmotion;
      this.blendIntensity = intensity;
    }

    // 更新方向
    this.direction = currentGroup;

    // 记录历史
    this.recentEmotions.push({
      emotion: surfaceEmotion,
      intensity,
      deepEmotion,
      deepIntensity,
      timestamp: Date.now()
    });

    // 限制历史长度
    if (this.recentEmotions.length > 20) {
      this.recentEmotions.shift();
    }

    this.lastUpdateTime = Date.now();
  }

  /**
   * 检查是否触发 Plutchik 情感混合
   */
  _checkBlend(currentSurface, currentDeep, currentDeepIntensity) {
    if (!currentDeep) return null;

    for (const rule of PLUTCHIK_BLEND_RULES) {
      const recent = this.recentEmotions
        .filter(e => e.deepEmotion)
        .slice(-5);

      for (const prev of recent) {
        // 检查是否匹配混合规则
        if ((rule.primary === currentDeep || rule.secondary === currentDeep) &&
            (rule.primary === prev.deepEmotion || rule.secondary === prev.deepEmotion)) {
          // 匹配成功，生成混合情感
          const avgIntensity = (currentDeepIntensity + prev.deepIntensity) / 2;
          const surfaceResult = DEEP_TO_SURFACE[rule.result] || currentSurface;
          return {
            emotion: surfaceResult,
            intensity: Math.round(avgIntensity * 4) + 1,
            blendRule: `${rule.primary}+${rule.secondary}→${rule.result}`
          };
        }
      }
    }

    return null;
  }

  /**
   * 应用时间衰减
   */
  _applyTimeDecay() {
    const now = Date.now();
    const elapsedMinutes = (now - this.lastUpdateTime) / 60000;
    if (elapsedMinutes > 0) {
      const decay = MOMENTUM_CONFIG.decayPerMinute * elapsedMinutes;
      this.momentum = this.momentum > 0
        ? Math.max(0, this.momentum - decay)
        : Math.min(0, this.momentum + decay);
    }
  }

  /**
   * 获取当前惯性状态
   */
  getState() {
    return {
      momentum: Math.round(this.momentum * 100) / 100,
      direction: this.direction,
      blendedEmotion: this.blendedEmotion,
      blendIntensity: this.blendIntensity,
      recentCount: this.recentEmotions.length,
      isRising: this.momentum > 0.2,
      isFalling: this.momentum < -0.2,
      trajectory: this.momentum > 0.2 ? 'rising' : this.momentum < -0.2 ? 'falling' : 'stable'
    };
  }

  /**
   * 重置惯性
   */
  reset() {
    this.momentum = 0;
    this.recentEmotions = [];
    this.blendedEmotion = null;
    this.blendIntensity = 0;
    this.direction = 'neutral';
    this.lastUpdateTime = Date.now();
  }
}

module.exports = { EmotionalMomentum, PLUTCHIK_BLEND_RULES, DEEP_TO_SURFACE };
