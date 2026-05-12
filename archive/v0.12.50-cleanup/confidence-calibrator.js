/**
 * HeartFlow 置信度校准器 v11.6.2
 *
 * "柔弱胜刚强" — 承认不确定性才是真正的力量
 *
 * 道论启示：水最柔弱，却能穿透最坚硬的东西。
 * 心虫不应该追求"绝对正确"的刚强，
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

    // 置信度阈值
    this.thresholds = {
      veryHigh: 0.85,   // "绝对正确"
      high: 0.70,       // "很可能"
      medium: 0.50,     // "可能"
      low: 0.30,        // "不太确定"
      veryLow: 0.15,    // "不知道"
    };

    // 语言映射：置信度 → 表达方式
    this.calibrationPhrases = {
      veryHigh: ['这是确定的', '这点很清楚'],
      high: ['很可能', '大概率', '根据现有信息判断'],
      medium: ['也许', '可能', '在某种程度上'],
      low: ['不确定', '我不太确定', '这需要进一步验证'],
      veryLow: ['我不知道', '这超出了我的判断范围', '这个问题我不确定'],
    };

    // 心虫不应该用的刚强词汇（置信度低于阈值时）
    this.forbiddenHighConfidence = [
      '绝对', '肯定', '毫无疑问', '100%', '必然',
      '必定', '无疑', '无可置疑', '不容置疑',
    ];

    this._load();
  }

  /**
   * 核心API：评估一段文本的置信度
   * @param {string} text - 待评估的文本
   * @param {object} context - { hasEvidence, queryType, domain, responseLength }
   * @returns {object} 置信度评估结果
   */
  assess(text = '', context = {}) {
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
    const calibrated = this.applyCalibration(confidence);

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

  applyCalibration(rawScore) {
    // 轻微向下校准（防止过度自信）
    // 原始分数高 → 向下调整一点
    // 原始分数低 → 保持或轻微向上
    if (rawScore > 0.8) {
      return Math.round((rawScore - 0.05) * 100) / 100;
    }
    return rawScore;
  }

  calibrateLanguage(text, level) {
    if (level === 'veryHigh' || level === 'high') return text;

    let calibrated = text;

    // 替换刚强词汇
    for (const word of this.forbiddenHighConfidence) {
      const regex = new RegExp(word, 'gi');
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

    // 如果过度自信率高，稍微调整阈值
    if (overconfident > recent.length * 0.3) {
      this.thresholds.veryHigh = Math.min(this.thresholds.veryHigh + 0.02, 0.95);
      this.thresholds.high = Math.min(this.thresholds.high + 0.02, 0.80);
    }

    if (underconfident > recent.length * 0.2) {
      this.thresholds.veryLow = Math.max(this.thresholds.veryLow - 0.02, 0.05);
    }
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
        version: '11.6.2',
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
      version: '11.6.2',
      records: this.records.length,
      weights: this.weights,
      thresholds: this.thresholds,
    };
  }
}

module.exports = { ConfidenceCalibrator };
