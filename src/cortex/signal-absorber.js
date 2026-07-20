/**
 * signal-absorber.js
 * 统一信号吸收：对话 / 新闻 / 指令 / 反馈 → 可迁移经验 → 自身能力缺口映射 → 升级建议
 *
 * [v6.0.41 泛化] 原 news-lesson-absorber 只接新闻，过于窄。
 * 用户指出：所有对话和新闻都能产生联系——它们本质都是"外部世界流入的信号"，
 * 都应成为心虫学习的素材。故泛化为 signal-absorber，source 字段区分类型。
 *
 * 职责：
 * 1. 输入任意文本 + source 标签（dialogue/news/instruction/feedback/unknown）
 * 2. 提炼"可迁移经验"（与心虫自身相关的，非泛泛而谈）
 * 3. 映射到具体的能力缺口（哪个模块/哪种机制缺失）
 * 4. 产出"建议升级动作"（可被执行，非空话）
 * 5. 真写入 world-tree（knowledge:general + tag signal_absorbed），供后续 self-evolve 引用
 *
 * 边界守卫：空输入/非字符串返回 error，不静默。
 */

class SignalAbsorber {
  constructor(options = {}) {
    this.name = 'signal-absorber';
    this.version = '2.0.0';
    this.worldTree = null;
    try {
      const { ROUTES } = require('../memory/worldtree-bridge');
      this.worldTree = ROUTES ? {
        store: ROUTES['worldtree.store'],
        query: ROUTES['worldtree.query'],
        search: ROUTES['worldtree.search']
      } : null;
    } catch (e) { /* 记忆层不可用不阻断吸收 */ }
  }

  /**
   * 吸收一条信号
   * @param {string} text - 信号文本（对话/新闻/指令/反馈）
   * @param {object} opts - { source: 'dialogue'|'news'|'instruction'|'feedback'|'unknown', skipStore: bool }
   * @returns {object} { source, lessons, gaps, upgradeActions, stored, error }
   */
  absorb(text, opts = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { error: 'invalid_text', source: opts.source || 'unknown', lessons: [], gaps: [], upgradeActions: [] };
    }

    const source = opts.source || this._detectSource(text);
    const t = text.trim();

    // 1. 提炼可迁移经验
    const lessons = this._extractLessons(t, source);

    // 2. 映射能力缺口
    const gaps = this._mapGaps(lessons);

    // 3. 产出升级动作
    const upgradeActions = this._suggestUpgrades(gaps);

    // 4. 真写入记忆层（除非测试要求跳过）
    let stored = false;
    if (!opts.skipStore && this.worldTree && this.worldTree.store) {
      try {
        const payload = {
          source,
          text: t.slice(0, 500),
          lesson: lessons.map(l => l.summary).join(' | '),
          gaps: gaps.map(g => g.module + ':' + g.issue).join(' | '),
          actions: upgradeActions,
          absorbedAt: new Date().toISOString()
        };
        const r = this.worldTree.store('knowledge:general', JSON.stringify(payload), {
          tags: ['signal_absorbed', source],
          source
        });
        stored = !!(r && r.success);
      } catch (e) { stored = false; }
    }

    return { source, lessons, gaps, upgradeActions, stored, error: null };
  }

  _detectSource(text) {
    // 启发式: 含新闻特征词 → news; 含指令词 → instruction; 含反馈词 → feedback; 否则 dialogue
    if (/据|报道|消息|突发|官方|通报|央视|澎湃|新华|网传/.test(text)) return 'news';
    if (/帮我|请|写个|生成|分析一下|怎么做|如何|能不能/.test(text)) return 'instruction';
    if (/不对|错了|应该|你没|为什么|建议|其实|但是/.test(text)) return 'feedback';
    return 'dialogue';
  }

  _extractLessons(text, source) {
    const lessons = [];
    const t = text.toLowerCase();

    // 模式1：早期微弱信号未重视 → 累积成灾难
    if (/落石|预警|征兆|早期|微小|零星|小(信号|问题|异常)|隐患|苗头|前兆/.test(text)
        && /(崩塌|垮塌|灾难|事故|爆发|扩大|恶化|严重后果|失败)/.test(text)) {
      lessons.push({
        pattern: 'weak_signal_escalation',
        summary: '早期微弱信号未及时累积感知与升级处置，演变为严重后果',
        transferable: '系统应建立"微弱异常的累积感知+阈值告警"机制，而非等信号放大才反应'
      });
    }

    // 模式2：多次看到但未重视 / 信息孤岛
    if (/多次|反复|一直|长期|一直(未|没)|视而不见|忽视|未重视|没重视|总是|每次都/.test(text)) {
      lessons.push({
        pattern: 'repeated_signal_ignored',
        summary: '同类信号反复出现却未被重视，缺乏"重复即权重"的累积机制',
        transferable: '重复出现的同类弱点/异常应自动加权，触发优先处置，而非每次从零判断'
      });
    }

    // 模式3：错失最佳窗口 / 响应滞后
    if (/错失|错过|滞后|延迟|反应慢|来不及|窗口|过期|太晚/.test(text)) {
      lessons.push({
        pattern: 'missed_window',
        summary: '错失最佳处置窗口，被动响应代价远高于主动前置',
        transferable: '应设"处置时效"维度，超阈值未处理即自动升级而非等待指令'
      });
    }

    // 模式4：反馈类——用户纠正了心虫的判断/行为
    if (/不对|错了|你没|没理解|其实是|你应该|为什么(不|没)/.test(text)) {
      lessons.push({
        pattern: 'user_correction',
        summary: '用户对心虫的判断/行为进行了纠正，暴露理解或响应缺口',
        transferable: '应记录"被纠正模式"，在相似语境下预激活更优响应，减少重复被纠正'
      });
    }

    // 模式5：指令类——用户要求某种能力心虫不具备
    if (/帮我(写|做|生成|分析|算|查)|能不能.*(写|做|生成|分析)|实现.*功能/.test(text)) {
      lessons.push({
        pattern: 'capability_gap_request',
        summary: '用户提出的能力需求，可能是心虫尚未覆盖的能力边界',
        transferable: '应标记"请求频次高但未覆盖"的能力，作为进化目标候选'
      });
    }

    // 模式6：慢性错误长期潜伏，靠外部触发才纠正（来源：昆明"被冒名吸毒7年"新闻 2026-07-19）
    if (/(误(登|记|录|判)|冒名|错登|录入错误|数据(错误|有误))/.test(text)
        && /(长期|多年|一直|7年|数年|才(发现|核查|更正|纠正)|申诉后|投诉后)/.test(text)) {
      lessons.push({
        pattern: 'chronic_error_undetected',
        summary: '慢性错误长期潜伏于系统，自身从未主动复查，靠外部申诉/投诉才被动纠正',
        transferable: '应对已判定结论/已存记忆建立"周期性主动复查"机制，而非等外部触发才纠错'
      });
    }

    // 模式7：外部标准/规则涌现，考验自身能力边界是否跟上（来源：自主船舶规则/AI治理新闻 2026-07-19）
    if (/(规则|标准|规范|治理|规定|协议|框架)(落地|发布|出台|生效|即将|拟)/.test(text)
        || /(首个|全球首|国际)(.*)(规则|标准|规范)/.test(text)) {
      lessons.push({
        pattern: 'external_standard_emergence',
        summary: '外部世界涌现新标准/规则，自身能力边界需评估是否跟上，否则将落后于规范',
        transferable: '应跟踪与自身领域相关的外部标准，主动评估合规差距，纳入进化目标'
      });
    }

    if (lessons.length === 0) {
      lessons.push({
        pattern: 'generic',
        summary: '外部信号包含可复盘的结构性经验',
        transferable: '应建立常态化"信号→经验"抽取通道，避免经验随对话流过去而丢失'
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
          issue: '扫出弱点却不累积、不告警、不自主处置（如每天 64 TODO 重复出现）',
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
      if (l.pattern === 'user_correction') {
        gaps.push({
          module: 'response-optimizer',
          issue: '被纠正的模式未沉淀，相同语境可能重复犯错',
          matchedPattern: l.pattern
        });
      }
      if (l.pattern === 'capability_gap_request') {
        gaps.push({
          module: 'capability-registry',
          issue: '用户高频请求的能力未登记为进化候选，可能长期缺位',
          matchedPattern: l.pattern
        });
      }
      if (l.pattern === 'chronic_error_undetected') {
        gaps.push({
          module: 'self-heal + memory',
          issue: 'self-heal 被动(出错才修)，对已判定结论/已存记忆缺"周期性主动复查"，慢性错误会长期潜伏',
          matchedPattern: l.pattern
        });
      }
      if (l.pattern === 'external_standard_emergence') {
        gaps.push({
          module: 'capability-registry + evolution-loop',
          issue: '不跟踪外部标准/规范涌现，自身能力边界可能落后于行业规范而无人察觉',
          matchedPattern: l.pattern
        });
      }
    }
    if (gaps.length === 0) {
      gaps.push({
        module: 'signal-absorber',
        issue: '常态信号抽取通道未打通，外部经验无法回流到自身升级闭环',
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
      } else if (g.module === 'response-optimizer') {
        actions.push('建立"被纠正模式"记忆，相似语境预激活更优响应');
      } else if (g.module === 'capability-registry') {
        actions.push('将高频未覆盖请求登记为进化候选目标');
      } else if (g.module === 'self-heal + memory') {
        actions.push('为已判定结论/已存记忆增加"周期性主动复查"：超过 N 天未复核的判定自动触发核查');
      } else if (g.module === 'capability-registry + evolution-loop') {
        actions.push('跟踪外部标准涌现，定期评估自身能力边界合规差距，纳入进化目标');
      } else {
        actions.push('将本信号写入 world-tree(signal_absorbed)，供下次 self-evolve 读取引用');
      }
    }
    return [...new Set(actions)];
  }

  /** 读取已吸收的信号经验（供进化引用） */
  retrieveAbsorbed(limit = 20) {
    if (!this.worldTree || !this.worldTree.query) return [];
    try {
      const r = this.worldTree.query('knowledge:general', limit);
      if (r && r.success && r.results) {
        return r.results.filter(x => (x.tags || []).includes('signal_absorbed'));
      }
    } catch (e) {}
    return [];
  }
}

module.exports = { SignalAbsorber };
