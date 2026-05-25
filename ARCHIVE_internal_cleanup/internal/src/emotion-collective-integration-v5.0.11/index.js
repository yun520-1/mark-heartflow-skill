/**
 * 情绪 - 集体意向性整合模块 v5.0.11
 * Emotion-Collective Intentionality Integration Module
 * 
 * 基于 SEP 情绪理论三大传统 + 集体意向性理论深度整合
 * 
 * SEP 理论来源:
 * - Emotion (SEP Entry) - 情绪三大传统整合
 * - Collective Intentionality (SEP Entry) - We-Intention/联合承诺/信任框架
 * - Phenomenology (Scheler 1954, Walther 1923) - 共享体验现象学
 * 
 * 核心理念:
 * 1. 情绪三大传统整合：Feeling + Evaluative + Motivational 三维一体
 * 2. 集体意向性不可还原为个体意图之和
 * 3. 共享情绪体验需要互惠性意识 + 联合承诺 + 信任框架
 * 
 * @version 5.0.11 (HeartFlow v5.0.11)
 * @author HeartFlow Team
 */

const EmotionCollectiveIntegration = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '情绪 - 集体意向性整合',
    version: '5.0.11',
    theory: 'SEP Emotion + Collective Intentionality',
    traditions: [
      'Feeling Tradition (情绪作为体验)',
      'Evaluative Tradition (情绪作为评价)',
      'Motivational Tradition (情绪作为动机)'
    ],
    collectiveConcepts: [
      'We-Intention (集体意图)',
      'Joint Commitment (联合承诺)',
      'Trust Framework (信任框架)',
      'Shared Emotion (共享情绪)'
    ]
  },

  /**
   * 配置参数
   */
  config: {
    // 情绪三大传统权重
    traditionWeights: {
      feeling: 0.35,
      evaluative: 0.35,
      motivational: 0.30
    },
    
    // 集体意向性阈值
    collectiveThresholds: {
      weIntentionMin: 0.6,
      jointCommitmentMin: 0.5,
      trustMin: 0.4,
      sharedEmotionMin: 0.7
    },
    
    // 互惠性意识层级 (Walther 1923)
    reciprocityLevels: {
      level1: '体验 x',                    // A 体验 x
      level2: '共情体验',                   // A 共情 B 的体验
      level3: '认同体验',                   // A 认同 B 的体验
      level4: '互惠意识'                    // A 意识到 B 也认同 A
    }
  },

  /**
   * ============================================
   * 情绪三大传统整合评估
   * ============================================
   */

  /**
   * 综合评估情绪的三大传统维度
   * @param {Object} emotionData - 情绪数据
   * @returns {Object} 三大传统维度评估结果
   */
  assessEmotionTraditions(emotionData) {
    const {
      emotionType = '未知',
      feelingIntensity = 0,
      evaluativeContent = {},
      motivationalTendency = {}
    } = emotionData;

    // 1. Feeling Tradition: 情绪作为独特的意识体验
    const feelingScore = this.assessFeelingTradition({
      emotionType,
      intensity: feelingIntensity,
      phenomenology: emotionData.phenomenology || {}
    });

    // 2. Evaluative Tradition: 情绪作为对情境的评价
    const evaluativeScore = this.assessEvaluativeTradition({
      emotionType,
      evaluativeContent,
      appraisalDimensions: emotionData.appraisal || {}
    });

    // 3. Motivational Tradition: 情绪作为动机状态
    const motivationalScore = this.assessMotivationalTradition({
      emotionType,
      motivationalTendency,
      actionReadiness: emotionData.actionReadiness || {}
    });

    // 整合三大传统
    const integratedScore = {
      feeling: feelingScore,
      evaluative: evaluativeScore,
      motivational: motivationalScore,
      integrated: this.calculateIntegratedScore(feelingScore, evaluativeScore, motivationalScore),
      traditionProfile: this.getTraditionProfile(feelingScore, evaluativeScore, motivationalScore)
    };

    return integratedScore;
  },

  /**
   * Feeling Tradition 评估 - 情绪作为意识体验
   * 理论来源：James-Lange, 现象学情绪理论
   */
  assessFeelingTradition({ emotionType, intensity, phenomenology }) {
    const scores = {
      // 体验强度 (0-1)
      intensity: Math.min(intensity / 10, 1.0),
      
      // 体验清晰度 (0-1)
      clarity: phenomenology.clarity || 0.5,
      
      // 身体感受成分 (0-1)
      bodilyComponent: phenomenology.bodilySensations ? 
        Math.min(phenomenology.bodilySensations.length * 0.2, 1.0) : 0.3,
      
      // 第一人称给定性 (0-1) - 现象学核心
      firstPersonGivenness: this.assessFirstPersonGivenness(phenomenology)
    };

    // Feeling Tradition 综合得分
    const totalScore = (
      scores.intensity * 0.3 +
      scores.clarity * 0.25 +
      scores.bodilyComponent * 0.25 +
      scores.firstPersonGivenness * 0.2
    );

    return {
      tradition: 'Feeling',
      totalScore,
      subScores: scores,
      description: this.getFeelingDescription(emotionType, totalScore)
    };
  },

  /**
   * 评估第一人称给定性 (First-Person Givenness)
   * 现象学核心概念：Husserl, Zahavi
   */
  assessFirstPersonGivenness(phenomenology) {
    const indicators = {
      // 直接性：体验是否直接呈现
      immediacy: phenomenology.immediacy || 0.5,
      
      // 非对象化：自我是否作为体验主体而非客体
      nonObjectifying: phenomenology.nonObjectifyingAwareness || 0.5,
      
      // 厚度：体验的丰富程度
      thickness: phenomenology.experientialThickness || 0.5
    };

    return (indicators.immediacy + indicators.nonObjectifying + indicators.thickness) / 3;
  },

  /**
   * Evaluative Tradition 评估 - 情绪作为评价
   * 理论来源：评价理论 (Appraisal Theory), 认知评价
   */
  assessEvaluativeTradition({ emotionType, evaluativeContent, appraisalDimensions }) {
    const scores = {
      // 效价评价 (正面/负面)
      valence: evaluativeContent.valence !== undefined ? 
        (evaluativeContent.valence > 0 ? 1 : 0) : 0.5,
      
      // 目标相关性
      goalRelevance: appraisalDimensions.goalRelevance || 0.5,
      
      // 目标一致性
      goalCongruence: appraisalDimensions.goalCongruence || 0.5,
      
      // 责任归属
      accountability: appraisalDimensions.accountability || 0.5,
      
      // 应对潜力
      copingPotential: appraisalDimensions.copingPotential || 0.5,
      
      // 规范性评价 (恰当性)
      normativeAppropriateness: evaluativeContent.normativeAppropriateness || 0.5
    };

    // Evaluative Tradition 综合得分
    const totalScore = (
      scores.valence * 0.15 +
      scores.goalRelevance * 0.2 +
      scores.goalCongruence * 0.2 +
      scores.accountability * 0.15 +
      scores.copingPotential * 0.15 +
      scores.normativeAppropriateness * 0.15
    );

    return {
      tradition: 'Evaluative',
      totalScore,
      subScores: scores,
      description: this.getEvaluativeDescription(emotionType, totalScore)
    };
  },

  /**
   * Motivational Tradition 评估 - 情绪作为动机
   * 理论来源：动机理论，行动倾向理论
   */
  assessMotivationalTradition({ emotionType, motivationalTendency, actionReadiness }) {
    const scores = {
      // 行动倾向强度
      actionTendencyStrength: motivationalTendency.strength || 0.5,
      
      // 行动方向 (趋近/回避)
      actionDirection: motivationalTendency.direction ? 
        (motivationalTendency.direction === 'approach' ? 1 : 0) : 0.5,
      
      // 行动准备度
      actionReadiness: actionReadiness.readiness || 0.5,
      
      // 动机清晰度
      motivationalClarity: motivationalTendency.clarity || 0.5,
      
      // 目标指向性
      goalDirectedness: actionReadiness.goalDirectedness || 0.5
    };

    // Motivational Tradition 综合得分
    const totalScore = (
      scores.actionTendencyStrength * 0.25 +
      scores.actionDirection * 0.15 +
      scores.actionReadiness * 0.25 +
      scores.motivationalClarity * 0.15 +
      scores.goalDirectedness * 0.2
    );

    return {
      tradition: 'Motivational',
      totalScore,
      subScores: scores,
      description: this.getMotivationalDescription(emotionType, totalScore)
    };
  },

  /**
   * 计算整合得分
   */
  calculateIntegratedScore(feeling, evaluative, motivational) {
    const weights = this.config.traditionWeights;
    
    const integrated = {
      totalScore: (
        feeling.totalScore * weights.feeling +
        evaluative.totalScore * weights.evaluative +
        motivational.totalScore * weights.motivational
      ),
      
      balance: this.calculateBalance(feeling.totalScore, evaluative.totalScore, motivational.totalScore),
      
      dominantTradition: this.getDominantTradition(feeling, evaluative, motivational),
      
      integrationQuality: this.assessIntegrationQuality(feeling, evaluative, motivational)
    };

    return integrated;
  },

  /**
   * 计算三大传统的平衡度
   */
  calculateBalance(feeling, evaluative, motivational) {
    const scores = [feeling, evaluative, motivational];
    const mean = scores.reduce((a, b) => a + b, 0) / 3;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / 3;
    const stdDev = Math.sqrt(variance);
    
    // 平衡度：标准差越小越平衡 (0-1, 1 为完全平衡)
    const balance = Math.max(0, 1 - stdDev * 2);
    
    return {
      score: balance,
      mean,
      stdDev,
      interpretation: balance > 0.8 ? '高度平衡' : balance > 0.5 ? '中度平衡' : '不平衡'
    };
  },

  /**
   * 获取主导传统
   */
  getDominantTradition(feeling, evaluative, motivational) {
    const traditions = [
      { name: 'Feeling', score: feeling.totalScore },
      { name: 'Evaluative', score: evaluative.totalScore },
      { name: 'Motivational', score: motivational.totalScore }
    ];
    
    traditions.sort((a, b) => b.score - a.score);
    return traditions[0].name;
  },

  /**
   * 评估整合质量
   */
  assessIntegrationQuality(feeling, evaluative, motivational) {
    const scores = [feeling.totalScore, evaluative.totalScore, motivational.totalScore];
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;
    
    // 整合质量：三个维度都有一定强度且差异不大
    const quality = minScore > 0.4 && range < 0.3 ? 'high' : 
                    minScore > 0.2 && range < 0.5 ? 'medium' : 'low';
    
    return {
      level: quality,
      minDimension: minScore,
      range,
      recommendation: this.getIntegrationRecommendation(quality, feeling, evaluative, motivational)
    };
  },

  /**
   * ============================================
   * 集体意向性评估
   * ============================================
   */

  /**
   * 评估集体意向性程度
   * @param {Object} collectiveData - 集体情境数据
   * @returns {Object} 集体意向性评估结果
   */
  assessCollectiveIntentionality(collectiveData) {
    const {
      participants = [],
      sharedGoal = {},
      interactionPattern = {},
      emotionalClimate = {}
    } = collectiveData;

    // 1. We-Intention 检测
    const weIntention = this.detectWeIntention({
      participants,
      sharedGoal,
      languageMarkers: collectiveData.languageMarkers || {}
    });

    // 2. 联合承诺评估
    const jointCommitment = this.assessJointCommitment({
      participants,
      commitmentSignals: collectiveData.commitmentSignals || {},
      normativeExpectations: collectiveData.normativeExpectations || {}
    });

    // 3. 信任框架分析
    const trustFramework = this.analyzeTrustFramework({
      participants,
      trustSignals: collectiveData.trustSignals || {},
      interdependence: collectiveData.interdependence || {}
    });

    // 4. 共享情绪体验评估 (Scheler 1954, Walther 1923)
    const sharedEmotion = this.assessSharedEmotion({
      emotionalClimate,
      reciprocityLevel: collectiveData.reciprocityLevel || 0,
      mutualAwareness: collectiveData.mutualAwareness || {}
    });

    // 整合集体意向性评估
    const collectiveAssessment = {
      weIntention,
      jointCommitment,
      trustFramework,
      sharedEmotion,
      overall: this.calculateCollectiveOverall(weIntention, jointCommitment, trustFramework, sharedEmotion)
    };

    return collectiveAssessment;
  },

  /**
   * We-Intention 检测器
   * 基于 Searle, Bratman, Gilbert 理论
   */
  detectWeIntention({ participants, sharedGoal, languageMarkers }) {
    // 语言标记分析 (Searle)
    const linguisticScore = this.analyzeWeLanguage(languageMarkers);
    
    // 目标共享度
    const goalSharingScore = this.assessGoalSharing(sharedGoal, participants);
    
    // 相互依赖性
    const interdependenceScore = this.assessInterdependence(participants);
    
    // We-Intention 综合得分
    const totalScore = (
      linguisticScore * 0.3 +
      goalSharingScore * 0.4 +
      interdependenceScore * 0.3
    );

    const isWeIntention = totalScore >= this.config.collectiveThresholds.weIntentionMin;

    return {
      isWeIntention,
      totalScore,
      subScores: {
        linguistic: linguisticScore,
        goalSharing: goalSharingScore,
        interdependence: interdependenceScore
      },
      type: this.classifyWeIntentionType(totalScore, linguisticScore, goalSharingScore),
      description: isWeIntention ? 
        '检测到集体意图：参与者共享"我们"的视角' : 
        '个体意图集合：未检测到真正的集体意图'
    };
  },

  /**
   * 分析"我们"语言标记
   */
  analyzeWeLanguage(languageMarkers) {
    const wePronouns = languageMarkers.wePronouns || 0;      // 我们/咱们的使用频率
    const sharedVerbs = languageMarkers.sharedVerbs || 0;     // 一起做/共同等动词
    const collectiveNouns = languageMarkers.collectiveNouns || 0; // 团队/集体等名词
    
    const total = wePronouns + sharedVerbs + collectiveNouns;
    if (total === 0) return 0.3; // 默认值
    
    // 归一化到 0-1
    return Math.min(total / 10, 1.0);
  },

  /**
   * 评估目标共享度
   */
  assessGoalSharing(sharedGoal, participants) {
    if (!sharedGoal || !sharedGoal.description) return 0.2;
    
    const factors = {
      // 目标明确性
      clarity: sharedGoal.clarity || 0.5,
      
      // 参与者认同度
      participantAgreement: participants.length > 0 ? 
        (sharedGoal.agreedByParticipants || 0.5) : 0.3,
      
      // 目标具体性
      specificity: sharedGoal.specificity || 0.5
    };
    
    return (factors.clarity + factors.participantAgreement + factors.specificity) / 3;
  },

  /**
   * 评估相互依赖性
   */
  assessInterdependence(participants) {
    if (participants.length < 2) return 0.1;
    
    // 参与者之间的依赖关系
    const dependencies = participants.filter(p => p.dependsOnOthers).length;
    const dependencyRatio = dependencies / participants.length;
    
    return Math.min(dependencyRatio * 1.5, 1.0);
  },

  /**
   * 分类 We-Intention 类型
   */
  classifyWeIntentionType(totalScore, linguisticScore, goalSharingScore) {
    if (totalScore < 0.4) return 'none';
    if (totalScore < 0.6) return 'weak';
    if (linguisticScore > goalSharingScore) return 'linguistic-dominant';
    if (goalSharingScore > linguisticScore) return 'goal-dominant';
    return 'balanced';
  },

  /**
   * 联合承诺评估 (Gilbert 1990, Bratman 1999)
   */
  assessJointCommitment({ participants, commitmentSignals, normativeExpectations }) {
    // 承诺信号检测
    const commitmentSignalsScore = this.detectCommitmentSignals(commitmentSignals);
    
    // 规范性期望
    const normativeExpectationsScore = this.assessNormativeExpectations(normativeExpectations);
    
    // 相互承诺度
    const mutualCommitmentScore = this.assessMutualCommitment(participants);
    
    const totalScore = (
      commitmentSignalsScore * 0.35 +
      normativeExpectationsScore * 0.35 +
      mutualCommitmentScore * 0.3
    );

    const hasJointCommitment = totalScore >= this.config.collectiveThresholds.jointCommitmentMin;

    return {
      hasJointCommitment,
      totalScore,
      subScores: {
        signals: commitmentSignalsScore,
        normative: normativeExpectationsScore,
        mutual: mutualCommitmentScore
      },
      commitmentType: this.classifyCommitmentType(totalScore),
      description: hasJointCommitment ?
        '检测到联合承诺：参与者相互承担规范性义务' :
        '未检测到联合承诺：缺乏明确的相互承诺'
    };
  },

  /**
   * 检测承诺信号
   */
  detectCommitmentSignals(signals) {
    const indicators = {
      explicitPromises: signals.explicitPromises || 0,        // 明确承诺
      implicitAgreements: signals.implicitAgreements || 0,     // 隐性协议
      pastReliability: signals.pastReliability || 0.5,         // 过去可靠性
      sacrificeSignals: signals.sacrificeSignals || 0          // 牺牲信号
    };
    
    const total = (
      indicators.explicitPromises * 0.3 +
      indicators.implicitAgreements * 0.2 +
      indicators.pastReliability * 0.3 +
      Math.min(indicators.sacrificeSignals * 0.2, 0.2)
    );
    
    return Math.min(total, 1.0);
  },

  /**
   * 评估规范性期望
   */
  assessNormativeExpectations(expectations) {
    const factors = {
      // 期望明确性
      explicitness: expectations.explicitness || 0.5,
      
      // 相互性
      reciprocity: expectations.reciprocity || 0.5,
      
      // 约束力感知
      bindingForce: expectations.bindingForce || 0.5
    };
    
    return (factors.explicitness + factors.reciprocity + factors.bindingForce) / 3;
  },

  /**
   * 评估相互承诺度
   */
  assessMutualCommitment(participants) {
    if (participants.length < 2) return 0.2;
    
    // 每个参与者对集体的承诺度
    const commitmentLevels = participants.map(p => p.commitmentToGroup || 0.5);
    const avgCommitment = commitmentLevels.reduce((a, b) => a + b, 0) / commitmentLevels.length;
    
    // 承诺的一致性 (标准差越小越一致)
    const variance = commitmentLevels.reduce((sum, c) => sum + Math.pow(c - avgCommitment, 2), 0) / commitmentLevels.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) * 2);
    
    return (avgCommitment + consistency) / 2;
  },

  /**
   * 分类承诺类型
   */
  classifyCommitmentType(score) {
    if (score < 0.3) return 'none';
    if (score < 0.5) return 'weak';
    if (score < 0.7) return 'moderate';
    return 'strong';
  },

  /**
   * 信任框架分析 (Schmid 2013)
   */
  analyzeTrustFramework({ participants, trustSignals, interdependence }) {
    // 信任信号检测
    const trustSignalsScore = this.detectTrustSignals(trustSignals);
    
    // 相互依赖性分析
    const interdependenceScore = this.analyzeInterdependence(interdependence);
    
    // 脆弱性接受度
    const vulnerabilityScore = this.assessVulnerabilityAcceptance(participants);
    
    const totalScore = (
      trustSignalsScore * 0.35 +
      interdependenceScore * 0.35 +
      vulnerabilityScore * 0.3
    );

    const trustLevel = this.classifyTrustLevel(totalScore);

    return {
      totalScore,
      trustLevel,
      subScores: {
        signals: trustSignalsScore,
        interdependence: interdependenceScore,
        vulnerability: vulnerabilityScore
      },
      trustType: this.classifyTrustType(trustSignalsScore, interdependenceScore),
      description: this.getTrustDescription(trustLevel)
    };
  },

  /**
   * 检测信任信号
   */
  detectTrustSignals(signals) {
    const indicators = {
      transparency: signals.transparency || 0.5,        // 透明度
      reliability: signals.reliability || 0.5,          // 可靠性
      benevolence: signals.benevolence || 0.5,          // 善意
      competence: signals.competence || 0.5             // 能力
    };
    
    return (indicators.transparency + indicators.reliability + 
            indicators.benevolence + indicators.competence) / 4;
  },

  /**
   * 分析相互依赖性
   */
  analyzeInterdependence(interdependence) {
    const factors = {
      // 资源依赖
      resourceDependence: interdependence.resourceDependence || 0.5,
      
      // 情感依赖
      emotionalDependence: interdependence.emotionalDependence || 0.5,
      
      // 目标依赖
      goalDependence: interdependence.goalDependence || 0.5,
      
      // 对称性
      symmetry: interdependence.symmetry || 0.5
    };
    
    return (factors.resourceDependence + factors.emotionalDependence + 
            factors.goalDependence + factors.symmetry) / 4;
  },

  /**
   * 评估脆弱性接受度
   */
  assessVulnerabilityAcceptance(participants) {
    if (participants.length === 0) return 0.3;
    
    // 参与者展现脆弱性的程度
    const vulnerabilityLevels = participants.map(p => p.vulnerabilityAcceptance || 0.5);
    return vulnerabilityLevels.reduce((a, b) => a + b, 0) / vulnerabilityLevels.length;
  },

  /**
   * 分类信任水平
   */
  classifyTrustLevel(score) {
    if (score < 0.3) return 'very-low';
    if (score < 0.5) return 'low';
    if (score < 0.7) return 'moderate';
    if (score < 0.85) return 'high';
    return 'very-high';
  },

  /**
   * 分类信任类型
   */
  classifyTrustType(signalsScore, interdependenceScore) {
    if (signalsScore > interdependenceScore * 1.3) return 'cognitive-trust';
    if (interdependenceScore > signalsScore * 1.3) return 'dependency-trust';
    return 'balanced-trust';
  },

  /**
   * 获取信任描述
   */
  getTrustDescription(level) {
    const descriptions = {
      'very-low': '信任度极低：需要建立基本信任框架',
      'low': '信任度较低：需要增强透明度和可靠性',
      'moderate': '信任度中等：基础信任已建立，可深化',
      'high': '信任度较高：健康的信任关系',
      'very-high': '信任度很高：深度信任关系'
    };
    return descriptions[level] || '未知信任水平';
  },

  /**
   * 共享情绪体验评估 (Scheler 1954, Walther 1923)
   */
  assessSharedEmotion({ emotionalClimate, reciprocityLevel, mutualAwareness }) {
    // 情绪一致性
    const emotionConsistency = this.assessEmotionConsistency(emotionalClimate);
    
    // 互惠性意识层级 (Walther)
    const reciprocityScore = this.assessReciprocityLevel(reciprocityLevel, mutualAwareness);
    
    // 共享体验质量
    const sharedQuality = this.assessSharedExperienceQuality(emotionalClimate, mutualAwareness);
    
    const totalScore = (
      emotionConsistency * 0.35 +
      reciprocityScore * 0.35 +
      sharedQuality * 0.3
    );

    const isSharedEmotion = totalScore >= this.config.collectiveThresholds.sharedEmotionMin;

    return {
      isSharedEmotion,
      totalScore,
      subScores: {
        consistency: emotionConsistency,
        reciprocity: reciprocityScore,
        quality: sharedQuality
      },
      sharedType: this.classifySharedEmotionType(totalScore, reciprocityScore),
      phenomenologicalDepth: this.assessPhenomenologicalDepth(reciprocityLevel),
      description: isSharedEmotion ?
        '检测到共享情绪体验：参与者共同经历同一情绪' :
        '平行情绪：参与者有相似情绪但未真正共享'
    };
  },

  /**
   * 评估情绪一致性
   */
  assessEmotionConsistency(climate) {
    if (!climate || !climate.participantEmotions || climate.participantEmotions.length < 2) {
      return 0.3;
    }
    
    const emotions = climate.participantEmotions;
    
    // 计算情绪类型一致性
    const emotionTypes = emotions.map(e => e.type);
    const uniqueTypes = new Set(emotionTypes);
    const typeConsistency = 1 - (uniqueTypes.size - 1) / emotions.length;
    
    // 计算情绪强度一致性
    const intensities = emotions.map(e => e.intensity || 5);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const intensityVariance = intensities.reduce((sum, i) => sum + Math.pow(i - avgIntensity, 2), 0) / intensities.length;
    const intensityConsistency = Math.max(0, 1 - Math.sqrt(intensityVariance) / 5);
    
    return (typeConsistency + intensityConsistency) / 2;
  },

  /**
   * 评估互惠性意识层级 (Walther 1923)
   */
  assessReciprocityLevel(level, mutualAwareness) {
    // Walther 的四层互惠性
    const levelScores = {
      0: 0.2,  // 无互惠
      1: 0.4,  // level1: A 体验 x
      2: 0.6,  // level2: A 共情 B 的体验
      3: 0.8,  // level3: A 认同 B 的体验
      4: 1.0   // level4: 互惠意识
    };
    
    const baseScore = levelScores[level] || 0.5;
    
    // 相互意识增强
    const awarenessBonus = (
      (mutualAwareness.level1Aware ? 0.05 : 0) +
      (mutualAwareness.level2Aware ? 0.1 : 0) +
      (mutualAwareness.level3Aware ? 0.1 : 0) +
      (mutualAwareness.level4Aware ? 0.15 : 0)
    );
    
    return Math.min(baseScore + awarenessBonus, 1.0);
  },

  /**
   * 评估共享体验质量
   */
  assessSharedExperienceQuality(climate, mutualAwareness) {
    const factors = {
      // 共同关注
      jointAttention: climate.jointAttention || 0.5,
      
      // 体验同步性
      synchrony: climate.synchrony || 0.5,
      
      // 相互确认
      mutualValidation: mutualAwareness.validation || 0.5,
      
      // 体验深度
      depth: climate.depth || 0.5
    };
    
    return (factors.jointAttention + factors.synchrony + 
            factors.mutualValidation + factors.depth) / 4;
  },

  /**
   * 分类共享情绪类型
   */
  classifySharedEmotionType(totalScore, reciprocityScore) {
    if (totalScore < 0.5) return 'parallel-emotion';
    if (reciprocityScore < 0.6) return 'contagion';
    if (reciprocityScore < 0.8) return 'empathetic-sharing';
    return 'full-communal';
  },

  /**
   * 评估现象学深度
   */
  assessPhenomenologicalDepth(level) {
    const depths = {
      0: '无共享体验',
      1: '个体体验并行',
      2: '共情式体验',
      3: '认同性体验',
      4: '真正的共享体验 (Scheler/Walther)'
    };
    return depths[level] || '未知深度';
  },

  /**
   * 计算集体意向性总体评估
   */
  calculateCollectiveOverall(weIntention, jointCommitment, trustFramework, sharedEmotion) {
    const scores = {
      weIntention: weIntention.totalScore,
      jointCommitment: jointCommitment.totalScore,
      trust: trustFramework.totalScore,
      sharedEmotion: sharedEmotion.totalScore
    };
    
    const totalScore = (
      scores.weIntention * 0.3 +
      scores.jointCommitment * 0.25 +
      scores.trust * 0.25 +
      scores.sharedEmotion * 0.2
    );
    
    const collectiveLevel = this.classifyCollectiveLevel(totalScore);
    
    return {
      totalScore,
      collectiveLevel,
      subScores: scores,
      profile: this.getCollectiveProfile(scores),
      recommendations: this.getCollectiveRecommendations(scores, collectiveLevel)
    };
  },

  /**
   * 分类集体意向性水平
   */
  classifyCollectiveLevel(score) {
    if (score < 0.3) return 'aggregated-individuals';
    if (score < 0.5) return 'weak-collective';
    if (score < 0.7) return 'moderate-collective';
    if (score < 0.85) return 'strong-collective';
    return 'deep-communion';
  },

  /**
   * 获取集体意向性概况
   */
  getCollectiveProfile(scores) {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const strongest = entries[0][0];
    const weakest = entries[entries.length - 1][0];
    
    return {
      strongestDimension: strongest,
      weakestDimension: weakest,
      balance: this.calculateDimensionBalance(scores)
    };
  },

  /**
   * 计算维度平衡度
   */
  calculateDimensionBalance(scores) {
    const values = Object.values(scores);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: Math.max(0, 1 - stdDev * 2),
      interpretation: stdDev < 0.1 ? '高度平衡' : stdDev < 0.2 ? '中度平衡' : '不平衡'
    };
  },

  /**
   * 获取集体意向性建议
   */
  getCollectiveRecommendations(scores, level) {
    const recommendations = [];
    
    if (scores.weIntention < 0.6) {
      recommendations.push('增强"我们"意识：使用更多集体语言，强调共同目标');
    }
    if (scores.jointCommitment < 0.5) {
      recommendations.push('建立联合承诺：明确相互期望和义务');
    }
    if (scores.trust < 0.5) {
      recommendations.push('培养信任：增强透明度、可靠性和善意表达');
    }
    if (scores.sharedEmotion < 0.7) {
      recommendations.push('深化共享体验：促进共情和相互确认');
    }
    
    if (level === 'aggregated-individuals') {
      recommendations.push('当前为个体集合状态，需要从基础建立集体意识');
    }
    
    return recommendations;
  },

  /**
   * ============================================
   * 整合应用：情绪 - 集体意向性交叉分析
   * ============================================
   */

  /**
   * 情绪 - 集体意向性交叉分析
   * @param {Object} emotionData - 情绪数据
   * @param {Object} collectiveData - 集体情境数据
   * @returns {Object} 交叉分析结果
   */
  crossAnalyze(emotionData, collectiveData) {
    // 分别评估
    const emotionAssessment = this.assessEmotionTraditions(emotionData);
    const collectiveAssessment = this.assessCollectiveIntentionality(collectiveData);
    
    // 交叉分析
    const crossAnalysis = {
      emotionProfile: emotionAssessment,
      collectiveProfile: collectiveAssessment,
      
      // 情绪对集体意向性的影响
      emotionImpactOnCollective: this.analyzeEmotionImpactOnCollective(emotionAssessment, collectiveAssessment),
      
      // 集体意向性对情绪的影响
      collectiveImpactOnEmotion: this.analyzeCollectiveImpactOnEmotion(emotionAssessment, collectiveAssessment),
      
      // 整合建议
      integratedRecommendations: this.generateIntegratedRecommendations(emotionAssessment, collectiveAssessment)
    };
    
    return crossAnalysis;
  },

  /**
   * 分析情绪对集体意向性的影响
   */
  analyzeEmotionImpactOnCollective(emotionAssessment, collectiveAssessment) {
    const emotionIntegration = emotionAssessment.integrated;
    const collectiveOverall = collectiveAssessment.overall;
    
    // 情绪整合度高 → 促进集体意向性
    const facilitationScore = emotionIntegration.totalScore * 0.5 + 
                              emotionIntegration.balance.score * 0.3 +
                              (emotionIntegration.dominantTradition === 'Motivational' ? 0.2 : 0);
    
    return {
      facilitationScore,
      interpretation: facilitationScore > 0.7 ? '情绪状态显著促进集体意向性' :
                      facilitationScore > 0.5 ? '情绪状态中性影响集体意向性' :
                      '情绪状态可能阻碍集体意向性发展',
      keyFactors: this.identifyEmotionKeyFactors(emotionAssessment)
    };
  },

  /**
   * 分析集体意向性对情绪的影响
   */
  analyzeCollectiveImpactOnEmotion(emotionAssessment, collectiveAssessment) {
    const collectiveLevel = collectiveAssessment.overall.collectiveLevel;
    
    // 集体意向性水平 → 影响情绪体验
    const impactMap = {
      'deep-communion': { intensity: 'enhanced', quality: 'shared', stability: 'high' },
      'strong-collective': { intensity: 'moderate-enhanced', quality: 'shared', stability: 'moderate-high' },
      'moderate-collective': { intensity: 'normal', quality: 'partially-shared', stability: 'moderate' },
      'weak-collective': { intensity: 'variable', quality: 'individual', stability: 'low-moderate' },
      'aggregated-individuals': { intensity: 'individual', quality: 'parallel', stability: 'variable' }
    };
    
    return {
      impact: impactMap[collectiveLevel] || impactMap['aggregated-individuals'],
      collectiveLevel,
      interpretation: this.getCollectiveImpactInterpretation(collectiveLevel)
    };
  },

  /**
   * 识别情绪关键因素
   */
  identifyEmotionKeyFactors(emotionAssessment) {
    const factors = [];
    
    if (emotionAssessment.integrated.balance.score < 0.5) {
      factors.push('情绪三大传统不平衡');
    }
    if (emotionAssessment.integrated.integrationQuality.level === 'low') {
      factors.push('情绪整合质量低');
    }
    if (emotionAssessment.integrated.dominantTradition === 'Feeling') {
      factors.push('体验主导型情绪');
    } else if (emotionAssessment.integrated.dominantTradition === 'Evaluative') {
      factors.push('评价主导型情绪');
    } else if (emotionAssessment.integrated.dominantTradition === 'Motivational') {
      factors.push('动机主导型情绪');
    }
    
    return factors;
  },

  /**
   * 获取集体影响解释
   */
  getCollectiveImpactInterpretation(level) {
    const interpretations = {
      'deep-communion': '深度共融状态：情绪体验被集体显著增强和稳定化',
      'strong-collective': '强集体状态：情绪具有明显的共享特质',
      'moderate-collective': '中等集体状态：情绪部分共享，部分个体化',
      'weak-collective': '弱集体状态：情绪主要是个体体验',
      'aggregated-individuals': '个体集合状态：情绪完全是个体化的平行体验'
    };
    return interpretations[level] || '未知集体水平';
  },

  /**
   * 生成整合建议
   */
  generateIntegratedRecommendations(emotionAssessment, collectiveAssessment) {
    const recommendations = [];
    
    // 基于情绪评估的建议
    if (emotionAssessment.integrated.balance.score < 0.6) {
      recommendations.push({
        domain: '情绪整合',
        priority: 'high',
        suggestion: '平衡情绪三大传统：同时关注体验、评价和动机维度'
      });
    }
    
    // 基于集体意向性的建议
    collectiveAssessment.overall.recommendations.forEach(rec => {
      recommendations.push({
        domain: '集体意向性',
        priority: 'medium',
        suggestion: rec
      });
    });
    
    // 交叉建议
    if (emotionAssessment.integrated.totalScore > 0.7 && 
        collectiveAssessment.overall.totalScore < 0.5) {
      recommendations.push({
        domain: '交叉整合',
        priority: 'high',
        suggestion: '个人情绪状态良好但集体意识薄弱：将个人情绪能量导向集体目标'
      });
    }
    
    if (collectiveAssessment.overall.totalScore > 0.7 && 
        emotionAssessment.integrated.totalScore < 0.5) {
      recommendations.push({
        domain: '交叉整合',
        priority: 'high',
        suggestion: '集体氛围良好但个人情绪整合不足：利用集体支持深化个人情绪觉察'
      });
    }
    
    return recommendations;
  },

  /**
   * ============================================
   * 工具函数
   * ============================================
   */

  /**
   * 获取 Feeling Tradition 描述
   */
  getFeelingDescription(emotionType, score) {
    if (score > 0.8) return `${emotionType} 的体验非常清晰和强烈，具有高度的第一人称给定性`;
    if (score > 0.6) return `${emotionType} 的体验较为清晰，身体感受成分明显`;
    if (score > 0.4) return `${emotionType} 的体验中等清晰，可能需要更多身体觉察`;
    return `${emotionType} 的体验较为模糊，建议增强身体感受的觉察`;
  },

  /**
   * 获取 Evaluative Tradition 描述
   */
  getEvaluativeDescription(emotionType, score) {
    if (score > 0.8) return `对${emotionType} 的评价维度高度分化，认知评价清晰`;
    if (score > 0.6) return `对${emotionType} 有较好的认知评价，目标相关性明确`;
    if (score > 0.4) return `对${emotionType} 的评价中等，可进一步澄清评价内容`;
    return `对${emotionType} 的评价较为模糊，建议探索情绪背后的评价信念`;
  },

  /**
   * 获取 Motivational Tradition 描述
   */
  getMotivationalDescription(emotionType, score) {
    if (score > 0.8) return `${emotionType} 的行动倾向非常明确，动机清晰`;
    if (score > 0.6) return `${emotionType} 有明显的行动倾向，目标指向性较好`;
    if (score > 0.4) return `${emotionType} 的行动倾向中等，可进一步澄清行动方向`;
    return `${emotionType} 的行动倾向较为模糊，建议探索情绪背后的动机需求`;
  },

  /**
   * 获取传统概况
   */
  getTraditionProfile(feeling, evaluative, motivational) {
    const scores = [
      { name: 'Feeling', score: feeling.totalScore },
      { name: 'Evaluative', score: evaluative.totalScore },
      { name: 'Motivational', score: motivational.totalScore }
    ];
    
    scores.sort((a, b) => b.score - a.score);
    
    return {
      dominant: scores[0].name,
      secondary: scores[1].name,
      tertiary: scores[2].name,
      pattern: this.identifyTraditionPattern(scores)
    };
  },

  /**
   * 识别传统模式
   */
  identifyTraditionPattern(scores) {
    const [first, second, third] = scores;
    const gap1 = first.score - second.score;
    const gap2 = second.score - third.score;
    
    if (gap1 > 0.3) return `${first.name}-dominant`;
    if (gap2 < 0.1) return 'balanced';
    if (first.score > 0.7 && third.score < 0.3) return 'polarized';
    return 'differentiated';
  },

  /**
   * 获取整合建议
   */
  getIntegrationRecommendation(quality, feeling, evaluative, motivational) {
    if (quality === 'high') {
      return '情绪整合质量高，三大传统协调发展';
    }
    if (quality === 'medium') {
      const weakest = [feeling, evaluative, motivational].sort((a, b) => a.totalScore - b.totalScore)[0];
      return `建议加强${weakest.tradition}维度的觉察和表达`;
    }
    
    const scores = [
      { name: 'Feeling', score: feeling.totalScore },
      { name: 'Evaluative', score: evaluative.totalScore },
      { name: 'Motivational', score: motivational.totalScore }
    ];
    const weakest = scores.sort((a, b) => a.score - b.score)[0];
    const strongest = scores.sort((a, b) => b.score - a.score)[0];
    
    return `情绪整合质量较低：${weakest.name}维度 (${weakest.score.toFixed(2)}) 显著弱于 ${strongest.name}维度 (${strongest.score.toFixed(2)})，需要重点关注`;
  }
};

module.exports = EmotionCollectiveIntegration;
