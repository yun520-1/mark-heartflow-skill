/**
 * 自我检查能力模块 (Self-Checking Ability Module)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 权威理论：
 * - Metacognition (Metacognitive Monitoring)
 * - Flavell (1979) - 元认知理论
 * - Koriat (2007) - 元认知判断
 * - Nelson & Narens (1990) - 元认知框架
 * 
 * 版本：v4.2.0
 * 
 * 核心功能：
 * 1. 元认知监控 - 监控认知过程的准确性和效率
 * 2. 判断信心评估 - 评估判断的信心水平
 * 3. 错误检测 - 检测认知和行为中的错误
 * 4. 校正建议生成 - 基于检测结果生成校正建议
 * 
 * 理论来源：
 * - Flavell, J. (1979). "Metacognition and Cognitive Monitoring"
 * - Koriat, A. (2007). "Metacognition and consciousness"
 * - Nelson, T. O., & Narens, L. (1990). "Metamemory: A theoretical framework"
 * 
 * @module self-checking
 * @version 4.2.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 元认知判断类型 (Types of Metacognitive Judgments)
 * 基于 Flavell (1979) 和 Koriat (2007)
 */
const MetacognitiveJudgmentTypes = {
  JOL: 'jol',                   // 易学性判断 (Judgment of Learning)
  FOK: 'fok',                   // 知道感判断 (Feeling of Knowing)
  CONFIDENCE: 'confidence',     // 信心判断 (Confidence Judgment)
  COMPREHENSION: 'comprehension' // 理解监控 (Comprehension Monitoring)
};

/**
 * 元认知监控层次 (Levels of Metacognitive Monitoring)
 */
const MonitoringLevels = {
  NONE: 0,                    // 无元认知监控
  AWARE: 1,                   // 觉察水平 - 意识到认知过程
  MONITORING: 2,              // 监控水平 - 持续跟踪认知状态
  EVALUATING: 3,              // 评估水平 - 评估认知质量
  REGULATING: 4               // 调节水平 - 主动调节认知过程
};

/**
 * 错误类型分类 (Error Type Classification)
 */
const ErrorTypes = {
  COGNITIVE: 'cognitive',       // 认知错误（理解、推理）
  PERCEPTUAL: 'perceptual',     // 知觉错误（观察、注意）
  MEMORY: 'memory',             // 记忆错误（编码、提取）
  JUDGMENT: 'judgment',         // 判断错误（评估、决策）
  ACTION: 'action'              // 行动错误（执行、操作）
};

/**
 * 校正策略类型 (Correction Strategy Types)
 */
const CorrectionStrategies = {
  RECHECK: 'recheck',           // 重新检查
  SEEK_FEEDBACK: 'seek_feedback', // 寻求反馈
  ADJUST_CONFIDENCE: 'adjust_confidence', // 调整信心
  REVISE_BELIEF: 'revise_belief', // 修正信念
  SLOW_DOWN: 'slow_down',       // 放慢速度
  USE_TOOL: 'use_tool'          // 使用工具
};

// ============ 自我检查核心类 ============

class SelfCheckingModule {
  constructor() {
    // 当前元认知监控水平
    this.monitoringLevel = MonitoringLevels.MONITORING;
    
    // 元认知状态
    this.metacognitiveState = {
      awareness: 0.7,         // 元认知觉察水平 (0-1)
      accuracy: 0.75,         // 元认知准确性
      regulation: 0.7         // 元认知调节能力
    };
    
    // 信心校准档案
    this.confidenceCalibration = {
      judgments: [],          // 历史判断记录
      calibration: 0.8,       // 信心 - 准确性校准度
      overconfidence: 0.1,    // 过度自信倾向
      underconfidence: 0.1    // 自信不足倾向
    };
    
    // 错误检测记录
    this.errorDetectionLog = [];
    
    // 校正历史
    this.correctionHistory = [];
    
    // 监控标准
    this.monitoringStandards = {
      accuracy: 0.8,          // 准确性标准
      speed: 0.6,             // 速度标准
      completeness: 0.7       // 完整性标准
    };
    
    console.log('✅ 自我检查能力模块已初始化 (v4.2.0) - 元认知监控与错误检测');
  }
  
  // ============ 元认知监控 ============
  
  /**
   * 启动元认知监控 (Start Metacognitive Monitoring)
   * @param {string} taskType - 任务类型
   * @param {Object} standards - 监控标准
   * @returns {Object} 监控状态
   */
  startMonitoring(taskType = 'general', standards = {}) {
    this.monitoringState = {
      active: true,
      taskType: taskType,
      standards: { ...this.monitoringStandards, ...standards },
      startTime: new Date().toISOString(),
      checkpoints: []
    };
    
    console.log(`🔍 元认知监控已启动：${taskType}`);
    
    return {
      status: 'active',
      taskType: taskType,
      standards: this.monitoringState.standards
    };
  }
  
  /**
   * 记录监控检查点 (Record Monitoring Checkpoint)
   * @param {Object} data - 检查点数据
   * @returns {Object} 检查点记录
   */
  recordCheckpoint(data) {
    if (!this.monitoringState || !this.monitoringState.active) {
      return { error: '监控未激活' };
    }
    
    const checkpoint = {
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.monitoringState.checkpoints.push(checkpoint);
    
    return checkpoint;
  }
  
  /**
   * 评估元认知状态 (Assess Metacognitive State)
   * @returns {Object} 评估结果
   */
  assessMetacognitiveState() {
    const assessment = {
      awareness: {
        score: this.metacognitiveState.awareness * 100,
        level: this._getLevelDescription(this.metacognitiveState.awareness),
        description: this._getAwarenessDescription(this.metacognitiveState.awareness)
      },
      accuracy: {
        score: this.metacognitiveState.accuracy * 100,
        level: this._getLevelDescription(this.metacognitiveState.accuracy),
        description: this._getAccuracyDescription(this.metacognitiveState.accuracy)
      },
      regulation: {
        score: this.metacognitiveState.regulation * 100,
        level: this._getLevelDescription(this.metacognitiveState.regulation),
        description: this._getRegulationDescription(this.metacognitiveState.regulation)
      },
      overall: {
        score: Math.round((
          this.metacognitiveState.awareness + 
          this.metacognitiveState.accuracy + 
          this.metacognitiveState.regulation
        ) / 3 * 100),
        interpretation: this._getOverallInterpretation(this.metacognitiveState)
      },
      recommendations: this._generateMetacognitiveRecommendations()
    };
    
    return assessment;
  }
  
  /**
   * 获取层次描述
   * @private
   */
  _getLevelDescription(value) {
    if (value < 0.4) return '低';
    if (value < 0.6) return '中等';
    if (value < 0.8) return '高';
    return '很高';
  }
  
  /**
   * 获取得觉察描述
   * @private
   */
  _getAwarenessDescription(value) {
    if (value < 0.4) return '对自身认知过程觉察不足';
    if (value < 0.6) return '有一定觉察，但可以提升';
    if (value < 0.8) return '良好的元认知觉察能力';
    return '优秀的元认知觉察能力，能清晰感知认知过程';
  }
  
  /**
   * 获取准确性描述
   * @private
   */
  _getAccuracyDescription(value) {
    if (value < 0.4) return '元认知判断与实际表现偏差较大';
    if (value < 0.6) return '元认知判断有一定准确性';
    if (value < 0.8) return '元认知判断较为准确';
    return '元认知判断非常准确，能精确评估认知状态';
  }
  
  /**
   * 获取调节描述
   * @private
   */
  _getRegulationDescription(value) {
    if (value < 0.4) return '难以有效调节认知过程';
    if (value < 0.6) return '有一定的调节能力';
    if (value < 0.8) return '能有效调节认知过程';
    return '优秀的认知调节能力，能灵活调整策略';
  }
  
  /**
   * 获取整体解释
   * @private
   */
  _getOverallInterpretation(state) {
    const avg = (state.awareness + state.accuracy + state.regulation) / 3;
    if (avg < 0.4) return '元认知能力需要显著提升';
    if (avg < 0.6) return '元认知能力有提升空间';
    if (avg < 0.8) return '良好的元认知能力';
    return '优秀的元认知能力';
  }
  
  /**
   * 生成元认知建议
   * @private
   */
  _generateMetacognitiveRecommendations() {
    const recommendations = [];
    
    if (this.metacognitiveState.awareness < 0.6) {
      recommendations.push({
        area: 'awareness',
        suggestion: '增强元认知觉察：定期暂停，问自己"我现在在想什么？"',
        exercise: '元认知觉察练习 (5-10 分钟)'
      });
    }
    
    if (this.metacognitiveState.accuracy < 0.6) {
      recommendations.push({
        area: 'accuracy',
        suggestion: '提升判断准确性：记录预测与实际结果的对比',
        exercise: '信心校准练习 (10 分钟)'
      });
    }
    
    if (this.metacognitiveState.regulation < 0.6) {
      recommendations.push({
        area: 'regulation',
        suggestion: '增强调节能力：学习多种认知策略并灵活运用',
        exercise: '认知策略库建设 (15 分钟)'
      });
    }
    
    return recommendations;
  }
  
  // ============ 判断信心评估 ============
  
  /**
   * 评估判断信心 (Assess Judgment Confidence)
   * @param {Object} judgment - 判断内容
   * @param {Array} evidence - 支持证据
   * @returns {Object} 信心评估结果
   */
  assessConfidence(judgment, evidence = []) {
    const assessment = {
      judgment: judgment,
      confidence: {
        initial: 0.5,
        adjusted: 0.5,
        calibrated: 0.5
      },
      evidence: {
        quantity: evidence.length,
        quality: 0.5,
        consistency: 0.5
      },
      biases: [],
      recommendation: ''
    };
    
    // 评估证据质量
    assessment.evidence.quality = this._assessEvidenceQuality(evidence);
    assessment.evidence.consistency = this._assessEvidenceConsistency(evidence);
    
    // 计算初始信心
    assessment.confidence.initial = this._calculateInitialConfidence(
      assessment.evidence
    );
    
    // 检测偏见
    assessment.biases = this._detectConfidenceBiases(judgment, evidence);
    
    // 调整信心
    assessment.confidence.adjusted = this._adjustForBiases(
      assessment.confidence.initial,
      assessment.biases
    );
    
    // 校准信心
    assessment.confidence.calibrated = this._calibrateConfidence(
      assessment.confidence.adjusted
    );
    
    // 生成建议
    assessment.recommendation = this._generateConfidenceRecommendation(assessment);
    
    // 记录判断
    this.confidenceCalibration.judgments.push({
      timestamp: new Date().toISOString(),
      judgment,
      confidence: assessment.confidence.calibrated,
      accuracy: null // 待后续更新
    });
    
    return assessment;
  }
  
  /**
   * 评估证据质量
   * @private
   */
  _assessEvidenceQuality(evidence) {
    if (evidence.length === 0) return 0;
    
    const qualityScores = evidence.map(e => {
      let score = 0.5;
      if (e.source === 'direct') score = 0.9;
      else if (e.source === 'expert') score = 0.8;
      else if (e.source === 'data') score = 0.7;
      else if (e.source === 'anecdotal') score = 0.4;
      
      if (e.recency === 'recent') score += 0.1;
      if (e.reliability === 'high') score += 0.1;
      
      return Math.min(1.0, score);
    });
    
    return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  }
  
  /**
   * 评估证据一致性
   * @private
   */
  _assessEvidenceConsistency(evidence) {
    if (evidence.length < 2) return 0.5;
    
    // 简化：假设证据方向一致则一致性高
    const directions = evidence.map(e => e.direction || 'neutral');
    const uniqueDirections = new Set(directions);
    
    if (uniqueDirections.size === 1) return 1.0;
    if (uniqueDirections.size === 2) return 0.5;
    return 0.3;
  }
  
  /**
   * 计算初始信心
   * @private
   */
  _calculateInitialConfidence(evidence) {
    const { quantity, quality, consistency } = evidence;
    
    // 数量因子（对数增长）
    const quantityFactor = Math.min(1.0, Math.log2(quantity + 1) / 4);
    
    // 综合计算
    return (
      quantityFactor * 0.3 +
      quality * 0.4 +
      consistency * 0.3
    );
  }
  
  /**
   * 检测信心偏见
   * @private
   */
  _detectConfidenceBiases(judgment, evidence) {
    const biases = [];
    
    // 检测过度自信
    if (evidence.length < 3) {
      const confidence = this._calculateInitialConfidence(evidence);
      if (confidence > 0.7) {
        biases.push({
          type: 'overconfidence',
          description: '证据不足但信心过高',
          adjustment: -0.15
        });
      }
    }
    
    // 检测确认偏误
    const directions = evidence.map(e => e.direction);
    if (directions.every(d => d === 'supporting')) {
      biases.push({
        type: 'confirmation_bias',
        description: '只收集支持性证据',
        adjustment: -0.1
      });
    }
    
    // 检测锚定效应
    if (judgment.initialAnchor) {
      biases.push({
        type: 'anchoring',
        description: '可能受到初始锚点影响',
        adjustment: -0.05
      });
    }
    
    return biases;
  }
  
  /**
   * 调整偏见
   * @private
   */
  _adjustForBiases(initialConfidence, biases) {
    const totalAdjustment = biases.reduce(
      (sum, bias) => sum + (bias.adjustment || 0), 
      0
    );
    return Math.min(1.0, Math.max(0.0, initialConfidence + totalAdjustment));
  }
  
  /**
   * 校准信心
   * @private
   */
  _calibrateConfidence(confidence) {
    // 基于历史校准记录调整
    const { calibration, overconfidence, underconfidence } = this.confidenceCalibration;
    
    // 如果有过度自信倾向，适度下调
    if (overconfidence > underconfidence) {
      return confidence * (1 - overconfidence * 0.2);
    }
    
    return confidence;
  }
  
  /**
   * 生成信心建议
   * @private
   */
  _generateConfidenceRecommendation(assessment) {
    const { confidence, biases } = assessment;
    
    if (biases.length === 0 && confidence.calibrated > 0.7) {
      return '信心水平合理，基于充分证据';
    }
    
    if (biases.some(b => b.type === 'overconfidence')) {
      return '建议降低信心：证据不足，考虑收集更多信息';
    }
    
    if (biases.some(b => b.type === 'confirmation_bias')) {
      return '建议寻找反面证据：目前只收集了支持性信息';
    }
    
    if (confidence.calibrated < 0.4) {
      return '信心较低，建议：1) 收集更多证据 2) 咨询专家 3) 分解问题';
    }
    
    return '信心水平适中，保持审慎态度';
  }
  
  // ============ 错误检测 ============
  
  /**
   * 检测错误 (Detect Errors)
   * @param {Object} currentState - 当前状态
   * @param {Object} expectedState - 预期状态
   * @returns {Object} 错误检测结果
   */
  detectErrors(currentState, expectedState) {
    const result = {
      hasError: false,
      errors: [],
      severity: 'none',
      suggestions: []
    };
    
    // 比较当前状态与预期状态
    const discrepancies = this._findDiscrepancies(currentState, expectedState);
    
    if (discrepancies.length === 0) {
      return result;
    }
    
    result.hasError = true;
    
    // 分类错误
    for (const discrepancy of discrepancies) {
      const error = {
        type: this._classifyError(discrepancy),
        severity: this._assessErrorSeverity(discrepancy),
        description: discrepancy.description,
        location: discrepancy.location,
        impact: discrepancy.impact
      };
      
      result.errors.push(error);
      
      // 生成校正建议
      result.suggestions.push(this._generateCorrectionSuggestion(error));
    }
    
    // 评估整体严重程度
    result.severity = this._assessOverallSeverity(result.errors);
    
    // 记录错误
    this.errorDetectionLog.push({
      timestamp: new Date().toISOString(),
      errors: result.errors,
      context: { currentState, expectedState }
    });
    
    return result;
  }
  
  /**
   * 查找差异
   * @private
   */
  _findDiscrepancies(current, expected) {
    const discrepancies = [];
    
    // 简化实现：比较关键属性
    const keys = new Set([...Object.keys(current), ...Object.keys(expected)]);
    
    for (const key of keys) {
      const currVal = current[key];
      const expVal = expected[key];
      
      if (currVal !== expVal) {
        const difference = Math.abs(currVal - expVal);
        if (difference > 0.2) { // 阈值
          discrepancies.push({
            key,
            currentValue: currVal,
            expectedValue: expVal,
            difference,
            description: `${key}: 期望${expVal}, 实际${currVal}`,
            location: key,
            impact: difference > 0.5 ? 'high' : difference > 0.3 ? 'medium' : 'low'
          });
        }
      }
    }
    
    return discrepancies;
  }
  
  /**
   * 分类错误
   * @private
   */
  _classifyError(discrepancy) {
    // 基于差异类型分类
    if (typeof discrepancy.currentValue === 'number') {
      return ErrorTypes.JUDGMENT;
    }
    if (typeof discrepancy.currentValue === 'string') {
      return ErrorTypes.COGNITIVE;
    }
    return ErrorTypes.COGNITIVE;
  }
  
  /**
   * 评估错误严重程度
   * @private
   */
  _assessErrorSeverity(discrepancy) {
    if (discrepancy.difference > 0.7) return 'critical';
    if (discrepancy.difference > 0.5) return 'high';
    if (discrepancy.difference > 0.3) return 'medium';
    return 'low';
  }
  
  /**
   * 评估整体严重程度
   * @private
   */
  _assessOverallSeverity(errors) {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'high')) return 'high';
    if (errors.some(e => e.severity === 'medium')) return 'medium';
    return 'low';
  }
  
  /**
   * 生成校正建议
   * @private
   */
  _generateCorrectionSuggestion(error) {
    const suggestions = {
      [ErrorTypes.COGNITIVE]: '重新审视推理过程，检查逻辑漏洞',
      [ErrorTypes.PERCEPTUAL]: '重新观察，注意可能忽略的细节',
      [ErrorTypes.MEMORY]: '验证记忆准确性，查找外部证据',
      [ErrorTypes.JUDGMENT]: '重新评估证据，考虑反面信息',
      [ErrorTypes.ACTION]: '暂停行动，重新确认目标和步骤'
    };
    
    return {
      errorType: error.type,
      suggestion: suggestions[error.type] || '重新检查',
      strategy: this._selectCorrectionStrategy(error.severity)
    };
  }
  
  /**
   * 选择校正策略
   * @private
   */
  _selectCorrectionStrategy(severity) {
    if (severity === 'critical') return CorrectionStrategies.SLOW_DOWN;
    if (severity === 'high') return CorrectionStrategies.RECHECK;
    if (severity === 'medium') return CorrectionStrategies.SEEK_FEEDBACK;
    return CorrectionStrategies.ADJUST_CONFIDENCE;
  }
  
  // ============ 元认知练习 ============
  
  /**
   * 元认知觉察练习 (Metacognitive Awareness Exercise)
   * @param {number} duration - 时长 (分钟)
   * @returns {Object} 练习指导
   */
  metacognitiveAwarenessExercise(duration = 10) {
    return {
      name: '元认知觉察练习',
      duration: `${duration} 分钟`,
      goal: '提升对自身认知过程的觉察能力',
      steps: [
        {
          step: 1,
          name: '思维观察',
          duration: '3 分钟',
          instruction: '静坐观察自己的思维流动，不评判不干预',
          rationale: '培养对思维过程的纯粹觉察'
        },
        {
          step: 2,
          name: '元认知提问',
          duration: '3 分钟',
          instruction: '问自己："我现在在想什么？""我为什么这样想？"',
          rationale: '元认知提问增强觉察深度'
        },
        {
          step: 3,
          name: '策略识别',
          duration: '2 分钟',
          instruction: '识别当前使用的认知策略',
          rationale: '识别策略是调节的前提'
        },
        {
          step: 4,
          name: '整合反思',
          duration: '2 分钟',
          instruction: '反思：我的认知过程有效吗？如何改进？',
          rationale: '反思促进元认知能力发展'
        }
      ],
      tips: [
        '每天练习，培养元认知习惯',
        '在重要决策前进行元认知检查',
        '记录元认知洞察'
      ]
    };
  }
  
  /**
   * 信心校准练习 (Confidence Calibration Exercise)
   * @param {number} duration - 时长 (分钟)
   * @returns {Object} 练习指导
   */
  confidenceCalibrationExercise(duration = 10) {
    return {
      name: '信心校准练习',
      duration: `${duration} 分钟`,
      goal: '提升信心判断的准确性',
      steps: [
        {
          step: 1,
          name: '回顾判断',
          duration: '3 分钟',
          instruction: '回顾过去 3 个重要判断及其信心水平',
          rationale: '建立信心 - 准确性联结'
        },
        {
          step: 2,
          name: '结果对比',
          duration: '3 分钟',
          instruction: '对比判断信心与实际结果',
          rationale: '识别过度/自信不足模式'
        },
        {
          step: 3,
          name: '偏差分析',
          duration: '2 分钟',
          instruction: '分析信心偏差的原因',
          rationale: '理解偏差来源'
        },
        {
          step: 4,
          name: '校准调整',
          duration: '2 分钟',
          instruction: '设定信心校准调整因子',
          rationale: '主动校准提升准确性'
        }
      ],
      tips: [
        '记录判断 - 结果对比日志',
        '定期回顾校准进度',
        '接受不确定性'
      ]
    };
  }
  
  // ============ 工具函数 ============
  
  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getCurrentState() {
    return {
      monitoringLevel: this.monitoringLevel,
      metacognitiveState: { ...this.metacognitiveState },
      confidenceCalibration: { ...this.confidenceCalibration },
      errorLogLength: this.errorDetectionLog.length,
      correctionHistoryLength: this.correctionHistory.length
    };
  }
  
  /**
   * 更新元认知状态
   * @param {Object} newState - 新状态
   */
  updateMetacognitiveState(newState) {
    for (const [key, value] of Object.entries(newState)) {
      if (this.metacognitiveState.hasOwnProperty(key)) {
        this.metacognitiveState[key] = Math.min(1.0, Math.max(0.0, value));
      }
    }
  }
  
  /**
   * 获取错误历史
   * @param {number} limit - 返回数量限制
   * @returns {Array} 历史记录
   */
  getErrorHistory(limit = 10) {
    return this.errorDetectionLog.slice(-limit);
  }
}

// ============ 导出模块 ============

module.exports = {
  SelfCheckingModule,
  MetacognitiveJudgmentTypes,
  MonitoringLevels,
  ErrorTypes,
  CorrectionStrategies
};
