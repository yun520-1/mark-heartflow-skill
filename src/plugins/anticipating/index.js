/**
 * anticipating plugin — Agentic Context Management's 4th primitive (ACM 2607.21503)
 *
 * ACM 5 primitives: architecting, ingesting, scoping, anticipating, compacting
 * HeartFlow has: scoping (FocusOfAttention), compacting (MemoryCompressor)
 * Missing: anticipating — predict what context the user will need next
 *
 * This plugin adds lightweight anticipating:
 * 1. After each think(), extract signal from input + knowledgeDomains
 * 2. Predict likely next context topics
 * 3. Pre-load relevant memory items into FocusOfAttention
 */

const plugin = {
  name: 'anticipating',
  version: '1.0.0',
  description: 'ACM anticipating primitive — predict next context and pre-load',

  hooks: [
    { event: 'postprocess.think', priority: 200 },
  ],

  init(hf, ctx) {
    const hookBus = ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };

    hf._anticipationStats = { predictions: 0, hits: 0 };

    // Signal patterns that suggest what user will ask next
    const SIGNAL_MAP = {
      'mathematics': ['formula', 'proof', 'statistics', 'logic'],
      'physics': ['quantum', 'mechanics', 'thermodynamics', 'relativity'],
      'psychology': ['cognitive', 'behavior', 'emotion', 'personality'],
      'philosophy': ['ethics', 'logic', 'metaphysics', 'epistemology'],
      'computer_science': ['algorithm', 'data_structure', 'AI', 'programming'],
      'economics': ['market', 'trade', 'inflation', 'supply_chain'],
      'history': ['timeline', 'cause', 'event', 'evidence'],
      'medicine': ['diagnosis', 'treatment', 'symptom', 'drug'],
      'biology': ['evolution', 'genetics', 'cell', 'ecology'],
      'engineering': ['design', 'system', 'material', 'process'],
    };

    // Learned signals from past interactions
    hf._anticipationSignals = hf._anticipationSignals || {};

    hookBus.on('postprocess.think', async (evtCtx) => {
      const { result, input, engine } = evtCtx;
      if (!result || !input) return;

      const domains = result.knowledgeDomains || [];
      if (domains.length === 0) return;

      try {
        // 1. Predict next context topics from current domain
        const predictions = [];
        for (const domainId of domains) {
          const signals = SIGNAL_MAP[domainId];
          if (signals) {
            for (const sig of signals) {
              predictions.push({ domain: domainId, topic: sig, confidence: 0.5 });
            }
          }
        }

        if (predictions.length === 0) return;

        // 2. For each prediction, check if relevant memory exists and pre-load
        const foa = engine.focusOfAttention || engine._modules?.focusOfAttention;
        if (!foa || typeof foa.attend !== 'function') return;

        // Get top predictions, update task context
        const topPrediction = predictions.slice(0, 2).map(p => p.topic).join(' ');
        if (topPrediction) {
          const currentTask = foa._task || '';
          // Only update if prediction differs from current task
          if (!currentTask.toLowerCase().includes(topPrediction)) {
            foa.setTask(currentTask ? currentTask + ', ' + topPrediction : topPrediction);
          }
        }

        // 3. Track prediction for stats
        hf._anticipationStats.predictions++;
        result._anticipating = {
          predictions: predictions.slice(0, 3).map(p => ({ topic: p.topic, domain: p.domain })),
          taskUpdated: !!topPrediction,
        };
      } catch (_) { /* non-blocking */ }
    }, { id: 'anticipating', priority: 200, timeout: 500 });

    return { ok: true };
  },
};

module.exports = plugin;
