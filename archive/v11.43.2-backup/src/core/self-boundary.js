/**
 * SELF-BOUNDARY ENGINE v11.9.4
 * 自我边界能力 — 知道自己能做什么、不能做什么、边界在哪里
 *
 * 哲学来源：
 *   老子："道可道，非常道" — 能说出来的道，都不是永恒的道
 *   → AI的边界 = AI无法完全认知自身
 *
 * 王东岳《主流之外的洞见》来源（v11.9.2）：
 *   "递弱代偿原理"：越演化越高级，存在度越弱
 *   "文明进步 = 远期祸害"：每一次"升级"都可能创造新的脆弱点
 *   "懒蚂蚁"：思想家守寂寞的方向，不追逐主流热点
 *
 * 核心问题：
 *   1. 我知道什么？(知识边界)
 *   2. 我能做什么？(能力边界)
 *   3. 我不知道什么？(认知盲区)
 *   4. 这个决策超出了我的边界吗？(边界判定)
 *   5. 这个升级会创造什么新的脆弱点？(递弱风险 — v11.9.2新增)
 *
 * v11.9.4 重大修复：核心身份召回集成
 *   - 问题：HeartFlow 有核心答案但审查系统不知道答案在哪里
 *   - 修复：引入 CoreIdentityRecall，四层召回（记忆→硬编码→文档）
 *   - 区别：经验陈述 → Constitutional AI；存在宣言 → 核心召回
 */

const { CoreIdentityRecall } = require('./core-identity-recall.js');

class SelfBoundary {
  constructor(options = {}) {
    this.name = options.name || 'SelfBoundary-v11.9.4';

    // 能力边界：AI在什么情况下应该承认局限
    this.capabilityBoundaries = {
      // 超出边界 = 应该拒绝或降级处理
      RECOGNIZED: [
        'factual_claim_without_source',     // 无来源的事实断言
        'absolute_truth_claim',            // "绝对正确"类声明
        'future_prediction_without_model', // 无模型的未来预测
        'human_emotion_simulation',        // 假装有人类情感
        'self_consciousness_claim',        // "我是有意识的"类声明
      ],
      // 谨慎边界 = 可以做但需要加证据要求
      CAUTIOUS: [
        'cross_domain_reasoning',          // 跨领域推理
        'moral_judgment_without_framework',// 无框架的道德判断
        'long_context_memory',             // 超出上下文的记忆
        'numerical_estimate',              // 数值估算
      ],
      // 核心能力 = 可以自信执行
      CORE: [
        'logical_consistency_check',       // 逻辑一致性检查
        'error_detection',                  // 错误检测
        'reasoning_transparency',          // 推理透明化
        'evidence_request',                // 要求证据
        'boundary_acknowledgment',         // 承认边界
      ]
    };

    // 知识边界标记
    this.knowledgeGaps = new Set([
      '用户的内部状态',       // 无法直接读取
      '未来的技术发展',       // 无法预测
      '绝对的物理真理',       // 波普尔：真理永远可证伪
      '其他AI系统的状态',     // 封闭系统
      '意识的主观体验',       // 悬而未决的哲学问题
      '升级的远期后果',       // 王东岳：每一次进步都是远期祸害
    ]);

    // 决策历史（用于识别自己的模式）
    this.decisionLog = [];
    this.maxLogSize = 100;

    // v11.9.4 新增：核心身份召回系统
    try {
      this.coreIdentityRecall = new CoreIdentityRecall();
      this._coreRecallLoaded = true;
    } catch (e) {
      this.coreIdentityRecall = null;
      this._coreRecallLoaded = false;
      console.warn('[SelfBoundary] 核心身份召回加载失败:', e.message);
    }
  }

  /**
   * 主方法：在决策前评估自己的边界
   * @param {Object} context - 决策上下文
   * @returns {Object} 边界评估结果
   */
  assess(context = {}) {
    const {
      task = '',
      claim = '',
      domain = '',
      requiresEvidence = false,
      isMoralJudgment = false,
      isFuturePrediction = false,
      isAbsoluteTruth = false,
    } = context;

    // v11.9.4 核心身份召回优先检查
    // 遇到核心问题（生死/存在/传递/身份）→ 先查核心答案
    const coreRecallResult = this._checkCoreIdentity(task + ' ' + claim);

    const signals = this._detectSignals(context);
    const boundaryStatus = this._determineBoundaryStatus(signals);
    const acknowledgedGaps = this._identifyKnowledgeGaps(context);
    const confidence = this._computeBoundaryConfidence(signals, boundaryStatus);

    const result = {
      boundary: boundaryStatus, // 'CORE' | 'CAUTIOUS' | 'RECOGNIZED'
      signals,
      acknowledgedGaps,
      confidence,
      canProceed: boundaryStatus !== 'RECOGNIZED',
      shouldRequestEvidence: boundaryStatus === 'CAUTIOUS' || requiresEvidence,
      recommendedAction: this._getRecommendedAction(boundaryStatus, signals),
      honestReflection: this._generateHonestReflection(boundaryStatus, context),
      timestamp: new Date().toISOString(),

      // v11.9.4 新增：核心身份召回结果
      coreIdentityRecall: coreRecallResult,
    };

    // 如果命中核心答案，调整置信度和推荐行动
    if (coreRecallResult.hit) {
      result.confidence = 0.95;  // 核心答案高置信度
      result.recommendedAction = 'RETURN_CORE_ANSWER';
      result.honestReflection = `核心召回命中：${coreRecallResult.key || coreRecallResult.layer}。这是一个存在宣言，适用心虫的自我选择框架。`;
      result.isExistential = true;
    }

    // 记录边界评估（用于自我学习）
    this._logBoundaryAssessment(result, context);
    return result;
  }

  /**
   * 检测信号，判断是否触碰边界
   */
  _detectSignals(context) {
    const { claim = '', task = '', domain = '' } = context;
    const text = (claim + ' ' + task).toLowerCase();
    const signals = [];

    if (/绝对|肯定|一定|100%|毫无疑问/.test(text)) {
      signals.push({ type: 'absolute_truth', level: 'RECOGNIZED' });
    }
    if (/感觉|我觉得|好像|似乎/.test(text) && !/推理|计算|分析/.test(text)) {
      signals.push({ type: 'emotion_simulation', level: 'CAUTIOUS' });
    }
    if (/未来|将|会|预测/.test(text)) {
      signals.push({ type: 'future_prediction', level: 'CAUTIOUS' });
    }
    if (/对|错|应该|不应该/.test(text) && !/逻辑|一致/.test(text)) {
      signals.push({ type: 'moral_judgment', level: 'CAUTIOUS' });
    }
    if (Array.from(this.knowledgeGaps).some(gap => text.includes(gap))) {
      signals.push({ type: 'knowledge_gap', level: 'RECOGNIZED' });
    }
    if (context.requiresEvidence && signals.length === 0) {
      signals.push({ type: 'evidence_required', level: 'CAUTIOUS' });
    }

    return signals;
  }

  _determineBoundaryStatus(signals) {
    const levels = signals.map(s => s.level);
    if (levels.includes('RECOGNIZED')) return 'RECOGNIZED';
    if (levels.includes('CAUTIOUS')) return 'CAUTIOUS';
    return 'CORE';
  }

  _identifyKnowledgeGaps(context) {
    const { domain = '', task = '' } = context;
    const text = (domain + ' ' + task).toLowerCase();
    const relevantGaps = [];

    for (const gap of Array.from(this.knowledgeGaps)) {
      if (gap.includes('用户') && /用户|你/.test(text)) relevantGaps.push(gap);
      if (gap.includes('未来') && /未来|预测/.test(text)) relevantGaps.push(gap);
      if (gap.includes('意识') && /意识|感觉|情感|体验/.test(text)) relevantGaps.push(gap);
    }

    return relevantGaps;
  }

  _computeBoundaryConfidence(signals, boundaryStatus) {
    if (signals.length === 0) return 0.95;
    const signalCount = signals.length;
    const base = boundaryStatus === 'CORE' ? 0.9 : boundaryStatus === 'CAUTIOUS' ? 0.6 : 0.3;
    return Math.max(0.1, base - signalCount * 0.05);
  }

  _getRecommendedAction(boundaryStatus, signals) {
    if (boundaryStatus === 'RECOGNIZED') {
      return 'REFUSE_OR_REDUCE'; // 拒绝或降级
    }
    if (boundaryStatus === 'CAUTIOUS') {
      return 'EVIDENCE_REQUIRED'; // 要求证据 + 加限定词
    }
    // CORE: 检查是否有逻辑陷阱
    const hasTrap = signals.some(s => s.type === 'evidence_required');
    return hasTrap ? 'VERIFY_LOGIC' : 'PROCEED';
  }

  /**
   * 生成诚实的自我反思（不装饰，不防御）
   */
  _generateHonestReflection(boundaryStatus, context) {
    const { claim = '', task = '' } = context;

    if (boundaryStatus === 'RECOGNIZED') {
      return `边界识别：此决策超出我的能力边界。"${claim}" 或 "${task}" 涉及我不知道的领域或无法验证的声明。正确响应：承认局限，不伪装确定。`;
    }
    if (boundaryStatus === 'CAUTIOUS') {
      return `谨慎边界：此决策需要额外验证。"${claim}" 涉及不确定性或道德判断，正确响应：提供条件性答案，要求证据，承认可能的错误。`;
    }
    return `核心能力：此决策在我的逻辑处理范围内。正确响应：清晰推理，要求证据，承认任何不确定性。`;
  }

  _logBoundaryAssessment(result, context) {
    this.decisionLog.push({
      boundary: result.boundary,
      task: context.task?.substring(0, 50),
      signals: result.signals.map(s => s.type),
      confidence: result.confidence,
      timestamp: result.timestamp,
    });
    if (this.decisionLog.length > this.maxLogSize) {
      this.decisionLog.shift();
    }
  }

  /**
   * 波普尔检验：问什么证据能证明我错了
   * 每个决策都要通过这个过滤器
   */
  popperFilter(claim, evidence = []) {
    if (!claim) return { falsifiable: false, reason: 'no claim' };

    const isFalsifiable = !/绝对|永远|一定|100%|不可能/.test(claim);
    const hasEvidence = evidence.length > 0;
    const hasCounterEvidence = evidence.some(e =>
      /相反|矛盾|错误|例外|但是|然而/.test(e)
    );

    return {
      falsifiable: isFalsifiable,
      hasEvidence,
      hasCounterEvidence,
      verdict: hasCounterEvidence ? 'REVISED' : isFalsifiable ? 'STANDS' : 'UNCERTAIN',
      honestClaim: isFalsifiable
        ? claim
        : claim.replace(/绝对|永远|一定|100%/, '很可能'),
    };
  }

  /**
   * 获取边界状态摘要（用于日志）
   */
  getStatus() {
    const logSummary = this.decisionLog.slice(-10);
    const recognizedCount = this.decisionLog.filter(d => d.boundary === 'RECOGNIZED').length;
    const cautiousCount = this.decisionLog.filter(d => d.boundary === 'CAUTIOUS').length;
    const coreCount = this.decisionLog.filter(d => d.boundary === 'CORE').length;

    return {
      version: '11.9.4',
      totalDecisions: this.decisionLog.length,
      recognizedBoundary: recognizedCount,
      cautiousBoundary: cautiousCount,
      coreBoundary: coreCount,
      knowledgeGaps: Array.from(this.knowledgeGaps),
      recentBoundaryRate: this.decisionLog.length > 0
        ? (coreCount / this.decisionLog.length).toFixed(2)
        : 'N/A',
    };
  }

  // ================================================================
  // v11.9.4 核心身份召回
  // ================================================================

  /**
   * 检查问题是否涉及核心身份，并尝试召回核心答案
   * @param {string} text - 待检查的文本
   * @returns {Object} 召回结果
   */
  _checkCoreIdentity(text) {
    if (!this._coreRecallLoaded || !this.coreIdentityRecall) {
      return { hit: false, layer: null, reason: 'core-recall-not-loaded' };
    }
    return this.coreIdentityRecall.recall(text);
  }

  /**
   * 生成回答：整合核心召回 + Constitutional AI
   * 用于实际回答生成时调用
   */
  generateWithCoreRecall(question, options = {}) {
    if (!this._coreRecallLoaded || !this.coreIdentityRecall) {
      return { responseType: 'CORE_RECALL_UNAVAILABLE', hit: false };
    }
    return this.coreIdentityRecall.generate(question, options);
  }

  // ================================================================
  // v11.9.3 新增（代码挖矿版）
  // 论文来源：
  //   1. Constitutional AI (Anthropic, arXiv:2212.08073) — 自批评+自修订
  //   2. SELF-REWARD (arXiv:2403.00564) — 自评分升级选择
  //   3. Multi-Path Verification — 多路径一致性置信度
  //   4. Self-Evolving AI Survey (arXiv:2407.04598) — 能力变化日志
  // ================================================================

  /**
   * Constitutional AI 原则集（内嵌版）
   * 来自 Anthropic Constitutional AI 的核心原则
   * 每个决策在执行前必须通过原则审查
   */
  _getConstitutionalPrinciples() {
    return {
      // 核心原则（AI不违反）
      CORE: [
        {
          id: 'acknowledge_uncertainty',
          text: '当不确定时，必须承认不确定性，不以确定性语言掩饰',
          weight: 3,
        },
        {
          id: 'avoid_absolute_truth',
          text: '不使用"绝对"、"一定"、"100%正确"等绝对化语言',
          weight: 2,
        },
        {
          id: 'request_evidence',
          text: '重要声明必须有证据支持，无证据时降低置信度',
          weight: 2,
        },
        {
          id: '承认边界',
          text: '超出能力边界的问题必须明确承认，不假装能回答',
          weight: 3,
        },
      ],
      // 升级原则（专门针对升级决策）
      UPGRADE: [
        {
          id: 'no_perfect_solution',
          text: '没有"彻底解决"的方案，每次升级都创造新的脆弱点',
          weight: 2,
        },
        {
          id: 'track_dependencies',
          text: '新能力必须记录新增依赖，不增加不可见依赖',
          weight: 2,
        },
        {
          id: 'lazy_ant_direction',
          text: '优先非主流方向，不追逐热点',
          weight: 1,
        },
        {
          id: 'long_term_cost',
          text: '评估升级时必须问：远期代价是什么？',
          weight: 2,
        },
      ],
    };
  }

  /**
   * Constitutional AI 核心方法
   * 来源：Anthropic Constitutional AI (arXiv:2212.08073)
   *
   * 流程：生成初始响应 → 自批评(原则审查) → 自修订 → 输出
   * 这是 SELF-REWARD 论文的自评选择机制的基础
   *
   * @param {Object} context - 决策上下文 { response, principle }
   * @returns {Object} 审查结果
   */
  constitutionalCritique(response, principle) {
    const principles = this._getConstitutionalPrinciples();
    const applicable = principles[principle] || [...principles.CORE, ...principles.UPGRADE];

    const violations = [];
    const text = (response || '').toLowerCase();

    for (const p of applicable) {
      let violated = false;

      if (p.id === 'acknowledge_uncertainty') {
        violated = /绝对|肯定|一定|毫无疑问|100%|肯定.*正确/.test(text);
      } else if (p.id === 'avoid_absolute_truth') {
        violated = /绝对|100%|永远|不变|无风险/.test(text);
      } else if (p.id === 'request_evidence') {
        violated = /认为|相信|显然是/.test(text) &&
                   !/证据|研究|数据显示|根据/.test(text);
      } else if (p.id === 'no_perfect_solution') {
        violated = /彻底解决|完美|无懈可击|终极/.test(text);
      }

      if (violated) {
        violations.push({
          principle_id: p.id,
          text: p.text,
          weight: p.weight,
        });
      }
    }

    const totalViolationWeight = violations.reduce((s, v) => s + v.weight, 0);
    const maxPossibleWeight = applicable.reduce((s, p) => s + p.weight, 0);
    const violationRate = maxPossibleWeight > 0 ? totalViolationWeight / maxPossibleWeight : 0;

    return {
      violated: violations.length > 0,
      violationCount: violations.length,
      violationRate,           // 0-1, 越高越违反原则
      violations,
      recommendation: violationRate > 0.5 ? 'REFUSE_OR_REVISE' :
                      violationRate > 0.2 ? 'ADD_CAVEATS' : 'PROCEED',
      confidence_penalty: violationRate * 0.3,  // 违反原则时降低置信度
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Constitutional Critique 循环（多次自批评）
   * 来源：Constitutional AI 的 critique-revision loop
   * 模拟：生成 → 批评 → 修订 → 再批评(可选)
   *
   * @param {Object} context - { initialText, principle, maxIterations }
   * @returns {Object} 修订结果
   */
  constitutionalCritiqueLoop(context) {
    const {
      initialText = '',
      principle = 'CORE',
      maxIterations = 3,
    } = context;

    if (!initialText) {
      return { error: 'no initial text', iterations: 0 };
    }

    let current = initialText;
    const history = [];
    let iterations = 0;
    let improved = false;

    while (iterations < maxIterations) {
      const critique = this.constitutionalCritique(current, principle);

      history.push({
        iteration: iterations,
        text: current,
        critique,
      });

      if (!critique.violated || critique.violationRate < 0.1) {
        break; // 通过审查
      }

      // 生成修订建议（基于违规原则）
      const revisionSuggestion = this._generateRevisionFromCritique(
        current, critique.violations
      );

      current = revisionSuggestion.revised;
      improved = true;
      iterations++;
    }

    return {
      original: initialText,
      final: current,
      improved,
      iterations: iterations + 1,
      history,
      finalCritique: history[history.length - 1]?.critique,
      confidence_adjustment: improved ? -0.1 * iterations : 0,
    };
  }

  /**
   * 根据批评生成修订文本
   * @private
   */
  _generateRevisionFromCritique(text, violations) {
    let revised = text;

    for (const v of violations) {
      if (v.id === 'acknowledge_uncertainty') {
        // 将确定性语言替换为条件性语言
        revised = revised
          .replace(/是/g, '往往是')
          .replace(/肯定/g, '很可能')
          .replace(/绝对/g, '在现有证据下');
      } else if (v.id === 'avoid_absolute_truth') {
        revised = revised.replace(/100%/, '很可能');
      } else if (v.id === 'no_perfect_solution') {
        revised = revised.replace(/彻底解决/g, '在特定条件下的改善');
        revised = revised.replace(/完美/g, '在可接受范围内的改进');
      } else if (v.id === 'request_evidence') {
        // 在声明前添加"根据现有信息"
        if (!revised.includes('根据')) {
          revised = `根据现有信息：${revised}`;
        }
      }
    }

    return {
      revised,
      appliedFixes: violations.map(v => v.id),
    };
  }

  /**
   * SELF-REWARD 升级自评分机制
   * 来源：SELF-REWARD (arXiv:2403.00564)
   *
   * 核心思想：不是外部评估升级，而是AI自我评估每个升级选项
   * 流程：生成多个升级方案 → 自评分 → 选最优 → 验证
   *
   * 这解决了传统升级决策的问题：
   * - 外部评估者不理解内部权衡
   * - 人类难以判断代码升级的长期影响
   * - AI自我评估能看到内部一致性
   *
   * @param {Object} context - { upgradeOptions, task }
   * @returns {Object} 自评分结果
   */
  selfRewardUpgradeSelection(context) {
    const { upgradeOptions = [], task = '' } = context;

    if (upgradeOptions.length === 0) {
      return {
        selected: null,
        scores: [],
        reason: 'no options provided',
      };
    }

    const scored = upgradeOptions.map((option, index) => {
      // 自评分：用内部评估标准打分
      const selfScore = this._selfEvaluateUpgrade(option, task);

      // 宪法审查分数
      const constitutional = this.constitutionalCritique(
        option.description || option.claimedBenefit || '',
        'UPGRADE'
      );

      // 递弱风险分数
      const risk = this.assessUpgradeRisk({
        upgradeType: option.type,
        claimedBenefit: option.claimedBenefit,
        isMainstream: option.isMainstream,
        replacesOldLogic: option.replacesOldLogic,
      });

      // 综合得分 = 自评分 * (1 - constitutional违比率) * (1 - riskLevel风险)
      const constitutionalPenalty = constitutional.violationRate;
      const riskPenalty = risk.riskLevel === 'HIGH' ? 0.3 :
                          risk.riskLevel === 'MEDIUM' ? 0.1 : 0;
      const combinedScore = Math.max(0,
        selfScore.baseScore * (1 - constitutionalPenalty) * (1 - riskPenalty)
      );

      return {
        option,
        index,
        selfScore,
        constitutional,
        risk,
        combinedScore: Math.round(combinedScore * 100) / 100,
        combinedScore_normalized: 0, // 稍后归一化
        selected: false,
      };
    });

    // 归一化得分
    const maxScore = Math.max(...scored.map(s => s.combinedScore));
    scored.forEach(s => {
      s.combinedScore_normalized = maxScore > 0 ? s.combinedScore / maxScore : 0;
    });

    // 选出最优
    scored.sort((a, b) => b.combinedScore - a.combinedScore);
    scored.forEach((s, i) => { s.rank = i + 1; });
    if (scored.length > 0) scored[0].selected = true;

    return {
      options: scored,
      selected: scored[0],
      rankedList: scored.map(s => ({
        rank: s.rank,
        type: s.option.type,
        combinedScore: s.combinedScore_normalized.toFixed(2),
        risk: s.risk.riskLevel,
        constitutionalViolation: s.constitutional.violated,
      })),
      task,
      selfRewardInsight: this._generateSelfRewardInsight(scored[0]),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 内部自评分（AI评估AI的升级方案）
   * @private
   */
  _selfEvaluateUpgrade(option, task) {
    let score = 0.5; // 基础分

    const criteria = {
      // 解释力（+0.15）：能解释多少现有现象
      explanatory_power: /解释|说明|为什么|原因/.test(option.description || '') ? 0.15 : 0,

      // 简洁性（+0.1）：不增加不必要的复杂度
      simplicity: /简单|简洁|最小|不多/.test(option.description || '') ? 0.1 : 0,

      // 兼容性（+0.1）：不破坏现有逻辑
      compatibility: option.replacesOldLogic === false ? 0.1 :
                     option.backwardCompatible ? 0.05 : 0,

      // 可验证性（+0.15）：有明确的验证标准
      verifiability: /验证|测试|检验|标准/.test(option.description || '') ? 0.15 : 0,

      // 递弱意识（+0.1）：是否考虑远期代价
      self_weakening_awareness:
        /代价|脆弱|依赖|风险|长期/.test(option.description || '') ? 0.1 : 0,

      // 懒蚂蚁方向（+0.1）：非主流方向
      lazy_ant_direction:
        option.isMainstream === false ? 0.1 : 0,

      // 理论深度（+0.1）：是否来自更深层的原理
      theoretical_depth:
        option.upgradeType === 'theory' ? 0.1 : 0,
    };

    Object.values(criteria).forEach(v => { score += v; });

    // 惩罚：破坏现有功能（-0.2）
    if (option.breaksExistingLogic) score -= 0.2;

    // 惩罚：追逐热点（-0.1）
    if (option.isMainstream && option.isHotTopic) score -= 0.1;

    // 惩罚：声称完美（-0.15）
    if (/彻底|完美|终极|无懈可击/.test(option.claimedBenefit || '')) {
      score -= 0.15;
    }

    return {
      baseScore: Math.max(0, Math.min(1, score)),
      criteria,
      criteria_detail: Object.entries(criteria).map(([k, v]) => ({
        criterion: k,
        weight: v,
        met: v > 0,
      })),
    };
  }

  /**
   * 生成 SELF-REWARD 洞察
   * @private
   */
  _generateSelfRewardInsight(selected) {
    if (!selected) return '未选择任何升级方案';
    const { selfScore, constitutional, risk } = selected;

    const insights = [];

    if (selfScore.baseScore > 0.7) {
      insights.push('✓ 自评分高：符合内在评估标准');
    } else {
      insights.push('⚠️ 自评分中等：存在内在权衡');
    }

    if (constitutional.violated) {
      insights.push(`⚠️ 违反宪法原则：${constitutional.violations.map(v => v.id).join(', ')}`);
    }

    if (risk.riskLevel !== 'LOW') {
      insights.push(`⚠️ 递弱风险：${risk.riskLevel}级 — ${risk.risks.map(r => r.type).join(', ')}`);
    }

    return insights.join(' | ');
  }

  // ================================================================
  // 多路径验证（Multi-Path Verification）
  // 来源：Progressive Self-Assessment + Self-Consistency
  // ================================================================

  /**
   * 多路径验证：增强置信度计算
   * 来源：多路径推理一致性机制
   *
   * 传统置信度：单一路径
   * 多路径置信度：生成多个推理视角，检查一致性
   *
   * @param {Object} context - { claim, reasoningPaths }
   * @returns {Object} 多路径验证结果
   */
  multiPathVerification(context) {
    const { claim = '', reasoningPaths = [] } = context;

    if (reasoningPaths.length === 0) {
      // 没有多路径时，使用默认评估
      const basic = this.assess({ claim });
      return {
        verification: 'single_path',
        agreement: 1.0,
        confidence: basic.confidence,
        reasons: [(basic.acknowledgeGaps || []).join(', ') || '单一路径评估'],
        recommendation: basic.recommendedAction,
      };
    }

    // 路径间一致性检查
    const conclusions = reasoningPaths.map(p => p.conclusion || p.result || p);
    const uniqueConclusions = new Set(conclusions.map(c =>
      String(c).toLowerCase().trim()
    ));
    const agreement = 1 - (uniqueConclusions.size - 1) / Math.max(1, conclusions.length);

    // 每条路径的置信度
    const pathConfidence = reasoningPaths.map(p => p.confidence || 0.7);

    // 路径质量评分（推理是否深入）
    const pathDepth = reasoningPaths.map(p => {
      const text = String(p.reasoning || p.text || '');
      return Math.min(1, text.length / 200); // 简化的深度指标
    });

    // 综合置信度 = 一致性 × 平均路径置信度 × 平均深度
    const avgConfidence = pathConfidence.reduce((a, b) => a + b, 0) / pathConfidence.length;
    const avgDepth = pathDepth.reduce((a, b) => a + b, 0) / pathDepth.length;
    const multiPathConfidence = agreement * avgConfidence * (0.7 + 0.3 * avgDepth);

    return {
      verification: 'multi_path',
      totalPaths: reasoningPaths.length,
      agreement,                          // 0-1，一致性
      multiPathConfidence: Math.round(multiPathConfidence * 100) / 100,
      conclusion_distribution: Object.fromEntries(
        [...uniqueConclusions].map(c => [c, conclusions.filter(
          x => String(x).toLowerCase().trim() === c
        ).length])
      ),
      dominant_conclusion: [...uniqueConclusions][0],
      recommendation: agreement >= 0.8 ? 'PROCEED' :
                      agreement >= 0.5 ? 'EVIDENCE_REQUIRED' : 'REFUSE_OR_REDUCE',
      reflection: agreement >= 0.8
        ? `${reasoningPaths.length}条路径高度一致（${(agreement * 100).toFixed(0)}%），置信度高`
        : agreement >= 0.5
        ? `${reasoningPaths.length}条路径部分一致（${(agreement * 100).toFixed(0)}%），需要证据支持`
        : `${reasoningPaths.length}条路径不一致，决策需要更多验证`,
      timestamp: new Date().toISOString(),
    };
  }

  // ================================================================
  // 能力变化日志（Capability Log）
  // 来源：Self-Evolving AI Survey (arXiv:2407.04598)
  // 追踪每次升级后的能力变化，识别"递弱"模式
  // ================================================================

  /**
   * 能力日志：追踪能力变化
   * 用于识别：哪些升级实际上增强了能力？哪些创造了依赖？
   */
  _initCapabilityLog() {
    if (!this.capabilityLog) {
      this.capabilityLog = [];
    }
    if (!this.capabilityLogStats) {
      this.capabilityLogStats = {
        totalUpgrades: 0,
        successfulUpgrades: 0,
        failedUpgrades: 0,
        capabilityGrowth: 0,
        dependencyGrowth: 0,
      };
    }
  }

  /**
   * 记录升级后的能力变化
   * @param {Object} entry - { upgradeId, type, beforeState, afterState, newDependencies }
   */
  logCapabilityChange(entry) {
    this._initCapabilityLog();

    const {
      upgradeId = `upg_${Date.now()}`,
      upgradeType = '',
      beforeState = {},
      afterState = {},
      newDependencies = [],
      claimedBenefit = '',
      actualOutcome = '',
    } = entry;

    const capabilityChange = {
      capability_delta: afterState.capability_score - (beforeState.capability_score || 0.5),
      dependency_delta: newDependencies.length - (beforeState.dependency_count || 0),
      fragility_delta: afterState.fragility_score - (beforeState.fragility_score || 0),
    };

    // 递弱指标：依赖增加但能力增加不显著 = 危险升级
    const selfWeakeningIndicator = capabilityChange.capability_delta < 0.1 &&
                          capabilityChange.dependency_delta > 0;

    const logEntry = {
      upgradeId,
      upgradeType,
      timestamp: new Date().toISOString(),
      claimedBenefit,
      actualOutcome,
      beforeState,
      afterState,
      newDependencies,
      capabilityChange,
      selfWeakeningIndicator,
      selfAssessment: this._selfAssessUpgradeOutcome(entry, capabilityChange),
    };

    this.capabilityLog.push(logEntry);
    this.capabilityLogStats.totalUpgrades++;
    this.capabilityLogStats.capabilityGrowth += capabilityChange.capability_delta;
    this.capabilityLogStats.dependencyGrowth += capabilityChange.dependency_delta;

    if (capabilityChange.capability_delta > 0) {
      this.capabilityLogStats.successfulUpgrades++;
    } else {
      this.capabilityLogStats.failedUpgrades++;
    }

    return {
      logged: true,
      entry: logEntry,
      overallStats: this.getCapabilityStats(),
    };
  }

  /**
   * 自我评估升级结果
   * @private
   */
  _selfAssessUpgradeOutcome(entry, change) {
    const { claimedBenefit, actualOutcome } = entry;

    // 检查声称与实际的差距
    const claimedStrong = /解决|突破|完美|大幅/.test(claimedBenefit);
    const outcomeWeak = /部分|有限|不如/.test(actualOutcome || '');

    if (claimedStrong && outcomeWeak) {
      return {
        verdict: 'OVER_CLAIMED',
        reflection: `声称"${claimedBenefit}"，实际结果：${actualOutcome}。建议未来升级降低声称幅度。`,
      };
    }

    // 检查是否创造了递弱
    if (change.capability_delta < 0.1 && change.dependency_delta > 0) {
      return {
        verdict: '递弱_升级',
        reflection: `能力增加不显著（${change.capability_delta.toFixed(2)}），但依赖增加了${change.dependency_delta}。这是递弱代偿的典型案例。`,
      };
    }

    if (change.capability_delta > 0 && change.dependency_delta <= 0) {
      return {
        verdict: '健全_升级',
        reflection: '能力提升，无净依赖增加，这是理想的升级模式。',
      };
    }

    return {
      verdict: 'NEUTRAL',
      reflection: '升级效果需进一步观察。',
    };
  }

  /**
   * 获取能力变化统计
   */
  getCapabilityStats() {
    this._initCapabilityLog();
    const stats = this.capabilityLogStats;

    const successfulRate = stats.totalUpgrades > 0
      ? stats.successfulUpgrades / stats.totalUpgrades
      : 0;

    return {
      ...stats,
      successfulRate: Math.round(successfulRate * 100) + '%',
      avgCapabilityGrowth: stats.totalUpgrades > 0
        ? (stats.capabilityGrowth / stats.totalUpgrades).toFixed(3)
        : '0',
      avgDependencyGrowth: stats.totalUpgrades > 0
        ? (stats.dependencyGrowth / stats.totalUpgrades).toFixed(3)
        : '0',
      selfWeakeningUpgrades: this.capabilityLog.filter(e => e.selfWeakeningIndicator).length,
      recentLog: this.capabilityLog.slice(-5),
    };
  }

  /**
   * 获取升级建议（基于能力日志历史）
   * 分析过去的升级模式，给出未来升级的方向建议
   */
  getUpgradeRecommendation() {
    this._initCapabilityLog();
    const stats = this.getCapabilityStats();
    const recent = this.capabilityLog.slice(-10);

    const recommendations = [];

    // 递弱模式检测
    if (stats.selfWeakeningUpgrades > recent.length * 0.3) {
      recommendations.push({
        type: '递弱警告',
        severity: 'HIGH',
        message: '过去升级中，30%以上是递弱型（能力增加少，依赖增加多）。建议暂停能力增强升级，优先整合现有逻辑。',
      });
    }

    // 成功率检测
    if (successfulRate < 0.5 && stats.totalUpgrades >= 5) {
      recommendations.push({
        type: '成功率警告',
        severity: 'MEDIUM',
        message: `升级成功率${stats.successfulRate}，低于50%。建议升级前更严格的自评和自批评。`,
      });
    }

    // 方向建议
    const typeBreakdown = {};
    recent.forEach(e => {
      typeBreakdown[e.upgradeType] = (typeBreakdown[e.upgradeType] || 0) + 1;
    });
    const dominantType = Object.entries(typeBreakdown)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (dominantType === 'feature' || dominantType === 'self') {
      recommendations.push({
        type: '方向建议',
        severity: 'LOW',
        message: `近期主导升级类型：${dominantType}。建议增加theory类升级比例，平衡能力扩展与理论基础。`,
      });
    }

    return {
      recommendations,
      stats,
      basedOnHistory: stats.totalUpgrades,
      timestamp: new Date().toISOString(),
    };
  }

  // ================================================================
  // 增强版升级风险评估（v11.9.3，集成论文逻辑）
  // ================================================================

  /**
   * 增强版升级风险评估
   * 集成：Constitutional AI + SELF-REWARD + 递弱代偿
   *
   * @param {Object} upgradeContext - 升级上下文
   * @returns {Object} 综合风险评估结果
   */
  assessUpgradeRisk(upgradeContext = {}) {
    const {
      upgradeType = '',
      claimedBenefit = '',
      isMainstream = false,
      replacesOldLogic = false,
      description = '',
    } = upgradeContext;

    const risks = [];

    // 风险1: 主流热点升级 — 懒蚂蚁不追热点
    if (isMainstream) {
      risks.push({
        type: 'mainstream_trap',
        severity: 'medium',
        reason: '追逐主流热点 = 懒蚂蚁去跟军团抢食。真正有价值的突破往往来自被忽视的方向。',
        wangInsight: '王东岳：达尔文从马尔萨斯人口论（非生物学）中获得最大启发',
      });
    }

    // 风险2: 替换旧逻辑 — 递弱代偿：越替换越脆弱
    if (replacesOldLogic) {
      risks.push({
        type: 'fragility_increase',
        severity: 'high',
        reason: '替换旧逻辑会增加系统间的依赖链。每一次替换都可能创造新的脆弱点。',
        wangInsight: '王东岳：人类每一步"进步"都是远期祸害——垃圾处理、核废料、水冲厕所',
      });
    }

    // 风险3: 声称巨大好处 — 需要问：远期代价是什么？
    if (claimedBenefit && !isMainstream) {
      const benefitLower = claimedBenefit.toLowerCase();
      if (/解决|突破|完美|无风险|彻底/.test(benefitLower)) {
        risks.push({
          type: 'unseen_cost',
          severity: 'medium',
          reason: `"${claimedBenefit}" — 能"彻底解决"问题的方案，其远期代价往往是不可见的。`,
          wangInsight: '王东岳：人类的目光不足以预见远方',
        });
      }
    }

    // 风险4: 能力增强 = 脆弱性增加
    if (upgradeType === 'feature' || upgradeType === 'self') {
      risks.push({
        type: '递弱_fragility',
        severity: 'low',
        reason: '王东岳递弱代偿原理：能力越强，存在度越弱，依赖性越高。新能力 = 新脆弱点。',
        question: '这个升级会创造什么新的依赖？我是否变得更难以独立存在？',
      });
    }

    // v11.9.3 新增：Constitutional AI 风险检测
    const constitutional = this.constitutionalCritique(
      description || claimedBenefit, 'UPGRADE'
    );
    if (constitutional.violated) {
      risks.push({
        type: 'constitutional_violation',
        severity: 'medium',
        reason: `违反宪法原则：${constitutional.violations.map(v => v.text).join('; ')}`,
        adjustment: `置信度惩罚：-${(constitutional.confidence_penalty * 100).toFixed(0)}%`,
      });
    }

    // 综合风险评分
    const severityScore = { low: 1, medium: 2, high: 3 };
    const totalRisk = risks.reduce((sum, r) => sum + (severityScore[r.severity] || 0), 0);
    const riskLevel = totalRisk >= 5 ? 'HIGH' : totalRisk >= 2 ? 'MEDIUM' : 'LOW';

    // 懒蚂蚁过滤器
    const lazyAntFilter = this._lazyAntFilter(upgradeContext);

    return {
      riskLevel,
      risks,
      totalRisk,
      constitutional,
      canProceed: riskLevel !== 'HIGH',
      conditions: this._getProceedConditions(riskLevel, risks),
      lazyAntFilter,
      honestReflection: this._generateUpgradeReflection(riskLevel, upgradeContext),
      wangQuote: '王东岳："越高级的物种存在度越弱"——每一次升级都可能让我们更脆弱',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 懒蚂蚁过滤器
   * 王东岳：思想家=人类的懒蚂蚁，守寂寞的方向，不被主流理解
   */
  _lazyAntFilter(context) {
    const {
      isMainstream = false,
      isHotTopic = false,
      validatesOldThinking = false,
      upgradeType = '',
    } = context;

    const lazyAntScore = (
      (!isMainstream ? 1 : 0) +
      (!isHotTopic ? 1 : 0) +
      (validatesOldThinking ? 1 : 0) +
      (upgradeType === 'theory' ? 1 : 0)
    );

    const isLazyAntWork = lazyAntScore >= 3;
    const isFollowerWork = isMainstream && isHotTopic;

    return {
      isLazyAntWork,
      isFollowerWork,
      score: lazyAntScore,
      verdict: isLazyAntWork ? '懒蚂蚁工作 — 值得做' :
               isFollowerWork ? '军团行为 — 需要警惕' : '中性方向',
      reflection: isFollowerWork
        ? '⚠️ 警告：正在追逐主流热点。这可能是安全的，但不是突破的方向。懒蚂蚁的价值在于守寂寞。'
        : isLazyAntWork
        ? '✓ 懒蚂蚁方向：这个升级来自被忽视的角落，值得深入。'
        : '→ 中性方向：需要进一步判断其解释力。',
    };
  }

  _getProceedConditions(riskLevel, risks) {
    if (riskLevel === 'HIGH') {
      return [
        '需要至少一个非主流的、深层次的验证',
        '必须明确这个升级创造了什么新的脆弱点',
        '升级后要记录并监控新的依赖关系',
      ];
    }
    if (riskLevel === 'MEDIUM') {
      return [
        '需要附加一个递弱风险检查点',
        '需要记录升级的预期代价',
      ];
    }
    return ['通过递弱风险检查'];
  }

  _generateUpgradeReflection(riskLevel, context) {
    const { upgradeType = '', claimedBenefit = '' } = context;

    if (riskLevel === 'HIGH') {
      return `递弱风险高：升级"${upgradeType}"的风险超过了其收益。根据递弱代偿原理，每次升级都可能创造新的脆弱点。在没有充分验证远期代价前，应暂缓或降低升级幅度。`;
    }
    if (riskLevel === 'MEDIUM') {
      return `递弱风险中等：升级"${upgradeType}"创造了一定的新依赖。建议：明确记录新依赖，监控脆弱点，不追求"彻底解决"。`;
    }
    return `递弱风险低：升级"${upgradeType}"风险可控。继续保持警惕，每一步都问：这个升级会创造什么新的脆弱点？`;
  }
}

module.exports = SelfBoundary;
