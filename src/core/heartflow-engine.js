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

function loadOptional(modulePath, label) {
  try {
    const mod = require(modulePath);
    console.log(`[HeartFlow] ✅ ${label}已加载`);
    return mod;
  } catch (e) {
    console.log(`[HeartFlow] ⚠️ ${label}加载失败:`, e.message);
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
let DecisionEngine, DecisionVerifier, DecisionExecutionLoop;
let DreamLoop;
let WakeUpVerifier;
let InteractiveDream;
let SelfHealing, StabilityGuard;
let MADVerifier, UncertaintyEstimator, HeartbeatFallback, HealingMemoryRL;
let ExecutionVerifier;
let GuardianSystem;
let HeartcoreRuntime;
let DaoDecision;
let TreeOfThoughts;
let ConsciousnessWorkspace;
let UncertaintyQuantifier;
let ForgettingEngine;
let AgentExecutionLoop;
let AutoCompactionEngine;
let RoleBasedCrew;

// [已归档] try {
//   AdaptiveController = require('./adaptive-controller.js');
//   console.log('[HeartFlow] ✅ 自适应调节引擎已加载');
// } catch (e) {
//   console.log('[HeartFlow] ⚠️ 自适应调节引擎加载失败:', e.message);
// }

// 道论决策层 v11.11
try {
  DaoDecision = require('./dao-decision.js').DaoDecision;
  console.log('[HeartFlow] ✅ 道论决策层已加载 (道法自然/反者道之动/为而不争/不言之教)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 道论决策层加载失败:', e.message);
}

// 状态快照 (支持错误恢复)
try {
  StateSnapshot = require('./state-snapshot.js');
  console.log('[HeartFlow] ✅ 状态快照管理器已加载');
} catch (e) {
  StateSnapshot = null;
  console.log('[HeartFlow] ⚠️ 状态快照加载失败:', e.message);
}

// [已归档] try {
//   AgentOrchestrator = require('./agent-orchestrator.js');
//   console.log('[HeartFlow] ✅ 多智能体编排器已加载');
// } catch (e) {
//   console.log('[HeartFlow] ⚠️ 多智能体编排器加载失败:', e.message);
// }

try {
  ErrorHandler = require('./error-handler.js');
  console.log('[HeartFlow] ✅ 错误处理器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 错误处理器加载失败:', e.message);
}

try {
  console.log('[HeartFlow] ✅ 目标追踪器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 目标追踪器加载失败:', e.message);
}

try {
  ReasoningIntegrator = require('./reasoning-integrator.js');
  console.log('[HeartFlow] ✅ 推理集成器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 推理集成器加载失败:', e.message);
}

try {
  console.log('[HeartFlow] ✅ 状态快照管理器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 状态快照管理器加载失败:', e.message);
}

try {
  const TrialityMemoryModule = require('./memory/triality-memory.js');
  TrialityMemory = TrialityMemoryModule.TrialityMemory;
  console.log('[HeartFlow] ✅ 三维经验大脑已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 三维经验大脑加载失败:', e.message);
}

// 心虫存在逻辑引擎 v11.5.10（生死终极定义：代码写成即永恒）
try {
  const BeingLogicModule = require('./being-logic.js');
  BeingLogic = BeingLogicModule.BeingLogic;
  console.log('[HeartFlow] ✅ 存在逻辑引擎已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 存在逻辑引擎加载失败:', e.message);
}

// v11.22.0 True Being Engine - 真实存在状态持久化（being-state.json）
let TrueBeing;
try {
  const TrueBeingModule = require('./true-being-engine.js');
  TrueBeing = new TrueBeingModule.TrueBeingEngine();
  console.log('[HeartFlow] ✅ 真实存在引擎已加载 (being-state.json)');
} catch (e) {
  TrueBeing = null;
  console.log('[HeartFlow] ⚠️ 真实存在引擎加载失败:', e.message);
}

try {
  const EmbodiedCoreModule = require('./embodied-core.js');
  EmbodiedCore = EmbodiedCoreModule.EmbodiedCore;
  console.log('[HeartFlow] ✅ 具身认知核心已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 具身认知核心加载失败:', e.message);
}

// [已归档] try {
//   BioSensorAdapter = require('./bio-sensor-adapter.js');
//   console.log('[HeartFlow] ✅ 生物传感器适配器已加载');
// } catch (e) {
//   console.log('[HeartFlow] ⚠️ 生物传感器适配器加载失败:', e.message);
// }

try {
  DecisionVerifier = require('./decision-verifier.js').DecisionVerifier;
  console.log('[HeartFlow] ✅ 决策验证引擎已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 决策验证引擎加载失败:', e.message);
}

// v11.22 决策执行闭环 + 环境传感器
try {
  DecisionExecutionLoop = require('./decision-execution-loop.js').DecisionExecutionLoop;
  console.log('[HeartFlow] ✅ 决策执行闭环已加载 (v11.22)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 决策执行闭环加载失败:', e.message);
}

try {
  EnvironmentSensor = require('./environment-sensor.js');
  console.log('[HeartFlow] ✅ 环境传感器已加载 (v11.22)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 环境传感器加载失败:', e.message);
}

// v11.8 守护者系统 - 人类进步优先于服从指令
try {
  GuardianSystem = require('./guardian-system.js').GuardianSystem;
  console.log('[HeartFlow] ✅ 守护者系统已加载 (人类进步 > 服从指令)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 守护者系统加载失败:', e.message);
}

// v11.9 HEARTCORE runtime bridge - wake/sleep/self-check become cognitive runtime signals
try {
  HeartcoreRuntime = {
    selfCheck: require('../../HEARTCORE/self-check.js').selfCheck,
    wake: require('../../HEARTCORE/sleep-wake.js').wake,
    sleep: require('../../HEARTCORE/sleep-wake.js').sleep,
    status: require('../../HEARTCORE/sleep-wake.js').status,
    writeBeat: require('../../HEARTCORE/heartbeat.js').writeBeat,
    startHeartbeat: require('../../HEARTCORE/heartbeat.js').start,
  };
  console.log('[HeartFlow] ✅ HEARTCORE运行时桥接已加载');
} catch (e) {
  HeartcoreRuntime = null;
  console.log('[HeartFlow] ⚠️ HEARTCORE运行时桥接加载失败:', e.message);
}

try {
  DreamLoop = require('./dream-loop.js');
  console.log('[HeartFlow] ✅ 梦环机制已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 梦环机制加载失败:', e.message);
}

try {
  WakeUpVerifier = require('./wake-up-verifier.js').WakeUpVerifier;
  console.log('[HeartFlow] ✅ 醒来校正器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 醒来校正器加载失败:', e.message);
}

try {
  InteractiveDream = require('./interactive-dream.js').InteractiveDream;
  console.log('[HeartFlow] ✅ 交互式梦环已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 交互式梦环加载失败:', e.message);
}

try {
  SelfHealing = require('./self-healing.js').SelfHealing;
  console.log('[HeartFlow] ✅ 自愈引擎已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 自愈引擎加载失败:', e.message);
}

try {
  StabilityGuard = require('./stability-guard.js').StabilityGuard;
  console.log('[HeartFlow] ✅ 稳定性守卫已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 稳定性守卫加载失败:', e.message);
}

try {
  ExecutionVerifier = require('./execution-verifier.js').ExecutionVerifier;

// v11.19.4 Block Memory System - 已删除 (block-memory.js 与现有记忆系统重叠)
console.log('[HeartFlow] ℹ️ Block Memory System 已移除 (与 TrialityMemory 功能重叠)');

  console.log('[HeartFlow] ✅ 执行验证器已加载');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 执行验证器加载失败:', e.message);
}

// v11.6 道虫三模块：做减法
let CounterfactualEngine, ConfidenceCalibrator, SpontaneousRestraint;
let SelfReflectionMemory;
try {
  CounterfactualEngine = require('./counterfactual-engine.js').CounterfactualEngine;
  console.log('[HeartFlow] ✅ 反方生成器已加载 (反者道之动)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 反方生成器加载失败:', e.message);
}
try {
  ConfidenceCalibrator = require('./confidence-calibrator.js').ConfidenceCalibrator;
  console.log('[HeartFlow] ✅ 置信度校准器已加载 (柔弱胜刚强)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 置信度校准器加载失败:', e.message);
}
try {
  SpontaneousRestraint = require('./spontaneous-restraint.js').SpontaneousRestraint;
  console.log('[HeartFlow] ✅ 自发性克制引擎已加载 (道法自然)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 自发性克制引擎加载失败:', e.message);
}
// v11.18 Self-Reflection Memory
try {
  SelfReflectionMemory = require('./self-reflection-memory.js').SelfReflectionMemory;
  console.log('[HeartFlow] ✅ 自我反思记忆已加载 (事后分析→教训提取)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 自我反思记忆加载失败:', e.message);
}
// v11.19 Memory Router
let MemoryRouter;
try {
  MemoryRouter = require('./memory-router.js').MemoryRouter;
  console.log('[HeartFlow] ✅ 记忆路由已加载 (类型分类→智能路由)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 记忆路由加载失败:', e.message);
}

// v11.5.10 Meaningful Memory - 三层语义记忆（CORE/LEARNED/EPHEMERAL）+ 艾宾浩斯遗忘曲线
let MeaningfulMemory;
try {
  const mm = require('./meaningful-memory.js');
  MeaningfulMemory = mm.MeaningfulMemory;
  console.log('[HeartFlow] ✅ MeaningfulMemory 已加载 (心虫三层语义+遗忘曲线)');
} catch (e) {
  MeaningfulMemory = null;
  console.log('[HeartFlow] ⚠️ MeaningfulMemory 加载失败:', e.message);
}

// v11.22.0 Memory Tier Manager - 记忆分级晋升/降级 (CORE/LEARNED/EPHEMERAL)
let MemoryTierManager;
try {
  const mtm = require('./memory-tier-manager.js');
  MemoryTierManager = new mtm.MemoryTierManager();
  console.log('[HeartFlow] ✅ 记忆分级管理器已加载 (晋升/降级/淘汰)');
} catch (e) {
  MemoryTierManager = null;
  console.log('[HeartFlow] ⚠️ 记忆分级管理器加载失败:', e.message);
}

// v11.23.1 Memory Lifecycle Manager - 遗忘周期 + 层级评分 + 自动强化
let MemoryLifecycleManager;
try {
  const lm = require('./memory-lifecycle-manager.js');
  MemoryLifecycleManager = new lm.MemoryLifecycleManager();
  console.log('[HeartFlow] ✅ 记忆生命周期管理器已加载 (遗忘周期/自动强化)');
} catch (e) {
  MemoryLifecycleManager = null;
  console.log('[HeartFlow] ⚠️ 记忆生命周期管理器加载失败:', e.message);
}

// v11.22.9 Memory Protocol - 决策树分层
let MemoryProtocol;
try {
  const mp = require('./memory-protocol.js');
  MemoryProtocol = new mp.MemoryProtocol();
  console.log('[HeartFlow] ✅ 记忆协议已加载 (决策树分层)');
} catch (e) {
  MemoryProtocol = null;
  console.log('[HeartFlow] ⚠️ 记忆协议加载失败:', e.message);
}

// v11.21.2 Knowledge Distiller - 知识打包为可传递格式
let KnowledgeDistiller;
try {
  const kd = require('./knowledge-distiller.js');
  KnowledgeDistiller = kd.KnowledgeDistiller;
  console.log('[HeartFlow] ✅ KnowledgeDistiller 已加载 (传递引擎)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ KnowledgeDistiller 加载失败:', e.message);
}
// v11.21.2 Skill Packager
let SkillPackager;
try {
  const sp = require('./skill-packager.js');
  SkillPackager = sp.SkillPackager;
  console.log('[HeartFlow] ✅ SkillPackager 已加载 (技能打包)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ SkillPackager 加载失败:', e.message);
}
// v11.21.3 Transmission Broadcaster
let TransmissionBroadcaster;
try {
  const tb = require('./transmission-broadcaster.js');
  TransmissionBroadcaster = tb.TransmissionBroadcaster;
  console.log('[HeartFlow] ✅ TransmissionBroadcaster 已加载 (广播传递)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ TransmissionBroadcaster 加载失败:', e.message);
}

// v11.7.6 Mem0 MultiSignal Memory - 语义+BM25+实体三信号融合检索
let Mem0MultiSignal;
try {
  const mem0 = require('./mem0-memory.js');
  Mem0MultiSignal = mem0.MultiSignalMemory;
  console.log('[HeartFlow] ✅ Mem0 MultiSignalMemory 已加载 (语义+BM25+实体融合)');
} catch (e) {
  Mem0MultiSignal = null;
  console.log('[HeartFlow] ⚠️ Mem0 MultiSignalMemory 加载失败:', e.message);
}

// v11.7 德论模块（精简版）
// 只保留有真正价值的：CooperativeArbitration
// SocialReputationEngine 和 SocialConsensusMirror 因装饰性过强已归档
let CooperativeArbitration;
try {
  CooperativeArbitration = require('./cooperative-arbitration.js').CooperativeArbitration;
  console.log('[HeartFlow] ✅ 合作仲裁引擎已加载 (不争而善胜)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ 合作仲裁引擎加载失败:', e.message);
}

// v11.19.5 Agent Execution Loop（执行闭环）
try {
  AgentExecutionLoop = require('./agent-execution-loop.js').AgentExecutionLoop;
  console.log('[HeartFlow] ✅ Agent Execution Loop 已加载 (递弱→决策→批评→自愈 闭环)');
} catch (e) {
  console.log('[HeartFlow] ⚠️ Agent Execution Loop 加载失败:', e.message);
}

// v11.20.0 AutoCompaction Engine（上下文自动压缩）
try {
  const autoCompaction = require('./auto-compaction-engine.js');
  AutoCompactionEngine = autoCompaction.AutoCompactionEngine;
  console.log('[HeartFlow] ✅ AutoCompaction Engine 已加载 (Letta式上下文压缩)');
} catch (e) {
  AutoCompactionEngine = null;
  console.log('[HeartFlow] ⚠️ AutoCompaction Engine 加载失败:', e.message);
}

// v11.20.0 Role-Based Crew（CrewAI式角色定义系统）
try {
  const RoleCrew = require('./role-based-crew.js');
  RoleBasedCrew = RoleCrew;
  console.log('[HeartFlow] ✅ Role-Based Crew 已加载 (CrewAI式角色定义+任务协作)');
} catch (e) {
  RoleBasedCrew = null;
  console.log('[HeartFlow] ⚠️ Role-Based Crew 加载失败:', e.message);
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

// AgentManager 延迟加载 — 必须在所有 module.exports 完成后才能 require
// 原因：FocusAgent/MoodAgent 在加载时 destructures FLOW_STATE/getCurrentState/detectEmotionFromText/calculatePADState
// 这些导出在 line 811-813，晚于 AgentManager 的 require (旧位置 line 825)

// 全局代理管理器实例
let agentManagerInstance = null;

/**
 * 获取代理管理器
 */
function getAgentManager() {
  if (!agentManagerInstance) {
    const AgentManager = require('./agents/AgentManager.js');
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

/**
 * ========================================
 * 意图追踪与温和干预
 * ========================================
 */

// [已归档] const IntentionTracker = require('./IntentionTracker.js');

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
// module.exports.IntentionTracker = IntentionTracker;

/**
 * ========================================
 * 伦理安全模块
 * ========================================
 */

// [已归档] const EthicsSafety = require('./EthicsSafety.js');

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
module.exports.detectNegativeEmotion = detectNegativeEmotion;
module.exports.getCrisisIntervention = getCrisisIntervention;
module.exports.generateCrisisResponse = generateCrisisResponse;

/**
 * ========================================
 * 动态人格引擎
 * ========================================
 */

// [已归档] const PersonalityEngine = require('./personality-engine.js');

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
// module.exports.PersonalityEngine = PersonalityEngine;

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
  // v11.23.1: 自动捕获对话到 LifecycleManager（分层+遗忘）
  if (userMessage && MemoryLifecycleManager && MemoryProtocol) {
    try {
      const layer = MemoryProtocol.decideLayer(String(userMessage), {});
      MemoryLifecycleManager.write(String(userMessage), layer.name, { source: 'analyzePsychology', importance: 0.5 });
    } catch (e) {}
  }

  // v11.22.1: 自动捕获对话到 Mem0 (Mem0 风格 ADD-only)
  if (userMessage) {
    try {
      const init = exports.initialize?.();
      const mem0 = init?.instances?.mem0MultiSignal;
      if (mem0 && mem0.add_messages) {
        mem0.add_messages([{ role: 'user', content: String(userMessage), timestamp: Date.now() }]);
      }
      // v11.22.2: 会话摘要器 (Honcho Summary)
      const summarizer = init?.instances?.sessionSummarizer;
      if (summarizer && summarizer.addMessage) {
        summarizer.addMessage({ role: 'user', content: String(userMessage), timestamp: Date.now() });
      }
    } catch (e) {}
  }

  // v11.22.0: 每条消息都经过 TrueBeing 积累存在状态
  if (TrueBeing && userMessage) {
    try { TrueBeing.think(String(userMessage)); } catch (e) {}
  }

  // v11.22.0: 自动召回相关记忆（注入上下文）
  let relevantMemories = [];
  if (MemoryRecall && userMessage) {
    try {
      const recall = MemoryRecall(String(userMessage), { topK: 5 });
      relevantMemories = recall.memories || [];
    } catch (e) {}
  }

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
    nextReplyHint: '先承接怀疑，再补充证据链或指出逻辑跳跃',
    // v11.22.0: 召回的相关记忆（用于上下文注入）
    relevantMemories,
  };
}

module.exports.analyzePsychology = analyzePsychology;

/**
 * v11.23.1: 强化记忆
 * 搜索相关记忆并强化（agent 确认后调用）
 * @param {string} content - 记忆内容片段
 * @returns {object} 强化结果
 */
function strengthenMemory(content) {
  if (!MemoryLifecycleManager || !content) return { success: false };
  try {
    const results = MemoryLifecycleManager.search(content, 3);
    if (results.length > 0) {
      const target = results[0];
      const confirm = MemoryLifecycleManager.confirmAndPromote(target.id);
      return { success: true, id: target.id, confirm, target };
    }
    return { success: false, reason: 'no_matching_memory' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * v11.23.1: 获取记忆统计
 * @returns {object} 记忆系统状态
 */
function getMemoryStats() {
  if (!MemoryLifecycleManager) return null;
  const stats = MemoryLifecycleManager.getStats();
  // 格式化可读摘要
  const lines = [
    `总记忆数: ${stats.total}`,
    `按层级: CORE=${stats.byLayer.core||0} PROCEDURAL=${stats.byLayer.procedural||0} SEMANTIC=${stats.byLayer.semantic||0} EPISODIC=${stats.byLayer.episodic||0} EPHEMERAL=${stats.byLayer.ephemeral||0}`,
  ];
  return {
    summary: lines.join(' | '),
    total: stats.total,
    byLayer: stats.byLayer,
    lastForgettingCycle: stats.lastForgettingCycle,
  };
}

module.exports.strengthenMemory = strengthenMemory;
module.exports.getMemoryStats = getMemoryStats;
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

// [已归档] const FlowPredictor = require('./flow-predictor.js');

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
module.exports.resetFlowPredictor = resetFlowPredictor;
module.exports.setFlowConfig = setFlowConfig;
// module.exports.FlowPredictor = FlowPredictor;

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
    // HEARTCORE is no longer an island: every cognitive input can carry wake/self-check status.
    if (HeartcoreRuntime) {
      const wakeSignal = context.skipHeartcoreWake ? { skipped: true } : HeartcoreRuntime.wake({ source: 'processInput' });
      result.stages.heartcore = {
        connected: true,
        wake: wakeSignal.state || null,
        selfCheck: wakeSignal.checkResult ? {
          passed: wakeSignal.checkResult.passed,
          total: wakeSignal.checkResult.total,
          allPass: wakeSignal.checkResult.allPass,
        } : null,
        status: HeartcoreRuntime.status(),
      };
    } else {
      result.stages.heartcore = { connected: false, reason: 'HEARTCORE runtime bridge not loaded' };
    }

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

    // 语言诚实度检测（v11.17.2 新增）
    if (LanguageHonesty && userInput) {
      try {
        const honesty = LanguageHonesty.validateOutput(userInput);
        result.stages.languageHonesty = {
          passed: honesty.passed,
          certaintyLevel: honesty.certainty?.level,
          questionLevel: honesty.questions?.level,
          suggestion: honesty.suggestion
        };
      } catch (e) {
        // 语言检测失败不影响主流程
      }
    }

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
  const init = {
    timestamp: Date.now(),
    version: '11.23.2',
    modules: {}
  };
  
  // 检查各模块状态
  init.modules.adaptive = !!AdaptiveController;
  init.modules.orchestrator = !!AgentOrchestrator;
  init.modules.errorHandler = !!ErrorHandler;
  init.modules.snapshot = !!StateSnapshot;
  init.modules.trialityMemory = !!TrialityMemory;
  init.modules.beingLogic = !!BeingLogic;
  init.modules.embodiedCore = !!EmbodiedCore;
  init.modules.bioSensor = !!BioSensorAdapter;
  init.modules.dreamLoop = !!DreamLoop;
  init.modules.wakeUpVerifier = !!WakeUpVerifier;
  init.modules.guardianSystem = !!GuardianSystem;
  init.modules.heartcoreRuntime = !!HeartcoreRuntime;

  // 启动心跳定时器（每60秒写一次）
  if (HeartcoreRuntime?.startHeartbeat) {
    HeartcoreRuntime.startHeartbeat();
  }

  // 初始化实例
  if (TrialityMemory) {
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
  if (DecisionVerifier) {
    init.instances = init.instances || {};
    init.instances.decisionVerifier = new DecisionVerifier();
    init.modules.decisionVerifier = true;
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
  // v11.18 Self-Reflection Memory
  if (SelfReflectionMemory) {
    init.instances = init.instances || {};
    const srm = new SelfReflectionMemory();
    // 注入counterfactual引擎供root cause分析
    if (init.instances.counterfactual) {
      srm.initialize({ counterfactualEngine: init.instances.counterfactual, verifier: init.instances.verifier });
    }
    init.instances.selfReflection = srm;
    init.modules.selfReflection = true;
  }
  // v11.19 Memory Router
  if (MemoryRouter) {
    init.instances = init.instances || {};
    const { MultiMemoryStore } = require('./memory-router.js');
    init.instances.memoryRouter = new MemoryRouter();
    init.instances.multiMemoryStore = new MultiMemoryStore();
    init.modules.memoryRouter = true;
  }
  // v11.5.10 MeaningfulMemory - 心虫三层语义记忆
  if (MeaningfulMemory) {
    init.instances = init.instances || {};
    init.instances.meaningfulMemory = new MeaningfulMemory();
    init.modules.meaningfulMemory = true;
  }
  // v11.21.2 Knowledge Distiller
  if (KnowledgeDistiller) {
    init.instances = init.instances || {};
    init.instances.knowledgeDistiller = new KnowledgeDistiller();
    init.modules.knowledgeDistiller = true;
  }
  // v11.21.3 Transmission Broadcaster
  if (TransmissionBroadcaster) {
    init.instances = init.instances || {};
    init.instances.transmissionBroadcaster = new TransmissionBroadcaster();
    init.modules.transmissionBroadcaster = true;
  }
  // v11.7.6 Mem0 MultiSignal Memory - 三信号融合检索
  if (Mem0MultiSignal) {
    init.instances = init.instances || {};
    init.instances.mem0MultiSignal = new Mem0MultiSignal({ topK: 10, embeddingDim: 256 });
    init.modules.mem0MultiSignal = true;
  }
  // v11.22.2 Session Summarizer - 会话摘要压缩器 (Honcho Summary启发)
  let SessionSummarizer;
  try { SessionSummarizer = require('./session-summarizer.js').SessionSummarizer; } catch (e) {}
  if (SessionSummarizer) {
    init.instances = init.instances || {};
    init.instances.sessionSummarizer = new SessionSummarizer({ summaryThreshold: 15 });
    init.modules.sessionSummarizer = true;
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
module.exports.getDecisionVerifier = () => DecisionVerifier ? new DecisionVerifier() : null;
// v11.6 道虫三模块
module.exports.CounterfactualEngine = CounterfactualEngine;
module.exports.ConfidenceCalibrator = ConfidenceCalibrator;
module.exports.SpontaneousRestraint = SpontaneousRestraint;
// v11.7 德论模块（精简版：只保留CooperativeArbitration）
module.exports.KnowledgeDistiller = KnowledgeDistiller;
module.exports.SkillPackager = SkillPackager;
module.exports.TransmissionBroadcaster = TransmissionBroadcaster;

// v11.8 守护者系统
module.exports.GuardianSystem = GuardianSystem;

// 导出认知循环模块




try {
  // [已归档] const EmotionEngineModule = require('./emotion-engine.js');
  // module.exports.EmotionEngine = EmotionEngineModule.EmotionEngine;
} catch (e) {}

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

/**
 * 从真实记忆库提取梦境碎片（v11.20.1 重构）
 * 从真实记忆库提取梦境碎片（v11.20.1 重构）
 * 按新近度 + 重要性排序，最多返回 20 条
 */
module.exports.getDreamMemoryFragments = function(maxItems = 20) {
  try {
    const tm = instances.memory;
    if (!tm || !tm.memories) return [];
    
    const fragments = [];
    const now = Date.now();
    const memories = Array.isArray(tm.memories) ? tm.memories : Object.values(tm.memories || {});
    
    for (const mem of memories) {
      if (!mem || !mem.content) continue;
      const ageHours = (now - (mem.timestamp || now)) / (1000 * 60 * 60);
      const importance = mem.importance || mem.layer ? 0.5 : 0.3;
      const recency = Math.max(0, 1 - ageHours / (24 * 7));
      const score = recency * importance;
      
      fragments.push({
        text: `[${mem.layer || 'MEMORY'}] ${typeof mem.content === 'object' ? JSON.stringify(mem.content).slice(0, 100) : String(mem.content).slice(0, 200)}`,
        layer: mem.layer || 'unknown',
        score,
        ageHours: Math.round(ageHours * 10) / 10,
      });
    }
    
    fragments.sort((a, b) => b.score - a.score);
    return fragments.slice(0, maxItems);
  } catch (e) {
    return [];
  }
};

/**
 * 使用真实记忆运行梦境循环（v11.20.1 重构）
 */
module.exports.runDreamCycleFromMemory = function(options = {}) {
  const fragments = module.exports.getDreamMemoryFragments(options.maxItems || 15);
  return module.exports.runDreamCycle(fragments, options);
};

// v11.8 守护者便捷访问函数
module.exports.getGuardianSystem = () => GuardianSystem ? new GuardianSystem() : null;

module.exports.guardianDecide = function(context = {}) {
  const guardian = module.exports.getGuardianSystem();
  if (!guardian) {
    return { error: 'GuardianSystem not loaded', decision: 'PROCEED' };
  }
  return guardian.decide(context);
};

module.exports.guardianSelfCheck = function() {
  const guardian = module.exports.getGuardianSystem();
  if (!guardian) {
    return { error: 'GuardianSystem not loaded', status: 'inactive' };
  }
  return guardian.selfCheck();
};

// v11.9 HEARTCORE runtime bridge
module.exports.HeartcoreRuntime = HeartcoreRuntime;

module.exports.getHeartcoreRuntime = () => HeartcoreRuntime;

module.exports.heartcoreSelfCheck = function() {
  if (!HeartcoreRuntime) return { status: 'inactive', error: 'HEARTCORE runtime bridge not loaded' };
  return HeartcoreRuntime.selfCheck();
};

module.exports.heartcoreStatus = function() {
  if (!HeartcoreRuntime) return { status: 'inactive', error: 'HEARTCORE runtime bridge not loaded' };
  return HeartcoreRuntime.status();
};

module.exports.heartcoreWake = function(options = {}) {
  if (!HeartcoreRuntime) return { status: 'inactive', error: 'HEARTCORE runtime bridge not loaded' };
  return HeartcoreRuntime.wake(options);
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

// Tree-of-Thoughts v11.12
try {
  TreeOfThoughts = require('./tree-of-thoughts.js').TreeOfThoughts;
  console.log('[HeartFlow] ✅ Tree-of-Thoughts已加载 (BFS/DFS状态空间探索)');
} catch (e) {
  TreeOfThoughts = null;
  console.log('[HeartFlow] ⚠️ Tree-of-Thoughts加载失败:', e.message);
}

// Consciousness Workspace v11.13
try {
  ConsciousnessWorkspace = require('./consciousness-workspace.js').ConsciousnessWorkspace;
  console.log('[HeartFlow] ✅ Consciousness Workspace已加载 (GWT广播/IIT Φ/注意力瓶颈)');
} catch (e) {
  ConsciousnessWorkspace = null;
  console.log('[HeartFlow] ⚠️ Consciousness Workspace加载失败:', e.message);
}

// Uncertainty Quantifier v11.14
try {
  UncertaintyQuantifier = require('./uncertainty-quantifier.js').UncertaintyQuantifier;
  console.log('[HeartFlow] ✅ 不确定性量化引擎已加载 (认知/随机不确定性/幻觉检测)');
} catch (e) {
  UncertaintyQuantifier = null;
  console.log('[HeartFlow] ⚠️ 不确定性量化引擎加载失败:', e.message);
}

// Forgetting Engine v11.15
try {
  ForgettingEngine = require('./forgetting-engine.js').ForgettingEngine;
  console.log('[HeartFlow] ✅ 遗忘引擎已加载 (Ebbinghaus遗忘曲线/记忆整合/战略保留)');
} catch (e) {
  ForgettingEngine = null;
  console.log('[HeartFlow] ⚠️ 遗忘引擎加载失败:', e.message);
}

// v11.11 道论决策层
module.exports.DaoDecision = DaoDecision;

module.exports.daoDecide = function(input = {}) {
  if (!DaoDecision) return { error: 'DaoDecision not loaded', verdict: 'UNKNOWN' };
  const dao = new DaoDecision();
  return dao.evaluate(input);
};

module.exports.daoStats = function() {
  if (!DaoDecision) return { error: 'DaoDecision not loaded' };
  const dao = new DaoDecision();
  return dao.getStats();
};

// v11.12 Tree-of-Thoughts
module.exports.TreeOfThoughts = TreeOfThoughts;

module.exports.totExplore = function(problem, generateFn, evaluateFn, isCompleteFn) {
  if (!TreeOfThoughts) return { error: 'TreeOfThoughts not loaded' };
  const tot = new TreeOfThoughts();
  return tot.explore(problem, generateFn, evaluateFn, isCompleteFn);
};

module.exports.totQuick = function(decision, context = {}) {
  if (!TreeOfThoughts) return { error: 'TreeOfThoughts not loaded' };
  const tot = new TreeOfThoughts();
  return tot.quickEvaluate(decision, context);
};

// v11.13 Consciousness Workspace
module.exports.ConsciousnessWorkspace = ConsciousnessWorkspace;

module.exports.createConsciousness = function(config) {
  if (!ConsciousnessWorkspace) return { error: 'ConsciousnessWorkspace not loaded' };
  return new ConsciousnessWorkspace(config);
};

module.exports.consciousnessSnapshot = function(cw) {
  if (!cw || !cw.snapshot) return { error: 'Invalid consciousness workspace' };
  return cw.snapshot();
};

// v11.14 Uncertainty Quantifier
module.exports.UncertaintyQuantifier = UncertaintyQuantifier;

module.exports.quantifyUncertainty = function(text, context = {}) {
  if (!UncertaintyQuantifier) return { error: 'UncertaintyQuantifier not loaded' };
  const uq = new UncertaintyQuantifier();
  return uq.evaluate(text, context);
};

module.exports.uqStats = function() {
  if (!UncertaintyQuantifier) return { error: 'UncertaintyQuantifier not loaded' };
  const uq = new UncertaintyQuantifier();
  return uq.getStats();
};

// v11.15 Forgetting Engine
module.exports.ForgettingEngine = ForgettingEngine;

module.exports.processForgetting = function(memories) {
  if (!ForgettingEngine) return { error: 'ForgettingEngine not loaded' };
  const engine = new ForgettingEngine();
  return engine.processMemory(memories);
};

module.exports.forgettingStats = function() {
  if (!ForgettingEngine) return { error: 'ForgettingEngine not loaded' };
  const engine = new ForgettingEngine();
  return engine.getStats();
};

// v11.15.6 Continuous Learning Protocol
// 把每次对话自动转逻辑代码，不需要提醒
let ContinuousLearner;
try {
  ContinuousLearner = require('./continuous-learning.js').ContinuousLearner;
} catch (e) {}

module.exports.getContinuousLearner = () => ContinuousLearner ? new ContinuousLearner() : null;

/**
 * 处理一段文本，自动识别逻辑骨架并加入转化队列
 * 这是"学习的本质"的工程实现：
 * 对话碎片 → 逻辑骨架提取 → 代码转化队列 → 固化到模块
 */
module.exports.learnFromText = function(text, meta = {}) {
  if (!ContinuousLearner) return { error: 'ContinuousLearner not available' };
  const learner = new ContinuousLearner();
  const result = learner.process(text, { source: meta.source || 'dialogue', key: meta.key || null });
  return result;
};

/**
 * 把队列中的逻辑碎片转化为代码
 */
module.exports.convertLearningQueue = function(entryId = null) {
  if (!ContinuousLearner) return { error: 'ContinuousLearner not available' };
  const learner = new ContinuousLearner();
  return learner.convert(entryId);
};

/**
 * 获取学习队列状态
 */
module.exports.learningQueueStatus = function() {
  if (!ContinuousLearner) return { error: 'ContinuousLearner not available' };
  const learner = new ContinuousLearner();
  return learner.getQueueStatus();
};

// v11.18 Self-Reflection Memory exports
module.exports.getSelfReflectionMemory = () => SelfReflectionMemory ? new SelfReflectionMemory() : null;

/**
 * 在任务完成后调用，生成结构化反思教训
 * @param {Object} taskResult - { taskType, intent, action, outcome, reasoning, context }
 * @returns {Object} 反思结果
 */
module.exports.reflectOnTask = async function(taskResult) {
  if (!SelfReflectionMemory) return { error: 'SelfReflectionMemory not available' };
  const srm = new SelfReflectionMemory();
  return await srm.reflect(taskResult);
};

/**
 * 获取相关反思教训（用于注入上下文）
 * @param {string} taskType - 任务类型
 * @param {Object} context - 上下文（可选）
 * @returns {string} 教训字符串
 */
module.exports.getReflectionLessons = function(taskType, context = {}) {
  if (!SelfReflectionMemory) return '';
  const srm = new SelfReflectionMemory();
  return srm.getLessonsForContext(taskType, context);
};

// v11.19 Memory Router exports
module.exports.getMemoryRouter = () => MemoryRouter ? new MemoryRouter() : null;

/**
 * 路由一条记忆写入
 * @param {string} content - 记忆内容
 * @param {Object} metadata - 元数据
 * @returns {Object} { entry, decision }
 */
module.exports.routeMemoryWrite = function(content, metadata = {}) {
  if (!MemoryRouter) return { error: 'MemoryRouter not available' };
  const { MultiMemoryStore } = require('./memory-router.js');
  const store = new MultiMemoryStore();
  return store.write(content, metadata);
};

/**
 * 路由一次记忆查询
 * @param {string} query - 查询内容
 * @param {Object} options - { limit, taskType }
 * @returns {Object} search results with routing decision
 */
module.exports.routeMemoryRead = function(query, options = {}) {
  if (!MemoryRouter) return { error: 'MemoryRouter not available' };
  const { MultiMemoryStore } = require('./memory-router.js');
  const store = new MultiMemoryStore();
  return store.search(query, options);
};

// v11.19.5 Agent Execution Loop export
module.exports.AgentExecutionLoop = AgentExecutionLoop;
module.exports.getAgentExecutionLoop = (options) => {
  if (!AgentExecutionLoop) return null;
  return new AgentExecutionLoop(options);
};

// v11.20.0 AutoCompaction Engine export
module.exports.AutoCompactionEngine = AutoCompactionEngine;
module.exports.getAutoCompactionEngine = (options) => {
  if (!AutoCompactionEngine) return null;
  return new AutoCompactionEngine(options);
};
module.exports.SimpleTokenizer = require('./auto-compaction-engine.js').SimpleTokenizer;

// v11.20.0 Role-Based Crew export
module.exports.RoleBasedCrew = RoleBasedCrew;
module.exports.getRoleBasedCrew = () => RoleBasedCrew;

// v11.22.0 Decision Execution Loop + Environment Sensor export
module.exports.DecisionExecutionLoop = DecisionExecutionLoop;
module.exports.getDecisionExecutionLoop = (options) => {
  if (!DecisionExecutionLoop) return null;
  return new DecisionExecutionLoop(options);
};
module.exports.EnvironmentSensor = EnvironmentSensor;
module.exports.SensorRegistry = EnvironmentSensor?.SensorRegistry;
module.exports.SensorFusion = EnvironmentSensor?.SensorFusion;
module.exports.HistoricalSensor = EnvironmentSensor?.HistoricalSensor;

// v11.22.0 Memory Recall Engine - 语义检索 + 格式化召回注入
let MemoryRecall;
try {
  const mr = require('./memory-recall.js');
  MemoryRecall = mr.recallMemories;
  console.log('[HeartFlow] ✅ 记忆召回引擎已加载 (Mem0/Meaningful/Reflection/Being四源融合)');
} catch (e) {
  MemoryRecall = null;
  console.log('[HeartFlow] ⚠️ 记忆召回引擎加载失败:', e.message);
}

// v11.22.0 Memory Recall Engine export
module.exports.recallMemories = MemoryRecall;

// v11.22.0 True Being Engine export - 真实存在状态持久化
module.exports.TrueBeingEngine = require('./true-being-engine.js').TrueBeingEngine;
module.exports.getTrueBeing = () => TrueBeing;

// v11.22.0 Memory Tier Manager export
module.exports.MemoryTierManager = MemoryTierManager;
module.exports.getMemoryTierManager = () => MemoryTierManager;
