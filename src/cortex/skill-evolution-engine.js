/**
 * Skill Evolution Engine — 技能自进化引擎
 *
 * 基于 arXiv:2607.01874 "SkillCoach: Self-Evolving Rubrics" 和
 * arXiv:2605.24117 "SkillEvolBench"
 *
 * 核心能力：
 *   1. Skill Assessment — 多维度技能评估（正确性/完整性/效率/鲁棒性）
 *   2. Rubric Evolution — 评估标准随使用自动进化
 *   3. Experience → Skill — 从 episodic 经验蒸馏为 procedural 技能
 *   4. Skill Composition — 技能组合与复用
 *
 * @version 1.0.0
 */

const crypto = require('crypto');

// === 技能/评分 Map 最大容量 ===
const MAX_CACHE_SIZE = 200;

/**
 * 带容量保护的 Map.set — 超出容量时淘汰最早插入的条目（LRU）
 * @param {Map} map - 目标 Map
 * @param {*} key - 键
 * @param {*} value - 值
 * @param {number} maxSize - 最大容量
 */
function _boundedSet(map, key, value, maxSize) {
  if (map.size >= maxSize && !map.has(key)) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
  map.set(key, value);
}

class SkillEvolutionEngine {
  constructor(options = {}) {
    this._config = {
      rubricDecay: options.rubricDecay || 0.95,
      evolutionThreshold: options.evolutionThreshold || 0.7,
      minExperienceForSkill: options.minExperienceForSkill || 5,
      maxSkills: options.maxSkills || 500,
      ...options,
    };

    this._skills = new Map();
    this._rubrics = new Map();
    this._skillUsageLog = [];
    this._experienceBuffer = [];
    this._stats = {
      totalSkills: 0,
      totalEvaluations: 0,
      evolutions: 0,
      compositions: 0,
      avgSkillScore: 0,
    };
  }

  // ─── Skill Registration ─────────────────────────────────────

  /**
   * 注册新技能
   */
  registerSkill(skill) {
    const id = skill.id || `skill_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = {
      id,
      name: skill.name || id,
      description: skill.description || '',
      category: skill.category || 'general',
      procedure: skill.procedure || [],       // 可执行步骤
      preconditions: skill.preconditions || [],
      postconditions: skill.postconditions || [],
      parameters: skill.parameters || {},
      rubric: this._createRubric(id),
      usageCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: Date.now(),
      lastUsed: null,
      version: '1.0.0',
    };

    _boundedSet(this._skills, id, entry, MAX_CACHE_SIZE);
    _boundedSet(this._rubrics, id, entry.rubric, MAX_CACHE_SIZE);
    this._stats.totalSkills++;
    return entry;
  }

  // ─── Rubric Creation ────────────────────────────────────────

  _createRubric(skillId) {
    return {
      skillId,
      version: '1.0.0',
      criteria: [
        { name: 'correctness', weight: 0.35, score: 0.5, threshold: 0.7 },
        { name: 'completeness', weight: 0.25, score: 0.5, threshold: 0.6 },
        { name: 'efficiency', weight: 0.20, score: 0.5, threshold: 0.6 },
        { name: 'robustness', weight: 0.20, score: 0.5, threshold: 0.5 },
      ],
      evolutionHistory: [],
      lastUpdated: Date.now(),
    };
  }

  // ─── Skill Evaluation ───────────────────────────────────────

  /**
   * 评估技能执行结果
   */
  evaluate(skillId, execution) {
    const skill = this._skills.get(skillId);
    if (!skill) return null;

    const rubric = this._rubrics.get(skillId);
    if (!rubric) return null;

    this._stats.totalEvaluations++;

    const scores = {};
    let totalWeight = 0;
    let weightedScore = 0;

    for (const criterion of rubric.criteria) {
      const score = this._scoreCriterion(criterion.name, execution);
      scores[criterion.name] = score;
      weightedScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const passed = overallScore >= rubric.criteria.reduce((min, c) => Math.min(min, c.threshold), 1);

    skill.usageCount++;
    if (passed) skill.successCount++;
    else skill.failureCount++;
    skill.lastUsed = Date.now();

    this._stats.avgSkillScore = +(
      (this._stats.avgSkillScore * (this._stats.totalEvaluations - 1) + overallScore) /
      this._stats.totalEvaluations
    ).toFixed(3);

    // 触发 Rubric 进化
    this._evolveRubric(skillId, overallScore, scores);

    return {
      skillId,
      overallScore: +overallScore.toFixed(3),
      passed,
      criteria: scores,
      rubric: rubric.version,
    };
  }

  _scoreCriterion(name, execution) {
    const { result, steps, timeMs, errors } = execution;

    switch (name) {
      case 'correctness':
        return result?.success ? 1.0 : 0.0;

      case 'completeness':
        const totalSteps = steps?.length || 0;
        const completedSteps = steps?.filter(s => s.completed)?.length || 0;
        return totalSteps > 0 ? completedSteps / totalSteps : 0.5;

      case 'efficiency':
        const maxTime = 30000;
        const actualTime = timeMs || 5000;
        return Math.max(0, 1 - actualTime / maxTime);

      case 'robustness':
        const errorCount = errors?.length || 0;
        return Math.max(0, 1 - errorCount * 0.2);

      default:
        return 0.5;
    }
  }

  // ─── Rubric Evolution ───────────────────────────────────────

  _evolveRubric(skillId, score, scores) {
    const rubric = this._rubrics.get(skillId);
    const skill = this._skills.get(skillId);
    if (!rubric || !skill) return;

    const historyEntry = {
      timestamp: Date.now(),
      score,
      criteria: { ...scores },
    };

    rubric.evolutionHistory.push(historyEntry);
    if (rubric.evolutionHistory.length > 50) rubric.evolutionHistory.shift();

    // 定期进化阈值
    const recentScores = rubric.evolutionHistory.slice(-10).map(h => h.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    if (avgRecent > this._config.evolutionThreshold && recentScores.length >= 5) {
      for (const criterion of rubric.criteria) {
        const recentCriterion = recentScores.map((_, i) =>
          rubric.evolutionHistory[rubric.evolutionHistory.length - 10 + i]?.criteria[criterion.name] || 0.5
        );
        const avgCriterion = recentCriterion.reduce((a, b) => a + b, 0) / recentCriterion.length;

        if (avgCriterion > criterion.threshold) {
          criterion.score = Math.min(1, criterion.score + 0.05);
          criterion.threshold = Math.min(0.95, criterion.threshold + 0.02);
        }
      }

      rubric.version = this._incrementVersion(rubric.version);
      skill.version = rubric.version;
      rubric.lastUpdated = Date.now();
      this._stats.evolutions++;
    }
  }

  _incrementVersion(v) {
    const parts = v.split('.');
    parts[2] = String(parseInt(parts[2] || 0) + 1);
    return parts.join('.');
  }

  // ─── Experience → Skill ─────────────────────────────────────

  /**
   * 从经验缓冲区蒸馏技能
   */
  distillSkills() {
    const buffer = this._experienceBuffer;
    if (buffer.length < this._config.minExperienceForSkill) return [];

    const clusters = this._clusterExperiences(buffer);
    const newSkills = [];

    for (const cluster of clusters) {
      if (cluster.experiences.length < this._config.minExperienceForSkill) continue;

      const skill = this._extractSkillFromCluster(cluster);
      if (skill && !this._skills.has(skill.id)) {
        this.registerSkill(skill);
        newSkills.push(skill);
      }
    }

    this._experienceBuffer = [];
    return newSkills;
  }

  _clusterExperiences(experiences) {
    const clusters = [];
    const grouped = {};

    for (const exp of experiences) {
      const key = exp.category || 'general';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exp);
    }

    for (const [key, exps] of Object.entries(grouped)) {
      clusters.push({ category: key, experiences: exps });
    }

    return clusters;
  }

  _extractSkillFromCluster(cluster) {
    const experiences = cluster.experiences;
    const successful = experiences.filter(e => e.success);

    if (successful.length < this._config.minExperienceForSkill) return null;

    const commonSteps = this._extractCommonSteps(successful);
    const name = `${cluster.category}_skill_${Date.now() % 10000}`;

    return {
      id: name,
      name,
      description: `Auto-distilled from ${successful.length} successful experiences`,
      category: cluster.category,
      procedure: commonSteps,
      source: 'experience_distillation',
    };
  }

  _extractCommonSteps(experiences) {
    const allSteps = experiences.flatMap(e => e.steps || []);
    const stepFreq = {};
    for (const step of allSteps) {
      const key = String(step.action || step).slice(0, 50);
      stepFreq[key] = (stepFreq[key] || 0) + 1;
    }
    return Object.entries(stepFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, freq]) => ({ action, frequency: freq }));
  }

  // ─── Skill Composition ──────────────────────────────────────

  compose(skillIds) {
    const skills = skillIds.map(id => this._skills.get(id)).filter(Boolean);
    if (skills.length < 2) return null;

    const combined = {
      id: `composed_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: skills.map(s => s.name).join(' + '),
      description: `Composed from: ${skills.map(s => s.name).join(', ')}`,
      category: 'composed',
      procedure: skills.flatMap(s => s.procedure),
      composedFrom: skillIds,
      version: '1.0.0',
    };

    this._stats.compositions++;
    return combined;
  }

  // ─── Stats & Queries ────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      skillCount: this._skills.size,
      rubricCount: this._rubrics.size,
      bufferSize: this._experienceBuffer.length,
    };
  }

  getSkill(skillId) {
    return this._skills.get(skillId) || null;
  }

  getAllSkills() {
    return [...this._skills.values()];
  }

  addExperience(experience) {
    this._experienceBuffer.push({
      ...experience,
      timestamp: Date.now(),
    });
    if (this._experienceBuffer.length > 1000) {
      this._experienceBuffer = this._experienceBuffer.slice(-500);
    }
  }
}

module.exports = { SkillEvolutionEngine };
