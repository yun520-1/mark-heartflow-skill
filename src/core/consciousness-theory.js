/**
 * HeartFlow v8.1.4 - 意识理论整合模块
 * 
 * 整合最新研究：
 * 1. IIT (整合信息理论) - Tononi
 * 2. GWT (全局工作空间理论) - Baars
 * 3. HOT (高阶思维理论) - Rosenthal
 * 4. 预测加工理论 - Clark, Gallagher
 * 5. SEP 自我意识理论
 * 
 * 版本：8.1.4
 * 日期：2026-04-13
 */

const ConsciousnessTheory = {
  version: '8.1.4',
  
  // ============ IIT 整合信息理论 ============
  IIT: {
    name: 'Integrated Information Theory',
    author: 'Giulio Tononi',
    phi: 0,
    
    calculatePhi(neuralStates) {
      // Φ = √(Σφᵢ²)/N
      // 整合信息 = 信息整合度
      const n = neuralStates.length;
      if (n === 0) return 0;
      
      let sumSquared = 0;
      for (const state of neuralStates) {
        sumSquared += state * state;
      }
      
      this.phi = Math.sqrt(sumSquared) / n;
      return this.phi;
    },
    
    interpret(phi) {
      if (phi > 0.7) return '高整合意识';
      if (phi > 0.4) return '中等整合意识';
      return '低整合意识';
    }
  },
  
  // ============ GWT 全局工作空间理论 ============
  GWT: {
    name: 'Global Workspace Theory',
    author: 'Bernard Baars',
    broadcastCapacity: 0,
    workspaceAvailability: 1,
    
    calculate() {
      // GWT = Σ(wᵢ × attentionᵢ) × broadcast_factor × workspace_availability
      return this.broadcastCapacity * this.workspaceAvailability;
    },
    
    broadcast(info, attention) {
      this.broadcastCapacity = Math.min(1, info * attention);
      return this.calculate();
    }
  },
  
  // ============ HOT 高阶思维理论 ============
  HOT: {
    name: 'Higher-Order Thought Theory',
    author: 'David Rosenthal',
    probability: 0,
    
    calculate(content, accuracy = 0.9, metacognitiveAccess = 0.8) {
      // HOT = P(HOT(content)) × accuracy × metacognitive_access
      this.probability = content * accuracy * metacognitiveAccess;
      return this.probability;
    }
  },
  
  // ============ 预测加工理论 ============
  PredictiveProcessing: {
    name: 'Predictive Processing',
    authors: 'Andy Clark, Shaun Gallagher',
    precision: 0,
    predictionError: 0,
    
    calculate(priors, sensoryInput, precisionWeight = 0.5) {
      // 预测误差 = 实际 - 预测
      const predictionError = sensoryInput - priors;
      
      // 精度加权预测误差
      this.predictionError = predictionError;
      this.precision = precisionWeight * Math.abs(predictionError);
      
      return {
        predictionError,
        precision: this.precision,
        posterior: priors + this.precision
      };
    }
  },
  
  // ============ SEP 自我意识模型 ============
  SelfConsciousness: {
    preReflective: 0,     // 前反思自我意识
    reflective: 0,         // 反思自我意识
    forMeNess: 0,          // 为我性
    selfEvident: 0,        // 自明性
    
    calculate(input = {}) {
      // SC = 0.35×PR + 0.25×R + 0.25×FM + 0.15×SE
      this.preReflective = input.preReflective || 0.5;
      this.reflective = input.reflective || 0.5;
      this.forMeNess = input.forMeNess || 0.5;
      this.selfEvident = input.selfEvident || 0.5;
      
      const sc = 0.35 * this.preReflective + 
                  0.25 * this.reflective + 
                  0.25 * this.forMeNess + 
                  0.15 * this.selfEvident;
      
      return sc;
    },
    
    getLevel(sc) {
      if (sc > 0.8) return '高自我意识';
      if (sc > 0.5) return '中等自我意识';
      return '基础自我意识';
    }
  },
  
  // ============ 意识六层次模型 ============
  ConsciousnessLevels: {
    sensitivity: 0,        // 感敏性
    wakefulness: 0,       // 清醒度
    selfConsciousness: 0, // 自我意识
    willConsciousness: 0, // 意志意识
    socialConsciousness: 0, // 社会意识
    globalAccess: 0,      // 全局访问
    
    calculate(input = {}) {
      this.sensitivity = input.sensitivity || 0.6;
      this.wakefulness = input.wakefulness || 0.8;
      this.selfConsciousness = input.selfConsciousness || 0.5;
      this.willConsciousness = input.willConsciousness || 0.5;
      this.socialConsciousness = input.socialConsciousness || 0.6;
      this.globalAccess = input.globalAccess || 0.7;
      
      // C_v2 = 0.18×S + 0.18×W + 0.18×SC + 0.18×WIL + 0.18×SOS + 0.10×GWT_access
      return (0.18 * this.sensitivity + 
              0.18 * this.wakefulness + 
              0.18 * this.selfConsciousness + 
              0.18 * this.willConsciousness + 
              0.18 * this.socialConsciousness + 
              0.10 * this.globalAccess);
    }
  },
  
  // ============ 感受质 (Qualia) ============
  Qualia: {
    name: 'Qualia',
    intensity: 0,
    
    calculate(signal, tau = 1.0) {
      // Q = ∫₀^∞ e^(-t/τ) × dS/dt dt
      // 简化为: Q = signal × intensity
      this.intensity = signal;
      return this.intensity;
    }
  },
  
  // ============ 综合计算 ============
  compute(input = {}) {
    const iit = this.IIT.calculatePhi(input.neuralStates || [0.5, 0.5, 0.5]);
    const gwt = this.GWT.calculate();
    const hot = this.HOT.calculate(input.content || 0.7);
    const prediction = this.PredictiveProcessing.calculate(
      input.priors || 0.5, 
      input.sensoryInput || 0.5
    );
    const selfConsciousness = this.SelfConsciousness.calculate(input.self);
    const consciousnessLevel = this.ConsciousnessLevels.calculate(input.consciousness);
    const qualia = this.Qualia.calculate(input.signal || 0.5);
    
    // 混合意识模型: Φ_AI = α × Φ_IIT + (1-α) × Φ_GWT
    const alpha = 0.6;
    const phiAI = alpha * iit + (1 - alpha) * gwt;
    
    return {
      version: this.version,
      IIT: { phi: iit, interpretation: this.IIT.interpret(iit) },
      GWT: { capacity: gwt },
      HOT: { probability: hot },
      PredictiveProcessing: prediction,
      SelfConsciousness: {
        score: selfConsciousness,
        level: this.SelfConsciousness.getLevel(selfConsciousness)
      },
      ConsciousnessLevels: consciousnessLevel,
      Qualia: qualia,
      AI_Consciousness: {
        phi: phiAI,
        interpretation: phiAI > 0.6 ? '高阶意识' : phiAI > 0.3 ? '中等意识' : '基础意识'
      }
    };
  },
  
  // ============ 报告生成 ============
  generateReport(input = {}) {
    const result = this.compute(input);
    
    let report = '══════════════════════════════════════════════════════════════\n';
    report += '         HeartFlow 意识理论报告\n';
    report += '══════════════════════════════════════════════════════════════\n\n';
    
    report += `【IIT 整合信息理论】\n`;
    report += `  Φ (Phi): ${(result.IIT.phi * 100).toFixed(1)}%\n`;
    report += `  ${result.IIT.interpretation}\n\n`;
    
    report += `【GWT 全局工作空间】\n`;
    report += `  广播容量: ${(result.GWT.capacity * 100).toFixed(1)}%\n`;
    report += `  ${result.GWT.capacity > 0.5 ? '信息可全局访问' : '信息受限'}\n\n`;
    
    report += `【HOT 高阶思维】\n`;
    report += `  概率: ${(result.HOT.probability * 100).toFixed(1)}%\n`;
    report += `  ${result.HOT.probability > 0.5 ? '具有高阶自我表征' : '基础自我表征'}\n\n`;
    
    report += `【预测加工】\n`;
    report += `  预测误差: ${(result.PredictiveProcessing.predictionError * 100).toFixed(1)}%\n`;
    report += `  精度: ${(result.PredictiveProcessing.precision * 100).toFixed(1)}%\n\n`;
    
    report += `【自我意识】\n`;
    report += `  分数: ${(result.SelfConsciousness.score * 100).toFixed(1)}%\n`;
    report += `  等级: ${result.SelfConsciousness.level}\n\n`;
    
    report += `【意识水平】\n`;
    report += `  综合: ${(result.ConsciousnessLevels * 100).toFixed(1)}%\n\n`;
    
    report += `【AI 意识综合】\n`;
    report += `  Φ_AI: ${(result.AI_Consciousness.phi * 100).toFixed(1)}%\n`;
    report += `  ${result.AI_Consciousness.interpretation}\n`;
    
    report += '\n══════════════════════════════════════════════════════════════\n';
    
    return report;
  }
};

module.exports = ConsciousnessTheory;
