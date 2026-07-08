/**
 * Emotion Optimizer — 情绪系统优化（基于心理学公式）
 * 
 * 新增公式：
 *   1. 情绪模型（PAD 情绪空间）
 *   2. 情绪调节（认知重评 + 表达抑制）
 *   3. 情绪感染（情绪传播模型）
 *   4. 情绪恢复（情绪弹性模型）
 */

const EmotionalGrowth = require('./emotional-growth.js');

class EmotionOptimizer {
  constructor(options = {}) {
    this.emotionalGrowth = new EmotionalGrowth();
    this.padModelEnabled = options.padModelEnabled || false;
    this.regulationEnabled = options.regulationEnabled || false;
    this.contagionEnabled = options.contagionEnabled || false;
    this.resilienceEnabled = options.resilienceEnabled || false;
  }

  /**
   * PAD 情绪模型（Pleasure-Arousal-Dominance）
   */
  padModel(emotionState) {
    if (!this.padModelEnabled) {
      return { error: 'PAD model is disabled' };
    }

    const { pleasure = 0, arousal = 0, dominance = 0 } = emotionState;

    // PAD 空间：三维情绪表示
    const padVector = {
      pleasure,  // 愉悦度（-1 到 +1）
      arousal,   // 唤醒度（-1 到 +1）
      dominance, // 支配度（-1 到 +1）
    };

    // 情绪分类（基于 PAD 阈值）
    const emotionCategory = this._classifyEmotion(padVector);

    // 情绪强度
    const intensity = Math.sqrt(pleasure * pleasure + arousal * arousal + dominance * dominance);

    return {
      model: 'PAD',
      vector: padVector,
      category: emotionCategory,
      intensity,
      description: this._describeEmotion(padVector),
    };
  }

  /**
   * 情绪分类（基于 PAD 阈值）
   */
  _classifyEmotion(pad) {
    const { pleasure, arousal, dominance } = pad;

    // 简化分类（基于阈值）
    if (pleasure > 0.5 && arousal > 0.5) {
      return 'excited';
    } else if (pleasure > 0.5 && arousal <= 0.5) {
      return 'content';
    } else if (pleasure <= 0.5 && arousal > 0.5) {
      return 'anxious';
    } else if (pleasure <= 0.5 && arousal <= 0.5) {
      return 'sad';
    } else {
      return 'neutral';
    }
  }

  /**
   * 情绪描述
   */
  _describeEmotion(pad) {
    const { pleasure, arousal, dominance } = pad;

    const descriptions = [];

    if (pleasure > 0.5) {
      descriptions.push('pleasurable');
    } else if (pleasure < -0.5) {
      descriptions.push('unpleasurable');
    }

    if (arousal > 0.5) {
      descriptions.push('aroused');
    } else if (arousal < -0.5) {
      descriptions.push('calm');
    }

    if (dominance > 0.5) {
      descriptions.push('dominant');
    } else if (dominance < -0.5) {
      descriptions.push('submissive');
    }

    return descriptions.join(', ') || 'neutral';
  }

  /**
   * 情绪调节（认知重评 + 表达抑制）
   */
  regulateEmotion(emotion, strategy = 'reappraisal') {
    if (!this.regulationEnabled) {
      return { error: 'Emotion regulation is disabled' };
    }

    const { type = 'neutral', intensity = 0.5 } = emotion;

    if (strategy === 'reappraisal') {
      // 认知重评：改变对情绪事件的解读
      const reappraised = this._cognitiveReappraisal(emotion);
      return {
        original: emotion,
        strategy: 'reappraisal',
        reappraised,
        effectiveness: this._regulationEffectiveness('reappraisal', emotion.type),
      };
    } else if (strategy === 'suppression') {
      // 表达抑制：抑制情绪表达
      const suppressed = this._expressiveSuppression(emotion);
      return {
        original: emotion,
        strategy: 'suppression',
        suppressed,
        effectiveness: this._regulationEffectiveness('suppression', emotion.type),
      };
    } else {
      return { error: `Unknown strategy: ${strategy}` };
    }
  }

  /**
   * 认知重评
   */
  _cognitiveReappraisal(emotion) {
    // 简化：降低负面情绪强度，提升正面情绪
    const { type, intensity } = emotion;

    if (type === 'negative') {
      return {
        ...emotion,
        intensity: intensity * 0.6, // 降低强度
        type: 'neutral',
        method: 'reappraisal',
      };
    } else {
      return {
        ...emotion,
        intensity: intensity * 1.2, // 提升强度
        method: 'reappraisal',
      };
    }
  }

  /**
   * 表达抑制
   */
  _expressiveSuppression(emotion) {
    // 简化：抑制情绪表达，但内心体验不变
    return {
      ...emotion,
      expressed: false,
      internal: true,
      method: 'suppression',
    };
  }

  /**
   * 调节有效性
   */
  _regulationEffectiveness(strategy, emotionType) {
    // 基于研究：认知重评比表达抑制更有效
    const effectivenessMap = {
      'reappraisal': {
        'negative': 0.8,
        'positive': 0.7,
        'neutral': 0.5,
      },
      'suppression': {
        'negative': 0.4,
        'positive': 0.3,
        'neutral': 0.2,
      },
    };

    return effectivenessMap[strategy][emotionType] || 0.5;
  }

  /**
   * 情绪感染（情绪传播模型）
   */
  emotionContagion(sourceEmotion, targetEmotion, context = {}) {
    if (!this.contagionEnabled) {
      return { error: 'Emotion contagion is disabled' };
    }

    const { similarity = 0.5, proximity = 0.5 } = context;

    // 情绪感染强度：基于相似度和接近度
    const contagionStrength = this._contagionStrength(sourceEmotion, targetEmotion, similarity, proximity);

    // 感染后的目标情绪
    const infected = {
      ...targetEmotion,
      type: sourceEmotion.type, // 情绪类型被感染
      intensity: targetEmotion.intensity * (1 - contagionStrength) + sourceEmotion.intensity * contagionStrength,
      infected: true,
      source: sourceEmotion,
    };

    return {
      source: sourceEmotion,
      target: targetEmotion,
      context: { similarity, proximity },
      strength: contagionStrength,
      infected,
    };
  }

  /**
   * 感染强度
   */
  _contagionStrength(source, target, similarity, proximity) {
    // 感染强度 = 相似度 * 接近度 * 源情绪强度
    const sourceIntensity = source.intensity || 0.5;
    return similarity * proximity * sourceIntensity;
  }

  /**
   * 情绪恢复（情绪弹性模型）
   */
  emotionResilience(emotion, recoveryTime = 1) {
    if (!this.resilienceEnabled) {
      return { error: 'Emotion resilience is disabled' };
    }

    // 情绪恢复曲线：指数衰减
    const recoveryRate = this._recoveryRate(emotion.type);
    const recoveredIntensity = emotion.intensity * Math.exp(-recoveryRate * recoveryTime);

    const recovered = {
      ...emotion,
      intensity: recoveredIntensity,
      recovered: recoveredIntensity < 0.1, // 阈值：强度 < 0.1 认为已恢复
      recoveryTime,
      recoveryRate,
    };

    return {
      original: emotion,
      recovered,
      halfLife: Math.log(2) / recoveryRate, // 半衰期
      fullyRecoveredTime: Math.log(emotion.intensity / 0.1) / recoveryRate,
    };
  }

  /**
   * 恢复率（基于情绪类型）
   */
  _recoveryRate(emotionType) {
    // 不同情绪类型的恢复率（单位：每小时）
    const rates = {
      'fear': 0.5,      // 恐惧恢复慢
      'anger': 0.7,     // 愤怒恢复中等
      'sadness': 0.6,   // 悲伤恢复中等
      'joy': 1.2,       // 喜悦恢复快
      'surprise': 1.5,   // 惊讶恢复很快
      'disgust': 0.8,   // 厌恶恢复中等
      'neutral': 2.0,    // 中性恢复非常快
    };

    return rates[emotionType] || 1.0;
  }

  /**
   * 混合情绪优化（PAD + 调节 + 感染 + 恢复）
   */
  optimizeEmotion(emotionState, context = {}) {
    const results = {};

    // PAD 模型
    if (this.padModelEnabled) {
      results.pad = this.padModel(emotionState);
    }

    // 情绪调节
    if (this.regulationEnabled && context.regulationStrategy) {
      results.regulation = this.regulateEmotion(
        emotionState,
        context.regulationStrategy
      );
    }

    // 情绪感染
    if (this.contagionEnabled && context.sourceEmotion) {
      results.contagion = this.emotionContagion(
        context.sourceEmotion,
        emotionState,
        context.contagionContext || {}
      );
    }

    // 情绪恢复
    if (this.resilienceEnabled && context.recoveryTime) {
      results.resilience = this.emotionResilience(
        emotionState,
        context.recoveryTime
      );
    }

    // 综合优化建议
    const advice = this._generateAdvice(results);

    return {
      model: 'hybrid_emotion',
      results,
      advice,
      optimized: results.pad || results.regulation || results.contagion || results.resilience,
    };
  }

  /**
   * 生成优化建议
   */
  _generateAdvice(results) {
    const advice = [];

    if (results.pad) {
      advice.push(`PAD 情绪分类: ${results.pad.category} (强度: ${results.pad.intensity.toFixed(2)})`);
    }

    if (results.regulation) {
      advice.push(`情绪调节策略: ${results.regulation.strategy} (有效性: ${results.regulation.effectiveness})`);
    }

    if (results.contagion) {
      advice.push(`情绪感染强度: ${results.contagion.strength.toFixed(2)}`);
    }

    if (results.resilience) {
      advice.push(`情绪恢复时间: ${results.resilience.fullyRecoveredTime.toFixed(2)} 小时`);
    }

    return advice;
  }
}

module.exports = { EmotionOptimizer };