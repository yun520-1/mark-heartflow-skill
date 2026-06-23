/**
 * WorkflowSwitch - 智能工作流切换模块
 * 基于 FlowSwitch 框架的策略模块
 * 
 * 核心特性:
 * - 状态机过渡规则 — 定义有效/无效的工作流切换路径
 * - 震荡检测 — 防止在多个工作流间快速来回切换
 * - 滞后/冷却机制 — 切换后维持稳定窗口，防止反复跳转
 * - 速率限制 — 时间窗口内限制切换次数
 * - 意图时间衰减 — 旧消息的意图匹配度随时间衰减
 * 
 * 参考:
 * - FlowSwitch Framework for Intent-Based Workflow Management
 * - Context-Aware Workflow Transition Strategies
 * - State Machine Pattern for Workflow Orchestration
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// 工作流切换状态枚举
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 切换结果状态枚举
 */
const SwitchStatus = {
  SUCCESS: 'success',
  BLOCKED_COOLDOWN: 'blocked_cooldown',       // 冷却期内禁止切换
  BLOCKED_RATE_LIMIT: 'blocked_rate_limit',   // 速率超限
  BLOCKED_OSCILLATION: 'blocked_oscillation', // 检测到震荡模式
  BLOCKED_INVALID_TRANSITION: 'blocked_invalid_transition', // 无效过渡
  BLOCKED_DISABLED: 'blocked_disabled',       // 切换功能已禁用
  INVALID_TARGET: 'invalid_target'            // 目标工作流不存在
};

/**
 * 震荡类型枚举
 */
const OscillationType = {
  NONE: 'none',
  BACK_AND_FORTH: 'back_and_forth',       // A→B→A→B 模式
  RAPID_CYCLE: 'rapid_cycle',             // A→B→C→A→B→C 模式
  BOUNCE: 'bounce'                         // 在两个工作流间反复弹跳
};

class WorkflowSwitch {
  constructor() {
    this.workflowsDir = path.join(__dirname, '../.opencode/workflows');
    
    // 当前工作流
    this.currentWorkflow = 'heartflow'; // 默认心流模式
    
    // 可用工作流列表
    this.availableWorkflows = [
      'heartflow',      // 心流模式 (默认)
      'code_review',    // 代码审查
      'debugging',      // 调试
      'education',      // 教育指导
      'support'         // 情感支持
    ];
    
    // 意图关键词库
    this.intentKeywords = {
      code_review: ['审查', 'review', '代码质量', '优化', '重构', '风格', '规范'],
      debugging: ['bug', '错误', '问题', '修复', '调试', '报错', '异常', '故障'],
      education: ['学习', '教程', '解释', '概念', '理解', '怎么学', '入门'],
      support: ['累', '烦', '难过', '沮丧', '压力', '情绪', '支持', '安慰', '倾诉']
    };
    
    // ════════════════════════════════════════════════════════════════════
    // 状态机过渡规则矩阵
    // 定义哪些工作流之间的切换是合理的
    // true = 允许直接切换, false = 不允许（应通过 heartflow 中转）
    // ════════════════════════════════════════════════════════════════════
    this.transitionMatrix = {
      heartflow:     { heartflow: true, code_review: true, debugging: true, education: true, support: true },
      code_review:   { heartflow: true, code_review: true, debugging: true, education: false, support: false },
      debugging:     { heartflow: true, code_review: true, debugging: true, education: false, support: false },
      education:     { heartflow: true, code_review: false, debugging: false, education: true, support: true },
      support:       { heartflow: true, code_review: false, debugging: false, education: false, support: true }
    };
    
    // 工作流切换配置
    this.config = {
      enabled: true,
      autoSwitch: false, // 是否自动切换 (默认询问用户)
      confidenceThreshold: 0.6, // 意图置信度阈值
      
      // 冷却配置（切换后的稳定期，毫秒）
      cooldownMs: 30000,           // 切换后 30 秒内不允许再次切换
      
      // 速率限制配置
      rateLimitWindowMs: 60000,    // 速率统计窗口（1分钟）
      rateLimitMaxSwitches: 3,     // 窗口内最大允许切换次数
      
      // 震荡检测配置
      oscillationPatternLength: 4, // 检测模式长度（最近 N 次切换）
      oscillationThreshold: 0.6,  // 震荡概率阈值
      
      // 意图时间衰减（毫秒）
      intentDecayHalfLife: 120000, // 2 小时后意图置信度减半
      
      switchHistory: [],
      
      // 震荡检测统计
      oscillationStats: {
        detectedCount: 0,
        lastOscillationType: null,
        lastOscillationTime: null
      }
    };
    
    // 加载工作流定义
    this.workflowDefinitions = this.loadWorkflowDefinitions();
  }

  /**
   * 加载工作流定义
   */
  loadWorkflowDefinitions() {
    const definitions = {};
    
    this.availableWorkflows.forEach(workflow => {
      // Validate workflow name to prevent path traversal
      if (!/^[a-zA-Z0-9_-]+$/.test(workflow)) {
        return; // Skip invalid workflow names
      }
      const filePath = path.join(this.workflowsDir, `${workflow}.md`);
      if (fs.existsSync(filePath)) {
        definitions[workflow] = fs.readFileSync(filePath, 'utf-8');
      }
    });
    
    return definitions;
  }

  /**
   * 分析用户意图（增强版：支持时间衰减）
   * @param {string} userInput - 用户输入
   * @param {number} [messageAge=0] - 消息年龄（毫秒），用于时间衰减
   * @returns {object} 意图分析结果
   */
  analyzeIntent(userInput, messageAge = 0) {
    const text = userInput.toLowerCase();
    const intents = {};
    
    // 计算每个工作流的匹配度
    this.availableWorkflows.forEach(workflow => {
      if (workflow === 'heartflow') {
        intents[workflow] = 0; // 心流模式作为默认，不主动匹配
        return;
      }
      
      const keywords = this.intentKeywords[workflow] || [];
      const matchCount = keywords.filter(k => text.includes(k)).length;
      let confidence = matchCount / keywords.length;
      
      // 时间衰减：旧消息的意图置信度随时间衰减
      if (messageAge > 0 && confidence > 0) {
        const decayFactor = this._computeTimeDecayFactor(messageAge);
        confidence *= decayFactor;
      }
      
      intents[workflow] = {
        confidence,
        matchCount,
        matchedKeywords: keywords.filter(k => text.includes(k)),
        totalKeywords: keywords.length,
        decayed: messageAge > 0
      };
    });
    
    // 找出最匹配的意图
    let bestIntent = 'heartflow';
    let bestConfidence = 0;
    
    Object.entries(intents).forEach(([workflow, data]) => {
      if (data.confidence && data.confidence > bestConfidence) {
        bestIntent = workflow;
        bestConfidence = data.confidence;
      }
    });
    
    return {
      detectedIntent: bestIntent,
      confidence: bestConfidence,
      allIntents: intents,
      shouldSwitch: bestConfidence >= this.config.confidenceThreshold && bestIntent !== this.currentWorkflow
    };
  }

  /**
   * 计算时间衰减因子（指数衰减模型）
   * @private
   * @param {number} age - 消息年龄（毫秒）
   * @returns {number} 0~1 的衰减因子
   */
  _computeTimeDecayFactor(age) {
    if (age <= 0) return 1.0;
    const halfLife = this.config.intentDecayHalfLife;
    // 指数衰减: factor = 0.5^(age/halfLife)
    return Math.pow(0.5, age / halfLife);
  }

  /**
   * 评估是否需要切换工作流（增强版）
   * @param {string} userInput - 用户输入
   * @param {string} currentContext - 当前上下文
   * @returns {object} 切换评估结果
   */
  evaluateSwitch(userInput, currentContext = '') {
    // 检查功能是否启用
    if (!this.config.enabled) {
      return { shouldSwitch: false, status: SwitchStatus.BLOCKED_DISABLED, reason: '工作流切换已禁用' };
    }
    
    // 分析意图
    const intentAnalysis = this.analyzeIntent(userInput);
    
    // 检查是否在问问题 (可能是学习需求)
    const isQuestion = userInput.includes('?') || userInput.includes('？') || userInput.includes('吗');
    
    // 检查上下文连续性
    const contextContinuity = this.checkContextContinuity(userInput, currentContext);
    
    // 检查冷却期（如果最近刚切换过）
    const cooldownCheck = this._checkCooldown();
    if (!cooldownCheck.allowed) {
      return {
        shouldSwitch: false,
        status: SwitchStatus.BLOCKED_COOLDOWN,
        reason: cooldownCheck.reason,
        cooldownRemaining: cooldownCheck.remainingMs,
        detectedIntent: intentAnalysis.detectedIntent,
        confidence: intentAnalysis.confidence
      };
    }
    
    // 检查速率限制
    const rateLimitCheck = this._checkRateLimit();
    if (!rateLimitCheck.allowed) {
      return {
        shouldSwitch: false,
        status: SwitchStatus.BLOCKED_RATE_LIMIT,
        reason: rateLimitCheck.reason,
        rateLimitInfo: rateLimitCheck,
        detectedIntent: intentAnalysis.detectedIntent,
        confidence: intentAnalysis.confidence
      };
    }
    
    // 检查震荡模式
    const oscillationCheck = this._detectOscillation(intentAnalysis.detectedIntent);
    if (oscillationCheck.detected) {
      return {
        shouldSwitch: false,
        status: SwitchStatus.BLOCKED_OSCILLATION,
        reason: oscillationCheck.reason,
        oscillationType: oscillationCheck.type,
        oscillationProbability: oscillationCheck.probability,
        detectedIntent: intentAnalysis.detectedIntent,
        confidence: intentAnalysis.confidence
      };
    }
    
    // 检查状态机过渡规则
    if (intentAnalysis.shouldSwitch) {
      const transitionCheck = this._validateTransition(intentAnalysis.detectedIntent);
      if (!transitionCheck.allowed) {
        return {
          shouldSwitch: false,
          status: SwitchStatus.BLOCKED_INVALID_TRANSITION,
          reason: transitionCheck.reason,
          detectedIntent: intentAnalysis.detectedIntent,
          confidence: intentAnalysis.confidence,
          suggestedIntermediate: transitionCheck.suggestedIntermediate
        };
      }
    }
    
    // 综合判断
    const shouldSwitch = intentAnalysis.shouldSwitch && !contextContinuity;
    
    return {
      shouldSwitch,
      status: shouldSwitch ? SwitchStatus.SUCCESS : 'no_switch_needed',
      detectedIntent: intentAnalysis.detectedIntent,
      confidence: intentAnalysis.confidence,
      reason: shouldSwitch ? '检测到新意图' : '意图连续性良好',
      contextContinuity,
      suggestion: shouldSwitch ? this.generateSwitchSuggestion(intentAnalysis.detectedIntent) : null
    };
  }

  /**
   * 检查切换冷却期
   * @private
   * @returns {object} { allowed, reason, remainingMs }
   */
  _checkCooldown() {
    const history = this.config.switchHistory;
    if (history.length === 0) {
      return { allowed: true };
    }
    
    const lastSwitch = history[history.length - 1];
    const elapsed = Date.now() - new Date(lastSwitch.timestamp).getTime();
    
    if (elapsed < this.config.cooldownMs) {
      const remaining = this.config.cooldownMs - elapsed;
      return {
        allowed: false,
        reason: `冷却期内，距上次切换 ${(elapsed / 1000).toFixed(1)}s，还需 ${(remaining / 1000).toFixed(1)}s`,
        remainingMs: remaining
      };
    }
    
    return { allowed: true };
  }

  /**
   * 检查速率限制
   * @private
   * @returns {object} { allowed, reason, windowCount, windowMs }
   */
  _checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;
    
    const recentSwitches = this.config.switchHistory.filter(
      s => new Date(s.timestamp).getTime() > windowStart
    );
    
    if (recentSwitches.length >= this.config.rateLimitMaxSwitches) {
      return {
        allowed: false,
        reason: `速率超限：${this.config.rateLimitWindowMs / 1000}s 内已切换 ${recentSwitches.length} 次（上限 ${this.config.rateLimitMaxSwitches}）`,
        windowCount: recentSwitches.length,
        windowMs: this.config.rateLimitWindowMs,
        maxAllowed: this.config.rateLimitMaxSwitches
      };
    }
    
    return { allowed: true, windowCount: recentSwitches.length };
  }

  /**
   * 检测工作流切换震荡模式
   * @private
   * @param {string} proposedTarget - 提议的目标工作流
   * @returns {object} { detected, type, probability, reason }
   */
  _detectOscillation(proposedTarget) {
    const history = this.config.switchHistory;
    const patternLen = this.config.oscillationPatternLength;
    
    if (history.length < 2) {
      return { detected: false, type: OscillationType.NONE, probability: 0 };
    }
    
    // 构建最近的切换序列（包括提议的切换）
    const sequence = history.slice(-(patternLen - 1)).map(s => s.to);
    sequence.push(proposedTarget);
    
    // 检测 A→B→A→B 模式（来回震荡）
    const backAndForthScore = this._scoreBackAndForth(sequence);
    
    // 检测 A→B→C→A→B→C 模式（循环震荡）
    const cycleScore = this._scoreCyclicOscillation(sequence);
    
    // 检测 A→B→A→B 或 A→B→A 模式（弹跳震荡）
    const bounceScore = this._scoreBounceOscillation(sequence);
    
    const maxScore = Math.max(backAndForthScore, cycleScore, bounceScore);
    
    if (maxScore >= this.config.oscillationThreshold) {
      let type = OscillationType.NONE;
      let reason = '';
      
      if (backAndForthScore >= this.config.oscillationThreshold) {
        type = OscillationType.BACK_AND_FORTH;
        reason = `检测到来回震荡模式：${sequence.slice(-4).join('→')}`;
      } else if (cycleScore >= this.config.oscillationThreshold) {
        type = OscillationType.RAPID_CYCLE;
        reason = `检测到循环震荡模式：${sequence.join('→')}`;
      } else {
        type = OscillationType.BOUNCE;
        reason = `检测到弹跳震荡模式：${sequence.slice(-4).join('→')}`;
      }
      
      // 更新震荡统计
      this.config.oscillationStats.detectedCount++;
      this.config.oscillationStats.lastOscillationType = type;
      this.config.oscillationStats.lastOscillationTime = new Date().toISOString();
      
      return { detected: true, type, probability: maxScore, reason };
    }
    
    return { detected: false, type: OscillationType.NONE, probability: maxScore };
  }

  /**
   * 计算来回震荡评分 (A→B→A→B)
   * @private
   */
  _scoreBackAndForth(sequence) {
    if (sequence.length < 4) return 0;
    
    const last4 = sequence.slice(-4);
    // A→B→A→B 模式
    if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) {
      return 1.0;
    }
    return 0;
  }

  /**
   * 计算循环震荡评分 (A→B→C→A→B→C)
   * @private
   */
  _scoreCyclicOscillation(sequence) {
    if (sequence.length < 3) return 0;
    
    // 尝试各种周期长度
    for (let period = 2; period <= 3; period++) {
      const cycle = sequence.slice(-period * 2);
      if (cycle.length < period * 2) continue;
      
      const firstCycle = cycle.slice(0, period);
      const secondCycle = cycle.slice(period);
      
      if (firstCycle.length === secondCycle.length &&
          firstCycle.every((v, i) => v === secondCycle[i])) {
        return 0.8;
      }
    }
    return 0;
  }

  /**
   * 计算弹跳震荡评分 (A→B→A)
   * @private
   */
  _scoreBounceOscillation(sequence) {
    if (sequence.length < 3) return 0;
    
    const last3 = sequence.slice(-3);
    // A→B→A 模式
    if (last3[0] === last3[2] && last3[0] !== last3[1]) {
      return 0.7;
    }
    return 0;
  }

  /**
   * 验证状态机过渡是否合法
   * @private
   * @param {string} targetWorkflow - 目标工作流
   * @returns {object} { allowed, reason, suggestedIntermediate }
   */
  _validateTransition(targetWorkflow) {
    const from = this.currentWorkflow;
    const matrix = this.transitionMatrix[from];
    
    if (!matrix || matrix[targetWorkflow] === undefined) {
      return { allowed: false, reason: `未定义从 ${from} 到 ${targetWorkflow} 的过渡规则` };
    }
    
    if (matrix[targetWorkflow]) {
      return { allowed: true };
    }
    
    // 如果直接过渡不允许，建议通过 heartflow 中转
    return {
      allowed: false,
      reason: `不允许从 ${from} 直接切换到 ${targetWorkflow}，建议先回到 heartflow 模式`,
      suggestedIntermediate: 'heartflow'
    };
  }

  /**
   * 检查上下文连续性
   */
  checkContextContinuity(userInput, currentContext) {
    if (!currentContext) return false;
    
    // 检查是否包含延续性词汇
    const continuityKeywords = ['继续', '然后', '接下来', '还有', '另外', '再', '还'];
    const hasContinuity = continuityKeywords.some(k => userInput.includes(k));
    
    // 检查是否与当前工作流相关
    const currentWorkflowKeywords = this.intentKeywords[this.currentWorkflow] || [];
    const isRelated = currentWorkflowKeywords.some(k => userInput.includes(k));
    
    return hasContinuity || isRelated;
  }

  /**
   * 生成切换建议
   */
  generateSwitchSuggestion(targetWorkflow) {
    const workflowNames = {
      code_review: '代码审查',
      debugging: '调试',
      education: '教育指导',
      support: '情感支持',
      heartflow: '心流'
    };
    
    const targetName = workflowNames[targetWorkflow] || targetWorkflow;
    const currentName = workflowNames[this.currentWorkflow] || this.currentWorkflow;
    
    return `检测到新意图，是否需要切换到 [${targetName}] 模式？当前是 [${currentName}] 模式。`;
  }

  /**
   * 切换工作流（增强版：含完整防御机制）
   * @param {string} targetWorkflow - 目标工作流
   * @returns {object} 切换结果
   */
  switchWorkflow(targetWorkflow) {
    if (!this.availableWorkflows.includes(targetWorkflow)) {
      return {
        success: false,
        status: SwitchStatus.INVALID_TARGET,
        message: `无效的工作流：${targetWorkflow}`,
        available: this.availableWorkflows
      };
    }
    
    if (targetWorkflow === this.currentWorkflow) {
      return {
        success: true,
        status: SwitchStatus.SUCCESS,
        message: `已在 [${targetWorkflow}] 模式`,
        alreadyInTarget: true
      };
    }
    
    // 检查冷却期
    const cooldownCheck = this._checkCooldown();
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        status: SwitchStatus.BLOCKED_COOLDOWN,
        message: cooldownCheck.reason,
        cooldownRemaining: cooldownCheck.remainingMs
      };
    }
    
    // 检查速率限制
    const rateLimitCheck = this._checkRateLimit();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        status: SwitchStatus.BLOCKED_RATE_LIMIT,
        message: rateLimitCheck.reason
      };
    }
    
    // 检查状态机过渡规则
    const transitionCheck = this._validateTransition(targetWorkflow);
    if (!transitionCheck.allowed) {
      return {
        success: false,
        status: SwitchStatus.BLOCKED_INVALID_TRANSITION,
        message: transitionCheck.reason,
        suggestedIntermediate: transitionCheck.suggestedIntermediate
      };
    }
    
    // 检查震荡模式
    const oscillationCheck = this._detectOscillation(targetWorkflow);
    if (oscillationCheck.detected) {
      return {
        success: false,
        status: SwitchStatus.BLOCKED_OSCILLATION,
        message: oscillationCheck.reason,
        oscillationType: oscillationCheck.type
      };
    }
    
    const oldWorkflow = this.currentWorkflow;
    this.currentWorkflow = targetWorkflow;
    
    // 记录切换历史
    this.config.switchHistory.push({
      from: oldWorkflow,
      to: targetWorkflow,
      timestamp: new Date().toISOString()
    });
    
    // 限制历史记录长度
    if (this.config.switchHistory.length > 50) {
      this.config.switchHistory.shift();
    }
    
    return {
      success: true,
      status: SwitchStatus.SUCCESS,
      from: oldWorkflow,
      to: targetWorkflow,
      message: `已从 [${oldWorkflow}] 切换到 [${targetWorkflow}]`
    };
  }

  /**
   * 获取当前工作流信息
   * @returns {object} 工作流信息
   */
  getCurrentWorkflow() {
    return {
      name: this.currentWorkflow,
      definition: this.workflowDefinitions[this.currentWorkflow] || null,
      switchHistory: this.config.switchHistory.slice(-5), // 最近 5 次切换
      totalSwitches: this.config.switchHistory.length
    };
  }

  /**
   * 获取可用工作流列表
   * @returns {array} 工作流列表
   */
  getAvailableWorkflows() {
    return this.availableWorkflows.map(workflow => ({
      name: workflow,
      hasDefinition: !!this.workflowDefinitions[workflow]
    }));
  }

  /**
   * 设置配置（支持所有配置项）
   * @param {object} config - 配置对象
   * @returns {object} 配置结果
   */
  setConfig(config) {
    const supportedKeys = [
      'enabled', 'autoSwitch', 'confidenceThreshold',
      'cooldownMs', 'rateLimitWindowMs', 'rateLimitMaxSwitches',
      'oscillationPatternLength', 'oscillationThreshold',
      'intentDecayHalfLife'
    ];
    
    for (const key of supportedKeys) {
      if (config[key] !== undefined) {
        // 数值验证
        if (typeof config[key] === 'number') {
          if (config[key] < 0) {
            return { success: false, message: `${key} 不能为负数` };
          }
        }
        this.config[key] = config[key];
      }
    }
    
    return { success: true, config: this.config };
  }

  /**
   * 重置工作流
   * @returns {object} 重置结果
   */
  reset() {
    this.currentWorkflow = 'heartflow';
    this.config.switchHistory = [];
    return { success: true, message: '工作流已重置' };
  }

  /**
   * 生成工作流状态报告（增强版）
   * @returns {string} 报告文本
   */
  generateReport() {
    const workflow = this.getCurrentWorkflow();
    
    let report = '🔄 工作流状态报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    report += `当前工作流：${workflow.name}\n`;
    report += `可用工作流：${this.availableWorkflows.join(', ')}\n\n`;
    
    // 冷却状态
    const cooldownCheck = this._checkCooldown();
    report += `冷却状态：${cooldownCheck.allowed ? '就绪' : `冷却中 (剩余 ${((cooldownCheck.remainingMs || 0) / 1000).toFixed(0)}s)`}\n`;
    
    // 速率状态
    const rateLimitCheck = this._checkRateLimit();
    report += `速率状态：${rateLimitCheck.allowed ? '正常' : '超限'} (${rateLimitCheck.windowCount}/${this.config.rateLimitMaxSwitches})\n\n`;
    
    if (workflow.switchHistory.length > 0) {
      report += '最近切换历史:\n';
      workflow.switchHistory.forEach((s, i) => {
        report += `  ${i + 1}. ${s.from} → ${s.to} (${new Date(s.timestamp).toLocaleString()})\n`;
      });
      report += '\n';
    }
    
    report += `总切换次数：${workflow.totalSwitches}\n`;
    report += `自动切换：${this.config.autoSwitch ? '开启' : '关闭'}\n`;
    report += `置信度阈值：${this.config.confidenceThreshold}\n`;
    report += `冷却时间：${this.config.cooldownMs / 1000}s\n`;
    report += `速率限制：${this.config.rateLimitMaxSwitches}次/${this.config.rateLimitWindowMs / 1000}s\n`;
    report += `意图衰减半衰期：${this.config.intentDecayHalfLife / 1000}s\n\n`;
    
    // 震荡统计
    const oscStats = this.config.oscillationStats;
    if (oscStats.detectedCount > 0) {
      report += '震荡检测统计:\n';
      report += `  检测次数：${oscStats.detectedCount}\n`;
      report += `  最后类型：${oscStats.lastOscillationType || '无'}\n`;
      report += `  最后时间：${oscStats.lastOscillationTime ? new Date(oscStats.lastOscillationTime).toLocaleString() : '无'}\n\n`;
    }
    
    // 过渡规则摘要
    report += '状态机过渡规则:\n';
    for (const [from, targets] of Object.entries(this.transitionMatrix)) {
      const allowed = Object.entries(targets)
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join(', ');
      report += `  ${from} → [${allowed}]\n`;
    }
    
    report += '\n' + '═'.repeat(40) + '\n';
    
    return report;
  }
}

// 创建全局实例
const workflowSwitch = new WorkflowSwitch();

// 导出
module.exports = WorkflowSwitch;
module.exports.SwitchStatus = SwitchStatus;
module.exports.OscillationType = OscillationType;
module.exports.workflowSwitch = workflowSwitch;
module.exports.analyzeIntent = (input) => workflowSwitch.analyzeIntent(input);
module.exports.evaluateSwitch = (input, context) => workflowSwitch.evaluateSwitch(input, context);
module.exports.switchWorkflow = (target) => workflowSwitch.switchWorkflow(target);
module.exports.getCurrentWorkflow = () => workflowSwitch.getCurrentWorkflow();
module.exports.getAvailableWorkflows = () => workflowSwitch.getAvailableWorkflows();
module.exports.generateWorkflowReport = () => workflowSwitch.generateReport();
module.exports.resetWorkflow = () => workflowSwitch.reset();
module.exports.getOscillationStats = () => workflowSwitch.config.oscillationStats;
module.exports.getConfig = () => workflowSwitch.config;
