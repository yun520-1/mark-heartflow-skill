
/**
 * SDT - 自我决定理论 - SDT - 自我决定理论理论实现
 * 版本：vv6.1.61
 * 理论来源：未知来源
 */

module.exports = {
  /**
   * 核心公式：IntrinsicMotivation = Autonomy × Competence × Relatedness
   */
  calculate: function(autonomy, competence, relatedness) {
    return autonomy * competence * relatedness;
  },
  
  /**
   * 质量检查
   */
  check: function(data) {
    const issues = [];
    if (data.autonomy < 0 || data.autonomy > 1) issues.push('Autonomy 超出范围');
    if (data.competence < 0 || data.competence > 1) issues.push('Competence 超出范围');
    if (data.relatedness < 0 || data.relatedness > 1) issues.push('Relatedness 超出范围');
    return { passed: issues.length === 0, issues };
  }
};
