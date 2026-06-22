/**
 * decision-router.js — 通用分析→决策路由引擎 v1.0.0
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

const VERSION = '2.0.0';

// ─── 模型配置文件 ────────────────────────────────────────────────────────
// 不同模型有不同的校准质量，置信度阈值需要相应调整
// calibration 越好（自信越准确），阈值越低；越差（容易幻觉），阈值越高
const MODEL_PROFILES = {
  // flash 模型：快速但容易幻觉/过度自信
  flash: {
    label: 'Fast inference, prone to hallucination',
    confidenceFloor: 0.3,    // 最低可信置信度
    confidenceStandard: 0.5, // 标准决策阈值
    confidenceHigh: 0.7,     // 高风险决策阈值
    confidenceMax: 0.9,      // 无条件通过阈值
    decisionShift: 0.0,      // 所有阈值整体偏移量（负值=更宽松，正值=更严格）
    explorationEpsilon: 0.10, // Q-table 探索率
    fallbackThreshold: 0.4,  // 低于此值强制回退
  },
  // 完整版模型：更好的校准质量
  premium: {
    label: 'Well-calibrated full model',
    confidenceFloor: 0.3,
    confidenceStandard: 0.4,
    confidenceHigh: 0.55,
    confidenceMax: 0.85,
    decisionShift: -0.05,
    explorationEpsilon: 0.08,
    fallbackThreshold: 0.3,
  },
  // 顶级模型（GPT-4/Claude级别）：校准质量极高
  flagship: {
    label: 'Best-in-class calibration',
    confidenceFloor: 0.2,
    confidenceStandard: 0.35,
    confidenceHigh: 0.5,
    confidenceMax: 0.8,
    decisionShift: -0.1,
    explorationEpsilon: 0.05,
    fallbackThreshold: 0.25,
  },
  // 小/量化模型：校准质量差
  lightweight: {
    label: 'Small/quantized model, poor calibration',
    confidenceFloor: 0.4,
    confidenceStandard: 0.6,
    confidenceHigh: 0.8,
    confidenceMax: 0.95,
    decisionShift: 0.1,
    explorationEpsilon: 0.15,
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

// ─── 分析结果→决策规则（已移到构造函数中动态生成，引用 _thresholds） ──────

// ─── 决策路由引擎 ────────────────────────────────────────────────────────

class DecisionRouter {
  /**
   * @param {object} heartFlow - HeartFlow 主实例引用
   * @param {object} [options]
   * @param {string} [options.modelProfile='flash'] - 模型配置文件名（flash/premium/flagship/lightweight）
   * @param {object} [options.customProfile] - 自定义配置（覆盖 modelProfile）
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

    // 应用 decisionShift
    this._thresholds = {
      floor: this.modelProfile.confidenceFloor,
      standard: this.modelProfile.confidenceStandard,
      high: this.modelProfile.confidenceHigh,
      max: this.modelProfile.confidenceMax,
      fallback: this.modelProfile.fallbackThreshold,
    };

    // 规则（构造函数中动态生成，引用 _thresholds）
    const T = this._thresholds;
    this._rules = [
      // ── 认知类 ──
      {
        id: 'cognitive-overload',
        match: (r) => r.cognitiveLoad !== undefined || r.load !== undefined,
        decision: DECISION.PAUSE,
        confidence: (r) => {
          const load = r.cognitiveLoad || r.load || 0;
          return load > T.high ? 0.9 : load > T.standard ? 0.6 : 0;
        },
        rationale: (r) => `认知负荷 ${(r.cognitiveLoad || r.load || 0).toFixed(2)}，建议减速`,
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
        rationale: (r) => `低负荷(${((r.cognitiveLoad || r.load || 0)).toFixed(2)})+方向明确(${(r.directionClear || 0).toFixed(2)})，建议加速`,
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
        rationale: (r) => `认知失调 ${((r.dissonance || r.cognitiveDissonance || 0)).toFixed(2)}，需要自愈`,
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
      // ── 自我认知类 ──
      {
        id: 'identity-drift',
        match: (r) => r.identityCoherence !== undefined && r.identityCoherence < T.standard,
        decision: DECISION.TURN,
        confidence: (r) => 1 - (r.identityCoherence || 0),
        rationale: (r) => `自我认同一致性 ${(r.identityCoherence || 0).toFixed(2)}，低于安全线`,
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
      // ── 情绪/心理类 ──
      {
        id: 'psychological-distress',
        match: (r) => r.psychologicalDistress !== undefined || r.stressLevel !== undefined,
        decision: DECISION.REST,
        confidence: (r) => {
          const s = r.psychologicalDistress || r.stressLevel || 0;
          return s > T.high ? 0.85 : s > T.standard ? 0.6 : 0;
        },
        rationale: (r) => `心理压力 ${((r.psychologicalDistress || r.stressLevel || 0)).toFixed(2)}`,
        fallback: DECISION.PAUSE,
      },
      // ── 价值/伦理类 ──
      {
        id: 'value-alignment',
        match: (r) => r.valueConflict !== undefined && r.valueConflict > T.standard,
        decision: DECISION.TURN,
        confidence: (r) => r.valueConflict,
        rationale: (r) => `价值冲突 ${r.valueConflict.toFixed(2)}`,
        fallback: DECISION.PAUSE,
      },
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
    ];

    // 决策历史
    this._history = [];
    this._maxHistory = 500;

    // 当前活跃决策
    this._activeDecision = null;

    // 抑制——防止同一规则在短时间内重复触发
    this._suppression = new Map(); // ruleId → lastTriggerTime
    this._suppressionWindow = 10000; // 10秒内不重复触发同一规则

    // 统计
    this._stats = {
      totalEvaluations: 0,
      totalDecisions: 0,
      byDecision: {},
      byRule: {},
      suppressedCount: 0,
    };
  }

  /**
   * 核心方法：分析任意模块的返回值，匹配规则，生成决策指令
   *
   * @param {object} result - 任意模块的返回值
   * @param {string} [source] - 来源描述（如 'selfModel.assess'）
   * @returns {{ decision: object|null, matched: boolean, rules: Array }}
   *   decision: { type, confidence, priority, rationale, ruleId, timestamp }
   *   matched: 是否有匹配的规则
   *   rules: 所有匹配的规则（按优先级排序）
   */
  evaluate(result, source = 'unknown') {
    this._stats.totalEvaluations++;

    if (!result || typeof result !== 'object') {
      return { decision: null, matched: false, rules: [] };
    }

    // 找到所有匹配的规则
    const matches = [];
    const now = Date.now();

    for (const rule of this._rules) {
      try {
        // 先检查 match，再计算 confidence
        if (!rule.match(result)) continue;
        
        const confidence = rule.confidence(result);
        if (confidence <= 0) continue;

        // 检查抑制
        const lastTrigger = this._suppression.get(rule.id);
        if (lastTrigger && (now - lastTrigger) < this._suppressionWindow) {
          this._stats.suppressedCount++;
          continue;
        }

        matches.push({
          ruleId: rule.id,
          type: rule.decision,
          confidence: Math.min(1, Math.max(0, confidence)),
          priority: DECISION_PRIORITY[rule.decision] || 0,
          rationale: rule.rationale(result),
          fallback: rule.fallback,
          timestamp: now,
        });
      } catch (e) {
        // 规则执行失败，跳过
      }
    }

    if (matches.length === 0) {
      return { decision: null, matched: false, rules: [] };
    }

    // 按优先级+置信度排序，取最优
    matches.sort((a, b) => {
      const scoreA = a.priority * 0.7 + a.confidence * 100 * 0.3;
      const scoreB = b.priority * 0.7 + b.confidence * 100 * 0.3;
      return scoreB - scoreA;
    });

    const best = matches[0];

    // 更新抑制
    this._suppression.set(best.ruleId, now);

    // 记录历史
    this._history.push({
      type: best.type,
      confidence: best.confidence,
      rationale: best.rationale,
      ruleId: best.ruleId,
      source,
      timestamp: best.timestamp,
    });
    if (this._history.length > this._maxHistory) {
      this._history.splice(0, this._history.length - this._maxHistory);
    }

    // 更新统计
    this._stats.totalDecisions++;
    this._stats.byDecision[best.type] = (this._stats.byDecision[best.type] || 0) + 1;
    this._stats.byRule[best.ruleId] = (this._stats.byRule[best.ruleId] || 0) + 1;

    // 设为当前活跃决策
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

    return {
      decision: {
        type: best.type,
        confidence: best.confidence,
        priority: best.priority,
        rationale: best.rationale,
        ruleId: best.ruleId,
        timestamp: best.timestamp,
        source,
        fallback: best.fallback,
      },
      matched: true,
      rules: matches.slice(0, 5), // 返回前5个匹配
    };
  }

  /**
   * 注入 dispatch 结果——包装返回值，注入决策建议
   *
   * @param {string} route - dispatch 路由（如 'selfModel.assess'）
   * @param {*} originalResult - dispatch 原始返回值
   * @returns {*} 如果匹配决策规则，返回 { result, decision }；否则返回原始值
   */
  wrapDispatchResult(route, originalResult) {
    // 只处理对象返回值
    if (!originalResult || typeof originalResult !== 'object' || Array.isArray(originalResult)) {
      return originalResult;
    }

    const evalResult = this.evaluate(originalResult, route);
    if (evalResult.matched) {
      return {
        result: originalResult,
        decision: evalResult.decision,
      };
    }

    return originalResult;
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
   * @param {object} rule - { id, match, decision, confidence, rationale, fallback }
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
}

// ─── 导出 ──────────────────────────────────────────────────────────────────

module.exports = {
  DecisionRouter,
  DECISION,
  DECISION_PRIORITY,
  MODEL_PROFILES,
  VERSION,
};
