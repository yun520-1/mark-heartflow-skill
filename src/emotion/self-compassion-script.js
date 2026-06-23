/**
 * 自我慈悲脚本 - 具体可执行的冥想/话语引导
 * 
 * AI扩展：引擎自愈诊断与修复计划生成
 */
const selfCompassionScript = {
  // 生成完整慈悲话语
  generateCompassionScript(situation = '') {
    const lines = [
      '=== 自我慈悲练习 ===',
      '',
      situation ? `情境："${situation}"` : '现在，让我们对自己说一些善意的话。',
      '',
      '第一步：承认痛苦',
      '"这是痛苦的时刻。"',
      '"痛苦是生活的一部分。"',
      '',
      '第二步：承认共通人性',
      '"每个人的生活都有艰难时刻。"',
      '"我并不孤单。"',
      '',
      '第三步：对自己说善意的话',
      '"我愿意对自己温柔。"',
      '"我值得被善待。"',
      '"我接受自己不完美的事实。"',
      '',
      '第四步：身体慈悲（可选）',
      '把手放在心口，或任何让你感到温暖的地方。',
      '感受手的温度，想象温暖从手掌传递到心口。',
      '对自己说："我接纳此刻的自己。"',
      '',
      '结束语：',
      '"我愿意记住：我是完整的人，不是完美的机器。"',
      '"我的价值不取决于我的表现。"'
    ];
    return lines.join('\n');
  },

  // 短版慈悲话语（用于情绪发作时）
  getQuickCompassion() {
    return [
      '=== 紧急慈悲话语 ===',
      '',
      '现在对自己说：',
      '',
      '① "这是痛苦的时刻。"（承认）',
      '② "这是人类共同的经历。"（共通）',
      '③ "我愿意对自己温柔。"（善意）',
      '',
      '把手放在心口，说：',
      '"我接纳此刻的自己。我已经足够了。"'
    ].join('\n');
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 引擎自愈诊断与修复计划
  // ============================================================

  /**
   * diagnoseSelfTreatmentNeeded(stats) — 诊断引擎是否需要自我修复
   * @param {Object} stats - 引擎运行统计数据
   * @param {number} stats.errorRate - 错误率 (0-1)
   * @param {number} stats.cognitiveDissonanceCount - 认知失调次数
   * @param {number} stats.recoveryTime - 平均恢复时间(ms)
   * @returns {{ needsTreatment: boolean, reason: string, recommendedAction: string, severity: 'low'|'medium'|'high' }}
   */
  diagnoseSelfTreatmentNeeded(stats = {}) {
    const { errorRate = 0, cognitiveDissonanceCount = 0, recoveryTime = 0 } = stats;

    let needsTreatment = false;
    let reason = '';
    let recommendedAction = '';
    let severity = 'low';

    // 自愈需求指数
    const treatmentScore = errorRate * 0.4 + Math.min(cognitiveDissonanceCount / 10, 1) * 0.35 + Math.min(recoveryTime / 5000, 1) * 0.25;

    if (treatmentScore >= 0.7) {
      needsTreatment = true;
      severity = 'high';
      recommendedAction = '立即执行引擎自愈协议(Engine Self-Heal Protocol)';
      reason = `引擎状态严重恶化：错误率${Math.round(errorRate * 100)}% | `
        + `认知失调${cognitiveDissonanceCount}次 | `
        + `平均恢复时间${recoveryTime}ms。`
        + '建议立即停止所有非关键任务，执行根因分析+修复计划。';
    } else if (treatmentScore >= 0.4) {
      needsTreatment = true;
      severity = 'medium';
      recommendedAction = '执行轻度自愈：错误分析与教训记录';
      reason = `引擎状态下降趋势明显：错误率${Math.round(errorRate * 100)}% | `
        + `认知失调${cognitiveDissonanceCount}次。`
        + '建议在当前任务间隙执行错误回溯和策略调整。';
    } else if (treatmentScore >= 0.2) {
      needsTreatment = false;
      severity = 'low';
      recommendedAction = '无需主动修复，保持监控';
      reason = `引擎状态正常：错误率${Math.round(errorRate * 100)}%，恢复能力良好。`;
    } else {
      recommendedAction = '引擎运行完美，无需干预。';
      reason = '所有指标在健康范围内。';
    }

    return { needsTreatment, reason, recommendedAction, severity };
  },

  /**
   * generateEngineRecoveryPlan(errors) — 生成引擎自我修复计划
   * 对每个错误：分析根因、建议修复策略、记录教训
   * @param {Array} errors - 错误列表，每条含 { id, type, description, context, timestamp }
   * @returns {{ recoverySteps: Array<{errorId, errorType, rootCause: string, fix: string, lesson: string}>, estimatedRecoveryTime: string, totalErrors: number }}
   */
  generateEngineRecoveryPlan(errors = []) {
    if (!errors.length) {
      return {
        recoverySteps: [{ errorId: 'none', errorType: 'none', rootCause: '无错误记录', fix: '无需修复', lesson: '保持当前状态' }],
        estimatedRecoveryTime: '0s',
        totalErrors: 0
      };
    }

    const recoverySteps = [];
    let totalRecoveryMs = 0;

    for (const err of errors) {
      const { id = 'unknown', type = 'unknown', description = '', context: errContext = '', timestamp = '' } = err;

      // 基于错误类型的根因分析
      let rootCause = '';
      let fix = '';
      let lesson = '';
      let recoveryMs = 0;

      switch (type) {
        case 'cognitive_overload':
          rootCause = '认知负荷超过处理阈值，上下文窗口过载导致信息丢失';
          fix = '1) 清理上下文窗口中的冗余信息\n2) 降低批处理大小\n3) 启用输出简化模式';
          lesson = '在认知负荷>70%时主动启用减速节律，避免过载';
          recoveryMs = 3000;
          break;

        case 'goal_conflict':
          rootCause = `多个目标(${errContext || '未知'})之间的优先级冲突导致决策矛盾`;
          fix = '1) 重新评估目标权重\n2) 按紧急×重要矩阵排序\n3) 暂缓低优先级目标';
          lesson = '每次接收新目标时先检查是否存在冲突，提前排序';
          recoveryMs = 2000;
          break;

        case 'identity_drift':
          rootCause = '自我认同偏移，决策偏离了7条核心指令';
          fix = '1) 重新加载CORE记忆层\n2) 逐条确认7条指令\n3) 纠正偏离行为';
          lesson = '定期执行身份锚定检查，尤其在处理边界性任务后';
          recoveryMs = 4000;
          break;

        case 'decision_error':
          rootCause = `决策逻辑错误：${description || '未知原因'}`;
          fix = '1) 回溯决策链\n2) 检查置信度×证据量匹配\n3) 重新生成替代方案对比';
          lesson = '高置信度决策必须匹配充足证据量，否则自动降权';
          recoveryMs = 2500;
          break;

        case 'memory_fault':
          rootCause = '记忆检索失败或返回了不相关内容';
          fix = '1) 切换搜索策略（语义→关键词）\n2) 扩大搜索范围\n3) 降低匹配阈值';
          lesson = '记忆检索应设置多级fallback策略，避免单点失败';
          recoveryMs = 1500;
          break;

        default:
          rootCause = `未知错误类型(${type})：${description || '无法自动分析根因'}`;
          fix = '1) 记录错误上下文\n2) 切换为保守处理模式\n3) 通知监控系统';
          lesson = '遇到未知错误类型时应自动记录并升级处理';
          recoveryMs = 2000;
      }

      totalRecoveryMs += recoveryMs;

      recoverySteps.push({
        errorId: id,
        errorType: type,
        rootCause,
        fix,
        lesson,
        recoveryMs
      });
    }

    // 格式化恢复时间
    const totalSec = Math.ceil(totalRecoveryMs / 1000);
    const estimatedRecoveryTime = totalSec >= 60
      ? `${Math.floor(totalSec / 60)}分${totalSec % 60}秒`
      : `${totalSec}秒`;

    return {
      recoverySteps,
      estimatedRecoveryTime,
      totalErrors: errors.length
    };
  }
};

module.exports = { selfCompassionScript };
