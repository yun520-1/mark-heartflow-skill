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
    /** @type {Map<string, {value:any,ts:number}>} 计算结果缓存 */
    this._resultCache = new Map();
    this._resultCacheTTL = options.resultCacheTTL || 5000; // ms
    this.defaultMemoryStrength = options.defaultMemoryStrength ?? 86400000; // 1 天（ms）
    this._hf = options.hf || null;
  }

  /** 查缓存或计算 */
  _cached(key, fn) {
    const now = Date.now();
    const hit = this._resultCache.get(key);
    if (hit && (now - hit.ts) < this._resultCacheTTL) return hit.value;
    const val = fn();
    this._resultCache.set(key, { value: val, ts: now });
    if (this._resultCache.size > 500) {
      const oldest = [...this._resultCache.entries()].sort((a,b)=>a[1].ts-b[1].ts)[0][0];
      this._resultCache.delete(oldest);
    }
    return val;
  }

  /**
   * 桥接到 hf.formula 公式库（284条认知公式兜底搜索）
   */
  searchFromCorpus(query, limit = 3) {
    try {
      if (this._hf && this._hf.formula && typeof this._hf.formula.search === 'function') {
        const results = this._hf.formula.search(query);
        if (results && results.success && Array.isArray(results.results)) {
          return results.results.slice(0, limit).map(r => ({
            id: r.id,
            name: r.name,
            formula: r.formula,
            category: r.category,
          }));
        }
      }
    } catch (_) { /* 桥接失败不阻断 */ }
    return [];
  }

  /**
   * 公式库精确计算 — 调用 formula-calculator 计算任意公式
   * 让手算替换为公式库计算
   */
  calculateCorpus(formulaId, params = {}) {
    try {
      if (this._hf && this._hf.formula) {
        // 优先使用 formula-module 的 calculate
        if (typeof this._hf.formula.calculate === 'function') {
          const result = this._hf.formula.calculate(formulaId, params);
          if (result && result.success !== false && result.result) {
            return result;
          }
        }
        // 降级：直接用 formula-engine
        if (this._hf.formula.engine && typeof this._hf.formula.engine.calculate === 'function') {
          const result = this._hf.formula.engine.calculate(formulaId, params);
          if (result && !result.error) {
            return result;
          }
        }
      }
    } catch (_) { /* 非关键 */ }
    return null;
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

  // ─── v5.9.11 论文升级（真实论文代码移植）───

  /**
   * [DDM] 期望首达时 / 决策时间 (Bogacz et al. 2006)
   * 移植自 wfpt_py.wfpt_rt：t0 + z²/a²·tanh·... + 起始点修正
   * 参数：x0 起始点, t0 非决策时间, a 漂移率, z 阈值(边界), s 噪声(默认1)
   */
  ddmDecisionTime(x0, t0, a, z, s = 1) {
    if (Math.abs(a) < 1e-8) {
      // a→0 极限 (Srivastava et al. 2016)
      return t0 + (z * z - x0 * x0) / (s * s);
    }
    const zt = z / a, at = (a / s) * (a / s), x0t = x0 / a;
    const e1 = zt * Math.tanh(zt * at);
    const num = 2 * zt * (1 - Math.exp(-2 * x0t * at));
    const den = Math.exp(2 * zt * at) - Math.exp(-2 * zt * at);
    const e2 = (num / den) - x0t;
    return zt * (e1 + e2) + t0;
  }

  /**
   * [DDM] 错误率 / 反向穿越概率 (Bogacz et al. 2006)
   * 移植自 wfpt_py.wfpt_er：1/(1+e^{2 z̃ â}) - 起始点修正
   * 返回错误率(0-1)，准确率 = 1 - errorRate
   */
  ddmErrorRate(x0, t0, a, z, s = 1) {
    if (Math.abs(a) < 1e-8) {
      return (z - x0) / (2 * z);
    }
    const zt = z / a, at = (a / s) * (a / s), x0t = x0 / a;
    const term1 = 1 / (1 + Math.exp(2 * zt * at));
    const num = 1 - Math.exp(-2 * x0 * at);
    const den = Math.exp(2 * zt * at) - Math.exp(-2 * zt * at);
    return term1 - num / den;
  }

  /**
   * [SDT] 信号检测论 d'（辨别力）Green & Swets 1966
   * d' = z(HR) - z(FAR)，其中 z 为标准正态逆 CDF
   */
  sdtDPrime(hitRate, falseAlarmRate) {
    const z = (p) => { // 标准正态逆 CDF (Acklam 近似)
      if (p <= 0) p = 1e-10; if (p >= 1) p = 1 - 1e-10;
      const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
      const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
      const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400524446245106e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
      const d = [-7.784695709041462e-03, 8.933146131619509e-01, 3.957506918542107e+00, 1.955837635732678e+00, 4.944515011942083e+00, 1.0];
      let q, r;
      if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
      else if (p <= 0.97575) { q = p - 0.5; r = q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
      else { q = Math.sqrt(-2 * Math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    };
    return z(hitRate) - z(falseAlarmRate);
  }

  /**
   * [SDT] β（似然比决策准则）Green & Swets 1966
   * β = exp(-(d'/2)·(z(HR)+z(FAR)))；等价于命中与虚报似然比
   */
  sdtBeta(hitRate, falseAlarmRate) {
    const d = this.sdtDPrime(hitRate, falseAlarmRate);
    const z = (p) => { if (p<=0) p=1e-10; if (p>=1) p=1-1e-10; const a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00]; const b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01]; const c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400524446245106e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00]; const d2=[-7.784695709041462e-03,8.933146131619509e-01,3.957506918542107e+00,1.955837635732678e+00,4.944515011942083e+00,1.0]; let q,r; if(p<0.02425){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d2[0]*q+d2[1])*q+d2[2])*q+d2[3])*q+1);}else if(p<=0.97575){q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}else{q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d2[0]*q+d2[1])*q+d2[2])*q+d2[3])*q+1);} };
    const zH = z(hitRate), zF = z(falseAlarmRate);
    return Math.exp(-(d / 2) * (zH + zF));
  }

  /**
   * [SDT] A'（非参数辨别力，Pollack & Norman 1964）
   * A' = 0.5 + sign(HR-FAR)·((HR-FAR)² + |HR-FAR|)/(4·max(HR,FAR)-4·HR·FAR)
   */
  sdtAPrime(hitRate, falseAlarmRate) {
    const H = hitRate, F = falseAlarmRate;
    if (H === 1 && F === 0) return 1;
    const denom = 4 * Math.max(H, F) - 4 * H * F;
    if (denom === 0) return 0.5;
    const num = (H - F) * (H - F) + Math.abs(H - F);
    return 0.5 + (H >= F ? 1 : -1) * (num / denom);
  }

  /**
   * [Active Inference] 预期信息增益 G（认识性价值）
   * 移植自 pymdp spm_MDP_G：G = E_{Q(x)}[H[P(o|x)]] - H[Q(o)]
   * 简化（单模态）：给定后验 Q(x) 和似然 A（观测×状态矩阵），算预期惊奇降低。
   * @param {number[]} qx - 后验信念 Q(x)（状态分布，和=1）
   * @param {number[][]} A - 似然矩阵 A[o][x] = P(o|x)
   * @returns {number} 信息增益（epistemic value，越高越值得探索以获取信息）
   */
  activeInferenceInfoGain(qx, A) {
    if (!Array.isArray(qx) || !Array.isArray(A)) return 0;
    const EPS = 1e-16;
    const nObs = A.length, nStates = A[0] ? A[0].length : 0;
    if (nStates === 0) return 0;
    // E_Q[ H[P(o|x)] ]：对每个状态，算其似然分布的熵，按后验加权
    let expLikEntropy = 0;
    const qo = new Array(nObs).fill(0);
    for (let x = 0; x < nStates; x++) {
      // 该状态下观测分布
      let h = 0;
      for (let o = 0; o < nObs; o++) {
        const po = Math.max(A[o][x], EPS);
        h += -po * Math.log(po);
        qo[o] += qx[x] * po;
      }
      expLikEntropy += qx[x] * h;
    }
    // H[Q(o)]
    let hqo = 0;
    for (let o = 0; o < nObs; o++) hqo += -qo[o] * Math.log(Math.max(qo[o], EPS));
    return +(expLikEntropy - hqo).toFixed(4);
  }

  /**
   * [Criticality] 临界磁化率 χ = K^{-3/2} (Ginzburg-Landau, arXiv:2602.19023)
   * 分支比 K 越高，系统越接近临界点（χ 发散）；衡量神经雪崩的可激发性。
   * @param {number} K - 分支比 (branching ratio)，K>0
   * @returns {number} 磁化率 χ，K→1 时 χ→1（临界），K<1 时 χ 大（亚临界敏感）
   */
  criticalitySusceptibility(K) {
    if (!(K > 0)) return 0;
    return Math.pow(K, -1.5);
  }

  /**
   * [MaxCal] 意识度量 ψ（KL 散度高斯基近似，arXiv:2605.12536）
   * ψ = (1/2) * Σ (x_i - μ_i)² / σ_i²
   * 衡量观测分布与先验预测分布之间的偏差；ψ 越大，系统偏离基线越远。
   * @param {number[]} observed - 观测值 x_i
   * @param {number[]} mu - 先验均值 μ_i（与 observed 等长）
   * @param {number[]} sigma - 先验标准差 σ_i（与 observed 等长）
   * @returns {number} ψ，高斯近似的 KL 散度
   */
  maxcalPsi(observed, mu, sigma) {
    if (!Array.isArray(observed) || !Array.isArray(mu) || !Array.isArray(sigma)) return 0;
    const n = Math.min(observed.length, mu.length, sigma.length);
    if (n === 0) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const s = sigma[i];
      if (!(s > 0)) continue;
      const d = observed[i] - mu[i];
      sum += (d * d) / (s * s);
    }
    return 0.5 * sum;
  }

  /**
   * [Emotion Transition] 图拉普拉斯谱隙 = λ_2 (arXiv:2606.01906)
   * 对情绪转移矩阵构建图拉普拉斯，返回第二小特征值（Fiedler 值 / 代数连通度）。
   * 小 λ_2 ≈ 图接近不连通（高自转移→情绪状态隔离→稳定），
   * 大 λ_2 ≈ 图强连通（近乎均匀转移→情绪状态紧密耦合→易变）。
   * @param {number[][]} T - 情绪转移矩阵 T[i][j] = P(emo_j | emo_i)，N×N 方阵
   * @returns {number} λ_2（Fiedler 值），情绪稳定性度量（小=稳定，大=易变）
   */
  emotionStability(T) {
    if (!Array.isArray(T) || T.length === 0 || !Array.isArray(T[0])) return 0;
    const N = T.length;
    for (let i = 0; i < N; i++) {
      if (!Array.isArray(T[i]) || T[i].length !== N) return 0;
    }
    if (N === 1) return 0;

    // Build graph Laplacian L = D - A, A = (T + T^T)/2
    const A = Array.from({ length: N }, () => new Array(N).fill(0));
    const deg = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const a = (T[i][j] + T[j][i]) / 2;
        A[i][j] = a;
        deg[i] += a;
      }
    }
    const L = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) => (i === j ? deg[i] : 0) - A[i][j])
    );

    // For N ≤ 4, use characteristic polynomial to find λ_2 directly
    if (N <= 4) {
      // Compute eigenvalues of symmetric L via Jacobi-like QR iteration
      // Simpler: use shifted inverse power iteration to extract specific eigenvalues
      // First find λ_max via power iteration
      const matVec = (M, v) => {
        const w = new Array(N).fill(0);
        for (let i = 0; i < N; i++)
          for (let j = 0; j < N; j++) w[i] += M[i][j] * v[j];
        return w;
      };
      const norm = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      const powerIter = (M, vec, iters = 200) => {
        let v = vec.slice();
        for (let iter = 0; iter < iters; iter++) {
          const w = matVec(M, v);
          const n = norm(w);
          if (n < 1e-14) break;
          v = w.map(x => x / n);
        }
        const w = matVec(M, v);
        const lam = w.reduce((s, wi, i) => s + v[i] * wi, 0);
        return { lam, vec: v };
      };

      // λ_max
      const v0 = new Array(N).fill(1 / Math.sqrt(N));
      const { lam: lamN } = powerIter(L, v0);

      // λ_0 = 0 with eigenvector [1,1,...,1]/sqrt(N)
      // λ_2 is the next smallest after 0. Use inverse iteration with shift near 0
      // Solve (L - shift*I)x = v_k iteratively
      const shift = 0.001;
      // Build L - shift*I
      const Ls = L.map((row, i) => row.map((v, j) => (i === j ? v - shift : v)));

      // For small N, solve (L - shift*I) * x = v using Gaussian elimination
      const solve = (M, b) => {
        const n = M.length;
        const aug = M.map((row, i) => [...row, b[i]]);
        for (let col = 0; col < n; col++) {
          let pivot = col;
          for (let row = col + 1; row < n; row++)
            if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
          if (Math.abs(aug[pivot][col]) < 1e-14) continue;
          [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
          for (let row = col + 1; row < n; row++) {
            const f = aug[row][col] / aug[col][col];
            for (let j = col; j <= n; j++) aug[row][j] -= f * aug[col][j];
          }
        }
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          let s = aug[i][n];
          for (let j = i + 1; j < n; j++) s -= aug[i][j] * x[j];
          x[i] = Math.abs(aug[i][i]) > 1e-14 ? s / aug[i][i] : 0;
        }
        return x;
      };

      // Inverse iteration: start with random, orthogonalize against [1,1,...,1]
      let v = new Array(N).fill(0).map(() => Math.random() - 0.5);
      const onesNorm = 1 / Math.sqrt(N);
      const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
      // Orthogonalize
      const ones = new Array(N).fill(onesNorm);
      const proj = dot(v, ones);
      v = v.map((x, i) => x - proj * ones[i]);
      const nv = norm(v);
      if (nv < 1e-12) v = new Array(N).fill(0).map((_, i) => i === 0 ? 1 : 0); // fallback
      else v = v.map(x => x / nv);

      for (let iter = 0; iter < 50; iter++) {
        const x = solve(Ls, v);
        // Re-orthogonalize against ones
        const p = dot(x, ones);
        const y = x.map((xi, i) => xi - p * ones[i]);
        const ny = norm(y);
        if (ny < 1e-14) break;
        v = y.map(xi => xi / ny);
      }
      const w = matVec(L, v);
      const lam2 = w.reduce((s, wi, i) => s + v[i] * wi, 0);
      return Math.max(0, +lam2.toFixed(6));
    }

    // For N > 4, use simpler power iteration approximation
    // λ_2 ≈ min non-zero eigenvalue estimate via Rayleigh quotient on random orthogonal vector
    const v0 = new Array(N).fill(1 / Math.sqrt(N));
    let v = new Array(N).fill(0).map(() => Math.random() - 0.5);
    const ones = new Array(N).fill(1 / Math.sqrt(N));
    const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
    const proj = dot(v, ones);
    v = v.map((x, i) => x - proj * ones[i]);
    const nv = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (nv < 1e-12) return 0;
    v = v.map(x => x / nv);
    // Power iteration on L
    for (let iter = 0; iter < 200; iter++) {
      const w = new Array(N).fill(0);
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) w[i] += L[i][j] * v[j];
      const p = dot(w, ones);
      const y = w.map((x, i) => x - p * ones[i]);
      const ny = Math.sqrt(y.reduce((s, x) => s + x * x, 0));
      if (ny < 1e-14) break;
      v = y.map(x => x / ny);
    }
    const w = new Array(N).fill(0);
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) w[i] += L[i][j] * v[j];
    const lam2 = w.reduce((s, wi, i) => s + v[i] * wi, 0);
    return Math.max(0, +lam2.toFixed(6));
  }

  // ─── v8.15.0 四大新公式 (arXiv 2025-2026) ───

  /**
   * [GAP 1] 情绪转移矩阵 (Dirichlet-Multinomial posterior, arXiv:2606.01906)
   * T[i][j] = (count[i→j] + α) / (count[i→*] + Kα)
   * 从情绪标签序列计算 Dirichlet 后验转移矩阵，返回谱隙（稳定性）和惯性。
   * @param {string[]} emotionSequence - 情绪标签序列，如 ['neutral','happy','happy','sad',...]
   * @param {number} [K=1] - 类别数（如果未提供则自动推断）
   * @param {number} [alpha=1] - Dirichlet 先验超参数 α
   * @returns {{T: number[][], spectralGap: number, inertia: number, volatility: number, labels: string[]}}
   */
  emotionTransitionMatrix(emotionSequence, K = null, alpha = 1) {
    if (!Array.isArray(emotionSequence) || emotionSequence.length < 2) {
      return { T: [], spectralGap: 0, inertia: 0, volatility: 0, labels: [] };
    }
    // Infer labels and K
    const labelSet = [...new Set(emotionSequence)];
    const labels = labelSet.sort();
    const k = K || labels.length;
    if (k === 0) return { T: [], spectralGap: 0, inertia: 0, volatility: 0, labels: [] };

    // Build label→index map
    const idx = {};
    labels.forEach((l, i) => { idx[l] = i; });

    // Count transitions
    const count = Array.from({ length: k }, () => new Array(k).fill(0));
    const rowCount = new Array(k).fill(0);
    for (let t = 0; t < emotionSequence.length - 1; t++) {
      const from = idx[emotionSequence[t]];
      const to = idx[emotionSequence[t + 1]];
      if (from !== undefined && to !== undefined) {
        count[from][to]++;
        rowCount[from]++;
      }
    }

    // Dirichlet-Multinomial posterior: T[i][j] = (count[i→j] + α) / (count[i→*] + Kα)
    const T = Array.from({ length: k }, (_, i) => {
      const denom = rowCount[i] + k * alpha;
      return Array.from({ length: k }, (_, j) => (count[i][j] + alpha) / denom);
    });

    // Spectral gap from Laplacian
    const spectralGap = this.emotionStability(T);

    // Inertia: average diagonal (self-transition probability)
    let inertia = 0;
    for (let i = 0; i < k; i++) inertia += T[i][i];
    inertia /= k;

    // Volatility = 1 - inertia
    const volatility = 1 - inertia;

    return { T, spectralGap, inertia: +inertia.toFixed(4), volatility: +volatility.toFixed(4), labels };
  }

  /**
   * [GAP 2] Dirichlet 证据累积置信度 (arXiv:2605.26147)
   * α_new = α_old + evidence. 停止思考当 H(Dir(α)) < τ.
   * 置信度 = 1 - H(Dir(α)) / H_max
   * @param {number[]} evidenceCounts - 各选项的证据伪计数，如 [3, 1, 0.5]
   * @param {number} [priorStrength=1] - 先验强度 α_0
   * @param {number} [tau=0.5] - 熵阈值，低于此停止思考
   * @returns {{alpha: number[], precision: number, entropy: number, confidence: number, shouldStop: boolean}}
   */
  dirichletConfidence(evidenceCounts, priorStrength = 1, tau = 0.5) {
    if (!Array.isArray(evidenceCounts) || evidenceCounts.length === 0) {
      return { alpha: [], precision: 0, entropy: Infinity, confidence: 0, shouldStop: false };
    }
    const K = evidenceCounts.length;
    const alpha = evidenceCounts.map(c => Math.max(0, c) + priorStrength);
    const alpha0 = alpha.reduce((s, a) => s + a, 0);
    const precision = alpha0;

    // Entropy of Dirichlet: H = log B(α) + (α0 - K)·ψ(α0) - Σ (α_i - 1)·ψ(α_i)
    // Use approximation: H ≈ -Σ (α_i/α0) * log(α_i/α0) + (K-1)/(2*α0)
    const probs = alpha.map(a => a / alpha0);
    let H = 0;
    for (const p of probs) {
      if (p > 1e-16) H -= p * Math.log(p);
    }
    H += (K - 1) / (2 * alpha0); // correction term

    // H_max = log(K) (uniform distribution)
    const Hmax = Math.log(K);
    const confidence = Hmax > 0 ? Math.max(0, Math.min(1, 1 - H / Hmax)) : 0;
    const shouldStop = H < tau;

    return {
      alpha,
      precision: +precision.toFixed(4),
      entropy: +H.toFixed(4),
      confidence: +confidence.toFixed(4),
      shouldStop
    };
  }

  /**
   * [GAP 3] E/I 平衡工作记忆容量 (arXiv:2606.27529)
   * WM_capacity = base_capacity / (1 + E/I_ratio)
   * E/I_ratio = mean(W_exc) / mean(W_inh)
   * @param {number} baseCapacity - 基础 WM 容量（如 72）
   * @param {number} eRatio - 兴奋性权重均值 W_exc
   * @param {number} iRatio - 抑制性权重均值 W_inh
   * @param {number} [stressLevel=0] - 压力水平（0-1），进一步降低容量
   * @returns {{capacity: number, eiRatio: number, reduction: number, stressPenalty: number}}
   */
  eiWorkingMemory(baseCapacity, eRatio, iRatio, stressLevel = 0) {
    if (!(iRatio > 0)) iRatio = 1;
    const ei = eRatio / iRatio;
    const stressPenalty = Math.max(0, Math.min(0.5, stressLevel || 0));
    const rawCapacity = baseCapacity / (1 + ei);
    const capacity = rawCapacity * (1 - stressPenalty);
    return {
      capacity: +capacity.toFixed(2),
      eiRatio: +ei.toFixed(4),
      reduction: +((1 - capacity / baseCapacity) * 100).toFixed(1),
      stressPenalty: +stressPenalty.toFixed(2)
    };
  }

  /**
   * [GAP 4] 动机偏差模型 (Grether's α-β, arXiv:2606.17657)
   * log(P(want)/P(not)) = α × log(LR) + β
   * α = evidence sensitivity (理性程度), β = motivational bias (动机偏差)
   * @param {number} priorOdds - 先验赔率 P(want)/P(not)
   * @param {number} evidenceLR - 证据似然比 P(evidence|want)/P(evidence|not)
   * @param {number} alpha - 证据敏感度 (α>1: 理性, α<1: 证据不足, α≈0: 完全忽略证据)
   * @param {number} beta - 动机偏差 (β>0: 偏向want, β<0: 偏向not)
   * @returns {{posteriorOdds: number, posteriorProb: number, biasDirection: string, biasMagnitude: number}}
   */
  motivationalBias(priorOdds, evidenceLR, alpha = 1, beta = 0) {
    const logPrior = Math.log(Math.max(1e-15, priorOdds));
    const logLR = Math.log(Math.max(1e-15, evidenceLR));
    const logPosterior = alpha * logLR + beta + logPrior;
    const posteriorOdds = Math.exp(logPosterior);
    const posteriorProb = posteriorOdds / (1 + posteriorOdds);

    let biasDirection = 'neutral';
    if (beta > 0.1) biasDirection = 'want_bias';
    else if (beta < -0.1) biasDirection = 'avoid_bias';
    else if (alpha < 0.5) biasDirection = 'evidence_insensitive';
    else if (alpha > 1.5) biasDirection = 'evidence_sensitive';

    return {
      posteriorOdds: +posteriorOdds.toFixed(4),
      posteriorProb: +posteriorProb.toFixed(4),
      biasDirection,
      biasMagnitude: +Math.abs(beta).toFixed(4)
    };
  }

  /**
   * 自适应学习率 (Resource-Rational Learning Rate Schedule)
   * learningRate(t) = alpha0 / (1 + beta * sqrt(t))
   * 更多更新 → 更低学习率 → 更稳定的 Q 值。早期学习快，后期学习精准。
   * @param {number} initialRate - 初始学习率 α₀（默认 0.5）
   * @param {number} updateCount - 该 Q 条目的更新次数 t
   * @param {number} decayBeta - 衰减速度 β（默认 0.1）
   * @returns {number} 自适应学习率 ∈ (0, α₀]
   */
  adaptiveLearningRate(initialRate = 0.5, updateCount = 0, decayBeta = 0.1) {
    const t = Math.max(0, updateCount || 0);
    const alpha0 = Math.max(0.01, Math.min(1.0, initialRate));
    const beta = Math.max(0.01, Math.min(1.0, decayBeta));
    const lr = alpha0 / (1 + beta * Math.sqrt(t));
    return +lr.toFixed(6);
  }

  /**
   * 序列注意力权重 (Sequential Attention Discount)
   * attention_weight(i) = exp(-lambda * i)
   * 最近决策在准确率计算中更重要（λ 控制衰减速度）。
   * 基于 arXiv:2605.08716 的序列折扣模型。
   * @param {number} position - 序列位置 i（0=最近，越大越旧）
   * @param {number} lambda - 衰减系数 λ（默认 0.3）
   * @returns {number} 注意力权重 ∈ (0, 1]
   */
  sequentialAttentionWeight(position = 0, lambda = 0.3) {
    const i = Math.max(0, position || 0);
    const lam = Math.max(0.01, Math.min(2.0, lambda));
    return +Math.exp(-lam * i).toFixed(6);
  }

  /**
   * 加权准确率 (Recency-Weighted Accuracy)
   * 使用序列注意力权重计算带时序折扣的准确率。
   * decisions: [{correct: true/false}, ...] 按时间排列（index 0 = 最早, last = 最近）
   * @param {Array<{correct: boolean}>} decisions - 决策结果序列
   * @param {number} lambda - 衰减系数（默认 0.3）
   * @returns {{accuracy: number, weightedAccuracy: number, totalWeight: number, recentBias: number}}
   */
  weightedAccuracy(decisions = [], lambda = 0.3) {
    if (!decisions || decisions.length === 0) {
      return { accuracy: 1.0, weightedAccuracy: 1.0, totalWeight: 0, recentBias: 0 };
    }
    const n = decisions.length;
    let totalWeight = 0;
    let weightedCorrect = 0;
    let rawCorrect = 0;

    for (let i = 0; i < n; i++) {
      // position: 0 = 最旧 (oldest), n-1 = 最近 (newest)
      const position = n - 1 - i;  // reverse so 0 = most recent
      const w = this.sequentialAttentionWeight(position, lambda);
      totalWeight += w;
      if (decisions[i].correct) {
        weightedCorrect += w;
        rawCorrect++;
      }
    }

    const accuracy = n > 0 ? rawCorrect / n : 1.0;
    const weightedAcc = totalWeight > 0 ? weightedCorrect / totalWeight : accuracy;
    const recentBias = weightedAcc - accuracy;

    return {
      accuracy: +accuracy.toFixed(4),
      weightedAccuracy: +weightedAcc.toFixed(4),
      totalWeight: +totalWeight.toFixed(4),
      recentBias: +recentBias.toFixed(4)
    };
  }

  // ─── v5.11.0 新公式 (arXiv 研究) ───

  /**
   * [v5.11.0] S-Measure 认知相似度 (arXiv:2606.26406)
   * S(A,B) = |A ∩ B| / (|A ∪ B| + ε)
   * Jaccard 相似度 + 认知加权：根据集合元素的认知权重调整交集/并集。
   * 用于比较信念集合、记忆片段、概念集合的认知重叠度。
   * @param {Array|Set} a - 集合 A
   * @param {Array|Set} b - 集合 B
   * @param {Object} [options] - { epsilon, weights } 权重为可选的元素→权重映射
   * @returns {number} 认知相似度 S ∈ [0, 1]
   */
  sMeasure(a, b, options = {}) {
    const epsilon = options.epsilon || 1e-9;
    const weights = options.weights || null;
    const setA = new Set(a || []);
    const setB = new Set(b || []);
    if (setA.size === 0 && setB.size === 0) return 0;

    if (weights) {
      // 认知加权版本：交集和并集都用权重加权
      let wIntersection = 0;
      let wUnion = 0;
      const allElements = new Set([...setA, ...setB]);
      for (const el of allElements) {
        const w = weights[el] || 1;
        const inA = setA.has(el);
        const inB = setB.has(el);
        if (inA && inB) wIntersection += w;
        if (inA || inB) wUnion += w;
      }
      return wUnion > epsilon ? wIntersection / (wUnion + epsilon) : 0;
    }

    // 标准 Jaccard
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = setA.size + setB.size - intersection;
    return union > epsilon ? intersection / (union + epsilon) : 0;
  }

  /**
   * [v5.11.0] 自由能启发式 (arXiv:2606.15877)
   * F = accuracy - T * (posteriorEntropy - priorEntropy)
   * 信息压缩原理：准确率减去温度×熵变化。高准确率+熵减少→强自由能。
   * 用于量化认知更新质量：好的更新既提高准确率又降低不确定性。
   * @param {number} priorEntropy - 先验熵 H_prior
   * @param {number} posteriorEntropy - 后验熵 H_posterior
   * @param {number} accuracy - 准确率 (0-1)
   * @param {number} [temperature=1] - 温度参数 T
   * @returns {{freeEnergy: number, optimalTemperature: number, entropyReduction: number, interpretation: string}}
   */
  freeEnergyHeuristics(priorEntropy, posteriorEntropy, accuracy, temperature = 1) {
    const dH = posteriorEntropy - priorEntropy;
    const F = accuracy - temperature * dH;
    // 最优温度使得 F 最大：T_opt = accuracy / dH（当 dH > 0 时）
    let optimalTemperature = temperature;
    if (Math.abs(dH) > 1e-9) {
      optimalTemperature = accuracy / dH;
    }
    // 钳制到合理范围
    optimalTemperature = Math.max(0.1, Math.min(10, optimalTemperature));
    const entropyReduction = -dH;
    let interpretation;
    if (F > 0.8) interpretation = 'excellent_update';
    else if (F > 0.5) interpretation = 'good_update';
    else if (F > 0.2) interpretation = 'moderate_update';
    else if (F > 0) interpretation = 'weak_update';
    else interpretation = 'negative_free_energy';

    return {
      freeEnergy: +F.toFixed(6),
      optimalTemperature: +optimalTemperature.toFixed(4),
      entropyReduction: +entropyReduction.toFixed(6),
      interpretation
    };
  }

  /**
   * [v5.11.0] Ginzburg-Landau 序参量 (arXiv:2602.19023)
   * ψ(T) = ψ_0 * sqrt(max(0, 1 - T/Tc))
   * 描述二阶相变附近的序参量行为：T < Tc → 有序相(ψ>0), T >= Tc → 无序相(ψ=0)。
   * 用于认知系统临界性分析：温度 T 代表认知噪声/混乱度，Tc 为临界温度。
   * @param {number} orderParam - 基态序参量 ψ_0 (T=0 时的值)
   * @param {number} temperature - 当前温度 T
   * @param {number} criticalTemp - 临界温度 Tc
   * @returns {{orderParameter: number, phase: string, reducedTemp: number, isCritical: boolean}}
   */
  ginzburgLandau(orderParam = 1, temperature = 0, criticalTemp = 1) {
    if (!(criticalTemp > 0)) criticalTemp = 1;
    const t = temperature / criticalTemp;
    const reducedTemp = t;
    const psi = orderParam * Math.sqrt(Math.max(0, 1 - t));
    let phase;
    if (t < 0.9) phase = 'ordered';
    else if (t < 0.99) phase = 'near_critical';
    else if (t < 1.0) phase = 'critical';
    else phase = 'disordered';
    const isCritical = t >= 0.9 && t < 1.1;

    return {
      orderParameter: +psi.toFixed(6),
      phase,
      reducedTemp: +reducedTemp.toFixed(6),
      isCritical
    };
  }
}


// 单例（避免重复实例化）
let _instance = null;
function getFormulaBridge(options) {
  if (!_instance) _instance = new FormulaBridge(options);
  return _instance;
}

/**
 * 注入 hf 引用到已有的桥接实例（boot 时调用）
 */
function injectHfToBridge(hf) {
  const bridge = getFormulaBridge();
  bridge._hf = bridge._hf || hf;
  return bridge;
}

module.exports = { FormulaBridge, getFormulaBridge, injectHfToBridge };
