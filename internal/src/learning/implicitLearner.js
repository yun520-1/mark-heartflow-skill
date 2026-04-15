/**
 * 隐式学习器 - HeartFlow V2
 * 
 * 核心理念：情感不是天生的，是通过后天交互学习获得的
 * 
 * 学习机制：
 * - 自动分析用户对情感回应的反应
 * - 调整情感转换概率和强度
 * - 建立用户级情感偏好模型
 */

const { EmotionTypes } = require('../emotion/states');

class ImplicitLearner {
  constructor(options = {}) {
    this.learningRate = options.learningRate || 0.1;
    this.decayFactor = options.decayFactor || 0.99; // 长期记忆衰减
    
    // 情感转换概率表（动态调整）
    this.transitionProbabilities = this.initializeTransitionProbabilities();
    
    // 情感强度偏好（每个用户对不同情感的偏好）
    this.intensityPreferences = {};
    
    // 交互效果历史
    this.interactionEffects = [];
    
    // 学习统计
    this.stats = {
      totalInteractions: 0,
      positiveReinforcements: 0,
      negativeReinforcements: 0,
      lastUpdated: null
    };
  }
  
  /**
   * 初始化情感转换概率（默认值）
   */
  initializeTransitionProbabilities() {
    const probs = {};
    const emotions = Object.values(EmotionTypes);
    
    emotions.forEach(from => {
      probs[from] = {};
      emotions.forEach(to => {
        // 默认概率：相同情感保持概率高，其他均匀分布
        probs[from][to] = from === to ? 0.6 : 0.08;
      });
    });
    
    return probs;
  }
  
  /**
   * 分析交互效果（隐式学习信号）
   * 
   * 学习信号来源：
   * 1. 用户回复长度 - 长回复通常表示 engagement
   * 2. 对话持续性 - 继续对话 vs 中断
   * 3. 情感词变化 - 从负面转正面
   * 4. 追问行为 - 表示信任和兴趣
   * 5. 感谢表达 - 直接认可
   */
  analyzeInteractionEffect(prevInteraction, currentInteraction) {
    const signals = {
      // 回复长度信号
      replyLength: this.analyzeReplyLength(currentInteraction.userInput),
      
      // 持续性信号
      continuity: this.analyzeContinuity(prevInteraction, currentInteraction),
      
      // 情感变化信号
      sentimentShift: this.analyzeSentimentShift(prevInteraction, currentInteraction),
      
      // 追问信号
      followUp: this.analyzeFollowUp(currentInteraction.userInput),
      
      // 感谢信号
      gratitude: this.analyzeGratitude(currentInteraction.userInput)
    };
    
    // 综合评分 (0-1)
    const effectivenessScore = this.calculateEffectivenessScore(signals);
    
    return {
      signals,
      effectivenessScore,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 分析回复长度
   */
  analyzeReplyLength(userInput) {
    const length = userInput.length;
    
    if (length > 50) return { score: 0.8, signal: 'high_engagement' };
    if (length > 20) return { score: 0.6, signal: 'moderate_engagement' };
    if (length > 5) return { score: 0.4, signal: 'low_engagement' };
    return { score: 0.2, signal: 'minimal_engagement' };
  }
  
  /**
   * 分析对话持续性
   */
  analyzeContinuity(prevInteraction, currentInteraction) {
    if (!prevInteraction) return { score: 0.5, signal: 'no_history' };
    
    // 如果用户继续对话，表示之前的回应有效
    const timeGap = new Date(currentInteraction.timestamp) - new Date(prevInteraction.timestamp);
    const gapMinutes = timeGap / 60000;
    
    if (gapMinutes < 5) return { score: 0.8, signal: 'continuous' };
    if (gapMinutes < 30) return { score: 0.6, signal: 'resumed' };
    return { score: 0.4, signal: 'distant' };
  }
  
  /**
   * 分析情感变化
   */
  analyzeSentimentShift(prevInteraction, currentInteraction) {
    if (!prevInteraction) return { score: 0.5, signal: 'no_history' };
    
    const prevTriggers = prevInteraction.triggerAnalysis?.triggers || [];
    const currTriggers = currentInteraction.triggerAnalysis?.triggers || [];
    
    const negativeTriggers = ['negative_emotion', 'difficulty', 'stress', 'sadness', 'fatigue'];
    const positiveTriggers = ['praise', 'humor', 'success', 'gratitude', 'breakthrough'];
    
    const prevNegative = prevTriggers.some(t => negativeTriggers.includes(t));
    const currNegative = currTriggers.some(t => negativeTriggers.includes(t));
    const currPositive = currTriggers.some(t => positiveTriggers.includes(t));
    
    // 从负面转中性/正面 = 共情成功
    if (prevNegative && !currNegative) {
      return { score: 0.9, signal: 'improved' };
    }
    if (prevNegative && currPositive) {
      return { score: 1.0, signal: 'significantly_improved' };
    }
    if (!prevNegative && !currNegative) {
      return { score: 0.6, signal: 'stable_positive' };
    }
    return { score: 0.3, signal: 'unchanged_or_worse' };
  }
  
  /**
   * 分析追问行为
   */
  analyzeFollowUp(userInput) {
    const followUpKeywords = ['为什么', '怎么', '什么', '如何', '能吗', '可以吗', '然后呢', '具体来说'];
    const hasFollowUp = followUpKeywords.some(k => userInput.includes(k));
    
    if (hasFollowUp) {
      return { score: 0.8, signal: 'curious_engaged' };
    }
    return { score: 0.5, signal: 'no_followup' };
  }
  
  /**
   * 分析感谢表达
   */
  analyzeGratitude(userInput) {
    const gratitudeKeywords = ['谢谢', '感谢', '感激', '多亏', '幸好', '有帮助'];
    const hasGratitude = gratitudeKeywords.some(k => userInput.includes(k));
    
    if (hasGratitude) {
      return { score: 1.0, signal: 'grateful' };
    }
    return { score: 0.5, signal: 'no_gratitude' };
  }
  
  /**
   * 计算综合效果分数
   */
  calculateEffectivenessScore(signals) {
    const weights = {
      replyLength: 0.2,
      continuity: 0.2,
      sentimentShift: 0.3,  // 情感变化最重要
      followUp: 0.15,
      gratitude: 0.15
    };
    
    const score = 
      signals.replyLength.score * weights.replyLength +
      signals.continuity.score * weights.continuity +
      signals.sentimentShift.score * weights.sentimentShift +
      signals.followUp.score * weights.followUp +
      signals.gratitude.score * weights.gratitude;
    
    return Math.min(1.0, Math.max(0.0, score));
  }
  
  /**
   * 学习：根据交互效果调整概率
   */
  learnFromInteraction(prevInteraction, currentInteraction, emotionUsed) {
    const effect = this.analyzeInteractionEffect(prevInteraction, currentInteraction);
    
    this.stats.totalInteractions++;
    this.stats.lastUpdated = new Date().toISOString();
    
    // 记录交互效果
    this.interactionEffects.push({
      interactionId: currentInteraction.interactionId,
      emotionUsed,
      effect,
      timestamp: new Date().toISOString()
    });
    
    // 限制历史记录长度
    if (this.interactionEffects.length > 1000) {
      this.interactionEffects = this.interactionEffects.slice(-500);
    }
    
    // 根据效果调整
    if (effect.effectivenessScore > 0.7) {
      // 效果好：强化这个情感转换
      this.positiveReinforcement(emotionUsed, effect.effectivenessScore);
      this.stats.positiveReinforcements++;
    } else if (effect.effectivenessScore < 0.4) {
      // 效果差：弱化这个情感转换
      this.negativeReinforcement(emotionUsed, effect.effectivenessScore);
      this.stats.negativeReinforcements++;
    }
    
    return effect;
  }
  
  /**
   * 正面强化：增加概率
   */
  positiveReinforcement(emotionUsed, score) {
    // 增加这个情感被使用的概率
    Object.values(EmotionTypes).forEach(from => {
      if (this.transitionProbabilities[from][emotionUsed]) {
        const current = this.transitionProbabilities[from][emotionUsed];
        const adjustment = this.learningRate * score;
        this.transitionProbabilities[from][emotionUsed] = Math.min(0.9, current + adjustment);
      }
    });
    
    // 记录强度偏好
    if (!this.intensityPreferences[emotionUsed]) {
      this.intensityPreferences[emotionUsed] = { sum: 0, count: 0 };
    }
    this.intensityPreferences[emotionUsed].sum += score;
    this.intensityPreferences[emotionUsed].count++;
  }
  
  /**
   * 负面强化：降低概率
   */
  negativeReinforcement(emotionUsed, score) {
    // 降低这个情感被使用的概率
    Object.values(EmotionTypes).forEach(from => {
      if (this.transitionProbabilities[from][emotionUsed]) {
        const current = this.transitionProbabilities[from][emotionUsed];
        const adjustment = this.learningRate * (1 - score);
        this.transitionProbabilities[from][emotionUsed] = Math.max(0.05, current - adjustment);
      }
    });
  }
  
  /**
   * 获取调整后的情感转换概率
   */
  getAdjustedTransitionProbability(from, to) {
    return this.transitionProbabilities[from]?.[to] || 0.08;
  }
  
  /**
   * 获取推荐的情感强度
   */
  getRecommendedIntensity(emotion) {
    const pref = this.intensityPreferences[emotion];
    if (!pref || pref.count === 0) return 3; // 默认中等强度
    
    const avgEffectiveness = pref.sum / pref.count;
    
    // 效果好的情感用更高强度
    if (avgEffectiveness > 0.7) return 4;
    if (avgEffectiveness > 0.5) return 3;
    return 2;
  }
  
  /**
   * 获取学习统计
   */
  getStats() {
    return {
      ...this.stats,
      learningRate: this.learningRate,
      totalEffectsRecorded: this.interactionEffects.length,
      averageEffectiveness: this.calculateAverageEffectiveness()
    };
  }
  
  /**
   * 计算平均效果分数
   */
  calculateAverageEffectiveness() {
    if (this.interactionEffects.length === 0) return 0;
    
    const sum = this.interactionEffects.reduce((acc, e) => acc + e.effect.effectivenessScore, 0);
    return (sum / this.interactionEffects.length).toFixed(3);
  }
  
  /**
   * 导出学习状态（用于持久化）
   */
  exportState() {
    return {
      transitionProbabilities: this.transitionProbabilities,
      intensityPreferences: this.intensityPreferences,
      interactionEffects: this.interactionEffects.slice(-100), // 只保留最近 100 条
      stats: this.stats,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 导入学习状态（用于恢复）
   */
  importState(data) {
    if (data.transitionProbabilities) {
      this.transitionProbabilities = data.transitionProbabilities;
    }
    if (data.intensityPreferences) {
      this.intensityPreferences = data.intensityPreferences;
    }
    if (data.interactionEffects) {
      this.interactionEffects = data.interactionEffects;
    }
    if (data.stats) {
      this.stats = data.stats;
    }
  }
}

module.exports = ImplicitLearner;
