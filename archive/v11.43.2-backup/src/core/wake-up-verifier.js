
/**
 * HeartFlow Wake-Up Verifier
 *
 * Purpose:
 * - Validate dream outputs after sleep/replay
 * - Promote useful dream fragments to actionable upgrades
 * - Reject contradictions, legacy noise, and ungrounded speculation
 */

const { DecisionVerifier } = require('./decision-verifier.js');

class WakeUpVerifier {
  constructor(options = {}) {
    this.decisionVerifier = new DecisionVerifier(options);
    this.rules = {
      minActionability: options.minActionability ?? 0.55,
      maxNoiseRatio: options.maxNoiseRatio ?? 0.45,
    };
  }

  normalizeDream(dreamResult = {}) {
    return {
      title: dreamResult.title || 'Dream',
      motifs: Array.isArray(dreamResult.motifs) ? dreamResult.motifs : [],
      fragments: Array.isArray(dreamResult.fragments) ? dreamResult.fragments : [],
      insights: Array.isArray(dreamResult.insights) ? dreamResult.insights : [],
      next_actions: Array.isArray(dreamResult.next_actions) ? dreamResult.next_actions : [],
      corrections: Array.isArray(dreamResult.corrections) ? dreamResult.corrections : [],
      awake_summary: dreamResult.awake_summary || {}
    };
  }

  evaluateDream(dreamResult = {}) {
    const dream = this.normalizeDream(dreamResult);
    const issues = [];
    const suggestions = [];
    const fragmentsText = dream.fragments.map(x => String((x && x.text) || x)).join(' ');
    const noiseHits = (fragmentsText.match(/(old|historical|fake|placeholder|demo|wrong|error|confuse)/gi) || []).length;
    const noiseRatio = dream.fragments.length ? noiseHits / dream.fragments.length : 0;
    const actionability = Math.max(0, Math.min(1, 0.35 + dream.next_actions.length * 0.12 + dream.insights.length * 0.08 - noiseRatio * 0.4));

    if (noiseRatio > this.rules.maxNoiseRatio) {
      issues.push({ type: 'high_noise_ratio', severity: 'medium', message: '梦态噪声过高，需要减少历史/噪声片段' });
      suggestions.push('先清理历史碎片，再做二次梦态重组');
    }

    if (actionability < this.rules.minActionability) {
      issues.push({ type: 'low_actionability', severity: 'high', message: '梦输出缺少足够的可执行转化' });
      suggestions.push('把梦洞察压缩成 1-3 条明确行动');
    }

    const decisionRecord = {
      decision: dream.title,
      reason: dream.insights.join(' '),
      evidence: dream.motifs,
      risks: dream.corrections.map(c => c.note || c.action || 'correction'),
      alternatives: dream.next_actions,
      confidence: actionability,
      userGoal: 'Reduce logic errors and evolve HeartFlow',
      expectedOutcome: 'A smaller, clearer upgrade set'
    };

    const decisionCheck = this.decisionVerifier.verify(decisionRecord);
    if (!decisionCheck.valid) {
      issues.push(...decisionCheck.issues);
      suggestions.push(...decisionCheck.repairHints);
    }

    const promoted = this.promoteFragments(dream);
    return {
      valid: issues.filter(i => i.severity === 'high').length === 0 && decisionCheck.valid,
      actionability,
      noiseRatio,
      issues,
      suggestions: [...new Set(suggestions)],
      decisionCheck,
      promoted,
      awake_summary: {
        title: dream.title,
        fragmentCount: dream.fragments.length,
        promotedCount: promoted.length,
        nextActionCount: dream.next_actions.length
      }
    };
  }

  promoteFragments(dream) {
    const candidates = [];
    for (const item of dream.fragments) {
      const text = String((item && item.text) || item || '');
      if (/(upgrade|fix|verify|memory|self-check|correction|logic|truth)/i.test(text)) {
        candidates.push({ text, promoted: true, reason: 'strong alignment with HeartFlow target' });
      }
    }
    for (const action of dream.next_actions) {
      candidates.push({ text: action, promoted: true, reason: 'action extracted from waking summary' });
    }
    return candidates.slice(0, 5);
  }
}

module.exports = { WakeUpVerifier };

if (require.main === module) {
  const demo = {
    title: 'HeartFlow Dream Loop',
    motifs: ['dream should reorganize memory fragments', 'do not confuse historical version with current version'],
    fragments: [
      { text: 'dream should reorganize memory fragments into candidate upgrades' },
      { text: 'do not confuse historical version with current version' }
    ],
    insights: ['Treat contradictions as dream material, not runtime truth.'],
    next_actions: ['promote useful fragments to durable memory', 'queue contradiction checks']
  };
  const verifier = new WakeUpVerifier();
  console.log(JSON.stringify(verifier.evaluateDream(demo), null, 2));
}
