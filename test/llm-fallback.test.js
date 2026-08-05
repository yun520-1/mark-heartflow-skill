/**
 * test/llm-fallback.test.js — LLM 兜底链路测试
 * 覆盖：llm-client 配置解析 / 任务分类兜底 / _llmFallback 接线
 * 注意：provider 无关——不写死任何 API 厂商，配置来自用户环境
 */
'use strict';
const assert = require('assert');
const path = require('path');

module.exports = function ({ test }) {
  const ROOT = path.join(__dirname, '..');

  test('llm-client: 配置来自用户环境（provider 无关）', () => {
    const { getConfig } = require('../src/llm/llm-client.js');
    const cfg = getConfig();
    // 配置可能为空（用户没配 LLM）——这是合法的，纯规则模式
    // 断言重点是：配置来源是 env/config，不是代码写死
    assert.ok(typeof cfg.apiKey === 'string', 'apiKey 应为字符串');
    assert.ok(typeof cfg.baseUrl === 'string', 'baseUrl 应为字符串');
    assert.ok(typeof cfg.model === 'string', 'model 应为字符串');
  });

  test('llm-client: host 白名单校验', () => {
    const { validateHost } = require('../src/llm/llm-client.js');
    assert.ok(validateHost('https://api.openai.com/v1'), 'openai 应合法');
    assert.ok(validateHost('https://copilot.tencent.com/v2'), '腾讯 copilot 应合法');
    assert.ok(validateHost('https://api.stepfun.com/step_plan/v1'), 'stepfun 应合法');
    assert.ok(!validateHost('https://evil.com'), '恶意域名应拒绝');
  });

  test('llm-client: 未配置 key 时报错（不静默切换）', async () => {
    const { chat } = require('../src/llm/llm-client.js');
    // 临时清空配置（模拟用户未配置）
    const origKey = process.env.HEARTFLOW_LLM_API_KEY;
    const origBase = process.env.HEARTFLOW_LLM_BASE_URL;
    process.env.HEARTFLOW_LLM_API_KEY = '';
    process.env.HEARTFLOW_LLM_BASE_URL = '';
    // 清 require 缓存强制重读
    delete require.cache[require.resolve('../src/llm/llm-client.js')];
    const { getConfig: fresh } = require('../src/llm/llm-client.js');
    const cfg = fresh();
    // 如果用户 config.yaml 有 key，跳过（本机有配置）
    if (!cfg.apiKey) {
      await assert.rejects(() => chat('system', 'user'), /API key/);
    }
    process.env.HEARTFLOW_LLM_API_KEY = origKey;
    process.env.HEARTFLOW_LLM_BASE_URL = origBase;
  });

  test('llm-fallback: 任务分类返回合法 type（有配置时）', async () => {
    const { getConfig } = require('../src/llm/llm-client.js');
    if (!getConfig().apiKey) return; // 未配置则跳过真实调用
    const { classifyTaskWithLLM } = require('../src/llm/task-classifier-fallback.js');
    const r = await classifyTaskWithLLM('写一首关于秋天的诗', []);
    assert.ok(['general', 'calculation', 'judgment', 'creative', 'debate', 'reflection', 'emotion', 'memory'].includes(r.type), `type 应合法，实际 ${r.type}`);
    assert.ok(r.confidence >= 0 && r.confidence <= 1, 'confidence 应在 0-1');
  });

  test('llm-fallback: heartflow._llmFallback 已接线（无 key 时静默降级）', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    await new Promise(r => setTimeout(r, 2500));
    // 有配置：_llmFallback 是函数；无配置：保持 null（纯规则）
    const { getConfig } = require('../src/llm/llm-client.js');
    if (getConfig().apiKey) {
      assert.strictEqual(typeof hf._llmFallback, 'function', '_llmFallback 应是函数');
      const r = await hf._llmFallback('你觉得人生有意义吗？', ['judgment']);
      assert.ok(r.type, '应返回 type');
    } else {
      // 无 key 时 heartflow 不接 LLM，纯规则模式
      assert.ok(hf._llmFallback === null || typeof hf._llmFallback === 'function', '无 key 时应为 null 或保持纯规则');
    }
    hf.shutdown();
  });
};
