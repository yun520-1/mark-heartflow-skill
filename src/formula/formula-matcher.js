/**
 * 公式语义匹配器 (FormulaMatcher)
 *
 * 心虫 v5.9.6 优化：让公式从"精确 id 查询"升级为"自然语言 → 公式"的
 * 语义解析与匹配。配套 formula-triggers.json 触发词索引。
 *
 * 能力：
 *  1. matchFromText(text)      —— 从自然语言抽取认知信号，返回排序的匹配公式
 *  2. matchStage(stage, ctx)   —— 给定认知环节+上下文，匹配该环节最合适公式
 *  3. extractSignals(text)     —— 抽取文本中的认知信号词（不确定性/唤醒/记忆/...）
 *
 * 设计原则（匹配心虫"不为了运用而运用"）：
 *  - 只匹配认知目标真正相关的公式（触发词索引聚焦认知/决策/记忆/情绪）
 *  - 每个匹配带 confidence，低于阈值不调用（避免误触发）
 *  - 触发词支持同义扩展（"不确定"≈"模糊"≈"矛盾"）
 *
 * 触发词数据独立于主库 formulas.json（主库是知识库，这里是匹配层索引）
 */

const fs = require('fs');
const path = require('path');

// 触发词索引：signal -> [{ ref, stage?, weight }]
// ref 可以是 formulaId（主库条目）或 stageId（FormulaRegistry 原语）
const TRIGGERS_PATH = path.join(__dirname, 'formula-triggers.json');

class FormulaMatcher {
  constructor(options = {}) {
    this._triggers = this._loadTriggers();
    this._threshold = options.threshold || 0.3;
    // lazy registry 引用
    this._registry = null;
    this._engine = null;
    this.lazy = options.lazy !== false;
  }

  _loadTriggers() {
    try {
      return JSON.parse(fs.readFileSync(TRIGGERS_PATH, 'utf8'));
    } catch (e) {
      return { signals: {}, aliases: {} };
    }
  }

  _getRegistry() {
    if (!this._registry && this.lazy) {
      try { this._registry = require('./formula-registry.js').getFormulaRegistry(); } catch (e) { this._registry = null; }
    }
    return this._registry;
  }

  /**
   * 同义词扩展：把输入词映射到标准信号词
   */
  _normalize(word) {
    const w = word.toLowerCase().trim();
    const aliases = this._triggers.aliases || {};
    return aliases[w] || w;
  }

  /**
   * 从文本抽取认知信号
   * @returns {Map<string, number>} signal -> 命中权重（多词命中累加）
   */
  extractSignals(text) {
    if (!text || typeof text !== 'string') return new Map();
    const lower = text.toLowerCase();
    const tokens = lower.split(/[\s，。、；：！？,.!?;:()（）"'"'"]+/).filter(Boolean);
    const signals = new Map();
    const sigDef = this._triggers.signals || {};

    // 1. 精确词匹配
    for (const [signal, def] of Object.entries(sigDef)) {
      const keys = def.keywords || [];
      let hit = 0;
      for (const kw of keys) {
        const k = kw.toLowerCase();
        if (lower.includes(k)) hit += 1;
      }
      if (hit > 0) signals.set(signal, (signals.get(signal) || 0) + hit);
    }

    // 2. 单字/词元匹配（支持组合信号，如"不确定"+"矛盾"）
    for (const tok of tokens) {
      const norm = this._normalize(tok);
      if (sigDef[norm]) {
        signals.set(norm, (signals.get(norm) || 0) + 1);
      }
    }
    return signals;
  }

  /**
   * 从自然语言文本匹配公式（排序返回）
   * @param {string} text - 用户输入/认知情境描述
   * @param {object} [opts] - { limit, minConfidence, stage }
   * @returns {Array<{ ref, kind, stage?, name?, confidence, signalHit }>}
   */
  matchFromText(text, opts = {}) {
    const { limit = 5, minConfidence = this._threshold, stage = null } = opts;
    const signals = this.extractSignals(text);
    if (signals.size === 0) return [];

    const sigDef = this._triggers.signals || {};
    const scored = [];

    for (const [signal, weight] of signals.entries()) {
      const def = sigDef[signal];
      if (!def) continue;
      const refs = def.refs || [];
      for (const r of refs) {
        // 若指定 stage，只保留该环节
        if (stage && r.stage && r.stage !== stage) continue;
        const base = (r.weight || 1) * weight;
        // 多信号协同：若公式被多个信号指向，累加（取最高信号权重为置信，协同加成）
        const existing = scored.find(s => s.ref === r.ref && s.kind === r.kind);
        if (existing) {
          existing.confidence = Math.min(1, existing.confidence + base * 0.3);
          existing.signalHit.push(signal);
        } else {
          scored.push({
            ref: r.ref,
            kind: r.kind,            // 'formula' | 'stage-primitive'
            stage: r.stage || null,
            name: r.name || null,
            confidence: Math.min(1, base),
            signalHit: [signal]
          });
        }
      }
    }

    scored.sort((a, b) => b.confidence - a.confidence);
    return scored.filter(s => s.confidence >= minConfidence).slice(0, limit);
  }

  /**
   * 给定认知环节 + 上下文，匹配该环节最合适公式
   * @param {string} stage - 认知环节标签（memory_activation 等）
   * @param {object} [ctx] - { text?, signals? }
   */
  matchStage(stage, ctx = {}) {
    const reg = this._getRegistry();
    if (!reg) return [];
    const stagePrims = reg.getStage(stage);
    if (!stagePrims.length) return [];

    // 若提供文本，用文本信号加权
    const signals = ctx.text ? this.extractSignals(ctx.text) : new Map();
    const sigDef = this._triggers.signals || {};

    const out = stagePrims.map(p => {
      let conf = 0.5; // 环节默认中置信
      // 查找该原语是否被某信号直接指向
      for (const [sig, def] of Object.entries(sigDef)) {
        if (signals.has(sig) && (def.refs || []).some(r => r.kind === 'stage-primitive' && r.ref === p.id && r.stage === stage)) {
          conf = Math.max(conf, Math.min(1, 0.5 + 0.4 * (signals.get(sig) || 1)));
        }
      }
      return { ref: p.id, kind: 'stage-primitive', stage, name: p.doc ? p.id : p.id, confidence: conf, signalHit: [...signals.keys()] };
    });
    return out.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 把匹配结果解析为可调用描述（供业务模块直接 call）
   */
  resolve(match) {
    const reg = this._getRegistry();
    if (!reg) return null;
    if (match.kind === 'stage-primitive') {
      const def = reg.get(match.stage, match.ref);
      return def ? { id: match.ref, stage: match.stage, doc: def.doc, impl: def.impl } : null;
    }
    if (match.kind === 'formula' && this._engine) {
      const f = this._engine.getFormulaDetails(match.ref);
      return f || null;
    }
    return null;
  }
}

let _instance = null;
function getFormulaMatcher(options) {
  if (!_instance) _instance = new FormulaMatcher(options);
  return _instance;
}

module.exports = { FormulaMatcher, getFormulaMatcher };
