/**
 * 社会认同增强模块 (Social Identity Enhanced Module)
 * 
 * 基于 SEP 社会认同理论 (Social Identity) 和 Tajfel & Turner 社会认同理论 (SIT)
 * 来源：Stanford Encyclopedia of Philosophy
 * 
 * 核心理论框架:
 * - Tajfel & Turner (1979) 社会认同理论 (Social Identity Theory, SIT)
 * - Turner et al. (1987) 自我分类理论 (Self-Categorization Theory, SCT)
 * - Swann et al. (2009, 2012) 认同融合理论 (Identity Fusion Theory)
 * - Luhtanen & Crocker (1992) 集体自尊量表 (Collective Self-Esteem Scale)
 * - Branscombe et al. (1999) 认同威胁理论 (Identity Threat Theory)
 * - Ellemers & Haslam (2012) 社会认同现代发展
 * 
 * 核心概念:
 * 1. 社会认同 (Social Identity) - 个体对群体成员身份的认知和情感承诺
 * 2. 自我分类 (Self-Categorization) - 将自我归类为群体成员的过程
 * 3. 认同显著性 (Identity Salience) - 认同在特定情境中的激活程度
 * 4. 认同承诺 (Identity Commitment) - 对群体成员身份的承诺程度
 * 5. 认同融合 (Identity Fusion) - 个人认同与集体认同的深度整合
 * 6. 集体自尊 (Collective Self-Esteem) - 基于群体成员身份的自我价值感
 * 7. 认同威胁 (Identity Threat) - 对群体身份或价值的感知威胁
 * 8. 群体情感 (Group-Based Emotion) - 基于群体成员身份的情绪体验
 * 
 * @version 4.6.0
 * @author HeartFlow Team
 */

class SocialIdentityEnhanced {
  constructor() {
    this.version = '4.6.0';
    this.socialIdentities = []; // 社会认同列表
    this.selfCategorizations = []; // 自我分类列表
    this.identityFusions = []; // 认同融合列表
    this.identityThreats = []; // 认同威胁列表
    this.collectiveEsteemRecords = []; // 集体自尊记录
    this.groupEmotions = []; // 群体情感记录
    
    console.log('[SocialIdentityEnhanced] 模块初始化完成 (v4.6.0)');
    console.log('[SocialIdentityEnhanced] 理论基础：Tajfel & Turner SIT + SEP Social Identity');
  }

  /**
   * 评估社会认同显著性
   * 
   * 基于自我分类理论 (Turner et al. 1987)
   * 
   * @param {string} groupName - 群体名称
   * @param {object} context - 情境上下文
   * @returns {object} 显著性评估结果
   */
  assessIdentitySalience(groupName, context = {}) {
    const salience = {
      groupName,
      assessmentTime: new Date().toISOString(),
      
      // 可及性 (Accessibility) - 认同被激活的容易程度
      accessibility: {
        // 慢性可及性 (长期重要程度)
        chronicAccessibility: context.chronicImportance || 0.5,
        
        // 暂时可及性 (近期激活频率)
        temporaryAccessibility: context.recentActivation || 0.5,
        
        // 整体可及性
        overall: 0.0
      },
      
      // 适配度 (Fit) - 认同与情境的匹配程度
      fit: {
        // 比较适配度 (组内差异 < 组间差异)
        comparativeFit: context.comparativeFit || 0.5,
        
        // 规范适配度 (符合群体原型)
        normativeFit: context.normativeFit || 0.5,
        
        // 整体适配度
        overall: 0.0
      },
      
      // 计算整体显著性
      overallSalience: 0.0,
      salienceLevel: 'unknown'
    };

    // 计算可及性
    salience.accessibility.overall = (
      salience.accessibility.chronicAccessibility * 0.6 +
      salience.accessibility.temporaryAccessibility * 0.4
    );

    // 计算适配度
    salience.fit.overall = (
      salience.fit.comparativeFit * 0.5 +
      salience.fit.normativeFit * 0.5
    );

    // 计算整体显著性
    salience.overallSalience = (
      salience.accessibility.overall * 0.5 +
      salience.fit.overall * 0.5
    );

    salience.salienceLevel = this._classifySalienceLevel(salience.overallSalience);

    return salience;
  }

  /**
   * 形成社会认同
   * 
   * 基于 Tajfel & Turner (1979) 社会认同理论
   * 
   * @param {string} groupName - 群体名称
   * @param {string} selfCategory - 自我分类标签
   * @param {object} options - 配置选项
   * @returns {object} 社会认同对象
   */
  formSocialIdentity(groupName, selfCategory, options = {}) {
    const identity = {
      id: `identity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupName,
      selfCategory,
      formationTime: new Date().toISOString(),
      
      // Tajfel & Turner SIT 核心三过程
      sitProcesses: {
        // 社会分类 (Social Categorization)
        socialCategorization: {
          enabled: true,
          clarity: options.categorizationClarity || 0.7,
          complexity: options.categorizationComplexity || 0.5
        },
        
        // 社会认同 (Social Identification)
        socialIdentification: {
          enabled: true,
          strength: options.identificationStrength || 0.7,
          emotionalSignificance: options.emotionalSignificance || 0.6
        },
        
        // 社会比较 (Social Comparison)
        socialComparison: {
          enabled: true,
          direction: options.comparisonDirection || 'upward', // upward/downward/lateral
          distinctiveness: options.distinctiveness || 0.5
        }
      },
      
      // 认同特征
      identityFeatures: {
        // 认同显著性
        salience: options.salience || 0.5,
        
        // 认同承诺
        commitment: options.commitment || 0.7,
        
        // 认同中心性 (在自我概念中的重要程度)
        centrality: options.centrality || 0.6,
        
        // 认同效价
        valence: options.valence || 'positive', // positive/negative/neutral
        
        // 认同稳定性
        stability: options.stability || 0.7
      },
      
      // 认同测量指标 (基于 SIT 量表)
      measures: {
        // 成员资格自尊
        membershipEsteem: 0.0,
        
        // 私人自尊
        privateEsteem: 0.0,
        
        // 公共自尊
        publicEsteem: 0.0,
        
        // 重要性自尊
        importanceEsteem: 0.0,
        
        // 总体集体自尊
        collectiveSelfEsteem: 0.0
      }
    };

    // 计算测量指标
    identity.measures.membershipEsteem = this._calculateMembershipEsteem(identity);
    identity.measures.privateEsteem = this._calculatePrivateEsteem(identity);
    identity.measures.publicEsteem = this._calculatePublicEsteem(identity);
    identity.measures.importanceEsteem = identity.identityFeatures.centrality;
    identity.measures.collectiveSelfEsteem = (
      identity.measures.membershipEsteem +
      identity.measures.privateEsteem +
      identity.measures.publicEsteem +
      identity.measures.importanceEsteem
    ) / 4;

    this.socialIdentities.push(identity);
    console.log(`[SocialIdentityEnhanced] 形成社会认同：${groupName} (${selfCategory})`);

    return identity;
  }

  /**
   * 评估认同融合度
   * 
   * 基于 Swann et al. (2009, 2012) 认同融合理论
   * 
   * @param {string} identityId - 社会认同 ID
   * @param {object} options - 配置选项
   * @returns {object} 认同融合对象
   */
  assessIdentityFusion(identityId, options = {}) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[SocialIdentityEnhanced] 未找到社会认同：${identityId}`);
    }

    const fusion = {
      id: `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      identityId,
      groupName: identity.groupName,
      assessmentTime: new Date().toISOString(),
      
      // Swann 等认同融合理论核心维度
      fusionDimensions: {
        // 自我 - 群体重叠 (Self-Group Overlap)
        selfGroupOverlap: options.selfGroupOverlap || 0.5,
        
        // 代理性感 (Agency for Group)
        agencyForGroup: options.agencyForGroup || 0.5,
        
        // 不可逆性 (Irreversibility)
        irreversibility: options.irreversibility || 0.4,
        
        // 生理唤醒倾向 (Physiological Arousal)
        physiologicalArousal: options.physiologicalArousal || 0.4,
        
        // 群体利益优先 (Group Interest Priority)
        groupInterestPriority: options.groupInterestPriority || 0.5
      },
      
      // 融合类型 (Swann et al. 2012)
      fusionType: 'none',
      
      // 融合强度
      fusionStrength: 0.0,
      
      // 行为预测
      behavioralPredictions: {
        // 亲群体行为倾向
        proGroupActionTendency: 0.0,
        
        // 自我牺牲意愿
        selfSacrificeWillingness: false,
        
        // 认同防御倾向
        identityDefenseTendency: false,
        
        // 为群体奋斗意愿
        fightingForGroupWillingness: false
      }
    };

    // 计算融合强度
    const dimensionValues = Object.values(fusion.fusionDimensions);
    fusion.fusionStrength = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;

    // 分类融合类型
    fusion.fusionType = this._classifyFusionType(fusion.fusionStrength);

    // 计算行为预测
    fusion.behavioralPredictions.proGroupActionTendency = fusion.fusionStrength * 0.95;
    fusion.behavioralPredictions.selfSacrificeWillingness = fusion.fusionStrength > 0.8;
    fusion.behavioralPredictions.identityDefenseTendency = fusion.fusionStrength > 0.6;
    fusion.behavioralPredictions.fightingForGroupWillingness = fusion.fusionStrength > 0.7;

    this.identityFusions.push(fusion);
    console.log(`[SocialIdentityEnhanced] 评估认同融合：${identity.groupName} (融合度：${fusion.fusionStrength.toFixed(2)})`);

    return fusion;
  }

  /**
   * 检测认同威胁
   * 
   * 基于 Branscombe et al. (1999) 认同威胁理论
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
      throw new Error(`[SocialIdentityEnhanced] 未找到社会认同：${identityId}`);
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
        controlThreat: threatType === 'control',
        
        // 群体分类威胁
        categorizationThreat: threatType === 'categorization',
        
        // 群体接纳威胁
        acceptanceThreat: threatType === 'acceptance'
      },
      
      // 威胁严重程度
      severity: {
        level: options.severity || 0.5,
        impact: 0.0,
        urgency: 0.0
      },
      
      // 情绪影响
      emotionalImpact: {
        primaryEmotions: [],
        intensity: 0.0
      },
      
      // 应对策略 (Branscombe et al. 1999)
      copingStrategies: []
    };

    // 计算威胁影响
    threat.severity.impact = threat.severity.level * identity.identityFeatures.commitment;
    threat.severity.urgency = threat.severity.level * 0.8;

    // 识别情绪影响
    threat.emotionalImpact = this._assessThreatEmotionalImpact(threatType, threat.severity.level);

    // 推荐应对策略
    threat.copingStrategies = this._recommendCopingStrategies(threatType, identity, threat.severity.level);

    this.identityThreats.push(threat);
    console.log(`[SocialIdentityEnhanced] 检测认同威胁：${threatType} (${identity.groupName}, 严重程度：${threat.severity.level.toFixed(2)})`);

    return threat;
  }

  /**
   * 计算集体自尊
   * 
   * 基于 Luhtanen & Crocker (1992) 集体自尊量表
   * 
   * @param {string} identityId - 社会认同 ID
   * @returns {object} 集体自尊对象
   */
  calculateCollectiveSelfEsteem(identityId) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[SocialIdentityEnhanced] 未找到社会认同：${identityId}`);
    }

    const cse = {
      identityId,
      groupName: identity.groupName,
      calculationTime: new Date().toISOString(),
      
      // 集体自尊四个维度 (Luhtanen & Crocker 1992)
      dimensions: {
        // 成员资格自尊 (Membership Esteem)
        // "我是一个有价值的群体成员"
        membershipEsteem: identity.measures.membershipEsteem,
        
        // 私人自尊 (Private Esteem)
        // "我认为我的群体是好的"
        privateEsteem: identity.measures.privateEsteem,
        
        // 公共自尊 (Public Esteem)
        // "我认为其他人认为我的群体是好的"
        publicEsteem: identity.measures.publicEsteem,
        
        // 重要性自尊 (Importance to Identity)
        // "我的群体成员身份对我很重要"
        importanceEsteem: identity.measures.importanceEsteem
      },
      
      // 总体集体自尊
      totalScore: identity.measures.collectiveSelfEsteem,
      
      // 自尊水平分类
      level: this._classifyCSELevel(identity.measures.collectiveSelfEsteem),
      
      // 维度分析
      dimensionAnalysis: this._analyzeCSEDimensions(identity.measures)
    };

    this.collectiveEsteemRecords.push(cse);
    console.log(`[SocialIdentityEnhanced] 计算集体自尊：${identity.groupName} (${cse.level})`);

    return cse;
  }

  /**
   * 生成社会认同干预建议
   * 
   * 基于评估结果生成个性化干预建议
   * 
   * @param {string} identityId - 社会认同 ID
   * @returns {array} 干预建议列表
   */
  generateIdentityInterventions(identityId) {
    const identity = this.socialIdentities.find(id => id.id === identityId);
    if (!identity) {
      throw new Error(`[SocialIdentityEnhanced] 未找到社会认同：${identityId}`);
    }

    const interventions = [];

    // 基于认同显著性的干预
    if (identity.identityFeatures.salience < 0.4) {
      interventions.push({
        type: 'enhance_salience',
        title: '增强认同显著性',
        description: '提高该社会认同在日常生活中的激活频率',
        practices: [
          '增加与群体相关的符号使用 (如服装、标志)',
          '参与群体活动和仪式',
          '与群体成员增加互动',
          '反思群体成员身份对自我的意义'
        ]
      });
    }

    // 基于认同承诺的干预
    if (identity.identityFeatures.commitment < 0.5) {
      interventions.push({
        type: 'strengthen_commitment',
        title: '增强认同承诺',
        description: '深化对群体成员身份的情感承诺',
        practices: [
          '回顾加入群体的初心和动机',
          '识别群体对个人的价值和意义',
          '设定群体相关的个人目标',
          '公开表达对群体的承诺'
        ]
      });
    }

    // 基于集体自尊的干预
    if (identity.measures.collectiveSelfEsteem < 0.5) {
      interventions.push({
        type: 'boost_collective_esteem',
        title: '提升集体自尊',
        description: '增强基于群体身份的自尊感',
        practices: [
          '关注群体的积极特征和成就',
          '参与群体贡献活动',
          '与积极的群体成员建立联系',
          '重构群体身份的积极意义'
        ]
      });
    }

    // 基于认同融合的干预
    const fusion = this.identityFusions.find(f => f.identityId === identityId);
    if (fusion && fusion.fusionStrength < 0.4) {
      interventions.push({
        type: 'deepen_fusion',
        title: '深化认同融合',
        description: '促进个人认同与集体认同的整合',
        practices: [
          '反思"我是谁"与"我们是谁"的关系',
          '体验为群体行动的感受',
          '探索群体价值观与个人价值观的契合点',
          '参与需要个人投入的群体活动'
        ]
      });
    }

    // 通用社会认同练习
    interventions.push({
      type: 'identity_exploration',
      title: '社会认同探索练习',
      description: '深入探索和理解自己的社会认同',
      practices: [
        '列出所有重要的社会认同',
        '评估每个认同的显著性和承诺度',
        '探索认同之间的关系和冲突',
        '思考理想的社会认同结构'
      ]
    });

    return interventions;
  }

  /**
   * 生成社会认同练习
   * 
   * @returns {array} 练习列表
   */
  generateSocialIdentityExercises() {
    return [
      {
        name: '社会认同地图练习',
        duration: '20-30 分钟',
        description: '绘制个人的社会认同地图',
        steps: [
          '1. 列出所有重要的群体成员身份',
          '2. 评估每个认同的重要性 (1-10 分)',
          '3. 标注每个认同的效价 (积极/消极/中性)',
          '4. 识别认同之间的关系 (支持/冲突)',
          '5. 反思认同地图的整体结构'
        ],
        theoreticalBasis: '社会认同理论 + 认同复杂性理论'
      },
      {
        name: '认同显著性觉察练习',
        duration: '10-15 分钟',
        description: '觉察不同情境中认同的激活',
        steps: [
          '1. 回顾一天中的不同情境',
          '2. 注意每个情境中哪个认同最显著',
          '3. 分析是什么因素激活了该认同',
          '4. 观察认同激活对行为的影响',
          '5. 练习有意识地调节认同显著性'
        ],
        theoreticalBasis: '自我分类理论 - 显著性模型'
      },
      {
        name: '集体自尊提升练习',
        duration: '15-20 分钟',
        description: '提升基于群体身份的自尊',
        steps: [
          '1. 选择一个重要的群体身份',
          '2. 列出该群体的 5 个积极特征',
          '3. 回忆自己为群体做出的贡献',
          '4. 想象群体未来的积极发展',
          '5. 表达对群体的感激和承诺'
        ],
        theoreticalBasis: '集体自尊理论 (Luhtanen & Crocker)'
      },
      {
        name: '认同融合体验练习',
        duration: '20-30 分钟',
        description: '体验个人与群体的融合感',
        steps: [
          '1. 静坐，调整呼吸',
          '2. 想象自己与群体的联结',
          '3. 感受"我"与"我们"的交融',
          '4. 体会为群体行动的动力',
          '5. 反思融合体验的意义'
        ],
        theoreticalBasis: '认同融合理论 (Swann et al.)'
      },
      {
        name: '认同威胁应对练习',
        duration: '15-20 分钟',
        description: '学习应对认同威胁的策略',
        steps: [
          '1. 回忆一次认同威胁经历',
          '2. 识别威胁类型和来源',
          '3. 评估当时的情绪反应',
          '4. 学习 Branscombe 应对策略',
          '5. 制定未来应对计划'
        ],
        theoreticalBasis: '认同威胁理论 (Branscombe et al.)'
      }
    ];
  }

  // ========== 内部辅助方法 ==========

  /**
   * 分类显著性水平
   */
  _classifySalienceLevel(score) {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  /**
   * 计算成员资格自尊
   */
  _calculateMembershipEsteem(identity) {
    return (
      identity.identityFeatures.commitment * 0.4 +
      identity.identityFeatures.salience * 0.3 +
      (identity.identityFeatures.valence === 'positive' ? 0.3 : 0.1)
    );
  }

  /**
   * 计算私人自尊
   */
  _calculatePrivateEsteem(identity) {
    return (
      (identity.identityFeatures.valence === 'positive' ? 0.8 : 0.3) * 0.6 +
      identity.sitProcesses.socialIdentification.strength * 0.4
    );
  }

  /**
   * 计算公共自尊
   */
  _calculatePublicEsteem(identity) {
    // 简化：基于效价和显著性估算
    const baseValence = identity.identityFeatures.valence === 'positive' ? 0.7 : 0.3;
    return baseValence * 0.6 + identity.identityFeatures.salience * 0.4;
  }

  /**
   * 分类融合类型
   */
  _classifyFusionType(strength) {
    if (strength >= 0.8) return 'complete_fusion'; // 完全融合
    if (strength >= 0.6) return 'strong_fusion'; // 强融合
    if (strength >= 0.4) return 'moderate_fusion'; // 中等融合
    if (strength >= 0.2) return 'weak_fusion'; // 弱融合
    return 'no_fusion'; // 无融合
  }

  /**
   * 评估威胁情绪影响
   */
  _assessThreatEmotionalImpact(threatType, severity) {
    const emotionMap = {
      'value': ['shame', 'anger', 'frustration'],
      'distinctiveness': ['anxiety', 'confusion'],
      'membership': ['fear', 'sadness', 'loneliness'],
      'control': ['anger', 'frustration', 'helplessness'],
      'categorization': ['annoyance', 'frustration'],
      'acceptance': ['sadness', 'anxiety', 'loneliness']
    };

    const primaryEmotions = emotionMap[threatType] || ['distress'];
    
    return {
      primaryEmotions,
      intensity: severity * 0.8
    };
  }

  /**
   * 推荐应对策略
   */
  _recommendCopingStrategies(threatType, identity, severity) {
    const strategies = [];

    // Branscombe et al. (1999) 认同威胁应对策略
    if (threatType === 'value') {
      strategies.push({
        name: 'social_creativity',
        description: '社会创造性：重新定义比较维度',
        effectiveness: severity > 0.5 ? 0.7 : 0.8
      });
      strategies.push({
        name: 'social_competition',
        description: '社会竞争：直接挑战威胁来源',
        effectiveness: severity > 0.5 ? 0.6 : 0.5
      });
    }

    if (threatType === 'distinctiveness') {
      strategies.push({
        name: 'group_differentiation',
        description: '群体差异化：强调群体独特性',
        effectiveness: 0.7
      });
    }

    if (threatType === 'membership') {
      strategies.push({
        name: 'identity_affirmation',
        description: '认同肯定：强化认同价值',
        effectiveness: 0.8
      });
      strategies.push({
        name: 'boundary_strengthening',
        description: '边界强化：明确群体边界',
        effectiveness: 0.6
      });
    }

    if (threatType === 'control') {
      strategies.push({
        name: 'collective_action',
        description: '集体行动：联合应对威胁',
        effectiveness: 0.7
      });
    }

    // 高承诺认同更可能采用群体水平应对
    if (identity.identityFeatures.commitment > 0.7) {
      strategies.push({
        name: 'group_level_coping',
        description: '群体水平应对：以群体成员身份应对',
        effectiveness: 0.8
      });
    }

    return strategies;
  }

  /**
   * 分类集体自尊水平
   */
  _classifyCSELevel(score) {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  /**
   * 分析集体自尊维度
   */
  _analyzeCSEDimensions(measures) {
    const dimensions = [
      { name: 'membershipEsteem', score: measures.membershipEsteem },
      { name: 'privateEsteem', score: measures.privateEsteem },
      { name: 'publicEsteem', score: measures.publicEsteem },
      { name: 'importanceEsteem', score: measures.importanceEsteem }
    ];

    const maxDim = dimensions.reduce((max, dim) => dim.score > max.score ? dim : max, dimensions[0]);
    const minDim = dimensions.reduce((min, dim) => dim.score < min.score ? dim : min, dimensions[0]);

    return {
      strongest: maxDim.name,
      weakest: minDim.name,
      balance: 1.0 - (maxDim.score - minDim.score) // 平衡度
    };
  }

  /**
   * 获取模块状态
   */
  getStatus() {
    return {
      version: this.version,
      theory: 'Tajfel & Turner SIT + SEP Social Identity',
      timestamp: new Date().toISOString(),
      statistics: {
        socialIdentitiesCount: this.socialIdentities.length,
        identityFusionsCount: this.identityFusions.length,
        identityThreatsCount: this.identityThreats.length,
        collectiveEsteemRecordsCount: this.collectiveEsteemRecords.length
      },
      topIdentities: this.socialIdentities
        .sort((a, b) => b.identityFeatures.commitment - a.identityFeatures.commitment)
        .slice(0, 3)
        .map(id => ({
          groupName: id.groupName,
          commitment: id.identityFeatures.commitment,
          salience: id.identityFeatures.salience
        }))
    };
  }
}

module.exports = { SocialIdentityEnhanced };
