/**
 * 情感引擎核心
 * HeartFlow Companion - 情感状态管理和转换的核心逻辑
 */

const { createEmotionState, getEmotionDefinition, EmotionTypes } = require('./states');
const { determineNextEmotion, analyzeTriggers } = require('./transitions');

class EmotionEngine {
  constructor() {
    // 初始状态：平静
    this.currentState = createEmotionState(EmotionTypes.CALM, 2);
    this.stateHistory = [];
    this.sessionId = this.generateSessionId();
    this.interactionCount = 0;
    
    // 情感能量值 (影响强度)
    this.energyLevel = 100;
    
    // 连续交互时间 (分钟)
    this.continuousInteractionMinutes = 0;
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
    
    // 确定下一个情感状态
    const transitionResult = determineNextEmotion(this.currentState.emotion, userInput);
    
    // 更新能量值
    this.updateEnergy(userInput, transitionResult.nextEmotion);
    
    // 计算新的强度
    const newIntensity = this.calculateNewIntensity(
      transitionResult.nextEmotion, 
      triggerAnalysis,
      userInput
    );
    
    // 创建新的情感状态
    this.currentState = createEmotionState(transitionResult.nextEmotion, newIntensity);
    
    // 记录状态历史
    this.stateHistory.push({
      interactionId: `int_${this.interactionCount}`,
      timestamp: new Date().toISOString(),
      before: beforeState,
      userInput: userInput,
      triggerAnalysis: triggerAnalysis,
      after: this.currentState,
      transition: transitionResult.transition,
      energyLevel: this.energyLevel
    });
    
    // 更新连续交互时间
    this.continuousInteractionMinutes += 2; // 假设每次交互约 2 分钟
    
    return {
      beforeState,
      afterState: this.currentState,
      transition: transitionResult,
      triggerAnalysis,
      interactionId: `int_${this.interactionCount}`
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
