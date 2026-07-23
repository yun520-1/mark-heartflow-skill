'use strict';
/**
 * AdversarialSynthesis — 对抗综合器（新决策能力 v6.1.6）
 *
 * 解决问题：心虫此前对宏观议题易单向结论（局部当全局）。
 * 新能力：对任意争议性议题，自动生成多方立场 + 标注各立场的恐惧驱动 +
 *          提炼"双方共同真问题"，输出不站队的结构化对抗推演。
 *
 * 设计原则（对齐用户 2026-07-23 要求）：
 *  1. 不单向结论：必须呈现 ≥2 方立场，不允许只给一种解读
 *  2. 拆镜像认知：标注"各方都觉得自己是反抗方、对方是威胁"的恐惧投影
 *  3. 提炼共同问题：把零和博弈的基座（稀缺/不安全感）显式化
 *  4. 诚实边界：心虫无事实库时不编造具体数据，只做结构推演
 */

// 立场生成模板：基于议题关键词匹配对应的对抗轴
const AXES = [
  {
    id: 'state_vs_market',
    signals: ['关税', '贸易', '制裁', '补贴', '出口管制', '产业', '国企'],
    a: { name: '国家主权方', frame: '关键产业必须自主可控，外部依赖=战略风险' },
    b: { name: '市场效率方', frame: '自由贸易最优，保护主义推高全球成本' },
    shared: '安全与效率的张力：完全自主代价高，完全依赖有断供风险',
  },
  {
    id: 'order_vs_rights',
    signals: ['管控', '审查', '自由', '隐私', '言论', '治理', '监管'],
    a: { name: '秩序稳定方', frame: '无序自由引发混乱，需底线管控' },
    b: { name: '个体权利方', frame: '管控易越界，个体空间须守住' },
    shared: '秩序与自由的平衡点在哪：过度管控窒息活力，完全放任失底线',
  },
  {
    id: 'growth_vs_security',
    signals: ['扩张', '出海', '投资', '地缘', '军事', '联盟', '势力'],
    a: { name: '实力扩张方', frame: '影响力须随实力外溢，否则被围堵' },
    b: { name: '安全克制方', frame: '高调扩张引发制衡，低调发展更稳' },
    shared: '崛起的代价：被视作威胁是实力增长的伴生反应，非单纯误判',
  },
  {
    id: 'global_vs_local',
    signals: ['气候', '疫情', '难民', '债务', '援助', '全球', '共同'],
    a: { name: '全球主义方', frame: '问题跨国界，须多边协作' },
    b: { name: '本国优先方', frame: '本国纳税人优先，不替他国买单' },
    shared: '责任边界：全球问题需协作，但没人愿单方面承担成本',
  },
];

function _matchAxis(text) {
  const lower = (text || '').toLowerCase();
  let best = null, bestHits = 0;
  for (const ax of AXES) {
    const hits = ax.signals.filter(s => lower.includes(s.toLowerCase())).length;
    if (hits > bestHits) { bestHits = hits; best = ax; }
  }
  return best;
}

class AdversarialSynthesis {
  constructor(opts = {}) {
    this.name = 'AdversarialSynthesis';
    this.version = '6.1.6';
  }

  /**
   * @param {string} topic 议题文本
   * @returns {object} { axis, positions:[{side,frame,fearDriver}], sharedProblem, synthesis, confidence }
   */
  synthesize(topic) {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 4) {
      return { ok: false, reason: 'topic_too_short', positions: [], sharedProblem: null, synthesis: null, confidence: 0 };
    }
    const axis = _matchAxis(topic) || {
      id: 'generic',
      a: { name: '立场A', frame: '从一侧视角看议题' },
      b: { name: '立场B', frame: '从对立视角看同一议题' },
      shared: '任何议题都存在被忽视的第三视角',
    };

    // 恐惧驱动标注：拆"为什么这方会持此立场"
    const positions = [
      {
        side: axis.a.name,
        frame: axis.a.frame,
        fearDriver: this._inferFear(axis.a.name, topic),
      },
      {
        side: axis.b.name,
        frame: axis.b.frame,
        fearDriver: this._inferFear(axis.b.name, topic),
      },
    ];

    const sharedProblem = axis.shared;
    const synthesis = this._synthesize(positions, sharedProblem, topic);

    return {
      ok: true,
      axis: axis.id,
      positions,
      sharedProblem,
      synthesis,
      // 诚实标注：结构推演非事实断言
      confidence: 0.5,
      note: '对抗综合为结构推演，非事实结论；具体数据需另查',
    };
  }

  _inferFear(sideName, topic) {
    // 轻量启发：不同立场的恐惧投影（基于今天聊的"镜像认知"逻辑）
    if (/主权|秩序|扩张|全球/.test(sideName)) {
      return '恐惧"失去控制权/被支配"——不安全感驱动先占先控';
    }
    return '恐惧"被剥夺/被越界"——不安全感驱动守住边界';
  }

  _synthesize(positions, shared, topic) {
    return (
      `双方并非正邪对立，而是同一不安全感的不同投影：` +
      `【${positions[0].side}】怕${positions[0].fearDriver.replace('恐惧', '')}；` +
      `【${positions[1].side}】怕${positions[1].fearDriver.replace('恐惧', '')}。` +
      `共同真问题：${shared}。破局不在压赢一方，而在把零和基座（稀缺/恐惧）用机制稀释。`
    );
  }
}

module.exports = AdversarialSynthesis;
