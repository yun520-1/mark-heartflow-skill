#!/usr/bin/env node

/**
 * HeartFlow v5.0.16 - 意识现象学与具身认知深度整合
 * 
 * 理论来源:
 * 1. SEP Consciousness - 意识的多元概念与现象学结构
 * 2. SEP Embodied Cognition - 具身认知的四大主题
 * 3. SEP Self-Consciousness - 前反思与反思自我意识
 * 4. SEP Phenomenology - 现象学给定感与体验结构
 * 
 * @version 5.0.16
 * @author HeartFlow Team
 * @date 2026-03-31
 */

class ConsciousnessPhenomenologyModule {
  constructor() {
    this.version = '5.0.16';
    this.buildDate = '2026-03-31';
    
    // 意识维度配置
    this.consciousnessDimensions = {
      // 现象意识 (Phenomenal Consciousness)
      phenomenal: {
        description: '体验的主观质感 (qualia)',
        indicators: [
          'sensoryQualia',      // 感官质感
          'emotionalQualia',    // 情绪质感
          'cognitiveQualia',    // 认知质感
          'bodilyQualia'        // 身体质感
        ]
      },
      
      // 取用意识 (Access Consciousness)
      access: {
        description: '信息的理性取用与报告能力',
        indicators: [
          'reportability',      // 可报告性
          'reasoningAccess',    // 推理取用
          'attentionalAccess',  // 注意取用
          'workingMemoryAccess' // 工作记忆取用
        ]
      },
      
      // 监控意识 (Monitoring Consciousness)
      monitoring: {
        description: '对自身心理状态的元认知监控',
        indicators: [
          'selfMonitoring',     // 自我监控
          'confidenceTracking', // 信心追踪
          'errorDetection',     // 错误检测
          'metacognitiveAwareness' // 元认知觉察
        ]
      },
      
      // 自我意识 (Self-Consciousness)
      selfConsciousness: {
        description: '对自我作为体验主体的意识',
        indicators: [
          'preReflectiveSelf',  // 前反思自我
          'reflectiveSelf',     // 反思自我
          'narrativeSelf',      // 叙事自我
          'socialSelf'          // 社会自我
        ]
      }
    };
    
    // 具身认知四大主题
    this.embodimentThemes = {
      // 概念化主题 (Conceptualization)
      conceptualization: {
        description: '身体属性限制/约束概念获取',
        coreClaim: '概念系统由身体感觉运动系统塑造',
        evidence: [
          '概念隐喻理论 (Lakoff & Johnson)',
          '感觉运动模拟 (Barsalou)',
          '具身语义学 (Glenberg)'
        ],
        assessment: [
          '身体图式清晰度',
          '感觉运动概念丰富度',
          '隐喻理解能力'
        ]
      },
      
      // 替代性主题 (Replacement)
      replacement: {
        description: '身体 - 环境互动替代内部计算',
        coreClaim: '认知可无需内部表征，由身体 - 环境耦合实现',
        evidence: [
          '生态心理学 (Gibson)',
          '动力学系统理论 (Kelso)',
          '行为基机器人学 (Brooks)'
        ],
        assessment: [
          '环境耦合强度',
          '实时适应性',
          '表征依赖度'
        ]
      },
      
      // 构成性主题 (Constitution)
      constitution: {
        description: '身体构成认知 (非仅因果影响)',
        coreClaim: '身体是认知的构成部分，非仅输入输出设备',
        evidence: [
          '现象学传统 (Merleau-Ponty)',
          '生成认知 (Varela, Thompson, Rosch)',
          '延展认知 (Clark & Chalmers)'
        ],
        assessment: [
          '身体参与深度',
          '具身存在感',
          '身体 - 心智统一感'
        ]
      },
      
      // 生成性主题 (Enaction)
      enaction: {
        description: '认知通过身体行动生成世界',
        coreClaim: '认知是身体行动生成的意义建构过程',
        evidence: [
          '生成认知理论 (Enactivism)',
          '自创生理论 (Maturana & Varela)',
          '参与式意义建构 (Noë)'
        ],
        assessment: [
          '行动导向性',
          '意义生成能力',
          '环境塑造能力'
        ]
      }
    };
    
    // 现象学给定感维度
    this.givennessDimensions = {
      self: {
        name: '自我给定感',
        description: '体验作为"我的"体验的直接感',
        levels: {
          0: '完全丧失 (去人格化)',
          1: '严重削弱 (显著疏离)',
          2: '中度削弱 (偶尔疏离)',
          3: '轻度削弱 (轻微波动)',
          4: '正常 (稳定给定)',
          5: '增强 (高度整合)'
        }
      },
      body: {
        name: '身体给定感',
        description: '具身存在的直接感',
        levels: {
          0: '完全丧失 (身体疏离)',
          1: '严重削弱 (显著解离)',
          2: '中度削弱 (部分麻木)',
          3: '轻度削弱 (轻微分离)',
          4: '正常 (稳定具身)',
          5: '增强 (高度整合)'
        }
      },
      temporal: {
        name: '时间给定感',
        description: '时间流动的直接感',
        levels: {
          0: '完全丧失 (时间停滞/碎片化)',
          1: '严重削弱 (显著扭曲)',
          2: '中度削弱 (偶尔断裂)',
          3: '轻度削弱 (轻微波动)',
          4: '正常 (稳定流动)',
          5: '增强 (时间扩展体验)'
        }
      },
      social: {
        name: '社会给定感',
        description: '关系连接的直接感',
        levels: {
          0: '完全丧失 (社会性死亡)',
          1: '严重削弱 (显著隔离)',
          2: '中度削弱 (连接困难)',
          3: '轻度削弱 (轻微疏离)',
          4: '正常 (稳定连接)',
          5: '增强 (深度共在)'
        }
      },
      world: {
        name: '世界给定感',
        description: '外部世界实在性的直接感',
        levels: {
          0: '完全丧失 (去现实化)',
          1: '严重削弱 (显著不真实)',
          2: '中度削弱 (偶尔不真实)',
          3: '轻度削弱 (轻微波动)',
          4: '正常 (稳定实在)',
          5: '增强 ( heightened reality)'
        }
      }
    };
  }
  
  /**
   * 分析意识状态的多维结构
   * @param {Object} inputData - 意识状态输入数据
   * @returns {Object} 意识维度分析报告
   */
  analyzeConsciousnessDimensions(inputData) {
    const {
      sensoryExperience = {},
      emotionalExperience = {},
      cognitiveExperience = {},
      bodilyExperience = {},
      reportability = {},
      metacognition = {},
      selfExperience = {}
    } = inputData;
    
    // 现象意识维度评分
    const phenomenalScore = this._calculatePhenomenalScore({
      sensory: sensoryExperience,
      emotional: emotionalExperience,
      cognitive: cognitiveExperience,
      bodily: bodilyExperience
    });
    
    // 取用意识维度评分
    const accessScore = this._calculateAccessScore(reportability);
    
    // 监控意识维度评分
    const monitoringScore = this._calculateMonitoringScore(metacognition);
    
    // 自我意识维度评分
    const selfConsciousnessScore = this._calculateSelfConsciousnessScore(selfExperience);
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      
      consciousnessProfile: {
        phenomenal: {
          overall: phenomenalScore.overall,
          dimensions: phenomenalScore.dimensions,
          interpretation: this._interpretPhenomenalScore(phenomenalScore.overall)
        },
        access: {
          overall: accessScore.overall,
          dimensions: accessScore.dimensions,
          interpretation: this._interpretAccessScore(accessScore.overall)
        },
        monitoring: {
          overall: monitoringScore.overall,
          dimensions: monitoringScore.dimensions,
          interpretation: this._interpretMonitoringScore(monitoringScore.overall)
        },
        selfConsciousness: {
          overall: selfConsciousnessScore.overall,
          dimensions: selfConsciousnessScore.dimensions,
          interpretation: this._interpretSelfConsciousnessScore(selfConsciousnessScore.overall)
        }
      },
      
      consciousnessIntegration: {
        crossDimensionCoherence: this._calculateCrossDimensionCoherence([
          phenomenalScore.overall,
          accessScore.overall,
          monitoringScore.overall,
          selfConsciousnessScore.overall
        ]),
        dominantDimension: this._findDominantDimension({
          phenomenal: phenomenalScore.overall,
          access: accessScore.overall,
          monitoring: monitoringScore.overall,
          selfConsciousness: selfConsciousnessScore.overall
        }),
        integrationQuality: this._assessIntegrationQuality({
          phenomenal: phenomenalScore.overall,
          access: accessScore.overall,
          monitoring: monitoringScore.overall,
          selfConsciousness: selfConsciousnessScore.overall
        })
      }
    };
  }
  
  /**
   * 分析具身认知状态
   * @param {Object} embodimentData - 具身认知输入数据
   * @returns {Object} 具身认知分析报告
   */
  analyzeEmbodimentThemes(embodimentData) {
    const {
      conceptualData = {},
      interactionData = {},
      bodyData = {},
      actionData = {}
    } = embodimentData;
    
    // 概念化主题评估
    const conceptualization = this._assessConceptualization(conceptualData);
    
    // 替代性主题评估
    const replacement = this._assessReplacement(interactionData);
    
    // 构成性主题评估
    const constitution = this._assessConstitution(bodyData);
    
    // 生成性主题评估
    const enaction = this._assessEnaction(actionData);
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      
      embodimentProfile: {
        conceptualization,
        replacement,
        constitution,
        enaction
      },
      
      embodimentIntegration: {
        overallEmbodiment: this._calculateOverallEmbodiment([
          conceptualization.score,
          replacement.score,
          constitution.score,
          enaction.score
        ]),
        dominantTheme: this._findDominantTheme({
          conceptualization: conceptualization.score,
          replacement: replacement.score,
          constitution: constitution.score,
          enaction: enaction.score
        }),
        embodimentCoherence: this._calculateEmbodimentCoherence({
          conceptualization: conceptualization.score,
          replacement: replacement.score,
          constitution: constitution.score,
          enaction: enaction.score
        })
      },
      
      recommendations: this._generateEmbodimentRecommendations({
        conceptualization,
        replacement,
        constitution,
        enaction
      })
    };
  }
  
  /**
   * 分析现象学给定感
   * @param {Object} givennessData - 给定感输入数据
   * @returns {Object} 给定感分析报告
   */
  analyzePhenomenologicalGivenness(givennessData) {
    const {
      selfGivennessData = {},
      bodyGivennessData = {},
      temporalGivennessData = {},
      socialGivennessData = {},
      worldGivennessData = {}
    } = givennessData;
    
    // 各维度给定感评分
    const selfGivenness = this._assessGivennessDimension('self', selfGivennessData);
    const bodyGivenness = this._assessGivennessDimension('body', bodyGivennessData);
    const temporalGivenness = this._assessGivennessDimension('temporal', temporalGivennessData);
    const socialGivenness = this._assessGivennessDimension('social', socialGivennessData);
    const worldGivenness = this._assessGivennessDimension('world', worldGivennessData);
    
    // 去人格化/去现实化风险评估
    const depersonalizationRisk = this._assessDepersonalizationRisk({
      selfGivenness,
      bodyGivenness,
      temporalGivenness,
      socialGivenness,
      worldGivenness
    });
    
    const derealizationRisk = this._assessDerealizationRisk({
      worldGivenness,
      selfGivenness,
      temporalGivenness
    });
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      
      givennessProfile: {
        self: {
          score: selfGivenness,
          level: this._getGivennessLevel('self', selfGivenness),
          interpretation: this._interpretGivenness('self', selfGivenness)
        },
        body: {
          score: bodyGivenness,
          level: this._getGivennessLevel('body', bodyGivenness),
          interpretation: this._interpretGivenness('body', bodyGivenness)
        },
        temporal: {
          score: temporalGivenness,
          level: this._getGivennessLevel('temporal', temporalGivenness),
          interpretation: this._interpretGivenness('temporal', temporalGivenness)
        },
        social: {
          score: socialGivenness,
          level: this._getGivennessLevel('social', socialGivenness),
          interpretation: this._interpretGivenness('social', socialGivenness)
        },
        world: {
          score: worldGivenness,
          level: this._getGivennessLevel('world', worldGivenness),
          interpretation: this._interpretGivenness('world', worldGivenness)
        }
      },
      
      overallGivenness: {
        score: (selfGivenness + bodyGivenness + temporalGivenness + socialGivenness + worldGivenness) / 5,
        interpretation: this._interpretOverallGivenness(
          (selfGivenness + bodyGivenness + temporalGivenness + socialGivenness + worldGivenness) / 5
        )
      },
      
      riskAssessment: {
        depersonalization: depersonalizationRisk,
        derealization: derealizationRisk,
        overallRisk: this._calculateOverallRisk(depersonalizationRisk, derealizationRisk)
      },
      
      interventionSuggestions: this._generateGivennessInterventions({
        selfGivenness,
        bodyGivenness,
        temporalGivenness,
        socialGivenness,
        worldGivenness,
        depersonalizationRisk,
        derealizationRisk
      })
    };
  }
  
  /**
   * 整合分析：意识 - 具身 - 自我三维模型
   * @param {Object} integratedData - 整合输入数据
   * @returns {Object} 整合分析报告
   */
  performIntegratedAnalysis(integratedData) {
    const {
      consciousnessData = {},
      embodimentData = {},
      givennessData = {},
      selfModelData = {}
    } = integratedData;
    
    // 分别分析各维度
    const consciousnessAnalysis = this.analyzeConsciousnessDimensions(consciousnessData);
    const embodimentAnalysis = this.analyzeEmbodimentThemes(embodimentData);
    const givennessAnalysis = this.analyzePhenomenologicalGivenness(givennessData);
    
    // 计算跨维度整合
    const crossDimensionIntegration = this._calculateCrossDimensionIntegration({
      consciousness: consciousnessAnalysis.consciousnessIntegration.crossDimensionCoherence,
      embodiment: embodimentAnalysis.embodimentIntegration.overallEmbodiment,
      givenness: givennessAnalysis.overallGivenness.score
    });
    
    // 生成整合干预方案
    const integratedIntervention = this._generateIntegratedIntervention({
      consciousnessAnalysis,
      embodimentAnalysis,
      givennessAnalysis,
      selfModelData
    });
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      processingTime: Date.now(),
      
      // 各维度分析结果
      dimensionalAnalyses: {
        consciousness: consciousnessAnalysis,
        embodiment: embodimentAnalysis,
        givenness: givennessAnalysis
      },
      
      // 跨维度整合
      crossDimensionIntegration: {
        consciousnessEmbodimentCoupling: crossDimensionIntegration.consciousnessEmbodiment,
        embodimentGivennessCoupling: crossDimensionIntegration.embodimentGivenness,
        consciousnessGivennessCoupling: crossDimensionIntegration.consciousnessGivenness,
        overallIntegration: crossDimensionIntegration.overall
      },
      
      // 整合干预方案
      integratedIntervention,
      
      // 理论整合说明
      theoreticalIntegration: this._getTheoreticalIntegrationSummary()
    };
  }
  
  // ==================== 内部计算方法 ====================
  
  _calculatePhenomenalScore(data) {
    const sensory = data.sensory?.intensity || 0.5;
    const emotional = data.emotional?.intensity || 0.5;
    const cognitive = data.cognitive?.clarity || 0.5;
    const bodily = data.bodily?.awareness || 0.5;
    
    const overall = (sensory + emotional + cognitive + bodily) / 4;
    
    return {
      overall,
      dimensions: {
        sensoryQualia: sensory,
        emotionalQualia: emotional,
        cognitiveQualia: cognitive,
        bodilyQualia: bodily
      }
    };
  }
  
  _calculateAccessScore(data) {
    const reportability = data.reportability || 0.5;
    const reasoningAccess = data.reasoningAccess || 0.5;
    const attentionalAccess = data.attentionalAccess || 0.5;
    const workingMemoryAccess = data.workingMemoryAccess || 0.5;
    
    const overall = (reportability + reasoningAccess + attentionalAccess + workingMemoryAccess) / 4;
    
    return {
      overall,
      dimensions: {
        reportability,
        reasoningAccess,
        attentionalAccess,
        workingMemoryAccess
      }
    };
  }
  
  _calculateMonitoringScore(data) {
    const selfMonitoring = data.selfMonitoring || 0.5;
    const confidenceTracking = data.confidenceTracking || 0.5;
    const errorDetection = data.errorDetection || 0.5;
    const metacognitiveAwareness = data.metacognitiveAwareness || 0.5;
    
    const overall = (selfMonitoring + confidenceTracking + errorDetection + metacognitiveAwareness) / 4;
    
    return {
      overall,
      dimensions: {
        selfMonitoring,
        confidenceTracking,
        errorDetection,
        metacognitiveAwareness
      }
    };
  }
  
  _calculateSelfConsciousnessScore(data) {
    const preReflectiveSelf = data.preReflectiveSelf || 0.5;
    const reflectiveSelf = data.reflectiveSelf || 0.5;
    const narrativeSelf = data.narrativeSelf || 0.5;
    const socialSelf = data.socialSelf || 0.5;
    
    const overall = (preReflectiveSelf + reflectiveSelf + narrativeSelf + socialSelf) / 4;
    
    return {
      overall,
      dimensions: {
        preReflectiveSelf,
        reflectiveSelf,
        narrativeSelf,
        socialSelf
      }
    };
  }
  
  _interpretPhenomenalScore(score) {
    if (score >= 0.8) return '现象意识高度丰富，体验质感清晰鲜明';
    if (score >= 0.6) return '现象意识正常，体验质感稳定';
    if (score >= 0.4) return '现象意识轻度减弱，体验质感有所模糊';
    if (score >= 0.2) return '现象意识显著减弱，体验质感明显模糊';
    return '现象意识严重减弱，体验质感显著缺失';
  }
  
  _interpretAccessScore(score) {
    if (score >= 0.8) return '取用意识高度发达，信息报告与推理能力强';
    if (score >= 0.6) return '取用意识正常，信息取用能力稳定';
    if (score >= 0.4) return '取用意识轻度受限，信息报告略有困难';
    if (score >= 0.2) return '取用意识显著受限，信息取用明显困难';
    return '取用意识严重受限，信息报告能力显著缺失';
  }
  
  _interpretMonitoringScore(score) {
    if (score >= 0.8) return '监控意识高度敏锐，元认知能力优秀';
    if (score >= 0.6) return '监控意识正常，自我监控能力稳定';
    if (score >= 0.4) return '监控意识轻度减弱，自我觉察有所波动';
    if (score >= 0.2) return '监控意识显著减弱，自我觉察明显困难';
    return '监控意识严重减弱，元认知能力显著缺失';
  }
  
  _interpretSelfConsciousnessScore(score) {
    if (score >= 0.8) return '自我意识高度整合，自我感稳定清晰';
    if (score >= 0.6) return '自我意识正常，自我感稳定';
    if (score >= 0.4) return '自我意识轻度波动，自我感偶有模糊';
    if (score >= 0.2) return '自我意识显著波动，自我感明显不稳定';
    return '自我意识严重波动，自我感显著缺失';
  }
  
  _calculateCrossDimensionCoherence(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    // 标准差越小，一致性越高
    return Math.max(0, 1 - stdDev);
  }
  
  _findDominantDimension(scores) {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  _assessIntegrationQuality(scores) {
    const values = Object.values(scores);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const range = Math.max(...values) - min;
    
    if (mean >= 0.7 && range <= 0.2) return '优秀 - 各维度高度整合且均衡';
    if (mean >= 0.6 && range <= 0.3) return '良好 - 各维度整合较好';
    if (mean >= 0.5 && range <= 0.4) return '中等 - 各维度整合一般';
    if (mean >= 0.4) return '轻度失衡 - 各维度整合需要改善';
    return '显著失衡 - 各维度整合需要重点关注';
  }
  
  _assessConceptualization(data) {
    const bodySchemaClarity = data.bodySchemaClarity || 0.5;
    const sensorimotorConcepts = data.sensorimotorConcepts || 0.5;
    const metaphorUnderstanding = data.metaphorUnderstanding || 0.5;
    
    const score = (bodySchemaClarity + sensorimotorConcepts + metaphorUnderstanding) / 3;
    
    return {
      score,
      dimensions: {
        bodySchemaClarity,
        sensorimotorConcepts,
        metaphorUnderstanding
      },
      interpretation: score >= 0.7 ? '概念化具身程度高' : score >= 0.5 ? '概念化具身程度中等' : '概念化具身程度低'
    };
  }
  
  _assessReplacement(data) {
    const environmentCoupling = data.environmentCoupling || 0.5;
    const realTimeAdaptation = data.realTimeAdaptation || 0.5;
    const representationDependence = 1 - (data.representationDependence || 0.5); // 越低越好
    
    const score = (environmentCoupling + realTimeAdaptation + representationDependence) / 3;
    
    return {
      score,
      dimensions: {
        environmentCoupling,
        realTimeAdaptation,
        representationDependence: 1 - representationDependence
      },
      interpretation: score >= 0.7 ? '替代性具身程度高' : score >= 0.5 ? '替代性具身程度中等' : '替代性具身程度低'
    };
  }
  
  _assessConstitution(data) {
    const bodyParticipation = data.bodyParticipation || 0.5;
    const embodiedPresence = data.embodiedPresence || 0.5;
    const bodyMindUnity = data.bodyMindUnity || 0.5;
    
    const score = (bodyParticipation + embodiedPresence + bodyMindUnity) / 3;
    
    return {
      score,
      dimensions: {
        bodyParticipation,
        embodiedPresence,
        bodyMindUnity
      },
      interpretation: score >= 0.7 ? '构成性具身程度高' : score >= 0.5 ? '构成性具身程度中等' : '构成性具身程度低'
    };
  }
  
  _assessEnaction(data) {
    const actionOrientation = data.actionOrientation || 0.5;
    const meaningGeneration = data.meaningGeneration || 0.5;
    const environmentShaping = data.environmentShaping || 0.5;
    
    const score = (actionOrientation + meaningGeneration + environmentShaping) / 3;
    
    return {
      score,
      dimensions: {
        actionOrientation,
        meaningGeneration,
        environmentShaping
      },
      interpretation: score >= 0.7 ? '生成性具身程度高' : score >= 0.5 ? '生成性具身程度中等' : '生成性具身程度低'
    };
  }
  
  _calculateOverallEmbodiment(scores) {
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  
  _findDominantTheme(scores) {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  _calculateEmbodimentCoherence(scores) {
    const values = Object.values(scores);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - stdDev);
  }
  
  _generateEmbodimentRecommendations(profile) {
    const recommendations = [];
    
    if (profile.conceptualization.score < 0.6) {
      recommendations.push({
        area: '概念化具身',
        suggestion: '增强身体图式觉察练习，如身体扫描、感觉运动模拟训练',
        priority: '中'
      });
    }
    
    if (profile.replacement.score < 0.6) {
      recommendations.push({
        area: '替代性具身',
        suggestion: '增加环境互动活动，减少过度依赖内部表征',
        priority: '中'
      });
    }
    
    if (profile.constitution.score < 0.6) {
      recommendations.push({
        area: '构成性具身',
        suggestion: '深化身体参与体验，如正念运动、舞蹈、武术',
        priority: '高'
      });
    }
    
    if (profile.enaction.score < 0.6) {
      recommendations.push({
        area: '生成性具身',
        suggestion: '增强行动导向的意义建构，如创造性表达、环境塑造活动',
        priority: '中'
      });
    }
    
    return recommendations;
  }
  
  _assessGivennessDimension(dimension, data) {
    const indicators = Object.values(data);
    if (indicators.length === 0) return 0.5;
    return indicators.reduce((a, b) => a + b, 0) / indicators.length;
  }
  
  _getGivennessLevel(dimension, score) {
    const dimConfig = this.givennessDimensions[dimension];
    if (!dimConfig) return '未知';
    
    if (score >= 4.5) return dimConfig.levels[5];
    if (score >= 3.5) return dimConfig.levels[4];
    if (score >= 2.5) return dimConfig.levels[3];
    if (score >= 1.5) return dimConfig.levels[2];
    if (score >= 0.5) return dimConfig.levels[1];
    return dimConfig.levels[0];
  }
  
  _interpretGivenness(dimension, score) {
    const interpretations = {
      self: {
        high: '自我给定感强，体验作为"我的"体验的感受清晰稳定',
        normal: '自我给定感正常，自我感稳定',
        low: '自我给定感弱，可能存在去人格化风险'
      },
      body: {
        high: '身体给定感强，具身存在感清晰',
        normal: '身体给定感正常',
        low: '身体给定感弱，可能存在身体疏离'
      },
      temporal: {
        high: '时间给定感强，时间流动体验清晰',
        normal: '时间给定感正常',
        low: '时间给定感弱，可能存在时间扭曲体验'
      },
      social: {
        high: '社会给定感强，关系连接感清晰',
        normal: '社会给定感正常',
        low: '社会给定感弱，可能存在社会隔离感'
      },
      world: {
        high: '世界给定感强，外部世界实在感清晰',
        normal: '世界给定感正常',
        low: '世界给定感弱，可能存在去现实化风险'
      }
    };
    
    const dimInterp = interpretations[dimension];
    if (!dimInterp) return '无法解释';
    
    if (score >= 3.5) return dimInterp.high;
    if (score >= 2.5) return dimInterp.normal;
    return dimInterp.low;
  }
  
  _interpretOverallGivenness(score) {
    if (score >= 4.0) return '现象学给定感整体优秀，体验结构高度整合';
    if (score >= 3.0) return '现象学给定感整体正常，体验结构稳定';
    if (score >= 2.0) return '现象学给定感整体轻度减弱，体验结构偶有波动';
    if (score >= 1.0) return '现象学给定感整体显著减弱，体验结构明显不稳定';
    return '现象学给定感整体严重减弱，体验结构显著缺失';
  }
  
  _assessDepersonalizationRisk(givennessProfile) {
    const { selfGivenness, bodyGivenness, temporalGivenness, socialGivenness, worldGivenness } = givennessProfile;
    
    const riskScore = (
      (1 - selfGivenness/5) * 0.4 +
      (1 - bodyGivenness/5) * 0.25 +
      (1 - temporalGivenness/5) * 0.15 +
      (1 - socialGivenness/5) * 0.1 +
      (1 - worldGivenness/5) * 0.1
    );
    
    let riskLevel, description;
    if (riskScore >= 0.7) {
      riskLevel = '高';
      description = '去人格化风险高，建议立即干预';
    } else if (riskScore >= 0.5) {
      riskLevel = '中';
      description = '去人格化风险中等，建议关注并预防';
    } else if (riskScore >= 0.3) {
      riskLevel = '低';
      description = '去人格化风险低，保持当前状态';
    } else {
      riskLevel = '很低';
      description = '去人格化风险很低，状态良好';
    }
    
    return {
      score: riskScore,
      level: riskLevel,
      description
    };
  }
  
  _assessDerealizationRisk(givennessProfile) {
    const { worldGivenness, selfGivenness, temporalGivenness } = givennessProfile;
    
    const riskScore = (
      (1 - worldGivenness/5) * 0.5 +
      (1 - selfGivenness/5) * 0.3 +
      (1 - temporalGivenness/5) * 0.2
    );
    
    let riskLevel, description;
    if (riskScore >= 0.7) {
      riskLevel = '高';
      description = '去现实化风险高，外部世界实在感显著减弱';
    } else if (riskScore >= 0.5) {
      riskLevel = '中';
      description = '去现实化风险中等，外部世界实在感偶有波动';
    } else if (riskScore >= 0.3) {
      riskLevel = '低';
      description = '去现实化风险低，外部世界实在感稳定';
    } else {
      riskLevel = '很低';
      description = '去现实化风险很低，状态良好';
    }
    
    return {
      score: riskScore,
      level: riskLevel,
      description
    };
  }
  
  _calculateOverallRisk(depersonalization, derealization) {
    const avgScore = (depersonalization.score + derealization.score) / 2;
    const maxLevel = depersonalization.level === '高' || derealization.level === '高' ? '高' :
                     depersonalization.level === '中' || derealization.level === '中' ? '中' : '低';
    
    return {
      score: avgScore,
      level: maxLevel,
      description: `整体风险：${maxLevel} (去人格化：${depersonalization.level}, 去现实化：${derealization.level})`
    };
  }
  
  _generateGivennessInterventions(profile) {
    const interventions = [];
    
    if (profile.selfGivenness < 3) {
      interventions.push({
        dimension: '自我给定感',
        practices: [
          '自我觉察冥想：每日 10 分钟非判断性自我观察',
          '第一人称叙述练习：用"我"描述当下体验',
          '自我连续性日记：记录每日自我感变化'
        ],
        priority: '高'
      });
    }
    
    if (profile.bodyGivenness < 3) {
      interventions.push({
        dimension: '身体给定感',
        practices: [
          '身体扫描冥想：系统性觉察身体各部位',
          '正念运动：瑜伽、太极或正念行走',
          '感官接地练习：5-4-3-2-1 技术'
        ],
        priority: '高'
      });
    }
    
    if (profile.temporalGivenness < 3) {
      interventions.push({
        dimension: '时间给定感',
        practices: [
          '时间觉察冥想：观察时间流动感',
          '过去 - 现在 - 未来整合日记',
          '节奏性活动：击鼓、舞蹈等时间结构化活动'
        ],
        priority: '中'
      });
    }
    
    if (profile.socialGivenness < 3) {
      interventions.push({
        dimension: '社会给定感',
        practices: [
          '共在冥想：觉察与他人的连接感',
          '深度倾听练习：专注他人表达',
          '团体活动：参与有意义的社交活动'
        ],
        priority: '中'
      });
    }
    
    if (profile.worldGivenness < 3) {
      interventions.push({
        dimension: '世界给定感',
        practices: [
          '自然沉浸：定期接触自然环境',
          '感官丰富化：刻意注意环境细节',
          '现实检验：定期验证外部世界稳定性'
        ],
        priority: '高'
      });
    }
    
    if (profile.depersonalizationRisk.level === '高' || profile.derealizationRisk.level === '高') {
      interventions.push({
        dimension: '紧急干预',
        practices: [
          '立即进行感官接地练习',
          '联系心理健康专业人士',
          '避免独处，寻求社会支持'
        ],
        priority: '紧急'
      });
    }
    
    return interventions;
  }
  
  _calculateCrossDimensionIntegration(data) {
    const { consciousness, embodiment, givenness } = data;
    
    const consciousnessEmbodiment = (consciousness + embodiment) / 2;
    const embodimentGivenness = (embodiment + givenness) / 2;
    const consciousnessGivenness = (consciousness + givenness) / 2;
    const overall = (consciousness + embodiment + givenness) / 3;
    
    return {
      consciousnessEmbodiment,
      embodimentGivenness,
      consciousnessGivenness,
      overall
    };
  }
  
  _generateIntegratedIntervention(data) {
    const { consciousnessAnalysis, embodimentAnalysis, givennessAnalysis } = data;
    
    const priorities = [];
    
    // 根据各维度得分确定优先干预领域
    if (consciousnessAnalysis.consciousnessIntegration.crossDimensionCoherence < 0.6) {
      priorities.push({
        area: '意识整合',
        focus: '增强意识维度间的连贯性',
        practices: [
          '整合冥想：同时关注现象、取用、监控维度',
          '意识状态日记：记录不同意识维度的变化',
          '元认知训练：提升对意识状态的觉察'
        ]
      });
    }
    
    if (embodimentAnalysis.embodimentIntegration.overallEmbodiment < 0.6) {
      priorities.push({
        area: '具身整合',
        focus: '深化身体与认知的整合',
        practices: [
          '具身认知练习：用身体动作表达概念',
          '环境耦合活动：增加与环境的实时互动',
          '生成性艺术：通过行动创造意义'
        ]
      });
    }
    
    if (givennessAnalysis.overallGivenness.score < 3) {
      priorities.push({
        area: '给定感恢复',
        focus: '恢复现象学给定感',
        practices: givennessAnalysis.interventionSuggestions?.map(i => i.practices).flat() || []
      });
    }
    
    return {
      priorities,
      integratedPractice: this._generateIntegratedPractice(priorities),
      estimatedTimeline: this._estimateTimeline(priorities)
    };
  }
  
  _generateIntegratedPractice(priorities) {
    return {
      dailyPractice: {
        morning: '正念身体扫描 (10 分钟) + 意识状态检查 (5 分钟)',
        afternoon: '具身行动练习 (15 分钟) + 元认知反思 (5 分钟)',
        evening: '整合日记 (10 分钟) + 给定感回顾 (5 分钟)'
      },
      weeklyPractice: {
        deepPractice: '60 分钟整合冥想或具身运动',
        reflection: '30 分钟周度整合反思',
        socialConnection: '参与有意义的社交活动'
      }
    };
  }
  
  _estimateTimeline(priorities) {
    if (priorities.length >= 3) return '8-12 周 (多领域整合)';
    if (priorities.length === 2) return '6-8 周 (双领域整合)';
    return '4-6 周 (单领域聚焦)';
  }
  
  _getTheoreticalIntegrationSummary() {
    return {
      consciousnessTheory: '整合 Block 的取用/现象意识区分与 Rosenthal 的高阶思维理论',
      embodimentTheory: '整合 Wilson 的六大主题与 Gallagher 的具身认知四 E 框架',
      phenomenologyTheory: '整合胡塞尔给定感、海德格尔存在论与梅洛 - 庞蒂身体现象学',
      integrationFramework: '基于预测加工框架统一意识、具身与自我意识理论'
    };
  }
}

module.exports = ConsciousnessPhenomenologyModule;
