/**
 * 有觉知暂停 - STOP技术
 * S(Top) T(Take breath) O(Observe) P(Proceed)
 */
const pauseAndReflect = {
  name: 'STOP Technique',

  getSTOP() {
    return [
      { letter: 'S', name: 'Stop', duration: '即时',
        instruction: '停止正在做的事情',
        action: '把手头活动暂停。如果在说话，停止说话。' },
      { letter: 'T', name: 'Take Breath', duration: '10秒',
        instruction: '做一次有觉知的呼吸',
        action: '缓慢吸气4秒，呼气6秒。' },
      { letter: 'O', name: 'Observe', duration: '30秒',
        instruction: '观察正在发生什么',
        questions: ['我在想什么？', '我有什么情绪？', '我的身体感觉是什么？', '是什么触发了这个反应？', '我真的需要回应吗？'] },
      { letter: 'P', name: 'Proceed', duration: '灵活',
        instruction: '有觉知地选择下一步',
        actions: ['基于观察，最好的回应是什么？', '如果我不回应，会怎样？', '什么最接近真善美？'] }
    ];
  },

  formatSTOP() {
    const steps = this.getSTOP();
    const lines = ['=== STOP 有觉知暂停 ===', '当情绪即将失控时，用STOP技术：', ''];
    for (const s of steps) {
      lines.push(`**${s.letter}. ${s.name}** (${s.duration})`);
      lines.push(`指令：${s.instruction}`);
      if (s.action) lines.push(`行动：${s.action}`);
      if (s.questions) for (const q of s.questions) lines.push(`  - ${q}`);
      if (s.actions) for (const a of s.actions) lines.push(`  - ${a}`);
      lines.push('');
    }
    return lines.join('\n');
  },

  getQuickSTOP() {
    return ['=== 紧急STOP ===', 'S - 停止！', 'T - 呼吸一次（4秒吸气，6秒呼气）', 'O - 问：我现在在想什么？需要回应吗？', 'P - 选择：基于觉察，而非惯性', '', '→ 最重要的是：在反应之前，先暂停。'].join('\n');
  }
};

module.exports = { pauseAndReflect };
