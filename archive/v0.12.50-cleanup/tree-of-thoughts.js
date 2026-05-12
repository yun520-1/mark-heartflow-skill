/**
 * HeartFlow Tree-of-Thoughts v11.12.0
 * 
 * 基于 GitHub 3.5k+ 星项目: yiyangiu/Reflexion, kyegomez/tree-of-thoughts
 * 
 * 核心概念（来自ToT论文）:
 * - 状态空间搜索：每个推理步骤是图中的一个节点
 * - BFS探索：广度优先，同一层探索所有可能
 * - DFS探索：深度优先，先走到底再回溯
 * - 评估函数：给每个状态打分，决定剪枝还是继续
 * 
 * 与现有 self-boundary.js 的 multiPathVerification 整合
 * multiPathVerification 是"事后验证"，ToT是"事前探索"
 */

class TreeOfThoughts {
  constructor(config = {}) {
    this.maxDepth = config.maxDepth || 5;
    this.maxBranches = config.maxBranches || 3;
    this.enableBFS = config.enableBFS !== false;
    this.enableDFS = config.enableDFS !== false;
    this.pruneThreshold = config.pruneThreshold || 0.3;
    this.timeout = config.timeout || 30000; // 30秒超时
    
    this.exploredStates = new Map();  // 状态缓存
    this.tree = null;                  // 树结构
    this.stats = { expansions: 0, prunes: 0, totalNodes: 0 };
  }

  /**
   * 探索决策树
   * @param {string} problem - 问题描述
   * @param {Function} generateFn - 生成下一层节点的函数 (state) => [nextState, ...]
   * @param {Function} evaluateFn - 评估函数 (state) => score (0-1)
   * @param {Function} isCompleteFn - 完成判断 (state) => boolean
   * @returns {Object} 最佳路径和所有探索结果
   */
  explore(problem, generateFn, evaluateFn, isCompleteFn) {
    const startTime = Date.now();
    
    // 初始化根节点
    this.tree = {
      id: 'root',
      depth: 0,
      state: problem,
      score: 1.0,
      parent: null,
      children: [],
      strategy: null,
      value: problem
    };
    
    this.exploredStates.clear();
    this.exploredStates.set(problem, 1.0);
    this.stats = { expansions: 0, prunes: 0, totalNodes: 1 };
    
    const results = {
      bestPath: null,
      bestScore: 0,
      allPaths: [],
      explorationTree: this.tree,
      stats: this.stats,
      duration: 0,
      strategies: { bfs: [], dfs: [] }
    };
    
    // BFS 层遍历
    if (this.enableBFS) {
      this._bfsExplore(this.tree, generateFn, evaluateFn, isCompleteFn, startTime, results);
    }
    
    // DFS 深度优先（如果BFS没找到好结果）
    if (!results.bestPath && this.enableDFS) {
      this._dfsExplore(this.tree, generateFn, evaluateFn, isCompleteFn, startTime, results, 0);
    }
    
    results.duration = Date.now() - startTime;
    
    // 回溯最佳路径
    if (results.bestPath) {
      results.bestPath = this._traceBack(results.bestPath);
    }
    
    return results;
  }

  /**
   * BFS 探索
   */
  _bfsExplore(node, generateFn, evaluateFn, isCompleteFn, startTime, results) {
    const queue = [node];
    
    while (queue.length > 0) {
      // 超时检查
      if (Date.now() - startTime > this.timeout) {
        results.timeout = true;
        return;
      }
      
      const current = queue.shift();
      
      // 达到深度限制
      if (current.depth >= this.maxDepth) continue;
      
      // 完成检查
      if (isCompleteFn(current.state)) {
        if (current.score > results.bestScore) {
          results.bestScore = current.score;
          results.bestPath = current;
        }
        continue;
      }
      
      // 生成子节点
      try {
        const children = generateFn(current.state);
        
        // 限制分支数
        const limited = children.slice(0, this.maxBranches);
        
        for (const childState of limited) {
          this.stats.expansions++;
          this.stats.totalNodes++;
          
          const score = evaluateFn(childState);
          
          // 剪枝检查
          if (score < this.pruneThreshold) {
            this.stats.prunes++;
            continue;
          }
          
          // 状态去重
          if (this.exploredStates.has(childState) && 
              this.exploredStates.get(childState) >= score) {
            continue;
          }
          this.exploredStates.set(childState, score);
          
          const childNode = {
            id: `bfs_${this.stats.totalNodes}`,
            depth: current.depth + 1,
            state: childState,
            score,
            parent: current,
            children: [],
            strategy: 'bfs',
            value: childState
          };
          
          current.children.push(childNode);
          results.strategies.bfs.push(childNode);
          
          queue.push(childNode);
        }
      } catch (e) {
        // 生成失败，跳过
      }
    }
  }

  /**
   * DFS 探索（带剪枝）
   */
  _dfsExplore(node, generateFn, evaluateFn, isCompleteFn, startTime, results, depth) {
    // 超时检查
    if (Date.now() - startTime > this.timeout) {
      results.timeout = true;
      return;
    }
    
    // 深度限制
    if (depth >= this.maxDepth) return;
    
    // 局部剪枝：如果当前分数已经比已知最佳差很多
    if (results.bestScore > 0 && node.score < results.bestScore * 0.5) {
      this.stats.prunes++;
      return;
    }
    
    // 完成检查
    if (isCompleteFn(node.state)) {
      if (node.score > results.bestScore) {
        results.bestScore = node.score;
        results.bestPath = node;
      }
      return;
    }
    
    // 生成子节点
    try {
      const children = generateFn(node.state);
      const limited = children.slice(0, this.maxBranches);
      
      for (const childState of limited) {
        this.stats.expansions++;
        this.stats.totalNodes++;
        
        const score = evaluateFn(childState);
        
        // 剪枝
        if (score < this.pruneThreshold) {
          this.stats.prunes++;
          continue;
        }
        
        // 去重
        if (this.exploredStates.has(childState) && 
            this.exploredStates.get(childState) >= score) {
          continue;
        }
        this.exploredStates.set(childState, score);
        
        const childNode = {
          id: `dfs_${this.stats.totalNodes}`,
          depth: depth + 1,
          state: childState,
          score,
          parent: node,
          children: [],
          strategy: 'dfs',
          value: childState
        };
        
        node.children.push(childNode);
        results.strategies.dfs.push(childNode);
        
        // 递归深入
        this._dfsExplore(childNode, generateFn, evaluateFn, isCompleteFn, startTime, results, depth + 1);
      }
    } catch (e) {
      // 生成失败
    }
  }

  /**
   * 回溯路径
   */
  _traceBack(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({
        depth: current.depth,
        state: current.state,
        score: current.score,
        strategy: current.strategy
      });
      current = current.parent;
    }
    return path;
  }

  /**
   * 集成到决策验证的简化接口
   * 用于快速决策：给定一个决策选项，评估是否要探索更多分支
   */
  quickEvaluate(decision, context = {}) {
    const problem = `决策:${decision}|上下文:${JSON.stringify(context)}`;
    
    const generateFn = (state) => {
      // 简化生成：基于关键词扩展
      const base = state.split('|')[0].replace('决策:', '');
      const expansions = [
        `${base} + 风险评估`,
        `${base} + 反向验证`,
        `${base} + 时间维度`,
        `${base} + 多视角`,
        `${base} + 最坏情况`
      ];
      return expansions;
    };
    
    const evaluateFn = (state) => {
      // 简化评分
      const hasRisk = state.includes('风险');
      const hasReverse = state.includes('反向');
      const hasTime = state.includes('时间');
      const hasMulti = state.includes('多视角');
      const hasWorst = state.includes('最坏');
      
      let score = 0.5;
      if (hasRisk) score += 0.1;
      if (hasReverse) score += 0.15; // 反者道之动
      if (hasTime) score += 0.1;
      if (hasMulti) score += 0.1;
      if (hasWorst) score += 0.15;
      
      return Math.min(1, score);
    };
    
    const isCompleteFn = (state) => {
      // 达到一定分数就算完成
      return evaluateFn(state) >= 0.8;
    };
    
    const results = this.explore(problem, generateFn, evaluateFn, isCompleteFn);
    
    return {
      decision,
      bestScore: results.bestScore,
      bestPath: results.bestPath,
      explorationDepth: results.bestPath ? results.bestPath.length : 0,
      shouldExploreMore: results.bestScore < 0.7,
      reason: results.bestScore >= 0.7 
        ? '决策充分探索，可以执行'
        : '决策探索不足，建议从多个角度重新审视'
    };
  }
}

module.exports = { TreeOfThoughts };
