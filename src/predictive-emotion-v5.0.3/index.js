/**
 * 预测加工情绪模块 v5.0.3 (Predictive Emotion v5.0.3)
 * 
 * 基于 SEP 预测加工理论 (Predictive Processing) + 自由能原理 + 主动推理
 * 
 * SEP 理论来源:
 * - Predictive Processing & Active Inference (Friston, 2010)
 * - Emotion Theory (SEP Entry - 三大传统整合)
 * - Controlled Hallucination (Anil Seth, 2021)
 * - Free Energy Principle (生物系统最小化变分自由能)
 * 
 * 核心理念:
 * 1. 大脑是预测机器，不断生成关于世界的预测模型
 * 2. 情绪是身体内部状态 (内感受) 的预测性调节
 * 3. 情绪体验 = 预测误差的现象学感受
 * 4. 情绪调节 = 调整预测模型或改变身体/环境状态
 * 5. 主动推理 = 通过行动使世界符合预测
 * 
 * 核心功能:
 * - 情绪预测生成 (基于历史模式 + 当前情境)
 * - 预测误差计算与最小化策略
 * - 主动推理干预生成
 * - 身体 - 环境耦合评估
 * - 预测模型更新与学习
 * 
 * @version 5.0.3 (HeartFlow v5.0.3)
 * @author HeartFlow Team
 * @license MIT
 */

const PredictiveEmotionV5 = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '预测加工情绪模块',
    version: '5.0.3',
    theory: 'Predictive Processing + Active Inference (SEP)',
    keyConcepts: [
      '预测生成 (Prediction Generation)',
      '预测误差最小化 (Prediction Error Minimization)',
      '受控幻觉 (Controlled Hallucination)',
      '主动推理 (Active Inference)',
      '自由能原理 (Free Energy Principle)',
      '内感受预测 (Interoceptive Prediction)',
      '层级预测模型 (Hierarchical Predictive Model)'
    ],
    sepReferences: [
      'Emotion (Stanford Encyclopedia of Philosophy)',
      'Predictive Processing (Friston, 2010)',
      'Active Inference (Free Energy Principle)',
      'Emotion Theory - Three Traditions Integration'
    ]
  },

  /**
   * 配置参数
   */
  config: {
    // 预测误差阈值
    errorThresholds: {
      low: 0.2,      // 低误差：预测准确
      medium: 0.5,   // 中等误差：需要调整
      high: 0.8      // 高误差：需要干预
    },
    
    // 模型更新率 (学习率)
    modelUpdateRate: 0.15,
    
    // 预测时间窗口 (秒)
    predictionHorizon: 5,
    
    // 主动推理触发阈值
    activeInferenceThreshold: 0.6,
    
    // 身体状态权重
    bodyStateWeight: 0.4,
    
    // 环境情境权重
    contextWeight: 0.6
  },

  /**
   * 情绪预测模型
   * 基于层级预测生成当前情境的预期情绪
   * 
   * @param {Object} context - 当前情境
   * @returns {Object} 情绪预测结果
   */
  generateEmotionPrediction(context) {
    const {
      currentSituation = {},
      pastExperiences = [],
      currentBodyState = {},
      environmentalCues = {},
      timeOfDay = 'day',
      socialContext = null
    } = context;

    // 层级 1: 从过去经验中提取模式
    const level1Patterns = this.extractPatterns(pastExperiences, currentSituation);
    
    // 层级 2: 身体状态预测调节
    const level2BodyPrediction = this.predictFromBodyState(currentBodyState);
    
    // 层级 3: 环境线索预测
    const level3EnvironmentalPrediction = this.predictFromEnvironment(environmentalCues);
    
    // 层级 4: 社会情境预测 (如果存在)
    const level4SocialPrediction = socialContext ? 
      this.predictFromSocialContext(socialContext) : null;

    // 整合多层级预测
    const integratedPrediction = this.integratePredictions([
      { source: '历史模式', prediction: level1Patterns, weight: 0.4 },
      { source: '身体状态', prediction: level2BodyPrediction, weight: this.config.bodyStateWeight },
      { source: '环境线索', prediction: level3EnvironmentalPrediction, weight: 0.3 },
      ...(level4SocialPrediction ? [{ source: '社会情境', prediction: level4SocialPrediction, weight: 0.2 }] : [])
    ]);

    return {
      predictedEmotion: integratedPrediction.emotion,
      predictedIntensity: integratedPrediction.intensity,
      confidence: integratedPrediction.confidence,
      predictionSources: integratedPrediction.sources,
      timeWindow: this.config.predictionHorizon,
      generatedAt: Date.now(),
      
      // 元认知信息
      metaCognition: {
        predictionClarity: this.calculatePredictionClarity(integratedPrediction),
        uncertaintyLevel: this.calculateUncertainty(integratedPrediction),
        recommendedAction: this.recommendBasedOnPrediction(integratedPrediction)
      }
    };
  },

  /**
   * 从历史经验中提取情绪模式
   */
  extractPatterns(experiences, currentSituation) {
    if (!experiences || experiences.length === 0) {
      return {
        emotion: '平静',
        intensity: 2,
        confidence: 0.3,
        basis: '默认值 (无历史数据)'
      };
    }

    // 情境相似度匹配
    const similarExperiences = experiences.filter(exp => 
      this.calculateSituationSimilarity(exp.situation, currentSituation) > 0.6
    );

    if (similarExperiences.length === 0) {
      return {
        emotion: '平静',
        intensity: 2,
        confidence: 0.4,
        basis: '无相似历史经验'
      };
    }

    // 统计情绪分布
    const emotionCounts = {};
    let totalIntensity = 0;

    similarExperiences.forEach(exp => {
      const emotion = exp.emotion || '平静';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      totalIntensity += exp.intensity || 2;
    });

    // 找到主导情绪
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    const averageIntensity = totalIntensity / similarExperiences.length;
    const confidence = Math.min(0.9, similarExperiences.length / 10 * 0.7 + 0.3);

    return {
      emotion: dominantEmotion,
      intensity: Math.round(averageIntensity * 10) / 10,
      confidence,
      basis: `基于${similarExperiences.length}个相似经验`,
      sampleSize: similarExperiences.length
    };
  },

  /**
   * 计算情境相似度
   */
  calculateSituationSimilarity(situation1, situation2) {
    if (!situation1 || !situation2) return 0;

    const factors = [
      'location', 'time', 'people', 'activity', 'goal', 'challenge'
    ];

    let matchCount = 0;
    factors.forEach(factor => {
      if (situation1[factor] && situation2[factor]) {
        if (situation1[factor].toLowerCase().includes(situation2[factor].toLowerCase()) ||
            situation2[factor].toLowerCase().includes(situation1[factor].toLowerCase())) {
          matchCount++;
        }
      }
    });

    return matchCount / factors.length;
  },

  /**
   * 从身体状态预测情绪
   * 基于内感受预测理论 (Interoceptive Prediction)
   */
  predictFromBodyState(bodyState) {
    const {
      arousal = 0,      // 唤醒度 (0-1)
      valence = 0,      // 效价 (-1 到 1)
      heartRate = 'normal',
      breathing = 'normal',
      muscleTension = 'normal',
      energyLevel = 'normal'
    } = bodyState;

    // 基于身体状态的情绪预测规则
    if (arousal > 0.7 && valence < -0.3) {
      return { emotion: '焦虑', intensity: 7, confidence: 0.7 };
    }
    if (arousal > 0.7 && valence > 0.3) {
      return { emotion: '兴奋', intensity: 7, confidence: 0.7 };
    }
    if (arousal < 0.3 && valence < -0.3) {
      return { emotion: '沮丧', intensity: 5, confidence: 0.6 };
    }
    if (arousal < 0.3 && valence > 0.3) {
      return { emotion: '平静', intensity: 3, confidence: 0.6 };
    }

    // 基于生理指标
    if (heartRate === 'elevated' && breathing === 'rapid') {
      return { emotion: '紧张', intensity: 6, confidence: 0.65 };
    }
    if (muscleTension === 'high' && energyLevel === 'high') {
      return { emotion: '愤怒', intensity: 6, confidence: 0.6 };
    }

    return { emotion: '平静', intensity: 3, confidence: 0.5 };
  },

  /**
   * 从环境线索预测情绪
   */
  predictFromEnvironment(environmentalCues) {
    const {
      lighting = 'normal',
      noise = 'normal',
      temperature = 'comfortable',
      space = 'normal',
      nature = false
    } = environmentalCues;

    // 环境 - 情绪关联规则
    if (lighting === 'dim' && noise === 'quiet') {
      return { emotion: '沉思', intensity: 3, confidence: 0.5 };
    }
    if (lighting === 'bright' && noise === 'loud') {
      return { emotion: '兴奋', intensity: 5, confidence: 0.5 };
    }
    if (nature === true) {
      return { emotion: '平静', intensity: 4, confidence: 0.6 };
    }
    if (temperature === 'uncomfortable') {
      return { emotion: '烦躁', intensity: 4, confidence: 0.55 };
    }

    return { emotion: '平静', intensity: 3, confidence: 0.4 };
  },

  /**
   * 从社会情境预测情绪
   */
  predictFromSocialContext(socialContext) {
    const {
      relationship = 'stranger',
      groupSize = 1,
      socialGoal = 'none',
      perceivedJudgment = 'neutral'
    } = socialContext;

    // 社会情境 - 情绪关联
    if (perceivedJudgment === 'negative' && groupSize > 3) {
      return { emotion: '社交焦虑', intensity: 6, confidence: 0.7 };
    }
    if (relationship === 'close' && socialGoal === 'connection') {
      return { emotion: '温暖', intensity: 5, confidence: 0.65 };
    }
    if (socialGoal === 'achievement' && groupSize > 1) {
      return { emotion: '竞争性兴奋', intensity: 5, confidence: 0.6 };
    }

    return { emotion: '平静', intensity: 3, confidence: 0.5 };
  },

  /**
   * 整合多层级预测
   */
  integratePredictions(predictions) {
    const emotionScores = {};
    let totalWeight = 0;
    let weightedIntensity = 0;
    let weightedConfidence = 0;
    const sources = [];

    predictions.forEach(({ source, prediction, weight }) => {
      if (!prediction) return;

      const { emotion, intensity, confidence } = prediction;
      
      // 累加情绪分数
      emotionScores[emotion] = (emotionScores[emotion] || 0) + (weight * confidence);
      
      // 累加强度和置信度
      weightedIntensity += intensity * weight * confidence;
      weightedConfidence += confidence * weight;
      totalWeight += weight;

      sources.push({
        source,
        emotion,
        intensity,
        confidence,
        weight
      });
    });

    // 找到得分最高的情绪
    const dominantEmotion = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      emotion: dominantEmotion ? dominantEmotion[0] : '平静',
      intensity: Math.round((weightedIntensity / totalWeight) * 10) / 10,
      confidence: Math.round((weightedConfidence / totalWeight) * 100) / 100,
      sources
    };
  },

  /**
   * 计算预测清晰度
   */
  calculatePredictionClarity(prediction) {
    const { confidence, sources } = prediction;
    
    // 来源一致性检查
    const emotions = sources.map(s => s.emotion);
    const uniqueEmotions = new Set(emotions);
    const consistency = 1 - (uniqueEmotions.size - 1) / emotions.length;

    return {
      overall: Math.round((confidence * 0.6 + consistency * 0.4) * 100) / 100,
      confidence,
      consistency: Math.round(consistency * 100) / 100
    };
  },

  /**
   * 计算不确定性水平
   */
  calculateUncertainty(prediction) {
    const { confidence, sources } = prediction;
    
    // 基于置信度和来源分歧
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    const confidenceVariance = sources.reduce((sum, s) => 
      sum + Math.pow(s.confidence - avgConfidence, 2), 0) / sources.length;

    return {
      level: confidence < 0.5 ? '高' : confidence < 0.7 ? '中' : '低',
      score: Math.round((1 - confidence) * 100) / 100,
      variance: Math.round(confidenceVariance * 100) / 100
    };
  },

  /**
   * 基于预测推荐行动
   */
  recommendBasedOnPrediction(prediction) {
    const { emotion, intensity, confidence } = prediction;
    
    if (intensity >= 7 && ['焦虑', '愤怒', '恐惧'].includes(emotion)) {
      return {
        priority: '高',
        action: '立即调节',
        strategies: ['深呼吸', '身体扫描', '离开当前环境']
      };
    }
    if (intensity >= 5 && confidence < 0.5) {
      return {
        priority: '中',
        action: '增强觉察',
        strategies: ['情绪标记', '身体感受观察', '情境分析']
      };
    }
    
    return {
      priority: '低',
      action: '保持觉察',
      strategies: ['继续当前活动', '定期情绪检查']
    };
  },

  /**
   * 计算预测误差
   * 预测情绪与实际体验的差异
   */
  calculatePredictionError(prediction, actualExperience) {
    const {
      predictedEmotion,
      predictedIntensity = 3
    } = prediction;

    const {
      actualEmotion,
      actualIntensity = 3
    } = actualExperience;

    // 情绪类别误差 (是否相同)
    const emotionMatch = predictedEmotion === actualEmotion ? 1 : 0;
    
    // 强度误差 (归一化到 0-1)
    const intensityError = Math.abs(predictedIntensity - actualIntensity) / 8;
    
    // 综合误差 (0 = 完全准确，1 = 完全错误)
    const totalError = (1 - emotionMatch) * 0.6 + intensityError * 0.4;

    return {
      totalError: Math.round(totalError * 100) / 100,
      emotionError: 1 - emotionMatch,
      intensityError: Math.round(intensityError * 100) / 100,
      interpretation: this.interpretError(totalError)
    };
  },

  /**
   * 解释预测误差
   */
  interpretError(error) {
    if (error < 0.2) return '预测非常准确 - 模型运作良好';
    if (error < 0.4) return '预测较为准确 - 微调即可';
    if (error < 0.6) return '预测中等误差 - 需要学习调整';
    if (error < 0.8) return '预测误差较大 - 需要模型更新';
    return '预测严重偏差 - 需要重新评估情境';
  },

  /**
   * 预测误差最小化策略
   * 基于自由能原理：通过模型更新或行动减少误差
   */
  minimizePredictionError(error, context) {
    const { totalError, interpretation } = error;

    const strategies = {
      // 策略 1: 模型更新 (改变预测)
      modelUpdate: {
        type: '认知重构',
        description: '调整对情境的理解和预期',
        techniques: [
          '重新评估情境威胁性',
          '寻找替代解释',
          '调整期望值',
          '认知灵活性练习'
        ],
       适用场景: totalError > 0.5
      },

      // 策略 2: 主动推理 (改变世界)
      activeInference: {
        type: '行动干预',
        description: '通过行动使现实符合积极预测',
        techniques: [
          '改变环境',
          '寻求社会支持',
          '采取问题解决行动',
          '创造积极体验'
        ],
        适用场景: totalError > 0.4
      },

      // 策略 3: 身体调节 (改变内感受输入)
      bodyRegulation: {
        type: '生理干预',
        description: '通过身体状态调节影响情绪预测',
        techniques: [
          '深呼吸练习',
          '渐进式肌肉放松',
          '正念身体扫描',
          '运动调节'
        ],
        适用场景: totalError > 0.3
      },

      // 策略 4: 觉察接纳 (减少误差权重)
      mindfulAcceptance: {
        type: '元认知策略',
        description: '接纳不确定性，减少对预测的依赖',
        techniques: [
          '正念觉察',
          '接纳承诺',
          '去中心化观察',
          '价值导向行动'
        ],
        适用场景: totalError > 0.2
      }
    };

    // 根据误差水平推荐策略
    const recommendedStrategies = [];
    if (totalError > 0.5) recommendedStrategies.push(strategies.modelUpdate);
    if (totalError > 0.4) recommendedStrategies.push(strategies.activeInference);
    if (totalError > 0.3) recommendedStrategies.push(strategies.bodyRegulation);
    if (totalError > 0.2) recommendedStrategies.push(strategies.mindfulAcceptance);

    return {
      errorLevel: totalError,
      interpretation,
      recommendedStrategies,
      priority: totalError > 0.6 ? '高' : totalError > 0.4 ? '中' : '低',
      estimatedTimeToReduce: this.estimateTimeToReduce(totalError)
    };
  },

  /**
   * 估计减少误差所需时间
   */
  estimateTimeToReduce(error) {
    if (error < 0.3) return '5-10 分钟';
    if (error < 0.5) return '15-30 分钟';
    if (error < 0.7) return '1-2 小时';
    return '需要持续练习 (数天)';
  },

  /**
   * 主动推理干预生成器
   * 生成具体行动建议来使现实符合积极预测
   */
  generateActiveInferenceIntervention(prediction, context) {
    const { predictedEmotion, predictedIntensity } = prediction;
    const { currentSituation, availableResources = [] } = context;

    // 如果预测是负面情绪，生成干预
    const negativeEmotions = ['焦虑', '愤怒', '恐惧', '沮丧', '悲伤', '孤独'];
    
    if (!negativeEmotions.includes(predictedEmotion)) {
      return {
        needed: false,
        reason: '当前预测情绪为积极/中性',
        suggestion: '保持当前状态，继续觉察'
      };
    }

    // 生成干预方案
    const interventions = [];

    // 1. 环境改变
    if (currentSituation.location) {
      interventions.push({
        type: '环境调节',
        action: `考虑暂时离开"${currentSituation.location}"或改变环境布置`,
        rationale: '改变环境线索可以改变预测输入',
        estimatedImpact: '中等'
      });
    }

    // 2. 社会支持
    interventions.push({
      type: '社会连接',
      action: '与信任的人交流当前感受',
      rationale: '社会支持可以提供新的预测框架',
      estimatedImpact: '高'
    });

    // 3. 身体行动
    interventions.push({
      type: '身体行动',
      action: '进行 5-10 分钟的身体活动 (散步/伸展)',
      rationale: '改变身体状态可以改变内感受预测',
      estimatedImpact: '中等'
    });

    // 4. 认知重构
    interventions.push({
      type: '认知重构',
      action: '问自己："有什么证据支持/反对我当前的预测？"',
      rationale: '检验预测的准确性可以促进模型更新',
      estimatedImpact: '高'
    });

    // 5. 价值导向行动
    interventions.push({
      type: '价值行动',
      action: '做一件符合你核心价值观的小事',
      rationale: '价值行动可以创造积极的预测 - 现实匹配',
      estimatedImpact: '高'
    });

    return {
      needed: true,
      predictedEmotion,
      predictedIntensity,
      interventions,
      recommendedSequence: interventions.slice(0, 3), // 推荐前 3 个
      estimatedTimeToImplement: '15-30 分钟',
      followUp: '实施后重新评估情绪状态'
    };
  },

  /**
   * 更新预测模型 (学习)
   * 基于预测误差调整模型参数
   */
  updatePredictiveModel(pastExperiences, predictionError) {
    const { totalError } = predictionError;

    // 如果误差较大，增加新经验的权重
    const learningRate = this.config.modelUpdateRate * (1 + totalError);

    return {
      updated: true,
      learningRate: Math.round(learningRate * 100) / 100,
      message: totalError > 0.5 
        ? '检测到较大预测误差，模型将加速学习' 
        : '模型微调中',
      recommendation: this.generateLearningRecommendation(totalError)
    };
  },

  /**
   * 生成学习建议
   */
  generateLearningRecommendation(error) {
    if (error < 0.3) {
      return '预测准确率高，继续保持当前觉察练习';
    }
    if (error < 0.5) {
      return '建议增加情绪标记练习，提高情绪粒度';
    }
    if (error < 0.7) {
      return '建议进行情境 - 情绪关联分析，识别预测模式';
    }
    return '建议系统性反思情绪触发因素，可能需要专业支持';
  },

  /**
   * 身体 - 环境耦合评估
   * 评估身体状态与环境因素的相互作用
   */
  assessBodyEnvironmentCoupling(bodyState, environment) {
    const couplingFactors = [];

    // 1. 唤醒度 - 环境匹配
    if (bodyState.arousal > 0.7 && environment.noise === 'loud') {
      couplingFactors.push({
        factor: '高唤醒 + 高噪音',
        effect: '可能加剧焦虑/烦躁',
        recommendation: '寻找安静空间或降低刺激'
      });
    }

    // 2. 能量水平 - 活动匹配
    if (bodyState.energyLevel === 'low' && environment.demands === 'high') {
      couplingFactors.push({
        factor: '低能量 + 高要求',
        effect: '可能导致疲惫/沮丧',
        recommendation: '降低要求或补充能量'
      });
    }

    // 3. 身体舒适度 - 环境舒适度
    if (bodyState.comfort === 'low' && environment.temperature === 'uncomfortable') {
      couplingFactors.push({
        factor: '身体不适 + 环境不适',
        effect: '双重不适可能放大负面情绪',
        recommendation: '优先改善任一因素'
      });
    }

    return {
      couplingScore: couplingFactors.length, // 耦合因素数量
      factors: couplingFactors,
      overallRecommendation: couplingFactors.length > 0 
        ? '检测到身体 - 环境不匹配，建议干预' 
        : '身体 - 环境耦合良好'
    };
  },

  /**
   * 完整的情绪预测 - 误差最小化流程
   */
  fullPredictiveEmotionProcess(context) {
    // 步骤 1: 生成情绪预测
    const prediction = this.generateEmotionPrediction(context);

    // 步骤 2: 如果有实际体验，计算误差
    let errorAnalysis = null;
    if (context.actualExperience) {
      const error = this.calculatePredictionError(prediction, context.actualExperience);
      errorAnalysis = this.minimizePredictionError(error, context);
    }

    // 步骤 3: 生成主动推理干预 (如果需要)
    const intervention = this.generateActiveInferenceIntervention(prediction, context);

    // 步骤 4: 身体 - 环境耦合评估
    const coupling = this.assessBodyEnvironmentCoupling(
      context.currentBodyState || {},
      context.environmentalCues || {}
    );

    return {
      prediction,
      errorAnalysis,
      intervention,
      coupling,
      timestamp: Date.now(),
      version: this.metadata.version
    };
  },

  /**
   * 15 分钟预测觉察练习
   * 帮助用户识别和调整自动化的情绪预测
   */
  predictiveAwarenessPractice(context) {
    const steps = [
      {
        step: 1,
        duration: '3 分钟',
        title: '识别当前预测',
        instruction: '闭上眼睛，问自己："我对接下来会发生什么有什么预期？"',
        prompt: '注意任何自动出现的想法或感受，不加评判地观察它们'
      },
      {
        step: 2,
        duration: '3 分钟',
        title: '身体感受扫描',
        instruction: '将注意力转向身体，注意任何紧张、温暖、或其他感受',
        prompt: '这些身体感受可能与你的预测有关'
      },
      {
        step: 3,
        duration: '4 分钟',
        title: '检验预测证据',
        instruction: '问自己："有什么证据支持这个预测？有什么证据反对它？"',
        prompt: '寻找替代性的、更平衡的预测'
      },
      {
        step: 4,
        duration: '3 分钟',
        title: '生成新预测',
        instruction: '基于更完整的证据，生成一个更平衡的预测',
        prompt: '例如："虽然 X 可能发生，但我有能力应对"'
      },
      {
        step: 5,
        duration: '2 分钟',
        title: '整合与行动',
        instruction: '带着新的预测，决定下一步行动',
        prompt: '这个新预测如何改变你的行为选择？'
      }
    ];

    return {
      practiceName: '预测觉察练习',
      totalDuration: '15 分钟',
      theory: '基于预测加工理论 - 识别和调整自动化预测可以减少预测误差',
      steps,
      expectedOutcome: '提高对自动化预测的觉察，增强认知灵活性，减少情绪反应性'
    };
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictiveEmotionV5;
}
