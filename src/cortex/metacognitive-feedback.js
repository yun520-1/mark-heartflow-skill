/**
 * MetacognitiveFeedback v1.0.0 — 元认知反馈系统
 *
 * 灵感来源: SOFAI-LM (Self-Organizing Feedback-Integrated AI Language Model)
 *           元认知监控层：系统在推理过程中实时评估自身的推理质量
 *
 * 核心机制:
 * 1. 快评估 (fast-assessment) — 轻量级，目标 <1ms
 *    检查: 阶段成功率、平均置信度、错误计数、时序异常
 * 2. 深评估 (deep-assessment) —  Thorough，目标 <10ms
 *    增加: 跨阶段一致性、矛盾检测、置信度校准验证
 * 3. 自校正触发 — 当质量分 < 0.6 时，建议重新运行受影响阶段
 *
 * 集成点: pipeline.js output 阶段 (第 423-433 行)
 *   调用 mf.assess(pipelineResult)，将 qualityScore 写入 output._qualityScore
 *
 * 依赖: 无（纯计算模块，不 require pipeline.js 或其他 HeartFlow 模块）
 */

const VERSION = '1.0.0';

// 默认质量阈值 — 低于此触发自校正
const DEFAULT_QUALITY_THRESHOLD = 0.6;

// 时序异常检测倍数 — 超过平均时间此倍数视为异常
const TIMING_ANOMALY_FACTOR = 2.0;

// 深度评估维度权重
const DEEP_ASSESSMENT_WEIGHTS = {
  crossStageConsistency: 0.30,
  contradictionDetection:  0.35,
  confidenceCalibration:   0.35,
};

class MetacognitiveFeedback {
  /**
   * @param {Object} [options]
   * @param {number} [options.qualityThreshold=0.6] — 质量分阈值，低于触发自校正
   * @param {number} [options.timingAnomalyFactor=2.0] — 时序异常检测倍数
   * @param {number} [options.maxHistorySize=500] — 评估历史最大条目数
   */
  constructor(options = {}) {
    this.version = VERSION;
    this.qualityThreshold = options.qualityThreshold ?? DEFAULT_QUALITY_THRESHOLD;
    this.timingAnomalyFactor = options.timingAnomalyFactor ?? TIMING_ANOMALY_FACTOR;
    this.maxHistorySize = options.maxHistorySize || 500;

    // 评估历史
    this._history = [];

    // 统计
    this._stats = {
      totalAssessments: 0,
      fastAssessments: 0,
      deepAssessments: 0,
      correctionsTriggered: 0,
      averageQualityScore: 0,
      qualityScoreSum: 0,
      stageReliability: {},  // stageId -> { calls, successes, failures }
    };
  }

  // ========================================================================
  // 快评估 (fast-assessment, 目标 <1ms)
  // ========================================================================

  /**
   * 快速评估管道执行质量。
   *
   * 四个维度:
   *   stageSuccess   — 阶段成功率 (0..1)
   *   avgConfidence  — 平均置信度 (0..1)，从 output.judgmentConfidence 提取
   *   errorPenalty   — 错误惩罚 (0..1)，基于错误数量线性衰减
   *   timingHealth   — 时序健康度 (0..1)，异常阶段越多越低
   *
   * @param {Object} pipelineResult — Pipeline._runStages() 返回的完整结果
   * @returns {{ score: number, mode: 'fast', dimensionScores: object, flaggedStages: Array, timestamp: string }}
   */
  assess(pipelineResult) {
    const t0 = Date.now();
    const { stages = [], output = {}, stats = {} } = pipelineResult;

    const totalStages = stages.length || 1;
    const successfulStages = stages.filter(s => s.success).length;
    const failedStages = stages.filter(s => !s.success);
    const errorCount = stats.stagesFailed ?? failedStages.length;

    // 维度 1: 阶段成功率
    const stageSuccess = successfulStages / totalStages;

    // 维度 2: 平均置信度 — 从输出层提取 judgmentConfidence
    const avgConfidence = this._extractConfidence(output, stages);

    // 维度 3: 错误惩罚 — 每 3 个错误阶段扣 0.15，最低 0
    const errorPenalty = Math.max(0, 1 - (errorCount / totalStages) * 0.5);

    // 维度 4: 时序健康度 — 标记超过平均 2x 的阶段
    const { timingHealth, flaggedStages } = this._checkTimingHealth(stages);

    // 加权综合评分
    const dimensionScores = {
      stageSuccess:   Math.round(stageSuccess * 100) / 100,
      avgConfidence:  Math.round(avgConfidence * 100) / 100,
      errorPenalty:   Math.round(errorPenalty * 100) / 100,
      timingHealth:   Math.round(timingHealth * 100) / 100,
    };

    const weights = { stageSuccess: 0.30, avgConfidence: 0.25, errorPenalty: 0.20, timingHealth: 0.25 };
    const score = this._weightedAverage(dimensionScores, weights);

    const result = {
      score: Math.round(score * 1000) / 1000,
      mode: 'fast',
      dimensionScores,
      flaggedStages,
      durationMs: Date.now() - t0,
      timestamp: new Date().toISOString(),
    };

    this._recordAssessment(result);
    return result;
  }

  // ========================================================================
  // 深评估 (deep-assessment, 目标 <10ms)
  // ========================================================================

  /**
   * 深度评估管道执行质量 — 在快评估基础上增加跨阶段分析。
   *
   * 额外维度:
   *   crossStageConsistency — 跨阶段输出一致性 (0..1)
   *   contradictionDetection — 阶段间矛盾检测 (0..1)
   *   confidenceCalibration  — 置信度校准验证 (0..1)
   *
   * @param {Object} pipelineResult — Pipeline._runStages() 返回的完整结果
   * @returns {{ score: number, mode: 'deep', dimensionScores: object, flaggedStages: Array, consistencyScores: object, flaggedIssues: Array, timestamp: string }}
   */
  deepAssess(pipelineResult) {
    const t0 = Date.now();
    const { stages = [], output = {}, stats = {}, ctx = {} } = pipelineResult;

    // 先执行快评估作为基础
    const fastResult = this.assess(pipelineResult);
    const baseScores = fastResult.dimensionScores;

    // 深度维度
    const crossStage = this._checkCrossStageConsistency(ctx, stages);
    const contradiction = this._checkContradictionDetection(ctx, output, stages);
    const calibration = this._checkConfidenceCalibration(ctx, output, stages);

    const consistencyScores = {
      crossStageConsistency: crossStage.score,
      contradictionDetection:  contradiction.score,
      confidenceCalibration:   calibration.score,
    };

    const deepDimensions = {
      ...baseScores,
      crossStageConsistency: Math.round(crossStage.score * 100) / 100,
      contradictionDetection:  Math.round(contradiction.score * 100) / 100,
      confidenceCalibration:   Math.round(calibration.score * 100) / 100,
    };

    const deepWeights = {
      stageSuccess:   0.20,
      avgConfidence:  0.15,
      errorPenalty:   0.10,
      timingHealth:   0.10,
      crossStageConsistency: DEEP_ASSESSMENT_WEIGHTS.crossStageConsistency,
      contradictionDetection:  DEEP_ASSESSMENT_WEIGHTS.contradictionDetection,
      confidenceCalibration:   DEEP_ASSESSMENT_WEIGHTS.confidenceCalibration,
    };

    const score = this._weightedAverage(deepDimensions, deepWeights);

    // 汇总所有标记的阶段和问题
    const flaggedStages = [...(fastResult.flaggedStages || [])];
    const flaggedIssues = [
      ...crossStage.issues,
      ...contradiction.issues,
      ...calibration.issues,
    ];

    const result = {
      score: Math.round(score * 1000) / 1000,
      mode: 'deep',
      dimensionScores: deepDimensions,
      consistencyScores,
      flaggedStages,
      flaggedIssues,
      durationMs: Date.now() - t0,
      timestamp: new Date().toISOString(),
    };

    this._recordAssessment(result);
    return result;
  }

  // ========================================================================
  // 自校正建议
  // ========================================================================

  /**
   * 根据评估结果生成自校正建议。
   *
   * 当质量分低于阈值时返回校正计划:
   *   { stageId, reason, suggestedParams, priority }
   *
   * 当质量分达标时返回 null（无需校正）。
   *
   * @param {Object} assessment — assess() 或 deepAssess() 的返回结果
   * @returns {Array<{stageId: string, reason: string, suggestedParams: Object, priority: number}>|null}
   */
  suggestCorrection(assessment) {
    if (assessment.score >= this.qualityThreshold) {
      return null;
    }

    const suggestions = [];
    const dims = assessment.dimensionScores;

    // 阶段成功率低 → 建议降级依赖该阶段的模块
    if ((dims.stageSuccess || 1) < 0.7) {
      suggestions.push({
        stageId: 'output',
        reason: 'low_stage_success_rate',
        suggestedParams: { fallback: true },
        priority: 3,
      });
    }

    // 置信度低 → 建议提升推理深度
    if ((dims.avgConfidence || 1) < 0.5) {
      suggestions.push({
        stageId: 'judgment',
        reason: 'low_confidence',
        suggestedParams: { depth: 'increased', confidenceBoost: true },
        priority: 3,
      });
    }

    // 时序异常 → 建议对该阶段增加超时或重试
    if (assessment.flaggedStages && assessment.flaggedStages.length > 0) {
      for (const stage of assessment.flaggedStages) {
        suggestions.push({
          stageId: stage.id,
          reason: 'timing_anomaly',
          suggestedParams: { timeout: stage.timing * 2, retry: true },
          priority: 2,
        });
      }
    }

    // 深度评估特有: 跨阶段一致性差 → 建议重运行心理学和判断阶段
    if (assessment.consistencyScores) {
      if ((assessment.consistencyScores.crossStageConsistency || 1) < 0.6) {
        suggestions.push({
          stageId: 'psychology',
          reason: 'cross_stage_inconsistency',
          suggestedParams: { revalidateWith: ['heartLogic', 'intent'] },
          priority: 2,
        });
      }

      if ((assessment.consistencyScores.contradictionDetection || 1) < 0.5) {
        suggestions.push({
          stageId: 'judgment',
          reason: 'contradiction_detected',
          suggestedParams: { resolveContradictions: true },
          priority: 3,
        });
      }

      if ((assessment.consistencyScores.confidenceCalibration || 1) < 0.5) {
        suggestions.push({
          stageId: 'judgment',
          reason: 'miscalibration',
          suggestedParams: { recalibrate: true },
          priority: 2,
        });
      }
    }

    // 错误惩罚低 → 标记有错误发生的阶段
    if ((dims.errorPenalty || 1) < 0.7) {
      suggestions.push({
        stageId: '_error_handling',
        reason: 'stages_had_errors',
        suggestedParams: { retryFailed: true },
        priority: 1,
      });
    }

    // 按优先级降序排列
    suggestions.sort((a, b) => b.priority - a.priority);

    this._stats.correctionsTriggered++;
    return suggestions;
  }

  // ========================================================================
  // 统计
  // ========================================================================

  /**
   * 获取评估统计摘要。
   * @returns {Object}
   */
  getStats() {
    const total = this._stats.totalAssessments;
    return {
      version: this.version,
      qualityThreshold: this.qualityThreshold,
      totalAssessments: total,
      fastAssessments: this._stats.fastAssessments,
      deepAssessments: this._stats.deepAssessments,
      correctionsTriggered: this._stats.correctionsTriggered,
      averageQualityScore: total > 0
        ? Math.round((this._stats.qualityScoreSum / total) * 1000) / 1000
        : 0,
      correctionRate: total > 0
        ? Math.round((this._stats.correctionsTriggered / total) * 1000) / 1000
        : 0,
      stageReliability: { ...this._stats.stageReliability },
      recentAssessments: this._history.slice(-10).map(a => ({
        mode: a.mode,
        score: a.score,
        timestamp: a.timestamp,
      })),
    };
  }

  /**
   * 清除评估历史。
   */
  reset() {
    this._history = [];
    this._stats = {
      totalAssessments: 0,
      fastAssessments: 0,
      deepAssessments: 0,
      correctionsTriggered: 0,
      qualityScoreSum: 0,
      stageReliability: {},
    };
  }

  // ========================================================================
  // 内部方法
  // ========================================================================

  /**
   * 从输出中提取置信度。
   * 优先级: judgmentConfidence > decision.confidence > 0.5
   */
  _extractConfidence(output, stages) {
    if (output.judgmentConfidence !== undefined && output.judgmentConfidence !== null) {
      return Math.max(0, Math.min(1, Number(output.judgmentConfidence)));
    }
    if (output.cognition?.judgment?.confidence !== undefined) {
      return Math.max(0, Math.min(1, Number(output.cognition.judgment.confidence)));
    }
    if (output.decision?.confidence !== undefined) {
      return Math.max(0, Math.min(1, Number(output.decision.confidence)));
    }
    // 从阶段结果推断
    const judgmentStage = stages.find(s => s.id === 'judgment');
    if (judgmentStage && judgmentStage.outputKeys) {
      return 0.5; // 无法确定时使用中性值
    }
    return 0.5;
  }

  /**
   * 时序健康度检查 — 标记超过均值 N 倍的阶段。
   */
  _checkTimingHealth(stages) {
    const timings = stages
      .filter(s => s.timing > 0)
      .map(s => ({ id: s.id, timing: s.timing }));

    if (timings.length === 0) {
      return { timingHealth: 1.0, flaggedStages: [] };
    }

    const mean = timings.reduce((s, t) => s + t.timing, 0) / timings.length;
    const threshold = mean * this.timingAnomalyFactor;
    const anomalies = timings.filter(t => t.timing > threshold);

    // 健康度 = 正常阶段占比
    const timingHealth = 1 - (anomalies.length / Math.max(1, stages.length));

    return {
      timingHealth: Math.max(0, Math.min(1, timingHealth)),
      flaggedStages: anomalies.map(a => ({ id: a.id, timing: a.timing, threshold, mean })),
    };
  }

  /**
   * 跨阶段一致性检查 — 比较 heartLogic、intent、psychology 之间的语义对齐。
   */
  _checkCrossStageConsistency(ctx, stages) {
    const issues = [];
    let checksPassed = 0;
    let totalChecks = 0;

    const heartLogic = ctx.heartLogic || {};
    const intent = ctx.intent || {};
    const psychology = ctx.psychology || {};

    // 检查 1: heartLogic 检测到痛苦，但 intent 显示为闲聊/一般意图 → 不一致
    totalChecks++;
    if (heartLogic.pain?.hasPain && heartLogic.pain.painLevel > 0.5) {
      if (intent.intent?.type === 'general' || intent.intent?.type === 'casual') {
        issues.push({
          type: 'pain_intent_mismatch',
          detail: `Pain level ${heartLogic.pain.painLevel} but intent type is ${intent.intent?.type}`,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // 检查 2: intent 类型与情绪极性反向 → 不一致
    totalChecks++;
    if (intent.tone?.sentiment !== undefined && psychology.psych?.emotion?.pleasure !== undefined) {
      const toneSentiment = intent.tone.sentiment;
      const emotionPleasure = psychology.psych.emotion.pleasure;
      // 情绪极性与意图情感方向显著相反
      if (Math.abs(toneSentiment - emotionPleasure) > 0.6) {
        issues.push({
          type: 'emotion_tone_mismatch',
          detail: `Tone sentiment ${toneSentiment} vs emotion pleasure ${emotionPleasure}`,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // 检查 3: judgment direction 与 decision type 方向冲突
    totalChecks++;
    const judgmentDir = outputFromCtx(ctx, 'judgment', 'direction');
    const decisionType = outputFromCtx(ctx, 'decision', 'drDecision');
    if (judgmentDir && decisionType) {
      const conflictPairs = [
        ['analyze', 'accelerate'],
        ['act', 'pause'],
        ['heal', 'accelerate'],
      ];
      const isConflict = conflictPairs.some(([j, d]) => judgmentDir === j && decisionType.type === d);
      if (isConflict) {
        issues.push({
          type: 'judgment_decision_conflict',
          detail: `Judgment direction ${judgmentDir} conflicts with decision type ${decisionType.type}`,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // 检查 4: cognitionGround 与 deepCognition 输出的总体情绪方向一致性
    totalChecks++;
    const dc = ctx.deepCognition || {};
    if (dc.cognitionGround?.valence && psychology.psych?.emotion?.pleasure !== undefined) {
      const groundValence = dc.cognitionGround.valence;
      const pleasure = psychology.psych.emotion.pleasure;
      if (Math.abs(groundValence - pleasure) > 0.7) {
        issues.push({
          type: 'cognition_ground_mismatch',
          detail: `Cognition ground valence ${groundValence} vs pleasure ${pleasure}`,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    const score = totalChecks > 0 ? checksPassed / totalChecks : 1.0;
    return { score: Math.max(0, Math.min(1, score)), issues };
  }

  /**
   * 矛盾检测 — 查找阶段输出中的显式矛盾信号。
   */
  _checkContradictionDetection(ctx, output, stages) {
    const issues = [];
    let checksPassed = 0;
    let totalChecks = 0;

    const agentPsych = outputFromCtx(ctx, 'psychology', 'agentPsych') || {};
    const judgment = outputFromCtx(ctx, 'judgment') || output || {};

    // 检查 1: 高置信度但高认知失调 → 矛盾
    totalChecks++;
    const confidence = judgment.confidence ?? output.judgmentConfidence ?? 0.5;
    const dissonance = agentPsych.cognitiveDissonance?.count || 0;
    if (confidence > 0.8 && dissonance > 2) {
      issues.push({
        type: 'high_confidence_high_dissonance',
        detail: `Confidence ${confidence} with ${dissonance} cognitive dissonances detected`,
      });
    } else {
      checksPassed++;
    }

    // 检查 2: 判断方向为 "act" 但认知负载极高 → 矛盾
    totalChecks++;
    const cognitiveLoad = agentPsych.cognitiveLoad?.load ?? 0;
    const direction = judgment.direction;
    if (direction === 'act' && cognitiveLoad > 0.8) {
      issues.push({
        type: 'act_with_high_cognitive_load',
        detail: `Direction is 'act' but cognitive load is ${cognitiveLoad}`,
      });
    } else {
      checksPassed++;
    }

    // 检查 3: identity drift 为 true 但稳定性高 → 矛盾
    totalChecks++;
    const identityDrift = agentPsych.identityDrift?.drifted;
    const stability = agentPsych.identityDrift?.stabilityScore ?? 0.7;
    if (identityDrift === true && stability > 0.7) {
      issues.push({
        type: 'identity_drift_stable_paradox',
        detail: `Identity drifted but stability score is ${stability}`,
      });
    } else {
      checksPassed++;
    }

    // 检查 4: 三毒/欲望水平高但 emotion pleasure 为正 → 矛盾
    totalChecks++;
    const dc = ctx.deepCognition || {};
    const threePoisons = dc.threePoisons;
    const desire = dc.desire;
    const pleasure = outputFromCtx(ctx, 'psychology', 'psych')?.emotion?.pleasure;
    if (threePoisons?.totalToxicity > 0.6 && pleasure && pleasure > 0.3) {
      issues.push({
        type: 'toxicity_pleasure_mismatch',
        detail: `Three poisons toxicity ${threePoisons.totalToxicity} but pleasure is ${pleasure}`,
      });
    } else {
      checksPassed++;
    }

    // 检查 5: 多个替代路径接近首选路径分数，但 confidence 很高 → 矛盾
    totalChecks++;
    const paths = judgment.paths || [];
    if (paths.length > 1 && confidence > 0.85) {
      const scores = paths.map(p => p.score || 0);
      const maxScore = Math.max(...scores);
      const secondScore = scores.filter(s => s !== maxScore).sort((a, b) => b - a)[0] || 0;
      const spread = maxScore - secondScore;
      if (spread < 0.1) {
        issues.push({
          type: 'close_paths_high_confidence',
          detail: `Paths are close (spread ${spread}) but confidence is ${confidence}`,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // 检查 6: 多数阶段失败却给出 "act" 方向 → 严重矛盾
    totalChecks++;
    const failedCount = stages.filter(s => !s.success).length;
    if (direction === 'act' && failedCount > totalChecks * 0.4) {
      issues.push({
        type: 'act_despite_many_failures',
        detail: `Direction 'act' but ${failedCount} of ${stages.length} stages failed`,
      });
    } else {
      checksPassed++;
    }

    const score = totalChecks > 0 ? checksPassed / totalChecks : 1.0;
    return { score: Math.max(0, Math.min(1, score)), issues };
  }

  /**
   * 置信度校准验证 — 检查 confidence 是否与证据强度匹配。
   */
  _checkConfidenceCalibration(ctx, output, stages) {
    const issues = [];
    let score = 1.0;
    const judgment = outputFromCtx(ctx, 'judgment') || output || {};
    const confidence = judgment.confidence ?? output.judgmentConfidence ?? 0.5;
    const paths = judgment.paths || [];

    // 信号 1: 无路径数据却给出非低置信度 → 校准差
    if (paths.length === 0 && confidence > 0.45) {
      issues.push({
        type: 'high_confidence_no_paths',
        detail: `Confidence ${confidence} but no alternative paths evaluated`,
      });
      score -= 0.3;
    }

    // 信号 1b: 极低置信度且无路径数据 → 无法支撑任何判断
    if (paths.length === 0 && confidence < 0.3) {
      issues.push({
        type: 'unsupported_low_confidence',
        detail: `Confidence ${confidence} with no path data — result is unsupported`,
      });
      score -= 0.25;
    }

    // 信号 2: 置信度与路径分散度不匹配
    if (paths.length >= 2) {
      const scores = paths.map(p => p.score || 0).filter(s => s > 0);
      if (scores.length >= 2) {
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const spread = maxScore - minScore;

        if (spread > 0.5 && confidence < 0.6) {
          issues.push({
            type: 'large_spread_low_confidence',
            detail: `Path scores spread ${spread.toFixed(2)} but confidence only ${confidence}`,
          });
          score -= 0.2;
        }

        if (spread < 0.1 && confidence > 0.8) {
          issues.push({
            type: 'small_spread_high_confidence',
            detail: `Path scores nearly tied (spread ${spread.toFixed(2)}) but confidence is ${confidence}`,
          });
          score -= 0.15;
        }
      }
    }

    // 信号 3: 置信度与 stage 成功率的偏差
    const stageSuccessRate = stages.filter(s => s.success).length / Math.max(1, stages.length);
    const calibrationError = Math.abs(confidence - stageSuccessRate);
    if (calibrationError > 0.25) {
      issues.push({
        type: 'calibration_error',
        detail: `Confidence ${confidence} vs stage success rate ${stageSuccessRate.toFixed(2)} (error: ${calibrationError.toFixed(2)})`,
      });
      score -= 0.25;
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      issues,
    };
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 加权平均计算。
   */
  _weightedAverage(scores, weights) {
    let total = 0;
    let weightSum = 0;
    for (const [key, score] of Object.entries(scores)) {
      const w = weights[key] ?? 0;
      total += score * w;
      weightSum += w;
    }
    return weightSum > 0 ? total / weightSum : 0;
  }

  /**
   * 记录一次评估到历史。
   */
  _recordAssessment(assessment) {
    this._history.push(assessment);
    if (this._history.length > this.maxHistorySize) {
      this._history = this._history.slice(-this.maxHistorySize);
    }

    this._stats.totalAssessments++;
    this._stats.qualityScoreSum += assessment.score;
    if (assessment.mode === 'fast') {
      this._stats.fastAssessments++;
    } else {
      this._stats.deepAssessments++;
    }

    // 更新阶段可靠性统计
    if (assessment.flaggedStages) {
      for (const stage of assessment.flaggedStages) {
        if (!this._stats.stageReliability[stage.id]) {
          this._stats.stageReliability[stage.id] = { calls: 0, anomalies: 0 };
        }
        this._stats.stageReliability[stage.id].anomalies++;
      }
    }
  }
}

/**
 * 从 pipeline ctx 中安全提取嵌套字段。
 */
function outputFromCtx(ctx, ...keys) {
  let current = ctx;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

module.exports = { MetacognitiveFeedback, VERSION };
