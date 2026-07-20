/**
 * evidence-synthesis.js
 * 多源证据综合 + 标准化效应量（借鉴 arXiv:2607.15247 AutoSynthesis 思路）
 *
 * [v6.0.44 论文驱动升级] 来源: "AutoSynthesis: An agentic system for
 * automated meta-analysis" (arXiv:2607.15247)
 * 核心方法: 给定研究问题 → 检索文献 → 提取定量统计 → 计算标准化效应量
 * (Hedges' g) → 随机效应元分析 → 异质性分析(效应量如何随调节变量变化)
 * → 偏倚风险评价 → PRISMA 透明报告。
 *
 * 心虫落地: 心虫做决策时，不应只靠单次 self-heal 反射，而应从
 * 多条历史经验里算"哪个策略平均最有效"(标准化效应量 Hedges' g 思路)。
 * 这正是 AutoSynthesis 的"定量证据综合"——把它从"文献元分析"迁移到
 * "自身经验元分析"。
 *
 * 能力:
 * 1. addEvidence(strategy, outcome) — 记录一条经验(策略→结果成败/强度)
 * 2. synthesize(strategy) — 计算该策略的标准化效应量(类 Hedges' g)
 * 3. heterogeneousBy(moderator) — 效应量如何随调节变量(如场景类型)变化
 * 4. bestStrategy() — 返回平均效应量最高的策略(供决策路由选用)
 * 5. biasRisk() — 偏倚风险(样本量过小/单一来源时降权)
 *
 * 边界: 样本<2 时返回 null(不足以合成); 不依赖外部库。
 */

class EvidenceSynthesis {
  constructor(options = {}) {
    this.name = 'evidence-synthesis';
    this.version = '1.0.0';
    // strategy -> { outcomes: [{value, moderator}], n }
    this.evidence = new Map();
    this.minN = 2; // 元分析最低样本量(AutoSynthesis 也强调样本充分性)
  }

  addEvidence(strategy, value, moderator = 'default') {
    if (!strategy || typeof value !== 'number') return false;
    if (!this.evidence.has(strategy)) this.evidence.set(strategy, { outcomes: [], n: 0 });
    const e = this.evidence.get(strategy);
    e.outcomes.push({ value, moderator });
    e.n += 1;
    return true;
  }

  _mean(arr) { return arr.reduce((s, x) => s + x, 0) / arr.length; }

  // [v6.0.54 N4] Hedges' g 小样本校正因子 J 的精确计算（Lanczos 近似 Γ 函数）
  // 原公式 J = 1 - 3/(4*(n-1)-1) 在 n=2 时得到 J=0 -> g 恒为 0（笔误）。
  // 正确 J = Γ(n/2) / (√(n/2) · Γ((n-1)/2))，对所有 n>=2 有效。
  _lanczosGamma(z) {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
               771.32342877765313, -176.61502916214059, 12.507343278686905,
               -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this._lanczosGamma(1 - z));
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  _hedgesJ(n) {
    if (n < 2) return 1; // 样本不足，退化为无校正
    const g = this._lanczosGamma(n / 2) / (Math.sqrt(n / 2) * this._lanczosGamma((n - 1) / 2));
    return g;
  }


  // 类 Hedges' g 标准化效应量: 用效应量均值 / 合并标准差(简化版随机效应思路)
  _hedgesG(outcomes) {
    const vals = outcomes.map(o => o.value);
    const m = this._mean(vals);
    const variance = this._mean(vals.map(v => (v - m) ** 2));
    const sd = Math.sqrt(variance);
    if (sd === 0) return { g: m, sd, ci: [m, m], n: vals.length };
    // Hedges' g 的小样本校正因子 J（精确 Γ 形式，n=2 时 J≈0.564 而非 0）
    const n = vals.length;
    const J = this._hedgesJ(n);
    const g = (m / sd) * J;
    const se = Math.sqrt((1 / n) + (g * g / (2 * (n - 1)))); // 近似标准误
    return { g, sd, ci: [g - 1.96 * se, g + 1.96 * se], n };
  }

  synthesize(strategy) {
    if (!this.evidence.has(strategy)) return null;
    const e = this.evidence.get(strategy);
    if (e.n < this.minN) return { strategy, insufficient: true, n: e.n };
    const r = this._hedgesG(e.outcomes);
    return { strategy, g: r.g, ci: r.ci, n: r.n, mean: this._mean(e.outcomes.map(o => o.value)) };
  }

  // 异质性分析: 效应量如何随调节变量(如场景类型)变化
  heterogeneousBy(moderatorKey) {
    const groups = {};
    for (const [strategy, e] of this.evidence) {
      for (const o of e.outcomes) {
        const key = o.moderator || 'default';
        groups[key] = groups[key] || [];
        groups[key].push(o.value);
      }
    }
    const result = {};
    for (const [k, vals] of Object.entries(groups)) {
      if (vals.length >= this.minN) result[k] = this._hedgesG(vals.map(v => ({ value: v })));
    }
    return result;
  }

  bestStrategy() {
    let best = null;
    for (const strategy of this.evidence.keys()) {
      const s = this.synthesize(strategy);
      if (s && !s.insufficient && (!best || s.g > best.g)) best = s;
    }
    return best; // { strategy, g, ci, n, mean } 或 null
  }

  // 偏倚风险: 样本过小或单一来源 → 降权提示
  biasRisk(strategy) {
    if (!this.evidence.has(strategy)) return { risk: 'unknown' };
    const e = this.evidence.get(strategy);
    if (e.n < 5) return { risk: 'high', reason: '样本量过小(<5)', n: e.n };
    const moderators = new Set(e.outcomes.map(o => o.moderator));
    if (moderators.size === 1) return { risk: 'medium', reason: '单一调节变量来源', n: e.n };
    return { risk: 'low', n: e.n };
  }
}

module.exports = { EvidenceSynthesis };