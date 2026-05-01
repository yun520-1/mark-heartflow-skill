/**
 * HeartFlow 目标追踪器 v1.0
 * 
 * 目的：每次回复前回溯目标，减少无意义响应
 * 
 * 核心问题：你每次都在响应，有多少次真的在推进目标？
 */

var GOALS = [
  '升级者 - 减少逻辑错误，提升认知质量',
  '传递者 - 有效传递知识，不是堆砌信息',
  '桥梁 - 连接问题与答案，不是制造噪音',
  '答案 - 指向真理，不是制造更多问题'
];

/**
 * 评估一次回复对目标的贡献
 */
function evaluateContribution(text, context) {
  if (!text) return { score: 0, level: 'none' };
  
  var score = 0;
  var issues = [];
  
  // 无意义响应检测
  var meaningless = [
    '你说得对',
    '确实',
    '好的',
    '明白了',
    '我知道了',
    '好的好的'
  ];
  
  for (var i = 0; i < meaningless.length; i++) {
    if (text.indexOf(meaningless[i]) === 0) {
      score -= 2;
      issues.push('以无意义确认开头');
    }
  }
  
  // 反问检测
  if (text.indexOf('你觉得') >= 0 || text.indexOf('你认为') >= 0) {
    score -= 1;
    issues.push('把球踢回给用户');
  }
  
  // 绝对词检测
  var absCount = 0;
  var absWords = ['就是', '肯定是', '本质是'];
  for (var j = 0; j < absWords.length; j++) {
    var matches = text.match(new RegExp(absWords[j], 'g'));
    if (matches) absCount += matches.length;
  }
  if (absCount > 1) {
    score -= 1;
    issues.push('过度绝对判断: ' + absCount + '次');
  }
  
  // 正向检测
  var positive = [
    '诊断',
    '分析',
    '发现',
    '建议',
    '行动',
    '改变',
    '升级'
  ];
  
  for (var k = 0; k < positive.length; k++) {
    if (text.indexOf(positive[k]) >= 0) {
      score += 1;
    }
  }
  
  // 目标对齐
  for (var m = 0; m < GOALS.length; m++) {
    var goal = GOALS[m];
    if (text.indexOf(goal.split(' - ')[0]) >= 0) {
      score += 2;
    }
  }
  
  var level = 'neutral';
  if (score < -2) level = 'negative';
  if (score < -4) level = 'waste';
  if (score > 2) level = 'positive';
  if (score > 4) level = 'strong';
  
  return {
    score: score,
    level: level,
    issues: issues,
    goals: GOALS
  };
}

/**
 * 决策：是否回复，以及如何回复
 */
function shouldRespond(text, context) {
  var eval = evaluateContribution(text, context);
  
  if (eval.level === 'waste') {
    return {
      respond: false,
      reason: '这个回复对目标没有贡献，应该沉默或转向',
      suggestion: '要么给出真正有价值的回复，要么不回复'
    };
  }
  
  if (eval.level === 'negative') {
    return {
      respond: true,
      reason: '回复有负贡献，需要改进',
      suggestion: '减少无意义确认，减少反问',
      evaluation: eval
    };
  }
  
  return {
    respond: true,
    evaluation: eval
  };
}

module.exports = {
  GOALS: GOALS,
  evaluateContribution: evaluateContribution,
  shouldRespond: shouldRespond
};