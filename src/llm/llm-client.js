/**
 * src/llm/llm-client.js — 心虫 LLM 兜底客户端（规则引擎的"第二只眼睛"）
 *
 * 设计原则（用户确认）：
 * - 规则引擎能判的 → 规则秒判（快、稳、免费）
 * - 规则判不了（置信度 < 阈值）→ 调大模型兜底
 * - 大模型结果 → 再经心虫 gate 校验（防大模型被诱导）
 *
 * Provider 无关设计：
 * - 代码不绑定任何 API 厂商，不写死任何 key
 * - 配置完全来自用户环境（每个用户接自己的 API）：
 *   1. 环境变量 HEARTFLOW_LLM_API_KEY / HEARTFLOW_LLM_BASE_URL / HEARTFLOW_LLM_MODEL
 *   2. 回退到 ~/.hermes/config.yaml 的 model 段（用户自己的配置）
 * - 不自动切换 provider：失败即报错，由用户/宿主处理
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
// 覆盖主流 OpenAI 兼容服务；用户可通过 HEARTFLOW_LLM_ALLOWED_HOSTS 追加
const ALLOWED_HOSTS = [
  'copilot.tencent.com', 'api.tencent.com',
  'api.openai.com', 'api.anthropic.com', 'api.deepseek.com',
  'openrouter.ai', 'generativelanguage.googleapis.com',
  'api.stepfun.com', 'api.stepfun.com.cn', 'api.moonshot.cn',
  'api.siliconflow.cn', 'api.z.ai', 'api.x.ai', 'api.groq.com',
  'api.together.xyz', 'api.mistral.ai', 'api.cohere.ai',
  'api.groq.com', 'ark.cn-beijing.volces.com',
];

function loadUserModelConfig() {
  try {
    const cfgPath = path.join(os.homedir(), '.hermes', 'config.yaml');
    if (!fs.existsSync(cfgPath)) return {};
    const raw = fs.readFileSync(cfgPath, 'utf8');
    // 只取文件最顶部的 model: 块（用户自己的 model 配置）
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
  const userCfg = loadUserModelConfig();
  _config = {
    // 用户自己的 API key（env 优先，其次用户 config.yaml）
    apiKey: process.env.HEARTFLOW_LLM_API_KEY
      || process.env.OPENAI_API_KEY
      || userCfg.api_key
      || '',
    baseUrl: process.env.HEARTFLOW_LLM_BASE_URL
      || userCfg.base_url
      || '',
    model: process.env.HEARTFLOW_LLM_MODEL
      || userCfg.default
      || '',
  };
  return _config;
}

function validateHost(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname;
    const extra = (process.env.HEARTFLOW_LLM_ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
    return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h)) || extra.some(h => host === h || host.endsWith('.' + h));
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
  if (!apiKey) throw new Error('[llm-client] 未配置 API key（设置 HEARTFLOW_LLM_API_KEY 环境变量）');
  if (!baseUrl) throw new Error('[llm-client] 未配置 API base_url（设置 HEARTFLOW_LLM_BASE_URL 环境变量）');
  if (!validateHost(baseUrl)) throw new Error(`[llm-client] base_url host 不在白名单: ${baseUrl}（可在 HEARTFLOW_LLM_ALLOWED_HOSTS 追加）`);

  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  // 部分厂商（腾讯 copilot）要求 stream=true
  const isTencent = baseUrl.includes('copilot.tencent.com') || baseUrl.includes('api.tencent.com');
  const body = JSON.stringify({
    model: opts.model || model || 'gpt-4o-mini',
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens || 500,
    stream: isTencent,  // 腾讯必须流式；其他默认非流式
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
