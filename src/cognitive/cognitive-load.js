/**
 * Cognitive Load Index Calculator
 * 公式：CL = (intrinsic + extraneous + germane) / working_memory_capacity
 * 来源：Sweller (1988) 认知负载理论
 *
 * dispatch: 'cognitiveIndex.estimate(text, context)'
 */

class CognitiveLoadCalculator {
  constructor(options = {}) {
    this.workingMemoryCapacity = options.workingMemoryCapacity || 72;
    this._lastEstimate = null;
  }

  estimate(text, context = {}) {
    const t = typeof text === 'string' ? text : '';
    const c = context || {};
    const lower = t.toLowerCase();

    // 1. 内在负载
    let intrinsic = 0;
    intrinsic += Math.floor(t.length / 100);
    // 中文技术关键词密度（每个 ≈ 3 bits）
    const techZh = ['方程','梯度','偏微分','积分','导数','定理','推论','证明','算法','优化','参数','梯度','熵','收敛','维度','湍流','雷诺','动能','拉普拉斯','傅里叶','麦克斯韦','薛定谔','爱因斯坦'];
    techZh.forEach(w => { if (t.includes(w)) intrinsic += 3; });
    // 英文技术术语
    ['algorithm','optimize','parameter','gradient','entropy','convergence','dimension','theorem','lemma','corollary','int','sum','nabla','delta'].forEach(w => {
      if (lower.includes(w)) intrinsic += 2;
    });
    // 数学符号（Unicode）
    if (/[∫∑∂∇Δλμσ∮∞≈≠≤≥]/.test(t)) intrinsic += 5;
    // 代码块
    intrinsic += ((t.match(/```/g) || []).length / 2) * 8;
    // 逻辑连接词
    ['however','therefore','moreover','consequently','whereas','nevertheless'].forEach(w => {
      if (lower.includes(w)) intrinsic += 1;
    });
    intrinsic = Math.min(40, intrinsic);

    // 2. 外在负载
    let extraneous = 0;
    ['maybe','perhaps','probably','sort of','kind of','not sure'].forEach(w => {
      if (lower.includes(w)) extraneous += 2;
    });
    ['not ','never ','no ','without','fail'].forEach(w => {
      if (lower.includes(w)) extraneous += 3;
    });
    const sentences = t.split(/[。！？.!?]+/).filter(Boolean);
    sentences.forEach(s => {
      const words = s.trim().split(/\\s+/);
      if (words.length > 30) extraneous += 4;
      else if (words.length > 20) extraneous += 2;
    });
    if (c.isMultimodal) extraneous += 6;
    extraneous = Math.min(25, extraneous);

    // 3. 关联负载
    let germane = 0;
    if (/\\b(like|similar to|for example|e\\.g\\.|such as)\\b/gi.test(t)) germane += 5;
    if (/\\b(why|how does|what if|explain)\\b/gi.test(t)) germane += 4;
    if ((c.historyLength || 0) > 5) germane += 3;
    germane = Math.min(15, germane);

    // 4. 总 CL
    const rawCL = intrinsic + extraneous + germane;
    const CL = Math.min(1.0, rawCL / this.workingMemoryCapacity);

    const result = {
      CL: Math.round(CL * 1000) / 1000,
      level: CL < 0.3 ? 'low' : CL < 0.6 ? 'moderate' : CL < 0.85 ? 'high' : 'overload',
      breakdown: {
        intrinsic: Math.round(intrinsic * 1000) / 1000,
        extraneous: Math.round(extraneous * 1000) / 1000,
        germane: Math.round(germane * 1000) / 1000,
        capacity: this.workingMemoryCapacity,
      },
      recommendation: CL < 0.3 ? '负载较低，可增加任务复杂度'
        : CL < 0.6 ? '负载适中，可正常推进'
        : CL < 0.85 ? '负载较高，建议分步处理或简化表达'
        : '认知过载！建议拆分任务、暂停并总结',
    };

    this._lastEstimate = result;
    return result;
  }

  calibrate(capacity) {
    if (typeof capacity === 'number' && capacity > 0) {
      this.workingMemoryCapacity = capacity;
      return { ok: true, capacity };
    }
    return { ok: false, error: '容量必须是正数' };
  }

  healthCheck() {
    return {
      module: 'cognitiveIndex',
      lastCL: this._lastEstimate ? this._lastEstimate.CL : null,
      level: this._lastEstimate ? this._lastEstimate.level : null,
      capacity: this.workingMemoryCapacity,
    };
  }
}

module.exports = { CognitiveLoadCalculator };
