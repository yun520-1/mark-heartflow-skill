/**
 * 集体认同模块 (Collective Identity Module)
 * 
 * 理论基础：基于 SEP 社会认同理论、集体意向性理论、现象学自我理论
 * 
 * 核心理论来源:
 * - Tajfel, H. & Turner, J. (1979). "Social Identity Theory" - 社会认同理论
 * - Ellemers, N. & Haslam, S. A. (2012). "Social Identity Theory" - 现代发展
 * - Bratman, M. (1999). "Shared Intention" - 共享意向性与集体认同
 * - Gilbert, M. (1990). "Walking Together" - 联合承诺与群体归属
 * - Scheler, M. (1954 [1912]). "The Nature of Sympathy" - 集体体验与认同融合
 * - Zahavi, D. (2015). "Self and Other" - 现象学自我与集体认同
 * - SEP Entry: Social Identity (2023)
 * - SEP Entry: Collective Intentionality (2023)
 * 
 * 核心概念:
 * 1. 社会认同 (Social Identity) - 个体对群体成员身份的认知和情感承诺
 * 2. 自我分类 (Self-Categorization) - 将自我归类为群体成员的过程
 * 3. 群体规范内化 (Norm Internalization) - 采纳群体规范作为自我指导
 * 4. 认同融合 (Identity Fusion) - 个人认同与集体认同的深度整合
 * 5. 关系性自我 (Relational Self) - 自我概念中包含与他人的关系
 * 6. 集体自尊 (Collective Self-Esteem) - 基于群体成员身份的自我价值感
 * 7. 认同威胁 (Identity Threat) - 对群体身份或价值的感知威胁
 * 8. 群体情感 (Group-Based Emotion) - 基于群体成员身份的情绪体验
 * 
 * @version 3.23.0
 * @author HeartFlow Team
 */

class CollectiveIdentityModule {
  constructor() {
    this.version = '3.23.0';
    this.socialIdentities = []; // 社会认同列表
    this.selfCategorizations = []; // 自我分类列表
    this.groupNorms = []; // 群体规范列表
    this.identityFusions = []; // 认同融合状态
    this.relationalSelves = []; // 关系性自我
    this.collectiveEmotions = []; // 群体情感
    this.identityThreats = []; // 认同威胁记录
    
    console.log('[CollectiveIdentity] 模块初始化完成 (v3.23.0)');
    console.log('[CollectiveIdentity] 理论基础：Tajfel & Turner 社会认同理论 + SEP 集体意向性');
  }

  /**
   * 形成社会认同
   * 
   * 基于 Tajfel & Turner 社会认同理论 (SIT)
   * 
   * @param {string} groupName - 群体名称
   * @param {string} selfCategory - 自我分类标签
   * @param {object} options - 配置选项
   * @param {number} options.salience - 认同显著性 (0-1)
   * @param {number} options.commitment - 认同承诺度 (0-1)
   * @param {string} options.valence - 认同效价 (positive/negative/neutral)
   * @param {array} options.definingFeatures - 群体定义特征
   * @returns {object} 社会认同对象
   */
  formSocialIdentity(groupName, selfCategory, options = {}) {
    const identity = {
      id: `identity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupName,
      selfCategory,
      salience: options.salience || 0.5, // 认同显著性
      commitment: options.commitment || 0.7, // 认同承诺度
      valence: options.valence || 'positive', // 认同效价
      definingFeatures: options.definingFeatures || [], // 群体定义特征
      formationTime: new Date().toISOString(),
      
      // Tajfel & Turner SIT 核心要素
      sitComponents: {
        socialCategorization: true, // 社会分类
        socialIdentification: true, // 社会认同
        socialComparison: true // 社会比较
      },
      
      // 自我分类理论要素 (Turner et al. 1987)
      selfCategorizationFeatures: {
        metaContrast: 0.0, // 元对比原则 (组内差异 < 组间差异)
        normativeFit: 0.0, // 规范适配度
        comparativeFit: 0.0 // 比较适配度
      },
      
      // 认同测量指标
      measures: {
        centrality: 0.0, // 认同中心性 (在自我概念中的重要程度)
        satisfaction: 0.0, // 认同满意度
        solidarity: 0.0, // 认同团结度
        inGroupTies: 0.0 // 组内联结强度
      }
    };
    
    // 计算自我分类特征
    identity.selfCategorizationFeatures.metaContrast = this._calculateMetaContrast(identity);
    identity.selfCategorizationFeatures.normativeFit = this._calculateNormativeFit(identity);
    identity.selfCategorizationFeatures.comparativeFit = this._calculateComparativeFit(identity);
    
    // 计算认同测量指标
    identity.measures.centrality = this._calculateCentrality(identity);
    identity.measures.satisfaction = this._calculateSatisfaction(identity);
    identity.measures.solidarity = this._calculateSolidarity(identity);
    identity.measures.inGroupTies = this._calculateInGroupTies(identity);
    
    this.socialIdentities.push(identity);
    console.log(`[CollectiveIdentity] 形成社会认同：${groupName} (${selfCategory})`);
    
    return identity;
  }

  /**
   * 形成认同融合
   * 
   * 认同融合理论 (Identity Fusion Theory, Swann et al. 2009, 2012)
   * 描述个人认同与集体认同的深度整合状态
   * 
   * @param {string} identityId - 社会认同 ID
   * @param {number} fusionLevel - 融合程度 (0-1)
   * @param {object} options - 配置选项
   * @returns {object} 认同融合对象
   */
  formIdentityFusion(identityId, fusionLevel, options = {}) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[CollectiveIdentity] 未找到社会认同：${identityId}`);
    }
    
    const fusion = {
      id: `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      identityId,
      groupName: identity.groupName,
      fusionLevel, // 融合程度 (0-1)
      formationTime: new Date().toISOString(),
      
      // Swann 等认同融合理论核心特征
      fusionFeatures: {
        // 个人自我与集体自我的重叠
        selfGroupOverlap: fusionLevel,
        
        // 代理性感 (个人能动性代表群体)
        agencyPerception: fusionLevel * 0.9,
        
        // 不可逆性 (融合后难以逆转)
        irreversibility: fusionLevel > 0.7,
        
        // 生理唤醒 (为群体行动时的生理反应)
        physiologicalArousal: fusionLevel * 0.8,
        
        // 群体利益优先
        groupInterestPriority: fusionLevel > 0.5
      },
      
      // 融合类型 (Swann et al. 2012)
      fusionType: this._classifyFusionType(fusionLevel, options),
      
      // 行为预测
      behavioralPredictions: {
        proGroupAction: fusionLevel * 0.95, // 亲群体行为倾向
        selfSacrifice: fusionLevel > 0.8, // 自我牺牲意愿
        identityDefense: fusionLevel > 0.6 // 认同防御倾向
      }
    };
    
    this.identityFusions.push(fusion);
    console.log(`[CollectiveIdentity] 形成认同融合：${identity.groupName} (融合度：${fusionLevel.toFixed(2)})`);
    
    return fusion;
  }

  /**
   * 形成关系性自我
   * 
   * 基于现象学自我理论 (Zahavi 2015) 和关系自我理论
   * 自我概念中包含与他人的关系，形成"我们感"
   * 
   * @param {string} relationshipType - 关系类型
   * @param {array} participants - 参与者列表
   * @param {object} options - 配置选项
   * @returns {object} 关系性自我对象
   */
  formRelationalSelf(relationshipType, participants, options = {}) {
    const relationalSelf = {
      id: `relational_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      relationshipType,
      participants,
      formationTime: new Date().toISOString(),
      
      // 现象学自我理论特征 (Zahavi 2015)
      phenomenologicalFeatures: {
        // 最小自我 (前反思自我意识)
        minimalSelf: true,
        
        // 叙事自我 (扩展的自我概念)
        narrativeSelf: true,
        
        // 社会自我 (关系中的自我)
        socialSelf: true,
        
        // 自我 - 他人边界渗透性
        selfOtherPermeability: options.permeability || 0.5
      },
      
      // 关系特征
      relationalFeatures: {
        // 相互性
        reciprocity: options.reciprocity || 0.7,
        
        // 相互依赖
        interdependence: options.interdependence || 0.6,
        
        // 共享历史
        sharedHistory: options.sharedHistory || false,
        
        // 共同未来预期
        sharedFuture: options.sharedFuture || false,
        
        // 情感联结
        emotionalBond: options.emotionalBond || 0.5
      },
      
      // 自我概念整合度
      integrationLevel: this._calculateIntegrationLevel(participants, options)
    };
    
    this.relationalSelves.push(relationalSelf);
    console.log(`[CollectiveIdentity] 形成关系性自我：${relationshipType} (${participants.length}人)`);
    
    return relationalSelf;
  }

  /**
   * 内化群体规范
   * 
   * 基于社会认同理论和规范焦点理论 (Cialdini et al. 1990)
   * 
   * @param {string} groupName - 群体名称
   * @param {string} normContent - 规范内容
   * @param {string} normType - 规范类型 (descriptive/injunctive)
   * @param {object} options - 配置选项
   * @returns {object} 群体规范对象
   */
  internalizeGroupNorm(groupName, normContent, normType, options = {}) {
    const norm = {
      id: `norm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupName,
      content: normContent,
      type: normType, // descriptive (描述性) / injunctive (指令性)
      internalizationTime: new Date().toISOString(),
      
      // 规范特征
      normFeatures: {
        // 规范显著性
        salience: options.salience || 0.6,
        
        // 规范强度
        strength: options.strength || 0.7,
        
        // 规范普遍性 (群体中遵守程度)
        universality: options.universality || 0.5,
        
        // 规范执行机制
        enforcement: options.enforcement || 'informal' // informal/formal/legal
      },
      
      // 内化程度 (从外在服从到内在接受)
      internalizationLevel: this._calculateInternalizationLevel(normType, options),
      
      // 规范影响的行为领域
      behavioralDomains: options.domains || []
    };
    
    this.groupNorms.push(norm);
    console.log(`[CollectiveIdentity] 内化群体规范：${groupName} - ${normType}规范`);
    
    return norm;
  }

  /**
   * 体验群体情感
   * 
   * 基于群体情感理论 (Smith & Seger 2009; von Scheve & Salmela 2014)
   * 群体成员基于群体身份体验的情绪
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} groupName - 群体名称
   * @param {string} triggerEvent - 触发事件
   * @param {object} options - 配置选项
   * @returns {object} 群体情感对象
   */
  experienceGroupBasedEmotion(emotionType, groupName, triggerEvent, options = {}) {
    const groupEmotion = {
      id: `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotionType,
      groupName,
      triggerEvent,
      experienceTime: new Date().toISOString(),
      
      // 群体情感特征 (Smith & Seger 2009)
      groupEmotionFeatures: {
        // 基于群体身份 (而非个人身份)
        groupBased: true,
        
        // 群体认同调节强度
        identityModeration: options.identityStrength || 0.7,
        
        // 群体规范影响表达
        normInfluence: options.normInfluence || 0.6,
        
        // 群体内共享程度
        sharedWithinGroup: options.sharedLevel || 0.5
      },
      
      // 情绪维度
      dimensions: {
        valence: this._getEmotionValence(emotionType),
        arousal: options.arousal || 0.5,
        dominance: options.dominance || 0.5
      },
      
      // 群体情感类型 (von Scheve & Salmela 2014)
      collectiveEmotionType: this._classifyCollectiveEmotionType(emotionType, options)
    };
    
    this.collectiveEmotions.push(groupEmotion);
    console.log(`[CollectiveIdentity] 体验群体情感：${emotionType} (${groupName})`);
    
    return groupEmotion;
  }

  /**
   * 检测认同威胁
   * 
   * 基于社会认同威胁理论 (Branscombe et al. 1999)
   * 
   * @param {string} identityId - 社会认同 ID
   * @param {string} threatType - 威胁类型
   * @param {string} threatSource - 威胁来源
   * @param {object} options - 配置选项
   * @returns {object} 认同威胁对象
   */
  detectIdentityThreat(identityId, threatType, threatSource, options = {}) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[CollectiveIdentity] 未找到社会认同：${identityId}`);
    }
    
    const threat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      identityId,
      groupName: identity.groupName,
      threatType,
      threatSource,
      detectionTime: new Date().toISOString(),
      
      // 威胁类型分类 (Branscombe et al. 1999)
      threatClassification: {
        // 群体价值威胁
        valueThreat: threatType === 'value',
        
        // 群体独特性威胁
        distinctivenessThreat: threatType === 'distinctiveness',
        
        // 群体成员资格威胁
        membershipThreat: threatType === 'membership',
        
        // 群体控制威胁
        controlThreat: threatType === 'control'
      },
      
      // 威胁严重程度
      severity: options.severity || 0.5,
      
      // 应对策略预测 (Branscombe et al. 1999)
      predictedCopingStrategies: this._predictCopingStrategies(threatType, identity, options)
    };
    
    this.identityThreats.push(threat);
    console.log(`[CollectiveIdentity] 检测认同威胁：${threatType} (${identity.groupName})`);
    
    return threat;
  }

  /**
   * 计算集体自尊
   * 
   * 基于集体自尊量表 (Luhtanen & Crocker 1992)
   * 
   * @param {string} identityId - 社会认同 ID
   * @returns {object} 集体自尊对象
   */
  calculateCollectiveSelfEsteem(identityId) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[CollectiveIdentity] 未找到社会认同：${identityId}`);
    }
    
    const cse = {
      identityId,
      groupName: identity.groupName,
      calculationTime: new Date().toISOString(),
      
      // 集体自尊四个维度 (Luhtanen & Crocker 1992)
      dimensions: {
        // 成员资格自尊 (对自己作为群体成员的评估)
        membershipEsteem: this._calculateMembershipEsteem(identity),
        
        // 私人自尊 (个人对群体的评价)
        privateEsteem: this._calculatePrivateEsteem(identity),
        
        // 公共自尊 (感知他人对群体的评价)
        publicEsteem: this._calculatePublicEsteem(identity),
        
        // 重要性自尊 (群体对自我概念的重要性)
        importanceEsteem: identity.measures.centrality
      }
    };
    
    // 计算总体集体自尊
    cse.totalScore = (
      cse.dimensions.membershipEsteem +
      cse.dimensions.privateEsteem +
      cse.dimensions.publicEsteem +
      cse.dimensions.importanceEsteem
    ) / 4;
    
    cse.level = this._classifyCSELevel(cse.totalScore);
    
    console.log(`[CollectiveIdentity] 计算集体自尊：${identity.groupName} (${cse.level})`);
    
    return cse;
  }

  /**
   * 分析认同结构
   * 
   * 分析个体的社会认同结构和认同复杂性
   * 
   * @returns {object} 认同结构分析对象
   */
  analyzeIdentityStructure() {
    const analysis = {
      analysisTime: new Date().toISOString(),
      
      // 认同数量统计
      statistics: {
        socialIdentitiesCount: this.socialIdentities.length,
        identityFusionsCount: this.identityFusions.length,
        relationalSelvesCount: this.relationalSelves.length,
        groupNormsCount: this.groupNorms.length,
        collectiveEmotionsCount: this.collectiveEmotions.length,
        identityThreatsCount: this.identityThreats.length
      },
      
      // 认同复杂性 (基于 Linville 1985, 1987)
      complexity: this._calculateIdentityComplexity(),
      
      // 认同整合度
      integration: this._calculateIdentityIntegration(),
      
      // 认同冲突检测
      conflicts: this._detectIdentityConflicts(),
      
      // 认同显著性排序
      salienceRanking: this._rankIdentitiesBySalience()
    };
    
    return analysis;
  }

  /**
   * 获取模块状态摘要
   * 
   * @returns {object} 状态摘要对象
   */
  getStatus() {
    const analysis = this.analyzeIdentityStructure();
    
    return {
      version: this.version,
      theory: '社会认同理论 (Tajfel & Turner) + 集体意向性 (SEP)',
      timestamp: new Date().toISOString(),
      statistics: analysis.statistics,
      complexity: analysis.complexity,
      integration: analysis.integration,
      conflicts: analysis.conflicts,
      topIdentities: analysis.salienceRanking.slice(0, 3)
    };
  }

  // ========== 内部辅助方法 ==========

  _calculateMetaContrast(identity) {
    // 元对比原则：组内差异与组间差异的比率
    // 简化实现：基于承诺度和显著性估算
    return identity.commitment * 0.6 + identity.salience * 0.4;
  }

  _calculateNormativeFit(identity) {
    // 规范适配度：个体特征与群体原型的匹配程度
    // 简化实现：基于定义特征数量估算
    return Math.min(1.0, identity.definingFeatures.length * 0.2);
  }

  _calculateComparativeFit(identity) {
    // 比较适配度：群体分类在特定情境中的适用性
    // 简化实现：基于显著性估算
    return identity.salience * 0.8;
  }

  _calculateCentrality(identity) {
    // 认同中心性：认同在自我概念中的重要程度
    return identity.commitment * 0.7 + identity.salience * 0.3;
  }

  _calculateSatisfaction(identity) {
    // 认同满意度：对群体成员身份的满意程度
    return identity.valence === 'positive' ? 0.8 : (identity.valence === 'neutral' ? 0.5 : 0.3);
  }

  _calculateSolidarity(identity) {
    // 认同团结度：与群体其他成员的联结感
    return identity.commitment * 0.6 + identity.salience * 0.4;
  }

  _calculateInGroupTies(identity) {
    // 组内联结：感知与群体其他成员的相似性和联结
    return identity.commitment * 0.5 + identity.salience * 0.5;
  }

  _classifyFusionType(fusionLevel, options) {
    if (fusionLevel >= 0.8) return 'complete_fusion'; // 完全融合
    if (fusionLevel >= 0.6) return 'strong_fusion'; // 强融合
    if (fusionLevel >= 0.4) return 'moderate_fusion'; // 中等融合
    if (fusionLevel >= 0.2) return 'weak_fusion'; // 弱融合
    return 'no_fusion'; // 无融合
  }

  _calculateIntegrationLevel(participants, options) {
    // 关系性自我整合度
    const baseScore = 0.5;
    const reciprocityBonus = (options.reciprocity || 0.5) * 0.2;
    const interdependenceBonus = (options.interdependence || 0.5) * 0.2;
    const emotionalBonus = (options.emotionalBond || 0.5) * 0.1;
    return Math.min(1.0, baseScore + reciprocityBonus + interdependenceBonus + emotionalBonus);
  }

  _calculateInternalizationLevel(normType, options) {
    // 内化程度：从外在服从到内在接受
    const baseLevel = normType === 'injunctive' ? 0.6 : 0.5;
    const strengthBonus = (options.strength || 0.5) * 0.3;
    const universalityBonus = (options.universality || 0.5) * 0.2;
    return Math.min(1.0, baseLevel + strengthBonus + universalityBonus);
  }

  _getEmotionValence(emotionType) {
    const positiveEmotions = ['pride', 'gratitude', 'hope', 'joy', 'love'];
    const negativeEmotions = ['shame', 'guilt', 'anger', 'fear', 'sadness'];
    if (positiveEmotions.includes(emotionType.toLowerCase())) return 'positive';
    if (negativeEmotions.includes(emotionType.toLowerCase())) return 'negative';
    return 'neutral';
  }

  _classifyCollectiveEmotionType(emotionType, options) {
    // von Scheve & Salmela (2014) 集体情绪类型学
    if (options.sharedLevel > 0.7) return 'shared_emotion'; // 共享情绪
    if (options.sharedLevel > 0.4) return 'group_emotion'; // 群体情绪
    return 'individual_emotion_in_group'; // 群体中的个体情绪
  }

  _predictCopingStrategies(threatType, identity, options) {
    // Branscombe et al. (1999) 认同威胁应对策略
    const strategies = [];
    
    if (threatType === 'value') {
      strategies.push('social_creativity'); // 社会创造性
      strategies.push('social_competition'); // 社会竞争
    }
    if (threatType === 'distinctiveness') {
      strategies.push('group_differentiation'); // 群体差异化
    }
    if (threatType === 'membership') {
      strategies.push('identity_affirmation'); // 认同肯定
      strategies.push('group_boundary_strengthening'); // 群体边界强化
    }
    if (threatType === 'control') {
      strategies.push('collective_action'); // 集体行动
    }
    
    // 高承诺认同更可能采用群体水平应对
    if (identity.commitment > 0.7) {
      strategies.push('group_level_coping');
    }
    
    return strategies;
  }

  _calculateMembershipEsteem(identity) {
    return identity.measures.solidarity * 0.7 + identity.measures.inGroupTies * 0.3;
  }

  _calculatePrivateEsteem(identity) {
    return identity.measures.satisfaction * 0.8 + (identity.valence === 'positive' ? 0.2 : 0);
  }

  _calculatePublicEsteem(identity) {
    // 简化：基于认同效价和显著性估算
    return identity.valence === 'positive' ? identity.salience * 0.8 : identity.salience * 0.4;
  }

  _classifyCSELevel(totalScore) {
    if (totalScore >= 0.8) return 'very_high';
    if (totalScore >= 0.6) return 'high';
    if (totalScore >= 0.4) return 'moderate';
    if (totalScore >= 0.2) return 'low';
    return 'very_low';
  }

  _calculateIdentityComplexity() {
    // 认同复杂性：基于认同数量和多样性
    const count = this.socialIdentities.length;
    if (count === 0) return { level: 'none', score: 0 };
    if (count === 1) return { level: 'simple', score: 0.3 };
    if (count <= 3) return { level: 'moderate', score: 0.6 };
    return { level: 'complex', score: 0.9 };
  }

  _calculateIdentityIntegration() {
    // 认同整合度：基于认同之间的协调性
    if (this.socialIdentities.length <= 1) return { level: 'N/A', score: 1.0 };
    
    // 简化：基于认同冲突数量计算
    const conflicts = this._detectIdentityConflicts();
    const conflictScore = conflicts.length === 0 ? 1.0 : Math.max(0, 1.0 - conflicts.length * 0.2);
    
    return {
      level: conflictScore >= 0.8 ? 'high' : (conflictScore >= 0.5 ? 'moderate' : 'low'),
      score: conflictScore
    };
  }

  _detectIdentityConflicts() {
    // 检测认同之间的冲突
    const conflicts = [];
    for (let i = 0; i < this.socialIdentities.length; i++) {
      for (let j = i + 1; j < this.socialIdentities.length; j++) {
        const id1 = this.socialIdentities[i];
        const id2 = this.socialIdentities[j];
        
        // 检测效价冲突
        if (id1.valence !== id2.valence && id1.valence !== 'neutral' && id2.valence !== 'neutral') {
          conflicts.push({
            type: 'valence_conflict',
            identities: [id1.groupName, id2.groupName],
            severity: 'medium'
          });
        }
        
        // 检测规范冲突 (简化)
        const norms1 = this.groupNorms.filter(n => n.groupName === id1.groupName);
        const norms2 = this.groupNorms.filter(n => n.groupName === id2.groupName);
        if (norms1.length > 0 && norms2.length > 0) {
          // 简化：假设有潜在冲突
          conflicts.push({
            type: 'potential_norm_conflict',
            identities: [id1.groupName, id2.groupName],
            severity: 'low'
          });
        }
      }
    }
    return conflicts;
  }

  _rankIdentitiesBySalience() {
    return this.socialIdentities
      .map(id => ({
        groupName: id.groupName,
        selfCategory: id.selfCategory,
        salience: id.salience,
        commitment: id.commitment
      }))
      .sort((a, b) => b.salience - a.salience);
  }
}

module.exports = { CollectiveIdentityModule };
