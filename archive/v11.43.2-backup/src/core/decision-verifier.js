/**
 * HeartFlow Decision Verifier v11.5.7
 *
 * Research-inspired upgrade for reasoning reliability:
 * - structured decision records instead of free-form intuition
 * - contradiction / risk / evidence checks
 * - confidence re-scoring and repair hints
 * - SELF-VERIFICATION LAYER (arXiv 2312.09210)
 *
 * Sources:
 * - "Self-Verification Improves Reasoning" (Weng et al., 2023)
 * - self-correction survey (2025)
 * - verifier-first reasoning patterns (2025)
 * - process supervision / runtime verification trends (2025-2026)
 */

class DecisionVerifier {
  constructor(options = {}) {
    this.thresholds = {
      minEvidence: options.minEvidence || 1,
      lowConfidence: options.lowConfidence || 0.45,
      highRiskPenalty: options.highRiskPenalty || 0.2,
      contradictionPenalty: options.contradictionPenalty || 0.25
    };
  }

  verify(decisionRecord = {}) {
    const normalized = this.normalize(decisionRecord);
    const issues = [];
    const checks = {
      evidence: this.checkEvidence(normalized),
      contradiction: this.checkContradictions(normalized),
      risk: this.checkRisk(normalized),
      completeness: this.checkCompleteness(normalized),
      reverseConsistency: this.checkReverseConsistency(normalized),
      counterfactualRisk: this.checkCounterfactualRisk(normalized),
      chainIntegrity: this.checkChainIntegrity(normalized)
    };

    const selfVerification = this.selfVerify(normalized);
    issues.push(...(selfVerification.hints || []).map(hint => ({
      type: 'self_verification_hint',
      severity: selfVerification.selfVerified ? 'low' : 'medium',
      message: hint
    })));
    if (!selfVerification.selfVerified) {
      issues.push({
        type: 'self_verification_failed',
        severity: selfVerification.verdict === 'likely_wrong' ? 'high' : 'medium',
        message: `selfVerify verdict: ${selfVerification.verdict}`
      });
    }

    Object.values(checks).forEach(result => {
      if (result.issues?.length) issues.push(...result.issues);
    });

    const score = this.computeScore(normalized, checks);
    return {
      valid: score >= 0.6 && issues.filter(i => i.severity === 'high').length === 0,
      score,
      issues,
      checks,
      repairHints: this.generateRepairHints(issues, normalized),
      normalized,
      summary: this.summarize(checks, issues)
    };
  }

  normalize(record) {
    return {
      decision: record.decision || record.strategy || record.action || '',
      reason: record.reason || record.rationale || '',
      evidence: Array.isArray(record.evidence) ? record.evidence : (record.evidence ? [record.evidence] : []),
      risks: Array.isArray(record.risks) ? record.risks : (record.risk ? [record.risk] : []),
      alternatives: Array.isArray(record.alternatives) ? record.alternatives : [],
      confidence: typeof record.confidence === 'number' ? record.confidence : Number(record.confidence || 0.5),
      expectedOutcome: record.expectedOutcome || '',
      userGoal: record.userGoal || '',
      constraints: Array.isArray(record.constraints) ? record.constraints : []
    };
  }

  checkEvidence(record) {
    const issues = [];
    if (record.evidence.length < this.thresholds.minEvidence) {
      issues.push({ type: 'missing_evidence', severity: 'high', message: '决策缺少可核对依据' });
    }
    if (record.reason && /一定|绝对|必须/.test(record.reason) && record.evidence.length === 0) {
      issues.push({ type: 'overclaim', severity: 'medium', message: '出现强断言但没有证据支撑' });
    }
    return { ok: issues.length === 0, issues };
  }

  checkContradictions(record) {
    const issues = [];
    const joined = [record.decision, record.reason, record.expectedOutcome].join(' ');
    const contradictionPairs = [
      ['立即', '稍后'],
      ['必须', '可选'],
      ['停止', '继续'],
      ['低风险', '高风险']
    ];

    for (const [a, b] of contradictionPairs) {
      if (joined.includes(a) && joined.includes(b)) {
        issues.push({ type: 'contradiction', severity: 'high', message: `发现潜在矛盾：同时出现“${a}”与“${b}”` });
      }
    }

    if (record.alternatives.includes(record.decision)) {
      issues.push({ type: 'duplicate_alternative', severity: 'low', message: '主决策与备选方案重复' });
    }

    return { ok: issues.length === 0, issues };
  }

  checkRisk(record) {
    const issues = [];
    const highRiskTerms = ['删除', '覆盖', 'force', '高风险', '不可逆', '暴露密钥'];
    const text = [record.decision, record.reason, ...record.risks].join(' ').toLowerCase();

    const matched = highRiskTerms.filter(term => text.includes(term.toLowerCase()));
    if (matched.length > 0 && record.alternatives.length === 0) {
      issues.push({
        type: 'high_risk_without_fallback',
        severity: 'high',
        message: `高风险决策缺少回退方案: ${matched.join(', ')}`
      });
    }

    if (record.confidence > 0.85 && matched.length > 0) {
      issues.push({ type: 'overconfidence_under_risk', severity: 'medium', message: '高风险场景下置信度过高，建议降级并复核' });
    }

    return { ok: issues.length === 0, issues, matched };
  }


  checkReverseConsistency(record) {
    const self = this.selfVerify(record);
    const issues = self.selfVerified ? [] : self.hints.map(hint => ({
      type: 'reverse_consistency',
      severity: 'medium',
      message: hint
    }));
    return { ok: issues.length === 0, issues, selfVerification: self };
  }

  checkCounterfactualRisk(record) {
    const result = this._checkCounterfactual(record);
    return {
      ok: !!result.ok,
      issues: result.ok ? [] : [{
        type: 'counterfactual_risk',
        severity: 'high',
        message: result.hint || result.reason || 'counterfactual risk detected'
      }],
      detail: result
    };
  }

  checkChainIntegrity(record) {
    const result = this._checkLogicChain(record);
    return {
      ok: !!result.ok,
      issues: result.ok ? [] : [{
        type: 'chain_integrity',
        severity: 'high',
        message: result.hint || result.reason || 'logic chain broken'
      }],
      detail: result
    };
  }

  checkCompleteness(record) {
    const issues = [];
    if (!record.userGoal) {
      issues.push({ type: 'missing_user_goal', severity: 'medium', message: '未明确绑定用户目标' });
    }
    if (!record.expectedOutcome) {
      issues.push({ type: 'missing_expected_outcome', severity: 'low', message: '未说明期望结果' });
    }
    return { ok: issues.length === 0, issues };
  }

  computeScore(record, checks) {
    let score = Math.max(0, Math.min(1, record.confidence || 0.5));
    if (!checks.evidence.ok) score -= 0.25;
    if (!checks.contradiction.ok) score -= this.thresholds.contradictionPenalty;
    if (!checks.risk.ok) score -= this.thresholds.highRiskPenalty;
    if (!checks.completeness.ok) score -= 0.1;
    return Math.max(0, Number(score.toFixed(3)));
  }

  generateRepairHints(issues, record) {
    const hints = [];
    const types = new Set(issues.map(i => i.type));

    if (types.has('missing_evidence')) hints.push('补充至少 1 条可验证依据或工具结果');
    if (types.has('contradiction')) hints.push('重写决策描述，消除互相冲突的行动词');
    if (types.has('high_risk_without_fallback')) hints.push('为高风险操作增加回退方案或人工确认门槛');
    if (types.has('missing_user_goal')) hints.push('在决策记录中显式写明用户目标');
    if (types.has('missing_expected_outcome')) hints.push('补充期望结果，方便后续执行验证');

    if (hints.length === 0 && record.confidence < this.thresholds.lowConfidence) {
      hints.push('当前置信度偏低，建议生成 2-3 个候选方案后再重排');
    }

    return hints.slice(0, 3);
  }

  summarize(checks, issues) {
    const bad = issues.slice(0, 3).map(i => i.type).join(', ') || 'no issues';
    const flags = Object.entries(checks).filter(([, value]) => !value.ok).map(([k]) => k).join(', ') || 'all clear';
    return `${flags} | ${bad}`;
  }

  // ============================================================
  // SELF-VERIFICATION LAYER (arXiv 2312.09210)
  // 核心：在输出前，逆向检查决策与原始问题是否一致
  // ============================================================

  /**
   * 自我验证：给定决策，反推它解决的是什么问题
   * 然后检查"原问题"与"反推问题"是否一致
   */
  selfVerify(record = {}) {
    const norm = this.normalize(record);
    const checks = [];

    // 1. 逆向一致性：决策 → 反推问题 → 与原目标是否一致
    const inverseConsistency = this._checkInverseConsistency(norm);
    checks.push(inverseConsistency);

    // 2. 逻辑链：decision → reason → evidence → expected_outcome
    const chainIntegrity = this._checkLogicChain(norm);
    checks.push(chainIntegrity);

    // 3. 反事实风险：决策若错，什么会崩溃
    const counterfactual = this._checkCounterfactual(norm);
    checks.push(counterfactual);

    // 4. 验证覆盖率
    const coverage = this._checkCoverage(norm);
    checks.push(coverage);

    const passed = checks.filter(c => c.ok).length;
    const total = checks.length;
    const ratio = passed / total;

    return {
      selfVerified: ratio >= 0.75,  // ≥75% 通过才自证成功
      passRate: `${passed}/${total}`,
      score: Number(ratio.toFixed(3)),
      checks,
      verdict: ratio >= 1.0 ? 'fully_verified'
             : ratio >= 0.75 ? 'likely_correct'
             : ratio >= 0.5  ? 'needs_revision'
             : 'likely_wrong',
      hints: checks.filter(c => !c.ok).map(c => c.hint)
    };
  }

  /**
   * 逆向一致性：给定决策，提取它隐含的目标
   * 检查"隐含目标"是否覆盖"用户原始目标"
   */
  _checkInverseConsistency(norm) {
    const decision = String(norm.decision || '');
    const goal = String(norm.userGoal || '');

    if (!goal) return { ok: true, type: 'inverse_consistency', reason: 'no goal to verify' };

    // 提取决策关键词
    const decisionKeywords = this._extractKeywords(decision);
    const goalKeywords = this._extractKeywords(goal);

    // 关键词覆盖率
    const covered = goalKeywords.filter(k => decisionKeywords.includes(k));
    const coverage = goalKeywords.length > 0 ? covered.length / goalKeywords.length : 1;

    // 决策是否包含目标中的核心词
    const mentions = goalKeywords.filter(k => {
      return decision.toLowerCase().includes(k) || decision.toLowerCase().includes(k.slice(0, 3));
    });

    const ok = coverage >= 0.5 || mentions.length >= 1;
    return {
      ok,
      type: 'inverse_consistency',
      coverage: Number(coverage.toFixed(2)),
      mentions: mentions.length,
      goalKeywords,
      decisionKeywords,
      reason: ok ? 'decision addresses goal' : 'decision may not solve stated goal',
      hint: ok ? null : `决策可能偏离目标。目标关键词: ${goalKeywords.slice(0, 3).join(', ')}`
    };
  }

  /**
   * 逻辑链完整性：每个环节是否自洽
   */
  _checkLogicChain(norm) {
    const { decision, reason, evidence, expectedOutcome } = norm;
    const chain = [];

    // 决策存在
    chain.push({ link: 'has_decision', ok: decision.length > 0 });

    // 理由支撑决策
    if (reason) {
      const reasonSupportsDecision = reason.length > 10 && !reason.includes(decision.slice(0, 5));
      chain.push({ link: 'reason_supports_decision', ok: reasonSupportsDecision });
    }

    // 证据支撑理由
    if (evidence.length > 0) {
      const evidenceRelevant = evidence.some(e => {
        const eStr = String(e).toLowerCase();
        return eStr.includes(reason.slice(0, 10).toLowerCase()) ||
               eStr.includes(decision.slice(0, 10).toLowerCase());
      });
      chain.push({ link: 'evidence_supports_reason', ok: evidenceRelevant });
    } else {
      chain.push({ link: 'has_evidence', ok: false });
    }

    // 期望结果与决策一致
    if (expectedOutcome) {
      const outcomeConsistent = !(
        (expectedOutcome.includes('失败') && decision.includes('立即')) ||
        (expectedOutcome.includes('风险') && decision.includes('强制'))
      );
      chain.push({ link: 'outcome_consistent', ok: outcomeConsistent });
    }

    const passed = chain.filter(l => l.ok).length;
    const total = chain.length;
    const ok = passed / total >= 0.75;

    return {
      ok,
      type: 'logic_chain',
      chain,
      passRate: `${passed}/${total}`,
      reason: ok ? 'logic chain is coherent' : `logic chain broken: ${chain.filter(l => !l.ok).map(l => l.link).join(', ')}`,
      hint: ok ? null : `逻辑链断点: ${chain.filter(l => !l.ok).map(l => l.link).join(' → ')}`
    };
  }

  /**
   * 反事实风险：决策若错，什么会崩溃
   */
  _checkCounterfactual(norm) {
    const { decision, risks } = norm;
    const text = String(decision).toLowerCase();

    // 高风险决策必须有风险列表
    const isHighRisk = /删除|覆盖|强制|不可逆|暴露|危险/.test(text);
    const hasRiskList = Array.isArray(risks) && risks.length > 0;

    if (isHighRisk && !hasRiskList) {
      return {
        ok: false,
        type: 'counterfactual',
        reason: 'high-risk decision without risk analysis',
        hint: `高风险决策"${decision.slice(0, 20)}..."缺少风险清单`
      };
    }

    // 低风险决策有过多风险列表 = 过度谨慎
    const isLowRisk = /询问|检查|查看|列出/.test(text);
    if (isLowRisk && risks.length > 3) {
      return {
        ok: false,
        type: 'counterfactual',
        reason: 'low-risk action with excessive risk analysis',
        hint: '简单操作无需过度风险分析'
      };
    }

    return {
      ok: true,
      type: 'counterfactual',
      reason: 'risk calibration is appropriate',
      riskLevel: isHighRisk ? 'high' : isLowRisk ? 'low' : 'medium'
    };
  }

  /**
   * 覆盖率检查：决策是否覆盖用户目标的多个维度
   */
  _checkCoverage(norm) {
    const { userGoal, decision, constraints } = norm;
    if (!userGoal) return { ok: true, type: 'coverage', reason: 'no goal to cover' };

    const dimensions = [
      { key: 'what', pattern: /做|执行|生成|创建|修改|删除|搜索|查找|读取|写入|发送|调用/i },
      { key: 'target', pattern: /文件|目录|代码|模块|函数|变量|配置|数据|消息|用户|数据|内容/i },
      { key: 'constraint', pattern: /只|仅|必须|应该|尽量|不要|避免/i }
    ];

    const coveredDims = dimensions.filter(d => d.pattern.test(decision));
    const ok = coveredDims.length >= 1 || /简单|查看|检查/.test(decision);

    return {
      ok,
      type: 'coverage',
      coveredDimensions: coveredDims.map(d => d.key),
      reason: ok ? 'decision covers required dimensions' : 'decision may be incomplete',
      hint: ok ? null : '决策可能缺少目标维度（操作对象/约束条件）'
    };
  }

  /**
   * 关键词提取
   */
  _extractKeywords(text) {
    // 中英文停用词分开（中文按字符切分后逐个判断）
    const cnStop = new Set(['的', '了', '是', '在', '和', '与', '对', '为', '以', '上', '中', '下', '将', '把', '被', '有', '也', '就', '都', '而', '及', '与', '着', '或', '但', '只', '要', '因为', '所以', '如果', '虽然', '然而', '并且', '或者', '以及']);
    const enStop = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'as', 'it', 'this', 'that', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall']);
    const words = String(text)
      .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
    return [...new Set(words.filter(w => {
      // 中文单字只在中文停用表里查，英文词只在英文停用表里查
      if (/[\u4e00-\u9fa5]/.test(w)) return !cnStop.has(w);
      return !enStop.has(w.toLowerCase());
    }))];
  }
}

module.exports = { DecisionVerifier };
