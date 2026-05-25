/**
 * 时间意识增强模块 v5.0.1 (Temporal Consciousness Enhancement)
 * 
 * 基于斯坦福哲学百科全书 (SEP) Temporal Consciousness 权威理论
 * 
 * 核心理论框架:
 * - 时间意识三大模型：电影模型、保留模型、扩展模型
 * - 现象学时间流：原初印象 - 保留 - 预期 (Husserl)
 * - 时间深度 (Temporal Depth) 与心理延展
 * - 时间锚定与时间透视技术
 * 
 * SEP 理论来源:
 * - SEP Temporal Consciousness (2026 Edition)
 * - Husserl, E. (1928). On the Phenomenology of the Consciousness of Internal Time
 * - James, W. (1890). The Principles of Mind - Specious Present
 * - Dainton, B. (2000). Stream of Consciousness
 * - Phillips, I. (2014). Experience of Time
 * 
 * 核心概念:
 * - 电影模型 (Cinematic): 意识是瞬间快照序列
 * - 保留模型 (Retentional): 意识瞬间但包含过去保留与未来预期
 * - 扩展模型 (Extensional): 体验本身具有时间延展
 * - 显似现在 (Specious Present): James 提出的体验性现在，具有短暂延展
 * - 时间深度：心理时间的纵深程度，从瞬间到生命历程
 * 
 * @version 5.0.1 (HeartFlow v5.0.1)
 * @author HeartFlow Team
 */

/**
 * 时间意识三大模型 (Three Models of Temporal Consciousness)
 * 基于 SEP 权威分类
 */
const TemporalConsciousnessModels = {
  /**
   * 电影模型 (Cinematic Model)
   * 主张：意识是瞬间的"快照"序列，没有真正的时间延展
   * 代表人物：Augustine, Reid, Chuard
   */
  cinematic: {
    id: 'cinematic',
    name: '电影模型',
    coreThesis: '意识由无时间延展的瞬间快照组成，连续感是记忆产生的错觉',
    proponents: ['Augustine', 'Thomas Reid', 'Philippe Chuard'],
    keyClaims: [
      '意识状态是瞬间的、静态的',
      '时间延展是记忆构造的错觉',
      '变化感知是快照快速连续的结果',
      '类似于电影的帧序列机制'
    ],
    strengths: [
      '与物理时间的瞬间性一致',
      '解释了时间错觉现象',
      '简洁的本体论承诺'
    ],
    weaknesses: [
      '难以解释直接的运动感知',
      '无法说明旋律体验的连续性',
      '与现象学描述不符'
    ],
    
    /**
     * 评估体验是否符合电影模型特征
     */
    assess(experience) {
      let score = 0;
      const indicators = [];
      
      if (experience.includes('片段') || experience.includes('碎片')) {
        score += 2;
        indicators.push('片段化体验描述');
      }
      if (experience.includes('瞬间') || experience.includes('刹那')) {
        score += 1;
        indicators.push('瞬间性强调');
      }
      if (experience.includes('记忆') || experience.includes('回忆')) {
        score += 1;
        indicators.push('依赖记忆连接');
      }
      
      return {
        model: 'cinematic',
        score,
        maxScore: 4,
        match: score >= 2,
        indicators,
        interpretation: score >= 2 
          ? '您的体验描述显示出电影模型特征：将意识视为片段化的瞬间，通过记忆连接产生连续感'
          : '您的体验描述不太符合电影模型特征'
      };
    }
  },

  /**
   * 保留模型 (Retentional Model) ⭐ SEP 推荐模型
   * 主张：意识瞬间但包含对过去的"保留"表征和对未来的"预期"
   * 代表人物：Husserl, Brentano, Dennett
   */
  retentional: {
    id: 'retentional',
    name: '保留模型',
    coreThesis: '意识瞬间但具有三重结构：原初印象 + 保留 (过去) + 预期 (未来)',
    proponents: ['Edmund Husserl', 'Franz Brentano', 'Daniel Dennett'],
    keyClaims: [
      '意识是瞬间的，但内容具有时间厚度',
      '保留 (Retention) 是对刚过去的非自愿持存',
      '预期 (Protention) 是对即将到来的前摄',
      '时间意识的"彗星尾"结构',
      '保留不是回忆，而是直接的过去意识'
    ],
    strengths: [
      '解释了直接的运动/变化感知',
      '与现象学描述高度一致',
      '区分了保留与回忆',
      '说明了时间意识的厚度'
    ],
    weaknesses: [
      '保留的机制仍需澄清',
      '与物理时间的关系复杂',
      '可能隐含矛盾'
    ],
    
    /**
     * 评估体验是否符合保留模型特征
     */
    assess(experience) {
      let score = 0;
      const indicators = [];
      
      if (experience.includes('延续') || experience.includes('持续')) {
        score += 2;
        indicators.push('时间延续感');
      }
      if (experience.includes('刚刚') || experience.includes('刚才')) {
        score += 2;
        indicators.push('刚过去的直接意识');
      }
      if (experience.includes('期待') || experience.includes('即将')) {
        score += 1;
        indicators.push('未来预期');
      }
      if (experience.includes('流动') || experience.includes('流淌')) {
        score += 1;
        indicators.push('时间流动感');
      }
      
      return {
        model: 'retentional',
        score,
        maxScore: 6,
        match: score >= 3,
        indicators,
        interpretation: score >= 3
          ? '您的体验描述显示出保留模型特征：具有时间厚度的意识，包含对刚过去的持存和对未来的预期'
          : '您的体验描述不太符合保留模型特征'
      };
    }
  },

  /**
   * 扩展模型 (Extensional Model) ⭐ SEP 推荐模型
   * 主张：体验本身具有时间延展，不是瞬间的
   * 代表人物：William James, Dainton, Foster
   */
  extensional: {
    id: 'extensional',
    name: '扩展模型',
    coreThesis: '意识体验本身具有时间延展，能够直接容纳变化和持续',
    proponents: ['William James', 'Barry Dainton', 'John Foster'],
    keyClaims: [
      '意识体验是时间上延展的过程',
      '变化是体验的内在特征，不是构造的',
      '显似现在 (Specious Present) 具有真实延展',
      '体验的延展性与物理时间并行',
      '部分 - 整体结构：大体验包含小体验'
    ],
    strengths: [
      '最直接解释运动/变化感知',
      '与日常体验描述一致',
      '避免了错觉问题',
      '说明了体验的连续性'
    ],
    weaknesses: [
      '与物理时间的瞬间性冲突',
      '延展体验的本体论地位不清',
      '可能违反因果性'
    ],
    
    /**
     * 评估体验是否符合扩展模型特征
     */
    assess(experience) {
      let score = 0;
      const indicators = [];
      
      if (experience.includes('过程') || experience.includes('历程')) {
        score += 2;
        indicators.push('过程性体验');
      }
      if (experience.includes('延展') || experience.includes('延伸')) {
        score += 2;
        indicators.push('时间延展感');
      }
      if (experience.includes('整体') || experience.includes('完整')) {
        score += 1;
        indicators.push('整体性感知');
      }
      if (experience.includes('沉浸') || experience.includes('融入')) {
        score += 1;
        indicators.push('沉浸式体验');
      }
      
      return {
        model: 'extensional',
        score,
        maxScore: 6,
        match: score >= 3,
        indicators,
        interpretation: score >= 3
          ? '您的体验描述显示出扩展模型特征：体验本身具有时间延展，能够直接容纳变化和持续'
          : '您的体验描述不太符合扩展模型特征'
      };
    }
  }
};

/**
 * 时间深度评估 (Temporal Depth Assessment)
 * 测量个体心理时间的纵深程度
 */
const TemporalDepthAssessment = {
  /**
   * 时间深度层级
   */
  levels: {
    instant: {
      name: '瞬间型',
      range: '秒级',
      description: '时间视野局限于当下瞬间，缺乏过去 - 未来连接',
      characteristics: ['即时反应', '缺乏规划', '体验碎片化'],
      practices: ['正念呼吸', '身体扫描', '感官觉察']
    },
    short: {
      name: '短期型',
      range: '分钟 - 小时',
      description: '能够连接近期过去和近期未来',
      characteristics: ['短期规划', '任务导向', '有限的反思'],
      practices: ['日记写作', '目标设定', '回顾 - 展望练习']
    },
    medium: {
      name: '中期型',
      range: '天 - 周 - 月',
      description: '具有周/月尺度时间感，能够进行中期规划',
      characteristics: ['项目思维', '周期性反思', '习惯培养'],
      practices: ['周回顾', '月度规划', '习惯追踪']
    },
    long: {
      name: '长期型',
      range: '年 - 生命历程',
      description: '具有年度或生命历程尺度的时间感',
      characteristics: ['人生规划', '价值观导向', '深度反思'],
      practices: ['年度回顾', '生命轮评估', '传承思考']
    },
    transgenerational: {
      name: '跨代型',
      range: '代际 - 历史',
      description: '能够连接祖先与后代，具有历史纵深感',
      characteristics: ['历史意识', '传承思维', '集体记忆'],
      practices: ['家族史探索', '历史研究', '遗产规划']
    }
  },

  /**
   * 评估时间深度
   */
  assess(userInput) {
    const indicators = {
      instant: 0,
      short: 0,
      medium: 0,
      long: 0,
      transgenerational: 0
    };

    // 瞬间型指标
    if (userInput.includes('现在') || userInput.includes('当下') || userInput.includes('此刻')) {
      indicators.instant += 1;
    }
    if (userInput.includes('马上') || userInput.includes('立刻')) {
      indicators.instant += 1;
    }

    // 短期型指标
    if (userInput.includes('今天') || userInput.includes('今天') || userInput.includes('几小时')) {
      indicators.short += 1;
    }
    if (userInput.includes('计划') || userInput.includes('安排')) {
      indicators.short += 1;
    }

    // 中期型指标
    if (userInput.includes('周') || userInput.includes('月') || userInput.includes('项目')) {
      indicators.medium += 1;
    }
    if (userInput.includes('习惯') || userInput.includes('周期')) {
      indicators.medium += 1;
    }

    // 长期型指标
    if (userInput.includes('年') || userInput.includes('一生') || userInput.includes('人生')) {
      indicators.long += 1;
    }
    if (userInput.includes('目标') || userInput.includes('梦想') || userInput.includes('愿景')) {
      indicators.long += 1;
    }

    // 跨代型指标
    if (userInput.includes('祖先') || userInput.includes('后代') || userInput.includes('历史')) {
      indicators.transgenerational += 1;
    }
    if (userInput.includes('传承') || userInput.includes('遗产')) {
      indicators.transgenerational += 1;
    }

    // 找出主导层级
    const maxScore = Math.max(...Object.values(indicators));
    const dominantLevel = Object.entries(indicators)
      .filter(([_, score]) => score === maxScore && score > 0)
      .map(([level, _]) => level)[0] || 'instant';

    return {
      scores: indicators,
      dominantLevel,
      levelInfo: this.levels[dominantLevel],
      recommendations: this.generateRecommendations(dominantLevel),
      practices: this.levels[dominantLevel].practices
    };
  },

  /**
   * 生成扩展建议
   */
  generateRecommendations(currentLevel) {
    const progression = {
      instant: ['short', 'medium'],
      short: ['medium', 'long'],
      medium: ['long', 'transgenerational'],
      long: ['transgenerational'],
      transgenerational: []
    };

    const nextLevels = progression[currentLevel] || [];
    return nextLevels.map(level => ({
      targetLevel: level,
      levelName: this.levels[level].name,
      suggestion: `尝试${this.levels[level].practices[0]}，扩展您的时间视野到${this.levels[level].range}尺度`
    }));
  }
};

/**
 * 现象学时间流练习 (Phenomenological Time Flow Practice)
 * 基于 Husserl 时间意识现象学
 */
const PhenomenologicalTimePractice = {
  /**
   * 原初印象 - 保留 - 预期 觉察练习
   * 时长：10-15 分钟
   */
  triadicAwareness() {
    return {
      name: '时间三重结构觉察',
      duration: '10-15 分钟',
      theory: 'Husserl 时间意识现象学',
      steps: [
        {
          phase: '准备',
          duration: '2 分钟',
          instruction: '找一个安静的地方坐下，闭上眼睛，调整呼吸。让身体放松，注意力转向内在体验。'
        },
        {
          phase: '原初印象觉察',
          duration: '3 分钟',
          instruction: '注意当下的直接体验——可能是呼吸的感觉、身体的触感、或周围的声音。这是"原初印象"，当下的核心体验。不要分析，只是觉察。',
          focusQuestions: [
            '此刻最突出的体验是什么？',
            '这个体验如何呈现给你？',
            '它有什么质感、温度、强度？'
          ]
        },
        {
          phase: '保留觉察',
          duration: '3 分钟',
          instruction: '注意刚刚过去的体验如何仍然"在场"。这不是回忆，而是对刚过去的直接持存。就像听到一个音符后，它仍然在意识中"回响"。',
          focusQuestions: [
            '刚才的体验如何仍然影响着你？',
            '你能感觉到过去的"余韵"吗？',
            '过去如何塑造着现在的体验？'
          ]
        },
        {
          phase: '预期觉察',
          duration: '3 分钟',
          instruction: '注意对即将到来的体验的微妙预期。这不是有意识的预测，而是意识的前摄性倾向。就像等待下一个音符的落下。',
          focusQuestions: [
            '你对下一刻有什么微妙的期待？',
            '未来如何已经影响着你？',
            '预期给当下体验带来什么质感？'
          ]
        },
        {
          phase: '整合觉察',
          duration: '2 分钟',
          instruction: '同时觉察原初印象、保留和预期。注意它们如何交织成一个时间厚度的体验。这就是你的时间意识的"彗星尾"结构。',
          focusQuestions: [
            '三者如何同时存在？',
            '时间的"厚度"感觉如何？',
            '这个觉察本身如何改变体验？'
          ]
        }
      ],
      reflection: [
        '这次练习中，你注意到时间意识的哪些特征？',
        '原初印象、保留、预期，哪个对你来说最明显？',
        '这个练习如何改变了你对"当下"的理解？'
      ]
    };
  },

  /**
   * 时间锚定练习增强版
   * 连接过去 - 现在 - 未来
   */
  temporalAnchoring() {
    return {
      name: '时间锚定整合练习',
      duration: '15-20 分钟',
      theory: 'SEP Temporal Consciousness + 时间锚定技术',
      steps: [
        {
          phase: '准备与呼吸',
          duration: '2 分钟',
          instruction: '舒适地坐着，闭上眼睛，做几次深呼吸。让注意力回到当下。'
        },
        {
          phase: '过去锚定',
          duration: '5 分钟',
          instruction: '回想一个对你重要的过去时刻。不要只是"想"它，而是尝试重新体验它——当时的感觉、情绪、身体感受。让过去在当下"活起来"。',
          prompts: [
            '选择一个有意义的过去时刻',
            '重新体验当时的感官细节',
            '注意这个过去时刻如何影响现在的你',
            '从过去的你那里，现在的你能学到什么？'
          ]
        },
        {
          phase: '现在锚定',
          duration: '3 分钟',
          instruction: '回到当下。注意此时此刻的体验。过去和现在如何连接？过去的经验如何塑造了现在的你？',
          prompts: [
            '此刻的体验是什么？',
            '过去如何活在现在？',
            '你带着过去的什么智慧？'
          ]
        },
        {
          phase: '未来锚定',
          duration: '5 分钟',
          instruction: '想象一个你期待的未来时刻。不要只是"计划"，而是尝试提前体验它——那时的感觉、情绪、身体感受。让未来在当下"预演"。',
          prompts: [
            '选择一个你期待的未来时刻',
            '提前体验那时的感受',
            '未来的你给现在的你有什么信息？',
            '为了那个未来，现在可以采取什么小步骤？'
          ]
        },
        {
          phase: '时间整合',
          duration: '3 分钟',
          instruction: '同时感受过去、现在、未来。注意它们如何在你的意识中交织成一个连续的时间流。你就是这个时间流的承载者。',
          prompts: [
            '过去 - 现在 - 未来如何连接成一个整体？',
            '你的生命叙事是什么？',
            '在这个时间流中，你感受到什么？'
          ]
        }
      ],
      reflection: [
        '这次练习中，你注意到过去、现在、未来之间的什么关系？',
        '哪个时间锚定对你来说最容易？哪个最难？',
        '这个练习如何改变了你的时间感？'
      ]
    };
  },

  /**
   * 显似现在 (Specious Present) 探索
   * 体验"现在"的真实延展
   */
  speciousPresentExploration() {
    return {
      name: '显似现在探索',
      duration: '10 分钟',
      theory: 'William James - Specious Present',
      steps: [
        {
          phase: '准备',
          duration: '1 分钟',
          instruction: '找一个有持续声音的环境（如风扇声、交通声、或播放持续音调）。闭上眼睛，准备聆听。'
        },
        {
          phase: '瞬间听觉',
          duration: '2 分钟',
          instruction: '尝试只听"瞬间"的声音。注意这有多困难——声音总是已经"在继续"。',
          focusQuestion: '你能听到一个没有延展的"瞬间"声音吗？'
        },
        {
          phase: '延展听觉',
          duration: '3 分钟',
          instruction: '放弃寻找"瞬间"，而是注意声音的延展。注意声音如何"流淌"，如何在时间中展开。',
          focusQuestion: '声音的时间延展感觉如何？'
        },
        {
          phase: "显似现在觉察",
          duration: '3 分钟',
          instruction: '注意你的"现在"体验有多长。James 称之为"显似现在"——不是数学上的瞬间，而是有真实延展的体验性现在。',
          focusQuestions: [
            '你的"现在"有多长？几秒？',
            '这个"现在"包含什么？',
            '它如何包含刚刚过去和即将到来？'
          ]
        },
        {
          phase: '整合',
          duration: '1 分钟',
          instruction: '注意显似现在如何是你体验的基本单位。你不是活在"瞬间"，而是活在这个有厚度的"现在"中。'
        }
      ],
      insight: '显似现在揭示了时间的体验性真相：我们不是活在物理的瞬间，而是活在一个有真实延展的"现在"中。这个"现在"的厚度，就是我们意识的时间深度。'
    };
  }
};

/**
 * 时间意识模型评估器
 * 综合评估用户的时间意识特征
 */
const TemporalConsciousnessAssessor = {
  models: TemporalConsciousnessModels,
  depthAssessment: TemporalDepthAssessment,

  /**
   * 综合评估
   */
  assess(userInput) {
    const modelAssessments = {
      cinematic: this.models.cinematic.assess(userInput),
      retentional: this.models.retentional.assess(userInput),
      extensional: this.models.extensional.assess(userInput)
    };

    const depthAssessment = this.depthAssessment.assess(userInput);

    // 找出最匹配的模型
    const modelScores = Object.entries(modelAssessments)
      .map(([model, assessment]) => ({ model, score: assessment.score, maxScore: assessment.maxScore }));
    
    const normalizedScores = modelScores.map(m => ({
      model: m.model,
      normalizedScore: m.score / m.maxScore
    }));

    const bestMatch = normalizedScores.reduce((best, current) => 
      current.normalizedScore > best.normalizedScore ? current : best
    );

    return {
      modelAssessments,
      depthAssessment,
      bestMatchModel: bestMatch.model,
      bestMatchScore: bestMatch.normalizedScore,
      interpretation: this.generateInterpretation(bestMatch, depthAssessment),
      recommendedPractices: this.recommendPractices(bestMatch, depthAssessment)
    };
  },

  /**
   * 生成解释
   */
  generateInterpretation(bestMatch, depthAssessment) {
    const modelNames = {
      cinematic: '电影模型',
      retentional: '保留模型',
      extensional: '扩展模型'
    };

    return {
      modelInterpretation: `您的时间意识特征最符合${modelNames[bestMatch.model]}（匹配度：${(bestMatch.normalizedScore * 100).toFixed(0)}%）。${TemporalConsciousnessModels[bestMatch.model].interpretation}`,
      depthInterpretation: `您的主导时间深度是"${depthAssessment.levelInfo.name}"（${depthAssessment.levelInfo.range}）。${depthAssessment.levelInfo.description}`,
      integration: '时间意识的模型和时间深度是两个不同但相关的维度。模型描述您如何体验时间的结构，深度描述您的时间视野的纵深。'
    };
  },

  /**
   * 推荐练习
   */
  recommendPractices(bestMatch, depthAssessment) {
    const practices = [];

    // 基于模型推荐
    if (bestMatch.model === 'cinematic') {
      practices.push({
        name: '保留模型觉察',
        reason: '您的体验显示出电影模型特征，可以尝试保留模型练习来丰富时间厚度体验',
        practice: PhenomenologicalTimePractice.triadicAwareness()
      });
    }

    if (bestMatch.model === 'retentional' || bestMatch.model === 'extensional') {
      practices.push({
        name: '显似现在探索',
        reason: '您的体验显示出保留/扩展模型特征，显似现在练习可以深化这个体验',
        practice: PhenomenologicalTimePractice.speciousPresentExploration()
      });
    }

    // 基于深度推荐
    if (depthAssessment.recommendations.length > 0) {
      practices.push({
        name: '时间锚定整合',
        reason: `您的时间深度是"${depthAssessment.levelInfo.name}"，可以尝试扩展时间视野`,
        practice: PhenomenologicalTimePractice.temporalAnchoring()
      });
    }

    return practices;
  }
};

/**
 * 模块导出
 */
module.exports = {
  // 核心数据结构
  TemporalConsciousnessModels,
  TemporalDepthAssessment,
  PhenomenologicalTimePractice,
  
  // 评估器
  TemporalConsciousnessAssessor,
  
  // 便捷方法
  assess: (userInput) => TemporalConsciousnessAssessor.assess(userInput),
  getPractice: (type) => {
    const practices = {
      triadicAwareness: () => PhenomenologicalTimePractice.triadicAwareness(),
      temporalAnchoring: () => PhenomenologicalTimePractice.temporalAnchoring(),
      speciousPresent: () => PhenomenologicalTimePractice.speciousPresentExploration()
    };
    return practices[type] ? practices[type]() : null;
  },
  
  // 元数据
  metadata: {
    name: '时间意识增强',
    version: '5.0.1',
    theory: 'SEP Temporal Consciousness',
    heartFlowVersion: 'v5.0.1'
  }
};
