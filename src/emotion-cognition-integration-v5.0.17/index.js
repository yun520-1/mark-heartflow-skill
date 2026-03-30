/**
 * HeartFlow v5.0.17 - Emotion-Cognition-Embodiment Triadic Integration
 * 
 * 情绪 - 认知 - 具身三元整合模块
 * 
 * 理论框架:
 * - 情绪三传统：感受 (Feeling)、评价 (Evaluative)、动机 (Motivational)
 * - 认知科学：表征结构 + 计算程序
 * - 具身认知四 E: Embodied, Embedded, Enactive, Extended
 * 
 * @version 5.0.17
 * @author HeartFlow Team
 * @license MIT
 */

const _ = require('lodash');

class EmotionCognitionIntegration {
  constructor(config = {}) {
    this.version = '5.0.17';
    this.language = config.language || 'zh-CN';
    this.debugMode = config.debug || false;
  }

  /**
   * 情绪三传统整合分析
   * 基于 SEP Emotion Theory (Scaranto 2026)
   */
  analyzeEmotionTraditions(data) {
    const { feelingData, evaluativeData, motivationalData } = data;

    // 感受传统评分
    const feelingScore = this._calculateFeelingScore(feelingData);
    
    // 评价传统评分
    const evaluativeScore = this._calculateEvaluativeScore(evaluativeData);
    
    // 动机传统评分
    const motivationalScore = this._calculateMotivationalScore(motivationalData);

    // 跨传统一致性
    const scores = [feelingScore, evaluativeScore, motivationalScore];
    const coherence = this._calculateCoherence(scores);

    // 四大挑战评估
    const fourChallenges = this._assessFourChallenges(data);

    return {
      traditionScores: {
        feeling: {
          score: _.round(feelingScore, 2),
          level: this._getLevel(feelingScore),
          interpretation: this._interpretFeeling(feelingScore)
        },
        evaluative: {
          score: _.round(evaluativeScore, 2),
          level: this._getLevel(evaluativeScore),
          interpretation: this._interpretEvaluative(evaluativeScore)
        },
        motivational: {
          score: _.round(motivationalScore, 2),
          level: this._getLevel(motivationalScore),
          interpretation: this._interpretMotivational(motivationalScore)
        }
      },
      integrationMetrics: {
        crossTraditionCoherence: _.round(coherence, 2),
        dominantTradition: this._getDominantTradition(scores),
        integrationQuality: this._getIntegrationQuality(coherence)
      },
      fourChallengesAssessment: fourChallenges,
      recommendations: this._generateEmotionRecommendations(feelingScore, evaluativeScore, motivationalScore, coherence)
    };
  }

  /**
   * 认知科学六维评估
   */
  analyzeCognitiveDimensions(data) {
    const { representationData, computationalData, disciplinaryIntegration } = data;

    // 表征维度评分
    const representationProfile = this._analyzeRepresentation(representationData);
    
    // 计算维度评分
    const computationalProfile = this._analyzeComputational(computationalData);
    
    // 学科整合评分
    const interdisciplinaryScore = this._calculateInterdisciplinaryScore(disciplinaryIntegration);

    // 认知风格分类
    const cognitiveStyle = this._classifyCognitiveStyle(representationProfile, computationalProfile);

    return {
      representationProfile,
      computationalProfile,
      interdisciplinaryScore: _.round(interdisciplinaryScore, 2),
      cognitiveStyle,
      recommendations: this._generateCognitionRecommendations(representationProfile, computationalProfile, interdisciplinaryScore)
    };
  }

  /**
   * 具身认知四 E 深度评估
   */
  analyze4EEmbodiment(data) {
    const { embodiedData, embeddedData, enactiveData, extendedData } = data;

    // 四 E 评分
    const fourEProfile = {
      embodied: this._analyzeEmbodiedData(embodiedData),
      embedded: this._analyzeEmbeddedData(embeddedData),
      enactive: this._analyzeEnactiveData(enactiveData),
      extended: this._analyzeExtendedData(extendedData)
    };

    // 总体具身分数
    const overallEmbodiment = _.mean([
      fourEProfile.embodied.score,
      fourEProfile.embedded.score,
      fourEProfile.enactive.score,
      fourEProfile.extended.score
    ]);

    // 具身风格分类
    const embodimentStyle = this._classifyEmbodimentStyle(fourEProfile);

    return {
      fourEProfile,
      overallEmbodiment: _.round(overallEmbodiment, 2),
      embodimentStyle,
      recommendations: this._generateEmbodimentRecommendations(fourEProfile, overallEmbodiment)
    };
  }

  /**
   * 三元整合分析 (情绪 - 认知 - 具身)
   */
  performTriadicIntegration(data) {
    const { emotionData, cognitionData, embodimentData } = data;

    // 两两耦合分析
    const emotionCognitionCoupling = this._calculatePairwiseCoupling(emotionData, cognitionData);
    const emotionEmbodimentCoupling = this._calculatePairwiseCoupling(emotionData, embodimentData);
    const cognitionEmbodimentCoupling = this._calculatePairwiseCoupling(cognitionData, embodimentData);

    // 三元一致性
    const triadicCoherence = _.mean([
      emotionCognitionCoupling,
      emotionEmbodimentCoupling,
      cognitionEmbodimentCoupling
    ]);

    // 整合风格分类
    const integrationStyle = this._classifyIntegrationStyle(emotionData, cognitionData, embodimentData);

    // 系统性干预建议
    const systemicIntervention = this._generateSystemicIntervention(
      emotionData, cognitionData, embodimentData, triadicCoherence
    );

    // 理论综合
    const theoreticalSynthesis = this._generateTheoreticalSynthesis(emotionData, cognitionData, embodimentData);

    return {
      pairwiseCoupling: {
        emotionCognition: _.round(emotionCognitionCoupling, 2),
        emotionEmbodiment: _.round(emotionEmbodimentCoupling, 2),
        cognitionEmbodiment: _.round(cognitionEmbodimentCoupling, 2)
      },
      triadicCoherence: _.round(triadicCoherence, 2),
      integrationStyle,
      systemicIntervention,
      theoreticalSynthesis
    };
  }

  /**
   * 情绪原型相似度计算
   * 基于 Fehr & Russell (1984) 原型理论
   */
  analyzeEmotionPrototype(data) {
    const { emotionCategory, featureEndorsement } = data;

    // 原型模板 (简化版)
    const prototypes = {
      fear: {
        physiologicalArousal: 0.9,
        negativeValence: 0.95,
        urgency: 0.85,
        avoidanceTendency: 0.9,
        facialExpression: 0.7,
        consciousExperience: 0.8
      },
      anger: {
        physiologicalArousal: 0.85,
        negativeValence: 0.9,
        urgency: 0.8,
        avoidanceTendency: 0.2,
        approachTendency: 0.9,
        facialExpression: 0.75,
        consciousExperience: 0.85
      },
      joy: {
        physiologicalArousal: 0.7,
        positiveValence: 0.95,
        urgency: 0.5,
        approachTendency: 0.8,
        facialExpression: 0.9,
        consciousExperience: 0.85
      },
      sadness: {
        physiologicalArousal: 0.4,
        negativeValence: 0.85,
        urgency: 0.3,
        avoidanceTendency: 0.6,
        facialExpression: 0.7,
        consciousExperience: 0.8
      }
    };

    const targetPrototype = prototypes[emotionCategory];
    if (!targetPrototype) {
      return { error: `Unknown emotion category: ${emotionCategory}` };
    }

    // 计算原型相似度
    const similarity = this._calculatePrototypeSimilarity(featureEndorsement, targetPrototype);

    // 与其他原型比较
    const comparisons = {};
    for (const [category, prototype] of Object.entries(prototypes)) {
      if (category !== emotionCategory) {
        comparisons[category] = _.round(this._calculatePrototypeSimilarity(featureEndorsement, prototype), 2);
      }
    }

    // 分类成员资格
    const categoryMembership = similarity >= 0.7 ? '典型成员' : 
                               similarity >= 0.5 ? '边缘成员' : '非典型成员';

    return {
      prototypeScore: _.round(similarity, 2),
      categoryMembership,
      borderlineFeatures: this._identifyBorderlineFeatures(featureEndorsement, targetPrototype),
      comparisonToPrototypes: comparisons
    };
  }

  /**
   * 跨文化情绪表达评估
   */
  analyzeCrossCulturalEmotion(data) {
    const { culturalBackground, expressionData, universalFeatures, cultureSpecificFeatures } = data;

    // 普遍性分数
    const universalScore = _.mean(Object.values(universalFeatures));

    // 文化特异性分数
    const cultureSpecificScore = _.mean(Object.values(cultureSpecificFeatures));

    // 文化风格分类
    const culturalStyle = this._classifyCulturalStyle(cultureSpecificFeatures);

    // 适应性建议
    const adaptationRecommendations = this._generateAdaptationRecommendations(
      culturalBackground, universalScore, cultureSpecificScore
    );

    return {
      culturalStyle,
      universalScore: _.round(universalScore, 2),
      cultureSpecificScore: _.round(cultureSpecificScore, 2),
      adaptationRecommendations
    };
  }

  // ==================== 内部辅助方法 ====================

  _calculateFeelingScore(data) {
    if (!data) return 0.5;
    const weights = { phenomenalQuality: 0.4, interoceptiveAwareness: 0.35, emotionalClarity: 0.25 };
    return _.sumBy(Object.entries(data), ([key, value]) => (weights[key] || 0.33) * value);
  }

  _calculateEvaluativeScore(data) {
    if (!data) return 0.5;
    const appraisalWeights = { relevance: 0.25, valence: 0.25, agency: 0.25, coping: 0.25 };
    const appraisalScore = _.sumBy(Object.entries(data.appraisalPattern || {}), 
      ([key, value]) => (appraisalWeights[key] || 0.25) * value);
    const reframeScore = data.cognitiveReframing || 0.5;
    return (appraisalScore + reframeScore) / 2;
  }

  _calculateMotivationalScore(data) {
    if (!data) return 0.5;
    const weights = { actionTendency: 0.4, goalRelevance: 0.35, motivationalClarity: 0.25 };
    return _.sumBy(Object.entries(data), ([key, value]) => (weights[key] || 0.33) * value);
  }

  _calculateCoherence(scores) {
    if (scores.length < 2) return 1;
    const mean = _.mean(scores);
    const variance = _.mean(scores.map(s => Math.pow(s - mean, 2)));
    return Math.max(0, 1 - variance * 4); // 方差越小，一致性越高
  }

  _getLevel(score) {
    if (score >= 0.8) return '高';
    if (score >= 0.6) return '中等';
    if (score >= 0.4) return '中低';
    return '低';
  }

  _getDominantTradition(scores) {
    const names = ['feeling', 'evaluative', 'motivational'];
    const maxIndex = scores.indexOf(Math.max(...scores));
    return names[maxIndex];
  }

  _getIntegrationQuality(coherence) {
    if (coherence >= 0.8) return '优秀';
    if (coherence >= 0.6) return '良好';
    if (coherence >= 0.4) return '中等';
    return '需改进';
  }

  _interpretFeeling(score) {
    if (score >= 0.7) return '情绪体验清晰，内感受觉察良好';
    if (score >= 0.5) return '情绪体验中等，可增强身体觉察';
    return '情绪体验模糊，建议加强内感受训练';
  }

  _interpretEvaluative(score) {
    if (score >= 0.7) return '评价模式清晰，认知重构能力良好';
    if (score >= 0.5) return '评价模式中等，可提升认知灵活性';
    return '评价模式模糊，建议学习认知重构技巧';
  }

  _interpretMotivational(score) {
    if (score >= 0.7) return '行动倾向明确，目标导向清晰';
    if (score >= 0.5) return '动机状态中等，可增强目标连接';
    return '动机状态模糊，建议澄清价值与目标';
  }

  _assessFourChallenges(data) {
    return {
      differentiation: {
        score: _.round(0.5 + (data.feelingData?.emotionalClarity || 0.5) * 0.4, 2),
        interpretation: '情绪区分能力'
      },
      motivation: {
        score: _.round((data.motivationalData?.actionTendency || 0.5) * 1.2, 2),
        interpretation: '情绪驱动行为能力'
      },
      intentionality: {
        score: _.round(0.5 + (data.evaluativeData?.appraisalPattern?.relevance || 0.5) * 0.4, 2),
        interpretation: '情绪对象指向性'
      },
      phenomenology: {
        score: _.round((data.feelingData?.phenomenalQuality || 0.5) * 1.2, 2),
        interpretation: '情绪主观体验'
      }
    };
  }

  _generateEmotionRecommendations(feeling, evaluative, motivational, coherence) {
    const recs = [];
    if (feeling < 0.6) recs.push('增强内感受觉察：每日身体扫描练习 10 分钟');
    if (evaluative < 0.6) recs.push('学习认知重构：识别自动思维，练习替代解释');
    if (motivational < 0.6) recs.push('澄清价值目标：写下最重要的 3 个价值及其行动');
    if (coherence < 0.6) recs.push('整合练习：情绪日记，记录感受 - 评价 - 动机的连接');
    return recs;
  }

  _analyzeRepresentation(data) {
    if (!data) return { overall: 0.5, dimensions: {} };
    const overall = _.mean(Object.values(data));
    return {
      overall: _.round(overall, 2),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _analyzeComputational(data) {
    if (!data) return { overall: 0.5, dimensions: {} };
    const overall = _.mean(Object.values(data));
    return {
      overall: _.round(overall, 2),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _calculateInterdisciplinaryScore(data) {
    if (!data) return 0.5;
    return _.mean(Object.values(data));
  }

  _classifyCognitiveStyle(rep, comp) {
    const avgRep = rep.overall;
    const avgComp = comp.overall;
    if (avgRep >= 0.7 && avgComp >= 0.7) return '分析 - 整合型';
    if (avgRep >= 0.7) return '表征主导型';
    if (avgComp >= 0.7) return '计算主导型';
    return '发展中型';
  }

  _generateCognitionRecommendations(rep, comp, inter) {
    const recs = [];
    if (rep.overall < 0.6) recs.push('丰富表征多样性：练习意象、类比、概念多种表征方式');
    if (comp.overall < 0.6) recs.push('提升计算策略：学习演绎推理、模式匹配技巧');
    if (inter < 0.6) recs.push('拓展学科视野：阅读心理学、神经科学、哲学交叉文献');
    return recs;
  }

  _analyzeEmbodiedData(data) {
    if (!data) return { score: 0.5, level: '中等' };
    const score = _.mean(Object.values(data));
    return {
      score: _.round(score, 2),
      level: this._getLevel(score),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _analyzeEmbeddedData(data) {
    if (!data) return { score: 0.5, level: '中等' };
    const score = _.mean(Object.values(data));
    return {
      score: _.round(score, 2),
      level: this._getLevel(score),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _analyzeEnactiveData(data) {
    if (!data) return { score: 0.5, level: '中等' };
    const score = _.mean(Object.values(data));
    return {
      score: _.round(score, 2),
      level: this._getLevel(score),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _analyzeExtendedData(data) {
    if (!data) return { score: 0.5, level: '中等' };
    const score = _.mean(Object.values(data));
    return {
      score: _.round(score, 2),
      level: this._getLevel(score),
      dimensions: _.mapValues(data, v => _.round(v, 2))
    };
  }

  _classifyEmbodimentStyle(profile) {
    const scores = [profile.embodied.score, profile.embedded.score, profile.enactive.score, profile.extended.score];
    const maxScore = Math.max(...scores);
    const avgScore = _.mean(scores);
    
    if (avgScore >= 0.7) return '高度整合型';
    if (maxScore - _.min(scores) < 0.15) return '平衡型';
    if (profile.embodied.score === maxScore) return '身体主导型';
    if (profile.enactive.score === maxScore) return '行动主导型';
    return '发展中型';
  }

  _generateEmbodimentRecommendations(profile, overall) {
    const recs = [];
    if (profile.embodied.score < 0.6) recs.push('增强身体觉察：正念身体扫描、瑜伽、太极');
    if (profile.embedded.score < 0.6) recs.push('优化环境耦合：创建工作/生活支持性环境');
    if (profile.enactive.score < 0.6) recs.push('强化行动导向：设定小目标，立即行动');
    if (profile.extended.score < 0.6) recs.push('善用外部工具：笔记、清单、社会支持');
    if (overall < 0.6) recs.push('整合练习：具身冥想 + 环境设计 + 行动承诺');
    return recs;
  }

  _calculatePairwiseCoupling(data1, data2) {
    // 简化版：计算两个数据集的整体相关性
    const scores1 = this._extractScores(data1);
    const scores2 = this._extractScores(data2);
    if (scores1.length === 0 || scores2.length === 0) return 0.5;
    
    // 使用简单一致性作为耦合指标
    const mean1 = _.mean(scores1);
    const mean2 = _.mean(scores2);
    const diff = Math.abs(mean1 - mean2);
    return Math.max(0, 1 - diff);
  }

  _extractScores(data) {
    const scores = [];
    const extract = (obj) => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'number') scores.push(value);
        else if (typeof value === 'object' && value !== null) extract(value);
      }
    };
    extract(data);
    return scores;
  }

  _classifyIntegrationStyle(emotion, cognition, embodiment) {
    const emotionScore = this._extractScores(emotion).reduce((a, b) => a + b, 0) / this._extractScores(emotion).length || 0.5;
    const cognitionScore = this._extractScores(cognition).reduce((a, b) => a + b, 0) / this._extractScores(cognition).length || 0.5;
    const embodimentScore = this._extractScores(embodiment).reduce((a, b) => a + b, 0) / this._extractScores(embodiment).length || 0.5;

    const maxScore = Math.max(emotionScore, cognitionScore, embodimentScore);
    
    if (maxScore === emotionScore) return '情绪主导 - 认知支持型';
    if (maxScore === cognitionScore) return '认知主导 - 情绪调节型';
    return '具身主导 - 行动导向型';
  }

  _generateSystemicIntervention(emotion, cognition, embodiment, coherence) {
    const primaryLever = coherence >= 0.7 ? 'balanced' : 
                         this._extractScores(emotion).reduce((a, b) => a + b, 0) > 
                         this._extractScores(cognition).reduce((a, b) => a + b, 0) ? 'emotion' : 'cognition';

    return {
      primaryLever,
      secondaryLever: primaryLever === 'emotion' ? 'cognition' : 'emotion',
      integratedPractice: {
        daily: '正念觉察 (10min) + 认知重构 (5min) + 身体运动 (15min)',
        weekly: '整合反思日记 + 社会连接活动',
        estimatedTimeline: coherence >= 0.7 ? '维持当前练习' : '4-6 周'
      }
    };
  }

  _generateTheoreticalSynthesis(emotion, cognition, embodiment) {
    return {
      feelingTraditionEmbodiment: '内感受预测误差 = 身体给定感',
      evaluativeTraditionCognition: '评价模式 = 命题表征操作',
      motivationalTraditionEnaction: '行动倾向 = 生成性认知'
    };
  }

  _calculatePrototypeSimilarity(features, prototype) {
    let totalSimilarity = 0;
    let featureCount = 0;
    
    for (const [feature, value] of Object.entries(features)) {
      if (prototype.hasOwnProperty(feature)) {
        const diff = Math.abs(value - prototype[feature]);
        totalSimilarity += (1 - diff);
        featureCount++;
      }
    }
    
    return featureCount > 0 ? totalSimilarity / featureCount : 0.5;
  }

  _identifyBorderlineFeatures(features, prototype) {
    const borderlines = [];
    for (const [feature, value] of Object.entries(features)) {
      if (prototype.hasOwnProperty(feature)) {
        const diff = Math.abs(value - prototype[feature]);
        if (diff > 0.3) {
          borderlines.push({ feature, userValue: value, prototypeValue: prototype[feature] });
        }
      }
    }
    return borderlines;
  }

  _classifyCulturalStyle(cultureSpecificFeatures) {
    const interpersonalFocus = cultureSpecificFeatures.interpersonalFocus || 0.5;
    const socialHarmony = cultureSpecificFeatures.socialHarmonyConcern || 0.5;
    
    if (interpersonalFocus >= 0.7 && socialHarmony >= 0.7) return '互依型情绪表达';
    if (interpersonalFocus < 0.4 && socialHarmony < 0.4) return '独立型情绪表达';
    return '整合型情绪表达';
  }

  _generateAdaptationRecommendations(background, universal, cultureSpecific) {
    const recs = [];
    if (cultureSpecific < 0.6) {
      recs.push(`学习${background}文化的情绪表达规则`);
      recs.push('观察当地人的情绪表达方式');
    }
    if (universal < 0.6) {
      recs.push('强化基本情绪识别训练');
      recs.push('练习跨文化情绪沟通技巧');
    }
    if (universal >= 0.7 && cultureSpecific >= 0.7) {
      recs.push('维持双文化情绪能力，灵活切换表达风格');
    }
    return recs;
  }
}

module.exports = EmotionCognitionIntegration;
