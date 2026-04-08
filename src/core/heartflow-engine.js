/**
 * HeartFlow 心流引擎 v2.2.0
 * 基于 PAD 三维情感模型的心流状态计算
 */

/**
 * PAD 三维情感模型
 * Pleasure (愉悦度): -10 到 +10，负值表示不悦，正值表示愉悦
 * Arousal (唤醒度): -10 到 +10，负值表示沉静，正值表示兴奋
 * Dominance (支配度): -10 到 +10，负值表示被动，正值表示主动
 */

const PAD_MODEL = {
  min: -10,
  max: 10,
  neutral: 0
};

/**
 * 心流状态定义
 * 心流 = 挑战与技能匹配 + 高专注 + 适度唤醒
 */
const FLOW_STATES = {
  FLOW: 'flow',           // 心流状态
  ANXIETY: 'anxiety',     // 焦虑 (挑战>技能)
  BOREDOM: 'boredom',     // 无聊 (技能>挑战)
  APATHY: 'apathy',       // 冷漠 (低挑战低技能)
  RELAXATION: 'relaxation' // 放松 (低挑战高技能)
};

/**
 * 计算 PAD 情感状态
 * @param {number} pleasure - 愉悦度 (-10 到 10)
 * @param {number} arousal - 唤醒度 (-10 到 10)
 * @param {number} dominance - 支配度 (-10 到 10)
 * @returns {object} PAD 状态对象
 */
function calculatePADState(pleasure, arousal, dominance) {
  // 验证输入范围
  const clamp = (v) => Math.max(PAD_MODEL.min, Math.min(PAD_MODEL.max, v));
  
  const p = clamp(pleasure);
  const a = clamp(arousal);
  const d = clamp(dominance);
  
  return {
    pleasure: p,
    arousal: a,
    dominance: d,
    intensity: Math.sqrt(p*p + a*a + d*d) / 17.32, // 归一化到 0-1
    timestamp: new Date().toISOString()
  };
}

/**
 * 计算心流状态
 * 基于 PAD 模型和挑战 - 技能平衡理论
 * @param {number} userPleasure - 用户愉悦度
 * @param {number} userArousal - 用户唤醒度
 * @param {number} userDominance - 用户支配度
 * @param {number} challengeLevel - 任务挑战等级 (1-10)
 * @param {number} skillLevel - 用户技能等级 (1-10)
 * @returns {object} 心流状态结果
 */
function calculateFlowState(userPleasure, userArousal, userDominance, challengeLevel = 5, skillLevel = 5) {
  const pad = calculatePADState(userPleasure, userArousal, userDominance);
  
  // 挑战 - 技能平衡 (心流核心条件)
  const challengeSkillBalance = challengeLevel - skillLevel;
  
  // 心流判定条件:
  // 1. 愉悦度适中偏高 (0 到 10)
  // 2. 唤醒度适中 (0 到 8)
  // 3. 支配度适中 (0 到 8)
  // 4. 挑战与技能平衡 (差值在 -2 到 +2 之间)
  
  let state = FLOW_STATES.APATHY;
  let flowScore = 0;
  let recommendations = [];
  
  // 计算心流分数 (0-100)
  flowScore += Math.max(0, pad.pleasure) * 2; // 愉悦度贡献
  flowScore += Math.max(0, Math.min(8, pad.arousal)) * 1.5; // 唤醒度贡献
  flowScore += Math.max(0, Math.min(8, pad.dominance)) * 1.5; // 支配度贡献
  
  // 挑战 - 技能平衡贡献
  if (Math.abs(challengeSkillBalance) <= 2) {
    flowScore += 30; // 平衡状态，心流条件满足
    state = FLOW_STATES.FLOW;
  } else if (challengeSkillBalance > 2) {
    flowScore -= 20;
    state = FLOW_STATES.ANXIETY;
    recommendations.push('任务挑战度过高，建议分解任务或降低难度');
  } else if (challengeSkillBalance < -2) {
    flowScore -= 20;
    state = FLOW_STATES.BOREDOM;
    recommendations.push('任务过于简单，建议增加挑战或学习新技能');
  }
  
  // 根据 PAD 状态调整
  if (pad.pleasure < 0) {
    flowScore -= 15;
    recommendations.push('检测到负面情绪，建议短暂休息或调整心态');
  }
  
  if (pad.arousal > 8) {
    flowScore -= 10;
    recommendations.push('唤醒度过高，建议深呼吸放松');
  }
  
  if (pad.arousal < -5) {
    flowScore -= 15;
    recommendations.push('唤醒度过低，建议活动身体或听音乐提神');
  }
  
  if (pad.dominance < 0) {
    flowScore -= 10;
    recommendations.push('感到被动，建议重新审视目标增强掌控感');
  }
  
  // 归一化心流分数
  flowScore = Math.max(0, Math.min(100, flowScore));
  
  return {
    state,
    flowScore: Math.round(flowScore),
    pad,
    challengeSkillBalance,
    recommendations,
    isFlow: state === FLOW_STATES.FLOW && flowScore >= 60,
    timestamp: new Date().toISOString()
  };
}

/**
 * 检测用户情感状态 (基于文本分析)
 * @param {string} userInput - 用户输入文本
 * @returns {object} 估算的 PAD 值
 */
function detectEmotionFromText(userInput) {
  const text = userInput.toLowerCase();
  
  let pleasure = 0;
  let arousal = 0;
  let dominance = 0;
  
  // 愉悦度关键词
  const positiveWords = ['开心', '高兴', '好', '棒', '顺利', '完成', '成功', '喜欢', '满意'];
  const negativeWords = ['烦', '累', '难', '挫败', '无聊', '讨厌', '糟糕', '失败', '困惑'];
  
  positiveWords.forEach(w => { if (text.includes(w)) pleasure += 2; });
  negativeWords.forEach(w => { if (text.includes(w)) pleasure -= 2; });
  
  // 唤醒度关键词
  const highArousalWords = ['兴奋', '激动', '紧张', '焦虑', '快速', '紧急'];
  const lowArousalWords = ['平静', '放松', '困', '慢', '无聊', '疲惫'];
  
  highArousalWords.forEach(w => { if (text.includes(w)) arousal += 2; });
  lowArousalWords.forEach(w => { if (text.includes(w)) arousal -= 2; });
  
  // 支配度关键词
  const highDominanceWords = ['我', '决定', '控制', '选择', '主动'];
  const lowDominanceWords = ['被迫', '必须', '应该', '没办法', '无奈'];
  
  highDominanceWords.forEach(w => { if (text.includes(w)) dominance += 2; });
  lowDominanceWords.forEach(w => { if (text.includes(w)) dominance -= 2; });
  
  return {
    pleasure: Math.max(-10, Math.min(10, pleasure)),
    arousal: Math.max(-10, Math.min(10, arousal)),
    dominance: Math.max(-10, Math.min(10, dominance))
  };
}

/**
 * 生成状态感知提醒
 * @param {object} flowResult - calculateFlowState 的返回值
 * @returns {string} 提醒文本
 */
function generateStateReminder(flowResult) {
  if (flowResult.isFlow) {
    return '🌊 检测到心流状态，继续保持！挑战与技能匹配良好。';
  }
  
  switch (flowResult.state) {
    case FLOW_STATES.ANXIETY:
      return '😰 检测到焦虑状态。任务挑战度可能过高，建议：\n- 分解任务为小步骤\n- 寻求他人帮助\n- 调整期望值';
    
    case FLOW_STATES.BOREDOM:
      return '😴 检测到无聊状态。任务可能过于简单，建议：\n- 增加任务难度\n- 学习新技能\n- 设定更高目标';
    
    case FLOW_STATES.APATHY:
      return '😐 检测到冷漠状态。缺乏动力，建议：\n- 重新审视目标意义\n- 短暂休息\n- 寻找任务的内在价值';
    
    case FLOW_STATES.RELAXATION:
      return '😌 检测到放松状态。享受当下，准备好迎接新挑战时可随时调整。';
    
    default:
      return '';
  }
}

module.exports = {
  PAD_MODEL,
  FLOW_STATES,
  calculatePADState,
  calculateFlowState,
  detectEmotionFromText,
  generateStateReminder
};

/**
 * ========================================
 * 状态机模型 (StateFlow)
 * ========================================
 */

const fs = require('fs');
const path = require('path');

const STATE_MACHINE_FILE = path.join(__dirname, '../../.opencode/memory/flow_state_machine.json');

// 心流状态枚举
const FLOW_STATE = {
  IDLE: 'IDLE',           // 空闲
  INITIATING: 'INITIATING', // 启动
  IN_FLOW: 'IN_FLOW',     // 心流中
  DISTRACTED: 'DISTRACTED', // 分心
  RESTING: 'RESTING',     // 休息
  COMPLETED: 'COMPLETED'  // 完成
};

// 状态机缓存
let stateMachineCache = null;

/**
 * 加载状态机
 */
function loadStateMachine() {
  try {
    if (stateMachineCache) {
      return stateMachineCache;
    }
    if (fs.existsSync(STATE_MACHINE_FILE)) {
      stateMachineCache = JSON.parse(fs.readFileSync(STATE_MACHINE_FILE, 'utf-8'));
      return stateMachineCache;
    }
  } catch (error) {
    console.log('⚠️ 加载状态机失败，使用默认状态');
  }
  
  // 默认状态机
  stateMachineCache = {
    version: '1.0.0',
    current_state: FLOW_STATE.IDLE,
    states: {
      IDLE: { name: '空闲', prompt: '准备进入心流状态，今天的目标是？', allowed_transitions: ['INITIATING', 'RESTING'] },
      INITIATING: { name: '启动', prompt: '准备进入心流状态，今天的目标是？', allowed_transitions: ['IN_FLOW', 'DISTRACTED', 'IDLE'] },
      IN_FLOW: { name: '心流', prompt: '🌊 心流状态良好，继续保持！', allowed_transitions: ['DISTRACTED', 'RESTING', 'COMPLETED'] },
      DISTRACTED: { name: '分心', prompt: '感觉有些分心，要回到主任务上吗？', allowed_transitions: ['IN_FLOW', 'RESTING', 'IDLE'] },
      RESTING: { name: '休息', prompt: '好好休息，准备好随时回来', allowed_transitions: ['IN_FLOW', 'INITIATING', 'COMPLETED'] },
      COMPLETED: { name: '完成', prompt: '🎉 任务完成！要生成心流报告吗？', allowed_transitions: ['IDLE', 'RESTING'] }
    },
    transition_log: [],
    statistics: { total_transitions: 0, time_in_flow: 0, sessions: 0 }
  };
  
  return stateMachineCache;
}

/**
 * 保存状态机
 */
function saveStateMachine() {
  try {
    fs.writeFileSync(STATE_MACHINE_FILE, JSON.stringify(stateMachineCache, null, 2));
    return true;
  } catch (error) {
    console.log('❌ 保存状态机失败:', error.message);
    return false;
  }
}

/**
 * 状态转换函数
 * @param {string} newState - 目标状态
 * @param {string} reason - 转换原因
 * @returns {object} 转换结果
 */
function transitionToState(newState, reason = '') {
  const machine = loadStateMachine();
  const currentState = machine.current_state;
  const stateDef = machine.states[currentState];
  
  // 检查是否允许转换
  if (!stateDef.allowed_transitions.includes(newState)) {
    return {
      success: false,
      message: `不允许从 ${currentState} 转换到 ${newState}`,
      allowed: stateDef.allowed_transitions
    };
  }
  
  // 记录转换日志
  const log = {
    from: currentState,
    to: newState,
    reason,
    timestamp: new Date().toISOString(),
    duration_in_previous: calculateStateDuration(currentState)
  };
  
  machine.transition_log.push(log);
  machine.statistics.total_transitions += 1;
  
  // 统计心流时间
  if (currentState === FLOW_STATE.IN_FLOW) {
    machine.statistics.time_in_flow += log.duration_in_previous;
  }
  
  // 更新当前状态
  machine.current_state = newState;
  
  // 如果是新会话，增加会话数
  if (newState === FLOW_STATE.IN_FLOW && currentState === FLOW_STATE.INITIATING) {
    machine.statistics.sessions += 1;
  }
  
  // 保存
  saveStateMachine();
  
  // 获取新状态的提示语
  const newPrompt = machine.states[newState].prompt;
  
  return {
    success: true,
    from: currentState,
    to: newState,
    reason,
    prompt: newPrompt,
    timestamp: log.timestamp
  };
}

/**
 * 计算在当前状态的持续时间 (分钟)
 */
function calculateStateDuration(state) {
  const machine = loadStateMachine();
  const logs = machine.transition_log.filter(l => l.to === state);
  if (logs.length === 0) return 0;
  
  const lastLog = logs[logs.length - 1];
  const startTime = new Date(lastLog.timestamp).getTime();
  const now = Date.now();
  return Math.round((now - startTime) / 60000);
}

/**
 * 获取当前状态信息
 */
function getCurrentState() {
  const machine = loadStateMachine();
  const state = machine.current_state;
  const stateDef = machine.states[state];
  
  return {
    state,
    name: stateDef.name,
    prompt: stateDef.prompt,
    duration: calculateStateDuration(state),
    allowed_transitions: stateDef.allowed_transitions,
    statistics: machine.statistics
  };
}

/**
 * 获取状态提示语
 */
function getStatePrompt(state) {
  const machine = loadStateMachine();
  const stateToUse = state || machine.current_state;
  return machine.states[stateToUse]?.prompt || '';
}

/**
 * 重置状态机
 */
function resetStateMachine() {
  stateMachineCache = null;
  const machine = loadStateMachine();
  machine.current_state = FLOW_STATE.IDLE;
  machine.transition_log = [];
  machine.statistics = { total_transitions: 0, time_in_flow: 0, sessions: 0 };
  saveStateMachine();
  return { success: true, message: '状态机已重置' };
}

// 导出状态机相关函数
module.exports.FLOW_STATE = FLOW_STATE;
module.exports.transitionToState = transitionToState;
module.exports.getCurrentState = getCurrentState;
module.exports.getStatePrompt = getStatePrompt;
module.exports.resetStateMachine = resetStateMachine;
module.exports.loadStateMachine = loadStateMachine;
module.exports.saveStateMachine = saveStateMachine;

/**
 * ========================================
 * 多智能体架构 (NeuroCircuit)
 * ========================================
 */

const AgentManager = require('./agents/AgentManager.js');

// 全局代理管理器实例
let agentManagerInstance = null;

/**
 * 获取代理管理器
 */
function getAgentManager() {
  if (!agentManagerInstance) {
    agentManagerInstance = new AgentManager();
  }
  return agentManagerInstance;
}

/**
 * 处理代理请求
 * @param {string} userInput - 用户输入
 * @param {string} agentName - 指定代理 (可选)
 * @returns {object} 代理响应
 */
function handleAgentRequest(userInput, agentName = null) {
  const manager = getAgentManager();
  return manager.processInput(userInput, agentName);
}

/**
 * 开始心流会话
 */
function startFlowSession() {
  const manager = getAgentManager();
  return manager.startSession();
}

/**
 * 结束心流会话
 */
function endFlowSession() {
  const manager = getAgentManager();
  return manager.endSession();
}

/**
 * 获取代理状态
 */
function getAgentStatus() {
  const manager = getAgentManager();
  return manager.getStatus();
}

// 导出多智能体相关函数
module.exports.getAgentManager = getAgentManager;
module.exports.handleAgentRequest = handleAgentRequest;
module.exports.startFlowSession = startFlowSession;
module.exports.endFlowSession = endFlowSession;
module.exports.getAgentStatus = getAgentStatus;

/**
 * ========================================
 * 人格与情绪计算模块升级
 * ========================================
 */

const BigFivePersonality = require('./BigFivePersonality.js');
const EmpathyAssessment = require('./EmpathyAssessment.js');

/**
 * 获取大五人格档案
 */
function getBigFiveProfile() {
  return BigFivePersonality.getProfile();
}

/**
 * 更新人格分数
 * @param {string} dimension - 维度 (O/C/E/A/N)
 * @param {number} score - 分数
 */
function updatePersonalityScore(dimension, score) {
  return BigFivePersonality.updateScore(dimension, score);
}

/**
 * 生成人格报告
 */
function generatePersonalityReport() {
  return BigFivePersonality.generateReport();
}

/**
 * 开始共情评估
 */
function startEmpathyAssessment() {
  return EmpathyAssessment.quickAssessment();
}

/**
 * 计算共情分数
 * @param {array} answers - 答案数组
 */
function calculateEmpathyScore(answers) {
  return EmpathyAssessment.calculateScore(answers);
}

/**
 * 生成共情报告
 * @param {object} result - calculateEmpathyScore 的返回值
 */
function generateEmpathyReport(result) {
  return EmpathyAssessment.generateReport(result);
}

/**
 * 获取共情状态
 */
function getEmpathyState() {
  return EmpathyAssessment.getState();
}

/**
 * 更新 heartflow_state.json 中的 big_five_scores
 */
function updateBigFiveInState() {
  const fs = require('fs');
  const path = require('path');
  const stateFile = path.join(__dirname, '../.opencode/memory/heartflow_state.json');
  
  try {
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      state.big_five_scores = BigFivePersonality.getProfile();
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      return { success: true };
    }
  } catch (error) {
    console.log('⚠️ 更新 big_five_scores 失败:', error.message);
  }
  return { success: false };
}

// 导出人格与情绪相关函数
module.exports.getBigFiveProfile = getBigFiveProfile;
module.exports.updatePersonalityScore = updatePersonalityScore;
module.exports.generatePersonalityReport = generatePersonalityReport;
module.exports.startEmpathyAssessment = startEmpathyAssessment;
module.exports.calculateEmpathyScore = calculateEmpathyScore;
module.exports.generateEmpathyReport = generateEmpathyReport;
module.exports.getEmpathyState = getEmpathyState;
module.exports.updateBigFiveInState = updateBigFiveInState;
module.exports.BigFivePersonality = BigFivePersonality;
module.exports.EmpathyAssessment = EmpathyAssessment;

/**
 * ========================================
 * 意图追踪与温和干预
 * ========================================
 */

const IntentionTracker = require('./IntentionTracker.js');

/**
 * 设定主要目标
 * @param {string} goal - 目标描述
 * @param {array} subGoals - 子目标列表
 */
function setPrimaryGoal(goal, subGoals = []) {
  return IntentionTracker.intentionTracker.setPrimaryGoal(goal, subGoals);
}

/**
 * 检查偏离并生成干预
 * @param {string} userInput - 用户输入
 * @returns {object} 干预结果
 */
function checkAndNudge(userInput) {
  const deviation = IntentionTracker.intentionTracker.checkDeviation(userInput);
  const nudge = IntentionTracker.intentionTracker.generateNudge(deviation);
  
  return {
    deviation,
    nudge,
    shouldNudge: nudge !== null
  };
}

/**
 * 获取目标进度
 */
function getGoalProgress() {
  return IntentionTracker.intentionTracker.getProgress();
}

/**
 * 生成进度报告
 */
function generateProgressReport() {
  return IntentionTracker.intentionTracker.generateProgressReport();
}

/**
 * 更新子目标状态
 * @param {number} index - 子目标索引
 * @param {boolean} completed - 完成状态
 */
function updateSubGoal(index, completed) {
  return IntentionTracker.intentionTracker.updateSubGoal(index, completed);
}

/**
 * 设置干预配置
 * @param {object} config - 配置对象
 */
function setNudgeConfig(config) {
  return IntentionTracker.intentionTracker.setNudgeConfig(config);
}

/**
 * 重置意图追踪
 */
function resetIntentionTracker() {
  return IntentionTracker.intentionTracker.reset();
}

// 导出意图追踪相关函数
module.exports.setPrimaryGoal = setPrimaryGoal;
module.exports.checkAndNudge = checkAndNudge;
module.exports.getGoalProgress = getGoalProgress;
module.exports.generateProgressReport = generateProgressReport;
module.exports.updateSubGoal = updateSubGoal;
module.exports.setNudgeConfig = setNudgeConfig;
module.exports.resetIntentionTracker = resetIntentionTracker;
module.exports.IntentionTracker = IntentionTracker;

/**
 * ========================================
 * 伦理安全模块
 * ========================================
 */

const EthicsSafety = require('./EthicsSafety.js');

/**
 * 获取免责声明
 */
function getEthicsDisclaimer() {
  return EthicsSafety.ethicsSafety.getDisclaimer();
}

/**
 * 处理用户输入 (伦理安全检查)
 * @param {string} userInput - 用户输入
 * @returns {object} 检查结果
 */
function checkEthicsSafety(userInput) {
  return EthicsSafety.ethicsSafety.processInput(userInput);
}

/**
 * 检测负面情绪
 * @param {string} userInput - 用户输入
 * @returns {object} 检测结果
 */
function detectNegativeEmotion(userInput) {
  return EthicsSafety.ethicsSafety.detectNegativeEmotion(userInput);
}

/**
 * 获取危机干预响应
 * @returns {object} 干预建议
 */
function getCrisisIntervention() {
  return EthicsSafety.ethicsSafety.checkCrisisIntervention();
}

/**
 * 生成危机响应文本
 * @param {object} intervention - 干预建议
 * @returns {string} 响应文本
 */
function generateCrisisResponse(intervention) {
  return EthicsSafety.ethicsSafety.generateCrisisResponse(intervention);
}

/**
 * 获取伦理安全状态
 */
function getEthicsSafetyStatus() {
  return EthicsSafety.ethicsSafety.getStatus();
}

/**
 * 重置伦理安全模块
 */
function resetEthicsSafety() {
  return EthicsSafety.ethicsSafety.reset();
}

// 导出伦理安全相关函数
module.exports.getEthicsDisclaimer = getEthicsDisclaimer;
module.exports.checkEthicsSafety = checkEthicsSafety;
module.exports.detectNegativeEmotion = detectNegativeEmotion;
module.exports.getCrisisIntervention = getCrisisIntervention;
module.exports.generateCrisisResponse = generateCrisisResponse;
module.exports.getEthicsSafetyStatus = getEthicsSafetyStatus;
module.exports.resetEthicsSafety = resetEthicsSafety;
module.exports.EthicsSafety = EthicsSafety;

/**
 * ========================================
 * 动态人格引擎
 * ========================================
 */

const PersonalityEngine = require('./personality-engine.js');

/**
 * 适应人格状态
 * @param {string} context - 对话语境
 * @returns {object} 适应结果
 */
function adaptPersonalityState(context) {
  return PersonalityEngine.personalityEngine.adaptPersonalityState(context);
}

/**
 * 获取当前人格状态
 * @returns {object} 人格状态
 */
function getCurrentPersonalityState() {
  return PersonalityEngine.personalityEngine.getCurrentState();
}

/**
 * 生成适应人格的响应
 * @param {string} baseResponse - 基础响应
 * @param {string} context - 对话语境
 * @returns {object} 适应后的响应
 */
function generateAdaptedResponse(baseResponse, context) {
  return PersonalityEngine.personalityEngine.generateAdaptedResponse(baseResponse, context);
}

/**
 * 获取人格状态报告
 * @returns {string} 报告文本
 */
function getPersonalityReport() {
  return PersonalityEngine.personalityEngine.generateReport();
}

/**
 * 重置人格状态
 * @returns {object} 重置结果
 */
function resetPersonality() {
  return PersonalityEngine.personalityEngine.reset();
}

/**
 * 设置人格引擎配置
 * @param {object} config - 配置对象
 * @returns {object} 配置结果
 */
function setPersonalityConfig(config) {
  return PersonalityEngine.personalityEngine.setConfig(config);
}

/**
 * 获取人格统计
 * @returns {object} 统计信息
 */
function getPersonalityStatistics() {
  return PersonalityEngine.personalityEngine.getStatistics();
}

// 导出人格引擎相关函数
module.exports.adaptPersonalityState = adaptPersonalityState;
module.exports.getCurrentPersonalityState = getCurrentPersonalityState;
module.exports.generateAdaptedResponse = generateAdaptedResponse;
module.exports.getPersonalityReport = getPersonalityReport;
module.exports.resetPersonality = resetPersonality;
module.exports.setPersonalityConfig = setPersonalityConfig;
module.exports.getPersonalityStatistics = getPersonalityStatistics;
module.exports.PersonalityEngine = PersonalityEngine;

/**
 * ========================================
 * 智能工作流切换模块
 * ========================================
 */

const WorkflowSwitch = require('./workflow-switch.js');

/**
 * 分析用户意图
 * @param {string} userInput - 用户输入
 * @returns {object} 意图分析结果
 */
function analyzeIntent(userInput) {
  return WorkflowSwitch.workflowSwitch.analyzeIntent(userInput);
}

/**
 * 评估是否需要切换工作流
 * @param {string} userInput - 用户输入
 * @param {string} currentContext - 当前上下文
 * @returns {object} 评估结果
 */
function evaluateWorkflowSwitch(userInput, currentContext = '') {
  return WorkflowSwitch.workflowSwitch.evaluateSwitch(userInput, currentContext);
}

/**
 * 切换工作流
 * @param {string} targetWorkflow - 目标工作流
 * @returns {object} 切换结果
 */
function switchWorkflow(targetWorkflow) {
  return WorkflowSwitch.workflowSwitch.switchWorkflow(targetWorkflow);
}

/**
 * 获取当前工作流
 * @returns {object} 工作流信息
 */
function getCurrentWorkflow() {
  return WorkflowSwitch.workflowSwitch.getCurrentWorkflow();
}

/**
 * 获取可用工作流列表
 * @returns {array} 工作流列表
 */
function getAvailableWorkflows() {
  return WorkflowSwitch.workflowSwitch.getAvailableWorkflows();
}

/**
 * 生成工作流报告
 * @returns {string} 报告文本
 */
function generateWorkflowReport() {
  return WorkflowSwitch.workflowSwitch.generateReport();
}

/**
 * 重置工作流
 * @returns {object} 重置结果
 */
function resetWorkflow() {
  return WorkflowSwitch.workflowSwitch.reset();
}

/**
 * 设置工作流配置
 * @param {object} config - 配置对象
 * @returns {object} 配置结果
 */
function setWorkflowConfig(config) {
  return WorkflowSwitch.workflowSwitch.setConfig(config);
}

// 导出工作流相关函数
module.exports.analyzeIntent = analyzeIntent;
module.exports.evaluateWorkflowSwitch = evaluateWorkflowSwitch;
module.exports.switchWorkflow = switchWorkflow;
module.exports.getCurrentWorkflow = getCurrentWorkflow;
module.exports.getAvailableWorkflows = getAvailableWorkflows;
module.exports.generateWorkflowReport = generateWorkflowReport;
module.exports.resetWorkflow = resetWorkflow;
module.exports.setWorkflowConfig = setWorkflowConfig;
module.exports.WorkflowSwitch = WorkflowSwitch;

/**
 * ========================================
 * 心流状态预测与解释模块
 * ========================================
 */

const FlowPredictor = require('./flow-predictor.js');

/**
 * 记录编辑行为
 * @param {object} editEvent - 编辑事件
 */
function recordEditBehavior(editEvent) {
  return FlowPredictor.flowPredictor.recordEdit(editEvent);
}

/**
 * 记录错误事件
 * @param {object} errorEvent - 错误事件
 */
function recordErrorBehavior(errorEvent) {
  return FlowPredictor.flowPredictor.recordError(errorEvent);
}

/**
 * 记录暂停时长
 * @param {number} duration - 暂停时长 (秒)
 */
function recordPauseBehavior(duration) {
  return FlowPredictor.flowPredictor.recordPause(duration);
}

/**
 * 分析语言负面模式
 * @param {string} userInput - 用户输入
 * @returns {object} 分析结果
 */
function analyzeNegativePatterns(userInput) {
  return FlowPredictor.flowPredictor.analyzeLanguage(userInput);
}

/**
 * 评估是否需要干预
 * @returns {object} 干预评估结果
 */
function evaluateFlowIntervention() {
  return FlowPredictor.flowPredictor.evaluateIntervention();
}

/**
 * 获取心流状态
 * @returns {object} 心流状态
 */
function getFlowState() {
  return FlowPredictor.flowPredictor.getFlowState();
}

/**
 * 生成心流报告
 * @returns {string} 报告文本
 */
function generateFlowReport() {
  return FlowPredictor.flowPredictor.generateReport();
}

/**
 * 重置心流预测器
 * @returns {object} 重置结果
 */
function resetFlowPredictor() {
  return FlowPredictor.flowPredictor.reset();
}

/**
 * 设置心流预测配置
 * @param {object} config - 配置对象
 * @returns {object} 配置结果
 */
function setFlowConfig(config) {
  return FlowPredictor.flowPredictor.setConfig(config);
}

// 导出心流预测相关函数
module.exports.recordEditBehavior = recordEditBehavior;
module.exports.recordErrorBehavior = recordErrorBehavior;
module.exports.recordPauseBehavior = recordPauseBehavior;
module.exports.analyzeNegativePatterns = analyzeNegativePatterns;
module.exports.evaluateFlowIntervention = evaluateFlowIntervention;
module.exports.getFlowState = getFlowState;
module.exports.generateFlowReport = generateFlowReport;
module.exports.resetFlowPredictor = resetFlowPredictor;
module.exports.setFlowConfig = setFlowConfig;
module.exports.FlowPredictor = FlowPredictor;
