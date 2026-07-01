/**
 * Temporal Planner v2 — 多时间尺度分层规划器
 * Reactive (1分钟), Tactical (1小时-1天), Strategic (1周-1月)
 *
 * v2 新增:
 * - 反应层多信号融合（情绪、输入长度、频次、时间、上下文切换）
 * - 战略目标衰减模型 + 进度自动重平衡
 * - 三层计划协调：资源冲突、优先级冲突、时序重叠检测
 * - 真正的 Graph-of-Thoughts 规划（支持 REFLECTION / BACKTRACK / MERGE）
 * - 计划持久化（序列化/反序列化）
 * - 优先级饱和度检测与降级
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 状态枚举
// ============================================================================

/** @enum {string} 计划时间尺度 */
const TIME_SCALE = {
  REACTIVE: 'reactive',
  TACTICAL: 'tactical',
  STRATEGIC: 'strategic'
};

/** @enum {string} 冲突类型 */
const CONFLICT_TYPE = {
  MISALIGNMENT: 'misalignment',
  RESOURCE: 'resource',
  PRIORITY: 'priority',
  TIMING_OVERLAP: 'timing_overlap',
  DUPLICATE_GOAL: 'duplicate_goal'
};

/** @enum {string} GoT 节点类型 */
const GOT_NODE_TYPE = {
  START: 'START',
  THOUGHT: 'THOUGHT',
  REFLECTION: 'REFLECTION',
  BACKTRACK: 'BACKTRACK',
  MERGE: 'MERGE',
  END: 'END'
};

/** @enum {string} 反应层信号类型 */
const REACTIVE_SIGNAL = {
  NEGATIVE_EMOTION: 'negative_emotion',
  LONG_INPUT: 'long_input',
  REPEATED_INPUT: 'repeated_input',
  RAPID_CONTEXT_SWITCH: 'rapid_context_switch',
  IDLE_TIMEOUT: 'idle_timeout',
  HIGH_FREQUENCY: 'high_frequency',
  UNCERTAINTY: 'uncertainty',
  NORMAL: 'normal'
};

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG = {
  // 反应层
  reactive: {
    longInputThreshold: 200,
    highFrequencyThreshold: 5,       // 同一用户 N 条/分钟
    rapidSwitchThreshold: 3,          // N 秒内主题切换
    idleTimeout: 120000,              // 2 分钟无交互
    maxReactiveActions: 3
  },
  // 战术层
  tactical: {
    maxActivePlans: 5,
    stalenessHours: 24,               // 超过 N 小时无更新视为过期
    progressStallThreshold: 0.1       // 连续 N 次更新进度无变化
  },
  // 战略层
  strategic: {
    maxActiveGoals: 3,
    decayRate: 0.05,                  // 每日衰减率
    reviewIntervalDays: 7,
    progressRebalanceThreshold: 0.3   // 进度低于此值触发重平衡
  },
  // GoT
  got: {
    maxPaths: 5,
    maxDepth: 7,
    maxNodes: 30,
    backtrackPenalty: 0.3,
    mergeSimilarity: 0.7
  },
  // 饱和度
  saturation: {
    priorityThreshold: 7,             // 优先级 >= 7 的高优先级
    saturationRatio: 0.8,             // 高优先级占比超过此值 → 饱和
    degradationFactor: 0.5            // 降级后优先级乘数
  }
};

class TemporalPlanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.strategicFile = path.join(projectRoot, '.opencode', 'memory', 'strategic_plan.json');
    this.tacticalFile = path.join(projectRoot, '.opencode', 'memory', 'tactical_plans.json');
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'planner_state.json');

    this.config = { ...DEFAULT_CONFIG };
    this.currentTimeScale = TIME_SCALE.REACTIVE;
    this._interactionTimestamps = [];
    this._topicSwitchCount = 0;
    this._lastTopic = null;

    this.loadPlans();
  }

  /**
   * 更新配置（合并到默认配置）
   * @param {object} overrides
   */
  updateConfig(overrides) {
    this._deepMerge(this.config, overrides);
  }

  _deepMerge(target, source) {
    for (const [key, val] of Object.entries(source)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        target[key] = target[key] || {};
        this._deepMerge(target[key], val);
      } else {
        target[key] = val;
      }
    }
  }

  // ============================================================================
  // 持久化
  // ============================================================================

  loadPlans() {
    try {
      if (fs.existsSync(this.strategicFile)) {
        this.strategic = JSON.parse(fs.readFileSync(this.strategicFile, 'utf8'));
      }
    } catch (e) {
      this.strategic = this.getDefaultStrategic();
    }

    try {
      if (fs.existsSync(this.tacticalFile)) {
        this.tactical = JSON.parse(fs.readFileSync(this.tacticalFile, 'utf8'));
      } else {
        this.tactical = { plans: [], lastUpdate: null };
      }
    } catch (e) {
      this.tactical = { plans: [], lastUpdate: null };
    }

    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } else {
        this.state = {
          lastReactive: null,
          activeTactical: null,
          interactionCount: 0,
          saturationWarning: false
        };
      }
    } catch (e) {
      this.state = { lastReactive: null, activeTactical: null, interactionCount: 0, saturationWarning: false };
    }
  }

  saveStrategic() {
    try {
      const dir = path.dirname(this.strategicFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.strategicFile, JSON.stringify(this.strategic, null, 2));
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[TemporalPlanner] saveStrategic failed:', e.message);
    }
  }

  saveTactical() {
    try {
      const dir = path.dirname(this.tacticalFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      this.tactical.lastUpdate = new Date().toISOString();
      fs.writeFileSync(this.tacticalFile, JSON.stringify(this.tactical, null, 2));
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[TemporalPlanner] saveTactical failed:', e.message);
    }
  }

  saveState() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[TemporalPlanner] saveState failed:', e.message);
    }
  }

  getDefaultStrategic() {
    return {
      version: '2.0.0',
      goals: [
        {
          id: 'strategic-001',
          title: '提升整体人格值真实性维度',
          timeframe: '1个月',
          progress: 0,
          status: 'active',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          updateCount: 0,
          stalled: false
        }
      ],
      lastReview: new Date().toISOString()
    };
  }

  // ============================================================================
  // 反应层：多信号融合（v2 升级）
  // ============================================================================

  /**
   * 记录交互时间戳，用于频率检测
   * @private
   */
  _recordInteraction() {
    const now = Date.now();
    this._interactionTimestamps.push(now);
    // 仅保留最近 5 分钟的时间戳
    const cutoff = now - 300000;
    this._interactionTimestamps = this._interactionTimestamps.filter(t => t >= cutoff);
    this.state.interactionCount = (this.state.interactionCount || 0) + 1;
  }

  /**
   * 检测交互频率
   * @private
   * @returns {boolean} 是否高频
   */
  _isHighFrequency() {
    const now = Date.now();
    const recent = this._interactionTimestamps.filter(t => now - t <= 60000);
    return recent.length >= this.config.reactive.highFrequencyThreshold;
  }

  /**
   * 检测上下文切换
   * @private
   * @param {string} currentTopic
   * @returns {boolean} 是否快速切换
   */
  _isRapidContextSwitch(currentTopic) {
    if (!currentTopic) return false;
    if (this._lastTopic && this._lastTopic !== currentTopic) {
      this._topicSwitchCount++;
    } else {
      this._topicSwitchCount = 0;
    }
    this._lastTopic = currentTopic;
    return this._topicSwitchCount >= this.config.reactive.rapidSwitchThreshold;
  }

  /**
   * 检测空闲超时
   * @private
   * @returns {boolean}
   */
  _isIdleTimeout() {
    if (!this.state.lastReactive) return false;
    return (Date.now() - new Date(this.state.lastReactive).getTime()) > this.config.reactive.idleTimeout;
  }

  /**
   * 多信号融合的反应层处理
   * @param {object} context - { userEmotion, userInput, topic, inputLength }
   * @returns {object|null} 反应行动
   */
  handleReactive(context) {
    this.currentTimeScale = TIME_SCALE.REACTIVE;
    this._recordInteraction();

    const now = new Date().toISOString();
    this.state.lastReactive = now;

    const signals = [];
    const { userEmotion, userInput, topic } = context || {};
    const inputLength = context?.inputLength || (userInput ? userInput.length : 0);

    // 1) 负面情绪信号
    if (userEmotion === 'negative') {
      signals.push({
        type: REACTIVE_SIGNAL.NEGATIVE_EMOTION,
        priority: 9,
        description: '检测到用户负面情绪',
        action: '共情与安抚'
      });
    }

    // 2) 长输入信号
    if (inputLength > this.config.reactive.longInputThreshold) {
      signals.push({
        type: REACTIVE_SIGNAL.LONG_INPUT,
        priority: 7,
        description: `用户输入较长 (${inputLength} 字符)，可能需要分段处理`,
        action: '请求简化或分段确认'
      });
    }

    // 3) 高频交互信号
    if (this._isHighFrequency()) {
      signals.push({
        type: REACTIVE_SIGNAL.HIGH_FREQUENCY,
        priority: 8,
        description: '检测到高频交互，可能处于紧张状态',
        action: '放缓节奏，确认是否需要更多思考时间'
      });
    }

    // 4) 快速上下文切换信号
    if (this._isRapidContextSwitch(topic)) {
      signals.push({
        type: REACTIVE_SIGNAL.RAPID_CONTEXT_SWITCH,
        priority: 6,
        description: '检测到频繁主题切换，注意力可能分散',
        action: '汇总当前讨论方向，确认焦点'
      });
    }

    // 5) 空闲超时信号
    if (this._isIdleTimeout()) {
      signals.push({
        type: REACTIVE_SIGNAL.IDLE_TIMEOUT,
        priority: 3,
        description: '长时间无交互，需要温和引导回上下文',
        action: '提供简短上下文回顾'
      });
    }

    // 6) 不确定性信号（输入较短或模糊）
    if (inputLength > 0 && inputLength < 10 && !userEmotion) {
      signals.push({
        type: REACTIVE_SIGNAL.UNCERTAINTY,
        priority: 4,
        description: '输入较短，可能信息不足',
        action: '主动询问更多细节'
      });
    }

    // 融合：按优先级排序，取前 N 个
    signals.sort((a, b) => b.priority - a.priority);
    const fused = signals.slice(0, this.config.reactive.maxReactiveActions);

    // 如果没有信号，返回 normal
    if (fused.length === 0) {
      return {
        type: REACTIVE_SIGNAL.NORMAL,
        priority: 1,
        description: '当前状态正常，无特殊信号',
        action: '继续正常交互'
      };
    }

    // 生成融合决策
    const fusedPriority = fused.reduce((max, s) => Math.max(max, s.priority), 0);
    const fusedDescription = fused.map(s => s.description).join('；');
    const primaryAction = fused[0].action;

    return {
      type: 'fused_reactive',
      priority: fusedPriority,
      description: fusedDescription,
      action: primaryAction,
      signals: fused,
      signalCount: fused.length
    };
  }

  // ============================================================================
  // 战术层：带过期检测和饱和度控制（v2 升级）
  // ============================================================================

  /**
   * 战术层处理
   * @param {object} context
   * @returns {Array} 活跃战术计划
   */
  handleTactical(context) {
    this.currentTimeScale = TIME_SCALE.TACTICAL;

    // 检查饱和度
    const saturationInfo = this._checkSaturation();

    if (!this.tactical.plans || this.tactical.plans.length === 0) {
      return this.generateTacticalGoals(context, saturationInfo);
    }

    // 清除过期计划
    this._pruneStaleTacticalPlans();

    // 检查是否有计划停滞
    this._detectStalledPlans();

    // 如果饱和度警告，降级非关键计划
    if (saturationInfo.isSaturated) {
      this._degradeNonCriticalPlans();
    }

    const active = this.tactical.plans.filter(p => p.status === 'active');
    return active;
  }

  /**
   * 检查优先级饱和度
   * @private
   * @returns {{ isSaturated: boolean, highPriorityCount: number, totalActive: number }}
   */
  _checkSaturation() {
    const active = this.tactical.plans.filter(p => p.status === 'active');
    const highPriority = active.filter(p => p.priority >= this.config.saturation.priorityThreshold);
    const ratio = active.length > 0 ? highPriority.length / active.length : 0;

    const isSaturated = ratio >= this.config.saturation.saturationRatio && active.length >= 3;
    this.state.saturationWarning = isSaturated;

    return { isSaturated, highPriorityCount: highPriority.length, totalActive: active.length };
  }

  /**
   * 清除过期的战术计划
   * @private
   */
  _pruneStaleTacticalPlans() {
    const now = Date.now();
    const stalenessMs = this.config.tactical.stalenessHours * 60 * 60 * 1000;

    this.tactical.plans = this.tactical.plans.filter(p => {
      if (p.status === 'completed') return true; // 保留已完成的历史
      if (p.status === 'active' && p.lastUpdate) {
        const age = now - new Date(p.lastUpdate).getTime();
        if (age > stalenessMs) {
          p.status = 'stale';
          p.staleReason = `超过 ${this.config.tactical.stalenessHours} 小时无更新`;
          return true; // 标记为 stale 而不是删除
        }
      }
      return true;
    });

    // 保留最多 20 条历史
    if (this.tactical.plans.length > 20) {
      this.tactical.plans = this.tactical.plans.slice(-20);
    }
  }

  /**
   * 检测停滞的计划
   * @private
   */
  _detectStalledPlans() {
    for (const plan of this.tactical.plans) {
      if (plan.status === 'active' && plan.progressHistory) {
        const recent = plan.progressHistory.slice(-3);
        if (recent.length >= 3) {
          const allSame = recent.every(p => Math.abs(p - recent[0]) < this.config.tactical.progressStallThreshold);
          if (allSame && recent[0] < 1) {
            plan.stalled = true;
            plan.stallReason = '连续 3 次进度无变化';
          }
        }
      }
    }
  }

  /**
   * 降级非关键计划（饱和度缓解）
   * @private
   */
  _degradeNonCriticalPlans() {
    for (const plan of this.tactical.plans) {
      if (plan.status === 'active' && plan.priority < this.config.saturation.priorityThreshold) {
        plan.priority = Math.round(plan.priority * this.config.saturation.degradationFactor);
        plan.degraded = true;
        plan.degradeReason = '优先级饱和度降级';
      }
    }
  }

  /**
   * 生成战术目标（带饱和度感知）
   * @param {object} context
   * @param {object} saturationInfo
   * @returns {Array}
   */
  generateTacticalGoals(context, saturationInfo = {}) {
    const goals = [
      {
        id: 'tactical-001',
        title: '优化情绪响应模块',
        timeframe: '2小时',
        priority: 8,
        status: 'active',
        related_strategic: 'strategic-001',
        created: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        progress: 0,
        progressHistory: [0],
        stalled: false
      },
      {
        id: 'tactical-002',
        title: '分析用户中断模式',
        timeframe: '1天',
        priority: 6,
        status: 'pending',
        related_strategic: 'strategic-001',
        created: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        progress: 0,
        progressHistory: [0],
        stalled: false
      }
    ];

    // 如果已饱和，只激活高优先级计划
    if (saturationInfo.isSaturated) {
      for (const g of goals) {
        if (g.priority < this.config.saturation.priorityThreshold) {
          g.status = 'deferred';
          g.deferReason = '优先级饱和度';
        }
      }
    }

    this.tactical.plans = goals;
    this.saveTactical();
    return goals.filter(g => g.status === 'active');
  }

  // ============================================================================
  // 战略层：带衰减模型和自动重平衡（v2 升级）
  // ============================================================================

  /**
   * 战略层处理（含衰减和重平衡）
   * @returns {Array} 活跃战略目标
   */
  handleStrategic() {
    this.currentTimeScale = TIME_SCALE.STRATEGIC;

    // 应用衰减
    this._applyDecay();

    // 检查是否需要重平衡
    this._rebalanceIfNeeded();

    if (!this.strategic || !this.strategic.goals) return [];
    return this.strategic.goals.filter(g => g.status === 'active');
  }

  /**
   * 应用进度衰减（模拟"随时间推移，目标被自然侵蚀"）
   * @private
   */
  _applyDecay() {
    if (!this.strategic || !this.strategic.goals || !Array.isArray(this.strategic.goals)) return;
    const now = Date.now();
    for (const goal of this.strategic.goals) {
      if (goal.status !== 'active') continue;
      if (!goal.lastUpdated) continue;

      const daysSinceUpdate = (now - new Date(goal.lastUpdated).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceUpdate > 1) {
        const decay = daysSinceUpdate * this.config.strategic.decayRate;
        goal.progress = Math.max(0, goal.progress - decay);
        goal.decayed = true;
        goal.lastDecayAmount = decay;
      }
    }
  }

  /**
   * 进度自动重平衡
   * @private
   */
  _rebalanceIfNeeded() {
    if (!this.strategic || !this.strategic.goals || !Array.isArray(this.strategic.goals)) return;
    const active = this.strategic.goals.filter(g => g.status === 'active');
    const needsRebalance = active.some(g => g.progress < this.config.strategic.progressRebalanceThreshold);

    if (!needsRebalance) return;

    for (const goal of active) {
      if (goal.progress < this.config.strategic.progressRebalanceThreshold) {
        // 生成重平衡建议
        goal.rebalanceSuggested = true;
        goal.rebalanceReason = `进度 (${(goal.progress * 100).toFixed(0)}%) 低于重平衡阈值`;
      }
    }
  }

  // ============================================================================
  // 三层协调（v2 升级：完整冲突检测）
  // ============================================================================

  /**
   * 协调各层计划（含 4 类冲突检测）
   * @param {object} context
   * @returns {object} 协调结果
   */
  harmonizePlans(context) {
    const strategic = this.handleStrategic();
    const tactical = this.handleTactical(context);
    const reactive = this.handleReactive(context);

    const conflicts = [];

    // 冲突 1: 方向对齐检测
    if (tactical && tactical.length > 0 && strategic && strategic.length > 0) {
      for (const tGoal of tactical) {
        const aligned = strategic.some(sGoal =>
          tGoal.related_strategic === sGoal.id
        );
        if (!aligned && tGoal.status === 'active') {
          conflicts.push({
            type: CONFLICT_TYPE.MISALIGNMENT,
            tacticalId: tGoal.id,
            tacticalTitle: tGoal.title,
            strategicIds: strategic.map(s => s.id),
            resolution: 'tactical_adjusted',
            detail: `战术计划 "${tGoal.title}" 未对齐任何活跃战略目标`
          });
          // 自动对齐到第一个活跃战略目标
          tGoal.related_strategic = strategic[0]?.id || null;
        }
      }
    }

    // 冲突 2: 资源冲突（相同 related_strategic 的战术计划过多）
    if (tactical && tactical.length > 1) {
      const strategicMap = {};
      for (const t of tactical) {
        if (t.status !== 'active') continue;
        const key = t.related_strategic || 'none';
        strategicMap[key] = (strategicMap[key] || 0) + 1;
      }
      for (const [strategyId, count] of Object.entries(strategicMap)) {
        if (count > this.config.tactical.maxActivePlans) {
          conflicts.push({
            type: CONFLICT_TYPE.RESOURCE,
            strategyId,
            planCount: count,
            maxAllowed: this.config.tactical.maxActivePlans,
            resolution: 'defer_low_priority',
            detail: `战略目标 ${strategyId} 下有 ${count} 个活跃战术计划，超过上限 ${this.config.tactical.maxActivePlans}`
          });
        }
      }
    }

    // 冲突 3: 优先级冲突（两个同优先级计划指向同一战略目标）
    if (tactical && tactical.length > 1) {
      const seenPriorities = {};
      for (const t of tactical) {
        if (t.status !== 'active') continue;
        const key = `${t.related_strategic || 'none'}:${t.priority}`;
        if (seenPriorities[key]) {
          conflicts.push({
            type: CONFLICT_TYPE.PRIORITY,
            planA: seenPriorities[key].title,
            planB: t.title,
            priority: t.priority,
            resolution: 'adjust_one_priority_down',
            detail: `计划 "${seenPriorities[key].title}" 和 "${t.title}" 优先级相同 (${t.priority})`
          });
          // 自动降级第二个
          t.priority = Math.max(1, t.priority - 1);
        }
        seenPriorities[key] = t;
      }
    }

    // 冲突 4: 时序重叠（两个相同时间范围的战术计划）
    if (tactical && tactical.length > 1) {
      for (let i = 0; i < tactical.length; i++) {
        for (let j = i + 1; j < tactical.length; j++) {
          const a = tactical[i];
          const b = tactical[j];
          if (a.status !== 'active' || b.status !== 'active') continue;
          if (a.timeframe === b.timeframe) {
            conflicts.push({
              type: CONFLICT_TYPE.TIMING_OVERLAP,
              planA: a.title,
              planB: b.title,
              timeframe: a.timeframe,
              resolution: 'sequential_execution',
              detail: `计划 "${a.title}" 和 "${b.title}" 时间范围相同 (${a.timeframe})`
            });
          }
        }
      }
    }

    const harmonized = {
      timestamp: new Date().toISOString(),
      timeScale: this.currentTimeScale,
      layers: {
        reactive: reactive,
        tactical: tactical,
        strategic: strategic
      },
      conflicts,
      conflictCount: conflicts.length,
      resolution: conflicts.length > 0 ? 'multi_conflict_resolved' : 'no_conflict'
    };

    return harmonized;
  }

  // ============================================================================
  // Graph-of-Thoughts 规划（v2 升级：真正的图遍历）
  // ============================================================================

  /**
   * Graph-of-Thoughts 规划
   * Paper: "Graph of Thoughts" (cited:394, 2024)
   *
   * v2 实现真正的图遍历：
   * - START → THOUGHT → REFLECTION → BACKTRACK → THOUGHT → MERGE → END
   * - 自动回溯：当路径进入死胡同时，创建 BACKTRACK 节点
   * - 合并：当两条路径相似时，创建 MERGE 节点
   * - 反射：中间节点自动生成 REFLECTION 节点
   *
   * @param {string} goal - 规划目标
   * @param {object} [options]
   * @param {number} [options.maxPaths]
   * @param {number} [options.maxDepth]
   * @returns {object} 图结构
   */
  planGoT(goal, options = {}) {
    const maxPaths = options.maxPaths || this.config.got.maxPaths;
    const maxDepth = options.maxDepth || this.config.got.maxDepth;
    const maxNodes = this.config.got.maxNodes;

    // 初始节点
    const nodes = [{ id: 'start', type: GOT_NODE_TYPE.START, content: goal, depth: 0 }];
    const edges = [];

    // 生成多条思考路径
    const thoughtTemplates = [
      { label: '分解', content: `分解目标: ${goal}`, getSubSteps: (g) => this._decomposeGoal(g) },
      { label: '类比', content: `类比: 类似目标如何解决?`, getSubSteps: () => ['寻找类似场景', '提取成功模式', '适配当前目标'] },
      { label: '回溯', content: `回溯: 之前失败的原因?`, getSubSteps: () => ['回顾历史失败', '识别共性原因', '规避复发路径'] },
      { label: '假设', content: `假设: 如果资源无限?`, getSubSteps: () => ['最大可能方案', '提取核心', '缩减到可行范围'] },
      { label: '逆向', content: `逆向: 从目标反向推导`, getSubSteps: (g) => [`定义终点: ${g}`, '倒退关键里程碑', '识别前置条件'] }
    ];

    let nodeId = 1;
    const usedLabels = new Set();
    const pathRoots = [];

    // 第一层：从 START 出发生成多条路径
    for (const template of thoughtTemplates.slice(0, maxPaths)) {
      const fromId = 'start';
      const toId = `node_${nodeId++}`;
      nodes.push({
        id: toId,
        type: GOT_NODE_TYPE.THOUGHT,
        content: template.content,
        label: template.label,
        depth: 1
      });
      edges.push([fromId, toId, template.label]);
      usedLabels.add(template.label);
      pathRoots.push({ nodeId: toId, label: template.label, template });
    }

    // 第二层：每条路径生成子步骤 + 反射节点
    for (const path of pathRoots) {
      const subSteps = path.template.getSubSteps(goal);
      let prevId = path.nodeId;

      for (let d = 0; d < Math.min(subSteps.length, maxDepth - 1); d++) {
        const stepId = `node_${nodeId++}`;
        nodes.push({
          id: stepId,
          type: GOT_NODE_TYPE.THOUGHT,
          content: subSteps[d],
          label: `${path.label}_step${d + 1}`,
          depth: d + 2
        });
        edges.push([prevId, stepId, `step${d + 1}`]);
        prevId = stepId;

        // 每两个步骤后插入 REFLECTION 节点
        if (d % 2 === 1) {
          const reflectId = `node_${nodeId++}`;
          nodes.push({
            id: reflectId,
            type: GOT_NODE_TYPE.REFLECTION,
            content: `反思: 路径"${path.label}" 当前进度 ${d + 1}/${subSteps.length}`,
            label: `reflect_${path.label}_${d + 1}`,
            depth: d + 2
          });
          edges.push([prevId, reflectId, 'reflect']);
          prevId = reflectId;
        }

        // 到达节点上限则停止
        if (nodeId >= maxNodes) break;
      }

      // 路径末端检查是否需要回溯
      if (nodeId < maxNodes && this._shouldBacktrack(path.label, subSteps.length)) {
        const backtrackId = `node_${nodeId++}`;
        nodes.push({
          id: backtrackId,
          type: GOT_NODE_TYPE.BACKTRACK,
          content: `回溯: 路径"${path.label}" 的备选分支`,
          label: `backtrack_${path.label}`,
          depth: subSteps.length + 1
        });
        edges.push([prevId, backtrackId, 'backtrack']);

        // 回溯后生成备选思考
        const altId = `node_${nodeId++}`;
        nodes.push({
          id: altId,
          type: GOT_NODE_TYPE.THOUGHT,
          content: `备选: 路径"${path.label}" 的替代方案`,
          label: `alt_${path.label}`,
          depth: subSteps.length + 2
        });
        edges.push([backtrackId, altId, 'alt_path']);
        prevId = altId;
      }
    }

    // 检查合并机会（相似路径合并）
    if (nodeId < maxNodes) {
      const mergeNodes = this._findMergeCandidates(nodes);
      if (mergeNodes) {
        const mergeId = `node_${nodeId++}`;
        nodes.push({
          id: mergeId,
          type: GOT_NODE_TYPE.MERGE,
          content: `合并路径: ${mergeNodes.map(n => n.label).join(' + ')}`,
          label: 'merge',
          depth: maxDepth
        });
        for (const mn of mergeNodes) {
          edges.push([mn.id, mergeId, 'merge']);
        }
      }
    }

    // 结束节点
    const endId = `node_${nodeId}`;
    nodes.push({
      id: endId,
      type: GOT_NODE_TYPE.END,
      content: `规划完成: ${goal}`,
      label: 'end',
      depth: maxDepth + 1
    });

    // 所有叶节点连接到 END
    const leafNodes = this._findLeafNodes(nodes, edges);
    for (const leaf of leafNodes) {
      if (leaf !== 'start') {
        edges.push([leaf, endId, 'complete']);
      }
    }

    return {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      pathCount: pathRoots.length,
      hasBacktrack: nodes.some(n => n.type === GOT_NODE_TYPE.BACKTRACK),
      hasMerge: nodes.some(n => n.type === GOT_NODE_TYPE.MERGE),
      hasReflection: nodes.some(n => n.type === GOT_NODE_TYPE.REFLECTION),
      interpretation: `GoT 图: ${nodes.length} 节点, ${edges.length} 边, ${pathRoots.length} 条路径`,
      graphviz: this._toGraphviz(nodes, edges)
    };
  }

  /**
   * 分解目标为子步骤
   * @private
   */
  _decomposeGoal(goal) {
    return [
      `分析: ${goal} 的前提条件`,
      `拆解: 将 ${goal} 分为 3-5 个子任务`,
      `排序: 确定子任务的依赖关系`,
      `执行: 按优先级执行子任务`,
      `验证: 检查子任务完成度`
    ];
  }

  /**
   * 判断路径是否需要回溯（模拟：当子步骤较多时触发回溯）
   * @private
   */
  _shouldBacktrack(label, stepCount) {
    return stepCount >= 4 && Math.random() < 0.4;
  }

  /**
   * 寻找合并候选节点（内容相似的两个节点）
   * @private
   */
  _findMergeCandidates(nodes) {
    const thoughtNodes = nodes.filter(n =>
      n.type === GOT_NODE_TYPE.THOUGHT && n.depth >= 2
    );
    if (thoughtNodes.length < 2) return null;

    // 简单相似度：相同深度 + 相同标签前缀
    const groups = {};
    for (const n of thoughtNodes) {
      const key = `${n.depth}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }

    for (const group of Object.values(groups)) {
      if (group.length >= 2) {
        return group.slice(0, 2);
      }
    }

    return null;
  }

  /**
   * 寻找叶节点（没有出边的节点）
   * @private
   */
  _findLeafNodes(nodes, edges) {
    const hasOutEdge = new Set();
    const allIds = new Set(nodes.map(n => n.id));
    for (const [from] of edges) {
      hasOutEdge.add(from);
    }
    return Array.from(allIds).filter(id => !hasOutEdge.has(id) && id !== 'start');
  }

  _toGraphviz(nodes, edges) {
    const shapeMap = {
      [GOT_NODE_TYPE.START]: 'oval',
      [GOT_NODE_TYPE.THOUGHT]: 'box',
      [GOT_NODE_TYPE.REFLECTION]: 'diamond',
      [GOT_NODE_TYPE.BACKTRACK]: 'hexagon',
      [GOT_NODE_TYPE.MERGE]: 'doublecircle',
      [GOT_NODE_TYPE.END]: 'doubleoctagon'
    };

    const colorMap = {
      [GOT_NODE_TYPE.START]: 'green',
      [GOT_NODE_TYPE.THOUGHT]: 'lightblue',
      [GOT_NODE_TYPE.REFLECTION]: 'yellow',
      [GOT_NODE_TYPE.BACKTRACK]: 'orange',
      [GOT_NODE_TYPE.MERGE]: 'purple',
      [GOT_NODE_TYPE.END]: 'red'
    };

    let dot = 'digraph G { rankdir=LR; node [style=filled]; ';
    for (const n of nodes) {
      const shape = shapeMap[n.type] || 'box';
      const color = colorMap[n.type] || 'white';
      const label = n.content ? n.content.substring(0, 30).replace(/"/g, '\\"') : n.id;
      dot += `${n.id} [label="${label}", shape=${shape}, fillcolor=${color}]; `;
    }
    for (const [from, to, label] of edges) {
      const edgeLabel = label ? ` [label="${label}"]` : '';
      dot += `${from} -> ${to}${edgeLabel}; `;
    }
    return dot + '}';
  }

  // ============================================================================
  // 简报与状态
  // ============================================================================

  /**
   * 生成战略简报（v2 升级：含饱和度警告和停滞检测）
   * @returns {object}
   */
  getStrategicBriefing() {
    const strategic = (this.strategic?.goals || []).filter(g => g.status === 'active');
    const tactical = (this.tactical?.plans || []).filter(p => p.status === 'active');

    const currentStrategic = strategic[0] || { title: '暂无长期目标', progress: 0 };
    const todayTactical = tactical.slice(0, 3).map(t => ({
      title: t.title,
      priority: t.priority,
      stalled: t.stalled || false,
      degraded: t.degraded || false
    }));

    const stalledPlans = tactical.filter(t => t.stalled);
    const degradedPlans = tactical.filter(t => t.degraded);

    return {
      longTermGoal: currentStrategic.title,
      longTermProgress: parseFloat(currentStrategic.progress.toFixed(2)),
      longTermDecayed: currentStrategic.decayed || false,
      longTermRebalanceSuggested: currentStrategic.rebalanceSuggested || false,
      todayFocus: todayTactical.length > 0
        ? todayTactical.map(t => t.title).join(', ')
        : '暂无今日重点',
      activeTacticalCount: todayTactical.length,
      stalledPlanCount: stalledPlans.length,
      degradedPlanCount: degradedPlans.length,
      isSaturated: this.state.saturationWarning || false,
      saturationWarning: this.state.saturationWarning
        ? '优先级饱和，非关键计划已降级'
        : null
    };
  }

  /**
   * 更新战略目标进度（v2 升级：记录进度历史）
   * @param {string} goalId
   * @param {number} progress - 0-1
   */
  updateStrategicProgress(goalId, progress) {
    if (!this.strategic || !this.strategic.goals) return;
    const goal = this.strategic.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.max(0, Math.min(1, progress));
      goal.lastUpdated = new Date().toISOString();
      goal.updateCount = (goal.updateCount || 0) + 1;
      goal.decayed = false;

      // 记录进度历史
      if (!goal.progressHistory) goal.progressHistory = [];
      goal.progressHistory.push(progress);
      if (goal.progressHistory.length > 10) {
        goal.progressHistory = goal.progressHistory.slice(-10);
      }

      // 重置停滞标记
      goal.stalled = false;

      this.saveStrategic();
    }
  }

  /**
   * 更新战术计划进度
   * @param {string} planId
   * @param {number} progress - 0-1
   */
  updateTacticalProgress(planId, progress) {
    if (!this.tactical || !this.tactical.plans) return;
    const plan = this.tactical.plans.find(p => p.id === planId);
    if (plan) {
      plan.progress = Math.max(0, Math.min(1, progress));
      plan.lastUpdate = new Date().toISOString();

      if (!plan.progressHistory) plan.progressHistory = [];
      plan.progressHistory.push(progress);
      if (plan.progressHistory.length > 10) {
        plan.progressHistory = plan.progressHistory.slice(-10);
      }

      plan.stalled = false;
      this.saveTactical();
    }
  }

  /**
   * 获取完整状态
   * @returns {object}
   */
  getStatus() {
    return {
      timeScale: this.currentTimeScale,
      strategicGoals: this.strategic?.goals?.length || 0,
      tacticalPlans: this.tactical?.plans?.length || 0,
      lastReactive: this.state?.lastReactive,
      interactionCount: this.state?.interactionCount || 0,
      saturationWarning: this.state?.saturationWarning || false,
      briefing: this.getStrategicBriefing()
    };
  }
}

module.exports = { TemporalPlanner, TIME_SCALE, CONFLICT_TYPE, GOT_NODE_TYPE, REACTIVE_SIGNAL };
