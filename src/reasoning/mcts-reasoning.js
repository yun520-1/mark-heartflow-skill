/**
 * MCTSReasoning v1.0.0 — 蒙特卡洛树搜索推理引擎
 *
 * 灵感来源:
 * - LLaMA-Berry (2024) — MCTS + Self-Training for reasoning
 * - AlphaGo / AlphaZero — 树搜索 + 评估函数
 * - Process Reward Models (2024) — 中间步骤奖励
 *
 * 核心机制:
 * 1. 将推理表示为树结构
 * 2. 用 MCTS 探索推理路径
 * 3. 过程奖励模型评估中间步骤
 * 4. 自动选择最优推理路径
 *
 * 适用场景:
 * - 复杂推理任务 (数学、逻辑、规划)
 * - 多步骤决策
 * - 需要探索多个推理路径的场景
 */

const VERSION = '1.0.0';

class MCTSNode {
  constructor(state, parent = null, action = null) {
    this.state = state;  // 推理状态 {thought, step, depth, ...}
    this.parent = parent;
    this.action = action;  // 导致此状态的动作
    this.children = [];
    this.visits = 0;
    this.value = 0;  // 累计价值
    this.priority = 0;  // 先验优先级 (from LLM)
    this.isTerminal = false;
    this.reward = 0;  // 最终奖励
  }

  ucb1(exploration = 1.414) {
    if (this.visits === 0) return Infinity;
    const exploitation = this.value / this.visits;
    const explorationTerm = exploration * Math.sqrt(Math.log(this.parent.visits) / this.visits);
    return exploitation + explorationTerm;
  }

  bestChild(exploration = 1.414) {
    return this.children.reduce((best, child) => {
      const score = child.ucb1(exploration);
      return score > best.score ? { child, score } : best;
    }, { child: null, score: -Infinity }).child;
  }

  expand(children) {
    this.children = children.map(c => new MCTSNode(c.state, this, c.action));
  }
}

class MCTSReasoning {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxIterations: options.maxIterations || 50,  // 最大搜索迭代数
      maxDepth: options.maxDepth || 5,  // 推理最大深度
      explorationWeight: options.explorationWeight || 1.414,  // UCB1 探索权重
      temperature: options.temperature || 0.7,  // 推理多样性
      processRewardWeight: options.processRewardWeight || 0.3,  // 过程奖励权重
    };

    this.stats = {
      iterations: 0,
      nodesCreated: 0,
      maxDepthReached: 0,
    };
  }

  /**
   * 执行 MCTS 推理
   * @param {Object} problem - 推理问题 {input, context}
   * @param {Function} generateThoughts - 生成推理步骤的函数
   * @param {Function} evaluateThought - 评估推理步骤的函数
   * @returns {Object} 最优推理路径
   */
  async search(problem, generateThoughts, evaluateThought) {
    this.stats.iterations = 0;
    this.stats.nodesCreated = 0;

    // 初始化根节点
    const root = new MCTSNode({
      thought: problem.input,
      step: 0,
      depth: 0,
      context: problem.context || {},
    });

    try {
      // MCTS 主循环
      for (let i = 0; i < this.config.maxIterations; i++) {
        // Selection: 选择最有前途的路径
        let node = this._select(root);
        if (!node) { console.log('MCTS: _select returned null/undefined at iteration', i); break; }

        // Expansion: 如果不是终节点，扩展子节点
        if (!node.isTerminal && node.state.depth < this.config.maxDepth) {
          node = await this._expand(node, generateThoughts);
          if (!node) { console.log('MCTS: _expand returned null/undefined at iteration', i); break; }
        }

        // Simulation: 模拟评估
        const reward = this._simulate(node, evaluateThought);

        // Backpropagation: 回传奖励
        this._backpropagate(node, reward);

        this.stats.iterations++;
      }
    } catch (e) {
      console.error('MCTS search error:', e.message, 'at iteration', this.stats.iterations);
      console.error(e.stack);
    }

    // 选择最优路径
    const bestPath = this._extractBestPath(root);
    this.stats.maxDepthReached = bestPath.length;

    return {
      reasoning: bestPath,
      confidence: root.bestChild()?.value / (root.bestChild()?.visits || 1) || 0,
      iterations: this.stats.iterations,
      nodesExplored: this.stats.nodesCreated,
    };
  }

  /**
   * 选择阶段: 使用 UCB1 选择最有前途的节点
   * @private
   */
  _select(node) {
    while (node.children.length > 0 && !node.isTerminal) {
      node = node.bestChild(this.config.explorationWeight);
    }
    return node;
  }

  /**
   * 扩展阶段: 为节点生成子节点
   * @private
   */
  async _expand(node, generateThoughts) {
    try {
      const thoughts = await generateThoughts(node.state, this.config.temperature);
      const children = thoughts.map(t => ({
        state: {
          thought: t,
          step: node.state.step + 1,
          depth: node.state.depth + 1,
          context: { ...node.state.context, lastThought: t },
        },
        action: t,
      }));
      node.expand(children);
      this.stats.nodesCreated += children.length;

      // 返回第一个子节点 (如果没有子节点，返回原节点)
      return node.children[0] || node;
    } catch (e) {
      return node;
    }
  }

  /**
   * 模拟阶段: 评估当前状态的价值
   * @private
   */
  _simulate(node, evaluateThought) {
    // 过程奖励: 评估当前推理步骤的质量
    const processReward = evaluateThought(node.state) || 0;

    // 如果有子节点，递归评估
    if (node.children.length > 0) {
      const childRewards = node.children.map(c => this._simulate(c, evaluateThought));
      const maxChildReward = childRewards.length > 0 ? Math.max(...childRewards) : 0;
      // 综合过程奖励和子节点奖励
      return this.config.processRewardWeight * processReward + (1 - this.config.processRewardWeight) * maxChildReward;
    }

    return processReward;
  }

  /**
   * 回传阶段: 将奖励沿路径回传
   * @private
   */
  _backpropagate(node, reward) {
    let current = node;
    while (current) {
      current.visits++;
      current.value += reward;
      current = current.parent;
    }
  }

  /**
   * 提取最优推理路径
   * @private
   */
  _extractBestPath(root) {
    const path = [];
    let node = root;
    while (node.children.length > 0) {
      const best = node.bestChild(0);  // 纯利用，不探索
      if (!best) break;
      path.push(best.state.thought);
      node = best;
    }
    return path;
  }

  /**
   * 获取搜索统计
   */
  getStats() {
    return {
      ...this.stats,
      maxIterations: this.config.maxIterations,
      maxDepth: this.config.maxDepth,
    };
  }
}

module.exports = { MCTSReasoning, MCTSNode, VERSION };
