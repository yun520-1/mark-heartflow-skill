/**
 * SDT Module - Self-Determination Theory (自我决定理论)
 * 
 * 基于 Deci & Ryan 的自我决定理论，评估和促进用户的内在动机
 * 
 * 三大基本心理需求:
 * - Autonomy (自主性): 感到行为是自愿的、自我认可的
 * - Competence (胜任感): 感到有能力应对挑战
 * - Relatedness (关系感): 感到与他人有联系、被关心
 * 
 * 六种 Mini-Theories:
 * 1. CET - Cognitive Evaluation Theory (内在动机)
 * 2. OIT - Organismic Integration Theory (外在动机内化)
 * 3. COT - Causality Orientations Theory (因果定向)
 * 4. BPNT - Basic Psychological Needs Theory (基本需求)
 * 5. GCT - Goal Contents Theory (目标内容)
 * 6. RMT - Relationships Motivation Theory (关系动机)
 */

const sdtModule = {
  name: 'sdt',
  version: '1.0.0',
  description: '自我决定理论动机评估与干预模块',

  // ==================== 三大基本需求评估 ====================
  
  /**
   * 评估用户当前的基本心理需求满足度
   * @param {Object} userInput - 用户输入/状态
   * @returns {Object} 需求满足度评估结果
   */
  assessBasicNeeds: function(userInput) {
    const needs = {
      autonomy: { score: 0, indicators: [], suggestions: [] },
      competence: { score: 0, indicators: [], suggestions: [] },
      relatedness: { score: 0, indicators: [], suggestions: [] }
    };

    // 自主性指标检测
    if (this.hasLanguage(userInput, ['必须', '应该', '不得不', '被迫', '没办法'])) {
      needs.autonomy.indicators.push('使用被迫性语言，自主感较低');
      needs.autonomy.score -= 2;
      needs.autonomy.suggestions.push('尝试将"我必须"改为"我选择"，重新发现行为的个人意义');
    }
    if (this.hasLanguage(userInput, ['我想', '我选择', '我决定', '我愿意', '我喜欢'])) {
      needs.autonomy.indicators.push('使用自主性语言，自我决定感较强');
      needs.autonomy.score += 2;
    }

    // 胜任感指标检测
    if (this.hasLanguage(userInput, ['我不会', '我不行', '我做不到', '太难了', '放弃'])) {
      needs.competence.indicators.push('表达无力感，胜任感较低');
      needs.competence.score -= 2;
      needs.competence.suggestions.push('将大目标分解为小步骤，每完成一步就庆祝');
    }
    if (this.hasLanguage(userInput, ['我可以', '我学会了', '我进步了', '我能行', '试试看'])) {
      needs.competence.indicators.push('表达成长心态，胜任感较强');
      needs.competence.score += 2;
    }

    // 关系感指标检测
    if (this.hasLanguage(userInput, ['一个人', '孤独', '没人理解', '被孤立', '不合群'])) {
      needs.relatedness.indicators.push('表达孤独感，关系需求未满足');
      needs.relatedness.score -= 2;
      needs.relatedness.suggestions.push('寻找志同道合的社群，或主动与信任的人分享感受');
    }
    if (this.hasLanguage(userInput, ['我们一起', '朋友', '支持', '理解', '陪伴'])) {
      needs.relatedness.indicators.push('有社会支持感，关系需求满足良好');
      needs.relatedness.score += 2;
    }

    // 标准化分数到 0-10
    Object.keys(needs).forEach(key => {
      needs[key].score = Math.max(0, Math.min(10, needs[key].score + 5));
    });

    return {
      timestamp: new Date().toISOString(),
      needs,
      overallSatisfaction: (needs.autonomy.score + needs.competence.score + needs.relatedness.score) / 3,
      primaryDeficit: this.findPrimaryDeficit(needs)
    };
  },

  /**
   * 识别用户的动机类型（基于 OIT 动机连续体）
   * @param {string} userInput - 用户描述
   * @returns {Object} 动机类型评估
   */
  identifyMotivationType: function(userInput) {
    const motivationTypes = {
      amotivation: { name: '无动机', score: 0, description: '缺乏行动意图，感到无助或无价值' },
      externalRegulation: { name: '外部调节', score: 0, description: '为获得奖励或避免惩罚而行动' },
      introjectedRegulation: { name: '内摄调节', score: 0, description: '为避免内疚或维持自尊而行动' },
      identifiedRegulation: { name: '认同调节', score: 0, description: '认识到行为的个人价值和重要性' },
      integratedRegulation: { name: '整合调节', score: 0, description: '行为与自我价值观完全一致' },
      intrinsicMotivation: { name: '内在动机', score: 0, description: '因活动本身的乐趣和满足而行动' }
    };

    // 无动机检测
    if (this.hasLanguage(userInput, ['没意义', '无所谓', '懒得', '不想动', '没用'])) {
      motivationTypes.amotivation.score += 3;
    }

    // 外部调节检测
    if (this.hasLanguage(userInput, ['为了赚钱', '怕被骂', '老板要求', '不得不', '奖励'])) {
      motivationTypes.externalRegulation.score += 3;
    }

    // 内摄调节检测
    if (this.hasLanguage(userInput, ['应该', '必须', '不然会内疚', '不能丢脸', '要证明自己'])) {
      motivationTypes.introjectedRegulation.score += 3;
    }

    // 认同调节检测
    if (this.hasLanguage(userInput, ['这对我很重要', '我想要', '对我有好处', '我认同'])) {
      motivationTypes.identifiedRegulation.score += 3;
    }

    // 整合调节检测
    if (this.hasLanguage(userInput, ['这就是我', '符合我的价值观', '我一直相信', '是我的使命'])) {
      motivationTypes.integratedRegulation.score += 3;
    }

    // 内在动机检测
    if (this.hasLanguage(userInput, ['我喜欢', '很有趣', '享受', '热爱', '沉浸其中'])) {
      motivationTypes.intrinsicMotivation.score += 3;
    }

    // 找出主导动机类型
    const sortedTypes = Object.entries(motivationTypes)
      .sort((a, b) => b[1].score - a[1].score);
    
    const dominantType = sortedTypes[0];
    const autonomyLevel = this.calculateAutonomyLevel(sortedTypes);

    return {
      timestamp: new Date().toISOString(),
      allTypes: motivationTypes,
      dominantType: {
        key: dominantType[0],
        ...dominantType[1]
      },
      autonomyLevel, // 1-10，越高表示动机越自主
      recommendations: this.getMotivationRecommendations(dominantType[0], autonomyLevel)
    };
  },

  /**
   * 评估用户的目标内容（基于 GCT 目标内容理论）
   * @param {string} userInput - 用户描述的目标
   * @returns {Object} 目标内容评估
   */
  assessGoalContents: function(userInput) {
    const intrinsicGoals = [
      '个人成长', '学习', '技能提升', '自我实现', '健康',
      '人际关系', '友谊', '爱情', '家庭', '社群贡献',
      '帮助他人', '志愿服务', '创造力', '表达自我', '意义感'
    ];

    const extrinsicGoals = [
      '金钱', '财富', '地位', '名声', '权力',
      '外貌', '吸引力', ' popularity', '被认可', '被羡慕',
      '物质', '奢侈品', '社会比较', '超越他人'
    ];

    let intrinsicScore = 0;
    let extrinsicScore = 0;
    const detectedIntrinsic = [];
    const detectedExtrinsic = [];

    intrinsicGoals.forEach(goal => {
      if (this.hasLanguage(userInput, [goal])) {
        intrinsicScore++;
        detectedIntrinsic.push(goal);
      }
    });

    extrinsicGoals.forEach(goal => {
      if (this.hasLanguage(userInput, [goal])) {
        extrinsicScore++;
        detectedExtrinsic.push(goal);
      }
    });

    const total = intrinsicScore + extrinsicScore || 1;
    const orientation = intrinsicScore >= extrinsicScore ? 'intrinsic' : 'extrinsic';

    return {
      timestamp: new Date().toISOString(),
      intrinsicGoals: {
        score: intrinsicScore,
        percentage: Math.round((intrinsicScore / total) * 100),
        detected: detectedIntrinsic
      },
      extrinsicGoals: {
        score: extrinsicScore,
        percentage: Math.round((extrinsicScore / total) * 100),
        detected: detectedExtrinsic
      },
      orientation,
      wellBeingPrediction: orientation === 'intrinsic' 
        ? '内在目标导向通常与更高的幸福感和心理健康相关'
        : '外在目标导向可能与较低的幸福感和较高的焦虑相关',
      suggestions: orientation === 'extrinsic'
        ? [
            '思考这些目标背后的深层需求是什么',
            '探索是否有更内在满足的方式来实现同样的需求',
            '平衡外在目标与内在成长目标'
          ]
        : ['继续保持以内在价值为导向的目标设定']
    };
  },

  // ==================== SDT 干预技术 ====================

  /**
   * 基于 SDT 的动机访谈技术
   * @param {Object} needsAssessment - 需求评估结果
   * @returns {Object} 干预建议
   */
  generateMotivationalInterview: function(needsAssessment) {
    const interventions = [];

    // 自主性支持干预
    if (needsAssessment.needs.autonomy.score < 6) {
      interventions.push({
        type: 'autonomy-support',
        technique: '选择重构',
        script: [
          '听起来你感到被某些事情束缚住了。让我们换个角度看看：',
          '在这件事上，你有哪些选择？（即使选项有限）',
          '如果完全由你决定，你会怎么做？',
          '这个行为对你个人有什么意义或价值？'
        ],
        rationale: '帮助重新发现个人选择权和行为的自我认可价值'
      });
    }

    // 胜任感支持干预
    if (needsAssessment.needs.competence.score < 6) {
      interventions.push({
        type: 'competence-support',
        technique: '最优挑战 + 成长反馈',
        script: [
          '我理解这个挑战看起来很大。让我们一起分解它：',
          '过去你克服过哪些类似的困难？你是怎么做到的？',
          '如果把目标缩小到原来的 1/10，第一步会是什么？',
          '每完成一小步，记得认可自己的进步'
        ],
        rationale: '设置最优挑战难度，提供成长导向的反馈'
      });
    }

    // 关系感支持干预
    if (needsAssessment.needs.relatedness.score < 6) {
      interventions.push({
        type: 'relatedness-support',
        technique: '连接建立',
        script: [
          '感到孤独是很正常的，每个人都会有这样的时刻。',
          '在你生活中，有谁曾经理解过你的感受？',
          '有没有什么社群或群体，你可能会找到志同道合的人？',
          '有时候，主动分享脆弱反而能建立更深的连接'
        ],
        rationale: '促进真实的 interpersonal connection'
      });
    }

    return {
      timestamp: new Date().toISOString(),
      assessment: needsAssessment,
      interventions,
      priority: interventions.length > 0 ? interventions[0].type : 'maintenance'
    };
  },

  /**
   * 促进外在动机内化的技术（基于 OIT）
   * @param {string} currentMotivation - 当前动机类型
   * @param {string} targetBehavior - 目标行为
   * @returns {Object} 内化策略
   */
  promoteInternalization: function(currentMotivation, targetBehavior) {
    const strategies = {
      amotivation: {
        nextStep: 'externalRegulation',
        techniques: [
          '提供清晰的行为 - 结果联结',
          '设置小的、可实现的里程碑',
          '给予及时的正向反馈'
        ],
        script: `关于"${targetBehavior}"，也许现在你感觉不到它的意义。这没关系。我们可以先从很小的步骤开始，看看会发生什么。`
      },
      externalRegulation: {
        nextStep: 'introjectedRegulation',
        techniques: [
          '帮助理解行为背后的价值观',
          '连接行为与个人身份',
          '减少控制性语言，增加信息性反馈'
        ],
        script: `除了外部原因，"${targetBehavior}"对你个人来说有什么意义？它如何反映你想成为的那种人？`
      },
      introjectedRegulation: {
        nextStep: 'identifiedRegulation',
        techniques: [
          '探索个人价值观和目标',
          '将行为与长期愿景连接',
          '减少内疚感，增加自主选择感'
        ],
        script: `我听到你说"应该"做这件事。如果把"我应该"换成"我选择"，会发生什么？这个行为如何服务于你真正关心的东西？`
      },
      identifiedRegulation: {
        nextStep: 'integratedRegulation',
        techniques: [
          '深化价值观连接',
          '整合到自我概念',
          '寻找行为与身份的一致性'
        ],
        script: `这个行为已经和你重视的东西连接起来了。它如何成为你整体生活方式的一部分？它如何表达"你是谁"？`
      },
      integratedRegulation: {
        nextStep: 'intrinsicMotivation',
        techniques: [
          '发现行为本身的乐趣',
          '培养正念参与',
          '庆祝过程而非仅结果'
        ],
        script: `这个行为已经和你深深一致了。在这个过程中，有什么时刻让你感到享受或满足？即使没有外部结果，这个过程本身有什么价值？`
      },
      intrinsicMotivation: {
        nextStep: 'maintenance',
        techniques: [
          '保护内在动机免受过度理由效应影响',
          '提供自主支持环境',
          '培养持续的心流体验'
        ],
        script: `太棒了！你已经在做这件事本身中找到乐趣。继续保持这种状态，记得在需要时给自己休息和更新的空间。`
      }
    };

    return {
      currentMotivation,
      targetBehavior,
      strategy: strategies[currentMotivation] || strategies.amotivation,
      progressionPath: 'amotivation → external → introjected → identified → integrated → intrinsic'
    };
  },

  // ==================== 辅助函数 ====================

  hasLanguage: function(text, keywords) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  },

  findPrimaryDeficit: function(needs) {
    const entries = Object.entries(needs);
    entries.sort((a, b) => a[1].score - b[1].score);
    return entries[0][0]; // 返回分数最低的需求
  },

  calculateAutonomyLevel: function(sortedTypes) {
    // 动机类型的自主性权重
    const autonomyWeights = {
      amotivation: 1,
      externalRegulation: 2,
      introjectedRegulation: 3,
      identifiedRegulation: 4,
      integratedRegulation: 5,
      intrinsicMotivation: 6
    };

    let weightedSum = 0;
    let totalScore = 0;

    sortedTypes.forEach(([type, data]) => {
      weightedSum += autonomyWeights[type] * data.score;
      totalScore += data.score;
    });

    return totalScore > 0 
      ? Math.round((weightedSum / (totalScore * 6)) * 10)
      : 5; // 默认中间值
  },

  getMotivationRecommendations: function(dominantType, autonomyLevel) {
    const recommendations = {
      amotivation: [
        '从极小的、几乎不需要努力的步骤开始',
        '探索行为与个人价值观的潜在连接',
        '寻求专业支持，排除抑郁等潜在问题'
      ],
      externalRegulation: [
        '思考行为背后的个人意义',
        '寻找内在的、而非外部的理由',
        '尝试将"必须"转化为"选择"'
      ],
      introjectedRegulation: [
        '觉察内疚驱动的行为模式',
        '练习自我同情，减少自我批评',
        '探索真正重要的个人价值观'
      ],
      identifiedRegulation: [
        '深化对行为价值的理解',
        '将行为整合到日常习惯中',
        '寻找志同道合的社群支持'
      ],
      integratedRegulation: [
        '庆祝行为与身份的一致性',
        '在挑战中保持价值观连接',
        '成为他人的自主支持榜样'
      ],
      intrinsicMotivation: [
        '保护内在动机，避免过度外部奖励',
        '分享热情，感染他人',
        '在倦怠时允许自己休息'
      ]
    };

    return recommendations[dominantType] || recommendations.amotivation;
  }
};

module.exports = sdtModule;
