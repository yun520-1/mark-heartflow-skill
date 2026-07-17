#!/usr/bin/env node
/** test/knowledge-query.test.js */
const { KnowledgeOntology } = require('../src/knowledge/knowledge-ontology.js');
const { KnowledgeGraphAdapter } = require('../src/knowledge/knowledge-graph-adapter.js');
const { KnowledgeQuery } = require('../src/knowledge/knowledge-query.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== KnowledgeQuery 单元测试 ===\n');

const adapter = new KnowledgeGraphAdapter({ dataDir: '/tmp/hf-test-query' });
const ontology = new KnowledgeOntology({
  domainsPath: require('path').join(__dirname, '..', 'formulas', 'ontology', 'domains.json'),
  graphAdapter: adapter,
});
const query = new KnowledgeQuery({ ontology });

const r1 = query.query({ q: '数学', limit: 3 });
assert(r1 && Array.isArray(r1.items), 'query 返回 items 数组');
assert(r1.topK <= 3, 'topK 不超过 limit');

const r2 = query.query({ domain: ontology.getTopLevelDomains()[0]?.id, limit: 2 });
assert(r2 && Array.isArray(r2.items), 'domain query 返回 items');

const stats = query.getStats();
assert(stats && typeof stats.minConfidence === 'number', 'getStats 含 minConfidence');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
