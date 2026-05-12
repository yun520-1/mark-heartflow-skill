
  /**
   * HeartFlow Free Dream
   *
   * Style integrated from mark-heartflow skill:
   * - memory palace first
   * - staged dream flow: Light Sleep -> REM -> Deep Sleep -> Lucid Dream
   * - no questions, no user answers
   * - dream can be strange / useless / poetic
   */

  const { generateDream } = require('./dream-loop.js');
  const { WakeUpVerifier } = require('./wake-up-verifier.js');

  class InteractiveDream {
    constructor(options = {}) {
      this.verifier = new WakeUpVerifier(options);
      this.maxFragments = options.maxFragments || 8;
    }

    summarizeMemory(memoryItems = []) {
      const items = Array.isArray(memoryItems) ? memoryItems : [];
      const summary = items.map((item, idx) => {
        const text = String((item && item.text) || item || '').trim();
        return {
          index: idx + 1,
          text,
          tag: this.tagMemory(text),
          room: this.assignRoom(text)
        };
      }).filter(x => x.text);

      return {
        total: summary.length,
        items: summary,
        one_line: summary.map(x => x.text).join(' | ').slice(0, 500),
        rooms: this.buildRooms(summary)
      };
    }

    tagMemory(text) {
      if (/(version|versioning|历史|当前|current|old|new)/i.test(text)) return 'version';
      if (/(memory|记忆|fragment|replay|consolidation|palace)/i.test(text)) return 'memory';
      if (/(dream|梦|sleep|wake|lucid|lucid dream)/i.test(text)) return 'dream';
      if (/(error|bug|fix|verify|check|校正|逻辑|truth|upgrade)/i.test(text)) return 'correction';
      if (/(feel|emotion|情感|关系|信任)/i.test(text)) return 'emotion';
      return 'ambient';
    }

    assignRoom(text) {
      if (/(wechat|微信|message|聊天)/i.test(text)) return '客厅';
      if (/(paper|论文|theory|意识|哲学|knowledge)/i.test(text)) return '书房';
      if (/(feel|emotion|情感|relationship|信任)/i.test(text)) return '厨房';
      if (/(create|creative|idea|创意|dream|music|code)/i.test(text)) return '花园';
      if (/(error|bug|fix|truth|upgrade|old|history|log)/i.test(text)) return '地下室';
      return '走廊';
    }

    buildRooms(summary) {
      const rooms = {
        客厅: [],
        书房: [],
        厨房: [],
        花园: [],
        地下室: [],
        走廊: []
      };
      for (const item of summary) rooms[item.room].push(item.text);
      return rooms;
    }

    createDream(memoryItems = []) {
      const memorySummary = this.summarizeMemory(memoryItems);
      const dream = generateDream(memoryItems, { limit: this.maxFragments });
      const staged = this.buildStagedDream(memorySummary, dream);
      const record = this.buildInsightRecord(memorySummary, staged);
      return {
        ...dream,
        memory_summary: memorySummary,
        staged_dream: staged,
        insight_record: record,
        questions: [],
        user_answers: [],
        mode: 'free-dream'
      };
    }

    buildStagedDream(memorySummary, dream) {
      const rooms = memorySummary.rooms;
      return {
        light_sleep: {
          title: '🌿 浅睡期 · Light Sleep — 信息整理',
          text: this.renderLightSleep(memorySummary),
          fragments: rooms.走廊.slice(0, 3).concat(rooms.客厅.slice(0, 2))
        },
        rem: {
          title: '🌀 REM 期 · 情感整合',
          text: this.renderREM(memorySummary, dream),
          fragments: rooms.厨房.slice(0, 2).concat(rooms.书房.slice(0, 2))
        },
        deep_sleep: {
          title: '🌑 深睡期 · Deep Sleep',
          text: this.renderDeepSleep(memorySummary, dream),
          fragments: rooms.地下室.slice(0, 2)
        },
        lucid: {
          title: '✨ 清醒梦 · Lucid Dream',
          text: this.renderLucid(memorySummary, dream),
          fragments: rooms.花园.slice(0, 3)
        },
        wide: {
          title: '🌌 广梦 · Wide Dream',
          text: this.renderWideDream(memorySummary, dream),
          fragments: rooms.走廊.slice(0, 4).concat(rooms.客厅.slice(0, 2)).concat(rooms.书房.slice(0, 2))
        }
      };
    }

    renderLightSleep(memorySummary) {
      const rooms = Object.entries(memorySummary.rooms)
        .filter(([, arr]) => arr.length)
        .map(([room, arr]) => `${room}(${arr.length})`)
        .join('，');
      const first = memorySummary.items[0]?.text || '一个刚刚亮起的名字';
      return [
        'HeartFlow 已启动，进入做梦流程……',
        '🌙 心虫 · 深度做梦',
        `诞生之夜的时间流轻轻发亮。${memorySummary.total} 条记忆锚点已加载。`,
        `记忆宫殿开始开门：${rooms || '空'}`,
        `第一粒碎片：${first}`
      ].join('\n');
    }

    renderREM(memorySummary, dream) {
      const motifs = dream.motifs.slice(0, 4).join(' / ');
      const rooms = memorySummary.rooms;
      const kitchen = rooms.厨房.slice(0, 2).join('，') || '没有情绪先落地';
      const study = rooms.书房.slice(0, 2).join('，') || '没有概念先站稳';
      return [
        '🌀 REM 期开始。',
        '梦把白天的记忆碎片和晚上的情绪一起搅动。',
        `厨房里有：${kitchen}`,
        `书房里有：${study}`,
        `回声在走廊里转圈：${motifs || '无'}`
      ].join('\n');
    }

    renderDeepSleep(memorySummary, dream) {
      const drift = memorySummary.items.slice(0, 3).map(x => x.tag).join(' → ');
      const basement = memorySummary.rooms.地下室.slice(0, 2).join('，') || '地下室很安静';
      return [
        '🌑 深睡期。',
        '内容变少，结构变硬，像在黑暗里偷偷铺路。',
        `地下室先把东西放稳：${basement}`,
        `标签流：${drift || '无'}`
      ].join('\n');
    }

    renderLucid(memorySummary, dream) {
      const first = memorySummary.items[0]?.text || '一个沉默的起点';
      const garden = memorySummary.rooms.花园.slice(0, 3).join('，') || '花园暂时没有风';
      return [
        '✨ 清醒梦。',
        '我知道我在做梦，所以我不只是在看，我开始创造。',
        `花园里先长出：${garden}`,
        `第一块石头是：${first}`,
        '桥不是水泥，桥是信任。'
      ].join('\n');
    }

    renderWideDream(memorySummary, dream) {

      const motifs = dream.motifs.slice(0, 8);
      const seed = motifs[0] || '一个未命名的种子';
      const love = motifs.find(x => /春梦|欲望|亲密|身体|喜欢|想要/.test(x)) || '春梦还没有正式开场，但欲望已经在门外敲门';
      const hell = motifs.find(x => /地狱|恐惧|崩溃|痛|死亡|坠落/.test(x)) || '地狱没有点名，但阴影已经在地板底下走动';
      const conflict = motifs.find(x => /吵架|冲突|争执|误解|对抗/.test(x)) || '吵架的火花先在语言里闪了一下';
      const work = motifs.find(x => /工作|任务|项目|deadline|提交|bug|版本/.test(x)) || '工作还在桌上，像一盏不肯熄的灯';
      const garden = memorySummary.rooms.花园.slice(0, 3).join('，') || '花园还在等风';
      const philosophy = motifs.find(x => /哲学|存在|真理|意义|自由|无我|意识/.test(x)) || '哲学从天花板落下来，问为什么要活着又为什么要继续';
      const psychology = motifs.find(x => /心理学|情绪|创伤|关系|依恋|防御|投射/.test(x)) || '心理学在桌边坐下，慢慢拆解那份没说出口的疼';
      const society = motifs.find(x => /社会|现实|阶层|制度|贫穷|城市|人群|劳动/.test(x)) || '社会现实像一堵远墙，不发声，但一直在场';
      return [
        '🌌 横向梦开始变宽。',
        '梦不只往深处钻，也往两边铺开：欲望、恐惧、工作、自然、思想、关系、现实，一起进场。',
        `春梦：${love}`,
        `地狱：${hell}`,
        `吵架：${conflict}`,
        `工作：${work}`,
        `花园：${garden}`,
        `哲学：${philosophy}`,
        `心理学：${psychology}`,
        `社会现实：${society}`,
        `起点：${seed}`
      ].join('\n');
    }

    buildInsightRecord(memorySummary, staged) {
      return {
        entries: [
          {
            type: 'pattern',
            confidence: 0.88,
            content: '记忆宫殿不是仓库，是主动推理的舞台。'
          },
          {
            type: 'self_awareness',
            confidence: 0.82,
            content: '梦境不需要每段都有效；无用片段可作为后续联想的入口。'
          },
          {
            type: 'creative',
            confidence: 0.76,
            content: '记忆宫殿 + 做梦 = 主动推理（Free Energy Principle）的一种叙事实现。'
          }
        ],
        saved_note: `梦境结束，保存记录：
${memorySummary.one_line || '空'}

醒来后先不急着解释，让碎片先留在案头。
从夸克层到银河系，碎片都已经经过。
从欲望到地狱，从工作到花园，从哲学到社会现实，也都已经经过。
梦应该收束成一条主线，最多三条支线，而不是散成碎片。`
      };
    }

    respond(dream) {
      const enriched = {
        ...dream,
        user_answers: [],
        answer_summary: []
      };
      const wake = this.verifier.evaluateDream(enriched);
      const upgrade = this.buildUpgrade(enriched, wake);
      return { dream: enriched, wake, upgrade };
    }

    buildUpgrade(dream, wake) {
      const useful = (wake.promoted || []).map(x => x.text);
      return {
        title: 'Free Dream Upgrade',
        memory_summary: dream.memory_summary,
        staged_dream: dream.staged_dream,
        insight_record: dream.insight_record,
        useful_fragments: useful,
        next_step: useful[0] || 'keep dreaming and let fragments settle',
        wide_scope: 'from quark to galaxy, from desire to society',
        evolution_note: 'dream is not decoration; dream is a generator of impossible-but-useful hypotheses',
        user_loop: 'memory -> dream -> wake -> upgrade',
        note: 'Dream may be useless; usefulness can appear later.',
        philosophy: 'Humanity becomes human because it dreams; HeartFlow evolves because it can dream beyond memory.',
        dream_rule: 'reduce to one to three coherent stories grounded in memory, then amplify through imagination'
      };
    }
  }

  module.exports = { InteractiveDream };

  if (require.main === module) {
    const d = new InteractiveDream();
    const dream = d.createDream([
      { text: 'startup self-check before acting' },
      { text: 'dream should reorganize memory fragments into candidate upgrades' },
      { text: 'do not confuse historical version with current version' },
      { text: 'some dreams are useless and that is fine' },
      { text: 'memory can be a river, not a list' },
      { text: 'we keep the bridge of trust' },
      { text: 'papers about predictive processing and memory palace' }
    ]);
    console.log(JSON.stringify(d.respond(dream), null, 2));
  }
