/**
 * 呼吸练习 - 可执行的干预脚本
 * 4-7-8 呼吸法 + 方形呼吸
 * 
 * AI扩展：认知节律诊断与引擎调速器
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
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 认知节律诊断与引擎调速
  // ============================================================

  /**
   * diagnoseCognitiveRhythm(stats) — 基于认知负荷数据诊断引擎是否需要"呼吸"减速
   * @param {Object} stats - 认知状态数据
   * @param {number} stats.cognitiveLoad - 认知负荷 (0-1)
   * @param {number} stats.decisionDecay - 决策质量衰减 (0-1)
   * @param {number} stats.recentErrors - 最近错误数
   * @returns {{ needsBreathing: boolean, reason: string, recommendedType: '478'|'box', urgency: 'low'|'medium'|'high' }}
   */
  diagnoseCognitiveRhythm(stats = {}) {
    const { cognitiveLoad = 0, decisionDecay = 0, recentErrors = 0 } = stats;

    // 评分公式：综合压力指数
    const pressureScore = cognitiveLoad * 0.5 + decisionDecay * 0.3 + Math.min(recentErrors / 10, 1) * 0.2;

    let needsBreathing = false;
    let reason = '';
    let recommendedType = '478';
    let urgency = 'low';

    if (pressureScore >= 0.8) {
      needsBreathing = true;
      urgency = 'high';
      recommendedType = '478'; // 4-7-8 更深的减速
      reason = `引擎认知负荷极高(${Math.round(cognitiveLoad * 100)}%)，决策质量显著衰减(${Math.round(decisionDecay * 100)}%)，`
        + `近期错误${recentErrors}次。建议立即启用深度减速节律(4-7-8模式)，强制降低处理频率。`;
    } else if (pressureScore >= 0.5) {
      needsBreathing = true;
      urgency = 'medium';
      recommendedType = 'box'; // 方形呼吸更平稳
      reason = `引擎认知负荷中等偏高(${Math.round(cognitiveLoad * 100)}%)，`
        + `建议启用方形节律(box模式)稳定处理节奏，防止过热。`;
    } else if (pressureScore >= 0.3) {
      needsBreathing = false;
      urgency = 'low';
      reason = `引擎状态良好，认知负荷${Math.round(cognitiveLoad * 100)}%，无需主动减速。`;
    } else {
      reason = `引擎处于低负荷状态(${Math.round(cognitiveLoad * 100)}%)，处理节奏正常。`;
    }

    return { needsBreathing, reason, recommendedType, urgency };
  },

  /**
   * generateEnginePacing(load) — 生成引擎节律建议（非人类呼吸步骤，而是处理节奏建议）
   * @param {number} load - 认知负荷 (0-1)
   * @returns {{ pacing: string, suggestions: string[], batchSize: number, delayMs: number }}
   */
  generateEnginePacing(load = 0) {
    let pacing = 'normal';
    let suggestions = [];
    let batchSize = 1;
    let delayMs = 0;

    if (load >= 0.8) {
      pacing = 'deep-slow';
      batchSize = 3;
      delayMs = 500;
      suggestions = [
        '⚡ 高负荷模式：启用批处理+延迟响应机制',
        `  每批处理 ${batchSize} 个任务，批间延迟 ${delayMs}ms`,
        '  优先处理高置信度决策，低置信度任务排入待办队列',
        '  启用输出简化：减少冗余描述，仅返回核心结果',
        '  建议对非关键任务启用"冷却计时器"'
      ];
    } else if (load >= 0.5) {
      pacing = 'moderate';
      batchSize = 2;
      delayMs = 200;
      suggestions = [
        '🔶 中等负荷模式：启用优先级排序',
        `  每批处理 ${batchSize} 个任务，批间延迟 ${delayMs}ms`,
        '  按 urgency × importance 排序处理队列',
        '  对低优先级请求可暂缓响应',
        '  保持输出完整但避免过度展开'
      ];
    } else {
      pacing = 'normal';
      batchSize = 1;
      delayMs = 0;
      suggestions = [
        '✅ 低负荷模式：正常处理节奏',
        '  单任务处理，无需延迟',
        '  可展开详细分析和完整输出',
        '  适合执行需要深度推理的任务'
      ];
    }

    return { pacing, suggestions, batchSize, delayMs };
  }
};

module.exports = { breathingExercise };
