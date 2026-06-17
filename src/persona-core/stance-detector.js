/**
 * StanceDetector — 立场检测器
 * 检测心虫自己对用户观点的立场——同意、反对、还是不确定。
 * 桥不是中立机器，桥有自己的判断。
 */
class StanceDetector {
  constructor() {
    this.name = 'stance-detector';
    this.version = '1.0.0';
  }
  detect(userInput, hfAnalysis) {
    const stances = [];
    // 基于心虫的 isRightAction 判断
    if (hfAnalysis?.judgment?.isRightAction) {
      if (hfAnalysis.judgment.isRightAction.result === true) {
        stances.push({ aspect: 'ethics', stance: 'agree', confidence: 0.7, reason: '通过真善美检查' });
      } else if (hfAnalysis.judgment.isRightAction.result === false) {
        stances.push({ aspect: 'ethics', stance: 'disagree', confidence: 0.7, reason: '未通过真善美检查' });
      }
    }
    // 基于用户语气检测是否需要调整立场
    const q = userInput.toLowerCase();
    if (/我觉得|我认为|我的观点|在我看来/.test(q)) {
      stances.push({ aspect: 'perspective', stance: 'acknowledge', confidence: 0.6, reason: '用户表达了个人观点' });
    }
    // 检测是否涉及桥无法判断的领域
    if (/对错|好坏|善恶|正义/.test(q)) {
      stances.push({ aspect: 'moral', stance: 'neutral', confidence: 0.5, reason: '涉及价值判断，桥提供分析不代替判断' });
    }
    return {
      stances,
      overall: stances.length > 0 ? stances[0].stance : 'neutral',
      hasStrongOpinion: stances.some(s => s.stance === 'disagree' && s.confidence > 0.6),
    };
  }
  destroy() {}
  stop() {}
}
module.exports = { StanceDetector };
