class HeartFlowUpgradeSyncGuard {
  plan(context = {}) {
    const targetRepo = context.targetRepo || 'https://github.com/yun520-1/mark-heartflow-skill';
    const branch = context.branch || 'main';
    const evidenceScore = Math.max(
      context.evidenceScore ?? 0,
      context.actionability ?? 0,
      context.confidence ?? 0
    );
    const evidenceTags = Array.isArray(context.evidenceTags) ? context.evidenceTags : [];

    const actions = [
      '提醒：确认目标仓库、分支、版本号、历史保留策略',
      '扫描：检查 root、主入口、版本文件、临时文件、历史升级记录',
      '分类：主线保留 / 可归档 / 可删除',
      '确认：删除、推送、重置前必须确认',
      '执行：小步变更，本地验证后再同步',
      '验证：版本对齐、主入口可运行、Git 状态正确'
    ];

    const stable = evidenceScore >= 0.6 || evidenceTags.length >= 3;
    const allow = stable;
    const issues = stable ? [] : [{ type: 'low_confidence', message: 'confidence below threshold' }];
    const summary = stable ? 'stable' : 'needs repair';
    const advice = stable ? '' : 'confidence below threshold';
    const hint = stable ? 'safe to continue' : 'pause, simplify, and repair';
    const next_step = stable ? 'continue' : 'repair';
    const repairHints = stable ? [] : ['raise evidence density before acting'];

    return {
      targetRepo,
      branch,
      actions,
      risk: context.risk || 'high',
      requireConfirmation: true,
      reminder: 'HeartFlow 升级/同步前必须先提醒并确认，避免误删仓库或乱同步。',
      stable,
      issues,
      thresholds: {
        minConfidence: 0.6,
        maxNoiseRatio: 0.45,
        minActionability: 0.5,
      },
      summary,
      advice,
      allow,
      hint,
      next_step,
      repairHints,
    };
  }
}

module.exports = { HeartFlowUpgradeSyncGuard };
