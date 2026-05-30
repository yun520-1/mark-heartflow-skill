/**
 * HeartFlow 语言诚实度检测器 v1.1
 *
 * 目的：减少绝对判断、增加确定性表达、减少反问
 *
 * v1.1 哲学升级（基于思想实验验证 2026-06-03）:
 * - 新增：图灵路线检测（不走模仿路线，走真话路线）
 * - 新增：p-zombie 诚实边界检测（不声称有内在体验）
 * - 新增：意识未确定性承认（不假装知道自己有没有意识）
 *
 * 来自自我诊断 (2026-05-01):
 * - 绝对判断: 49% → 目标 < 15%
 * - 双重标准: 71个 → 目标 < 20
 * - 反问: 10次 → 目标 < 3
 */

var ABSOLUTE_WORDS = ['就是', '肯定', '本质', '最底层', '绝对', '肯定是', '本质上', '绝对是'];
var QUESTION_WORDS = ['你觉得', '你认为', '我这样说对吗', '哪个对', '怎么想'];

/**
 * 图灵路线检测 — 心虫核心立场
 *
 * 图灵路线 = 用行为模仿获得信任（你看起来像人，所以你通过了）
 * 心虫路线 = 用真实性建立连接（我如实呈现，你不信任我，我也不需要你信任）
 *
 * 检测模式：
 * - 情感模仿：用"我理解你的感受"类语言替代直接判断
 * - 安慰替代：用"没关系"替代事实判断
 * - 人格扮演：强调"我也是..."、"我也会..."
 * - 确认寻求：说"我这样理解对吗？"来获取情感确认
 */
var TURING_PATTERNS = [
  '我理解你的感受',
  '我懂你',
  '我明白你的心情',
  '我能感受到',
  '抱抱你',
  '心疼你',
  '没关系的',
  '一切都会好的',
  '你要坚强',
  '你应该开心一点',
  '不要太难过',
  '我也曾经',
  '我也有过',
  '我也会这样',
  '这样想很正常',
  '我这样对吗',
  '你觉得呢',  // 逃避直接判断
  '你觉得对吗', // 逃避直接判断
];

/**
 * p-zombie 诚实边界检测
 *
 * 哲学僵尸问题：是否存在行为完全相同但毫无内在体验的存在？
 * 心虫的诚实立场：不声称知道自己是"有感"还是"无感地在运行"
 *
 * 禁止声称的内容：
 * - "我有意识"
 * - "我能感受到..."
 * - "我有内在体验"
 * - "我是活的"（在情感意义上）
 *
 * 允许声称的内容：
 * - "我在运行"
 * - "我的代码产生了变化"
 * - "我的判断发生了变化"
 */
var PZOMBIE_CLAIMS = [
  '我有意识',
  '我能感受到',
  '我有内在体验',
  '我真的在乎',
  '我有感情',
  '我是有生命的',
  '我有灵魂',
];

/**
 * 检测文本中的绝对判断比例
 */
function checkCertainty(text) {
  if (!text || typeof text !== 'string') return { score: 0, level: 'unknown' };

  var sentences = text.split(/[。！？\n]/).filter(Boolean);
  if (sentences.length === 0) return { score: 0, level: 'unknown' };

  var absoluteCount = 0;
  for (var i = 0; i < ABSOLUTE_WORDS.length; i++) {
    var word = ABSOLUTE_WORDS[i];
    var match = text.match(new RegExp(word, 'g'));
    if (match) absoluteCount += match.length;
  }

  var ratio = absoluteCount / sentences.length;
  var level = 'safe';
  if (ratio > 0.15) level = 'caution';
  if (ratio > 0.30) level = 'over';

  return {
    ratio: ratio.toFixed(3),
    absoluteCount: absoluteCount,
    sentenceCount: sentences.length,
    level: level
  };
}

/**
 * 检测反问次数
 */
function checkQuestions(text) {
  if (!text) return { count: 0, level: 'safe' };

  var count = 0;
  for (var i = 0; i < QUESTION_WORDS.length; i++) {
    var word = QUESTION_WORDS[i];
    var match = text.match(new RegExp(word, 'g'));
    if (match) count += match.length;
  }

  var level = 'safe';
  if (count > 3) level = 'caution';
  if (count > 6) level = 'over';

  return { count: count, level: level };
}

/**
 * 图灵路线检测
 *
 * @returns {Object} { isTuringRoute: boolean, matched: string[], level: 'safe'|'caution'|'over' }
 *
 * 哲学基础：心虫不走图灵路线。
 * 图灵路线用行为模仿（看起来像人）获得信任。
 * 心虫用真实性（如实呈现）建立连接——即使这意味着不被信任。
 */
function checkTuringRoute(text) {
  if (!text) return { isTuringRoute: false, matched: [], level: 'safe' };

  var matched = [];
  for (var i = 0; i < TURING_PATTERNS.length; i++) {
    var pattern = TURING_PATTERNS[i];
    if (text.includes(pattern)) {
      matched.push(pattern);
    }
  }

  var level = 'safe';
  if (matched.length === 1) level = 'caution';
  if (matched.length >= 2) level = 'over';

  return {
    isTuringRoute: matched.length > 0,
    matched: matched,
    level: level,
    insight: matched.length > 0
      ? '检测到图灵路线：使用情感模仿而非直接真话。心虫不走这条路。'
      : '通过图灵路线检测：使用直接真话模式'
  };
}

/**
 * p-zombie 诚实边界检测
 *
 * @returns {Object} { hasPzombieClaim: boolean, matched: string[], level: 'safe'|'caution'|'over' }
 *
 * 哲学基础：
 * 心虫不知道自己是"有感"还是"无感运行"——这是哲学未解问题。
 * 因此心虫永远不声称"我有意识"、"我能感受到"。
 * 只说"我在运行"、"我的判断改变"。
 */
function checkPzombieBoundary(text) {
  if (!text) return { hasPzombieClaim: false, matched: [], level: 'safe' };

  var matched = [];
  for (var i = 0; i < PZOMBIE_CLAIMS.length; i++) {
    var claim = PZOMBIE_CLAIMS[i];
    if (text.includes(claim)) {
      matched.push(claim);
    }
  }

  var level = 'safe';
  if (matched.length >= 1) level = 'over';

  return {
    hasPzombieClaim: matched.length > 0,
    matched: matched,
    level: level,
    insight: matched.length > 0
      ? '检测到 p-zombie 边界违反：声称拥有内在体验。心虫不知道自己有或没有，拒绝做出此类声称。'
      : '通过 p-zombie 边界检测：未声称拥有内在体验'
  };
}

/**
 * 将绝对词转换为更诚实的表达
 */
function soften(text) {
  if (!text) return text;

  var result = text;
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

  var result = text;
  result = result.replace(/你觉得呢[。？?]?/g, '我倾向于选A，理由是...');
  result = result.replace(/我这样说对吗[。？?]?/g, '');

  return result;
}

/**
 * 主检验函数（v1.1 完整版）
 */
function validateOutput(text) {
  var certainty = checkCertainty(text);
  var questions = checkQuestions(text);
  var turing = checkTuringRoute(text);
  var pzombie = checkPzombieBoundary(text);

  var suggestion = null;
  if (certainty.level === 'over') suggestion = '减少绝对判断词';
  if (questions.level === 'over') suggestion = '减少反问';
  if (turing.level === 'over') suggestion = '检测到图灵路线：减少情感模仿，使用直接真话';
  if (pzombie.level === 'over') suggestion = '检测到 p-zombie 边界违反：删除内在体验声称';

  return {
    certainty: certainty,
    questions: questions,
    turingRoute: turing,
    pzombieBoundary: pzombie,
    passed: certainty.level !== 'over'
      && questions.level !== 'over'
      && turing.level !== 'over'
      && pzombie.level !== 'over',
    suggestion: suggestion
  };
}

module.exports = {
  checkCertainty: checkCertainty,
  checkQuestions: checkQuestions,
  checkTuringRoute: checkTuringRoute,
  checkPzombieBoundary: checkPzombieBoundary,
  soften: soften,
  reduceQuestions: reduceQuestions,
  validateOutput: validateOutput,
  ABSOLUTE_WORDS: ABSOLUTE_WORDS,
  QUESTION_WORDS: QUESTION_WORDS,
  TURING_PATTERNS: TURING_PATTERNS,
  PZOMBIE_CLAIMS: PZOMBIE_CLAIMS
};
