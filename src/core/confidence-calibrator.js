/**
 * HeartFlow 置信度校准器 v11.6.2
 *
 * "柔弱胜刚强" — 承认不确定性才是真正的力量
 *
 * 道论启示：水最柔弱，却能穿透最坚硬的东西。
 * 引擎不应该追求"绝对正确"的刚强，
 * 而应该表达"我可能错，但我在尽力"的柔韧。
 *
 * 核心思想来源：
 * - 柔弱胜刚强（《道德经》第78章）
 * - LLM Uncertainty Quantification (2024-2025)
 * - Confidence Calibration in Neural Networks
 * - Epistemic Humility in AI (2025)
 *
 * 功能：
 * 1. 置信度评估：判断答案的确定程度（0-1）
 * 2. 语言校准：根据置信度选择合适的表达方式
 * 3. 分布输出：不只给一个答案，给出置信度分布
 * 4. 校准学习：记录历史准确性，持续修正置信度
 */

const fs = require('fs');
const path = require('path');

// 转义正则特殊字符，防止 ReDoS
const _escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ConfidenceCalibrator {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || null;
    this.records = [];

    // 置信度评估的维度权重
    this.weights = {
      evidenceCoverage: options.evidenceCoverage || 0.25,
      consistency: options.consistency || 0.20,
      specificity: options.specificity || 0.15,
      sourceReliability: options.sourceReliability || 0.20,
      complexityFit: options.complexityFit || 0.20,
    };

    // [v5.11.0] 公式驱动的动态阈值基准（作为回退值保留）
    this._hardcodedThresholds = {
      veryHigh: 0.85,
      high: 0.70,
      medium: 0.50,
      low: 0.30,
      veryLow: 0.15,
    };

    // 置信度阈值（初始化为硬编码值，每次 calibrate 时由公式动态更新）
    this.thresholds = { ...this._hardcodedThresholds };

    // [v5.11.0] 临界性易感度追踪：监测阈值随时间的稳定性
    this._thresholdStability = {
      history: [],
      maxHistory: 50,
      driftCount: 0,
      lastStabilityCheck: null,
    };

    // 语言映射：置信度 → 表达方式
    this.calibrationPhrases = {
      veryHigh: ['这是确定的', '这点很清楚'],
      high: ['很可能', '大概率', '根据现有信息判断'],
      medium: ['也许', '可能', '在某种程度上'],
      low: ['不确定', '我不太确定', '这需要进一步验证'],
      veryLow: ['我不知道', '这超出了我的判断范围', '这个问题我不确定'],
    };

    // 引擎不应该用的刚强词汇（置信度低于阈值时）
    this.forbiddenHighConfidence = [
      '绝对', '肯定', '毫无疑问', '100%', '必然',
      '必定', '无疑', '无可置疑', '不容置疑',
    ];

    this._load();
    // [FORMULA] 公式桥接（交叉熵/KL散度校准），懒加载单例
    this._formulaBridge = null;
  }

  _getFormulaBridge() {
    if (!this._formulaBridge) {
      try {
        const { getFormulaBridge } = require('../formula/formula-bridge.js');
        this._formulaBridge = getFormulaBridge();
      } catch (e) {
        this._formulaBridge = null;
      }
    }
    return this._formulaBridge;
  }

  /**
   * 核心API：评估一段文本的置信度
   * @param {string} text - 待评估的文本
   * @param {object} context - { hasEvidence, queryType, domain, responseLength }
   * @returns {object} 置信度评估结果
   */
  assess(text = '', context = {}) {
    // [v5.11.0] 公式驱动的动态阈值：每次评估前更新
    try {
      const stats = {
        totalRecords: this.records.length,
        correctCount: this.records.filter(r => r.feedback === true).length,
        driftCount: this._thresholdStability.driftCount,
      };
      this.thresholds = this._computeDynamicThresholds(stats);
    } catch (e) { /* keep existing thresholds */ }

    const scores = {
      evidenceCoverage: this.scoreEvidenceCoverage(text, context),
      consistency: this.scoreConsistency(text),
      specificity: this.scoreSpecificity(text),
      sourceReliability: this.scoreSourceReliability(text, context),
      complexityFit: this.scoreComplexityFit(text, context),
    };

    // 加权计算总置信度
    const rawScore = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + score * (this.weights[key] || 0);
    }, 0);

    const confidence = Math.round(rawScore * 100) / 100;
    const level = this.scoreToLevel(confidence);
    const calibrated = this.applyCalibration(confidence, scores);

    // 修正语言：去除刚强词汇
    const calibratedText = this.calibrateLanguage(text, level);
    const forbiddenUsed = this.detectForbiddenWords(text, level);

    const result = {
      raw: confidence,
      level,
      calibrated,
      scores,
      languageAdjustment: calibratedText !== text,
      forbiddenWordsUsed: forbiddenUsed,
      suggestion: this.getSuggestion(level, scores),
      distribution: this.generateDistribution(confidence),
      calibrationPhrases: this.getCalibrationPhrases(level),
      // v3.6.1：置信度来源标注（基于 luoxuejian000 论文 6.2 节）
      // 区分结构字段置信度（evidenceCoverage, consistency 等）vs 语言特征不确定性
      provenance: {
        structural: {
          // 结构字段来源：证据覆盖、一致性、源可靠性——基于事实/逻辑的置信度
          sources: ['evidenceCoverage', 'consistency', 'sourceReliability'],
          score: (scores.evidenceCoverage * 0.25 + scores.consistency * 0.20 + scores.sourceReliability * 0.20) /
                 (0.25 + 0.20 + 0.20),
          description: '基于结构字段（证据/一致性/源可靠性）的结构化置信度',
        },
        linguistic: {
          // 语言特征来源：specificity, complexityFit——基于文本表达方式的置信度
          sources: ['specificity', 'complexityFit'],
          score: (scores.specificity * 0.15 + scores.complexityFit * 0.20) / (0.15 + 0.20),
          description: '基于语言特征（具体性/复杂度匹配）的语言置信度',
        },
        // 结构字段和语言特征可能不一致——高结构置信度+低语言置信度 = "知道但不擅表达"
        gap: Math.abs(
          (scores.evidenceCoverage * 0.25 + scores.consistency * 0.20 + scores.sourceReliability * 0.20) /
           (0.25 + 0.20 + 0.20) -
          (scores.specificity * 0.15 + scores.complexityFit * 0.20) / (0.15 + 0.20)
        ),
      },
    };

    return result;
  }

  /**
   * 校准一段文本：根据置信度调整表达
   */
  calibrate(text = '', context = {}) {
    const result = this.assess(text, context);

    if (!result.languageAdjustment && result.level !== 'veryLow') {
      return { text, adjusted: false, confidence: result };
    }

    return {
      text: this.calibrateLanguage(text, result.level),
      adjusted: true,
      confidence: result,
      note: result.level === 'veryLow'
        ? '置信度极低，建议用户查询权威来源'
        : '已根据置信度调整语言表达',
    };
  }

  /**
   * 记录反馈：用于持续校准
   * @param {string} text - 原文本
   * @param {boolean} wasCorrect - 用户反馈是否正确
   */
  recordFeedback(text = '', wasCorrect = null) {
    if (wasCorrect === null) return;

    this.records.push({
      text: text.slice(0, 200),
      calibrated: this.assess(text, {}),
      feedback: wasCorrect,
      ts: Date.now(),
    });

    // 保持最近100条
    if (this.records.length > 100) this.records.shift();

    // 持续校准：调整权重
    this.recalibrate();

    this._save();
  }

  /**
   * 生成置信度分布：不是给一个答案，而是给多个可能
   * 来源：概率推理
   */
  generateDistribution(baseConfidence) {
    const base = baseConfidence;
    const uncertainty = 1 - base;

    return {
      mostLikely: Math.round(base * 100) + '%',
      alternatives: [
        {
          scenario: '主流观点',
          confidence: Math.round(base * 100) + '%',
        },
        {
          scenario: '替代解释',
          confidence: Math.round((uncertainty * 0.6) * 100) + '%',
        },
        {
          scenario: '相反可能',
          confidence: Math.round((uncertainty * 0.3) * 100) + '%',
        },
        {
          scenario: '未知/其他',
          confidence: Math.round((uncertainty * 0.1) * 100) + '%',
        },
      ],
      note: '不确定时，给出概率分布而非单一答案',
    };
  }

  // ===== 评分维度 =====

  scoreEvidenceCoverage(text, context = {}) {
    // 有证据支撑 → 高置信度
    const hasEvidence = /证据|研究|数据|论文|来源|arXiv|调查显示|统计/.test(text);
    const hasCitation = /\[\d+\]|\(\d{4}\)|arXiv:/.test(text);
    const hasQualifier = /根据|来自|来自.*显示/.test(text);

    let score = 0.5;
    if (hasEvidence) score += 0.2;
    if (hasCitation) score += 0.15;
    if (hasQualifier) score += 0.1;
    if (context.hasEvidence) score += 0.15;

    return Math.min(score, 1.0);
  }

  scoreConsistency(text) {
    // 逻辑一致 → 高置信度
    // 检测自相矛盾
    const contradictions = [
      /但是.*然而/, /虽然.*但是.*仍然/,
      /既.*又.*矛盾/, /一方面.*另一方面.*不同/,
    ];

    let score = 0.8;
    for (const c of contradictions) {
      if (c.test(text)) score -= 0.15;
    }

    // 长度合理（不太短不太长）
    const words = text.split(/\s+/).length;
    if (words < 10) score -= 0.2;
    if (words > 2000) score -= 0.1;

    return Math.max(score, 0.1);
  }

  scoreSpecificity(text) {
    // 具体 → 高置信度；模糊 → 低置信度
    const vagueWords = /可能|也许|大概|似乎|好像|说不定/.test(text);
    const specificWords = /具体|明确|数据显示|是.*而不是.*是|具体来说/.test(text);
    const numberMatch = text.match(/\d+/g);

    let score = 0.5;
    if (vagueWords) score -= 0.1;
    if (specificWords) score += 0.2;
    if (numberMatch && numberMatch.length > 0) score += 0.15;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  scoreSourceReliability(text, context = {}) {
    // 有可靠来源 → 高置信度
    const reliableSources = /arXiv|论文|学术|研究机构|官方|权威/.test(text);
    const unreliableSources = /据说|传闻|网传|有人说|不明来源/.test(text);

    let score = 0.5;
    if (reliableSources) score += 0.3;
    if (unreliableSources) score -= 0.3;
    if (context.domain === 'technical') score += 0.15;
    if (context.domain === 'opinion') score -= 0.1;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  scoreComplexityFit(text, context = {}) {
    // 问题复杂度与答案复杂度匹配
    const queryComplexity = context.queryComplexity || 0.5;
    const answerComplexity = text.split(/[。.;!?]/).filter(s => s.trim().length > 10).length;
    const optimalLength = Math.max(queryComplexity * 10, 2);

    let score = 0.5;
    const ratio = answerComplexity / optimalLength;
    if (ratio > 0.7 && ratio < 2.0) score += 0.3;
    else if (ratio < 0.3) score -= 0.2;
    else if (ratio > 3.0) score -= 0.15;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  // ===== 辅助方法 =====

  scoreToLevel(score) {
    if (score >= this.thresholds.veryHigh) return 'veryHigh';
    if (score >= this.thresholds.high) return 'high';
    if (score >= this.thresholds.medium) return 'medium';
    if (score >= this.thresholds.low) return 'low';
    return 'veryLow';
  }

  /**
   * [v5.11.0] 公式驱动的动态阈值计算
   * 使用 Dirichlet 置信度 + 精确度权重 + 临界性易感度来动态调整阈值，
   * 70% 公式驱动 + 30% 硬编码回退。
   * @param {object} stats - 校准统计 { totalRecords, correctCount, recentAccuracy }
   * @returns {object} 动态阈值
   */
  _computeDynamicThresholds(stats = {}) {
    try {
      const bridge = this._getFormulaBridge();
      if (!bridge) return { ...this._hardcodedThresholds };

      // 1. Dirichlet 置信度：用伪计数构建证据分布
      const totalRecords = stats.totalRecords || this.records.length || 1;
      const correctCount = stats.correctCount || this.records.filter(r => r.feedback === true).length;
      const incorrectCount = Math.max(0, totalRecords - correctCount);
      // 构建证据伪计数：正确、不正确、未标记
      const evidenceCounts = [
        Math.max(0.1, correctCount),
        Math.max(0.1, incorrectCount),
        Math.max(0.1, totalRecords * 0.1), // 未标记/模糊
      ];
      const dc = bridge.dirichletConfidence(evidenceCounts, 1, 0.5);
      const baselineConfidence = dc && dc.confidence !== undefined ? dc.confidence : 0.5;

      // 2. 精确度权重：基于证据一致性调整阈值灵敏度
      const consistencySigma = stats.consistencySigma || 0.3;
      const pw = bridge.precisionWeight(consistencySigma);
      const sensitivity = Math.min(1, Math.max(0.1, pw / 10)); // 归一化到 [0.1, 1]

      // 3. 临界性易感度：高易感度 → 阈值更保守（降低 veryHigh, 提高 low）
      const chi = bridge.criticalitySusceptibility
        ? bridge.criticalitySusceptibility(1 + (stats.driftCount || 0) * 0.1)
        : 1;
      const criticalityFactor = Math.min(1, Math.max(0.5, chi));

      // 4. 公式驱动的阈值（70%）+ 硬编码（30%）
      const formulaThresholds = {
        veryHigh: 0.85 * (0.7 * baselineConfidence + 0.3),
        high:     0.70 * (0.7 * baselineConfidence + 0.3),
        medium:   0.50 * (0.7 * (1 - sensitivity * 0.3) + 0.3),
        low:      0.30 * (0.7 * sensitivity + 0.3),
        veryLow:  0.15 * (0.7 * sensitivity * 0.8 + 0.3),
      };

      // 临界性修正：高易感度 → 降低高阈值、提高低阈值（更保守）
      if (criticalityFactor < 0.8) {
        formulaThresholds.veryHigh *= 1.05;
        formulaThresholds.high *= 1.03;
        formulaThresholds.low *= 0.95;
      }

      // 与硬编码值 70/30 混合
      return {
        veryHigh: +(formulaThresholds.veryHigh * 0.7 + this._hardcodedThresholds.veryHigh * 0.3).toFixed(4),
        high:     +(formulaThresholds.high * 0.7 + this._hardcodedThresholds.high * 0.3).toFixed(4),
        medium:   +(formulaThresholds.medium * 0.7 + this._hardcodedThresholds.medium * 0.3).toFixed(4),
        low:      +(formulaThresholds.low * 0.7 + this._hardcodedThresholds.low * 0.3).toFixed(4),
        veryLow:  +(formulaThresholds.veryLow * 0.7 + this._hardcodedThresholds.veryLow * 0.3).toFixed(4),
      };
    } catch (e) {
      return { ...this._hardcodedThresholds };
    }
  }

  applyCalibration(rawScore, scores = {}) {
    // [FORMULA v8.15.0] Dirichlet 证据累积停止规则 (arXiv:2605.26147)
    // 用评分维度作为伪计数，构建 Dirichlet 分布置信度
    // 高证据一致性 → 低熵 → 高置信度；分散证据 → 高熵 → 应降低置信
    try {
      const bridge = this._getFormulaBridge();
      if (bridge && scores) {
        const evidenceCounts = [
          scores.evidenceCoverage || 0.5,
          scores.consistency || 0.5,
          scores.specificity || 0.5,
          scores.sourceReliability || 0.5,
          scores.complexityFit || 0.5
        ].map(s => Math.max(0.1, s * 5)); // scale to pseudo-counts
        const dc = bridge.dirichletConfidence(evidenceCounts, 1, 0.5);
        if (dc && dc.confidence !== undefined) {
          // Blend: dirichlet confidence provides theoretical upper bound,
          // raw score provides empirical signal
          return Math.round((rawScore * 0.7 + dc.confidence * 0.3) * 100) / 100;
        }
      }
    } catch (e) { /* fallback to legacy calibration */ }

    // [v5.11.0] 公式驱动的向下校准：使用 bayesFactor 或 logLoss 代替固定 0.05
    // 原始分数高 → 用贝叶斯证据因子或对数损失来精确计算调整幅度
    if (rawScore > 0.8) {
      try {
        const bridge = this._getFormulaBridge();
        if (bridge) {
          // 使用 logLoss 计算过度自信惩罚
          // p_predicted = rawScore, p_actual = feedback 历史准确率
          const withFeedback = this.records.filter(r => r.feedback !== null);
          let actualAccuracy = 0.5; // default if no feedback
          if (withFeedback.length > 0) {
            const correct = withFeedback.filter(r => r.feedback === true).length;
            actualAccuracy = correct / withFeedback.length;
          }
          // logLoss: 高预测+低实际 → 高惩罚
          const loss = bridge.logLoss(rawScore, actualAccuracy > 0.5 ? 1 : 0);
          // 将 logLoss 映射为调整幅度：[0, ~5] → [0.01, 0.15]
          const adjustment = Math.min(0.15, Math.max(0.01, loss * 0.03));
          return Math.round((rawScore - adjustment) * 100) / 100;
        }
      } catch (e) { /* fallback */ }
      return Math.round((rawScore - 0.05) * 100) / 100;
    }
    return rawScore;
  }

  calibrateLanguage(text, level) {
    if (level === 'veryHigh' || level === 'high') return text;

    let calibrated = text;

    // 替换刚强词汇
    for (const word of this.forbiddenHighConfidence) {
      const regex = new RegExp(_escapeRegex(word), 'gi');
      calibrated = calibrated.replace(regex, this.getReplacement(level));
    }

    // 添加校准短语（如果文本太短不添加）
    if (text.length > 50 && (level === 'low' || level === 'veryLow')) {
      const phrases = this.getCalibrationPhrases(level);
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      if (!calibrated.includes(phrase)) {
        calibrated = calibrated.trim() + '（' + phrase + '）';
      }
    }

    return calibrated;
  }

  getReplacement(level) {
    const replacements = {
      veryHigh: '确定',
      high: '很可能',
      medium: '可能',
      low: '不确定是',
      veryLow: '不知道是否',
    };
    return replacements[level] || '可能';
  }

  detectForbiddenWords(text, level) {
    if (level === 'veryHigh' || level === 'high') return [];
    return this.forbiddenHighConfidence.filter(w => text.includes(w));
  }

  getSuggestion(level, scores) {
    if (level === 'veryLow') {
      return '建议用户查询权威来源，或明确告知"不知道"';
    }
    if (level === 'low') {
      return '建议在回答末尾加上不确定性说明';
    }
    if (level === 'medium') {
      return '建议表达为"可能"而非"是"，提供多角度分析';
    }
    if (scores.evidenceCoverage < 0.5) {
      return '建议补充证据或说明来源';
    }
    return '置信度较高，保持当前表达';
  }

  getCalibrationPhrases(level) {
    return this.calibrationPhrases[level] || this.calibrationPhrases.medium;
  }

  recalibrate() {
    if (this.records.length < 5) return;

    // 简单的持续校准
    const recent = this.records.slice(-20);
    let overconfident = 0;
    let underconfident = 0;

    for (const r of recent) {
      if (r.feedback === false && r.calibrated.level !== 'veryLow' && r.calibrated.level !== 'low') {
        overconfident++;
      }
      if (r.feedback === true && r.calibrated.level === 'veryLow') {
        underconfident++;
      }
    }

    // [v5.11.0] 用 weightedAccuracy 驱动阈值调整
    try {
      const bridge = this._getFormulaBridge();
      if (bridge && recent.length > 0) {
        const decisions = recent.map(r => ({ correct: r.feedback === true }));
        const wa = bridge.weightedAccuracy(decisions, 0.3);
        const weightedAcc = wa.weightedAccuracy;

        // 基于加权准确率调整阈值：准确率低 → 提高阈值（更保守），准确率高 → 保持
        const accFactor = weightedAcc < 0.5 ? 0.04 : weightedAcc < 0.7 ? 0.02 : 0;
        if (accFactor > 0) {
          this.thresholds.veryHigh = Math.min(this.thresholds.veryHigh + accFactor, 0.95);
          this.thresholds.high = Math.min(this.thresholds.high + accFactor * 0.8, 0.82);
        }

        // 临界性易感度追踪
        this._trackThresholdStability();
      }
    } catch (e) { /* fallback to simple adjustments */ }

    // 如果过度自信率高，稍微调整阈值（回退逻辑）
    if (overconfident > recent.length * 0.3) {
      this.thresholds.veryHigh = Math.min(this.thresholds.veryHigh + 0.02, 0.95);
      this.thresholds.high = Math.min(this.thresholds.high + 0.02, 0.80);
    }

    if (underconfident > recent.length * 0.2) {
      this.thresholds.veryLow = Math.max(this.thresholds.veryLow - 0.02, 0.05);
    }
  }

  /**
   * [v5.11.0] 基于反馈更新阈值 — 公开 API（原名 updateFromFeedback）
   * 使用 weightedAccuracy 公式来智能调整校准阈值
   * @param {boolean} wasCorrect - 反馈是否正确
   * @param {object} [context] - 校准上下文
   */
  updateFromFeedback(wasCorrect, context = {}) {
    if (wasCorrect === null || wasCorrect === undefined) return;

    // 记录反馈
    this.records.push({
      text: (context.text || '').slice(0, 200),
      calibrated: context.calibrated || { calibrated: 0.5, level: 'medium' },
      feedback: wasCorrect,
      ts: Date.now(),
    });
    if (this.records.length > 100) this.records.shift();

    // 用公式驱动更新阈值
    this.recalibrate();
    this._save();
  }

  /**
   * [v5.11.0] 临界性易感度追踪：监测阈值随时间的漂移
   */
  _trackThresholdStability() {
    const now = Date.now();
    const snap = {
      ts: now,
      thresholds: { ...this.thresholds },
    };

    this._thresholdStability.history.push(snap);
    if (this._thresholdStability.history.length > this._thresholdStability.maxHistory) {
      this._thresholdStability.history.shift();
    }

    // 每 10 次检查一次漂移
    if (this._thresholdStability.history.length % 10 === 0) {
      this._thresholdStability.lastStabilityCheck = now;
      const history = this._thresholdStability.history;
      if (history.length >= 10) {
        const first = history[0].thresholds;
        const last = history[history.length - 1].thresholds;
        const drift = Math.abs(last.veryHigh - first.veryHigh) +
                     Math.abs(last.high - first.high) +
                     Math.abs(last.medium - first.medium);
        if (drift > 0.15) {
          this._thresholdStability.driftCount++;
        }
      }
    }
  }

  /**
   * [v5.11.0] 获取阈值稳定性报告
   */
  getThresholdStability() {
    return {
      historyLength: this._thresholdStability.history.length,
      driftCount: this._thresholdStability.driftCount,
      lastCheck: this._thresholdStability.lastStabilityCheck,
      current: { ...this.thresholds },
      baseline: { ...this._hardcodedThresholds },
    };
  }

  /**
   * 计算校准误差：已记录的预测中，声明置信度与实际准确率的绝对差值的平均值
   * @returns {number|null} 校准误差（0-1），无数据时返回 null
   * @private
   */
  _computeCalibrationError() {
    const withFeedback = this.records.filter(r => r.feedback !== null);
    if (withFeedback.length === 0) return null;

    const bridge = this._getFormulaBridge();
    let totalAbsError = 0;
    let totalLogLoss = 0;
    for (const r of withFeedback) {
      // 使用校准后的置信度（即向用户展示的置信度）作为 stated confidence
      const stated = r.calibrated.calibrated;
      // 实际准确率：1 = 正确, 0 = 错误
      const actual = r.feedback ? 1 : 0;
      totalAbsError += Math.abs(stated - actual);
      // [FORMULA] 二值交叉熵（对数损失）：比绝对差更敏感地惩罚过度自信
      // 公式引自心虫公式库 cross_entropy: H = -Σ p(x)·log q(x)
      if (bridge) totalLogLoss += bridge.logLoss(stated, actual);
    }

    const absError = Math.round((totalAbsError / withFeedback.length) * 1000) / 1000;
    const logLoss = bridge ? Math.round((totalLogLoss / withFeedback.length) * 1000) / 1000 : null;
    return { absError, logLoss };
  }

  /**
   * 公开API：获取校准误差
   * @returns {object} 包含误差值和样本量的结果
   */
  getCalibrationError() {
    const error = this._computeCalibrationError();
    const absError = error ? error.absError : null;
    const logLoss = error ? error.logLoss : null;
    return {
      error: absError,
      logLoss,
      samples: this.records.filter(r => r.feedback !== null).length,
      interpretation: absError === null
        ? '尚无反馈数据，无法计算校准误差'
        : absError < 0.1
          ? '校准优秀：置信度与实际准确率高度吻合'
          : absError < 0.25
            ? '校准良好：存在轻微过度自信或保守倾向'
            : absError < 0.40
              ? '校准一般：置信度表达与实际结果存在明显偏差'
              : '校准较差：建议检查评分维度和阈值设置',
    };
  }

  // ===== 持久化 =====

  _save() {
    if (!this.memoryPath) return;
    try {
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.memoryPath, JSON.stringify({
        records: this.records.slice(-50),
        weights: this.weights,
        thresholds: this.thresholds,
        version: '1.5.3',
      }, null, 2));
    } catch (e) {
      // 忽略
    }
  }

  _load() {
    if (!this.memoryPath) return;
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf-8'));
        if (data.records) this.records = data.records;
        if (data.weights) this.weights = { ...this.weights, ...data.weights };
        if (data.thresholds) this.thresholds = { ...this.thresholds, ...data.thresholds };
      }
    } catch (e) {
      // 忽略
    }
  }

  // ===== 信息API =====

  stats() {
    return {
      version: '1.5.3',
      records: this.records.length,
      weights: this.weights,
      thresholds: this.thresholds,
    };
  }
}

module.exports = { ConfidenceCalibrator };