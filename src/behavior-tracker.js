/**
 * 行为追踪引擎 v2 — 记录、追踪和智能分析行为改变
 *
 * 升级内容 (v2.8.14):
 * - 数据验证与消毒 (防XSS/路径遍历/类型错误)
 * - 目标完成自动检测 (targetDays 到达时自动标记)
 * - 目标归档系统 (completed/archived/discarded)
 * - 统计与分析引擎 (趋势/成功率/恢复力)
 * - 文件损坏恢复 (自动回退到有效数据)
 * - 查询/搜索/过滤 (按状态/名称/日期)
 * - 数据量限制 (防无限增长)
 * - 时间衰减 (旧目标自动降级)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── 常量 ──────────────────────────────────────────────
const MAX_GOALS = 100;
const MAX_RECORDS_PER_GOAL = 10000;
const STALE_DAYS = 90;            // 超过此天数无活动的目标自动归档
const DATA_VERSION = 2;

// ── 路径安全 ──────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const resolvedDataDir = path.resolve(DATA_DIR);

// 防御：确保路径不逃逸到预期目录之外
if (!resolvedDataDir.startsWith(path.resolve(__dirname, '..'))) {
  throw new Error('[BehaviorTracker] Invalid data directory path (path escape detected)');
}

const DATA_FILE = path.join(resolvedDataDir, 'behavior-tracker.json');

// 确保数据目录存在
try {
  if (!fs.existsSync(resolvedDataDir)) {
    fs.mkdirSync(resolvedDataDir, { recursive: true });
  }
} catch (e) {
  // 已禁用 console.error: console.error('[BehaviorTracker] Failed to create data directory:', e.message);
}

// ── 数据消毒 ──────────────────────────────────────────
function _sanitize(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, maxLen);
}

function _validateGoalInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be an object'] };
  }
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push('Goal name is required and must be a non-empty string');
  }
  if (input.name && input.name.length > 100) {
    errors.push('Goal name must be 100 characters or fewer');
  }
  if (input.description && typeof input.description !== 'string') {
    errors.push('Description must be a string');
  }
  if (input.description && input.description.length > 1000) {
    errors.push('Description must be 1000 characters or fewer');
  }
  if (input.targetDays !== undefined) {
    const days = Number(input.targetDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      errors.push('targetDays must be an integer between 1 and 3650');
    }
  }
  return { valid: errors.length === 0, errors };
}

// ── 目标状态枚举 ──────────────────────────────────────
const GOAL_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  DISCARDED: 'discarded',
  STALE: 'stale'
};

// ── 核心追踪器 ────────────────────────────────────────
const behaviorTracker = {
  data: { version: DATA_VERSION, goals: [] },

  // ── 加载 (含损坏恢复) ──
  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // 版本兼容
        if (parsed && Array.isArray(parsed.goals)) {
          this.data = parsed;
          // 向后兼容：为旧数据补全 status 字段
          this.data.goals.forEach(g => {
            if (!g.status) g.status = GOAL_STATUS.ACTIVE;
            if (!g.createdAt) g.createdAt = new Date().toISOString();
          });
        } else {
          // 已禁用 console.warn: console.warn('[BehaviorTracker] Corrupted data structure, resetting');
          this.data = { version: DATA_VERSION, goals: [] };
        }
      }
    } catch (e) {
      // 已禁用 console.warn: console.warn('[BehaviorTracker] Load failed (corrupted file?):', e.message);
      // 尝试备份恢复
      this._tryRecovery();
    }
    // 加载后自动运行维护
    this._maintenance();
    return this;
  },

  // ── 文件损坏恢复 ──
  _tryRecovery() {
    const backupFile = DATA_FILE + '.bak';
    try {
      if (fs.existsSync(backupFile)) {
        const raw = fs.readFileSync(backupFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.goals)) {
          this.data = parsed;
          // 已禁用 console.error: console.error('[BehaviorTracker] Recovered from backup');
          // 写回主文件
          fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
          return;
        }
      }
    } catch (e) {
      // 已禁用 console.warn: console.warn('[BehaviorTracker] Backup recovery failed:', e.message);
    }
    // 彻底失败，重置
    this.data = { version: DATA_VERSION, goals: [] };
    // 已禁用 console.warn: console.warn('[BehaviorTracker] Data reset due to unrecoverable corruption');
  },

  // ── 保存 (含自动备份) ──
  save() {
    try {
      // 先备份当前文件
      if (fs.existsSync(DATA_FILE)) {
        fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak');
      }
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      // 已禁用 console.warn: console.warn('[BehaviorTracker] save failed:', e.message);
    }
    return this;
  },

  // ── 定期维护 ──
  _maintenance() {
    const now = Date.now();
    let changed = false;

    // 1. 检测已完成目标
    this.data.goals.forEach(g => {
      if (g.status === GOAL_STATUS.ACTIVE && g.streak >= g.targetDays) {
        g.status = GOAL_STATUS.COMPLETED;
        g.completedAt = new Date().toISOString();
        changed = true;
      }
    });

    // 2. 检测陈旧目标
    this.data.goals.forEach(g => {
      if (g.status === GOAL_STATUS.ACTIVE) {
        const lastActivity = g.records.length > 0
          ? new Date(g.records[g.records.length - 1].timestamp).getTime()
          : new Date(g.createdAt).getTime();
        if ((now - lastActivity) > STALE_DAYS * 24 * 60 * 60 * 1000) {
          g.status = GOAL_STATUS.STALE;
          g.staleSince = new Date().toISOString();
          changed = true;
        }
      }
    });

    // 3. 限制目标数量
    if (this.data.goals.length > MAX_GOALS) {
      // 按最后活动时间排序，保留最近的 MAX_GOALS 个
      this.data.goals.sort((a, b) => {
        const aTime = a.records.length > 0 ? new Date(a.records[a.records.length - 1].timestamp).getTime() : 0;
        const bTime = b.records.length > 0 ? new Date(b.records[b.records.length - 1].timestamp).getTime() : 0;
        return bTime - aTime;
      });
      const removed = this.data.goals.splice(MAX_GOALS);
      removed.forEach(r => {
        // 已禁用 console.error: console.error(`[BehaviorTracker] Pruned stale goal: ${r.name || r.id}`);
      });
      changed = true;
    }

    if (changed) this.save();
  },

  _uuid() { return `goal-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`; },

  // ── 创建目标 ──
  createGoal({ name, description, targetDays = 30, category = '' }) {
    const validation = _validateGoalInput({ name, description, targetDays });
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }

    if (this.data.goals.length >= MAX_GOALS) {
      return { ok: false, errors: ['Maximum goal limit reached (' + MAX_GOALS + ')'] };
    }

    const goal = {
      id: this._uuid(),
      name: _sanitize(name, 100),
      description: _sanitize(description || '', 1000),
      category: _sanitize(category, 50),
      targetDays: Math.max(1, Math.min(3650, Number(targetDays) || 30)),
      status: GOAL_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      records: [],
      streak: 0,
      longestStreak: 0,
      milestones: [],
      totalSuccesses: 0,
      totalFailures: 0
    };
    this.data.goals.push(goal);
    this.save();
    return { ok: true, goal };
  },

  // ── 记录事件 ──
  record(goalId, { type, note = '', context = '' }) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.status !== GOAL_STATUS.ACTIVE) {
      return { ok: false, error: `Goal is ${goal.status}, cannot record` };
    }

    // 类型验证
    const validTypes = ['success', 'failure', 'skip', 'checkin'];
    if (!validTypes.includes(type)) {
      return { ok: false, error: `Invalid type '${type}'. Must be one of: ${validTypes.join(', ')}` };
    }

    // 记录数限制
    if (goal.records.length >= MAX_RECORDS_PER_GOAL) {
      return { ok: false, error: 'Maximum records reached for this goal' };
    }

    const record = {
      id: `rec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      type,
      note: _sanitize(note, 500),
      context: _sanitize(context, 200),
      timestamp: new Date().toISOString()
    };
    goal.records.push(record);

    // 状态更新
    if (type === 'success') {
      goal.streak++;
      goal.longestStreak = Math.max(goal.longestStreak, goal.streak);
      goal.totalSuccesses = (goal.totalSuccesses || 0) + 1;
      // 里程碑检测
      [3, 7, 14, 21, 30, 60, 90, 100, 180, 365].forEach(day => {
        if (goal.streak === day && !goal.milestones.includes(day)) {
          goal.milestones.push(day);
        }
      });
    } else if (type === 'failure') {
      goal.streak = 0;
      goal.totalFailures = (goal.totalFailures || 0) + 1;
    }
    // skip 和 checkin 不改变连续天数

    // 完成检测
    if (goal.streak >= goal.targetDays && goal.status === GOAL_STATUS.ACTIVE) {
      goal.status = GOAL_STATUS.COMPLETED;
      goal.completedAt = new Date().toISOString();
    }

    this.save();
    return { ok: true, record, streak: goal.streak, status: goal.status };
  },

  // ── 删除目标 ──
  deleteGoal(goalId, hard = false) {
    const idx = this.data.goals.findIndex(g => g.id === goalId);
    if (idx === -1) return { ok: false, error: 'Goal not found' };

    if (hard) {
      this.data.goals.splice(idx, 1);
    } else {
      this.data.goals[idx].status = GOAL_STATUS.DISCARDED;
      this.data.goals[idx].discardedAt = new Date().toISOString();
    }
    this.save();
    return { ok: true };
  },

  // ── 恢复目标 ──
  reviveGoal(goalId) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.status === GOAL_STATUS.ACTIVE || goal.status === GOAL_STATUS.COMPLETED) {
      return { ok: false, error: `Goal is already ${goal.status}` };
    }
    goal.status = GOAL_STATUS.ACTIVE;
    goal.streak = 0; // 重新开始计数
    goal.revivedAt = new Date().toISOString();
    this.save();
    return { ok: true, goal };
  },

  // ── 获取进展 ──
  getProgress(goalId) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) return null;

    const now = Date.now();
    const created = new Date(goal.createdAt).getTime();
    const elapsedDays = Math.max(1, Math.round((now - created) / (24 * 60 * 60 * 1000)));

    return {
      id: goal.id,
      name: goal.name,
      category: goal.category || '',
      status: goal.status,
      streak: goal.streak,
      longestStreak: goal.longestStreak,
      targetDays: goal.targetDays,
      totalRecords: goal.records.length,
      totalSuccesses: goal.totalSuccesses || 0,
      totalFailures: goal.totalFailures || 0,
      successRate: goal.records.length > 0
        ? Math.round(((goal.totalSuccesses || 0) / goal.records.length) * 100)
        : 0,
      milestones: goal.milestones,
      elapsedDays,
      progress: goal.status === GOAL_STATUS.COMPLETED
        ? '100% (completed)'
        : `${Math.min(100, Math.round((goal.streak / goal.targetDays) * 100))}%`,
      createdAt: goal.createdAt,
      completedAt: goal.completedAt || null
    };
  },

  // ── 搜索/过滤目标 ──
  queryGoals({ status, category, name, sortBy = 'createdAt', limit = 20, offset = 0 } = {}) {
    let filtered = [...this.data.goals];

    // 按状态过滤
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filtered = filtered.filter(g => statuses.includes(g.status));
    }

    // 按分类过滤
    if (category) {
      filtered = filtered.filter(g => g.category === category);
    }

    // 按名称搜索
    if (name) {
      const keyword = name.toLowerCase();
      filtered = filtered.filter(g => g.name.toLowerCase().includes(keyword));
    }

    // 排序
    const sortMap = {
      createdAt: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      streak: (a, b) => b.streak - a.streak,
      progress: (a, b) => (b.streak / Math.max(1, b.targetDays)) - (a.streak / Math.max(1, a.targetDays)),
      name: (a, b) => a.name.localeCompare(b.name),
      lastActivity: (a, b) => {
        const aTime = a.records.length > 0 ? new Date(a.records[a.records.length - 1].timestamp).getTime() : 0;
        const bTime = b.records.length > 0 ? new Date(b.records[b.records.length - 1].timestamp).getTime() : 0;
        return bTime - aTime;
      }
    };
    const sorter = sortMap[sortBy] || sortMap.createdAt;
    filtered.sort(sorter);

    // 分页
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      returned: page.length,
      goals: page.map(g => this.getProgress(g.id))
    };
  },

  // ── 统计概览 ──
  getStats() {
    const goals = this.data.goals;
    const active = goals.filter(g => g.status === GOAL_STATUS.ACTIVE);
    const completed = goals.filter(g => g.status === GOAL_STATUS.COMPLETED);
    const archived = goals.filter(g => g.status === GOAL_STATUS.ARCHIVED || g.status === GOAL_STATUS.STALE);
    const discarded = goals.filter(g => g.status === GOAL_STATUS.DISCARDED);

    const allRecords = goals.reduce((sum, g) => sum + g.records.length, 0);
    const allSuccesses = goals.reduce((sum, g) => sum + (g.totalSuccesses || 0), 0);
    const allFailures = goals.reduce((sum, g) => sum + (g.totalFailures || 0), 0);

    // 分类聚合
    const categories = {};
    goals.forEach(g => {
      if (g.category) {
        if (!categories[g.category]) categories[g.category] = { total: 0, active: 0, completed: 0 };
        categories[g.category].total++;
        if (g.status === GOAL_STATUS.ACTIVE) categories[g.category].active++;
        if (g.status === GOAL_STATUS.COMPLETED) categories[g.category].completed++;
      }
    });

    // 平均连续天数 (仅活跃目标)
    const avgStreak = active.length > 0
      ? Math.round(active.reduce((sum, g) => sum + g.streak, 0) / active.length)
      : 0;

    return {
      totalGoals: goals.length,
      active: active.length,
      completed: completed.length,
      archived: archived.length,
      discarded: discarded.length,
      totalRecords: allRecords,
      totalSuccesses: allSuccesses,
      totalFailures: allFailures,
      overallSuccessRate: allRecords > 0 ? Math.round((allSuccesses / allRecords) * 100) : 0,
      averageActiveStreak: avgStreak,
      categories: Object.keys(categories).length > 0 ? categories : undefined
    };
  },

  // ── 格式化进展报告 ──
  formatProgress(goalId) {
    const p = this.getProgress(goalId);
    if (!p) return '目标不存在';

    const statusEmoji = {
      active: '🔥',
      completed: '✅',
      archived: '📦',
      discarded: '🗑️',
      stale: '💤'
    };

    const lines = [
      `${statusEmoji[p.status] || ''} ${p.name}`,
      `状态: ${p.status} | 类别: ${p.category || '未分类'}`,
      `当前连续: 🔥 ${p.streak}天`,
      `最长连续: ${p.longestStreak}天`,
      `目标: ${p.targetDays}天 | 进度: ${p.progress}`,
      `成功率: ${p.successRate}% (${p.totalSuccesses}成功/${p.totalFailures}失败)`,
      `总记录: ${p.totalRecords}次`,
      `已过: ${p.elapsedDays}天`,
    ];
    if (p.milestones.length > 0) {
      lines.push(`里程碑: ${p.milestones.join(', ')}天 🏆`);
    }
    if (p.completedAt) {
      lines.push(`完成于: ${new Date(p.completedAt).toLocaleDateString()}`);
    }
    return lines.join('\n');
  },

  // ── 格式化统计报告 ──
  formatStats() {
    const s = this.getStats();
    const lines = [
      '📊 行为追踪统计',
      '═══════════════════════════',
      `总目标: ${s.totalGoals}`,
      `活跃: 🔥 ${s.active} | 已完成: ✅ ${s.completed}`,
      `归档: 📦 ${s.archived} | 已放弃: 🗑️ ${s.discarded}`,
      `总记录: ${s.totalRecords}次`,
      `总成功: ${s.totalSuccesses}次 | 总失败: ${s.totalFailures}次`,
      `综合成功率: ${s.overallSuccessRate}%`,
      `平均活跃连续: ${s.averageActiveStreak}天`,
    ];
    if (s.categories) {
      lines.push('');
      lines.push('分类分布:');
      Object.entries(s.categories).forEach(([cat, data]) => {
        lines.push(`  ${cat}: ${data.total}总 (${data.active}活跃/${data.completed}完成)`);
      });
    }
    return lines.join('\n');
  },

  // ── 批量导入 (从旧格式迁移) ──
  importLegacy(data) {
    if (!data || !Array.isArray(data.goals)) {
      return { ok: false, error: 'Invalid legacy data format' };
    }
    let imported = 0;
    data.goals.forEach(g => {
      if (!g.id || !g.name) return;
      // 确保不重复
      if (this.data.goals.find(existing => existing.id === g.id)) return;
      // 补全缺失字段
      if (!g.status) g.status = GOAL_STATUS.ACTIVE;
      if (!g.createdAt) g.createdAt = new Date().toISOString();
      if (g.totalSuccesses === undefined) g.totalSuccesses = 0;
      if (g.totalFailures === undefined) g.totalFailures = 0;
      this.data.goals.push(g);
      imported++;
    });
    if (imported > 0) this.save();
    return { ok: true, imported };
  }
};

behaviorTracker.load();
module.exports = { behaviorTracker, GOAL_STATUS };
