/**
 * Memory Consolidation Engine — 记忆巩固引擎（公式驱动）
 * 
 * 集成公式：
 *   - 艾宾浩斯遗忘曲线: R = exp(-t/S)，动态强度S
 *   - ACT-R 基础级学习: B_i = ln(Σ t_j^{-d})
 *   - ACT-R 扩散激活: S_i = Σ w_ji · ln(1/fan_j)
 *   - LTP/LTD 突触可塑性: STDP时间窗
 *   - 记忆巩固(Spacing Effect): 间隔重复优化
 *   - 工作记忆衰减: Cowan 4±2 chunks
 *   - 记忆检索(SAM): 激活 = Σ cue_i × trace_j
 *   - 长期记忆编码深度: Craik & Lockhart
 * 
 * dispatch: 'memoryConsolidation.consolidate' / 'memoryConsolidation.schedule' / 'memoryConsolidation.recall'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');

class MemoryConsolidationEngine {
  constructor(options = {}) {
    this._bridge = null;
    this._memoryTraces = new Map();  // traceId → { content, strength, lastAccess, accessCount, accessIntervals, encoding }
    this._workingMemory = [];        // 工作记忆槽位（4±2）
    this._workingMemoryCapacity = options.workingMemoryCapacity || 5;
    this._consolidationThreshold = options.consolidationThreshold || 0.3;  // 低于此值触发巩固
    this._spacingBase = options.spacingBase || 1.5;  // 间隔重复基础倍率
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // ═══════════════════════════════════════════
  // 艾宾浩斯遗忘 + 动态强度
  // ═══════════════════════════════════════════

  /**
   * 计算记忆保留率（动态强度版）
   * @param {string} traceId - 记忆痕迹ID
   * @param {number} [now=Date.now()] - 当前时间
   * @returns {object} { retention, strength, age, accessCount, needsConsolidation }
   */
  computeRetention(traceId, now = Date.now()) {
    const bridge = this._getBridge();
    const trace = this._memoryTraces.get(traceId);
    if (!trace) return { retention: 0, strength: 0, age: Infinity, needsConsolidation: true };

    const ageMs = now - trace.lastAccess;
    // 动态强度：基于访问频率
    const strengthMs = bridge.memoryStrengthFromFrequency(trace.accessCount);
    const retention = bridge.ebbinghausRetention(ageMs, strengthMs);
    
    return {
      retention: +retention.toFixed(4),
      strengthMs,
      ageMs,
      accessCount: trace.accessCount,
      needsConsolidation: retention < this._consolidationThreshold
    };
  }

  // ═══════════════════════════════════════════
  // ACT-R 完整记忆模型
  // ═══════════════════════════════════════════

  /**
   * ACT-R 记忆激活度计算
   * A_i = B_i + S_i + P_i + noise
   * @param {string} traceId
   * @param {object} [context] - { spreadingSources: [{id, weight}], partialMatch: number }
   * @returns {object} { activation, baseLevel, spreading, retrievalProbability }
   */
  actrActivation(traceId, context = {}) {
    const bridge = this._getBridge();
    const trace = this._memoryTraces.get(traceId);
    if (!trace) return { activation: -Infinity, baseLevel: 0, spreading: 0, retrievalProbability: 0 };

    // 基础级激活
    const baseLevel = bridge.actrBaseLevel(trace.accessIntervals || []);
    
    // 扩散激活
    let spreading = 0;
    if (context.spreadingSources) {
      for (const src of context.spreadingSources) {
        const srcTrace = this._memoryTraces.get(src.id);
        if (srcTrace) {
          // S_ji = W_ji × ln(1/fan_j)，fan = 关联数
          const fan = Math.max(1, srcTrace.associations || 1);
          spreading += (src.weight || 0.5) * Math.log(1 / fan);
        }
      }
    }

    const partialMatch = context.partialMatch || 0;
    const activation = bridge.actrActivation(baseLevel, spreading, partialMatch);
    
    // 检索概率（噪声/温度参数）
    const allActivations = [activation];
    for (const [id, t] of this._memoryTraces) {
      if (id !== traceId && t.accessIntervals) {
        allActivations.push(bridge.actrBaseLevel(t.accessIntervals));
      }
    }
    const probs = bridge.actrNoise(allActivations, 0.5);
    
    return {
      activation: +activation.toFixed(4),
      baseLevel: +baseLevel.toFixed(4),
      spreading: +spreading.toFixed(4),
      partialMatch,
      retrievalProbability: +(probs[0] || 0).toFixed(4)
    };
  }

  // ═══════════════════════════════════════════
  // 记忆巩固（Spacing Effect 间隔重复）
  // ═══════════════════════════════════════════

  /**
   * 计算最优复习时间表
   * 基于SM-2算法变体 + 艾宾浩斯间隔
   * @param {string} traceId
   * @param {number} quality - 回忆质量(0-5)，5=完美，0=完全忘记
   * @returns {object} { nextReviewMs, interval, easinessFactor, repetitions }
   */
  scheduleReview(traceId, quality) {
    const trace = this._memoryTraces.get(traceId);
    if (!trace) return { nextReviewMs: 0, interval: 0, easinessFactor: 2.5, repetitions: 0 };

    // SM-2 Easiness Factor 更新
    let ef = trace.easinessFactor || 2.5;
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ef = Math.max(1.3, ef);

    // 间隔计算
    let interval;
    const reps = (trace.repetitions || 0) + 1;
    if (quality < 3) {
      // 回忆失败：重置
      interval = this._spacingBase * 60000;  // 1.5分钟
      trace.repetitions = 0;
    } else if (reps === 1) {
      interval = 60000;  // 1分钟
    } else if (reps === 2) {
      interval = 10 * 60000;  // 10分钟
    } else {
      interval = (trace.lastInterval || 10 * 60000) * ef;
    }

    // 结合艾宾浩斯：确保保留率不低于阈值
    const bridge = this._getBridge();
    const strengthMs = bridge.memoryStrengthFromFrequency(trace.accessCount + 1);
    const ebbinghausInterval = -strengthMs * Math.log(this._consolidationThreshold);
    interval = Math.max(interval, ebbinghausInterval);

    return {
      nextReviewMs: +interval.toFixed(0),
      intervalMinutes: +(interval / 60000).toFixed(1),
      easinessFactor: +ef.toFixed(2),
      repetitions: quality >= 3 ? reps : 0,
      quality
    };
  }

  // ═══════════════════════════════════════════
  // 工作记忆管理（Cowan 4±2 chunks）
  // ═══════════════════════════════════════════

  /**
   * 工作记忆入槽：新信息进入工作记忆，超容量时最弱项被替换
   * @param {object} item - { id, content, salience(0-1) }
   * @returns {object} { accepted, displaced, currentLoad, capacityUtilization }
   */
  workingMemoryPush(item) {
    const wm = this._workingMemory;
    
    if (wm.length < this._workingMemoryCapacity) {
      wm.push({ ...item, enteredAt: Date.now() });
      return { accepted: true, displaced: null, currentLoad: wm.length, capacityUtilization: wm.length / this._workingMemoryCapacity };
    }

    // 超容量：替换最弱项（salience最低 + 最久未访问）
    let weakestIdx = 0;
    let weakestScore = Infinity;
    for (let i = 0; i < wm.length; i++) {
      const age = Date.now() - wm[i].enteredAt;
      const score = wm[i].salience * 0.7 - (age / 60000) * 0.3;  // 新鲜度加权
      if (score < weakestScore) { weakestScore = score; weakestIdx = i; }
    }

    const displaced = wm[weakestIdx];
    wm[weakestIdx] = { ...item, enteredAt: Date.now() };
    return { accepted: true, displaced: displaced.id, currentLoad: wm.length, capacityUtilization: 1.0 };
  }

  /**
   * 工作记忆衰减：超过一定时间未刷新的项salience降低
   * @param {number} [decayRate=0.1] - 每分钟衰减率
   */
  workingMemoryDecay(decayRate = 0.1) {
    const now = Date.now();
    const toRemove = [];
    for (let i = 0; i < this._workingMemory.length; i++) {
      const ageMin = (now - this._workingMemory[i].enteredAt) / 60000;
      this._workingMemory[i].salience = Math.max(0, (this._workingMemory[i].salience || 1) - decayRate * ageMin);
      if (this._workingMemory[i].salience <= 0.05) toRemove.push(i);
    }
    // 移除衰减殆尽的项
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._workingMemory.splice(toRemove[i], 1);
    }
    return { remaining: this._workingMemory.length, items: this._workingMemory.map(w => ({ id: w.id, salience: +w.salience.toFixed(3) })) };
  }

  // ═══════════════════════════════════════════
  // 记忆痕迹管理
  // ═══════════════════════════════════════════

  /**
   * 注册新记忆痕迹
   * @param {string} traceId
   * @param {object} data - { content, encoding: 'shallow'|'deep', associations: number }
   */
  registerTrace(traceId, data = {}) {
    const now = Date.now();
    // 编码深度影响初始强度（Craik & Lockhart）
    const encodingBonus = data.encoding === 'deep' ? 2.0 : 1.0;
    this._memoryTraces.set(traceId, {
      content: data.content || '',
      strength: encodingBonus,
      lastAccess: now,
      accessCount: 1,
      accessIntervals: [86400000],  // 初始间隔1天
      encoding: data.encoding || 'shallow',
      associations: data.associations || 1,
      easinessFactor: 2.5,
      repetitions: 0,
      lastInterval: 0
    });
    return { traceId, encoding: data.encoding, initialStrength: encodingBonus };
  }

  /**
   * 访问记忆痕迹（更新访问记录）
   */
  accessTrace(traceId) {
    const trace = this._memoryTraces.get(traceId);
    if (!trace) return null;
    const now = Date.now();
    const interval = now - trace.lastAccess;
    trace.accessIntervals.push(interval);
    trace.lastAccess = now;
    trace.accessCount++;
    // 限制间隔数组大小
    if (trace.accessIntervals.length > 100) trace.accessIntervals = trace.accessIntervals.slice(-50);
    return { traceId, accessCount: trace.accessCount, lastInterval: interval };
  }

  /**
   * 执行记忆巩固：对低保留率记忆进行强化
   * @returns {object} { consolidated, skipped, details }
   */
  consolidate() {
    const now = Date.now();
    const consolidated = [];
    const skipped = [];

    for (const [id, trace] of this._memoryTraces) {
      const { retention, needsConsolidation } = this.computeRetention(id, now);
      if (needsConsolidation) {
        // 巩固：增加强度（模拟复述）
        trace.strength *= 1.5;
        trace.lastAccess = now;
        trace.accessCount++;
        consolidated.push({ id, oldRetention: +retention.toFixed(4), newStrength: +trace.strength.toFixed(2) });
      } else {
        skipped.push(id);
      }
    }

    return { consolidated: consolidated.length, skipped: skipped.length, details: consolidated };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const now = Date.now();
    let totalRetention = 0;
    let atRisk = 0;
    for (const [id] of this._memoryTraces) {
      const { retention, needsConsolidation } = this.computeRetention(id, now);
      totalRetention += retention;
      if (needsConsolidation) atRisk++;
    }
    const avgRetention = this._memoryTraces.size > 0 ? totalRetention / this._memoryTraces.size : 1;
    return {
      status: 'ok',
      totalTraces: this._memoryTraces.size,
      workingMemoryLoad: this._workingMemory.length,
      workingMemoryCapacity: this._workingMemoryCapacity,
      averageRetention: +avgRetention.toFixed(4),
      atRiskMemories: atRisk
    };
  }
}

module.exports = { MemoryConsolidationEngine };
