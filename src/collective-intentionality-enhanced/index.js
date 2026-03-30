/**
 * 集体意向性增强模块 (Collective Intentionality Enhanced Module)
 * 
 * 基于 SEP 集体意向性理论 (Collective Intentionality)
 * 来源：Stanford Encyclopedia of Philosophy
 * 
 * 核心理论框架:
 * - 集体意向不可还原为个体意向的简单加总 (Irreducibility Claim)
 * - 个体所有权论题 (Individual Ownership Thesis)
 * - Searle 的 We-Intention 理论
 * - Bratman 的共享意向性理论 (Shared Intention)
 * - Gilbert 的联合承诺理论 (Joint Commitment)
 * - Walther 的共享经验三重结构 (共情 + 认同 + 相互觉察)
 * - Scheler 的集体情绪理论
 * 
 * 核心概念:
 * 1. We-Intention (我们意向) - 集体意向的基本形式
 * 2. Joint Commitment (联合承诺) - 集体意向的规范性基础
 * 3. Shared Goal (共享目标) - 集体行动的方向
 * 4. Mutual Belief (相互信念) - 集体意向的认知基础
 * 5. Collective Action (集体行动) - 集体意向的外在表现
 * 6. Individual Ownership (个体所有权) - 集体意向的个体承载
 * 
 * @version 4.6.0
 * @author HeartFlow Team
 */

class CollectiveIntentionalityEnhanced {
  constructor() {
    this.version = '4.6.0';
    this.weIntentions = []; // We-Intention 记录
    this.jointCommitments = []; // 联合承诺记录
    this.sharedGoals = []; // 共享目标记录
    this.mutualBeliefs = []; // 相互信念记录
    this.collectiveActions = []; // 集体行动记录
    
    console.log('[CollectiveIntentionalityEnhanced] 模块初始化完成 (v4.6.0)');
    console.log('[CollectiveIntentionalityEnhanced] 理论基础：SEP Collective Intentionality + Searle + Bratman + Gilbert');
  }

  /**
   * 检测 We-Intention (我们意向)
   * 
   * 基于 Searle (1990, 1995) 和 Bratman (1999) 的 We-Intention 理论
   * 
   * @param {string} message - 用户消息
   * @param {object} context - 对话上下文
   * @returns {object} We-Intention 检测结果
   */
  detectWeIntention(message, context = {}) {
    const detection = {
      hasWeIntention: false,
      intentionType: null,
      confidence: 0.0,
      linguisticMarkers: [],
      intentionalStructure: null
    };

    // Searle 的 We-Intention 语言标记
    const weIntentionPatterns = [
      // 明确的"我们"意向表达
      { pattern: /我们 (一起 | 共同 | 要 | 想 | 希望 | 打算 | 计划)/g, type: 'explicit_we_intention' },
      { pattern: /咱们 (一起 | 共同 | 要 | 想 | 希望)/g, type: 'explicit_we_intention' },
      { pattern: /(让我们一起 | 咱们一起 | 我们一起)/g, type: 'proposal_we_intention' },
      { pattern: /(我们的目标 | 我们的计划 | 我们的梦想)/g, type: 'shared_goal' },
      { pattern: /(共同 (创造 | 建立 | 实现 | 完成)|一起 (努力 | 奋斗 | 前行))/g, type: 'collective_action' },
      
      // 英语 We-Intention 标记
      { pattern: /(we will|we shall|we're going to|we plan to|we intend to)/gi, type: 'explicit_we_intention' },
      { pattern: /(let's|together we|our goal|our shared)/gi, type: 'shared_intention' },
      { pattern: /(joint effort|collective action|shared purpose)/gi, type: 'collective_action' }
    ];

    let totalMatches = 0;
    let matchedTypes = new Set();

    weIntentionPatterns.forEach(({ pattern, type }) => {
      const matches = message.match(pattern);
      if (matches) {
        totalMatches += matches.length;
        matchedTypes.add(type);
        detection.linguisticMarkers.push(...matches.map(m => ({
          marker: m,
          type: type
        })));
      }
    });

    // 计算 We-Intention 置信度
    if (totalMatches > 0) {
      detection.hasWeIntention = true;
      detection.confidence = Math.min(1.0, totalMatches * 0.2 + matchedTypes.size * 0.15);
      
      // 确定主导意向类型
      const typeCounts = {};
      detection.linguisticMarkers.forEach(({ type }) => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      detection.intentionType = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // 构建意向结构
      detection.intentionalStructure = this._buildIntentionalStructure(message, detection);
    }

    return detection;
  }

  /**
   * 形成联合承诺 (Joint Commitment)
   * 
   * 基于 Margaret Gilbert (1990, 2006) 的联合承诺理论
   * 
   * @param {string} commitmentContent - 承诺内容
   * @param {array} participants - 参与者列表
   * @param {object} options - 配置选项
   * @returns {object} 联合承诺对象
   */
  formJointCommitment(commitmentContent, participants, options = {}) {
    const commitment = {
      id: `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: commitmentContent,
      participants,
      formationTime: new Date().toISOString(),
      
      // Gilbert 联合承诺理论核心特征
      gilbertFeatures: {
        // 相互性 (mutuality): 每个人都承诺，且知道其他人也承诺
        mutuality: options.mutuality || 0.8,
        
        // 共同知识 (common knowledge): 所有人都知道所有人都承诺
        commonKnowledge: options.commonKnowledge || 0.7,
        
        // 规范性 (normativity): 承诺产生规范性约束
        normativity: options.normativity || 0.9,
        
        // 不可单方面撤销 (non-unilateral-revocability)
        nonUnilateralRevocability: true,
        
        // 相互依赖性 (interdependence)
        interdependence: options.interdependence || 0.8
      },
      
      // 承诺强度
      strength: this._calculateCommitmentStrength(participants, options),
      
      // 承诺类型 (Gilbert 2006)
      commitmentType: this._classifyCommitmentType(commitmentContent, options),
      
      // 规范性期望
      normativeExpectations: this._generateNormativeExpectations(commitmentContent, participants)
    };

    this.jointCommitments.push(commitment);
    console.log(`[CollectiveIntentionalityEnhanced] 形成联合承诺：${commitmentContent.substring(0, 30)}... (${participants.length}人)`);

    return commitment;
  }

  /**
   * 表征共享目标 (Shared Goal Representation)
   * 
   * 基于 Bratman (1999) 的共享意向性理论
   * 
   * @param {string} goalContent - 目标内容
   * @param {object} options - 配置选项
   * @returns {object} 共享目标对象
   */
  representSharedGoal(goalContent, options = {}) {
    const sharedGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: goalContent,
      representationTime: new Date().toISOString(),
      
      // Bratman 共享意向性核心特征
      bratmanFeatures: {
        // 相互响应 (mutual responsiveness): 双方都响应对方的意图和行动
        mutualResponsiveness: options.mutualResponsiveness || 0.8,
        
        // 承诺共同目标 (commitment to joint activity)
        commitmentToJointActivity: options.commitment || 0.9,
        
        // 承诺相互支持 (commitment to mutual support)
        commitmentToMutualSupport: options.mutualSupport || 0.8,
        
        // 子计划协调 (sub-plan coordination)
        subPlanCoordination: options.subPlanCoordination || 0.7,
        
        // 共同知识 (common knowledge)
        commonKnowledge: options.commonKnowledge || 0.8
      },
      
      // 目标特征
      goalFeatures: {
        // 目标清晰度
        clarity: options.clarity || 0.7,
        
        // 目标可达成性
        achievability: options.achievability || 0.6,
        
        // 目标重要性
        importance: options.importance || 0.8,
        
        // 时间约束
        timeBound: options.timeBound || null
      },
      
      // 共享程度
      sharednessLevel: this._calculateSharednessLevel(goalContent, options)
    };

    this.sharedGoals.push(sharedGoal);
    console.log(`[CollectiveIntentionalityEnhanced] 表征共享目标：${goalContent.substring(0, 30)}...`);

    return sharedGoal;
  }

  /**
   * 建模相互信念 (Mutual Belief Modeling)
   * 
   * 基于 Lewis (1969) 和 Gilbert (1989) 的相互信念/共同知识理论
   * 
   * @param {string} beliefContent - 信念内容
   * @param {array} believers - 信念持有者列表
   * @param {object} options - 配置选项
   * @returns {object} 相互信念对象
   */
  modelMutualBelief(beliefContent, believers, options = {}) {
    const mutualBelief = {
      id: `belief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: beliefContent,
      believers,
      formationTime: new Date().toISOString(),
      
      // 相互信念层级 (Lewis 1969)
      beliefLevels: {
        // 一阶：每个人都相信 p
        firstOrder: true,
        
        // 二阶：每个人都相信每个人都相信 p
        secondOrder: options.secondOrder || true,
        
        // 三阶：每个人都相信每个人都相信每个人都相信 p
        thirdOrder: options.thirdOrder || false,
        
        // 共同知识 (无限阶相互信念)
        commonKnowledge: options.commonKnowledge || false
      },
      
      // 信念强度
      beliefStrength: {
        // 个体信念强度
        individualStrength: options.individualStrength || 0.8,
        
        // 相互性强度
        mutualityStrength: options.mutualityStrength || 0.7,
        
        // 整体强度
        overallStrength: 0.0
      },
      
      // 信念类型
      beliefType: this._classifyBeliefType(beliefContent, options)
    };

    // 计算整体信念强度
    mutualBelief.beliefStrength.overallStrength = (
      mutualBelief.beliefStrength.individualStrength * 0.5 +
      mutualBelief.beliefStrength.mutualityStrength * 0.5
    );

    this.mutualBeliefs.push(mutualBelief);
    console.log(`[CollectiveIntentionalityEnhanced] 建模相互信念：${beliefContent.substring(0, 30)}... (${believers.length}人)`);

    return mutualBelief;
  }

  /**
   * 协调集体行动 (Collective Action Coordination)
   * 
   * 基于集体行动理论 (Collective Action Theory)
   * 
   * @param {string} actionDescription - 行动描述
   * @param {array} participants - 参与者列表
   * @param {object} options - 配置选项
   * @returns {object} 集体行动对象
   */
  coordinateCollectiveAction(actionDescription, participants, options = {}) {
    const collectiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: actionDescription,
      participants,
      coordinationTime: new Date().toISOString(),
      
      // 集体行动核心特征
      collectiveActionFeatures: {
        // 行动意向的共享性
        sharedIntentionality: options.sharedIntentionality || 0.8,
        
        // 行动协调度
        coordinationLevel: options.coordinationLevel || 0.7,
        
        // 角色分工明确度
        roleClarity: options.roleClarity || 0.6,
        
        // 时间同步性
        temporalSynchrony: options.temporalSynchrony || 0.7,
        
        // 目标一致性
        goalAlignment: options.goalAlignment || 0.9
      },
      
      // 行动阶段
      actionPhase: options.phase || 'planning', // planning / execution / completion
      
      // 成功条件
      successConditions: this._defineSuccessConditions(actionDescription, options),
      
      // 潜在障碍
      potentialObstacles: this._identifyPotentialObstacles(actionDescription, participants)
    };

    this.collectiveActions.push(collectiveAction);
    console.log(`[CollectiveIntentionalityEnhanced] 协调集体行动：${actionDescription.substring(0, 30)}... (${participants.length}人)`);

    return collectiveAction;
  }

  /**
   * 评估集体意向性质量
   * 
   * 综合评估集体意向性的各个维度
   * 
   * @returns {object} 评估结果
   */
  assessCollectiveIntentionalityQuality() {
    const assessment = {
      assessmentTime: new Date().toISOString(),
      
      // 统计信息
      statistics: {
        weIntentionsCount: this.weIntentions.length,
        jointCommitmentsCount: this.jointCommitments.length,
        sharedGoalsCount: this.sharedGoals.length,
        mutualBeliefsCount: this.mutualBeliefs.length,
        collectiveActionsCount: this.collectiveActions.length
      },
      
      // 质量维度
      qualityDimensions: {
        // We-Intention 强度
        weIntentionStrength: this._calculateWeIntentionStrength(),
        
        // 联合承诺稳固度
        commitmentSolidity: this._calculateCommitmentSolidity(),
        
        // 共享目标清晰度
        goalClarity: this._calculateGoalClarity(),
        
        // 相互信念深度
        beliefDepth: this._calculateBeliefDepth(),
        
        // 集体行动协调度
        actionCoordination: this._calculateActionCoordination()
      },
      
      // 整体质量评分
      overallQuality: {
        score: 0.0,
        level: 'unknown'
      },
      
      // 改进建议
      recommendations: []
    };

    // 计算整体质量
    const dimensionScores = Object.values(assessment.qualityDimensions);
    assessment.overallQuality.score = dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length;
    assessment.overallQuality.level = this._classifyQualityLevel(assessment.overallQuality.score);

    // 生成改进建议
    assessment.recommendations = this._generateQualityRecommendations(assessment.qualityDimensions);

    return assessment;
  }

  /**
   * 生成集体意向性练习
   * 
   * 基于理论设计的实践练习
   * 
   * @returns {array} 练习列表
   */
  generateCollectiveIntentionalityExercises() {
    return [
      {
        name: '我们意向觉察练习',
        duration: '10-15 分钟',
        description: '培养对"我们意向"的觉察能力',
        steps: [
          '1. 回想一段与他人合作的经历',
          '2. 注意当时是否使用了"我们"语言',
          '3. 反思"我们意向"与"我个人意向"的区别',
          '4. 体会集体意向带来的感受变化',
          '5. 尝试用"我们"重新表述个人目标'
        ],
        theoreticalBasis: 'Searle We-Intention 理论'
      },
      {
        name: '联合承诺建立练习',
        duration: '15-20 分钟',
        description: '学习建立和维护联合承诺',
        steps: [
          '1. 选择一个想要共同完成的目标',
          '2. 与对方明确表达共同承诺',
          '3. 确认双方都理解承诺内容',
          '4. 讨论承诺的规范性约束',
          '5. 建立承诺维护机制'
        ],
        theoreticalBasis: 'Gilbert 联合承诺理论'
      },
      {
        name: '共享目标协调练习',
        duration: '20-30 分钟',
        description: '练习共享目标的表征与协调',
        steps: [
          '1. 各自写下对共同目标的理解',
          '2. 交换并比较理解差异',
          '3. 讨论并达成目标共识',
          '4. 制定子计划并确保协调',
          '5. 建立相互支持机制'
        ],
        theoreticalBasis: 'Bratman 共享意向性理论'
      },
      {
        name: '相互信念建立练习',
        duration: '10-15 分钟',
        description: '培养相互信念和共同知识',
        steps: [
          '1. 分享一个信念或观点',
          '2. 确认对方理解并认同',
          '3. 确认对方知道自己认同',
          '4. 建立共同知识基础',
          '5. 反思相互信念的作用'
        ],
        theoreticalBasis: 'Lewis 共同知识理论'
      },
      {
        name: '集体行动协调练习',
        duration: '30-60 分钟',
        description: '实践集体行动的协调',
        steps: [
          '1. 选择一个需要合作的任务',
          '2. 明确各自角色和责任',
          '3. 建立行动协调机制',
          '4. 执行任务并保持沟通',
          '5. 反思协调过程和改进点'
        ],
        theoreticalBasis: '集体行动理论'
      }
    ];
  }

  // ========== 内部辅助方法 ==========

  /**
   * 构建意向结构
   */
  _buildIntentionalStructure(message, detection) {
    return {
      surfaceForm: message,
      intentionalContent: detection.intentionType,
      weMode: detection.confidence > 0.6,
      irreducibility: detection.confidence > 0.7 // 是否不可还原为个体意向
    };
  }

  /**
   * 计算承诺强度
   */
  _calculateCommitmentStrength(participants, options) {
    const baseStrength = 0.5;
    const participantBonus = Math.min(0.3, participants.length * 0.1);
    const mutualityBonus = (options.mutuality || 0.5) * 0.2;
    return Math.min(1.0, baseStrength + participantBonus + mutualityBonus);
  }

  /**
   * 分类承诺类型
   */
  _classifyCommitmentType(content, options) {
    if (content.includes('永远') || content.includes('一直')) return 'permanent';
    if (content.includes('暂时') || content.includes('短期')) return 'temporary';
    if (options.formality === 'formal') return 'formal';
    if (options.formality === 'informal') return 'informal';
    return 'standard';
  }

  /**
   * 生成规范性期望
   */
  _generateNormativeExpectations(content, participants) {
    return [
      `每个参与者都应当履行承诺内容`,
      `每个参与者都有权期望其他参与者履行承诺`,
      `单方面撤销承诺需要正当理由`,
      `违背承诺可能产生规范性谴责`
    ];
  }

  /**
   * 计算共享程度
   */
  _calculateSharednessLevel(content, options) {
    const factors = [
      options.mutualResponsiveness || 0.5,
      options.commitment || 0.5,
      options.mutualSupport || 0.5,
      options.commonKnowledge || 0.5
    ];
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  /**
   * 分类信念类型
   */
  _classifyBeliefType(content, options) {
    if (content.includes('事实') || content.includes('真相')) return 'factual';
    if (content.includes('价值') || content.includes('应该')) return 'normative';
    if (content.includes('目标') || content.includes('计划')) return 'intentional';
    return 'general';
  }

  /**
   * 定义成功条件
   */
  _defineSuccessConditions(actionDescription, options) {
    return [
      '所有参与者都完成各自角色',
      '行动目标被达成',
      '参与者对过程满意',
      '集体意向性得到增强'
    ];
  }

  /**
   * 识别潜在障碍
   */
  _identifyPotentialObstacles(actionDescription, participants) {
    const obstacles = [];
    
    if (participants.length > 5) {
      obstacles.push('参与者过多可能导致协调困难');
    }
    
    obstacles.push('沟通不畅可能导致误解');
    obstacles.push('目标不一致可能影响行动效果');
    obstacles.push('时间冲突可能阻碍行动执行');
    
    return obstacles;
  }

  /**
   * 计算 We-Intention 强度
   */
  _calculateWeIntentionStrength() {
    if (this.weIntentions.length === 0) return 0.5;
    const avgConfidence = this.weIntentions.reduce((sum, wi) => sum + wi.confidence, 0) / this.weIntentions.length;
    return avgConfidence;
  }

  /**
   * 计算承诺稳固度
   */
  _calculateCommitmentSolidity() {
    if (this.jointCommitments.length === 0) return 0.5;
    const avgStrength = this.jointCommitments.reduce((sum, jc) => sum + jc.strength, 0) / this.jointCommitments.length;
    return avgStrength;
  }

  /**
   * 计算目标清晰度
   */
  _calculateGoalClarity() {
    if (this.sharedGoals.length === 0) return 0.5;
    const avgClarity = this.sharedGoals.reduce((sum, sg) => sum + sg.goalFeatures.clarity, 0) / this.sharedGoals.length;
    return avgClarity;
  }

  /**
   * 计算信念深度
   */
  _calculateBeliefDepth() {
    if (this.mutualBeliefs.length === 0) return 0.5;
    const avgStrength = this.mutualBeliefs.reduce((sum, mb) => sum + mb.beliefStrength.overallStrength, 0) / this.mutualBeliefs.length;
    return avgStrength;
  }

  /**
   * 计算行动协调度
   */
  _calculateActionCoordination() {
    if (this.collectiveActions.length === 0) return 0.5;
    const avgCoordination = this.collectiveActions.reduce((sum, ca) => sum + ca.collectiveActionFeatures.coordinationLevel, 0) / this.collectiveActions.length;
    return avgCoordination;
  }

  /**
   * 分类质量等级
   */
  _classifyQualityLevel(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  /**
   * 生成质量改进建议
   */
  _generateQualityRecommendations(dimensions) {
    const recommendations = [];
    
    Object.entries(dimensions).forEach(([dimension, score]) => {
      if (score < 0.5) {
        recommendations.push({
          dimension,
          issue: `${dimension} 得分较低 (${(score * 100).toFixed(0)}%)`,
          suggestion: this._getDimensionImprovementSuggestion(dimension)
        });
      }
    });
    
    return recommendations;
  }

  /**
   * 获取维度改进建议
   */
  _getDimensionImprovementSuggestion(dimension) {
    const suggestions = {
      weIntentionStrength: '增加"我们"语言使用，培养集体意向意识',
      commitmentSolidity: '明确承诺内容，加强相互确认',
      goalClarity: '清晰表达目标，确保共同理解',
      beliefDepth: '建立共同知识，深化相互信念',
      actionCoordination: '改善沟通机制，优化角色分工'
    };
    return suggestions[dimension] || '继续练习集体意向性相关技能';
  }

  /**
   * 记录 We-Intention
   */
  recordWeIntention(message, context = {}) {
    const detection = this.detectWeIntention(message, context);
    if (detection.hasWeIntention) {
      const weIntention = {
        id: `we_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message,
        detection,
        recordTime: new Date().toISOString(),
        context
      };
      this.weIntentions.push(weIntention);
      return weIntention;
    }
    return null;
  }

  /**
   * 获取模块状态
   */
  getStatus() {
    const assessment = this.assessCollectiveIntentionalityQuality();
    
    return {
      version: this.version,
      theory: 'SEP Collective Intentionality + Searle + Bratman + Gilbert',
      timestamp: new Date().toISOString(),
      statistics: assessment.statistics,
      qualityDimensions: assessment.qualityDimensions,
      overallQuality: assessment.overallQuality,
      recommendations: assessment.recommendations
    };
  }
}

module.exports = { CollectiveIntentionalityEnhanced };
