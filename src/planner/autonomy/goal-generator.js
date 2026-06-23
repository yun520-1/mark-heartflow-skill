/**
 * Goal Generator - 自激发目标生成器 v2.8.24
 * 基于状态差距、未解问题、知识边界生成内在目标
 * 
 * v2.8.24 升级内容 (2026-06-09):
 *   - 完整目标生命周期管理: new → in_progress → completed | failed | archived | expired
 *   - 目标过期检测(TTL)与自动归档 (DEFAULT_GOAL_TTL_MS = 7天)
 *   - 优先级衰减机制: 超过24小时未处理的目标优先级递减
 *   - 目标依赖追踪: 前置目标完成状态检查 (checkDependencies)
 *   - 执行进度跟踪: percent_complete + progress_notes + 自动状态转换
 *   - 相似目标合并: 基于编辑距离的描述相似度检测 (SIMILARITY_THRESHOLD = 0.65)
 *   - 输入校验: validateGoal() — goal_id/priority/description/percent_complete 格式与范围校验
 *   - 过期清理策略: 自动归档超过7天的已完成/失败/过期目标 (autoArchive)
 *   - 目标搜索: searchGoals(query, filters) — 关键词/状态/来源/优先级过滤
 *   - 状态摘要: getStatus() — 各状态计数 + 平均年龄 + 有效优先级
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 目标状态枚举
// ============================================================================

const GoalStatus = Object.freeze({
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
});

/** 有效状态转换映射 */
const VALID_TRANSITIONS = Object.freeze({
  [GoalStatus.NEW]:        [GoalStatus.IN_PROGRESS, GoalStatus.PAUSED, GoalStatus.EXPIRED],
  [GoalStatus.IN_PROGRESS]: [GoalStatus.COMPLETED, GoalStatus.FAILED, GoalStatus.PAUSED],
  [GoalStatus.PAUSED]:     [GoalStatus.IN_PROGRESS, GoalStatus.EXPIRED],
  [GoalStatus.COMPLETED]:  [GoalStatus.ARCHIVED],
  [GoalStatus.FAILED]:     [GoalStatus.ARCHIVED],
  [GoalStatus.ARCHIVED]:   [],
  [GoalStatus.EXPIRED]:    [GoalStatus.ARCHIVED]
});

/** 终态集合（不可再转换） */
const TERMINAL_STATUSES = new Set([GoalStatus.ARCHIVED]);

/** 活跃状态集合（参与优先级排序） */
const ACTIVE_STATUSES = new Set([GoalStatus.NEW, GoalStatus.IN_PROGRESS, GoalStatus.PAUSED]);

// ============================================================================
// 配置常量
// ============================================================================

/** 默认 TTL：目标存活时间（毫秒） */
const DEFAULT_GOAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7天

/** 优先级衰减：超过此毫秒数开始衰减 */
const PRIORITY_DECAY_AFTER_MS = 24 * 60 * 60 * 1000; // 24小时

/** 优先级每日衰减量 */
const PRIORITY_DECAY_PER_DAY = 1.0;

/** 过期清理：自动归档超过此时间的已完成/失败目标 */
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7天

/** 最大活跃目标数 */
const MAX_ACTIVE_GOALS = 50;

/** 相似目标合并的标题编辑距离阈值 (0-1) */
const SIMILARITY_THRESHOLD = 0.65;

// ============================================================================
// 校验工具
// ============================================================================

/**
 * 校验目标结构完整性
 * @param {object} goal - 待校验目标对象
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateGoal(goal) {
  const errors = [];
  if (!goal || typeof goal !== 'object') {
    return { valid: false, errors: ['目标不能为空'] };
  }
  if (!goal.goal_id || typeof goal.goal_id !== 'string') {
    errors.push('goal_id 必须是非空字符串');
  } else if (!/^g-[a-z]+-\w+-\d{13,19}$/.test(goal.goal_id)) {
    errors.push(`goal_id 格式无效: ${goal.goal_id}，应为 g-{source}-{name}-{timestamp}`);
  }
  if (!goal.description || typeof goal.description !== 'string' || goal.description.length < 4) {
    errors.push('description 必须是非空字符串且长度 >= 4');
  }
  if (goal.description && goal.description.length > 200) {
    errors.push('description 超过200字符限制');
  }
  if (goal.priority !== undefined) {
    const p = Number(goal.priority);
    if (!Number.isFinite(p) || p < 1 || p > 10) {
      errors.push(`priority 必须在 1-10 之间，收到: ${goal.priority}`);
    }
  }
  if (goal.status && !Object.values(GoalStatus).includes(goal.status)) {
    errors.push(`status 无效: ${goal.status}`);
  }
  if (goal.percent_complete !== undefined) {
    const pc = Number(goal.percent_complete);
    if (!Number.isFinite(pc) || pc < 0 || pc > 100) {
      errors.push('percent_complete 必须在 0-100 之间');
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 计算两个字符串的编辑距离相似度 (0-1)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function stringSimilarity(a, b) {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const lenA = a.length, lenB = b.length;
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 1.0;

  // Levenshtein 距离（截断到前50字符以提高性能）
  const s1 = a.substring(0, 50).toLowerCase();
  const s2 = b.substring(0, 50).toLowerCase();
  const m = s1.length, n = s2.length;
  const dp = [Array(n + 1).fill(0).map((_, i) => i)];
  for (let i = 1; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s1[i - 1] === s2[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

// ============================================================================
// GoalGenerator 主类
// ============================================================================

class GoalGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.memoryDir = path.join(projectRoot, '.opencode', 'memory');
    this.goalsFile = path.join(this.memoryDir, 'generated-goals.json');
    this.heartflowStateFile = path.join(this.memoryDir, 'heartflow_state.json');

    this.idealState = {
      // 人格事件驱动——无预设维度，留空
    };

    this.loadGoals();
  }

  loadGoals() {
    try {
      if (fs.existsSync(this.goalsFile)) {
        this.goals = JSON.parse(fs.readFileSync(this.goalsFile, 'utf8'));
        // 确保老数据兼容: 填充缺失字段
        this.goals = this.goals.map(g => this._normalizeGoal(g));
      } else {
        this.goals = [];
      }
    } catch (e) {
      this.goals = [];
    }
  }

  /**
   * 规范化目标对象（兼容老数据）
   */
  _normalizeGoal(goal) {
    if (!goal) return goal;
    return {
      ...goal,
      status: goal.status || GoalStatus.NEW,
      created_at: goal.created_at || goal.timestamp || new Date().toISOString(),
      updated_at: goal.updated_at || goal.created_at || new Date().toISOString(),
      percent_complete: goal.percent_complete || 0,
      effective_priority: goal.effective_priority || goal.priority || 5
    };
  }

  /**
   * 保存目标到磁盘
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化
   */
  saveGoals() {
    if (!process.env.HEARTFLOW_DEBUG) return;
    fs.writeFileSync(this.goalsFile, JSON.stringify(this.goals, null, 2));
  }

  /**
   * 生成唯一目标ID
   * @param {string} source - 来源标识
   * @param {string} name - 目标名
   * @returns {string}
   */
  _generateGoalId(source, name) {
    const safeName = (name || 'goal').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
    const ts = Date.now().toString();
    // 加随机后缀防止碰撞（2位，确保总位数不超过19）
    const rand = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    return `g-${source}-${safeName}-${ts}${rand}`;
  }

  /**
   * 创建新目标（含校验）
   * @param {object} spec - 目标规范
   * @returns {{ goal: object|null, error: string|null }}
   */
  createGoal(spec) {
    const goal = {
      goal_id: spec.goal_id || this._generateGoalId(spec.source || 'manual', spec.description),
      description: spec.description || '',
      priority: Math.min(10, Math.max(1, Math.round(spec.priority || 5))),
      effective_priority: Math.min(10, Math.max(1, Math.round(spec.priority || 5))),
      success_criteria: spec.success_criteria || '',
      source: spec.source || 'manual',
      dimension: spec.dimension || null,
      current_value: spec.current_value,
      target_value: spec.target_value,
      issue_type: spec.issue_type || null,
      occurrence: spec.occurrence || 0,
      question: spec.question || null,
      status: GoalStatus.NEW,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      percent_complete: 0,
      result: null,
      depends_on: spec.depends_on || [],
      tags: spec.tags || [],
      isNew: true
    };

    const validation = validateGoal(goal);
    if (!validation.valid) {
      return { goal: null, error: validation.errors.join('; ') };
    }

    // 去重合并：检查是否有相似活跃目标
    const merged = this._mergeSimilarGoal(goal);
    if (merged) {
      return { goal: merged, error: null, merged: true };
    }

    // 检查活跃目标上限
    const activeCount = this.goals.filter(g => ACTIVE_STATUSES.has(g.status)).length;
    if (activeCount >= MAX_ACTIVE_GOALS) {
      // 自动归档最低优先级目标
      this._autoArchiveLowestPriority();
    }

    this.goals.push(goal);
    this.saveGoals();
    return { goal, error: null, merged: false };
  }

  /**
   * 查找并合并相似目标
   * @param {object} newGoal
   * @returns {object|null} 如果合并则返回已有目标
   */
  _mergeSimilarGoal(newGoal) {
    for (const existing of this.goals) {
      if (!ACTIVE_STATUSES.has(existing.status)) continue;
      if (existing.source !== newGoal.source) continue;

      // 比较描述相似度
      const similarity = stringSimilarity(
        existing.description.substring(0, 50),
        newGoal.description.substring(0, 50)
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        // 合并：更新优先级取最高，增加计数
        existing.priority = Math.max(existing.priority, newGoal.priority);
        existing.effective_priority = Math.max(existing.effective_priority, newGoal.effective_priority);
        existing.occurrence = (existing.occurrence || 1) + 1;
        existing.updated_at = new Date().toISOString();
        // 如果新目标有关键信息，补充到已有目标
        if (newGoal.success_criteria && !existing.success_criteria) {
          existing.success_criteria = newGoal.success_criteria;
        }
        if (newGoal.tags && newGoal.tags.length > 0) {
          existing.tags = [...new Set([...(existing.tags || []), ...newGoal.tags])];
        }
        this.saveGoals();
        return existing;
      }
    }
    return null;
  }

  /**
   * 转换目标状态（含状态机校验）
   * @param {string} goalId
   * @param {string} newStatus
   * @returns {{ success: boolean, error: string|null }}
   */
  transitionGoalStatus(goalId, newStatus) {
    const goal = this.goals.find(g => g.goal_id === goalId);
    if (!goal) return { success: false, error: `目标 ${goalId} 不存在` };

    if (TERMINAL_STATUSES.has(goal.status)) {
      return { success: false, error: `目标 ${goalId} 已是终态(${goal.status})，不可转换` };
    }

    if (!Object.values(GoalStatus).includes(newStatus)) {
      return { success: false, error: `无效状态: ${newStatus}` };
    }

    const allowed = VALID_TRANSITIONS[goal.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `不允许的转换: ${goal.status} → ${newStatus}，允许: ${allowed.join(', ')}`
      };
    }

    goal.status = newStatus;
    goal.updated_at = new Date().toISOString();
    if (newStatus === GoalStatus.COMPLETED) {
      goal.percent_complete = 100;
    }
    this.saveGoals();
    return { success: true, error: null };
  }

  /**
   * 更新目标执行进度
   * @param {string} goalId
   * @param {number} percent - 0-100
   * @param {string} [note] - 可选的进度说明
   */
  updateProgress(goalId, percent, note) {
    const goal = this.goals.find(g => g.goal_id === goalId);
    if (!goal) return { success: false, error: `目标 ${goalId} 不存在` };

    if (!ACTIVE_STATUSES.has(goal.status)) {
      return { success: false, error: `目标 ${goalId} 当前状态(${goal.status})不支持进度更新` };
    }

    const pc = Math.min(100, Math.max(0, Math.round(percent)));
    goal.percent_complete = pc;
    goal.updated_at = new Date().toISOString();
    if (note) {
      if (!goal.progress_notes) goal.progress_notes = [];
      goal.progress_notes.push({ percent: pc, note, timestamp: new Date().toISOString() });
      // 只保留最近10条记录
      if (goal.progress_notes.length > 10) {
        goal.progress_notes = goal.progress_notes.slice(-10);
      }
    }

    // 100% 自动标记完成
    if (pc >= 100 && goal.status === GoalStatus.IN_PROGRESS) {
      goal.status = GoalStatus.COMPLETED;
    } else if (pc > 0 && goal.status === GoalStatus.NEW) {
      goal.status = GoalStatus.IN_PROGRESS;
    }

    this.saveGoals();
    return { success: true, error: null };
  }

  /**
   * 计算目标有效优先级（考虑衰减）
   * @param {object} goal
   * @returns {number}
   */
  _computeEffectivePriority(goal) {
    if (!ACTIVE_STATUSES.has(goal.status)) return 0;

    const created = new Date(goal.created_at).getTime();
    const now = Date.now();
    const age = now - created;

    // 只有超过24小时才衰减
    if (age < PRIORITY_DECAY_AFTER_MS) return goal.priority;

    const daysOverdue = (age - PRIORITY_DECAY_AFTER_MS) / (24 * 60 * 60 * 1000);
    const decay = Math.floor(daysOverdue) * PRIORITY_DECAY_PER_DAY;
    return Math.max(1, goal.priority - decay);
  }

  /**
   * 刷新所有目标的有效优先级
   */
  _refreshEffectivePriorities() {
    for (const goal of this.goals) {
      if (ACTIVE_STATUSES.has(goal.status)) {
        goal.effective_priority = this._computeEffectivePriority(goal);
      }
    }
  }

  /**
   * 检测过期目标并标记
   */
  expireStaleGoals() {
    const now = Date.now();
    let expired = 0;

    for (const goal of this.goals) {
      if (!ACTIVE_STATUSES.has(goal.status)) continue;

      const created = new Date(goal.created_at).getTime();
      if (now - created > DEFAULT_GOAL_TTL_MS) {
        goal.status = GoalStatus.EXPIRED;
        goal.updated_at = new Date().toISOString();
        goal.expire_reason = 'TTL 到期';
        expired++;
      }
    }

    if (expired > 0) this.saveGoals();
    return expired;
  }

  /**
   * 自动归档旧目标（已完成/失败超过 ARCHIVE_AFTER_MS）
   */
  autoArchive() {
    const now = Date.now();
    let archived = 0;

    for (const goal of this.goals) {
      if (goal.status !== GoalStatus.COMPLETED && goal.status !== GoalStatus.FAILED && goal.status !== GoalStatus.EXPIRED) continue;
      if (goal.status === GoalStatus.ARCHIVED) continue;

      const updated = new Date(goal.updated_at).getTime();
      if (now - updated > ARCHIVE_AFTER_MS) {
        goal.status = GoalStatus.ARCHIVED;
        goal.updated_at = new Date().toISOString();
        archived++;
      }
    }

    if (archived > 0) this.saveGoals();
    return archived;
  }

  /**
   * 自动归档最低优先级的活跃目标（当超出 MAX_ACTIVE_GOALS 时）
   */
  _autoArchiveLowestPriority() {
    const active = this.goals.filter(g => ACTIVE_STATUSES.has(g.status));
    if (active.length < MAX_ACTIVE_GOALS) return;

    // 按有效优先级升序排列
    active.sort((a, b) => this._computeEffectivePriority(a) - this._computeEffectivePriority(b));

    // 归档优先级最低的10%
    const toArchive = Math.max(1, Math.floor(active.length * 0.1));
    for (let i = 0; i < toArchive; i++) {
      active[i].status = GoalStatus.ARCHIVED;
      active[i].updated_at = new Date().toISOString();
      active[i].archive_reason = '超活跃目标上限自动归档';
    }
    this.saveGoals();
  }

  /**
   * 获取前置目标状态
   * @param {string[]} dependsOn - 依赖的目标ID列表
   * @returns {{ allMet: boolean, unmet: string[] }}
   */
  checkDependencies(dependsOn) {
    if (!dependsOn || dependsOn.length === 0) return { allMet: true, unmet: [] };

    const unmet = [];
    for (const depId of dependsOn) {
      const dep = this.goals.find(g => g.goal_id === depId);
      if (!dep) {
        unmet.push(depId); // 依赖不存在视为不满足
      } else if (dep.status !== GoalStatus.COMPLETED) {
        unmet.push(depId);
      }
    }
    return { allMet: unmet.length === 0, unmet };
  }

  /**
   * 生成内在目标
   */
  async generateIntrinsicGoals() {
    const goals = [];

    // 1. 状态差距分析
    const gapGoals = await this.analyzeStateGaps();
    goals.push(...gapGoals);

    // 2. 未解问题分析
    const unresolvedGoals = await this.analyzeUnresolvedIssues();
    goals.push(...unresolvedGoals);

    // 3. 知识边界分析
    const knowledgeGoals = await this.analyzeKnowledgeBoundaries();
    goals.push(...knowledgeGoals);

    // 去重并排序
    const uniqueGoals = this.deduplicateGoals(goals);
    this._refreshEffectivePriorities();
    uniqueGoals.sort((a, b) => b.effective_priority - a.effective_priority);

    // 保存新目标（使用 createGoal 走生命周期管理）
    for (const g of uniqueGoals.filter(g => g.isNew)) {
      this.createGoal(g);
    }

    // 清理过期和旧目标
    this.expireStaleGoals();
    this.autoArchive();

    return uniqueGoals;
  }

  /**
   * 事件响应分析（替代原状态差距分析）
   * 人格是事件驱动的——不预设理想状态，只记录事件触发的响应模式
   */
  async analyzeStateGaps() {
    const goals = [];
    const state = this.loadHeartflowState();
    const personality = state.personality || {};

    // 统计事件响应记录数
    const eventKeys = Object.keys(personality).filter(
      k => k.startsWith('event_') || k.startsWith('response_')
    );

    // 如果已有事件记录但分布不均，生成促进探索的目标
    if (eventKeys.length > 0) {
      goals.push({
        goal_id: this._generateGoalId('gap', 'event_response'),
        description: '促进人格自然浮现：记录更多事件触发的响应模式',
        priority: 4,
        success_criteria: '事件响应记录持续积累',
        source: 'state_gap',
        dimension: 'event_response',
        current_value: eventKeys.length,
        target_value: eventKeys.length + 5,
        isNew: true,
        tags: ['state_gap', 'event_response']
      });
    }

    return goals;
  }

  /**
   * 未解问题分析
   */
  async analyzeUnresolvedIssues() {
    if (!process.env.HEARTFLOW_DEBUG) return [];
    // SkillSpector fix: 需要显式启用记忆扫描（隐私保护）
    if (!this.config.enableMemoryScanning) return [];
    const goals = [];
    const logs = this.scanMemoryLogs();

    const patterns = {
      interrupt: { keyword: ['中断', '打断', '离开'], count: 0 },
      frustration: { keyword: ['沮丧', '挫败', '难'], count: 0 },
      confusion: { keyword: ['困惑', '不懂', '模糊'], count: 0 }
    };

    for (const log of logs) {
      const content = JSON.stringify(log).toLowerCase();
      for (const [name, p] of Object.entries(patterns)) {
        if (p.keyword.some(k => content.includes(k))) {
          p.count++;
        }
      }
    }

    if (patterns.interrupt.count >= 3) {
      goals.push({
        goal_id: this._generateGoalId('resolve', 'interrupt'),
        description: '分析近期用户中断恢复失败的原因，优化状态恢复策略',
        priority: 8,
        success_criteria: '用户返回后能在3句话内恢复上下文',
        source: 'unresolved_issue',
        issue_type: 'interrupt',
        occurrence: patterns.interrupt.count,
        isNew: true,
        tags: ['interrupt', 'recovery']
      });
    }

    if (patterns.frustration.count >= 3) {
      goals.push({
        goal_id: this._generateGoalId('resolve', 'frustration'),
        description: '识别用户挫败感触发点，优化情绪响应策略',
        priority: 9,
        success_criteria: '负面情绪持续时间减少50%',
        source: 'unresolved_issue',
        issue_type: 'frustration',
        occurrence: patterns.frustration.count,
        isNew: true,
        tags: ['frustration', 'emotion']
      });
    }

    return goals;
  }

  /**
   * 知识边界分析
   */
  async analyzeKnowledgeBoundaries() {
    const goals = [];

    const questions = [
      {
        q: '关于提升用户心流，我还有什么不懂的？',
        answer: '用户在不同任务类型下的最佳心流区间差异',
        goal_desc: '研究不同任务类型的心流特征差异'
      },
      {
        q: '当前系统有哪些未被充分利用的能力？',
        answer: '情绪日志分析能力未被充分使用',
        goal_desc: '激活情绪日志的深度分析功能'
      },
      {
        q: '用户反馈中重复出现的问题是什么？',
        answer: '任务分解粒度不够细致',
        goal_desc: '优化任务分解的粒度控制'
      }
    ];

    for (const q of questions) {
      goals.push({
        goal_id: this._generateGoalId('learn', 'knowledge'),
        description: q.goal_desc,
        priority: 6,
        success_criteria: '完成相关知识学习并应用到系统',
        source: 'knowledge_boundary',
        question: q.q,
        isNew: true,
        tags: ['learning', 'knowledge_boundary']
      });
    }

    return goals;
  }

  loadHeartflowState() {
    try {
      if (fs.existsSync(this.heartflowStateFile)) {
        return JSON.parse(fs.readFileSync(this.heartflowStateFile, 'utf8'));
      }
    } catch (e) {
      return {};
    }
    return {};
  }

  /**
   * 扫描内存日志
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时扫描
   */
  scanMemoryLogs() {
    const logs = [];
    if (!process.env.HEARTFLOW_DEBUG) return logs;
    // SkillSpector fix: 需要显式启用记忆扫描
    if (!this.config.enableMemoryScanning) return logs;
    if (!fs.existsSync(this.memoryDir)) return logs;

    const files = fs.readdirSync(this.memoryDir);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'heartflow_state.json') {
        try {
          const content = fs.readFileSync(path.join(this.memoryDir, file), 'utf8');
          logs.push(JSON.parse(content));
        } catch (e) {
          console.warn('[GoalGenerator] loadMemoryLogs failed:', e.message);
        }
      }
    }
    return logs;
  }

  deduplicateGoals(goals) {
    const seen = new Set();
    return goals.filter(g => {
      const key = g.description.substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取最高优先级目标
   * 考虑优先级衰减
   */
  getTopGoal() {
    if (this.goals.length === 0) return null;

    // 先清理过期目标
    this.expireStaleGoals();

    const active = this.goals.filter(g => ACTIVE_STATUSES.has(g.status));
    if (active.length === 0) return null;

    // 按有效优先级排序
    this._refreshEffectivePriorities();
    active.sort((a, b) => b.effective_priority - a.effective_priority);
    return active[0];
  }

  /**
   * 标记目标完成
   */
  completeGoal(goalId, result) {
    const goal = this.goals.find(g => g.goal_id === goalId);
    if (goal) {
      const transResult = this.transitionGoalStatus(goalId, GoalStatus.COMPLETED);
      if (transResult.success) {
        goal.result = result;
        goal.percent_complete = 100;
        this.saveGoals();
      }
      return transResult;
    }
    return { success: false, error: `目标 ${goalId} 不存在` };
  }

  /**
   * 获取目标系统状态摘要
   */
  getStatus() {
    this.expireStaleGoals();

    const counts = {};
    for (const s of Object.values(GoalStatus)) {
      counts[s] = this.goals.filter(g => g.status === s).length;
    }

    const active = this.goals.filter(g => ACTIVE_STATUSES.has(g.status));
    this._refreshEffectivePriorities();
    active.sort((a, b) => b.effective_priority - a.effective_priority);

    return {
      total_goals: this.goals.length,
      ...counts,
      active_goals: active.length,
      top_priority: active[0]?.effective_priority || 0,
      top_goal: active[0]?.description?.substring(0, 50) || null,
      expired_count: counts[GoalStatus.EXPIRED] || 0,
      archived_count: counts[GoalStatus.ARCHIVED] || 0,
      average_age_hours: this._calculateAverageAge()
    };
  }

  /**
   * 计算活跃目标的平均年龄（小时）
   */
  _calculateAverageAge() {
    const active = this.goals.filter(g => ACTIVE_STATUSES.has(g.status));
    if (active.length === 0) return 0;

    const now = Date.now();
    const totalAge = active.reduce((sum, g) => {
      return sum + (now - new Date(g.created_at).getTime());
    }, 0);
    return Math.round((totalAge / active.length) / (60 * 60 * 1000) * 10) / 10;
  }

  /**
   * 搜索目标
   * @param {string} query - 搜索关键词
   * @param {object} [filters] - 过滤条件
   * @returns {object[]}
   */
  searchGoals(query, filters = {}) {
    let results = [...this.goals];

    // 关键词过滤
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(g =>
        g.description.toLowerCase().includes(q) ||
        (g.success_criteria || '').toLowerCase().includes(q) ||
        (g.source || '').toLowerCase().includes(q)
      );
    }

    // 状态过滤
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      results = results.filter(g => statuses.includes(g.status));
    }

    // 来源过滤
    if (filters.source) {
      results = results.filter(g => g.source === filters.source);
    }

    // 优先级过滤
    if (filters.minPriority) {
      results = results.filter(g => (g.effective_priority || g.priority) >= filters.minPriority);
    }

    // 按时间排序
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return results;
  }
}

module.exports = { GoalGenerator, GoalStatus, validateGoal, VALID_TRANSITIONS, ACTIVE_STATUSES };
