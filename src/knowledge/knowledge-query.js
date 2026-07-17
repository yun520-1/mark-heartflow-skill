/**
 * knowledge-query.js
 *
 * heartflow_knowledge_query 处理器：
 *  - 领域过滤 + 置信排序
 *  - 复用 KnowledgeOntology + KnowledgeGraphAdapter
 *  - 若启用 verifier，则对明显低置信结论做拦截
 */

const path = require('path');
const { KnowledgeOntology } = require('./knowledge-ontology.js');
const { SourceAnnotator } = require('./source-annotator.js');

class KnowledgeQuery {
  /**
   * @param {object} [options]
   * @param {KnowledgeOntology} [options.ontology]
   * @param {SourceAnnotator} [options.annotator]
   * @param {number} [options.minConfidence] 最低置信阈值，低于此值视作低置信结论
   * @param {boolean} [options.enableVerifier]
   */
  constructor(options = {}) {
    this.ontology = options.ontology || new KnowledgeOntology();
    this.annotator = options.annotator || new SourceAnnotator();
    this.minConfidence = typeof options.minConfidence === 'number' ? options.minConfidence : 0.3;
    this.enableVerifier = options.enableVerifier !== false;
  }

  /**
   * 主查询入口
   *
   * @param {object} query
   * @param {string} [query.q]
   * @param {string} [query.domain]
   * @param {number} [query.limit]
   * @param {string} [query.linkType]
   * @returns {object}
   */
  query({ q, domain, limit = 5, linkType } = {}) {
    const queryText = (q || '').trim();
    const matchedDomains = this._matchDomains(queryText, domain);
    const candidates = this._collectCandidates(matchedDomains, linkType, limit * 4);
    const ranked = this._rank(candidates, queryText);
    const top = ranked.slice(0, limit);
    return {
      query: queryText,
      domain: domain || null,
      topK: top.length,
      recallHits: ranked.length,
      items: top,
      verifier: this.enableVerifier ? this._verifierSummary(top) : null,
    };
  }

  _matchDomains(queryText, explicitDomain) {
    if (explicitDomain) return [explicitDomain];
    if (!queryText) return this.ontology.getTopLevelDomains().map(d => d.id);
    const domains = this.ontology.getTopLevelDomains();
    const matched = [];
    for (const d of domains) {
      if (this._matchesDomain(queryText, d)) matched.push(d.id);
    }
    return matched.length ? matched : domains.map(d => d.id);
  }

  _matchesDomain(queryText, domain) {
    const text = queryText.toLowerCase();
    const hay = [domain.id, domain.name, domain.nameEn, domain.description || ''].join(' ').toLowerCase();
    if (hay.includes(text)) return true;
    const seeds = this.ontology.getAnalogySeeds(domain.id).concat(this.ontology.getCausalSeeds(domain.id));
    return seeds.some(s => text.includes(s.toLowerCase()));
  }

  _collectCandidates(domainIds, linkType, maxCandidates) {
    const seen = new Set();
    const results = [];
    for (const domainId of domainIds) {
      const edges = this.ontology.graphAdapter.queryDomainEdges(domainId, linkType, {
        includeIncoming: true,
        includeOutgoing: true,
        sortByConfidence: true,
        limit: maxCandidates,
      });
      for (const edge of edges) {
        const key = `${edge.subject}|${edge.predicate}|${edge.object}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          subject: edge.subject,
          predicate: edge.predicate,
          object: edge.object,
          confidence: edge.confidence,
        });
      }
      const related = this.ontology.graphAdapter.getRelatedDomains(domainId, 1);
      for (const rel of related) {
        const key = `related:${domainId}|${rel.domain}|${rel.linkType}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          subject: `domain:${domainId}`,
          predicate: rel.linkType,
          object: `domain:${rel.domain}`,
          confidence: rel.confidence,
        });
      }
    }
    return results;
  }

  _rank(candidates, queryText) {
    const q = queryText.toLowerCase();
    candidates.forEach(item => {
      const subject = (item.subject || '').toLowerCase();
      const object = (item.object || '').toLowerCase();
      const predicate = (item.predicate || '').toLowerCase();
      let boost = 0;
      if (q && subject.includes(q)) boost += 0.2;
      if (q && object.includes(q)) boost += 0.2;
      if (q && predicate.includes(q)) boost += 0.1;
      item._rankScore = Math.max(0, Math.min(1, (item.confidence || 0) + boost));
    });
    return candidates.sort((a, b) => (b._rankScore || 0) - (a._rankScore || 0));
  }

  _verifierSummary(items) {
    const blocked = items.filter(it => (it.confidence || 0) < this.minConfidence);
    return {
      enabled: true,
      minConfidence: this.minConfidence,
      totalItems: items.length,
      blockedCount: blocked.length,
      blockedItems: blocked.map(it => ({ subject: it.subject, object: it.object, confidence: it.confidence })),
    };
  }

  getStats() {
    return {
      minConfidence: this.minConfidence,
      ontologyStats: this.ontology.getStats(),
      annotatorStats: this.annotator.getStats(),
    };
  }
}

module.exports = { KnowledgeQuery };
