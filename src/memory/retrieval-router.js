/**
 * Retrieval Router v1.0 — 引擎统一检索路由层
 *
 * 灵感来源：《RAG知识库发展到什么程度了？》工程落地经验
 * 核心架构：主解析器 → 兜底链路 → 离线校验（三段铁律）
 * 
 * 解决的问题：
 * 1. 多个检索系统（meaningful-memory / lesson-retrieval / hybrid-search / 
 *    knowledge-graph）各自独立，没有统一入口
 * 2. 没有管道式质量门——不知道哪个检索结果可信
 * 3. 没有多通道并行召回 + 重排策略
 *
 * 架构：
 *   query → classify() → route() → [并行召回] → rerank() → output
 *
 * 三通道：
 *   - 记忆通道（meaningful-memory）：身份、教训、经验
 *   - 语义通道（hybrid-search + BM25）：知识检索
 *   - 图谱通道（knowledge-graph）：关系推理
 *
 * 质量门：
 *   - 置信度评分（0-1）
 *   - 低置信度触发兜底（fallback）
 *   - 路由决策可追踪（trace）
 */

const path = require('path');

// ─── 路由配置 ────────────────────────────────────────────────────────────────

const ROUTER_CONFIG = {
  // 各通道默认权重（总=1.0）
  weights: {
    memory: 0.4,    // 记忆通道：教训、身份
    semantic: 0.4,  // 语义通道：知识、文档
    graph: 0.2,     // 图谱通道：关系推理
  },
  // 置信度阈值
  confidence: {
    high: 0.7,      // ≥0.7：直接使用
    medium: 0.4,    // ≥0.4：需要兜底补充
    low: 0.0,       // <0.4：全量兜底
  },
  // 重排参数
  rerank: {
    topK: 5,        // 最终输出数量
    diversity: 0.3, // 多样性惩罚因子
    recency: 0.2,   // 时间衰减权重
  },
};

// ─── 查询分类器 ──────────────────────────────────────────────────────────────

/**
 * 根据查询内容判断应该走哪个通道
 * @param {string} query
 * @returns {{ channels: string[], type: string, topic: string|null }}
 */
function classifyQuery(query) {
  if (!query || typeof query !== 'string') {
    return { channels: ['memory'], type: 'unknown', topic: null };
  }

  const q = query.toLowerCase().trim();

  // 身份/自我相关 → 记忆通道优先
  if (/^(我是谁|你是谁|引擎|身份|自我|意义|存在|目的|升级|核心)/.test(q)) {
    return { channels: ['memory', 'semantic'], type: 'identity', topic: 'self' };
  }

  // 教训/经验相关 → 记忆通道
  if (/(教训|经验|学会|上次|以前|犯过|记住|不要|应该)/.test(q)) {
    return { channels: ['memory', 'semantic'], type: 'lesson', topic: null };
  }

  // 关系推理相关 → 图谱通道
  if (/(关系|联系|影响|导致|连接|谁.*影响|与.*关系)/.test(q)) {
    return { channels: ['graph', 'semantic'], type: 'relation', topic: null };
  }

  // 知识查询 → 语义通道
  if (/(是什么|为什么|怎么|如何|定义|概念|原理|区别|比较|解释)/.test(q)) {
    return { channels: ['semantic', 'graph'], type: 'knowledge', topic: null };
  }

  // 默认：全通道并行
  return { channels: ['memory', 'semantic', 'graph'], type: 'general', topic: null };
}

// ─── 重排引擎 ────────────────────────────────────────────────────────────────

/**
 * 对多通道结果进行重排
 * @param {Array<{ channel: string, item: any, score: number }>} results
 * @param {object} options
 * @returns {Array<{ channel: string, item: any, score: number, rank: number }>}
 */
function rerank(results, options = {}) {
  if (!results || results.length === 0) return [];

  const topK = options.topK || ROUTER_CONFIG.rerank.topK;
  const diversity = options.diversity || ROUTER_CONFIG.rerank.diversity;
  const recencyWeight = options.recency || ROUTER_CONFIG.rerank.recency;

  // 1. 基础分数归一化
  const maxScore = Math.max(...results.map(r => r.score || 0));
  const normalized = results.map(r => ({
    ...r,
    score: maxScore > 0 ? (r.score || 0) / maxScore : 0,
  }));

  // 2. 时间衰减
  const now = Date.now();
  const withTime = normalized.map(r => {
    const age = r.item?.timestamp
      ? (now - new Date(r.item.timestamp).getTime()) / (24 * 60 * 60 * 1000)
      : 7; // 默认7天
    const recencyBoost = Math.max(0, 1 - (age / 30)); // 30天内线性衰减
    return {
      ...r,
      score: r.score * (1 - recencyWeight) + recencyBoost * recencyWeight,
    };
  });

  // 3. 排序 + 多样性惩罚
  withTime.sort((a, b) => b.score - a.score);
  const selected = [];
  const usedChannels = new Set();

  for (const item of withTime) {
    if (selected.length >= topK) break;

    // 多样性惩罚：同一通道最多贡献 topK/2 个结果
    const channelCount = selected.filter(s => s.channel === item.channel).length;
    const maxPerChannel = Math.ceil(topK / 2);
    if (channelCount >= maxPerChannel) {
      item.score *= (1 - diversity);
      // 如果惩罚后分数太低就跳过
      if (item.score < 0.2) continue;
    }

    selected.push({
      ...item,
      rank: selected.length + 1,
    });
  }

  return selected;
}

// ─── 质量门 ──────────────────────────────────────────────────────────────────

/**
 * 评估检索结果质量
 * @param {Array} results - 重排后的结果
 * @param {string} queryType - 查询类型
 * @returns {{ quality: 'high'|'medium'|'low', confidence: number, needsFallback: boolean }}
 */
function assessQuality(results, queryType) {
  if (!results || results.length === 0) {
    return { quality: 'low', confidence: 0, needsFallback: true };
  }

  // 平均分数
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;

  // 通道覆盖度
  const channels = new Set(results.map(r => r.channel));
  const coverage = channels.size;

  // 综合置信度
  const confidence = avgScore * 0.6 + Math.min(coverage / 3, 1) * 0.4;

  if (confidence >= ROUTER_CONFIG.confidence.high) {
    return { quality: 'high', confidence, needsFallback: false };
  } else if (confidence >= ROUTER_CONFIG.confidence.medium) {
    return { quality: 'medium', confidence, needsFallback: true };
  } else {
    return { quality: 'low', confidence, needsFallback: true };
  }
}

// ─── 路由追踪 ────────────────────────────────────────────────────────────────

class RetrievalTrace {
  constructor(query) {
    this.query = query;
    this.timestamp = new Date().toISOString();
    this.classification = null;
    this.channels = [];
    this.rawResults = [];
    this.reranked = [];
    this.quality = null;
  }

  recordClassification(cls) {
    this.classification = cls;
  }

  recordChannel(name, count, latency) {
    this.channels.push({ name, count, latency: `${latency}ms` });
  }

  recordResults(results) {
    this.rawResults = results.map(r => ({
      channel: r.channel,
      score: r.score,
      preview: (r.item?.content || r.item?.name || '').slice(0, 60),
    }));
  }

  recordReranked(selected) {
    this.reranked = selected.map(r => ({
      rank: r.rank,
      channel: r.channel,
      score: r.score,
      preview: (r.item?.content || r.item?.name || '').slice(0, 60),
    }));
  }

  recordQuality(q) {
    this.quality = q;
  }

  toJSON() {
    return {
      query: this.query,
      timestamp: this.timestamp,
      classification: this.classification,
      channels_used: this.channels,
      result_count: this.rawResults.length,
      selected_count: this.reranked.length,
      quality: this.quality,
    };
  }
}

// ─── 主路由引擎 ──────────────────────────────────────────────────────────────

class RetrievalRouter {
  constructor(options = {}) {
    this.config = { ...ROUTER_CONFIG, ...options };
    this._modules = {
      memory: null,
      semantic: null,
      graph: null,
      lesson: null,
    };
  }

  /**
   * 注入底层模块引用（由 heartflow.js 调用）
   */
  inject(modules) {
    if (modules.meaningfulMemory) this._modules.memory = modules.meaningfulMemory;
    if (modules.hybridSearch) this._modules.semantic = modules.hybridSearch;
    if (modules.knowledgeGraph) this._modules.graph = modules.knowledgeGraph;
    if (modules.lessonRetrieval) this._modules.lesson = modules.lessonRetrieval;
  }

  /**
   * 统一检索入口
   * @param {string} query - 查询
   * @param {object} options
   * @param {string[]} [options.channels] - 强制指定通道
   * @param {number} [options.topK] - 返回数量
   * @param {boolean} [options.trace] - 是否返回追踪信息
   * @returns {{ results: Array, trace?: object, quality: object }}
   */
  retrieve(query, options = {}) {
    const trace = options.trace !== false ? new RetrievalTrace(query) : null;

    // 1. 分类
    const classification = classifyQuery(query);
    if (trace) trace.recordClassification(classification);

    // 2. 确定通道
    const channels = options.channels || classification.channels;
    const allResults = [];

    // 3. 并行召回
    for (const channel of channels) {
      const startTime = Date.now();
      let channelResults = [];

      switch (channel) {
        case 'memory':
          channelResults = this._retrieveMemory(query);
          break;
        case 'semantic':
          channelResults = this._retrieveSemantic(query);
          break;
        case 'graph':
          channelResults = this._retrieveGraph(query);
          break;
      }

      const latency = Date.now() - startTime;
      if (trace) trace.recordChannel(channel, channelResults.length, latency);

      // 按通道权重调整分数
      const weight = this.config.weights[channel] || 0.33;
      channelResults = channelResults.map(r => ({
        channel,
        item: r,
        score: (r.score || 0.5) * weight,
      }));

      allResults.push(...channelResults);
    }

    if (trace) trace.recordResults(allResults);

    // 4. 重排
    const selected = rerank(allResults, { topK: options.topK || this.config.rerank.topK });
    if (trace) trace.recordReranked(selected);

    // 5. 质量评估
    const quality = assessQuality(selected, classification.type);
    if (trace) trace.recordQuality(quality);

    return {
      results: selected,
      trace: trace ? trace.toJSON() : null,
      quality,
      type: classification.type,
      needsFallback: quality.needsFallback,
    };
  }

  /**
   * 记忆通道检索
   */
  _retrieveMemory(query) {
    const memory = this._modules.memory;
    if (!memory || typeof memory.search !== 'function') return [];

    try {
      // 多通道搜索：keyword + semantic + narrative
      const results = [];
      
      // keyword
      if (typeof memory.searchByKeyword === 'function') {
        const kw = memory.searchByKeyword(query, 3);
        if (kw && kw.length) results.push(...kw.map(m => ({ ...m, score: 0.7 })));
      }

      // semantic
      if (typeof memory.searchBySemantic === 'function') {
        const sem = memory.searchBySemantic(query, 3);
        if (sem && sem.length) results.push(...sem.map(m => ({ ...m, score: 0.6 })));
      }

      // 教训检索
      if (this._modules.lesson && typeof this._modules.lesson.search === 'function') {
        const lessons = this._modules.lesson.search(query, 3);
        if (lessons && lessons.length) results.push(...lessons.map(m => ({ ...m, score: 0.5 })));
      }

      return results.slice(0, 5);
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[RetrievalRouter] memory channel error:', e.message);
      return [];
    }
  }

  /**
   * 语义通道检索
   */
  _retrieveSemantic(query) {
    const hybrid = this._modules.semantic;
    if (!hybrid) return [];

    try {
      if (typeof hybrid.search === 'function') {
        return hybrid.search(query, 5).map(r => ({
          ...r,
          score: r.score || 0.5,
        }));
      }
      return [];
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[RetrievalRouter] semantic channel error:', e.message);
      return [];
    }
  }

  /**
   * 图谱通道检索
   */
  _retrieveGraph(query) {
    const graph = this._modules.graph;
    if (!graph) return [];

    try {
      const results = [];

      // 节点搜索
      if (typeof graph.searchNodes === 'function') {
        const nodes = graph.searchNodes(query, 3);
        if (nodes && nodes.length) results.push(...nodes.map(n => ({
          ...n,
          score: n.importance || 0.5,
        })));
      }

      // 关系搜索
      if (typeof graph.searchEdges === 'function') {
        const edges = graph.searchEdges(query, 3);
        if (edges && edges.length) results.push(...edges.map(e => ({
          ...e,
          score: (e.strength || 0.5) * 0.8,
        })));
      }

      return results.slice(0, 5);
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[RetrievalRouter] graph channel error:', e.message);
      return [];
    }
  }
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

module.exports = {
  RetrievalRouter,
  classifyQuery,
  rerank,
  assessQuality,
  ROUTER_CONFIG,
};

// ─── P1: Goal-Oriented RAG 目标导向检索 ──────────────────────────────────────
// 基于 "Goal-Oriented Reasoning for RAG-based Memory" (arXiv:2605.12213)

/**
 * 从查询中提取子目标
 * @private
 */
function decomposeGoal(query) {
  if (!query || typeof query !== 'string') return [{ text: query, priority: 1 }];

  const goals = [];
  const lower = query.toLowerCase();

  // 检测复合查询（用分隔符连接的多个目标）
  const separators = /[，,；;。.！!？?\n]+/;
  const parts = query.split(separators).filter(s => s.trim().length > 2);

  if (parts.length > 1) {
    for (let i = 0; i < parts.length; i++) {
      goals.push({ text: parts[i].trim(), priority: 1 - i * 0.1 });
    }
  } else {
    // 单目标查询：检测意图类型分配优先级
    let priority = 0.5;
    if (/什么是|是什么|定义|概念|解释/.test(lower)) priority = 0.8;
    else if (/为什么|原因|原因/.test(lower)) priority = 0.7;
    else if (/如何|怎么|怎样|方法/.test(lower)) priority = 0.6;
    else if (/比较|区别|对比|差异/.test(lower)) priority = 0.65;

    goals.push({ text: query.trim(), priority });
  }

  return goals;
}

/**
 * 评估记忆条目对目标的实用性（而非简单相似度）
 * @private
 */
function assessUtility(memoryItem, goalText) {
  let utility = 0;

  // 1. 基础内容相关性（词重叠）
  const memText = (memoryItem.content || memoryItem.value || '').toLowerCase();
  const goalWords = goalText.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const memWords = new Set(memText.split(/\s+/).filter(w => w.length > 1));
  const overlap = goalWords.filter(w => memWords.has(w)).length;
  utility += Math.min(0.3, overlap / Math.max(1, goalWords.length) * 0.3);

  // 2. 新近度（越新越有用）
  const age = Date.now() - (memoryItem.createdAt || memoryItem.timestamp || Date.now());
  const ageHours = age / (3600 * 1000);
  utility += Math.max(0, 0.2 - ageHours * 0.001);

  // 3. 访问频率（越常被访问越可能有用）
  const accessCount = memoryItem.accessCount || 0;
  utility += Math.min(0.2, accessCount * 0.02);

  // 4. 层级奖励（CORE > LEARNED > EPHEMERAL）
  const tier = (memoryItem.tier || memoryItem.layer || '').toUpperCase();
  if (tier === 'CORE') utility += 0.3;
  else if (tier === 'LEARNED') utility += 0.2;
  else utility += 0.1;

  // 5. 元数据奖励
  if (memoryItem.metadata?.userPreference) utility += 0.1;
  if (memoryItem.metadata?.taskOutcome === 'success') utility += 0.1;

  return Math.min(1, utility);
}

/**
 * 目标导向检索：将子目标分配到最优检索通道
 * @param {Object} router - RetrievalRouter实例
 * @param {string} query - 原始查询
 * @param {object} options - 检索选项
 * @returns {Array} 按实用性排序的结果
 */
function goalOrientedRetrieve(router, query, options = {}) {
  const goals = decomposeGoal(query);
  const allResults = new Map(); // itemId → {item, maxUtility, goals}

  for (const goal of goals) {
    // 为目标选择最优通道
    const classification = classifyQuery(goal.text);
    const channels = options.channels || classification.channels;

    for (const channel of channels) {
      let channelResults = [];
      switch (channel) {
        case 'memory':
          channelResults = router._retrieveMemory(goal.text);
          break;
        case 'semantic':
          channelResults = router._retrieveSemantic(goal.text);
          break;
        case 'graph':
          channelResults = router._retrieveGraph(goal.text);
          break;
      }

      // 评估每条记忆对该目标的实用性
      for (const item of channelResults) {
        const utility = assessUtility(item, goal.text) * goal.priority;
        const id = item.id || item.key || JSON.stringify(item).slice(0, 50);

        if (allResults.has(id)) {
          const existing = allResults.get(id);
          if (utility > existing.maxUtility) {
            existing.maxUtility = utility;
            existing.goals.push(goal.text);
          }
        } else {
          allResults.set(id, { item, maxUtility: utility, goals: [goal.text] });
        }
      }
    }
  }

  // 按实用性排序，返回topK
  const topK = options.topK || 5;
  return [...allResults.values()]
    .sort((a, b) => b.maxUtility - a.maxUtility)
    .slice(0, topK)
    .map(entry => ({
      ...entry.item,
      utilityScore: entry.maxUtility,
      matchedGoals: entry.goals,
    }));
}

// Export goal-oriented functions
module.exports = {
  ...module.exports,
  decomposeGoal,
  assessUtility,
  goalOrientedRetrieve,
};
