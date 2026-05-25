/**
 * Traditions Assessor - 三大传统评估器
 * 
 * 分别评估情绪在三大传统框架下的特征
 */

class TraditionsAssessor {
  /**
   * Feeling Tradition 评估
   * 情绪作为独特的主观体验
   */
  assessFeelingTradition({ emotion, subjectiveExperience, intensity, valence }) {
    return {
      tradition: 'Feeling',
      theoreticalBasis: 'James-Lange, Psychological Constructionism',
      
      // 体验清晰度
      experienceClarity: this._rateClarity(subjectiveExperience),
      
      // 强度清晰度
      intensityClarity: this._rateIntensityClarity(intensity),
      
      // 效价清晰度
      valenceClarity: this._rateValenceClarity(valence),
      
      // 体验质量描述
      experienceQuality: this._describeExperienceQuality(emotion, subjectiveExperience),
      
      // 效价
      valence: valence || this._inferValence(emotion),
      
      // 身体感受突出性
      bodilySalience: this._assessBodilySalience(subjectiveExperience),
      
      // 现象学特征
      phenomenologicalFeatures: this._identifyPhenomenologicalFeatures(emotion)
    };
  }

  /**
   * Evaluative Tradition 评估
   * 情绪作为对情境的评价
   */
  assessEvaluativeTradition({ emotion, context, appraisal, meaningMaking }) {
    return {
      tradition: 'Evaluative',
      theoreticalBasis: 'Cognitive Appraisal Theory, Constructivism',
      
      // 评价清晰度
      appraisalClarity: this._rateClarity(appraisal),
      
      // 意义清晰度
      meaningClarity: this._rateClarity(meaningMaking),
      
      // 情境契合度
      contextFit: this._assessContextFit(emotion, context, appraisal),
      
      // 评价类型
      appraisalType: this._identifyAppraisalType(appraisal),
      
      // 核心评价主题
      coreAppraisalThemes: this._identifyCoreAppraisalThemes(emotion, appraisal),
      
      // 评价维度
      appraisalDimensions: this._analyzeAppraisalDimensions(appraisal),
      
      // 意义建构模式
      meaningMakingPattern: this._identifyMeaningPattern(meaningMaking)
    };
  }

  /**
   * Motivational Tradition 评估
   * 情绪作为动机状态
   */
  assessMotivationalTradition({ emotion, actionTendency, goalRelevance, urgency }) {
    return {
      tradition: 'Motivational',
      theoreticalBasis: 'Action Tendency Theory, Functionalism',
      
      // 行动倾向清晰度
      actionTendencyClarity: this._rateClarity(actionTendency),
      
      // 目标相关性清晰度
      goalRelevanceClarity: this._rateClarity(goalRelevance),
      
      // 紧迫性清晰度
      urgencyClarity: this._rateClarity(urgency),
      
      // 行动倾向类型
      actionTendencyType: this._identifyActionTendencyType(actionTendency),
      
      // 目标相关性评估
      goalRelevanceAssessment: this._assessGoalRelevance(goalRelevance),
      
      // 动机强度
      motivationalIntensity: this._assessMotivationalIntensity(urgency, actionTendency),
      
      // 功能分析
      functionalAnalysis: this._analyzeFunction(emotion, actionTendency),
      
      // 效价 (从动机角度)
      valence: this._inferMotivationalValence(actionTendency)
    };
  }

  // ===== 辅助方法 =====

  _rateClarity(input) {
    if (!input) return 0.3;
    if (typeof input === 'string') {
      return input.length > 20 ? 0.8 : input.length > 10 ? 0.6 : 0.4;
    }
    if (typeof input === 'number') return Math.min(1, input / 10);
    return 0.5;
  }

  _rateIntensityClarity(intensity) {
    if (!intensity) return 0.3;
    if (typeof intensity === 'number') return Math.min(1, intensity / 10);
    return this._rateClarity(intensity);
  }

  _rateValenceClarity(valence) {
    if (!valence) return 0.3;
    return ['positive', 'negative', 'neutral'].includes(valence) ? 0.9 : 0.5;
  }

  _describeExperienceQuality(emotion, experience) {
    const qualityMap = {
      'anger': '强烈的、炽热的、紧绷的',
      'fear': '紧张的、警觉的、收缩的',
      'sadness': '沉重的、向下的、空虚的',
      'joy': '轻盈的、扩展的、温暖的',
      'disgust': '排斥的、收缩的、污染的',
      'surprise': '突然的、冲击的、开放的',
      'shame': '灼热的、想要隐藏的、缩小的',
      'guilt': '沉重的、压迫的、想要修复的',
      'love': '温暖的、连接的、柔软的',
      'anxiety': '不安的、悬浮的、紧绷的'
    };
    return qualityMap[emotion?.toLowerCase()] || '独特的、可识别的';
  }

  _inferValence(emotion) {
    const positiveEmotions = ['joy', 'love', 'gratitude', 'hope', 'pride', 'contentment'];
    const negativeEmotions = ['anger', 'fear', 'sadness', 'disgust', 'shame', 'guilt', 'anxiety'];
    
    const lower = emotion?.toLowerCase();
    if (positiveEmotions.includes(lower)) return 'positive';
    if (negativeEmotions.includes(lower)) return 'negative';
    return 'neutral';
  }

  _assessBodilySalience(experience) {
    if (!experience) return 'unknown';
    const bodilyWords = ['心跳', '呼吸', '紧张', '温暖', '冰冷', '颤抖', '紧绷', '放松'];
    const hasBodily = bodilyWords.some(word => experience.includes(word));
    return hasBodily ? 'high' : 'low';
  }

  _identifyPhenomenologicalFeatures(emotion) {
    const featuresMap = {
      'anger': ['边界感增强', '能量聚集', '时间感加速'],
      'fear': ['警觉性提高', '时间感变慢', '空间感收缩'],
      'sadness': ['能量下降', '时间感拉长', '世界感变远'],
      'joy': ['边界感扩展', '能量上升', '时间感流畅'],
      'anxiety': ['悬浮感', '不确定感', '身体紧张']
    };
    return featuresMap[emotion?.toLowerCase()] || ['独特的现象学特征'];
  }

  _assessContextFit(emotion, context, appraisal) {
    if (!context || !appraisal) return 0.5;
    // 简化评估：检查评价与情境的一致性
    const threatContexts = ['危险', '威胁', '风险', '损失'];
    const lossContexts = ['失去', '分离', '失败', '结束'];
    const opportunityContexts = ['机会', '获得', '成长', '连接'];
    
    const contextStr = JSON.stringify(context).toLowerCase();
    const appraisalStr = appraisal.toLowerCase();
    
    if (threatContexts.some(c => contextStr.includes(c)) && appraisalStr.includes('威胁')) {
      return 0.9;
    }
    if (lossContexts.some(c => contextStr.includes(c)) && appraisalStr.includes('损失')) {
      return 0.9;
    }
    if (opportunityContexts.some(c => contextStr.includes(c)) && appraisalStr.includes('机会')) {
      return 0.9;
    }
    
    return 0.6;
  }

  _identifyAppraisalType(appraisal) {
    if (!appraisal) return 'unknown';
    const lower = appraisal.toLowerCase();
    if (lower.includes('威胁') || lower.includes('danger') || lower.includes('threat')) {
      return 'threatening';
    }
    if (lower.includes('损失') || lower.includes('loss')) {
      return 'loss-related';
    }
    if (lower.includes('机会') || lower.includes('opportunity')) {
      return 'opportunity-related';
    }
    if (lower.includes('不公平') || lower.includes('unfair')) {
      return 'injustice-related';
    }
    return 'mixed';
  }

  _identifyCoreAppraisalThemes(emotion, appraisal) {
    const themesMap = {
      'anger': ['目标阻碍', '不公平', '责任归因于他人'],
      'fear': ['威胁', '不确定性', '低控制感'],
      'sadness': ['损失', '不可逆', '低控制感'],
      'guilt': ['违反标准', '责任归因于自己', '可修复性'],
      'shame': ['自我缺陷', '他人评价', '不可修复性'],
      'anxiety': ['未来威胁', '不确定性', '低应对能力']
    };
    return themesMap[emotion?.toLowerCase()] || ['情境评价'];
  }

  _analyzeAppraisalDimensions(appraisal) {
    return {
      valence: appraisal?.includes('好') || appraisal?.includes('积极') ? 'positive' : 
               appraisal?.includes('坏') || appraisal?.includes('消极') ? 'negative' : 'neutral',
      controllability: appraisal?.includes('可控') ? 'high' : 
                       appraisal?.includes('不可控') ? 'low' : 'moderate',
      certainty: appraisal?.includes('确定') ? 'high' : 
                 appraisal?.includes('不确定') ? 'low' : 'moderate',
      responsibility: appraisal?.includes('我') ? 'self' : 
                      appraisal?.includes('他人') ? 'other' : 'situational'
    };
  }

  _identifyMeaningPattern(meaningMaking) {
    if (!meaningMaking) return 'unknown';
    const lower = meaningMaking.toLowerCase();
    if (lower.includes('成长') || lower.includes('学习')) {
      return 'growth-oriented';
    }
    if (lower.includes('威胁') || lower.includes('危险')) {
      return 'threat-oriented';
    }
    if (lower.includes('连接') || lower.includes('关系')) {
      return 'relationship-oriented';
    }
    return 'mixed';
  }

  _identifyActionTendencyType(actionTendency) {
    if (!actionTendency) return 'unknown';
    const lower = actionTendency.toLowerCase();
    if (lower.includes('接近') || lower.includes('approach')) {
      return 'approach';
    }
    if (lower.includes('回避') || lower.includes('avoid') || lower.includes('逃跑')) {
      return 'avoidance';
    }
    if (lower.includes('攻击') || lower.includes('attack') || lower.includes('对抗')) {
      return 'aggression';
    }
    if (lower.includes('冻结') || lower.includes('freeze')) {
      return 'freeze';
    }
    return 'mixed';
  }

  _assessGoalRelevance(goalRelevance) {
    if (!goalRelevance) return { level: 'unknown', description: '目标相关性未评估' };
    const lower = goalRelevance.toLowerCase();
    if (lower.includes('高') || lower.includes('important') || lower.includes('关键')) {
      return { level: 'high', description: '与核心目标高度相关' };
    }
    if (lower.includes('低') || lower.includes('unimportant')) {
      return { level: 'low', description: '与目标关联较弱' };
    }
    return { level: 'moderate', description: '与目标中度相关' };
  }

  _assessMotivationalIntensity(urgency, actionTendency) {
    const urgencyScore = urgency === 'high' ? 0.9 : urgency === 'moderate' ? 0.6 : 0.3;
    const tendencyScore = actionTendency?.length > 10 ? 0.8 : 0.5;
    return (urgencyScore + tendencyScore) / 2;
  }

  _analyzeFunction(emotion, actionTendency) {
    const functionMap = {
      'anger': {
        function: '消除障碍，维护边界',
        adaptiveValue: '保护自身权益，推动改变',
        maladaptiveRisk: '过度攻击，关系损害'
      },
      'fear': {
        function: '检测威胁，准备应对',
        adaptiveValue: '避免危险，保障安全',
        maladaptiveRisk: '过度回避，错失机会'
      },
      'sadness': {
        function: '处理损失，寻求支持',
        adaptiveValue: '促进适应，加强连接',
        maladaptiveRisk: '过度沉溺，功能受损'
      },
      'anxiety': {
        function: '预警未来威胁',
        adaptiveValue: '提前准备，风险防范',
        maladaptiveRisk: '过度担忧，慢性压力'
      }
    };
    return functionMap[emotion?.toLowerCase()] || {
      function: '适应性反应',
      adaptiveValue: '情境适应',
      maladaptiveRisk: '需评估功能损害'
    };
  }

  _inferMotivationalValence(actionTendency) {
    if (!actionTendency) return 'neutral';
    const lower = actionTendency.toLowerCase();
    if (lower.includes('接近') || lower.includes('approach')) {
      return 'positive';
    }
    if (lower.includes('回避') || lower.includes('avoid')) {
      return 'negative';
    }
    return 'neutral';
  }
}

module.exports = TraditionsAssessor;
