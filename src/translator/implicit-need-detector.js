/**
 * ImplicitNeedDetector — 隐性需求检测器 v2.0
 * 检测8种用户没有直接说出来但隐含的需求。
 *
 * 8种需求类型：
 * 1. need_clarification     — 表述模糊需要追问
 * 2. need_example           — 想要示例
 * 3. need_comparison        — 想比较但没说
 * 4. need_decision_support  — 需要决策帮助
 * 5. need_verification      — 想验证信息
 * 6. need_step_by_step      — 需要步骤指导
 * 7. need_simplification    — 内容太复杂需要简化
 * 8. need_emotional_support — 情绪低落
 */
class ImplicitNeedDetector {
  constructor() {
    this.name = 'implicit-need-detector';
    this.version = '2.0.0';

    // 每类需求的检测模式
    this.patterns = {
      need_clarification: {
        regex: /那个东西|那个|这个|有个问题|怎么说呢|就是那个|叫什么来着|那个什么/,
        confidence: 0.75,
        signal: '表述模糊',
        suggestion: '请补充具体信息以便更精准地回应'
      },
      need_example: {
        regex: /比如|举例|例子|示范|举个例子|给个例子|比如说|打个比方|比方说|给个示范|show me an example/i,
        confidence: 0.85,
        signal: '请求示例',
        suggestion: '为您提供一个具体的例子说明'
      },
      need_comparison: {
        regex: /哪个好|怎么选|选哪个|区别在哪|有何区别|有什么区别|哪个更|哪一款|哪一种是|哪个比较|如何抉择|选什么好|纠结.*选|选.*纠结/,
        confidence: 0.8,
        signal: '隐含比较',
        suggestion: '为您对比分析各选项的优缺点'
      },
      need_decision_support: {
        regex: /不知道选哪个|犹豫|纠结|难以抉择|拿不定主意|下不了决心|举棋不定|左右为难|选A还是选B|该选哪个|选哪个更好|好难选/,
        confidence: 0.85,
        signal: '需要决策辅助',
        suggestion: '帮您梳理决策要素，提供权衡建议'
      },
      need_verification: {
        regex: /对吗|正确吗|真的吗|靠谱吗|可信吗|是不是这样|确认一下|核实一下|准确吗|属实吗|有没有问题|可靠吗|verify|check.*if|is.*correct/i,
        confidence: 0.8,
        signal: '信息验证需求',
        suggestion: '为您核实信息的准确性和来源'
      },
      need_step_by_step: {
        regex: /怎么|步骤|流程|操作|方法|如何做|怎么做|具体怎么做|操作步骤|详细步骤|教程|指南|一步步|手把手|step by step|how to|walk me through/i,
        confidence: 0.85,
        signal: '步骤指导需求',
        suggestion: '为您提供清晰的分步操作指导'
      },
      need_simplification: {
        regex: /简单|通俗|易懂|大白话|说人话|讲人话|简单点|通俗点|容易理解|简明|易懂一点|太复杂|太深奥|简单解释|用白话/,
        confidence: 0.8,
        signal: '需要简化表达',
        suggestion: '用更通俗易懂的方式重新解释'
      },
      need_emotional_support: {
        regex: /难过|伤心|郁闷|烦躁|焦虑|压力大|累死了|好累|心累|崩溃|受不了|无助|迷茫|失落|沮丧|绝望|痛苦|难受|不开心|好烦|烦死了|没意思|不想活了|活不下去/,
        confidence: 0.75,
        signal: '情绪低落',
        suggestion: '先表达共情与理解，再提供实际帮助'
      }
    };
  }

  /**
   * 检测输入文本中的隐性需求
   * @param {string} input - 用户输入文本
   * @param {Object} [context={}] - 额外上下文（tone, history等）
   * @returns {Object} { needs, count, hasHighConfidence, summary }
   */
  detect(input, context = {}) {
    if (!input || typeof input !== 'string') {
      return {
        needs: [],
        count: 0,
        hasHighConfidence: false,
        summary: ''
      };
    }

    const needs = [];

    for (const [type, cfg] of Object.entries(this.patterns)) {
      if (cfg.regex.test(input)) {
        needs.push({
          type,
          confidence: cfg.confidence,
          signal: cfg.signal,
          suggestion: cfg.suggestion
        });
      }
    }

    // 额外：根据 context.tone 加强情绪检测
    const tone = context.tone || {};
    if (tone.emotion === 'frustrated' || tone.emotion === 'sad' || tone.emotion === 'anxious') {
      const existingEmo = needs.find(n => n.type === 'need_emotional_support');
      if (existingEmo) {
        // 已有情绪匹配，提升置信度
        existingEmo.confidence = Math.min(0.95, existingEmo.confidence + 0.1);
        existingEmo.signal = `${existingEmo.signal}（tone增强）`;
      } else {
        needs.push({
          type: 'need_emotional_support',
          confidence: 0.7,
          signal: '语境情绪低落（tone检测）',
          suggestion: '先表达共情与理解，再提供实际帮助'
        });
      }
    }

    // 按置信度降序排序
    needs.sort((a, b) => b.confidence - a.confidence);

    return {
      needs,
      count: needs.length,
      hasHighConfidence: needs.some(n => n.confidence >= 0.8),
      summary: needs.map(n => `[${n.type}] ${n.signal}`).join('; ')
    };
  }

  /** 获取所有需求类型的描述 */
  getTypeInfo() {
    return Object.entries(this.patterns).map(([type, cfg]) => ({
      type,
      signal: cfg.signal,
      sampleKeywords: cfg.regex.source,
      defaultConfidence: cfg.confidence
    }));
  }

  destroy() {}
  stop() {}
}

module.exports = { ImplicitNeedDetector };
