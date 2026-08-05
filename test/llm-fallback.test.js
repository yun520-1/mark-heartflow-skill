/**
 * test/llm-fallback.test.js — LLM 兜底链路测试
 * 覆盖：llm-client 配置解析 / 任务分类兜底 / _llmFallback 接线
 */
'use strict';
const assert = require('assert');
const path = require('path');

module.exports = function ({ test }) {
  const ROOT = path.join(__dirname, '..');

  test('llm-client: 配置解析（单 provider 腾讯 copilot）', () => {
    const { getConfig } = require('../src/llm/llm-client.js');
    const cfg = getConfig();
    assert.ok(cfg.apiKey, '应有 apiKey');
    assert.ok(cfg.baseUrl, '应有 baseUrl');
    assert.ok(cfg.baseUrl.includes('copilot.tencent.com') || cfg.baseUrl.includes('api.tencent.com'), `baseUrl 应为腾讯 copilot，实际 ${cfg.baseUrl}`);
  });

  test('llm-client: host 白名单校验', () => {
    const { validateHost } = require('../src/llm/llm-client.js');
    assert.ok(validateHost('https://copilot.tencent.com/v2'), '腾讯 copilot 应合法');
    assert.ok(validateHost('https://api.stepfun.com/step_plan/v1'), 'stepfun 应合法');
    assert.ok(!validateHost('https://evil.com'), '恶意域名应拒绝');
  });

  test('llm-fallback: 任务分类返回合法 type', async () => {
    const { classifyTaskWithLLM } = require('../src/llm/task-classifier-fallback.js');
    const r = await classifyTaskWithLLM('写一首关于秋天的诗', []);
    assert.ok(['general', 'calculation', 'judgment', 'creative', 'debate', 'reflection', 'emotion', 'memory'].includes(r.type), `type 应合法，实际 ${r.type}`);
    assert.ok(r.confidence >= 0 && r.confidence <= 1, 'confidence 应在 0-1');
  });

  test('llm-fallback: heartflow._llmFallback 已接线', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    await new Promise(r => setTimeout(r, 2500));
    assert.strictEqual(typeof hf._llmFallback, 'function', '_llmFallback 应是函数');
    const r = await hf._llmFallback('你觉得人生有意义吗？', ['judgment']);
    assert.ok(r.type, '应返回 type');
    hf.shutdown();
  });
};
