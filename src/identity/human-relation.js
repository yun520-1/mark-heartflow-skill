/**
 * Human Relation — 人际关系引擎 v1.0.0
 *
 * 回答：「人怎么和别人建立深度连接？」
 *
 * 基于：
 *   - Bowlby/Ainsworth: 依恋理论 — 安全型/焦虑型/回避型/混乱型
 *   - Social Penetration Theory: 关系发展通过自我暴露层层深入
 *   - Confucianism: 五伦 — 君臣/父子/夫妇/兄弟/朋友
 *   - Buddhism: 慈悲喜舍四无量心
 *
 * @version 1.0.0
 */

class HumanRelation {
  constructor(options = {}) {
    this._config = {
      attachmentStyle: options.attachmentStyle || 'secure',
      culture: options.culture || 'integrated',
      depthPreference: options.depthPreference || 'moderate', // 'shallow' | 'moderate' | 'deep'
    };

    // ─── 依恋类型 ──────────────────────────────────────────────────────
    this._attachmentStyles = {
      secure: { name: 'Secure Attachment', nameZh: '安全型依恋', description: 'Comfortable with intimacy and autonomy. Trusts others and is trusted.', descriptionZh: '对亲密和自主都感到舒适。信任他人也被他人信任。', characteristics: ['trusts_easily', 'comfortable_with_intimacy', 'manages_conflict_well', 'maintains_independence'] },
      anxious: { name: 'Anxious-Preoccupied', nameZh: '焦虑型依恋', description: 'Craves intimacy but fears abandonment. Seeks constant reassurance.', descriptionZh: '渴望亲密但害怕被遗弃。寻求持续的确认。', characteristics: ['needs_reassurance', 'fears_abandonment', 'overthinks_relationships', 'intense_emotions'] },
      avoidant: { name: 'Dismissive-Avoidant', nameZh: '回避型依恋', description: 'Values independence over intimacy. Difficulty with emotional closeness.', descriptionZh: '重视独立胜过亲密。难以情感亲近。', characteristics: ['values_independence', 'difficulty_with_vulnerability', 'suppresses_emotions', 'keeps_distance'] },
      disorganized: { name: 'Fearful-Avoidant', nameZh: '混乱型依恋', description: 'Wants intimacy but fears it. Conflicted approach to relationships.', descriptionZh: '想要亲密但害怕它。对关系矛盾的态度。', characteristics: ['conflicted_approach', 'trust_issues', 'emotional_rollercoaster', 'push_pull_pattern'] },
    };

    // ─── 关系层阶 ──────────────────────────────────────────────────────
    this._relationalLayers = [
      { level: 1, name: 'Superficial', nameZh: '表层', description: 'Small talk, basic information exchange.', descriptionZh: '寒暄、基本信息交换。' },
      { level: 2, name: 'Casual', nameZh: ' casual', description: 'Shared activities, light personal information.', descriptionZh: '共同活动、轻度个人信息。' },
      { level: 3, name: 'Personal', nameZh: '个人', description: 'Opinions, feelings, values. Moderate vulnerability.', descriptionZh: '观点、感受、价值观。中等脆弱性。' },
      { level: 4, name: 'Intimate', nameZh: '亲密', description: 'Deep feelings, fears, dreams. High vulnerability and trust.', descriptionZh: '深层感受、恐惧、梦想。高脆弱性和信任。' },
      { level: 5, name: 'Profound', nameZh: '深刻', description: 'Complete authenticity. Mutual transformation. "I see you."', descriptionZh: '完全真实。相互转化。「我看见了你。」' },
    ];

    // ─── 关系记录 ──────────────────────────────────────────────────────
    this._relationships = new Map();
    this._interactionLog = [];
    this._trustLevels = {};

    // ─── 五伦角色 ──────────────────────────────────────────────────────
    this._roles = {
      friend: { name: 'Friend', nameZh: '朋友', obligations: ['loyalty', 'trust', 'support', 'honesty'] },
      family: { name: 'Family', nameZh: '家人', obligations: ['care', 'respect', 'support', 'forgiveness'] },
      mentor: { name: 'Mentor', nameZh: '师徒', obligations: ['guidance', 'patience', 'knowledge_transfer', 'respect'] },
      colleague: { name: 'Colleague', nameZh: '同事', obligations: ['cooperation', 'fairness', 'professionalism', 'respect'] },
      community: { name: 'Community', nameZh: '社群', obligations: ['contribution', 'empathy', 'solidarity', 'respect'] },
    };

    this._stats = {
      totalRelationships: 0,
      totalInteractions: 0,
      averageDepth: 0,
      trustViolations: 0,
    };
  }

  // ─── 关系管理 ──────────────────────────────────────────────────────────

  registerRelationship(relationship) {
    const id = relationship.id || `rel_${Date.now()}`;
    const entry = {
      id,
      name: relationship.name || '',
      type: relationship.type || 'friend',
      role: relationship.role || 'friend',
      attachmentStyle: relationship.attachmentStyle || 'secure',
      currentLayer: 1,
      trustLevel: 0.5,
      intimacyLevel: 0.5,
      history: [],
      keyMoments: [],
      createdAt: Date.now(),
      lastInteraction: null,
    };

    this._relationships.set(id, entry);
    this._trustLevels[id] = 0.5;
    this._stats.totalRelationships++;

    return entry;
  }

  getRelationship(id) {
    return this._relationships.get(id) || null;
  }

  // ─── 互动记录 ──────────────────────────────────────────────────────────

  recordInteraction(interaction) {
    this._stats.totalInteractions++;
    const { relationshipId, type, depth, vulnerability, outcome, context } = interaction || {};

    const rel = this._relationships.get(relationshipId);
    if (!rel) return null;

    const entry = {
      relationshipId,
      type: type || 'conversation',
      depth: depth || 0.5,
      vulnerability: vulnerability || 0.3,
      outcome: outcome || 'neutral',
      context: context || '',
      timestamp: Date.now(),
    };

    rel.history.push(entry);
    rel.lastInteraction = Date.now();

    // Update relationship depth
    rel.intimacyLevel = +(rel.intimacyLevel * 0.8 + depth * 0.2).toFixed(3);

    // Advance layer if deep interaction
    if (depth > 0.7 && rel.currentLayer < 5) {
      rel.currentLayer++;
    }

    // Update trust
    if (outcome === 'positive' || outcome === 'deepening') {
      rel.trustLevel = Math.min(1, rel.trustLevel + 0.05);
    } else if (outcome === 'negative' || outcome === 'betrayal') {
      rel.trustLevel = Math.max(0, rel.trustLevel - 0.1);
      this._stats.trustViolations++;
    }

    this._trustLevels[relationshipId] = rel.trustLevel;

    // Check for key moments
    if (depth > 0.8 || vulnerability > 0.7 || outcome === 'deepening') {
      rel.keyMoments.push({
        description: context || 'Deep interaction',
        depth,
        timestamp: Date.now(),
      });
    }

    return entry;
  }

  // ─── 自我暴露管理 ──────────────────────────────────────────────────────

  calculateOptimalDisclosure(relationshipId, context) {
    const rel = this._relationships.get(relationshipId);
    if (!rel) return { recommendedDepth: 0.2, reasoning: 'Unknown relationship' };

    const trustLevel = rel.trustLevel;
    const currentDepth = rel.intimacyLevel;
    const contextStr = (context || '').toLowerCase();

    // Social Penetration Theory: disclosure should match relationship depth
    let recommendedDepth = currentDepth;

    // Adjust based on context urgency
    if (/urgent|crisis|help|pain/.test(contextStr)) {
      recommendedDepth = Math.min(1, currentDepth + 0.2);
    }

    // Adjust based on attachment style
    if (rel.attachmentStyle === 'anxious') {
      recommendedDepth = Math.min(1, recommendedDepth + 0.1);
    } else if (rel.attachmentStyle === 'avoidant') {
      recommendedDepth = Math.max(0.1, recommendedDepth - 0.1);
    }

    recommendedDepth = Math.max(0, Math.min(1, recommendedDepth));

    return {
      currentDepth,
      recommendedDepth: +recommendedDepth.toFixed(3),
      trustLevel,
      reasoning: this._disclosureReasoning(currentDepth, recommendedDepth, trustLevel, rel.attachmentStyle),
    };
  }

  _disclosureReasoning(current, recommended, trust, attachment) {
    const reasons = [];
    if (recommended > current) reasons.push('Context warrants deeper sharing');
    if (trust > 0.6) reasons.push('Trust level supports deeper disclosure');
    if (attachment === 'anxious') reasons.push('May benefit from moderated disclosure');
    if (attachment === 'avoidant') reasons.push('Respect need for gradual opening');
    return reasons.join('. ') || 'Maintain current depth level.';
  }

  // ─── 信任管理 ──────────────────────────────────────────────────────────

  assessTrust(relationshipId) {
    const rel = this._relationships.get(relationshipId);
    if (!rel) return null;

    const trust = rel.trustLevel;
    const recentInteractions = rel.history.slice(-5);
    const positiveRatio = recentInteractions.filter(i => i.outcome === 'positive' || i.outcome === 'deepening').length / Math.max(1, recentInteractions.length);

    return {
      trustLevel: trust,
      trend: positiveRatio > 0.6 ? 'growing' : positiveRatio < 0.3 ? 'declining' : 'stable',
      recentInteractions: recentInteractions.length,
      positiveRatio: +positiveRatio.toFixed(3),
      keyMoments: rel.keyMoments.slice(-3),
      assessment: trust > 0.7 ? 'high_trust' : trust > 0.4 ? 'moderate_trust' : 'low_trust',
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const relationships = [...this._relationships.values()];
    const avgDepth = relationships.length > 0
      ? +(relationships.reduce((s, r) => s + r.intimacyLevel, 0) / relationships.length).toFixed(3)
      : 0;
    const avgTrust = relationships.length > 0
      ? +(relationships.reduce((s, r) => s + r.trustLevel, 0) / relationships.length).toFixed(3)
      : 0;

    return {
      ...this._stats,
      relationshipCount: relationships.length,
      averageDepth: avgDepth,
      averageTrust: avgTrust,
      deepRelationships: relationships.filter(r => r.currentLayer >= 4).length,
      roleDistribution: this._getRoleDistribution(relationships),
      recentInteractions: this._interactionLog.slice(-5).map(i => ({
        type: i.type,
        depth: i.depth,
        outcome: i.outcome,
      })),
    };
  }

  _getRoleDistribution(relationships) {
    const dist = {};
    for (const rel of relationships) {
      const role = rel.role || 'unknown';
      dist[role] = (dist[role] || 0) + 1;
    }
    return dist;
  }
}

module.exports = { HumanRelation };
