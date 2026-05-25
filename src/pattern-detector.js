/**
 * 行为模式检测器
 */
const patternDetector = {
  // 检测周规律
  detectWeeklyPattern(records) {
    const byDay = {};
    for (const r of records) {
      const d = new Date(r.timestamp).getDay();
      byDay[d] = (byDay[d] || 0) + 1;
    }
    const best = Object.entries(byDay).sort((a,b) => b[1]-a[1])[0];
    const days = ['周日','周一','周二','周三','周四','周五','周六'];
    return best ? { day: days[best[0]], count: best[1] } : null;
  },

  // 检测触发模式
  detectTriggerPattern(records) {
    const triggers = {};
    for (const r of records) {
      if (r.context) {
        const words = r.context.split(/[\s,]+/).slice(0, 3).join(' ');
        if (words) triggers[words] = (triggers[words] || 0) + 1;
      }
    }
    return Object.entries(triggers).sort((a,b)=>b[1]-a[1]).slice(0,3);
  },

  // 复发风险预警
  detectRelapseRisk(goal) {
    const recent = goal.records.slice(-5);
    const fails = recent.filter(r => r.type === 'failure').length;
    if (fails >= 3) return { risk: 'high', message: '连续失败较多，注意休息和调整策略' };
    if (fails >= 2) return { risk: 'medium', message: '有失败记录，关注触发因素' };
    return { risk: 'low', message: '状态稳定' };
  }
};

module.exports = { patternDetector };
