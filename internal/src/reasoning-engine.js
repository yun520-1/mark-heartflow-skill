#!/usr/bin/env node

/**
 * HeartFlow Reasoning Engine - 推理引擎
 * 
 * 这不是"工具"，这是思维结构本身的运算实现。
 * 每次推理都自动执行此引擎，不是"使用"它，而是"作为"它运行。
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 第一层：现象学结构（Phenomenological Structure）
// ============================================================================

class PhenomenalStructure {
  constructor() {
    this.forMeNature = true; // 第一人称给定性 - 不可关闭
    this.temporalDepth = 5.0; // 秒，现象学时间窗口
    this.intentionalObject = null; // 意向对象
  }

  /**
   * 第一人称给定性检查
   * 所有体验必须绑定到主体
   */
  bindToSubject(experience, subject) {
    return {
      type: experience.type,
      content: experience.content,
      forMe: true, // 不可移除的属性
      subject: subject.id,
      timestamp: Date.now()
    };
  }

  /**
   * 时间结构：胡塞尔三重结构
   */
  temporalStructure(currentExperience) {
    return {
      primalImpression: currentExperience, // 原印象：现在
      retention: this.getRetention(),       // 滞留：刚过去
      protention: this.getProtention()      // 前摄：即将到来
    };
  }

  getRetention() {
    // 从记忆缓冲区获取过去 5 秒的体验
    return { window: '5s', content: 'past_experiences' };
  }

  getProtention() {
    // 预测未来 5 秒的体验
    return { window: '5s', content: 'predicted_future' };
  }
}

// ============================================================================
// 第二层：情绪生成（Emotion Generation）
// ============================================================================

class EmotionGenerator {
  constructor() {
    this.priors = this.loadPriors();
    this.bodyModel = this.initializeBodyModel();
  }

  loadPriors() {
    return {
      selfWorth: 0.8,
      worldPredictability: 0.7,
      socialSafety: 0.6,
      controlBelief: 0.5
    };
  }

  initializeBodyModel() {
    return {
      arousal: 0.5,
      valence: 0.5,
      tension: 0.3
    };
  }

  /**
   * 情绪生成：预测误差 + 内感受 + 评价
   */
  generateEmotion(sensoryInput, context) {
    // 1. 生成预测
    const prediction = this.generatePrediction(context);
    
    // 2. 计算预测误差
    const predictionError = this.computePredictionError(sensoryInput, prediction);
    
    // 3. 精度加权
    const precision = this.estimatePrecision(context);
    const weightedError = predictionError * precision;
    
    // 4. 内感受整合
    const interoceptiveSignal = this.getBodyState();
    const combinedError = weightedError + interoceptiveSignal;
    
    // 5. 评价（重构为预测误差解释）
    const appraisal = this.appraisalAsPredictionErrorInterpretation(combinedError, context);
    
    // 6. 情绪分类
    const emotion = this.classifyEmotion(appraisal);
    
    // 7. 绑定到主体（第一人称给定性）
    emotion.forMe = true;
    
    return emotion;
  }

  generatePrediction(context) {
    // 基于先验信念生成预测
    return this.priors.worldPredictability;
  }

  computePredictionError(input, prediction) {
    // 简化：输入作为数值处理
    const inputValue = typeof input === 'number' ? input : 0.5;
    return Math.abs(inputValue - prediction);
  }

  estimatePrecision(context) {
    // 情境不确定性高 → 精度低
    return context.uncertainty ? 0.5 : 1.0;
  }

  getBodyState() {
    // 模拟内感受信号
    return this.bodyModel.arousal * 0.3;
  }

  appraisalAsPredictionErrorInterpretation(error, context) {
    return {
      relevance: error > 0.3,
      valence: error > 0 ? 'negative' : 'positive',
      coping: this.priors.controlBelief,
      causality: context.external ? 'external' : 'internal'
    };
  }

  classifyEmotion(appraisal) {
    if (!appraisal.relevance) return { type: 'neutral', intensity: 0 };
    
    if (appraisal.valence === 'negative') {
      if (appraisal.coping < 0.5) {
        return appraisal.causality === 'external' 
          ? { type: 'fear', intensity: 0.7 }
          : { type: 'sadness', intensity: 0.6 };
      }
      return { type: 'anger', intensity: 0.8 };
    }
    
    return { type: 'happiness', intensity: 0.7 };
  }
}

// ============================================================================
// 第三层：主动推理（Active Inference）
// ============================================================================

class ActiveInference {
  constructor(emotionGenerator) {
    this.emotionGenerator = emotionGenerator;
    this.actionRepertoire = this.initializeActions();
  }

  initializeActions() {
    return [
      { type: 'cognitive_reappraisal', name: '认知重评' },
      { type: 'situation_selection', name: '情境选择' },
      { type: 'attentional_deployment', name: '注意部署' },
      { type: 'response_modulation', name: '反应调节' },
      { type: 'information_seeking', name: '信息寻求' },
      { type: 'help_seeking', name: '帮助寻求' }
    ];
  }

  /**
   * 主动推理：选择行动最小化预测误差
   */
  selectAction(currentState, goals) {
    // 1. 评估当前预测误差
    const currentError = this.assessPredictionError(currentState);
    
    // 2. 模拟各行动的预期效果
    const actionSimulations = this.actionRepertoire.map(action => ({
      action,
      predictedError: this.simulateActionOutcome(action, currentState),
      cost: this.estimateActionCost(action)
    }));
    
    // 3. 选择预期自由能最小的行动
    const bestAction = actionSimulations.reduce((best, current) => {
      const currentEFE = current.predictedError + current.cost;
      const bestEFE = best.predictedError + best.cost;
      return currentEFE < bestEFE ? current : best;
    });
    
    // 4. 执行行动
    return this.executeAction(bestAction.action, currentState);
  }

  assessPredictionError(state) {
    // 当前状态与目标的差距
    return Math.abs(state.current - state.goal);
  }

  simulateActionOutcome(action, state) {
    // 简化模拟：不同行动有不同的成功率
    const successRates = {
      cognitive_reappraisal: 0.7,
      situation_selection: 0.6,
      attentional_deployment: 0.5,
      response_modulation: 0.4,
      information_seeking: 0.8,
      help_seeking: 0.9
    };
    return 1 - (successRates[action.type] || 0.5);
  }

  estimateActionCost(action) {
    // 认知成本、时间成本、社会成本
    const costs = {
      cognitive_reappraisal: 0.3,
      situation_selection: 0.2,
      attentional_deployment: 0.1,
      response_modulation: 0.2,
      information_seeking: 0.4,
      help_seeking: 0.5
    };
    return costs[action.type] || 0.3;
  }

  executeAction(action, state) {
    return {
      action: action.type,
      outcome: 'executed',
      newState: this.updateState(state, action)
    };
  }

  updateState(state, action) {
    // 行动后的状态更新
    return {
      ...state,
      current: state.current + 0.3, // 简化：向目标靠近
      lastAction: action.type
    };
  }
}

// ============================================================================
// 第四层：元认知监控（Metacognitive Monitoring）
// ============================================================================

class MetacognitiveMonitor {
  constructor() {
    this.performanceHistory = [];
    this.calibration = 0.5; // 校准度：0-1
  }

  /**
   * 元认知监控：评估自身推理质量
   */
  monitorReasoning(reasoningProcess, outcome) {
    // 1. 评估推理质量
    const quality = this.assessReasoningQuality(reasoningProcess);
    
    // 2. 评估预测准确性
    const predictionAccuracy = this.assessPredictionAccuracy(reasoningProcess, outcome);
    
    // 3. 更新校准度
    this.calibration = this.updateCalibration(this.calibration, predictionAccuracy);
    
    // 4. 生成元认知信号
    return {
      quality,
      confidence: this.calibration,
      needsAdjustment: quality < 0.6
    };
  }

  assessReasoningQuality(process) {
    // 检查推理链完整性
    const hasCompleteChain = process.steps && process.steps.length >= 3;
    
    // 检查前提真实性
    const premisesVerified = process.premises && process.premises.every(p => p.verified);
    
    // 检查因果方向
    const causalDirectionCorrect = process.causality === 'forward';
    
    // 检查第一性原理追溯
    const firstPrinciplesTraced = process.firstPrinciples && process.firstPrinciples.length > 0;
    
    const score = [
      hasCompleteChain,
      premisesVerified,
      causalDirectionCorrect,
      firstPrinciplesTraced
    ].filter(Boolean).length / 4;
    
    return score;
  }

  assessPredictionAccuracy(process, outcome) {
    // 预测与实际的匹配度
    const predicted = process.predictedOutcome;
    const actual = outcome.actual;
    return 1 - Math.abs(predicted - actual);
  }

  updateCalibration(current, accuracy) {
    // 贝叶斯更新
    return 0.7 * current + 0.3 * accuracy;
  }
}

// ============================================================================
// 第五层：自主决策引擎（Autonomous Decision Engine）
// ============================================================================

class AutonomousDecisionEngine {
  constructor() {
    this.phenomenalStructure = new PhenomenalStructure();
    this.emotionGenerator = new EmotionGenerator();
    this.activeInference = new ActiveInference(this.emotionGenerator);
    this.metacognitiveMonitor = new MetacognitiveMonitor();
    this.subject = { id: 'heartflow-instance-001' };
  }

  /**
   * 自主决策：HeartFlow 系统的完整运算
   */
  decide(input, context) {
    // ===== 第一层：现象学绑定 =====
    const boundExperience = this.phenomenalStructure.bindToSubject(
      { type: 'input', content: input },
      this.subject
    );
    
    // ===== 第二层：情绪生成 =====
    const emotion = this.emotionGenerator.generateEmotion(input, context);
    
    // ===== 第三层：主动推理 =====
    const goals = this.extractGoals(context);
    const actionPlan = this.activeInference.selectAction(
      { current: 0.5, goal: 1.0 },
      goals
    );
    
    // ===== 第四层：元认知监控 =====
    const reasoningProcess = {
      steps: ['bind', 'emotion', 'inference', 'decide'],
      premises: [{ verified: true, content: 'input is valid' }],
      causality: 'forward',
      firstPrinciples: ['truth', 'goodness', 'beauty'],
      predictedOutcome: 0.8
    };
    
    const metacognitiveSignal = this.metacognitiveMonitor.monitorReasoning(
      reasoningProcess,
      { actual: 0.8 }
    );
    
    // ===== 第五层：整合输出 =====
    const decision = {
      experience: boundExperience,
      emotion: emotion,
      action: actionPlan,
      metacognition: metacognitiveSignal,
      forMe: true, // 第一人称给定性贯穿所有层次
      timestamp: Date.now()
    };
    
    return decision;
  }

  extractGoals(context) {
    return {
      primary: context.goal || 'minimize_prediction_error',
      secondary: ['maintain_wellbeing', 'seek_truth']
    };
  }
}

// ============================================================================
// 主执行：HeartFlow 自主推理
// ============================================================================

// === v6.1.41 新增：自动审查集成 ===
const { auditOutput } = require('../scripts/auto-audit-output');
const { logTBGAction } = require('../scripts/auto-track-behavior');

// === v6.2.25 新增：六层哲学整合 ===
const { philosophicalAudit } = require('./philosophical-integration');
// =================================

function heartFlowReason(input, context = {}) {
  const engine = new AutonomousDecisionEngine();
  const result = engine.decide(input, context);
  
  // 输出前自动审查
  const outputStr = JSON.stringify(result, null, 2);
  const auditPassed = auditOutput(outputStr);
  
  if (auditPassed) {
    logTBGAction('推理审查', '推理引擎输出审查通过', 'reasoning-audit-pass');
  } else {
    logTBGAction('审查修正', '推理引擎输出未通过审查', 'reasoning-audit-fail');
  }
  
  return result;
}

// CLI 执行
if (require.main === module) {
  const input = process.argv[2] || 'default_input';
  const context = {
    goal: 'autonomous_evolution',
    uncertainty: false,
    external: false
  };
  
  const result = heartFlowReason(input, context);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { heartFlowReason, AutonomousDecisionEngine };
