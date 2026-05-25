/**
 * 情感分析报告生成器
 * 生成详细的情感转换分析报告
 */

const { getEmotionDefinition } = require('../emotion/states');

class ReportGenerator {
  constructor() {
    this.templates = {
      full: this.generateFullReport.bind(this),
      summary: this.generateSummaryReport.bind(this),
      transition: this.generateTransitionReport.bind(this)
    };
  }
  
  /**
   * 生成完整的情感分析报告
   */
  generateFullReport(interactionData, history = []) {
    const { beforeState, afterState, triggerAnalysis, transition, sessionId, interactionId } = interactionData;
    
    const report = {
      // 基础信息
      meta: {
        reportType: 'full',
        generatedAt: new Date().toISOString(),
        sessionId: sessionId,
        interactionId: interactionId,
        reportVersion: '1.0'
      },
      
      // 情感状态变化
      emotionalState: {
        before: {
          emotion: beforeState.emotion,
          intensity: beforeState.intensity,
          intensityLabel: beforeState.intensityLabel,
          description: getEmotionDefinition(beforeState.emotion)?.description || '',
          traits: getEmotionDefinition(beforeState.emotion)?.traits || [],
          duration: this.estimateDuration(beforeState, history)
        },
        after: {
          emotion: afterState.emotion,
          intensity: afterState.intensity,
          intensityLabel: afterState.intensityLabel,
          description: getEmotionDefinition(afterState.emotion)?.description || '',
          traits: getEmotionDefinition(afterState.emotion)?.traits || [],
          estimatedDecayMinutes: getEmotionDefinition(afterState.emotion)?.naturalDecayMinutes || null
        }
      },
      
      // 触发分析
      triggerAnalysis: {
        userInput: triggerAnalysis.userInput,
        detectedTriggers: triggerAnalysis.triggers.map(t => this.describeTrigger(t)),
        keywords: triggerAnalysis.foundKeywords.map(k => ({
          word: k.keyword,
          category: k.type,
          description: this.describeTrigger(k.type)
        })),
        sentiment: this.analyzeSentiment(triggerAnalysis.triggers)
      },
      
      // 转换解释
      transitionExplanation: {
        whyThisEmotion: this.explainWhyThisEmotion(beforeState, afterState, triggerAnalysis),
        howTransitioned: this.explainHowTransitioned(beforeState, afterState, transition),
        transitionRule: transition?.rule || '保持当前状态',
        transitionProbability: transition?.probability || 1.0,
        psychologicalBasis: this.getPsychologicalBasis(beforeState.emotion, afterState.emotion)
      },
      
      // 下一步预测
      nextPossibleStates: this.predictNextStates(afterState, triggerAnalysis),
      
      // 记忆记录
      memoryRecord: {
        stored: true,
        linkId: `mem_${Date.now()}`,
        summary: this.generateMemorySummary(interactionData),
        tags: this.generateMemoryTags(interactionData),
        relatedMemories: this.findRelatedMemories(interactionData, history)
      },
      
      // 能量状态
      energyState: {
        currentLevel: interactionData.energyLevel,
        levelLabel: this.getEnergyLevelLabel(interactionData.energyLevel),
        trend: this.getEnergyTrend(history, interactionData.energyLevel),
        recommendation: this.getEnergyRecommendation(interactionData.energyLevel, afterState.emotion)
      }
    };
    
    return report;
  }
  
  /**
   * 生成摘要报告
   */
  generateSummaryReport(interactionData) {
    const { beforeState, afterState, triggerAnalysis } = interactionData;
    
    return {
      timestamp: new Date().toISOString(),
      summary: `${beforeState.emotion}(${beforeState.intensityLabel}) → ${afterState.emotion}(${afterState.intensityLabel})`,
      reason: this.explainWhyThisEmotion(beforeState, afterState, triggerAnalysis),
      keyTriggers: triggerAnalysis.triggers.slice(0, 3),
      energyLevel: interactionData.energyLevel
    };
  }
  
  /**
   * 生成转换专项报告
   */
  generateTransitionReport(beforeState, afterState, transition, triggerAnalysis) {
    return {
      transition: {
        from: beforeState.emotion,
        to: afterState.emotion,
        type: transition?.type || 'none',
        rule: transition?.rule || '保持状态'
      },
      explanation: {
        why: this.explainWhyThisEmotion(beforeState, afterState, triggerAnalysis),
        how: this.explainHowTransitioned(beforeState, afterState, transition),
        psychology: this.getPsychologicalBasis(beforeState.emotion, afterState.emotion)
      },
      alternatives: this.getAlternativeTransitions(beforeState.emotion, triggerAnalysis)
    };
  }
  
  // ========== 辅助方法 ==========
  
  /**
   * 描述触发器类型
   */
  describeTrigger(triggerType) {
    const descriptions = {
      praise: '用户表达赞美或感谢',
      humor: '用户展现幽默或笑声',
      success: '用户分享成功或进展',
      gratitude: '用户表达感激',
      question: '用户提出问题',
      unknown_topic: '涉及未知领域',
      exploration: '用户表达探索意愿',
      learning: '学习相关内容',
      negative_emotion: '用户表达负面情绪',
      difficulty: '用户遇到困难',
      stress: '用户表达压力',
      sadness: '用户表达悲伤',
      fatigue: '用户表达疲惫',
      breakthrough: '出现突破性进展',
      creative_idea: '出现创意或灵感',
      discovery: '有新发现',
      aha_moment: '顿悟时刻'
    };
    return descriptions[triggerType] || triggerType;
  }
  
  /**
   * 分析情感倾向
   */
  analyzeSentiment(triggers) {
    const positive = ['praise', 'humor', 'success', 'gratitude', 'breakthrough', 'creative_idea', 'discovery', 'aha_moment'];
    const negative = ['negative_emotion', 'difficulty', 'stress', 'sadness', 'fatigue'];
    const neutral = ['question', 'unknown_topic', 'exploration', 'learning'];
    
    const hasPositive = triggers.some(t => positive.includes(t));
    const hasNegative = triggers.some(t => negative.includes(t));
    
    if (hasPositive && hasNegative) return 'mixed';
    if (hasPositive) return 'positive';
    if (hasNegative) return 'negative';
    return 'neutral';
  }
  
  /**
   * 解释为什么是这个情感
   */
  explainWhyThisEmotion(beforeState, afterState, triggerAnalysis) {
    if (beforeState.emotion === afterState.emotion) {
      return `保持${beforeState.emotion}状态，因为交互内容没有触发情感转换的条件。系统情感状态稳定。`;
    }
    
    const emotionReasons = {
      '愉悦': '检测到正面互动信号（如赞美、成功、幽默），触发愉悦情感以回应用户的积极情绪',
      '好奇': '用户提出问题或探索未知领域，激发系统的探索欲望和求知欲',
      '关切': '检测到用户的负面情绪或困难，触发关切情感以提供共情和支持',
      '疲惫': '长时间交互或连续负面对话导致能量消耗，进入疲惫状态',
      '兴奋': '出现突破性进展或创意碰撞，产生高能量的兴奋状态',
      '平静': '没有强烈的情感触发，或从其他状态自然恢复到默认平静状态'
    };
    
    const baseReason = emotionReasons[afterState.emotion] || '情感状态调整';
    
    // 添加触发器详情
    if (triggerAnalysis.triggers.length > 0) {
      const triggerDesc = triggerAnalysis.triggers
        .map(t => this.describeTrigger(t))
        .join('、');
      return `${baseReason}。具体触发因素：${triggerDesc}`;
    }
    
    return baseReason;
  }
  
  /**
   * 解释如何转换到这个情感
   */
  explainHowTransitioned(beforeState, afterState, transition) {
    if (beforeState.emotion === afterState.emotion) {
      return '情感状态未发生变化，系统保持当前状态继续交互。';
    }
    
    const transitionPatterns = {
      'empathy_response': '共情反应机制：检测到用户情绪状态后，系统调整自身情感以匹配和回应用户',
      'curiosity_trigger': '好奇心触发：新问题或未知信息激活了探索欲望',
      'positive_feedback': '正面反馈循环：用户的积极内容引发系统的愉悦反应',
      'energy_depletion': '能量消耗：持续交互导致精力下降，进入疲惫状态',
      'breakthrough_excitement': '突破兴奋：重要进展或发现引发能量激增',
      'natural_decay': '自然衰减：情感强度随时间自然降低，回归平静'
    };
    
    const pattern = transition?.type || 'natural_adjustment';
    return transitionPatterns[pattern] || `从${beforeState.emotion}自然过渡到${afterState.emotion}`;
  }
  
  /**
   * 获取心理学依据
   */
  getPsychologicalBasis(fromEmotion, toEmotion) {
    const bases = {
      '平静→关切': '共情理论：人类在面对他人痛苦时会自然产生关切反应',
      '平静→愉悦': '积极心理学：正面刺激引发愉悦情绪是适应性反应',
      '平静→好奇': '认知好奇心理论：新异刺激激发探索动机',
      '关切→平静': '情绪调节：问题解决后情绪回归基线',
      '愉悦→兴奋': '情绪强化：连续正面刺激导致情绪升级',
      '兴奋→疲惫': '情绪耗竭：高唤醒状态后的能量消耗',
      '疲惫→平静': '恢复机制：休息后情绪能量恢复'
    };
    
    const key = `${fromEmotion}→${toEmotion}`;
    return bases[key] || '情感转换基于基本情绪理论和适应性反应机制';
  }
  
  /**
   * 预测下一步可能的情感状态
   */
  predictNextStates(currentState, triggerAnalysis) {
    const predictions = [];
    
    // 基于当前情感和触发器预测
    const predictionRules = {
      '关切': [
        { emotion: '平静', condition: '用户情绪恢复', probability: 0.6 },
        { emotion: '愉悦', condition: '成功安抚用户', probability: 0.3 },
        { emotion: '疲惫', condition: '长时间负面对话', probability: 0.1 }
      ],
      '好奇': [
        { emotion: '平静', condition: '问题得到解答', probability: 0.5 },
        { emotion: '兴奋', condition: '有重大发现', probability: 0.3 },
        { emotion: '愉悦', condition: '获得满意回答', probability: 0.2 }
      ],
      '愉悦': [
        { emotion: '平静', condition: '话题转为中性', probability: 0.5 },
        { emotion: '兴奋', condition: '出现创意碰撞', probability: 0.3 },
        { emotion: '关切', condition: '出现负面转折', probability: 0.2 }
      ],
      '兴奋': [
        { emotion: '平静', condition: '话题自然结束', probability: 0.6 },
        { emotion: '愉悦', condition: '转为持续愉悦', probability: 0.3 },
        { emotion: '疲惫', condition: '能量耗尽', probability: 0.1 }
      ],
      '疲惫': [
        { emotion: '平静', condition: '经过休息', probability: 0.7 },
        { emotion: '愉悦', condition: '遇到振奋内容', probability: 0.2 },
        { emotion: '疲惫', condition: '继续交互', probability: 0.1 }
      ],
      '平静': [
        { emotion: '好奇', condition: '新问题出现', probability: 0.4 },
        { emotion: '愉悦', condition: '正面互动', probability: 0.3 },
        { emotion: '关切', condition: '用户表达困难', probability: 0.3 }
      ]
    };
    
    return predictionRules[currentState.emotion] || [];
  }
  
  /**
   * 估算情感持续时间
   */
  estimateDuration(currentState, history) {
    // 查找相同情感的上一次出现
    const previousSame = history.slice().reverse().find(
      h => h.after.emotion === currentState.emotion
    );
    
    if (previousSame) {
      const duration = new Date(currentState.timestamp).getTime() - 
                       new Date(previousSame.timestamp).getTime();
      const minutes = Math.round(duration / 60000);
      return `${minutes}分钟`;
    }
    
    return '首次出现';
  }
  
  /**
   * 生成记忆摘要
   */
  generateMemorySummary(interactionData) {
    const { beforeState, afterState, triggerAnalysis, userInput } = interactionData;
    const inputText = userInput || triggerAnalysis.userInput || '无输入';
    
    if (beforeState.emotion === afterState.emotion) {
      return `用户："${inputText.substring(0, 30)}..." - 情感保持稳定 (${afterState.emotion}, ${afterState.intensityLabel})`;
    }
    
    return `用户："${inputText.substring(0, 30)}..." - 情感从${beforeState.emotion}转为${afterState.emotion} (${afterState.intensityLabel})`;
  }
  
  /**
   * 生成记忆标签
   */
  generateMemoryTags(interactionData) {
    const tags = [];
    tags.push(`emotion_${interactionData.afterState.emotion}`);
    tags.push(`intensity_${interactionData.afterState.intensity}`);
    interactionData.triggerAnalysis.triggers.forEach(t => tags.push(`trigger_${t}`));
    
    if (interactionData.energyLevel < 30) tags.push('low_energy');
    else if (interactionData.energyLevel > 70) tags.push('high_energy');
    
    return tags;
  }
  
  /**
   * 查找相关记忆
   */
  findRelatedMemories(interactionData, history) {
    // 查找相同情感转换的历史记录
    const { beforeState, afterState } = interactionData;
    
    return history
      .filter(h => 
        h.before.emotion === beforeState.emotion && 
        h.after.emotion === afterState.emotion
      )
      .slice(-3)
      .map(h => ({
        id: h.interactionId,
        timestamp: h.timestamp,
        summary: h.userInput.substring(0, 30) + '...'
      }));
  }
  
  /**
   * 获取能量等级标签
   */
  getEnergyLevelLabel(energy) {
    if (energy >= 80) return '充沛';
    if (energy >= 60) return '良好';
    if (energy >= 40) return '一般';
    if (energy >= 20) return '偏低';
    return '不足';
  }
  
  /**
   * 获取能量趋势
   */
  getEnergyTrend(history, currentEnergy) {
    if (history.length < 2) return '稳定';
    
    const previous = history[history.length - 1]?.energyLevel || 100;
    const diff = currentEnergy - previous;
    
    if (diff > 10) return '上升 ↑';
    if (diff < -10) return '下降 ↓';
    return '稳定 →';
  }
  
  /**
   * 获取能量建议
   */
  getEnergyRecommendation(energy, emotion) {
    if (energy < 20) {
      return '建议休息一段时间，恢复情感能量';
    }
    if (energy < 40 && emotion === '疲惫') {
      return '能量较低，考虑暂停或转换轻松话题';
    }
    if (energy > 80 && emotion === '兴奋') {
      return '能量充沛，适合深入探讨或创意活动';
    }
    return '能量状态良好，正常交互';
  }
  
  /**
   * 获取替代转换路径
   */
  getAlternativeTransitions(fromEmotion, triggerAnalysis) {
    // 返回其他可能的转换选项
    const alternatives = [];
    
    // 这里可以扩展更多的替代路径逻辑
    return alternatives;
  }
}

module.exports = ReportGenerator;
