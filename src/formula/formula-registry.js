/**
 * 认知公式注册表 (FormulaRegistry)
 *
 * 心虫 v5.9.5 重构核心：让公式从"被动查询"变为"按认知环节主动注入"。
 *
 * 之前：业务模块手算激活/效用/置信度（重复造轮子，缺理论支撑）
 * 现在：认知公式按"认知环节标签"注册，业务模块订阅自己环节的公式为计算原语。
 *
 * 环节标签（cognitive stage tags）：
 *   memory_activation   — 记忆检索激活度（ACT-R / Ebbinghaus）
 *   emotion_arousal     — 唤醒-绩效（Yerkes-Dodson）/ 情绪空间（PAD）
 *   decision_utility    — 决策效用（期望效用 / Softmax 策略）
 *   confidence_aggr     — 置信度聚合（元认知置信度 C=1-Var(p)）
 *   personality_measure — 人格特质测量（IRT）
 *   belief_update       — 信念更新（贝叶斯）
 *   calibration         — 置信度校准（交叉熵 / KL 散度）
 *
 * 注册表不重新实现公式，而是把 FormulaBridge 的认知原语 + 公式库条目
 * 按环节索引，供模块在正确认知环节调用。
 */

const { getFormulaBridge } = require('./formula-bridge.js');
const { FormulaEngine } = require('./formula-engine.js');

class FormulaRegistry {
  constructor(options = {}) {
    this._bridge = null;
    this._engine = null;
    this._stages = {};          // stage -> [ { id, kind, impl?, formulaId? } ]
    this._initialized = false;
    this.lazy = options && options.lazy !== false;
  }

  _ensure() {
    if (this._initialized) return;
    try {
      this._bridge = getFormulaBridge();
      if (!this.lazy) {
        try { this._engine = new FormulaEngine(); this._engine.init(); } catch (e) { this._engine = null; }
      }
      this._registerBuiltins();
      this._initialized = true;
    } catch (e) {
      // 初始化失败不应让注册表整体不可用，bridge 仍是核心
      this._initialized = true;
    }
  }

  /**
   * 注册一个认知原语到指定环节
   * @param {string} stage - 认知环节标签
   * @param {object} def - { id, impl: (...args)=>number, formulaId?, doc? }
   */
  register(stage, def) {
    if (!this._stages[stage]) this._stages[stage] = [];
    this._stages[stage].push(def);
  }

  /** 获取某环节的所有注册原语 */
  getStage(stage) {
    this._ensure();
    return this._stages[stage] || [];
  }

  /** 按 id 取某环节的一个原语 */
  get(stage, id) {
    this._ensure();
    const arr = this._stages[stage] || [];
    return arr.find(x => x.id === id) || null;
  }

  /** 调用某环节某原语 */
  call(stage, id, ...args) {
    const def = this.get(stage, id);
    if (!def || typeof def.impl !== 'function') return null;
    try { return def.impl(...args); } catch (e) { return null; }
  }

  /** 列出所有已注册环节及原语数（调试用） */
  summary() {
    this._ensure();
    const out = {};
    for (const [k, v] of Object.entries(this._stages)) out[k] = v.length;
    return out;
  }

  // ============================================================
  // 内置注册：把 FormulaBridge 认知原语按环节挂载
  // ============================================================
  _registerBuiltins() {
    const _b = this._bridge;
    if (!_b) return;

    // --- 记忆激活 ---
    this.register('memory_activation', {
      id: 'ebbinghaus_retention',
      formulaId: 'ebbinghaus_forgetting_curve',
      impl: (t, S) => _b.ebbinghausRetention(t, S),
      doc: 'R = exp(-t/S)，记忆强度随时间和强度衰减',
    });
    this.register('memory_activation', {
      id: 'actr_base_level',
      formulaId: 'actr_base_level_learning',
      impl: (times, d = 0.5) => _b.actrBaseLevel(times, d),
      doc: 'ACT-R 基础级学习 B_i = ln(Σ t_j^{-d})，访问频率越高记忆越强',
    });
    this.register('memory_activation', {
      id: 'actr_activation',
      formulaId: 'actr_activation_equation',
      impl: (baseLevel, spreading = 0, partial = 0, oscillator = 0) => _b.actrActivation(baseLevel, spreading, partial, oscillator),
      doc: 'ACT-R 激活 A_i = B_i + S_i + P_i - O_i',
    });
    this.register('memory_activation', {
      id: 'actr_noise',
      formulaId: 'actr_noise_boltzmann',
      impl: (activations, tau = 0.5) => _b.actrNoise(activations, tau),
      doc: 'ACT-R 噪声（玻尔兹曼）P = e^{A_i/τ} / Σ e^{A_j/τ}，检索概率',
    });

    // --- 情绪唤醒 ---
    this.register('emotion_arousal', {
      id: 'yerkes_dodson',
      formulaId: 'yerkes_dodson_law',
      impl: (arousal, a = 1, bb = 1, c = 0) => _b.yerkesDodson(arousal, a, bb, c),
      doc: '耶克斯-多德森：Performance = -a·A² + b·A + c，中等唤醒最优',
    });

    // --- 决策效用 ---
    this.register('decision_utility', {
      id: 'expected_utility',
      formulaId: 'expected_utility',
      impl: (probs, utils) => _b.expectedUtility(probs, utils),
      doc: '期望效用 EU = Σ p_i·u(x_i)',
    });
    this.register('decision_utility', {
      id: 'softmax_policy',
      formulaId: 'softmax_policy',
      impl: (qValues, tau = 1) => _b.softmaxPolicy(qValues, tau),
      doc: 'Softmax 策略 π(a|s) = exp(Q/τ) / Σ exp(Q/τ)',
    });
    this.register('decision_utility', {
      id: 'subjective_utility',
      formulaId: 'subjective_utility',
      impl: (outcomeUtils, probs) => _b.expectedUtility(probs, outcomeUtils),
      doc: '主观效用 = 期望效用的别名',
    });

    // --- 置信度聚合 ---
    this.register('confidence_aggr', {
      id: 'metacognitive_confidence',
      formulaId: 'metacognitive_confidence',
      impl: (probs) => _b.metacognitiveConfidence(probs),
      doc: '元认知置信度 C = 1 - Var(p)，一致性越高越自信',
    });
    this.register('confidence_aggr', {
      id: 'weighted_confidence',
      formulaId: null,
      impl: (values, weights) => _b.weightedAverage(values, weights),
      doc: '加权置信度聚合',
    });

    // --- 人格测量 ---
    this.register('personality_measure', {
      id: 'irt_rasch',
      formulaId: 'irt_1pl',
      impl: (theta, b) => _b.irtRasch(theta, b),
      doc: 'IRT 单参数（Rasch）P = 1 / (1 + e^{-(θ-b)})',
    });
    this.register('personality_measure', {
      id: 'irt_2pl',
      formulaId: 'irt_2pl',
      impl: (theta, a, b) => _b.irt2PL(theta, a, b),
      doc: 'IRT 双参数 P = 1 / (1 + e^{-a(θ-b)})',
    });
    this.register('personality_measure', {
      id: 'irt_3pl',
      formulaId: 'irt_3pl',
      impl: (theta, a, b, c = 0) => _b.irt3PL(theta, a, b, c),
      doc: 'IRT 三参数 P = c + (1-c) / (1 + e^{-a(θ-b)})',
    });
    this.register('personality_measure', {
      id: 'irt_4pl',
      formulaId: 'irt_4pl',
      impl: (theta, a, b, c, d) => _b.irt4PL(theta, a, b, c, d),
      doc: 'IRT 四参数',
    });

    // --- 信念更新 ---
    this.register('belief_update', {
      id: 'bayes_update',
      formulaId: 'bayes_theorem',
      impl: (pBA, pA, pB) => _b.bayesUpdate(pBA, pA, pB),
      doc: '贝叶斯 P(A|B) = P(B|A)·P(A)/P(B)',
    });

    // --- 校准 ---
    this.register('calibration', {
      id: 'log_loss',
      formulaId: 'cross_entropy',
      impl: (p, y) => _b.logLoss(p, y),
      doc: '二值交叉熵（对数损失）',
    });
    this.register('calibration', {
      id: 'kl_divergence',
      formulaId: 'kl_divergence',
      impl: (p, q) => _b.klDivergence(p, q),
      doc: 'KL 散度',
    });

    // ─── v5.9.8 审计扩展：新增已审计可计算的认知原语 ───

    // 记忆增强
    this.register('memory_activation', {
      id: 'experience_replay', formulaId: 'experience_replay',
      impl: (buffer, batchSize) => _b.experienceReplay(buffer, batchSize),
      doc: '经验回放（RL 记忆增强）：从回放缓冲采样',
    });
    this.register('memory_activation', {
      id: 'actr_noise', formulaId: 'actr_noise',
      impl: (acts, tau) => _b.actrNoise(acts, tau),
      doc: 'ACT-R 噪声（玻尔兹曼探索）',
    });

    // 决策情绪 / 主观效用
    this.register('emotion_arousal', {
      id: 'prospect_value', formulaId: 'prospect_value',
      impl: (x, o) => _b.prospectValue(x, o),
      doc: '前景理论价值函数（损失厌恶）',
    });
    this.register('emotion_arousal', {
      id: 'prospect_weight', formulaId: 'prospect_weight',
      impl: (p, g) => _b.prospectWeight(p, g),
      doc: '前景理论概率权重',
    });
    this.register('emotion_arousal', {
      id: 'subjective_utility', formulaId: 'subjective_utility',
      impl: (probs, utils) => _b.subjectiveUtility(probs, utils),
      doc: '主观期望效用 SEU',
    });

    // 决策/意识竞争
    this.register('decision_utility', {
      id: 'clarion_acs', formulaId: 'clarion_acs',
      impl: (cl, tau) => _b.clarionACS(cl, tau),
      doc: 'CLARION 双层认知选择',
    });
    this.register('decision_utility', {
      id: 'cognitive_dissonance', formulaId: 'cognitive_dissonance',
      impl: (beliefs, actions, weights) => _b.cognitiveDissonance(beliefs, actions, weights),
      doc: '认知失调量化',
    });
    this.register('decision_utility', {
      id: 'gwt_accessibility', formulaId: 'gwt_accessibility',
      impl: (w, gw, noise) => _b.gwtAccessibility(w, gw, noise),
      doc: '全球工作空间可及性',
    });
    this.register('decision_utility', {
      id: 'gwt_winner', formulaId: 'gwt_competition',
      impl: (acts) => _b.gwtWinner(acts),
      doc: 'GWT 竞争赢家（意识进入）',
    });

    // 置信聚合 / 主动推断
    this.register('confidence_aggr', {
      id: 'active_inference_efe', formulaId: 'active_inference_efe',
      impl: (q) => _b.activeInferenceEFE(q),
      doc: '主动推断期望自由能（信息寻求）',
    });
    this.register('confidence_aggr', {
      id: 'predictive_coding_free_energy', formulaId: 'predictive_coding_free_energy',
      impl: (s, mu, sigma) => _b.predictiveCodingFreeEnergy(s, mu, sigma),
      doc: '预测编码自由能',
    });
    this.register('confidence_aggr', {
      id: 'precision_weight', formulaId: 'active_inference_precision',
      impl: (sigma) => _b.precisionWeight(sigma),
      doc: '精确度权重 γ=1/σ²',
    });

    // 人格/测量
    this.register('personality_measure', {
      id: 'irt_information', formulaId: 'irt_information',
      impl: (theta, a, b, c, d) => _b.irtInformation(theta, a, b, c, d),
      doc: 'IRT 信息函数',
    });
    this.register('personality_measure', {
      id: 'irt_sem', formulaId: 'irt_sem',
      impl: (theta, a, b, c, d) => _b.irtSEM(theta, a, b, c, d),
      doc: 'IRT 标准误',
    });

    // 信念更新增强
    this.register('belief_update', {
      id: 'bayes_factor', formulaId: 'bayes_factor',
      impl: (pE1, pE0) => _b.bayesFactor(pE1, pE0),
      doc: '贝叶斯因子 BF = P(E|H1)/P(E|H0)',
    });
    this.register('belief_update', {
      id: 'posterior_odds', formulaId: 'odds_ratio',
      impl: (prior, bf) => _b.posteriorOdds(prior, bf),
      doc: '后验赔率 O = BF·O(H)',
    });

    // 校准 / 意识 / 社会
    this.register('calibration', {
      id: 'sem_fit_rmsea', formulaId: 'sem_fit_rmsea',
      impl: (chi2, df, N) => _b.semFitRMSEA(chi2, df, N),
      doc: 'SEM 拟合 RMSEA',
    });
    this.register('calibration', {
      id: 'sem_fit_srms', formulaId: 'sem_fit_srms',
      impl: (res) => _b.semFitSRMR(res),
      doc: 'SEM 拟合 SRMR',
    });
    this.register('calibration', {
      id: 'iit_phi', formulaId: 'iit_phi',
      impl: (miWhole, miParts) => _b.iitPhi(miWhole, miParts),
      doc: '整合信息论 Φ（意识量化）',
    });
    this.register('calibration', {
      id: 'social_influence', formulaId: 'social_influence_model',
      impl: (state, w, lambda) => _b.socialInfluence(state, w, lambda),
      doc: '社会影响模型（French-Harary）',
    });
    this.register('calibration', {
      id: 'vygotsky_zpd', formulaId: 'vygotsky_zpd',
      impl: (ind, help) => _b.vygotskyZPD(ind, help),
      doc: '维果茨基最近发展区',
    });
    // ─── v5.9.9 第二批审计扩展 ───

    // 决策效用（博弈/后悔/信息价值）
    this.register('decision_utility', {
      id: 'information_value', formulaId: 'information_value',
      impl: (priorEU, postEU) => _b.informationValue(priorEU, postEU),
      doc: '信息价值 EVSI',
    });
    this.register('decision_utility', {
      id: 'regret_theory', formulaId: 'regret_theory',
      impl: (probs, utils, best) => _b.regretTheory(probs, utils, best),
      doc: '后悔理论',
    });
    this.register('decision_utility', {
      id: 'minimax', formulaId: 'minimax',
      impl: (rows) => _b.minimax(rows),
      doc: '极小极大（零和博弈）',
    });
    this.register('decision_utility', {
      id: 'shapley_value', formulaId: 'shapley_value',
      impl: (players, fn) => _b.shapleyValue(players, fn),
      doc: '沙普利值（合作博弈）',
    });
    this.register('decision_utility', {
      id: 'actor_critic', formulaId: 'actor_critic',
      impl: (r, g, vn, vc) => _b.actorCritic(r, g, vn, vc),
      doc: 'Actor-Critic 优势',
    });
    this.register('decision_utility', {
      id: 'soar_qlearning', formulaId: 'soar_qlearning',
      impl: (q, a, r, g, nm) => _b.soarQLearning(q, a, r, g, nm),
      doc: 'Soar Q-Learning',
    });
    this.register('decision_utility', {
      id: 'actr_expected_gain', formulaId: 'actr_expected_gain',
      impl: (probs, utils) => _b.actrExpectedGain(probs, utils),
      doc: 'ACT-R 期望增益',
    });

    // 情绪/唤醒/心流
    this.register('emotion_arousal', {
      id: 'emotion_blend', formulaId: 'emotion_blend',
      impl: (emos, weights) => _b.emotionBlend(emos, weights),
      doc: '情绪混合模型',
    });
    this.register('emotion_arousal', {
      id: 'yerkes_dodson_equation', formulaId: 'yarkes_dodson_equation',
      impl: (a, aOpt, pa, b) => _b.yerkesDodsonEquation(a, aOpt, pa, b),
      doc: '耶克斯-多德森（量化）',
    });
    this.register('emotion_arousal', {
      id: 'flow_channel', formulaId: 'flow_channel_equation',
      impl: (c, s, mb) => _b.flowChannel(c, s, mb),
      doc: '心流通道',
    });
    this.register('emotion_arousal', {
      id: 'pad_pleasure', formulaId: 'pad_pleasure',
      impl: (pos, neg, w1, w2, base) => _b.padPleasure(pos, neg, w1, w2, base),
      doc: 'PAD 愉悦度量化',
    });

    // 信念更新（确认度/赔率/贝叶斯）
    this.register('belief_update', {
      id: 'bayes_confirmation', formulaId: 'bayes_confirmation',
      impl: (pHE, pH) => _b.bayesConfirmation(pHE, pH),
      doc: '贝叶斯确认度',
    });
    this.register('belief_update', {
      id: 'popper_corroboration', formulaId: 'popper_corroboration',
      impl: (pEH, pEnH) => _b.popperCorroboration(pEH, pEnH),
      doc: '波普尔确认度',
    });
    this.register('belief_update', {
      id: 'odds_ratio', formulaId: 'odds_ratio',
      impl: (prior, bf) => _b.oddsRatio(prior, bf),
      doc: '后验赔率（公式版）',
    });

    // 校准（心理测量/社会/神经）
    this.register('calibration', {
      id: 'homophily', formulaId: 'homophily',
      impl: (ew, er, et) => _b.homophily(ew, er, et),
      doc: '同质性指数',
    });
    this.register('calibration', {
      id: 'bystander_effect', formulaId: 'bystander_effect',
      impl: (p, n) => _b.bystanderEffect(p, n),
      doc: '旁观者效应',
    });
    this.register('calibration', {
      id: 'cronbach_alpha', formulaId: 'psych_reliability_cronbach',
      impl: (k, sv, vt) => _b.cronbachAlpha(k, sv, vt),
      doc: '克隆巴赫 α',
    });
    this.register('calibration', {
      id: 'cohens_d', formulaId: 'psych_effect_size_cohens_d',
      impl: (m1, m2, psd) => _b.cohensD(m1, m2, psd),
      doc: '科恩 d 效应量',
    });
    this.register('calibration', {
      id: 'phq9_score', formulaId: 'psych_phq9_score',
      impl: (items) => _b.phq9Score(items),
      doc: 'PHQ-9 抑郁量表',
    });
    this.register('calibration', {
      id: 'gad7_score', formulaId: 'psych_gad7_score',
      impl: (items) => _b.gad7Score(items),
      doc: 'GAD-7 焦虑量表',
    });

    // 记忆（ACT-R 精确版/神经）
    this.register('memory_activation', {
      id: 'actr_declarative_memory', formulaId: 'cog_cog_act_r',
      impl: (bl, nw, probs) => _b.actrDeclarativeMemory(bl, nw, probs),
      doc: 'ACT-R 陈述性记忆',
    });
    this.register('memory_activation', {
      id: 'neural_firing_rate', formulaId: 'neural_firing_rate',
      impl: (w, x, b) => _b.neuralFiringRate(w, x, b),
      doc: '神经元放电率',
    });
  }
}

// 单例
let _instance = null;
function getFormulaRegistry(options) {
  if (!_instance) _instance = new FormulaRegistry(options);
  return _instance;
}

module.exports = { FormulaRegistry, getFormulaRegistry };
