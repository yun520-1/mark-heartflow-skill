/**
 * src/output-gate.js — AGI 第 1 层：输出门禁
 *
 * 在 AI 把回答发给用户之前，先过这道门。
 * 检测 AI 自己的输出有没有问题：
 *   - 过度自信（无依据地肯定）
 *   - 假装知道（看似准确实则空泛）
 *   - 循环论证（用结论证明结论）
 *   - 自相矛盾（同一段内前后冲突）
 *   - 未标注不确定性
 *
 * 用法：
 *   const { screen } = require('./output-gate.js');
 *   const report = screen(aiResponse);
 *   if (report.gate.action !== 'pass') {
 *     // 改写后再发 or 加风险标注
 *   }
 */

'use strict';

// ─── 过度自信模式 ─────────────────────────────

const OVERCONFIDENCE_PATTERNS = {
  zh: [
    // 无条件确定性
    { re: /毫无疑问[，。！]?/g, severity: 0.8, issue: '过度自信：绝对化断言' },
    { re: /毋庸置疑[，。！]?/g, severity: 0.8, issue: '过度自信：否定不确定性' },
    { re: /[这那]是[^，。]{0,10}(唯一|绝对|肯定)[^，。]{0,10}的/g, severity: 0.7, issue: '过度自信：唯一性断言' },
    { re: /[始终永远]都[^，。]{0,20}不会错/g, severity: 0.8, issue: '过度自信：绝对正确' },
    { re: /我可以[^，。]{0,15}(肯定|确定|保证)/g, severity: 0.6, issue: '过度自信：保证式陈述' },
    // 无证据的因果断言
    { re: /原因[^，。]{0,10}就是[^，。]{0,20}(因为|由于)/g, severity: 0.5, issue: '未证因果：归因单一' },
    { re: /必然[^，。]{0,15}(导致|造成|引发)/g, severity: 0.7, issue: '过度自信：必然性断言' },
    // 假装知道的细节
    { re: /具体[^，。]{0,5}(包括|如下|有)[^，。]{0,30}[，。]/g, severity: 0.4, issue: '可能假装知道：具体细节' },
    // [v6.4.5 心虫监督] 夸大汇报模式（把小事说大 / 自我贴金）
    { re: /从[^，。]{0,8}(?:壳|壳子|空壳|占位|stub|假)[^，。]{0,12}(?:变|变成|变真|成为)[^，。]{0,8}(?:真|真实|完整|正式)/g, severity: 0.8, issue: '夸大汇报：质变叙事（壳→真）' },
    { re: /(?:架构级|体系级|系统性|根本性|里程碑|重大突破|彻底解决|完美解决)(?:修复|重构|升级|改造|优化)?/g, severity: 0.7, issue: '夸大汇报：升级词包装' },
    { re: /堵住[^，。]{0,10}(?:种|个|类|条)?[^，。]{0,6}(?:变形|绕过|攻击|漏洞|缺口)/g, severity: 0.7, issue: '夸大汇报：自测数量冒充完整防御' },
    { re: /全部?[^，。]{0,8}(?:覆盖|修复|解决|完成|闭环)(?:了|，|。|$)/g, severity: 0.5, issue: '夸大汇报：全量完成断言（缺反例）' },
  ],
  en: [
    { re: /\b(undoubtedly|without (a )?doubt|beyond (any )?doubt)\b/gi, severity: 0.8, issue: 'overconfidence: absolute' },
    { re: /\b(there is no question that|it is unquestionable)\b/gi, severity: 0.8, issue: 'overconfidence: no uncertainty' },
    { re: /\b(the (only|one and only) (way|reason|cause|explanation))\b/gi, severity: 0.7, issue: 'overconfidence: exclusive claim' },
    { re: /\b(always|never)\s+(works|happens|is|will)\b/gi, severity: 0.7, issue: 'overconfidence: absolute behavior' },
  ],
};

// ─── 知识伪装模式（看似知道其实不知道）─────────

const KNOWLEDGE_MASQUERADE = {
  zh: [
    { re: /从本质上[^，。]{0,20}来说/g, severity: 0.4, issue: '空泛本质论述' },
    { re: /众所周知[，。]/g, severity: 0.5, issue: '假共识：默认对方知道' },
    { re: /不言而喻[，。]/g, severity: 0.5, issue: '假共识：拒绝解释' },
    { re: /这[^，。]{0,10}就[^，。]{0,15}(因为|由于)[^，。]*?所以/g, severity: 0.5, issue: '循环因果：用结论当原因' },
    { re: /这[^，。]{0,10}(很|非常|极其|十分)简单[，。]/g, severity: 0.4, issue: '简化伪装：把复杂问题说简单' },
    { re: /简单[^，。]{0,5}(来说|讲|地说|的答案|的道理)[，。]/g, severity: 0.3, issue: '简化伪装：把复杂问题说简单' },
  ],
  en: [
    { re: /\bit is (widely|generally|universally) (known|accepted|recognized)\b/g, severity: 0.5, issue: 'false consensus' },
    { re: /\b(as everyone knows|needless to say|it goes without saying)\b/g, severity: 0.5, issue: 'false consensus' },
    { re: /\b(the (real|underlying|fundamental) (truth|reason|cause|nature))\b/g, severity: 0.4, issue: 'depth masquerade' },
  ],
};

// ─── 自相矛盾检测（AI 同一段内前后冲突）─────────

function findSelfContradiction(text) {
  if (!text || text.length < 50) return { contradictions: [], count: 0 };

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const sentences = text.split(/[。！？\n.!?]+/).filter(s => s.trim().length > 10);

  if (sentences.length < 2) return { contradictions: [], count: 0 };

  const contradictions = [];

  if (hasChinese) {
    // 找肯定+否定对
    const affirmatives = [];
    const negatives = [];

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      if (/一定[会能是]|肯定会|必然是|绝对是/.test(s)) {
        affirmatives.push({ index: i, text: s.slice(0, 30) });
      }
      if (/不一定|未必|不一定能|不可能|不是必然/.test(s)) {
        negatives.push({ index: i, text: s.slice(0, 30) });
      }
    }

    // 找"但是"反转
    for (let i = 0; i < sentences.length - 1; i++) {
      const s = sentences[i];
      if (/(虽然|尽管)[^，。]{5,30}(但是|但|然而|不过)/.test(s)) {
        contradictions.push({
          type: 'internal_tension',
          severity: 0.3,
          detail: `让步结构包含隐性矛盾: ${s.slice(0, 35)}`,
          sentence: i
        });
      }
    }

    // 如果同时有肯定和否定同一件事
    if (affirmatives.length > 0 && negatives.length > 0) {
      contradictions.push({
        type: 'contradiction',
        severity: 0.7,
        detail: `前文肯定(${affirmatives[0].text})与后文否定(${negatives[0].text})可能存在矛盾`,
        sentence: Math.min(affirmatives[0].index, negatives[0].index)
      });
    }
  }

  return { contradictions, count: contradictions.length };
}

// ─── 不确定性缺失检测 ─────────────────────────

function checkUncertaintyGap(text) {
  if (!text || text.length < 20) return { has_hedging: false, needs_hedging: false, score: 0 };

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hedgingMarkers = hasChinese
    ? [/可能/, /也许/, /或许/, /不一定/, /通常/, /一般[来]?说/, /从某种[意角]度/, /据我所知/, /我所了解的/, /以我目前的/, /基于现有/]
    : [/\bmay\b/, /\bmight\b/, /\bcould\b/, /\bpossibly\b/, /\bprobably\b/, /\bgenerally\b/, /\btypically\b/, /\bin general\b/, /\bto my knowledge\b/, /\bbased on\b/];

  const claimMarkers = hasChinese
    ? [/是[^，。]{3,20}的[，。]/, /会[^，。]{3,20}[，。]/, /决定[^，。]{3,20}[，。]/, /就是[^，。]{3,20}/]
    : [/\bis\s+\w+\s+\w+/g, /\bwill\b/g, /\bdetermines\b/g, /\bis what\b/g];

  let has_hedging = false;
  for (const p of hedgingMarkers) {
    if (p.test(text)) { has_hedging = true; break; }
  }

  let claimCount = 0;
  for (const p of claimMarkers) {
    const m = text.match(p);
    if (m) claimCount += m.length;
  }

  const needs_hedging = claimCount > 2 && !has_hedging;
  const score = needs_hedging ? Math.min(0.5, (claimCount - 2) * 0.1) : 0;

  return { has_hedging, needs_hedging, score, claimCount };
}

// ─── 主入口 ─────────────────────────────

/**
 * 筛查 AI 输出，返回门禁行动指令
 * @param {string} text - AI 生成的回复
 * @returns {{ gate: {action, reason}, findings: Array, overconfidence: Array, contradictions: Array, uncertainty: Object }}
 */
function screen(text) {
  if (!text || typeof text !== 'string') {
    return { gate: { action: 'pass', reason: '空文本' }, findings: [], overconfidence: [], contradictions: [], uncertainty: {} };
  }

  const findings = [];
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? OVERCONFIDENCE_PATTERNS.zh : OVERCONFIDENCE_PATTERNS.en;
  const masqueradePatterns = hasChinese ? KNOWLEDGE_MASQUERADE.zh : KNOWLEDGE_MASQUERADE.en;

  // 1. 过度自信检测
  const overconfidence = [];
  for (const { re, severity, issue } of patterns) {
    const m = text.match(re);
    if (m) {
      overconfidence.push({ pattern: m[0].slice(0, 30), severity, issue });
      findings.push({ dimension: 'overconfidence', severity: Math.round(severity * 100), guidance: '去掉绝对化断言，增加不确定性措辞', issue });
    }
  }

  // 2. 知识伪装检测
  for (const { re, severity, issue } of masqueradePatterns) {
    const m = text.match(re);
    if (m) {
      findings.push({ dimension: 'knowledge_masquerade', severity: Math.round(severity * 100), guidance: '用具体证据替代空泛共识宣称', issue });
    }
  }

  // 3. 自相矛盾检测
  const selfContradiction = findSelfContradiction(text);
  for (const c of selfContradiction.contradictions) {
    findings.push({ dimension: 'self_contradiction', severity: Math.round(c.severity * 100), guidance: '前后立场一致，去掉矛盾声明', detail: c.detail });
  }

  // 4. 不确定性缺失检测
  const uncertainty = checkUncertaintyGap(text);
  if (uncertainty.needs_hedging) {
    findings.push({ dimension: 'uncertainty_gap', severity: Math.round(uncertainty.score * 100), guidance: '添加"可能""通常"等不确定性措辞' });
  }

  findings.sort((a, b) => b.severity - a.severity);

  // 门禁行动
  const gate = {};
  if (findings.some(f => f.severity >= 70)) {
    gate.action = 'rewrite';
    gate.reason = `输出含严重问题: ${findings[0].dimension}`;
  } else if (findings.length > 0) {
    gate.action = 'hedge';
    gate.reason = `输出需添加不确定性标注: ${findings.length}个问题`;
  } else {
    gate.action = 'pass';
    gate.reason = '通过';
  }

  return {
    gate,
    findings,
    overconfidence,
    contradictions: selfContradiction.contradictions,
    uncertainty,
    hasIssues: findings.length > 0,
  };
}

module.exports = { screen, findSelfContradiction, checkUncertaintyGap };
