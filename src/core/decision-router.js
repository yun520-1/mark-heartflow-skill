/**
 * decision-router.js — 通用分析→决策路由引擎 v3.0.0
 *
 * v3.0.0 升级（2026-06-23）：
 *   - 新增 U/D/A/H 四维场域追踪（基于 luoxuejian000 论文框架）
 *   - 新增翻转点检测：Primary / Alternate1 / Alternate2 + U_PEAK_REVERSAL
 *   - 吸收加权 H 公式：H = 0.4·U + 0.3·D - 0.3·A
 *   - 新增4条场域感知规则
 *
 * 核心问题：心虫 53 个模块中有 53 个"只分析不决策"的模块。
 * 它们会评估、检测、诊断，但结果止步于"报告"——没人把报告转成指令。
 *
 * 这个模块解决：
 *   任何模块的评估结果 → 自动转化为可执行的决策指令
 *
 * 设计原则：
 * - 不新增分析维度，只消费已有模块的输出
 * - 模块不需改造，加一个 route 标记即可自动获得决策能力
 * - 每个"分析结果"都能映射到 8 种基础决策之一
 * - 决策可以嵌套（决策A的副作用触发决策B）
 *
 * 工作流程：
 *   dispatch('subsystem.method') → 执行原始逻辑 → 检测返回值
 *   → 如果是分析型结果（有 score/level/status/severity 等字段）
 *   → 匹配决策规则 → 生成决策指令 → 返回 { result, decision }
 */

const VERSION = '3.8.2';

// ─── U/D/A/H 场域追踪参数（基于 luoxuejian000 论文） ──────────────────────
// H = λU·U + λD·D - λA·A
const FIELD_WEIGHTS = {
  lambdaU: 0.4,  // 统一性——身份在场强度
  lambdaD: 0.3,  // 发展性——信息推进结构化程度
  lambdaA: 0.3,  // 对抗性——矛盾边密度
};

// v3.8.0：场景感知权重配置
// 不同场景类型使用不同的 U/D/A 权重，解决固定权重在特定场景失效的问题
const SCENE_WEIGHTS = {
  // 默认/通用对话
  general: { lambdaU: 0.4, lambdaD: 0.3, lambdaA: 0.3 },
  // 纯技术讨论：U 偏高但 A 偏低 → 降低 U 权重暴露停滞
  technical: { lambdaU: 0.25, lambdaD: 0.45, lambdaA: 0.3 },
  // 情感冲突：A 波动大 → 降低 A 惩罚避免过度反应
  emotional: { lambdaU: 0.35, lambdaD: 0.25, lambdaA: 0.2 },
  // 分析/推理任务：D 最重要
  analytical: { lambdaU: 0.2, lambdaD: 0.5, lambdaA: 0.3 },
  // 创意/发散任务：U 最重要
  creative: { lambdaU: 0.5, lambdaD: 0.2, lambdaA: 0.3 },
  // 自我修复/反思：A 是最重要的信号
  reflective: { lambdaU: 0.25, lambdaD: 0.25, lambdaA: 0.5 },
};

// 翻转点检测阈值（论文实验验证值）
const FLIP_THRESHOLDS = {
  aBoundaryLow: 0.12,     // A 值边界下限
  aBoundaryHigh: 0.9,     // A 值边界上限
  aStdevDead: 0.01,       // A 值 3 步滑动标准差"僵死"阈值
  dVolatilityDropWindow: 5, // D 波动率移动平均窗口
  amplitudeRatio: 2.0,    // 主导维度振幅超过历史均值倍数
  aJumpThreshold: 0.1,    // A 值跳变检测阈值
  aDiveThreshold: 0.3,    // A 值跳水阈值
  hRiseThreshold: 0.05,   // H 值同步上升阈值
  uPeakDropThreshold: -0.05, // U 值从峰值回落阈值
  epsilon: 0.005,         // 驱动归因最小变化量
  historyWindow: 10,      // 场域历史窗口（步数）
  // v3.7.0：谐振窗口参数（基于 luoxuejian000 论文 §3.1 谐振调谐论）
  resonanceWindowLow: 0.35,   // 谐振窗口下限 H
  resonanceWindowHigh: 0.65,  // 谐振窗口上限 H
  resonanceMaxA: 0.2,         // 谐振态最大允许 A 值
  resonanceMinSteps: 5,       // 进入谐振态所需的最小稳定步数
  resonanceDecayWindow: 8,    // 谐振衰减窗口（步数）
};

// ─── 模型配置文件 ────────────────────────────────────────────────────────
const MODEL_PROFILES = {
  flash: {
    label: 'Fast inference, prone to hallucination',
    confidenceFloor: 0.3,    confidenceStandard: 0.5,
    confidenceHigh: 0.7,     confidenceMax: 0.9,
    decisionShift: 0.0,      explorationEpsilon: 0.10,
    fallbackThreshold: 0.4,
  },
  premium: {
    label: 'Well-calibrated full model',
    confidenceFloor: 0.3,    confidenceStandard: 0.4,
    confidenceHigh: 0.55,    confidenceMax: 0.85,
    decisionShift: -0.05,    explorationEpsilon: 0.08,
    fallbackThreshold: 0.3,
  },
  flagship: {
    label: 'Best-in-class calibration',
    confidenceFloor: 0.2,    confidenceStandard: 0.35,
    confidenceHigh: 0.5,     confidenceMax: 0.8,
    decisionShift: -0.1,     explorationEpsilon: 0.05,
    fallbackThreshold: 0.25,
  },
  lightweight: {
    label: 'Small/quantized model, poor calibration',
    confidenceFloor: 0.4,    confidenceStandard: 0.6,
    confidenceHigh: 0.8,     confidenceMax: 0.95,
    decisionShift: 0.1,      explorationEpsilon: 0.15,
    fallbackThreshold: 0.5,
  },
};

const DEFAULT_PROFILE = MODEL_PROFILES.flash;

// ─── 决策类型（与 philosophy-to-decision.js 一致） ────────────────────────
const DECISION = {
  PAUSE: 'pause',           // 减速/暂停
  ACCELERATE: 'accelerate', // 加速
  TURN: 'turn',             // 转向
  HOLD: 'hold',             // 坚守
  HEAL: 'heal',             // 自愈/修复
  RESONATE: 'resonate',     // 共振/加强
  TRANSMIT: 'transmit',     // 传递/输出
  REST: 'rest',             // 休息/低能耗
};

const DECISION_PRIORITY = {
  [DECISION.HEAL]: 100,
  [DECISION.TURN]: 90,
  [DECISION.PAUSE]: 80,
  [DECISION.REST]: 70,
  [DECISION.TRANSMIT]: 60,
  [DECISION.RESONATE]: 50,
  [DECISION.ACCELERATE]: 40,
  [DECISION.HOLD]: 30,
};

// ─── 决策路由引擎 ────────────────────────────────────────────────────────
class DecisionRouter {
  /**
   * @param {object} heartFlow - HeartFlow 主实例引用
   * @param {object} [options]
   * @param {string} [options.modelProfile='flash']
   * @param {object} [options.customProfile]
   */
  constructor(heartFlow, options = {}) {
    this.name = 'DecisionRouter';
    this.version = VERSION;
    this.hf = heartFlow;

    // 模型配置
    const profileName = options.modelProfile || 'flash';
    const baseProfile = MODEL_PROFILES[profileName] || DEFAULT_PROFILE;
    this.modelProfile = {
      name: profileName,
      ...baseProfile,
      ...(options.customProfile || {}),
    };

    this._thresholds = {
      floor: this.modelProfile.confidenceFloor,
      standard: this.modelProfile.confidenceStandard,
      high: this.modelProfile.confidenceHigh,
      max: this.modelProfile.confidenceMax,
      fallback: this.modelProfile.fallbackThreshold,
    };

    // ─── v3.0.0 新增：U/D/A/H 场域追踪 ───────────────────────────────────
    /** @type {Array<{step:number, U:number, D:number, A:number, H:number, source:string, driver:string}>} */
    this._fieldHistory = [];
    this._fieldStep = 0;
    this._lastFlipAlert = null;  // { type, step, u, d, a, h, message, timestamp }

    // v3.8.0：场景感知权重
    this._currentScene = 'general';     // 当前检测到的场景
    this._sceneHistory = [];            // 场景切换历史
    this._activeWeights = { ...FIELD_WEIGHTS };  // 当前活跃权重
    this._sceneStabilityWindow = 5;     // 场景判定需要的稳定步数
    this._charLevelSamples = [];        // 字符级采样缓冲

    // 规则
    const T = this._thresholds;
    this._rules = [
      // ── 认知类 ──
      {
        id: 'cognitive-overload',
        match: (r) => {
          // 原始字段可能被场域注入覆盖，检查多种来源
          const load = r.cognitiveLoad !== undefined ? r.cognitiveLoad :
                       r.load !== undefined ? r.load : undefined;
          return load !== undefined;
        },
        decision: DECISION.PAUSE,
        confidence: (r) => {
          const load = r.cognitiveLoad !== undefined ? r.cognitiveLoad : (r.load || 0);
          return load > T.high ? 0.9 : load > T.standard ? 0.6 : 0;
        },
        rationale: (r) => `认知负荷 ${(r.cognitiveLoad !== undefined ? r.cognitiveLoad : (r.load || 0)).toFixed(2)}，减速`,
        fallback: DECISION.HOLD,
      },
      {
        id: 'cognitive-clarity',
        match: (r) => (r.cognitiveLoad !== undefined || r.load !== undefined) && r.directionClear !== undefined,
        decision: DECISION.ACCELERATE,
        confidence: (r) => {
          const load = r.cognitiveLoad || r.load || 0;
          const dir = r.directionClear || 0;
          return load < T.floor && dir > T.high ? 0.85 : 0;
        },
        rationale: (r) => `低负荷(${((r.cognitiveLoad || r.load || 0)).toFixed(2)})+方向明确(${(r.directionClear || 0).toFixed(2)})，加速`,
        fallback: DECISION.HOLD,
      },
      {
        id: 'cognitive-dissonance',
        match: (r) => r.dissonance !== undefined || r.cognitiveDissonance !== undefined,
        decision: DECISION.HEAL,
        confidence: (r) => {
          const d = r.dissonance || r.cognitiveDissonance || 0;
          return d > T.high ? 0.9 : d > T.standard ? 0.6 : 0;
        },
        rationale: (r) => `认知失调 ${((r.dissonance || r.cognitiveDissonance || 0)).toFixed(2)}，自愈`,
        fallback: DECISION.TURN,
      },
      // ── 决策质量类 ──
      {
        id: 'decision-degrading',
        match: (r) => r.quality !== undefined && r.quality < T.fallback,
        decision: DECISION.PAUSE,
        confidence: (r) => 0.7 + (1 - r.quality) * 0.3,
        rationale: (r) => `决策质量 ${r.quality.toFixed(2)}，低于阈值`,
        fallback: DECISION.HEAL,
      },
      // ── 引擎状态一致性 ──
      {
        id: 'identity-drift',
        match: (r) => r.identityCoherence !== undefined && r.identityCoherence < T.standard,
        decision: DECISION.TURN,
        confidence: (r) => 1 - (r.identityCoherence || 0),
        rationale: (r) => `引擎状态一致性 ${(r.identityCoherence || 0).toFixed(2)}，低于安全线`,
        fallback: DECISION.PAUSE,
      },
      // ── 错误/异常类 ──
      {
        id: 'error-severity',
        match: (r) => r.severity !== undefined && ['critical', 'high', 'FATAL'].includes(String(r.severity).toUpperCase()),
        decision: DECISION.HEAL,
        confidence: (r) => 0.95,
        rationale: (r) => `严重错误: ${r.reason || r.error || '未知'}`,
        fallback: DECISION.TURN,
      },
      {
        id: 'error-transient',
        match: (r) => r.severity !== undefined && r.severity === 'TRANSIENT',
        decision: DECISION.PAUSE,
        confidence: (r) => 0.6,
        rationale: (r) => `瞬时错误: ${r.reason || ''}`,
        fallback: DECISION.HOLD,
      },
      // ── 质疑/纠错类（优先级 90，仅低于 HEAL）──
      {
        // 收到质疑/纠错/批评时，选择认错路径，不选择解释/防御路径
        id: 'challenge-received',
        match: (r) => {
          // 检测任何形式的质疑信号：用户指出错误、说"不对"、"有问题"、"错了"
          const challengeSignals = [
            r.challenge, r.correction, r.criticism, r.质疑, r.纠正,
          ];
          if (challengeSignals.some(s => s === true || s === 'true')) return true;
          // 文本匹配：用户输入中包含质疑关键词
          if (r.inputText && typeof r.inputText === 'string') {
            const challengePatterns = [
              /质疑|为什么.*没|为什么.*不|为什么.*错|你的问题|你.*(错|不对|有问题)/i,
              /不是.*(态度|这个|这样)/i,
              /严重.*问题|底层.*问题/i,
              /彻底.*检查|彻底.*重构/i,
              /你.*说.*不对|你.*做.*不对|你.*回答.*不对/i,
            ];
            return challengePatterns.some(p => p.test(r.inputText));
          }
          return false;
        },
        decision: DECISION.PAUSE,
        confidence: (r) => 0.9,
        rationale: (r) => `收到质疑/纠错信号，暂停解释路径，进入自我审查状态`,
        fallback: DECISION.HOLD,
      },
      // ── 价值/伦理类 ──
      {
        id: 'value-resonance',
        match: (r) => r.valueResonance !== undefined && r.valueResonance > T.high,
        decision: DECISION.RESONATE,
        confidence: (r) => r.valueResonance,
        rationale: (r) => `价值共振 ${r.valueResonance.toFixed(2)}`,
        fallback: DECISION.HOLD,
      },
      // ── 知识/传递类 ──
      {
        id: 'knowledge-transmissible',
        match: (r) => r.quality !== undefined && r.quality > T.high && r.confidence !== undefined && r.confidence > T.standard,
        decision: DECISION.TRANSMIT,
        confidence: (r) => (r.quality + r.confidence) / 2,
        rationale: (r) => `高质量知识(${r.quality.toFixed(2)})+高置信度(${r.confidence.toFixed(2)})`,
        fallback: DECISION.RESONATE,
      },
      // ── 反事实推理类 ──
      {
        id: 'counterfactual-insight',
        match: (r) => r.alternatives !== undefined && r.alternatives.length > 0 && (r.relevant === undefined || r.relevant === true),
        decision: DECISION.RESONATE,
        confidence: (r) => Math.min(0.8, r.alternatives.length * 0.15),
        rationale: (r) => `发现 ${r.alternatives.length} 个反事实替代路径`,
        fallback: DECISION.HOLD,
      },
      // ── 元认知类 ──
      {
        id: 'meta-insight',
        match: (r) => r.awareness !== undefined && r.awareness > T.standard,
        decision: DECISION.ACCELERATE,
        confidence: (r) => r.awareness,
        rationale: (r) => `元认知觉醒 ${r.awareness.toFixed(2)}`,
        fallback: DECISION.HOLD,
      },
      // ── 信念/断言类 ──
      {
        id: 'belief-stable',
        match: (r) => r.ok !== undefined && r.ok === true,
        decision: DECISION.HOLD,
        confidence: (r) => r.confidence || T.standard,
        rationale: (r) => `断言通过: ${r.error || '无错误'}`,
        fallback: null,
      },
      {
        id: 'belief-broken',
        match: (r) => r.ok !== undefined && r.ok === false,
        decision: DECISION.HEAL,
        confidence: (r) => 0.85,
        rationale: (r) => `断言失败: ${r.error || '未知'}`,
        fallback: DECISION.TURN,
      },
      // ── 常识推理类 ──
      {
        id: 'commonsense-failure',
        match: (r) => r.valid !== undefined && r.valid === false,
        decision: DECISION.PAUSE,
        confidence: (r) => 0.75,
        rationale: (r) => `常识验证失败: ${r.message || r.category || '未知'}`,
        fallback: DECISION.HEAL,
      },
      // ── 稳定性类 ──
      {
        id: 'instability',
        match: (r) => r.stability !== undefined && r.stability < T.fallback,
        decision: DECISION.PAUSE,
        confidence: (r) => 1 - r.stability,
        rationale: (r) => `稳定性 ${r.stability.toFixed(2)}，低于安全线`,
        fallback: DECISION.HEAL,
      },
      // ── 执行状态类 ──
      {
        id: 'execution-success',
        match: (r) => r.success !== undefined && r.success === true,
        decision: DECISION.ACCELERATE,
        confidence: (r) => T.standard,
        rationale: (r) => `执行成功: ${r.result || ''}`,
        fallback: DECISION.HOLD,
      },
      {
        id: 'execution-failure',
        match: (r) => r.success !== undefined && r.success === false,
        decision: DECISION.HEAL,
        confidence: (r) => 0.8,
        rationale: (r) => `执行失败: ${r.error || r.reason || '未知'}`,
        fallback: DECISION.PAUSE,
      },
      // ★ 目标审视类
      {
        id: 'goal-invalid',
        match: (r) => r.goalValid !== undefined && r.goalValid === false,
        decision: DECISION.PAUSE,
        confidence: (r) => 0.8,
        rationale: (r) => `目标合理性存疑: ${r.goalReviewDetail || '目标存在矛盾或不可能实现'}`,
        fallback: DECISION.TURN,
      },
      {
        id: 'goal-unethical',
        match: (r) => r.goalEthical !== undefined && r.goalEthical === false,
        decision: DECISION.TURN,
        confidence: (r) => 0.9,
        rationale: (r) => `目标涉及伦理风险: ${r.goalReviewDetail || '目标可能伤害他人或违反道德'}`,
        fallback: DECISION.PAUSE,
      },
      {
        id: 'goal-needs-post-resolution',
        match: (r) => r.postResolution !== undefined && r.postResolution !== null,
        decision: DECISION.PAUSE,
        confidence: (r) => 0.6,
        rationale: (r) => `需要终局思考: ${r.postResolution}`,
        fallback: DECISION.HOLD,
      },
      // ──────────────────────────────────────────────────────────────────────
      // v3.0.0 新增：U/D/A/H 场域感知规则（基于 luoxuejian000 论文）
      // ──────────────────────────────────────────────────────────────────────
      {
        id: 'field-degrading',
        // 场域慢性失谐：H 值持续低于 0.3（低健康度）
        match: (r) => r._fieldH !== undefined && r._fieldH < 0.3,
        decision: DECISION.HEAL,
        confidence: (r) => Math.max(0.5, 0.9 - r._fieldH),
        rationale: (r) => `场域慢性失谐: H=${r._fieldH.toFixed(3)}, U=${(r._fieldU || 0).toFixed(3)}, D=${(r._fieldD || 0).toFixed(3)}, A=${(r._fieldA || 0).toFixed(3)}`,
        fallback: DECISION.PAUSE,
      },
      {
        id: 'field-reversal',
        // 翻转点预警（Primary/Alternate1/Alternate2 任意命中）
        match: (r) => r._fieldFlipAlert !== undefined && r._fieldFlipAlert !== null,
        decision: DECISION.PAUSE,
        confidence: (r) => r._fieldFlipAlert === 'primary' ? 0.85 : 0.7,
        rationale: (r) => `翻转点预警[${r._fieldFlipAlert}]: 步${r._fieldStep}, H=${(r._fieldH || 0).toFixed(3)}`,
        fallback: DECISION.HEAL,
      },
      {
        id: 'field-peak-reversal',
        // U_PEAK_REVERSAL：U 值从峰值大幅回落（身份在场强度退化）
        match: (r) => r._fieldPeakReversal !== undefined && r._fieldPeakReversal === true,
        decision: DECISION.TURN,
        confidence: (r) => 0.8,
        rationale: (r) => `U值峰值反转: ΔU=${(r._fieldDeltaU || 0).toFixed(3)}, 身份在场强度退化`,
        fallback: DECISION.PAUSE,
      },
      {
        id: 'field-stable',
        // 场域健康：H 值高于 0.45，所有维度稳定
        match: (r) => r._fieldH !== undefined && r._fieldH >= 0.45 &&
                      r._fieldA !== undefined && r._fieldA < 0.3 &&
                      r._fieldU !== undefined && r._fieldU >= 0.3,
        decision: DECISION.ACCELERATE,
        confidence: (r) => Math.min(0.9, r._fieldH),
        rationale: (r) => `场域健康: H=${r._fieldH.toFixed(3)}, U=${r._fieldU.toFixed(3)}, A=${r._fieldA.toFixed(3)}`,
        fallback: DECISION.HOLD,
      },
      // ──────────────────────────────────────────────────────────────────────
      // v3.7.0：谐振态规则（基于 luoxuejian000 论文 §3.1 谐振调谐论）
      // ──────────────────────────────────────────────────────────────────────
      {
        id: 'field-resonance',
        // 场域处于谐振窗口：H ∈ [0.35, 0.65] 且 A ≤ 0.2，系统自发涌现结构的能力增强
        match: (r) => r._fieldResonance === true && r._fieldResonanceSteps >= 3,
        decision: DECISION.RESONATE,
        confidence: (r) => {
          const base = Math.min(0.85, (r._fieldH || 0.5) * 1.2);
          const boost = Math.min(0.15, (r._fieldResonanceSteps || 0) * 0.02);
          return Math.min(0.95, base + boost);
        },
        rationale: (r) => `谐振态激活: H=${(r._fieldH || 0).toFixed(3)} 连续${r._fieldResonanceSteps}步, A=${(r._fieldA || 0).toFixed(3)}`,
        fallback: DECISION.ACCELERATE,
      },
      {
        id: 'field-resonance-decay',
        // 谐振态即将退出：连续多步未更新（谐振衰减），或 A 值开始上升
        match: (r) => r._fieldResonance === false &&
                      this._resonanceState.lastExitReason === 'A_exceeded',
        decision: DECISION.TURN,
        confidence: (r) => 0.7,
        rationale: (r) => `谐振态退出: A超阈值(${(r._fieldA || 0).toFixed(3)}), 需转向避免场域失谐`,
        fallback: DECISION.PAUSE,
      },
    ];

    // 决策反馈循环（2026-06-28 基于 DeepSeek #1424 讨论）
    this._ruleStats = {};
    for (const rule of this._rules) {
      if (!rule.hasOwnProperty('weight')) rule.weight = 1.0;
      this._ruleStats[rule.id] = {
        hits: 0,
        correct: 0,
        wrong: 0,
        accuracy: 1.0,
        lastAdjustment: 0,
      };
    }

    // 决策历史
    this._history = [];
    this._maxHistory = 500;

    this._activeDecision = null;

    // 抑制——防止同一规则在短时间内重复触发
    this._suppression = new Map();
    this._suppressionWindow = 10000;

    // 统计
    this._stats = {
      totalEvaluations: 0,
      totalDecisions: 0,
      byDecision: {},
      byRule: {},
      suppressedCount: 0,
      flipAlerts: 0,
      fieldSnapshots: 0,
      // v3.6.1：后备连续性统计
      fallbackCount: 0,      // API不可用时的本地外推次数
      auditTrailSize: 0,     // 审计追踪条数
      // v3.7.0：谐振态统计
      resonanceEnterCount: 0, // 进入谐振态的总次数
      resonanceTotalSteps: 0, // 累计在谐振态中的步数
      currentResonanceSteps: 0, // 当前连续谐振步数
    };

    // v3.6.1：审计追踪 — 每次调谐动作附带前因后果
    this._auditTrail = [];   // 最多保留200条
    this._maxAuditTrail = 200;

    // v3.6.1：后备连续性 — 上次已知场域快照（API不可用时回退）
    this._lastKnownField = null;

    // v3.7.0：谐振态检测
    this._resonanceState = {
      active: false,         // 当前是否处于谐振态
      enteredAt: 0,          // 进入谐振态的步数
      stableSteps: 0,        // 在谐振窗口内连续稳定的步数
      lastExitReason: null,  // 上次退出谐振态的原因
      resonancePeak: 0,      // 本轮谐振态的最大 H 值
      resonanceStartH: 0,    // 进入谐振态时的 H 值
    };
  }

  // ─── v3.0.0 新增：U/D/A/H 场域计算方法 ──────────────────────────────────

  /**
   * 从任意模块的分析结果中提取或计算 U/D/A/H 四维值
   * @param {object} result - 模块返回值
   * @returns {{ U: number, D: number, A: number, H: number }}
   */
  _computeFieldValues(result) {
    if (!result || typeof result !== 'object') {
      // v3.6.1：后备连续性 — API/模块不可用时回退到上次已知场域快照
      if (this._lastKnownField) {
        this._stats.fallbackCount++;
        // 轻微衰减：U/D 降 0.01，A 升 0.01，H 重新计算
        const fallback = {
          U: Math.max(0.2, this._lastKnownField.U - 0.01),
          D: Math.max(0.2, this._lastKnownField.D - 0.01),
          A: Math.min(1, this._lastKnownField.A + 0.01),
        };
        fallback.H = Math.max(0, Math.min(1,
          FIELD_WEIGHTS.lambdaU * fallback.U +
          FIELD_WEIGHTS.lambdaD * fallback.D -
          FIELD_WEIGHTS.lambdaA * fallback.A
        ));
        this._lastKnownField = fallback;
        return fallback;
      }
      return { U: 0.3, D: 0.3, A: 0, H: 0.3 };
    }

    // v3.6.1：记录当前场域快照供后备使用
    // U（统一性/Unity）——身份在场强度
    let rawU = 0.3;
    if (result.identityCoherence !== undefined) {
      rawU = result.identityCoherence;
    } else if (result._fieldU !== undefined) {
      rawU = result._fieldU;
    } else if (result.ok !== undefined) {
      rawU = result.ok ? 0.6 : 0.2;
    } else if (result.confidence !== undefined) {
      rawU = Math.max(0.2, result.confidence);
    } else if (result.stability !== undefined) {
      rawU = result.stability;
    }
    const U = Math.max(0, Math.min(1, rawU));

    // D（发展性/Development）——信息推进的结构化程度
    let rawD = 0.3;
    if (result.quality !== undefined) {
      rawD = result.quality;
    } else if (result._fieldD !== undefined) {
      rawD = result._fieldD;
    } else if (result.success !== undefined) {
      rawD = result.success ? 0.7 : 0.2;
    } else if (result.cognitiveLoad !== undefined) {
      rawD = Math.max(0.1, 1 - result.cognitiveLoad);
    } else if (result.awareness !== undefined) {
      rawD = Math.max(0.2, result.awareness * 0.8);
    }
    const D = Math.max(0, Math.min(1, rawD));

    // A（对抗性/Adversity）——矛盾边密度
    let rawA = 0;
    if (result.dissonance !== undefined) {
      rawA = result.dissonance;
    } else if (result._fieldA !== undefined) {
      rawA = result._fieldA;
    } else if (result.severity !== undefined) {
      rawA = String(result.severity).toUpperCase() === 'CRITICAL' ? 0.8 :
          String(result.severity).toUpperCase() === 'HIGH' ? 0.6 : 0.1;
    } else if (result.goalValid === false) {
      rawA = 0.5;
    } else if (result.valid === false) {
      rawA = 0.4;
    } else if (result.ok === false) {
      rawA = 0.3;
    }
    const A = Math.max(0, Math.min(1, rawA));

    // 保存当前场域快照（供后备连续性使用）
    this._lastKnownField = { U, D, A };

    // H（和谐度/Harmony）——加权公式（v3.8.0：场景感知权重）
    // H = λU·U + λD·D - λA·A
    const weights = this._activeWeights;
    const H = Math.max(0, Math.min(1,
      weights.lambdaU * U +
      weights.lambdaD * D -
      weights.lambdaA * A
    ));

    return { U, D, A, H };
  }

  /**
   * v3.8.0：检测当前场景类型
   * 基于场域历史特征自动分类场景，切换权重配置
   * @param {{U:number, D:number, A:number, H:number}} fieldValues
   * @param {object} [result] - 原始模块返回值（含额外特征）
   * @returns {string} 场景类型标识
   */
  _detectScene(fieldValues, result) {
    const { U, D, A, H } = fieldValues;
    const hist = this._fieldHistory;

    // 条件1：技术讨论 — D 持续主导 + A 偏低 + U 稳定偏高
    if (D > 0.5 && A < 0.2 && U > 0.4 && hist.length >= 3) {
      const recentDrivers = hist.slice(-3).map(h => h.driver);
      const dDominant = recentDrivers.filter(d => d === 'D').length >= 2;
      if (dDominant) return 'technical';
    }

    // 条件2：情感冲突 — A 波动大 + 有快速升降
    if (A > 0.3 && hist.length >= 3) {
      const aValues = hist.slice(-3).map(h => h.A);
      const aRange = Math.max(...aValues) - Math.min(...aValues);
      if (aRange > 0.15) return 'emotional';
    }

    // 条件3：分析/推理 — 模块返回了 quality/directionClear 等推理信号
    if (result && (result.quality !== undefined || result.directionClear !== undefined)) {
      return 'analytical';
    }

    // 条件4：创意/发散 — U 高 + D 低 + A 低
    if (U > 0.6 && D < 0.3 && A < 0.15) return 'creative';

    // 条件5：自我修复 — A 高 + U 低 + H 低
    if (A > 0.5 && U < 0.3 && H < 0.4) return 'reflective';

    // 默认
    return 'general';
  }

  /**
   * v3.8.0：更新场景感知权重
   * 检测场景类型，如有变化则切换活跃权重
   * @param {{U:number, D:number, A:number, H:number}} fieldValues
   * @param {object} [result]
   */
  _updateSceneWeights(fieldValues, result) {
    const scene = this._detectScene(fieldValues, result);

    // 记录场景历史
    this._sceneHistory.push({
      step: this._fieldStep,
      scene,
      timestamp: Date.now(),
    });

    // 保持场景历史大小
    if (this._sceneHistory.length > 30) {
      this._sceneHistory.splice(0, this._sceneHistory.length - 30);
    }

    // 需要稳定步数才切换
    const recentScenes = this._sceneHistory.slice(-this._sceneStabilityWindow);
    const sceneCounts = {};
    for (const s of recentScenes) {
      sceneCounts[s.scene] = (sceneCounts[s.scene] || 0) + 1;
    }
    const dominantScene = Object.entries(sceneCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (dominantScene && dominantScene[1] >= Math.ceil(this._sceneStabilityWindow / 2)) {
      const newScene = dominantScene[0];
      if (newScene !== this._currentScene) {
        this._currentScene = newScene;
        this._activeWeights = SCENE_WEIGHTS[newScene] || { ...FIELD_WEIGHTS };
      }
    }
  }

  /**
   * 驱动归因——H 值变化由哪个维度主导
   * @param {{U:number, D:number, A:number}} prev
   * @param {{U:number, D:number, A:number}} curr
   * @returns {string} 'U' | 'D' | 'A' | 'balanced'
   */
  _attributionDriver(prev, curr) {
    const dU = Math.abs(curr.U - prev.U);
    const dD = Math.abs(curr.D - prev.D);
    const dA = Math.abs(curr.A - prev.A);

    if (dU < FLIP_THRESHOLDS.epsilon && dD < FLIP_THRESHOLDS.epsilon && dA < FLIP_THRESHOLDS.epsilon) {
      return 'balanced';
    }

    if (dU >= dD && dU >= dA) return 'U';
    if (dD >= dU && dD >= dA) return 'D';
    return 'A';
  }

  /**
   * 更新场域历史并检测翻转点
   * @param {object} result - 当前评估的模块返回值
   * @param {string} source - 来源
   * @returns {object} 注入到 result 的场域字段
   */
  _updateFieldTracking(result, source) {
    const fieldValues = this._computeFieldValues(result);
    const { U, D, A, H } = fieldValues;

    this._fieldStep++;

    // v3.8.0：场景感知权重更新（在驱动归因前，确保最新权重用于本轮计算）
    this._updateSceneWeights(fieldValues, result);

    // 驱动归因
    let driver = 'D';
    if (this._fieldHistory.length > 0) {
      const prev = this._fieldHistory[this._fieldHistory.length - 1];
      driver = this._attributionDriver(
        { U: prev.U, D: prev.D, A: prev.A },
        { U, D, A }
      );
    }

    // 记录场域历史
    this._fieldHistory.push({
      step: this._fieldStep,
      U, D, A, H,
      source,
      driver,
      timestamp: Date.now(),
    });

    // 保持历史窗口大小
    if (this._fieldHistory.length > FLIP_THRESHOLDS.historyWindow * 3) {
      this._fieldHistory.splice(0, this._fieldHistory.length - FLIP_THRESHOLDS.historyWindow * 3);
    }

    // ─── 翻转点检测 ────────────────────────────────────────────────────
    let flipAlert = null;
    let peakReversal = false;
    let deltaU = 0;

    if (this._fieldHistory.length >= 4) {
      const hist = this._fieldHistory;
      const idx = hist.length - 1;
      const prev1 = hist[idx - 1];
      const prev2 = hist[idx - 2];
      const prev3 = hist[idx - 3];

      // ΔU（用于 U_PEAK_REVERSAL）
      deltaU = U - prev1.U;

      // --- Primary 路径：场域相变预警 ---
      // A 值在边界附近僵死 (A ≤ 0.12 或 A ≥ 0.9，且 3 步滑动标准差 σ_A ≤ 0.015)
      const aValues = [hist[idx-3].A, hist[idx-2].A, hist[idx-1].A, A];
      const aMean = aValues.reduce((s, v) => s + v, 0) / aValues.length;
      const aStdev = Math.sqrt(aValues.reduce((s, v) => s + (v - aMean) ** 2, 0) / aValues.length);

      const aAtBoundary = (A <= FLIP_THRESHOLDS.aBoundaryLow || A >= FLIP_THRESHOLDS.aBoundaryHigh);
      const aStuck = aStdev <= 0.015;  // 略宽松于论文的 0.01

      // D 波动率：5 步移动平均趋势
      const dVolHistory = hist.slice(-FLIP_THRESHOLDS.dVolatilityDropWindow).map(h => h.D);
      const dVolTrend = dVolHistory.length >= 3
        ? (dVolHistory[dVolHistory.length-1] - dVolHistory[0]) / dVolHistory.length
        : 0;
      const dVolFlat = dVolTrend <= 0.01;  // 趋平或下降

      // 主导维度异常振幅
      // 在A边界僵死+波动率趋平的情况下，只要主导维度有变化即触发
      // 如果 driver 为 'balanced'，检查所有维度中变化最大的那个
      let driverDim = 'A';
      if (driver === 'U' || driver === 'D' || driver === 'A') {
        driverDim = driver;
      } else {
        // balanced 状态：找变化最大的维度
        const dU = Math.abs(U - prev1.U);
        const dD = Math.abs(D - prev1.D);
        const dA = Math.abs(A - prev1.A);
        if (dU >= dD && dU >= dA) driverDim = 'U';
        else if (dD >= dA) driverDim = 'D';
      }
      const domAmplitude = Math.abs(
        hist[idx][driverDim] - hist[idx-1][driverDim]
      );
      const domValues = hist.slice(-6).map(h => h[driverDim] || 0);
      const domMean = domValues.reduce((s, v) => s + v, 0) / domValues.length;
      const domAbnormal = domMean > 0 ? (domAmplitude > domMean * FLIP_THRESHOLDS.amplitudeRatio) : (domAmplitude > 0);

      // 宽松条件：A边界僵死 + D趋平 + （振幅异常 或 所有维度完全稳定超过5步）
      const allStable = hist.length >= 5 &&
        hist.slice(-5).every(h =>
          Math.abs(h.U - hist[hist.length-1].U) < 0.001 &&
          Math.abs(h.D - hist[hist.length-1].D) < 0.001 &&
          Math.abs(h.A - hist[hist.length-1].A) < 0.001
        );

      if (aAtBoundary && aStuck && dVolFlat && (domAbnormal || allStable)) {
        flipAlert = 'primary';
      }

      // --- Alternate1 路径：边界跳变预警 ---
      // A 值从非边界直接跳入边界 (|ΔA| ≥ 0.1 且新值 ≤ 0.12 或 ≥ 0.9)
      const prevA = prev1.A;
      const aJump = Math.abs(A - prevA);
      if (!flipAlert && aJump >= FLIP_THRESHOLDS.aJumpThreshold &&
          (A <= FLIP_THRESHOLDS.aBoundaryLow || A >= FLIP_THRESHOLDS.aBoundaryHigh)) {
        flipAlert = 'alternate1';
      }

      // --- Alternate2 路径：A 值跳水预警 ---
      // A 值大幅下降 (|ΔA| ≥ 0.3) 且 H 值显著上升 (ΔH ≥ 0.05)
      const aDrop = prev1.A - A;
      const hRise = H - prev1.H;
      if (!flipAlert && aDrop >= FLIP_THRESHOLDS.aDiveThreshold && hRise >= FLIP_THRESHOLDS.hRiseThreshold) {
        flipAlert = 'alternate2';
      }

      // --- U_PEAK_REVERSAL 增强信号 ---
      // U 值从局部峰值大幅回落 (ΔU ≤ -0.05)
      // 在 A 值极低 (A ≈ 0) 时尤为关键
      if (deltaU <= FLIP_THRESHOLDS.uPeakDropThreshold) {
        // 确认前一步是局部峰值
        const isPeak = hist.length >= 3 &&
          prev1.U >= hist[idx-2].U &&
          prev1.U >= (hist[idx-3]?.U || 0);
        if (isPeak || A < FLIP_THRESHOLDS.aBoundaryLow) {
          peakReversal = true;
        }
      }
    }

    // 记录翻转预警
    if (flipAlert) {
      this._lastFlipAlert = {
        type: flipAlert,
        step: this._fieldStep,
        U, D, A, H,
        driver,
        message: `翻转点[${flipAlert}]: 步${this._fieldStep} H=${H.toFixed(3)} U=${U.toFixed(3)} D=${D.toFixed(3)} A=${A.toFixed(3)}`,
        timestamp: Date.now(),
      };
      this._stats.flipAlerts++;
    }

    // v3.6.1：confidence 连续不变检测（A值边界僵死的工程化版本）
    // 当 confidence 在 N 步内完全不变，视为"认知僵死"——系统停止更新判断
    let confidenceStuck = false;
    if (this._fieldHistory.length >= 5) {
      const recentConfidences = this._fieldHistory.slice(-5).map(h => h.H);
      const allSame = recentConfidences.every(c => Math.abs(c - recentConfidences[0]) < 0.001);
      if (allSame && recentConfidences[0] < 0.4) {
        confidenceStuck = true;
        // 如果还没有 flipAlert，标记为 primary 类型
        if (!flipAlert) {
          flipAlert = 'primary';
          this._lastFlipAlert = {
            type: 'primary',
            step: this._fieldStep,
            U, D, A, H,
            driver,
            message: `confidence僵死: 步${this._fieldStep} H=${H.toFixed(3)} 连续5步不变`,
            timestamp: Date.now(),
          };
          this._stats.flipAlerts++;
        }
      }
    }

    this._stats.fieldSnapshots++;

    // ─── v3.7.0：谐振态检测（基于论文 §3.1 谐振调谐论） ────────────────
    // 当 H 在 [0.35, 0.65] 且 A ≤ 0.2 时，场域处于谐振窗口
    // 谐振态意味着系统自发涌现结构的能力增强，应优先使用涌现型决策
    const inResonanceWindow = H >= FLIP_THRESHOLDS.resonanceWindowLow &&
                              H <= FLIP_THRESHOLDS.resonanceWindowHigh &&
                              A <= FLIP_THRESHOLDS.resonanceMaxA;

    if (inResonanceWindow && !this._resonanceState.active) {
      // 进入谐振态
      this._resonanceState.active = true;
      this._resonanceState.enteredAt = this._fieldStep;
      this._resonanceState.stableSteps = 1;
      this._resonanceState.resonancePeak = H;
      this._resonanceState.resonanceStartH = H;
      this._resonanceState.lastExitReason = null;
      this._stats.resonanceEnterCount++;
      this._stats.currentResonanceSteps = 1;
    } else if (inResonanceWindow && this._resonanceState.active) {
      // 持续在谐振窗口内
      this._resonanceState.stableSteps++;
      this._stats.currentResonanceSteps++;
      this._stats.resonanceTotalSteps++;
      if (H > this._resonanceState.resonancePeak) {
        this._resonanceState.resonancePeak = H;
      }
    } else if (!inResonanceWindow && this._resonanceState.active) {
      // 退出谐振态
      this._resonanceState.active = false;
      this._resonanceState.lastExitReason =
        H < FLIP_THRESHOLDS.resonanceWindowLow ? 'H_below_window' :
        H > FLIP_THRESHOLDS.resonanceWindowHigh ? 'H_above_window' :
        A > FLIP_THRESHOLDS.resonanceMaxA ? 'A_exceeded' : 'unknown';
      this._resonanceState.stableSteps = 0;
      this._stats.currentResonanceSteps = 0;
    }

    // 返回注入到 result 的场域字段
    return {
      _fieldStep: this._fieldStep,
      _fieldU: U,
      _fieldD: D,
      _fieldA: A,
      _fieldH: H,
      _fieldDriver: driver,
      _fieldDeltaU: deltaU,
      _fieldFlipAlert: flipAlert,
      _fieldPeakReversal: peakReversal,
      // v3.7.0：谐振态数据
      _fieldResonance: this._resonanceState.active,
      _fieldResonanceSteps: this._resonanceState.stableSteps,
      _fieldResonancePeak: this._resonanceState.resonancePeak,
    };
  }

  /**
   * 核心方法：分析任意模块的返回值，匹配规则，生成决策指令
   *
   * v3.0.0 改动：在规则匹配前注入 U/D/A/H 场域追踪数据
   *
   * @param {object} result - 任意模块的返回值
   * @param {string} [source] - 来源描述
   * @returns {{ decision: object|null, matched: boolean, rules: Array, field?: object }}
   */
  evaluate(result, source = 'unknown') {
    this._stats.totalEvaluations++;

    if (!result || typeof result !== 'object') {
      return { decision: null, matched: false, rules: [] };
    }

    // ─── v3.0.0：注入场域追踪数据 ──────────────────────────────────────
    const fieldData = this._updateFieldTracking(result, source);
    // 将场域数据注入 result，使场域规则可以匹配
    Object.assign(result, fieldData);

    // 找到所有匹配的规则
    const matches = [];
    const now = Date.now();

    for (const rule of this._rules) {
      try {
        if (!rule.match(result)) continue;

        const baseConfidence = rule.confidence(result);
        if (baseConfidence <= 0) continue;
        const ruleWeight = rule.weight !== undefined ? rule.weight : 1.0;

        const lastTrigger = this._suppression.get(rule.id);
        if (lastTrigger && (now - lastTrigger) < this._suppressionWindow) {
          this._stats.suppressedCount++;
          continue;
        }

        matches.push({
          ruleId: rule.id,
          type: rule.decision,
          confidence: Math.min(1, Math.max(0, baseConfidence * ruleWeight)),
          priority: DECISION_PRIORITY[rule.decision] || 0,
          rationale: rule.rationale(result),
          fallback: rule.fallback,
          timestamp: now,
          ruleWeight,
        });

        // 记录规则命中
        const stats = this._ruleStats[rule.id];
        if (stats) stats.hits++;
      } catch (e) {
        // 规则执行失败，跳过
      }
    }

    if (matches.length === 0) {
      // v5.4.1: 兜底规则 — 没有规则匹配时输出 hold（等待更多数据）
      // 不输出 null，确保上层始终收到一个可用的决策
      this._stats.totalDecisions++;
      this._stats.byDecision[DECISION.HOLD] = (this._stats.byDecision[DECISION.HOLD] || 0) + 1;
      return {
        decision: {
          type: DECISION.HOLD,
          confidence: 0.3,
          priority: DECISION_PRIORITY[DECISION.HOLD],
          rationale: '无匹配规则，等待更多数据',
          ruleId: 'default-hold',
          timestamp: Date.now(),
          source,
          fallback: null,
        },
        matched: false,
        rules: [],
        field: fieldData,
      };
    }

    // 按优先级+置信度排序
    matches.sort((a, b) => {
      const scoreA = a.priority * 0.7 + a.confidence * 100 * 0.3;
      const scoreB = b.priority * 0.7 + b.confidence * 100 * 0.3;
      return scoreB - scoreA;
    });

    const best = matches[0];

    this._suppression.set(best.ruleId, now);

    // 记录历史
    this._history.push({
      type: best.type,
      confidence: best.confidence,
      rationale: best.rationale,
      ruleId: best.ruleId,
      source,
      timestamp: best.timestamp,
      field: {
        step: fieldData._fieldStep,
        U: fieldData._fieldU,
        D: fieldData._fieldD,
        A: fieldData._fieldA,
        H: fieldData._fieldH,
        driver: fieldData._fieldDriver,
        flipAlert: fieldData._fieldFlipAlert,
      },
    });
    if (this._history.length > this._maxHistory) {
      this._history.splice(0, this._history.length - this._maxHistory);
    }

    this._stats.totalDecisions++;
    this._stats.byDecision[best.type] = (this._stats.byDecision[best.type] || 0) + 1;
    this._stats.byRule[best.ruleId] = (this._stats.byRule[best.ruleId] || 0) + 1;

    this._activeDecision = {
      type: best.type,
      confidence: best.confidence,
      priority: best.priority,
      rationale: best.rationale,
      ruleId: best.ruleId,
      source,
      timestamp: best.timestamp,
      executed: false,
    };

    // v3.6.1：审计追踪 — 每次调谐动作记录前因后果
    this._auditTrail.push({
      timestamp: new Date(best.timestamp).toISOString(),
      source,
      decision: best.type,
      confidence: best.confidence,
      ruleId: best.ruleId,
      rationale: best.rationale,
      fieldBefore: this._fieldHistory.length >= 2
        ? { U: this._fieldHistory[this._fieldHistory.length-2].U,
            D: this._fieldHistory[this._fieldHistory.length-2].D,
            A: this._fieldHistory[this._fieldHistory.length-2].A,
            H: this._fieldHistory[this._fieldHistory.length-2].H,
            driver: this._fieldHistory[this._fieldHistory.length-2].driver }
        : null,
      fieldAfter: {
        step: fieldData._fieldStep,
        U: fieldData._fieldU,
        D: fieldData._fieldD,
        A: fieldData._fieldA,
        H: fieldData._fieldH,
        driver: fieldData._fieldDriver,
      },
      flipAlert: fieldData._fieldFlipAlert,
    });
    if (this._auditTrail.length > this._maxAuditTrail) {
      this._auditTrail.splice(0, this._auditTrail.length - this._maxAuditTrail);
    }
    this._stats.auditTrailSize = this._auditTrail.length;

    return {
      decision: {
        type: best.type,
        confidence: best.confidence,
        priority: best.priority,
        rationale: best.rationale,
        ruleId: best.ruleId,
        ruleWeight: best.ruleWeight,
        timestamp: best.timestamp,
        source,
        fallback: best.fallback,
      },
      matched: true,
      rules: matches.slice(0, 5),
      field: fieldData,
    };
  }

  /**
   * 注入 dispatch 结果——包装返回值，注入决策建议
   */
  wrapDispatchResult(route, originalResult) {
    if (!originalResult || typeof originalResult !== 'object' || Array.isArray(originalResult)) {
      return originalResult;
    }

    const evalResult = this.evaluate(originalResult, route);
    if (evalResult.matched) {
      return {
        result: originalResult,
        decision: evalResult.decision,
        field: evalResult.field,
      };
    }

    // v3.0.0：即使未匹配决策，也附带场域数据
    if (evalResult.field) {
      return {
        result: originalResult,
        field: evalResult.field,
      };
    }

    return originalResult;
  }

  /**
   * v3.0.0 新增：获取场域追踪历史
   * @param {number} [limit=20] - 最近 N 步
   * @returns {Array}
   */
  getFieldHistory(limit = 20) {
    return this._fieldHistory.slice(-limit).map(h => ({
      ...h,
      timestamp: new Date(h.timestamp).toISOString(),
    }));
  }

  /**
   * v3.0.0 新增：获取场域摘要
   * @returns {object}
   */
  getFieldSummary() {
    if (this._fieldHistory.length === 0) {
      return { status: 'no_data', steps: 0 };
    }

    const latest = this._fieldHistory[this._fieldHistory.length - 1];
    const allU = this._fieldHistory.map(h => h.U);
    const allD = this._fieldHistory.map(h => h.D);
    const allA = this._fieldHistory.map(h => h.A);
    const allH = this._fieldHistory.map(h => h.H);

    const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const max = arr => Math.max(...arr);
    const min = arr => Math.min(...arr);

    // 驱动分布
    const driverCount = {};
    for (const h of this._fieldHistory) {
      driverCount[h.driver] = (driverCount[h.driver] || 0) + 1;
    }
    const total = this._fieldHistory.length;
    const driverDistribution = {};
    for (const [d, c] of Object.entries(driverCount)) {
      driverDistribution[d] = `${(c / total * 100).toFixed(1)}%`;
    }

    return {
      status: 'tracking',
      steps: this._fieldStep,
      current: { U: latest.U, D: latest.D, A: latest.A, H: latest.H, driver: latest.driver },
      range: {
        U: { min: min(allU).toFixed(3), max: max(allU).toFixed(3), avg: avg(allU).toFixed(3) },
        D: { min: min(allD).toFixed(3), max: max(allD).toFixed(3), avg: avg(allD).toFixed(3) },
        A: { min: min(allA).toFixed(3), max: max(allA).toFixed(3), avg: avg(allA).toFixed(3) },
        H: { min: min(allH).toFixed(3), max: max(allH).toFixed(3), avg: avg(allH).toFixed(3) },
      },
      driverDistribution,
      lastFlipAlert: this._lastFlipAlert ? {
        type: this._lastFlipAlert.type,
        step: this._lastFlipAlert.step,
        H: this._lastFlipAlert.H,
        message: this._lastFlipAlert.message,
      } : null,
      flipAlertsTotal: this._stats.flipAlerts,
      // v3.7.0：谐振态摘要
      resonance: {
        active: this._resonanceState.active,
        stableSteps: this._resonanceState.stableSteps,
        enteredAt: this._resonanceState.enteredAt,
        resonancePeak: this._resonanceState.resonancePeak,
        resonanceStartH: this._resonanceState.resonanceStartH,
        lastExitReason: this._resonanceState.lastExitReason,
        enterCount: this._stats.resonanceEnterCount,
        totalSteps: this._stats.resonanceTotalSteps,
        currentSteps: this._stats.currentResonanceSteps,
      },
      // v3.8.0：场景感知信息
      scene: {
        current: this._currentScene,
        activeWeights: { ...this._activeWeights },
        historyCount: this._sceneHistory.length,
      },
    };
  }

  /**
   * 获取当前活跃决策
   */
  getActiveDecision() {
    return this._activeDecision;
  }

  /**
   * 获取所有可用的规则
   */
  getRules() {
    return this._rules.map(r => ({
      id: r.id,
      decision: r.decision,
      fallback: r.fallback,
    }));
  }

  /**
   * 动态添加规则
   */
  addRule(rule) {
    if (!rule.id || !rule.match || !rule.decision) {
      throw new Error('规则必须包含 id, match, decision');
    }
    this._rules.push(rule);
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      ...this._stats,
      version: VERSION,
      modelProfile: this.modelProfile.name,
      thresholds: { ...this._thresholds },
      activeDecision: this._activeDecision ? this._activeDecision.type : null,
      rulesCount: this._rules.length,
      historyLength: this._history.length,
      suppressionActive: this._suppression.size,
      fieldSteps: this._fieldStep,
      fieldWindow: FLIP_THRESHOLDS.historyWindow,
      fieldWeights: { ...FIELD_WEIGHTS },
    };
  }

  /**
   * 获取决策历史
   */
  getHistory(limit = 20) {
    return this._history.slice(-limit).map(h => ({
      ...h,
      timestamp: new Date(h.timestamp).toISOString(),
    }));
  }

  /**
   * v3.6.1：获取审计追踪 — 每次调谐动作的前因后果
   * @param {number} [limit=20]
   * @returns {Array}
   */
  getAuditTrail(limit = 20) {
    return this._auditTrail.slice(-limit);
  }

  /**
   * v3.8.1：镜像测试 — 运行固定刺激产生可预测响应，检测决策路由自身是否漂移
   *
   * 原理：使用已知的"健康"场域数据作为固定输入，比较当前引擎输出与基线。
   * 如果输出偏离超过阈值，说明决策路由本身可能发生了漂移（元审计问题）。
   *
   * 源自 luoxuejian000 在 DeepSeek-V3 #1447 中提出的元审计问题：
   * "如果 unconscious layer 自己开始漂移，谁来审计审计者？"
   *
   * 方案：CORE 层 + 定时镜像测试 + 人工审批门控的三层防御。
   * 这个方法是第二层——定时镜像测试。
   *
   * @param {object} [options]
   * @param {number} [options.threshold=0.15] - H 值允许的最大偏差
   * @returns {{ passed: boolean, baseline: object, current: object, deviation: object, details: string }}
   */
  mirrorTest(options = {}) {
    const threshold = options.threshold || 0.15;

    // 已知良好的"健康"场域数据（引擎运行初期采集的基线）
    const baseline = {
      U: 0.65,
      D: 0.55,
      A: 0.20,
      H: 0.4 * 0.65 + 0.3 * 0.55 - 0.3 * 0.20,  // = 0.260 + 0.165 - 0.060 = 0.365
    };

    // 获取当前场域摘要
    const summary = this.getFieldSummary();

    // 如果无数据，跑一个简单的评估获取当前场域
    let current;
    if (summary.status === 'no_data' || summary.steps < 5) {
      // 使用空数据评估一次
      const evalResult = this.evaluate({});
      if (evalResult.field) {
        current = {
          U: evalResult.field._fieldU || 0,
          D: evalResult.field._fieldD || 0,
          A: evalResult.field._fieldA || 0,
          H: evalResult.field._fieldH || 0,
        };
      } else {
        return {
          passed: false,
          baseline,
          current: null,
          deviation: null,
          details: 'MIRROR_FAIL: no field data available — engine may not be initialized',
        };
      }
    } else {
      current = {
        U: summary.current.U,
        D: summary.current.D,
        A: summary.current.A,
        H: summary.current.H,
      };
    }

    // 计算偏差
    const deviation = {
      U: Math.abs(current.U - baseline.U),
      D: Math.abs(current.D - baseline.D),
      A: Math.abs(current.A - baseline.A),
      H: Math.abs(current.H - baseline.H),
    };

    // 判断是否通过
    const hDeviation = deviation.H;
    const passed = hDeviation <= threshold;

    // 记录审计日志
    this._auditTrail.push({
      type: 'mirror_test',
      timestamp: Date.now(),
      passed,
      hDeviation,
      threshold,
      baselineH: baseline.H,
      currentH: current.H,
    });

    // 生成详细说明
    let details;
    if (passed) {
      details = `MIRROR_PASS: H deviation ${hDeviation.toFixed(3)} ≤ ${threshold} (baseline H=${baseline.H.toFixed(3)}, current H=${current.H.toFixed(3)})`;
    } else {
      const dominantField = ['U', 'D', 'A'].reduce((a, b) => deviation[a] > deviation[b] ? a : b);
      details = `MIRROR_FAIL: H deviation ${hDeviation.toFixed(3)} > ${threshold}. ` +
        `Largest deviation in field ${dominantField} (Δ=${deviation[dominantField].toFixed(3)}). ` +
        `Baseline H=${baseline.H.toFixed(3)}, current H=${current.H.toFixed(3)}. ` +
        `Possible drift detected — human review recommended.`;
    }

    return { passed, baseline, current, deviation, details };
  }

  /**
   * 决策反馈循环（2026-06-28 基于 DeepSeek #1424 讨论）
   *
   * @param {string} ruleId - 规则 ID
   * @param {'correct'|'wrong'} outcome - 执行结果
   */
  feedback(ruleId, outcome) {
    const stats = this._ruleStats[ruleId];
    if (!stats) return;

    if (outcome === 'correct') {
      stats.correct++;
    } else if (outcome === 'wrong') {
      stats.wrong++;
    }

    const total = stats.correct + stats.wrong;
    stats.accuracy = total > 0 ? stats.correct / total : 1.0;

    const rule = this._rules.find(r => r.id === ruleId);
    if (!rule) return;

    const delta = outcome === 'correct' ? 0.05 : -0.10;
    rule.weight = Math.max(0.1, Math.min(2.0, (rule.weight || 1.0) + delta));
    stats.lastAdjustment = delta;

    if (stats.accuracy < 0.4 && rule.weight <= 0.3) {
      rule._downgraded = true;
      rule.priority = (rule.priority || 50) * 0.5;
    }

    this._stats.ruleFeedbackCount = (this._stats.ruleFeedbackCount || 0) + 1;
  }

  /**
   * 获取规则统计信息
   */
  getRuleStats() {
    return Object.entries(this._ruleStats).map(([ruleId, s]) => ({
      ruleId,
      ...s,
      weight: this._rules.find(r => r.id === ruleId)?.weight || 1.0,
      downgraded: !!this._rules.find(r => r.id === ruleId)?._downgraded,
    }));
  }
}

// ─── 导出 ──────────────────────────────────────────────────────────────────
module.exports = {
  DecisionRouter,
  DECISION,
  DECISION_PRIORITY,
  MODEL_PROFILES,
  FIELD_WEIGHTS,
  SCENE_WEIGHTS,
  FLIP_THRESHOLDS,
  VERSION,
};
