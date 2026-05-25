/**
 * 连续天数计算器
 */
const streakCounter = {
  calculate(records, goalId) {
    const successRecords = records
      .filter(r => r.type === 'success')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (successRecords.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let streak = 0;
    let lastDate = null;

    const sorted = [...records].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const r of sorted) {
      const d = new Date(r.timestamp).toDateString();
      if (r.type === 'success') {
        if (!lastDate || new Date(d) - new Date(lastDate) <= 86400000 * 1.5) {
          streak++;
        } else {
          streak = 1;
        }
        longest = Math.max(longest, streak);
        lastDate = d;
      } else if (r.type === 'failure') {
        streak = 0;
        lastDate = null;
      }
    }

    // 当前连续：检查最近记录是否连续
    const today = new Date().toDateString();
    const lastSuccess = successRecords[0];
    if (lastSuccess) {
      const lastDate2 = new Date(lastSuccess.timestamp).toDateString();
      const diff = new Date(today) - new Date(lastDate2);
      current = diff <= 86400000 * 1.5 ? streak : 0;
    }

    return { current, longest };
  }
};

module.exports = { streakCounter };
