/**
 * World Model — 环境世界模型
 *
 * 基于 arXiv:2606.24597 "Qwen-AgentWorld: Language World Models for General Agents"
 * 和 arXiv:2606.22813 "Active Inference as the Test-Time Scaling Law"
 *
 * 核心能力：
 *   1. Environment Prediction — 基于当前状态预测环境动态
 *   2. Counterfactual Simulation — 反事实模拟：如果做了 X 会怎样
 *   3. Active Inference — 主动推理：最小化预测误差驱动行为
 *   4. State Transition — 状态转移模型
 *
 * 注意：这是一个轻量级世界模型，运行在纯 JS 环境中，
 * 不依赖 LLM 推理。核心是统计状态转移 + 主动推理目标函数。
 *
 * @version 1.0.0
 */

class WorldModel {
  constructor(options = {}) {
    this._config = {
      maxStates: options.maxStates || 5000,
      transitionThreshold: options.transitionThreshold || 0.3,
      predictionHorizon: options.predictionHorizon || 5,
      activeInferenceWeight: options.activeInferenceWeight || 0.4,
      ...options,
    };

    this._states = new Map();
    this._transitions = new Map();
    this._predictions = [];
    this._stats = {
      totalStates: 0,
      totalTransitions: 0,
      predictions: 0,
      correctPredictions: 0,
      avgAccuracy: 0,
    };
  }

  // ─── State Management ───────────────────────────────────────

  /**
   * 注册/更新环境状态
   */
  registerState(state) {
    const key = this._stateKey(state);
    const existing = this._states.get(key);

    const entry = {
      key,
      features: { ...state },
      timestamp: Date.now(),
      visitCount: existing ? existing.visitCount + 1 : 1,
      outcomes: existing ? [...existing.outcomes] : [],
    };

    this._states.set(key, entry);
    this._stats.totalStates = this._states.size;
    return entry;
  }

  _stateKey(state) {
    const keys = Object.keys(state).sort();
    return keys.map(k => `${k}=${String(state[k]).slice(0, 50)}`).join('|');
  }

  // ─── Transition Learning ────────────────────────────────────

  /**
   * 记录状态转移（action 导致的状态变化）
   */
  recordTransition(fromState, action, toState, outcome) {
    const fromKey = this._stateKey(fromState);
    const toKey = this._stateKey(toState);
    const actionKey = this._actionKey(action);

    const transitionKey = `${fromKey}::${actionKey}`;

    let transition = this._transitions.get(transitionKey);
    if (!transition) {
      transition = {
        from: fromKey,
        action: actionKey,
        outcomes: [],
        counts: {},
        createdAt: Date.now(),
      };
      this._transitions.set(transitionKey, transition);
    }

    transition.outcomes.push({
      to: toKey,
      outcome: outcome || 'unknown',
      timestamp: Date.now(),
    });

    transition.counts[toKey] = (transition.counts[toKey] || 0) + 1;

    if (transition.outcomes.length > 100) {
      transition.outcomes = transition.outcomes.slice(-100);
    }

    this._stats.totalTransitions = this._transitions.size;

    // 更新状态
    this.registerState(toState);

    return transition;
  }

  _actionKey(action) {
    if (!action) return 'none';
    if (typeof action === 'string') return action.slice(0, 100);
    return JSON.stringify(action).slice(0, 100);
  }

  // ─── Prediction ─────────────────────────────────────────────

  /**
   * 预测执行 action 后的可能状态
   */
  predict(fromState, action) {
    const fromKey = this._stateKey(fromState);
    const actionKey = this._actionKey(action);
    const transitionKey = `${fromKey}::${actionKey}`;

    const transition = this._transitions.get(transitionKey);
    if (!transition) {
      return {
        confidence: 0,
        predictedStates: [],
        method: 'no_data',
        message: 'No transition data available for this state-action pair',
      };
    }

    const total = Object.values(transition.counts).reduce((a, b) => a + b, 0);
    const predictions = Object.entries(transition.counts)
      .map(([toKey, count]) => ({
        stateKey: toKey,
        probability: count / total,
        features: this._reconstructState(toKey),
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, this._config.predictionHorizon);

    const confidence = predictions.length > 0 ? predictions[0].probability : 0;

    this._predictions.push({
      timestamp: Date.now(),
      fromKey,
      action: actionKey,
      predictions,
      confidence,
    });

    this._stats.predictions++;

    return {
      confidence: +confidence.toFixed(3),
      predictedStates: predictions,
      method: 'transition_model',
      samples: total,
    };
  }

  _reconstructState(key) {
    if (!key || key === 'none') return {};
    const parts = key.split('|');
    const state = {};
    for (const part of parts) {
      const [k, ...v] = part.split('=');
      if (k && v.length > 0) state[k] = v.join('=');
    }
    return state;
  }

  // ─── Active Inference ───────────────────────────────────────

  /**
   * 主动推理：选择最小化预测误差的动作
   * 基于 arXiv:2606.22813 — active inference as test-time scaling law
   */
  activeInference(currentState, availableActions) {
    if (!availableActions || availableActions.length === 0) return null;

    const predictions = availableActions.map(action => {
      const prediction = this.predict(currentState, action);
      const predictionError = 1 - prediction.confidence;

      // 主动推理目标：最小化预测误差（surprise minimization）
      // 同时考虑探索价值（高不确定性 = 高信息增益）
      const explorationValue = predictionError * this._config.activeInferenceWeight;
      const exploitationValue = prediction.confidence * (1 - this._config.activeInferenceWeight);

      const score = exploitationValue + explorationValue;

      return {
        action,
        predictionError: +predictionError.toFixed(3),
        confidence: prediction.confidence,
        score: +score.toFixed(3),
        reason: predictionError > 0.5 ? 'explore' : 'exploit',
      };
    });

    predictions.sort((a, b) => b.score - a.score);
    return predictions[0];
  }

  // ─── Counterfactual Simulation ──────────────────────────────

  /**
   * 反事实模拟：如果我当时做了不同选择会怎样？
   */
  simulateCounterfactual(state, takenAction, alternativeAction) {
    const takenPrediction = this.predict(state, takenAction);
    const altPrediction = this.predict(state, alternativeAction);

    return {
      taken: {
        action: takenAction,
        prediction: takenPrediction,
      },
      alternative: {
        action: alternativeAction,
        prediction: altPrediction,
      },
      comparison: {
        confidenceDiff: +(takenPrediction.confidence - altPrediction.confidence).toFixed(3),
        betterAlternative: altPrediction.confidence > takenPrediction.confidence,
        recommendation: altPrediction.confidence > takenPrediction.confidence
          ? 'alternative_action_preferred'
          : 'taken_action_optimal',
      },
    };
  }

  // ─── Stats ──────────────────────────────────────────────────

  getStats() {
    return {
      stateCount: this._states.size,
      transitionCount: this._transitions.size,
      predictions: this._stats.predictions,
      accuracy: this._stats.predictions > 0
        ? (this._stats.correctPredictions / this._stats.predictions).toFixed(3)
        : 0,
      recentPredictions: this._predictions.slice(-5),
    };
  }
}

module.exports = { WorldModel };
