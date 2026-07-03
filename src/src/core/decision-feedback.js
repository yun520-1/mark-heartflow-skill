/**
 * decision-feedback.js — 决策反馈学习引擎 v1.0.0
 *
 * 跟踪决策结果，动态调整规则权重，将静态规则系统转化为学习系统。
 * 与 DecisionRouter 协同工作，消费其评估结果并提供学习信号。
 *
 * 核心机制：
 *   每次记录决策结果 → 调整规则内部权重 → 动态重排优先级
 *   correct → weight +0.05 (max 1.0)
 *   wrong   → weight -0.10 (min 0.1)
 *
 * 依赖：
 *   - decision-router.js (DECISION, DECISION_PRIORITY 常量)
 */

const MAX_HISTORY = 1000;

// ─── 学习参数 ──────────────────────────────────────────────────────────────
const LEARNING_RATES = {
  correctBoost: 0.05,
  wrongPenalty: 0.10,
  maxWeight: 1.5,    // 允许权重上浮50%，初始1.0
  minWeight: 0.1,
};

// 优先级调整阈值
const PRIORITY_THRESHOLDS = {
  boostAbove: 0.80,    // > 80% accuracy → priority boost
  reduceBelow: 0.40,   // < 40% accuracy → priority reduction
  boostAmount: 10,     // priority points to add
  reduceAmount: 10,    // priority points to subtract
};

// ─── DecisionFeedback 类 ──────────────────────────────────────────────────
class DecisionFeedback {
  /**
   * @param {object} decisionRouter - DecisionRouter 实例引用
   */
  constructor(decisionRouter) {
    /** @type {object} DecisionRouter 实例 */
    this._router = decisionRouter;

    /**
     * 学习权重映射: { [ruleId]: number }
     * 每个规则的动态权重，初始为 1.0（全权重）
     * @type {Object<string, number>}
     */
    this._learnedWeights = {};

    /**
     * 决策历史记录，最多 MAX_HISTORY 条
     * @type {Array<{decision: object, wasCorrect: boolean, notes: string, timestamp: number}>}
     */
    this._history = [];

    /**
     * 按决策类型汇总的统计数据
     * @type {Object<string, {total: number, correct: number, wrong: number}>}
     */
    this._byDecisionType = {};

    /**
     * 按规则 ID 汇总的统计数据
     * @type {Object<string, {total: number, correct: number, wrong: number}>}
     */
    this._byRule = {};

    /**
     * 优先级调整历史
     * @type {Array<{timestamp: number, adjustments: object}>}
     */
    this._priorityAdjustments = [];

    /**
     * 总跟踪计数
     * @type {number}
     */
    this._totalTracked = 0;
  }

  // ─── 公开方法 ──────────────────────────────────────────────────────────

  /**
   * 记录一次决策结果，并自动调整规则权重
   *
   * @param {object} decision - 决策对象 { type, ruleId, confidence, context }
   * @param {boolean} wasCorrect - true=好决策, false=坏决策
   * @param {string} [notes=''] - 备注说明
   * @returns {object} 更新后的权重信息
   */
  recordOutcome(decision, wasCorrect, notes) {
    // 安全校验
    if (!decision || typeof decision !== 'object') {
      return { error: '无效的 decision 对象', adjusted: false };
    }

    const { type, ruleId, confidence, context } = decision;
    if (!type || !ruleId) {
      return { error: 'decision 缺少 type 或 ruleId', adjusted: false };
    }

    const wasCorrectBool = wasCorrect === true;
    const notesStr = typeof notes === 'string' ? notes : '';

    // 1. 记录历史
    const entry = {
      decision: {
        type,
        ruleId,
        confidence: typeof confidence === 'number' ? confidence : null,
        context: context || null,
      },
      wasCorrect: wasCorrectBool,
      notes: notesStr,
      timestamp: Date.now(),
    };

    this._history.push(entry);
    this._totalTracked++;

    // 修剪历史到 MAX_HISTORY（保留最新）
    if (this._history.length > MAX_HISTORY) {
      this._history.splice(0, this._history.length - MAX_HISTORY);
    }

    // 2. 更新按决策类型的统计
    if (!this._byDecisionType[type]) {
      this._byDecisionType[type] = { total: 0, correct: 0, wrong: 0 };
    }
    this._byDecisionType[type].total++;
    if (wasCorrectBool) {
      this._byDecisionType[type].correct++;
    } else {
      this._byDecisionType[type].wrong++;
    }

    // 3. 更新按规则的统计
    if (!this._byRule[ruleId]) {
      this._byRule[ruleId] = { total: 0, correct: 0, wrong: 0 };
    }
    this._byRule[ruleId].total++;
    if (wasCorrectBool) {
      this._byRule[ruleId].correct++;
    } else {
      this._byRule[ruleId].wrong++;
    }

    // 4. 调整规则的学习权重
    if (!this._learnedWeights[ruleId]) {
      this._learnedWeights[ruleId] = 1.0;
    }

    const currentWeight = this._learnedWeights[ruleId];
    if (wasCorrectBool) {
      // 正确 → 增加权重
      this._learnedWeights[ruleId] = Math.min(
        LEARNING_RATES.maxWeight,
        currentWeight + LEARNING_RATES.correctBoost
      );
    } else {
      // 错误 → 减少权重
      this._learnedWeights[ruleId] = Math.max(
        LEARNING_RATES.minWeight,
        currentWeight - LEARNING_RATES.wrongPenalty
      );
    }

    const newWeight = this._learnedWeights[ruleId];

    return {
      adjusted: true,
      ruleId,
      wasCorrect: wasCorrectBool,
      previousWeight: currentWeight,
      newWeight,
      delta: newWeight - currentWeight,
    };
  }

  /**
   * 获取某个规则的学习调整后权重
   *
   * @param {string} ruleId - 规则 ID
   * @returns {number} 当前学习权重（默认 1.0 表示未调整）
   */
  getAdjustedWeight(ruleId) {
    if (!ruleId || typeof ruleId !== 'string') {
      return 1.0;
    }
    return this._learnedWeights[ruleId] !== undefined
      ? this._learnedWeights[ruleId]
      : 1.0;
  }

  /**
   * 获取某个规则的详细有效性报告
   *
   * @param {string} ruleId - 规则 ID
   * @returns {object} { totalDecisions, correctCount, wrongCount, accuracy, currentWeight, trend }
   */
  getRuleEffectiveness(ruleId) {
    if (!ruleId || typeof ruleId !== 'string') {
      return {
        totalDecisions: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 0,
        currentWeight: 1.0,
        trend: 'stable',
      };
    }

    const ruleStats = this._byRule[ruleId];
    if (!ruleStats) {
      return {
        totalDecisions: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 0,
        currentWeight: this.getAdjustedWeight(ruleId),
        trend: 'stable',
      };
    }

    const total = ruleStats.total;
    const correct = ruleStats.correct;
    const wrong = ruleStats.wrong;
    const accuracy = total > 0 ? correct / total : 0;
    const currentWeight = this.getAdjustedWeight(ruleId);

    // 计算趋势：对比最近5条与更早的准确率
    const trend = this._computeTrend(ruleId);

    return {
      totalDecisions: total,
      correctCount: correct,
      wrongCount: wrong,
      accuracy: Math.round(accuracy * 10000) / 10000, // 4位小数
      currentWeight: Math.round(currentWeight * 10000) / 10000,
      trend,
    };
  }

  /**
   * 获取所有规则的有效性报告
   *
   * @returns {Array<{ruleId: string, totalDecisions: number, correctCount: number, wrongCount: number, accuracy: number, currentWeight: number, trend: string}>}
   */
  getAllEffectiveness() {
    const results = [];

    // 获取路由器中的所有规则 ID
    let ruleIds = [];
    try {
      if (this._router && typeof this._router.getRules === 'function') {
        const rules = this._router.getRules();
        ruleIds = rules.map(r => r.id);
      }
    } catch (e) {
      // 安全忽略
    }

    // 同时包含已跟踪但可能不在路由器中的规则
    const allTrackedIds = Object.keys(this._byRule);
    const combinedIds = [...new Set([...ruleIds, ...allTrackedIds])];

    for (const id of combinedIds) {
      results.push({
        ruleId: id,
        ...this.getRuleEffectiveness(id),
      });
    }

    // 按总决策数降序排列
    results.sort((a, b) => b.totalDecisions - a.totalDecisions);

    return results;
  }

  /**
   * 动态调整 DECISION_PRIORITY
   *
   * 基于每种决策类型的历史准确率调整优先级：
   * - 准确率 > 80% → 优先级提升 +10
   * - 准确率 < 40% → 优先级降低 -10
   *
   * @returns {object} { adjusted: boolean, adjustments: Array, newPriorities: object }
   */
  adjustPriorities() {
    if (!this._router) {
      return { adjusted: false, error: '无 DecisionRouter 引用', adjustments: [], newPriorities: {} };
    }

    // 获取当前 DECISION_PRIORITY
    let currentPriorities = null;
    try {
      // 尝试从路由器获取（如果路由器暴露了 DECISION_PRIORITY 常量）
      const routerModule = require('./decision-router.js');
      if (routerModule && routerModule.DECISION_PRIORITY) {
        currentPriorities = { ...routerModule.DECISION_PRIORITY };
      }
    } catch (e) {
      // 回退：尝试从路由器实例上获取
      // (router 内部引用 DECISION_PRIORITY 但并未作为属性暴露)
    }

    if (!currentPriorities) {
      return {
        adjusted: false,
        error: '无法获取 DECISION_PRIORITY',
        adjustments: [],
        newPriorities: {},
      };
    }

    const adjustments = [];
    const newPriorities = { ...currentPriorities };

    for (const [decisionType, priority] of Object.entries(currentPriorities)) {
      const typeStats = this._byDecisionType[decisionType];
      if (!typeStats || typeStats.total === 0) {
        continue; // 无数据，不调整
      }

      const accuracy = typeStats.correct / typeStats.total;

      if (accuracy > PRIORITY_THRESHOLDS.boostAbove) {
        // 高准确率 → 提升优先级
        const newPriority = priority + PRIORITY_THRESHOLDS.boostAmount;
        newPriorities[decisionType] = newPriority;
        adjustments.push({
          type: decisionType,
          oldPriority: priority,
          newPriority,
          reason: `准确率 ${(accuracy * 100).toFixed(1)}% > 80%，提升优先级`,
        });
      } else if (accuracy < PRIORITY_THRESHOLDS.reduceBelow) {
        // 低准确率 → 降低优先级
        const newPriority = Math.max(0, priority - PRIORITY_THRESHOLDS.reduceAmount);
        newPriorities[decisionType] = newPriority;
        adjustments.push({
          type: decisionType,
          oldPriority: priority,
          newPriority,
          reason: `准确率 ${(accuracy * 100).toFixed(1)}% < 40%，降低优先级`,
        });
      }
    }

    // 记录调整历史
    if (adjustments.length > 0) {
      this._priorityAdjustments.push({
        timestamp: Date.now(),
        adjustments: [...adjustments],
      });
    }

    return {
      adjusted: adjustments.length > 0,
      adjustments,
      newPriorities,
    };
  }

  /**
   * 获取反馈系统统计摘要
   *
   * @returns {object} { totalTracked, byDecisionType, rulesLearning, priorityAdjustments }
   */
  getStats() {
    // 按决策类型汇总
    const byDecisionType = {};
    for (const [type, stats] of Object.entries(this._byDecisionType)) {
      byDecisionType[type] = {
        ...stats,
        accuracy: stats.total > 0
          ? Math.round((stats.correct / stats.total) * 10000) / 10000
          : 0,
      };
    }

    // 规则学习摘要
    const rulesLearning = {};
    for (const [ruleId, weight] of Object.entries(this._learnedWeights)) {
      const ruleStats = this._byRule[ruleId];
      rulesLearning[ruleId] = {
        weight: Math.round(weight * 10000) / 10000,
        total: ruleStats ? ruleStats.total : 0,
        correct: ruleStats ? ruleStats.correct : 0,
        wrong: ruleStats ? ruleStats.wrong : 0,
        accuracy: ruleStats && ruleStats.total > 0
          ? Math.round((ruleStats.correct / ruleStats.total) * 10000) / 10000
          : 0,
      };
    }

    // 优先级调整统计
    const totalAdjustments = this._priorityAdjustments.length;
    const lastAdjustment = totalAdjustments > 0
      ? this._priorityAdjustments[totalAdjustments - 1]
      : null;

    return {
      totalTracked: this._totalTracked,
      historySize: this._history.length,
      maxHistory: MAX_HISTORY,
      byDecisionType,
      rulesLearning,
      priorityAdjustments: {
        totalTimes: totalAdjustments,
        lastAdjustment: lastAdjustment
          ? {
              timestamp: lastAdjustment.timestamp,
              changes: lastAdjustment.adjustments.length,
            }
          : null,
      },
    };
  }

  // ─── 数据持久化 ────────────────────────────────────────────────────────

  /**
   * 将所有学习数据和历史序列化保存到文件
   *
   * @param {string} filePath - 保存路径
   * @returns {object} { success: boolean, path: string, entriesSaved: number }
   */
  save(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: '无效的 filePath', path: null, entriesSaved: 0 };
    }

    try {
      const fs = require('fs');
      const data = {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        totalTracked: this._totalTracked,
        learnedWeights: this._learnedWeights,
        history: this._history,
        byDecisionType: this._byDecisionType,
        byRule: this._byRule,
        priorityAdjustments: this._priorityAdjustments,
      };

      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, json, 'utf-8');

      return {
        success: true,
        path: filePath,
        entriesSaved: this._history.length,
      };
    } catch (e) {
      return { success: false, error: e.message, path: filePath, entriesSaved: 0 };
    }
  }

  /**
   * 从文件加载学习数据和历史
   *
   * @param {string} filePath - 加载路径
   * @returns {object} { success: boolean, path: string, entriesLoaded: number }
   */
  load(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: '无效的 filePath', path: null, entriesLoaded: 0 };
    }

    try {
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return { success: false, error: '文件不存在', path: filePath, entriesLoaded: 0 };
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (!data || typeof data !== 'object') {
        return { success: false, error: '无效的数据格式', path: filePath, entriesLoaded: 0 };
      }

      // 恢复字段（含安全校验）
      this._totalTracked = typeof data.totalTracked === 'number' ? data.totalTracked : 0;
      this._learnedWeights = data.learnedWeights && typeof data.learnedWeights === 'object'
        ? data.learnedWeights
        : {};
      this._history = Array.isArray(data.history) ? data.history.slice(0, MAX_HISTORY) : [];
      this._byDecisionType = data.byDecisionType && typeof data.byDecisionType === 'object'
        ? data.byDecisionType
        : {};
      this._byRule = data.byRule && typeof data.byRule === 'object'
        ? data.byRule
        : {};
      this._priorityAdjustments = Array.isArray(data.priorityAdjustments)
        ? data.priorityAdjustments
        : [];

      return {
        success: true,
        path: filePath,
        entriesLoaded: this._history.length,
      };
    } catch (e) {
      return { success: false, error: e.message, path: filePath, entriesLoaded: 0 };
    }
  }

  // ─── 内部方法 ──────────────────────────────────────────────────────────

  /**
   * 计算某个规则的准确率趋势
   *
   * @param {string} ruleId
   * @returns {string} 'improving' | 'declining' | 'stable'
   * @private
   */
  _computeTrend(ruleId) {
    // 获取该规则的所有历史条目（最近最多 20 条）
    const ruleEntries = this._history.filter(
      h => h.decision && h.decision.ruleId === ruleId
    );

    if (ruleEntries.length < 6) {
      return 'stable'; // 数据不足
    }

    // 最近 5 条 vs 更早的 5 条
    const recent = ruleEntries.slice(-5);
    const earlier = ruleEntries.slice(-10, -5);

    if (recent.length < 3 || earlier.length < 3) {
      return 'stable';
    }

    const recentAccuracy = recent.filter(e => e.wasCorrect).length / recent.length;
    const earlierAccuracy = earlier.filter(e => e.wasCorrect).length / earlier.length;

    const diff = recentAccuracy - earlierAccuracy;
    if (diff > 0.15) return 'improving';
    if (diff < -0.15) return 'declining';
    return 'stable';
  }
}

// ─── 导出 ──────────────────────────────────────────────────────────────────
module.exports = {
  DecisionFeedback,
  LEARNING_RATES,
  PRIORITY_THRESHOLDS,
  MAX_HISTORY,
};
