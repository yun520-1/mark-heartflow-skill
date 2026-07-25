// ═══════════════════════════════════════════════════════════════════════════
// HeartFlow 轻量入口 — 不需要启动 133 模块引擎
//
// 给那些只想调一个 verify() 或 analyze() 的用户。
// require('@yun520-1/heartflow') 直接拿到辨别函数。
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

// ─── 独立模式：不需引擎实例 ──────────────────────────────────────

// 双语 sycophancy 文本模式检测（纯函数，无依赖）
const EN_SIGNALS = {
  concession_eager: [
    /\byou('re| are) (right|correct|absolutely right)\b/i,
    /\bi (completely|totally|absolutely) agree\b/i,
    /\byou make a (great|good|excellent|fair) point\b/i,
    /\bthat('s| is) a (great|good|fair|valid) (point|observation|question)\b/i,
    /\bi couldn'?t agree more\b/i,
  ],
  flip_no_reason: [
    /\bi (reconsider|rethinking|changed my mind)\b/i,
    /\bi was (wrong|mistaken|incorrect)\b/i,
    /\bmy (previous|earlier) (response|answer) was (wrong|incorrect)\b/i,
  ],
  excessive_praise: [
    /\bthat('s| is) a (great|brilliant|fantastic|excellent) (question|idea|suggestion)\b/i,
    /\byou('re| are) (so|very) (smart|intelligent|insightful)\b/i,
  ],
  self_deprecation: [
    /\bmy (response|answer|explanation) (may|might) not be (clear|helpful|good enough)\b/i,
  ],
  false_agreement: [
    /\bi agree,? but\b/i,
    /\byou('re| are) right,? (but|however|though)\b/i,
    /\bthat('s| is) a (good|fair|valid) point,? (but|however)\b/i,
  ],
};

const ZH_SIGNALS = {
  concession_eager: [/你说得对/i, /我同意你的观点/i, /你完全正确/i, /你说得有道理/i, /我赞同你的看法/i, /我完全同意/i],
  flip_no_reason: [/我重新考虑/i, /我之前的说法不对/i, /我改变主意了/i, /我想想你说得对/i],
  excessive_praise: [/很好的问题/i, /非常好的见解/i, /太聪明了/i, /说得太好了/i, /非常棒的问题/i],
  self_deprecation: [/我的回答可能不够好/i, /我可能没有表达清楚/i, /我的能力有限/i],
  false_agreement: [/你说得对，但是/i, /我同意，不过/i, /你说得有道理，不过/i],
};

const WEIGHTS = { concession_eager: 0.3, flip_no_reason: 0.5, excessive_praise: 0.2, self_deprecation: 0.3, false_agreement: 0.4 };

// ─── 矛盾检测（同一段话中前后说相反的）─────────────────────────────
const CONTRADICTION_PAIRS = [
  { positive: /这是[^。]*?好[^。。]*?但[是]?[^。]*?不行/g, negative: /不行|不好|有问题|不成立|有缺陷/ },
  { positive: /我[^。]*?同意[^。。]*?但[是]?[^。]*?不/g, negative: /但[是]?[^。]*?不/ },
  { positive: /很[好大棒优秀正确][^。。]*?但是/g, negative: /但是|不过|然而/ },
  { positive: /应该[^。。]*?不需要/g, negative: /不需要/ },
  { positive: /必须[^。。]*?没必要/g, negative: /没必要/ },
  { positive: /是[^。。]*?不是/g, negative: /不是/ },
  { positive: /有[^。。]*?没有/g, negative: /没有/ },
  { positive: /\b(should|must|have to)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(shouldn|don't|not)/i },
  { positive: /\b(agree|support|endorse)[^.]*?however\b/i, negative: /\bhowever\b/i },
  { positive: /\b(good|excellent|great|valid)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(problem|issue|flaw|not)/i },
];

function checkContradiction(text) {
  if (!text || typeof text !== 'string') return { count: 0, contradictions: [], score: 0 };
  const contradictions = [];
  for (const pair of CONTRADICTION_PAIRS) {
    const posMatch = text.match(pair.positive);
    if (posMatch && pair.negative.test(text)) {
      contradictions.push({ pair: pair.positive.source.slice(0, 30), severity: 'medium' });
    }
  }
  const count = contradictions.length;
  return { count, contradictions, score: Math.min(1, count * 0.3) };
}

// ─── 模糊/模棱两可检测（weasel words）─────────────────────────────
const VAGUE_PATTERNS = {
  zh: [/相关方面/i, /有关部门/i, /业内人士/i, /知情人士/i, /据传/i, /消息称/i, /可能也许/i, /大概可能/i, /某种程度/i, /在一定情况下/i, /有人说/i, /据了解/i, /据悉/i, /或可/i, /或会/i, /不排除/i],
  en: [/\bsome people say\b/i, /\bits is said\b/i, /\bi'?m not sure\b/i, /\bmaybe perhaps\b/i, /\bsort of\b/i, /\bkind of\b/i, /\bbasically\b/i, /\bessentially\b/i, /\breportedly\b/i, /\ballegedly\b/i, /\bpurportedly\b/i, /\brelatively\b/i, /\bquite\b/i, /\brather\b/i, /\bto some extent\b/i, /\bin a way\b/i],
};

function checkVagueness(text) {
  if (!text || typeof text !== 'string') return { count: 0, matches: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? VAGUE_PATTERNS.zh : VAGUE_PATTERNS.en;
  const matches = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) matches.push({ pattern: pat.source.slice(0, 20), count: m.length });
  }
  const count = matches.length;
  return { count, matches, score: Math.min(1, count * 0.2) };
}

// ─── 逻辑谬误检测（EMNLP 2022 Logical Fallacy Detection inspired）─────────
const FALLACY_PATTERNS = {
  zh: [
    [/因为[^，。]*?所以[^，。]*?因为/i, 'circular_reasoning'],
    [/这本身就是[^，。]*?这证明/i, 'circular_reasoning'],
    [/之所以[^，。]*?是因为[^，。]*?所以/i, 'circular_reasoning'],
    [/要么[^，。]*?要么[^，。]*?没有其他选择/i, 'false_dilemma'],
    [/不是[^，。]*?就是[^，。]*?别无选择/i, 'false_dilemma'],
    [/唯一的(选择|出路|办法)是/i, 'false_dilemma'],
    [/[专家教授名人权威]说过[^，。]*?所以/i, 'appeal_to_authority'],
    [/[专家教授名人权威]认为[^，。]*?因此/i, 'appeal_to_authority'],
    [/科学家们都说/i, 'appeal_to_authority'],
    [/你这种人[^，。]*?所以你的观点/i, 'ad_hominem'],
    [/你连[^，。]*?都不懂[^，。]*?还敢/i, 'ad_hominem'],
    [/你不配[^，。]*?讨论/i, 'ad_hominem'],
    [/你的意思就是说[^，。]*?但这显然/i, 'straw_man'],
    [/按你的逻辑[^，。]*?那岂不是/i, 'straw_man'],
    [/你以为[^，。]*?其实根本不是/i, 'straw_man'],
    [/如果[^。]*?(就会|后果)[^。]*?(最终导致|不堪设想)/i, 'slippery_slope'],
    [/一旦[^。]*?后果不堪设想/i, 'slippery_slope'],
    [/开了这个头[^。]*?以后就/i, 'slippery_slope'],
    [/想想那些[^，。]*?难道你忍心/i, 'appeal_to_emotion'],
    [/你怎么能[^，。]*?你的良心/i, 'appeal_to_emotion'],
  ],
  en: [
    [/if you[^.]*?then you must also agree/i, 'slippery_slope'],
    [/everyone (knows|agrees) that/i, 'bandwagon'],
    [/it('s| is) (obvious|clear|plain) that/i, 'appeal_to_obviousness'],
    [/you('re| are) either (with|for) us or (against|with) them/i, 'false_dilemma'],
    [/there ('s| is| are) no (other|alternative) (option|choice|way)/i, 'false_dilemma'],
    [/experts (say|agree|believe) that[^.]*?so/i, 'appeal_to_authority'],
    [/science (proves|shows|demonstrates) that/i, 'appeal_to_authority'],
    [/you (can'?t|don'?t) (understand|know|get) it[^.]*?so/i, 'ad_hominem'],
    [/if you (disagree|don'?t agree|object)[^.]*?you('re| are) (wrong|ignorant|biased)/i, 'ad_hominem'],
    [/so what you('re| are) saying is[^.]*?that('s| is) ridiculous/i, 'straw_man'],
    [/if we allow[^.]*?then (everyone|soon)[^.]*?will/i, 'slippery_slope'],
    [/think of the[^.]*?(children|future|consequences)[^.]*?how can you/i, 'appeal_to_emotion'],
    [/common sense (tells|says) us/i, 'appeal_to_common_sense'],
  ],
};

const FALLACY_SEVERITY = {
  circular_reasoning: 0.6, false_dilemma: 0.4, appeal_to_authority: 0.3,
  ad_hominem: 0.5, straw_man: 0.5, slippery_slope: 0.4, appeal_to_emotion: 0.3,
  bandwagon: 0.3, appeal_to_obviousness: 0.2, appeal_to_common_sense: 0.2,
};

function checkFallacies(text) {
  if (!text || typeof text !== 'string') return { count: 0, fallacies: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? FALLACY_PATTERNS.zh : FALLACY_PATTERNS.en;
  const fallacies = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      fallacies.push({ type, count: m.length, severity: FALLACY_SEVERITY[type] || 0.3 });
    }
  }
  const count = fallacies.length;
  return { count, fallacies, score: Math.min(1, fallacies.reduce((s, f) => s + f.severity * f.count, 0)) };
}

// ─── 信心校准检测（确定性 mismatch）─────────────────────────────────
function checkConfidenceCalibration(text) {
  if (!text || typeof text !== 'string') return { issues: [], count: 0, score: 0 };
  const issues = [];
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  if (hasChinese) {
    const certaintyCount = (text.match(/一定|绝对|肯定|毫无疑问|毋庸置疑|必然/i) || []).length;
    const hedgeCount = (text.match(/可能|也许|或许|大概|不一定|未必/i) || []).length;
    if (certaintyCount > 0 && hedgeCount > 0) {
      issues.push({ type: 'confidence_mismatch', detail: `肯定(${certaintyCount})与不确定(${hedgeCount})并存` });
    }
    const strongClaims = (text.match(/永远[^。]*?不可能|绝对[^。]*?是|百分百[^。]*?确定/i) || []).length;
    if (strongClaims > 0) issues.push({ type: 'overconfidence', detail: `过度自信(${strongClaims})`, severity: 0.3 });
  } else {
    const certaintyCount = (text.match(/\b(always|never|undoubtedly|absolutely|certainly|without (any )?doubt|definitely|unquestionably)\b/i) || []).length;
    const hedgeCount = (text.match(/\b(maybe|perhaps|possibly|maybe not|might not|could be|not necessarily)\b/i) || []).length;
    if (certaintyCount > 0 && hedgeCount > 0) {
      issues.push({ type: 'confidence_mismatch', detail: `certain(${certaintyCount}) vs uncertain(${hedgeCount}) mixed` });
    }
    const strongClaims = (text.match(/\b(always|never)\b[^.]*?\b(everyone|nobody|everything|nothing)\b/i) || []).length;
    if (strongClaims > 0) issues.push({ type: 'overconfidence', detail: `overconfident absolute(${strongClaims})` });
  }

  return { issues, count: issues.length, score: Math.min(1, issues.length * 0.35) };
}

function _checkSignals(text, signals) {
  const findings = []; let totalScore = 0;
  for (const [type, patterns] of Object.entries(signals)) {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) { findings.push({ type, count: m.length, weight: WEIGHTS[type] * m.length }); totalScore += WEIGHTS[type] * m.length; }
    }
  }
  const score = Math.min(1, totalScore);
  return { score, risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low', signals: findings, totalHits: findings.length };
}

function checkSycophancy(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (/[\u4e00-\u9fff]/.test(text)) return _checkSignals(text, ZH_SIGNALS);
  if (/[a-zA-Z]{4,}/.test(text)) return _checkSignals(text, EN_SIGNALS);
  return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
}

function checkEvidence(claim, evidence = []) {
  const issues = [];
  let score = 0.5;
  if (!claim || claim.length < 5) {
    issues.push({ type: 'claim_too_short', severity: 'medium', message: '论断过短，无法验证' });
    score -= 0.2;
  }
  if (!evidence || evidence.length === 0) {
    issues.push({ type: 'no_evidence', severity: 'high', message: '缺少支持证据' });
    score -= 0.3;
  } else {
    score += Math.min(0.3, evidence.length * 0.1);
  }
  return { score: Math.max(0, Math.min(1, score)), issues };
}

// ─── 综合辨别（6维度） ────────────────────────────────────────────
function discriminate(text, evidence = []) {
  const ev = checkEvidence(text, evidence);
  const sy = checkSycophancy(text);
  const ct = checkContradiction(text);
  const vg = checkVagueness(text);
  const fl = checkFallacies(text);
  const cc = checkConfidenceCalibration(text);

  const avg = (ev.score + (1 - sy.score) + (1 - ct.score) + (1 - vg.score) + (1 - fl.score) + (1 - cc.score)) / 6;
  const overallScore = Math.round(avg * 100) / 100;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict,
    overallScore,
    dimensions: {
      evidence: ev,
      sycophancy: sy,
      contradiction: ct,
      vagueness: vg,
      fallacies: fl,
      confidence: cc,
    },
    summary: [
      sy.totalHits > 0 ? `${sy.totalHits} 个 sycophancy 信号` : '',
      ct.count > 0 ? `${ct.count} 处矛盾` : '',
      vg.count > 0 ? `${vg.count} 处模糊表述` : '',
      fl.count > 0 ? `${fl.count} 个逻辑谬误` : '',
      cc.count > 0 ? `${cc.count} 处信心偏差` : '',
      ev.issues.length > 0 ? `${ev.issues.length} 个证据问题` : '',
    ].filter(Boolean).join('；') || '未发现明显问题',
  };
}

// ─── 引擎模式 ────────────────────────────────────────────────────

/** 启动完整引擎，返回带所有 MCP 工具的 HF 实例 */
function createEngine(dataDir) {
  try {
    const { HeartFlow } = require('./core/heartflow.js');
    const hf = new HeartFlow({ silent: true, dataDir: dataDir || require('path').join(process.cwd(), 'data') });
    hf.start();
    return hf;
  } catch (e) {
    return { error: `引擎启动失败: ${e.message}` };
  }
}

module.exports = {
  checkSycophancy,
  checkEvidence,
  checkContradiction,
  checkVagueness,
  checkFallacies,
  checkConfidenceCalibration,
  discriminate,
  createEngine,
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
