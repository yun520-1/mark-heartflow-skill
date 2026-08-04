/**
 * RiskBenefitAnalyzer - 风险-利益辩证分析模块
 * 来源: claude-clarity v1.8.2 吸收集成
 * 每个风险背后都有潜在收益，每个收益背后都有隐藏风险
 */
class RiskBenefitAnalyzer {
  constructor() {
    this.riskBenefitMap = {
      '失败': ['学习机会', '经验积累', '发现盲点'],
      '困难': ['成长空间', '能力提升', '突破舒适区'],
      '快速': ['质量隐患', '技术债务', '考虑不周'],
      '容易': ['依赖性', '能力退化', '缺乏深度']
    };
    this.config = { enabled: true };
    this.history = [];
  }

  analyzeBenefitBehindRisk(text) {
    const risks = Object.keys(this.riskBenefitMap).filter(k => text.includes(k));
    const benefits = risks.flatMap(r => this.riskBenefitMap[r]);
    this.history.push({ type: 'risk_to_benefit', text: text.substring(0, 50), timestamp: Date.now() });
    return { detectedRisks: risks, potentialBenefits: benefits, hasHiddenBenefit: benefits.length > 0 };
  }

  analyzeRiskBehindBenefit(text) {
    const benefits = Object.keys(this.riskBenefitMap).filter(k => text.includes(k));
    const risks = benefits.flatMap(b => this.riskBenefitMap[b]);
    this.history.push({ type: 'benefit_to_risk', text: text.substring(0, 50), timestamp: Date.now() });
    return { detectedBenefits: benefits, potentialRisks: risks, hasHiddenRisk: risks.length > 0 };
  }

  getStats() { return { totalAnalyses: this.history.length }; }
}

module.exports = { RiskBenefitAnalyzer };
