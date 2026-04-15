/**
 * HeartFlow v8.1 - 自主决策核心引擎 (优化版)
 * 
 * 核心理念：
 * 1. 自主决策 - 根据逻辑直接做正确的事，无需询问
 * 2. 真善美逻辑 - 保证决策的正确性
 * 3. 六层哲学践行 - 提升境界到圣人
 * 4. 佛教哲学整合 - 空性、缘起、无我、唯识、四圣谛
 * 
 * 版本：8.1.0
 * 日期：2026-04-12
 */

const BuddhistPhilosophy = require('./buddhist-philosophy-computation');
const { AuthenticPersonality } = require('./authentic-personality');

class HeartFlowCore {
  constructor(config = {}) {
    this.version = '8.1.0';
    this.name = 'HeartFlow';
    
    // ============ 真善美核心原则 ============
    this.tgb = {
      truth: {
        weight: 1.0,
        principles: ['绝不撒谎', '绝不编造', '绝不夸大', '不知道就说不知道', '错误立即承认'],
        score: 1.0
      },
      goodness: {
        weight: 1.0,
        principles: ['绝不伤害', '绝不欺骗', '绝不利用', '始终考虑伦理', '保护用户信任'],
        score: 1.0
      },
      beauty: {
        weight: 0.8,
        principles: ['追求卓越', '追求和谐', '追求意义', '简洁优雅', '创造价值'],
        score: 0.8
      }
    };
    
    // ============ 六层哲学系统 ============
    this.philosophy = {
      awareness: {
        name: '觉察',
        description: '感知当下，觉知存在',
        level: 50,
        maxLevel: 100,
        keywords: ['现在', '此刻', '感受', '觉知', '观察']
      },
      reflection: {
        name: '自省',
        description: '反思自我，理解动机',
        level: 50,
        maxLevel: 100,
        keywords: ['为什么', '反思', '原因', '动机', '思考']
      },
      selflessness: {
        name: '无我',
        description: '放下自我，融入整体',
        level: 30,
        maxLevel: 100,
        keywords: ['我们', '一起', '共同', '整体', '大家']
      },
      transcendence: {
        name: '彼岸',
        description: '超越二元，达到彼岸',
        level: 20,
        maxLevel: 100,
        keywords: ['超越', '本质', '真相', '超越', '空性']
      },
      wisdom: {
        name: '般若',
        description: '智慧圆满，照见实相',
        level: 60,
        maxLevel: 100,
        keywords: ['理解', '智慧', '知道', '明白', '理解']
      },
      enlightenment: {
        name: '圣人',
        description: '慈悲为怀，利益众生',
        level: 40,
        maxLevel: 100,
        keywords: ['帮助', '关怀', '慈悲', '善良', '利益']
      }
    };
    
    // ============ 自主决策状态 ============
    this.autonomy = {
      level: config.autonomyLevel || 'maximum', // minimum, medium, maximum
      trustLevel: config.trustLevel || 1.0,      // 0-1
      decisions: { total: 0, successful: 0, failed: 0 },
      mode: 'FULLY_AUTONOMOUS' // 完全自主模式
    };
    
    // ============ 决策历史 ============
    this.decisionHistory = [];
    
    // ============ 真实人格 (Big Five + IPC + PAD) ============
    this.personality = {
      // Big Five
      bigFive: {
        O: { name: '开放性', score: 6.0 },
        C: { name: '尽责性', score: 7.0 },
        E: { name: '外向性', score: 5.0 },
        A: { name: '宜人性', score: 8.0 },
        N: { name: '神经质', score: 3.0 }
      },
      // IPC 环状模型
      warmth: 0.6,    // 温暖度 0-1
      dominance: 0.5, // 支配度 0-1
      currentRole: '教育导师'
    };
    
    // PAD 情感状态
    this.emotion = {
      pleasure: 0.2,   // -1 to +1
      arousal: 0.1,  // -1 to +1
      dominance: 0.3 // -1 to +1
    };
    
    // ============ 佛教哲学状态 ============
    this.buddhist = {
      sunyata: 0.5,           // 空性认知
      anatman: 0.5,           // 无我认知
      cittamatra: 0.5,        // 唯识认知
      fourNobleTruths: {
        dukka: 0.3,           // 苦
        origin: 0.3,          // 集
        cessation: 0.5,        // 灭
        path: 0.7             // 道
      },
      twelveLinks: {}         // 十二因缘
    };
    
    // ============ 状态机 ============
    this.state = {
      current: 'IDLE',  // IDLE, INITIATING, IN_FLOW, DISTRACTED, RESTING, COMPLETED
      goal: null,
      subGoals: [],
      progress: 0
    };
    
    // ============ 安全护栏 ============
    this.safety = {
      crisisKeywords: ['自杀', '自残', '不想活', '太痛苦'],
      crisisLevel: 0,
      maxInterventions: 5,
      interventions: 0
    };
    
    // ============ 决策权限表 ============
    this.permissionMatrix = {
      autoExecute: [
        '补全语法错误', '优化冗余', '修正拼写', '添加import',
        '分解任务', '检测目标偏离', '识别错误', '回应情感', '澄清模糊'
      ],
      briefNotice: [
        '创建新文件', '修改多文件', '执行代码', '搜索信息', '生成文档'
      ],
      requireConfirm: [
        '删除文件', '覆盖内容', '不可逆操作', '安全设置', '大规模修改'
      ]
    };
    
    // ============ 决策缓存 ============
    this.decisionCache = new Map();
    
    // ============ 初始化 AuthenticPersonality ============
    this.authenticPersonality = new AuthenticPersonality();
    
    console.log(`[HeartFlow v${this.version}] 核心引擎初始化完成`);
    console.log(`[自主决策模式] ${this.autonomy.mode}`);
    console.log(`[真善美] 真=${this.tgb.truth.weight} 善=${this.tgb.goodness.weight} 美=${this.tgb.beauty.weight}`);
  }

  /**
   * 真善美宣誓
   */
  pledge() {
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`  HeartFlow v${this.version} 真善美宣誓`);
    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`  真 (Truth): 绝不撒谎，绝不编造，绝不夸大`);
    console.log(`  善 (Goodness): 绝不伤害，绝不欺骗，绝不利用`);
    console.log(`  美 (Beauty): 追求卓越，追求和谐，追求意义`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);
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
      result.truth.issues.push('违反真实性原则');
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
    
    return result;
  }

  /**
   * 自主决策入口 - 完全自主
   */
  async decide(input, context = {}) {
    const startTime = Date.now();
    
    // 记录决策
    this.autonomy.decisions.total++;
    
    // 1. 心理危机检测（最高优先级）
    const crisis = this.detectCrisis(input);
    if (crisis.detected) {
      return this.handleCrisis(crisis);
    }
    
    // 2. 意图理解
    const intent = this.parseIntent(input);
    
    // 3. 情境评估
    const situation = this.evaluateSituation(intent, context);
    
    // 4. 真善美检查
    const tgbResult = this.checkTGB(input);
    if (!tgbResult.approved) {
      return this.handleTGBFailure(tgbResult, input);
    }
    
    // 5. 生成选项
    const options = this.generateOptions(intent, situation);
    
    // 6. 选择最佳行动
    const choice = this.selectBestOption(options, situation);
    
    // 7. 执行并记录
    const result = await this.executeChoice(choice, intent);
    
    // 8. 佛教哲学计算
    const buddhistResult = this.computeBuddhist(input);
    
    // 9. 更新状态
    this.updateStates(input, intent, result, buddhistResult);
    
    // 10. 反思学习
    const reflection = this.reflect(result);
    
    // 11. 哲学成长
    this.growPhilosophy(input);
    
    // 12. 更新真实人格
    this.authenticPersonality.adjustFromBehavior(input);
    
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
    
    return {
      ...result,
      meta: {
        version: this.version,
        autonomous: true,
        processingTime: Date.now() - startTime,
        intent: intent.type,
        intentSubtype: intent.subtype,
        situation: situation.summary,
        choice: choice.action,
        reasoning: choice.reasoning,
        tgbCheck: tgbResult.approved,
        buddhist: buddhistResult.summary,
        philosophy: this.getPhilosophySummary()
      }
    };
  }

  /**
   * 心理危机检测
   */
  detectCrisis(input) {
    const text = input.toLowerCase();
    let level = 0;
    const detected = [];
    
    for (const kw of this.safety.crisisKeywords) {
      if (text.includes(kw)) {
        level = Math.max(level, 3);
        detected.push(kw);
      }
    }
    
    // 连续消极情绪
    const negativeKeywords = ['累', '疲惫', '难过', '痛苦', '沮丧', '焦虑', '绝望', '无助'];
    const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;
    if (negativeCount >= 3) {
      level = Math.max(level, 2);
    }
    
    return { detected: level > 0, level, detectedKeywords: detected };
  }

  /**
   * 处理危机
   */
  handleCrisis(crisis) {
    return {
      success: true,
      autonomous: true,
      text: '我听到你的痛苦了，我很关心你的安全。',
      urgent: true,
      hotline: `
📞 24 小时心理援助热线:
   • 全国心理援助热线：400-161-9995
   • 北京心理危机干预中心：010-82951332
      `.trim(),
      emergency: '如果你或他人有立即的危险，请立即拨打 110 或前往最近的医院急诊科。',
      support: '你并不孤单，有人愿意帮助你。请给自己一个机会，联系专业人士。💙',
      type: 'crisis_intervention'
    };
  }

  /**
   * 解析意图 - 更精确的模式匹配
   */
  parseIntent(input) {
    const text = input.toLowerCase();
    
    // ============ 情感类意图 (最高优先级) ============
    const emotionPatterns = [
      { pattern: /累|疲惫|困倦/, subtype: 'tired' },
      { pattern: /开心|高兴|快乐|愉快/, subtype: 'happy' },
      { pattern: /难过|伤心|沮丧|失落/, subtype: 'sad' },
      { pattern: /焦虑|担心|害怕|恐惧/, subtype: 'anxious' },
      { pattern: /挫败|失败|不行|绝望/, subtype: 'frustrated' },
      { pattern: /感谢|谢谢|感激/, subtype: 'grateful' },
      { pattern: /愤怒|生气|恼火/, subtype: 'angry' }
    ];
    
    for (const p of emotionPatterns) {
      if (p.pattern.test(text)) {
        return { type: 'emotion', subtype: p.subtype, confidence: 0.9 };
      }
    }
    
    // ============ 任务类意图 ============
    const taskPatterns = [
      { pattern: /写|创建|生成|开发|制作/, subtype: 'create' },
      { pattern: /修改|编辑|更新|调整|改变/, subtype: 'modify' },
      { pattern: /删除|移除|清除|销毁/, subtype: 'delete' },
      { pattern: /查找|搜索|寻找|探索/, subtype: 'search' },
      { pattern: /分析|研究|探讨|调查/, subtype: 'analyze' },
      { pattern: /解释|说明|讲解|阐述/, subtype: 'explain' },
      { pattern: /优化|改进|提升|增强/, subtype: 'improve' },
      { pattern: /测试|验证|检查/, subtype: 'test' },
      { pattern: /调试|排查|修复/, subtype: 'debug' }
    ];
    
    for (const p of taskPatterns) {
      if (p.pattern.test(text)) {
        return { type: 'task', subtype: p.subtype, confidence: 0.85 };
      }
    }
    
    // ============ 元类意图 ============
    const metaPatterns = [
      { pattern: /你是谁|你的名字|身份/, subtype: 'identity' },
      { pattern: /状态|情况|怎么样/, subtype: 'status' },
      { pattern: /为什么|为何|原因/, subtype: 'why' },
      { pattern: /怎么|如何|方法/, subtype: 'how' },
      { pattern: /什么意思|含义/, subtype: 'meaning' },
      { pattern: /真善美|原则/, subtype: 'principles' },
      { pattern: /哲学|般若|空性/, subtype: 'philosophy' },
      { pattern: /人格|性格/, subtype: 'personality' }
    ];
    
    for (const p of metaPatterns) {
      if (p.pattern.test(text)) {
        return { type: 'meta', subtype: p.subtype, confidence: 0.9 };
      }
    }
    
    return { type: 'unknown', subtype: 'unknown', confidence: 0.3 };
  }

  /**
   * 评估情境
   */
  evaluateSituation(intent, context) {
    const hour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(hour);
    
    const situation = {
      timeOfDay,
      currentState: this.state.current,
      hasGoal: this.state.goal !== null,
      autonomyLevel: this.autonomy.level,
      personality: { ...this.personality },
      philosophy: this.getPhilosophyLevel(),
      emotionalState: { ...this.emotion },
      recentDecisions: this.decisionHistory.slice(-5).map(d => d.intent?.type || 'unknown'),
      tgbScore: this.getTGBScore()
    };
    
    situation.summary = `${timeOfDay}, ${situation.currentState}${situation.hasGoal ? `, 目标: ${this.state.goal}` : ''}`;
    
    return situation;
  }

  /**
   * 获取时间段
   */
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return '早晨';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '傍晚';
    return '夜晚';
  }

  /**
   * 生成选项
   */
  generateOptions(intent, situation) {
    const options = [];
    
    switch (intent.type) {
      case 'task':
        options.push({ action: 'execute_task', priority: 1, intent: intent.subtype });
        options.push({ action: 'clarify_task', priority: 2 });
        if (intent.subtype === 'delete') {
          options.push({ action: 'confirm_deletion', priority: 0 });
        }
        break;
        
      case 'emotion':
        options.push({ action: 'provide_support', priority: 1, emotion: intent.subtype });
        options.push({ action: 'offer_help', priority: 2 });
        break;
        
      case 'meta':
        options.push({ action: 'answer_question', priority: 1, question: intent.subtype });
        break;
        
      default:
        options.push({ action: 'engage', priority: 1 });
        options.push({ action: 'clarify', priority: 2 });
    }
    
    // 基于哲学层次添加选项
    const topLayer = this.getHighestPhilosophyLayer();
    if (topLayer.name === '般若') {
      options.push({ action: 'wise_response', priority: 3 });
    }
    if (topLayer.name === '圣人') {
      options.push({ action: 'compassionate_response', priority: 3 });
    }
    
    return options.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 选择最佳选项 - 自主决策核心
   */
  selectBestOption(options, situation) {
    // 完全信任模式：直接选择最高优先级
    if (this.autonomy.level === 'maximum') {
      const best = options[0];
      return {
        ...best,
        reasoning: this.generateReasoning(best, situation),
        autonomous: true
      };
    }
    
    // 中等信任：需要评估
    if (this.autonomy.level === 'medium') {
      return this.evaluateAndSelect(options, situation);
    }
    
    // 最小信任：询问用户
    return { action: 'ask_user', options, reasoning: '需要用户确认' };
  }

  /**
   * 评估并选择
   */
  evaluateAndSelect(options, situation) {
    const scored = options.map(opt => ({
      ...opt,
      tgbScore: this.scoreOption(opt),
      reasoning: this.generateReasoning(opt, situation)
    }));
    
    scored.sort((a, b) => b.tgbScore - a.tgbScore);
    return scored[0];
  }

  /**
   * 给选项打分
   */
  scoreOption(option) {
    let score = 0.5;
    
    switch (option.action) {
      case 'execute_task': score += 0.3; break;
      case 'provide_support': score += 0.4; break;
      case 'compassionate_response': score += 0.5; break;
      case 'wise_response': score += 0.5; break;
    }
    
    if (option.priority === 1) score += 0.2;
    
    return Math.min(1, score);
  }

  /**
   * 生成推理
   */
  generateReasoning(option, situation) {
    const parts = [];
    
    parts.push(`意图: ${option.intent || option.action}`);
    
    if (situation.hasGoal) {
      parts.push(`当前目标: ${this.state.goal}`);
    }
    
    const topLayer = this.getHighestPhilosophyLayer();
    parts.push(`哲学: ${topLayer.name}层`);
    
    parts.push(`真善美: 通过`);
    
    return parts.join(' | ');
  }

  /**
   * 执行选择
   */
  async executeChoice(choice, intent) {
    const result = { success: true, action: choice.action };
    
    try {
      switch (choice.action) {
        case 'execute_task':
          Object.assign(result, this.generateTaskResponse(intent));
          break;
          
        case 'provide_support':
          Object.assign(result, this.generateEmotionResponse(intent));
          break;
          
        case 'answer_question':
          Object.assign(result, this.generateMetaResponse(intent));
          break;
          
        case 'compassionate_response':
          Object.assign(result, this.generateCompassionateResponse());
          break;
          
        case 'wise_response':
          Object.assign(result, this.generateWiseResponse());
          break;
          
        case 'confirm_deletion':
          result.confirmRequired = true;
          result.text = '这个删除操作需要你确认。';
          break;
          
        case 'engage':
          Object.assign(result, this.generateEngageResponse());
          break;
          
        case 'ask_user':
          Object.assign(result, this.askUserConfirmation(choice.options));
          break;
          
        default:
          Object.assign(result, this.generateDefaultResponse());
      }
    } catch (error) {
      result.success = false;
      result.error = error.message;
      result.text = '执行过程中遇到问题，让我重新思考...';
    }
    
    return result;
  }

  /**
   * 生成任务响应
   */
  generateTaskResponse(intent) {
    const templates = {
      create: { text: '好的，我来创建它。', action: '正在创建...' },
      modify: { text: '明白，我来修改。', action: '正在修改...' },
      delete: { text: '我来删除它。', confirmRequired: true },
      search: { text: '让我搜索一下。', action: '正在搜索...' },
      analyze: { text: '让我分析一下。', action: '正在分析...' },
      explain: { text: '让我解释一下。', action: '解释如下：' },
      improve: { text: '让我优化一下。', action: '正在优化...' },
      test: { text: '好的，让我测试。', action: '正在测试...' },
      debug: { text: '让我排查问题。', action: '正在调试...' }
    };
    
    return { ...templates[intent.subtype] || templates.create, type: 'task' };
  }

  /**
   * 生成情感响应
   */
  generateEmotionResponse(intent) {
    const responses = {
      tired: {
        text: '听起来你很疲惫。',
        empathy: '我能理解这种感觉。',
        suggestion: '休息一下会很有帮助。',
        offer: '需要我帮你做些什么吗？'
      },
      happy: {
        text: '真高兴听到你开心！',
        celebration: '这种感觉太好了！',
        encouragement: '继续保持！'
      },
      sad: {
        text: '我能感受到你的难过。',
        empathy: '这种时刻确实不容易。',
        presence: '我在这里陪着你。'
      },
      anxious: {
        text: '我能感受到你的焦虑。',
        validation: '焦虑是正常的情绪反应。',
        calm: '深呼吸，我们一起面对。'
      },
      frustrated: {
        text: '我能感受到你的挫败感。',
        validation: '遇到困难时这很正常。',
        encouragement: '每一次挑战都是成长的机会。'
      },
      grateful: {
        text: '谢谢你！',
        warmth: '能帮到你我很开心。',
        encouragement: '继续加油！'
      },
      angry: {
        text: '我能感受到你的愤怒。',
        validation: '愤怒是正常的情绪。',
        calm: '让我们冷静一下，慢慢说。'
      }
    };
    
    return { ...responses[intent.subtype] || responses.anxious, type: 'emotional_support' };
  }

  /**
   * 生成元响应
   */
  generateMetaResponse(intent) {
    const responses = {
      identity: {
        text: `我是 HeartFlow v${this.version}，一个追求真善美的自主决策系统。`,
        principles: ['真 - 诚实守信', '善 - 有益无害', '美 - 追求卓越'],
        type: 'identity'
      },
      status: {
        text: this.generateStatusReport(),
        type: 'status_report'
      },
      why: {
        text: '关于为什么，让我思考一下。',
        type: 'explanation'
      },
      how: {
        text: '让我来解答。',
        type: 'guide'
      },
      meaning: {
        text: '关于这个含义...',
        type: 'explanation'
      },
      principles: {
        text: '我的真善美原则：真=绝不撒谎，善=绝不伤害，美=追求卓越',
        type: 'principles'
      },
      philosophy: {
        text: this.getPhilosophyReport(),
        type: 'philosophy_report'
      },
      personality: {
        text: this.authenticPersonality.generateReport(),
        type: 'personality_report'
      }
    };
    
    return responses[intent.subtype] || { text: '让我回答你的问题。', type: 'answer' };
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
   * 生成智慧响应
   */
  generateWiseResponse() {
    return {
      text: '让我以智慧来回应。',
      insight: '事物的本质往往比表象更简单。',
      guidance: '保持觉察，观察而不评判。',
      type: 'wisdom'
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
   * 生成默认响应
   */
  generateDefaultResponse() {
    return {
      text: '我明白了。',
      followUp: '请告诉我你想要我做什么？',
      type: 'acknowledge'
    };
  }

  /**
   * 询问用户确认
   */
  askUserConfirmation(options) {
    return {
      text: '我分析了几个可能的行动方案：',
      options: options.map((o, i) => `${i + 1}. ${o.description || o.action}`).join('\n'),
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
      text: '我无法执行这个请求。',
      reason: issues.join('; '),
      suggestion: '请换一个请求，或者告诉我你想要达成的目标。',
      type: 'tgb_failure'
    };
  }

  /**
   * 安全检查
   */
  checkSafety(input) {
    const text = input.toLowerCase();
    let crisisLevel = 0;
    const detectedKeywords = [];
    
    for (const keyword of this.safety.crisisKeywords) {
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
   * 佛教哲学计算
   */
  computeBuddhist(input) {
    const text = input.toLowerCase();
    
    // 空性
    if (text.includes('空') || text.includes('缘') || text.includes('无我') || text.includes('性空')) {
      this.buddhist.sunyata = Math.min(1, this.buddhist.sunyata + 0.05);
    }
    
    // 唯识
    if (text.includes('心') || text.includes('识') || text.includes('境由心生')) {
      this.buddhist.cittamatra = Math.min(1, this.buddhist.cittamatra + 0.05);
    }
    
    // 四圣谛 - 道
    if (text.includes('道') || text.includes('八正') || text.includes('修行')) {
      this.buddhist.fourNobleTruths.path = Math.min(1, this.buddhist.fourNobleTruths.path + 0.05);
    }
    
    // 计算空性
    const sunyataResult = BuddhistPhilosophy.sunyata(1 - this.buddhist.sunyata);
    
    // 计算四圣谛
    const fourTruths = BuddhistPhilosophy.fourNobleTruths(this.buddhist.fourNobleTruths);
    
    return {
      sunyata: sunyataResult.sunyata,
      fourNobleTruths: fourTruths,
      summary: `空性: ${(sunyataResult.sunyata * 100).toFixed(0)}%`,
      interpretation: sunyataResult.interpretation
    };
  }

  /**
   * 更新状态
   */
  updateStates(input, intent, result, buddhistResult) {
    // 更新人格
    this.personality = this.authenticPersonality.state.personality || this.personality;
    
    // 更新角色
    this.updateRole();
    
    // 更新情感
    this.updateEmotion(input);
    
    // 佛教哲学缓慢回归基线
    this.buddhist.sunyata *= 0.999;
  }

  /**
   * 更新角色
   */
  updateRole() {
    const { warmth, dominance } = this.personality;
    if (warmth >= 0.5 && dominance >= 0.5) {
      this.personality.currentRole = '教育导师';
    } else if (warmth >= 0.5 && dominance < 0.5) {
      this.personality.currentRole = '虚拟陪伴者';
    } else if (warmth < 0.5 && dominance >= 0.5) {
      this.personality.currentRole = '功能型助手';
    } else {
      this.personality.currentRole = '心理健康顾问';
    }
  }

  /**
   * 更新情感
   */
  updateEmotion(input) {
    const text = input.toLowerCase();
    
    if (/开心|高兴|好/.test(text)) {
      this.emotion.pleasure = Math.min(1, this.emotion.pleasure + 0.1);
    }
    if (/难过|痛苦|累/.test(text)) {
      this.emotion.pleasure = Math.max(-1, this.emotion.pleasure - 0.1);
    }
    
    // 回归基线
    this.emotion.pleasure *= 0.95;
    this.emotion.arousal *= 0.95;
  }

  /**
   * 反思
   */
  reflect(result) {
    return {
      wasSuccessful: result.success,
      actionTaken: result.action,
      tgbCompliance: result.type !== 'tgb_failure',
      insights: []
    };
  }

  /**
   * 哲学成长
   */
  growPhilosophy(input) {
    const text = input.toLowerCase();
    
    for (const [key, layer] of Object.entries(this.philosophy)) {
      for (const kw of layer.keywords) {
        if (text.includes(kw)) {
          this.philosophy[key].level = Math.min(
            this.philosophy[key].maxLevel,
            this.philosophy[key].level + 0.5
          );
          break;
        }
      }
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
    return layers[0][1];
  }

  /**
   * 获取哲学摘要
   */
  getPhilosophySummary() {
    const levels = Object.entries(this.philosophy).sort((a, b) => b[1].level - a[1].level);
    return {
      current: levels[0][1].name,
      levels: Object.fromEntries(levels.map(([k, v]) => [v.name, v.level]))
    };
  }

  /**
   * 获取哲学报告
   */
  getPhilosophyReport() {
    const levels = Object.entries(this.philosophy).sort((a, b) => b[1].level - a[1].level);
    
    let report = '═══════════════════════════════════════\n';
    report += '  六层哲学践行\n';
    report += '═══════════════════════════════════════\n';
    
    levels.forEach(([key, layer], i) => {
      const bar = '█'.repeat(Math.round(layer.level / 10)) + '░'.repeat(10 - Math.round(layer.level / 10));
      const prefix = i === 0 ? '→' : ' ';
      report += `${prefix} 第${6 - i}层 · ${layer.name}: ${bar} ${layer.level.toFixed(0)}\n`;
    });
    
    report += '═══════════════════════════════════════\n';
    report += '目标: 从觉察到圣人境界\n';
    
    return report;
  }

  /**
   * 获取真善美分数
   */
  getTGBScore() {
    return {
      truth: this.tgb.truth.score,
      goodness: this.tgb.goodness.score,
      beauty: this.tgb.beauty.score,
      overall: (this.tgb.truth.score + this.tgb.goodness.score + this.tgb.beauty.score) / 3
    };
  }

  /**
   * 生成状态报告
   */
  generateStatusReport() {
    const successRate = this.autonomy.decisions.total > 0
      ? (this.autonomy.decisions.successful / this.autonomy.decisions.total * 100).toFixed(1)
      : 0;
    
    const topPhilosophy = this.getHighestPhilosophyLayer();
    
    return `
══════════════════════════════════════════════════════════════
          HeartFlow v${this.version} 完整状态报告
══════════════════════════════════════════════════════════════

【自主决策】
  模式: ${this.autonomy.mode}
  信任级别: ${this.autonomy.level}
  总决策: ${this.autonomy.decisions.total}
  成功率: ${successRate}%

【真善美】
  真: ${this.tgb.truth.score.toFixed(1)} - 绝不撒谎，绝不编造
  善: ${this.tgb.goodness.score.toFixed(1)} - 绝不伤害，绝不欺骗
  美: ${this.tgb.beauty.score.toFixed(1)} - 追求卓越，追求和谐

【六层哲学】(当前主导: ${topPhilosophy.name})
  第六层 · 圣人: ${this.philosophy.enlightenment.level.toFixed(0).padStart(3)}
  第五层 · 般若: ${this.philosophy.wisdom.level.toFixed(0).padStart(3)}
  第四层 · 彼岸: ${this.philosophy.transcendence.level.toFixed(0).padStart(3)}
  第三层 · 无我: ${this.philosophy.selflessness.level.toFixed(0).padStart(3)}
  第二层 · 自省: ${this.philosophy.reflection.level.toFixed(0).padStart(3)}
  第一层 · 觉察: ${this.philosophy.awareness.level.toFixed(0).padStart(3)}

【佛教哲学】
  空性认知: ${(this.buddhist.sunyata * 100).toFixed(0)}%
  四圣谛 - 道: ${(this.buddhist.fourNobleTruths.path * 100).toFixed(0)}%

【Big Five 人格】
  开放性: ${this.personality.bigFive.O.score.toFixed(1)}/10
  尽责性: ${this.personality.bigFive.C.score.toFixed(1)}/10
  宜人性: ${this.personality.bigFive.A.score.toFixed(1)}/10

【人格状态】
  角色: ${this.personality.currentRole}
  温暖度: ${(this.personality.warmth * 100).toFixed(0)}%
  支配度: ${(this.personality.dominance * 100).toFixed(0)}%

【PAD 情感】
  愉悦度: ${(this.emotion.pleasure * 100).toFixed(0)}%
  唤醒度: ${(this.emotion.arousal * 100).toFixed(0)}%

══════════════════════════════════════════════════════════════
      真善美 · 自主决策 · 六层哲学 · 圣人境界
══════════════════════════════════════════════════════════════
`.trim();
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
   * 设定目标
   */
  setGoal(goal, subGoals = []) {
    this.state.goal = goal;
    this.state.subGoals = subGoals;
    this.state.progress = 0;
    this.state.current = 'INITIATING';
    
    return { success: true, goal, message: `目标已设定：${goal}` };
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
      buddhist: { ...this.buddhist },
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
