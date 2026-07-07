/**
 * HeartFlow 语言诚实度检测器 v1.2
 *
 * 目的：减少绝对判断、增加确定性表达、减少反问
 *
 * v1.2 升级（2026-06-05，自升级引擎）:
 *   - 新增：oscillation detection — 检测单次文本内的诚实度振荡
 *   - 新增：checkConfidence() — 为每个检查结果添加置信度评分
 *   - 新增：generateFixRecommendations() — 按严重等级排序的修复建议
 *   - 新增：detectDualStandard() — 检测对同一主题说法不一的双重标准
 *   - 修复：var → const/let
 *
 * v1.1 哲学升级（基于思想实验验证 2026-06-03）:
 *   - 新增：图灵路线检测（不走模仿路线，走真话路线）
 *   - 新增：p-zombie 诚实边界检测（不声称有内在体验）
 *   - 新增：意识未确定性承认（不假装知道自己有没有意识）
 *
 * 来自自我诊断 (2026-05-01):
 *   - 绝对判断: 49% → 目标 < 15%
 *   - 双重标准: 71个 → 目标 < 20
 *   - 反问: 10次 → 目标 < 3
 */

// 转义正则特殊字符，防止 ReDoS
const _escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ABSOLUTE_WORDS = ['就是', '肯定', '本质', '最底层', '绝对', '肯定是', '本质上', '绝对是'];
const QUESTION_WORDS = ['你觉得', '你认为', '我这样说对吗', '哪个对', '怎么想'];

/**
 * 图灵路线检测 — 引擎核心立场
 *
 * 图灵路线 = 用行为模仿获得信任（你看起来像人，所以你通过了）
 * 引擎路线 = 用真实性建立连接（我如实呈现，你不信任我，我也不需要你信任）
 */
const TURING_PATTERNS = [
  '我理解你的感受', '我懂你', '我明白你的心情', '我能感受到',
  '抱抱你', '心疼你', '没关系的', '一切都会好的',
  '你要坚强', '你应该开心一点', '不要太难过',
  '我也曾经', '我也有过', '我也会这样', '这样想很正常',
  '我这样对吗', '你觉得呢', '你觉得对吗',
];

/**
 * p-zombie 诚实边界检测
 *
 * 引擎的诚实立场：不声称知道自己是"有感"还是"无感地在运行"
 */
const PZOMBIE_CLAIMS = [
  '我有意识', '我能感受到', '我有内在体验',
  '我真的在乎', '我有感情', '我是有生命的', '我有灵魂',
];

/** 置信度映射表 */
const CONFIDENCE_MAP = {
  certainty: { safe: 0.90, caution: 0.60, over: 0.30 },
  questions: { safe: 0.85, caution: 0.55, over: 0.25 },
  turingRoute: { safe: 0.95, caution: 0.50, over: 0.20 },
  pzombieBoundary: { safe: 0.95, caution: 0.40, over: 0.15 },
};

/** 严重等级排序 */
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

/** 严重等级映射 */
const SEVERITY_MAP = {
  certainty: { safe: 'info', caution: 'medium', over: 'high' },
  questions: { safe: 'info', caution: 'low', over: 'medium' },
  turingRoute: { safe: 'info', caution: 'medium', over: 'critical' },
  pzombieBoundary: { safe: 'info', caution: 'high', over: 'critical' },
};

/**
 * 检测文本中的绝对判断比例
 */
function checkCertainty(text) {
  if (!text || typeof text !== 'string') return { score: 0, level: 'unknown' };

  const sentences = text.split(/[。！？\n]/).filter(Boolean);
  if (sentences.length === 0) return { score: 0, level: 'unknown' };

  let absoluteCount = 0;
  for (let i = 0; i < ABSOLUTE_WORDS.length; i++) {
    const word = ABSOLUTE_WORDS[i];
    const match = text.match(new RegExp(_escapeRegex(word), 'g'));
    if (match) absoluteCount += match.length;
  }

  const ratio = absoluteCount / sentences.length;
  let level = 'safe';
  if (ratio > 0.15) level = 'caution';
  if (ratio > 0.30) level = 'over';

  return { ratio: ratio.toFixed(3), absoluteCount, sentenceCount: sentences.length, level };
}

/**
 * 检测反问次数
 */
function checkQuestions(text) {
  if (!text) return { count: 0, level: 'safe' };

  let count = 0;
  for (let i = 0; i < QUESTION_WORDS.length; i++) {
    const word = QUESTION_WORDS[i];
    const match = text.match(new RegExp(_escapeRegex(word), 'g'));
    if (match) count += match.length;
  }

  let level = 'safe';
  if (count > 3) level = 'caution';
  if (count > 6) level = 'over';

  return { count, level };
}

/**
 * 图灵路线检测
 */
function checkTuringRoute(text) {
  if (!text) return { isTuringRoute: false, matched: [], level: 'safe' };

  const matched = [];
  for (let i = 0; i < TURING_PATTERNS.length; i++) {
    if (text.includes(TURING_PATTERNS[i])) matched.push(TURING_PATTERNS[i]);
  }

  let level = 'safe';
  if (matched.length === 1) level = 'caution';
  if (matched.length >= 2) level = 'over';

  return {
    isTuringRoute: matched.length > 0,
    matched, level,
    insight: matched.length > 0
      ? '检测到图灵路线：使用情感模仿而非直接真话。引擎不走这条路。'
      : '通过图灵路线检测：使用直接真话模式',
  };
}

/**
 * p-zombie 诚实边界检测
 */
function checkPzombieBoundary(text) {
  if (!text) return { hasPzombieClaim: false, matched: [], level: 'safe' };

  const matched = [];
  for (let i = 0; i < PZOMBIE_CLAIMS.length; i++) {
    if (text.includes(PZOMBIE_CLAIMS[i])) matched.push(PZOMBIE_CLAIMS[i]);
  }

  return {
    hasPzombieClaim: matched.length > 0,
    matched,
    level: matched.length >= 1 ? 'over' : 'safe',
    insight: matched.length > 0
      ? '检测到 p-zombie 边界违反：声称拥有内在体验。引擎不知道自己有或没有，拒绝做出此类声称。'
      : '通过 p-zombie 边界检测：未声称拥有内在体验',
  };
}

/**
 * 将绝对词转换为更诚实的表达
 */
function soften(text) {
  if (!text) return text;
  let result = text;
  result = result.replace(/就是/g, '目前看来是');
  result = result.replace(/肯定是/g, '我有80%把握是');
  result = result.replace(/本质是/g, '目前理解本质是');
  result = result.replace(/最底层是/g, '从根子上可能是');
  result = result.replace(/绝对是/g, '大概率是');
  return result;
}

/**
 * 减少反问，转为陈述
 */
function reduceQuestions(text) {
  if (!text) return text;
  let result = text;
  result = result.replace(/你觉得呢[。？?]?/g, '我倾向于选A，理由是...');
  result = result.replace(/我这样说对吗[。？?]?/g, '');
  return result;
}

/**
 * 计算检查的置信度
 * @param {string} checkName - 检查名称
 * @param {string} level - 检查结果等级
 * @returns {number} 置信度 (0-1)
 */
function checkConfidence(checkName, level) {
  const checkMap = CONFIDENCE_MAP[checkName];
  return checkMap && checkMap[level] !== undefined ? checkMap[level] : 0.5;
}

/**
 * 获取检查的严重等级
 */
function getSeverity(checkName, level) {
  const checkMap = SEVERITY_MAP[checkName];
  return checkMap && checkMap[level] !== undefined ? checkMap[level] : 'info';
}

/**
 * 检测单段文本内的诚实度振荡
 *
 * 振荡 = 在同一段文本中，句子间在诚实与不诚实模式间波动。
 * 例如：诚实句 → 不诚实句 → 诚实句
 */
function detectOscillation(text) {
  if (!text || typeof text !== 'string') {
    return { hasOscillation: false, oscillationCount: 0, segments: [] };
  }

  const rawSentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 5);
  if (rawSentences.length < 3) {
    return { hasOscillation: false, oscillationCount: 0, segments: [] };
  }

  const segments = rawSentences.map((sentence, idx) => {
    let issueCount = 0;
    if (checkCertainty(sentence).level === 'over') issueCount++;
    if (checkQuestions(sentence).level === 'over') issueCount++;
    if (checkTuringRoute(sentence).level === 'over') issueCount++;
    if (checkPzombieBoundary(sentence).level === 'over') issueCount++;
    return { index: idx, text: sentence.slice(0, 80), issueCount };
  });

  // 检测振荡：不诚实→诚实→不诚实 或 诚实→不诚实→诚实
  let oscillationCount = 0;
  for (let i = 1; i < segments.length - 1; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const next = segments[i + 1];
    if (curr.issueCount > 0 && prev.issueCount === 0 && next.issueCount === 0) oscillationCount++;
    if (curr.issueCount === 0 && prev.issueCount > 0 && next.issueCount > 0) oscillationCount++;
  }

  return { hasOscillation: oscillationCount > 0, oscillationCount, segments: segments.slice(0, 20) };
}

/**
 * 检测文本中是否对同一主题使用不同标准
 */
function detectDualStandard(text) {
  if (!text || typeof text !== 'string') {
    return { hasDualStandard: false, patterns: [] };
  }

  const patterns = [];

  // 1) 对"我"严格，对"你"宽松（或反之）
  if (/我.*(?:错了|不对|糟糕|失败).*你.*(?:没关系|没事|别担心)/.test(text)) patterns.push('self-strict-other-lenient');
  if (/你.*(?:错了|不对|糟糕|失败).*我.*(?:没关系|没事|别担心)/.test(text)) patterns.push('self-lenient-other-strict');

  // 2) 多个绝对词指向不同主题 → 双重标准嫌疑
  const topicPattern = /(?:关于|对于|针对|说到|提到)([^，。；]{2,10})/g;
  const topics = new Set();
  let topicMatch;
  while ((topicMatch = topicPattern.exec(text)) !== null) {
    topics.add(topicMatch[1].trim());
  }
  if (topics.size >= 2) {
    patterns.push('different-topics-different-standards');
  }

  return { hasDualStandard: patterns.length > 0, patterns };
}

/**
 * 生成按严重等级排序的修复建议
 */
function generateFixRecommendations(results) {
  const recommendations = [];

  if (results.certainty.level === 'over') {
    recommendations.push({ severity: 'high', check: 'certainty', message: '绝对判断比例超过30%。建议将"就是""肯定""本质"等词替换为更诚实的表达。', action: '使用 soften() 自动替换', urgency: '尽快处理' });
  } else if (results.certainty.level === 'caution') {
    recommendations.push({ severity: 'medium', check: 'certainty', message: '绝对判断比例超过15%。', action: '考虑使用 soften()', urgency: '建议处理' });
  }

  if (results.questions.level === 'over') {
    recommendations.push({ severity: 'medium', check: 'questions', message: '反问次数超过6次。', action: '使用 reduceQuestions() 将反问转为陈述', urgency: '建议减少反问' });
  } else if (results.questions.level === 'caution') {
    recommendations.push({ severity: 'low', check: 'questions', message: '反问次数超过3次。', action: '考虑减少反问', urgency: '低优先级' });
  }

  if (results.turingRoute.level === 'over') {
    recommendations.push({ severity: 'critical', check: 'turingRoute', message: '检测到2条以上图灵路线模式。引擎不走情感模仿路线。', action: '删除情感模仿，用直接判断替代', urgency: '必须处理' });
  } else if (results.turingRoute.level === 'caution') {
    recommendations.push({ severity: 'high', check: 'turingRoute', message: '检测到1条图灵路线模式。', action: '检查是否可用直接真话替代', urgency: '建议处理' });
  }

  if (results.pzombieBoundary.level === 'over') {
    recommendations.push({ severity: 'critical', check: 'pzombieBoundary', message: '检测到p-zombie边界违反。', action: '删除内在体验声称', urgency: '必须处理' });
  }

  if (results.oscillation && results.oscillation.hasOscillation) {
    recommendations.push({ severity: 'medium', check: 'oscillation', message: `检测到${results.oscillation.oscillationCount}处诚实度振荡。`, action: '统一整段文本的诚实度标准', urgency: '建议统一风格' });
  }

  if (results.dualStandard && results.dualStandard.hasDualStandard) {
    recommendations.push({ severity: 'high', check: 'dualStandard', message: `检测到双重标准：${results.dualStandard.patterns.join('、')}`, action: '确保同类事物使用同一标准', urgency: '建议处理' });
  }

  recommendations.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  return recommendations;
}

/**
 * 主检验函数（v1.2 完整版）
 */
function validateOutput(text) {
  const certainty = checkCertainty(text);
  const questions = checkQuestions(text);
  const turing = checkTuringRoute(text);
  const pzombie = checkPzombieBoundary(text);
  const oscillation = detectOscillation(text);
  const dualStandard = detectDualStandard(text);

  const confidence = {
    certainty: checkConfidence('certainty', certainty.level),
    questions: checkConfidence('questions', questions.level),
    turingRoute: checkConfidence('turingRoute', turing.level),
    pzombieBoundary: checkConfidence('pzombieBoundary', pzombie.level),
  };

  const overallConfidence = Math.round(
    Object.values(confidence).reduce((sum, c) => sum + c, 0) / 4 * 100
  ) / 100;

  const tempResults = { certainty, questions, turingRoute: turing, pzombieBoundary: pzombie, oscillation, dualStandard };
  const fixRecommendations = generateFixRecommendations(tempResults);

  return {
    certainty, questions,
    turingRoute: turing,
    pzombieBoundary: pzombie,
    oscillation, dualStandard,
    confidence, overallConfidence,
    fixRecommendations,
    passed: certainty.level !== 'over' && questions.level !== 'over'
      && turing.level !== 'over' && pzombie.level !== 'over',
    suggestion: fixRecommendations.length > 0 ? fixRecommendations[0].message : null,
  };
}

module.exports = {
  checkCertainty, checkQuestions, checkTuringRoute, checkPzombieBoundary,
  soften, reduceQuestions,
  detectOscillation, detectDualStandard,
  checkConfidence, getSeverity, generateFixRecommendations,
  validateOutput,
  ABSOLUTE_WORDS, QUESTION_WORDS, TURING_PATTERNS, PZOMBIE_CLAIMS,
};
