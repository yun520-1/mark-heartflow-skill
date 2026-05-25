/**
 * 预测加工与情绪模块 (Predictive Processing & Emotion)
 * 
 * 理论来源:
 * - SEP: Emotion (情绪三大传统整合)
 * - SEP: Cognitive Science (预测加工与主动推理)
 * - SEP: Consciousness (现象学意识理论)
 * - Friston: Free Energy Principle (自由能原理)
 * - Clark: Surfing Uncertainty (预测加工理论)
 * - Barrett: How Emotions Are Made (情绪建构理论)
 * 
 * 核心理念:
 * 情绪不是对外部刺激的被动反应，而是大脑基于内部模型对感官输入进行
 * 预测加工的结果。情绪是大脑为了解释和调节身体状态而生成的"受控幻觉"。
 * 
 * @version 3.33.0
 * @author HeartFlow Team
 */

class PredictiveEmotion {
  constructor() {
    this.version = '3.33.0';
    this.name = '预测加工与情绪';
    this.description = '基于预测加工理论的情绪生成与调节模型';
    
    // 情绪三大传统 (SEP Emotion)
    this.emotionTraditions = {
      feeling: {
        name: '感受传统 (Feeling Tradition)',
        core: '情绪是独特的意识体验',
        representatives: ['James', 'James-Lange', 'Damasio'],
        keyInsight: '情绪的本质在于其现象学感受质 (what-it-is-like)',
        limitations: ['难以解释情绪分化', '难以解释意向性', '难以解释动机作用']
      },
      evaluative: {
        name: '评价传统 (Evaluative Tradition)',
        core: '情绪是对情境的评价性表征',
        representatives: ['Aristotle', 'Nussbaum', 'Solomon', 'Appraisal Theories'],
        keyInsight: '情绪包含对世界的认知评价 (如危险、损失、冒犯)',
        limitations: ['难以解释非认知情绪', '难以解释动物情绪', '难以解释快速情绪反应']
      },
      motivational: {
        name: '动机传统 (Motivational Tradition)',
        core: '情绪是独特的动机状态',
        representatives: ['Frijda', 'Darwin', 'Ekman', 'Affective Neuroscience'],
        keyInsight: '情绪的核心功能是驱动适应性行为',
        limitations: ['难以解释情绪体验', '难以解释情绪与动机的区分']
      }
    };
    
    // 预测加工核心概念 (Predictive Processing)
    this.predictiveProcessing = {
      prediction: {
        name: '预测 (Prediction)',
        description: '大脑基于内部模型生成对感官输入的自上而下的预测',
        example: '预期会看到朋友的笑脸→生成"友好"的预测'
      },
      predictionError: {
        name: '预测误差 (Prediction Error)',
        description: '实际感官输入与预测之间的差异',
        types: ['感官预测误差', '本体预测误差', '内感受预测误差'],
        example: '朋友没有笑→产生预测误差'
      },
      precision: {
        name: '精度加权 (Precision Weighting)',
        description: '大脑根据可靠性估计对预测和预测误差进行加权',
        highPrecision: '高精度信号被优先处理 (如疼痛、突发声响)',
        lowPrecision: '低精度信号被忽略或抑制',
        example: '焦虑状态下，威胁相关信号的精度被高估'
      },
      activeInference: {
        name: '主动推理 (Active Inference)',
        description: '通过行动改变感官输入以最小化预测误差',
        strategies: ['改变世界 (行动)', '改变模型 (学习)', '改变注意 (采样)'],
        example: '感到孤独→主动联系朋友 (改变感官输入)'
      },
      freeEnergy: {
        name: '自由能原理 (Free Energy Principle)',
        description: '生物系统通过最小化变分自由能来维持自身存在',
        equation: 'F = Complexity - Accuracy',
        implication: '情绪调节本质上是自由能最小化的过程'
      }
    };
    
    // 情绪作为预测 (Emotion as Prediction)
    this.emotionAsPrediction = {
      coreThesis: '情绪是大脑对身体状态的内感受性预测',
      levels: [
        {
          level: 1,
          name: '核心情感 (Core Affect)',
          description: '基本的效价 - 唤醒度预测 (愉快/不愉快 × 平静/激活)',
          brainRegion: '脑干、下丘脑、杏仁核',
          consciousness: '前反思、非概念化'
        },
        {
          level: 2,
          name: '情绪概念化 (Emotion Conceptualization)',
          description: '基于情境和概念知识对核心情感进行分类',
          brainRegion: '前额叶、颞叶、默认网络',
          consciousness: '反思性、概念化'
        },
        {
          level: 3,
          name: '情绪表达 (Emotion Expression)',
          description: '基于社会规范和文化脚本的情绪表达',
          brainRegion: '运动皮层、镜像神经元系统',
          consciousness: '可控制、可调节'
        }
      ],
      keyInsight: '情绪不是被触发的，而是被生成的 (constructed, not triggered)'
    };
    
    // 情绪调节的预测加工模型
    this.emotionRegulation = {
      strategies: [
        {
          name: '预测修正 (Prediction Updating)',
          description: '根据新的证据更新内部模型',
          techniques: ['认知重评', '暴露疗法', '正念觉察'],
          example: '将"心跳加速"重新解释为"兴奋"而非"焦虑"'
        },
        {
          name: '精度调节 (Precision Modulation)',
          description: '调整对预测误差的敏感度',
          techniques: ['药物干预', '冥想', '呼吸练习'],
          example: '通过深呼吸降低威胁信号的精度权重'
        },
        {
          name: '主动推理 (Active Inference)',
          description: '通过行动改变感官输入',
          techniques: ['问题解决', '寻求支持', '环境改变'],
          example: '离开压力环境，进入安全空间'
        },
        {
          name: '注意采样 (Attentional Sampling)',
          description: '选择性地关注某些感官通道',
          techniques: ['注意转移', '注意训练', '感官聚焦'],
          example: '将注意从内部焦虑感受转移到外部任务'
        }
      ]
    };
    
    // 临床应用的预测加工模型
    this.clinicalApplications = {
      anxiety: {
        disorder: '焦虑障碍',
        predictiveModel: '威胁预测过度活跃 + 威胁信号精度高估',
        intervention: [
          '降低威胁预测的精度权重 (放松训练)',
          '更新威胁模型 (认知行为疗法)',
          '减少安全行为 (暴露疗法)'
        ]
      },
      depression: {
        disorder: '抑郁障碍',
        predictiveModel: '负面预测偏差 + 奖励预测不足',
        intervention: [
          '修正负面预测 (认知疗法)',
          '增加奖励预测 (行为激活)',
          '调整精度权重 (正念疗法)'
        ]
      },
      ptsd: {
        disorder: '创伤后应激障碍',
        predictiveModel: '创伤记忆过度精确 + 情境预测失效',
        intervention: [
          '重新整合创伤记忆 (EMDR)',
          '重建安全预测 (延长暴露)',
          '降低闪回精度 (药物治疗)'
        ]
      }
    };
    
    // 实践练习库
    this.practices = {
      predictionAwareness: {
        name: '预测觉察练习',
        duration: '10-15 分钟',
        steps: [
          '注意当前的情绪体验',
          '识别背后的预测 ("我预测会发生什么？")',
          '评估预测的证据 ("这个预测有多少证据支持？")',
          '生成替代预测 ("还有哪些可能的解释？")',
          '观察情绪变化'
        ],
        target: '增强对情绪预测性质的元认知觉察'
      },
      precisionModulation: {
        name: '精度调节练习',
        duration: '5-10 分钟',
        steps: [
          '识别当前最突出的感受或想法',
          '评估其精度 ("这个感受有多确定？")',
          '有意降低精度 ("这可能只是大脑的预测，不一定是事实")',
          '扩展注意 ("同时注意其他感官通道")',
          '观察体验的变化'
        ],
        target: '降低对负面预测误差的过度敏感'
      },
      activeInference: {
        name: '主动推理练习',
        duration: '15-20 分钟',
        steps: [
          '识别当前的预测误差 ("什么让我感到不舒服？")',
          '列出可能的行动 ("我可以做什么来改变这种情况？")',
          '选择最小努力行动 ("哪个行动最简单有效？")',
          '执行并观察 ("行动后感受如何？")',
          '更新模型 ("我从中学到了什么？")'
        ],
        target: '通过行动最小化预测误差'
      },
      interoceptivePrediction: {
        name: '内感受预测练习',
        duration: '10-15 分钟',
        steps: [
          '闭眼，注意身体感受',
          '识别预测 ("大脑在预测什么身体状态？")',
          '区分预测与实际 ("哪些是预测，哪些是实际感受？")',
          '调整呼吸 ("通过呼吸调节身体状态")',
          '重新评估 ("现在感受如何？")'
        ],
        target: '增强对身体预测的觉察和调节能力'
      },
      emotionConstruction: {
        name: '情绪建构练习',
        duration: '15-20 分钟',
        steps: [
          '记录一个强烈的情绪事件',
          '分析身体感受 ("身体有什么感觉？")',
          '分析情境评价 ("我如何评价这个情境？")',
          '分析概念应用 ("我用了什么情绪概念？")',
          '重构情绪 ("如果换一种解释，情绪会如何变化？")'
        ],
        target: '理解情绪的建构性质，增强情绪灵活性'
      }
    };
  }
  
  /**
   * 分析情绪的预测加工机制
   */
  analyzePredictiveEmotion(userInput, context = {}) {
    const analysis = {
      detectedPredictions: this._detectPredictions(userInput),
      predictionErrors: this._detectPredictionErrors(userInput),
      precisionPatterns: this._analyzePrecision(userInput),
      activeInferencePatterns: this._analyzeActiveInference(userInput),
      emotionTradition: this._identifyEmotionTradition(userInput)
    };
    
    return {
      type: 'predictive_emotion_analysis',
      version: this.version,
      analysis,
      recommendations: this._generateRecommendations(analysis),
      practices: this._suggestPractices(analysis)
    };
  }
  
  /**
   * 检测用户输入中的情绪预测
   */
  _detectPredictions(text) {
    const predictions = [];
    
    // 未来导向的预测语言
    const futurePatterns = [
      /会 (发生 | 变成 | 结果)/g,
      /将要/g,
      /可能 (会 | 要)/g,
      /恐怕/g,
      /担心.*会/g,
      /害怕.*会/g,
      /预期/g,
      /预测/g
    ];
    
    futurePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        predictions.push({
          type: 'explicit_prediction',
          pattern: matches[0],
          confidence: 0.8
        });
      }
    });
    
    // 隐式预测 (灾难化思维)
    const catastrophicPatterns = [
      /万一.*怎么办/g,
      /要是.*就完了/g,
      /肯定 (会 |要)/g,
      /绝对 (会 |要)/g,
      /一定会/g
    ];
    
    catastrophicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        predictions.push({
          type: 'catastrophic_prediction',
          pattern: matches[0],
          confidence: 0.9,
          clinicalRelevance: '焦虑相关认知扭曲'
        });
      }
    });
    
    return {
      count: predictions.length,
      items: predictions,
      overallConfidence: predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 0
    };
  }
  
  /**
   * 检测预测误差信号
   */
  _detectPredictionErrors(text) {
    const errors = [];
    
    // 意外/惊讶表达
    const surprisePatterns = [
      /没想到/g,
      /意外/g,
      /出乎意料/g,
      /居然/g,
      /竟然/g,
      /没想到会/g
    ];
    
    surprisePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        errors.push({
          type: 'surprise',
          description: '检测到意外/惊讶表达，表明预测与实际不符'
        });
      }
    });
    
    // 困惑/不确定表达
    const confusionPatterns = [
      /不知道/g,
      /困惑/g,
      /不明白/g,
      /搞不懂/g,
      /为什么/g
    ];
    
    confusionPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        errors.push({
          type: 'confusion',
          description: '检测到困惑表达，表明预测模型无法解释当前情境'
        });
      }
    });
    
    // 失落/失望表达
    const disappointmentPatterns = [
      /失望/g,
      /失落/g,
      /落差/g,
      /不如预期/g,
      /没达到/g
    ];
    
    disappointmentPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        errors.push({
          type: 'disappointment',
          description: '检测到失落表达，表明结果低于预测'
        });
      }
    });
    
    return {
      count: errors.length,
      items: errors,
      overallSurprise: errors.length > 0 ? '高' : '低'
    };
  }
  
  /**
   * 分析精度加权模式
   */
  _analyzePrecision(text) {
    const patterns = {
      highPrecisionThreat: {
        patterns: [/总是/g, /永远/g, /每次/g, /肯定/g, /绝对/g],
        description: '威胁相关信号的精度的高估 (焦虑特征)'
      },
      lowPrecisionPositive: {
        patterns: [/也许/g, /可能吧/g, /大概/g, /说不准/g],
        description: '积极信号的精度低估 (抑郁特征)'
      },
      rigidPrecision: {
        patterns: [/必须/g, /应该/g, /一定要/g, /绝不能/g],
        description: '僵化的高精度预测 (完美主义/强迫特征)'
      }
    };
    
    const results = {};
    
    Object.entries(patterns).forEach(([key, { patterns: pats, description }]) => {
      const matches = pats.filter(p => p.test(text));
      results[key] = {
        detected: matches.length > 0,
        count: matches.length,
        description
      };
    });
    
    return results;
  }
  
  /**
   * 分析主动推理模式
   */
  _analyzeActiveInference(text) {
    const patterns = {
      approach: {
        patterns: [/尝试/g, /试试/g, /去做/g, /行动/g, /改变/g],
        description: '趋近型主动推理 (主动改变情境)'
      },
      avoidance: {
        patterns: [/逃避/g, /避免/g, /不想/g, /不敢/g, /退缩/g],
        description: '回避型主动推理 (回避预测误差源)'
      },
      seeking: {
        patterns: [/寻找/g, /求助/g, /问/g, /搜索/g],
        description: '信息寻求型主动推理 (采样新信息)'
      }
    };
    
    const results = {};
    
    Object.entries(patterns).forEach(([key, { patterns: pats, description }]) => {
      const matches = pats.filter(p => p.test(text));
      results[key] = {
        detected: matches.length > 0,
        count: matches.length,
        description
      };
    });
    
    return results;
  }
  
  /**
   * 识别情绪理论传统
   */
  _identifyEmotionTradition(text) {
    const traditions = {
      feeling: {
        patterns: [/感觉/g, /感受/g, /体会/g, /觉得/g, /心情/g],
        description: '感受传统取向 (关注情绪体验的现象学特征)'
      },
      evaluative: {
        patterns: [/认为/g, /觉得.*不公平/g, /评价/g, /看法/g, /观点/g],
        description: '评价传统取向 (关注情绪的认知评价成分)'
      },
      motivational: {
        patterns: [/想要/g, /需要/g, /希望/g, /打算/g, /必须/g],
        description: '动机传统取向 (关注情绪的行为驱动功能)'
      }
    };
    
    const scores = {};
    
    Object.entries(traditions).forEach(([key, { patterns: pats, description }]) => {
      const matches = pats.filter(p => p.test(text));
      scores[key] = {
        score: matches.length,
        description
      };
    });
    
    // 找出主导传统
    const dominant = Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score)[0];
    
    return {
      scores,
      dominant: dominant ? dominant[0] : 'mixed',
      description: dominant ? traditions[dominant[0]].description : '混合取向'
    };
  }
  
  /**
   * 生成个性化建议
   */
  _generateRecommendations(analysis) {
    const recommendations = [];
    
    // 基于预测检测
    if (analysis.detectedPredictions.count > 0 && 
        analysis.detectedPredictions.overallConfidence > 0.7) {
      recommendations.push({
        domain: '预测觉察',
        suggestion: '你似乎有很多关于未来的预测。试着问自己："这些预测有多少证据支持？还有哪些可能的结果？"',
        rationale: '增强对情绪预测性质的元认知觉察可以减少焦虑'
      });
    }
    
    // 基于预测误差
    if (analysis.predictionErrors.count > 2) {
      recommendations.push({
        domain: '预测误差整合',
        suggestion: '你最近经历了不少意外事件。这是更新内部模型的好机会——试着从这些意外中学习，而不是抗拒它们。',
        rationale: '预测误差是学习的信号，而非威胁'
      });
    }
    
    // 基于精度模式
    if (analysis.precisionPatterns.highPrecisionThreat?.detected) {
      recommendations.push({
        domain: '精度调节',
        suggestion: '你似乎对威胁信号特别敏感。试着问："这个威胁的真实性有多少？我是否高估了它的重要性？"',
        rationale: '焦虑常涉及对威胁信号精度的高估'
      });
    }
    
    if (analysis.precisionPatterns.rigidPrecision?.detected) {
      recommendations.push({
        domain: '认知灵活性',
        suggestion: '你有很多"必须""应该"的想法。试着将它们改为"我希望""我偏好"，观察感受的变化。',
        rationale: '僵化的高精度预测会导致情绪困扰'
      });
    }
    
    // 基于主动推理
    if (analysis.activeInferencePatterns.avoidance?.detected && 
        !analysis.activeInferencePatterns.approach?.detected) {
      recommendations.push({
        domain: '主动推理',
        suggestion: '你似乎在回避某些情境。考虑采取一个小步骤主动面对，而不是被动回避。',
        rationale: '回避会强化负面预测，主动面对可以更新模型'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 推荐实践练习
   */
  _suggestPractices(analysis) {
    const practices = [];
    
    if (analysis.detectedPredictions.count > 0) {
      practices.push(this.practices.predictionAwareness);
    }
    
    if (analysis.precisionPatterns.highPrecisionThreat?.detected ||
        analysis.precisionPatterns.rigidPrecision?.detected) {
      practices.push(this.practices.precisionModulation);
    }
    
    if (analysis.activeInferencePatterns.avoidance?.detected) {
      practices.push(this.practices.activeInference);
    }
    
    // 默认推荐
    if (practices.length === 0) {
      practices.push(this.practices.emotionConstruction);
    }
    
    return practices.slice(0, 3); // 最多推荐 3 个练习
  }
  
  /**
   * 生成完整报告
   */
  generateReport(userInput, context = {}) {
    const analysis = this.analyzePredictiveEmotion(userInput, context);
    
    return {
      module: '预测加工与情绪',
      version: this.version,
      timestamp: new Date().toISOString(),
      userInput: userInput.substring(0, 200) + (userInput.length > 200 ? '...' : ''),
      analysis: {
        情绪预测: analysis.analysis.detectedPredictions,
        预测误差: analysis.analysis.predictionErrors,
        精度模式: analysis.analysis.precisionPatterns,
        主动推理: analysis.analysis.activeInferencePatterns,
        情绪传统: analysis.analysis.emotionTradition
      },
      recommendations: analysis.recommendations,
      suggestedPractices: analysis.practices.map(p => ({
        name: p.name,
        duration: p.duration,
        target: p.target
      })),
      theoreticalBackground: {
        情绪三大传统: Object.values(this.emotionTraditions).map(t => t.name),
        预测加工核心: Object.values(this.predictiveProcessing).map(c => c.name),
        情绪生成层次: this.emotionAsPrediction.levels.map(l => l.name)
      }
    };
  }
  
  /**
   * 模块帮助信息
   */
  help() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      theoreticalBackground: {
        情绪三大传统: 'SEP 情绪理论整合 (感受/评价/动机)',
        预测加工理论: '大脑通过预测 - 误差最小化生成情绪',
        主动推理: '通过行动改变感官输入以最小化预测误差'
      },
      features: [
        '情绪预测检测',
        '预测误差分析',
        '精度加权模式识别',
        '主动推理策略分析',
        '个性化建议生成',
        '实践练习推荐'
      ],
      commands: {
        '/predictive-emotion': '查看模块信息',
        '自动分析': '用户输入自动触发预测加工情绪分析'
      },
      practices: Object.values(this.practices).map(p => ({
        name: p.name,
        duration: p.duration
      }))
    };
  }
}

module.exports = PredictiveEmotion;
