/**
 * 预测加工情绪增强模块 (Predictive Emotion Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 预测加工理论 (Predictive Processing)
 * 
 * 核心理论：
 * - 大脑是预测机器，不断生成对世界的假设
 * - 感知是"受控幻觉"(controlled hallucination)
 * - 情绪是身体状态的预测调节
 * - 预测误差最小化是认知核心机制
 * 
 * 可操作技术：
 * - 情绪预测：基于过去经验生成当前情境的预期情绪
 * - 误差检测：识别预测情绪与实际情绪的差异
 * - 模型更新：根据误差调整内部情绪模型
 * - 主动推理：通过行动改变感觉输入以减少误差
 * 
 * @module predictive-emotion-enhanced
 */

const PredictiveEmotionEnhanced = {
  /**
   * 模块元信息
   */
  meta: {
    name: '预测加工情绪增强',
    version: '1.0.0',
    source: 'SEP Predictive Processing + Emotion Theory',
    description: '基于预测加工理论的情绪预测与误差最小化模块',
    upgradeVersion: 'v4.5.0'
  },

  /**
   * 预测加工核心模型
   * 
   * 基于 Friston 自由能原理与预测编码理论
   */
  predictiveModel: {
    /**
     * 情绪先验信念 (Emotion Priors)
     * 基于过去经验形成的情绪预期
     */
    priors: {
      // 情境 → 情绪映射
      situationEmotionMap: {
        '社交评价': { expected: '焦虑', intensity: 0.7 },
        '目标阻碍': { expected: '愤怒', intensity: 0.6 },
        '损失事件': { expected: '悲伤', intensity: 0.8 },
        '成就达成': { expected: '喜悦', intensity: 0.7 },
        '不确定情境': { expected: '恐惧', intensity: 0.5 },
        '道德违反': { expected: '厌恶', intensity: 0.6 }
      },
      
      // 身体状态 → 情绪映射
      bodyEmotionMap: {
        '高唤醒 + 紧张': { expected: '焦虑', intensity: 0.7 },
        '高唤醒 + 热感': { expected: '愤怒', intensity: 0.6 },
        '低唤醒 + 沉重': { expected: '悲伤', intensity: 0.8 },
        '高唤醒 + 轻松': { expected: '喜悦', intensity: 0.7 },
        '低唤醒 + 平静': { expected: '平静', intensity: 0.5 }
      }
    },

    /**
     * 生成情绪预测
     * @param {Object} context - 当前情境
     * @returns {Object} 情绪预测结果
     */
    generatePrediction: function(context) {
      const { situation, bodyState, pastExperience } = context;
      
      // 基于情境的预测
      const situationPrediction = this.priors.situationEmotionMap[situation] || 
                                  { expected: '中性', intensity: 0.3 };
      
      // 基于身体状态的预测
      const bodyPrediction = this.priors.bodyEmotionMap[bodyState] || 
                            { expected: '中性', intensity: 0.3 };
      
      // 基于过去经验的调整
      const experienceAdjustment = pastExperience ? this.adjustByExperience(pastExperience, situationPrediction) : 0;
      
      // 整合预测
      const integratedPrediction = {
        predictedEmotion: situationPrediction.expected,
        predictedIntensity: Math.min(1.0, situationPrediction.intensity + experienceAdjustment),
        confidence: this.calculateConfidence(situation, bodyState),
        predictionSources: ['situation', 'bodyState', pastExperience ? 'pastExperience' : null].filter(Boolean),
        timestamp: Date.now()
      };
      
      return integratedPrediction;
    },

    /**
     * 基于过去经验调整预测
     */
    adjustByExperience: function(pastExperience, basePrediction) {
      // 如果有强烈的过去经验，调整预测强度
      if (pastExperience.similarity > 0.7) {
        return pastExperience.emotionIntensity * 0.2; // 20% 调整幅度
      }
      return 0;
    },

    /**
     * 计算预测置信度
     */
    calculateConfidence: function(situation, bodyState) {
      let confidence = 0.5; // 基础置信度
      
      // 情境明确性
      if (this.priors.situationEmotionMap[situation]) {
        confidence += 0.2;
      }
      
      // 身体状态一致性
      if (this.priors.bodyEmotionMap[bodyState]) {
        confidence += 0.2;
      }
      
      // 情境与身体状态一致时增加置信度
      const situEmotion = this.priors.situationEmotionMap[situation]?.expected;
      const bodyEmotion = this.priors.bodyEmotionMap[bodyState]?.expected;
      if (situEmotion && bodyEmotion && situEmotion === bodyEmotion) {
        confidence += 0.1;
      }
      
      return Math.min(1.0, confidence);
    }
  },

  /**
   * 预测误差计算
   */
  predictionError: {
    /**
     * 计算情绪预测误差
     * @param {Object} prediction - 预测情绪
     * @param {Object} actual - 实际情绪
     * @returns {Object} 误差分析结果
     */
    calculate: function(prediction, actual) {
      const emotionDifference = this.calculateEmotionDifference(prediction.predictedEmotion, actual.emotion);
      const intensityDifference = prediction.predictedIntensity - actual.intensity;
      const absoluteIntensityError = Math.abs(intensityDifference);
      
      // 误差分类
      const errorType = this.classifyError(emotionDifference, absoluteIntensityError);
      
      // 误差显著性
      const significance = this.calculateSignificance(emotionDifference, absoluteIntensityError, prediction.confidence);
      
      return {
        emotionDifference,
        intensityDifference,
        absoluteIntensityError,
        errorType,
        significance,
        predictionConfidence: prediction.confidence,
        needsModelUpdate: significance > 0.5,
        timestamp: Date.now()
      };
    },

    /**
     * 计算情绪差异 (0=相同，1=完全不同)
     */
    calculateEmotionDifference: function(predicted, actual) {
      if (predicted === actual) return 0;
      
      // 情绪家族分类
      const emotionFamilies = {
        '焦虑': ['恐惧', '担忧', '紧张'],
        '愤怒': ['恼怒', '愤慨', '暴怒'],
        '悲伤': ['忧郁', '沮丧', '悲痛'],
        '喜悦': ['快乐', '兴奋', '满足'],
        '厌恶': ['鄙视', '反感', '憎恶'],
        '惊讶': ['震惊', '诧异']
      };
      
      // 检查是否在同一情绪家族
      for (const [family, members] of Object.entries(emotionFamilies)) {
        if ((predicted === family || members.includes(predicted)) &&
            (actual === family || members.includes(actual))) {
          return 0.3; // 同一家族内差异较小
        }
      }
      
      // 不同家族的基本情绪差异
      const basicEmotions = ['喜悦', '悲伤', '愤怒', '恐惧', '厌恶', '惊讶'];
      const predictedIdx = basicEmotions.indexOf(predicted);
      const actualIdx = basicEmotions.indexOf(actual);
      
      if (predictedIdx === -1 || actualIdx === -1) return 0.7;
      
      // 计算在情绪轮上的距离
      const distance = Math.abs(predictedIdx - actualIdx);
      return Math.min(1.0, distance / 3); // 最大距离归一化
    },

    /**
     * 误差分类
     */
    classifyError: function(emotionDiff, intensityDiff) {
      if (emotionDiff === 0 && intensityDiff < 0.2) {
        return 'minor'; // 微小误差
      } else if (emotionDiff < 0.3 && intensityDiff < 0.4) {
        return 'moderate'; // 中等误差
      } else if (emotionDiff < 0.5) {
        return 'significant'; // 显著误差 (情绪家族内)
      } else {
        return 'major'; // 重大误差 (跨情绪家族)
      }
    },

    /**
     * 计算误差显著性
     */
    calculateSignificance: function(emotionDiff, intensityDiff, confidence) {
      // 高置信度预测的大误差更显著
      const weightedError = (emotionDiff * 0.6 + intensityDiff * 0.4) * (1 + confidence * 0.5);
      return Math.min(1.0, weightedError);
    }
  },

  /**
   * 情绪模型更新
   */
  modelUpdate: {
    /**
     * 基于预测误差更新情绪模型
     * @param {Object} error - 预测误差
     * @param {Object} context - 当前情境
     * @returns {Object} 更新结果
     */
    update: function(error, context) {
      if (!error.needsModelUpdate) {
        return { updated: false, reason: '误差不显著' };
      }
      
      const { situation, bodyState } = context;
      const updates = [];
      
      // 更新情境 → 情绪映射
      if (error.emotionDifference > 0.5) {
        updates.push(this.updateSituationEmotionMap(situation, error));
      }
      
      // 更新身体状态 → 情绪映射
      if (error.intensityDifference > 0.3) {
        updates.push(this.updateIntensityPrior(situation, error));
      }
      
      return {
        updated: true,
        updates,
        timestamp: Date.now()
      };
    },

    /**
     * 更新情境情绪映射
     */
    updateSituationEmotionMap: function(situation, error) {
      // 这里应该是持久化存储，暂时用内存模拟
      return {
        type: 'situationEmotionMap',
        situation,
        change: 'recorded_for_learning',
        impact: 'future_predictions_will_adjust'
      };
    },

    /**
     * 更新强度先验
     */
    updateIntensityPrior: function(situation, error) {
      return {
        type: 'intensityPrior',
        situation,
        adjustment: -error.intensityDifference * 0.1, // 10% 调整
        impact: 'intensity_predictions_refined'
      };
    }
  },

  /**
   * 预测误差最小化策略
   * 
   * 基于主动推理 (Active Inference) 理论
   */
  errorMinimization: {
    /**
     * 选择并执行误差最小化策略
     * @param {Object} error - 预测误差
     * @param {Object} context - 当前情境
     * @returns {Object} 策略执行结果
     */
    minimize: function(error, context) {
      const strategy = this.selectStrategy(error, context);
      const result = this.executeStrategy(strategy, context);
      
      return {
        selectedStrategy: strategy,
        executionResult: result,
        expectedErrorReduction: this.estimateErrorReduction(strategy, error),
        timestamp: Date.now()
      };
    },

    /**
     * 选择策略
     */
    selectStrategy: function(error, context) {
      // 根据误差类型选择策略
      if (error.errorType === 'minor') {
        return 'acceptance'; // 接受微小误差
      } else if (error.errorType === 'moderate') {
        return 'reappraisal'; // 认知重评
      } else if (error.errorType === 'significant') {
        return 'action'; // 行动改变情境
      } else { // major
        return 'modelRevision'; // 模型修正
      }
    },

    /**
     * 执行策略
     */
    executeStrategy: function(strategy, context) {
      const strategies = {
        'acceptance': {
          action: 'acceptUncertainty',
          description: '接受预测的不确定性，降低对准确性的期望',
          technique: '正念接纳练习',
          steps: [
            '觉察预测与实际的情绪差异',
            '承认预测本质上是概率性的',
            '允许不确定性存在',
            '保持开放和好奇的态度'
          ]
        },
        'reappraisal': {
          action: 'cognitiveReappraisal',
          description: '重新解释情境以调整情绪预测',
          technique: '认知重评练习',
          steps: [
            '识别当前的情境解释',
            '寻找替代性解释',
            '评估各解释的证据',
            '选择更平衡的解释'
          ]
        },
        'action': {
          action: 'changeSituation',
          description: '通过行动改变情境以减少误差',
          technique: '问题解决导向行动',
          steps: [
            '识别可改变的情境因素',
            '制定具体行动计划',
            '执行行动',
            '监测情绪变化'
          ]
        },
        'modelRevision': {
          action: 'updateBeliefs',
          description: '修正深层情绪信念和预期',
          technique: '信念更新练习',
          steps: [
            '识别核心情绪信念',
            '检验信念的证据基础',
            '考虑信念的功能性',
            '形成更适应的新信念'
          ]
        }
      };
      
      return strategies[strategy] || strategies['acceptance'];
    },

    /**
     * 估计误差减少效果
     */
    estimateErrorReduction: function(strategy, error) {
      const reductionRates = {
        'acceptance': 0.3, // 接受可减少 30% 主观误差
        'reappraisal': 0.5, // 重评可减少 50%
        'action': 0.7, // 行动可减少 70%
        'modelRevision': 0.6 // 模型修正可减少 60%
      };
      
      const baseReduction = reductionRates[strategy] || 0.3;
      return error.significance * baseReduction;
    }
  },

  /**
   * 核心 API
   */

  /**
   * 执行完整的预测加工循环
   * @param {Object} context - 情境信息
   * @param {Object} actualEmotion - 实际情绪
   * @returns {Object} 完整分析结果
   */
  runPredictiveCycle: function(context, actualEmotion) {
    // 1. 生成预测
    const prediction = this.predictiveModel.generatePrediction(context);
    
    // 2. 计算误差
    const error = this.predictionError.calculate(prediction, actualEmotion);
    
    // 3. 更新模型 (如需要)
    const modelUpdate = this.modelUpdate.update(error, context);
    
    // 4. 最小化误差
    const minimization = this.errorMinimization.minimize(error, context);
    
    return {
      prediction,
      error,
      modelUpdate,
      minimization,
      cycleComplete: true,
      timestamp: Date.now()
    };
  },

  /**
   * 情绪预测练习
   * @param {String} situation - 即将面对的情境
   * @returns {Object} 练习指导
   */
  emotionPredictionExercise: function(situation) {
    return {
      exercise: '情绪预测练习',
      situation,
      steps: [
        {
          step: 1,
          instruction: '暂停并觉察',
          description: '在面对情境前，先暂停 30 秒'
        },
        {
          step: 2,
          instruction: '生成预测',
          description: '问自己："我预计会感受到什么情绪？强度如何？"'
        },
        {
          step: 3,
          instruction: '记录预测',
          description: '将预测写下来：情绪名称 + 强度 (0-10)'
        },
        {
          step: 4,
          instruction: '经历情境',
          description: '自然地经历情境，保持觉察'
        },
        {
          step: 5,
          instruction: '对比实际',
          description: '情境后对比预测与实际情绪的差异'
        },
        {
          step: 6,
          instruction: '学习调整',
          description: '思考：什么导致了差异？下次如何调整预测？'
        }
      ],
      benefits: [
        '提高情绪觉察能力',
        '校准情绪预测准确性',
        '减少情绪 surprise 带来的冲击',
        '增强情绪调节的主动性'
      ]
    };
  },

  /**
   * 预测误差觉察练习
   * @returns {Object} 练习指导
   */
  predictionErrorAwarenessExercise: function() {
    return {
      exercise: '预测误差觉察练习',
      duration: '10-15 分钟',
      steps: [
        {
          step: 1,
          instruction: '回忆最近的情绪意外',
          description: '回想一次你的情绪反应与预期不同的情况'
        },
        {
          step: 2,
          instruction: '分析预测来源',
          description: '问：我当时的预测是什么？这个预测来自哪里？(过去经验/他人告知/假设)'
        },
        {
          step: 3,
          instruction: '识别误差类型',
          description: '是情绪种类错了，还是强度估计错了？'
        },
        {
          step: 4,
          instruction: '探索误差原因',
          description: '为什么会有这个误差？情境有什么不同？你的状态有什么不同？'
        },
        {
          step: 5,
          instruction: '提取学习',
          description: '从这个误差中学到了什么？下次可以如何调整？'
        }
      ],
      reflectionQuestions: [
        '这个误差揭示了什么关于我的情绪模式的信息？',
        '我的哪些信念可能需要更新？',
        '如何将这个学习应用到未来类似情境？'
      ]
    };
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictiveEmotionEnhanced;
}
