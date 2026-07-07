/**
 * 情绪签到 - 早晨/晚间例行
 */
const emotionalCheckIn = {
  types: {
    morning: {
      name: '早晨情绪签到',
      duration: '3分钟',
      questions: [
        { id: 'mood', text: '今天早上的情绪状态（1-10分）：', type: 'scale' },
        { id: 'energy', text: '能量水平（1-10分）：', type: 'scale' },
        { id: 'anticipation', text: '今天最期待的一件事：', type: 'text' },
        { id: 'concern', text: '今天最担心的一件事：', type: 'text' },
        { id: 'physical', text: '身体感受（哪里紧绷/放松）：', type: 'text' }
      ]
    },
    evening: {
      name: '晚间情绪签到',
      duration: '5分钟',
      questions: [
        { id: 'dayMood', text: '今天整体情绪（1-10分）：', type: 'scale' },
        { id: 'highlight', text: '今天最美好的时刻：', type: 'text' },
        { id: 'challenge', text: '今天最大的挑战：', type: 'text' },
        { id: 'growth', text: '今天学到的一件事：', type: 'text' },
        { id: 'sleep', text: '今晚睡眠准备状态（1-10分）：', type: 'scale' },
        { id: 'gratitude', text: '今天感激的一件事：', type: 'text' }
      ]
    }
  },

  getQuestions(type = 'morning') {
    return this.types[type] || this.types.morning;
  },

  formatCheckIn(type = 'morning') {
    const q = this.getQuestions(type);
    const lines = [
      `=== ${q.name} ===`,
      `预计时间：${q.duration}`,
      '回答以下问题，帮助自己觉察今天的情绪状态。',
      ''
    ];
    for (const question of q.questions) {
      if (question.type === 'scale') {
        lines.push(`${question.text}`);
        lines.push('（1=非常低落，5=中等，10=非常好）');
        lines.push('答：___');
      } else {
        lines.push(`${question.text}`);
        lines.push('答：___');
      }
      lines.push('');
    }
    return lines.join('\n');
  }
};

module.exports = { emotionalCheckIn };
