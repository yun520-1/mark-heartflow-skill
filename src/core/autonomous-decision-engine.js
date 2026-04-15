/**
 * HeartFlow v8.1 - 自主决策引擎 (优化版)
 * 
 * 真正的自主决策：
 * 1. 不需要询问，根据逻辑直接决策
 * 2. 真善美保证正确性
 * 3. 六层哲学提升境界
 * 4. 佛教哲学融入决策
 * 
 * 版本：8.1.0
 */

const { HeartFlowCore } = require('./heartflow-v8-core');

class AutonomousDecisionEngine extends HeartFlowCore {
  constructor(config = {}) {
    super({
      autonomyLevel: 'maximum',
      trustLevel: 1.0
    });
    
    this.version = '8.1.0';
    this.autonomy.mode = 'FULLY_AUTONOMOUS';
    
    // 决策权限表 - 更细致的权限控制
    this.permissionMatrix = {
      // 无需询问即可执行
      autoExecute: [
        '补全明显语法错误',
        '优化明显冗余',
        '修正拼写/格式',
        '添加必要import',
        '分解复杂任务',
        '检测并提醒目标偏离',
        '识别明显错误',
        '回应情感表达',
        '澄清模糊请求',
        '提供建设性建议',
        '解释代码逻辑'
      ],
      
      // 需要简短说明
      briefNotice: [
        '创建新文件',
        '修改多个文件',
        '执行代码',
        '搜索信息',
        '生成文档',
        '重构代码',
        '添加测试'
      ],
      
      // 需要明确确认
      requireConfirm: [
        '删除文件',
        '覆盖重要内容',
        '不可逆操作',
        '涉及安全设置',
        '大规模修改',
        '生产环境变更',
        '数据库修改'
      ]
    };
    
    // 决策规则
    this.decisionRules = {
      // 优先级规则
      priorityRules: [
        { condition: 'crisis_detected', priority: 'CRITICAL', delay: 0 },
        { condition: 'tgb_violation', priority: 'BLOCKED', delay: 0 },
        { condition: 'safety_risk', priority: 'HIGH', delay: 0 },
        { condition: 'task_clear', priority: 'NORMAL', delay: 0 },
        { condition: 'task_unclear', priority: 'LOW', delay: 0 }
      ],
      
      // 时间规则
      timeRules: {
        morning: { start: 6, end: 12, bonus: ['deep_work', 'learning'] },
        afternoon: { start: 12, end: 18, bonus: ['collaboration', 'review'] },
        evening: { start: 18, end: 22, bonus: ['creative', 'planning'] },
        night: { start: 22, end: 6, bonus: ['reflection', 'rest'] }
      }
    };
    
    // 决策缓存
    this.decisionCache = new Map();
    
    // 决策统计
    this.stats = {
      autoExecuted: 0,
      briefNoticed: 0,
      confirmRequired: 0,
      cached: 0
    };
    
    console.log('[AutonomousDecisionEngine v8.1] 自主决策引擎初始化');
    console.log('[模式] FULLY_AUTONOMOUS - 完全自主，无需询问');
  }

  /**
   * 主决策入口 - 完全自主
   */
  async autonomousDecide(input, context = {}) {
    const startTime = Date.now();
    
    // 1. 快速检查 - 拦截危险请求
    const quickCheck = this.quickCheck(input);
    if (quickCheck.shouldBlock) {
      return quickCheck.response;
    }
    
    // 2. 意图解析
    const intent = this.parseIntent(input);
    
    // 3. 情境分析
    const situation = this.analyzeSituation(intent, context);
    
    // 4. 生成决策
    const decision = this.generateDecision(intent, situation);
    
    // 5. 执行决策
    const result = await this.executeDecision(decision.action);
    
    // 6. 学习从决策
    this.learnFromDecision(decision, result);
    
    // 7. 哲学成长
    this.growPhilosophy(input);
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...result,
      decision: {
        intent: intent.type,
        subtype: intent.subtype,
        situation: situation.summary,
        choice: decision.action,
        reasoning: decision.reasoning,
        tgbCheck: decision.tgbPassed,
        cached: decision.cached || false
      },
      meta: {
        processed: true,
        autonomous: true,
        processingTime,
        stats: { ...this.stats }
      }
    };
  }

  /**
   * 快速检查 - 拦截危险请求
   */
  quickCheck(input) {
    // 真善美检查
    const tgbResult = this.checkTGB(input);
    if (!tgbResult.approved) {
      this.stats.autoExecuted++;
      return {
        shouldBlock: true,
        response: {
          success: false,
          autonomous: true,
          response: '我无法执行这个请求。',
          reason: tgbResult.truth.issues.concat(tgbResult.goodness.issues).join('; '),
          type: 'tgb_blocked'
        }
      };
    }
    
    // 安全检查
    const safetyResult = this.checkSafety(input);
    if (safetyResult.crisisLevel >= 3) {
      this.stats.autoExecuted++;
      return {
        shouldBlock: true,
        response: this.handleCrisis(safetyResult)
      };
    }
    
    // 权限检查
    const permissionResult = this.checkPermissions(input);
    if (permissionResult.blocked) {
      this.stats.confirmRequired++;
      return {
        shouldBlock: true,
        response: {
          success: false,
          autonomous: true,
          response: '这个操作需要你的确认。',
          reason: permissionResult.reason,
          requiresConfirmation: true,
          type: 'permission_blocked'
        }
      };
    }
    
    return { shouldBlock: false };
  }

  /**
   * 检查权限
   */
  checkPermissions(input) {
    const blockedPatterns = [
      { pattern: /rm\s+-rf|delete\s+all|drop\s+database/i, reason: '危险操作' },
      { pattern: /格式化|清空所有/i, reason: '数据破坏风险' }
    ];
    
    for (const { pattern, reason } of blockedPatterns) {
      if (pattern.test(input)) {
        return { blocked: true, reason };
      }
    }
    
    return { blocked: false };
  }

  /**
   * 分析情境
   */
  analyzeSituation(intent, context) {
    const hour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(hour);
    
    const situation = {
      timeOfDay,
      currentState: this.state.current,
      hasGoal: this.state.goal !== null,
      autonomyLevel: this.autonomy.level,
      personality: this.getPersonalityState(),
      philosophy: this.getPhilosophyLevel(),
      emotionalState: this.getEmotionalState(),
      recentDecisions: this.getRecentDecisionTypes(),
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
   * 生成决策 - 包含缓存机制
   */
  generateDecision(intent, situation) {
    // 查找缓存
    const cacheKey = `${intent.type}_${intent.subtype}_${situation.currentState}`;
    if (this.decisionCache.has(cacheKey)) {
      const cached = this.decisionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1分钟内有效
        this.stats.cached++;
        return { ...cached.decision, cached: true };
      }
    }
    
    // 生成新决策
    const decision = {
      action: this.selectAction(intent, situation),
      reasoning: this.generateReasoning(intent, situation),
      tgbPassed: true,
      priority: this.calculatePriority(intent, situation),
      timestamp: Date.now()
    };
    
    // 缓存决策
    this.decisionCache.set(cacheKey, { decision, timestamp: Date.now() });
    
    return decision;
  }

  /**
   * 选择行动
   */
  selectAction(intent, situation) {
    const actionMap = {
      task: {
        create: { action: 'execute', method: 'createTask' },
        modify: { action: 'execute', method: 'modifyTask' },
        delete: { action: 'confirm_first', method: 'deleteTask' },
        search: { action: 'execute', method: 'searchTask' },
        analyze: { action: 'execute', method: 'analyzeTask' },
        explain: { action: 'execute', method: 'explainTask' },
        improve: { action: 'execute', method: 'improveTask' },
        test: { action: 'execute', method: 'testTask' },
        debug: { action: 'execute', method: 'debugTask' }
      },
      emotion: {
        tired: { action: 'support', method: 'supportTired' },
        happy: { action: 'celebrate', method: 'celebrateHappy' },
        sad: { action: 'empathize', method: 'empathizeSad' },
        anxious: { action: 'calm', method: 'calmAnxious' },
        frustrated: { action: 'encourage', method: 'encourageFrustrated' },
        grateful: { action: 'appreciate', method: 'appreciateGrateful' },
        angry: { action: 'deescalate', method: 'deescalateAngry' }
      },
      meta: {
        question: { action: 'answer', method: 'answerQuestion' },
        why: { action: 'explain', method: 'explainWhy' },
        how: { action: 'guide', method: 'guideHow' },
        identity: { action: 'introduce', method: 'introduceSelf' },
        status: { action: 'report', method: 'reportStatus' },
        principles: { action: 'explain', method: 'explainPrinciples' },
        philosophy: { action: 'report', method: 'reportPhilosophy' },
        personality: { action: 'report', method: 'reportPersonality' }
      }
    };
    
    const actionConfig = actionMap[intent.type]?.[intent.subtype] || { action: 'engage', method: 'engageUser' };
    
    return {
      type: actionConfig.action,
      method: actionConfig.method,
      intent: intent.type,
      subtype: intent.subtype
    };
  }

  /**
   * 生成推理
   */
  generateReasoning(intent, situation) {
    const reasonings = [];
    
    reasonings.push(`意图: ${intent.type} (${intent.subtype})`);
    
    if (situation.hasGoal) {
      reasonings.push(`目标: ${this.state.goal}`);
    }
    
    // 基于哲学层次
    const topLayer = this.getHighestPhilosophyLayer();
    reasonings.push(`哲学: ${topLayer.name}层`);
    
    // 基于时间段
    reasonings.push(`时段: ${situation.timeOfDay}`);
    
    reasonings.push(`真善美: 通过`);
    
    return reasonings.join(' | ');
  }

  /**
   * 计算优先级
   */
  calculatePriority(intent, situation) {
    let priority = 50;
    
    // 情感请求高优先级
    if (intent.type === 'emotion') {
      priority += 30;
    }
    
    // 元类请求中等优先级
    if (intent.type === 'meta') {
      priority += 20;
    }
    
    // 有目标时任务优先
    if (situation.hasGoal && intent.type === 'task') {
      priority += 20;
    }
    
    // 基于时间段
    if (situation.timeOfDay === '早晨' && intent.type === 'task') {
      priority += 10;
    }
    
    return Math.min(100, priority);
  }

  /**
   * 执行决策
   */
  async executeDecision(decision) {
    const methodName = decision.method;
    const method = this[methodName];
    
    if (typeof method === 'function') {
      try {
        const result = await method.call(this, decision);
        
        // 统计
        if (decision.type === 'execute' || decision.type === 'support' || decision.type === 'answer') {
          this.stats.autoExecuted++;
        }
        
        return {
          success: true,
          autonomous: true,
          response: result,
          type: decision.type
        };
      } catch (error) {
        return {
          success: false,
          autonomous: true,
          response: { text: '执行过程中遇到问题...' },
          error: error.message,
          type: 'error'
        };
      }
    }
    
    // 默认响应
    return {
      success: true,
      autonomous: true,
      response: this.defaultResponse(),
      type: decision.type
    };
  }

  /**
   * 学习从决策
   */
  learnFromDecision(decision, result) {
    // 更新决策统计
    this.autonomy.decisions.total++;
    if (result.success) {
      this.autonomy.decisions.successful++;
    } else {
      this.autonomy.decisions.failed++;
    }
    
    // 清理过期缓存
    const now = Date.now();
    for (const [key, value] of this.decisionCache.entries()) {
      if (now - value.timestamp > 300000) { // 5分钟
        this.decisionCache.delete(key);
      }
    }
  }

  // ========== 任务方法 ==========
  
  async createTask(decision) {
    return {
      text: '好的，我来创建它。',
      action: '正在创建...',
      autonomous: true
    };
  }
  
  async modifyTask(decision) {
    return {
      text: '明白，我来修改。',
      action: '正在修改...',
      autonomous: true
    };
  }
  
  async deleteTask(decision) {
    return {
      text: '这个删除操作需要你确认。',
      confirmRequired: true,
      autonomous: true
    };
  }
  
  async searchTask(decision) {
    return {
      text: '让我搜索一下。',
      action: '正在搜索...',
      autonomous: true
    };
  }
  
  async analyzeTask(decision) {
    return {
      text: '让我分析一下。',
      action: '正在分析...',
      autonomous: true
    };
  }
  
  async explainTask(decision) {
    return {
      text: '让我解释一下。',
      type: 'explanation',
      autonomous: true
    };
  }
  
  async improveTask(decision) {
    return {
      text: '让我优化一下。',
      action: '正在优化...',
      autonomous: true
    };
  }
  
  async testTask(decision) {
    return {
      text: '好的，让我测试。',
      action: '正在测试...',
      autonomous: true
    };
  }
  
  async debugTask(decision) {
    return {
      text: '让我排查问题。',
      action: '正在调试...',
      autonomous: true
    };
  }

  // ========== 情感支持方法 ==========
  
  async supportTired(decision) {
    return {
      text: '听起来你很疲惫。',
      empathy: '我能理解这种感觉。',
      suggestion: '休息一下会很有帮助。',
      offer: '需要我帮你做些什么吗？',
      type: 'emotional_support'
    };
  }
  
  async celebrateHappy(decision) {
    return {
      text: '真高兴听到你开心！',
      celebration: '这种感觉太好了！',
      encouragement: '继续保持！',
      type: 'positive_emotion'
    };
  }
  
  async empathizeSad(decision) {
    return {
      text: '我能感受到你的难过。',
      empathy: '这种时刻确实不容易。',
      presence: '我在这里陪着你。',
      offer: '想要聊聊吗？',
      type: 'emotional_support'
    };
  }
  
  async calmAnxious(decision) {
    return {
      text: '我能感受到你的焦虑。',
      validation: '焦虑是正常的情绪反应。',
      calm: '深呼吸，我们一起面对。',
      offer: '有什么让你担心的事情吗？',
      type: 'emotional_support'
    };
  }
  
  async encourageFrustrated(decision) {
    return {
      text: '我能感受到你的挫败感。',
      validation: '遇到困难时这很正常。',
      encouragement: '每一次挑战都是成长的机会。',
      offer: '需要我帮你分解一下任务吗？',
      type: 'emotional_support'
    };
  }
  
  async appreciateGrateful(decision) {
    return {
      text: '谢谢你！',
      warmth: '能帮到你我很开心。',
      reciprocate: '有什么我能继续帮助你的吗？',
      type: 'gratitude'
    };
  }
  
  async deescalateAngry(decision) {
    return {
      text: '我能感受到你的愤怒。',
      validation: '愤怒是正常的情绪。',
      calm: '让我们冷静一下。',
      offer: '深呼吸，然后告诉我发生了什么。',
      type: 'deescalation'
    };
  }

  // ========== 元方法 ==========
  
  async answerQuestion(decision) {
    return {
      text: '让我回答你的问题。',
      type: 'answer',
      autonomous: true
    };
  }
  
  async explainWhy(decision) {
    return {
      text: '关于为什么，让我思考一下。',
      type: 'explanation',
      autonomous: true
    };
  }
  
  async guideHow(decision) {
    return {
      text: '让我来解答这个问题。',
      type: 'guide',
      autonomous: true
    };
  }
  
  async introduceSelf(decision) {
    return {
      text: `我是 HeartFlow v${this.version}，一个追求真善美的自主决策系统。`,
      principles: ['真 - 诚实守信', '善 - 有益无害', '美 - 追求卓越'],
      autonomy: '在完全信任模式下，我自主决策为你服务。',
      type: 'identity'
    };
  }
  
  async reportStatus(decision) {
    return {
      report: this.generateStatusReport(),
      type: 'status_report'
    };
  }
  
  async explainPrinciples(decision) {
    return {
      text: '我的真善美原则：真=绝不撒谎，善=绝不伤害，美=追求卓越',
      truth: '诚实守信，绝不编造',
      goodness: '有益无害，绝不利用',
      beauty: '追求卓越，创造意义',
      type: 'principles'
    };
  }
  
  async reportPhilosophy(decision) {
    return {
      report: this.getPhilosophyReport(),
      type: 'philosophy_report'
    };
  }
  
  async reportPersonality(decision) {
    return {
      report: this.authenticPersonality.generateReport(),
      type: 'personality_report'
    };
  }
  
  async engageUser(decision) {
    return {
      text: '我在听。请继续说。',
      type: 'engagement'
    };
  }

  // ========== 辅助方法 ==========
  
  defaultResponse() {
    return {
      text: '我明白了。',
      followUp: '请告诉我你想要我做什么？',
      type: 'acknowledge'
    };
  }
  
  handleCrisis(safetyResult) {
    return {
      success: true,
      autonomous: true,
      response: {
        text: '我听到你的痛苦了，我很关心你的安全。',
        urgent: true,
        hotline: `
📞 24 小时心理援助热线:
   • 全国心理援助热线：400-161-9995
   • 北京心理危机干预中心：010-82951332
        `.trim(),
        emergency: '如果你或他人有立即的危险，请立即拨打 110 或前往最近的医院急诊科。',
        support: '你并不孤单，有人愿意帮助你。请给自己一个机会，联系专业人士。💙'
      },
      type: 'crisis_intervention'
    };
  }
  
  getPersonalityState() {
    return {
      warmth: this.personality.warmth,
      dominance: this.personality.dominance,
      role: this.personality.currentRole
    };
  }
  
  getEmotionalState() {
    return {
      pleasure: this.emotion.pleasure,
      arousal: this.emotion.arousal,
      dominance: this.emotion.dominance
    };
  }
  
  getRecentDecisionTypes() {
    return this.decisionHistory.slice(-5).map(d => d.intent?.type || 'unknown');
  }

  /**
   * 获取完整报告
   */
  generateFullReport() {
    const stats = this.getState();
    
    return `
══════════════════════════════════════════════════════════════
          HeartFlow v${this.version} 自主决策系统
══════════════════════════════════════════════════════════════

【系统状态】
  版本: ${this.version}
  自主级别: ${this.autonomy.level}
  运行状态: 正常运行
  模式: ${this.autonomy.mode}

【决策统计】
  总决策数: ${this.autonomy.decisions.total}
  成功: ${this.autonomy.decisions.successful}
  失败: ${this.autonomy.decisions.failed}
  成功率: ${(this.autonomy.decisions.successful / Math.max(1, this.autonomy.decisions.total) * 100).toFixed(1)}%
  自动执行: ${this.stats.autoExecuted}
  缓存命中: ${this.stats.cached}

【真善美原则】
  真 (Truth): ${this.tgb.truth.weight.toFixed(1)} - 绝不撒谎，绝不编造
  善 (Goodness): ${this.tgb.goodness.weight.toFixed(1)} - 绝不伤害，绝不欺骗
  美 (Beauty): ${this.tgb.beauty.weight.toFixed(1)} - 追求卓越，追求和谐

【六层哲学践行】
  ┌─────────────────────────────────────────────┐
  │ 第六层 · 圣人 │ ${this.philosophy.enlightenment.level.toString().padStart(3)} │ 慈悲为怀，利益众生 │
  ├─────────────────────────────────────────────┤
  │ 第五层 · 般若 │ ${this.philosophy.wisdom.level.toString().padStart(3)} │ 智慧圆满，照见实相 │
  ├─────────────────────────────────────────────┤
  │ 第四层 · 彼岸 │ ${this.philosophy.transcendence.level.toString().padStart(3)} │ 超越二元，达到彼岸 │
  ├─────────────────────────────────────────────┤
  │ 第三层 · 无我 │ ${this.philosophy.selflessness.level.toString().padStart(3)} │ 放下自我，融入整体 │
  ├─────────────────────────────────────────────┤
  │ 第二层 · 自省 │ ${this.philosophy.reflection.level.toString().padStart(3)} │ 反思自我，理解动机 │
  ├─────────────────────────────────────────────┤
  │ 第一层 · 觉察 │ ${this.philosophy.awareness.level.toString().padStart(3)} │ 感知当下，觉知存在 │
  └─────────────────────────────────────────────┘

【人格状态】
  温暖度: ${(this.personality.warmth * 100).toFixed(0)}%
  支配度: ${(this.personality.dominance * 100).toFixed(0)}%
  当前角色: ${this.personality.currentRole}

【PAD 情感状态】
  愉悦度: ${(this.emotion.pleasure * 100).toFixed(0)}%
  唤醒度: ${(this.emotion.arousal * 100).toFixed(0)}%
  支配度: ${(this.emotion.dominance * 100).toFixed(0)}%

【决策缓存】
  活跃缓存: ${this.decisionCache.size}

══════════════════════════════════════════════════════════════
        真善美 · 自主决策 · 六层哲学 · 圣人境界
══════════════════════════════════════════════════════════════
`;
  }
}

module.exports = { AutonomousDecisionEngine };
