/**
 * HeartFlow v5.0.14 - 预测加工与具身认知深度整合增强
 * 
 * Predictive Processing & Embodied Cognition Deep Integration Enhancement
 * 
 * 基于 SEP 预测加工理论 + 具身认知理论 + 情绪理论的深度整合
 * 
 * 理论来源:
 * - SEP Predictive Processing (Friston 自由能原理 + 主动推理)
 * - SEP Embodied Cognition (身体约束概念 + 情境化认知)
 * - SEP Emotion (情绪三大传统 + 预测加工视角)
 * - Anil Seth:《Being You》受控幻觉理论
 * - Lisa Feldman Barrett: 情绪建构理论
 * 
 * 核心升级:
 * 1. 多层级预测模型深化 (从低阶身体预测到高阶概念预测)
 * 2. 预测误差精细化计算 (成分分解 + 来源归因)
 * 3. 时间深度预测整合 (过去 - 现在 - 未来的预测连续性)
 * 4. 主动推理干预增强 (多策略干预生成 + 效果预测)
 * 5. 身体 - 环境耦合动态追踪 (吸引子分析 + 分岔预警)
 * 
 * @version 5.0.14
 * @author HeartFlow Team
 * @license MIT
 */

const EventEmitter = require('events')

class PredictiveEmbodiedCognitionEnhanced extends EventEmitter {
  constructor () {
    super()
    this.version = '5.0.14'
    this.name = '预测加工与具身认知深度整合增强'
    this.nameEn = 'Predictive Processing & Embodied Cognition Deep Integration'
    this.codename = 'Predictive-Embodied-Enhancement'
    this.releaseDate = '2026-03-30'
    
    // 多层级预测模型
    this.hierarchicalPredictiveModel = this.buildHierarchicalPredictiveModel()
    
    // 预测误差精细化计算器
    this.predictionErrorCalculator = this.buildPredictionErrorCalculator()
    
    // 主动推理干预生成器
    this.activeInferenceInterventionGenerator = this.buildActiveInferenceInterventionGenerator()
    
    // 动态系统追踪器
    this.dynamicSystemTracker = this.buildDynamicSystemTracker()
    
    // 时间深度预测整合器
    this.temporalDepthPredictor = this.buildTemporalDepthPredictor()
  }

  /**
   * 构建多层级预测模型
   * 基于 Friston 的层级预测加工理论
   * 
   * 层级结构:
   * Level 0: 内感受预测 (身体内部状态)
   * Level 1: 本体感受预测 (身体姿势/动作)
   * Level 2: 情绪预测 (情感效价/唤醒度)
   * Level 3: 概念预测 (情境解释/意义)
   * Level 4: 自我模型预测 (身份/目标/价值观)
   */
  buildHierarchicalPredictiveModel () {
    return {
      levels: {
        level0: {
          name: '内感受预测层',
          nameEn: 'Interoceptive Prediction',
          timescale: '毫秒 - 秒',
          content: '心率、呼吸、体温、血糖、激素水平',
          precision: '高 (低阶预测误差权重高)',
          updateRate: '快速 (100-500ms)',
          example: '预测心跳加速 → 实际心跳正常 → 产生焦虑预测误差'
        },
        level1: {
          name: '本体感受预测层',
          nameEn: 'Proprioceptive Prediction',
          timescale: '秒',
          content: '肌肉张力、身体姿势、动作准备',
          precision: '高',
          updateRate: '快速 (200-800ms)',
          example: '预测肩膀紧张 → 实际放松 → 产生姿势预测误差'
        },
        level2: {
          name: '情绪预测层',
          nameEn: 'Emotional Prediction',
          timescale: '秒 - 分钟',
          content: '效价 (积极/消极)、唤醒度 (高/低)、动机倾向',
          precision: '中',
          updateRate: '中速 (1-5 秒)',
          example: '预测社交焦虑 → 实际感到平静 → 产生情绪预测误差'
        },
        level3: {
          name: '概念预测层',
          nameEn: 'Conceptual Prediction',
          timescale: '分钟 - 小时',
          content: '情境解释、事件意义、因果关系',
          precision: '中低',
          updateRate: '慢速 (5-30 秒)',
          example: '预测"这是威胁" → 重新评估为"这是挑战" → 概念更新'
        },
        level4: {
          name: '自我模型预测层',
          nameEn: 'Self-Model Prediction',
          timescale: '小时 - 天 - 年',
          content: '身份认同、长期目标、核心价值观、人生叙事',
          precision: '低 (高阶先验权重高)',
          updateRate: '极慢 (分钟 - 小时)',
          example: '预测"我是无能的人" → 成功经验积累 → 自我模型缓慢更新'
        }
      },
      
      // 层级间信息流
      informationFlow: {
        bottomUp: {
          direction: 'Level 0 → Level 4',
          content: '预测误差信号',
          function: '向上传递意外信息，驱动模型更新',
          precisionWeighting: '低阶预测误差通常精度权重更高'
        },
        topDown: {
          direction: 'Level 4 → Level 0',
          content: '预测/先验信念',
          function: '向下传递预期，约束低阶处理',
          precisionWeighting: '高阶先验通常更稳定、更难更新'
        }
      },
      
      // 预测误差最小化策略
      errorMinimizationStrategies: {
        perceptualInference: {
          name: '知觉推理',
          description: '更新预测模型以匹配输入',
          example: '重新解释情境："这不是威胁，是机会"',
          level: 'Level 2-3',
          energyCost: '低'
        },
        activeInference: {
          name: '主动推理',
          description: '通过行动改变输入以匹配预测',
          example: '深呼吸降低心率，匹配"平静"预测',
          level: 'Level 0-1',
          energyCost: '中'
        },
        precisionModulation: {
          name: '精度调节',
          description: '调整预测误差的权重/可信度',
          example: '正念冥想：降低某些预测误差的精度权重',
          level: 'All levels',
          energyCost: '低 - 中'
        },
        modelComplexityAdjustment: {
          name: '模型复杂度调整',
          description: '简化或复杂化预测模型',
          example: '简化：过度概括；复杂化：区分细微情境',
          level: 'Level 3-4',
          energyCost: '高'
        }
      }
    }
  }

  /**
   * 构建预测误差精细化计算器
   * 实现预测误差的成分分解和来源归因
   */
  buildPredictionErrorCalculator () {
    return {
      /**
       * 计算多层级预测误差
       * 
       * @param {Object} input - 输入数据
       * @returns {Object} 预测误差分析结果
       */
      calculateMultiLevelError (input) {
        const {
          bodyState = {},
          emotionalReport = {},
          conceptualInterpretation = {},
          selfModelBeliefs = {}
        } = input
        
        const predictions = this.generateMultiLevelPrediction(input)
        
        return {
          level0: this._calculateInteroceptiveError(bodyState, predictions.level0),
          level1: this._calculateProprioceptiveError(bodyState, predictions.level1),
          level2: this._calculateEmotionalError(emotionalReport, predictions.level2),
          level3: this._calculateConceptualError(conceptualInterpretation, predictions.level3),
          level4: this._calculateSelfModelError(selfModelBeliefs, predictions.level4),
          
          // 跨层级一致性检查
          crossLevelCoherence: this._calculateCrossLevelCoherence(predictions),
          
          // 总体预测误差
          totalPredictionError: this._calculateTotalError(predictions)
        }
      },
      
      /**
       * 预测误差成分分解
       * 区分误差来源：身体信号噪声 vs 模型偏差 vs 情境变化
       */
      decomposeErrorSource (error, context) {
        const sources = {
          sensoryNoise: {
            description: '感觉输入本身的噪声/不确定性',
            indicators: ['信号波动大', '测量不一致', '外部干扰'],
            intervention: '提高感觉输入质量 (如改善环境)'
          },
          modelBias: {
            description: '预测模型的系统性偏差',
            indicators: ['持续高误差', '特定情境下误差', '历史模式重复'],
            intervention: '模型更新/重新校准'
          },
          contextChange: {
            description: '情境发生真实变化',
            indicators: ['误差突然出现', '与新情境相关', '可解释的变化'],
            intervention: '情境适应/接受变化'
          },
          precisionMismatch: {
            description: '预测精度与实际不确定性不匹配',
            indicators: ['过度自信', '低估不确定性', '惊讶频率高'],
            intervention: '精度校准/不确定性接纳'
          }
        }
        
        // 误差来源归因算法
        const attribution = this._attributeErrorSource(error, context, sources)
        
        return {
          primarySource: attribution.primary,
          secondarySource: attribution.secondary,
          confidence: attribution.confidence,
          recommendedIntervention: sources[attribution.primary].intervention
        }
      },
      
      /**
       * 预测误差时间动态分析
       * 追踪误差随时间的变化模式
       */
      analyzeErrorDynamics (errorHistory) {
        const dynamics = {
          trend: this._calculateErrorTrend(errorHistory),
          volatility: this._calculateErrorVolatility(errorHistory),
          periodicity: this._detectErrorPeriodicity(errorHistory),
          criticalMoments: this._identifyCriticalMoments(errorHistory)
        }
        
        return {
          pattern: this._classifyErrorPattern(dynamics),
          stability: dynamics.volatility < 0.3 ? '稳定' : dynamics.volatility < 0.6 ? '中等' : '不稳定',
          predictability: this._assessPredictability(dynamics),
          interventionTiming: this._recommendInterventionTiming(dynamics)
        }
      }
    }
  }

  /**
   * 构建主动推理干预生成器
   * 基于预测误差分析生成个性化干预方案
   */
  buildActiveInferenceInterventionGenerator () {
    return {
      /**
       * 生成多层级干预方案
       * 
       * @param {Object} errorAnalysis - 预测误差分析结果
       * @param {Object} userPreferences - 用户偏好
       * @returns {Object} 干预方案
       */
      generateMultiLevelIntervention (errorAnalysis, userPreferences = {}) {
        const interventions = {
          level0: this._generateInteroceptiveIntervention(errorAnalysis.level0),
          level1: this._generateProprioceptiveIntervention(errorAnalysis.level1),
          level2: this._generateEmotionalIntervention(errorAnalysis.level2),
          level3: this._generateConceptualIntervention(errorAnalysis.level3),
          level4: this._generateSelfModelIntervention(errorAnalysis.level4)
        }
        
        // 优先级排序
        const prioritized = this._prioritizeInterventions(interventions, errorAnalysis)
        
        // 整合为连贯方案
        const integratedPlan = this._integrateInterventionPlan(prioritized, userPreferences)
        
        return {
          immediateActions: integratedPlan.immediate,    // 5 分钟内可执行
          shortTermPractice: integratedPlan.shortTerm,   // 今日练习
          longTermStrategy: integratedPlan.longTerm,     // 持续策略
          expectedOutcome: integratedPlan.expectedOutcome,
          successMetrics: integratedPlan.metrics
        }
      },
      
      /**
       * 主动推理策略库
       */
      activeInferenceStrategies: {
        // Level 0: 内感受调节
        interoceptiveRegulation: [
          {
            name: '呼吸调节',
            technique: '4-7-8 呼吸法',
            target: '降低心率预测误差',
            duration: '2-5 分钟',
            evidence: '激活副交感神经，降低生理唤醒'
          },
          {
            name: '身体扫描',
            technique: '渐进式身体觉察',
            target: '提高内感受准确性',
            duration: '10-15 分钟',
            evidence: '增强岛叶活动，改善身体信号处理'
          },
          {
            name: '温度调节',
            technique: '冷水洗脸/握冰块',
            target: '快速降低生理唤醒',
            duration: '30 秒 -2 分钟',
            evidence: '触发潜水反射，快速平静'
          }
        ],
        
        // Level 1: 本体感受调节
        proprioceptiveRegulation: [
          {
            name: '姿势重构',
            technique: '力量姿势/开放姿势',
            target: '改变情绪预测',
            duration: '2 分钟',
            evidence: '具身认知：姿势影响激素和情绪'
          },
          {
            name: '渐进式肌肉放松',
            technique: '紧张 - 放松循环',
            target: '降低肌肉张力预测误差',
            duration: '10-15 分钟',
            evidence: '降低交感神经激活'
          },
          {
            name: '正念运动',
            technique: '瑜伽/太极/正念行走',
            target: '整合身体 - 心智预测',
            duration: '15-30 分钟',
            evidence: '增强本体感受 - 情绪连接'
          }
        ],
        
        // Level 2: 情绪调节
        emotionalRegulation: [
          {
            name: '情绪标记',
            technique: '命名情绪体验',
            target: '降低情绪预测误差',
            duration: '1-2 分钟',
            evidence: 'Lieberman 等：情绪标记降低杏仁核激活'
          },
          {
            name: '重新评估',
            technique: '认知重评',
            target: '改变情绪意义',
            duration: '5-10 分钟',
            evidence: 'Goldin 等：重新评估改变情绪体验'
          },
          {
            name: '接纳承诺',
            technique: 'ACT 接纳技术',
            target: '降低情绪抵抗',
            duration: '5-10 分钟',
            evidence: '降低经验性回避，提高心理灵活性'
          }
        ],
        
        // Level 3: 概念重构
        conceptualReframing: [
          {
            name: '情境重构',
            technique: '威胁→挑战重构',
            target: '改变情境解释',
            duration: '5-10 分钟',
            evidence: 'Jamieson 等：挑战重构改善表现'
          },
          {
            name: '归因重构',
            technique: '内部/外部归因平衡',
            target: '调整因果解释',
            duration: '10-15 分钟',
            evidence: '减少自我批评，增加自我同情'
          },
          {
            name: '意义建构',
            technique: '寻找积极意义',
            target: '重构事件意义',
            duration: '15-20 分钟',
            evidence: '意义建构促进创伤后成长'
          }
        ],
        
        // Level 4: 自我模型更新
        selfModelUpdate: [
          {
            name: '价值观澄清',
            technique: '价值观排序与承诺',
            target: '强化核心价值预测',
            duration: '20-30 分钟',
            evidence: '价值观一致性提高幸福感'
          },
          {
            name: '叙事重构',
            technique: '生命故事重写',
            target: '更新自我叙事',
            duration: '30-60 分钟',
            evidence: 'McAdams: 叙事身份影响幸福感'
          },
          {
            name: '未来自我可视化',
            technique: '理想自我想象',
            target: '强化未来自我连接',
            duration: '10-15 分钟',
            evidence: '未来自我连续性促进延迟满足'
          }
        ]
      }
    }
  }

  /**
   * 构建动态系统追踪器
   * 追踪情绪 - 身体 - 环境的动态耦合
   */
  buildDynamicSystemTracker () {
    return {
      /**
       * 吸引子状态识别
       * 识别系统倾向于停留的情绪 - 身体状态组合
       */
      identifyAttractorStates (timeSeriesData) {
        const attractors = []
        
        // 聚类分析：识别频繁出现的状态组合
        const clusters = this._clusterStates(timeSeriesData)
        
        clusters.forEach(cluster => {
          const attractor = {
            state: cluster.centroid,
            stability: this._calculateAttractorStability(cluster),
            basinOfAttraction: this._estimateBasinSize(cluster),
            averageDwellTime: this._calculateDwellTime(cluster),
            transitionProbabilities: this._calculateTransitions(cluster, clusters)
          }
          attractors.push(attractor)
        })
        
        return {
          attractors,
          dominantAttractor: this._findDominantAttractor(attractors),
          systemFlexibility: this._calculateSystemFlexibility(attractors)
        }
      },
      
      /**
       * 分岔点预警
       * 检测系统是否接近状态转变的临界点
       */
      detectBifurcationWarning (currentState, history) {
        const indicators = {
          criticalSlowing: this._detectCriticalSlowing(history),
          increasedVariance: this._detectVarianceIncrease(history),
          increasedAutocorrelation: this._detectAutocorrelationIncrease(history),
          flickering: this._detectFlickering(currentState, history)
        }
        
        const riskScore = Object.values(indicators).filter(v => v).length / 4
        
        return {
          bifurcationRisk: riskScore > 0.75 ? '高' : riskScore > 0.5 ? '中' : '低',
          indicators,
          estimatedTimeToBifurcation: this._estimateTimeToBifurcation(history),
          possibleNewStates: this._predictPossibleNewStates(currentState),
          interventionWindow: this._calculateInterventionWindow(riskScore)
        }
      },
      
      /**
       * 耦合强度评估
       * 评估身体 - 情绪 - 环境之间的耦合程度
       */
      assessCouplingStrength (bodyState, emotionalState, environment) {
        const couplings = {
          bodyEmotion: this._calculateBodyEmotionCoupling(bodyState, emotionalState),
          emotionEnvironment: this._calculateEmotionEnvironmentCoupling(emotionalState, environment),
          bodyEnvironment: this._calculateBodyEnvironmentCoupling(bodyState, environment),
          triadicCoupling: this._calculateTriadicCoupling(bodyState, emotionalState, environment)
        }
        
        return {
          couplings,
          overallCouplingStrength: this._calculateOverallCoupling(couplings),
          couplingBalance: this._assessCouplingBalance(couplings),
          optimalCouplingRange: this._defineOptimalCouplingRange(),
          recommendation: this._generateCouplingRecommendation(couplings)
        }
      }
    }
  }

  /**
   * 构建时间深度预测整合器
   * 整合过去经验、现在体验、未来预期的时间连续性
   */
  buildTemporalDepthPredictor () {
    return {
      /**
       * 时间深度评估
       * 评估个体体验的时间深度 (过去 - 现在 - 未来的连接)
       */
      assessTemporalDepth (userReport) {
        const dimensions = {
          pastConnection: this._assessPastConnection(userReport),
          presentAwareness: this._assessPresentAwareness(userReport),
          futureOrientation: this._assessFutureOrientation(userReport),
          temporalCoherence: this._assessTemporalCoherence(userReport)
        }
        
        return {
          dimensions,
          temporalDepthScore: this._calculateTemporalDepthScore(dimensions),
          temporalProfile: this._classifyTemporalProfile(dimensions),
          interventionFocus: this._identifyTemporalInterventionFocus(dimensions)
        }
      },
      
      /**
       * 时间预测连续性分析
       * 分析预测在时间维度上的连续性
       */
      analyzeTemporalPredictionContinuity (predictionHistory) {
        const analysis = {
          predictionStability: this._calculatePredictionStability(predictionHistory),
          updateFrequency: this._calculateUpdateFrequency(predictionHistory),
          temporalHorizon: this._estimateTemporalHorizon(predictionHistory),
          consistencyOverTime: this._calculateTemporalConsistency(predictionHistory)
        }
        
        return {
          continuityScore: this._calculateContinuityScore(analysis),
          patternType: this._classifyTemporalPattern(analysis),
          adaptiveValue: this._assessAdaptiveValue(analysis),
          recommendation: this._generateTemporalRecommendation(analysis)
        }
      }
    }
  }

  /**
   * 主处理函数：整合分析
   */
  async processEmotionReport (emotionReport, context = {}) {
    const startTime = Date.now()
    
    // 1. 多层级预测误差计算
    const errorAnalysis = this.predictionErrorCalculator.calculateMultiLevelError({
      bodyState: emotionReport.bodyState || {},
      emotionalReport: emotionReport,
      conceptualInterpretation: emotionReport.interpretation || {},
      selfModelBeliefs: emotionReport.selfBeliefs || {}
    })
    
    // 2. 误差来源归因
    const errorAttribution = this.predictionErrorCalculator.decomposeErrorSource(
      errorAnalysis.totalPredictionError,
      context
    )
    
    // 3. 生成干预方案
    const interventionPlan = this.activeInferenceInterventionGenerator.generateMultiLevelIntervention(
      errorAnalysis,
      context.preferences || {}
    )
    
    // 4. 动态系统分析 (如果有历史数据)
    let dynamicAnalysis = null
    if (context.history && context.history.length > 10) {
      dynamicAnalysis = {
        attractors: this.dynamicSystemTracker.identifyAttractorStates(context.history),
        bifurcationWarning: this.dynamicSystemTracker.detectBifurcationWarning(
          emotionReport,
          context.history
        ),
        couplingStrength: this.dynamicSystemTracker.assessCouplingStrength(
          emotionReport.bodyState || {},
          emotionReport,
          context.environment || {}
        )
      }
    }
    
    // 5. 时间深度分析
    const temporalAnalysis = this.temporalDepthPredictor.assessTemporalDepth(emotionReport)
    
    const processingTime = Date.now() - startTime
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      processingTime,
      
      // 核心分析结果
      errorAnalysis,
      errorAttribution,
      interventionPlan,
      
      // 可选分析
      dynamicAnalysis,
      temporalAnalysis,
      
      // 整合建议
      integratedRecommendation: this._generateIntegratedRecommendation({
        errorAnalysis,
        errorAttribution,
        interventionPlan,
        dynamicAnalysis,
        temporalAnalysis
      })
    }
  }

  /**
   * 生成整合建议
   */
  _generateIntegratedRecommendation (analysis) {
    const recommendations = []
    
    // 基于误差来源
    if (analysis.errorAttribution.primarySource === 'modelBias') {
      recommendations.push({
        priority: '高',
        category: '模型更新',
        action: '识别并挑战核心预测假设',
        rationale: '检测到系统性模型偏差'
      })
    }
    
    // 基于动态分析
    if (analysis.dynamicAnalysis?.bifurcationWarning?.bifurcationRisk === '高') {
      recommendations.push({
        priority: '紧急',
        category: '稳定干预',
        action: '立即执行稳定化练习',
        rationale: '检测到系统接近状态转变临界点'
      })
    }
    
    // 基于时间深度
    if (analysis.temporalAnalysis.dimensions.presentAwareness < 0.4) {
      recommendations.push({
        priority: '中',
        category: '正念练习',
        action: '增强当下觉察',
        rationale: '当下觉察较低，可能导致预测脱离现实'
      })
    }
    
    return {
      recommendations,
      overallPriority: recommendations.some(r => r.priority === '紧急') ? '紧急' : 
                       recommendations.some(r => r.priority === '高') ? '高' : '中',
      estimatedImprovement: this._estimateImprovement(analysis),
      followUpTiming: this._recommendFollowUpTiming(analysis)
    }
  }
}

module.exports = PredictiveEmbodiedCognitionEnhanced
