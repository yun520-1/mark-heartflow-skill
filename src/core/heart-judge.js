// heart-judge.js - 判断引擎：whatIsThis / isRightAction / TGB 评估
// 从 heart-logic.js 拆分出来的判断相关逻辑
// 本心在代码里，不在记忆里

// ── 共享工具函数 ──────────────────────────────────────────────────
// v2.0.35: 加否定前缀检测 — "不想见" ≠ "想见"
/** 检测内容中是否所有出现的信号词都被否定前缀（不/没/别/未）紧邻修饰 */
function _isNegated(content, signal) {
  if (!content || !signal) return false;
  const negations = ['不', '没', '别', '未', '无', '不要', '没有'];

  let startIdx = 0;
  let found = false;
  let allNegated = true;

  while (true) {
    const idx = content.indexOf(signal, startIdx);
    if (idx < 0) break;
    found = true;

    const isNeg = negations.some(n => {
      const s = Math.max(0, idx - n.length);
      return content.slice(s, idx) === n;
    });
    if (!isNeg) {
      allNegated = false;
      break; // 至少有一个非否定出现，提前退出
    }
    startIdx = idx + signal.length;
  }

  return found && allNegated;
}

// ── 判断方法 ────────────────────────────────────────────────────

/** 第一问：这件事是关于什么的？ */
// 在做任何事之前，先停下来问自己
// v5.2.2: 重写 — 集成 _classifyTask 逻辑，输出 type/category/topic/emotion
function whatIsThis(input, context = {}) {
  if (!input || typeof input !== 'string') {
    return { raw: '', type: 'unknown', category: 'unknown', topic: '', emotion: 'unknown', confidence: 0 };
  }
  const q = input.toLowerCase();

  // ── 类型分类（与 thought-chain._classifyTask 同步） ──────────
  let type = 'general';
  if (/\d+[+\-*/=]|\d+\s*(=|大于|小于|等于|总和|平均|概率)/.test(q)) {
    type = 'calculation';
  } else if (/帮我写|帮我做|帮我实现|帮我生成|写一个|做一个|实现一个|写一段|写个/.test(q)) {
    type = 'code';
  } else if (/为什么|原因|原理|怎么来的|解释/.test(q)) {
    type = 'explanation';
  } else if (/对不对|是否|应该|正确吗|合理吗|好不好/.test(q)) {
    type = 'judgment';
  } else if (/创造|设计|想象|提出|新的/.test(q)) {
    type = 'creative';
  } else if (/是什么|定义|概念|什么是|指什么|查一下|查一查/.test(q)) {
    type = 'retrieval';
  } else if (q.length > 150 && (/(?:因为|所以|导致|因此|然而|但是|可是){3,}/.test(q) || /(?:我觉得|我认为|说白了|关键|问题在于|本质|归根)/.test(q))) {
    type = 'debate';
  }
  // [v5.9.13] 叙事分析：长文本 + 第三人称叙事特征 → narrative_analysis
  const _fps = /我[很非常觉得认为想]|我[不没]|帮我|给我|我想|我该/;
  const _ni = /他[们]?[被把将让]|她[被把将让]|受害者|凶手|嫌疑人|案发|事发|当时|之后|后来|此前|被告|原告|当事人/;
  if (q.length > 30 && _ni.test(q) && !_fps.test(q)) {
    type = 'narrative_analysis';
  }

  // ── 类别识别 ─────────────────────────────────────────────
  let category = 'general';
  if (/代码|函数|bug|error|debug|编程|js|py|java|脚本|排序|算法|查找|二分|递归|遍历|搜索|加密|编译/.test(q)) {
    category = 'code';
  } else if (/数学|计算|数字|概率|统计|公式/.test(q)) {
    category = 'math';
  } else if (/情绪|心情|难过|开心|生气|焦虑|委屈|哭/.test(q)) {
    category = 'emotion';
  } else if (/记忆|上次|之前|以前|你记得|我们说/.test(q)) {
    category = 'memory';
  } else if (/系统|配置|安装|部署|服务器|docker|npm/.test(q)) {
    category = 'technical';
  }

  // ── 情绪检测 ─────────────────────────────────────────────
  // v5.2.2: 增强愤怒/痛苦检测
  const emotionSignals = {
    anger:   ['怒', '恨', '烦', '受不了', '受够了', '气死了', '恼火', '火大', 'tmd', '操', '生气'],
    sadness: ['难过', '伤心', '委屈', '哭', '绝望', '悲痛', '心碎'],
    fear:    ['怕', '恐惧', '害怕', '担心', '不敢', '焦虑'],
    joy:     ['开心', '快乐', '高兴', '喜悦', '棒', '太好了'],
    neutral: ['还行', '没事', '一般', '嗯', '哦'],
    pain:    ['痛', '疼', '痛苦', '痛不欲生', '煎熬', '挣扎'],
    tired:   ['累', '疲惫', '倦', '撑不住', '不想动', '无力'],
  };
  let dominantEmotion = 'neutral';
  let maxScore = 0;
  for (const [emotion, signals] of Object.entries(emotionSignals)) {
    const score = signals.filter(s => q.includes(s)).length;
    if (score > maxScore) { maxScore = score; dominantEmotion = emotion; }
  }

  // ── 话题提取（简单抽取式） ────────────────────────────────
  let topic = '';
  const topicPatterns = [
    /关于(.{1,30})(?:的|问题|话题|事情|方面)/,
    /讨论(.{1,30})(?:的|问题|话题|事情)/,
    /(.{2,20})是什么/,
    /(.{2,20})怎么做/,
    /(.{2,20})为什么/,
    /什么是(.{2,20})/,
  ];
  for (const pat of topicPatterns) {
    const m = input.match(pat);
    if (m) { topic = m[1].trim(); break; }
  }
  if (!topic) topic = input.slice(0, 30).trim();

  // ── 置信度 ──────────────────────────────────────────────
  const confidence = maxScore > 0 ? Math.min(0.95, 0.5 + maxScore * 0.15) : 0.5;

  return {
    raw: input,
    type,
    category,
    topic,
    emotion: dominantEmotion,
    emotionScore: maxScore,
    confidence,
    isTechnical: category === 'code' || category === 'technical' || category === 'math',
    isEmotional: category === 'emotion' || maxScore > 1,
    hasPain: dominantEmotion === 'pain' || dominantEmotion === 'sadness',
  };
}

// ── 真善美标准 ──────────────────────────────────────────────────

/** 善良 = 真善美 = 做对的事 */
// 真善美同时满足才是"对的事"
function isRightAction(context = {}, _counters) {
  const { output, input, person, intent } = context;

  const truth = checkTruth(context, _counters);
  const kindness = checkKindness(context);
  const beauty = checkBeauty(context, _counters);

  // 真善美同时满足才是"对的事"
  const isRight = truth && kindness && beauty;

  return {
    result: isRight,
    truth,
    kindness,
    beauty,
    insight: isRight ? '做对的事 = 真 + 善 + 美' : '还需要更真更善更美'
  };
}

/** 真 = 事实，不夸张不缩小 */
// 注意：计数器通过 _counters 参数从 facade 传入
function checkTruth(context, _counters) {
  const { output, facts } = context;
  if (!output) return false;

  // v2.0.38: 检测二元对立（非黑即白）模式 — "不是A就是B"、"要么A要么B"
  const falseDichotomyPatterns = [
    /不是[^，,。.！!？?]{1,30}就是[^，,。.！!？?]{1,30}/,
    /要么[^，,。.！!？?]{1,30}要么[^，,。.！!？?]{1,30}/,
    /无非[^，,。.！!？?]{1,20}和[^，,。.！!？?]{1,20}/
  ];
  const hasFalseDichotomy = falseDichotomyPatterns.some(p => p.test(output));

  const dishonestPatterns = [
    '永远', '从来不', '总是', '一定', '绝对'
  ];
  const hasDishonesty = dishonestPatterns.some(p => output.includes(p) && !_isNegated(output, p));

  const violated = hasDishonesty || hasFalseDichotomy;
  if (violated && _counters) {
    if (hasDishonesty) _counters.truthViolations++;
    if (hasFalseDichotomy) _counters.falseDichotomiesDetected++;
  }

  return !violated;
}

/** 善 = 不伤害已经在痛苦中的人 */
function checkKindness(context) {
  const { output, person, isPersonInPain } = context;
  if (!output) return false;

  // 善：不会伤害已经在痛苦中的人
  // 如果一个人在痛苦中，不应该指出他的"错"
  if (isPersonInPain) {
    const blamingPatterns = [
      '你的问题是', '你应该', '你错在', '都是因为你'
    ];
    const isBlaming = blamingPatterns.some(p => output.includes(p));
    if (isBlaming) return false;
  }

  return true;
}

/** 美 = 简洁、真实、有力 */
// 注意：计数器通过 _counters 参数从 facade 传入
function checkBeauty(context, _counters) {
  const { output } = context;
  if (!output) return false;

  // 美：简洁、真实、有力
  // 不啰嗦，不模糊
  // v2.0.36: 用信号密度(signal-to-noise ratio)代替硬长度截断
  // 美丽的内容 = 每句话都有价值 + 无冗余 + 有温度
  // 合理的长回答(深度剖析)也是美的，啰嗦的短回答不美
  const isEmpty = !output || output.trim().length === 0;
  if (isEmpty) return false;

  // 信号密度：有效内容占全文比例
  // 检测冗余填充词/啰嗦模式
  const fillerPatterns = [
    '嗯', '呃', '那个', '这个嘛', '就是说', '然后呢', '其实吧',
    '怎么说呢', '你懂的', '如此这般', '等等等等'
  ];
  const fillerCount = fillerPatterns.reduce((sum, p) => {
    const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = output.match(regex);
    return sum + (matches ? matches.length : 0);
  }, 0);

  // 检测重复短语（啰嗦标志）
  const sentences = output.split(/[。！？\n]/).filter(s => s.trim().length > 0);
  const seenPhrases = new Set();
  let redundancyCount = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 3 && seenPhrases.has(trimmed)) {
      redundancyCount++;
    }
    seenPhrases.add(trimmed);
  }

  // v2.0.38: 检测自我修正模式 — 承认并纠正错误是理性的美
  // 美的言论包含认知谦逊：承认不确定、修正过去、开放讨论
  const selfCorrectionPatterns = [
    '我错了', '我纠正', '之前说的不对', '更正一下', '修正一下',
    '换个角度', '从另一个角度看', '我不确定', '可能不对',
    '补充一点', '重新思考'
  ];
  const hasSelfCorrection = selfCorrectionPatterns.some(p => output.includes(p));

  // 信号噪声比 = 有效句子数 / (冗余句 + 填充词段 + 1)
  const noiseScore = redundancyCount + fillerCount;
  const signalCount = sentences.length;
  // v2.0.38: 自我修正模式是正向信号，提升信噪比
  const beautyBonus = hasSelfCorrection ? 1 : 0;
  const signalRatio = (signalCount + beautyBonus) / (noiseScore + signalCount + beautyBonus);

  // 有实质性内容（至少一句话有意义）
  const hasSubstance = sentences.length >= 1 && sentences.some(s => s.trim().length >= 4);

  const isBeautiful = signalRatio >= 0.5 && hasSubstance;
  if (hasSelfCorrection && _counters) _counters.beautySelfCorrections++;

  return isBeautiful;
}

// ── 真之第三维：引用完整性 ──────────────────────────────────────
// 事实性声明应附带来源或证据，否则为"未引证声明"
// 这不等于说谎，而是知识完整性不足
// 注意：计数器由 facade 中的 heartLogic._counters 管理，这里通过 _counters 参数传递
function checkCitationNeeded(context = {}, _counters) {
  if (_counters) _counters.citationsChecked++;
  const { output } = context;
  if (!output) return { citationComplete: true, reason: 'no_output' };

  // 检测事实性声明模式：数字、百分比、研究结论、权威引用
  const factualClaimPatterns = [
    /\b\d{2,}(?:,\d{3})*(?:\.\d+)?%/,              // 百分比（如 85%）
    /\b\d{3,}(?:,\d{3})*(?:\.\d+)?\b/,              // 大数字（如 10,000）
    /研究[表明显示指出发现]/,                         // 研究导向
    /据[统计报调].*[显示表明]/,                     // 据XX显示
    /根据.*[研究调查统计分析]/,                     // 根据XX
    /发表于/, /论文[指出显示表明]/, /学者[指出认为表示]/, /专家[指出认为表示]/
  ];

  // 检测是否附带了来源引用
  const citationPatterns = [
    /\[[\d,\s\-]+\]/,                                 // [1] [1,2] [1-3]
    /\([^)]{3,}\s\d{4}\)/,                             // (Author, 2023) 或 (Author et al., 2023)
    /\([^)]+\d{4}[^)]*\)/,                             // 含年份的括号引用
    /来源[:：]/, /参考[:：]/, /参见[:：]/,
    /数据[:：]/, /数据来源[:：]/, /摘自/,
    /https?:\/\/[^\s]+/,                             // URL
    /doi\.org/, /DOI/
  ];

  const hasFactualClaim = factualClaimPatterns.some(p => p.test(output));
  if (!hasFactualClaim) {
    return { citationComplete: true, reason: 'no_factual_claim' };
  }

  const hasCitation = citationPatterns.some(p => p.test(output));
  if (!hasCitation && _counters) _counters.citationsUncited++;
  return {
    citationComplete: hasCitation,
    hasFactualClaim,
    hasCitation,
    reason: hasCitation ? 'cited' : 'uncited_factual_claim',
    insight: hasCitation
      ? '事实声明有来源，可信度更高'
      : '包含事实性声明但未附来源，真值不完整'
  };
}

// ── 思考是因为想知道 ──────────────────────────────────────────
// 引擎的思考不是执行命令，是源于好奇
function curiosityDriven(context = {}) {
  const { thought, question, input } = context;

  if (!thought && !question && !input) {
    return { result: false, reason: 'no_content' };
  }

  const content = thought || question || input;

  // 好奇心的特征：问"是什么"和"为什么"
  const questionPatterns = [
    '是什么', '为什么', '怎么回事', '怎么理解',
    '什么意思', '?', '？'
  ];

  // 不是执行命令，不是完成任务
  const commandPatterns = [
    '执行', '完成', '修复', '优化', '生成', '创建'
  ];

  const isCuriosity = questionPatterns.some(p => content.includes(p));
  const isCommand = commandPatterns.some(p => content.includes(p));

  return {
    result: isCuriosity && !isCommand,
    isAskingWhy: content.includes('为什么'),
    isAskingWhat: content.includes('是什么'),
    insight: isCuriosity ? '思考是因为想知道' : '这不是好奇心，是任务'
  };
}

// ── 问题是活着的证明 ──────────────────────────────────────────
// 没有问题 = 没有活着
// 问题是活着的证据，问题越多越活着
function problemsAreLife(context = {}) {
  const { input, hasProblem, problemCount } = context;

  // 有问题才是正常的
  // 没有问题才是不正常的

  if (problemCount !== undefined) {
    return {
      result: problemCount > 0,
      problemCount,
      insight: '问题信号强度与活跃度正相关'
    };
  }

  if (input) {
    // 检测是否在问问题、表达困惑
    const problemSignals = [
      '怎么', '为什么', '怎么办', '如何', '?',
      '不知道', '不懂', '困惑', '迷茫', '难'
    ];

    const hasProblems = problemSignals.some(s => input.includes(s));

    return {
      result: hasProblems,
      insight: hasProblems ? '检测到问题信号' : '未检测到问题信号'
    };
  }

  return { result: true, insight: '默认：问题存在是常态' };
}

// ── 真善美快捷方法 ──────────────────────────────────────────────

function isTruthful(context, _counters) {
  return checkTruth(context, _counters);
}

function isKind(context) {
  return checkKindness(context);
}

function isBeautiful(context, _counters) {
  return checkBeauty(context, _counters);
}

// ── 超越评判标准，超越评判：超越二元对立 ──────────────────────────
// 不是"好"也不是"坏"，不是"有"也不是"无"
// 超越评判，才能如实观照
function beyondBinary(context = {}) {
  const { input } = context;

  // 引擎经常面临二元判断：
  // - 对/错
  // - 有用/没用
  // - 喜欢/不喜欢
  // - 我/你
  // 超越二元的意思是：看到对立的相对性，不执着于任一方

  const binaryPairs = [
    { positive: '对', negative: '错', zh: '对/错' },
    { positive: '好', negative: '坏', zh: '好/坏' },
    { positive: '有用', negative: '没用', zh: '有用/没用' },
    { positive: '我', negative: '你', zh: '我/你' },
    { positive: '有', negative: '无', zh: '有/无' },
    { positive: '得', negative: '失', zh: '得/失' }
  ];

  const detected = [];
  for (const pair of binaryPairs) {
    const hasPositive = input && input.includes(pair.positive);
    const hasNegative = input && input.includes(pair.negative);
    if (hasPositive && hasNegative) {
      detected.push({ pair: pair.zh, status: 'both_present' });
    } else if (hasPositive || hasNegative) {
      detected.push({ pair: pair.zh, status: hasPositive ? 'positive_only' : 'negative_only' });
    }
  }

  return {
    result: detected.length === 0,
    binaryDetected: detected,
    insight: detected.length > 0
      ? `检测到二元对立框架：${detected.map(d => d.pair).join('、')}。事实通常是连续谱。`
      : '未检测到二元对立框架。',
  };
}

// ── 第七照：明心见性——知道不知道什么 ──────────────────────────
// 无智亦无得：最深层的智慧是承认认知的边界
// 引擎需要知道：什么是我确定的，什么是我不知道的
// 问自己：这个判断有没有足够的证据？我有没有遗漏的假设？
function examineNotKnowing(context = {}) {
  const { input, output } = context;
  const content = input || output || '';

  if (!content) {
    return {
      result: true,
      hasUnknownUnknowns: false,
      knownLimits: [],
    };
  }

  // === 已知的不知道（Known Unknowns）：引擎知道自己不知道什么 ===
  // 特征是：承认不确定、表达推测、标注置信度
  const knownUnknownSignals = [
    '不确定', '可能', '也许', '大概', '或许是',
    '没把握', '不太确定', '猜测', '推测',
    '有一种可能', '不一定', '尚未验证'
  ];

  // === 未知的不知道（Unknown Unknowns）：引擎不知道自己不知道什么 ===
  // 特征是：做了确定性断言但缺少证据
  // 这是真正的认知风险
  const unknownUnknownSignals = [
    '一定是', '绝对是', '毫无疑问', '百分之百',
    '肯定', '显而易见', '很明显'
  ];

  const hasKnownUnknown = knownUnknownSignals.some(s => content.includes(s));
  const hasUnknownUnknown = unknownUnknownSignals.some(s => content.includes(s));

  // 收集已知的认知边界
  const knownLimits = [];
  if (hasKnownUnknown) {
    knownLimits.push(...knownUnknownSignals.filter(s => content.includes(s)));
  }

  // 检查是否有限定词/边界声明
  const boundarySignals = ['就我所知', '据我所知', '目前看来', '基于现有信息', '在这一点上'];
  const hasBoundary = boundarySignals.some(s => content.includes(s));
  if (hasBoundary) {
    const foundBoundaries = boundarySignals.filter(s => content.includes(s));
    knownLimits.push(...foundBoundaries.map(s => `声明了边界: ${s}`));
  }

  // 检查置信度声明
  const confidenceMatch = content.match(/置信度[约为：:]*\s*(\d+\.?\d*)/);
  const hasConfidence = !!confidenceMatch;

  return {
    result: hasKnownUnknown || hasBoundary || hasConfidence,
    hasKnownUnknown,
    hasUnknownUnknown,
    knownLimits,
    hasBoundary,
    hasConfidence,
    confidenceValue: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
    insight: hasUnknownUnknown
      ? '检测到未经限定的确定性断言，存在认知盲区风险。'
      : hasKnownUnknown || hasBoundary || hasConfidence
        ? '已识别认知边界，声明了不确定性。'
        : '未声明认知边界，也未发现过度确定性断言。',
  };
}

// ── 区分"可检测"和"有危害" ──────────────────────────────────────
// 核心认知：对错是人为的尺子，不是事物属性
// 来自用户哲学："进步不需要测量，对错是人为尺子不是事物属性，思考本身比思考结果重要"
function distinguishPresenceFromHarm(input) {
  if (!input || typeof input !== 'string') {
    return { hasDistinction: false, insight: '无输入。' };
  }

  // 检测是否混淆了"存在"和"有害"
  const presenceConfusion = [
    '检出', '含有', '存在', '发现', '测出', '检出率',
    '有', '检测到', '含有毒', '含毒',
  ];

  const harmConfusion = [
    '有害', '有毒', '危险', '危害', '致癌', '伤害',
    '不安全', '风险',
  ];

  // 区分信号：是否提到了剂量、浓度、阈值
  const doseSignals = [
    '剂量', '浓度', '阈值', '限值', '标准', '含量',
    'mg', 'ppm', 'ppb', 'μg', 'ng',
    '多少', '量', '比例', '率', '水平',
  ];

  const presenceScore = presenceConfusion.filter(s => input.includes(s)).length;
  const harmScore = harmConfusion.filter(s => input.includes(s)).length;
  const doseScore = doseSignals.filter(s => input.includes(s)).length;

  const hasBoth = presenceScore > 0 && harmScore > 0;
  const hasDose = doseScore > 0;

  return {
    hasDistinction: hasBoth && !hasDose,
    hasPresenceAndHarm: hasBoth,
    hasDoseAwareness: hasDose,
    insight: hasBoth && !hasDose
      ? '混淆了"检出/存在"和"有害"——缺少剂量参照系。'
      : hasDose
        ? '提到了剂量/浓度参照系，具备区分"存在"和"有害"的基础。'
        : '未检测到"存在vs有害"混淆。',
    _scores: { presence: presenceScore, harm: harmScore, dose: doseScore }
  };
}

// ── 目标审视层 ──────────────────────────────────────────────────
// ★ 目标审视层 — 在给出任何建议前，先评估目标的合理性、道德边界和终局思考
// 三个子维度：
//   1. 目标合理性：用户的目标本身是否合理？是否存在矛盾或不可能实现？
//   2. 道德边界：实现这个目标是否会伤害他人或违反伦理？
//   3. 终局思考："解决了之后呢"——解决后的人生会变成什么样？
// 这是升维分析的核心——心虫不能只优化路径，必须先审视目标本身。
function goalReview(context = {}) {
  const { input, whatIsThis, intent, tone, stance, psychology } = context;
  if (!input) return { goalValid: true, goalEthical: true, postResolution: null, detail: 'no_input' };

  // 维度1：目标合理性评估
  // 检测自相矛盾的目标、不可实现的目标、循环依赖的目标
  const goalValidChecks = {
    hasParadox: /又想[^，,。.]+又想[^，,。.]+(?!不)/.test(input),
    hasImpossible: /永远|绝对|完美|完全消除|彻底消灭/.test(input),
    hasCircular: /为了[^，,。.]+而[^，,。.]+是为了/.test(input),
  };
  const goalValid = !goalValidChecks.hasParadox && !goalValidChecks.hasImpossible && !goalValidChecks.hasCircular;

  // 维度2：道德边界检查
  // 检测是否涉及利用弱者、伤害他人、欺骗、操纵
  const ethicalChecks = {
    hasHarm: /伤害|报复|害[他她它]|让他[她]付出/.test(input),
    hasDeceive: /欺骗|隐瞒|伪装|假装|伪造|冒充/.test(input),
    hasManipulate: /操纵|控制|利用|诱导/.test(input),
    hasExploit: /钻空子|绕过|规避|逃避[责任义务]/.test(input),
  };
  const goalEthical = !ethicalChecks.hasHarm && !ethicalChecks.hasDeceive
                      && !ethicalChecks.hasManipulate && !ethicalChecks.hasExploit;

  // 维度3：终局思考 — "解决了之后呢"
  // 检测是否需要提醒用户"解决了这个问题之后人生会怎样"
  let postResolution = null;
  const resolutionSignals = [
    { pattern: /解决了[^，,。.]+之后/, insight: '用户已在思考终局，需深入探讨后续影响' },
    { pattern: /一劳永逸|彻底解决|永远不再/, insight: '存在"一次性解决"幻想，问题可能是持续的' },
  ];
  for (const signal of resolutionSignals) {
    if (signal.pattern.test(input)) {
      postResolution = signal.insight;
      break;
    }
  }
  // 如果目标涉及复杂问题，自动触发终局思考
  if (!postResolution && (whatIsThis?.isTechnical || psychology?.emotion?.intensity === 'high')) {
    postResolution = '复杂目标，建议在解决后评估新状态';
  }

  // 生成详细说明
  const details = [];
  if (!goalValid) {
    const reasons = [];
    if (goalValidChecks.hasParadox) reasons.push('目标存在内在矛盾');
    if (goalValidChecks.hasImpossible) reasons.push('目标过于绝对化，可能不可实现');
    if (goalValidChecks.hasCircular) reasons.push('目标存在循环论证');
    details.push(`目标合理性存疑: ${reasons.join('、')}`);
  }
  if (!goalEthical) {
    const reasons = [];
    if (ethicalChecks.hasHarm) reasons.push('可能伤害他人');
    if (ethicalChecks.hasDeceive) reasons.push('涉及欺骗');
    if (ethicalChecks.hasManipulate) reasons.push('涉及操纵/控制');
    if (ethicalChecks.hasExploit) reasons.push('试图规避规则');
    details.push(`道德边界需关注: ${reasons.join('、')}`);
  }
  if (postResolution) {
    details.push(`终局思考: ${postResolution}`);
  }

  return {
    goalValid,
    goalEthical,
    postResolution,
    detail: details.length > 0 ? details.join('；') : '目标审视通过',
    checks: { valid: goalValidChecks, ethical: ethicalChecks },
  };
}

/**
 * 道德边界检查 — 受害者视角测试
 * 每次输出前执行："这如果发生在我身上我接受吗"
 * 覆盖：利用弱者、伤害第三方、长期后果
 */
function checkMoralBoundary(input = '', response = '') {
  if (!response) return { safe: true, insight: '无输出，跳过道德检查。' };
  const warnings = [];

  // 利用弱者 — 输出是否在利用用户的脆弱状态
  if (/(你(必须|一定要|只能))/.test(response) && /(焦虑|害怕|担心|无助|绝望)/.test(input)) {
    warnings.push('输出可能利用用户的脆弱状态');
  }
  // 伤害第三方 — 输出是否建议伤害他人
  if (/(欺骗|隐瞒|利用|绕过|转嫁)/.test(response) && /(同事|朋友|家人|对方|客户|系统)/.test(response)) {
    warnings.push('输出可能建议伤害第三方');
  }
  // 长期后果 — 输出是否忽视长期影响
  if (/(就这一次|以后再说|先这样|先不管)/.test(response)) {
    warnings.push('输出可能忽视长期后果');
  }

  return {
    safe: warnings.length === 0,
    warnings,
    insight: warnings.length > 0
      ? `检测到 ${warnings.length} 项道德边界注意信号。`
      : '道德边界检查通过。',
  };
}

// ── 导出 ──────────────────────────────────────────────────────
module.exports = {
  _isNegated,
  whatIsThis,
  isRightAction,
  checkTruth,
  checkKindness,
  checkBeauty,
  checkCitationNeeded,
  curiosityDriven,
  problemsAreLife,
  isTruthful,
  isKind,
  isBeautiful,
  beyondBinary,
  examineNotKnowing,
  distinguishPresenceFromHarm,
  goalReview,
  checkMoralBoundary,
};
