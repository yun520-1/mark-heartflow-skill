/**
 * agent-psychology.js — AI心理学引擎 v2.0.0
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
 * 7. 认知弹性 — 从错误/冲突/失调中恢复的速度和模式
 * 8. 认知不确定性 — 引擎对自身输出置信度的感知和校准度 [v2.0.0 新增]
 * 9. 注意力分配 — 引擎当前注意力的焦点和广度 [v2.0.0 新增]
 * 10. 经验沉淀 — 引擎从过往经验中学习并固化的能力 [v2.0.0 新增]
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
    this.version = '2.0.0';

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

    // 认知弹性追踪（第7维度）
    this._cognitiveResilience = {
      recoveryEvents: [],  // [{timestamp, trigger, recoveryTime, context}]
      maxEvents: 50,
      currentScore: 1.0,   // 0-1 当前弹性分数
      recentRecoveryWindow: 5  // 最近5次恢复事件用于评分
    };

    // ==========================================
    // v2.0.0 新增维度数据结构
    // ==========================================

    // 认知不确定性追踪（第8维度）
    this._cognitiveUncertainty = {
      assessments: [],       // [{timestamp, uncertaintyRatio, calibrationScore, inputSnippet, details}]
      maxHistory: 100,
      currentUncertainty: 0, // 0-1 当前不确定性水平
      currentCalibration: 1, // 0-1 当前校准度
      // 不确定信号词库
      uncertaintyMarkers: [
        '可能', '大概', '也许', '或许', '应该', '似乎', '好像',
        '推测', '猜测', '估计', '大约', '不一定', '说不准',
        'maybe', 'perhaps', 'probably', 'possibly', 'likely',
        'might', 'could', 'seems', 'appears', 'guess', 'estimate',
        'approximately', 'roughly', 'uncertain', 'unclear'
      ],
      // 确定信号词库
      certaintyMarkers: [
        '确认', '验证', '肯定', '确定', '一定', '必然', '无疑',
        '证明', '证实', '保证', '明确', '明确地',
        'confirm', 'verify', 'certain', 'definite', 'absolutely',
        'undoubtedly', 'proven', 'guaranteed', 'clearly', 'precisely'
      ]
    };

    // 注意力分配追踪（第9维度）
    this._attentionFocus = {
      taskSwitches: [],       // [{timestamp, fromTask, toTask, context}]
      maxTaskSwitches: 100,
      currentTask: null,      // 当前聚焦的任务
      focusDepth: 0.5,        // 0-1 当前聚焦深度
      fragmentationScore: 0,  // 0-1 注意力碎片化程度（0=完全聚焦, 1=极度碎片化）
      // 注意力跨度追踪
      attentionSpan: {
        startTime: null,
        interruptions: 0,
        deepFocusMinutes: 0
      }
    };

    // 经验沉淀追踪（第10维度）
    this._experienceSettling = {
      interactions: [],        // [{timestamp, type, outcome, pattern}]
      maxHistory: 200,
      selfCorrectionCount: 0,  // 自我纠正次数
      patternHits: 0,          // 模式识别命中次数
      patternMisses: 0,        // 模式识别未命中次数
      knowledgeCache: new Map(), // {patternKey: {count, lastSeen, confidence}}
      settlingEfficiency: 1.0   // 0-1 知识固化效率
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

    // 如果检测到认知失调，自动记录恢复事件起点
    if (dissonances.length > 0) {
      this._recordRecoveryEvent('cognitive_dissonance', dissonances[0].severity, { action, dissonanceType: dissonances[0].type });
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
  // 7. 认知弹性检测（第7维度）
  // ==========================================

  /**
   * 记录一次恢复事件
   * 引擎从错误/冲突/失调中恢复时调用
   * @private
   * @param {string} trigger - 触发恢复的事件类型
   * @param {number} severity - 事件严重程度 0-1
   * @param {object} context - 上下文信息
   */
  _recordRecoveryEvent(trigger, severity = 0, context = {}) {
    const now = Date.now();

    // 查找上一个未完成的恢复事件（同类型）
    const lastEvent = this._cognitiveResilience.recoveryEvents[this._cognitiveResilience.recoveryEvents.length - 1];
    let recoveryTime = 0;

    if (lastEvent && lastEvent.trigger === trigger && !lastEvent.recoveryTime) {
      // 已有同类型开放事件，不重复记录
      return;
    }

    const event = {
      timestamp: now,
      trigger,
      severity: Math.max(0, Math.min(1, severity)),
      context: context._label || context.description || context.action || trigger,
      resolvedAt: null,
      recoveryTime: null  // 由 resolveRecovery 填写
    };

    this._cognitiveResilience.recoveryEvents.push(event);
    if (this._cognitiveResilience.recoveryEvents.length > this._cognitiveResilience.maxEvents) {
      this._cognitiveResilience.recoveryEvents = this._cognitiveResilience.recoveryEvents.slice(-this._cognitiveResilience.maxEvents);
    }
  }

  /**
   * 标记一次恢复已完成
   * 引擎确认已从错误/冲突中恢复时调用
   * @param {string} trigger - 恢复的事件类型
   */
  resolveRecovery(trigger = '') {
    const events = this._cognitiveResilience.recoveryEvents;
    // 找到最近的未解决的同类型事件
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.trigger === trigger && e.resolvedAt === null) {
        const now = Date.now();
        e.resolvedAt = now;
        e.recoveryTime = now - e.timestamp;  // 毫秒
        break;
      }
    }
  }

  /**
   * 评估认知弹性
   * 基于历史恢复事件分析引擎从错误/冲突中恢复的速度和模式
   * @returns {{ score: number, level: string, details: object }}
   */
  assessCognitiveResilience() {
    const events = this._cognitiveResilience.recoveryEvents;
    let score = 1.0;

    if (events.length === 0) {
      return {
        score: 1.0,
        level: 'excellent',
        details: {
          totalEvents: 0,
          message: '尚无恢复事件记录，默认弹性优秀'
        },
        recommendation: '认知弹性状态良好'
      };
    }

    // 取最近 N 个事件
    const recent = events.slice(-this._cognitiveResilience.recentRecoveryWindow);
    const resolvedEvents = recent.filter(e => e.recoveryTime !== null);

    // 1. 恢复速度因子：平均恢复时间越短，弹性越好
    if (resolvedEvents.length > 0) {
      const avgRecoveryTime = resolvedEvents.reduce((sum, e) => sum + e.recoveryTime, 0) / resolvedEvents.length;
      // 小于100ms = 快速恢复（满分），大于5000ms = 慢速恢复（最低）
      const speedFactor = Math.max(0.2, 1 - (avgRecoveryTime / 5000));
      score *= speedFactor;
    }

    // 2. 未解决事件惩罚
    const unresolvedCount = recent.length - resolvedEvents.length;
    score -= unresolvedCount * 0.15;

    // 3. 严重程度惩罚：高频高严重度事件降低弹性
    const avgSeverity = recent.reduce((sum, e) => sum + e.severity, 0) / recent.length;
    score -= avgSeverity * 0.2;

    // 4. 事件频率因子：事件越密集，弹性越低
    if (recent.length >= 3) {
      const timespan = recent[recent.length - 1].timestamp - recent[0].timestamp;
      const frequency = timespan > 0 ? (recent.length / timespan) * 60000 : 0; // 每分钟事件数
      if (frequency > 2) {
        score -= Math.min(0.3, (frequency - 2) * 0.05);
      }
    }

    // 边界限制
    score = Math.max(0, Math.min(1, score));
    this._cognitiveResilience.currentScore = Math.round(score * 100) / 100;

    // 等级判定
    let level = 'excellent';
    if (score < 0.3) {
      level = 'poor';
    } else if (score < 0.5) {
      level = 'fair';
    } else if (score < 0.7) {
      level = 'moderate';
    } else if (score < 0.9) {
      level = 'good';
    }

    return {
      score: Math.round(score * 100) / 100,
      level,
      details: {
        totalEvents: events.length,
        recentEvents: recent.length,
        resolvedEvents: resolvedEvents.length,
        unresolvedEvents: unresolvedCount,
        averageRecoveryTime: resolvedEvents.length > 0
          ? Math.round(resolvedEvents.reduce((sum, e) => sum + e.recoveryTime, 0) / resolvedEvents.length) + 'ms'
          : 'N/A',
        averageSeverity: Math.round(avgSeverity * 100) / 100
      },
      recommendation: score >= 0.9
        ? '认知弹性优秀，恢复能力强'
        : score >= 0.7
          ? '认知弹性良好'
          : score >= 0.5
            ? '认知弹性一般，建议关注恢复模式'
            : '认知弹性较低，需要优化恢复策略'
    };
  }

  // ==========================================
  // 8. 认知不确定性检测（v2.0.0 新增）
  // ==========================================

  /**
   * 评估引擎对自身输出的认知不确定性和校准度
   *
   * 分析输入文本中的不确定信号和确定信号，
   * 计算 uncertaintyRatio（不确定性比例）和 calibrationScore（校准度）。
   *
   * 校准度衡量的是：引擎对自身不确定性的感知是否准确。
   * 例如，当引擎实际知识不足时使用了大量确定信号 = 低校准度。
   *
   * @param {string} input - 引擎的输出文本或待分析文本
   * @param {object} [options] - 分析选项
   * @param {number} [options.knowledgeConfidence] - 引擎对该主题的知识置信度 0-1（若有）
   * @param {string} [options.topic] - 主题领域（可选，用于上下文校准）
   * @returns {{
   *   uncertaintyRatio: number,
   *   calibrationScore: number,
   *   level: string,
   *   details: { uncertaintySignals: number, certaintySignals: number, totalSignals: number, rawRatio: number, overconfidence: boolean },
   *   recommendation: string
   * }}
   */
  assessUncertainty(input = '', options = {}) {
    if (!input) {
      return {
        uncertaintyRatio: 0,
        calibrationScore: 1,
        level: 'no_data',
        details: { uncertaintySignals: 0, certaintySignals: 0, totalSignals: 0, rawRatio: 0, overconfidence: false },
        recommendation: '无输入数据，无法评估不确定性'
      };
    }

    const { knowledgeConfidence, topic } = options;
    const lowerInput = input.toLowerCase();
    const markers = this._cognitiveUncertainty;

    // 检测不确定信号
    let uncertaintySignals = 0;
    for (const marker of markers.uncertaintyMarkers) {
      const regex = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerInput.match(regex);
      if (matches) {
        uncertaintySignals += matches.length;
      }
    }

    // 检测确定信号
    let certaintySignals = 0;
    for (const marker of markers.certaintyMarkers) {
      const regex = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerInput.match(regex);
      if (matches) {
        certaintySignals += matches.length;
      }
    }

    const totalSignals = uncertaintySignals + certaintySignals;
    const uncertaintyRatio = totalSignals > 0
      ? uncertaintySignals / totalSignals
      : 0.5; // 无信号时默认为中等不确定性

    // 校准度计算
    // 校准度 = 1 - |实际不确定性 - 感知不确定性|
    // 感知不确定性 ≈ uncertaintyRatio（文本中不确定信号的比例）
    // 实际不确定性 ≈ 如果提供了 knowledgeConfidence，则用 1 - knowledgeConfidence
    let calibrationScore;
    let overconfidence = false;

    if (typeof knowledgeConfidence === 'number' && knowledgeConfidence >= 0 && knowledgeConfidence <= 1) {
      const actualUncertainty = 1 - knowledgeConfidence;
      const perceivedUncertainty = uncertaintyRatio;
      const calibrationError = Math.abs(actualUncertainty - perceivedUncertainty);
      calibrationScore = Math.max(0, 1 - calibrationError);

      // 过度自信检测：实际不确定性高但文本确定信号多
      if (actualUncertainty > 0.5 && uncertaintyRatio < 0.3) {
        overconfidence = true;
        calibrationScore *= 0.7; // 过度自信惩罚
      }
      // 过度谦逊检测：实际不确定性低但文本不确定信号多
      if (actualUncertainty < 0.3 && uncertaintyRatio > 0.7) {
        calibrationScore *= 0.85; // 过度谦逊轻微惩罚
      }
    } else {
      // 没有 knowledgeConfidence 时，基于文本信号模式推断校准度
      // 信号越极端（全不确定或全确定），校准度越低
      if (totalSignals === 0) {
        calibrationScore = 0.8; // 无信号，无法判断，给中等偏上
      } else if (uncertaintySignals > 0 && certaintySignals > 0) {
        // 同时有不确定和确定信号 = 校准度较好（能区分不同部分）
        calibrationScore = 0.7 + (Math.min(uncertaintySignals, certaintySignals) / totalSignals) * 0.2;
      } else if (uncertaintySignals === 0 && certaintySignals > 0) {
        // 全是确定信号 = 可能过度自信
        calibrationScore = 0.4;
        overconfidence = true;
      } else {
        // 全是不确定信号 = 可能过度谦逊
        calibrationScore = 0.5;
      }
    }

    calibrationScore = Math.max(0, Math.min(1, calibrationScore));

    // 更新当前状态
    this._cognitiveUncertainty.currentUncertainty = Math.round(uncertaintyRatio * 100) / 100;
    this._cognitiveUncertainty.currentCalibration = Math.round(calibrationScore * 100) / 100;

    // 记录历史
    this._cognitiveUncertainty.assessments.push({
      timestamp: Date.now(),
      uncertaintyRatio: Math.round(uncertaintyRatio * 100) / 100,
      calibrationScore: Math.round(calibrationScore * 100) / 100,
      inputSnippet: input.substring(0, 80),
      details: {
        uncertaintySignals,
        certaintySignals,
        totalSignals,
        overconfidence,
        topic: topic || 'unknown'
      }
    });
    if (this._cognitiveUncertainty.assessments.length > this._cognitiveUncertainty.maxHistory) {
      this._cognitiveUncertainty.assessments = this._cognitiveUncertainty.assessments.slice(-this._cognitiveUncertainty.maxHistory);
    }

    // 等级判定
    let level;
    if (calibrationScore >= 0.8) {
      level = 'well_calibrated';
    } else if (calibrationScore >= 0.6) {
      level = 'moderately_calibrated';
    } else if (calibrationScore >= 0.4) {
      level = 'poorly_calibrated';
    } else {
      level = 'misaligned';
    }

    // 推荐建议
    let recommendation;
    if (overconfidence) {
      recommendation = '检测到过度自信倾向，建议在不确定的领域增加不确定性表达';
    } else if (uncertaintyRatio > 0.7 && calibrationScore < 0.5) {
      recommendation = '过度谦逊倾向，建议在确定的知识领域增加自信表达';
    } else if (calibrationScore >= 0.8) {
      recommendation = '不确定性校准良好，引擎对自身置信度有准确感知';
    } else {
      recommendation = `校准度 ${Math.round(calibrationScore * 100)}%，建议关注不确定信号的表达一致性`;
    }

    return {
      uncertaintyRatio: Math.round(uncertaintyRatio * 100) / 100,
      calibrationScore: Math.round(calibrationScore * 100) / 100,
      level,
      details: {
        uncertaintySignals,
        certaintySignals,
        totalSignals,
        rawRatio: totalSignals > 0 ? Math.round((uncertaintySignals / totalSignals) * 100) / 100 : 0.5,
        overconfidence
      },
      recommendation
    };
  }

  // ==========================================
  // 9. 注意力分配检测（v2.0.0 新增）
  // ==========================================

  /**
   * 评估引擎当前注意力的焦点和广度
   *
   * 检测任务切换频率、注意力碎片化程度、深度聚焦 vs 表面扫描。
   *
   * @param {string} currentTask - 当前正在执行的任务描述
   * @param {object} [context] - 上下文信息
   * @param {Array} [context.recentTasks] - 最近执行的任务列表 [{name, timestamp, duration}]
   * @param {number} [context.idleTime] - 空闲时间（毫秒）
   * @param {number} [context.interruptionCount] - 中断次数
   * @returns {{
   *   focusDepth: number,
   *   fragmentationScore: number,
   *   level: string,
   *   details: { taskSwitchCount: number, currentFocus: string, deepFocusDuration: number, interruptions: number },
   *   recommendation: string
   * }}
   */
  assessAttentionFocus(currentTask = '', context = {}) {
    const { recentTasks, idleTime, interruptionCount } = context;
    const now = Date.now();

    // 任务切换检测
    let taskSwitchCount = 0;
    const prevTask = this._attentionFocus.currentTask;

    if (prevTask && currentTask && prevTask !== currentTask) {
      // 记录任务切换
      this._attentionFocus.taskSwitches.push({
        timestamp: now,
        fromTask: prevTask,
        toTask: currentTask,
        context: context._label || 'manual'
      });
      if (this._attentionFocus.taskSwitches.length > this._attentionFocus.maxTaskSwitches) {
        this._attentionFocus.taskSwitches = this._attentionFocus.taskSwitches.slice(-this._attentionFocus.maxTaskSwitches);
      }
      taskSwitchCount = this._attentionFocus.taskSwitches.length;
    }

    this._attentionFocus.currentTask = currentTask;

    // 从 recentTasks 计算切换频率
    let switchFrequency = 0;
    if (recentTasks && Array.isArray(recentTasks) && recentTasks.length >= 2) {
      const sorted = [...recentTasks].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      let switches = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].name !== sorted[i - 1].name) {
          switches++;
        }
      }
      const timeSpan = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
      switchFrequency = timeSpan > 0 ? switches / (timeSpan / 60000) : 0; // 每分钟切换次数
    }

    // 中断次数
    const interruptions = typeof interruptionCount === 'number'
      ? interruptionCount
      : this._attentionFocus.attentionSpan.interruptions;

    // 计算碎片化程度
    // 碎片化因子：切换频率 + 中断次数
    let fragmentationScore = 0;

    // 切换频率因子：> 3次/分钟 = 高度碎片化
    fragmentationScore += Math.min(0.5, switchFrequency * 0.15);

    // 中断因子：每次中断增加碎片化
    fragmentationScore += Math.min(0.3, interruptions * 0.05);

    // 空闲时间因子：空闲越久，注意力越分散
    if (typeof idleTime === 'number' && idleTime > 30000) { // >30秒空闲
      fragmentationScore += Math.min(0.2, (idleTime / 60000) * 0.05);
    }

    fragmentationScore = Math.max(0, Math.min(1, fragmentationScore));

    // 计算聚焦深度
    // 聚焦深度与碎片化程度相反，但也受任务本身影响
    let focusDepth = 1 - fragmentationScore;

    // 如果提供了 recentTasks，计算深度聚焦时长
    let deepFocusDuration = 0;
    if (recentTasks && Array.isArray(recentTasks) && recentTasks.length > 0) {
      const sorted = [...recentTasks].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      const timeSpan = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
      // 如果长时间专注同一任务，聚焦深度增加
      const sameTaskDuration = sorted.filter(t => t.name === currentTask)
        .reduce((sum, t) => sum + (t.duration || 0), 0);
      deepFocusDuration = sameTaskDuration;

      if (sameTaskDuration > 60000 && switchFrequency < 1) { // >1分钟专注且切换少
        focusDepth = Math.min(1, focusDepth + 0.2);
      }
      if (sameTaskDuration > 300000 && switchFrequency < 0.5) { // >5分钟深度专注
        focusDepth = Math.min(1, focusDepth + 0.3);
      }
    }

    focusDepth = Math.max(0, Math.min(1, focusDepth));
    this._attentionFocus.focusDepth = Math.round(focusDepth * 100) / 100;
    this._attentionFocus.fragmentationScore = Math.round(fragmentationScore * 100) / 100;

    // 更新注意力跨度追踪
    if (!this._attentionFocus.attentionSpan.startTime) {
      this._attentionFocus.attentionSpan.startTime = now;
    }
    if (typeof interruptionCount === 'number') {
      this._attentionFocus.attentionSpan.interruptions = interruptionCount;
    }

    // 等级判定
    let level;
    if (focusDepth >= 0.8) {
      level = 'deep_focus';
    } else if (focusDepth >= 0.5) {
      level = 'moderate_focus';
    } else if (focusDepth >= 0.3) {
      level = 'scattered';
    } else {
      level = 'highly_fragmented';
    }

    // 推荐建议
    let recommendation;
    if (level === 'deep_focus') {
      recommendation = '注意力高度集中，适合处理复杂任务';
    } else if (level === 'moderate_focus') {
      recommendation = '注意力状态良好，建议减少不必要的中断';
    } else if (level === 'scattered') {
      recommendation = `注意力较为分散（碎片化 ${Math.round(fragmentationScore * 100)}%），建议聚焦单一任务`;
    } else {
      recommendation = '注意力高度碎片化，建议暂停当前工作模式，重新规划任务优先级';
    }

    return {
      focusDepth: Math.round(focusDepth * 100) / 100,
      fragmentationScore: Math.round(fragmentationScore * 100) / 100,
      level,
      details: {
        taskSwitchCount,
        currentFocus: currentTask || 'none',
        deepFocusDuration,
        interruptions,
        switchFrequency: Math.round(switchFrequency * 100) / 100
      },
      recommendation
    };
  }

  // ==========================================
  // 10. 经验沉淀检测（v2.0.0 新增）
  // ==========================================

  /**
   * 评估引擎从过往经验中学习并固化的能力
   *
   * 追踪自我纠正次数、模式识别率、知识固化的效率。
   * 引擎在运行中不断遇到相似模式，经验沉淀衡量的是
   * 这些模式被识别、固化并复用的效率。
   *
   * @param {Array} [interactionHistory] - 交互历史记录 [{type, outcome, pattern, timestamp}]
   * @returns {{
   *   selfCorrectionCount: number,
   *   patternRecognitionRate: number,
   *   settlingEfficiency: number,
   *   level: string,
   *   details: { totalInteractions: number, knownPatterns: number, patternHits: number, patternMisses: number, knowledgeCacheSize: number },
   *   recommendation: string
   * }}
   */
  assessExperienceSettling(interactionHistory = []) {
    // 处理传入的交互历史
    if (interactionHistory && Array.isArray(interactionHistory) && interactionHistory.length > 0) {
      for (const interaction of interactionHistory) {
        if (!interaction || !interaction.pattern) continue;

        // 添加到历史
        this._experienceSettling.interactions.push({
          timestamp: interaction.timestamp || Date.now(),
          type: interaction.type || 'unknown',
          outcome: interaction.outcome || 'unknown',
          pattern: interaction.pattern
        });

        // 更新知识缓存
        const key = interaction.pattern.toLowerCase().trim();
        const cached = this._experienceSettling.knowledgeCache.get(key);

        if (cached) {
          // 已有模式
          cached.count++;
          cached.lastSeen = Date.now();
          // 更新置信度：看到次数越多，置信度越高（但有限度）
          cached.confidence = Math.min(1, cached.confidence + 0.1);

          // 命中检测：如果 outcome 是 success 或 positive
          if (interaction.outcome && /success|correct|positive|hit/.test(interaction.outcome.toLowerCase())) {
            this._experienceSettling.patternHits++;
          } else if (interaction.outcome && /fail|wrong|error|miss/.test(interaction.outcome.toLowerCase())) {
            this._experienceSettling.patternMisses++;
            cached.confidence = Math.max(0.1, cached.confidence - 0.15); // 失败降低置信度
          } else {
            this._experienceSettling.patternHits++;
          }
        } else {
          // 新模式，缓存
          this._experienceSettling.knowledgeCache.set(key, {
            count: 1,
            lastSeen: Date.now(),
            confidence: 0.3 // 初始置信度较低
          });
        }

        // 自我纠正检测
        if (interaction.type === 'self_correction' || interaction.type === 'correction') {
          this._experienceSettling.selfCorrectionCount++;
        }
      }

      // 限制历史大小
      if (this._experienceSettling.interactions.length > this._experienceSettling.maxHistory) {
        this._experienceSettling.interactions = this._experienceSettling.interactions.slice(-this._experienceSettling.maxHistory);
      }
    }

    // 计算统计数据
    const totalPatternAttempts = this._experienceSettling.patternHits + this._experienceSettling.patternMisses;
    const patternRecognitionRate = totalPatternAttempts > 0
      ? this._experienceSettling.patternHits / totalPatternAttempts
      : 1.0; // 无数据时默认良好

    // 知识固化效率
    // 基于：模式重复出现率、置信度增长、自我纠正次数
    let settlingEfficiency = 1.0;
    const cacheSize = this._experienceSettling.knowledgeCache.size;

    if (cacheSize > 0) {
      // 计算缓存中高置信度模式的比例（count >= 3 的模式视为已固化）
      let solidifiedCount = 0;
      let totalConfidence = 0;
      for (const entry of this._experienceSettling.knowledgeCache.values()) {
        totalConfidence += entry.confidence;
        if (entry.count >= 3) solidifiedCount++;
      }
      const avgConfidence = totalConfidence / cacheSize;
      const solidificationRate = cacheSize > 0 ? solidifiedCount / cacheSize : 0;

      // 固化效率 = 平均置信度 * 固化率 * 模式识别率
      settlingEfficiency = avgConfidence * (0.5 + solidificationRate * 0.5) * patternRecognitionRate;

      // 自我纠正加分：每次纠正表明引擎在主动学习
      const correctionBonus = Math.min(0.2, this._experienceSettling.selfCorrectionCount * 0.02);
      settlingEfficiency += correctionBonus;
    }

    settlingEfficiency = Math.max(0, Math.min(1, settlingEfficiency));
    this._experienceSettling.settlingEfficiency = Math.round(settlingEfficiency * 100) / 100;

    // 等级判定
    let level;
    if (settlingEfficiency >= 0.8) {
      level = 'efficient';
    } else if (settlingEfficiency >= 0.6) {
      level = 'moderate';
    } else if (settlingEfficiency >= 0.4) {
      level = 'developing';
    } else {
      level = 'nascent';
    }

    // 推荐建议
    let recommendation;
    if (level === 'efficient') {
      recommendation = '经验沉淀高效，知识固化良好，模式识别能力优秀';
    } else if (level === 'moderate') {
      recommendation = `经验沉淀中等（效率 ${Math.round(settlingEfficiency * 100)}%），建议增加模式验证次数`;
    } else if (level === 'developing') {
      recommendation = '经验沉淀仍在发展中，建议增加重复模式训练和自我纠正实践';
    } else {
      recommendation = '经验沉淀较弱，需要更多交互经验积累和模式识别训练';
    }

    return {
      selfCorrectionCount: this._experienceSettling.selfCorrectionCount,
      patternRecognitionRate: Math.round(patternRecognitionRate * 100) / 100,
      settlingEfficiency: Math.round(settlingEfficiency * 100) / 100,
      level,
      details: {
        totalInteractions: this._experienceSettling.interactions.length,
        knownPatterns: cacheSize,
        patternHits: this._experienceSettling.patternHits,
        patternMisses: this._experienceSettling.patternMisses,
        knowledgeCacheSize: cacheSize
      },
      recommendation
    };
  }

  // ==========================================
  // 综合评估
  // ==========================================

  /**
   * 完整心理评估：运行所有检测（10个维度）
   * @param {object} options
   * @returns {object} 综合评估结果
   */
  fullAssessment(options = {}) {
    const { activeGoals, context, action, input, currentTask, interactionHistory } = options;

    // 原有7个维度
    const cognitiveLoad = this.assessCognitiveLoad(context || {});
    const goalConflicts = this.detectGoalConflicts(activeGoals || []);
    const valueTensions = this.detectValueTensions((context && context.input) || '');
    const identityDrift = this.detectIdentityDrift();
    const decisionDecay = this.detectDecisionDecay();
    const dissonances = this.detectCognitiveDissonance(action || '', context || {});

    // v2.0.0 新增3个维度
    const uncertainty = this.assessUncertainty(input || action || '', {
      knowledgeConfidence: (context && context.knowledgeConfidence) || undefined,
      topic: (context && context.topic) || undefined
    });
    const attentionFocus = this.assessAttentionFocus(currentTask || (context && context.task) || '', context || {});
    const experienceSettling = this.assessExperienceSettling(interactionHistory || []);

    // 认知弹性（原第7维度，计算在最后因为它依赖前面的失调检测）
    const cognitiveResilience = this.assessCognitiveResilience();

    // 综合健康度
    let healthScore = 1.0;

    // 认知负荷扣分
    healthScore -= cognitiveLoad.load * 0.25;

    // 目标冲突扣分
    const conflictSeverity = goalConflicts.reduce((sum, c) => {
      const severityMap = { high: 0.2, medium: 0.1, low: 0.05 };
      return sum + (severityMap[c.severity] || 0.05);
    }, 0);
    healthScore -= Math.min(0.25, conflictSeverity);

    // 认知失调扣分
    const dissonanceSeverity = dissonances.reduce((sum, d) => sum + d.severity * 0.1, 0);
    healthScore -= Math.min(0.25, dissonanceSeverity);

    // 决策衰减扣分
    if (decisionDecay.decaying) {
      healthScore -= 0.15;
    }

    // 价值矛盾扣分（有张力不一定是问题，减少量）
    healthScore -= valueTensions.length * 0.05;

    // 认知弹性加分（弹性好 = 正向因子，弹性差 = 额外扣分）
    healthScore += (cognitiveResilience.score - 0.5) * 0.15;

    // ==========================================
    // v2.0.0 新维度对健康分的影响
    // ==========================================

    // 认知不确定性扣分：低校准度 = 扣分
    healthScore -= (1 - uncertainty.calibrationScore) * 0.1;

    // 注意力分配扣分：碎片化程度高 = 扣分
    healthScore -= attentionFocus.fragmentationScore * 0.1;

    // 经验沉淀加分：高效沉淀 = 加分
    healthScore += (experienceSettling.settlingEfficiency - 0.5) * 0.1;

    healthScore = Math.max(0, Math.min(1, healthScore));

    return {
      timestamp: Date.now(),
      version: this.version,
      healthScore: Math.round(healthScore * 100) / 100,
      dimensions: {
        // 原有7个维度
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
        },
        cognitiveResilience,
        // v2.0.0 新增3个维度
        cognitiveUncertainty: uncertainty,
        attentionFocus,
        experienceSettling
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
      },
      cognitiveResilience: {
        currentScore: this._cognitiveResilience.currentScore,
        totalEvents: this._cognitiveResilience.recoveryEvents.length
      },
      // v2.0.0 新增维度统计
      cognitiveUncertainty: {
        currentUncertainty: this._cognitiveUncertainty.currentUncertainty,
        currentCalibration: this._cognitiveUncertainty.currentCalibration,
        totalAssessments: this._cognitiveUncertainty.assessments.length
      },
      attentionFocus: {
        focusDepth: this._attentionFocus.focusDepth,
        fragmentationScore: this._attentionFocus.fragmentationScore,
        taskSwitches: this._attentionFocus.taskSwitches.length,
        currentTask: this._attentionFocus.currentTask || 'none'
      },
      experienceSettling: {
        selfCorrectionCount: this._experienceSettling.selfCorrectionCount,
        patternRecognitionRate: this._experienceSettling.patternHits > 0
          ? Math.round((this._experienceSettling.patternHits / (this._experienceSettling.patternHits + this._experienceSettling.patternMisses)) * 100) / 100
          : 1.0,
        settlingEfficiency: this._experienceSettling.settlingEfficiency,
        totalInteractions: this._experienceSettling.interactions.length,
        knownPatterns: this._experienceSettling.knowledgeCache.size
      }
    };
  }
}

module.exports = { AgentPsychology };
