/**
 * 反馈收集模块
 * 收集用户评分，关联人格值
 */

function collectFeedback(state, rating, comment = '') {
  if (!state.feedback_history) {
    state.feedback_history = [];
  }
  
  const feedback = {
    timestamp: new Date().toISOString(),
    rating: Math.max(1, Math.min(10, parseInt(rating) || 5)),
    comment,
    personality_snapshot: { ...state.personality }
  };
  
  state.feedback_history.push(feedback);
  
  // 根据评分调整人格值
  if (rating >= 8) {
    state.personality.growth = Math.min(10, state.personality.growth + 0.2);
    state.personality.autonomy = Math.min(10, state.personality.autonomy + 0.1);
  } else if (rating <= 5) {
    state.personality.introspection = Math.min(10, state.personality.introspection + 0.3);
  }
  
  return {
    message: `感谢评分 ${rating}/10！`,
    adjustment: rating >= 8 ? '人格值 +成长/自主' : '人格值 +自省',
    totalFeedbacks: state.feedback_history.length
  };
}

function getFeedbackStats(state) {
  const history = state.feedback_history || [];
  if (history.length === 0) {
    return { count: 0, average: 0 };
  }
  const sum = history.reduce((s, f) => s + f.rating, 0);
  return {
    count: history.length,
    average: (sum / history.length).toFixed(2),
    latest: history[history.length - 1]
  };
}

module.exports = { collectFeedback, getFeedbackStats };
