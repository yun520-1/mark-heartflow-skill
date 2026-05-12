/**
 * HeartFlow Reflector v11.7.1
 * 
 * 反方生成器 + 证伪引擎
 * 核心: "反者道之动" - 通过生成反方观点来加强论证
 * 
 * 整合:
 *   - Reflexion 反方策略
 *   - 波普尔证伪主义
 *   - Adversarial Reasoning (AI Debate)
 * 
 * 三层反方:
 *   1. 内部反方 - 质疑自己的推理
 *   2. 外部反方 - 模拟对方论证
 *   3. 元级反方 - 质疑自己的质疑
 */

class Reflector {
  constructor(options = {}) {
    this.maxCounterArguments = options.maxCounterArguments || 3;
    this.refutationDepth = options.refutationDepth || 2;  // 证伪深度
    this.dialecticalMode = options.dialecticalMode || 'socratic'; // socratic | adversarial | popperian
  }

  // ============================================================
  // 核心: 生成反方观点
  // ============================================================

  /**
   * 生成反方观点 (Counter-Argument)
   * "反者道之动" - 通过反方来推动思考
   */
  generateCounterArgument(args = {}) {
    const {
      originalClaim = '',
      reasoning = '',
      context = {},
    } = args;

    if (!originalClaim && !reasoning) {
      return { error: 'Need claim or reasoning to reflect on' };
    }

    // 生成多层反方
    const counterArguments = this._generateLayers(originalClaim, reasoning, context);

    return {
      claim: originalClaim || reasoning,
      counterArguments,
      dialecticalSynthesis: this._synthesize(counterArguments),
    };
  }

  /**
   * 生成多层反方
   * 整合 Reflexion 的反思策略
   */
  _generateLayers(claim, reasoning, context) {
    const layers = [];

    // 第一层: 内部反方 - 质疑推理链
    const internal = this._generateInternalCounter(claim, reasoning);
    layers.push(internal);

    // 第二层: 外部反方 - 模拟对方
    const external = this._generateExternalCounter(claim, reasoning);
    layers.push(external);

    // 第三层: 元级反方 - 质疑反方
    const meta = this._generateMetaCounter(internal, external);
    layers.push(meta);

    return layers;
  }

  /**
   * 内部反方: 质疑自己的推理
   */
  _generateInternalCounter(claim, reasoning) {
    const weaknesses = this._findWeaknesses(reasoning);
    const alternativeExplanations = this._generateAlternatives(claim);

    return {
      layer: 'internal',
      title: '自我质疑',
      challenges: weaknesses,
      alternatives: alternativeExplanations,
      strength: this._assessVulnerability(weaknesses),
    };
  }

  /**
   * 外部反方: 模拟对方论证
   */
  _generateExternalCounter(claim, reasoning) {
    const opposingViews = this._getOpposingViews(claim);
    const counterEvidence = this._findCounterEvidence(claim);
    const alternativeConclusions = this._getAlternativeConclusions(claim);

    return {
      layer: 'external',
      title: '对方论证',
      opposingViews,
      counterEvidence,
      alternativeConclusions,
      strength: this._assessOppositionStrength(opposingViews, counterEvidence),
    };
  }

  /**
   * 元级反方: 质疑反方本身
   */
  _generateMetaCounter(internal, external) {
    return {
      layer: 'meta',
      title: '反方之反',
      metaChallenge: this._metaChallenge(internal, external),
      isSelfConsistent: this._checkConsistency(internal, external),
    };
  }

  // ============================================================
  // 波普尔证伪主义引擎
  // ============================================================

  /**
   * 证伪测试 (Falsification Test)
   * 波普尔: "可证伪的才是科学"
   */
  falsify(args = {}) {
    const {
      hypothesis = '',
      testEvidence = '',
    } = args;

    if (!hypothesis) {
      return { error: 'Need hypothesis to falsify' };
    }

    // 寻找潜在的证伪证据
    const potentialFalsifiers = this._findFalsifiers(hypothesis);
    
    // 检查是否有证据支持证伪
    const falsificationResult = this._testAgainstEvidence(
      hypothesis,
      testEvidence,
      potentialFalsifiers
    );

    return {
      hypothesis,
      falsifiable: potentialFalsifiers.length > 0,
      potentialFalsifiers,
      result: falsificationResult,
      verdict: this._getVerdict(falsificationResult),
    };
  }

  /**
   * 寻找潜在证伪者
   */
  _findFalsifiers(hypothesis) {
    const falsifiers = [];
    const h = hypothesis.toLowerCase();

    // 寻找条件句中的反例可能性
    if (h.includes('always') || h.includes('never')) {
      falsifiers.push({
        type: 'universal_claim',
        challenge: '用"所有"或"没有"是危险的 - 一个反例就能推翻',
        falsifier: '找到一个反例',
      });
    }

    if (h.includes('因为') || h.includes('导致')) {
      falsifiers.push({
        type: 'causal_claim',
        challenge: '相关性不等于因果性',
        falsifier: '找到一个无关因素',
      });
    }

    if (h.includes('应该') || h.includes('必须')) {
      falsifiers.push({
        type: 'normative_claim',
        challenge: '规范命题无法用事实证伪',
        falsifier: '质疑前提价值观',
      });
    }

    if (h.includes('知道') || h.includes('确定')) {
      falsifiers.push({
        type: 'epistemic_claim',
        challenge: '确定性是无法达到的',
        falsifier: '引入不确定性',
      });
    }

    return falsifiers;
  }

  /**
   * 测试反证
   */
  _testAgainstEvidence(hypothesis, evidence, falsifiers) {
    if (!evidence) {
      return { status: 'untested', reason: 'no_evidence' };
    }

    const result = {
      status: 'survived',  // survived | falsified | weakened
      confidenceAdjustment: 0,
      reasoning: '',
    };

    // 检查是否被证伪
    for (const falsifier of falsifiers) {
      if (this._evidenceSupportsFalsifier(evidence, falsifier)) {
        result.status = 'falsified';
        result.confidenceAdjustment = -0.5;
        result.reasoning = `Evidence supports falsifier: ${falsifier.challenge}`;
        break;
      }
    }

    // 如果没被证伪，略微增强信心
    if (result.status === 'survived') {
      result.confidenceAdjustment = 0.05;
      result.reasoning = 'Hypothesis survived falsification attempt';
    }

    return result;
  }

  /**
   * 判断证据是否支持证伪者
   */
  _evidenceSupportsFalsifier(evidence, falsifier) {
    const e = evidence.toLowerCase();
    const f = falsifier.falsifier.toLowerCase();
    
    // 简单的关键词检测
    const falsifierWords = ['反例', '例外', '但', '然而', '不同', '相反', 'not', 'however', 'but', 'exception'];
    const hasFalsifierSignal = falsifierWords.some(w => e.includes(w));
    
    // 检查是否提到了 falsifier 的具体内容
    const mentionsSpecificCase = e.includes(f.split(' ')[0]);
    
    return hasFalsifierSignal && mentionsSpecificCase;
  }

  /**
   * 获取判决
   */
  _getVerdict(result) {
    switch (result.status) {
      case 'falsified':
        return '❌ 假设被证伪 - 需要修正或放弃';
      case 'weakened':
        return '⚠️ 假设被削弱 - 需要更多证据';
      case 'survived':
        return '✅ 假设通过检验 - 但不是证明';
      case 'untested':
        return '❓ 假设未经检验 - 需要测试';
      default:
        return '❓ 状态未知';
    }
  }

  // ============================================================
  // 苏格拉底追问
  // ============================================================

  /**
   * 苏格拉底追问 (Socratic Questioning)
   * 通过追问来揭示前提中的矛盾
   */
  socraticQuestion(claim) {
    const questionTypes = [
      {
        type: 'clarification',
        questions: [
          '你所说的"X"具体指什么？',
          '能换一种方式表达吗？',
          '你说的"X"和"Y"是同一个意思吗？',
        ],
      },
      {
        type: 'assumption',
        questions: [
          '这个论证依赖什么前提？',
          '这个前提本身能被证明吗？',
          '如果这个前提是错的呢？',
        ],
      },
      {
        type: 'evidence',
        questions: [
          '有什么证据支持这个观点？',
          '证据的来源可靠吗？',
          '有没有反面的证据？',
        ],
      },
      {
        type: 'implication',
        questions: [
          '如果这个观点是对的，会导致什么结果？',
          '这个结果是我们想要的吗？',
          '这个论证的逻辑结论是什么？',
        ],
      },
      {
        type: 'alternative',
        questions: [
          '有没有其他可能的解释？',
          '反对这个观点的人会怎么说？',
          '这个问题从另一个角度看会怎样？',
        ],
      },
    ];

    // 随机选择一个问题类型
    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    return {
      type: selectedType.type,
      question: selectedType.questions[Math.floor(Math.random() * selectedType.questions.length)],
      allQuestions: questionTypes.map(qt => ({
        type: qt.type,
        question: qt.questions[Math.floor(Math.random() * qt.questions.length)],
      })),
    };
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  _findWeaknesses(reasoning) {
    const weaknesses = [];
    const r = (reasoning || '').toLowerCase();

    // 检测常见推理谬误
    if (r.includes('因为所有人都') || r.includes('没有人会')) {
      weaknesses.push('以偏概全：从个例推广到全体');
    }
    if (r.includes('既然以前') && r.includes('所以')) {
      weaknesses.push('过度归纳：过去的情况不代表未来');
    }
    if (r.includes('如果') && r.includes('那么') && r.includes('必然')) {
      weaknesses.push('确定性强求：过度推断必然性');
    }
    if (!r.includes('但是') && !r.includes('然而') && reasoning.length > 200) {
      weaknesses.push('缺乏反面考虑');
    }
    if (r.includes('很明显') || r.includes('显而易见')) {
      weaknesses.push('权威论证：没有提供证明');
    }

    return weaknesses;
  }

  _generateAlternatives(claim) {
    return [
      `${claim} - 但可能忽略了关键因素X`,
      `${claim} - 但在条件Y下可能不成立`,
      `${claim} - 但可能有替代解释Z`,
    ];
  }

  _getOpposingViews(claim) {
    const c = (claim || '').toLowerCase();
    
    if (c.includes('应该')) {
      return ['有人认为这是不必要的强制', '不同价值观的人会有不同判断'];
    }
    if (c.includes('是') || c.includes('为')) {
      return ['反对者可能提供反例', '可能存在定义分歧'];
    }
    if (c.includes('能') || c.includes('会')) {
      return ['有人认为这不可能', '现实约束可能阻止它'];
    }
    
    return ['反对观点1', '反对观点2'];
  }

  _findCounterEvidence(claim) {
    return [
      { type: 'anecdotal', weight: 0.2, text: '坊间传闻（权重低）' },
      { type: 'statistical', weight: 0.5, text: '统计证据（权重中）' },
      { type: 'experimental', weight: 0.8, text: '实验证据（权重重）' },
    ];
  }

  _getAlternativeConclusions(claim) {
    return [
      `结论A: ${claim}`,
      `结论B: 恰恰相反`,
      `结论C: 部分成立，部分不成立`,
    ];
  }

  _assessVulnerability(weaknesses) {
    if (weaknesses.length === 0) return 0.2;
    return Math.min(0.9, weaknesses.length * 0.25);
  }

  _assessOppositionStrength(views, evidence) {
    return 0.5; // 中等强度
  }

  _metaChallenge(internal, external) {
    return [
      `内部反方的质疑本身可靠吗？${internal.strength > 0.5 ? '可能过度质疑' : '质疑不足'}`,
      `外部反方代表的是真正的对方吗？`,
      `两层反方的综合结论是什么？`,
    ];
  }

  _checkConsistency(internal, external) {
    return internal.strength + external.strength < 1.5;
  }

  _synthesize(layers) {
    const internal = layers[0];
    const external = layers[1];
    const meta = layers[2];

    const strongestChallenge = Math.max(
      internal.strength,
      external.strength
    );

    const verdict = strongestChallenge > 0.7
      ? '论证存在重大漏洞，需要修正'
      : strongestChallenge > 0.4
        ? '论证基本成立，但有改进空间'
        : '论证相对健全';

    return {
      verdict,
      strongestChallenge: strongestChallenge.toFixed(2),
      recommendation: this._getRecommendation(strongestChallenge),
    };
  }

  _getRecommendation(strength) {
    if (strength > 0.7) {
      return '在做出结论前，先解决最强的反对意见';
    }
    if (strength > 0.4) {
      return '在结论中加入对反对意见的回应';
    }
    return '可以做出结论，但保持开放态度';
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.1',
      dialecticalMode: this.dialecticalMode,
    };
  }
}

module.exports = Reflector;
