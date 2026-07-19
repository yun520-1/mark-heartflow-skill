/**
 * fewshot-calibrator.js
 * 少标签置信度校准（借鉴 arXiv:2607.14486 思路）
 *
 * [v6.0.45 论文驱动升级] 来源: "Full-data accuracy with fewer labels for
 * training and fine-tuning machine-learning force fields" (arXiv:2607.14486,
 * physics.chem-ph / cs.LG)
 * 核心: 用主动学习/半监督，让模型在标签稀缺时仍达全数据精度——
 *   关键不是"多采样"，而是"选最有信息量的样本补标签"，并对预测置信度校准。
 *
 * 心虫迁移: 心虫面对陌生领域/少经验场景时，不应假装高置信。
 * 应: 1) 检测"标签量(经验数)"是否充足；2) 不足时主动标记"需补经验"；
 * 3) 校准置信度(经验少则降置信，避免虚高)。
 *
 * 能力:
 * 1. calibrate(confidence, experienceCount, minExperience=10) → 校准后置信度
 * 2. needsMoreExperience(domain, count) → 是否需主动补经验(主动学习触发)
 * 3. selectInformative(pool) → 从候选里挑最该补的(domain 覆盖缺口最大)
 *
 * 边界: experienceCount<0 返回 error
 */

class FewshotCalibrator {
  constructor(options = {}) {
    this.name = 'fewshot-calibrator';
    this.version = '1.0.0';
    this.minExperience = options.minExperience || 10;
  }

  /**
   * 校准置信度: 经验不足时按比例衰减(避免虚高)
   * @param {number} confidence - 原始置信度 0-1
   * @param {number} experienceCount - 该领域经验数
   * @returns {object} { calibrated, factor, underConfident }
   */
  calibrate(confidence, experienceCount) {
    if (typeof confidence !== 'number' || experienceCount < 0) {
      return { error: 'invalid_input', calibrated: confidence };
    }
    const ratio = Math.min(1, experienceCount / this.minExperience);
    // 经验越少，校准因子越低(线性，最低 0.3 防止全归零)
    const factor = 0.3 + 0.7 * ratio;
    const calibrated = Math.max(0, Math.min(1, confidence * factor));
    return {
      calibrated: Math.round(calibrated * 100) / 100,
      factor: Math.round(factor * 100) / 100,
      underConfident: experienceCount < this.minExperience
    };
  }

  // 主动学习: 该领域经验不足时触发补经验
  needsMoreExperience(domain, countByDomain) {
    const c = (countByDomain && countByDomain[domain]) || 0;
    return { domain, count: c, needed: c < this.minExperience, gap: Math.max(0, this.minExperience - c) };
  }

  // 从候选里挑"信息量最大"的(覆盖缺口最大的领域)
  selectInformative(candidates, countByDomain) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    let best = null, bestGap = -1;
    for (const cand of candidates) {
      const c = (countByDomain && countByDomain[cand.domain]) || 0;
      const gap = this.minExperience - c;
      if (gap > bestGap) { bestGap = gap; best = cand; }
    }
    return best; // 最该补经验的候选
  }
}

module.exports = { FewshotCalibrator };
