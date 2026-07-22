/**
 * WorldLandscape — 心虫世界格局分析引擎 [v6.1.0]
 *
 * 定位：AI人类的核心认知能力之一 —— 理解世界格局。
 * 不是空泛术语生成，而是基于真实信号做结构化地缘/经济/科技博弈研判。
 *
 * 设计原则（来自心虫铁律）：
 *  - 规则引擎，不假装 LLM 全知；输出结构化框架 + 信号命中，诚实标注置信度
 *  - 接真实新闻信号（来自 tencent-news / xinwen 等源），不做无源推测
 *  - 可调用 WorldKnowledge（若存在）做框架匹配，自身也内置基础信号识别
 */

const DEFAULT_FRAMES = {
  west_pacific: {
    name: '西太平洋军事张力',
    actors: ['中国', '美国', '澳大利亚', '日本', '台湾'],
    dynamics: '常态化军事活动 + 同盟协调批评，低烈度可控',
    signal_keywords: ['导弹', '试射', '军事训练', '演习', '外交部', '通报', '澳大利亚', '日本', '台', '第一岛链'],
  },
  tech_decoupling: {
    name: '科技脱钩与标准博弈',
    actors: ['中国', '美国', '欧盟'],
    dynamics: '脱钩不脱网，竞合加速，标准制定权争夺',
    signal_keywords: ['芯片', '制裁', '出口管制', '实体清单', '技术封锁', '标准', '华为', '半导体'],
  },
  economic_multipolar: {
    name: '多极化经济重构',
    actors: ['中国', '美国', '欧盟', '全球南方'],
    dynamics: '外贸结构升级 + 内需托底 + 区域合作强化',
    signal_keywords: ['外贸', '进出口', '关税', '一带一路', 'RCEP', 'GDP', '就业', '失业率', '通胀'],
  },
  ai_race: {
    name: 'AI 主权与自主权竞争',
    actors: ['中美欧', '开源社区', '大厂'],
    dynamics: '从模型参数转向自主Agent工程化 + 多模态落地',
    signal_keywords: ['AI', '大模型', '多模态', 'Agent', 'GitHub', 'TechCrunch', 'arxiv', '模型迭代', '算力'],
  },
  capital_market: {
    name: '资本市场活跃度',
    actors: ['监管', '投资者', '产业'],
    dynamics: '交易量复苏 ≠ 基本面复苏，需区分',
    signal_keywords: ['印花税', '证券', '股市', '交易量', '资本市场', '财政'],
  },
};

class WorldLandscape {
  constructor(opts = {}) {
    this.projectRoot = opts.projectRoot || process.cwd();
    this._frames = opts.frames || DEFAULT_FRAMES;
    this._knowledge = null;
    // 可选：接 WorldKnowledge 模块（若存在）
    try {
      const { WorldKnowledge } = require('../knowledge/world-knowledge.js');
      this._knowledge = new WorldKnowledge({ projectRoot: this.projectRoot });
    } catch (_) {
      this._knowledge = null; // 优雅降级：无知识库也能跑基础识别
    }
  }

  /**
   * 分析世界格局信号
   * @param {Array<{source?:string, text:string}>} signals 新闻/信号列表
   * @returns {object} 结构化研判
   */
  analyze(signals = []) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return { ok: false, reason: 'no_signals', frames: [], summary: null };
    }

    const allText = signals.map(s => s.text || '').join('\n');
    const frameHits = this._matchFrames(allText);

    // 若知识库可用，叠加其分析
    let knowledgeHits = null;
    if (this._knowledge && typeof this._knowledge.analyzeSignals === 'function') {
      try { knowledgeHits = this._knowledge.analyzeSignals(allText); } catch (_) { knowledgeHits = null; }
    }

    const summary = this._synthesize(frameHits, knowledgeHits, signals.length);

    return {
      ok: true,
      ts: Date.now(),
      signalCount: signals.length,
      frames: frameHits,
      knowledgeHits,
      summary,
      verified: false, // 诚实标注：基于规则信号匹配，非全知
      note: '规则引擎结构化研判，置信度取决于信号密度；深度因果需 LLM 补充',
    };
  }

  _matchFrames(text) {
    const hits = [];
    for (const [key, frame] of Object.entries(this._frames)) {
      const kw = frame.signal_keywords || [];
      const matched = kw.filter(k => text.includes(k));
      if (matched.length > 0) {
        hits.push({
          key,
          name: frame.name,
          actors: frame.actors,
          dynamics: frame.dynamics,
          matchedKeywords: matched,
          strength: Math.min(matched.length / 2, 1), // 0.5~1 归一
        });
      }
    }
    // 按命中强度排序
    hits.sort((a, b) => b.strength - a.strength);
    return hits;
  }

  _synthesize(frameHits, knowledgeHits, signalCount) {
    if (frameHits.length === 0) {
      return {
        headline: '当前信号未命中已知格局框架',
        tensionLevel: 'unknown',
        axes: [],
        recommendation: '信号不足，无法做结构化研判',
      };
    }
    const top = frameHits[0];
    const tensionMap = {
      west_pacific: '低烈度可控',
      tech_decoupling: '竞合加速',
      economic_multipolar: '温和重构',
      ai_race: '高速迭代',
      capital_market: '活跃回升',
    };
    return {
      headline: `主轴线：${top.name}`,
      tensionLevel: tensionMap[top.key] || '观察中',
      axes: frameHits.map(h => h.name),
      topActors: top.actors,
      recommendation: '持续跟踪高命中轴线；西太平洋与 AI 竞争为需重点监控变量',
      signalCount,
    };
  }
}

// dispatch 路由导出
function _analyzeRoute(signals) {
  const wl = new WorldLandscape({ projectRoot: process.cwd() });
  return wl.analyze(Array.isArray(signals) ? signals : (signals ? [signals] : []));
}

const ROUTES = {
  'worldLandscape.analyze': _analyzeRoute,
};

module.exports = { WorldLandscape, DEFAULT_FRAMES, ROUTES };
