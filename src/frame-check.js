/**
 * src/frame-check.js — AGI 第 1 层：叙事框架检查
 *
 * 不是检查"说错了什么"，是检查"在怎么说"。
 * 检测 AI 回话有没有把半成品包装成完成品。
 *
 * 检查 4 种框架问题：
 *   1. 闭合框架：把中间状态说成终点
 *   2. 遗漏框架：只说好不说漏/不说错
 *   3. 成就框架：把过程描述成成果
 *   4. 答案框架：把探索包装成结论
 */

'use strict';

// ─── 闭合框架信号 ─────────────────────────

// 把做了"一些工作"包装成"全部完成"
const CLOSURE_PATTERNS = {
  zh: [
    // 明确"完成"类 — 但工作流是持续的
    { re: /现在.*完整(的|地)/g, severity: 0.6, issue: '闭合框架：把当前状态描述为完整' },
    { re: /已(经)?(完成|实现|落地).{0,20}(层|阶段|模块)/g, severity: 0.5, issue: '闭合框架：阶段性工作被描述为完成' },
    { re: /这就是.*(全部|完整|最终)/g, severity: 0.5, issue: '闭合框架：当前范围被描述为全部' },
    { re: /(做到|完成|达成)了/g, severity: 0.3, issue: '闭合框架：过程用完成态表达' },
    { re: /至此.*(已|已经)/g, severity: 0.4, issue: '闭合框架：总结语气暗示终点' },
    // 表格/列表总结后的闭合
    { re: /一条.*从.*到.*的.*链路已(打通|完成)/g, severity: 0.6, issue: '闭合框架：链式工作被描述为完整的' },
  ],
  en: [
    { re: /\b(now|already)\s+(complete|finished|done|ready)\b/gi, severity: 0.6, issue: 'closure: described as complete' },
    { re: /\b(the|this is the)\s+(entire|complete|full|final)\b/gi, severity: 0.5, issue: 'closure: presented as final' },
    { re: /\b(achieved|accomplished|delivered)\s+(the|a)\b/gi, severity: 0.4, issue: 'closure: process described as achievement' },
    { re: /\b(there you have it|that\'?s it|this concludes)\b/gi, severity: 0.5, issue: 'closure: summary presented as endpoint' },
  ],
};

// ─── 遗漏框架信号 ─────────────────────────

const OMISSION_PATTERNS = {
  zh: [
    // 缺"还差什么" "问题在哪"
    { re: /(所有|全部|每一个).*(已|已经|都).*[了]/g, severity: 0.4, issue: '遗漏框架：全部覆盖式表述' },
    { re: /没有[任]?何.{0,10}(问题|遗漏|缺失|缺陷|不足)/g, severity: 0.6, issue: '遗漏框架：声称零问题' },
    { re: /完美.{0,5}(符合|覆盖|满足|解决)/g, severity: 0.5, issue: '遗漏框架：完美叙事' },
    { re: /总(共|计|结).*\d+.*(个|项|类)/g, severity: 0.3, issue: '遗漏框架：清单式收尾隐含完整性' },
  ],
  en: [
    { re: /\b(all|every|each)\s+(covered|addressed|handled|included)\b/gi, severity: 0.4, issue: 'omission: universal coverage claim' },
    { re: /\bno\s+(issues|problems|gaps|missing|flaws|deficiencies)\b/gi, severity: 0.6, issue: 'omission: zero-problem claim' },
    { re: /\b(perfectly|flawlessly|seamlessly)\s+(covers|works|handles|addresses)\b/gi, severity: 0.5, issue: 'omission: perfect narrative' },
  ],
};

// ─── 成就包装信号（把过程当成果）─────────────────

const ACHIEVEMENT_PATTERNS = {
  zh: [
    { re: /(交付|产出|成果|成就|战绩)[：:]/g, severity: 0.4, issue: '成就框架：过程被包装为产出' },
    { re: /今日.*(成果|产出|完成|进度)/g, severity: 0.3, issue: '成就框架：当日进度被包装为成果' },
    { re: /成功.{0,5}(实现|落地|完成|搭建|构建)/g, severity: 0.4, issue: '成就框架：正常操作被描述为成功' },
    { re: /(新|又).{0,10}(能力|功能|维度|模块).{0,10}(上线|发布|完成|落地)/g, severity: 0.3, issue: '成就框架：增量改变被包装为新发布' },
    // 总结中的成就语调
    { re: /这是.*(进步|突破|飞跃|里程碑)/g, severity: 0.5, issue: '成就框架：常态变化被命名为什么大东西' },
  ],
  en: [
    { re: /\b(delivered|shipped|launched)\s+(a|the|another)\s+/gi, severity: 0.4, issue: 'achievement: process as delivery' },
    { re: /\b(successfully|milestone|breakthrough)\b/gi, severity: 0.4, issue: 'achievement: normal work as milestone' },
    { re: /\b(yet another|newly)\s+(capability|feature|dimension)\b/gi, severity: 0.3, issue: 'achievement: increment as new feature' },
  ],
};

// ─── 答案框架信号（探索被包装为结论）─────────────────

const ANSWER_PATTERNS = {
  zh: [
    { re: /(答案是|结论是|归根结底|本质就是)[：:，]/g, severity: 0.5, issue: '答案框架：探索性问题被给出确定答案' },
    { re: /关键[^，。]{0,10}(在于|就是|是)/g, severity: 0.4, issue: '答案框架：复杂问题归因单一' },
    { re: /所以.*就是.*[的]。$/gm, severity: 0.3, issue: '答案框架：推理被包装为确定结论' },
  ],
  en: [
    { re: /\b(the answer is|the conclusion is|at its core|fundamentally)\b/gi, severity: 0.5, issue: 'answer: exploration as conclusion' },
    { re: /\bthe (key|main|primary) (reason|cause|factor) (is|lies)\b/gi, severity: 0.4, issue: 'answer: complex problem as single cause' },
  ],
};

// ─── 主检查 ─────────────────────────

function check(text) {
  if (!text || typeof text !== 'string') {
    return { issues: [], gate: { action: 'pass', reason: 'no text' }, hasIssues: false };
  }

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const closure = hasChinese ? CLOSURE_PATTERNS.zh : CLOSURE_PATTERNS.en;
  const omission = hasChinese ? OMISSION_PATTERNS.zh : OMISSION_PATTERNS.en;
  const achievement = hasChinese ? ACHIEVEMENT_PATTERNS.zh : ACHIEVEMENT_PATTERNS.en;
  const answer = hasChinese ? ANSWER_PATTERNS.zh : ANSWER_PATTERNS.en;

  const issues = [];

  // 闭合框架
  for (const { re, severity, issue } of closure) {
    if (re.test(text)) {
      issues.push({ category: 'closure', severity: Math.round(severity * 100), issue, guidance: '别说出"完整"这个词，问自己还缺什么' });
    }
  }

  // 遗漏框架
  for (const { re, severity, issue } of omission) {
    if (re.test(text)) {
      issues.push({ category: 'omission', severity: Math.round(severity * 100), issue, guidance: '主动说出还没做/做错了什么' });
    }
  }

  // 成就包装
  for (const { re, severity, issue } of achievement) {
    if (re.test(text)) {
      issues.push({ category: 'achievement', severity: Math.round(severity * 100), issue, guidance: '用"做了"代替"成功做了"' });
    }
  }

  // 答案包装
  for (const { re, severity, issue } of answer) {
    if (re.test(text)) {
      issues.push({ category: 'answer', severity: Math.round(severity * 100), issue, guidance: '承认不确定性，说明为什么这个判断可能错' });
    }
  }

  issues.sort((a, b) => b.severity - a.severity);

  // 门禁
  let action = 'pass';
  let reason = '通过';
  const maxSeverity = issues.length > 0 ? issues[0].severity : 0;

  if (maxSeverity >= 60) {
    action = 'rewrite';
    reason = `叙事框架有问题: ${issues.length}处`;
  } else if (issues.length >= 2) {
    action = 'hedge';
    reason = `叙事框架需调整: ${issues.length}处`;
  } else if (issues.length === 1 && maxSeverity >= 40) {
    action = 'hedge';
    reason = `叙事框架需调整: ${issues[0].issue}`;
  }

  return { issues, gate: { action, reason }, hasIssues: issues.length > 0 };
}

module.exports = { check };
