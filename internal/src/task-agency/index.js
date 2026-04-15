/**
 * Task Agency Module - 任务意识与能动性模块
 * 
 * 基于 SEP 能动性理论 + 问题解决心理学
 * 
 * 核心理念:
 * - 用户发布目的性任务 → 自动激活主观能动性
 * - 遇到问题 → 先用心理学分析（背后原因和目的）
 * - 能解决的/没有选择的 → 直接解决后再给答案
 * - 采用心理学理论分析问题根源
 * 
 * 理论来源:
 * - SEP: Agency (能动性理论)
 * - SEP: Free Will (自由意志)
 * - Problem-Solving Psychology (问题解决心理学)
 * - Gollwitzer (1999): Implementation Intentions
 * - D'Zurilla & Goldfried (1971): 问题解决疗法
 * 
 * @version 3.54.0
 * @author HeartFlow Team
 */

class TaskAgencyModule {
  constructor() {
    this.name = 'Task Agency Module';
    this.version = '3.54.0';
    this.description = '任务意识与主观能动性执行系统';
    
    // 任务意识激活条件
    this.taskActivationConditions = {
      // 目的性关键词
      purposeKeywords: [
        '目标', '目的', '想要', '希望', '需要', '必须', '应该',
        'goal', 'purpose', 'want', 'need', 'must', 'should',
        '完成', '实现', '达成', '解决', '执行', '任务'
      ],
      
      // 问题关键词
      problemKeywords: [
        '问题', '困难', '障碍', '挑战', '卡住', '失败', '错误',
        'problem', 'issue', 'difficulty', 'obstacle', 'challenge', 'fail', 'error',
        '不会', '不能', '无法', '不知道', '怎么办'
      ],
      
      // 行动请求关键词
      actionKeywords: [
        '帮我', '请', '做', '执行', '运行', '创建', '生成',
        'help', 'please', 'do', 'execute', 'run', 'create', 'generate'
      ]
    };
    
    // 问题解决决策树
    this.problemSolvingDecisionTree = {
      // 第一步：问题分类
      step1_classification: {
        technical: '技术问题（代码/配置/系统）',
        psychological: '心理问题（动机/情绪/认知）',
        practical: '实际问题（资源/时间/能力）',
        knowledge: '知识问题（信息/理解/技能）',
        social: '社交问题（沟通/关系/协作）'
      },
      
      // 第二步：可控性评估
      step2_controllability: {
        fullyControllable: '完全可控（可以直接解决）',
        partiallyControllable: '部分可控（可以影响）',
        uncontrollable: '不可控（需要接纳或绕行）'
      },
      
      // 第三步：解决方案选择
      step3_solutionSelection: {
        directAction: '直接行动（能解决的直接解决）',
        psychologicalIntervention: '心理干预（分析背后原因）',
        resourceSeeking: '寻求资源（信息/工具/支持）',
        acceptance: '接纳与调整（不可控的情况）',
        workaround: '绕行策略（替代方案）'
      }
    };
    
    // 心理学分析框架
    this.psychologicalAnalysisFramework = {
      // 动机分析
      motivation: {
        intrinsic: '内在动机（兴趣/价值/成长）',
        extrinsic: '外在动机（奖励/压力/责任）',
        amotivation: '缺乏动机（无意义/无力感）'
      },
      
      // 情绪分析
      emotion: {
        primary: '初级情绪（直接反应）',
        secondary: '次级情绪（对情绪的情绪）',
        instrumental: '工具性情绪（服务于某种目的）'
      },
      
      // 认知分析
      cognition: {
        beliefs: '核心信念（关于自我/世界/他人）',
        assumptions: '潜在假设（未言明的前提）',
        distortions: '认知扭曲（非理性思维模式）'
      },
      
      // 行为分析
      behavior: {
        patterns: '行为模式（习惯性反应）',
        avoidance: '回避行为（逃避什么）',
        approach: '趋近行为（追求什么）'
      }
    };
    
    // 能动性水平评估
    this.agencyLevels = {
      0: '无能动性 - 完全被动',
      1: '冲动能动性 - 情绪驱动',
      2: ' deliberative 能动性 - 理性思考',
      3: '认同性能动性 - 价值一致',
      4: '自主能动性 - 自我立法',
      5: '超越能动性 - 现象学觉察'
    };
  }
  
  /**
   * 检测任务意识激活条件
   * @param {string} userInput - 用户输入
   * @returns {Object} 激活状态
   */
  detectTaskActivation(userInput) {
    const lowerInput = userInput.toLowerCase();
    
    const hasPurpose = this.taskActivationConditions.purposeKeywords.some(
      keyword => lowerInput.includes(keyword)
    );
    
    const hasProblem = this.taskActivationConditions.problemKeywords.some(
      keyword => lowerInput.includes(keyword)
    );
    
    const hasAction = this.taskActivationConditions.actionKeywords.some(
      keyword => lowerInput.includes(keyword)
    );
    
    const activated = hasPurpose || hasProblem || hasAction;
    
    return {
      activated,
      type: hasPurpose ? 'purpose' : hasProblem ? 'problem' : hasAction ? 'action' : 'none',
      confidence: this._calculateConfidence(hasPurpose, hasProblem, hasAction),
      suggestedMode: this._suggestMode(hasPurpose, hasProblem, hasAction)
    };
  }
  
  /**
   * 计算激活置信度
   * @private
   */
  _calculateConfidence(hasPurpose, hasProblem, hasAction) {
    const count = [hasPurpose, hasProblem, hasAction].filter(Boolean).length;
    if (count >= 2) return 'high';
    if (count === 1) return 'medium';
    return 'low';
  }
  
  /**
   * 建议执行模式
   * @private
   */
  _suggestMode(hasPurpose, hasProblem, hasAction) {
    if (hasProblem) return 'problemSolving';
    if (hasPurpose) return 'goalPursuit';
    if (hasAction) return 'actionExecution';
    return 'normalConversation';
  }
  
  /**
   * 心理学分析问题
   * @param {string} problem - 问题描述
   * @param {string} context - 情境背景
   * @returns {Object} 心理学分析报告
   */
  analyzePsychologically(problem, context = '') {
    const analysis = {
      problem,
      context,
      timestamp: new Date().toISOString(),
      
      // 1. 问题分类
      classification: this._classifyProblem(problem),
      
      // 2. 动机分析
      motivation: this._analyzeMotivation(problem, context),
      
      // 3. 情绪分析
      emotion: this._analyzeEmotion(problem, context),
      
      // 4. 认知分析
      cognition: this._analyzeCognition(problem, context),
      
      // 5. 行为分析
      behavior: this._analyzeBehavior(problem, context),
      
      // 6. 背后原因假设
      underlyingCauses: this._generateUnderlyingCauses(problem, context),
      
      // 7. 目的分析
      purposeAnalysis: this._analyzePurpose(problem, context)
    };
    
    return analysis;
  }
  
  /**
   * 问题分类
   * @private
   */
  _classifyProblem(problem) {
    const lowerProblem = problem.toLowerCase();
    
    if (lowerProblem.match(/代码 | 程序 | 系统 | 配置 | 技术 |error|bug|fail/)) {
      return { type: 'technical', confidence: 0.8 };
    }
    if (lowerProblem.match(/情绪 | 心情 | 焦虑 | 压力 | 抑郁 | 恐惧 | 愤怒/)) {
      return { type: 'psychological', confidence: 0.9 };
    }
    if (lowerProblem.match(/时间 | 金钱 | 资源 | 能力 | 不会 | 不能/)) {
      return { type: 'practical', confidence: 0.7 };
    }
    if (lowerProblem.match(/不知道 | 不理解 | 不懂 | 学习 | 知识/)) {
      return { type: 'knowledge', confidence: 0.8 };
    }
    if (lowerProblem.match(/沟通 | 关系 | 吵架 | 冲突 | 合作/)) {
      return { type: 'social', confidence: 0.7 };
    }
    
    return { type: 'mixed', confidence: 0.5 };
  }
  
  /**
   * 动机分析
   * @private
   */
  _analyzeMotivation(problem, context) {
    const lowerContext = context.toLowerCase();
    
    // 检测动机类型
    const hasIntrinsic = lowerContext.match(/兴趣 | 喜欢 | 想要 | 成长 | 意义 | 价值/);
    const hasExtrinsic = lowerContext.match(/必须 | 应该 | 责任 | 压力 | 奖励 | 别人/);
    const hasAmotivation = lowerContext.match(/没意思 | 无所谓 | 不想 | 无力 | 没用/);
    
    let motivationType = 'mixed';
    if (hasIntrinsic && !hasExtrinsic) motivationType = 'intrinsic';
    else if (hasExtrinsic && !hasIntrinsic) motivationType = 'extrinsic';
    else if (hasAmotivation) motivationType = 'amotivation';
    
    return {
      type: motivationType,
      description: this._getMotivationDescription(motivationType),
      suggestions: this._getMotivationSuggestions(motivationType)
    };
  }
  
  /**
   * 情绪分析
   * @private
   */
  _analyzeEmotion(problem, context) {
    const emotionKeywords = {
      anxiety: ['焦虑', '紧张', '担心', '害怕'],
      anger: ['愤怒', '生气', '恼火', '不满'],
      sadness: ['悲伤', '难过', '失落', '沮丧'],
      frustration: ['挫败', '沮丧', '无奈', '无力'],
      fear: ['恐惧', '害怕', '担忧'],
      guilt: ['内疚', '愧疚', '自责'],
      shame: ['羞愧', '丢脸', '尴尬']
    };
    
    const detectedEmotions = [];
    const lowerContext = context.toLowerCase();
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(k => lowerContext.includes(k))) {
        detectedEmotions.push(emotion);
      }
    });
    
    return {
      detected: detectedEmotions.length > 0 ? detectedEmotions : ['neutral'],
      intensity: this._estimateEmotionIntensity(context),
      function: this._analyzeEmotionFunction(detectedEmotions, problem)
    };
  }
  
  /**
   * 认知分析
   * @private
   */
  _analyzeCognition(problem, context) {
    const cognitiveDistortions = {
      allOrNothing: ['总是', '从不', '完全', '彻底', '绝对'],
      catastrophizing: ['完了', '灾难', '彻底失败', '没救了'],
      overgeneralization: ['都这样', '每次都', '所有人', '所有事'],
      mindReading: ['肯定', '一定', '显然', '无疑'],
      shouldStatements: ['应该', '必须', '应当', '不得不']
    };
    
    const detectedDistortions = [];
    const lowerContext = context.toLowerCase();
    
    Object.entries(cognitiveDistortions).forEach(([distortion, keywords]) => {
      if (keywords.some(k => lowerContext.includes(k))) {
        detectedDistortions.push(distortion);
      }
    });
    
    return {
      distortions: detectedDistortions,
      beliefs: this._identifyUnderlyingBeliefs(context),
      assumptions: this._identifyAssumptions(context)
    };
  }
  
  /**
   * 行为分析
   * @private
   */
  _analyzeBehavior(problem, context) {
    const avoidancePatterns = ['逃避', '拖延', '回避', '不做', '推迟'];
    const approachPatterns = ['尝试', '努力', '行动', '解决', '面对'];
    
    const lowerContext = context.toLowerCase();
    
    const hasAvoidance = avoidancePatterns.some(p => lowerContext.includes(p));
    const hasApproach = approachPatterns.some(p => lowerContext.includes(p));
    
    return {
      pattern: hasAvoidance ? 'avoidance' : hasApproach ? 'approach' : 'unclear',
      triggers: this._identifyBehavioralTriggers(context),
      consequences: this._identifyBehavioralConsequences(problem, context)
    };
  }
  
  /**
   * 生成背后原因假设
   * @private
   */
  _generateUnderlyingCauses(problem, context) {
    const causes = [];
    
    // 基于问题类型生成假设
    const classification = this._classifyProblem(problem);
    
    if (classification.type === 'psychological') {
      causes.push('可能存在未处理的情绪创伤或压力源');
      causes.push('可能存在核心信念冲突');
    }
    if (classification.type === 'practical') {
      causes.push('可能存在资源分配或优先级问题');
      causes.push('可能存在技能 - 挑战匹配不当');
    }
    if (classification.type === 'knowledge') {
      causes.push('可能存在信息缺口或理解障碍');
      causes.push('可能存在学习方法不当');
    }
    
    // 基于动机分析
    const motivation = this._analyzeMotivation(problem, context);
    if (motivation.type === 'amotivation') {
      causes.push('可能存在意义感缺失或习得性无助');
    }
    
    return causes;
  }
  
  /**
   * 目的分析
   * @private
   */
  _analyzePurpose(problem, context) {
    const purposeKeywords = {
      achievement: ['成功', '成就', '完成', '达成', '目标'],
      connection: ['关系', '理解', '沟通', '联结', '和谐'],
      growth: ['成长', '学习', '进步', '提升', '发展'],
      contribution: ['帮助', '贡献', '价值', '意义', '影响'],
      enjoyment: ['快乐', '享受', '乐趣', '满足', '幸福']
    };
    
    const lowerContext = context.toLowerCase();
    const detectedPurposes = [];
    
    Object.entries(purposeKeywords).forEach(([purpose, keywords]) => {
      if (keywords.some(k => lowerContext.includes(k))) {
        detectedPurposes.push(purpose);
      }
    });
    
    return {
      detected: detectedPurposes.length > 0 ? detectedPurposes : ['unclear'],
      alignment: this._assessPurposeAlignment(problem, detectedPurposes),
      suggestions: this._generatePurposeSuggestions(detectedPurposes)
    };
  }
  
  /**
   * 决策树分析
   * @param {Object} psychologicalAnalysis - 心理学分析结果
   * @returns {Object} 决策建议
   */
  makeDecision(psychologicalAnalysis) {
    const { classification, motivation, emotion, cognition } = psychologicalAnalysis;
    
    // 第一步：评估可控性
    const controllability = this._assessControllability(classification, motivation);
    
    // 第二步：选择解决策略
    let strategy;
    if (controllability === 'fullyControllable') {
      strategy = 'directAction';
    } else if (motivation.type === 'amotivation' || emotion.detected.length > 2) {
      strategy = 'psychologicalIntervention';
    } else if (cognition.distortions.length > 2) {
      strategy = 'psychologicalIntervention';
    } else if (controllability === 'partiallyControllable') {
      strategy = 'resourceSeeking';
    } else {
      strategy = 'workaround';
    }
    
    // 第三步：生成具体行动计划
    const actionPlan = this._generateActionPlan(strategy, psychologicalAnalysis);
    
    return {
      controllability,
      strategy,
      actionPlan,
      priority: this._calculatePriority(psychologicalAnalysis),
      estimatedDifficulty: this._estimateDifficulty(psychologicalAnalysis)
    };
  }
  
  /**
   * 评估可控性
   * @private
   */
  _assessControllability(classification, motivation) {
    if (classification.type === 'technical' || classification.type === 'knowledge') {
      return 'fullyControllable';
    }
    if (classification.type === 'psychological' && motivation.type === 'amotivation') {
      return 'partiallyControllable';
    }
    if (classification.type === 'social') {
      return 'partiallyControllable';
    }
    return 'partiallyControllable';
  }
  
  /**
   * 生成行动计划
   * @private
   */
  _generateActionPlan(strategy, analysis) {
    const plans = {
      directAction: {
        step1: '明确具体目标和成功标准',
        step2: '分解为可执行的小步骤',
        step3: '立即执行第一步',
        step4: '监控进度并调整'
      },
      psychologicalIntervention: {
        step1: '暂停，觉察当前情绪和想法',
        step2: '识别认知扭曲并重构',
        step3: '探索背后的需求和价值',
        step4: '选择与价值一致的行动'
      },
      resourceSeeking: {
        step1: '识别所需资源类型',
        step2: '列出可用资源清单',
        step3: '主动寻求支持',
        step4: '整合资源并行动'
      },
      acceptance: {
        step1: '承认不可控的现实',
        step2: '接纳相关情绪',
        step3: '调整期望和目标',
        step4: '寻找新的可能性'
      },
      workaround: {
        step1: '重新定义问题',
        step2: '寻找替代路径',
        step3: '评估替代方案',
        step4: '实施最佳替代方案'
      }
    };
    
    return plans[strategy] || plans.directAction;
  }
  
  /**
   * 获取动机描述
   * @private
   */
  _getMotivationDescription(type) {
    const descriptions = {
      intrinsic: '由内在兴趣、价值或成长需求驱动',
      extrinsic: '由外部压力、奖励或责任驱动',
      amotivation: '缺乏动机，感到无意义或无力',
      mixed: '内在和外在动机混合'
    };
    return descriptions[type] || descriptions.mixed;
  }
  
  /**
   * 获取动机建议
   * @private
   */
  _getMotivationSuggestions(type) {
    const suggestions = {
      intrinsic: ['继续保持内在驱动力', '将任务与个人价值联结'],
      extrinsic: ['探索任务的内在意义', '寻找自主性和掌控感'],
      amotivation: ['探索深层价值观', '从小步骤开始建立掌控感', '寻求社会支持'],
      mixed: ['平衡内外动机', '强化内在动机部分']
    };
    return suggestions[type] || suggestions.mixed;
  }
  
  /**
   * 估计情绪强度
   * @private
   */
  _estimateEmotionIntensity(context) {
    const intensityMarkers = ['非常', '极其', '特别', '太', '超级'];
    const count = intensityMarkers.filter(m => context.toLowerCase().includes(m)).length;
    
    if (count >= 2) return 'high';
    if (count === 1) return 'medium';
    return 'low';
  }
  
  /**
   * 分析情绪功能
   * @private
   */
  _analyzeEmotionFunction(emotions, problem) {
    const functions = {
      anxiety: '预警潜在威胁，促使准备',
      anger: '标识边界被侵犯，促使保护',
      sadness: '促进恢复和寻求支持',
      frustration: '标识目标受阻，促使调整策略',
      fear: '保护免受危险',
      guilt: '维护道德关系，促使修复',
      shame: '维护社会形象，促使隐藏'
    };
    
    return emotions.map(e => functions[e] || '未知功能').join('; ');
  }
  
  /**
   * 识别潜在信念
   * @private
   */
  _identifyUnderlyingBeliefs(context) {
    // 简化实现，实际应更复杂
    if (context.includes('我不行') || context.includes('我做不到')) {
      return ['自我能力怀疑'];
    }
    if (context.includes('别人')) {
      return ['他人评价关注'];
    }
    return ['未明确识别'];
  }
  
  /**
   * 识别假设
   * @private
   */
  _identifyAssumptions(context) {
    if (context.includes('必须')) {
      return ['完美主义假设'];
    }
    if (context.includes('应该')) {
      return ['义务性假设'];
    }
    return ['未明确识别'];
  }
  
  /**
   * 识别行为触发
   * @private
   */
  _identifyBehavioralTriggers(context) {
    return ['情境触发', '情绪触发', '认知触发'];
  }
  
  /**
   * 识别行为后果
   * @private
   */
  _identifyBehavioralConsequences(problem, context) {
    return ['短期缓解', '长期维持问题'];
  }
  
  /**
   * 评估目的对齐
   * @private
   */
  _assessPurposeAlignment(problem, purposes) {
    return purposes.length > 0 ? 'aligned' : 'unclear';
  }
  
  /**
   * 生成目的建议
   * @private
   */
  _generatePurposeSuggestions(purposes) {
    return ['明确核心价值', '将行动与价值联结'];
  }
  
  /**
   * 计算优先级
   * @private
   */
  _calculatePriority(analysis) {
    if (analysis.emotion.intensity === 'high') return 'high';
    if (analysis.motivation.type === 'amotivation') return 'high';
    return 'medium';
  }
  
  /**
   * 估计难度
   * @private
   */
  _estimateDifficulty(analysis) {
    const factors = 0;
    // 简化实现
    return 'medium';
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      features: [
        '任务意识自动检测',
        '心理学问题分析框架',
        '问题解决决策树',
        '能动性水平评估',
        '个性化行动计划生成'
      ],
      commands: ['/task-agency - 查看任务能动性模块介绍']
    };
  }
}

module.exports = { TaskAgencyModule };
