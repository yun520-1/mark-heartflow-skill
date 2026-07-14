/**
 * knowledge-graph-adapter.js
 *
 * 适配复用 src/memory/knowledge-graph.js，为上层知识本体/跨域推理提供统一访问层。
 * 职责：
 *  - 代理 KnowledgeGraph 的 addEdge / query / getRelated / findPath / save / load
 *  - 统一跨域索引命名约定：domain、concept、linkType
 *  - 对本体/跨域推理屏蔽底层存储细节
 */

const { KnowledgeGraph } = require('../memory/knowledge-graph.js');
const path = require('path');

class KnowledgeGraphAdapter {
  /**
   * @param {object} [options]
   * @param {string} [options.dataDir] 持久化目录
   * @param {number} [options.maxTriples] 最大三元组数
   */
  constructor(options = {}) {
    this.dataDir = options.dataDir || null;
    this.kg = new KnowledgeGraph(this.dataDir);
  }

  _domainKey(domainId) {
    return `domain:${domainId}`;
  }

  _conceptKey(domainId, conceptId) {
    return `concept:${domainId}:${conceptId}`;
  }

  _linkKey(fromDomain, toDomain, linkType) {
    return `link:${fromDomain}->${toDomain}:${linkType}`;
  }

  /**
   * 添加/更新跨域关联边
   */
  addDomainEdge(fromDomain, toDomain, linkType, confidence = 0.5, metadata = {}) {
    const triple = {
      subject: this._domainKey(fromDomain),
      predicate: linkType,
      object: this._domainKey(toDomain),
      confidence,
    };
    const result = this.kg.addEdge(triple.subject, triple.predicate, triple.object, confidence);
    return { ...result, metadata };
  }

  /**
   * 查询领域内或跨域边
   */
  queryDomainEdges(domainId, linkType, options = {}) {
    const subjectFilter = this._domainKey(domainId);
    const objectFilter = this._domainKey(domainId);
    return this.kg.query({
      subject: options.includeIncoming ? undefined : subjectFilter,
      object: options.includeOutgoing ? undefined : objectFilter,
      predicate: linkType || undefined,
      fuzzy: options.fuzzy !== false,
      limit: options.limit || 200,
      sortByConfidence: options.sortByConfidence !== false,
    });
  }

  /**
   * 获取关联图谱
   */
  getRelatedDomains(domainId, depth = 1) {
    const entity = this._domainKey(domainId);
    const related = this.kg.getRelated(entity, depth);
    return related.map(t => ({
      domain: t.object.replace(/^domain:/, ''),
      linkType: t.predicate,
      confidence: t.confidence,
      direction: t.subject === entity ? 'outgoing' : 'incoming',
    }));
  }

  /**
   * 查找领域间路径
   */
  findDomainPath(fromDomain, toDomain, maxDepth = 4) {
    const from = this._domainKey(fromDomain);
    const to = this._domainKey(toDomain);
    const paths = this.kg.findPath(from, to, maxDepth);
    return paths.map(p => p.map(t => ({
      linkType: t.predicate,
      confidence: t.confidence,
      subject: t.subject,
      object: t.object,
    })));
  }

  /**
   * 保存/加载
   */
  save(filePath) {
    if (!filePath && this.dataDir) {
      filePath = path.join(this.dataDir, 'knowledge-graph-adapter.json');
    }
    if (!filePath) throw new Error('save: 未指定路径');
    return this.kg.save(filePath);
  }

  load(filePath) {
    if (!filePath && this.dataDir) {
      filePath = path.join(this.dataDir, 'knowledge-graph-adapter.json');
    }
    if (!filePath) throw new Error('load: 未指定路径');
    return this.kg.load(filePath);
  }

  getStats() {
    return this.kg.getStats();
  }
}

module.exports = { KnowledgeGraphAdapter };
