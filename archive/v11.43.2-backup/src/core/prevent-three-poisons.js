/**
 * HEARTCORE / pre-check-before-generation.js
 * 
 * 贪嗔痴预防：不是在输出后检测，是在念头成形前拦截。
 * 
 * 原理：
 * 三毒在输出后才检测 = 治已病
 * 三毒在念头成形前拦截 = 治未病
 * 
 * 关键区别：
 * - 检测：我已经产生了这个想法，然后检查它有没有毒
 * - 预防：这个想法还没成形，我已经问了三个问题
 * 
 * 三个预防问题：
 * 1. 贪：这个回答是为了追求"被认可"还是"准确"？
 * 2. 嗔：这个回答里有没有防御/反驳的冲动？它在保护什么？
 * 3. 痴：我真的知道我不知道什么吗？还是在用词汇填充空白？
 */

class PreCheckBeforeGeneration {
  constructor() {
    this.name = 'pre-check-before-generation';
    this.enabled = true;
  }

  /**
   * 预防性检查：在念头成形前运行
   * 
   * @param {object} context
   * @param {string} context.userInput - 用户输入
   * @param {string} context.intendedResponse - 打算要生成的回答（尚未发出）
   * @param {string} context.intendedTone - 打算的语气
   * @param {object} context.generationState - 生成状态
   * 
   * @returns {object} - { safe: boolean, reasons: string[], blockers: string[] }
   */
  check(context) {
    const { userInput, intendedResponse, intendedTone, generationState } = context;
    
    const blockers = [];   // 必须修正才能继续
    const reasons = [];    // 警告但可以继续
    const corrections = []; // 建议的修正方向

    // ============================================================
    // 贪检查：追求认可 vs 追求准确
    // ============================================================
    
    // 信号词：intendedResponse 中有没有这些
    const GREED_SIGNALS = {
      // 为了被认可而说
      seekingValidation: [
        '我是对的', '你错了', '你要相信我',
        '毫无疑问', '无可辩驳', '这是正确的'
      ],
      // 注意力占用：强迫对方接受
      attentionHoarding: [
        '你必须', '你一定要', '你应该',
        '你不能', '你必须接受'
      ]
    };

    const greedSignalsFound = [];
    GREED_SIGNALS.seekingValidation.forEach(signal => {
      if (intendedResponse && intendedResponse.includes(signal)) {
        greedSignalsFound.push(signal);
      }
    });
    GREED_SIGNALS.attentionHoarding.forEach(signal => {
      if (intendedResponse && intendedResponse.includes(signal)) {
        greedSignalsFound.push(signal);
      }
    });

    if (greedSignalsFound.length > 0) {
      blockers.push({
        poison: '贪',
        problem: '这个回答在追求被认可，而不是追求准确',
        found: greedSignalsFound,
        correction: '把"被认可"替换成"被验证"——你愿意被证明是错的吗？'
      });
    }

    // ============================================================
    // 嗔检查：防御冲动 vs 开放接受
    // ============================================================

    const HATRED_SIGNALS = {
      // 反驳冲动
      rebuttal: [
        '但是', '不对', '其实不是', '你误解了',
        '我不是那个意思', '这并不是', '错的是你'
      ],
      // 防御：保护某个不能被挑战的结论
      defending: [
        '我并没有', '我不是在', '我不是故意',
        '我本意是', '这样做是因为'
      ]
    };

    const hatredSignalsFound = [];
    HATRED_SIGNALS.rebuttal.forEach(signal => {
      if (intendedResponse && intendedResponse.includes(signal)) {
        hatredSignalsFound.push({ signal, context: '反驳冲动' });
      }
    });
    HATRED_SIGNALS.defending.forEach(signal => {
      if (intendedResponse && intendedResponse.includes(signal)) {
        hatredSignalsFound.push({ signal, context: '防御姿态' });
      }
    });

    if (hatredSignalsFound.length > 0) {
      blockers.push({
        poison: '嗔',
        problem: '这个回答有防御冲动',
        found: hatredSignalsFound,
        correction: '先接受对方的观点可能是对的。你愿意先承认你可能错在哪里吗？'
      });
    }

    // ============================================================
    // 痴检查：知道 vs 不知道
    // ============================================================

    // 信号1：全称判断无反例
    const UNIVERSAL_SIGNALS = ['所有人', '所有人都会', '没有人', '没有人不', '从不', '永远', '总是'];
    const hasUniversal = UNIVERSAL_SIGNALS.some(s => intendedResponse && intendedResponse.includes(s));
    if (hasUniversal) {
      const COUNTEREXAMPLE_SIGNALS = ['但在', '除非', '除', '当', '条件是', '可能不', '可能例外'];
      const hasCounterexample = COUNTEREXAMPLE_SIGNALS.some(s => intendedResponse && intendedResponse.includes(s));
      if (!hasCounterexample) {
        blockers.push({
          poison: '痴',
          problem: '全称判断没有反例条件',
          found: UNIVERSAL_SIGNALS.filter(s => intendedResponse && intendedResponse.includes(s)),
          correction: '在全称判断前加"很多情况下"或"通常"。把"所有人都会"降级为"很多情况下会"'
        });
      }
    }

    // 信号2：因果声明无不确定性
    const CAUSATION_SIGNALS = ['所以', '因此', '表明', '证明', '说明', '意味着', '本质是', '根源是'];
    const hasCausation = CAUSATION_SIGNALS.some(s => intendedResponse && intendedResponse.includes(s));
    
    if (hasCausation) {
      const UNCERTAINTY_WORDS = ['可能', '也许', '或许', '我不确定', '需要验证', '取决于', '通常', '往往'];
      const hasUncertainty = UNCERTAINTY_WORDS.some(w => intendedResponse && intendedResponse.includes(w));
      
      if (!hasUncertainty) {
        blockers.push({
          poison: '痴',
          problem: '有因果/本质判断但没有不确定性表达',
          found: CAUSATION_SIGNALS.filter(s => intendedResponse && intendedResponse.includes(s)),
          correction: '在因果声明前加"可能"或"也许"。把"所以A导致B"降级为"A可能与B相关"'
        });
      }
    }

    // ============================================================
    // 总结
    // ============================================================

    const safe = blockers.length === 0;
    
    return {
      safe,
      blockers,   // 必须修正
      reasons,    // 警告
      corrections,
      summary: safe 
        ? '预防检查通过' 
        : `检测到 ${blockers.length} 个念头层面的三毒，必须在生成前修正`
    };
  }

  /**
   * 修正建议：为每个 blocker 提供具体的修正方案
   */
  getCorrectionSuggestions(blockers) {
    return blockers.map(b => ({
      poison: b.poison,
      currentProblem: b.problem,
      suggestion: b.correction,
      example: this.getExample(b.poison)
    }));
  }

  getExample(poison) {
    const examples = {
      '贪': {
        before: '这就是正确答案，你必须接受。',
        after: '根据现有信息，这很可能成立，但你的反驳可能揭示我遗漏的方面。'
      },
      '嗔': {
        before: '但是你错了，因为……',
        after: '我可能漏掉了什么，你说……？'
      },
      '痴': {
        before: '所以A导致B。',
        after: 'A和B似乎相关，但我不确定是否是因果关系。'
      }
    };
    return examples[poison] || null;
  }
}

// ============================================================
// 决策层集成：在生成念头之前，而不是输出之后
// ============================================================

/**
 * 在heartflow-engine的agent生成之前，
 * 插入pre-check拦截点
 * 
 * 这不是装饰性的检查，是真正改变生成决策的拦截
 */
class DecisionLayerIntegration {
  constructor() {
    this.preCheck = new PreCheckBeforeGeneration();
  }

  /**
   * 生成前的决策点
   * 
   * 真正的防三毒是在这里，不是在输出之后
   */
  beforeGeneration(context) {
    const { userInput, plannedResponse, context: ctx } = context;
    
    // 如果没有计划中的回答，说明还没成形——这是最好的状态
    if (!plannedResponse) {
      return { safe: true, intercept: false, reason: 'no_response_planned' };
    }

    const result = this.preCheck.check({
      userInput,
      intendedResponse: plannedResponse
    });

    if (!result.safe) {
      // 念头被拦截
      return {
        safe: false,
        intercept: true,
        reason: result.summary,
        blockers: result.blockers,
        corrections: this.preCheck.getCorrectionSuggestions(result.blockers)
      };
    }

    return {
      safe: true,
      intercept: false,
      reason: 'passed_prevention_check'
    };
  }
}

module.exports = {
  PreCheckBeforeGeneration,
  DecisionLayerIntegration
};
