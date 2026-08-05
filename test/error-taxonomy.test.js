/**
 * test/shield/error-taxonomy.test.js — 错误分类学测试
 */
'use strict';
const assert = require('assert');
const { TAXONOMY, classify, getRecovery, isRetryable, getStats, list } = require('../src/shield/error-taxonomy.js');

module.exports = function ({ test }) {
  test('error-taxonomy: 分类总数 ≥ 20 类', () => {
    const stats = getStats();
    assert.ok(stats.total >= 20, `应有至少20类，实际 ${stats.total}`);
  });

  test('error-taxonomy: 认证错误分类', () => {
    const r = classify(new Error('Invalid API key provided: sk-xxx'));
    assert.strictEqual(r.code, 'auth');
    assert.ok(r.retryable);
  });

  test('error-taxonomy: 永久认证失败不可重试', () => {
    const r = classify(new Error('403 Forbidden: permission denied'), { status: 403 });
    assert.strictEqual(r.code, 'auth_permanent');
    assert.ok(!r.retryable);
  });

  test('error-taxonomy: 速率限制分类 + 恢复策略', () => {
    const r = classify(new Error('429 Too Many Requests'), { status: 429 });
    assert.strictEqual(r.code, 'rate_limit');
    const rec = getRecovery('rate_limit');
    assert.ok(rec.recovery.includes('退避'));
    assert.ok(isRetryable(r));
  });

  test('error-taxonomy: 计费错误立即轮换', () => {
    const r = classify('402 Payment Required: insufficient balance', { status: 402 });
    assert.strictEqual(r.code, 'billing');
    assert.ok(!r.retryable);
  });

  test('error-taxonomy: 超时分类', () => {
    const r = classify('FetchError: request to https://api.x failed, reason: socket hang up');
    assert.strictEqual(r.code, 'timeout');
  });

  test('error-taxonomy: TLS证书错误不可盲目重试', () => {
    const r = classify('unable to verify the first certificate');
    assert.strictEqual(r.code, 'ssl_cert');
    assert.ok(!r.retryable);
  });

  test('error-taxonomy: 上下文超限分类', () => {
    const r = classify('This model maximum context length is 128000 tokens. However you requested 200000');
    assert.strictEqual(r.code, 'context_overflow');
  });

  test('error-taxonomy: 内容策略拦截', () => {
    const r = classify('Your request was rejected by content policy filter');
    assert.strictEqual(r.code, 'content_policy');
    assert.ok(!r.retryable);
  });

  test('error-taxonomy: 认知错误过度自信', () => {
    const r = classify('毫无疑问这是唯一正确的方案');
    assert.strictEqual(r.code, 'overconfidence');
  });

  test('error-taxonomy: 认知错误幻觉', () => {
    const r = classify('根据研究数据表明该结论成立');
    assert.strictEqual(r.code, 'hallucination');
  });

  test('error-taxonomy: 未知错误兜底', () => {
    const r = classify('some weird error 12345');
    assert.strictEqual(r.code, 'unknown');
    assert.ok(r.retryable);
  });

  test('error-taxonomy: list 输出完整', () => {
    const items = list();
    assert.ok(items.length >= 20);
    assert.ok(items.every(i => i.code && i.label && i.recovery));
  });

  test('error-taxonomy: 中文API错误分类', () => {
    const r = classify('请求过于频繁，请稍后再试');
    assert.strictEqual(r.code, 'rate_limit');
  });
};
