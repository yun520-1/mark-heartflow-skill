/**
 * 预测加工情绪增强模块 v5.0.1 (Predictive Emotion Enhancement v5.0.1)
 * 
 * 基于 SEP 预测加工理论 (Predictive Processing)
 * 核心理念：大脑是预测机器，情绪是身体状态的预测调节
 * 
 * SEP 理论来源:
 * - Predictive Processing (SEP Entry)
 * - Active Inference (Friston, 2010)
 * - Controlled Hallucination (Anil Seth)
 * - Free Energy Principle
 * 
 * 核心概念:
 * - 预测生成：大脑不断生成关于世界的预测
 * - 预测误差：预测与输入的差异
 * - 预测误差最小化：通过更新模型或改变输入来减少误差
 * - 主动推理：通过行动使世界符合预测
 * - 受控幻觉：感知是大脑的"受控幻觉"
 * - 自由能原理：生物系统最小化变分自由能
 * 
 * @version 5.0.1 (HeartFlow v5.0.1)
 * @author HeartFlow Team
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
  },

  /**
   * ==================== v5.0.1 新增功能 ====================
   */

  /**
   * 主动推理引擎 (Active Inference Engine)
   * 通过行动使世界符合预测，而非仅仅更新模型
   */
  activeInference: {
    /**
     * 主动推理策略库
     */
    strategies: {
      approach: {
        name: '接近策略',
        description: '主动接近预测积极的情境',
        actions: ['靠近', '探索', '参与', '投入'],
        whenToUse: '预测误差源于回避行为，且情境实际安全时'
      },
      avoidance: {
        name: '回避策略',
        description: '主动远离预测消极的情境',
        actions: ['离开', '设置边界', '拒绝', '保护'],
        whenToUse: '预测误差源于过度暴露于有害情境时'
      },
      modification: {
        name: '改造策略',
        description: '主动改变情境以符合积极预测',
        actions: ['重构', '协商', '创造', '调整'],
        whenToUse: '情境可以改变且值得投入时'
      },
      acceptance: {
        name: '接纳策略',
        description: '接纳不可改变的情境，调整内在预测',
        actions: ['接纳', '放下', '转向', '重新定向'],
        whenToUse: '情境无法改变或改变成本过高时'
      }
    },

    /**
     * 评估主动推理机会
     */
    evaluateOpportunity(context, errorResult) {
      const { currentSituation, availableActions = [] } = context;
      
      // 评估情境可控性
      const controllability = this.assessControllability(currentSituation);
      
      // 评估行动可行性
      const feasibility = this.assessFeasibility(availableActions);
      
      // 评估预期价值
      const expectedValue = this.calculateExpectedValue(errorResult, controllability);
      
      // 推荐策略
      const recommendedStrategy = this.selectStrategy(
        controllability,
        feasibility,
        expectedValue,
        errorResult
      );

      return {
        controllability,
        feasibility,
        expectedValue,
        recommendedStrategy,
        actionPlan: this.generateActionPlan(recommendedStrategy, context),
        confidence: this.calculateConfidence(controllability, feasibility, expectedValue)
      };
    },

    /**
     * 评估情境可控性
     */
    assessControllability(situation) {
      if (!situation) return 0.3;
      
      let score = 0.5;
      
      // 内部情境（如想法、情绪）通常更可控
      if (situation.type === 'internal') {
        score += 0.3;
      }
      
      // 社会情境的可控性中等
      if (situation.type === 'social') {
        score += 0.1;
      }
      
      // 外部环境情境可控性较低
      if (situation.type === 'environmental') {
        score -= 0.2;
      }
      
      // 检查是否有明确的行动路径
      if (situation.actionableSteps) {
        score += 0.2;
      }
      
      return Math.min(1, Math.max(0, score));
    },

    /**
     * 评估行动可行性
     */
    assessFeasibility(actions) {
      if (!actions || actions.length === 0) return 0.2;
      
      // 评估行动的资源需求
      const resourceRequirements = actions.map(action => 
        this.assessResourceRequirement(action)
      );
      
      const avgRequirement = resourceRequirements.reduce((a, b) => a + b, 0) / resourceRequirements.length;
      
      // 资源需求越低，可行性越高
      return 1 - avgRequirement;
    },

    /**
     * 评估行动的资源需求
     */
    assessResourceRequirement(action) {
      const resourceMap = {
        '靠近': 0.3, '探索': 0.4, '参与': 0.5, '投入': 0.6,
        '离开': 0.2, '设置边界': 0.4, '拒绝': 0.3, '保护': 0.4,
        '重构': 0.6, '协商': 0.7, '创造': 0.8, '调整': 0.5,
        '接纳': 0.3, '放下': 0.4, '转向': 0.4, '重新定向': 0.5
      };
      
      return resourceMap[action] || 0.5;
    },

    /**
     * 计算预期价值
     */
    calculateExpectedValue(errorResult, controllability) {
      // 预期价值 = 误差减少潜力 × 可控性
      const errorReductionPotential = errorResult.totalError;
      return errorReductionPotential * controllability;
    },

    /**
     * 选择最佳策略
     */
    selectStrategy(controllability, feasibility, expectedValue, errorResult) {
      // 高可控 + 高可行 → 改造策略
      if (controllability > 0.7 && feasibility > 0.6) {
        return this.strategies.modification;
      }
      
      // 中等可控 + 积极预测 → 接近策略
      if (controllability > 0.5 && errorResult.predictedEmotion === '积极') {
        return this.strategies.approach;
      }
      
      // 低可控 → 接纳策略
      if (controllability < 0.4) {
        return this.strategies.acceptance;
      }
      
      // 默认：回避策略（保守选择）
      return this.strategies.avoidance;
    },

    /**
     * 生成行动计划
     */
    generateActionPlan(strategy, context) {
      return {
        strategy: strategy.name,
        steps: [
          `准备：${strategy.description}`,
          `行动 1: ${strategy.actions[0]}`,
          `行动 2: ${strategy.actions[1]}`,
          '评估：检查预测误差是否减少',
          '调整：根据反馈优化行动'
        ],
        successMetrics: [
          '预测误差减少 50% 以上',
          '情绪强度回到舒适范围',
          '行动后感到掌控感增强'
        ],
        timeframe: '立即执行，24 小时内评估'
      };
    },

    /**
     * 计算信心度
     */
    calculateConfidence(controllability, feasibility, expectedValue) {
      return (controllability * 0.4 + feasibility * 0.4 + expectedValue * 0.2);
    }
  },

  /**
   * 受控幻觉觉察练习 (Controlled Hallucination Awareness)
   * 基于 Anil Seth 的理论：感知是大脑的"受控幻觉"
   */
  controlledHallucinationPractice: {
    /**
     * 核心洞见
     */
    insights: [
      '你的情绪体验不是对外部世界的直接反映，而是大脑的预测性建构',
      '"现实"是你大脑的最佳猜测，不是客观真理',
      '预测误差是学习的机会，不是失败的标志',
      '你可以学会"看见"自己的预测过程',
      '情绪是身体状态的预测调节，不是被动的反应'
    ],

    /**
     * 受控幻觉觉察冥想 (15 分钟)
     */
    awarenessMeditation() {
      return {
        name: '受控幻觉觉察冥想',
        duration: '15 分钟',
        theory: 'Anil Seth - Controlled Hallucination',
        steps: [
          {
            phase: '准备',
            duration: '2 分钟',
            instruction: '舒适地坐着，闭上眼睛。提醒自己：接下来的体验都是大脑的预测性建构。'
          },
          {
            phase: '身体感觉觉察',
            duration: '4 分钟',
            instruction: '注意身体的各种感觉——触感、温度、紧张或放松。问自己：这些感觉是"真实"的，还是大脑的预测？注意两者之间的区别其实很模糊。',
            inquiry: '身体感觉是输入，还是预测？'
          },
          {
            phase: '情绪觉察',
            duration: '4 分钟',
            instruction: '注意当前的情绪。问自己：这个情绪是对某事的"反应"，还是大脑基于过去经验生成的预测？情绪在身体的哪个部位？它的"真实性"感觉如何？',
            inquiry: '情绪是反应，还是预测？'
          },
          {
            phase: '预测过程觉察',
            duration: '3 分钟',
            instruction: '尝试"向后看"——注意大脑如何在生成预测。就像试图看到自己的眼睛，这很困难，但可以注意到预测的"边缘"：预期的感觉、微妙的紧张、对下一刻的倾向。',
            inquiry: '你能注意到预测本身吗？'
          },
          {
            phase: '整合',
            duration: '2 分钟',
            instruction: '理解：你不是被动体验世界，而是主动建构世界。这个建构过程就是"受控幻觉"——受感官输入约束，但本质上是预测性的。',
            insight: '你是体验的创造者，不是受害者'
          }
        ],
        reflection: [
          '这次练习中，你对"现实"的理解有什么变化？',
          '注意到预测过程了吗？它是什么感觉？',
          '这个觉察如何改变你与情绪的关系？'
        ]
      };
    },

    /**
     * 预测误差重构练习
     */
    errorReframing() {
      return {
        name: '预测误差重构练习',
        duration: '10-15 分钟',
        theory: 'Predictive Processing - Error as Learning Signal',
        steps: [
          {
            phase: '识别误差',
            duration: '3 分钟',
            instruction: '回想最近一次情绪预测错误的经历。你预测会发生什么？实际发生了什么？误差有多大？'
          },
          {
            phase: '探索原因',
            duration: '4 分钟',
            instruction: '探索为什么预测错了：是忽略了某些信息？是过度依赖旧模式？是情境真的不可预测？',
            questions: [
              '我忽略了什么信息？',
              '我过度依赖了什么旧模式？',
              '这个情境有什么新颖之处？'
            ]
          },
          {
            phase: '重构误差',
            duration: '4 分钟',
            instruction: '将误差重新框架为学习信号：这个误差教会了你什么？你的模型需要如何更新？',
            reframes: [
              '误差 = 学习机会',
              '误差 = 模型更新的信号',
              '误差 = 成长的催化剂'
            ]
          },
          {
            phase: '整合学习',
            duration: '2 分钟',
            instruction: '总结从这个误差中学到的东西，并想象如何在未来情境中应用这个学习。'
          }
        ],
        outcome: '将预测误差从"失败"重构为"学习信号"'
      };
    }
  },

  /**
   * 身体状态预测调节 (Interoceptive Prediction Regulation)
   * 情绪是身体状态的预测调节
   */
  interoceptivePrediction: {
    /**
     * 身体预测模型
     */
    bodyPredictionModel: {
      /**
       * 生成身体状态预测
       */
      generateBodyPrediction(currentContext) {
        const {
          activityLevel = 'rest',
          timeOfDay = 'day',
          recentInteroceptiveHistory = []
        } = currentContext;

        // 基于活动水平预测
        const activityPredictions = {
          'rest': { arousal: 0.3, energy: 0.4, tension: 0.2 },
          'light': { arousal: 0.4, energy: 0.5, tension: 0.3 },
          'moderate': { arousal: 0.6, energy: 0.7, tension: 0.4 },
          'intense': { arousal: 0.8, energy: 0.9, tension: 0.6 }
        };

        const basePrediction = activityPredictions[activityLevel] || activityPredictions.rest;

        // 时间调节
        if (timeOfDay === 'night') {
          basePrediction.arousal *= 0.7;
          basePrediction.energy *= 0.6;
        }

        // 历史调节
        if (recentInteroceptiveHistory.length > 0) {
          const avgArousal = recentInteroceptiveHistory.reduce((sum, h) => sum + h.arousal, 0) / recentInteroceptiveHistory.length;
          basePrediction.arousal = (basePrediction.arousal + avgArousal) / 2;
        }

        return {
          ...basePrediction,
          predictedAt: Date.now(),
          confidence: 0.7
        };
      },

      /**
       * 计算身体预测误差
       */
      calculateBodyError(predicted, actual) {
        const arousalError = Math.abs(predicted.arousal - actual.arousal);
        const energyError = Math.abs(predicted.energy - actual.energy);
        const tensionError = Math.abs(predicted.tension - actual.tension);

        const totalError = (arousalError + energyError + tensionError) / 3;

        return {
          totalError,
          arousalError,
          energyError,
          tensionError,
          exceedsThreshold: totalError > 0.3
        };
      }
    },

    /**
     * 内感受觉察练习
     */
    interoceptiveAwareness() {
      return {
        name: '内感受觉察练习',
        duration: '10 分钟',
        theory: 'Interoceptive Prediction (Seth, Critchley)',
        steps: [
          {
            phase: '准备',
            duration: '1 分钟',
            instruction: '舒适地坐着或躺着，闭上眼睛。将注意力转向身体内部。'
          },
          {
            phase: '心跳觉察',
            duration: '3 分钟',
            instruction: '注意你的心跳。不要数，只是感受。你能感觉到心跳的节奏、强度、位置吗？注意：你对心跳的"感觉"是大脑的预测，不是心跳本身。',
            inquiry: '心跳感觉是输入，还是预测？'
          },
          {
            phase: '呼吸觉察',
            duration: '3 分钟',
            instruction: '注意呼吸的感觉——空气进出鼻腔、胸腔的起伏、腹部的扩张收缩。同样，这些感觉是大脑的预测性建构。',
            inquiry: '呼吸感觉在哪里结束，预测在哪里开始？'
          },
          {
            phase: '全身扫描',
            duration: '2 分钟',
            instruction: '快速扫描全身，注意各种内感受信号——饥饿、口渴、温度、紧张、放松。每个感觉都是预测。',
            inquiry: '哪些感觉最"真实"？哪些最模糊？'
          },
          {
            phase: '整合',
            duration: '1 分钟',
            instruction: '理解：情绪是身体状态预测的调节。通过觉察内感受预测，你可以更好地调节情绪。'
          }
        ],
        benefit: '增强内感受觉察，改善情绪调节'
      };
    }
  }
};

module.exports = PredictiveEmotionEnhanced;
