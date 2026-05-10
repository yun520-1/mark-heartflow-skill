/**
 * Skill Ecosystem Module v11.39.0
 * 
 * 来源:
 * - SkillOS: arXiv:2605.06614 — RL curator with composite rewards
 * - Skill1: arXiv:2605.06130 — unified selection-utilization-distillation
 * - Skills as Verifiable Artifacts: arXiv:2605.00424 — biconditional correctness + trust schema
 * - SkillGuard-Robust: arXiv:2604.25109 — 97.30% exact match three-way classification
 * - MESA-S: arXiv:2604.16753 — delayed appraisal + epistemic vigilance
 * - EvoSkill: arXiv:2603.02766 — Pareto-frontier skill selection
 * - SkillOrchestra: arXiv:2602.19672 — 700x cheaper than RL routing
 * 
 * v11.39.0 升级:
 * - 7个新模块全部转JS并集成
 */

// ============================================================
// 1. SkillOS RL CURATOR
// ============================================================
class SkillOSCurator {
  constructor(skillRepo = {}) {
    this.skillRepo = skillRepo;
    this.curationLog = [];
  }

  compositeReward(taskScore, groupImprovement, alpha = 0.6) {
    return alpha * taskScore + (1 - alpha) * groupImprovement;
  }

  curate(experienceBatch, executorFn) {
    for (const exp of experienceBatch) {
      const taskId = exp.task_id;
      const trajectory = exp.trajectory || [];
      const outcomeScore = executorFn(trajectory);

      if (outcomeScore > this._threshold(Object.keys(this.skillRepo).length)) {
        const skillEntry = this._distill(trajectory, outcomeScore);
        this.skillRepo[taskId] = skillEntry;
        this.curationLog.push({ taskId, score: outcomeScore, action: 'added' });
      }
    }
    return this.skillRepo;
  }

  _threshold(repoSize) {
    return 0.5 + 0.1 * Math.min(repoSize / 50, 1.0);
  }

  _distill(trajectory, score) {
    const steps = trajectory.filter(s => s.success).map(s => s.action || String(s));
    return {
      markdown: `# Skill\nScore: ${score.toFixed(3)}\nSteps:\n` + steps.map(s => `- ${s}`).join('\n'),
      score,
      timestamp: Date.now()
    };
  }
}

// ============================================================
// 2. Skill1 UNIFIED POLICY
// ============================================================
class Skill1UnifiedPolicy {
  constructor() {
    this.skillLibrary = {};
    this.trendHistory = [];
  }

  decomposeSignal(taskOutcomes, window = 5) {
    if (taskOutcomes.length < window) {
      return {
        selection_credit: taskOutcomes.length > 0
          ? taskOutcomes.reduce((a, b) => a + b, 0) / taskOutcomes.length : 0,
        distillation_credit: 0.0
      };
    }
    const windowSlice = taskOutcomes.slice(-window);
    const trend = windowSlice.reduce((a, b) => a + b, 0) / window;
    const variation = taskOutcomes[taskOutcomes.length - 1] - trend;
    return { selection_credit: trend, distillation_credit: variation };
  }

  queryAndRerank(taskEmbedding, candidates) {
    let bestSkill = null;
    let bestScore = -Infinity;
    for (const skillName of candidates) {
      const skill = this.skillLibrary[skillName] || {};
      const baseScore = skill.avg_score || 0.5;
      if (baseScore > bestScore) {
        bestScore = baseScore;
        bestSkill = skillName;
      }
    }
    return bestSkill || (candidates.length > 0 ? candidates[0] : null);
  }

  distillFromTrajectory(trajectory, outcome, skillName) {
    const steps = trajectory.filter(s => typeof s === 'string');
    this.skillLibrary[skillName] = {
      markdown: steps.join('\n'),
      avg_score: outcome,
      use_count: (this.skillLibrary[skillName]?.use_count || 0) + 1
    };
  }
}

// ============================================================
// 3. SKILL VERIFICATION GATE (Biconditional Correctness)
// ============================================================
const VERIFICATION_LEVELS = ['none', 'self_attested', 'community_reviewed', 'formally_verified'];

class SkillVerificationGate {
  constructor() {
    this.verificationDb = {};
  }

  setVerification(skillName, level, proofHash = null) {
    if (!VERIFICATION_LEVELS.includes(level)) {
      throw new Error(`Invalid level: ${level}`);
    }
    this.verificationDb[skillName] = {
      level,
      proof_hash: proofHash,
      verified_at: Date.now()
    };
  }

  biconditionalCheck(claim, evidence) {
    const forward = this._entails(claim, evidence);
    const backward = this._entails(evidence, claim);
    return forward && backward;
  }

  gateDecision(skillName, callType) {
    const v = this.verificationDb[skillName] || { level: 'none' };
    const levelIdx = VERIFICATION_LEVELS.indexOf(v.level);
    if (callType === 'irreversible' && levelIdx < 2) {
      return 'HITL_REQUIRED';
    }
    return 'AUTO_APPROVED';
  }

  _entails(a, b) {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    if (aWords.size === 0) return true;
    const intersection = [...aWords].filter(w => bWords.has(w)).length;
    return intersection / aWords.size >= 0.3;
  }
}

// ============================================================
// 4. SkillGuard-Robust THREE-WAY CLASSIFIER
// ============================================================
class SkillGuardRobust {
  constructor() {
    this.auditLog = [];
    this.MALICIOUS_PATTERNS = [
      { pattern: /rm\s+-rf\s+\//gi, severity: 'critical' },
      { pattern: /curl.*\|.*sh/gi, severity: 'critical' },
      { pattern: /eval\s*\(/gi, severity: 'critical' },
      { pattern: /subprocess\.(call|Popen)/gi, severity: 'critical' },
      { pattern: /os\.system\s*\(/gi, severity: 'high' },
      { pattern: /requests\.(post|get).*http/gi, severity: 'medium' },
      { pattern: /exec\s*\(/gi, severity: 'critical' },
      { pattern: /__import__\s*\(/gi, severity: 'critical' },
    ];
  }

  classify(skillContent) {
    const evidence = [];
    let maxSeverity = 'none';

    for (const { pattern, severity } of this.MALICIOUS_PATTERNS) {
      const matches = (skillContent || '').match(pattern) || [];
      if (matches.length > 0) {
        evidence.push({ pattern: pattern.toString(), severity, matches: matches.slice(0, 3) });
        if (severity === 'critical') maxSeverity = 'critical';
        else if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
        else if (severity === 'medium' && maxSeverity === 'none') maxSeverity = 'medium';
      }
    }

    let classification, confidence;
    if (maxSeverity === 'critical' || maxSeverity === 'high') {
      classification = 'malicious';
      confidence = maxSeverity === 'critical' ? 0.95 : 0.85;
    } else if (maxSeverity === 'medium') {
      classification = 'suspicious';
      confidence = 0.70;
    } else {
      classification = 'benign';
      confidence = 0.90;
    }

    const result = { classification, confidence, evidence };
    this.auditLog.push(result);
    return result;
  }

  consistencyAdjudication(results) {
    const votes = { benign: 0, suspicious: 0, malicious: 0 };
    for (const r of results) {
      const cls = r.classification || 'benign';
      votes[cls] = (votes[cls] || 0) + 1;
    }
    const total = Object.values(votes).reduce((a, b) => a + b, 0);
    const maxClass = Object.entries(votes).reduce((a, b) => b[1] > a[1] ? b : a, ['benign', 0])[0];
    return {
      consensus: maxClass,
      agreement_ratio: total > 0 ? votes[maxClass] / total : 1.0,
      votes
    };
  }
}

// ============================================================
// 5. MESA-S METACOGNITIVE GATE
// ============================================================
class MESASMetacognitiveGate {
  constructor(probeThreshold = 0.6) {
    this.probeThreshold = probeThreshold;
    this.skillTrustScores = {};
  }

  vectorConfidence(parametricConfidence, sourceTrust) {
    return [parametricConfidence, sourceTrust];
  }

  delayedProbe(skillName, skillSummary, taskContext) {
    const relevance = this._semanticMatch(skillSummary || '', taskContext || '');
    const trust = this.skillTrustScores[skillName] || 0.5;
    return relevance > this.probeThreshold && trust > 0.3;
  }

  updateTrust(skillName, outcomeSuccess) {
    const prior = this.skillTrustScores[skillName] || 0.5;
    const likelihood = outcomeSuccess ? 0.8 : 0.2;
    const posterior = (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood));
    this.skillTrustScores[skillName] = posterior;
  }

  _semanticMatch(summary, context) {
    const sWords = new Set((summary || '').toLowerCase().split(/\s+/).filter(w => w.length > 1));
    const cWords = new Set((context || '').toLowerCase().split(/\s+/).filter(w => w.length > 1));
    if (sWords.size === 0) return 0.0;
    const intersection = [...sWords].filter(w => cWords.has(w)).length;
    return intersection / sWords.size;
  }
}

// ============================================================
// 6. EvoSkill PARETO SELECTOR
// ============================================================
class EvoSkillParetoSelector {
  constructor() {
    this.skillPool = {};
  }

  addCandidate(skillName, validationScore, complexity = 0.0) {
    this.skillPool[skillName] = { validation_score: validationScore, complexity };
  }

  paretoFilter() {
    const frontier = [];
    for (const [name, metrics] of Object.entries(this.skillPool)) {
      let dominated = false;
      for (const [otherName, otherMetrics] of Object.entries(this.skillPool)) {
        if (otherName === name) continue;
        // Check if other strictly dominates this
        if (otherMetrics.validation_score >= metrics.validation_score &&
            otherMetrics.complexity <= metrics.complexity) {
          if (otherMetrics.validation_score > metrics.validation_score ||
              otherMetrics.complexity < metrics.complexity) {
            dominated = true;
            break;
          }
        }
      }
      if (!dominated) frontier.push(name);
    }
    return frontier;
  }

  prune() {
    const frontier = this.paretoFilter();
    const pruned = {};
    for (const name of frontier) {
      pruned[name] = this.skillPool[name];
    }
    this.skillPool = pruned;
    return this.skillPool;
  }
}

// ============================================================
// 7. SkillOrchestra HANDBOOK
// ============================================================
class SkillOrchestraHandbook {
  constructor() {
    this.handbook = {};
  }

  recordExecution(agentName, skillName, success, costMs) {
    const key = `${agentName}::${skillName}`;
    if (!this.handbook[key]) {
      this.handbook[key] = { success_count: 0, total_count: 0, total_cost: 0 };
    }
    const entry = this.handbook[key];
    entry.total_count++;
    if (success) entry.success_count++;
    entry.total_cost += costMs;
  }

  getCompetence(agentName, skillName) {
    const key = `${agentName}::${skillName}`;
    const entry = this.handbook[key];
    if (!entry || entry.total_count === 0) return 0.5;
    return entry.success_count / entry.total_count;
  }

  getAvgCost(agentName, skillName) {
    const key = `${agentName}::${skillName}`;
    const entry = this.handbook[key];
    if (!entry || entry.total_count === 0) return 100.0;
    return entry.total_cost / entry.total_count;
  }

  selectAgent(skillName, agents, costWeight = 0.3) {
    let bestAgent = null;
    let bestUtility = -Infinity;
    const costs = agents.map(a => this.getAvgCost(a, skillName));
    const maxCost = Math.max(...costs, 1);

    for (const agent of agents) {
      const competence = this.getCompetence(agent, skillName);
      const normCost = this.getAvgCost(agent, skillName) / maxCost;
      const utility = competence - costWeight * normCost;
      if (utility > bestUtility) {
        bestUtility = utility;
        bestAgent = agent;
      }
    }
    return bestAgent || agents[0];
  }
}

// ============================================================
// Integration Bridge
// ============================================================
class SkillEcosystemBridge {
  constructor() {
    this.skillOS = new SkillOSCurator();
    this.skill1 = new Skill1UnifiedPolicy();
    this.verificationGate = new SkillVerificationGate();
    this.skillGuard = new SkillGuardRobust();
    this.mesaS = new MESASMetacognitiveGate(0.6);
    this.evoSkill = new EvoSkillParetoSelector();
    this.orchestra = new SkillOrchestraHandbook();
    this.stats = { preLoadAudits: 0, probes: 0, selections: 0 };
  }

  preLoadAudit(skillName, skillContent) {
    this.stats.preLoadAudits++;
    const guardResult = this.skillGuard.classify(skillContent);
    this.verificationGate.setVerification(
      skillName,
      guardResult.classification === 'benign' ? 'community_reviewed' : 'none'
    );
    const gateAction = this.verificationGate.gateDecision(skillName, 'load');
    return {
      guard: guardResult,
      gate_action: gateAction,
      load_allowed: gateAction === 'AUTO_APPROVED'
    };
  }

  metacognitiveProbe(skillName, skillSummary, taskContext) {
    this.stats.probes++;
    return this.mesaS.delayedProbe(skillName, skillSummary, taskContext);
  }

  selectOrDistill(task, candidates, trajectory = null, outcome = null) {
    this.stats.selections++;
    const skill = this.skill1.queryAndRerank(task, candidates);
    if (!skill && trajectory && outcome && outcome > 0.7) {
      const newSkill = `distilled_${Math.abs(this._hash(task)) % 10000}`;
      this.skill1.distillFromTrajectory(trajectory, outcome, newSkill);
      return newSkill;
    }
    return skill;
  }

  paretoMaintain() {
    return this.evoSkill.prune();
  }

  routeTask(skillName, task, agents) {
    const agent = this.orchestra.selectAgent(skillName, agents);
    return { selected_agent: agent, skill: skillName, task };
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h;
  }
}

module.exports = {
  SkillOSCurator,
  Skill1UnifiedPolicy,
  SkillVerificationGate,
  SkillGuardRobust,
  MESASMetacognitiveGate,
  EvoSkillParetoSelector,
  SkillOrchestraHandbook,
  SkillEcosystemBridge,
  VERIFICATION_LEVELS
};
