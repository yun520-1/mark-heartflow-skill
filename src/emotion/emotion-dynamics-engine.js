/**
 * Emotion Dynamics Engine — 情绪动力学引擎（公式驱动）
 * 
 * 集成公式：
 *   - PAD情绪空间: Pleasure-Arousal-Dominance 三维模型
 *   - 情绪调节: 认知重评 + 表达抑制 (Gross模型)
 *   - Rescorla-Wagner情绪条件化
 *   - 情绪弹性/恢复: 指数衰减恢复模型
 *   - 情绪感染: SIR模型变体
 *   - 耶克斯-多德森: 唤醒-绩效倒U
 *   - 情绪混合: 基本情绪加权组合
 *   - 情绪记忆: 情绪增强记忆效应
 *   - 自我效能: Bandura模型
 *   - 归因理论: Weiner三维归因
 * 
 * dispatch: 'emotionDynamics.analyze' / 'emotionDynamics.regulate' / 'emotionDynamics.resilience'
 */

const { getFormulaBridge } = require('../formula/formula-bridge.js');

class EmotionDynamicsEngine {
  constructor(options = {}) {
    this._bridge = null;
    // PAD状态
    this._padState = { pleasure: 0, arousal: 0.5, dominance: 0.5 };
    // 情绪历史（用于弹性计算）
    this._emotionHistory = [];
    this._maxHistory = 100;
    // 条件化强度
    this._conditioningStrength = new Map();  // stimulus → strength
    // 自我效能
    this._selfEfficacy = options.initialSelfEfficacy || 0.5;
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // ═══════════════════════════════════════════
  // PAD 情绪空间
  // ═══════════════════════════════════════════

  /**
   * 更新PAD状态
   * @param {object} input - { pleasureDelta, arousalDelta, dominanceDelta, trigger }
   * @returns {object} { pad, emotionLabel, intensity, valence }
   */
  updatePAD(input = {}) {
    // 衰减：情绪自然回归基线
    const decay = 0.05;
    this._padState.pleasure *= (1 - decay);
    this._padState.arousal *= (1 - decay);
    this._padState.dominance *= (1 - decay);

    // 应用输入
    this._padState.pleasure = Math.max(-1, Math.min(1, this._padState.pleasure + (input.pleasureDelta || 0)));
    this._padState.arousal = Math.max(0, Math.min(1, this._padState.arousal + (input.arousalDelta || 0)));
    this._padState.dominance = Math.max(0, Math.min(1, this._padState.dominance + (input.dominanceDelta || 0)));

    // 映射到情绪标签
    const emotionLabel = this._mapPADToEmotion(this._padState);
    const intensity = Math.sqrt(this._padState.pleasure ** 2 + this._padState.arousal ** 2);
    const valence = this._padState.pleasure > 0 ? 'positive' : this._padState.pleasure < -0.2 ? 'negative' : 'neutral';

    // 记录历史
    this._emotionHistory.push({ ...this._padState, label: emotionLabel, ts: Date.now() });
    if (this._emotionHistory.length > this._maxHistory) this._emotionHistory.shift();

    return {
      pad: { ...this._padState },
      emotionLabel,
      intensity: +intensity.toFixed(3),
      valence,
      trigger: input.trigger || null
    };
  }

  _mapPADToEmotion(pad) {
    const { pleasure, arousal, dominance } = pad;
    if (pleasure > 0.3 && arousal > 0.6) return 'excited';
    if (pleasure > 0.3 && arousal < 0.4) return 'calm';
    if (pleasure > 0.3 && arousal >= 0.4 && arousal <= 0.6) return 'content';
    if (pleasure < -0.3 && arousal > 0.6) return 'angry';
    if (pleasure < -0.3 && arousal < 0.4) return 'sad';
    if (pleasure < -0.3 && arousal >= 0.4 && arousal <= 0.6) return 'distressed';
    if (pleasure < -0.3 && dominance < 0.3) return 'fearful';
    if (Math.abs(pleasure) <= 0.2 && arousal > 0.7) return 'surprised';
    if (Math.abs(pleasure) <= 0.2 && arousal < 0.3) return 'bored';
    return 'neutral';
  }

  // ═══════════════════════════════════════════
  // 情绪调节 (Gross 模型)
  // ═══════════════════════════════════════════

  /**
   * 认知重评：改变对情绪事件的解读
   * 效果：降低arousal，pleasure向正偏移
   * @param {string} strategy - 'reappraisal' | 'suppression' | 'distraction' | 'acceptance'
   * @param {number} intensity - 调节强度(0-1)
   * @returns {object} { strategy, effectiveness, padChange, sideEffects }
   */
  regulate(strategy, intensity = 0.5) {
    const before = { ...this._padState };
    let effectiveness = 0;
    let sideEffects = [];

    switch (strategy) {
      case 'reappraisal':
        // 认知重评：最健康的策略，降低负面情绪arousal
        this._padState.pleasure += 0.2 * intensity;
        this._padState.arousal -= 0.15 * intensity;
        effectiveness = 0.8;
        break;
      case 'suppression':
        // 表达抑制：表面平静但内在arousal不降，长期有害
        this._padState.dominance += 0.1 * intensity;
        this._padState.arousal -= 0.05 * intensity;  // 表面降低
        effectiveness = 0.4;
        sideEffects.push('increased_physiological_arousal', 'decreased_memory_accuracy');
        break;
      case 'distraction':
        // 注意转移：短期有效但不解决根本
        this._padState.arousal -= 0.3 * intensity;
        this._padState.pleasure += 0.1 * intensity;
        effectiveness = 0.6;
        sideEffects.push('temporary_relief_only');
        break;
      case 'acceptance':
        // 接纳：正念策略，长期最有效
        this._padState.dominance += 0.15 * intensity;
        effectiveness = 0.7;
        sideEffects.push('requires_practice');
        break;
      default:
        effectiveness = 0;
    }

    // 限制范围
    this._padState.pleasure = Math.max(-1, Math.min(1, this._padState.pleasure));
    this._padState.arousal = Math.max(0, Math.min(1, this._padState.arousal));
    this._padState.dominance = Math.max(0, Math.min(1, this._padState.dominance));

    const padChange = {
      pleasure: +(this._padState.pleasure - before.pleasure).toFixed(3),
      arousal: +(this._padState.arousal - before.arousal).toFixed(3),
      dominance: +(this._padState.dominance - before.dominance).toFixed(3)
    };

    return { strategy, effectiveness, padChange, sideEffects, newPAD: { ...this._padState } };
  }

  // ═══════════════════════════════════════════
  // 情绪弹性/恢复
  // ═══════════════════════════════════════════

  /**
   * 计算情绪弹性指数
   * Resilience = 恢复速度 × 恢复程度 / 冲击强度
   * @returns {object} { resilience, recoveryRate, baselineDeviation, trend }
   */
  computeResilience() {
    if (this._emotionHistory.length < 3) {
      return { resilience: 0.5, recoveryRate: 0, baselineDeviation: 0, trend: 'insufficient_data' };
    }

    // 找最近的负面冲击和恢复
    const recent = this._emotionHistory.slice(-20);
    let minPleasure = 0, recoverySpeed = 0;
    let shockIdx = -1;

    for (let i = 0; i < recent.length; i++) {
      if (recent[i].pleasure < minPleasure) {
        minPleasure = recent[i].pleasure;
        shockIdx = i;
      }
    }

    if (shockIdx >= 0 && shockIdx < recent.length - 1) {
      // 恢复速度：从最低点到回到基线的时间
      const shockTime = recent[shockIdx].ts;
      const currentPleasure = recent[recent.length - 1].pleasure;
      const recoveryDelta = currentPleasure - minPleasure;
      const timeDelta = (recent[recent.length - 1].ts - shockTime) / 60000;  // 分钟
      recoverySpeed = timeDelta > 0 ? recoveryDelta / timeDelta : 0;
    }

    // 弹性指数
    const shockIntensity = Math.abs(minPleasure);
    const currentDeviation = Math.abs(this._padState.pleasure);
    const resilience = shockIntensity > 0 ? Math.min(1, (1 - currentDeviation) * Math.max(0, recoverySpeed * 10 + 0.5)) : 0.8;

    // 趋势
    const last3 = recent.slice(-3).map(r => r.pleasure);
    const trend = last3[2] > last3[1] && last3[1] > last3[0] ? 'recovering' :
                  last3[2] < last3[1] && last3[1] < last3[0] ? 'declining' : 'stable';

    return {
      resilience: +resilience.toFixed(3),
      recoveryRate: +recoverySpeed.toFixed(4),
      baselineDeviation: +currentDeviation.toFixed(3),
      trend,
      recentShockIntensity: +shockIntensity.toFixed(3)
    };
  }

  // ═══════════════════════════════════════════
  // Rescorla-Wagner 情绪条件化
  // ═══════════════════════════════════════════

  /**
   * 情绪条件化更新
   * @param {string} stimulus - 刺激
   * @param {number} usStrength - 无条件刺激强度(0-1)
   * @param {number} [alpha=0.1] salience - 刺激显著性
   * @param {number} [0.1] learningRate - 学习率
   * @returns {object} { stimulus, oldStrength, newStrength, predictionError }
   */
  conditionize(stimulus, usStrength, salience = 1, learningRate = 0.1) {
    const bridge = this._getBridge();
    const oldStrength = this._conditioningStrength.get(stimulus) || 0;
    const result = bridge.rescorlaWagner ? 
      { deltaV: learningRate * salience * (usStrength - oldStrength), predictionError: usStrength - oldStrength } :
      { deltaV: learningRate * salience * (usStrength - oldStrength), predictionError: usStrength - oldStrength };
    const newStrength = Math.max(0, Math.min(1, oldStrength + result.deltaV));
    this._conditioningStrength.set(stimulus, newStrength);
    return { stimulus, oldStrength: +oldStrength.toFixed(4), newStrength: +newStrength.toFixed(4), predictionError: +result.predictionError.toFixed(4) };
  }

  // ═══════════════════════════════════════════
  // 情绪感染 (SIR模型变体)
  // ═══════════════════════════════════════════

  /**
   * 情绪在群体中的传播
   * dI/dt = β × S × I - γ × I（S=易感, I=感染, R=恢复）
   * @param {object} state - { susceptible, infected, recovered }
   * @param {number} beta - 传播率
   * @param {number} gamma - 恢复率
   * @param {number} dt - 时间步长
   * @returns {object} 新状态
   */
  emotionContagion(state, beta = 0.3, gamma = 0.1, dt = 1) {
    const { susceptible = 0.5, infected = 0.3, recovered = 0.2 } = state;
    const newInfected = beta * susceptible * infected * dt;
    const newRecovered = gamma * infected * dt;
    const s2 = Math.max(0, susceptible - newInfected);
    const i2 = Math.max(0, infected + newInfected - newRecovered);
    const r2 = Math.max(0, recovered + newRecovered);
    const total = s2 + i2 + r2 || 1;
    return {
      susceptible: +(s2 / total).toFixed(4),
      infected: +(i2 / total).toFixed(4),
      recovered: +(r2 / total).toFixed(4),
      peakInfected: +(i2 / total).toFixed(4),
      r0: +(beta / gamma).toFixed(2)  // 基本再生数
    };
  }

  // ═══════════════════════════════════════════
  // 耶克斯-多德森 + 最优唤醒
  // ═══════════════════════════════════════════

  /**
   * 计算当前绩效预期和最优唤醒
   * @param {string} taskComplexity - 'simple'|'moderate'|'complex'
   * @returns {object} { currentPerformance, optimalArousal, performanceGap, recommendation }
   */
  yerkesDodsonAnalysis(taskComplexity = 'moderate') {
    const bridge = this._getBridge();
    const arousal = this._padState.arousal;
    
    // 不同复杂度的最优唤醒点
    const optimalArousal = { simple: 0.7, moderate: 0.5, complex: 0.3 }[taskComplexity] || 0.5;
    
    // 绩效 = -a(A - A_opt)² + b
    const performance = bridge.yerkesDodsonEquation(arousal, optimalArousal, 4, 1);
    const gap = performance - 0.8;  // 目标绩效0.8

    let recommendation;
    if (arousal > optimalArousal + 0.15) recommendation = 'reduce_arousal';
    else if (arousal < optimalArousal - 0.15) recommendation = 'increase_arousal';
    else recommendation = 'optimal_zone';

    return {
      currentArousal: +arousal.toFixed(3),
      optimalArousal,
      currentPerformance: +performance.toFixed(3),
      performanceGap: +gap.toFixed(3),
      taskComplexity,
      recommendation
    };
  }

  // ═══════════════════════════════════════════
  // 自我效能 (Bandura)
  // ═══════════════════════════════════════════

  /**
   * 更新自我效能
   * SE = w1·mastery + w2·vicarious + w3·persuasion + w4·physiological
   * @param {object} sources - { mastery, vicarious, persuasion, physiological }
   * @returns {object} { selfEfficacy, dominantSource, confidence }
   */
  updateSelfEfficacy(sources = {}) {
    const { mastery = 0, vicarious = 0, persuasion = 0, physiological = 0 } = sources;
    const w = { mastery: 0.4, vicarious: 0.2, persuasion: 0.2, physiological: 0.2 };
    
    const newSE = w.mastery * mastery + w.vicarious * vicarious + w.persuasion * persuasion + w.physiological * physiological;
    // 渐进更新（不完全替换）
    this._selfEfficacy = 0.7 * this._selfEfficacy + 0.3 * newSE;
    this._selfEfficacy = Math.max(0, Math.min(1, this._selfEfficacy));

    const dominantSource = Object.entries(sources).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    const confidence = this._selfEfficacy > 0.7 ? 'high' : this._selfEfficacy > 0.4 ? 'moderate' : 'low';

    return { selfEfficacy: +this._selfEfficacy.toFixed(3), dominantSource, confidence };
  }

  // ═══════════════════════════════════════════
  // 归因理论 (Weiner)
  // ═══════════════════════════════════════════

  /**
   * 三维归因分析
   * @param {object} event - { locus: 'internal'|'external', stability: 'stable'|'unstable', controllability: 'controllable'|'uncontrollable' }
   * @returns {object} { attribution, emotionExpectation, motivationImpact }
   */
  weinerAttribution(event = {}) {
    const { locus, stability, controllability } = event;
    
    let attribution, emotionExpectation, motivationImpact;
    
    if (locus === 'internal' && stability === 'stable' && controllability === 'controllable') {
      attribution = 'ability_effort';
      emotionExpectation = 'pride_confidence';
      motivationImpact = 'high_positive';
    } else if (locus === 'internal' && stability === 'unstable') {
      attribution = 'effort_fluctuation';
      emotionExpectation = 'hope_or_guilt';
      motivationImpact = 'moderate';
    } else if (locus === 'external' && stability === 'stable') {
      attribution = 'task_difficulty';
      emotionExpectation = 'acceptance_resignation';
      motivationImpact = 'low';
    } else if (locus === 'external' && stability === 'unstable') {
      attribution = 'luck_chance';
      emotionExpectation = 'surprise_relief';
      motivationImpact = 'unpredictable';
    } else {
      attribution = 'mixed';
      emotionExpectation = 'ambiguous';
      motivationImpact = 'moderate';
    }

    return { attribution, emotionExpectation, motivationImpact, locus, stability, controllability };
  }

  // ═══════════════════════════════════════════
  // 综合情绪分析
  // ═══════════════════════════════════════════

  /**
   * 综合情绪分析入口
   * @param {string} type - 'pad'|'regulate'|'resilience'|'condition'|'contagion'|'yerkes'|'efficacy'|'attribution'
   * @param {object} params
   */
  analyze(type, params = {}) {
    switch (type) {
      case 'pad': return this.updatePAD(params);
      case 'regulate': return this.regulate(params.strategy, params.intensity);
      case 'resilience': return this.computeResilience();
      case 'condition': return this.conditionize(params.stimulus, params.usStrength, params.salience, params.learningRate);
      case 'contagion': return this.emotionContagion(params.state, params.beta, params.gamma, params.dt);
      case 'yerkes': return this.yerkesDodsonAnalysis(params.taskComplexity);
      case 'efficacy': return this.updateSelfEfficacy(params.sources);
      case 'attribution': return this.weinerAttribution(params.event);
      default: return { error: `Unknown emotion type: ${type}` };
    }
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'ok',
      currentPAD: { ...this._padState },
      currentEmotion: this._mapPADToEmotion(this._padState),
      selfEfficacy: +this._selfEfficacy.toFixed(3),
      conditionedStimuli: this._conditioningStrength.size,
      historyLength: this._emotionHistory.length,
      modules: ['pad', 'regulate', 'resilience', 'condition', 'contagion', 'yerkes', 'efficacy', 'attribution']
    };
  }
}

module.exports = { EmotionDynamicsEngine };
