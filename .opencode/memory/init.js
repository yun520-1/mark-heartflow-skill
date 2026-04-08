const fs = require('fs');
const DEFAULT_STATE = {
  version: "1.0.0",
  last_session: new Date().toISOString(),
  total_sessions: 0,
  personality: { authenticity: 6, autonomy: 5, introspection: 7, growth: 6 },
  emotional_log: [],
  feedback_history: [],
  achievements: [],
  current_mode: "buddy",
  session_progress: { rounds: 0, focus_minutes: 0, completed_tasks: [] }
};

function initializeState(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const state = JSON.parse(content);
    if (!state.personality || !state.version) {
      console.log('⚠️ 记忆文件损坏，使用默认状态');
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    return state;
  } catch (error) {
    console.log('❌ 读取记忆文件失败:', error.message);
    console.log('🔄 使用默认状态 (静默降级)');
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_STATE, null, 2));
    return DEFAULT_STATE;
  }
}

function saveState(filePath, state) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    console.log('❌ 保存记忆文件失败:', error.message);
    console.log('⚠️ 静默降级，不影响主流程');
    return false;
  }
}

module.exports = { initializeState, saveState, DEFAULT_STATE };
