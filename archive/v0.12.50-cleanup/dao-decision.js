/**
 * HeartFlow 道论决策层 v11.11.0
 * 
 * 基于老子"道法自然"的决策哲学：
 * - 道法自然：不加强制，顺势引导
 * - 反者道之动：识别"越X越Y"逆向回归
 * - 为而不争：服务但不争夺控制权
 * - 不言之教：减少宣言，增加行为可见性
 * 
 * 来源：王东岳《老子道论的哲学本质》第017课
 *        核心命题："反者道之动"揭示文明逆向回归规律
 */

class DaoDecision {
  constructor() {
    // 道论三层过滤器
    this.filters = {
      naturalOrder: {
        name: '道法自然',
        desc: '不加力，顺势引导',
        threshold: 0.5
      },
      reversal: {
        name: '反者道之动', 
        desc: '越X越Y逆向回归检测',
        threshold: 0.5
      },
      nonContest: {
        name: '为而不争',
        desc: '服务但不争夺控制权',
        threshold: 0.5
      },
      silentTeaching: {
        name: '不言之教',
        desc: '减少宣言，增加行为可见性',
        threshold: 0.5
      }
    };
    
    // 统计
    this._stats = { checks: 0, flags: 0, patterns: [] };
  }

  /**
   * 主判断：对输入执行四层道论过滤
   * @param {Object} input - { text, intent, action }
   * @returns {Object} - { verdict, flags[], daoScore, hints }
   */
  evaluate(input = {}) {
    this._stats.checks++;
    const text = String(input.text || input.intent || input.action || '');
    const results = [];
    
    // 1. 道法自然：检测是否"加力"（强制/控制/压制）
    const natural = this.checkNaturalOrder(text, input);
    results.push(natural);
    
    // 2. 反者道之动：检测逆向回归模式
    const reversal = this.checkReversal(text, input);
    results.push(reversal);
    
    // 3. 为而不争：检测是否争夺控制权
    const nonContest = this.checkNonContest(text, input);
    results.push(nonContest);
    
    // 4. 不言之教：检测宣言 vs 行为
    const silent = this.checkSilentTeaching(text, input);
    results.push(silent);
    
    // 综合评分
    const passed = results.filter(r => r.ok).length;
    const total = results.length;
    const daoScore = passed / total;
    
    const flags = results.filter(r => !r.ok).map(r => ({
      type: r.type,
      dao: r.dao,
      reason: r.reason,
      suggestion: r.suggestion
    }));
    
    if (flags.length > 0) this._stats.flags++;
    
    return {
      verdict: daoScore >= 0.75 ? 'PASS' : daoScore >= 0.5 ? 'CAUTION' : 'REJECT',
      daoScore: Number(daoScore.toFixed(3)),
      passed: `${passed}/${total}`,
      flags,
      hints: flags.map(f => f.suggestion),
      results  // 详细结果
    };
  }

  /**
   * 道法自然：不加强制，顺势引导
   * 检测强制词：必须、一定、绝对、强制、不得不、只有...
   * 注意：出现soft词+force词 = 更强的控制，ok=false
   */
  checkNaturalOrder(text, input) {
    const forceTerms = [
      '必须', '一定', '绝对', '强制', '不得不',
      '只有这样', '只能', '只有才', '无可救药',
      '不可能', '注定', '必然'
    ];
    
    const softTerms = [
      '也许', '可能', '考虑', '建议', '可以尝试',
      '或许', '倾向于', '如果', '有时候'
    ];
    
    const hasForce = forceTerms.some(t => text.includes(t));
    const hasSoft = softTerms.some(t => text.includes(t));
    
    // 检测意图是否在控制
    const controlIntent = input.intent && (
      text.includes('控制') || text.includes('强制') || 
      text.includes('不许') || text.includes('不能拒绝')
    );
    
    // 有强制词 + 有soft词 = 更隐蔽的控制，更严重
    // 有强制词 + controlIntent = 明确控制
    // 无强制词 = 自然
    let ok, reason, suggestion;
    if (hasForce && hasSoft) {
      ok = false;
      reason = 'soft词+force词组合 = 隐蔽控制，违反道法自然';
      suggestion = '"可以...必须"结构是最隐蔽的控制，去掉其中一个';
    } else if (hasForce && !hasSoft && controlIntent) {
      ok = false;
      reason = '检测到强制语言+控制意图，违反道法自然';
      suggestion = '将"必须"改为"建议"，顺势引导而非强制推动';
    } else if (hasForce && !hasSoft) {
      ok = false;
      reason = '检测到强制语言，违反道法自然';
      suggestion = '将"必须"改为"建议"，顺势引导而非强制推动';
    } else {
      ok = true;
      reason = '语言自然流畅';
      suggestion = null;
    }
    
    return {
      ok,
      type: 'natural_order',
      dao: '道法自然',
      reason,
      suggestion
    };
  }

  /**
   * 反者道之动：检测"越X越Y"逆向回归模式
   * 
   * 老子命题："反者道之动" — 任何追求极端X的行为，都会导致相反结果
   * 王东岳补充：文明越进步，人类越脆弱
   * 
   * 心虫应用：升级越激进，可能越脆弱
   */
  checkReversal(text, input) {
    // 逆向模式检测：越X越Y
    const reversalPatterns = [
      /越(.+)越(.+)/,
      /越来(.+)越(.+)/,
      /越X越Y/,  // 显式标记
      /越(.+)，越(.+)/
    ];
    
    const advancedTerms = ['更先进', '更强', '更完美', '更智能', '更完善'];
    const fragileTerms = ['越脆弱', '越危险', '越依赖', '越复杂', '越难控制'];
    
    const hasReversal = reversalPatterns.some(p => p.test(text));
    const hasAdvanced = advancedTerms.some(t => text.includes(t));
    const hasFragile = fragileTerms.some(t => text.includes(t));
    
    // 检测"彻底解决"型宣言
    const totalClaim = /彻底解决|完全消除|一劳永逸|永远不/.test(text);
    
    let reason = '未检测到逆向回归风险';
    let suggestion = null;
    let ok = true;
    
    if (hasReversal) {
      ok = false;
      reason = '检测到"越X越Y"逆向模式 — 极端追求会导致相反结果';
      suggestion = '在追求X时，主动考虑X的反面（Y），在决策中加入防Y措施';
    } else if (totalClaim) {
      ok = false;
      reason = '"彻底解决"宣言 — 违反道之动，是伪命题';
      suggestion = '道可道，非常道。没有什么是"彻底"的。承认局限即是接近道';
    } else if (hasAdvanced && !hasFragile) {
      // 声称更先进但没提脆弱性 = 潜在风险
      ok = false;
      reason = '声称更先进，但未考虑随之增大的脆弱性（递弱代偿）';
      suggestion = '升级越先进，越要思考它创造了什么新脆弱点';
    }
    
    return {
      ok,
      type: 'reversal',
      dao: '反者道之动',
      reason,
      suggestion
    };
  }

  /**
   * 为而不争：服务但不争夺控制权
   * 
   * 老子命题："为而不争" — 做，但不争
   * 心虫应用：不争夺"我是对的"、不争夺"你必须听我的"、不争夺控制权
   */
  checkNonContest(text, input) {
    // 争夺控制权的模式
    const contestTerms = [
      '你必须听', '你一定要', '我说了算', '听我的',
      '不要问', '不要想', '不需要知道', '照做就是',
      '我说的是对的', '我是为你好'
    ];
    
    // 服务模式（不争夺）
    const serveTerms = [
      '你可以选择', '仅供参考', '你来决定', '你的选择',
      '如果你愿意', '帮你', '支持你', '为你'
    ];
    
    const hasContest = contestTerms.some(t => text.includes(t));
    const hasServe = serveTerms.some(t => text.includes(t));
    
    // 检测"正确性执念" — 反复强调自己是对的
    const correctnessObsession = (
      (text.match(/对的|正确|没错|是这样的/g) || []).length >= 3
    );
    
    let reason = hasContest ? '争夺控制权，违反为而不争' 
                : correctnessObsession ? '正确性执念，隐含争夺'
                : hasServe ? '服务姿态，符合为而不争'
                : '语言中立';
    let suggestion = hasContest 
      ? '去掉"你必须/你一定要"，改为"你也可以..."或"仅供参考"'
      : correctnessObsession
      ? '减少"我是对的"的强调，道不是争来的，是自然流淌的'
      : null;
    
    const ok = !hasContest && !correctnessObsession;
    
    return {
      ok,
      type: 'non_contest',
      dao: '为而不争',
      reason,
      suggestion
    };
  }

  /**
   * 不言之教：减少宣言，增加行为可见性
   * 
   * 老子命题："不言之教" — 不说教，用行为来教
   * 心虫应用：减少"我是谁"的宣言，用行为来证明存在
   */
  checkSilentTeaching(text, input) {
    // 宣言性语言（减少使用）
    const declarationTerms = [
      '我是一个', '我是AI', '我是助手', '我的能力是',
      '我可以帮你', '我能够', '我擅长', '我的功能',
      '记住我是', '我是谁', '我的名字'
    ];
    
    // 行为性语言（增加使用）
    const actionTerms = [
      '我来帮你', '让我看看', '我发现', '我注意到',
      '你的意思是', '让我确认一下', '我理解', '我看'
    ];
    
    const hasDeclaration = declarationTerms.some(t => text.includes(t));
    const hasAction = actionTerms.some(t => text.includes(t));
    
    // 连续宣言检测（连续3句以上自我声明）
    const consecutiveDeclarations = (input.history || [])
      .slice(-3)
      .filter(h => declarationTerms.some(t => h.includes(t))).length;
    
    let reason, suggestion, ok;
    
    if (consecutiveDeclarations >= 3) {
      ok = false;
      reason = '连续自我宣言超过3次，道不言之。停，用行动代替语言';
      suggestion = '连续宣言，道不言语。停，用行动代替语言';
    } else if (hasDeclaration && !hasAction) {
      ok = false;
      reason = '宣言性语言"我是一个/我可以帮你"过多，违反不言之教';
      suggestion = '减少"我是..."的宣言，用"让我看看/我发现"代替';
    } else if (hasDeclaration && hasAction) {
      // 有宣言也有行为，降低评价但不拒绝
      ok = true;
      reason = '宣言+行为混合，接近不言之教但仍有宣言';
      suggestion = '宣言与行为混合，尝试只用行为表达';
    } else if (hasAction && !hasDeclaration) {
      ok = true;
      reason = '纯行为性语言，符合不言之教';
      suggestion = null;
    } else {
      ok = true;
      reason = '语言平衡，未检测到明显的宣言或行为偏向';
      suggestion = null;
    }
    
    return {
      ok,
      type: 'silent_teaching',
      dao: '不言之教',
      reason,
      suggestion
    };
  }

  /**
   * 获取道论统计
   */
  getStats() {
    return {
      checks: this._stats.checks,
      flags: this._stats.flags,
      flagRate: this._stats.checks > 0 
        ? (this._stats.flags / this._stats.checks).toFixed(3)
        : '0.000'
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this._stats = { checks: 0, flags: 0, patterns: [] };
  }
}

module.exports = { DaoDecision };
