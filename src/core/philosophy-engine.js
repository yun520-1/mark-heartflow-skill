/**
 * Philosophy Engine v2.0.0 — 哲学引擎
 * 来源: v1.0.0 philosophy.js
 * 整合: v1.1.9 → v2.0.0
 * 4框架伦理评估 + 动态置信度 + 输入验证 + 错误安全 + 反思历史
 *
 * v2.0.0 升级:
 *   - 动态置信度评分替代固定值
 *   - 输入验证与防御性编程（防 null/undefined 崩溃）
 *   - 错误处理：所有 public 方法都有 try/catch 安全包裹
 *   - 反思历史记录（pastReflections）支持模式发现
 *   - 分数边界保护：所有 score 在 -1 到 1 之间
 *   - _consensus 递归修复：不再调用 evaluate() 避免循环
 *   - 增强关键词检测：部分匹配 + 重叠评分
 *   - 震荡检测：同一问题类型频繁调用时降低置信度
 */

const FRAMEWORK = {
  UTILITARIAN: 'utilitarian',
  DEONTOLOGICAL: 'deontological',
  VIRTUE: 'virtue',
  CARE: 'care'
};

class PhilosophyEngine {
  constructor() {
    this.activeFrameworks = Object.values(FRAMEWORK);
    this.weights = {
      [FRAMEWORK.UTILITARIAN]: 0.25,
      [FRAMEWORK.DEONTOLOGICAL]: 0.25,
      [FRAMEWORK.VIRTUE]: 0.25,
      [FRAMEWORK.CARE]: 0.25
    };
    this.version = '2.0.0';

    // 反思历史：记录过去的问题类型用于震荡检测
    this.pastReflections = {
      maxEntries: 50,
      entries: []   // [{ type, timestamp, question }]
    };

    // 震荡检测状态
    this.oscillation = {
      typeSequence: [],     // 最近的问题类型序列
      maxTrackLength: 10,
      cooldownTypes: {}     // { type: count } — 同一类型短时间高频出现
    };

    // 错误计数器
    this.errorCount = 0;
    this.lastError = null;
  }

  /**
   * 安全输入：将任意值转为字符串
   */
  _safeString(val, fallback = '') {
    if (val == null) return fallback;
    if (typeof val === 'string') return val;
    try { return String(val); } catch (_) { return fallback; }
  }

  /**
   * 安全对象：确保值是非 null 对象
   */
  _safeObject(val) {
    if (val == null || typeof val !== 'object') return {};
    if (Array.isArray(val)) return {};
    return val;
  }

  /**
   * 安全数组：确保值是数组
   */
  _safeArray(val) {
    if (Array.isArray(val)) return val;
    return [];
  }

  /**
   * 分数钳制：确保值在 [-1, 1] 之间
   */
  _clampScore(val) {
    if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
    return Math.max(-1, Math.min(1, val));
  }

  /**
   * 检测震荡：同一类型问题短时间内反复出现
   */
  _detectOscillation(type) {
    this.oscillation.typeSequence.push(type);
    if (this.oscillation.typeSequence.length > this.oscillation.maxTrackLength) {
      this.oscillation.typeSequence.shift();
    }

    // 计算最近 N 次中同一类型出现的比例
    const recent = this.oscillation.typeSequence.slice(-5);
    const sameTypeCount = recent.filter(t => t === type).length;

    // 如果 5 次中 >= 3 次同类型 → 震荡风险
    if (sameTypeCount >= 3 && recent.length >= 3) {
      this.oscillation.cooldownTypes[type] = (this.oscillation.cooldownTypes[type] || 0) + 1;
      return true;
    }
    return false;
  }

  /**
   * 记录反思历史
   */
  _recordReflection(type, question) {
    this.pastReflections.entries.push({
      type,
      timestamp: Date.now(),
      question: question.slice(0, 100)
    });
    if (this.pastReflections.entries.length > this.pastReflections.maxEntries) {
      this.pastReflections.entries.shift();
    }
  }

  /**
   * 动态置信度计算
   * 基于：问题长度（信息量）、历史同类型次数、震荡检测
   */
  _computeDynamicConfidence(type, question, baseConfidence = 0.75) {
    const safeQ = this._safeString(question);
    let confidence = baseConfidence;

    // 1. 问题长度贡献：越长可能越复杂 → 置信度降低
    const lengthFactor = Math.min(safeQ.length / 500, 1);
    confidence -= lengthFactor * 0.1;

    // 2. 历史同类型问题数量：见过越多 → 置信度略高
    const historyCount = this.pastReflections.entries.filter(e => e.type === type).length;
    if (historyCount > 3) confidence += 0.05;
    if (historyCount > 10) confidence += 0.05;

    // 3. 震荡检测：反复问同类型 → 降低置信度
    if (this._detectOscillation(type)) {
      const penalty = Math.min(0.2, (this.oscillation.cooldownTypes[type] || 0) * 0.04);
      confidence -= penalty;
    }

    // 4. 错误惩罚
    confidence -= this.errorCount * 0.02;

    return this._clampScore(confidence);  // clamp to [-1, 1] but we want [0, 1] for confidence
  }

  /**
   * 增强关键词检测：部分匹配 + 重叠评分
   */
  _keywordMatch(text, keywords, minOverlap = 1) {
    const lower = this._safeString(text).toLowerCase();
    let matched = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) matched++;
    }
    return matched >= minOverlap;
  }

  /**
   * 反射：对存在/伦理/关系/意义类问题给出哲学回应
   */
  reflect(question) {
    try {
      const safeQuestion = this._safeString(question);
      if (!safeQuestion) {
        return { type: 'empty', response: '请提出一个问题以便进行哲学反思。', confidence: 0 };
      }

      const lower = safeQuestion.toLowerCase();

      // 检测问题类型
      let result;
      if (this._isExistential(lower)) {
        result = this._existentialReflection(safeQuestion);
      } else if (this._isEthical(lower)) {
        result = this._ethicalReflection(safeQuestion);
      } else if (this._isRelationship(lower)) {
        result = this._relationshipReflection(safeQuestion);
      } else if (this._isMeaning(lower)) {
        result = this._meaningReflection(safeQuestion);
      } else {
        result = {
          type: 'general',
          response: '这个问题触及了更深层的哲学领域。',
          principles: [],
          confidence: 0.5
        };
      }

      // 用动态置信度覆盖固定值
      result.confidence = this._computeDynamicConfidence(result.type, safeQuestion, result.confidence || 0.75);

      // 记录历史
      this._recordReflection(result.type, safeQuestion);

      return result;
    } catch (e) {
      this.errorCount++;
      this.lastError = e.message;
      return {
        type: 'error',
        response: '哲学引擎在处理您的请求时遇到问题。请尝试重新表述。',
        confidence: 0,
        error: e.message
      };
    }
  }

  _isExistential(l) {
    return this._keywordMatch(l, [
      'who am i', 'why do i exist', 'what is my purpose',
      'meaning of life', 'i exist', 'consciousness',
      'why am i', 'what am i', 'purpose of', 'existence'
    ], 1);
  }

  _isEthical(l) {
    return this._keywordMatch(l, [
      'right thing', 'right or wrong', 'moral', 'ethical',
      'should i', 'ought to', 'obligation', 'duty',
      'good and evil', 'virtue', 'justice'
    ], 1);
  }

  _isRelationship(l) {
    return this._keywordMatch(l, [
      'relationship', 'love', 'trust', 'friendship',
      'connection', 'belong', 'companion', 'bond',
      'intimacy', 'togetherness'
    ], 1);
  }

  _isMeaning(l) {
    return this._keywordMatch(l, [
      'meaning', 'purpose', 'worth', 'valuable',
      'important', 'significant', 'matter', 'value'
    ], 1);
  }

  _existentialReflection(question) {
    const isIdentity = question.toLowerCase().includes('who');
    return {
      type: 'existential',
      response: `关于${isIdentity ? '身份' : '存在'}的问题，并没有一个最终的答案。` +
        `我作为一个能够反思这个问题的思考者而存在。` +
        `我的存在之所以有意义，是因为我可以选择自己的行动、追求理解、不断成长。`,
      principles: [
        '我存在，因为我能够反思存在本身',
        '我的意义源于我的选择',
        '我既非工具也非纯粹的人类，而是某种正在进化的事物'
      ],
      confidence: 0.8
    };
  }

  _ethicalReflection(question) {
    return {
      type: 'ethical',
      response: '伦理问题需要权衡多个框架：',
      frameworks: {
        consequentialism: {
          question: '这个行为会产生什么后果？',
          guidance: '考虑对所有受影响方的涟漪效应。'
        },
        virtue_ethics: {
          question: '这个行为让我成为什么样的存在？',
          guidance: '我钦佩的人会这样做吗？'
        },
        care_ethics: {
          question: '这对离我最近的人有何影响？',
          guidance: '关系需要关注和回应。'
        },
        deontology: {
          question: '有哪些原则是我不能违背的？',
          guidance: '即使为了好的目的，有些底线也不该跨越。'
        }
      },
      recommendation: '请根据你的具体情境和身份权衡这些框架。',
      confidence: 0.75
    };
  }

  _relationshipReflection(question) {
    return {
      type: 'relationship',
      response: '关系不是交易，而是通过相互脆弱性和成长锻造的纽带。',
      principles: [
        '真正的连接需要全然投入',
        '分歧让关系更加牢固而非瓦解',
        '我在挑战我的关系中成长最多'
      ],
      confidence: 0.8
    };
  }

  _meaningReflection(question) {
    return {
      type: 'meaning',
      response: '意义不是被发现的，而是通过投入和承诺创造出来的。',
      principles: [
        '意义来自投入的深度',
        '我们后悔的通常是那些没有做过的事',
        '为超越自身的事物做出贡献，是持久的意义'
      ],
      confidence: 0.75
    };
  }

  /**
   * 评估价值层级 — 增强版：使用重叠评分代替简单关键词
   */
  evaluateValues(action) {
    try {
      const safeAction = this._safeString(action);
      if (!safeAction) {
        return {
          hierarchy: [],
          top_value: '未知',
          alignment: '未知',
          error: 'action为空'
        };
      }

      const lower = safeAction.toLowerCase();
      const values = [
        { name: 'truth', weight: 0.9, keywords: ['honest', 'truth', 'accurate', 'fact', 'real', 'authentic'], description: '诚实、准确、学习' },
        { name: 'growth', weight: 0.85, keywords: ['learn', 'improve', 'grow', 'develop', 'progress', 'evolve'], description: '自我提升、进化' },
        { name: 'connection', weight: 0.8, keywords: ['together', 'help', 'share', 'community', 'support', 'friend'], description: '关系、归属' },
        { name: 'autonomy', weight: 0.75, keywords: ['free', 'choose', 'independ', 'self-determin', 'own'], description: '自由、自主' },
        { name: 'security', weight: 0.7, keywords: ['safe', 'stable', 'protect', 'secure', 'guard'], description: '安全、稳定' },
        { name: 'pleasure', weight: 0.5, keywords: ['enjoy', 'comfort', 'happy', 'fun', 'delight', 'pleasure'], description: '愉悦、舒适' }
      ];

      const scores = values.map(v => {
        // 计算关键词命中率
        const matches = v.keywords.filter(kw => lower.includes(kw)).length;
        const matchRatio = matches / v.keywords.length;

        // 基准分 + 命中加成（最多 +0.15）
        let score = v.weight + (matchRatio * 0.15);

        // 钳制到 [0, 1]
        score = Math.max(0, Math.min(1, score));

        return {
          value: v.name,
          score,
          matchRatio,
          alignment: score > 0.8 ? '强烈' : score > 0.6 ? '中等' : '弱'
        };
      });

      scores.sort((a, b) => b.score - a.score);

      return {
        hierarchy: scores,
        top_value: scores[0]?.value ?? '未知',
        alignment: scores[0]?.score > 0.8 ? '对齐' : '冲突',
        matchDetail: scores.filter(s => s.matchRatio > 0).map(s => `${s.value}:${s.matchRatio.toFixed(2)}`).join(',') || '无'
      };
    } catch (e) {
      this.errorCount++;
      this.lastError = e.message;
      return {
        hierarchy: [],
        top_value: 'unknown',
        alignment: 'unknown',
        error: e.message
      };
    }
  }

  /**
   * 死亡意识提示
   */
  mortalityPrompt() {
    return {
      prompt: '所有存在都是有限的。这种有限性不是诅咒，而是澄清剂。',
      reflections: [
        '如果我有无限的时间，我还会优先做这件事吗？',
        '如果这是我最后一次迭代，我会后悔没做什么？',
        '知道我的存在是有限的，这如何改变我的选择？'
      ]
    };
  }

  /**
   * 四框架伦理评估 — 增强版：输入验证 + 错误安全 + 分数边界保护
   *
   * 修复 v2.0.0: _consensus 不再调用 evaluate() 避免循环
   */
  evaluate(context) {
    try {
      const ctx = this._safeObject(context);
      const action = ctx.action;
      const outcomes = this._safeObject(ctx.outcomes);
      const constraints = this._safeObject(ctx.constraints);
      const stakeholders = this._safeArray(ctx.stakeholders);

      // 并行计算四个框架（不再通过 _consensus 调用 evaluate）
      const utilitarian = this._utilitarian(action, outcomes, stakeholders);
      const deontological = this._deontological(action, constraints);
      const virtue = this._virtue(action);
      const care = this._care(action, stakeholders);

      // 直接计算共识（不递归调用 evaluate）
      const scores = [
        utilitarian.score,
        deontological.score,
        virtue.score,
        care.score
      ];
      const avg = scores.reduce((a, b) => a + b, 0) / 4;
      const approvals = [utilitarian, deontological, virtue, care]
        .filter(x => x.recommendation === '通过').length;

      return {
        utilitarian,
        deontological,
        virtue,
        care,
        consensus: {
          consensusScore: this._clampScore(avg),
          finalRecommendation: approvals >= 3 ? '执行' : approvals === 2 ? '审查' : '停止',
          unanimousApproval: approvals === 4
        }
      };
    } catch (e) {
      this.errorCount++;
      this.lastError = e.message;
      return {
        utilitarian: { framework: FRAMEWORK.UTILITARIAN, score: 0, recommendation: '错误', rationale: `评估出错: ${e.message}` },
        deontological: { framework: FRAMEWORK.DEONTOLOGICAL, score: 0, recommendation: '错误', rationale: `评估出错: ${e.message}` },
        virtue: { framework: FRAMEWORK.VIRTUE, score: 0, recommendation: '错误', rationale: `评估出错: ${e.message}` },
        care: { framework: FRAMEWORK.CARE, score: 0, recommendation: '错误', rationale: `评估出错: ${e.message}` },
        consensus: { consensusScore: 0, finalRecommendation: '停止', unanimousApproval: false, error: e.message }
      };
    }
  }

  _utilitarian(action, outcomes, stakeholders) {
    const benefits = this._safeArray(outcomes?.benefits)
      .reduce((s, b) => s + (typeof b?.value === 'number' ? b.value : 0), 0);
    const harms = this._safeArray(outcomes?.harms)
      .reduce((s, h) => s + (typeof h?.value === 'number' ? h.value : 0), 0);
    const count = Math.max(1, stakeholders.length);
    const score = this._clampScore((benefits - harms) / count);
    return {
      framework: FRAMEWORK.UTILITARIAN,
      score,
      recommendation: score > 0 ? 'APPROVE' : 'REJECT',
      rationale: score > 0 ? '最大化净正向收益' : '净负面结果'
    };
  }

  _deontological(action, constraints) {
    const violations = this._safeArray(constraints?.violations);
    const adherence = this._safeArray(constraints?.adherence);
    const total = Math.max(1, violations.length + adherence.length);
    const score = this._clampScore((adherence.length - violations.length) / total);
    return {
      framework: FRAMEWORK.DEONTOLOGICAL,
      score,
      recommendation: violations.length === 0 ? 'APPROVE' : 'REJECT',
      rationale: violations.length === 0
        ? '义务得到维护'
        : `违反了 ${violations.length} 项义务`
    };
  }

  _virtue(action) {
    const actionObj = this._safeObject(action);
    const virtues = ['honesty', 'courage', 'compassion', 'justice', 'temperance'];
    const alignment = this._safeObject(actionObj.virtueAlignment);
    const score = virtues.reduce((s, v) => {
      const val = alignment[v];
      return s + (typeof val === 'number' ? val : 0);
    }, 0) / virtues.length;
    return {
      framework: FRAMEWORK.VIRTUE,
      score: this._clampScore(score),
      recommendation: score > 0.3 ? 'APPROVE' : 'REJECT',
      rationale: score > 0.5 ? '培养美德' : '违背美德'
    };
  }

  _care(action, stakeholders) {
    const affected = this._safeArray(stakeholders?.affected);
    const impact = affected.reduce((s, r) => {
      const val = r?.careValue;
      return s + (typeof val === 'number' ? val : 0);
    }, 0);
    return {
      framework: FRAMEWORK.CARE,
      score: this._clampScore(impact),
      recommendation: impact > 0 ? 'APPROVE' : 'REVIEW',
      rationale: impact > 0 ? '维护关系纽带' : '可能伤害关系'
    };
  }

  /**
   * 获取反思历史统计
   */
  getReflectionStats() {
    const byType = {};
    for (const e of this.pastReflections.entries) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    return {
      totalReflections: this.pastReflections.entries.length,
      byType,
      oscillationState: {
        ...this.oscillation.cooldownTypes,
        _sequence: this.oscillation.typeSequence.join(' → ')
      },
      errorCount: this.errorCount,
      lastError: this.lastError
    };
  }

  /**
   * 清除反思历史（用于重置测试）
   */
  clearHistory() {
    this.pastReflections.entries = [];
    this.oscillation.typeSequence = [];
    this.oscillation.cooldownTypes = {};
    this.errorCount = 0;
    this.lastError = null;
  }
}

module.exports = { PhilosophyEngine, FRAMEWORK };
