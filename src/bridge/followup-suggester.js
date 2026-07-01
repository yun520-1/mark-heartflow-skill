/**
 * FollowupSuggester — 追问建议器 v3.0
 * 基于心虫分析和用户翻译结果，在回复中建议用户可能想追问的方向。
 *
 * 核心逻辑：
 * 1. 心虫判定 shouldRespond=false → 不追问
 * 2. 意图不明确 (isAmbiguous) → 追问意图
 * 3. 隐性需求有 need_clarification → 追问
 * 4. 按 intent 类型生成相关追问
 * 5. 情绪低落时给出情感支持的追问
 * 6. 结果最多3条，按优先级排序
 */
class FollowupSuggester {
  constructor() {
    this.name = 'followup-suggester';
    this.version = '3.0.0';
  }

  /**
   * 基于心虫分析和翻译结果生成追问建议。
   * @param {Object} heartflow - 心虫分析结果（think/think_fast 的输出）
   * @param {Object} userTranslation - 翻译流水线输出（含 intent, tone, implicitNeeds 等）
   * @returns {{ suggestions: Array<{question: string, reason: string, priority: string}>, count: number }}
   */
  suggest(heartflow, userTranslation) {
    const suggestions = [];

    // 如果两个输入都没有，直接返回空
    if (!heartflow && !userTranslation) {
      return { suggestions: [], count: 0 };
    }

    // ─── 从心虫分析中提取关键字段 ───
    const hfShouldRespond = heartflow?.judgment?.shouldRespond ?? heartflow?.thought?.decision?.shouldRespond ?? true;
    const hfConfidence = heartflow?.thought?.output?.confidence ?? 0.5;
    const hfEmotion = heartflow?.psychology?.emotion?.emotion ?? 'neutral';
    const hfEmotionZh = heartflow?.psychology?.emotion?.emotionZh ?? '中性';
    const hfNeeds = heartflow?.psychology?.needs ?? [];

    // ─── 从用户翻译中提取关键字段 ───
    const intent = userTranslation?.intent?.primary ?? userTranslation?.intent?.type ?? 'general';
    const isAmbiguous = userTranslation?.intent?.isAmbiguous ?? false;
    const toneEmotion = userTranslation?.tone?.emotion ?? userTranslation?.tone?.emotionZh ?? '';
    const implicitNeeds = userTranslation?.implicitNeeds?.needs ?? [];
    const confidence = userTranslation?.confidence?.overall ?? 0.5;

    // ─── 规则1：心虫判定不应回复 → 不追问 ───
    if (hfShouldRespond === false) {
      return { suggestions: [], count: 0 };
    }

    // ─── 规则2：意图不明确 → 追问意图 ───
    if (isAmbiguous || intent === 'general' || hfConfidence < 0.3) {
      suggestions.push({
        question: '您能具体说一下想了解哪方面吗？',
        reason: '意图不明确，需要缩小范围',
        priority: 'high'
      });
    }

    // ─── 规则3：隐性需求中有 need_clarification → 追问 ───
    const clarificationNeeds = implicitNeeds.filter(n => n.type === 'need_clarification');
    if (clarificationNeeds.length > 0) {
      suggestions.push({
        question: '您能补充一些具体信息吗？这样我可以给出更精准的回答。',
        reason: '表述模糊，需要更多上下文',
        priority: 'high'
      });
    }

    // ─── 规则4：按 intent 类型生成相关追问 ───
    if (intent === 'inquire' || intent === 'explain') {
      // 解释/询问类：提供深度追问选项
      if (!suggestions.some(s => s.question.includes('深入'))) {
        suggestions.push({
          question: '想更深入理解原理吗？我可以展开讲细节。',
          reason: '用户询问基础知识，可进一步深入',
          priority: 'medium'
        });
      }
    }

    if (intent === 'analyze' || intent === 'compare') {
      // 分析/比较类：提供多维度追问
      suggestions.push({
        question: '需要从更多维度对比吗？或者有其他选项想加入比较？',
        reason: '分析/比较意图，可扩展维度',
        priority: 'medium'
      });
    }

    if (intent === 'create') {
      suggestions.push({
        question: '需要我帮您进一步优化这个方案，或者生成一个可运行的版本吗？',
        reason: '创作意图，可推进到实现',
        priority: 'medium'
      });
    }

    if (intent === 'evaluate') {
      suggestions.push({
        question: '需要我帮您分析各选项的利弊和适用场景吗？',
        reason: '评估意图，可提供决策支持',
        priority: 'high'
      });
    }

    if (intent === 'execute') {
      suggestions.push({
        question: '需要我帮您配置好环境并执行吗？或者先展示操作步骤？',
        reason: '执行意图，可提供具体操作',
        priority: 'high'
      });
    }

    // ─── 规则5：隐性需求匹配 → 针对性追问 ───
    for (const need of implicitNeeds) {
      // need_clarification 已经在规则3处理，跳过
      if (need.type === 'need_clarification') continue;

      let question = '';
      let reason = need.signal || `检测到${need.type}`;

      switch (need.type) {
        case 'need_example':
          question = '需要我给您举一个具体例子吗？';
          break;
        case 'need_comparison':
          // 如果已经是 analyze/comparison 意图，避免重复
          if (intent === 'analyze' || intent === 'compare') continue;
          question = '需要我帮您对比一下各选项的优缺点吗？';
          break;
        case 'need_decision_support':
          question = '需要我帮您梳理决策因素，提供权衡建议吗？';
          break;
        case 'need_verification':
          question = '需要我核实一下这些信息的准确性吗？';
          break;
        case 'need_step_by_step':
          question = '需要我一步步指导您操作吗？';
          break;
        case 'need_simplification':
          question = '需要我用更通俗的语言重新解释吗？';
          break;
        case 'need_emotional_support':
          // 情感支持不追问技术问题，留到规则6处理
          continue;
        default:
          continue;
      }

      if (question) {
        suggestions.push({
          question,
          reason,
          priority: need.confidence >= 0.8 ? 'high' : 'medium'
        });
      }
    }

    // ─── 规则6：情绪低落/负面 → 情感支持型追问 ───
    const negativeEmotions = ['frustrated', 'sad', 'anxious', 'angry', '失望', '沮丧', '焦虑', '烦躁'];
    const isNegativeTone = negativeEmotions.includes(toneEmotion) || negativeEmotions.includes(hfEmotion) || negativeEmotions.includes(hfEmotionZh);
    const hasEmotionalNeed = implicitNeeds.some(n => n.type === 'need_emotional_support');

    if (isNegativeTone || hasEmotionalNeed || hfEmotion === 'negative') {
      suggestions.push({
        question: '换个角度聊聊？或者先停下来休息一下？我随时在这里。',
        reason: '检测到负面情绪，先提供情感支持',
        priority: 'low'
      });
    }

    // ─── 去重：去除完全相同的 question ───
    const seen = new Set();
    const deduped = suggestions.filter(s => {
      const key = s.question.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ─── 按优先级排序，最多返回3条 ───
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    deduped.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

    const top = deduped.slice(0, 3);

    return { suggestions: top, count: top.length };
  }

  destroy() {}
  stop() {}
}

module.exports = { FollowupSuggester };
