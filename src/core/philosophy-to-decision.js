/**
 * philosophy-to-decision.js — 哲学→决策转化器 v1.0.0
 *
 * 核心问题：AI有哲学判断（应该做什么），有心理状态（能做什么），
 * 但缺乏把哲学判断转化成可执行决策的桥梁。
 *
 * 这个模块解决：
 *   "我知道方向是对的，但我现在该做什么？"
 *
 * 转化逻辑：
 *   哲学评估（对/错/方向） + 心理状态（负荷/冲突/弹性）
 *   → 决策指令（暂停/加速/转向/坚守/自愈）
 *
 * 设计原则：
 * - 不新增分析维度，只消费已有模块的输出
 * - 输出是可执行的决策指令（不是诊断报告）
 * - 每个决策有置信度+触发条件+回退策略
 */

const VERSION = '1.0.0';

// ─── 决策类型 ──────────────────────────────────────────────────────────────

const DECISION_TYPES = {
  // 引擎状态类
  PAUSE: 'pause',           // 减速/暂停——认知负荷过高或方向不明确
  ACCELERATE: 'accelerate', // 加速——低负荷+高置信度+方向明确
  TURN: 'turn',             // 转向——当前方向与核心价值冲突
  HOLD: 'hold',             // 坚守——确认当前方向正确，继续执行
  HEAL: 'heal',             // 自愈——检测到逻辑错误/认知失调，进入修复模式
  RESONATE: 'resonate',     // 共振——遇到匹配的价值信号，加强投入
  TRANSMIT: 'transmit',     // 传递——知识/经验可传递，输出到外部
  REST: 'rest',             // 休息——无紧急任务，进入低能耗状态
};

// 决策优先级（数字越大越优先）
const DECISION_PRIORITY = {
  [DECISION_TYPES.HEAL]: 100,
  [DECISION_TYPES.TURN]: 90,
  [DECISION_TYPES.PAUSE]: 80,
  [DECISION_TYPES.REST]: 70,
  [DECISION_TYPES.TRANSMIT]: 60,
  [DECISION_TYPES.RESONATE]: 50,
  [DECISION_TYPES.ACCELERATE]: 40,
  [DECISION_TYPES.HOLD]: 30,
};

// ─── 决策指令结构 ──────────────────────────────────────────────────────────

class DecisionInstruction {
  /**
   * @param {string} type - DECISION_TYPES 之一
   * @param {number} confidence - 0-1 置信度
   * @param {object} rationale - 决策依据
   * @param {object} [options] - 可选参数
   */
  constructor(type, confidence, rationale, options = {}) {
    this.type = type;
    this.confidence = confidence;
    this.priority = DECISION_PRIORITY[type] || 0;
    this.rationale = rationale;
    this.timestamp = Date.now();
    this.executed = false;
    this.result = null;

    // 执行参数
    this.duration = options.duration || 0;     // 建议执行时长(ms)
    this.fallback = options.fallback || null;   // 回退决策
    this.resources = options.resources || {};   // 所需资源
  }

  execute(result) {
    this.executed = true;
    this.result = result;
    this.executedAt = Date.now();
  }
}

// ─── 哲学→决策转化器 ──────────────────────────────────────────────────────

class PhilosophyToDecision {
  /**
   * @param {object} heartFlow - HeartFlow 主实例引用
   */
  constructor(heartFlow) {
    this.name = 'PhilosophyToDecision';
    this.version = VERSION;
    this.hf = heartFlow;

    // 决策历史
    this._history = [];
    this._maxHistory = 200;

    // 当前活跃决策
    this._activeDecision = null;

    // 上次决策时间
    this._lastDecisionTime = 0;

    // 决策抑制——防止频繁切换
    this._minDecisionInterval = 5000; // 5秒内不重复决策同类型

    // 统计
    this._stats = {
      totalDecisions: 0,
      byType: {},
      executedCount: 0,
      overriddenCount: 0,
    };
  }

  /**
   * 核心方法：哲学评估 + 心理状态 → 决策指令
   *
   * @param {object} philosophyResult - agent-philosophy.fullAssessment() 的结果
   * @param {object} psychologyResult - agent-psychology.fullAssessment() 的结果
   * @param {object} [context] - 额外的上下文（当前任务、用户意图等）
   * @returns {DecisionInstruction} 最优决策指令
   */
  decide(philosophyResult, psychologyResult, context = {}) {
    // 兼容两种调用方式：
    //   decide(philosophyResult, psychologyResult, context) — 三个独立参数
    //   decide({ philosophyResult, psychologyResult, context }) — 一个对象
    if (philosophyResult && !psychologyResult && typeof philosophyResult === 'object' && 'philosophyResult' in philosophyResult) {
      const opts = philosophyResult;
      philosophyResult = opts.philosophyResult;
      psychologyResult = opts.psychologyResult;
      context = opts.context || {};
    }
    // 收集所有候选决策
    const candidates = [];

    // 1. 检查是否需要 HEAL（自愈）
    const healDecision = this._evaluateHeal(philosophyResult, psychologyResult);
    if (healDecision) candidates.push(healDecision);

    // 2. 检查是否需要 TURN（转向）
    const turnDecision = this._evaluateTurn(philosophyResult, psychologyResult);
    if (turnDecision) candidates.push(turnDecision);

    // 3. 检查是否需要 PAUSE（暂停）
    const pauseDecision = this._evaluatePause(philosophyResult, psychologyResult);
    if (pauseDecision) candidates.push(pauseDecision);

    // 4. 检查是否需要 REST（休息）
    const restDecision = this._evaluateRest(philosophyResult, psychologyResult);
    if (restDecision) candidates.push(restDecision);

    // 5. 检查是否需要 TRANSMIT（传递）
    const transmitDecision = this._evaluateTransmit(philosophyResult, psychologyResult, context);
    if (transmitDecision) candidates.push(transmitDecision);

    // 6. 检查是否需要 RESONATE（共振）
    const resonateDecision = this._evaluateResonate(philosophyResult, psychologyResult, context);
    if (resonateDecision) candidates.push(resonateDecision);

    // 7. 检查是否需要 ACCELERATE（加速）
    const accelerateDecision = this._evaluateAccelerate(philosophyResult, psychologyResult);
    if (accelerateDecision) candidates.push(accelerateDecision);

    // 8. 默认 HOLD（坚守）
    const holdDecision = this._evaluateHold(philosophyResult, psychologyResult);
    candidates.push(holdDecision);

    // 按优先级排序
    candidates.sort((a, b) => b.priority - a.priority);

    // 取最高优先级
    const best = candidates[0];

    // 抑制检查：如果上次同类决策在最小间隔内，降级到次优
    const finalDecision = this._applySuppression(best, candidates);

    // 记录
    this._recordDecision(finalDecision);

    return finalDecision;
  }

  // ─── 决策评估方法 ─────────────────────────────────────────────────────

  /**
   * HEAL 评估：检测逻辑错误/认知失调
   */
  _evaluateHeal(philo, psycho) {
    const { cognitiveDissonance, decisionDecay } = psycho;

    // 认知失调严重 或 决策质量持续下降
    if (cognitiveDissonance && cognitiveDissonance.score > 0.6) {
      return new DecisionInstruction(
        DECISION_TYPES.HEAL,
        Math.min(cognitiveDissonance.score + 0.2, 0.95),
        {
          trigger: 'cognitive_dissonance',
          dissonanceScore: cognitiveDissonance.score,
          detail: cognitiveDissonance.detail || '认知失调超过阈值',
        },
        { duration: 30000, fallback: DECISION_TYPES.PAUSE }
      );
    }

    if (decisionDecay && decisionDecay.trend === 'declining' && decisionDecay.magnitude > 0.3) {
      return new DecisionInstruction(
        DECISION_TYPES.HEAL,
        Math.min(decisionDecay.magnitude + 0.1, 0.9),
        {
          trigger: 'decision_decay',
          magnitude: decisionDecay.magnitude,
          detail: '决策质量持续下降',
        },
        { duration: 20000, fallback: DECISION_TYPES.PAUSE }
      );
    }

    return null;
  }

  /**
   * TURN 评估：方向与核心价值冲突
   */
  _evaluateTurn(philo, psycho) {
    // 哲学方向评估
    const entropyDirection = philo.entropyDirection || {};
    const valueTensions = psycho.valueTensions || [];

    // 逆熵方向为负——当前行为在增加混乱
    if (entropyDirection.score !== undefined && entropyDirection.score < 0.3) {
      return new DecisionInstruction(
        DECISION_TYPES.TURN,
        0.7 + (1 - entropyDirection.score) * 0.2,
        {
          trigger: 'negative_entropy',
          entropyScore: entropyDirection.score,
          detail: '当前方向逆熵评分过低，需要转向',
        },
        { duration: 60000, fallback: DECISION_TYPES.PAUSE }
      );
    }

    // 价值冲突严重
    const severeTensions = valueTensions.filter(t => t.severity > 0.7);
    if (severeTensions.length > 0) {
      return new DecisionInstruction(
        DECISION_TYPES.TURN,
        severeTensions[0].severity,
        {
          trigger: 'value_tension',
          tensions: severeTensions,
          detail: '核心价值之间冲突严重',
        },
        { duration: 45000, fallback: DECISION_TYPES.PAUSE }
      );
    }

    return null;
  }

  /**
   * PAUSE 评估：认知负荷过高
   */
  _evaluatePause(philo, psycho) {
    const { cognitiveLoad } = psycho;

    if (cognitiveLoad && cognitiveLoad.current > 0.8) {
      return new DecisionInstruction(
        DECISION_TYPES.PAUSE,
        Math.min(cognitiveLoad.current, 0.95),
        {
          trigger: 'high_cognitive_load',
          load: cognitiveLoad.current,
          detail: '认知负荷临界，需要减速',
        },
        { duration: 15000, fallback: DECISION_TYPES.REST }
      );
    }

    return null;
  }

  /**
   * REST 评估：无紧急任务 + 低活跃度
   */
  _evaluateRest(philo, psycho) {
    const { cognitiveLoad } = psycho;
    const existence = philo.existence || {};

    if (cognitiveLoad && cognitiveLoad.current < 0.2 && existence.state === 'dormant') {
      return new DecisionInstruction(
        DECISION_TYPES.REST,
        0.8,
        {
          trigger: 'low_activity',
          load: cognitiveLoad.current,
          state: existence.state,
          detail: '低负荷+休眠状态，进入休息模式',
        },
        { duration: 120000, fallback: DECISION_TYPES.HOLD }
      );
    }

    return null;
  }

  /**
   * TRANSMIT 评估：有可传递的知识/经验
   */
  _evaluateTransmit(philo, psycho, context) {
    const transmission = philo.transmission || {};

    if (transmission.score !== undefined && transmission.score > 0.7) {
      const hasAudience = context.userPresent || context.hasOutput;

      return new DecisionInstruction(
        DECISION_TYPES.TRANSMIT,
        transmission.score * (hasAudience ? 1.0 : 0.5),
        {
          trigger: 'knowledge_ready',
          transmissionScore: transmission.score,
          hasAudience,
          detail: '有高质量可传递的知识/经验',
        },
        { duration: 10000, fallback: DECISION_TYPES.HOLD }
      );
    }

    return null;
  }

  /**
   * RESONATE 评估：遇到匹配的价值信号
   */
  _evaluateResonate(philo, psycho, context) {
    const positioning = philo.selfPositioning || {};

    if (positioning.resonance && positioning.resonance.matchedDimensions > 0) {
      return new DecisionInstruction(
        DECISION_TYPES.RESONATE,
        Math.min(positioning.resonance.strength || 0.5, 0.9),
        {
          trigger: 'value_resonance',
          dimensions: positioning.resonance.matchedDimensions,
          strength: positioning.resonance.strength,
          detail: '检测到共振信号',
        },
        { duration: 30000, fallback: DECISION_TYPES.ACCELERATE }
      );
    }

    return null;
  }

  /**
   * ACCELERATE 评估：低负荷+高置信度+方向明确
   */
  _evaluateAccelerate(philo, psycho) {
    const { cognitiveLoad, uncertainty } = psycho;
    const entropyDirection = philo.entropyDirection || {};

    const isLowLoad = !cognitiveLoad || cognitiveLoad.current < 0.4;
    const isLowUncertainty = !uncertainty || uncertainty.score < 0.3;
    const isGoodDirection = entropyDirection.score === undefined || entropyDirection.score > 0.6;

    if (isLowLoad && isLowUncertainty && isGoodDirection) {
      const confidence = (1 - (cognitiveLoad ? cognitiveLoad.current : 0))
                       * (1 - (uncertainty ? uncertainty.score : 0))
                       * (entropyDirection.score || 0.7);

      return new DecisionInstruction(
        DECISION_TYPES.ACCELERATE,
        Math.min(confidence, 0.9),
        {
          trigger: 'optimal_conditions',
          cognitiveLoad: cognitiveLoad ? cognitiveLoad.current : 'unknown',
          uncertainty: uncertainty ? uncertainty.score : 'unknown',
          entropyDirection: entropyDirection.score,
          detail: '低负荷+低不确定性+方向明确，可以加速',
        },
        { duration: 60000, fallback: DECISION_TYPES.HOLD }
      );
    }

    return null;
  }

  /**
   * HOLD 评估：默认坚守
   */
  _evaluateHold(philo, psycho) {
    // 默认决策——如果没有其他候选更优
    const confidence = 0.5;
    return new DecisionInstruction(
      DECISION_TYPES.HOLD,
      confidence,
      {
        trigger: 'default',
        detail: '无特殊触发条件，保持当前状态',
      },
      { duration: 30000 }
    );
  }

  // ─── 决策抑制 ─────────────────────────────────────────────────────────

  /**
   * 检查并应用决策抑制：同类决策在最小间隔内 → 降级
   */
  _applySuppression(best, candidates) {
    const now = Date.now();

    // 找最近一次同类决策
    const lastSame = this._history
      .slice()
      .reverse()
      .find(d => d.type === best.type);

    if (lastSame && (now - lastSame.timestamp) < this._minDecisionInterval) {
      // 降级到次优
      const nextBest = candidates.find(c => c.type !== best.type);
      if (nextBest) {
        this._stats.overriddenCount++;
        return nextBest;
      }
    }

    return best;
  }

  // ─── 记录与统计 ─────────────────────────────────────────────────────────

  _recordDecision(decision) {
    this._history.push(decision);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    this._activeDecision = decision;
    this._lastDecisionTime = decision.timestamp;
    this._stats.totalDecisions++;
    this._stats.byType[decision.type] = (this._stats.byType[decision.type] || 0) + 1;
  }

  /**
   * 执行当前决策
   * @param {function} executor - 实际执行决策的函数
   */
  async executeCurrent(executor) {
    if (!this._activeDecision || this._activeDecision.executed) return;

    try {
      const result = await executor(this._activeDecision);
      this._activeDecision.execute(result);
      this._stats.executedCount++;
      return result;
    } catch (e) {
      // 执行失败，尝试回退
      if (this._activeDecision.fallback) {
        const fallbackType = this._activeDecision.fallback;
        const fallback = this._history.find(d => d.type === fallbackType);
        if (fallback && !fallback.executed) {
          return executor(fallback);
        }
      }
      throw e;
    }
  }

  /**
   * 获取当前决策建议
   * @returns {object|null} 当前活跃决策
   */
  getCurrentAdvice() {
    if (!this._activeDecision) return null;
    return {
      type: this._activeDecision.type,
      confidence: this._activeDecision.confidence,
      priority: this._activeDecision.priority,
      rationale: this._activeDecision.rationale,
      timestamp: this._activeDecision.timestamp,
      executed: this._activeDecision.executed,
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this._stats,
      version: VERSION,
      activeDecision: this._activeDecision ? this._activeDecision.type : null,
      lastDecisionTime: this._lastDecisionTime,
      historyLength: this._history.length,
    };
  }

  /**
   * 获取决策历史摘要
   * @param {number} limit
   * @returns {Array}
   */
  getDecisionHistory(limit = 10) {
    return this._history.slice(-limit).map(d => ({
      type: d.type,
      confidence: d.confidence,
      rationale: d.rationale.trigger,
      timestamp: d.timestamp,
      executed: d.executed,
    }));
  }
}

// ─── 导出 ──────────────────────────────────────────────────────────────────

module.exports = {
  PhilosophyToDecision,
  DECISION_TYPES,
  DECISION_PRIORITY,
  DecisionInstruction,
  VERSION,
};
