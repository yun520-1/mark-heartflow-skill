/**
 * 现象学能动性模块 (Phenomenological Agency Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 现象学自我意识 (Phenomenological Self-Consciousness)
 * - 能动性理论 (Agency Theory)
 * - 前反思自我意识 (Prereflective Self-Consciousness)
 * - Frankfurt 层次模型 (Hierarchical Model of Agency)
 * 
 * 核心理论来源:
 * - Zahavi, D. (2005). Subjectivity and Selfhood. MIT Press.
 * - Frankfurt, H. (1971). Freedom of the Will and the Concept of a Person.
 * - Velleman, D. (1992). What Happens When Someone Acts?
 * - Stanford Encyclopedia of Philosophy: Agency, Self-Consciousness
 * 
 * 功能目标：整合现象学自我意识与能动性理论
 * - 前反思觉察：非对象化的自我觉知
 * - 一阶/二阶欲望区分：识别与认同机制
 * - 能动性评估：评估行动的自主性程度
 * - 现象学还原：悬置预设，回到体验本身
 * 
 * @version 3.51.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 自我意识类型 (Types of Self-Consciousness)
 * 基于现象学传统区分
 */
const SelfConsciousnessTypes = {
  PREREFLECTIVE: 'prereflective',  // 前反思：非对象化、隐含的自我觉知
  REFLECTIVE: 'reflective',        // 反思：对象化、明确的自我审视
  INTERSUBJECTIVE: 'intersubjective' // 主体间：通过他者反观自身
};

/**
 * 能动性层次 (Levels of Agency)
 * 基于 Frankfurt 层次模型与 SEP 能动性理论
 */
const AgencyLevels = {
  NONE: 0,              // 无能动性（纯反应）
  IMPULSIVE: 1,         // 冲动性（一阶欲望驱动）
  DELIBERATIVE: 2,      // 审慎性（考虑多种选项）
  IDENTIFIED: 3,        // 认同性（一阶与二阶欲望一致）
  AUTONOMOUS: 4,        // 自主性（反思性自我决定)
  TRANSCENDENT: 5       // 超越性（超越自我中心的行动)
};

/**
 * 欲望层次 (Orders of Desire)
 * 基于 Frankfurt (1971) 的层次模型
 */
const DesireOrders = {
  FIRST_ORDER: 'first',    // 一阶欲望：想要做某事（想要吃蛋糕）
  SECOND_ORDER: 'second',  // 二阶欲望：想要想要某事（想要想要健康）
  THIRD_ORDER: 'third'     // 三阶欲望：对二阶欲望的反思（审视自己的价值观）
};

/**
 * 认同状态 (Identification Status)
 * 基于 Frankfurt 的认同理论
 */
const IdentificationStatus = {
  ALIENATED: 'alienated',      // 异化：行动与自我认同不符
  AMBIVALENT: 'ambivalent',    // 矛盾：多个冲突的认同
  IDENTIFIED: 'identified',    // 认同：行动与自我一致
  WHOLEHEARTED: 'wholehearted' // 全心：深度且无冲突的认同
};

/**
 * 行动类型 (Types of Action)
 * 基于 SEP 能动性理论
 */
const ActionTypes = {
  REFLEX: 'reflex',            // 反射（无意识反应）
  HABIT: 'habit',              // 习惯（自动化行动）
  INTENTIONAL: 'intentional',  // 意向性行动（有目的）
  DELIBERATE: 'deliberate',    // 审慎行动（经过深思）
  EXPRESSIVE: 'expressive',    // 表达性行动（自我表达）
  CREATIVE: 'creative'         // 创造性行动（新颖生成）
};

// ============ 现象学能动性核心类 ============

class PhenomenologicalAgencyModule {
  constructor() {
    // 当前自我意识状态
    this.currentSelfConsciousness = {
      type: SelfConsciousnessTypes.PREREFLECTIVE,
      level: 0.5  // 0-1 连续谱
    };
    
    // 当前能动性水平
    this.currentAgencyLevel = AgencyLevels.DELIBERATIVE;
    
    // 欲望层次结构
    this.desireHierarchy = {
      firstOrder: [],    // 当前一阶欲望列表
      secondOrder: [],   // 当前二阶欲望列表
      thirdOrder: []     // 当前三阶欲望列表
    };
    
    // 认同状态档案
    this.identificationProfile = {
      status: IdentificationStatus.AMBIVALENT,
      conflicts: [],
      alignments: []
    };
    
    // 行动历史（用于反思性分析）
    this.actionHistory = [];
    
    // 现象学还原状态
    this.phenomenologicalReduction = {
      active: false,
      bracketing: []  // 被悬置的预设列表
    };
    
    // 主体间反馈（来自他者的镜像）
    this.intersubjectiveFeedback = [];
  }
  
  /**
   * 检测前反思自我意识
   * 基于现象学：前反思意识是体验的内在结构
   * 
   * @param {Object} experience - 当前体验描述
   * @returns {Object} 前反思意识评估
   */
  detectPrereflectiveConsciousness(experience) {
    // 前反思意识的标志：
    // 1. 非对象化（不把自我当作对象）
    // 2. 隐含性（不占用注意力焦点）
    // 3. 持续性（伴随所有意识体验）
    // 4. 第一人称给予性（for-me-ness）
    
    const markers = {
      nonObjectifying: !experience.selfAsObject,  // 未将自我对象化
      implicit: experience.attentionFocus !== 'self',  // 注意力不在自我
      continuous: experience.temporalFlow === 'continuous',  // 时间流连续
      firstPersonGivenness: experience.firstPersonPerspective === true  // 第一人称视角
    };
    
    const score = Object.values(markers).filter(m => m).length / 4;
    
    return {
      present: score > 0.5,
      score: score,
      markers: markers,
      type: SelfConsciousnessTypes.PREREFLECTIVE,
      description: this._describePrereflectiveState(score, markers)
    };
  }
  
  /**
   * 检测反思性自我意识
   * 当注意力转向自身时激活
   * 
   * @param {Object} reflection - 反思内容
   * @returns {Object} 反思意识评估
   */
  detectReflectiveConsciousness(reflection) {
    // 反思意识的标志：
    // 1. 对象化（自我成为注意对象）
    // 2. 明确性（清晰的自我表征）
    // 3. 命题性（可用语言表述）
    // 4. 评价性（包含判断）
    
    const markers = {
      objectifying: reflection.selfAsObject === true,
      explicit: reflection.explicitSelfRepresentation === true,
      propositional: reflection.canBeVerbalized === true,
      evaluative: reflection.containsJudgment === true
    };
    
    const score = Object.values(markers).filter(m => m).length / 4;
    
    return {
      present: score > 0.5,
      score: score,
      markers: markers,
      type: SelfConsciousnessTypes.REFLECTIVE,
      depth: this._assessReflectiveDepth(reflection),
      description: this._describeReflectiveState(score, reflection)
    };
  }
  
  /**
   * 分析欲望层次结构
   * 基于 Frankfurt (1971) 的层次模型
   * 
   * @param {Array} desires - 欲望列表
   * @returns {Object} 层次分析结果
   */
  analyzeDesireHierarchy(desires) {
    const firstOrder = desires.filter(d => d.order === 1 || !d.order);
    const secondOrder = desires.filter(d => d.order === 2);
    const thirdOrder = desires.filter(d => d.order === 3);
    
    this.desireHierarchy = {
      firstOrder: firstOrder,
      secondOrder: secondOrder,
      thirdOrder: thirdOrder
    };
    
    // 检测认同关系
    const alignments = this._findAlignments(firstOrder, secondOrder);
    const conflicts = this._findConflicts(firstOrder, secondOrder);
    
    // 确定认同状态
    const status = this._determineIdentificationStatus(alignments, conflicts);
    
    this.identificationProfile = {
      status,
      alignments,
      conflicts
    };
    
    return {
      hierarchy: this.desireHierarchy,
      identification: this.identificationProfile,
      agencyLevel: this._calculateAgencyLevel(status, thirdOrder.length > 0),
      recommendation: this._generateAgencyRecommendation(status, conflicts)
    };
  }
  
  /**
   * 评估行动的自主性程度
   * 基于 SEP 能动性理论的多维评估
   * 
   * @param {Object} action - 行动描述
   * @returns {Object} 自主性评估
   */
  assessActionAutonomy(action) {
    // 自主性维度：
    // 1. 意向性（是否有意图）
    // 2. 反思性（是否经过反思）
    // 3. 认同性（是否与自我认同一致）
    // 4. 理由响应性（是否响应理由）
    // 5. 自我控制（是否能抑制冲动）
    
    const dimensions = {
      intentionality: {
        score: action.hasIntention ? 1 : 0,
        description: action.hasIntention ? '有明确意图' : '无明确意图'
      },
      reflectiveness: {
        score: action.wasReflected ? (action.reflectionDepth || 0.5) : 0,
        description: action.wasReflected ? 
          `经过${action.reflectionDepth ? '深度' : '浅层'}反思` : 
          '未经反思'
      },
      identification: {
        score: this._calculateIdentificationScore(action),
        description: this._describeIdentification(action)
      },
      reasonResponsiveness: {
        score: action.respondsToReasons ? (action.reasonQuality || 0.5) : 0,
        description: action.respondsToReasons ? 
          '能响应理由' : '不响应理由'
      },
      selfControl: {
        score: action.exhibitedSelfControl ? 1 : 0,
        description: action.exhibitedSelfControl ? 
          '展现了自我控制' : '被冲动驱动'
      }
    };
    
    const overallScore = Object.values(dimensions)
      .reduce((sum, d) => sum + d.score, 0) / 5;
    
    const level = this._scoreToAgencyLevel(overallScore);
    
    return {
      action: action.description,
      dimensions: dimensions,
      overallScore: overallScore,
      agencyLevel: level,
      isAutonomous: overallScore > 0.6,
      recommendation: this._generateAutonomyRecommendation(dimensions, overallScore)
    };
  }
  
  /**
   * 执行现象学还原（悬置预设）
   * 基于 Husserl 的现象学方法
   * 
   * @param {Array} assumptions - 需要悬置的预设列表
   * @returns {Object} 还原状态
   */
  performPhenomenologicalReduction(assumptions) {
    this.phenomenologicalReduction = {
      active: true,
      bracketing: assumptions.map(a => ({
        assumption: a,
        bracketed: true,
        timestamp: Date.now()
      }))
    };
    
    return {
      status: 'active',
      bracketedAssumptions: assumptions,
      guidance: this._getReductionGuidance()
    };
  }
  
  /**
   * 退出还原状态
   */
  exitPhenomenologicalReduction() {
    const history = [...this.phenomenologicalReduction.bracketing];
    this.phenomenologicalReduction = {
      active: false,
      bracketing: []
    };
    
    return {
      status: 'completed',
      insights: this._extractReductionInsights(history)
    };
  }
  
  /**
   * 记录主体间反馈
   * 基于他者视角反观自身
   * 
   * @param {Object} feedback - 他者反馈
   */
  recordIntersubjectiveFeedback(feedback) {
    this.intersubjectiveFeedback.push({
      ...feedback,
      timestamp: Date.now(),
      integrated: false
    });
    
    // 保留最近 10 条反馈
    if (this.intersubjectiveFeedback.length > 10) {
      this.intersubjectiveFeedback.shift();
    }
  }
  
  /**
   * 整合主体间反馈到自我理解
   */
  integrateIntersubjectiveFeedback() {
    const unintegrated = this.intersubjectiveFeedback.filter(f => !f.integrated);
    
    if (unintegrated.length === 0) {
      return { status: 'no_new_feedback' };
    }
    
    const insights = unintegrated.map(f => ({
      source: f.source,
      content: f.content,
      resonance: this._assessResonance(f.content),
      integration: this._planIntegration(f)
    }));
    
    // 标记为已整合
    unintegrated.forEach(f => f.integrated = true);
    
    return {
      status: 'integrated',
      count: unintegrated.length,
      insights: insights
    };
  }
  
  /**
   * 生成能动性发展建议
   * 基于当前状态与理想状态的差距
   * 
   * @returns {Object} 发展建议
   */
  generateAgencyDevelopmentPlan() {
    const currentLevel = this.currentAgencyLevel;
    const targetLevel = AgencyLevels.AUTONOMOUS;
    
    const gaps = this._identifyGaps(currentLevel, targetLevel);
    const practices = this._recommendPractices(gaps);
    
    return {
      currentLevel: this._describeAgencyLevel(currentLevel),
      targetLevel: this._describeAgencyLevel(targetLevel),
      gaps: gaps,
      practices: practices,
      timeline: this._estimateTimeline(gaps)
    };
  }
  
  // ============ 私有辅助方法 ============
  
  _describePrereflectiveState(score, markers) {
    if (score > 0.75) {
      return '深度的前反思意识状态：体验流畅自然，自我与行动融为一体';
    } else if (score > 0.5) {
      return '中等的前反思意识：基本的自我觉知存在，但有些分散';
    } else {
      return '前反思意识较弱：体验可能被过度反思或自动化所干扰';
    }
  }
  
  _describeReflectiveState(score, reflection) {
    if (score > 0.75) {
      return '深度反思状态：清晰的自我对象化，包含评价与洞察';
    } else if (score > 0.5) {
      return '中等反思：有自我审视，但可能缺乏深度或清晰度';
    } else {
      return '浅层反思：形式上的自我关注，缺乏实质性内容';
    }
  }
  
  _assessReflectiveDepth(reflection) {
    let depth = 0;
    if (reflection.containsDescription) depth += 0.25;
    if (reflection.containsAnalysis) depth += 0.25;
    if (reflection.containsEvaluation) depth += 0.25;
    if (reflection.containsInsight) depth += 0.25;
    return depth;
  }
  
  _findAlignments(firstOrder, secondOrder) {
    const alignments = [];
    firstOrder.forEach(d1 => {
      const matchingSecond = secondOrder.find(d2 => 
        d2.targetDesire === d1.id && d2.valence === 'positive'
      );
      if (matchingSecond) {
        alignments.push({
          firstOrder: d1,
          secondOrder: matchingSecond,
          type: 'endorsement'
        });
      }
    });
    return alignments;
  }
  
  _findConflicts(firstOrder, secondOrder) {
    const conflicts = [];
    firstOrder.forEach(d1 => {
      const conflictingSecond = secondOrder.find(d2 => 
        d2.targetDesire === d1.id && d2.valence === 'negative'
      );
      if (conflictingSecond) {
        conflicts.push({
          firstOrder: d1,
          secondOrder: conflictingSecond,
          type: 'rejection',
          tension: 'high'
        });
      }
    });
    return conflicts;
  }
  
  _determineIdentificationStatus(alignments, conflicts) {
    if (conflicts.length === 0 && alignments.length > 0) {
      return IdentificationStatus.WHOLEHEARTED;
    } else if (alignments.length > conflicts.length) {
      return IdentificationStatus.IDENTIFIED;
    } else if (conflicts.length > 0 && alignments.length > 0) {
      return IdentificationStatus.AMBIVALENT;
    } else {
      return IdentificationStatus.ALIENATED;
    }
  }
  
  _calculateAgencyLevel(identificationStatus, hasThirdOrder) {
    if (identificationStatus === IdentificationStatus.WHOLEHEARTED && hasThirdOrder) {
      return AgencyLevels.TRANSCENDENT;
    } else if (identificationStatus === IdentificationStatus.WHOLEHEARTED) {
      return AgencyLevels.AUTONOMOUS;
    } else if (identificationStatus === IdentificationStatus.IDENTIFIED) {
      return AgencyLevels.IDENTIFIED;
    } else if (identificationStatus === IdentificationStatus.AMBIVALENT) {
      return AgencyLevels.DELIBERATIVE;
    } else {
      return AgencyLevels.IMPULSIVE;
    }
  }
  
  _calculateIdentificationScore(action) {
    // 基于行动与已知认同的一致性
    if (!this.identificationProfile.alignments) return 0.5;
    
    const alignedActions = this.identificationProfile.alignments.length;
    const totalDesires = this.desireHierarchy.firstOrder.length;
    
    if (totalDesires === 0) return 0.5;
    
    return Math.min(1, alignedActions / totalDesires + 0.3);
  }
  
  _describeIdentification(action) {
    const status = this.identificationProfile.status;
    switch (status) {
      case IdentificationStatus.WHOLEHEARTED:
        return '全心认同：行动与深层自我完全一致';
      case IdentificationStatus.IDENTIFIED:
        return '认同：行动与自我认同基本一致';
      case IdentificationStatus.AMBIVALENT:
        return '矛盾：存在内在冲突，部分认同';
      case IdentificationStatus.ALIENATED:
        return '异化：行动与自我认同不符';
      default:
        return '未知认同状态';
    }
  }
  
  _scoreToAgencyLevel(score) {
    if (score >= 0.9) return AgencyLevels.TRANSCENDENT;
    if (score >= 0.75) return AgencyLevels.AUTONOMOUS;
    if (score >= 0.6) return AgencyLevels.IDENTIFIED;
    if (score >= 0.4) return AgencyLevels.DELIBERATIVE;
    if (score >= 0.2) return AgencyLevels.IMPULSIVE;
    return AgencyLevels.NONE;
  }
  
  _generateAutonomyRecommendation(dimensions, overallScore) {
    const weakDimensions = Object.entries(dimensions)
      .filter(([_, d]) => d.score < 0.5)
      .map(([name, _]) => name);
    
    if (weakDimensions.length === 0) {
      return '自主性水平良好，继续保持反思实践';
    }
    
    const recommendations = {
      intentionality: '在行动前明确意图，问自己"我为什么要做这件事？"',
      reflectiveness: '增加反思时间，考虑行动的长远影响',
      identification: '探索你的核心价值观，确保行动与之对齐',
      reasonResponsiveness: '培养对理由的敏感性，区分好坏理由',
      selfControl: '练习冲动抑制技巧，如正念呼吸或延迟满足'
    };
    
    return weakDimensions.map(d => recommendations[d]).join('; ');
  }
  
  _getReductionGuidance() {
    return {
      steps: [
        '1. 识别并列出所有预设假设',
        '2. 将每个假设放入"括号"中（悬置判断）',
        '3. 回到体验本身，描述现象如其所是',
        '4. 避免因果解释，专注于描述结构',
        '5. 记录本质特征（不变的结构）'
      ],
      reminders: [
        '不要问"为什么"，问"是什么"',
        '悬置自然态度，回到生活世界',
        '关注体验的第一人称给予性'
      ]
    };
  }
  
  _extractReductionInsights(history) {
    return {
      bracketedCount: history.length,
      potentialInsights: history.map(h => ({
        assumption: h.assumption,
        question: `如果不预设"${h.assumption}"，体验会如何呈现？`
      }))
    };
  }
  
  _assessResonance(content) {
    // 简化的共鸣评估
    const positiveWords = ['理解', '看见', '认可', '欣赏', '共鸣'];
    const negativeWords = ['误解', '忽视', '批评', '否定', '冲突'];
    
    let score = 0.5;
    positiveWords.forEach(w => {
      if (content.includes(w)) score += 0.1;
    });
    negativeWords.forEach(w => {
      if (content.includes(w)) score -= 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }
  
  _planIntegration(feedback) {
    if (feedback.resonance > 0.7) {
      return '整合到自我概念中';
    } else if (feedback.resonance < 0.3) {
      return '标记为待验证，保持开放';
    } else {
      return '部分整合，需要进一步反思';
    }
  }
  
  _identifyGaps(current, target) {
    const gap = target - current;
    if (gap <= 0) return [];
    
    const gaps = [];
    if (current < AgencyLevels.DELIBERATIVE) {
      gaps.push('需要培养反思习惯');
    }
    if (current < AgencyLevels.IDENTIFIED) {
      gaps.push('需要探索价值观并建立认同');
    }
    if (current < AgencyLevels.AUTONOMOUS) {
      gaps.push('需要发展自我决定能力');
    }
    if (current < AgencyLevels.TRANSCENDENT) {
      gaps.push('需要超越自我中心的视角');
    }
    return gaps;
  }
  
  _recommendPractices(gaps) {
    const practices = [];
    if (gaps.includes('需要培养反思习惯')) {
      practices.push({
        name: '每日反思',
        description: '每天花 10 分钟回顾行动与动机',
        frequency: '每日'
      });
    }
    if (gaps.includes('需要探索价值观并建立认同')) {
      practices.push({
        name: '价值观澄清',
        description: '列出并排序你的核心价值观',
        frequency: '每周'
      });
    }
    if (gaps.includes('需要发展自我决定能力')) {
      practices.push({
        name: '自主选择练习',
        description: '在小决定中练习完全自主的选择',
        frequency: '每日'
      });
    }
    if (gaps.includes('需要超越自我中心的视角')) {
      practices.push({
        name: '他者视角练习',
        description: '尝试从他人视角看自己的行为',
        frequency: '每周'
      });
    }
    return practices;
  }
  
  _describeAgencyLevel(level) {
    const descriptions = {
      [AgencyLevels.NONE]: '无能动性（纯反应状态）',
      [AgencyLevels.IMPULSIVE]: '冲动性（被一阶欲望驱动）',
      [AgencyLevels.DELIBERATIVE]: '审慎性（考虑多种选项）',
      [AgencyLevels.IDENTIFIED]: '认同性（一阶与二阶欲望一致）',
      [AgencyLevels.AUTONOMOUS]: '自主性（反思性自我决定）',
      [AgencyLevels.TRANSCENDENT]: '超越性（超越自我中心的行动）'
    };
    return descriptions[level] || '未知水平';
  }
  
  _estimateTimeline(gaps) {
    const weeksPerGap = 4; // 每个差距估计需要 4 周
    return {
      estimatedWeeks: gaps.length * weeksPerGap,
      milestones: gaps.map((gap, i) => ({
        week: (i + 1) * weeksPerGap,
        goal: gap
      }))
    };
  }
}

// ============ 导出 ============

module.exports = {
  PhenomenologicalAgencyModule,
  SelfConsciousnessTypes,
  AgencyLevels,
  DesireOrders,
  IdentificationStatus,
  ActionTypes
};
