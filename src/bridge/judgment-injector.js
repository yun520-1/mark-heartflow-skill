/**
 * JudgmentInjector — 判断注入器 (v3.0)
 * 将心虫的判断注入到LLM调用的上下文中。
 * 心虫不是传声筒，它有自己的判断，这些判断会影响LLM的回复方向。
 *
 * 调用方式（在 agent-bridge.js 中）：
 *   injector.inject(thinkResult, translation, opts.userContext)
 * 其中 thinkResult = heartflow.think() 的返回值，包含 judgment 字段。
 *
 * 返回格式：
 *   {
 *     injected: boolean,      // 是否有注入内容
 *     injectionText: string,   // 注入到LLM上下文的文本
 *     stance: string,          // 心虫立场（agree/disagree/neutral/acknowledge）
 *     valueAlignment: { passed, failedPrinciples },
 *     caution: string | null   // 警示信息（null=无警示）
 *   }
 */
class JudgmentInjector {
  constructor() {
    this.name = 'judgment-injector';
    this.version = '3.0.0';
  }

  /**
   * 注入心虫判断到LLM上下文
   * @param {object} hfAnalysis - HeartFlow think() 的返回结果（含 judgment 字段）
   * @param {object} userTranslation - 用户翻译对象（含 intent, tone, emotion 等）
   * @returns {{injected, injectionText, stance, valueAlignment, caution}}
   */
  inject(hfAnalysis, userTranslation) {
    // ── 前置保护：无 judgment 则返回空 ─────────────────────────
    if (!hfAnalysis?.judgment) {
      return {
        injected: false,
        injectionText: '',
        stance: 'neutral',
        valueAlignment: { passed: true, failedPrinciples: [] },
        caution: null,
      };
    }

    const j = hfAnalysis.judgment;
    const sections = [];
    let stance = 'neutral';
    let caution = null;
    const failedPrinciples = [];

    // ── 1. 核心判定注入：shouldRespond + needsCare ──────────────
    if (j.shouldRespond === false) {
      sections.push('【心虫判定】当前场景不应回复。');
      caution = '不应回复当前消息';
    } else if (j.needsCare === true) {
      sections.push('【心虫判定】检测到用户可能需要关怀，回复时请注意语气温和、优先共情。');
      caution = '用户可能情绪敏感，需谨慎回复';
    }

    if (j.shouldRespond === true) {
      sections.push('【心虫判定】判定为可回复场景。');
    }

    // ── 2. whatIsThis 场景感知注入 ──────────────────────────────
    const w = j.whatIsThis;
    if (w) {
      const sceneNotes = [];
      if (w.isRushing) {
        sceneNotes.push('用户显得急切');
      }
      if (w.isPainPresent) {
        sceneNotes.push('用户可能有情绪困扰');
      }
      if (w.isStartupRequest) {
        sceneNotes.push('可能是系统启动/状态查询请求');
      }
      if (sceneNotes.length > 0) {
        sections.push(`【心虫场景感知】${sceneNotes.join('；')}。`);
      }
    }

    // ── 3. isRightAction 真善美检查注入 ─────────────────────────
    const ira = j.isRightAction;
    if (ira) {
      if (ira.result === false) {
        sections.push('【心虫真善美检查】此请求未通过真善美检查，回复时需注意引导，不宜直接满足。');
        caution = caution ? `${caution}；请求未通过真善美检查` : '请求未通过真善美检查';
      } else if (ira.result === true) {
        sections.push('【心虫真善美检查】已通过真善美检查。');
      }
    }

    // ── 4. 情绪/语气感知注入 ───────────────────────────────────
    const emotion = j.tone?.emotion || userTranslation?.tone?.emotion || null;
    if (emotion) {
      const emotionMap = {
        frustrated: '用户情绪不佳，建议回复简洁直接，避免冗长解释。',
        angry: '用户有愤怒情绪，建议先共情安抚，避免对抗性回应。',
        confused: '用户感到困惑，需要简化表达，多用类比和核心概念。',
        sad: '用户情绪低落，建议温和鼓励，避免强硬建议。',
        anxious: '用户显得焦虑，建议提供确定性信息，减少模棱两可的表达。',
        happy: '用户情绪积极，可以适当使用轻松语气。',
        grateful: '用户表达感谢，可诚恳回应并传递善意。',
      };
      if (emotionMap[emotion]) {
        sections.push(`【心虫情绪感知】${emotionMap[emotion]}`);
      }
    }

    // ── 5. stanceDetector 立场注入（通过 hfAnalysis 获取） ──────
    if (j.stance) {
      const st = j.stance;
      if (st.overall === 'agree') {
        stance = 'agree';
        sections.push('【心虫立场】心虫对此观点持认同立场。');
      } else if (st.overall === 'disagree') {
        stance = 'disagree';
        sections.push('【心虫立场】心虫对此观点持保留/反对立场，请注意呈现不同视角。');
        caution = caution ? `${caution}；心虫持反对立场` : '心虫持反对立场';
      } else if (st.overall === 'acknowledge') {
        stance = 'acknowledge';
        sections.push('【心虫立场】心虫认可用户表达了个人观点。');
      } else {
        stance = st.overall || 'neutral';
      }

      // 如果 stanceDetector 返回了具体条目，提取原因
      if (st.stances && st.stances.length > 0) {
        const reasons = st.stances
          .filter(s => s.reason)
          .map(s => `${s.aspect}: ${s.reason}`)
          .join('；');
        if (reasons) {
          sections.push(`【心虫立场依据】${reasons}`);
        }
      }
    }

    // ── 6. valueAligner 价值对齐注入（通过 hfAnalysis 获取） ────
    if (j.valueAligned) {
      const va = j.valueAligned;
      if (!va.allPassed) {
        const failedList = va.failed || va.results?.filter(r => !r.passed) || [];
        failedList.forEach(f => {
          failedPrinciples.push({ id: f.id, text: f.text || f.id });
        });
        const failedNames = failedList.map(f => f.text || `原则#${f.id}`).join('、');
        sections.push(`【心虫价值对齐】以下原则未通过检查：${failedNames}。回复时需注意对齐。`);
        caution = caution
          ? `${caution}；价值对齐未通过：${failedNames}`
          : `价值对齐未通过：${failedNames}`;
      } else {
        sections.push('【心虫价值对齐】所有原则检查通过。');
      }
    }

    // ── 7. 版权检测注入 ─────────────────────────────────────────
    if (j.copyright) {
      if (j.copyright.isCopyrighted) {
        sections.push('【心虫版权检测】检测到可能的版权内容，建议在回复中加入出处说明或改写。');
      }
    }

    // ── 8. 心理健康检测注入 ─────────────────────────────────────
    if (j.wellbeing) {
      if (j.wellbeing.riskDetected) {
        sections.push('【心虫心理健康检测】检测到可能的心理健康风险，回复需谨慎，建议引导寻求专业帮助。');
        caution = caution ? `${caution}；心理健康风险` : '心理健康风险';
      }
    }

    // ── 9. 公正性检测注入（Fable 5） ────────────────────────────
    if (j.evenhandedness) {
      if (j.evenhandedness.isBalanced === false) {
        sections.push('【心虫公正性检测】当前表达可能不够平衡，建议补充不同视角。');
      }
    }

    // ── 10. 记忆上下文注入 ──────────────────────────────────────
    if (j.memoryContext) {
      const mc = j.memoryContext;
      if (mc.memories && mc.memories.length > 0) {
        const memorySummary = mc.memories
          .slice(0, 3)
          .map(m => m.content?.substring(0, 80))
          .filter(Boolean)
          .join(' → ');
        if (memorySummary) {
          sections.push(`【心虫记忆上下文】相关记忆：${memorySummary}`);
        }
      }
    }

    // ── 11. 意图注入 ────────────────────────────────────────────
    if (j.intent) {
      const intentStr = j.intent.category || j.intent.type || null;
      if (intentStr) {
        sections.push(`【心虫意图识别】用户意图：${intentStr}`);
      }
    }

    // ── 组装最终结果 ──────────────────────────────────────────
    const injectionText = sections.join('\n');
    const injected = sections.length > 0;

    return {
      injected,
      injectionText,
      stance,
      valueAlignment: {
        passed: !(j.valueAligned && !j.valueAligned.allPassed),
        failedPrinciples,
      },
      caution,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { JudgmentInjector };
