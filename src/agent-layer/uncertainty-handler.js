/**
 * UncertaintyHandler — 不确定性处理策略
 * 当心虫或LLM对某件事不确定时，决定如何表达这种不确定性。
 */
class UncertaintyHandler {
  constructor() {
    this.name = 'uncertainty-handler';
    this.version = '1.0.0';
  }
  handle(confidence, context = {}) {
    if (confidence >= 0.8) return { strategy: 'direct', prefix: '', note: '高置信度，直接陈述' };
    if (confidence >= 0.6) return { strategy: 'qualified', prefix: '根据已有信息', note: '中等置信度，加限定' };
    if (confidence >= 0.4) return { strategy: 'suggestive', prefix: '可能', note: '较低置信度，用推测语气' };
    return { strategy: 'admit', prefix: '我不确定，但', note: '低置信度，直接承认不确定' };
  }
  destroy() {}
  stop() {}
}
module.exports = { UncertaintyHandler };
