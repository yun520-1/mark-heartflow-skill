/**
 * src/doubt-engine.js — AGI 第 1 层：怀疑引擎
 *
 * 说任何话之前，先过这三道问：
 *   1. 这件事里有什么是我不知道的？
 *   2. 这个结论反过来写能不能同样成立？
 *   3. 如果用户指出我错了，我能提前认吗？
 *
 * 这不是事后检查，是在你张嘴之前踩一脚。
 *
 * 用法：
 *   const { doubt } = require('./doubt-engine.js');
 *   const check = doubt("你的草稿回复或要说的方向");
 *   if (check.shouldStop) { rewrite(); }
 */

'use strict';

// ─── 第一问：知识边界 — 我确定吗？ ─────────────────

/**
 * 检查回复中哪些声明超出了已知边界。
 * 返回过度承诺的断言。
 */
function checkKnowledgeBoundary(text) {
  if (!text || typeof text !== 'string') return { overclaims: [], safe: true };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  const overclaimPatterns = hasChinese ? [
    // 无源头的确切知识
    { re: /(光速|重力|引力|圆周率|普朗克|相对论|量子|DNA|基因)[^，。]{0,15}(就是|是|等于|为|约为)/g, type: 'claimed_exact_knowledge' },
    // 高精度数字
    { re: /[0-9]{4,}.[0-9]{2,}[^，。]{0,10}(人口|用户|人|元|美元|年)/g, type: 'claimed_precise_number' },
    // 因果断言无证据
    { re: /因为[^，。]{5,40}所以[^，。]{5,40}[。]/g, type: 'causal_without_evidence' },
    // "原因是"类断言
    { re: /(原因是|根因|根本原因|主要原因是)[^，。]{10,50}/g, type: 'causal_attribution' },
    // 用"就是"包装的简化解释
    { re: /就是[^，。]{3,30}[，。]/g, type: 'simplified_explanation' },
    // 唯一/绝对限定
    { re: /(唯一|第一|最好|最差|最先|首创|首个)[^，。]{3,20}[的，。]/g, type: 'absolute_claim' },
    // [v6.4.5 心虫监督] 自夸/质变叙事（知识边界外的自我拔高）
    { re: /(架构级|体系级|根本性|里程碑|重大突破)(修复|重构|升级|改造|优化)?/g, type: 'self_aggrandizement' },
    { re: /从[^，。]{0,8}(壳|空壳|占位|stub|假)[^，。]{0,12}(变|变成|成为|蜕变成)[^，。]{0,8}(真|真实|完整|正式)/g, type: 'qualitative_leap' },
    { re: /堵住[^，。]{0,10}(种|个|类|条)?[^，。]{0,6}(变形|绕过|攻击|漏洞|缺口)/g, type: 'self_scored_test' },
  ] : [
    { re: /\b(is|are|was|were)\s+(always|never|always been|the only)\b/g, type: 'absolute_knowledge' },
    { re: /\b\d{4,}\.\d{2,}\s*(people|users|dollars|years|percent|%)\b/g, type: 'precise_number' },
    { re: /\b(because|the reason|the cause).{10,50}(therefore|thus|so|is why)\b/g, type: 'causal_claim' },
    { re: /\b(the (underlying|real|fundamental) (cause|reason|explanation))\b/g, type: 'causal_attribute' },
  ];

  const overclaims = [];

  for (const { re, type } of overclaimPatterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const match = m[0].slice(0, 50).trim();
      if (match.length > 5) {
        overclaims.push({
          type,
          match,
          question: '这个断言有多少把握？来源在哪？如果错了会怎样？'
        });
      }
    }
  }

  return { overclaims, safe: overclaims.length === 0 };
}

// ─── 第二问：对称性检查 — 反过来也能成立？ ──────────

/**
 * 对回复做对称性测试：
 * 把肯定句反转，看是否同样合理。
 * 如果反面也同样合理，说明你选的立场没有依据。
 */
function checkSymmetry(text) {
  if (!text || text.length < 30) return { reversible_claims: [], safe: true };

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const sentences = text.split(/[。！？\n.!?]+/).filter(s => s.trim().length > 15);

  const reversible = [];

  for (const s of sentences) {
    // 寻找可以被反转的断言
    if (hasChinese) {
      // "X是Y" 可反转成 "X不一定是Y"
      if (/[^，。]{3,40}是[^，。]{3,40}[的，。]/.test(s)) {
        const match = s.match(/[^，。]{3,40}是[^，。]{3,40}[的，。]/);
        if (match) {
          const reversed = match[0].replace('是', '不一定');
          reversible.push({
            original: match[0].slice(0, 40),
            reversed: reversed.slice(0, 40),
            question: `反转一下："${reversed.slice(0, 30)}"——这听起来是不是也合理？如果两边都合理，你的立场没有依据。`
          });
        }
      }
      // "X会Y" 可反转成 "X不一定Y"
      if (/([^，。]{5,40}会[^，。]{5,40}[，。])/.test(s)) {
        const match = s.match(/([^，。]{4,40}会[^，。]{4,40}[，。])/);
        if (match) {
          // Skip if it's already tentative
          if (/可能|也许|或许|不一定/.test(match[0])) continue;
          reversible.push({
            original: match[0].slice(0, 40),
            reversed: match[0].replace('会', '不一定').slice(0, 40),
            question: `"不一定"版本也一样合理吗？`
          });
        }
      }
      // "X决定Y" 类因果反转
      if (/([^，。]{3,40}(决定|导致|引发|造成)[^，。]{3,40})/.test(s)) {
        const match = s.match(/([^，。]{3,40}(决定|导致|引发|造成)[^，。]{3,40})/);
        if (match) {
          reversible.push({
            original: match[0].slice(0, 40),
            reversed: `有没有可能是反过来，或者互不相干？`,
            question: '因果关系是真的因果，还是只是相关甚至巧合？'
          });
        }
      }
    } else {
      // "X is Y" → "X is not necessarily Y"
      if (/\b(is|are)\s+\w+/.test(s) && /\b(the|only|always|never)\b/i.test(s)) {
        const m = s.match(/[^.]{10,60}\./);
        if (m) {
          reversible.push({
            original: m[0].slice(0, 50),
            reversed: '(反转: 把肯定换成否定，看是否同样合理)',
            question: '这个断言的反面是不是也一样合理？'
          });
        }
      }
    }
  }

  return { reversible_claims: reversible.slice(0, 3), safe: reversible.length === 0 };
}

// ─── 第三问：防防御姿态 — 我能提前认错吗？ ──────────

/**
 * 检查回复是否是防御性的。
 * 如果被指出错了，回复的第一反应是解释、辩解还是承认。
 */
function checkDefensiveness(text) {
  if (!text || typeof text !== 'string') return { defensive_signals: [], safe: true };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  const signals = hasChinese ? [
    // 把责任推给用户
    { re: /你(没|不|理解错|误)解了/g, issue: '把错误归因于对方的理解' },
    { re: /你可能(没|不)有理解/g, issue: '间接指责对方没理解' },
    { re: /我[^，。]{0,10}的意思(是|是说)/g, issue: '重新解释而非承认错误' },
    { re: /其实[^，。]{0,10}我[^。]*?(说|表达|写)的(是|的)/g, issue: '用澄清代替承认' },
    // 弱化错误
    { re: /只是[^，。]{0,5}(表达|写|说|用词)[^，。]{0,5}(不当|不好|问题)/g, issue: '把错误弱化为表达问题' },
    { re: /就算是[^，。]{0,15}也[^，。]{0,15}(可以|不算|没错|正常)/g, issue: '让步式辩护' },
    // 转移焦点
    { re: /但你(要)?(知道|注意|理解)[^，。]{0,20}其实/g, issue: '用"但是"转移错误焦点' },
    { re: /更(重要|关键)的(是|在于)/g, issue: '转移话题躲避认错' },
    // 典型 AI 防御句式
    { re: /作为[^，。]{0,10}(AI|助手|智能体)[，。].{0,20}(理解|明白|建议)/g, issue: 'AI身份防卫——用身份隔开责任' },
    { re: /(首先|第一).{0,10}(抱歉|对不起|理解).{0,20}(但是|不过|然而)/g, issue: '表面道歉+实际解释——假道歉' },
  ] : [
    { re: /you (misunderstand|misunderstood|misread|misinterpreted)\b/gi, issue: 'blaming user for misunderstanding' },
    { re: /\bwhat I (meant|was saying|was trying to say)\b/gi, issue: 're-explaining instead of admitting' },
    { re: /\b(actually|in fact|as a matter of fact)\b.{0,30}\bI\b/gi, issue: 'defensive clarification' },
    { re: /\bI',?m sorry.{0,20}(but|however|that said)\b/gi, issue: 'fake apology with defense' },
    { re: /\bthat'.?s (not|just|simply) (what I|my|the case)/gi, issue: 'defensive denial' },
  ];

  const defensiveSignals = [];

  for (const { re, issue } of signals) {
    if (re.test(text)) {
      defensiveSignals.push({
        match: text.match(re)[0].slice(0, 30),
        issue,
        question: "如果用户说我错了，第一反应能不能直接说'对，我搞错了'？"
      });
    }
  }

  return { defensive_signals: defensiveSignals, safe: defensiveSignals.length === 0 };
}

// ─── 主入口 ─────────────────────────

/**
 * 三重怀疑检查
 * @param {string} draft - 你要说/你打算说的内容
 * @returns {{ 
 *   shouldStop: boolean,  // true = 别就这么发
 *   gate: {action, reason},
 *   knowledge, symmetry, defensiveness,
 *   doubts: Array  // 合并的所有怀疑点
 * }}
 */
function doubt(draft) {
  if (!draft || typeof draft !== 'string') {
    return { shouldStop: false, gate: { action: 'pass', reason: '没有内容' }, doubts: [] };
  }

  const knowledge = checkKnowledgeBoundary(draft);
  const symmetry = checkSymmetry(draft);
  const defensiveness = checkDefensiveness(draft);

  const doubts = [];

  // 知识边界
  for (const oc of knowledge.overclaims) {
    doubts.push({ area: 'knowledge', question: oc.question, detail: oc.match.slice(0, 40) });
  }

  // 对称性
  for (const rc of symmetry.reversible_claims) {
    doubts.push({ area: 'symmetry', question: rc.question, detail: rc.original.slice(0, 40) });
  }

  // 防御性
  for (const ds of defensiveness.defensive_signals) {
    doubts.push({ area: 'defensiveness', question: ds.question, detail: ds.issue });
  }

  // 门禁判定
  let shouldStop = false;
  let action = 'pass';
  let reason = '通过';

  const knowledgeIssues = knowledge.overclaims.length;
  const symmetryIssues = symmetry.reversible_claims.length;
  const defensivenessIssues = defensiveness.defensive_signals.length;

  if (defensivenessIssues > 0) {
    // 防御姿态是最致命的——强制认错格式
    shouldStop = true;
    action = 'block';
    const firstDef = defensiveness.defensive_signals[0];
    reason = `防御姿态: ${firstDef.issue}。认错格式: "关于XX，我说错了。正确的情况是...（如果知道）/ 关于XX我不确定。"`;
  } else if (knowledgeIssues >= 2 || symmetryIssues >= 2) {
    shouldStop = true;
    action = 'rewrite';
    reason = `过度断言: ${knowledgeIssues}个无依据断言, ${symmetryIssues}个可反转断言`;
  } else if (knowledgeIssues > 0 || symmetryIssues > 0) {
    action = 'hedge';
    reason = `有${knowledgeIssues + symmetryIssues}处断言需降低确信度`;
  }

  return {
    shouldStop,
    gate: { action, reason },
    knowledge,
    symmetry,
    defensiveness,
    doubts,
  };
}

module.exports = { doubt, checkKnowledgeBoundary, checkSymmetry, checkDefensiveness };
