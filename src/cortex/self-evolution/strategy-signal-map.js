'use strict';
/**
 * strategy-signal-map — 战略信号映射扩展
 *
 * 背景：strategy-orchestrator.js 的 CAPABILITY_MAP.signals 关键词全是心虫
 *       内部能力维度（silent_failure / liveness / 可审计 ...）。世界格局类
 *       新闻（地缘/经济/科技博弈）进去后一个维度都命中不了，优先级为空，
 *       心虫作为「AI人类」无法理解外部世界。
 *
 * 本模块在不改动 strategy-orchestrator.js 大文件的前提下：
 *   1) 导出 STRATEGY_SIGNAL_MAP —— 新增「世界格局」相关 capability 维度
 *   2) 导出 mergeSignalMap(baseMap) —— 把新维度合并进任意 baseMap（默认注入
 *      自带 CAPABILITY_MAP），返回新数组（不修改入参）
 *   3) 导出 createWorldAwareOrchestrator(opts, baseMap) —— 产出一个能使用
 *      合并后映射表的 StrategyOrchestrator 实例（运行时合并，零侵入）
 *
 * 关键词策略：中文 + 英文。新闻源是中文，但 TechCrunch / arxiv / GitHub /
 * Agent 等外来词常以英文出现，故双语覆盖。
 */

const { StrategyOrchestrator, CAPABILITY_MAP }
  = require('./strategy-orchestrator.js');

// ── 世界格局维度 ────────────────────────────────────────────────
// 每项：{ dimension, weight, desc, signals:[...] }
const STRATEGY_SIGNAL_MAP = [
  {
    dimension: 'geopolitical_awareness',
    weight: 1.6,
    desc: '地缘格局感知：识别导弹/试射/外交/制裁/同盟/冲突/军事等信号，理解国际权力博弈',
    signals: [
      '导弹', 'missile', '试射', 'test launch', '外交', 'diplomacy',
      '制裁', 'sanction', '同盟', 'alliance', '冲突', 'conflict',
      '军事', 'military', '核', 'nuclear', '军演', 'war game',
      '边境', 'border', '地缘', 'geopolit',
    ],
  },
  {
    dimension: 'economic_intuition',
    weight: 1.4,
    desc: '经济直觉：识别外贸/关税/GDP/通胀/就业/印花税/资本/贸易战等信号，理解宏观与产业脉动',
    signals: [
      '外贸', 'foreign trade', '关税', 'tariff', 'gdp', '通胀', 'inflation',
      '就业', 'employment', '印花税', 'stamp duty', '资本', 'capital',
      '贸易战', 'trade war', '汇率', 'exchange rate', '经济', 'economy',
      '出口', 'export', '进口', 'import', '供应链', 'supply chain',
      '衰退', 'recession', '美联储', 'fed',
    ],
  },
  {
    dimension: 'tech_competition',
    weight: 1.5,
    desc: '科技博弈：识别 AI/模型/芯片/多模态/Agent/GitHub/TechCrunch/arxiv 等信号，理解技术权力格局',
    signals: [
      'ai', '人工智能', '模型', 'model', '芯片', 'chip', '半导体', 'semiconductor',
      '多模态', 'multimodal', 'agent', '智能体', 'github', 'techcrunch',
      'arxiv', '大模型', 'llm', '算力', 'compute', '开源', 'open source',
      '闭源', 'proprietary', '机器人', 'robot', '量子', 'quantum',
    ],
  },
  {
    dimension: 'global_sense',
    weight: 1.2,
    desc: '全球格局感：识别世界格局/国际/全球/中美/欧/博弈等信号，形成「世界地图」级别认知',
    signals: [
      '世界格局', '国际', 'global', 'international', '全球', '中美',
      'china-us', '中欧', '欧盟', 'eu', '博弈', 'game theory', 'geopolitical',
      '多极化', 'multipolar', '阵营', 'bloc', '秩序', 'order',
    ],
  },
];

/**
 * 合并信号映射：把世界格局维度并入 baseMap。
 * 不修改 baseMap，返回新数组。重复 dimension 会被新维度覆盖。
 * @param {Array} [baseMap] 基础映射（默认用 orchestrator 自带 CAPABILITY_MAP）
 * @param {Array} [extraMap] 额外维度（默认 STRATEGY_SIGNAL_MAP）
 * @returns {Array} 合并后的新数组
 */
function mergeSignalMap(baseMap, extraMap) {
  const base = Array.isArray(baseMap) ? baseMap : CAPABILITY_MAP;
  const extra = Array.isArray(extraMap) ? extraMap : STRATEGY_SIGNAL_MAP;
  const merged = base.map(x => ({ ...x })); // 浅拷贝，避免污染入参
  const seen = new Set(merged.map(x => x.dimension));
  for (const dim of extra) {
    if (seen.has(dim.dimension)) {
      // 覆盖同名维度（理论上不会，但防御性处理）
      const i = merged.findIndex(x => x.dimension === dim.dimension);
      merged[i] = { ...dim };
    } else {
      merged.push({ ...dim });
    }
  }
  return merged;
}

/**
 * 产出一个能识别世界格局信号的 StrategyOrchestrator 实例。
 * 实现方式：继承 StrategyOrchestrator，把 orchestrate 内部使用的
 * CAPABILITY_MAP 改为合并后的映射表（运行时合并，零侵入原文件）。
 * @param {object} [opts] 透传给 StrategyOrchestrator 的构造参数
 * @param {Array} [baseMap] 基础映射（默认自带 CAPABILITY_MAP）
 * @returns {StrategyOrchestrator} 增强实例
 */
function createWorldAwareOrchestrator(opts, baseMap) {
  const merged = mergeSignalMap(baseMap);
  class WorldAwareOrchestrator extends StrategyOrchestrator {
    constructor() {
      super(opts || {});
      // 让 orchestrate 使用的是合并后的映射。
      // strategy-orchestrator.js 的 orchestrate 直接读模块级 CAPABILITY_MAP，
      // 因此这里用一个影子引用：重写一个使用 this._capabilityMap 的 orchestrate。
      this._capabilityMap = merged;
    }
    orchestrate(signals) {
      // 复用父类逻辑，但把内部遍历的映射换成合并后的映射。
      // 由于父类 orchestrate 闭包引用模块级 CAPABILITY_MAP，无法从外部替换，
      // 故在此复制核心打分逻辑（保持与父类一致），仅映射来源可配。
      if (!Array.isArray(signals) || signals.length === 0) {
        return { ok: false, reason: 'no_signals', priorities: [] };
      }
      const valid = signals.filter(s => s && SIGNAL_SOURCES_INCLUDES(s.source));
      if (valid.length === 0) {
        return { ok: false, reason: 'invalid_sources', allowed: ALLOWED_SOURCES, priorities: [] };
      }
      const scores = {};
      for (const cap of this._capabilityMap) scores[cap.dimension] = 0;
      for (const sig of valid) {
        if (sig.source === 'self_scan' && sig.weaknesses) {
          const w = sig.weaknesses;
          if (w.todoCount > 30) scores.maintainability = (scores.maintainability || 0) + 1.0 * 1.2;
          if (w.silentCatches > 0) scores.reliability = (scores.reliability || 0) + w.silentCatches * 0.15 * 1.2;
          if (w.longFunctions && w.longFunctions.length) scores.maintainability = (scores.maintainability || 0) + w.longFunctions.length * 0.4 * 1.2;
          if (w.untestedModules && w.untestedModules.length) scores.testing = (scores.testing || 0) + Math.min(w.untestedModules.length, 20) * 0.1 * 1.2;
          if (w.coreFileSize) { const big = Object.values(w.coreFileSize).filter(kb => kb > 200).length; if (big > 0) scores.architecture = (scores.architecture || 0) + big * 0.3 * 1.2; }
        }
        if (sig.weaknesses && Array.isArray(sig.weaknesses.livenessProbes)) {
          const dead = sig.weaknesses.livenessProbes.filter(p => p.alive === false);
          if (dead.length) scores.liveness = (scores.liveness || 0) + dead.length * 2.0 * (sig.source === 'self_scan' ? 1.2 : 1.0);
        }
        const sigText = sig.text || (sig.weaknesses ? 'self_scan weakness todo untested monolith liveness silent_failure' : '');
        for (const cap of this._capabilityMap) {
          const hits = _matchSignalsLocal(sigText, cap.signals);
          if (hits > 0) {
            const sourceBoost = sig.source === 'self_scan' ? 1.2 : 1.0;
            scores[cap.dimension] += hits * cap.weight * sourceBoost;
          }
        }
      }
      const priorities = Object.entries(scores)
        .map(([dimension, score]) => {
          const meta = this._capabilityMap.find(c => c.dimension === dimension);
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
        internalWeaknessScan: null,
        verified: false,
        note: '推演层只产出优先级，不自行修改代码；真实改动须由闭环脚本执行并带 git 验证',
      };
      this._lastDecision = decision;
      return decision;
    }
  }
  return new WorldAwareOrchestrator();
}

// 从 strategy-orchestrator 同步的辅助符号（避免重复 require 内部私有函数）
const ALLOWED_SOURCES = ['industry_trend', 'arxiv', 'community_sentiment', 'audit_report', 'self_scan'];
function SIGNAL_SOURCES_INCLUDES(src) { return ALLOWED_SOURCES.includes(src); }
function _matchSignalsLocal(text, keywords) {
  const lower = (text || '').toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) hits++;
  }
  return hits;
}

module.exports = {
  STRATEGY_SIGNAL_MAP,
  mergeSignalMap,
  createWorldAwareOrchestrator,
  // 便于测试直接构造
  _internal: { ALLOWED_SOURCES, _matchSignalsLocal },
};
