/**
 * Emotion Rationality Module - 情绪理性模块
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 情绪理论第 10 节
 * "Rationality and Emotions" (https://plato.stanford.edu/entries/emotion/#RatiEmot)
 * 
 * 核心理论来源:
 * - 认知理性 (Cognitive Rationality): fittingness, warrant, coherence
 * - 战略理性 (Strategic Rationality): instrumental and substantive
 * - 情绪与理由的关系 (Emotions and Reasons)
 * - 情绪的可辩护性 (Justifiability of Emotions)
 * 
 * 版本：v3.39.0
 * 创建时间：2026-03-30
 */

// ============================================================================
// 情绪理性的类型学
// ============================================================================

/**
 * 情绪理性的两大类型 (SEP 10.1-10.2)
 */
const RationalityTypes = {
  /**
   * 认知理性 (Cognitive Rationality)
   * 情绪是否恰当地反映了其对象的评价性特征
   */
  COGNITIVE: 'cognitive',
  
  /**
   * 战略理性 (Strategic Rationality)
   * 情绪是否有助于实现行动者的目标
   */
  STRATEGIC: 'strategic'
};

/**
 * 认知理性的三个子类型 (SEP 10.1)
 */
const CognitiveRationalityTypes = {
  /**
   * 恰当性 (Fittingness)
   * 情绪的形式对象是否被其特定对象所例示
   * 例：恐惧的形式对象是"危险"，只有当对象确实危险时，恐惧才是恰当的
   */
  FITTINGNESS: 'fittingness',
  
  /**
   * 证成性 (Warrant)
   * 情绪是否基于充分的证据或理由
   * 例：如果有充分证据表明某物危险，恐惧就是有证成的
   */
  WARRANT: 'warrant',
  
  /**
   * 一致性 (Coherence)
   * 情绪是否与行动者的其他信念、欲望和情绪相一致
   * 例：如果相信某物无害却仍然恐惧，就存在不一致
   */
  COHERENCE: 'coherence'
};

/**
 * 战略理性的两个子类型 (SEP 10.2)
 */
const StrategicRationalityTypes = {
  /**
   * 工具理性 (Instrumental Rationality)
   * 情绪是否有效地促进行动者的目标实现
   * 例：适度的焦虑可以提高表现，但过度焦虑会妨碍表现
   */
  INSTRUMENTAL: 'instrumental',
  
  /**
   * 实质理性 (Substantive Rationality)
   * 情绪所服务的目标本身是否合理
   * 例：嫉妒可能有效地保护关系（工具理性），但嫉妒的目标本身可能不合理（实质理性）
   */
  SUBSTANTIVE: 'substantive'
};

// ============================================================================
// 情绪的形式对象 (Formal Objects of Emotions)
// ============================================================================

/**
 * 常见情绪的形式对象 (基于 Lazarus 的核心关系主题和 SEP 情绪理论)
 * 
 * 形式对象定义了情绪的恰当性条件：
 * 情绪 E 是恰当的，当且仅当其特定对象例示了 E 的形式对象
 */
const FormalObjects = {
  // 基本情绪
  FEAR: {
    emotion: 'fear',
    formalObject: 'danger', // 危险
    description: '恐惧恰当当且仅当对象构成威胁或危险'
  },
  ANGER: {
    emotion: 'anger',
    formalObject: 'slight/offense', // 冒犯
    description: '愤怒恰当当且仅当行动者或其关心的人/事被冒犯'
  },
  SADNESS: {
    emotion: 'sadness',
    formalObject: 'loss', // 损失
    description: '悲伤恰当当且仅当行动者失去了有价值的人/事'
  },
  HAPPINESS: {
    emotion: 'happiness',
    formalObject: 'goal progress', // 目标进展
    description: '快乐恰当当且仅当行动者在实现目标的道路上取得进展'
  },
  DISGUST: {
    emotion: 'disgust',
    formalObject: 'contamination', // 污染
    description: '厌恶恰当当且仅当对象构成污染或腐败的威胁'
  },
  SURPRISE: {
    emotion: 'surprise',
    formalObject: 'unexpectedness', // 意外
    description: '惊讶恰当当且仅当事件违背了行动者的预期'
  },
  
  // 自我意识情绪
  SHAME: {
    emotion: 'shame',
    formalObject: 'ego ideal failure', // 自我理想失败
    description: '羞耻恰当当且仅当行动者未能达到其自我理想'
  },
  GUILT: {
    emotion: 'guilt',
    formalObject: 'moral transgression', // 道德越轨
    description: '内疚恰当当且仅当行动者违反了其道德标准'
  },
  PRIDE: {
    emotion: 'pride',
    formalObject: 'ego enhancement', // 自我提升
    description: '自豪恰当当且仅当行动者取得了值得称赞的成就'
  },
  
  // 社会情绪
  JEALOUSY: {
    emotion: 'jealousy',
    formalObject: 'relationship threat', // 关系威胁
    description: '嫉妒恰当当且仅当有价值的关系受到第三方威胁'
  },
  ENVY: {
    emotion: 'envy',
    formalObject: 'undeserved advantage', // 不应得的优势
    description: '羡慕/嫉妒恰当当且仅当他人拥有行动者应得的优势'
  },
  GRATITUDE: {
    emotion: 'gratitude',
    formalObject: 'undeserved benefit', // 不应得的恩惠
    description: '感激恰当当且仅当行动者收到了不应得的恩惠'
  },
  CONTEMPT: {
    emotion: 'contempt',
    formalObject: 'character flaw', // 品格缺陷
    description: '轻蔑恰当当且仅当对象显示出严重的品格缺陷'
  }
};

// ============================================================================
// 情绪理性评估器
// ============================================================================

/**
 * 情绪理性评估模块
 * 
 * 提供多维度的情绪理性评估功能
 */
class EmotionRationalityModule {
  constructor() {
    // 情绪历史记录，用于一致性检查
    this.emotionHistory = [];
    
    // 信念存储，用于证成性检查
    this.beliefs = new Map();
    
    // 目标存储，用于战略理性检查
    this.goals = new Map();
    
    // 配置
    this.config = {
      maxHistorySize: 100, // 最大历史记录数
      coherenceThreshold: 0.7, // 一致性阈值
      warrantThreshold: 0.6 // 证成性阈值
    };
  }
  
  // ==========================================================================
  // 认知理性评估
  // ==========================================================================
  
  /**
   * 评估情绪的恰当性 (Fittingness Assessment)
   * 
   * @param {string} emotionType - 情绪类型 (如 'fear', 'anger')
   * @param {object} particularObject - 情绪的特定对象
   * @param {object} context - 情境信息
   * @returns {object} 恰当性评估结果
   */
  assessFittingness(emotionType, particularObject, context = {}) {
    const formalObjectInfo = FormalObjects[emotionType.toUpperCase()];
    
    if (!formalObjectInfo) {
      return {
        emotion: emotionType,
        fittingness: 'unknown',
        reason: `未知的情绪类型：${emotionType}`
      };
    }
    
    // 评估特定对象是否例示了形式对象
    const instantiates = this._checkFormalObjectInstantiation(
      emotionType,
      particularObject,
      context
    );
    
    const fittingness = instantiates ? 'fitting' : 'unfitting';
    const confidence = instantiates ? 0.9 : 0.1;
    
    return {
      emotion: emotionType,
      formalObject: formalObjectInfo.formalObject,
      particularObject: particularObject,
      fittingness,
      instantiates,
      confidence,
      reason: instantiates
        ? `对象例示了${formalObjectInfo.formalObject}，情绪是恰当的`
        : `对象未例示${formalObjectInfo.formalObject}，情绪是不恰当的`
    };
  }
  
  /**
   * 评估情绪的证成性 (Warrant Assessment)
   * 
   * @param {string} emotionType - 情绪类型
   * @param {object} evidence - 支持情绪的证据
   * @param {object} context - 情境信息
   * @returns {object} 证成性评估结果
   */
  assessWarrant(emotionType, evidence = {}, context = {}) {
    // 计算证据强度
    const evidenceStrength = this._calculateEvidenceStrength(evidence, context);
    
    const hasWarrant = evidenceStrength >= this.config.warrantThreshold;
    
    return {
      emotion: emotionType,
      evidenceStrength,
      threshold: this.config.warrantThreshold,
      hasWarrant,
      warrantLevel: evidenceStrength >= 0.8 ? 'strong' : 
                    evidenceStrength >= 0.6 ? 'moderate' : 
                    evidenceStrength >= 0.4 ? 'weak' : 'none',
      evidence: evidence,
      reason: hasWarrant
        ? `证据强度 (${evidenceStrength.toFixed(2)}) 超过阈值，情绪有证成`
        : `证据强度 (${evidenceStrength.toFixed(2)}) 不足，情绪缺乏证成`
    };
  }
  
  /**
   * 评估情绪的一致性 (Coherence Assessment)
   * 
   * @param {string} emotionType - 情绪类型
   * @param {object} particularObject - 情绪的特定对象
   * @param {object} otherAttitudes - 其他态度（信念、欲望、情绪）
   * @returns {object} 一致性评估结果
   */
  assessCoherence(emotionType, particularObject, otherAttitudes = {}) {
    const conflicts = [];
    const supports = [];
    
    // 检查与信念的冲突
    if (otherAttitudes.beliefs) {
      const beliefConflicts = this._checkBeliefConflicts(
        emotionType,
        particularObject,
        otherAttitudes.beliefs
      );
      conflicts.push(...beliefConflicts);
    }
    
    // 检查与其他情绪的不一致
    if (otherAttitudes.emotions) {
      const emotionConflicts = this._checkEmotionConflicts(
        emotionType,
        particularObject,
        otherAttitudes.emotions
      );
      conflicts.push(...emotionConflicts);
    }
    
    // 检查支持关系
    if (otherAttitudes.supportingBeliefs) {
      supports.push(...otherAttitudes.supportingBeliefs);
    }
    
    const coherenceScore = this._calculateCoherenceScore(conflicts, supports);
    const isCoherent = coherenceScore >= this.config.coherenceThreshold;
    
    return {
      emotion: emotionType,
      coherenceScore,
      threshold: this.config.coherenceThreshold,
      isCoherent,
      conflicts,
      supports,
      reason: isCoherent
        ? `情绪与其他态度一致 (一致性分数：${coherenceScore.toFixed(2)})`
        : `情绪与其他态度存在冲突 (一致性分数：${coherenceScore.toFixed(2)})`
    };
  }
  
  // ==========================================================================
  // 战略理性评估
  // ==========================================================================
  
  /**
   * 评估情绪的工具理性 (Instrumental Rationality Assessment)
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} goalId - 相关目标 ID
   * @param {object} context - 情境信息
   * @returns {object} 工具理性评估结果
   */
  assessInstrumentalRationality(emotionType, goalId, context = {}) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return {
        emotion: emotionType,
        goalId,
        instrumentalRationality: 'unknown',
        reason: `未找到目标：${goalId}`
      };
    }
    
    // 评估情绪对目标的促进作用
    const facilitates = this._assessGoalFacilitation(emotionType, goal, context);
    
    return {
      emotion: emotionType,
      goal: goal,
      facilitates,
      instrumentalRationality: facilitates ? 'rational' : 'irrational',
      reason: facilitates
        ? `情绪促进目标"${goal.name}"的实现`
        : `情绪妨碍目标"${goal.name}"的实现`
    };
  }
  
  /**
   * 评估情绪的实质理性 (Substantive Rationality Assessment)
   * 
   * @param {string} emotionType - 情绪类型
   * @param {string} goalId - 相关目标 ID
   * @param {object} values - 价值体系
   * @returns {object} 实质理性评估结果
   */
  assessSubstantiveRationality(emotionType, goalId, values = {}) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return {
        emotion: emotionType,
        goalId,
        substantiveRationality: 'unknown',
        reason: `未找到目标：${goalId}`
      };
    }
    
    // 评估目标本身的价值合理性
    const goalIsValuable = this._assessGoalValue(goal, values);
    
    return {
      emotion: emotionType,
      goal: goal,
      goalIsValuable,
      substantiveRationality: goalIsValuable ? 'rational' : 'irrational',
      reason: goalIsValuable
        ? `目标"${goal.name}"本身具有价值`
        : `目标"${goal.name}"本身缺乏价值`
    };
  }
  
  // ==========================================================================
  // 综合理性评估
  // ==========================================================================
  
  /**
   * 综合评估情绪的理性状态
   * 
   * @param {string} emotionType - 情绪类型
   * @param {object} particularObject - 情绪的特定对象
   * @param {object} assessmentContext - 评估情境
   * @returns {object} 综合理性评估结果
   */
  assessEmotionRationality(emotionType, particularObject, assessmentContext = {}) {
    const {
      evidence = {},
      otherAttitudes = {},
      goalId = null,
      values = {},
      context = {}
    } = assessmentContext;
    
    // 认知理性评估
    const fittingness = this.assessFittingness(emotionType, particularObject, context);
    const warrant = this.assessWarrant(emotionType, evidence, context);
    const coherence = this.assessCoherence(emotionType, particularObject, otherAttitudes);
    
    // 战略理性评估（如果有目标）
    let instrumental = null;
    let substantive = null;
    
    if (goalId) {
      instrumental = this.assessInstrumentalRationality(emotionType, goalId, context);
      substantive = this.assessSubstantiveRationality(emotionType, goalId, values);
    }
    
    // 计算总体理性分数
    const cognitiveScore = (
      (fittingness.confidence || 0) +
      (warrant.evidenceStrength || 0) +
      (coherence.coherenceScore || 0)
    ) / 3;
    
    const strategicScore = goalId ? (
      ((instrumental.facilitates ? 1 : 0) +
       (substantive.goalIsValuable ? 1 : 0)) / 2
    ) : null;
    
    const overallRationality = strategicScore !== null
      ? (cognitiveScore + strategicScore) / 2
      : cognitiveScore;
    
    // 记录到历史
    this._recordEmotionAssessment({
      emotionType,
      particularObject,
      fittingness,
      warrant,
      coherence,
      instrumental,
      substantive,
      cognitiveScore,
      strategicScore,
      overallRationality,
      timestamp: Date.now()
    });
    
    return {
      emotion: emotionType,
      particularObject,
      cognitiveRationality: {
        fittingness,
        warrant,
        coherence,
        score: cognitiveScore
      },
      strategicRationality: strategicScore !== null ? {
        instrumental,
        substantive,
        score: strategicScore
      } : null,
      overallRationality,
      rationalityLevel: overallRationality >= 0.8 ? 'highly_rational' :
                        overallRationality >= 0.6 ? 'moderately_rational' :
                        overallRationality >= 0.4 ? 'somewhat_irrational' :
                        'highly_irrational',
      recommendations: this._generateRecommendations({
        fittingness,
        warrant,
        coherence,
        instrumental,
        substantive
      })
    };
  }
  
  // ==========================================================================
  // 情绪调节建议
  // ==========================================================================
  
  /**
   * 基于理性评估生成情绪调节建议
   * 
   * @param {object} assessment - 理性评估结果
   * @returns {array} 调节建议列表
   */
  _generateRecommendations(assessment) {
    const recommendations = [];
    
    const { fittingness, warrant, coherence, instrumental, substantive } = assessment;
    
    // 恰当性问题
    if (fittingness.instantiates === false) {
      recommendations.push({
        type: 'reappraisal',
        priority: 'high',
        content: '重新评估情境：当前情绪的对象可能并不具备引发该情绪的评价性特征',
        technique: '认知重评 (Cognitive Reappraisal)'
      });
    }
    
    // 证成性问题
    if (warrant.hasWarrant === false) {
      recommendations.push({
        type: 'evidence_gathering',
        priority: 'high',
        content: '收集更多证据：当前情绪缺乏充分的证据支持',
        technique: '证据检验 (Evidence Testing)'
      });
    }
    
    // 一致性问题
    if (coherence.isCoherent === false && coherence.conflicts.length > 0) {
      recommendations.push({
        type: 'belief_revision',
        priority: 'medium',
        content: `解决信念冲突：情绪与以下信念存在冲突：${coherence.conflicts.map(c => c.belief).join(', ')}`,
        technique: '信念整合 (Belief Integration)'
      });
    }
    
    // 工具理性问题
    if (instrumental && instrumental.facilitates === false) {
      recommendations.push({
        type: 'emotion_regulation',
        priority: 'medium',
        content: '调节情绪强度：当前情绪妨碍目标实现，考虑降低情绪强度或转换情绪类型',
        technique: '情绪调节 (Emotion Regulation)'
      });
    }
    
    // 实质理性问题
    if (substantive && substantive.goalIsValuable === false) {
      recommendations.push({
        type: 'goal_revision',
        priority: 'high',
        content: '反思目标价值：情绪所服务的目标本身可能缺乏价值，考虑调整目标',
        technique: '目标重构 (Goal Restructuring)'
      });
    }
    
    // 如果情绪是理性的，给予确认
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'validation',
        priority: 'low',
        content: '情绪是理性的：当前情绪在认知和战略层面都是合理的',
        technique: '情绪确认 (Emotion Validation)'
      });
    }
    
    return recommendations;
  }
  
  // ==========================================================================
  // 辅助方法
  // ==========================================================================
  
  /**
   * 检查特定对象是否例示了形式对象
   */
  _checkFormalObjectInstantiation(emotionType, particularObject, context) {
    // 简化的实现：基于情境信息进行启发式判断
    // 实际应用中需要更复杂的评价性特征检测
    
    const formalObject = FormalObjects[emotionType.toUpperCase()]?.formalObject;
    
    if (!formalObject) return false;
    
    // 基于情境线索的判断
    const contextCues = context.cues || [];
    
    switch (formalObject) {
      case 'danger':
        return contextCues.some(cue => 
          cue.includes('threat') || cue.includes('harm') || cue.includes('risk')
        );
      case 'slight/offense':
        return contextCues.some(cue => 
          cue.includes('disrespect') || cue.includes('injustice') || cue.includes('wrong')
        );
      case 'loss':
        return contextCues.some(cue => 
          cue.includes('loss') || cue.includes('gone') || cue.includes('end')
        );
      case 'goal progress':
        return contextCues.some(cue => 
          cue.includes('success') || cue.includes('achievement') || cue.includes('progress')
        );
      default:
        return false;
    }
  }
  
  /**
   * 计算证据强度
   */
  _calculateEvidenceStrength(evidence, context) {
    // 简化的实现：基于证据数量和可信度
    const evidenceItems = Object.values(evidence).filter(v => v !== null && v !== undefined);
    
    if (evidenceItems.length === 0) return 0;
    
    const totalStrength = evidenceItems.reduce((sum, item) => {
      if (typeof item === 'object' && item.strength !== undefined) {
        return sum + item.strength;
      }
      if (typeof item === 'boolean') {
        return sum + (item ? 0.5 : 0);
      }
      return sum + 0.3; // 默认证据强度
    }, 0);
    
    return Math.min(1.0, totalStrength / evidenceItems.length);
  }
  
  /**
   * 检查与信念的冲突
   */
  _checkBeliefConflicts(emotionType, particularObject, beliefs) {
    const conflicts = [];
    
    const formalObject = FormalObjects[emotionType.toUpperCase()]?.formalObject;
    
    for (const [beliefId, belief] of Object.entries(beliefs)) {
      // 检查信念是否与情绪的形式对象相矛盾
      if (belief.content && belief.content.includes(`not ${formalObject}`)) {
        conflicts.push({
          type: 'belief_emotion_conflict',
          belief: belief.content,
          emotion: emotionType,
          formalObject: formalObject,
          severity: 'high'
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * 检查与其他情绪的冲突
   */
  _checkEmotionConflicts(emotionType, particularObject, emotions) {
    const conflicts = [];
    
    // 定义情绪冲突对
    const conflictingPairs = [
      ['fear', 'anger'],
      ['love', 'hate'],
      ['hope', 'despair'],
      ['pride', 'shame'],
      ['gratitude', 'resentment']
    ];
    
    for (const [otherEmotion, otherObject] of Object.entries(emotions)) {
      // 检查是否是冲突对
      const isConflictingPair = conflictingPairs.some(pair =>
        (pair[0] === emotionType && pair[1] === otherEmotion) ||
        (pair[1] === emotionType && pair[0] === otherEmotion)
      );
      
      // 检查是否针对同一对象
      const sameObject = JSON.stringify(particularObject) === JSON.stringify(otherObject);
      
      if (isConflictingPair && sameObject) {
        conflicts.push({
          type: 'emotion_emotion_conflict',
          emotion1: emotionType,
          emotion2: otherEmotion,
          object: particularObject,
          severity: 'medium'
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * 计算一致性分数
   */
  _calculateCoherenceScore(conflicts, supports) {
    const baseScore = 1.0;
    
    // 冲突降低分数
    const conflictPenalty = conflicts.reduce((penalty, conflict) => {
      switch (conflict.severity) {
        case 'high': return penalty + 0.3;
        case 'medium': return penalty + 0.2;
        case 'low': return penalty + 0.1;
        default: return penalty + 0.15;
      }
    }, 0);
    
    // 支持提高分数
    const supportBonus = supports.length * 0.05;
    
    return Math.max(0, Math.min(1, baseScore - conflictPenalty + supportBonus));
  }
  
  /**
   * 评估情绪对目标的促进作用
   */
  _assessGoalFacilitation(emotionType, goal, context) {
    // 简化的实现：基于情绪 - 目标匹配
    const emotionGoalMatches = {
      'fear': ['safety', 'protection', 'avoidance'],
      'anger': ['justice', 'boundary_setting', 'change'],
      'sadness': ['acceptance', 'processing', 'letting_go'],
      'happiness': ['achievement', 'connection', 'growth'],
      'guilt': ['reparation', 'improvement', 'alignment']
    };
    
    const matchingGoals = emotionGoalMatches[emotionType] || [];
    return matchingGoals.some(g => goal.type?.includes(g) || goal.name?.toLowerCase().includes(g));
  }
  
  /**
   * 评估目标的价值
   */
  _assessGoalValue(goal, values) {
    // 简化的实现：检查目标是否与价值体系一致
    if (!values || Object.keys(values).length === 0) {
      return true; // 默认目标有价值
    }
    
    // 检查目标是否与核心价值冲突
    const conflictingValues = values.conflicting || [];
    return !conflictingValues.some(v => goal.type?.includes(v));
  }
  
  /**
   * 记录情绪评估到历史
   */
  _recordEmotionAssessment(assessment) {
    this.emotionHistory.push(assessment);
    
    // 保持历史记录大小
    if (this.emotionHistory.length > this.config.maxHistorySize) {
      this.emotionHistory.shift();
    }
  }
  
  /**
   * 更新信念
   */
  updateBelief(beliefId, content, strength = 1.0) {
    this.beliefs.set(beliefId, { content, strength, updatedAt: Date.now() });
  }
  
  /**
   * 添加目标
   */
  addGoal(goalId, name, type = 'general') {
    this.goals.set(goalId, { name, type, createdAt: Date.now() });
  }
  
  /**
   * 获取情绪理性状态报告
   */
  getStatusReport() {
    return {
      moduleType: 'emotion-rationality',
      version: '3.39.0',
      theoryBasis: 'SEP Emotion Theory (Stanford Encyclopedia of Philosophy)',
      rationalityTypes: RationalityTypes,
      cognitiveRationalityTypes: CognitiveRationalityTypes,
      strategicRationalityTypes: StrategicRationalityTypes,
      formalObjectsCount: Object.keys(FormalObjects).length,
      emotionHistorySize: this.emotionHistory.length,
      beliefsCount: this.beliefs.size,
      goalsCount: this.goals.size,
      config: this.config
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  EmotionRationalityModule,
  RationalityTypes,
  CognitiveRationalityTypes,
  StrategicRationalityTypes,
  FormalObjects
};
