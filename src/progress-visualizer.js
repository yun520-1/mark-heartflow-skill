/**
 * 进展可视化器
 */
const progressVisualizer = {
  formatStreak(streak) {
    if (streak === 0) return '○';
    if (streak < 7) return '🔥' + '○'.repeat(streak - 1);
    return '🔥'.repeat(Math.min(7, Math.floor(streak / 7))) + '○'.repeat(streak % 7);
  },

  generateProgressReport(goal) {
    const lines = [
      `=== ${goal.name} 进展报告 ===`,
      '',
      `当前连续：🔥 ${goal.streak}天`,
      `最长连续：${goal.longestStreak}天`,
      `目标天数：${goal.targetDays}天`,
      `完成进度：${Math.round(goal.streak / goal.targetDays * 100)}%`,
      '',
    ];
    if (goal.milestones.length > 0) {
      lines.push(`里程碑：${goal.milestones.join('天 → ')}天 ✅`);
    }
    lines.push('');
    return lines.join('\n');
  },

  generateEncouragement(goal) {
    const pct = goal.streak / goal.targetDays;
    if (pct >= 1) return '🎉 目标达成！你已经完成了连续' + goal.streak + '天的坚持。';
    if (pct >= 0.5) return '💪 已过半，继续保持！你已经坚持了' + goal.streak + '天。';
    if (goal.streak >= 7) return '🌱 一周连续！养成习惯的路上，你已经走了7天。';
    if (goal.streak >= 1) return '🌱 开始了！' + goal.streak + '天是建立任何习惯的第一步。';
    return '每一天都是新的开始。从今天开始记录吧。';
  }
};

module.exports = { progressVisualizer };
