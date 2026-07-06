# 自主目标生成器升级模式 — Autonomous Goal Generator Upgrade Patterns

**适用模块类型**：自主目标生成/内在动机类模块。核心操作为基于状态差距、用户行为、知识边界**自动发现并生成**内在目标，非用户手动创建。

**与行为追踪类的区别**：
- 行为追踪（behavior-tracker）：用户手动创建目标，AI 记录进度 → 被动追踪
- 目标生成（goal-generator）：AI 自主发现目标并推动 → 主动生成
- 核心差异在于**谁来创建目标**（用户 vs AI）和**目标来源**（手动 vs 自动检测）

**典型特征**：
- `generateIntrinsicGoals()` 自动分析状态/行为/知识边界并生成目标
- `analyzeStateGaps()` 检测理想状态与现实差距
- `analyzeUnresolvedIssues()` 扫描日志发现未解决问题
- `analyzeKnowledgeBoundaries()` 识别知识盲区
- 有简单的去重机制（精确描述匹配）
- 目标只分 `isNew` 和 `completed` 两种状态
- 无优先级衰减、无过期、无依赖追踪

## 标准升级清单

### 1. 目标状态枚举 + 状态机转换映射

完整的状态生命周期管理：

```javascript
const GoalStatus = Object.freeze({
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
});

/** 合法状态转换映射 */
const VALID_TRANSITIONS = Object.freeze({
  [GoalStatus.NEW]:        [GoalStatus.IN_PROGRESS, GoalStatus.PAUSED, GoalStatus.EXPIRED],
  [GoalStatus.IN_PROGRESS]: [GoalStatus.COMPLETED, GoalStatus.FAILED, GoalStatus.PAUSED],
  [GoalStatus.PAUSED]:     [GoalStatus.IN_PROGRESS, GoalStatus.EXPIRED],
  [GoalStatus.COMPLETED]:  [GoalStatus.ARCHIVED],
  [GoalStatus.FAILED]:     [GoalStatus.ARCHIVED],
  [GoalStatus.ARCHIVED]:   [],
  [GoalStatus.EXPIRED]:    [GoalStatus.ARCHIVED]
});

/** 终态集合 */
const TERMINAL_STATUSES = new Set([GoalStatus.ARCHIVED]);

/** 活跃状态集合（参与优先级排序） */
const ACTIVE_STATUSES = new Set([GoalStatus.NEW, GoalStatus.IN_PROGRESS, GoalStatus.PAUSED]);
```

### 2. 状态转换守卫方法

```javascript
transitionGoalStatus(goalId, newStatus) {
  const goal = this.goals.find(g => g.goal_id === goalId);
  if (!goal) return { success: false, error: '目标不存在' };
  if (TERMINAL_STATUSES.has(goal.status)) {
    return { success: false, error: '已是终态，不可转换' };
  }
  const allowed = VALID_TRANSITIONS[goal.status] || [];
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `不允许的转换: ${goal.status} → ${newStatus}` };
  }
  goal.status = newStatus;
  goal.updated_at = new Date().toISOString();
  if (newStatus === GoalStatus.COMPLETED) goal.percent_complete = 100;
  this.save();
  return { success: true };
}
```

### 3. 输入校验系统

```javascript
function validateGoal(goal) {
  const errors = [];
  if (!goal || typeof goal !== 'object') return { valid: false, errors: ['目标不能为空'] };
  if (!/^g-[a-z]+-\w+-\d{13,19}$/.test(goal.goal_id)) {
    errors.push('goal_id 格式无效');
  }
  if (!goal.description || goal.description.length < 4) {
    errors.push('description 必须 >= 4 字符');
  }
  if (goal.description && goal.description.length > 200) {
    errors.push('description 超过200字符');
  }
  const p = Number(goal.priority);
  if (!Number.isFinite(p) || p < 1 || p > 10) {
    errors.push('priority 必须在 1-10 之间');
  }
  if (goal.percent_complete !== undefined) {
    const pc = Number(goal.percent_complete);
    if (!Number.isFinite(pc) || pc < 0 || pc > 100) {
      errors.push('percent_complete 必须在 0-100 之间');
    }
  }
  return { valid: errors.length === 0, errors };
}
```

### 4. 相似目标合并（基于编辑距离）

```javascript
_mergeSimilarGoal(newGoal) {
  for (const existing of this.goals) {
    if (!ACTIVE_STATUSES.has(existing.status)) continue;
    if (existing.source !== newGoal.source) continue;
    const similarity = stringSimilarity(
      existing.description.substring(0, 50),
      newGoal.description.substring(0, 50)
    );
    if (similarity >= SIMILARITY_THRESHOLD) {  // 0.65
      existing.priority = Math.max(existing.priority, newGoal.priority);
      existing.effective_priority = Math.max(existing.effective_priority, newGoal.effective_priority);
      existing.occurrence = (existing.occurrence || 1) + 1;
      return existing;
    }
  }
  return null;
}
```

Levenshtein 距离相似度函数（截断到50字符）：

```javascript
function stringSimilarity(a, b) {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
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
```

### 5. 优先级衰减系统

```javascript
_computeEffectivePriority(goal) {
  if (!ACTIVE_STATUSES.has(goal.status)) return 0;
  const age = Date.now() - new Date(goal.created_at).getTime();
  if (age < PRIORITY_DECAY_AFTER_MS) return goal.priority;  // 24h内不衰减
  const daysOverdue = (age - PRIORITY_DECAY_AFTER_MS) / (24 * 60 * 60 * 1000);
  const decay = Math.floor(daysOverdue) * PRIORITY_DECAY_PER_DAY;  // 1分/天
  return Math.max(1, goal.priority - decay);
}
```

### 6. 目标过期检测（TTL）

```javascript
expireStaleGoals() {
  const now = Date.now();
  let expired = 0;
  for (const goal of this.goals) {
    if (!ACTIVE_STATUSES.has(goal.status)) continue;
    if (now - new Date(goal.created_at).getTime() > DEFAULT_GOAL_TTL_MS) {  // 7天
      goal.status = GoalStatus.EXPIRED;
      goal.expire_reason = 'TTL 到期';
      expired++;
    }
  }
  return expired;
}
```

### 7. 自动归档旧目标

```javascript
autoArchive() {
  const now = Date.now();
  let archived = 0;
  for (const goal of this.goals) {
    if (goal.status === GoalStatus.ARCHIVED) continue;
    if (goal.status !== GoalStatus.COMPLETED && goal.status !== GoalStatus.FAILED && goal.status !== GoalStatus.EXPIRED) continue;
    if (now - new Date(goal.updated_at).getTime() > ARCHIVE_AFTER_MS) {  // 7天
      goal.status = GoalStatus.ARCHIVED;
      archived++;
    }
  }
  return archived;
}
```

### 8. 目标依赖追踪

```javascript
checkDependencies(dependsOn) {
  if (!dependsOn || dependsOn.length === 0) return { allMet: true, unmet: [] };
  const unmet = [];
  for (const depId of dependsOn) {
    const dep = this.goals.find(g => g.goal_id === depId);
    if (!dep || dep.status !== GoalStatus.COMPLETED) unmet.push(depId);
  }
  return { allMet: unmet.length === 0, unmet };
}
```

### 9. 执行进度跟踪

```javascript
updateProgress(goalId, percent, note) {
  const goal = this.goals.find(g => g.goal_id === goalId);
  if (!goal) return { success: false, error: '目标不存在' };
  if (!ACTIVE_STATUSES.has(goal.status)) return { success: false, error: '当前状态不支持进度更新' };
  const pc = Math.min(100, Math.max(0, Math.round(percent)));
  goal.percent_complete = pc;
  goal.updated_at = new Date().toISOString();
  if (note) {
    if (!goal.progress_notes) goal.progress_notes = [];
    goal.progress_notes.push({ percent: pc, note, timestamp: new Date().toISOString() });
    if (goal.progress_notes.length > 10) goal.progress_notes = goal.progress_notes.slice(-10);
  }
  if (pc >= 100 && goal.status === GoalStatus.IN_PROGRESS) goal.status = GoalStatus.COMPLETED;
  else if (pc > 0 && goal.status === GoalStatus.NEW) goal.status = GoalStatus.IN_PROGRESS;
  return { success: true };
}
```

### 10. 目标搜索与多维度过滤

```javascript
searchGoals(query, filters = {}) {
  let results = [...this.goals];
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(g =>
      g.description.toLowerCase().includes(q) ||
      (g.success_criteria || '').toLowerCase().includes(q) ||
      (g.source || '').toLowerCase().includes(q)
    );
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    results = results.filter(g => statuses.includes(g.status));
  }
  if (filters.source) results = results.filter(g => g.source === filters.source);
  if (filters.minPriority) results = results.filter(g => (g.effective_priority || g.priority) >= filters.minPriority);
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return results;
}
```

### 11. 防碰撞 ID 生成

```javascript
_generateGoalId(source, name) {
  const safeName = (name || 'goal').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `g-${source}-${safeName}-${ts}${rand}`;
}
```

### 12. 活动目标上限保护

```javascript
const activeCount = this.goals.filter(g => ACTIVE_STATUSES.has(g.status)).length;
if (activeCount >= MAX_ACTIVE_GOALS) {  // 50
  this._autoArchiveLowestPriority();  // 归档最低的10%
}
```

### 13. 状态摘要报告

```javascript
getStatus() {
  this.expireStaleGoals();
  const counts = {};
  for (const s of Object.values(GoalStatus)) counts[s] = this.goals.filter(g => g.status === s).length;
  const active = this.goals.filter(g => ACTIVE_STATUSES.has(g.status));
  this._refreshEffectivePriorities();
  active.sort((a, b) => b.effective_priority - a.effective_priority);
  return {
    total_goals: this.goals.length, ...counts,
    active_goals: active.length,
    top_priority: active[0]?.effective_priority || 0,
    top_goal: active[0]?.description?.substring(0, 50) || null,
    expired_count: counts[GoalStatus.EXPIRED] || 0,
    archived_count: counts[GoalStatus.ARCHIVED] || 0,
    average_age_hours: this._calculateAverageAge()
  };
}
```

## 典型升级示例

### goal-generator.js (8395B → 26249B)

**升级前**：`generateIntrinsicGoals()` + `analyzeStateGaps()` + `analyzeUnresolvedIssues()` + `analyzeKnowledgeBoundaries()` + 简单去重 + isNew/completed 状态

**升级后新增**：

| 组件 | 说明 |
|------|------|
| GoalStatus 枚举 | 7种状态 + 合法转换映射 + 终态/活跃态集合 |
| validateGoal() | 6维度校验（goal_id/description/priority/percent_complete/status） |
| createGoal() | 完整创建流程：校验 → 相似合并 → 上限保护 → 持久化 |
| transitionGoalStatus() | 带状态机校验的转换守卫 |
| updateProgress() | 进度跟踪 + 历史记录 + 自动状态转换 |
| _computeEffectivePriority() | 24小时后每天衰减1分 |
| expireStaleGoals() | 7天TTL自动过期 |
| autoArchive() | 7天无活动自动归档 |
| checkDependencies() | 前置目标完成检查 |
| searchGoals() | 关键词 + 4维度过滤 + 时间排序 |
| _mergeSimilarGoal() | 编辑距离相似度合并 |
| _generateGoalId() | 防碰撞ID生成 |
| getStatus() | 完整状态摘要 + 平均年龄 |

## 关键陷阱

### 1. 相似合并的激活状态过滤

相似合并时**必须只检查活跃目标**（ACTIVE_STATUSES）。如果检查所有目标（包括已完成的），会导致新生成的目标与旧的已完成目标合并，无法创建新目标。

### 2. 目标ID碰撞

使用纯 `Date.now()` 作为 ID 后缀可能在高速创建时碰撞。必须加随机后缀。

### 3. 优先级衰减的整数陷阱

衰减使用 `Math.floor(daysOverdue)` 计算，但 priority 可能变为浮点数。必须确保返回 `Math.max(1, ...)` 并 `Math.round()` 存储。

### 4. 过期 vs 归档的关系

过期（EXPIRED）和归档（ARCHIVED）是两个不同阶段：过期标记 TTL 到期，归档是等待一段时间后从活跃视图移除。不要直接跳到 ARCHIVED，给用户一个窗口期查看过期目标。

### 5. 进度更新的自动转换边界

先检查 100%（COMPLETED），再检查 > 0%（IN_PROGRESS），否则 100% 会先触发 IN_PROGRESS 再触发 COMPLETED。

### 6. 旧数据兼容

升级时必须处理缺少新字段的旧数据：`_normalizeGoal()` 补全 status/created_at/updated_at/percent_complete/effective_priority。

## 验证测试要点

```javascript
// 1. 空输入拒绝
assert(validateGoal(null).valid === false);

// 2. 有效目标通过
assert(validateGoal({ goal_id: 'g-test-v-1234567890123', description: 'test', priority: 5 }).valid === true);

// 3. 非法优先级拒绝
assert(validateGoal({ goal_id: 'g-test-v-1234567890123', description: 'test', priority: 15 }).valid === false);

// 4. 状态转换合法
const t1 = gg.transitionGoalStatus(id, GoalStatus.IN_PROGRESS);
assert(t1.success === true);

// 5. 状态转换非法
const t2 = gg.transitionGoalStatus(id, GoalStatus.ARCHIVED);
assert(t2.success === false);

// 6. 进度自动转换
gg.updateProgress(id, 100);
assert(goal.status === GoalStatus.COMPLETED);

// 7. 相似合并
const merged = gg.createGoal({ description: 'similar...', source: 'test' });
assert(merged.merged === true);

// 8. 优先级衰减
const eff = gg._computeEffectivePriority(goal);
assert(eff >= 1 && eff <= goal.priority);

// 9. 搜索过滤
const results = gg.searchGoals('keyword');
assert(Array.isArray(results));

// 10. 状态摘要
const status = gg.getStatus();
assert(status.total_goals > 0);
assert(typeof status.average_age_hours === 'number');
```
