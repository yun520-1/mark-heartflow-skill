/**
 * AdaptiveController — 自适应调节引擎
 * 来源: claude-clarity v1.8.2 吸收集成
 * 根据用户状态和任务复杂度动态调整干预策略
 */
class AdaptiveController {
  constructor() {
    this.enabled = true;
    this.currentPolicy = this.getDefaultPolicy();
    this.history = [];
    // [v6.2.7] 级联成本估计
    this._costHistory = [];
  }

  getDefaultPolicy() {
    return { frequency: 'normal', style: 'neutral', lastAdjustment: Date.now(), consecutiveSameState: 0 };
  }

  // [v6.2.7] 级联成本估计：action_cost + (fail_probability * reversal_cost)
  estimateCascadeCost(actionCost, failProbability, reversalCost) {
    const cascade = actionCost + (Math.min(1, Math.max(0, failProbability)) * (reversalCost || actionCost));
    this._costHistory.push({ ts: Date.now(), actionCost, failProbability, reversalCost, cascade });
    if (this._costHistory.length > 200) this._costHistory.splice(0, 50);
    return { cascade, actionCost, failProbability, effectiveReversalCost: reversalCost || actionCost };
  }

  getCascadeStats() {
    if (this._costHistory.length === 0) return { total: 0, avgCascade: 0, maxCascade: 0 };
    const cascades = this._costHistory.map(e => e.cascade);
    return {
      total: this._costHistory.length,
      avgCascade: cascades.reduce((a, b) => a + b, 0) / cascades.length,
      maxCascade: Math.max(...cascades),
    };
  }

  adjustInterventionPolicy(userFlowState, taskComplexity) {
    if (!this.enabled) return { frequency: 'disabled', style: 'none', message: '', state: 'disabled', enabled: false };
    const state = userFlowState?.state || 'neutral';
    const intensity = userFlowState?.intensity || 0.5;
    const complexity = taskComplexity || 0.5;
    const policy = this.calculatePolicy(state, intensity, complexity);
    this.history.push({ timestamp: Date.now(), state, intensity, complexity, policy });
    if (this.history.length > 100) this.history.shift();
    this.currentPolicy = policy;
    return policy;
  }

  calculatePolicy(state, intensity, complexity) {
    let frequency, style;
    switch (state) {
      case 'deep-flow': frequency = 'very-low'; style = 'minimal'; break;
      case 'light-flow': frequency = 'low'; style = 'gentle'; break;
      case 'distracted': frequency = intensity > 0.7 ? 'high' : 'medium'; style = 'empathetic'; break;
      case 'anxious': case 'frustrated': frequency = 'high'; style = 'empathetic'; break;
      case 'bored': frequency = 'low'; style = 'challenging'; break;
      default: frequency = 'normal'; style = 'gentle';
    }
    if (complexity > 0.8 && frequency !== 'very-low') frequency = this.escalateFrequency(frequency);
    return { frequency, style, state, intensity, complexity, timestamp: Date.now() };
  }

  escalateFrequency(frequency) {
    const levels = ['very-low', 'low', 'normal', 'high', 'very-high'];
    const ci = levels.indexOf(frequency);
    return ci < levels.length - 1 ? levels[ci + 1] : frequency;
  }

  setEnabled(enabled) { this.enabled = enabled; this.currentPolicy = enabled ? this.getDefaultPolicy() : { frequency: 'disabled', style: 'none', enabled: false }; return { enabled, policy: this.currentPolicy }; }
  getStatus() { return { enabled: this.enabled, currentPolicy: this.currentPolicy, historyCount: this.history.length }; }
  getHistory(count = 10) { return this.history.slice(-count); }
}

module.exports = { AdaptiveController };
