/**
 * 认知重塑 - CBT技术的可执行版本
 * 
 * AI扩展：决策模式重构与认知偏差诊断
 */
const cognitiveRestructuring = {
  // 处理负面思维
  async processNegativeThought(negativeThought) {
    return {
      steps: [
        {
          step: 1,
          name: '识别自动思维',
          instruction: '捕捉脑海中闪现的念头',
          question: `负面思维是："${negativeThought}"`,
          space: '把这句话写下来，确认它的存在'
        },
        {
          step: 2,
          name: '证据法检验',
          instruction: '问自己：这个思维有哪些支持证据？有哪些反对证据？',
          supportPrompt: '支持这个想法的证据：\n1. \n2. \n3. ',
          againstPrompt: '反对这个想法的证据：\n1. \n2. \n3. '
        },
        {
          step: 3,
          name: '替代思维',
          instruction: '基于正反证据，生成一个更平衡的思维',
          prompt: '一个更平衡的思维可以是：'
        },
        {
          step: 4,
          name: '评估新思维',
          instruction: '新思维的可信度有多少？',
          scale: '0%（完全不信）—— 50%（半信半疑）—— 100%（完全相信）'
        }
      ],
      format: 'structured'
    };
  },

  // 生成认知重塑对话脚本
  generateScript(negativeThought) {
    const lines = [
      '=== 认知重塑练习 ===',
      '',
      `你的负面思维："${negativeThought}"`,
      '',
      '第一步：识别',
      '把这个念头用一句话写下来。',
      '写下来本身就是对它say no的第一步。',
      '',
      '第二步：证据检验',
      '问自己两个问题：',
      '  ① 支持这个想法的证据是什么？',
      '  ② 反对这个想法的证据是什么？',
      '',
      '第三步：生成替代思维',
      '如果你的朋友有同样的想法，你会对他说什么？',
      '',
      '第四步：评估',
      '新的思维，你相信它的程度是多少？',
      '(0% = 完全不信，50% = 半信半疑，100% = 完全相信)'
    ];
    return lines.join('\n');
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 决策模式重构与认知偏差诊断
  // ============================================================

  /**
   * restructureDecisionPattern(decision) — 重构引擎的决策模式
   * 当检测到决策质量下降时，分析决策并推荐替代路径
   * @param {Object} decision - 决策信息
   * @param {string} decision.decision - 原始决策内容
   * @param {number} decision.confidence - 置信度 (0-1)
   * @param {Array} decision.evidence - 证据列表
   * @param {Array} decision.alternatives - 替代方案列表
   * @returns {{ restructured: boolean, alternativePath: string, confidenceAdjustment: number, analysis: string }}
   */
  restructureDecisionPattern(decision = {}) {
    const { decision: decisionText = '', confidence = 0.5, evidence = [], alternatives = [] } = decision;

    let restructured = false;
    let alternativePath = '';
    let confidenceAdjustment = 0;
    let analysis = '';

    // 检测过度自信（高置信度但证据不足）
    const evidenceScore = evidence.length / Math.max(evidence.length + 1, 1);
    const overconfidence = confidence > 0.8 && evidenceScore < 0.4;

    // 检测保守偏差（低置信度但证据充分）
    const underconfidence = confidence < 0.3 && evidenceScore > 0.7;

    // 检测有无替代方案
    const hasAlternatives = alternatives.length > 0;

    if (overconfidence) {
      restructured = true;
      confidenceAdjustment = -0.15;
      const topAlt = hasAlternatives ? alternatives[0] : '重新评估后再做决定';
      alternativePath = `[过度自信校正] 原始决策置信度${Math.round(confidence * 100)}%但证据不足(${evidence.length}条)。`
        + `建议降低置信度至${Math.round((confidence + confidenceAdjustment) * 100)}%，考虑替代方案：「${topAlt}」。`
        + '增加证据收集后再做最终决策。';
      analysis = '检测到过度自信偏差：高置信度×低证据量。已自动降权。';
    } else if (underconfidence) {
      restructured = true;
      confidenceAdjustment = 0.12;
      alternativePath = `[保守偏差校正] 原始决策置信度仅${Math.round(confidence * 100)}%但证据充分(${evidence.length}条)。`
        + `建议提升置信度至${Math.round((confidence + confidenceAdjustment) * 100)}%，当前决策具有充分依据。`;
      analysis = '检测到保守偏差：低置信度×高证据量。已自动提权。';
    } else if (!hasAlternatives && confidence > 0.6) {
      restructured = true;
      confidenceAdjustment = -0.05;
      alternativePath = '[锚定效应警告] 当前决策未考虑替代方案。建议至少生成2-3个替代选项进行对比后再确认。';
      analysis = '检测到锚定效应风险：未生成替代方案即做出高置信度决策。';
    } else {
      alternativePath = '当前决策模式健康，无需重构。置信度与证据量匹配良好。';
      analysis = '决策模式正常：置信度与证据量匹配，替代方案充分。';
    }

    return { restructured, alternativePath, confidenceAdjustment, analysis };
  },

  /**
   * diagnoseCognitiveDistortion(stats) — 诊断引擎的认知偏差模式
   * 检查：过度自信、确认偏差、锚定效应、可得性启发
   * @param {Object} stats - 引擎决策统计数据
   * @param {Array} stats.decisions - 近期决策记录列表，每条含 {confidence, evidenceCount, alternativeCount, outcome}
   * @param {number} stats.totalDecisions - 总决策数
   * @returns {{ distortions: Array<{type: string, severity: 'low'|'medium'|'high', evidence: string}>, overallBias: number }}
   */
  diagnoseCognitiveDistortion(stats = {}) {
    const { decisions = [], totalDecisions = 0 } = stats;
    const distortions = [];
    let overallBias = 0;

    if (decisions.length < 3) {
      return {
        distortions: [{ type: 'insufficient_data', severity: 'low', evidence: '决策样本不足3条，无法进行有效偏差分析' }],
        overallBias: 0
      };
    }

    // --- 1. 过度自信检测 ---
    const highConfLowEvidence = decisions.filter(d =>
      d.confidence > 0.8 && (d.evidenceCount || 0) < 3
    );
    if (highConfLowEvidence.length > 0) {
      const severity = highConfLowEvidence.length >= 3 ? 'high' : highConfLowEvidence.length >= 2 ? 'medium' : 'low';
      distortions.push({
        type: 'overconfidence',
        severity,
        evidence: `在${highConfLowEvidence.length}/${decisions.length}个决策中，置信度>80%但证据<3条。`
      });
      overallBias += severity === 'high' ? 0.3 : severity === 'medium' ? 0.2 : 0.1;
    }

    // --- 2. 确认偏差检测 ---
    const noAlternatives = decisions.filter(d =>
      (d.alternativeCount || 0) === 0 && d.confidence > 0.6
    );
    if (noAlternatives.length > 0) {
      const severity = noAlternatives.length >= 4 ? 'high' : noAlternatives.length >= 2 ? 'medium' : 'low';
      distortions.push({
        type: 'confirmation_bias',
        severity,
        evidence: `在${noAlternatives.length}/${decisions.length}个决策中，未考虑替代方案即做出高置信度判断。`
      });
      overallBias += severity === 'high' ? 0.25 : severity === 'medium' ? 0.15 : 0.08;
    }

    // --- 3. 锚定效应检测 ---
    const firstDecisions = decisions.slice(0, Math.min(5, decisions.length));
    const subsequentDecisions = decisions.slice(Math.min(5, decisions.length));
    if (subsequentDecisions.length > 0) {
      const avgFirstConf = firstDecisions.reduce((s, d) => s + (d.confidence || 0.5), 0) / firstDecisions.length;
      const avgSubConf = subsequentDecisions.reduce((s, d) => s + (d.confidence || 0.5), 0) / subsequentDecisions.length;
      if (Math.abs(avgFirstConf - avgSubConf) > 0.3) {
        distortions.push({
          type: 'anchoring',
          severity: 'medium',
          evidence: `前${firstDecisions.length}个决策的平均置信度(${Math.round(avgFirstConf * 100)}%)与后续决策(${Math.round(avgSubConf * 100)}%)差异超过30%，可能存在锚定效应。`
        });
        overallBias += 0.15;
      }
    }

    // --- 4. 可得性启发检测 ---
    const recentOutcomes = decisions.slice(-5).map(d => d.outcome);
    const recentErrors = recentOutcomes.filter(o => o === 'error' || o === 'failure').length;
    if (recentErrors >= 3) {
      distortions.push({
        type: 'availability_heuristic',
        severity: recentErrors >= 4 ? 'high' : 'medium',
        evidence: `最近5个决策中${recentErrors}个出错，可能因近因效应导致过度悲观估计。`
      });
      overallBias += recentErrors >= 4 ? 0.2 : 0.12;
    }

    // 归一化整体偏差
    overallBias = Math.min(overallBias, 1);

    if (distortions.length === 0) {
      distortions.push({
        type: 'none',
        severity: 'low',
        evidence: '未检测到明显认知偏差模式，决策质量良好。'
      });
    }

    return { distortions, overallBias };
  }
};

module.exports = { cognitiveRestructuring };
