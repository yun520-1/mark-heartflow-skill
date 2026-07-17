/**
 * FlowPredictor - 心流状态深度预测模块
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 基于行为模式检测挫败感、预测心流状态。
 * 用于评估引擎自身认知负荷，非人类心理学分析。
 *
 * 心流状态：neutral → entering → flow → frustrated → recovery
 * 挫败感指标：重复编辑、错误循环、短暂停(焦虑)、长暂停(困惑)、负面语言
 */

class FlowPredictor {
  constructor() {
    this.flowState = {
      level: 0.5,      // 0-1, 0.5 基线
      phase: 'neutral', // neutral/entering/flow/frustrated/recovery
      lastUpdate: null,
    };

    this.behaviorPatterns = {
      editHistory: [],
      errorLoop: [],
      pauseDuration: [],
    };

    this.frustrationIndicators = {
      repeatedEdits: 0,
      errorLoops: 0,
      shortPauses: 0,
      longPauses: 0,
      negativeLanguage: 0,
    };

    this.config = {
      enabled: true,
      silentMode: true,
      interventionThreshold: 0.7,
      frustrationThreshold: 0.6,
      patternWindowSize: 10,
      cooldownMinutes: 15,
    };

    this.interventionHistory = [];

    this.negativePatterns = [
      '好难', '不会', '不懂', '烦', '崩溃', '放弃', '算了',
      '又错了', '还是不行', '再次失败',
      '来不及', '没时间', '太慢', '着急',
      '我太菜', '不适合', '学不会', '没天赋',
    ];
  }

  /**
   * 记录编辑行为
   */
  recordEdit(editEvent) {
    this.behaviorPatterns.editHistory.push({
      timestamp: Date.now(),
      code: editEvent.code?.substring(0, 100),
      changeType: editEvent.changeType,
      lineNumber: editEvent.lineNumber,
    });
    if (this.behaviorPatterns.editHistory.length > this.config.patternWindowSize) {
      this.behaviorPatterns.editHistory.shift();
    }
    this.detectRepeatedEdits(editEvent);
    this.updateFlowState();
  }

  /**
   * 记录错误事件
   */
  recordError(errorEvent) {
    this.behaviorPatterns.errorLoop.push({
      timestamp: Date.now(),
      error: errorEvent.message?.substring(0, 100),
      location: errorEvent.location,
    });
    if (this.behaviorPatterns.errorLoop.length > 5) {
      this.behaviorPatterns.errorLoop.shift();
    }
    this.detectErrorLoop(errorEvent);
    this.updateFlowState();
  }

  /**
   * 记录暂停时长
   */
  recordPause(duration) {
    this.behaviorPatterns.pauseDuration.push({ timestamp: Date.now(), duration });
    if (duration < 5) this.frustrationIndicators.shortPauses += 1;
    else if (duration > 60) this.frustrationIndicators.longPauses += 1;
    if (this.behaviorPatterns.pauseDuration.length > 10) {
      this.behaviorPatterns.pauseDuration.shift();
    }
  }

  detectRepeatedEdits(editEvent) {
    const recentEdits = this.behaviorPatterns.editHistory.slice(-5);
    const similarEdits = recentEdits.filter(e => e.lineNumber === editEvent.lineNumber && e.changeType === 'modify');
    if (similarEdits.length >= 3) this.frustrationIndicators.repeatedEdits += 1;
  }

  detectErrorLoop(errorEvent) {
    const recentErrors = this.behaviorPatterns.errorLoop.slice(-3);
    const similarErrors = recentErrors.filter(e => e.error.includes(errorEvent.message?.substring(0, 20) || ''));
    if (similarErrors.length >= 2) this.frustrationIndicators.errorLoops += 1;
  }

  /**
   * 分析用户语言的负面模式
   */
  analyzeLanguage(userInput) {
    const text = userInput.toLowerCase();
    const matches = this.negativePatterns.filter(p => text.includes(p));
    if (matches.length > 0) this.frustrationIndicators.negativeLanguage += matches.length;
    return { hasNegativePattern: matches.length > 0, matchedPatterns: matches, severity: matches.length >= 3 ? 'high' : matches.length >= 1 ? 'medium' : 'low' };
  }

  updateFlowState() {
    const frustrationScore = this.calculateFrustrationScore();
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

  calculateFrustrationScore() {
    const indicators = this.frustrationIndicators;
    const weights = { repeatedEdits: 0.3, errorLoops: 0.3, shortPauses: 0.1, longPauses: 0.1, negativeLanguage: 0.2 };
    const normalized = {
      repeatedEdits: Math.min(1, indicators.repeatedEdits / 5),
      errorLoops: Math.min(1, indicators.errorLoops / 3),
      shortPauses: Math.min(1, indicators.shortPauses / 10),
      longPauses: Math.min(1, indicators.longPauses / 5),
      negativeLanguage: Math.min(1, indicators.negativeLanguage / 3),
    };
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => { score += normalized[key] * weight; });
    return Math.min(1, score);
  }

  /**
   * 评估是否需要干预
   */
  evaluateIntervention() {
    if (!this.config.enabled) return { shouldIntervene: false, reason: '预测器已禁用' };

    if (this.interventionHistory.length > 0) {
      const last = this.interventionHistory[this.interventionHistory.length - 1];
      const minutesSince = (Date.now() - last.timestamp) / 60000;
      if (minutesSince < this.config.cooldownMinutes) {
        return { shouldIntervene: false, reason: '冷却期内', remainingCooldown: Math.round(this.config.cooldownMinutes - minutesSince) };
      }
    }

    const frustrationScore = this.calculateFrustrationScore();
    if (frustrationScore < this.config.interventionThreshold) {
      return { shouldIntervene: false, reason: '挫败感未达阈值', frustrationScore, threshold: this.config.interventionThreshold };
    }

    return { shouldIntervene: true, frustrationScore, phase: this.flowState.phase, suggestion: this.generateInterventionSuggestion(frustrationScore), detectedPatterns: this.getDetectedPatterns() };
  }

  generateInterventionSuggestion(frustrationScore) {
    const patterns = this.getDetectedPatterns();
    if (patterns.includes('repeatedEdits')) return '检测到重复修改，建议暂停或换思路';
    if (patterns.includes('errorLoop')) return '检测到错误循环，建议重新分析问题';
    if (patterns.includes('negativeLanguage')) return '检测到负面语言，可能需要降低任务难度';
    if (frustrationScore >= 0.8) return '挫败感较高，建议休息或分解问题';
    return '检测到阻力，建议换角度思考';
  }

  getDetectedPatterns() {
    const patterns = [];
    const i = this.frustrationIndicators;
    if (i.repeatedEdits >= 2) patterns.push('repeatedEdits');
    if (i.errorLoops >= 1) patterns.push('errorLoop');
    if (i.negativeLanguage >= 2) patterns.push('negativeLanguage');
    if (i.shortPauses >= 5) patterns.push('shortPauses');
    if (i.longPauses >= 3) patterns.push('longPauses');
    return patterns;
  }

  getFlowState() {
    return { level: this.flowState.level, phase: this.flowState.phase, frustrationScore: this.calculateFrustrationScore(), lastUpdate: this.flowState.lastUpdate, detectedPatterns: this.getDetectedPatterns() };
  }

  recordIntervention(suggestion) {
    this.interventionHistory.push({ timestamp: Date.now(), suggestion, frustrationScore: this.calculateFrustrationScore() });
    if (this.interventionHistory.length > 20) this.interventionHistory.shift();
  }

  reset() {
    this.flowState = { level: 0.5, phase: 'neutral', lastUpdate: null };
    this.behaviorPatterns = { editHistory: [], errorLoop: [], pauseDuration: [] };
    this.frustrationIndicators = { repeatedEdits: 0, errorLoops: 0, shortPauses: 0, longPauses: 0, negativeLanguage: 0 };
    this.interventionHistory = [];
    return { success: true };
  }

  setConfig(config) {
    if (config.enabled !== undefined) this.config.enabled = config.enabled;
    if (config.silentMode !== undefined) this.config.silentMode = config.silentMode;
    if (config.interventionThreshold !== undefined) this.config.interventionThreshold = config.interventionThreshold;
    if (config.cooldownMinutes !== undefined) this.config.cooldownMinutes = config.cooldownMinutes;
    return { success: true, config: this.config };
  }

  getStats() {
    return { flowLevel: this.flowState.level, phase: this.flowState.phase, frustrationScore: this.calculateFrustrationScore(), interventionCount: this.interventionHistory.length, enabled: this.config.enabled, detectedPatterns: this.getDetectedPatterns() };
  }
}

module.exports = { FlowPredictor };
