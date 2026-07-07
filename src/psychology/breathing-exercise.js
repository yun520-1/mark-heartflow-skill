/**
 * 呼吸练习 - 可执行的干预脚本
 * 4-7-8 呼吸法 + 方形呼吸
 */
const breathingExercise = {
  // 4-7-8 呼吸法
  async start478(resonseCallback) {
    const steps = [];
    const COUNT = 4; // 完整周期数

    for (let cycle = 1; cycle <= COUNT; cycle++) {
      // 吸气 4秒
      steps.push({ phase: 'inhale', seconds: 4, instruction: '缓慢吸气...', cycle, total: COUNT });
      // 屏息 7秒
      steps.push({ phase: 'hold', seconds: 7, instruction: '屏住呼吸...', cycle, total: COUNT });
      // 呼气 8秒
      steps.push({ phase: 'exhale', seconds: 8, instruction: '缓慢呼气...', cycle, total: COUNT });
    }

    steps.push({ phase: 'done', instruction: '完成。感觉如何？' });
    return steps;
  },

  // 方形呼吸
  async startBoxBreathing(responseCallback) {
    const steps = [];
    const COUNT = 4;

    for (let cycle = 1; cycle <= COUNT; cycle++) {
      steps.push({ phase: 'inhale', seconds: 4, instruction: '吸气...', cycle, total: COUNT });
      steps.push({ phase: 'hold', seconds: 4, instruction: '屏息...', cycle, total: COUNT });
      steps.push({ phase: 'exhale', seconds: 4, instruction: '呼气...', cycle, total: COUNT });
      steps.push({ phase: 'hold', seconds: 4, instruction: '屏息...', cycle, total: COUNT });
    }

    steps.push({ phase: 'done', instruction: '完成。感觉平静了吗？' });
    return steps;
  },

  // 生成执行脚本（用于流式输出）
  generateScript(type = '478') {
    const scripts = {
      '478': [
        '找一个舒适的姿势坐着或躺下。',
        '用鼻子吸气，默数4秒（1...2...3...4）',
        '屏住呼吸，默数7秒（1...2...3...4...5...6...7）',
        '用嘴呼气，默数8秒（1...2...3...4...5...6...7...8）',
        '重复以上步骤3次（共4个完整周期）',
        '结束后，慢慢睁开眼睛，感受身体的变化'
      ],
      'box': [
        '坐直，放松肩膀',
        '吸气4秒，想象在画正方形的一条边',
        '屏息4秒，想象第二条边',
        '呼气4秒，想象第三条边',
        '屏息4秒，想象第四条边',
        '重复4次',
        '完成后，感受平静'
      ]
    };
    return scripts[type] || scripts['478'];
  },

  // 格式化输出
  formatSteps(steps) {
    const icons = { inhale: '⬆️', hold: '⏸️', exhale: '⬇️', done: '✅' };
    return steps.map(s =>
      `${icons[s.phase] || ''} ${s.instruction}${s.seconds ? ` (${s.seconds}秒)` : ''}${s.cycle ? ` [${s.cycle}/${s.total}]` : ''}`
    ).join('\n');
  }
};

module.exports = { breathingExercise };
