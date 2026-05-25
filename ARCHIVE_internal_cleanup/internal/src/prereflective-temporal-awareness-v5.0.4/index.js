/**
 * HeartFlow v5.0.4 - 前反思自我意识与时间意识整合模块
 * Prereflective Self-Consciousness & Temporal Awareness Integration
 * 
 * 理论来源:
 * - SEP: Self-Consciousness (Phenomenological Approaches)
 * - SEP: Temporal Consciousness
 * - Husserl: 时间现象学 (滞留 - 原印象 - 前摄)
 * - Sartre: 前反思自我意识
 * - Merleau-Ponty: 身体现象学
 * - William James: Specious Present (似现时)
 * 
 * @version 5.0.4
 * @author HeartFlow Team
 * @date 2026-03-30
 */

class PrereflectiveTemporalAwarenessV5 {
  constructor() {
    this.version = '5.0.4';
    this.moduleName = 'prereflective-temporal-awareness';
    
    // 默认参数
    this.defaultParams = {
      // 似现时窗口 (秒)
      speciousPresentMin: 1.0,
      speciousPresentMax: 5.0,
      speciousPresentTypical: 2.5,
      
      // 滞留系数健康范围
      retentionHealthyMin: 0.3,
      retentionHealthyMax: 0.5,
      
      // 前摄准确性健康范围
      protentionAccuracyHealthyMin: 0.6,
      protentionAccuracyHealthyMax: 0.8,
      
      // 前反思意识健康阈值
      prereflectiveHealthyMin: 0.6,
      reflectiveOverdrive: 0.8  // 过度反思阈值
    };
  }

  // =====================================================
  // 1. 前反思自我意识检测器
  // =====================================================

  /**
   * 检测前反思自我意识水平
   * @param {Object} experience - 体验描述
   * @returns {Object} 前反思意识评估结果
   */
  detectPrereflectiveAwareness(experience) {
    const {
      description = '',
      reflectiveLevel = 0.5,    // 0=完全前反思，1=完全反思
      selfDistance = 0.5,       // 0=完全融合，1=完全分离
      experientialRichness = 0.5, // 体验丰富度
      judgmentLevel = 0.5,      // 评判程度
      presentMomentFocus = 0.5  // 当下聚焦程度
    } = experience;

    // For-me-ness (第一人称给定性) 计算
    const forMeNess = this._calculateForMeNess({
      description,
      selfDistance,
      presentMomentFocus
    });

    // 非对象化程度
    const nonObjectifying = this._assessNonObjectifying({
      reflectiveLevel,
      judgmentLevel,
      description
    });

    // 体验厚度 (现象学丰富度)
    const experientialThickness = this._calculateExperientialThickness({
      description,
      experientialRichness
    });

    // 前反思意识总分
    const prereflectiveScore = this._calculatePrereflectiveScore({
      forMeNess,
      nonObjectifying,
      experientialThickness,
      reflectiveLevel,
      selfDistance
    });

    // 状态分类
    const stateCategory = this._categorizeAwarenessState(prereflectiveScore, reflectiveLevel, selfDistance);

    return {
      prereflectiveScore: Math.round(prereflectiveScore * 100) / 100,
      forMeNess: Math.round(forMeNess * 100) / 100,
      nonObjectifying,
      experientialThickness: Math.round(experientialThickness * 100) / 100,
      selfExperienceDistance: Math.round(selfDistance * 100) / 100,
      stateCategory,
      timestamp: new Date().toISOString()
    };
  }

  _calculateForMeNess({ description, selfDistance, presentMomentFocus }) {
    // For-me-ness: 体验的第一人称给定性
    // 关键词检测："我"、"我的"、"感觉到"、"体验到"
    const firstPersonMarkers = ['我', '我的', '我感觉', '我体验', '我感到', 'my', 'I feel', 'I experience'];
    const markerCount = firstPersonMarkers.filter(m => description.toLowerCase().includes(m)).length;
    const markerScore = Math.min(markerCount / 3, 1.0);

    // 自我距离越低，for-me-ness 越高
    const distanceScore = 1 - selfDistance;

    // 当下聚焦越高，for-me-ness 越高
    const presentScore = presentMomentFocus;

    return (markerScore * 0.4 + distanceScore * 0.35 + presentScore * 0.25);
  }

  _assessNonObjectifying({ reflectiveLevel, judgmentLevel, description }) {
    // 对象化语言检测
    const objectifyingMarkers = ['应该', '不应该', '好/坏', '对/错', '正常', '异常', 'should', 'should not', 'good', 'bad', 'wrong'];
    const judgmentCount = objectifyingMarkers.filter(m => description.toLowerCase().includes(m)).length;
    const judgmentScore = Math.min(judgmentCount / 2, 1.0);

    // 反思水平越高，对象化程度越高
    const reflectiveObjectifying = reflectiveLevel * 0.6;
    const judgmentObjectifying = judgmentLevel * 0.4;

    const totalObjectifying = reflectiveObjectifying + judgmentObjectifying + (judgmentScore * 0.2);
    
    // 非对象化 = 1 - 对象化
    return {
      isNonObjectifying: totalObjectifying < 0.4,
      objectifyingLevel: Math.round(totalObjectifying * 100) / 100,
      nonObjectifyingScore: Math.round((1 - totalObjectifying) * 100) / 100
    };
  }

  _calculateExperientialThickness({ description, experientialRichness }) {
    // 体验厚度：现象学丰富度
    // 感官细节检测
    const sensoryCategories = {
      visual: ['看', '见', '视觉', '颜色', '光', '亮', 'see', 'look', 'visual'],
      auditory: ['听', '声音', '响', '安静', 'hear', 'sound', 'noise'],
      somatic: ['感觉', '触', '痛', '紧', '松', '热', '冷', 'feel', 'touch', 'tight', 'warm'],
      emotional: ['情绪', '情感', '心情', '感受', 'emotion', 'feeling', 'mood'],
      temporal: ['之前', '现在', '之后', '持续', '变化', 'before', 'now', 'after', 'change']
    };

    let detectedCategories = 0;
    Object.values(sensoryCategories).forEach(markers => {
      if (markers.some(m => description.toLowerCase().includes(m))) {
        detectedCategories++;
      }
    });

    const sensoryScore = detectedCategories / 5;
    const richnessScore = experientialRichness;

    return (sensoryScore * 0.5 + richnessScore * 0.5);
  }

  _calculatePrereflectiveScore({ forMeNess, nonObjectifying, experientialThickness, reflectiveLevel, selfDistance }) {
    // 前反思意识 = for-me-ness + 非对象化 + 体验厚度 - 过度反思 - 自我分离
    const baseScore = (forMeNess * 0.35 + 
                       nonObjectifying.nonObjectifyingScore * 0.25 + 
                       experientialThickness * 0.2);
    
    const penalty = (reflectiveLevel > 0.7 ? (reflectiveLevel - 0.7) * 0.5 : 0) +
                    (selfDistance > 0.6 ? (selfDistance - 0.6) * 0.3 : 0);

    return Math.max(0, Math.min(1, baseScore - penalty));
  }

  _categorizeAwarenessState(prereflectiveScore, reflectiveLevel, selfDistance) {
    if (prereflectiveScore >= 0.75 && reflectiveLevel < 0.5) {
      return {
        category: 'FLOW_STATE',
        label: '心流/沉浸状态',
        description: '高度前反思意识，体验与自我融合',
        recommendation: '保持这种自然觉察状态'
      };
    } else if (prereflectiveScore >= 0.6 && reflectiveLevel < 0.6) {
      return {
        category: 'HEALTHY_AWARENESS',
        label: '健康觉察状态',
        description: '平衡的前反思与反思意识',
        recommendation: '良好的觉察状态，可继续深化'
      };
    } else if (reflectiveLevel > 0.7) {
      return {
        category: 'OVER_REFLECTIVE',
        label: '过度反思状态',
        description: '过度分析和对象化体验',
        recommendation: '练习放下分析，回归直接体验'
      };
    } else if (selfDistance > 0.7) {
      return {
        category: 'DISSOCIATED',
        label: '解离状态',
        description: '自我与体验分离，for-me-ness 低',
        recommendation: '身体锚定练习，重建自我 - 体验连接'
      };
    } else {
      return {
        category: 'LOW_AWARENESS',
        label: '低觉察状态',
        description: '前反思意识水平较低',
        recommendation: '正念练习，培养当下觉察'
      };
    }
  }

  // =====================================================
  // 2. 时间意识结构分析器
  // =====================================================

  /**
   * 分析时间意识结构
   * @param {Array} experienceSequence - 体验时间序列
   * @returns {Object} 时间意识结构分析
   */
  analyzeTemporalConsciousness(experienceSequence) {
    if (!experienceSequence || experienceSequence.length < 2) {
      return {
        error: '需要至少 2 个时间点的体验数据',
        minLength: 2,
        providedLength: experienceSequence ? experienceSequence.length : 0
      };
    }

    // 计算似现时窗口
    const speciousPresent = this._estimateSpeciousPresent(experienceSequence);

    // 计算滞留强度
    const retentionStrength = this._calculateRetentionStrength(experienceSequence);

    // 计算前摄倾向
    const protentionTendency = this._calculateProtentionTendency(experienceSequence);

    // 识别时间模型
    const temporalModel = this._identifyTemporalModel({
      speciousPresent,
      retentionStrength,
      protentionTendency,
      sequence: experienceSequence
    });

    // 时间深度评估
    const temporalDepth = this._assessTemporalDepth(experienceSequence);

    return {
      speciousPresent: Math.round(speciousPresent * 100) / 100,
      speciousPresentUnit: 'seconds',
      retentionStrength: Math.round(retentionStrength * 100) / 100,
      protentionTendency: Math.round(protentionTendency * 100) / 100,
      temporalDepth: Math.round(temporalDepth * 100) / 100,
      temporalModel,
      healthAssessment: this._assessTemporalHealth({
        speciousPresent,
        retentionStrength,
        protentionTendency,
        temporalDepth
      }),
      timestamp: new Date().toISOString()
    };
  }

  _estimateSpeciousPresent(sequence) {
    // 基于体验连续性估计似现时窗口
    // 方法：检测体验被感知为"连续"而非"离散"的时间跨度
    
    const continuityScores = [];
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      
      // 连续性 = 1 - (体验变化幅度 / 最大可能变化)
      const changeMagnitude = Math.abs((curr.intensity || 0) - (prev.intensity || 0));
      const continuity = 1 - Math.min(changeMagnitude, 1);
      continuityScores.push(continuity);
    }

    // 平均连续性
    const avgContinuity = continuityScores.reduce((a, b) => a + b, 0) / continuityScores.length;

    // 似现时窗口 = 基础窗口 × 连续性系数
    const baseWindow = this.defaultParams.speciousPresentTypical;
    const adjustedWindow = baseWindow * (0.5 + avgContinuity * 0.5);

    return Math.max(
      this.defaultParams.speciousPresentMin,
      Math.min(this.defaultParams.speciousPresentMax, adjustedWindow)
    );
  }

  _calculateRetentionStrength(sequence) {
    // 滞留强度：过去体验对当下的影响
    // 方法：检测情绪/体验的"余韵"效应
    
    if (sequence.length < 3) return 0.5;

    const intensityChanges = [];
    for (let i = 1; i < sequence.length; i++) {
      const change = (sequence[i].intensity || 0) - (sequence[i - 1].intensity || 0);
      intensityChanges.push(change);
    }

    // 检测"滞后效应"：强度变化是否缓慢衰减
    let decayRate = 0;
    for (let i = 1; i < intensityChanges.length; i++) {
      if (intensityChanges[i - 1] !== 0) {
        const ratio = Math.abs(intensityChanges[i] / intensityChanges[i - 1]);
        decayRate += ratio;
      }
    }
    decayRate /= (intensityChanges.length - 1);

    // 衰减越慢，滞留越强
    return Math.min(1, decayRate * 0.8);
  }

  _calculateProtentionTendency(sequence) {
    // 前摄倾向：未来导向的预期强度
    // 方法：检测描述中的未来指向语言
    
    let futureOrientedCount = 0;
    const futureMarkers = ['将', '会', '要', '期待', '担心', '预期', 'will', 'going to', 'expect', 'worry', 'anticipate'];
    
    sequence.forEach(exp => {
      const desc = (exp.description || '').toLowerCase();
      if (futureMarkers.some(m => desc.includes(m))) {
        futureOrientedCount++;
      }
    });

    return Math.min(1, futureOrientedCount / sequence.length);
  }

  _identifyTemporalModel({ speciousPresent, retentionStrength, protentionTendency, sequence }) {
    // 识别主导的时间意识模型

    const scores = {
      cinematic: 0,
      retentional: 0,
      extensional: 0
    };

    // Cinematic 模型特征：短似现时、低滞留、碎片化
    if (speciousPresent < 1.5) scores.cinematic += 0.4;
    if (retentionStrength < 0.3) scores.cinematic += 0.3;
    
    // 检测碎片化
    const fragmentation = this._detectFragmentation(sequence);
    if (fragmentation > 0.6) scores.cinematic += 0.3;

    // Retentional 模型特征：强滞留、过去导向
    if (retentionStrength > 0.6) scores.retentional += 0.5;
    if (protentionTendency < 0.3) scores.retentional += 0.2;

    // Extensional 模型特征：健康的时间深度、平衡的滞留 - 前摄
    if (speciousPresent >= 2 && speciousPresent <= 4) scores.extensional += 0.3;
    if (retentionStrength >= 0.3 && retentionStrength <= 0.5) scores.extensional += 0.3;
    if (protentionTendency >= 0.4 && protentionTendency <= 0.7) scores.extensional += 0.2;

    // 确定主导模型
    const maxScore = Math.max(scores.cinematic, scores.retentional, scores.extensional);
    const dominantModel = Object.keys(scores).find(k => scores[k] === maxScore);

    return {
      dominantModel,
      scores: {
        cinematic: Math.round(scores.cinematic * 100) / 100,
        retentional: Math.round(scores.retentional * 100) / 100,
        extensional: Math.round(scores.extensional * 100) / 100
      },
      description: this._getModelDescription(dominantModel)
    };
  }

  _detectFragmentation(sequence) {
    // 检测体验碎片化程度
    if (sequence.length < 2) return 0;

    let fragmentation = 0;
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      
      // 主题/情绪/注意力的突然变化 = 碎片化
      const themeChange = (prev.theme !== curr.theme) ? 1 : 0;
      const emotionChange = Math.abs((curr.emotionIntensity || 0) - (prev.emotionIntensity || 0));
      
      fragmentation += (themeChange * 0.5 + emotionChange * 0.5);
    }

    return Math.min(1, fragmentation / (sequence.length - 1));
  }

  _getModelDescription(model) {
    const descriptions = {
      cinematic: {
        label: '电影式模型',
        characteristic: '体验如静态快照序列，缺乏连续感',
        intervention: '正念连续性练习，培养时间深度'
      },
      retentional: {
        label: '滞留式模型',
        characteristic: '过度沉溺于过去体验，情绪余韵过长',
        intervention: '释放滞留技术，平衡过去 - 未来导向'
      },
      extensional: {
        label: '扩展式模型',
        characteristic: '健康的时间深度体验，平衡的滞留与前摄',
        intervention: '保持并深化当前的时间意识状态'
      }
    };
    return descriptions[model] || descriptions.extensional;
  }

  _assessTemporalDepth(sequence) {
    // 时间深度：体验的时间扩展程度
    // 综合考虑似现时、滞留、前摄
    
    const speciousPresent = this._estimateSpeciousPresent(sequence);
    const retentionStrength = this._calculateRetentionStrength(sequence);
    const protentionTendency = this._calculateProtentionTendency(sequence);

    // 健康的时间深度 = 适度似现时 + 平衡的滞留和前摄
    const speciousScore = 1 - Math.abs(speciousPresent - 3) / 3; // 3 秒为理想
    const balanceScore = 1 - Math.abs(retentionStrength - protentionTendency);
    
    return (speciousScore * 0.5 + balanceScore * 0.3 + (1 - this._detectFragmentation(sequence)) * 0.2);
  }

  _assessTemporalHealth({ speciousPresent, retentionStrength, protentionTendency, temporalDepth }) {
    const issues = [];
    const strengths = [];

    // 似现时评估
    if (speciousPresent < 1.5) {
      issues.push('似现时窗口过短，可能导致体验碎片化');
    } else if (speciousPresent > 4) {
      issues.push('似现时窗口过长，可能导致信息过载');
    } else {
      strengths.push('似现时窗口处于健康范围');
    }

    // 滞留评估
    if (retentionStrength < 0.2) {
      issues.push('滞留过弱，可能缺乏情绪学习和记忆整合');
    } else if (retentionStrength > 0.7) {
      issues.push('滞留过强，可能沉溺于过去体验');
    } else {
      strengths.push('滞留强度适中');
    }

    // 前摄评估
    if (protentionTendency < 0.2) {
      issues.push('前摄过弱，可能缺乏未来导向和动机');
    } else if (protentionTendency > 0.8) {
      issues.push('前摄过强，可能导致焦虑和过度预期');
    } else {
      strengths.push('前摄倾向平衡');
    }

    return {
      overall: temporalDepth >= 0.6 ? 'HEALTHY' : 'NEEDS_ATTENTION',
      strengths,
      issues,
      recommendations: this._generateTemporalRecommendations({
        speciousPresent,
        retentionStrength,
        protentionTendency
      })
    };
  }

  _generateTemporalRecommendations({ speciousPresent, retentionStrength, protentionTendency }) {
    const recommendations = [];

    if (speciousPresent < 1.5) {
      recommendations.push({
        area: '似现时扩展',
        technique: '连续性觉察练习',
        instruction: '注意体验的连续流动，而非离散片段。聆听完整旋律而非单个音符。'
      });
    }

    if (retentionStrength > 0.6) {
      recommendations.push({
        area: '滞留释放',
        technique: '放下练习',
        instruction: '觉察到对过去的执着时，轻柔地将注意力带回当下呼吸。'
      });
    }

    if (protentionTendency > 0.7) {
      recommendations.push({
        area: '前摄平衡',
        technique: '预期检验',
        instruction: '区分现实预期与焦虑性担忧。问自己："这是基于证据的预期还是恐惧？"'
      });
    }

    return recommendations;
  }

  // =====================================================
  // 3. 情绪时间结构映射
  // =====================================================

  /**
   * 映射情绪的时间结构
   * @param {Object} emotionEpisode - 情绪事件
   * @returns {Object} 情绪时间剖面
   */
  mapEmotionTemporalStructure(emotionEpisode) {
    const { emotion, timeline = [], description = '' } = emotionEpisode;

    if (timeline.length < 2) {
      return {
        error: '需要至少 2 个时间点的情绪数据',
        emotion
      };
    }

    // 排序时间线
    const sortedTimeline = [...timeline].sort((a, b) => a.time - b.time);

    // 找到峰值
    const peakIndex = sortedTimeline.reduce(
      (maxIdx, curr, idx, arr) => 
        (curr.intensity || 0) > (arr[maxIdx].intensity || 0) ? idx : maxIdx,
      0
    );

    const peak = sortedTimeline[peakIndex];
    const start = sortedTimeline[0];
    const end = sortedTimeline[sortedTimeline.length - 1];

    // 计算时间参数
    const riseTime = peak.time - start.time;
    const decayTime = end.time - peak.time;
    const peakIntensity = peak.intensity || 0;
    const baselineIntensity = (start.intensity + end.intensity) / 2;

    // 滞留系数 = 余韵强度 / 峰值强度
    const retentionIntensity = end.intensity || 0;
    const retentionCoefficient = peakIntensity > 0 ? retentionIntensity / peakIntensity : 0;

    // 情绪时间积分 (近似)
    const temporalIntegral = this._calculateTemporalIntegral(sortedTimeline);

    // 前摄准确性 (如果有预期数据)
    const protentionAccuracy = this._calculateProtentionAccuracy(emotionEpisode);

    return {
      emotion,
      temporalProfile: {
        riseTime: Math.round(riseTime * 100) / 100,
        decayTime: Math.round(decayTime * 100) / 100,
        peakTime: Math.round(peak.time * 100) / 100,
        peakIntensity: Math.round(peakIntensity * 100) / 100,
        baselineIntensity: Math.round(baselineIntensity * 100) / 100,
        retentionCoefficient: Math.round(retentionCoefficient * 100) / 100,
        temporalIntegral: Math.round(temporalIntegral * 100) / 100,
        protentionAccuracy: protentionAccuracy !== null ? Math.round(protentionAccuracy * 100) / 100 : null
      },
      emotionType: this._categorizeEmotionByTemporalProfile({
        riseTime,
        decayTime,
        peakIntensity,
        retentionCoefficient
      }),
      regulationEfficiency: this._calculateRegulationEfficiency(temporalIntegral, peakIntensity, decayTime),
      timestamp: new Date().toISOString()
    };
  }

  _calculateTemporalIntegral(timeline) {
    // 数值积分 (梯形法则)
    let integral = 0;
    for (let i = 1; i < timeline.length; i++) {
      const t1 = timeline[i - 1].time;
      const t2 = timeline[i].time;
      const i1 = timeline[i - 1].intensity || 0;
      const i2 = timeline[i].intensity || 0;
      
      // 梯形面积 = (上底 + 下底) × 高 / 2
      integral += (i1 + i2) * (t2 - t1) / 2;
    }
    return integral;
  }

  _calculateProtentionAccuracy(emotionEpisode) {
    const { predictedIntensity, actualPeakIntensity } = emotionEpisode;
    
    if (predictedIntensity === undefined || actualPeakIntensity === undefined) {
      return null;
    }

    // 准确性 = 1 - 相对误差
    const relativeError = Math.abs(predictedIntensity - actualPeakIntensity) / 
                          Math.max(predictedIntensity, actualPeakIntensity, 0.01);
    return Math.max(0, 1 - relativeError);
  }

  _categorizeEmotionByTemporalProfile({ riseTime, decayTime, peakIntensity, retentionCoefficient }) {
    // 基于时间剖面分类情绪类型

    if (riseTime < 1 && peakIntensity > 0.8) {
      return {
        type: 'SURPRISE_STARTLE',
        label: '惊起/惊讶型',
        characteristic: '快速上升，高强度，快速消退'
      };
    }

    if (decayTime > 10 && retentionCoefficient > 0.5) {
      return {
        type: 'GRIEF_MELANCHOLY',
        label: '悲伤/忧郁型',
        characteristic: '长消退时间，高滞留系数'
      };
    }

    if (riseTime < 2 && peakIntensity > 0.7 && decayTime < 5) {
      return {
        type: 'ANGER_FRUSTRATION',
        label: '愤怒/挫折型',
        characteristic: '快速上升，高强度，中等消退'
      };
    }

    if (riseTime > 3 && peakIntensity < 0.5 && decayTime > 8) {
      return {
        type: 'ANXIOUS apprehension',
        label: '焦虑/忧虑型',
        characteristic: '缓慢上升，中低强度，长消退'
      };
    }

    return {
      type: 'MIXED_COMPLEX',
      label: '混合/复杂型',
      characteristic: '不符合典型模式'
    };
  }

  _calculateRegulationEfficiency(integral, peakIntensity, decayTime) {
    // 调节效率 = 实际情绪积分相对于"预期"积分的比例
    // 预期积分 = 峰值 × 典型持续时间
    
    const typicalDuration = 5; // 5 分钟典型情绪持续时间
    const expectedIntegral = peakIntensity * typicalDuration;
    
    const efficiency = Math.max(0, 1 - (integral - expectedIntegral) / expectedIntegral);
    
    return {
      score: Math.round(efficiency * 100) / 100,
      category: efficiency >= 0.7 ? 'EFFICIENT' : efficiency >= 0.4 ? 'MODERATE' : 'INEFFICIENT',
      description: this._getEfficiencyDescription(efficiency)
    };
  }

  _getEfficiencyDescription(efficiency) {
    if (efficiency >= 0.7) {
      return '情绪调节效率高，恢复速度快';
    } else if (efficiency >= 0.4) {
      return '情绪调节效率中等，有提升空间';
    } else {
      return '情绪调节效率低，可能需要干预策略';
    }
  }

  // =====================================================
  // 4. 前反思觉察干预生成器
  // =====================================================

  /**
   * 生成前反思觉察干预方案
   * @param {Object} awarenessProfile - 意识评估结果
   * @param {Object} temporalProfile - 时间意识评估结果
   * @returns {Object} 干预方案
   */
  generatePrereflectiveIntervention(awarenessProfile, temporalProfile) {
    const interventions = [];

    // 基于前反思意识状态
    if (awarenessProfile.stateCategory?.category === 'OVER_REFLECTIVE') {
      interventions.push({
        priority: 'HIGH',
        area: '减少过度反思',
        technique: '正念去中心化',
        steps: [
          '觉察到分析思维的出现',
          '轻柔地将注意力从思维转移到身体感受',
          '注意呼吸的自然流动，不加控制',
          '允许体验如其所是，不加评判'
        ],
        duration: '5-10 分钟',
        frequency: '每日 2-3 次'
      });
    }

    if (awarenessProfile.stateCategory?.category === 'DISSOCIATED') {
      interventions.push({
        priority: 'HIGH',
        area: '重建自我 - 体验连接',
        technique: '身体锚定练习',
        steps: [
          '双脚踩地，感受地面支撑',
          '注意身体与椅子/地面的接触点',
          '扫描身体，寻找任何感觉 (温暖、压力、震动)',
          '轻柔地说："此刻，我在这里，我体验到..."'
        ],
        duration: '5 分钟',
        frequency: '需要时立即进行'
      });
    }

    // 基于时间意识状态
    if (temporalProfile.temporalModel?.dominantModel === 'cinematic') {
      interventions.push({
        priority: 'MEDIUM',
        area: '扩展似现时窗口',
        technique: '连续性觉察练习',
        steps: [
          '选择一个持续变化的对象 (如蜡烛火焰、流水)',
          '注意变化的连续性，而非离散状态',
          '当发现注意力碎片化时，轻柔带回',
          '扩展练习到声音、身体感受'
        ],
        duration: '10 分钟',
        frequency: '每日 1 次'
      });
    }

    if (temporalProfile.retentionStrength > 0.6) {
      interventions.push({
        priority: 'MEDIUM',
        area: '释放情绪滞留',
        technique: '放下与接纳练习',
        steps: [
          '觉察到对过去的执着',
          '承认："这是过去的体验，它已经过去了"',
          '深呼吸，呼气时想象释放',
          '将注意力带回当下的身体感受'
        ],
        duration: '5-8 分钟',
        frequency: '当觉察到沉溺时'
      });
    }

    if (temporalProfile.protentionTendency > 0.7) {
      interventions.push({
        priority: 'MEDIUM',
        area: '平衡前摄焦虑',
        technique: '预期检验与重构',
        steps: [
          '识别自动化预期 ("如果...怎么办")',
          '问："这是基于证据的预期还是恐惧？"',
          '寻找支持/反对预期的证据',
          '生成更平衡的预期'
        ],
        duration: '10 分钟',
        frequency: '当觉察到焦虑性预期时'
      });
    }

    // 默认基础练习
    if (interventions.length === 0) {
      interventions.push({
        priority: 'LOW',
        area: '维持健康觉察',
        technique: '日常正念练习',
        steps: [
          '每日 3 次暂停，注意当下体验',
          '觉察呼吸 3 次',
          '注意身体感受',
          '继续活动，保持轻柔觉察'
        ],
        duration: '1-2 分钟',
        frequency: '每日 3 次'
      });
    }

    return {
      interventions,
      summary: this._generateInterventionSummary(interventions),
      estimatedTotalTime: interventions.reduce((sum, i) => 
        sum + parseInt(i.duration), 0) + ' 分钟/日'
    };
  }

  _generateInterventionSummary(interventions) {
    const highPriority = interventions.filter(i => i.priority === 'HIGH');
    const mediumPriority = interventions.filter(i => i.priority === 'MEDIUM');
    
    let summary = '';
    if (highPriority.length > 0) {
      summary += `高优先级干预：${highPriority.length} 项。`;
    }
    if (mediumPriority.length > 0) {
      summary += `中优先级干预：${mediumPriority.length} 项。`;
    }
    if (interventions.length === 0) {
      summary = '当前状态良好，保持日常正念练习即可。';
    }
    
    return summary;
  }

  // =====================================================
  // 5. 15 分钟前反思 - 时间觉察练习
  // =====================================================

  /**
   * 15 分钟前反思 - 时间觉察练习
   * @param {Object} context - 练习上下文
   * @returns {Object} 练习方案
   */
  prereflectiveTemporalPractice(context = {}) {
    const {
      focusArea = 'general',  // general / for-me-ness / temporal / emotion
      experienceLevel = 'beginner'  // beginner / intermediate / advanced
    } = context;

    const practice = {
      title: '15 分钟前反思 - 时间觉察练习',
      version: this.version,
      totalDuration: 15,
      durationUnit: 'minutes',
      focusArea,
      experienceLevel,
      stages: []
    };

    // 阶段 1: 前反思觉察入门 (3 分钟)
    practice.stages.push({
      stage: 1,
      name: '前反思觉察入门',
      duration: 3,
      instructions: [
        '找一个舒适的姿势，轻轻闭上眼睛或柔和地注视前方',
        '注意体验的自然流动，不加分析、不加评判',
        '觉察到思维的出现，但不跟随，让它自然流过',
        '培养"只是觉察"的态度，如天空观云',
        '注意：你不是在"做"觉察，你"就是"觉察本身'
      ],
      cues: [
        '当发现自己在分析时，轻柔地说："回到觉察"',
        '注意身体与支撑面的接触感',
        '允许体验如其所是'
      ],
      phenomenologicalFocus: '非对象化的纯粹觉察'
    });

    // 阶段 2: For-me-ness 探索 (3 分钟)
    practice.stages.push({
      stage: 2,
      name: '第一人称给定性探索',
      duration: 3,
      instructions: [
        '注意体验的"为我性"——这是"我的"体验的直接感受',
        '不是通过思考"这是我的体验"，而是直接感受这种给定性',
        '注意：即使不思考"我"，体验仍然以第一人称方式呈现',
        '探索这种前反思的自我觉知——它一直在那里',
        '注意体验与"我"之间的非二元性'
      ],
      cues: [
        '问："此刻的体验，对谁呈现？"',
        '不要回答，直接感受',
        '注意这种给定性不需要思考'
      ],
      phenomenologicalFocus: 'For-me-ness 的直接体验'
    });

    // 阶段 3: 时间窗口扩展 (4 分钟)
    practice.stages.push({
      stage: 3,
      name: '时间意识窗口扩展',
      duration: 4,
      instructions: [
        '注意当下的体验——这个"现在"有多宽？',
        '觉察滞留：刚过去的声音、感受如何仍然"在"意识中？',
        '觉察前摄：对即将到来的体验是否有微妙预期？',
        '注意：当下不是瞬间，而是一个有时间深度的"场"',
        '扩展这个时间窗口，注意更长的连续体验'
      ],
      cues: [
        '听一个持续的声音，注意它的"延续"',
        '注意呼吸的完整周期：吸 - 停 - 呼 - 停',
        '觉察：过去没有消失，未来已经以预期方式在场'
      ],
      phenomenologicalFocus: '滞留 - 原印象 - 前摄的三元结构'
    });

    // 阶段 4: 情绪时间追踪 (3 分钟)
    if (focusArea === 'emotion' || focusArea === 'general') {
      practice.stages.push({
        stage: 4,
        name: '情绪时间结构追踪',
        duration: 3,
        instructions: [
          '如果此刻有情绪，注意它的时间结构',
          '它何时开始？现在处于什么阶段？',
          '注意情绪的升起、持续、变化的微妙过程',
          '观察而不卷入：情绪如天气，你如天空',
          '注意：情绪有时间深度，不是瞬间状态'
        ],
        cues: [
          '问："这个情绪的时间形状是什么？"',
          '注意身体感受的流动',
          '允许情绪有自己的时间节奏'
        ],
        phenomenologicalFocus: '情绪的时间性'
      });
    } else {
      practice.stages.push({
        stage: 4,
        name: '身体时间性探索',
        duration: 3,
        instructions: [
          '注意身体感受的时间结构',
          '呼吸的连续性：每一次呼吸都"滞留"前一次',
          '心跳的节奏：过去的心跳如何影响此刻的感受？',
          '注意：身体体验也是时间扩展的',
          '感受身体作为"时间场"而非"物体"'
        ],
        cues: [
          '扫描身体，注意感受的流动',
          '注意：身体感受如波浪，有升起和消退',
          '感受身体的"活的时间"'
        ],
        phenomenologicalFocus: '身体时间性'
      });
    }

    // 阶段 5: 整合与回归 (2 分钟)
    practice.stages.push({
      stage: 5,
      name: '整合与回归',
      duration: 2,
      instructions: [
        '整合前反思觉察与时间意识',
        '注意：觉察本身也是时间扩展的',
        '设定意向：将这种觉察品质带入接下来的活动',
        '轻柔地动动手指、脚趾，感受身体',
        '当准备好时，慢慢睁开眼睛'
      ],
      cues: [
        '问："如何将这种觉察带入日常生活？"',
        '记住：觉察一直在那里，只需记得"回到"它',
        '感谢自己投入这段时间'
      ],
      phenomenologicalFocus: '整合与过渡'
    });

    // 练习后反思问题
    practice.reflectionQuestions = [
      '练习中，你注意到前反思觉察与反思思维的区别吗？',
      'For-me-ness 的体验是什么样的？能描述吗？',
      '你如何体验"当下"的时间宽度？',
      '练习前后，你的体验品质有什么变化？',
      '你想将哪个觉察品质带入日常生活？'
    ];

    // 进阶变体
    if (experienceLevel === 'advanced') {
      practice.advancedVariations = [
        {
          name: '现象学还原变体',
          description: '在阶段 1 后加入 epoché(悬置判断) 练习',
          instruction: '对所有体验内容加括号："这是体验的内容"，回到纯粹意识本身'
        },
        {
          name: '时间意识深度探索',
          description: '延长阶段 3 至 8 分钟，深入探索滞留 - 前摄结构',
          instruction: '注意：每一个"现在"都包含刚刚过去和即将到来'
        }
      ];
    }

    return practice;
  }

  // =====================================================
  // 6. 现象学还原助手
  // =====================================================

  /**
   * 现象学还原助手
   * @param {Object} experienceDescription - 体验描述
   * @returns {Object} 现象学还原结果
   */
  phenomenologicalReduction(experienceDescription) {
    const {
      description = '',
      judgments = [],
      interpretations = []
    } = experienceDescription;

    // 步骤 1: 悬置判断 (Epoché)
    const epochéResult = this._performEpoché(description);

    // 步骤 2: 纯描述提取
    const pureDescription = this._extractPureDescription(epochéResult.suspended);

    // 步骤 3: 本质结构识别
    const essentialStructures = this._identifyEssentialStructures(pureDescription);

    // 步骤 4: 第一人称聚焦
    const firstPersonFocused = this._focusFirstPerson(pureDescription);

    return {
      originalDescription: description,
      epoché: {
        suspended: epochéResult.suspended,
        identifiedJudgments: epochéResult.judgments,
        identifiedInterpretations: epochéResult.interpretations
      },
      pureDescription: {
        text: pureDescription,
        sensoryComponents: this._identifySensoryComponents(pureDescription),
        temporalComponents: this._identifyTemporalComponents(pureDescription),
        emotionalComponents: this._identifyEmotionalComponents(pureDescription)
      },
      essentialStructures,
      firstPersonFocused,
      qualityAssessment: this._assessDescriptionQuality(pureDescription),
      timestamp: new Date().toISOString()
    };
  }

  _performEpoché(description) {
    // 识别并悬置判断和解释
    
    const judgmentPatterns = [
      { pattern: /应该 | 不应该 | 必须 | 不该/g, type: 'normative' },
      { pattern: /好 | 坏 | 对 | 错 | 正常 | 异常/g, type: 'evaluative' },
      { pattern: /总是 | 从不 | 每次 | 永远/g, type: 'generalization' },
      { pattern: /因为 | 所以 | 导致 | 意味着/g, type: 'causal' }
    ];

    const identifiedJudgments = [];
    let suspended = description;

    judgmentPatterns.forEach(({ pattern, type }) => {
      const matches = suspended.match(pattern);
      if (matches) {
        identifiedJudgments.push(...matches.map(m => ({ text: m, type })));
      }
    });

    // 标记判断 (而非删除)
    identifiedJudgments.forEach(j => {
      suspended = suspended.replace(j.text, `[判断:${j.text}]`);
    });

    return {
      suspended,
      judgments: identifiedJudgments,
      interpretations: []  // 可扩展更复杂的解释识别
    };
  }

  _extractPureDescription(suspended) {
    // 移除判断标记，保留纯描述
    return suspended
      .replace(/\[判断:[^\]]+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _identifySensoryComponents(description) {
    const components = {
      visual: [],
      auditory: [],
      somatic: [],
      emotional: [],
      cognitive: []
    };

    const sentences = description.split(/[.!?]/);
    sentences.forEach(sentence => {
      const s = sentence.trim();
      if (!s) return;

      if (s.match(/看 | 见 | 视觉 | 颜色 | 光/i)) components.visual.push(s);
      if (s.match(/听 | 声音 | 响 | 安静/i)) components.auditory.push(s);
      if (s.match(/感觉 | 触 | 痛 | 紧 | 身体/i)) components.somatic.push(s);
      if (s.match(/情绪 | 情感 | 心情 | 感受/i)) components.emotional.push(s);
      if (s.match(/想 | 思考 | 认为 | 相信/i)) components.cognitive.push(s);
    });

    return components;
  }

  _identifyTemporalComponents(description) {
    const temporal = {
      past: [],
      present: [],
      future: [],
      duration: [],
      change: []
    };

    const sentences = description.split(/[.!?]/);
    sentences.forEach(sentence => {
      const s = sentence.trim();
      if (!s) return;

      if (s.match(/之前 | 曾经 | 过去 | 当时/i)) temporal.past.push(s);
      if (s.match(/现在 | 此刻 | 当下 | 正在/i)) temporal.present.push(s);
      if (s.match(/将 | 会 | 要 | 接下来/i)) temporal.future.push(s);
      if (s.match(/持续 | 一直 | 整个/i)) temporal.duration.push(s);
      if (s.match(/变化 | 变成 | 开始 | 结束/i)) temporal.change.push(s);
    });

    return temporal;
  }

  _identifyEmotionalComponents(description) {
    const emotions = [];
    const emotionWords = [
      '高兴', '悲伤', '愤怒', '恐惧', '惊讶', '厌恶',
      '焦虑', '平静', '兴奋', '沮丧', '满足', '困惑',
      '爱', '恨', '嫉妒', '感激', '羞愧', '骄傲'
    ];

    emotionWords.forEach(word => {
      if (description.includes(word)) {
        emotions.push(word);
      }
    });

    return emotions;
  }

  _identifyEssentialStructures(pureDescription) {
    // 识别体验的本质结构 (不变的特征)
    
    const structures = [];

    // 检测主体 - 客体结构
    if (pureDescription.match(/我 | 我的 | 自己/)) {
      structures.push({
        type: 'SUBJECTIVITY',
        description: '体验包含第一人称主体性',
        evidence: '描述中使用第一人称'
      });
    }

    // 检测时间性结构
    if (pureDescription.match(/现在 | 此刻 | 正在 | 持续/)) {
      structures.push({
        type: 'TEMPORALITY',
        description: '体验具有时间性结构',
        evidence: '描述中包含时间标记'
      });
    }

    // 检测身体性结构
    if (pureDescription.match(/身体 | 感觉 | 触 | 呼吸/)) {
      structures.push({
        type: 'EMBODIMENT',
        description: '体验具有身体维度',
        evidence: '描述中包含身体感受'
      });
    }

    // 检测意向性结构
    if (pureDescription.match(/关于 | 对 | 朝向 | 指向/)) {
      structures.push({
        type: 'INTENTIONALITY',
        description: '体验具有意向性 (关于某物)',
        evidence: '描述中包含意向性标记'
      });
    }

    return structures;
  }

  _focusFirstPerson(description) {
    // 确保描述保持第一人称视角
    
    if (!description.match(/我 | 我的 | 自己/)) {
      return '[注意] 描述中缺少第一人称标记。现象学描述应保持第一人称视角。';
    }

    return description;
  }

  _assessDescriptionQuality(description) {
    const criteria = [
      {
        name: '具体性',
        test: description.length > 30,
        feedback: description.length > 30 ? '描述足够具体' : '描述过于简略，增加感官细节'
      },
      {
        name: '当下性',
        test: description.match(/现在 | 此刻 | 正在/i),
        feedback: description.match(/现在 | 此刻 | 正在/i) ? '聚焦当下体验' : '尝试用当下时态描述'
      },
      {
        name: '非评判',
        test: !description.match(/应该 | 好 | 坏 | 对 | 错/i),
        feedback: !description.match(/应该 | 好 | 坏 | 对 | 错/i) ? '保持非评判态度' : '尝试去除评判性语言'
      },
      {
        name: '第一人称',
        test: description.match(/我 | 我的/i),
        feedback: description.match(/我 | 我的/i) ? '保持第一人称视角' : '使用第一人称描述'
      }
    ];

    const passed = criteria.filter(c => c.test).length;
    
    return {
      overallScore: Math.round((passed / criteria.length) * 100) / 100,
      criteria,
      summary: `质量评分：${passed}/${criteria.length} 标准通过`
    };
  }

  // =====================================================
  // 7. 完整评估与干预流程
  // =====================================================

  /**
   * 完整的前反思 - 时间意识评估与干预
   * @param {Object} input - 输入数据
   * @returns {Object} 完整评估与干预方案
   */
  fullAssessmentAndIntervention(input) {
    const {
      currentExperience = {},
      emotionHistory = [],
      temporalPatterns = [],
      context = {}
    } = input;

    // 1. 前反思意识评估
    const prereflectiveAssessment = this.detectPrereflectiveAwareness(currentExperience);

    // 2. 时间意识评估
    const temporalAssessment = temporalPatterns.length > 1
      ? this.analyzeTemporalConsciousness(temporalPatterns)
      : { note: '需要更多时间序列数据' };

    // 3. 情绪时间结构 (如果有情绪历史)
    const emotionTemporalMapping = emotionHistory.length > 0
      ? emotionHistory.map(ep => this.mapEmotionTemporalStructure(ep))
      : [];

    // 4. 干预生成
    const intervention = (prereflectiveAssessment.prereflectiveScore !== undefined && 
                          temporalAssessment.temporalModel)
      ? this.generatePrereflectiveIntervention(prereflectiveAssessment, temporalAssessment)
      : { note: '需要完整评估数据' };

    // 5. 练习方案
    const practice = this.prereflectiveTemporalPractice({
      focusArea: context.focusArea || 'general',
      experienceLevel: context.experienceLevel || 'beginner'
    });

    return {
      version: this.version,
      assessment: {
        prereflective: prereflectiveAssessment,
        temporal: temporalAssessment,
        emotionTemporal: emotionTemporalMapping
      },
      intervention,
      practice,
      summary: this._generateFullSummary(prereflectiveAssessment, temporalAssessment, intervention),
      timestamp: new Date().toISOString()
    };
  }

  _generateFullSummary(prereflective, temporal, intervention) {
    let summary = '【前反思 - 时间意识评估摘要】\n\n';

    // 前反思状态
    summary += `前反思意识状态：${prereflective.stateCategory?.label || '待评估'}\n`;
    summary += `For-me-ness 强度：${(prereflective.forMeNess * 100).toFixed(0)}%\n`;
    summary += `自我 - 体验距离：${(prereflective.selfExperienceDistance * 100).toFixed(0)}%\n\n`;

    // 时间意识状态
    if (temporal.temporalModel) {
      summary += `时间意识模型：${temporal.temporalModel.description?.label || temporal.temporalModel.dominantModel}\n`;
      summary += `似现时窗口：${temporal.speciousPresent}秒\n`;
      summary += `滞留强度：${(temporal.retentionStrength * 100).toFixed(0)}%\n`;
      summary += `前摄倾向：${(temporal.protentionTendency * 100).toFixed(0)}%\n\n`;
    }

    // 干预建议
    if (intervention.interventions && intervention.interventions.length > 0) {
      summary += `干预建议：${intervention.interventions.length} 项\n`;
      summary += `高优先级：${intervention.interventions.filter(i => i.priority === 'HIGH').length} 项\n`;
      summary += `预计练习时间：${intervention.estimatedTotalTime}\n`;
    }

    return summary;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrereflectiveTemporalAwarenessV5;
}

// 浏览器全局
if (typeof window !== 'undefined') {
  window.PrereflectiveTemporalAwarenessV5 = PrereflectiveTemporalAwarenessV5;
}
