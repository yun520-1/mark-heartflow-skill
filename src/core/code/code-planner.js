/**
 * CodePlanner — 代码任务规划引擎 v1.0.0
 *
 * 根据自然语言目标或需求描述，生成结构化的代码执行计划。
 * 支持任务分解、依赖图构建、执行路径排序、计划自适应调整。
 *
 * 核心能力：
 * - plan(goal) — 从目标生成完整代码执行计划
 * - decompose(goal) — 将目标分解为有序步骤
 * - getPath(goal) — 获取依赖排序后的执行路径
 * - adapt(plan, feedback) — 根据执行反馈调整计划
 * - buildDependencyGraph(steps) — 构建依赖图
 *
 * @module code-planner
 */

'use strict';

// ============================================================================
// 状态枚举
// ============================================================================

const PlanStatus = {
  DRAFT:      'draft',       // 草稿状态，尚未正式规划
  PLANNING:   'planning',    // 正在生成计划
  READY:      'ready',       // 计划已就绪，可执行
  RUNNING:    'running',     // 执行中
  COMPLETED:  'completed',   // 全部完成
  FAILED:     'failed',      // 执行失败
  ADAPTED:    'adapted'      // 已根据反馈调整
};

// ============================================================================
// 步骤类型枚举
// ============================================================================

const StepType = {
  DATA_PREP:   'DATA_PREP',   // 数据准备/获取
  TRANSFORM:   'TRANSFORM',   // 数据转换
  ANALYZE:     'ANALYZE',     // 分析计算
  OUTPUT:      'OUTPUT',      // 输出/展示
  UTILITY:     'UTILITY'      // 通用工具/辅助
};

// ============================================================================
// 执行模式枚举
// ============================================================================

const ExecMode = {
  CODE:    'code',     // 单段代码执行
  SCRIPT:  'script',   // 完整脚本执行
  PIPELINE:'pipeline'  // 管道式多步执行
};

// ============================================================================
// 复杂度级别
// ============================================================================

const Complexity = {
  TRIVIAL:    1,   // 极简（单行/简单调用）
  LOW:        2,   // 简单（单函数/单一操作）
  MEDIUM:     3,   // 中等（多步/含逻辑分支）
  HIGH:       4,   // 复杂（多模块/多数据源）
  CRITICAL:   5    // 关键（跨系统/高风险）
};

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULTS = {
  maxSteps:           20,     // 单次规划最大步骤数
  maxRetries:         3,      // 单步最大重试次数
  estimateBase:       1000,   // 基准估计时间(ms)
  dependencyLimit:    50,     // 依赖图最大节点数
  cycleDetectEnabled: true    // 是否启用循环依赖检测
};

// ============================================================================
// 工具：唯一 ID 生成
// ============================================================================

let _idCounter = 0;
function _nextId() {
  return `step_${++_idCounter}_${Date.now()}`;
}

// ============================================================================
// 目标分析模式
// ============================================================================

/**
 * 分析目标文本，返回目标类型和关键信息
 */
function _analyzeGoal(goal) {
  if (!goal || typeof goal !== 'string') {
    return { type: 'unknown', complexity: Complexity.LOW, hints: [] };
  }

  const g = goal.toLowerCase();
  const hints = [];

  // 类型检测
  let type = 'utility';
  if (/分析|统计|计算|aggregate|analyze|统计|计算|count|sum|avg/i.test(g)) {
    type = 'analyze';
    hints.push('analysis');
  } else if (/转换|transform|map|format|转|映射|提取/i.test(g)) {
    type = 'transform';
    hints.push('transformation');
  } else if (/获取|请求|fetch|api|爬虫|scrape|抓取|download/i.test(g)) {
    type = 'fetch';
    hints.push('data_acquisition');
  } else if (/生成|create|构造|生成|输出|write|创建|output/i.test(g)) {
    type = 'generate';
    hints.push('generation');
  } else if (/排序|sort|过滤|filter|筛选|search|搜索|查找/i.test(g)) {
    type = 'process';
    hints.push('data_processing');
  } else if (/验证|validate|校验|检查|check|测试|test/i.test(g)) {
    type = 'validate';
    hints.push('validation');
  }

  // 复杂度估算
  let complexity = Complexity.LOW;
  const complexityFactors = [
    { pattern: /多步|pipeline|chain|管道|流程|多文件|multi/i, weight: 2 },
    { pattern: /大量|large|big|海量|百万|万条|大数据/i, weight: 2 },
    { pattern: /并发|并行|async|并发|parallel/i, weight: 1 },
    { pattern: /复杂|complex|高级|advanced|嵌套/i, weight: 1 },
    { pattern: /外部|api|网络|database|数据库/i, weight: 1 }
  ];

  let totalWeight = 0;
  for (const factor of complexityFactors) {
    if (factor.pattern.test(g)) {
      totalWeight += factor.weight;
    }
  }

  if (totalWeight >= 4) complexity = Complexity.CRITICAL;
  else if (totalWeight >= 3) complexity = Complexity.HIGH;
  else if (totalWeight >= 2) complexity = Complexity.MEDIUM;

  return { type, complexity, hints };
}

// ============================================================================
// 目标分解策略
// ============================================================================

/**
 * 根据目标类型和复杂度，生成初步步骤列表
 */
function _generateSteps(goal, analysis) {
  const steps = [];
  const { type, complexity } = analysis;

  // 公共步骤：数据准备
  steps.push({
    id: _nextId(),
    action: '准备输入数据',
    type: StepType.DATA_PREP,
    dependsOn: [],
    estimatedComplexity: Complexity.LOW,
    estimatedTime: DEFAULTS.estimateBase,
    execMode: ExecMode.SCRIPT,
    description: '收集和验证输入数据，确保数据格式正确'
  });

  switch (type) {
    case 'analyze':
      steps.push({
        id: _nextId(),
        action: '执行数据分析',
        type: StepType.ANALYZE,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '对数据进行统计分析、聚合或计算'
      });
      steps.push({
        id: _nextId(),
        action: '格式化分析结果',
        type: StepType.OUTPUT,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.LOW,
        estimatedTime: DEFAULTS.estimateBase * 0.5,
        execMode: ExecMode.CODE,
        description: '将分析结果格式化为可读的输出'
      });
      break;

    case 'transform':
      steps.push({
        id: _nextId(),
        action: '执行数据转换',
        type: StepType.TRANSFORM,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '按规则转换数据结构或格式'
      });
      steps.push({
        id: _nextId(),
        action: '验证转换结果',
        type: StepType.ANALYZE,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.LOW,
        estimatedTime: DEFAULTS.estimateBase * 0.5,
        execMode: ExecMode.CODE,
        description: '检查转换后的数据完整性和正确性'
      });
      break;

    case 'fetch':
      steps.push({
        id: _nextId(),
        action: '发送数据请求',
        type: StepType.DATA_PREP,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity * 2,
        execMode: ExecMode.CODE,
        description: '发送HTTP请求或调用API获取数据'
      });
      steps.push({
        id: _nextId(),
        action: '解析响应数据',
        type: StepType.TRANSFORM,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.MEDIUM,
        estimatedTime: DEFAULTS.estimateBase,
        execMode: ExecMode.CODE,
        description: '解析API响应，提取所需字段'
      });
      break;

    case 'generate':
      steps.push({
        id: _nextId(),
        action: '生成内容',
        type: StepType.UTILITY,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '根据参数生成所需内容'
      });
      steps.push({
        id: _nextId(),
        action: '输出结果',
        type: StepType.OUTPUT,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.TRIVIAL,
        estimatedTime: DEFAULTS.estimateBase * 0.3,
        execMode: ExecMode.SCRIPT,
        description: '将生成的内容输出到目标位置'
      });
      break;

    case 'process':
      steps.push({
        id: _nextId(),
        action: '数据处理操作',
        type: StepType.TRANSFORM,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '执行排序、过滤、搜索等数据处理'
      });
      steps.push({
        id: _nextId(),
        action: '输出处理结果',
        type: StepType.OUTPUT,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.TRIVIAL,
        estimatedTime: DEFAULTS.estimateBase * 0.3,
        execMode: ExecMode.CODE,
        description: '展示或保存处理后的结果'
      });
      break;

    case 'validate':
      steps.push({
        id: _nextId(),
        action: '执行验证检查',
        type: StepType.ANALYZE,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '按照规则对数据进行验证'
      });
      steps.push({
        id: _nextId(),
        action: '生成验证报告',
        type: StepType.OUTPUT,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.LOW,
        estimatedTime: DEFAULTS.estimateBase * 0.5,
        execMode: ExecMode.SCRIPT,
        description: '汇总验证结果并生成报告'
      });
      break;

    default: // utility
      steps.push({
        id: _nextId(),
        action: '执行通用操作',
        type: StepType.UTILITY,
        dependsOn: [steps[0].id],
        estimatedComplexity: complexity,
        estimatedTime: DEFAULTS.estimateBase * complexity,
        execMode: ExecMode.CODE,
        description: '执行通用工具或辅助操作'
      });
      steps.push({
        id: _nextId(),
        action: '返回结果',
        type: StepType.OUTPUT,
        dependsOn: [steps[1].id],
        estimatedComplexity: Complexity.TRIVIAL,
        estimatedTime: DEFAULTS.estimateBase * 0.3,
        execMode: ExecMode.SCRIPT,
        description: '返回最终结果'
      });
      break;
  }

  return steps;
}

// ============================================================================
// CodePlanner 类
// ============================================================================

class CodePlanner {

  /**
   * @param {Object} options
   * @param {Object} [options.hf] - HeartFlow 实例引用
   */
  constructor(options = {}) {
    this._hf = options.hf || null;
    this._config = Object.assign({}, DEFAULTS);

    // 当前活跃计划
    this._currentPlan = null;

    // 统计追踪
    this._stats = {
      totalPlans:       0,
      totalSteps:       0,
      completedPlans:   0,
      failedPlans:      0,
      adaptedPlans:     0,
      cycleDetections:  0,
      avgStepsPerPlan:  0
    };
    this._startTime = Date.now();
  }

  // ============================================================================
  // plan(goal) — 从目标生成代码执行计划
  // ============================================================================

  /**
   * 从目标生成完整的代码执行计划
   * @param {string} goal - 目标描述
   * @param {Object} [options] - 可选配置
   * @returns {Object} 计划对象
   */
  plan(goal, options = {}) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('CodePlanner.plan: goal must be a non-empty string');
    }

    this._stats.totalPlans++;

    // 1. 分析目标
    const analysis = _analyzeGoal(goal);

    // 2. 分解为子任务
    const steps = _generateSteps(goal, analysis);

    // 3. 限制步骤数量
    const maxSteps = options.maxSteps || this._config.maxSteps;
    if (steps.length > maxSteps) {
      steps.length = maxSteps;
    }

    // 4. 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(steps);

    // 5. 计算执行路径
    const path = this._topologicalSort(steps, dependencyGraph);

    // 6. 构建计划对象
    const plan = {
      id: `plan_${Date.now()}`,
      goal,
      status: PlanStatus.DRAFT,
      analysis,
      steps,
      dependencyGraph,
      executionPath: path,
      totalEstimatedTime: steps.reduce((sum, s) => sum + (s.estimatedTime || 0), 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
      maxRetries: options.maxRetries || this._config.maxRetries,
      metadata: {
        totalSteps: steps.length,
        hasCycle: dependencyGraph.cycleDetected || false,
        criticalPath: dependencyGraph.criticalPath || []
      }
    };

    // 7. 标记为就绪
    plan.status = PlanStatus.READY;
    this._currentPlan = plan;

    // 更新统计
    this._stats.totalSteps += steps.length;
    this._stats.avgStepsPerPlan = this._stats.totalSteps / this._stats.totalPlans;

    return plan;
  }

  // ============================================================================
  // decompose(goal) — 分解目标为步骤
  // ============================================================================

  /**
   * 将目标分解为有序步骤列表（不生成完整计划）
   * @param {string} goal - 目标描述
   * @param {Object} [options]
   * @returns {Array<Object>} 步骤列表
   */
  decompose(goal, options = {}) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('CodePlanner.decompose: goal must be a non-empty string');
    }

    const analysis = _analyzeGoal(goal);
    const steps = _generateSteps(goal, analysis);

    const maxSteps = options.maxSteps || this._config.maxSteps;
    if (steps.length > maxSteps) {
      steps.length = maxSteps;
    }

    return steps;
  }

  // ============================================================================
  // getPath(goal) — 获取执行路径
  // ============================================================================

  /**
   * 获取依赖排序后的执行顺序，检测循环依赖
   * @param {string|Array} goal - 目标字符串或步骤数组
   * @returns {Object} { path: Array, hasCycle: boolean, cycleNodes: Array }
   */
  getPath(goal) {
    let steps;
    if (Array.isArray(goal)) {
      steps = goal;
    } else if (typeof goal === 'string') {
      steps = this.decompose(goal);
    } else {
      throw new Error('CodePlanner.getPath: goal must be a string or array of steps');
    }

    const graph = this.buildDependencyGraph(steps);
    const path = this._topologicalSort(steps, graph);

    return {
      path,
      hasCycle: graph.cycleDetected || false,
      cycleNodes: graph.cycleNodes || [],
      criticalPath: graph.criticalPath || [],
      adjacencyList: graph.adjacencyList
    };
  }

  // ============================================================================
  // adapt(plan, feedback) — 根据执行结果调整计划
  // ============================================================================

  /**
   * 根据执行反馈调整计划
   * @param {Object} plan - 原始计划
   * @param {Object} feedback - 执行反馈 { stepResults: Map<stepId, { success, error?, time? }> }
   * @returns {Object} 调整后的计划
   */
  adapt(plan, feedback) {
    if (!plan || !feedback) {
      throw new Error('CodePlanner.adapt: plan and feedback are required');
    }

    if (!feedback.stepResults || typeof feedback.stepResults !== 'object') {
      throw new Error('CodePlanner.adapt: feedback.stepResults must be an object/map');
    }

    this._stats.adaptedPlans++;

    const adaptedPlan = JSON.parse(JSON.stringify(plan));
    adaptedPlan.status = PlanStatus.ADAPTED;
    adaptedPlan.updatedAt = Date.now();
    adaptedPlan.attempts = (adaptedPlan.attempts || 0) + 1;

    const stepResults = feedback.stepResults;
    let needsReplan = false;

    for (const step of adaptedPlan.steps) {
      const result = stepResults[step.id];
      if (!result) continue;

      if (result.success === true) {
        // 成功：标记完成，更新估计时间
        step.status = 'completed';
        if (typeof result.time === 'number') {
          // 加权平均更新估计时间（保留历史权重）
          const oldWeight = 0.7;
          const newWeight = 0.3;
          step.estimatedTime = Math.round(
            (step.estimatedTime || DEFAULTS.estimateBase) * oldWeight +
            result.time * newWeight
          );
        }
      } else if (result.success === false) {
        // 失败：标记重试
        step.retries = (step.retries || 0) + 1;
        step.status = 'failed';
        step.lastError = result.error || 'Unknown error';

        if (step.retries <= (plan.maxRetries || this._config.maxRetries)) {
          step.status = 'retry';
          step.retryAt = Date.now();
          needsReplan = true;
        } else {
          step.status = 'aborted';
          step.abortReason = `Exceeded max retries (${step.retries})`;
        }
      }
    }

    // 检查是否有失败的步骤导致依赖链断裂
    const abortedSteps = adaptedPlan.steps.filter(s => s.status === 'aborted');
    if (abortedSteps.length > 0) {
      // 标记所有依赖已中止步骤的后续步骤
      for (const step of adaptedPlan.steps) {
        if (step.status === 'completed' || step.status === 'retry') continue;
        for (const depId of step.dependsOn || []) {
          const dep = adaptedPlan.steps.find(s => s.id === depId);
          if (dep && dep.status === 'aborted') {
            step.status = 'blocked';
            step.blockedBy = depId;
          }
        }
      }
    }

    // 重新计算执行路径
    if (needsReplan || abortedSteps.length > 0) {
      const graph = this.buildDependencyGraph(adaptedPlan.steps);
      adaptedPlan.dependencyGraph = graph;
      adaptedPlan.executionPath = this._topologicalSort(adaptedPlan.steps, graph);
    }

    // 更新总估计时间
    adaptedPlan.totalEstimatedTime = adaptedPlan.steps.reduce(
      (sum, s) => sum + (s.status === 'completed' ? 0 : (s.estimatedTime || 0)), 0
    );

    // 判断最终状态
    const allCompleted = adaptedPlan.steps.every(s => s.status === 'completed');
    const anyFailed = adaptedPlan.steps.some(s => s.status === 'aborted' || s.status === 'blocked');

    if (allCompleted) {
      adaptedPlan.status = PlanStatus.COMPLETED;
      this._stats.completedPlans++;
    } else if (anyFailed) {
      adaptedPlan.status = PlanStatus.FAILED;
      this._stats.failedPlans++;
    } else {
      adaptedPlan.status = PlanStatus.ADAPTED;
    }

    this._currentPlan = adaptedPlan;
    return adaptedPlan;
  }

  // ============================================================================
  // buildDependencyGraph(steps) — 构建依赖图
  // ============================================================================

  /**
   * 构建依赖图（邻接表），标记关键路径
   * @param {Array<Object>} steps - 步骤列表
   * @returns {Object} { adjacencyList, criticalPath, cycleDetected, cycleNodes }
   */
  buildDependencyGraph(steps) {
    if (!Array.isArray(steps)) {
      throw new Error('CodePlanner.buildDependencyGraph: steps must be an array');
    }

    if (steps.length > this._config.dependencyLimit) {
      throw new Error(`CodePlanner.buildDependencyGraph: too many steps (${steps.length} > ${this._config.dependencyLimit})`);
    }

    const adjacencyList = new Map();
    const reverseAdjacency = new Map(); // 用于关键路径计算

    // 初始化邻接表
    for (const step of steps) {
      if (!adjacencyList.has(step.id)) {
        adjacencyList.set(step.id, []);
      }
      if (!reverseAdjacency.has(step.id)) {
        reverseAdjacency.set(step.id, []);
      }
    }

    // 填充边
    for (const step of steps) {
      const deps = step.dependsOn || [];
      for (const depId of deps) {
        if (adjacencyList.has(depId)) {
          adjacencyList.get(depId).push(step.id);
        }
        if (reverseAdjacency.has(step.id)) {
          reverseAdjacency.get(step.id).push(depId);
        }
      }
    }

    // 循环依赖检测（DFS）
    let cycleDetected = false;
    const cycleNodes = [];

    if (this._config.cycleDetectEnabled) {
      const visited = new Set();
      const recursionStack = new Set();

      function dfs(nodeId, path) {
        if (recursionStack.has(nodeId)) {
          cycleDetected = true;
          const cycleStart = path.indexOf(nodeId);
          const cycle = path.slice(cycleStart).concat(nodeId);
          cycleNodes.push(...cycle);
          return true;
        }
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (dfs(neighbor, path)) return true;
        }

        recursionStack.delete(nodeId);
        path.pop();
        return false;
      }

      for (const step of steps) {
        if (!visited.has(step.id)) {
          dfs(step.id, []);
        }
      }

      if (cycleDetected) {
        this._stats.cycleDetections++;
      }
    }

    // 关键路径计算（最长路径）
    // 使用拓扑排序后计算每个节点的最早完成时间
    let criticalPath = [];
    try {
      const topoOrder = this._topologicalSort(steps, { adjacencyList, cycleDetected });
      if (!cycleDetected && topoOrder.length > 0) {
        // 最早完成时间
        const earliestFinish = new Map();
        const predecessors = new Map();

        for (const stepId of topoOrder) {
          const step = steps.find(s => s.id === stepId);
          const time = step ? (step.estimatedTime || DEFAULTS.estimateBase) : DEFAULTS.estimateBase;
          const deps = step ? (step.dependsOn || []) : [];

          let maxPredFinish = 0;
          let maxPred = null;
          for (const depId of deps) {
            const predFinish = earliestFinish.get(depId) || 0;
            if (predFinish > maxPredFinish) {
              maxPredFinish = predFinish;
              maxPred = depId;
            }
          }

          earliestFinish.set(stepId, maxPredFinish + time);
          predecessors.set(stepId, maxPred);
        }

        // 回溯找到关键路径
        let maxFinish = 0;
        let criticalEnd = null;
        for (const [stepId, finish] of earliestFinish) {
          if (finish > maxFinish) {
            maxFinish = finish;
            criticalEnd = stepId;
          }
        }

        const path = [];
        let current = criticalEnd;
        while (current) {
          path.unshift(current);
          current = predecessors.get(current);
        }
        criticalPath = path;
      }
    } catch (e) {
      // 如果拓扑排序失败（有环），关键路径为空
      criticalPath = [];
    }

    return {
      adjacencyList: Object.fromEntries(adjacencyList),
      criticalPath,
      cycleDetected,
      cycleNodes: [...new Set(cycleNodes)]
    };
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 拓扑排序（Kahn 算法）
   * @private
   */
  _topologicalSort(steps, graph) {
    const { adjacencyList, cycleDetected } = graph;

    if (cycleDetected) {
      // 有环时返回一个安全的近似顺序
      return steps.map(s => s.id);
    }

    // 计算入度
    const inDegree = new Map();
    const adj = adjacencyList || {};

    for (const step of steps) {
      inDegree.set(step.id, 0);
    }

    for (const [nodeId, neighbors] of Object.entries(adj)) {
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }

    // 队列：入度为 0 的节点
    const queue = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }

    const sorted = [];
    while (queue.length > 0) {
      // 按步骤原始顺序优先级排序（保持稳定）
      queue.sort((a, b) => {
        const ia = steps.findIndex(s => s.id === a);
        const ib = steps.findIndex(s => s.id === b);
        return ia - ib;
      });

      const nodeId = queue.shift();
      sorted.push(nodeId);

      const neighbors = adj[nodeId] || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // 如果有节点未被排序（环），追加剩余节点
    const sortedSet = new Set(sorted);
    for (const step of steps) {
      if (!sortedSet.has(step.id)) {
        sorted.push(step.id);
      }
    }

    return sorted;
  }

  // ============================================================================
  // 辅助：计划多文件（扩展接口）
  // ============================================================================

  /**
   * 为多文件生成计划
   * @param {string} goal - 目标描述
   * @param {Array<string>} files - 涉及的文件列表
   * @param {Object} [options]
   * @returns {Object} 多文件计划
   */
  planMultiFile(goal, files, options = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('CodePlanner.planMultiFile: files must be a non-empty array');
    }

    const basePlan = this.plan(goal, options);

    // 为每个文件创建独立的步骤分支
    const fileSteps = [];
    for (const file of files) {
      const analysis = _analyzeGoal(`处理文件: ${file}`);
      const steps = _generateSteps(`处理文件: ${file}`, analysis);
      for (const step of steps) {
        step.file = file;
        step.id = _nextId();
      }
      fileSteps.push(...steps);
    }

    // 合并步骤
    const allSteps = [...basePlan.steps, ...fileSteps];

    // 构建新的依赖图
    const dependencyGraph = this.buildDependencyGraph(allSteps);

    return {
      id: `plan_mf_${Date.now()}`,
      goal,
      files,
      status: PlanStatus.READY,
      analysis: basePlan.analysis,
      baseSteps: basePlan.steps,
      fileSteps,
      dependencyGraph,
      executionPath: this._topologicalSort(allSteps, dependencyGraph),
      totalEstimatedTime: allSteps.reduce((sum, s) => sum + (s.estimatedTime || 0), 0),
      createdAt: Date.now(),
      metadata: {
        totalSteps: allSteps.length,
        fileCount: files.length,
        hasCycle: dependencyGraph.cycleDetected || false
      }
    };
  }

  // ============================================================================
  // 统计与状态
  // ============================================================================

  /**
   * 获取当前计划
   * @returns {Object|null}
   */
  getCurrentPlan() {
    return this._currentPlan;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    const hitRate = this._stats.totalPlans > 0
      ? ((this._stats.completedPlans / this._stats.totalPlans) * 100).toFixed(1) + '%'
      : '0%';

    return {
      ...this._stats,
      avgStepsPerPlan: +this._stats.avgStepsPerPlan.toFixed(1),
      hitRate,
      currentPlanStatus: this._currentPlan ? this._currentPlan.status : null,
      uptime: Date.now() - (this._startTime || Date.now())
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this._stats = {
      totalPlans:       0,
      totalSteps:       0,
      completedPlans:   0,
      failedPlans:      0,
      adaptedPlans:     0,
      cycleDetections:  0,
      avgStepsPerPlan:  0
    };
  }

  /**
   * 获取支持的枚举
   */
  static get PlanStatus() { return PlanStatus; }
  static get StepType()   { return StepType; }
  static get ExecMode()   { return ExecMode; }
  static get Complexity() { return Complexity; }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = { CodePlanner, PlanStatus, StepType, ExecMode, Complexity };
