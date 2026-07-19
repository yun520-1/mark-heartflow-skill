/**
 * news-lesson-absorber.js
 * 新闻/事件 → 可迁移教训 → 自身能力缺口映射 → 升级建议
 *
 * [v6.0.41 自我升级·新闻驱动] 心虫原本只会把新闻当"需回应用户的问题"(think 判 reflect)，
 * 缺一个"从外部真实事件提炼可迁移教训、并映射成自身能力缺口"的链路。
 * 彭水山崩教训（小落石=早期微弱信号，未累积感知→灾难）直接暴露此缺口：
 * 心虫的 SelfScanner 每天扫出同样弱点却从不"累积告警、到点自主处理"。
 *
 * 本模块职责：
 * 1. 输入一条新闻/事件文本
 * 2. 提炼"可迁移教训"（与心虫自身相关的，不是泛泛而谈）
 * 3. 映射到具体的能力缺口（哪个模块/哪种机制缺失）
 * 4. 产出"建议升级动作"（可被执行，不是空话）
 * 5. 把教训真写入 world-tree 记忆层（category: 'lessons_from_world'），供后续 self-evolve 引用
 *
 * 边界守卫：空输入/非字符串返回 error，不静默。
 */

class NewsLessonAbsorber {
  constructor(options = {}) {
    this.name = 'news-lesson-absorber';
    this.version = '1.0.0';
    this.worldTree = null;
    try {
      const { ROUTES } = require('../memory/worldtree-bridge');
      // ROUTES key 带 'worldtree.' 前缀，包一层便捷访问
      this.worldTree = ROUTES ? {
        store: ROUTES['worldtree.store'],
        query: ROUTES['worldtree.query'],
        search: ROUTES['worldtree.search']
      } : null;
    } catch (e) { /* 记忆层不可用不阻断吸收 */ }
  }

  /**
   * 吸收一条新闻/事件，提炼可迁移教训
   * @param {string} newsText - 新闻/事件文本
   * @param {object} opts - { skipStore: bool } 单元测试可跳过真写入
   * @returns {object} { lessons, gaps, upgradeActions, stored }
   */
  absorb(newsText, opts = {}) {
    if (!newsText || typeof newsText !== 'string' || newsText.trim().length === 0) {
      return { error: 'invalid_news_text', lessons: [], gaps: [], upgradeActions: [] };
    }

    const text = newsText.trim();

    // 1. 提炼可迁移教训（基于已知"信号累积→灾难"模式族做轻量启发式匹配）
    const lessons = this._extractLessons(text);

    // 2. 映射能力缺口
    const gaps = this._mapGaps(lessons);

    // 3. 产出升级动作
    const upgradeActions = this._suggestUpgrades(gaps);

    // 4. 真写入记忆层（除非测试要求跳过）
    let stored = false;
    if (!opts.skipStore && this.worldTree && this.worldTree.store) {
      try {
        const payload = {
          source: 'news',
          lesson: lessons.map(l => l.summary).join(' | '),
          gaps: gaps.map(g => g.module + ':' + g.issue).join(' | '),
          actions: upgradeActions,
          absorbedAt: new Date().toISOString()
        };
        // world-tree 白名单分类: 用 knowledge:general (知识库) 承载外部教训
        const r = this.worldTree.store('knowledge:general', JSON.stringify(payload), { tags: ['lessons_from_world'], source: 'news' });
        stored = !!(r && r.success);
      } catch (e) { stored = false; }
    }

    return { lessons, gaps, upgradeActions, stored, error: null };
  }

  _extractLessons(text) {
    const lessons = [];
    const t = text.toLowerCase();

    // 模式1：早期微弱信号未重视 → 累积成灾难
    if (/落石|预警|征兆|早期|微小|零星|小(信号|问题|异常)|隐患|苗头/.test(text)
        && /(崩塌|垮塌|灾难|事故|爆发|扩大|恶化|严重后果)/.test(text)) {
      lessons.push({
        pattern: 'weak_signal_escalation',
        summary: '早期微弱信号（落石/预警）未及时累积感知与升级处置，演变为灾难性后果',
        transferable: '系统应建立"微弱异常的累积感知+阈值告警"机制，而非等信号放大才反应'
      });
    }

    // 模式2：多次看到但未重视 / 信息孤岛
    if (/多次|反复|一直|长期|一直(未|没)|视而不见|忽视|未重视|没重视/.test(text)) {
      lessons.push({
        pattern: 'repeated_signal_ignored',
        summary: '同一类信号反复出现却未被重视，缺乏"重复即权重"的累积机制',
        transferable: '重复出现的同类弱点/异常应自动加权，触发优先处置，而非每次从零判断'
      });
    }

    // 模式3：错失最佳窗口 / 响应滞后
    if (/错失|错过|滞后|延迟|反应慢|来不及|窗口/.test(text)) {
      lessons.push({
        pattern: 'missed_window',
        summary: '错失最佳处置窗口，被动响应代价远高于主动前置',
        transferable: '应设"处置时效"维度，超阈值未处理即自动升级而非等待指令'
      });
    }

    if (lessons.length === 0) {
      lessons.push({
        pattern: 'generic',
        summary: '外部事件包含可复盘的结构性经验',
        transferable: '应建立常态化"事件→教训"抽取通道，避免经验随新闻流过去而丢失'
      });
    }
    return lessons;
  }

  _mapGaps(lessons) {
    const gaps = [];
    for (const l of lessons) {
      if (l.pattern === 'weak_signal_escalation' || l.pattern === 'repeated_signal_ignored') {
        gaps.push({
          module: 'self-scanner + evolution-loop',
          issue: 'SelfScanner 每天扫出相同弱点（如 64 TODO）却不累积、不告警、不自主处置',
          matchedPattern: l.pattern
        });
      }
      if (l.pattern === 'missed_window') {
        gaps.push({
          module: 'evolution-loop',
          issue: '缺"处置时效"维度，弱点扫出后无限期搁置，无自动升级触发',
          matchedPattern: l.pattern
        });
      }
    }
    if (gaps.length === 0) {
      gaps.push({
        module: 'lesson-absorber',
        issue: '常态事件抽取通道未打通，外部经验无法回流到自身升级闭环',
        matchedPattern: 'generic'
      });
    }
    return gaps;
  }

  _suggestUpgrades(gaps) {
    const actions = [];
    for (const g of gaps) {
      if (/self-scanner|evolution-loop/.test(g.module)) {
        actions.push('为 SelfScanner 增加"弱点累积计数器"：同一弱点连续 N 次出现自动升优先级');
        actions.push('evolution-loop 接入"时效阈值"：扫出弱点超过 T 小时未处理则自主触发修复+commit');
      } else {
        actions.push('将本教训写入 world-tree(lessons_from_world)，供下次 self-evolve 读取引用');
      }
    }
    // 去重
    return [...new Set(actions)];
  }
}

module.exports = { NewsLessonAbsorber };
