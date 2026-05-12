/**
 * FlowPredictor - 心流状态深度预测与解释模块
 * 基于编码行为模式检测用户挫败感
 * 
 * 参考:
 * - Flow-Reasoner Model (阈值触发推理)
 * - Coding Behavior Pattern Analysis
 * - Frustration Detection in Programming
 */

class FlowPredictor {
  constructor() {
    // 心流状态
    this.flowState = {
      level: 0.5, // 0-1，0.5 为基线
      phase: 'neutral', // neutral/entering/flow/frustrated/recovery
      lastUpdate: null
    };
    
    // 行为模式追踪
    this.behaviorPatterns = {
      editHistory: [],      // 编辑历史
      errorLoop: [],        // 错误循环
      pauseDuration: [],    // 暂停时长
      codeChanges: []       // 代码变更
    };
    
    // 挫败感指标
    this.frustrationIndicators = {
      repeatedEdits: 0,     // 重复编辑次数
      errorLoops: 0,        // 错误循环次数
      shortPauses: 0,       // 短暂停 (焦虑)
      longPauses: 0,        // 长暂停 (困惑)
      negativeLanguage: 0   // 负面语言
    };
    
    // 配置 (Flow-Reasoner 设计)
    this.config = {
      enabled: true,
      silentMode: true,     // 静默模式 (默认开启)
      interventionThreshold: 0.7, // 干预阈值 (达到此值才提示)
      frustrationThreshold: 0.6,  // 挫败感阈值
      patternWindowSize: 10,      // 行为模式窗口大小
      cooldownMinutes: 15         // 干预冷却时间 (分钟)
    };
    
    // 干预历史
    this.interventionHistory = [];
    
    // 负面模式关键词
    this.negativePatterns = [
      // 挫败表达
      '好难', '不会', '不懂', '烦', '崩溃', '放弃', '算了',
      // 重复尝试
      '又错了', '还是不行', '再次失败', '第 N 次',
      // 时间压力
      '来不及', '没时间', '太慢', '着急',
      // 自我怀疑
      '我太菜', '不适合', '学不会', '没天赋'
    ];
  }

  /**
   * 记录编辑行为
   * @param {object} editEvent - 编辑事件
   */
  recordEdit(editEvent) {
    this.behaviorPatterns.editHistory.push({
      timestamp: Date.now(),
      code: editEvent.code?.substring(0, 100),
      changeType: editEvent.changeType, // insert/delete/modify
      lineNumber: editEvent.lineNumber
    });
    
    // 限制历史记录长度
    if (this.behaviorPatterns.editHistory.length > this.config.patternWindowSize) {
      this.behaviorPatterns.editHistory.shift();
    }
    
    // 检测重复编辑
    this.detectRepeatedEdits(editEvent);
    
    // 更新心流状态
    this.updateFlowState();
  }

  /**
   * 记录错误事件
   * @param {object} errorEvent - 错误事件
   */
  recordError(errorEvent) {
    this.behaviorPatterns.errorLoop.push({
      timestamp: Date.now(),
      error: errorEvent.message?.substring(0, 100),
      location: errorEvent.location
    });
    
    // 限制历史记录长度
    if (this.behaviorPatterns.errorLoop.length > 5) {
      this.behaviorPatterns.errorLoop.shift();
    }
    
    // 检测错误循环
    this.detectErrorLoop(errorEvent);
    
    // 更新心流状态
    this.updateFlowState();
  }

  /**
   * 记录暂停时长
   * @param {number} duration - 暂停时长 (秒)
   */
  recordPause(duration) {
    this.behaviorPatterns.pauseDuration.push({
      timestamp: Date.now(),
      duration
    });
    
    // 检测异常暂停
    if (duration < 5) {
      this.frustrationIndicators.shortPauses += 1;
    } else if (duration > 60) {
      this.frustrationIndicators.longPauses += 1;
    }
    
    // 限制历史记录长度
    if (this.behaviorPatterns.pauseDuration.length > 10) {
      this.behaviorPatterns.pauseDuration.shift();
    }
  }

  /**
   * 检测重复编辑
   */
  detectRepeatedEdits(editEvent) {
    const recentEdits = this.behaviorPatterns.editHistory.slice(-5);
    
    // 检查是否有相似代码的重复编辑
    const similarEdits = recentEdits.filter(e => 
      e.lineNumber === editEvent.lineNumber &&
      e.changeType === 'modify'
    );
    
    if (similarEdits.length >= 3) {
      this.frustrationIndicators.repeatedEdits += 1;
    }
  }

  /**
   * 检测错误循环
   */
  detectErrorLoop(errorEvent) {
    const recentErrors = this.behaviorPatterns.errorLoop.slice(-3);
    
    // 检查是否有相似错误的重复出现
    const similarErrors = recentErrors.filter(e => 
      e.error.includes(errorEvent.message?.substring(0, 20) || '')
    );
    
    if (similarErrors.length >= 2) {
      this.frustrationIndicators.errorLoops += 1;
    }
  }

  /**
   * 分析用户语言的负面模式
   * @param {string} userInput - 用户输入
   * @returns {object} 分析结果
   */
  analyzeLanguage(userInput) {
    const text = userInput.toLowerCase();
    const matches = this.negativePatterns.filter(p => text.includes(p));
    
    if (matches.length > 0) {
      this.frustrationIndicators.negativeLanguage += matches.length;
    }
    
    return {
      hasNegativePattern: matches.length > 0,
      matchedPatterns: matches,
      severity: matches.length >= 3 ? 'high' : matches.length >= 1 ? 'medium' : 'low'
    };
  }

  /**
   * 更新心流状态
   */
  updateFlowState() {
    const frustrationScore = this.calculateFrustrationScore();
    
    // 根据挫败感分数更新心流状态
    if (frustrationScore >= this.config.frustrationThreshold) {
      this.flowState.phase = 'frustrated';
      this.flowState.level = Math.max(0, 0.5 - frustrationScore * 0.5);
    } else if (frustrationScore >= 0.3) {
      this.flowState.phase = 'recovery';
      this.flowState.level = 0.5;
    } else {
      this.flowState.phase = 'flow';
      this.flowState.level = Math.min(1, 0.5 + (1 - frustrationScore) * 0.5);
    }
    
    this.flowState.lastUpdate = new Date().toISOString();
  }

  /**
   * 计算挫败感分数
   * @returns {number} 挫败感分数 (0-1)
   */
  calculateFrustrationScore() {
    const indicators = this.frustrationIndicators;
    
    // 各指标权重
    const weights = {
      repeatedEdits: 0.3,
      errorLoops: 0.3,
      shortPauses: 0.1,
      longPauses: 0.1,
      negativeLanguage: 0.2
    };
    
    // 归一化各指标 (0-1)
    const normalized = {
      repeatedEdits: Math.min(1, indicators.repeatedEdits / 5),
      errorLoops: Math.min(1, indicators.errorLoops / 3),
      shortPauses: Math.min(1, indicators.shortPauses / 10),
      longPauses: Math.min(1, indicators.longPauses / 5),
      negativeLanguage: Math.min(1, indicators.negativeLanguage / 3)
    };
    
    // 计算加权分数
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += normalized[key] * weight;
    });
    
    return Math.min(1, score);
  }

  /**
   * 评估是否需要干预 (Flow-Reasoner 设计)
   * @returns {object} 干预评估结果
   */
  evaluateIntervention() {
    if (!this.config.enabled) {
      return { shouldIntervene: false, reason: '预测器已禁用' };
    }
    
    // 检查冷却时间
    if (this.interventionHistory.length > 0) {
      const lastIntervention = this.interventionHistory[this.interventionHistory.length - 1];
      const minutesSinceLast = (Date.now() - lastIntervention.timestamp) / 60000;
      if (minutesSinceLast < this.config.cooldownMinutes) {
        return { 
          shouldIntervene: false, 
          reason: '冷却期内',
          remainingCooldown: Math.round(this.config.cooldownMinutes - minutesSinceLast)
        };
      }
    }
    
    // 计算挫败感分数
    const frustrationScore = this.calculateFrustrationScore();
    
    // Flow-Reasoner 设计：仅达到阈值才推理
    if (frustrationScore < this.config.interventionThreshold) {
      return {
        shouldIntervene: false,
        reason: '挫败感未达阈值',
        frustrationScore,
        threshold: this.config.interventionThreshold
      };
    }
    
    // 生成干预建议
    const suggestion = this.generateInterventionSuggestion(frustrationScore);
    
    return {
      shouldIntervene: true,
      frustrationScore,
      phase: this.flowState.phase,
      suggestion,
      detectedPatterns: this.getDetectedPatterns()
    };
  }

  /**
   * 生成干预建议
   * @param {number} frustrationScore - 挫败感分数
   * @returns {string} 建议文本
   */
  generateInterventionSuggestion(frustrationScore) {
    const patterns = this.getDetectedPatterns();
    
    // 根据检测到的模式生成针对性建议
    if (patterns.includes('repeatedEdits')) {
      return "我注意到你在这段代码上修改了多次，需要换个思路或休息一下吗？有时候暂时离开一下，回来会有新的灵感。";
    }
    
    if (patterns.includes('errorLoop')) {
      return "我注意到同样的错误出现了好几次。需要我帮你一起分析一下问题所在吗？或者我们可以尝试不同的解决方法。";
    }
    
    if (patterns.includes('negativeLanguage')) {
      return "我感觉到你可能有些沮丧。这是学习过程中很正常的感受。需要休息一下，或者换个更简单的任务开始？";
    }
    
    // 通用建议
    if (frustrationScore >= 0.8) {
      return "我注意到你可能遇到了较大的困难。建议：1) 休息一下 2) 分解问题 3) 寻求帮助。你已经在努力了，这很棒。";
    } else {
      return "我注意到你在这段代码上修改了多次，需要换个思路或休息一下吗？";
    }
  }

  /**
   * 获取检测到的模式
   * @returns {array} 模式列表
   */
  getDetectedPatterns() {
    const patterns = [];
    const indicators = this.frustrationIndicators;
    
    if (indicators.repeatedEdits >= 2) patterns.push('repeatedEdits');
    if (indicators.errorLoops >= 1) patterns.push('errorLoop');
    if (indicators.negativeLanguage >= 2) patterns.push('negativeLanguage');
    if (indicators.shortPauses >= 5) patterns.push('shortPauses');
    if (indicators.longPauses >= 3) patterns.push('longPauses');
    
    return patterns;
  }

  /**
   * 获取心流状态
   * @returns {object} 心流状态
   */
  getFlowState() {
    return {
      level: this.flowState.level,
      phase: this.flowState.phase,
      frustrationScore: this.calculateFrustrationScore(),
      lastUpdate: this.flowState.lastUpdate,
      detectedPatterns: this.getDetectedPatterns()
    };
  }

  /**
   * 记录干预
   * @param {string} suggestion - 干预建议
   */
  recordIntervention(suggestion) {
    this.interventionHistory.push({
      timestamp: Date.now(),
      suggestion,
      frustrationScore: this.calculateFrustrationScore()
    });
    
    // 限制历史记录长度
    if (this.interventionHistory.length > 20) {
      this.interventionHistory.shift();
    }
  }

  /**
   * 重置预测器
   */
  reset() {
    this.flowState = {
      level: 0.5,
      phase: 'neutral',
      lastUpdate: null
    };
    
    this.behaviorPatterns = {
      editHistory: [],
      errorLoop: [],
      pauseDuration: [],
      codeChanges: []
    };
    
    this.frustrationIndicators = {
      repeatedEdits: 0,
      errorLoops: 0,
      shortPauses: 0,
      longPauses: 0,
      negativeLanguage: 0
    };
    
    this.interventionHistory = [];
    
    return { success: true, message: '心流预测器已重置' };
  }

  /**
   * 设置配置
   * @param {object} config - 配置对象
   * @returns {object} 配置结果
   */
  setConfig(config) {
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }
    if (config.silentMode !== undefined) {
      this.config.silentMode = config.silentMode;
    }
    if (config.interventionThreshold !== undefined) {
      this.config.interventionThreshold = config.interventionThreshold;
    }
    if (config.frustrationThreshold !== undefined) {
      this.config.frustrationThreshold = config.frustrationThreshold;
    }
    if (config.cooldownMinutes !== undefined) {
      this.config.cooldownMinutes = config.cooldownMinutes;
    }
    return { success: true, config: this.config };
  }

  /**
   * 生成心流状态报告
   * @returns {string} 报告文本
   */
  generateReport() {
    const state = this.getFlowState();
    
    let report = '🌊 心流状态报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    report += `心流水平：${(state.level * 100).toFixed(0)}%\n`;
    report += `当前阶段：${this.getPhaseName(state.phase)}\n`;
    report += `挫败感分数：${(state.frustrationScore * 100).toFixed(0)}%\n\n`;
    
    if (state.detectedPatterns.length > 0) {
      report += '检测到的模式:\n';
      state.detectedPatterns.forEach(p => {
        report += `  • ${this.getPatternName(p)}\n`;
      });
      report += '\n';
    } else {
      report += '检测到的模式：无异常\n\n';
    }
    
    report += `干预阈值：${(this.config.interventionThreshold * 100).toFixed(0)}%\n`;
    report += `静默模式：${this.config.silentMode ? '开启' : '关闭'}\n`;
    report += `干预历史：${this.interventionHistory.length} 次\n`;
    
    report += '\n' + '═'.repeat(40) + '\n';
    report += `最后更新：${state.lastUpdate || '无'}\n`;
    
    return report;
  }

  /**
   * 获取阶段名称
   */
  getPhaseName(phase) {
    const names = {
      neutral: '平静',
      entering: '进入中',
      flow: '心流',
      frustrated: '挫败',
      recovery: '恢复中'
    };
    return names[phase] || phase;
  }

  /**
   * 获取模式名称
   */
  getPatternName(pattern) {
    const names = {
      repeatedEdits: '重复编辑',
      errorLoop: '错误循环',
      negativeLanguage: '负面语言',
      shortPauses: '短暂停 (焦虑)',
      longPauses: '长暂停 (困惑)'
    };
    return names[pattern] || pattern;
  }
}

// 创建全局实例
const flowPredictor = new FlowPredictor();

// 导出
module.exports = FlowPredictor;
module.exports.flowPredictor = flowPredictor;
module.exports.recordEdit = (event) => flowPredictor.recordEdit(event);
module.exports.recordError = (event) => flowPredictor.recordError(event);
module.exports.recordPause = (duration) => flowPredictor.recordPause(duration);
module.exports.analyzeLanguage = (input) => flowPredictor.analyzeLanguage(input);
module.exports.evaluateIntervention = () => flowPredictor.evaluateIntervention();
module.exports.getFlowState = () => flowPredictor.getFlowState();
module.exports.generateFlowReport = () => flowPredictor.generateReport();
module.exports.resetFlowPredictor = () => flowPredictor.reset();
module.exports.setFlowConfig = (config) => flowPredictor.setConfig(config);
