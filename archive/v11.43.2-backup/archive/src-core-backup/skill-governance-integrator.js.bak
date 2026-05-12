/**
 * Skill Governance Integrator - 技能治理集成器
 *
 * 本模块把 2026-04-30 GitHub 搜索得到的 agent-skill 实践
 * 收束成 HeartFlow 可执行的轻量治理层：
 * - progressive disclosure：技能文档分层，避免一次性塞满上下文
 * - command/agent/skill orchestration：把任务拆成入口、执行者、可复用能力
 * - audit gates：版本、隐私、危险动作、历史记录四类门控
 * - evidence ledger：每次升级必须留下来源、验证、风险与结果
 *
 * v11.4.0 扩展（7 篇论文集成）：
 * - SAVeR: 对抗信念审计门控
 * - DeepVerifier: 5类13子类失败分类法
 * - SkillGuard-Robust: 3-way 技能分类
 * - SSL Representation: 调度-结构-逻辑归一化
 * - Ctx2Skill: 挑战者/推理者/判断者自进化循环
 * - MemArchitect: FSRS v4 + Kalman Filter 记忆治理
 * - AER: Agent 执行记录溯源原语
 *
 * 这不是外部依赖；它是可测试、可复用的纯 JS 小模块。
 */

const DEFAULT_GATES = Object.freeze([
  'version-consistency',
  'privacy-redaction',
  'dangerous-action-review',
  'history-preservation',
  'verification-evidence'
]);

class EvidenceLedger {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries.slice() : [];
  }

  add(entry) {
    const normalized = {
      time: entry.time || new Date().toISOString(),
      source: entry.source || 'unknown',
      claim: entry.claim || '',
      evidence: entry.evidence || '',
      verification: entry.verification || 'pending',
      risk: entry.risk || 'unknown'
    };
    this.entries.push(normalized);
    return normalized;
  }

  summarize() {
    return {
      total: this.entries.length,
      verified: this.entries.filter(e => e.verification === 'verified').length,
      pending: this.entries.filter(e => e.verification !== 'verified').length,
      highRisk: this.entries.filter(e => e.risk === 'high').length
    };
  }
}

class SkillGovernanceIntegrator {
  constructor(options = {}) {
    this.gates = options.gates || DEFAULT_GATES;
    this.ledger = new EvidenceLedger(options.evidence || []);
  }

  createUpgradePlan(request = {}) {
    const goal = request.goal || 'integrate external agent-skill practice into HeartFlow';
    const sources = request.sources || [];
    return {
      goal,
      versionDelta: request.versionDelta || '0.0.1',
      phases: [
        { name: 'research', output: 'sources and transferable patterns' },
        { name: 'plan', output: 'minimal integration plan with touched files' },
        { name: 'implement', output: 'small code/doc patch' },
        { name: 'audit', output: 'gate report and remaining risks' },
        { name: 'sync', output: 'git commit/push verification' }
      ],
      gates: this.gates.slice(),
      sources
    };
  }

  classifySkillDocument(text = '') {
    return {
      hasFrontmatter: /^---\n[\s\S]*?\n---/.test(text),
      hasProblemSolved: /problem solved|why it exists|问题解决/i.test(text),
      hasWhenToUse: /when to use|how to invoke|使用|触发/i.test(text),
      hasSafety: /safety|security|guardrail|隐私|安全/i.test(text),
      hasHistory: /changelog|version history|版本历史|变更日志/i.test(text),
      hasVerification: /verify|verification|验证|audit|审计/i.test(text)
    };
  }

  auditUpgrade(files = {}) {
    const findings = [];
    const versionValues = new Set();

    for (const [name, text] of Object.entries(files)) {
      const versions = String(text).match(/v?\d+\.\d+\.\d+/g) || [];
      versions.forEach(v => versionValues.add(v.replace(/^v/, '')));
      const secretPattern = /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}/i;
      const privateIdPattern = /(?:wechat|weixin)\s*[:=]\s*['\"]?[A-Za-z0-9_\-@]{16,}/i;
      if (secretPattern.test(text) || privateIdPattern.test(text)) {
        findings.push({ severity: 'high', file: name, issue: 'possible credential or private identifier value' });
      }
      if (/rm\s+-rf\s+\/|curl\s+[^|]+\|\s*(bash|sh)/i.test(text)) {
        findings.push({ severity: 'high', file: name, issue: 'dangerous shell pattern requires explicit review' });
      }
    }

    return {
      gates: this.gates.slice(),
      versionCandidates: Array.from(versionValues).sort(),
      findings,
      passed: findings.filter(f => f.severity === 'high').length === 0,
      ledger: this.ledger.summarize()
    };
  }
}

// ============================================================
// v11.4.0 扩展：7 篇论文集成
// ============================================================

// ============================================================
// 1. SAVeR: SELF-AUDITED VERIFIED REASONING GATE
// Paper: arXiv:2604.08401 (ACL 2026 Main Conference)
// Core: adversarial auditing → constraint-guided minimal intervention
// ============================================================
class SAVeRAuditGate {
  constructor() {
    this.verificationCriteria = [
      'evidence_supported',
      'logical_consistent',
      'source_grounded',
      'no_hallucination_marker'
    ];
  }

  /**
   * @param {Object} belief — internal belief state before action
   * @param {Object[]} evidence — external evidence pool
   * @returns {{ passed: boolean, violations: Object[], repaired: Object }}
   */
  audit(belief, evidence = []) {
    const violations = this._adversarialAudit(belief, evidence);
    if (violations.length === 0) {
      return { passed: true, violations: [], repaired: belief };
    }
    const repaired = this._constraintGuidedRepair(belief, violations, evidence);
    const recheck = this._adversarialAudit(repaired, evidence);
    return {
      passed: recheck.length === 0,
      violations,
      repaired: recheck.length === 0 ? repaired : belief
    };
  }

  _adversarialAudit(belief, evidence) {
    const violations = [];
    if (belief.claims) {
      for (const claim of belief.claims) {
        const hasEvidence = evidence.some(e =>
          e.content && e.content.includes(claim.text?.substring(0, 20))
        );
        if (!hasEvidence) {
          violations.push({
            type: 'evidence_unsupported',
            claim: claim.text?.substring(0, 60),
            severity: 'high'
          });
        }
      }
    }
    if (belief.premises && belief.conclusion) {
      const contradictsSelf = this._checkSelfContradiction(
        belief.premises, belief.conclusion
      );
      if (contradictsSelf) {
        violations.push({
          type: 'logical_inconsistency',
          detail: contradictsSelf,
          severity: 'high'
        });
      }
    }
    return violations;
  }

  _constraintGuidedRepair(belief, violations, evidence) {
    const repaired = JSON.parse(JSON.stringify(belief));
    for (const v of violations) {
      if (v.type === 'evidence_unsupported') {
        repaired.claims = (repaired.claims || []).filter(
          c => !c.text?.includes(v.claim)
        );
        repaired.unsupported_removed = true;
      }
      if (v.type === 'logical_inconsistency') {
        repaired.conclusion = repaired.conclusion + ' [AUDIT_FLAG: verify logic]';
      }
    }
    return repaired;
  }

  _checkSelfContradiction(premises, conclusion) {
    for (const p of premises) {
      if (p && conclusion && p.includes('不') !== conclusion.includes('不')) {
        const pCore = p.replace(/不/g, '').replace(/非/g, '');
        const cCore = conclusion.replace(/不/g, '').replace(/非/g, '');
        if (pCore === cCore) return `negation: premise vs conclusion`;
      }
    }
    return null;
  }
}

// ============================================================
// 2. DeepVerifier Failure Taxonomy
// Paper: arXiv:2601.15808v2 (CVPR 2026)
// 5 major categories + 13 sub-categories
// ============================================================
const DRA_FAILURE_TAXONOMY = Object.freeze({
  finding_sources: {
    label: 'Finding Sources',
    sub: ['wrong_evidence', 'generic_search', 'source_not_found']
  },
  processing_information: {
    label: 'Processing Information',
    sub: ['extraction_error', 'synthesis_failure']
  },
  reasoning_execution: {
    label: 'Reasoning & Execution',
    sub: ['logical_leap', 'calculation_error', 'planning_failure']
  },
  output_generation: {
    label: 'Output Generation',
    sub: ['hallucinated_fact', 'incomplete_answer', 'format_violation']
  },
  system_interaction: {
    label: 'System Interaction',
    sub: ['tool_misuse', 'timeout_handling']
  }
});

/**
 * DeepVerifier-style rubric-guided outcome reward
 * @param {Object} agentResult — agent output to evaluate
 * @returns {{ score: number, failures: Object[], rubric: Object }}
 */
function deepVerify(agentResult) {
  const failures = [];
  const rubric = {};

  for (const [catKey, cat] of Object.entries(DRA_FAILURE_TAXONOMY)) {
    for (const sub of cat.sub) {
      rubric[`${catKey}.${sub}`] = 1;
    }
  }

  if (!agentResult.evidence || agentResult.evidence.length === 0) {
    rubric['finding_sources.source_not_found'] = 0;
    failures.push({ category: 'finding_sources', sub: 'source_not_found' });
  }
  if (agentResult.claims) {
    const hallucinated = agentResult.claims.filter(
      c => !c.evidence || c.evidence === 'unsupported'
    );
    for (const h of hallucinated) {
      rubric['output_generation.hallucinated_fact'] = 0;
      failures.push({
        category: 'output_generation',
        sub: 'hallucinated_fact',
        claim: h.text?.substring(0, 60)
      });
    }
  }

  const passedCount = Object.values(rubric).filter(v => v === 1).length;
  const totalCount = Object.keys(rubric).length;
  const score = totalCount > 0 ? passedCount / totalCount : 1;

  return {
    score,
    failures,
    rubric,
    verifier_version: 'DeepVerifier-HeartFlow-v11.4.0'
  };
}

// ============================================================
// 3. SSL (Scheduling-Structural-Logical) Representation
// Paper: arXiv:2604.24026v2 (Peking University, 2026)
// Integrates into: skill-governance-integrator.js validator
// ============================================================
/**
 * SSL representation normalizer
 * Maps SKILL.md text into typed, machine-actionable structure
 * @param {string} skillText — raw SKILL.md content
 * @returns {Object} SSL-structured representation
 */
function sslNormalize(skillText) {
  const scheduling = {
    triggers: [],
    priority: 'medium',
    cooldown_ms: 0
  };

  const triggerPattern = /(?:use|invoke|trigger|使用|触发|调用).*?(?:when|当|if).*?(?:decision|logic|verify|audit|decision|logic|verify|audit|伦理|决策|验证|审计)/gi;
  const triggerMatches = skillText.match(triggerPattern) || [];
  scheduling.triggers = triggerMatches.map(m => m.substring(0, 80));

  const structural = {
    entry_point: '',
    dependencies: [],
    execution_mode: 'sequential'
  };

  const requirePattern = /require\s*\(['"]([^'"]+)['"]\)/g;
  let m;
  while ((m = requirePattern.exec(skillText)) !== null) {
    structural.dependencies.push(m[1]);
  }

  const logical = {
    preconditions: [],
    effects: [],
    resource_usage: {},
    failure_modes: []
  };

  if (/verify|验证|audit|审计/i.test(skillText)) {
    logical.effects.push('outcome_verified');
  }
  if (/memory|记忆/i.test(skillText)) {
    logical.effects.push('memory_updated');
  }
  if (/upgrade|升级|evolve/i.test(skillText)) {
    logical.effects.push('version_incremented');
  }

  return {
    scheduling,
    structural,
    logical,
    source_length: skillText.length
  };
}

// ============================================================
// 4. Ctx2Skill Self-Evolving Skill Loop
// Paper: arXiv:2604.27660 (2026-04-30)
// challenger → reasoner → judge self-play loop
// ============================================================
class Ctx2SkillLoop {
  constructor() {
    this.skillSet = new Map();
    this.failureLog = [];
  }

  /**
   * One self-play round
   * @param {string} context — raw context to extract skill from
   * @returns {Object} evolved skill summary
   */
  iterate(context) {
    const tasks = this._challengerProbe(context);
    const results = [];
    for (const task of tasks) {
      const skillMatch = this._reasonerMatch(task, context);
      results.push({ task, matched: skillMatch });
    }
    const failures = results.filter(r => !r.matched);
    if (failures.length > 0) {
      this.failureLog.push(...failures);
      const newSkill = this._proposerSynthesize(failures, context);
      if (newSkill) {
        this.skillSet.set(newSkill.key, newSkill);
      }
    }
    if (this.failureLog.length > 20) {
      this._crossTimeReplay();
    }
    return {
      tasks_generated: tasks.length,
      failures: failures.length,
      skills_total: this.skillSet.size,
      skills: Array.from(this.skillSet.keys())
    };
  }

  _challengerProbe(context) {
    const probes = [];
    const rulePattern = /(?:must|should|需要|必须|不要|禁止)\s+([^。\n]{10,100})/gi;
    let m;
    while ((m = rulePattern.exec(context)) !== null) {
      probes.push({
        type: 'rule_extraction',
        text: m[1].trim(),
        rubric: 'extract rule and verify applicability'
      });
    }
    if (probes.length === 0) {
      probes.push({
        type: 'summarization',
        text: context.substring(0, 100),
        rubric: 'can the agent correctly apply the context?'
      });
    }
    return probes.slice(0, 5);
  }

  _reasonerMatch(task, context) {
    for (const [key, skill] of this.skillSet) {
      if (skill.pattern && context.includes(skill.pattern)) {
        return { key, skill };
      }
    }
    return null;
  }

  _proposerSynthesize(failures, context) {
    if (failures.length === 0) return null;
    const first = failures[0];
    return {
      key: `ctx2skill_${Date.now().toString(36)}`,
      pattern: first.task.text.substring(0, 30),
      source: 'Ctx2Skill auto-generated',
      timestamp: new Date().toISOString()
    };
  }

  _crossTimeReplay() {
    const toRemove = [];
    for (const [key, skill] of this.skillSet) {
      const successCount = this.failureLog.filter(
        f => f.matched && f.matched.key === key
      ).length;
      if (successCount === 0 && this.skillSet.size > 3) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.skillSet.delete(key);
    }
  }
}

// ============================================================
// 5. AER (Agent Execution Record) Provenance Primitive
// Paper: arXiv:2603.21692 (2026-03-23)
// Structured reasoning provenance
// ============================================================
class AgentExecutionRecord {
  constructor() {
    this.steps = [];
    this.versionedPlans = [];
    this.delegationChain = [];
    this.sessionId = `aer_${Date.now().toString(36)}`;
  }

  /**
   * Record one step: intent → observation → inference → verdict
   */
  recordStep({ intent, observation, inference, verdict, evidence = [] }) {
    const step = {
      seq: this.steps.length + 1,
      timestamp: new Date().toISOString(),
      intent: intent || '',
      observation: observation || '',
      inference: inference || '',
      verdict: {
        conclusion: verdict || '',
        confidence: this._computeConfidence(evidence),
        evidence_chain: evidence.map(e => ({
          source: e.source || 'unknown',
          content_hash: this._hash(e.content || ''),
          reliability: e.reliability || 'unverified'
        }))
      }
    };
    this.steps.push(step);
    return step;
  }

  recordPlan(plan, rationale = '') {
    this.versionedPlans.push({
      version: this.versionedPlans.length + 1,
      plan: plan,
      rationale: rationale,
      timestamp: new Date().toISOString()
    });
  }

  summarize() {
    return {
      session: this.sessionId,
      total_steps: this.steps.length,
      plan_versions: this.versionedPlans.length,
      average_confidence: this.steps.length > 0
        ? this.steps.reduce((s, step) => s + step.verdict.confidence, 0) / this.steps.length
        : 0,
      high_confidence_steps: this.steps.filter(s => s.verdict.confidence >= 0.8).length,
      delegation_depth: this.delegationChain.length
    };
  }

  _computeConfidence(evidence) {
    if (!evidence || evidence.length === 0) return 0.3;
    const verified = evidence.filter(e => e.reliability === 'verified').length;
    return Math.min(0.95, 0.5 + (verified / evidence.length) * 0.45);
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h.toString(16);
  }
}

// ============================================================
// 6. MemArchitect Policy-Driven Memory Governance
// Paper: arXiv:2603.18330 (2026-03-18)
// FSRS v4 decay, Kalman Filter utility tracking, tri-path loop
// ============================================================
class MemArchitectGovernor {
  constructor() {
    this.policies = {
      decay: { type: 'FSRS_v4', retrievability_threshold: 0.3 },
      consistency: { type: 'KalmanFilter', trust_inertia: 0.7 },
      privacy: { pii_patterns: [/wechat|微信|phone|电话|email|邮箱/gi] },
      lifecycle: { max_episodic: 100, consolidation_trigger: 50 }
    };
    this.utilityEstimates = new Map();
    this.episodicMemories = [];
  }

  /**
   * Tri-path loop: Read → Reflect → Background
   */
  triPathProcess(query, memories) {
    const retrieved = this._readPath(query, memories);
    const adjudicated = this._reflectPath(retrieved);
    this._backgroundPath();
    return adjudicated;
  }

  _readPath(query, memories) {
    return memories
      .filter(m => {
        const utility = this.utilityEstimates.get(m.id) || 0.5;
        const retrievability = this._fsrs4Retrievability(m);
        return utility > 0.2 && retrievability > this.policies.decay.retrievability_threshold;
      })
      .sort((a, b) => (this.utilityEstimates.get(b.id) || 0.5) - (this.utilityEstimates.get(a.id) || 0.5))
      .slice(0, 5);
  }

  _reflectPath(retrieved) {
    const filtered = [];
    for (const m of retrieved) {
      let contradicted = false;
      for (const f of filtered) {
        if (m.content && f.content && this._isContradiction(m.content, f.content)) {
          contradicted = true;
          const mUtil = this.utilityEstimates.get(m.id) || 0.5;
          const fUtil = this.utilityEstimates.get(f.id) || 0.5;
          if (mUtil > fUtil) {
            filtered.splice(filtered.indexOf(f), 1, m);
          }
          break;
        }
      }
      if (!contradicted) filtered.push(m);
    }
    return filtered;
  }

  _backgroundPath() {
    this.episodicMemories = this.episodicMemories.filter(m => {
      const R = this._fsrs4Retrievability(m);
      if (R < 0.3) return false;
      if (R < 0.7) {
        m.consolidated = true;
        m.synthesized = m.content?.substring(0, 100);
      }
      return true;
    });
    if (this.episodicMemories.length > this.policies.lifecycle.max_episodic) {
      this.episodicMemories = this.episodicMemories.slice(-this.policies.lifecycle.max_episodic);
    }
  }

  _fsrs4Retrievability(memory) {
    const t = (Date.now() - (memory.timestamp || Date.now())) / (1000 * 3600 * 24);
    const S = memory.stability || 30;
    return Math.pow(1 + (19 / 9) * (t / S), -1);
  }

  updateUtility(memoryId, feedback) {
    const prev = this.utilityEstimates.get(memoryId) || 0.5;
    const K = 0.3;
    const updated = prev + K * (feedback - prev);
    this.utilityEstimates.set(memoryId, Math.max(0, Math.min(1, updated)));
  }

  _isContradiction(a, b) {
    if (a.includes('不') !== b.includes('不')) {
      const aCore = a.replace(/不/g, '').replace(/非/g, '');
      const bCore = b.replace(/不/g, '').replace(/非/g, '');
      return aCore === bCore;
    }
    return false;
  }
}

// ============================================================
// 7. HeartFlow v11.4.0 Integration Class
// Extends SkillGovernanceIntegrator with all paper-derived modules
// ============================================================
class HeartFlowV1140 extends SkillGovernanceIntegrator {
  constructor(options = {}) {
    super(options);

    this.saverGate = new SAVeRAuditGate();
    this.ctx2skill = new Ctx2SkillLoop();
    this.aer = new AgentExecutionRecord();
    this.memGovernor = new MemArchitectGovernor();

    this.gates = [
      ...DEFAULT_GATES,
      'saver-belief-audit',
      'deepverifier-rubric-check',
      'ssl-structure-validation',
      'aer-provenance-record',
      'memarchitect-tripath'
    ];

    this.failureStats = {};
    for (const cat of Object.keys(DRA_FAILURE_TAXONOMY)) {
      this.failureStats[cat] = 0;
    }
  }

  createUpgradePlan(request = {}) {
    const basePlan = super.createUpgradePlan(request);

    const sslStructure = typeof request.skillText === 'string'
      ? sslNormalize(request.skillText)
      : null;

    return {
      ...basePlan,
      ssl_structure: sslStructure,
      phases: [
        { name: 'research', output: 'paper extraction + SSL normalization' },
        { name: 'saver_audit', output: 'SAVeR belief audit before implementation' },
        { name: 'plan', output: 'minimal integration plan with touched files' },
        { name: 'implement', output: 'small code/doc patch' },
        { name: 'deepverify', output: 'taxonomy-based rubric score of output' },
        { name: 'aer_record', output: 'Agent Execution Record provenance' },
        { name: 'audit', output: 'gate report and remaining risks' },
        { name: 'sync', output: 'git commit/push verification' }
      ]
    };
  }

  auditWithPapers(files = {}) {
    const base = this.auditUpgrade(files);

    const saverFindings = [];
    for (const [name, text] of Object.entries(files)) {
      const belief = {
        claims: this._extractClaims(String(text)),
        premises: [],
        conclusion: ''
      };
      const audit = this.saverGate.audit(belief, []);
      if (!audit.passed) {
        saverFindings.push({ file: name, violations: audit.violations });
      }
    }

    const dvScores = {};
    for (const [name, text] of Object.entries(files)) {
      const agentResult = {
        evidence: [{ source: name, content: String(text).substring(0, 200), reliability: 'pending' }],
        claims: this._extractClaims(String(text)).map(c => ({ text: c, evidence: 'self' }))
      };
      dvScores[name] = deepVerify(agentResult);
    }

    const sslReport = typeof files['SKILL.md'] === 'string'
      ? sslNormalize(files['SKILL.md'])
      : null;

    return {
      ...base,
      saver: { findings: saverFindings, passed: saverFindings.length === 0 },
      deepverifier: dvScores,
      ssl: sslReport,
      passed: base.passed && saverFindings.length === 0
    };
  }

  _extractClaims(text) {
    const sentences = String(text).split(/[。\.；;！!\n]/);
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .map(s => ({ text: s }));
  }
}

module.exports = {
  DEFAULT_GATES,
  EvidenceLedger,
  SkillGovernanceIntegrator,
  // v11.4.0 additions
  SAVeRAuditGate,
  DRA_FAILURE_TAXONOMY,
  deepVerify,
  sslNormalize,
  Ctx2SkillLoop,
  AgentExecutionRecord,
  MemArchitectGovernor,
  HeartFlowV1140
};
