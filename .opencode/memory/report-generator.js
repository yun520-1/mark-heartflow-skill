/**
 * Report Generator - 会话报告生成器
 * 为 ReflectionAgent 提供报告生成功能
 */

function generateReport(sessionData) {
  const report = {
    timestamp: new Date().toISOString(),
    duration: sessionData.endTime - sessionData.startTime,
    flowStates: sessionData.flowStates || [],
    distractions: sessionData.distractions || [],
    achievements: sessionData.achievements || [],
    moodChanges: sessionData.moodChanges || [],
    summary: generateSummary(sessionData),
    suggestions: generateSuggestions(sessionData)
  };
  return report;
}

function generateSummary(sessionData) {
  const flowCount = (sessionData.flowStates || []).length;
  const distractionCount = (sessionData.distractions || []).length;
  return `本次会话共进入心流状态 ${flowCount} 次，遭遇 ${distractionCount} 次干扰。`;
}

function generateSuggestions(sessionData) {
  const suggestions = [];
  if ((sessionData.distractions || []).length > 3) {
    suggestions.push('建议减少环境干扰，创建更专注的工作空间。');
  }
  if ((sessionData.flowStates || []).length > 0) {
    suggestions.push('很好！你已经进入心流状态，继续保持这个节奏。');
  }
  return suggestions;
}

module.exports = { generateReport };
