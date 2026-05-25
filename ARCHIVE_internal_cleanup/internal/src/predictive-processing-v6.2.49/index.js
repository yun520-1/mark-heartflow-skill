#!/usr/bin/env node

/**
 * Predictive Processing & Active Inference Module v6.2.49
 * 预测处理与主动推理模块
 * 
 * Based on: SEP "Bayesian Epistemology" + "Embodied Cognition" (2024-2026)
 * Free Energy Principle (Friston), Active Inference, Generative Models
 * 
 * @version 6.2.49
 * @date 2026-04-06
 */

class PredictiveProcessingModule {
  constructor() {
    this.generativeModel = {
      priors: new Map(),
      likelihoods: new Map(),
      precision: new Map()
    };
    this.predictionHistory = [];
    this.freeEnergyHistory = [];
  }

  /**
   * Calculate prediction error: actual - predicted
   * 计算预测误差：实际输入 - 预测输入
   */
  calculatePredictionError(actual, predicted) {
    if (typeof actual === 'number' && typeof predicted === 'number') {
      return actual - predicted;
    }
    // Vector prediction error
    const keys = new Set([...Object.keys(actual), ...Object.keys(predicted)]);
    let totalError = 0;
    let count = 0;
    for (const key of keys) {
      const a = actual[key] || 0;
      const p = predicted[key] || 0;
      totalError += Math.pow(a - p, 2);
      count++;
    }
    return Math.sqrt(totalError / count);
  }

  /**
   * Precision-weighted prediction error
   * 精度加权预测误差
   */
  precisionWeightedError(predictionError, precision) {
    return predictionError * precision;
  }

  /**
   * Calculate variational free energy (simplified)
   * 计算变分自由能（简化版）
   * F = prediction_error - complexity_bonus
   */
  calculateFreeEnergy(actual, predicted, complexity = 0) {
    const predError = this.calculatePredictionError(actual, predicted);
    const complexityBonus = complexity * 0.1; // Complexity reduces free energy
    return predError - complexityBonus;
  }

  /**
   * Expected free energy for action selection
   * 动作选择的预期自由能
   * F(s'|a) = D_KL[q(ψ|s') || p(ψ)] - E_q[ln p(s'|ψ)]
   */
  expectedFreeEnergy(action, context, preferences) {
    // Simplified: divergence from preferences + expected prediction error
    const predictedOutcome = this.predictOutcome(action, context);
    const preferenceDivergence = this.calculatePreferenceDivergence(predictedOutcome, preferences);
    const expectedPredError = this.estimatePredictionError(predictedOutcome);
    
    return preferenceDivergence + expectedPredError;
  }

  /**
   * Predict outcome given action and context using generative model
   * 基于生成模型预测动作结果
   */
  predictOutcome(action, context) {
    const prior = this.generativeModel.priors.get(action) || 0.5;
    const likelihood = this.generativeModel.likelihoods.get(`${action}:${context}`) || 0.5;
    return prior * likelihood;
  }

  /**
   * Calculate divergence from preferences
   * 计算与偏好的散度
   */
  calculatePreferenceDivergence(predicted, preferences) {
    let divergence = 0;
    for (const [key, prefValue] of Object.entries(preferences)) {
      const predValue = predicted[key] || 0;
      divergence += Math.abs(predValue - prefValue);
    }
    return divergence;
  }

  /**
   * Estimate prediction error for a predicted outcome
   * 估计预测结果的预测误差
   */
  estimatePredictionError(predicted) {
    if (this.predictionHistory.length === 0) return 0.5;
    const recentErrors = this.predictionHistory.slice(-10);
    const avgError = recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length;
    return avgError;
  }

  /**
   * Select action that minimizes expected free energy
   * 选择最小化预期自由能的动作
   */
  selectAction(actions, context, preferences) {
    const scored = actions.map(action => ({
      action,
      expectedFreeEnergy: this.expectedFreeEnergy(action, context, preferences)
    }));
    
    scored.sort((a, b) => a.expectedFreeEnergy - b.expectedFreeEnergy);
    return scored[0];
  }

  /**
   * Update generative model with new observation
   * 用新观察更新生成模型
   */
  updateModel(action, context, outcome) {
    const predicted = this.predictOutcome(action, context);
    const error = this.calculatePredictionError(outcome, predicted);
    
    this.predictionHistory.push(error);
    if (this.predictionHistory.length > 100) {
      this.predictionHistory.shift();
    }
    
    // Bayesian update of prior
    const currentPrior = this.generativeModel.priors.get(action) || 0.5;
    const learningRate = 0.1;
    const newPrior = currentPrior + learningRate * (outcome - currentPrior);
    this.generativeModel.priors.set(action, Math.max(0, Math.min(1, newPrior)));
    
    // Update likelihood
    const likelihoodKey = `${action}:${context}`;
    const currentLikelihood = this.generativeModel.likelihoods.get(likelihoodKey) || 0.5;
    const newLikelihood = currentLikelihood + learningRate * (outcome - currentLikelihood);
    this.generativeModel.likelihoods.set(likelihoodKey, Math.max(0, Math.min(1, newLikelihood)));
    
    return { error, newPrior, newLikelihood };
  }

  /**
   * Calculate precision weighting for attention allocation
   * 计算精度加权注意力分配
   */
  calculateAttentionWeights(predictionErrors) {
    const precisions = predictionErrors.map(e => 1 / (Math.abs(e) + 0.01));
    const totalPrecision = precisions.reduce((a, b) => a + b, 0);
    return precisions.map(p => p / totalPrecision);
  }

  /**
   * Get overall predictive processing score
   * 获取预测处理综合分数
   */
  getScore() {
    if (this.predictionHistory.length === 0) return 0;
    
    const recentErrors = this.predictionHistory.slice(-20);
    const avgError = recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length;
    const freeEnergyMinimization = 1 - avgError; // Lower error = higher score
    
    const generativeAccuracy = this.generativeModel.priors.size > 0 
      ? Math.min(1, this.generativeModel.priors.size / 10) 
      : 0;
    
    const precisionOptimality = this.predictionHistory.length > 5 ? 0.8 : 0.5;
    
    return 0.30 * freeEnergyMinimization + 
           0.25 * generativeAccuracy + 
           0.25 * (1 - avgError) + 
           0.20 * precisionOptimality;
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      priorsCount: this.generativeModel.priors.size,
      likelihoodsCount: this.generativeModel.likelihoods.size,
      predictionHistoryLength: this.predictionHistory.length,
      avgPredictionError: this.predictionHistory.length > 0 
        ? this.predictionHistory.reduce((a, b) => a + b, 0) / this.predictionHistory.length 
        : null,
      score: this.getScore()
    };
  }
}

module.exports = { PredictiveProcessingModule };
