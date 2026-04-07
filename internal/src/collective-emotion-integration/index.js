/**
 * 集体情绪整合模块 (Collective Emotion Integration Module)
 * 
 * 基于 SEP 集体情绪理论和现象学情绪理论
 * 来源：Stanford Encyclopedia of Philosophy
 * 
 * 核心理论框架:
 * - Scheler (1954 [1912]) 共情理论 - 真正的"同一情绪状态"
 * - von Scheve & Salmela (2014) 集体情绪类型学
 * - Smith & Seger (2009) 群体情感理论
 * - Durkheim (1898) 集体意识与集体欢腾
 * - Weber (1922) 社会行动与情绪共享
 * - Phenomenology of Emotion (Husserl, Heidegger, Merleau-Ponty)
 * 
 * 核心概念:
 * 1. 共享情绪 (Shared Emotion) - 个体间相互觉察的相同情绪
 * 2. 群体情绪 (Group Emotion) - 基于群体身份的情绪体验
 * 3. 集体氛围 (Collective Atmosphere) - 弥散性的集体情绪基调
 * 4. 情绪感染 (Emotional Contagion) - 情绪在群体中的传播
 * 5. 情绪协调 (Emotional Coordination) - 群体成员情绪的同步
 * 6. 集体欢腾 (Collective Effervescence) - Durkheim 的集体情绪高峰体验
 * 
 * @version 4.6.0
 * @author HeartFlow Team
 */

class CollectiveEmotionIntegration {
  constructor() {
    this.version = '4.6.0';
    this.sharedEmotions = []; // 共享情绪记录
    this.groupEmotions = []; // 群体情绪记录
    this.collectiveAtmospheres = []; // 集体氛围记录
    this.emotionalContagions = []; // 情绪感染记录
    this.emotionCoordinations = []; // 情绪协调记录
    
    console.log('[CollectiveEmotionIntegration] 模块初始化完成 (v4.6.0)');
    console.log('[CollectiveEmotionIntegration] 理论基础：Scheler + von Scheve & Salmela + SEP Collective Emotion');
  }

  /**
   * 识别集体情绪类型
   * 
   * 基于 von Scheve & Salmela (2014) 集体情绪类型学
   * 
   * @param {string} emotionDescription - 情绪描述
   * @param {object} context - 情境上下文
   * @returns {object} 集体情绪类型识别结果
   */
  identifyCollectiveEmotionType(emotionDescription, context = {}) {
    const identification = {
      description: emotionDescription,
      identificationTime: new Date().toISOString(),
      
      // von Scheve & Salmela (2014) 集体情绪类型
      typeClassification: {
        // 共享情绪 (Shared Emotion)
        // 个体体验相同情绪，且相互觉察
        sharedEmotion: {
          isMatch: false,
          confidence: 0.0,
          features: {
            sameEmotion: false,
            mutualAwareness: false,
            intentionalSharing: false
          }
        },
        
        // 群体情绪 (Group Emotion)
        // 基于群体身份的情绪体验
        groupEmotion: {
          isMatch: false,
          confidence: 0.0,
          features: {
            groupBased: false,
            identityRelevant: false,
            normInfluenced: false
          }
        },
        
        // 集体氛围 (Collective Atmosphere)
        // 弥散性的情绪基调
        collectiveAtmosphere: {
          isMatch: false,
          confidence: 0.0,
          features: {
            diffuse: false,
            pervasive: false,
            background: false
          }
        },
        
        // 情绪感染 (Emotional Contagion)
        // 情绪在群体中传播
        emotionalContagion: {
          isMatch: false,
          confidence: 0.0,
          features: {
            automatic: false,
            spreading: false,
            convergence: false
          }
        },
        
        // 集体欢腾 (Collective Effervescence)
        // Durkheim 的集体情绪高峰
        collectiveEffervescence: {
          isMatch: false,
          confidence: 0.0,
          features: {
            intense: false,
            ritualistic: false,
            solidarity: false
          }
        }
      },
      
      // 主导类型
      dominantType: null,
      dominantConfidence: 0.0
    };

    // 分析情绪描述中的类型特征
    const lowerDesc = emotionDescription.toLowerCase();

    // 共享情绪特征检测
    if (lowerDesc.includes('一起感受') || lowerDesc.includes('共同体验') || 
        lowerDesc.includes('分享情绪') || lowerDesc.includes('same feeling') ||
        lowerDesc.includes('together feel')) {
      identification.typeClassification.sharedEmotion.isMatch = true;
      identification.typeClassification.sharedEmotion.confidence = 0.7;
      identification.typeClassification.sharedEmotion.features.sameEmotion = true;
      identification.typeClassification.sharedEmotion.features.mutualAwareness = true;
    }

    // 群体情绪特征检测
    if (lowerDesc.includes('作为群体') || lowerDesc.includes('群体自豪') ||
        lowerDesc.includes('集体荣誉') || lowerDesc.includes('group pride') ||
        lowerDesc.includes('collective shame')) {
      identification.typeClassification.groupEmotion.isMatch = true;
      identification.typeClassification.groupEmotion.confidence = 0.7;
      identification.typeClassification.groupEmotion.features.groupBased = true;
      identification.typeClassification.groupEmotion.features.identityRelevant = true;
    }

    // 集体氛围特征检测
    if (lowerDesc.includes('氛围') || lowerDesc.includes('气氛') ||
        lowerDesc.includes('弥漫') || lowerDesc.includes('atmosphere') ||
        lowerDesc.includes('mood of the group')) {
      identification.typeClassification.collectiveAtmosphere.isMatch = true;
      identification.typeClassification.collectiveAtmosphere.confidence = 0.6;
      identification.typeClassification.collectiveAtmosphere.features.diffuse = true;
      identification.typeClassification.collectiveAtmosphere.features.pervasive = true;
    }

    // 情绪感染特征检测
    if (lowerDesc.includes'传染' || lowerDesc.includes'传播' ||
        lowerDesc.includes'感染' || lowerDesc.includes('contagion') ||
        lowerDesc.includes('catching emotion')) {
      identification.typeClassification.emotionalContagion.isMatch = true;
      identification.typeClassification.emotionalContagion.confidence = 0.7;
      identification.typeClassification.emotionalContagion.features.automatic = true;
      identification.typeClassification.emotionalContagion.features.spreading = true;
    }

    // 集体欢腾特征检测
    if (lowerDesc.includes('狂欢') || lowerDesc.includes('高峰体验') ||
        lowerDesc.includes('集体兴奋') || lowerDesc.includes('effervescence') ||
        lowerDesc.includes('collective euphoria')) {
      identification.typeClassification.collectiveEffervescence.isMatch = true;
      identification.typeClassification.collectiveEffervescence.confidence = 0.6;
      identification.typeClassification.collectiveEffervescence.features.intense = true;
      identification.typeClassification.collectiveEffervescence.features.solidarity = true;
    }

    // 确定主导类型
    const types = Object.entries(identification.typeClassification)
      .filter(([, data]) => data.isMatch)
      .sort((a, b) => b[1].confidence - a[1].confidence);

    if (types.length > 0) {
      identification.dominantType = types[0][0];
      identification.dominantConfidence = types[0][1].confidence;
    }

    return identification;
  }

  /**
   * 记录共享情绪
   * 
   * 基于 Scheler 的共情理论和 Walther 的共享经验三重结构
   * 
   * @param {string} emotionType - 情绪类型
   * @param {array} participants - 参与者列表
   * @param {object} options - 配置选项
   * @returns {object} 共享情绪对象
   */
  recordSharedEmotion(emotionType, participants, options = {}) {
    const sharedEmotion = {
      id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotionType,
      participants,
      recordTime: new Date().toISOString(),
      
      // Scheler 共享情绪核心特征
      schelerFeatures: {
        // 真正的"同一情绪状态" (numerically identical)
        numericallyIdentical: options.numericallyIdentical || false,
        
        // 无需思考对方的直接共享
        directSharing: options.directSharing || false,
        
        // 情绪共同体感
        communityFeeling: options.communityFeeling || 0.5
      },
      
      // Walther 共享经验三重结构
      waltherStructure: {
        // 1. 体验 (Experience): 双方都体验该情绪
        experience: {
          participantA: options.experienceA || true,
          participantB: options.experienceB || true,
          sameEmotion: options.sameEmotion || true
        },
        
        // 2. 共情 (Empathy): 双方都共情对方的情绪
        empathy: {
          aEmpathizeB: options.aEmpathizeB || false,
          bEmpathizeA: options.bEmpathizeA || false
        },
        
        // 3. 认同 (Identification): 双方都认同对方的体验
        identification: {
          aIdentifyB: options.aIdentifyB || false,
          bIdentifyA: options.bIdentifyA || false
        },
        
        // 4. 相互觉察 (Mutual Awareness): 双方都知道对方知道
        mutualAwareness: {
          level: options.mutualAwarenessLevel || 0, // 0-3 阶
          complete: options.completeMutualAwareness || false
        }
      },
      
      // 共享强度
      sharingIntensity: this._calculateSharingIntensity(options),
      
      // 共享质量
      sharingQuality: 'unknown'
    };

    sharedEmotion.sharingQuality = this._classifySharingQuality(sharedEmotion.sharingIntensity);

    this.sharedEmotions.push(sharedEmotion);
    console.log(`[CollectiveEmotionIntegration] 记录共享情绪：${emotionType} (${participants.length}人，质量：${sharedEmotion.sharingQuality})`);

    return sharedEmotion;
  }

  /**
   * 记录群体情绪
   * 
   * 基于 Smith & Seger (2009) 群体情感理论
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} groupName - 群体名称
   * @param {string} triggerEvent - 触发事件
   * @param {object} options - 配置选项
   * @returns {object} 群体情绪对象
   */
  recordGroupEmotion(emotionType, groupName, triggerEvent, options = {}) {
    const groupEmotion = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotionType,
      groupName,
      triggerEvent,
      recordTime: new Date().toISOString(),
      
      // Smith & Seger (2009) 群体情感核心特征
      smithSegerFeatures: {
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
      
      // 群体情绪类型 (von Scheve & Salmela 2014)
      collectiveType: this._classifyCollectiveType(emotionType, options),
      
      // 功能分析
      functionalAnalysis: this._analyzeEmotionFunction(emotionType, groupName)
    };

    this.groupEmotions.push(groupEmotion);
    console.log(`[CollectiveEmotionIntegration] 记录群体情绪：${emotionType} (${groupName})`);

    return groupEmotion;
  }

  /**
   * 评估情绪感染
   * 
   * 基于情绪感染理论 (Hatfield et al. 1993)
   * 
   * @param {string} sourceEmotion - 源情绪
   * @param {array} targets - 感染目标列表
   * @param {object} options - 配置选项
   * @returns {object} 情绪感染对象
   */
  assessEmotionalContagion(sourceEmotion, targets, options = {}) {
    const contagion = {
      id: `contagion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceEmotion,
      targets,
      assessmentTime: new Date().toISOString(),
      
      // Hatfield et al. (1993) 情绪感染核心机制
      contagionMechanisms: {
        // 模仿 (Mimicry)
        mimicry: options.mimicry || 0.7,
        
        // 反馈 (Feedback)
        feedback: options.feedback || 0.6,
        
        // 感染 (Contagion)
        actualContagion: options.actualContagion || 0.5
      },
      
      // 感染特征
      contagionFeatures: {
        // 自动性
        automaticity: options.automaticity || 0.8,
        
        // 无意识性
        unconsciousness: options.unconsciousness || 0.7,
        
        // 快速性
        rapidity: options.rapidity || 0.8,
        
        // 收敛性 (情绪趋同)
        convergence: options.convergence || 0.6
      },
      
      // 感染强度
      contagionStrength: this._calculateContagionStrength(options),
      
      // 感染范围
      contagionSpread: {
        directTargets: targets.length,
        estimatedSecondary: Math.round(targets.length * 0.5),
        estimatedTertiary: Math.round(targets.length * 0.25)
      }
    };

    this.emotionalContagions.push(contagion);
    console.log(`[CollectiveEmotionIntegration] 评估情绪感染：${sourceEmotion} (${targets.length}人，强度：${contagion.contagionStrength.toFixed(2)})`);

    return contagion;
  }

  /**
   * 协调群体情绪
   * 
   * 基于情绪协调理论 (Emotional Coordination Theory)
   * 
   * @param {string} groupName - 群体名称
   * @param {array} memberEmotions - 成员情绪列表
   * @param {object} options - 配置选项
   * @returns {object} 情绪协调对象
   */
  coordinateGroupEmotions(groupName, memberEmotions, options = {}) {
    const coordination = {
      id: `coordination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupName,
      memberEmotions,
      coordinationTime: new Date().toISOString(),
      
      // 情绪协调维度
      coordinationDimensions: {
        // 情绪同步性
        synchrony: this._calculateEmotionSynchrony(memberEmotions),
        
        // 情绪一致性
        consistency: this._calculateEmotionConsistency(memberEmotions),
        
        // 情绪互补性
        complementarity: this._calculateEmotionComplementarity(memberEmotions),
        
        // 情绪调节协同
        regulationCoordination: options.regulationCoordination || 0.5
      },
      
      // 协调策略
      coordinationStrategies: this._generateCoordinationStrategies(memberEmotions, options),
      
      // 协调质量
      coordinationQuality: 'unknown'
    };

    // 计算整体协调度
    const avgCoordination = (
      coordination.coordinationDimensions.synchrony +
      coordination.coordinationDimensions.consistency +
      coordination.coordinationDimensions.complementarity +
      coordination.coordinationDimensions.regulationCoordination
    ) / 4;

    coordination.coordinationQuality = this._classifyCoordinationQuality(avgCoordination);

    this.emotionCoordinations.push(coordination);
    console.log(`[CollectiveEmotionIntegration] 协调群体情绪：${groupName} (质量：${coordination.coordinationQuality})`);

    return coordination;
  }

  /**
   * 生成集体情绪干预技术
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} collectiveType - 集体情绪类型
   * @returns {array} 干预技术列表
   */
  generateCollectiveEmotionInterventions(emotionType, collectiveType) {
    const interventions = [];

    // Scheler 式集体情绪干预
    if (collectiveType === 'shared_emotion') {
      interventions.push({
        name: 'Scheler 共情深化练习',
        duration: '15-20 分钟',
        description: '基于 Scheler 共情理论的深度情绪共享',
        steps: [
          '1. 静坐，调整呼吸，开放心态',
          '2. 想象对方的情绪体验',
          '3. 不思考、不分析，直接感受',
          '4. 体会"同一情绪状态"的给定性',
          '5. 确认情绪共同体的存在'
        ],
        theoreticalBasis: 'Scheler 共情理论'
      });
    }

    // Walther 共享经验干预
    if (collectiveType === 'shared_emotion' || collectiveType === 'group_emotion') {
      interventions.push({
        name: 'Walther 四步共享练习',
        duration: '20-30 分钟',
        description: '基于 Walther 共享经验三重结构',
        steps: [
          '1. 体验：充分体验当前的情绪状态',
          '2. 共情：感受对方的情绪体验',
          '3. 认同：与对方的体验建立认同',
          '4. 觉察：确认相互的共享意识'
        ],
        theoreticalBasis: 'Walther 共享经验理论'
      });
    }

    // 集体欢腾干预
    if (collectiveType === 'collective_effervescence') {
      interventions.push({
        name: '集体欢腾引导练习',
        duration: '30-60 分钟',
        description: 'Durkheim 集体欢腾体验引导',
        steps: [
          '1. 聚集群体，创造共同空间',
          '2. 进行同步活动 (歌唱/舞蹈/仪式)',
          '3. 增强情绪强度和同步性',
          '4. 体验集体超越感',
          '5. 整合体验，强化群体团结'
        ],
        theoreticalBasis: 'Durkheim 集体欢腾理论'
      });
    }

    // 情绪感染管理
    if (collectiveType === 'emotional_contagion') {
      interventions.push({
        name: '情绪感染觉察与管理',
        duration: '10-15 分钟',
        description: '觉察和管理情绪感染过程',
        steps: [
          '1. 觉察当前情绪状态',
          '2. 识别情绪来源 (自己/他人)',
          '3. 评估情绪的适应性',
          '4. 选择接纳或调节',
          '5. 有意识地影响群体情绪'
        ],
        theoreticalBasis: '情绪感染理论 (Hatfield et al.)'
      });
    }

    // 通用集体情绪调节
    interventions.push({
      name: '集体情绪调节练习',
      duration: '15-20 分钟',
      description: '调节和引导集体情绪方向',
      steps: [
        '1. 评估当前集体情绪状态',
        '2. 确定理想的情绪方向',
        '3. 使用语言和非语言线索引导',
        '4. 强化积极情绪表达',
        '5. 共同创造情绪氛围'
      ],
      theoreticalBasis: '集体情绪调节理论'
    });

    return interventions;
  }

  /**
   * 获取模块状态
   */
  getStatus() {
    return {
      version: this.version,
      theory: 'Scheler + von Scheve & Salmela + SEP Collective Emotion',
      timestamp: new Date().toISOString(),
      statistics: {
        sharedEmotionsCount: this.sharedEmotions.length,
        groupEmotionsCount: this.groupEmotions.length,
        collectiveAtmospheresCount: this.collectiveAtmospheres.length,
        emotionalContagionsCount: this.emotionalContagions.length,
        emotionCoordinationsCount: this.emotionCoordinations.length
      },
      recentSharedEmotions: this.sharedEmotions.slice(-3),
      recentGroupEmotions: this.groupEmotions.slice(-3)
    };
  }

  // ========== 内部辅助方法 ==========

  /**
   * 计算共享强度
   */
  _calculateSharingIntensity(options) {
    const factors = [
      options.experienceA && options.experienceB ? 1 : 0,
      options.sameEmotion ? 1 : 0,
      options.aEmpathizeB && options.bEmpathizeA ? 1 : 0,
      options.aIdentifyB && options.bIdentifyA ? 1 : 0,
      options.completeMutualAwareness ? 1 : 0
    ];
    return factors.filter(f => f).length / factors.length;
  }

  /**
   * 分类共享质量
   */
  _classifySharingQuality(intensity) {
    if (intensity >= 0.8) return 'excellent';
    if (intensity >= 0.6) return 'good';
    if (intensity >= 0.4) return 'moderate';
    if (intensity >= 0.2) return 'low';
    return 'minimal';
  }

  /**
   * 获取情绪效价
   */
  _getEmotionValence(emotionType) {
    const positiveEmotions = ['pride', 'gratitude', 'hope', 'joy', 'love', 'excitement'];
    const negativeEmotions = ['shame', 'guilt', 'anger', 'fear', 'sadness', 'anxiety'];
    const lower = emotionType.toLowerCase();
    if (positiveEmotions.some(e => lower.includes(e))) return 'positive';
    if (negativeEmotions.some(e => lower.includes(e))) return 'negative';
    return 'neutral';
  }

  /**
   * 分类集体情绪类型
   */
  _classifyCollectiveType(emotionType, options) {
    if (options.sharedLevel > 0.7) return 'shared_emotion';
    if (options.sharedLevel > 0.4) return 'group_emotion';
    if (options.diffuse) return 'collective_atmosphere';
    return 'individual_emotion_in_group';
  }

  /**
   * 分析情绪功能
   */
  _analyzeEmotionFunction(emotionType, groupName) {
    const functions = {
      pride: {
        function: '增强群体凝聚力和自尊',
        adaptive: true
      },
      shame: {
        function: '维护群体规范，促进顺从',
        adaptive: 'depends'
      },
      anger: {
        function: '激发集体行动，对抗威胁',
        adaptive: 'depends'
      },
      fear: {
        function: '警示群体危险，促进保护',
        adaptive: 'depends'
      },
      gratitude: {
        function: '强化群体互惠，促进合作',
        adaptive: true
      }
    };

    return functions[emotionType.toLowerCase()] || {
      function: '情绪功能因情境而异',
      adaptive: 'unknown'
    };
  }

  /**
   * 计算感染强度
   */
  _calculateContagionStrength(options) {
    const factors = [
      options.mimicry || 0.5,
      options.feedback || 0.5,
      options.actualContagion || 0.5,
      options.automaticity || 0.5,
      options.convergence || 0.5
    ];
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  /**
   * 计算情绪同步性
   */
  _calculateEmotionSynchrony(memberEmotions) {
    if (memberEmotions.length < 2) return 1.0;
    
    // 简化：基于情绪类型一致性计算
    const emotionTypes = memberEmotions.map(e => e.type);
    const uniqueTypes = new Set(emotionTypes);
    return 1.0 - (uniqueTypes.size - 1) / memberEmotions.length;
  }

  /**
   * 计算情绪一致性
   */
  _calculateEmotionConsistency(memberEmotions) {
    if (memberEmotions.length < 2) return 1.0;
    
    // 基于效价一致性
    const valences = memberEmotions.map(e => this._getEmotionValence(e.type));
    const uniqueValences = new Set(valences);
    return 1.0 - (uniqueValences.size - 1) / memberEmotions.length;
  }

  /**
   * 计算情绪互补性
   */
  _calculateEmotionComplementarity(memberEmotions) {
    // 简化：某些情绪组合具有互补性
    const complementaryPairs = [
      ['fear', 'anger'], // 恐惧 + 愤怒 = 战斗或逃跑
      ['sadness', 'hope'], // 悲伤 + 希望 = 哀悼与恢复
      ['pride', 'gratitude'] // 自豪 + 感激 = 团结
    ];
    
    const types = memberEmotions.map(e => e.type.toLowerCase());
    let hasComplementary = false;
    
    complementaryPairs.forEach(([a, b]) => {
      if (types.includes(a) && types.includes(b)) {
        hasComplementary = true;
      }
    });
    
    return hasComplementary ? 0.8 : 0.5;
  }

  /**
   * 生成协调策略
   */
  _generateCoordinationStrategies(memberEmotions, options) {
    const strategies = [];
    
    const valences = memberEmotions.map(e => this._getEmotionValence(e.type));
    const hasMixedValence = new Set(valences).size > 1;
    
    if (hasMixedValence) {
      strategies.push({
        name: '情绪整合',
        description: '帮助群体整合不同效价的情绪',
        priority: 'high'
      });
    }
    
    strategies.push({
      name: '情绪验证',
      description: '验证和接纳所有成员的情绪体验',
      priority: 'medium'
    });
    
    strategies.push({
      name: '共同调节',
      description: '引导群体向适应性情绪状态调节',
      priority: 'medium'
    });
    
    return strategies;
  }

  /**
   * 分类协调质量
   */
  _classifyCoordinationQuality(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'low';
    return 'poor';
  }
}

module.exports = { CollectiveEmotionIntegration };
