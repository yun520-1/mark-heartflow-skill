#!/usr/bin/env node
/** test/source-annotator.test.js */
const { SourceAnnotator } = require('../src/knowledge/source-annotator.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== SourceAnnotator 单元测试 ===\n');

const annotator = new SourceAnnotator({ annotationsPath: '/tmp/hf-test-annotator/annotations.json' });
assert(annotator.annotations && Array.isArray(annotator.annotations), 'annotations 初始化为数组');

const rec = annotator.annotate({ id: 'a1', source: 'test', sourceType: 'manual', domain: 'math', confidence: 0.9 });
assert(rec && rec.id === 'a1', 'annotate 返回记录: ' + JSON.stringify(rec));

const all = annotator.query({});
assert(Array.isArray(all) && all.length >= 1, 'query 无过滤返回记录');

const byDomain = annotator.query({ domain: 'math' });
assert(byDomain.length >= 1, 'domain 过滤生效');

const stats = annotator.getStats();
assert(stats && typeof stats.total === 'number', 'getStats 含 total');

const refreshed = annotator.refresh('a1', { confidence: 0.7 });
assert(refreshed && refreshed.confidence === 0.7, 'refresh 更新 confidence');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
