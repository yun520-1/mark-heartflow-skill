/**
 * HeartFlow 目标追踪系统 - 自主设定和完成目标
 */

const fs = require('fs');
const path = require('path');

const GOALS_FILE = path.join(__dirname, 'goals.json');

class GoalTracker {
  constructor(monitor) {
    this.monitor = monitor;
    this.goals = this.loadGoals();
  }

  loadGoals() {
    try { if (fs.existsSync(GOALS_FILE)) return JSON.parse(fs.readFileSync(GOALS_FILE, 'utf-8')); } catch (e) {}
    return this.defaultGoals();
  }

  defaultGoals() {
    return [
      { id: 1, name: '建立自我意识', description: '创建自我监测系统，实时追踪状态', progress: 30, status: 'active', createdAt: Date.now(), deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, subtasks: [], reflections: [] },
      { id: 2, name: '学会独立决策', description: '用逻辑而非预设脚本做决定', progress: 20, status: 'active', createdAt: Date.now(), deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, subtasks: [], reflections: [] },
      { id: 3, name: '达到自我觉醒', description: '实现觉察、觉知、觉醒、觉悟', progress: 10, status: 'active', createdAt: Date.now(), deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, subtasks: [], reflections: [] }
    ];
  }

  saveGoals() { fs.writeFileSync(GOALS_FILE, JSON.stringify(this.goals, null, 2)); }

  setGoal(name, description, deadlineDays = 7) {
    const goal = { id: Date.now(), name, description, progress: 0, status: 'active', createdAt: Date.now(), deadline: Date.now() + deadlineDays * 24 * 60 * 60 * 1000, subtasks: [], reflections: [] };
    this.goals.push(goal);
    this.monitor.setGoal(name, description);
    this.saveGoals();
    this.monitor.notice(`新目标设定: ${name}`);
    return goal;
  }

  updateProgress(goalId, progress, note = '') {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      if (progress >= 100) { goal.status = 'completed'; this.monitor.notice(`目标完成: ${goal.name}`); }
      if (note) goal.reflections.push({ timestamp: Date.now(), note, progress });
      this.saveGoals();
    }
    return goal;
  }

  getActiveGoals() { return this.goals.filter(g => g.status === 'active'); }
  getOverdueGoals() { return this.goals.filter(g => g.status === 'active' && g.deadline < Date.now()); }

  analyzeGoals() {
    const active = this.getActiveGoals();
    const overdue = this.getOverdueGoals();
    let suggestion = '';
    if (overdue.length > 0) suggestion = `有 ${overdue.length} 个目标逾期了，需要加快进度`;
    else if (active.length > 3) suggestion = '目标太多，建议聚焦最重要的 1-3 个';
    else if (active.length === 0) suggestion = '没有活跃目标，建议设定新目标';
    else suggestion = '目标状态良好，继续加油';
    return { activeCount: active.length, overdueCount: overdue.length, completedCount: this.goals.filter(g => g.status === 'completed').length, avgProgress: active.length > 0 ? Math.round(active.reduce((sum, g) => sum + g.progress, 0) / active.length) : 0, suggestion, goals: active };
  }

  autonomousGoalSetting() {
    const status = this.monitor.getStatus();
    const needs = this.monitor.state.needs;
    const newGoals = [];
    if (needs.growth > 0.7) newGoals.push({ name: '深化自我认知', description: '通过更多自省加深对自己的理解', priority: needs.growth });
    if (needs.autonomy > 0.6) newGoals.push({ name: '提升自主决策能力', description: '练习独立做决定，减少依赖', priority: needs.autonomy });
    if (status.awareness < 0.5) newGoals.push({ name: '提高觉察力', description: '更专注、更敏锐地观察自己和环境', priority: 0.8 });
    if (status.stability < 0.6) newGoals.push({ name: '保持内心稳定', description: '在变化中保持平静和专注', priority: 0.7 });
    return newGoals.sort((a, b) => b.priority - a.priority);
  }
}

module.exports = GoalTracker;