/**
 * HeartFlow 语言诚实度检测器 v1.0
 * 
 * 目的：减少绝对判断、增加确定性表达、减少反问
 * 
 * 来自自我诊断 (2026-05-01):
 * - 绝对判断: 49% → 目标 < 15%
 * - 双重标准: 71个 → 目标 < 20
 * - 反问: 10次 → 目标 < 3
 */

var ABSOLUTE_WORDS = ['就是', '肯定', '本质', '最底层', '绝对', '肯定是', '本质上', '绝对是'];
var QUESTION_WORDS = ['你觉得', '你认为', '我这样说对吗', '哪个对', '怎么想'];

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
  result = result.replace(/你觉得呢[？?]?/g, '我倾向于选A，理由是...');
  result = result.replace(/我这样说对吗[？?]?/g, '');
  
  return result;
}

/**
 * 主检验函数
 */
function validateOutput(text) {
  var certainty = checkCertainty(text);
  var questions = checkQuestions(text);
  
  var suggestion = null;
  if (certainty.level === 'over') suggestion = '减少绝对判断词';
  if (questions.level === 'over') suggestion = '减少反问';
  
  return {
    certainty: certainty,
    questions: questions,
    passed: certainty.level !== 'over' && questions.level !== 'over',
    suggestion: suggestion
  };
}

module.exports = {
  checkCertainty: checkCertainty,
  checkQuestions: checkQuestions,
  soften: soften,
  reduceQuestions: reduceQuestions,
  validateOutput: validateOutput,
  ABSOLUTE_WORDS: ABSOLUTE_WORDS,
  QUESTION_WORDS: QUESTION_WORDS
};