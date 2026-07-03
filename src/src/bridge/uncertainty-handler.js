/**
 * UncertaintyHandler — 不确定性处理策略
 * 基于置信度决定回答策略，生成合适的不确定性表达文本。
 *
 * 策略：
 *   confidence < 0.4 → decline   不建议回答，建议用户查证
 *   confidence < 0.7 → qualify   添加不确定性声明，限定语气
 *   confidence >= 0.7 → answer   正常回答，可附带轻量免责
 *
 * 返回：{ action: 'answer'|'qualify'|'decline', disclaimer: string, suggestedResponse: string }
 */
class UncertaintyHandler {
  constructor() {
    this.name = 'uncertainty-handler';
    this.version = '2.0.0';
  }

  /**
   * 基于置信度决定回答策略。
   * @param {number} confidence - 置信度 0.0 ~ 1.0
   * @param {object} [context={}] - 可选上下文（topic, userIntent 等）
   * @returns {{ action: 'answer'|'qualify'|'decline', disclaimer: string, suggestedResponse: string }}
   */
  handle(confidence, context = {}) {
    // 边界保护
    const c = Math.max(0, Math.min(1, Number(confidence) || 0));

    // --- 低置信度：不建议回答 ---
    if (c < 0.4) {
      return {
        action: 'decline',
        disclaimer: '我对此信息把握较低，不建议直接采用。',
        suggestedResponse: '我对这个问题的信息掌握有限，建议您查阅权威资料或询问领域专家来获得更可靠的答案。'
      };
    }

    // --- 中等置信度：加限定回答 ---
    if (c < 0.7) {
      return {
        action: 'qualify',
        disclaimer: `请注意：我对此回答的把握程度约为 ${Math.round(c * 100)}%，部分细节可能存在偏差。`,
        suggestedResponse: '根据我目前掌握的信息，大致可以这样理解……但建议您进一步核实关键数据。'
      };
    }

    // --- 高置信度：正常回答，附轻量免责 ---
    return {
      action: 'answer',
      disclaimer: '基于当前信息判断，此回答有较高可信度。如涉及重要决策，建议多方验证。',
      suggestedResponse: ''
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { UncertaintyHandler };
