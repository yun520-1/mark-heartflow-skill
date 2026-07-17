/**
 * DebateAnalyzer v1.0 — 三节结构分析器
 *
 * 对输入文本进行「对话式反驳」的三维分析：
 *   ✅ 对的（核心骨架）— 用户说对了什么
 *   ❌ 不对/需要反驳的 — 用户搞错了什么
 *   💡 最值得注意的 — 最深刻的洞见/矛盾
 *
 * 并发执行三路分析，返回结构化结果。
 * 集成到 HeartFlow 引擎，通过 dispatch('debate.analyze', input) 调用。
 */

class DebateAnalyzer {
  constructor(hf) {
    this.hf = hf;
  }

  /**
   * 主入口：三路并发分析
   * @param {string} input — 用户输入文本
   * @returns {object} { agreements, disagreements, insight, summary }
   */
  async analyze(input) {
    if (!input || typeof input !== 'string') {
      return { error: 'input 为必填参数', input };
    }

    const startTime = Date.now();

    // 三路并发分析
    const [agreements, disagreements, insight] = await Promise.all([
      this._findAgreements(input),
      this._findDisagreements(input),
      this._findDeepestInsight(input),
    ]);

    // 综合摘要
    const summary = this._buildSummary(agreements, disagreements, insight);

    return {
      input,
      agreements: {
        items: agreements,
        count: agreements.length,
        summary: this._summarizeSection(agreements, 'agreement'),
      },
      disagreements: {
        items: disagreements,
        count: disagreements.length,
        summary: this._summarizeSection(disagreements, 'disagreement'),
      },
      insight: {
        items: insight,
        deepest: insight[0] || null,
        summary: this._summarizeSection(insight, 'insight'),
      },
      summary,
      meta: {
        duration: Date.now() - startTime,
        version: '1.0',
        timestamp: startTime,
      },
    };
  }

  // ═══════════════════════════════════════════════
  // 第一节：✅ 对的 — 用户说对了什么
  // ═══════════════════════════════════════════════

  async _findAgreements(input) {
    const agreements = [];

    // 1.1 检测核心主张
    const coreClaims = this._extractCoreClaims(input);
    for (const claim of coreClaims) {
      const result = await this._verifyClaim(claim.text, claim.confidence);
      if (result.verdict === 'supported' && result.confidence > 0.5) {
        agreements.push({
          claim: claim.text,
          verdict: 'supported',
          confidence: result.confidence,
          evidence: result.evidence || '框架内自洽',
          type: claim.type,
        });
      }
    }

    // 1.2 检测事实正确的断言
    const facts = this._extractFactualAssertions(input);
    for (const fact of facts) {
      const truthResult = await this._checkTruth(fact);
      if (truthResult === 'true' || truthResult === 'likely_true') {
        // 去重
        if (!agreements.some(a => a.claim.includes(fact.slice(0, 20)))) {
          agreements.push({
            claim: fact,
            verdict: 'true',
            confidence: 0.85,
            evidence: '事实核查通过',
            type: 'fact',
          });
        }
      }
    }

    // 1.3 检测核心叙事框架 — 用户对整体敘事结构是否合理
    const narrative = this._assessNarrativeCoherence(input);
    if (narrative.coherent && narrative.strength > 0.6) {
      agreements.push({
        claim: narrative.framework,
        verdict: 'supported',
        confidence: narrative.strength,
        evidence: '叙事结构自洽',
        type: 'narrative_framework',
      });
    }

    // 按置信度降序排列
    return agreements.sort((a, b) => b.confidence - a.confidence);
  }

  // ═══════════════════════════════════════════════
  // 第二节：❌ 不对/需要反驳的 — 用户搞错了什么
  // ═══════════════════════════════════════════════

  async _findDisagreements(input) {
    const disagreements = [];

    // 2.1 检测事实错误
    const factErrors = await this._detectFactualErrors(input);
    for (const err of factErrors) {
      disagreements.push({
        claim: err.claim,
        correction: err.correction,
        severity: err.severity || 3,
        confidence: err.confidence || 0.8,
        evidence: err.evidence || '事实核查',
        type: 'factual_error',
      });
    }

    // 2.2 检测绝对化表述（常有反例）
    const absolutes = this._detectAbsoluteStatements(input);
    for (const abs of absolutes) {
      disagreements.push({
        claim: abs.phrase,
        correction: abs.correction,
        severity: 2,
        confidence: 0.7,
        evidence: '绝对化表述，实际存在例外',
        type: 'overgeneralization',
      });
    }

    // 2.3 检测逻辑矛盾
    const contradictions = this._detectLogicalContradictions(input);
    for (const c of contradictions) {
      disagreements.push({
        claim: c.statement,
        correction: c.correction,
        severity: 4,
        confidence: 0.85,
        evidence: `内部矛盾：${c.clash}`,
        type: 'self_contradiction',
      });
    }

    // 2.4 检测片面归因
    const attributions = this._detectMisattribution(input);
    for (const attr of attributions) {
      disagreements.push({
        claim: attr.claim,
        correction: attr.correction,
        severity: 3,
        confidence: 0.75,
        evidence: '片面归因，忽略多因素',
        type: 'misattribution',
      });
    }

    // 2.5 检测措辞偏激/缺乏证据
    const unsupported = this._detectUnsupportedClaims(input);
    for (const uc of unsupported) {
      disagreements.push({
        claim: uc.claim,
        correction: `缺乏支持证据的断言，建议审慎`,
        severity: 2,
        confidence: 0.6,
        evidence: '断言强度超过证据支持度',
        type: 'unsupported_claim',
      });
    }

    // 按严重度降序排列
    return disagreements.sort((a, b) => b.severity - a.severity);
  }

  // ═══════════════════════════════════════════════
  // 第三节：💡 最值得注意的 — 最深刻的洞见
  // ═══════════════════════════════════════════════

  async _findDeepestInsight(input) {
    const insights = [];

    // 3.1 检测用户视角的盲区 — 看到了什么但漏掉了什么
    const blindSpots = this._detectBlindSpots(input);
    for (const bs of blindSpots) {
      insights.push({
        type: 'blind_spot',
        observation: bs.observation,
        significance: bs.significance || 4,
        reframing: bs.reframing,
      });
    }

    // 3.2 检测"慢过程被说成急性事件"类模式
    const temporalFallacy = this._detectTemporalFallacy(input);
    if (temporalFallacy.detected) {
      insights.push({
        type: 'temporal_fallacy',
        observation: temporalFallacy.observation,
        significance: 5,
        reframing: temporalFallacy.reframing,
      });
    }

    // 3.3 检测核心张力/矛盾 — 用户叙事中最根本的张力
    const coreTension = this._detectCoreTension(input);
    if (coreTension.detected) {
      insights.push({
        type: 'core_tension',
        observation: coreTension.observation,
        significance: 5,
        reframing: coreTension.reframing,
      });
    }

    // 3.4 检测未被言明的假设
    const hiddenAssumptions = this._detectHiddenAssumptions(input);
    for (const ha of hiddenAssumptions) {
      insights.push({
        type: 'hidden_assumption',
        observation: ha.observation,
        significance: ha.significance || 3,
        reframing: ha.reframing,
      });
    }

    // 按重要性降序排列
    return insights.sort((a, b) => b.significance - a.significance);
  }

  // ═══════════════════════════════════════════════
  // 辅助方法：事实核查 + 引擎集成
  // ═══════════════════════════════════════════════

  /**
   * 提取核心主张
   */
  _extractCoreClaims(input) {
    const claims = [];
    const lines = input.split(/[。！？\n]/).filter(Boolean);

    // 找因果推理句
    const causalPatterns = [
      /因为.*所以|因此|于是|导致|使得|从而/,
      /之所以.*是因为|源于|归根|取决于/,
      /只要.*就|如果.*那么|不.*不/,
    ];

    for (const line of lines) {
      // 跳过太短的句子
      if (line.length < 10) continue;

      // 检测因果推理
      for (const pat of causalPatterns) {
        if (pat.test(line)) {
          claims.push({ text: line.trim(), confidence: 0.7, type: 'causal_claim' });
          break;
        }
      }

      // 检测价值判断
      if (/是.*的|应该|必须|需要|注定|才叫/.test(line) && line.length > 15) {
        claims.push({ text: line.trim(), confidence: 0.6, type: 'value_judgment' });
      }

      // 检测"我告诉你"类断言
      if (/我告诉|事实是|说白了|说白了就是|关键在/.test(line)) {
        claims.push({ text: line.trim(), confidence: 0.75, type: 'assertion' });
      }
    }

    // 去重（按前20字符）
    const seen = new Set();
    return claims.filter(c => {
      const key = c.text.slice(0, 20);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10); // 最多取10个
  }

  /**
   * 提取事实性断言（含数字/比例/具体事件描述）
   */
  _extractFactualAssertions(input) {
    const assertions = [];
    const lines = input.split(/[。！？；\n]/).filter(Boolean);

    for (const line of lines) {
      // 含具体数字的叙述
      if (/\d{1,3}(%|亿|万|千|百|美元|人民币)|比例|占比|排名|第[一二三四五六七八九十]/.test(line)) {
        assertions.push(line.trim());
        continue;
      }
      // 含具体时间/地点的叙述
      if (/\d{4}年|上个月|去年|前年|今年|美国|中国|俄罗斯|欧盟/.test(line) && line.length > 20) {
        assertions.push(line.trim());
        continue;
      }
      // "是...的"事实陈述
      if (/^[^？|?]+是[^？|?]+的/.test(line.trim()) && line.length > 15 && line.length < 100) {
        assertions.push(line.trim());
      }
    }
    return assertions.slice(0, 10);
  }

  /**
   * 调用引擎 truth 模块核查事实
   */
  async _checkTruth(statement) {
    try {
      const result = this.hf.dispatch('truth.checkStatement', statement);
      if (result && result.verdict) return result.verdict;
      if (result && result.confidence > 0.7) return 'likely_true';
      return 'uncertain';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * 用引擎核查单个主张
   */
  async _verifyClaim(claimText, defaultConfidence) {
    try {
      const result = this.hf.dispatch('truth.checkStatement', claimText);
      if (result) {
        return {
          verdict: result.verdict || 'unknown',
          confidence: result.confidence || defaultConfidence,
          evidence: result.evidence || '',
        };
      }
    } catch (e) {
      // 事实核查不可用时，基于文本特征做启发式判断
    }

    // 回退：启发式判断
    const absoluteWords = /所有|全部|每个|总是|从不|绝对|一定|肯定|不可能/;
    if (absoluteWords.test(claimText)) {
      return { verdict: 'questionable', confidence: 0.3, evidence: '包含绝对化表述' };
    }
    return { verdict: 'unknown', confidence: defaultConfidence, evidence: '未核查' };
  }

  /**
   * 评估叙事框架自洽性
   */
  _assessNarrativeCoherence(input) {
    // 简单启发式：检测是否有A->B->C的因果链
    const hasCausalChain = /(先是|然后|接着|随后)|(因为|所以|因此|于是){2,}/.test(input);
    // 检测是否有具体例证
    const hasExamples = /比如|例如|举个|像[^个]/.test(input);
    // 检测是否有核心论点
    const hasThesis = /(我觉得|我认为|说白了|关键|问题在于|本质是)/.test(input);

    const score = (hasCausalChain ? 0.3 : 0) + (hasExamples ? 0.3 : 0) + (hasThesis ? 0.3 : 0);
    // 提取框架描述
    let framework = '叙事框架';
    const thesisMatch = input.match(/(?:关键|本质|问题在于|说白了)[^。？!]{5,60}/);
    if (thesisMatch) framework = thesisMatch[0];

    return { coherent: score > 0.5, strength: Math.min(score + 0.2, 1.0), framework };
  }

  // ═══════════════════════════════════════════════
  // 争议检测
  // ═══════════════════════════════════════════════

  async _detectFactualErrors(input) {
    const errors = [];
    const facts = this._extractFactualAssertions(input);

    for (const fact of facts) {
      try {
        const result = this.hf.dispatch('truth.checkStatement', fact);
        if (result && (result.verdict === 'false' || result.verdict === 'likely_false')) {
          errors.push({
            claim: fact.slice(0, 80),
            correction: result.correction || result.explanation || '与事实不符',
            severity: 4,
            confidence: result.confidence || 0.8,
            evidence: result.evidence || '事实核查失败',
          });
        }
      } catch (e) {
        // truth 子系统不可用时静默降级
      }
    }
    return errors;
  }

  /**
   * 检测绝对化表述
   */
  _detectAbsoluteStatements(input) {
    const absolutes = [];
    const patterns = [
      { regex: /所有[^的]*都[^，。]*/g, correction: '"大多数"而非"所有"', severity: 2 },
      { regex: /[^没从不]*从不[^，。]*/g, correction: '"很少/极少"而非"从不"', severity: 2 },
      { regex: /[^没从不]*永远[不没]?[^，。]*/g, correction: '"很少/极少"而非"永远"', severity: 2 },
      { regex: /没有[^的]*可以/g, correction: '例外是存在的', severity: 2 },
      { regex: /[^还]不是[^，。]*吗/g, correction: '反问句隐含绝对判断', severity: 1 },
      { regex: /一定[会能][^，。]*/g, correction: '"很可能"而非"一定"', severity: 2 },
    ];

    for (const pat of patterns) {
      const matches = input.matchAll(pat.regex);
      for (const match of matches) {
        const phrase = match[0].trim();
        if (phrase.length > 5) {
          absolutes.push({ phrase: phrase.slice(0, 60), correction: pat.correction, severity: pat.severity });
        }
      }
    }
    return absolutes;
  }

  /**
   * 检测逻辑矛盾
   */
  _detectLogicalContradictions(input) {
    const contradictions = [];

    // A与非A在文内同时出现
    const pairs = [
      { affirmative: /[^不]*是[^不]*必要/, negative: /不是.*必要|没必要|不需要/, label: '必要性矛盾' },
      { affirmative: /应[^该]/, negative: /不应|不应该/, label: '应然矛盾' },
      { affirmative: /不可[^能]*避免/, negative: /可以避免/, label: '必然性矛盾' },
    ];

    for (const pair of pairs) {
      const affirm = pair.affirmative.test(input);
      const neg = pair.negative.test(input);
      if (affirm && neg) {
        contradictions.push({
          statement: `同时主张"${pair.label}"的正反两面`,
          correction: `需要澄清是"${pair.label.replace('矛盾', '')}"的哪一面`,
          clash: pair.label,
        });
      }
    }
    return contradictions;
  }

  /**
   * 检测片面归因
   */
  _detectMisattribution(input) {
    const attribs = [];

    // 单因素归因模式
    const singleCausePatterns = [
      /就是因为|完全因为|全是.*的错|都怪|归根结底是/,
      /唯一的[原因理由]|本质就是|说白了就是[^，。]{0,20}$/,
    ];

    for (const pat of singleCausePatterns) {
      const match = input.match(pat);
      if (match) {
        // 检查是否真的单因素（没有"之一"等缓和词）
        if (!/(之一|多方面|复杂|多种|不能简单)/.test(input)) {
          attribs.push({
            claim: match[0],
            correction: '现实中通常为多因素共同作用',
          });
        }
      }
    }
    return attribs;
  }

  /**
   * 检测缺乏证据的断言
   */
  _detectUnsupportedClaims(input) {
    const unsupported = [];

    const strongAssertionPatterns = [
      /事实[^就上]{0,10}是|真相[^就是]{0,10}是/,
      /我告诉你[^，。]{5,40}/,
      /不用说[^，。]{5,40}/,
      /说白了[^，。]{10,60}/,
      /懂[得吗]?[，。][^，。]{10,50}/,
    ];

    for (const pat of strongAssertionPatterns) {
      const match = input.match(pat);
      if (match) {
        const phrase = match[0];
        // 检查是否有证据支撑
        const hasEvidence = /比如|因为|数据显示|研究|报告|根据|统计|例子|事实[^上]/.test(input.slice(input.indexOf(phrase) + phrase.length, input.indexOf(phrase) + phrase.length + 100));
        if (!hasEvidence) {
          unsupported.push({
            claim: phrase.slice(0, 60),
          });
        }
      }
    }
    return unsupported;
  }

  // ═══════════════════════════════════════════════
  // 深度洞见检测
  // ═══════════════════════════════════════════════

  /**
   * 检测视野盲区
   */
  _detectBlindSpots(input) {
    const blindSpots = [];

    // 1. 只有一方叙事
    const hasOneSidedNarrative = (text) => {
      const hasSideA = /中国|中方|我国/.test(text);
      const hasSideB = /美国|西方|欧盟|日本/.test(text);
      return hasSideA !== hasSideB; // 只有一方
    };

    if (hasOneSidedNarrative(input)) {
      const side = /中国|中方/.test(input) ? '中国' : '对方';
      blindSpots.push({
        observation: `叙事视角集中在${side}立场，未充分考虑其他参与方的动机与限制`,
        significance: 4,
        reframing: `将${side}的决策放回多方博弈框架中理解`,
      });
    }

    // 2. 缺乏历史纵深
    const hasHistoricalDepth = /历史|过去|一直以来|传统|多年[来以]/.test(input);
    if (!hasHistoricalDepth && input.length > 100) {
      blindSpots.push({
        observation: '分析缺乏历史纵深，未追溯问题根源',
        significance: 3,
        reframing: '将当前事件放回历史演变脉络中',
      });
    }

    // 3. 情绪覆盖理性
    const emotionWords = /生气|愤怒|失望|伤心|可悲|可笑|荒唐|荒谬/;
    const logicWords = /原因|分析|证据|数据|逻辑|基于|角度|层面/;
    if (emotionWords.test(input) && !logicWords.test(input)) {
      blindSpots.push({
        observation: '情绪化表达覆盖了理性分析层面',
        significance: 4,
        reframing: '先确认事实，再评估情绪反应是否与事实相匹配',
      });
    }

    return blindSpots;
  }

  /**
   * 检测"慢过程被说成急性事件"
   * 这是用户在前两轮对话中的核心叙事模式
   */
  _detectTemporalFallacy(input) {
    const result = { detected: false, observation: '', reframing: '' };

    // 检测"瞬间"类词汇 + "重大变化"类词汇的组合
    const hasInstantTiming = /瞬间|一夜之间|突然|一下子|猛然|急剧/.test(input);
    const hasSlowProcess = /逐步|慢慢|渐进|长期|多年|漫长|积累/.test(input);
    const hasSuddenChange = /变了|颠覆|崩塌|反转|翻盘/.test(input);
    const hasComplexity = /复杂|多方|权衡|平衡|博弈/.test(input);

    // 有"突然"但无"渐进"描述，且有重大变化断言
    if (hasInstantTiming && hasSuddenChange && !hasSlowProcess) {
      result.detected = true;
      result.observation = '将长期积累的渐进过程描述为"突然"发生的事件';
      result.significance = 5;
      result.reframing = '拆解该事件背后的长期积累过程，区分触发事件与根本原因';
    }

    // 有"变了"类断言但缺乏过程描述
    if (hasSuddenChange && !hasSlowProcess && !hasComplexity) {
      result.detected = true;
      result.observation = '对变化的描述缺乏过程分析，将结果等同于原因';
      result.significance = 4;
      result.reframing = '区分"发生了什么"和"为什么会发生"，追溯变化的过程链';
    }

    return result;
  }

  /**
   * 检测核心张力
   */
  _detectCoreTension(input) {
    const result = { detected: false, observation: '', reframing: '' };

    // 矛盾对检测
    const tensionPairs = [
      { a: /自由|自主|独立/, b: /控制|约束|限制|统治/ },
      { a: /发展|增长|进步/, b: /代价|牺牲|破坏|损失/ },
      { a: /公平|正义|平等/, b: /利益|私利|自利/ },
      { a: /理想|梦想|希望/, b: /现实|实际|务实|骨感/ },
      { a: /安全|稳定/, b: /自由|灵活|冒险/ },
      { a: /国家|民族|集体/, b: /个人|个体|私/ },
    ];

    for (const pair of tensionPairs) {
      const hasA = pair.a.test(input);
      const hasB = pair.b.test(input);
      if (hasA && hasB) {
        result.detected = true;
        result.observation = `叙事中隐含"${pair.a.source}"与"${pair.b.source}"的深层张力`;
        result.significance = 5;
        result.reframing = `意识到这对矛盾是无法消除的，关键在于动态平衡而非二选一`;
        const aText = pair.a.source || pair.a.toString().slice(1, -1).split('|')[0];
        const bText = pair.b.source || pair.b.toString().slice(1, -1).split('|')[0];
        result.observation = `叙事中隐含"${aText}"与"${bText}"的深层张力`;
        result.reframing = `这对矛盾无法消除，关键在于动态平衡而非二选一`;
        // 只取第一个检测到的核心张力
        return result;
      }
    }

    return result;
  }

  /**
   * 检测未言明的假设
   */
  _detectHiddenAssumptions(input) {
    const assumptions = [];

    // "理所当然"类表述
    const takenForGranted = [
      { pattern: /自然是|理所当然|毫无疑问|不用说|不必说/, label: '视作理所当然的假设' },
      { pattern: /都是这样的|谁都知道|地球人都知道/, label: '普遍性假设' },
    ];

    for (const tg of takenForGranted) {
      const match = input.match(tg.pattern);
      if (match) {
        assumptions.push({
          observation: `隐含假设：${match[0]}附近的内容被视作不言自明`,
          significance: 3,
          reframing: '检查这个不言自明的假设是否真的成立',
        });
      }
    }

    return assumptions;
  }

  // ═══════════════════════════════════════════════
  // 摘要生成
  // ═══════════════════════════════════════════════

  /**
   * 生成简短段落摘要
   */
  _summarizeSection(items, type) {
    if (items.length === 0) {
      switch (type) {
        case 'agreement': return '未检测到需要特别肯定的核心主张';
        case 'disagreement': return '未检测到明显的事实错误或逻辑问题';
        case 'insight': return '未检测到突出的深层洞见';
        default: return '';
      }
    }

    const topItem = items[0];
    switch (type) {
      case 'agreement':
        return topItem.claim.slice(0, 60) + '...';
      case 'disagreement':
        return topItem.claim.slice(0, 60) + ' → ' + topItem.correction.slice(0, 30);
      case 'insight':
        return topItem.observation.slice(0, 80);
      default:
        return '';
    }
  }

  /**
   * 综合摘要（Markdown 格式）
   */
  _buildSummary(agreements, disagreements, insights) {
    const lines = [];

    // ✅ 对的
    if (agreements.length > 0) {
      lines.push(`✅ **对的**: ${this._summarizeSection(agreements, 'agreement')}`);
    }

    // ❌ 不对的
    if (disagreements.length > 0) {
      const top = disagreements[0];
      lines.push(`❌ **需要反驳**: ${top.claim.slice(0, 50)} → ${top.correction.slice(0, 30)}`);
      if (disagreements.length > 1) {
        lines.push(`   (另有 ${disagreements.length - 1} 项争议)`);
      }
    }

    // 💡 洞见
    if (insights.length > 0) {
      const top = insights[0];
      lines.push(`💡 **最深洞见**: ${top.observation.slice(0, 80)}`);
      lines.push(`   重述: ${top.reframing.slice(0, 60)}`);
    }

    return lines.join('\n');
  }
}

module.exports = { DebateAnalyzer };
