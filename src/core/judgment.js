/**
 * HeartFlow MetaJudgment v1.0.0
 * 
 * The ability to judge the quality of its own judgments.
 * Assesses reasoning soundness, evidence quality, assumption validity,
 * contradiction checks, and uncertainty admission.
 * 
 * Tracks judgment history and computes reliability scores based on
 * the accuracy of past confidence claims after 5+ judgments.
 * 
 * Integrates with: MeaningfulMemory
 */

const fs = require('fs');
const { atomicWrite } = require('../utils/atomic-write');
const path = require('path');
const crypto = require('crypto');

// Graceful dependency loading with fallbacks
let MeaningfulMemory = null;

try {
  const MM = require('../memory/memory-adapter.js');
  MeaningfulMemory = MM.MeaningfulMemory;
} catch (e) {
  // MeaningfulMemory not available
}

const DATA_DIR = path.join(__dirname, '../../data');
const JUDGMENT_HISTORY_PATH = path.join(DATA_DIR, 'judgment-history.json');
const MIN_JUDGMENTS_FOR_RELIABILITY = 5;

/**
 * MetaJudgment assesses the quality of reasoning/judgment calls
 */
class MetaJudgment {
  constructor(options = {}) {
    this.vectorDim = options.vectorDim || 384;
    this.history = [];
    this.confidenceClaims = []; // { claimId, claimedConfidence, actualOutcome, timestamp }
    this.currentSessionJudgments = 0;
    this._loadHistory();
  }

  // ─────────────────────────────────────────
  // CORE API
  // ─────────────────────────────────────────

  /**
   * Assess a judgment/decision outcome and rate it across multiple dimensions
   * @param {object} judgmentResult - { judgment, outcome?, confidence?, reasoning?, evidence?, assumptions?, contradictions?, metadata? }
   * @returns {object} assessment with scores and overall rating
   */
  assessJudgment(judgmentResult = {}) {
    const id = `judg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = Date.now();

    // Extract components for rating
    const reasoning = judgmentResult.reasoning || judgmentResult.judgment || '';
    const evidence = judgmentResult.evidence || [];
    const assumptions = judgmentResult.assumptions || [];
    const contradictions = judgmentResult.contradictions || [];
    const outcome = judgmentResult.outcome; // undefined = not yet known
    const claimedConfidence = typeof judgmentResult.confidence === 'number' 
      ? judgmentResult.confidence 
      : 0.5;

    // Rate each dimension 1-10
    const soundness = this._rateSoundness(reasoning, evidence);
    const evidenceQuality = this._rateEvidenceQuality(evidence, reasoning);
    const assumptionValidity = this._rateAssumptionValidity(assumptions, reasoning);
    const contradictionCheck = this._rateContradictionCheck(contradictions, reasoning);
    const uncertaintyAdmission = this._rateUncertaintyAdmission(reasoning, claimedConfidence);

    // Weighted overall score (1-10)
    const overallScore = Math.round(
      (soundness * 0.25) +
      (evidenceQuality * 0.30) +
      (assumptionValidity * 0.20) +
      (contradictionCheck * 0.15) +
      (uncertaintyAdmission * 0.10)
    );

    // Confidence calibration: how well did claimed confidence match reality?
    const confidenceCalibration = this._computeConfidenceCalibration(
      claimedConfidence, 
      overallScore / 10
    );

    const record = {
      id,
      timestamp,
      reasoning: reasoning.slice(0, 500),
      evidenceCount: Array.isArray(evidence) ? evidence.length : 0,
      assumptionCount: Array.isArray(assumptions) ? assumptions.length : 0,
      contradictionCount: Array.isArray(contradictions) ? contradictions.length : 0,
      claimedConfidence,
      outcome,
      ratings: {
        soundness,
        evidence_quality: evidenceQuality,
        assumption_validity: assumptionValidity,
        contradiction_check: contradictionCheck,
        uncertainty_admission: uncertaintyAdmission,
        overall: overallScore
      },
      confidenceCalibration,
      metadata: judgmentResult.metadata || {}
    };

    // If outcome is known, update confidence calibration
    if (outcome !== undefined) {
      this._recordConfidenceOutcome(id, claimedConfidence, outcome);
      record.outcomeRecorded = true;
    }

    this.history.push(record);
    this.currentSessionJudgments++;
    this._autoSave();

    return {
      id,
      ratings: record.ratings,
      confidenceCalibration,
      overallScore,
      insights: this._generateInsights(record),
      history: this.getJudgmentHistory()
    };
  }

  /**
   * Get current confidence metrics including reliability score
   * @returns {object} confidence and reliability metrics
   */
  getConfidence() {
    const totalJudgments = this.history.length;
    const recentJudgments = this.history.slice(-10);
    
    // Average ratings over recent judgments
    const avgRatings = this._computeAverageRatings(recentJudgments);
    
    // Reliability score based on confidence calibration
    const reliabilityScore = this._computeReliabilityScore();
    
    // Confidence trend
    const trend = this._computeTrend();
    
    return {
      totalJudgments,
      sessionJudgments: this.currentSessionJudgments,
      avgRatings,
      reliabilityScore,
      trend,
      calibrationAccuracy: this._getCalibrationAccuracy(),
      isReliable: reliabilityScore >= 0.7 || totalJudgments < MIN_JUDGMENTS_FOR_RELIABILITY
    };
  }

  /**
   * Get full judgment history
   * @param {number} limit - max number of records to return
   * @returns {array} judgment history
   */
  getJudgmentHistory(limit = 50) {
    const history = this.history.slice(-limit);
    return history.map(j => ({
      id: j.id,
      timestamp: j.timestamp,
      reasoning: j.reasoning.slice(0, 100) + (j.reasoning.length > 100 ? '...' : ''),
      ratings: j.ratings,
      claimedConfidence: j.claimedConfidence,
      outcome: j.outcome,
      overallScore: j.ratings.overall
    }));
  }

  // ─────────────────────────────────────────
  // DIMENSION RATERS (1-10 scale)
  // ─────────────────────────────────────────

  _rateSoundness(reasoning, evidence) {
    if (!reasoning) return 3;
    
    let score = 5; // baseline
    
    // Positive indicators
    const hasLogicalConnectors = /因为|所以|因此|然而|但是|如果|则/.test(reasoning);
    const hasMultiplePoints = (reasoning.match(/[，。；]/g) || []).length >= 2;
    const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
    
    // Negative indicators
    const hasOverclaiming = /绝对|一定|必然|肯定|毫无疑问/.test(reasoning);
    const hasHedging = /可能|也许|大概/.test(reasoning) && !/虽然|但是|然而/.test(reasoning);
    const isCircular = /所以因为|因为所以/.test(reasoning);
    
    if (hasLogicalConnectors) score += 1;
    if (hasMultiplePoints) score += 1;
    if (hasEvidence) score += 2;
    if (hasOverclaiming) score -= 2;
    if (hasHedging && !hasEvidence) score -= 1;
    if (isCircular) score -= 3;
    
    return Math.max(1, Math.min(10, score));
  }

  _rateEvidenceQuality(evidence, reasoning) {
    if (!Array.isArray(evidence) || evidence.length === 0) {
      // Check if reasoning itself provides implicit evidence
      if (reasoning && /数据|研究|实验|统计|事实/.test(reasoning)) {
        return 5;
      }
      return 3;
    }
    
    let score = 5;
    
    // Quality indicators
    const hasQuantitative = evidence.some(e => 
      String(e).match(/\d+[.%]?\d*%?/) || 
      String(e).match(/[0-9]+/)
    );
    const hasSources = evidence.some(e => 
      String(e).match(/来源|据|研究|表明|显示/)
    );
    const hasSpecifics = evidence.some(e => String(e).length > 50);
    
    if (hasQuantitative) score += 2;
    if (hasSources) score += 2;
    if (hasSpecifics) score += 1;
    
    // Penalize vague evidence
    const vagueCount = evidence.filter(e => 
      String(e).length < 20 || 
      /不知道|不清楚|可能/.test(String(e))
    ).length;
    
    score -= vagueCount * 0.5;
    
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  _rateAssumptionValidity(assumptions, reasoning) {
    if (!Array.isArray(assumptions) || assumptions.length === 0) {
      // No explicit assumptions - check for implicit ones in reasoning
      const hasImplicitAssumptions = /假设|假定|认为|觉得|想必/.test(reasoning);
      return hasImplicitAssumptions ? 5 : 7;
    }
    
    let score = 6; // baseline for having explicit assumptions
    
    const stated = assumptions.filter(a => String(a).length > 10).length;
    const checked = assumptions.filter(a => 
      String(a).includes('已验证') || 
      String(a).includes('确认') ||
      String(a).includes('核实')
    ).length;
    
    // Reward explicit, checked assumptions
    score += Math.min(2, stated * 0.3);
    score += Math.min(3, checked);
    
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  _rateContradictionCheck(contradictions, reasoning) {
    if (!reasoning) return 4;
    
    // Has the reasoning explicitly checked for contradictions?
    const mentionsContradiction = /矛盾|冲突|相反|不对|但是/.test(reasoning);
    const hasAlternativeViews = /但是|然而|不过|可是/.test(reasoning);
    
    if (Array.isArray(contradictions) && contradictions.length > 0) {
      // Found and listed contradictions - good!
      return 8;
    }
    
    let score = 5;
    if (mentionsContradiction) score += 2;
    if (hasAlternativeViews) score += 1;
    
    return Math.max(1, Math.min(10, score));
  }

  _rateUncertaintyAdmission(reasoning, claimedConfidence) {
    if (!reasoning) return 4;
    
    const mentionsUncertainty = /不确定|可能|也许|不确定|存疑|待验证/.test(reasoning);
    const hasHighConfidence = claimedConfidence > 0.8;
    const hasLowConfidence = claimedConfidence < 0.5;
    
    let score = 5;
    
    // Good: admits uncertainty when confidence is low
    if (mentionsUncertainty && hasLowConfidence) score += 3;
    
    // Good: does NOT overclaim when confidence is low
    if (!mentionsUncertainty && hasLowConfidence) score += 2;
    
    // Bad: claims high confidence without acknowledging uncertainty
    if (hasHighConfidence && !mentionsUncertainty) score -= 2;
    
    // Bad: admits uncertainty but claims high confidence
    if (mentionsUncertainty && hasHighConfidence) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  // ─────────────────────────────────────────
  // CONFIDENCE CALIBRATION
  // ─────────────────────────────────────────

  _recordConfidenceOutcome(claimId, claimedConfidence, actualOutcome) {
    this.confidenceClaims.push({
      claimId,
      claimedConfidence,
      actualOutcome: typeof actualOutcome === 'number' ? actualOutcome : (actualOutcome ? 1 : 0),
      timestamp: Date.now()
    });
  }

  _computeConfidenceCalibration(claimed, actual) {
    // Calibration error (lower is better)
    const error = Math.abs(claimed - actual);
    const score = Math.round((1 - error) * 10);
    return {
      claimed,
      actual,
      error: Math.round(error * 100) / 100,
      score: Math.max(1, Math.min(10, score))
    };
  }

  _getCalibrationAccuracy() {
    if (this.confidenceClaims.length < 3) return null;
    
    const recent = this.confidenceClaims.slice(-20);
    const errors = recent.map(c => Math.abs(c.claimedConfidence - c.actualOutcome));
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    
    return {
      accuracy: Math.round((1 - avgError) * 100),
      avgError: Math.round(avgError * 100) / 100,
      sampleSize: recent.length
    };
  }

  _computeReliabilityScore() {
    if (this.history.length < MIN_JUDGMENTS_FOR_RELIABILITY) {
      return null; // Not enough data
    }
    
    // Look at past judgments where outcome is known
    const judgmentsWithOutcome = this.history.filter(j => j.outcome !== undefined);
    
    if (judgmentsWithOutcome.length < MIN_JUDGMENTS_FOR_RELIABILITY) {
      return null;
    }
    
    // Compare claimed confidence to actual accuracy
    let totalAccuracy = 0;
    let count = 0;
    
    for (const j of judgmentsWithOutcome.slice(-20)) {
      const outcomeValue = j.outcome ? 1 : 0;
      const predictedValue = j.claimedConfidence > 0.5 ? 1 : 0;
      const isCorrect = predictedValue === outcomeValue;
      
      // Weight by how confident we were (more confident correct = higher score)
      const confidenceWeight = Math.abs(j.claimedConfidence - 0.5) * 2;
      totalAccuracy += isCorrect ? confidenceWeight : 0;
      count += confidenceWeight;
    }
    
    const reliability = count > 0 ? totalAccuracy / count : 0.5;
    
    // Also factor in calibration accuracy
    const calibration = this._getCalibrationAccuracy();
    const calibrationBonus = calibration ? (1 - calibration.avgError) * 0.2 : 0;
    
    return Math.round((reliability + calibrationBonus) * 100) / 100;
  }

  // ─────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────

  _computeAverageRatings(judgments) {
    if (judgments.length === 0) return null;
    
    const sums = { soundness: 0, evidence_quality: 0, assumption_validity: 0, 
                   contradiction_check: 0, uncertainty_admission: 0, overall: 0 };
    let count = 0;
    
    for (const j of judgments) {
      if (j.ratings) {
        for (const key of Object.keys(sums)) {
          sums[key] += j.ratings[key] || 0;
        }
        count++;
      }
    }
    
    if (count === 0) return null;
    
    const avg = {};
    for (const key of Object.keys(sums)) {
      avg[key] = Math.round((sums[key] / count) * 10) / 10;
    }
    return avg;
  }

  _computeTrend() {
    if (this.history.length < 6) return 'insufficient_data';
    
    const recent = this.history.slice(-10);
    const older = this.history.slice(-20, -10);
    
    if (older.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((sum, j) => sum + j.ratings.overall, 0) / recent.length;
    const olderAvg = older.reduce((sum, j) => sum + j.ratings.overall, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  _generateInsights(record) {
    const insights = [];
    
    if (record.ratings.evidence_quality < 5) {
      insights.push('证据质量偏低，建议补充具体数据或来源');
    }
    if (record.ratings.assumption_validity < 5) {
      insights.push('假设未被明确陈述或验证，考虑列出关键假设');
    }
    if (record.ratings.contradiction_check < 5) {
      insights.push('缺乏对矛盾观点的检查，考虑添加反事实思考');
    }
    if (record.confidenceCalibration.score < 5) {
      insights.push(`置信度校准偏差较大（误差${record.confidenceCalibration.error}），需更谨慎`);
    }
    
    return insights;
  }

  // ─────────────────────────────────────────
  // PERSISTENCE
  // ─────────────────────────────────────────

  _loadHistory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(JUDGMENT_HISTORY_PATH)) {
        const raw = fs.readFileSync(JUDGMENT_HISTORY_PATH, 'utf-8');
        const data = JSON.parse(raw);
        // 安全修复：验证数据结构
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid judgment history format');
        }
        this.history = Array.isArray(data.history) ? data.history : [];
        this.confidenceClaims = Array.isArray(data.confidenceClaims) ? data.confidenceClaims : [];
        console.log(`[MetaJudgment] 恢复 ${this.history.length} 条判断记录`);
      }
    } catch (e) {
      // 安全修复：使用错误级别日志
      console.error('[MetaJudgment] 历史恢复失败:', e.message);
    }
  }

  _autoSave() {
    // Debounced save
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._doSave(), 2000);
  }

  async _doSave() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      await atomicWrite(JUDGMENT_HISTORY_PATH, JSON.stringify({
        history: this.history,
        confidenceClaims: this.confidenceClaims,
        savedAt: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      // 安全修复：使用错误级别日志
      console.error('[MetaJudgment] 保存失败:', e.message);
    }
  }

  // ─────────────────────────────────────────
  // INTEGRATION HELPERS
  // ─────────────────────────────────────────

  /**
   * Get judgments related to a specific topic via MeaningfulMemory
   */
  getRelatedJudgments(topic, limit = 5) {
    if (!MeaningfulMemory) return [];
    
    try {
      // This would search memory for related judgment context
      // Implementation depends on having an instance
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Record a judgment outcome for reliability tracking
   */
  recordOutcome(judgmentId, outcome) {
    const record = this.history.find(j => j.id === judgmentId);
    if (record) {
      record.outcome = outcome;
      record.outcomeRecordedAt = Date.now();
      this._recordConfidenceOutcome(judgmentId, record.claimedConfidence, outcome);
      this._autoSave();
    }
  }
}

module.exports = { MetaJudgment };
