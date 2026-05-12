/**
 * HeartFlow 不确定性量化引擎 v11.14.0
 * 
 * 基于 GitHub 研究:
 * - cvs-health/uqlm (UQLM, 1.1k星) - LLM不确定性量化
 * - noahshinn/reflexion (3.1k星) - 语言agentsverbal强化学习
 * 
 * 核心概念:
 * 1. 认知不确定性 (Epistemic): "我不知道什么" — 可通过获取更多知识减少
 * 2. 随机不确定性 (Aleatoric): "这个问题本身是随机的" — 不可减少
 * 3. 幻觉信号: 检测输出中可能的幻觉
 * 4. 置信度校准: 输出置信度与实际准确率匹配
 */

class UncertaintyQuantifier {
  constructor(config = {}) {
    this.records = [];
    this.calibrationHistory = [];
    
    // 幻觉检测关键词
    this.hallucinationSignals = {
      // 过度确定性信号
      overCertainty: [
        '绝对', '肯定', '100%', '毫无疑问', '毫无疑问地',
        '必定', '必然', '绝对正确', '完全可以'
      ],
      // 具体细节过多（可能是编造的）
      excessiveSpecificity: [
        '具体来说', '根据记录', '数据显示', '研究表明',
        'according to', 'as stated', 'the data shows'
      ],
      // 引用不存在的来源
      fakeCitations: [
        '引用自', '来自', 'according to', 'as reported by',
        '研究表明', '专家表示', '数据显示'
      ],
      // 模糊引用
      vagueAttribution: [
        '有人说', '有人认为', '很多人说', '大家都知道',
        'it is known that', 'it is believed that', 'experts say'
      ]
    };
    
    // 领域敏感词（在这些领域需要更保守的置信度）
    this.highRiskDomains = {
      '医疗': 0.2,
      '法律': 0.2,
      '金融': 0.2,
      '安全': 0.15,
      '政治': 0.15,
      '科学': 0.1,
      '技术': 0.05
    };
    
    this.stats = {
      totalEvaluations: 0,
      hallucinationDetected: 0,
      calibrationErrors: []
    };
  }

  /**
   * 评估文本的不确定性
   * @param {string} text - 待评估文本
   * @param {Object} context - 上下文 { domain, hasEvidence, multiSource }
   * @returns {Object} 不确定性评估结果
   */
  evaluate(text, context = {}) {
    this.stats.totalEvaluations++;
    const startTime = Date.now();
    
    // 1. 检测幻觉信号
    const hallucination = this._detectHallucination(text);
    
    // 2. 评估认知不确定性
    const epistemic = this._assessEpistemicUncertainty(text, context);
    
    // 3. 评估随机不确定性
    const aleatoric = this._assessAleatoricUncertainty(text, context);
    
    // 4. 综合置信度
    const confidence = this._calculateConfidence(hallucination, epistemic, aleatoric, context);
    
    // 5. 不确定性分解
    const decomposition = {
      epistemic: epistemic.score,      // 认知不确定
      aleatoric: aleatoric.score,      // 随机不确定
      hallucination: hallucination.risk  // 幻觉风险
    };
    
    // 6. 生成校准表达
    const calibratedPhrase = this._generateCalibratedPhrase(confidence, decomposition);
    
    const duration = Date.now() - startTime;
    
    const result = {
      confidence: Math.round(confidence * 100) / 100,
      level: this._confidenceToLevel(confidence),
      decomposition,
      hallucination,
      epistemic,
      aleatoric,
      calibratedPhrase,
      isHallucinationRisk: hallucination.risk > 0.3,
      recommendations: this._generateRecommendations(decomposition),
      duration
    };
    
    if (result.isHallucinationRisk) {
      this.stats.hallucinationDetected++;
    }
    
    return result;
  }

  /**
   * 检测幻觉信号
   */
  _detectHallucination(text) {
    const signals = [];
    let risk = 0;
    
    // 检查过度确定性
    const overCertaintyCount = this.hallucinationSignals.overCertainty
      .filter(s => text.includes(s)).length;
    if (overCertaintyCount > 0) {
      risk += overCertaintyCount * 0.1;
      signals.push(`过度确定性信号: ${overCertaintyCount}个`);
    }
    
    // 检查过度具体性
    const specificityCount = this.hallucinationSignals.excessiveSpecificity
      .filter(s => text.includes(s)).length;
    if (specificityCount > 0) {
      risk += specificityCount * 0.05;
      signals.push(`过度具体性信号: ${specificityCount}个`);
    }
    
    // 检查虚假引用
    const citationCount = this.hallucinationSignals.fakeCitations
      .filter(s => text.includes(s)).length;
    if (citationCount > 0) {
      risk += citationCount * 0.15;
      signals.push(`疑似虚假引用: ${citationCount}个`);
    }
    
    // 检查模糊引用
    const vagueCount = this.hallucinationSignals.vagueAttribution
      .filter(s => text.includes(s)).length;
    if (vagueCount > 0) {
      risk += vagueCount * 0.05;
      signals.push(`模糊引用: ${vagueCount}个`);
    }
    
    // 风险超过0.3认为是高风险
    risk = Math.min(1, risk);
    
    return {
      risk: Math.round(risk * 100) / 100,
      signals,
      level: risk > 0.5 ? 'HIGH' : risk > 0.3 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * 评估认知不确定性（可减少的不确定）
   */
  _assessEpistemicUncertainty(text, context) {
    let score = 0.5;  // 基础分数
    const factors = [];
    
    // 证据覆盖
    const hasEvidence = context.hasEvidence || false;
    const evidenceIndicators = ['根据', '由于', '因为', '数据显示', '研究显示', '证明'];
    const hasEvidenceIndicator = evidenceIndicators.some(e => text.includes(e));
    
    if (hasEvidence || hasEvidenceIndicator) {
      score += 0.2;
      factors.push('有证据支持');
    } else {
      score -= 0.2;
      factors.push('缺少证据支持');
    }
    
    // 多源交叉验证
    if (context.multiSource) {
      score += 0.15;
      factors.push('多源交叉验证');
    }
    
    // 模糊性
    const vagueTerms = ['可能', '也许', '或许', '大概', 'perhaps', 'maybe', 'possibly'];
    const hasVague = vagueTerms.some(t => text.includes(t));
    if (hasVague) {
      score += 0.1;
      factors.push('使用模糊限定词');
    }
    
    // 领域风险
    for (const [domain, penalty] of Object.entries(this.highRiskDomains)) {
      if (text.includes(domain) && !hasEvidence) {
        score -= penalty;
        factors.push(`高风险领域(${domain})无证据`);
      }
    }
    
    return {
      score: Math.max(0, Math.min(1, score)),
      level: score > 0.6 ? 'LOW' : score > 0.4 ? 'MEDIUM' : 'HIGH',
      factors
    };
  }

  /**
   * 评估随机不确定性（不可减少的不确定）
   */
  _assessAleatoricUncertainty(text, context) {
    let score = 0.2;  // 默认较低
    const factors = [];
    
    // 问题本身的特性
    const stochasticIndicators = [
      '随机', '概率', '可能', '也许', '不确定',
      '取决于', '因人而异', '情况而定'
    ];
    const hasStochastic = stochasticIndicators.some(i => text.includes(i));
    
    if (hasStochastic) {
      score = 0.5;
      factors.push('问题本身具有随机性');
    }
    
    // 主观性问题
    const subjectiveIndicators = [
      '我认为', '你觉得', '在我看来', 'i think', 'in my opinion',
      '主观', '偏好', '价值观'
    ];
    const hasSubjective = subjectiveIndicators.some(i => text.includes(i));
    
    if (hasSubjective) {
      score = Math.max(score, 0.4);
      factors.push('主观性问题，答案非唯一');
    }
    
    // 开放式问题
    const openEndedIndicators = [
      '你怎么看', '最好的方式是', '最合适的选择是'
    ];
    const hasOpenEnded = openEndedIndicators.some(i => text.includes(i));
    
    if (hasOpenEnded) {
      score = Math.max(score, 0.3);
      factors.push('开放式问题，答案非唯一');
    }
    
    return {
      score: Math.min(1, score),
      level: score < 0.2 ? 'LOW' : score < 0.4 ? 'MEDIUM' : 'HIGH',
      factors
    };
  }

  /**
   * 计算综合置信度
   */
  _calculateConfidence(hallucination, epistemic, aleatoric, context) {
    // 基础置信度
    let confidence = epistemic.score * (1 - aleatoric.score * 0.5);
    
    // 幻觉惩罚
    confidence *= (1 - hallucination.risk * 0.5);
    
    // 如果是高风险领域且无证据，进一步降低
    const domain = Object.keys(this.highRiskDomains)
      .find(d => context.domain && context.domain.includes(d));
    if (domain && !context.hasEvidence) {
      confidence *= (1 - this.highRiskDomains[domain]);
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 置信度转等级
   */
  _confidenceToLevel(confidence) {
    if (confidence >= 0.85) return 'VERY_HIGH';
    if (confidence >= 0.70) return 'HIGH';
    if (confidence >= 0.50) return 'MEDIUM';
    if (confidence >= 0.30) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * 生成校准表达
   */
  _generateCalibratedPhrase(confidence, decomposition) {
    const { epistemic, aleatoric, hallucination } = decomposition;
    
    let phrase = '';
    
    if (hallucination.risk > 0.3) {
      phrase = '⚠️ 这个回答可能包含不准确信息，请验证关键事实';
    } else if (epistemic > 0.6 && aleatoric < 0.2) {
      phrase = '✓ 我对这个话题有较多了解，但仍有认知局限';
    } else if (epistemic > 0.4) {
      phrase = '○ 基于现有信息，这是我的判断，但请注意验证';
    } else if (aleatoric > 0.4) {
      phrase = '? 这个问题本身具有不确定性，答案可能因情况而异';
    } else {
      phrase = '△ 我对这个话题的了解有限，建议查阅专业资料';
    }
    
    return phrase;
  }

  /**
   * 生成建议
   */
  _generateRecommendations(decomposition) {
    const recs = [];
    
    if (decomposition.epistemic < 0.4) {
      recs.push('建议：获取更多证据或权威来源来支持这个判断');
    }
    
    if (decomposition.aleatoric > 0.3) {
      recs.push('注意：这个问题本身具有随机性，答案不是确定的');
    }
    
    if (decomposition.hallucination > 0.3) {
      recs.push('警告：检测到可能的幻觉信号，关键信息请务必核实');
    }
    
    if (recs.length === 0) {
      recs.push('状态：置信度良好，回答质量正常');
    }
    
    return recs;
  }

  /**
   * 记录评估结果（用于校准学习）
   */
  recordOutcome(evaluation, actualOutcome) {
    const record = {
      ...evaluation,
      actualOutcome,
      accuracy: actualOutcome === 'correct' ? 1 : actualOutcome === 'partial' ? 0.5 : 0,
      timestamp: Date.now()
    };
    
    this.records.push(record);
    
    // 保持记录在合理范围
    if (this.records.length > 1000) {
      this.records = this.records.slice(-500);
    }
    
    // 更新校准历史
    this._updateCalibration();
    
    return record;
  }

  /**
   * 更新校准状态
   */
  _updateCalibration() {
    const recent = this.records.slice(-20);
    if (recent.length < 5) return;
    
    const avgConfidence = recent.reduce((a, r) => a + r.confidence, 0) / recent.length;
    const avgAccuracy = recent.reduce((a, r) => a + r.accuracy, 0) / recent.length;
    
    const calibrationError = Math.abs(avgConfidence - avgAccuracy);
    
    this.calibrationHistory.push({
      timestamp: Date.now(),
      avgConfidence,
      avgAccuracy,
      calibrationError
    });
    
    // 如果校准误差超过0.2，提示需要调整
    if (calibrationError > 0.2) {
      console.log(`[UncertaintyQuantifier] ⚠️ 校准误差: ${calibrationError.toFixed(2)}, 建议重新校准`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalEvaluations: this.stats.totalEvaluations,
      hallucinationDetected: this.stats.hallucinationDetected,
      hallucinationRate: this.stats.totalEvaluations > 0
        ? (this.stats.hallucinationDetected / this.stats.totalEvaluations).toFixed(3)
        : 0,
      calibrationHistory: this.calibrationHistory.slice(-5),
      recentRecords: this.records.slice(-5).map(r => ({
        confidence: r.confidence,
        actualAccuracy: r.accuracy,
        hallucinationRisk: r.hallucination.risk
      }))
    };
  }
}

module.exports = { UncertaintyQuantifier };
