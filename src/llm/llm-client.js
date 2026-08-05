/**
 * src/llm/llm-client.js — 心虫 LLM 兜底客户端（规则引擎的"第二只眼睛"）
 *
 * 设计原则（用户确认：结合 + 冗余）：
 * - 规则引擎能判的 → 规则秒判（快、稳、免费）
 * - 规则判不了（置信度 < 阈值）→ 调大模型兜底
 * - 大模型结果 → 再经心虫 gate 校验（防大模型被诱导）
 *
 * 配置来源（复用 Hermes 的模型配置，不新增凭据）：
 *   1. 环境变量 HEARTFLOW_LLM_API_KEY / HEARTFLOW_LLM_BASE_URL / HEARTFLOW_LLM_MODEL
 *   2. 回退到 Hermes config.yaml（~/.hermes/config.yaml）的 model.api_key/base_url/default
 *   3. 再回退到逻辑推理引擎的腾讯 Copilot 默认
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

function loadHermesConfig() {
  try {
    const cfgPath = path.join(os.homedir(), '.hermes', 'config.yaml');
    if (!fs.existsSync(cfgPath)) return {};
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const result = { providers: [] };

    // 解析顶层 model 段（只取文件最顶部的 model: 块，精确匹配）
    const topMatch = raw.match(/^model:\s*\n((?:  [^\n]+\n?)+)/m);
    if (topMatch) {
      for (const line of topMatch[1].split('\n')) {
        const m = line.match(/^\s{2}([a-z_]+):\s*(.+)$/);
        if (m) result[m[1]] = m[2].trim().replace(/['"]/g, '');
      }
    }

    // 解析 custom_providers 列表（按 "- " 块切分，字段顺序无关）
    const providerBlocks = raw.split(/^\s{2}-\s+(?=name:|api_key:)/m).slice(1);
    for (const block of providerBlocks) {
      const name = (block.match(/name:\s*(.+)/) || ['', ''])[1].trim().replace(/['"]/g, '');
      const apiKey = (block.match(/api_key:\s*(.+)/) || ['', ''])[1].trim().replace(/['"]/g, '');
      const baseUrl = (block.match(/base_url:\s*(.+)/) || ['', ''])[1].trim().replace(/['"]/g, '');
      const model = (block.match(/^model:\s*(.+)$/m) || ['', ''])[1].trim().replace(/['"]/g, '');
      if (apiKey && baseUrl) {
        result.providers.push({ name, apiKey, baseUrl, model });
      }
    }
    return result;
  } catch { return {}; }
}

let _config = null;
function getConfig() {
  if (_config) return _config;
  const hermesCfg = loadHermesConfig();

  // 收集所有可用 provider（冗余：一个没额度换下一个）
  const providers = [];
  // 1. auth.json 的 credential_pool（指纹可能缺 key，跳过无 key 的）
  try {
    const authPath = path.join(os.homedir(), '.hermes', 'auth.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      for (const [name, creds] of Object.entries(auth.credential_pool || {})) {
        if (!Array.isArray(creds) || creds.length === 0) continue;
        for (const c of creds) {
          const key = c.api_key || c.secret || '';
          const base = c.base_url || '';
          if (!key || !base) continue;
          providers.push({ name, apiKey: key, baseUrl: base, model: c.model || '' });
        }
      }
    }
  } catch { /* auth.json 不可读 */ }

  // 2. config.yaml 的 providers 列表（有明文 key）
  for (const p of hermesCfg.providers || []) {
    providers.push({ name: p.name || 'config', apiKey: p.apiKey, baseUrl: p.baseUrl, model: p.model || '' });
  }

  // 3. 顶层 model 段（腾讯 copilot 兜底）
  if (hermesCfg.api_key && hermesCfg.base_url) {
    providers.push({
      name: 'config:model',
      apiKey: hermesCfg.api_key,
      baseUrl: hermesCfg.base_url,
      model: hermesCfg.default || 'deepseek-v4-flash',
    });
  }

  // 环境变量覆盖（最高优先级，单 provider）
  if (process.env.HEARTFLOW_LLM_API_KEY && process.env.HEARTFLOW_LLM_BASE_URL) {
    providers.unshift({
      name: 'env',
      apiKey: process.env.HEARTFLOW_LLM_API_KEY,
      baseUrl: process.env.HEARTFLOW_LLM_BASE_URL,
      model: process.env.HEARTFLOW_LLM_MODEL || 'deepseek-v4-flash',
    });
  }

  // 模型名修正：stepfun 用 step-3.7-flash
  for (const p of providers) {
    if (p.baseUrl.includes('stepfun') && !p.model.includes('step-')) p.model = 'step-3.7-flash';
    // 腾讯 copilot 默认模型 deepseek-v4-flash
    if ((p.baseUrl.includes('copilot.tencent.com') || p.baseUrl.includes('api.tencent.com')) && !p.model) p.model = 'deepseek-v4-flash';
  }

  // 冗余排序：活 key（顶层 config:model 腾讯）优先，已知失效的排后
  providers.sort((a, b) => {
    const aTencent = a.baseUrl.includes('copilot.tencent.com') && a.apiKey.startsWith('ck_fpvs');
    const bTencent = b.baseUrl.includes('copilot.tencent.com') && b.apiKey.startsWith('ck_fpvs');
    if (aTencent && !bTencent) return -1;
    if (!aTencent && bTencent) return 1;
    return 0;
  });

  _config = { providers, apiKey: providers[0]?.apiKey || '', baseUrl: providers[0]?.baseUrl || '', model: providers[0]?.model || 'deepseek-v4-flash' };
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
  const { providers } = getConfig();
  if (!providers || providers.length === 0) throw new Error('[llm-client] 未配置任何 API provider');

  let lastErr = null;
  // 冗余：遍历所有 provider，一个失败换下一个
  for (const provider of providers) {
    if (!provider.apiKey) continue;
    if (!validateHost(provider.baseUrl)) {
      lastErr = new Error(`[llm-client] base_url host 不在白名单: ${provider.baseUrl}`);
      continue;
    }
    try {
      const url = provider.baseUrl.replace(/\/$/, '') + '/chat/completions';
      // 腾讯 copilot 要求 stream=true（非流式返回 11101）
      const isTencent = provider.baseUrl.includes('copilot.tencent.com') || provider.baseUrl.includes('api.tencent.com');
      const body = JSON.stringify({
        model: opts.model || provider.model || (isTencent ? 'deepseek-v4-flash' : 'deepseek-v4-flash'),
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
          'Authorization': 'Bearer ' + provider.apiKey,
        },
        body,
        timeout: opts.timeoutMs || 15000,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        lastErr = new Error(`[llm-client] HTTP ${res.status}: ${errText.slice(0, 200)}`);
        // 4xx 认证/额度类错误直接换下一个 provider，5xx 也换（冗余设计）
        continue;
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
      return { content, raw: jsonData || {}, model: provider.model, provider: provider.name };
    } catch (e) {
      lastErr = e;
      // 网络/超时错误也换下一个
    }
  }
  throw lastErr || new Error('[llm-client] 所有 provider 均失败');
}

module.exports = { chat, getConfig, validateHost, ALLOWED_HOSTS };
