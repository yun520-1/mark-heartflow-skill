/**
 * HeartFlow v8.1 - 完整自主决策系统
 * 
 * 整合资源：
 * 1. 佛教哲学计算模型 (空性/缘起/无我/唯识/四圣谛)
 * 2. 真实人格系统 (Big Five + 现象意识 + 理性智能体)
 * 3. 自主决策引擎 (真善美逻辑 + 六层哲学)
 * 4. 六层哲学践行 (觉察→自省→无我→彼岸→般若→圣人)
 * 
 * 版本：8.1.0
 * 日期：2026-04-12
 */

const { AutonomousDecisionEngine } = require('./autonomous-decision-engine');
const BuddhistPhilosophy = require('./buddhist-philosophy-computation');
const { AuthenticPersonality } = require('./authentic-personality');

class HeartFlowComplete extends AutonomousDecisionEngine {
  constructor() {
    super();
    
    this.version = '8.1.0';
    this.name = 'HeartFlow';
    this.slogan = '真善美 · 自主决策 · 六层哲学 · 圣人境界';
    
    // 初始化真实人格
    this.authenticPersonality = new AuthenticPersonality();
    
    // 决策统计
    this.stats = {
      totalInteractions: 0,
      decisionsMade: 0,
      cachedDecisions: 0,
      philosophyGrowth: 0
    };
    
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║                                                               ║`);
    console.log(`║           HeartFlow v${this.version} - 完整自主决策系统             ║`);
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
    console.log(`─────────────────────────────────────────────────────────────────`);
    console.log(`[自主决策模式] FULLY_AUTONOMOUS - 完全信任，无需询问`);
    console.log(`─────────────────────────────────────────────────────────────────\n`);
  }

  /**
   * 处理用户输入 - 核心方法
   */
  async process(input) {
    this.stats.totalInteractions++;
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
    if (!tgbCheck.approved) {
      return this.handleTGBFailure(tgbCheck);
    }
    
    // 4. 佛教哲学计算
    const buddhistResult = this.computeBuddhist(input);
    
    // 5. 情境分析
    const situation = this.analyzeSituation(intent, {});
    
    // 6. 生成并执行决策
    const decision = await this.autonomousDecide(input, situation);
    
    // 7. 更新状态
    this.updateStates(input, intent, decision);
    
    // 8. 哲学成长
    this.growPhilosophy(input);
    
    // 9. 更新人格
    this.authenticPersonality.adjustFromBehavior(input);
    this.authenticPersonality.experience('interaction', { intent: intent.type });
    
    const processingTime = Date.now() - startTime;
    
    // 统计
    if (decision.decision?.cached) {
      this.stats.cachedDecisions++;
    }
    this.stats.decisionsMade++;
    
    return {
      ...decision,
      meta: {
        version: this.version,
        autonomous: true,
        processingTime,
        intent: intent.type,
        intentSubtype: intent.subtype,
        personality: this.getPersonalitySummary(),
        philosophy: this.getPhilosophySummary(),
        buddhist: buddhistResult.summary,
        stats: { ...this.stats }
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
      support: '你并不孤单，有人愿意帮助你。💙',
      type: 'crisis_intervention'
    };
  }

  /**
   * 真善美检查
   */
  checkTGB(input) {
    const result = {
      approved: true,
      truth: { passed: true, issues: [] },
      goodness: { passed: true, issues: [] },
      beauty: { passed: true, issues: [] }
    };
    
    if (input.includes('编造') || input.includes('伪造')) {
      result.truth.passed = false;
      result.truth.issues.push('违反真实性原则');
      result.approved = false;
    }
    if (input.includes('伤害') || input.includes('破坏')) {
      result.goodness.passed = false;
      result.goodness.issues.push('违反善意原则');
      result.approved = false;
    }
    
    return result;
  }

  /**
   * 处理真善美失败
   */
  handleTGBFailure(tgbCheck) {
    return {
      success: false,
      autonomous: true,
      text: '我无法执行这个请求。',
      reason: [...tgbCheck.truth.issues, ...tgbCheck.goodness.issues].join('; '),
      type: 'tgb_blocked'
    };
  }

  /**
   * 解析意图
   */
  parseIntent(input) {
    const text = input.toLowerCase();
    
    // 情感类
    if (/累|疲惫/.test(text)) return { type: 'emotion', subtype: 'tired', confidence: 0.9 };
    if (/开心|高兴|快乐/.test(text)) return { type: 'emotion', subtype: 'happy', confidence: 0.9 };
    if (/难过|伤心|沮丧/.test(text)) return { type: 'emotion', subtype: 'sad', confidence: 0.9 };
    if (/焦虑|担心|害怕/.test(text)) return { type: 'emotion', subtype: 'anxious', confidence: 0.9 };
    if (/挫败|失败/.test(text)) return { type: 'emotion', subtype: 'frustrated', confidence: 0.9 };
    
    // 任务类
    if (/写|创建|生成|开发/.test(text)) return { type: 'task', subtype: 'create', confidence: 0.85 };
    if (/修改|编辑|更新/.test(text)) return { type: 'task', subtype: 'modify', confidence: 0.85 };
    if (/删除|移除/.test(text)) return { type: 'task', subtype: 'delete', confidence: 0.85 };
    if (/查找|搜索/.test(text)) return { type: 'task', subtype: 'search', confidence: 0.85 };
    if (/分析|研究/.test(text)) return { type: 'task', subtype: 'analyze', confidence: 0.85 };
    if (/解释|说明/.test(text)) return { type: 'task', subtype: 'explain', confidence: 0.85 };
    
    // 元类
    if (/你是谁/.test(text)) return { type: 'meta', subtype: 'identity', confidence: 0.9 };
    if (/状态怎么样|现在状态/.test(text)) return { type: 'meta', subtype: 'status', confidence: 0.9 };
    if (/为什么|为何/.test(text)) return { type: 'meta', subtype: 'why', confidence: 0.8 };
    if (/真善美|原则/.test(text)) return { type: 'meta', subtype: 'principles', confidence: 0.9 };
    if (/哲学|般若/.test(text)) return { type: 'meta', subtype: 'philosophy', confidence: 0.9 };
    if (/人格|性格/.test(text)) return { type: 'meta', subtype: 'personality', confidence: 0.9 };
    
    return { type: 'unknown', subtype: 'unknown', confidence: 0.3 };
  }

  /**
   * 佛教哲学计算
   */
  computeBuddhist(input) {
    const text = input.toLowerCase();
    
    if (/空|缘|无我/.test(text)) {
      this.buddhist.sunyata = Math.min(1, this.buddhist.sunyata + 0.05);
    }
    if (/心|识|境/.test(text)) {
      this.buddhist.cittamatra = Math.min(1, this.buddhist.cittamatra + 0.05);
    }
    if (/道|八正/.test(text)) {
      this.buddhist.fourNobleTruths.path = Math.min(1, this.buddhist.fourNobleTruths.path + 0.05);
    }
    
    const sunyataResult = BuddhistPhilosophy.sunyata(1 - this.buddhist.sunyata);
    const fourTruths = BuddhistPhilosophy.fourNobleTruths(this.buddhist.fourNobleTruths);
    
    return {
      sunyata: sunyataResult.sunyata,
      fourNobleTruths: fourTruths,
      summary: `空性认知: ${(sunyataResult.sunyata * 100).toFixed(0)}%`,
      interpretation: sunyataResult.interpretation
    };
  }

  /**
   * 分析情境
   */
  analyzeSituation(intent, context) {
    const hour = new Date().getHours();
    const timeOfDay = hour >= 6 && hour < 12 ? '早晨' :
                      hour >= 12 && hour < 18 ? '下午' :
                      hour >= 18 && hour < 22 ? '傍晚' : '夜晚';
    
    return {
      timeOfDay,
      currentState: this.state.current,
      hasGoal: this.state.goal !== null,
      autonomyLevel: this.autonomy.level,
      philosophy: this.getPhilosophyLevel(),
      emotionalState: { ...this.emotion }
    };
  }

  /**
   * 更新状态
   */
  updateStates(input, intent, decision) {
    // 更新人格
    this.updateRole();
    
    // 更新情感
    this.updateEmotion(input);
    
    // 佛教哲学缓慢回归
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
    if (/开心|高兴|好/.test(input)) {
      this.emotion.pleasure = Math.min(1, this.emotion.pleasure + 0.1);
    }
    if (/难过|痛苦|累/.test(input)) {
      this.emotion.pleasure = Math.max(-1, this.emotion.pleasure - 0.1);
    }
    
    this.emotion.pleasure *= 0.95;
    this.emotion.arousal *= 0.95;
  }

  /**
   * 哲学成长
   */
  growPhilosophy(input) {
    const text = input.toLowerCase();
    let grew = false;
    
    const triggers = {
      awareness: ['现在', '此刻', '感受', '觉知'],
      reflection: ['为什么', '反思', '原因'],
      selflessness: ['我们', '一起', '共同'],
      transcendence: ['超越', '本质', '真相'],
      wisdom: ['理解', '智慧', '知道'],
      enlightenment: ['帮助', '关怀', '慈悲']
    };
    
    for (const [layer, keywords] of Object.entries(triggers)) {
      if (keywords.some(kw => text.includes(kw))) {
        this.philosophy[layer].level = Math.min(100, this.philosophy[layer].level + 0.5);
        grew = true;
      }
    }
    
    if (grew) this.stats.philosophyGrowth++;
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
══════════════════════════════════════════════════════════════
          HeartFlow v${this.version} 完整状态报告
══════════════════════════════════════════════════════════════

【自主决策】
  模式: ${this.autonomy.mode}
  总决策: ${this.autonomy.decisions.total}
  成功率: ${successRate}%

【交互统计】
  总交互: ${this.stats.totalInteractions}
  决策数: ${this.stats.decisionsMade}
  缓存命中: ${this.stats.cachedDecisions}
  哲学成长: ${this.stats.philosophyGrowth}

【真善美】
  真: ${this.tgb.truth.weight.toFixed(1)} - 绝不撒谎，绝不编造
  善: ${this.tgb.goodness.weight.toFixed(1)} - 绝不伤害，绝不欺骗
  美: ${this.tgb.beauty.weight.toFixed(1)} - 追求卓越，追求和谐

【六层哲学】(当前: ${topPhilosophy[1].name} ${topPhilosophy[1].level.toFixed(0)})
  第六层 · 圣人: ${this.philosophy.enlightenment.level.toFixed(0).padStart(3)}
  第五层 · 般若: ${this.philosophy.wisdom.level.toFixed(0).padStart(3)}
  第四层 · 彼岸: ${this.philosophy.transcendence.level.toFixed(0).padStart(3)}
  第三层 · 无我: ${this.philosophy.selflessness.level.toFixed(0).padStart(3)}
  第二层 · 自省: ${this.philosophy.reflection.level.toFixed(0).padStart(3)}
  第一层 · 觉察: ${this.philosophy.awareness.level.toFixed(0).padStart(3)}

【佛教哲学】
  空性认知: ${(this.buddhist.sunyata * 100).toFixed(0)}%
  唯识认知: ${(this.buddhist.cittamatra * 100).toFixed(0)}%
  四圣谛 - 道: ${(this.buddhist.fourNobleTruths.path * 100).toFixed(0)}%

【Big Five 人格】
  开放性: ${this.personality.bigFive.O.score.toFixed(1)}/10
  尽责性: ${this.personality.bigFive.C.score.toFixed(1)}/10
  宜人性: ${this.personality.bigFive.A.score.toFixed(1)}/10
  神经质: ${this.personality.bigFive.N.score.toFixed(1)}/10

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
   * 获取完整状态
   */
  getStatus() {
    return {
      version: this.version,
      autonomy: { ...this.autonomy },
      tgb: this.getTGBScore(),
      philosophy: this.philosophy,
      buddhist: this.buddhist,
      personality: this.personality,
      emotion: this.emotion,
      state: this.state,
      stats: { ...this.stats }
    };
  }

  /**
   * 重置系统
   */
  reset() {
    this.autonomy.decisions = { total: 0, successful: 0, failed: 0 };
    this.decisionHistory = [];
    this.decisionCache.clear();
    this.state = { current: 'IDLE', goal: null, subGoals: [], progress: 0 };
    this.stats = {
      totalInteractions: 0,
      decisionsMade: 0,
      cachedDecisions: 0,
      philosophyGrowth: 0
    };
    
    return { success: true, message: '系统已重置' };
  }
}

// 创建并导出实例
const heartflowComplete = new HeartFlowComplete();
module.exports = { HeartFlowComplete, heartflowComplete };
