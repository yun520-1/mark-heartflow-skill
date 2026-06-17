/**
 * ImplicitNeedDetector — 隐性需求检测器
 * 检测用户没有直接说出来但隐含的需求。
 */
class ImplicitNeedDetector {
  constructor() {
    this.name = 'implicit-need-detector';
    this.version = '1.0.0';
  }
  detect(input, context = {}) {
    const needs = [];
    const q = input.toLowerCase();

    // 矛盾点 → 需要调和
    if (/但是|然而|不过|可是/.test(q) && /[\?？]/.test(q)) {
      needs.push({ type: 'contradiction_resolution', priority: 'high', description: '用户提出矛盾点，需要调和解释' });
    }
    // 困惑 → 需要简化
    if (/不懂|不理解|不明白|困惑|奇怪|怎么.*这样/.test(q)) {
      needs.push({ type: 'simplification', priority: 'high', description: '用户需要更简单/更基础的解释' });
    }
    // 隐性求助
    if (/帮帮我|救命|怎么办|求助/.test(q)) {
      needs.push({ type: 'help', priority: 'high', description: '用户需要实际行动方案' });
    }
    // 确认需求
    if (/你懂吗|明白吗|知道吗|懂不懂/.test(q)) {
      needs.push({ type: 'validation', priority: 'medium', description: '用户需要确认被理解' });
    }
    // 比较需求
    if (/还是|或者|哪个好/.test(q) && !/对比|比较|区别/.test(q)) {
      needs.push({ type: 'comparison', priority: 'medium', description: '用户隐含比较需求' });
    }
    // 决策需求
    if (/该不该|要不要|能不能|应不应/.test(q)) {
      needs.push({ type: 'decision_support', priority: 'medium', description: '用户需要决策支持' });
    }
    // 情绪需求
    const tone = context.tone || {};
    if (tone.emotion === 'frustrated') {
      needs.push({ type: 'emotional_support', priority: 'low', description: '用户情绪不佳，需要同理心' });
    }

    return {
      needs,
      count: needs.length,
      hasHighPriority: needs.some(n => n.priority === 'high'),
      summary: needs.map(n => n.description).join('; ')
    };
  }
  destroy() {}
  stop() {}
}
module.exports = { ImplicitNeedDetector };
