/**
 * Cross-Domain Reasoner (Reasoning Layer)
 *
 * 复用:
 *  - src/reasoning/graph-of-thoughts.js
 *  - src/reasoning/causal-inference.js
 *  - src/knowledge/cross-domain-reasoner.js
 *
 * 职责:
 *  - A→B 类比推断
 *  - A→B 因果链路
 *  - 链路可回溯（backtrack）
 */

const path = require('path');

function _tryRequire(p) {
  try {
    const m = require(p);
    return typeof m === 'function' ? m() : m;
  } catch (e) {
    return null;
  }
}

class ReasoningChain {
  /**
   * @param {string} id
   * @param {string} fromDomain
   * @param {string} toDomain
   * @param {'analogical'|'causal'} mode
   */
  constructor(id, fromDomain, toDomain, mode) {
    this.id = id || `chain_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.fromDomain = fromDomain;
    this.toDomain = toDomain;
    this.mode = mode;
    this.steps = [];
    this.metadata = {};
  }

  append(step, confidence = 0.5, meta = {}) {
    this.steps.push({
      step,
      confidence: Math.max(0, Math.min(1, confidence)),
      ts: Date.now(),
      ...meta,
    });
  }

  backtrackTo(stepIndex) {
    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= this.steps.length) stepIndex = this.steps.length - 1;
    return {
      ...this.toSummary(),
      steps: this.steps.slice(0, stepIndex + 1).map(s => ({ step: s.step, confidence: s.confidence })),
      backtrackedTo: stepIndex,
    };
  }

  toSummary() {
    return {
      id: this.id,
      fromDomain: this.fromDomain,
      toDomain: this.toDomain,
      mode: this.mode,
      stepCount: this.steps.length,
      traceable: true,
      steps: this.steps.map(s => ({ step: s.step, confidence: s.confidence })),
    };
  }
}

class CrossDomainReasoner {
  /**
   * @param {object} [options]
   * @param {object} [options.knowledge] - KnowledgeSubsystem instance
   * @param {object} [options.graphAdapter] - KnowledgeGraphAdapter instance
   */
  constructor(options = {}) {
    this.knowledge = options.knowledge || null;
    this.graphAdapter = options.graphAdapter || null;
    this.gotEngine = null;
    this.causalEngine = null;
    this._knowledgeReasoner = null;
    this._chains = new Map();
    this._initEngines();
  }

  _initEngines() {
    const gotRaw = _tryRequire('./graph-of-thoughts.js');
    this.gotEngine = gotRaw && typeof gotRaw.default === 'function'
      ? gotRaw.default()
      : (gotRaw && gotRaw.GoTEngine ? new gotRaw.GoTEngine() : null);

    const causalRaw = _tryRequire('./causal-inference.js');
    this.causalEngine = causalRaw && causalRaw.CausalInference ? new causalRaw.CausalInference() : null;

    if (this.knowledge && this.knowledge.reasoner) {
      this._knowledgeReasoner = this.knowledge.reasoner;
    } else if (this.graphAdapter) {
      try {
        const mod = _tryRequire('../knowledge/cross-domain-reasoner.js');
        if (mod && mod.CrossDomainReasoner) {
          this._knowledgeReasoner = new mod.CrossDomainReasoner({ graphAdapter: this.graphAdapter });
        }
      } catch (e) {
        this._knowledgeReasoner = null;
      }
    }
  }

  /**
   * A→B 类比推断
   * @param {string} fromDomain
   * @param {string} toDomain
   * @param {object} [options]
   * @returns {object}
   */
  analogicalInfer(fromDomain, toDomain, options = {}) {
    const limit = options && options.limit ? options.limit : 5;
    const chain = new ReasoningChain(null, fromDomain, toDomain, 'analogical');
    let baseResult = { items: [] };

    if (this._knowledgeReasoner) {
      try {
        baseResult = this._knowledgeReasoner.analogicalInfer(fromDomain, toDomain, options);
      } catch (e) {
        baseResult = { items: [] };
      }
    }

    chain.append('analogy_seed_matching', 0.6);
    if (baseResult.items && baseResult.items.length > 0) {
      baseResult.items.forEach(item => {
        chain.append(
          `analogy_match: ${item.seed || item.rationale || 'unknown'}`,
          item.confidence || 0.5
        );
      });
    } else {
      chain.append('no_direct_analogy_found', 0.2);
    }

    chain.append('got_exploration_available', this.gotEngine ? 0.7 : 0.3, {
      got: !!this.gotEngine,
    });

    this._chains.set(chain.id, chain);
    return {
      ...baseResult,
      mode: 'analogical',
      chainId: chain.id,
      traceable: true,
      chain: chain.toSummary(),
    };
  }

  /**
   * A→B 因果链路
   * @param {string} fromDomain
   * @param {string} toDomain
   * @param {object} [options]
   * @returns {object}
   */
  causalChain(fromDomain, toDomain, options = {}) {
    const maxDepth = options && options.maxDepth ? options.maxDepth : 3;
    const chain = new ReasoningChain(null, fromDomain, toDomain, 'causal');
    let baseResult = { items: [] };

    if (this._knowledgeReasoner) {
      try {
        baseResult = this._knowledgeReasoner.causalChain(fromDomain, toDomain, options);
      } catch (e) {
        baseResult = { items: [] };
      }
    }

    chain.append('domain_path_search', 0.5);
    if (baseResult.items && baseResult.items.length > 0) {
      baseResult.items.forEach((item, idx) => {
        chain.append(`causal_path_${idx + 1}`, item.confidence || 0.5, {
          steps: item.steps,
        });

        if (this.causalEngine && item.steps && item.steps.length > 0) {
          try {
            const first = item.steps[0];
            const last = item.steps[item.steps.length - 1];
            const causes = Array.isArray(this.causalEngine.getCauses)
              ? this.causalEngine.getCauses(first.subject || first.subjectId)
              : [];
            const effects = Array.isArray(this.causalEngine.getEffects)
              ? this.causalEngine.getEffects(last.object || last.objectId)
              : [];
            if (causes.length > 0) {
              chain.append(`candidate_causes_${idx + 1}`, 0.4, { causes: causes.slice(0, 3) });
            }
            if (effects.length > 0) {
              chain.append(`candidate_effects_${idx + 1}`, 0.4, { effects: effects.slice(0, 3) });
            }
          } catch (e) {
            // causal engine enhance is best-effort
          }
        }
      });
    } else {
      chain.append('no_causal_path_found', 0.2);
    }

    chain.append('causal_engine_available', this.causalEngine ? 0.7 : 0.3, {
      causal: !!this.causalEngine,
    });

    this._chains.set(chain.id, chain);
    return {
      ...baseResult,
      mode: 'causal',
      maxDepth,
      chainId: chain.id,
      traceable: true,
      chain: chain.toSummary(),
    };
  }

  /**
   * 回溯推理链到指定步骤
   * @param {string} chainId
   * @param {number} targetStepIndex
   * @returns {object}
   */
  backtrack(chainId, targetStepIndex) {
    const chain = this._chains.get(chainId);
    if (!chain) {
      return { error: 'chain_not_found', chainId };
    }
    return chain.backtrackTo(targetStepIndex);
  }

  /**
   * 获取推理链摘要
   * @param {string} chainId
   * @returns {object|null}
   */
  getChain(chainId) {
    const chain = this._chains.get(chainId);
    if (!chain) return null;
    return chain.toSummary();
  }

  /**
   * 引擎统计
   * @returns {object}
   */
  getStats() {
    return {
      chains: this._chains.size,
      gotAvailable: !!this.gotEngine,
      causalAvailable: !!this.causalEngine,
      knowledgeReasonerAvailable: !!this._knowledgeReasoner,
    };
  }
}

module.exports = { CrossDomainReasoner, ReasoningChain };
