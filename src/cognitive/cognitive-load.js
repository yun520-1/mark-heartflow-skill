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
    // [FORMULA] 公式桥接（Shannon 熵），懒加载单例
    this._formulaBridge = null;
  }

  _getFormulaBridge() {
    if (!this._formulaBridge) {
      try {
        const { getFormulaBridge } = require('../formula/formula-bridge.js');
        this._formulaBridge = getFormulaBridge();
      } catch (e) {
        this._formulaBridge = null;
      }
    }
    return this._formulaBridge;
  }

  estimate(text, context = {}) {
    const t = typeof text === 'string' ? text : '';
    const c = context || {};
    const lower = t.toLowerCase();

    // 0. [FORMULA] 概念分布熵（Shannon 熵）：量化文本概念的不确定性/信息量
    // 心虫公式库 shannon_entropy: H = -Σ p(x) * log2(p(x))
    // 匹配认知负荷本质：输入越"杂散不可预测"，处理负荷越高
    let entropyLoad = 0;
    const bridge = this._getFormulaBridge();
    if (bridge && t.length > 0) {
      // [FORMULA] 概念分布熵：用字符 bigram（相邻字对）作为 token
      // 对中文（无空格分词）更合理，能反映"概念分布的不确定性"
      const cleaned = t.replace(/\s+/g, '');
      const tokens = [];
      if (cleaned.length >= 2) {
        for (let i = 0; i < cleaned.length - 1; i++) tokens.push(cleaned.slice(i, i + 2));
      } else if (cleaned.length === 1) {
        tokens.push(cleaned);
      }
      if (tokens.length > 1) {
        const freq = {};
        tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
        const counts = Object.values(freq);
        const H = bridge.shannonEntropy(counts); // bits
        const maxH = Math.log2(tokens.length);
        const normH = maxH > 0 ? H / maxH : 0;
        // 短文本（<10 bigram）熵天然偏高且不可靠，做长度衰减
        const lenFactor = Math.min(1, tokens.length / 10);
        entropyLoad = Math.min(4, normH * 4 * lenFactor);
      }
    }

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

    // 4. 总 CL（含概念分布熵分量）
    const rawCL = intrinsic + extraneous + germane + entropyLoad;
    const CL = Math.min(1.0, rawCL / this.workingMemoryCapacity);

    const result = {
      CL: Math.round(CL * 1000) / 1000,
      level: CL < 0.3 ? 'low' : CL < 0.6 ? 'moderate' : CL < 0.85 ? 'high' : 'overload',
      breakdown: {
        intrinsic: Math.round(intrinsic * 1000) / 1000,
        extraneous: Math.round(extraneous * 1000) / 1000,
        germane: Math.round(germane * 1000) / 1000,
        entropy: Math.round(entropyLoad * 1000) / 1000,
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
