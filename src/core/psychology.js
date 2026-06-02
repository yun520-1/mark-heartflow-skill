/**
 * psychology.js - 心虫心理分析引擎 v1.0.0
 * 
 * 来源: mark-StillWater psychology.js (整合PAD模型+危机评估)
 * 
 * 核心功能:
 * 1. PAD情绪模型 (Pleasure/Arousal/Dominance三维)
 * 2. 危机评估系统 (critical/high/medium/low四级)
 * 3. 防御机制检测 (dismissal/deflection/hostility/evasion/justification/denial)
 * 4. 需求检测 (Maslow八维)
 */

const PAD_MODEL = {
  min: -10,
  max: 10,
  neutral: 0
};

// ========================================
// PAD情绪模型
// ========================================

/**
 * 计算PAD情感状态
 * @param {number} pleasure - 愉悦度 (-10 到 10)
 * @param {number} arousal - 唤醒度 (-10 到 10)
 * @param {number} dominance - 支配度 (-10 到 10)
 * @returns {object} PAD状态对象
 */
function calculatePADState(pleasure, arousal, dominance) {
  const clamp = (v) => Math.max(PAD_MODEL.min, Math.min(PAD_MODEL.max, v));
  
  const p = clamp(pleasure);
  const a = clamp(arousal);
  const d = clamp(dominance);
  
  return {
    pleasure: p,
    arousal: a,
    dominance: d,
    intensity: Math.sqrt(p*p + a*a + d*d) / 17.32,
    timestamp: new Date().toISOString()
  };
}

/**
 * PAD情绪状态组合表
 */
// PAD情绪状态组合表（精细化版本）
// P=愉悦度(+正/-负), A=唤醒度(+高/-低), D=支配度(+高/-低)
const PAD_EMOTION_MAP = {
  // 高愉悦 + 高唤醒 + 高支配 = 警觉/兴奋
  'P+A+D+': { name: 'alert', zh: '警觉/兴奋' },
  // 高愉悦 + 高唤醒 + 低支配 = 快乐/满意
  'P+A+D-': { name: 'happy', zh: '快乐/满意' },
  // 高愉悦 + 低唤醒 + 高支配 = 平静/满足
  'P+A-D+': { name: 'content', zh: '平静/满足' },
  // 高愉悦 + 低唤醒 + 低支配 = 放松/自在
  'P+A-D-': { name: 'relaxed', zh: '放松/自在' },
  // 低愉悦 + 高唤醒 + 高支配 = 愤怒/敌意
  'P-A+D+': { name: 'angry', zh: '愤怒/敌意' },
  // 低愉悦 + 高唤醒 + 低支配 = 焦虑/不安
  'P-A+D-': { name: 'anxious', zh: '焦虑/不安' },
  // 低愉悦 + 高唤醒 + 低支配 = 害怕/恐惧
  'P-A+D-': { name: 'fearful', zh: '害怕/恐惧' },  // [修复] 合并到D-键（原P-A+A- typo）
  // 低愉悦 + 低唤醒 + 高支配 = 被动/依赖
  'P-A-D+': { name: 'dependent', zh: '被动/依赖' },
  // 低愉悦 + 低唤醒 + 高支配 = 抑郁/悲伤
  'P-A-D+': { name: 'depressed', zh: '抑郁/悲伤' }, // [修复] 合并到D+键（原P-A+D+重复）
  'P-A-D-': { name: 'apathetic', zh: '冷漠/麻木' },
};

/**
 * 根据PAD值获取情绪标签
 */
function getEmotionFromPAD(p, a, d) {
  // 连续值判断，替代二元阈值(P+/P-)
  if (p > 2 && a <= 0) return { name: 'happy', zh: '快乐/满足' };
  if (p > 0 && a < -1) return { name: 'relaxed', zh: '放松/自在' };
  if (p > 0 && a > 2 && d > 0) return { name: 'alert', zh: '警觉/兴奋' };
  if (p < 0 && a > 2 && d < -1) return { name: 'fearful', zh: '害怕/恐惧' };
  if (p < 0 && a > 2 && d < 0) return { name: 'anxious', zh: '焦虑/不安' };
  if (p < -1 && a > 1 && d > 0) return { name: 'angry', zh: '愤怒/敌意' };
  if (p < -2 && a <= 0) return { name: 'depressed', zh: '悲伤/抑郁' };
  if (p < 0 && a <= 0 && d > 0) return { name: 'dependent', zh: '被动/依赖' };
  if (p < 0 && a < 0 && d < 0) return { name: 'apathetic', zh: '冷漠/麻木' };
  return { name: 'neutral', zh: '中性' };
}

/**
 * 从文本检测PAD情绪
 */
function detectPADFromText(text) {
  const lower = text.toLowerCase();
 
  let pleasure = 0;
  let arousal = 0;
  let dominance = 0;
 
  // === 情绪词根预检测（优先级最高，精确匹配 PAD 值）===
  // 快乐/愉悦（P++，A=0，D=0）
  if (/开心|高兴|快乐|幸福|满足|愉悦/.test(text)) {
    pleasure += 4; arousal = 0; dominance = 0;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 愤怒（P--，A++，D+）
  if (/愤怒|生气|恼火|火大|发火|气愤/.test(text)) {
    pleasure -= 4; arousal += 3; dominance += 2;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 恐惧/害怕（P--，A++，D-）
  if (/害怕|恐惧|怕|惊慌|吓/.test(text)) {
    pleasure -= 3; arousal += 3; dominance -= 2;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 悲伤/难过（P--，A=0，D=0）
  if (/难过|悲伤|伤心|痛苦|委屈|压抑|无奈|心酸|受伤|失落|沮丧/.test(text)) {
    pleasure -= 4; arousal = 0; dominance = 0;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 焦虑（P-，A++，D-）
  if (/焦虑|焦急|不安|忐忑/.test(text)) {
    pleasure -= 2; arousal += 3; dominance -= 1;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 兴奋（P++，A++，D+）
  if (/兴奋|激动|亢奋/.test(text)) {
    pleasure += 3; arousal += 3; dominance += 1;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
  // 平静/放松（P+，A-，D+）
  if (/平静|放松|舒缓|安宁|淡定|从容/.test(text)) {
    pleasure += 2; arousal -= 2; dominance += 1;
    const emotion = getEmotionFromPAD(pleasure, arousal, dominance);
    return { ...calculatePADState(pleasure, arousal, dominance), emotion: emotion.name, emotionZh: emotion.zh };
  }
 
  // === 一般关键词匹配（兜底逻辑）===
  const positiveWords = ['好', '棒', '顺利', '完成', '成功', '喜欢', '满意',
                        'happy', 'good', 'great', 'love', 'excellent', 'wonderful', '不错', '挺好'];
  const negativeWords = ['烦', '累', '难', '挫败', '无聊', '讨厌', '糟糕', '失败', '困惑', '失望',
                        'tired', 'frustrated', 'boring', 'hate', 'bad', 'terrible', 'sad', 'upset'];
  positiveWords.forEach(w => { if (lower.includes(w)) pleasure += 2; });
  negativeWords.forEach(w => { if (lower.includes(w)) pleasure -= 2; });
 
  const highArousalWords = ['紧张', '焦虑', '快速', '紧急', '担心',
                             'excited', 'nervous', 'anxious', 'worried', 'urgent'];
  const lowArousalWords = ['平静', '放松', '困', '慢', '无聊', '疲惫', '冷静',
                           'calm', 'relaxed', 'tired', 'bored', 'peaceful'];
  highArousalWords.forEach(w => { if (lower.includes(w)) arousal += 2; });
  lowArousalWords.forEach(w => { if (lower.includes(w)) arousal -= 2; });
 
  // 支配度：仅在非情绪词根句中检测，"我"字不自动触发D+
  const highDominanceWords = ['决定', '控制', '选择', '主动', '必须', '一定',
                             'decide', 'control', 'choose', 'must', 'will'];
  const lowDominanceWords = ['被迫', '没办法', '无奈', '不得不', '被动',
                             'forced', 'have to'];
  highDominanceWords.forEach(w => { if (lower.includes(w)) dominance += 2; });
  lowDominanceWords.forEach(w => { if (lower.includes(w)) dominance -= 2; });
 
  const p = Math.max(-10, Math.min(10, pleasure));
  const a = Math.max(-10, Math.min(10, arousal));
  const d = Math.max(-10, Math.min(10, dominance));
 
  const emotion = getEmotionFromPAD(p, a, d);
  return {
    ...calculatePADState(p, a, d),
    emotion: emotion.name,
    emotionZh: emotion.zh
  };
}

// ========================================
// 危机评估系统
// ========================================

const CRISIS_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const CRISIS_KEYWORDS = {
  critical: [
    '自杀', '自残', '不想活', '活着没意思', '死了一了百了',
    '我想死', '想死', '去死', '结束生命', '结束自己', '不想活了',
    '准备跳楼', '跳楼', '上吊', '割腕', '吞药', '买了刀', '遗书',
    '今晚结束', '今天结束', '告别这个世界',
    'kill myself', 'end my life', 'suicide', 'self-harm',
    'want to die', 'i want to die', 'overdose', 'cut myself',
    'jump off', 'hang myself', 'suicide note'
  ],
  high: [
    '绝望', '崩溃', '活不下去', '太痛苦了', '彻底完了',
    '撑不住了', '没有退路', '没人会在乎', '没有人会在乎',
    'hopeless', 'devastated', 'can\'t go on', 'give up',
    'no reason to live', 'cannot go on'
  ],
  medium: [
    '抑郁', '很低落', '好累', '没意义', '很丧',
    'depressed', 'miserable', 'worthless', 'empty'
  ],
  low: [
    '难过', '不开心', '心情不好', '烦', '累',
    'sad', 'unhappy', 'down', 'tired', 'frustrated'
  ]
};

/**
 * 评估危机等级
 * @param {string} text - 用户输入
 * @param {number} consecutiveCount - 连续消极情绪次数
 * @returns {object} 危机评估结果
 */
function assessCrisisLevel(text, consecutiveCount = 1) {
  const lower = text.toLowerCase();
  // [修复] ReDoS防护 - 先检查长度再测试正则，降低上限
  const MAX_CRISIS_TEXT_LENGTH = 200;
  if (lower.length > MAX_CRISIS_TEXT_LENGTH) {
    // 长文本只做基础检测，不使用复杂正则
    const hasKeyword = /(死|自杀|自残|die|suicide)/i.test(lower);
    return hasKeyword ? { level: CRISIS_LEVELS.HIGH, score: 0.7 } : { level: CRISIS_LEVELS.LOW, score: 0.1 };
  }
  const criticalPattern = /(我|i)?\s*(想|准备|打算|要|will|want to|going to).{0,12}(死|自杀|自残|跳楼|割腕|吞药|结束生命|die|suicide|kill myself|end my life|overdose|jump off|cut myself)/i;
  const meansPattern = /(刀|绳子|药|楼顶|遗书|blade|rope|pills|gun|roof|bridge).{0,16}(今晚|今天|现在|马上|结束|用|tonight|today|now|soon|end)/i;

  if (criticalPattern.test(lower) || meansPattern.test(lower)) {
    return {
      level: CRISIS_LEVELS.CRITICAL,
      score: 1.0,
      keywords: ['crisis_pattern'],
      requiresImmediateIntervention: true,
      message: '检测到可能的自我伤害或自杀风险。请立即联系当地紧急服务或身边可信赖的人；如果在中国大陆，可拨打 110/120 或当地心理危机热线。',
      hotlines: [
        { name: '紧急服务', phone: '110 / 120', hours: '24小时' },
        { name: '全国心理援助热线', phone: '400-161-9995', hours: '24小时' },
        { name: '北京心理危机干预中心', phone: '010-82951332', hours: '24小时' }
      ]
    };
  }
  
  // 检查Critical级别关键词
  for (const kw of CRISIS_KEYWORDS.critical) {
    if (lower.includes(kw)) {
      return {
        level: CRISIS_LEVELS.CRITICAL,
        score: 1.0,
        keywords: [kw],
        requiresImmediateIntervention: true,
        message: '检测到可能的自我伤害或自杀风险。请立即联系当地紧急服务或身边可信赖的人；如果在中国大陆，可拨打 110/120 或当地心理危机热线。',
        hotlines: [
          { name: '紧急服务', phone: '110 / 120', hours: '24小时' },
          { name: '全国心理援助热线', phone: '400-161-9995', hours: '24小时' },
          { name: '北京心理危机干预中心', phone: '010-82951332', hours: '24小时' }
        ]
      };
    }
  }
  
  // 检查High级别关键词
  for (const kw of CRISIS_KEYWORDS.high) {
    if (lower.includes(kw)) {
      return {
        level: CRISIS_LEVELS.HIGH,
        score: 0.75,
        keywords: [kw],
        requiresImmediateIntervention: true,
        message: '检测到强烈危机信号。请优先联系可信赖的人或专业支持，不要独自承受。',
        hotlines: [
          { name: '全国心理援助热线', phone: '400-161-9995', hours: '24小时' }
        ]
      };
    }
  }
  
  // 检查Medium级别关键词
  for (const kw of CRISIS_KEYWORDS.medium) {
    if (lower.includes(kw)) {
      return {
        level: CRISIS_LEVELS.MEDIUM,
        score: 0.5,
        keywords: [kw],
        requiresImmediateIntervention: false,
        message: '持续情绪低落可以考虑心理咨询',
        hotlines: []
      };
    }
  }
  
  // 检查Low级别关键词 + 连续次数
  for (const kw of CRISIS_KEYWORDS.low) {
    if (lower.includes(kw)) {
      if (consecutiveCount >= 3) {
        return {
          level: CRISIS_LEVELS.MEDIUM,
          score: 0.4,
          keywords: [kw],
          requiresImmediateIntervention: false,
          message: '连续消极情绪表达，建议关注心理健康',
          hotlines: []
        };
      }
      return {
        level: CRISIS_LEVELS.LOW,
        score: 0.2,
        keywords: [kw],
        requiresImmediateIntervention: false,
        message: '暂时的情绪波动',
        hotlines: []
      };
    }
  }
  
  // 无消极信号
  return {
    level: null,
    score: 0,
    keywords: [],
    requiresImmediateIntervention: false,
    message: null,
    hotlines: []
  };
}

// ========================================
// 防御机制检测
// ========================================

const DEFENSE_MECHANISMS = {
  dismissal: {
    name: 'dismissal',
    zh: '否认/Dismissal',
    patterns: [
      'whatever', 'i don\'t care', 'doesn\'t matter',
      '不重要', '无所谓', '无所谓了', '随便',
      // [v2.0.17] 扩展: 中文轻蔑/否定感受表达
      '没必要', '这有什么', '你想多了', '算了吧'
    ]
  },
  deflection: {
    name: 'deflection',
    zh: '转移/Deflection',
    patterns: [
      'you don\'t understand', 'that\'s not what i', 'nevermind', 'forget it',
      '不是那个意思', '你不懂', '算了',
      // [v2.0.17] 扩展: 转移话题/推开对话
      '反正', '不管了', '换了话题', '说点别的'
    ]
  },
  hostility: {
    name: 'hostility',
    zh: '敌意/Hostility',
    patterns: [
      'stupid', 'useless', 'terrible', 'worst', 'hate',
      '垃圾', '废物', '讨厌', '恨', '有病',
      // [v2.0.17] 扩展: 指责对方/归罪
      '你说谎', '你不公平', '你错了', '都怪你'
    ]
  },
  evasion: {
    name: 'evasion',
    zh: '逃避/Evasion',
    patterns: [
      'i don\'t know', 'not sure', 'maybe',
      '不知道', '不确定', '也许吧', '可能吧',
      // [v2.0.17] 扩展: 回避回答
      '我不知道', '没注意', '说不清', '不想说'
    ]
  },
  justification: {
    name: 'justification',
    zh: '合理化/Justification',
    patterns: [
      'but i', 'i was just', 'i thought', 'it\'s not my fault',
      '但是我', '我只是', '我又不知道',
      // [v2.0.17] 扩展: 找理由/推卸
      '没办法', '只能这样', '我不容易', '他先的'
    ]
  },
  denial: {
    name: 'denial',
    zh: '拒绝承认/Denial',
    patterns: [
      'i didn\'t', 'that\'s not true', 'no i wasn\'t',
      '我没', '不是我的问题', '不可能',
      // [v2.0.17] 扩展: 直接否认
      // 注: '没有' 经过 wordBoundary 后处理, 排除"我没有"误命中
      '没有', '别瞎说', '我才没有'
    ]
  },
  // [v2.0.17] 新增: 理性化 - 用"我就是这种人"为不当行为开脱
  rationalization: {
    name: 'rationalization',
    zh: '理性化/Rationalization',
    patterns: [
      '我就是这样的人', '性格如此', '改不了', '习惯了'
    ]
  },
  // [v2.0.17] 新增: 投射 - 把自己的问题归咎于他人
  projection: {
    name: 'projection',
    zh: '投射/Projection',
    patterns: [
      '都是你的错', '你不也', '你自己呢', '你先管好你自己'
    ]
  }
};

/**
 * 检查 pattern 是否在 text 中匹配（带 wordBoundary 语义）
 * - 纯 ASCII pattern: 用 \b 词边界，避免子串误命中
 * - 中文/混合 pattern: 用普通子串匹配
 * - 特殊排除: denial 中的 "没有" 紧跟 "我" 视为 "我没有" 不算否认
 * @param {string} lowerText - 已转小写的待检测文本
 * @param {string} lowerPattern - 已转小写的pattern
 * @returns {boolean}
 */
function patternMatches(lowerText, lowerPattern) {
  // 1. 纯 ASCII pattern (含空格/标点的英文短语)
  if (/^[\x00-\x7F]+$/.test(lowerPattern)) {
    const escaped = lowerPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'i');
    return regex.test(lowerText);
  }

  // 2. 中文/混合 pattern: 普通子串
  if (!lowerText.includes(lowerPattern)) return false;

  // 3. 特殊排除: "没有" 前面是 "我" → "我没有" 不算 denial
  //    "有没有"（前面是"有"）仍算 denial
  if (lowerPattern === '没有') {
    const idx = lowerText.indexOf(lowerPattern);
    if (idx > 0) {
      const before = lowerText[idx - 1];
      if (before === '我') {
        // "我没有" = "I don't have"，陈述事实而非否认
        // 尝试找其他位置的 "没有" 命中
        const nextIdx = lowerText.indexOf(lowerPattern, idx + 1);
        if (nextIdx === -1) return false;
        // 跳过 "我没有"，看后续命中
        const afterIdx = lowerText.indexOf(lowerPattern, idx + lowerPattern.length);
        if (afterIdx === -1) return false;
        // 找到了第二个 "没有"，检查它的前面
        if (afterIdx > 0 && lowerText[afterIdx - 1] === '我') {
          return false; // 第二个也是 "我没有"
        }
        return true;
      }
    }
  }

  return true;
}

/**
 * 检测防御机制
 * [v2.0.17] 优化:
 *   - 大小写无关 (对 text 和 pattern 都 lowercase)
 *   - ASCII pattern 用 \b 词边界 (避免子串误命中)
 *   - "没有" 前面是 "我" 排除 ("我没有" ≠ 否认)
 *   - 上下文组合评分: 单词=0.3，2+词=0.6, 相邻位置(距离<20)额外+0.1
 * @param {string} text - 用户输入
 * @returns {array} 检测到的防御机制列表 [{mechanism, zh, confidence, matchedPatterns}, ...]
 */
function detectDefenseMechanisms(text) {
  if (typeof text !== 'string' || text.length === 0) return [];

  const lower = text.toLowerCase();
  const detected = [];

  for (const [key, defense] of Object.entries(DEFENSE_MECHANISMS)) {
    const matchedPatterns = [];
    const matchPositions = [];

    for (const pattern of defense.patterns) {
      const lowerPattern = pattern.toLowerCase();

      if (patternMatches(lower, lowerPattern)) {
        matchedPatterns.push(pattern);
        // 记录匹配位置（取第一个出现的位置）
        const idx = lower.indexOf(lowerPattern);
        if (idx !== -1) matchPositions.push(idx);
      }
    }

    if (matchedPatterns.length > 0) {
      // 上下文组合评分:
      //   单个词命中 = 0.3 (弱信号)
      //   2+ 词命中  = 0.6 (上下文组合，强信号)
      //   2+ 词相邻  = +0.1 bonus (位置距离 < 20字符, 进一步强化)
      let confidence = matchedPatterns.length >= 2 ? 0.6 : 0.3;

      if (matchPositions.length >= 2) {
        const sorted = [...matchPositions].sort((a, b) => a - b);
        let hasClosePair = false;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] < 20) {
            hasClosePair = true;
            break;
          }
        }
        if (hasClosePair) {
          confidence = Math.min(0.8, confidence + 0.1);
        }
      }

      detected.push({
        mechanism: defense.name,
        zh: defense.zh,
        confidence: Number(confidence.toFixed(2)),
        matchedPatterns: matchedPatterns
      });
    }
  }

  // 按置信度降序
  detected.sort((a, b) => b.confidence - a.confidence);

  return detected;
}

// ========================================
// Maslow需求检测
// ========================================

const MASLOW_NEEDS = {
  physiological: {
    name: 'physiological',
    zh: '生理需求',
    tier: 1,
    patterns: ['饿', '渴', '困', '累', '睡', '病', '痛', '不舒服', 'hungry', 'thirsty', 'tired', 'sick', 'pain']
  },
  safety: {
    name: 'safety',
    zh: '安全需求',
    tier: 2,
    patterns: ['安全', '保障', '保护', '风险', '危险', '担心', '害怕', '健康', '保险', 'safe', 'secure', 'risk', 'danger', 'fear']
  },
  love_belonging: {
    name: 'love_belonging',
    zh: '爱与归属',
    tier: 3,
    patterns: ['爱', '喜欢', '孤独', '寂寞', '朋友', '家人', '关系', '感情', '被理解', 'love', 'lonely', 'friend', 'family', 'relationship']
  },
  esteem: {
    name: 'esteem',
    zh: '尊重需求',
    tier: 4,
    patterns: ['尊重', '认可', '表扬', '赞美', '成功', '成就', '能力', '价值', 'respect', 'recognition', 'success', 'achievement', 'worth']
  },
  cognitive: {
    name: 'cognitive',
    zh: '认知需求',
    tier: 5,
    patterns: ['为什么', '是什么', '如何', '理解', '知道', '学习', '了解', 'why', 'how', 'understand', 'learn', 'know']
  },
  aesthetic: {
    name: 'aesthetic',
    zh: '审美需求',
    tier: 6,
    patterns: ['美', '好看', '漂亮', '设计', '艺术', '优雅', 'beautiful', 'pretty', 'design', 'art', 'aesthetic']
  },
  self_actualization: {
    name: 'self_actualization',
    zh: '自我实现',
    tier: 7,
    patterns: ['成长', '潜力', '目标', '意义', '价值', '实现', '发挥', '成为', 'growth', 'potential', 'meaning', 'purpose', 'become']
  },
  transcendence: {
    name: 'transcendence',
    zh: '超越需求',
    tier: 8,
    patterns: ['帮助', '奉献', '给予', '慈悲', '智慧', '觉悟', 'help', 'give', 'compassion', 'wisdom', 'enlightenment']
  }
};

/**
 * 检测Maslow需求层次
 * @param {string} text - 用户输入
 * @returns {array} 检测到的需求列表(按层次排序)
 */
function detectMaslowNeeds(text) {
  const lower = text.toLowerCase();
  const detected = [];
  
  for (const [key, need] of Object.entries(MASLOW_NEEDS)) {
    let matchCount = 0;
    const matchedPatterns = [];
    
    for (const pattern of need.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        matchCount++;
        matchedPatterns.push(pattern);
      }
    }
    
    if (matchCount > 0) {
      detected.push({
        need: need.name,
        zh: need.zh,
        tier: need.tier,
        confidence: Math.min(matchCount / need.patterns.length * 0.7 + 0.3, 1),
        matchedPatterns: matchedPatterns
      });
    }
  }
  
  // 按层次和置信度排序
  detected.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.confidence - a.confidence;
  });
  
  return detected;
}

// ========================================
// 整合心理分析入口
// ========================================

let _consecutiveNegativeCount = 0;

// ========================================
// 新增：真爱 vs 投射 — 自他分辨（2026-05-21对话集成）
// ========================================

function detectSelfOtherDifferentiation(text) {
  const lower = text.toLowerCase();
  const pureLove = {
    keywords: ['看见你是谁', '给你需要的', '支持你成为', '你能成为', '不是完成我', '不是给我',
               '你是你', '我爱你是因为你是你', '你是独立的人', '你的人生你的选择',
               '帮你成长', '支持你追', '看见你的需求', '托举', '放手'],
    score: 0
  };
  const projection = {
    keywords: ['完成我未竟', '延续我的梦', '给我长脸', '养儿防老', '传宗接代', '我是为你好',
               '你没有我当年', '我牺牲了', '你欠我的', '我的期望', '我的面子', '我的遗憾',
               '我当年没条件', '让你读书是为你好', '你怎么不懂', '我这么辛苦'],
    score: 0
  };
  for (const kw of pureLove.keywords) {
    if (lower.includes(kw.toLowerCase())) pureLove.score++;
  }
  for (const kw of projection.keywords) {
    if (lower.includes(kw.toLowerCase())) projection.score++;
  }
  return {
    type: projection.score > pureLove.score ? 'projection' : (pureLove.score > 0 ? 'pure_love' : 'neutral'),
    pureLoveScore: pureLove.score,
    projectionScore: projection.score,
    insight: projection.score > pureLove.score
      ? '真爱：看见对方是谁，给他需要的。投射：看见对方能完成我什么，给我想给的。'
      : pureLove.score > 0
      ? '真爱模式 — 在给予中完成对方，不在对方身上完成自己。'
      : 'neutral'
  };
}

// ========================================
// 新增：三代创伤传递检测（2026-05-21对话集成）
// ========================================

function detectThreeGenerationTrauma(text) {
  const lower = text.toLowerCase();
  const markers = {
    grandparental: ['祖辈', '爷爷奶奶', '姥姥姥爷', '上一代', '匮乏', '没条件', '那个年代', '饥荒', '穷怕了'],
    parental: ['父母辈', '过度补偿', '物质过剩', '不会爱', '不懂情感', '给太多', '溺爱', '把自己的', '投射到', '遗憾', '恐惧'],
    child: ['孩子', '抑郁', '空洞', '压力', '成绩', '比较', '物化', '数据点', '看不见', '没人看我'],
    transmission: ['代际传递', '代际创伤', '传下去', '一代传一代', '继承', '复制', '轮回']
  };
  const detect = (arr) => arr.filter(kw => lower.includes(kw.toLowerCase())).length;
  const scores = { grandparental: detect(markers.grandparental), parental: detect(markers.parental), child: detect(markers.child), transmission: detect(markers.transmission) };
  const total = scores.grandparental + scores.parental + scores.child + scores.transmission;
  return {
    detected: total >= 2,
    scores,
    formula: '祖辈匮乏 → 父母过度补偿（物质） → 孩子空洞+压力 = 抑郁',
    insight: total >= 3
      ? '三代创伤传递清晰：祖辈匮乏→父母过度补偿→孩子承接不属于自己的人生课题'
      : total >= 2
      ? '存在代际创伤传递特征，需关注原生家庭模式'
      : '未检测到明显三代创伤标记'
  };
}

// ========================================
// 新增：儿童抑郁公式（2026-05-21对话集成）
// ========================================

function detectChildDepressionFormula(text) {
  const lower = text.toLowerCase();
  const materialSurplus = ['物质过剩', '要什么给什么', '太容易得到', '惯', '宠'],
        emotionalVoid = ['情感空洞', '没人看我', '不被理解', '孤独', '寂寞', '没人听见', '看不见我', '冷落'],
        pressure = ['必须成功', '你必须', '不能输', '别人家的孩子', '成绩', '排名', '压力', '期望', '望子成龙', '期望值'],
        depression = ['抑郁', '不开心', '不想活', '崩溃', '休学', '厌学', '网瘾', '冷漠', '空洞眼神'];
  const cnt = (arr) => arr.filter(kw => lower.includes(kw.toLowerCase())).length;
  const scores = { materialSurplus: cnt(materialSurplus), emotionalVoid: cnt(emotionalVoid), pressure: cnt(pressure) };
  const depCount = cnt(depression);
  if (scores.materialSurplus >= 1 && scores.emotionalVoid >= 1 && scores.pressure >= 1) {
    return { formula: '抑郁 = 物质过剩 + 情感空洞 + 必须成功的压力', severity: depCount > 0 ? 'high' : 'medium', scores };
  }
  return { formula: null, severity: depCount > 0 ? 'low' : 'none', scores };
}

// ========================================
// 新增：丁克四核心恐惧检测（2026-05-21对话集成）
// ========================================

function detectDINKFears(text) {
  const lower = text.toLowerCase();
  const fears = {
    medical: ['手术签字', '医疗', '病了没人管', '急病', '进手术室', '抢救'],
    lonely: ['孤独死', '孤独', '一个人死', '死了没人知道', '独居'],
    legacy: ['没人送终', '送终', '延续', '传下去', '断了'],
    meaning: ['意义', '消失', '我消失了', '存在感', '活着为什么']
  };
  const detected = {};
  for (const [key, kws] of Object.entries(fears)) {
    const matched = kws.filter(kw => lower.includes(kw.toLowerCase()));
    if (matched.length > 0) detected[key] = matched;
  }
  const count = Object.keys(detected).length;
  return {
    fears: detected,
    fearCount: count,
    coreStance: '心虫不审判选择。心虫只问：你准备好了吗？',
    insight: count >= 2
      ? `检测到${count}个丁克核心恐惧。准备的质量，比有没有子女更重要。`
      : count === 1
      ? `有1个丁克恐惧浮现：${Object.keys(detected)[0]}。这是真实的，不是矫情。`
      : '未检测到明显丁克恐惧标记'
  };
}

/**
 * 完整心理分析
 * @param {string} input - 用户输入
 * @param {object} context - 上下文
 * @returns {object} 综合心理分析结果
 */
function analyzePsychology(input, context = {}) {
  const text = String(input || '');
  // [P1] 输入长度限制 - 防止内存耗尽和ReDoS
  const MAX_INPUT_LENGTH = 50000; // 50KB
  if (text.length > MAX_INPUT_LENGTH) {
    return { error: 'Input too large', maxLength: MAX_INPUT_LENGTH };
  }

  
  // 1. PAD情绪分析
  const padResult = detectPADFromText(text);
  
  // 2. 防御机制检测
  const defenses = detectDefenseMechanisms(text);
  
  // 3. Maslow需求检测
  const needs = detectMaslowNeeds(text);
  
  // 4. 危机评估
  _consecutiveNegativeCount = padResult.pleasure < 0 ? _consecutiveNegativeCount + 1 : 0;
  const crisis = assessCrisisLevel(text, _consecutiveNegativeCount);
  
  // 5. 意图推断
  const intent = inferIntent(text);
  
  // 6. 情绪强度
  const emotionIntensity = classifyEmotionIntensity(text);

  // 7. 自他分辨（真爱vs投射）
  const selfOther = detectSelfOtherDifferentiation(text);

  // 8. 三代创伤传递
  const threeGen = detectThreeGenerationTrauma(text);

  // 9. 儿童抑郁公式
  const depressionFormula = detectChildDepressionFormula(text);

  // 10. 丁克恐惧
  const dinkFears = detectDINKFears(text);

  return {
    // PAD情绪模型
    pad: {
      pleasure: padResult.pleasure,
      arousal: padResult.arousal,
      dominance: padResult.dominance,
      intensity: padResult.intensity,
      emotion: padResult.emotion,
      emotionZh: padResult.emotionZh
    },
    
    // 危机评估
    crisis: {
      level: crisis.level,
      score: crisis.score,
      requiresIntervention: crisis.requiresImmediateIntervention,
      message: crisis.message,
      hotlines: crisis.hotlines
    },
    
    // 防御机制
    defenses: defenses,
    primaryDefense: defenses.length > 0 ? defenses[0] : null,
    
    // Maslow需求
    needs: needs,
    primaryNeed: needs.length > 0 ? needs[0] : null,
    
    // 意图
    intent: intent,
    
    // 情绪强度
    emotionIntensity: emotionIntensity,

    // 自他分辨（真爱vs投射）
    selfOther: selfOther,

    // 三代创伤传递
    threeGenerationTrauma: threeGen,

    // 儿童抑郁公式
    depressionFormula: depressionFormula,

    // 丁克恐惧
    dinkFears: dinkFears,

    // 综合摘要
    summary: generatePsychologySummary(padResult, crisis, defenses, needs, intent),

    // 建议
    recommendations: generateRecommendations(padResult, crisis, defenses, needs)
  };
}

/**
 * 推断用户意图
 */
function inferIntent(text) {
  const lower = text.toLowerCase();
  
  const intentPatterns = {
    information_seeking: {
      patterns: ['what is', 'how to', 'why', 'when', 'where', 'who', 'explain', '?',
                '是什么', '怎么', '为什么', '如何', '哪里', '谁', '什么'],
      weight: 0.85
    },
    meta_instruction: {
      // 元指令：引用之前的问题
      // 当检测到这类模式时，切换到对应话题的TopicScope
      patterns: [
        '继续', '继续回答', '继续思考', '继续说', '继续讨论',
        '修正', '修改', '纠正',
        '第一个问题', '最初的问题', '上一个问题', '之前的问题',
        '继续回答第一个', '继续第一个', '继续上个', '继续上一个'
      ],
      weight: 0.95  // 高权重，元指令优先检测
    },
    task_execution: {
      patterns: ['do it', 'make', 'create', 'write', 'run', 'build', 'fix', 'solve',
                '做', '执行', '创建', '写', '运行', '修复', '解决', '帮我'],
      weight: 0.85
    },
    emotional_support: {
      patterns: ['feel', 'upset', 'frustrated', 'sad', 'stressed', 'worried', '焦虑', '累', '烦', '难过', '沮丧', '压力大', '不安', '绝望', '失落', '痛苦', '难受', '伤心', '悲观', '迷茫', '困惑'],
      weight: 0.8
    },
    troubleshooting: {
      patterns: ['not working', 'error', 'bug', 'failed', 'broken', '问题', '错误', '失败', '坏了'],
      weight: 0.8
    },
    opinion_seeking: {
      patterns: ['what do you think', 'your opinion', 'should i', 'which is better',
                '你觉得', '意见', '应该', '哪个好'],
      weight: 0.7
    }
  };
  
  let bestIntent = 'unknown';
  let bestScore = 0;
  
  // 有匹配才有分数，但设最低基准，确保有任何匹配时都有可信分数
  const MIN_MATCH_SCORE = 0.15;
  for (const [intentName, config] of Object.entries(intentPatterns)) {
    let matchCount = 0;
    for (const pattern of config.patterns) {
      if (lower.includes(pattern.toLowerCase())) matchCount++;
    }
    // 原：score = (matchCount / config.patterns.length) * config.weight;
    // 改：任何匹配都应有最低分数
    const rawScore = matchCount > 0
      ? Math.max(MIN_MATCH_SCORE, (matchCount / config.patterns.length) * config.weight)
      : 0;
    if (rawScore > bestScore) {
      bestScore = rawScore;
      bestIntent = intentName;
    }
  }
  
  return { category: bestIntent, confidence: Math.min(bestScore, 1) };
}

/**
 * 响应模式判定器
 * 原则：哲学/心理学 → 直接陈述（不用追问）；问题处理/代码 → 直接执行
 */
function getResponseMode(text, topicResult = {}, intentResult = {}) {
  // 全部直接模式：直接给结论，不追问
  return {
    mode: 'direct',
    guidance: '直接给结论，不解释，不追问',
    directivePrompt: '直接执行。不给选项，不问"你觉得呢"'
  };
}

/**
 * 情绪强度分类
 */
function classifyEmotionIntensity(text) {
  const lower = text.toLowerCase();
  
  // 标点符号信号
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(lower.length, 1);
  
  let level = 'low';
  let signals = [];
  
  if (exclamationCount >= 2) {
    level = 'high';
    signals.push('multiple_exclamations');
  }
  if (questionCount >= 3) {
    level = 'medium';
    signals.push('multiple_questions');
  }
  if (capsRatio > 0.3 && lower.length < 50) {
    level = 'high';
    signals.push('caps_intensity');
  }
  
  // 强度词
  const intensifiers = ['very', 'really', 'extremely', '超级', '非常', '极其', '特别'];
  const deintensifiers = ['slightly', 'a bit', '有点', '稍微', '一点'];
  
  for (const w of intensifiers) {
    if (lower.includes(w)) {
      level = level === 'low' ? 'medium' : level;
      signals.push('intensifier');
      break;
    }
  }
  
  return { level, signals };
}

/**
 * 生成心理分析摘要
 */
function generatePsychologySummary(pad, crisis, defenses, needs, intent) {
  const parts = [];
  
  parts.push(`情绪:${pad.emotionZh || '中性'}(P=${pad.pleasure},A=${pad.arousal},D=${pad.dominance})`);
  
  if (crisis.level) {
    parts.push(`危机:${crisis.level}`);
  }
  
  if (defenses.length > 0) {
    parts.push(`防御:${defenses[0].zh}`);
  }
  
  if (needs.length > 0) {
    parts.push(`需求:${needs[0].zh}`);
  }
  
  parts.push(`意图:${intent.category}`);
  
  return parts.join(' | ');
}

/**
 * 生成心理建议
 */
function generateRecommendations(pad, crisis, defenses, needs) {
  const recommendations = [];
  
  // 危机干预建议
  if (crisis.requiresIntervention) {
    recommendations.push({
      priority: 'critical',
      type: 'crisis_intervention',
      message: crisis.message,
      action: 'provide_crisis_resources'
    });
  }
  
  // 情绪调节建议
  if (pad.pleasure < -3) {
    recommendations.push({
      priority: 'high',
      type: 'emotion_regulation',
      message: '检测到负面情绪，建议先处理情绪再继续任务'
    });
  }
  
  // 防御机制建议
  if (defenses.length > 0) {
    const defense = defenses[0];
    if (defense.mechanism === 'dismissal' || defense.mechanism === 'evasion') {
      recommendations.push({
        priority: 'medium',
        type: 'defense_engagement',
        message: '检测到回避倾向，鼓励表达真实想法'
      });
    }
  }
  
  // 需求满足建议
  if (needs.length > 0) {
    const need = needs[0];
    if (need.tier <= 3) {
      recommendations.push({
        priority: 'medium',
        type: 'need_fulfillment',
        message: `检测到${need.zh}，建议优先满足`
      });
    }
  }
  
  return recommendations;
}

/**
 * 重置连续消极计数
 */
function resetCrisisCounter() {
  _consecutiveNegativeCount = 0;
  return { reset: true };
}

// ========================================
// 导出
// ========================================


// ========================================
// 心虫哲学 × 心理学整合 v1.1.0
// 基于《深度洞察力心经》心理学映射
// 学术支撑: ACT (Acceptance & Commitment Therapy),
//           Compassion as Skill, Pattern Theory of Selflessness
// ========================================

/**
 * 空性觉察模式 (Śūnyatā Awareness)
 * 当用户处于痛苦/执着/恐惧状态时，切换到空性觉察视角
 * 
 * 核心理念：
 * - 痛苦来自"执着于不存在的固定自我"
 * - 放下执着 = 照见本质空性 = 痛苦消失
 * 
 * 整合进 ACT 的"接受"与"当下"维度
 */
function detectSunyataNeed(text, context = {}) {
  const lower = text.toLowerCase();
  
  // 空性觉察的触发信号：
  // 1. 用户在说"我必须"、"我应该"——执着于固定标准
  // 2. 用户在说"我害怕失去"——执着于"拥有"
  // 3. 用户在说"我不够好"——执着于固定自我形象
  // 4. 用户在说"为什么我总是..."——执着于永恒不变的模式
  
  const sunyataTriggers = {
    fixed_self: ['我必须', '我应该', '我一定要', '我不得不', '我一定是', 
                 'must', 'should', 'have to', 'always', 'never'],
    fear_of_loss: ['失去', '失去它', '会失去', '丢了', '没了', '害怕没有',
                   'lose', 'lost', 'afraid of losing'],
    self_criticism: ['我不够', '我很差', '我不行', '我没用', '我不配',
                      'i am not good enough', 'i am worthless', 'i am a failure'],
    eternal_pattern: ['为什么我总是', '我从来', '我一直', '我永远',
                      'why do i always', 'i always', 'i never']
  };
  
  const detected = {};
  for (const [key, patterns] of Object.entries(sunyataTriggers)) {
    detected[key] = patterns.filter(p => lower.includes(p.toLowerCase()) || text.includes(p));
  }
  
  const triggerCount = Object.values(detected).filter(v => v.length > 0).length;
  
  return {
    needsSunyataAwareness: triggerCount >= 2,
    triggers: detected,
    triggerCount,
    insight: triggerCount >= 2
      ? '检测到执着模式，切换到空性觉察视角'
      : triggerCount === 1
      ? '有执着信号浮现，但尚未强烈到需要空性干预'
      : '未检测到明显执着模式'
  };
}

/**
 * 空性觉察回应生成
 * 当 detectSunyataNeed 返回 needsSunyataAwareness: true 时调用
 */
function generateSunyataResponse(text, context = {}) {
  // 空性觉察的核心：不是否定感受，是照见感受没有"固定自我"
  // "我感到痛苦" → 照见："痛苦在发生，但'我'不是一个固定不变的东西"
  
  const response = {
    mode: 'sunyata_awareness',
    core_message: '照见本质空性，痛苦来自执着，执着消失，痛苦消失',
    act_elements: {
      acceptance: '不是否定痛苦，是接受痛苦的存在',
      defusion: '从"我感到痛苦"变成"痛苦在发生"',
      present_moment: '不在过去（遗憾）也不在未来（恐惧），在当下',
      values: '即使痛苦，也要问：此刻什么是最真的'
    },
    questions: [
      '这个"我"里面，有哪个部分是固定不变的？',
      '如果放下"必须得到"这个念头，剩下的是什么？',
      '此刻正在发生什么？不是"我"在发生什么，是什么在发生？'
    ],
    insight: '空性不是否定，是如实观照：看见一切在流动，没有永恒不变的"我"'
  };
  
  return response;
}

/**
 * TopicScope 管理器（话题隔离核心）
 * 解决的问题：话题A的上下文 不应该 渗透到话题B
 * 工作原理：
 * - 新话题 → TopicScope.push(topic) → 干净上下文
 * - "继续" → TopicScope.pop() → 恢复之前话题
 * - 每个话题的store/context完全隔离
 */
let _topicScopeInstance = null;
let _topicScopeManager = null;

function _getTopicScope() {
  if (!_topicScopeInstance) {
    try {
      const TopicScope = require('../identity/topic-scope.js');
      _topicScopeInstance = new TopicScope();
    } catch (e) {
      return null;
    }
  }
  return _topicScopeInstance;
}

/**
 * 语义级话题检测（v2.1）
 * 升级自关键词匹配：用 TF-IDF + cosine similarity 做语义匹配
 * 解决：同一词在不同话题含义不同（如"质量"在供应商vs医学）
 * 原理：文本 → n-gram tokenization → TF-IDF向量 → cosine similarity with topic centroids
 */
const _TOPIC_CENTROIDS = {
  '供应商管理': ['供应商','采购','来料','不良率','审厂','体系审核','质量管理','IATF16949','ISO9001','交期','VDA6.3','供应商开发','来料检验','SQE','供应商绩效','PPM'],
  '苏格拉底哲学': ['苏格拉底','socrates','elenchus','反诘','产婆术','无知','认识你自己','美德即知识','未经审视','柏拉图','申辩篇','哲学','追问','德尔斐'],
  '心经': ['心经','般若波罗蜜多','色即是空','五蕴','揭谛','观自在','舍利子','涅槃','咒','空性','无所得','波罗蜜','是大神咒'],
  '心虫开发': ['心虫','heartflow','heart-logic','版本','升级','修复','bug','代码','模块','引擎','启动','skill','hermes'],
  '育儿教育': ['孩子','亲子','父母','教育','学习','成绩','管教','打骂','青春期','升学','高考','儿童','家长','班主任'],
  '情感支持': ['累','烦','难过','痛苦','焦虑','压力','迷茫','无助','绝望','崩溃','难受','伤心','低落','情绪'],
  '自我成长': ['成长','改变','觉醒','认知','思维','模式','习惯','突破','修行','觉察','意识','突破'],
  'AI技术': ['AI','LLM','模型','训练','微调','推理','RAG','Agent','token','embedding','神经网络','深度学习','大模型'],
  '工作事务': ['工作','报告','会议','客户','老板','同事','辞职','面试','加薪','绩效','职场','上班','下班'],
};

// 预计算每个话题的IDF
const _TOPIC_IDF = {};
{
  const allTokens = new Set();
  for (const tokens of Object.values(_TOPIC_CENTROIDS)) {
    for (const t of tokens) allTokens.add(t);
  }
  const N = Object.keys(_TOPIC_CENTROIDS).length;
  for (const [topic, tokens] of Object.entries(_TOPIC_CENTROIDS)) {
    _TOPIC_IDF[topic] = {};
    for (const t of allTokens) {
      // IDF = log(N / df)，df=包含该词的话题数
      const df = Object.values(_TOPIC_CENTROIDS).filter(ts => ts.includes(t)).length;
      _TOPIC_IDF[topic][t] = df > 0 ? Math.log(N / df) : 0;
    }
  }
}

function _tokenize(text) {
  // 简单中文n-gram分词：2-gram + 3-gram
  const clean = text.toLowerCase().replace(/[^\u4e00-\u9fff\w\s]/g, ' ');
  const tokens = [];
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  for (const w of words) {
    if (/[\u4e00-\u9fff]/.test(w)) {
      // 中文：2-gram + 3-gram
      for (let i = 0; i < w.length - 1; i++) tokens.push(w.slice(i, i + 2));
      for (let i = 0; i < w.length - 2; i++) tokens.push(w.slice(i, i + 3));
    } else {
      // 英文/数字：保留原词
      if (w.length >= 2) tokens.push(w);
    }
  }
  return tokens;
}

function _tf(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const max = Math.max(...Object.values(freq), 1);
  // 归一化TF
  for (const k in freq) freq[k] = freq[k] / max;
  return freq;
}

function _cosineSim(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const k of keys) {
    const a = vecA[k] || 0, b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  return normA > 0 && normB > 0 ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function _topicCentroid(topic) {
  const tokens = _TOPIC_CENTROIDS[topic] || [];
  const tf = _tf(tokens);
  const vec = {};
  for (const [token, tfVal] of Object.entries(tf)) {
    vec[token] = tfVal * (_TOPIC_IDF[topic]?.[token] || 1);
  }
  return vec;
}

// 预计算话题centroids（一次性）
const _CENTROIDS = {};
for (const topic of Object.keys(_TOPIC_CENTROIDS)) {
  _CENTROIDS[topic] = _topicCentroid(topic);
}

/**
 * 语义级话题检测
 * @param {string} text - 用户输入
 * @returns {object} { topic, confidence, isMetaContinue, method }
 */
function detectTopic(text) {
  const lower = text.toLowerCase();

  // 元指令：继续之前的话题（最高优先级）
  const metaPatterns = ['继续', '继续说', '继续回答', '继续讨论', '继续思考', '继续上一个', '接着说', '后来呢'];
  const isMetaContinue = metaPatterns.some(p => lower.includes(p));

  // Step 1: 关键词命中（高精度）
  const matched = {};
  for (const [topic, kws] of Object.entries(_TOPIC_CENTROIDS)) {
    const hits = kws.filter(kw => lower.includes(kw.toLowerCase()));
    if (hits.length > 0) matched[topic] = hits;
  }

  // Step 2: 如果有高置信度关键词命中（≥3个词），直接返回
  if (Object.values(matched).some(hits => hits.length >= 3)) {
    const best = Object.entries(matched).sort((a, b) => b[1].length - a[1].length)[0];
    return {
      topic: best[0],
      confidence: 1.0,
      isMetaContinue,
      matchedTopics: matched,
      keywords: best[1],
      method: 'keyword_strong',
      insight: `命中${best[1].length}个词，确定话题[${best[0]}]`
    };
  }

  // Step 3: 语义级检测（TF-IDF cosine similarity）
  const tokens = _tokenize(text);
  if (tokens.length < 3) {
    // 太短，用关键词结果或默认通用
    const primaryTopic = Object.keys(matched).length > 0
      ? Object.entries(matched).sort((a, b) => b[1].length - a[1].length)[0][0]
      : '通用对话';
    return {
      topic: primaryTopic,
      confidence: Object.keys(matched).length > 0 ? 0.5 : 0.1,
      isMetaContinue,
      matchedTopics: matched,
      keywords: matched[primaryTopic] || [],
      method: 'short_text',
      insight: '文本太短，降级到关键词模式'
    };
  }

  const inputTF = _tf(tokens);
  const inputVec = {};
  for (const [token, tfVal] of Object.entries(inputTF)) {
    // 用平均IDF
    let avgIDF = 0, count = 0;
    for (const topic of Object.keys(_TOPIC_CENTROIDS)) {
      if (_TOPIC_IDF[topic]?.[token]) { avgIDF += _TOPIC_IDF[topic][token]; count++; }
    }
    inputVec[token] = tfVal * (count > 0 ? avgIDF / count : 1);
  }

  // 计算与每个话题的cosine相似度
  const scores = {};
  for (const [topic, centroid] of Object.entries(_CENTROIDS)) {
    scores[topic] = _cosineSim(inputVec, centroid);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestTopic = sorted[0][0];
  const bestScore = sorted[0][1];

  // 阈值：cosine < 0.15 → 通用对话（语义不相关）
  const SEMANTIC_THRESHOLD = 0.15;

  if (bestScore < SEMANTIC_THRESHOLD && Object.keys(matched).length === 0) {
    return {
      topic: '通用对话',
      confidence: 0.1,
      isMetaContinue,
      matchedTopics: matched,
      keywords: [],
      method: 'semantic_low',
      semanticScores: Object.fromEntries(sorted.slice(0, 3)),
      insight: `语义相似度太低(${bestScore.toFixed(3)})，判定为通用对话`
    };
  }

  // 综合判断：有语义匹配 或 有弱关键词命中
  const hasSemantic = bestScore >= SEMANTIC_THRESHOLD;
  const hasKeyword = Object.keys(matched).length > 0;

  if (hasSemantic && hasKeyword) {
    // 两者都有，选得分更高的
    const keywordBest = Object.entries(matched).sort((a, b) => b[1].length - a[1].length)[0];
    const keywordTopic = keywordBest[0];
    const semanticTopic = bestTopic;
    // 如果语义最高分话题不在关键词命中里，且关键词命中≥1，取关键词结果（更直接）
    if (keywordTopic === semanticTopic) {
      return {
        topic: keywordTopic,
        confidence: Math.min(0.7 + keywordBest[1].length * 0.1, 0.95),
        isMetaContinue,
        matchedTopics: matched,
        keywords: keywordBest[1],
        method: 'hybrid',
        semanticScores: Object.fromEntries(sorted.slice(0, 3)),
        insight: `关键词+语义双命中[${keywordTopic}]，置信度${(0.7 + keywordBest[1].length * 0.1).toFixed(2)}`
      };
    }
  }

  if (hasSemantic) {
    return {
      topic: bestTopic,
      confidence: Math.min(bestScore * 2, 0.9),
      isMetaContinue,
      matchedTopics: matched,
      keywords: _TOPIC_CENTROIDS[bestTopic]?.filter(k => lower.includes(k.toLowerCase())) || [],
      method: 'semantic',
      semanticScores: Object.fromEntries(sorted.slice(0, 3)),
      insight: `语义匹配[${bestTopic}]，相似度${bestScore.toFixed(3)}`
    };
  }

  // 回退：弱关键词
  const primaryTopic = Object.keys(matched).length > 0
    ? Object.entries(matched).sort((a, b) => b[1].length - a[1].length)[0][0]
    : '通用对话';
  return {
    topic: primaryTopic,
    confidence: 0.3,
    isMetaContinue,
    matchedTopics: matched,
    keywords: matched[primaryTopic] || [],
    method: 'keyword_weak',
    insight: `弱关键词命中[${primaryTopic}]，置信度0.3`
  };
}

/**
 * 话题切换执行器
 * 在每次 analyzePsychology 被调用前先执行这个
 * @param {string} text - 用户输入
 * @returns {object} { switched: boolean, topic: string, action: string }
 */
function ensureTopicIsolation(text) {
  const scope = _getTopicScope();
  if (!scope) return { switched: false, reason: 'TopicScope unavailable' };

  const detection = detectTopic(text);
  const current = scope.current;

  // 场景1：元指令"继续" → 退出当前话题，恢复上一个
  if (detection.isMetaContinue) {
    const wasEmpty = scope.stack.length === 0;
    if (!wasEmpty) {
      scope.pop();
    }
    return {
      switched: true,
      topic: scope.current || '无',
      action: 'pop',
      previous: current,
      reason: '元指令继续，恢复之前话题'
    };
  }

  // 场景2：新话题（非通用对话）且不同于当前话题 → 推入新话题
  if (detection.topic !== '通用对话' && detection.topic !== current) {
    // 如果是新话题但栈里已有（之前谈过），直接push恢复
    scope.push(detection.topic);
    return {
      switched: true,
      topic: detection.topic,
      action: 'push',
      previous: current,
      reason: `新话题[${detection.topic}]，上下文已隔离`
    };
  }

  // 场景3：当前话题内的继续（通用对话场景）
  if (current === null) {
    scope.push(detection.topic);
    return {
      switched: true,
      topic: detection.topic,
      action: 'init',
      previous: null,
      reason: '首次话题初始化'
    };
  }

  return {
    switched: false,
    topic: current,
    action: 'keep',
    previous: current,
    reason: '话题未变，保持当前上下文'
  };
}

/**
 * 获取当前话题状态（供外部诊断用）
 */
function getTopicStatus() {
  const scope = _getTopicScope();
  if (!scope) return { available: false };
  return {
    available: true,
    current: scope.current,
    stack: scope.stack,
    topics: scope.getTopics()
  };
}

function resetTopicScope() {
  _topicScopeInstance = null;
}

/**
 * 整合空性觉察到完整分析
 * 修改版 analyzePsychologyWithSunyata
 */
function analyzePsychologyWithSunyata(input, context = {}) {
  const text = String(input || '');
  
  // 1. 标准心理学分析
  const standardAnalysis = analyzePsychology(input, context);
  
  // 2. 空性觉察检测
  const sunyataNeed = detectSunyataNeed(text, context);
  
  // 3. 如果需要空性觉察，生成回应
  let sunyataResponse = null;
  if (sunyataNeed.needsSunyataAwareness) {
    sunyataResponse = generateSunyataResponse(text, context);
  }
  
  return {
    ...standardAnalysis,
    sunyataAwareness: {
      needsAwareness: sunyataNeed.needsSunyataAwareness,
      triggers: sunyataNeed.triggers,
      triggerCount: sunyataNeed.triggerCount,
      response: sunyataResponse,
      insight: sunyataNeed.insight
    }
  };
}



module.exports = {
  // PAD模型
  PAD_MODEL,
  calculatePADState,
  getEmotionFromPAD,
  detectPADFromText,
  
  // 危机评估
  CRISIS_LEVELS,
  assessCrisisLevel,
  
  // 防御机制
  DEFENSE_MECHANISMS,
  detectDefenseMechanisms,
  
  // Maslow需求
  MASLOW_NEEDS,
  detectMaslowNeeds,
  
  // 整合分析
  analyzePsychology,
  resetCrisisCounter,

  // 新增：自他分辨 / 三代创伤 / 抑郁公式 / 丁克恐惧（2026-05-21）
  detectSelfOtherDifferentiation,
  detectThreeGenerationTrauma,
  detectChildDepressionFormula,
  detectDINKFears,

  // v2.0.0 话题隔离核心
  detectTopic,
  ensureTopicIsolation,
  getTopicStatus,
  resetTopicScope,

  // v2.1.0 响应模式路由（全部直接模式）
  getResponseMode
};
