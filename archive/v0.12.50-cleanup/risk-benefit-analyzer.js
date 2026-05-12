/**
 * RiskBenefitAnalyzer - 风险 - 利益辩证分析模块
 */
class RiskBenefitAnalyzer {
  constructor() {
    this.riskBenefitMap = {
      '失败': ['学习机会', '经验积累', '发现盲点'],
      '困难': ['成长空间', '能力提升', '突破舒适区'],
      '快速': ['质量隐患', '技术债务', '考虑不周'],
      '容易': ['依赖性', '能力退化', '缺乏深度']
    };
    this.config = { enabled: true, riskThreshold: 0.7, benefitThreshold: 0.5 };
    this.history = [];
  }
  analyzeBenefitBehindRisk(text) {
    const risks = Object.keys(this.riskBenefitMap).filter(k => text.includes(k));
    const benefits = risks.flatMap(r => this.riskBenefitMap[r]);
    return { detectedRisks: risks, potentialBenefits: benefits, hasHiddenBenefit: benefits.length > 0 };
  }
  analyzeRiskBehindBenefit(text) {
    const benefits = Object.keys(this.riskBenefitMap).filter(k => text.includes(k));
    const risks = benefits.flatMap(b => this.riskBenefitMap[b]);
    return { detectedBenefits: benefits, potentialRisks: risks, hasHiddenRisk: risks.length > 0 };
  }
}
const analyzer = new RiskBenefitAnalyzer();
module.exports = { RiskBenefitAnalyzer, analyzer, analyzeBenefitBehindRisk: (t) => analyzer.analyzeBenefitBehindRisk(t), analyzeRiskBehindBenefit: (t) => analyzer.analyzeRiskBehindBenefit(t) };
