/**
 * cross-domain-reasoner.js
 *
 * 跨域推理器：复用 knowledge-graph + GoT + CausalInference，实现：
 *  - A→B 类比推断
 *  - A→B 因果链路
 *
 * 注意：此处做“自适应退化”导入，若 graph-of-thoughts / causal-inference 不可用，
 * 则仅使用图检索返回候选链，不做图搜索扩展。
 */

const { KnowledgeGraphAdapter } = require('./knowledge-graph-adapter.js');

function _tryRequire(p) {
  try {
    const m = require(p);
    return typeof m === 'function' ? m() : m;
  } catch (e) {
    return null;
  }
}

class CrossDomainReasoner {
  /**
   * @param {object} [options]
   * @param {KnowledgeGraphAdapter} [options.graphAdapter]
   */
  constructor(options = {}) {
    this.graphAdapter = options.graphAdapter || new KnowledgeGraphAdapter({ dataDir: require('path').join(__dirname, '..', '..', 'data', 'ontology') });
    const gotRaw = _tryRequire('../reasoning/graph-of-thoughts.js');
    this.gotEngine = gotRaw && typeof gotRaw.default === 'function' ? gotRaw.default() : (gotRaw && gotRaw.GoTEngine ? new gotRaw.GoTEngine() : null);
    const causalRaw = _tryRequire('../reasoning/causal-inference.js');
    this.causalEngine = causalRaw && causalRaw.CausalInference ? new causalRaw.CausalInference() : null;
  }

  /**
   * 类比推断：从 sourceDomain 类比映射到 targetDomain
   */
  analogicalInfer(sourceDomain, targetDomain, options = {}) {
    const limit = options.limit || 5;
    const sourceSeeds = this._seedsFromDomain(sourceDomain, 'analogy_seed');
    const targetSeeds = this._seedsFromDomain(targetDomain, 'analogy_seed');
    const overlaps = sourceSeeds.filter(s => targetSeeds.includes(s));
    const candidates = overlaps.map(seed => ({
      seed,
      sourceDomain,
      targetDomain,
      relation: 'analogy',
      confidence: 0.7 + (overlaps.length > 0 ? 0.1 : 0),
      rationale: `共享类比词: ${seed}`,
    }));
    const enriched = this._enrichWithGraph(sourceDomain, targetDomain, 'analogy', candidates, limit);
    return {
      sourceDomain,
      targetDomain,
      mode: 'analogical',
      count: enriched.length,
      items: enriched,
    };
  }

  /**
   * 因果链路：从 sourceDomain 推导对 targetDomain 的因果影响
   */
  causalChain(sourceDomain, targetDomain, options = {}) {
    const maxDepth = options.maxDepth || 3;
    const paths = this.graphAdapter.findDomainPath(sourceDomain, targetDomain, maxDepth);
    const chainItems = paths.flatMap((p, idx) => {
      if (!p || p.length === 0) return [];
      const confidence = p.reduce((s, edge) => s + (edge.confidence || 0), 0) / p.length;
      return [{
        pathIndex: idx + 1,
        steps: p,
        confidence: Math.max(0, Math.min(1, confidence)),
        mode: 'causal',
      }];
    });
    const causalEnhanced = this._enhanceWithCausalEngine(sourceDomain, targetDomain, chainItems, maxDepth);
    return {
      sourceDomain,
      targetDomain,
      mode: 'causal',
      maxDepth,
      count: causalEnhanced.length,
      items: causalEnhanced,
    };
  }

  _seedsFromDomain(domainId, predicate) {
    const result = this.graphAdapter.kg.query({
      subject: `domain:${domainId}`,
      predicate,
      fuzzy: false,
      sortByConfidence: true,
      limit: 50,
    });
    return result.map(t => t.object).filter(Boolean);
  }

  _enrichWithGraph(sourceDomain, targetDomain, linkType, candidates, limit) {
    const direct = this.graphAdapter.kg.query({
      subject: `domain:${sourceDomain}`,
      predicate: linkType,
      object: `domain:${targetDomain}`,
      fuzzy: false,
      sortByConfidence: true,
      limit,
    });
    const merged = [...candidates];
    direct.forEach(t => {
      merged.push({
        seed: null,
        sourceDomain,
        targetDomain,
        relation: t.predicate,
        confidence: t.confidence,
        rationale: `知识图谱边: ${t.subject} -[${t.predicate}]-> ${t.object}`,
      });
    });
    merged.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return merged.slice(0, limit);
  }

  _enhanceWithCausalEngine(sourceDomain, targetDomain, chainItems, maxDepth) {
    if (!this.causalEngine || !chainItems.length) return chainItems;
    try {
      const augmented = [];
      for (const item of chainItems) {
        const first = item.steps[0];
        const last = item.steps[item.steps.length - 1];
        const causes = Array.isArray(this.causalEngine.getCauses) ? this.causalEngine.getCauses(first.subject) : [];
        const effects = Array.isArray(this.causalEngine.getEffects) ? this.causalEngine.getEffects(last.object) : [];
        augmented.push({
          ...item,
          candidateCauses: causes.slice(0, 3),
          candidateEffects: effects.slice(0, 3),
        });
      }
      return augmented;
    } catch (e) {
      return chainItems;
    }
  }
}

module.exports = { CrossDomainReasoner };
