# 行为目标追踪升级模式 — Behavior/Goal Tracking Upgrade Patterns

**适用模块类型**：行为追踪/目标管理模块。核心操作为创建目标、记录事件（成功/失败）、维护连续天数（streak）、里程碑检测、进展报告。

**典型特征**：
- 有一个 `createGoal({ name, targetDays })` 创建方法
- 核心方法 `record(goalId, { type })` 记录事件并维护连续天数
- 使用简单的 JSON 文件持久化
- 无数据验证、无状态管理、无搜索/过滤
- 所有目标永远 active，无完成/归档概念

## 标准升级清单

### 1. 数据验证与消毒层

防御 XSS、路径遍历、类型错误。

```javascript
function _sanitize(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').slice(0, maxLen);
}

function _validateGoalInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return { valid: false, errors: ['Input must be an object'] };
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0)
    errors.push('Goal name is required');
  if (input.name && input.name.length > 100) errors.push('Goal name max 100 characters');
  if (input.targetDays !== undefined) {
    const days = Number(input.targetDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650)
      errors.push('targetDays must be 1-3650');
  }
  return { valid: errors.length === 0, errors };
}
```

### 2. 目标状态枚举

替换简单的"active/无状态"为完整状态机：

```javascript
const GOAL_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',    // streak >= targetDays
  ARCHIVED: 'archived',
  DISCARDED: 'discarded',    // 软删除
  STALE: 'stale'             // 超过 N 天无活动
};
```

### 3. 自动完成检测（加载时 + 记录时）

双重检测确保目标完成不被遗漏：

**加载时**：`_maintenance()` 扫描所有 active 目标，`streak >= targetDays` 自动标记 completed
**记录时**：`record()` 中每次成功记录后立即检查，完成后阻止新记录

### 4. 陈旧检测与自动清理

90 天无活动的目标自动标记为 stale，防止遗忘目标无限堆积。

```javascript
const STALE_DAYS = 90;
if ((now - lastActivity) > STALE_DAYS * 24 * 60 * 60 * 1000) {
  g.status = GOAL_STATUS.STALE;
}
```

### 5. 数据量限制

防止无限增长：

| 限制 | 默认值 | 说明 |
|------|--------|------|
| MAX_GOALS | 100 | 总目标数上限，超限按最后活动时间修剪 |
| MAX_RECORDS_PER_GOAL | 10000 | 单目标记录上限 |
| STALE_DAYS | 90 | 超过此天数无活动的目标自动 stale |

### 6. 文件损坏恢复

```javascript
_tryRecovery() {
  // 1. 尝试 .bak 备份恢复
  // 2. 备份失败则重置为空数据
  // 3. 写回主文件确保一致性
}
```

每次 `save()` 前先 `fs.copyFileSync(dataFile, dataFile + '.bak')`。

### 7. 记录类型扩展

从 `success/failure` 扩展到更多类型：

| 类型 | 对 streak 影响 | 使用场景 |
|------|---------------|---------|
| success | +1 | 成功完成当日目标 |
| failure | 重置为 0 | 未完成目标 |
| skip | 不变 | 跳过一天（合法休息） |
| checkin | 不变 | 仅签到，不计数 |

### 8. 统计引擎

```javascript
getStats() {
  return {
    totalGoals,
    active, completed, archived, discarded,
    totalRecords, totalSuccesses, totalFailures,
    overallSuccessRate,
    averageActiveStreak,
    categories: { 'health': { total, active, completed }, ... }
  };
}
```

### 9. 搜索/过滤/查询

```javascript
queryGoals({ status, category, name, sortBy, limit, offset })
```

**排序选项**：createdAt / streak / progress / name / lastActivity
**过滤维度**：status（支持数组）、category（精确匹配）、name（子串匹配）
**分页**：limit + offset + total 元数据

### 10. 软删除与恢复

```javascript
deleteGoal(id, hard = false)  // 默认软删除 → status = DISCARDED
reviveGoal(id)                // 从 discarded/stale/archived 恢复为 active
```

### 11. 向后兼容与旧数据迁移

```javascript
importLegacy(data) {
  // 补全缺失字段：status, createdAt, totalSuccesses, totalFailures
  // 去重：按 id 跳过已存在目标
}
```

**加载时自动补全**：遍历所有目标，补全 `status`、`createdAt` 等字段。

### 12. 里程碑系统

在标准天数到达时自动记录成就：

```
标准里程碑：3, 7, 14, 21, 30, 60, 90, 100, 180, 365 天
```

每次成功记录时检查，重复到达不重复记录。

## 典型升级示例

### behavior-tracker.js (3506B → 18507B)

**原模块**：`createGoal` + `record`(success/failure) + `getProgress` + `formatProgress`

**升级后新增**：
| 方法 | 说明 |
|------|------|
| `_validateGoalInput()` | 输入验证层 |
| `_sanitize()` | XSS 消毒 |
| `_maintenance()` | 自动完成/陈旧/数量限制 |
| `_tryRecovery()` | 文件损坏恢复 |
| `deleteGoal(id, hard)` | 软/硬删除 |
| `reviveGoal(id)` | 恢复已废弃目标 |
| `queryGoals(filters)` | 搜索/过滤/分页 |
| `getStats()` | 统计分析 |
| `formatStats()` | 格式化统计报告 |
| `importLegacy(data)` | 旧数据迁移 |

**内部升级**：
- 5 种状态枚举（active/completed/archived/discarded/stale）
- 4 种记录类型（success/failure/skip/checkin）
- 10 级里程碑
- 自动备份 + 损坏恢复
- 10 种数据限制/容量保护
- 向后兼容旧数据格式

## 验证测试要点

```javascript
// 1. 输入验证 — 空名称拒绝
r = tracker.createGoal({ name: '', targetDays: -1 });
assert(r.ok === false);

// 2. 自动完成 — 达到 targetDays 自动 completed
g = tracker.createGoal({ name: 'test', targetDays: 3 });
for (let i = 0; i < 3; i++) tracker.record(g.goal.id, { type: 'success' });
p = tracker.getProgress(g.goal.id);
assert(p.status === 'completed');

// 3. 软删除与恢复
tracker.deleteGoal(g.goal.id);
assert(tracker.queryGoals({ status: 'discarded' }).total > 0);
tracker.reviveGoal(g.goal.id);
assert(tracker.getProgress(g.goal.id).status === 'active');

// 4. 搜索
r = tracker.queryGoals({ name: 'test' });
assert(r.total > 0);

// 5. 统计
s = tracker.getStats();
assert(s.totalGoals > 0);
assert(typeof s.overallSuccessRate === 'number');

// 6. 无效记录类型
r = tracker.record(g.goal.id, { type: 'invalid' });
assert(r.ok === false);

// 7. 文件损坏恢复 — 手动损坏文件后 load() 应自动恢复
```
