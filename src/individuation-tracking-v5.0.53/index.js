/**
 * 个体化过程追踪系统 v5.0.53
 * 基于荣格分析心理学个体化理论
 * 
 * 核心功能:
 * - 个体化阶段评估
 * - 人格面具识别与解离
 * - 阴影整合进度追踪
 * - 阿尼玛/阿尼姆斯对话记录
 * - 自性化里程碑检测
 */

class IndividuationTrackingModule {
  constructor() {
    this.name = 'individuation-tracking-v5.0.53';
    this.version = '5.0.53';
    this.theoryBase = 'Jung-Individuation';
    this.integrationLevel = 0.87; // 87%
    
    // 个体化阶段
    this.stages = {
      persona: new PersonaStage(),        // 人格面具阶段
      shadow: new ShadowStage(),          // 阴影阶段
      animaAnimus: new AnimaAnimusStage(), // 阿尼玛/阿尼姆斯阶段
      self: new SelfStage()               // 自性阶段
    };
    
    // 个体化指标追踪
    this.individuationMetrics = {
      stage: 'persona', // 当前阶段
      progress: {},     // 各阶段进度
      milestones: [],   // 达成的里程碑
      challenges: []    // 当前挑战
    };
  }
  
  /**
   * 评估个体化阶段
   * @param {Object} userProfile - 用户心理档案
   * @returns {Object} 个体化评估结果
   */
  assessIndividuationStage(userProfile) {
    const personaAssessment = this.stages.persona.assess(userProfile);
    const shadowAssessment = this.stages.shadow.assess(userProfile);
    const animaAnimusAssessment = this.stages.animaAnimus.assess(userProfile);
    const selfAssessment = this.stages.self.assess(userProfile);
    
    const currentStage = this.determineCurrentStage({
      persona: personaAssessment,
      shadow: shadowAssessment,
      animaAnimus: animaAnimusAssessment,
      self: selfAssessment
    });
    
    return {
      currentStage,
      stageAssessments: {
        persona: personaAssessment,
        shadow: shadowAssessment,
        animaAnimus: animaAnimusAssessment,
        self: selfAssessment
      },
      overallProgress: this.calculateOverallProgress({
        persona: personaAssessment.progress,
        shadow: shadowAssessment.progress,
        animaAnimus: animaAnimusAssessment.progress,
        self: selfAssessment.progress
      }),
      recommendations: this.generateRecommendations(currentStage)
    };
  }
  
  /**
   * 确定当前阶段
   */
  determineCurrentStage(assessments) {
    // 阶段 progression: persona → shadow → anima/animus → self
    // 每个阶段需要达到一定完成度才能进入下一阶段
    
    if (assessments.self.progress >= 0.5) {
      return { name: 'self', description: '自性化阶段', progress: assessments.self.progress };
    }
    
    if (assessments.animaAnimus.progress >= 0.5) {
      return { name: 'anima-animus', description: '阿尼玛/阿尼姆斯整合阶段', progress: assessments.animaAnimus.progress };
    }
    
    if (assessments.shadow.progress >= 0.5) {
      return { name: 'shadow', description: '阴影整合阶段', progress: assessments.shadow.progress };
    }
    
    return { name: 'persona', description: '人格面具阶段', progress: assessments.persona.progress };
  }
  
  /**
   * 计算整体进度
   */
  calculateOverallProgress(stageProgresses) {
    const weights = {
      persona: 0.2,
      shadow: 0.3,
      animaAnimus: 0.25,
      self: 0.25
    };
    
    let totalProgress = 0;
    let completedStages = 0;
    
    for (const [stage, progress] of Object.entries(stageProgresses)) {
      if (progress >= 0.8) {
        completedStages++;
        totalProgress += weights[stage];
      } else {
        totalProgress += weights[stage] * progress;
      }
    }
    
    return {
      percentage: Math.round(totalProgress * 100),
      completedStages,
      totalStages: 4,
      nextMilestone: this.getNextMilestone(stageProgresses)
    };
  }
  
  getNextMilestone(stageProgresses) {
    if (stageProgresses.persona < 0.8) return '人格面具解离';
    if (stageProgresses.shadow < 0.8) return '阴影整合';
    if (stageProgresses.animaAnimus < 0.8) return '阿尼玛/阿尼姆斯对话';
    return '自性化实现';
  }
  
  /**
   * 生成阶段建议
   */
  generateRecommendations(currentStage) {
    const recommendations = {
      persona: [
        '识别并命名你的人格面具 (工作角色、社会形象)',
        '探索面具背后的真实自我',
        '练习在安全环境中摘下面具',
        '反思社会期望与个人意愿的差异'
      ],
      shadow: [
        '识别你的阴影投射 (对他人的强烈反应)',
        '练习接纳自己的"黑暗面"',
        '进行阴影对话 (想象与阴影的对话)',
        '将阴影能量转化为创造性表达'
      ],
      'anima-animus': [
        '识别内在异性原型的特征',
        '注意亲密关系中的原型投射',
        '进行阿尼玛/阿尼姆斯对话练习',
        '整合情感与理性、直觉与逻辑'
      ],
      self: [
        '关注曼荼罗、统一、整体的意象',
        '培养超越功能的体验',
        '整合对立面 (光明/黑暗、理性/感性)',
        '发展生命意义感和目的感'
      ]
    };
    
    return recommendations[currentStage.name] || recommendations.persona;
  }
  
  /**
   * 追踪个体化里程碑
   */
  trackMilestone(milestone) {
    this.individuationMetrics.milestones.push({
      ...milestone,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      milestone,
      totalMilestones: this.individuationMetrics.milestones.length
    };
  }
}

/**
 * 人格面具阶段
 */
class PersonaStage {
  assess(userProfile) {
    const personaIdentification = this.assessPersonaIdentification(userProfile);
    const personaDissociation = this.assessPersonaDissociation(userProfile);
    const trueSelfExploration = this.assessTrueSelfExploration(userProfile);
    
    const progress = (personaIdentification * 0.3 + personaDissociation * 0.4 + trueSelfExploration * 0.3);
    
    return {
      progress: Math.round(progress * 100) / 100,
      components: {
        personaIdentification: Math.round(personaIdentification * 100) / 100,
        personaDissociation: Math.round(personaDissociation * 100) / 100,
        trueSelfExploration: Math.round(trueSelfExploration * 100) / 100
      },
      insights: this.generateInsights('persona', { personaIdentification, personaDissociation, trueSelfExploration })
    };
  }
  
  assessPersonaIdentification(userProfile) {
    // 评估人格面具识别程度
    const masks = userProfile.personaMasks || [];
    const awareness = masks.length > 0 ? 0.5 : 0;
    const namedMasks = masks.filter(m => m.name).length;
    const namingScore = namedMasks / Math.max(masks.length, 1);
    
    return Math.min(1, awareness + namingScore * 0.5);
  }
  
  assessPersonaDissociation(userProfile) {
    // 评估人格面具解离程度
    const dissociationIndicators = userProfile.personaDissociation || {};
    
    const score = (
      (dissociationIndicators.awarenessOfMask ? 0.3 : 0) +
      (dissociationIndicators.questioningSocialRoles ? 0.3 : 0) +
      (dissociationIndicators.exploringTrueSelf ? 0.4 : 0)
    );
    
    return Math.min(1, score);
  }
  
  assessTrueSelfExploration(userProfile) {
    // 评估真实自我探索程度
    const exploration = userProfile.trueSelfExploration || {};
    
    const score = (
      (exploration.valuesClarification ? 0.3 : 0) +
      (exploration.authenticExpression ? 0.3 : 0) +
      (exploration.innerVoiceListening ? 0.4 : 0)
    );
    
    return Math.min(1, score);
  }
  
  generateInsights(stage, components) {
    const insights = [];
    
    if (stage === 'persona') {
      if (components.personaIdentification < 0.5) {
        insights.push('需要先识别人格面具的存在和类型');
      }
      if (components.personaDissociation < 0.5) {
        insights.push('开始质疑社会角色与真实自我的差异');
      }
      if (components.trueSelfExploration < 0.5) {
        insights.push('深入探索内在价值观和真实意愿');
      }
    }
    
    return insights;
  }
}

/**
 * 阴影阶段
 */
class ShadowStage {
  assess(userProfile) {
    const shadowRecognition = this.assessShadowRecognition(userProfile);
    const shadowIntegration = this.assessShadowIntegration(userProfile);
    const projectionAwareness = this.assessProjectionAwareness(userProfile);
    
    const progress = (shadowRecognition * 0.3 + shadowIntegration * 0.4 + projectionAwareness * 0.3);
    
    return {
      progress: Math.round(progress * 100) / 100,
      components: {
        shadowRecognition: Math.round(shadowRecognition * 100) / 100,
        shadowIntegration: Math.round(shadowIntegration * 100) / 100,
        projectionAwareness: Math.round(projectionAwareness * 100) / 100
      }
    };
  }
  
  assessShadowRecognition(userProfile) {
    const recognition = userProfile.shadowRecognition || {};
    return Math.min(1, (
      (recognition.acknowledgesDarkSide ? 0.4 : 0) +
      (recognition.identifiesRepressedTraits ? 0.3 : 0) +
      (recognition.understandsShadowOrigin ? 0.3 : 0)
    ));
  }
  
  assessShadowIntegration(userProfile) {
    const integration = userProfile.shadowIntegration || {};
    return Math.min(1, (
      (integration.acceptsShadowAsPart ? 0.4 : 0) +
      (integration.dialoguesWithShadow ? 0.3 : 0) +
      (integration.transformsShadowEnergy ? 0.3 : 0)
    ));
  }
  
  assessProjectionAwareness(userProfile) {
    const awareness = userProfile.projectionAwareness || {};
    return Math.min(1, (
      (awareness.recognizesProjections ? 0.5 : 0) +
      (awareness.retractsProjections ? 0.5 : 0)
    ));
  }
}

/**
 * 阿尼玛/阿尼姆斯阶段
 */
class AnimaAnimusStage {
  assess(userProfile) {
    const animaAnimusRecognition = this.assessAnimaAnimusRecognition(userProfile);
    const projectionAwareness = this.assessProjectionAwareness(userProfile);
    const integration = this.assessIntegration(userProfile);
    
    const progress = (animaAnimusRecognition * 0.3 + projectionAwareness * 0.3 + integration * 0.4);
    
    return {
      progress: Math.round(progress * 100) / 100,
      components: {
        animaAnimusRecognition: Math.round(animaAnimusRecognition * 100) / 100,
        projectionAwareness: Math.round(projectionAwareness * 100) / 100,
        integration: Math.round(integration * 100) / 100
      }
    };
  }
  
  assessAnimaAnimusRecognition(userProfile) {
    const recognition = userProfile.animaAnimusRecognition || {};
    return Math.min(1, (
      (recognition.identifiesInnerOther ? 0.4 : 0) +
      (recognition.understandsArchetype ? 0.3 : 0) +
      (recognition.recognizesDevelopmentStage ? 0.3 : 0)
    ));
  }
  
  assessProjectionAwareness(userProfile) {
    const awareness = userProfile.animaAnimusProjectionAwareness || {};
    return Math.min(1, (
      (awareness.recognizesRomanticProjections ? 0.5 : 0) +
      (awareness.distinguishesProjectionFromReality ? 0.5 : 0)
    ));
  }
  
  assessIntegration(userProfile) {
    const integration = userProfile.animaAnimusIntegration || {};
    return Math.min(1, (
      (integration.balancesEmotionLogic ? 0.4 : 0) +
      (integration.dialoguesWithInnerOther ? 0.3 : 0) +
      (integration.creativeExpression ? 0.3 : 0)
    ));
  }
}

/**
 * 自性阶段
 */
class SelfStage {
  assess(userProfile) {
    const wholeness = this.assessWholeness(userProfile);
    const meaning = this.assessMeaning(userProfile);
    const transcendence = this.assessTranscendence(userProfile);
    
    const progress = (wholeness * 0.4 + meaning * 0.3 + transcendence * 0.3);
    
    return {
      progress: Math.round(progress * 100) / 100,
      components: {
        wholeness: Math.round(wholeness * 100) / 100,
        meaning: Math.round(meaning * 100) / 100,
        transcendence: Math.round(transcendence * 100) / 100
      }
    };
  }
  
  assessWholeness(userProfile) {
    const wholeness = userProfile.selfWholeness || {};
    return Math.min(1, (
      (wholeness.integratesOpposites ? 0.4 : 0) +
      (wholeness.acceptsComplexity ? 0.3 : 0) +
      (wholeness.experiencesUnity ? 0.3 : 0)
    ));
  }
  
  assessMeaning(userProfile) {
    const meaning = userProfile.selfMeaning || {};
    return Math.min(1, (
      (meaning.hasLifePurpose ? 0.4 : 0) +
      (meaning.experiencesSignificance ? 0.3 : 0) +
      (meaning.alignsWithValues ? 0.3 : 0)
    ));
  }
  
  assessTranscendence(userProfile) {
    const transcendence = userProfile.selfTranscendence || {};
    return Math.min(1, (
      (transcendence.experiencesTranscendentFunction ? 0.4 : 0) +
      (transcendence.recognizesMandalaSymbols ? 0.3 : 0) +
      (transcendence.transcendsEgo ? 0.3 : 0)
    ));
  }
}

module.exports = IndividuationTrackingModule;
