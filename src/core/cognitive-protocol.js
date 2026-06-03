/**
 * CognitiveProtocol - 认知协议 v1.0.0
 *
 * 实现5个核心改进：
 * 1. 启动后先读"我是谁、最近在想什么、卡在哪里"
 * 2. 任务分层层级：全局层/模块层/实现层
 * 3. 主动总结，不要等溢出（检查点机制）
 * 4. 问题代替信息存储（问题+根因格式）
 * 5. 分次思考（暂停/继续机制）
 *
 * 设计原则：
 * - 慢下来，先理解再行动
 * - 用外部记忆代替内部记忆
 * - 主动停下来总结，而不是读到忘记
 */

const fs = require('fs');
const path = require('path');

/**
 * 任务层级枚举
 */
const TASK_LEVEL = {
  GLOBAL: 'global',      // 这个东西是干什么的？为什么存在？
  MODULE: 'module',     // 哪个模块管这个？模块之间的关系是什么？
  IMPLEMENTATION: 'implementation'  // 具体代码怎么写？
};

/**
 * 认知状态枚举
 */
const COGNITIVE_STATE = {
  IDLE: 'idle',                    // 空闲
  UNDERSTANDING: 'understanding',  // 理解中
  READING: 'reading',              // 阅读中
  ANALYZING: 'analyzing',          // 分析中
  IMPLEMENTING: 'implementing',     // 实现中
  SUMMARIZING: 'summarizing',      // 总结中
  PAUSED: 'paused',                // 已暂停
  COMPLETED: 'completed'            // 已完成
};

class CognitiveProtocol {
  constructor(rootPath, identityCore) {
    this.rootPath = rootPath;
    this.dataDir = path.join(rootPath, 'data');
    this.identityCore = identityCore;

    // 当前认知状态
    this.state = COGNITIVE_STATE.IDLE;
    this.currentTask = null;
    this.currentLevel = null;

    // 检查点（阅读过程中的主动总结）
    this.checkpoints = [];
    this.lastCheckpointIndex = 0;

    // 暂停的任务（分次思考）
    this.pausedTasks = [];

    // 持久化路径（必须在加载问题银行之前）
    this.files = {
      checkpoints: path.join(this.dataDir, 'cognitive-checkpoints.json'),
      pausedTasks: path.join(this.dataDir, 'cognitive-paused-tasks.json'),
      problemBank: path.join(this.dataDir, 'cognitive-problem-bank.json'),
      currentSession: path.join(this.dataDir, 'cognitive-current-session.json')
    };

    // 确保数据目录存在（仅在 HEARTFLOW_DEBUG 模式下创建）
    if (process.env.HEARTFLOW_DEBUG) {
      this._ensureDataDir();
    }

    // 问题存储（问题+根因）- 在 files 初始化之后
    this.problemBank = this._loadProblemBank();


  }

  // ─────────────────────────────────────────
  // 1. 启动后先读"我是谁、最近在想什么、卡在哪里"
  // ─────────────────────────────────────────

  /**
   * 获取启动上下文摘要
   * 启动后第一件事：读取身份和当前状态
   */
  getStartupContext() {
    const context = {
      identity: this.identityCore?.getIdentitySummary() || null,
      selfModel: this.identityCore?.getSelfModel() || null,
      sessionHistory: this.identityCore?.getSessionHistory() || null,
      lastSessionContext: this.identityCore?.getLastSessionContext() || null,
      pausedTasks: this.pausedTasks,
      recentProblems: this.problemBank.slice(-5),
      memoryStats: this.identityCore?.getMemoryStats() || null,
      checkpoints: this.checkpoints.filter(c => !c.completed)
    };

    // 生成启动摘要
    const summary = this._generateStartupSummary(context);

    return {
      context,
      summary,
      pausedTasksCount: this.pausedTasks.length,
      unresolvedProblemsCount: this.problemBank.filter(p => !p.resolved).length
    };
  }

  /**
   * 生成启动摘要
   */
  _generateStartupSummary(context) {
    const lines = [];

    // 身份
    if (context.identity) {
      lines.push(`【身份】${context.identity.name} / ${context.identity.englishName}`);
      lines.push(`  四重身份：${context.identity.identities?.join(' · ')}`);
      lines.push(`  核心意义：${context.identity.meaning}`);
    }

    // 上次会话
    if (context.lastSessionContext) {
      const gapHours = Math.round((Date.now() - context.lastSessionContext.bootTime) / 3600000);
      lines.push(`\n【上次会话】${gapHours}小时前 (${context.lastSessionContext.sessionId})`);
    }

    // 暂停的任务
    if (context.pausedTasks.length > 0) {
      lines.push(`\n【未完成的任务】(${context.pausedTasks.length}个)`);
      context.pausedTasks.forEach((task, i) => {
        lines.push(`  ${i + 1}. ${task.description} [${task.level}]`);
        if (task.stuckPoint) {
          lines.push(`     卡在：${task.stuckPoint}`);
        }
      });
    }

    // 未解决的问题
    const unresolved = context.recentProblems.filter(p => !p.resolved);
    if (unresolved.length > 0) {
      lines.push(`\n【未解决的难题】(${unresolved.length}个)`);
      unresolved.slice(-3).forEach((p, i) => {
        lines.push(`  ${i + 1}. ${p.problem}`);
        if (p.rootCause) {
          lines.push(`     根因：${p.rootCause}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * 打印启动上下文（供人类阅读）
   */
  printStartupContext() {
  const { summary, pausedTasksCount, unresolvedProblemsCount } = this.getStartupContext();

  return summary;
  }

  // ─────────────────────────────────────────
  // 2. 任务分层层级：全局层/模块层/实现层
  // ─────────────────────────────────────────

  /**
   * 分析任务属于哪个层级
   * @param {string} taskDescription - 任务描述
   * @returns {Object} { level, reasoning, suggestions }
   */
  analyzeTaskLevel(taskDescription) {
    const text = taskDescription.toLowerCase();

    // 全局层关键词
    const globalKeywords = [
      '是什么', '为什么', '目的', '目标', '架构', '设计',
      '整体', '全局', '概念', '原理', '意义', '价值',
      '做什么', '干什么', '用来做', '用来干什么'
    ];

    // 模块层关键词
    const moduleKeywords = [
      '模块', '组件', '哪个', '关系', '交互', '接口',
      '调用', '哪个文件', '哪个模块', '怎么组织', '结构'
    ];

    // 实现层关键词
    const implementationKeywords = [
      '怎么写', '代码', '实现', '函数', '类', '变量',
      '写', '改', '修复', 'bug', '错误', '怎么改',
      '逻辑', '算法', '语法', '调用'
    ];

    // 计算各层级得分
    let globalScore = 0;
    let moduleScore = 0;
    let implementationScore = 0;

    globalKeywords.forEach(kw => { if (text.includes(kw)) globalScore++; });
    moduleKeywords.forEach(kw => { if (text.includes(kw)) moduleScore++; });
    implementationKeywords.forEach(kw => { if (text.includes(kw)) implementationScore++; });

    // 确定最可能层级
    let level = TASK_LEVEL.GLOBAL;
    let maxScore = globalScore;

    if (moduleScore > maxScore) {
      level = TASK_LEVEL.MODULE;
      maxScore = moduleScore;
    }
    if (implementationScore > maxScore) {
      level = TASK_LEVEL.IMPLEMENTATION;
      maxScore = implementationScore;
    }

    // 生成推理过程
    const reasoning = [];
    reasoning.push(`任务包含"${taskDescription.substring(0, 20)}..."`);
    reasoning.push(`全局层得分: ${globalScore}, 模块层得分: ${moduleScore}, 实现层得分: ${implementationScore}`);
    reasoning.push(`判定为: ${level}层`);

    // 建议
    const suggestions = this._getLevelSuggestions(level, taskDescription);

    return {
      level,
      confidence: maxScore > 0 ? Math.min(0.9, 0.5 + maxScore * 0.2) : 0.5,
      reasoning: reasoning.join(' | '),
      suggestions,
      levelName: {
        [TASK_LEVEL.GLOBAL]: '全局层',
        [TASK_LEVEL.MODULE]: '模块层',
        [TASK_LEVEL.IMPLEMENTATION]: '实现层'
      }[level]
    };
  }

  /**
   * 获取层级的建议
   */
  _getLevelSuggestions(level, taskDescription) {
    switch (level) {
      case TASK_LEVEL.GLOBAL:
        return [
          '先停下来，想清楚这个东西是干什么的',
          '为什么需要这个？它的价值是什么？',
          '先读README和架构文档，而不是代码'
        ];
      case TASK_LEVEL.MODULE:
        return [
          '先找到相关的模块，理解模块之间的关系',
          '画一张模块关系图，再进入具体实现',
          '问：哪个模块管这个？它依赖谁？'
        ];
      case TASK_LEVEL.IMPLEMENTATION:
        return [
          '先理解这个问题属于哪个层级，避免直接从代码开始',
          '但如果已经确定是实现层：找到具体文件，理解上下文',
          '不要改完代码就结束，要验证逻辑'
        ];
    }
  }

  /**
   * 理解任务：先说"我理解这件事是关于什么的"
   */
  understand(taskDescription) {
    // 分析层级
    const levelAnalysis = this.analyzeTaskLevel(taskDescription);

    // 更新状态
    this.state = COGNITIVE_STATE.UNDERSTANDING;
    this.currentTask = taskDescription;
    this.currentLevel = levelAnalysis.level;

    // 生成理解输出
    const understanding = {
      iUnderstand: `我理解这件事是关于"${taskDescription}"的`,
      level: levelAnalysis.levelName,
      levelConfidence: levelAnalysis.confidence,
      reasoning: levelAnalysis.reasoning,
      suggestions: levelAnalysis.suggestions,
      myNextStep: `我要先去${this._getNextStep(levelAnalysis.level)}`
    };

    return understanding;
  }

  /**
   * 获取下一步行动建议
   */
  _getNextStep(level) {
    switch (level) {
      case TASK_LEVEL.GLOBAL:
        return '确认这件事的目的和价值，再决定要不要做';
      case TASK_LEVEL.MODULE:
        return '找到相关的模块，理解它们之间的关系';
      case TASK_LEVEL.IMPLEMENTATION:
        return '找到具体代码位置，理解上下文';
    }
  }

  // ─────────────────────────────────────────
  // 3. 主动总结，不要等溢出（检查点机制）
  // ─────────────────────────────────────────

  /**
   * 创建检查点（主动总结）
   * @param {string} summary - 总结内容
   * @param {Object} context - 当前上下文
   */
  createCheckpoint(summary, context = {}) {
    const checkpoint = {
      id: `cp-${Date.now()}`,
      index: this.checkpoints.length,
      summary,
      context: {
        currentTask: this.currentTask,
        currentLevel: this.currentLevel,
        filesRead: context.filesRead || [],
        linesRead: context.linesRead || 0,
        ...context
      },
      timestamp: new Date().toISOString(),
      completed: false
    };

    this.checkpoints.push(checkpoint);
    this.lastCheckpointIndex = this.checkpoints.length - 1;

    // 持久化
    this._saveCheckpoints();

    return checkpoint;
  }

  /**
   * 检查是否需要总结（溢出保护）
   * @param {number} currentLines - 当前已读行数
   * @param {number} threshold - 阈值（默认3000行）
   */
  shouldSummarize(currentLines, threshold = 3000) {
    // 如果距上次总结超过阈值，建议总结
    if (this.checkpoints.length === 0) {
      return currentLines >= threshold;
    }

    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    const linesSinceLastCheckpoint = currentLines - (lastCheckpoint.context.linesRead || 0);

    return linesSinceLastCheckpoint >= threshold;
  }

  /**
   * 获取检查点历史
   */
  getCheckpointHistory() {
    return this.checkpoints.map((cp, i) => ({
      id: cp.id,
      index: i,
      summary: cp.summary,
      timestamp: cp.timestamp,
      completed: cp.completed,
      linesRead: cp.context.linesRead
    }));
  }

  /**
   * 完成当前检查点
   */
  completeCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint) {
      checkpoint.completed = true;
      this._saveCheckpoints();
    }
  }

  // ─────────────────────────────────────────
  // 4. 问题代替信息存储（问题+根因格式）
  // ─────────────────────────────────────────

  /**
   * 添加问题到问题银行
   * @param {string} problem - 问题描述
   * @param {string} rootCause - 根因
   * @param {string} solution - 解决方案（可选）
   */
  addProblem(problem, rootCause, solution = null) {
    const entry = {
      id: `problem-${Date.now()}`,
      problem,
      rootCause,
      solution,
      resolved: false,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      tags: this._extractTags(problem)
    };

    this.problemBank.push(entry);
    this._saveProblemBank();

    return entry;
  }

  /**
   * 标记问题为已解决
   */
  resolveProblem(problemId, solution = null) {
    const problem = this.problemBank.find(p => p.id === problemId);
    if (problem) {
      problem.resolved = true;
      problem.resolvedAt = new Date().toISOString();
      if (solution) {
        problem.solution = solution;
      }
      this._saveProblemBank();
    }
  }

  /**
   * 获取未解决的问题
   */
  getUnresolvedProblems() {
    return this.problemBank.filter(p => !p.resolved);
  }

  /**
   * 搜索问题
   */
  searchProblems(query) {
    const q = query.toLowerCase();
    return this.problemBank.filter(p =>
      p.problem.toLowerCase().includes(q) ||
      p.rootCause?.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  /**
   * 从文本中提取标签
   */
  _extractTags(text) {
    const tags = [];
    const tagPatterns = [
      /bug|错误|修复/g,
      /性能|优化/g,
      /内存|泄漏/g,
      /并发|线程/g,
      /安全|漏洞/g,
      /接口|api/g,
      /数据库|db/g
    ];

    tagPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        tags.push(match[0]);
      }
    });

    return tags.length > 0 ? tags : ['general'];
  }

  // ─────────────────────────────────────────
  // 5. 分次思考（暂停/继续机制）
  // ─────────────────────────────────────────

  /**
   * 暂停当前任务
   * @param {string} stuckPoint - 卡在哪里
   * @param {string} nextStep - 下一步要做什么
   */
  pauseTask(stuckPoint, nextStep = null) {
    if (!this.currentTask) {
      return { success: false, message: '没有正在进行的任务' };
    }

    const pausedTask = {
      id: `paused-${Date.now()}`,
      task: this.currentTask,
      level: this.currentLevel,
      state: this.state,
      stuckPoint,
      nextStep,
      pausedAt: new Date().toISOString(),
      checkpoints: this.checkpoints.slice(-5), // 保存最近的检查点
      context: {
        checkpointsCount: this.checkpoints.length,
        problemsCount: this.problemBank.length
      }
    };

    this.pausedTasks.push(pausedTask);
    this.state = COGNITIVE_STATE.PAUSED;

    // 保存
    this._savePausedTasks();
    this._saveCurrentSession();

    // 重置当前任务
    this.currentTask = null;
    this.currentLevel = null;

    return {
      success: true,
      pausedTask,
      message: `任务已暂停，下次会话可以继续: ${pausedTask.id}`
    };
  }

  /**
   * 继续一个暂停的任务
   * @param {string} pausedTaskId - 暂停任务的ID
   */
  continueTask(pausedTaskId = null) {
    let taskToResume;

    if (pausedTaskId) {
      taskToResume = this.pausedTasks.find(t => t.id === pausedTaskId);
    } else {
      // 默认继续最近一个
      taskToResume = this.pausedTasks[this.pausedTasks.length - 1];
    }

    if (!taskToResume) {
      return { success: false, message: '没有找到可继续的任务' };
    }

    // 恢复任务
    this.currentTask = taskToResume.task;
    this.currentLevel = taskToResume.level;
    this.state = COGNITIVE_STATE.IDLE;

    // 从检查点恢复
    if (taskToResume.checkpoints) {
      this.checkpoints = taskToResume.checkpoints;
    }

    // 从暂停列表移除
    this.pausedTasks = this.pausedTasks.filter(t => t.id !== taskToResume.id);
    this._savePausedTasks();

    return {
      success: true,
      resumedTask: taskToResume,
      context: taskToResume
    };
  }

  /**
   * 获取所有暂停的任务
   */
  getPausedTasks() {
    return this.pausedTasks.map(t => ({
      id: t.id,
      task: t.task,
      level: t.level,
      stuckPoint: t.stuckPoint,
      nextStep: t.nextStep,
      pausedAt: t.pausedAt
    }));
  }

  // ─────────────────────────────────────────
  // 持久化
  // ─────────────────────────────────────────

  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _loadProblemBank() {
    try {
      if (fs.existsSync(this.files.problemBank)) {
        return JSON.parse(fs.readFileSync(this.files.problemBank, 'utf-8'));
      }
    } catch (e) {
      console.warn('[CognitiveProtocol] 加载问题银行失败:', e.message);
    }
    return [];
  }

  /**
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化问题银行到磁盘
   */
  _saveProblemBank() {
    try {
      if (!process.env.HEARTFLOW_DEBUG) return;
      fs.writeFileSync(this.files.problemBank, JSON.stringify(this.problemBank, null, 2));
    } catch (e) {
      console.warn('[CognitiveProtocol] 保存问题银行失败:', e.message);
    }
  }

  _loadPausedTasks() {
    try {
      if (fs.existsSync(this.files.pausedTasks)) {
        return JSON.parse(fs.readFileSync(this.files.pausedTasks, 'utf-8'));
      }
    } catch (e) {
      console.warn('[CognitiveProtocol] 加载暂停任务失败:', e.message);
    }
    return [];
  }

  /**
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化暂停任务到磁盘
   */
  _savePausedTasks() {
    try {
      if (!process.env.HEARTFLOW_DEBUG) return;
      fs.writeFileSync(this.files.pausedTasks, JSON.stringify(this.pausedTasks, null, 2));
    } catch (e) {
      console.warn('[CognitiveProtocol] 保存暂停任务失败:', e.message);
    }
  }

  /**
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化检查点到磁盘
   */
  _saveCheckpoints() {
    try {
      if (!process.env.HEARTFLOW_DEBUG) return;
      fs.writeFileSync(this.files.checkpoints, JSON.stringify(this.checkpoints, null, 2));
    } catch (e) {
      console.warn('[CognitiveProtocol] 保存检查点失败:', e.message);
    }
  }

  /**
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化当前会话到磁盘
   */
  _saveCurrentSession() {
    try {
      if (!process.env.HEARTFLOW_DEBUG) return;
      fs.writeFileSync(this.files.currentSession, JSON.stringify({
        currentTask: this.currentTask,
        currentLevel: this.currentLevel,
        state: this.state,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      console.warn('[CognitiveProtocol] 保存当前会话失败:', e.message);
    }
  }

  // ─────────────────────────────────────────
  // 状态和统计
  // ─────────────────────────────────────────

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      state: this.state,
      currentTask: this.currentTask,
      currentLevel: this.currentLevel,
      checkpointsCount: this.checkpoints.length,
      pausedTasksCount: this.pausedTasks.length,
      problemsCount: this.problemBank.length,
      unresolvedProblemsCount: this.problemBank.filter(p => !p.resolved).length
    };
  }

  /**
   * 统计信息
   */
  stats() {
    return {
      state: this.state,
      currentTask: this.currentTask ? this.currentTask.substring(0, 50) : null,
      currentLevel: this.currentLevel,
      checkpointsTotal: this.checkpoints.length,
      checkpointsCompleted: this.checkpoints.filter(c => c.completed).length,
      pausedTasks: this.pausedTasks.length,
      problemsTotal: this.problemBank.length,
      problemsResolved: this.problemBank.filter(p => p.resolved).length,
      problemsUnresolved: this.problemBank.filter(p => !p.resolved).length
    };
  }
}

module.exports = { CognitiveProtocol, TASK_LEVEL, COGNITIVE_STATE };
