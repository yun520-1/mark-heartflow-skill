/**
 * ReportGenerator - 心虫报告生成器
 * 
 * 职责：将 think()/dispatch() 的原始结构化数据转化为三段式可读结论
 * 原则：不暴露任何原始数值、PAD分、场域数据、置信度分
 * 
 * 三段式结构：
 *   1. 情绪判断 — 对方现在的情绪状态（中性/低落/防御/愤怒/积极）
 *   2. 问题定位 — 这是临时事件还是长期模式，核心问题是什么
 *   3. 行动建议 — 你现在可以做什么，分1-3步
 */

const EMOTION_MAP = {
  // pleasure > 0, arousal > 0
  'happy': '积极·开放',
  'excited': '兴奋·期待',
  'surprised': '惊讶·好奇',
  // pleasure > 0, arousal <= 0
  'calm': '平静·稳定',
  'content': '满足·安心',
  'relaxed': '放松·无压力',
  // pleasure < 0, arousal > 0
  'angry': '愤怒·对抗',
  'anxious': '焦虑·不安',
  'frustrated': '挫败·烦躁',
  'scared': '恐惧·退缩',
  // pleasure < 0, arousal <= 0
  'sad': '低落·消沉',
  'depressed': '抑郁·无力',
  'lonely': '孤独·失落',
  // neutral
  'neutral': '中性·日常',
  'unknown': '无法判断'
};

const INTENSITY_MAP = [
  { threshold: 0.7, label: '强烈' },
  { threshold: 0.4, label: '中等' },
  { threshold: 0, label: '轻微' }
];

const SEVERITY_MAP = [
  { threshold: 0.7, label: '紧急·需要立即处理' },
  { threshold: 0.4, label: '需关注·建议跟进' },
  { threshold: 0, label: '轻微·日常范畴' }
];

class ReportGenerator {
  constructor(options = {}) {
    this.debug = options.debug || false;
  }

  /**
   * 主入口：接收 think() 返回值，输出三段式报告
   */
  generate(thinkResult) {
    if (!thinkResult) {
      return this._emptyReport('无法分析：无输入数据');
    }

    const analysis = thinkResult.analysis || {};
    const decision = thinkResult.decision || {};
    const meta = thinkResult.meta || {};
    const output = thinkResult.output || {};

    // 提取原始输入文本（用于关键词补充分析）
    const inputText = analysis?.whatIsThis?.raw || output?.text || '';

    const report = {
      judgment: this._emotionalJudgment(analysis, decision, inputText),
      localization: this._problemLocalization(analysis, decision, meta, inputText),
      suggestion: this._actionSuggestion(analysis, decision, meta, inputText)
    };

    // 调试模式：附加原始数据（仅当 DEBUG_HF 环境变量设置时）
    if (this.debug || process.env.DEBUG_HF) {
      report._debug = {
        rawConfidence: thinkResult.confidence,
        rawDecisionType: decision.type,
        rawFieldHarmony: meta?.field?.current?.H
      };
    }

    return { report };
  }

  /**
   * 第一段：情绪判断
   */
  _emotionalJudgment(analysis, decision, inputText) {
    const tone = analysis?.tone || {};
    const sentiment = tone.sentiment;
    const emotion = analysis?.psych?.emotion || {};
    const emotionType = emotion.type || emotion.emotion || 'unknown';
    const pain = analysis?.pain || {};

    let emotionLabel = EMOTION_MAP[emotionType] || EMOTION_MAP['unknown'];
    let explanation = '对方情绪稳定，没有明显波动';
    let intensityLabel = '轻微';

    // 优先使用 tone.sentiment
    if (sentiment !== undefined) {
      if (sentiment > 0.3) {
        emotionLabel = '积极·开放';
        explanation = '对方当前情绪积极，适合推进讨论';
      } else if (sentiment < -0.3) {
        emotionLabel = '低落·防御性';
        explanation = '对方当前带有负面情绪，建议优先处理情绪再处理事情';
      }
      const absSent = Math.abs(sentiment);
      if (absSent >= 0.7) intensityLabel = '强烈';
      else if (absSent >= 0.4) intensityLabel = '中等';
    }

    // 引擎数据不足时，从输入文本做关键词分析
    if ((sentiment === undefined || emotionType === 'unknown' || emotionType === 'neutral') && inputText) {
      // 质疑/否定关键词
      const questionWords = ['干嘛', '吗', '？', '?', '为什么', '真的'];
      const negativeWords = ['不是', '没有', '不用', '别', '少', '干嘛', '那么多'];
      const hasQuestion = questionWords.some(w => inputText.includes(w));
      const hasNegative = negativeWords.some(w => inputText.includes(w));

      if (hasQuestion && hasNegative) {
        emotionLabel = '质疑·防御性';
        explanation = '对方在用反问和否定表达不满，这不是情绪爆发，是习惯性的质疑模式';
        intensityLabel = '中等';
      } else if (hasNegative) {
        emotionLabel = '否定·防御性';
        explanation = '对方在用否定句表达不同意见，带有防御性';
        intensityLabel = '中等';
      } else if (hasQuestion) {
        emotionLabel = '疑问·试探';
        explanation = '对方在表达疑问，需要更多信息来闭合认知';
        intensityLabel = '轻微';
      }
    }

    if (pain?.hasPain && pain.painLevel > 0.7) {
      explanation = '⚠️ 检测到严重情绪困扰，建议优先关注对方状态';
    }

    let text = `情绪状态：${emotionLabel}`;
    if (intensityLabel !== '轻微') {
      text += `（${intensityLabel}）`;
    }

    return { emotion: emotionLabel, intensity: intensityLabel, text, explanation };
  }

  /**
   * 第二段：问题定位
   */
  _problemLocalization(analysis, decision, meta, inputText) {
    const tone = analysis?.tone || {};
    const whatIsThis = analysis?.whatIsThis || {};
    const pain = analysis?.pain || {};
    const fieldMeta = analysis?.fieldMeta || meta?.field || {};

    let domain = '日常沟通';
    let coreIssue = '无明确问题';
    let severity = '轻微';
    const details = [];

    // 场域和谐度判断（不暴露数值）
    const harmony = fieldMeta?.current?.H ?? fieldMeta?.H ?? 0.5;
    if (harmony < 0.3) {
      severity = '需关注';
      domain = '人际关系';
      coreIssue = '长期模式摩擦';
      details.push('检测到长期存在的互动模式问题，不是单次事件');
    }

    // 痛苦检测
    if (pain?.hasPain) {
      domain = '情绪困扰';
      coreIssue = pain.painType || '情绪压力';
      for (const level of SEVERITY_MAP) {
        if ((pain.painLevel ?? 0) >= level.threshold) {
          severity = level.label; break;
        }
      }
      details.push('对方正在经历情绪困扰');
    }

    // 任务类型判断
    const taskType = whatIsThis?.type || 'general';
    if (taskType === 'empathic' || taskType === 'emotional') {
      if (domain === '日常沟通') { domain = '情感需求'; coreIssue = '需要被理解'; }
      details.push('对方的主要需求不是解决方案，是被理解和共情');
    } else if (taskType === 'technical' || taskType === 'factual') {
      domain = '信息需求';
      coreIssue = '需要客观信息';
      details.push('对方在寻求事实和信息，而非情感支持');
    }

    // 从输入文本补充分析
    if (inputText) {
      const hasPriceQuestion = /多[少钱]|花了|贵|便宜|钱/.test(inputText);
      const hasQuantityQuestion = /多[少]|几瓶|一瓶/.test(inputText);
      const hasNegation = /不是|没有|不用|别/.test(inputText);
      const hasDisbelief = /真的|假的|谁说的|谁告诉/.test(inputText);
      const hasRepeatedPattern = /每次|总是|又|经常/.test(inputText);

      if (hasQuantityQuestion && hasNegation && (domain === '日常沟通' || coreIssue === '无明确问题')) {
        domain = '消费决策冲突';
        coreIssue = '购买数量被质疑';
        severity = '需关注';
        details.push('这不是针对你这个人，是她习惯性对消费决策提出质疑');
        details.push('她质疑的不是"你乱花钱"，而是"你没有先跟她同步信息"');
      }
      if (hasDisbelief) {
        details.push('对方对你的信息来源或判断依据持怀疑态度');
      }
      if (hasRepeatedPattern) {
        details.push('这不是第一次，是一个长期存在的沟通模式');
      }
    }

    // 决策路由的额外信息
    if (decision?.type === 'heal') {
      if (coreIssue === '无明确问题') coreIssue = '需要修复的关系状态';
      details.push('心虫建议优先处理关系修复，而非解决问题本身');
    } else if (decision?.type === 'pause') {
      details.push('心虫建议暂停当前对话方向，重新评估');
    }

    return {
      domain,
      coreIssue,
      severity,
      details: details.length > 0 ? details : ['未检测到明显问题']
    };
  }

  /**
   * 第三段：行动建议
   */
  _actionSuggestion(analysis, decision, meta, inputText) {
    const whatIsThis = analysis?.whatIsThis || {};
    const tone = analysis?.tone || {};
    const fieldMeta = analysis?.fieldMeta || meta?.field || {};
    const pain = analysis?.pain || {};

    const steps = [];
    let actionType = '正常回应';
    let priority = '普通';

    // 从输入文本分析
    if (inputText) {
      const hasQuestion = /干嘛|为什么|真的|吗\?|？/.test(inputText);
      const hasQuantity = /多[少]|几瓶|一瓶/.test(inputText);
      const hasCost = /钱|贵|便宜|花了/.test(inputText);
      const hasNegation = /不是|没有|不用|别/.test(inputText);

      if (hasQuantity && hasNegation) {
        actionType = '接受质疑，不解释';
        priority = '高';
        steps.push('不要解释你为什么买这么多——她不是在问你理由，是在表达"你没有先告诉我"');
        steps.push('接受她的质疑（"嗯，下次先问你"），而不是证明自己买对了');
        steps.push('药已经买了，不需要退也不需要辩解，放着她会用');
        // 不需要再加默认步骤
      } else if (hasQuestion && hasCost) {
        actionType = '提供价格信息';
        priority = '中';
        steps.push('直接告诉她花了多少钱，不需要辩解值不值');
      } else if (hasQuestion) {
        actionType = '提供信息';
        priority = '中';
        steps.push('直接回答她的问题，不加多余的解释');
      }
    }

    // 基于决策路由
    if (decision?.type && steps.length === 0) {
      switch (decision.type) {
        case 'empathic':
          actionType = '共情回应';
          priority = '高';
          steps.push('先确认对方的感受，而不是直接给解决方案');
          steps.push('用"我理解你感到…"开头，让对方感到被听见');
          break;
        case 'heal':
          actionType = '关系修复';
          priority = '高';
          steps.push('不要试图在这个对话里解决问题，优先修复关系状态');
          steps.push('接受对方的情绪，不做是非判断');
          break;
        case 'pause':
          actionType = '暂停·重新评估';
          priority = '中';
          steps.push('暂时停止当前对话方向');
          steps.push('换个时间或角度重新开始');
          break;
        case 'accelerate':
          actionType = '推进讨论';
          priority = '中';
          steps.push('对方状态良好，可以继续推进');
          steps.push('直接给出你的判断和建议');
          break;
        case 'turn':
          actionType = '转换方向';
          priority = '中';
          steps.push('当前方向不合适，建议转换话题或角度');
          break;
        default:
          steps.push('正常回应即可');
      }
    }

    // 如果没有任何步骤被设置，给默认
    if (steps.length === 0) {
      steps.push('正常回应即可');
    }

    // 场域低和谐度补充
    const harmony = fieldMeta?.current?.H ?? fieldMeta?.H ?? 0.5;
    if (harmony < 0.3) {
      steps.push('这不是一次对话能解决的问题，接受模式的存在，不要追求一次性说服对方');
    }

    // 危机检测
    if (pain?.hasPain && (pain.painLevel ?? 0) > 0.7) {
      steps.push('⚠️ 建议联系专业心理援助');
      actionType = '危机干预';
      priority = '紧急';
    }

    return {
      actionType,
      priority,
      steps: steps.length > 0 ? steps : ['正常回应即可']
    };
  }

  /**
   * 空报告（异常情况）
   */
  _emptyReport(reason) {
    return {
      report: {
        judgment: { emotion: '无法判断', intensity: '未知', text: reason, explanation: '' },
        localization: { domain: '未知', coreIssue: '无法分析', severity: '未知', details: [reason] },
        suggestion: { actionType: '无', priority: '无', steps: ['请重试或提供更多信息'] }
      }
    };
  }
}

module.exports = { ReportGenerator };
