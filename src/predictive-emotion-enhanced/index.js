/**
 * 预测加工情绪增强模块 (Predictive Emotion Enhancement)
 * 
 * 基于 SEP 预测加工理论 (Predictive Processing)
 * 核心理念：大脑是预测机器，情绪是身体状态的预测调节
 * 
 * @version 1.0.0
 * @since HeartFlow v4.5.0
 */

const PredictiveEmotionEnhanced = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '预测加工情绪增强',
    version: '1.0.0',
    theory: 'Predictive Processing (SEP)',
    keyConcepts: [
      '预测生成 (Prediction Generation)',
      '预测误差最小化 (Prediction Error Minimization)',
      '受控幻觉 (Controlled Hallucination)',
      '主动推理 (Active Inference)'
    ]
  },

  /**
   * 预测误差阈值配置
   */
  config: {
    defaultErrorThreshold: 0.5,
    minErrorThreshold: 0.2,
    maxErrorThreshold: 0.8,
    modelUpdateRate: 0.1,
    predictionHorizon: 5 // 秒
  },

  /**
   * 情绪预测模型
   * 基于过去经验生成当前情境的预期情绪
   */
  generateEmotionPrediction(context) {
    const {
      currentSituation,
      pastExperiences = [],
      currentBodyState = {},
      timeOfDay = 'day'
    } = context;

    // 从过去经验中提取模式
    const patterns = this.extractPatterns(pastExperiences, currentSituation);
    
    // 生成预测
    const prediction = {
      predictedEmotion: patterns.dominantEmotion || '平静',
      predictedIntensity: patterns.averageIntensity || 2,
      confidence: patterns.confidence || 0.5,
      basis: patterns.basis || '历史模式',
      timeWindow: this.config.predictionHorizon,
      generatedAt: Date.now()
    };

    // 身体状态调节
    if (currentBodyState.arousal) {
      prediction.predictedIntensity *= (1 + currentBodyState.arousal * 0.2);
    }

    return prediction;
  },

  /**
   * 从历史经验中提取情绪模式
   */
  extractPatterns(experiences, currentSituation) {
    if (!experiences || experiences.length === 0) {
      return {
        dominantEmotion: '平静',
        averageIntensity: 2,
        confidence: 0.3,
        basis: '默认值 (无历史数据)'
      };
    }

    // 情境相似度匹配
    const similarExperiences = experiences.filter(exp => 
      this.calculateSituationSimilarity(exp.situation, currentSituation) > 0.6
    );

    if (similarExperiences.length === 0) {
      // 使用全部经验的统计
      const emotionCounts = {};
      let totalIntensity = 0;
      
      experiences.forEach(exp => {
        emotionCounts[exp.emotion] = (emotionCounts[exp.emotion] || 0) + 1;
        totalIntensity += exp.intensity;
      });

      const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '平静';

      return {
        dominantEmotion,
        averageIntensity: totalIntensity / experiences.length,
        confidence: 0.4,
        basis: '全局统计模式'
      };
    }

    // 基于相似经验的预测
    const emotions = similarExperiences.map(exp => exp.emotion);
    const intensities = similarExperiences.map(exp => exp.intensity);
    
    const emotionCounts = {};
    emotions.forEach(e => emotionCounts[e] = (emotionCounts[e] || 0) + 1);
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      dominantEmotion,
      averageIntensity: intensities.reduce((a, b) => a + b, 0) / intensities.length,
      confidence: Math.min(0.9, 0.5 + similarExperiences.length * 0.1),
      basis: `基于 ${similarExperiences.length} 个相似情境`
    };
  },

  /**
   * 计算情境相似度
   */
  calculateSituationSimilarity(sit1, sit2) {
    if (!sit1 || !sit2) return 0;
    
    const keywords1 = (sit1.keywords || []).map(k => k.toLowerCase());
    const keywords2 = (sit2.keywords || []).map(k => k.toLowerCase());
    
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return intersection.length / union.length;
  },

  /**
   * 计算预测误差
   * @param {Object} predicted - 预测的情绪状态
   * @param {Object} actual - 实际的情绪状态
   */
  calculatePredictionError(predicted, actual) {
    const emotionMatch = predicted.predictedEmotion === actual.emotion ? 1 : 0;
    const intensityDiff = Math.abs(predicted.predictedIntensity - actual.intensity);
    const intensityError = intensityDiff / 5; // 归一化到 0-1

    // 综合误差：情绪匹配占 40%，强度误差占 60%
    const error = (1 - emotionMatch) * 0.4 + intensityError * 0.6;

    return {
      totalError: Math.min(1, error),
      emotionError: 1 - emotionMatch,
      intensityError: intensityError,
      exceedsThreshold: error > this.config.defaultErrorThreshold,
      timestamp: Date.now()
    };
  },

  /**
   * 更新情绪模型
   * 基于预测误差调整内部模型
   */
  updateEmotionModel(errorResult, newExperience) {
    const updateRate = this.config.modelUpdateRate;
    const error = errorResult.totalError;

    // 误差越大，学习率越高
    const adaptiveRate = updateRate * (1 + error);

    return {
      modelUpdated: true,
      updateRate: adaptiveRate,
      newExperience: {
        ...newExperience,
        predictionError: error,
        learnedFrom: Date.now()
      },
      confidenceAdjustment: error > 0.5 ? -0.1 : 0.05
    };
  },

  /**
   * 执行预测误差最小化策略
   */
  minimizePredictionError(errorResult, context) {
    const strategies = [];

    if (errorResult.exceedsThreshold) {
      // 策略 1: 更新内部模型 (认知重评)
      strategies.push({
        type: 'model_update',
        name: '认知重评',
        description: '调整对情境的解释和预期',
        action: 'reframe',
        effectiveness: 0.85
      });

      // 策略 2: 主动推理改变输入 (行动)
      strategies.push({
        type: 'active_inference',
        name: '情境改变',
        description: '通过行动改变情境本身',
        action: 'change_situation',
        effectiveness: 0.75
      });

      // 策略 3: 注意部署
      strategies.push({
        type: 'attention_deployment',
        name: '注意转移',
        description: '将注意力转向预测准确的情境方面',
        action: 'shift_attention',
        effectiveness: 0.60
      });
    } else {
      // 误差在可接受范围内，维持当前模型
      strategies.push({
        type: 'maintenance',
        name: '模型维持',
        description: '预测准确，无需调整',
        action: 'maintain',
        effectiveness: 1.0
      });
    }

    return {
      strategies,
      recommendedStrategy: strategies[0],
      errorLevel: errorResult.totalError,
      timestamp: Date.now()
    };
  },

  /**
   * 生成预测觉察练习
   */
  generateAwarenessPractice(context) {
    const practices = [
      {
        name: '预测觉察冥想',
        duration: '5 分钟',
        steps: [
          '闭上眼睛，注意当前的情绪状态',
          '问自己：我预测接下来会发生什么？',
          '注意身体对预测的反应',
          '观察预测与实际体验的差异',
          '不评判，只是觉察'
        ],
        benefit: '增强对预测过程的元认知觉察'
      },
      {
        name: '情绪预测日志',
        duration: '每日',
        steps: [
          '记录情境触发事件',
          '写下预测的情绪反应',
          '记录实际的情绪体验',
          '比较预测与实际的差异',
          '反思：什么导致了差异？'
        ],
        benefit: '提高情绪预测准确性'
      },
      {
        name: '预测误差探索',
        duration: '10 分钟',
        steps: [
          '回想一次情绪预测错误的经历',
          '探索：为什么预测错了？',
          '识别：忽略了什么信息？',
          '学习：如何改进预测模型？',
          '整合：将学习应用到未来情境'
        ],
        benefit: '从预测误差中学习成长'
      }
    ];

    return practices;
  },

  /**
   * 主处理函数：预测加工情绪循环
   */
  processEmotionCycle(context) {
    // 1. 生成预测
    const prediction = this.generateEmotionPrediction(context);
    
    // 2. 获取实际情绪状态
    const actualState = context.currentEmotion || {
      emotion: '平静',
      intensity: 2
    };
    
    // 3. 计算预测误差
    const errorResult = this.calculatePredictionError(prediction, actualState);
    
    // 4. 根据误差决定行动
    let modelUpdate = null;
    let strategies = null;
    
    if (errorResult.exceedsThreshold) {
      // 更新模型
      modelUpdate = this.updateEmotionModel(errorResult, {
        situation: context.currentSituation,
        emotion: actualState.emotion,
        intensity: actualState.intensity
      });
      
      // 生成最小化策略
      strategies = this.minimizePredictionError(errorResult, context);
    }
    
    return {
      prediction,
      actualState,
      error: errorResult,
      modelUpdate,
      strategies,
      processedAt: Date.now()
    };
  }
};

module.exports = PredictiveEmotionEnhanced;
