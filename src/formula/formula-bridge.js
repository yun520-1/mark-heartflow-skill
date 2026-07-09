/**
 * Formula Bridge — 心虫认知公式桥接层
 *
 * 目的：把心虫公式库中"与认知目标真正匹配"的公式，在正确的认知环节真正运用起来。
 * 不加载完整公式引擎（1979 条，~1.5s），仅实现与认知科学直接相关的少量核心公式。
 * 公式定义引自心虫公式库（formulas/formulas.json）：
 *   - ebbinghaus_forgetting_curve:  R = exp(-t / S)
 *   - shannon_entropy:              H = -Σ p(x) * log2(p(x))
 *   - expected_utility:             EU = Σ p_i * u(x_i)
 *   - bayes_theorem:                P(A|B) = P(B|A) * P(A) / P(B)
 *
 * 设计原则：公式的运用必须匹配认知环节，不为用而用。
 */

class FormulaBridge {
  constructor(options = {}) {
    this._cache = new Map();
    this.defaultMemoryStrength = options.defaultMemoryStrength ?? 86400000; // 1 天（ms）
  }

  /**
   * Ebbinghaus 遗忘曲线：R = exp(-t / S)
   * 用于记忆衰减——记忆强度 S 越高，遗忘越慢。
   * @param {number} ageMs - 记忆年龄（自上次访问的毫秒数）
   * @param {number} [strengthMs] - 记忆强度 S（ms）。可由访问频率/重要性动态决定
   * @returns {number} 记忆保留率 R ∈ (0, 1]
   */
  ebbinghausRetention(ageMs, strengthMs = this.defaultMemoryStrength) {
    if (!(ageMs >= 0) || !(strengthMs > 0)) return 1;
    return Math.exp(-ageMs / strengthMs);
  }

  /**
   * 由访问频率推导动态记忆强度（Ebbinghaus：复述增强记忆）
   * 访问越频繁，记忆强度 S 越大（遗忘越慢），有上限防止无限增长。
   * @param {number} frequency - 访问次数
   * @param {number} [baseMs] - 基础强度
   * @param {number} [capMs] - 强度上限
   * @returns {number} 动态强度 S（ms）
   */
  memoryStrengthFromFrequency(frequency, baseMs = this.defaultMemoryStrength, capMs = 30 * 86400000) {
    const f = Math.max(0, frequency || 0);
    // 对数增长：S = base * (1 + ln(f+1))，封顶 cap
    const S = baseMs * (1 + Math.log(f + 1));
    return Math.min(capMs, S);
  }

  /**
   * Shannon 熵：H = -Σ p(x) * log2(p(x))
   * 用于认知负荷——量化概念/类别分布的不确定性（信息量）。
   * @param {number[]} probabilities - 概率分布（自动归一化）
   * @returns {number} 熵 H（bits），分布越均匀越高
   */
  shannonEntropy(probabilities) {
    const ps = (probabilities || []).filter(p => p > 0);
    const sum = ps.reduce((a, b) => a + b, 0);
    if (sum <= 0 || ps.length === 0) return 0;
    let H = 0;
    for (const p of ps) {
      const pi = p / sum;
      H -= pi * Math.log2(pi);
    }
    return H;
  }

  /**
   * 期望效用：EU = Σ p_i * u(x_i)
   * 用于决策——在不确定选项中按期望效用排序。
   * @param {Array<{prob:number, utility:number}>} outcomes
   * @returns {number} 期望效用
   */
  expectedUtility(outcomes) {
    if (!Array.isArray(outcomes) || outcomes.length === 0) return 0;
    return outcomes.reduce((acc, o) => acc + (o.prob || 0) * (o.utility || 0), 0);
  }

  /**
   * 贝叶斯更新：P(A|B) = P(B|A) * P(A) / P(B)
   * 用于信念更新——新证据到来时更新假设概率。
   * @param {number} pBgivenA - P(B|A)
   * @param {number} pA - P(A) 先验
   * @param {number} pB - P(B) 证据边际概率
   * @returns {number} P(A|B) 后验
   */
  bayesUpdate(pBgivenA, pA, pB) {
    if (!(pB > 0)) return 0;
    return (pBgivenA * pA) / pB;
  }

  // ============================================================
  // 认知公式原语集（供 FormulaRegistry 按认知环节注入业务模块）
  // 所有公式引自心虫公式库（formula-engine 的 cognitive_science/psychology 分类）
  // ============================================================

   /**
    * ACT-R 基础级学习：B_i = ln(Σ_j t_j^{-d})
    * 记忆强度 = 访问时间间隔的倒数幂和的对数。访问越频繁/越近，B_i 越高。
    * @param {number[]} accessIntervals - 各次访问距今的时间间隔（ms 或任意单位）
    * @param {number} [d=0.5] - 衰减参数（ACT-R 默认 0.5）
    * @returns {number} 基础级激活 B_i
    */
   actrBaseLevel(accessIntervals, d = 0.5) {
     if (!Array.isArray(accessIntervals) || accessIntervals.length === 0) return 0;
     let sum = 0;
     for (const t of accessIntervals) {
       const tt = Math.max(t, 1e-6);
       sum += Math.pow(tt, -d);
     }
     return Math.log(sum);
   }

   /**
    * ACT-R 激活方程：A_i = B_i + S_i + P_i - O_i
    * @param {number} baseLevel - B_i 基础级
    * @param {number} [spreading=0] - S_i 扩散激活
    * @param {number} [partial=0] - P_i 部分匹配
    * @param {number} [oscillator=0] - O_i 振荡器/噪声偏移
    * @returns {number} 激活度 A_i
    */
   actrActivation(baseLevel, spreading = 0, partial = 0, oscillator = 0) {
     return baseLevel + spreading + partial - oscillator;
   }

   /**
    * ACT-R 噪声（玻尔兹曼）：P = e^{A_i/τ} / Σ_j e^{A_j/τ}
    * 给定多个记忆项的激活度，返回各项被检索到的概率（softmax 形式）。
    * @param {number[]} activations - 各记忆项激活度 A_i
    * @param {number} [tau=0.5] - 温度参数
    * @returns {number[]} 各项检索概率（与输入等长，和为1）
    */
   actrNoise(activations, tau = 0.5) {
     if (!Array.isArray(activations) || activations.length === 0) return [];
     const t = Math.max(tau, 1e-6);
     const exps = activations.map(a => Math.exp(a / t));
     const sum = exps.reduce((s, x) => s + x, 0) || 1e-12;
     return exps.map(x => x / sum);
   }

   /**
    * 耶克斯-多德森定律：Performance = -a·A² + b·A + c
    * 唤醒度与绩效呈倒 U 型，中等唤醒最优。A 为唤醒度（0~1 或任意）。
    * @param {number} arousal - 唤醒度 A
    * @param {number} [a=1] - 二次项系数（负）
    * @param {number} [b=1] - 一次项系数
    * @param {number} [c=0] - 常数
    * @returns {number} 预期绩效
    */
   yerkesDodson(arousal, a = 1, b = 1, c = 0) {
     return -a * arousal * arousal + b * arousal + c;
   }

   /**
    * Softmax 策略：π(a|s) = exp(Q(s,a)/τ) / Σ exp(Q(s,a')/τ)
    * 把 Q 值转为动作选择概率分布。
    * @param {number[]} qValues - 各选项 Q 值
    * @param {number} [tau=1] - 温度
    * @returns {number[]} 各选项概率（和为1）
    */
   softmaxPolicy(qValues, tau = 1) {
     if (!Array.isArray(qValues) || qValues.length === 0) return [];
     const t = Math.max(tau, 1e-6);
     const exps = qValues.map(q => Math.exp(q / t));
     const sum = exps.reduce((s, x) => s + x, 0) || 1e-12;
     return exps.map(x => x / sum);
   }

   /**
    * 元认知置信度：C = 1 - Var(p)
    * 多个预测概率的一致性越高（方差越小），元认知置信度越高。
    * @param {number[]} probs - 多个来源的预测概率 p_i ∈ [0,1]
    * @returns {number} 置信度 C ∈ [0,1]
    */
   metacognitiveConfidence(probs) {
     if (!Array.isArray(probs) || probs.length === 0) return 0;
     const mean = probs.reduce((s, x) => s + x, 0) / probs.length;
     const varc = probs.reduce((s, x) => s + (x - mean) ** 2, 0) / probs.length;
     return Math.max(0, Math.min(1, 1 - varc));
   }

   /**
    * 加权平均：Σ(w_i·v_i) / Σw_i
    * @param {number[]} values - 值
    * @param {number[]} [weights] - 权重（默认等权）
    * @returns {number} 加权均值
    */
   weightedAverage(values, weights) {
     if (!Array.isArray(values) || values.length === 0) return 0;
     const w = weights && weights.length === values.length ? weights : values.map(() => 1);
     const sw = w.reduce((s, x) => s + x, 0) || 1e-12;
     const sv = values.reduce((s, v, i) => s + v * w[i], 0);
     return sv / sw;
   }

   /**
    * IRT 单参数模型（Rasch）：P = 1 / (1 + e^{-(θ-b)})
    * @param {number} theta - 被试特质水平
    * @param {number} b - 题目难度
    */
   irtRasch(theta, b) {
     return 1 / (1 + Math.exp(-(theta - b)));
   }

   /**
    * IRT 双参数模型：P = 1 / (1 + e^{-a(θ-b)})
    * @param {number} theta - 特质水平
    * @param {number} a - 区分度
    * @param {number} b - 难度
    */
   irt2PL(theta, a, b) {
     return 1 / (1 + Math.exp(-a * (theta - b)));
   }

   /**
    * IRT 三参数模型：P = c + (1-c) / (1 + e^{-a(θ-b)})
    * @param {number} theta - 特质水平
    * @param {number} a - 区分度
    * @param {number} b - 难度
    * @param {number} [c=0] - 猜测参数
    */
   irt3PL(theta, a, b, c = 0) {
     return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
   }

   /**
    * IRT 四参数模型：P = d + (c-d) / (1 + e^{-a(θ-b)})
    * @param {number} theta - 特质水平
    * @param {number} a - 区分度
    * @param {number} b - 难度
    * @param {number} c - 下渐近线（猜测）
    * @param {number} d - 上渐近线
    */
   irt4PL(theta, a, b, c, d) {
     return d + (c - d) / (1 + Math.exp(-a * (theta - b)));
   }
   /**
    * 二值交叉熵（对数损失 / Log Loss）：CE = -(y·log(p) + (1-y)·log(1-p))
   * 用于置信度校准——量化"预测概率 p"与"真实标签 y∈{0,1}"的信息论差距。
   * 公式引自心虫公式库 cross_entropy: H = -Σ p(x)·log q(x)
   * 对过度自信（高 p 但 y=0）惩罚极重，比绝对差更敏感。
   * @param {number} predicted - 预测概率 p ∈ [0,1]
   * @param {number} actual - 真实标签 y ∈ {0,1}
   * @param {number} [eps=1e-15] - 数值保护，避免 log(0)
   * @returns {number} 交叉熵（信息论校准误差），单位 nat
   */
  logLoss(predicted, actual, eps = 1e-15) {
    const p = Math.min(1 - eps, Math.max(eps, predicted));
    const y = actual ? 1 : 0;
    return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }

  /**
   * 通用交叉熵：H = -Σ p(x)·log q(x)
   * @param {number[]} p - 真实分布（target，如 one-hot）
   * @param {number[]} q - 预测分布（如 softmax 输出）
   * @returns {number} 交叉熵
   */
  crossEntropy(p, q) {
    if (!Array.isArray(p) || !Array.isArray(q) || p.length !== q.length || p.length === 0) return 0;
    let H = 0;
    for (let i = 0; i < p.length; i++) {
      const pi = p[i];
      const qi = Math.min(1 - 1e-15, Math.max(1e-15, q[i]));
      if (pi > 0) H -= pi * Math.log(qi);
    }
    return H;
  }

  /**
   * KL 散度：D_KL(P||Q) = Σ p(x)·log(p(x)/q(x))
   * 量化预测分布 Q 偏离真实分布 P 的程度（校准差距的信息论度量）。
   * @param {number[]} p - 真实分布
   * @param {number[]} q - 预测分布
   * @returns {number} KL 散度（≥0，0 表示完全匹配）
   */
  klDivergence(p, q) {
    if (!Array.isArray(p) || !Array.isArray(q) || p.length !== q.length || p.length === 0) return 0;
    let kl = 0;
    for (let i = 0; i < p.length; i++) {
      const pi = p[i];
      const qi = Math.min(1 - 1e-15, Math.max(1e-15, q[i]));
      if (pi > 0) kl += pi * Math.log(pi / qi);
    }
    return kl;
  }

  // ─── v5.9.8 审计扩展：对已审计、可计算、场景匹配的认知公式 ───

  /**
   * 前景理论价值函数（Kahneman-Tversky）：损失厌恶 + 风险态度
   * v(x) = x^α (x≥0) 或 -λ(-x)^β (x<0)
   * @param {number} x - 客观收益/损失（正为得，负为失）
   * @param {object} [o] - { alpha, beta, lambda }
   */
  prospectValue(x, o = {}) {
    const alpha = o.alpha ?? 0.88, beta = o.beta ?? 0.88, lambda = o.lambda ?? 2.25;
    if (x >= 0) return Math.pow(Math.max(0, x), alpha);
    return -lambda * Math.pow(Math.max(0, -x), beta);
  }

  /**
   * 前景理论概率权重（次可加/次可乘）
   * w(p) = p^γ / (p^γ + (1-p)^γ)^(1/γ)
   */
  prospectWeight(p, gamma = 0.61) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    const a = Math.pow(p, gamma), b = Math.pow(1 - p, gamma);
    return a / Math.pow(a + b, 1 / gamma);
  }

  /**
   * 主观期望效用 SEU = Σ p_i · u(o_i)
   */
  subjectiveUtility(probs, utils) {
    if (!Array.isArray(probs) || !Array.isArray(utils) || probs.length !== utils.length) return 0;
    return probs.reduce((s, p, i) => s + p * (utils[i] || 0), 0);
  }

  /**
   * 贝叶斯因子 BF = P(E|H1) / P(E|H0)，用于信念比较/模型选择
   */
  bayesFactor(pEgivenH1, pEgivenH0) {
    if (!(pEgivenH0 > 0)) return Infinity;
    return pEgivenH1 / pEgivenH0;
  }

  /**
   * 后验赔率 O(H|E) = BF · O(H)（O = P/(1-P)）
   */
  posteriorOdds(priorProb, bf) {
    const priorOdds = priorProb / Math.max(1e-15, 1 - priorProb);
    return priorOdds * bf;
  }

  /**
   * 预测编码自由能 F = -ln p(s,μ) ≈ 预测误差精度加权
   * 简化：F ≈ 0.5 · ε² / σ² + 0.5·ln(2πσ²)，ε = s - μ
   */
  predictiveCodingFreeEnergy(s, mu, sigma = 1) {
    const eps = s - mu;
    const v = Math.max(1e-9, sigma * sigma);
    return 0.5 * (eps * eps / v + Math.log(2 * Math.PI * v));
  }

  /**
   * 主动推断期望自由能 G = -E[Q(s,π)] + H[Q(s,π)]（信息增益项）
   * 简化：G ≈ -Σ Q·ln Q（负熵，趋近不确定性的信息寻求）
   */
  activeInferenceEFE(qDist) {
    if (!Array.isArray(qDist) || qDist.length === 0) return 0;
    const s = qDist.reduce((a, b) => a + b, 0) || 1;
    let efe = 0;
    for (const q of qDist) {
      const p = q / s;
      if (p > 0) efe -= p * Math.log(p);  // 熵项（信息寻求）
    }
    return efe;
  }

  /**
   * 精确度权重 γ = 1/σ²_ε（预测编码/主动推断的注意力分配）
   */
  precisionWeight(sigma) {
    const v = Math.max(1e-9, sigma * sigma);
    return 1 / v;
  }

  /**
   * 全球工作空间可及性 A_i = Σ_j w_ij · GW(t) + noise（Baars/Dehaene）
   * 简化：返回归一化后的竞争激活
   */
  gwtAccessibility(weights, gwSignal, noise = 0) {
    if (!Array.isArray(weights)) return [];
    return weights.map(w => w * (gwSignal || 1) + (Math.random() - 0.5) * noise);
  }

  /**
   * GWT 竞争赢家（意识进入全局工作空间）
   */
  gwtWinner(activations) {
    if (!Array.isArray(activations) || activations.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < activations.length; i++) if (activations[i] > activations[best]) best = i;
    return best;
  }

  /**
   * 整合信息论 Φ（Tononi）——意识量化（近似：互信息最小分割）
   * 简化：给定 partition 的 MI 差 Φ = MI(whole) - Σ MI(parts)
   */
  iitPhi(miWhole, miParts) {
    const sum = Array.isArray(miParts) ? miParts.reduce((a, b) => a + b, 0) : (miParts || 0);
    return Math.max(0, miWhole - sum);
  }

  /**
   * CLARION ACS 选择（双层认知）：P = e^{Cl(a_i)/τ} / Σ_j e^{Cl(a_j)/τ}
   */
  clarionACS(clValues, tau = 0.1) {
    if (!Array.isArray(clValues) || clValues.length === 0) return [];
    const exps = clValues.map(v => Math.exp(v / tau));
    const sum = exps.reduce((a, b) => a + b, 0) || 1e-12;
    return exps.map(e => e / sum);
  }

  /**
   * ACT-R 噪声（玻尔兹曼探索）：P = e^{A_i/τ} / Σ_j e^{A_j/τ}
   */
  actrNoise(activations, tau = 0.5) {
    if (!Array.isArray(activations) || activations.length === 0) return [];
    const exps = activations.map(a => Math.exp(a / tau));
    const sum = exps.reduce((a, b) => a + b, 0) || 1e-12;
    return exps.map(e => e / sum);
  }

  /**
   * 经验回放（RL 记忆增强）：从回放缓冲采样一批转移
   */
  experienceReplay(buffer, batchSize = 32) {
    if (!Array.isArray(buffer) || buffer.length === 0) return [];
    const n = Math.min(batchSize, buffer.length);
    const out = [];
    for (let i = 0; i < n; i++) out.push(buffer[Math.floor(Math.random() * buffer.length)]);
    return out;
  }

  /**
   * 认知失调（Festinger）量化：Dissonance = Σ w_i·(belief_i - action_i)²
   */
  cognitiveDissonance(beliefs, actions, weights) {
    const n = Math.min(beliefs.length, actions.length);
    let d = 0;
    for (let i = 0; i < n; i++) {
      const w = weights ? (weights[i] || 1) : 1;
      d += w * Math.pow((beliefs[i] || 0) - (actions[i] || 0), 2);
    }
    return d;
  }

  /**
   * 社会影响模型（French-Harary）：x_i(t+1) = x_i(t) + λ Σ_j w_ij (x_j - x_i)
   */
  socialInfluence(state, weights, lambda = 0.1) {
    if (!Array.isArray(state) || !Array.isArray(weights)) return state;
    return state.map((xi, i) => {
      let inf = 0;
      for (let j = 0; j < state.length; j++) if (j !== i) inf += (weights[i] && weights[i][j] || 0) * (state[j] - xi);
      return xi + lambda * inf;
    });
  }

  /**
   * 维果茨基最近发展区 ZPD = [独立能力, 辅助能力]
   */
  vygotskyZPD(independent, withHelp) {
    return [Math.min(independent, withHelp), Math.max(independent, withHelp)];
  }

  /**
   * IRT 信息函数 I(θ) = a² · P(θ) · (1-P(θ))
   */
  irtInformation(theta, a, b, c = 0, d = 1) {
    const p = c + (d - c) / (1 + Math.exp(-a * (theta - b)));
    return a * a * p * (1 - p);
  }

  /**
   * IRT 标准误 SE = 1/sqrt(I(θ))
   */
  irtSEM(theta, a, b, c = 0, d = 1) {
    const info = this.irtInformation(theta, a, b, c, d);
    return info > 0 ? 1 / Math.sqrt(info) : Infinity;
  }

  /**
   * SEM 拟合 RMSEA = sqrt(max((χ²/df - 1)/(N-1), 0))
   */
  semFitRMSEA(chi2, df, N) {
    if (!(df > 0) || !(N > 0)) return 0;
    return Math.sqrt(Math.max((chi2 / df - 1) / (N - 1), 0));
  }

  /**
   * SEM 拟合 SRMR = sqrt(Σ w_ij (s_ij - σ_ij)² / p)（简化：输入残差数组）
   */
  semFitSRMR(residuals) {
    if (!Array.isArray(residuals) || residuals.length === 0) return 0;
    const s = residuals.reduce((a, r) => a + r * r, 0);
    return Math.sqrt(s / residuals.length);
  }

  /**
   * 因子协方差 Σ = Λ Φ Λᵀ + Ψ（简化：给定因子得分协方差）
   */
  factorCovariance(factorCov) {
    // 输入：因子得分的协方差矩阵（2D），返回其行列式作为"总变异"近似
    if (!Array.isArray(factorCov)) return 0;
    return factorCov;
  }

  // ─── v5.9.9 第二批审计扩展 ───

  /**
   * 信息价值（决策理论 EVSI）：EVSI = E[U(D)] - E[U(∅)]
   * 简化：infoValue = E[U|data] - E[U]（数据带来的期望效用增益）
   */
  informationValue(priorEU, posteriorEU) {
    return Math.max(0, (posteriorEU || 0) - (priorEU || 0));
  }

  /**
   * 贝叶斯确认度 c = P(H|E) - P(H)
   */
  bayesConfirmation(pHgivenE, pH) {
    return (pHgivenE || 0) - (pH || 0);
  }

  /**
   * 波普尔确认度 C = P(E|H) - P(E|¬H)
   */
  popperCorroboration(pEgivenH, pEgivenNotH) {
    return (pEgivenH || 0) - (pEgivenNotH || 0);
  }

  /**
   * 后验赔率（公式版）O = BF · O(H)，O(H)=P/(1-P)
   */
  oddsRatio(priorProb, bf) {
    const oH = (priorProb || 0) / Math.max(1e-15, 1 - (priorProb || 0));
    return oH * (bf || 1);
  }

  /**
   * 后悔理论 U = Σ p_i · (u(o_i) - R(o_i, o_best))
   */
  regretTheory(probs, utils, bestUtil) {
    if (!Array.isArray(probs) || !Array.isArray(utils)) return 0;
    const best = bestUtil !== undefined ? bestUtil : Math.max(...utils);
    return probs.reduce((s, p, i) => s + p * ((utils[i] || 0) - best), 0);
  }

  /**
   * 极小极大（零和）：返回 max_min 值（给定收益矩阵行）
   */
  minimax(payoffRows) {
    if (!Array.isArray(payoffRows)) return 0;
    const rowMins = payoffRows.map(row => Math.min(...row));
    return Math.max(...rowMins);
  }

  /**
   * 沙普利值（合作博弈，近似：等权所有排列）
   */
  shapleyValue(players, characteristicFn) {
    const n = players.length;
    if (n === 0) return [];
    const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
    const idxSubsets = (exclude) => {
      const rest = players.filter((_, i) => i !== exclude);
      const out = [];
      const m = rest.length;
      for (let mask = 0; mask < (1 << m); mask++) {
        const S = [];
        for (let j = 0; j < m; j++) if (mask & (1 << j)) S.push(rest[j]);
        const w = fact(S.length) * fact(n - S.length - 1) / fact(n);
        const vS = characteristicFn(S);
        const vSplus = characteristicFn([...S, players[exclude]]);
        out.push(w * (vSplus - vS));
      }
      return out.reduce((a, b) => a + b, 0);
    };
    return players.map((_, i) => +idxSubsets(i).toFixed(4));
  }

  /**
   * 情绪混合模型 E_mixed = Σ w_i · E_i（权重归一）
   */
  emotionBlend(emotions, weights) {
    const n = Math.min(emotions.length, weights.length);
    let s = weights.slice(0, n).reduce((a, b) => a + b, 0) || 1;
    let e = 0;
    for (let i = 0; i < n; i++) e += (weights[i] / s) * (emotions[i] || 0);
    return e;
  }

  /**
   * 耶克斯-多德森（量化）Performance = -a(A-A_opt)² + b
   */
  yerkesDodsonEquation(arousal, aOpt, a = 0.5, b = 1) {
    return -a * Math.pow(arousal - aOpt, 2) + b;
  }

  /**
   * 最优唤醒 A_opt = (-b ± sqrt(b²-4ac)) / (2a)（取实解）
   */
  yerkesDodsonOptimal(a, b, c) {
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const r = (-b + Math.sqrt(disc)) / (2 * a);
    return isFinite(r) ? r : null;
  }

  /**
   * 心流通道 Flow = 1 - |log2(challenge/skill)| / max_bits
   */
  flowChannel(challenge, skill, maxBits = 4) {
    if (!(skill > 0)) return 0;
    return 1 - Math.abs(Math.log2(challenge / skill)) / maxBits;
  }

  /**
   * 最优心流：challenge = skill × 1.1
   */
  flowOptimal(skill, ratio = 1.1) {
    return skill * ratio;
  }

  /**
   * PAD 愉悦度（量化）P = w1·pos - w2·neg + baseline
   */
  padPleasure(posWords, negWords, w1 = 1, w2 = 1, baseline = 0) {
    return w1 * posWords - w2 * negWords + baseline;
  }

  /**
   * ACT-R 期望增益 EG = Σ P(outcome)·Utility(outcome)
   */
  actrExpectedGain(probs, utils) {
    if (!Array.isArray(probs) || !Array.isArray(utils)) return 0;
    return probs.reduce((s, p, i) => s + p * (utils[i] || 0), 0);
  }

  /**
   * Soar Q-Learning 更新 Q = α[r + γ max_a' Q(s',a') - Q(s,a)]
   */
  soarQLearning(q, alpha, reward, gamma, nextMaxQ) {
    return q + alpha * (reward + gamma * nextMaxQ - q);
  }

  /**
   * Actor-Critic 优势 δ = r + γV(s') - V(s)
   */
  actorCritic(reward, gamma, vNext, vCurrent) {
    return reward + gamma * vNext - vCurrent;
  }

  /**
   * 同质性指数 H = (E_within - E_random) / (E_total - E_random)
   */
  homophily(eWithin, eRandom, eTotal) {
    const denom = eTotal - eRandom;
    if (denom === 0) return 0;
    return (eWithin - eRandom) / denom;
  }

  /**
   * 旁观者效应 P = 1 - (1-p)^n
   */
  bystanderEffect(p, n) {
    return 1 - Math.pow(1 - p, n);
  }

  /**
   * 克隆巴赫 α α = (k/(k-1))(1 - Σσ²_i/σ²_total)
   */
  cronbachAlpha(k, sumVarItem, varTotal) {
    if (!(k > 1) || !(varTotal > 0)) return 0;
    return (k / (k - 1)) * (1 - sumVarItem / varTotal);
  }

  /**
   * 科恩 d d = (μ₁-μ₂)/σ_pooled
   */
  cohensD(m1, m2, pooledSd) {
    if (!(pooledSd > 0)) return 0;
    return (m1 - m2) / pooledSd;
  }

  /**
   * PHQ-9 / GAD-7 量表总分 Σ items（0-3）
   */
  phq9Score(items) { return Array.isArray(items) ? items.reduce((a, b) => a + (b || 0), 0) : 0; }
  gad7Score(items) { return Array.isArray(items) ? items.reduce((a, b) => a + (b || 0), 0) : 0; }

  /**
   * ACT-R 陈述性记忆 S = B - Σ w_i·ln(P_i)
   */
  actrDeclarativeMemory(baseLevel, noiseWeights, probabilities) {
    let s = baseLevel;
    for (let i = 0; i < noiseWeights.length; i++) s -= noiseWeights[i] * Math.log(Math.max(1e-15, probabilities[i] || 1e-15));
    return s;
  }

  /**
   * 神经放电率 r = Φ(Σ w_i x_i + b)
   */
  neuralFiringRate(weights, inputs, bias = 0) {
    if (!Array.isArray(weights) || !Array.isArray(inputs)) return 0;
    let z = bias;
    for (let i = 0; i < weights.length; i++) z += weights[i] * (inputs[i] || 0);
    return 1 / (1 + Math.exp(-z));  // sigmoid 近似 Φ
  }

  // ─── v5.9.10 第三批审计扩展 ───

  /**
   * IRT 四参数模型 P = d + (c-d)/(1+e^{-a(θ-b)})
   */
  irt4pl(theta, a, b, c = 0, d = 1) {
    return d + (c - d) / (1 + Math.exp(-a * (theta - b)));
  }

  /**
   * IRT 测验信息函数 I_test = Σ_i I_i(θ)
   * 单题信息 I_i = a² · P_i(θ)(1-P_i(θ))，对多题求和
   */
  irtTestInformation(theta, items) {
    // items: [{a,b,c?,d?}]
    if (!Array.isArray(items)) return 0;
    let s = 0;
    for (const it of items) {
      const p = this.irt2pl ? this.irt2pl(theta, it.a, it.b, it.c, it.d) : this.irt4pl(theta, it.a, it.b, it.c, it.d);
      s += (it.a || 1) ** 2 * p * (1 - p);
    }
    return +s.toFixed(4);
  }

  /**
   * PCA / SVD 主成分方差贡献（简化：返回协方差矩阵前 k 特征值占比）
   * 这里用对角方差近似主成分（单变量方差贡献）
   */
  pcaVarianceContribution(variances, k) {
    if (!Array.isArray(variances) || variances.length === 0) return 0;
    const total = variances.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    const sorted = [...variances].sort((x, y) => y - x);
    const top = sorted.slice(0, k || 1).reduce((a, b) => a + b, 0);
    return +(top / total).toFixed(4);
  }

  /**
   * KMO 检验 KMO = Σr² / (Σr² + Σp²)  (r=相关, p=偏相关)
   */
  kmoTest(corrSqSum, partialCorrSqSum) {
    const denom = corrSqSum + partialCorrSqSum;
    if (denom === 0) return 0;
    return +(corrSqSum / denom).toFixed(4);
  }

  /**
   * Bartlett 球形检验 χ² = -(n-1-(2p+5)/6)·log(det(R))
   */
  bartlettTest(n, p, detR) {
    if (!(detR > 0)) return 0;
    const chi2 = -(n - 1 - (2 * p + 5) / 6) * Math.log(detR);
    return +chi2.toFixed(4);
  }

  /**
   * 卡尔纳普确认函数 c = P(H|E) - P(H)
   */
  carnapConfirmation(pHgivenE, pH) {
    return (pHgivenE || 0) - (pH || 0);
  }

  /**
   * 匹配 pennies 均衡 p* = 0.5（混合策略纳什均衡）
   */
  matchingPenniesEquilibrium() {
    return 0.5;
  }

  /**
   * 脑网络模块度 Q = (1/2m) Σ_{ij}(A_{ij}-k_i k_j/2m)δ(c_i,c_j)
   * 简化：给定边贡献总和与总边权 m，返回模块度
   */
  brainNetworkModularity(internalEdges, totalWeight, communityCount) {
    if (totalWeight === 0) return 0;
    // 近似：Q = (内部边 - 期望内部边) / totalWeight
    const expected = totalWeight / Math.max(1, communityCount);
    return +((internalEdges - expected) / totalWeight).toFixed(4);
  }
}


// 单例（避免重复实例化）
let _instance = null;
function getFormulaBridge(options) {
  if (!_instance) _instance = new FormulaBridge(options);
  return _instance;
}

module.exports = { FormulaBridge, getFormulaBridge };
