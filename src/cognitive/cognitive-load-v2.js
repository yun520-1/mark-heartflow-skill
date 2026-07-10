/**
 * Cognitive Load Engine v2 — 认知负载引擎（公式驱动升级版）
 * 
 * 基于 Sweller 认知负载理论 + 信息论 + 注意力模型
 * 
 * 集成公式：
 *   - 认知负载指数: CL = (intrinsic + extraneous + germane) / WMC
 *   - Shannon熵: H = -Σ p·log2(p)，量化信息不确定性
 *   - 注意力分配: K = 1/σ²（精确度权重）
 *   - 工作记忆衰减: R = exp(-t/S)（Cowan 4±2）
 *   - 认知负荷容量: Miller 7±2 → Cowan 4±2
 *   - 信息过载阈值: 当 H > H_max 时触发
 *   - 任务切换代价: switch_cost = a + b·log2(n_tasks)
 *   - 心流通道: Flow = 1 - |log2(challenge/skill)| / max_bits
 * 
 * dispatch: 'cognitiveLoad.estimate' / 'cognitiveLoad.attentionAllocation' / 'cognitiveLoad.flowState'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');

class CognitiveLoadEngineV2 {
  constructor(options = {}) {
    this._bridge = null;
    this.workingMemoryCapacity = options.workingMemoryCapacity || 5;  // Cowan 4±2
    this.maxEntropyBits = options.maxEntropyBits || 3.5;  // 信息过载阈值
    this._lastEstimate = null;
    this._attentionWeights = new Map();  // 通道 → 权重
    this._loadHistory = [];  // 负载历史
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // ═══════════════════════════════════════════
  // 认知负载评估（核心）
  // ═══════════════════════════════════════════

  /**
   * 评估认知负载（v2 增强版）
   * @param {string} text - 待分析文本
   * @param {object} [context] - { domain, taskComplexity, priorKnowledge }
   * @returns {object} { cl, intrinsic, extraneous, germane, entropy, loadLevel, recommendations }
   */
  estimate(text, context = {}) {
    const bridge = this._getBridge();
    const t = typeof text === 'string' ? text : '';
    const tokens = t.split(/\s+/).filter(Boolean);
    const uniqueTokens = new Set(tokens);
    const tokenCount = tokens.length;
    
    // ─── 内在负荷（intrinsic）───
    // 基于概念密度和技术术语比例
    const techKeywords = ['方程','算法','熵','微分','积分','矩阵','量子','神经网络','变换','傅里叶','拉普拉斯','张量',
      '优化','梯度','回归','贝叶斯','马尔可夫','泊松','高斯','卷积','注意力','变压器','编码器','解码器',
      'equation','algorithm','entropy','derivative','integral','matrix','quantum','transform','gradient','regression'];
    const techCount = tokens.filter(tk => techKeywords.some(kw => tk.toLowerCase().includes(kw.toLowerCase()))).length;
    const conceptDensity = uniqueTokens.size / Math.max(1, tokenCount);
    const intrinsic = 0.4 * (techCount / Math.max(1, tokenCount)) + 0.3 * conceptDensity + 0.3 * Math.min(1, tokenCount / 100);

    // ─── 外在负荷（extraneous）───
    // 基于文本结构复杂度（句子长度变化、嵌套层次）
    const sentences = t.split(/[。.!?！？]/).filter(s => s.trim().length > 0);
    const avgSentLen = sentences.length > 0 ? sentences.reduce((a, s) => a + s.length, 0) / sentences.length : 0;
    const sentLenVar = sentences.length > 1 ? sentences.reduce((a, s) => a + Math.pow(s.length - avgSentLen, 2), 0) / sentences.length : 0;
    const extraneous = 0.5 * Math.min(1, avgSentLen / 50) + 0.3 * Math.min(1, Math.sqrt(sentLenVar) / 20) + 0.2 * (sentences.length > 10 ? 0.5 : 0.1);

    // ─── 相关负荷（germane）───
    // 基于上下文匹配度和先验知识
    const priorKnowledge = context.priorKnowledge || 0.5;
    const domain = context.domain || 'general';
    const germane = 0.5 * priorKnowledge + 0.3 * (domain !== 'general' ? 0.7 : 0.3) + 0.2 * Math.min(1, uniqueTokens.size / 30);

    // ─── 总认知负荷 ───
    const cl = (intrinsic + extraneous + germane) / this.workingMemoryCapacity;

    // ─── Shannon熵（信息不确定性）───
    const freq = {};
    for (const tk of tokens) freq[tk] = (freq[tk] || 0) + 1;
    const probs = Object.values(freq).map(c => c / tokenCount);
    const entropy = bridge.shannonEntropy(probs);

    // ─── 负载等级 ───
    let loadLevel;
    if (cl < 0.3) loadLevel = 'low';
    else if (cl < 0.5) loadLevel = 'moderate';
    else if (cl < 0.7) loadLevel = 'high';
    else loadLevel = 'overload';

    // ─── 信息过载检测 ───
    const isInfoOverload = entropy > this.maxEntropyBits;

    // ─── 建议 ───
    const recommendations = [];
    if (cl > 0.7) recommendations.push('break_into_chunks');
    if (extraneous > 0.5) recommendations.push('simplify_structure');
    if (isInfoOverload) recommendations.push('reduce_information_density');
    if (intrinsic > 0.5 && priorKnowledge < 0.3) recommendations.push('provide_prerequisites');
    if (cl < 0.3) recommendations.push('increase_challenge_for_flow');

    this._lastEstimate = { cl, intrinsic, extraneous, germane, entropy, loadLevel, isInfoOverload };
    this._loadHistory.push({ ...this._lastEstimate, ts: Date.now() });
    if (this._loadHistory.length > 100) this._loadHistory.shift();

    return {
      cl: +cl.toFixed(4),
      intrinsic: +intrinsic.toFixed(4),
      extraneous: +extraneous.toFixed(4),
      germane: +germane.toFixed(4),
      entropy: +entropy.toFixed(4),
      entropyBits: +entropy.toFixed(2),
      loadLevel,
      isInfoOverload,
      recommendations,
      workingMemoryCapacity: this.workingMemoryCapacity
    };
  }

  // ═══════════════════════════════════════════
  // 注意力分配（精确度权重模型）
  // ═══════════════════════════════════════════

  /**
   * 基于精确度权重的注意力分配
   * γ_i = 1/σ²_i，分配注意力资源到最不确定的信息
   * @param {Array<{id:string, uncertainty:number}>} channels - 注意力通道及不确定性
   * @returns {object} { allocation, dominant, totalPrecision }
   */
  attentionAllocation(channels) {
    const bridge = this._getBridge();
    if (!Array.isArray(channels) || channels.length === 0) return { allocation: [], dominant: null, totalPrecision: 0 };

    // 精确度权重
    const precisions = channels.map(ch => bridge.precisionWeight(ch.uncertainty || 1));
    const totalPrecision = precisions.reduce((a, b) => a + b, 0);

    // 归一化为注意力分配
    const allocation = channels.map((ch, i) => ({
      id: ch.id,
      uncertainty: ch.uncertainty,
      precision: +precisions[i].toFixed(4),
      attentionWeight: +(precisions[i] / (totalPrecision || 1)).toFixed(4)
    }));

    const dominant = allocation.reduce((a, b) => a.attentionWeight > b.attentionWeight ? a : b);

    return { allocation, dominant: dominant.id, totalPrecision: +totalPrecision.toFixed(4) };
  }

  // ═══════════════════════════════════════════
  // 心流状态评估
  // ═══════════════════════════════════════════

  /**
   * 心流通道计算
   * Flow = 1 - |log2(challenge/skill)| / max_bits
   * @param {number} challenge - 挑战水平(0-1)
   * @param {number} skill - 技能水平(0-1)
   * @returns {object} { flowScore, state, optimalChallenge, gapToFlow }
   */
  flowState(challenge, skill) {
    const bridge = this._getBridge();
    const flowScore = bridge.flowChannel(challenge, Math.max(0.01, skill));
    const optimalChallenge = bridge.flowOptimal(skill);

    let state;
    if (flowScore > 0.8) state = 'flow';
    else if (challenge > skill * 1.3) state = 'anxiety';
    else if (challenge < skill * 0.7) state = 'boredom';
    else state = 'arousal';

    return {
      flowScore: +flowScore.toFixed(4),
      state,
      challenge: +challenge.toFixed(3),
      skill: +skill.toFixed(3),
      optimalChallenge: +optimalChallenge.toFixed(3),
      gapToFlow: +Math.abs(challenge - optimalChallenge).toFixed(3)
    };
  }

  // ═══════════════════════════════════════════
  // 任务切换代价
  // ═══════════════════════════════════════════

  /**
   * 任务切换代价模型
   * cost = a + b·log2(n_tasks) + c·similarity_gap
   * @param {number} nTasks - 并行任务数
   * @param {number} similarityGap - 任务间相似度差异(0-1)
   * @returns {object} { switchCost, cognitiveOverhead, recommendation }
   */
  taskSwitchCost(nTasks, similarityGap = 0.5) {
    const a = 0.15, b = 0.08, c = 0.2;
    const cost = a + b * Math.log2(nTasks) + c * similarityGap;
    const overhead = cost * nTasks;
    
    let recommendation;
    if (nTasks <= 2) recommendation = 'manageable';
    else if (nTasks <= 4) recommendation = 'batch_similar_tasks';
    else recommendation = 'sequential_processing_recommended';

    return {
      switchCost: +cost.toFixed(4),
      cognitiveOverhead: +overhead.toFixed(4),
      nTasks,
      recommendation
    };
  }

  // ═══════════════════════════════════════════
  // 认知负载历史分析
  // ═══════════════════════════════════════════

  /**
   * 分析认知负载趋势
   * @returns {object} { trend, averageCL, peakCL, currentCL, suggestion }
   */
  analyzeTrend() {
    if (this._loadHistory.length < 2) return { trend: 'insufficient_data', averageCL: 0, peakCL: 0, currentCL: 0 };

    const cls = this._loadHistory.map(h => h.cl);
    const avg = cls.reduce((a, b) => a + b, 0) / cls.length;
    const peak = Math.max(...cls);
    const current = cls[cls.length - 1];
    
    // 简单趋势：最近3个vs之前3个
    const recent = cls.slice(-3);
    const earlier = cls.slice(-6, -3);
    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : avg;
    const earlierAvg = earlier.length > 0 ? earlier.reduce((a, b) => a + b, 0) / earlier.length : avg;
    
    let trend;
    if (recentAvg > earlierAvg + 0.05) trend = 'increasing';
    else if (recentAvg < earlierAvg - 0.05) trend = 'decreasing';
    else trend = 'stable';

    return {
      trend,
      averageCL: +avg.toFixed(4),
      peakCL: +peak.toFixed(4),
      currentCL: +current.toFixed(4),
      suggestion: trend === 'increasing' ? 'reduce_load' : trend === 'decreasing' ? 'can_increase_complexity' : 'maintain'
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'ok',
      workingMemoryCapacity: this.workingMemoryCapacity,
      maxEntropyBits: this.maxEntropyBits,
      lastEstimate: this._lastEstimate,
      historyLength: this._loadHistory.length,
      modules: ['estimate', 'attention', 'flow', 'switchCost', 'trend']
    };
  }
}

module.exports = { CognitiveLoadEngineV2 };
