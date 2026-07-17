#!/usr/bin/env node
/** test/knowledge-graph-adapter.test.js */
const { KnowledgeGraphAdapter } = require('../src/knowledge/knowledge-graph-adapter.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== KnowledgeGraphAdapter 单元测试 ===\n');

const adapter = new KnowledgeGraphAdapter({ dataDir: '/tmp/hf-test-kga' });
assert(adapter.kg, 'kg 实例存在');

const edge = adapter.addDomainEdge('math', 'physics', 'relates', 0.8, { note: 'test' });
assert(edge && typeof edge.confidence === 'number', 'addDomainEdge 返回边');

const edges = adapter.queryDomainEdges('math', 'relates');
assert(Array.isArray(edges), 'queryDomainEdges 返回数组');

const related = adapter.getRelatedDomains('math', 1);
assert(Array.isArray(related), 'getRelatedDomains 返回数组');

const paths = adapter.findDomainPath('math', 'physics');
assert(Array.isArray(paths), 'findDomainPath 返回数组');

const stats = adapter.getStats();
assert(stats && typeof stats.triplesAdded === 'number', 'getStats 含 triplesAdded');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
