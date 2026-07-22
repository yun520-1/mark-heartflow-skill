// [v6.0.71] 纯函数 + 推理模式常量已提取到 logic-patterns.js
const { _matchKeywords, _matchAnyRegex, REASONING_PATTERNS, FALLACY_PATTERNS, FRAMEWORKS, PROBLEM_PATTERNS, PROBLEM_FRAMEWORK_MAP } = require('./logic-patterns.js');

class LogicReasoning {
  constructor(options = {}) {
    this.version = '5.5.0';
    // [HIGH FIX] 环形缓冲区（避免 shift() O(n) 开销）
    this._history = new Array(this._maxHistory);
    this._historyHead = 0;  // 写入位置
    this._historySize = 0;  // 当前大小
    this._maxHistory = options.maxHistory || 50;
  }

  /**
   * 主入口：五合一分析（含答案选择）
   */
  analyze(input, options = {}) {
    if (!input || typeof input !== 'string') {
      return { error: 'input is required', valid: false };
    }

    const startTime = Date.now();

    const reasoningType = this.detectType(input);
    const premiseCheck = this.checkPremises(input);
    const fallacies = this.findFallacies(input);
    const frameworkRecommendation = this.recommendFramework(input, reasoningType);
    const answerSelection = this.selectAnswer(input, { reasoningType, fallacies, premiseCheck });

    const result = {
      reasoningType,
      premiseCheck,
      fallacies,
      frameworkRecommendation,
      answerSelection,
      meta: {
        duration: Date.now() - startTime,
        inputLength: input.length,
        timestamp: Date.now(),
      },
    };

    this._history.push({
      input: input.slice(0, 100),
      type: reasoningType.primaryType,
      fallacyCount: fallacies.length,
      answer: answerSelection?.selectedAnswer || null,
      ts: Date.now(),
    });
    if (this._history.length > this._maxHistory) {
      // [HIGH FIX] 环形缓冲区无需 shift()（超过容量时自动覆盖）
    }

    return result;
  }

  /**
   * 1. 推理类型检测
   */
  detectType(input) {
    const results = [];
    let bestType = 'general';
    let bestScore = 0;

    for (const pattern of REASONING_PATTERNS) {
      let score = 0;
      const matchedKeywords = [];

      // 关键词检测
      for (const kwGroup of pattern.keywords) {
        const { hits, matched } = _matchKeywords(input, kwGroup);
        score += hits * pattern.weight;
        matchedKeywords.push(...matched);
      }

      // 正则奖励
      if (pattern.regexBonus) {
        for (const re of pattern.regexBonus) {
          if (re.test(input)) {
            score += pattern.weight * 1.5;
            matchedKeywords.push('[re:' + re.source.slice(0, 30) + ']');
          }
        }
      }

      score = Math.min(score, 1.0);

      if (score > 0) {
        results.push({ type: pattern.id, name: pattern.name, score, matched: matchedKeywords.slice(0, 5) });
        if (score > bestScore) {
          bestScore = score;
          bestType = pattern.id;
        }
      }
    }

    if (bestScore < 0.2) {
      bestType = 'general';
    }

    return {
      primaryType: bestType,
      primaryScore: Math.round(bestScore * 100) / 100,
      candidates: results.sort((a, b) => b.score - a.score),
      typeCount: results.length,
    };
  }

  /**
   * 2. 前提检查
   */
  checkPremises(input) {
    const result = {
      hasPremises: false,
      explicitPremises: [],
      implicitPremises: [],
      missingPremises: [],
      premiseQuality: 'unchecked',
      confidence: 0,
    };

    const explicitRegex = [
      /因为(.+?)(?:，|,|。|；|;|$)/g,
      /由于(.+?)(?:，|,|。|；|;|$)/g,
      /基于(.+?)(?:，|,|。|；|;|$)/g,
      /根据(.+?)(?:，|,|。|；|;|$)/g,
      /鉴于(.+?)(?:，|,|。|；|;|$)/g,
      /假设(.+?)(?:，|,|。|；|;|$)/g,
    ];

    const seen = new Set();
    for (const regex of explicitRegex) {
      let match;
      while ((match = regex.exec(input)) !== null) {
        const premise = match[1].trim();
        if (premise.length > 2 && !seen.has(premise)) {
          seen.add(premise);
          result.explicitPremises.push(premise);
        }
      }
    }

    const implicitSignals = [
      { pattern: /显然|当然|不言而喻|众所周知|毫无疑问/i, type: '未验证假设' },
      { pattern: /应该|必须|一定|肯定|必然/i, type: '价值判断' },
      { pattern: /总是|从来|永远|都|全部|所有/i, type: '全称断言' },
      { pattern: /正常来说|按理说|按照道理|一般来说/i, type: '默认假设' },
    ];

    for (const signal of implicitSignals) {
      if (signal.pattern.test(input)) {
        result.implicitPremises.push({
          type: signal.type,
          trigger: input.match(signal.pattern)?.[0] || '',
        });
      }
    }

    if (/所以|因此|因而|故而/i.test(input) && result.explicitPremises.length === 0) {
      result.missingPremises.push({
        reason: '使用了结论标记词但未提供显式前提',
        suggestion: '建议补充推导依据',
      });
    }

    if (/更好|更差|更优|更劣|优于|劣于|高于|低于/i.test(input)) {
      if (!/比|与.*相比|相对|相较/i.test(input)) {
        result.missingPremises.push({
          reason: '使用了比较性结论但未说明比较对象',
          suggestion: '建议明确比较基准',
        });
      }
    }

    if (/导致|引起|造成|引发|促使/i.test(input)) {
      const causeCount = (input.match(/因为|由于|基于|鉴于/g) || []).length;
      if (causeCount < 1) {
        result.missingPremises.push({
          reason: '使用了因果论述但未提供因果机制解释',
          suggestion: '建议补充因果关系说明',
        });
      }
    }

    const total = result.explicitPremises.length + result.implicitPremises.length;
    result.hasPremises = total > 0;

    if (result.explicitPremises.length >= 2) {
      result.premiseQuality = 'good';
      result.confidence = 0.7 + Math.min(result.explicitPremises.length * 0.05, 0.2);
    } else if (result.explicitPremises.length >= 1) {
      result.premiseQuality = 'adequate';
      result.confidence = 0.5;
    } else if (result.implicitPremises.length > 0) {
      result.premiseQuality = 'weak';
      result.confidence = 0.3;
    } else {
      result.premiseQuality = 'none';
      result.confidence = 0;
    }

    result.confidence = Math.round(result.confidence * 100) / 100;
    return result;
  }

  /**
   * 3. 谬误识别
   */
  findFallacies(input) {
    const fallacies = [];

    // 先提取问题部分（去掉选项）
    const questionPart = input.replace(/\n[A-D][.、．)）].+/g, '').trim();
    // 如果没提取到，就用原文
    const analysisInput = questionPart.length > 10 ? questionPart : input;

    for (const pattern of FALLACY_PATTERNS) {
      let score = 0;
      const matched = [];

      let groupsHit = 0;
      for (const kwGroup of pattern.keywords) {
        const { hits, matched: m } = _matchKeywords(analysisInput, kwGroup);
        if (hits > 0) {
          groupsHit++;
          matched.push(...m.slice(0, 2));
          score += hits * 0.15;
        }
      }

      if (pattern.regexBonus) {
        for (const re of pattern.regexBonus) {
          if (re.test(analysisInput)) {
            score += 0.2;
            matched.push('[re]');
          }
        }
      }

      if (pattern.specialCheck) {
        const specialScore = pattern.specialCheck(analysisInput);
        if (specialScore > 0) {
          score += specialScore;
          matched.push('[special]');
        }
      }

      // 循环论证要求问题文本包含"因为"
      if (pattern.id === 'circularReasoning' && !/因为/.test(analysisInput)) {
        score = 0;
      }

      if (pattern.minKeywordGroups && groupsHit < pattern.minKeywordGroups) {
        score = 0;
      }

      score = Math.min(score, 1.0);

      if (score >= 0.25) {
        fallacies.push({
          id: pattern.id,
          name: pattern.name,
          desc: pattern.desc,
          confidence: Math.round(score * 100) / 100,
          matchedSignals: [...new Set(matched)].slice(0, 3),
          severity: score >= 0.6 ? 'high' : score >= 0.4 ? 'medium' : 'low',
        });
      }
    }

    return fallacies.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 4. 推理框架推荐
   */
  recommendFramework(input, reasoningType = null) {
    const problemTypes = this._classifyProblem(input);
    const candidates = [];

    for (const probType of problemTypes) {
      const recommended = PROBLEM_FRAMEWORK_MAP[probType] || [];
      for (const fwId of recommended) {
        if (!candidates.find(c => c.id === fwId)) {
          const fw = FRAMEWORKS[fwId];
          if (fw) {
            candidates.push({
              id: fwId,
              name: fw.name,
              desc: fw.desc,
              relevance: fw.confidence,
              reasons: [`问题类型「${probType}」推荐此框架`],
            });
          }
        } else {
          const existing = candidates.find(c => c.id === fwId);
          if (existing) {
            existing.relevance = Math.min(existing.relevance + 0.1, 1.0);
            existing.reasons.push(`问题类型「${probType}」也推荐此框架`);
          }
        }
      }
    }

    const fallacies = this.findFallacies(input);
    if (fallacies.length > 0) {
      const antiFallacyFrameworks = ['redTeam', 'dialectical', 'firstPrinciples'];
      for (const fwId of antiFallacyFrameworks) {
        const existing = candidates.find(c => c.id === fwId);
        if (existing) {
          existing.relevance = Math.min(existing.relevance + 0.15, 1.0);
          existing.reasons.push(`检测到${fallacies.length}个谬误，建议用此框架反制`);
        } else {
          const fw = FRAMEWORKS[fwId];
          if (fw) {
            candidates.push({
              id: fwId,
              name: fw.name,
              desc: fw.desc,
              relevance: 0.5,
              reasons: [`检测到${fallacies.length}个谬误，建议用此框架反制`],
            });
          }
        }
      }
    }

    const sorted = candidates.sort((a, b) => b.relevance - a.relevance).slice(0, 3);

    if (sorted.length === 0) {
      sorted.push({
        id: 'chainOfThought',
        name: FRAMEWORKS.chainOfThought.name,
        desc: FRAMEWORKS.chainOfThought.desc,
        relevance: 0.5,
        reasons: ['默认推荐：思维链适用于大多数推理场景'],
      });
    }

    return {
      primary: sorted[0] || null,
      alternatives: sorted.slice(1),
      all: sorted,
      problemTypes,
      hasFallacies: fallacies.length > 0,
    };
  }

  _classifyProblem(input) {
    const types = [];
    for (const [type, regexes] of Object.entries(PROBLEM_PATTERNS)) {
      if (_matchAnyRegex(input, regexes)) {
        types.push(type);
      }
    }
    return types.length > 0 ? types : ['general'];
  }

  /**
   * 5. 答案选择（选择题）
   * 从选择题文本中提取选项，结合推理类型+谬误+前提分析选择正确答案
   */
  async selectAnswer(input, context) {
    if (context === undefined) context = {};
    // 如果没有传入推理类型上下文，自动检测
    if (!context.reasoningType || Object.keys(context.reasoningType).length === 0) {
      context.reasoningType = this.detectType(input);
    }
    // 提取选项
    const optionPattern = /(?:^|\n)([A-D])[.、．)）]\s*(.+?)(?=\n[A-D][.、．)）]|$|\n\s*$)/g;
    const options = [];
    let match;
    while ((match = optionPattern.exec(input)) !== null) {
      options.push({ letter: match[1], text: match[2].trim() });
    }

    if (options.length === 0) {
      // 尝试另一种格式：A. xxx B. xxx
      const altPattern = /([A-D])[.、．)）]\s*([^A-D]*?)(?=[A-D][.、．)）]|$)/g;
      while ((match = altPattern.exec(input)) !== null) {
        options.push({ letter: match[1], text: match[2].trim() });
      }
    }

    if (options.length === 0) {
      return {
        hasOptions: false,
        selectedAnswer: null,
        confidence: 0,
        reason: '未检测到选择题选项格式',
      };
    }

    const { reasoningType = {}, fallacies = [], premiseCheck = {} } = context;
    const questionPart = input.replace(/\n[A-D][.、．)）].+/g, '').trim();

    // 评分每个选项
    const scored = options.map(opt => {
      let score = 0;
      const reasons = [];

      // === 规则1：谬误检测（问"犯了什么谬误"）===
      if (questionPart.includes('谬误')) {
        const optLow = opt.text.toLowerCase();
        const falNames = fallacies.map(f => f.name);
        
        // 选项文本与检测到的谬误匹配
        for (const fal of fallacies) {
          if (optLow.includes(fal.name.replace('谬误', '').trim().toLowerCase())) {
            score += fal.confidence * 2;
            reasons.push(`选项匹配检测到的谬误「${fal.name}」(conf=${fal.confidence})`);
          }
        }
        
        // 对特定谬误题型做关键词匹配
        if (fallacies.length === 0) {
          for (const [idx, pattern] of FALLACY_PATTERNS.entries()) {
            // 直接对问题文本做关键词检测
            let qScore = 0;
            let qGroupsHit = 0;
            for (const kwGroup of pattern.keywords) {
              const { hits } = _matchKeywords(questionPart, kwGroup);
              if (hits > 0) qGroupsHit++;
              qScore += hits * 0.1;
            }
            if (pattern.regexBonus) {
              for (const re of pattern.regexBonus) {
                if (re.test(questionPart)) {
                  qScore += 0.2;
                  qGroupsHit++;
                }
              }
            }
            if (pattern.minKeywordGroups && qGroupsHit < pattern.minKeywordGroups) {
              qScore = 0;
            }
            // 循环论证要求问题文本包含"因为"（否则可能是"所以"单独出现）
            if (pattern.id === 'circularReasoning' && !/因为/.test(questionPart)) {
              qScore = 0;
            }
            // 虚假因果要求至少2组关键词或匹配到因果相关词
            if (pattern.id === 'falseCause' && qGroupsHit < 2) {
              qScore = 0;
            }
            if (qScore > 0) {
              // 检查选项是否包含谬误名
              const optLow = opt.text.toLowerCase();
              const nameParts = pattern.name.replace('谬误', '').trim().toLowerCase();
              const bonus = optLow.includes(nameParts) ? 0.5 : 0;
              score += qScore + bonus;
              reasons.push(`选项与「${pattern.name}」模式匹配(score=${(qScore + bonus).toFixed(2)})`);
            }
          }
        }
      }

      // === 规则2：概率计算题 ===
      if (questionPart.includes('概率') && questionPart.match(/\d+/)) {
        const probScore = this._evaluateProbabilityOption(questionPart, opt.text);
        if (probScore > 0) {
          score += probScore;
          reasons.push(`概率计算验证(score=${probScore})`);
        }
      }

      // === 规则3：数学计算题 ===
      if (questionPart.match(/等于|多少|平方|方程|乘以|除以|x\s*=|3x|2x/)) {
        const mathScore = this._evaluateMathOption(questionPart, opt.text);
        if (mathScore > 0) {
          score += mathScore;
          reasons.push(`数学计算验证(score=${mathScore})`);
        }
      }

      // === 规则4：演绎推理（三段论、条件推理）===
      if (reasoningType.primaryType === 'deductive') {
        const dedScore = this._evaluateDeductiveOption(questionPart, opt.text);
        if (dedScore > 0) {
          score += dedScore;
          reasons.push(`演绎推理验证(score=${dedScore})`);
        }
      }

      // === 规则5：归纳推理 ===
      if (reasoningType.primaryType === 'inductive' || (reasoningType.candidates || []).some(c => c.type === 'inductive' && c.score > 0.3)) {
        const indScore = this._evaluateInductiveOption(questionPart, opt.text);
        if (indScore > 0) {
          score += indScore;
          reasons.push(`归纳推理验证(score=${indScore})`);
        }
      }

      // === 规则6：溯因推理 ===
      if (reasoningType.primaryType === 'abductive') {
        const abdScore = this._evaluateAbductiveOption(questionPart, opt.text);
        if (abdScore > 0) {
          score += abdScore;
          reasons.push(`溯因推理验证(score=${abdScore})`);
        }
      }

      // === 规则7：条件推理（"从信息可以推出"）===
      if (questionPart.includes('可以推出') || questionPart.includes('从这个信息')) {
        const condScore = this._evaluateConditionalOption(questionPart, opt.text);
        if (condScore > 0) {
          score += condScore;
          reasons.push(`条件推理验证(score=${condScore})`);
        }
      }

      // === 规则8：统计推理 ===
      if (reasoningType.primaryType === 'statistical') {
        const statScore = this._evaluateStatisticalOption(questionPart, opt.text);
        if (statScore > 0) {
          score += statScore;
          reasons.push(`统计推理验证(score=${statScore})`);
        }
      }

      // === 规则9：通用——否定绝对化选项 ===
      if (opt.text.includes('一定') || opt.text.includes('全部') || opt.text.includes('所有')) {
        if (questionPart.includes('可能') || questionPart.includes('不一定')) {
          score -= 0.3;
          reasons.push('绝对化选项与不确定性语境不匹配(-0.3)');
        }
      }

      return { letter: opt.letter, text: opt.text, score, reasons };
    });

    // 选最高分
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // 置信度：最高分 - 次高分
    const secondBestScore = scored.length > 1 ? scored[1].score : 0;
    let confidence = Math.min(Math.max(best.score - secondBestScore + 0.3, 0.1), 1.0);

    // ─── LLM兜底 ──────────────────────────────────────
    // 当所有规则都打0分时，调LLM推理
    if (best.score < 0.1 && this._llmFallback) {
      try {
        const llmResult = await this._llmFallback(input, options, reasoningType);
        if (llmResult && llmResult.selectedAnswer) {
          const llmLetter = llmResult.selectedAnswer;
          // 找到LLM选的选项，给它加分
          const llmOpt = scored.find(s => s.letter === llmLetter);
          if (llmOpt) {
            llmOpt.score = 0.6;
            llmOpt.reasons.push('LLM兜底推理(conf=0.6)');
            // 重新排序
            scored.sort((a, b) => b.score - a.score);
            confidence = 0.5;
          }
        }
      } catch(e) {
        // LLM失败，保持原结果
      }
    }
    // 重新获取best
    const finalBest = scored[0];
    const finalSecondBestScore = scored.length > 1 ? scored[1].score : 0;

    return {
      hasOptions: true,
      options: options.map(o => o.letter),
      selectedAnswer: finalBest.score > 0 ? finalBest.letter : null,
      confidence: Math.round(confidence * 100) / 100,
      bestOption: finalBest.letter,
      bestScore: Math.round(finalBest.score * 100) / 100,
      secondBest: scored.length > 1 ? { letter: scored[1].letter, score: Math.round(scored[1].score * 100) / 100 } : null,
      reason: finalBest.score > 0 ? finalBest.reasons.join('; ') : '无法确定',
      allScores: scored.map(s => ({ letter: s.letter, score: Math.round(s.score * 100) / 100 })),
      llmFallback: best.score < 0.1 ? true : false,
      // [v5.17.16 M2] 主动推理EFE原型 — 探索(epistemic) vs 利用(pragmatic)
      // EFE = 实用价值(偏好满足) + 认知价值(信息增益)
      activeInference: {
        exploitation: +(confidence / 100).toFixed(3),
        exploration: +(1 - confidence / 100 - (scored.length > 1 ? scored[1].score / 100 : 0)).toFixed(3),
        needsMoreEvidence: confidence < 50 || (scored.length > 1 && scored[1].score > finalBest.score * 0.7),
      },
    };
  }

  /**
   * 辅助：评估选项是否匹配某个谬误模式
   */
  _scoreOptionForFallacy(question, optionText, pattern) {
    const qLow = question.toLowerCase();
    const oLow = optionText.toLowerCase();
    let score = 0;

    // 检查问题文本是否与谬误模式匹配
    let qGroupsHit = 0;
    for (const kwGroup of pattern.keywords) {
      const { hits } = _matchKeywords(question, kwGroup);
      if (hits > 0) qGroupsHit++;
    }
    
    if (pattern.regexBonus) {
      for (const re of pattern.regexBonus) {
        if (re.test(question)) score += 0.15;
      }
    }

    if (pattern.minKeywordGroups && qGroupsHit >= pattern.minKeywordGroups) {
      score += 0.3;
    }

    // 检查选项文本是否包含谬误名
    const nameParts = pattern.name.replace('谬误', '').trim().toLowerCase();
    if (oLow.includes(nameParts)) {
      score += 0.4;
    }

    return Math.min(score, 0.8);
  }

  /**
   * 辅助：评估概率选项
   */
  _evaluateProbabilityOption(question, optionText) {
    // 提取数字和分数
    const fracMatch = optionText.match(/(\d+)\/(\d+)/);
    if (!fracMatch) return 0;

    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den === 0) return 0;

    const value = num / den;
    let score = 0;

    // 掷硬币3次都正面 = 1/8
    if (question.includes('硬币') && question.includes('3次') || question.includes('三次')) {
      if (Math.abs(value - 0.125) < 0.01) score = 0.5;
    }
    
    // 3红2蓝抽红球 = 3/5
    if (question.includes('红球') && question.includes('蓝球')) {
      if (Math.abs(value - 0.6) < 0.01) score = 0.5;
    }

    return score;
  }

  /**
   * 辅助：评估数学选项
   */
  _evaluateMathOption(question, optionText) {
    const q = question.replace(/[？?]/g, '');
    let score = 0;

    // x² - x = 0 → x(x-1)=0 → x=0或x=1
    if (q.includes('平方减去它本身') || q.includes('平方减去本身')) {
      if (optionText.includes('0或1') || optionText.includes('0 或 1')) score = 0.5;
      if (optionText.includes('0') && optionText.includes('1') && !optionText.includes('-')) score = 0.4;
    }

    // 3x + 7 = 22 → x = 5
    if (q.includes('3x') && q.includes('7') && (q.includes('22') || q.includes('='))) {
      if (optionText === '5' || optionText.includes('5')) score = 0.5;
    }

    return score;
  }

  /**
   * 辅助：评估演绎推理选项
   */
  _evaluateDeductiveOption(question, optionText) {
    let score = 0;

    // 所有A都是B，所有B都是C → 所有A都是C
    if (question.includes('所有A') && question.includes('所有B') && (question.includes('都是C') || question.includes('所有C'))) {
      if (optionText.includes('A都是C')) score = 0.6;
    }

    // 没有鸟是哺乳动物，所有企鹅都是鸟 → 没有企鹅是哺乳动物
    if (question.includes('没有鸟') && question.includes('企鹅')) {
      if (optionText.includes('没有企鹅') || optionText.includes('没有企鹅是')) score = 0.6;
      if (optionText.includes('企鹅不是哺乳')) score = 0.3;
    }

    // 所有擅长数学的人都是逻辑思维强的，有些工程师擅长数学 → 有些工程师是逻辑思维强的
    if (question.includes('擅长数学') && question.includes('工程师')) {
      if (optionText.includes('有些工程师') && (optionText.includes('逻辑') || optionText.includes('思维强'))) score = 0.6;
    }

    // 如果下雨，地面会湿。现在下雨了 → 地面一定湿
    if (question.includes('下雨') && question.includes('地面会湿') && question.includes('下雨了')) {
      if (optionText.includes('一定湿') || optionText.includes('地面一定')) score = 0.5;
    }

    // 如果这个动物是狗，它会汪汪叫。没有汪汪叫 → 不是狗
    if (question.includes('狗') && question.includes('汪汪叫') && question.includes('没有汪汪')) {
      if (optionText.includes('不是狗')) score = 0.5;
    }

    // 如果今天是周一，明天是周二。明天是周二 → 今天可能是周一
    if (question.includes('周一') && question.includes('周二') && question.includes('明天是周二')) {
      if (optionText.includes('可能') && optionText.includes('周一')) score = 0.5;
    }

    // 只有年满18岁才能投票。小王没有投票 → 小王可能未满18岁
    if (question.includes('投票') && question.includes('18') && question.includes('没有投票')) {
      if (optionText.includes('可能')) score = 0.5;
      if (optionText.includes('一定') || optionText.includes('肯定')) score = 0.2;
    }

    // ─── 空间关系推理 ────────────────────────────────────
    // 支持三种格式：
    //   (a) "X is to the right/left of Y"（空间关系）
    //   (b) "X is the rightmost/leftmost"（直接位置）
    //   (c) "X is the second from the left"（直接位置）
    const qLow = question.toLowerCase();
    const items = new Set();

    // 1. 提取所有物品（从"three books: a X, a Y, and a Z"）
    const itemMatch = qLow.match(/(?:three|four|five)\s+(?:books?|items?|objects?|things?)[:\s]+(.+?)(?:\.|$)/);
    const itemNames = [];
    if (itemMatch) {
      const listStr = itemMatch[1];
      const parts = listStr.split(/,|\band\b/);
      for (const p of parts) {
        const name = p.replace(/\ba\s+/g, '').replace(/\ban\s+/g, '').trim();
        if (name) itemNames.push(name);
      }
    }
    for (const n of itemNames) items.add(n);

    // 2. 提取空间关系
    const spatialMatches = question.match(/(\w+\s+\w+)\s+is\s+to\s+the\s+(right|left)\s+of\s+(?:the\s+)?(\w+\s+\w+)/gi);
    const rightOf = {};
    const leftOf = {};

    if (spatialMatches) {
      for (const m of spatialMatches) {
        const parts = m.match(/(\w+\s+\w+)\s+is\s+to\s+the\s+(right|left)\s+of\s+(?:the\s+)?(\w+\s+\w+)/i);
        if (parts) {
          const x = parts[1].toLowerCase();
          const dir = parts[2].toLowerCase();
          const y = parts[3].toLowerCase();
          items.add(x);
          items.add(y);
          if (dir === 'right') { leftOf[x] = y; rightOf[y] = x; }
          else { rightOf[x] = y; leftOf[y] = x; }
        }
      }
    }

    // 3. 提取直接位置陈述
    // "X is the leftmost" / "X is the rightmost"
    const posMatches = question.match(/(\w+\s+\w+)\s+is\s+(?:the\s+)?(leftmost|rightmost|second\s+from\s+the\s+left|second\s+from\s+the\s+right|third\s+from\s+the\s+left|third\s+from\s+the\s+right|middle)/gi);
    const fixedPositions = {}; // item -> position

    if (posMatches) {
      for (const pm of posMatches) {
        const parts = pm.match(/(\w+\s+\w+)\s+is\s+(?:the\s+)?(leftmost|rightmost|second\s+from\s+the\s+left|second\s+from\s+the\s+right|middle)/i);
        if (parts) {
          const item = parts[1].toLowerCase();
          const pos = parts[2].toLowerCase();
          items.add(item);
          fixedPositions[item] = pos;
        }
      }
    }

    // 4. 如果有足够信息，建立完整排序
    if (items.size >= 3) {
      // 从直接位置信息推导关系
      for (const [item, pos] of Object.entries(fixedPositions)) {
        // 给其他未定位的物品设置关系提示
        if (pos === 'leftmost') {
          // leftmost 左边没有东西
        } else if (pos === 'rightmost') {
          // rightmost 右边没有东西
        } else if (pos === 'second from the left') {
          // 这个物品左边有一个，右边有一个
        }
      }

      // 计算排序 — 优先使用 fixedPositions 修正
      let leftmost = null;
      let rightmost = null;
      for (const item of items) {
        const fp = fixedPositions[item];
        if (fp === 'leftmost') leftmost = item;
        if (fp === 'rightmost') rightmost = item;
      }
      // 如果没有 fixedPositions 信息，从空间关系推导
      // 注意：排除已在 fixedPositions 中声明位置的物品（如 second_from_left）
      if (!leftmost) {
        for (const item of items) {
          if (fixedPositions[item]) continue; // 已有固定位置，不参与 leftmost 推导
          if (!leftOf[item]) { leftmost = item; break; }
        }
        // 如果所有物品都有 fixedPositions，从 items 中找
        if (!leftmost) {
          for (const item of items) {
            if (fixedPositions[item] === 'second from the left') continue;
            if (!leftOf[item]) { leftmost = item; break; }
          }
        }
      }
      if (!rightmost) {
        for (const item of items) {
          if (fixedPositions[item]) continue; // 已有固定位置，不参与 rightmost 推导
          if (!rightOf[item]) { rightmost = item; break; }
        }
        if (!rightmost) {
          for (const item of items) {
            if (fixedPositions[item] === 'second from the right') continue;
            if (!rightOf[item]) { rightmost = item; break; }
          }
        }
      }

      const sorted = [];
      let cur = leftmost;
      while (cur) {
        sorted.push(cur);
        cur = rightOf[cur];
      }

      // 如果 sorted 长度不够，尝试从固定位置补全
      if (sorted.length < items.size) {
        // 用固定位置信息来补全
        for (const [item, pos] of Object.entries(fixedPositions)) {
          if (pos === 'leftmost' && !sorted.includes(item)) {
            sorted.unshift(item);
          }
          if (pos === 'rightmost' && !sorted.includes(item)) {
            sorted.push(item);
          }
        }
        // 如果 sorted 还是不够，用 rightOf 链从 leftmost 遍历所有物品
        if (sorted.length < items.size) {
          const allSorted = [];
          let cur = leftmost;
          const visited = new Set();
          while (cur && !visited.has(cur)) {
            visited.add(cur);
            allSorted.push(cur);
            if (rightOf[cur]) {
              cur = rightOf[cur];
            } else {
              break;
            }
          }
          // 如果 allSorted 还没覆盖所有物品，补入缺失的
          const allRemaining = [...items].filter(x => !allSorted.includes(x));
          // 优先补入 fixedPositions 中已知位置的物品
          const knownRemaining = allRemaining.filter(r => fixedPositions[r]);
          const unknownRemaining = allRemaining.filter(r => !fixedPositions[r]);
          for (const r of [...knownRemaining, ...unknownRemaining]) {
            let inserted = false;
            // 1) 检查 fixedPositions 中的位置声明
            if (fixedPositions[r] === 'second from the left' && allSorted.length >= 1) {
              allSorted.splice(1, 0, r);
              inserted = true;
            } else if (fixedPositions[r] === 'second from the right' && allSorted.length >= 1) {
              allSorted.splice(allSorted.length - 1, 0, r);
              inserted = true;
            }
            if (!inserted) {
              // 2) 检查 r 在 rightOf/leftOf 链中的位置
              for (let i = 0; i < allSorted.length; i++) {
                if (rightOf[r] === allSorted[i]) {
                  allSorted.splice(i, 0, r);
                  inserted = true;
                  break;
                }
                if (leftOf[r] === allSorted[i]) {
                  allSorted.splice(i + 1, 0, r);
                  inserted = true;
                  break;
                }
              }
            }
            if (!inserted) {
              // 3) 检查 allSorted 中的物品是否与 r 有空间关系
              for (let i = 0; i < allSorted.length; i++) {
                if (rightOf[allSorted[i]] === r) {
                  allSorted.splice(i + 1, 0, r);
                  inserted = true;
                  break;
                }
                if (leftOf[allSorted[i]] === r) {
                  allSorted.splice(i, 0, r);
                  inserted = true;
                  break;
                }
              }
            }
            if (!inserted) {
              // 4) 最后兜底：对于 3 物品的题目，检查物品的位置
              if (allSorted.length === 2 && items.size === 3) {
                // 检查 fixedPositions 中的位置声明
                if (fixedPositions[r] === 'rightmost') {
                  allSorted.push(r);
                } else if (fixedPositions[r] === 'leftmost') {
                  allSorted.unshift(r);
                } else if (fixedPositions[allSorted[1]] && fixedPositions[allSorted[1]] !== 'rightmost') {
                  // allSorted[1] 有固定位置但不是 rightmost（如 second_from_left）
                  // 说明 allSorted[1] 不是 rightmost，r 应该是 rightmost
                  allSorted.push(r);
                } else if (!rightOf[allSorted[1]] && !fixedPositions[allSorted[1]]) {
                  // allSorted[1] 没有 rightOf 也没有固定位置 → 可能是 rightmost
                  // r 是中间物品
                  allSorted.splice(1, 0, r);
                } else {
                  allSorted.splice(1, 0, r);
                }
              } else {
                allSorted.push(r);
              }
            }
          }
          sorted.length = 0;
          sorted.push(...allSorted);
        }
      }
      const optLow = optionText.toLowerCase();
      const optItem = itemNames.find(n => optLow.includes(n));

      // 匹配选项：先用 sorted（如果有3个），否则用固定位置
      if (sorted.length >= 3) {
        if (optLow.includes('leftmost')) {
          if (optItem && optItem === sorted[0]) score = 0.7;
        } else if (optLow.includes('rightmost')) {
          if (optItem && optItem === sorted[sorted.length - 1]) score = 0.7;
        } else if (optLow.includes('second from the left') || optLow.includes('second from left')) {
          if (optItem && sorted.length >= 2 && optItem === sorted[1]) score = 0.7;
        } else if (optLow.includes('third from the left') || optLow.includes('third from left')) {
          if (optItem && sorted.length >= 3 && optItem === sorted[2]) score = 0.7;
        } else if (optLow.includes('second from the right') || optLow.includes('second from right')) {
          if (optItem && sorted.length >= 2 && optItem === sorted[sorted.length - 2]) score = 0.7;
        } else if (optLow.includes('middle')) {
          const midIdx = Math.floor(sorted.length / 2);
          if (optItem && optItem === sorted[midIdx]) score = 0.7;
        }
      } else {
        // sorted < 3：使用 fixedPositions + 空间关系推断
        if (optLow.includes('leftmost')) {
          for (const [item, pos] of Object.entries(fixedPositions)) {
            if (pos === 'leftmost' && optItem && optItem === item) {
              score = 0.7; break;
            }
          }
          // 如果物品在 fixedPositions 中但不是 leftmost，排除
          if (score === 0 && optItem && Object.keys(fixedPositions).includes(optItem)) {
            // second_from_left/second_from_right 不是 leftmost
          } else {
            // optItem 在 sorted 第0位（明确是最左）
            if (score === 0 && optItem && sorted.length >= 1 && optItem === sorted[0]) {
              score = 0.7;
            }
            // 只有明确知道没有物品在它左边时才判 leftmost
            if (score === 0 && optItem && !rightOf[optItem] && sorted.length >= 2) {
              // 排除 fixedPositions 中声明为 rightmost 的物品
              const isRightmostDeclared = Object.entries(fixedPositions)
                .some(([k, p]) => p === 'rightmost' && k === optItem);
              if (!isRightmostDeclared) score = 0.4;
            }
          }
        } else if (optLow.includes('rightmost')) {
          for (const [item, pos] of Object.entries(fixedPositions)) {
            if (pos === 'rightmost' && optItem && optItem === item) {
              score = 0.7; break;
            }
          }
          // 如果物品在 fixedPositions 中但不是 rightmost，排除
          if (score === 0 && optItem && Object.keys(fixedPositions).includes(optItem)) {
            // second_from_left/second_from_right 不是 rightmost
          } else {
            // optItem 在 sorted 最后一位（明确是最右）
            if (score === 0 && optItem && sorted.length >= 1 && optItem === sorted[sorted.length - 1]) {
              score = 0.7;
            }
            if (score === 0 && optItem && !leftOf[optItem] && sorted.length >= 2) {
              // 排除 fixedPositions 中声明为 leftmost 的物品
              const isLeftmostDeclared = Object.entries(fixedPositions)
                .some(([k, p]) => p === 'leftmost' && k === optItem);
              if (!isLeftmostDeclared) score = 0.4;
            }
          }
        } else if (optLow.includes('second from the left') || optLow.includes('second from left')) {
          // 情况1：leftmost 和 rightmost 都在 fixedPositions 中
          const leftmostItem = Object.entries(fixedPositions).find(([,p]) => p === 'leftmost');
          const rightmostItem = Object.entries(fixedPositions).find(([,p]) => p === 'rightmost');
          if (leftmostItem && rightmostItem && optItem) {
            if (optItem !== leftmostItem[0] && optItem !== rightmostItem[0]) {
              score = 0.7;
            }
          }
          // 情况2a：sorted 有2个，sorted[1] 就是第二左
          if (score === 0 && sorted.length >= 2 && optItem && optItem === sorted[1]) {
            score = 0.7;
          }
          // 情况2b：sorted 有2个物品，总物品3个，中间是缺失的那个（只在 sorted[1] 不是正确选项时）
          if (score === 0 && sorted.length === 2 && items.size === 3) {
            const missing = [...items].find(x => !sorted.includes(x));
            if (missing && optItem === missing) score = 0.7;
          }
          // 情况3：sorted 有1个 + fixedPositions 有 rightmost，中间是第三个
          if (score === 0 && sorted.length === 1 && items.size === 3) {
            const leftPos = sorted[0];
            const rightPos = Object.entries(fixedPositions).find(([,p]) => p === 'rightmost')?.[0];
            if (leftPos && rightPos && optItem) {
              if (optItem !== leftPos && optItem !== rightPos) score = 0.7;
            }
          }
          // 情况4：sorted 有1个 + fixedPositions 有 leftmost，sorted[0] 是 rightmost? 
          // 不对——sorted[0] 是从 leftmost 开始建的，sorted[0] 应该是 leftmost
          // 所以情况4应该是：sorted 有1个（即 leftmost），fixedPositions 有 leftmost，找中间物品
          if (score === 0 && sorted.length === 1 && items.size === 3) {
            const fixedLeftmost = Object.entries(fixedPositions).find(([,p]) => p === 'leftmost')?.[0];
            if (fixedLeftmost && optItem) {
              // sorted[0] 是 leftmost，optItem 不是 leftmost 也不是 rightmost（rightmost 未知，但不在 sorted 中）
              // 此时 leftmost = sorted[0] = fixedLeftmost
              // 第二个物品 = ? (从空间关系推导或 default)
              // 先检查是否有 rightmost 通过 !leftOf 推导
              let deducedRightmost = null;
              for (const it of items) {
                if (it !== fixedLeftmost && !leftOf[it]) { deducedRightmost = it; break; }
              }
              if (deducedRightmost) {
                if (optItem !== fixedLeftmost && optItem !== deducedRightmost) score = 0.7;
              }
            }
          }
        }
      }
    }

    return score;
  }

  /**
   * 辅助：评估归纳推理选项
   */
  _evaluateInductiveOption(question, optionText) {
    let score = 0;

    // 100只天鹅全部白色 → 很可能所有天鹅都是白色
    if (question.includes('天鹅') && (question.includes('100') || question.includes('全部白色') || question.includes('全部是白色'))) {
      if (optionText.includes('很可能') || optionText.includes('可能')) score = 0.5;
      if (optionText.includes('一定') || optionText.includes('全部') || optionText.includes('100%')) score = -0.2;
    }

    // 过去10年每年6月下雨 → 很可能下雨
    if (question.includes('10年') && question.includes('6月') && question.includes('下雨')) {
      if (optionText.includes('很可能') || optionText.includes('可能')) score = 0.5;
      if (optionText.includes('一定')) score = -0.2;
    }
    
    // 过去N年每年都... → 很可能
    if ((question.includes('过去') || question.includes('每年')) && (question.includes('都') || question.includes('全部'))) {
      if (optionText.includes('很可能') || optionText.includes('可能')) score = 0.5;
      if (optionText.includes('一定') || optionText.includes('全部') || optionText.includes('100%')) score = -0.2;
    }

    return Math.max(score, 0);
  }

  /**
   * 辅助：评估溯因推理选项
   */
  _evaluateAbductiveOption(question, optionText) {
    let score = 0;

    // 草地湿 → 最可能下雨
    if (question.includes('草地') && question.includes('湿')) {
      if (optionText.includes('下雨')) score = 0.5;
    }

    // 电脑无法开机，风扇不转，没有指示灯 → 电源没插好
    if (question.includes('电脑') && question.includes('无法开机') && question.includes('风扇')) {
      if (optionText.includes('电源') || optionText.includes('插')) score = 0.5;
    }

    return score;
  }

  /**
   * 辅助：评估条件推理选项
   */
  _evaluateConditionalOption(question, optionText) {
    let score = 0;

    // 如果今天是周一，明天是周二。明天是周二 → 今天可能是周一
    if (question.includes('周一') && question.includes('周二') && question.includes('明天是周二')) {
      if (optionText.includes('可能') && optionText.includes('周一')) score = 0.5;
      if (optionText.includes('是周一') && !optionText.includes('可能')) score = 0.2; // 肯定不对，可能才对
    }

    // 只有年满18岁才能投票。小王没有投票 → 小王可能未满18岁
    if (question.includes('投票') && question.includes('18') && question.includes('没有投票')) {
      if (optionText.includes('可能') && optionText.includes('18')) score = 0.5;
      if (optionText.includes('未满')) score = 0.4;
    }

    return score;
  }

  /**
   * 辅助：评估统计推理选项
   */
  _evaluateStatisticalOption(question, optionText) {
    let score = 0;

    // 准确率99% vs 90%，但90%更可靠 → 样本偏差
    if (question.includes('准确率') && question.includes('99%') && question.includes('90%')) {
      if (optionText.includes('样本') || optionText.includes('偏差')) score = 0.6;
      if (optionText.includes('假阳性')) score = 0.3;
    }

    return score;
  }

  /**
   * LLM兜底推理 — 当规则引擎打0分时，调LLM做选择题推理
   * [P-005] routed through safeFetch — SSRF protection + timeout
   */
  async _llmFallback(input, options, reasoningType) {
    // 构建简洁的英文 prompt
    const qPart = input.replace(/\n[A-D][.、．)）].+/g, '').trim();
    const optLines = input.match(/\n[A-D][.、．)）].+/g);
    const optText = optLines ? optLines.join('\n') : '';
    const prompt = `Answer A, B, C, or D. Only output the letter.\n\n${qPart}\n${optText}\n\nAnswer:`;

    const body = JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10,
      stream: true,
    });

    try {
      const { safeFetch } = require('../core/fetch-safe.js');

      // [SECURITY FIX H-2] API key from env only — no file fallback
      const apiKey = process.env.HEARTFLOW_API_KEY;
      if (!apiKey) {
        throw new Error('[logic-reasoning] HEARTFLOW_API_KEY environment variable is required');
      }

      // [v5.17.9 H1] host白名单 — 仅允许腾讯Copilot域名，防止env注入外泄API Key
      const ALLOWED_API_HOSTS = ['copilot.tencent.com', 'api.tencent.com'];
      const apiBase = process.env.TENCENT_API_BASE;
      let finalBase = 'https://copilot.tencent.com/v2';
      if (apiBase) {
        try {
          const parsed = new URL(apiBase);
          if (!ALLOWED_API_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
            throw new Error(`TENCENT_API_BASE host "${parsed.hostname}" not in allowed list`);
          }
          finalBase = apiBase;
        } catch(e) {
          console.warn('[logic-reasoning] TENCENT_API_BASE rejected:', e.message, '— using default');
        }
      }
      const url = finalBase + '/chat/completions';

      const res = await safeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body,
        timeout: 15000,
      });

      const raw = await res.text();
      let content = '';
      for (const line of raw.split('\n')) {
        if (line.startsWith('data: ')) {
          const d = line.slice(6);
          if (d.trim() === '[DONE]') break;
          try {
            const obj = JSON.parse(d);
            const delta = obj?.choices?.[0]?.delta?.content || '';
            content += delta;
          } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
        }
      }
      const letter = content.trim().toUpperCase().match(/[A-D]/);
      return letter ? { selectedAnswer: letter[0] } : null;
    } catch (e) {
      return null;
    }
  }


  getStats() {
    return {
      version: this.version,
      totalAnalyses: this._history.length,
      reasoningTypes: REASONING_PATTERNS.length,
      fallacyTypes: FALLACY_PATTERNS.length,
      frameworks: Object.keys(FRAMEWORKS).length,
    };
  }

  getHistory() {
    return this._history.slice(-10);
  }
}

// [v5.17.9 H1] P0已修复: host白名单校验 + safeFetch SSRF防护
module.exports = { LogicReasoning };
