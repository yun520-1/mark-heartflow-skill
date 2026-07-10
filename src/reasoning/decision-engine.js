/**
 * Decision Engine — 决策引擎（公式驱动）
 * 
 * 集成公式：
 *   - 漂移扩散模型 (DDM): 决策时间 + 错误率
 *   - 信号检测论 (SDT): d' + β + A'
 *   - 前景理论: 价值函数 + 概率权重
 *   - 贝叶斯信念更新: 后验 + 贝叶斯因子
 *   - Rescorla-Wagner: 学习/条件化
 *   - Q-Learning: 强化学习更新
 *   - 纳什均衡: 混合策略
 *   - 韦伯-费希纳: 感觉强度
 *   - 赫布学习: STDP突触可塑性
 *   - Hick定律: 反应时
 *   - Fitts定律: 运动时间
 * 
 * dispatch: 'decision.analyze' / 'decision.ddm' / 'decision.sdt' / 'decision.prospect'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');

class DecisionEngine {
  constructor(options = {}) {
    this._bridge = null;
    this._beliefState = new Map();  // 信念状态: hypothesis → probability
    this._qTable = new Map();       // Q值表: state_action → value
    this._learningRate = options.learningRate || 0.1;
    this._discountFactor = options.discountFactor || 0.95;
    this._explorationRate = options.explorationRate || 0.1;
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // ═══════════════════════════════════════════
  // 漂移扩散模型 (Drift Diffusion Model)
  // ═══════════════════════════════════════════

  /**
   * DDM 完整分析：给定漂移率/阈值/起始点，返回决策时间+错误率
   * @param {object} params - { drift, threshold, startingPoint, nonDecisionTime, noise }
   * @returns {object} { decisionTime, errorRate, accuracy, confidence }
   */
  ddmAnalyze(params = {}) {
    const { drift = 1, threshold = 1, startingPoint = 0, nonDecisionTime = 0.3, noise = 1 } = params;
    const bridge = this._getBridge();
    const dt = bridge.ddmDecisionTime(startingPoint, nonDecisionTime, drift, threshold, noise);
    const er = bridge.ddmErrorRate(startingPoint, nonDecisionTime, drift, threshold, noise);
    return {
      decisionTime: +dt.toFixed(4),
      errorRate: +Math.max(0, Math.min(1, er)).toFixed(4),
      accuracy: +(1 - Math.max(0, Math.min(1, er))).toFixed(4),
      confidence: +(1 - Math.max(0, Math.min(1, er))).toFixed(4),
      drift,
      threshold,
      startingPoint
    };
  }

  /**
   * DDM 参数拟合（从行为数据反推漂移率）
   * 简化：drift ≈ threshold / (RT - nonDecisionTime) × sign(accuracy)
   * @param {number} rt - 反应时(s)
   * @param {boolean} correct - 是否正确
   * @param {number} threshold - 阈值
   * @param {number} ndt - 非决策时间
   */
  ddmFitDrift(rt, correct, threshold = 1, ndt = 0.3) {
    const effectiveRT = Math.max(0.01, rt - ndt);
    const sign = correct ? 1 : -1;
    return +(sign * threshold / effectiveRT).toFixed(4);
  }

  // ═══════════════════════════════════════════
  // 信号检测论 (Signal Detection Theory)
  // ═══════════════════════════════════════════

  /**
   * SDT 完整分析：从命中率和虚报率计算所有SDT指标
   * @param {number} hitRate - 命中率
   * @param {number} falseAlarmRate - 虚报率
   * @returns {object} { dPrime, beta, aPrime, cCriterion, isUnbiased }
   */
  sdtAnalyze(hitRate, falseAlarmRate) {
    const bridge = this._getBridge();
    const dPrime = bridge.sdtDPrime(hitRate, falseAlarmRate);
    const beta = bridge.sdtBeta(hitRate, falseAlarmRate);
    const aPrime = bridge.sdtAPrime(hitRate, falseAlarmRate);
    // 决策准则 c = -0.5*(z(HR) + z(FAR))
    const c = -0.5 * dPrime;  // 简化近似
    return {
      dPrime: +dPrime.toFixed(4),
      beta: +beta.toFixed(4),
      aPrime: +aPrime.toFixed(4),
      cCriterion: +c.toFixed(4),
      isUnbiased: Math.abs(c) < 0.1,
      sensitivity: dPrime > 1 ? 'high' : dPrime > 0.5 ? 'moderate' : 'low',
      bias: c < -0.1 ? 'liberal' : c > 0.1 ? 'conservative' : 'neutral'
    };
  }

  // ═══════════════════════════════════════════
  // 前景理论 (Prospect Theory)
  // ═══════════════════════════════════════════

  /**
   * 前景理论完整决策分析
   * @param {Array<{prob:number, outcome:number}>} gambles - 赌局选项
   * @param {object} [params] - { alpha, beta, lambda, gamma }
   * @returns {object} { prospectValues, weightedProbs, subjectiveValues, bestChoice }
   */
  prospectAnalyze(gambles, params = {}) {
    const bridge = this._getBridge();
    const { alpha = 0.88, beta = 0.88, lambda = 2.25, gamma = 0.61 } = params;
    
    const results = gambles.map((g, idx) => {
      const v = bridge.prospectValue(g.outcome, { alpha, beta, lambda });
      const w = bridge.prospectWeight(g.prob, gamma);
      const sv = v * w;
      return { index: idx, outcome: g.outcome, prob: g.prob, value: v, weight: w, subjectiveValue: sv };
    });

    const best = results.reduce((a, b) => a.subjectiveValue > b.subjectiveValue ? a : b);
    return { results, bestChoice: best.index, bestSubjectiveValue: best.subjectiveValue };
  }

  // ═══════════════════════════════════════════
  // 贝叶斯信念更新
  // ═══════════════════════════════════════════

  /**
   * 更新信念状态
   * @param {string} hypothesis - 假设名
   * @param {number} likelihood - P(E|H)
   * @param {number} evidenceMarginal - P(E)
   * @returns {number} 后验概率
   */
  updateBelief(hypothesis, likelihood, evidenceMarginal) {
    const bridge = this._getBridge();
    const prior = this._beliefState.get(hypothesis) || 0.5;
    const posterior = bridge.bayesUpdate(likelihood, prior, evidenceMarginal);
    this._beliefState.set(hypothesis, Math.max(0, Math.min(1, posterior)));
    return +posterior.toFixed(6);
  }

  /**
   * 获取当前信念状态
   */
  getBeliefs() {
    return Object.fromEntries(this._beliefState);
  }

  /**
   * 贝叶斯因子比较两个假设
   * @returns {object} { bf, interpretation, favoredHypothesis }
   */
  compareHypotheses(h1Likelihood, h0Likelihood) {
    const bridge = this._getBridge();
    const bf = bridge.bayesFactor(h1Likelihood, h0Likelihood);
    let interpretation = 'inconclusive';
    if (bf > 100) interpretation = 'decisive for H1';
    else if (bf > 30) interpretation = 'very strong for H1';
    else if (bf > 10) interpretation = 'strong for H1';
    else if (bf > 3) interpretation = 'moderate for H1';
    else if (bf < 1/100) interpretation = 'decisive for H0';
    else if (bf < 1/30) interpretation = 'very strong for H0';
    else if (bf < 1/10) interpretation = 'strong for H0';
    else if (bf < 1/3) interpretation = 'moderate for H0';
    return { bayesFactor: +bf.toFixed(4), interpretation, favoredHypothesis: bf > 1 ? 'H1' : 'H0' };
  }

  // ═══════════════════════════════════════════════════
  // Rescorla-Wagner 学习模型
  // ═══════════════════════════════════════════

  /**
   * Rescorla-Wagner 更新：ΔV = α × β × (λ - ΣV)
   * 用于：条件反射学习、情绪条件化、预测误差驱动学习
   * @param {number} alpha - 学习率(0-1)
   * @param {number} beta - 联结性/显著性(0-1)
   * @param {number} lambda - 最大条件化强度(US强度)
   * @param {number} sumV - 当前所有线索的总联结强度
   * @returns {object} { deltaV, newSumV, predictionError }
   */
  rescorlaWagner(alpha, beta, lambda, sumV) {
    const predictionError = lambda - sumV;
    const deltaV = alpha * beta * predictionError;
    return {
      deltaV: +deltaV.toFixed(6),
      newSumV: +(sumV + deltaV).toFixed(6),
      predictionError: +predictionError.toFixed(6),
      isLearned: Math.abs(predictionError) < 0.01
    };
  }

  // ═══════════════════════════════════════════
  // Q-Learning 强化学习
  // ═══════════════════════════════════════════

  /**
   * Q值更新：Q(s,a) += α[r + γ max Q(s',a') - Q(s,a)]
   * @param {string} state - 状态
   * @param {string} action - 动作
   * @param {number} reward - 奖励
   * @param {string} nextState - 下一状态
   * @param {string[]} possibleActions - 下一状态可用动作
   * @returns {object} { oldQ, newQ, tdError }
   */
  qUpdate(state, action, reward, nextState, possibleActions = []) {
    const key = `${state}_${action}`;
    const oldQ = this._qTable.get(key) || 0;
    
    // max Q(s', a')
    let maxNextQ = 0;
    for (const a of possibleActions) {
      const nq = this._qTable.get(`${nextState}_${a}`) || 0;
      if (nq > maxNextQ) maxNextQ = nq;
    }
    
    const tdError = reward + this._discountFactor * maxNextQ - oldQ;
    const newQ = oldQ + this._learningRate * tdError;
    this._qTable.set(key, newQ);
    
    return { oldQ: +oldQ.toFixed(4), newQ: +newQ.toFixed(4), tdError: +tdError.toFixed(4) };
  }

  /**
   * 选择动作（ε-greedy策略）
   */
  selectAction(state, actions) {
    if (Math.random() < this._explorationRate) {
      return actions[Math.floor(Math.random() * actions.length)];
    }
    let bestAction = actions[0], bestQ = this._qTable.get(`${state}_${actions[0]}`) || 0;
    for (const a of actions) {
      const q = this._qTable.get(`${state}_${a}`) || 0;
      if (q > bestQ) { bestQ = q; bestAction = a; }
    }
    return bestAction;
  }

  // ═══════════════════════════════════════════
  // 韦伯-费希纳定律
  // ═══════════════════════════════════════════

  /**
   * 韦伯分数：ΔI/I = k（最小可觉差比例）
   * @param {number} intensity - 刺激强度
   * @param {number} weberK - 韦伯常数（视觉~0.02, 听觉~0.05, 重量~0.03）
   * @returns {object} { jnd, perceivedIntensity, weberFraction }
   */
  weberFechner(intensity, weberK = 0.03) {
    const jnd = weberK * intensity;  // 最小可觉差
    // 费希纳定律：S = k × ln(I/I0)
    const perceivedIntensity = Math.log(Math.max(1e-10, intensity) + 1);  // 简化
    return {
      jnd: +jnd.toFixed(6),
      perceivedIntensity: +perceivedIntensity.toFixed(4),
      weberFraction: weberK,
      intensity
    };
  }

  // ═══════════════════════════════════════════
  // 赫布学习 / STDP
  // ═══════════════════════════════════════════

  /**
   * STDP突触权重更新：Δw = A+ × exp(-Δt/τ+) if pre→post, -A- × exp(Δt/τ-) if post→pre
   * @param {number} deltaT - 突触前-突触后时间差(ms)，正=pre先于post
   * @param {object} [params] - { aPlus, aMinus, tauPlus, tauMinus }
   * @returns {object} { deltaW, newWeight, isLTP, isLTD }
   */
  stdpUpdate(deltaT, params = {}) {
    const { aPlus = 0.01, aMinus = 0.012, tauPlus = 20, tauMinus = 20, currentWeight = 0.5 } = params;
    let deltaW = 0;
    let isLTP = false, isLTD = false;
    
    if (deltaT > 0) {
      // LTP: pre before post (Hebbian)
      deltaW = aPlus * Math.exp(-deltaT / tauPlus);
      isLTP = true;
    } else if (deltaT < 0) {
      // LTD: post before pre (anti-Hebbian)
      deltaW = -aMinus * Math.exp(deltaT / tauMinus);
      isLTD = true;
    }
    
    const newWeight = Math.max(0, Math.min(1, currentWeight + deltaW));
    return { deltaW: +deltaW.toFixed(6), newWeight: +newWeight.toFixed(4), isLTP, isLTD };
  }

  // ═══════════════════════════════════════════
  // Hick定律 & Fitts定律
  // ═══════════════════════════════════════════

  /**
   * Hick定律：RT = a + b × log2(n+1)
   * 选择反应时与选项数的关系
   * @param {number} n - 选项数
   * @param {number} [a=0.2] - 基础反应时(s)
   * @param {number} [b=0.15] - 每bit处理时间(s)
   */
  hickLaw(n, a = 0.2, b = 0.15) {
    const rt = a + b * Math.log2(n + 1);
    return { reactionTime: +rt.toFixed(4), informationBits: +Math.log2(n + 1).toFixed(2), n };
  }

  /**
   * Fitts定律：MT = a + b × log2(2D/W)
   * 运动时间与距离/宽度的关系
   * @param {number} distance - 移动距离
   * @param {number} width - 目标宽度
   * @param {number} [a=0.05] - 截距(s)
   * @param {number} [b=0.1] - 斜率(s/bit)
   */
  fittsLaw(distance, width, a = 0.05, b = 0.1) {
    const id = Math.log2(2 * distance / Math.max(0.001, width));  // 难度指数
    const mt = a + b * id;
    return { movementTime: +mt.toFixed(4), difficultyIndex: +id.toFixed(2), distance, width };
  }

  // ═══════════════════════════════════════════
  // 纳什均衡（2×2博弈）
  // ═══════════════════════════════════════════

  /**
   * 2×2博弈混合策略纳什均衡
   * @param {number[][]} payoffA - 玩家A收益矩阵 [[a11,a12],[a21,a22]]
   * @param {number[][]} payoffB - 玩家B收益矩阵
   * @returns {object} { pA (A选行1概率), pB (B选列1概率) }
   */
  nashEquilibrium2x2(payoffA, payoffB) {
    // A的混合策略：使B无差异
    // pA = (payoffB[0][1] - payoffB[1][1]) / (payoffB[0][1] - payoffB[1][1] + payoffB[1][0] - payoffB[0][0])
    const denomB = payoffB[0][1] - payoffB[1][1] + payoffB[1][0] - payoffB[0][0];
    const pA = Math.abs(denomB) < 1e-10 ? 0.5 : (payoffB[0][1] - payoffB[1][1]) / denomB;
    
    const denomA = payoffA[1][0] - payoffA[1][1] + payoffA[0][1] - payoffA[0][0];
    const pB = Math.abs(denomA) < 1e-10 ? 0.5 : (payoffA[1][0] - payoffA[1][1]) / denomA;
    
    return {
      playerAMixedStrategy: +Math.max(0, Math.min(1, pA)).toFixed(4),
      playerBMixedStrategy: +Math.max(0, Math.min(1, pB)).toFixed(4)
    };
  }

  // ═══════════════════════════════════════════
  // 综合决策分析
  // ═══════════════════════════════════════════

  /**
   * 综合决策分析入口
   * @param {string} type - 'ddm'|'sdt'|'prospect'|'bayes'|'rw'|'qlearn'|'weber'|'stdp'|'hick'|'fitts'|'nash'
   * @param {object} params - 各类型对应参数
   * @returns {object} 分析结果
   */
  analyze(type, params = {}) {
    switch (type) {
      case 'ddm': return this.ddmAnalyze(params);
      case 'sdt': return this.sdtAnalyze(params.hitRate, params.falseAlarmRate);
      case 'prospect': return this.prospectAnalyze(params.gambles, params);
      case 'bayes': return this.updateBelief(params.hypothesis, params.likelihood, params.evidenceMarginal);
      case 'rw': return this.rescorlaWagner(params.alpha, params.beta, params.lambda, params.sumV);
      case 'qlearn': return this.qUpdate(params.state, params.action, params.reward, params.nextState, params.actions);
      case 'weber': return this.weberFechner(params.intensity, params.weberK);
      case 'stdp': return this.stdpUpdate(params.deltaT, params);
      case 'hick': return this.hickLaw(params.n, params.a, params.b);
      case 'fitts': return this.fittsLaw(params.distance, params.width, params.a, params.b);
      case 'nash': return this.nashEquilibrium2x2(params.payoffA, params.payoffB);
      default: return { error: `Unknown decision type: ${type}` };
    }
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'ok',
      beliefs: this._beliefState.size,
      qEntries: this._qTable.size,
      modules: ['ddm', 'sdt', 'prospect', 'bayes', 'rw', 'qlearn', 'weber', 'stdp', 'hick', 'fitts', 'nash']
    };
  }
}

module.exports = { DecisionEngine };
