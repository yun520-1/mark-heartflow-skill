/**
 * HeartFlow v11.42.0 — Skill Lifecycle
 * 10-operator lifecycle algebra + SkillForge + Skill1 + SkillOS
 *
 * Papers:
 * - SkillForge: arXiv:2604.08618v2 — failure→diagnose→optimize loop
 * - SkillOS: arXiv:2605.06614 — composite reward α·immediate + (1-α)·delayed_group
 * - Skill1: arXiv:2605.06130 — unified selection-utilization-distillation
 * - Dynamic Skills: openreview_cjU3YbcRr8 — 10-operator lifecycle algebra
 */

// ============================================================
// 10-OPERATOR LIFECYCLE ALGEBRA
// openreview_cjU3YbcRr8
// ============================================================
class SkillLifecycleAlgebra {
  /**
   * 10 operators: ADD, REFINE, MERGE, SPLIT, PRUNE,
   *                DISTILL, ABSTRACT, COMPOSE, REWRITE, RERANK
   */
  constructor(skills = {}) { this.skills = skills; }

  add(name, skill) { this.skills[name] = { ...skill, addedAt: Date.now() }; }

  refine(name, updater) {
    if (this.skills[name]) this.skills[name] = updater(this.skills[name]);
  }

  merge(source1, source2, targetName) {
    const s1 = this.skills[source1] || {};
    const s2 = this.skills[source2] || {};
    this.skills[targetName] = { ...s1, ...s2, mergedFrom: [source1, source2], mergedAt: Date.now() };
  }

  split(name, predicate) {
    const skill = this.skills[name];
    if (!skill) return {};
    const matched = {}, unmatched = {};
    Object.entries(skill).forEach(([k, v]) => {
      (predicate(k, v) ? matched : unmatched)[k] = v;
    });
    return { matched, unmatched };
  }

  prune(predicate) {
    Object.keys(this.skills)
      .filter(k => predicate(this.skills[k]))
      .forEach(k => delete this.skills[k]);
  }

  distill(name, trajectory, outcome) {
    this.skills[name] = {
      ...this.skills[name],
      distilledTrajectory: trajectory,
      qualityScore: outcome,
      distilledAt: Date.now()
    };
  }

  abstract(name) {
    const skill = this.skills[name];
    if (!skill) return null;
    return {
      triggers: skill.triggers || [],
      effects: skill.effects || [],
      entry_point: skill.entry_point || name,
      dependencies: [],
      execution_mode: 'abstracted'
    };
  }

  compose(names, config = {}) {
    return {
      components: names.map(n => this.skills[n]).filter(Boolean),
      orchestration: config.mode || 'sequential',
      composedAt: Date.now()
    };
  }

  rewrite(name, rewriterFn) {
    if (this.skills[name]) {
      const rewritten = rewriterFn(this.skills[name]);
      this.skills[name] = { ...this.skills[name], rewritten, rewrittenAt: Date.now() };
    }
  }

  rerank(queryEmbedding, scorer) {
    return Object.entries(this.skills)
      .map(([name, skill]) => ({ name, score: scorer(queryEmbedding, skill) }))
      .sort((a, b) => b.score - a.score);
  }
}

// ============================================================
// SKILLFORGE LOOP — failure→diagnose→optimize
// Paper: arXiv:2604.08618v2
// ============================================================
class SkillForgeLoop {
  constructor() {
    this.iteration = 0;
    this.diagnosisHistory = [];
  }

  /**
   * Analyze execution trace for failures
   */
  analyze(trace) {
    return trace
      .filter(s => s.status === 'failed')
      .map(s => ({ error: s.error || 'unknown', stepId: s.stepId }));
  }

  /**
   * Diagnose failure root causes
   */
  diagnose(failures) {
    return failures.map(f => ({
      cause: f.error,
      section: /logic|verify|claim|evidence/i.test(f.error) ? 'verification' : 'execution',
      severity: failures.length > 2 ? 'high' : 'medium'
    }));
  }

  /**
   * Optimize skill text based on diagnosis
   */
  optimize(skillText, diagnosis) {
    this.iteration++;
    const hardens = diagnosis
      .filter(d => d.severity === 'high')
      .map(d => `[SkillForge-v${this.iteration}]: ${d.section} hardened against ${d.cause}`)
      .join('\n');

    this.diagnosisHistory.push({ iteration: this.iteration, diagnosis, hardened: hardens });

    return skillText + '\n' + hardens;
  }

  getIteration() { return this.iteration; }
}

// ============================================================
// SKILL1 UNIFIED POLICY
// Paper: arXiv:2605.06130
// Single policy co-evolves: selection + utilization + distillation
// ============================================================
class Skill1UnifiedPolicy {
  constructor() {
    this.library = new Map();
  }

  /**
   * Signal decomposition: credit assignment for selection vs distillation
   */
  decomposeSignal(outcomes, window = 5) {
    if (outcomes.length < window) {
      return {
        selectionCredit: outcomes.reduce((a, b) => a + b, 0) / Math.max(outcomes.length, 1),
        distillationCredit: 0
      };
    }
    const trend = outcomes.slice(-window).reduce((a, b) => a + b, 0) / window;
    return {
      selectionCredit: trend,
      distillationCredit: outcomes[outcomes.length - 1] - trend
    };
  }

  /**
   * Query and rerank: select best skill by historical performance
   */
  queryAndRerank(embedding, candidates) {
    let best = null, bestScore = -Infinity;
    for (const name of candidates) {
      const skill = this.library.get(name) || { avgScore: 0.5 };
      if (skill.avgScore > bestScore) { bestScore = skill.avgScore; best = name; }
    }
    return best || (candidates[0] || null);
  }

  /**
   * Distill trajectory + outcome into skill
   */
  distill(name, trajectory, outcome) {
    const prev = this.library.get(name) || { useCount: 0, avgScore: 0.5 };
    const newCount = prev.useCount + 1;
    const newAvg = (prev.avgScore * prev.useCount + outcome) / newCount;
    this.library.set(name, {
      markdown: JSON.stringify(trajectory),
      avgScore: newAvg,
      useCount: newCount,
      lastUpdated: Date.now()
    });
  }

  getLibrary() { return this.library; }
}

// ============================================================
// SKILLOS CURATOR
// Paper: arXiv:2605.06614
// Composite reward: α·immediate + (1-α)·delayed_group
// ============================================================
class SkillOSCurator {
  /**
   * @param {number} alpha - weighting for immediate reward (0.6 default)
   */
  constructor(alpha = 0.6) {
    this.alpha = alpha;
    this.repo = new Map();
  }

  /**
   * Composite reward combining immediate and delayed group improvement
   */
  compositeReward(immediate, groupImprovement) {
    return this.alpha * immediate + (1 - this.alpha) * groupImprovement;
  }

  /**
   * Curate experiences using composite reward threshold
   */
  curate(experiences, executorFn) {
    const threshold = 0.5 + 0.1 * Math.min(this.repo.size / 50, 1);
    for (const exp of experiences) {
      const trajectory = exp.trajectory || [];
      const score = executorFn(trajectory);
      if (score > threshold) {
        this.repo.set(exp.taskId, {
          markdown: JSON.stringify(trajectory),
          score,
          timestamp: Date.now()
        });
      }
    }
    return this.repo;
  }

  getRepo() { return this.repo; }
}

module.exports = {
  SkillLifecycleAlgebra,
  SkillForgeLoop,
  Skill1UnifiedPolicy,
  SkillOSCurator
};
