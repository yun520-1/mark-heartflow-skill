/**
 * HeartFlow v8.1.4 — 意识理论整合模块 (v9.2.0 恢复)
 *
 * 整合: IIT (整合信息理论) - Tononi
 *        GWT (全局工作空间) - Baars
 *        HOT (高阶思维) - Rosenthal
 *        预测加工 - Clark
 *        SEP 自我意识
 */
const ConsciousnessTheory = {
  version: '8.1.4',
  IIT: {
    name: 'Integrated Information Theory', author: 'Giulio Tononi', phi: 0,
    calculatePhi(neuralStates) {
      const n = neuralStates.length; if (n === 0) return 0;
      let sumSq = 0; for (const s of neuralStates) sumSq += s * s;
      this.phi = Math.sqrt(sumSq) / n; return this.phi;
    },
    interpret(phi) { return phi > 0.7 ? '高整合意识' : phi > 0.4 ? '中等整合意识' : '低整合意识'; },
  },
  GWT: {
    name: 'Global Workspace Theory', author: 'Bernard Baars',
    broadcastCapacity: 0, workspaceAvailability: 1,
    broadcast(info, attention) { this.broadcastCapacity = Math.min(1, info * attention); return this.calculate(); },
    calculate() { return this.broadcastCapacity * this.workspaceAvailability; },
  },
  HOT: {
    name: 'Higher-Order Thought Theory', author: 'David Rosenthal', probability: 0,
    calculate(content, accuracy = 0.9, metaAccess = 0.8) {
      this.probability = content * accuracy * metaAccess; return this.probability;
    },
  },
  PredictiveProcessing: {
    name: 'Predictive Processing', authors: 'Andy Clark, Shaun Gallagher',
    precision: 0, predictionError: 0,
    calculate(priors, sensoryInput, precisionWeight = 0.5) {
      const pe = sensoryInput - priors; this.predictionError = pe; this.precision = precisionWeight * Math.abs(pe);
      return { predictionError: pe, precision: this.precision, posterior: priors + this.precision };
    },
  },
  SelfConsciousness: {
    preReflective: 0, reflective: 0, forMeNess: 0, selfEvident: 0,
    calculate(input = {}) {
      this.preReflective = input.preReflective || 0.5; this.reflective = input.reflective || 0.5;
      this.forMeNess = input.forMeNess || 0.5; this.selfEvident = input.selfEvident || 0.5;
      return 0.35 * this.preReflective + 0.25 * this.reflective + 0.25 * this.forMeNess + 0.15 * this.selfEvident;
    },
    getLevel(sc) { return sc > 0.8 ? '高自我意识' : sc > 0.5 ? '中等自我意识' : '基础自我意识'; },
  },
  compute(input = {}) {
    const iit = this.IIT.calculatePhi(input.neuralStates || [0.5, 0.5, 0.5]);
    const gwt = this.GWT.calculate();
    const hot = this.HOT.calculate(input.content || 0.7);
    const pp = this.PredictiveProcessing.calculate(input.priors || 0.5, input.sensoryInput || 0.5);
    const sc = this.SelfConsciousness.calculate(input.self);
    const alpha = 0.6;
    return {
      IIT: { phi: iit, level: this.IIT.interpret(iit) },
      GWT: { capacity: gwt },
      HOT: { probability: hot },
      PredictiveProcessing: pp,
      SelfConsciousness: { score: sc, level: this.SelfConsciousness.getLevel(sc) },
      AI_Consciousness: { phi: alpha * iit + (1 - alpha) * gwt,
        level: (alpha * iit + (1 - alpha) * gwt) > 0.6 ? '高阶意识' : (alpha * iit + (1 - alpha) * gwt) > 0.3 ? '中等意识' : '基础意识' },
    };
  },
};
module.exports = ConsciousnessTheory;
