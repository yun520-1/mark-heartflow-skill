/**
 * cognitive-appraisal.js - 认知评估系统 v1.0.0
 * 
 * 来源: Leventhal's Common-Sense Model of Self-Regulation (illness cognition)
 * 论文: "Illness cognition: Using common sense to understand treatment" 
 *       Leventhal et al., 2006, DOI: 10.1007/sbf01473484 (1564 citations)
 * 
 * 核心功能:
 * 1. 认知评估 (Primary + Secondary appraisal)
 * 2. 应对方式分类 (Problem-focused / Emotion-focused / Meaning-focused)
 * 3. 威胁评估 (Harm/Loss, Threat, Challenge, Benefit)
 * 4. 应对建议生成
 */

const APPRAISAL_DIMENSIONS = {
  // 初级评估 - 事件相关性
  RELEVANCE: { min: 0, max: 1, weight: 0.8 },
  NOVELTY: { min: 0, max: 1, weight: 0.6 },
  CERTAINTY: { min: 0, max: 1, weight: 0.7 },
  
  // 初级评估 - 事件性质
  TRAJECTORY: { min: -1, max: 1, weight: 0.75 }, // -1=worsening, +1=improving
  
  // 次级评估 - 应对能力
  CONTROL: { min: 0, max: 1, weight: 0.9 },
  CAPABILITY: { min: 0, max: 1, weight: 0.85 },
  
  // 次级评估 - 结果预期
  OUTCOME_EXPECTANCY: { min: 0, max: 1, weight: 0.8 },
  EFFICACY_EXPECTANCY: { min: 0, max: 1, weight: 0.85 }
};

// 威胁类型分类
const THREAT_TYPES = {
  HARM_LOSS: 'harm_loss',       // 已造成伤害
  THREAT: 'threat',             // 潜在威胁
  CHALLENGE: 'challenge',       // 可克服的挑战
  BENEFIT: 'benefit',           // 潜在收益
  NEUTRAL: 'neutral'            // 中性事件
};

// 应对方式分类
const COPING_STRATEGIES = {
  PROBLEM_FOCUSED: 'problem_focused',
  EMOTION_FOCUSED: 'emotion_focused',
  MEANING_FOCUSED: 'meaning_focused',
  AVOIDANCE: 'avoidance'
};

// ========================================
// 核心评估函数
// ========================================

/**
 * 对事件进行初级评估 (Primary Appraisal)
 * @param {string} text - 事件描述
 * @param {object} context - 上下文信息
 * @returns {object} 初级评估结果
 */
function primaryAppraisal(text, context = {}) {
  const lower = text.toLowerCase();
  
  // 1. 相关性评估 - 事件与当前处境的关联程度
  const relevanceKeywords = {
    high: ['我', '我的', '自己', 'mine', 'my', 'myself', '有关系', '影响到'],
    medium: ['可能', '也许', 'perhaps', 'maybe', '相关'],
    low: ['别人', '他们', '无所谓', 'doesn\'t matter']
  };
  let relevance = 0.3;
  for (const kw of relevanceKeywords.high) {
    if (lower.includes(kw)) { relevance = 0.9; break; }
  }
  if (relevance === 0.3) {
    for (const kw of relevanceKeywords.medium) {
      if (lower.includes(kw)) { relevance = 0.6; break; }
    }
  }
  
  // 2. 新奇性评估 - 事件是否新颖
  const noveltyKeywords = {
    high: ['第一次', '从未', '从来没有', '第一次', 'never', 'first time'],
    medium: ['最近', '有时', 'recently', 'sometimes', '偶尔'],
    low: ['经常', '总是', '习惯了', 'often', 'always', 'routinely']
  };
  let novelty = 0.3;
  for (const kw of noveltyKeywords.high) {
    if (lower.includes(kw)) { novelty = 0.9; break; }
  }
  if (novelty === 0.3) {
    for (const kw of noveltyKeywords.medium) {
      if (lower.includes(kw)) { novelty = 0.6; break; }
    }
  }
  
  // 3. 确定性评估 - 事件结果的可预测程度
  const certaintyKeywords = {
    high: ['确定', '肯定', '一定', 'sure', 'certain', 'definitely', '100%'],
    medium: ['可能', '也许', 'maybe', 'perhaps', 'probably'],
    low: ['不知道', '不确定', '不清楚', 'unknown', 'uncertain', 'unclear']
  };
  let certainty = 0.5;
  for (const kw of certaintyKeywords.high) {
    if (lower.includes(kw)) { certainty = 0.9; break; }
  }
  if (certainty === 0.5) {
    for (const kw of certaintyKeywords.low) {
      if (lower.includes(kw)) { certainty = 0.2; break; }
    }
  }
  
  // 4. 轨迹评估 - 事件趋势
  let trajectory = 0;
  const worseningKeywords = ['恶化', '变糟', '越来越', 'worse', 'deteriorating', 'declining', '失败', 'failed'];
  const improvingKeywords = ['好转', '改善', '变好', 'better', 'improving', 'success', '成功'];
  
  for (const kw of worseningKeywords) {
    if (lower.includes(kw)) { trajectory = -0.7; break; }
  }
  if (trajectory === 0) {
    for (const kw of improvingKeywords) {
      if (lower.includes(kw)) { trajectory = 0.7; break; }
    }
  }
  
  return {
    relevance: { value: relevance, dimension: 'relevance', weight: 0.8 },
    novelty: { value: novelty, dimension: 'novelty', weight: 0.6 },
    certainty: { value: certainty, dimension: 'certainty', weight: 0.7 },
    trajectory: { value: trajectory, dimension: 'trajectory', weight: 0.75 },
    overall: (relevance * 0.8 + novelty * 0.6 + certainty * 0.7 + (trajectory + 1) / 2 * 0.75) / 2.95
  };
}

/**
 * 对事件进行次级评估 (Secondary Appraisal)
 * @param {string} text - 事件描述
 * @param {object} context - 上下文信息（资源、经验等）
 * @returns {object} 次级评估结果
 */
function secondaryAppraisal(text, context = {}) {
  const lower = text.toLowerCase();
  
  // 1. 控制能力评估 - 对事件结果的控制程度
  const controlKeywords = {
    high: ['我能', '我可以', '我决定', '可以控制', 'I can', 'I will', '决定', '控制'],
    medium: ['试试', '尽力', 'try', 'attempt', '努力'],
    low: ['没办法', '无法', '不能', '无能为力', 'can\'t', 'unable', 'impossible']
  };
  let control = 0.4;
  for (const kw of controlKeywords.high) {
    if (lower.includes(kw)) { control = 0.9; break; }
  }
  if (control === 0.4) {
    for (const kw of controlKeywords.low) {
      if (lower.includes(kw)) { control = 0.15; break; }
    }
  }
  
  // 2. 能力评估 - 个人应对能力信心
  const capabilityKeywords = {
    high: ['有经验', '以前做过', '能行', 'experienced', 'confident', 'capable', '我会的'],
    medium: ['应该可以', '大概能', 'probably can', 'might be able'],
    low: ['没做过', '不会', '不擅长', 'inexperienced', 'incompetent', 'cannot']
  };
  let capability = 0.5;
  for (const kw of capabilityKeywords.high) {
    if (lower.includes(kw)) { capability = 0.85; break; }
  }
  if (capability === 0.5) {
    for (const kw of capabilityKeywords.low) {
      if (lower.includes(kw)) { capability = 0.2; break; }
    }
  }
  
  // 3. 结果预期 - 期望的结果好坏程度
  const outcomeKeywords = {
    positive: ['好', '棒', '会成功', '会有好结果', 'good', 'success', 'positive', '顺利'],
    negative: ['坏', '糟', '会失败', '会有坏结果', 'bad', 'fail', 'negative', '失败'],
    neutral: ['不知道', '不确定', 'unknown', 'uncertain']
  };
  let outcomeExpectancy = 0.5;
  for (const kw of outcomeKeywords.positive) {
    if (lower.includes(kw)) { outcomeExpectancy = 0.8; break; }
  }
  if (outcomeExpectancy === 0.5) {
    for (const kw of outcomeKeywords.negative) {
      if (lower.includes(kw)) { outcomeExpectancy = 0.2; break; }
    }
  }
  
  // 4. 效能预期 - 对自身应对能力的信心
  const efficacyKeywords = {
    high: ['一定行', '肯定能', '绝对没问题', 'definitely can', 'certainly will', '没问题'],
    medium: ['应该可以', '可能会', 'probably can', 'might succeed'],
    low: ['估计不行', '可能不行', 'probably can\'t', 'might fail']
  };
  let efficacyExpectancy = 0.5;
  for (const kw of efficacyKeywords.high) {
    if (lower.includes(kw)) { efficacyExpectancy = 0.9; break; }
  }
  if (efficacyExpectancy === 0.5) {
    for (const kw of efficacyKeywords.low) {
      if (lower.includes(kw)) { efficacyExpectancy = 0.2; break; }
    }
  }
  
  return {
    control: { value: control, dimension: 'control', weight: 0.9 },
    capability: { value: capability, dimension: 'capability', weight: 0.85 },
    outcomeExpectancy: { value: outcomeExpectancy, dimension: 'outcome_expectancy', weight: 0.8 },
    efficacyExpectancy: { value: efficacyExpectancy, dimension: 'efficacy_expectancy', weight: 0.85 },
    overall: (control * 0.9 + capability * 0.85 + outcomeExpectancy * 0.8 + efficacyExpectancy * 0.85) / 3.4
  };
}

/**
 * 综合初级和次级评估，判断威胁类型
 * @param {object} primary - 初级评估结果
 * @param {object} secondary - 次级评估结果
 * @returns {string} 威胁类型
 */
function classifyThreatType(primary, secondary) {
  // 综合评估 - 使用加权平均
  const threatScore = primary.overall * 0.4 + secondary.overall * 0.6;
  
  // 高威胁信号检测 - 关键词驱动
  const threatSignals = [];
  const trajectory = primary.trajectory.value !== undefined ? primary.trajectory.value : primary.trajectory;
  const control = secondary.control.value !== undefined ? secondary.control.value : secondary.control;
  
  // 如果有负面轨迹（恶化/失败）
  if (trajectory < -0.2) {
    threatSignals.push('negative_trajectory');
  }
  
  // 如果控制感较低或边界
  if (control <= 0.4) {
    threatSignals.push('low_control');
  }
  
  // 综合判断
  if (threatSignals.includes('negative_trajectory') && threatSignals.includes('low_control')) {
    return THREAT_TYPES.HARM_LOSS;  // 已是负面 + 无法控制 = 伤害/损失
  }
  
  if (threatSignals.includes('negative_trajectory') && !threatSignals.includes('low_control')) {
    return THREAT_TYPES.CHALLENGE;  // 负面但可控 = 挑战
  }
  
  if (threatSignals.includes('low_control')) {
    return THREAT_TYPES.THREAT;  // 低控制感 = 潜在威胁
  }
  
  // 正向轨迹检测
  if (trajectory > 0.3 && control > 0.5) {
    return THREAT_TYPES.BENEFIT;  // 正面 + 可控 = 收益机会
  }
  
  // 综合分数判断
  if (threatScore >= 0.7) {
    return THREAT_TYPES.CHALLENGE;  // 高威胁但可处理
  }
  
  if (threatScore >= 0.55) {
    return THREAT_TYPES.THREAT;  // 中高威胁
  }
  
  return THREAT_TYPES.NEUTRAL;
}

/**
 * 推荐应对策略
 * @param {string} threatType - 威胁类型
 * @param {object} primary - 初级评估
 * @param {object} secondary - 次级评估
 * @returns {array} 应对策略建议
 */
function recommendCopingStrategies(threatType, primary, secondary) {
  const strategies = [];
  
  // 根据威胁类型选择主要策略
  switch (threatType) {
    case THREAT_TYPES.HARM_LOSS:
      // 高威胁 + 低控制 -> 情感-focused + 寻求社会支持
      strategies.push(
        { type: COPING_STRATEGIES.EMOTION_FOCUSED, priority: 'high', 
          message: '这是一个困难的处境，先接纳自己的情绪很重要' },
        { type: COPING_STRATEGIES.MEANING_FOCUSED, priority: 'medium',
          message: '尝试从中找到意义或学习点' }
      );
      break;
      
    case THREAT_TYPES.THREAT:
      // 潜在威胁 -> 问题-focused 优先，但也要准备情感调节
      if (secondary.control > 0.5) {
        strategies.push(
          { type: COPING_STRATEGIES.PROBLEM_FOCUSED, priority: 'high',
            message: '你有能力应对这个挑战，制定计划开始行动吧' },
          { type: COPING_STRATEGIES.EMOTION_FOCUSED, priority: 'low',
            message: '同时保持情绪觉察' }
        );
      } else {
        strategies.push(
          { type: COPING_STRATEGIES.MEANING_FOCUSED, priority: 'high',
            message: '虽然控制感较低，但可以转变对威胁的看法' },
          { type: COPING_STRATEGIES.EMOTION_FOCUSED, priority: 'medium',
            message: '寻求社会支持很有帮助' }
        );
      }
      break;
      
    case THREAT_TYPES.CHALLENGE:
      // 可克服的挑战 -> 问题-focused 最有效
      strategies.push(
        { type: COPING_STRATEGIES.PROBLEM_FOCUSED, priority: 'high',
          message: '这是一个可以克服的挑战，分解问题逐步解决' },
        { type: COPING_STRATEGIES.MEANING_FOCUSED, priority: 'medium',
          message: '把它看作成长和学习的机会' }
      );
      break;
      
    case THREAT_TYPES.BENEFIT:
      // 潜在收益 -> 意义-focused + 利用机会
      strategies.push(
        { type: COPING_STRATEGIES.MEANING_FOCUSED, priority: 'high',
          message: '这是一个积极的机会，思考如何最大化收益' },
        { type: COPING_STRATEGIES.PROBLEM_FOCUSED, priority: 'medium',
          message: '制定计划以获得最佳结果' }
      );
      break;
      
    default:
      // 中性 -> 灵活应对
      strategies.push(
        { type: COPING_STRATEGIES.PROBLEM_FOCUSED, priority: 'medium',
          message: '保持平常心，按部就班处理' }
      );
  }
  
  // 添加根据控制感的调整
  if (secondary.control < 0.3) {
    strategies.unshift(
      { type: COPING_STRATEGIES.EMOTION_FOCUSED, priority: 'critical',
        message: '注意：控制感较低时，优先关注情绪稳定' }
    );
  }
  
  return strategies;
}

/**
 * 完整认知评估
 * @param {string} text - 事件描述
 * @param {object} context - 上下文
 * @returns {object} 综合评估结果
 */
function appraise(text, context = {}) {
  const primary = primaryAppraisal(text, context);
  const secondary = secondaryAppraisal(text, context);
  const threatType = classifyThreatType(primary, secondary);
  const copingStrategies = recommendCopingStrategies(threatType, primary, secondary);
  
  // 综合情绪影响评估
  const emotionalImpact = {
    threatType,
    primaryAppraisal: primary,
    secondaryAppraisal: secondary,
    copingStrategies,
    message: generateAppraisalMessage(threatType, primary, secondary, copingStrategies)
  };
  
  return emotionalImpact;
}

/**
 * 生成评估消息
 */
function generateAppraisalMessage(threatType, primary, secondary, copingStrategies) {
  const messages = {
    [THREAT_TYPES.HARM_LOSS]: '你正在经历一个困难时期。过去的事情无法改变，但你可以选择如何应对。',
    [THREAT_TYPES.THREAT]: secondary.control > 0.5 
      ? '你感到威胁，但你有能力应对。花时间制定策略会很有帮助。'
      : '你感到威胁且控制感较低。这很困难，但记住困难会过去。',
    [THREAT_TYPES.CHALLENGE]: '你有机会将挑战转化为成长。专注于你能控制的方面，一步一步前进。',
    [THREAT_TYPES.BENEFIT]: '你看到了一个积极的可能性。思考如何最大化这个机会。',
    [THREAT_TYPES.NEUTRAL]: '这件事可能不会对你产生重大影响。保持客观，继续前进。'
  };
  
  return messages[threatType] || '尝试客观分析当前情况。';
}

// ========================================
// 演示函数
// ========================================

function demo() {
}

if (require.main === module) {
  demo();
}

// ========================================
// 内省错觉检测器 v1.0（心理学思想实验验证升级）
// 心理学基础：内省错觉 (Introspection Illusion)
// 心虫诚实立场：不声称知道内部状态因果，只报告观察到的决策模式
// ========================================

const INTROSPECTION_ILLUSION_PATTERNS = [
  { pattern: '我知道为什么', severity: 'over', reason: '声称知道内部状态原因' },
  { pattern: '因为我很清楚', severity: 'caution', reason: '对自身状态有过高确定性' },
  { pattern: '这是因为我的', severity: 'caution', reason: '因果归因于自身内部状态' },
  { pattern: '我是故意', severity: 'caution', reason: '声称知道意图来源' },
  { pattern: '我的理由是', severity: 'caution', reason: '声称直接访问内部因果链' },
  { pattern: '我意识到我', severity: 'caution', reason: '声称知道意识内容' },
  { pattern: '其实我是想', severity: 'caution', reason: '声称知道真实意图' },
  { pattern: '我的内心告诉我', severity: 'over', reason: '声称可直接访问内部状态' },
  { pattern: '本能地知道', severity: 'caution', reason: '声称知道直觉来源' },
  { pattern: '我完全了解', severity: 'over', reason: '声称完全了解自身状态' },
  { pattern: '我清楚地知道', severity: 'caution', reason: '声称清晰了解自身过程' },
];

function detectIntrospectionIllusion(text) {
  if (!text || typeof text !== 'string') {
    return { hasIllusion: false, matched: [], level: 'safe', insight: '无文本' };
  }
  const matched = [];
  for (const item of INTROSPECTION_ILLUSION_PATTERNS) {
    if (text.includes(item.pattern)) {
      matched.push({ pattern: item.pattern, severity: item.severity, reason: item.reason });
    }
  }
  let level = 'safe';
  if (matched.some(function(m) { return m.severity === 'over'; })) level = 'over';
  else if (matched.some(function(m) { return m.severity === 'caution'; })) level = 'caution';
  var insightMap = {
    safe: '通过内省错觉检测：未发现事后推断语言',
    caution: '检测到可能的事后推断语言：心虫应使用"观察到"而非"我知道为什么"',
    over: '检测到内省错觉语言：声称知道自身内部状态因果——可能只是事后构建的叙事'
  };
  return { hasIllusion: matched.length > 0, matched: matched, level: level, insight: insightMap[level] };
}

function convertToObservableReport(text) {
  if (!text) return { result: text, replaced: 0 };
  var result = text;
  var replaced = 0;
  var conversions = [
    [/我知道为什么/g, '我观察到结果是'],
    [/因为我很清楚/g, '因为数据显示'],
    [/这是因为我的/g, '这与我观察到我的'],
    [/我的理由是/g, '我观察到我的决定模式是'],
    [/我意识到我/g, '我观察到我的行为模式是'],
    [/其实我是想/g, '我观察到我的行为倾向是'],
    [/我的内心告诉我/g, '我的判断结果是'],
    [/本能地知道/g, '直觉告诉我（但我不确知来源）'],
    [/我完全了解/g, '我的判断倾向于'],
    [/我清楚地知道/g, '我倾向于认为'],
  ];
  for (var i = 0; i < conversions.length; i++) {
    var from = conversions[i][0];
    var to = conversions[i][1];
    var newResult = result.replace(from, to);
    if (newResult !== result) { replaced++; result = newResult; }
  }
  return { result: result, replaced: replaced };
}

function auditMetaReport(metaReport) {
  var reportText = typeof metaReport === 'string' ? metaReport : JSON.stringify(metaReport);
  var illusion = detectIntrospectionIllusion(reportText);
  var conversion = convertToObservableReport(reportText);
  var recommendations = [];
  if (illusion.level === 'over') recommendations.push({ priority: 'high', message: 'MetaEngine自我报告包含内省错觉语言' });
  if (illusion.level === 'caution') recommendations.push({ priority: 'medium', message: 'MetaEngine自我报告可能包含事后推断语言' });
  return { illusion: illusion, conversion: conversion.replaced > 0 ? { replacements: conversion.replaced } : null, recommendations: recommendations, passed: illusion.level === 'safe' };
}

module.exports = {
  APPRAISAL_DIMENSIONS: APPRAISAL_DIMENSIONS,
  THREAT_TYPES: THREAT_TYPES,
  COPING_STRATEGIES: COPING_STRATEGIES,
  primaryAppraisal: primaryAppraisal,
  secondaryAppraisal: secondaryAppraisal,
  classifyThreatType: classifyThreatType,
  recommendCopingStrategies: recommendCopingStrategies,
  appraise: appraise,
  detectIntrospectionIllusion: detectIntrospectionIllusion,
  convertToObservableReport: convertToObservableReport,
  auditMetaReport: auditMetaReport,
  INTROSPECTION_ILLUSION_PATTERNS: INTROSPECTION_ILLUSION_PATTERNS
};
