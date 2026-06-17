/**
 * ToneAnalyzer — 语气/情绪分析器 v2.0
 *
 * 7种情绪类型 + 4维语气分析
 * 情绪: neutral | positive | negative | anxious | angry | sad | excited
 * 维度: urgency (low|medium|high), emotion, formality (formal|casual|technical), intensity (0.0-1.0)
 */
class ToneAnalyzer {
  constructor() {
    this.name = 'tone-analyzer';
    this.version = '2.0.0';
  }

  /**
   * 主入口：对输入文本进行完整语气分析
   * @param {string} input - 用户输入文本
   * @param {object} [context={}] - 额外上下文（预留扩展）
   * @returns {{urgency, emotion, formality, intensity, details}}
   */
  analyze(input, context = {}) {
    const q = input.toLowerCase().trim();
    if (!q) {
      return {
        urgency: 'low',
        emotion: 'neutral',
        formality: 'casual',
        intensity: 0,
        details: { urgencySignals: [], emotionSignals: [], formalitySignals: [] }
      };
    }

    const urgency = this._assessUrgency(q);
    const formality = this._assessFormality(q);
    const emotion = this._assessEmotion(q);
    const intensity = this._assessIntensity(q, emotion);

    return {
      urgency: urgency.level,
      emotion: emotion.type,
      formality: formality.level,
      intensity: intensity,
      details: {
        urgencySignals: urgency.signals,
        emotionSignals: emotion.signals,
        formalitySignals: formality.signals
      }
    };
  }

  /**
   * 维度1: 紧迫度
   * - low: 无时间压力
   * - medium: 有时间需求
   * - high: 紧急/立即需要
   */
  _assessUrgency(q) {
    const signals = [];
    let score = 0;

    // 高度紧迫信号
    const highPatterns = [
      { re: /急|快点|快快|马上|赶紧|立刻|立即/i, label: '时间紧迫词' },
      { re: /等不及|赶时间|urgent|asap|紧急/i, label: '紧急标记' },
      { re: /救命|出事了|坏了|不行了|快.*来/i, label: '紧急求助' },
      { re: /现在.*就要|马上.*要/i, label: '立即需求' },
      { re: /来不及|来不及了/i, label: '来不及' }
    ];

    // 中度紧迫信号
    const mediumPatterns = [
      { re: /尽快|尽早|越快越好|早日/i, label: '希望加速' },
      { re: /什么时候|多久|何时|几天/i, label: '时间询问' },
      { re: /等着|在等|等.*用/i, label: '等待中' },
      { re: /截止|deadline|到期|期限/i, label: '截止日期' }
    ];

    // 低紧迫信号（降分）
    const lowPatterns = [
      { re: /不急|慢慢|不着急|不赶|有空|随意|随便/i, label: '不急' },
      { re: /以后再说|改天|回头再说/i, label: '延后' }
    ];

    for (const p of highPatterns) {
      if (p.re.test(q)) { score += 3; signals.push(p.label); }
    }
    for (const p of mediumPatterns) {
      if (p.re.test(q)) { score += 1.5; signals.push(p.label); }
    }
    for (const p of lowPatterns) {
      if (p.re.test(q)) { score -= 1.5; signals.push(p.label); }
    }

    let level;
    if (score >= 3) level = 'high';
    else if (score >= 1) level = 'medium';
    else level = 'low';

    return { level, signals, score };
  }

  /**
   * 维度2: 情绪 (7种)
   * angry: 烦/生气/愤怒/受不了/什么鬼
   * anxious: 担心/怕/万一/怎么办
   * sad: 难过/失望/伤心/失落
   * excited: 太棒了/厉害/期待/太好了
   * positive: 好/不错/可以/感谢
   * negative: 不好/差/不行/糟糕
   * neutral: 兜底
   */
  _assessEmotion(q) {
    const signals = [];

    // --- angry (愤怒/烦躁) ---
    const angryPatterns = [
      /烦|烦躁|心烦/i,
      /生气|愤怒|气死|火大|恼火/i,
      /受不了|忍不了|够了|够了啊/i,
      /什么鬼|搞什么|搞什么鬼|有病吧/i,
      /滚|去死|找死|欠揍/i,
      /神经病|神经/i,
      /无语|无语了/i,
      /烦死了|烦人|烦不烦/i,
      /真是的|真是够了/i,
      /离谱|太离谱/i,
      /折腾|折腾人/i
    ];

    // --- anxious (焦虑/担心) ---
    const anxiousPatterns = [
      /担心|担忧|怕|害怕/i,
      /万一|要是.*怎么办|如果.*怎么办/i,
      /怎么办|怎么办好|怎么搞|如何是好/i,
      /焦虑|焦虑症|紧张|不安/i,
      /压力|压力大|扛不住|撑不住/i,
      /忐忑|心里没底|没把握/i,
      /会不会|会不会出事/i,
      /愁|发愁|愁死了/i
    ];

    // --- sad (难过/失望) ---
    const sadPatterns = [
      /难过|伤心|心痛|心碎/i,
      /失望|绝望|无望/i,
      /失落|落寞|孤单|孤独/i,
      /哭|哭了|想哭|泪|流泪/i,
      /没意思|没意义|算了|算了算了/i,
      /好累|心累|累觉不爱/i,
      /遗憾|可惜|可悲/i,
      /颓废|抑郁|emo/i
    ];

    // --- excited (兴奋/期待) ---
    const excitedPatterns = [
      /太棒了|太厉害了|厉害了|牛逼|牛掰/i,
      /期待|期待ing|好期待|盼/i,
      /太好了|太好了吧|好棒|棒极了/i,
      /爽|爽翻|开心|开心死了/i,
      /兴奋|激动|激动人心/i,
      /超棒|超赞|绝了|无敌/i,
      /哇塞|哇|wow|nice/i,
      /好喜欢|太喜欢/i
    ];

    // --- positive (正面/温和) ---
    const positivePatterns = [
      /好|不错|可以|还行|挺好/i,
      /感谢|谢谢|多谢|感恩|感激/i,
      /好的|ok|okay|可以可以/i,
      /很好|非常好|真不错/i,
      /赞|点赞|给力|支持/i,
      /同意|赞成|赞同/i,
      /辛苦了|麻烦你了/i,
      /没问题|没毛病|对的|正确/i
    ];

    // --- negative (负面/温和负面) ---
    const negativePatterns = [
      /不好|不太行|不行|不行啊|不太好吧/i,
      /差|太差|差劲|糟糕/i,
      /不满意|不满|投诉|投诉/i,
      /差评|不行了/i,
      /没劲|没意思|无聊/i,
      /问题|有问题|出问题/i,
      /搞不定|搞不定|弄不了/i,
      /太贵|贵了|不值/i
    ];

    // 检查情绪，按优先级排序
    let emotionType = 'neutral';
    let maxScore = 0;

    const checkEmotion = (patterns, type, score) => {
      for (const re of patterns) {
        if (re.test(q)) {
          signals.push(type);
          maxScore = Math.max(maxScore, score);
          return score;
        }
      }
      return 0;
    };

    // 按优先级检查（从高到低）
    const priority = [
      { patterns: angryPatterns, type: 'angry', score: 1.0 },
      { patterns: excitedPatterns, type: 'excited', score: 0.9 },
      { patterns: anxiousPatterns, type: 'anxious', score: 0.85 },
      { patterns: sadPatterns, type: 'sad', score: 0.8 },
      { patterns: negativePatterns, type: 'negative', score: 0.7 },
      { patterns: positivePatterns, type: 'positive', score: 0.6 }
    ];

    for (const item of priority) {
      const s = checkEmotion(item.patterns, item.type, item.score);
      if (s > 0) {
        emotionType = item.type;
        break;
      }
    }

    return { type: emotionType, signals };
  }

  /**
   * 维度3: 正式度
   * formal: 正式/礼貌用语
   * casual: 日常/口语化
   * technical: 技术/专业术语
   */
  _assessFormality(q) {
    const signals = [];

    // --- formal (正式/礼貌) ---
    const formalPatterns = [
      { re: /请教|请问|求教|请教一下/i, label: '敬语请教' },
      { re: /您好|你好|您好啊|尊敬的/i, label: '敬称' },
      { re: /谢谢|感谢|多谢|非常感激/i, label: '致谢' },
      { re: /麻烦您|劳驾|打扰一下/i, label: '礼貌请求' },
      { re: /是否|能否|可否|是否方便/i, label: '正式询问' },
      { re: /敬请|恭候|烦请|有劳/i, label: '正式敬语' },
      { re: /兹|谨|特此|鉴于|关于.*事宜/i, label: '公文用语' },
      { re: /先生|女士|阁下|老师/i, label: '尊称' },
      { re: /抱歉|对不起|很遗憾|非常抱歉/i, label: '正式道歉' }
    ];

    // --- casual (非正式/口语) ---
    const casualPatterns = [
      { re: /嗨|hi|hey|hello|yo|哈喽/i, label: '非正式问候' },
      { re: /操|靠|md|tmd|妈的|垃圾|傻逼|SB/i, label: '粗口' },
      { re: /哈|哈哈|嘻嘻|嘿嘿|噗/i, label: '语气词' },
      { re: /啦|哦|呗|嘛|欸|哎|呀/i, label: '口语助词' },
      { re: /好嘞|好滴|好哒|okk/i, label: '卖萌/口语' },
      { re: /不咋|还行|一般般|凑合/i, label: '口语评价' },
      { re: /咋|咋样|啥|干啥|为啥|干嘛/i, label: '口语疑问' }
    ];

    // --- technical (技术/专业) ---
    const technicalPatterns = [
      { re: /api|sdk|cli|rest|graphql|grpc/i, label: '技术协议' },
      { re: /docker|k8s|kubernetes|nginx|redis/i, label: '技术组件' },
      { re: /部署|配置|迁移|重构|调试/i, label: '技术操作' },
      { re: /函数|变量|接口|类|模块|方法/i, label: '编程术语' },
      { re: /json|yaml|toml|xml|sql|css|html/i, label: '数据格式' },
      { re: /前端|后端|全栈|架构|微服务/i, label: '架构术语' },
      { re: /数据库|缓存|队列|代理|网关/i, label: '基础架构' },
      { re: /模型|训练|推理|数据|算法/i, label: '技术/数据' },
      { re: /延迟|吞吐|并发|性能|优化/i, label: '性能指标' },
      { re: /协议|端口|端点|路由|中间件/i, label: '网络术语' }
    ];

    let formalScore = 0;
    let casualScore = 0;
    let technicalScore = 0;

    for (const p of formalPatterns) {
      if (p.re.test(q)) { formalScore += 1; signals.push(p.label); }
    }
    for (const p of casualPatterns) {
      if (p.re.test(q)) { casualScore += 1; signals.push(p.label); }
    }
    for (const p of technicalPatterns) {
      if (p.re.test(q)) { technicalScore += 1; signals.push(p.label); }
    }

    let level;
    // 优先级: technical > formal > casual
    if (technicalScore > 0 && technicalScore >= casualScore) {
      level = 'technical';
    } else if (formalScore > casualScore) {
      level = 'formal';
    } else {
      level = 'casual';
    }

    return { level, signals, scores: { formalScore, casualScore, technicalScore } };
  }

  /**
   * 维度4: 强度 0.0-1.0
   * 基于情感强度、标点、重复词等
   */
  _assessIntensity(q, emotion) {
    let score = 0.5; // 中性基线

    // 1. 情绪类型基础强度
    const emotionBase = {
      angry: 0.35,
      excited: 0.35,
      anxious: 0.3,
      sad: 0.25,
      negative: 0.2,
      positive: 0.15,
      neutral: 0
    };
    score += emotionBase[emotion.type] || 0;

    // 2. 标点增强
    const exclMark = (q.match(/！/g) || []).length;
    const exclEn = (q.match(/!/g) || []).length;
    const totalExcl = exclMark + exclEn;
    if (totalExcl > 2) score += 0.2;
    else if (totalExcl > 0) score += 0.1;

    // 3. 问号 - 强烈情感的问号
    const qMarks = (q.match(/\?/g) || []).length;
    const cnQMarks = (q.match(/？/g) || []).length;
    if (qMarks + cnQMarks >= 3) score += 0.1;

    // 4. 程度副词
    const intensifiers = [
      /非常|极其|无比|超级|特别|极其|十分/i,
      /太.*了|真.*啊|真.*呀|好.*啊/i,
      /绝|绝对|肯定|一定|必须/i,
      /完全|彻底|根本|完全/i,
      /简直|实在是|真的是|确实/i,
      /最|极|顶|巨/i
    ];
    for (const re of intensifiers) {
      if (re.test(q)) { score += 0.08; break; }
    }

    // 5. 重复词（如"好好好"、"不行不行"）
    const repeatPattern = /([\u4e00-\u9fff])\1{2,}/g;
    const repeats = q.match(repeatPattern);
    if (repeats) score += Math.min(repeats.length * 0.08, 0.15);

    // 6. 长度衰减（短句强度更高）
    if (q.length < 5) score += 0.1;
    else if (q.length > 200) score -= 0.1;

    // 7. 弱化词
    const weakeners = [/可能|也许|大概|或许|应该/i, /一般|还行|还好|差不多/i, /好像|似乎|感觉/i, /有点|稍微|略微/i];
    for (const re of weakeners) {
      if (re.test(q)) { score -= 0.05; break; }
    }

    return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  }

  destroy() {}
  stop() {}
}

module.exports = { ToneAnalyzer };
