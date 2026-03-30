/**
 * 自我检查元认知增强模块 v5.0.8
 * 
 * 基于 SEP Self-Consciousness 关于自我意识性质的理论
 * 理论来源：Locke, Hume, Kant, Fichte, Heidelberg School, 现象学传统
 * 
 * 核心理论区分:
 * 
 * 1. 直觉式自我知识 (Intuitive Self-Knowledge)
 *    - Locke: "我们对自己存在的直觉知识"，无需推理
 *    - 特征：直接、确定、不可错 (如"我知道我在疼痛")
 *    - 例子："我知道我在思考"，"我知道我存在"
 * 
 * 2. 推论式自我知识 (Inferential Self-Knowledge)
 *    - 通过观察自己的行为/状态推论得出
 *    - 特征：间接、可错、需要解释 (如"我一定是生气了，因为我在发抖")
 *    - 例子："我可能很焦虑 (因为我拖延了)"，"我应该很快乐 (因为我有好工作)"
 * 
 * 3. 前反思自我意识 (Pre-reflective Self-Consciousness)
 *    - Fichte/Heidelberg School/Sartre: 无需将自我作为对象的意识
 *    - 特征：非对象化、第一人称给定性、体验的"为我性"
 *    - 例子：在专注行动中，无需思考"我在做 X"，但体验仍是"我的"
 * 
 * 4. 反思自我意识 (Reflective Self-Consciousness)
 *    - 将自我作为对象的意识
 *    - 特征：对象化、可表达、可分享
 *    - 例子："我是一个焦虑的人"，"我有拖延的问题"
 * 
 * 元认知校准目标:
 * - 检测直觉报告与推论报告的冲突
 * - 识别过度推论 (忽视直觉信号)
 * - 识别直觉主导 (缺乏反思校准)
 * - 促进两种自我知识的整合
 */

/**
 * 自我知识来源评估器
 */
class SelfKnowledgeSourceAssessor {
  constructor() {
    // 直觉式自我知识的语言标记
    this.intuitiveMarkers = [
      '我知道', '我感觉到', '我意识到', '我体验',
      '我觉得', '我感到', '直觉告诉我', '内心知道',
      '直接', '立刻', '无需思考'
    ];

    // 推论式自我知识的语言标记
    this.inferentialMarkers = [
      '我想我', '可能我', '也许我', '我应该',
      '因为所以', '这意味着', '说明我', '表明我',
      '逻辑上', '按理说', '从...来看', '基于'
    ];

    // 前反思体验的标记 (难以言说但真实)
    this.prereflectiveMarkers = [
      '说不上来', '难以形容', '就是', '自然而然',
      '没想那么多', '下意识', '本能', '自动'
    ];

    // 反思性自我描述的标记
    this.reflectiveMarkers = [
      '我是', '我有', '我的特点是', '我倾向于',
      '我的模式是', '我发现自己', '我注意到我'
    ];
  }

  /**
   * 分析自我报告的知识来源
   * 
   * @param {string} selfReport - 用户的自我描述
   * @returns {Object} 分析报告
   */
  analyze(selfReport) {
    const scores = {
      intuitive: this.calculateScore(selfReport, this.intuitiveMarkers),
      inferential: this.calculateScore(selfReport, this.inferentialMarkers),
      prereflective: this.calculateScore(selfReport, this.prereflectiveMarkers),
      reflective: this.calculateScore(selfReport, this.reflectiveMarkers)
    };

    const dominantSource = this.findDominantSource(scores);
    const hasConflict = this.detectConflict(scores);
    const balance = this.calculateBalance(scores);

    return {
      scores,
      dominantSource,
      hasConflict,
      balance,
      interpretation: this.interpret(dominantSource, hasConflict, balance),
      recommendations: this.generateRecommendations(dominantSource, hasConflict, balance)
    };
  }

  /**
   * 计算某类标记的得分
   */
  calculateScore(text, markers) {
    if (!text) return 0;

    const lowerText = text.toLowerCase();
    let matchCount = 0;

    markers.forEach(marker => {
      if (lowerText.includes(marker.toLowerCase())) {
        matchCount++;
      }
    });

    // 归一化到 0-1
    return Math.min(matchCount / 3, 1.0);
  }

  /**
   * 找到主导的自我知识来源
   */
  findDominantSource(scores) {
    const entries = Object.entries(scores);
    const maxEntry = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    return {
      source: maxEntry[0],
      score: maxEntry[1],
      isClear: maxEntry[1] > 0.6 && maxEntry[1] > Object.values(scores).reduce((a, b) => a + b, 0) / 4 + 0.2
    };
  }

  /**
   * 检测不同来源之间的冲突
   */
  detectConflict(scores) {
    // 直觉 vs 推论的冲突
    const intuitiveVsInferential = Math.abs(scores.intuitive - scores.inferential);
    
    // 前反思 vs 反思的冲突
    const prereflectiveVsReflective = Math.abs(scores.prereflective - scores.reflective);

    return {
      intuitiveVsInferential: intuitiveVsInferential > 0.5,
      prereflectiveVsReflective: prereflectiveVsReflective > 0.5,
      overall: intuitiveVsInferential > 0.5 || prereflectiveVsReflective > 0.5
    };
  }

  /**
   * 计算自我知识的平衡度
   */
  calculateBalance(scores) {
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 标准差越小，越平衡
    const balance = 1 - Math.min(stdDev * 2, 1);

    return {
      score: balance,
      isBalanced: balance >= 0.7,
      isImbalanced: balance < 0.4
    };
  }

  /**
   * 解释评估结果
   */
  interpret(dominantSource, hasConflict, balance) {
    const interpretations = {
      intuitive: {
        name: '直觉主导型',
        description: '倾向于依赖直接体验和内在感受',
        strength: '快速、真实、与身体智慧连接',
        risk: '可能缺乏反思深度，忽视理性分析'
      },
      inferential: {
        name: '推论主导型',
        description: '倾向于通过推理和观察分析自己',
        strength: '理性、系统、可解释',
        risk: '可能过度分析，忽视直觉信号，产生「应该」而非「真实」'
      },
      prereflective: {
        name: '前反思主导型',
        description: '体验先于语言化，难以表达但真实',
        strength: '与当下体验连接，非概念化智慧',
        risk: '难以沟通和整合，可能停留在模糊状态'
      },
      reflective: {
        name: '反思主导型',
        description: '习惯将自己作为对象进行观察分析',
        strength: '自我理解清晰，可分享和修正',
        risk: '可能过度对象化，失去体验的直接性'
      }
    };

    const baseInterpretation = interpretations[dominantSource.source];

    return {
      ...baseInterpretation,
      hasConflict: hasConflict.overall,
      isBalanced: balance.isBalanced,
      conflictNote: hasConflict.overall ? 
        '检测到不同自我知识来源之间的张力，这可能是成长的机会' : 
        '自我知识来源相对一致',
      balanceNote: balance.isBalanced ? 
        '自我知识来源多样化且平衡' : 
        balance.isImbalanced ? 
        '自我知识来源可能过于单一' : 
        '自我知识来源有一定多样性'
    };
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(dominantSource, hasConflict, balance) {
    const recommendations = [];

    if (dominantSource.source === 'intuitive' && dominantSource.isClear) {
      recommendations.push({
        type: 'expand',
        title: '发展推论能力',
        suggestion: '尝试问自己：「我的感受告诉我什么证据？」「有没有其他解释？」',
        exercise: '写情绪日记，记录感受 + 触发事件 + 可能的解释'
      });
    }

    if (dominantSource.source === 'inferential' && dominantSource.isClear) {
      recommendations.push({
        type: 'expand',
        title: ' reconnect 直觉',
        suggestion: '练习暂停分析，直接问：「我此刻的真实感受是什么？」',
        exercise: '身体扫描冥想，关注身体感受而非思维解释'
      });
      recommendations.push({
        type: 'warning',
        title: '警惕「应该」陷阱',
        suggestion: '注意「我应该感觉 X」与「我实际感觉 X」的区别',
        exercise: '当发现「应该」时，暂停并问：「如果放下应该，我实际感受到什么？」'
      });
    }

    if (dominantSource.source === 'prereflective' && dominantSource.isClear) {
      recommendations.push({
        type: 'expand',
        title: '发展语言表达能力',
        suggestion: '尝试用语言描述难以言说的体验',
        exercise: '自由写作 10 分钟，不评判地写下任何浮现的内容'
      });
    }

    if (dominantSource.source === 'reflective' && dominantSource.isClear) {
      recommendations.push({
        type: 'expand',
        title: '培养前反思临在',
        suggestion: '练习不将自己作为对象的纯体验',
        exercise: '沉浸在一项活动中 (如运动、艺术)，让行动自然流动'
      });
    }

    if (hasConflict.intuitiveVsInferential) {
      recommendations.push({
        type: 'integrate',
        title: '整合直觉与推论',
        suggestion: '直觉和推论可能都在告诉你重要的信息',
        exercise: '列出直觉告诉你的 vs 推论告诉你的，寻找整合的可能性'
      });
    }

    if (balance.isImbalanced) {
      recommendations.push({
        type: 'balance',
        title: '发展多元自我知识',
        suggestion: '健康的自我意识需要多种来源的平衡',
        exercise: '每周练习一种非主导的自我探索方式'
      });
    }

    return recommendations;
  }
}

/**
 * 元认知校准器
 * 
 * 检测并校准直觉报告与观察指标之间的冲突
 */
class MetacognitiveCalibrator {
  constructor() {
    this.calibrationStrategies = {
      conflict_detected: this.conflictStrategy,
      over_intellectualization: this.overIntellectualizationStrategy,
      intuition_dominance: this.intuitionDominanceStrategy,
      balanced: this.balancedStrategy
    };
  }

  /**
   * 执行元认知校准
   * 
   * @param {Object} intuitiveReport - 直觉式自我报告
   * @param {Object} inferentialReport - 推论式自我报告
   * @param {Object} behavioralData - 行为观察数据
   * @returns {Object} 校准结果
   */
  calibrate(intuitiveReport, inferentialReport, behavioralData = {}) {
    const conflict = this.detectConflict(intuitiveReport, inferentialReport, behavioralData);
    const pattern = this.identifyPattern(conflict, intuitiveReport, inferentialReport);
    const strategy = this.calibrationStrategies[pattern] || this.balancedStrategy;

    return {
      conflict,
      pattern,
      calibration: strategy(intuitiveReport, inferentialReport, behavioralData),
      confidence: this.calculateCalibrationConfidence(conflict, pattern)
    };
  }

  /**
   * 检测冲突
   */
  detectConflict(intuitive, inferential, behavioral) {
    const conflicts = [];

    // 情绪标签冲突
    if (intuitive.emotion && inferential.emotion && intuitive.emotion !== inferential.emotion) {
      conflicts.push({
        type: 'emotion_label',
        intuitive: intuitive.emotion,
        inferential: inferential.emotion,
        severity: 'high'
      });
    }

    // 强度冲突
    if (intuitive.intensity && inferential.intensity) {
      const intensityDiff = Math.abs(intuitive.intensity - inferential.intensity);
      if (intensityDiff > 0.4) {
        conflicts.push({
          type: 'intensity',
          intuitive: intuitive.intensity,
          inferential: inferential.intensity,
          severity: intensityDiff > 0.7 ? 'high' : 'medium'
        });
      }
    }

    // 直觉与行为冲突
    if (intuitive.emotion && behavioral.observedBehavior) {
      const behaviorEmotion = this.inferEmotionFromBehavior(behavioral.observedBehavior);
      if (behaviorEmotion && behaviorEmotion !== intuitive.emotion) {
        conflicts.push({
          type: 'intuitive_vs_behavioral',
          intuitive: intuitive.emotion,
          behavioral: behaviorEmotion,
          severity: 'medium'
        });
      }
    }

    // 推论与行为冲突
    if (inferential.emotion && behavioral.observedBehavior) {
      const behaviorEmotion = this.inferEmotionFromBehavior(behavioral.observedBehavior);
      if (behaviorEmotion && behaviorEmotion !== inferential.emotion) {
        conflicts.push({
          type: 'inferential_vs_behavioral',
          inferential: inferential.emotion,
          behavioral: behaviorEmotion,
          severity: 'low'
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      highSeverity: conflicts.some(c => c.severity === 'high')
    };
  }

  /**
   * 从行为推断情绪
   */
  inferEmotionFromBehavior(behaviors) {
    const behaviorEmotionMap = {
      '逃跑': 'fear',
      '回避': 'fear',
      '攻击': 'anger',
      '大喊': 'anger',
      '哭泣': 'sadness',
      '退缩': 'sadness',
      '微笑': 'joy',
      '庆祝': 'joy',
      '坐立不安': 'anxiety',
      '拖延': 'anxiety'
    };

    for (const behavior of behaviors) {
      if (behaviorEmotionMap[behavior]) {
        return behaviorEmotionMap[behavior];
      }
    }

    return null;
  }

  /**
   * 识别模式
   */
  identifyPattern(conflict, intuitive, inferential) {
    if (!conflict.hasConflict) return 'balanced';

    if (conflict.highSeverity) return 'conflict_detected';

    // 检查是否过度理智化
    if (inferential.confidence > 0.8 && intuitive.confidence < 0.3) {
      return 'over_intellectualization';
    }

    // 检查是否直觉主导
    if (intuitive.confidence > 0.8 && inferential.confidence < 0.3) {
      return 'intuition_dominance';
    }

    return 'conflict_detected';
  }

  /**
   * 冲突检测策略
   */
  conflictStrategy(intuitive, inferential, behavioral) {
    return {
      type: 'conflict_resolution',
      message: '我注意到你的直觉感受和理性分析之间存在差异',
      prompts: [
        `你直觉上感到「${intuitive.emotion || '某种情绪'}」，但理性分析认为是「${inferential.emotion || '另一种情绪'}」。这两种感受可能都在告诉你重要的信息。`,
        '能否描述一下，当你放下分析，直接体验时，身体有什么感受？',
        '有没有可能，这两种情绪同时存在？比如，表面是 X，深层是 Y？'
      ],
      exercise: {
        name: '情绪分层探索',
        steps: [
          '闭上眼睛，专注于身体感受 1 分钟',
          '问自己：「如果放下所有应该和解释，我此刻的真实感受是什么？」',
          '记录浮现的第一个词，不加评判',
          '然后问：「这个感受下面，还有没有其他感受？」'
        ]
      }
    };
  }

  /**
   * 过度理智化策略
   */
  overIntellectualizationStrategy(intuitive, inferential, behavioral) {
    return {
      type: 'reconnect_intuition',
      message: '我注意到你可能在过度分析自己的体验',
      prompts: [
        '有时候，我们的头脑会告诉我们「应该」感受什么，但身体知道真实的答案',
        '如果暂时放下所有分析和解释，你此刻的直接体验是什么？',
        '身体有什么感受？紧绷？放松？温暖？沉重？'
      ],
      exercise: {
        name: '身体智慧连接',
        steps: [
          '找一个安静的地方坐下，闭上眼睛',
          '从脚到头，慢慢扫描身体的每个部位',
          '注意任何感受，不试图改变或解释它们',
          '问：「如果身体能说话，它会告诉我什么？」'
        ]
      }
    };
  }

  /**
   * 直觉主导策略
   */
  intuitionDominanceStrategy(intuitive, inferential, behavioral) {
    return {
      type: 'develop_reflection',
      message: '你的直觉感受很清晰，同时发展反思能力可能带来更深的理解',
      prompts: [
        '你的直觉告诉你很清晰的信号，这很有价值',
        '同时，好奇一下：这种感受可能与什么情境或经历有关？',
        '有没有可能，从不同角度理解这个感受，会带来新的洞察？'
      ],
      exercise: {
        name: '感受 - 情境连接',
        steps: [
          '记录你强烈的直觉感受',
          '问：「这种感受通常在什么情境下出现？」',
          '问：「过去什么时候有过类似的感受？」',
          '寻找模式，但不强迫解释'
        ]
      }
    };
  }

  /**
   * 平衡策略
   */
  balancedStrategy(intuitive, inferential, behavioral) {
    return {
      type: 'maintain',
      message: '你的自我觉察看起来很平衡，直觉和反思都在发挥作用',
      prompts: [
        '你似乎能够同时信任直觉和理性，这是很好的平衡',
        '继续保持这种开放的自我探索态度'
      ],
      exercise: {
        name: '持续练习',
        steps: [
          '继续日常的自我觉察练习',
          '偶尔挑战自己用非主导的方式探索体验',
          '记录任何新的洞察'
        ]
      }
    };
  }

  /**
   * 计算校准置信度
   */
  calculateCalibrationConfidence(conflict, pattern) {
    if (!conflict.hasConflict) return 0.9;
    if (pattern === 'balanced') return 0.85;
    if (conflict.highSeverity) return 0.6;
    return 0.75;
  }
}

// 导出实例
const selfKnowledgeAssessor = new SelfKnowledgeSourceAssessor();
const metacognitiveCalibrator = new MetacognitiveCalibrator();

module.exports = {
  SelfKnowledgeSourceAssessor,
  MetacognitiveCalibrator,
  selfKnowledgeAssessor,
  metacognitiveCalibrator
};
