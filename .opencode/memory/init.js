const fs = require('fs');
const DEFAULT_STATE = {
  version: "1.0.0",
  last_session: new Date().toISOString(),
  total_sessions: 0,
  personality: { authenticity: 6, autonomy: 5, introspection: 7, growth: 6 },
  emotional_log: [],
  feedback_history: [],
  achievements: [],
  current_mode: "buddy"
};

function initializeState(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    const state = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!state.personality) throw new Error('损坏');
    return state;
  } catch (e) {
    console.log('⚠️ 记忆文件异常，使用默认状态');
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_STATE, null, 2));
    return DEFAULT_STATE;
  }
}

module.exports = { initializeState, DEFAULT_STATE };
