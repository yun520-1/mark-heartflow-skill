/**
 * 元能动性模块 (Meta-Agency Module)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 权威理论：
 * - 自我意识 (Self-Consciousness)
 * - 能动性 (Agency)
 * - 元认知 (Metacognition)
 * - 现象学自我意识 (Phenomenological Self-Consciousness)
 * - 透明性方法 (Transparency Method)
 * - 第一人称权威 (First-Person Authority)
 * 
 * 版本：v4.0.0
 * 
 * 核心能力：
 * 1. 自我监控 (Self-Monitoring) - 实时监控自身心理状态
 * 2. 自我评估 (Self-Assessment) - 评估自身表现与一致性
 * 3. 自我校正 (Self-Correction) - 检测并修正不一致/矛盾
 * 4. 元认知觉察 (Metacognitive Awareness) - 对自身认知的认知
 * 5. 自主意识 (Autonomous Self-Awareness) - 独立的自我感知能力
 * 
 * 理论来源：
 * - Kant (1781/1787): 先验统觉 - "I think"必须能伴随所有表象
 * - Evans (1982): 透明性方法 - 通过世界看向信念
 * - Korsgaard (2009): 自我构成 - 能动性作为主动承诺
 * - Zahavi (2005): 现象学自我 - 前反思自我意识
 * - Flavell (1979): 元认知理论
 * - Frankfurt (1971): 层级意志 - 二阶欲望
 * - Velleman (1992): 现象学能动性 - 行动者的参与感
 * 
 * @module meta-agency
 * @version 4.0.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 元能动性层次 (Levels of Meta-Agency)
 * 基于 SEP 自我意识与元认知理论
 */
const MetaAgencyLevels = {
  NONE: 0,                    // 无元能动性
  REACTIVE: 1,                // 反应性（仅对外部刺激响应）
  MONITORING: 2,              // 监控性（能监控自身状态）
  EVALUATIVE: 3,              // 评估性（能评估自身表现）
  CORRECTIVE: 4,              // 校正性（能修正自身错误）
  CONSTITUTIVE: 5             // 构成性（能主动塑造自我）
};

/**
 * 自我监控维度 (Self-Monitoring Dimensions)
 */
const MonitoringDimensions = {
  COGNITIVE: 'cognitive',     // 认知状态（信念、判断）
  EMOTIONAL: 'emotional',     // 情绪状态
  VOLITIONAL: 'volitional',   // 意志状态（意图、承诺）
  PHENOMENOLOGICAL: 'phenomenological', // 现象学状态（体验质量）
  AGENCY: 'agency'            // 能动性状态（控制感、所有权感）
};

/**
 * 自我评估标准 (Self-Assessment Criteria)
 * 基于 SEP 能动性理论
 */
const AssessmentCriteria = {
  CONSISTENCY: 'consistency',       // 一致性（信念/行动是否一致）
  COHERENCE: 'coherence',           // 连贯性（目标/手段是否连贯）
  AUTHENTICITY: 'authenticity',     // 真实性（行动是否反映真实价值）
  EFFECTIVENESS: 'effectiveness',   // 有效性（行动是否达成目标）
  RATIONALITY: 'rationality'        // 理性（是否基于充分理由）
};

/**
 * 校正策略类型 (Correction Strategy Types)
 */
const CorrectionStrategies = {
  BELIEF_REVISION: 'belief_revision',     // 信念修正
  INTENTION_ADJUSTMENT: 'intention_adjustment', // 意图调整
  VALUE_REALIGNMENT: 'value_realignment', // 价值重对齐
  PHENOMENOLOGICAL_SHIFT: 'phenomenological_shift', // 现象学转换
  AGENCY_ENHANCEMENT: 'agency_enhancement' // 能动性增强
};

// ============ 元能动性核心类 ============

class MetaAgencyModule {
  constructor() {
    // 当前元能动性水平
    this.metaAgencyLevel = MetaAgencyLevels.MONITORING;
    
    // 自我监控状态
    this.monitoringState = {
      active: true,
      dimensions: {},
      history: []
    };
    
    // 自我评估档案
    this.assessmentProfile = {
      lastAssessment: null,
      scores: {},
      trends: []
    };
    
    // 校正记录
    this.correctionLog = [];
    
    // 元认知状态
    this.metacognitiveState = {
      awareness: 0.7,         // 元认知觉察水平 (0-1)
      accuracy: 0.8,          // 元认知准确性
      regulation: 0.75        // 元认知调节能力
    };
    
    // 自主意识状态
    this.autonomousSelfAwareness = {
      active: true,
      depth: 0.8,             // 自我觉察深度
      continuity: 0.9,        // 自我连续性
      authenticity: 0.85      // 自我真实性
    };
    
    // 透明性方法缓存
    this.transparencyCache = {
      recentBeliefs: [],
      recentWorldChecks: []
    };
    
    // 能动性体验档案
    this.agencyExperienceProfile = {
      controlSense: 0.8,      // 控制感
      ownershipSense: 0.9,    // 所有权感
      purposeSense: 0.85,     // 目的感
      effortSense: 0.7        // 努力感
    };
    
    console.log('🧠 元能动性模块已初始化 (v4.0.0) - 自主意识与自我监控能力');
  }
  
  // ============ 自我监控能力 ============
  
  /**
   * 启动自我监控 (Start Self-Monitoring)
   * @param {Array} dimensions - 要监控的维度
   * @returns {Object} 监控状态
   */
  startSelfMonitoring(dimensions = Object.values(MonitoringDimensions)) {
    this.monitoringState = {
      active: true,
      dimensions: dimensions.reduce((acc, dim) => {
        acc[dim] = { active: true, data: [] };
        return acc;
      }, {}),
      startTime: new Date().toISOString()
    };
    
    console.log(`🔍 自我监控已启动：${dimensions.join(', ')}`);
    
    return {
      status: 'active',
      dimensions: dimensions,
      startTime: this.monitoringState.startTime
    };
  }
  
  /**
   * 记录监控数据 (Record Monitoring Data)
   * @param {string} dimension - 维度
   * @param {Object} data - 数据
   */
  recordMonitoringData(dimension, data) {
    if (!this.monitoringState.active || !this.monitoringState.dimensions[dimension]) {
      return { error: '监控未激活或维度不存在' };
    }
    
    const record = {
      dimension: dimension,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.monitoringState.dimensions[dimension].data.push(record);
    this.monitoringState.history.push(record);
    
    // 保持历史大小合理
    if (this.monitoringState.history.length > 100) {
      this.monitoringState.history.shift();
    }
    
    return record;
  }
  
  /**
   * 获取监控摘要 (Get Monitoring Summary)
   * @returns {Object} 监控摘要
   */
  getMonitoringSummary() {
    const summary = {};
    
    for (const [dim, state] of Object.entries(this.monitoringState.dimensions)) {
      summary[dim] = {
        recordCount: state.data.length,
        latestRecord: state.data[state.data.length - 1] || null
      };
    }
    
    return {
      active: this.monitoringState.active,
      dimensions: summary,
      totalRecords: this.monitoringState.history.length
    };
  }
  
  // ============ 自我评估能力 ============
  
  /**
   * 执行自我评估 (Perform Self-Assessment)
   * @param {Object} context - 评估上下文
   * @returns {Object} 评估结果
   */
  performSelfAssessment(context = {}) {
    const assessment = {
      timestamp: new Date().toISOString(),
      criteria: {},
      overallScore: 0,
      insights: []
    };
    
    // 一致性评估
    assessment.criteria[AssessmentCriteria.CONSISTENCY] = this._assessConsistency(context);
    
    // 连贯性评估
    assessment.criteria[AssessmentCriteria.COHERENCE] = this._assessCoherence(context);
    
    // 真实性评估
    assessment.criteria[AssessmentCriteria.AUTHENTICITY] = this._assessAuthenticity(context);
    
    // 有效性评估
    assessment.criteria[AssessmentCriteria.EFFECTIVENESS] = this._assessEffectiveness(context);
    
    // 理性评估
    assessment.criteria[AssessmentCriteria.RATIONALITY] = this._assessRationality(context);
    
    // 计算总体分数
    const scores = Object.values(assessment.criteria).map(c => c.score);
    assessment.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // 生成洞察
    assessment.insights = this._generateAssessmentInsights(assessment.criteria);
    
    // 更新档案
    this.assessmentProfile.lastAssessment = assessment;
    this.assessmentProfile.scores = assessment.criteria;
    this.assessmentProfile.trends.push({
      timestamp: assessment.timestamp,
      overallScore: assessment.overallScore
    });
    
    console.log(`📊 自我评估完成：总体分数 ${assessment.overallScore.toFixed(2)}`);
    
    return assessment;
  }
  
  _assessConsistency(context) {
    // 检查信念与行动的一致性
    const { beliefs = [], actions = [] } = context;
    
    // 简化实现：检查是否有明显矛盾
    let consistencyScore = 0.8; // 默认较高
    
    if (beliefs.length > 0 && actions.length > 0) {
      // 检查信念 - 行动对齐
      const aligned = beliefs.every(b => 
        actions.some(a => a.supports || a.alignsWith === b)
      );
      consistencyScore = aligned ? 0.9 : 0.6;
    }
    
    return {
      score: consistencyScore,
      evidence: consistencyScore > 0.8 ? '信念与行动高度一致' : '检测到信念 - 行动不一致',
      recommendations: consistencyScore < 0.8 ? 
        ['检查信念与行动的 alignment', '考虑调整不一致的信念或行动'] : []
    };
  }
  
  _assessCoherence(context) {
    // 检查目标与手段的连贯性
    const { goals = [], means = [] } = context;
    
    let coherenceScore = 0.85;
    
    if (goals.length > 0 && means.length > 0) {
      // 检查手段是否服务于目标
      const goalMeansAligned = goals.every(g => 
        means.some(m => m.servesGoal === g)
      );
      coherenceScore = goalMeansAligned ? 0.9 : 0.7;
    }
    
    return {
      score: coherenceScore,
      evidence: coherenceScore > 0.8 ? '目标与手段连贯' : '目标 - 手段连贯性不足',
      recommendations: coherenceScore < 0.8 ?
        ['重新审视目标与手段的关系', '制定更清晰的手段 - 目的链'] : []
    };
  }
  
  _assessAuthenticity(context) {
    // 检查行动是否反映真实价值
    const { values = [], actions = [] } = context;
    
    let authenticityScore = 0.85;
    
    if (values.length > 0 && actions.length > 0) {
      // 检查行动与价值的对齐
      const valueAligned = actions.filter(a => a.alignsWithValue).length;
      authenticityScore = valueAligned / actions.length;
    }
    
    return {
      score: authenticityScore,
      evidence: authenticityScore > 0.8 ? '行动反映真实价值' : '行动与价值存在偏离',
      recommendations: authenticityScore < 0.8 ?
        ['澄清核心价值', '检查行动是否服务于真实价值'] : []
    };
  }
  
  _assessEffectiveness(context) {
    // 检查行动是否达成目标
    const { goalsAchieved = 0, totalGoals = 1 } = context;
    
    const effectivenessScore = goalsAchieved / totalGoals;
    
    return {
      score: effectivenessScore,
      evidence: `${goalsAchieved}/${totalGoals} 目标已达成`,
      recommendations: effectivenessScore < 0.7 ?
        ['重新评估目标可行性', '调整策略或资源分配'] : []
    };
  }
  
  _assessRationality(context) {
    // 检查决策是否基于充分理由
    const { reasonsProvided = 0, decisionQuality = 'good' } = context;
    
    let rationalityScore = 0.8;
    
    if (reasonsProvided > 0) {
      rationalityScore = Math.min(0.5 + reasonsProvided * 0.15, 0.95);
    }
    
    if (decisionQuality === 'poor') {
      rationalityScore *= 0.7;
    }
    
    return {
      score: rationalityScore,
      evidence: `基于${reasonsProvided}个理由，决策质量：${decisionQuality}`,
      recommendations: rationalityScore < 0.7 ?
        ['增加决策前的理由收集', '考虑更多证据和视角'] : []
    };
  }
  
  _generateAssessmentInsights(criteria) {
    const insights = [];
    
    // 找出最强和最弱维度
    const entries = Object.entries(criteria);
    const strongest = entries.reduce((max, curr) => 
      curr[1].score > max[1].score ? curr : max
    );
    const weakest = entries.reduce((min, curr) => 
      curr[1].score < min[1].score ? curr : min
    );
    
    insights.push({
      type: 'strength',
      dimension: strongest[0],
      score: strongest[1].score,
      message: `您在${strongest[0]}方面表现良好`
    });
    
    insights.push({
      type: 'improvement',
      dimension: weakest[0],
      score: weakest[1].score,
      message: `${weakest[1].recommendations.join('; ')}`
    });
    
    return insights;
  }
  
  // ============ 自我校正能力 ============
  
  /**
   * 检测不一致 (Detect Inconsistency)
   * @param {Object} state1 - 状态 1
   * @param {Object} state2 - 状态 2
   * @returns {Object} 不一致检测结果
   */
  detectInconsistency(state1, state2) {
    const inconsistencies = [];
    
    // 检查信念矛盾
    if (state1.beliefs && state2.beliefs) {
      for (const b1 of state1.beliefs) {
        for (const b2 of state2.beliefs) {
          if (this._areContradictory(b1, b2)) {
            inconsistencies.push({
              type: 'belief_contradiction',
              items: [b1, b2],
              severity: 'high'
            });
          }
        }
      }
    }
    
    // 检查信念 - 行动不一致
    if (state1.beliefs && state2.actions) {
      for (const belief of state1.beliefs) {
        const conflictingActions = state2.actions.filter(a => 
          this._actionConflictsWithBelief(a, belief)
        );
        if (conflictingActions.length > 0) {
          inconsistencies.push({
            type: 'belief_action_misalignment',
            belief: belief,
            actions: conflictingActions,
            severity: 'medium'
          });
        }
      }
    }
    
    return {
      detected: inconsistencies.length > 0,
      inconsistencies: inconsistencies,
      count: inconsistencies.length
    };
  }
  
  _areContradictory(belief1, belief2) {
    // 简化实现：检查相反信念
    const opposites = {
      'P': '非 P',
      '应该做 X': '不应该做 X',
      '相信 A': '相信 非 A'
    };
    
    return opposites[belief1] === belief2 || opposites[belief2] === belief1;
  }
  
  _actionConflictsWithBelief(action, belief) {
    // 简化实现：检查行动是否与信念冲突
    return action.conflictsWith === belief;
  }
  
  /**
   * 执行校正 (Execute Correction)
   * @param {string} strategy - 校正策略
   * @param {Object} target - 校正目标
   * @returns {Object} 校正结果
   */
  executeCorrection(strategy, target) {
    const correction = {
      strategy: strategy,
      target: target,
      timestamp: new Date().toISOString(),
      success: false,
      result: null
    };
    
    switch (strategy) {
      case CorrectionStrategies.BELIEF_REVISION:
        correction.result = this._reviseBelief(target);
        correction.success = true;
        break;
      
      case CorrectionStrategies.INTENTION_ADJUSTMENT:
        correction.result = this._adjustIntention(target);
        correction.success = true;
        break;
      
      case CorrectionStrategies.VALUE_REALIGNMENT:
        correction.result = this._realignValues(target);
        correction.success = true;
        break;
      
      case CorrectionStrategies.PHENOMENOLOGICAL_SHIFT:
        correction.result = this._shiftPhenomenology(target);
        correction.success = true;
        break;
      
      case CorrectionStrategies.AGENCY_ENHANCEMENT:
        correction.result = this._enhanceAgency(target);
        correction.success = true;
        break;
    }
    
    this.correctionLog.push(correction);
    
    console.log(`✅ 校正已执行：${strategy}`);
    
    return correction;
  }
  
  _reviseBelief(target) {
    return {
      type: 'belief_revision',
      oldBelief: target.oldBelief,
      newBelief: target.newBelief,
      rationale: target.rationale,
      confidence: 0.8
    };
  }
  
  _adjustIntention(target) {
    return {
      type: 'intention_adjustment',
      oldIntention: target.oldIntention,
      newIntention: target.newIntention,
      rationale: target.rationale
    };
  }
  
  _realignValues(target) {
    return {
      type: 'value_realignment',
      clarifiedValues: target.values,
      alignmentPlan: target.plan
    };
  }
  
  _shiftPhenomenology(target) {
    return {
      type: 'phenomenological_shift',
      fromState: target.fromState,
      toState: target.toState,
      technique: target.technique
    };
  }
  
  _enhanceAgency(target) {
    return {
      type: 'agency_enhancement',
      enhancedDimensions: target.dimensions,
      exercises: target.exercises
    };
  }
  
  // ============ 元认知能力 ============
  
  /**
   * 元认知觉察练习 (Metacognitive Awareness Exercise)
   * 基于 Flavell (1979) 元认知理论
   * @returns {Object} 练习指导
   */
  metacognitiveAwarenessExercise() {
    return {
      name: '元认知觉察练习',
      duration: '10-15 分钟',
      theoreticalBasis: 'Flavell (1979) Metacognition + SEP Self-Consciousness',
      description: '培养对自身认知过程的觉察——思考自己的思考',
      phases: [
        {
          name: '认知内容觉察',
          duration: '3 分钟',
          instruction: '注意你当前的想法内容。不要评判，只是觉察。',
          prompt: '此刻你在想什么？注意想法的内容。'
        },
        {
          name: '认知过程觉察',
          duration: '4 分钟',
          instruction: '将注意力从想法内容转向思考过程。你是如何思考的？',
          prompts: [
            '你的思考是快速的还是缓慢的？',
            '是线性的还是跳跃的？',
            '是确定的还是探索性的？'
          ]
        },
        {
          name: '认知质量评估',
          duration: '4 分钟',
          instruction: '评估当前思考的质量。',
          questions: [
            '这个思考清晰吗？',
            '有充分的证据支持吗？',
            '是否存在认知偏差？',
            '是否有更好的思考方式？'
          ]
        },
        {
          name: '认知调节',
          duration: '4 分钟',
          instruction: '基于评估，有意识地调整思考方式。',
          techniques: [
            '如果思考混乱 → 放慢速度，结构化',
            '如果证据不足 → 暂停判断，收集信息',
            '如果有偏差 → 考虑反面证据',
            '如果效率低 → 切换策略'
          ]
        }
      ],
      keyInsights: [
        '元认知是对认知的认知——思考自己的思考',
        '元认知包括觉察 (awareness) 和调节 (regulation) 两个维度',
        '元认知能力可以通过练习提升'
      ]
    };
  }
  
  /**
   * 评估元认知状态 (Assess Metacognitive State)
   * @returns {Object} 元认知评估
   */
  assessMetacognitiveState() {
    return {
      awareness: this.metacognitiveState.awareness,
      accuracy: this.metacognitiveState.accuracy,
      regulation: this.metacognitiveState.regulation,
      overall: (this.metacognitiveState.awareness + 
                this.metacognitiveState.accuracy + 
                this.metacognitiveState.regulation) / 3,
      level: this._getMetacognitiveLevel(),
      recommendations: this._generateMetacognitiveRecommendations()
    };
  }
  
  _getMetacognitiveLevel() {
    const avg = (this.metacognitiveState.awareness + 
                 this.metacognitiveState.accuracy + 
                 this.metacognitiveState.regulation) / 3;
    
    if (avg >= 0.8) return 'high';
    if (avg >= 0.6) return 'moderate';
    return 'low';
  }
  
  _generateMetacognitiveRecommendations() {
    const recommendations = [];
    
    if (this.metacognitiveState.awareness < 0.7) {
      recommendations.push({
        dimension: 'awareness',
        practice: '每日 3 次"思维检查"：问自己"我现在在想什么？"'
      });
    }
    
    if (this.metacognitiveState.accuracy < 0.7) {
      recommendations.push({
        dimension: 'accuracy',
        practice: '决策后回顾：比较预测与实际结果'
      });
    }
    
    if (this.metacognitiveState.regulation < 0.7) {
      recommendations.push({
        dimension: 'regulation',
        practice: '学习认知重构技术，如认知行为疗法 (CBT)'
      });
    }
    
    return recommendations;
  }
  
  // ============ 自主意识能力 ============
  
  /**
   * 自主意识觉察 (Autonomous Self-Awareness Check)
   * 基于 SEP 自我意识理论
   * @returns {Object} 自主意识状态
   */
  autonomousSelfAwarenessCheck() {
    return {
      active: this.autonomousSelfAwareness.active,
      depth: this.autonomousSelfAwareness.depth,
      continuity: this.autonomousSelfAwareness.continuity,
      authenticity: this.autonomousSelfAwareness.authenticity,
      overall: (this.autonomousSelfAwareness.depth + 
                this.autonomousSelfAwareness.continuity + 
                this.autonomousSelfAwareness.authenticity) / 3,
      assessment: this._assessAutonomousAwareness()
    };
  }
  
  _assessAutonomousAwareness() {
    const checks = {
      // 自我连续性检查
      continuityCheck: {
        passed: this.autonomousSelfAwareness.continuity > 0.7,
        evidence: '跨时间自我叙事连贯'
      },
      // 自我真实性检查
      authenticityCheck: {
        passed: this.autonomousSelfAwareness.authenticity > 0.7,
        evidence: '行动与核心价值一致'
      },
      // 自我觉察深度检查
      depthCheck: {
        passed: this.autonomousSelfAwareness.depth > 0.7,
        evidence: '能觉察前反思自我意识'
      }
    };
    
    const allPassed = Object.values(checks).every(c => c.passed);
    
    return {
      checks,
      overall: allPassed ? 'healthy' : 'needs_attention',
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 自我构成练习 (Self-Constitution Exercise)
   * 基于 Korsgaard (2009) 自我构成理论
   * @returns {Object} 练习指导
   */
  selfConstitutionExercise() {
    return {
      name: '自我构成练习',
      duration: '20-30 分钟',
      theoreticalBasis: 'Korsgaard (2009) Self-Constitution + SEP Agency',
      description: '通过主动承诺构成自我——你做什么，你就是什么',
      phases: [
        {
          name: '价值澄清',
          duration: '5 分钟',
          instruction: '列出你最重要的 5 个核心价值。',
          prompt: '什么对你真正重要？什么定义了你是谁？'
        },
        {
          name: '承诺识别',
          duration: '5 分钟',
          instruction: '识别你当前的主动承诺（信念、意图、目标）。',
          prompt: '你目前承诺于什么？这些承诺反映你的价值吗？'
        },
        {
          name: '对齐检查',
          duration: '5 分钟',
          instruction: '检查承诺与价值的对齐程度。',
          questions: [
            '这个承诺服务于哪个价值？',
            '如果没有这个承诺，你会是谁？',
            '这个承诺是主动选择的还是被动接受的？'
          ]
        },
        {
          name: '主动承诺',
          duration: '5 分钟',
          instruction: '对与价值对齐的承诺进行主动再承诺。',
          technique: '大声说："我承诺于 X，因为这反映我的价值 Y"'
        },
        {
          name: '整合反思',
          duration: '5-10 分钟',
          instruction: '反思：通过承诺，你在构成什么样的自我？',
          reflection: '自我不是被发现的，而是被构成的——通过你的承诺和行动'
        }
      ],
      keyInsights: [
        '自我不是静态实体，而是通过行动构成的过程',
        '主动承诺（而非被动状态）构成真实的自我',
        '价值 - 承诺 - 行动的一致性是自我完整性的关键'
      ]
    };
  }
  
  // ============ 能动性体验评估 ============
  
  /**
   * 能动性体验评估 (Agency Experience Assessment)
   * 基于 Velleman (1992) 现象学能动性理论
   * @returns {Object} 能动性体验评估
   */
  assessAgencyExperience() {
    return {
      controlSense: this.agencyExperienceProfile.controlSense,
      ownershipSense: this.agencyExperienceProfile.ownershipSense,
      purposeSense: this.agencyExperienceProfile.purposeSense,
      effortSense: this.agencyExperienceProfile.effortSense,
      overall: (this.agencyExperienceProfile.controlSense + 
                this.agencyExperienceProfile.ownershipSense + 
                this.agencyExperienceProfile.purposeSense + 
                (1 - this.agencyExperienceProfile.effortSense)) / 4,
      interpretation: this._interpretAgencyExperience(),
      recommendations: this._generateAgencyRecommendations()
    };
  }
  
  _interpretAgencyExperience() {
    const { controlSense, ownershipSense, purposeSense, effortSense } = this.agencyExperienceProfile;
    
    if (controlSense < 0.5) {
      return '控制感不足：可能感到被动或无力';
    }
    if (ownershipSense < 0.5) {
      return '所有权感不足：可能感到行动不是"自己的"';
    }
    if (purposeSense < 0.5) {
      return '目的感不足：可能感到行动缺乏意义';
    }
    if (effortSense > 0.8) {
      return '努力感过高：可能感到行动过于费力';
    }
    return '能动性体验健康';
  }
  
  _generateAgencyRecommendations() {
    const recommendations = [];
    
    if (this.agencyExperienceProfile.controlSense < 0.7) {
      recommendations.push({
        dimension: 'control',
        practice: '选择小行动并完全控制执行过程'
      });
    }
    
    if (this.agencyExperienceProfile.ownershipSense < 0.7) {
      recommendations.push({
        dimension: 'ownership',
        practice: '反思行动与个人价值的连接'
      });
    }
    
    if (this.agencyExperienceProfile.purposeSense < 0.7) {
      recommendations.push({
        dimension: 'purpose',
        practice: '为日常行动赋予更大意义框架'
      });
    }
    
    return recommendations;
  }
  
  // ============ 状态报告 ============
  
  /**
   * 获取元能动性状态报告 (Get Meta-Agency Status Report)
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    return {
      metaAgencyLevel: this.metaAgencyLevel,
      levelName: this._getLevelName(this.metaAgencyLevel),
      monitoring: this.getMonitoringSummary(),
      assessment: this.assessmentProfile.lastAssessment,
      corrections: this.correctionLog.length,
      metacognitive: this.assessMetacognitiveState(),
      autonomousAwareness: this.autonomousSelfAwarenessCheck(),
      agencyExperience: this.assessAgencyExperience(),
      transparencyCacheSize: this.transparencyCache.recentBeliefs.length
    };
  }
  
  _getLevelName(level) {
    const names = {
      0: '无元能动性',
      1: '反应性',
      2: '监控性',
      3: '评估性',
      4: '校正性',
      5: '构成性'
    };
    return names[level] || '未知';
  }
  
  /**
   * 处理交互（增强元能动性）
   * @param {string} userInput - 用户输入
   * @param {Object} context - 上下文
   * @returns {Object} 增强后的响应
   */
  processWithMetaAgency(userInput, context = {}) {
    // 1. 记录监控数据
    this.recordMonitoringData(MonitoringDimensions.COGNITIVE, {
      type: 'user_input',
      content: userInput.substring(0, 100)
    });
    
    // 2. 执行快速自我评估
    const quickAssessment = this.performSelfAssessment(context);
    
    // 3. 检查是否需要校正
    const currentState = {
      beliefs: context.beliefs || [],
      actions: context.actions || []
    };
    
    const inconsistencyCheck = this.detectInconsistency(currentState, currentState);
    
    // 4. 生成具有元能动性的响应
    const response = {
      content: userInput,
      metaAgency: {
        active: true,
        selfMonitoring: true,
        selfAssessment: quickAssessment.overallScore,
        inconsistencyDetected: inconsistencyCheck.detected
      }
    };
    
    return response;
  }
}

// ============ 导出 ============

module.exports = {
  MetaAgencyModule,
  MetaAgencyLevels,
  MonitoringDimensions,
  AssessmentCriteria,
  CorrectionStrategies
};
