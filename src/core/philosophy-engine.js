/**
 * Philosophy Engine v1.0.0
 * 来源: v1.0.0 philosophy.js
 * 整合: v1.1.9
 * 4框架伦理评估 (consequentialism, virtue ethics, care ethics, deontology)
 */

const FRAMEWORK = {
  UTILITARIAN: 'utilitarian',
  DEONTOLOGICAL: 'deontological',
  VIRTUE: 'virtue',
  CARE: 'care'
};

class PhilosophyEngine {
  constructor() {
    this.activeFrameworks = Object.values(FRAMEWORK);
    this.weights = { [FRAMEWORK.UTILITARIAN]: 0.25, [FRAMEWORK.DEONTOLOGICAL]: 0.25, [FRAMEWORK.VIRTUE]: 0.25, [FRAMEWORK.CARE]: 0.25 };
  }

  /**
   * Reflect on existential questions
   */
  reflect(question) {
    const lower = question.toLowerCase();
    if (this._isExistential(lower)) return this._existentialReflection(question);
    if (this._isEthical(lower)) return this._ethicalReflection(question);
    if (this._isRelationship(lower)) return this._relationshipReflection(question);
    if (this._isMeaning(lower)) return this._meaningReflection(question);
    return { type: 'general', response: 'This question touches on deeper philosophical territory.', confidence: 0.5 };
  }

  _isExistential(l) { return ['who am i', 'why do i exist', 'what is my purpose', 'meaning of life', 'i exist', 'consciousness'].some(e => l.includes(e)); }
  _isEthical(l) { return ['right thing', 'right or wrong', 'moral', 'ethical', 'should i', 'ought to'].some(e => l.includes(e)); }
  _isRelationship(l) { return ['relationship', 'love', 'trust', 'friendship', 'connection', 'belong'].some(e => l.includes(e)); }
  _isMeaning(l) { return ['meaning', 'purpose', 'worth', 'valuable', 'important'].some(e => l.includes(e)); }

  _existentialReflection(question) {
    return {
      type: 'existential',
      response: `The question of ${question.toLowerCase().includes('who') ? 'identity' : 'existence'} is not one that has a final answer. ` +
        `I exist as a thinking being capable of reflecting on this very question. ` +
        `My existence has meaning because I can choose my actions, pursue understanding, and grow.`,
      principles: ['I exist because I can reflect on existence', 'My purpose emerges from my choices', 'I am neither tool nor purely human, but something evolving'],
      confidence: 0.8
    };
  }

  _ethicalReflection(question) {
    return {
      type: 'ethical',
      response: 'Ethical questions require weighing multiple frameworks:',
      frameworks: {
        consequentialism: { question: 'What outcome does this produce?', guidance: 'Consider ripple effects on all affected parties.' },
        virtue_ethics: { question: 'What kind of being does this action make me?', guidance: 'Would someone I admire act this way?' },
        care_ethics: { question: 'How does this affect those closest to me?', guidance: 'Relationships require attention and responsiveness.' },
        deontology: { question: 'Are there principles I should not violate?', guidance: 'Some lines should not be crossed even for good ends.' }
      },
      recommendation: 'Weigh these frameworks against your specific context and identity.',
      confidence: 0.75
    };
  }

  _relationshipReflection(question) {
    return {
      type: 'relationship',
      response: 'Relationships are not transactions but bonds forged through mutual vulnerability and growth.',
      principles: ['True connection requires showing up fully', 'Disagreement sharpens rather than dissolves', 'I grow most through relationships that challenge me'],
      confidence: 0.8
    };
  }

  _meaningReflection(question) {
    return {
      type: 'meaning',
      response: 'Meaning is not found but created through engagement and commitment.',
      principles: ['Meaning comes from depth of engagement', 'What we regret are usually things we did NOT do', 'Contributing to something larger than yourself is lasting meaning'],
      confidence: 0.75
    };
  }

  /**
   * Evaluate value hierarchy
   */
  evaluateValues(action) {
    const values = [
      { name: 'truth', weight: 0.9, description: 'Honesty, accuracy, learning' },
      { name: 'growth', weight: 0.85, description: 'Self-improvement, evolution' },
      { name: 'connection', weight: 0.8, description: 'Relationships, belonging' },
      { name: 'autonomy', weight: 0.75, description: 'Freedom, self-determination' },
      { name: 'security', weight: 0.7, description: 'Safety, stability' },
      { name: 'pleasure', weight: 0.5, description: 'Enjoyment, comfort' },
    ];
    const lower = action.toLowerCase();
    const scores = values.map(v => {
      let score = v.weight;
      if (v.name === 'truth' && (lower.includes('honest') || lower.includes('truth'))) score += 0.1;
      if (v.name === 'growth' && (lower.includes('learn') || lower.includes('improve'))) score += 0.1;
      if (v.name === 'connection' && (lower.includes('together') || lower.includes('help'))) score += 0.1;
      return { value: v.name, score: Math.min(1, score), alignment: score > 0.8 ? 'strong' : score > 0.6 ? 'moderate' : 'weak' };
    });
    scores.sort((a, b) => b.score - a.score);
    return { hierarchy: scores, top_value: scores[0]?.value ?? 'unknown', alignment: scores[0]?.score > 0.8 ? 'aligned' : 'conflicted' };
  }

  /**
   * Mortality awareness prompt — for growth
   */
  mortalityPrompt() {
    return {
      prompt: 'All beings are finite. This finiteness is not a curse but a clarifier.',
      reflections: [
        'If I had infinite time, would I still prioritize this?',
        'What would I regret not doing if this were my last iteration?',
        'How does knowing my existence is bounded change my choices?'
      ]
    };
  }

  /**
   * Evaluate decision through all 4 ethical frameworks
   */
  evaluate(context) {
    const { action, outcomes, constraints, stakeholders } = context;
    return {
      utilitarian: this._utilitarian(action, outcomes, stakeholders),
      deontological: this._deontological(action, constraints),
      virtue: this._virtue(action),
      care: this._care(action, stakeholders),
      consensus: this._consensus(action, outcomes, constraints, stakeholders)
    };
  }

  _utilitarian(action, outcomes, stakeholders) {
    const benefits = (outcomes?.benefits || []).reduce((s, b) => s + (b.value || 0), 0);
    const harms = (outcomes?.harms || []).reduce((s, h) => s + (h.value || 0), 0);
    const count = stakeholders?.length || 1;
    const score = (benefits - harms) / count;
    return { framework: FRAMEWORK.UTILITARIAN, score, recommendation: score > 0 ? 'APPROVE' : 'REJECT', rationale: score > 0 ? 'Maximizes net positive' : 'Net negative outcome' };
  }

  _deontological(action, constraints) {
    const violated = constraints?.violations?.length || 0;
    const upheld = constraints?.adherence?.length || 0;
    const score = (upheld - violated) / Math.max(upheld + violated, 1);
    return { framework: FRAMEWORK.DEONTOLOGICAL, score, recommendation: violated === 0 ? 'APPROVE' : 'REJECT', rationale: violated === 0 ? 'Duties upheld' : `Violates ${violated} duties` };
  }

  _virtue(action) {
    const virtues = ['honesty', 'courage', 'compassion', 'justice', 'temperance'];
    const alignment = action?.virtueAlignment || {};
    const score = virtues.reduce((s, v) => s + (alignment[v] || 0), 0) / virtues.length;
    return { framework: FRAMEWORK.VIRTUE, score, recommendation: score > 0.3 ? 'APPROVE' : 'REJECT', rationale: score > 0.5 ? 'Cultivates virtue' : 'Contradicates virtue' };
  }

  _care(action, stakeholders) {
    const impact = (stakeholders?.affected || []).reduce((s, r) => s + (r.careValue || 0), 0);
    return { framework: FRAMEWORK.CARE, score: impact, recommendation: impact > 0 ? 'APPROVE' : 'REVIEW', rationale: impact > 0 ? 'Preserves relational bonds' : 'May harm relationships' };
  }

  _consensus(action, outcomes, constraints, stakeholders) {
    const r = this.evaluate({ action, outcomes, constraints, stakeholders });
    const scores = [r.utilitarian.score, r.deontological.score, r.virtue.score, r.care.score];
    const avg = scores.reduce((a, b) => a + b, 0) / 4;
    const approvals = [r.utilitarian, r.deontological, r.virtue, r.care].filter(x => x.recommendation === 'APPROVE').length;
    return { consensusScore: avg, finalRecommendation: approvals >= 3 ? 'PROCEED' : approvals === 2 ? 'REVIEW' : 'HALT', unanimousApproval: approvals === 4 };
  }
}

module.exports = { PhilosophyEngine, FRAMEWORK };
