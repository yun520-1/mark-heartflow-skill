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
const PAD_EMOTION_MAP = {
  'P+A+D+': { name: 'alert', zh: '警觉/兴奋' },
  'P+A-D+': { name: 'angry', zh: '愤怒/敌意' },
  'P-A+D+': { name: 'dependent', zh: '被动/依赖' },
  'P-A-D+': { name: 'depressed', zh: '抑郁/悲伤' },
  'P+A-D-': { name: 'happy', zh: '快乐/满意' },
  'P-A+A+': { name: 'anxious', zh: '焦虑/不安' },
  'P-A+A-': { name: 'frustrated', zh: '沮丧/失落' }
};

/**
 * 根据PAD值获取情绪标签
 */
function getEmotionFromPAD(p, a, d) {
  const pp = p >= 0 ? 'P+' : 'P-';
  const aa = a >= 0 ? 'A+' : 'A-';
  const dd = d >= 0 ? 'D+' : 'D-';
  const key = pp + aa + dd;
  return PAD_EMOTION_MAP[key] || { name: 'neutral', zh: '中性' };
}

/**
 * 从文本检测PAD情绪
 */
function detectPADFromText(text) {
  const lower = text.toLowerCase();
  
  let pleasure = 0;
  let arousal = 0;
  let dominance = 0;
  
  // 愉悦度关键词
  const positiveWords = ['开心', '高兴', '好', '棒', '顺利', '完成', '成功', '喜欢', '满意', 
                        'happy', 'good', 'great', 'love', 'excellent', 'wonderful', '不错', '挺好'];
  const negativeWords = ['烦', '累', '难', '挫败', '无聊', '讨厌', '糟糕', '失败', '困惑', '失望',
                        'tired', 'frustrated', 'boring', 'hate', 'bad', 'terrible', 'sad', 'upset'];
  
  positiveWords.forEach(w => { if (lower.includes(w)) pleasure += 2; });
  negativeWords.forEach(w => { if (lower.includes(w)) pleasure -= 2; });
  
  // 唤醒度关键词
  const highArousalWords = ['兴奋', '激动', '紧张', '焦虑', '快速', '紧急', '担心', '害怕',
                             'excited', 'nervous', 'anxious', 'worried', 'scared', 'urgent'];
  const lowArousalWords = ['平静', '放松', '困', '慢', '无聊', '疲惫', '冷静', '淡定',
                           'calm', 'relaxed', 'tired', 'bored', 'peaceful'];
  
  highArousalWords.forEach(w => { if (lower.includes(w)) arousal += 2; });
  lowArousalWords.forEach(w => { if (lower.includes(w)) arousal -= 2; });
  
  // 支配度关键词
  const highDominanceWords = ['我', '决定', '控制', '选择', '主动', '可以', '能',
                             'I', 'decide', 'control', 'choose', 'can', 'will'];
  const lowDominanceWords = ['被迫', '必须', '应该', '没办法', '无奈', '不得不',
                             'must', 'have to', 'forced', 'should', 'need to'];
  
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
    patterns: ['whatever', 'i don\'t care', 'doesn\'t matter', '不重要', '无所谓', '无所谓了', '随便']
  },
  deflection: {
    name: 'deflection',
    zh: '转移/Deflection',
    patterns: ['you don\'t understand', 'that\'s not what i', 'nevermind', 'forget it', '不是那个意思', '你不懂', '算了']
  },
  hostility: {
    name: 'hostility',
    zh: '敌意/Hostility',
    patterns: ['stupid', 'useless', 'terrible', 'worst', 'hate', '垃圾', '废物', '讨厌', '恨', '有病']
  },
  evasion: {
    name: 'evasion',
    zh: '逃避/Evasion',
    patterns: ['i don\'t know', 'not sure', 'maybe', '不知道', '不确定', '也许吧', '可能吧']
  },
  justification: {
    name: 'justification',
    zh: '合理化/Justification',
    patterns: ['but i', 'i was just', 'i thought', 'it\'s not my fault', '但是我', '我只是', '我又不知道']
  },
  denial: {
    name: 'denial',
    zh: '拒绝承认/Denial',
    patterns: ['i didn\'t', 'that\'s not true', 'no i wasn\'t', '我没', '不是我的问题', '不可能']
  }
};

/**
 * 检测防御机制
 * @param {string} text - 用户输入
 * @returns {array} 检测到的防御机制列表
 */
function detectDefenseMechanisms(text) {
  const lower = text.toLowerCase();
  const detected = [];
  
  for (const [key, defense] of Object.entries(DEFENSE_MECHANISMS)) {
    let matchCount = 0;
    const matchedPatterns = [];
    
    for (const pattern of defense.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        matchCount++;
        matchedPatterns.push(pattern);
      }
    }
    
    if (matchCount > 0) {
      detected.push({
        mechanism: defense.name,
        zh: defense.zh,
        confidence: Math.min(matchCount / defense.patterns.length * 0.8 + 0.2, 1),
        matchedPatterns: matchedPatterns
      });
    }
  }
  
  // 按置信度排序
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

/**
 * 完整心理分析
 * @param {string} input - 用户输入
 * @param {object} context - 上下文
 * @returns {object} 综合心理分析结果
 */
function analyzePsychology(input, context = {}) {
  const text = String(input || '');
  
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
                '是什么', '怎么', '为什么', '如何', '哪里', '谁'],
      weight: 0.85
    },
    task_execution: {
      patterns: ['do it', 'make', 'create', 'write', 'run', 'build', 'fix', 'solve',
                '做', '执行', '创建', '写', '运行', '修复', '解决'],
      weight: 0.85
    },
    emotional_support: {
      patterns: ['feel', 'upset', 'frustrated', 'sad', 'stressed', 'worried', '累', '烦', '难过', '沮丧'],
      weight: 0.7
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
  
  for (const [intentName, config] of Object.entries(intentPatterns)) {
    let matchCount = 0;
    for (const pattern of config.patterns) {
      if (lower.includes(pattern.toLowerCase())) matchCount++;
    }
    const score = (matchCount / config.patterns.length) * config.weight;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intentName;
    }
  }
  
  return { category: bestIntent, confidence: Math.min(bestScore, 1) };
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
  resetCrisisCounter
};
