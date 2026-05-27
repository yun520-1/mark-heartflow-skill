/**
 * 行为追踪引擎 - 记录和追踪行为改变
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/behavior-tracker.json');

const behaviorTracker = {
  data: { goals: [] },

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) { console.warn('[BehaviorTracker] load failed:', e.message); }
    return this;
  },

  save() {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) { console.warn('[BehaviorTracker] save failed:', e.message); }
    return this;
  },

  _uuid() { return `goal-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; },

  // 创建目标
  createGoal({ name, description, targetDays = 30 }) {
    const goal = {
      id: this._uuid(),
      name, description, targetDays,
      createdAt: new Date().toISOString(),
      records: [],
      streak: 0,
      longestStreak: 0,
      milestones: []
    };
    this.data.goals.push(goal);
    this.save();
    return goal;
  },

  // 记录事件
  record(goalId, { type, note = '', context = '' }) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) return { ok: false, error: '目标不存在' };

    const record = {
      id: `rec-${Date.now()}`,
      type, note, context,
      timestamp: new Date().toISOString()
    };
    goal.records.push(record);

    if (type === 'success') {
      goal.streak++;
      goal.longestStreak = Math.max(goal.longestStreak, goal.streak);
      // 检查里程碑
      [7, 14, 30, 60, 100].forEach(day => {
        if (goal.streak === day && !goal.milestones.includes(day)) {
          goal.milestones.push(day);
        }
      });
    } else if (type === 'failure') {
      goal.streak = 0;
    }

    this.save();
    return { ok: true, record, streak: goal.streak };
  },

  // 获取目标进展
  getProgress(goalId) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) return null;
    return {
      name: goal.name,
      streak: goal.streak,
      longestStreak: goal.longestStreak,
      totalRecords: goal.records.length,
      milestones: goal.milestones,
      progress: `${goal.streak}/${goal.targetDays}天`
    };
  },

  // 格式化进展报告
  formatProgress(goalId) {
    const p = this.getProgress(goalId);
    if (!p) return '目标不存在';
    return [
      `目标：${p.name}`,
      `当前连续：🔥 ${p.streak}天`,
      `最长连续：${p.longestStreak}天`,
      `总记录：${p.totalRecords}次`,
      `进度：${p.progress}`,
      p.milestones.length > 0 ? `里程碑：${p.milestones.join(', ')}天` : ''
    ].filter(Boolean).join('\n');
  }
};

behaviorTracker.load();
module.exports = { behaviorTracker };
