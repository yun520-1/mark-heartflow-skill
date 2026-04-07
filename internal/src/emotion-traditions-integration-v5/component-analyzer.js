/**
 * Component Analyzer - 情绪成分分析器
 * 
 * 分析情绪的六个核心成分
 * 理论来源：SEP Emotion (Problem of Parts)
 */

class ComponentAnalyzer {
  /**
   * 分析情绪成分
   * @param {Object} emotionData - 情绪数据
   * @returns {Object} 成分分析结果
   */
  analyzeComponents(emotionData) {
    return {
      physiological: this._analyzePhysiological(emotionData),
      phenomenological: this._analyzePhenomenological(emotionData),
      expressive: this._analyzeExpressive(emotionData),
      behavioral: this._analyzeBehavioral(emotionData),
      mental: this._analyzeMental(emotionData),
      evaluative: this._analyzeEvaluative(emotionData)
    };
  }

  /**
   * 生理成分分析
   */
  _analyzePhysiological(data) {
    const physiological = data?.physiological || data?.bodily || '';
    const present = !!physiological && physiological.length > 0;
    
    const indicators = {
      arousal: this._detectIndicator(physiological, ['心跳', '加速', '紧张', '激动', 'arousal']),
      tension: this._detectIndicator(physiological, ['紧绷', '僵硬', '收缩', 'tension']),
      temperature: this._detectIndicator(physiological, ['热', '冷', '温暖', '冰冷']),
      breathing: this._detectIndicator(physiological, ['呼吸', '喘', '气', 'breath']),
      energy: this._detectIndicator(physiological, ['能量', '力', '虚弱', 'power'])
    };

    return {
      present,
      description: physiological || '未提供生理感受',
      indicators,
      intensity: present ? this._calculateIntensity(indicators) : 0,
      pattern: this._identifyPhysiologicalPattern(indicators)
    };
  }

  /**
   * 现象学成分分析 (主观体验)
   */
  _analyzePhenomenological(data) {
    const experience = data?.experience || data?.feeling || '';
    const present = !!experience && experience.length > 0;
    
    const qualities = {
      valence: this._extractValence(experience),
      intensity: this._extractIntensity(experience),
      texture: this._extractTexture(experience),
      spatiality: this._extractSpatiality(experience),
      temporality: this._extractTemporality(experience)
    };

    return {
      present,
      description: experience || '未提供主观体验',
      qualities,
      richness: present ? this._calculateRichness(qualities) : 0,
      pattern: this._identifyPhenomenologicalPattern(qualities)
    };
  }

  /**
   * 表达成分分析 (面部/声音表情)
   */
  _analyzeExpressive(data) {
    const expression = data?.expression || data?.facial || data?.voice || '';
    const present = !!expression && expression.length > 0;
    
    const channels = {
      facial: this._detectIndicator(expression, ['表情', '脸', '眉', '嘴', 'facial']),
      vocal: this._detectIndicator(expression, ['声音', '语调', '音调', 'voice']),
      postural: this._detectIndicator(expression, ['姿势', '身体', '姿态', 'posture']),
      gestural: this._detectIndicator(expression, ['手势', '动作', 'gesture'])
    };

    return {
      present,
      description: expression || '未提供表达信息',
      channels,
      intensity: present ? this._calculateIntensity(channels) : 0,
      congruence: 'unknown' // 需要多模态数据才能评估一致性
    };
  }

  /**
   * 行为成分分析 (行动倾向/实际行为)
   */
  _analyzeBehavioral(data) {
    const behavior = data?.behavior || data?.action || data?.tendency || '';
    const present = !!behavior && behavior.length > 0;
    
    const tendencies = {
      approach: this._detectIndicator(behavior, ['接近', '靠近', '想要', 'approach']),
      avoidance: this._detectIndicator(behavior, ['回避', '逃跑', '躲', 'avoid']),
      aggression: this._detectIndicator(behavior, ['攻击', '对抗', '愤怒', 'aggression']),
      freeze: this._detectIndicator(behavior, ['冻结', '僵硬', '不动', 'freeze']),
      submission: this._detectIndicator(behavior, ['屈服', '顺从', 'submit'])
    };

    return {
      present,
      description: behavior || '未提供行为信息',
      tendencies,
      dominantTendency: this._identifyDominantTendency(tendencies),
      functionalValue: this._assessFunctionalValue(tendencies)
    };
  }

  /**
   * 心理成分分析 (认知加工/注意力)
   */
  _analyzeMental(data) {
    const mental = data?.mental || data?.cognitive || data?.attention || '';
    const present = !!mental && mental.length > 0;
    
    const processes = {
      attention: this._detectIndicator(mental, ['注意', '聚焦', '关注', 'attention']),
      memory: this._detectIndicator(mental, ['记忆', '想起', '回忆', 'memory']),
      imagination: this._detectIndicator(mental, ['想象', '画面', 'imagery']),
      reasoning: this._detectIndicator(mental, ['思考', '分析', 'reason']),
      rumination: this._detectIndicator(mental, ['反复', '纠结', 'rumination'])
    };

    return {
      present,
      description: mental || '未提供心理过程信息',
      processes,
      pattern: this._identifyCognitivePattern(processes),
      flexibility: this._assessCognitiveFlexibility(processes)
    };
  }

  /**
   * 评价成分分析 (意义建构/解释)
   */
  _analyzeEvaluative(data) {
    const evaluation = data?.evaluation || data?.appraisal || data?.meaning || '';
    const present = !!evaluation && evaluation.length > 0;
    
    const dimensions = {
      valence: this._extractValence(evaluation),
      controllability: this._detectIndicator(evaluation, ['可控', '控制', 'control']) ? 'high' :
                       this._detectIndicator(evaluation, ['不可控', '无法控制']) ? 'low' : 'moderate',
      certainty: this._detectIndicator(evaluation, ['确定', '肯定', 'certain']) ? 'high' :
                 this._detectIndicator(evaluation, ['不确定', '可能', 'uncertain']) ? 'low' : 'moderate',
      responsibility: this._detectIndicator(evaluation, ['我', '我的', '自己']) ? 'self' :
                      this._detectIndicator(evaluation, ['他人', '别人', 'they']) ? 'other' : 'situational',
      fairness: this._detectIndicator(evaluation, ['公平', '不公平', 'fair'])
    };

    return {
      present,
      description: evaluation || '未提供评价信息',
      dimensions,
      complexity: this._calculateEvaluationComplexity(dimensions),
      adaptiveness: this._assessEvaluationAdaptiveness(dimensions)
    };
  }

  // ===== 辅助方法 =====

  _detectIndicator(text, indicators) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return indicators.some(ind => lower.includes(ind.toLowerCase()));
  }

  _extractValence(text) {
    if (!text) return 'unknown';
    const lower = text.toLowerCase();
    if (lower.includes('好') || lower.includes('积极') || lower.includes('positive') || 
        lower.includes('愉悦') || lower.includes('开心')) {
      return 'positive';
    }
    if (lower.includes('坏') || lower.includes('消极') || lower.includes('negative') || 
        lower.includes('痛苦') || lower.includes('难受')) {
      return 'negative';
    }
    return 'neutral';
  }

  _extractIntensity(text) {
    if (!text) return 'moderate';
    const lower = text.toLowerCase();
    if (lower.includes('非常') || lower.includes('极其') || lower.includes('强烈') || 
        lower.includes('extremely') || lower.includes('intense')) {
      return 'high';
    }
    if (lower.includes('轻微') || lower.includes('有点') || lower.includes('mild')) {
      return 'low';
    }
    return 'moderate';
  }

  _extractTexture(text) {
    if (!text) return 'unknown';
    const textures = {
      'sharp': ['尖锐', '刺痛', 'sharp'],
      'dull': ['沉闷', '钝', 'dull'],
      'heavy': ['沉重', '重', 'heavy'],
      'light': ['轻盈', '轻', 'light'],
      'tight': ['紧绷', '紧', 'tight'],
      'soft': ['柔软', '软', 'soft']
    };
    
    for (const [texture, words] of Object.entries(textures)) {
      if (words.some(w => text.toLowerCase().includes(w))) {
        return texture;
      }
    }
    return 'mixed';
  }

  _extractSpatiality(text) {
    if (!text) return 'unknown';
    if (text.includes('扩展') || text.includes('扩大') || text.includes('expand')) {
      return 'expansive';
    }
    if (text.includes('收缩') || text.includes('缩小') || text.includes('contract')) {
      return 'contractive';
    }
    if (text.includes('下沉') || text.includes('向下') || text.includes('down')) {
      return 'descending';
    }
    if (text.includes('上升') || text.includes('向上') || text.includes('up')) {
      return 'ascending';
    }
    return 'neutral';
  }

  _extractTemporality(text) {
    if (!text) return 'unknown';
    if (text.includes('突然') || text.includes('瞬间') || text.includes('sudden')) {
      return 'sudden';
    }
    if (text.includes('持续') || text.includes('漫长') || text.includes('prolonged')) {
      return 'prolonged';
    }
    if (text.includes('波动') || text.includes('起伏') || text.includes('fluctuating')) {
      return 'fluctuating';
    }
    return 'stable';
  }

  _calculateIntensity(indicators) {
    const values = Object.values(indicators);
    const trueCount = values.filter(v => v === true).length;
    return trueCount / values.length;
  }

  _calculateRichness(qualities) {
    const definedCount = Object.values(qualities).filter(v => v !== 'unknown').length;
    return definedCount / Object.keys(qualities).length;
  }

  _identifyPhysiologicalPattern(indicators) {
    const activeCount = Object.values(indicators).filter(v => v).length;
    if (activeCount >= 4) return 'high-arousal';
    if (activeCount >= 2) return 'moderate-arousal';
    return 'low-arousal';
  }

  _identifyPhenomenologicalPattern(qualities) {
    if (qualities.valence === 'negative' && qualities.intensity === 'high') {
      return 'distressing';
    }
    if (qualities.valence === 'positive' && qualities.intensity === 'high') {
      return 'elevating';
    }
    if (qualities.spatiality === 'contractive') {
      return 'constricting';
    }
    if (qualities.spatiality === 'expansive') {
      return 'expanding';
    }
    return 'neutral';
  }

  _identifyDominantTendency(tendencies) {
    const entries = Object.entries(tendencies);
    entries.sort((a, b) => (b[1] ? 1 : 0) - (a[1] ? 1 : 0));
    return entries[0][0];
  }

  _assessFunctionalValue(tendencies) {
    if (tendencies.approach && !tendencies.avoidance) {
      return 'approach-oriented (generally adaptive)';
    }
    if (tendencies.avoidance && !tendencies.approach) {
      return 'avoidance-oriented (context-dependent)';
    }
    if (tendencies.aggression) {
      return 'aggression-oriented (requires regulation)';
    }
    return 'mixed (requires assessment)';
  }

  _identifyCognitivePattern(processes) {
    if (processes.rumination && !processes.reasoning) {
      return 'ruminative (may be maladaptive)';
    }
    if (processes.reasoning && processes.attention) {
      return 'analytical (generally adaptive)';
    }
    if (processes.rumination && processes.memory) {
      return 'past-focused rumination';
    }
    return 'mixed';
  }

  _assessCognitiveFlexibility(processes) {
    const activeCount = Object.values(processes).filter(v => v).length;
    if (activeCount >= 4) return 'high';
    if (activeCount >= 2) return 'moderate';
    return 'low';
  }

  _calculateEvaluationComplexity(dimensions) {
    const definedCount = Object.values(dimensions).filter(v => v !== 'unknown' && v !== 'situational').length;
    return definedCount / Object.keys(dimensions).length;
  }

  _assessEvaluationAdaptiveness(dimensions) {
    const maladaptiveIndicators = [
      dimensions.controllability === 'low',
      dimensions.certainty === 'low',
      dimensions.responsibility === 'self' && dimensions.valence === 'negative'
    ];
    const count = maladaptiveIndicators.filter(Boolean).length;
    
    if (count >= 3) return 'potentially-maladaptive';
    if (count >= 1) return 'mixed';
    return 'potentially-adaptive';
  }
}

module.exports = ComponentAnalyzer;
