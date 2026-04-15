function generateReport(state) {
  let r = '═'.repeat(40) + '\n📈 心流报告\n' + '═'.repeat(40) + '\n\n';
  r += `会话：${state.total_sessions} | 模式：${state.current_mode}\n\n`;
  r += '情绪曲线:\n';
  if (state.emotional_log.length > 0) {
    const emotions = {};
    state.emotional_log.forEach(e => {
      if (!emotions[e.emotion]) emotions[e.emotion] = [];
      emotions[e.emotion].push(e.intensity);
    });
    Object.entries(emotions).forEach(([em, vals]) => {
      const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
      r += `${em}: ${'█'.repeat(Math.round(avg))}${'░'.repeat(10-Math.round(avg))} ${avg.toFixed(1)}\n`;
    });
  }
  r += '\n人格值:\n';
  Object.entries(state.personality).forEach(([k,v]) => {
    r += `${k}: ${'█'.repeat(Math.round(v))}${'░'.repeat(10-Math.round(v))} ${v.toFixed(1)}\n`;
  });
  return r + '═'.repeat(40) + '\n';
}
module.exports = { generateReport };
