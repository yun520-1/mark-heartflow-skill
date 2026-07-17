/**
 * src/knowledge/index.js
 *
 * 子层聚合与 dispatch 注册：
 *  - 聚合 KnowledgeOntology / KnowledgeGraphAdapter / CrossDomainReasoner / KnowledgeQuery / SourceAnnotator
 *  - 提供统一 knowledge 子系统的 API 集合，供 heartflow.js 注册到 _modules / dispatch 路由
 */

const path = require('path');
const { KnowledgeOntology } = require('./knowledge-ontology.js');
const { KnowledgeGraphAdapter } = require('./knowledge-graph-adapter.js');
const { CrossDomainReasoner } = require('./cross-domain-reasoner.js');
const { KnowledgeQuery } = require('./knowledge-query.js');
const { SourceAnnotator } = require('./source-annotator.js');

class KnowledgeSubsystem {
  constructor(options = {}) {
    this.rootPath = options.rootPath || path.join(__dirname, '..', '..');
    const graphAdapter = options.graphAdapter || null;
    this.ontology = new KnowledgeOntology({
      domainsPath: options.domainsPath || path.join(this.rootPath, 'formulas', 'ontology', 'domains.json'),
      graphAdapter,
    });
    this.graphAdapter = this.ontology.graphAdapter;
    this.reasoner = new CrossDomainReasoner({ graphAdapter: this.graphAdapter });
    this.queryEngine = new KnowledgeQuery({
      ontology: this.ontology,
      annotator: new SourceAnnotator({ annotationsPath: options.annotationsPath }),
    });
    this.annotator = this.queryEngine.annotator;
  }

  getStats() {
    return this.ontology.getStats();
  }

  listDomains() {
    return this.ontology.getTopLevelDomains();
  }

  getDomain(id) {
    return this.ontology.getDomain(id);
  }

  getChildren(domainId) {
    return this.ontology.getChildren(domainId);
  }

  query(optionsOrQuery, domain, limit) {
    let options = optionsOrQuery;
    if (typeof optionsOrQuery === 'string') {
      options = { q: optionsOrQuery, domain, limit };
    }
    if (!options || typeof options !== 'object') options = {};
    if (options.q || options.domain) {
      return this.queryEngine.query(options);
    }
    return this.graphAdapter.kg.query(options);
  }

  graphQuery(options) {
    return this.graphAdapter.kg.query(options);
  }

  analogicalInfer(fromDomain, toDomain, options) {
    return this.reasoner.analogicalInfer(fromDomain, toDomain, options);
  }

  causalChain(fromDomain, toDomain, options) {
    return this.reasoner.causalChain(fromDomain, toDomain, options);
  }

  annotate(record) {
    return this.annotator.annotate(record);
  }

  getAnnotations(opts) {
    return this.annotator.query(opts);
  }

  save(filePath) {
    return this.graphAdapter.save(filePath);
  }

  load(filePath) {
    return this.graphAdapter.load(filePath);
  }

  // Compatibility: existing heartflow.knowledge.* routes
  addNode(node) {
    const name = node && node.name ? node.name : String(node);
    const description = node && node.description ? node.description : '';
    const type = node && node.type ? node.type : 'concept';
    const importance = node && typeof node.importance === 'number' ? node.importance : 0.5;
    this.graphAdapter.kg.addEdge(name, 'type', type, importance);
    this.graphAdapter.kg.addEdge(name, 'description', description, importance);
    return { name, type, description, importance };
  }

  search(queryText) {
    const text = (queryText || '').trim();
    if (!text) return [];
    const entities = this.graphAdapter.kg.searchEntities(text);
    return entities.map(name => ({ name, matches: [name] }));
  }

  // Graph adapter proxy: keep direct graph API available under hf.knowledge.*
  addEdge(subject, predicate, object, confidence) {
    return this.graphAdapter.kg.addEdge(subject, predicate, object, confidence);
  }

  getRelated(entity, depth) {
    return this.graphAdapter.kg.getRelated(entity, depth);
  }

  searchEntities(name) {
    return this.graphAdapter.kg.searchEntities(name);
  }

  findPath(from, to, maxDepth) {
    return this.graphAdapter.kg.findPath(from, to, maxDepth);
  }

  clear() {
    return this.graphAdapter.kg.clear();
  }
}

module.exports = { KnowledgeSubsystem };
