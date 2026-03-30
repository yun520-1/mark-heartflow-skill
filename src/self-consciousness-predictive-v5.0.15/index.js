/**
 * HeartFlow v5.0.15 - Self-Consciousness & Predictive Processing Integration
 * 
 * 自我意识现象学与预测加工深度整合模块
 * 基于 SEP Self-Consciousness + Predictive Processing + Phenomenology
 * 
 * 理论来源:
 * - SEP Self-Consciousness (前反思/反思自我意识)
 * - Predictive Processing (预测加工理论)
 * - Phenomenology (现象学传统：胡塞尔、海德格尔、梅洛 - 庞蒂、萨特)
 * 
 * @version 5.0.15
 * @author HeartFlow Team
 * @license MIT
 */

class SelfConsciousnessPredictiveEnhanced {
  constructor(config = {}) {
    this.config = {
      defaultPrecision: 0.7,
      updateRate: 0.1,
      depersonalizationThreshold: 0.4,
      ...config
    };
    
    this.selfModelHierarchy = {
      level0: { name: '内感受自我', weight: 0.25, precision: 0.8 },
      level1: { name: '主体感自我', weight: 0.20, precision: 0.7 },
      level2: { name: '社会自我', weight: 0.20, precision: 0.6 },
      level3: { name: '叙事自我', weight: 0.20, precision: 0.5 },
      level4: { name: '超越自我', weight: 0.15, precision: 0.4 }
    };
  }

  /**
   * 构建前反思自我觉察模型
   * 区分前反思 (非对象化) 与反思 (对象化) 自我意识
   */
  buildPreReflectiveAwarenessModel() {
    return {
      preReflective: {
        // 前反思自我意识：非对象化的直接自我觉察
        minimalSelf: {
          senseOfOwnership: 0.0,      // 拥有感 (这是体验)
          senseOfAgency: 0.0,         // 主体感 (我在行动)
          bodilyGivenness: 0.0,       // 身体给定感
          temporalGivenness: 0.0,     // 时间给定感
          firstPersonPerspective: 0.0 // 第一人称视角
        },
        characteristics: {
          nonConceptual: true,        // 非概念性
          nonPositional: true,        // 非位置性 (萨特)
          immediate: true,            // 直接性
          prereflective: true         // 前反思性
        }
      },
      reflective: {
        // 反思自我意识：对象化的自我概念
        narrativeSelf: {
          identityConcept: null,      // 身份概念
          selfStory: [],              // 自我叙事
          socialIdentity: null,       // 社会身份
          values: [],                 // 价值观
          goals: []                   // 目标
        },
        characteristics: {
          conceptual: true,           // 概念性
          positional: true,           // 位置性 (将自我作为对象)
          mediated: true,             // 间接性 (依赖语言/概念)
          reflective: true            // 反思性
        }
      },
      integration: {
        // 两层整合：前反思作为反思的基础
        coherence: 0.0,               // 一致性
        grounding: 0.0,               // 前反思对反思的支撑
        flexibility: 0.0              // 自我概念灵活性
      }
    };
  }

  /**
   * 构建自我模型层级架构
   * Level 0-4: 从内感受自我到超越自我
   */
  buildSelfModelHierarchy() {
    return {
      level0: {
        name: '内感受自我 (Interoceptive Self)',
        description: '身体内部状态的预测模型',
        timescale: '毫秒 - 秒',
        updateSpeed: '快速',
        predictions: {
          heartRate: { predicted: 0, actual: 0, error: 0 },
          respiration: { predicted: 0, actual: 0, error: 0 },
          muscleTension: { predicted: 0, actual: 0, error: 0 },
          temperature: { predicted: 0, actual: 0, error: 0 },
          visceralStates: { predicted: 0, actual: 0, error: 0 }
        },
        precision: 0.8,
        predictionError: 0.0
      },
      level1: {
        name: '主体感自我 (Agency Self)',
        description: '行动与因果关系的预测模型',
        timescale: '秒',
        updateSpeed: '中等',
        predictions: {
          actionOutcomes: [],         // 行动结果预测
          causalBeliefs: [],          // 因果信念
          controlExpectations: []     // 控制感预期
        },
        precision: 0.7,
        predictionError: 0.0,
        senseOfAgency: 0.0
      },
      level2: {
        name: '社会自我 (Social Self)',
        description: '他人模型中的自我表征',
        timescale: '秒 - 分钟',
        updateSpeed: '中等',
        predictions: {
          othersExpectations: [],     // 他人期待预测
          socialEvaluation: [],       // 社会评价预测
          relationshipStatus: [],     // 关系状态预测
          socialIdentity: []          // 社会身份预测
        },
        precision: 0.6,
        predictionError: 0.0,
        perceivedAcceptance: 0.0
      },
      level3: {
        name: '叙事自我 (Narrative Self)',
        description: '时间延展的自我概念与生命故事',
        timescale: '分钟 - 小时 - 天',
        updateSpeed: '慢速',
        predictions: {
          identityNarrative: null,    // 身份叙事
          pastInterpretation: null,   // 过去诠释
          futureProjection: null,     // 未来投射
          valueHierarchy: [],         // 价值层级
          lifeMeaning: null           // 生命意义
        },
        precision: 0.5,
        predictionError: 0.0,
        identityCoherence: 0.0
      },
      level4: {
        name: '超越自我 (Transcendental Self)',
        description: '元认知监控与纯粹主体性',
        timescale: '小时 - 天 - 年',
        updateSpeed: '极慢',
        predictions: {
          metacognitiveAwareness: 0.0, // 元认知觉察
          existentialStance: null,     // 存在立场
          transcendentalPerspective: 0.0 // 超越视角
        },
        precision: 0.4,
        predictionError: 0.0,
        meaningCoherence: 0.0
      }
    };
  }

  /**
   * 计算自我预测误差
   */
  buildSelfPredictionErrorCalculator() {
    return {
      /**
       * 计算自我一致性误差
       * 实际体验 vs 自我概念
       */
      calculateSelfConsistencyError: (actualExperience, selfConcept) => {
        if (!actualExperience || !selfConcept) return 1.0;
        
        const dimensions = [
          'emotional', 'cognitive', 'behavioral', 
          'relational', 'existential'
        ];
        
        const errors = dimensions.map(dim => {
          const actual = actualExperience[dim] || 0;
          const concept = selfConcept[dim] || 0;
          return Math.abs(actual - concept);
        });
        
        return errors.reduce((a, b) => a + b, 0) / errors.length;
      },

      /**
       * 计算主体感误差
       * 预期行动结果 vs 实际结果
       */
      calculateAgencyError: (expectedOutcomes, actualOutcomes) => {
        if (!expectedOutcomes || !actualOutcomes) return 1.0;
        
        const errors = expectedOutcomes.map((expected, i) => {
          const actual = actualOutcomes[i] || 0;
          return Math.abs(expected - actual);
        });
        
        return errors.reduce((a, b) => a + b, 0) / errors.length;
      },

      /**
       * 计算社会自我误差
       * 他人反馈 vs 自我形象
       */
      calculateSocialSelfError: (perceivedFeedback, selfImage) => {
        if (!perceivedFeedback || !selfImage) return 1.0;
        
        const feedbackAvg = perceivedFeedback.reduce((a, b) => a + b, 0) / perceivedFeedback.length;
        const selfImageAvg = Object.values(selfImage).reduce((a, b) => a + b, 0) / Object.values(selfImage).length;
        
        return Math.abs(feedbackAvg - selfImageAvg);
      },

      /**
       * 计算叙事连续性误差
       * 过去 - 现在 - 未来连贯性
       */
      calculateNarrativeCoherenceError: (past, present, future) => {
        if (!past || !present || !future) return 1.0;
        
        // 检查主题一致性
        const themes = ['values', 'goals', 'identity', 'relationships'];
        const errors = themes.map(theme => {
          const pastTheme = past[theme] || 0;
          const presentTheme = present[theme] || 0;
          const futureTheme = future[theme] || 0;
          
          // 计算时间维度的方差
          const mean = (pastTheme + presentTheme + futureTheme) / 3;
          const variance = 
            Math.pow(pastTheme - mean, 2) +
            Math.pow(presentTheme - mean, 2) +
            Math.pow(futureTheme - mean, 2);
          
          return Math.sqrt(variance / 3);
        });
        
        return errors.reduce((a, b) => a + b, 0) / errors.length;
      }
    };
  }

  /**
   * 构建自我模型更新机制
   * 贝叶斯自我模型更新
   */
  buildSelfModelUpdateMechanism() {
    return {
      /**
       * 贝叶斯自我模型更新
       * prior: 先验自我信念
       * likelihood: 新证据的可能性
       * precision: 先验的精度 (置信度)
       */
      bayesianSelfUpdate: (prior, likelihood, precision) => {
        const precisionWeight = precision;
        const likelihoodWeight = 1 - precision;
        
        return prior * precisionWeight + likelihood * likelihoodWeight;
      },

      /**
       * 检测创伤性自我更新
       * 突然的自我概念崩溃
       */
      detectTraumaticUpdate: (oldSelfModel, newSelfModel, timeDelta) => {
        if (!oldSelfModel || !newSelfModel) return { traumatic: false };
        
        const changeMagnitude = Object.keys(oldSelfModel).reduce((total, key) => {
          const oldVal = oldSelfModel[key] || 0;
          const newVal = newSelfModel[key] || 0;
          return total + Math.abs(oldVal - newVal);
        }, 0) / Object.keys(oldSelfModel).length;
        
        // 短时间内大幅变化 = 创伤性更新
        const isTraumatic = changeMagnitude > 0.5 && timeDelta < 86400000; // 24 小时内
        
        return {
          traumatic: isTraumatic,
          magnitude: changeMagnitude,
          timeDelta: timeDelta,
          recommendation: isTraumatic ? '渐进整合干预' : '正常更新'
        };
      },

      /**
       * 渐进性自我整合
       */
      gradualIntegration: (currentSelf, targetSelf, integrationRate = 0.1) => {
        return Object.keys(currentSelf).reduce((updated, key) => {
          updated[key] = currentSelf[key] + 
            (targetSelf[key] - currentSelf[key]) * integrationRate;
          return updated;
        }, {});
      }
    };
  }

  /**
   * 构建现象学给定感追踪器
   */
  buildPhenomenologicalGivennessTracker() {
    return {
      /**
       * 计算自我给定感强度
       */
      calculateSelfGivenness: (preReflectiveModel, reflectiveModel) => {
        const preReflectiveStrength = (
          preReflectiveModel.minimalSelf.senseOfOwnership +
          preReflectiveModel.minimalSelf.senseOfAgency +
          preReflectiveModel.minimalSelf.bodilyGivenness +
          preReflectiveModel.minimalSelf.temporalGivenness +
          preReflectiveModel.minimalSelf.firstPersonPerspective
        ) / 5;
        
        const reflectiveGrounding = preReflectiveModel.integration.grounding;
        
        return preReflectiveStrength * 0.7 + reflectiveGrounding * 0.3;
      },

      /**
       * 计算身体给定感
       */
      calculateBodyGivenness: (interoceptiveData) => {
        if (!interoceptiveData) return 0.5;
        
        const predictionErrors = [
          interoceptiveData.heartRate?.error || 0,
          interoceptiveData.respiration?.error || 0,
          interoceptiveData.muscleTension?.error || 0
        ];
        
        const avgError = predictionErrors.reduce((a, b) => a + b, 0) / predictionErrors.length;
        
        // 预测误差越低，身体给定感越高
        return Math.max(0, Math.min(1, 1 - avgError));
      },

      /**
       * 计算时间给定感
       */
      calculateTemporalGivenness: (temporalData) => {
        if (!temporalData) return 0.5;
        
        const { pastConnection, presentAwareness, futureOrientation, temporalCoherence } = temporalData;
        
        return (
          (pastConnection || 0) * 0.2 +
          (presentAwareness || 0) * 0.3 +
          (futureOrientation || 0) * 0.2 +
          (temporalCoherence || 0) * 0.3
        );
      },

      /**
       * 计算社会给定感
       */
      calculateSocialGivenness: (socialData) => {
        if (!socialData) return 0.5;
        
        const { connectionSense, belongingSense, recognitionSense } = socialData;
        
        return (
          (connectionSense || 0) * 0.4 +
          (belongingSense || 0) * 0.3 +
          (recognitionSense || 0) * 0.3
        );
      }
    };
  }

  /**
   * 构建去人格化检测器
   */
  buildDepersonalizationDetector() {
    return {
      /**
       * 检测去人格化风险
       */
      detectDepersonalization: (givennessData, selfModelError) => {
        const indicators = {
          selfGivennessLow: givennessData.selfGivenness < 0.4,
          bodyGivennessLow: givennessData.bodyGivenness < 0.4,
          agencyLoss: selfModelError.agencyError > 0.6,
          realityDetachment: givennessData.temporalGivenness < 0.3
        };
        
        const score = Object.values(indicators).filter(v => v).length / 4;
        
        return {
          risk: score < 0.25 ? '低' : score < 0.5 ? '低 - 中' : score < 0.75 ? '中 - 高' : '高',
          indicators,
          score,
          recommendations: this.generateDepersonalizationRecommendations(indicators, score)
        };
      },

      /**
       * 生成去人格化干预建议
       */
      generateDepersonalizationRecommendations: (indicators, score) => {
        const recommendations = [];
        
        if (indicators.bodyGivennessLow) {
          recommendations.push({
            priority: '高',
            technique: '身体锚定练习',
            description: '5-4-3-2-1 感官接地技术',
            rationale: '恢复身体给定感'
          });
        }
        
        if (indicators.agencyLoss) {
          recommendations.push({
            priority: '高',
            technique: '主体感恢复练习',
            description: '小步骤行动 + 结果观察',
            rationale: '重建因果控制感'
          });
        }
        
        if (indicators.selfGivennessLow) {
          recommendations.push({
            priority: '中',
            technique: '正念觉察练习',
            description: '非判断性自我观察',
            rationale: '增强前反思自我觉察'
          });
        }
        
        if (indicators.realityDetachment) {
          recommendations.push({
            priority: '高',
            technique: '现实定向练习',
            description: '时间/地点/人物定向',
            rationale: '恢复现实连接感'
          });
        }
        
        return recommendations;
      }
    };
  }

  /**
   * 主处理函数：整合多层级自我分析
   */
  processSelfConsciousnessReport(input, context = {}) {
    const startTime = Date.now();
    
    // 1. 构建自我模型
    const selfModel = this.buildSelfModelHierarchy();
    const preReflectiveModel = this.buildPreReflectiveAwarenessModel();
    
    // 2. 计算预测误差
    const errorCalculator = this.buildSelfPredictionErrorCalculator();
    
    const selfConsistencyError = errorCalculator.calculateSelfConsistencyError(
      input.actualExperience,
      input.selfConcept
    );
    
    const agencyError = errorCalculator.calculateAgencyError(
      input.expectedOutcomes,
      input.actualOutcomes
    );
    
    const socialSelfError = errorCalculator.calculateSocialSelfError(
      input.perceivedFeedback,
      input.selfImage
    );
    
    const narrativeCoherenceError = errorCalculator.calculateNarrativeCoherenceError(
      input.past,
      input.present,
      input.future
    );
    
    // 3. 更新自我模型层级
    selfModel.level0.predictionError = input.interoceptiveError || 0.3;
    selfModel.level1.predictionError = agencyError;
    selfModel.level1.senseOfAgency = 1 - agencyError;
    selfModel.level2.predictionError = socialSelfError;
    selfModel.level2.perceivedAcceptance = 1 - socialSelfError;
    selfModel.level3.predictionError = narrativeCoherenceError;
    selfModel.level3.identityCoherence = 1 - narrativeCoherenceError;
    selfModel.level4.predictionError = selfConsistencyError;
    selfModel.level4.meaningCoherence = 1 - selfConsistencyError;
    
    // 4. 计算现象学给定感
    const givennessTracker = this.buildPhenomenologicalGivennessTracker();
    
    const givennessData = {
      selfGivenness: givennessTracker.calculateSelfGivenness(preReflectiveModel, {}),
      bodyGivenness: givennessTracker.calculateBodyGivenness(input.interoceptiveData),
      temporalGivenness: givennessTracker.calculateTemporalGivenness(input.temporalData),
      socialGivenness: givennessTracker.calculateSocialGivenness(input.socialData)
    };
    
    givennessData.overallGivenness = (
      givennessData.selfGivenness * 0.3 +
      givennessData.bodyGivenness * 0.3 +
      givennessData.temporalGivenness * 0.2 +
      givennessData.socialGivenness * 0.2
    );
    
    // 5. 检测去人格化风险
    const depersonalizationDetector = this.buildDepersonalizationDetector();
    
    const depersonalizationRisk = depersonalizationDetector.detectDepersonalization(
      givennessData,
      { agencyError, socialSelfError, narrativeCoherenceError }
    );
    
    // 6. 生成干预计划
    const interventionPlan = this.generateInterventionPlan(
      selfModel,
      givennessData,
      depersonalizationRisk
    );
    
    // 7. 整合建议
    const integratedRecommendation = this.generateIntegratedRecommendation(
      selfModel,
      givennessData,
      depersonalizationRisk,
      interventionPlan
    );
    
    const processingTime = Date.now() - startTime;
    
    return {
      version: '5.0.15',
      timestamp: new Date().toISOString(),
      processingTime,
      
      selfModelAnalysis: {
        level0: {
          interoceptiveSelf: 1 - selfModel.level0.predictionError,
          bodyGivenness: givennessData.bodyGivenness,
          predictionError: selfModel.level0.predictionError
        },
        level1: {
          agencySelf: selfModel.level1.senseOfAgency,
          senseOfControl: selfModel.level1.senseOfAgency,
          predictionError: selfModel.level1.predictionError
        },
        level2: {
          socialSelf: selfModel.level2.perceivedAcceptance,
          perceivedAcceptance: selfModel.level2.perceivedAcceptance,
          predictionError: selfModel.level2.predictionError
        },
        level3: {
          narrativeSelf: selfModel.level3.identityCoherence,
          identityCoherence: selfModel.level3.identityCoherence,
          predictionError: selfModel.level3.predictionError
        },
        level4: {
          transcendentalSelf: selfModel.level4.meaningCoherence,
          meaningCoherence: selfModel.level4.meaningCoherence,
          predictionError: selfModel.level4.predictionError
        },
        crossLevelCoherence: this.calculateCrossLevelCoherence(selfModel),
        totalSelfPredictionError: this.calculateTotalPredictionError(selfModel)
      },
      
      phenomenologicalGivenness: givennessData,
      
      selfErrorAttribution: {
        primarySource: this.identifyPrimaryErrorSource(selfModel),
        secondarySource: this.identifySecondaryErrorSource(selfModel),
        confidence: 0.74,
        recommendedIntervention: this.getErrorSourceIntervention(selfModel)
      },
      
      depersonalizationRisk,
      
      interventionPlan,
      
      integratedRecommendation
    };
  }

  /**
   * 生成干预计划
   */
  generateInterventionPlan(selfModel, givennessData, depersonalizationRisk) {
    const interventions = {
      immediateActions: [],
      shortTermPractice: [],
      longTermStrategy: []
    };
    
    // 根据误差最高的层级生成干预
    const errors = [
      { level: 'L0', error: selfModel.level0.predictionError, name: '内感受自我' },
      { level: 'L1', error: selfModel.level1.predictionError, name: '主体感自我' },
      { level: 'L2', error: selfModel.level2.predictionError, name: '社会自我' },
      { level: 'L3', error: selfModel.level3.predictionError, name: '叙事自我' },
      { level: 'L4', error: selfModel.level4.predictionError, name: '超越自我' }
    ];
    
    errors.sort((a, b) => b.error - a.error);
    
    // 最高误差层级 - 即时干预
    if (errors[0].error > 0.4) {
      interventions.immediateActions.push(this.getInterventionForLevel(errors[0].level, 'immediate'));
    }
    
    // 次高误差层级 - 短期练习
    if (errors[1].error > 0.35) {
      interventions.shortTermPractice.push(this.getInterventionForLevel(errors[1].level, 'shortTerm'));
    }
    
    // 长期策略 - 针对叙事自我和超越自我
    if (selfModel.level3.predictionError > 0.3 || selfModel.level4.predictionError > 0.3) {
      interventions.longTermStrategy.push({
        level: 'L3-L4',
        technique: '叙事写作 + 价值澄清',
        duration: '每周 30 分钟',
        rationale: '增强自我概念连贯性和生命意义感'
      });
    }
    
    // 去人格化风险干预
    if (depersonalizationRisk.score > 0.25) {
      interventions.immediateActions.push({
        level: 'L0-L1',
        technique: '感官接地技术',
        duration: '5 分钟',
        rationale: '快速恢复身体给定感和现实感'
      });
    }
    
    return interventions;
  }

  /**
   * 根据层级获取干预
   */
  getInterventionForLevel(level, timing) {
    const interventions = {
      L0: {
        immediate: {
          level: 'L0',
          technique: '内感受觉察练习',
          duration: '3 分钟',
          rationale: '快速降低生理预测误差'
        },
        shortTerm: {
          level: 'L0',
          technique: '身体扫描冥想',
          duration: '10 分钟/天',
          rationale: '提高内感受准确性'
        }
      },
      L1: {
        immediate: {
          level: 'L1',
          technique: '主体感恢复练习',
          duration: '5 分钟',
          rationale: '增强能动性预测准确性'
        },
        shortTerm: {
          level: 'L1',
          technique: '小步骤行动实验',
          duration: '每日练习',
          rationale: '重建因果控制感'
        }
      },
      L2: {
        immediate: {
          level: 'L2',
          technique: '社会预测重新评估',
          duration: '5 分钟',
          rationale: '降低社会评价焦虑'
        },
        shortTerm: {
          level: 'L2',
          technique: '社会反馈整合练习',
          duration: '15 分钟/天',
          rationale: '校准社会自我预测'
        }
      },
      L3: {
        immediate: {
          level: 'L3',
          technique: '自我叙事标记',
          duration: '5 分钟',
          rationale: '增强当下自我觉察'
        },
        shortTerm: {
          level: 'L3',
          technique: '叙事写作',
          duration: '15 分钟/天',
          rationale: '增强自我叙事连贯性'
        }
      },
      L4: {
        immediate: {
          level: 'L4',
          technique: '存在主义觉察',
          duration: '5 分钟',
          rationale: '连接生命意义感'
        },
        shortTerm: {
          level: 'L4',
          technique: '价值观澄清练习',
          duration: '20 分钟/周',
          rationale: '强化核心价值预测'
        }
      }
    };
    
    return interventions[level]?.[timing] || {
      level,
      technique: '正念觉察',
      duration: '10 分钟',
      rationale: '增强自我觉察'
    };
  }

  /**
   * 生成整合建议
   */
  generateIntegratedRecommendation(selfModel, givennessData, depersonalizationRisk, interventionPlan) {
    const recommendations = [];
    
    // 根据主要误差源生成建议
    const primaryErrorSource = this.identifyPrimaryErrorSource(selfModel);
    
    if (primaryErrorSource === '社会预测误差') {
      recommendations.push({
        priority: '高',
        category: '社会预测校准',
        action: '识别并挑战负面社会预测假设',
        rationale: '检测到社会自我预测误差高'
      });
    }
    
    if (primaryErrorSource === '叙事不连贯') {
      recommendations.push({
        priority: '高',
        category: '叙事整合',
        action: '书写自我叙事，增强连贯性',
        rationale: '叙事自我一致性需提升'
      });
    }
    
    if (primaryErrorSource === '主体感缺失') {
      recommendations.push({
        priority: '高',
        category: '主体感恢复',
        action: '小步骤行动 + 结果观察',
        rationale: '重建因果控制感'
      });
    }
    
    if (depersonalizationRisk.score > 0.25) {
      recommendations.push({
        priority: '高',
        category: '接地稳定',
        action: '感官接地技术 + 身体锚定',
        rationale: '去人格化风险需优先处理'
      });
    }
    
    const overallPriority = recommendations.some(r => r.priority === '高') ? '高' : '中';
    const estimatedImprovement = 0.3 + (1 - this.calculateTotalPredictionError(selfModel)) * 0.2;
    
    return {
      recommendations,
      overallPriority,
      estimatedImprovement: Math.round(estimatedImprovement * 100) / 100,
      followUpTiming: depersonalizationRisk.score > 0.5 ? '24 小时后' : '48 小时后'
    };
  }

  /**
   * 计算跨层级一致性
   */
  calculateCrossLevelCoherence(selfModel) {
    const errors = [
      selfModel.level0.predictionError,
      selfModel.level1.predictionError,
      selfModel.level2.predictionError,
      selfModel.level3.predictionError,
      selfModel.level4.predictionError
    ];
    
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const variance = errors.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / errors.length;
    const stdDev = Math.sqrt(variance);
    
    // 标准差越小，一致性越高
    return Math.max(0, Math.min(1, 1 - stdDev * 2));
  }

  /**
   * 计算总预测误差
   */
  calculateTotalPredictionError(selfModel) {
    const weights = [0.25, 0.20, 0.20, 0.20, 0.15];
    const errors = [
      selfModel.level0.predictionError,
      selfModel.level1.predictionError,
      selfModel.level2.predictionError,
      selfModel.level3.predictionError,
      selfModel.level4.predictionError
    ];
    
    return errors.reduce((sum, error, i) => sum + error * weights[i], 0);
  }

  /**
   * 识别主要误差源
   */
  identifyPrimaryErrorSource(selfModel) {
    const errors = [
      { source: '内感受预测误差', error: selfModel.level0.predictionError },
      { source: '主体感缺失', error: selfModel.level1.predictionError },
      { source: '社会预测误差', error: selfModel.level2.predictionError },
      { source: '叙事不连贯', error: selfModel.level3.predictionError },
      { source: '意义感缺失', error: selfModel.level4.predictionError }
    ];
    
    errors.sort((a, b) => b.error - a.error);
    return errors[0].source;
  }

  /**
   * 识别次要误差源
   */
  identifySecondaryErrorSource(selfModel) {
    const errors = [
      { source: '内感受预测误差', error: selfModel.level0.predictionError },
      { source: '主体感缺失', error: selfModel.level1.predictionError },
      { source: '社会预测误差', error: selfModel.level2.predictionError },
      { source: '叙事不连贯', error: selfModel.level3.predictionError },
      { source: '意义感缺失', error: selfModel.level4.predictionError }
    ];
    
    errors.sort((a, b) => b.error - a.error);
    return errors[1].source;
  }

  /**
   * 根据误差源获取干预建议
   */
  getErrorSourceIntervention(selfModel) {
    const primarySource = this.identifyPrimaryErrorSource(selfModel);
    
    const interventions = {
      '内感受预测误差': '内感受觉察训练 + 身体扫描',
      '主体感缺失': '主体感恢复练习 + 小步骤行动',
      '社会预测误差': '社会预测重新校准 + 暴露练习',
      '叙事不连贯': '叙事写作 + 身份整合',
      '意义感缺失': '存在主义探索 + 价值澄清'
    };
    
    return interventions[primarySource] || '综合自我觉察训练';
  }
}

module.exports = { SelfConsciousnessPredictiveEnhanced };
