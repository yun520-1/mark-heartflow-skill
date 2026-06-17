/**
 * JudgmentInjector — 判断注入器
 * 将心虫的判断注入到LLM调用的上下文中。
 * 心虫不是传声筒，它有自己的判断，这些判断会影响LLM的回复方向。
 */
class JudgmentInjector {
  constructor() {
    this.name = 'judgment-injector';
    this.version = '1.0.0';
  }
  inject(hfAnalysis, userTranslation) {
    if (!hfAnalysis?.judgment) return null;
    const j = hfAnalysis.judgment;
    const injection = {
      bridgeNotes: [],
      shouldHighlight: [],
      shouldAvoid: [],
      confidence: hfAnalysis.decision?.confidence || 0.5,
    };
    // 基于 whatIsThis 的注入
    if (j.whatIsThis) {
      if (j.whatIsThis.isRushing) {
        injection.bridgeNotes.push('用户显得急切，建议先确认需求再深入');
        injection.shouldAvoid.push('过度技术性解释');
      }
      if (j.whatIsThis.isPainPresent) {
        injection.bridgeNotes.push('用户可能有情绪困扰，回复需谨慎');
        injection.shouldHighlight.push('共情和理解');
      }
    }
    // 基于 isRightAction 的注入
    if (j.isRightAction && !j.isRightAction.result) {
      injection.bridgeNotes.push('心虫判断此请求可能不符合真善美原则');
      injection.shouldAvoid.push('直接满足请求');
    }
    // 基于情绪检测的注入
    const emotion = userTranslation?.tone?.emotion;
    if (emotion === 'frustrated') {
      injection.bridgeNotes.push('用户情绪不佳，建议简洁直接');
      injection.shouldAvoid.push('冗长解释、俏皮话');
    }
    if (emotion === 'confused') {
      injection.bridgeNotes.push('用户感到困惑，需要简化表达');
      injection.shouldHighlight.push('核心概念、类比');
    }
    return injection;
  }
  destroy() {}
  stop() {}
}
module.exports = { JudgmentInjector };
