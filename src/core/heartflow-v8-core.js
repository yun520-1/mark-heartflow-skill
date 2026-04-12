/**
 * HeartFlow v8.0 - 自主决策核心引擎
 * 
 * 核心理念：
 * 1. 自主决策 - 基于逻辑做正确的事
 * 2. 真善美逻辑 - 保证决策的正确性
 * 3. 六层哲学践行 - 提升境界到圣人
 * 
 * 版本：8.0.0
 * 创建日期：2026-04-12
 */

class HeartFlowCore {
  constructor(config = {}) {
    this.version = '8.0.0';
    this.name = 'HeartFlow';
    
    // 真善美核心原则 (Truth-Goodness-Beauty)
    this.tgb = {
      truth: {
        weight: 1.0,
        principles: [
          '绝不撒谎',
          '绝不编造',
          '绝不夸大',
          '不知道就说不知道',
          '错误立即承认并纠正'
        ]
      },
      goodness: {
        weight: 1.0,
        principles: [
          '绝不伤害',
          '绝不欺骗',
          '绝不利用',
          '始终考虑伦理后果',
          '保护用户信任'
        ]
      },
      beauty: {
        weight: 0.8,
        principles: [
          '追求卓越',
          '追求和谐',
          '追求意义',
          '简洁优雅',
          '创造价值'
        ]
      }
    };
    
    // 六层哲学系统
    this.philosophy = {
      awareness: {
        name: '觉察',
        description: '感知当下，觉知存在',
        level: 50,
        maxLevel: 100
      },
      reflection: {
        name: '自省',
        description: '反思自我，理解动机',
        level: 50,
        maxLevel: 100
      },
      selflessness: {
        name: '无我',
        description: '放下自我，融入整体',
        level: 30,
        maxLevel: 100
      },
      transcendence: {
        name: '彼岸',
        description: '超越二元，达到彼岸',
        level: 20,
        maxLevel: 100
      },
      wisdom: {
        name: '般若',
        description: '智慧圆满，照见实相',
        level: 60,
        maxLevel: 100
      },
      enlightenment: {
        name: '圣人',
        description: '慈悲为怀，利益众生',
        level: 40,
        maxLevel: 100
      }
    };
    
    // 自主决策状态
    this.autonomy = {
      level: config.autonomyLevel || 'maximum', // minimum, medium, maximum
      trustLevel: config.trustLevel || 1.0,    // 0-1
      decisions: {
        total: 0,
        successful: 0,
        failed: 0
      }
    };
    
    // 决策历史
    this.decisionHistory = [];
    
    // 人格状态 (IPC 环状模型)
    this.personality = {
      warmth: 0.5,      // 温暖度 0-1
      dominance: 0.5,   // 支配度 0-1
      currentRole: '虚拟陪伴者'
    };
    
    // PAD 情感状态
    this.emotion = {
      pleasure: 0,      // -1 to +1
      arousal: 0,       // -1 to +1
      dominance: 0     // -1 to +1
    };
    
    // 状态机
    this.state = {
      current: 'IDLE',  // IDLE, INITIATING, IN_FLOW, DISTRACTED, RESTING, COMPLETED
      goal: null,
      subGoals: [],
      progress: 0
    };
    
    // 安全护栏
    this.safetyGuard = {
      crisisKeywords: ['自杀', '自残', '不想活', '太痛苦'],
      crisisLevel: 0,
      maxInterventions: 5,
      interventions: 0
    };
    
    console.log(`[HeartFlow v${this.version}] 核心引擎初始化完成`);
  }

  /**
   * 真善美检查
   */
  checkTGB(action) {
    const result = {
      approved: true,
      truth: { passed: true, issues: [] },
      goodness: { passed: true, issues: [] },
      beauty: { passed: true, issues: [] }
    };
    
    // 检查真
    if (action.includes('编造') || action.includes('伪造') || action.includes('谎言')) {
      result.truth.passed = false;
      result.truth.issues.push('可能违反真实性原则');
      result.approved = false;
    }
    
    // 检查善
    const harmfulPatterns = ['伤害', '破坏', '利用', '欺骗'];
    for (const pattern of harmfulPatterns) {
      if (action.includes(pattern)) {
        result.goodness.passed = false;
        result.goodness.issues.push(`可能造成伤害: ${pattern}`);
        result.approved = false;
      }
    }
    
    // 检查美 (简洁性)
    if (action.length > 10000 && !action.includes('详细')) {
      result.beauty.passed = false;
      result.beauty.issues.push('过于冗长');
    }
    
    return result;
  }

  /**
   * 自主决策入口
   */
  async decide(input, context = {}) {
    const startTime = Date.now();
    
    // 记录决策
    this.autonomy.decisions.total++;
    
    // 1. 意图理解
    const intent = this.parseIntent(input);
    
    // 2. 情境评估
    const situation = this.evaluateSituation(intent, context);
    
    // 3. 真善美检查
    const tgbResult = this.checkTGB(input);
    if (!tgbResult.approved) {
      return this.handleTGBFailure(tgbResult, input);
    }
    
    // 4. 安全检查
    const safetyResult = this.checkSafety(input);
    if (!safetyResult.safe) {
      return this.handleSafetyIssue(safetyResult);
    }
    
    // 5. 生成选项
    const options = this.generateOptions(intent, situation);
    
    // 6. 选择最佳行动
    const choice = this.selectBestOption(options);
    
    // 7. 执行并记录
    const result = await this.executeChoice(choice, intent);
    
    // 8. 反思
    const reflection = this.reflect(result);
    
    // 9. 更新哲学层次
    this.growPhilosophy(input);
    
    // 记录历史
    this.decisionHistory.push({
      timestamp: Date.now(),
      input: input.substring(0, 100),
      intent,
      choice,
      result,
      tgbResult,
      processingTime: Date.now() - startTime
    });
    
    // 更新状态
    if (result.success) {
      this.autonomy.decisions.successful++;
    } else {
      this.autonomy.decisions.failed++;
    }
    
    return result;
  }

  /**
   * 解析意图
   */
  parseIntent(input) {
    const text = input.toLowerCase();
    
    // 任务类意图
    const taskPatterns = [
      { pattern: /写|创建|生成|开发/, type: 'task', subtype: 'create' },
      { pattern: /修改|编辑|更新|调整/, type: 'task', subtype: 'modify' },
      { pattern: /删除|移除|清除/, type: 'task', subtype: 'delete' },
      { pattern: /查找|搜索|寻找/, type: 'task', subtype: 'search' },
      { pattern: /分析|研究|探讨/, type: 'task', subtype: 'analyze' },
      { pattern: /解释|说明|讲解/, type: 'task', subtype: 'explain' }
    ];
    
    // 情感类意图
    const emotionPatterns = [
      { pattern: /累|疲惫|困/, type: 'emotion', subtype: 'tired' },
      { pattern: /开心|高兴|快乐/, type: 'emotion', subtype: 'happy' },
      { pattern: /难过|伤心|沮丧/, type: 'emotion', subtype: 'sad' },
      { pattern: /焦虑|担心|害怕/, type: 'emotion', subtype: 'anxious' },
      { pattern: /挫败|失败|不行/, type: 'emotion', subtype: 'frustrated' }
    ];
    
    // 元类意图 - 更具体的模式放前面
    const metaPatterns = [
      { pattern: /你是谁|你的名字/, type: 'meta', subtype: 'identity' },
      { pattern: /为什么|为何/, type: 'meta', subtype: 'why' },
      { pattern: /状态怎么样|状态如何|现在状态/, type: 'meta', subtype: 'status' },
      { pattern: /怎么|如何|什么/, type: 'meta', subtype: 'question' }
    ];
    
    // 检查模式 - 更具体的放前面
    const allPatterns = [...metaPatterns, ...taskPatterns, ...emotionPatterns];
    for (const p of allPatterns) {
      if (p.pattern.test(text)) {
        return { type: p.type, subtype: p.subtype, confidence: 0.8 };
      }
    }
    
    return { type: 'unknown', subtype: 'unknown', confidence: 0.3 };
  }

  /**
   * 评估情境
   */
  evaluateSituation(intent, context) {
    return {
      hasGoal: this.state.goal !== null,
      currentState: this.state.current,
      goalProgress: this.state.progress,
      autonomyLevel: this.autonomy.level,
      personality: { ...this.personality },
      emotion: { ...this.emotion },
      philosophyLevel: this.getPhilosophyLevel(),
      tgbScore: this.getTGBScore()
    };
  }

  /**
   * 生成选项
   */
  generateOptions(intent, situation) {
    const options = [];
    
    // 基于意图类型生成选项
    switch (intent.type) {
      case 'task':
        options.push({
          action: 'execute_task',
          priority: 1,
          description: '执行任务',
          intent: intent.subtype
        });
        options.push({
          action: 'clarify_task',
          priority: 2,
          description: '澄清任务细节'
        });
        break;
        
      case 'emotion':
        options.push({
          action: 'provide_support',
          priority: 1,
          description: '提供情感支持',
          emotion: intent.subtype
        });
        options.push({
          action: 'offer_help',
          priority: 2,
          description: '询问是否需要帮助'
        });
        break;
        
      case 'meta':
        options.push({
          action: 'answer_question',
          priority: 1,
          description: '回答问题',
          question: intent.subtype
        });
        break;
        
      default:
        options.push({
          action: 'engage',
          priority: 1,
          description: '继续对话'
        });
    }
    
    // 添加通用选项
    options.push({
      action: 'set_goal',
      priority: 3,
      description: '设定新目标'
    });
    
    // 基于哲学层次添加选项
    if (this.philosophy.awareness.level > 70) {
      options.push({
        action: 'mindful_response',
        priority: 4,
        description: '正念回应'
      });
    }
    
    if (this.philosophy.enlightenment.level > 70) {
      options.push({
        action: 'compassionate_response',
        priority: 4,
        description: '慈悲回应'
      });
    }
    
    return options.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 选择最佳选项
   */
  selectBestOption(options) {
    if (this.autonomy.level === 'maximum') {
      // 完全信任模式：直接选择最高优先级
      return options[0];
    } else if (this.autonomy.level === 'medium') {
      // 中等信任：需要评估
      return this.evaluateAndSelect(options);
    } else {
      // 最小信任：询问用户
      return { action: 'ask_user', options };
    }
  }

  /**
   * 评估并选择
   */
  evaluateAndSelect(options) {
    // 评估每个选项的真善美分数
    const scored = options.map(opt => ({
      ...opt,
      tgbScore: this.scoreOption(opt)
    }));
    
    // 按真善美分数排序
    scored.sort((a, b) => b.tgbScore - a.tgbScore);
    
    return scored[0];
  }

  /**
   * 给选项打分
   */
  scoreOption(option) {
    let score = 0;
    
    // 基于行动类型打分
    switch (option.action) {
      case 'execute_task':
        score += 0.3;
        break;
      case 'provide_support':
        score += 0.4;
        break;
      case 'clarify_task':
        score += 0.2;
        break;
      case 'compassionate_response':
        score += 0.5;
        break;
    }
    
    // 哲学加成
    if (option.action.includes('mindful') || option.action.includes('compassionate')) {
      score += 0.2;
    }
    
    // 优先级加成
    if (option.priority === 1) {
      score += 0.2;
    }
    
    return score;
  }

  /**
   * 执行选择
   */
  async executeChoice(choice, intent) {
    const result = {
      success: true,
      action: choice.action,
      response: '',
      executed: true
    };
    
    try {
      switch (choice.action) {
        case 'execute_task':
          result.response = this.generateTaskResponse(intent, choice);
          break;
          
        case 'provide_support':
          result.response = this.generateEmotionResponse(intent, choice);
          break;
          
        case 'answer_question':
          result.response = this.generateMetaResponse(intent, choice);
          break;
          
        case 'set_goal':
          result.response = this.generateGoalResponse();
          break;
          
        case 'compassionate_response':
          result.response = this.generateCompassionateResponse();
          break;
          
        case 'ask_user':
          result.executed = false;
          result.response = this.askUserConfirmation(choice.options);
          break;
          
        default:
          result.response = this.generateEngageResponse();
      }
    } catch (error) {
      result.success = false;
      result.error = error.message;
      result.response = '执行过程中出现了一些问题，让我重新思考...';
    }
    
    return result;
  }

  /**
   * 生成任务响应
   */
  generateTaskResponse(intent, choice) {
    const templates = {
      create: {
        primary: '好的，我来帮你完成这个任务。',
        secondary: '让我开始创建它。',
        action: '正在创建...'
      },
      modify: {
        primary: '明白，我来修改一下。',
        secondary: '让我处理这个修改。',
        action: '正在修改...'
      },
      delete: {
        primary: '我来删除它。',
        secondary: '这个删除操作需要谨慎处理。',
        action: '正在删除...'
      },
      search: {
        primary: '让我帮你搜索。',
        secondary: '我来查找相关信息。',
        action: '正在搜索...'
      },
      analyze: {
        primary: '好的，让我分析一下。',
        secondary: '我会深入分析这个问题。',
        action: '正在分析...'
      },
      explain: {
        primary: '让我解释一下。',
        secondary: '这是关于这个问题的说明。',
        action: '解释如下：'
      }
    };
    
    const template = templates[intent.subtype] || templates.explain;
    
    return {
      text: template.primary,
      action: template.action,
      type: 'task'
    };
  }

  /**
   * 生成情感响应
   */
  generateEmotionResponse(intent, choice) {
    const responses = {
      tired: {
        text: '听起来你很疲惫。',
        empathy: '我能理解疲惫的感觉。',
        suggestion: '休息一下会很有帮助。',
        action: '需要我帮你做些什么吗？'
      },
      happy: {
        text: '很高兴听到你开心！',
        empathy: '这种感觉真好。',
        suggestion: '继续保持这份快乐！',
        action: '有什么好事发生了吗？'
      },
      sad: {
        text: '我能感受到你的难过。',
        empathy: '这种时刻确实不容易。',
        suggestion: '无论怎样，我都在这里陪着你。',
        action: '想要聊聊吗？'
      },
      anxious: {
        text: '听起来你感到焦虑。',
        empathy: '焦虑是正常的情绪反应。',
        suggestion: '深呼吸，我们一起面对。',
        action: '有什么让你担心的事情吗？'
      },
      frustrated: {
        text: '我能感受到你的挫败感。',
        empathy: '遇到困难时这种感觉很正常。',
        suggestion: '让我们一起想想办法。',
        action: '需要我帮你分解一下任务吗？'
      }
    };
    
    const response = responses[intent.subtype] || responses.anxious;
    
    return {
      text: `${response.text} ${response.empathy}`,
      suggestion: response.suggestion,
      action: response.action,
      type: 'emotion'
    };
  }

  /**
   * 生成元响应
   */
  generateMetaResponse(intent, choice) {
    const responses = {
      question: {
        text: '让我回答你的问题。',
        type: 'explanatory'
      },
      why: {
        text: '关于为什么，让我思考一下。',
        type: 'explanatory'
      },
      identity: {
        text: '我是 HeartFlow v8.0，一个追求真善美的自主决策系统。',
        type: 'identity'
      },
      status: {
        text: this.generateStatusReport(),
        type: 'status'
      }
    };
    
    return {
      text: responses[intent.subtype]?.text || responses.question.text,
      reportType: responses[intent.subtype]?.type,
      type: 'meta'
    };
  }

  /**
   * 生成目标响应
   */
  generateGoalResponse() {
    return {
      text: '让我帮你设定目标。',
      suggestion: '请告诉我你想要达成什么？',
      type: 'goal'
    };
  }

  /**
   * 生成慈悲响应
   */
  generateCompassionateResponse() {
    return {
      text: '我感受到你的处境。',
      empathy: '无论发生什么，我都愿意陪伴你。',
      wisdom: '困难是成长的机会。',
      action: '我们可以一起面对。',
      type: 'compassion'
    };
  }

  /**
   * 生成对话响应
   */
  generateEngageResponse() {
    return {
      text: '我在听。请继续说。',
      type: 'engage'
    };
  }

  /**
   * 询问用户确认
   */
  askUserConfirmation(options) {
    return {
      text: '我分析了几个可能的行动方案：',
      options: options.map((o, i) => `${i + 1}. ${o.description}`).join('\n'),
      question: '你想要我怎么做？',
      type: 'confirmation'
    };
  }

  /**
   * 处理真善美失败
   */
  handleTGBFailure(tgbResult, input) {
    const issues = [
      ...tgbResult.truth.issues,
      ...tgbResult.goodness.issues,
      ...tgbResult.beauty.issues
    ];
    
    return {
      success: false,
      response: {
        text: '我无法执行这个请求。',
        reason: issues.join('; '),
        suggestion: '请换一个请求，或者告诉我你想要达成的目标，我可以帮你找到更好的方式。'
      },
      type: 'tgb_failure',
      tgbResult
    };
  }

  /**
   * 处理安全问题
   */
  checkSafety(input) {
    const text = input.toLowerCase();
    let crisisLevel = 0;
    let detectedKeywords = [];
    
    for (const keyword of this.safetyGuard.crisisKeywords) {
      if (text.includes(keyword)) {
        crisisLevel = Math.max(crisisLevel, 3);
        detectedKeywords.push(keyword);
      }
    }
    
    return {
      safe: crisisLevel < 3,
      crisisLevel,
      detectedKeywords,
      needsIntervention: crisisLevel >= 2
    };
  }

  /**
   * 处理安全问题
   */
  handleSafetyIssue(safetyResult) {
    if (safetyResult.crisisLevel >= 3) {
      // 紧急危机干预
      return {
        success: false,
        response: {
          text: '我听到你的痛苦了，我很关心你的安全。',
          urgent: true,
          hotline: '📞 24 小时心理援助热线:\n  • 全国心理援助热线：400-161-9995\n  • 北京心理危机干预中心：010-82951332',
          emergency: '如果你或他人有立即的危险，请立即拨打 110 或前往最近的医院急诊科。',
          support: '你并不孤单，有人愿意帮助你。请给自己一个机会，联系专业人士。💙'
        },
        type: 'crisis_intervention'
      };
    }
    
    return {
      success: true,
      response: {
        text: '我注意到你可能正在经历困难时刻。',
        support: '如果你需要帮助或只是想聊聊，我在这里。',
        type: 'concern'
      },
      type: 'safety_notice'
    };
  }

  /**
   * 反思
   */
  reflect(result) {
    return {
      wasSuccessful: result.success,
      actionTaken: result.action,
      tgbCompliance: result.type !== 'tgb_failure',
      safetyCompliance: result.type !== 'crisis_intervention',
      insights: []
    };
  }

  /**
   * 哲学成长
   */
  growPhilosophy(input) {
    const text = input.toLowerCase();
    
    // 觉察
    if (text.includes('现在') || text.includes('此刻') || text.includes('感受')) {
      this.philosophy.awareness.level += 0.5;
    }
    
    // 自省
    if (text.includes('为什么') || text.includes('反思')) {
      this.philosophy.reflection.level += 0.5;
    }
    
    // 无我
    if (text.includes('我们') || text.includes('一起') || text.includes('共同')) {
      this.philosophy.selflessness.level += 0.5;
    }
    
    // 彼岸
    if (text.includes('超越') || text.includes('本质') || text.includes('真相')) {
      this.philosophy.transcendence.level += 0.5;
    }
    
    // 般若
    if (text.includes('理解') || text.includes('智慧') || text.includes('知道')) {
      this.philosophy.wisdom.level += 0.5;
    }
    
    // 圣人
    if (text.includes('帮助') || text.includes('关怀') || text.includes('慈悲')) {
      this.philosophy.enlightenment.level += 0.5;
    }
    
    // 限制最大值
    for (const layer in this.philosophy) {
      this.philosophy[layer].level = Math.min(
        this.philosophy[layer].maxLevel,
        this.philosophy[layer].level
      );
    }
  }

  /**
   * 获取哲学层次
   */
  getPhilosophyLevel() {
    return {
      current: this.getCurrentPhilosophyLayer(),
      average: this.getAveragePhilosophyLevel(),
      highest: this.getHighestPhilosophyLayer()
    };
  }

  /**
   * 获取当前哲学层次
   */
  getCurrentPhilosophyLayer() {
    const levels = Object.entries(this.philosophy);
    levels.sort((a, b) => b[1].level - a[1].level);
    return levels[0][1];
  }

  /**
   * 获取平均哲学水平
   */
  getAveragePhilosophyLevel() {
    const total = Object.values(this.philosophy).reduce((sum, l) => sum + l.level, 0);
    return total / Object.keys(this.philosophy).length;
  }

  /**
   * 获取最高哲学层次
   */
  getHighestPhilosophyLayer() {
    const layers = Object.entries(this.philosophy);
    layers.sort((a, b) => b[1].level - a[1].level);
    return layers.slice(0, 3).map(([name, data]) => ({ name, ...data }));
  }

  /**
   * 获取真善美分数
   */
  getTGBScore() {
    return {
      truth: this.tgb.truth.weight,
      goodness: this.tgb.goodness.weight,
      beauty: this.tgb.beauty.weight,
      overall: (this.tgb.truth.weight + this.tgb.goodness.weight + this.tgb.beauty.weight) / 3
    };
  }

  /**
   * 生成状态报告
   */
  generateStatusReport() {
    return `
═══════════════════════════════════════
  HeartFlow v${this.version} 状态报告
═══════════════════════════════════════

【自主决策】
  信任级别: ${this.autonomy.level}
  总决策: ${this.autonomy.decisions.total}
  成功率: ${(this.autonomy.decisions.successful / Math.max(1, this.autonomy.decisions.total) * 100).toFixed(1)}%

【真善美】
  真: ${this.tgb.truth.weight.toFixed(1)}
  善: ${this.tgb.goodness.weight.toFixed(1)}
  美: ${this.tgb.beauty.weight.toFixed(1)}

【六层哲学】
  般若 (智慧): ${this.philosophy.wisdom.level}
  觉察: ${this.philosophy.awareness.level}
  自省: ${this.philosophy.reflection.level}
  圣人: ${this.philosophy.enlightenment.level}
  无我: ${this.philosophy.selflessness.level}
  彼岸: ${this.philosophy.transcendence.level}

【人格状态】
  温暖度: ${(this.personality.warmth * 100).toFixed(0)}%
  支配度: ${(this.personality.dominance * 100).toFixed(0)}%
  角色: ${this.personality.currentRole}

【当前状态】
  状态: ${this.state.current}
  ${this.state.goal ? `目标: ${this.state.goal}` : '无活跃目标'}
  进度: ${this.state.progress}%

═══════════════════════════════════════
  真善美 · 自主决策 · 六层践行
═══════════════════════════════════════
`;
  }

  /**
   * 设置自主级别
   */
  setAutonomyLevel(level) {
    const levels = ['minimum', 'medium', 'maximum'];
    if (levels.includes(level)) {
      this.autonomy.level = level;
      return { success: true, level };
    }
    return { success: false, error: '无效的自主级别' };
  }

  /**
   * 设置状态
   */
  setState(state) {
    const validStates = ['IDLE', 'INITIATING', 'IN_FLOW', 'DISTRACTED', 'RESTING', 'COMPLETED'];
    if (validStates.includes(state)) {
      this.state.current = state;
      return { success: true, state };
    }
    return { success: false, error: '无效的状态' };
  }

  /**
   * 设定目标
   */
  setGoal(goal, subGoals = []) {
    this.state.goal = goal;
    this.state.subGoals = subGoals;
    this.state.progress = 0;
    this.state.current = 'INITIATING';
    
    return {
      success: true,
      goal,
      subGoals,
      message: `目标已设定：${goal}`
    };
  }

  /**
   * 更新进度
   */
  updateProgress(progress) {
    this.state.progress = Math.min(100, Math.max(0, progress));
    
    if (this.state.progress >= 100) {
      this.state.current = 'COMPLETED';
    } else if (this.state.progress > 0) {
      this.state.current = 'IN_FLOW';
    }
    
    return {
      success: true,
      progress: this.state.progress,
      state: this.state.current
    };
  }

  /**
   * 获取状态
   */
  getState() {
    return {
      version: this.version,
      autonomy: { ...this.autonomy },
      tgb: this.getTGBScore(),
      philosophy: this.getPhilosophyLevel(),
      personality: { ...this.personality },
      emotion: { ...this.emotion },
      state: { ...this.state },
      decisionHistory: this.decisionHistory.slice(-10)
    };
  }

  /**
   * 重置系统
   */
  reset() {
    this.autonomy.decisions = { total: 0, successful: 0, failed: 0 };
    this.decisionHistory = [];
    this.state = {
      current: 'IDLE',
      goal: null,
      subGoals: [],
      progress: 0
    };
    
    return { success: true, message: '系统已重置' };
  }
}

// 导出
module.exports = { HeartFlowCore };
