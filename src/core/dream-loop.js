
/**
 * HeartFlow Dream Loop
 *
 * Purpose:
 * - Reorganize daytime memory fragments
 * - Simulate imaginative / counterfactual states
 * - Extract candidate upgrades after waking
 *
 * Inspired by research themes:
 * - memory consolidation
 * - replay / offline review
 * - imagination for planning
 * - self-reflection
 */

const DEFAULT_WEIGHTS = {
  recency: 0.35,
  salience: 0.3,
  contradiction: 0.15,
  novelty: 0.2,
};

function tokenize(text) {
  return String(text || '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
}

function scoreFragment(fragment, memoryContext = '') {
  const text = String(fragment || '');
  const ctx = String(memoryContext || '');
  const tokens = tokenize(text);
  const ctxTokens = new Set(tokenize(ctx).map(t => t.toLowerCase()));
  const overlap = tokens.filter(t => ctxTokens.has(t.toLowerCase())).length;
  const contradiction = /\b(not|never|no|cannot|wrong|false)\b/i.test(text) ? 1 : 0;
  const novelty = Math.max(0, tokens.length - overlap) / Math.max(tokens.length, 1);
  const salience = /\b(version|error|fix|upgrade|dream|memory|logic|truth)\b/i.test(text) ? 1 : 0.3;
  return (
    DEFAULT_WEIGHTS.recency * Math.min(tokens.length / 40, 1) +
    DEFAULT_WEIGHTS.salience * salience +
    DEFAULT_WEIGHTS.contradiction * contradiction +
    DEFAULT_WEIGHTS.novelty * novelty
  );
}

function buildDreamFragments(memoryItems, limit = 8) {
  const items = Array.isArray(memoryItems) ? memoryItems : [];
  const ctx = items.map(x => String((x && x.text) || x)).join(' ');
  return items
    .map(entry => {
      const text = String((entry && entry.text) || entry || '');
      return { entry, score: scoreFragment(text, ctx) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.entry);
}

function generateDream(memoryItems, options = {}) {
  const fragments = buildDreamFragments(memoryItems, options.limit || 8);
  const motifs = fragments.map(f => String((f && f.text) || f).slice(0, 120));
  return {
    title: 'HeartFlow Dream Loop',
    motifs,
    fragments,
    insights: [
      'Reinforce recurring corrections.',
      'Treat contradictions as dream material, not runtime truth.',
      'Wake up by extracting a smaller, more precise upgrade set.'
    ],
    next_actions: [
      'promote useful fragments to durable memory',
      'queue contradiction checks',
      'draft one concrete upgrade'
    ]
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  tokenize,
  scoreFragment,
  buildDreamFragments,
  generateDream,
};

if (require.main === module) {
  const demoMemory = [
    'user prefers HeartFlow to stay grounded in current target',
    'do not confuse historical version with current version',
    'dream should reorganize memory fragments into candidate upgrades',
    'runtime logic errors must be reduced',
    'use startup self-check before acting'
  ];
  console.log(JSON.stringify(generateDream(demoMemory), null, 2));
}
