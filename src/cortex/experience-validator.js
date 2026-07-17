/**
 * Experience Validator — EDV (Execute-Distill-Verify) 经验验证器
 *
 * 基于 arXiv:2606.24428 "Escaping the Self-Confirmation Trap"
 * 解决单智能体经验学习循环中的自我确认陷阱：
 * 错误但自洽的轨迹被误判为成功经验，导致累积错误。
 *
 * 三阶段：Execute → Distill → Verify
 *
 * @version 1.0.0
 */

class ExperienceValidator {
  constructor(options = {}) {
    this._config = {
      maxHistory: options.maxHistory || 200,
      verifyThreshold: options.verifyThreshold || 0.7,
      crossCheckRounds: options.crossCheckRounds || 3,
      counterfactualDepth: options.counterfactualDepth || 2,
    };

    this._trajectories = [];
    this._verifiedExperiences = [];
    this._rejectedExperiences = [];
    this._validationStats = { total: 0, passed: 0, rejected: 0, selfConfirmationTraps: 0 };
  }

  // ─── Phase 1: Execute ────────────────────────────────────────

  recordTrajectory(trajectory) {
    const entry = {
      id: `traj_${Date.now()}_${this._trajectories.length}`,
      taskId: trajectory.taskId || `task_${Date.now()}`,
      task: trajectory.task,
      steps: trajectory.steps || [],
      outcome: trajectory.outcome,
      claimedSuccess: trajectory.claimedSuccess || false,
      timestamp: trajectory.timestamp || Date.now(),
      metadata: trajectory.metadata || {},
    };

    this._trajectories.push(entry);
    if (this._trajectories.length > this._config.maxHistory) {
      this._trajectories.shift();
    }
    return entry;
  }

  // ─── Phase 2: Distill ────────────────────────────────────────

  distill(trajectory) {
    const steps = trajectory.steps || [];
    const keyDecisions = steps.filter(s => s.confidence > 0.5).map(s => ({
      action: s.action,
      thought: s.thought,
      confidence: s.confidence,
      result: s.result,
    }));

    const errorPoints = steps.filter(s => {
      if (!s.result) return false;
      const r = String(s.result).toLowerCase();
      return r.includes('error') || r.includes('fail') || r.includes('wrong') || r.includes('exception');
    });

    return {
      trajectoryId: trajectory.id,
      taskSummary: this._summarizeTask(trajectory.task),
      keyDecisions,
      errorPoints: errorPoints.map(e => ({ action: e.action, result: e.result })),
      outcomeSummary: this._summarizeOutcome(trajectory.outcome),
      claimedSuccess: trajectory.claimedSuccess,
      confidenceDistribution: this._confidenceDistribution(steps),
    };
  }

  _summarizeTask(task) {
    if (!task) return '';
    const s = String(task);
    return s.length > 120 ? s.slice(0, 117) + '...' : s;
  }

  _summarizeOutcome(outcome) {
    if (!outcome) return 'no outcome';
    const s = String(outcome);
    return s.length > 200 ? s.slice(0, 197) + '...' : s;
  }

  _confidenceDistribution(steps) {
    const confs = steps.map(s => s.confidence || 0).filter(c => c > 0);
    if (confs.length === 0) return { avg: 0, min: 0, max: 0 };
    return {
      avg: +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(3),
      min: Math.min(...confs),
      max: Math.max(...confs),
    };
  }

  // ─── Phase 3: Verify ─────────────────────────────────────────

  verify(trajectoryId, distilled) {
    this._validationStats.total++;
    const results = {
      crossCheck: this._crossCheck(distilled),
      counterfactual: this._counterfactualTest(trajectoryId, distilled),
      consistencyAudit: this._consistencyAudit(distilled),
      finalVerdict: 'pending',
      issues: [],
    };

    results.issues.push(...results.crossCheck.issues);
    results.issues.push(...results.counterfactual.issues);
    results.issues.push(...results.consistencyAudit.issues);

    const score =
      results.crossCheck.score * 0.35 +
      results.counterfactual.score * 0.35 +
      results.consistencyAudit.score * 0.30;

    results.finalScore = +score.toFixed(3);

    if (results.issues.length > 0 && results.issues.some(i => i.severity === 'critical')) {
      results.finalVerdict = 'rejected';
    } else if (score >= this._config.verifyThreshold) {
      results.finalVerdict = 'passed';
    } else {
      results.finalVerdict = 'rejected';
    }

    if (results.finalVerdict === 'passed') {
      this._verifiedExperiences.push({ distilled, verification: results });
      this._validationStats.passed++;
    } else {
      this._rejectedExperiences.push({ distilled, verification: results });
      this._validationStats.rejected++;

      if (distilled.claimedSuccess && results.finalScore < 0.5) {
        this._validationStats.selfConfirmationTraps++;
      }
    }

    return results;
  }

  _crossCheck(distilled) {
    const issues = [];
    let score = 1.0;

    if (distilled.claimedSuccess && distilled.errorPoints.length > 0) {
      issues.push({
        type: 'self_confirmation_trap',
        severity: 'critical',
        message: 'Claimed success but error points exist — possible self-confirmation trap',
      });
      score -= 0.5;
    }

    const avgConf = distilled.confidenceDistribution.avg;
    if (distilled.claimedSuccess && avgConf < 0.4) {
      issues.push({
        type: 'low_confidence_claim',
        severity: 'major',
        message: `Claimed success with low average confidence (${avgConf})`,
      });
      score -= 0.2;
    }

    for (let i = 0; i < this._config.crossCheckRounds && i < distilled.keyDecisions.length; i++) {
      const d = distilled.keyDecisions[i];
      if (d.confidence > 0.8 && d.result && String(d.result).toLowerCase().includes('error')) {
        issues.push({
          type: 'overconfidence_error',
          severity: 'major',
          message: `High confidence (${d.confidence}) decision resulted in error`,
        });
        score -= 0.15;
      }
    }

    return { score: Math.max(0, score), issues, method: 'cross_check' };
  }

  _counterfactualTest(trajectoryId, distilled) {
    const issues = [];
    let score = 0.8;

    const claimedSuccess = distilled.claimedSuccess;
    const hadErrors = distilled.errorPoints.length > 0;

    if (!claimedSuccess && hadErrors) {
      issues.push({
        type: 'honest_failure',
        severity: 'info',
        message: 'Agent correctly identified failure — positive signal',
      });
    } else if (claimedSuccess && !hadErrors) {
      issues.push({
        type: 'clean_success',
        severity: 'info',
        message: 'Clean success with no errors detected',
      });
      score = 1.0;
    } else if (claimedSuccess && hadErrors) {
      issues.push({
        type: 'discrepancy',
        severity: 'critical',
        message: 'Claims success but has errors — counterfactual: would it still succeed if errors were fixed?',
      });
      score -= 0.4;
    }

    return { score: Math.max(0, score), issues, method: 'counterfactual' };
  }

  _consistencyAudit(distilled) {
    const issues = [];
    let score = 0.8;

    const decisions = distilled.keyDecisions;
    const results = decisions.map(d => d.result);
    const uniqueResults = new Set(results.map(r => String(r).slice(0, 50)));

    if (decisions.length > 5 && uniqueResults.size === 1) {
      issues.push({
        type: 'uniform_results',
        severity: 'major',
        message: 'All steps produced identical results — possible stub/replay',
      });
      score -= 0.3;
    }

    const confidenceVariance = this._variance(decisions.map(d => d.confidence || 0));
    if (decisions.length > 3 && confidenceVariance < 0.01) {
      issues.push({
        type: 'flat_confidence',
        severity: 'minor',
        message: 'Uniform confidence across all decisions — unlikely in real execution',
      });
      score -= 0.1;
    }

    return { score: Math.max(0, score), issues, method: 'consistency_audit' };
  }

  _variance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  }

  // ─── API ─────────────────────────────────────────────────────

  /**
   * 完整验证流程：记录轨迹 → 蒸馏 → 验证
   */
  validate(trajectory) {
    const recorded = this.recordTrajectory(trajectory);
    const distilled = this.distill(recorded);
    const result = this.verify(recorded.id, distilled);
    return { trajectoryId: recorded.id, distilled, verification: result };
  }

  getStats() {
    return {
      ...this._validationStats,
      trapRate: this._validationStats.total > 0
        ? (this._validationStats.selfConfirmationTraps / this._validationStats.total).toFixed(3)
        : 0,
      verifiedCount: this._verifiedExperiences.length,
      rejectedCount: this._rejectedExperiences.length,
    };
  }

  getVerifiedExperiences() {
    return [...this._verifiedExperiences];
  }

  getRejectedExperiences() {
    return [...this._rejectedExperiences];
  }
}

module.exports = { ExperienceValidator };
