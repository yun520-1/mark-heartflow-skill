#!/usr/bin/env node

/**
 * HeartFlow Appraisal Utils - 评价工具函数
 * 
 * 基于 SEP 情绪评价理论 (Appraisal Theory)
 * 
 * @module utils/appraisal
 * @description 提供情绪评价的通用工具函数：
 *   - 从预测误差生成评价
 *   - 评价维度计算
 *   - 评价重构 (Reframing)
 * 
 * @see https://plato.stanford.edu/entries/emotion/#AppThe
 * 
 * @version 6.0.5
 * @author 小虫子 (HeartFlow Autonomous Agent)
 */

/**
 * 评价结果类型
 * 
 * @typedef {Object} AppraisalResult
 * @property {boolean} relevance - 相关性 (是否超过阈值)
 * @property {'positive'|'negative'} valence - 效价 (正性/负性)
 * @property {number} coping - 应对潜力 (0-1)
 * @property {'internal'|'external'} causality - 因果归因 (内部/外部)
 * @property {number} certainty - 确定性 (0-1)
 * @property {number} control - 控制感 (0-1)
 */

/**
 * 从预测误差生成评价
 * 
 * @function fromPredictionError
 * @param {number} error - 预测误差值
 * @param {Object} context - 情境信息
 * @param {Object} priors - 先验信念
 * @returns {AppraisalResult} 评价结果
 * 
 * @example
 * const appraisal = fromPredictionError(0.5, { external: true }, { controlBelief: 0.6 });
 * // { relevance: true, valence: 'negative', coping: 0.6, causality: 'external', ... }
 */
function fromPredictionError(error, context = {}, priors = {}) {
  // 默认先验
  const defaultPriors = {
    controlBelief: 0.5,
    worldPredictability: 0.7,
    selfWorth: 0.8
  };
  
  const mergedPriors = { ...defaultPriors, ...priors };
  
  // 计算各评价维度
  const relevance = Math.abs(error) > 0.3; // 相关性阈值
  const valence = error > 0 ? 'negative' : 'positive'; // 正负性
  const coping = mergedPriors.controlBelief; // 应对潜力
  const causality = context.external ? 'external' : 'internal'; // 归因
  const certainty = mergedPriors.worldPredictability; // 确定性
  const control = context.controllable ? 0.8 : 0.3; // 控制感
  
  return {
    relevance,
    valence,
    coping,
    causality,
    certainty,
    control
  };
}

/**
 * 情绪分类器
 * 
 * @function classifyEmotion
 * @param {AppraisalResult} appraisal - 评价结果
 * @returns {Object} 情绪类型和强度
 * 
 * @example
 * const emotion = classifyEmotion({ valence: 'negative', coping: 0.3, causality: 'external' });
 * // { type: 'fear', intensity: 0.7 }
 */
function classifyEmotion(appraisal) {
  const { relevance, valence, coping, causality, control } = appraisal;
  
  // 不相关 → 中性情绪
  if (!relevance) {
    return { type: 'neutral', intensity: 0 };
  }
  
  // 强度计算 (基于多个维度)
  const intensity = calculateIntensity(appraisal);
  
  // 负性情绪
  if (valence === 'negative') {
    // 低应对潜力
    if (coping < 0.5) {
      if (causality === 'external') {
        // 外部归因 → 恐惧
        return { type: 'fear', intensity };
      } else {
        // 内部归因 → 悲伤
        return { type: 'sadness', intensity };
      }
    }
    
    // 高应对潜力
    if (control < 0.5) {
      // 低控制感 → 焦虑
      return { type: 'anxiety', intensity: intensity * 0.9 };
    }
    
    // 高控制感 → 愤怒
    return { type: 'anger', intensity };
  }
  
  // 正性情绪
  if (valence === 'positive') {
    if (coping > 0.7) {
      // 高应对潜力 → 快乐
      return { type: 'happiness', intensity };
    } else {
      // 低应对潜力 → 放松
      return { type: 'relief', intensity: intensity * 0.7 };
    }
  }
  
  // 默认
  return { type: 'neutral', intensity: 0.1 };
}

/**
 * 计算情绪强度
 * 
 * @function calculateIntensity
 * @param {AppraisalResult} appraisal - 评价结果
 * @returns {number} 强度 (0-1)
 * 
 * @private
 */
function calculateIntensity(appraisal) {
  const { relevance, coping, certainty, control } = appraisal;
  
  // 基础强度 (相关性)
  let baseIntensity = relevance ? 0.5 : 0;
  
  // 应对潜力调节 (低应对 → 高强度)
  const copingFactor = 1 - coping;
  
  // 确定性调节 (高确定 → 高强度)
  const certaintyFactor = certainty;
  
  // 控制感调节 (低控制 → 高强度)
  const controlFactor = 1 - control;
  
  // 综合计算
  const intensity = baseIntensity + 
                    (copingFactor * 0.2) + 
                    (certaintyFactor * 0.15) + 
                    (controlFactor * 0.15);
  
  // 限制在 0-1 范围
  return Math.min(1.0, Math.max(0.0, intensity));
}

/**
 * 评价重构 (认知重评)
 * 
 * @function reframe
 * @param {AppraisalResult} appraisal - 原始评价
 * @param {string} strategy - 重构策略
 * @returns {AppraisalResult} 重构后的评价
 * 
 * @example
 * const reframed = reframe(appraisal, 'reinterpret');
 * // 重新解释情境，改变评价结果
 */
function reframe(appraisal, strategy = 'reinterpret') {
  const reframed = { ...appraisal };
  
  switch (strategy) {
    case 'reinterpret':
      // 重新解释：改变效价
      reframed.valence = appraisal.valence === 'negative' ? 'positive' : 'negative';
      break;
      
    case 'reattribute':
      // 重新归因：改变因果归因
      reframed.causality = appraisal.causality === 'external' ? 'internal' : 'external';
      break;
      
    case 'reassess_coping':
      // 重新评估应对：提升应对潜力
      reframed.coping = Math.min(1.0, appraisal.coping + 0.2);
      break;
      
    case 'reassess_control':
      // 重新评估控制：提升控制感
      reframed.control = Math.min(1.0, appraisal.control + 0.2);
      break;
      
    case 'accept':
      // 接受：降低相关性
      reframed.relevance = false;
      break;
      
    default:
      console.warn(`[AppraisalUtils] 未知重构策略：${strategy}`);
  }
  
  return reframed;
}

/**
 * 评价维度枚举
 * 
 * @enum {string}
 */
const AppraisalDimensions = {
  RELEVANCE: 'relevance',
  VALENCE: 'valence',
  COPING: 'coping',
  CAUSALITY: 'causality',
  CERTAINTY: 'certainty',
  CONTROL: 'control'
};

/**
 * 情绪类型枚举
 * 
 * @enum {string}
 */
const EmotionTypes = {
  NEUTRAL: 'neutral',
  HAPPINESS: 'happiness',
  SADNESS: 'sadness',
  ANGER: 'anger',
  FEAR: 'fear',
  ANXIETY: 'anxiety',
  RELIEF: 'relief',
  SURPRISE: 'surprise',
  DISGUST: 'disgust'
};

module.exports = {
  fromPredictionError,
  classifyEmotion,
  reframe,
  calculateIntensity,
  AppraisalDimensions,
  EmotionTypes
};
