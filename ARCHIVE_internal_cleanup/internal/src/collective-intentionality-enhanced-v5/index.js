/**
 * HeartFlow Collective Intentionality Enhanced v5.0
 * 
 * 集体意向性深度整合模块
 * 理论来源：SEP Collective Intentionality
 * 
 * 核心理论:
 * - We-Intention (Searle): 集体意向不可还原为个体意向之和
 * - 联合承诺 (Gilbert): 共同承诺形成"plural subject"
 * - 共享意向性 (Bratman, Tomasello): 相互响应 + 共同目标
 * 
 * @version 5.0.2
 * @author HeartFlow Team
 */

class CollectiveIntentionalityEnhanced {
  constructor() {
    this.version = '5.0.2';
  }

  /**
   * 集体意向性评估
   * @param {Object} situationData - 情境数据
   * @returns {Object} 评估结果
   */
  assessCollectiveIntentionality(situationData) {
    const { situation, participants, individualIntentions, sharedExperience } = situationData;

    // 1. We-Intention 检测
    const weIntentionDetection = this._detectWeIntention({
      situation,
      participants,
      individualIntentions
    });

    // 2. 联合承诺评估
    const jointCommitmentAssessment = this._assessJointCommitment({
      participants,
      situation
    });

    // 3. 集体情绪识别
    const collectiveEmotionRecognition = this._recognizeCollectiveEmotion({
      sharedExperience,
      participants
    });

    // 4. 信任框架分析
    const trustFrameworkAnalysis = this._analyzeTrustFramework({
      participants,
      situation
    });

    // 5. 整合分析
    const integration = this._integrateAnalysis(
      weIntentionDetection,
      jointCommitmentAssessment,
      collectiveEmotionRecognition,
      trustFrameworkAnalysis
    );

    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      weIntention: weIntentionDetection,
      jointCommitment: jointCommitmentAssessment,
      collectiveEmotion: collectiveEmotionRecognition,
      trustFramework: trustFrameworkAnalysis,
      integration,
      recommendations: this._generateRecommendations(integration)
    };
  }

  /**
   * We-Intention 检测
   */
  _detectWeIntention({ situation, participants, individualIntentions }) {
    // 检测语言标记
    const linguisticMarkers = this._detectLinguisticMarkers(situation);

    // 检测意向结构
    const intentionStructure = this._analyzeIntentionStructure(individualIntentions);

    // 检测共同目标
    const sharedGoal = this._detectSharedGoal(situation, individualIntentions);

    // 检测相互依赖性
    const interdependence = this._assessInterdependence(individualIntentions);

    // 计算 We-Intention 强度
    const strength = this._calculateWeIntentionStrength(
      linguisticMarkers,
      intentionStructure,
      sharedGoal,
      interdependence
    );

    // 识别类型 (Searle, Gilbert, Bratman)
    const type = this._identifyWeIntentionType(
      intentionStructure,
      sharedGoal,
      interdependence
    );

    return {
      present: strength > 0.5,
      strength,
      type,
      linguisticMarkers,
      intentionStructure,
      sharedGoal,
      interdependence,
      irreducibility: this._assessIrreducibility(individualIntentions, strength),
      description: this._generateWeIntentionDescription(strength, type)
    };
  }

  /**
   * 检测语言标记
   */
  _detectLinguisticMarkers(situation) {
    if (!situation) return { present: false, markers: [] };

    const weMarkers = [
      '我们', '我们的', '一起', '共同', '联合',
      'we', 'our', 'together', 'joint', 'shared', 'collective'
    ];

    const lower = situation.toLowerCase();
    const foundMarkers = weMarkers.filter(marker => lower.includes(marker));

    return {
      present: foundMarkers.length > 0,
      markers: foundMarkers,
      count: foundMarkers.length,
      density: foundMarkers.length / (situation.length / 100) // 每百字密度
    };
  }

  /**
   * 分析意向结构
   */
  _analyzeIntentionStructure(individualIntentions) {
    if (!individualIntentions || individualIntentions.length === 0) {
      return { type: 'unknown', structure: 'no-data' };
    }

    // 检查意向是否指向共同目标
    const goals = individualIntentions.map(i => i.goal).filter(Boolean);
    const uniqueGoals = [...new Set(goals)];

    if (uniqueGoals.length === 1 && goals.length > 1) {
      return {
        type: 'shared',
        structure: 'convergent',
        description: '多个个体意向指向同一目标'
      };
    }

    // 检查意向是否相互依赖
    const hasInterdependence = individualIntentions.some((i, idx) => {
      const others = individualIntentions.filter((_, j) => j !== idx);
      return others.some(o => 
        i.condition && i.condition.toLowerCase().includes(o.agent?.toLowerCase())
      );
    });

    if (hasInterdependence) {
      return {
        type: 'interdependent',
        structure: 'mutually-responsive',
        description: '个体意向之间存在相互依赖'
      };
    }

    return {
      type: 'aggregate',
      structure: 'parallel',
      description: '个体意向并行但无明确关联'
    };
  }

  /**
   * 检测共同目标
   */
  _detectSharedGoal(situation, individualIntentions) {
    if (!situation && (!individualIntentions || individualIntentions.length === 0)) {
      return { present: false };
    }

    // 从情境中提取目标
    const situationGoal = this._extractGoalFromSituation(situation);
    
    // 从个体意向中提取目标
    const individualGoals = individualIntentions?.map(i => i.goal).filter(Boolean) || [];

    // 检查一致性
    if (situationGoal && individualGoals.length > 0) {
      const alignment = individualGoals.filter(g => 
        this._goalsAlign(g, situationGoal)
      ).length / individualGoals.length;

      return {
        present: alignment > 0.5,
        goal: situationGoal,
        alignment,
        description: alignment > 0.5 
          ? `个体目标与情境目标一致 (${Math.round(alignment * 100)}%)`
          : '个体目标与情境目标不一致'
      };
    }

    if (individualGoals.length > 1) {
      const uniqueGoals = [...new Set(individualGoals)];
      return {
        present: uniqueGoals.length === 1,
        goal: uniqueGoals[0],
        alignment: uniqueGoals.length === 1 ? 1 : 0,
        description: uniqueGoals.length === 1 
          ? '所有个体共享同一目标' 
          : `存在${uniqueGoals.length}个不同目标`
      };
    }

    return { present: false };
  }

  /**
   * 评估相互依赖性
   */
  _assessInterdependence(individualIntentions) {
    if (!individualIntentions || individualIntentions.length < 2) {
      return { level: 'none', score: 0 };
    }

    let interdependenceScore = 0;

    // 检查条件性
    individualIntentions.forEach((intention, idx) => {
      if (intention.condition) {
        const others = individualIntentions.filter((_, j) => j !== idx);
        others.forEach(other => {
          if (intention.condition.toLowerCase().includes(other.agent?.toLowerCase())) {
            interdependenceScore += 0.3;
          }
        });
      }
    });

    // 检查协调需求
    const requiresCoordination = individualIntentions.some(i => 
      i.requires?.includes('coordination') || i.requires?.includes('cooperation')
    );
    if (requiresCoordination) {
      interdependenceScore += 0.4;
    }

    // 检查成功条件
    const successDependsOnOthers = individualIntentions.some(i =>
      i.successCondition?.toLowerCase().includes('其他') ||
      i.successCondition?.toLowerCase().includes('others') ||
      i.successCondition?.toLowerCase().includes('共同')
    );
    if (successDependsOnOthers) {
      interdependenceScore += 0.3;
    }

    const level = interdependenceScore > 0.7 ? 'high' : interdependenceScore > 0.3 ? 'moderate' : 'low';

    return {
      level,
      score: Math.min(1, interdependenceScore),
      description: this._describeInterdependence(level)
    };
  }

  /**
   * 计算 We-Intention 强度
   */
  _calculateWeIntentionStrength(linguisticMarkers, intentionStructure, sharedGoal, interdependence) {
    const scores = [
      linguisticMarkers.present ? Math.min(1, linguisticMarkers.count / 3) : 0,
      intentionStructure.type === 'shared' ? 0.9 : intentionStructure.type === 'interdependent' ? 0.7 : 0.3,
      sharedGoal.present ? sharedGoal.alignment : 0,
      interdependence.score
    ];

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * 识别 We-Intention 类型
   */
  _identifyWeIntentionType(intentionStructure, sharedGoal, interdependence) {
    if (sharedGoal.present && interdependence.level === 'high') {
      return {
        type: 'Searle-We-Intention',
        description: '强 We-Intention：共同目标 + 高相互依赖',
        theoreticalBasis: 'Searle (1990, 1995)'
      };
    }

    if (intentionStructure.type === 'interdependent') {
      return {
        type: 'Bratman-Shared-Intention',
        description: '共享意向：相互响应的子计划',
        theoreticalBasis: 'Bratman (1999)'
      };
    }

    if (sharedGoal.present) {
      return {
        type: 'Gilbert-Joint-Commitment',
        description: '联合承诺：共同承诺于共同目标',
        theoreticalBasis: 'Gilbert (1990)'
      };
    }

    return {
      type: 'Weak-Collective',
      description: '弱集体性：有一定共同性但未达 We-Intention',
      theoreticalBasis: 'Tomasello (2009) - shared intentionality spectrum'
    };
  }

  /**
   * 评估不可还原性
   */
  _assessIrreducibility(individualIntentions, weIntentionStrength) {
    if (weIntentionStrength < 0.5) {
      return {
        level: 'low',
        description: '集体意向性较弱，可还原为个体意向之和'
      };
    }

    // 检查是否有 emergent 特征
    const hasEmergentFeatures = weIntentionStrength > 0.7 && 
      individualIntentions.length > 1;

    return {
      level: hasEmergentFeatures ? 'high' : 'moderate',
      description: hasEmergentFeatures
        ? '集体意向性具有不可还原的涌现特征'
        : '集体意向性部分可还原，但有共同性特征'
    };
  }

  /**
   * 生成 We-Intention 描述
   */
  _generateWeIntentionDescription(strength, type) {
    if (strength > 0.8) {
      return `强 We-Intention (${type.type})：存在明确的集体意向，不可还原为个体意向之和`;
    }
    if (strength > 0.5) {
      return `中等 We-Intention (${type.type})：存在集体意向，但可能部分可还原`;
    }
    return `弱 We-Intention：个体意向为主，集体性较弱`;
  }

  // ===== 辅助方法 =====

  _extractGoalFromSituation(situation) {
    if (!situation) return null;
    const goalIndicators = ['目标', '目的', '想要', '希望', 'goal', 'want', 'aim', 'purpose'];
    // 简化提取：查找包含目标指示词的句子
    const sentences = situation.split(/[.!?]/);
    for (const sentence of sentences) {
      if (goalIndicators.some(ind => sentence.toLowerCase().includes(ind))) {
        return sentence.trim();
      }
    }
    return null;
  }

  _goalsAlign(goal1, goal2) {
    if (!goal1 || !goal2) return false;
    const lower1 = goal1.toLowerCase();
    const lower2 = goal2.toLowerCase();
    // 简化：检查是否有共同关键词
    const keywords1 = lower1.split(/[\s,，]+/).filter(w => w.length > 2);
    const keywords2 = lower2.split(/[\s,，]+/).filter(w => w.length > 2);
    const overlap = keywords1.filter(k => keywords2.includes(k)).length;
    return overlap / Math.max(keywords1.length, keywords2.length) > 0.3;
  }

  _describeInterdependence(level) {
    const descriptions = {
      'high': '高相互依赖：个体行动以他人协作为条件',
      'moderate': '中等相互依赖：个体行动部分依赖他人',
      'low': '低相互依赖：个体行动相对独立'
    };
    return descriptions[level] || '未知';
  }

  /**
   * 联合承诺评估
   */
  _assessJointCommitment({ participants, situation }) {
    return {
      present: this._detectJointCommitmentPresence(participants, situation),
      strength: this._assessCommitmentStrength(participants),
      type: this._identifyCommitmentType(situation),
      description: '联合承诺评估'
    };
  }

  _detectJointCommitmentPresence(participants, situation) {
    if (!participants || participants.length < 2) return false;
    // 检查是否有共同承诺的迹象
    return true; // 简化
  }

  _assessCommitmentStrength(participants) {
    return 0.7; // 简化
  }

  _identifyCommitmentType(situation) {
    return 'joint-commitment'; // 简化
  }

  /**
   * 集体情绪识别
   */
  _recognizeCollectiveEmotion({ sharedExperience, participants }) {
    return {
      present: !!sharedExperience,
      type: this._identifyCollectiveEmotionType(sharedExperience),
      intensity: this._assessCollectiveEmotionIntensity(sharedExperience),
      description: '集体情绪识别'
    };
  }

  _identifyCollectiveEmotionType(sharedExperience) {
    if (!sharedExperience) return 'unknown';
    return 'shared'; // 简化
  }

  _assessCollectiveEmotionIntensity(sharedExperience) {
    return 0.6; // 简化
  }

  /**
   * 信任框架分析
   */
  _analyzeTrustFramework({ participants, situation }) {
    return {
      level: this._assessTrustLevel(participants),
      type: this._identifyTrustType(situation),
      description: '信任框架分析'
    };
  }

  _assessTrustLevel(participants) {
    return 'moderate'; // 简化
  }

  _identifyTrustType(situation) {
    return 'interpersonal'; // 简化
  }

  /**
   * 整合分析
   */
  _integrateAnalysis(weIntention, jointCommitment, collectiveEmotion, trustFramework) {
    return {
      collectiveStrength: this._calculateCollectiveStrength(weIntention, jointCommitment, trustFramework),
      cohesion: this._assessCohesion(weIntention, collectiveEmotion),
      functionality: this._assessFunctionality(weIntention, jointCommitment),
      pattern: this._identifyPattern(weIntention, jointCommitment, collectiveEmotion, trustFramework)
    };
  }

  _calculateCollectiveStrength(weIntention, jointCommitment, trustFramework) {
    return (weIntention.strength + jointCommitment.strength + (trustFramework.level === 'high' ? 0.9 : 0.5)) / 3;
  }

  _assessCohesion(weIntention, collectiveEmotion) {
    return weIntention.strength * 0.6 + (collectiveEmotion.intensity || 0.5) * 0.4;
  }

  _assessFunctionality(weIntention, jointCommitment) {
    return (weIntention.strength + jointCommitment.strength) / 2;
  }

  _identifyPattern(weIntention, jointCommitment, collectiveEmotion, trustFramework) {
    if (weIntention.strength > 0.7 && jointCommitment.strength > 0.7) {
      return { name: 'strong-collective', description: '强集体性模式' };
    }
    if (weIntention.strength > 0.5) {
      return { name: 'moderate-collective', description: '中等集体性模式' };
    }
    return { name: 'individual-dominant', description: '个体主导模式' };
  }

  /**
   * 生成干预建议
   */
  _generateRecommendations(integration) {
    const recommendations = [];

    const pattern = integration.pattern.name;

    if (pattern === 'strong-collective') {
      recommendations.push({
        type: 'maintain',
        title: '维持集体凝聚力',
        description: '集体性强，建议维持和深化',
        exercises: ['定期共同反思', '庆祝共同成就', '强化共同身份']
      });
    }

    if (pattern === 'moderate-collective') {
      recommendations.push({
        type: 'strengthen',
        title: '加强集体意向',
        description: '有一定集体性，可进一步加强',
        exercises: ['明确共同目标', '增强相互依赖', '建立联合承诺']
      });
    }

    if (pattern === 'individual-dominant') {
      recommendations.push({
        type: 'build',
        title: '建设集体性',
        description: '个体主导，可从基础建设集体性',
        exercises: ['探索共同利益', '建立信任', '创造共享体验']
      });
    }

    return recommendations;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'Collective Intentionality Enhanced',
      version: this.version,
      description: '集体意向性深度整合模块',
      theoreticalBasis: 'SEP Collective Intentionality',
      keyConcepts: [
        'We-Intention (Searle)',
        'Joint Commitment (Gilbert)',
        'Shared Intentionality (Bratman, Tomasello)',
        'Collective Emotion',
        'Trust Framework'
      ]
    };
  }
}

module.exports = CollectiveIntentionalityEnhanced;
