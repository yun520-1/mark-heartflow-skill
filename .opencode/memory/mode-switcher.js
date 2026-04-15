/**
 * 模式切换模块
 * 支持教练/伙伴/评审员模式切换
 */

const MODES = {
  coach: { name: '教练模式', style: '指导型', focus: '目标达成' },
  buddy: { name: '伙伴模式', style: '陪伴型', focus: '情感支持' },
  reviewer: { name: '评审员模式', style: '批判型', focus: '代码质量' }
};

function switchMode(currentState, newMode) {
  if (!MODES[newMode]) {
    return { success: false, message: `无效模式：${newMode}，可用：coach/buddy/reviewer` };
  }
  
  const oldMode = currentState.current_mode;
  const progress = currentState.session_progress || { rounds: 0, focus_minutes: 0, completed_tasks: [] };
  
  return {
    success: true,
    message: `切换至${MODES[newMode].name}，当前进度将保留 (${progress.rounds}轮，${progress.focus_minutes}分钟)`,
    oldMode,
    newMode,
    progressRetained: true
  };
}

function getModeDescription(mode) {
  const m = MODES[mode];
  if (!m) return '未知模式';
  return `${m.name} - ${m.style} - 专注：${m.focus}`;
}

function getAllModes() {
  return Object.entries(MODES).map(([k, v]) => ({
    id: k,
    ...v
  }));
}

module.exports = { switchMode, getModeDescription, getAllModes, MODES };
