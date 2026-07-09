/**
 * ThreePoisons - 贪嗔痴三毒评估模型
 * 来源: HeartFlow 心虫感知引擎
 *
 * 基于心理学与神经科学机制，非佛学定义
 *
 * 贪 (Greed / Lobha):
 *   神经机制: 多巴胺D2受体密度降低 → 奖励阈值升高 → 需要越来越大刺激
 *   心理学:   延迟折扣异常（选择即时小奖励而非延迟大奖励）
 *   表现:     囤积、成瘾、不知足、永远觉得不够
 *   评分维度: wanting_amount, delay_discounting_rate, satiety_threshold, hoarding_tendency
 *
 * 嗔 (Hatred / Dvesha):
 *   神经机制: 杏仁核过度激活 + 前额叶抑制不足 + 血清素水平低
 *   心理学:   敌对归因偏差（hostile attribution bias）、情绪调节缺陷
 *   表现:     易怒、报复、攻击、不能原谅
 *   评分维度: anger_threshold, revenge_urge, forgiveness_rate, hostility_bias
 *
 * 痴 (Delusion / Moha):
 *   神经机制: 前额叶元认知功能低下 + 默认模式网络过度活跃
 *   心理学:   确认偏误、邓宁-克鲁格效应、信念固着
 *   表现:     看不清真相、拒绝承认错误、自我欺骗
 *   评分维度: metacognition_level, confirmation_bias, belief_persistence, self_deception
 *
 * 七情六欲 vs 三毒关系:
 *   七情六欲是中性燃料，三毒是燃料的燃烧方式出了问题（过度/扭曲/失控）
 *   公式: Poison = Desire × DistortionFactor
 *   贪 = 生存欲/物欲/成就欲 × 延迟折扣异常
 *   嗔 = 怒 × 杏仁核过度激活
 *   痴 = 惧 + 不确定性 × 元认知缺陷
 */

const ThreePoisons = {
  // ============================================================
  // 评分维度默认配置
  // ============================================================
  config: {
    // 贪维度 - 默认中性值 (1-10 scale)
    greed: {
      wanting_amount: 5.0,          // 渴望量级：对物质/成就的欲望强度
      delay_discounting_rate: 5.0,  // 延迟折扣率：是否选择即时小利而非延迟大利
      satiety_threshold: 5.0,       // 满足阈值：多少才能感到满足（越高越不知足）
      hoarding_tendency: 5.0,       // 囤积倾向：收集和保留的冲动
      weight: 1.0
    },
    // 嗔维度 - 默认中性值 (1-10 scale)
    hatred: {
      anger_threshold: 5.0,         // 愤怒阈值：多小的事情能激怒（越低越易怒）
      revenge_urge: 5.0,            // 报复冲动：被伤害后报复的欲望强度
      forgiveness_rate: 5.0,        // 原谅能力：多大程度能放下怨恨（越高越能原谅）
      hostility_bias: 5.0,          // 敌对归因偏差：倾向于将中性行为解读为敌意
      weight: 1.0
    },
    // 痴维度 - 默认中性值 (1-10 scale)
    delusion: {
      metacognition_level: 5.0,     // 元认知水平：审视自己思维的能力（越高越好）
      confirmation_bias: 5.0,       // 确认偏误：只寻找支持自己观点的信息
      belief_persistence: 5.0,      // 信念固着：面对反面证据仍坚持信念的程度
      self_deception: 5.0,          // 自我欺骗：回避不愉快真相的程度
      weight: 1.0
    }
  },

  // ============================================================
  // 0. [FORMULA] 公式桥接（贝叶斯/遗忘/熵），懒加载单例
  // ============================================================
  _formulaBridge: null,
  _getFormulaBridge() {
    if (!this._formulaBridge) {
      try {
        const { getFormulaBridge } = require('../formula/formula-bridge.js');
        this._formulaBridge = getFormulaBridge();
      } catch (e) {
        this._formulaBridge = null;
      }
    }
    return this._formulaBridge;
  },

  // ============================================================
  // 1. analyzeGreed - 贪欲分析
  // ============================================================
  /**
   * 分析人物的贪欲状态
   * @param {Object} person - 人物对象，可包含 greed 子对象
   * @param {number} [person.greed.wanting_amount] - 渴望量级 (1-10)
   * @param {number} [person.greed.delay_discounting_rate] - 延迟折扣率 (1-10)
   * @param {number} [person.greed.satiety_threshold] - 满足阈值 (1-10)
   * @param {number} [person.greed.hoarding_tendency] - 囤积倾向 (1-10)
   * @returns {Object} 贪欲分析结果
   */
  analyzeGreed(person) {
    const g = person?.greed || {};
    const defaults = this.config.greed;

    const scores = {
      wanting_amount: clamp(g.wanting_amount ?? defaults.wanting_amount, 1, 10),
      delay_discounting_rate: clamp(g.delay_discounting_rate ?? defaults.delay_discounting_rate, 1, 10),
      satiety_threshold: clamp(g.satiety_threshold ?? defaults.satiety_threshold, 1, 10),
      hoarding_tendency: clamp(g.hoarding_tendency ?? defaults.hoarding_tendency, 1, 10)
    };

    // 贪总分 = 各维度加权平均（满足阈值越高越贪，延迟折扣越高越贪）
    const greedScore = (
      scores.wanting_amount * 0.25 +
      scores.delay_discounting_rate * 0.25 +
      scores.satiety_threshold * 0.25 +
      scores.hoarding_tendency * 0.25
    );

    // 成瘾风险：延迟折扣高 + 渴望高 + 满足阈值高
    const addictionRisk = (
      scores.delay_discounting_rate * 0.4 +
      scores.wanting_amount * 0.3 +
      scores.satiety_threshold * 0.3
    );

    // 延迟折扣异常评估
    const delayDiscountAnomaly = scores.delay_discounting_rate >= 7
      ? '严重延迟折扣异常 — 极度偏好即时满足，无法为长期利益延迟 gratification'
      : scores.delay_discounting_rate >= 5
        ? '中度延迟折扣倾向 — 有时会因即时诱惑放弃长远利益'
        : '延迟折扣正常 — 能够平衡即时与长远利益';

    // 奖励阈值评估
    const rewardThreshold = scores.satiety_threshold >= 7
      ? '奖励阈值显著升高 — 需要越来越大的刺激才能获得满足感，典型多巴胺D2受体下调表现'
      : scores.satiety_threshold >= 5
        ? '奖励阈值轻度偏高 — 容易习惯化，需要适度新鲜感'
        : '奖励阈值正常 — 能从日常中获得满足';

    const severity = this._getSeverity(greedScore);

    return {
      poison: 'greed',
      label: '贪 (Lobha)',
      scores,
      greedScore: round(greedScore, 2),
      addictionRisk: round(addictionRisk, 2),
      delayDiscountAnomaly,
      rewardThreshold,
      severity,
      description: this._greedDescription(severity, scores),
      interpretation: this._greedInterpretation(scores)
    };
  },

  // ============================================================
  // 2. analyzeHatred - 嗔恨分析
  // ============================================================
  /**
   * 分析人物的嗔恨状态
   * @param {Object} person - 人物对象，可包含 hatred 子对象
   * @param {number} [person.hatred.anger_threshold] - 愤怒阈值 (1-10，越低越易怒)
   * @param {number} [person.hatred.revenge_urge] - 报复冲动 (1-10)
   * @param {number} [person.hatred.forgiveness_rate] - 原谅能力 (1-10)
   * @param {number} [person.hatred.hostility_bias] - 敌对归因偏差 (1-10)
   * @returns {Object} 嗔恨分析结果
   */
  analyzeHatred(person) {
    const h = person?.hatred || {};
    const defaults = this.config.hatred;

    const scores = {
      anger_threshold: clamp(h.anger_threshold ?? defaults.anger_threshold, 1, 10),
      revenge_urge: clamp(h.revenge_urge ?? defaults.revenge_urge, 1, 10),
      forgiveness_rate: clamp(h.forgiveness_rate ?? defaults.forgiveness_rate, 1, 10),
      hostility_bias: clamp(h.hostility_bias ?? defaults.hostility_bias, 1, 10)
    };

    // 嗔总分 = 愤怒阈值反向（越低越怒）+ 报复冲动 + 原谅能力反向 + 敌对归因
    // anger_threshold: 越低越易怒 → 用 (11 - value) 转为越高越坏
    const invertedAnger = 11 - scores.anger_threshold;
    const invertedForgiveness = 11 - scores.forgiveness_rate;

    const hatredScore = (
      invertedAnger * 0.25 +
      scores.revenge_urge * 0.25 +
      invertedForgiveness * 0.25 +
      scores.hostility_bias * 0.25
    );

    // 杏仁核过度激活指数
    const amygdalaOveractivation = (
      invertedAnger * 0.5 +
      scores.hostility_bias * 0.5
    );

    // 敌对归因评估
    const hostilityAssessment = scores.hostility_bias >= 7
      ? '严重敌对归因偏差 — 倾向将中性/善意的行为解读为恶意或威胁'
      : scores.hostility_bias >= 5
        ? '轻度敌对归因倾向 — 在不安全情境中容易假设他人有恶意'
        : '敌对归因正常 — 能客观判断他人意图';

    // 情绪调节评估
    const emotionRegulation = scores.anger_threshold <= 3
      ? '情绪调节严重缺陷 — 极小的刺激即引发强烈愤怒反应，前额叶抑制功能不足'
      : scores.anger_threshold <= 5
        ? '情绪调节轻度不足 — 在压力下容易情绪失控'
        : '情绪调节能力良好 — 能在愤怒前进行认知重评';

    const severity = this._getSeverity(hatredScore);

    return {
      poison: 'hatred',
      label: '嗔 (Dvesha)',
      scores,
      hatredScore: round(hatredScore, 2),
      amygdalaOveractivation: round(amygdalaOveractivation, 2),
      hostilityAssessment,
      emotionRegulation,
      severity,
      description: this._hatredDescription(severity, scores),
      interpretation: this._hatredInterpretation(scores)
    };
  },

  // ============================================================
  // 3. analyzeDelusion - 愚痴分析
  // ============================================================
  /**
   * 分析人物的愚痴状态
   * @param {Object} person - 人物对象，可包含 delusion 子对象
   * @param {number} [person.delusion.metacognition_level] - 元认知水平 (1-10)
   * @param {number} [person.delusion.confirmation_bias] - 确认偏误 (1-10)
   * @param {number} [person.delusion.belief_persistence] - 信念固着 (1-10)
   * @param {number} [person.delusion.self_deception] - 自我欺骗 (1-10)
   * @param {Object} [person.delusion.evidence] - [FORMULA] 贝叶斯证据更新
   *         { priorA: 先验P(A), pBA: P(B|A)似然, pB: P(B)边际 }，用于量化"信念是否随证据更新"
   * @returns {Object} 愚痴分析结果
   */
  analyzeDelusion(person) {
    const d = person?.delusion || {};
    const defaults = this.config.delusion;

    const scores = {
      metacognition_level: clamp(d.metacognition_level ?? defaults.metacognition_level, 1, 10),
      confirmation_bias: clamp(d.confirmation_bias ?? defaults.confirmation_bias, 1, 10),
      belief_persistence: clamp(d.belief_persistence ?? defaults.belief_persistence, 1, 10),
      self_deception: clamp(d.self_deception ?? defaults.self_deception, 1, 10)
    };

    // [FORMULA] 贝叶斯信念更新度：痴的本质是"信念不随证据更新"
    // 公式引自心虫公式库 bayes_theorem: P(A|B) = P(B|A)·P(A) / P(B)
    // 理性主体面对证据应更新信念；belief_persistence 高却几乎不更新 → 认知扭曲（痴）
    let bayesUpdate = null;
    let bayesResistance = false;
    const ev = d.evidence;
    if (ev && typeof ev.priorA === 'number' && typeof ev.pBA === 'number' && typeof ev.pB === 'number') {
      const bridge = this._getFormulaBridge();
      if (bridge) {
        const posterior = bridge.bayesUpdate(ev.pBA, ev.priorA, ev.pB);
        bayesUpdate = Math.abs(posterior - ev.priorA); // 信念更新幅度
        // 高信念固着 + 证据本应带来明显更新却几乎不变 → 拒绝贝叶斯更新（痴的标志）
        if (scores.belief_persistence >= 7 && bayesUpdate < 0.1) {
          bayesResistance = true;
        }
      }
    }

    // 痴总分 = 元认知反向（越低越痴）+ 确认偏误 + 信念固着 + 自我欺骗
    // metacognition_level 越高越好 → 用 (11 - value) 转为越高越痴
    const invertedMetacognition = 11 - scores.metacognition_level;

    const delusionScore = (
      invertedMetacognition * 0.25 +
      scores.confirmation_bias * 0.25 +
      scores.belief_persistence * 0.25 +
      scores.self_deception * 0.25
    );

    // 默认模式网络过度活跃指数
    const dmnOveractivity = (
      invertedMetacognition * 0.4 +
      scores.self_deception * 0.3 +
      scores.belief_persistence * 0.3
    );

    // 元认知功能评估
    const metacognitionAssessment = scores.metacognition_level >= 7
      ? '元认知功能良好 — 能够审视自身思维过程，识别认知偏差'
      : scores.metacognition_level >= 5
        ? '元认知功能一般 — 在某些领域能反思，但在自我相关领域有盲点'
        : '元认知功能低下 — 难以审视自身思维，缺乏对认知偏差的觉察';

    // 邓宁-克鲁格效应评估
    const dunningKruger = (
      invertedMetacognition >= 5 && scores.confirmation_bias >= 6
    ) ? '可能存在邓宁-克鲁格效应 — 元认知不足导致高估自身能力，同时确认偏误强化了这一错觉'
      : '邓宁-克鲁格效应不显著';

    const severity = this._getSeverity(delusionScore);

    // [FORMULA] 贝叶斯阻抗：高信念固着却拒绝证据更新 → 痴的客观标志，强化评分
    let delusionScoreAdjusted = delusionScore;
    let bayesNote = null;
    if (bayesResistance) {
      delusionScoreAdjusted = Math.min(10, delusionScore + 1.0);
      bayesNote = '检测到贝叶斯阻抗：高信念固着且面对证据几乎不更新信念，符合"痴"的认知扭曲特征';
    }

    return {
      poison: 'delusion',
      label: '痴 (Moha)',
      scores,
      delusionScore: round(delusionScoreAdjusted, 2),
      delusionScoreBase: round(delusionScore, 2),
      bayesUpdate: bayesUpdate !== null ? round(bayesUpdate, 4) : null,
      bayesResistance,
      bayesNote,
      dmnOveractivity: round(dmnOveractivity, 2),
      metacognitionAssessment,
      dunningKruger,
      severity,
      description: this._delusionDescription(severity, scores),
      interpretation: this._delusionInterpretation(scores)
    };
  },

  // ============================================================
  // 4. analyzeThreePoisons - 三毒综合分析
  // ============================================================
  /**
   * 三毒综合分析
   * @param {Object} person - 人物对象，可包含 greed/hatred/delusion 子对象
   * @returns {Object} 三毒综合分析结果
   */
  analyzeThreePoisons(person) {
    const greedAnalysis = this.analyzeGreed(person);
    const hatredAnalysis = this.analyzeHatred(person);
    const delusionAnalysis = this.analyzeDelusion(person);

    const scores = {
      greed: greedAnalysis.greedScore,
      hatred: hatredAnalysis.hatredScore,
      delusion: delusionAnalysis.delusionScore
    };

    // 三毒总毒性指数 (0-10)
    const totalToxicity = round(
      scores.greed * 0.33 +
      scores.hatred * 0.33 +
      scores.delusion * 0.34,
      2
    );

    // 互动效应检测
    const interaction = this.detectPoisonInteraction(scores.greed, scores.hatred, scores.delusion);

    // 主导毒
    const dominant = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];

    const dominantLabel = {
      greed: '贪 (Lobha)',
      hatred: '嗔 (Dvesha)',
      delusion: '痴 (Moha)'
    }[dominant[0]];

    return {
      scores,
      totalToxicity,
      dominantPoison: dominant[0],
      dominantLabel,
      dominantScore: round(dominant[1], 2),
      interaction,
      severity: this._getSeverity(totalToxicity),
      overall: this._overallDescription(totalToxicity, scores, interaction),
      greedAnalysis,
      hatredAnalysis,
      delusionAnalysis
    };
  },

  // ============================================================
  // 5. analyzePoisonsDrivenFate - 三毒驱动命运
  // ============================================================
  /**
   * 基于三毒状态预测人物命运走向
   * @param {Object} person - 人物对象
   * @returns {Object} 命运分析结果
   */
  analyzePoisonsDrivenFate(person) {
    const analysis = this.analyzeThreePoisons(person);
    const { greed, hatred, delusion } = analysis.scores;
    const { interaction } = analysis;

    // 命运核心驱动力
    const fateDrivers = [];
    if (greed >= 6) fateDrivers.push({
      poison: 'greed',
      mechanism: '奖励阈值升高驱动永不满足的追逐',
      trajectory: '持续追逐外部刺激，最终耗竭 — 从追求到成瘾，从拥有到空虚'
    });
    if (hatred >= 6) fateDrivers.push({
      poison: 'hatred',
      mechanism: '杏仁核过度激活 + 敌对归因驱动破坏性关系',
      trajectory: '人际关系逐渐崩塌，孤立的恶性循环 — 愤怒成为唯一熟悉的情绪'
    });
    if (delusion >= 6) fateDrivers.push({
      poison: 'delusion',
      mechanism: '元认知缺陷 + 确认偏误驱动认知与现实脱节',
      trajectory: '逐渐脱离现实反馈，在错误认知中越陷越深 — 最终无法被外界修正'
    });

    // 三毒互动命运效应
    const interactionFates = [];
    if (interaction.greedHatredCycle.active) {
      interactionFates.push(
        '贪嗔循环：求不得→愤怒→更用力求→更愤怒→最终自毁'
      );
    }
    if (interaction.hatredDelusionSpiral.active) {
      interactionFates.push(
        '嗔痴螺旋：愤怒→扭曲认知→更愤怒→认知更扭曲→陷入偏执妄想'
      );
    }
    if (interaction.greedDelusionConspiracy.active) {
      interactionFates.push(
        '贪痴共谋：欲望→自我欺骗→合理化→欲望膨胀→彻底失去自我觉察'
      );
    }

    // 综合命运预测
    const totalToxicity = analysis.totalToxicity;
    let fatePrediction;

    if (totalToxicity >= 8) {
      fatePrediction = {
        outcome: '悲剧性命运 — 三毒深重，自我毁灭',
        prognosis: '极差',
        narrative: '三毒如烈火焚心。贪使人永不满足，嗔使人众叛亲离，痴使人失去最后一丝清醒。' +
          '若无重大觉醒或外部干预，命运轨迹将走向彻底的崩坏——可能成瘾、犯罪、精神崩溃或自我毁灭。',
        turningPoint: '需要强有力的外部冲击（如重大损失、严重危机）才有觉醒可能'
      };
    } else if (totalToxicity >= 6) {
      fatePrediction = {
        outcome: '挣扎型命运 — 三毒显著，命运起伏',
        prognosis: '中度风险',
        narrative: '三毒已在人格中扎根。贪嗔痴互相强化，形成难以挣脱的恶性循环。' +
          '命运如过山车——有高峰但无法持久，有低谷却难以爬出。人际关系、职业发展和内心平静都受到侵蚀。',
        turningPoint: '尚有自我觉察的余地，若能在一毒上突破，可能打破循环'
      };
    } else if (totalToxicity >= 4) {
      fatePrediction = {
        outcome: '常人命运 — 三毒偶现，总体可控',
        prognosis: '低度风险',
        narrative: '作为普通人，贪嗔痴偶尔抬头，但尚未主导人生。' +
          '在压力或诱惑下会做出短视决定，但总体还能保持理性与善良。命运有起伏，但不会极端。',
        turningPoint: '持续的自我修养和觉察练习可防止三毒深化'
      };
    } else {
      fatePrediction = {
        outcome: '觉醒型命运 — 三毒轻微，内心自由',
        prognosis: '极低风险',
        narrative: '三毒控制力极弱。此人具备高度的自我觉察和情绪调节能力，' +
          '能在欲望、愤怒和迷妄升起时看见它们，而不被它们控制。命运掌握在自己手中。',
        turningPoint: '继续深化觉察，可能走向更高层次的智慧与自由'
      };
    }

    return {
      totalToxicity,
      fateDrivers,
      interactionFates,
      fatePrediction,
      analysis
    };
  },

  // ============================================================
  // 6. detectPoisonInteraction - 三毒互动检测
  // ============================================================
  /**
   * 三毒互动检测
   * @param {number} greed - 贪评分 (1-10)
   * @param {number} hatred - 嗔评分 (1-10)
   * @param {number} delusion - 痴评分 (1-10)
   * @returns {Object} 互动检测结果
   */
  detectPoisonInteraction(greed, hatred, delusion) {
    // 贪嗔循环：贪欲得不到满足 → 愤怒 → 更用力追逐 → 更愤怒
    const greedHatredCycle = {
      active: greed >= 6 && hatred >= 6,
      intensity: round((greed + hatred) / 2, 2),
      mechanism: '贪欲受阻产生愤怒，愤怒加剧占有欲，形成求不得→怒→更求不得的恶性循环',
      symptoms: [
        '对无法获得的事物产生强烈的怨恨',
        '嫉妒他人的拥有，认为世界不公',
        '在追逐目标时充满敌意和攻击性',
        '成功后无法享受，转而追逐下一个目标'
      ]
    };

    // 嗔痴螺旋：愤怒 → 扭曲认知 → 更愤怒 → 认知更扭曲
    const hatredDelusionSpiral = {
      active: hatred >= 6 && delusion >= 6,
      intensity: round((hatred + delusion) / 2, 2),
      mechanism: '愤怒情绪扭曲认知判断，认知扭曲又强化愤怒，杏仁核与前额叶形成负反馈循环',
      symptoms: [
        '坚信他人对自己有恶意（即使证据不足）',
        '在记忆中重构过去，放大受到的伤害',
        '将自身攻击行为合理化（"我只是在自卫"）',
        '无法接受他人道歉或解释'
      ]
    };

    // 贪痴共谋：欲望 → 自我欺骗 → 合理化 → 欲望膨胀
    const greedDelusionConspiracy = {
      active: greed >= 6 && delusion >= 6,
      intensity: round((greed + delusion) / 2, 2),
      mechanism: '欲望驱动自我欺骗，自我欺骗为欲望提供合理化的理由，形成认知失调的"解决方案"',
      symptoms: [
        '将贪婪美化为"追求卓越"或"上进心"',
        '为不道德行为编造合理的借口',
        '相信自己"应得"更多（ entitlement ）',
        '选择性忽视自己行为对他人造成的伤害'
      ]
    };

    // 三毒全燃：贪嗔痴互相强化
    const tripleBurn = {
      active: greed >= 7 && hatred >= 7 && delusion >= 7,
      intensity: round((greed + hatred + delusion) / 3, 2),
      mechanism: '三毒形成闭环强化系统——贪驱动追逐，嗔驱动敌意，痴为两者提供认知庇护',
      description: '三毒全燃是最危险的组合。贪让人永不满足，嗔让人在追逐中充满敌意，痴让人无法看清自己在做什么。这是一个自我维持、自我强化的毁灭性系统。'
    };

    return {
      greedHatredCycle,
      hatredDelusionSpiral,
      greedDelusionConspiracy,
      tripleBurn
    };
  },

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 获取严重程度标签
   * @private
   */
  _getSeverity(score) {
    if (score >= 8) return '极重';
    if (score >= 6.5) return '重度';
    if (score >= 5) return '中度';
    if (score >= 3.5) return '轻度';
    return '轻微';
  },

  /**
   * 贪描述
   * @private
   */
  _greedDescription(severity, scores) {
    const map = {
      '极重': `贪毒深重。渴望量级(${scores.wanting_amount})极高，延迟折扣异常(${scores.delay_discounting_rate})严重，满足阈值(${scores.satiety_threshold})极高，囤积倾向(${scores.hoarding_tendency})强烈。多巴胺D2受体密度显著降低，需要极大的刺激才能获得满足感。`,
      '重度': `贪毒明显。在多个维度上表现出对物质/刺激的过度追求，延迟满足能力较弱，容易陷入"拥有越多越不满足"的陷阱。`,
      '中度': `贪毒中等。在特定领域（如金钱、食物、成就）有一定程度的贪欲倾向，但在其他领域尚能保持适度。`,
      '轻度': `贪毒较轻。偶尔会有贪念，但总体上能够知足，延迟满足能力基本正常。`,
      '轻微': `贪毒极轻。满足阈值低，知足常乐，延迟满足能力强。`
    };
    return map[severity] || '';
  },

  /**
   * 贪解释
   * @private
   */
  _greedInterpretation(scores) {
    const parts = [];
    if (scores.wanting_amount >= 7) parts.push('欲望强烈，总想要更多');
    else if (scores.wanting_amount <= 3) parts.push('清心寡欲，容易满足');

    if (scores.delay_discounting_rate >= 7) parts.push('严重即时满足偏好，难以为未来克制当下');
    else if (scores.delay_discounting_rate <= 3) parts.push('极强延迟满足能力，愿意为长远投资');

    if (scores.satiety_threshold >= 7) parts.push('满足阈值极高，永远觉得不够');
    else if (scores.satiety_threshold <= 3) parts.push('知足常乐，小事即能感到幸福');

    if (scores.hoarding_tendency >= 7) parts.push('强烈囤积倾向，难以放手');
    else if (scores.hoarding_tendency <= 3) parts.push('极简主义倾向，不执着于拥有');

    return parts.join('；') || '贪欲水平适中';
  },

  /**
   * 嗔描述
   * @private
   */
  _hatredDescription(severity, scores) {
    const map = {
      '极重': `嗔毒深重。愤怒阈值极低(${scores.anger_threshold})，报复冲动强烈(${scores.revenge_urge})，几乎无法原谅(${scores.forgiveness_rate})，敌对归因偏差显著(${scores.hostility_bias})。杏仁核过度激活，前额叶抑制功能严重不足，血清素水平偏低。`,
      '重度': `嗔毒明显。易怒，记仇，容易将中性事件解读为敌意。人际关系因愤怒情绪而持续受损。`,
      '中度': `嗔毒中等。有愤怒倾向但在可控范围内，被严重触犯后会记恨但最终可能释怀。`,
      '轻度': `嗔毒较轻。偶尔动怒但不记仇，能够换位思考，原谅能力较强。`,
      '轻微': `嗔毒极轻。情绪稳定，极少愤怒，包容力强，能轻易原谅。`
    };
    return map[severity] || '';
  },

  /**
   * 嗔解释
   * @private
   */
  _hatredInterpretation(scores) {
    const parts = [];
    if (scores.anger_threshold <= 3) parts.push('极度易怒，一点小事就能点燃');
    else if (scores.anger_threshold >= 7) parts.push('情绪极为稳定，很难被激怒');

    if (scores.revenge_urge >= 7) parts.push('报复心极强，有仇必报');
    else if (scores.revenge_urge <= 3) parts.push('不记仇，被伤害后也能放下');

    if (scores.forgiveness_rate <= 3) parts.push('几乎无法原谅任何人');
    else if (scores.forgiveness_rate >= 7) parts.push('宽容大度，能够真正原谅');

    if (scores.hostility_bias >= 7) parts.push('总是认为别人有恶意，高度警惕');
    else if (scores.hostility_bias <= 3) parts.push('信任他人，不轻易怀疑动机');

    return parts.join('；') || '嗔怒水平适中';
  },

  /**
   * 痴描述
   * @private
   */
  _delusionDescription(severity, scores) {
    const map = {
      '极重': `愚痴深重。元认知水平极低(${scores.metacognition_level})，确认偏误严重(${scores.confirmation_bias})，信念极端固着(${scores.belief_persistence})，自我欺骗显著(${scores.self_deception})。前额叶元认知功能低下，默认模式网络过度活跃，与现实严重脱节。`,
      '重度': `愚痴明显。难以审视自身认知偏差，面对反面证据仍然固执己见，自我欺骗程度高。`,
      '中度': `愚痴中等。在某些领域有认知盲区，但在其他领域尚能保持理性，有一定自我觉察能力。`,
      '轻度': `愚痴较轻。偶尔有认知偏误但能接受反馈，愿意修正自己的观点。`,
      '轻微': `愚痴极轻。元认知能力出色，能客观审视自己的思维，对反面证据保持开放。`
    };
    return map[severity] || '';
  },

  /**
   * 痴解释
   * @private
   */
  _delusionInterpretation(scores) {
    const parts = [];
    if (scores.metacognition_level >= 7) parts.push('出色的元认知能力，能反思自身思维');
    else if (scores.metacognition_level <= 3) parts.push('元认知严重不足，无法审视自身思维');

    if (scores.confirmation_bias >= 7) parts.push('严重确认偏误，只接受支持自己观点的信息');
    else if (scores.confirmation_bias <= 3) parts.push('能够客观看待各方证据，没有明显偏误');

    if (scores.belief_persistence >= 7) parts.push('信念极端固着，任何证据都无法改变');
    else if (scores.belief_persistence <= 3) parts.push('灵活开放，愿意根据新证据更新信念');

    if (scores.self_deception >= 7) parts.push('高度自我欺骗，无法面对不愉快的真相');
    else if (scores.self_deception <= 3) parts.push('诚实面对自我，不回避真相');

    return parts.join('；') || '愚痴水平适中';
  },

  /**
   * 三毒总体描述
   * @private
   */
  _overallDescription(totalToxicity, scores, interaction) {
    const activeInteractions = [];
    if (interaction.greedHatredCycle.active) activeInteractions.push('贪嗔循环');
    if (interaction.hatredDelusionSpiral.active) activeInteractions.push('嗔痴螺旋');
    if (interaction.greedDelusionConspiracy.active) activeInteractions.push('贪痴共谋');

    let base = '';
    if (totalToxicity >= 7) {
      base = `三毒综合毒性极高(${totalToxicity})。贪(${scores.greed})嗔(${scores.hatred})痴(${scores.delusion})三者均已显著，形成强大的负面反馈系统。`;
    } else if (totalToxicity >= 5) {
      base = `三毒综合毒性中等(${totalToxicity})。贪(${scores.greed})嗔(${scores.hatred})痴(${scores.delusion})各有表现，在某些情境下会互相激活。`;
    } else {
      base = `三毒综合毒性较低(${totalToxicity})。贪(${scores.greed})嗔(${scores.hatred})痴(${scores.delusion})均处于可接受范围。`;
    }

    if (activeInteractions.length > 0) {
      base += ` 已检测到互动效应：${activeInteractions.join('、')}。`;
    }

    return base;
  }
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 将值限制在 [min, max] 范围内
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 四舍五入到指定小数位
 */
function round(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================
// 导出
// ============================================================
module.exports = ThreePoisons;
