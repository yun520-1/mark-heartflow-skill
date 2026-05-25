/**
 * 自我检查元认知增强模块 v5.0.10 (Self-Check Metacognitive Enhancement)
 * 
 * 基于斯坦福哲学百科全书 (SEP) Self-Consciousness 权威理论：
 * - 直觉式自我知识 (Intuitive Self-Knowledge)
 * - 推论式自我知识 (Inferential Self-Knowledge)
 * - 第一人称给定性 (First-Person Givenness)
 * - 自我知识的认识论基础
 * 
 * 核心理论来源:
 * - SEP: Self-Consciousness §2 (Self-Consciousness in Thought)
 * - SEP: Self-Consciousness §4 (Constitutive Questions)
 * - Descartes: cogito ergo sum (直觉式自我知识的典范)
 * - Locke: 内在感知模型 (Inner Perception Model)
 * - Kant: 先验统觉 (Transcendental Apperception)
 * - Fichte: 直接自我设定 (Immediate Self-Positing)
 * - Sartre: 前反思自我意识 (Pre-reflective Self-Consciousness)
 * - Evans: 基于行为的自我知识 (Behavior-Based Self-Knowledge)
 * 
 * 核心功能:
 * 1. 自我知识模式识别 - 区分直觉式 vs 推论式自我知识
 * 2. 元认知校准 - 检测并校准自我知识的确定性
 * 3. 第一人称给定性检测 - 评估自我意识的直接性
 * 4. 自我知识冲突检测 - 识别不同自我知识来源的冲突
 * 5. 元认知干预生成 - 针对自我知识薄弱点提供干预方案
 * 
 * @version 5.0.10 (HeartFlow v5.0.10)
 * @author HeartFlow Team
 */

class SelfCheckMetacognitive {
  constructor() {
    this.metadata = {
      name: '自我检查元认知增强',
      version: '5.0.10',
      theory: 'SEP: Self-Consciousness',
      keyConcepts: [
        '直觉式自我知识 (Intuitive Self-Knowledge)',
        '推论式自我知识 (Inferential Self-Knowledge)',
        '第一人称给定性 (First-Person Givenness)',
        '元认知校准 (Metacognitive Calibration)',
        '自我知识冲突 (Self-Knowledge Conflict)'
      ]
    };

    // 自我知识类型识别标记
    this.intuitiveMarkers = [
      '我知道我就是', '我直接感受到', '毫无疑问我是', '我本身就是',
      '我清楚地知道', '我直觉上知道', '我内心知道', '我深切地感受到',
      '我天生就是', '我本质上就是', '第一人称体验', '直接体验',
      '我不需要思考就知道', '自然而然地知道', '毫无疑问地知道'
    ];

    this.inferentialMarkers = [
      '我认为我可能', '根据我的行为', '别人说我', '从...可以推断',
      '证据表明我', '我猜测我是', '也许我是', '看起来我是',
      '似乎我是', '我倾向于认为', '基于...我觉得', '从...来看我',
      '我推测我是', '我估计我是', '我判断我是', '我评估我是'
    ];

    // 自我知识确定性等级
    this.certaintyLevels = {
      ABSOLUTE: {
        name: '绝对确定',
        range: [0.9, 1.0],
        description: '笛卡尔式的不可怀疑性 (cogito)',
        example: '我知道我在思考、我知道我存在',
        color: '🟢'
      },
      HIGH: {
        name: '高度确定',
        range: [0.7, 0.9],
        description: '强烈的直觉式自我知识',
        example: '我知道我是善良的、我知道我在生气',
        color: '🔵'
      },
      MODERATE: {
        name: '中等确定',
        range: [0.4, 0.7],
        description: '基于推论的自我知识',
        example: '我认为我可能是外向的、我猜测我擅长这个',
        color: '🟡'
      },
      LOW: {
        name: '低度确定',
        range: [0.0, 0.4],
        description: '自我知识模糊或冲突',
        example: '我不确定我到底想要什么、我很困惑我是谁',
        color: '🔴'
      }
    };

    // 自我知识冲突模式
    this.conflictPatterns = [
      {
        name: '直觉 - 推论冲突',
        pattern: '直觉上我知道 X，但证据表明 Y',
        example: '直觉上我知道我有能力，但失败经历让我怀疑',
        intervention: '整合两种自我知识来源：承认直觉的价值，同时审视证据的质量',
        severity: 'moderate'
      },
      {
        name: '第一人称 - 第三人称冲突',
        pattern: '我感觉我是 X，但别人说我是 Y',
        example: '我觉得我是内向的，但朋友说我外向',
        intervention: '探索自我 - 他者视角差异：理解不同情境下的自我表现',
        severity: 'moderate'
      },
      {
        name: '时间性自我冲突',
        pattern: '过去的我是 X，现在的我是 Y',
        example: '我曾经很自信，现在不确定了',
        intervention: '时间 - 自我整合：识别变化中的连续性与成长',
        severity: 'high'
      },
      {
        name: '领域特异性冲突',
        pattern: '在 A 领域我知道我是 X，在 B 领域我不确定',
        example: '工作中我很自信，但社交中我不确定',
        intervention: '领域分化与整合：承认情境特异性，寻找核心价值',
        severity: 'low'
      },
      {
        name: '元认知过度自信',
        pattern: '我非常确定，但证据不足',
        example: '我绝对知道我是正确的，尽管没有证据',
        intervention: '元认知校准：审视证据基础，考虑替代解释',
        severity: 'high'
      },
      {
        name: '元认知自信不足',
        pattern: '有充分证据，但我不确定',
        example: '虽然有很多成功，但我还是怀疑自己',
        intervention: '证据整合：系统梳理支持性证据，挑战自我怀疑',
        severity: 'moderate'
      }
    ];

    // 自我知识来源类型
    this.knowledgeSources = {
      INTROSPECTION: {
        name: '内省 (Introspection)',
        description: '通过直接内省获得的自我知识',
        reliability: 'high for current mental states, low for dispositions',
        example: '我知道我现在很生气'
      },
      BEHAVIORAL_OBSERVATION: {
        name: '行为观察 (Behavioral Observation)',
        description: '通过观察自己的行为推断自我特征',
        reliability: 'moderate to high',
        example: '我经常帮助别人，所以我可能是善良的'
      },
      OTHER_FEEDBACK: {
        name: '他者反馈 (Other Feedback)',
        description: '通过他人的反馈和评价获得自我知识',
        reliability: 'moderate (depends on source credibility)',
        example: '朋友说我很有同理心'
      },
      SOCIAL_COMPARISON: {
        name: '社会比较 (Social Comparison)',
        description: '通过与他人比较获得自我知识',
        reliability: 'low to moderate',
        example: '我比大多数人更擅长这个'
      },
      CULTURAL_NARRATIVE: {
        name: '文化叙事 (Cultural Narrative)',
        description: '通过文化故事和角色模型获得自我理解',
        reliability: 'low to moderate',
        example: '我是某种性格类型的人'
      }
    };
  }

  /**
   * 评估自我知识类型
   * 
   * @param {string} selfStatement - 自我陈述 (如"我知道我是善良的")
   * @returns {Object} 评估结果
   */
  assessSelfKnowledgeType(selfStatement) {
    const statement = selfStatement.toLowerCase();
    
    // 计算直觉式标记得分
    let intuitiveScore = 0;
    this.intuitiveMarkers.forEach(marker => {
      if (statement.includes(marker.toLowerCase())) {
        intuitiveScore += 1;
      }
    });

    // 计算推论式标记得分
    let inferentialScore = 0;
    this.inferentialMarkers.forEach(marker => {
      if (statement.includes(marker.toLowerCase())) {
        inferentialScore += 1;
      }
    });

    // 归一化得分
    const maxMarkers = Math.max(this.intuitiveMarkers.length, this.inferentialMarkers.length);
    const normalizedIntuitive = Math.min(intuitiveScore / maxMarkers, 1);
    const normalizedInferential = Math.min(inferentialScore / maxMarkers, 1);

    // 确定主导类型
    let knowledgeType;
    let confidence;
    
    if (normalizedIntuitive > normalizedInferential + 0.2) {
      knowledgeType = 'INTUITIVE';
      confidence = 'high';
    } else if (normalizedInferential > normalizedIntuitive + 0.2) {
      knowledgeType = 'INFERENTIAL';
      confidence = 'high';
    } else if (normalizedIntuitive > 0.3 || normalizedInferential > 0.3) {
      knowledgeType = 'MIXED';
      confidence = 'moderate';
    } else {
      knowledgeType = 'UNCLEAR';
      confidence = 'low';
    }

    return {
      knowledgeType,
      confidence,
      scores: {
        intuitive: normalizedIntuitive,
        inferential: normalizedInferential
      },
      analysis: this._generateTypeAnalysis(knowledgeType, normalizedIntuitive, normalizedInferential),
      originalStatement: selfStatement
    };
  }

  /**
   * 生成自我知识类型分析
   */
  _generateTypeAnalysis(knowledgeType, intuitiveScore, inferentialScore) {
    const analyses = {
      INTUITIVE: `你的自我陈述表现出强烈的**直觉式自我知识**特征 (得分：${(intuitiveScore * 100).toFixed(0)}%)。
      
这意味着你对自己的认识是**直接的、非推论的**，类似于笛卡尔的"cogito"体验。
这种自我知识通常具有：
- ✅ 高确定性：你毫不怀疑地知道自己的状态
- ✅ 第一人称给定性：体验直接呈现，无需中介
- ⚠️ 注意：直觉式自我知识对当前心理状态准确，但对性格特质可能过度自信`,

      INFERENTIAL: `你的自我陈述表现出明显的**推论式自我知识**特征 (得分：${(inferentialScore * 100).toFixed(0)}%)。
      
这意味着你对自己的认识是**间接的、基于证据的**，通过观察和推理获得。
这种自我知识通常具有：
- ✅ 基于证据：有行为或反馈支持
- ✅ 可修正性：新证据可以更新自我认识
- ⚠️ 注意：推论式自我知识可能过度依赖外部验证，忽视内在体验`,

      MIXED: `你的自我陈述表现出**混合式自我知识**特征 (直觉：${(intuitiveScore * 100).toFixed(0)}%, 推论：${(inferentialScore * 100).toFixed(0)}%)。
      
这是**最健康的自我知识模式**：
- ✅ 整合了直接体验和理性反思
- ✅ 既有内在确定性，又有证据支持
- 💡 建议：继续保持这种平衡，在直觉和证据之间对话`,

      UNCLEAR: `你的自我陈述中**自我知识类型不明确** (直觉：${(intuitiveScore * 100).toFixed(0)}%, 推论：${(inferentialScore * 100).toFixed(0)}%)。
      
这可能意味着：
- 自我陈述较为模糊或抽象
- 缺乏明确的自我指涉
- 💡 建议：尝试更具体地表达自我认识，区分"我知道..."和"我认为..."`
    };

    return analyses[knowledgeType] || analyses.UNCLEAR;
  }

  /**
   * 评估自我知识确定性
   * 
   * @param {number} certaintyScore - 确定性得分 (0-1)
   * @param {string} knowledgeType - 知识类型 (INTUITIVE/INFERENTIAL/MIXED)
   * @returns {Object} 确定性评估
   */
  assessCertainty(certaintyScore, knowledgeType = 'MIXED') {
    let level;
    let levelInfo;

    if (certaintyScore >= 0.9) {
      level = 'ABSOLUTE';
    } else if (certaintyScore >= 0.7) {
      level = 'HIGH';
    } else if (certaintyScore >= 0.4) {
      level = 'MODERATE';
    } else {
      level = 'LOW';
    }

    levelInfo = this.certaintyLevels[level];

    // 根据知识类型调整建议
    let recommendation;
    if (level === 'ABSOLUTE' && knowledgeType === 'INFERENTIAL') {
      recommendation = '⚠️ 警惕：推论式自我知识达到绝对确定可能表示过度自信，建议审视证据基础';
    } else if (level === 'LOW' && knowledgeType === 'INTUITIVE') {
      recommendation = '⚠️ 警惕：直觉式自我知识确定性低可能表示自我疏离，建议加强内省练习';
    } else if (level === 'MODERATE') {
      recommendation = '✅ 健康：中等确定性表示开放的自我探索态度，愿意根据新证据调整';
    } else {
      recommendation = levelInfo.description;
    }

    return {
      level,
      ...levelInfo,
      score: certaintyScore,
      recommendation,
      knowledgeTypeContext: knowledgeType
    };
  }

  /**
   * 检测自我知识冲突
   * 
   * @param {Array} selfStatements - 自我陈述列表
   * @returns {Object} 冲突检测结果
   */
  detectSelfKnowledgeConflicts(selfStatements) {
    const conflicts = [];
    const assessments = selfStatements.map(stmt => ({
      statement: stmt,
      assessment: this.assessSelfKnowledgeType(stmt)
    }));

    // 检测直觉 - 推论冲突
    const intuitiveStatements = assessments.filter(a => a.assessment.knowledgeType === 'INTUITIVE');
    const inferentialStatements = assessments.filter(a => a.assessment.knowledgeType === 'INFERENTIAL');

    if (intuitiveStatements.length > 0 && inferentialStatements.length > 0) {
      // 检查内容是否冲突
      intuitiveStatements.forEach(intStmt => {
        inferentialStatements.forEach(infStmt => {
          if (this._statementsContradict(intStmt.statement, infStmt.statement)) {
            conflicts.push({
              type: 'INTUITIVE_INFERENTIAL_CONFLICT',
              pattern: this.conflictPatterns[0],
              statements: [intStmt.statement, infStmt.statement],
              severity: 'moderate'
            });
          }
        });
      });
    }

    // 检测确定性冲突
    const highCertainty = assessments.filter(a => {
      const certainty = this._extractCertainty(a.statement);
      return certainty >= 0.8;
    });
    const lowCertainty = assessments.filter(a => {
      const certainty = this._extractCertainty(a.statement);
      return certainty <= 0.4;
    });

    if (highCertainty.length > 0 && lowCertainty.length > 0) {
      conflicts.push({
        type: 'CERTAINTY_CONFLICT',
        pattern: this.conflictPatterns.find(p => p.name.includes('自信')),
        description: '存在高度确定与低度确定的自我信念并存',
        severity: 'moderate'
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts,
      totalStatements: selfStatements.length,
      summary: this._generateConflictSummary(conflicts)
    };
  }

  /**
   * 判断两个陈述是否冲突
   */
  _statementsContradict(stmt1, stmt2) {
    // 简单的冲突检测逻辑
    const contradictions = [
      ['自信', '自卑'],
      ['外向', '内向'],
      ['确定', '不确定'],
      ['知道', '不知道'],
      ['擅长', '不擅长'],
      ['喜欢', '讨厌']
    ];

    const s1 = stmt1.toLowerCase();
    const s2 = stmt2.toLowerCase();

    for (const [word1, word2] of contradictions) {
      if ((s1.includes(word1) && s2.includes(word2)) ||
          (s1.includes(word2) && s2.includes(word1))) {
        return true;
      }
    }

    return false;
  }

  /**
   * 从陈述中提取确定性得分
   */
  _extractCertainty(statement) {
    const certaintyWords = {
      '绝对': 1.0, '完全': 0.95, '肯定': 0.9, '确定': 0.85,
      '很': 0.7, '非常': 0.75, '相当': 0.6, '比较': 0.55,
      '可能': 0.4, '也许': 0.35, '或许': 0.35, '大概': 0.4,
      '不确定': 0.2, '困惑': 0.15, '迷茫': 0.1, '不知道': 0.1
    };

    let maxCertainty = 0.5; // 默认中等
    const stmt = statement.toLowerCase();

    for (const [word, score] of Object.entries(certaintyWords)) {
      if (stmt.includes(word)) {
        maxCertainty = Math.max(maxCertainty, score);
      }
    }

    return maxCertainty;
  }

  /**
   * 生成冲突总结
   */
  _generateConflictSummary(conflicts) {
    if (conflicts.length === 0) {
      return '✅ 未检测到明显的自我知识冲突。你的自我认识表现出良好的一致性。';
    }

    const typeCount = {};
    conflicts.forEach(c => {
      typeCount[c.type] = (typeCount[c.type] || 0) + 1;
    });

    let summary = `⚠️ 检测到 ${conflicts.length} 个自我知识冲突：\n\n`;
    
    for (const [type, count] of Object.entries(typeCount)) {
      const typeName = type.replace(/_/g, ' ').toLowerCase();
      summary += `- ${typeName}: ${count} 个\n`;
    }

    summary += '\n💡 建议：冲突不一定是问题，它们可能表示自我探索的活跃区域。';
    
    return summary;
  }

  /**
   * 生成元认知校准练习
   * 
   * @param {Object} assessmentResult - 自我知识评估结果
   * @param {number} duration - 练习时长 (分钟)
   * @returns {Object} 练习方案
   */
  generateMetacognitiveCalibrationExercise(assessmentResult, duration = 15) {
    const exercises = [];

    // 阶段 1: 自我知识来源识别
    exercises.push({
      phase: 1,
      name: '自我知识来源识别',
      duration: Math.round(duration * 0.3),
      instructions: `
**目标**: 识别你的自我知识来自哪些来源

**步骤**:
1. 闭上眼睛，回想一个关于自己的信念 (如"我是善良的")
2. 问自己：这个信念来自哪里？
   - 内省直觉？(我直接知道)
   - 行为观察？(我看到自己这样做)
   - 他者反馈？(别人告诉我)
   - 社会比较？(我和别人对比)
3. 记录每个来源的贡献比例
4. 评估每个来源的可靠性

**反思问题**:
- 哪个来源对你的自我认识影响最大？
- 这个来源可靠吗？为什么？
      `,
      reflectionQuestions: [
        '我的自我知识主要来自内省还是外部反馈？',
        '我是否过度依赖某个来源而忽视其他？',
        '哪个来源最可靠？哪个最不可靠？'
      ]
    });

    // 阶段 2: 确定性与证据校准
    exercises.push({
      phase: 2,
      name: '确定性与证据校准',
      duration: Math.round(duration * 0.4),
      instructions: `
**目标**: 校准自我知识的确定性与证据基础

**步骤**:
1. 列出 3-5 个关于自己的信念
2. 为每个信念评估：
   - 确定性 (0-100%)
   - 支持证据 (列出具体证据)
   - 反对证据 (列出具体证据)
3. 比较确定性与证据的匹配度
4. 调整确定性评估以匹配证据质量

**示例**:
信念：我擅长公开演讲
- 初始确定性：80%
- 支持证据：3 次成功演讲、收到正面反馈
- 反对证据：1 次紧张忘词、准备时间长
- 调整后确定性：65% (证据支持但非绝对)
      `,
      worksheet: {
        beliefs: [],
        calibration: []
      }
    });

    // 阶段 3: 整合直觉与推论
    exercises.push({
      phase: 3,
      name: '整合直觉与推论',
      duration: Math.round(duration * 0.3),
      instructions: `
**目标**: 整合直觉式和推论式自我知识

**步骤**:
1. 识别一个直觉式自我信念 (如"我直觉上知道我有价值")
2. 识别一个推论式自我信念 (如"根据我的成就，我有能力")
3. 寻找两者的共同点和差异
4. 创造整合陈述：
   "我直觉上知道 X，同时证据也支持 Y，整合起来我是 Z"

**整合示例**:
- 直觉：我直觉上知道我是有创造力的
- 推论：我完成了 5 个创意项目，收到正面评价
- 整合：我是有创造力的人——这既是我直接的体验，也有证据支持
      `,
      integrationTemplate: {
        intuitive: '',
        inferential: '',
        integrated: ''
      }
    });

    return {
      title: '元认知校准练习',
      totalDuration: duration,
      basedOn: assessmentResult,
      exercises,
      expectedOutcomes: [
        '提高对自我知识来源的意识',
        '校准确定性与证据的匹配度',
        '整合直觉与推论两种自我知识模式',
        '减少元认知偏差 (过度自信/自信不足)'
      ],
      followUpSuggestions: [
        '每周重复此练习，追踪自我知识的变化',
        '记录自我知识冲突的出现和解决',
        '与他人讨论自我认识，获取外部视角'
      ]
    };
  }

  /**
   * 第一人称给定性检测
   * 
   * @param {string} statement - 自我相关陈述
   * @returns {Object} 第一人称给定性评估
   */
  assessFirstPersonGivenness(statement) {
    const firstPersonMarkers = [
      '我', '我的', '我自己', '我自身', '我直接', '我亲自'
    ];

    const immediacyMarkers = [
      '直接', '立即', '此刻', '现在', '当下', '亲身', '直接体验'
    ];

    const statementLower = statement.toLowerCase();
    
    let firstPersonScore = 0;
    firstPersonMarkers.forEach(marker => {
      if (statementLower.includes(marker)) firstPersonScore += 1;
    });

    let immediacyScore = 0;
    immediacyMarkers.forEach(marker => {
      if (statementLower.includes(marker)) immediacyScore += 1;
    });

    const givennessLevel = (firstPersonScore + immediacyScore) / 
                          (firstPersonMarkers.length + immediacyMarkers.length);

    let levelDescription;
    if (givennessLevel >= 0.7) {
      levelDescription = '高第一人称给定性：陈述表现出强烈的直接自我指涉特征';
    } else if (givennessLevel >= 0.4) {
      levelDescription = '中等第一人称给定性：陈述包含自我指涉，但可能带有推论色彩';
    } else {
      levelDescription = '低第一人称给定性：陈述可能是关于自己的推论，而非直接体验';
    }

    return {
      givennessLevel,
      levelDescription,
      scores: {
        firstPerson: firstPersonScore / firstPersonMarkers.length,
        immediacy: immediacyScore / immediacyMarkers.length
      },
      analysis: this._generateGivennessAnalysis(givennessLevel, statement)
    };
  }

  /**
   * 生成第一人称给定性分析
   */
  _generateGivennessAnalysis(level, statement) {
    if (level >= 0.7) {
      return `你的陈述"**${statement}**"表现出**高第一人称给定性**。
      
这意味着：
- ✅ 你直接体验到所述内容，而非通过推论
- ✅ 具有笛卡尔式 cogito 的不可怀疑特征
- ✅ 这是前反思自我意识的典型表现

**哲学背景**: 这种直接给定性是现象学传统的核心概念 (Husserl, Sartre, Zahavi)，
表示自我意识不需要通过反思或推理就能获得。`;
    } else if (level >= 0.4) {
      return `你的陈述"**${statement}**"表现出**中等第一人称给定性**。
      
这意味着：
- 🟡 陈述包含自我指涉，但可能混合了直接体验和推论
- 🟡 可能部分基于观察或推理，而非纯粹的直接体验
- 💡 建议：尝试区分哪些部分是直接知道的，哪些是推断的`;
    } else {
      return `你的陈述"**${statement}**"表现出**低第一人称给定性**。
      
这意味着：
- 🟠 陈述更像是关于自己的推论或假设
- 🟠 可能基于行为观察、他者反馈或社会比较
- 💡 建议：尝试连接内在体验，问自己"我直接感受到什么？"`;
    }
  }

  /**
   * 生成自我知识整合干预方案
   * 
   * @param {Object} assessmentResults - 多项评估结果
   * @returns {Object} 整合干预方案
   */
  generateIntegrationIntervention(assessmentResults) {
    const {
      knowledgeTypeAssessment,
      certaintyAssessment,
      conflictDetection,
      givennessAssessment
    } = assessmentResults;

    const intervention = {
      title: '自我知识整合干预方案',
      generatedAt: new Date().toISOString(),
      summary: this._generateInterventionSummary(assessmentResults),
      focusAreas: [],
      practices: [],
      expectedOutcomes: []
    };

    // 根据评估结果确定重点领域
    if (knowledgeTypeAssessment?.knowledgeType === 'INFERENTIAL' && 
        certaintyAssessment?.level === 'ABSOLUTE') {
      intervention.focusAreas.push({
        area: '推论式过度自信',
        description: '你的推论式自我知识表现出绝对确定性，可能存在过度自信',
        priority: 'high'
      });
      intervention.practices.push({
        name: '证据审视练习',
        description: '系统审视支持自我信念的证据质量',
        duration: '15 分钟/天'
      });
    }

    if (knowledgeTypeAssessment?.knowledgeType === 'INTUITIVE' && 
        certaintyAssessment?.level === 'LOW') {
      intervention.focusAreas.push({
        area: '直觉式自信不足',
        description: '你的直觉式自我知识确定性低，可能存在自我疏离',
        priority: 'high'
      });
      intervention.practices.push({
        name: '内省连接练习',
        description: '重新连接内在体验，培养直接自我觉察',
        duration: '10 分钟/天'
      });
    }

    if (conflictDetection?.hasConflicts) {
      intervention.focusAreas.push({
        area: '自我知识冲突整合',
        description: `检测到 ${conflictDetection.conflictCount} 个自我知识冲突`,
        priority: 'moderate'
      });
      intervention.practices.push({
        name: '冲突对话练习',
        description: '让冲突的自我信念进行内在对话，寻找整合点',
        duration: '20 分钟/次'
      });
    }

    if (givennessAssessment?.givennessLevel < 0.4) {
      intervention.focusAreas.push({
        area: '第一人称给定性增强',
        description: '你的自我陈述缺乏直接体验的特征',
        priority: 'moderate'
      });
      intervention.practices.push({
        name: '当下自我觉察',
        description: '练习直接觉察当下的自我体验，不加推论',
        duration: '5-10 分钟/天'
      });
    }

    // 默认实践 (始终推荐)
    intervention.practices.push({
      name: '自我知识日记',
      description: '记录每日的自我认识变化、来源和确定性',
      duration: '10 分钟/天',
      template: `
日期：_______

今日自我认识:
1. 信念：_______
   - 来源：_______
   - 确定性：_______%
   - 证据：_______

反思:
- 这个信念如何形成的？
- 有什么新证据支持或挑战它？
- 我如何整合不同来源的自我知识？
      `
    });

    intervention.expectedOutcomes = [
      '提高自我知识的准确性和一致性',
      '减少元认知偏差',
      '增强自我理解的深度和广度',
      '培养健康的自我探索态度'
    ];

    return intervention;
  }

  /**
   * 生成干预总结
   */
  _generateInterventionSummary(results) {
    let summary = '根据你的自我知识评估结果，以下是个性化干预方案：\n\n';

    if (results.knowledgeTypeAssessment) {
      summary += `**自我知识类型**: ${results.knowledgeTypeAssessment.knowledgeType}\n`;
      summary += `${results.knowledgeTypeAssessment.analysis}\n\n`;
    }

    if (results.certaintyAssessment) {
      summary += `**确定性水平**: ${results.certaintyAssessment.level} (${results.certaintyAssessment.color})\n`;
      summary += `${results.certaintyAssessment.recommendation}\n\n`;
    }

    if (results.conflictDetection) {
      summary += `${results.conflictDetection.summary}\n\n`;
    }

    return summary;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      ...this.metadata,
      features: [
        '自我知识类型识别 (直觉式 vs 推论式)',
        '元认知校准 (确定性评估)',
        '第一人称给定性检测',
        '自我知识冲突检测',
        '整合干预方案生成'
      ],
      theorySources: [
        'SEP: Self-Consciousness §2, §4',
        'Descartes: cogito ergo sum',
        'Locke: Inner Perception',
        'Kant: Transcendental Apperception',
        'Fichte: Immediate Self-Positing',
        'Sartre: Pre-reflective Self-Consciousness',
        'Evans: Behavior-Based Self-Knowledge'
      ],
      usage: {
        assessType: 'assessSelfKnowledgeType(statement)',
        assessCertainty: 'assessCertainty(score, knowledgeType)',
        detectConflicts: 'detectSelfKnowledgeConflicts(statements)',
        generateExercise: 'generateMetacognitiveCalibrationExercise(assessment, duration)',
        assessGivenness: 'assessFirstPersonGivenness(statement)',
        generateIntervention: 'generateIntegrationIntervention(results)'
      }
    };
  }
}

module.exports = SelfCheckMetacognitive;
