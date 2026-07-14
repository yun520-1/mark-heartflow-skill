#!/usr/bin/env node
/** test/knowledge-ontology.test.js */
const { KnowledgeOntology } = require('../src/knowledge/knowledge-ontology.js');
const { KnowledgeGraphAdapter } = require('../src/knowledge/knowledge-graph-adapter.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== KnowledgeOntology 单元测试 ===\n');

const adapter = new KnowledgeGraphAdapter({ dataDir: '/tmp/hf-test-ontology' });
const ontology = new KnowledgeOntology({
  domainsPath: require('path').join(__dirname, '..', 'formulas', 'ontology', 'domains.json'),
  graphAdapter: adapter,
});

assert(ontology, 'KnowledgeOntology 实例化');
assert(Array.isArray(ontology.domains), 'domains 是数组');
assert(ontology.domains.length > 0, 'domains 非空: ' + ontology.domains.length);

const top = ontology.getTopLevelDomains();
assert(Array.isArray(top), 'getTopLevelDomains 返回数组');
assert(top[0] && top[0].id, '顶级领域含 id');

const domain = ontology.getDomain(top[0].id);
assert(domain, 'getDomain 可查: ' + top[0].id);

const children = ontology.getChildren(top[0].id);
assert(Array.isArray(children), 'getChildren 返回数组');

const seeds = ontology.getAnalogySeeds(top[0].id);
assert(Array.isArray(seeds), 'getAnalogySeeds 返回数组');

const causal = ontology.getCausalSeeds(top[0].id);
assert(Array.isArray(causal), 'getCausalSeeds 返回数组');

const stats = ontology.getStats();
assert(stats && typeof stats.topLevelCount === 'number', 'getStats 含 topLevelCount');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
