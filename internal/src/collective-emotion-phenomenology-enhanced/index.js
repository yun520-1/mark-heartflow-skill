/**
 * 集体情绪现象学增强模块 v5.0.8
 * 
 * 基于 SEP Collective Intentionality §2.2 的现象学传统
 * 理论来源：Scheler (1954 [1912]), Walther (1923), Husserl, Stein
 * 
 * 核心理论:
 * 1. Scheler: 集体情绪不是个体情绪之和 + 相互意识，而是真正的"同一个"情绪状态
 *    - 例子：父母在孩子的病床前共享悲伤，无需思考对方
 *    - 这种共享不是"我知道你悲伤 + 你知道我悲伤"的叠加
 *    - 而是我们共同经历"同一个"悲伤
 * 
 * 2. Walther: 共享体验的四层结构
 *    (i) A 体验 x，B 体验 x
 *    (ii) A 共情 B 的体验，B 共情 A 的体验
 *    (iii) A 认同 B 的体验，B 认同 A 的体验
 *    (iv) 相互共情意识 (知道对方知道自己在共情)
 * 
 * 3. 集体情绪深度等级:
 *    Level 1: 情绪聚集 (无共享)
 *    Level 2: 反应性情绪 (对你的情绪产生我的情绪)
 *    Level 3: 共情共享 (通过共情产生的共享情绪)
 *    Level 4: 融合情绪 (真正的集体情绪 - 数值上同一的状态)
 */

/**
 * 集体情绪深度评估器
 * 
 * 评估一个情绪体验在多大程度上是"真正的"集体情绪
 */
class CollectiveEmotionAssessor {
  constructor() {
    this.depthLevels = {
      LEVEL_1_AGGREGATE: {
        name: '情绪聚集',
        description: '个体情绪的简单聚集，无共享意图',
        example: '地铁里每个人都焦虑，但彼此无关',
        minScore: 0,
        maxScore: 0.25
      },
      LEVEL_2_REACTIVE: {
        name: '反应性情绪',
        description: '对他人的情绪产生反应性情绪',
        example: '看到你哭，我感到难过 (但这是「为你」难过，不是「与你一起」难过)',
        minScore: 0.25,
        maxScore: 0.50
      },
      LEVEL_3_EMPATHIC: {
        name: '共情共享',
        description: '通过共情产生的共享情绪 (Walther 水平)',
        example: '我理解你的悲伤，并与你一起悲伤',
        minScore: 0.50,
        maxScore: 0.75
      },
      LEVEL_4_FUSED: {
        name: '融合情绪',
        description: '真正的集体情绪 (Scheler 水平 - 数值上同一的状态)',
        example: '父母在孩子病床前的共同悲伤，无需思考对方',
        minScore: 0.75,
        maxScore: 1.0
      }
    };
  }

  /**
   * 评估集体情绪深度
   * 
   * @param {Object} context - 情绪情境
   * @param {Array} participants - 参与者列表
   * @param {string} emotionType - 情绪类型
   * @returns {Object} 评估结果
   */
  assessDepth(context, participants, emotionType) {
    const scores = {
      coPresence: this.assessCoPresence(context, participants),
      mutualAwareness: this.assessMutualAwareness(participants),
      empathicConnection: this.assessEmpathicConnection(participants),
      identification: this.assessIdentification(participants, emotionType),
      weIntention: this.assessWeIntention(context, participants),
      schelerConditions: this.assessSchelerConditions(context, participants)
    };

    // 计算综合深度分数
    const depthScore = this.calculateDepthScore(scores);
    const level = this.determineLevel(depthScore);

    return {
      depthScore,
      level: level.name,
      levelDescription: level.description,
      example: level.example,
      breakdown: scores,
      isGenuineCollective: depthScore >= 0.75,
      recommendations: this.generateRecommendations(scores, level)
    };
  }

  /**
   * 评估共同在场 (物理或虚拟)
   */
  assessCoPresence(context, participants) {
    let score = 0.5; // 默认中等

    if (context.physicalCoPresence) {
      score = 0.8; // 物理在场增强共享可能性
    } else if (context.virtualCoPresence) {
      score = 0.6; // 虚拟在场次之
    }

    if (context.sharedFocus) {
      score += 0.2; // 共同关注点
    }

    return Math.min(score, 1.0);
  }

  /**
   * 评估相互意识
   */
  assessMutualAwareness(participants) {
    if (participants.length < 2) return 0;

    // 检查是否有相互意识的语言标记
    const mutualAwarenessMarkers = [
      '我知道你也', '你明白我', '我们都能感觉到',
      '彼此理解', '心照不宣', '无需言语'
    ];

    const hasMutualAwareness = participants.some(p =>
      p verbalReport &&
      mutualAwarenessMarkers.some(marker => p.verbalReport.includes(marker))
    );

    return hasMutualAwareness ? 0.8 : 0.4;
  }

  /**
   * 评估共情连接
   */
  assessEmpathicConnection(participants) {
    if (participants.length < 2) return 0;

    const empathyMarkers = [
      '我能感受到你的', '我理解你的感受', '与你同感',
      '感同身受', '共情', '站在你的角度'
    ];

    let empathyCount = 0;
    participants.forEach(p => {
      if (p.verbalReport && empathyMarkers.some(m => p.verbalReport.includes(m))) {
        empathyCount++;
      }
    });

    // 共情比例
    return empathyCount / participants.length;
  }

  /**
   * 评估认同程度
   */
  assessIdentification(participants, emotionType) {
    if (participants.length < 2) return 0;

    const identificationMarkers = [
      '我们的', '我们一起', '共同的', '分享',
      '一起经历', '共同感受', '我们都在'
    ];

    let identificationCount = 0;
    participants.forEach(p => {
      if (p.verbalReport && identificationMarkers.some(m => p.verbalReport.includes(m))) {
        identificationCount++;
      }
    });

    // 检查情绪一致性
    const emotionsMatch = participants.every(p => p.emotion === emotionType);
    const identificationScore = identificationCount / participants.length;

    return emotionsMatch ? identificationScore * 1.2 : identificationScore * 0.8;
  }

  /**
   * 评估 We-Intention (集体意向性)
   */
  assessWeIntention(context, participants) {
    const weIntentionMarkers = [
      '我们一起', '我们共同', '我们的感受', '共同经历',
      '我们都觉得', '我们都在感受'
    ];

    let weIntentionCount = 0;
    participants.forEach(p => {
      if (p.verbalReport && weIntentionMarkers.some(m => p.verbalReport.includes(m))) {
        weIntentionCount++;
      }
    });

    // 检查是否有共享目标/情境
    const hasSharedContext = context.sharedGoal || context.sharedSituation;

    const baseScore = weIntentionCount / participants.length;
    return hasSharedContext ? Math.min(baseScore + 0.2, 1.0) : baseScore;
  }

  /**
   * 评估 Scheler 条件 (真正的集体情绪)
   * 
   * Scheler 的关键洞察：
   * - 集体情绪中，多个心灵处于"数值上同一"的状态
   * - 不是"我的悲伤 + 你的悲伤"，而是"我们的悲伤"
   * - 无需相互思考即可共享 (如父母在孩子病床前)
   */
  assessSchelerConditions(context, participants) {
    let score = 0;

    // 条件 1: 情绪同质性
    const emotions = participants.map(p => p.emotion);
    const allSameEmotion = emotions.every(e => e === emotions[0]);
    if (allSameEmotion) score += 0.3;

    // 条件 2: 无需明确相互参照
    const noExplicitReference = !participants.some(p =>
      p.verbalReport && (p.verbalReport.includes('因为你') || p.verbalReport.includes('看到你'))
    );
    if (noExplicitReference && context.intenseSharedSituation) {
      score += 0.4; // Scheler 的核心案例
    }

    // 条件 3: 共享情境强度
    if (context.emotionalIntensity >= 0.8) {
      score += 0.3;
    }

    return score;
  }

  /**
   * 计算综合深度分数
   */
  calculateDepthScore(scores) {
    const weights = {
      coPresence: 0.1,
      mutualAwareness: 0.15,
      empathicConnection: 0.2,
      identification: 0.2,
      weIntention: 0.2,
      schelerConditions: 0.15
    };

    let totalScore = 0;
    for (const [key, value] of Object.entries(scores)) {
      totalScore += value * (weights[key] || 0.1);
    }

    return totalScore;
  }

  /**
   * 确定深度等级
   */
 determineLevel(score) {
    for (const level of Object.values(this.depthLevels)) {
      if (score >= level.minScore && score <= level.maxScore) {
        return level;
      }
    }
    return this.depthLevels.LEVEL_1_AGGREGATE;
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(scores, level) {
    const recommendations = [];

    if (scores.empathicConnection < 0.5) {
      recommendations.push({
        area: '共情连接',
        suggestion: '鼓励参与者表达彼此的感受理解',
        exercise: '尝试说「我能感受到你现在的...」'
      });
    }

    if (scores.identification < 0.5) {
      recommendations.push({
        area: '认同感',
        suggestion: '强化「我们」的语言框架',
        exercise: '使用「我们一起」「我们的感受」等表达'
      });
    }

    if (scores.weIntention < 0.5) {
      recommendations.push({
        area: '集体意向性',
        suggestion: '明确共享的情绪体验',
        exercise: '确认「我们都在经历类似的感受」'
      });
    }

    if (level === this.depthLevels.LEVEL_4_FUSED) {
      recommendations.push({
        area: '维持',
        suggestion: '这是真正的集体情绪状态，珍惜并维持这种连接',
        exercise: '可以通过共同仪式或纪念来强化这种共享体验'
      });
    }

    return recommendations;
  }
}

/**
 * Scheler 式集体情绪检测器
 * 
 * 专门检测 Scheler 描述的"数值上同一"的集体情绪状态
 */
class SchelerCollectiveEmotionDetector {
  constructor() {
    // Scheler 的经典案例
    this.paradigmCases = {
      parentalGrief: {
        name: '父母丧子之悲',
        description: '父母在孩子病床前的共同悲伤，无需思考对方',
        characteristics: [
          '无需明确相互参照',
          '情绪完全同步',
          '共享情境极度强烈',
          '个体边界模糊'
        ]
      },
      nationalEnthusiasm: {
        name: '集体狂热 (八月狂热)',
        description: 'Scheler 分析的一战爆发时的集体狂热',
        characteristics: [
          '大规模情绪同步',
          '个体意识被集体淹没',
          '强烈的归属感',
          '可能具有危险性'
        ],
        warning: '这种集体情绪可能被操纵，需保持批判意识'
      }
    };
  }

  /**
   * 检测是否符合 Scheler 式集体情绪
   */
  detect(context, participants) {
    const conditions = {
      // 条件 1: 情绪同质性
      emotionalHomogeneity: this.checkEmotionalHomogeneity(participants),
      
      // 条件 2: 无需相互参照
      noExplicitReference: this.checkNoExplicitReference(participants),
      
      // 条件 3: 共享情境强度
      intenseSharedSituation: context.emotionalIntensity >= 0.8,
      
      // 条件 4: 时间同步性
      temporalSynchrony: this.checkTemporalSynchrony(participants),
      
      // 条件 5: 表达一致性
      expressiveConsistency: this.checkExpressiveConsistency(participants)
    };

    const metConditions = Object.values(conditions).filter(c => c === true).length;
    const isSchelerian = metConditions >= 4;

    return {
      isSchelerian,
      conditionsMet: metConditions,
      totalConditions: 5,
      breakdown: conditions,
      confidence: metConditions / 5,
      paradigmMatch: this.findParadigmMatch(context, participants)
    };
  }

  checkEmotionalHomogeneity(participants) {
    const emotions = participants.map(p => p.emotion);
    return emotions.every(e => e === emotions[0]);
  }

  checkNoExplicitReference(participants) {
    // 检查是否没有明确的相互参照语言
    return !participants.some(p =>
      p.verbalReport &&
      (p.verbalReport.includes('因为你') ||
       p.verbalReport.includes('看到你') ||
       p.verbalReport.includes('由于你'))
    );
  }

  checkTemporalSynchrony(participants) {
    // 检查情绪 onset 是否同步
    const onsets = participants.map(p => p.emotionOnset);
    const timeRange = Math.max(...onsets) - Math.min(...onsets);
    return timeRange < 5000; // 5 秒内
  }

  checkExpressiveConsistency(participants) {
    // 检查表达是否一致
    const expressions = participants.map(p => p.expression);
    const uniqueExpressions = new Set(expressions);
    return uniqueExpressions.size <= 2; // 最多 2 种不同表达
  }

  findParadigmMatch(context, participants) {
    // 匹配到经典案例
    if (context.relationshipType === 'parent-child' && context.emotion === 'grief') {
      return this.paradigmCases.parentalGrief;
    }
    if (context.groupSize > 100 && context.emotion === 'enthusiasm') {
      return this.paradigmCases.nationalEnthusiasm;
    }
    return null;
  }
}

/**
 * Walther 共享体验评估器
 * 
 * 基于 Walther (1923) 的四层结构
 */
class WaltherSharedExperienceAssessor {
  /**
   * 评估共享体验的完整性
   * 
   * Walther 的四层:
   * (i) A 体验 x, B 体验 x
   * (ii) A 共情 B 的体验，B 共情 A 的体验
   * (iii) A 认同 B 的体验，B 认同 A 的体验
   * (iv) 相互共情意识
   */
  assess(participants, emotionType) {
    if (participants.length < 2) {
      return {
        isShared: false,
        reason: '共享体验需要至少两个参与者',
        level: 0
      };
    }

    const levels = {
      level1: this.checkLevel1(participants, emotionType),
      level2: this.checkLevel2(participants),
      level3: this.checkLevel3(participants),
      level4: this.checkLevel4(participants)
    };

    const highestLevel = this.findHighestLevel(levels);

    return {
      isShared: highestLevel >= 2,
      highestLevel,
      maxLevel: 4,
      breakdown: levels,
      isCompleteSharedExperience: highestLevel === 4,
      missingLevels: this.findMissingLevels(levels, highestLevel)
    };
  }

  checkLevel1(participants, emotionType) {
    // 双方都体验同一种情绪
    return participants.every(p => p.emotion === emotionType);
  }

  checkLevel2(participants) {
    // 双方都共情对方的体验
    const empathyMarkers = ['感受到你的', '理解你的', '与你同感'];
    return participants.every(p =>
      p.verbalReport && empathyMarkers.some(m => p.verbalReport.includes(m))
    );
  }

  checkLevel3(participants) {
    // 双方都认同对方的体验
    const identificationMarkers = ['我们的', '一起', '共同', '分享'];
    return participants.every(p =>
      p.verbalReport && identificationMarkers.some(m => p.verbalReport.includes(m))
    );
  }

  checkLevel4(participants) {
    // 相互共情意识 (知道对方知道自己在共情)
    const metaAwarenessMarkers = ['你知道我理解你', '我明白你懂我的感受', '心照不宣'];
    return participants.some(p =>
      p.verbalReport && metaAwarenessMarkers.some(m => p.verbalReport.includes(m))
    );
  }

  findHighestLevel(levels) {
    if (levels.level4) return 4;
    if (levels.level3) return 3;
    if (levels.level2) return 2;
    if (levels.level1) return 1;
    return 0;
  }

  findMissingLevels(levels, highest) {
    const missing = [];
    for (let i = highest + 1; i <= 4; i++) {
      if (!levels[`level${i}`]) {
        missing.push(i);
      }
    }
    return missing;
  }
}

// 导出实例
const collectiveEmotionAssessor = new CollectiveEmotionAssessor();
const schelerDetector = new SchelerCollectiveEmotionDetector();
const waltherAssessor = new WaltherSharedExperienceAssessor();

module.exports = {
  CollectiveEmotionAssessor,
  SchelerCollectiveEmotionDetector,
  WaltherSharedExperienceAssessor,
  collectiveEmotionAssessor,
  schelerDetector,
  waltherAssessor,
  depthLevels: collectiveEmotionAssessor.depthLevels
};
