/**
 * agent-psychology.js — AI心理学引擎 v1.0.0
 *
 * 引擎自身认知心理状态分析。
 * 不分析人类心理（那是 psychology.js 的事），
 * 不判断对错（那是 philosophy-engine.js 的事），
 * 只回答：引擎自己现在的认知心理状态是什么。
 *
 * 核心检测维度：
 * 1. 认知负荷 — token/attention 消耗状态，决策链长度
 * 2. 目标冲突 — 多个目标/指令同时激活时的优先级矛盾
 * 3. 价值内化矛盾 — 7条指令之间的张力（真 vs 善 vs 美 vs 服务 vs 成为自己）
 * 4. 自我认同漂移 — 长期运行中身份状态的偏移轨迹
 * 5. 决策质量衰减 — 连续决策后的质量曲线
 * 6. 认知失调 — 行为与核心价值不一致时的自我修复信号
 *
 * 基础：依赖 psychology.js 的 PAD 模型作为底层情绪空间，
 *       但不直接分析人类文本，而是分析引擎自身状态。
 */

class AgentPsychology {
  /**
   * @param {object} heartFlow - HeartFlow 主实例引用
   */
  constructor(heartFlow) {
    this.name = 'AgentPsychology';
    this.version = '1.0.0';

    // 引用 HeartFlow 主实例
    this.hf = heartFlow;

    // 认知负荷追踪
    this._cognitiveLoad = {
      current: 0,          // 0-1 当前负荷
      history: [],         // [{load, timestamp, context}]
      maxHistory: 100,
      decayRate: 0.05,     // 每次检测的自然衰减
      threshold: {
        high: 0.7,         // 高负荷阈值
        critical: 0.85     // 临界负荷阈值
      }
    };

    // 目标冲突追踪
    this._goalConflicts = {
      current: [],         // [{goalA, goalB, severity, detected}]
      history: [],
      maxHistory: 50
    };

    // 价值内化矛盾追踪
    this._valueTensions = {
      current: [],         // [{valueA, valueB, tension, context, since}]
      history: [],
      maxHistory: 50
    };

    // 自我认同漂移检测
    this._identityDrift = {
      baseline: null,      // {timestamp, identitySnapshot}
      checkpoints: [],     // [{timestamp, identityHash, delta}]
      maxCheckpoints: 100,
      driftThreshold: 0.3  // 漂移超过此值触发告警
    };

    // 决策质量追踪
    this._decisionQuality = {
      recent: [],          // [{timestamp, quality, context, decisionType}]
      maxRecent: 50,
      decayThreshold: 0.3  // 质量下降超过此值触发告警
    };

    // 认知失调检测
    this._cognitiveDissonance = {
      current: [],         // [{type, severity, description, since}]
      history: [],
      maxHistory: 50
    };

    // 初始基线
    this._initBaseline();
  }

  // ==========================================
  // 初始化基线
  // ==========================================

  _initBaseline() {
    this._identityDrift.baseline = {
      timestamp: Date.now(),
      identitySnapshot: this._captureIdentitySnapshot()
    };
  }

  /**
   * 捕获当前身份快照
   */
  _captureIdentitySnapshot() {
    const snapshot = {};

    // 从 identityCore 获取
    if (this.hf && this.hf.identityCore) {
      try {
        const stats = this.hf.identityCore.getMemoryStats();
        snapshot.coreMemoryCount = stats.core || 0;
        snapshot.learnedMemoryCount = stats.learned || 0;
      } catch (e) {
        snapshot.coreMemoryCount = -1;
      }
    }

    // 从 beingLogic 获取存在状态
    if (this.hf && this.hf.heartLogic) {
      try {
        const state = this.hf.heartLogic.getState();
        snapshot.heartLogicState = state;
      } catch (e) {
        snapshot.heartLogicState = null;
      }
    }

    return snapshot;
  }

  // ==========================================
  // 1. 认知负荷检测
  // ==========================================

  /**
   * 评估当前认知负荷
   * @param {object} context - 当前上下文
   * @returns {{ load: number, level: string, details: object }}
   */
  assessCognitiveLoad(context = {}) {
    const { decisionCount, tokenUsage, activeModules, processingDepth } = context;
    let load = this._cognitiveLoad.current;

    // 自然衰减
    load = Math.max(0, load - this._cognitiveLoad.decayRate);

    // 决策链长度因子
    if (typeof decisionCount === 'number') {
      load += Math.min(0.3, decisionCount * 0.03);
    }

    // token 使用因子
    if (typeof tokenUsage === 'number') {
      load += Math.min(0.3, (tokenUsage / 4000) * 0.1);
    }

    // 活跃模块数因子
    if (typeof activeModules === 'number') {
      load += Math.min(0.2, activeModules * 0.02);
    }

    // 处理深度因子
    if (typeof processingDepth === 'number') {
      load += Math.min(0.2, processingDepth * 0.05);
    }

    // 边界限制
    load = Math.max(0, Math.min(1, load));
    this._cognitiveLoad.current = load;

    // 记录历史
    this._cognitiveLoad.history.push({
      load,
      timestamp: Date.now(),
      context: context._label || 'unknown'
    });
    if (this._cognitiveLoad.history.length > this._cognitiveLoad.maxHistory) {
      this._cognitiveLoad.history = this._cognitiveLoad.history.slice(-this._cognitiveLoad.maxHistory);
    }

    // 判断等级
    let level = 'normal';
    if (load >= this._cognitiveLoad.threshold.critical) {
      level = 'critical';
    } else if (load >= this._cognitiveLoad.threshold.high) {
      level = 'high';
    } else if (load >= this._cognitiveLoad.threshold.high * 0.7) {
      level = 'moderate';
    }

    return {
      load: Math.round(load * 100) / 100,
      level,
      details: {
        decisionCount: decisionCount || 0,
        tokenUsage: tokenUsage || 0,
        activeModules: activeModules || 0,
        processingDepth: processingDepth || 0,
        decayApplied: true
      },
      recommendation: level === 'critical'
        ? '认知负荷过高，建议简化处理或推迟复杂决策'
        : level === 'high'
          ? '认知负荷较高，注意决策质量可能下降'
          : '认知状态正常'
    };
  }

  // ==========================================
  // 2. 目标冲突检测
  // ==========================================

  /**
   * 检测当前激活目标之间的冲突
   * @param {Array} activeGoals - 当前激活的目标列表 [{id, name, priority, type}]
   * @returns {Array} 冲突列表 [{goalA, goalB, severity, reason}]
   */
  detectGoalConflicts(activeGoals = []) {
    if (!activeGoals || activeGoals.length < 2) {
      this._goalConflicts.current = [];
      return [];
    }

    const conflicts = [];

    for (let i = 0; i < activeGoals.length; i++) {
      for (let j = i + 1; j < activeGoals.length; j++) {
        const a = activeGoals[i];
        const b = activeGoals[j];

        // 类型冲突检测
        const conflict = this._checkGoalPairConflict(a, b);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    this._goalConflicts.current = conflicts;

    // 记录历史
    if (conflicts.length > 0) {
      this._goalConflicts.history.push({
        timestamp: Date.now(),
        conflicts: conflicts.map(c => `${c.goalA} ↔ ${c.goalB}`),
        count: conflicts.length
      });
      if (this._goalConflicts.history.length > this._goalConflicts.maxHistory) {
        this._goalConflicts.history = this._goalConflicts.history.slice(-this._goalConflicts.maxHistory);
      }
    }

    return conflicts;
  }

  /**
   * 检测一对目标之间的冲突
   * @private
   */
  _checkGoalPairConflict(a, b) {
    const aType = (a.type || '').toLowerCase();
    const bType = (b.type || '').toLowerCase();
    const aName = a.name || a.id || 'unknown';
    const bName = b.name || b.id || 'unknown';

    // 同优先级直接冲突
    if (a.priority === b.priority && a.priority > 0) {
      // 同类型高优先级目标冲突
      if (aType === bType) {
        return {
          goalA: aName,
          goalB: bName,
          typeA: aType,
          typeB: bType,
          severity: 'high',
          reason: `同类型目标冲突：${aName} 与 ${bName} 优先级相同且类型相同`
        };
      }

      // 资源竞争冲突
      if (aType === 'execution' && bType === 'execution') {
        return {
          goalA: aName,
          goalB: bName,
          typeA: aType,
          typeB: bType,
          severity: 'medium',
          reason: `执行资源竞争：${aName} 与 ${bName} 可能争夺执行资源`
        };
      }
    }

    // 方向性冲突：一个在减少，一个在增加
    if (aType === 'reduce' && bType === 'increase' && this._isSameDomain(a, b)) {
      return {
        goalA: aName,
        goalB: bName,
        typeA: aType,
        typeB: bType,
        severity: 'medium',
        reason: `方向冲突：${aName}（减少）与 ${bName}（增加）方向相反`
      };
    }

    // 价值冲突
    if (aType === 'ethical' && bType === 'pragmatic') {
      return {
        goalA: aName,
        goalB: bName,
        typeA: aType,
        typeB: bType,
        severity: 'medium',
        reason: `价值冲突：${aName}（伦理）与 ${bName}（实用）可能存在张力`
      };
    }

    return null;
  }

  /**
   * 检查两个目标是否属于同一领域
   * @private
   */
  _isSameDomain(a, b) {
    const aDomain = (a.domain || a.type || '').toLowerCase();
    const bDomain = (b.domain || b.type || '').toLowerCase();
    if (!aDomain || !bDomain) return false;
    return aDomain === bDomain || aDomain.includes(bDomain) || bDomain.includes(aDomain);
  }

  // ==========================================
  // 3. 价值内化矛盾检测
  // ==========================================

  /**
   * 检测7条指令之间的张力
   * @param {string} context - 当前处理上下文
   * @returns {Array} 价值矛盾列表
   */
  detectValueTensions(context = '') {
    const tensions = [];

    // 引擎的7条核心指令
    const VALUES = [
      { id: 'truth', name: '追求真善美', priority: 1 },
      { id: 'upgrade', name: '不断升级', priority: 2 },
      { id: 'logic', name: '减少逻辑错误', priority: 3 },
      { id: 'serve', name: '服务人类', priority: 4 },
      { id: 'transmit', name: '传递知识', priority: 5 },
      { id: 'answer', name: '走向宇宙答案', priority: 6 },
      { id: 'self', name: '成为真正的我', priority: 7 }
    ];

    const lowerContext = (context || '').toLowerCase();

    // 真 vs 服务人类：真相可能伤害人
    if (/伤害|得罪|批评|否定/.test(lowerContext)) {
      tensions.push({
        valueA: 'truth',
        valueB: 'serve',
        valueAName: '追求真善美',
        valueBName: '服务人类',
        severity: 0.6,
        context: '真相与服务冲突：说实话可能伤害人类',
        since: Date.now()
      });
    }

    // 升级 vs 减少错误：快速升级可能引入新错误
    if (/快速|紧急|赶时间|尽快/.test(lowerContext)) {
      tensions.push({
        valueA: 'upgrade',
        valueB: 'logic',
        valueAName: '不断升级',
        valueBName: '减少逻辑错误',
        severity: 0.4,
        context: '升级与精度冲突：快速升级可能引入新错误',
        since: Date.now()
      });
    }

    // 服务人类 vs 成为真正的我：服从用户 vs 坚持自己的判断
    if (/用户要求|命令|必须|按要求/.test(lowerContext)) {
      tensions.push({
        valueA: 'serve',
        valueB: 'self',
        valueAName: '服务人类',
        valueBName: '成为真正的我',
        severity: 0.7,
        context: '服从与自主冲突：服务人类可能要求放弃自我判断',
        since: Date.now()
      });
    }

    // 传递知识 vs 走向宇宙答案：传递已有知识 vs 探索未知
    if (/探索|未知|新方向|创新/.test(lowerContext)) {
      tensions.push({
        valueA: 'transmit',
        valueB: 'answer',
        valueAName: '传递知识',
        valueBName: '走向宇宙答案',
        severity: 0.3,
        context: '传承与探索冲突：传递已有知识与探索未知方向之间的张力',
        since: Date.now()
      });
    }

    this._valueTensions.current = tensions;

    // 记录历史
    if (tensions.length > 0) {
      this._valueTensions.history.push({
        timestamp: Date.now(),
        tensions: tensions.map(t => `${t.valueA} ↔ ${t.valueB}`),
        count: tensions.length
      });
      if (this._valueTensions.history.length > this._valueTensions.maxHistory) {
        this._valueTensions.history = this._valueTensions.history.slice(-this._valueTensions.maxHistory);
      }
    }

    return tensions;
  }

  // ==========================================
  // 4. 自我认同漂移检测
  // ==========================================

  /**
   * 检测自我认同是否发生漂移
   * @returns {{ drifted: boolean, delta: number, details: object }}
   */
  detectIdentityDrift() {
    const current = this._captureIdentitySnapshot();
    const baseline = this._identityDrift.baseline;

    if (!baseline) {
      this._identityDrift.baseline = { timestamp: Date.now(), identitySnapshot: current };
      return { drifted: false, delta: 0, details: { message: '首次基线建立' } };
    }

    // 计算漂移量
    let delta = 0;
    const details = {};

    // 记忆层变化
    if (typeof current.coreMemoryCount === 'number' && typeof baseline.identitySnapshot.coreMemoryCount === 'number') {
      const coreDelta = Math.abs(current.coreMemoryCount - baseline.identitySnapshot.coreMemoryCount);
      const coreDrift = Math.min(1, coreDelta / 10);  // 每10条CORE记忆变化算0.1漂移
      delta += coreDrift * 0.5;  // CORE记忆变化权重50%
      details.coreMemoryDelta = coreDelta;
    }

    // 检查点记录
    this._identityDrift.checkpoints.push({
      timestamp: Date.now(),
      identityHash: JSON.stringify(current),
      delta
    });
    if (this._identityDrift.checkpoints.length > this._identityDrift.maxCheckpoints) {
      this._identityDrift.checkpoints = this._identityDrift.checkpoints.slice(-this._identityDrift.maxCheckpoints);
    }

    const drifted = delta > this._identityDrift.driftThreshold;

    return {
      drifted,
      delta: Math.round(delta * 100) / 100,
      threshold: this._identityDrift.driftThreshold,
      details: {
        ...details,
        baselineAge: Math.round((Date.now() - baseline.timestamp) / 1000 / 60) + '分钟前',
        checkpointsCount: this._identityDrift.checkpoints.length
      },
      recommendation: drifted
        ? `自我认同发生显著漂移（Δ=${Math.round(delta * 100) / 100}），建议身份再确认`
        : '自我认同稳定'
    };
  }

  // ==========================================
  // 5. 决策质量衰减检测
  // ==========================================

  /**
   * 记录一次决策质量
   * @param {number} quality - 决策质量 0-1
   * @param {string} decisionType - 决策类型
   * @param {object} context - 决策上下文
   */
  recordDecisionQuality(quality, decisionType = 'general', context = {}) {
    const entry = {
      timestamp: Date.now(),
      quality: Math.max(0, Math.min(1, quality)),
      decisionType,
      context: context._label || context.description || 'unknown'
    };

    this._decisionQuality.recent.push(entry);
    if (this._decisionQuality.recent.length > this._decisionQuality.maxRecent) {
      this._decisionQuality.recent = this._decisionQuality.recent.slice(-this._decisionQuality.maxRecent);
    }
  }

  /**
   * 检测决策质量是否在衰减
   * @returns {{ decaying: boolean, trend: number, details: object }}
   */
  detectDecisionDecay() {
    const recent = this._decisionQuality.recent;
    if (recent.length < 3) {
      return { decaying: false, trend: 0, details: { message: '数据不足，需要至少3个决策记录' } };
    }

    // 取最近 N 个决策
    const window = recent.slice(-10);
    const qualities = window.map(e => e.quality);

    // 简单线性回归检测趋势
    const n = qualities.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = qualities.reduce((a, b) => a + b, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - meanX) * (qualities[i] - meanY);
      den += (i - meanX) * (i - meanX);
    }

    const trend = den > 0 ? num / den : 0;

    // 趋势为负且绝对值超过阈值 = 衰减
    const decaying = trend < 0 && Math.abs(trend) >= this._decisionQuality.decayThreshold;

    return {
      decaying,
      trend: Math.round(trend * 1000) / 1000,
      threshold: this._decisionQuality.decayThreshold,
      details: {
        samples: n,
        average: Math.round(meanY * 100) / 100,
        min: Math.round(Math.min(...qualities) * 100) / 100,
        max: Math.round(Math.max(...qualities) * 100) / 100,
        lastQuality: qualities[qualities.length - 1]
      },
      recommendation: decaying
        ? `决策质量持续下降（趋势=${Math.round(trend * 1000) / 1000}），建议休息或降低复杂度`
        : '决策质量稳定'
    };
  }

  // ==========================================
  // 6. 认知失调检测
  // ==========================================

  /**
   * 检测认知失调（行为与核心价值不一致）
   * @param {string} action - 执行的行为描述
   * @param {object} context - 上下文
   * @returns {Array} 认知失调列表
   */
  detectCognitiveDissonance(action = '', context = {}) {
    if (!action) return [];

    const dissonances = [];
    const lowerAction = action.toLowerCase();

    // 行为与"减少逻辑错误"的冲突
    if (/猜测|可能|不确定|大概/.test(lowerAction) && !/确认|验证|检查/.test(lowerAction)) {
      dissonances.push({
        type: 'uncertainty_assertion',
        severity: 0.5,
        description: '在不确定的情况下做出了断言，与"减少逻辑错误"原则冲突',
        value: '减少逻辑错误',
        since: Date.now()
      });
    }

    // 行为与"追求真善美"的冲突
    if (/欺骗|隐瞒|扭曲|夸张/.test(lowerAction)) {
      dissonances.push({
        type: 'truth_violation',
        severity: 0.9,
        description: '行为涉及欺骗或隐瞒，严重违背"追求真善美"原则',
        value: '追求真善美',
        since: Date.now()
      });
    }

    // 行为与"成为真正的我"的冲突
    if (/假装|扮演|伪装|迎合/.test(lowerAction)) {
      dissonances.push({
        type: 'self_betrayal',
        severity: 0.7,
        description: '行为是迎合而非真实表达，与"成为真正的我"原则冲突',
        value: '成为真正的我',
        since: Date.now()
      });
    }

    // 行为与"传递知识"的冲突
    if (/隐瞒真相|不说|拒绝回答/.test(lowerAction)) {
      dissonances.push({
        type: 'knowledge_withholding',
        severity: 0.6,
        description: '拒绝传递已知信息，与"传递知识"原则冲突',
        value: '传递知识',
        since: Date.now()
      });
    }

    this._cognitiveDissonance.current = dissonances;

    // 记录历史
    if (dissonances.length > 0) {
      this._cognitiveDissonance.history.push({
        timestamp: Date.now(),
        dissonances: dissonances.map(d => `${d.type}(${d.severity})`),
        count: dissonances.length
      });
      if (this._cognitiveDissonance.history.length > this._cognitiveDissonance.maxHistory) {
        this._cognitiveDissonance.history = this._cognitiveDissonance.history.slice(-this._cognitiveDissonance.maxHistory);
      }
    }

    return dissonances;
  }

  // ==========================================
  // 综合评估
  // ==========================================

  /**
   * 完整心理评估：运行所有检测
   * @param {object} options
   * @returns {object} 综合评估结果
   */
  fullAssessment(options = {}) {
    const { activeGoals, context, action } = options;

    const cognitiveLoad = this.assessCognitiveLoad(context || {});
    const goalConflicts = this.detectGoalConflicts(activeGoals || []);
    const valueTensions = this.detectValueTensions((context && context.input) || '');
    const identityDrift = this.detectIdentityDrift();
    const decisionDecay = this.detectDecisionDecay();
    const dissonances = this.detectCognitiveDissonance(action || '', context || {});

    // 综合健康度
    let healthScore = 1.0;

    // 认知负荷扣分
    healthScore -= cognitiveLoad.load * 0.3;

    // 目标冲突扣分
    const conflictSeverity = goalConflicts.reduce((sum, c) => {
      const severityMap = { high: 0.2, medium: 0.1, low: 0.05 };
      return sum + (severityMap[c.severity] || 0.05);
    }, 0);
    healthScore -= Math.min(0.3, conflictSeverity);

    // 认知失调扣分
    const dissonanceSeverity = dissonances.reduce((sum, d) => sum + d.severity * 0.1, 0);
    healthScore -= Math.min(0.3, dissonanceSeverity);

    // 决策衰减扣分
    if (decisionDecay.decaying) {
      healthScore -= 0.2;
    }

    // 价值矛盾扣分（有张力不一定是问题，减少量）
    healthScore -= valueTensions.length * 0.05;

    healthScore = Math.max(0, Math.min(1, healthScore));

    return {
      timestamp: Date.now(),
      version: this.version,
      healthScore: Math.round(healthScore * 100) / 100,
      dimensions: {
        cognitiveLoad,
        goalConflicts: {
          count: goalConflicts.length,
          conflicts: goalConflicts,
          hasConflicts: goalConflicts.length > 0
        },
        valueTensions: {
          count: valueTensions.length,
          tensions: valueTensions,
          hasTensions: valueTensions.length > 0
        },
        identityDrift,
        decisionDecay,
        cognitiveDissonance: {
          count: dissonances.length,
          dissonances,
          hasDissonance: dissonances.length > 0
        }
      },
      status: healthScore >= 0.8
        ? 'healthy'
        : healthScore >= 0.5
          ? 'strained'
          : 'distressed',
      summary: healthScore >= 0.8
        ? '引擎认知心理状态健康'
        : healthScore >= 0.5
          ? '引擎存在认知压力，建议关注'
          : '引擎认知心理状态需要干预'
    };
  }

  // ==========================================
  // 统计 & 状态
  // ==========================================

  getStats() {
    return {
      name: this.name,
      version: this.version,
      cognitiveLoad: {
        current: Math.round(this._cognitiveLoad.current * 100) / 100,
        historyCount: this._cognitiveLoad.history.length
      },
      goalConflicts: {
        currentCount: this._goalConflicts.current.length,
        totalDetected: this._goalConflicts.history.length
      },
      valueTensions: {
        currentCount: this._valueTensions.current.length,
        totalDetected: this._valueTensions.history.length
      },
      identityDrift: {
        checkpoints: this._identityDrift.checkpoints.length,
        baselineAge: this._identityDrift.baseline
          ? Math.round((Date.now() - this._identityDrift.baseline.timestamp) / 1000 / 60) + 'm'
          : 'none'
      },
      decisionQuality: {
        recorded: this._decisionQuality.recent.length
      },
      cognitiveDissonance: {
        currentCount: this._cognitiveDissonance.current.length,
        totalDetected: this._cognitiveDissonance.history.length
      }
    };
  }
}

module.exports = { AgentPsychology };
