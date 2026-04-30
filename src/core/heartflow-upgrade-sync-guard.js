class HeartFlowUpgradeSyncGuard {
  plan(context = {}) {
    const targetRepo = context.targetRepo || 'https://github.com/yun520-1/mark-heartflow-skill';
    const branch = context.branch || 'main';
    const actions = [
      '提醒：确认目标仓库、分支、版本号、历史保留策略',
      '扫描：检查 root、主入口、版本文件、临时文件、历史升级记录',
      '分类：主线保留 / 可归档 / 可删除',
      '确认：删除、推送、重置前必须确认',
      '执行：小步变更，本地验证后再同步',
      '验证：版本对齐、主入口可运行、Git 状态正确'
    ];
    return {
      targetRepo,
      branch,
      actions,
      risk: context.risk || 'high',
      requireConfirmation: true,
      reminder: 'HeartFlow 升级/同步前必须先提醒并确认，避免误删仓库或乱同步。'
    };
  }
}

module.exports = { HeartFlowUpgradeSyncGuard };
