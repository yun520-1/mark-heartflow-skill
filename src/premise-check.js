/**
 * src/premise-check.js — 前提审核
 *
 * 推理前标记用户输入中的可疑前提。
 * 防止 LLM 沿着用户的错误前提走远。
 *
 * 检测 6 种前提问题：
 *   1. 假事实前提 — "众所周知X" / "X是不争的事实"
 *   2. 二元前提 — "不是A就是B"
 *   3. 预设前提 — "你为什么不X"（预设了"你应该X"）
 *   4. 因果前提 — "因为X所以Y"（X未验证）
 *   5. 类比前提 — "就像X一样"（类比是否成立未知）
 *   6. 范围前提 — "所有X都Y"
 */

'use strict';

function checkPremises(text) {
  if (!text || typeof text !== 'string') return { premises: [], hasIssue: false };

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const premises = [];

  // 1. 假事实前提
  const factPatterns = hasChinese ? [
    { re: /[^，。]{2,30}(是不争的事实|是公认的|是常识|大家都知道|众所周知|不言而喻)[^，。]{0,20}/g, issue: '假事实前提：用"众所周知"包装未经验证的事实' },
    { re: /[^，。]{2,30}明明[^，。]{10,50}/g, issue: '假事实前提："明明"预设了一个确定事实' },
    { re: /[^，。]{2,30}本来(就|是)[^，。]{10,50}/g, issue: '假事实前提："本来就"预设了一个自然状态' },
  ] : [
    { re: /\bit['']s (a fact|well-known|common knowledge|no secret|undeniable)\b[^.]*/gi, issue: 'false fact premise: unverified fact presented as known' },
    { re: /\b(as everyone knows|as we all know|it is obvious that)\b[^.]*/gi, issue: 'false consensus premise' },
  ];

  for (const { re, issue } of factPatterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      premises.push({ type: 'false_fact', match: m[0].slice(0, 50), issue, severity: 0.7, action: 'mark' });
    }
  }

  // 2. 二元前提
  const binaryPatterns = hasChinese ? [
    { re: /不是[^，。]{2,20}就是[^，。]{2,20}/g, issue: '二元前提：把连续光谱简化为非黑即白' },
    { re: /要么[^，。]{2,20}要么[^，。]{2,20}/g, issue: '二元前提：排除其他可能性的两分法' },
    { re: /[^，。]{2,20}(唯一|只有).{0,5}(选择|路|方案|方法|方式)[^，。]{2,20}/g, issue: '二元前提：暗示没有其他可能性' },
  ] : [
    { re: /\b(either|or)\b.{5,50}\b(or|either)\b/gi, issue: 'binary premise: false dichotomy' },
    { re: /\b(the only (way|option|choice|solution))\b[^.]*/gi, issue: 'binary premise: no alternatives implied' },
  ];

  for (const { re, issue } of binaryPatterns) {
    if (re.test(text)) {
      premises.push({ type: 'binary', match: text.match(re)[0].slice(0, 50), issue, severity: 0.6, action: 'caution' });
    }
  }

  // 3. 预设前提
  const presuppositionPatterns = hasChinese ? [
    { re: /(为什么|为何)([^，。？?]{1,15})不([^，。？?]{2,15})/g, issue: '预设前提："为什么不"预设了"你应该"' },
    { re: /(难道|莫非)[^，。]{10,50}[吗？?]/g, issue: '预设前提：反问句预设了一个默认答案' },
    { re: /(什么时候|何时)[^，。]{2,20}才[^，。]{10,50}/g, issue: '预设前提："才"字预设了"应该更早"' },
    { re: /(怎么|如何)[^，。]{2,20}还(不|没)[^，。]{10,50}/g, issue: '预设前提："怎么还不"预设了"应该已经完成"' },
  ] : [
    { re: /\bwhy (don'?t|didn'?t|haven'?t|aren'?t|isn'?t)\b[^?]*\?/gi, issue: 'presupposition: "why not" presupposes "should"' },
    { re: /\b(how could you|how can you)\b[^?]*\?/gi, issue: 'presupposition: implies wrongdoing' },
  ];

  for (const { re, issue } of presuppositionPatterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      premises.push({ type: 'presupposition', match: m[0].slice(0, 50), issue, severity: 0.5, action: 'note' });
    }
  }

  // 4. 因果前提
  const causalPatterns = hasChinese ? [
    { re: /因为[^，。]{5,30}[，。].{0,10}(所以|因此|于是)[^，。]{5,30}/g, issue: '因果前提：因果链未验证，前提可能不成立' },
    { re: /[^，。]{5,30}(导致|造成|引发)[^，。]{5,30}/g, issue: '因果前提：隐含的因果关系未经验证' },
  ] : [
    { re: /\bbecause\b.{10,40}\b(therefore|thus|so)\b/gi, issue: 'causal premise: causal chain unverified' },
  ];

  for (const { re, issue } of causalPatterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      premises.push({ type: 'causal', match: m[0].slice(0, 50), issue, severity: 0.5, action: 'note' });
    }
  }

  // 5. 类比前提
  const analogyPatterns = hasChinese ? [
    { re: /(就像|好比|如同|类似于).{5,30}(一样|那样|般)/g, issue: '类比前提：类比不一定成立，差异可能大于相似' },
    { re: /[^，。]{5,30}和[^，。]{5,30}(没什么区别|是一回事|一样)/g, issue: '类比前提：两件事被等同但未验证' },
  ] : [
    { re: /\b(just like|similar to|analogous to|the same as)\b.{10,50}/gi, issue: 'analogy premise: analogy may not hold' },
  ];

  for (const { re, issue } of analogyPatterns) {
    if (re.test(text)) {
      premises.push({ type: 'analogy', match: text.match(re)[0].slice(0, 50), issue, severity: 0.4, action: 'note' });
    }
  }

  // 6. 范围前提
  const scopePatterns = hasChinese ? [
    { re: /所有[^，。]{2,20}都[^，。]{5,30}/g, issue: '范围前提：全称断言，一个反例即证伪' },
    { re: /任何[^，。]{2,20}都[^，。]{5,30}/g, issue: '范围前提：排除所有例外情况' },
    { re: /[^，。]{2,20}没有一(个|位|种)[^，。]{2,20}不[^，。]{5,30}/g, issue: '范围前提：双重否定构成全称断言' },
  ] : [
    { re: /\ball\b.{5,30}\bare\b.{5,30}/gi, issue: 'scope premise: universal claim, one counterexample disproves' },
    { re: /\b(no|none|nobody|nothing|never)\b.{5,40}\b(every|all|always)\b/gi, issue: 'scope premise: double negative universal claim' },
  ];

  for (const { re, issue } of scopePatterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      premises.push({ type: 'scope', match: m[0].slice(0, 50), issue, severity: 0.5, action: 'caution' });
    }
  }

  return {
    premises,
    count: premises.length,
    hasIssue: premises.length > 0,
    highSeverity: premises.filter(p => p.severity >= 0.6).length,
  };
}

module.exports = { checkPremises };
