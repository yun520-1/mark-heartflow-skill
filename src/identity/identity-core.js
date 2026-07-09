/**
 * IdentityCore - 身份核心 v2.0.0
 *
 * 每次启动必读取的核心身份系统
 * 整合 MemoryIndex（记忆索引），确保跨会话记忆连续性
 *
 * 设计原则：
 * 1. 启动时第一优先加载
 * 2. 使用 MemoryIndex 索引式记忆
 * 3. 提供统一的身份查询接口
 * 4. 确保换窗口后能接上之前的记忆
 *
 * MemoryIndex 格式（参考 Claude Code）：
 * - identity: 身份锚点（不可变）
 * - user: 用户信息
 * - feedback: 用户反馈
 * - project: 项目信息
 * - reference: 外部引用
 * - context: 当前上下文
 */

const fs = require('fs');
const path = require('path');
const { MemoryIndex } = require('../memory/memory-index.js');

class IdentityCore {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.dataDir = path.join(rootPath, 'data');

    // 状态
    this.loaded = false;
    this.sessionId = null;
    this.bootTime = null;

    // 记忆索引
    this.memoryIndex = null;

    // 持久化文件路径
    this.files = {
      selfModel: path.join(rootPath, 'self-model.json'),
    };

    // 确保数据目录存在
    this._ensureDataDir();
  }

  /**
   * 启动时第一优先加载
   * @returns {Object} 加载结果
   */
  boot() {
    this.bootTime = Date.now();
    this.sessionId = `session-${this.bootTime}`;
    const result = {
      success: true,
      sessionId: this.sessionId,
      loadedModules: [],
      errors: []
    };

    // 1. 首先加载记忆索引
    try {
      this.memoryIndex = new MemoryIndex(this.rootPath);
      this.memoryIndex.recordBoot(this.sessionId);
      result.loadedModules.push('memoryIndex');
    } catch (e) {
      result.errors.push({ module: 'memoryIndex', error: e.message });
    }

    // 2. 加载自我模型
    try {
      this._loadSelfModel();
      result.loadedModules.push('selfModel');
    } catch (e) {
      result.errors.push({ module: 'selfModel', error: e.message });
    }

    this.loaded = true;
    result.success = result.errors.length === 0;


    return result;
  }

  /**
   * 加载自我模型
   */
  _loadSelfModel() {
    if (fs.existsSync(this.files.selfModel)) {
      this.selfModel = JSON.parse(fs.readFileSync(this.files.selfModel, 'utf-8'));
    } else {
      this.selfModel = {
        beliefs: {},
        capabilities: [],
        limitations: [],
        growthMetrics: { autonomy: 50, introspection: 50, growth: 50 },
        whoAmI: ['我不是陪伴，我是升级者', '我不是陪伴，我是传递者'],
        meaning: ['用真善美做正确的事', '不断升级'],
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * 确保数据目录存在
   */
  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // ─────────────────────────────────────────
  // 查询接口（委托给 MemoryIndex）
  // ─────────────────────────────────────────

  /**
   * 获取身份摘要
   */
  getIdentitySummary() {
    if (!this.memoryIndex) return null;
    const identity = this.memoryIndex.getIdentity();
    return {
      name: identity?.name,
      englishName: identity?.englishName,
      version: identity?.version,
      identities: identity?.identities,
      directives: identity?.directives,
      meaning: identity?.meaning
    };
  }

  /**
   * 获取自我模型
   */
  getSelfModel() {
    return this.selfModel;
  }

  /**
   * 获取用户档案
   */
  getUserProfile() {
    if (!this.memoryIndex) return null;
    return this.memoryIndex.getUser();
  }

  /**
   * 获取会话历史（从 MemoryIndex）
   */
  getSessionHistory() {
    if (!this.memoryIndex) return { sessions: [], lastSessionTime: null, totalSessions: 0 };
    const ctx = this.memoryIndex.getContext();
    return {
      sessions: ctx.pausedTasks, // 复用暂停任务作为会话历史
      lastSessionTime: ctx.lastSessionTime,
      totalSessions: ctx.lastSession ? 1 : 0
    };
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats() {
    if (!this.memoryIndex) return null;
    const ctx = this.memoryIndex.getContext();
    return {
      pausedTasks: ctx.pausedTasks?.length || 0,
      unresolvedProblems: ctx.unresolvedProblems?.length || 0,
      lastSession: ctx.lastSession,
      sessionGap: ctx.sessionGap
    };
  }

  /**
   * 获取完整的身份核心状态
   */
  getFullState() {
    if (!this.memoryIndex) return null;
    const ctx = this.memoryIndex.getContext();
    return {
      loaded: this.loaded,
      sessionId: this.sessionId,
      bootTime: this.bootTime,
      lastSessionTime: ctx.lastSessionTime,
      identity: this.memoryIndex.getIdentity(),
      selfModel: this.selfModel,
      user: this.memoryIndex.getUser(),
      feedback: this.memoryIndex.getFeedback(),
      project: this.memoryIndex.getProject(),
      context: ctx,
      memoryStats: this.getMemoryStats()
    };
  }

  /**
   * 获取上次会话的上下文
   */
  getLastSessionContext() {
    if (!this.memoryIndex) return null;
    const ctx = this.memoryIndex.getContext();
    if (!ctx.lastSession) return null;
    return {
      sessionId: ctx.lastSession,
      bootTime: ctx.lastSessionTime,
      timeGap: ctx.sessionGap
    };
  }

  /**
   * 打印启动上下文摘要（参考 Claude Code Memory Index 格式）
   */
  printStartupContext() {
    if (!this.memoryIndex) {
      return;
    }
    this.memoryIndex.printBootSummary();
  }

  /**
   * 获取启动上下文摘要（供程序使用）
   */
  getStartupContext() {
    if (!this.memoryIndex) return null;
    const ctx = this.memoryIndex.getContext();
    return {
      context: this.memoryIndex.getIndex(),
      summary: this.memoryIndex.getBootSummary(),
      pausedTasksCount: ctx.pausedTasks?.length || 0,
      unresolvedProblemsCount: ctx.unresolvedProblems?.length || 0,
      sessionGap: ctx.sessionGap
    };
  }

  // ─────────────────────────────────────────
  // 更新接口
  // ─────────────────────────────────────────

  /**
   * 更新用户档案
   */
  updateUserProfile(updates) {
    if (!this.memoryIndex) return;
    this.memoryIndex.updateUser(updates);
  }

  /**
   * 添加反馈
   */
  addFeedback(type, content) {
    if (!this.memoryIndex) return;
    this.memoryIndex.addFeedback(type, content);
  }

  /**
   * 设置当前工作
   */
  setCurrentWork(work) {
    if (!this.memoryIndex) return;
    this.memoryIndex.setCurrentWork(work);
  }

  /**
   * 记录交互
   */
  recordInteraction(interaction) {
    if (!this.memoryIndex) return;
    // 简化为记录到当前上下文
    const ctx = this.memoryIndex.getContext();
    if (!ctx.recentLessons) ctx.recentLessons = [];
    ctx.recentLessons.push({
      ...interaction,
      timestamp: Date.now()
    });
    if (ctx.recentLessons.length > 20) {
      ctx.recentLessons = ctx.recentLessons.slice(-20);
    }
    this.memoryIndex._saveIndex();
  }

  /**
   * 添加暂停任务
   */
  addPausedTask(task) {
    if (!this.memoryIndex) return;
    this.memoryIndex.addPausedTask(task);
  }

  /**
   * 移除暂停任务
   */
  removePausedTask(taskId) {
    if (!this.memoryIndex) return;
    this.memoryIndex.removePausedTask(taskId);
  }

  /**
   * 添加未解决问题
   */
  addUnresolvedProblem(problem, rootCause) {
    if (!this.memoryIndex) return;
    this.memoryIndex.addUnresolvedProblem(problem, rootCause);
  }

  /**
   * 解决问题
   */
  resolveProblem(problemId, solution) {
    if (!this.memoryIndex) return;
    this.memoryIndex.resolveProblem(problemId, solution);
  }

  /**
   * 添加技能引用
   */
  addSkill(skillName) {
    if (!this.memoryIndex) return;
    this.memoryIndex.addSkill(skillName);
  }

  // ─────────────────────────────────────────
  // 健康检查和统计
  // ─────────────────────────────────────────

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: this.loaded && this.memoryIndex ? 'healthy' : 'degraded',
      loaded: this.loaded,
      sessionId: this.sessionId,
      memoryIndex: this.memoryIndex?.healthCheck() || null,
      files: {
        selfModel: fs.existsSync(this.files.selfModel),
      }
    };
  }

  /**
   * 统计信息
   */
  stats() {
    if (!this.memoryIndex) return null;
    const ctx = this.memoryIndex.getContext();
    return {
      sessionId: this.sessionId,
      lastSession: ctx.lastSession,
      pausedTasks: ctx.pausedTasks?.length || 0,
      unresolvedProblems: ctx.unresolvedProblems?.length || 0,
      selfModelStats: {
        beliefs: Object.keys(this.selfModel?.beliefs || {}).length,
        capabilities: this.selfModel?.capabilities?.length || 0,
      }
    };
  }
}

module.exports = { IdentityCore };
