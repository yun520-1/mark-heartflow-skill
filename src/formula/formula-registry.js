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
  }
}

// 单例
let _instance = null;
function getFormulaRegistry(options) {
  if (!_instance) _instance = new FormulaRegistry(options);
  return _instance;
}

module.exports = { FormulaRegistry, getFormulaRegistry };
