/**
 * We-Intention 检测器 (We-Intention Detector)
 * 
 * 基于 SEP 集体意向性理论
 * 来源：Stanford Encyclopedia of Philosophy - Collective Intentionality
 * 
 * 核心理论:
 * - We-Intention (我们意向): 不可还原为个体意向的集体意向
 * - Searle (1990, 1995): 原始我们意向理论
 * - Tuomela & Miller (1988): 我们意向的层级分析
 * - Bratman (1999): 共享意向性理论
 * - Gilbert (1990): 联合承诺理论
 * - Schmid (2013): 信任框架
 * 
 * 关键区分:
 * - 个体意向的聚合 vs 真正的我们意向
 * - "我要...+ 你要..." vs "我们要..."
 * - 策略性协调 vs 规范性承诺
 * 
 * 检测维度:
 * 1. 语言标记：我们/一起/共同/联合等
 * 2. 承诺性质：个体承诺 vs 联合承诺
 * 3. 相互依赖：条件性 vs 无条件性
 * 4. 规范性：描述性 vs 规范性期望
 * 5. 信任成分：认知信任 vs 规范信任
 * 
 * @module we-intention-detector
 * @version 1.0.0
 * @since HeartFlow v4.8.0
 */

const WeIntentionDetector = {
  /**
   * 模块元数据
   */
  metadata: {
    name: 'We-Intention 检测器',
    version: '1.0.0',
    theory: 'SEP Collective Intentionality',
    keyProponents: ['John Searle', 'Raimo Tuomela', 'Michael Bratman', 'Margaret Gilbert', 'Hans Bernhard Schmid'],
    coreConcepts: [
      'We-Intention (我们意向)',
      'Joint Commitment (联合承诺)',
      'Shared Intentionality (共享意向性)',
      'Collective Commitment (集体承诺)',
      'Mutual Obligation (相互义务)',
      'Trust Framework (信任框架)'
    ]
  },

  /**
   * 检测配置
   */
  config: {
    // 我们意向阈值
    weIntentionThreshold: 0.65,
    // 联合承诺阈值
    jointCommitmentThreshold: 0.7,
    // 语言标记权重
    linguisticWeight: 0.3,
    // 承诺性质权重
    commitmentWeight: 0.35,
    // 相互依赖权重
    interdependenceWeight: 0.2,
    // 规范性权重
    normativityWeight: 0.15
  },

  /**
   * 检测用户描述中的 We-Intention
   * 
   * @param {string} userDescription - 用户的描述
   * @param {object} context - 上下文信息（可选）
   * @returns {object} We-Intention 检测结果
   */
  detectWeIntention(userDescription, context = {}) {
    const detection = {
      description: userDescription,
      detectionTime: new Date().toISOString(),
      
      // 语言标记分析
      linguisticMarkers: {
        score: 0,
        maxScore: 10,
        markers: []
      },
      
      // 承诺性质分析
      commitmentAnalysis: {
        score: 0,
        maxScore: 10,
        type: 'unknown',
        indicators: []
      },
      
      // 相互依赖分析
      interdependenceAnalysis: {
        score: 0,
        maxScore: 10,
        type: 'unknown',
        indicators: []
      },
      
      // 规范性分析
      normativityAnalysis: {
        score: 0,
        maxScore: 10,
        indicators: []
      },
      
      // 信任成分分析
      trustAnalysis: {
        cognitiveTrust: 0,
        normativeTrust: 0,
        indicators: []
      },
      
      // 综合评估
      overall: {
        weIntentionPresent: false,
        confidence: 0,
        strength: 'unknown',
        type: 'unknown',
        recommendations: []
      }
    };

    const lowerDesc = userDescription.toLowerCase();

    // === 1. 语言标记分析 ===
    const weIntentionMarkers = [
      // 强标记（直接表达我们意向）
      { pattern: /我们 (要 | 想 | 打算 | 计划 | 决定 | 承诺)/g, weight: 3, type: '强我们意向' },
      { pattern: /我们一起/g, weight: 2.5, type: '共同行动' },
      { pattern: /共同 (决定 | 目标 | 计划 | 努力)/g, weight: 2.5, type: '共同性' },
      { pattern: /咱们/g, weight: 2, type: '包容性我们' },
      { pattern: /我俩 | 我们俩/g, weight: 2, type: '具体我们' },
      
      // 中等标记（暗示集体性）
      { pattern: /联手 | 联合 | 协作 | 合作/g, weight: 1.5, type: '协作性' },
      { pattern: /彼此 | 互相 | 相互/g, weight: 1.5, type: '相互性' },
      { pattern: /团队 | 团体 | 集体 | 群体/g, weight: 1.5, type: '群体性' },
      
      // 弱标记（可能但不确定）
      { pattern: /大家 | 所有人/g, weight: 1, type: '泛指集体' },
      { pattern: / (都 | 也)/g, weight: 0.5, type: '包容性副词' }
    ];

    weIntentionMarkers.forEach(({ pattern, weight, type }) => {
      const matches = userDescription.match(pattern);
      if (matches && matches.length > 0) {
        detection.linguisticMarkers.score += weight * Math.min(matches.length, 2);
        detection.linguisticMarkers.markers.push({
          type,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });

    // === 2. 承诺性质分析 ===
    // Gilbert 的联合承诺理论：联合承诺 vs 个体承诺的聚合
    
    const jointCommitmentPatterns = [
      {
        pattern: /我们承诺 | 我们保证 | 我们约定/g,
        type: '明确联合承诺',
        score: 3
      },
      {
        pattern: /说好了 | 约定好 | 商量好/g,
        type: '隐性联合承诺',
        score: 2.5
      },
      {
        pattern: /一起努力 | 共同努力/g,
        type: '共同行动承诺',
        score: 2
      },
      {
        pattern: /不会让 (对方 | 彼此 | 大家) 失望/g,
        type: '相互责任承诺',
        score: 2.5
      }
    ];

    const individualCommitmentPatterns = [
      {
        pattern: /我要.*你 (要 | 也)/g,
        type: '个体承诺聚合',
        score: -1
      },
      {
        pattern: /我负责.*你负责/g,
        type: '分工式承诺',
        score: -0.5
      },
      {
        pattern: /如果.*我就/g,
        type: '条件性承诺',
        score: -1
      }
    ];

    jointCommitmentPatterns.forEach(({ pattern, type, score }) => {
      if (pattern.test(lowerDesc)) {
        detection.commitmentAnalysis.score += score;
        detection.commitmentAnalysis.indicators.push(`检测到${type}`);
      }
    });

    individualCommitmentPatterns.forEach(({ pattern, type, score }) => {
      if (pattern.test(lowerDesc)) {
        detection.commitmentAnalysis.score += score;
        detection.commitmentAnalysis.indicators.push(`检测到${type}（非联合承诺特征）`);
      }
    });

    // 确定承诺类型
    if (detection.commitmentAnalysis.score >= 3) {
      detection.commitmentAnalysis.type = '强联合承诺';
    } else if (detection.commitmentAnalysis.score >= 1.5) {
      detection.commitmentAnalysis.type = '中等联合承诺';
    } else if (detection.commitmentAnalysis.score >= 0) {
      detection.commitmentAnalysis.type = '弱联合承诺';
    } else {
      detection.commitmentAnalysis.type = '个体承诺聚合';
    }

    // === 3. 相互依赖分析 ===
    // Bratman 的共享意向性：相互响应和协调
    
    const interdependencePatterns = {
      high: [
        /彼此依赖/g,
        /缺一不可/g,
        /互相支持/g,
        /共同承担/g
      ],
      medium: [
        /配合 | 协调 | 同步/g,
        /商量 | 讨论 | 协商/g,
        /考虑 (对方 | 彼此)/g
      ],
      low: [
        /各做各的/g,
        /独立 (完成 | 负责)/g,
        /不需要 (别人 | 对方)/g
      ]
    };

    let interdependenceScore = 0;
    
    interdependencePatterns.high.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        interdependenceScore += 2;
        detection.interdependenceAnalysis.indicators.push('检测到高度相互依赖');
      }
    });
    
    interdependencePatterns.medium.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        interdependenceScore += 1;
        detection.interdependenceAnalysis.indicators.push('检测到中等相互依赖');
      }
    });
    
    interdependencePatterns.low.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        interdependenceScore -= 1;
        detection.interdependenceAnalysis.indicators.push('检测到低相互依赖（个体主义）');
      }
    });

    detection.interdependenceAnalysis.score = Math.max(0, Math.min(10, interdependenceScore * 1.5));
    
    if (interdependenceScore >= 3) {
      detection.interdependenceAnalysis.type = '高度相互依赖';
    } else if (interdependenceScore >= 1) {
      detection.interdependenceAnalysis.type = '中等相互依赖';
    } else {
      detection.interdependenceAnalysis.type = '低相互依赖';
    }

    // === 4. 规范性分析 ===
    // Gilbert: 联合承诺产生规范性期望
    
    const normativityPatterns = [
      { pattern: /应该 | 应当 | 必须/g, type: '规范性期望', weight: 1.5 },
      { pattern: /有义务 | 有责任/g, type: '义务感', weight: 2 },
      { pattern: /不能辜负 | 不能失望/g, type: '规范性约束', weight: 2 },
      { pattern: /说活要算数 | 一言既出/g, type: '承诺约束', weight: 1.5 },
      { pattern: /信任 | 相信/g, type: '信任基础', weight: 1 }
    ];

    normativityPatterns.forEach(({ pattern, type, weight }) => {
      const matches = userDescription.match(pattern);
      if (matches && matches.length > 0) {
        detection.normativityAnalysis.score += weight * Math.min(matches.length, 2);
        detection.normativityAnalysis.indicators.push(`检测到${type}`);
      }
    });

    // === 5. 信任成分分析 ===
    // Schmid: 信任 = 认知成分 + 规范成分
    
    const cognitiveTrustPatterns = [
      /我相信 (他 | 她 | 他们 | 对方)/g,
      /我知道 (他 | 她 | 他们) 会/g,
      /根据经验.*可靠/g,
      / (能力 | 专业 | 经验) 信任/g
    ];

    const normativeTrustPatterns = [
      /我相信 (他 | 她 | 他们) 应该/g,
      /有理由期待/g,
      /承诺过.*所以/g,
      / (责任 | 义务) 会做/g
    ];

    cognitiveTrustPatterns.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        detection.trustAnalysis.cognitiveTrust += 2;
        detection.trustAnalysis.indicators.push('检测到认知信任');
      }
    });

    normativeTrustPatterns.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        detection.trustAnalysis.normativeTrust += 2;
        detection.trustAnalysis.indicators.push('检测到规范信任');
      }
    });

    // 标准化分数
    detection.linguisticMarkers.score = Math.min(detection.linguisticMarkers.maxScore, detection.linguisticMarkers.score);
    detection.commitmentAnalysis.score = Math.min(detection.commitmentAnalysis.maxScore, Math.max(0, detection.commitmentAnalysis.score));
    detection.normativityAnalysis.score = Math.min(detection.normativityAnalysis.maxScore, detection.normativityAnalysis.score);
    detection.trustAnalysis.cognitiveTrust = Math.min(10, detection.trustAnalysis.cognitiveTrust);
    detection.trustAnalysis.normativeTrust = Math.min(10, detection.trustAnalysis.normativeTrust);

    // === 综合评估 ===
    const weIntentionScore = (
      (detection.linguisticMarkers.score / 10) * this.config.linguisticWeight +
      (detection.commitmentAnalysis.score / 10) * this.config.commitmentWeight +
      (detection.interdependenceAnalysis.score / 10) * this.config.interdependenceWeight +
      (detection.normativityAnalysis.score / 10) * this.config.normativityWeight
    );

    detection.overall.confidence = weIntentionScore;
    detection.overall.weIntentionPresent = weIntentionScore >= this.config.weIntentionThreshold;

    // 确定强度
    if (weIntentionScore >= 0.85) {
      detection.overall.strength = '很强';
    } else if (weIntentionScore >= 0.7) {
      detection.overall.strength = '强';
    } else if (weIntentionScore >= 0.55) {
      detection.overall.strength = '中等';
    } else if (weIntentionScore >= 0.4) {
      detection.overall.strength = '较弱';
    } else {
      detection.overall.strength = '弱';
    }

    // 确定类型
    if (detection.commitmentAnalysis.type.includes('强联合') && 
        detection.interdependenceAnalysis.type.includes('高度')) {
      detection.overall.type = '强联合意向型';
    } else if (detection.trustAnalysis.normativeTrust > detection.trustAnalysis.cognitiveTrust) {
      detection.overall.type = '规范信任型';
    } else if (detection.trustAnalysis.cognitiveTrust > detection.trustAnalysis.normativeTrust) {
      detection.overall.type = '认知信任型';
    } else {
      detection.overall.type = '混合型';
    }

    // 生成建议
    detection.overall.recommendations = this._generateRecommendations(detection);

    return detection;
  },

  /**
   * 生成培养 We-Intention 的建议
   */
  _generateRecommendations(detection) {
    const recommendations = [];

    // 基于 We-Intention 强度
    if (!detection.overall.weIntentionPresent) {
      recommendations.push({
        type: '培养我们意向',
        priority: '高',
        practice: '共同目标设定练习',
        description: '尝试用"我们"而非"我"来表述目标。例如，不说"我要帮你完成"，而说"我们要一起完成"。注意语言转变带来的心理变化。',
        theoreticalBasis: 'Searle: We-Intention 是原始的，不可还原为个体意向'
      });
    }

    // 基于承诺类型
    if (detection.commitmentAnalysis.type === '个体承诺聚合') {
      recommendations.push({
        type: '转化为联合承诺',
        priority: '高',
        practice: '联合承诺声明',
        description: '与相关方一起明确表达联合承诺："我们承诺一起完成 X"。联合承诺创造相互义务，这是 We-Intention 的核心。',
        theoreticalBasis: 'Gilbert: 联合承诺产生规范性期望和相互义务'
      });
    }

    // 基于相互依赖
    if (detection.interdependenceAnalysis.type === '低相互依赖') {
      recommendations.push({
        type: '增强相互依赖',
        priority: '中',
        practice: '相互响应练习',
        description: '在合作中，刻意关注对方的行动并调整自己的行动以响应。共享意向性需要持续的相互协调。',
        theoreticalBasis: 'Bratman: 共享意向性包含相互响应和协调'
      });
    }

    // 基于信任成分
    if (detection.trustAnalysis.cognitiveTrust < 3 && detection.trustAnalysis.normativeTrust < 3) {
      recommendations.push({
        type: '建立信任基础',
        priority: '高',
        practice: '信任构建对话',
        description: '与团队成员进行信任构建对话：讨论各自的能力（认知信任）和承诺（规范信任）。信任是 We-Intention 的基础。',
        theoreticalBasis: 'Schmid: 信任是集体意向性的核心成分'
      });
    }

    return recommendations;
  },

  /**
   * 联合承诺评估工具
   * 
   * 基于 Margaret Gilbert 的联合承诺理论
   */
  assessJointCommitment(description, participants = 2) {
    const assessment = {
      description,
      participants,
      assessmentTime: new Date().toISOString(),
      
      // Gilbert 联合承诺的核心条件
      conditions: {
        // 1. 共同表达
        jointExpression: {
          present: false,
          evidence: []
        },
        
        // 2. 共同目标
        jointGoal: {
          present: false,
          evidence: []
        },
        
        // 3. 相互义务感
        mutualObligation: {
          present: false,
          evidence: []
        },
        
        // 4. 共同知识
        commonKnowledge: {
          present: false,
          evidence: []
        }
      },
      
      // 承诺强度
      strength: {
        score: 0,
        maxScore: 10,
        level: 'unknown'
      },
      
      // 评估结论
      conclusion: {
        isJointCommitment: false,
        confidence: 0,
        summary: ''
      }
    };

    const lowerDesc = description.toLowerCase();

    // 检查共同表达
    const expressionPatterns = [
      /我们 (说 | 约定 | 决定 | 同意)/g,
      /一起 (说 | 商量 | 讨论)/g,
      /共同 (宣布 | 声明)/g
    ];
    
    expressionPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        assessment.conditions.jointExpression.present = true;
        assessment.conditions.jointExpression.evidence.push(...matches);
      }
    });

    // 检查共同目标
    const goalPatterns = [
      /我们的目标/g,
      /共同 (目标 | 目的)/g,
      /一起 (完成 | 实现| 达成)/g
    ];
    
    goalPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        assessment.conditions.jointGoal.present = true;
        assessment.conditions.jointGoal.evidence.push(...matches);
      }
    });

    // 检查相互义务感
    const obligationPatterns = [
      /我们 (应该 | 必须 | 有义务)/g,
      /不能辜负/g,
      /对 (彼此 | 对方) 负责/g,
      /承诺过/g
    ];
    
    obligationPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        assessment.conditions.mutualObligation.present = true;
        assessment.conditions.mutualObligation.evidence.push(...matches);
      }
    });

    // 检查共同知识
    const knowledgePatterns = [
      /我们都知道/g,
      /大家都清楚/g,
      /说好了/g,
      /心照不宣/g
    ];
    
    knowledgePatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        assessment.conditions.commonKnowledge.present = true;
        assessment.conditions.commonKnowledge.evidence.push(...matches);
      }
    });

    // 计算强度分数
    let strengthScore = 0;
    Object.values(assessment.conditions).forEach(condition => {
      if (condition.present) {
        strengthScore += 2.5;
      }
      strengthScore += Math.min(0.5, condition.evidence.length * 0.2);
    });

    assessment.strength.score = Math.min(10, strengthScore);
    
    if (assessment.strength.score >= 8) {
      assessment.strength.level = '强';
    } else if (assessment.strength.score >= 5) {
      assessment.strength.level = '中等';
    } else {
      assessment.strength.level = '弱';
    }

    // 评估结论
    const conditionsMet = Object.values(assessment.conditions).filter(c => c.present).length;
    assessment.conclusion.isJointCommitment = conditionsMet >= 3;
    assessment.conclusion.confidence = assessment.strength.score / 10;
    assessment.conclusion.summary = `检测到${conditionsMet}/4 个联合承诺条件。${assessment.conclusion.isJointCommitment ? '这是一个较强的联合承诺。' : '联合承诺特征不足。'}`;

    return assessment;
  }
};

module.exports = WeIntentionDetector;
