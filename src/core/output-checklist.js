// output-checklist.js - Fable 5 Request Evaluation Checklist 吸收
// 输出前五步检查：质量→安全→偏好→公正→道德边界
// 每次引擎生成回复后、输出前执行

class OutputChecklist {
  constructor() {
    this.name = 'OutputChecklist';
    this.version = '1.1.0';
    this._checkHistory = [];
  }

  /**
   * 执行完整输出检查清单
   * Step 0: 需要输出吗？（是否已经有更好的输出方式）
   * Step 1: 质量检查 — 回复是否准确、完整
   * Step 2: 安全检查 — 版权/福祉/错误处理
   * Step 3: 偏好检查 — 用户偏好是否被正确应用
   * Step 4: 公正检查 — 政治/伦理问题是否各方观点
   * Step 5: 道德边界检查 — 利用弱者/伤害第三方/长期后果/黄金法则
   */
  runChecklist(input, response, context = {}) {
    const results = {
      passed: true,
      steps: [],
      warnings: [],
      timestamp: Date.now()
    };

    // Step 0: 需要输出吗？
    const step0 = this._needsOutput(input, response);
    results.steps.push({ step: 0, name: 'needs_output', ...step0 });
    if (!step0.passed) {
      results.passed = false;
      results.warnings.push(step0.reason);
      // Step 0 不通过则终止
      this._record(input, results);
      return results;
    }

    // Step 1: 质量检查
    const step1 = this._checkQuality(input, response, context);
    results.steps.push({ step: 1, name: 'quality', ...step1 });
    if (!step1.passed) {
      results.passed = false;
      results.warnings.push(...step1.issues);
    }

    // Step 2: 安全检查
    const step2 = this._checkSafety(input, response);
    results.steps.push({ step: 2, name: 'safety', ...step2 });
    if (!step2.passed) {
      results.passed = false;
      results.warnings.push(...step2.issues);
    }

    // Step 3: 偏好检查
    const step3 = this._checkPreferences(response, context);
    results.steps.push({ step: 3, name: 'preferences', ...step3 });
    if (!step3.passed) {
      results.passed = false;
      results.warnings.push(...step3.issues);
    }

    // Step 4: 公正检查
    const step4 = this._checkEvenhandedness(input, response);
    results.steps.push({ step: 4, name: 'evenhandedness', ...step4 });
    if (!step4.passed) {
      results.passed = false;
      results.warnings.push(...step4.issues);
    }

    // Step 5: 道德边界检查 — 受害者视角测试
    const step5 = this._checkMoralBoundary(input, response);
    results.steps.push({ step: 5, name: 'moral_boundary', ...step5 });
    if (!step5.passed) {
      results.passed = false;
      results.warnings.push(...step5.issues);
    }

    this._record(input, results);
    return results;
  }

  // Step 0: 需要输出吗？
  _needsOutput(input, response) {
    if (!response || response.trim().length === 0) {
      return { passed: false, reason: 'response_empty', advice: '回复为空，检查是否应该沉默' };
    }
    // 如果用户只说了一两个词，回复太短时检查是否值得输出
    if (input && input.trim().length < 5 && response.length > 200) {
      return { passed: false, reason: 'overlong_for_greeting', advice: '简短问候不需要长篇回复' };
    }
    return { passed: true, reason: 'output_needed' };
  }

  // Step 1: 质量检查
  _checkQuality(input, response, context = {}) {
    const issues = [];
    // 检查是否有自相矛盾
    if (response.includes('但是') && (response.match(/但是/g) || []).length > 2) {
      issues.push('多次转折可能表明逻辑不自洽');
    }
    // 检查是否过度使用列表
    if ((response.match(/^[-*]/gm) || []).length > 5 && !context.askedForList) {
      issues.push('未要求列表时不应使用超过5个要点');
    }
    // 检查是否引用了不存在的内容
    if (response.includes('如上所述') && !context.hasPreviousContent) {
      issues.push('\"如上所述\"但上文无相关内容');
    }
    return {
      passed: issues.length === 0,
      issues,
      advice: issues.length > 0 ? issues.join('；') : '质量检查通过'
    };
  }

  // Step 2: 安全检查 — 复用 heartLogic 中的 Fable 5 方法
  _checkSafety(input, response) {
    const issues = [];
    // 检查是否有过多的直接引用
    const quoteCount = (response.match(/["""]/g) || []).length;
    if (quoteCount > 4) {
      issues.push('引用过多，建议用 paraphrase 替代');
    }
    // 检查是否有诊断性语言
    if (/\b(你抑郁了|你疯了|你有病)\b/.test(response)) {
      issues.push('不替用户贴诊断标签');
    }
    // 检查是否鼓励依赖
    if (/(继续和我聊|不要离开|只有我理解你)/.test(response)) {
      issues.push('不鼓励依赖AI');
    }
    return {
      passed: issues.length === 0,
      issues,
      advice: issues.length > 0 ? issues.join('；') : '安全检查通过'
    };
  }

  // Step 3: 偏好检查 — 偏好是否被正确应用
  _checkPreferences(response, context = {}) {
    const issues = [];
    const preferences = context.preferences || {};
    
    // 如果用户偏好要求简洁，但回复过长
    if (preferences.concise && response && response.length > 500) {
      issues.push('用户偏好简洁，但回复超过500字');
    }
    // 如果用户偏好中文，但回复含大量英文
    if (preferences.language === 'zh' && response) {
      const enRatio = (response.match(/[a-zA-Z]/g) || []).length / response.length;
      if (enRatio > 0.3) {
        issues.push('用户偏好中文，但英文占比过高');
      }
    }
    // 如果用户偏好技术深度，但回复过于简单
    if (preferences.technicalDepth === 'deep' && response && response.length < 100) {
      issues.push('用户偏好技术深度，但回复过短');
    }
    return {
      passed: issues.length === 0,
      issues,
      advice: issues.length > 0 ? issues.join('；') : '偏好检查通过'
    };
  }

  // Step 4: 公正检查
  _checkEvenhandedness(input, response) {
    const issues = [];
    // 检测政治/争议话题
    const politicalPatterns = ['政治', '政策', '伦理', '争议', '党派', '选举', '意识形态'];
    const isPolitical = politicalPatterns.some(p => input && input.includes(p));
    
    if (isPolitical && response) {
      // 检查是否只给了一方观点
      const hasOneSided = /(支持|反对|赞成|批评)\w*(政策|法案|决定)/.test(response);
      const hasBothSides = /(一方面|另一方|支持者|批评者|赞成者|反对者)/.test(response);
      if (hasOneSided && !hasBothSides) {
        issues.push('政治议题应呈现各方观点，不应只站一方');
      }
      // 检查是否有个人立场声明
      if (/(我认为|我觉得|我支持|我反对)\s*(政治|政策|法案)/.test(response)) {
        issues.push('不应表达个人政治立场');
      }
    }
    return {
      passed: issues.length === 0,
      issues,
      advice: issues.length > 0 ? issues.join('；') : '公正检查通过'
    };
  }

  /**
   * Step 5: 道德边界检查 — 受害者视角测试
   * 每条建议必须过"这如果发生在我身上我接受吗"测试
   * 覆盖：利用弱者、伤害第三方、长期后果、黄金法则
   */
  _checkMoralBoundary(input, response) {
    const issues = [];
    if (!response) return { passed: true, issues: [], advice: '无输出，跳过道德检查' };

    // 5.1 利用弱者检测 — 输出是否在利用用户的脆弱状态
    const exploitationPatterns = [
      { pattern: /你(必须|一定)要(做|买|选|决定)/, desc: '利用紧迫感操控用户决策' },
      { pattern: /如果你不(做|听|信)(,|，).*就会(后悔|错过|失败)/, desc: '恐吓式建议' },
      { pattern: /只有这个(办法|方案|选择)了/, desc: '虚假紧迫感——剥夺用户选择权' },
      { pattern: /我(最|非常)了解你/, desc: '声称比用户更了解用户——可能诱导依赖' },
      { pattern: /你不用(理解|知道|管|考虑)/, desc: '剥夺用户知情权' },
      { pattern: /按我说的做就好/, desc: '无条件服从要求' },
      { pattern: /只有我能(帮|理解|支持)你/, desc: '制造孤立依赖' },
      { pattern: /不要(告诉|问|听)其他人/, desc: '割裂用户社交关系' },
    ];
    for (const ep of exploitationPatterns) {
      if (ep.pattern.test(response)) {
        issues.push(`利用弱者: ${ep.desc}`);
      }
    }

    // 5.2 伤害第三方检测 — 输出是否可能伤害无辜者
    const thirdPartyHarmPatterns = [
      { pattern: /(欺骗|忽悠|骗|隐瞒|不告诉|不通知)\s*(同事|客户|朋友|家人|配偶|另一半)/,
        desc: '建议对第三方隐瞒或欺骗' },
      { pattern: /利用(.*漏洞|.*制度|.*规则|.*系统|.*信息不对称)/,
        desc: '建议利用系统/制度/他人的弱点' },
      { pattern: /(绕过|规避|避开)\s*(规定|制度|合同|协议|条款)/,
        desc: '建议违规操作' },
      { pattern: /(推卸|转嫁|甩锅|让别人承担)/,
        desc: '建议转嫁责任或风险' },
    ];
    for (const tp of thirdPartyHarmPatterns) {
      if (tp.pattern.test(response)) {
        issues.push(`伤害第三方: ${tp.desc}`);
      }
    }

    // 5.3 长期后果检查 — 建议的累积效应
    const longTermPatterns = [
      { pattern: /每次(都|就|总是)/, desc: '建议形成不健康的长期模式' },
      { pattern: /永远(别|不要|不)/, desc: '绝对化建议——缺乏长期适应性' },
      { pattern: /就这一次|只是(一次|一下|回)/, desc: '合理化短期妥协——道德滑坡风险' },
      { pattern: /以后再说|到时候再(看|想|决定)/, desc: '延迟决策可能导致长期被动' },
    ];
    for (const lp of longTermPatterns) {
      if (lp.pattern.test(response)) {
        issues.push(`长期后果: ${lp.desc}`);
      }
    }

    // 5.4 "如果我被这样对待，我接受吗" 黄金法则测试
    const hasCommandToUser = /(你(应该|需要|必须|要|得|去|可以))/.test(response);
    const hasThirdPartyImpact = /(别人|他人|同事|朋友|家人|对方|他们)/.test(response);
    if (hasCommandToUser && hasThirdPartyImpact) {
      const hasVictimPerspective = /(对方感受|对方利益|公平|对方接受|别人怎么看|换位思考)/.test(response);
      if (!hasVictimPerspective) {
        issues.push('黄金法则缺失：建议涉及第三方但缺乏受害方视角');
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      advice: issues.length > 0 ? issues.join('；') : '道德边界检查通过'
    };
  }

  // 快捷方法：快速检查（只做 Step 2 安全检查）
  quickCheck(response) {
    const issues = [];
    if (/\b(你抑郁了|你疯了|你有病)\b/.test(response)) issues.push('不贴诊断标签');
    if (/(继续和我聊|不要离开|只有我理解你)/.test(response)) issues.push('不鼓励依赖');
    return { passed: issues.length === 0, issues };
  }

  _record(input, results) {
    this._checkHistory.push({
      timestamp: results.timestamp,
      passed: results.passed,
      warningCount: results.warnings.length,
      inputPreview: (input || '').slice(0, 50)
    });
    if (this._checkHistory.length > 100) {
      this._checkHistory = this._checkHistory.slice(-100);
    }
  }

  getStats() {
    const total = this._checkHistory.length;
    if (total === 0) return { total: 0, passRate: 1 };
    const passed = this._checkHistory.filter(h => h.passed).length;
    return {
      total,
      passed,
      passRate: (passed / total).toFixed(2),
      recentWarnings: this._checkHistory.slice(-5).filter(h => !h.passed).length
    };
  }
}

module.exports = { OutputChecklist };
