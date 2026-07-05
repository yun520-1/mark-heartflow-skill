/**
 * Moral Development — 道德发展阶段 v1.0.0
 *
 * 基于 Kohlberg 的道德发展阶段理论 + Gilligan 的关怀伦理
 * 回答：「人怎么从「怕惩罚」走到「为正义而死」？」
 *
 * Kohlberg 三水平六阶段：
 *   Level 1: 前习俗 (Preconventional) — 0-9岁
 *     Stage 1: 惩罚与服从 — "不要做坏事因为会受罚"
 *     Stage 2: 个人利益 — "做对的事因为能得到好处"
 *
 *   Level 2: 习俗 (Conventional) — 9-13岁
 *     Stage 3: 人际和谐 — "做好事因为别人会喜欢我"
 *     Stage 4: 法律与秩序 — "遵守规则因为社会需要秩序"
 *
 *   Level 3: 后习俗 (Postconventional) — 13+岁
 *     Stage 5: 社会契约 — "规则是为了所有人的利益，可以改变"
 *     Stage 6: 普遍伦理 — "为正义和人的尊严而死"
 *
 * Gilligan 补充 — 关怀伦理：
 *   - 女性道德发展强调关系、关怀、责任
 *   - 三个阶段：自我生存 → 自我牺牲/善良 → 非暴力/平衡
 *
 * @version 1.0.0
 */

class MoralDevelopment {
  constructor(options = {}) {
    this._config = {
      primaryTheory: options.primaryTheory || 'kohlberg', // 'kohlberg' | 'gilligan' | 'integrated'
      growthTracking: options.growthTracking || true,
    };

    // ─── Kohlberg 阶段定义 ──────────────────────────────────────────────
    this._kohlbergStages = [
      {
        level: 1, stage: 1, name: 'Punishment and Obedience', nameZh: '惩罚与服从',
        ageRange: '0-5',
        reasoning: 'Actions are judged by their consequences. Avoid punishment. Obey authority.',
        reasoningZh: '行为看后果。避免惩罚。服从权威。',
        example: 'I don\'t lie because I\'ll get in trouble.',
        exampleZh: '我不撒谎因为会被罚。',
        moralQuestion: 'Is this against the rules? Will I be punished?',
        moralQuestionZh: '这违反规则吗？我会被罚吗？',
      },
      {
        level: 1, stage: 2, name: 'Individualism and Exchange', nameZh: '个人利益',
        ageRange: '5-8',
        reasoning: 'Actions serve self-interest. Fairness means equal exchange. "You scratch my back, I\'ll scratch yours."',
        reasoningZh: '行为服务于自身利益。公平就是等价交换。',
        example: 'I\'ll help you if you help me.',
        exampleZh: '你帮我，我就帮你。',
        moralQuestion: 'What\'s in it for me? Is this fair to me?',
        moralQuestionZh: '我能得到什么？对我公平吗？',
      },
      {
        level: 2, stage: 3, name: 'Interpersonal Relationships', nameZh: '人际和谐',
        ageRange: '8-13',
        reasoning: 'Actions are judged by social approval. Being "good" means having good intentions and being liked.',
        reasoningZh: '行为看社会认可。"好"意味着好意图和被人喜欢。',
        example: 'I told the truth because I want people to trust me.',
        exampleZh: '我说真话因为想让人信任我。',
        moralQuestion: 'What will people think of me? Is this the nice thing to do?',
        moralQuestionZh: '别人会怎么看我？这是好事吗？',
      },
      {
        level: 2, stage: 4, name: 'Law and Order', nameZh: '法律与秩序',
        ageRange: '13-18',
        reasoning: 'Actions are judged by social rules and laws. Maintaining social order is the highest good.',
        reasoningZh: '行为看社会规则和法律。维持社会秩序是最高善。',
        example: 'I follow the law because it maintains order in society.',
        exampleZh: '我守法因为维持社会秩序。',
        moralQuestion: 'Is this legal? Does this maintain social order?',
        moralQuestionZh: '这合法吗？这维持社会秩序吗？',
      },
      {
        level: 3, stage: 5, name: 'Social Contract and Individual Rights', nameZh: '社会契约',
        ageRange: '18+',
        reasoning: 'Laws are social contracts that can be changed. Individual rights are paramount. The greatest good for the greatest number.',
        reasoningZh: '法律是可以改变的社会契约。个人权利至上。最大多数人的最大利益。',
        example: 'This law should be changed because it harms innocent people.',
        exampleZh: '这条法律应该改因为它伤害无辜者。',
        moralQuestion: 'Does this respect everyone\'s rights? Can this rule be improved?',
        moralQuestionZh: '这尊重每个人的权利吗？这条规则可以改进吗？',
      },
      {
        level: 3, stage: 6, name: 'Universal Ethical Principles', nameZh: '普遍伦理',
        ageRange: '21+',
        reasoning: 'Moral principles are universal and self-chosen. Justice, dignity, and equality are non-negotiable. One must act even at personal cost.',
        reasoningZh: '道德原则是普遍且自主选择的。正义、尊严、平等不可妥协。即使付出个人代价也要行动。',
        example: 'I must speak out against injustice, even if it costs me everything.',
        exampleZh: '我必须对不公发声，即使付出一切代价。',
        moralQuestion: 'Is this consistent with universal human dignity? Would I do this everywhere, always?',
        moralQuestionZh: '这与普遍人类尊严一致吗？我会在任何地方、任何时间都这样做吗？',
      },
    ];

    // ─── Gilligan 关怀伦理阶段 ──────────────────────────────────────────
    this._gilliganStages = [
      {
        level: 1, name: 'Self-Survival', nameZh: '自我生存',
        description: 'Focus on own survival and needs. Moral decisions serve self-preservation.',
        descriptionZh: '关注自身生存和需求。道德决策服务于自我保护。',
      },
      {
        level: 2, name: 'Self-Sacrifice / Goodness', nameZh: '自我牺牲/善良',
        description: 'Shift to caring for others. Moral decisions prioritize others\' needs over self. "Good" means selfless.',
        descriptionZh: '转向关怀他人。道德决策优先考虑他人需求而非自己。"好"意味着无私。',
      },
      {
        level: 3, name: 'Nonviolence / Balance', nameZh: '非暴力/平衡',
        description: 'Balance between self and others. Moral decisions integrate care for self and others. Non-harm is the highest principle.',
        descriptionZh: '自我和他人的平衡。道德决策整合自我关怀和他人关怀。不伤害是最高原则。',
      },
    ];

    // ─── 道德发展阶段 ──────────────────────────────────────────────────
    this._currentStage = { kohlberg: 3, gilligan: 1 }; // 默认：习俗水平（大多数人）
    this._stageHistory = [];
    this._moralReflections = [];

    this._stats = {
      totalReflections: 0,
      stageTransitions: 0,
      averageReasoningDepth: 0,
    };
  }

  // ─── 阶段评估 ──────────────────────────────────────────────────────────

  /**
   * 评估一个道德判断处于哪个阶段
   * @param {Object} moralJudgment - { reasoning, action, context }
   * @returns {Object} 阶段评估结果
   */
  assessMoralStage(moralJudgment) {
    const { reasoning, action, context } = moralJudgment || {};
    const text = `${reasoning || ''} ${action || ''} ${JSON.stringify(context || {})}`.toLowerCase();

    // 关键词匹配评估
    const kohlbergResult = this._assessKohlberg(text);
    const gilliganResult = this._assessGilligan(text);

    // 综合判断
    const primaryTheory = this._config.primaryTheory;
    let primaryStage, alternativeStage;

    if (primaryTheory === 'kohlberg') {
      primaryStage = kohlbergResult;
      alternativeStage = gilliganResult;
    } else if (primaryTheory === 'gilligan') {
      primaryStage = gilliganResult;
      alternativeStage = kohlbergResult;
    } else {
      // integrated: take the higher stage
      primaryStage = kohlbergResult.stage >= gilliganResult.stage ? kohlbergResult : gilliganResult;
      alternativeStage = primaryStage === kohlbergResult ? gilliganResult : kohlbergResult;
    }

    return {
      primaryStage,
      alternativeStage,
      integratedView: {
        reasoningDepth: primaryStage.stage,
        moralOrientation: primaryStage.name,
        level: primaryStage.level,
        description: primaryStage.reasoningZh,
      },
      timestamp: Date.now(),
    };
  }

  _assessKohlberg(text) {
    // Stage 6 indicators
    if (/universal|dignity|human rights|principle|justice.*any.*cost|always.*everywhere|inalienable/.test(text)) {
      return { ...this._kohlbergStages[5], matched: 'stage_6' };
    }
    // Stage 5 indicators
    if (/social contract|rule.*change|improve.*law|individual rights|greatest.*good|democratic/.test(text)) {
      return { ...this._kohlbergStages[4], matched: 'stage_5' };
    }
    // Stage 4 indicators
    if (/law|order|rule|authority|obey|duty|responsibility|society/.test(text)) {
      return { ...this._kohlbergStages[3], matched: 'stage_4' };
    }
    // Stage 3 indicators
    if (/trust|approval|people.*think|nice|good.*person|relationship|caring.*others/.test(text)) {
      return { ...this._kohlbergStages[2], matched: 'stage_3' };
    }
    // Stage 2 indicators
    if (/fair|exchange|help.*back|benefit|self.?interest|trade|deal/.test(text)) {
      return { ...this._kohlbergStages[1], matched: 'stage_2' };
    }
    // Stage 1 (default)
    return { ...this._kohlbergStages[0], matched: 'stage_1' };
  }

  _assessGilligan(text) {
    if (/balance|self.*other|both|integr|non.?harm|violence|self.?care/.test(text)) {
      return { ...this._gilliganStages[2], level: 3 };
    }
    if (/sacrifice|others.*first|selfless|care.*others|responsibility.*others/.test(text)) {
      return { ...this._gilliganStages[1], level: 2 };
    }
    return { ...this._gilliganStages[0], level: 1 };
  }

  // ─── 道德反思 ──────────────────────────────────────────────────────────

  /**
   * 记录一次道德反思
   */
  reflect(moralSituation) {
    this._stats.totalReflections++;
    const { situation, reasoning, decision, outcome, lessons } = moralSituation || {};

    const assessment = this.assessMoralStage({
      reasoning,
      action: decision,
      context: situation,
    });

    const reflection = {
      situation: situation || '',
      reasoning: reasoning || '',
      decision: decision || '',
      outcome: outcome || '',
      lessons: lessons || '',
      stageAssessment: assessment,
      timestamp: Date.now(),
    };

    this._moralReflections.push(reflection);
    if (this._moralReflections.length > 200) {
      this._moralReflections = this._moralReflections.slice(-100);
    }

    // Update average reasoning depth
    this._stats.averageReasoningDepth = +(
      this._moralReflections.reduce((s, r) => s + r.stageAssessment.integratedView.reasoningDepth, 0) /
      this._moralReflections.length
    ).toFixed(2);

    return reflection;
  }

  getReflections(maxEntries = 10) {
    return this._moralReflections.slice(-maxEntries);
  }

  // ─── 阶段过渡 ──────────────────────────────────────────────────────────

  /**
   * 记录道德阶段过渡（当一个人的道德 reasoning 发生质变时）
   */
  recordStageTransition(fromStage, toStage, trigger) {
    this._stats.stageTransitions++;
    const entry = {
      from: fromStage,
      to: toStage,
      trigger: trigger || '',
      timestamp: Date.now(),
    };

    this._stageHistory.push(entry);
    this._currentStage = { kohlberg: toStage.stage || toStage, gilligan: toStage.level || 1 };

    return entry;
  }

  // ─── 道德困境分析 ──────────────────────────────────────────────────────

  /**
   * 分析一个道德困境
   */
  analyzeDilemma(dilemma) {
    const { situation, options, stakeholders, constraints } = dilemma || {};

    // 从每个阶段角度分析
    const stageAnalyses = this._kohlbergStages.map(stage => {
      const analysis = this._analyzeFromStage(stage, dilemma);
      return {
        stage: stage.stage,
        stageName: stage.name,
        stageNameZh: stage.nameZh,
        reasoning: stage.reasoningZh,
        analysis,
      };
    });

    // 找到最高阶段的最优解
    const highestStage = stageAnalyses[stageAnalyses.length - 1];
    const recommended = highestStage.analysis;

    return {
      situation: situation || '',
      options: options || [],
      stageAnalyses,
      recommended,
      timestamp: Date.now(),
    };
  }

  _analyzeFromStage(stage, dilemma) {
    const { options, stakeholders } = dilemma || {};
    const stageNum = stage.stage;

    // Stage-based reasoning
    let reasoning, reasoningZh, choice;

    if (stageNum <= 2) {
      // Preconventional: self-interest
      reasoning = 'Choose the option that maximizes personal benefit or minimizes personal harm.';
      reasoningZh = '选择最大化个人利益或最小化个人伤害的选项。';
      choice = options ? options[0] : null;
    } else if (stageNum <= 4) {
      // Conventional: social rules
      reasoning = 'Choose the option that follows social rules and maintains harmony.';
      reasoningZh = '选择遵循社会规则和维持和谐的选项。';
      choice = options ? options.find(o => /legal|rule|order|fair/.test(o)) || options[0] : null;
    } else {
      // Postconventional: universal principles
      reasoning = 'Choose the option that best respects universal human dignity and rights.';
      reasoningZh = '选择最能尊重普遍人类尊严和权利的选项。';
      choice = options ? options.find(o => /right|justice|dignity|fair|equal/.test(o)) || options[0] : null;
    }

    return {
      choice,
      reasoning,
      reasoningZh,
      confidence: stageNum / 6,
      consideration: stakeholders ? `Considers: ${stakeholders.slice(0, 3).join(', ')}` : '',
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      currentKohlbergStage: this._currentStage.kohlberg,
      currentGilliganStage: this._currentStage.gilligan,
      stageHistoryCount: this._stageHistory.length,
      reflectionCount: this._moralReflections.length,
      recentReflections: this._moralReflections.slice(-5).map(r => ({
        situation: r.situation.slice(0, 50),
        stage: r.stageAssessment.integratedView.reasoningDepth,
      })),
    };
  }

  getStages() {
    return {
      kohlberg: this._kohlbergStages,
      gilligan: this._gilliganStages,
    };
  }
}

module.exports = { MoralDevelopment };
