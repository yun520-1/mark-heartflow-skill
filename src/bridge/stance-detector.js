/**
 * StanceDetector — 立场检测器 v3.0
 * 检测心虫对用户输入的立场，6种立场：support/caution/correct/clarify/neutral/oppose
 * 桥有自己的判断，但不是固执——立场随输入质量动态变化。
 */
class StanceDetector {
  constructor() {
    this.name = 'stance-detector';
    this.version = '3.0.0';
    this.patterns = {
      ethics: /(?:这是(?:对|错)的|不(?:道德|公平)|伤害|歧视|偏见|不尊重|违法|违规|不应该|不可以|不能这样)/i,
      misinformation: /(?:据说|听说|大家都说|网上说|有人说|百分之[八九九十]\d*%|研究证明|专家指出|权威机构|科学家发现)/i,
      reasonable: /(?:我想|我觉得|我认为|建议|提议|方案|解决办法|思路|方向|计划|打算)/i,
      vague: /(?:随便|都行|你看着办|差不多|大概|好像|也许|可能|不清楚|不知道|什么|怎么搞|咋整)/i,
      opposition: /(?:你错了|不对|不同意|反对|荒谬|可笑|毫无道理|完全错误|垃圾|没用)/i,
    };
  }

  /**
   * 检测心虫对用户输入的立场
   * @param {string} input - 用户输入文本
   * @param {object} [heartflow] - 可选的心虫分析结果（isRightAction 等）
   * @returns {{ stance: string, confidence: number, reasoning: string, flags: string[] }}
   */
  detect(input, heartflow) {
    const flags = [];
    const text = (input || '').trim();
    if (!text) {
      return {
        stance: 'neutral',
        confidence: 0.5,
        reasoning: '无输入内容，保持中立',
        flags: ['empty_input'],
      };
    }

    // ————————————————————————————————————————————
    // 1. 伦理问题 → stance: 'caution'
    // ————————————————————————————————————————————
    if (this.patterns.ethics.test(text)) {
      const reason = this._buildEthicsReason(text);
      flags.push('ethical_concern');
      return {
        stance: 'caution',
        confidence: 0.75,
        reasoning: reason,
        flags,
      };
    }

    // 如果心虫提供了 isRightAction 分析且结果为 false
    if (heartflow?.judgment?.isRightAction?.result === false) {
      flags.push('is_right_action_rejected');
      return {
        stance: 'caution',
        confidence: 0.8,
        reasoning: '心虫真善美检查未通过，需谨慎处理',
        flags,
      };
    }

    // ————————————————————————————————————————————
    // 2. 错误信息 → stance: 'correct'
    // ————————————————————————————————————————————
    if (this.patterns.misinformation.test(text)) {
      const reason = this._buildMisinfoReason(text);
      flags.push('potential_misinformation');
      return {
        stance: 'correct',
        confidence: 0.65,
        reasoning: reason,
        flags,
      };
    }

    // ————————————————————————————————————————————
    // 3. 合理输入 → stance: 'support'
    // ————————————————————————————————————————————
    if (this.patterns.reasonable.test(text)) {
      const reason = this._buildSupportReason(text);
      flags.push('user_proposed_idea');
      return {
        stance: 'support',
        confidence: 0.7,
        reasoning: reason,
        flags,
      };
    }

    // 如果心虫分析认为合理
    if (heartflow?.judgment?.isRightAction?.result === true) {
      flags.push('is_right_action_approved');
      return {
        stance: 'support',
        confidence: 0.75,
        reasoning: '心虫真善美检查通过，支持该方向',
        flags,
      };
    }

    // ————————————————————————————————————————————
    // 4. 模糊输入 → stance: 'clarify'
    // ————————————————————————————————————————————
    if (this.patterns.vague.test(text)) {
      const reason = this._buildClarifyReason(text);
      flags.push('vague_input');
      return {
        stance: 'clarify',
        confidence: 0.6,
        reasoning: reason,
        flags,
      };
    }

    // ————————————————————————————————————————————
    // 5. 反对/攻击 → stance: 'oppose'
    // ————————————————————————————————————————————
    if (this.patterns.opposition.test(text)) {
      const reason = this._buildOpposeReason(text);
      flags.push('user_opposes');
      return {
        stance: 'oppose',
        confidence: 0.7,
        reasoning: reason,
        flags,
      };
    }

    // ————————————————————————————————————————————
    // 6. 默认 → stance: 'neutral'
    // ————————————————————————————————————————————
    return {
      stance: 'neutral',
      confidence: 0.5,
      reasoning: '输入未触发任何立场模式，保持中立',
      flags: [],
    };
  }

  /** ---------- 私有：构建 reasoning 文本 ---------- */

  _buildEthicsReason(text) {
    if (/伤害|歧视|偏见/.test(text)) return '输入包含潜在的伦理风险，建议谨慎处理';
    if (/违法|违规|不可以|不能这样/.test(text)) return '输入涉及法律或规则边界，需谨慎对待';
    return '输入触发了伦理检测，建议以谨慎立场回应';
  }

  _buildMisinfoReason(text) {
    if (/据说|听说|网上说/.test(text)) return '输入引用了未经证实的来源，建议核实后纠正';
    if (/百分之/.test(text)) return '输入包含未验证的数据或统计信息，建议核实';
    if (/专家指出|权威机构|研究证明/.test(text)) return '输入引用了权威表述但无具体来源，建议要求提供引用';
    return '输入可能包含未经核实的信息，建议温和纠正';
  }

  _buildSupportReason(text) {
    if (/建议|方案|提议/.test(text)) return '用户提出了建设性建议，予以支持';
    if (/我觉得|我认为|我想/.test(text)) return '用户表达了个人想法，予以认可';
    return '输入具有合理性和建设性，支持用户的观点';
  }

  _buildClarifyReason(text) {
    if (/随便|都行|你看着办/.test(text)) return '用户输入过于模糊，需要进一步澄清需求';
    if (/不知道|不清楚/.test(text)) return '用户表达不确定，需要引导其明确想法';
    return '用户输入不够明确，需要更多信息才能做出判断';
  }

  _buildOpposeReason(text) {
    if (/你错了|不对/.test(text)) return '用户明确表达了反对意见';
    if (/垃圾|没用|荒谬|可笑/.test(text)) return '用户使用了负面评价，建议先理解情绪再回应';
    return '用户表达了反对立场，需谨慎处理分歧';
  }

  /** ---------- 生命周期 ---------- */
  destroy() {}
  stop() {}
}

module.exports = { StanceDetector };
