/**
 * 审美情绪模块 v5.0.5 (Aesthetic Emotions Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 和当代情绪科学权威理论：
 * - SEP Aesthetic Emotions (2026 Edition)
 * - Frijda (1988) - 审美情绪的心理距离与无利害性
 * - Silvia (2005, 2008) - 兴趣与好奇的知识情绪理论
 * - Keltner & Haidt (2003) - 敬畏理论
 * - Berkeley Greater Good Science Center - 美感与幸福感研究
 * 
 * 核心理论框架:
 * 1. 审美情绪六大类型：敬畏、美感、兴趣、好奇、惊奇、崇高
 * 2. 审美情绪的共同特征：心理距离、无利害性、注意捕获、体验强度
 * 3. 审美情绪的功能：幸福感提升、学习动机、亲社会效应、超越体验
 * 
 * 功能目标：v5.0.5 审美情绪整合增强
 * - 审美情绪评估：识别用户的审美体验类型和强度
 * - 美感干预练习：艺术欣赏、自然沉浸、人性光辉记录
 * - 兴趣 - 好奇循环：知识情绪培养技术
 * - 审美情绪时间扩展：美感体验如何改变时间感知
 * - 与敬畏心理学模块集成：扩展超越体验谱系
 * 
 * @version 5.0.5
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 审美情绪六大类型 (Six Types of Aesthetic Emotions)
 * 基于 SEP Aesthetic Emotions 和 Silvia & Frijda 的分类
 */
const AestheticEmotionTypes = {
  // 敬畏 (Awe) - 已有 awe-psychology 模块，这里做集成
  AWE: {
    name: '敬畏',
    nameEn: 'Awe',
    trigger: '宏大、超越理解、浩瀚',
    coreFeatures: ['自我缩小', '时间扩展', '需要顺应'],
    valence: 'mixed', // 可以是积极或消极
    actionTendency: '沉思、分享、亲社会行为',
    relatedModules: ['awe-psychology', 'awe-time-expansion']
  },
  
  // 美感 (Beauty) - 核心审美情绪
  BEAUTY: {
    name: '美感',
    nameEn: 'Beauty',
    trigger: '艺术、自然、人性光辉、和谐',
    coreFeatures: ['愉悦', '无利害欣赏', '想要维持体验'],
    valence: 'positive',
    actionTendency: '凝视、分享、创造',
    bodySensation: '胸口温暖、放松、微笑',
    example: '看到日落、听优美音乐、见证善行'
  },
  
  // 兴趣 (Interest) - 知识情绪
  INTEREST: {
    name: '兴趣',
    nameEn: 'Interest',
    trigger: '新奇、复杂、神秘、可理解',
    coreFeatures: ['探索欲望', '专注', '认知投入'],
    valence: 'positive',
    actionTendency: '探索、学习、深入理解',
    bodySensation: '身体前倾、眼睛睁大、注意力集中',
    example: '读到有趣的理论、看到复杂的艺术品'
  },
  
  // 好奇 (Curiosity) - 知识情绪
  CURIOSITY: {
    name: '好奇',
    nameEn: 'Curiosity',
    trigger: '知识缺口、信息不足、悬念',
    coreFeatures: ['信息寻求', '不确定性', '期待解答'],
    valence: 'mixed', // 好奇可以是愉悦的也可以是焦虑的
    actionTendency: '提问、搜索、实验',
    bodySensation: '轻微紧张、期待感',
    example: '想知道故事结局、谜题待解'
  },
  
  // 惊奇 (Surprise) - 短暂但重要
  SURPRISE: {
    name: '惊奇',
    nameEn: 'Surprise',
    trigger: '意外、违背预期、突然变化',
    coreFeatures: ['注意捕获', '短暂', '重新评估'],
    valence: 'neutral', // 取决于后续评估
    actionTendency: '暂停、重新定向注意、更新模型',
    bodySensation: '心跳加速、倒吸一口气',
    example: '突然的声响、剧情反转'
  },
  
  // 崇高 (Sublime) - 康德美学核心
  SUBLIME: {
    name: '崇高',
    nameEn: 'Sublime',
    trigger: '危险 + 吸引力、无限、压倒性力量',
    coreFeatures: ['恐惧 + 愉悦混合', '超越感', '理性超越感官'],
    valence: 'mixed',
    actionTendency: '敬畏、沉思、自我反思',
    bodySensation: '颤抖、敬畏感、渺小感',
    example: '站在悬崖边、面对暴风雨、仰望星空'
  }
};

/**
 * 审美情绪的共同特征 (Common Features of Aesthetic Emotions)
 * 基于 Frijda 和 SEP 的理论整合
 */
const AestheticFeatures = {
  // 心理距离 (Psychical Distance) - Bullough (1912)
  PSYCHICAL_DISTANCE: {
    name: '心理距离',
    description: '与实用目的保持距离，专注于体验本身',
    assessment: '你能否不带功利目的地欣赏这个体验？',
    scale: '0-1 (0=完全功利，1=完全无利害)'
  },
  
  // 无利害性 (Disinterestedness) - Kant
  DISINTERESTEDNESS: {
    name: '无利害性',
    description: '不关心对象的存在，只关心其表象',
    assessment: '你是否纯粹为了体验而欣赏，而非为了占有或使用？',
    scale: '0-1'
  },
  
  // 注意捕获 (Attention Capture)
  ATTENTION_CAPTURE: {
    name: '注意捕获',
    description: '审美情绪自动吸引并维持注意力',
    assessment: '你的注意力是否被这个体验完全吸引？',
    scale: '0-1'
  },
  
  // 体验强度 (Experiential Intensity)
  INTENSITY: {
    name: '体验强度',
    description: '审美情绪的主观强度',
    assessment: '这个体验对你来说有多强烈？',
    scale: '0-5 (0=无感觉，5=极其强烈)'
  },
  
  // 效价 (Valence)
  VALENCE: {
    name: '效价',
    description: '体验的积极/消极性质',
    assessment: '这个体验主要是愉悦的还是不愉悦的？',
    scale: '-2 (非常消极) 到 +2 (非常积极)'
  },
  
  // 趋近动机 (Approach Motivation)
  APPROACH_MOTIVATION: {
    name: '趋近动机',
    description: '想要接近、维持或重复体验的动机',
    assessment: '你是否想要继续这个体验或再次经历它？',
    scale: '0-1'
  }
};

/**
 * 审美情绪评估量表 (Aesthetic Emotion Assessment Scale)
 * 基于 Silvia 和 Frijda 的研究
 */
const AestheticEmotionAssessment = {
  // 美感体验量表
  BEAUTY_SCALE: [
    '这个体验有多美？(0-10)',
    '你感到多大的愉悦？(0-10)',
    '你多想维持这个体验？(0-10)',
    '这个体验有多和谐？(0-10)'
  ],
  
  // 兴趣 - 好奇量表
  INTEREST_CURIOSITY_SCALE: [
    '这个体验有多有趣？(0-10)',
    '你多想探索更多？(0-10)',
    '这个体验有多新奇？(0-10)',
    '你感到多大的知识缺口？(0-10)'
  ],
  
  // 敬畏体验量表 (与 awe-psychology 集成)
  AWE_SCALE: [
    '这个体验有多宏大？(0-10)',
    '你感到多需要顺应新的理解？(0-10)',
    '你感到多渺小？(0-10)',
    '这个体验有多超越日常？(0-10)'
  ],
  
  // 崇高体验量表
  SUBLIME_SCALE: [
    '这个体验有多压倒性？(0-10)',
    '恐惧和吸引力的混合程度？(0-10)',
    '你感到多大的超越感？(0-10)',
    '这个体验让你多想自我反思？(0-10)'
  ]
};

// ============ 核心功能实现 ============

class AestheticEmotionsModule {
  constructor() {
    this.version = '5.0.5';
    this.emotionTypes = AestheticEmotionTypes;
    this.features = AestheticFeatures;
    this.assessmentScales = AestheticEmotionAssessment;
  }

  /**
   * 识别审美情绪类型
   * @param {string} userInput - 用户描述
   * @returns {object} 识别结果
   */
  identifyAestheticEmotion(userInput) {
    const input = userInput.toLowerCase();
    
    const keywords = {
      AWE: ['敬畏', '宏大', '浩瀚', '星空', '宇宙', '壮观', '震撼', '渺小', '超越'],
      BEAUTY: ['美', '美丽', '优美', '和谐', '愉悦', '好看', '迷人', '陶醉'],
      INTEREST: ['有趣', '兴趣', '好奇', '想探索', '复杂', '神秘', '吸引人'],
      CURIOSITY: ['想知道', '为什么', '怎么回事', '谜底', '悬念', '缺口'],
      SURPRISE: ['惊讶', '意外', '没想到', '突然', '吃惊', '震惊'],
      SUBLIME: ['崇高', '压倒性', '恐惧又吸引', '暴风雨', '悬崖', '无限']
    };
    
    const scores = {};
    for (const [type, words] of Object.entries(keywords)) {
      scores[type] = words.reduce((count, word) => {
        return count + (input.includes(word) ? 1 : 0);
      }, 0);
    }
    
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return { detected: null, confidence: 0, scores };
    }
    
    const detectedTypes = Object.entries(scores)
      .filter(([_, score]) => score === maxScore)
      .map(([type]) => type);
    
    return {
      detected: detectedTypes[0],
      confidence: maxScore / 5, // 归一化到 0-1
      scores,
      emotionInfo: AestheticEmotionTypes[detectedTypes[0]]
    };
  }

  /**
   * 评估审美体验特征
   * @param {string} userInput - 用户描述
   * @returns {object} 评估结果
   */
  assessAestheticExperience(userInput) {
    const input = userInput.toLowerCase();
    
    const assessment = {
      psychicalDistance: this._assessPsychicalDistance(input),
      disinterestedness: this._assessDisinterestedness(input),
      attentionCapture: this._assessAttentionCapture(input),
      intensity: this._assessIntensity(input),
      valence: this._assessValence(input),
      approachMotivation: this._assessApproachMotivation(input)
    };
    
    return {
      overall: this._calculateOverallScore(assessment),
      dimensions: assessment,
      interpretation: this._interpretAssessment(assessment)
    };
  }

  _assessPsychicalDistance(input) {
    // 检测功利性语言
    const utilitarianWords = ['有用', '赚钱', '实用', '好处', '目的', '任务'];
    const aestheticWords = ['欣赏', '感受', '体验', '美', '享受'];
    
    const utilitarianCount = utilitarianWords.filter(w => input.includes(w)).length;
    const aestheticCount = aestheticWords.filter(w => input.includes(w)).length;
    
    return Math.max(0, Math.min(1, aestheticCount / (utilitarianCount + aestheticCount || 1)));
  }

  _assessDisinterestedness(input) {
    // 检测占有/使用意图
    const possessiveWords = ['想要', '拥有', '买', '占有', '使用'];
    const appreciativeWords = ['欣赏', '观看', '聆听', '感受', '品味'];
    
    const possessiveCount = possessiveWords.filter(w => input.includes(w)).length;
    const appreciativeCount = appreciativeWords.filter(w => input.includes(w)).length;
    
    return Math.max(0, Math.min(1, appreciativeCount / (possessiveCount + appreciativeCount || 1)));
  }

  _assessAttentionCapture(input) {
    const attentionWords = ['专注', '入迷', '忘记时间', '沉浸', '吸引', '无法移开'];
    const count = attentionWords.filter(w => input.includes(w)).length;
    return Math.min(1, count / 3);
  }

  _assessIntensity(input) {
    const intensityWords = ['非常', '极其', '特别', '太', '超级', '震撼', '强烈'];
    const count = intensityWords.filter(w => input.includes(w)).length;
    return Math.min(5, count);
  }

  _assessValence(input) {
    const positiveWords = ['愉悦', '开心', '美好', '喜欢', '享受', '幸福'];
    const negativeWords = ['害怕', '恐惧', '不安', '讨厌', '难受'];
    
    const positiveCount = positiveWords.filter(w => input.includes(w)).length;
    const negativeCount = negativeWords.filter(w => input.includes(w)).length;
    
    if (positiveCount > negativeCount) return 1 + Math.min(1, (positiveCount - negativeCount) / 2);
    if (negativeCount > positiveCount) return -1 - Math.min(1, (negativeCount - positiveCount) / 2);
    return 0;
  }

  _assessApproachMotivation(input) {
    const approachWords = ['想再看', '想继续', '想重复', '想分享', '想记住', '想创造'];
    const count = approachWords.filter(w => input.includes(w)).length;
    return Math.min(1, count / 2);
  }

  _calculateOverallScore(assessment) {
    const weights = {
      psychicalDistance: 0.15,
      disinterestedness: 0.15,
      attentionCapture: 0.2,
      intensity: 0.2,
      valence: 0.15,
      approachMotivation: 0.15
    };
    
    let score = 0;
    for (const [dim, value] of Object.entries(assessment)) {
      // 归一化到 0-1
      let normalized = value;
      if (dim === 'intensity') normalized = value / 5;
      if (dim === 'valence') normalized = (value + 2) / 4;
      
      score += normalized * weights[dim];
    }
    
    return Math.round(score * 100) / 100;
  }

  _interpretAssessment(assessment) {
    const interpretations = [];
    
    if (assessment.psychicalDistance > 0.7) {
      interpretations.push('你能够以非功利的态度欣赏体验，这是审美情绪的关键特征。');
    }
    if (assessment.attentionCapture > 0.7) {
      interpretations.push('你的注意力被体验完全吸引，进入了心流状态。');
    }
    if (assessment.intensity >= 4) {
      interpretations.push('这是一个非常强烈的审美体验。');
    }
    if (assessment.valence > 1) {
      interpretations.push('体验带来明显的愉悦感。');
    }
    if (assessment.approachMotivation > 0.7) {
      interpretations.push('你有强烈的动机去维持或重复这个体验。');
    }
    
    return interpretations;
  }

  /**
   * 生成美感干预练习
   * @param {string} type - 练习类型
   * @returns {object} 练习详情
   */
  generateAestheticIntervention(type = 'beauty') {
    const interventions = {
      beauty: {
        name: '美感沉浸练习',
        duration: '10-15 分钟',
        steps: [
          {
            step: 1,
            instruction: '选择一个美的对象',
            details: '可以是一幅画、一段音乐、一处风景、一朵花，或一段美好的回忆',
            time: '2 分钟'
          },
          {
            step: 2,
            instruction: '放下功利心态',
            details: '告诉自己：我不需要占有它、使用它或评价它，我只是纯粹地欣赏',
            time: '1 分钟'
          },
          {
            step: 3,
            instruction: '全神贯注地体验',
            details: '调动所有感官：看、听、触、嗅。注意细节、颜色、形状、质感',
            time: '5-7 分钟'
          },
          {
            step: 4,
            instruction: '记录身体感受',
            details: '注意身体的反应：胸口是否温暖？是否微笑？呼吸是否变慢？',
            time: '2 分钟'
          },
          {
            step: 5,
            instruction: '表达感谢',
            details: '在心中感谢这个美的存在，感谢自己能够欣赏它',
            time: '1 分钟'
          }
        ],
        benefits: ['提升幸福感', '降低压力', '培养欣赏能力', '增强当下觉察'],
        science: '研究表明，定期美感体验可以显著提升主观幸福感和生活满意度 (Berkeley GGSC, 2023)'
      },
      
      interest: {
        name: '兴趣 - 好奇循环培养',
        duration: '15-20 分钟',
        steps: [
          {
            step: 1,
            instruction: '选择一个复杂主题',
            details: '选一个你感兴趣但不完全理解的领域：艺术流派、科学理论、历史事件等',
            time: '2 分钟'
          },
          {
            step: 2,
            instruction: '识别知识缺口',
            details: '写下 3-5 个你想知道的问题。问题应该具体但有探索空间',
            time: '5 分钟'
          },
          {
            step: 3,
            instruction: '探索一个缺口',
            details: '选择一个问题，开始探索：阅读、观察、思考。享受探索过程本身',
            time: '10 分钟'
          },
          {
            step: 4,
            instruction: '反思探索体验',
            details: '探索过程中你感到什么？好奇的张力？理解的喜悦？还想探索什么？',
            time: '3 分钟'
          }
        ],
        benefits: ['增强学习动机', '培养成长心态', '提升认知灵活性', '增加知识深度'],
        science: 'Silvia (2008) 发现，兴趣和好奇是知识情绪的核心，驱动深度学习和创造力'
      },
      
      sublime: {
        name: '崇高体验引导',
        duration: '15-20 分钟',
        steps: [
          {
            step: 1,
            instruction: '准备安全环境',
            details: '崇高体验涉及恐惧元素，确保你在安全的环境中 (室内、虚拟体验等)',
            time: '1 分钟'
          },
          {
            step: 2,
            instruction: '选择崇高对象',
            details: '可以选择：暴风雨视频、悬崖照片、宇宙纪录片、宏大的音乐',
            time: '2 分钟'
          },
          {
            step: 3,
            instruction: '体验恐惧与吸引的张力',
            details: '允许自己感受对象的压倒性力量，同时保持安全距离的欣赏',
            time: '8-10 分钟'
          },
          {
            step: 4,
            instruction: '反思超越感',
            details: '这种体验让你对自己的位置有什么新的理解？什么是超越感官的？',
            time: '5 分钟'
          }
        ],
        benefits: ['培养谦逊', '拓展视野', '增强自我反思', '体验超越性'],
        science: '康德认为崇高体验展示了理性超越感官的能力，是道德感的类比'
      },
      
      daily_aesthetic: {
        name: '日常审美觉察',
        duration: '每天 5 分钟',
        steps: [
          {
            step: 1,
            instruction: '晨间美感设定',
            details: '早上告诉自己：今天我会留意身边的美',
            time: '30 秒'
          },
          {
            step: 2,
            instruction: '三次审美停顿',
            details: '一天中三次停下，注意周围的美：光线、颜色、声音、质感',
            time: '每次 1 分钟'
          },
          {
            step: 3,
            instruction: '晚间审美日记',
            details: '记录今天注意到的 3 个美的瞬间，无论多微小',
            time: '3 分钟'
          }
        ],
        benefits: ['培养审美敏感度', '提升日常幸福感', '增强正念觉察'],
        science: '研究表明，每天记录三件美好事情可以显著提升幸福感 (Seligman et al., 2005)'
      }
    };
    
    return interventions[type] || interventions.beauty;
  }

  /**
   * 生成审美情绪整合建议
   * @param {object} assessment - 评估结果
   * @returns {object} 整合建议
   */
  generateIntegrationSuggestions(assessment) {
    const suggestions = [];
    
    if (assessment.overall < 0.5) {
      suggestions.push({
        type: 'awareness',
        title: '培养审美觉察',
        content: '你的审美体验特征较弱。建议从日常审美觉察练习开始，每天留意身边的美。',
        practice: 'daily_aesthetic'
      });
    }
    
    if (assessment.dimensions.psychicalDistance < 0.5) {
      suggestions.push({
        type: 'distance',
        title: '练习心理距离',
        content: '你可能过于关注事物的实用价值。尝试纯粹为了体验而体验，放下功利目的。',
        practice: 'beauty'
      });
    }
    
    if (assessment.dimensions.attentionCapture < 0.5) {
      suggestions.push({
        type: 'attention',
        title: '培养专注力',
        content: '你的注意力可能容易分散。尝试正念练习，提升专注和沉浸能力。',
        practice: 'beauty'
      });
    }
    
    if (assessment.dimensions.valence < 0) {
      suggestions.push({
        type: 'valence',
        title: '探索审美情绪的复杂性',
        content: '你可能体验到消极的审美情绪 (如崇高中的恐惧)。这是正常的，尝试在安全环境中探索。',
        practice: 'sublime'
      });
    }
    
    return suggestions;
  }

  /**
   * 与敬畏心理学模块集成
   * @returns {object} 集成接口
   */
  getAweIntegration() {
    return {
      sharedFeatures: ['自我缩小', '时间扩展', '需要顺应', '超越体验'],
      differentiation: {
        awe: '由宏大/超越理解触发，强调顺应需求',
        beauty: '由和谐/美触发，强调愉悦欣赏',
        sublime: '由危险 + 吸引触发，强调恐惧与愉悦的混合'
      },
      combinedPractice: {
        name: '敬畏 - 美感整合练习',
        duration: '20 分钟',
        steps: [
          '选择一个既美又宏大的对象 (如星空、大峡谷、交响乐)',
          '先以美感态度欣赏：注意和谐、颜色、质感 (5 分钟)',
          '然后转向敬畏态度：感受宏大、自我缩小、需要顺应 (5 分钟)',
          '整合两种体验：美中有敬畏，敬畏中有美 (5 分钟)',
          '反思：这两种体验如何相互增强？(5 分钟)'
        ]
      }
    };
  }

  /**
   * 处理用户输入，提供审美情绪支持
   * @param {string} userInput - 用户输入
   * @returns {object} 响应
   */
  processInput(userInput) {
    const emotionId = this.identifyAestheticEmotion(userInput);
    const assessment = this.assessAestheticExperience(userInput);
    const suggestions = this.generateIntegrationSuggestions(assessment);
    
    return {
      detectedEmotion: emotionId,
      assessment,
      suggestions,
      intervention: this.generateAestheticIntervention(
        emotionId.detected ? emotionId.detected.toLowerCase() : 'beauty'
      ),
      aweIntegration: this.getAweIntegration()
    };
  }
}

// ============ 模块导出 ============

module.exports = {
  AestheticEmotionsModule,
  AestheticEmotionTypes,
  AestheticFeatures,
  AestheticEmotionAssessment
};
