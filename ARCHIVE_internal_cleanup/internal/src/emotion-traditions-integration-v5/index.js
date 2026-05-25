/**
 * HeartFlow Emotion Traditions Integration v5.0
 * 
 * 情绪理论三大传统完整整合模块
 * 理论来源：SEP Emotion (Section 2: Three Traditions)
 * 
 * 三大传统:
 * 1. Feeling Tradition: 情绪作为独特的主观体验 (James-Lange, 心理建构主义)
 * 2. Evaluative Tradition: 情绪作为对情境的评价 (认知评价理论)
 * 3. Motivational Tradition: 情绪作为动机状态 (行动倾向理论)
 * 
 * @version 5.0.2
 * @author HeartFlow Team
 */

const TraditionsAssessor = require('./traditions-assessor');
const ComponentAnalyzer = require('./component-analyzer');

class EmotionTraditionsIntegration {
  constructor() {
    this.assessor = new TraditionsAssessor();
    this.analyzer = new ComponentAnalyzer();
    this.version = '5.0.2';
  }

  /**
   * 完整情绪评估 - 整合三大传统
   * @param {Object} emotionData - 情绪数据
   * @returns {Object} 整合评估结果
   */
  assessEmotion(emotionData) {
    const { emotion, context, userResponse } = emotionData;
    
    // 1. Feeling Tradition 评估
    const feelingAssessment = this.assessor.assessFeelingTradition({
      emotion,
      subjectiveExperience: userResponse?.experience,
      intensity: userResponse?.intensity,
      valence: userResponse?.valence
    });

    // 2. Evaluative Tradition 评估
    const evaluativeAssessment = this.assessor.assessEvaluativeTradition({
      emotion,
      context,
      appraisal: userResponse?.appraisal,
      meaningMaking: userResponse?.meaningMaking
    });

    // 3. Motivational Tradition 评估
    const motivationalAssessment = this.assessor.assessMotivationalTradition({
      emotion,
      actionTendency: userResponse?.actionTendency,
      goalRelevance: userResponse?.goalRelevance,
      urgency: userResponse?.urgency
    });

    // 4. 情绪成分分析
    const componentAnalysis = this.analyzer.analyzeComponents(userResponse);

    // 5. 整合三大传统
    const integration = this._integrateTraditions(
      feelingAssessment,
      evaluativeAssessment,
      motivationalAssessment,
      componentAnalysis
    );

    return {
      version: this.version,
      emotion,
      timestamp: new Date().toISOString(),
      traditions: {
        feeling: feelingAssessment,
        evaluative: evaluativeAssessment,
        motivational: motivationalAssessment
      },
      components: componentAnalysis,
      integration,
      recommendations: this._generateRecommendations(integration)
    };
  }

  /**
   * 整合三大传统
   */
  _integrateTraditions(feeling, evaluative, motivational, components) {
    // 计算各传统的权重
    const weights = this._calculateWeights(feeling, evaluative, motivational);

    // 识别主导传统
    const dominantTradition = this._identifyDominantTradition(weights);

    // 检测传统间冲突
    const conflicts = this._detectConflicts(feeling, evaluative, motivational);

    // 生成整合描述
    const integratedDescription = this._generateIntegratedDescription(
      feeling, evaluative, motivational, weights
    );

    return {
      weights,
      dominantTradition,
      conflicts,
      integratedDescription,
      coherence: this._calculateCoherence(feeling, evaluative, motivational),
      complexity: this._calculateComplexity(components)
    };
  }

  /**
   * 计算各传统的权重
   */
  _calculateWeights(feeling, evaluative, motivational) {
    const feelingWeight = (
      feeling.experienceClarity * 0.4 +
      feeling.intensityClarity * 0.3 +
      feeling.valenceClarity * 0.3
    );

    const evaluativeWeight = (
      evaluative.appraisalClarity * 0.4 +
      evaluative.meaningClarity * 0.3 +
      evaluative.contextFit * 0.3
    );

    const motivationalWeight = (
      motivational.actionTendencyClarity * 0.4 +
      motivational.goalRelevanceClarity * 0.3 +
      motivational.urgencyClarity * 0.3
    );

    // 归一化
    const total = feelingWeight + evaluativeWeight + motivationalWeight;
    
    return {
      feeling: total > 0 ? feelingWeight / total : 0.33,
      evaluative: total > 0 ? evaluativeWeight / total : 0.33,
      motivational: total > 0 ? motivationalWeight / total : 0.33
    };
  }

  /**
   * 识别主导传统
   */
  _identifyDominantTradition(weights) {
    const entries = Object.entries(weights);
    entries.sort((a, b) => b[1] - a[1]);
    
    const [dominant, score] = entries[0];
    const secondary = entries[1];
    
    return {
      primary: dominant,
      score,
      secondary: secondary[0],
      secondaryScore: secondary[1],
      isBalanced: score - secondary[1] < 0.15
    };
  }

  /**
   * 检测传统间冲突
   */
  _detectConflicts(feeling, evaluative, motivational) {
    const conflicts = [];

    // Feeling vs Evaluative 冲突
    if (feeling.valence === 'positive' && evaluative.appraisal === 'threatening') {
      conflicts.push({
        type: 'feeling_evaluative_mismatch',
        description: '感受效价与情境评价不一致',
        example: '感到兴奋但情境实际是威胁性的',
        intervention: '重新评估情境，检查是否存在认知扭曲'
      });
    }

    // Feeling vs Motivational 冲突
    if (feeling.valence === 'negative' && motivational.actionTendency === 'approach') {
      conflicts.push({
        type: 'feeling_motivational_mismatch',
        description: '感受效价与行动倾向不一致',
        example: '感到焦虑但有接近倾向',
        intervention: '探索潜在动机，可能是成长型焦虑'
      });
    }

    // Evaluative vs Motivational 冲突
    if (evaluative.appraisal === 'benign' && motivational.urgency === 'high') {
      conflicts.push({
        type: 'evaluative_motivational_mismatch',
        description: '情境评价与紧迫性不一致',
        example: '认为情境无害但感到高度紧迫',
        intervention: '检查是否存在条件性信念或自动化思维'
      });
    }

    return conflicts;
  }

  /**
   * 生成整合描述
   */
  _generateIntegratedDescription(feeling, evaluative, motivational, weights) {
    const descriptions = [];

    if (weights.feeling > 0.4) {
      descriptions.push(`从感受传统看，这是一个${feeling.experienceQuality}的体验`);
    }

    if (weights.evaluative > 0.4) {
      descriptions.push(`从评价传统看，这涉及对情境的${evaluative.appraisalType}解释`);
    }

    if (weights.motivational > 0.4) {
      descriptions.push(`从动机传统看，这产生了${motivational.actionTendencyType}的行动倾向`);
    }

    if (descriptions.length === 0) {
      descriptions.push('这是一个复杂的体验，三大传统维度相对平衡');
    }

    return descriptions.join('。') + '。';
  }

  /**
   * 计算整合连贯性
   */
  _calculateCoherence(feeling, evaluative, motivational) {
    // 检查三个维度的效价一致性
    const valences = [
      feeling.valence === 'positive' ? 1 : feeling.valence === 'negative' ? -1 : 0,
      evaluative.appraisal === 'positive' ? 1 : evaluative.appraisal === 'negative' ? -1 : 0,
      motivational.valence === 'positive' ? 1 : motivational.valence === 'negative' ? -1 : 0
    ];

    const variance = this._calculateVariance(valences);
    
    return {
      score: 1 - variance, // 方差越小，连贯性越高
      level: variance < 0.3 ? 'high' : variance < 0.6 ? 'moderate' : 'low',
      description: variance < 0.3 
        ? '三个维度高度一致' 
        : variance < 0.6 
        ? '三个维度存在部分不一致' 
        : '三个维度显著不一致，可能需要整合工作'
    };
  }

  /**
   * 计算复杂度
   */
  _calculateComplexity(components) {
    const activeComponents = Object.values(components).filter(c => c.present).length;
    
    return {
      score: activeComponents / 6, // 6 个成分
      level: activeComponents <= 2 ? 'low' : activeComponents <= 4 ? 'moderate' : 'high',
      description: `激活了${activeComponents}/6个情绪成分`
    };
  }

  /**
   * 计算方差
   */
  _calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 生成干预建议
   */
  _generateRecommendations(integration) {
    const recommendations = [];

    // 基于主导传统的建议
    if (integration.dominantTradition.primary === 'feeling') {
      recommendations.push({
        type: 'feeling_focused',
        title: '感受聚焦练习',
        description: '由于感受维度最为突出，建议进行身体扫描和感受命名练习',
        exercises: ['身体扫描冥想', '感受词汇扩展', '感官觉察练习']
      });
    }

    if (integration.dominantTradition.primary === 'evaluative') {
      recommendations.push({
        type: 'cognitive_reframing',
        title: '认知重构练习',
        description: '由于评价维度最为突出，建议进行认知重构和意义探索',
        exercises: ['思维记录表', '替代解释生成', '价值澄清']
      });
    }

    if (integration.dominantTradition.primary === 'motivational') {
      recommendations.push({
        type: 'action_oriented',
        title: '行动导向练习',
        description: '由于动机维度最为突出，建议进行行为实验和行动计划',
        exercises: ['行为激活', '暴露练习', '价值导向行动']
      });
    }

    // 基于冲突的建议
    if (integration.conflicts.length > 0) {
      recommendations.push({
        type: 'integration_work',
        title: '整合工作',
        description: '检测到维度间冲突，建议进行整合对话',
        exercises: integration.conflicts.map(c => c.intervention)
      });
    }

    // 基于连贯性的建议
    if (integration.coherence.level === 'low') {
      recommendations.push({
        type: 'coherence_building',
        title: '连贯性建设',
        description: '三个维度连贯性较低，建议进行情绪整合练习',
        exercises: ['情绪地图绘制', '部分对话 (IFS)', '综合反思日记']
      });
    }

    return recommendations;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'Emotion Traditions Integration',
      version: this.version,
      description: '情绪理论三大传统完整整合模块',
      traditions: ['Feeling', 'Evaluative', 'Motivational'],
      components: ['Physiological', 'Phenomenological', 'Expressive', 'Behavioral', 'Mental'],
      theoreticalBasis: 'SEP Emotion (Stanford Encyclopedia of Philosophy)'
    };
  }
}

module.exports = EmotionTraditionsIntegration;
