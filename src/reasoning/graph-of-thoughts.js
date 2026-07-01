/**
 * Graph of Thoughts (GoT) Engine - 图思维引擎
 * 基于论文: "Graph of Thoughts: Reasoning with Large Language Models" (394 citations)
 * 
 * 核心扩展: 从ToT(树思维)的树结构扩展为图结构
 * - 分支(Branching): 多条推理路径并行探索
 * - 回溯(Backtracking): 支持返回之前状态探索替代路径
 * - 合并(Merging): 多个推理路径可汇聚融合
 * 
 * 支持复杂问题的多步推理探索与最优路径选择
 */

class ThoughtNode {
  /**
   * 思维节点 - 表示推理图中的一个思维步骤
   * @param {Object} config - 节点配置
   * @param {string} config.id - 唯一标识符
   * @param {string} config.content - 思维内容
   * @param {number} config.depth - 深度层次
   * @param {string} config.type - 节点类型: 'root'|'thought'|'merge'|'branch'|'final'
   */
  constructor({ id, content, depth, type = 'thought', parentId = null }) {
    this.id = id;
    this.content = content;
    this.depth = depth;
    this.type = type;
    this.parentId = parentId;
    this.children = [];         // 子节点ID列表
    this.parents = [];          // 父节点ID列表 (支持多父节点)
    this.score = 0;            // 思维评分 [0-10]
    this.confidence = 1.0;     // 置信度 [0-1]
    this.status = 'pending';    // 状态: pending|active|completed|pruned
    this.metadata = {};         // 元数据
    this.createdAt = Date.now();
    this.completedAt = null;
  }

  /**
   * 添加子节点
   * @param {string} childId - 子节点ID
   */
  addChild(childId) {
    if (!this.children.includes(childId)) {
      this.children.push(childId);
    }
  }

  /**
   * 添加父节点 (支持多父节点用于合并)
   * @param {string} parentId - 父节点ID
   */
  addParent(parentId) {
    if (!this.parents.includes(parentId)) {
      this.parents.push(parentId);
    }
  }

  /**
   * 标记节点完成
   * @param {number} score - 最终评分
   */
  complete(score) {
    this.status = 'completed';
    this.score = score;
    this.completedAt = Date.now();
  }

  /**
   * 剪枝节点及其子树
   */
  prune() {
    this.status = 'pruned';
  }

  /**
   * 获取节点信息摘要
   * @returns {Object} 节点摘要
   */
  toSummary() {
    return {
      id: this.id,
      type: this.type,
      depth: this.depth,
      score: this.score,
      confidence: this.confidence,
      status: this.status,
      numChildren: this.children.length,
      numParents: this.parents.length
    };
  }
}

class GoTEngine {
  /**
   * Graph of Thoughts 推理引擎
   * 
   * @param {Object} config - 引擎配置
   * @param {string} config.problem - 问题描述
   * @param {number} config.maxDepth - 最大探索深度 (默认: 10)
   * @param {number} config.branchFactor - 分支因子 (默认: 3)
   * @param {number} config.mergeThreshold - 合并阈值 (默认: 0.7)
   * @param {Function} config.thoughtGenerator - 思维生成器函数
   * @param {Function} config.scorer - 评分器函数
   * @param {Function} config.merger - 合并器函数 (可选)
   * @param {Function} config.validator - 验证器函数 (可选)
   */
  constructor(config = {}) {
    this.problem = config.problem || '';
    this.maxDepth = config.maxDepth || 10;
    this.branchFactor = config.branchFactor || 3;
    this.mergeThreshold = config.mergeThreshold || 0.7;
    
    // 核心函数
    this.thoughtGenerator = config.thoughtGenerator || this.defaultThoughtGenerator.bind(this);
    this.scorer = config.scorer || this.defaultScorer.bind(this);
    this.merger = config.merger || this.defaultMerger.bind(this);
    this.validator = config.validator || (() => ({ valid: true }));
    
    // 推理图存储
    this.nodes = new Map();
    this.rootId = null;
    this.bestPath = [];
    this.bestScore = -Infinity;
    
    // 统计信息
    this.stats = {
      totalNodes: 0,
      exploredNodes: 0,
      prunedNodes: 0,
      mergedNodes: 0,
      totalBranches: 0,
      backtracks: 0,
      startTime: null,
      endTime: null
    };
    
    // 探索控制
    this.activeNodes = new Set();
    this.completedPaths = [];
  }

  /**
   * 默认思维生成器 - 在子类中重写
   * @param {ThoughtNode} node - 当前节点
   * @param {number} branchIndex - 分支索引
   * @returns {Promise<string[]>} 生成的下一步思维列表
   */
  async defaultThoughtGenerator(node, branchIndex) {
    // 模拟生成多个可能的思维方向
    const baseContent = node.content;
    return [
      `深化思考: ${baseContent} - 路径A`,
      `重新审视: ${baseContent} - 路径B`,
      `创新探索: ${baseContent} - 路径C`
    ];
  }

  /**
   * 默认评分器
   * @param {string} thought - 思维内容
   * @returns {Promise<number>} 评分 [0-10]
   */
  async defaultScorer(thought) {
    // 基于关键词的简单评分
    const positive = ['正确', '有效', '最优', '合理', '准确', '验证'];
    const negative = ['错误', '失败', '不可行', '矛盾', '模糊'];
    
    let score = 5.0;
    positive.forEach(p => {
      if (thought.includes(p)) score += 0.5;
    });
    negative.forEach(n => {
      if (thought.includes(n)) score -= 0.5;
    });
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * 默认合并器 - 合并多个思维路径
   * @param {ThoughtNode[]} nodes - 要合并的节点列表
   * @returns {Promise<ThoughtNode>} 合并后的节点
   */
  async defaultMerger(nodes) {
    if (nodes.length === 0) return null;
    if (nodes.length === 1) return nodes[0];
    
    // 计算加权平均分
    const totalConfidence = nodes.reduce((sum, n) => sum + n.confidence, 0);
    const weightedScore = nodes.reduce((sum, n) => sum + n.score * n.confidence, 0) / totalConfidence;
    
    // 创建合并节点
    const mergedContent = nodes.map(n => n.content).join(' + ');
    const mergedNode = new ThoughtNode({
      id: `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: mergedContent,
      depth: Math.max(...nodes.map(n => n.depth)) + 1,
      type: 'merge',
      parentId: nodes[0].id
    });
    
    // 设置合并后的评分
    mergedNode.score = weightedScore;
    mergedNode.confidence = Math.min(1.0, totalConfidence / nodes.length);
    
    // 链接所有父节点
    nodes.forEach(n => {
      n.addChild(mergedNode.id);
      mergedNode.addParent(n.id);
    });
    
    return mergedNode;
  }

  /**
   * 初始化推理图 - 创建根节点
   * @param {string} initialThought - 初始思维
   * @returns {ThoughtNode} 根节点
   */
  initialize(initialThought) {
    const rootNode = new ThoughtNode({
      id: `root_${Date.now()}`,
      content: initialThought || this.problem,
      depth: 0,
      type: 'root'
    });
    
    this.nodes.set(rootNode.id, rootNode);
    this.rootId = rootNode.id;
    this.activeNodes.add(rootNode.id);
    this.stats.totalNodes = 1;
    this.stats.startTime = Date.now();
    
    return rootNode;
  }

  /**
   * 生成唯一节点ID
   * @returns {string} 唯一ID
   */
  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 探索 - 核心推理探索方法
   * 
   * 完整的多步推理探索流程:
   * 1. 从初始节点开始
   * 2. 逐步生成思维分支
   * 3. 评分和评估每个分支
   * 4. 支持回溯和路径合并
   * 5. 返回最优解决路径
   * 
   * @param {Object} options - 探索选项
   * @param {number} options.maxIterations - 最大迭代次数
   * @param {number} options.maxNodes - 最大节点数
   * @param {boolean} options.enableMerge - 是否启用路径合并
   * @param {boolean} options.enableBacktrack - 是否启用回溯
   * @param {number} options.scoreThreshold - 评分阈值
   * @returns {Promise<Object>} 探索结果
   */
  async explore(options = {}) {
    const {
      maxIterations = 100,
      maxNodes = 500,
      enableMerge = true,
      enableBacktrack = true,
      scoreThreshold = 3.0
    } = options;

    // 确保已初始化
    if (!this.rootId) {
      this.initialize(this.problem);
    }

    let iteration = 0;
    const explorationQueue = [this.rootId];

    // 广度优先探索 + 最佳优先搜索混合
    while (explorationQueue.length > 0 && iteration < maxIterations) {
      iteration++;
      
      // 获取当前要探索的节点
      const currentNodeId = this.selectNextNode(explorationQueue, enableBacktrack);
      if (!currentNodeId) break;
      
      const currentNode = this.nodes.get(currentNodeId);
      if (!currentNode || currentNode.status === 'completed') continue;

      // 检查是否达到最大深度
      if (currentNode.depth >= this.maxDepth) {
        currentNode.complete(currentNode.score);
        this.stats.exploredNodes++;
        continue;
      }

      // 标记为活跃
      currentNode.status = 'active';

      // 生成候选思维
      const candidates = await this.generateCandidates(currentNode);
      
      // 评估和过滤候选
      const validCandidates = await this.evaluateCandidates(candidates, currentNode, scoreThreshold);

      if (validCandidates.length === 0) {
        // 无有效候选，尝试回溯
        if (enableBacktrack && currentNode.parents.length > 0) {
          this.stats.backtracks++;
          explorationQueue.push(...currentNode.parents);
        }
        currentNode.complete(currentNode.score || 5.0);
        continue;
      }

      // 创建分支节点
      for (let i = 0; i < validCandidates.length; i++) {
        const candidate = validCandidates[i];
        
        if (this.nodes.size >= maxNodes) break;
        
        const newNode = await this.createBranchNode(currentNode, candidate, i);
        
        // 检查是否应该合并
        if (enableMerge) {
          const mergeCandidate = await this.findMergeCandidate(newNode);
          if (mergeCandidate) {
            const merged = await this.merger([mergeCandidate, newNode]);
            if (merged) {
              this.nodes.set(merged.id, merged);
              this.stats.mergedNodes++;
              explorationQueue.push(merged.id);
              continue;
            }
          }
        }
        
        this.nodes.set(newNode.id, newNode);
        explorationQueue.push(newNode.id);
        this.stats.totalNodes++;
      }

      // 完成当前节点
      currentNode.complete(currentNode.score);
      this.stats.exploredNodes++;

      // 检查是否是终止节点（得分足够高）
      if (currentNode.score >= 9.0 && currentNode.type === 'thought') {
        currentNode.type = 'final';
      }
    }

    // 后处理：找到最优路径
    this.findBestPath();
    
    this.stats.endTime = Date.now();
    
    return this.getResult();
  }

  /**
   * 选择下一个要探索的节点
   * @param {string[]} queue - 探索队列
   * @param {boolean} enableBacktrack - 是否启用回溯
   * @returns {string|null} 节点ID
   */
  selectNextNode(queue, enableBacktrack) {
    if (queue.length === 0) return null;
    
    // 最佳优先搜索 - 选择得分最高的待处理节点
    let bestNodeId = null;
    let bestScore = -Infinity;
    
    for (let i = 0; i < queue.length; i++) {
      const nodeId = queue[i];
      const node = this.nodes.get(nodeId);
      if (node && node.status === 'pending') {
        const priority = node.score * node.confidence;
        if (priority > bestScore) {
          bestScore = priority;
          bestNodeId = nodeId;
        }
      }
    }
    
    if (bestNodeId) {
      const idx = queue.indexOf(bestNodeId);
      if (idx > -1) queue.splice(idx, 1);
      return bestNodeId;
    }
    
    // 如果没有待处理节点，尝试回溯
    if (enableBacktrack) {
      for (const [id, node] of this.nodes) {
        if (node.status === 'completed' && node.children.length === 0) {
          // 叶子节点，尝试其父节点
          if (node.parents.length > 0) {
            this.stats.backtracks++;
            return node.parents[0];
          }
        }
      }
    }
    
    return queue.shift() || null;
  }

  /**
   * 生成候选思维
   * @param {ThoughtNode} node - 当前节点
   * @returns {Promise<string[]>} 候选思维列表
   */
  async generateCandidates(node) {
    const candidates = [];
    const numBranches = Math.min(this.branchFactor, 3);
    
    for (let i = 0; i < numBranches; i++) {
      const thoughts = await this.thoughtGenerator(node, i);
      candidates.push(...thoughts.slice(0, 2));
    }
    
    return candidates.slice(0, this.branchFactor);
  }

  /**
   * 评估候选思维
   * @param {string[]} candidates - 候选列表
   * @param {ThoughtNode} currentNode - 当前节点
   * @param {number} threshold - 阈值
   * @returns {Promise<Array>} 有效候选及评分
   */
  async evaluateCandidates(candidates, currentNode, threshold) {
    const results = [];
    
    for (const content of candidates) {
      const validation = await this.validator(content, currentNode);
      if (!validation.valid) continue;
      
      const score = await this.scorer(content);
      const confidence = validation.confidence || 0.8;
      
      if (score >= threshold) {
        results.push({
          content,
          score,
          confidence,
          validation
        });
        this.stats.totalBranches++;
      }
    }
    
    // 按评分排序
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }

  /**
   * 创建分支节点
   * @param {ThoughtNode} parent - 父节点
   * @param {Object} candidate - 候选思维
   * @param {number} index - 分支索引
   * @returns {ThoughtNode} 新节点
   */
  async createBranchNode(parent, candidate, index) {
    const node = new ThoughtNode({
      id: this.generateNodeId(),
      content: candidate.content,
      depth: parent.depth + 1,
      type: 'thought',
      parentId: parent.id
    });
    
    node.score = candidate.score;
    node.confidence = candidate.confidence;
    node.metadata = {
      branchIndex: index,
      parentScore: parent.score,
      validation: candidate.validation
    };
    
    parent.addChild(node.id);
    node.addParent(parent.id);
    
    return node;
  }

  /**
   * 查找可合并的节点
   * @param {ThoughtNode} node - 当前节点
   * @returns {Promise<ThoughtNode|null>} 可合并的节点
   */
  async findMergeCandidate(node) {
    for (const [id, other] of this.nodes) {
      if (id === node.id) continue;
      if (other.depth !== node.depth) continue;
      if (other.status === 'pruned') continue;
      
      // 计算相似度
      const similarity = this.calculateSimilarity(node.content, other.content);
      
      if (similarity >= this.mergeThreshold) {
        return other;
      }
    }
    return null;
  }

  /**
   * 计算两个内容的相似度
   * @param {string} a - 内容A
   * @param {string} b - 内容B
   * @returns {number} 相似度 [0-1]
   */
  calculateSimilarity(a, b) {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;
    
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }

  /**
   * 找到最优路径
   */
  findBestPath() {
    let bestNode = null;
    
    for (const [id, node] of this.nodes) {
      if (node.status === 'completed' || node.status === 'active') {
        const effectiveScore = node.score * node.confidence;
        if (effectiveScore > this.bestScore) {
          this.bestScore = effectiveScore;
          bestNode = node;
        }
      }
    }
    
    if (bestNode) {
      this.bestPath = this.reconstructPath(bestNode);
    }
  }

  /**
   * 重建从根到节点的路径
   * @param {ThoughtNode} node - 目标节点
   * @returns {ThoughtNode[]} 路径节点列表
   */
  reconstructPath(node) {
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift(current);
      // 优先从父节点链追溯
      if (current.parentId) {
        current = this.nodes.get(current.parentId);
      } else if (current.parents.length > 0) {
        current = this.nodes.get(current.parents[0]);
      } else {
        break;
      }
    }
    
    return path;
  }

  /**
   * 获取推理结果
   * @returns {Object} 完整结果
   */
  getResult() {
    const duration = this.stats.endTime 
      ? this.stats.endTime - this.stats.startTime 
      : Date.now() - this.stats.startTime;

    return {
      success: this.bestPath.length > 0,
      problem: this.problem,
      bestPath: this.bestPath.map(n => ({
        id: n.id,
        content: n.content,
        type: n.type,
        depth: n.depth,
        score: n.score,
        confidence: n.confidence
      })),
      bestScore: this.bestScore,
      totalNodes: this.stats.totalNodes,
      exploredNodes: this.stats.exploredNodes,
      prunedNodes: this.stats.prunedNodes,
      mergedNodes: this.stats.mergedNodes,
      totalBranches: this.stats.totalBranches,
      backtracks: this.stats.backtracks,
      duration: `${duration}ms`,
      graph: this.exportGraph()
    };
  }

  /**
   * 导出推理图结构
   * @returns {Object} 图数据
   */
  exportGraph() {
    const nodeData = [];
    const edges = [];
    
    for (const [id, node] of this.nodes) {
      nodeData.push({
        id: node.id,
        label: node.content.substring(0, 50) + (node.content.length > 50 ? '...' : ''),
        type: node.type,
        score: node.score,
        status: node.status
      });
      
      for (const childId of node.children) {
        edges.push({
          from: id,
          to: childId
        });
      }
      
      for (const parentId of node.parents) {
        edges.push({
          from: parentId,
          to: id
        });
      }
    }
    
    return { nodes: nodeData, edges };
  }

  /**
   * 可视化推理图 (文本格式)
   * @returns {string} 文本树状图
   */
  visualize() {
    if (!this.rootId) return '未初始化推理图';
    
    const lines = [];
    const root = this.nodes.get(this.rootId);
    
    const printNode = (node, prefix = '', isLast = true) => {
      const connector = isLast ? '└── ' : '├── ';
      const scoreStr = `[${node.score.toFixed(2)}]`;
      const typeStr = `<${node.type}>`;
      const content = node.content.substring(0, 60);
      
      lines.push(`${prefix}${connector}${typeStr} ${scoreStr} ${content}`);
      
      const children = node.children
        .map(id => this.nodes.get(id))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      
      children.forEach((child, index) => {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        printNode(child, newPrefix, index === children.length - 1);
      });
    };
    
    lines.push(`【Graph of Thoughts 推理图】问题: ${this.problem}`);
    lines.push('='.repeat(80));
    printNode(root);
    lines.push('='.repeat(80));
    lines.push(`最优路径得分: ${this.bestScore.toFixed(2)}`);
    lines.push(`总节点数: ${this.stats.totalNodes}, 已探索: ${this.stats.exploredNodes}, 合并: ${this.stats.mergedNodes}`);
    
    return lines.join('\n');
  }

  /**
   * 重置引擎状态
   */
  reset() {
    this.nodes.clear();
    this.rootId = null;
    this.bestPath = [];
    this.bestScore = -Infinity;
    this.activeNodes.clear();
    this.completedPaths = [];
    this.stats = {
      totalNodes: 0,
      exploredNodes: 0,
      prunedNodes: 0,
      mergedNodes: 0,
      totalBranches: 0,
      backtracks: 0,
      startTime: null,
      endTime: null
    };
  }
}

/**
 * GoT推理器 - 简化使用接口
 * 
 * @param {string} problem - 问题描述
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 推理结果
 */
async function reasonWithGoT(problem, options = {}) {
  const engine = new GoTEngine({
    problem,
    maxDepth: options.maxDepth || 8,
    branchFactor: options.branchFactor || 3,
    
    thoughtGenerator: options.thoughtGenerator,
    scorer: options.scorer,
    merger: options.merger,
    validator: options.validator
  });
  
  return await engine.explore(options);
}

// 导出模块
module.exports = {
  GoTEngine,
  ThoughtNode,
  reasonWithGoT
};
