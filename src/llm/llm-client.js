/**
 * src/llm/llm-client.js — 心虫 LLM 兜底客户端（规则引擎的"第二只眼睛"）
 *
 * 设计原则（用户确认）：
 * - 规则引擎能判的 → 规则秒判（快、稳、免费）
 * - 规则判不了（置信度 < 阈值）→ 调大模型兜底
 * - 大模型结果 → 再经心虫 gate 校验（防大模型被诱导）
 *
 * Provider 策略（用户明确要求）：
 * - 只用腾讯 copilot（当前可用）
 * - 不自动切换 provider（自动换从没成功过，还经常弄错）
 * - 失败就报错，用户自己处理
 *
 * 配置来源（优先级）：
 *   1. 环境变量 HEARTFLOW_LLM_API_KEY / HEARTFLOW_LLM_BASE_URL / HEARTFLOW_LLM_MODEL
 *   2. ~/.hermes/config.yaml 顶层 model 段（copilot.tencent.com）
 *
 * 安全：
 * - API key 只从 env/config 读，不落盘
 * - host 白名单（防 env 注入外泄 key）
 * - 超时 + 失败静默（LLM 挂了不阻断规则引擎）
 */

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

// 允许的 API host（防止 env 注入把 key 发到恶意域名）
const ALLOWED_HOSTS = [
  'copilot.tencent.com', 'api.tencent.com',
  'api.openai.com', 'api.anthropic.com', 'api.deepseek.com',
  'openrouter.ai', 'generativelanguage.googleapis.com',
  'api.stepfun.com', 'api.stepfun.com.cn', 'api.moonshot.cn',
  'api.siliconflow.cn', 'api.z.ai', 'api.x.ai',
];

function loadHermesModelConfig() {
  try {
    const cfgPath = path.join(os.homedir(), '.hermes', 'config.yaml');
    if (!fs.existsSync(cfgPath)) return {};
    const raw = fs.readFileSync(cfgPath, 'utf8');
    // 只取文件最顶部的 model: 块（copilot.tencent.com）
    const topMatch = raw.match(/^model:\s*\n((?:  [^\n]+\n?)+)/m);
    const model = {};
    if (topMatch) {
      for (const line of topMatch[1].split('\n')) {
        const m = line.match(/^\s{2}([a-z_]+):\s*(.+)$/);
        if (m) model[m[1]] = m[2].trim().replace(/['"]/g, '');
      }
    }
    return model;
  } catch { return {}; }
}

let _config = null;
function getConfig() {
  if (_config) return _config;
  const hermesCfg = loadHermesModelConfig();
  _config = {
    apiKey: process.env.HEARTFLOW_LLM_API_KEY
      || hermesCfg.api_key
      || '',
    baseUrl: process.env.HEARTFLOW_LLM_BASE_URL
      || hermesCfg.base_url
      || 'https://copilot.tencent.com/v2',
    model: process.env.HEARTFLOW_LLM_MODEL
      || hermesCfg.default
      || 'deepseek-v4-flash',
  };
  return _config;
}

function validateHost(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname;
    return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

/**
 * 调用 LLM（OpenAI 兼容 /chat/completions）
 * @param {string} system - 系统提示
 * @param {string} user - 用户消息
 * @param {object} [opts] - { maxTokens, temperature, timeoutMs }
 * @returns {Promise<{content: string, raw: object, model: string}>}
 */
async function chat(system, user, opts = {}) {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) throw new Error('[llm-client] 未配置 API key（HEARTFLOW_LLM_API_KEY 或 Hermes config model.api_key）');
  if (!validateHost(baseUrl)) throw new Error(`[llm-client] base_url host 不在白名单: ${baseUrl}`);

  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  // 腾讯 copilot 要求 stream=true（非流式返回 11101）
  const isTencent = baseUrl.includes('copilot.tencent.com') || baseUrl.includes('api.tencent.com');
  const body = JSON.stringify({
    model: opts.model || model || 'deepseek-v4-flash',
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens || 500,
    stream: isTencent,  // 腾讯必须流式
  });

  let safeFetch;
  try { ({ safeFetch } = require('../core/fetch-safe.js')); } catch { safeFetch = fetch; }

  const res = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body,
    timeout: opts.timeoutMs || 15000,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[llm-client] HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.text();
  let content = '';
  let jsonData = null;
  if (isTencent) {
    // 腾讯流式响应：SSE 格式 data: {...}
    for (const line of data.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6));
          const delta = chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.message?.content || '';
          if (delta) content += delta;
          if (chunk?.choices?.[0]?.message?.content) { jsonData = chunk; break; }
        } catch { /* 忽略非 JSON 行 */ }
      }
    }
  } else {
    try { jsonData = JSON.parse(data); } catch { /* 忽略 */ }
    content = jsonData?.choices?.[0]?.message?.content || '';
  }
  return { content, raw: jsonData || {}, model };
}

module.exports = { chat, getConfig, validateHost, ALLOWED_HOSTS };
