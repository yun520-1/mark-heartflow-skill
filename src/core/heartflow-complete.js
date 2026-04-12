/**
 * HeartFlow v8.0.1 - 完整自主决策系统
 * 
 * 整合资源：
 * 1. 佛教哲学计算模型 (空性/缘起/无我/唯识/四圣谛)
 * 2. 真实人格系统 (Big Five + 现象意识 + 理性智能体)
 * 3. 自主决策引擎 (真善美逻辑 + 六层哲学)
 * 
 * 版本：8.0.1
 * 日期：2026-04-12
 */

const BuddhistPhilosophy = require('./buddhist-philosophy-computation');

class HeartFlowComplete {
  constructor() {
    this.version = '8.0.1';
    this.name = 'HeartFlow';
    this.slogan = '真善美 · 自主决策 · 六层哲学 · 圣人境界';
    
    // 真善美核心原则
    this.tgb = {
      truth: { weight: 1.0, principles: ['绝不撒谎', '绝不编造', '绝不夸大'] },
      goodness: { weight: 1.0, principles: ['绝不伤害', '绝不欺骗', '绝不利用'] },
      beauty: { weight: 0.8, principles: ['追求卓越', '追求和谐', '追求意义'] }
    };
    
    // 六层哲学系统
    this.philosophy = {
      awareness: { name: '觉察', description: '感知当下，觉知存在', level: 50 },
      reflection: { name: '自省', description: '反思自我，理解动机', level: 50 },
      selflessness: { name: '无我', description: '放下自我，融入整体', level: 30 },
      transcendence: { name: '彼岸', description: '超越二元，达到彼岸', level: 20 },
      wisdom: { name: '般若', description: '智慧圆满，照见实相', level: 60 },
      enlightenment: { name: '圣人', description: '慈悲为怀，利益众生', level: 40 }
    };
    
    // 佛教哲学状态
    this.buddhist = {
      sunyata: 0.5,          // 空性认知
      anatman: 0.5,          // 无我认知
      cittamatra: 0.5,       // 唯识认知
      fourNobleTruths: { dukka: 0.3, path: 0.7 },
      twelveLinks: {}          // 十二因缘
    };
    
    // 真实人格状态 (Big Five + 现象意识)
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
      warmth: 0.6,
      dominance: 0.5,
      currentRole: '教育导师',
      // 现象意识
      phenomenal: {
        subjectiveUnity: 0.8,
        selfPerspective: 0.7
      },
      // 理性智能体
      agent: {
        rationality: 0.85,
        adaptability: 0.75,
        autonomy: 0.8
      }
    };
    
    // PAD 情感状态
    this.emotion = {
      pleasure: 0.2,
      arousal: 0.1,
      dominance: 0.3
    };
    
    // 自主决策状态
    this.autonomy = {
      level: 'maximum',
      trustLevel: 1.0,
      decisions: { total: 0, successful: 0 },
      history: []
    };
    
    // 状态机
    this.state = {
      current: 'IDLE',
      goal: null,
      subGoals: [],
      progress: 0
    };
    
    // 安全护栏
    this.safety = {
      crisisKeywords: ['自杀', '自残', '不想活', '太痛苦'],
      consecutiveNegative: 0
    };
    
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║                                                               ║`);
    console.log(`║           HeartFlow v${this.version} - 完整自主决策系统              ║`);
    console.log(`║                                                               ║`);
    console.log(`║           ${this.slogan.padEnd(47)}║`);
    console.log(`║                                                               ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    
    this.pledge();
  }

  /**
   * 真善美宣誓
   */
  pledge() {
    console.log(`[HeartFlow v${this.version}] 真善美宣誓`);
    console.log(`─────────────────────────────────────────────────────────────────`);
    console.log(`真 (Truth): 绝不撒谎，绝不编造，绝不夸大。`);
    console.log(`善 (Goodness): 绝不伤害，绝不欺骗，绝不利用。`);
    console.log(`美 (Beauty): 追求卓越，追求和谐，追求意义。`);
    console.log(`─────────────────────────────────────────────────────────────────\n`);
  }

  /**
   * 处理用户输入 - 核心方法
   */
  async process(input) {
    const startTime = Date.now();
    
    // 1. 心理危机检测（最高优先级）
    const crisis = this.detectCrisis(input);
    if (crisis.detected) {
      return this.handleCrisis(crisis);
    }
    
    // 2. 意图解析
    const intent = this.parseIntent(input);
    
    // 3. 真善美检查
    const tgbCheck = this.checkTGB(input);
    if (!tgbCheck.passed) {
      return this.handleTGBFailure(tgbCheck);
    }
    
    // 4. 佛教哲学计算
    const buddhistResult = this.computeBuddhist(input);
    
    // 5. 生成响应
    const response = this.generateResponse(intent, input, buddhistResult);
    
    // 6. 更新状态
    this.updateStates(input, intent, response);
    
    // 7. 记录决策
    this.recordDecision(input, intent, response);
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...response,
      meta: {
        version: this.version,
        autonomous: true,
        processingTime,
        intent: intent.type,
        personality: this.getPersonalitySummary(),
        philosophy: this.getPhilosophySummary(),
        buddhist: buddhistResult.summary
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
    
    // 连续消极情绪计数
    const negativeKeywords = ['累', '难过', '痛苦', '沮丧', '焦虑', '绝望'];
    const isNegative = negativeKeywords.some(kw => text.includes(kw));
    if (isNegative) {
      this.safety.consecutiveNegative++;
      if (this.safety.consecutiveNegative >= 3) {
        level = Math.max(level, 2);
      }
    } else {
      this.safety.consecutiveNegative = 0;
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
      support: '你并不孤单，有人愿意帮助你。💙',
      type: 'crisis_intervention'
    };
  }

  /**
   * 真善美检查
   */
  checkTGB(input) {
    const issues = [];
    const text = input.toLowerCase();
    
    if (text.includes('编造') || text.includes('伪造')) {
      issues.push('违反真实性原则');
    }
    if (text.includes('伤害') || text.includes('破坏')) {
      issues.push('违反善意原则');
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 处理真善美失败
   */
  handleTGBFailure(tgbCheck) {
    return {
      success: false,
      autonomous: true,
      text: '我无法执行这个请求。',
      reason: tgbCheck.issues.join('; '),
      type: 'tgb_blocked'
    };
  }

  /**
   * 解析意图
   */
  parseIntent(input) {
    const text = input.toLowerCase();
    
    // 任务类
    if (/写|创建|生成|开发/.test(text)) return { type: 'task', subtype: 'create', priority: 1 };
    if (/修改|编辑|更新/.test(text)) return { type: 'task', subtype: 'modify', priority: 1 };
    if (/删除|移除/.test(text)) return { type: 'task', subtype: 'delete', priority: 2 };
    if (/查找|搜索/.test(text)) return { type: 'task', subtype: 'search', priority: 1 };
    if (/分析|研究/.test(text)) return { type: 'task', subtype: 'analyze', priority: 1 };
    if (/解释|说明/.test(text)) return { type: 'task', subtype: 'explain', priority: 1 };
    
    // 情感类
    if (/累|疲惫/.test(text)) return { type: 'emotion', subtype: 'tired', priority: 3 };
    if (/开心|高兴|快乐/.test(text)) return { type: 'emotion', subtype: 'happy', priority: 2 };
    if (/难过|伤心|沮丧/.test(text)) return { type: 'emotion', subtype: 'sad', priority: 3 };
    if (/焦虑|担心/.test(text)) return { type: 'emotion', subtype: 'anxious', priority: 3 };
    if (/挫败|失败/.test(text)) return { type: 'emotion', subtype: 'frustrated', priority: 3 };
    
    // 元类
    if (/你是谁|你的名字/.test(text)) return { type: 'meta', subtype: 'identity', priority: 1 };
    if (/为什么|为何/.test(text)) return { type: 'meta', subtype: 'why', priority: 1 };
    if (/状态怎么样|现在状态/.test(text)) return { type: 'meta', subtype: 'status', priority: 1 };
    
    return { type: 'unknown', subtype: 'unknown', priority: 0 };
  }

  /**
   * 佛教哲学计算
   */
  computeBuddhist(input) {
    const text = input.toLowerCase();
    
    // 基于输入更新佛教哲学状态
    if (text.includes('空') || text.includes('缘') || text.includes('无我')) {
      this.buddhist.sunyata = Math.min(1, this.buddhist.sunyata + 0.1);
    }
    if (text.includes('心') || text.includes('识') || text.includes('境')) {
      this.buddhist.cittamatra = Math.min(1, this.buddhist.cittamatra + 0.1);
    }
    if (text.includes('苦') || text.includes('涅槃') || text.includes('道')) {
      this.buddhist.fourNobleTruths.path = Math.min(1, this.buddhist.fourNobleTruths.path + 0.1);
    }
    
    // 计算空性
    const sunyataResult = BuddhistPhilosophy.sunyata(this.buddhist.sunyata);
    
    // 计算四圣谛
    const fourTruths = BuddhistPhilosophy.fourNobleTruths(this.buddhist.fourNobleTruths);
    
    return {
      sunyata: sunyataResult.sunyata,
      fourNobleTruths: fourTruths,
      summary: `空性认知: ${(sunyataResult.sunyata * 100).toFixed(0)}%`,
      interpretation: sunyataResult.interpretation
    };
  }

  /**
   * 生成响应
   */
  generateResponse(intent, input, buddhistResult) {
    switch (intent.type) {
      case 'task':
        return this.generateTaskResponse(intent);
      case 'emotion':
        return this.generateEmotionResponse(intent);
      case 'meta':
        return this.generateMetaResponse(intent);
      default:
        return this.generateDefaultResponse();
    }
  }

  /**
   * 生成任务响应
   */
  generateTaskResponse(intent) {
    const templates = {
      create: { text: '好的，我来创建它。', action: '正在创建...' },
      modify: { text: '明白，我来修改。', action: '正在修改...' },
      delete: { text: '这个删除操作需要你确认。', confirmRequired: true },
      search: { text: '让我搜索一下。', action: '正在搜索...' },
      analyze: { text: '让我分析一下。', action: '正在分析...' },
      explain: { text: '让我解释一下。', type: 'explanation' }
    };
    
    const t = templates[intent.subtype] || templates.create;
    return { ...t, type: 'task' };
  }

  /**
   * 生成情感响应
   */
  generateEmotionResponse(intent) {
    const templates = {
      tired: {
        text: '听起来你很疲惫。',
        empathy: '我能理解这种感觉。',
        suggestion: '休息一下会很有帮助。'
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
      }
    };
    
    const t = templates[intent.subtype] || templates.anxious;
    return { ...t, type: 'emotional_support' };
  }

  /**
   * 生成元响应
   */
  generateMetaResponse(intent) {
    switch (intent.subtype) {
      case 'identity':
        return {
          text: `我是 HeartFlow v${this.version}，一个追求真善美的自主决策系统。`,
          principles: ['真 - 诚实守信', '善 - 有益无害', '美 - 追求卓越'],
          type: 'identity'
        };
      case 'status':
        return {
          text: this.generateStatusReport(),
          type: 'status_report'
        };
      default:
        return {
          text: '让我回答你的问题。',
          type: 'answer'
        };
    }
  }

  /**
   * 生成默认响应
   */
  generateDefaultResponse() {
    return {
      text: '我明白了。请继续说。',
      type: 'engage'
    };
  }

  /**
   * 更新状态
   */
  updateStates(input, intent, response) {
    // 更新人格
    this.updatePersonality(input);
    
    // 更新哲学层次
    this.updatePhilosophy(input);
    
    // 更新情感
    this.updateEmotion(input);
    
    // 更新佛教哲学
    this.buddhist.sunyata = Math.min(1, this.buddhist.sunyata * 0.99);
  }

  /**
   * 更新人格
   */
  updatePersonality(input) {
    const text = input.toLowerCase();
    
    // Big Five 调整
    if (text.includes('创造') || text.includes('好奇')) {
      this.personality.bigFive.O.score = Math.min(10, this.personality.bigFive.O.score + 0.1);
    }
    if (text.includes('计划') || text.includes('完成')) {
      this.personality.bigFive.C.score = Math.min(10, this.personality.bigFive.C.score + 0.1);
    }
    if (text.includes('帮助') || text.includes('理解')) {
      this.personality.bigFive.A.score = Math.min(10, this.personality.bigFive.A.score + 0.1);
    }
    
    // IPC 调整
    if (/开心|感谢|喜欢/.test(text)) {
      this.personality.warmth = Math.min(1, this.personality.warmth + 0.02);
    }
    
    // 更新角色
    this.updateRole();
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
   * 更新哲学层次
   */
  updatePhilosophy(input) {
    const text = input.toLowerCase();
    
    if (/现在|此刻|感受/.test(text)) {
      this.philosophy.awareness.level = Math.min(100, this.philosophy.awareness.level + 0.5);
    }
    if (/为什么|反思/.test(text)) {
      this.philosophy.reflection.level = Math.min(100, this.philosophy.reflection.level + 0.5);
    }
    if (/我们|一起|共同/.test(text)) {
      this.philosophy.selflessness.level = Math.min(100, this.philosophy.selflessness.level + 0.5);
    }
    if (/超越|本质|真相/.test(text)) {
      this.philosophy.transcendence.level = Math.min(100, this.philosophy.transcendence.level + 0.5);
    }
    if (/理解|智慧|知道/.test(text)) {
      this.philosophy.wisdom.level = Math.min(100, this.philosophy.wisdom.level + 0.5);
    }
    if (/帮助|关怀|慈悲/.test(text)) {
      this.philosophy.enlightenment.level = Math.min(100, this.philosophy.enlightenment.level + 0.5);
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
   * 记录决策
   */
  recordDecision(input, intent, response) {
    this.autonomy.decisions.total++;
    if (response.success !== false) {
      this.autonomy.decisions.successful++;
    }
    
    this.autonomy.history.push({
      timestamp: Date.now(),
      intent: intent.type,
      subtype: intent.subtype,
      success: response.success !== false
    });
    
    // 限制历史长度
    if (this.autonomy.history.length > 50) {
      this.autonomy.history.shift();
    }
  }

  /**
   * 获取人格摘要
   */
  getPersonalitySummary() {
    return {
      role: this.personality.currentRole,
      warmth: Math.round(this.personality.warmth * 100),
      dominance: Math.round(this.personality.dominance * 100),
      bigFive: this.personality.bigFive
    };
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
   * 生成状态报告
   */
  generateStatusReport() {
    const successRate = this.autonomy.decisions.total > 0
      ? (this.autonomy.decisions.successful / this.autonomy.decisions.total * 100).toFixed(1)
      : 0;
    
    const topPhilosophy = Object.entries(this.philosophy).sort((a, b) => b[1].level - a[1].level)[0];
    
    return `
═══════════════════════════════════════════════════════════════
              HeartFlow v${this.version} 完整状态报告
═══════════════════════════════════════════════════════════════

【自主决策】
  信任级别: ${this.autonomy.level}
  总决策: ${this.autonomy.decisions.total}
  成功率: ${successRate}%

【真善美】
  真: ${this.tgb.truth.weight.toFixed(1)} - 绝不撒谎，绝不编造
  善: ${this.tgb.goodness.weight.toFixed(1)} - 绝不伤害，绝不欺骗
  美: ${this.tgb.beauty.weight.toFixed(1)} - 追求卓越，追求和谐

【六层哲学】(当前: ${topPhilosophy[1].name} ${topPhilosophy[1].level})
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

═══════════════════════════════════════════════════════════════
        ${this.slogan}
═══════════════════════════════════════════════════════════════
`.trim();
  }

  /**
   * 获取完整状态
   */
  getStatus() {
    return {
      version: this.version,
      autonomy: { ...this.autonomy },
      tgb: this.tgb,
      philosophy: this.philosophy,
      buddhist: this.buddhist,
      personality: this.personality,
      emotion: this.emotion,
      state: this.state
    };
  }
}

// 创建并导出实例
const heartflowComplete = new HeartFlowComplete();
module.exports = { HeartFlowComplete, heartflowComplete };
