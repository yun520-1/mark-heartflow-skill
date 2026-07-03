/**
 * FocusOfAttention — 注意力焦点引擎（v1.0.0）
 *
 * CogMem 启发：动态注意力焦点机制
 * "Focus of Attention dynamically reconstructs concise, task-relevant context at each turn."
 *
 * 解决的问题：
 * - 长对话中上下文膨胀，LLM 注意力分散
 * - 不相关的记忆干扰当前任务
 * - 上下文窗口有限，需要智能裁剪
 *
 * 核心机制：
 * 1. 注意力评分：每个记忆/上下文项根据与当前任务的关联度打分
 * 2. 焦点重建：每轮对话自动重建上下文窗口
 * 3. 衰减机制：不相关的记忆随时间降低注意力权重
 * 4. 上下文压缩：将低优先级内容压缩为摘要
 *
 * API:
 *   new FocusOfAttention(options)
 *   .setTask(taskDescription)     — 设置当前任务焦点
 *   .attend(item, relevance)      — 将项目加入注意力池
 *   .getContext(limit)            — 获取重建后的上下文
 *   .decay()                      — 衰减所有注意力权重
 *   .compress()                   — 压缩低优先级内容为摘要
 *   .getStats()                   — 获取注意力统计
 */

class FocusOfAttention {
  /**
   * @param {Object} options
   * @param {number} [options.maxAttention=10] - 最大注意力项数
   * @param {number} [options.decayRate=0.1] - 每轮衰减率
   * @param {number} [options.attentionThreshold=0.2] - 低于此值移除
   */
  constructor(options = {}) {
    this.maxAttention = options.maxAttention || 10;
    this.decayRate = options.decayRate || 0.1;
    this.attentionThreshold = options.attentionThreshold || 0.2;

    /** @type {Array<{id, content, type, attention, createdAt, lastRefreshed}>} */
    this._items = [];
    this._task = null;
    this._turnCount = 0;
  }

  // ==========================================================================
  // 任务焦点管理
  // ==========================================================================

  /**
   * 设置当前任务焦点（影响注意力评分）
   * @param {string} task - 任务描述
   */
  setTask(task) {
    this._task = task;
    // 任务变更时刷新所有项目的注意力
    this._refreshAttention();
    return this;
  }

  // ==========================================================================
  // 注意力管理
  // ==========================================================================

  /**
   * 将项目加入注意力池
   * @param {string} content - 内容
   * @param {string} type - 类型 (memory|context|evidence|goal|constraint)
   * @param {number} [relevance] - 初始相关性 0-1（可选）
   * @returns {object} { id, attention }
   */
  attend(content, type = 'context', relevance) {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const taskRelevance = this._computeRelevance(content, relevance);

    const item = {
      id,
      content: String(content).slice(0, 500),
      type,
      attention: taskRelevance,
      createdAt: Date.now(),
      lastRefreshed: Date.now(),
      refreshCount: 0,
    };

    this._items.push(item);
    this._enforceLimit();
    return { id, attention: item.attention };
  }

  /**
   * 批量 attend（用于 pipeline 输出阶段）
   * @param {Array<{content, type}>} items
   */
  attendBatch(items) {
    const results = [];
    for (const item of items || []) {
      results.push(this.attend(item.content, item.type || 'context'));
    }
    return results;
  }

  /**
   * 获取重建后的上下文（Focus of Attention 核心）
   * @param {number} [limit] - 最大返回项数
   * @returns {Array} 按注意力排序的上下文项
   */
  getContext(limit) {
    this._turnCount++;

    // 衰减
    this.decay();

    // 过滤 + 排序
    const active = this._items
      .filter(item => item.attention >= this.attentionThreshold)
      .sort((a, b) => b.attention - a.attention);

    const maxItems = limit || this.maxAttention;
    const selected = active.slice(0, maxItems);

    // 构建上下文
    return selected.map(item => ({
      content: item.content,
      type: item.type,
      attention: Math.round(item.attention * 100) / 100,
    }));
  }

  /**
   * 获取紧凑上下文摘要（用于 LLM 输入）
   * @param {number} [maxTokens=80000] - 最大字符数（1M 上下文的 8%）
   * @returns {string} 紧凑上下文文本
   */
  getCompactContext(maxTokens = 80000) {
    const items = this.getContext();
    const lines = [];

    // 按类型分组
    const groups = {};
    for (const item of items) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    }

    // 类型优先级
    const typeOrder = ['goal', 'constraint', 'evidence', 'memory', 'context'];
    for (const type of typeOrder) {
      if (!groups[type]) continue;
      const groupItems = groups[type];
      const header = { goal: '🎯 目标', constraint: '⚠️ 约束', evidence: '📊 证据', memory: '💾 记忆', context: '📝 上下文' }[type] || type;
      lines.push(`[${header}]`);
      for (const item of groupItems) {
        const truncated = item.content.length > 150 ? item.content.slice(0, 150) + '...' : item.content;
        lines.push(`  • ${truncated}`);
      }
    }

    const result = lines.join('\n');
    if (result.length > maxTokens) {
      return result.slice(0, maxTokens) + '\n...[truncated]';
    }
    return result || '(empty context)';
  }

  // ==========================================================================
  // 衰减与压缩
  // ==========================================================================

  /**
   * 衰减所有注意力权重（每轮对话调用）
   */
  decay() {
    for (const item of this._items) {
      // 衰减
      item.attention *= (1 - this.decayRate);
      // 如果最近被刷新，衰减少一些
      const refreshBonus = item.refreshCount > 0 ? 0.05 : 0;
      item.attention = Math.max(0, item.attention - this.decayRate + refreshBonus);
    }
    // 移除低注意力项
    this._items = this._items.filter(item => item.attention >= this.attentionThreshold);
    return this;
  }

  /**
   * 压缩：将多个低优先级上下文项合并为摘要
   * @param {number} [threshold=0.3] - 低于此注意力的项被压缩
   * @returns {object} 压缩结果
   */
  compress(threshold = 0.3) {
    const toCompress = this._items.filter(item => item.attention < threshold && item.type === 'context');
    if (toCompress.length < 3) {
      return { compressed: 0, summary: null };
    }

    const summary = toCompress.map(item => item.content).join('；');
    const compressedIds = toCompress.map(item => item.id);

    // 移除被压缩的项，加入摘要
    this._items = this._items.filter(item => !compressedIds.includes(item.id));
    this.attend(`[摘要] ${summary}`, 'memory', 0.5);

    return {
      compressed: compressedIds.length,
      summary: summary.slice(0, 200),
    };
  }

  // ==========================================================================
  // 统计
  // ==========================================================================

  getStats() {
    const active = this._items.filter(item => item.attention >= this.attentionThreshold);
    const byType = {};
    for (const item of this._items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }
    return {
      totalItems: this._items.length,
      activeItems: active.length,
      turnCount: this._turnCount,
      currentTask: this._task,
      byType,
      avgAttention: this._items.length > 0
        ? Math.round(this._items.reduce((s, i) => s + i.attention, 0) / this._items.length * 100) / 100
        : 0,
    };
  }

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /**
   * 计算内容与当前任务的相关性
   */
  _computeRelevance(content, manualScore) {
    if (manualScore !== undefined) return Math.max(0, Math.min(1, manualScore));
    if (!this._task) return 0.5; // 无任务时默认中等相关性

    const taskWords = this._task.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const contentLower = String(content).toLowerCase();

    let matchCount = 0;
    for (const word of taskWords) {
      if (contentLower.includes(word)) matchCount++;
    }

    if (taskWords.length === 0) return 0.5;
    return Math.min(1, matchCount / taskWords.length + 0.3);
  }

  /**
   * 任务变更时刷新所有注意力
   */
  _refreshAttention() {
    for (const item of this._items) {
      item.attention = this._computeRelevance(item.content);
      item.lastRefreshed = Date.now();
      item.refreshCount = (item.refreshCount || 0) + 1;
    }
  }

  /**
   * 强制不超过最大项数
   */
  _enforceLimit() {
    if (this._items.length > this.maxAttention * 2) {
      this._items.sort((a, b) => b.attention - a.attention);
      this._items = this._items.slice(0, this.maxAttention * 2);
    }
  }
}

module.exports = { FocusOfAttention };
