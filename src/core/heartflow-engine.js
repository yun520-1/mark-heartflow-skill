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
