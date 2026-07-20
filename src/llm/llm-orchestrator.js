/**

 * LLMOrchestrator — 语义展开协作层 (v6.0.4)

 */



const https = require('https');

const fs = require('../utils/safe-fs');

const path = require('path');



class LLMOrchestrator {

  constructor(hf) {

    this.hf = hf;

    this.enabled = false;

    this._lastError = null;

    this._callCount = 0;

    this._successCount = 0;

    this._degradedCount = 0;

  }



  init() {

    try {

      const hasApiKey = !!(this.hf._options?.apiKey || process.env.LLM_API_KEY);

      const hasBaseUrl = !!(this.hf._options?.baseUrl || process.env.LLM_BASE_URL);

      if (!hasApiKey && !hasBaseUrl) {

        this._lastError = '未配置 LLM API Key';

        this.enabled = false;

        return false;

      }

      this.enabled = true;

      return true;

    } catch (e) {

      this._lastError = e.message;

      this.enabled = false;

      return false;

    }

  }



  async semanticExpand(input, context = {}) {

    if (!this.enabled) {

      return this._degradedResult('LLM 未配置');

    }

    this._callCount++;

    try {

      const prompt = this._buildPrompt(input, context);

      const result = await this._callLLM(prompt);

      if (result) {

        this._successCount++;

        return {

          ...result,

          _meta: {

            method: 'llm',

            confidence: 'high',

            note: '由 LLM 协作层生成的语义展开分析',

            timestamp: new Date().toISOString(),

          }

        };

      } else {

        this._degradedCount++;

        return this._degradedResult('LLM 调用失败');

      }

    } catch (e) {

      this._degradedCount++;

      this._lastError = e.message;

      return this._degradedResult(`LLM 调用异常: ${e.message}`);

    }

  }



  _buildPrompt(input, context) {

    const emotion = context.emotion || {};

    const history = context.history || [];

    const awakening = context.awakening || null;

    return `分析心理语义，只返回JSON。\n输入："${input}"\n历史：${history.slice(-3).join('；') || '无'}\n返回JSON：emotion{p,a,d,label,intensity},unspokenNeeds[],defenseMechanisms[{name,trigger,evidence}],memoryAssociations[],cognitivePatterns[{name,evidence}]`;

  }



  async _callLLM(prompt) {

    if (this.hf._userToLLM && typeof this.hf._userToLLM.translate === 'function') {

      try {

        const result = await this.hf._userToLLM.translate(prompt, { type: 'semantic_analysis' });

        if (result && typeof result === 'object') return result;

      } catch (e) { /* fallback */ }

    // [AUDIT-FIX] console.error("[{context}] catch error:", e);

    }



    const apiKey = this.hf._options?.apiKey || process.env.LLM_API_KEY;

    const baseUrl = (this.hf._options?.baseUrl || process.env.LLM_BASE_URL || 'https://api.stepfun.com/step_plan/v1').replace(/\/+$/, '');

    const model = this.hf._options?.model || 'step-3.7-flash';

    if (!apiKey) throw new Error('未配置 LLM API Key');



    return await this._httpsRequest(baseUrl, apiKey, model, prompt);

  }



  async _httpsRequest(baseUrl, apiKey, model, prompt) {

    // [v6.0.50 M6] 走 safeFetch：SSRF 校验 + DNS pinning，杜绝裸 https.request 绕过安全基座
    const { safeFetch } = require('../core/fetch-safe.js');

    const url = baseUrl + '/chat/completions';

    try {
      const res = await safeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: payload,
        timeout: 30000,
      });
      if (res.status < 200 || res.status >= 300) {
        const txt = await res.text().catch(() => '');
        throw new Error('HTTP ' + res.status + ': ' + txt.slice(0, 200));
      }
      const parsed = await res.json();
      const message = parsed?.choices?.[0]?.message || {};
      let content = message.content || '';
      if (!content && message.reasoning) content = message.reasoning;
      if (!content) throw new Error('LLM 返回空内容');
      return this._normalizeResult(this._extractJSON(content));
    } catch (e) {
      throw new Error('LLM 请求失败: ' + e.message);
    }
  }



  _extractJSON(content) {

    let text = String(content).trim();

    if (text.startsWith('```json')) text = text.slice(7);

    else if (text.startsWith('```')) text = text.slice(3);

    if (text.endsWith('```')) text = text.slice(0, -3);

    text = text.trim();

    const start = text.indexOf('{');

    const end = text.lastIndexOf('}');

    if (start >= 0 && end > start) {

      text = text.slice(start, end + 1);

    }

    return JSON.parse(text);

  }



  _normalizeResult(obj) {

    if (!obj || typeof obj !== 'object') return obj;

    const topMap = {

      '情绪分析': 'emotion', '情绪': 'emotion',

      '未被说出的需求': 'unspokenNeeds', '需求': 'unspokenNeeds',

      '防御机制': 'defenseMechanisms', '防御': 'defenseMechanisms',

      '与之前对话的关联': 'memoryAssociations', '关联': 'memoryAssociations',

      '认知模式': 'cognitivePatterns', '模式': 'cognitivePatterns',

    };

    const out = {};

    for (const [k, v] of Object.entries(obj)) {

      const section = topMap[k] || k;

      out[section] = this._normalizeSection(section, v);

    }

    return out;

  }



  _normalizeSection(section, value) {

    if (section === 'emotion' && value && typeof value === 'object' && !Array.isArray(value)) {

      const emotionMap = { 'PAD值': 'pad', '情绪标签': 'label', '强度': 'intensity', 'Pleasure': 'pleasure', 'Arousal': 'arousal', 'Dominance': 'dominance', 'p': 'pleasure', 'a': 'arousal', 'd': 'dominance' };

      const out = {};

      for (const [k, v] of Object.entries(value)) {

        out[emotionMap[k] || k] = v;

      }

      if (out.pad && typeof out.pad === 'object') {

        out.pleasure = out.pleasure ?? out.pad.Pleasure ?? out.pad.pleasure ?? 0;

        out.arousal = out.arousal ?? out.pad.Arousal ?? out.pad.arousal ?? 0;

        out.dominance = out.dominance ?? out.pad.Dominance ?? out.pad.dominance ?? 0;

        delete out.pad;

      }

      return out;

    }

    if ((section === 'defenseMechanisms' || section === 'cognitivePatterns') && typeof value === 'object' && !Array.isArray(value)) {

      value = [value];

    }

    if (Array.isArray(value)) {

      return value.map(item => {

        if (typeof item === 'object' && item !== null) {

          const itemMap = { '名称': 'name', '触发点': 'trigger', '证据': 'evidence', '模式': 'name' };

          const out = {};

          for (const [k, v] of Object.entries(item)) {

            out[itemMap[k] || k] = v;

          }

          return out;

        }

        return item;

      });

    }

    return value;

  }



  _degradedResult(reason) {

    return {

      _meta: {

        method: 'rule-based',

        confidence: 'low',

        degraded: true,

        reason,

        note: 'LLM 协作层不可用，仅使用本地规则层结果。'

      }

    };

  }



  getStats() {

    return {

      enabled: this.enabled,

      callCount: this._callCount,

      successCount: this._successCount,

      degradedCount: this._degradedCount,

      lastError: this._lastError,

    };

  }

}



module.exports = { LLMOrchestrator };