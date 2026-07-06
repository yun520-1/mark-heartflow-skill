/**
 * HeartFlow v5.8.0 — 信号与来源追踪
 * 
 * 来源: Memori (https://github.com/MemoriLabs/Memori)
 * 功能: 追踪记忆信号（用户反馈、纠正、确认等）
 */

class SignalTracker {
  constructor(options = {}) {
    this.signalLog = [];           // 信号日志
    this.sourceLog = [];           // 来源日志
    this.memorySignals = new Map();  // memoryId → [signals]
    this.sourceStats = new Map();   // source → count
  }

  /**
   * 记录记忆信号
   * 
   * 信号类型：
   * - user_feedback_positive: 用户正面反馈
   * - user_feedback_negative: 用户负面反馈
   * - correction: 用户纠正
   * - confirmation: 用户确认
   * - repetition: 用户重复提及
   * - ignore: 用户忽略（未回应）
   */
  recordSignal(memoryId, signal, options = {}) {
    const record = {
      memoryId,
      signal,
      source: options.source || 'unknown',
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    this.signalLog.push(record);

    // 添加到记忆信号索引
    if (!this.memorySignals.has(memoryId)) {
      this.memorySignals.set(memoryId, []);
    }
    this.memorySignals.get(memoryId).push(record);

    // 根据信号调整记忆权重
    this.adjustMemoryWeight(memoryId, signal);

    return record;
  }

  /**
   * 记录记忆来源
   */
  recordSource(memoryId, source, metadata = {}) {
    const record = {
      memoryId,
      source,  // 'wechat' | 'feishu' | 'web' | 'api' | ...
      timestamp: new Date().toISOString(),
      metadata
    };

    this.sourceLog.push(record);

    // 更新来源统计
    const count = this.sourceStats.get(source) || 0;
    this.sourceStats.set(source, count + 1);

    return record;
  }

  /**
   * 根据信号调整记忆权重
   */
  adjustMemoryWeight(memoryId, signal) {
    // 假设外部传入 memory 对象
    const memory = this.getMemoryById(memoryId);
    if (!memory) return;

    const weightAdjustments = {
      'user_feedback_positive': 1.2,
      'user_feedback_negative': 0.8,
      'correction': 0.5,      // 被纠正的记忆降低权重
      'confirmation': 1.1,
      'repetition': 1.05,          // 重复提及逐渐提升
      'ignore': 0.95             // 被忽略的记忆稍微降低
    };

    const adjustment = weightAdjustments[signal] || 1.0;
    memory.weight = (memory.weight || 1.0) * adjustment;

    // 记录调整历史
    if (!memory.weightHistory) {
      memory.weightHistory = [];
    }
    memory.weightHistory.push({
      signal,
      oldWeight: memory.weight / adjustment,
      newWeight: memory.weight,
      timestamp: new Date().toISOString()
    });

    this.updateMemory(memory);
  }

  /**
   * 获取记忆的信号历史
   */
  getSignalHistory(memoryId) {
    return this.memorySignals.get(memoryId) || [];
  }

  /**
   * 获取记忆的当前权重
   */
  getMemoryWeight(memoryId) {
    const memory = this.getMemoryById(memoryId);
    return memory ? (memory.weight || 1.0) : 0;
  }

  /**
   * 获取来源统计
   */
  getSourceStats() {
    const stats = {};
    for (const [source, count] of this.sourceStats) {
      stats[source] = count;
    }
    return stats;
  }

  /**
   * 分析记忆质量（基于信号）
   */
  analyzeMemoryQuality(memoryId) {
    const signals = this.getSignalHistory(memoryId);
    
    const analysis = {
      memoryId,
      totalSignals: signals.length,
      positiveSignals: 0,
      negativeSignals: 0,
      corrections: 0,
      confirmations: 0,
      qualityScore: 0.5  // 默认中等质量
    };

    for (const signal of signals) {
      if (signal.signal.includes('positive') || signal.signal === 'confirmation') {
        analysis.positiveSignals++;
      } else if (signal.signal.includes('negative') || signal.signal === 'correction') {
        analysis.negativeSignals++;
      }

      if (signal.signal === 'correction') analysis.corrections++;
      if (signal.signal === 'confirmation') analysis.confirmations++;
    }

    // 计算质量分数（0-1）
    if (analysis.totalSignals > 0) {
      analysis.qualityScore = 
        (analysis.positiveSignals + analysis.confirmations) / 
        (analysis.totalSignals + analysis.corrections + 1);  // +1 避免除以0
    }

    return analysis;
  }

  /**
   * 推荐高质量记忆
   */
  recommendMemories(memoryIds, topN = 10) {
    const scored = memoryIds.map(id => ({
      memoryId: id,
      qualityScore: this.analyzeMemoryQuality(id).qualityScore,
      weight: this.getMemoryWeight(id)
    }));

    // 按质量分数和权重综合排序
    scored.sort((a, b) => {
      const scoreA = a.qualityScore * 0.6 + (a.weight - 1.0) * 0.4;
      const scoreB = b.qualityScore * 0.6 + (b.weight - 1.0) * 0.4;
      return scoreB - scoreA;
    });

    return scored.slice(0, topN);
  }

  /**
   * 导出信号日志（用于分析或迁移）
   */
  exportSignalLog(format = 'json') {
    if (format === 'csv') {
      const header = 'memoryId,signal,source,timestamp\n';
      const rows = this.signalLog.map(r => 
        `${r.memoryId},${r.signal},${r.source},${r.timestamp}`
      ).join('\n');
      return header + rows;
    }

    return JSON.stringify(this.signalLog, null, 2);
  }

  /**
   * 清空信号日志（保留最近 N 条）
   */
  pruneSignalLog(keepLast = 1000) {
    if (this.signalLog.length > keepLast) {
      this.signalLog = this.signalLog.slice(-keepLast);
    }

    // 重建 memorySignals 索引
    this.memorySignals.clear();
    for (const record of this.signalLog) {
      if (!this.memorySignals.has(record.memoryId)) {
        this.memorySignals.set(record.memoryId, []);
      }
      this.memorySignals.get(record.memoryId).push(record);
    }
  }
}

module.exports = { SignalTracker };
