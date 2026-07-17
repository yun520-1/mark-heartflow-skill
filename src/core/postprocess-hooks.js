#!/usr/bin/env node
/**
 * HeartFlow Postprocessing & Feedback Hooks
 *
 * 职责：在 think / translate / report 等响应返回用户前，
 * 提供统一的输出加工层和异步反馈收集层。
 *
 * 钩子清单：
 *  - postprocess.format      将结构化结果转为可读文本/Markdown
 *  - postprocess.desensitize 脱敏：移除/遮盖敏感字段
 *  - postprocess.translate   轻量翻译/本地化包装
 *  - feedback.collect        异步非阻塞收集反馈，不影响主响应
 */

const fs = require('../utils/safe-fs');
const path = require('path');

// ─── 工具函数 ────────────────────────────────────────────────────
function safeStringify(value) {
  try { return JSON.stringify(value, null, 2); }
  catch (_) { return String(value); }
}

function pickText(obj) {
  if (typeof obj === 'string') return obj;
  if (!obj || typeof obj !== 'object') return safeStringify(obj);
  if (typeof obj.report === 'string') return obj.report;
  if (typeof obj.text === 'string') return obj.text;
  if (typeof obj.content === 'string') return obj.content;
  if (typeof obj.output === 'string') return obj.output;
  if (typeof obj.summary === 'string') return obj.summary;
  if (typeof obj.answer === 'string') return obj.answer;
  return safeStringify(obj);
}

function timeTag() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `[${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

// ─── 主类 ────────────────────────────────────────────────────────
class PostProcessHooks {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.feedbackDir = options.feedbackDir || path.join(this.rootPath, 'data', 'feedback');
    this.hooks = new Map(); // name -> handler
    this._enabled = options.enabled !== false;
    this._hookBus = null;
    this._initFeedbackDir();
    this._registerDefaults();
  }

  _initFeedbackDir() {
    try { fs.mkdirSync(this.feedbackDir, { recursive: true }); }
    catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
  }

  _registerDefaults() {
    this.register('postprocess.format', (payload, opts) => this.postprocess_format(payload, opts));
    this.register('postprocess.desensitize', (payload, opts) => this.postprocess_desensitize(payload, opts));
    this.register('postprocess.translate', (payload, opts) => this.postprocess_translate(payload, opts));
    this.register('feedback.collect', (payload) => this.feedback_collect(payload));
  }

  // ─── 注册/执行钩子 ─────────────────────────────────────────────
  register(name, handler) {
    if (typeof handler === 'function') this.hooks.set(name, handler);
    return this;
  }

  attachHookBus(bus) {
    this._hookBus = bus;
    return this;
  }

  async run(name, payload) {
    if (!this._enabled) return payload;
    const handler = this.hooks.get(name);
    if (!handler) return payload;
    try {
      const out = handler(payload);
      return out instanceof Promise ? await out : out;
    } catch (_) {
      return payload;
    }
  }

  // ─── postprocess.format ────────────────────────────────────────
  /**
   * 将任意 think/report 结果格式化为可读文本。
   * 默认策略：
   *  1. 若已是 string，直接返回
   *  2. 若含 report/report.text，优先使用
   *  3. 否则 JSON pretty print
   *
   * @param {object} result - 原始 think 结果
   * @param {object} [opts]
   * @param {string} [opts.style=markdown] - markdown | plain | json
   * @returns {string}
   */
  async postprocess_format(result, opts = {}) {
    const style = opts.style || 'markdown';

    if (typeof result === 'string') {
      return style === 'json' ? JSON.stringify({ formatted: result }) : result;
    }

    const text = pickText(result);

    if (style === 'json') {
      return safeStringify({ formatted: text, original: result });
    }
    if (style === 'plain') {
      return text;
    }
    // default: markdown
    const lines = [];
    lines.push('# HeartFlow 分析报告');
    lines.push('');
    lines.push(timeTag());
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(text);
    return lines.join('\n');
  }

  // ─── postprocess.desensitize ───────────────────────────────────
  /**
   * 脱敏：移除或遮盖敏感信息。
   * 默认处理：
   *  - 递归遮盖匹配键：token, secret, password, apiKey, authorization, key
   *  - 字符串中疑似密钥的 32+ hex/base64 片段替换为 ***
   *
   * @param {object|string} result
   * @param {object} [opts]
   * @param {string[]} [opts.extraKeys] - 额外需要遮盖的键名
   * @returns {object|string}
   */
  async postprocess_desensitize(result, opts = {}) {
    const extraKeys = Array.isArray(opts.extraKeys) ? opts.extraKeys : [];
    const sensitiveKeys = new Set([
      'token', 'secret', 'password', 'apiKey', 'api_key', 'authorization',
      'key', 'privateKey', 'private_key', 'credential', 'accessToken', 'access_token',
      ...extraKeys
    ]);

    const maskPattern = /\b[A-Za-z0-9+/]{32,}={0,2}\b/g;
    const mask = () => '***';

    function redact(value) {
      if (typeof value === 'string') {
        return value.replace(maskPattern, mask);
      }
      if (Array.isArray(value)) return value.map(redact);
      if (value && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
          if (sensitiveKeys.has(k.toLowerCase())) {
            out[k] = '***';
          } else {
            out[k] = redact(v);
          }
        }
        return out;
      }
      return value;
    }

    return redact(result);
  }

  // ─── postprocess.translate ─────────────────────────────────────
  /**
   * 轻量翻译/本地化包装：对结果追加语言/方向元信息，
   * 实际翻译由上游 translator 模块完成；此处负责保持一致性。
   *
   * @param {object|string} result
   * @param {object} [opts]
   * @param {string} [opts.from] - 来源语言/上下文
   * @param {string} [opts.to] - 目标语言/上下文
   * @returns {object}
   */
  async postprocess_translate(result, opts = {}) {
    const from = opts.from || 'raw';
    const to = opts.to || 'readable';

    const payload = typeof result === 'string'
      ? { text: result }
      : result;

    return {
      __translate: true,
      from,
      to,
      payload,
      translatedAt: Date.now()
    };
  }

  // ─── feedback.collect ──────────────────────────────────────────
  /**
   * 异步非阻塞收集反馈：将反馈写入 data/feedback/，
   * 返回一个 resolved promise，不阻塞主流程。
   *
   * @param {object} feedback
   * @param {string} [feedback.type] - 反馈类型：quality / latency / error / usage
   * @param {string} [feedback.source] - 来源：heartflow_think / translate / ...
   * @param {*} [feedback.payload] - 原始数据
   * @param {number} [feedback.latencyMs] - 本次处理耗时
   * @returns {Promise<void>}
   */
  async feedback_collect(feedback = {}) {
    const record = {
      type: feedback.type || 'usage',
      source: feedback.source || 'unknown',
      latencyMs: typeof feedback.latencyMs === 'number' ? feedback.latencyMs : null,
      payload: feedback.payload || {},
      createdAt: Date.now(),
      createdAtISO: new Date().toISOString()
    };

    const fileName = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    const filePath = path.join(this.feedbackDir, fileName);

    // 异步写入，不阻塞主流程
    Promise.resolve()
      .then(() => fs.writeFileSync(filePath, safeStringify(record) + '\n', 'utf-8'))
      .catch(() => {
        /* [v5.9.18] intentional: graceful degradation */
      });

    return Promise.resolve();
  }
}

module.exports = { PostProcessHooks };
