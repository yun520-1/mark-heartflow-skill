
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

醒来后先不急着解释，让碎片先留在案头。`
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
        user_loop: 'memory -> dream -> wake -> upgrade',
        note: 'Dream may be useless; usefulness can appear later.'
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
