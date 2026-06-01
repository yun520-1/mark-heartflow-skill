/**
 * 任务管道 (Task Pipeline) v1.0.0 - 精简版
 *
 * 心虫的认知核心：接收任务 → 分析 → 规划 → 认知验证
 * 已移除执行层（agents/executor），专注认知处理
 */

const { IdentityCore } = require('../identity/identity-core');

class TaskPipeline {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();

    // 身份核心
    this.identityCore = new IdentityCore(this.rootPath);

    // 当前任务状态
    this.currentTask = null;
    this.pipelineState = 'idle';  // idle | analyzing | planning | verifying | completed | failed

    // 执行历史
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * 初始化
   */
  async initialize() {
    // 启动身份核心
    this.identityCore.boot();
    console.log('[TaskPipeline] 初始化完成');
    console.log('[TaskPipeline] 身份:', this.identityCore.getIdentitySummary());
  }

  /**
   * 处理用户任务
   */
  async handleTask(taskInput) {
    const taskId = `task-${Date.now()}`;
    const startTime = Date.now();

    this.currentTask = {
      id: taskId,
      input: taskInput,
      state: 'analyzing',
      startTime
    };

    // 记录到历史
    this._recordToHistory({
      type: 'start',
      taskId,
      input: taskInput,
      timestamp: new Date().toISOString()
    });

    try {
      // 阶段 1: 分析
      this.pipelineState = 'analyzing';
      const analysis = await this._analyzeTask(taskInput);
      this.currentTask.analysis = analysis;

      // 阶段 2: 规划
      this.pipelineState = 'planning';
      const plan = await this._planTask(taskInput, analysis);
      this.currentTask.plan = plan;

      // 阶段 3: 验证（认知层面）
      this.pipelineState = 'verifying';
      const verification = await this._verifyResult({ analysis, plan });
      this.currentTask.verification = verification;

      // 完成
      this.pipelineState = 'completed';
      this.currentTask.state = 'completed';
      this.currentTask.verification = verification;

      this._recordToHistory({
        type: 'completed',
        taskId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      });

      return {
        success: true,
        taskId,
        analysis,
        plan,
        verification
      };

    } catch (error) {
      this.pipelineState = 'failed';
      this.currentTask.state = 'failed';
      this.currentTask.error = error.message;

      this._recordToHistory({
        type: 'failed',
        taskId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        taskId,
        error: error.message
      };
    }
  }

  /**
   * 阶段 1: 分析任务
   */
  async _analyzeTask(taskInput) {
    console.log('[TaskPipeline] 阶段 1: 分析任务');
    const text = typeof taskInput === 'string' ? taskInput : (taskInput.text || taskInput.description || JSON.stringify(taskInput));

    return {
      text,
      type: this._classifyTaskType(text),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 阶段 2: 规划任务
   */
  async _planTask(taskInput, analysis) {
    console.log('[TaskPipeline] 阶段 2: 规划任务');

    return {
      skipPlanning: false,
      plan: {
        type: analysis.type,
        approach: 'cognitive',
        steps: []
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 阶段 3: 验证结果（认知层面）
   */
  async _verifyResult({ analysis, plan }) {
    console.log('[TaskPipeline] 阶段 3: 认知验证');

    const verification = {
      success: true,
      verified: true,
      timestamp: new Date().toISOString(),
      checks: {
        analysisValid: !!analysis && !!analysis.text,
        planValid: !!plan,
        identityConsistent: this.identityCore ? true : false
      }
    };

    return verification;
  }

  /**
   * 任务类型分类
   */
  _classifyTaskType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('代码') || lower.includes('code') || lower.includes('编程')) return 'coding';
    if (lower.includes('搜索') || lower.includes('search') || lower.includes('查询')) return 'search';
    if (lower.includes('写作') || lower.includes('write') || lower.includes('创作')) return 'writing';
    if (lower.includes('分析') || lower.includes('analyze')) return 'analysis';
    if (lower.includes('计划') || lower.includes('plan')) return 'planning';
    return 'general';
  }

  /**
   * 记录历史
   */
  _recordToHistory(record) {
    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      pipelineState: this.pipelineState,
      currentTask: this.currentTask,
      historyCount: this.history.length
    };
  }

  /**
   * 获取历史
   */
  getHistory(filter) {
    let history = this.history;
    if (filter) {
      if (filter.type) {
        history = history.filter(h => h.type === filter.type);
      }
      if (filter.since) {
        history = history.filter(h => new Date(h.timestamp) >= new Date(filter.since));
      }
    }
    return history;
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      pipeline: 'healthy',
      state: this.pipelineState,
      identityCore: this.identityCore ? this.identityCore.healthCheck() : { status: 'no_identity' }
    };
  }
}

module.exports = { TaskPipeline };
