'use strict';
/**
 * StrategyOrchestrator — 战略推演层
 *
 * 职责：把"外部信号"（行业趋势 / 论文 / 社区情绪 / 审计报告）翻译成
 *        心虫自身的「能力 gap → 进化优先级」，供 SelfEvolutionCore 消费。
 *
 * 设计原则（对齐 2026-07 研究成熟化趋势）：
 *  1. 目标/范围驱动：每个信号必须映射到明确的 capability 维度，不盲目自改
 *  2. 防 Phantom Guardrails：所有"已修复"结论必须带验证句柄，禁止无验证的自称
 *  3. 可审计：每次推演产出结构化 decision log，可被外部读取核验
 *
 * 本模块只做编排，不写文件、不 commit。真实改动由调用方（闭环脚本）执行并验证。
 */

const SIGNAL_SOURCES = ['industry_trend', 'arxiv', 'community_sentiment', 'audit_report', 'self_scan'];

// capability 维度 ↔ 信号关键词映射
const CAPABILITY_MAP = [
  {
    dimension: 'strategy_inference',
    desc: '基于外部信号反推自身进化优先级的能力',
    signals: ['trend', 'self-improving', 'capability gap', 'roadmap', '方向', '趋势', '战略'],
    weight: 1.0,
  },
  {
    dimension: 'auditable_transparency',
    desc: '输出可审计、可验证、防 slop 的透明化能力',
    signals: ['transparent', 'auditable', 'trustworthy', 'slop', '可控', '可审计', '反噬'],
    weight: 0.9,
  },
  {
    dimension: 'local_zero_dependency',
    desc: '本地化、零云端依赖的可控部署能力',
    signals: ['local ai', 'local-first', 'privacy', '本地', '隐私', '离线'],
    weight: 0.8,
  },
  {
    dimension: 'multi_agent_discipline',
    desc: '多智能体收益边界判断（不盲目堆 agent）',
    signals: ['multi-agent', 'information bottleneck', 'agent 降温', 'single-agent'],
    weight: 0.7,
  },
  {
    dimension: 'safety_governance',
    desc: 'AI 安全阈值统一与治理对齐能力',
    signals: ['safety threshold', 'governance', 'harmoniz', '安全治理', '阈值'],
    weight: 0.85,
  },
];

function _matchSignals(text, keywords) {
  const lower = (text || '').toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) hits++;
  }
  return hits;
}

class StrategyOrchestrator {
  /**
   * @param {object} opts
   * @param {string} opts.projectRoot 心虫根目录
   * @param {object} [opts.selfScanner] 可选 SelfScanner 实例（提供内部弱点扫描）
   */
  constructor(opts = {}) {
    this.projectRoot = opts.projectRoot || process.cwd();
    this._scanner = opts.selfScanner || null;
    this._lastDecision = null;
  }

  /**
   * 推演主入口
   * @param {Array<{source:string, text:string, meta?:object}>} signals 外部信号列表
   * @returns {object} 结构化推演结果
   */
  orchestrate(signals = []) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return { ok: false, reason: 'no_signals', priorities: [] };
    }
    // 过滤非法 source
    const valid = signals.filter(s => s && SIGNAL_SOURCES.includes(s.source));
    if (valid.length === 0) {
      return { ok: false, reason: 'invalid_sources', allowed: SIGNAL_SOURCES, priorities: [] };
    }

    // 1) 信号 → capability 维度打分
    const scores = {};
    for (const cap of CAPABILITY_MAP) scores[cap.dimension] = 0;
    for (const sig of valid) {
      // [v6.0.61] 内部弱点直驱：self_scan 信号的 weaknesses 直接映射能力维度打分
      // 这是真升级——之前扫出的弱点不影响优先级(只看 sig.text 关键词), 等于空转
      if (sig.source === 'self_scan' && sig.weaknesses) {
        const w = sig.weaknesses;
        if (w.todoCount > 30) scores.maintainability = (scores.maintainability||0) + 1.0 * 1.2;
        if (w.silentCatches > 0) scores.reliability = (scores.reliability||0) + w.silentCatches * 0.15 * 1.2;
        if (w.longFunctions && w.longFunctions.length) scores.maintainability = (scores.maintainability||0) + w.longFunctions.length * 0.4 * 1.2;
        if (w.untestedModules && w.untestedModules.length) scores.testing = (scores.testing||0) + Math.min(w.untestedModules.length,20) * 0.1 * 1.2;
        if (w.coreFileSize) { const big = Object.values(w.coreFileSize).filter(kb=>kb>200).length; if (big>0) scores.architecture = (scores.architecture||0) + big * 0.3 * 1.2; }
      }
      const sigText = sig.text || (sig.weaknesses ? 'self_scan weakness todo untested monolith' : '');
      for (const cap of CAPABILITY_MAP) {
        const hits = _matchSignals(sigText, cap.signals);
        if (hits > 0) {
          const sourceBoost = sig.source === 'self_scan' ? 1.2 : 1.0;
          scores[cap.dimension] += hits * cap.weight * sourceBoost;
        }
      }
    }

    // 2) 合并内部弱点扫描（若有）
    let internalWeaknesses = null;
    if (this._scanner && typeof this._scanner.scan === 'function') {
      try { internalWeaknesses = this._scanner.scan(); } catch (_) { internalWeaknesses = null; }
    }

    // 3) 排序出优先级
    const priorities = Object.entries(scores)
      .map(([dimension, score]) => {
        const meta = CAPABILITY_MAP.find(c => c.dimension === dimension);
        return { dimension, score: Math.round(score * 100) / 100, desc: meta ? meta.desc : '' };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);

    const decision = {
      ok: true,
      ts: Date.now(),
      signalCount: valid.length,
      scores,
      priorities,
      topPriority: priorities.length ? priorities[0].dimension : null,
      internalWeaknessScan: internalWeaknesses
        ? { todoCount: internalWeaknesses.todoCount, silentCatches: internalWeaknesses.silentCatches, longFunctions: internalWeaknesses.longFunctions ? internalWeaknesses.longFunctions.length : 0, untestedModules: internalWeaknesses.untestedModules ? internalWeaknesses.untestedModules.length : 0, coreFileSize: internalWeaknesses.coreFileSize || {} }
        : null,
      // 防 Phantom Guardrails：明确标注本推演未做任何真实改动
      verified: false,
      note: '推演层只产出优先级，不自行修改代码；真实改动须由闭环脚本执行并带 git 验证',
    };
    this._lastDecision = decision;
    return decision;
  }

  getLastDecision() { return this._lastDecision; }
}

module.exports = { StrategyOrchestrator, CAPABILITY_MAP, SIGNAL_SOURCES };
