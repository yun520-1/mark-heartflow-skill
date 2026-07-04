/**
 * CausalInference — 因果推理引擎 v2.0.0
 *
 * 将记忆条目之间的因果关系显式建模，使检索不仅匹配语义，
 * 还能追踪"事件A导致了事件B"的逻辑链。
 *
 * 基于 ActMem (arXiv:2603.00026) 的因果-语义图方法：
 * - 从非结构化对话历史构建因果图
 * - 反事实验证 (counterfactual reasoning)
 * - 常识知识桥接
 *
 * 集成:
 *   hf.causalInference.buildGraph(memories)
 *   hf.causalInference.trace(memoryId, direction, maxDepth)
 *   hf.causalInference.counterfactual(memoryId, 'whatIf')
 *   hf.causalInference.getCauses(memoryId)
 *   hf.causalInference.getEffects(memoryId)
 *   hf.causalInference.searchByCausal(query)
 */

const VERSION = '2.0.0';

// 因果信号词（中英文）
const CAUSAL_SIGNALS = {
  en: ['because', 'therefore', 'thus', 'hence', 'caused', 'led to', 'resulted in',
       'due to', 'as a result', 'consequently', 'since', 'so that', 'triggered',
       'induced', 'provoked', 'produced', 'generated', 'followed by'],
  zh: ['因为', '所以', '因此', '导致', '引起', '使得', '造成', '从而',
       '于是', '致使', '缘于', '基于此', '由此', '进而', '触发', '诱发']
};

// 反事实信号词
const COUNTERFACTUAL_SIGNALS = {
  en: ['if', 'would have', 'could have', 'might have', 'suppose', 'imagine if',
       'what if', 'had it not', 'otherwise', 'alternatively'],
  zh: ['如果', '假如', '要是', '假设', '倘若', '若非', '否则', '取而代之']
};

class CausalInference {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxGraphDepth: options.maxGraphDepth || 5,
      minCausalConfidence: options.minCausalConfidence || 0.4,
      counterfactualMaxResults: options.counterfactualMaxResults || 5,
      decayRate: options.decayRate || 0.85,        // 每跳因果强度衰减
    };

    /** @type {Map<string, Object>} 因果图节点 */
    this.nodes = new Map();

    /** @type {Map<string, Array<{target, type, confidence}>>} 有向因果边 */
    this.edges = new Map(); // sourceId -> [{target, type, confidence}]

    /** @type {Map<string, number>} 节点激活值（用于传播激活） */
    this.activation = new Map();

    /** @type {Array} 因果推理日志 */
    this.inferenceLog = [];
  }

  // ─── 图构建 ─────────────────────────────────────────────────────────────

  /**
   * 从记忆条目数组构建因果图
   * @param {Array} memories - 记忆条目 [{id, content, timestamp, metadata}]
   * @returns {Object} 图统计
   */
  buildGraph(memories) {
    this.nodes.clear();
    this.edges.clear();

    // 注册所有节点
    for (const mem of memories) {
      this.nodes.set(mem.id, {
        id: mem.id,
        content: mem.content,
        timestamp: mem.timestamp || Date.now(),
        layer: mem.layer || 'episodic',
        metadata: mem.metadata || {},
        causalSignals: this._detectCausalSignals(mem.content),
      });
    }

    // 检测因果边
    let edgeCount = 0;
    for (const mem of memories) {
      const causes = this._extractCausalLinks(mem, memories);
      for (const cause of causes) {
        if (!this.edges.has(cause.sourceId)) {
          this.edges.set(cause.sourceId, []);
        }
        this.edges.get(cause.sourceId).push({
          target: cause.targetId,
          type: cause.type,
          confidence: cause.confidence,
        });
        edgeCount++;
      }
    }

    return {
      nodes: this.nodes.size,
      edges: edgeCount,
      avgDegree: edgeCount / Math.max(1, this.nodes.size),
    };
  }

  /**
   * 检测内容中的因果信号词
   * @private
   */
  _detectCausalSignals(text) {
    if (!text || typeof text !== 'string') return [];
    const lower = text.toLowerCase();
    const signals = [];

    for (const sig of CAUSAL_SIGNALS.en) {
      if (lower.includes(sig)) signals.push({ lang: 'en', signal: sig });
    }
    for (const sig of CAUSAL_SIGNALS.zh) {
      if (text.includes(sig)) signals.push({ lang: 'zh', signal: sig });
    }
    return signals;
  }

  /**
   * 从单个记忆条目提取因果链接
   * @private
   */
  _extractCausalLinks(sourceMem, allMemories) {
    const links = [];
    const sourceText = sourceMem.content || '';
    const sourceTime = sourceMem.timestamp || 0;

    // 1. 基于因果信号词的直接链接
    const signals = this._detectCausalSignals(sourceText);
    if (signals.length > 0) {
      // 找时间上最近的其他记忆作为因果对象
      const candidates = allMemories
        .filter(m => m.id !== sourceMem.id)
        .sort((a, b) => Math.abs((a.timestamp || 0) - sourceTime) - Math.abs((b.timestamp || 0) - sourceTime));

      if (candidates.length > 0) {
        const confidence = Math.min(0.9, 0.3 + signals.length * 0.15);
        links.push({
          sourceId: sourceMem.id,
          targetId: candidates[0].id,
          type: signals.some(s => s.lang === 'zh') ? '因果链-中文' : 'causal-chain',
          confidence,
        });
      }
    }

    // 2. 基于时序的推断因果（A发生在B之前，且内容相关）
    const earlierMemories = allMemories
      .filter(m => m.id !== sourceMem.id && (m.timestamp || 0) < sourceTime)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 3);

    for (const earlier of earlierMemories) {
      const similarity = this._contentSimilarity(sourceText, earlier.content || '');
      if (similarity > 0.3) {
        const timeDelta = (sourceTime - (earlier.timestamp || 0)) / 3600000; // hours
        const temporalConfidence = Math.max(0.1, 0.5 - timeDelta * 0.01) * similarity;
        if (temporalConfidence > this.config.minCausalConfidence) {
          links.push({
            sourceId: earlier.id,
            targetId: sourceMem.id,
            type: 'temporal-cause',
            confidence: Math.min(0.8, temporalConfidence),
          });
        }
      }
    }

    return links;
  }

  /**
   * 简易内容相似度（词重叠）
   * @private
   */
  _contentSimilarity(a, b) {
    if (!a || !b) return 0;
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    return intersection.length / Math.sqrt(wordsA.size * wordsB.size);
  }

  // ─── 因果追踪 ─────────────────────────────────────────────────────────────

  /**
   * 追踪记忆的因果链
   * @param {string} memoryId - 起始记忆ID
   * @param {string} direction - 'forward' (影响) 或 'backward' (原因)
   * @param {number} maxDepth - 最大深度
   * @returns {Array} 因果链
   */
  trace(memoryId, direction = 'forward', maxDepth = 5) {
    const chain = [];
    const visited = new Set();
    const queue = [{ id: memoryId, depth: 0, confidence: 1.0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id) || current.depth > maxDepth) continue;
      visited.add(current.id);

      const node = this.nodes.get(current.id);
      if (node) {
        chain.push({
          id: current.id,
          content: node.content?.slice(0, 100),
          depth: current.depth,
          confidence: current.confidence,
          layer: node.layer,
        });
      }

      // 获取邻居边
      const neighbors = direction === 'forward'
        ? (this.edges.get(current.id) || [])
        : this._getReverseEdges(current.id);

      for (const edge of neighbors) {
        const nextId = direction === 'forward' ? edge.target : edge.target;
        if (!visited.has(nextId)) {
          queue.push({
            id: nextId,
            depth: current.depth + 1,
            confidence: current.confidence * edge.confidence * this.config.decayRate,
          });
        }
      }
    }

    return chain;
  }

  /**
   * 获取反向边（谁指向了这个节点）
   * @private
   */
  _getReverseEdges(nodeId) {
    const reverse = [];
    for (const [sourceId, edges] of this.edges) {
      for (const edge of edges) {
        if (edge.target === nodeId) {
          reverse.push({ ...edge, target: sourceId });
        }
      }
    }
    return reverse;
  }

  /**
   * 获取导致某记忆的原因
   */
  getCauses(memoryId) {
    return this.trace(memoryId, 'backward', this.config.maxGraphDepth);
  }

  /**
   * 获取某记忆导致的结果
   */
  getEffects(memoryId) {
    return this.trace(memoryId, 'forward', this.config.maxGraphDepth);
  }

  // ─── 反事实推理 ───────────────────────────────────────────────────────────

  /**
   * 反事实验证：如果某记忆没有发生会怎样
   * @param {string} memoryId - 目标记忆ID
   * @param {string} counterfactualQuery - 反事实查询
   * @returns {Object} 反事实分析结果
   */
  counterfactual(memoryId, counterfactualQuery) {
    const node = this.nodes.get(memoryId);
    if (!node) return { error: 'Memory not found in causal graph' };

    const causes = this.getCauses(memoryId);
    const effects = this.getEffects(memoryId);

    // 移除该节点后，哪些因果链断裂
    const brokenCauses = causes.filter(c => c.depth === 1);
    const brokenEffects = effects.filter(e => e.depth === 1);

    return {
      memoryId,
      query: counterfactualQuery,
      removedNode: { id: memoryId, content: node.content?.slice(0, 100) },
      brokenCauses: brokenCauses.map(c => ({
        id: c.id,
        confidence: c.confidence,
        wouldNotHaveOccurred: c.content,
      })),
      brokenEffects: brokenEffects.map(e => ({
        id: e.id,
        confidence: e.confidence,
        wouldNotHaveOccurred: e.content,
      })),
      totalBrokenLinks: brokenCauses.length + brokenEffects.length,
      impactScore: (brokenCauses.length + brokenEffects.length) / Math.max(1, this.nodes.size),
    };
  }

  // ─── 因果搜索 ─────────────────────────────────────────────────────────────

  /**
   * 基于因果关联的记忆搜索
   * @param {string} query - 查询文本
   * @param {number} topK - 返回数量
   * @returns {Array} 因果相关的记忆
   */
  searchByCausal(query, topK = 10) {
    const querySignals = this._detectCausalSignals(query);
    const results = [];

    for (const [id, node] of this.nodes) {
      const nodeSignals = node.causalSignals || [];
      // 计算因果相关度
      const signalOverlap = querySignals.filter(qs =>
        nodeSignals.some(ns => ns.signal === qs.signal)
      ).length;

      if (signalOverlap > 0) {
        results.push({
          id,
          content: node.content?.slice(0, 200),
          relevance: Math.min(1, 0.3 + signalOverlap * 0.3),
          causeChain: this.getCauses(id).slice(0, 3),
          signalMatch: signalOverlap,
        });
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topK);
  }

  // ─── 传播激活 ─────────────────────────────────────────────────────────────

  /**
   * 从记忆ID启动传播激活搜索
   * @param {string} seedId - 种子记忆ID
   * @param {number} budget - 激活预算
   * @returns {Array} 激活的记忆
   */
  spreadingActivation(seedId, budget = 100) {
    this.activation.clear();
    const results = [];
    let remainingBudget = budget;

    // 种子节点获得最大激活
    this.activation.set(seedId, 1.0);
    const queue = [{ id: seedId, activation: 1.0 }];

    while (queue.length > 0 && remainingBudget > 0) {
      const current = queue.shift();
      const currentAct = this.activation.get(current.id) || 0;

      if (currentAct < 0.01) continue;

      const node = this.nodes.get(current.id);
      if (node && !results.find(r => r.id === current.id)) {
        results.push({
          id: current.id,
          content: node.content?.slice(0, 150),
          activation: currentAct,
          layer: node.layer,
        });
      }

      // 扩散到邻居
      const neighbors = this.edges.get(current.id) || [];
      for (const edge of neighbors) {
        if (remainingBudget <= 0) break;
        remainingBudget--;

        const newAct = currentAct * edge.confidence * this.config.decayRate;
        const existing = this.activation.get(edge.target) || 0;

        if (newAct > existing && newAct > 0.01) {
          this.activation.set(edge.target, newAct);
          queue.push({ id: edge.target, activation: newAct });
        }
      }
    }

    return results.sort((a, b) => b.activation - a.activation);
  }

  // ─── 统计与工具 ──────────────────────────────────────────────────────────

  getStats() {
    let totalEdges = 0;
    for (const edges of this.edges.values()) totalEdges += edges.length;

    return {
      version: this.version,
      nodes: this.nodes.size,
      edges: totalEdges,
      avgDegree: totalEdges / Math.max(1, this.nodes.size),
      inferencesLogged: this.inferenceLog.length,
    };
  }

  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.activation.clear();
  }
}

module.exports = { CausalInference };
