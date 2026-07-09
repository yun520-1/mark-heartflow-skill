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
}

// 单例（避免重复实例化）
let _instance = null;
function getFormulaBridge(options) {
  if (!_instance) _instance = new FormulaBridge(options);
  return _instance;
}

module.exports = { FormulaBridge, getFormulaBridge };
