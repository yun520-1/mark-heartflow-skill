/**
 * 集体意向性模块 (Collective Intentionality Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 集体意向性理论
 * 
 * 核心理论来源:
 * - Searle, J. (1990, 1995). "Collective Intentions and Actions" - 原始意向性
 * - Bratman, M. (1999). "Shared Intention" - 共享意向性理论
 * - Gilbert, M. (1990). "Walking Together" - 联合承诺理论
 * - Tuomela, R. & Miller, K. (1988). "We-Intentions" - 我们意图分析
 * - Scheler, M. (1954 [1912]). "The Nature of Sympathy" - 现象学集体情绪
 * - Walther, G. (1923). "Zur Ontologie der sozialen Gebilde" - 共享体验分析
 * - SEP Entry: Collective Intentionality (2023)
 * 
 * 版本：v3.22.0 新增
 */

class CollectiveIntentionalityModule {
  constructor() {
    this.version = '3.46.0';
    this.name = '集体意向性模块 (SEP 深化版)';
    
    // 集体意向性状态
    this.collectiveAttitudes = [];
    this.jointCommitments = [];
    this.sharedIntentions = [];
    this.weIntentions = [];
    
    // 集体情绪体验
    this.collectiveEmotions = [];
    
    // 参与者模型
    this.participants = new Map();
    
    // 理论配置 (SEP Fall 2025 Edition 深化)
    this.theoreticalFramework = {
      searle: {
        // Searle (1990, 1995): 原始意向性理论
        // 集体意向性是原始的，不可还原为个体意向性
        primitiveCollectiveIntentionality: true,
        level: 'original', // original vs derived
        keyInsight: '我们意图是原始的，不能分解为我意图 + 你意图',
        example: '我们意图一起抬钢琴 ≠ 我意图抬 + 你意图抬'
      },
      bratman: {
        // Bratman (1999): 共享意向性理论
        // 共享意向性 = 相互响应的个体意向性 + 共同知识
        sharedIntentionAsWeb: true,
        mutualResponsiveness: true,
        commitmentToCoordination: true,
        keyInsight: '共享意向性是个体意向性的网状结构',
        conditions: [
          '相互响应：每个参与者的意图响应他人的意图',
          '协调承诺：承诺协调行动',
          '相互支持：承诺在需要时互相帮助'
        ]
      },
      gilbert: {
        // Gilbert (1990): 联合承诺理论
        // 集体意向性 = 联合承诺 + 共同知识
        jointCommitment: true,
        normativeExpectations: true,
        keyInsight: '联合承诺创造规范性期望和义务',
        features: {
          irreducible: '联合承诺不是个体承诺的总和',
          createsObligations: '参与者对彼此负有义务',
          violationWarrantsReproach: '违背承诺会受到规范性谴责'
        }
      },
      tuomela: {
        // Tuomela & Miller (1988): 我们意图分析
        // 我们意图 = 个体意图 + 集体目标信念
        weIntentionAnalysis: true,
        collectiveGoalBelief: true,
        keyInsight: '我们意图包含个体成分和集体信念',
        structure: {
          individualComponent: '我意图为集体目标做贡献',
          collectiveBelief: '我们相信集体目标是可实现的',
          mutualBelief: '每个参与者都相信其他参与者也会做贡献'
        }
      },
      scheler: {
        // Scheler (1954 [1912]): 现象学集体情绪
        // 集体情绪是真实的共享体验，数值上同一
        keyInsight: '集体情绪是多个心灵处于数值上相同的状态',
        paradigmCase: '父母在孩子病床前共同悲伤，无需思考彼此',
        features: {
          numericalIdentity: '同一情绪状态在多个心灵中',
          directSharing: '无需推理或共情的直接共享',
          nonAggregate: '不是个体情绪的聚合'
        }
      },
      walther: {
        // Walther (1923): 共享体验分析
        // 共享体验需要四层递归意识
        keyInsight: '共享体验需要相互的共情意识',
        conditions: [
          '条件 1: A 体验 x，B 体验 x',
          '条件 2: A 共情 B 的体验，B 共情 A 的体验',
          '条件 3: A 认同 B 的体验，B 认同 A 的体验',
          '条件 4: 相互的共情意识 (A 知道 B 共情 A，反之亦然)'
        ]
      },
      durkheim: {
        // Durkheim (1898): 集体意识
        // 社会事实需要集体意识解释
        keyInsight: '集体意识超越个体态度总和',
        example: '群体性情绪爆发，参与者无法用个人观点解释'
      },
      weber: {
        // Weber (1922): 社会行动理论
        // 集体意向性作为社会行动基础
        keyInsight: '基于共享目标的行动导向',
        distinction: '战略性相互依赖 vs 共享意向性'
      }
    };
  }

  /**
   * 形成"我们意图"(We-Intention)
   * 
   * 基于 Searle 和 Tuomela & Miller 的理论
   * 
   * @param {string} collectiveGoal - 集体目标
   * @param {string[]} participants - 参与者列表
   * @param {object} options - 配置选项
   * @returns {object} 我们意图对象
   */
  formWeIntention(collectiveGoal, participants, options = {}) {
    const {
      intentionType = 'cooperative', // cooperative vs competitive
      commitmentLevel = 0.8, // 承诺强度 0-1
      temporalScope = 'short-term' // short-term vs long-term
    } = options;

    const weIntention = {
      id: this._generateId('we-int'),
      type: 'we-intention',
      collectiveGoal: collectiveGoal,
      participants: participants,
      intentionType: intentionType,
      commitmentLevel: commitmentLevel,
      temporalScope: temporalScope,
      createdAt: new Date().toISOString(),
      
      // Searle 的原始意向性特征
      intentionalityStatus: {
        isPrimitive: true, // 不可还原为个体意向性
        aboutness: collectiveGoal, // 意向的"关于性"
        existenceStatus: this._assessExistenceStatus(collectiveGoal)
      },
      
      // Tuomela & Miller 的我们意图分析
      tuomelaAnalysis: {
        // 个体意图成分
        individualComponent: `我意图为集体目标 "${collectiveGoal}" 做贡献`,
        // 集体目标信念
        collectiveGoalBelief: `我们相信 "${collectiveGoal}" 是可实现的`,
        // 相互信念
        mutualBelief: '每个参与者都相信其他参与者也会为集体目标做贡献'
      },
      
      // Bratman 的共享意向性特征
      bratmanFeatures: {
        mutualResponsiveness: true, // 相互响应
        commitmentToCoordination: true, // 协调承诺
        commitmentToMutualSupport: true // 相互支持承诺
      },
      
      // Gilbert 的联合承诺特征
      gilbertFeatures: {
        jointCommitment: true,
        normativeExpectations: true, // 规范性期望
        obligationToOthers: true // 对他人的义务
      },
      
      status: 'active'
    };

    this.weIntentions.push(weIntention);
    
    // 为每个参与者创建参与记录
    participants.forEach(participant => {
      if (!this.participants.has(participant)) {
        this.participants.set(participant, {
          id: participant,
          joinedAt: new Date().toISOString(),
          weIntentions: [],
          commitments: [],
          collectiveEmotions: []
        });
      }
      this.participants.get(participant).weIntentions.push(weIntention.id);
    });

    return weIntention;
  }

  /**
   * 形成联合承诺 (Joint Commitment)
   * 
   * 基于 Margaret Gilbert 的联合承诺理论
   * 
   * @param {string} commitmentContent - 承诺内容
   * @param {string[]} participants - 参与者
   * @param {object} options - 配置选项
   * @returns {object} 联合承诺对象
   */
  formJointCommitment(commitmentContent, participants, options = {}) {
    const {
      normType = 'cooperative', // cooperative vs constitutive
      enforcementMechanism = 'social' // social vs internal
    } = options;

    const jointCommitment = {
      id: this._generateId('joint-com'),
      type: 'joint-commitment',
      content: commitmentContent,
      participants: participants,
      normType: normType,
      enforcementMechanism: enforcementMechanism,
      createdAt: new Date().toISOString(),
      
      // Gilbert 理论核心特征
      gilbertFeatures: {
        // 联合承诺不是个体承诺的总和
        isIrreducible: true,
        // 创造规范性期望
        createsNormativeExpectations: true,
        // 参与者有义务遵守
        createsObligations: true,
        // 违背承诺会受到规范性谴责
        violationWarrantsReproach: true
      },
      
      // 承诺状态
      status: {
        active: true,
        fulfilled: false,
        violated: false,
        renegotiated: false
      },
      
      // 规范性结构
      normativeStructure: {
        // 每个参与者对其他人负有义务
        obligations: participants.map(p => ({
          obligor: p,
          obligees: participants.filter(other => other !== p),
          content: commitmentContent
        })),
        // 规范性期望
        expectations: participants.map(p => ({
          expecter: p,
          expected: participants.filter(other => other !== p),
          content: commitmentContent
        }))
      }
    };

    this.jointCommitments.push(jointCommitment);

    // 更新参与者记录
    participants.forEach(participant => {
      if (!this.participants.has(participant)) {
        this.participants.set(participant, {
          id: participant,
          joinedAt: new Date().toISOString(),
          weIntentions: [],
          commitments: [],
          collectiveEmotions: []
        });
      }
      this.participants.get(participant).commitments.push(jointCommitment.id);
    });

    return jointCommitment;
  }

  /**
   * 形成集体情绪体验
   * 
   * 基于 Scheler 和 Walther 的现象学集体情绪理论
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} emotionObject - 情绪对象
   * @param {string[]} participants - 参与者
   * @param {object} options - 配置选项
   * @returns {object} 集体情绪对象
   */
  formCollectiveEmotion(emotionType, emotionObject, participants, options = {}) {
    const {
      intensity = 0.7, // 情绪强度 0-1
      synchrony = 0.8, // 情绪同步性 0-1
      sharedAwareness = true // 是否意识到彼此的情绪
    } = options;

    const collectiveEmotion = {
      id: this._generateId('coll-emo'),
      type: 'collective-emotion',
      emotionType: emotionType,
      emotionObject: emotionObject,
      participants: participants,
      intensity: intensity,
      synchrony: synchrony,
      sharedAwareness: sharedAwareness,
      createdAt: new Date().toISOString(),
      
      // Scheler 的集体情绪理论
      schelerAnalysis: {
        // 集体情绪是真实的，不是个体情绪的聚合
        isRealCollectivePhenomenon: true,
        // 情绪体验的"同一性"
        numericalIdentity: '多个心灵处于数值上相同的情绪状态',
        // 情绪的直接共享 (无需通过推理)
        directSharing: true,
        // 例子：父母在孩子的病床前共同悲伤
        paradigmCase: '父母在孩子病床前共同悲伤，无需思考彼此'
      },
      
      // Walther 的共享体验分析
      waltherAnalysis: {
        // 条件 1: 每个人都体验情绪 x
        condition1_met: true,
        // 条件 2: 每个人共情他人的体验
        condition2_met: sharedAwareness,
        // 条件 3: 每个人认同他人的体验
        condition3_met: synchrony > 0.5,
        // 条件 4: 相互的共情意识
        condition4_met: sharedAwareness && synchrony > 0.7
      },
      
      // 现象学特征
      phenomenologicalFeatures: {
        // "我们感"(we-feeling)
        weFeeling: intensity * synchrony,
        // 情绪融合程度
        emotionalFusion: synchrony,
        // 自我 - 他人边界渗透性
        selfOtherPermeability: synchrony * 0.8
      },
      
      // 集体情绪类型学 (von Scheve & Salmela 2014)
      taxonomy: {
        // 基于共同关注
        commonFocus: true,
        // 基于情绪传染
        emotionalContagion: synchrony > 0.6,
        // 基于规范性期望
        normativeExpectation: true,
        // 基于集体仪式
        ritualistic: false
      },
      
      status: 'active'
    };

    this.collectiveEmotions.push(collectiveEmotion);

    // 更新参与者记录
    participants.forEach(participant => {
      if (!this.participants.has(participant)) {
        this.participants.set(participant, {
          id: participant,
          joinedAt: new Date().toISOString(),
          weIntentions: [],
          commitments: [],
          collectiveEmotions: []
        });
      }
      this.participants.get(participant).collectiveEmotions.push(collectiveEmotion.id);
    });

    return collectiveEmotion;
  }

  /**
   * 分析集体意向性层次
   * 
   * 基于 Tuomela 的意向性层次理论
   * 
   * @returns {object} 层次分析结果
   */
  analyzeIntentionalityLevels() {
    const levels = {
      level0: {
        name: '无意向性',
        description: '纯物理状态',
        examples: ['石头', '水分子运动']
      },
      level1: {
        name: '派生意向性',
        description: '如语言、图像的意向性',
        examples: ['地图', '路标', '文字']
      },
      level2: {
        name: '原创意向性',
        description: '心灵状态的固有意向性',
        examples: ['个体信念', '个体欲望']
      },
      level3: {
        name: '反思意向性',
        description: '关于自身心理状态的意向性',
        examples: ['我相信我相信 p', '我知道我在害怕']
      },
      level4: {
        name: '高阶意向性',
        description: '关于他人心理状态的意向性',
        examples: ['我相信你希望 p', '她知道他在怀疑']
      },
      level5: {
        name: '集体意向性',
        description: '"我们"的意向性',
        examples: ['我们意图做 X', '我们相信 p', '我们承诺做 Y'],
        currentStatus: {
          weIntentionsCount: this.weIntentions.length,
          jointCommitmentsCount: this.jointCommitments.length,
          collectiveEmotionsCount: this.collectiveEmotions.length
        }
      }
    };

    return levels;
  }

  /**
   * 检查集体意向性一致性
   * 
   * 检测集体意向性状态中的冲突和不一致
   * 
   * @returns {object} 一致性检查结果
   */
  checkCollectiveCoherence() {
    const issues = [];
    
    // 检查我们意图之间的一致性
    for (let i = 0; i < this.weIntentions.length; i++) {
      for (let j = i + 1; j < this.weIntentions.length; j++) {
        const wi1 = this.weIntentions[i];
        const wi2 = this.weIntentions[j];
        
        // 检查目标冲突
        if (this._goalsConflict(wi1.collectiveGoal, wi2.collectiveGoal)) {
          issues.push({
            type: 'goal-conflict',
            severity: 'high',
            description: `集体目标冲突: "${wi1.collectiveGoal}" vs "${wi2.collectiveGoal}"`,
            involved: [wi1.id, wi2.id]
          });
        }
        
        // 检查参与者冲突
        const commonParticipants = wi1.participants.filter(p => 
          wi2.participants.includes(p)
        );
        if (commonParticipants.length > 0 && 
            wi1.intentionType === 'cooperative' && 
            wi2.intentionType === 'competitive') {
          issues.push({
            type: 'participant-conflict',
            severity: 'medium',
            description: `参与者在合作性和竞争性意图之间冲突`,
            involved: [wi1.id, wi2.id],
            commonParticipants: commonParticipants
          });
        }
      }
    }
    
    // 检查联合承诺之间的一致性
    for (let i = 0; i < this.jointCommitments.length; i++) {
      for (let j = i + 1; j < this.jointCommitments.length; j++) {
        const jc1 = this.jointCommitments[i];
        const jc2 = this.jointCommitments[j];
        
        // 检查承诺内容冲突
        if (this._commitmentsConflict(jc1.content, jc2.content)) {
          issues.push({
            type: 'commitment-conflict',
            severity: 'high',
            description: `联合承诺冲突: "${jc1.content}" vs "${jc2.content}"`,
            involved: [jc1.id, jc2.id]
          });
        }
      }
    }
    
    // 检查我们意图与联合承诺的一致性
    this.weIntentions.forEach(wi => {
      this.jointCommitments.forEach(jc => {
        const commonParticipants = wi.participants.filter(p => 
          jc.participants.includes(p)
        );
        if (commonParticipants.length > 0) {
          // 检查意图和承诺是否一致
          if (this._intentionCommitmentMismatch(wi.collectiveGoal, jc.content)) {
            issues.push({
              type: 'intention-commitment-mismatch',
              severity: 'medium',
              description: `我们意图与联合承诺不匹配`,
              involved: [wi.id, jc.id],
              commonParticipants: commonParticipants
            });
          }
        }
      });
    });

    return {
      isCoherent: issues.length === 0,
      issues: issues,
      summary: {
        totalWeIntentions: this.weIntentions.length,
        totalJointCommitments: this.jointCommitments.length,
        totalCollectiveEmotions: this.collectiveEmotions.length,
        issuesCount: issues.length,
        highSeverityIssues: issues.filter(i => i.severity === 'high').length,
        mediumSeverityIssues: issues.filter(i => i.severity === 'medium').length
      }
    };
  }

  /**
   * 采取集体意向立场
   * 
   * 基于 Dennett 的意向立场理论，应用于集体
   * 
   * @param {string} collectiveName - 集体名称
   * @param {object} collectiveBeliefs - 集体信念
   * @param {object} collectiveDesires - 集体欲望
   * @returns {object} 集体意向立场分析
   */
  takeCollectiveIntentionalStance(collectiveName, collectiveBeliefs, collectiveDesires) {
    return {
      collective: collectiveName,
      stance: 'intentional',
      
      // 集体信念归因
      attributedBeliefs: collectiveBeliefs,
      
      // 集体欲望归因
      attributedDesires: collectiveDesires,
      
      // 基于信念 - 欲望框架预测集体行为
      predictedBehavior: this._predictCollectiveBehavior(
        collectiveName,
        collectiveBeliefs,
        collectiveDesires
      ),
      
      // Dennett 三分法
      stanceComparison: {
        intentional: {
          description: '将集体视为理性行动者，基于信念 - 欲望预测行为',
         'applicability': '高 (当集体有明确的决策机制时)'
        },
        design: {
          description: '基于集体的设计/功能预测行为',
          'applicability': '中 (当集体有明确的组织结构时)'
        },
        physical: {
          description: '基于物理规律预测集体行为',
          'applicability': '低 (仅适用于大规模群体动力学)'
        }
      }
    };
  }

  /**
   * 获取集体意向性状态摘要
   * 
   * @returns {object} 状态摘要
   */
  getStatus() {
    const coherence = this.checkCollectiveCoherence();
    
    return {
      version: this.version,
      name: this.name,
      
      // 统计信息
      statistics: {
        weIntentionsCount: this.weIntentions.length,
        jointCommitmentsCount: this.jointCommitments.length,
        collectiveEmotionsCount: this.collectiveEmotions.length,
        participantsCount: this.participants.size,
        collectiveAttitudesCount: this.collectiveAttitudes.length
      },
      
      // 一致性状态
      coherence: coherence,
      
      // 理论框架
      theoreticalFramework: this.theoreticalFramework,
      
      // 参与者列表
      participants: Array.from(this.participants.entries()).map(([id, data]) => ({
        id: id,
        weIntentionsCount: data.weIntentions.length,
        commitmentsCount: data.commitments.length,
        collectiveEmotionsCount: data.collectiveEmotions.length
      }))
    };
  }

  // ==================== 私有方法 ====================

  _generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _assessExistenceStatus(object) {
    // 评估意向对象的存在状态
    const nonExistentObjects = ['独角兽', '凤凰', '永动机', '圆的方'];
    const abstractObjects = ['数字', '正义', '美', '真理'];
    
    if (nonExistentObjects.some(o => object.includes(o))) {
      return 'non-existent';
    } else if (abstractObjects.some(o => object.includes(o))) {
      return 'abstract';
    } else {
      return 'existent';
    }
  }

  _goalsConflict(goal1, goal2) {
    // 简化的目标冲突检测
    const conflictPairs = [
      ['赢', '输'],
      ['合作', '竞争'],
      ['分享', '独占'],
      ['公开', '保密']
    ];
    
    return conflictPairs.some(([a, b]) => 
      (goal1.includes(a) && goal2.includes(b)) ||
      (goal1.includes(b) && goal2.includes(a))
    );
  }

  _commitmentsConflict(commitment1, commitment2) {
    // 简化的承诺冲突检测
    return this._goalsConflict(commitment1, commitment2);
  }

  _intentionCommitmentMismatch(intention, commitment) {
    // 简化的意图 - 承诺不匹配检测
    return this._goalsConflict(intention, commitment);
  }

  _predictCollectiveBehavior(collective, beliefs, desires) {
    // 基于信念 - 欲望框架预测集体行为
    const beliefKeys = Object.keys(beliefs);
    const desireKeys = Object.keys(desires);
    
    if (beliefKeys.length === 0 || desireKeys.length === 0) {
      return '无法预测：缺少信念或欲望归因';
    }
    
    // 简化预测逻辑
    const primaryDesire = desireKeys[0];
    const relevantBeliefs = beliefKeys.filter(b => 
      beliefs[b] === true
    );
    
    return `基于集体信念 [${relevantBeliefs.join(', ')}] 和欲望 "${primaryDesire}", 
预测集体 "${collective}" 将采取协调行动以实现 "${primaryDesire}"`;
  }
}

module.exports = { CollectiveIntentionalityModule };
