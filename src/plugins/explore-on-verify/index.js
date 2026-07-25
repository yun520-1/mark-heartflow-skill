/**
 * explore-on-verify plugin — when verification finds low confidence,
 * auto-trigger knowledge gap exploration and attach results.
 *
 * Composes: AREX verification + KnowledgeDomains + GapExecutor
 * into a single feedback loop. Zero new capabilities — just recombination.
 */

const plugin = {
  name: 'explore-on-verify',
  version: '1.0.0',
  description: 'low confidence + domain knowledge trigger gap exploration',

  hooks: [
    { event: 'postprocess.think', priority: 150 },
  ],

  init(hf, ctx) {
    const hookBus = ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };

    hf._exploredDomains = hf._exploredDomains || {};

    hookBus.on('postprocess.think', async (evtCtx) => {
      const { result, input, engine } = evtCtx;
      if (!result || !input) return;

      // trigger: low confidence
      const meta = result.output?.meta || result.meta || {};
      const confidence = meta.confidence ?? result.confidence ?? 0.5;
      if (confidence > 0.55) return;

      const ke = engine.knowledgeExplorer;
      const ge = engine.gapExecutor;
      if (!ke || !ge) return;

      const domains = result.knowledgeDomains || [];
      let gapToExplore = null;

      if (domains.length > 0) {
        const key = 'domain-' + domains[0];
        if (engine._exploredDomains[key]) return;
        engine._exploredDomains[key] = Date.now();

        const pending = (ke.getGaps() || []).filter(g => g.status === 'pending');
        gapToExplore = pending.find(g =>
          (g.topic || '').toLowerCase().includes(domains[0].toLowerCase())
        );

        if (!gapToExplore) {
          ke.registerGap({
            topic: domains[0] + ' research advances',
            question: 'latest advances in ' + domains[0] + '?',
            source: 'verification-triggered',
            priority: 8,
            suggestedQuery: domains[0],
          });
          const all = ke.getGaps();
          gapToExplore = all.find(g => g.source === 'verification-triggered' && g.status !== 'explored' && g.status !== 'absorbed');
        }
      } else {
        const pending = (ke.getGaps() || []).filter(g => g.status === 'pending');
        if (pending.length === 0) return;
        const key = 'fallback-' + pending[0].id;
        if (engine._exploredDomains[key]) return;
        engine._exploredDomains[key] = Date.now();
        gapToExplore = pending[0];
      }

      if (!gapToExplore) return;

      try {
        const exploreResult = await ge.execute(gapToExplore, ke);
        if (exploreResult.executed && exploreResult.searchResult?.count > 0) {
          result._exploreOnVerify = {
            domain: domains[0] || 'general',
            count: exploreResult.searchResult.count,
            findings: exploreResult.searchResult.topFindings?.slice(0, 3) || [],
          };
        }
      } catch (_) { /* explore failure non-blocking */ }
    }, { id: 'explore-on-verify', priority: 150, timeout: 15000 });

    return { ok: true };
  },
};

module.exports = plugin;
