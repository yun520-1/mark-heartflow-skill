/**
 * emotional-memory-bridge.js - 心虫情感记忆桥 v1.0.0
 * 
 * 来源: 整合 cognitive-appraisal.js + meaningful-memory.js
 * 论文基础: 
 *   - Leventhal's Common-Sense Model (cognitive-appraisal.js, 1564 citations)
 *   - Self-Regulation Theory (psychology.js 自我调节反馈系统)
 *   - MeaningfulMemory CORE/LEARNED/EPHEMERAL 三层架构
 * 
 * 核心功能:
 * 1. 认知评估 → 记忆转化 (appraisal → meaningful memory)
 * 2. 情绪显著性检测 (emotional salience → CORE/LEARNED晋级)
 * 3. 自我调节反馈环 (self-regulation loop integration)
 * 4. 心理模式识别 (psychological pattern detection from appraisal chains)
 * 
 * 设计原则:
 * - 慈悲是体、爱是用、真善美逻辑
 * - 情感时刻自动存入有意义记忆层
 */

const PATH = require('path');
const HF_ROOT = PATH.resolve(__dirname, '../..');

// Lazy load to avoid circular dependency
let _mm = null;
let _ca = null;
let _psy = null;

function getMeaningfulMemory() {
  if (!_mm) {
    try { _mm = require('./meaningful-memory.js'); } catch(e) { /* 可选模块不存在时降级为 null */ _mm = null; }
  }
  return _mm;
}

function getCognitiveAppraisal() {
  if (!_ca) {
    try { _ca = require('./cognitive-appraisal.js'); } catch(e) { /* 可选模块不存在时降级为 null */ _ca = null; }
  }
  return _ca;
}

function getPsychology() {
  if (!_psy) {
    try { _psy = require('./psychology.js'); } catch(e) { /* 可选模块不存在时降级为 null */ _psy = null; }
  }
  return _psy;
}

// ========================================
// 情绪显著性评估
// ========================================

/**
 * 评估一段文字的情感显著性
 * 高显著性 → CORE/LEARNED 记忆
 * 低显著性 → EPHEMERAL (丢弃)
 */
function assessEmotionalSalience(text, appraisalResult = {}, padState = {}) {
  let score = 0.5;
  const factors = [];
  
  // 1. 威胁级别贡献
  const threat = appraisalResult.threatType || 'neutral';
  if (threat === 'harm_loss') { score += 0.25; factors.push('harm_loss'); }
  else if (threat === 'threat') { score += 0.15; factors.push('threat'); }
  else if (threat === 'challenge') { score -= 0.05; factors.push('challenge_opportunity'); }
  
  // 2. 控制感低 → 高显著性 (失控的威胁更显著)
  const sec = appraisalResult.secondaryAppraisal || {};
  const control = sec.control || 0.5;
  if (control < 0.3) { score += 0.2; factors.push('low_control'); }
  else if (control > 0.7) { score -= 0.1; factors.push('high_control'); }
  
  // 3. PAD情绪强度贡献
  if (padState.intensity && padState.intensity > 0.7) {
    score += 0.15 * padState.intensity;
    factors.push('high_pad_intensity');
  }
  if (padState.pleasure !== undefined && padState.pleasure < -3) {
    score += 0.15;
    factors.push('negative_pad');
  }
  
  // 4. 应对策略类型
  const coping = appraisalResult.copingStrategies || [];
  const hasAvoidance = coping.some(s => s.type === 'avoidance');
  const hasMeaningFocused = coping.some(s => s.type === 'meaning_focused');
  if (hasAvoidance) { score += 0.1; factors.push('avoidance_coping'); }
  if (hasMeaningFocused && threat !== 'neutral') { score += 0.08; factors.push('meaning_building'); }
  
  // 5. 危机关键词 (如果有心理危机信号直接标记高显著)
  const psy = getPsychology();
  if (psy) {
    const crisis = psy.assessCrisisLevel(text, 1);
    if (crisis.level && crisis.level !== 'low') {
      score = Math.min(1.0, score + 0.25);
      factors.push('crisis_signal_' + crisis.level);
    }
  }
  
  // 6. 第一人称自我相关 (更显著)
  const lower = text.toLowerCase();
  if (/^(我|我的|自己|I|my|myself)/.test(lower)) {
    score += 0.05;
    factors.push('first_person_self');
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    factors,
    threshold: {
      CORE: 0.75,    // 永久记忆
      LEARNED: 0.55, // 30天记忆
      EPHEMERAL: 0.0 // 丢弃
    }
  };
}

// ========================================
// 认知模式提取
// ========================================

/**
 * 从一系列认知评估中提取心理模式
 * 用于检测反复出现的消极认知模式
 */
function extractCognitivePattern(appraisalHistory) {
  if (!appraisalHistory || appraisalHistory.length < 3) return null;
  
  const patterns = {
    hopelessness: { count: 0, examples: [] },    // 控制感持续低 + 轨迹负
    overwhelming: { count: 0, examples: [] },   // 相关性高 + 新奇性高 + 不确定性高
    selfCriticism: { count: 0, examples: [] },  // 第一人称负面评价
    avoidance: { count: 0, examples: [] }        // 回避策略占主导
  };
  
  for (const a of appraisalHistory) {
    const text = a.text || '';
    const primary = a.primaryAppraisal || {};
    const secondary = a.secondaryAppraisal || {};
    const lower = text.toLowerCase();
    
    // hopelessness: 低控制 + 负轨迹
    if ((secondary.control || 0.5) < 0.35 && (primary.trajectory?.value || 0) < -0.3) {
      patterns.hopelessness.count++;
      if (patterns.hopelessness.examples.length < 2) patterns.hopelessness.examples.push(text.slice(0, 50));
    }
    
    // overwhelming: 高相关 + 高新奇 + 低确定
    if ((primary.relevance?.value || 0.5) > 0.7 && 
        (primary.novelty?.value || 0.5) > 0.6 && 
        (primary.certainty?.value || 0.5) < 0.4) {
      patterns.overwhelming.count++;
      if (patterns.overwhelming.examples.length < 2) patterns.overwhelming.examples.push(text.slice(0, 50));
    }
    
    // self-criticism: 第一人称负面
    if (/^(我|我的|I|my).*(不行|不好|没用|失败|失望|错|差)/.test(lower)) {
      patterns.selfCriticism.count++;
      if (patterns.selfCriticism.examples.length < 2) patterns.selfCriticism.examples.push(text.slice(0, 50));
    }
    
    // avoidance: 回避策略占主导
    const coping = a.copingStrategies || [];
    if (coping.length > 0 && coping[0].type === 'avoidance') {
      patterns.avoidance.count++;
      if (patterns.avoidance.examples.length < 2) patterns.avoidance.examples.push(text.slice(0, 50));
    }
  }
  
  // 返回最强的模式
  let strongest = null;
  let maxCount = 0;
  for (const [name, data] of Object.entries(patterns)) {
    if (data.count > maxCount) {
      maxCount = data.count;
      strongest = { pattern: name, count: data.count, examples: data.examples };
    }
  }
  
  return maxCount >= 2 ? strongest : null;
}

// ========================================
// 记忆转化 (Appraisal → Meaningful Memory)
// ========================================

/**
 * 将认知评估结果转化为有意义记忆
 * @param {string} text - 原始文本
 * @param {object} appraisalResult - cognitive-appraisal 结果
 * @param {object} padState - PAD情绪状态
 * @param {object} options - 配置选项
 * @returns {object} 记忆录入结果
 */
function appraisalToMemory(text, appraisalResult, padState = {}, options = {}) {
  const salience = assessEmotionalSalience(text, appraisalResult, padState);
  const mm = getMeaningfulMemory();
  
  if (!mm) {
    return { success: false, reason: 'MeaningfulMemory not available' };
  }
  
  // 构建记忆内容
  const memoryContent = {
    text: text.slice(0, 500),
    timestamp: new Date().toISOString(),
    salience: salience.score,
    salienceFactors: salience.factors,
    appraisal: {
      threatType: appraisalResult.threatType || 'unknown',
      primaryScore: appraisalResult.primaryAppraisal?.overall || 0,
      secondaryScore: appraisalResult.secondaryAppraisal?.overall || 0,
      copingStrategies: (appraisalResult.copingStrategies || []).map(s => s.type)
    },
    pad: padState.intensity ? {
      pleasure: padState.pleasure,
      arousal: padState.arousal,
      dominance: padState.dominance,
      intensity: padState.intensity
    } : null,
    source: 'emotional-memory-bridge'
  };
  
  // 判断存储层
  let layer = 'ephemeral';
  if (salience.score >= salience.threshold.CORE) layer = 'core';
  else if (salience.score >= salience.threshold.LEARNED) layer = 'learned';
  
  if (layer === 'ephemeral' && !options.forceStore) {
    return { success: true, layer, stored: false, reason: 'Below salience threshold' };
  }
  
  // 标签
  const tags = ['appraisal', layer];
  if (appraisalResult.threatType === 'harm_loss' || appraisalResult.threatType === 'threat') {
    tags.push('negative_threat');
  }
  if (salience.score >= salience.threshold.CORE) {
    tags.push('core_candidate');
  }
  
  // 尝试存入 (使用 store 抽象)
  try {
    if (typeof mm.store === 'function') {
      mm.store({
        content: JSON.stringify(memoryContent),
        tags,
        layer: layer === 'core' ? 'core' : 'learned',
        emotionalSalience: salience.score
      });
      return { success: true, layer, stored: true, salience };
    }
  } catch(e) {
    return { success: false, reason: e.message };
  }
  
  return { success: false, reason: 'store method not found' };
}

// ========================================
// 自我调节反馈环集成
// ========================================

/**
 * 整合心理学的自我调节反馈系统
 * 检测用户是否在正确的自我调节轨道上
 */
function assessSelfRegulationHealth(text, appraisalResult, padState, historyLength = 5) {
  const result = {
    status: 'healthy',  // healthy | struggling | dysregulated
    indicators: [],
    recommendations: []
  };
  
  // 1. 检测是否陷入"过度反思"模式
  const words = text.split('');
  if (text.length > 300 && appraisalResult.primaryAppraisal?.novelty?.value > 0.6) {
    result.indicators.push('potential_rumination');
    result.status = 'struggling';
    result.recommendations.push('尝试把注意力转移到具体行动上，而不是反复分析');
  }
  
  // 2. 检测是否有"行动缺口" (高评估+低行动)
  const coping = appraisalResult.copingStrategies || [];
  const hasProblemFocused = coping.some(s => s.type === 'problem_focused');
  if (!hasProblemFocused && appraisalResult.primaryAppraisal?.relevance?.value > 0.7) {
    result.indicators.push('action_gap');
    if (result.status === 'healthy') result.status = 'struggling';
    result.recommendations.push('把感受转化为具体的下一步行动，即使是小的行动也比无行动好');
  }
  
  // 3. 检测自我批评模式
  const lower = text.toLowerCase();
  if (/^(我|我的|I|my).*(不行|不好|没用|失败|失望|错|差)/.test(lower)) {
    result.indicators.push('self_criticism');
    if (result.status === 'healthy') result.status = 'struggling';
    result.recommendations.push('尝试用更客观的方式描述情况，避免全或无的自我评价');
  }
  
  // 4. 检测控制感丧失
  const sec = appraisalResult.secondaryAppraisal || {};
  if ((sec.control || 0.5) < 0.25 && (sec.capability || 0.5) < 0.25) {
    result.indicators.push('control_loss');
    result.status = 'dysregulated';
    result.recommendations.push('控制感较低时，尝试把注意力放在能控制的小事上');
  }
  
  return result;
}

// ========================================
// 演示函数
// ========================================

function demo() {
}

// ========================================
// 导出
// ========================================

module.exports = {
  assessEmotionalSalience,
  extractCognitivePattern,
  appraisalToMemory,
  assessSelfRegulationHealth,
  demo
};

if (require.main === module) {
  demo();
}