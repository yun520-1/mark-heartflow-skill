'use strict';
/**
 * world-knowledge.js — 世界知识库模块
 *
 * 为心虫(HeartFlow)提供「世界格局分析」的结构化基础知识框架。
 * 独立模块，供上层「世界格局分析」逻辑调用，不依赖任何大文件。
 *
 * 三大知识维度：
 *   1. GEOPOLITICAL_FRAMES —— 国家博弈轴线（西太平洋 / 科技脱钩 / 多极化经济 ...）
 *   2. ECONOMIC_INDICATORS —— 关键经济指标解读（就业 / 外贸 / 印花税 / 通胀 ...）
 *   3. TECH_AXES           —— 科技竞争维度（AI 模型 / 芯片 / 多模态 / Agent 工程化）
 *
 * 铁律：知识框架基于真实国际关系与经济学常识，关键词中英双语，不编造虚假数据。
 * 说明：本模块只提供「分析框架/维度」，不对任何具体事件做价值预判或结论。
 */

// ============================================================
// 1. 地缘博弈轴线
// ============================================================
const GEOPOLITICAL_FRAMES = {
  west_pacific: {
    name: '西太平洋安全格局',
    actors: ['中国', '美国', '日本', '韩国', '菲律宾', '台湾地区', '澳大利亚'],
    dynamics: '第一岛链军事部署、海空活动、导弹与反介入能力、外交表态与军演的相互反应',
    signal_keywords: [
      '西太平洋', '第一岛链', '南海', '台海', '钓鱼岛', '东海',
      '中导', '导弹试射', '军演', '航母', '外交部回应', '国防部',
      'west pacific', 'first island chain', 'south china sea',
      'taiwan strait', 'missile', 'military drill', 'aircraft carrier'
    ],
  },
  tech_decoupling: {
    name: '科技脱钩与出口管制',
    actors: ['中国', '美国', '荷兰', '日本', '韩国', '欧盟'],
    dynamics: '半导体/AI 出口管制、实体清单、供应链去风险、技术自主替代的攻防',
    signal_keywords: [
      '脱钩', '出口管制', '实体清单', '芯片禁令', '断供', '卡脖子',
      '供应链', '去风险', '技术封锁', '国产替代', '自主可控',
      'decoupling', 'export control', 'entity list', 'chip ban',
      'sanction', 'supply chain', 'de-risk'
    ],
  },
  economic_multipolar: {
    name: '多极化经济秩序',
    actors: ['中国', '美国', '欧盟', '金砖国家', '东盟', '全球南方'],
    dynamics: '外贸格局、货币结算多元化、区域贸易协定、产业转移与再平衡',
    signal_keywords: [
      '多极化', '金砖', '一带一路', 'RCEP', '外贸', '进出口',
      '本币结算', '去美元化', '全球南方', '产业转移', '贸易顺差',
      'multipolar', 'brics', 'belt and road', 'trade', 'export',
      'import', 'de-dollarization', 'global south'
    ],
  },
  energy_resource: {
    name: '能源与关键资源博弈',
    actors: ['中国', '美国', '俄罗斯', '中东产油国', '欧盟'],
    dynamics: '油气价格与供应、稀土/关键矿产管制、能源转型与绿色产能竞争',
    signal_keywords: [
      '能源', '石油', '天然气', '稀土', '关键矿产', '锂', '油价',
      '减产', 'OPEC', '光伏', '新能源', '产能',
      'energy', 'oil', 'natural gas', 'rare earth', 'lithium', 'opec'
    ],
  },
  regional_conflict: {
    name: '区域冲突与安全危机',
    actors: ['相关冲突方', '联合国', '大国斡旋方'],
    dynamics: '地区武装冲突、停火与斡旋、难民与人道危机、外溢的经济与能源影响',
    signal_keywords: [
      '冲突', '战争', '停火', '交火', '空袭', '制裁', '难民', '斡旋',
      'conflict', 'war', 'ceasefire', 'airstrike', 'sanctions', 'crisis'
    ],
  },
};

// ============================================================
// 2. 关键经济指标
// ============================================================
const ECONOMIC_INDICATORS = {
  employment: {
    name: '就业',
    keywords: ['就业', '失业率', '新增就业', '非农', '招聘', '裁员', 'employment', 'unemployment', 'jobs', 'payroll'],
    meaning: '反映经济景气度与内需韧性，是消费与政策取向的领先信号',
    positive_signal: '新增就业超预期、失业率下降、招聘扩张',
    negative_signal: '失业率上升、大规模裁员、新增就业不及预期',
  },
  foreign_trade: {
    name: '外贸',
    keywords: ['外贸', '进出口', '出口', '进口', '贸易顺差', '贸易逆差', '海关', 'trade', 'export', 'import', 'customs', 'surplus'],
    meaning: '衡量对外需求与产业竞争力，反映全球分工中的位置变化',
    positive_signal: '进出口同比增长、出口结构升级、顺差扩大',
    negative_signal: '进出口下滑、订单流失、顺差收窄或转逆差',
  },
  stamp_duty: {
    name: '资本市场印花税',
    keywords: ['印花税', '证券交易', '资本市场', '股市', '成交额', 'stamp duty', 'securities transaction tax'],
    meaning: '交易税负变化影响市场活跃度与资本流向，也是政策态度的信号',
    positive_signal: '下调印花税、成交额放大、资本流入',
    negative_signal: '上调印花税、成交萎缩、资本流出',
  },
  inflation: {
    name: '通胀',
    keywords: ['通胀', 'CPI', 'PPI', '物价', '通缩', '价格指数', 'inflation', 'deflation', 'consumer price', 'producer price'],
    meaning: '衡量物价与货币购买力，直接牵动货币政策与实际收入',
    positive_signal: '温和通胀、CPI 处于目标区间、摆脱通缩',
    negative_signal: '高通胀失控、或持续通缩、PPI 长期为负',
  },
};

// ============================================================
// 3. 科技竞争维度
// ============================================================
const TECH_AXES = [
  {
    axis: 'AI 大模型',
    keywords: ['大模型', 'LLM', '基础模型', 'GPT', '预训练', '推理模型', 'foundation model', 'large language model'],
    leaders: ['OpenAI', 'Google DeepMind', 'Anthropic', 'DeepSeek', '阿里通义', 'Meta'],
    trend: '从规模扩张转向推理能力、成本效率与开源生态的多线竞争',
  },
  {
    axis: '芯片与算力',
    keywords: ['芯片', '半导体', 'GPU', '算力', '制程', '光刻', 'chip', 'semiconductor', 'gpu', 'compute'],
    leaders: ['NVIDIA', 'TSMC', 'ASML', 'AMD', '华为海思', '中芯国际'],
    trend: '先进制程与算力供给成为 AI 竞争的物理底座，管制与自主替代并行',
  },
  {
    axis: '多模态',
    keywords: ['多模态', '视觉', '语音', '视频生成', '图文', 'multimodal', 'vision', 'video generation', 'speech'],
    leaders: ['OpenAI', 'Google', '字节', '快手可灵', 'Runway'],
    trend: '从文本走向图像/音频/视频统一理解与生成，落地内容与交互场景',
  },
  {
    axis: 'Agent 工程化',
    keywords: ['agent', '智能体', '自主代理', '工具调用', '工作流', '编排', 'tool use', 'orchestration', 'autonomous'],
    leaders: ['Anthropic', 'OpenAI', 'Microsoft', 'LangChain', '开源社区'],
    trend: '从单次问答走向可自主规划、调用工具、长任务执行的工程化系统',
  },
];

// ============================================================
// WorldKnowledge 类
// ============================================================
class WorldKnowledge {
  constructor() {
    this.GEOPOLITICAL_FRAMES = GEOPOLITICAL_FRAMES;
    this.ECONOMIC_INDICATORS = ECONOMIC_INDICATORS;
    this.TECH_AXES = TECH_AXES;
  }

  /**
   * 内部：判断关键词是否命中文本（大小写不敏感，中文直接包含匹配）
   */
  _hit(text, keyword) {
    if (!keyword) return false;
    return text.toLowerCase().includes(String(keyword).toLowerCase());
  }

  /**
   * 内部：收集某组关键词在文本中的命中项
   */
  _matchedKeywords(text, keywords) {
    if (!Array.isArray(keywords)) return [];
    return keywords.filter((kw) => this._hit(text, kw));
  }

  /**
   * analyzeSignals(text)
   * 输入新闻文本，返回命中的博弈框架 + 经济指标 + 科技轴线（结构化）。
   *
   * @param {string} text
   * @returns {{
   *   frames: Array<{key,name,matched:string[]}>,
   *   indicators: Array<{key,name,matched:string[]}>,
   *   techAxes: Array<{axis,matched:string[]}>,
   *   totalHits: number
   * }}
   */
  analyzeSignals(text) {
    const empty = { frames: [], indicators: [], techAxes: [], totalHits: 0 };
    if (!text || typeof text !== 'string') return empty;

    const frames = [];
    for (const [key, frame] of Object.entries(this.GEOPOLITICAL_FRAMES)) {
      const matched = this._matchedKeywords(text, frame.signal_keywords);
      if (matched.length > 0) {
        frames.push({ key, name: frame.name, matched });
      }
    }

    const indicators = [];
    for (const [key, ind] of Object.entries(this.ECONOMIC_INDICATORS)) {
      const matched = this._matchedKeywords(text, ind.keywords);
      if (matched.length > 0) {
        indicators.push({ key, name: ind.name, matched });
      }
    }

    const techAxes = [];
    for (const axisDef of this.TECH_AXES) {
      const matched = this._matchedKeywords(text, axisDef.keywords);
      if (matched.length > 0) {
        techAxes.push({ axis: axisDef.axis, matched });
      }
    }

    const totalHits =
      frames.reduce((s, f) => s + f.matched.length, 0) +
      indicators.reduce((s, i) => s + i.matched.length, 0) +
      techAxes.reduce((s, t) => s + t.matched.length, 0);

    return { frames, indicators, techAxes, totalHits };
  }

  /**
   * getFramework(name)
   * 按 key（如 'west_pacific'）或中文名称查询单条博弈框架。
   * @param {string} name
   * @returns {object|null}
   */
  getFramework(name) {
    if (!name || typeof name !== 'string') return null;
    if (this.GEOPOLITICAL_FRAMES[name]) {
      return { key: name, ...this.GEOPOLITICAL_FRAMES[name] };
    }
    for (const [key, frame] of Object.entries(this.GEOPOLITICAL_FRAMES)) {
      if (frame.name === name) return { key, ...frame };
    }
    return null;
  }

  /**
   * getIndicator(name) — 便捷：查经济指标
   */
  getIndicator(name) {
    if (!name || typeof name !== 'string') return null;
    if (this.ECONOMIC_INDICATORS[name]) {
      return { key: name, ...this.ECONOMIC_INDICATORS[name] };
    }
    for (const [key, ind] of Object.entries(this.ECONOMIC_INDICATORS)) {
      if (ind.name === name) return { key, ...ind };
    }
    return null;
  }

  /**
   * listFrameworks() — 列出全部框架 key
   */
  listFrameworks() {
    return Object.keys(this.GEOPOLITICAL_FRAMES);
  }
}

module.exports = { WorldKnowledge, GEOPOLITICAL_FRAMES, ECONOMIC_INDICATORS, TECH_AXES };
