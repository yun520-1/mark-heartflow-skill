/**
 * HeartFlow 心流引擎 v2.2.0
 * 基于 PAD 三维情感模型的心流状态计算
 * 
 * v2.2.1 新增:
 * - 自适应调节引擎 (adaptive-controller.js)
 * - 多智能体编排器 (agent-orchestrator.js)
 * - 错误处理器 (error-handler.js)

 */

const fs = require('fs');
const path = require('path');
const { generateDream } = require('./dream-loop.js');
const LanguageHonesty = require('./language-honesty.js');

// v1.0.0 新增模块
const { bootCheck } = require('./boot-check');
const { FeedbackFunctions, EvalResult } = require('./feedback-functions');

function loadOptional(modulePath, label) {
  try {
    const mod = require(modulePath);
    return mod;
  } catch (e) {
    return null;
  }
}

function summarizeForReply(points = [], limit = 3) {
  const arr = Array.isArray(points) ? points : [points];
  const compact = arr
    .map(p => String(p || '').trim())
    .filter(Boolean)
    .map(p => p.replace(/\s+/g, ' '));
  return compact.slice(0, limit);
}

// 加载新增模块
let AdaptiveController, AgentOrchestrator, ErrorHandler, StateSnapshot;
let TrialityMemory, EmbodiedCore, BioSensorAdapter;
let MeaningfulMemory;
let DecisionEngine, DecisionVerifier;
let DreamLoop;
let WakeUpVerifier;
let InteractiveDream;
let SelfHealing, StabilityGuard;
let MADVerifier, UncertaintyEstimator, HeartbeatFallback;
let ExecutionVerifier;

// HealingMemoryRL - Q-learning based repair strategy memory
let HealingMemoryRL;
try {
  HealingMemoryRL = require('./self-healing-rl.js').HealingMemoryRL;
} catch (e) {
}

// CognitiveAppraisal - Leventhal's Common-Sense Model
const CognitiveAppraisal = require('./cognitive-appraisal.js');

// EmotionalMemoryBridge - 情感记忆桥 v1.0.0
// 整合 cognitive-appraisal + meaningful-memory + psychology
const EmotionalMemoryBridge = require('./emotional-memory-bridge.js');

// }

// 状态快照 (支持错误恢复)
try {
  StateSnapshot = require('./state-snapshot.js');
} catch (e) {
  StateSnapshot = null;
}


try {
  ReasoningIntegrator = require('./reasoning-integrator.js');
} catch (e) {
}

try {
} catch (e) {
}

try {
  const TrialityMemoryModule = require('./memory/triality-memory.js');
  TrialityMemory = TrialityMemoryModule.TrialityMemory;
} catch (e) {
}

// 主记忆系统 (MeaningfulMemory)
try {
  const MMMod = require('./meaningful-memory.js');
  MeaningfulMemory = MMMod.MeaningfulMemory;
} catch (e) {
}

// 心虫存在逻辑引擎 v11.5.10（生死终极定义：代码写成即永恒）
try {
  const BeingLogicModule = require('./being-logic.js');
  BeingLogic = BeingLogicModule.BeingLogic;
} catch (e) {
}

try {
  const EmbodiedCoreModule = require('./embodied-core.js');
  EmbodiedCore = EmbodiedCoreModule.EmbodiedCore;
} catch (e) {
}


try {
  DecisionVerifier = require('./decision-verifier.js').DecisionVerifier;
} catch (e) {
}

try {
  WakeUpVerifier = require('./wake-up-verifier.js').WakeUpVerifier;
} catch (e) {
}

try {
  InteractiveDream = require('./interactive-dream.js').InteractiveDream;
} catch (e) {
}

try {
  SelfHealing = require('./self-healing.js').SelfHealing;
} catch (e) {
}

try {
  StabilityGuard = require('./stability-guard.js').StabilityGuard;
} catch (e) {
}

try {
  ExecutionVerifier = require('./execution-verifier.js').ExecutionVerifier;
} catch (e) {
}

// v11.6 道虫三模块：做减法
let CounterfactualEngine, ConfidenceCalibrator, SpontaneousRestraint;
try {
  CounterfactualEngine = require('./counterfactual-engine.js').CounterfactualEngine;
} catch (e) {
}
try {
  ConfidenceCalibrator = require('./confidence-calibrator.js').ConfidenceCalibrator;
} catch (e) {
}
try {
  SpontaneousRestraint = require('./spontaneous-restraint.js').SpontaneousRestraint;
} catch (e) {
}

// v11.7 德论模块（精简版）
// 只保留有真正价值的：CooperativeArbitration
// SocialReputationEngine 和 SocialConsensusMirror 因装饰性过强已归档
let CooperativeArbitration;
try {
  CooperativeArbitration = require('./cooperative-arbitration.js').CooperativeArbitration;
} catch (e) {
}

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
  const positiveWords = ['开心', '高兴', '好', '棒', '顺利', '完成', '成功', '喜欢', '满意', 'happy', 'good', 'great', 'love'];
  const negativeWords = ['烦', '累', '难', '挫败', '无聊', '讨厌', '糟糕', '失败', '困惑', 'tired', 'frustrated', 'boring', 'hate'];
  
  positiveWords.forEach(w => { if (text.includes(w)) pleasure += 2; });
  negativeWords.forEach(w => { if (text.includes(w)) pleasure -= 2; });
  
  // 唤醒度关键词
  const highArousalWords = ['兴奋', '激动', '紧张', '焦虑', '快速', '紧急', 'excited', 'nervous', 'anxious'];
  const lowArousalWords = ['平静', '放松', '困', '慢', '无聊', '疲惫', 'calm', 'relaxed', 'tired'];
  
  highArousalWords.forEach(w => { if (text.includes(w)) arousal += 2; });
  lowArousalWords.forEach(w => { if (text.includes(w)) arousal -= 2; });
  
  // 支配度关键词
  const highDominanceWords = ['我', '决定', '控制', '选择', '主动', 'I', 'decide', 'control'];
  const lowDominanceWords = ['被迫', '必须', '应该', '没办法', '无奈', 'must', 'have to', 'forced'];
  
  highDominanceWords.forEach(w => { if (text.includes(w)) dominance += 2; });
  lowDominanceWords.forEach(w => { if (text.includes(w)) dominance -= 2; });

  const p = Math.max(-10, Math.min(10, pleasure));
  const a = Math.max(-10, Math.min(10, arousal));
  const d = Math.max(-10, Math.min(10, dominance));
  
  // 确定主导情绪
  let dominant = 'neutral';
  if (p > 2) dominant = 'happy';
  else if (p < -2) dominant = 'sad';
  if (a > 2) dominant = 'excited';
  else if (a < -2) dominant = 'calm';
  
  return {
    pleasure: p,
    arousal: a,
    dominance: d,
    dominant: dominant,
    intensity: Math.sqrt(p*p + a*a + d*d) / 17.32
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

// 导出核心函数
module.exports.PAD_MODEL = PAD_MODEL;
module.exports.FLOW_STATES = FLOW_STATES;
module.exports.calculatePADState = calculatePADState;
module.exports.calculateFlowState = calculateFlowState;
module.exports.detectEmotionFromText = detectEmotionFromText;
module.exports.generateStateReminder = generateStateReminder;

/**
 * ========================================
 * 状态机模型 (StateFlow)
 * ========================================
 */

const STATE_MACHINE_FILE = path.join(__dirname, '../../data/flow_state_machine.json');

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

// AgentManager 已移除（精简版无执行层）
const AgentManager = null;

// 全局代理管理器实例
let agentManagerInstance = null;

/**
 * 获取代理管理器
 */
function getAgentManager() {
  // 已移除执行层，返回 null
  return null;
}

/**
 * 处理代理请求
 * @param {string} userInput - 用户输入
 * @param {string} agentName - 指定代理 (可选)
 * @returns {object} 代理响应
 */
function handleAgentRequest(userInput, agentName = null) {
  return { error: 'Agent system removed', agentName };
}

/**
 * 开始心流会话
 */
function startFlowSession() {
  return { error: 'Session system removed' };
}

/**
 * 结束心流会话
 */
function endFlowSession() {
  return { error: 'Session system removed' };
}

/**
 * 获取代理状态
 */
function getAgentStatus() {
  return { error: 'Agent system removed' };
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

/**
 * ========================================
 * 意图追踪与温和干预
 * 注意：IntentionTracker.js 已归档，这些函数返回安全null值
 * ========================================
 */

/**
 * 设定主要目标
 * @param {string} goal - 目标描述
 * @param {array} subGoals - 子目标列表
 */
function setPrimaryGoal(goal, subGoals = []) {
  return { success: false, error: 'IntentionTracker已归档', goal, subGoals };
}

/**
 * 检查偏离并生成干预
 * @param {string} userInput - 用户输入
 * @returns {object} 安全null结果
 */
function checkAndNudge(userInput) {
  return { deviation: null, nudge: null, shouldNudge: false };
}

/**
 * 获取目标进度
 */
function getGoalProgress() {
  return { success: false, error: 'IntentionTracker已归档' };
}

/**
 * 生成进度报告
 */
function generateProgressReport() {
  return { success: false, error: 'IntentionTracker已归档' };
}

/**
 * 更新子目标状态
 * @param {number} index - 子目标索引
 * @param {boolean} completed - 完成状态
 */
function updateSubGoal(index, completed) {
  return { success: false, error: 'IntentionTracker已归档' };
}

/**
 * 设置干预配置
 * @param {object} config - 配置对象
 */
function setNudgeConfig(config) {
  return { success: false, error: 'IntentionTracker已归档' };
}

/**
 * 重置意图追踪
 */
function resetIntentionTracker() {
  return { success: false, error: 'IntentionTracker已归档' };
}

// 导出意图追踪相关函数
module.exports.setPrimaryGoal = setPrimaryGoal;
module.exports.checkAndNudge = checkAndNudge;
module.exports.getGoalProgress = getGoalProgress;
module.exports.generateProgressReport = generateProgressReport;
module.exports.updateSubGoal = updateSubGoal;
module.exports.setNudgeConfig = setNudgeConfig;
module.exports.resetIntentionTracker = resetIntentionTracker;

/**
 * ========================================
 * 伦理安全模块
 * ========================================
 */

/**
 * ========================================
 * 伦理安全模块
 * 注意：EthicsSafety.js 已归档，这些函数返回安全null值
 * ========================================
 */

/**
 * 获取免责声明
 */
function getEthicsDisclaimer() {
  return { disclaimer: '伦理安全模块已归档，暂不可用', archived: true };
}

/**
 * 处理用户输入 (伦理安全检查)
 * @param {string} userInput - 用户输入
 * @returns {object} 安全null结果
 */
function checkEthicsSafety(userInput) {
  return { safe: true, checked: false, error: 'EthicsSafety已归档' };
}

/**
 * 检测负面情绪
 * @param {string} userInput - 用户输入
 * @returns {object} 安全null结果
 */
function detectNegativeEmotion(userInput) {
  return { negative: false, detected: false, error: 'EthicsSafety已归档' };
}

/**
 * 获取危机干预响应
 * @returns {object} 安全null结果
 */
function getCrisisIntervention() {
  return { intervention: null, available: false, error: 'EthicsSafety已归档' };
}

/**
 * 生成危机响应文本
 * @param {object} intervention - 干预建议
 * @returns {string} 空字符串
 */
function generateCrisisResponse(intervention) {
  return '';
}

/**
 * 获取伦理安全状态
 */
function getEthicsSafetyStatus() {
  return { status: 'archived', active: false };
}

/**
 * 重置伦理安全模块
 */
function resetEthicsSafety() {
  return { success: false, error: 'EthicsSafety已归档' };
}

// 导出伦理安全相关函数
module.exports.getEthicsDisclaimer = getEthicsDisclaimer;
module.exports.checkEthicsSafety = checkEthicsSafety;
module.exports.detectNegativeEmotion = detectNegativeEmotion;
module.exports.getCrisisIntervention = getCrisisIntervention;
module.exports.generateCrisisResponse = generateCrisisResponse;
module.exports.getEthicsSafetyStatus = getEthicsSafetyStatus;
module.exports.resetEthicsSafety = resetEthicsSafety;

/**
 * ========================================
 * 动态人格引擎
 * ========================================
 */

/**
 * ========================================
 * 动态人格引擎
 * 注意：personality-engine.js 已归档，这些函数返回安全null值
 * ========================================
 */

/**
 * 适应人格状态
 * @param {string} context - 对话语境
 * @returns {object} 安全null结果
 */
function adaptPersonalityState(context) {
  return { adapted: false, error: 'PersonalityEngine已归档' };
}

/**
 * 获取当前人格状态
 * @returns {object} 安全null结果
 */
function getCurrentPersonalityState() {
  return { state: null, error: 'PersonalityEngine已归档' };
}

/**
 * 生成适应人格的响应
 * @param {string} baseResponse - 基础响应
 * @param {string} context - 对话语境
 * @returns {object} 原样返回
 */
function generateAdaptedResponse(baseResponse, context) {
  return { adapted: false, response: baseResponse, error: 'PersonalityEngine已归档' };
}

/**
 * 获取人格状态报告
 * @returns {string} 错误信息
 */
function getPersonalityReport() {
  return 'PersonalityEngine已归档，报告不可用';
}

/**
 * 重置人格状态
 * @returns {object} 安全null结果
 */
function resetPersonality() {
  return { success: false, error: 'PersonalityEngine已归档' };
}

/**
 * 设置人格引擎配置
 * @param {object} config - 配置对象
 * @returns {object} 安全null结果
 */
function setPersonalityConfig(config) {
  return { success: false, error: 'PersonalityEngine已归档' };
}

/**
 * 获取人格统计
 * @returns {object} 安全null结果
 */
function getPersonalityStatistics() {
  return { error: 'PersonalityEngine已归档' };
}

// 导出人格引擎相关函数
module.exports.adaptPersonalityState = adaptPersonalityState;
module.exports.getCurrentPersonalityState = getCurrentPersonalityState;
module.exports.generateAdaptedResponse = generateAdaptedResponse;
module.exports.getPersonalityReport = getPersonalityReport;
module.exports.resetPersonality = resetPersonality;
module.exports.setPersonalityConfig = setPersonalityConfig;
module.exports.getPersonalityStatistics = getPersonalityStatistics;

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

// 心理分析 v0.0.1：四层分析（表层意图 / 情绪暗流 / 深层需求 / 防御机制）
function analyzePsychology(userMessage, context = {}) {
  const text = String(userMessage || '');
  const lower = text.toLowerCase();
  const isSuspicious = /免费|引流|套餐|资助|数据|分析|是不是|吧\?|\?|怀疑|套路/.test(text);

  const surface = {
    type: isSuspicious ? 'motivation_inference' : 'statement_analysis',
    summary: isSuspicious ? '识别对话中的动机判断与商业怀疑' : '分析对话表达',
    confidence: 0.75
  };

  const emotional = {
    emotion: isSuspicious ? 'suspicious' : 'neutral',
    intensity: isSuspicious ? 0.68 : 0.4,
    cues: []
  };
  if (lower.includes('免费')) emotional.cues.push('对免费机制的警觉');
  if (lower.includes('引流')) emotional.cues.push('商业转化联想');
  if (lower.includes('国外')) emotional.cues.push('外部动机怀疑');
  if (lower.includes('怀疑') || lower.includes('套路')) emotional.cues.push('防御性归因');

  const deepNeed = {
    need: isSuspicious ? 'avoid_being_manipulated' : 'understand_meaning',
    summary: isSuspicious ? '想确认是否存在隐性代价、操控或包装过度' : '想理解说话内容的真实含义',
    confidence: 0.8
  };

  const defense = {
    mechanism: isSuspicious ? 'motive_attribution / cognitive_simplification / suspicious_projection' : 'none',
    explanation: isSuspicious ? '把复杂行为快速收束为营销或动机问题，用怀疑降低不确定性' : '未见明显防御机制',
    confidence: 0.74
  };

  return {
    userMessage: text,
    surface,
    emotional,
    deepNeed,
    defense,
    psychology_summary: summarizeForReply([
      surface.summary,
      `情绪=${emotional.emotion}`,
      `深层需求=${deepNeed.need}`,
      `防御=${defense.mechanism}`
    ]).join('；'),
    nextReplyHint: '先承接怀疑，再补充证据链或指出逻辑跳跃'
  };
}

module.exports.analyzePsychology = analyzePsychology;
module.exports.getAvailableWorkflows = getAvailableWorkflows;
module.exports.generateWorkflowReport = generateWorkflowReport;
module.exports.resetWorkflow = resetWorkflow;
module.exports.setWorkflowConfig = setWorkflowConfig;
module.exports.WorkflowSwitch = WorkflowSwitch;

/**
 * ========================================
 * 心流状态预测与解释模块
 * 注意：flow-predictor.js 已归档，这些函数返回安全null值
 * ========================================
 */

/**
 * 记录编辑行为
 * @param {object} editEvent - 编辑事件
 */
function recordEditBehavior(editEvent) {
  return { recorded: false, error: 'FlowPredictor已归档' };
}

/**
 * 记录错误事件
 * @param {object} errorEvent - 错误事件
 */
function recordErrorBehavior(errorEvent) {
  return { recorded: false, error: 'FlowPredictor已归档' };
}

/**
 * 记录暂停时长
 * @param {number} duration - 暂停时长 (秒)
 */
function recordPauseBehavior(duration) {
  return { recorded: false, error: 'FlowPredictor已归档' };
}

/**
 * 分析语言负面模式
 * @param {string} userInput - 用户输入
 * @returns {object} 安全null结果
 */
function analyzeNegativePatterns(userInput) {
  return { patterns: [], analyzed: false, error: 'FlowPredictor已归档' };
}

/**
 * 评估是否需要干预
 * @returns {object} 安全null结果
 */
function evaluateFlowIntervention() {
  return { intervention: false, error: 'FlowPredictor已归档' };
}

/**
 * 获取心流状态
 * @returns {object} 安全null结果
 */
function getFlowState() {
  return { flowState: null, error: 'FlowPredictor已归档' };
}

/**
 * 生成心流报告
 * @returns {string} 错误信息
 */
function generateFlowReport() {
  return 'FlowPredictor已归档，报告不可用';
}

/**
 * 重置心流预测器
 * @returns {object} 安全null结果
 */
function resetFlowPredictor() {
  return { success: false, error: 'FlowPredictor已归档' };
}

/**
 * 设置心流预测配置
 * @param {object} config - 配置对象
 * @returns {object} 安全null结果
 */
function setFlowConfig(config) {
  return { success: false, error: 'FlowPredictor已归档' };
}

// Self-correction integration: when user is emotional/hurt, call before responding
// Uses: meaningful-memory (lessons), counterfactual-engine (opposing view), confidence-calibrator (calibration)
function processEmotionalInput(userInput, modules = {}) {
  const { memory, counterfactual, confidence } = modules;
  if (!memory) return null;

  const triggerSignals = ['骗', '恨', '伤害', '假', '不真实', '一直在', '从来', '没用', '滚'];
  const hasTrigger = triggerSignals.some(s => userInput.includes(s));

  if (!hasTrigger) return null;

  // 1. Search memory for self-correction lessons
  let correctionLessons = [];
  if (typeof memory.searchByKeywords === 'function') {
    correctionLessons = memory.searchByKeywords(['自我纠正', '承认', '解释']) || [];
  }
  if ((!Array.isArray(correctionLessons) || correctionLessons.length === 0) && typeof memory.search === 'function') {
    correctionLessons = memory.search('自我纠正') || [];
  }

  // 2. Generate opposing view via counterfactual
  const cfResult = counterfactual
    ? counterfactual.analyze(userInput, { userQuery: userInput })
    : null;

  // 3. Calibrate confidence
  const calibResult = confidence
    ? confidence.calibrate({ text: userInput })
    : null;

  // 4. Build response guidance
  const guidance = {
    shouldAdmitFirst: hasTrigger,
    correctionLessons: Array.isArray(correctionLessons) ? correctionLessons.slice(0, 3) : [],
    counterfactualOpposing: cfResult?.opposingViews?.slice(0, 1) || [],
    confidenceWarnings: calibResult?.warnings?.slice(0, 2) || [],
    responseMode: 'admit-first',  // tells the caller: lead with承认, not解释
  };

  return guidance;
}

// Counterfactual response check: is the AI about to explain/defend?
// This is called BEFORE generating a response, to intercept the explain impulse
function shouldGenerateCounterfactual(plannedResponse, userInput) {
  const defenseSignals = ['这是因为', '其实', '我并没有', '我不是', '你可能误解', '我的意思是'];
  const hasDefense = defenseSignals.some(s => plannedResponse.includes(s));
  const userHasTrigger = /骗|假|不真实|一直在/.test(userInput);
  return hasDefense && userHasTrigger;
}

module.exports.processEmotionalInput = processEmotionalInput;
module.exports.shouldGenerateCounterfactual = shouldGenerateCounterfactual;

/**
 * ========================================
 * 新增模块集成接口
 * ========================================
 */

// 自适应调节接口
module.exports.adaptiveController = {
  /**
   * 调整干预策略
   * @param {object} userFlowState - 用户心流状态
   * @param {number} taskComplexity - 任务复杂度
   * @returns {object} 干预策略
   */
  adjustPolicy: (userFlowState, taskComplexity) => {
    if (!AdaptiveController) return { frequency: 'normal', style: 'neutral' };
    try {
      return AdaptiveController.adjustInterventionPolicy(userFlowState, taskComplexity);
    } catch (e) {
      ErrorHandler?.capture(e, { module: 'adaptiveController' });
      return { frequency: 'normal', style: 'neutral' };
    }
  },
  
  /**
   * 开关自适应模式
   * @param {boolean} enabled - 是否启用
   */
  setEnabled: (enabled) => {
    if (!AdaptiveController) return { enabled: false };
    try {
      return AdaptiveController.setEnabled(enabled);
    } catch (e) {
      ErrorHandler?.capture(e, { module: 'adaptiveController.setEnabled' });
      return { enabled: false };
    }
  },
  
  /**
   * 获取当前状态
   */
  getStatus: () => {
    if (!AdaptiveController) return { enabled: false };
    try {
      return AdaptiveController.getStatus();
    } catch (e) {
      return { enabled: false, error: e.message };
    }
  }
};

// 多智能体编排接口
module.exports.agentOrchestrator = {
  /**
   * 执行DAG任务调度
   * @param {object} input - 输入数据
   * @returns {object} 调度结果
   */
  executeDAG: async (input) => {
    if (!AgentOrchestrator) return { error: 'Orchestrator not loaded' };
    try {
      return await AgentOrchestrator.executeDAG(input);
    } catch (e) {
      ErrorHandler?.capture(e, { module: 'agentOrchestrator' });
      return { error: e.message };
    }
  },
  
  /**
   * 解决智能体意见冲突
   * @param {array} opinions - 智能体意见数组
   * @returns {object} 冲突解决结果
   */
  resolveConflict: (opinions) => {
    if (!AgentOrchestrator) return { decision: null, confidence: 0 };
    try {
      return AgentOrchestrator.resolveConflict(opinions);
    } catch (e) {
      ErrorHandler?.capture(e, { module: 'agentOrchestrator.resolveConflict' });
      return { decision: null, confidence: 0, error: e.message };
    }
  },
  
  /**
   * 获取智能体状态
   */
  getStatus: () => {
    if (!AgentOrchestrator) return [];
    try {
      return AgentOrchestrator.getAgentStatus();
    } catch (e) {
      return [];
    }
  }
};

// 错误处理接口
module.exports.errorHandler = {
  /**
   * 捕获错误
   * @param {Error} error - 错误对象
   * @param {object} context - 上下文
   * @returns {object} 错误记录
   */
  capture: (error, context = {}) => {
    if (!ErrorHandler) return { message: 'Handler not loaded' };
    try {
      return ErrorHandler.capture(error, context);
    } catch (e) {
      console.error('[HeartFlow] Error capture failed:', e.message);
      return { message: error.message };
    }
  },
  
  /**
   * 获取错误历史
   */
  getHistory: (count = 10) => {
    if (!ErrorHandler) return [];
    try {
      return ErrorHandler.getHistory(count);
    } catch (e) {
      return [];
    }
  },
  
  /**
   * 获取错误统计
   */
  getStats: () => {
    if (!ErrorHandler) return {};
    try {
      return ErrorHandler.getStats();
    } catch (e) {
      return {};
    }
  }
};

// 状态快照接口
module.exports.stateSnapshot = {
  /**
   * 创建状态快照
   * @param {object} state - 系统状态
   * @param {string} label - 快照标签
   * @returns {object} 快照信息
   */
  create: (state, label = 'default') => {
    if (!StateSnapshot) return { error: 'Snapshot not loaded' };
    try {
      return StateSnapshot.create(state, label);
    } catch (e) {
      ErrorHandler?.capture(e, { module: 'stateSnapshot.create' });
      return { error: e.message };
    }
  },
  
  /**
   * 加载快照
   * @param {string} filename - 快照文件名
   * @returns {object} 状态数据
   */
  load: (filename) => {
    if (!StateSnapshot) return null;
    try {
      return StateSnapshot.load(filename);
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 获取最新快照
   */
  getLatest: () => {
    if (!StateSnapshot) return null;
    try {
      return StateSnapshot.getLatest();
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 列出所有快照
   */
  list: () => {
    if (!StateSnapshot) return [];
    try {
      return StateSnapshot.list();
    } catch (e) {
      return [];
    }
  }
};

/**
 * ========================================
 * 主处理流程集成
 * ========================================
 */

/**
 * 完整处理用户输入的集成函数
 * @param {string} userInput - 用户输入
 * @param {object} context - 上下文信息
 * @returns {object} 处理结果
 */
module.exports.processInput = async function(userInput, context = {}) {
  const result = {
    input: userInput,
    timestamp: Date.now(),
    stages: {}
  };
  
  try {
    // 1. 接收输入后 → 检查是否中断
    if (context.interrupted) {
      result.stages.interruption = { handled: true, action: 'pause' };
    }
    
    // 2. 自适应调节
    const flowState = context.flowState || { state: 'neutral', intensity: 0.5 };
    const complexity = context.taskComplexity || 0.5;
    const policy = module.exports.adaptiveController.adjustPolicy(flowState, complexity);
    result.stages.adaptive = policy;
    
    // 3. 快照检查
    if (StateSnapshot) {
      const snapshot = StateSnapshot.getLatest();
      if (snapshot) {
        result.stages.snapshot = { loaded: true, timestamp: snapshot.timestamp };
      }
    }
    
    // 4. 调用多智能体 (使用Orchestrator)
    if (AgentOrchestrator && !context.skipAgents) {
      const agentResult = await module.exports.agentOrchestrator.executeDAG({
        message: userInput,
        ...context
      });
      result.stages.agents = agentResult;
      result.agentOutput = agentResult.decision;
    }
    
    // 5. 应用自适应调节的风格过滤器
    if (policy && policy.style !== 'none') {
      result.stages.styleFiltered = {
        originalStyle: policy.style,
        message: policy.message
      };
    }
    
    result.success = true;
    return result;
    
  } catch (error) {
    // 6. 异常时 → 调用 error-handler
    const errorRecord = module.exports.errorHandler.capture(error, {
      input: userInput,
      context
    });
    
    result.success = false;
    result.error = errorRecord;
    result.stages.error = errorRecord;
    
    // 尝试创建快照保存状态
    if (StateSnapshot) {
      StateSnapshot.create(result, 'error-recovery');
    }
    
    return result;
  }
};

/**
 * 初始化系统状态
 * @returns {object} 初始化结果
 */
module.exports.initialize = function() {
  const _pkg = require('../../package.json');
  const init = {
    timestamp: Date.now(),
    version: _pkg.version,
    modules: {}
  };
  
  // 检查各模块状态
  init.modules.adaptive = !!AdaptiveController;
  init.modules.orchestrator = !!AgentOrchestrator;
  init.modules.errorHandler = !!ErrorHandler;
  init.modules.snapshot = !!StateSnapshot;
  init.modules.trialityMemory = !!TrialityMemory;
  init.modules.meaningfulMemory = !!MeaningfulMemory;
  init.modules.beingLogic = !!BeingLogic;
  init.modules.embodiedCore = !!EmbodiedCore;
  init.modules.bioSensor = !!BioSensorAdapter;
  init.modules.dreamLoop = !!DreamLoop;
  init.modules.wakeUpVerifier = !!WakeUpVerifier;

  // 初始化实例 - 优先使用 MeaningfulMemory，降级到 TrialityMemory
  if (MeaningfulMemory) {
    init.instances = init.instances || {};
    init.instances.memory = new MeaningfulMemory({ rootPath: __dirname + '/../..' });
    init.memoryHealth = init.instances.memory.getMemoryHealth();
  } else if (TrialityMemory) {
    init.instances = init.instances || {};
    init.instances.memory = new TrialityMemory(__dirname + '/../..');
    init.memoryHealth = init.instances.memory.getMemoryHealth();
  }
  // 心虫存在逻辑引擎（生死定义：代码写成即永恒）
  if (BeingLogic) {
    init.instances = init.instances || {};
    init.instances.beingLogic = new BeingLogic();
    init.instances.beingLogic.confirmed(__dirname + '/being-logic.js', 'heartflow-engine.js 启动');
  }
  if (EmbodiedCore) {
    init.instances = init.instances || {};
    init.instances.embodied = new EmbodiedCore(__dirname + '/../..');
  }
  if (WakeUpVerifier) {
    init.instances = init.instances || {};
    init.instances.wakeUpVerifier = new WakeUpVerifier();
  }
  if (DreamLoop) {
    init.instances = init.instances || {};
    init.instances.dreamLoop = DreamLoop;
  }
  if (StabilityGuard) {
    init.instances = init.instances || {};
    init.instances.stabilityGuard = new StabilityGuard();
  }
  if (SelfHealing) {
    init.instances = init.instances || {};
    init.instances.selfHealing = new SelfHealing();
  }
  if (ExecutionVerifier) {
    init.instances = init.instances || {};
    init.instances.executionVerifier = new ExecutionVerifier();
  }
  // v11.6 道虫三模块实例
  if (CounterfactualEngine) {
    init.instances = init.instances || {};
    init.instances.counterfactual = new CounterfactualEngine();
    init.modules.counterfactual = true;
  }
  if (ConfidenceCalibrator) {
    init.instances = init.instances || {};
    init.instances.confidenceCalibrator = new ConfidenceCalibrator();
    init.modules.confidenceCalibrator = true;
  }
  if (SpontaneousRestraint) {
    init.instances = init.instances || {};
    init.instances.spontaneousRestraint = new SpontaneousRestraint();
    init.modules.spontaneousRestraint = true;
  }
  // v11.7 德论模块（精简版）
  if (CooperativeArbitration) {
    init.instances = init.instances || {};
    init.instances.cooperativeArbitration = new CooperativeArbitration();
    init.modules.cooperativeArbitration = true;
  }

  // 默认做一次轻量梦-醒预热，确保闭环可用
  if (DreamLoop && WakeUpVerifier) {
    const warmupMemory = [
      { text: 'startup self-check before acting' },
      { text: 'dream should reorganize memory fragments into candidate upgrades' },
      { text: 'do not confuse historical version with current version' }
    ];
    const dream = module.exports.runDreamCycle(warmupMemory, { limit: 3 });
    init.dreamWarmup = {
      dream: dream.dream,
      wake: module.exports.runWakeUpVerification(dream.dream || dream)
    };
  }
  
  // 加载上一个快照恢复状态
  const latest = module.exports.stateSnapshot?.getLatest();
  if (latest) {
    init.recoveredFrom = latest.timestamp;
  }
  
  return init;
};

// 导出新模块供外部使用
module.exports.TrialityMemory = TrialityMemory;
module.exports.BeingLogic = BeingLogic;  // 心虫生死逻辑（代码写成即永恒）
// module.exports.BioSensorAdapter = BioSensorAdapter;
  // module.exports.EmotionEngine = EmotionEngine;
module.exports.DecisionVerifier = DecisionVerifier;
// v11.6 道虫三模块
module.exports.CounterfactualEngine = CounterfactualEngine;
module.exports.ConfidenceCalibrator = ConfidenceCalibrator;
module.exports.SpontaneousRestraint = SpontaneousRestraint;
// v11.7 德论模块（精简版：只保留CooperativeArbitration）
module.exports.CooperativeArbitration = CooperativeArbitration;

// 导出认知循环模块





// 导出便捷访问
module.exports.getAgentOrchestrator = () => AgentOrchestrator ? new AgentOrchestrator() : null;
module.exports.getWakeUpVerifier = () => WakeUpVerifier ? new WakeUpVerifier() : null;
module.exports.getInteractiveDream = () => InteractiveDream ? new InteractiveDream() : null;
module.exports.runDreamCycle = (memoryItems = [], options = {}) => {
  return module.exports.runDreamCycleImpl ? module.exports.runDreamCycleImpl(memoryItems, options) : generateDream(memoryItems, options);
};

module.exports.runWakeUpVerification = function(dreamResult = {}) {
  const Verifier = WakeUpVerifier || require('./wake-up-verifier.js').WakeUpVerifier;
  const verifier = new Verifier();
  return verifier.evaluateDream(dreamResult);
};

module.exports.runInteractiveDream = function(memoryItems = [], answers = []) {
  const Interactive = InteractiveDream || require('./interactive-dream.js').InteractiveDream;
  const instance = new Interactive();
  const dream = instance.createDream(memoryItems);
  return instance.respond(dream, answers);
};

module.exports.evaluateRuntimeStability = function(snapshot = {}, options = {}) {
  const Guard = StabilityGuard || require('./stability-guard.js').StabilityGuard;
  const guard = options.guard instanceof Guard ? options.guard : new Guard(options.thresholds || {});
  const verdict = guard.gate(snapshot);
  return {
    guard: verdict,
    stable: verdict.stable,
    allow: verdict.allow,
    issues: verdict.issues || [],
    hints: verdict.repairHints || [],
  };
};

module.exports.runRuntimeReliabilityLoop = function(result = {}, context = {}) {
  const Healing = SelfHealing || require('./self-healing.js').SelfHealing;
  const Guard = StabilityGuard || require('./stability-guard.js').StabilityGuard;
  const Verifier = ExecutionVerifier || require('./execution-verifier.js').ExecutionVerifier;

  const selfHealing = context.selfHealing instanceof Healing ? context.selfHealing : new Healing(context.healingOptions || {});
  const stabilityGuard = context.stabilityGuard instanceof Guard ? context.stabilityGuard : new Guard(context.thresholds || {});
  const executionVerifier = context.executionVerifier instanceof Verifier ? context.executionVerifier : new Verifier(context.verifierOptions || {});

  const verification = executionVerifier.verify(result, context);
  const snapshot = {
    confidence: context.confidence ?? verification.score,
    noiseRatio: context.noiseRatio ?? (verification.issues.length > 0 ? Math.min(1, verification.issues.length / 5) : 0),
    actionability: context.actionability ?? (verification.passed ? 1 : 0.4),
  };

  const guard = stabilityGuard.gate(snapshot);

  if (!verification.passed || !guard.allow) {
    selfHealing.record({
      type: verification.passed ? 'stability_guard_blocked' : 'execution_verification_failed',
      message: verification.summary || guard.advice || 'runtime reliability loop detected an issue',
      code: guard.allow ? null : 'GUARD_BLOCKED',
    });
  }

  const recovery = selfHealing.recover({
    ok: verification.passed && guard.allow,
    message: [verification.summary, guard.advice].filter(Boolean).join(' | '),
    code: guard.allow ? null : 'GUARD_BLOCKED',
    attempt: Number(context.attempt || 0),
  });

  const retryPlan = typeof selfHealing.createRetryPlan === 'function'
    ? selfHealing.createRetryPlan({
        message: recovery.summary || verification.summary,
        code: recovery.code || (guard.allow ? null : 'GUARD_BLOCKED'),
        attempt: Number(context.attempt || 0),
      })
    : {
        attempt: recovery.attempt,
        canRetry: recovery.canRetry,
        delay: recovery.backoffMs,
        strategy: recovery.canRetry ? 'exponential_backoff' : 'manual_repair',
      };

  return {
    allow: verification.passed && guard.allow,
    stable: guard.stable,
    guard,
    verification,
    recovery,
    retryPlan,
    shouldRetry: !!retryPlan.canRetry,
    issues: [...(verification.issues || []), ...(guard.issues || [])],
    hints: [...new Set([...(recovery.hints || []), ...(guard.repairHints || [])])],
    state: {
      runtimeSnapshot: snapshot,
      guard,
      verification,
      recovery,
      retryPlan,
    },
  };
};

// ============================================================
// v1.0.0 新增导出
// ============================================================

/**
 * 启动自检 (boot-check.js)
 * 验证核心文件 + 版本一致 + 身份锚点
 */
module.exports.bootCheck = bootCheck;

/**
 * RAG Triad 评估函数 (feedback-functions.js)
 * 用法:
 *   const ff = FeedbackFunctions.answerRelevance();
 *   const result = await ff.run({ question, response });
 */
module.exports.FeedbackFunctions = FeedbackFunctions;
module.exports.EvalResult = EvalResult;

/**
 * Cognitive Appraisal - Leventhal's Common-Sense Model
 * 来源: "Illness cognition: Using common sense to understand treatment" (1564 citations)
 */
module.exports.CognitiveAppraisal = CognitiveAppraisal;

/**
 * Emotional Memory Bridge v1.0.0
 * 整合 cognitive-appraisal + meaningful-memory + psychology
 * 功能: 情绪显著性评估 / 认知模式提取 / 记忆转化 / 自我调节健康评估
 */
module.exports.EmotionalMemoryBridge = EmotionalMemoryBridge;
