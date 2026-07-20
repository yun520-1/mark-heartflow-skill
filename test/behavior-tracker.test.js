/**
 * behavior-tracker.js 单元测试
 * 覆盖之前未测试的核心模块（reaudit N5：新模块无单测）。
 * 通过 monkeypatch save() 避免写盘污染真实数据；用真实单例 + 内存 data 验证业务闭环。
 */
const ROOT = process.cwd();

function run({ test, assertEqual, assertTrue, assertFalse }) {
  const { behaviorTracker, GOAL_STATUS } = require('../src/behavior-tracker.js');

  test('GOAL_STATUS 枚举完整', () => {
    assertEqual(GOAL_STATUS.ACTIVE, 'active');
    assertEqual(GOAL_STATUS.COMPLETED, 'completed');
    assertEqual(GOAL_STATUS.ARCHIVED, 'archived');
    assertEqual(GOAL_STATUS.DISCARDED, 'discarded');
    assertEqual(GOAL_STATUS.STALE, 'stale');
  });

  test('createGoal 成功返回 {ok:true,goal}', () => {
    behaviorTracker.save = () => {}; // 防写盘
    behaviorTracker.data = { version: '1.0', goals: [] };
    const r = behaviorTracker.createGoal({ name: 'test-goal', description: 'unit', targetDays: 7 });
    assertTrue(r.ok === true);
    assertEqual(r.goal.name, 'test-goal');
    assertEqual(r.goal.status, GOAL_STATUS.ACTIVE);
    assertEqual(behaviorTracker.data.goals.length, 1);
  });

  test('createGoal 拒绝空名返回 ok:false', () => {
    behaviorTracker.save = () => {};
    behaviorTracker.data = { version: '1.0', goals: [] };
    const r = behaviorTracker.createGoal({ name: '' });
    assertTrue(r.ok === false);
    assertTrue(Array.isArray(r.errors) && r.errors.length > 0);
  });

  test('record + getProgress 累计 records', () => {
    behaviorTracker.save = () => {};
    behaviorTracker.data = { version: '1.0', goals: [] };
    const { goal } = behaviorTracker.createGoal({ name: 'p-goal', targetDays: 10 });
    const rec1 = behaviorTracker.record(goal.id, { type: 'checkin', note: 'd1' });
    const rec2 = behaviorTracker.record(goal.id, { type: 'checkin', note: 'd2' });
    assertTrue(rec1.ok === true && rec2.ok === true);
    const prog = behaviorTracker.getProgress(goal.id);
    assertEqual(prog.totalRecords, 2);
  });

  test('record 拒绝无效类型', () => {
    behaviorTracker.save = () => {};
    behaviorTracker.data = { version: '1.0', goals: [] };
    const { goal } = behaviorTracker.createGoal({ name: 'r-goal' });
    const bad = behaviorTracker.record(goal.id, { type: 'bogus' });
    assertTrue(bad.ok === false);
  });

  test('getStats 返回统计结构', () => {
    behaviorTracker.save = () => {};
    behaviorTracker.data = { version: '1.0', goals: [] };
    behaviorTracker.createGoal({ name: 's1' });
    behaviorTracker.createGoal({ name: 's2' });
    const stats = behaviorTracker.getStats();
    assertEqual(stats.totalGoals, 2);
    assertTrue(typeof stats.categories === 'object' || stats.categories === undefined);
  });
}

module.exports = run;
