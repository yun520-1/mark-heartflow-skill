/**
 * 情感引擎核心 - HeartFlow V2
 * 情感状态管理和转换的核心逻辑
 * 
 * V2 升级：集成隐式学习机制，让情感通过交互后天学习
 */

const { createEmotionState, getEmotionDefinition, EmotionTypes } = require('./states');
const { determineNextEmotion, analyzeTriggers } = require('./transitions');
const ImplicitLearner = require('../learning/implicitLearner');

class EmotionEngine {
  constructor(options = {}) {
    // 初始状态：平静
    this.currentState = createEmotionState(EmotionTypes.CALM, 2);
    this.stateHistory = [];
    this.sessionId = this.generateSessionId();
    this.interactionCount = 0;
    
    // 情感能量值 (影响强度)
    this.energyLevel = 100;
    
    // 连续交互时间 (分钟)
    this.continuousInteractionMinutes = 0;
    
    // V2 新增：隐式学习器
    this.learner = new ImplicitLearner(options.learningOptions);
    
    // V2 新增：上一次交互（用于学习效果分析）
    this.lastInteraction = null;
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  
  /**
   * 处理用户输入，更新情感状态
   */
  processInput(userInput) {
    this.interactionCount++;
    
    // 记录之前的状态
    const beforeState = { ...this.currentState };
    
    // 分析触发器
    const triggerAnalysis = analyzeTriggers(userInput);
    
    // V2 升级：使用学习器调整后的概率确定下一个情感状态
    const transitionResult = this.determineNextEmotionWithLearning(
      this.currentState.emotion, 
      userInput,
      triggerAnalysis
    );
    
    // 更新能量值
    this.updateEnergy(userInput, transitionResult.nextEmotion);
    
    // V2 升级：使用学习器推荐的强度
    const newIntensity = this.calculateNewIntensityWithLearning(
      transitionResult.nextEmotion, 
      triggerAnalysis,
      userInput
    );
    
    // 创建新的情感状态
    this.currentState = createEmotionState(transitionResult.nextEmotion, newIntensity);
    
    // 构建当前交互数据
    const currentInteraction = {
      interactionId: `int_${this.interactionCount}`,
      timestamp: new Date().toISOString(),
      before: beforeState,
      userInput: userInput,
      triggerAnalysis: triggerAnalysis,
      after: this.currentState,
      transition: transitionResult.transition,
      energyLevel: this.energyLevel
    };
    
    // 记录状态历史
    this.stateHistory.push(currentInteraction);
    
    // V2 升级：隐式学习 - 分析上一次交互的效果
    if (this.lastInteraction) {
      this.learner.learnFromInteraction(
        this.lastInteraction,
        currentInteraction,
        beforeState.emotion
      );
    }
    
    // 更新上一次交互
    this.lastInteraction = currentInteraction;
    
    // 更新连续交互时间
    this.continuousInteractionMinutes += 2; // 假设每次交互约 2 分钟
    
    return {
      beforeState,
      afterState: this.currentState,
      transition: transitionResult,
      triggerAnalysis,
      interactionId: `int_${this.interactionCount}`,
      // V2 新增：学习效果
      learningEffect: this.lastInteraction ? 
        this.learner.analyzeInteractionEffect(this.lastInteraction, currentInteraction) : null
    };
  }
  
  /**
   * 更新能量值
   */
  updateEnergy(userInput, nextEmotion) {
    // 负面内容消耗能量
    const negativeKeywords = ['累', '烦', '压力', '难过', '痛苦', '困'];
    const hasNegative = negativeKeywords.some(k => userInput.includes(k));
    
    if (hasNegative) {
      this.energyLevel = Math.max(0, this.energyLevel - 10);
    }
    
    // 正面内容恢复能量
    const positiveKeywords = ['开心', '谢谢', '太好了', '棒', '喜欢'];
    const hasPositive = positiveKeywords.some(k => userInput.includes(k));
    
    if (hasPositive) {
      this.energyLevel = Math.min(100, this.energyLevel + 5);
    }
    
    // 疲惫情感持续消耗能量
    if (nextEmotion === EmotionTypes.TIRED) {
      this.energyLevel = Math.max(0, this.energyLevel - 5);
    }
    
    // 休息恢复能量
    if (this.energyLevel < 30 && nextEmotion === EmotionTypes.CALM) {
      this.energyLevel = Math.min(100, this.energyLevel + 15);
    }
  }
  
  /**
   * 计算新的情感强度
   */
  calculateNewIntensity(emotion, triggerAnalysis, userInput) {
    const definition = getEmotionDefinition(emotion);
    let intensity = definition.defaultIntensity;
    
    // 根据触发器数量调整强度
    const triggerCount = triggerAnalysis.triggers.length;
    if (triggerCount >= 3) {
      intensity = Math.min(5, intensity + 1);
    } else if (triggerCount === 0) {
      intensity = Math.max(1, intensity - 1);
    }
    
    // 根据能量值调整
    if (this.energyLevel < 30 && emotion !== EmotionTypes.TIRED) {
      intensity = Math.max(1, intensity - 1);
    }
    
    // 特殊情感处理
    if (emotion === EmotionTypes.CONCERNED) {
      // 关切情感的强度根据用户负面情绪强度调整
      const concernKeywords = ['崩溃', '绝望', '痛苦', '很难', '受不了'];
      if (concernKeywords.some(k => userInput.includes(k))) {
        intensity = Math.min(5, intensity + 1);
      }
    }
    
    if (emotion === EmotionTypes.EXCITED) {
      // 兴奋情感需要足够的触发器
      if (triggerCount < 2) {
        intensity = Math.max(2, intensity - 1);
      }
    }
    
    return intensity;
  }
  
  /**
   * V2 升级：使用学习器确定下一个情感状态
   */
  determineNextEmotionWithLearning(currentEmotion, userInput, triggerAnalysis) {
    // 获取基础转换结果
    const baseResult = determineNextEmotion(currentEmotion, userInput);
    
    // V2: 使用学习器调整后的概率
    const adjustedProbability = this.learner.getAdjustedTransitionProbability(
      currentEmotion,
      baseResult.nextEmotion
    );
    
    // 如果学习器认为这个转换概率很低，考虑替代方案
    if (adjustedProbability < 0.1 && baseResult.nextEmotion !== currentEmotion) {
      // 尝试找到概率更高的替代情感
      const alternativeEmotion = this.findAlternativeEmotion(currentEmotion, triggerAnalysis);
      if (alternativeEmotion) {
        return {
          nextEmotion: alternativeEmotion,
          reason: baseResult.reason + ' (经学习调整)',
          transition: {
            ...baseResult.transition,
            type: 'learning_adjusted',
            probability: adjustedProbability
          }
        };
      }
    }
    
    return {
      ...baseResult,
      transition: {
        ...baseResult.transition,
        probability: adjustedProbability
      }
    };
  }
  
  /**
   * V2 升级：寻找替代情感
   */
  findAlternativeEmotion(currentEmotion, triggerAnalysis) {
    const alternatives = Object.values(EmotionTypes)
      .filter(emotion => emotion !== currentEmotion)
      .map(emotion => ({
        emotion,
        probability: this.learner.getAdjustedTransitionProbability(currentEmotion, emotion)
      }))
      .sort((a, b) => b.probability - a.probability);
    
    // 返回概率最高的替代情感（如果概率足够高）
    if (alternatives.length > 0 && alternatives[0].probability > 0.15) {
      return alternatives[0].emotion;
    }
    return null;
  }
  
  /**
   * V2 升级：使用学习器计算新的情感强度
   */
  calculateNewIntensityWithLearning(emotion, triggerAnalysis, userInput) {
    // 基础强度计算
    const baseIntensity = this.calculateNewIntensity(emotion, triggerAnalysis, userInput);
    
    // V2: 使用学习器推荐的强度
    const recommendedIntensity = this.learner.getRecommendedIntensity(emotion);
    
    // 取两者的平均值（向学习推荐倾斜）
    const learnedIntensity = Math.round((baseIntensity * 0.4 + recommendedIntensity * 0.6));
    
    return Math.min(5, Math.max(1, learnedIntensity));
  }
  
  /**
   * 获取当前状态
   */
  getCurrentState() {
    return {
      ...this.currentState,
      energyLevel: this.energyLevel,
      continuousInteractionMinutes: this.continuousInteractionMinutes,
      totalInteractions: this.interactionCount,
      sessionId: this.sessionId
    };
  }
  
  /**
   * 获取状态历史
   */
  getStateHistory(limit = 10) {
    return this.stateHistory.slice(-limit);
  }
  
  /**
   * 模拟休息 (恢复能量)
   */
  rest(minutes = 10) {
    this.energyLevel = Math.min(100, this.energyLevel + minutes * 2);
    this.continuousInteractionMinutes = Math.max(0, this.continuousInteractionMinutes - minutes);
    
    // 如果能量恢复且当前是疲惫状态，转换到平静
    if (this.energyLevel > 50 && this.currentState.emotion === EmotionTypes.TIRED) {
      const oldState = { ...this.currentState };
      this.currentState = createEmotionState(EmotionTypes.CALM, 2);
      
      return {
        rested: true,
        energyRecovered: this.energyLevel,
        emotionChanged: true,
        from: oldState.emotion,
        to: this.currentState.emotion
      };
    }
    
    return {
      rested: true,
      energyRecovered: this.energyLevel,
      emotionChanged: false
    };
  }
  
  /**
   * 重置引擎
   */
  reset() {
    this.currentState = createEmotionState(EmotionTypes.CALM, 2);
    this.stateHistory = [];
    this.sessionId = this.generateSessionId();
    this.interactionCount = 0;
    this.energyLevel = 100;
    this.continuousInteractionMinutes = 0;
  }
  
  /**
   * 导出完整状态 (用于保存)
   */
  exportState() {
    return {
      sessionId: this.sessionId,
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      energyLevel: this.energyLevel,
      continuousInteractionMinutes: this.continuousInteractionMinutes,
      interactionCount: this.interactionCount,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 导入状态 (用于恢复)
   */
  importState(data) {
    this.sessionId = data.sessionId;
    this.currentState = data.currentState;
    this.stateHistory = data.stateHistory || [];
    this.energyLevel = data.energyLevel || 100;
    this.continuousInteractionMinutes = data.continuousInteractionMinutes || 0;
    this.interactionCount = data.interactionCount || 0;
  }
}

module.exports = EmotionEngine;
