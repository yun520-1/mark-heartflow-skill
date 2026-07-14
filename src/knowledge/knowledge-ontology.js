/**
 * knowledge-ontology.js
 *
 * 领域本体：
 *  - 读取 formulas/ontology/domains.json 作为一级域定义
 *  - 维护层级索引、类比索引、因果索引
 *  - 提供枚举、查找、统计与跨域建议能力
 */

const fs = require('../utils/safe-fs');
const path = require('path');
const { KnowledgeGraphAdapter } = require('./knowledge-graph-adapter.js');

const DEFAULT_DOMAINS_PATH = path.join(__dirname, '..', '..', 'formulas', 'ontology', 'domains.json');

class KnowledgeOntology {
  /**
   * @param {object} [options]
   * @param {string} [options.domainsPath]
   * @param {object} [options.graphAdapter]
   */
  constructor(options = {}) {
    this.domainsPath = options.domainsPath || DEFAULT_DOMAINS_PATH;
    this.raw = this._loadDomains();
    this.domains = this.raw.topLevelDomains || [];
    this.domainsById = new Map(this.domains.map(d => [d.id, d]));
    this.graphAdapter = options.graphAdapter || new KnowledgeGraphAdapter({ dataDir: path.join(__dirname, '..', '..', 'data', 'ontology') });
    this._ensureGraphIndexes();
  }

  _loadDomains() {
    try {
      const raw = fs.readFileSync(this.domainsPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { topLevelDomains: [], meta: { count: 0 } };
    }
  }

  _domainKey(domainId) {
    return `domain:${domainId}`;
  }

  _ensureGraphIndexes() {
    for (const domain of this.domains) {
      const domainEntity = this._domainKey(domain.id);
      this.graphAdapter.kg.addEdge(domainEntity, 'type', 'top_level_domain', 1.0);
      (domain.children || []).forEach(childId => {
        if (this.domainsById.has(childId)) {
          this.graphAdapter.kg.addEdge(domainEntity, 'parent_of', this._domainKey(childId), 0.99);
        }
      });
      (domain.analogySeeds || []).forEach(seed => {
        this.graphAdapter.kg.addEdge(domainEntity, 'analogy_seed', seed, 0.85);
      });
      (domain.causalSeeds || []).forEach(seed => {
        this.graphAdapter.kg.addEdge(domainEntity, 'causal_seed', seed, 0.85);
      });
    }
  }

  getTopLevelDomains() {
    return this.domains.map(d => ({
      id: d.id,
      name: d.name,
      nameEn: d.nameEn,
      description: d.description,
      childCount: (d.children || []).length,
    }));
  }

  getDomain(id) {
    return this.domainsById.get(id) || null;
  }

  getChildren(domainId) {
    const domain = this.domainsById.get(domainId);
    if (!domain) return [];
    return (domain.children || [])
      .map(id => this.domainsById.get(id))
      .filter(Boolean)
      .map(d => ({ id: d.id, name: d.name, nameEn: d.nameEn }));
  }

  getAnalogySeeds(domainId) {
    const domain = this.domainsById.get(domainId);
    return domain ? [...(domain.analogySeeds || [])] : [];
  }

  getCausalSeeds(domainId) {
    const domain = this.domainsById.get(domainId);
    return domain ? [...(domain.causalSeeds || [])] : [];
  }

  getStats() {
    return {
      topLevelCount: this.domains.length,
      totalChildren: this.domains.reduce((sum, d) => sum + (d.children || []).length, 0),
      domainsByIdSize: this.domainsById.size,
      graphStats: this.graphAdapter.getStats(),
    };
  }
}

module.exports = { KnowledgeOntology };
