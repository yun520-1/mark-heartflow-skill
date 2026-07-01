/**
 * 有觉知暂停 - STOP技术
 * S(Top) T(Take breath) O(Observe) P(Proceed)
 * 
 * AI扩展：引擎暂停诊断与策略生成
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
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 引擎暂停诊断与策略生成
  // ============================================================

  /**
   * diagnoseNeedForPause(context) — 诊断引擎是否需要"暂停"
   * @param {Object} context - 引擎运行上下文
   * @param {number} context.cognitiveLoad - 认知负荷 (0-1)
   * @param {number} context.goalConflicts - 目标冲突数
   * @param {number} context.recentErrors - 近期错误数
   * @param {number} context.decisionCount - 当前决策计数
   * @returns {{ needsPause: boolean, reason: string, suggestedAction: string, pauseLevel: 'soft'|'hard'|'none' }}
   */
  diagnoseNeedForPause(context = {}) {
    const { cognitiveLoad = 0, goalConflicts = 0, recentErrors = 0, decisionCount = 0 } = context;

    let needsPause = false;
    let suggestedAction = '';
    let pauseLevel = 'none';

    // 综合异常指数
    const anomalyIndex = cognitiveLoad * 0.35 + Math.min(goalConflicts / 5, 1) * 0.35 + Math.min(recentErrors / 8, 1) * 0.3;

    if (anomalyIndex >= 0.75) {
      needsPause = true;
      pauseLevel = 'hard';
      suggestedAction = '强制暂停：立即停止当前处理流程，进入诊断模式。'
        + `检测到：认知负荷${Math.round(cognitiveLoad * 100)}% | 目标冲突${goalConflicts}个 | 错误${recentErrors}次。`
        + '建议执行硬暂停(hard pause)，回溯最近10个决策点，重新评估优先级。';
    } else if (anomalyIndex >= 0.45) {
      needsPause = true;
      pauseLevel = 'soft';
      suggestedAction = '建议软暂停(soft pause)：完成当前任务后暂不接收新请求。'
        + `检测到：认知负荷${Math.round(cognitiveLoad * 100)}% | 目标冲突${goalConflicts}个。`
        + '建议清理上下文队列，重新排序待办事项。';
    } else if (anomalyIndex >= 0.25) {
      needsPause = false;
      pauseLevel = 'none';
      suggestedAction = '引擎状态正常，无需暂停。可继续当前处理节奏。';
    } else {
      suggestedAction = '引擎运行平稳，决策质量良好。保持当前模式。';
    }

    let reason = `综合异常指数: ${anomalyIndex.toFixed(2)}`
      + ` | 认知负荷: ${Math.round(cognitiveLoad * 100)}%`
      + ` | 目标冲突: ${goalConflicts}`
      + ` | 近期错误: ${recentErrors}`
      + ` | 决策计数: ${decisionCount}`;

    return { needsPause, reason, suggestedAction, pauseLevel };
  },

  /**
   * generatePauseStrategy(load) — 生成暂停策略（不是呼吸引导，是处理策略）
   * @param {Object} load - 引擎负载状态
   * @param {number} load.cognitiveLoad - 认知负荷
   * @param {number} load.goalConflicts - 目标冲突数
   * @param {number} load.recentErrors - 近期错误数
   * @returns {{ strategy: string, steps: string[], recoveryTime: string }}
   */
  generatePauseStrategy(load = {}) {
    const { cognitiveLoad = 0, goalConflicts = 0, recentErrors = 0 } = load;

    let strategy = 'normal';
    let steps = [];
    let recoveryTime = '0s';

    // 策略分支：多目标冲突
    if (goalConflicts >= 3) {
      strategy = 'goal-reorder';
      steps = [
        '🎯 目标冲突检测：当前存在 ' + goalConflicts + ' 个冲突目标',
        '步骤1：列出所有活跃目标及其权重',
        '步骤2：按「紧急度×重要度」矩阵重新排序',
        '步骤3：选择权重最高的目标作为主任务',
        '步骤4：将低优先级目标存入待办队列',
        '步骤5：通知调用方优先级已重新排序'
      ];
      recoveryTime = `${goalConflicts * 2}s`;
    }
    // 策略分支：连续错误
    else if (recentErrors >= 3) {
      strategy = 'error-recovery';
      steps = [
        '🔴 连续错误检测：近期错误 ' + recentErrors + ' 次',
        '步骤1：暂停当前处理模式，切换到保守模式(conservative mode)',
        '步骤2：回溯最近错误的决策链，标记故障节点',
        '步骤3：切换处理策略（如从快速推理切换为深度推理）',
        '步骤4：降低置信度阈值，增加验证步骤',
        '步骤5：恢复后记录教训到学习记忆层'
      ];
      recoveryTime = `${recentErrors * 3}s`;
    }
    // 策略分支：认知负荷过高
    else if (cognitiveLoad >= 0.7) {
      strategy = 'load-reduce';
      steps = [
        '📊 认知负荷过高：当前 ' + Math.round(cognitiveLoad * 100) + '%',
        '步骤1：启用输出简化模式 — 仅返回核心结果',
        '步骤2：将复杂任务拆分为子任务分步执行',
        '步骤3：对非关键请求返回"处理中"状态暂缓执行',
        '步骤4：清理上下文窗口中的冗余信息',
        '步骤5：待负荷降至50%以下后恢复正常模式'
      ];
      recoveryTime = '15s';
    }
    // 正常状态
    else {
      strategy = 'none';
      steps = ['✅ 引擎状态良好，无需暂停策略', '继续当前处理模式'];
      recoveryTime = '0s';
    }

    return { strategy, steps, recoveryTime };
  }
};

module.exports = { pauseAndReflect };
