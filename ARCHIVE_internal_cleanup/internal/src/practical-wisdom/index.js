/**
 * 实践智慧模块 (Practical Wisdom / Phronesis)
 * 
 * 理论来源:
 * - 亚里士多德《尼各马可伦理学》- 实践智慧 (phronesis) 理论
 * - SEP: Wisdom (智慧理论)
 * - SEP: Aristotle's Ethics (亚里士多德伦理学)
 * - SEP: Virtue Ethics (美德伦理学)
 * 
 * 核心概念:
 * 1. 实践智慧 (Phronesis) - 在具体情境中做出正确判断的能力
 * 2. 中道 (Golden Mean) - 在过度与不足之间找到平衡点
 * 3. 德性伦理学 - 关注"成为什么样的人"而非"做什么"
 * 4. 习惯养成 - 通过重复实践培养德性
 * 5. 反思平衡 - 在具体判断与一般原则之间寻求平衡
 * 
 * @version 3.31.0
 */

class PracticalWisdom {
  constructor() {
    this.name = '实践智慧模块';
    this.version = '3.31.0';
    
    // 核心德性列表 (亚里士多德)
    this.cardinalVirtues = {
      courage: {
        name: '勇气',
        deficiency: '懦弱',
        excess: '鲁莽',
        mean: '勇气 - 在恐惧与自信之间找到平衡',
        description: '面对危险和困难时，既不过度恐惧也不盲目自信'
      },
      temperance: {
        name: '节制',
        deficiency: '放纵',
        excess: '禁欲',
        mean: '节制 - 在欲望与克制之间找到平衡',
        description: '对快乐和欲望的适度控制'
      },
      generosity: {
        name: '慷慨',
        deficiency: '吝啬',
        excess: '挥霍',
        mean: '慷慨 - 在给予与保留之间找到平衡',
        description: '在财富和资源使用上的适度'
      },
      magnificence: {
        name: '大方',
        deficiency: '小气',
        excess: '浮夸',
        mean: '大方 - 在大额支出上的适度',
        description: '在重大事务上的适度花费'
      },
      magnanimity: {
        name: '大度',
        deficiency: '自卑',
        excess: '傲慢',
        mean: '大度 - 在荣誉追求上的平衡',
        description: '对自己价值的恰当认知'
      },
      patience: {
        name: '耐心',
        deficiency: '急躁',
        excess: '麻木',
        mean: '耐心 - 在愤怒反应上的平衡',
        description: '面对挫折和不公时的情绪调节'
      },
      truthfulness: {
        name: '诚实',
        deficiency: '自贬',
        excess: '自夸',
        mean: '诚实 - 在自我表达上的真实',
        description: '关于自己的真实陈述'
      },
      wit: {
        name: '机智',
        deficiency: '呆板',
        excess: '滑稽',
        mean: '机智 - 在社交娱乐上的适度',
        description: '社交场合中的恰当幽默'
      },
      friendliness: {
        name: '友善',
        deficiency: '冷漠',
        excess: '谄媚',
        mean: '友善 - 在社交互动上的适度',
        description: '与他人交往时的恰当态度'
      },
      justice: {
        name: '公正',
        deficiency: '不公',
        excess: '过度公平',
        mean: '公正 - 在资源分配上的平衡',
        description: '给予每个人应得的东西'
      }
    };

    // 智慧理论的五大视角 (SEP)
    this.wisdomPerspectives = {
      epistemicHumility: {
        name: '认知谦逊',
        description: '承认自己的认知局限，不声称知道不知道的事情',
        indicators: [
          '愿意承认"我不知道"',
          '对自己的判断保持适度怀疑',
          '开放接受新证据和反驳',
          '不夸大自己的专业知识'
        ]
      },
      epistemicAccuracy: {
        name: '认知准确性',
        description: '对自己的知识状态有准确的元认知',
        indicators: [
          '清楚区分知道与不知道',
          '信念与证据强度相匹配',
          '能准确评估自己的认知能力',
          '在不确定时表达适当的不确定性'
        ]
      },
      knowledgeBased: {
        name: '知识基础',
        description: '拥有广泛且深刻的知识，特别是关于"什么是重要的"',
        indicators: [
          '跨领域的知识广度',
          '对核心问题的深刻理解',
          '知道什么值得追求',
          '理解事物之间的深层联系'
        ]
      },
      hybridTheory: {
        name: '混合理论',
        description: '智慧是知识、认知谦逊和实践能力的综合',
        indicators: [
          '既有知识又知道其局限',
          '能将知识应用于实际情境',
          '在复杂情况下做出平衡判断',
          '持续学习和自我修正'
        ]
      },
      rationality: {
        name: '理性',
        description: '以理性方式形成信念和做出决策',
        indicators: [
          '基于证据形成信念',
          '逻辑一致的推理',
          '考虑长期后果',
          '避免认知偏差的影响'
        ]
      }
    };

    // 实践智慧的培养阶段
    this.developmentStages = {
      novice: {
        name: '初学者',
        description: '开始学习德性和实践智慧的原则',
        characteristics: [
          '依赖规则和他人指导',
          '对情境的复杂性认识不足',
          '容易走向极端',
          '需要外部反馈来调整'
        ],
        practices: ['学习基本原则', '观察榜样', '接受指导']
      },
      advancedBeginner: {
        name: '进阶初学者',
        description: '开始识别情境模式，但仍依赖规则',
        characteristics: [
          '能识别常见情境类型',
          '开始理解中道概念',
          '偶尔能独立判断',
          '仍需要反思和调整'
        ],
        practices: ['情境分析练习', '反思日记', '寻求反馈']
      },
      competent: {
        name: '胜任者',
        description: '能独立处理常见情境，有意识地应用原则',
        characteristics: [
          '能独立做出合理判断',
          '理解情境的细微差别',
          '有意识地平衡各种考虑',
          '能从错误中学习'
        ],
        practices: ['主动承担责任', '深度反思', '指导他人']
      },
      proficient: {
        name: '熟练者',
        description: '直觉性地识别情境，灵活应用原则',
        characteristics: [
          '直觉性地把握情境要点',
          '灵活调整策略',
          '能处理复杂和 novel 情境',
          '成为他人的参考点'
        ],
        practices: ['挑战复杂情境', '整合多领域知识', '创新应用']
      },
      expert: {
        name: '专家',
        description: '实践智慧成为第二本性，能创造性地应对新情境',
        characteristics: [
          '实践智慧内化为本能',
          '创造性地应对新挑战',
          '能教导和培养他人',
          '在不确定中保持稳健'
        ],
        practices: ['传承智慧', '开拓新领域', '持续精进']
      }
    };
  }

  /**
   * 分析用户在特定情境中的实践智慧表现
   */
  analyzeSituation(userInput, context = {}) {
    const analysis = {
      situation: userInput,
      virtues: [],
      wisdomPerspectives: [],
      goldenMeanAnalysis: null,
      developmentStage: null,
      recommendations: []
    };

    // 识别涉及的德性
    analysis.virtues = this._identifyRelevantVirtues(userInput);
    
    // 分析中道平衡
    analysis.goldenMeanAnalysis = this._analyzeGoldenMean(userInput, analysis.virtues);
    
    // 评估智慧视角
    analysis.wisdomPerspectives = this._assessWisdomPerspectives(userInput);
    
    // 判断发展阶段
    analysis.developmentStage = this._assessDevelopmentStage(userInput);
    
    // 生成建议
    analysis.recommendations = this._generateRecommendations(analysis);

    return analysis;
  }

  /**
   * 识别情境中相关的德性
   */
  _identifyRelevantVirtues(userInput) {
    const input = userInput.toLowerCase();
    const relevantVirtues = [];

    // 关键词映射
    const virtueKeywords = {
      courage: ['害怕', '恐惧', '危险', '困难', '挑战', '冒险', '勇敢'],
      temperance: ['欲望', '克制', '享受', '放纵', '节制', '上瘾'],
      generosity: ['给予', '分享', '金钱', '帮助', '捐赠', '吝啬'],
      patience: ['生气', '愤怒', '等待', '挫折', '耐心', '急躁'],
      truthfulness: ['诚实', '真实', '说谎', '夸大', '谦虚', '自夸'],
      justice: ['公平', '公正', '分配', '权利', '应得', '平等'],
      friendliness: ['社交', '朋友', '关系', '冷漠', '热情', '友善']
    };

    for (const [virtue, keywords] of Object.entries(virtueKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        relevantVirtues.push({
          virtue: this.cardinalVirtues[virtue],
          relevance: 'high',
          reason: `情境涉及${virtue}相关的主题`
        });
      }
    }

    return relevantVirtues;
  }

  /**
   * 分析中道平衡
   */
  _analyzeGoldenMean(userInput, virtues) {
    if (virtues.length === 0) {
      return { message: '未识别到明确的德性冲突' };
    }

    const analysis = virtues.map(v => ({
      virtue: v.virtue.name,
      currentTendency: this._detectTendency(userInput, v.virtue),
      mean: v.virtue.mean,
      deficiency: v.virtue.deficiency,
      excess: v.virtue.excess,
      balanceAdvice: this._getBalanceAdvice(v.virtue, userInput)
    }));

    return {
      summary: `识别到${virtues.length}个相关德性的平衡问题`,
      details: analysis
    };
  }

  /**
   * 检测用户倾向 (不足/过度/平衡)
   */
  _detectTendency(userInput, virtue) {
    const input = userInput.toLowerCase();
    
    // 检测不足倾向的关键词
    const deficiencyKeywords = {
      courage: ['不敢', '害怕', '逃避', '退缩'],
      temperance: ['控制不住', '放纵', '沉迷'],
      generosity: ['舍不得', '小气', '不愿给'],
      patience: ['忍不住', '发火', '急躁'],
      truthfulness: ['贬低自己', '不敢说'],
      justice: ['不公平', '偏袒'],
      friendliness: ['不想理人', '冷漠', '回避']
    };

    // 检测过度倾向的关键词
    const excessKeywords = {
      courage: ['不管了', '拼了', '冒险', '冲动'],
      temperance: ['完全禁止', '一点都不能', '极端'],
      generosity: ['全给了', '不顾自己', '过度'],
      patience: ['无所谓', '不反抗', '忍气吞声'],
      truthfulness: ['炫耀', '吹牛', '夸大'],
      justice: ['绝对公平', '死板'],
      friendliness: ['讨好', '迎合', '过度热情']
    };

    const virtueKey = Object.keys(this.cardinalVirtues).find(
      k => this.cardinalVirtues[k].name === virtue.name
    );

    if (!virtueKey) return 'unknown';

    const hasDeficiency = deficiencyKeywords[virtueKey]?.some(k => input.includes(k));
    const hasExcess = excessKeywords[virtueKey]?.some(k => input.includes(k));

    if (hasDeficiency && hasExcess) return 'conflicted';
    if (hasDeficiency) return 'deficiency';
    if (hasExcess) return 'excess';
    return 'balanced';
  }

  /**
   * 获取平衡建议
   */
  _getBalanceAdvice(virtue, userInput) {
    const tendency = this._detectTendency(userInput, virtue);
    
    switch (tendency) {
      case 'deficiency':
        return `你目前倾向于${virtue.deficiency}。尝试向中道靠近：${virtue.mean}。可以从小步骤开始练习，逐渐增加挑战。`;
      case 'excess':
        return `你目前倾向于${virtue.excess}。尝试向中道靠近：${virtue.mean}。注意适度，避免走向另一个极端。`;
      case 'balanced':
        return `你在${virtue.name}方面表现出良好的平衡。继续保持这种觉察，并在不同情境中灵活应用。`;
      default:
        return `在${virtue.name}方面，目标是找到中道：${virtue.mean}。反思你当前的倾向，并考虑如何调整。`;
    }
  }

  /**
   * 评估智慧视角
   */
  _assessWisdomPerspectives(userInput) {
    const input = userInput.toLowerCase();
    const assessments = [];

    // 认知谦逊评估
    if (input.includes('不知道') || input.includes('不确定') || input.includes('可能')) {
      assessments.push({
        perspective: this.wisdomPerspectives.epistemicHumility.name,
        evidence: '表达了不确定性或认知局限',
        level: 'developing',
        advice: '继续保持这种认知谦逊，同时注意不要过度怀疑自己的合理判断。'
      });
    }

    // 认知准确性评估
    if (input.includes('我觉得') || input.includes('我认为') || input.includes('我的经验')) {
      assessments.push({
        perspective: this.wisdomPerspectives.epistemicAccuracy.name,
        evidence: '区分了个人观点与客观事实',
        level: 'developing',
        advice: '继续清晰地区分你的信念与已知事实，这是认知准确性的关键。'
      });
    }

    // 知识基础评估
    if (input.includes('根据') || input.includes('研究显示') || input.includes('理论上')) {
      assessments.push({
        perspective: this.wisdomPerspectives.knowledgeBased.name,
        evidence: '引用了知识来源或理论依据',
        level: 'developing',
        advice: '继续扩展你的知识面，特别是关于什么真正重要的深层理解。'
      });
    }

    // 理性评估
    if (input.includes('因为') || input.includes('所以') || input.includes('因此') || input.includes('逻辑')) {
      assessments.push({
        perspective: this.wisdomPerspectives.rationality.name,
        evidence: '展现了因果推理或逻辑思维',
        level: 'developing',
        advice: '继续保持理性思考，同时注意情感和价值在决策中的合理位置。'
      });
    }

    return assessments.length > 0 ? assessments : [{
      message: '当前输入中智慧视角的表现不明显，可能需要更深入的反思或讨论。'
    }];
  }

  /**
   * 评估发展阶段
   */
  _assessDevelopmentStage(userInput) {
    const input = userInput.toLowerCase();
    
    // 初学者特征
    if (input.includes('应该怎么做') || input.includes('规则是什么') || input.includes('对不对')) {
      return {
        stage: this.developmentStages.novice,
        reasoning: '寻求外部规则和指导，显示出初学者的特征',
        nextStep: '开始观察不同情境中的处理方式，注意情境的差异性'
      };
    }

    // 进阶初学者特征
    if (input.includes('有时候') || input.includes('看情况') || input.includes('类似的情况')) {
      return {
        stage: this.developmentStages.advancedBeginner,
        reasoning: '开始识别情境模式，但仍在寻求一般性指导',
        nextStep: '练习独立分析情境，记录你的判断和结果'
      };
    }

    // 胜任者特征
    if (input.includes('我决定') || input.includes('我选择') || input.includes('我的判断')) {
      return {
        stage: this.developmentStages.competent,
        reasoning: '展现出独立判断和决策的能力',
        nextStep: '深化反思，考虑决策的长期影响和多方面后果'
      };
    }

    // 熟练者/专家特征
    if (input.includes('直觉告诉我') || input.includes('经验来看') || input.includes('本质上')) {
      return {
        stage: this.developmentStages.proficient,
        reasoning: '展现出直觉性把握和深层理解',
        nextStep: '考虑如何将这些洞察传授给他人，或在更复杂情境中应用'
      };
    }

    // 默认
    return {
      stage: this.developmentStages.advancedBeginner,
      reasoning: '基于当前信息，判断为进阶初学者阶段',
      nextStep: '继续练习情境分析，积累实践经验'
    };
  }

  /**
   * 生成综合建议
   */
  _generateRecommendations(analysis) {
    const recommendations = [];

    // 基于德性分析的建议
    if (analysis.virtues.length > 0) {
      recommendations.push({
        category: '德性培养',
        advice: `关注${analysis.virtues.map(v => v.virtue.name).join('、')}的培养。记住德性不是天生的，而是通过反复实践养成的习惯。`,
        practices: analysis.virtues.map(v => v.virtue.description)
      });
    }

    // 基于中道分析的建议
    if (analysis.goldenMeanAnalysis.details) {
      recommendations.push({
        category: '中道平衡',
        advice: '在每种德性上，目标是找到过度与不足之间的平衡点。这个平衡点因人因情境而异。',
        practices: analysis.goldenMeanAnalysis.details.map(d => d.balanceAdvice)
      });
    }

    // 基于发展阶段的建议
    if (analysis.developmentStage) {
      recommendations.push({
        category: '发展阶段',
        advice: `你目前处于"${analysis.developmentStage.stage.name}"阶段。${analysis.developmentStage.reasoning}`,
        practices: [analysis.developmentStage.nextStep]
      });
    }

    // 通用实践建议
    recommendations.push({
      category: '日常练习',
      advice: '实践智慧需要持续的反思和练习',
      practices: [
        '每日反思：今天我在哪些情境中展现了德性？哪些地方可以改进？',
        '情境预演：面对可能的挑战，提前思考如何平衡应对',
        '寻求反馈：向值得信赖的人请教他们对你行为的观察',
        '学习榜样：观察你敬佩的人如何处理复杂情境',
        '写反思日记：记录你的判断、行动和结果'
      ]
    });

    return recommendations;
  }

  /**
   * 获取实践智慧练习
   */
  getPractices(practiceType = 'all') {
    const practices = {
      dailyReflection: {
        name: '每日反思',
        duration: '10-15 分钟',
        steps: [
          '回顾今天的重要决策和互动',
          '识别涉及的德性（勇气、节制、公正等）',
          '评估你是否找到了中道平衡',
          '记录可以改进的地方',
          '为明天设定一个小的实践目标'
        ],
        prompts: [
          '今天我在哪个情境中最展现了智慧？',
          '我在哪个情境中偏离了中道？',
          '我从今天经历中学到了什么？',
          '明天我想在哪个德性上有所进步？'
        ]
      },
      goldenMeanExercise: {
        name: '中道平衡练习',
        duration: '20-30 分钟',
        steps: [
          '选择一个你正在面对的困境',
          '识别相关的德性',
          '列出过度反应的后果',
          '列出不足反应的后果',
          '设计中道的应对方案',
          '实践并反思结果'
        ],
        worksheet: {
          situation: '描述情境',
          virtue: '相关德性',
          excess: '过度反应会怎样？',
          deficiency: '不足反应会怎样？',
          mean: '中道的做法是什么？',
          action: '我将采取的具体行动',
          reflection: '事后反思与学习'
        }
      },
      virtueJournal: {
        name: '德性日记',
        duration: '每周',
        steps: [
          '每周选择一个德性重点培养',
          '每天记录与该德性相关的情境',
          '评估你的表现（1-10 分）',
          '周末总结进步和挑战',
          '下周选择新的德性或继续深化'
        ],
        virtues: Object.keys(this.cardinalVirtues)
      },
      wisdomMentor: {
        name: '智慧导师练习',
        duration: '30 分钟',
        steps: [
          '想象一位你敬佩的智慧长者',
          '描述你面临的困境',
          '思考：如果是 TA，会如何看待这个情境？',
          '思考：TA 会给出什么建议？',
          '将洞察应用到你的实际情况'
        ],
        prompts: [
          '这位导师的核心智慧是什么？',
          'TA 会关注哪些我可能忽略的方面？',
          'TA 会如何平衡各种考虑？',
          '我可以从 TA 身上学习什么习惯？'
        ]
      },
      perspectiveShift: {
        name: '视角转换练习',
        duration: '15-20 分钟',
        steps: [
          '描述一个困扰你的情境',
          '从 5 个智慧视角分析：认知谦逊、认知准确性、知识基础、混合理论、理性',
          '每个视角下，你会如何看待这个情境？',
          '整合各视角的洞察',
          '形成更全面的理解'
        ]
      }
    };

    if (practiceType === 'all') {
      return practices;
    }
    return practices[practiceType] || practices.dailyReflection;
  }

  /**
   * 生成实践智慧报告
   */
  generateReport(userInput, context = {}) {
    const analysis = this.analyzeSituation(userInput, context);
    
    return {
      module: '实践智慧模块',
      version: this.version,
      timestamp: new Date().toISOString(),
      analysis: analysis,
      practices: this.getPractices('all'),
      summary: this._generateSummary(analysis)
    };
  }

  /**
   * 生成综合摘要
   */
  _generateSummary(analysis) {
    let summary = '【实践智慧分析摘要】\n\n';

    if (analysis.virtues.length > 0) {
      summary += `🎯 相关德性：${analysis.virtues.map(v => v.virtue.name).join('、')}\n`;
    }

    if (analysis.goldenMeanAnalysis.summary) {
      summary += `⚖️ ${analysis.goldenMeanAnalysis.summary}\n`;
    }

    if (analysis.developmentStage) {
      summary += `📈 发展阶段：${analysis.developmentStage.stage.name}\n`;
      summary += `💡 下一步：${analysis.developmentStage.nextStep}\n`;
    }

    summary += '\n💭 核心建议：实践智慧不是知识，而是通过反复实践养成的能力。';
    summary += '从小情境开始练习，持续反思，逐步培养在复杂情境中做出平衡判断的能力。';

    return summary;
  }

  /**
   * 模块帮助信息
   */
  help() {
    return {
      name: this.name,
      version: this.version,
      description: '基于亚里士多德实践智慧理论和 SEP 智慧理论，帮助用户在具体情境中培养平衡判断能力',
      features: [
        '德性识别与分析',
        '中道平衡评估',
        '智慧视角评估',
        '发展阶段判断',
        '个性化练习建议'
      ],
      usage: [
        'analyzeSituation(input, context) - 分析情境中的实践智慧表现',
        'getPractices(type) - 获取实践智慧练习',
        'generateReport(input, context) - 生成完整分析报告'
      ],
      virtues: Object.keys(this.cardinalVirtues).map(k => this.cardinalVirtues[k].name),
      wisdomPerspectives: Object.keys(this.wisdomPerspectives).map(k => this.wisdomPerspectives[k].name)
    };
  }
}

module.exports = PracticalWisdom;
